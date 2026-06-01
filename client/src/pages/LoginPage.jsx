import React, { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AuthCard, Field } from '../components/Shared';

export function LoginPage() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ identifier: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (user) {
    return <Navigate to={['admin', 'superAdmin'].includes(user.role) ? '/dashboard' : '/user-panel'} replace />;
  }

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError('');

    try {
      const account = await login(form);
      navigate(['admin', 'superAdmin'].includes(account.role) ? '/dashboard' : '/user-panel');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthCard title="Welcome back" subtitle="Sign in to manage parking for your school, mall, or company site.">
      <form className="form-stack" onSubmit={submit}>
        <Field label="Email, phone, or employee ID">
          <input value={form.identifier} onChange={(e) => setForm({ ...form, identifier: e.target.value })} placeholder="name@company.com / 0123456789 / EMP001" />
        </Field>
        <Field label="Password">
          <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        </Field>
        {error ? <div className="alert error">{error}</div> : null}
        <button className="primary-button full" disabled={busy}>{busy ? 'Signing in...' : 'Sign in'}</button>
        <div className="inline-links">
          <Link to="/register">Create account</Link>
          <Link to="/forgot-password">Forgot password?</Link>
        </div>
      </form>
    </AuthCard>
  );
}