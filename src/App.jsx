import React, { useState, useEffect, useRef, useCallback } from "react";
import { Excalidraw, MainMenu, WelcomeScreen } from "@excalidraw/excalidraw";
import "@excalidraw/excalidraw/index.css";
import Navbar from './components/Navbar';
import ChatWindow from './components/ChatWindow';
import HomePage from './components/HomePage';
import CollaboratorModal from './components/CollaboratorModal';
import RoomInfo from './components/RoomInfo';
import RoomManagement from './components/RoomManagement';
import AccountManagement from './components/AccountManagement';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import MindmapToolbar from './components/MindmapToolbar';
import CollaboratorCursors from './components/CollaboratorCursors';
import socketService from './services/socketService';
import './App.css';

const API_URL = 'https://collabboardptitbe-production.up.railway.app';


function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [excalidrawAPI, setExcalidrawAPI] = useState(null);
  const [roomId, setRoomId] = useState(null);
  const [userCount, setUserCount] = useState(1);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [currentView, setCurrentView] = useState('whiteboard'); 
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [drawingMode, setDrawingMode] = useState('normal'); // 'normal' | 'mindmap' | 'diagram'
  const [collaborators, setCollaborators] = useState({});
  const [sceneData, setSceneData] = useState({
    elements: [],
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
  });

  const isReceivingUpdate = useRef(false);
  const lastSentState = useRef(null);
  const excalidrawAPIRef = useRef(null);
  const throttleTimeout = useRef(null);
  const createRoomTimestamp = useRef(0);
  const hasLoadedInitialData = useRef(false);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  useEffect(() => {
    excalidrawAPIRef.current = excalidrawAPI;
  }, [excalidrawAPI]);

  // Track mouse movement for collaborator cursors
  useEffect(() => {
    if (!roomId || !isConnected || !excalidrawAPI) return;

    const handleMouseMove = (e) => {
      const canvas = document.querySelector('.excalidraw-canvas');
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const appState = excalidrawAPI.getAppState();
      const zoom = appState.zoom || 1;
      const scrollX = appState.scrollX || 0;
      const scrollY = appState.scrollY || 0;

      // Convert screen coordinates to scene coordinates
      const sceneX = (e.clientX - rect.left) / zoom + scrollX;
      const sceneY = (e.clientY - rect.top) / zoom + scrollY;

      socketService.sendPointerUpdate({ x: sceneX, y: sceneY }, user);
    };

    const canvas = document.querySelector('.excalidraw-canvas');
    if (canvas) {
      canvas.addEventListener('mousemove', handleMouseMove);
    }

    return () => {
      if (canvas) {
        canvas.removeEventListener('mousemove', handleMouseMove);
      }
    };
  }, [roomId, isConnected, excalidrawAPI, user]);

  useEffect(() => {
    if (!user) return;

    socketService.connect(API_URL);
    setIsConnected(true);

    socketService.onRoomState(({ elements, appState, isInitialLoad }) => {
      console.log(`Received room state (${elements?.length || 0} elements, initial: ${isInitialLoad})`);
      
      // Filter appState to remove collaborators (not serializable)
      const safeAppState = appState ? {
        ...appState,
        collaborators: new Map() // Reset to empty Map
      } : undefined;
      
      // Cập nhật state để persist dữ liệu
      setSceneData({
        elements: elements || [],
        appState: safeAppState || sceneData.appState,
      });

      if (excalidrawAPIRef.current) {
        isReceivingUpdate.current = true;

        excalidrawAPIRef.current.updateScene({
          elements: elements || [],
          appState: safeAppState,
        });

        setTimeout(() => {
          isReceivingUpdate.current = false;
        }, 200);
      }

      hasLoadedInitialData.current = true;
    });

    socketService.onDrawingUpdate(({ elements, appState }) => {
      console.log(`Received drawing update (${elements?.length || 0} elements)`);
      if (excalidrawAPIRef.current && !isReceivingUpdate.current) {
        isReceivingUpdate.current = true;
        const safeAppState = appState ? {
          ...appState,
          collaborators: new Map() 
        } : undefined;
        
        // Cập nhật state để persist dữ liệu
        setSceneData({
          elements: elements || [],
          appState: safeAppState || sceneData.appState,
        });
        excalidrawAPIRef.current.updateScene({
          elements: elements || [],
          appState: safeAppState,
        });

        setTimeout(() => {
          isReceivingUpdate.current = false;
        }, 200);
      }
    });

    socketService.onUserJoined(({ user: joinedUser, userId }) => {
      console.log("User joined:", joinedUser);
      setCollaborators(prev => ({
        ...prev,
        [userId]: joinedUser,
      }));
    });

    socketService.onUserLeft(({ userId }) => {
      console.log("User left:", userId);
      setCollaborators(prev => {
        const updated = { ...prev };
        delete updated[userId];
        return updated;
      });
    });

    socketService.onUserCount((count) => {
      setUserCount(count);
    });

    // Listen for pointer updates from other users
    socketService.onPointerUpdate(({ userId, pointer, user }) => {
      if (window.updateCollaboratorCursor) {
        window.updateCollaboratorCursor(userId, pointer, user);
      }
    });
    const urlRoomId = window.location.pathname.split('/room/')[1];
    if (urlRoomId) {
      setRoomId(urlRoomId);
      setCurrentView("whiteboard");
      socketService.joinRoom(urlRoomId, user);
    }
    if (window.location.pathname === "/rooms") {
      setCurrentView("rooms");
    }

    return () => {
      socketService.removeAllListeners();
      socketService.disconnect();
    };
  }, [user]); 

  const checkAuthStatus = async () => {
    try {
      const response = await fetch(`${API_URL}/auth/status`, {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      }
    } catch (error) {
      console.error("Error checking auth:", error);
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
        method: "POST",
        credentials: "include",
      });
      setUser(null);
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  const toggleChat = () => {
    setIsChatOpen((prev) => !prev);
  };

  const createRoom = async () => {
    if (isCreatingRoom) {
      console.log('Already creating a room, please wait...');
      return;
    }
    const now = Date.now();
    const timeSinceLastCall = now - createRoomTimestamp.current;
    if (timeSinceLastCall < 2000) {
      console.log('Please wait before creating another room');
      return;
    }
    createRoomTimestamp.current = now;

    try {
      setIsCreatingRoom(true);
      console.log('Creating new room...');
      
      const response = await fetch(`${API_URL}/api/rooms/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          name: `Room ${new Date().toLocaleString("vi-VN")}`,
          description: "",
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Room created:', data.roomId);
        
        // Reset scene data cho room mới
        setSceneData({
          elements: [],
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
        });
        hasLoadedInitialData.current = false;

        setRoomId(data.roomId);
        socketService.joinRoom(data.roomId, user);
        window.history.pushState({}, "", `/room/${data.roomId}`);
        setIsShareModalOpen(true);
      } else {
        const error = await response.json();
        console.error('Failed to create room:', error);
        alert('Không thể tạo phòng. Vui lòng thử lại.');
      }
    } catch (error) {
      console.error('Error creating room:', error);
      alert('Lỗi kết nối. Vui lòng thử lại.');
    } finally {
      setTimeout(() => {
        setIsCreatingRoom(false);
      }, 500);
    }
  };

  const navigateToRooms = () => {
    setCurrentView("rooms");
    window.history.pushState({}, "", "/rooms");
  };

  const navigateToWhiteboard = () => {
    setCurrentView("whiteboard");
    window.history.pushState({}, "", "/");
  };

  const navigateToAccount = () => {
    setCurrentView("account");
    window.history.pushState({}, "", "/account");
  };

  const navigateToAnalytics = () => {
    setCurrentView("analytics");
    window.history.pushState({}, "", "/analytics");
  };

  const navigateToRoom = (targetRoomId) => {
    setSceneData({
      elements: [],
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
    });
    hasLoadedInitialData.current = false;

    setRoomId(targetRoomId);
    setCurrentView("whiteboard");
    socketService.joinRoom(targetRoomId, user);
    window.history.pushState({}, "", `/room/${targetRoomId}`);
  };

  const handleExcalidrawChange = useCallback((elements, appState) => {
    if (isReceivingUpdate.current || !roomId || !isConnected) {
      return;
    }
    if (throttleTimeout.current) {
      clearTimeout(throttleTimeout.current);
    }

    throttleTimeout.current = setTimeout(() => {
      const currentStateString = JSON.stringify({ 
        elements: elements?.slice(0, 10), 
        elementCount: elements?.length 
      });
      
      if (lastSentState.current !== currentStateString) {
        lastSentState.current = currentStateString;
        console.log('Sending drawing update, elements:', elements?.length);
        const serializableAppState = appState ? {
          viewBackgroundColor: appState.viewBackgroundColor,
          currentItemStrokeColor: appState.currentItemStrokeColor,
          currentItemBackgroundColor: appState.currentItemBackgroundColor,
          currentItemFillStyle: appState.currentItemFillStyle,
          currentItemStrokeWidth: appState.currentItemStrokeWidth,
          currentItemRoughness: appState.currentItemRoughness,
          currentItemOpacity: appState.currentItemOpacity,
          currentItemFontFamily: appState.currentItemFontFamily,
          currentItemFontSize: appState.currentItemFontSize,
          currentItemTextAlign: appState.currentItemTextAlign,
          currentItemStartArrowhead: appState.currentItemStartArrowhead,
          currentItemEndArrowhead: appState.currentItemEndArrowhead,
          scrollX: appState.scrollX,
          scrollY: appState.scrollY,
          zoom: appState.zoom,
        } : undefined;
        
        socketService.sendDrawingUpdate(elements, serializableAppState);
      }
    }, 100); 
  }, [roomId, isConnected]);

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
        onNavigateToRooms={navigateToRooms}
        onNavigateToWhiteboard={navigateToWhiteboard}
        onNavigateToAccount={navigateToAccount}
        onNavigateToAnalytics={navigateToAnalytics}
        currentView={currentView}
        onMindmapToggle={() => setDrawingMode(drawingMode === 'mindmap' ? 'normal' : 'mindmap')}
        isMindmapMode={drawingMode === 'mindmap'}
      />

      <main className="content-area">
        {currentView === "rooms" ? (
          <RoomManagement user={user} onNavigateToRoom={navigateToRoom} />
        ) : currentView === "account" ? (
          <AccountManagement 
            user={user} 
            onLogout={handleLogout}
            onNavigateToWhiteboard={navigateToWhiteboard}
          />
        ) : currentView === "analytics" ? (
          <AnalyticsDashboard 
            onNavigateToWhiteboard={navigateToWhiteboard}
          />
        ) : (
          <>
            <div className="excalidraw-wrapper" id="excalidraw-wrapper">
              <Excalidraw
            excalidrawAPI={(api) => setExcalidrawAPI(api)}
            onChange={(elements, appState) => {
              handleExcalidrawChange(elements, appState);
            }}
            initialData={{
              appState: sceneData.appState,
              elements: sceneData.elements,
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
            
            <WelcomeScreen>
              <WelcomeScreen.Hints.MenuHint />
              <WelcomeScreen.Hints.ToolbarHint />
              <WelcomeScreen.Hints.HelpHint />
            </WelcomeScreen>
          </Excalidraw>
          
          {/* Collaborator Cursors Overlay */}
          {roomId && (
            <CollaboratorCursors 
              collaborators={collaborators}
              excalidrawAPI={excalidrawAPI}
            />
          )}
        </div>
        
        {/* Mindmap Toolbar */}
        {drawingMode === 'mindmap' && (
          <MindmapToolbar
            excalidrawAPI={excalidrawAPI}
            onModeChange={setDrawingMode}
            isActive={drawingMode === 'mindmap'}
          />
        )}
        
        {roomId ? (
          <RoomInfo 
            roomId={roomId}
            userCount={userCount}
            onShareClick={() => setIsShareModalOpen(true)}
          />
        ) : (
          <div className="create-room-prompt">
            <button 
              className="create-room-btn" 
              onClick={createRoom}
              disabled={isCreatingRoom}
            >
              <span className="icon">{isCreatingRoom ? '⏳' : '🎨'}</span>
              <span className="text">
                {isCreatingRoom ? 'Đang tạo phòng...' : 'Tạo phòng để cộng tác'}
              </span>
            </button>
          </div>
        )}
        
        {isShareModalOpen && roomId && (
          <CollaboratorModal
            roomId={roomId}
            onClose={() => setIsShareModalOpen(false)}
          />
        )}
        
          {isChatOpen && roomId && (
  <ChatWindow onClose={toggleChat} user={user} roomId={roomId} />
)}
          </>
        )}
      </main>
    </div>
  );
}

export default App;
