import React from 'react';
import { FaUsers, FaShare } from 'react-icons/fa';

const RoomInfo = ({ roomId, userCount, onShareClick }) => {
  if (!roomId) return null;

  return (
    <div className="room-info">
      <div className="room-id">
        <span className="label">Room:</span>
        <span className="value">{roomId.slice(0, 8)}...</span>
      </div>
      
      <div className="user-count">
        <FaUsers />
        <span>{userCount} người</span>
      </div>

      <button className="share-btn" onClick={onShareClick} title="Chia sẻ">
        <FaShare />
        <span>Chia sẻ</span>
      </button>

      <style>{`
        .room-info {
          position: fixed;
          top: 70px;
          right: 20px;
          background: white;
          border-radius: 8px;
          padding: 12px 16px;
          display: flex;
          align-items: center;
          gap: 15px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
          z-index: 1000;
          font-size: 14px;
        }

        .room-id {
          display: flex;
          align-items: center;
          gap: 5px;
        }

        .room-id .label {
          color: #666;
          font-weight: 500;
        }

        .room-id .value {
          color: #333;
          font-family: monospace;
          background: #f5f5f5;
          padding: 2px 6px;
          border-radius: 4px;
        }

        .user-count {
          display: flex;
          align-items: center;
          gap: 6px;
          color: #4285f4;
          font-weight: 500;
        }

        .share-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          background: #4285f4;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          transition: background 0.2s;
        }

        .share-btn:hover {
          background: #3367d6;
        }

        @media (max-width: 768px) {
          .room-info {
            top: auto;
            bottom: 20px;
            right: 20px;
            flex-direction: column;
            gap: 10px;
            align-items: stretch;
          }

          .share-btn {
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
};

export default RoomInfo;

