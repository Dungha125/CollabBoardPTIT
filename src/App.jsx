import React, { useState, useEffect } from 'react';
import { 
  Excalidraw,
  MainMenu,
  Footer,
  WelcomeScreen,
  LiveCollaborationTrigger,
} from "@excalidraw/excalidraw";
import "@excalidraw/excalidraw/index.css";
import Navbar from './components/Navbar';
import ChatWindow from './components/ChatWindow';
import HomePage from './components/HomePage';
import './App.css';

const API_URL = 'https://collabboardptitbe-production.up.railway.app';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isChatOpen, setIsChatOpen] = useState(false);
  // eslint-disable-next-line no-unused-vars
  const [excalidrawAPI, setExcalidrawAPI] = useState(null);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const response = await fetch(`${API_URL}/auth/status`, {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      }
    } catch (error) {
      console.error('Error checking auth:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = `${API_URL}/auth/google`;
  };

  const handleLogout = async () => {
    try {
      await fetch(`${API_URL}/auth/logout`, {
        method: 'POST',
        credentials: 'include'
      });
      setUser(null);
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const toggleChat = () => {
    setIsChatOpen(prev => !prev);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-text">Đang tải...</div>
      </div>
    );
  }

  if (!user) {
    return <HomePage onGoogleLogin={handleGoogleLogin} />;
  }

  return (
    <div className="app-container">
      <Navbar 
        user={user} 
        onChatClick={toggleChat} 
        onLogout={handleLogout}
      />
      
      <main className="content-area">
        <div className="excalidraw-wrapper">
          <Excalidraw
            excalidrawAPI={(api) => setExcalidrawAPI(api)}
            initialData={{
              appState: {
                viewBackgroundColor: "#ffffff",
                currentItemStrokeColor: "#000000",
                currentItemBackgroundColor: "transparent",
                currentItemFillStyle: "solid",
                currentItemStrokeWidth: 2,
                currentItemRoughness: 1,
                currentItemOpacity: 100,
                currentItemFontFamily: 1,
                currentItemFontSize: 20,
                currentItemTextAlign: "left",
                currentItemStartArrowhead: null,
                currentItemEndArrowhead: "arrow",
              },
              elements: [],
            }}
            name="Collaborative Whiteboard"
            UIOptions={{
              canvasActions: {
                changeViewBackgroundColor: true,
                clearCanvas: true,
                export: { saveFileToDisk: true },
                loadScene: true,
                saveToActiveFile: false,
                toggleTheme: true,
              },
              tools: {
                image: true,
              },
            }}
          >
            <MainMenu>
              <MainMenu.DefaultItems.LoadScene />
              <MainMenu.DefaultItems.SaveAsImage />
              <MainMenu.DefaultItems.Export />
              <MainMenu.Separator />
              <MainMenu.DefaultItems.ClearCanvas />
              <MainMenu.DefaultItems.ChangeCanvasBackground />
              <MainMenu.DefaultItems.ToggleTheme />
            </MainMenu>
            
            <Footer>
              <LiveCollaborationTrigger 
                onSelect={() => window.alert("Realtime Collaboration - Cần kết nối Backend!")}
              />
            </Footer>
            
            <WelcomeScreen>
              <WelcomeScreen.Hints.MenuHint />
              <WelcomeScreen.Hints.ToolbarHint />
              <WelcomeScreen.Hints.HelpHint />
            </WelcomeScreen>
          </Excalidraw>
        </div>
        
        {isChatOpen && <ChatWindow onClose={toggleChat} user={user} />}
      </main>
    </div>
  );
}

export default App;