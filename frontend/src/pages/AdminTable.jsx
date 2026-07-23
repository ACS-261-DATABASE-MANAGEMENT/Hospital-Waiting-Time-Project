// frontend/src/pages/AdminTable.jsx
// Filterable/sortable admin table with status updates and CSV export

import { useState, useEffect, useCallback } from 'react';
import { fetchVisits, fetchFacilities, updateVisitStatus, getExportURL } from '../api/api';
import StatusBadge, { PaymentBadge } from '../components/StatusBadge';
import { Stars } from '../components/StarRating';

const STATUS_OPTIONS = ['', 'submitted', 'under_review', 'flagged_duplicate', 'resolved'];

export default function AdminTable() {
  const [visits,     setVisits]     = useState([]);
  const [facilities, setFacilities] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);
  const [updating,   setUpdating]   = useState(null); // visit_id being updated

  const [filters, setFilters] = useState({
    facility_id: '', date_from: '', date_to: '',
    payment_type: '', status: '', page: 1,
  });
  const [sortField, setSortField]   = useState('visit_date');
  const [sortDir,   setSortDir]     = useState('desc');

  // Load facilities for filter dropdown
  useEffect(() => {
    fetchFacilities()
      .then((r) => setFacilities(r.data))
      .catch(() => {});
  }, []);

  const loadVisits = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { ...filters, limit: 20 };
      Object.keys(params).forEach((k) => !params[k] && delete params[k]);
      const res = await fetchVisits(params);
      setVisits(res.data);
      setPagination(res.pagination);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { loadVisits(); }, [loadVisits]);

  const setFilter = (key, val) =>
    setFilters((f) => ({ ...f, [key]: val, page: 1 }));

  const handleSort = (field) => {
    if (sortField === field) setSortDir((d) => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
  };

  const sortIcon = (field) =>
    sortField === field ? (sortDir === 'asc' ? ' ↑' : ' ↓') : ' ⇅';

  // Client-side sort (backend returns sorted by date; this sorts loaded page)
  const sorted = [...visits].sort((a, b) => {
    let av = a[sortField], bv = b[sortField];
    if (typeof av === 'string') av = av.toLowerCase();
    if (typeof bv === 'string') bv = bv.toLowerCase();
    if (av < bv) return sortDir === 'asc' ? -1 : 1;
    if (av > bv) return sortDir === 'asc' ?  1 : -1;
    return 0;
  });

  const handleStatusChange = async (visitId, newStatus) => {
    setUpdating(visitId);
    try {
      await updateVisitStatus(visitId, newStatus);
      setVisits((v) =>
        v.map((visit) =>
          visit.visit_id === visitId ? { ...visit, status: newStatus } : visit
        )
      );
    } catch (err) {
      alert(`Update failed: ${err.message}`);
    } finally {
      setUpdating(null);
    }
  };

  const exportParams = {};
  if (filters.facility_id)  exportParams.facility_id  = filters.facility_id;
  if (filters.date_from)    exportParams.date_from    = filters.date_from;
  if (filters.date_to)      exportParams.date_to      = filters.date_to;
  if (filters.payment_type) exportParams.payment_type = filters.payment_type;
  if (filters.status)       exportParams.status       = filters.status;

  return (
    <div className="page animate-in">
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--gap-md)' }}>
          <div>
            <h1>🛠 Admin — Visit Reports</h1>
            <p>Review, filter, and manage all submitted patient visit reports.</p>
          </div>
          <a
            href={getExportURL(exportParams)}
            target="_blank"
            rel="noreferrer"
            className="btn btn-secondary"
            id="export-csv-btn"
          >
            📥 Export CSV
          </a>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-bar">
        <div className="filter-group">
          <label>Facility</label>
          <select
            value={filters.facility_id}
            onChange={(e) => setFilter('facility_id', e.target.value)}
          >
            <option value="">All Facilities</option>
            {facilities.map((f) => (
              <option key={f.facility_id} value={f.facility_id}>{f.name}</option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label>Payment</label>
          <select value={filters.payment_type} onChange={(e) => setFilter('payment_type', e.target.value)}>
            <option value="">All</option>
            <option value="insurance">Insurance</option>
            <option value="cash">Cash</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Status</label>
          <select value={filters.status} onChange={(e) => setFilter('status', e.target.value)}>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{s || 'All Statuses'}</option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label>Date From</label>
          <input type="date" value={filters.date_from} onChange={(e) => setFilter('date_from', e.target.value)} />
        </div>

        <div className="filter-group">
          <label>Date To</label>
          <input type="date" value={filters.date_to} onChange={(e) => setFilter('date_to', e.target.value)} />
        </div>

        <button className="btn btn-secondary btn-sm" onClick={() => setFilters({ facility_id: '', date_from: '', date_to: '', payment_type: '', status: '', page: 1 })}>
          ✕ Clear
        </button>
      </div>

      {/* Stats bar */}
      <div style={{ fontSize: '0.8rem', color: 'var(--clr-text-dim)', marginBottom: 'var(--gap-md)' }}>
        Showing {visits.length} of {pagination.total} records
        {filters.status || filters.facility_id || filters.payment_type ? ' (filtered)' : ''}
      </div>

      {/* Error */}
      {error && <div className="error-state">⚠️ {error}</div>}

      {/* Table */}
      {loading ? (
        <div className="loading-state"><div className="spinner" /><p>Loading…</p></div>
      ) : (
        <div className="table-wrapper" style={{ marginBottom: 'var(--gap-md)' }}>
          <table>
            <thead>
              <tr>
                <th onClick={() => handleSort('visit_id')}># {sortIcon('visit_id')}</th>
                <th onClick={() => handleSort('facility_name')}>Facility {sortIcon('facility_name')}</th>
                <th onClick={() => handleSort('department_name')}>Dept {sortIcon('department_name')}</th>
                <th onClick={() => handleSort('visit_date')}>Date {sortIcon('visit_date')}</th>
                <th>Day</th>
                <th onClick={() => handleSort('payment_type')}>Payment {sortIcon('payment_type')}</th>
                <th>Triage</th>
                <th>Consult</th>
                <th>Pharmacy</th>
                <th>Total</th>
                <th onClick={() => handleSort('satisfaction_rating')}>Rating {sortIcon('satisfaction_rating')}</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {sorted.length === 0 && (
                <tr><td colSpan={13} style={{ textAlign: 'center', color: 'var(--clr-text-dim)', padding: 'var(--gap-xl)' }}>No records found</td></tr>
              )}
              {sorted.map((v) => (
                <tr key={v.visit_id}>
                  <td style={{ color: 'var(--clr-text-dim)', fontSize: '0.8rem' }}>#{v.visit_id}</td>
                  <td style={{ maxWidth: 140 }}><strong>{v.facility_name}</strong></td>
                  <td style={{ color: 'var(--clr-text-dim)', fontSize: '0.82rem' }}>{v.department_name}</td>
                  <td style={{ whiteSpace: 'nowrap' }}>{v.visit_date}</td>
                  <td style={{ color: 'var(--clr-text-dim)', fontSize: '0.82rem' }}>{v.day_of_week?.trim().slice(0, 3)}</td>
                  <td><PaymentBadge type={v.payment_type} /></td>
                  <td>{v.triage_wait_mins}</td>
                  <td>{v.consultation_duration_mins}</td>
                  <td>{v.pharmacy_wait_mins}</td>
                  <td><strong style={{ color: 'var(--clr-primary)' }}>{v.total_wait_mins}</strong></td>
                  <td><Stars value={v.satisfaction_rating} /></td>
                  <td><StatusBadge status={v.status} /></td>
                  <td>
                    <select
                      value={v.status}
                      disabled={updating === v.visit_id}
                      onChange={(e) => handleStatusChange(v.visit_id, e.target.value)}
                      style={{
                        background: 'var(--clr-bg)', border: '1px solid var(--clr-border)',
                        borderRadius: 'var(--radius-sm)', color: 'var(--clr-text)',
                        fontSize: '0.78rem', padding: '3px 6px', cursor: 'pointer',
                        opacity: updating === v.visit_id ? 0.5 : 1,
                      }}
                      aria-label={`Update status for visit ${v.visit_id}`}
                    >
                      {STATUS_OPTIONS.filter(Boolean).map((s) => (
                        <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      <div className="pagination">
        <span>{pagination.total} total records</span>
        <button
          className="btn btn-secondary btn-sm"
          disabled={filters.page <= 1}
          onClick={() => setFilters((f) => ({ ...f, page: f.page - 1 }))}
        >
          ← Prev
        </button>
        <span>Page {pagination.page} of {pagination.pages}</span>
        <button
          className="btn btn-secondary btn-sm"
          disabled={filters.page >= pagination.pages}
          onClick={() => setFilters((f) => ({ ...f, page: f.page + 1 }))}
        >
          Next →
        </button>
      </div>
    </div>
  );
}
