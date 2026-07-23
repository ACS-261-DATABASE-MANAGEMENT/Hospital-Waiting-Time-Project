// frontend/src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import ReportForm from './pages/ReportForm';
import Dashboard from './pages/Dashboard';
import AdminTable from './pages/AdminTable';

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <main style={{ flex: 1 }}>
        <Routes>
          <Route path="/"          element={<Home />} />
          <Route path="/report"    element={<ReportForm />} />
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
        Hospital Waiting Time Dashboard · ACS-261 Database Management Systems · Daystar University
      </footer>
    </BrowserRouter>
  );
}
