import React, { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { request } from '../api/request';
import { useAuth } from '../context/AuthContext';
import { pushToast } from './Toasts';

export function NotificationBell() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    let mounted = true;
    (async () => {
      try {
        const res = await request('/api/notifications');
        if (mounted) setNotifications(res.notifications || []);
      } catch (err) {
        console.error('load notifications', err);
      }
    })();

    const socket = io();
    socket.on('notification:created', (payload) => {
      if (!payload?.notification) return;
      setNotifications((curr) => [payload.notification, ...curr]);
      try {
        pushToast({ title: payload.notification.title || 'Notification', body: payload.notification.body || '', type: 'info' });
      } catch (err) { /* ignore */ }
    });

    return () => { mounted = false; socket.disconnect(); };
  }, [user]);

  const unread = notifications.filter((n) => !n.read).length;

  async function markRead(id) {
    try {
      await request(`/api/notifications/${id}/read`, { method: 'POST' });
      setNotifications((curr) => curr.map((n) => (n._id === id ? { ...n, read: true } : n)));
    } catch (err) {
      console.error('mark read', err);
    }
  }

  return (
    <div className="notification-bell">
      <button className="icon-button" onClick={() => setOpen(!open)} aria-label="Notifications">
        🔔 {unread ? <span className="badge">{unread}</span> : null}
      </button>
      {open ? (
        <div className="notification-panel">
          <div className="panel-header"><strong>Notifications</strong></div>
          <div className="panel-list">
            {notifications.length ? notifications.map((n) => (
              <div key={n._id} className={`notification-item ${n.read ? 'read' : 'unread'}`} onClick={() => markRead(n._id)}>
                <div className="notif-title">{n.title || n.type}</div>
                <div className="notif-body">{n.body || (n.meta && n.meta.type)}</div>
                <div className="notif-time">{new Date(n.createdAt).toLocaleString()}</div>
              </div>
            )) : <div className="empty">No notifications</div>}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default NotificationBell;
