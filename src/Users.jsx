import React from 'react';
import './AdminDashboard.css';
import { IconSearch, IconTrash, IconMail } from './icons';
import { DUMMY_USERS } from './data';

const SearchBox = ({ placeholder, value, onChange }) => (
  <div className="ad-search">
    <span className="ad-search-ico" aria-hidden> 
      <IconSearch size={16} />
    </span>
    <input className="ad-search-input" placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} />
  </div>
);

const Users = () => {
  const [items, setItems] = React.useState(DUMMY_USERS);
  const [query, setQuery] = React.useState('');
  const [confirmId, setConfirmId] = React.useState(null);
  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(u => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.role.toLowerCase().includes(q));
  }, [items, query]);

  const roleClass = (role) => {
    const r = String(role).toLowerCase();
    if (r === 'admin') return 'ad-badge purple';
    if (r === 'student') return 'ad-badge cyan';
    if (r === 'parents') return 'ad-badge emerald';
    return 'ad-badge gray';
  };

  // Role filter chips
  const [roleFilter, setRoleFilter] = React.useState('all'); // 'all' | 'admin' | 'student' | 'parents'
  const filteredByRole = React.useMemo(() => {
    if (roleFilter === 'all') return filtered;
    return filtered.filter(u => String(u.role).toLowerCase() === roleFilter);
  }, [filtered, roleFilter]);

  // Sorting
  const [sortKey, setSortKey] = React.useState('name');
  const [sortDir, setSortDir] = React.useState('asc');
  const toggleSort = (key) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(key); setSortDir('asc'); }
  };
  const sorted = React.useMemo(() => {
    const arr = [...filteredByRole];
    const dir = sortDir === 'asc' ? 1 : -1;
    arr.sort((a,b) => {
      const av = String(a[sortKey] ?? '').toLowerCase();
      const bv = String(b[sortKey] ?? '').toLowerCase();
      if (av < bv) return -1 * dir;
      if (av > bv) return 1 * dir;
      return 0;
    });
    return arr;
  }, [filteredByRole, sortKey, sortDir]);
  const caret = (key) => sortKey === key ? (sortDir === 'asc' ? ' ▲' : ' ▼') : '';

  const doDelete = (id) => {
    setItems(prev => prev.filter(u => u.id !== id));
    setConfirmId(null);
  };

  return (
    <section className="ad-section">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h2 className="ad-section-title" style={{ marginBottom: 8 }}>Users</h2>
        <div className="ad-form-actions">
          <button className="ad-btn ad-btn-accent" type="button" onClick={() => (window.location.hash = '#/su/enrollees')}>
            <span className="ad-btn-ico"><IconMail size={16} stroke="#fff" /></span>
            Enrollees
          </button>
        </div>

      {confirmId !== null && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ width: 420, maxWidth: '92vw', background: '#fff', borderRadius: 12, boxShadow: '0 20px 40px rgba(0,0,0,.18)', border: '1px solid #e5e7eb' }}>
            <div style={{ padding: 16, borderBottom: '1px solid #eef2f7' }}>
              <h3 style={{ margin: 0, fontSize: 18, color: '#111827' }}>Confirm Deletion</h3>
            </div>
            <div style={{ padding: 16, color: '#374151' }}>
              Are you sure you want to delete this user? This action cannot be undone.
            </div>
            <div className="ad-form-actions" style={{ justifyContent: 'flex-end', padding: 16 }}>
              <button className="ad-btn" type="button" onClick={() => setConfirmId(null)}>Cancel</button>
              <button className="ad-btn ad-btn-primary" type="button" onClick={() => doDelete(confirmId)}>Delete</button>
            </div>
          </div>
        </div>
      )}
      </div>
      <SearchBox placeholder="Search users" value={query} onChange={setQuery} />
      <div className="ad-filter-row" role="group" aria-label="Role filters">
        <button type="button" className={`ad-chip ${roleFilter==='all'?'active':''} gray`} onClick={()=>setRoleFilter('all')}><span className="dot"/>All</button>
        <button type="button" className={`ad-chip ${roleFilter==='admin'?'active':''} purple`} onClick={()=>setRoleFilter('admin')}><span className="dot"/>Admin</button>
        <button type="button" className={`ad-chip ${roleFilter==='student'?'active':''} cyan`} onClick={()=>setRoleFilter('student')}><span className="dot"/>Student</button>
        <button type="button" className={`ad-chip ${roleFilter==='parents'?'active':''} emerald`} onClick={()=>setRoleFilter('parents')}><span className="dot"/>Parents</button>
      </div>
      <div className="ad-sort-row">
        <span style={{ color:'#6b7280', fontWeight:600 }}>Sort:</span>
        <select
          className="ad-select"
          value={`${sortKey}:${sortDir}`}
          onChange={(e)=>{
            const [k,d] = e.target.value.split(':');
            setSortKey(k); setSortDir(d);
          }}
        >
          <option value="name:asc">Name A–Z</option>
          <option value="name:desc">Name Z–A</option>
          <option value="email:asc">Email A–Z</option>
          <option value="email:desc">Email Z–A</option>
          <option value="joined:desc">Joined Newest</option>
          <option value="joined:asc">Joined Oldest</option>
        </select>
      </div>
      <div className="ad-table-card">
        <table className="ad-table">
          <thead>
            <tr>
              <th><button type="button" className="ad-th-btn" onClick={() => toggleSort('name')}>Name{caret('name')}</button></th>
              <th><button type="button" className="ad-th-btn" onClick={() => toggleSort('email')}>Email{caret('email')}</button></th>
              <th><button type="button" className="ad-th-btn" onClick={() => toggleSort('role')}>Role{caret('role')}</button></th>
              <th><button type="button" className="ad-th-btn" onClick={() => toggleSort('joined')}>Joined{caret('joined')}</button></th>
              <th className="ad-col-actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map(u => (
              <tr key={u.id}>
                <td>{u.name}</td>
                <td>{u.email}</td>
                <td><span className={roleClass(u.role)}>{u.role}</span></td>
                <td>{u.joined}</td>
                <td className="ad-actions">
                  <button className="ad-icon-btn danger" title="Delete" type="button" onClick={() => setConfirmId(u.id)}><IconTrash size={16} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default Users;
