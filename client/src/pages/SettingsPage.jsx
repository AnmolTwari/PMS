import React, { useEffect, useState } from 'react';
import { request } from '../api/request';
import { LoadingScreen, NoticePage } from '../components/Shared';

export function SettingsPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function load() {
    setError('');
    try {
      setData(await request('/api/settings'));
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => { load(); }, []);

  async function save(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setSaving(true);

    const payload = {
      app: {
        appName: form.get('appName'),
        supportEmail: form.get('supportEmail'),
        defaultBranchCode: form.get('defaultBranchCode'),
      },
      smtp: {
        host: form.get('smtpHost'),
        port: form.get('smtpPort'),
        secure: form.get('smtpSecure') === 'on',
        user: form.get('smtpUser'),
        pass: form.get('smtpPass'),
        from: form.get('smtpFrom'),
      },
      maintenance: {
        enabled: form.get('maintenanceEnabled') === 'on',
        message: form.get('maintenanceMessage'),
      },
    };

    try {
      await request('/api/settings', {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });
      await load();
    } finally {
      setSaving(false);
    }
  }

  if (error) return <NoticePage title="Settings unavailable" message={error} onRetry={load} />;
  if (!data) return <LoadingScreen />;

  return (
    <div className="page-stack">
      <header className="page-header">
        <div>
          <span className="eyebrow">Admin</span>
          <h2>Settings panel</h2>
        </div>
      </header>

      <form className="form-stack" onSubmit={save}>
        <section className="table-card">
          <h3>Application</h3>
          <div className="form-grid">
            <label className="field"><span>App name</span><input name="appName" defaultValue={data.app?.appName} /></label>
            <label className="field"><span>Support email</span><input name="supportEmail" defaultValue={data.app?.supportEmail} /></label>
            <label className="field"><span>Default branch code</span><input name="defaultBranchCode" defaultValue={data.app?.defaultBranchCode} /></label>
          </div>
        </section>

        <section className="table-card">
          <h3>SMTP mail</h3>
          <div className="form-grid">
            <label className="field"><span>Host</span><input name="smtpHost" defaultValue={data.smtp?.host} /></label>
            <label className="field"><span>Port</span><input name="smtpPort" defaultValue={data.smtp?.port} /></label>
            <label className="field checkbox-field"><span>Secure</span><input type="checkbox" name="smtpSecure" defaultChecked={data.smtp?.secure} /></label>
            <label className="field"><span>User</span><input name="smtpUser" defaultValue={data.smtp?.user} /></label>
            <label className="field"><span>Password</span><input name="smtpPass" type="password" defaultValue={data.smtp?.pass} /></label>
            <label className="field"><span>From</span><input name="smtpFrom" defaultValue={data.smtp?.from} /></label>
          </div>
        </section>

        <section className="table-card">
          <h3>Maintenance</h3>
          <div className="form-grid">
            <label className="field checkbox-field"><span>Enabled</span><input type="checkbox" name="maintenanceEnabled" defaultChecked={data.maintenance?.enabled} /></label>
            <label className="field"><span>Message</span><textarea name="maintenanceMessage" rows="3" defaultValue={data.maintenance?.message} /></label>
          </div>
        </section>

        <button className="primary-button" type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save settings'}</button>
      </form>
    </div>
  );
}

export default SettingsPage;
