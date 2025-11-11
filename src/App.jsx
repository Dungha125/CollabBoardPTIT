import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Excalidraw,
  MainMenu,
  WelcomeScreen,
} from "@excalidraw/excalidraw";
import "@excalidraw/excalidraw/index.css";
import Navbar from './components/Navbar';
import ChatWindow from './components/ChatWindow';
import HomePage from './components/HomePage';
import CollaboratorModal from './components/CollaboratorModal';
import RoomInfo from './components/RoomInfo';
import RoomManagement from './components/RoomManagement';
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
  const [currentView, setCurrentView] = useState('whiteboard'); // 'whiteboard' or 'rooms'
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  
  // Lưu trữ scene data để persist khi có thay đổi
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
    }
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

  // Update excalidrawAPI ref
  useEffect(() => {
    excalidrawAPIRef.current = excalidrawAPI;
  }, [excalidrawAPI]);

  // Setup socket connection when user is logged in (ONCE)
  useEffect(() => {
    if (!user) return;

    socketService.connect(API_URL);
    setIsConnected(true);

    // Setup socket listeners
    socketService.onRoomState(({ elements, appState, isInitialLoad }) => {
      console.log(`📥 Received room state (${elements?.length || 0} elements, initial: ${isInitialLoad})`);
      
      // Filter appState to remove collaborators (not serializable)
      const safeAppState = appState ? {
        ...appState,
        collaborators: new Map() // Reset to empty Map
      } : undefined;
      
      // Cập nhật state để persist dữ liệu
      setSceneData({
        elements: elements || [],
        appState: safeAppState || sceneData.appState
      });
      
      // Cập nhật Excalidraw canvas
      if (excalidrawAPIRef.current) {
        isReceivingUpdate.current = true;
        
        excalidrawAPIRef.current.updateScene({
          elements: elements || [],
          appState: safeAppState
        });
        
        setTimeout(() => {
          isReceivingUpdate.current = false;
        }, 200);
      }
      
      hasLoadedInitialData.current = true;
    });

    socketService.onDrawingUpdate(({ elements, appState }) => {
      console.log(`📥 Received drawing update (${elements?.length || 0} elements)`);
      if (excalidrawAPIRef.current && !isReceivingUpdate.current) {
        isReceivingUpdate.current = true;
        
        // Filter appState to remove collaborators (not serializable)
        const safeAppState = appState ? {
          ...appState,
          collaborators: new Map() // Reset to empty Map
        } : undefined;
        
        // Cập nhật state để persist dữ liệu
        setSceneData({
          elements: elements || [],
          appState: safeAppState || sceneData.appState
        });
        
        // Cập nhật Excalidraw canvas
        excalidrawAPIRef.current.updateScene({
          elements: elements || [],
          appState: safeAppState
        });
        
        setTimeout(() => {
          isReceivingUpdate.current = false;
        }, 200);
      }
    });

    socketService.onUserJoined(({ user: joinedUser }) => {
      console.log('User joined:', joinedUser);
    });

    socketService.onUserLeft(({ userId }) => {
      console.log('User left:', userId);
    });

    socketService.onUserCount((count) => {
      setUserCount(count);
    });

    // Check if there's a room ID in the URL
    const urlRoomId = window.location.pathname.split('/room/')[1];
    if (urlRoomId) {
      setRoomId(urlRoomId);
      setCurrentView('whiteboard');
      socketService.joinRoom(urlRoomId, user);
    }
    
    // Check if we're on rooms management page
    if (window.location.pathname === '/rooms') {
      setCurrentView('rooms');
    }

    return () => {
      socketService.removeAllListeners();
      socketService.disconnect();
    };
  }, [user]); // Only depend on user, run once when user logs in

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

  const createRoom = async () => {
    // Prevent double-click or multiple calls
    if (isCreatingRoom) {
      console.log('⚠️  Already creating a room, please wait...');
      return;
    }

    // Debounce: Prevent rapid consecutive calls (minimum 2 seconds between calls)
    const now = Date.now();
    const timeSinceLastCall = now - createRoomTimestamp.current;
    if (timeSinceLastCall < 2000) {
      console.log('⚠️  Please wait before creating another room');
      return;
    }
    createRoomTimestamp.current = now;

    try {
      setIsCreatingRoom(true);
      console.log('🏗️  Creating new room...');
      
      const response = await fetch(`${API_URL}/api/rooms/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          name: `Room ${new Date().toLocaleString('vi-VN')}`,
          description: ''
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Room created:', data.roomId);
        
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
          }
        });
        hasLoadedInitialData.current = false;
        
        setRoomId(data.roomId);
        socketService.joinRoom(data.roomId, user);
        window.history.pushState({}, '', `/room/${data.roomId}`);
        setIsShareModalOpen(true);
      } else {
        const error = await response.json();
        console.error('❌ Failed to create room:', error);
        alert('Không thể tạo phòng. Vui lòng thử lại.');
      }
    } catch (error) {
      console.error('❌ Error creating room:', error);
      alert('Lỗi kết nối. Vui lòng thử lại.');
    } finally {
      // Delay reset to ensure UI doesn't flicker
      setTimeout(() => {
        setIsCreatingRoom(false);
      }, 500);
    }
  };

  const _joinRoom = useCallback((targetRoomId) => {
    if (targetRoomId && user) {
      setRoomId(targetRoomId);
      socketService.joinRoom(targetRoomId, user);
    }
  }, [user]);

  const navigateToRooms = () => {
    setCurrentView('rooms');
    window.history.pushState({}, '', '/rooms');
  };

  const navigateToWhiteboard = () => {
    setCurrentView('whiteboard');
    window.history.pushState({}, '', '/');
  };

  const navigateToRoom = (targetRoomId) => {
    // Reset scene data để load dữ liệu mới từ room
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
      }
    });
    hasLoadedInitialData.current = false;
    
    setRoomId(targetRoomId);
    setCurrentView('whiteboard');
    socketService.joinRoom(targetRoomId, user);
    window.history.pushState({}, '', `/room/${targetRoomId}`);
  };

  const handleExcalidrawChange = useCallback((elements, appState) => {
    // Only send updates if:
    // 1. Not currently receiving updates from others
    // 2. In a room
    // 3. Socket is connected
    if (isReceivingUpdate.current || !roomId || !isConnected) {
      return;
    }

    // Throttle: only send updates every 100ms
    if (throttleTimeout.current) {
      clearTimeout(throttleTimeout.current);
    }

    throttleTimeout.current = setTimeout(() => {
      const currentStateString = JSON.stringify({ 
        elements: elements?.slice(0, 10), // Only check first 10 for performance
        elementCount: elements?.length 
      });
      
      // Avoid sending if nothing changed
      if (lastSentState.current !== currentStateString) {
        lastSentState.current = currentStateString;
        console.log('Sending drawing update, elements:', elements?.length);
        
        // Filter appState to remove non-serializable data
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
          // Don't send: collaborators (Map - not serializable)
        } : undefined;
        
        socketService.sendDrawingUpdate(elements, serializableAppState);
      }
    }, 100); // Throttle to 100ms
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
        currentView={currentView}
      />
      
      <main className="content-area">
        {currentView === 'rooms' ? (
          <RoomManagement 
            user={user} 
            onNavigateToRoom={navigateToRoom}
          />
        ) : (
          <>
            <div className="excalidraw-wrapper">
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
        </div>
        
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
          <ShareRoomModal
            roomId={roomId}
            onClose={() => setIsShareModalOpen(false)}
          />
        )}
        
            {isChatOpen && <ChatWindow onClose={toggleChat} user={user} />}
          </>
        )}
      </main>
    </div>
  );
}

export default App;