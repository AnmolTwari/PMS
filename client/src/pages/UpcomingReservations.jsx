import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { request } from '../api/request';

export function UpcomingReservations() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState({});
  const [error, setError] = useState('');

  async function load() {
    setError('');
    setLoading(true);
    try {
      const res = await request('/api/slots/bookings/upcoming');
      setBookings(res.bookings || {});
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { if (!user) navigate('/login'); else load(); }, [user]);

  async function cancel(slotId) {
    if (!confirm('Cancel this booking?')) return;
    await request('/api/slots/bookings/cancel', { method: 'POST', body: JSON.stringify({ slotId }) });
    await load();
  }

  if (loading) return <div className="page-card"><h3>Loading upcoming reservations...</h3></div>;
  if (error) return <div className="page-card"><h3>Error</h3><p>{error}</p></div>;

  const dates = Object.keys(bookings).sort();

  return (
    <div className="page-card">
      <div className="card-heading-row">
        <div>
          <span className="eyebrow">My bookings</span>
          <h3>Upcoming reservations</h3>
        </div>
      </div>

      {dates.length === 0 ? (
        <div className="empty-state">No upcoming reservations</div>
      ) : (
        dates.map((d) => (
          <section key={d} className="table-card">
            <h4>{d}</h4>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr><th>Area</th><th>Slot</th><th>Time</th><th>Status</th><th /></tr>
                </thead>
                <tbody>
                  {bookings[d].map((b) => (
                    <tr key={b.id}>
                      <td>{b.area}</td>
                      <td>{b.slotNumber}</td>
                      <td>{b.bookingSlotTime || '-'}</td>
                      <td>{b.status}</td>
                      <td>{b.status === 'reserved' ? <button className="ghost-button" onClick={() => cancel(b.id)}>Cancel</button> : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ))
      )}
    </div>
  );
}

export default UpcomingReservations;
