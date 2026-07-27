// frontend/src/components/Navbar.jsx
import { NavLink } from 'react-router-dom';

export default function Navbar({ theme, onToggleTheme }) {
  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <NavLink to="/" className="navbar-brand" style={{ textDecoration: 'none' }}>
          <div className="brand-icon">🏥</div>
          <span>MudaWazi</span>
          <span style={{ fontSize: '0.65rem', color: 'var(--clr-text-dim)', fontWeight: 400, marginLeft: 4 }}>
            Lukenya Area
          </span>
        </NavLink>

        <div className="navbar-links">
          <NavLink
            to="/report"
            className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
          >
            📋 Submit Report
          </NavLink>
          <NavLink
            to="/dashboard"
            className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
          >
            📊 Dashboard
          </NavLink>
          <NavLink
            to="/admin"
            className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
          >
            🛠 Admin
          </NavLink>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onToggleTheme}
            style={{ marginLeft: '12px' }}
          >
            {theme === 'light' ? '🌙 Dark mode' : '☀️ Light mode'}
          </button>
        </div>
      </div>
    </nav>
  );
}
