import React, { useState } from 'react';
import { AuthCard, Field } from '../components/Shared';
import { request } from '../api/request';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [mode, setMode] = useState('email');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    setMessage('');

    try {
      const payload = await request(mode === 'otp' ? '/api/password/forgot-otp' : '/api/password/forgot', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
      setMessage(payload.message);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthCard title="Reset password" subtitle="Choose email reset or OTP verification to recover your account.">
      <form className="form-stack" onSubmit={submit}>
        <div className="auth-toggle">
          <button type="button" className={mode === 'email' ? 'toggle-chip active' : 'toggle-chip'} onClick={() => setMode('email')}>Email reset</button>
          <button type="button" className={mode === 'otp' ? 'toggle-chip active' : 'toggle-chip'} onClick={() => setMode('otp')}>OTP</button>
        </div>
        <Field label="Email address"><input value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
        {error ? <div className="alert error">{error}</div> : null}
        {message ? <div className="alert success">{message}</div> : null}
        <button className="primary-button full" disabled={busy}>{busy ? 'Sending...' : mode === 'otp' ? 'Send OTP' : 'Send reset link'}</button>
      </form>
    </AuthCard>
  );
}