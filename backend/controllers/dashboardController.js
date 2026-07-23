// backend/controllers/dashboardController.js
const pool = require('../db/pool');

// ── GET /api/dashboard/summary ───────────────────────────────
const getDashboardSummary = async (req, res, next) => {
  try {
    // 1. Average wait per stage per facility
    const { rows: facilityStages } = await pool.query(`
      SELECT
        f.facility_id,
        f.name                                          AS facility_name,
        f.facility_type,
        COUNT(v.visit_id)                               AS total_visits,
        ROUND(AVG(EXTRACT(EPOCH FROM (v.consultation_called_time - v.arrival_time)) / 60), 1)          AS avg_triage_mins,
        ROUND(AVG(EXTRACT(EPOCH FROM (v.consultation_end_time - v.consultation_called_time)) / 60), 1) AS avg_consult_mins,
        ROUND(AVG(EXTRACT(EPOCH FROM (v.medication_received_time - v.consultation_end_time)) / 60), 1) AS avg_pharmacy_mins,
        ROUND(AVG(EXTRACT(EPOCH FROM (v.medication_received_time - v.arrival_time)) / 60), 1)          AS avg_total_mins,
        ROUND(AVG(v.satisfaction_rating::NUMERIC), 2)  AS avg_satisfaction
      FROM visits v
      JOIN facilities f ON f.facility_id = v.facility_id
      WHERE v.status <> 'flagged_duplicate'
      GROUP BY f.facility_id, f.name, f.facility_type
      ORDER BY avg_total_mins DESC
    `);

    // 2. Average wait by day-of-week
    const { rows: byDayOfWeek } = await pool.query(`
      SELECT
        TRIM(TO_CHAR(v.visit_date, 'Day'))                              AS day_of_week,
        TO_CHAR(v.visit_date, 'ID')::INT                               AS iso_day_num,
        COUNT(*)                                                        AS visit_count,
        ROUND(AVG(EXTRACT(EPOCH FROM (v.medication_received_time - v.arrival_time)) / 60), 1) AS avg_total_mins,
        ROUND(AVG(EXTRACT(EPOCH FROM (v.consultation_called_time - v.arrival_time)) / 60), 1) AS avg_triage_mins,
        ROUND(AVG(EXTRACT(EPOCH FROM (v.medication_received_time - v.consultation_end_time)) / 60), 1) AS avg_pharmacy_mins
      FROM visits v
      WHERE v.status <> 'flagged_duplicate'
      GROUP BY TRIM(TO_CHAR(v.visit_date, 'Day')), TO_CHAR(v.visit_date, 'ID')::INT
      ORDER BY iso_day_num
    `);

    // 3. Insurance vs Cash comparison
    const { rows: byPaymentType } = await pool.query(`
      SELECT
        v.payment_type,
        COUNT(*)                                                        AS visit_count,
        ROUND(AVG(EXTRACT(EPOCH FROM (v.consultation_called_time - v.arrival_time)) / 60), 1)          AS avg_triage_mins,
        ROUND(AVG(EXTRACT(EPOCH FROM (v.consultation_end_time - v.consultation_called_time)) / 60), 1) AS avg_consult_mins,
        ROUND(AVG(EXTRACT(EPOCH FROM (v.medication_received_time - v.consultation_end_time)) / 60), 1) AS avg_pharmacy_mins,
        ROUND(AVG(EXTRACT(EPOCH FROM (v.medication_received_time - v.arrival_time)) / 60), 1)          AS avg_total_mins,
        ROUND(AVG(v.satisfaction_rating::NUMERIC), 2)                  AS avg_satisfaction
      FROM visits v
      WHERE v.status <> 'flagged_duplicate'
      GROUP BY v.payment_type
      ORDER BY v.payment_type
    `);

    // 4. Satisfaction vs total wait (for scatter correlation)
    const { rows: satisfactionCorrelation } = await pool.query(`
      SELECT
        v.satisfaction_rating,
        COUNT(*)                                                        AS visit_count,
        ROUND(AVG(EXTRACT(EPOCH FROM (v.medication_received_time - v.arrival_time)) / 60), 1) AS avg_total_mins
      FROM visits v
      WHERE v.status <> 'flagged_duplicate'
      GROUP BY v.satisfaction_rating
      ORDER BY v.satisfaction_rating
    `);

    // 5. Overall KPI numbers
    const { rows: kpi } = await pool.query(`
      SELECT
        COUNT(*)                                                        AS total_visits,
        ROUND(AVG(EXTRACT(EPOCH FROM (v.medication_received_time - v.arrival_time)) / 60), 1) AS overall_avg_wait_mins,
        ROUND(AVG(v.satisfaction_rating::NUMERIC), 2)                  AS overall_avg_satisfaction,
        COUNT(CASE WHEN v.status = 'flagged_duplicate' THEN 1 END)     AS flagged_count
      FROM visits v
    `);

    res.json({
      success: true,
      data: {
        kpi: kpi[0],
        by_facility: facilityStages,
        by_day_of_week: byDayOfWeek,
        by_payment_type: byPaymentType,
        satisfaction_correlation: satisfactionCorrelation,
      },
    });
  } catch (err) {
    next(err);
  }
};

// ── GET /api/dashboard/by-department ────────────────────────
const getByDepartment = async (req, res, next) => {
  try {
    const { rows } = await pool.query(`
      SELECT
        f.name                                                          AS facility_name,
        d.department_id,
        d.name                                                          AS department_name,
        COUNT(v.visit_id)                                               AS visit_count,
        ROUND(AVG(EXTRACT(EPOCH FROM (v.consultation_called_time - v.arrival_time)) / 60), 1)          AS avg_triage_mins,
        ROUND(AVG(EXTRACT(EPOCH FROM (v.consultation_end_time - v.consultation_called_time)) / 60), 1) AS avg_consult_mins,
        ROUND(AVG(EXTRACT(EPOCH FROM (v.medication_received_time - v.consultation_end_time)) / 60), 1) AS avg_pharmacy_mins,
        ROUND(AVG(EXTRACT(EPOCH FROM (v.medication_received_time - v.arrival_time)) / 60), 1)          AS avg_total_mins,
        ROUND(AVG(v.satisfaction_rating::NUMERIC), 2)                  AS avg_satisfaction
      FROM visits v
      JOIN facilities  f ON f.facility_id  = v.facility_id
      JOIN departments d ON d.department_id = v.department_id
      WHERE v.status <> 'flagged_duplicate'
      GROUP BY f.facility_id, f.name, d.department_id, d.name
      ORDER BY f.name, avg_total_mins DESC
    `);

    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
};

module.exports = { getDashboardSummary, getByDepartment };
