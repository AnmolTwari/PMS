import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { request } from '../api/request';
import { LoadingScreen, NoticePage, ProfileRow } from '../components/Shared';
import { useAuth } from '../context/AuthContext';

function formatDateTime(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString();
}

export function ProfilePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  async function load() {
    setError('');
    try {
      setData(await request('/api/dashboard/user'));
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => { if (user) load(); }, [user]);

  const profile = data?.profile || null;
  const vehicles = data?.vehicles || [];

  const profileStats = useMemo(() => ([
    { label: 'Active vehicle', value: profile?.defaultVehicleNo || profile?.vehicleNo || 'None' },
    { label: 'Saved vehicles', value: vehicles.length },
    { label: 'Current parking', value: data?.bookedSlot ? `${data.bookedSlot.areaName} / Slot ${data.bookedSlot.slotNumber}` : 'No active slot' },
    { label: 'Permanent slot', value: data?.permanentReservation ? `${data.permanentReservation.areaName} / ${data.permanentReservation.slotNumber}` : 'Not assigned' },
  ]), [data, profile, vehicles.length]);

  if (!user) {
    return <NoticePage title="Access needed" message="Please sign in to view your profile." />;
  }

  if (error) {
    return <NoticePage title="Profile unavailable" message={error} onRetry={load} />;
  }

  if (!data || !profile) {
    return <LoadingScreen />;
  }

  return (
    <div className="page-stack profile-page">
      <header className="page-header dashboard-hero">
        <div className="hero-copy dashboard-hero-copy">
          <span className="eyebrow">Profile</span>
          <h2>My account details</h2>
          <p>Everything stored in your parking account, including contact details, vehicles, branch info, and parking status.</p>
        </div>
        <div className="profile-summary-card profile-summary-card-wide">
          <div className="profile-avatar">{(profile.name || profile.username || 'U').slice(0, 1).toUpperCase()}</div>
          <div>
            <span className="eyebrow">Signed in as</span>
            <h3>{profile.name}</h3>
            <p>{profile.department || 'No department set'}</p>
          </div>
          <div className="profile-actions">
            <button className="secondary-button" onClick={() => navigate('/dashboard')}>Back to dashboard</button>
          </div>
        </div>
      </header>

      <div className="stats-grid compact profile-stats-grid">
        {profileStats.map((item) => (
          <article className="metric-card" key={item.label}>
            <div className="metric-label">{item.label}</div>
            <div className="metric-value">{item.value}</div>
          </article>
        ))}
      </div>

      <section className="table-card profile-detail-card">
        <div className="card-heading-row">
          <div>
            <span className="eyebrow">Account</span>
            <h3>Registered details</h3>
          </div>
          <span className={`status-pill ${profile.isLoggedIn ? 'status-green' : 'status-amber'}`}>
            {profile.isLoggedIn ? 'Online' : 'Offline'}
          </span>
        </div>

        <div className="profile-list strong-list">
          <ProfileRow label="Name" value={profile.name} />
          <ProfileRow label="Username" value={profile.username} />
          <ProfileRow label="Email" value={profile.email} />
          <ProfileRow label="Mobile" value={profile.mobile} />
          <ProfileRow label="Employee ID" value={profile.employeeId} />
          <ProfileRow label="Role" value={profile.role} />
          <ProfileRow label="Department" value={profile.department || '-'} />
          <ProfileRow label="Branch" value={`${profile.branchName || 'Main Branch'} (${profile.branchCode || 'MAIN'})`} />
          <ProfileRow label="Primary vehicle" value={profile.defaultVehicleNo || profile.vehicleNo || 'None'} />
          <ProfileRow label="Assigned slot" value={profile.assignedSlot || 'None'} />
          <ProfileRow label="Account created" value={formatDateTime(profile.createdAt)} />
          <ProfileRow label="Last updated" value={formatDateTime(profile.updatedAt)} />
        </div>
      </section>

      <div className="content-grid profile-grid">
        <section className="table-card">
          <div className="card-heading-row">
            <div>
              <span className="eyebrow">Vehicles</span>
              <h3>Saved vehicles</h3>
            </div>
            <span className="ghost-note">{vehicles.length} saved</span>
          </div>

          <div className="vehicle-list">
            {vehicles.length ? vehicles.map((vehicle) => (
              <article className={`vehicle-card ${vehicle.isDefault ? 'selected' : ''}`} key={vehicle.number}>
                <div>
                  <strong>{vehicle.number}</strong>
                  <p>{vehicle.type}{vehicle.model ? ` • ${vehicle.model}` : ''}</p>
                  <span>{vehicle.color || 'No color set'}</span>
                </div>
                <div className="vehicle-actions">
                  {vehicle.isDefault ? <span className="status-pill status-green">Primary vehicle</span> : <span className="status-pill status-amber">Secondary</span>}
                </div>
              </article>
            )) : <div className="empty-state">No vehicles saved yet.</div>}
          </div>
        </section>

        <section className="table-card">
          <div className="card-heading-row">
            <div>
              <span className="eyebrow">Parking</span>
              <h3>Parking overview</h3>
            </div>
          </div>

          <div className="profile-list strong-list">
            <ProfileRow label="Current booking" value={data.bookedSlot ? `${data.bookedSlot.areaName} / Slot ${data.bookedSlot.slotNumber}` : 'None'} />
            <ProfileRow label="Booking status" value={data.bookedSlot ? (data.bookedSlot.status === 'reserved' ? 'Reserved' : 'Occupied') : 'Waiting'} />
            <ProfileRow label="Booking time" value={data.bookedSlot?.bookingSlotTime || '-'} />
            <ProfileRow label="Booking date" value={data.bookedSlot?.bookingDate || '-'} />
            <ProfileRow label="Permanent reservation" value={data.permanentReservation ? `${data.permanentReservation.areaName} / ${data.permanentReservation.slotNumber}` : 'None'} />
            <ProfileRow label="Reservation hours" value={data.permanentReservation ? `${data.permanentReservation.startTime} - ${data.permanentReservation.endTime}` : '-'} />
            <ProfileRow label="Active days" value={data.permanentReservation?.activeDays?.length ? data.permanentReservation.activeDays.join(', ') : '-'} />
          </div>
        </section>
      </div>
    </div>
  );
}

export default ProfilePage;
