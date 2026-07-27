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
      <section className="home-hero">
        <div className="home-hero-badge">🇰🇪 Eneo la Lukenya</div>
        <div className="home-hero-copy">
          <p className="home-hero-eyebrow">Ripoti za muda wa kusubiri zinazosababishwa na jamii</p>
          <h1>
            Hospital wait time <br />
            <span>transparency platform</span>
          </h1>
          <p className="home-hero-text">
            Mfumo wa data wa wananchi kwa kufuatilia na kuchambua muda wa kusubiri kwa wagonjwa katika
            vituo vya afya vya Lukenya. Shiriki uzoefu wako wa ziara kwa siri ili kusaidia kuboresha huduma.
          </p>
          <div className="home-hero-actions">
            <Link to="/report" className="btn btn-primary home-hero-btn">
              📋 Submit a Report
            </Link>
            <Link to="/dashboard" className="btn btn-secondary home-hero-btn">
              📊 View Dashboard
            </Link>
          </div>
        </div>
      </section>

      <section className="home-feature-grid">
        {features.map((f) => (
          <article key={f.path} className="feature-card">
            <div className="feature-icon" style={{ color: f.color }}>{f.icon}</div>
            <div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
            <Link to={f.path} className="btn btn-secondary feature-link" style={{ borderColor: f.color, color: f.color }}>
              {f.cta} →
            </Link>
          </article>
        ))}
      </section>

      <section className="home-stats-grid">
        {[
          ['5', 'Health facilities'],
          ['11', 'Departments tracked'],
          ['155+', 'Seed reports'],
          ['100%', 'Anonymous reporting'],
        ].map(([value, label]) => (
          <div key={label} className="home-stat-card">
            <div className="home-stat-value">{value}</div>
            <div className="home-stat-label">{label}</div>
          </div>
        ))}
      </section>

      <section className="home-how-it-works">
        <h2>How it works</h2>
        <div className="home-step-grid">
          <article className="step-card">
            <div className="step-badge">1</div>
            <h4>Submit your visit</h4>
            <p>Record arrival, consultation and medication times so the community can understand service speed.</p>
          </article>
          <article className="step-card">
            <div className="step-badge">2</div>
            <h4>Track wait data</h4>
            <p>View aggregated analytics for facilities and departments to see where care is improving.</p>
          </article>
          <article className="step-card">
            <div className="step-badge">3</div>
            <h4>Drive better care</h4>
            <p>Use shared data to support faster, more transparent service delivery in the community.</p>
          </article>
        </div>
      </section>
    </div>
  );
}
