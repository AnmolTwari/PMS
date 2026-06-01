import React, { useState } from 'react';
import { LoadingScreen } from '../components/Shared';

export function ReportsPage() {
  const [start, setStart] = useState(new Date(Date.now() - 6 * 24 * 3600 * 1000).toISOString().slice(0, 10));
  const [end, setEnd] = useState(new Date().toISOString().slice(0, 10));
  const [loading, setLoading] = useState(false);

  function downloadEntries() {
    setLoading(true);
    const url = `/api/reports/entries?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`;
    // navigate to URL to trigger download
    window.location.href = url;
    setTimeout(() => setLoading(false), 800);
  }

  return (
    <div className="page-stack">
      <header className="page-header">
        <div>
          <span className="eyebrow">Reports</span>
          <h2>Export usage reports</h2>
        </div>
      </header>

      <section className="table-card">
        <h3>Export entry/exit data</h3>
        <div className="form-grid" style={{ alignItems: 'end' }}>
          <label className="field"><span>From</span><input type="date" value={start} onChange={(e) => setStart(e.target.value)} /></label>
          <label className="field"><span>To</span><input type="date" value={end} onChange={(e) => setEnd(e.target.value)} /></label>
          <div>
            <button className="primary-button" onClick={downloadEntries} disabled={loading}>{loading ? 'Preparing...' : 'Download CSV'}</button>
          </div>
        </div>
      </section>
    </div>
  );
}

export default ReportsPage;
