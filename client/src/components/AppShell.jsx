import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { request } from '../api/request';
import NotificationBell from './NotificationBell';
import Toasts from './Toasts';

export function AppShell({ children }) {
  const { user, logout } = useAuth();
  const isAdmin = ['admin', 'superAdmin'].includes(user?.role);
  const isUser = user && !isAdmin;
  const [maintenance, setMaintenance] = useState(null);

  useEffect(() => {
    request('/api/settings/maintenance')
      .then(setMaintenance)
      .catch(() => setMaintenance(null));
  }, []);

  if (!user) {
    return (
      <div className="site-shell">
        <header className="public-header">
          <Link to="/" className="brand-block brand-inline">
            <div className="brand-mark">P</div>
            <div>
              <div className="brand-name">ParkSy</div>
              <div className="brand-subtitle">School, Mall & Enterprise Parking</div>
            </div>
          </Link>

          <nav className="public-nav" aria-label="Primary">
            <Link to="/#how-it-works">How it works</Link>
            <Link to="/#solutions">Solutions</Link>
            <Link to="/notifications">Notifications</Link>
            <Link to="/login" className="public-nav-cta">Login</Link>
          </nav>
        </header>

        {maintenance?.enabled ? (
          <div className="public-banner">
            <strong>Maintenance mode</strong>
            <p>{maintenance.message}</p>
          </div>
        ) : null}

        <main className="main-pane public-main">{children}</main>
        <Toasts />
      </div>
    );
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        {maintenance?.enabled ? (
          <div className="notice-card" style={{ marginBottom: 16 }}>
            <strong>Maintenance mode</strong>
            <p style={{ margin: '6px 0 0' }}>{maintenance.message}</p>
          </div>
        ) : null}
        <div className="brand-block">
          <div className="brand-mark">P</div>
          <div>
            <div className="brand-name">ParkSy</div>
            <div className="brand-subtitle">School, Mall & Enterprise Parking</div>
          </div>
          <div style={{ marginLeft: 'auto' }}>
            <NotificationBell />
          </div>
        </div>

        <nav className="sidebar-nav">
          <Link to="/">Home</Link>
          <Link to="/#how-it-works">How it works</Link>
          <Link to="/#solutions">Solutions</Link>
          <Link to="/notifications">Notifications</Link>
          <Link to="/analytics">Analytics</Link>
          <Link to="/reports">Reports</Link>
          <Link to="/passes">Passes</Link>
          <Link to="/security/logs">Security Logs</Link>
          <Link to="/security/blocked">Blocked Vehicles</Link>
          {isAdmin ? <Link to="/users">Users</Link> : null}
          {isAdmin ? <Link to="/settings">Settings</Link> : null}
          {user ? (
            <>
              <Link to={isAdmin ? '/dashboard' : '/user-panel'}>Dashboard</Link>
              {isUser ? <Link to="/profile">Profile</Link> : null}
              <button className="ghost-button" onClick={logout}>Logout</button>
            </>
          ) : (
            <>
              <Link to="/login">Login</Link>
              <Link to="/register">Register</Link>
            </>
          )}
        </nav>
      </aside>

      <main className="main-pane">{children}</main>
      <Toasts />
    </div>
  );
}