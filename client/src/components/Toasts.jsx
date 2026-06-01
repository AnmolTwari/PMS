import React, { useEffect, useState } from 'react';

let _pushToast = null;

export function pushToast({ title, body, type = 'info', timeout = 5000 }) {
  if (_pushToast) _pushToast({ id: Date.now() + Math.random(), title, body, type, timeout });
}

export function Toasts() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    _pushToast = (t) => setToasts((s) => [t, ...s]);
    return () => { _pushToast = null; };
  }, []);

  useEffect(() => {
    const timers = toasts.map((t) => {
      const id = setTimeout(() => {
        setToasts((s) => s.filter((x) => x.id !== t.id));
      }, t.timeout || 5000);
      return () => clearTimeout(id);
    });
    return () => timers.forEach((c) => c());
  }, [toasts]);

  if (!toasts.length) return null;

  return (
    <div className="toast-container">
      {toasts.map((t) => (
        <div key={t.id} className={`toast ${t.type || 'info'}`}>
          <strong>{t.title}</strong>
          <div style={{ marginTop: 6 }}>{t.body}</div>
        </div>
      ))}
    </div>
  );
}

export default Toasts;
