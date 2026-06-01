import React from 'react';
import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <div className="notice-page">
      <div className="notice-card">
        <span className="eyebrow">ParkSy</span>
        <h2>Page not found</h2>
        <p>The page you tried to open does not exist.</p>
        <Link className="primary-button" to="/">Back to home</Link>
      </div>
    </div>
  );
}