// backend/server.js
// Express entry point for the Hospital Waiting Time Dashboard API

require('dotenv').config();
const express = require('express');
const cors    = require('cors');

const facilitiesRouter = require('./routes/facilities');
const visitsRouter     = require('./routes/visits');
const dashboardRouter  = require('./routes/dashboard');
const exportRouter     = require('./routes/export');
const errorHandler     = require('./middleware/errorHandler');

const app  = express();
const PORT = process.env.PORT || 4000;

// ── Middleware ────────────────────────────────────────────────
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());

// ── Health check ─────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), service: 'Hospital Wait Time API' });
});

// ── Routes ────────────────────────────────────────────────────
app.use('/api/facilities',        facilitiesRouter);
app.use('/api/visits',            visitsRouter);
app.use('/api/dashboard',         dashboardRouter);
app.use('/api/export',            exportRouter);

// ── 404 ───────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.path} not found` });
});

// ── Global error handler ──────────────────────────────────────
app.use(errorHandler);

// ── Start ─────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`✅ Hospital Wait Time API running on http://localhost:${PORT}`);
  console.log(`   DB: ${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`);
});

module.exports = app;
