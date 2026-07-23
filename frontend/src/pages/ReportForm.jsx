// frontend/src/pages/ReportForm.jsx
// Patient-facing visit report submission form

import { useState, useEffect } from 'react';
import { fetchFacilities, submitVisit } from '../api/api';
import StarRating from '../components/StarRating';

const EMPTY_FORM = {
  facility_id: '',
  department_id: '',
  visit_date: new Date().toISOString().slice(0, 10),
  payment_type: 'cash',
  arrival_time: '',
  consultation_called_time: '',
  consultation_end_time: '',
  medication_received_time: '',
  satisfaction_rating: 0,
};

function toISO(dateStr, timeStr) {
  if (!dateStr || !timeStr) return '';
  return `${dateStr}T${timeStr}:00+03:00`; // EAT = UTC+3
}

function minsLabel(mins) {
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h}h ${m}m`;
}

export default function ReportForm() {
  const [form, setForm]           = useState(EMPTY_FORM);
  const [facilities, setFacilities] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]         = useState(null);
  const [result, setResult]       = useState(null);

  // Time values stored separately (HH:MM string) for <input type="time">
  const [times, setTimes] = useState({
    arrival: '', called: '', end: '', medication: '',
  });

  useEffect(() => {
    fetchFacilities()
      .then((res) => setFacilities(res.data))
      .catch(() => setError('Failed to load facilities'))
      .finally(() => setLoading(false));
  }, []);

  // Update departments when facility changes
  useEffect(() => {
    if (!form.facility_id) { setDepartments([]); return; }
    const fac = facilities.find((f) => f.facility_id === parseInt(form.facility_id));
    setDepartments(fac?.departments || []);
    setForm((f) => ({ ...f, department_id: '' }));
  }, [form.facility_id, facilities]);

  const set = (field, val) => setForm((f) => ({ ...f, [field]: val }));

  const handleTimeChange = (key, val) => {
    setTimes((t) => ({ ...t, [key]: val }));
  };

  const validate = () => {
    if (!form.facility_id)    return 'Please select a facility.';
    if (!form.department_id)  return 'Please select a department.';
    if (!form.visit_date)     return 'Please enter visit date.';
    if (!times.arrival)       return 'Please enter your arrival time.';
    if (!times.called)        return 'Please enter consultation call time.';
    if (!times.end)           return 'Please enter consultation end time.';
    if (!times.medication)    return 'Please enter medication received time.';
    if (form.satisfaction_rating === 0) return 'Please provide a satisfaction rating.';
    if (times.called <= times.arrival)  return 'Consultation call must be after arrival.';
    if (times.end   <= times.called)    return 'Consultation end must be after call time.';
    if (times.medication < times.end)   return 'Medication time must be after consultation end.';
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const validationError = validate();
    if (validationError) { setError(validationError); return; }

    setSubmitting(true);
    try {
      const payload = {
        ...form,
        facility_id:              parseInt(form.facility_id),
        department_id:            parseInt(form.department_id),
        satisfaction_rating:      parseInt(form.satisfaction_rating),
        arrival_time:             toISO(form.visit_date, times.arrival),
        consultation_called_time: toISO(form.visit_date, times.called),
        consultation_end_time:    toISO(form.visit_date, times.end),
        medication_received_time: toISO(form.visit_date, times.medication),
      };
      const res = await submitVisit(payload);
      setResult(res.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setTimes({ arrival: '', called: '', end: '', medication: '' });
    setResult(null);
    setError(null);
  };

  if (loading) {
    return (
      <div className="page">
        <div className="loading-state"><div className="spinner" /><p>Loading facilities…</p></div>
      </div>
    );
  }

  if (result) {
    const w = result.computed_wait_stats;
    return (
      <div className="page animate-in">
        <div className="success-box" style={{ maxWidth: 640, margin: '0 auto' }}>
          <div style={{ fontSize: '3rem', marginBottom: 'var(--gap-md)' }}>✅</div>
          <h2>Report Submitted!</h2>
          <p style={{ color: 'var(--clr-text)', marginBottom: 'var(--gap-lg)' }}>
            Thank you for contributing to the Lukenya Area health data. Your report helps improve services.
          </p>
          <div className="wait-stats">
            <div className="wait-stat">
              <div className="stat-val">{minsLabel(w.triage_wait_mins)}</div>
              <div className="stat-lbl">Triage Wait</div>
            </div>
            <div className="wait-stat">
              <div className="stat-val">{minsLabel(w.consultation_duration_mins)}</div>
              <div className="stat-lbl">Consultation</div>
            </div>
            <div className="wait-stat">
              <div className="stat-val">{minsLabel(w.pharmacy_wait_mins)}</div>
              <div className="stat-lbl">Pharmacy</div>
            </div>
            <div className="wait-stat">
              <div className="stat-val" style={{ color: 'var(--clr-accent)' }}>{minsLabel(w.total_wait_mins)}</div>
              <div className="stat-lbl">Total Wait</div>
            </div>
          </div>
          {result.status === 'flagged_duplicate' && (
            <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 'var(--radius-sm)', padding: 'var(--gap-md)', color: '#f87171', fontSize: '0.85rem', marginBottom: 'var(--gap-md)' }}>
              ⚠️ This report was flagged as a potential duplicate and will be reviewed.
            </div>
          )}
          <button className="btn btn-primary" onClick={resetForm}>Submit Another Report</button>
        </div>
      </div>
    );
  }

  const selectedFac = facilities.find((f) => f.facility_id === parseInt(form.facility_id));

  return (
    <div className="page animate-in">
      <div className="page-header" style={{ textAlign: 'center', marginBottom: 'var(--gap-xl)' }}>
        <h1>Submit a Visit Report</h1>
        <p>Help improve healthcare in the Lukenya area by sharing your wait time experience.</p>
        <p style={{ color: 'var(--clr-text-muted)', fontSize: '0.8rem', marginTop: 4 }}>
          Your report is anonymous — no personal information is stored.
        </p>
      </div>

      <form className="form-card" onSubmit={handleSubmit} noValidate>
        {/* Facility & Department */}
        <div className="form-section" style={{ marginTop: 0, paddingTop: 0, borderTop: 'none' }}>
          <h3>📍 Where did you visit?</h3>
        </div>
        <div className="form-grid">
          <div className="form-group">
            <label htmlFor="facility">Facility</label>
            <select
              id="facility"
              value={form.facility_id}
              onChange={(e) => set('facility_id', e.target.value)}
            >
              <option value="">— Select facility —</option>
              {facilities.map((f) => (
                <option key={f.facility_id} value={f.facility_id}>
                  {f.name}
                </option>
              ))}
            </select>
            {selectedFac && (
              <span style={{ fontSize: '0.75rem', color: 'var(--clr-text-dim)' }}>
                📍 {selectedFac.location} · {selectedFac.facility_type}
              </span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="department">Department</label>
            <select
              id="department"
              value={form.department_id}
              onChange={(e) => set('department_id', e.target.value)}
              disabled={!departments.length}
            >
              <option value="">— Select department —</option>
              {departments.map((d) => (
                <option key={d.department_id} value={d.department_id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="visit_date">Visit Date</label>
            <input
              id="visit_date"
              type="date"
              value={form.visit_date}
              max={new Date().toISOString().slice(0, 10)}
              onChange={(e) => set('visit_date', e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Payment Method</label>
            <div className="radio-group">
              {['insurance', 'cash'].map((pt) => (
                <label
                  key={pt}
                  className={`radio-label${form.payment_type === pt ? ' selected' : ''}`}
                >
                  <input
                    type="radio"
                    name="payment_type"
                    value={pt}
                    checked={form.payment_type === pt}
                    onChange={() => set('payment_type', pt)}
                  />
                  {pt === 'insurance' ? '🏛 Insurance' : '💵 Cash'}
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Time pickers */}
        <div className="form-section">
          <h3>⏱️ When did each stage happen?</h3>
        </div>
        <div className="form-grid">
          <div className="form-group">
            <label htmlFor="arrival_time">Arrival Time</label>
            <input
              id="arrival_time"
              type="time"
              value={times.arrival}
              onChange={(e) => handleTimeChange('arrival', e.target.value)}
            />
          </div>
          <div className="form-group">
            <label htmlFor="called_time">Called for Consultation</label>
            <input
              id="called_time"
              type="time"
              value={times.called}
              onChange={(e) => handleTimeChange('called', e.target.value)}
            />
          </div>
          <div className="form-group">
            <label htmlFor="end_time">Consultation Ended</label>
            <input
              id="end_time"
              type="time"
              value={times.end}
              onChange={(e) => handleTimeChange('end', e.target.value)}
            />
          </div>
          <div className="form-group">
            <label htmlFor="medication_time">Medication Received</label>
            <input
              id="medication_time"
              type="time"
              value={times.medication}
              onChange={(e) => handleTimeChange('medication', e.target.value)}
            />
          </div>
        </div>

        {/* Live wait preview */}
        {times.arrival && times.medication && times.medication > times.arrival && (
          <div style={{
            background: 'rgba(59,130,246,0.08)',
            border: '1px solid rgba(59,130,246,0.2)',
            borderRadius: 'var(--radius-md)',
            padding: 'var(--gap-md)',
            marginTop: 'var(--gap-md)',
            display: 'flex', gap: 'var(--gap-lg)', flexWrap: 'wrap',
            fontSize: '0.85rem',
          }}>
            <span>⏱ <strong>Triage:</strong> {times.called && times.arrival ? `${Math.round((new Date(`1970-01-01T${times.called}`) - new Date(`1970-01-01T${times.arrival}`)) / 60000)} min` : '—'}</span>
            <span>🩺 <strong>Consult:</strong> {times.end && times.called ? `${Math.round((new Date(`1970-01-01T${times.end}`) - new Date(`1970-01-01T${times.called}`)) / 60000)} min` : '—'}</span>
            <span>💊 <strong>Pharmacy:</strong> {times.medication && times.end ? `${Math.round((new Date(`1970-01-01T${times.medication}`) - new Date(`1970-01-01T${times.end}`)) / 60000)} min` : '—'}</span>
            <span style={{ color: 'var(--clr-accent)' }}>📊 <strong>Total:</strong> {`${Math.round((new Date(`1970-01-01T${times.medication}`) - new Date(`1970-01-01T${times.arrival}`)) / 60000)} min`}</span>
          </div>
        )}

        {/* Satisfaction */}
        <div className="form-section">
          <h3>⭐ How satisfied were you?</h3>
        </div>
        <div className="form-group">
          <label>Overall Satisfaction (1 = very poor, 5 = excellent)</label>
          <StarRating
            value={form.satisfaction_rating}
            onChange={(v) => set('satisfaction_rating', v)}
          />
        </div>

        {/* Error */}
        {error && (
          <div className="error-state" style={{ marginTop: 'var(--gap-md)' }}>
            ⚠️ {error}
          </div>
        )}

        {/* Submit */}
        <button
          id="submit-report-btn"
          type="submit"
          className="btn btn-primary btn-full"
          style={{ marginTop: 'var(--gap-xl)' }}
          disabled={submitting}
        >
          {submitting ? '⏳ Submitting…' : '📤 Submit Report'}
        </button>
      </form>
    </div>
  );
}
