import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar    from './components/Sidebar';
import Topbar     from './components/Topbar';
import Login          from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword  from './pages/ResetPassword';
import Dashboard  from './pages/Dashboard';
import Books      from './pages/Books';
import Authors    from './pages/Authors';
import Students   from './pages/Students';
import Borrows    from './pages/Borrows';
import Attendants from './pages/Attendants';
import './styles/global.css';

function AppShell() {
  const { attendant, loading } = useAuth();

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: 'var(--text-muted)' }}>
      Loading…
    </div>
  );

  if (!attendant) return <Navigate to="/login" replace />;

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <div style={{ marginLeft: 'var(--sidebar-w)', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Topbar />
        <main style={{ marginTop: 'var(--topbar-h)', flex: 1 }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function PublicRoute({ children }) {
  const { attendant, loading } = useAuth();
  if (loading) return null;
  return attendant ? <Navigate to="/dashboard" replace /> : children;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login"          element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
          <Route path="/reset-password"  element={<PublicRoute><ResetPassword /></PublicRoute>} />
          <Route element={<AppShell />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard"  element={<Dashboard />} />
            <Route path="/books"      element={<Books />} />
            <Route path="/authors"    element={<Authors />} />
            <Route path="/students"   element={<Students />} />
            <Route path="/borrows"    element={<Borrows />} />
            <Route path="/attendants" element={<Attendants />} />
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}