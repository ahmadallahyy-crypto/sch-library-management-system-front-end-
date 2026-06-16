import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/Topbar.css';

const PAGE_META = {
  '/dashboard':  { title: 'Dashboard',  crumb: 'Overview' },
  '/books':      { title: 'Books',       crumb: 'Catalogue' },
  '/authors':    { title: 'Authors',     crumb: 'Catalogue' },
  '/students':   { title: 'Students',    crumb: 'Circulation' },
  '/borrows':    { title: 'Borrows',     crumb: 'Circulation' },
  '/attendants': { title: 'Attendants',  crumb: 'Admin' },
};

function formatDate() {
  return new Date().toLocaleDateString('en-GB', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
  });
}

export default function Topbar() {
  const { pathname } = useLocation();
  const { isAdmin }  = useAuth();
  const meta = PAGE_META[pathname] || { title: 'Library MS', crumb: '' };

  return (
    <header className="topbar">
      <div className="topbar-left">
        <div className="topbar-title">{meta.title}</div>
        {meta.crumb && (
          <div className="topbar-breadcrumb">
            <span>LibraryMS</span>
            <span>›</span>
            <span>{meta.crumb}</span>
            <span>›</span>
            <span className="crumb-active">{meta.title}</span>
          </div>
        )}
      </div>
      <div className="topbar-right">
        <span className="topbar-date">{formatDate()}</span>
        <div className="topbar-divider" />
        <div className="topbar-badge">
          <div className="topbar-badge-dot" />
          {isAdmin ? 'Admin' : 'Attendant'}
        </div>
      </div>
    </header>
  );
}