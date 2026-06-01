import React, { useEffect, useState } from 'react';
import { request } from '../api/request';
import { LoadingScreen } from '../components/Shared';

export function PassesPage() {
  const [passes, setPasses] = useState(null);
  const [form, setForm] = useState({ userId: '', passType: 'employee', vehicleNumber: '', validFrom: '', validTo: '' });
  const [loading, setLoading] = useState(false);

  async function load() {
    setPasses(await request('/api/passes/mine'));
  }

  useEffect(() => { load(); }, []);

  async function createPass(e) {
    e.preventDefault();
    setLoading(true);
    try {
      await request('/api/passes', { method: 'POST', body: JSON.stringify(form) });
      await load();
    } finally { setLoading(false); }
  }

  if (!passes) return <LoadingScreen />;

  return (
    <div className="page-stack">
      <header className="page-header">
        <div><span className="eyebrow">Passes</span><h2>Parking passes</h2></div>
      </header>

      <section className="table-card">
        <h3>Your passes</h3>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Vehicle</th><th>Type</th><th>Valid from</th><th>Valid to</th><th>Status</th></tr></thead>
            <tbody>
              {passes.rows?.map((p) => (
                <tr key={p._id}><td>{p.vehicleNumber}</td><td>{p.passType}</td><td>{p.validFrom?.slice(0,10)}</td><td>{p.validTo?.slice(0,10)}</td><td>{p.status}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="table-card">
        <h3>Request new pass</h3>
        <form className="form-grid" onSubmit={createPass}>
          <label className="field"><span>Vehicle number</span><input value={form.vehicleNumber} onChange={(e) => setForm({ ...form, vehicleNumber: e.target.value })} /></label>
          <label className="field"><span>Type</span><select value={form.passType} onChange={(e) => setForm({ ...form, passType: e.target.value })}><option value="employee">Employee</option><option value="student">Student</option></select></label>
          <label className="field"><span>Valid from</span><input type="date" value={form.validFrom} onChange={(e) => setForm({ ...form, validFrom: e.target.value })} /></label>
          <label className="field"><span>Valid to</span><input type="date" value={form.validTo} onChange={(e) => setForm({ ...form, validTo: e.target.value })} /></label>
          <div><button className="primary-button" disabled={loading}>{loading ? 'Requesting...' : 'Request pass'}</button></div>
        </form>
      </section>
    </div>
  );
}

export default PassesPage;
