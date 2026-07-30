import React, { useState, useEffect } from 'react';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, LabelList
} from 'recharts';
import { Image as ImageIcon, FileCheck2, Building2 } from 'lucide-react';
import './Stats.css';

const COLORS = ['#6ee7b7', '#fde047', '#fb923c', '#fb7185', '#14868C'];
const CR_DR_LABELS = {
  CR: 'CR (Computed Radiography)',
  DR: 'DR (Digital Radiography)',
  Unassigned: 'Unassigned',
};

const ORBIT_COLORS = ['#2563eb', '#0ea5a3', '#22c55e', '#3b82f6', '#0d9488', '#16a34a'];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;

  const row = payload[0]?.payload || {};

  return (
    <div className="custom-tooltip">
      {label && <p className="tooltip-title">{label}</p>}

      {/* Show these only for Hospital chart */}
      {row.hospital_name && (
        <>
          <div className="tooltip-item">
            <span className="name">Hospital:</span>
            <span className="value">{row.hospital_name}</span>
          </div>

          <div className="tooltip-item">
            <span className="name">State:</span>
            <span className="value">{row.state}</span>
          </div>

          <div className="tooltip-item">
            <span className="name">Total Assessments:</span>
            <span className="value">{row.assessment_count}</span>
          </div>

          <div className="tooltip-item">
            <span className="name">Total Subjects:</span>
            <span className="value">{row.subject_count}</span>
          </div>

          <hr style={{ margin: "8px 0", border: "0", borderTop: "1px solid #e5e7eb" }} />
        </>
      )}

      {/* Show hospital list for the CR/DR breakdown pie chart */}
      {row.hospitals && (
        <div style={{ maxHeight: 180, overflowY: 'auto', marginBottom: 6 }}>
          {row.hospitals.map((h, i) => (
            <div key={i} className="tooltip-item" style={{ display: 'block' }}>
              <span className="value" style={{ fontWeight: 500 }}>{h.short_name || h.hospital_name}</span>
              {h.state && <span className="name" style={{ marginLeft: 6, fontSize: 11 }}>({h.state})</span>}
            </div>
          ))}
        </div>
      )}

      {payload.map((entry, i) => (
        <div key={i} className="tooltip-item">
          <span
            className="dot"
            style={{ backgroundColor: entry.color || entry.fill }}
          />
          <span className="name">{entry.name}:</span>
          <span className="value">{entry.value}</span>
        </div>
      ))}
    </div>
  );
};

const CustomPieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return percent > 0 ? (
    <text
      x={x} y={y}
      fill="#111"
      textAnchor={x > cx ? 'start' : 'end'}
      dominantBaseline="central"
      style={{ fontFamily: 'Poppins', fontWeight: 600, fontSize: 12 }}
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  ) : null;
};

const CustomLegend = ({ payload }) => (
  <ul className="custom-legend">
    {payload.map((entry, index) => (
      <li key={`item-${index}`} className="legend-item">
        <span className="legend-dot" style={{ backgroundColor: entry.color }} />
        <span
          className="legend-text"
          style={{ color: '#14868C', fontWeight: 600, fontFamily: 'Poppins' }}
        >
          {entry.value}
        </span>
      </li>
    ))}
  </ul>
);

// Builds a regular hexagon point string, matching the hexagon in the TANUH logo
function hexPoints(cx, cy, r) {
  const pts = [];
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 180) * (60 * i - 30);
    pts.push(`${(cx + r * Math.cos(angle)).toFixed(2)},${(cy + r * Math.sin(angle)).toFixed(2)}`);
  }
  return pts.join(' ');
}

const thStyle = {
  padding: '10px 12px',
  textAlign: 'left',
  fontFamily: 'Poppins',
  fontSize: 12.5,
  fontWeight: 600,
  color: '#14868C',
  borderBottom: '2px solid rgba(20,134,140,0.15)',
  textTransform: 'uppercase',
  letterSpacing: '0.4px',
};

const tdStyle = {
  padding: '9px 12px',
  fontFamily: 'Poppins',
  fontSize: 13,
  color: '#374151',
  borderBottom: '1px solid #f1f1f1',
};

const InstituteMachineTable = ({ byHospital }) => {
  const [hover, setHover] = useState(null); // { institute, machines, x, y }
  const wrapperRef = React.useRef(null);

  const hospitals = (byHospital || [])
    .map((h) => ({
      name: h.short_name || h.hospital_name || h.name || 'Unknown',
      machines: h.machines && h.machines.length > 0 ? h.machines : [],
    }))
    .filter((h) => h.machines.length > 0);

  if (hospitals.length === 0) {
    return <p style={{ textAlign: 'center', color: '#6b7280' }}>No institute data available.</p>;
  }

  const handleEnter = (e, hospital) => {
    const wrapperRect = wrapperRef.current.getBoundingClientRect();
    const cellRect = e.currentTarget.getBoundingClientRect();
    setHover({
      institute: hospital.name,
      machines: hospital.machines,
      x: cellRect.left - wrapperRect.left + cellRect.width / 2,
      y: cellRect.top - wrapperRect.top,
    });
  };

  const handleLeave = () => setHover(null);

  return (
    <div className="institute-table-wrapper" ref={wrapperRef}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={thStyle}>Institute</th>
            <th style={thStyle}>Machine</th>
            <th style={thStyle}>Make</th>
            <th style={thStyle}>Technology</th>
            <th style={thStyle}>No. of Machine</th>
          </tr>
        </thead>
        <tbody>
          {hospitals.map((h, hi) =>
            h.machines.map((m, mi) => (
              <tr key={`${hi}-${mi}`}>
                {mi === 0 && (
                  <td
                    style={{
                      ...tdStyle,
                      fontWeight: 600,
                      color: '#14868C',
                      cursor: 'default',
                    }}
                    rowSpan={h.machines.length}
                    onMouseEnter={(e) => handleEnter(e, h)}
                    onMouseLeave={handleLeave}
                  >
                    {h.name}
                  </td>
                )}
                <td style={tdStyle}>{m.machine_name}</td>
                <td style={tdStyle}>{m.make || '-'}</td>
                <td style={tdStyle}>{m.technology || '-'}</td>
                <td style={tdStyle}>{m.machine_count ?? 0}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {hover && (
        <div
          className="institute-hover-tooltip"
          style={{ left: hover.x, top: hover.y }}
        >
          <div className="institute-hover-title">{hover.institute}</div>
          <ul className="institute-hover-list">
            {hover.machines.map((m, i) => (
              <li key={i} className="institute-hover-item">
                <span className="institute-hover-machine">{m.machine_name}</span>
                <span className="institute-hover-meta">
                  {[m.make, m.technology].filter(Boolean).join(' · ')}
                  {m.machine_count ? ` · x${m.machine_count}` : ''}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

const InstituteOrbitCloud = ({ byHospital }) => {
  const [active, setActive] = useState(null);
  const [hoverInfo, setHoverInfo] = useState(null);
  const wrapperRef = React.useRef(null);

  const hospitals = (byHospital || [])
    .map((h) => {
      const machines = h.machines && h.machines.length > 0 ? h.machines : [];
      const total = machines.reduce((s, m) => s + (m.machine_count || 0), 0);
      return {
        name: h.short_name || h.hospital_name || h.name || 'Unknown',
        total,
        machines,
      };
    })
    .filter((h) => h.machines.length > 0);

  if (hospitals.length === 0) {
    return <p style={{ textAlign: 'center', color: '#6b7280' }}>No institute data available.</p>;
  }

  const NODE_RADIUS = 30; // slightly bigger nodes
  const size = 640; // increased from 580
  const center = size / 2;
  const orbitRadius = size / 2 - 105;

  const nodes = hospitals.map((h, i) => {
    const angle = (i / hospitals.length) * 2 * Math.PI - Math.PI / 2;
    return {
      ...h,
      x: center + orbitRadius * Math.cos(angle),
      y: center + orbitRadius * Math.sin(angle),
      r: NODE_RADIUS,
      color: ORBIT_COLORS[i % ORBIT_COLORS.length],
    };
  });

  const handleEnter = (e, n) => {
    setActive(n);
    const wrapperRect = wrapperRef.current.getBoundingClientRect();
    const targetRect = e.currentTarget.getBoundingClientRect();
    setHoverInfo({
      hospital: n,
      x: targetRect.left - wrapperRect.left + targetRect.width / 2,
      y: targetRect.top - wrapperRect.top,
    });
  };

  const handleLeave = () => {
    setActive(null);
    setHoverInfo(null);
  };

  return (
    <div
      className="orbit-cloud"
      style={{
        background: 'linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)',
        borderRadius: 16,
        border: '1px solid #e2e8f0',
        marginTop: 0,
        paddingTop: 0,
      }}
    >
      <div
        className="orbit-cloud-svg-wrap"
        ref={wrapperRef}
        style={{ position: 'relative', minHeight: 480, marginTop: 0 }}
      >
        <svg
          width="100%"
          height="100%"
          viewBox={`0 0 ${size} ${size}`}
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <linearGradient id="orbitHexGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1d4ed8" />
              <stop offset="100%" stopColor="#22c55e" />
            </linearGradient>
          </defs>

          {nodes.map((n, i) => (
            <line
              key={`spoke-${i}`}
              x1={center} y1={center} x2={n.x} y2={n.y}
              stroke={n.color} strokeOpacity={active && active.name === n.name ? 0.7 : 0.28}
              strokeWidth={active && active.name === n.name ? 2.5 : 1.5}
            />
          ))}

          {nodes.map((n, i) => {
            const next = nodes[(i + 1) % nodes.length];
            return (
              <line
                key={`ring-${i}`}
                x1={n.x} y1={n.y} x2={next.x} y2={next.y}
                stroke="#94a3b8" strokeOpacity={0.25} strokeWidth={1}
              />
            );
          })}

          <polygon
            points={hexPoints(center, center, 60)}
            fill="#ffffff"
            stroke="url(#orbitHexGradient)"
            strokeWidth={5}
          />
          <text
            x={center} y={center - 4}
            textAnchor="middle"
            style={{ fontFamily: 'Poppins', fontWeight: 700, fontSize: 17, fill: '#0f766e' }}
          >
            {hospitals.length}
          </text>
          <text
            x={center} y={center + 17}
            textAnchor="middle"
            style={{ fontFamily: 'Poppins', fontWeight: 500, fontSize: 11, fill: '#64748b' }}
          >
            Institutes
          </text>

          {nodes.map((n, i) => (
            <g
              key={`node-${i}`}
              onMouseEnter={(e) => handleEnter(e, n)}
              onMouseLeave={handleLeave}
              onClick={(e) => handleEnter(e, n)}
              style={{ cursor: 'pointer' }}
            >
              <circle
                cx={n.x} cy={n.y} r={n.r}
                fill={n.color}
                fillOpacity={active && active.name === n.name ? 1 : 0.85}
                stroke="#fff"
                strokeWidth={active && active.name === n.name ? 3 : 2}
              />
              <text
                x={n.x} y={n.y + 4}
                textAnchor="middle"
                style={{ fontFamily: 'Poppins', fontWeight: 700, fontSize: Math.max(11, n.r * 0.5), fill: '#fff' }}
              >
                {n.total}
              </text>
            </g>
          ))}

          {nodes.map((n, i) => (
            <text
              key={`label-${i}`}
              x={n.x}
              y={n.y + n.r + 17}
              textAnchor="middle"
              onMouseEnter={(e) => handleEnter(e, n)}
              onMouseLeave={handleLeave}
              style={{
                fontFamily: 'Poppins',
                fontWeight: active && active.name === n.name ? 700 : 500,
                fontSize: 11.5,
                fill: active && active.name === n.name ? '#111827' : '#374151',
                cursor: 'pointer',
              }}
            >
              {n.name.length > 14 ? `${n.name.slice(0, 13)}…` : n.name}
            </text>
          ))}
        </svg>

        {hoverInfo && (
          <div
            className="institute-hover-tooltip"
            style={{ left: hoverInfo.x, top: hoverInfo.y, minWidth: 240, padding: '12px 14px' }}
          >
            {hoverInfo.hospital.machines.map((m, mi) => (
              <div
                key={mi}
                style={{
                  marginBottom: mi < hoverInfo.hospital.machines.length - 1 ? 10 : 0,
                  paddingBottom: mi < hoverInfo.hospital.machines.length - 1 ? 10 : 0,
                  borderBottom: mi < hoverInfo.hospital.machines.length - 1 ? '1px solid #e5e7eb' : 'none',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '2px 0' }}>
                  <span style={{ fontFamily: 'Poppins', fontWeight: 600, fontSize: 12.5, color: '#14868C' }}>Machine:</span>
                  <span style={{ fontFamily: 'Poppins', fontSize: 12.5, color: '#6b7280', textAlign: 'right' }}>{m.machine_name}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '2px 0' }}>
                  <span style={{ fontFamily: 'Poppins', fontWeight: 600, fontSize: 12.5, color: '#14868C' }}>Make:</span>
                  <span style={{ fontFamily: 'Poppins', fontSize: 12.5, color: '#6b7280', textAlign: 'right' }}>{m.make || '-'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '2px 0' }}>
                  <span style={{ fontFamily: 'Poppins', fontWeight: 600, fontSize: 12.5, color: '#14868C' }}>Technology:</span>
                  <span style={{ fontFamily: 'Poppins', fontSize: 12.5, color: '#6b7280', textAlign: 'right' }}>{m.technology || '-'}</span>
                </div>
                {/* <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '2px 0' }}>
                  <span style={{ fontFamily: 'Poppins', fontWeight: 600, fontSize: 12.5, color: '#14868C' }}>No. of Machines:</span>
                  <span style={{ fontFamily: 'Poppins', fontSize: 12.5, color: '#6b7280', textAlign: 'right' }}>{m.machine_count ?? 0}</span>
                </div> */}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const MammogramStats = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_URL = process.env.REACT_APP_API_URL || '';

  useEffect(() => {
    const fetchMammoStats = async () => {
      try {
        const response = await fetch(`${API_URL}/api/v1/mammogram/portal-stats`);
        if (!response.ok) throw new Error('Failed to load mammogram stats');
        const json = await response.json();
        setData(json);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchMammoStats();
  }, [API_URL]);

  if (loading) return <div className="stats-loader">Loading mammogram data...</div>;
  if (error) return <div className="stats-error">Error: {error}</div>;
  if (!data) return null;

  const totals = data.totals || {};
  const completionRate = data.completionRate || { viewsUploaded: 0, totalSubjects: 0, rate: 0 };

  return (
    <div style={{ marginTop: 20 }}>
      <h2 style={{ textAlign: 'center', color: '#34495e', marginBottom: 20 }}>Assessment Records</h2>

      <div className="summary-section" style={{ marginBottom: '2rem' }}>
        <div className="summary-card">
          <div className="card-header-with-icon"><ImageIcon className="summary-icon" size={24} /><h3>Imaging Studies</h3></div>
          <div className="big-number">{totals.imaging_studies ?? 0}</div>
        </div>
        <div className="summary-card">
          <div className="card-header-with-icon"><FileCheck2 className="summary-icon" size={24} /><h3>Reports Uploaded</h3></div>
          <div className="big-number">{totals.reports ?? 0}</div>
        </div>

        <div className="summary-card">
          <div className="card-header-with-icon"><Building2 className="summary-icon" size={24} /><h3>Completion Rate</h3></div>
          <div className="big-number">{completionRate.rate}%</div>
        </div>
      </div>

      <div className="charts-grid">
        <div className="chart-card full-width">
          <h3>Machine Modality (CR / DR)</h3>
          <div className="chart-wrapper pie-wrapper">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={(data.hospitalTypeBreakdown || []).map((entry) => ({
                    ...entry,
                    displayName: CR_DR_LABELS[entry.name] || entry.name,
                  }))}
                  cx="50%" cy="50%" outerRadius="80%"
                  dataKey="value" nameKey="displayName"
                  labelLine={false}
                  label={CustomPieLabel}
                >
                  {(data.hospitalTypeBreakdown || []).map((entry, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                {/* CustomTooltip reads row.hospitals to list institutes in this slice on hover */}
                <Tooltip content={<CustomTooltip />} />
                <Legend verticalAlign="bottom" height={36} content={<CustomLegend />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="chart-card full-width">
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
            <h3 style={{ margin: 0 }}>Mammogram Uploads by Institution</h3>
            <div style={{ display: 'flex', gap: 16, fontFamily: 'Poppins', fontSize: 12.5, color: '#6b7280' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 16, height: 16, borderRadius: '50%', backgroundColor: '#6ee7b7', display: 'inline-block' }} />
                {(data.byHospital || []).reduce((s, h) => s + (h.dicom_count || 0), 0)} DICOM views
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 16, height: 16, borderRadius: '50%', backgroundColor: '#fb923c', display: 'inline-block' }} />
                {(data.byHospital || []).reduce((s, h) => s + (h.report_count || 0), 0)} reports
              </span>
            </div>
          </div>

          <div
            className="chart-wrapper hospital-chart-scroll"
            style={{ height: "550px", '--hospital-count': (data.byHospital || []).length }}
          >
            <div className="hospital-chart-inner">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={data.byHospital || []}
                  margin={{ top: 24, right: 30, left: 20, bottom: 80 }}
                  barCategoryGap="15%"
                  barGap={2}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#059669"
                    strokeOpacity={0.1}
                  />

                  <XAxis
                    dataKey="short_name"
                    interval={0}
                    angle={-40}
                    textAnchor="end"
                    height={80}
                    axisLine={{ stroke: '#059669', strokeOpacity: 0.2 }}
                    tickLine={false}
                    tick={{
                      fontSize: 11,
                      fill: "#059669",
                      fontFamily: "Poppins",
                      fontWeight: 500,
                    }}
                  />

                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{
                      fontSize: 12,
                      fill: "#059669",
                      fontFamily: "Poppins",
                      fontWeight: 500,
                    }}
                  />

                  <Tooltip
                    content={<CustomTooltip />}
                    cursor={{ fill: '#059669', fillOpacity: 0.06 }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    iconType="circle"
                    wrapperStyle={{ fontFamily: 'Poppins', fontSize: 13, fontWeight: 500, color: '#374151' }}
                  />

                  <Bar
                    dataKey="dicom_count"
                    name="DICOM Views"
                    fill="#6ee7b7"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={80}
                  >
                    <LabelList
                      dataKey="dicom_count"
                      position="top"
                      style={{ fontFamily: 'Poppins', fontSize: 10.5, fontWeight: 600, fill: '#059669' }}
                    />
                  </Bar>

                  <Bar
                    dataKey="report_count"
                    name="Reports"
                    fill="#fb923c"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={80}
                  >
                    <LabelList
                      dataKey="report_count"
                      position="top"
                      style={{ fontFamily: 'Poppins', fontSize: 10.5, fontWeight: 600, fill: '#c2620d' }}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
        <div className="chart-card full-width">
          <h3 style={{ marginBottom:12, color: '#14868C', fontWeight: 800,fontSize: '1.4rem' }}>
            Machines by Institute
          </h3>
          <InstituteOrbitCloud byHospital={data.byHospital} />
        </div>
      </div>
    </div>
  );
};

export default MammogramStats;