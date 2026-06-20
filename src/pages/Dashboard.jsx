import { useEffect, useState } from 'react';
import { booksAPI, studentsAPI, borrowsAPI } from '../api/axios';
import '../styles/Dashboard.css';

const STAT_COLORS = {
  books:    { bg: '#c9a84c18', color: '#c9a84c' },
  authors:  { bg: '#5b9cf618', color: '#5b9cf6' },
  students: { bg: '#3ecf8e18', color: '#3ecf8e' },
  borrows:  { bg: '#f5a52418', color: '#f5a524' },
};

const Icon = ({ d, size = 16, color }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color || 'currentColor'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    {Array.isArray(d) ? d.map((p, i) => <path key={i} d={p} />) : <path d={d} />}
  </svg>
);

const ICONS = {
  books:    ['M4 19.5A2.5 2.5 0 016.5 17H20', 'M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z'],
  authors:  ['M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2', 'M12 3a4 4 0 110 8 4 4 0 010-8z'],
  students: ['M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2', 'M9 3a4 4 0 110 8 4 4 0 010-8z', 'M23 21v-2a4 4 0 00-3-3.87', 'M16 3.13a4 4 0 010 7.75'],
  borrows:  ['M8 6h13', 'M8 12h13', 'M8 18h13', 'M3 6h.01', 'M3 12h.01', 'M3 18h.01'],
};

function StatCard({ label, value, icon, colorKey, sub }) {
  const c = STAT_COLORS[colorKey];
  return (
    <div className="stat-card">
      <div className="stat-card-top">
        <span className="stat-label">{label}</span>
        <div className="stat-icon" style={{ background: c.bg }}>
          <Icon d={ICONS[icon]} size={17} color={c.color} />
        </div>
      </div>
      <div>
        <div className="stat-value">
          {value === null
            ? <span className="skeleton" style={{ display: 'inline-block', width: 60, height: 32 }} />
            : value}
        </div>
        {sub && <div className="stat-sub">{sub}</div>}
      </div>
    </div>
  );
}

// eslint-disable-next-line no-unused-vars
function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr);
  const m = Math.floor(diff / 60000);
  if (m < 1)  return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function Dashboard() {
  // Stats derived from real API counts
  const [stats, setStats]     = useState({ books: null, students: null, borrows: null });
  const [borrows, setBorrows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        // No dedicated dashboard endpoint — derive stats from list endpoints
        // meta.total gives the total count without fetching all records
        const [booksRes, studentsRes, borrowsRes, activeBorrowsRes] = await Promise.allSettled([
          booksAPI.getAll({ limit: 1 }),
          studentsAPI.getAll({ limit: 1 }),
          borrowsAPI.getAll({ limit: 5 }),                  // recent 5 for the table
          borrowsAPI.getAll({ status: 'active', limit: 1 }), // count active borrows
        ]);

        setStats({
          books:    booksRes.status    === 'fulfilled' ? booksRes.value.data.meta?.total    ?? 0 : '—',
          students: studentsRes.status === 'fulfilled' ? studentsRes.value.data.meta?.total ?? 0 : '—',
          borrows:  activeBorrowsRes.status === 'fulfilled' ? activeBorrowsRes.value.data.meta?.total ?? 0 : '—',
        });

        if (borrowsRes.status === 'fulfilled') {
          // Envelope: { data: { data: [...records], meta: {...} } }
          const records = borrowsRes.value.data.data;
          setBorrows(Array.isArray(records) ? records : []);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  return (
    <div className="page dashboard">
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Library overview and recent activity</p>
        </div>
      </div>

      <div className="stats-grid">
        <StatCard label="Total Books"    value={stats.books}    icon="books"    colorKey="books"    sub="in catalogue" />
        <StatCard label="Students"       value={stats.students} icon="students" colorKey="students" sub="active members" />
        <StatCard label="Active Borrows" value={stats.borrows}  icon="borrows"  colorKey="borrows"  sub="books checked out" />
      </div>

      <div className="dashboard-bottom" style={{ gridTemplateColumns: '1fr' }}>
        <div className="card">
          <h3 className="section-title">Recent Borrows</h3>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[...Array(4)].map((_, i) => <div key={i} className="skeleton" style={{ height: 40, borderRadius: 6 }} />)}
            </div>
          ) : borrows.length === 0 ? (
            <div className="empty-state" style={{ padding: '32px 0' }}><p>No borrow records yet.</p></div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr><th>Student</th><th>Admission No.</th><th>Book</th><th>Due</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {borrows.map((b, i) => (
                    <tr key={b._id || i}>
                      <td style={{ fontWeight: 500 }}>{b.student?.name || '—'}</td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>
                        {b.student?.admissionNumber || '—'}
                      </td>
                      <td style={{ color: 'var(--text-secondary)' }}>{b.book?.title || '—'}</td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>
                        {b.dueDate
                          ? new Date(b.dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
                          : '—'}
                      </td>
                      <td>
                        {b.status === 'returned'
                          ? <span className="badge badge-success">Returned</span>
                          : b.status === 'overdue'
                            ? <span className="badge badge-danger">Overdue</span>
                            : <span className="badge badge-info">Active</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}