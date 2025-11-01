import React from 'react';
import { FaShapes, FaGoogle, FaPencilAlt, FaUsers, FaLightbulb } from 'react-icons/fa';

const HomePage = ({ onGoogleLogin }) => {
  return (
    <div className="homepage">
      <nav className="homepage-navbar">
        <div className="homepage-logo">
          <FaShapes /> CollabBoard
        </div>
        
        <button className="google-login-btn" onClick={onGoogleLogin}>
          <FaGoogle /> Đăng nhập với Google
        </button>
      </nav>

      <div className="homepage-content">
        <h1 className="homepage-title">
          Bảng Vẽ Cộng Tác Trực Tuyến
        </h1>
        
        <p className="homepage-subtitle">
          Vẽ, thiết kế và cộng tác với đội nhóm của bạn trong thời gian thực
        </p>

        <div className="features-grid">
          <FeatureCard
            icon={<FaPencilAlt />}
            title="Vẽ Tự Do"
            description="Công cụ vẽ đa dạng và mạnh mẽ"
          />
          <FeatureCard
            icon={<FaUsers />}
            title="Cộng Tác"
            description="Làm việc nhóm real-time"
          />
          <FeatureCard
            icon={<FaLightbulb />}
            title="Sáng Tạo"
            description="Biến ý tưởng thành hiện thực"
          />
        </div>
      </div>
    </div>
  );
};

const FeatureCard = ({ icon, title, description }) => {
  return (
    <div className="feature-card">
      <div className="feature-icon">{icon}</div>
      <h3 className="feature-title">{title}</h3>
      <p className="feature-description">{description}</p>
    </div>
  );
};

export default HomePage;