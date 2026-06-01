import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import { request } from '../api/request';
import { LoadingScreen, MetricCard, NoticePage, ProfileRow } from '../components/Shared';

export function DashboardRouter() {
  const { user, loading } = useAuth();

  if (loading) return <LoadingScreen />;
  if (!user) return <NoticePage title="Access needed" message="Please sign in to open your parking dashboard." />;
  return ['admin', 'superAdmin'].includes(user.role) ? <AdminDashboard /> : <UserDashboard />;
}

function AdminDashboard() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');
  const [departments, setDepartments] = useState([]);
  const [maintenance, setMaintenance] = useState({ enabled: false, message: '' });
  const [maintenanceBusy, setMaintenanceBusy] = useState(false);
  const [branches, setBranches] = useState([]);
  const [activeBranchCode, setActiveBranchCode] = useState('MAIN');
  const [branchForm, setBranchForm] = useState({ name: '', code: '', address: '' });

  async function load(branchCodeOverride) {
    setError('');
    try {
      const branchState = await request('/api/branches');
      setBranches(branchState.branches || []);

      const branchCode = branchCodeOverride || activeBranchCode || localStorage.getItem('pms.activeBranchCode') || 'MAIN';
      setActiveBranchCode(branchCode);
      localStorage.setItem('pms.activeBranchCode', branchCode);

      setData(await request(`/api/dashboard/admin?branchCode=${encodeURIComponent(branchCode)}`));
      setStats(await request(`/api/dashboard/admin/stats?branchCode=${encodeURIComponent(branchCode)}`));
      const dept = await request('/api/analytics/departments');
      setDepartments(dept.departments || []);
      setMaintenance(await request('/api/settings/maintenance'));
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => { load(); }, []);

  useEffect(() => {
    const socket = io();
    socket.on('parking:updated', load);
    return () => socket.disconnect();
  }, []);

  async function assignSlot(event, area, slotNumber) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const employeeId = formData.get('employeeId');

    await request('/api/admin/assign', {
      method: 'POST',
      body: JSON.stringify({ area, slotNumber, employeeId }),
    });

    await load();
  }

  async function releaseSlot(vehicleNo) {
    await request('/api/slots/release', {
      method: 'POST',
      body: JSON.stringify({ vehicleNo }),
    });

    await load();
  }

  async function updateSlotStatus(slotId, status) {
    await request(`/api/slots/${slotId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });

    await load();
  }

  async function createPermanentForUser(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const userId = form.get('userId');
    const preferredArea = form.get('preferredArea');
    const startTime = form.get('startTime');
    const endTime = form.get('endTime');
    const activeDays = [];
    ['Monday','Tuesday','Wednesday','Thursday','Friday'].forEach((d) => {
      if (form.get(d)) activeDays.push(d);
    });

    await request('/api/slots/permanent/admin', {
      method: 'POST',
      body: JSON.stringify({ userId, preferredArea, startTime, endTime, activeDays }),
    });

    await load();
  }

  async function saveMaintenance(event) {
    event.preventDefault();
    setMaintenanceBusy(true);
    try {
      await request('/api/settings/maintenance', {
        method: 'PATCH',
        body: JSON.stringify({
          enabled: maintenance.enabled,
          message: maintenance.message,
        }),
      });
      await load();
    } finally {
      setMaintenanceBusy(false);
    }
  }

  async function createBranch(event) {
    event.preventDefault();
    const payload = {
      name: branchForm.name.trim(),
      code: branchForm.code.trim(),
      address: branchForm.address.trim(),
    };

    if (!payload.name) {
      alert('Branch name is required');
      return;
    }

    await request('/api/branches', { method: 'POST', body: JSON.stringify(payload) });
    setBranchForm({ name: '', code: '', address: '' });
    await load(activeBranchCode);
  }

  if (error) {
    return <NoticePage title="Dashboard unavailable" message={error} onRetry={load} />;
  }

  if (!data) {
    return <LoadingScreen />;
  }

  const totals = Object.values(data.statusData || {}).reduce((accumulator, area) => {
    accumulator.available += area.available || 0;
    accumulator.occupied += area.occupied || 0;
    accumulator.reserved += area.reserved || 0;
    accumulator.disabled += area.disabled || 0;
    accumulator.maintenance += area.maintenance || 0;
    return accumulator;
  }, { available: 0, occupied: 0, reserved: 0, disabled: 0, maintenance: 0 });

  const formatSlotCode = (slot) => `${slot.areaName.replace('Area ', '')}${slot.slotNumber}`;

  return (
    <div className="dashboard-page">
      <header className="page-header">
        <div>
          <span className="eyebrow">Admin console</span>
          <h2>Parking operations dashboard</h2>
        </div>
        <button className="secondary-button" onClick={logout}>Logout</button>
      </header>

      <div className="stats-grid">
        <MetricCard label="Users" value={stats ? stats.totalUsers : data.users.length} subtext="Registered accounts" />
        <MetricCard label="Total slots" value={stats ? stats.totalSlots : data.slots.length} subtext="All slots" />
        <MetricCard label="Available" value={totals.available} subtext="Ready to book" />
        <MetricCard label="Occupied" value={totals.occupied} subtext="Currently taken" />
        <MetricCard label="Reserved" value={stats ? (stats.slotsByStatus?.reserved || totals.reserved) : totals.reserved} subtext="Permanent parking" />
        <MetricCard label="Perm. reservations" value={stats ? stats.totalPermanentReservations : data.reservations.length} subtext="Assigned by admin" />
        <MetricCard label="Visitor passes" value={stats ? stats.activeVisitorPasses : 0} subtext="Active today" />
        <MetricCard label="Today's entries" value={stats ? stats.todaysEntries : 0} subtext="Check-ins today" />
        <MetricCard label="Today's exits" value={stats ? stats.todaysExits : 0} subtext="Check-outs today" />
        <MetricCard label="Waitlist" value={stats ? stats.waitlistCount : 0} subtext="Waiting users" />
      </div>

      <section className="table-card">
        <h3>Branches</h3>
        <div className="form-grid" style={{ marginBottom: 16 }}>
          <label className="field">
            <span>Active branch</span>
            <select
              value={activeBranchCode}
              onChange={(event) => {
                setActiveBranchCode(event.target.value);
                localStorage.setItem('pms.activeBranchCode', event.target.value);
                load(event.target.value);
              }}
            >
              {branches.map((branch) => (
                <option key={branch.code} value={branch.code}>{branch.name} ({branch.code})</option>
              ))}
            </select>
          </label>
        </div>
        <form className="form-stack" onSubmit={createBranch}>
          <div className="form-grid">
            <label className="field">
              <span>Name</span>
              <input value={branchForm.name} onChange={(event) => setBranchForm((current) => ({ ...current, name: event.target.value }))} placeholder="North Campus" />
            </label>
            <label className="field">
              <span>Code</span>
              <input value={branchForm.code} onChange={(event) => setBranchForm((current) => ({ ...current, code: event.target.value }))} placeholder="NORTH" />
            </label>
          </div>
          <label className="field">
            <span>Address</span>
            <input value={branchForm.address} onChange={(event) => setBranchForm((current) => ({ ...current, address: event.target.value }))} placeholder="Optional branch address" />
          </label>
          <button className="primary-button" type="submit">Create branch</button>
        </form>
      </section>

      {Object.entries(data.slotsByArea).map(([area, slots]) => {
        const areaStats = data.statusData?.[area] || { available: 0, occupied: 0, reserved: 0, disabled: 0, maintenance: 0 };
        const occupancy = Math.round((((areaStats.occupied || 0) + (areaStats.reserved || 0)) / slots.length) * 100);

        return (
          <details className="area-panel" key={area} open={area === 'Area A'}>
            <summary>
              <div>
                <strong>{area}</strong>
                <span>{areaStats.available} available / {areaStats.occupied} occupied / {areaStats.reserved} reserved</span>
              </div>
              <div className="mini-bar"><span style={{ width: `${occupancy}%` }} /></div>
            </summary>

            <div className="slot-list slot-list-admin">
              {slots.map((slot) => {
                const status = slot.status || (slot.occupied ? 'occupied' : 'available');

                return (
                  <article className={`slot-card slot-row slot-${status}`} key={slot._id}>
                    <div className="slot-row-main">
                      <div className="slot-card-top">
                        <strong>{formatSlotCode(slot)}</strong>
                        <span className={`status-badge status-${status}`}>{status}</span>
                      </div>
                      <p>{slot.carNumber || 'Ready for assignment'}</p>
                    </div>
                    <div className="slot-row-meta">
                      <label className="field">
                        <span>Status</span>
                        <select value={status} onChange={(event) => updateSlotStatus(slot._id, event.target.value)}>
                          <option value="available">Available</option>
                          <option value="occupied">Occupied</option>
                          <option value="reserved">Reserved</option>
                          <option value="disabled">Disabled</option>
                          <option value="maintenance">Maintenance</option>
                        </select>
                      </label>
                      {status === 'available' ? (
                        <form className="inline-form" onSubmit={(event) => assignSlot(event, area, slot.slotNumber)}>
                          <input name="employeeId" placeholder="Employee ID" />
                          <button className="primary-button">Assign</button>
                        </form>
                      ) : slot.carNumber ? (
                        <button className="danger-button" type="button" onClick={() => releaseSlot(slot.carNumber)}>Release</button>
                      ) : (
                        <span className="ghost-note">Use status control to clear this slot</span>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          </details>
        );
      })}

      <section className="table-card">
        <h3>Registered users</h3>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Dept.</th>
                <th>Vehicles</th>
                <th>Role</th>
              </tr>
            </thead>
            <tbody>
              {data.users.map((user) => (
                <tr key={user.id}>
                  <td>{user.name || user.username}</td>
                  <td>{user.email}</td>
                  <td>{user.department || '-'}</td>
                  <td>{(user.vehicles || []).length ? `${user.vehicles.length} saved` : (user.vehicleNo || '-')}</td>
                  <td>{user.role}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="table-card">
        <h3>Department overview</h3>
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Department</th><th>Users</th><th>Permanent reservations</th></tr>
            </thead>
            <tbody>
              {departments.map((d) => (
                <tr key={d.department}><td>{d.department}</td><td>{d.users}</td><td>{d.permanentReservations}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="table-card">
        <h3>Permanent reservation (admin)</h3>
        <form className="form-stack" onSubmit={createPermanentForUser}>
          <label className="field">
            <span>Select user</span>
            <select name="userId">
              <option value="">Select user</option>
              {data.users.map((u) => <option key={u.id} value={u.id}>{u.name || u.username} — {u.email}</option>)}
            </select>
          </label>
          <label className="field">
            <span>Preferred area</span>
            <select name="preferredArea">
              {Object.keys(data.slotsByArea).map((area) => <option key={area} value={area}>{area}</option>)}
            </select>
          </label>
          <div className="form-grid">
            <label className="field"><span>Start time</span><input type="time" name="startTime" defaultValue="09:00" /></label>
            <label className="field"><span>End time</span><input type="time" name="endTime" defaultValue="18:00" /></label>
          </div>
          <div className="checkbox-row">
            {['Monday','Tuesday','Wednesday','Thursday','Friday'].map((d) => (
              <label className="field checkbox-field" key={d}><span>{d}</span><input type="checkbox" name={d} defaultChecked /></label>
            ))}
          </div>
          <button className="primary-button">Create permanent reservation</button>
        </form>
      </section>

      <section className="table-card">
        <h3>Maintenance mode</h3>
        <form className="form-stack" onSubmit={saveMaintenance}>
          <label className="field checkbox-field" style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <input
              type="checkbox"
              checked={maintenance.enabled}
              onChange={(event) => setMaintenance((current) => ({ ...current, enabled: event.target.checked }))}
            />
            <span>Enable maintenance mode</span>
          </label>
          <label className="field">
            <span>Maintenance message</span>
            <textarea
              rows="3"
              value={maintenance.message || ''}
              onChange={(event) => setMaintenance((current) => ({ ...current, message: event.target.value }))}
              placeholder="The system is temporarily under maintenance. Please check back soon."
            />
          </label>
          <button className="primary-button" disabled={maintenanceBusy}>
            {maintenanceBusy ? 'Saving...' : 'Save maintenance setting'}
          </button>
        </form>
      </section>
    </div>
  );
}

function UserDashboard() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [bookForm, setBookForm] = useState({
    area: 'Area A',
    slotId: '',
    vehicleNo: '',
    bookingDate: new Date().toISOString().slice(0, 10),
    bookingTime: '09:00',
    bookingMode: 'auto',
  });
  const [permanentForm, setPermanentForm] = useState({ preferredArea: 'Area A' });
  const [selectedArea, setSelectedArea] = useState('Area A');
  const [vehicleForm, setVehicleForm] = useState({ number: '', type: 'Car', model: '', color: '', makeDefault: true });
  const [vehicleBusy, setVehicleBusy] = useState(false);

  async function load() {
    setError('');
    try {
      setData(await request('/api/dashboard/user'));
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => { load(); }, []);

  useEffect(() => {
    const socket = io();
    socket.on('parking:updated', load);
    return () => socket.disconnect();
  }, []);

  useEffect(() => {
    const defaultVehicle = data?.vehicles?.find((vehicle) => vehicle.isDefault) || data?.vehicles?.[0];
    const preferredVehicle = data?.profile?.defaultVehicleNo || data?.profile?.vehicleNo || defaultVehicle?.number || '';

    if (!bookForm.vehicleNo && preferredVehicle) {
      setBookForm((current) => ({ ...current, vehicleNo: preferredVehicle }));
    }
  }, [bookForm.vehicleNo, data]);

  async function bookSlot(event) {
    event.preventDefault();
    setNotice('');

    await request('/api/slots/book', {
      method: 'POST',
      body: JSON.stringify(bookForm),
    });

    setNotice('Parking slot reserved successfully');
    await load();
  }

  async function releaseSlot() {
    await request('/api/slots/release', {
      method: 'POST',
      body: JSON.stringify({ vehicleNo: data.bookedSlot?.carNumber || data.profile.defaultVehicleNo || data.profile.vehicleNo }),
    });

    setNotice('Parking slot released successfully');
    await load();
  }

  async function reservePermanent(event) {
    event.preventDefault();
    await request('/api/slots/permanent', {
      method: 'POST',
      body: JSON.stringify(permanentForm),
    });

    setNotice('Permanent reservation created');
    await load();
  }

  async function addVehicle(event) {
    event.preventDefault();
    setVehicleBusy(true);

    try {
      await request('/api/vehicles', {
        method: 'POST',
        body: JSON.stringify(vehicleForm),
      });
      setVehicleForm({ number: '', type: 'Car', model: '', color: '', makeDefault: !data?.vehicles?.length });
      setNotice('Vehicle added successfully');
      await load();
    } finally {
      setVehicleBusy(false);
    }
  }

  async function setDefaultVehicle(number) {
    await request('/api/vehicles/default', {
      method: 'PATCH',
      body: JSON.stringify({ number }),
    });

    setNotice('Default vehicle updated');
    await load();
  }

  async function removeVehicle(number) {
    await request(`/api/vehicles/${encodeURIComponent(number)}`, {
      method: 'DELETE',
    });

    setNotice('Vehicle removed');
    await load();
  }

  if (error) {
    return <NoticePage title="Dashboard unavailable" message={error} onRetry={load} />;
  }

  if (!data) {
    return <LoadingScreen />;
  }

  const vehicles = data.vehicles || [];
  const profileName = data.profile.name || data.profile.username;
  const defaultVehicleNumber = data.profile.defaultVehicleNo || data.profile.vehicleNo || vehicles.find((vehicle) => vehicle.isDefault)?.number || 'None';
  const availableSlots = data.slots.filter((slot) => (slot.status || (slot.occupied ? 'occupied' : 'available')) === 'available');
  const selectedAreaSlots = data.slotsByArea[selectedArea] || [];
  const selectedAreaStats = data.statusData?.[selectedArea] || { available: 0, occupied: 0, reserved: 0, disabled: 0, maintenance: 0 };
  const activeReservationLabel = data.bookedSlot
    ? `${data.bookedSlot.areaName} / Slot ${data.bookedSlot.slotNumber}`
    : 'No active parking reservation';
  const currentBookingStatus = data.bookedSlot
    ? (data.bookedSlot.status === 'reserved' ? 'Reserved' : 'Parked')
    : 'Waiting';
  const areaCode = (slot) => `${slot.areaName.replace('Area ', '')}${slot.slotNumber}`;

  return (
    <div className="dashboard-page">
      <header className="page-header dashboard-hero">
        <div className="hero-copy dashboard-hero-copy">
          <span className="eyebrow">Employee portal</span>
          <h2>Parking control center</h2>
          <p>Track availability, reserve parking, and manage your vehicles in one streamlined workspace.</p>
          <div className="trust-strip">
            <span>{availableSlots.length} free slots</span>
            <span>{data.slots.length - availableSlots.length} occupied or reserved</span>
            <span>{selectedAreaStats.available} open in {selectedArea}</span>
          </div>
        </div>

        <section className="profile-summary-card">
          <div className="profile-avatar">{profileName?.slice(0, 1)?.toUpperCase()}</div>
          <div>
            <span className="eyebrow">Profile</span>
            <h3>{profileName}</h3>
            <p>{data.profile.department || 'No department set'}</p>
          </div>
          <div className="profile-actions">
            <button className="primary-button" type="button" onClick={() => navigate('/profile')}>Profile</button>
            <button className="secondary-button" type="button" onClick={logout}>Logout</button>
          </div>
        </section>
      </header>

      {notice ? <div className="alert success">{notice}</div> : null}

      <div className="stats-grid">
        <MetricCard label="Active vehicle" value={defaultVehicleNumber} subtext="Current car" />
        <MetricCard label="Department" value={data.profile.department || '-'} subtext="Profile info" />
        <MetricCard label="Branch" value={data.profile.branchName || 'Main Branch'} subtext={data.profile.branchCode || 'MAIN'} />
        <MetricCard label="Permanent slot" value={data.permanentReservation ? `${data.permanentReservation.areaName} / ${data.permanentReservation.slotNumber}` : 'None'} subtext="Long-term booking" />
          <MetricCard label="Current status" value={currentBookingStatus} subtext={activeReservationLabel} />
      </div>

      <div className="content-grid user-layout">
        <section className="table-card profile-stack-card">
          <div className="card-heading-row">
            <div>
              <span className="eyebrow">Profile</span>
              <h3>Your details</h3>
            </div>
            <span className={`status-pill ${data.bookedSlot ? 'status-green' : 'status-amber'}`}>
              {data.bookedSlot ? 'Parking active' : 'Need parking'}
            </span>
          </div>

          <div className="profile-list strong-list">
            <ProfileRow label="Name" value={profileName} />
            <ProfileRow label="Email" value={data.profile.email} />
            <ProfileRow label="Phone" value={data.profile.mobile} />
            <ProfileRow label="Employee ID" value={data.profile.employeeId} />
            <ProfileRow label="Department" value={data.profile.department || '-'} />
            <ProfileRow label="Branch" value={`${data.profile.branchName || 'Main Branch'} (${data.profile.branchCode || 'MAIN'})`} />
            <ProfileRow label="Saved vehicles" value={vehicles.length} />
          </div>

          <div className="quick-actions-card">
            <div>
              <span className="eyebrow">My parking</span>
              <h4>{activeReservationLabel}</h4>
              <p>{data.bookedSlot ? 'You currently have an active reservation.' : 'No slot booked yet. Choose an area, time, and either auto assign or pick a slot.'}</p>
            </div>
              {data.bookedSlot ? (
                <button className="danger-button" type="button" onClick={releaseSlot}>Release slot</button>
              ) : (
                <span className="ghost-note">Reserve from available slots</span>
              )}

              <div style={{ marginTop: 12 }}>
                <button className="secondary-button" type="button" onClick={() => navigate('/dashboard/upcoming')}>Upcoming reservations</button>
              </div>
          </div>

          <div className="reservation-box">
            <strong>Profile snapshot</strong>
            <p>{data.profile.branchName || 'Main Branch'} • {data.profile.department || 'No department set'}</p>
            <span>{vehicles.length ? `${vehicles.length} vehicles on file` : 'No vehicles saved yet'}</span>
          </div>

          {data.permanentReservation ? (
            <div className="reservation-box permanent-box">
              <strong>Permanent reservation</strong>
              <p>{data.permanentReservation.areaName} - Slot {data.permanentReservation.slotNumber}</p>
              <span>{data.permanentReservation.startTime} to {data.permanentReservation.endTime}</span>
            </div>
          ) : null}

          <div className="vehicle-manager-card">
            <div className="card-heading-row">
              <div>
                <span className="eyebrow">Vehicles</span>
                <h3>Manage your vehicles</h3>
              </div>
              <span className="ghost-note">{vehicles.length} saved</span>
            </div>

            <div className="vehicle-list">
              {vehicles.map((vehicle) => (
                <article className={`vehicle-card ${vehicle.isDefault ? 'selected' : ''}`} key={vehicle.number}>
                  <div>
                    <strong>{vehicle.number}</strong>
                    <p>{vehicle.type}{vehicle.model ? ` • ${vehicle.model}` : ''}</p>
                    <span>{vehicle.color || 'No color set'}</span>
                  </div>
                  <div className="vehicle-actions">
                    {!vehicle.isDefault ? <button className="ghost-button" type="button" onClick={() => setDefaultVehicle(vehicle.number)}>Default</button> : <span className="status-pill status-green">Primary</span>}
                    <button className="ghost-button" type="button" onClick={() => removeVehicle(vehicle.number)}>Remove</button>
                  </div>
                </article>
              ))}
            </div>

            <form className="vehicle-form" onSubmit={addVehicle}>
              <label className="field"><span>Vehicle number</span><input value={vehicleForm.number} onChange={(e) => setVehicleForm({ ...vehicleForm, number: e.target.value })} placeholder="KA-01-AB-1234" /></label>
              <label className="field"><span>Type</span><select value={vehicleForm.type} onChange={(e) => setVehicleForm({ ...vehicleForm, type: e.target.value })}><option>Car</option><option>Bike</option><option>EV</option></select></label>
              <label className="field"><span>Model</span><input value={vehicleForm.model} onChange={(e) => setVehicleForm({ ...vehicleForm, model: e.target.value })} placeholder="Honda City" /></label>
              <label className="field"><span>Color</span><input value={vehicleForm.color} onChange={(e) => setVehicleForm({ ...vehicleForm, color: e.target.value })} placeholder="White" /></label>
              <label className="field checkbox-field"><span>Make primary vehicle</span><input type="checkbox" checked={vehicleForm.makeDefault} onChange={(e) => setVehicleForm({ ...vehicleForm, makeDefault: e.target.checked })} /></label>
              <button className="primary-button full" type="submit" disabled={vehicleBusy}>{vehicleBusy ? 'Saving...' : 'Add vehicle'}</button>
            </form>
          </div>
        </section>

        <section className="table-card booking-card">
          <div className="card-heading-row">
            <div>
              <span className="eyebrow">Booking</span>
              <h3>Book parking</h3>
            </div>
            <div className="slot-counter">
              <strong>{selectedAreaStats.available}</strong>
              <span>open in {selectedArea}</span>
            </div>
          </div>

          <div className="auth-toggle">
            <button type="button" className={bookForm.bookingMode === 'auto' ? 'toggle-chip active' : 'toggle-chip'} onClick={() => setBookForm((current) => ({ ...current, bookingMode: 'auto' }))}>Auto assign</button>
            <button type="button" className={bookForm.bookingMode === 'manual' ? 'toggle-chip active' : 'toggle-chip'} onClick={() => setBookForm((current) => ({ ...current, bookingMode: 'manual' }))}>Manual select</button>
          </div>

          <div className="form-grid booking-form-grid">
            <label className="field">
              <span>Select date</span>
              <input type="date" value={bookForm.bookingDate} onChange={(e) => setBookForm({ ...bookForm, bookingDate: e.target.value })} />
            </label>
            <label className="field">
              <span>Select time</span>
              <input type="time" value={bookForm.bookingTime} onChange={(e) => setBookForm({ ...bookForm, bookingTime: e.target.value })} />
            </label>
          </div>

          <div className="area-tabs">
            {Object.keys(data.slotsByArea).map((area) => {
              const openCount = data.statusData?.[area]?.available || 0;

              return (
                <button
                  key={area}
                  type="button"
                  className={`area-chip ${selectedArea === area ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedArea(area);
                    setPermanentForm({ preferredArea: area });
                    setBookForm((current) => ({ ...current, area, slotId: '' }));
                  }}
                >
                  <span>{area}</span>
                  <strong>{openCount}</strong>
                </button>
              );
            })}
          </div>

          <div className="slot-list slot-select-list">
            {selectedAreaSlots.map((slot) => {
              const status = slot.status || (slot.occupied ? 'occupied' : 'available');

              return (
                <button
                  type="button"
                  key={slot._id}
                  className={`slot-picker-card slot-row slot-${status} ${bookForm.slotId === slot._id ? 'selected' : ''}`}
                  onClick={() => setBookForm({ ...bookForm, slotId: slot._id })}
                >
                  <div className="slot-row-main">
                    <div className="slot-picker-top">
                      <strong>{areaCode(slot)}</strong>
                      <span className={`status-badge status-${status}`}>{status}</span>
                    </div>
                    <p>{bookForm.bookingMode === 'manual' ? 'Tap to reserve this slot' : 'Auto assignment will choose the next open slot'}</p>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="booking-form-card">
            <div className="booking-summary">
              <span className="eyebrow">Selected slot</span>
              <h4>
                {bookForm.bookingMode === 'manual' && bookForm.slotId
                  ? `${selectedAreaSlots.find((slot) => slot._id === bookForm.slotId)?.areaName} / Slot ${selectedAreaSlots.find((slot) => slot._id === bookForm.slotId)?.slotNumber}`
                  : `Auto assignment for ${bookForm.area}`}
              </h4>
              <p>{bookForm.bookingDate} at {bookForm.bookingTime}</p>
            </div>

            <form className="form-stack" onSubmit={bookSlot}>
              <label className="field">
                <span>Choose vehicle</span>
                <select value={bookForm.vehicleNo} onChange={(e) => setBookForm({ ...bookForm, vehicleNo: e.target.value })}>
                  {vehicles.length ? vehicles.map((vehicle) => (
                    <option key={vehicle.number} value={vehicle.number}>{vehicle.number}{vehicle.isDefault ? ' (primary)' : ''}</option>
                  )) : <option value="">Add a vehicle first</option>}
                </select>
              </label>
              <button className="primary-button full" disabled={!vehicles.length || !bookForm.vehicleNo || (bookForm.bookingMode === 'manual' && !bookForm.slotId)}>Confirm booking</button>
            </form>
          </div>

          <div className="permanent-card">
            <div>
              <span className="eyebrow">Permanent reservation</span>
              <h4>Reserve a recurring slot for your area</h4>
            </div>
            <form className="form-stack" onSubmit={reservePermanent}>
              <label className="field">
                <span>Preferred area</span>
                <select value={permanentForm.preferredArea} onChange={(e) => setPermanentForm({ preferredArea: e.target.value })}>
                  {Object.keys(data.slotsByArea).map((area) => <option key={area} value={area}>{area}</option>)}
                </select>
              </label>
              <button className="secondary-button full">Reserve permanent slot</button>
            </form>
          </div>
        </section>
      </div>

      <section className="table-card overview-card">
        <div className="card-heading-row">
          <div>
            <span className="eyebrow">Availability</span>
            <h3>Real-time area status</h3>
          </div>
        </div>

        <div className="stats-grid compact area-status-grid">
          {Object.entries(data.statusData).map(([area, stats]) => (
            <article className="status-card" key={area}>
              <div className="status-card-head">
                <strong>{area}</strong>
                <span>{stats.occupancy}%</span>
              </div>
              <div className="mini-bar"><span style={{ width: `${stats.occupancy}%` }} /></div>
              <p>{stats.available} available / {stats.occupied} occupied / {stats.reserved} reserved / {stats.disabled} disabled / {stats.maintenance} maintenance</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
