// backend/middleware/validate.js
// Input validation helpers using express-validator

const { body, query, param, validationResult } = require('express-validator');

// Middleware to check validation results and return 422 on failure
const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ success: false, errors: errors.array() });
  }
  next();
};

// ── Visit submission validators ──────────────────────────────
const visitCreateRules = [
  body('facility_id').isInt({ min: 1 }).withMessage('facility_id must be a positive integer'),
  body('department_id').isInt({ min: 1 }).withMessage('department_id must be a positive integer'),
  body('visit_date').isDate().withMessage('visit_date must be a valid date (YYYY-MM-DD)'),
  body('payment_type')
    .isIn(['insurance', 'cash'])
    .withMessage("payment_type must be 'insurance' or 'cash'"),
  body('arrival_time').isISO8601().withMessage('arrival_time must be a valid ISO 8601 timestamp'),
  body('consultation_called_time')
    .isISO8601()
    .withMessage('consultation_called_time must be a valid ISO 8601 timestamp')
    .custom((val, { req }) => {
      if (new Date(val) <= new Date(req.body.arrival_time))
        throw new Error('consultation_called_time must be after arrival_time');
      return true;
    }),
  body('consultation_end_time')
    .isISO8601()
    .withMessage('consultation_end_time must be a valid ISO 8601 timestamp')
    .custom((val, { req }) => {
      if (new Date(val) <= new Date(req.body.consultation_called_time))
        throw new Error('consultation_end_time must be after consultation_called_time');
      return true;
    }),
  body('medication_received_time')
    .isISO8601()
    .withMessage('medication_received_time must be a valid ISO 8601 timestamp')
    .custom((val, { req }) => {
      if (new Date(val) < new Date(req.body.consultation_end_time))
        throw new Error('medication_received_time must be >= consultation_end_time');
      return true;
    }),
  body('satisfaction_rating')
    .isInt({ min: 1, max: 5 })
    .withMessage('satisfaction_rating must be an integer between 1 and 5'),
  body('patient_token')
    .optional()
    .isLength({ max: 64 })
    .withMessage('patient_token must be at most 64 characters'),
];

// ── Status update validator ──────────────────────────────────
const statusUpdateRules = [
  param('id').isInt({ min: 1 }).withMessage('Visit ID must be a positive integer'),
  body('status')
    .isIn(['submitted', 'under_review', 'flagged_duplicate', 'resolved'])
    .withMessage('Invalid status value'),
];

module.exports = { handleValidation, visitCreateRules, statusUpdateRules };
