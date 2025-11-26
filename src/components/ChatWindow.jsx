import React, { useState, useEffect, useRef } from 'react';
import { FaTimes, FaPaperPlane, FaUser } from 'react-icons/fa';
import socketService from '../services/socketService';
import './ChatWindow.css';

const ChatWindow = ({ onClose, user, roomId }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [typingUsers, setTypingUsers] = useState(new Set());
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  /* ==================== 1. Load lịch sử + Socket listeners (chỉ 1 lần) ==================== */
  useEffect(() => {
    if (!roomId || !user?.id) return;

    // Load lịch sử tin nhắn
    const loadChatHistory = async () => {
      try {
        const res = await fetch(`https://collabboardptitbe-production.up.railway.app/api/rooms/${roomId}/messages?limit=100`, {
          credentials: 'include',
        });
        if (!res.ok) throw new Error('Failed to fetch messages');
        const data = await res.json();

        // Chuẩn hóa dữ liệu đúng với backend trả về
        const formatted = data.map(msg => ({
          id: msg.id,
          text: msg.content || '',
          sender: msg.sender_name || 'Ẩn danh',
          senderId: msg.sender_google_id || msg.sender_id,
          picture: msg.sender_picture || null,
          timestamp: msg.created_at, // "2025-11-11T14:48:19.000Z"
        }));

        setMessages(formatted);
      } catch (err) {
        console.error('Load chat history error:', err);
      }
    };

    loadChatHistory();

    // Socket: tin nhắn mới
    const handleNewMessage = (message) => {
      // Backend có thể trả về cùng format, chuẩn hóa lại cho chắc
      const formattedMsg = {
        id: message.id || Date.now(),
        text: message.content || message.text || '',
        sender: message.sender_name || message.sender || 'Ẩn danh',
        senderId: message.sender_id || message.senderId,
        picture: message.sender_picture || message.picture || null,
        timestamp: message.created_at || message.timestamp || new Date().toISOString(),
      };
      setMessages(prev => [...prev, formattedMsg]);
    };

    // Socket: typing
    const handleTyping = ({ userName, isTyping }) => {
      setTypingUsers(prev => {
        const newSet = new Set(prev);
        if (isTyping) newSet.add(userName);
        else newSet.delete(userName);
        return newSet;
      });
    };

    socketService.onChatMessage(handleNewMessage);
    socketService.onUserTyping(handleTyping);

    // Cleanup khi đổi room hoặc unmount
    return () => {
      socketService.socket?.off('chat-message', handleNewMessage);
      socketService.socket?.off('user-typing', handleTyping);
    };
  }, [roomId, user?.id]);

  /* ==================== 2. Auto scroll ==================== */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingUsers]); // scroll khi có typing để không bị che

  /* ==================== 3. Gửi tin nhắn ==================== */
  const handleSend = () => {
    if (!input.trim() || !roomId) return;

    socketService.sendChatMessage(input.trim(), user);
    setInput('');

    // Tắt typing ngay lập tức
    socketService.sendTypingStatus(user, false);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  /* ==================== 4. Typing indicator ==================== */
  const handleInputChange = (e) => {
    setInput(e.target.value);

    if (!roomId) return;

    socketService.sendTypingStatus(user, true);

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    typingTimeoutRef.current = setTimeout(() => {
      socketService.sendTypingStatus(user, false);
    }, 2000);
  };

  /* ==================== 5. Format thời gian (không còn Invalid Date) ==================== */
  const formatTime = (timestamp) => {
    if (!timestamp) return '??:??';

    // Đảm bảo có "Z" ở cuối → new Date hiểu đúng UTC
    const dateStr = timestamp.endsWith('Z') ? timestamp : timestamp + 'Z';
    const date = new Date(dateStr);

    if (isNaN(date)) {
      console.warn('Invalid timestamp:', timestamp);
      return '??:??';
    }

    return date.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };

  /* ==================== Render ==================== */
  return (
    <div className="chat-window">
      <div className="chat-header">
        <div className="chat-header-content">
          <span className="chat-title">Chat Nhóm</span>
          {roomId && <span className="chat-subtitle">Room: {roomId.substring(0, 8)}...</span>}
        </div>
        <button onClick={onClose} className="close-btn" title="Đóng Chat">
          <FaTimes />
        </button>
      </div>

      <div className="chat-messages">
        {messages.length === 0 ? (
          <div className="chat-empty">
            <p>Chưa có tin nhắn nào. Hãy bắt đầu trò chuyện!</p>
          </div>
        ) : (
          messages.map(msg => {
          const isOwn = user?.id != null && String(msg.senderId) === String(user.id);

  // LOG ĐỂ CHECK (xóa sau khi xong)
  console.log('[CHAT DEBUG]', { 
    userId: user?.id, 
    msgSenderId: msg.senderId, 
    isOwn 
  });
            return (
              <div
                key={msg.id}
                className={`message ${isOwn ? 'outgoing' : 'incoming'}`}
              >
                {!isOwn && (
                  <div className="message-avatar">
                    {msg.picture ? (
                      <img src={msg.picture} alt={msg.sender} />
                    ) : (
                      <div className="avatar-placeholder"><FaUser /></div>
                    )}
                  </div>
                )}
                <div className="message-content">
                  {!isOwn && <div className="message-sender">{msg.sender}</div>}
                  <div className="message-bubble">
                    <div className="message-text">{msg.text}</div>
                    <div className="message-time">{formatTime(msg.timestamp)}</div>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />

        {/* Typing indicator */}
        {typingUsers.size > 0 && (
          <div className="typing-indicator">
            <div className="typing-dots">
              <span></span><span></span><span></span>
            </div>
            <span className="typing-text">
              {Array.from(typingUsers).join(', ')} đang soạn tin...
            </span>
          </div>
        )}
      </div>

      <div className="chat-input">
        <input
          type="text"
          value={input}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
          placeholder="Gửi tin nhắn..."
          disabled={!roomId}
        />
        <button
          onClick={handleSend}
          title="Gửi"
          disabled={!input.trim() || !roomId}
        >
          <FaPaperPlane />
        </button>
      </div>
    </div>
  );
};

export default ChatWindow;