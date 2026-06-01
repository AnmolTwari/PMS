import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AuthCard, Field } from '../components/Shared';
import { request } from '../api/request';

export function ResetPasswordPage() {
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const [form, setForm] = useState({ password: '', confirmPassword: '' });
  const [mode, setMode] = useState(token ? 'email' : 'otp');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    setMessage('');

    try {
      const payload = await request(mode === 'otp' ? '/api/password/reset-otp' : '/api/password/reset', {
        method: 'POST',
        body: JSON.stringify(mode === 'otp' ? { email, otp, ...form } : { token, ...form }),
      });
      setMessage(payload.message);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthCard title="Set a new password" subtitle="Choose a strong password to restore access.">
      <form className="form-stack" onSubmit={submit}>
        {!token ? (
          <div className="auth-toggle">
            <button type="button" className={mode === 'email' ? 'toggle-chip active' : 'toggle-chip'} onClick={() => setMode('email')}>Link reset</button>
            <button type="button" className={mode === 'otp' ? 'toggle-chip active' : 'toggle-chip'} onClick={() => setMode('otp')}>OTP reset</button>
          </div>
        ) : null}
        {mode === 'otp' ? (
          <>
            <Field label="Email address"><input value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
            <Field label="OTP code"><input value={otp} onChange={(e) => setOtp(e.target.value)} /></Field>
          </>
        ) : null}
        <Field label="New password"><input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></Field>
        <Field label="Confirm password"><input type="password" value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} /></Field>
        {error ? <div className="alert error">{error}</div> : null}
        {message ? <div className="alert success">{message}</div> : null}
        <button className="primary-button full" disabled={busy || (!token && mode === 'email')}>{busy ? 'Updating...' : 'Update password'}</button>
      </form>
    </AuthCard>
  );
}