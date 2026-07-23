// backend/controllers/exportController.js
const pool = require('../db/pool');

// GET /api/export/csv  — export filtered visits as CSV
const exportCSV = async (req, res, next) => {
  try {
    const { facility_id, department_id, date_from, date_to, payment_type, status } = req.query;

    const conditions = [];
    const params = [];
    let p = 1;

    if (facility_id)   { conditions.push(`v.facility_id = $${p++}`);   params.push(facility_id); }
    if (department_id) { conditions.push(`v.department_id = $${p++}`); params.push(department_id); }
    if (date_from)     { conditions.push(`v.visit_date >= $${p++}`);   params.push(date_from); }
    if (date_to)       { conditions.push(`v.visit_date <= $${p++}`);   params.push(date_to); }
    if (payment_type)  { conditions.push(`v.payment_type = $${p++}`);  params.push(payment_type); }
    if (status)        { conditions.push(`v.status = $${p++}`);        params.push(status); }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const { rows } = await pool.query(
      `SELECT
         v.visit_id,
         f.name                    AS facility,
         d.name                    AS department,
         v.visit_date,
         TRIM(TO_CHAR(v.visit_date, 'Day'))       AS day_of_week,
         v.payment_type,
         v.arrival_time,
         v.consultation_called_time,
         v.consultation_end_time,
         v.medication_received_time,
         ROUND(EXTRACT(EPOCH FROM (v.consultation_called_time - v.arrival_time)) / 60, 1)          AS triage_wait_mins,
         ROUND(EXTRACT(EPOCH FROM (v.consultation_end_time - v.consultation_called_time)) / 60, 1) AS consult_duration_mins,
         ROUND(EXTRACT(EPOCH FROM (v.medication_received_time - v.consultation_end_time)) / 60, 1) AS pharmacy_wait_mins,
         ROUND(EXTRACT(EPOCH FROM (v.medication_received_time - v.arrival_time)) / 60, 1)          AS total_wait_mins,
         v.satisfaction_rating,
         v.status,
         v.submitted_at
       FROM visits v
       JOIN facilities  f ON f.facility_id  = v.facility_id
       JOIN departments d ON d.department_id = v.department_id
       ${where}
       ORDER BY v.visit_date DESC, v.arrival_time DESC`,
      params
    );

    if (!rows.length) {
      return res.status(404).json({ success: false, message: 'No data found for the given filters' });
    }

    // Build CSV
    const headers = Object.keys(rows[0]);
    const escape = (v) => {
      if (v === null || v === undefined) return '';
      const s = String(v).replace(/"/g, '""');
      return /[,"\n\r]/.test(s) ? `"${s}"` : s;
    };

    const csv = [
      headers.join(','),
      ...rows.map((row) => headers.map((h) => escape(row[h])).join(',')),
    ].join('\r\n');

    const filename = `hospital-wait-export-${new Date().toISOString().slice(0, 10)}.csv`;
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csv);
  } catch (err) {
    next(err);
  }
};

module.exports = { exportCSV };
