// frontend/src/components/StatusBadge.jsx
const STATUS_LABELS = {
  submitted:         'Submitted',
  under_review:      'Under Review',
  flagged_duplicate: 'Flagged Duplicate',
  resolved:          'Resolved',
};

export default function StatusBadge({ status }) {
  return (
    <span className={`badge badge-${status}`}>
      {STATUS_LABELS[status] || status}
    </span>
  );
}

export function PaymentBadge({ type }) {
  return (
    <span className={`badge badge-${type}`}>
      {type === 'insurance' ? '🏛 Insurance' : '💵 Cash'}
    </span>
  );
}
