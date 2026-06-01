import React, { useEffect, useState } from 'react';
import { request } from '../api/request';

export function RealTimeMap() {
  const [areas, setAreas] = useState([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const res = await request('/api/slots/map');
      setAreas(res.areas || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  if (loading) return <div className="page-card"><h3>Loading map...</h3></div>;

  return (
    <div className="page-card">
      <div className="card-heading-row"><h3>Real-time parking map</h3></div>
      <div className="legend">🟢 Available • 🔴 Occupied • 🟡 Reserved • ⚫ Maintenance</div>
      {areas.map((area) => (
        <section key={area.area} className="table-card">
          <h4>{area.area}</h4>
          <p>{area.counts.available} available / {area.counts.occupied} occupied / {area.counts.reserved} reserved</p>
          <div className="slot-list slot-list-map">
            {area.slots.map((s) => (
              <div key={s.id} className={`slot-card slot-row slot-${s.status}`}>
                <div className="slot-row-main">
                  <strong>{s.slotNumber}</strong>
                  <div className="slot-meta">{s.vehicle || 'No vehicle assigned'}</div>
                </div>
                <span className={`status-badge status-${s.status}`}>{s.status}</span>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

export default RealTimeMap;
