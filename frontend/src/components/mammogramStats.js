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

const InstituteMachineTable = ({ byHospital }) => {
  const hospitals = byHospital || [];

  const rows = [];
  hospitals.forEach((h) => {
    const machines = h.machines && h.machines.length > 0
      ? h.machines
      : [{ machine_name: '—', make: '—', technology: '—', machine_count: 0 }];

    machines.forEach((m) => {
      rows.push({
        institute: h.short_name || h.hospital_name || h.name,
        machine_name: m.machine_name,
        make: m.make,
        technology: m.technology,
        machine_count: m.machine_count,
      });
    });
  });

  if (rows.length === 0) {
    return <p style={{ textAlign: 'center', color: '#6b7280' }}>No institute data available.</p>;
  }

return (
    <div className="chart-wrapper" style={{ overflowX: 'auto', height: 'auto' }}>
      <table className="institute-machine-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ backgroundColor: '#14868C', color: '#fff' }}>
            <th style={thStyle}>Institute</th>
            <th style={thStyle}>Machine</th>
            <th style={thStyle}>Make</th>
            <th style={thStyle}>Technology</th>
            <th style={{ ...thStyle, textAlign: 'center' }}>No. of Machines</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} style={{ borderBottom: '1px solid #e5e7eb' }}>
              <td style={{ ...tdStyle, backgroundColor: '#ecfdf5', fontWeight: 600, color: '#1f2937' }}>
                {row.institute}
              </td>
              <td style={tdStyle}>{row.machine_name}</td>
              <td style={tdStyle}>{row.make}</td>
              <td style={tdStyle}>{row.technology}</td>
              <td style={{ ...tdStyle, textAlign: 'center' }}>{row.machine_count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const thStyle = {
  padding: '10px 14px',
  textAlign: 'left',
  fontFamily: 'Poppins',
  fontWeight: 600,
  fontSize: 13,
};

const tdStyle = {
  padding: '10px 14px',
  fontFamily: 'Poppins',
  fontSize: 13,
  color: '#374151',
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
        {/* <div className="chart-card full-width">
          <h3>Mammogram Completeness</h3>
          <div className="chart-wrapper pie-wrapper">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.setCompleteness || []}
                  cx="50%" cy="50%" outerRadius="80%"
                  dataKey="value" nameKey="name"
                  labelLine={false}
                  label={CustomPieLabel}
                >
                  {(data.setCompleteness || []).map((entry, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend verticalAlign="bottom" height={36} content={<CustomLegend />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div> */}

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

         <div className="chart-wrapper" style={{ height: "550px" }}>
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

        <div className="chart-card full-width">
          <h3>Machines by Institute</h3>
          <InstituteMachineTable byHospital={data.byHospital} />
        </div>
      </div>
    </div>
  );
};

export default MammogramStats;