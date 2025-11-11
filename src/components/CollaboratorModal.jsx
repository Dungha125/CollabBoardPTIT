import React, { useState, useEffect } from 'react';
import { FaTimes, FaCopy, FaCheck, FaEnvelope, FaLink, FaUsers, FaTrash } from 'react-icons/fa';

const API_URL = 'https://collabboardptitbe-production.up.railway.app';

const CollaboratorModal = ({ roomId, onClose }) => {
  const [activeTab, setActiveTab] = useState('invite'); // 'invite' or 'manage'
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('editor');
  const [copied, setCopied] = useState(false);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState('');
  const [collaborators, setCollaborators] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sendEmail, setSendEmail] = useState(true); // Checkbox: có gửi email không

  const shareUrl = `https://collab-board-ptit.vercel.app/room/${roomId}`;

  useEffect(() => {
    if (activeTab === 'manage') {
      fetchCollaborators();
    }
  }, [activeTab, roomId]);

  const fetchCollaborators = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/rooms/${roomId}`, {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setCollaborators(data.collaborators || []);
      }
    } catch (error) {
      console.error('Error fetching collaborators:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAddCollaborator = async () => {
    if (!email.trim()) {
      setMessage('❌ Vui lòng nhập email');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setMessage('❌ Email không hợp lệ');
      return;
    }

    setSending(true);
    setMessage('');

    try {
      // 1. Thêm collaborator vào database
      const addResponse = await fetch(`${API_URL}/api/rooms/${roomId}/collaborators`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, role })
      });

      if (!addResponse.ok) {
        const error = await addResponse.json();
        setMessage(`❌ ${error.error || 'Không thể thêm cộng tác viên'}`);
        setSending(false);
        return;
      }

      // 2. Nếu checkbox "Gửi email" được chọn → Gửi email mời
      if (sendEmail) {
        const emailResponse = await fetch(`${API_URL}/api/rooms/invite`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            roomId,
            emails: [email]
          })
        });

        if (emailResponse.ok) {
          setMessage(`✅ Đã thêm ${email} (${getRoleText(role)}) và gửi email mời!`);
        } else {
          setMessage(`⚠️ Đã thêm ${email} nhưng không gửi được email`);
        }
      } else {
        setMessage(`✅ Đã thêm ${email} (${getRoleText(role)})`);
      }

      setEmail('');
      setRole('editor');
      
      // Refresh collaborators list if on manage tab
      if (activeTab === 'manage') {
        await fetchCollaborators();
      }
    } catch (error) {
      console.error('Error adding collaborator:', error);
      setMessage('❌ Lỗi kết nối. Vui lòng thử lại.');
    } finally {
      setSending(false);
    }
  };

  const handleRemoveCollaborator = async (userId, userName) => {
    if (!confirm(`Xóa ${userName} khỏi phòng?`)) return;

    try {
      const response = await fetch(`${API_URL}/api/rooms/${roomId}/collaborators/${userId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        setMessage(`✅ Đã xóa ${userName}`);
        await fetchCollaborators();
      } else {
        const error = await response.json();
        setMessage(`❌ ${error.error || 'Không thể xóa'}`);
      }
    } catch (error) {
      console.error('Error removing collaborator:', error);
      setMessage('❌ Lỗi kết nối');
    }
  };

  const handleUpdateRole = async (userId, newRole) => {
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
        setMessage(`✅ Đã cập nhật quyền`);
        await fetchCollaborators();
      } else {
        const error = await response.json();
        setMessage(`❌ ${error.error || 'Không thể cập nhật'}`);
      }
    } catch (error) {
      console.error('Error updating role:', error);
      setMessage('❌ Lỗi kết nối');
    }
  };

  const getRoleText = (role) => {
    switch (role) {
      case 'viewer': return 'Xem';
      case 'editor': return 'Chỉnh sửa';
      case 'admin': return 'Quản lý';
      default: return role;
    }
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'viewer': return '#757575';
      case 'editor': return '#4285f4';
      case 'admin': return '#f4511e';
      default: return '#757575';
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content collab-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Chia sẻ & Cộng tác</h2>
          <button className="close-btn" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        {/* Tabs */}
        <div className="modal-tabs">
          <button
            className={`tab ${activeTab === 'invite' ? 'active' : ''}`}
            onClick={() => setActiveTab('invite')}
          >
            <FaEnvelope /> Mời người mới
          </button>
          <button
            className={`tab ${activeTab === 'manage' ? 'active' : ''}`}
            onClick={() => setActiveTab('manage')}
          >
            <FaUsers /> Quản lý ({collaborators.length})
          </button>
        </div>

        <div className="modal-body">
          {/* Tab: Mời người mới */}
          {activeTab === 'invite' && (
            <>
              {/* Share Link Section */}
              <div className="section">
                <div className="section-icon">
                  <FaLink />
                </div>
                <h3>Link chia sẻ</h3>
                <p className="section-description">
                  Copy link này để chia sẻ nhanh
                </p>
                <div className="share-link-container">
                  <input
                    type="text"
                    value={shareUrl}
                    readOnly
                    className="share-link-input"
                  />
                  <button
                    className={`copy-btn ${copied ? 'copied' : ''}`}
                    onClick={handleCopy}
                  >
                    {copied ? <FaCheck /> : <FaCopy />}
                    {copied ? 'Đã copy!' : 'Copy'}
                  </button>
                </div>
              </div>

              {/* Add Collaborator Section */}
              <div className="section">
                <div className="section-icon">
                  <FaEnvelope />
                </div>
                <h3>Mời qua Email & Phân quyền</h3>
                <p className="section-description">
                  Thêm cộng tác viên với quyền cụ thể và gửi email mời
                </p>
                
                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    className="input-field"
                    placeholder="example@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddCollaborator()}
                  />
                </div>

                <div className="form-group">
                  <label>Quyền truy cập</label>
                  <select
                    className="input-field"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                  >
                    <option value="viewer">👁️ Viewer - Chỉ xem</option>
                    <option value="editor">✏️ Editor - Chỉnh sửa</option>
                    <option value="admin">👑 Admin - Quản lý</option>
                  </select>
                </div>

                <div className="form-group checkbox-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={sendEmail}
                      onChange={(e) => setSendEmail(e.target.checked)}
                    />
                    <span>Gửi email mời ngay</span>
                  </label>
                  <small className="help-text">
                    {sendEmail ? 'Người này sẽ nhận email với link tham gia' : 'Chỉ thêm vào danh sách, không gửi email'}
                  </small>
                </div>

                <button
                  className="primary-btn"
                  onClick={handleAddCollaborator}
                  disabled={sending}
                >
                  {sending ? 'Đang xử lý...' : 'Thêm cộng tác viên'}
                </button>
              </div>
            </>
          )}

          {/* Tab: Quản lý cộng tác viên */}
          {activeTab === 'manage' && (
            <div className="section">
              <h3>Danh sách cộng tác viên</h3>
              {loading ? (
                <div className="loading-text">Đang tải...</div>
              ) : collaborators.length === 0 ? (
                <div className="empty-state">
                  <p>Chưa có cộng tác viên nào</p>
                  <button
                    className="secondary-btn"
                    onClick={() => setActiveTab('invite')}
                  >
                    Mời người đầu tiên
                  </button>
                </div>
              ) : (
                <div className="collaborator-list">
                  {collaborators.map((collab) => (
                    <div key={collab.id} className="collaborator-item">
                      <div className="collab-info">
                        <img
                          src={collab.picture || 'https://via.placeholder.com/40'}
                          alt={collab.name}
                          className="collab-avatar"
                        />
                        <div className="collab-details">
                          <div className="collab-name">{collab.name}</div>
                          <div className="collab-email">{collab.email}</div>
                        </div>
                      </div>
                      <div className="collab-actions">
                        <select
                          className="role-select"
                          value={collab.role}
                          onChange={(e) => handleUpdateRole(collab.user_id, e.target.value)}
                          style={{ borderColor: getRoleBadgeColor(collab.role) }}
                        >
                          <option value="viewer">👁️ Viewer</option>
                          <option value="editor">✏️ Editor</option>
                          <option value="admin">👑 Admin</option>
                        </select>
                        <button
                          className="remove-btn"
                          onClick={() => handleRemoveCollaborator(collab.user_id, collab.name)}
                          title="Xóa"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Message */}
          {message && (
            <div className={`message ${message.includes('✅') || message.includes('⚠️') ? 'success' : 'error'}`}>
              {message}
            </div>
          )}
        </div>
      </div>

      <style>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 10000;
          animation: fadeIn 0.2s;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .modal-content {
          background: white;
          border-radius: 16px;
          max-width: 600px;
          width: 95%;
          max-height: 90vh;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
          animation: slideUp 0.3s;
        }

        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 24px;
          border-bottom: 1px solid #e0e0e0;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }

        .modal-header h2 {
          margin: 0;
          font-size: 24px;
          font-weight: 600;
        }

        .close-btn {
          background: rgba(255, 255, 255, 0.2);
          border: none;
          font-size: 20px;
          cursor: pointer;
          color: white;
          padding: 8px;
          border-radius: 50%;
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.2s;
        }

        .close-btn:hover {
          background: rgba(255, 255, 255, 0.3);
        }

        .modal-tabs {
          display: flex;
          border-bottom: 2px solid #f0f0f0;
          background: #fafafa;
        }

        .modal-tabs .tab {
          flex: 1;
          padding: 16px;
          background: none;
          border: none;
          cursor: pointer;
          font-size: 15px;
          font-weight: 500;
          color: #666;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: all 0.2s;
          border-bottom: 3px solid transparent;
        }

        .modal-tabs .tab:hover {
          background: #f5f5f5;
          color: #333;
        }

        .modal-tabs .tab.active {
          color: #667eea;
          background: white;
          border-bottom-color: #667eea;
        }

        .modal-body {
          padding: 24px;
          overflow-y: auto;
          flex: 1;
        }

        .section {
          margin-bottom: 28px;
        }

        .section:last-child {
          margin-bottom: 0;
        }

        .section-icon {
          color: #667eea;
          font-size: 24px;
          margin-bottom: 12px;
        }

        .section h3 {
          margin: 0 0 8px 0;
          font-size: 18px;
          color: #333;
          font-weight: 600;
        }

        .section-description {
          margin: 0 0 16px 0;
          color: #666;
          font-size: 14px;
          line-height: 1.5;
        }

        .share-link-container {
          display: flex;
          gap: 10px;
        }

        .share-link-input {
          flex: 1;
          padding: 12px;
          border: 2px solid #e0e0e0;
          border-radius: 8px;
          font-size: 14px;
          background: #f9f9f9;
          font-family: monospace;
        }

        .copy-btn {
          padding: 12px 20px;
          background: #667eea;
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          font-weight: 500;
          transition: all 0.2s;
          white-space: nowrap;
        }

        .copy-btn:hover {
          background: #5568d3;
          transform: translateY(-1px);
        }

        .copy-btn.copied {
          background: #34a853;
        }

        .form-group {
          margin-bottom: 16px;
        }

        .form-group label {
          display: block;
          margin-bottom: 8px;
          font-weight: 500;
          color: #333;
          font-size: 14px;
        }

        .input-field {
          width: 100%;
          padding: 12px;
          border: 2px solid #e0e0e0;
          border-radius: 8px;
          font-size: 14px;
          font-family: inherit;
          transition: border-color 0.2s;
        }

        .input-field:focus {
          outline: none;
          border-color: #667eea;
        }

        select.input-field {
          cursor: pointer;
          background: white;
        }

        .checkbox-group {
          background: #f9f9f9;
          padding: 12px;
          border-radius: 8px;
        }

        .checkbox-label {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          font-weight: 500;
          color: #333;
        }

        .checkbox-label input[type="checkbox"] {
          width: 18px;
          height: 18px;
          cursor: pointer;
        }

        .help-text {
          display: block;
          margin-top: 6px;
          margin-left: 26px;
          color: #666;
          font-size: 13px;
        }

        .primary-btn {
          width: 100%;
          padding: 14px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-size: 16px;
          font-weight: 600;
          transition: all 0.2s;
        }

        .primary-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
        }

        .primary-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        .secondary-btn {
          padding: 10px 20px;
          background: white;
          color: #667eea;
          border: 2px solid #667eea;
          border-radius: 8px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          transition: all 0.2s;
        }

        .secondary-btn:hover {
          background: #667eea;
          color: white;
        }

        .loading-text {
          text-align: center;
          padding: 40px;
          color: #666;
        }

        .empty-state {
          text-align: center;
          padding: 40px 20px;
          color: #666;
        }

        .empty-state p {
          margin: 0 0 16px 0;
          font-size: 15px;
        }

        .collaborator-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .collaborator-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px;
          background: #f9f9f9;
          border: 2px solid #e0e0e0;
          border-radius: 10px;
          transition: all 0.2s;
        }

        .collaborator-item:hover {
          border-color: #667eea;
          background: white;
        }

        .collab-info {
          display: flex;
          align-items: center;
          gap: 12px;
          flex: 1;
        }

        .collab-avatar {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          object-fit: cover;
          border: 2px solid #e0e0e0;
        }

        .collab-details {
          flex: 1;
          min-width: 0;
        }

        .collab-name {
          font-weight: 600;
          color: #333;
          font-size: 15px;
          margin-bottom: 2px;
        }

        .collab-email {
          color: #666;
          font-size: 13px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .collab-actions {
          display: flex;
          gap: 8px;
          align-items: center;
        }

        .role-select {
          padding: 6px 10px;
          border: 2px solid;
          border-radius: 6px;
          font-size: 13px;
          cursor: pointer;
          background: white;
          font-weight: 500;
          transition: all 0.2s;
        }

        .role-select:hover {
          opacity: 0.8;
        }

        .remove-btn {
          padding: 8px;
          background: #ffebee;
          color: #c62828;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .remove-btn:hover {
          background: #c62828;
          color: white;
        }

        .message {
          margin-top: 16px;
          padding: 12px 16px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          animation: slideIn 0.3s;
        }

        @keyframes slideIn {
          from { transform: translateY(-10px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }

        .message.success {
          background: #e8f5e9;
          color: #2e7d32;
          border: 1px solid #a5d6a7;
        }

        .message.error {
          background: #ffebee;
          color: #c62828;
          border: 1px solid #ef9a9a;
        }

        @media (max-width: 768px) {
          .modal-content {
            max-width: 100%;
            width: 100%;
            height: 100vh;
            max-height: 100vh;
            border-radius: 0;
          }

          .collab-actions {
            flex-direction: column;
            gap: 6px;
          }

          .role-select {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
};

export default CollaboratorModal;

