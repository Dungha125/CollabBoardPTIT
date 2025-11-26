import React, { useState } from 'react';
import { 
  FaShapes, FaComments, FaUserCircle, FaSignOutAlt, 
  FaFolderOpen, FaPaintBrush, FaUser, FaChartLine, FaProjectDiagram 
} from 'react-icons/fa';

const Navbar = ({ 
  user, 
  onChatClick, 
  onLogout, 
  onNavigateToRooms, 
  onNavigateToWhiteboard,
  onNavigateToAccount,
  onNavigateToAnalytics,
  currentView,
  onMindmapToggle,
  isMindmapMode
}) => {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <nav className="navbar">
      <div className="navbar-logo">
        <FaShapes /> CollabBoard
      </div>
      
      <div className="navbar-tools">
        {currentView !== 'whiteboard' && (
          <button className="nav-btn" onClick={onNavigateToWhiteboard}>
            <FaPaintBrush /> Bảng vẽ
          </button>
        )}
        
        {currentView !== 'rooms' && (
          <button className="nav-btn" onClick={onNavigateToRooms}>
            <FaFolderOpen /> Phòng
          </button>
        )}
        
        {currentView !== 'analytics' && (
          <button className="nav-btn" onClick={onNavigateToAnalytics}>
            <FaChartLine /> Analytics
          </button>
        )}
        
        {currentView === 'whiteboard' && onMindmapToggle && (
          <button 
            className={`nav-btn ${isMindmapMode ? 'active' : ''}`}
            onClick={onMindmapToggle}
            title={isMindmapMode ? 'Thoát Mindmap Mode' : 'Bật Mindmap Mode'}
          >
            <FaProjectDiagram /> {isMindmapMode ? 'Thoát Mindmap' : 'Mindmap'}
          </button>
        )}
        
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
                className="dropdown-item"
                onClick={() => {
                  setShowMenu(false);
                  onNavigateToAccount();
                }}
              >
                <FaUser /> Tài khoản
              </button>
              <button 
                className="dropdown-item"
                onClick={() => {
                  setShowMenu(false);
                  onNavigateToRooms();
                }}
              >
                <FaFolderOpen /> Quản lý phòng
              </button>
              <button 
                className="dropdown-item"
                onClick={() => {
                  setShowMenu(false);
                  onNavigateToAnalytics();
                }}
              >
                <FaChartLine /> Analytics
              </button>
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