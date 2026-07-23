// backend/routes/facilities.js
const express = require('express');
const router = express.Router();
const { getFacilities, createFacility } = require('../controllers/facilitiesController');

router.get('/', getFacilities);
router.post('/', createFacility);

module.exports = router;
