// backend/controllers/visitsController.js
const { createHash } = require('crypto');
const pool = require('../db/pool');

// ── Helper: compute wait stats from timestamps ───────────────
function computeWaitStats(arrival, called, endConsult, medication) {
  const toMins = (a, b) => Math.round(((new Date(b) - new Date(a)) / 60000) * 10) / 10;
  return {
    triage_wait_mins:          toMins(arrival, called),
    consultation_duration_mins: toMins(called, endConsult),
    pharmacy_wait_mins:        toMins(endConsult, medication),
    total_wait_mins:           toMins(arrival, medication),
  };
}

// ── POST /api/visits ─────────────────────────────────────────
const createVisit = async (req, res, next) => {
  try {
    const {
      facility_id, department_id, visit_date, payment_type,
      arrival_time, consultation_called_time, consultation_end_time,
      medication_received_time, satisfaction_rating, patient_token: rawToken,
    } = req.body;

    // Generate anonymous token if not provided
    const patient_token = rawToken
      ? createHash('sha256').update(rawToken).digest('hex').slice(0, 64)
      : createHash('sha256').update(`${Date.now()}-${Math.random()}`).digest('hex').slice(0, 64);

    const { rows } = await pool.query(
      `INSERT INTO visits (
         facility_id, department_id, patient_token, visit_date,
         payment_type, arrival_time, consultation_called_time,
         consultation_end_time, medication_received_time, satisfaction_rating
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       RETURNING *`,
      [
        facility_id, department_id, patient_token, visit_date,
        payment_type, arrival_time, consultation_called_time,
        consultation_end_time, medication_received_time, satisfaction_rating,
      ]
    );

    const visit = rows[0];
    const waitStats = computeWaitStats(
      visit.arrival_time,
      visit.consultation_called_time,
      visit.consultation_end_time,
      visit.medication_received_time
    );

    res.status(201).json({
      success: true,
      data: { ...visit, computed_wait_stats: waitStats },
    });
  } catch (err) {
    // Handle DB check constraint violations gracefully
    if (err.code === '23514') {
      return res.status(400).json({
        success: false,
        message: 'Time ordering constraint violated: ensure all timestamps are in chronological order and arrival_time matches visit_date.',
      });
    }
    next(err);
  }
};

// ── GET /api/visits ──────────────────────────────────────────
const getVisits = async (req, res, next) => {
  try {
    const { facility_id, department_id, date_from, date_to, payment_type, status, page = 1, limit = 50 } = req.query;

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
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { rows: visits } = await pool.query(
      `SELECT v.*, f.name AS facility_name, d.name AS department_name,
              ROUND(EXTRACT(EPOCH FROM (v.consultation_called_time - v.arrival_time)) / 60, 1) AS triage_wait_mins,
              ROUND(EXTRACT(EPOCH FROM (v.consultation_end_time - v.consultation_called_time)) / 60, 1) AS consultation_duration_mins,
              ROUND(EXTRACT(EPOCH FROM (v.medication_received_time - v.consultation_end_time)) / 60, 1) AS pharmacy_wait_mins,
              ROUND(EXTRACT(EPOCH FROM (v.medication_received_time - v.arrival_time)) / 60, 1) AS total_wait_mins
       FROM visits v
       JOIN facilities f  ON f.facility_id  = v.facility_id
       JOIN departments d ON d.department_id = v.department_id
       ${where}
       ORDER BY v.visit_date DESC, v.submitted_at DESC
       LIMIT $${p++} OFFSET $${p++}`,
      [...params, limit, offset]
    );

    const { rows: countRows } = await pool.query(
      `SELECT COUNT(*) FROM visits v ${where}`,
      params
    );

    res.json({
      success: true,
      data: visits,
      pagination: {
        total: parseInt(countRows[0].count),
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(countRows[0].count / limit),
      },
    });
  } catch (err) {
    next(err);
  }
};

// ── PATCH /api/visits/:id/status ────────────────────────────
const updateVisitStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const { rows } = await pool.query(
      `UPDATE visits SET status = $1 WHERE visit_id = $2 RETURNING *`,
      [status, id]
    );

    if (!rows.length) {
      return res.status(404).json({ success: false, message: 'Visit not found' });
    }

    res.json({ success: true, data: rows[0] });
  } catch (err) {
    next(err);
  }
};

module.exports = { createVisit, getVisits, updateVisitStatus };
