import React from 'react';
import './AdminDashboard.css';
import { IconHome, IconBuilding, IconCalendar, IconReport, IconGlobe, IconSearch, IconEye, IconCheck, IconTrash, IconEdit } from './icons';

// Dummy data
const DUMMY_USERS = [
  { id: 1, name: 'Alice Johnson', email: 'alice@pmftci.edu', role: 'Admin', joined: 'Jan 5, 2025' },
  { id: 2, name: 'Bob Smith', email: 'bob@pmftci.edu', role: 'Editor', joined: 'Feb 11, 2025' },
  { id: 3, name: 'Carla Reyes', email: 'carla@pmftci.edu', role: 'Viewer', joined: 'Mar 1, 2025' },
  { id: 4, name: 'David Cruz', email: 'david@pmftci.edu', role: 'Admin', joined: 'Mar 18, 2025' },
];

const DUMMY_INCOMING_FACILITIES = [
  { id: 101, name: 'North Gate', type: 'Gate', submittedBy: 'admin01', submittedAt: 'Apr 2, 2025' },
  { id: 102, name: 'Registrar Annex', type: 'Office', submittedBy: 'admin02', submittedAt: 'Apr 9, 2025' },
  { id: 103, name: 'Room 305', type: 'Room', submittedBy: 'admin03', submittedAt: 'Apr 16, 2025' },
];

const DUMMY_REPORTS = [
  { id: 201, title: 'Projector not working', category: 'Maintenance', from: 'admin02', created: 'May 4, 2025', status: 'Open' },
  { id: 202, title: 'Unauthorized entry', category: 'Incident', from: 'admin01', created: 'May 7, 2025', status: 'In Review' },
  { id: 203, title: 'Library AC issue', category: 'Maintenance', from: 'admin04', created: 'May 10, 2025', status: 'Resolved' },
];

const DUMMY_FEEDBACKS = [
  { id: 301, subject: 'Great response time!', from: 'admin03', created: 'Jun 1, 2025', priority: 'Low' },
  { id: 302, subject: 'Need better guidelines for events', from: 'admin02', created: 'Jun 3, 2025', priority: 'Medium' },
  { id: 303, subject: 'Request for more training', from: 'admin01', created: 'Jun 9, 2025', priority: 'High' },
];

const Sidebar = ({ route }) => {
  const isActive = (r) => (route === r ? 'ad-nav-item active' : 'ad-nav-item');
  return (
    <aside className="ad-sidebar">
      <div className="ad-brand">
        <div className="ad-logo"><IconGlobe size={22} stroke="#eaf2ff" /></div>
        <div className="ad-brand-text">
          <span className="ad-brand-top">PMFTCI</span>
          <span className="ad-brand-bottom">360</span>
        </div>
      </div>
      <nav className="ad-nav">
        <a className={isActive('#/su/dashboard')} href="#/su/dashboard">
          <span className="ad-nav-ico"><IconHome size={20} stroke="#eaf2ff" /></span>
          <span>Dashboard</span>
        </a>
        <a className={isActive('#/su/users')} href="#/su/users">
          <span className="ad-nav-ico"><IconCalendar size={20} stroke="#eaf2ff" /></span>
          <span>Users</span>
        </a>
        <a className={isActive('#/su/facilities')} href="#/su/facilities">
          <span className="ad-nav-ico"><IconBuilding size={20} stroke="#eaf2ff" /></span>
          <span>Facilities</span>
        </a>
        <a className={isActive('#/su/reports')} href="#/su/reports">
          <span className="ad-nav-ico"><IconReport size={20} stroke="#eaf2ff" /></span>
          <span>Reports</span>
        </a>
        <a className={isActive('#/su/feedbacks')} href="#/su/feedbacks">
          <span className="ad-nav-ico"><IconReport size={20} stroke="#eaf2ff" /></span>
          <span>Feedbacks</span>
        </a>
      </nav>
    </aside>
  );
};

const HeaderBar = ({ title }) => {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef(null);

  React.useEffect(() => {
    const onDocClick = (e) => {
      if (!ref.current) return;
      if (!ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, []);

  return (
    <header className="ad-header">
      <h1 className="ad-title">{title}</h1>
      <div className="ad-profile-wrap" ref={ref}>
        <span className="ad-profile">Hi, SuperAdmin <button className="ad-avatar" aria-label="Open menu" onClick={() => setOpen((v) => !v)} /></span>
        {open && (
          <div className="ad-menu">
            <button className="ad-menu-item danger" type="button" onClick={() => { window.location.hash = '#/su/dashboard'; setOpen(false); }}>Logout</button>
          </div>
        )}
      </div>
    </header>
  );
};

const Stat = ({ title, value, icon, variant = 'indigo' }) => (
  <div className={`ad-stat ${variant}`}>
    <div className={`ad-stat-ico ${variant}`} aria-hidden>{icon}</div>
    <div className="ad-stat-body">
      <div className="ad-stat-title">{title}</div>
      <div className="ad-stat-value">{value}</div>
    </div>
  </div>
);

const SearchBox = ({ placeholder, value, onChange }) => (
  <div className="ad-search">
    <span className="ad-search-ico" aria-hidden>
      <IconSearch size={16} />
    </span>
    <input
      className="ad-search-input"
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  </div>
);

const UsersView = () => {
  const [query, setQuery] = React.useState('');
  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return DUMMY_USERS;
    return DUMMY_USERS.filter(u =>
      u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.role.toLowerCase().includes(q)
    );
  }, [query]);

  return (
    <section className="ad-section">
      <h2 className="ad-section-title">Users</h2>
      <SearchBox placeholder="Search users" value={query} onChange={setQuery} />
      <div className="ad-table-card">
        <table className="ad-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Joined</th>
              <th className="ad-col-actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((u) => (
              <tr key={u.id}>
                <td>{u.name}</td>
                <td>{u.email}</td>
                <td>{u.role}</td>
                <td>{u.joined}</td>
                <td className="ad-actions">
                  <button className="ad-icon-btn" title="View" type="button"><IconEye size={16} /></button>
                  <button className="ad-icon-btn" title="Edit" type="button"><IconEdit size={16} /></button>
                  <button className="ad-icon-btn danger" title="Delete" type="button"><IconTrash size={16} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};

const FacilitiesInboxView = () => {
  const [query, setQuery] = React.useState('');
  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return DUMMY_INCOMING_FACILITIES;
    return DUMMY_INCOMING_FACILITIES.filter(f =>
      f.name.toLowerCase().includes(q) || f.type.toLowerCase().includes(q) || f.submittedBy.toLowerCase().includes(q)
    );
  }, [query]);

  return (
    <section className="ad-section">
      <h2 className="ad-section-title">Incoming Facilities (from Admin)</h2>
      <SearchBox placeholder="Search facilities" value={query} onChange={setQuery} />
      <div className="ad-table-card">
        <table className="ad-table">
          <thead>
            <tr>
              <th>Facility Name</th>
              <th>Type</th>
              <th>Submitted By</th>
              <th>Submitted At</th>
              <th className="ad-col-actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((f) => (
              <tr key={f.id}>
                <td>{f.name}</td>
                <td>{f.type}</td>
                <td>{f.submittedBy}</td>
                <td>{f.submittedAt}</td>
                <td className="ad-actions">
                  <button className="ad-icon-btn" title="View" type="button"><IconEye size={16} /></button>
                  <button className="ad-icon-btn" title="Approve" type="button"><IconCheck size={16} /></button>
                  <button className="ad-icon-btn danger" title="Reject" type="button"><IconTrash size={16} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};

const ReportsView = () => {
  const [query, setQuery] = React.useState('');
  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return DUMMY_REPORTS;
    return DUMMY_REPORTS.filter(r =>
      r.title.toLowerCase().includes(q) || r.category.toLowerCase().includes(q) || r.from.toLowerCase().includes(q) || r.status.toLowerCase().includes(q)
    );
  }, [query]);

  return (
    <section className="ad-section">
      <h2 className="ad-section-title">Reports (from Admin)</h2>
      <SearchBox placeholder="Search reports" value={query} onChange={setQuery} />
      <div className="ad-table-card">
        <table className="ad-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Category</th>
              <th>From</th>
              <th>Created</th>
              <th>Status</th>
              <th className="ad-col-actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.id}>
                <td>{r.title}</td>
                <td>{r.category}</td>
                <td>{r.from}</td>
                <td>{r.created}</td>
                <td>{r.status}</td>
                <td className="ad-actions">
                  <button className="ad-icon-btn" title="View" type="button"><IconEye size={16} /></button>
                  <button className="ad-icon-btn" title="Mark Resolved" type="button"><IconCheck size={16} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};

const FeedbacksView = () => {
  const [query, setQuery] = React.useState('');
  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return DUMMY_FEEDBACKS;
    return DUMMY_FEEDBACKS.filter(f =>
      f.subject.toLowerCase().includes(q) || f.from.toLowerCase().includes(q) || f.priority.toLowerCase().includes(q)
    );
  }, [query]);

  return (
    <section className="ad-section">
      <h2 className="ad-section-title">Feedbacks</h2>
      <SearchBox placeholder="Search feedbacks" value={query} onChange={setQuery} />
      <div className="ad-table-card">
        <table className="ad-table">
          <thead>
            <tr>
              <th>Subject</th>
              <th>From</th>
              <th>Created</th>
              <th>Priority</th>
              <th className="ad-col-actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((f) => (
              <tr key={f.id}>
                <td>{f.subject}</td>
                <td>{f.from}</td>
                <td>{f.created}</td>
                <td>{f.priority}</td>
                <td className="ad-actions">
                  <button className="ad-icon-btn" title="View" type="button"><IconEye size={16} /></button>
                  <button className="ad-icon-btn" title="Acknowledge" type="button"><IconCheck size={16} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};

const SuperAdmin = () => {
  const [route, setRoute] = React.useState(window.location.hash || '#/su/dashboard');

  React.useEffect(() => {
    if (!window.location.hash) window.location.hash = '#/su/dashboard';
    const onHashChange = () => setRoute(window.location.hash || '#/su/dashboard');
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const renderContent = () => {
    switch (route) {
      case '#/su/users':
        return (<><HeaderBar title="Users" /><UsersView /></>);
      case '#/su/facilities':
        return (<><HeaderBar title="Facilities Inbox" /><FacilitiesInboxView /></>);
      case '#/su/reports':
        return (<><HeaderBar title="Reports" /><ReportsView /></>);
      case '#/su/feedbacks':
        return (<><HeaderBar title="Feedbacks" /><FeedbacksView /></>);
      default:
        return (
          <>
            <HeaderBar title="SuperAdmin Dashboard" />
            <section className="ad-stats">
              <Stat title="Users" value={String(DUMMY_USERS.length)} icon={<IconCalendar />} variant="indigo" />
              <Stat title="Facilities Inbox" value={String(DUMMY_INCOMING_FACILITIES.length)} icon={<IconBuilding />} variant="emerald" />
              <Stat title="Reports" value={String(DUMMY_REPORTS.length)} icon={<IconReport />} variant="amber" />
            </section>

            <section className="ad-section">
              <h2 className="ad-section-title">Recent Activities</h2>
              <div className="ad-activity">
                <div className="ad-activity-item">Approved facility "North Gate" - 10:12am</div>
                <div className="ad-activity-item">Resolved report "Projector not working" - 9:35am</div>
              </div>
            </section>
          </>
        );
    }
  };

  return (
    <div className="ad-layout">
      <Sidebar route={route} />
      <main className="ad-main">{renderContent()}</main>
    </div>
  );
};

export default SuperAdmin;
