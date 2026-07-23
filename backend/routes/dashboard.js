// backend/routes/dashboard.js
const express = require('express');
const router = express.Router();
const { getDashboardSummary, getByDepartment } = require('../controllers/dashboardController');

router.get('/summary',       getDashboardSummary);
router.get('/by-department', getByDepartment);

module.exports = router;
