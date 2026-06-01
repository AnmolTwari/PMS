import React, { useEffect, useState } from 'react';
import { request } from '../api/request';
import { LoadingScreen } from '../components/Shared';

export function SecurityLogsPage() {
  const [logs, setLogs] = useState(null);
  const [page, setPage] = useState(1);

  async function load() {
    setLogs(await request(`/api/security/logs?page=${page}&limit=50`));
  }

  useEffect(() => { load(); }, [page]);

  if (!logs) return <LoadingScreen />;

  return (
    <div className="page-stack">
      <header className="page-header"><div><span className="eyebrow">Security</span><h2>Audit logs</h2></div></header>
      <section className="table-card">
        <div className="table-wrap">
          <table>
            <thead><tr><th>Time</th><th>User</th><th>IP</th><th>Method</th><th>Path</th></tr></thead>
            <tbody>
              {logs.rows.map((r) => (
                <tr key={r._id}><td>{new Date(r.createdAt).toLocaleString()}</td><td>{r.username || r.userId || '-'}</td><td>{r.ip}</td><td>{r.method}</td><td>{r.path}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12 }}>
          <button className="secondary-button" onClick={() => setPage(Math.max(1, page - 1))}>Previous</button>
          <div style={{ color: '#9fbfe8' }}>Page {page}</div>
          <button className="secondary-button" onClick={() => setPage(page + 1)}>Next</button>
        </div>
      </section>
    </div>
  );
}

export default SecurityLogsPage;
