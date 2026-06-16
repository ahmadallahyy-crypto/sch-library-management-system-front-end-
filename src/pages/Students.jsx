import { useEffect, useState } from 'react';
import { studentsAPI } from '../api/axios';

const Icon = ({ d, size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    {Array.isArray(d) ? d.map((p, i) => <path key={i} d={p} />) : <path d={d} />}
  </svg>
);
const PLUS   = 'M12 5v14M5 12h14';
const EDIT   = ['M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7','M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z'];
const TRASH  = ['M3 6h18','M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6','M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2'];
const SEARCH = ['M11 19a8 8 0 100-16 8 8 0 000 16z','M21 21l-4.35-4.35'];
const CLOSE  = 'M18 6L6 18M6 6l12 12';

// CREATABLE: name, email, admissionNumber (auto-generated if omitted)
// UPDATABLE: name, email, isActive — admissionNumber is immutable
const EMPTY = { name: '', email: '', admissionNumber: '' };

export default function Students() {
  const [students, setStudents] = useState([]);
  const [search, setSearch]     = useState('');
  const [modal, setModal]       = useState(null);
  const [selected, setSelected] = useState(null);
  const [form, setForm]         = useState(EMPTY);
  const [saving, setSaving]     = useState(false);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [meta, setMeta]         = useState({});

  const load = async (params = {}) => {
    try {
      const { data } = await studentsAPI.getAll(params);
      setStudents(data.data || []);
      setMeta(data.meta    || {});
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    const t = setTimeout(() => load(search ? { search } : {}), 350);
    return () => clearTimeout(t);
  }, [search]);

  const openAdd  = () => { setForm(EMPTY); setError(''); setModal('add'); };
  const openEdit = (s) => {
    setSelected(s);
    // Only send UPDATABLE fields — admissionNumber shown read-only
    setForm({ name: s.name, email: s.email || '' });
    setError('');
    setModal('edit');
  };
  const openDel  = (s) => { setSelected(s); setError(''); setModal('delete'); };
  const close    = () => { setModal(null); setSelected(null); setError(''); };

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSave = async () => {
    setSaving(true); setError('');
    try {
      if (modal === 'add') {
        // admissionNumber is optional — backend auto-generates if omitted
        const payload = { name: form.name, email: form.email };
        if (form.admissionNumber) payload.admissionNumber = form.admissionNumber;
        await studentsAPI.create(payload);
      } else {
        await studentsAPI.update(selected._id, { name: form.name, email: form.email });
      }
      await load(); close();
    } catch (err) {
      setError(err.message || 'Something went wrong.');
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    setSaving(true); setError('');
    try { await studentsAPI.delete(selected._id); await load(); close(); }
    catch (err) { setError(err.message || 'Could not delete student.'); }
    finally { setSaving(false); }
  };

  return (
    <div className="page" style={{ animation: 'fadeIn .3s ease' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Students</h1>
          <p className="page-subtitle">{meta.total ?? students.length} students registered</p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <div className="search-bar">
            <span className="search-icon"><Icon d={SEARCH} size={15} /></span>
            <input className="input" placeholder="Search students…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <button className="btn btn-primary" onClick={openAdd}><Icon d={PLUS} size={15} /> Add Student</button>
        </div>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Name</th><th>Admission No.</th><th>Email</th><th>Active Borrows</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>{[...Array(6)].map((_, j) => <td key={j}><div className="skeleton" style={{ height: 16, borderRadius: 4 }} /></td>)}</tr>
                ))
              ) : students.length === 0 ? (
                <tr><td colSpan={6}><div className="empty-state"><p>No students found.</p></div></td></tr>
              ) : students.map(s => (
                <tr key={s._id}>
                  <td style={{ fontWeight: 500 }}>{s.name}</td>
                  <td><span className="badge badge-muted">{s.admissionNumber || '—'}</span></td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>{s.email || '—'}</td>
                  <td style={{ color: 'var(--text-secondary)' }}>
                    {s.activeBorrows > 0
                      ? <span className="badge badge-warning">{s.activeBorrows} out</span>
                      : <span style={{ color: 'var(--text-muted)' }}>0</span>}
                  </td>
                  <td>
                    {s.isActive !== false
                      ? <span className="badge badge-success">Active</span>
                      : <span className="badge badge-muted">Inactive</span>}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-ghost btn-sm btn-icon" onClick={() => openEdit(s)}><Icon d={EDIT} size={14} /></button>
                      <button className="btn btn-danger btn-sm btn-icon" onClick={() => openDel(s)}><Icon d={TRASH} size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {(modal === 'add' || modal === 'edit') && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && close()}>
          <div className="modal">
            <div className="modal-header">
              <h3>{modal === 'add' ? 'Register Student' : 'Edit Student'}</h3>
              <button className="btn btn-ghost btn-icon" onClick={close}><Icon d={CLOSE} size={16} /></button>
            </div>
            <div className="modal-body">
              {error && <div className="login-error" style={{ marginBottom: 14 }}>{error}</div>}
              <div className="form-group"><label>Full Name *</label><input name="name" className="input" value={form.name} onChange={handleChange} placeholder="Student full name" /></div>
              <div className="form-group"><label>Email</label><input name="email" type="email" className="input" value={form.email} onChange={handleChange} placeholder="student@school.edu" /></div>
              {modal === 'add' && (
                <div className="form-group">
                  <label>Admission Number <span style={{ fontWeight: 400, textTransform: 'none', color: 'var(--text-muted)' }}>(leave blank to auto-generate)</span></label>
                  <input name="admissionNumber" className="input" value={form.admissionNumber} onChange={handleChange} placeholder="e.g. SCH/26/STU/00001" />
                </div>
              )}
              {modal === 'edit' && (
                <div className="form-group">
                  <label>Admission Number</label>
                  <input className="input" value={selected?.admissionNumber || ''} disabled style={{ opacity: 0.5, cursor: 'not-allowed' }} />
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={close}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving || !form.name}>{saving ? 'Saving…' : 'Save Student'}</button>
            </div>
          </div>
        </div>
      )}

      {modal === 'delete' && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && close()}>
          <div className="modal">
            <div className="modal-header"><h3>Remove Student</h3><button className="btn btn-ghost btn-icon" onClick={close}><Icon d={CLOSE} size={16} /></button></div>
            <div className="modal-body">
              {error && <div className="login-error" style={{ marginBottom: 12 }}>{error}</div>}
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                Remove <strong style={{ color: 'var(--text-primary)' }}>{selected?.name}</strong>?
                {' '}This will fail if they have books currently checked out.
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={close}>Cancel</button>
              <button className="btn btn-danger" onClick={handleDelete} disabled={saving}>{saving ? 'Removing…' : 'Remove'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}