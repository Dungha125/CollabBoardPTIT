import React, { useState, useEffect } from 'react';
import './RoomManagement.css';

const API_URL = 'http://localhost:5000';

// eslint-disable-next-line no-unused-vars
function RoomManagement({ user, onNavigateToRoom }) {
  const [ownedRooms, setOwnedRooms] = useState([]);
  const [collaboratedRooms, setCollaboratedRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('owned');
  const [editingRoom, setEditingRoom] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', description: '' });
  const [showAddCollaborator, setShowAddCollaborator] = useState(null);
  const [collaboratorEmail, setCollaboratorEmail] = useState('');
  const [collaboratorRole, setCollaboratorRole] = useState('editor');
  // eslint-disable-next-line no-unused-vars
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [roomCollaborators, setRoomCollaborators] = useState([]);
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/rooms`, {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setOwnedRooms(data.owned || []);
        setCollaboratedRooms(data.collaborated || []);
      }
    } catch (error) {
      console.error('Error fetching rooms:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRoomDetails = async (roomId) => {
    try {
      const response = await fetch(`${API_URL}/api/rooms/${roomId}`, {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setRoomCollaborators(data.collaborators || []);
        setSelectedRoom(data);
      }
    } catch (error) {
      console.error('Error fetching room details:', error);
    }
  };

  const createNewRoom = async () => {
    // Ngăn double-click hoặc multiple calls
    if (isCreatingRoom) {
      console.log('⚠️  Đang tạo phòng, vui lòng đợi...');
      return;
    }

    const name = prompt('Nhập tên phòng:');
    if (!name) return;

    const description = prompt('Nhập mô tả (tùy chọn):');

    try {
      setIsCreatingRoom(true);
      console.log('🏗️  Đang tạo phòng...');

      const response = await fetch(`${API_URL}/api/rooms/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ name, description })
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Phòng đã tạo:', data.roomId);
        await fetchRooms(); // Đợi fetch xong mới thông báo
        alert('Tạo phòng thành công!');
      } else {
        const error = await response.json();
        console.error('❌ Lỗi tạo phòng:', error);
        alert(error.error || 'Lỗi khi tạo phòng');
      }
    } catch (error) {
      console.error('❌ Error creating room:', error);
      alert('Lỗi kết nối khi tạo phòng');
    } finally {
      // Delay để tránh click liên tục
      setTimeout(() => {
        setIsCreatingRoom(false);
      }, 1000);
    }
  };

  const deleteRoom = async (roomId, roomName) => {
    if (!confirm(`Bạn có chắc muốn xóa phòng "${roomName}"?`)) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/rooms/${roomId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        fetchRooms();
        alert('Xóa phòng thành công!');
      } else {
        const error = await response.json();
        alert(error.error || 'Lỗi khi xóa phòng');
      }
    } catch (error) {
      console.error('Error deleting room:', error);
      alert('Lỗi khi xóa phòng');
    }
  };

  const startEdit = (room) => {
    setEditingRoom(room.id);
    setEditForm({
      name: room.name,
      description: room.description || ''
    });
  };

  const cancelEdit = () => {
    setEditingRoom(null);
    setEditForm({ name: '', description: '' });
  };

  const saveEdit = async (roomId) => {
    try {
      const response = await fetch(`${API_URL}/api/rooms/${roomId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(editForm)
      });

      if (response.ok) {
        fetchRooms();
        setEditingRoom(null);
        alert('Cập nhật thành công!');
      }
    } catch (error) {
      console.error('Error updating room:', error);
      alert('Lỗi khi cập nhật phòng');
    }
  };

  const openCollaboratorModal = async (roomId) => {
    setShowAddCollaborator(roomId);
    setCollaboratorEmail('');
    setCollaboratorRole('editor');
    await fetchRoomDetails(roomId);
  };

  const addCollaborator = async () => {
    if (!collaboratorEmail) {
      alert('Vui lòng nhập email');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/rooms/${showAddCollaborator}/collaborators`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          email: collaboratorEmail,
          role: collaboratorRole
        })
      });

      if (response.ok) {
        alert('Thêm cộng tác viên thành công!');
        setCollaboratorEmail('');
        await fetchRoomDetails(showAddCollaborator);
      } else {
        const error = await response.json();
        alert(error.error || 'Lỗi khi thêm cộng tác viên');
      }
    } catch (error) {
      console.error('Error adding collaborator:', error);
      alert('Lỗi khi thêm cộng tác viên');
    }
  };

  const removeCollaborator = async (roomId, userId, userName) => {
    if (!confirm(`Xóa ${userName} khỏi phòng?`)) return;

    try {
      const response = await fetch(`${API_URL}/api/rooms/${roomId}/collaborators/${userId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        alert('Đã xóa cộng tác viên');
        await fetchRoomDetails(roomId);
      }
    } catch (error) {
      console.error('Error removing collaborator:', error);
      alert('Lỗi khi xóa cộng tác viên');
    }
  };

  const updateCollaboratorRole = async (roomId, userId, newRole) => {
    try {
      const response = await fetch(`${API_URL}/api/rooms/${roomId}/collaborators/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ role: newRole })
      });

      if (response.ok) {
        alert('Đã cập nhật quyền');
        await fetchRoomDetails(roomId);
      }
    } catch (error) {
      console.error('Error updating role:', error);
      alert('Lỗi khi cập nhật quyền');
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderRoom = (room, isOwned) => {
    const isEditing = editingRoom === room.id;

    return (
      <div key={room.id} className="room-card">
        {isEditing ? (
          <div className="room-edit-form">
            <input
              type="text"
              value={editForm.name}
              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              placeholder="Tên phòng"
              className="edit-input"
            />
            <textarea
              value={editForm.description}
              onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
              placeholder="Mô tả"
              className="edit-textarea"
            />
            <div className="edit-actions">
              <button onClick={() => saveEdit(room.id)} className="btn-save">
                Lưu
              </button>
              <button onClick={cancelEdit} className="btn-cancel">
                Hủy
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="room-header">
              <h3 className="room-name">{room.name}</h3>
              {room.is_active && <span className="room-badge active">Active</span>}
            </div>
            
            <p className="room-description">
              {room.description || 'Không có mô tả'}
            </p>
            
            <div className="room-meta">
              {isOwned ? (
                <>
                  <span className="meta-item">
                    👥 {room.collaborator_count || 0} cộng tác viên
                  </span>
                  <span className="meta-item">
                    📅 Tạo: {formatDate(room.created_at)}
                  </span>
                </>
              ) : (
                <>
                  <span className="meta-item">
                    👤 Chủ phòng: {room.owner_name}
                  </span>
                  <span className="meta-item">
                    🔑 Quyền: {room.my_role}
                  </span>
                </>
              )}
            </div>
            
            <div className="room-actions">
              <button
                onClick={() => onNavigateToRoom(room.id)}
                className="btn-primary"
              >
                Mở phòng
              </button>
              
              {isOwned && (
                <>
                  <button
                    onClick={() => startEdit(room)}
                    className="btn-secondary"
                  >
                    Sửa
                  </button>
                  <button
                    onClick={() => openCollaboratorModal(room.id)}
                    className="btn-secondary"
                  >
                    Cộng tác viên
                  </button>
                  <button
                    onClick={() => deleteRoom(room.id, room.name)}
                    className="btn-danger"
                  >
                    Xóa
                  </button>
                </>
              )}
            </div>
          </>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="room-management">
        <div className="loading">Đang tải...</div>
      </div>
    );
  }

  return (
    <div className="room-management">
      <div className="room-management-header">
        <h1>Quản lý Phòng</h1>
        <button 
          onClick={createNewRoom} 
          className="btn-create"
          disabled={isCreatingRoom}
        >
          {isCreatingRoom ? '⏳ Đang tạo...' : '+ Tạo phòng mới'}
        </button>
      </div>

      <div className="room-tabs">
        <button
          className={`tab ${activeTab === 'owned' ? 'active' : ''}`}
          onClick={() => setActiveTab('owned')}
        >
          Phòng của tôi ({ownedRooms.length})
        </button>
        <button
          className={`tab ${activeTab === 'collaborated' ? 'active' : ''}`}
          onClick={() => setActiveTab('collaborated')}
        >
          Phòng cộng tác ({collaboratedRooms.length})
        </button>
      </div>

      <div className="rooms-grid">
        {activeTab === 'owned' ? (
          ownedRooms.length > 0 ? (
            ownedRooms.map(room => renderRoom(room, true))
          ) : (
            <div className="empty-state">
              <p>Bạn chưa có phòng nào</p>
              <button onClick={createNewRoom} className="btn-primary">
                Tạo phòng đầu tiên
              </button>
            </div>
          )
        ) : (
          collaboratedRooms.length > 0 ? (
            collaboratedRooms.map(room => renderRoom(room, false))
          ) : (
            <div className="empty-state">
              <p>Bạn chưa được mời vào phòng nào</p>
            </div>
          )
        )}
      </div>

      {/* Collaborator Modal */}
      {showAddCollaborator && (
        <div className="modal-overlay" onClick={() => setShowAddCollaborator(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Quản lý Cộng tác viên</h2>
              <button onClick={() => setShowAddCollaborator(null)} className="modal-close">
                ×
              </button>
            </div>

            <div className="modal-body">
              <div className="add-collaborator-form">
                <h3>Thêm cộng tác viên mới</h3>
                <input
                  type="email"
                  value={collaboratorEmail}
                  onChange={(e) => setCollaboratorEmail(e.target.value)}
                  placeholder="Email người dùng"
                  className="input-email"
                />
                <select
                  value={collaboratorRole}
                  onChange={(e) => setCollaboratorRole(e.target.value)}
                  className="input-role"
                >
                  <option value="viewer">Viewer (Chỉ xem)</option>
                  <option value="editor">Editor (Chỉnh sửa)</option>
                  <option value="admin">Admin (Quản lý)</option>
                </select>
                <button onClick={addCollaborator} className="btn-add">
                  Thêm
                </button>
              </div>

              <div className="collaborators-list">
                <h3>Danh sách cộng tác viên ({roomCollaborators.length})</h3>
                {roomCollaborators.length > 0 ? (
                  <div className="collaborators-table">
                    {roomCollaborators.map((collab) => (
                      <div key={collab.id} className="collaborator-row">
                        <div className="collaborator-info">
                          <img
                            src={collab.picture || 'https://via.placeholder.com/40'}
                            alt={collab.name}
                            className="collaborator-avatar"
                          />
                          <div>
                            <div className="collaborator-name">{collab.name}</div>
                            <div className="collaborator-email">{collab.email}</div>
                          </div>
                        </div>
                        <div className="collaborator-actions">
                          <select
                            value={collab.role}
                            onChange={(e) => updateCollaboratorRole(
                              showAddCollaborator,
                              collab.user_id,
                              e.target.value
                            )}
                            className="role-select"
                          >
                            <option value="viewer">Viewer</option>
                            <option value="editor">Editor</option>
                            <option value="admin">Admin</option>
                          </select>
                          <button
                            onClick={() => removeCollaborator(
                              showAddCollaborator,
                              collab.user_id,
                              collab.name
                            )}
                            className="btn-remove"
                          >
                            Xóa
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="empty-message">Chưa có cộng tác viên</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default RoomManagement;


