import React, { useState } from 'react';
import './SuperAdminLogin.css';

const SuperAdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);

  const onSubmit = (e) => {
    e.preventDefault();
    window.location.hash = '#/su/dashboard';
  };

  return (
    <div className="superadmin-login-page">
      <div className="superadmin-card">
        <h1 className="superadmin-title">SuperAdmin Login</h1>
        <form onSubmit={onSubmit} className="superadmin-form" autoComplete="on">
          <label className="superadmin-label" htmlFor="email">Email</label>
          <div className="superadmin-input-wrap">
            <span className="superadmin-input-icon" aria-hidden>✉️</span>
            <input
              id="email"
              type="email"
              className="superadmin-input"
              placeholder="Enter Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              
            />
          </div>

          <label className="superadmin-label" htmlFor="password">Password</label>
          <div className="superadmin-input-wrap">
            <span className="superadmin-input-icon" aria-hidden>🔒</span>
            <input
              id="password"
              type="password"
              className="superadmin-input"
              placeholder="Enter Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              
            />
          </div>

          <div className="superadmin-remember">
            <label className="superadmin-checkbox">
              <input type="checkbox" checked={remember} onChange={(e)=> setRemember(e.target.checked)} />
              <span>Remember me</span>
            </label>
          </div>

          <button type="submit" className="superadmin-button">Login</button>
        </form>
      </div>
    </div>
  );
};

export default SuperAdminLogin;
