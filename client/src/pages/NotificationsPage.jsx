import React, { useEffect, useState } from 'react';
import { request } from '../api/request';
import { useAuth } from '../context/AuthContext';

export function NotificationsPage() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState({ read: 'any', type: '' });
  const [meta, setMeta] = useState(null);

  async function load(page = 1) {
    setLoading(true);
    try {
      const q = [];
      if (filter.read === 'true' || filter.read === 'false') q.push(`read=${filter.read}`);
      if (filter.type) q.push(`type=${encodeURIComponent(filter.type)}`);
      q.push(`page=${page}`);
      const qstr = q.length ? `?${q.join('&')}` : '';
      const res = await request(`/api/notifications${qstr}`);
      setItems(res.notifications || []);
      setMeta(res.meta || null);
    } catch (err) {
      console.error('load notifications', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { if (user) load(1); }, [user, filter]);

  async function markRead(id) {
    try {
      await request(`/api/notifications/${id}/read`, { method: 'POST' });
      setItems((s) => s.map((n) => (n._id === id ? { ...n, read: true } : n)));
    } catch (err) { console.error(err); }
  }

  return (
    <div className="page-stack notifications-page">
      <header className="page-header">
        <div>
          <span className="eyebrow">Notifications</span>
          <h2>Your notifications</h2>
        </div>
      </header>

      <div className="table-card notification-card">
        <div className="notification-controls">
          <label className="field" style={{ marginBottom: 0 }}>
            <span>Read</span>
            <select value={filter.read} onChange={(e) => setFilter((f) => ({ ...f, read: e.target.value }))}>
              <option value="any">Any</option>
              <option value="false">Unread</option>
              <option value="true">Read</option>
            </select>
          </label>
          <label className="field" style={{ marginBottom: 0 }}>
            <span>Type</span>
            <input placeholder="e.g. booking:created" value={filter.type} onChange={(e) => setFilter((f) => ({ ...f, type: e.target.value }))} />
          </label>
          <div className="notification-footer">
            <button className="secondary-button" onClick={() => load(1)}>Refresh</button>
          </div>
        </div>

        {loading ? <div className="spinner" /> : (
          <div>
            {items.length ? items.map((n) => (
              <article key={n._id} className={`slot-card notification-item ${n.read ? 'read' : 'unread'}`}>
                <div className="notification-head">
                  <div>
                    <strong>{n.title || n.type}</strong>
                    <div style={{ color: 'var(--muted)' }}>{n.body}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 12, color: 'var(--muted)' }}>{new Date(n.createdAt).toLocaleString()}</div>
                    {!n.read ? <button className="primary-button" style={{ marginTop: 8 }} onClick={() => markRead(n._id)}>Mark read</button> : null}
                  </div>
                </div>
              </article>
            )) : <div className="empty">No notifications</div>}

            {meta && meta.total > meta.perPage ? (
              <div className="notification-footer">
                <button className="secondary-button" onClick={() => load(Math.max(1, (meta.page || 1) - 1))}>Prev</button>
                <div style={{ alignSelf: 'center' }}>Page {meta.page} / {Math.ceil((meta.total || 0) / meta.perPage)}</div>
                <button className="secondary-button" onClick={() => load((meta.page || 1) + 1)}>Next</button>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}

export default NotificationsPage;
