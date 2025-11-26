import React from 'react';
import { 
  FaUsers, FaEye, FaComments, FaPencilAlt, FaClock, 
  FaEdit, FaTrash, FaUserPlus
} from 'react-icons/fa';
import './RoomCard.css';

const RoomCard = ({ 
  room, 
  isOwned, 
  onOpenRoom, 
  onEdit, 
  onDelete, 
  onInvite 
}) => {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getActivityLevel = () => {
    const total = (room.view_count || 0) + (room.message_count || 0) + (room.drawing_count || 0);
    if (total > 100) return { level: 'high', color: '#28a745', label: 'Rất hoạt động' };
    if (total > 50) return { level: 'medium', color: '#ffc107', label: 'Hoạt động' };
    if (total > 10) return { level: 'low', color: '#17a2b8', label: 'Ít hoạt động' };
    return { level: 'none', color: '#6c757d', label: 'Mới' };
  };

  const activity = getActivityLevel();

  return (
    <div className="room-card-v2">
      <div className="room-card-header">
        <div className="room-title-section">
          <h3 className="room-title">{room.name}</h3>
          {room.is_active && <span className="badge-active">🟢 Active</span>}
          <span 
            className="badge-activity" 
            style={{ backgroundColor: activity.color }}
          >
            {activity.label}
          </span>
        </div>
        <div className="room-icon">
          <FaPencilAlt size={24} color="#667eea" />
        </div>
      </div>

      <p className="room-description">
        {room.description || 'Không có mô tả'}
      </p>

      {/* Statistics Grid */}
      <div className="stats-grid-card">
        <div className="stat-item">
          <div className="stat-icon-wrapper" style={{ background: '#e3f2fd' }}>
            <FaEye color="#2196f3" />
          </div>
          <div className="stat-info">
            <div className="stat-value">{room.view_count || 0}</div>
            <div className="stat-label">Lượt xem</div>
          </div>
        </div>

        <div className="stat-item">
          <div className="stat-icon-wrapper" style={{ background: '#e8f5e9' }}>
            <FaUsers color="#4caf50" />
          </div>
          <div className="stat-info">
            <div className="stat-value">{room.collaborator_count || 0}</div>
            <div className="stat-label">Thành viên</div>
          </div>
        </div>

        <div className="stat-item">
          <div className="stat-icon-wrapper" style={{ background: '#fff3e0' }}>
            <FaComments color="#ff9800" />
          </div>
          <div className="stat-info">
            <div className="stat-value">{room.message_count || 0}</div>
            <div className="stat-label">Tin nhắn</div>
          </div>
        </div>

        <div className="stat-item">
          <div className="stat-icon-wrapper" style={{ background: '#f3e5f5' }}>
            <FaPencilAlt color="#9c27b0" />
          </div>
          <div className="stat-info">
            <div className="stat-value">{room.drawing_count || 0}</div>
            <div className="stat-label">Vẽ</div>
          </div>
        </div>
      </div>

      {/* Meta Info */}
      <div className="room-meta">
        <div className="meta-item">
          <FaClock />
          <span>
            {isOwned 
              ? `Tạo: ${formatDate(room.created_at)}`
              : `Tham gia: ${formatDate(room.invited_at || room.created_at)}`
            }
          </span>
        </div>
        {!isOwned && room.owner_name && (
          <div className="meta-item">
            <FaUsers />
            <span>Chủ: {room.owner_name}</span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="room-actions-v2">
        <button className="btn-open" onClick={() => onOpenRoom(room.id)}>
          <FaEye /> Mở phòng
        </button>
        
        {isOwned && (
          <>
            <button className="btn-action" onClick={() => onEdit(room)} title="Chỉnh sửa">
              <FaEdit />
            </button>
            <button className="btn-action" onClick={() => onInvite(room.id)} title="Mời thành viên">
              <FaUserPlus />
            </button>
            <button className="btn-action btn-danger" onClick={() => onDelete(room.id, room.name)} title="Xóa">
              <FaTrash />
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default RoomCard;

