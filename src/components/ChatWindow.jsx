import React, { useState } from 'react';
import { FaTimes, FaPaperPlane } from 'react-icons/fa';

const ChatWindow = ({ onClose, user }) => {
  const [messages, setMessages] = useState([
    { 
      id: 1, 
      text: 'Chào! Chúng ta bắt đầu vẽ thôi.', 
      sender: 'User A', 
      isOwn: false 
    },
    { 
      id: 2, 
      text: 'Ok, tôi sẽ thêm tiêu đề trước.', 
      sender: user.name, 
      isOwn: true 
    },
  ]);
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (input.trim()) {
      setMessages([...messages, {
        id: Date.now(),
        text: input,
        sender: user.name,
        isOwn: true
      }]);
      setInput('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  return (
    <div className="chat-window">
      <div className="chat-header">
        <span>Chat Trực Tuyến</span>
        <button 
          onClick={onClose} 
          className="close-btn"
          title="Đóng Chat"
        >
          <FaTimes />
        </button>
      </div>

      <div className="chat-messages">
        {messages.map(msg => (
          <div
            key={msg.id}
            className={`message ${msg.isOwn ? 'outgoing' : 'incoming'}`}
          >
            {msg.text}
          </div>
        ))}
      </div>

      <div className="chat-input">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Gửi tin nhắn..."
        />
        <button onClick={handleSend} title="Gửi">
          <FaPaperPlane />
        </button>
      </div>
    </div>
  );
};

export default ChatWindow;