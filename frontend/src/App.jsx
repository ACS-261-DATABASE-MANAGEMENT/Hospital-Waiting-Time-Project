// frontend/src/App.jsx
import { StrictMode, useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import ReportForm from './pages/ReportForm';
import Dashboard from './pages/Dashboard';
import AdminTable from './pages/AdminTable';

export default function App() {
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    const storedTheme = localStorage.getItem('app-theme');
    if (storedTheme === 'dark' || storedTheme === 'light') {
      setTheme(storedTheme);
    }
  }, []);

  useEffect(() => {
    document.body.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('app-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((current) => (current === 'light' ? 'dark' : 'light'));
  };

  return (
    <StrictMode>
      <BrowserRouter>
        <Navbar theme={theme} onToggleTheme={toggleTheme} />
        <main style={{ flex: 1 }}>
          <Routes>
            <Route path="/"          element={<Home />} />
            <Route
              path="/report"
              element={<ReportForm theme={theme} onToggleTheme={toggleTheme} />}
            />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/admin"     element={<AdminTable />} />
            <Route path="*"          element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <footer style={{
          textAlign: 'center',
          padding: '24px',
          borderTop: '1px solid var(--clr-border)',
          fontSize: '0.78rem',
          color: 'var(--clr-text-muted)',
        }}>
          MudaWazi · Hospital Waiting Time Dashboard
        </footer>
      </BrowserRouter>
    </StrictMode>
  );
}
