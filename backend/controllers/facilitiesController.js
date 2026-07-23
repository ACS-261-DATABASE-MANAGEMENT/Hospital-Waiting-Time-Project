// backend/controllers/facilitiesController.js
const pool = require('../db/pool');

// GET /api/facilities — list all facilities with their departments
const getFacilities = async (req, res, next) => {
  try {
    const { rows: facilities } = await pool.query(
      `SELECT f.facility_id, f.name, f.location, f.area, f.facility_type
       FROM facilities f
       ORDER BY f.name`
    );

    const { rows: departments } = await pool.query(
      `SELECT d.department_id, d.facility_id, d.name
       FROM departments d
       ORDER BY d.facility_id, d.name`
    );

    // Nest departments under their facility
    const result = facilities.map((f) => ({
      ...f,
      departments: departments.filter((d) => d.facility_id === f.facility_id),
    }));

    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

// POST /api/facilities — create a new facility
const createFacility = async (req, res, next) => {
  try {
    const { name, location, area, facility_type, departments: depts } = req.body;

    if (!name || !location || !facility_type) {
      return res.status(400).json({ success: false, message: 'name, location, and facility_type are required' });
    }

    const validTypes = ['hospital', 'clinic', 'health_centre', 'dispensary'];
    if (!validTypes.includes(facility_type)) {
      return res.status(400).json({ success: false, message: `facility_type must be one of: ${validTypes.join(', ')}` });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const { rows } = await client.query(
        `INSERT INTO facilities (name, location, area, facility_type)
         VALUES ($1, $2, $3, $4) RETURNING *`,
        [name, location, area || 'Lukenya', facility_type]
      );
      const facility = rows[0];

      // Optionally create departments at the same time
      const createdDepts = [];
      if (Array.isArray(depts)) {
        for (const dName of depts) {
          const { rows: dr } = await client.query(
            `INSERT INTO departments (facility_id, name) VALUES ($1, $2) RETURNING *`,
            [facility.facility_id, dName]
          );
          createdDepts.push(dr[0]);
        }
      }

      await client.query('COMMIT');
      res.status(201).json({ success: true, data: { ...facility, departments: createdDepts } });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    next(err);
  }
};

module.exports = { getFacilities, createFacility };
