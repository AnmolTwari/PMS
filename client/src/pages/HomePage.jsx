import React from 'react';
import { Link } from 'react-router-dom';
import { FeatureCard, MetricCard, SectionHeading } from '../components/Shared';

export function HomePage() {
  return (
    <div className="page-stack landing-page">
      <section className="hero-card landing-hero">
        <div className="hero-copy landing-copy">
          <span className="eyebrow">Parking operations platform</span>
          <h1>A professional parking website that can grow into a full app.</h1>
          <p>
            ParkSy gives visitors a clear booking experience and gives administrators a polished operations view.
            It is designed to look like a modern SaaS website first, then scale into a production parking platform.
          </p>

          <div className="hero-actions">
            <Link className="primary-button" to="/login">Open dashboard</Link>
            <Link className="secondary-button" to="/register">Create account</Link>
          </div>

          <div className="trust-strip">
            <span>Professional landing page</span>
            <span>Operations-ready dashboard</span>
            <span>Built for multi-screen use</span>
          </div>

          <div className="landing-highlights">
            <article>
              <strong>Real-time</strong>
              <p>Availability updates across every zone</p>
            </article>
            <article>
              <strong>Fast booking</strong>
              <p>Reserve before arrival, release when done</p>
            </article>
            <article>
              <strong>Team-ready</strong>
              <p>Works for schools, malls, and workplaces</p>
            </article>
          </div>
        </div>

        <div className="hero-panel landing-panel">
          <div className="hero-panel-card highlight-card">
            <span>Live availability</span>
            <strong>142 free slots</strong>
            <p>Across all managed parking zones</p>
          </div>

          <div className="landing-dashboard-preview">
            <div className="preview-header">
              <div>
                <span className="eyebrow">Operations snapshot</span>
                <h3>Current system status</h3>
              </div>
              <span className="status-pill status-green">Live</span>
            </div>
            <div className="preview-grid">
              <MetricCard label="Sites" value="3" subtext="School, mall, company" />
              <MetricCard label="Areas" value="4" subtext="Each with 50 slots" />
              <MetricCard label="Flow" value="Book" subtext="Then park or release" />
              <MetricCard label="Mode" value="Live" subtext="Clean React dashboard" />
            </div>
          </div>
        </div>
      </section>

      <section className="brand-strip">
        <span>Campus parking</span>
        <span>Retail parking</span>
        <span>Enterprise parking</span>
        <span>Guard operations</span>
        <span>Live notifications</span>
      </section>

      <section id="solutions" className="stacked-section">
        <SectionHeading
          eyebrow="Why it feels professional"
          title="A website layout that reads like a SaaS product"
          text="The structure is intentional: clear hero messaging, proof points, simple steps, and a final CTA. That makes it easier to present as a real product or turn into a polished app later."
        />
        <div className="feature-grid three-up">
          <FeatureCard title="Clear value proposition" text="Visitors immediately understand what the product does and who it is for." />
          <FeatureCard title="Business-friendly sections" text="The page is organized like a professional website with proof, use cases, and CTA blocks." />
          <FeatureCard title="App-ready foundation" text="The same visual language carries into the dashboard, so the UI feels consistent." />
        </div>
      </section>

      <section id="how-it-works" className="stacked-section">
        <SectionHeading
          eyebrow="Simple flow"
          title="How ParkSy works"
          text="The booking flow stays straightforward so the website can be used by both drivers and site administrators without extra explanation."
        />
        <div className="timeline-grid">
          <div className="timeline-card"><span>1</span><h3>Review availability</h3><p>See open slots before you arrive and decide if you need a reservation.</p></div>
          <div className="timeline-card"><span>2</span><h3>Book or auto-assign</h3><p>Choose a slot directly or let the system assign one when you need speed.</p></div>
          <div className="timeline-card"><span>3</span><h3>Manage the visit</h3><p>Use the dashboard to monitor parking, release slots, and keep operations organized.</p></div>
        </div>
      </section>

      <section className="cta-banner landing-cta">
        <div>
          <span className="eyebrow">Ready for demo</span>
          <h2>Professional parking website with a clean product feel.</h2>
        </div>
        <div className="hero-actions">
          <Link className="primary-button" to="/login">Go to login</Link>
          <Link className="secondary-button" to="/register">Create account</Link>
        </div>
      </section>
    </div>
  );
}