import React, { useState, useEffect } from 'react';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';
import { Image as ImageIcon, FileCheck2, Building2 } from 'lucide-react';
import './Stats.css';

const COLORS = ['#6ee7b7', '#fde047', '#fb923c', '#fb7185', '#14868C'];

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
          <h3>Assessment Completeness</h3>
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
          <h3>Mammogram Uploads by Institution</h3>
          <div
            className="chart-wrapper hospital-chart-scroll"
            style={{ overflowX: "auto", overflowY: "hidden" }}
          >
            <div
              style={{
                width: `${Math.max((data.byHospital?.length || 0) * 90, 900)}px`,
                height: "100%",
              }}
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={data.byHospital || []}
                  margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
                  barCategoryGap={20}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#14868C"
                    strokeOpacity={0.1}
                  />

                  <XAxis
                    dataKey="short_name"
                    interval={0}
                    angle={-40}
                    textAnchor="end"
                    height={80}
                    tick={{
                      fontSize: 11,
                      fill: "#14868C",
                      fontFamily: "Poppins",
                      fontWeight: 500,
                    }}
                  />

                  <YAxis
                    tick={{
                      fontSize: 12,
                      fill: "#14868C",
                      fontFamily: "Poppins",
                      fontWeight: 500,
                    }}
                  />

                  <Tooltip content={<CustomTooltip />} />
                  <Legend verticalAlign="bottom" height={36} />

                  <Bar
                    dataKey="dicom_count"
                    name="DICOM Views"
                    stackId="a"
                    fill="#14868C"
                    maxBarSize={45}
                  />

                  <Bar
                    dataKey="report_count"
                    name="Reports"
                    stackId="a"
                    fill="#fb923c"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={45}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MammogramStats;