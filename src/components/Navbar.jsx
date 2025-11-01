import React, { useState } from 'react';
import { FaShapes, FaComments, FaUserCircle, FaSignOutAlt } from 'react-icons/fa';

const Navbar = ({ user, onChatClick, onLogout }) => {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <nav className="navbar">
      <div className="navbar-logo">
        <FaShapes /> CollabBoard
      </div>
      
      <div className="navbar-tools">
        <button className="chat-toggle-btn" onClick={onChatClick}>
          <FaComments /> Chat
        </button>

        <div className="user-menu-container">
          <button 
            className="user-menu-btn"
            onClick={() => setShowMenu(!showMenu)}
          >
            {user.picture ? (
              <img 
                src={user.picture} 
                alt={user.name}
                className="user-avatar"
              />
            ) : (
              <FaUserCircle className="user-icon" />
            )}
            <span className="user-name">{user.name}</span>
          </button>

          {showMenu && (
            <div className="dropdown-menu">
              <button 
                className="dropdown-item logout-btn"
                onClick={onLogout}
              >
                <FaSignOutAlt /> Đăng xuất
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;