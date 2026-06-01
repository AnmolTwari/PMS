import React, { useEffect, useState, useRef } from 'react';
import { request } from '../api/request';
import { LoadingScreen, MetricCard } from '../components/Shared';

export function AnalyticsPage() {
  const [data, setData] = useState(null);
  const [usage, setUsage] = useState(null);
  const [peak, setPeak] = useState(null);
  const [tooltip, setTooltip] = useState({ visible: false, x: 0, y: 0, html: '' });
  const containerRef = useRef(null);
  const targetRef = useRef({ x: 0, y: 0, html: '', visible: false });
  const animRef = useRef({ x: 0, y: 0 });
  const rafRef = useRef(null);

  async function load() {
    setData(await request('/api/analytics/occupancy'));
    setUsage(await request('/api/analytics/usage?days=7'));
    setPeak(await request('/api/analytics/peak-hours?days=7'));
  }

  useEffect(() => { load(); }, []);

  if (!data || !usage || !peak) return <LoadingScreen />;

  const renderUsageChart = (series) => {
    const width = 700; const height = 160; const padding = 28;
    const max = Math.max(...series.map((s) => Math.max(s.entries, s.exits)), 1);
    const barWidth = (width - padding * 2) / series.length;

    return (
      <svg ref={containerRef} className="chart" width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        {/* Y-axis gridlines & labels */}
        {Array.from({ length: 4 }).map((_, idx) => {
          const y = padding + ((height - padding * 2) / 3) * idx;
          const val = Math.round(max - (max / 3) * idx);
          return (
            <g key={`g${idx}`}>
              <line x1={padding} x2={width - padding} y1={y} y2={y} stroke="rgba(188,223,249,0.06)" />
              <text x={8} y={y + 4} fontSize={11} fill="#9fbfe8">{val}</text>
            </g>
          );
        })}

        {series.map((s, i) => {
          const x = padding + i * barWidth;
          const eH = Math.round((s.entries / max) * (height - padding * 2));
          const oH = Math.round((s.exits / max) * (height - padding * 2));
          return (
            <g key={s.date}>
              <rect x={x + 2} y={height - padding - eH} width={barWidth * 0.36} height={eH} fill="#60a5fa" rx={4}
                onMouseMove={(ev) => handleUsageHover(ev, s)} onMouseLeave={hideTooltip} onMouseEnter={(ev) => handleUsageHover(ev, s)} />
              <rect x={x + barWidth * 0.36 + 6} y={height - padding - oH} width={barWidth * 0.36} height={oH} fill="#34d399" rx={4}
                onMouseMove={(ev) => handleUsageHover(ev, s)} onMouseLeave={hideTooltip} onMouseEnter={(ev) => handleUsageHover(ev, s)} />
              <text x={x + barWidth / 2} y={height - 6} fontSize={10} fill="#bcdff9" textAnchor="middle">{s.date.slice(5)}</text>
            </g>
          );
        })}
      </svg>
    );
  };

  function hideTooltip() {
    // request fade-out but keep animating until hidden
    targetRef.current.visible = false;
    // delay actual state hide to allow CSS fade
    setTimeout(() => setTooltip((t) => ({ ...t, visible: false })), 180);
  }

  function handleUsageHover(ev, s) {
    const { clientX, clientY } = ev;
    targetRef.current.x = clientX + 12;
    targetRef.current.y = clientY + 8;
    targetRef.current.html = `${s.date}<br/>Entries: ${s.entries}<br/>Exits: ${s.exits}`;
    targetRef.current.visible = true;
    // ensure tooltip visible immediately (opacity animation will handle appearance)
    setTooltip((t) => ({ ...t, visible: true, html: targetRef.current.html }));
    // start animation loop if not running
    if (!rafRef.current) startAnimLoop();
  }

  function startAnimLoop() {
    const step = () => {
      const tx = targetRef.current.x;
      const ty = targetRef.current.y;
      animRef.current.x += (tx - animRef.current.x) * 0.16;
      animRef.current.y += (ty - animRef.current.y) * 0.16;
      setTooltip((t) => ({ ...t, x: Math.round(animRef.current.x), y: Math.round(animRef.current.y), html: targetRef.current.html, visible: t.visible || targetRef.current.visible }));
      if (targetRef.current.visible || (Math.abs(animRef.current.x - tx) > 0.5) || (Math.abs(animRef.current.y - ty) > 0.5)) {
        rafRef.current = requestAnimationFrame(step);
      } else {
        // stop loop
        cancelAnimationFrame(rafRef.current || 0);
        rafRef.current = null;
      }
    };

    rafRef.current = requestAnimationFrame(step);
  }

  const renderPeakChart = (rows) => {
    const width = 500; const height = 140; const padding = 18;
    const max = Math.max(...rows.map((r) => r.count), 1);
    const barHeight = (height - padding * 2) / rows.length;

    return (
      <svg className="chart" width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        {rows.map((r, i) => {
          const y = padding + i * barHeight;
          const w = Math.round((r.count / max) * (width - 140));
          return (
            <g key={r.hour}>
              <text x={8} y={y + barHeight / 2 + 4} fontSize={12} fill="#bcdff9">{`${r.hour}:00`}</text>
              <rect x={100} y={y + 6} width={w} height={barHeight - 10} fill="#fca5a5" rx={6} />
              <text x={100 + w + 8} y={y + barHeight / 2 + 4} fontSize={12} fill="#bfd8e8">{r.count}</text>
            </g>
          );
        })}
      </svg>
    );
  };

  return (
    <div className="analytics-page">
      <header className="page-header">
        <div>
          <span className="eyebrow">Analytics</span>
          <h2>Usage & occupancy</h2>
        </div>
      </header>

      <div className="stats-grid">
        <MetricCard label="Total slots" value={data.totalSlots} subtext="Configured slots" />
        <MetricCard label="Occupied" value={data.occupied} subtext="Currently occupied" />
        <MetricCard label="Occupancy" value={`${data.occupancyPercent}%`} subtext="Current occupancy" />
      </div>

      <section className="table-card">
        <h3>Last 7 days — entries / exits</h3>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 18 }}>
          <div style={{ flex: 1, overflow: 'auto', padding: '12px 0' }}>
            {renderUsageChart(usage.series)}
          </div>
          <div style={{ width: 160 }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
              <div style={{ width: 12, height: 12, background: '#60a5fa', borderRadius: 3 }} />
              <div style={{ color: '#bcdff9' }}>Entries</div>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <div style={{ width: 12, height: 12, background: '#34d399', borderRadius: 3 }} />
              <div style={{ color: '#bcdff9' }}>Exits</div>
            </div>
          </div>
        </div>
      </section>

      <section className="table-card">
        <h3>Peak check-in hours (top 5)</h3>
        <div style={{ overflow: 'auto', padding: '8px 0' }}>
          {renderPeakChart(peak.topHours)}
        </div>
      </section>
      {tooltip.visible ? (
        <div className="chart-tooltip" style={{ left: tooltip.x, top: tooltip.y }} dangerouslySetInnerHTML={{ __html: tooltip.html }} />
      ) : null}
    </div>
  );
}

export default AnalyticsPage;
