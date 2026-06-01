import React from 'react';

export function SectionHeading({ eyebrow, title, text }) {
  return (
    <div className="section-heading">
      {eyebrow ? <span className="eyebrow">{eyebrow}</span> : null}
      <h2>{title}</h2>
      {text ? <p>{text}</p> : null}
    </div>
  );
}

export function FeatureCard({ title, text, accent = '' }) {
  return (
    <article className={`feature-card ${accent}`.trim()}>
      <h3>{title}</h3>
      <p>{text}</p>
    </article>
  );
}

export function MetricCard({ label, value, subtext }) {
  return (
    <article className="metric-card">
      <div className="metric-label">{label}</div>
      <div className="metric-value">{value}</div>
      {subtext ? <p className="metric-subtext">{subtext}</p> : null}
    </article>
  );
}

export function Field({ label, children }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
    </label>
  );
}

export function AuthCard({ title, subtitle, children }) {
  return (
    <div className="auth-layout">
      <section className="auth-visual">
        <span className="eyebrow">ParkSy</span>
        <h2>{title}</h2>
        <p>{subtitle}</p>
        <div className="auth-points">
          <span>Check free slots</span>
          <span>Book parking</span>
          <span>Release when full</span>
        </div>
      </section>
      <section className="auth-panel">{children}</section>
    </div>
  );
}

export function LoadingScreen() {
  return (
    <div className="screen-center">
      <div className="spinner" />
      <p>Loading ParkSy...</p>
    </div>
  );
}

export function NoticePage({ title, message, onRetry }) {
  return (
    <div className="notice-page">
      <div className="notice-card">
        <span className="eyebrow">ParkSy</span>
        <h2>{title}</h2>
        <p>{message}</p>
        {onRetry ? <button className="primary-button" onClick={onRetry}>Retry</button> : null}
      </div>
    </div>
  );
}

export function ProfileRow({ label, value }) {
  return (
    <div className="profile-row">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}