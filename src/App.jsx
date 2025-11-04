import React, { useState, useEffect, useRef, useCallback } from 'react';
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
import ShareRoomModal from './components/ShareRoomModal';
import RoomInfo from './components/RoomInfo';
import socketService from './services/socketService';
import './App.css';

const API_URL = 'http://localhost:5000';


function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [excalidrawAPI, setExcalidrawAPI] = useState(null);
  const [roomId, setRoomId] = useState(null);
  const [userCount, setUserCount] = useState(1);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const isReceivingUpdate = useRef(false);
  const lastSentState = useRef(null);
  const excalidrawAPIRef = useRef(null);
  const throttleTimeout = useRef(null);

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
    socketService.onRoomState(({ elements, appState }) => {
      console.log('Received room state');
      if (excalidrawAPIRef.current) {
        isReceivingUpdate.current = true;
        
        // Filter appState to remove collaborators (not serializable)
        const safeAppState = appState ? {
          ...appState,
          collaborators: new Map() // Reset to empty Map
        } : undefined;
        
        excalidrawAPIRef.current.updateScene({
          elements,
          appState: safeAppState
        });
        setTimeout(() => {
          isReceivingUpdate.current = false;
        }, 200);
      }
    });

    socketService.onDrawingUpdate(({ elements, appState }) => {
      console.log('Received drawing update');
      if (excalidrawAPIRef.current && !isReceivingUpdate.current) {
        isReceivingUpdate.current = true;
        
        // Filter appState to remove collaborators (not serializable)
        const safeAppState = appState ? {
          ...appState,
          collaborators: new Map() // Reset to empty Map
        } : undefined;
        
        excalidrawAPIRef.current.updateScene({
          elements,
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
      socketService.joinRoom(urlRoomId, user);
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
    try {
      const response = await fetch(`${API_URL}/api/rooms/create`, {
        method: 'POST',
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setRoomId(data.roomId);
        socketService.joinRoom(data.roomId, user);
        window.history.pushState({}, '', `/room/${data.roomId}`);
        setIsShareModalOpen(true);
      }
    } catch (error) {
      console.error('Error creating room:', error);
    }
  };

  const joinRoom = useCallback((targetRoomId) => {
    if (targetRoomId && user) {
      setRoomId(targetRoomId);
      socketService.joinRoom(targetRoomId, user);
    }
  }, [user]);

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
      />
      
      <main className="content-area">
        <div className="excalidraw-wrapper">
          <Excalidraw
            excalidrawAPI={(api) => setExcalidrawAPI(api)}
            onChange={(elements, appState) => {
              handleExcalidrawChange(elements, appState);
            }}
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
                onSelect={() => {
                  if (!roomId) {
                    createRoom();
                  } else {
                    setIsShareModalOpen(true);
                  }
                }}
              />
            </Footer>
            
            <WelcomeScreen>
              <WelcomeScreen.Hints.MenuHint />
              <WelcomeScreen.Hints.ToolbarHint />
              <WelcomeScreen.Hints.HelpHint />
            </WelcomeScreen>
          </Excalidraw>
        </div>
        
        {roomId && (
          <RoomInfo 
            roomId={roomId}
            userCount={userCount}
            onShareClick={() => setIsShareModalOpen(true)}
          />
        )}
        
        {isShareModalOpen && roomId && (
          <ShareRoomModal
            roomId={roomId}
            onClose={() => setIsShareModalOpen(false)}
          />
        )}
        
        {isChatOpen && <ChatWindow onClose={toggleChat} user={user} />}
      </main>
    </div>
  );
}

export default App;