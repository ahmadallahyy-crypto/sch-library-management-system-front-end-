import { useEffect, useState } from 'react';
import { borrowsAPI, booksAPI, studentsAPI } from '../api/axios';

const Icon = ({ d, size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    {Array.isArray(d) ? d.map((p, i) => <path key={i} d={p} />) : <path d={d} />}
  </svg>
);
const PLUS   = 'M12 5v14M5 12h14';
const RETURN = ['M9 14l-4-4 4-4','M5 10h11a4 4 0 010 8h-1'];
const SEARCH = ['M11 19a8 8 0 100-16 8 8 0 000 16z','M21 21l-4.35-4.35'];
const CLOSE  = 'M18 6L6 18M6 6l12 12';

// issueBook body: { bookId, studentId, dueDate, notes }
// returnBook body: { notes }
// status values from backend: 'active' | 'overdue' | 'returned'
const EMPTY = { studentId: '', bookId: '', dueDate: '', notes: '' };

export default function Borrows() {
  const [borrows, setBorrows]   = useState([]);
  const [books, setBooks]       = useState([]);
  const [students, setStudents] = useState([]);
  const [search, setSearch]     = useState('');
  const [filter, setFilter]     = useState('all');
  const [modal, setModal]       = useState(null);
  const [selected, setSelected] = useState(null);
  const [form, setForm]         = useState(EMPTY);
  const [returnNote, setReturnNote] = useState('');
  const [saving, setSaving]     = useState(false);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [meta, setMeta]         = useState({});

  const loadBorrows = async (params = {}) => {
    try {
      const { data } = await borrowsAPI.getAll(params);
      setBorrows(data.data || []);
      setMeta(data.meta   || {});
    } finally { setLoading(false); }
  };

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [bkRes, stRes] = await Promise.all([
          booksAPI.getAll({ limit: 200 }),
          studentsAPI.getAll({ limit: 200 }),
        ]);
        setBooks(bkRes.data.data    || []);
        setStudents(stRes.data.data || []);
      } catch {
        // Silent fail - optional data (books/students) not critical
      }
    };
    fetchAll();
    loadBorrows();
  }, []);

  // Apply status filter
  const applyFilter = (f) => {
    setFilter(f);
    loadBorrows(f !== 'all' ? { status: f } : {});
  };

  const openIssue = () => {
    const due = new Date(); due.setDate(due.getDate() + 14);
    setForm({ ...EMPTY, dueDate: due.toISOString().split('T')[0] });
    setError(''); setModal('issue');
  };
  const openReturn = (b) => { setSelected(b); setReturnNote(''); setError(''); setModal('return'); };
  const close = () => { setModal(null); setSelected(null); setError(''); };

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleIssue = async () => {
    setSaving(true); setError('');
    try {
      await borrowsAPI.issue({
        bookId:    form.bookId,
        studentId: form.studentId,
        dueDate:   form.dueDate,
        notes:     form.notes || undefined,
      });
      await loadBorrows(filter !== 'all' ? { status: filter } : {});
      close();
    } catch (err) {
      setError(err.message || 'Could not issue book.');
    } finally { setSaving(false); }
  };

  const handleReturn = async () => {
    setSaving(true); setError('');
    try {
      await borrowsAPI.return(selected._id, returnNote || undefined);
      await loadBorrows(filter !== 'all' ? { status: filter } : {});
      close();
    } catch (err) {
      setError(err.message || 'Could not process return.');
    } finally { setSaving(false); }
  };

  const filtered = borrows.filter(b =>
    b.student?.name?.toLowerCase().includes(search.toLowerCase()) ||
    b.book?.title?.toLowerCase().includes(search.toLowerCase()) ||
    b.student?.admissionNumber?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="page" style={{ animation: 'fadeIn .3s ease' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Borrows</h1>
          <p className="page-subtitle">{meta.total ?? borrows.length} records</p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <div className="search-bar">
            <span className="search-icon"><Icon d={SEARCH} size={15} /></span>
            <input className="input" placeholder="Search by student or book…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <button className="btn btn-primary" onClick={openIssue}><Icon d={PLUS} size={15} /> Issue Book</button>
        </div>
      </div>

      {/* Filter tabs — maps to backend status values */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
        {['all','active','overdue','returned'].map(f => (
          <button key={f} onClick={() => applyFilter(f)}
            className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-ghost'}`}
            style={{ textTransform: 'capitalize' }}>
            {f}
          </button>
        ))}
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Student</th><th>Admission No.</th><th>Book</th><th>Borrowed</th><th>Due</th><th>Status</th><th>Issued By</th><th></th></tr></thead>
            <tbody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>{[...Array(8)].map((_, j) => <td key={j}><div className="skeleton" style={{ height: 16, borderRadius: 4 }} /></td>)}</tr>
                ))
              ) : filtered.length === 0 ? (
                <tr><td colSpan={8}><div className="empty-state"><p>No borrow records found.</p></div></td></tr>
              ) : filtered.map(b => (
                <tr key={b._id}>
                  <td style={{ fontWeight: 500 }}>{b.student?.name || '—'}</td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>{b.student?.admissionNumber || '—'}</td>
                  <td style={{ color: 'var(--text-secondary)' }}>{b.book?.title || '—'}</td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>
                    {b.borrowedAt ? new Date(b.borrowedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                  </td>
                  <td style={{ fontSize: '0.82rem', color: b.status === 'overdue' ? 'var(--danger)' : 'var(--text-secondary)' }}>
                    {b.dueDate ? new Date(b.dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                  </td>
                  <td>
                    {b.status === 'returned'
                      ? <span className="badge badge-success">Returned</span>
                      : b.status === 'overdue'
                        ? <span className="badge badge-danger">Overdue</span>
                        : <span className="badge badge-info">Active</span>}
                  </td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>{b.issuedBy?.name || '—'}</td>
                  <td>
                    {b.status !== 'returned' && (
                      <button className="btn btn-ghost btn-sm" onClick={() => openReturn(b)}>
                        <Icon d={RETURN} size={13} /> Return
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Issue Modal */}
      {modal === 'issue' && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && close()}>
          <div className="modal">
            <div className="modal-header"><h3>Issue Book</h3><button className="btn btn-ghost btn-icon" onClick={close}><Icon d={CLOSE} size={16} /></button></div>
            <div className="modal-body">
              {error && <div className="login-error" style={{ marginBottom: 14 }}>{error}</div>}
              <div className="form-group"><label>Student *</label>
                <select name="studentId" className="select" value={form.studentId} onChange={handleChange}>
                  <option value="">— Select student —</option>
                  {students.map(s => <option key={s._id} value={s._id}>{s.name} ({s.admissionNumber})</option>)}
                </select>
              </div>
              <div className="form-group"><label>Book *</label>
                <select name="bookId" className="select" value={form.bookId} onChange={handleChange}>
                  <option value="">— Select book —</option>
                  {books.filter(b => b.isActive !== false && (b.availableCopies ?? 0) > 0).map(b => (
                    <option key={b._id} value={b._id}>{b.title} ({b.availableCopies} left)</option>
                  ))}
                </select>
              </div>
              <div className="form-group"><label>Due Date *</label><input name="dueDate" type="date" className="input" value={form.dueDate} onChange={handleChange} /></div>
              <div className="form-group"><label>Notes</label><input name="notes" className="input" value={form.notes} onChange={handleChange} placeholder="Optional notes…" /></div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={close}>Cancel</button>
              <button className="btn btn-primary" onClick={handleIssue} disabled={saving || !form.studentId || !form.bookId || !form.dueDate}>
                {saving ? 'Issuing…' : 'Issue Book'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Return Modal */}
      {modal === 'return' && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && close()}>
          <div className="modal">
            <div className="modal-header"><h3>Return Book</h3><button className="btn btn-ghost btn-icon" onClick={close}><Icon d={CLOSE} size={16} /></button></div>
            <div className="modal-body">
              {error && <div className="login-error" style={{ marginBottom: 14 }}>{error}</div>}
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: 16 }}>
                Mark <strong style={{ color: 'var(--text-primary)' }}>{selected?.book?.title}</strong> as returned by{' '}
                <strong style={{ color: 'var(--text-primary)' }}>{selected?.student?.name}</strong>?
                {selected?.status === 'overdue' && (
                  <span style={{ color: 'var(--danger)', display: 'block', marginTop: 6, fontSize: '0.82rem' }}>
                    ⚠ This book is overdue.
                  </span>
                )}
              </p>
              <div className="form-group"><label>Notes <span style={{ fontWeight: 400, textTransform: 'none', color: 'var(--text-muted)' }}>(optional)</span></label>
                <input className="input" value={returnNote} onChange={e => setReturnNote(e.target.value)} placeholder="Condition, damage notes…" />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={close}>Cancel</button>
              <button className="btn btn-primary" onClick={handleReturn} disabled={saving}>{saving ? 'Processing…' : 'Confirm Return'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}