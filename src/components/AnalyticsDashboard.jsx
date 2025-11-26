import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { 
  FaGlobe, FaUsers, FaChartLine, FaClock, FaArrowUp, 
  FaArrowDown, FaEye, FaComments 
} from 'react-icons/fa';
import './AnalyticsDashboard.css';

const API_URL = 'https://collabboardptitbe-production.up.railway.app';

const AnalyticsDashboard = ({ onNavigateToWhiteboard }) => {
  const [analytics, setAnalytics] = useState({
    totalVisits: 0,
    uniqueUsers: 0,
    countries: [],
    visitsByDate: [],
    visitsByCountry: [],
    recentVisits: [],
    growth: { visits: 0, users: 0 }
  });
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7days');

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${API_URL}/api/analytics/dashboard?range=${timeRange}`,
        { credentials: 'include' }
      );
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ['#667eea', '#28a745', '#ffc107', '#17a2b8', '#dc3545', '#6c757d'];

  if (loading) {
    return (
      <div className="analytics-dashboard">
        <div className="analytics-loading">
          <div className="spinner"></div>
          <p>Đang tải dữ liệu phân tích...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="analytics-dashboard">
      <div className="analytics-header">
        <button className="back-btn-analytics" onClick={onNavigateToWhiteboard}>
          ← Quay lại
        </button>
        <h1><FaChartLine /> Analytics Dashboard</h1>
        
        <div className="time-range-selector">
          <button 
            className={timeRange === '7days' ? 'active' : ''}
            onClick={() => setTimeRange('7days')}
          >
            7 ngày
          </button>
          <button 
            className={timeRange === '30days' ? 'active' : ''}
            onClick={() => setTimeRange('30days')}
          >
            30 ngày
          </button>
          <button 
            className={timeRange === 'all' ? 'active' : ''}
            onClick={() => setTimeRange('all')}
          >
            Tất cả
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="metrics-grid">
        <MetricCard
          icon={<FaEye />}
          title="Tổng lượt truy cập"
          value={analytics.totalVisits}
          change={analytics.growth.visits}
          color="#667eea"
        />
        <MetricCard
          icon={<FaUsers />}
          title="Người dùng duy nhất"
          value={analytics.uniqueUsers}
          change={analytics.growth.users}
          color="#28a745"
        />
        <MetricCard
          icon={<FaGlobe />}
          title="Quốc gia"
          value={analytics.countries?.length || 0}
          color="#ffc107"
        />
        <MetricCard
          icon={<FaComments />}
          title="Hoạt động"
          value={analytics.totalActivity || 0}
          color="#17a2b8"
        />
      </div>

      {/* Charts Grid */}
      <div className="charts-grid">
        {/* Visits Over Time */}
        <div className="chart-card">
          <h3>
            <FaClock /> Lượt truy cập theo thời gian
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={analytics.visitsByDate || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="visits" 
                stroke="#667eea" 
                strokeWidth={2}
                name="Lượt truy cập"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Visits by Country - Bar Chart */}
        <div className="chart-card">
          <h3>
            <FaGlobe /> Top quốc gia
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analytics.visitsByCountry?.slice(0, 10) || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="country" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="visits" fill="#28a745" name="Lượt truy cập" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Visits by Country - Pie Chart */}
        <div className="chart-card">
          <h3>
            <FaChartLine /> Phân bố theo quốc gia
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={analytics.visitsByCountry?.slice(0, 6) || []}
                dataKey="visits"
                nameKey="country"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label
              >
                {(analytics.visitsByCountry?.slice(0, 6) || []).map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Recent Visits Table */}
        <div className="chart-card">
          <h3>
            <FaClock /> Truy cập gần đây
          </h3>
          <div className="recent-visits-table">
            <table>
              <thead>
                <tr>
                  <th>Quốc gia</th>
                  <th>Thời gian</th>
                  <th>User</th>
                </tr>
              </thead>
              <tbody>
                {(analytics.recentVisits || []).map((visit, index) => (
                  <tr key={index}>
                    <td>
                      <span className="country-flag">{visit.countryFlag}</span>
                      {visit.country}
                    </td>
                    <td>{new Date(visit.timestamp).toLocaleString('vi-VN')}</td>
                    <td>{visit.userName || 'Anonymous'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {(!analytics.recentVisits || analytics.recentVisits.length === 0) && (
              <div className="no-data">Chưa có dữ liệu</div>
            )}
          </div>
        </div>
      </div>

      {/* Country Details */}
      <div className="country-details">
        <h2>Chi tiết theo quốc gia</h2>
        <div className="country-list">
          {(analytics.visitsByCountry || []).map((country, index) => (
            <div key={index} className="country-item">
              <div className="country-info">
                <span className="country-rank">#{index + 1}</span>
                <span className="country-name">{country.country}</span>
              </div>
              <div className="country-stats">
                <div className="country-bar" style={{ width: `${(country.visits / (analytics.visitsByCountry[0]?.visits || 1)) * 100}%` }}></div>
                <span className="country-value">{country.visits} lượt</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const MetricCard = ({ icon, title, value, change, color }) => {
  return (
    <div className="metric-card" style={{ borderLeftColor: color }}>
      <div className="metric-icon" style={{ color }}>
        {icon}
      </div>
      <div className="metric-content">
        <div className="metric-title">{title}</div>
        <div className="metric-value">{value.toLocaleString()}</div>
        {change !== undefined && (
          <div className={`metric-change ${change >= 0 ? 'positive' : 'negative'}`}>
            {change >= 0 ? <FaArrowUp /> : <FaArrowDown />}
            {Math.abs(change)}%
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalyticsDashboard;

