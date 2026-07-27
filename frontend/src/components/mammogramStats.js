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

/**
 * Institute-level machine table.
 * Expects data.byHospital[i].machines to be an array of:
 *   { machine_name, make, technology, machine_count }
 * If a hospital has no `machines` array (e.g. API hasn't been updated yet),
 * it falls back to a single "No machine data" row so the table never breaks.
 */
const InstituteMachineTable = ({ byHospital }) => {
  const hospitals = byHospital || [];

  // Build flattened rows, tracking how many rows each institute spans
  const rows = [];
  hospitals.forEach((h) => {
    const machines = h.machines && h.machines.length > 0
      ? h.machines
      : [{ machine_name: '—', make: '—', technology: '—', machine_count: 0 }];

    machines.forEach((m, idx) => {
      rows.push({
        institute: h.hospital_name,
        isFirstRow: idx === 0,
        rowSpan: machines.length,
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
            <th style={thStyle}>No. of Machines</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} style={{ borderBottom: '1px solid #e5e7eb' }}>
              {row.isFirstRow && (
                <td
                  rowSpan={row.rowSpan}
                  style={{ ...tdStyle, fontWeight: 600, verticalAlign: 'middle', backgroundColor: '#f0fdfa' }}
                >
                  {row.institute}
                </td>
              )}
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

  return (
    <div style={{ marginTop: 20 }}>
      <h2 style={{ textAlign: 'center', color: '#34495e', marginBottom: 20 }}>Mammograms</h2>

      <div className="summary-section" style={{ marginBottom: '2rem' }}>
        <div className="summary-card">
          <div className="card-header-with-icon"><ImageIcon className="summary-icon" size={24} /><h3>DICOM Files</h3></div>
          <div className="big-number">{totals.dicom_files ?? 0}</div>
        </div>
        <div className="summary-card">
          <div className="card-header-with-icon"><FileCheck2 className="summary-icon" size={24} /><h3>Reports Uploaded</h3></div>
          <div className="big-number">{totals.reports ?? 0}</div>
        </div>
        <div className="summary-card">
          <div className="card-header-with-icon"><Building2 className="summary-icon" size={24} /><h3>Completion Rate</h3></div>
          <div className="big-number">{data.completionRate ?? 0}%</div>
        </div>
      </div>

      <div className="charts-grid">
        <div className="chart-card full-width">
          <h3>Views Uploaded (CC/MLO x Left/Right)</h3>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.viewTypeCounts || []} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#14868C" strokeOpacity={0.1} />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#14868C', fontFamily: 'Poppins', fontWeight: 500 }} />
                <YAxis tick={{ fontSize: 12, fill: '#14868C', fontFamily: 'Poppins', fontWeight: 500 }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" name="Uploaded" radius={[4, 4, 0, 0]}>
                  {(data.viewTypeCounts || []).map((entry, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="chart-card full-width">
          <h3>Mammogram Completeness</h3>
          <div className="chart-wrapper pie-wrapper">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.setCompleteness || []}
                  cx="50%" cy="50%" outerRadius="80%"
                  dataKey="value" nameKey="name"
                  label={({ name, percent }) => percent > 0 ? `${name}: ${(percent * 100).toFixed(0)}%` : ''}
                >
                  {(data.setCompleteness || []).map((entry, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="chart-card full-width">
          <h3>Hospitals by Machine Type (CR / DR)</h3>
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
                  label={({ payload, percent }) => percent > 0 ? `${payload.name}: ${(percent * 100).toFixed(0)}%` : ''}
                >
                  {(data.hospitalTypeBreakdown || []).map((entry, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                {/* CustomTooltip reads row.hospitals to list institutes in this slice on hover */}
                <Tooltip content={<CustomTooltip />} />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

{/* 
        <div className="chart-card full-width">
          <h3>Report Completeness</h3>
          <div className="chart-wrapper pie-wrapper">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.reportCompleteness || []}
                  cx="50%" cy="50%" outerRadius="80%"
                  dataKey="value" nameKey="name"
                  label={({ name, percent }) => percent > 0 ? `${name}: ${(percent * 100).toFixed(0)}%` : ''}
                >
                  {(data.reportCompleteness || []).map((entry, i) => (
                    <Cell key={i} fill={['#14868C', '#fb923c'][i % 2]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div> */}

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
          <style>{`
            .hospital-chart-scroll {
              scrollbar-width: none;
            }
            .hospital-chart-scroll::-webkit-scrollbar {
              height: 8px;
            }
            .hospital-chart-scroll::-webkit-scrollbar-thumb {
              background: transparent;
              border-radius: 4px;
            }
            .hospital-chart-scroll::-webkit-scrollbar-track {
              background: transparent;
            }
            .hospital-chart-scroll:hover {
              scrollbar-width: thin;
              scrollbar-color: #9ca3af transparent;
            }
            .hospital-chart-scroll:hover::-webkit-scrollbar-thumb {
              background: #9ca3af;
            }
          `}</style>
          <div
            className="chart-wrapper hospital-chart-scroll"
            style={{ overflowX: "auto", overflowY: "hidden" }}
          >
            <div
              style={{
                width: `${Math.max((data.byHospital?.length || 0) * 130, 900)}px`,
                height: "100%",
              }}
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={data.byHospital || []}
                  margin={{ top: 24, right: 30, left: 20, bottom: 80 }}
                  barCategoryGap={12}
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

                  {/* Separate (grouped) bars instead of stacked — no stackId */}
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
          <h3>Machines by Institute</h3>
          <InstituteMachineTable byHospital={data.byHospital} />
        </div>
      </div>
    </div>
  );
};

export default MammogramStats;