import React, { useEffect, useMemo, useState } from 'react';
import { request } from '../api/request';
import { LoadingScreen, NoticePage } from '../components/Shared';
import { useAuth } from '../context/AuthContext';

function UserPill({ label, value }) {
  return (
    <span className="user-pill">
      <strong>{label}</strong>
      <em>{value || '-'}</em>
    </span>
  );
}

export function UsersPage() {
  const { user, loading: authLoading } = useAuth();
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deletingId, setDeletingId] = useState('');

  async function load() {
    setError('');
    setLoading(true);
    try {
      const payload = await request('/api/users');
      setUsers(payload.users || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const filteredUsers = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return users;
    return users.filter((user) => [user.name, user.username, user.email, user.employeeId, user.mobile, user.branchName, user.role]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(needle)));
  }, [users, search]);

  async function deleteUser(user) {
    const confirmed = window.confirm(`Delete ${user.name || user.username}? This will remove the account and clear active parking references.`);
    if (!confirmed) return;

    setDeletingId(user._id);
    try {
      await request(`/api/users/${user._id}`, { method: 'DELETE' });
      await load();
    } catch (err) {
      alert(err.message);
    } finally {
      setDeletingId('');
    }
  }

  if (authLoading || loading) return <LoadingScreen />;
  if (!user || !['admin', 'superAdmin'].includes(user.role)) {
    return <NoticePage title="Access needed" message="Only administrators can manage registered users." />;
  }
  if (error) return <NoticePage title="Users unavailable" message={error} onRetry={load} />;

  return (
    <div className="page-stack users-page">
      <header className="page-header">
        <div>
          <span className="eyebrow">Admin</span>
          <h2>Registered users</h2>
        </div>
      </header>

      <section className="table-card">
        <div className="users-toolbar">
          <div>
            <h3>User list</h3>
            <p>Search, review, and delete accounts from one clean list.</p>
          </div>
          <label className="field users-search">
            <span>Search</span>
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Name, email, ID, branch, role" />
          </label>
        </div>

        <div className="users-list">
          {filteredUsers.length ? filteredUsers.map((user) => (
            <article className="user-row" key={user.id || user._id}>
              <div className="user-main">
                <div className="user-avatar">{(user.name || user.username || '?').slice(0, 1).toUpperCase()}</div>
                <div className="user-details">
                  <div className="user-title-row">
                    <h4>{user.name || user.username}</h4>
                    <span className={`status-badge role-badge status-${String(user.role || 'visitor').toLowerCase()}`}>{user.role}</span>
                  </div>
                  <div className="user-pills">
                    <UserPill label="Email" value={user.email} />
                    <UserPill label="Employee ID" value={user.employeeId} />
                    <UserPill label="Phone" value={user.mobile} />
                    <UserPill label="Branch" value={`${user.branchName || 'Main Branch'} (${user.branchCode || 'MAIN'})`} />
                  </div>
                </div>
              </div>

              <div className="user-actions-box">
                <div className="user-role-note">{user.vehicles?.length ? `${user.vehicles.length} vehicle(s)` : 'No vehicles saved'}</div>
                <button
                  type="button"
                  className="danger-button"
                  onClick={() => deleteUser(user)}
                  disabled={deletingId === (user.id || user._id) || user.role === 'superAdmin'}
                >
                  {deletingId === (user.id || user._id) ? 'Deleting...' : 'Delete user'}
                </button>
              </div>
            </article>
          )) : (
            <div className="empty-state">No users found.</div>
          )}
        </div>
      </section>
    </div>
  );
}

export default UsersPage;
