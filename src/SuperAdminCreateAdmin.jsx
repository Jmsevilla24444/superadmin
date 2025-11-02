import React from 'react';
import './AdminDashboard.css';
import { IconPlus, IconMail, IconLock } from './icons';

const Field = ({ label, children }) => (
  <div>
    <div className="ad-label">{label}</div>
    {children}
  </div>
);

const SuperAdminCreateAdmin = () => {
  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [confirm, setConfirm] = React.useState('');

  const [submitting, setSubmitting] = React.useState(false);
  const canSubmit = name && email && password && confirm && password === confirm;

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      // Placeholder submit. Replace with real API call.
      await new Promise((r) => setTimeout(r, 700));
      alert('Admin account created successfully for ' + name + ' (email: ' + email + ').');
      // Optionally navigate to users list
      window.location.hash = '#/su/users';
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="ad-section">
      <h2 className="ad-section-title">Create Admin Account</h2>
      <form className="ad-form ad-add" onSubmit={onSubmit}>
        <div className="ad-form-grid">
          <div className="ad-form-left">
            <Field label="Full Name">
              <input
                className="ad-input"
                type="text"
                placeholder="e.g. Jane Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </Field>

            <Field label="Email">
              <div style={{ position: 'relative' }}>
                <span className="ad-search-ico" aria-hidden><IconMail size={16} /></span>
                <input
                  className="ad-input"
                  type="email"
                  placeholder="jane@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{ paddingLeft: 40 }}
                />
              </div>
            </Field>

            <Field label="Password">
              <div style={{ position: 'relative' }}>
                <span className="ad-search-ico" aria-hidden><IconLock size={16} /></span>
                <input
                  className="ad-input"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ paddingLeft: 40 }}
                />
              </div>
            </Field>

            <Field label="Confirm Password">
              <div style={{ position: 'relative' }}>
                <span className="ad-search-ico" aria-hidden><IconLock size={16} /></span>
                <input
                  className="ad-input"
                  type="password"
                  placeholder="Repeat password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  style={{ paddingLeft: 40 }}
                />
              </div>
            </Field>
            
          </div>
          
        </div>

        <div className="ad-form-actions">
          <button className="ad-btn ad-btn-primary" type="submit" disabled={!canSubmit || submitting}>
            <span className="ad-btn-ico"><IconPlus size={16} stroke="#fff" /></span>
            {submitting ? 'Creating...' : 'Create Admin'}
          </button>
        </div>
      </form>
    </section>
  );
};

export default SuperAdminCreateAdmin;
