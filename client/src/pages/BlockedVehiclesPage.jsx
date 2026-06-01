import React, { useEffect, useState } from 'react';
import { request } from '../api/request';
import { LoadingScreen } from '../components/Shared';

export function BlockedVehiclesPage() {
  const [data, setData] = useState(null);
  const [page, setPage] = useState(1);
  const [form, setForm] = useState({ vehicleNumber: '', reason: '', endDate: '' });
  const [filters, setFilters] = useState({ vehicleNumber: '', status: '', from: '', to: '' });

  const trimmedVehicle = form.vehicleNumber.trim();
  const trimmedReason = form.reason.trim();
  const canSubmit = trimmedVehicle.length >= 3 && trimmedVehicle.length <= 32 && trimmedReason.length <= 120;

  async function load() {
    const qs = new URLSearchParams({ page, limit: 50, ...filters }).toString();
    setData(await request(`/api/blocked?${qs}`));
  }

  useEffect(() => { load(); }, [page, filters]);

  async function submit(e) {
    e.preventDefault();
    if (!canSubmit) {
      alert('Enter a vehicle number with 3-32 characters. Reason must be 120 characters or less.');
      return;
    }
    const confirmed = window.confirm(`Block vehicle ${trimmedVehicle}?`);
    if (!confirmed) return;
    await request('/api/blocked/block', { method: 'POST', body: form });
    setForm({ vehicleNumber: '', reason: '', endDate: '' });
    load();
  }

  async function lift(id) {
    const confirmed = window.confirm('Lift this block? The vehicle will be allowed back in immediately.');
    if (!confirmed) return;
    await request(`/api/blocked/${id}/lift`, { method: 'POST' });
    load();
  }

  async function exportCSV() {
    const qs = new URLSearchParams({ ...filters }).toString();
    const res = await fetch(`/api/blocked/export?${qs}`, { credentials: 'include' });
    if (!res.ok) return alert('Export failed');
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'blocked_vehicles.csv';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  if (!data) return <LoadingScreen />;

  return (
    <div className="page-stack">
      <header className="page-header"><div><span className="eyebrow">Security</span><h2>Blocked vehicles</h2></div></header>

      <section className="form-card">
        <form onSubmit={submit} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input
            placeholder="Vehicle number"
            value={form.vehicleNumber}
            onChange={(e)=>setForm({...form, vehicleNumber: e.target.value})}
            required
            minLength={3}
            maxLength={32}
            autoComplete="off"
          />
          <input
            placeholder="Reason"
            value={form.reason}
            onChange={(e)=>setForm({...form, reason: e.target.value})}
            maxLength={120}
            autoComplete="off"
          />
          <input type="date" value={form.endDate} onChange={(e)=>setForm({...form, endDate: e.target.value})} />
          <button className="primary-button" type="submit" disabled={!canSubmit}>Block</button>
        </form>
        <div style={{ marginTop: 8, color: '#9fbfe8', fontSize: 13 }}>
          Vehicle number is required and must be 3-32 characters. Reason is optional and capped at 120 characters.
        </div>
      </section>

      <section className="form-card">
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input placeholder="Filter vehicle" value={filters.vehicleNumber} onChange={(e)=>setFilters({...filters, vehicleNumber: e.target.value})} />
          <select value={filters.status} onChange={(e)=>setFilters({...filters, status: e.target.value})}>
            <option value="">All</option>
            <option value="active">Active</option>
            <option value="lifted">Lifted</option>
          </select>
          <input type="date" value={filters.from} onChange={(e)=>setFilters({...filters, from: e.target.value})} />
          <input type="date" value={filters.to} onChange={(e)=>setFilters({...filters, to: e.target.value})} />
          <button type="button" className="secondary-button" onClick={()=>setFilters({ vehicleNumber: '', status: '', from: '', to: '' })}>Reset</button>
          <button type="button" className="secondary-button" onClick={exportCSV}>Export CSV</button>
        </div>
      </section>

      <section className="table-card">
        <div className="table-wrap">
          <table>
            <thead><tr><th>Vehicle</th><th>Reason</th><th>Start</th><th>End</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {data.rows.map(r => (
                <tr key={r._id}>
                  <td>{r.vehicleNumber}</td>
                  <td>{r.reason}</td>
                  <td>{new Date(r.startDate).toLocaleString()}</td>
                  <td>{r.endDate ? new Date(r.endDate).toLocaleString() : '-'}</td>
                  <td>{r.status}</td>
                  <td>{r.status === 'active' && <button type="button" className="secondary-button" onClick={()=>lift(r._id)}>Lift</button>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12 }}>
          <button type="button" className="secondary-button" onClick={() => setPage(Math.max(1, page - 1))}>Previous</button>
          <div style={{ color: '#9fbfe8' }}>Page {page}</div>
          <button type="button" className="secondary-button" onClick={() => setPage(page + 1)}>Next</button>
        </div>
      </section>
    </div>
  );
}

export default BlockedVehiclesPage;
