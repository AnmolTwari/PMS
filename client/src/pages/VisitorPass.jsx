import React, { useState } from 'react';
import { request } from '../api/request';

export function VisitorPass() {
  const [form, setForm] = useState({ visitorName: '', vehicleNumber: '', date: '', time: '' });
  const [pass, setPass] = useState(null);
  const [error, setError] = useState('');

  async function create(e) {
    e.preventDefault();
    setError('');
    try {
      const res = await request('/api/guard/visitor', { method: 'POST', body: JSON.stringify(form) });
      setPass(res.pass || res);
    } catch (err) { setError(err.message); }
  }

  return (
    <div className="page-card">
      <div className="card-heading-row"><h3>Create Visitor Pass</h3></div>
      <form className="form-stack" onSubmit={create}>
        <label className="field"><span>Visitor name</span><input value={form.visitorName} onChange={(e) => setForm({ ...form, visitorName: e.target.value })} /></label>
        <label className="field"><span>Vehicle number</span><input value={form.vehicleNumber} onChange={(e) => setForm({ ...form, vehicleNumber: e.target.value })} /></label>
        <label className="field"><span>Date</span><input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></label>
        <label className="field"><span>Time</span><input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} /></label>
        <button className="primary-button">Create pass</button>
      </form>
      {error ? <div className="alert">{error}</div> : null}
      {pass ? (
        <div className="card">
          <h4>Visitor Pass</h4>
          <p>{pass.visitorName}</p>
          <p>{pass.vehicleNumber}</p>
          {pass.qrData ? <img src={pass.qrData} alt="visitor-qr" style={{ maxWidth: 200 }} /> : null}
        </div>
      ) : null}
    </div>
  );
}

export default VisitorPass;
