import React, { useState } from 'react';
import { FaTimes, FaCopy, FaCheck, FaEnvelope, FaLink } from 'react-icons/fa';

const API_URL = 'http://localhost:5000';

const ShareRoomModal = ({ roomId, onClose }) => {
  const [emails, setEmails] = useState('');
  const [copied, setCopied] = useState(false);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState('');

  const shareUrl = `http://localhost:3000/room/${roomId}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendInvites = async () => {
    const emailList = emails
      .split(',')
      .map(e => e.trim())
      .filter(e => e.length > 0);

    if (emailList.length === 0) {
      setMessage('Vui lòng nhập ít nhất một email');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const invalidEmails = emailList.filter(e => !emailRegex.test(e));
    if (invalidEmails.length > 0) {
      setMessage(`Email không hợp lệ: ${invalidEmails.join(', ')}`);
      return;
    }

    setSending(true);
    setMessage('');

    try {
      const response = await fetch(`${API_URL}/api/rooms/invite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          roomId,
          emails: emailList
        })
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('✅ Đã gửi lời mời thành công!');
        setEmails('');
      } else {
        setMessage(`❌ ${data.error || 'Không thể gửi lời mời'}`);
      }
    } catch (error) {
      console.error('Error sending invites:', error);
      setMessage('❌ Lỗi kết nối. Vui lòng thử lại.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content share-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Chia sẻ bảng vẽ</h2>
          <button className="close-btn" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <div className="modal-body">
          {/* Share Link */}
          <div className="share-section">
            <div className="section-icon">
              <FaLink />
            </div>
            <h3>Link chia sẻ</h3>
            <p className="section-description">
              Copy link này để chia sẻ với người khác
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

          {/* Email Invites */}
          <div className="share-section">
            <div className="section-icon">
              <FaEnvelope />
            </div>
            <h3>Mời qua Email</h3>
            <p className="section-description">
              Nhập email của người bạn muốn mời (ngăn cách bằng dấu phẩy)
            </p>
            <textarea
              className="email-input"
              placeholder="example1@email.com, example2@email.com"
              value={emails}
              onChange={(e) => setEmails(e.target.value)}
              rows={3}
            />
            <button
              className="send-invite-btn"
              onClick={handleSendInvites}
              disabled={sending}
            >
              {sending ? 'Đang gửi...' : 'Gửi lời mời'}
            </button>
            {message && (
              <div className={`message ${message.includes('✅') ? 'success' : 'error'}`}>
                {message}
              </div>
            )}
          </div>
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
        }

        .modal-content {
          background: white;
          border-radius: 12px;
          max-width: 500px;
          width: 90%;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px;
          border-bottom: 1px solid #e0e0e0;
        }

        .modal-header h2 {
          margin: 0;
          font-size: 24px;
          color: #333;
        }

        .close-btn {
          background: none;
          border: none;
          font-size: 24px;
          cursor: pointer;
          color: #666;
          padding: 5px;
          transition: color 0.2s;
        }

        .close-btn:hover {
          color: #000;
        }

        .modal-body {
          padding: 20px;
        }

        .share-section {
          margin-bottom: 30px;
        }

        .share-section:last-child {
          margin-bottom: 0;
        }

        .section-icon {
          color: #4285f4;
          font-size: 24px;
          margin-bottom: 10px;
        }

        .share-section h3 {
          margin: 0 0 8px 0;
          font-size: 18px;
          color: #333;
        }

        .section-description {
          margin: 0 0 15px 0;
          color: #666;
          font-size: 14px;
        }

        .share-link-container {
          display: flex;
          gap: 10px;
        }

        .share-link-input {
          flex: 1;
          padding: 10px;
          border: 1px solid #ddd;
          border-radius: 6px;
          font-size: 14px;
          background: #f5f5f5;
        }

        .copy-btn {
          padding: 10px 20px;
          background: #4285f4;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          transition: background 0.2s;
        }

        .copy-btn:hover {
          background: #3367d6;
        }

        .copy-btn.copied {
          background: #34a853;
        }

        .email-input {
          width: 100%;
          padding: 10px;
          border: 1px solid #ddd;
          border-radius: 6px;
          font-size: 14px;
          font-family: inherit;
          resize: vertical;
          margin-bottom: 10px;
        }

        .email-input:focus {
          outline: none;
          border-color: #4285f4;
        }

        .send-invite-btn {
          width: 100%;
          padding: 12px;
          background: #4285f4;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 16px;
          transition: background 0.2s;
        }

        .send-invite-btn:hover:not(:disabled) {
          background: #3367d6;
        }

        .send-invite-btn:disabled {
          background: #ccc;
          cursor: not-allowed;
        }

        .message {
          margin-top: 10px;
          padding: 10px;
          border-radius: 6px;
          font-size: 14px;
        }

        .message.success {
          background: #e8f5e9;
          color: #2e7d32;
        }

        .message.error {
          background: #ffebee;
          color: #c62828;
        }
      `}</style>
    </div>
  );
};

export default ShareRoomModal;

