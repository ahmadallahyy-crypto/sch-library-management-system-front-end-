import { useEffect, useState } from 'react';
import { attendantsAPI } from '../api/axios';
import { useAuth } from '../context/AuthContext';

const Icon = ({ d, size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    {Array.isArray(d) ? d.map((p, i) => <path key={i} d={p} />) : <path d={d} />}
  </svg>
);
const PLUS   = 'M12 5v14M5 12h14';
const EDIT   = ['M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7','M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z'];
const LOCK   = ['M19 11H5a2 2 0 00-2 2v7a2 2 0 002 2h14a2 2 0 002-2v-7a2 2 0 00-2-2z','M7 11V7a5 5 0 0110 0v4'];
const CLOSE  = 'M18 6L6 18M6 6l12 12';
const SEARCH = ['M11 19a8 8 0 100-16 8 8 0 000 16z','M21 21l-4.35-4.35'];
const DEACT  = ['M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636'];

// CREATABLE: name, email, password, staffId, role, shift
// UPDATABLE: name, email, role, shift, isActive
// DELETE is a soft-delete (sets isActive: false) — not a hard delete
const EMPTY = { name: '', email: '', password: '', role: 'attendant', shift: 'morning', staffId: '' };
const VALID_SHIFTS = ['morning', 'afternoon', 'evening'];

export default function Attendants() {
  const { isAdmin, attendant: self } = useAuth();
  const [staff, setStaff]     = useState([]);
  const [search, setSearch]   = useState('');
  const [modal, setModal]     = useState(null);
  const [selected, setSelected] = useState(null);
  const [form, setForm]       = useState(EMPTY);
  const [saving, setSaving]   = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [meta, setMeta]       = useState({});

  const load = async (params = {}) => {
    try {
      const { data } = await attendantsAPI.getAll({ showInactive: 'true', ...params });
      setStaff(data.data || []);
      setMeta(data.meta  || {});
    } finally { setLoading(false); }
  };

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { if (isAdmin) load(); else setLoading(false); }, [isAdmin]);

  useEffect(() => {
    const t = setTimeout(() => load(search ? { search } : {}), 350);
    return () => clearTimeout(t);
  }, [search]);

  const openAdd  = () => { setForm(EMPTY); setError(''); setModal('add'); };
  const openEdit = (s) => {
    setSelected(s);
    setForm({ name: s.name, email: s.email, password: '', role: s.role, shift: s.shift || 'morning' });
    setError('');
    setModal('edit');
  };
  const openDeact = (s) => { setSelected(s); setError(''); setModal('deactivate'); };
  const close = () => { setModal(null); setSelected(null); setError(''); };

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSave = async () => {
    setSaving(true); setError('');
    try {
      if (modal === 'add') {
        await attendantsAPI.create(form);
      } else {
        const payload = { name: form.name, email: form.email, role: form.role, shift: form.shift };
        if (form.password) payload.password = form.password;
        await attendantsAPI.update(selected._id, payload);
      }
      await load(); close();
    } catch (err) {
      setError(err.message || 'Something went wrong.');
    } finally { setSaving(false); }
  };

  // Soft delete — backend sets isActive: false, record remains in DB
  const handleDeactivate = async () => {
    setSaving(true); setError('');
    try { await attendantsAPI.deactivate(selected._id); await load(); close(); }
    catch (err) { setError(err.message || 'Could not deactivate attendant.'); }
    finally { setSaving(false); }
  };

  if (!isAdmin) {
    return (
      <div className="page" style={{ animation: 'fadeIn .3s ease' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 400, gap: 16, color: 'var(--text-muted)' }}>
          <Icon d={LOCK} size={40} />
          <h2 style={{ fontFamily: 'var(--font-display)', color: 'var(--text-secondary)' }}>Admin Only</h2>
          <p style={{ fontSize: '0.9rem' }}>You don't have permission to view this page.</p>
        </div>
      </div>
    );
  }

  const filtered = staff.filter(s =>
    s.name?.toLowerCase().includes(search.toLowerCase()) ||
    s.email?.toLowerCase().includes(search.toLowerCase()) ||
    s.staffId?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="page" style={{ animation: 'fadeIn .3s ease' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Attendants</h1>
          <p className="page-subtitle">{meta.total ?? staff.length} staff members</p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <div className="search-bar">
            <span className="search-icon"><Icon d={SEARCH} size={15} /></span>
            <input className="input" placeholder="Search staff…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <button className="btn btn-primary" onClick={openAdd}><Icon d={PLUS} size={15} /> Add Staff</button>
        </div>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Name</th><th>Staff ID</th><th>Email</th><th>Role</th><th>Shift</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {loading ? (
                [...Array(4)].map((_, i) => (
                  <tr key={i}>{[...Array(7)].map((_, j) => <td key={j}><div className="skeleton" style={{ height: 16, borderRadius: 4 }} /></td>)}</tr>
                ))
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7}><div className="empty-state"><p>No staff found.</p></div></td></tr>
              ) : filtered.map(s => (
                <tr key={s._id} style={{ opacity: s.isActive === false ? 0.5 : 1 }}>
                  <td style={{ fontWeight: 500 }}>
                    {s.name}
                    {s._id === self?._id && <span className="badge badge-muted" style={{ marginLeft: 6 }}>You</span>}
                  </td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>{s.staffId || '—'}</td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>{s.email}</td>
                  <td>
                    {s.role === 'admin'
                      ? <span className="badge badge-warning">Admin</span>
                      : <span className="badge badge-info">Attendant</span>}
                  </td>
                  <td style={{ color: 'var(--text-secondary)', textTransform: 'capitalize', fontSize: '0.82rem' }}>{s.shift || '—'}</td>
                  <td>
                    {s.isActive !== false
                      ? <span className="badge badge-success">Active</span>
                      : <span className="badge badge-muted">Inactive</span>}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-ghost btn-sm btn-icon" onClick={() => openEdit(s)} title="Edit"><Icon d={EDIT} size={14} /></button>
                      {/* Can't deactivate yourself — backend also blocks this */}
                      {s._id !== self?._id && s.isActive !== false && (
                        <button className="btn btn-danger btn-sm btn-icon" onClick={() => openDeact(s)} title="Deactivate"><Icon d={DEACT} size={14} /></button>
                      )}
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
              <h3>{modal === 'add' ? 'Add Staff Member' : 'Edit Staff Member'}</h3>
              <button className="btn btn-ghost btn-icon" onClick={close}><Icon d={CLOSE} size={16} /></button>
            </div>
            <div className="modal-body">
              {error && <div className="login-error" style={{ marginBottom: 14 }}>{error}</div>}
              <div className="form-group"><label>Full Name *</label><input name="name" className="input" value={form.name} onChange={handleChange} placeholder="Full name" /></div>
              <div className="form-group"><label>Email *</label><input name="email" type="email" className="input" value={form.email} onChange={handleChange} placeholder="staff@library.com" /></div>
              {modal === 'add' && (
                <div className="form-group"><label>Staff ID</label><input name="staffId" className="input" value={form.staffId} onChange={handleChange} placeholder="e.g. LIB001" /></div>
              )}
              <div className="form-group">
                <label>Password {modal === 'edit' && <span style={{ fontWeight: 400, textTransform: 'none', color: 'var(--text-muted)' }}>(leave blank to keep current)</span>}</label>
                <input name="password" type="password" className="input" value={form.password} onChange={handleChange} placeholder="••••••••" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div className="form-group"><label>Role</label>
                  <select name="role" className="select" value={form.role} onChange={handleChange}>
                    <option value="attendant">Attendant</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div className="form-group"><label>Shift</label>
                  <select name="shift" className="select" value={form.shift} onChange={handleChange}>
                    {VALID_SHIFTS.map(s => <option key={s} value={s} style={{ textTransform: 'capitalize' }}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={close}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving || !form.name || !form.email || (modal === 'add' && !form.password)}>
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {modal === 'deactivate' && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && close()}>
          <div className="modal">
            <div className="modal-header"><h3>Deactivate Staff</h3><button className="btn btn-ghost btn-icon" onClick={close}><Icon d={CLOSE} size={16} /></button></div>
            <div className="modal-body">
              {error && <div className="login-error" style={{ marginBottom: 12 }}>{error}</div>}
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                Deactivate <strong style={{ color: 'var(--text-primary)' }}>{selected?.name}</strong>?
                Their account will be disabled but borrow history is preserved.
                You can re-activate them via edit.
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={close}>Cancel</button>
              <button className="btn btn-danger" onClick={handleDeactivate} disabled={saving}>{saving ? 'Deactivating…' : 'Deactivate'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}