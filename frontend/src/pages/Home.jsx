// frontend/src/pages/Home.jsx
import { Link } from 'react-router-dom';

const features = [
  {
    icon: '📋',
    title: 'Submit a Report',
    desc: 'Record your visit timestamps anonymously and help build a better picture of wait times across Lukenya facilities.',
    path: '/report',
    cta: 'Start Reporting',
    color: 'var(--clr-primary)',
  },
  {
    icon: '📊',
    title: 'Live Dashboard',
    desc: 'Explore aggregated wait time analytics broken down by facility, department, day of week, and payment type.',
    path: '/dashboard',
    cta: 'View Dashboard',
    color: 'var(--clr-accent)',
  },
  {
    icon: '🛠',
    title: 'Admin Console',
    desc: 'Review all submissions, spot duplicate reports, update statuses, and export data for further analysis.',
    path: '/admin',
    cta: 'Open Admin',
    color: 'var(--clr-purple)',
  },
];

export default function Home() {
  return (
    <div className="page animate-in">
      {/* Hero */}
      <div style={{
        textAlign: 'center',
        padding: 'var(--gap-2xl) 0 var(--gap-xl)',
        maxWidth: 720,
        margin: '0 auto',
      }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 'var(--gap-sm)',
          background: 'rgba(59,130,246,0.1)',
          border: '1px solid rgba(59,130,246,0.3)',
          borderRadius: 99,
          padding: '4px 16px',
          fontSize: '0.78rem',
          fontWeight: 700,
          color: 'var(--clr-primary)',
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          marginBottom: 'var(--gap-lg)',
        }}>
          🇰🇪 Lukenya Area · ACS-261 CGD Project
        </div>
        <h1 style={{ fontSize: '2.8rem', lineHeight: 1.15, marginBottom: 'var(--gap-md)' }}>
          Hospital Wait Time<br />
          <span style={{
            background: 'linear-gradient(90deg, var(--clr-primary), var(--clr-accent))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            Transparency Platform
          </span>
        </h1>
        <p style={{ fontSize: '1rem', maxWidth: 540, margin: '0 auto var(--gap-xl)' }}>
          A citizen-generated data system for tracking and analysing patient wait times at
          Lukenya, Athi River, Mlolongo, Mavoko, and Katani health facilities.
        </p>
        <div style={{ display: 'flex', gap: 'var(--gap-md)', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/report" className="btn btn-primary" id="hero-report-btn" style={{ fontSize: '0.95rem', padding: '10px 28px' }}>
            📋 Submit a Report
          </Link>
          <Link to="/dashboard" className="btn btn-secondary" id="hero-dashboard-btn" style={{ fontSize: '0.95rem', padding: '10px 28px' }}>
            📊 View Dashboard
          </Link>
        </div>
      </div>

      {/* Feature cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: 'var(--gap-lg)',
        marginTop: 'var(--gap-2xl)',
      }}>
        {features.map((f) => (
          <div key={f.path} className="card" style={{ textAlign: 'center', cursor: 'default' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: 'var(--gap-md)' }}>{f.icon}</div>
            <h3 style={{ marginBottom: 'var(--gap-sm)', color: f.color }}>{f.title}</h3>
            <p style={{ marginBottom: 'var(--gap-lg)', fontSize: '0.875rem' }}>{f.desc}</p>
            <Link to={f.path} className="btn btn-secondary" style={{ borderColor: f.color, color: f.color }}>
              {f.cta} →
            </Link>
          </div>
        ))}
      </div>

      {/* Stats strip */}
      <div style={{
        display: 'flex', flexWrap: 'wrap', gap: 'var(--gap-lg)',
        justifyContent: 'center', marginTop: 'var(--gap-2xl)',
        paddingTop: 'var(--gap-xl)',
        borderTop: '1px solid var(--clr-border)',
      }}>
        {[
          ['5', 'Health Facilities'],
          ['11', 'Departments Tracked'],
          ['155+', 'Seed Reports'],
          ['100%', 'Anonymous'],
        ].map(([val, lbl]) => (
          <div key={lbl} style={{ textAlign: 'center', minWidth: 100 }}>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--clr-primary)' }}>{val}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--clr-text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>{lbl}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
