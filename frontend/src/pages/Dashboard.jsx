// frontend/src/pages/Dashboard.jsx
// Analytics dashboard with Recharts

import { useState, useEffect } from 'react';
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, Cell,
} from 'recharts';
import { fetchDashboardSummary, fetchByDepartment } from '../api/api';
import { Stars } from '../components/StarRating';

const COLORS = ['#3b82f6', '#06b6d4', '#a855f7', '#f59e0b', '#22c55e'];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: '#1c2230', border: '1px solid #30363d',
      borderRadius: 8, padding: '10px 14px', fontSize: '0.8rem',
    }}>
      <p style={{ color: '#e6edf3', fontWeight: 700, marginBottom: 6 }}>{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color, marginBottom: 2 }}>
          {p.name}: <strong>{p.value} min</strong>
        </p>
      ))}
    </div>
  );
};

function RankBadge({ rank }) {
  const cls = rank === 1 ? 'gold' : rank === 2 ? 'silver' : rank === 3 ? 'bronze' : 'other';
  return <span className={`rank-badge ${cls}`}>{rank}</span>;
}

export default function Dashboard() {
  const [summary,     setSummary]     = useState(null);
  const [byDept,      setByDept]      = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState(null);

  useEffect(() => {
    Promise.all([fetchDashboardSummary(), fetchByDepartment()])
      .then(([s, d]) => {
        setSummary(s.data);
        setByDept(d.data);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="page"><div className="loading-state"><div className="spinner" /><p>Loading dashboard…</p></div></div>
  );
  if (error) return (
    <div className="page"><div className="error-state">⚠️ {error}<br /><small>Is the backend running on port 4000?</small></div></div>
  );

  const { kpi, by_facility, by_day_of_week, by_payment_type, satisfaction_correlation } = summary;

  // Shorten facility names for charts
  const shortenName = (n) => n.replace('Hospital', 'Hosp.').replace('Health Centre', 'HC').replace('Community Dispensary', 'Disp.').replace('Medical Clinic', 'Clinic').replace(' Sub-County', '');

  const facilityChartData = by_facility.map((f) => ({
    name: shortenName(f.facility_name),
    'Triage': +f.avg_triage_mins,
    'Consultation': +f.avg_consult_mins,
    'Pharmacy': +f.avg_pharmacy_mins,
    'Total': +f.avg_total_mins,
  }));

  const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const dayData = [...by_day_of_week].sort(
    (a, b) => dayOrder.indexOf(a.day_of_week) - dayOrder.indexOf(b.day_of_week)
  ).map((d) => ({
    day: d.day_of_week.slice(0, 3),
    'Avg Wait': +d.avg_total_mins,
    visits: +d.visit_count,
  }));

  const paymentData = by_payment_type.map((p) => ({
    name: p.payment_type === 'insurance' ? 'Insurance' : 'Cash',
    Triage: +p.avg_triage_mins,
    Consultation: +p.avg_consult_mins,
    Pharmacy: +p.avg_pharmacy_mins,
    Total: +p.avg_total_mins,
  }));

  return (
    <div className="page animate-in">
      <div className="page-header">
        <h1>📊 Waiting Time Dashboard</h1>
        <p>Real-time analytics from citizen-submitted wait time reports across Lukenya-area facilities.</p>
      </div>

      {/* KPI Cards */}
      <div className="kpi-grid">
        <div className="kpi-card blue">
          <div className="label">Total Reports</div>
          <div className="value">{Number(kpi.total_visits).toLocaleString()}</div>
          <div className="sub">All time submissions</div>
        </div>
        <div className="kpi-card cyan">
          <div className="label">Avg Total Wait</div>
          <div className="value">{kpi.overall_avg_wait_mins}<span style={{ fontSize: '0.9rem' }}> min</span></div>
          <div className="sub">Across all facilities</div>
        </div>
        <div className="kpi-card green">
          <div className="label">Avg Satisfaction</div>
          <div className="value">{kpi.overall_avg_satisfaction}<span style={{ fontSize: '0.9rem' }}>/5</span></div>
          <div className="sub">Patient-reported</div>
        </div>
        <div className="kpi-card orange">
          <div className="label">Flagged Reports</div>
          <div className="value">{kpi.flagged_count}</div>
          <div className="sub">Pending review</div>
        </div>
        <div className="kpi-card" style={{ background: 'var(--clr-surface)' }}>
          <div className="label">Facilities Tracked</div>
          <div className="value" style={{ color: 'var(--clr-purple)' }}>{by_facility.length}</div>
          <div className="sub">Active submissions</div>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="charts-grid">
        {/* Average total wait per facility */}
        <div className="chart-card">
          <h3>🏥 Average Total Wait by Facility</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={facilityChartData} margin={{ top: 4, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#30363d" />
              <XAxis dataKey="name" tick={{ fill: '#8b949e', fontSize: 11 }} />
              <YAxis tick={{ fill: '#8b949e', fontSize: 11 }} unit=" min" />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="Total" radius={[4, 4, 0, 0]}>
                {facilityChartData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Stacked wait by stage per facility */}
        <div className="chart-card">
          <h3>📋 Wait by Stage per Facility</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={facilityChartData} margin={{ top: 4, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#30363d" />
              <XAxis dataKey="name" tick={{ fill: '#8b949e', fontSize: 11 }} />
              <YAxis tick={{ fill: '#8b949e', fontSize: 11 }} unit=" min" />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12, color: '#8b949e' }} />
              <Bar dataKey="Triage"       stackId="a" fill="#3b82f6" radius={[0,0,0,0]} />
              <Bar dataKey="Consultation" stackId="a" fill="#06b6d4" radius={[0,0,0,0]} />
              <Bar dataKey="Pharmacy"     stackId="a" fill="#a855f7" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Average wait by day of week */}
        <div className="chart-card">
          <h3>📅 Avg Wait by Day of Week</h3>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={dayData} margin={{ top: 4, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#30363d" />
              <XAxis dataKey="day" tick={{ fill: '#8b949e', fontSize: 12 }} />
              <YAxis tick={{ fill: '#8b949e', fontSize: 11 }} unit=" min" />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="Avg Wait"
                stroke="#3b82f6"
                strokeWidth={3}
                dot={{ fill: '#3b82f6', r: 5 }}
                activeDot={{ r: 8, fill: '#06b6d4' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Insurance vs Cash */}
        <div className="chart-card">
          <h3>💳 Insurance vs Cash Wait Comparison</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={paymentData} margin={{ top: 4, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#30363d" />
              <XAxis dataKey="name" tick={{ fill: '#8b949e', fontSize: 13 }} />
              <YAxis tick={{ fill: '#8b949e', fontSize: 11 }} unit=" min" />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12, color: '#8b949e' }} />
              <Bar dataKey="Triage"       fill="#3b82f6" radius={[0,0,0,0]} />
              <Bar dataKey="Consultation" fill="#06b6d4" radius={[0,0,0,0]} />
              <Bar dataKey="Pharmacy"     fill="#a855f7" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Satisfaction vs Wait correlation */}
      <div className="charts-grid" style={{ gridTemplateColumns: '1fr' }}>
        <div className="chart-card">
          <h3>⭐ Satisfaction vs Average Wait Time</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={satisfaction_correlation} margin={{ top: 4, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#30363d" />
              <XAxis dataKey="satisfaction_rating" tick={{ fill: '#8b949e', fontSize: 12 }}
                label={{ value: 'Rating (1-5)', position: 'insideBottom', offset: -2, fill: '#8b949e', fontSize: 11 }} />
              <YAxis tick={{ fill: '#8b949e', fontSize: 11 }} unit=" min" />
              <Tooltip
                formatter={(v, n) => [`${v} min`, 'Avg Total Wait']}
                contentStyle={{ background: '#1c2230', border: '1px solid #30363d', borderRadius: 8, fontSize: '0.8rem' }}
              />
              <Bar dataKey="avg_total_mins" name="Avg Wait" radius={[4, 4, 0, 0]}>
                {satisfaction_correlation.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Facility Ranking Table */}
      <div className="card" style={{ marginBottom: 'var(--gap-xl)' }}>
        <h3 style={{ marginBottom: 'var(--gap-md)' }}>🏆 Facility Rankings — Longest Average Wait</h3>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Rank</th>
                <th>Facility</th>
                <th>Type</th>
                <th>Visits</th>
                <th>Triage (min)</th>
                <th>Consult (min)</th>
                <th>Pharmacy (min)</th>
                <th>Total (min)</th>
                <th>Satisfaction</th>
              </tr>
            </thead>
            <tbody>
              {by_facility.map((f, i) => (
                <tr key={f.facility_id}>
                  <td><RankBadge rank={i + 1} /></td>
                  <td><strong>{f.facility_name}</strong></td>
                  <td><span className="badge badge-submitted" style={{ textTransform: 'capitalize' }}>{f.facility_type}</span></td>
                  <td>{f.total_visits}</td>
                  <td>{f.avg_triage_mins}</td>
                  <td>{f.avg_consult_mins}</td>
                  <td>{f.avg_pharmacy_mins}</td>
                  <td><strong style={{ color: 'var(--clr-primary)' }}>{f.avg_total_mins}</strong></td>
                  <td><Stars value={f.avg_satisfaction} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* By Department */}
      <div className="card">
        <h3 style={{ marginBottom: 'var(--gap-md)' }}>🏛 Wait Times by Department</h3>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Facility</th>
                <th>Department</th>
                <th>Visits</th>
                <th>Triage (min)</th>
                <th>Consult (min)</th>
                <th>Pharmacy (min)</th>
                <th>Total (min)</th>
                <th>Satisfaction</th>
              </tr>
            </thead>
            <tbody>
              {byDept.map((d) => (
                <tr key={d.department_id}>
                  <td style={{ color: 'var(--clr-text-dim)' }}>{d.facility_name}</td>
                  <td><strong>{d.department_name}</strong></td>
                  <td>{d.visit_count}</td>
                  <td>{d.avg_triage_mins}</td>
                  <td>{d.avg_consult_mins}</td>
                  <td>{d.avg_pharmacy_mins}</td>
                  <td><strong style={{ color: 'var(--clr-accent)' }}>{d.avg_total_mins}</strong></td>
                  <td><Stars value={d.avg_satisfaction} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
