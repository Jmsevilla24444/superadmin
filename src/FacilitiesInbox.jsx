import React from 'react';
import './AdminDashboard.css';
import { IconSearch, IconEye, IconCheck, IconTrash } from './icons';
import { DUMMY_INCOMING_FACILITIES } from './data';

const SearchBox = ({ placeholder, value, onChange }) => (
  <div className="ad-search">
    <span className="ad-search-ico" aria-hidden>
      <IconSearch size={16} />
    </span>
    <input className="ad-search-input" placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} />
  </div>
);

const FacilitiesInbox = () => {
  const [query, setQuery] = React.useState('');
  const [items, setItems] = React.useState(DUMMY_INCOMING_FACILITIES);
  const [confirmId, setConfirmId] = React.useState(null);
  const [approveId, setApproveId] = React.useState(null);
  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(f => f.name.toLowerCase().includes(q) || f.type.toLowerCase().includes(q) || f.submittedBy.toLowerCase().includes(q));
  }, [items, query]);

  // Type filter chips
  const typeOptions = React.useMemo(() => {
    const set = new Set(items.map(f => f.type));
    return ['All', ...Array.from(set)];
  }, [items]);
  const [typeFilter, setTypeFilter] = React.useState('All');
  const filteredByType = React.useMemo(() => {
    if (typeFilter === 'All') return filtered;
    return filtered.filter(f => f.type === typeFilter);
  }, [filtered, typeFilter]);

  // Sorting
  const [sortKey, setSortKey] = React.useState('name');
  const [sortDir, setSortDir] = React.useState('asc');
  const toggleSort = (key) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };
  const caret = (key) => sortKey === key ? (sortDir === 'asc' ? ' ▲' : ' ▼') : '';
  const sorted = React.useMemo(() => {
    const arr = [...filteredByType];
    const dir = sortDir === 'asc' ? 1 : -1;
    arr.sort((a,b) => {
      const val = (o) => (key => {
        if (key === 'submittedAt') return new Date(o.submittedAt).getTime();
        return String(o[key] ?? '').toLowerCase();
      })(sortKey);
      const av = val(a), bv = val(b);
      if (av < bv) return -1 * dir;
      if (av > bv) return 1 * dir;
      return 0;
    });
    return arr;
  }, [filteredByType, sortKey, sortDir]);

  return (
    <section className="ad-section">
      <h2 className="ad-section-title">Incoming Facilities (from Admin)</h2>
      <SearchBox placeholder="Search facilities" value={query} onChange={setQuery} />
      <div className="ad-filter-row" role="group" aria-label="Type filters">
        {typeOptions.map((t) => (
          <button
            key={t}
            type="button"
            className={`ad-chip ${typeFilter===t?'active':''} ${t==='All'?'gray':'emerald'}`}
            onClick={() => setTypeFilter(t)}
          >
            <span className="dot" />{t}
          </button>
        ))}
      </div>
      {approveId !== null && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 60 }}>
          <div style={{ width: 420, maxWidth: '92vw', background: '#fff', borderRadius: 12, boxShadow: '0 20px 40px rgba(0,0,0,.18)', border: '1px solid #e5e7eb' }}>
            <div style={{ padding: 16, borderBottom: '1px solid #eef2f7' }}>
              <h3 style={{ margin: 0, fontSize: 18, color: '#111827' }}>Confirm Approval</h3>
            </div>
            <div style={{ padding: 16, color: '#374151' }}>
              Approve this facility submission? This will move it out of the inbox.
            </div>
            <div className="ad-form-actions" style={{ justifyContent: 'flex-end', padding: 16 }}>
              <button className="ad-btn" type="button" onClick={() => setApproveId(null)}>Cancel</button>
              <button className="ad-btn ad-btn-primary" type="button" onClick={() => { setItems(prev => prev.filter(x => x.id !== approveId)); setApproveId(null); }}>Approve</button>
            </div>
          </div>
        </div>
      )}
      <div className="ad-table-card">
        <table className="ad-table">
          <thead>
            <tr>
              <th><button type="button" className="ad-th-btn" onClick={() => toggleSort('name')}>Facility Name{caret('name')}</button></th>
              <th><button type="button" className="ad-th-btn" onClick={() => toggleSort('type')}>Type{caret('type')}</button></th>
              <th><button type="button" className="ad-th-btn" onClick={() => toggleSort('submittedBy')}>Submitted By{caret('submittedBy')}</button></th>
              <th><button type="button" className="ad-th-btn" onClick={() => toggleSort('submittedAt')}>Submitted At{caret('submittedAt')}</button></th>
              <th className="ad-col-actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map(f => (
              <tr key={f.id}>
                <td>{f.name}</td>
                <td>{f.type}</td>
                <td>{f.submittedBy}</td>
                <td>{f.submittedAt}</td>
                <td className="ad-actions">
                  <button className="ad-icon-btn" title="View" type="button"><IconEye size={16} /></button>
                  <button className="ad-icon-btn" title="Approve" type="button" onClick={() => setApproveId(f.id)}><IconCheck size={16} /></button>
                  <button className="ad-icon-btn danger" title="Reject" type="button" onClick={() => setConfirmId(f.id)}><IconTrash size={16} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {confirmId !== null && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 60 }}>
          <div style={{ width: 420, maxWidth: '92vw', background: '#fff', borderRadius: 12, boxShadow: '0 20px 40px rgba(0,0,0,.18)', border: '1px solid #e5e7eb' }}>
            <div style={{ padding: 16, borderBottom: '1px solid #eef2f7' }}>
              <h3 style={{ margin: 0, fontSize: 18, color: '#111827' }}>Confirm Rejection</h3>
            </div>
            <div style={{ padding: 16, color: '#374151' }}>
              Are you sure you want to reject this facility submission? This action cannot be undone.
            </div>
            <div className="ad-form-actions" style={{ justifyContent: 'flex-end', padding: 16 }}>
              <button className="ad-btn" type="button" onClick={() => setConfirmId(null)}>Cancel</button>
              <button className="ad-btn ad-btn-primary" type="button" onClick={() => { setItems(prev => prev.filter(x => x.id !== confirmId)); setConfirmId(null); }}>Reject</button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default FacilitiesInbox;
