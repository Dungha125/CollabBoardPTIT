import React, { useState, useEffect } from 'react';
import { 
  FaUser, FaEnvelope, FaClock, FaSignOutAlt, 
  FaChartLine, FaHistory, FaEdit, FaSave, FaTimes 
} from 'react-icons/fa';
import './AccountManagement.css';

const AccountManagement = ({ user, onLogout, onNavigateToWhiteboard }) => {
  const [userStats, setUserStats] = useState({
    roomsCreated: 0,
    roomsJoined: 0,
    totalDrawings: 0,
    lastActive: null
  });
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState(user?.name || '');
  const [recentActivity, setRecentActivity] = useState([]);

  useEffect(() => {
    fetchUserStats();
    fetchRecentActivity();
  }, []);

  const fetchUserStats = async () => {
    try {
      const response = await fetch('https://collabboardptitbe-production.up.railway.app/api/user/stats', {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setUserStats(data);
      }
    } catch (error) {
      console.error('Error fetching user stats:', error);
    }
  };

  const fetchRecentActivity = async () => {
    try {
      const response = await fetch('https://collabboardptitbe-production.up.railway.app/api/user/activity', {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setRecentActivity(data.activities || []);
      }
    } catch (error) {
      console.error('Error fetching activity:', error);
    }
  };

  const handleSaveProfile = async () => {
    try {
      const response = await fetch('https://collabboardptitbe-production.up.railway.app/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ name: displayName })
      });
      
      if (response.ok) {
        setIsEditing(false);
        alert('Cập nhật thành công!');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Lỗi khi cập nhật profile');
    }
  };

  return (
    <div className="account-management">
      <div className="account-header">
        <button className="back-btn" onClick={onNavigateToWhiteboard}>
          ← Quay lại
        </button>
        <h1>Quản lý tài khoản</h1>
      </div>

      <div className="account-content">
        <div className="profile-section">
          <div className="profile-card">
            <div className="profile-avatar">
              {user?.picture ? (
                <img src={user.picture} alt={user.name} />
              ) : (
                <div className="avatar-placeholder">
                  <FaUser />
                </div>
              )}
            </div>
            
            <div className="profile-info">
              {isEditing ? (
                <div className="edit-form">
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Tên hiển thị"
                    className="name-input"
                  />
                  <div className="edit-actions">
                    <button className="save-btn" onClick={handleSaveProfile}>
                      <FaSave /> Lưu
                    </button>
                    <button 
                      className="cancel-btn" 
                      onClick={() => {
                        setIsEditing(false);
                        setDisplayName(user?.name || '');
                      }}
                    >
                      <FaTimes /> Hủy
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <h2>{user?.name}</h2>
                  <button 
                    className="edit-btn" 
                    onClick={() => setIsEditing(true)}
                  >
                    <FaEdit /> Chỉnh sửa
                  </button>
                </>
              )}
              
              <div className="info-item">
                <FaEnvelope />
                <span>{user?.email}</span>
              </div>
              
              <div className="info-item">
                <FaClock />
                <span>
                  Đăng ký: {user?.created_at 
                    ? new Date(user.created_at).toLocaleDateString('vi-VN')
                    : 'N/A'
                  }
                </span>
              </div>
            </div>

            <button className="logout-btn-full" onClick={onLogout}>
              <FaSignOutAlt /> Đăng xuất
            </button>
          </div>

          <div className="stats-cards">
            <StatCard
              icon={<FaChartLine />}
              title="Phòng đã tạo"
              value={userStats.roomsCreated}
              color="#667eea"
            />
            <StatCard
              icon={<FaUser />}
              title="Phòng tham gia"
              value={userStats.roomsJoined}
              color="#28a745"
            />
            <StatCard
              icon={<FaHistory />}
              title="Tổng vẽ"
              value={userStats.totalDrawings}
              color="#ffc107"
            />
          </div>
        </div>

        <div className="activity-section">
          <h2>
            <FaHistory /> Hoạt động gần đây
          </h2>
          
          <div className="activity-list">
            {recentActivity.length > 0 ? (
              recentActivity.map((activity, index) => (
                <ActivityItem
                  key={index}
                  type={activity.type}
                  roomName={activity.roomName}
                  timestamp={activity.timestamp}
                />
              ))
            ) : (
              <div className="no-activity">
                <p>Chưa có hoạt động nào</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ icon, title, value, color }) => {
  return (
    <div className="stat-card-account" style={{ borderLeftColor: color }}>
      <div className="stat-icon-account" style={{ color }}>
        {icon}
      </div>
      <div className="stat-content">
        <div className="stat-value-account">{value}</div>
        <div className="stat-title-account">{title}</div>
      </div>
    </div>
  );
};

const ActivityItem = ({ type, roomName, timestamp }) => {
  const getActivityIcon = () => {
    switch (type) {
      case 'created':
        return '🎨';
      case 'joined':
        return '👋';
      case 'drawing':
        return '✏️';
      case 'chat':
        return '💬';
      default:
        return '📌';
    }
  };

  const getActivityText = () => {
    switch (type) {
      case 'created':
        return `Tạo phòng "${roomName}"`;
      case 'joined':
        return `Tham gia phòng "${roomName}"`;
      case 'drawing':
        return `Vẽ trong phòng "${roomName}"`;
      case 'chat':
        return `Chat trong phòng "${roomName}"`;
      default:
        return `Hoạt động trong "${roomName}"`;
    }
  };

  return (
    <div className="activity-item">
      <div className="activity-icon">{getActivityIcon()}</div>
      <div className="activity-details">
        <p className="activity-text">{getActivityText()}</p>
        <span className="activity-time">
          {new Date(timestamp).toLocaleString('vi-VN')}
        </span>
      </div>
    </div>
  );
};

export default AccountManagement;

