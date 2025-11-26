import React, { useState, useEffect } from 'react';
import { 
  FaShapes, FaGoogle, FaPencilAlt, FaUsers, FaLightbulb, 
  FaChartLine, FaRocket, FaShieldAlt, FaClock, FaGlobe,
  FaDrawPolygon, FaComments, FaChartBar
} from 'react-icons/fa';

const HomePage = ({ onGoogleLogin }) => {
  const [stats, setStats] = useState({ visits: 0, users: 0, countries: 0 });
  const [currentFeature, setCurrentFeature] = useState(0);

  useEffect(() => {
    // Fetch basic stats
    fetchStats();
    
    // Auto-rotate features
    const interval = setInterval(() => {
      setCurrentFeature(prev => (prev + 1) % 3);
    }, 3000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch('https://collabboardptitbe-production.up.railway.app/api/analytics/public-stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.log('Stats not available yet');
    }
  };

  const features = [
    { icon: <FaPencilAlt />, text: "Vẽ tự do với Excalidraw" },
    { icon: <FaUsers />, text: "Cộng tác real-time" },
    { icon: <FaChartBar />, text: "Biểu đồ & sơ đồ" }
  ];

  return (
    <div className="homepage">
      <nav className="homepage-navbar">
        <div className="homepage-logo">
          <FaShapes /> <span>CollabBoard</span>
        </div>
        
        <div className="nav-links">
          <a href="#features" className="nav-link">Tính năng</a>
          <a href="#how-it-works" className="nav-link">Cách hoạt động</a>
          <a href="#stats" className="nav-link">Thống kê</a>
        </div>
        
        <button className="google-login-btn" onClick={onGoogleLogin}>
          <FaGoogle /> Đăng nhập với Google
        </button>
      </nav>

      <div className="homepage-content">
        <div className="hero-section">
          <div className="hero-badge">
            <FaRocket /> Nền tảng cộng tác hàng đầu
          </div>
          
          <h1 className="homepage-title">
            Bảng Vẽ Cộng Tác <br/>
            <span className="gradient-text">Thời Gian Thực</span>
          </h1>
          
          <p className="homepage-subtitle">
            Vẽ, thiết kế và cộng tác với đội nhóm của bạn mọi lúc, mọi nơi. 
            <br/>Công cụ mạnh mẽ cho brainstorming, wireframing và flowcharts.
          </p>

          <div className="cta-buttons">
            <button className="cta-primary" onClick={onGoogleLogin}>
              <FaGoogle /> Bắt đầu miễn phí
            </button>
            <button className="cta-secondary" onClick={() => {
              document.getElementById('features').scrollIntoView({ behavior: 'smooth' });
            }}>
              Tìm hiểu thêm →
            </button>
          </div>

          <div className="rotating-feature">
            <div className="feature-showcase" key={currentFeature}>
              {features[currentFeature].icon}
              <span>{features[currentFeature].text}</span>
            </div>
          </div>
        </div>

        <div id="features" className="features-section">
          <h2 className="section-title">Tính năng nổi bật</h2>
          <div className="features-grid">
            <FeatureCard
              icon={<FaDrawPolygon />}
              title="Vẽ Tự Do"
              description="Công cụ vẽ đa dạng: shapes, arrows, text, freehand. Hỗ trợ Excalidraw với UI trực quan."
            />
            <FeatureCard
              icon={<FaUsers />}
              title="Cộng Tác Real-time"
              description="Nhiều người cùng vẽ đồng thời. Xem cursor của nhau và đồng bộ tức thì qua WebSocket."
            />
            <FeatureCard
              icon={<FaLightbulb />}
              title="Brainstorming"
              description="Biến ý tưởng thành hiện thực. Mind maps, flowcharts, wireframes cho mọi dự án."
            />
            <FeatureCard
              icon={<FaChartBar />}
              title="Biểu đồ & Sơ đồ"
              description="Vẽ sơ đồ tổ chức, flowcharts, UML diagrams. Tích hợp charts cho phân tích dữ liệu."
            />
            <FeatureCard
              icon={<FaComments />}
              title="Chat Nhóm"
              description="Trò chuyện ngay trong phòng làm việc. Lưu lịch sử tin nhắn và typing indicators."
            />
            <FeatureCard
              icon={<FaShieldAlt />}
              title="Bảo mật cao"
              description="Xác thực Google OAuth. Quản lý quyền truy cập phòng và dữ liệu được mã hóa."
            />
            <FeatureCard
              icon={<FaClock />}
              title="Lịch sử phiên"
              description="Tự động lưu mọi thay đổi. Khôi phục drawing từ các phiên trước."
            />
            <FeatureCard
              icon={<FaChartLine />}
              title="Analytics"
              description="Thống kê truy cập theo quốc gia. Dashboard phân tích hoạt động người dùng."
            />
            <FeatureCard
              icon={<FaGlobe />}
              title="Toàn cầu"
              description="Sử dụng ở bất kỳ đâu. Hỗ trợ đa ngôn ngữ và multiple timezones."
            />
          </div>
        </div>

        <div id="how-it-works" className="how-section">
          <h2 className="section-title">Cách hoạt động</h2>
          <div className="steps-container">
            <StepCard
              number="1"
              title="Đăng nhập"
              description="Sử dụng tài khoản Google để truy cập nhanh chóng và bảo mật"
            />
            <StepCard
              number="2"
              title="Tạo phòng"
              description="Tạo phòng làm việc mới hoặc tham gia phòng có sẵn qua link"
            />
            <StepCard
              number="3"
              title="Mời thành viên"
              description="Chia sẻ link phòng qua email hoặc copy link trực tiếp"
            />
            <StepCard
              number="4"
              title="Bắt đầu vẽ"
              description="Cộng tác real-time với team và lưu tự động mọi thay đổi"
            />
          </div>
        </div>

        <div id="stats" className="stats-section">
          <h2 className="section-title">Thống kê hệ thống</h2>
          <div className="stats-grid">
            <StatCard
              icon={<FaGlobe />}
              value={stats.visits || "1,234"}
              label="Lượt truy cập"
            />
            <StatCard
              icon={<FaUsers />}
              value={stats.users || "567"}
              label="Người dùng"
            />
            <StatCard
              icon={<FaChartLine />}
              value={stats.countries || "42"}
              label="Quốc gia"
            />
          </div>
        </div>
      </div>

      <footer className="homepage-footer">
        <p>&copy; 2025 CollabBoard - Nhóm 20 Lập trình mạng</p>
        <div className="footer-links">
          <a href="#privacy">Privacy</a>
          <a href="#terms">Terms</a>
          <a href="#contact">Contact</a>
        </div>
      </footer>
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

const StepCard = ({ number, title, description }) => {
  return (
    <div className="step-card">
      <div className="step-number">{number}</div>
      <h3 className="step-title">{title}</h3>
      <p className="step-description">{description}</p>
    </div>
  );
};

const StatCard = ({ icon, value, label }) => {
  return (
    <div className="stat-card">
      <div className="stat-icon">{icon}</div>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
};

export default HomePage;