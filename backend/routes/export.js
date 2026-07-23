// backend/routes/export.js
const express = require('express');
const router = express.Router();
const { exportCSV } = require('../controllers/exportController');

router.get('/csv', exportCSV);

module.exports = router;
