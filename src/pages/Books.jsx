import { useEffect, useState } from 'react';
import { booksAPI, authorsAPI } from '../api/axios';

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

// Backend CREATABLE: title, isbn, author, genre, description, publishedYear, publisher, totalCopies, shelfLocation
// Backend UPDATABLE: title, genre, description, publishedYear, publisher, totalCopies, shelfLocation, isActive
const EMPTY_FORM = { title: '', isbn: '', author: '', genre: '', description: '', publishedYear: '', publisher: '', totalCopies: 1, shelfLocation: '' };

export default function Books() {
  const [books, setBooks]       = useState([]);
  const [authors, setAuthors]   = useState([]);
  const [search, setSearch]     = useState('');
  const [modal, setModal]       = useState(null);
  const [selected, setSelected] = useState(null);
  const [form, setForm]         = useState(EMPTY_FORM);
  const [saving, setSaving]     = useState(false);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [meta, setMeta]         = useState({});

  const load = async (params = {}) => {
    try {
      const [bRes, aRes] = await Promise.all([
        booksAPI.getAll(params),
        authorsAPI.getAll({ limit: 100 }),
      ]);
      // Envelope: { data: { data: [...], meta: {...} } }
      setBooks(bRes.data.data   || []);
      setMeta(bRes.data.meta    || {});
      setAuthors(aRes.data.data || []);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  // Search via backend text search
  useEffect(() => {
    const t = setTimeout(() => load(search ? { search } : {}), 350);
    return () => clearTimeout(t);
  }, [search]);

  const openAdd  = () => { setForm(EMPTY_FORM); setError(''); setModal('add'); };
  const openEdit = (b) => {
    setSelected(b);
    setForm({
      title:        b.title,
      genre:        b.genre        || '',
      description:  b.description  || '',
      publishedYear:b.publishedYear|| '',
      publisher:    b.publisher    || '',
      totalCopies:  b.totalCopies  ?? 1,
      shelfLocation:b.shelfLocation|| '',
      // isbn and author excluded — backend marks them as non-updatable
    });
    setError('');
    setModal('edit');
  };
  const openDel  = (b) => { setSelected(b); setModal('delete'); };
  const close    = () => { setModal(null); setSelected(null); setError(''); };

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSave = async () => {
    setSaving(true); setError('');
    try {
      if (modal === 'add') {
        await booksAPI.create(form);
      } else {
        // Only send UPDATABLE fields on edit
        const { title, genre, description, publishedYear, publisher, totalCopies, shelfLocation } = form;
        await booksAPI.update(selected._id, { title, genre, description, publishedYear, publisher, totalCopies, shelfLocation });
      }
      await load(); close();
    } catch (err) {
      setError(err.message || 'Something went wrong.');
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    setSaving(true);
    try { await booksAPI.delete(selected._id); await load(); close(); }
    catch (err) { setError(err.message || 'Could not delete book.'); }
    finally { setSaving(false); }
  };

  return (
    <div className="page" style={{ animation: 'fadeIn .3s ease' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Books</h1>
          <p className="page-subtitle">{meta.total ?? books.length} books in catalogue</p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <div className="search-bar">
            <span className="search-icon"><Icon d={SEARCH} size={15} /></span>
            <input className="input" placeholder="Search books…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <button className="btn btn-primary" onClick={openAdd}><Icon d={PLUS} size={15} /> Add Book</button>
        </div>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Title</th><th>Author</th><th>Genre</th><th>Year</th><th>Copies</th><th>Available</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>{[...Array(8)].map((_, j) => <td key={j}><div className="skeleton" style={{ height: 16, borderRadius: 4 }} /></td>)}</tr>
                ))
              ) : books.length === 0 ? (
                <tr><td colSpan={8}><div className="empty-state"><p>No books found.</p></div></td></tr>
              ) : books.map(b => (
                <tr key={b._id}>
                  <td style={{ fontWeight: 500 }}>{b.title}</td>
                  <td style={{ color: 'var(--text-secondary)' }}>{b.author?.name || '—'}</td>
                  <td><span className="badge badge-muted">{b.genre || '—'}</span></td>
                  <td style={{ color: 'var(--text-secondary)' }}>{b.publishedYear || '—'}</td>
                  <td style={{ color: 'var(--text-secondary)' }}>{b.totalCopies ?? '—'}</td>
                  <td style={{ color: 'var(--text-secondary)' }}>{b.availableCopies ?? '—'}</td>
                  <td>
                    {!b.isActive
                      ? <span className="badge badge-muted">Inactive</span>
                      : (b.availableCopies ?? 0) > 0
                        ? <span className="badge badge-success">Available</span>
                        : <span className="badge badge-danger">Checked Out</span>}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-ghost btn-sm btn-icon" onClick={() => openEdit(b)}><Icon d={EDIT} size={14} /></button>
                      <button className="btn btn-danger btn-sm btn-icon" onClick={() => openDel(b)}><Icon d={TRASH} size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {(modal === 'add' || modal === 'edit') && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && close()}>
          <div className="modal" style={{ maxWidth: 560 }}>
            <div className="modal-header">
              <h3>{modal === 'add' ? 'Add Book' : 'Edit Book'}</h3>
              <button className="btn btn-ghost btn-icon" onClick={close}><Icon d={CLOSE} size={16} /></button>
            </div>
            <div className="modal-body">
              {error && <div className="login-error" style={{ marginBottom: 16 }}>{error}</div>}
              <div className="form-group"><label>Title *</label><input name="title" className="input" value={form.title} onChange={handleChange} placeholder="Book title" /></div>

              {modal === 'add' && (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                    <div className="form-group"><label>Author</label>
                      <select name="author" className="select" value={form.author} onChange={handleChange}>
                        <option value="">— Select author —</option>
                        {authors.map(a => <option key={a._id} value={a._id}>{a.name}</option>)}
                      </select>
                    </div>
                    <div className="form-group"><label>ISBN</label><input name="isbn" className="input" value={form.isbn} onChange={handleChange} placeholder="978-..." /></div>
                  </div>
                </>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div className="form-group"><label>Genre</label><input name="genre" className="input" value={form.genre} onChange={handleChange} placeholder="Fiction, Science…" /></div>
                <div className="form-group"><label>Published Year</label><input name="publishedYear" type="number" className="input" value={form.publishedYear} onChange={handleChange} placeholder="2024" /></div>
                <div className="form-group"><label>Publisher</label><input name="publisher" className="input" value={form.publisher} onChange={handleChange} placeholder="Publisher name" /></div>
                <div className="form-group"><label>Total Copies</label><input name="totalCopies" type="number" min="1" className="input" value={form.totalCopies} onChange={handleChange} /></div>
                <div className="form-group"><label>Shelf Location</label><input name="shelfLocation" className="input" value={form.shelfLocation} onChange={handleChange} placeholder="e.g. A3-Shelf2" /></div>
              </div>
              <div className="form-group"><label>Description</label>
                <textarea name="description" className="input textarea" rows={2} value={form.description} onChange={handleChange} placeholder="Short description…" style={{ resize: 'vertical' }} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={close}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving || !form.title}>{saving ? 'Saving…' : 'Save Book'}</button>
            </div>
          </div>
        </div>
      )}

      {modal === 'delete' && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && close()}>
          <div className="modal">
            <div className="modal-header"><h3>Delete Book</h3><button className="btn btn-ghost btn-icon" onClick={close}><Icon d={CLOSE} size={16} /></button></div>
            <div className="modal-body">
              {error && <div className="login-error" style={{ marginBottom: 12 }}>{error}</div>}
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                Delete <strong style={{ color: 'var(--text-primary)' }}>{selected?.title}</strong>?
                {' '}If copies are checked out, the book will be deactivated instead.
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={close}>Cancel</button>
              <button className="btn btn-danger" onClick={handleDelete} disabled={saving}>{saving ? 'Deleting…' : 'Delete'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}