// frontend/src/api/api.js
// All API call functions used by the app

import client from './client';

// ── Facilities ────────────────────────────────────────────────
export const fetchFacilities = () => client.get('/facilities');
export const createFacility  = (data) => client.post('/facilities', data);

// ── Visits ────────────────────────────────────────────────────
export const fetchVisits = (params = {}) => client.get('/visits', { params });
export const submitVisit = (data) => client.post('/visits', data);
export const updateVisitStatus = (id, status) =>
  client.patch(`/visits/${id}/status`, { status });

// ── Dashboard ─────────────────────────────────────────────────
export const fetchDashboardSummary  = () => client.get('/dashboard/summary');
export const fetchByDepartment      = () => client.get('/dashboard/by-department');

// ── Export ────────────────────────────────────────────────────
export const getExportURL = (params = {}) => {
  const base = import.meta.env.VITE_API_BASE || 'http://localhost:4000/api';
  const qs = new URLSearchParams(params).toString();
  return `${base}/export/csv${qs ? '?' + qs : ''}`;
};
