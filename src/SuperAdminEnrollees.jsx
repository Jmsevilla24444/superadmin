import React from 'react';
import './AdminDashboard.css';
import { IconSearch, IconEye, IconTrash, IconCheck } from './icons';
import { DUMMY_ENROLLEES } from './data';

const SearchBox = ({ placeholder, value, onChange }) => (
  <div className="ad-search">
    <span className="ad-search-ico" aria-hidden>
      <IconSearch size={16} />
    </span>
    <input className="ad-search-input" placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} />
  </div>
);

const Modal = ({ open, onClose, children }) => {
  if (!open) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
      <div style={{ width: 520, maxWidth: '92vw', background: '#fff', borderRadius: 12, boxShadow: '0 20px 40px rgba(0,0,0,.18)', border: '1px solid #e5e7eb' }}>
        <div style={{ padding: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #eef2f7' }}>
          <h3 style={{ margin: 0, fontSize: 18, color: '#111827' }}>Review Student Credentials</h3>
          <button type="button" className="ad-icon-btn" onClick={onClose} aria-label="Close modal">✕</button>
        </div>
        <div style={{ padding: 16 }}>{children}</div>
      </div>
    </div>
  );
};

const SuperAdminEnrollees = () => {
  const [query, setQuery] = React.useState('');
  const [items, setItems] = React.useState(DUMMY_ENROLLEES);
  const [viewing, setViewing] = React.useState(null);
  const [confirmId, setConfirmId] = React.useState(null);
  const [approveConfirmId, setApproveConfirmId] = React.useState(null);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(u =>
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      String(u.studentId).toLowerCase().includes(q)
    );
  }, [items, query]);

  const approve = (id) => {
    // In real app, call backend approve API then remove from list
    setItems(prev => prev.filter(x => x.id !== id));
    setViewing(null);
  };
  const remove = (id) => setItems(prev => prev.filter(x => x.id !== id));

  return (
    <section className="ad-section">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h2 className="ad-section-title" style={{ marginBottom: 8 }}>New Enrollees</h2>
        <div className="ad-form-actions">
          <button className="ad-btn" type="button" onClick={() => (window.location.hash = '#/su/users')}>Back to Users</button>
        </div>
      </div>

      <SearchBox placeholder="Search by name, email, or student ID" value={query} onChange={setQuery} />

      <div className="ad-table-card" style={{ marginTop: 10 }}>
        <table className="ad-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Student ID</th>
              <th>Submitted</th>
              <th className="ad-col-actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(u => (
              <tr key={u.id}>
                <td>{u.name}</td>
                <td>{u.email}</td>
                <td>{u.studentId}</td>
                <td>{u.submittedAt}</td>
                <td className="ad-actions">
                  <button className="ad-icon-btn" title="View" type="button" onClick={() => setViewing(u)}><IconEye size={16} /></button>
                  <button className="ad-icon-btn danger" title="Delete" type="button" onClick={() => setConfirmId(u.id)}><IconTrash size={16} /></button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} style={{ color: '#6b7280', padding: 18 }}>No enrollees found.</td>
              </tr>
            )}

  {approveConfirmId !== null && (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 65 }}>
      <div style={{ width: 420, maxWidth: '92vw', background: '#fff', borderRadius: 12, boxShadow: '0 20px 40px rgba(0,0,0,.18)', border: '1px solid #e5e7eb' }}>
        <div style={{ padding: 16, borderBottom: '1px solid #eef2f7' }}>
          <h3 style={{ margin: 0, fontSize: 18, color: '#111827' }}>Confirm Approval</h3>
        </div>
        <div style={{ padding: 16, color: '#374151' }}>
          Approve this enrollee and move them forward? This action cannot be undone.
        </div>
        <div className="ad-form-actions" style={{ justifyContent: 'flex-end', padding: 16 }}>
          <button className="ad-btn" type="button" onClick={() => setApproveConfirmId(null)}>Cancel</button>
          <button className="ad-btn ad-btn-primary" type="button" onClick={() => { approve(approveConfirmId); setApproveConfirmId(null); }}>
            Approve
          </button>
        </div>
      </div>
    </div>
  )}
          </tbody>
        </table>
      </div>

      <Modal open={!!viewing} onClose={() => setViewing(null)}>
        {viewing && (
          <div style={{ display: 'grid', gap: 12 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <div className="ad-label">Full Name</div>
                <div>{viewing.name}</div>
              </div>
              <div>
                <div className="ad-label">Email</div>
                <div>{viewing.email}</div>
              </div>
              <div>
                <div className="ad-label">Student ID</div>
                <div style={{ fontWeight: 700 }}>{viewing.studentId}</div>
              </div>
              <div>
                <div className="ad-label">Submitted</div>
                <div>{viewing.submittedAt}</div>
              </div>
            </div>
            <div>
              <div className="ad-label">Uploaded ID (preview)</div>
              <div style={{ width: '100%', height: 180, border: '1px dashed #cbd5e1', borderRadius: 8, background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
                {viewing.idImage ? (
                  <img alt="Student ID" src={viewing.idImage} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                ) : (
                  <span>No image provided</span>
                )}
              </div>
            </div>
            <div className="ad-form-actions" style={{ justifyContent: 'flex-end' }}>
              <button className="ad-btn" type="button" onClick={() => setViewing(null)}>Close</button>
              <button className="ad-btn ad-btn-primary" type="button" onClick={() => setApproveConfirmId(viewing.id)}>
                <span className="ad-btn-ico"><IconCheck size={16} stroke="#fff" /></span>
                Approve
              </button>
            </div>
          </div>
        )}
      </Modal>

      {confirmId !== null && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 60 }}>
          <div style={{ width: 420, maxWidth: '92vw', background: '#fff', borderRadius: 12, boxShadow: '0 20px 40px rgba(0,0,0,.18)', border: '1px solid #e5e7eb' }}>
            <div style={{ padding: 16, borderBottom: '1px solid #eef2f7' }}>
              <h3 style={{ margin: 0, fontSize: 18, color: '#111827' }}>Confirm Deletion</h3>
            </div>
            <div style={{ padding: 16, color: '#374151' }}>
              Are you sure you want to delete this enrollee record? This action cannot be undone.
            </div>
            <div className="ad-form-actions" style={{ justifyContent: 'flex-end', padding: 16 }}>
              <button className="ad-btn" type="button" onClick={() => setConfirmId(null)}>Cancel</button>
              <button className="ad-btn ad-btn-primary" type="button" onClick={() => { remove(confirmId); setConfirmId(null); }}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default SuperAdminEnrollees;
