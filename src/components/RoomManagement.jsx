import React, { useState, useEffect } from "react";
import { 
  FaUsers, FaClock, FaEdit, FaTrash, FaPlus, 
  FaChartBar, FaEye, FaComments, FaPencilAlt 
} from 'react-icons/fa';
import CollaboratorModal from "./CollaboratorModal";
import "./RoomManagement.css";

const API_URL = 'https://collabboardptitbe-production.up.railway.app';

// eslint-disable-next-line no-unused-vars
function RoomManagement({ user, onNavigateToRoom }) {
  const [ownedRooms, setOwnedRooms] = useState([]);
  const [collaboratedRooms, setCollaboratedRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("owned");
  const [editingRoom, setEditingRoom] = useState(null);
  const [editForm, setEditForm] = useState({ name: "", description: "" });
  const [showAddCollaborator, setShowAddCollaborator] = useState(null);
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [roomStats, setRoomStats] = useState({
    totalRooms: 0,
    totalCollaborators: 0,
    totalDrawings: 0,
    totalMessages: 0
  });

  useEffect(() => {
    fetchRooms();
    fetchRoomStats();
  }, []);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/rooms`, {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setOwnedRooms(data.owned || []);
        setCollaboratedRooms(data.collaborated || []);
      }
    } catch (error) {
      console.error("Error fetching rooms:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRoomStats = async () => {
    try {
      const response = await fetch(`${API_URL}/api/rooms/stats`, {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setRoomStats(data);
      }
    } catch (error) {
      console.error("Error fetching room stats:", error);
    }
  };

  const createNewRoom = async () => {
    // Ngăn double-click hoặc multiple calls
    if (isCreatingRoom) {
      console.log("Đang tạo phòng, vui lòng đợi...");
      return;
    }

    const name = prompt("Nhập tên phòng:");
    if (!name) return;

    const description = prompt("Nhập mô tả (tùy chọn):");

    try {
      setIsCreatingRoom(true);
      console.log("Đang tạo phòng...");

      const response = await fetch(`${API_URL}/api/rooms/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ name, description }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log("Phòng đã tạo:", data.roomId);
        await fetchRooms(); // Đợi fetch xong mới thông báo
        alert("Tạo phòng thành công!");
      } else {
        const error = await response.json();
        console.error("Lỗi tạo phòng:", error);
        alert(error.error || "Lỗi khi tạo phòng");
      }
    } catch (error) {
      console.error("Error creating room:", error);
      alert("Lỗi kết nối khi tạo phòng");
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
        method: "DELETE",
        credentials: "include",
      });

      if (response.ok) {
        fetchRooms();
        alert("Xóa phòng thành công!");
      } else {
        const error = await response.json();
        alert(error.error || "Lỗi khi xóa phòng");
      }
    } catch (error) {
      console.error("Error deleting room:", error);
      alert("Lỗi khi xóa phòng");
    }
  };

  const startEdit = (room) => {
    setEditingRoom(room.id);
    setEditForm({
      name: room.name,
      description: room.description || "",
    });
  };

  const cancelEdit = () => {
    setEditingRoom(null);
    setEditForm({ name: "", description: "" });
  };

  const saveEdit = async (roomId) => {
    try {
      const response = await fetch(`${API_URL}/api/rooms/${roomId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(editForm),
      });

      if (response.ok) {
        fetchRooms();
        setEditingRoom(null);
        alert("Cập nhật thành công!");
      }
    } catch (error) {
      console.error("Error updating room:", error);
      alert("Lỗi khi cập nhật phòng");
    }
  };

  const openCollaboratorModal = (roomId) => {
    setShowAddCollaborator(roomId);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const renderRoom = (room, isOwned) => {
    const isEditing = editingRoom === room.id;

    return (
      <div key={room.id} className="room-card-enhanced">
        {isEditing ? (
          <div className="room-edit-form">
            <input
              type="text"
              value={editForm.name}
              onChange={(e) =>
                setEditForm({ ...editForm, name: e.target.value })
              }
              placeholder="Tên phòng"
              className="edit-input"
            />
            <textarea
              value={editForm.description}
              onChange={(e) =>
                setEditForm({ ...editForm, description: e.target.value })
              }
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
            <div className="room-header-enhanced">
              <div className="room-title-section">
                <h3 className="room-name">{room.name}</h3>
                {room.is_active && (
                  <span className="room-badge active">🟢 Active</span>
                )}
              </div>
              <div className="room-icons">
                <FaPencilAlt />
              </div>
            </div>

            <p className="room-description">
              {room.description || "Không có mô tả"}
            </p>

            <div className="room-stats-mini">
              {isOwned && (
                <>
                  <div className="stat-mini">
                    <FaUsers />
                    <span>{room.collaborator_count || 0}</span>
                  </div>
                  <div className="stat-mini">
                    <FaEye />
                    <span>{room.view_count || 0}</span>
                  </div>
                  <div className="stat-mini">
                    <FaComments />
                    <span>{room.message_count || 0}</span>
                  </div>
                </>
              )}
            </div>

            <div className="room-meta">
              {isOwned ? (
                <>
                  <span className="meta-item">
                    <FaClock /> Tạo: {formatDate(room.created_at)}
                  </span>
                </>
              ) : (
                <>
                  <span className="meta-item">
                    <FaUsers /> Chủ phòng: {room.owner_name}
                  </span>
                  <span className="meta-item">Quyền: {room.my_role}</span>
                </>
              )}
            </div>

            <div className="room-actions-enhanced">
              <button
                onClick={() => onNavigateToRoom(room.id)}
                className="btn-primary-new"
              >
                <FaEye /> Mở phòng
              </button>

              {isOwned && (
                <>
                  <button
                    onClick={() => startEdit(room)}
                    className="btn-icon"
                    title="Chỉnh sửa"
                  >
                    <FaEdit />
                  </button>
                  <button
                    onClick={() => openCollaboratorModal(room.id)}
                    className="btn-icon"
                    title="Cộng tác viên"
                  >
                    <FaUsers />
                  </button>
                  <button
                    onClick={() => deleteRoom(room.id, room.name)}
                    className="btn-icon btn-danger-icon"
                    title="Xóa"
                  >
                    <FaTrash />
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
        <h1><FaChartBar /> Quản lý Phòng</h1>
        <button
          onClick={createNewRoom}
          className="btn-create"
          disabled={isCreatingRoom}
        >
          {isCreatingRoom ? "⏳ Đang tạo..." : <><FaPlus /> Tạo phòng mới</>}
        </button>
      </div>

      {/* Statistics Dashboard */}
      <div className="stats-dashboard">
        <div className="stat-card-dash">
          <div className="stat-icon-dash" style={{ background: '#667eea' }}>
            <FaChartBar />
          </div>
          <div className="stat-content-dash">
            <div className="stat-value-dash">{roomStats.totalRooms}</div>
            <div className="stat-label-dash">Tổng phòng</div>
          </div>
        </div>
        <div className="stat-card-dash">
          <div className="stat-icon-dash" style={{ background: '#28a745' }}>
            <FaUsers />
          </div>
          <div className="stat-content-dash">
            <div className="stat-value-dash">{roomStats.totalCollaborators}</div>
            <div className="stat-label-dash">Cộng tác viên</div>
          </div>
        </div>
        <div className="stat-card-dash">
          <div className="stat-icon-dash" style={{ background: '#ffc107' }}>
            <FaPencilAlt />
          </div>
          <div className="stat-content-dash">
            <div className="stat-value-dash">{roomStats.totalDrawings}</div>
            <div className="stat-label-dash">Tổng vẽ</div>
          </div>
        </div>
        <div className="stat-card-dash">
          <div className="stat-icon-dash" style={{ background: '#17a2b8' }}>
            <FaComments />
          </div>
          <div className="stat-content-dash">
            <div className="stat-value-dash">{roomStats.totalMessages}</div>
            <div className="stat-label-dash">Tin nhắn</div>
          </div>
        </div>
      </div>

      <div className="room-tabs">
        <button
          className={`tab ${activeTab === "owned" ? "active" : ""}`}
          onClick={() => setActiveTab("owned")}
        >
          Phòng của tôi ({ownedRooms.length})
        </button>
        <button
          className={`tab ${activeTab === "collaborated" ? "active" : ""}`}
          onClick={() => setActiveTab("collaborated")}
        >
          Phòng cộng tác ({collaboratedRooms.length})
        </button>
      </div>

      <div className="rooms-grid">
        {activeTab === "owned" ? (
          ownedRooms.length > 0 ? (
            ownedRooms.map((room) => renderRoom(room, true))
          ) : (
            <div className="empty-state">
              <p>Bạn chưa có phòng nào</p>
              <button onClick={createNewRoom} className="btn-primary">
                Tạo phòng đầu tiên
              </button>
            </div>
          )
        ) : collaboratedRooms.length > 0 ? (
          collaboratedRooms.map((room) => renderRoom(room, false))
        ) : (
          <div className="empty-state">
            <p>Bạn chưa được mời vào phòng nào</p>
          </div>
        )}
      </div>

      {/* Collaborator Modal - Unified */}
      {showAddCollaborator && (
        <CollaboratorModal
          roomId={showAddCollaborator}
          onClose={() => setShowAddCollaborator(null)}
        />
      )}
    </div>
  );
}

export default RoomManagement;
