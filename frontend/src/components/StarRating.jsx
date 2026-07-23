// frontend/src/components/StarRating.jsx
export default function StarRating({ value, onChange, readOnly = false }) {
  return (
    <div className="star-group">
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          type="button"
          className={`star-btn${s <= value ? ' filled' : ''}`}
          onClick={() => !readOnly && onChange && onChange(s)}
          style={{ cursor: readOnly ? 'default' : 'pointer' }}
          aria-label={`${s} star${s !== 1 ? 's' : ''}`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

// Read-only inline stars for tables
export function Stars({ value }) {
  return (
    <span className="stars">
      {[1, 2, 3, 4, 5].map((s) => (
        <span key={s} className={s <= Math.round(value) ? '' : 'empty'}>★</span>
      ))}
    </span>
  );
}
