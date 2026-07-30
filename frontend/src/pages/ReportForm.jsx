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
  medication_status: 'received',
  medication_name: '',
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

export default function ReportForm({ theme, onToggleTheme }) {
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
    if (form.medication_status === 'received') {
      if (!form.medication_name) return 'Please specify the medication received.';
      if (!times.medication)     return 'Please enter medication received time.';
      if (times.medication < times.end) return 'Medication time must be after consultation end.';
    }
    if (form.satisfaction_rating === 0) return 'Please provide a satisfaction rating.';
    if (times.called <= times.arrival)  return 'Consultation call must be after arrival.';
    if (times.end   <= times.called)    return 'Consultation end must be after call time.';
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const validationError = validate();
    if (validationError) { setError(validationError); return; }

    setSubmitting(true);
    try {
      const medicationReceivedTime = form.medication_status === 'received'
        ? toISO(form.visit_date, times.medication)
        : toISO(form.visit_date, times.end);

      const payload = {
        ...form,
        facility_id:              parseInt(form.facility_id),
        department_id:            parseInt(form.department_id),
        satisfaction_rating:      parseInt(form.satisfaction_rating),
        arrival_time:             toISO(form.visit_date, times.arrival),
        consultation_called_time: toISO(form.visit_date, times.called),
        consultation_end_time:    toISO(form.visit_date, times.end),
        medication_received_time: medicationReceivedTime,
        medication_status:        form.medication_status,
        medication_name:          form.medication_status === 'received' ? form.medication_name : 'Not given',
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
      <div className="page-header" style={{ textAlign: 'center', maxWidth: '640px', margin: '0 auto var(--gap-2xl)' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '72px', height: '72px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--clr-primary), var(--clr-accent))', color: '#fff', fontSize: '2.2rem', marginBottom: 'var(--gap-md)', boxShadow: '0 8px 20px rgba(37,99,235,0.3)' }}>📝</div>
        <h1 style={{ fontSize: '2.8rem', marginBottom: 'var(--gap-sm)', letterSpacing: '-0.02em' }}>Submit Visit Report</h1>
        <p style={{ fontSize: '1.15rem', color: 'var(--clr-text-dim)' }}>Help improve healthcare in the Lukenya area by tracking your wait time.</p>
        <p style={{ display: 'inline-block', padding: '6px 16px', background: 'rgba(34,197,94,0.1)', color: 'var(--clr-success)', borderRadius: '99px', fontSize: '0.85rem', fontWeight: '700', marginTop: 'var(--gap-md)' }}>
          🔒 Anonymous submission
        </p>
      </div>

      <form className="form-card" onSubmit={handleSubmit} noValidate>
        {/* Facility & Department */}
        <div className="form-section flex-header" style={{ marginTop: 0, paddingTop: 0, borderTop: 'none' }}>
          <div className="section-icon blue">📍</div>
          <div className="section-title">
            <h3>Facility Details</h3>
            <p className="section-desc">Where are you receiving care today?</p>
          </div>
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
        <div className="form-section flex-header" style={{ marginTop: 'var(--gap-xl)' }}>
          <div className="section-icon purple">⏱️</div>
          <div className="section-title">
            <h3>Time Log</h3>
            <p className="section-desc">When did each stage of your visit happen?</p>
          </div>
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
          <div className="form-group full">
            <label>Medication Status</label>
            <div className="radio-group">
              <label className={`radio-label${form.medication_status === 'received' ? ' selected' : ''}`}>
                <input
                  type="radio"
                  name="medication_status"
                  value="received"
                  checked={form.medication_status === 'received'}
                  onChange={() => set('medication_status', 'received')}
                />
                Medication received
              </label>
              <label className={`radio-label${form.medication_status === 'not_given' ? ' selected' : ''}`}>
                <input
                  type="radio"
                  name="medication_status"
                  value="not_given"
                  checked={form.medication_status === 'not_given'}
                  onChange={() => set('medication_status', 'not_given')}
                />
                No medication given
              </label>
            </div>
          </div>
          {form.medication_status === 'received' ? (
            <>
              <div className="form-group full">
                <label htmlFor="medication_name">Medication Given</label>
                <input
                  id="medication_name"
                  type="text"
                  placeholder="E.g. Paracetamol, Amoxicillin"
                  value={form.medication_name}
                  onChange={(e) => set('medication_name', e.target.value)}
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
            </>
          ) : (
            <div className="form-group full" style={{ color: 'var(--clr-text-dim)', fontSize: '0.95rem' }}>
              <label>No medication was given during this visit.</label>
              <p style={{ margin: 0 }}>The report will record consultation end time as the final step.</p>
            </div>
          )}
        </div>

        {/* Live wait preview */}
        {(times.arrival && times.end && form.medication_status === 'received' && times.medication && times.medication > times.arrival) && (
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
        {(times.arrival && times.end && form.medication_status === 'not_given') && (
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
            <span>💊 <strong>Pharmacy:</strong> 0 min</span>
            <span style={{ color: 'var(--clr-accent)' }}>📊 <strong>Total:</strong> {`${Math.round((new Date(`1970-01-01T${times.end}`) - new Date(`1970-01-01T${times.arrival}`)) / 60000)} min`}</span>
          </div>
        )}

        {/* Satisfaction */}
        <div className="form-section flex-header" style={{ marginTop: 'var(--gap-lg)' }}>
          <div className="section-icon orange">⭐</div>
          <div className="section-title">
            <h3>Overall Experience</h3>
            <p className="section-desc">How satisfied were you with the service speed?</p>
          </div>
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
