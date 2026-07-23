// backend/routes/visits.js
const express = require('express');
const router = express.Router();
const { createVisit, getVisits, updateVisitStatus } = require('../controllers/visitsController');
const { visitCreateRules, statusUpdateRules, handleValidation } = require('../middleware/validate');

router.get('/',  getVisits);
router.post('/', visitCreateRules, handleValidation, createVisit);
router.patch('/:id/status', statusUpdateRules, handleValidation, updateVisitStatus);

module.exports = router;
