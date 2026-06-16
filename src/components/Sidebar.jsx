import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/Sidebar.css';

const Icon = ({ d, size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    {Array.isArray(d) ? d.map((p, i) => <path key={i} d={p} />) : <path d={d} />}
  </svg>
);

const ICONS = {
  dashboard: ['M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z', 'M9 22V12h6v10'],
  books:     ['M4 19.5A2.5 2.5 0 016.5 17H20', 'M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z'],
  authors:   ['M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2', 'M12 3a4 4 0 110 8 4 4 0 010-8z'],
  students:  ['M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2', 'M9 3a4 4 0 110 8 4 4 0 010-8z', 'M23 21v-2a4 4 0 00-3-3.87', 'M16 3.13a4 4 0 010 7.75'],
  borrows:   ['M8 6h13', 'M8 12h13', 'M8 18h13', 'M3 6h.01', 'M3 12h.01', 'M3 18h.01'],
  staff:     ['M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z'],
  logout:    ['M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4', 'M16 17l5-5-5-5', 'M21 12H9'],
};

export default function Sidebar() {
  const { attendant, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => { await logout(); navigate('/login'); };

  const initials = attendant?.name
    ? attendant.name.split(' ').map(n => n[0]).slice(0, 2).join('')
    : '?';

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
            stroke="#0d0f14" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
          </svg>
        </div>
        <span className="sidebar-logo-text">Library<span>MS</span></span>
      </div>

      <nav className="sidebar-nav">
        <span className="nav-section-label">Overview</span>
        <NavLink to="/dashboard" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
          <Icon d={ICONS.dashboard} size={16} /> Dashboard
        </NavLink>

        <span className="nav-section-label">Catalogue</span>
        <NavLink to="/books" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
          <Icon d={ICONS.books} size={16} /> Books
        </NavLink>
        <NavLink to="/authors" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
          <Icon d={ICONS.authors} size={16} /> Authors
        </NavLink>

        <span className="nav-section-label">Circulation</span>
        <NavLink to="/students" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
          <Icon d={ICONS.students} size={16} /> Students
        </NavLink>
        <NavLink to="/borrows" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
          <Icon d={ICONS.borrows} size={16} /> Borrows
        </NavLink>

        {isAdmin && (
          <>
            <span className="nav-section-label">Admin</span>
            <NavLink to="/attendants" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
              <Icon d={ICONS.staff} size={16} /> Attendants
            </NavLink>
          </>
        )}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="sidebar-avatar">{initials}</div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">{attendant?.name || 'User'}</div>
            <div className="sidebar-user-role">{attendant?.role || 'attendant'}</div>
          </div>
        </div>
        <button className="nav-link" onClick={handleLogout} style={{ marginTop: 4 }}>
          <Icon d={ICONS.logout} size={16} /> Log out
        </button>
      </div>
    </aside>
  );
}