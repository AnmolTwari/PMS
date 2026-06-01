import React, { useState } from 'react';
import { request } from '../api/request';

export function GuardDashboard() {
  const [checkinData, setCheckinData] = useState({ vehicleNumber: '', userName: '', bookingId: '' });
  const [checkoutId, setCheckoutId] = useState('');
  const [message, setMessage] = useState('');

  async function doCheckIn(e) {
    e.preventDefault();
    setMessage('');
    try {
      const res = await request('/api/guard/checkin', { method: 'POST', body: JSON.stringify(checkinData) });
      setMessage('Checked in');
    } catch (err) { setMessage(err.message); }
  }

  async function doCheckOut(e) {
    e.preventDefault();
    setMessage('');
    try {
      const res = await request('/api/guard/checkout', { method: 'POST', body: JSON.stringify({ entryId: checkoutId }) });
      setMessage('Checked out');
    } catch (err) { setMessage(err.message); }
  }

  return (
    <div className="page-stack guard-page">
      <header className="page-header">
        <div>
          <span className="eyebrow">Security</span>
          <h2>Security guard dashboard</h2>
          <p>Check vehicles in and out with a clean, task-focused interface.</p>
        </div>
      </header>

      <div className="content-grid two-col">
        <form className="form-stack" onSubmit={doCheckIn}>
          <label className="field"><span>Vehicle number</span><input value={checkinData.vehicleNumber} onChange={(e) => setCheckinData({ ...checkinData, vehicleNumber: e.target.value })} /></label>
          <label className="field"><span>User name</span><input value={checkinData.userName} onChange={(e) => setCheckinData({ ...checkinData, userName: e.target.value })} /></label>
          <label className="field"><span>Booking ID (optional)</span><input value={checkinData.bookingId} onChange={(e) => setCheckinData({ ...checkinData, bookingId: e.target.value })} /></label>
          <button className="primary-button">Check In</button>
        </form>

        <form className="form-stack" onSubmit={doCheckOut}>
          <label className="field"><span>Entry record id</span><input value={checkoutId} onChange={(e) => setCheckoutId(e.target.value)} /></label>
          <button className="secondary-button">Check Out</button>
        </form>
      </div>
      {message ? <div className="alert">{message}</div> : null}
    </div>
  );
}

export default GuardDashboard;
