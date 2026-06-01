import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AuthCard, Field } from '../components/Shared';

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', mobile: '', employeeId: '', password: '', department: '', role: 'visitor' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    setSuccess('');

    try {
      const payload = await register(form);
      setSuccess(payload.message || 'Account created successfully');
      setTimeout(() => navigate('/login'), 900);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthCard title="Create your account" subtitle="Register once and start using the system for your facility.">
      <form className="form-grid" onSubmit={submit}>
        <Field label="Name"><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Your full name" /></Field>
        <Field label="Email"><input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
        <Field label="Phone"><input value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })} placeholder="Phone number" /></Field>
        <Field label="Employee / Student ID"><input value={form.employeeId} onChange={(e) => setForm({ ...form, employeeId: e.target.value })} placeholder="EMP001 or STU-1002" /></Field>
        <Field label="Role">
          <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
            <option value="visitor">Visitor</option>
            <option value="student">Student</option>
            <option value="employee">Employee</option>
            <option value="securityGuard">Security Guard</option>
            <option value="admin">Admin</option>
            <option value="superAdmin">Super Admin</option>
          </select>
        </Field>
        <Field label="Department"><input value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} placeholder="Optional for visitors" /></Field>
        <Field label="Password"><input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></Field>
        {error ? <div className="alert error" style={{ gridColumn: '1 / -1' }}>{error}</div> : null}
        {success ? <div className="alert success" style={{ gridColumn: '1 / -1' }}>{success}</div> : null}
        <button className="primary-button full" style={{ gridColumn: '1 / -1' }} disabled={busy}>{busy ? 'Creating...' : 'Create account'}</button>
        <div className="inline-links" style={{ gridColumn: '1 / -1' }}>
          <Link to="/login">Already have an account?</Link>
        </div>
      </form>
    </AuthCard>
  );
}