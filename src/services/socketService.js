import { io } from "socket.io-client";

class SocketService {
  constructor() {
    this.socket = null;
    this.currentRoomId = null;
    this.messageQueue = [];
    this.isProcessingQueue = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.eventHandlers = new Map();
  }

  connect(url = "https://collabboardptitbe-production.up.railway.app") {
    if (this.socket?.connected) {
      return this.socket;
    }

    this.socket = io(url, {
      withCredentials: true,
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: this.maxReconnectAttempts
    });

    this.socket.on("connect", () => {
      console.log("Socket connected:", this.socket.id);
      this.reconnectAttempts = 0;
      
      // Rejoin room if we were in one
      if (this.currentRoomId) {
        console.log("Rejoining room:", this.currentRoomId);
        this.socket.emit("join-room", { 
          roomId: this.currentRoomId,
          user: this.currentUser 
        });
      }
      
      // Process queued messages
      this.processMessageQueue();
    });

    this.socket.on("disconnect", (reason) => {
      console.log("Socket disconnected:", reason);
      if (reason === "io server disconnect") {
        // Server disconnected, try to reconnect manually
        this.socket.connect();
      }
    });

    this.socket.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
      this.reconnectAttempts++;
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error("Max reconnection attempts reached");
      }
    });

    this.socket.on("reconnect", (attemptNumber) => {
      console.log("Socket reconnected after", attemptNumber, "attempts");
    });

    this.socket.on("reconnect_error", (error) => {
      console.error("Socket reconnection error:", error);
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      // Leave current room before disconnecting
      if (this.currentRoomId) {
        this.leaveRoom();
      }
      
      this.socket.disconnect();
      this.socket = null;
      this.currentRoomId = null;
      this.currentUser = null;
      this.messageQueue = [];
      this.eventHandlers.clear();
    }
  }

  processMessageQueue() {
    if (this.isProcessingQueue || this.messageQueue.length === 0) {
      return;
    }
    
    this.isProcessingQueue = true;
    
    while (this.messageQueue.length > 0 && this.socket?.connected) {
      const message = this.messageQueue.shift();
      this.socket.emit(message.event, message.data);
    }
    
    this.isProcessingQueue = false;
  }

  queueMessage(event, data) {
    this.messageQueue.push({ event, data });
    if (this.socket?.connected) {
      this.processMessageQueue();
    }
  }

  joinRoom(roomId, user) {
    if (!this.socket) {
      throw new Error("Socket not connected");
    }

    // Leave previous room if exists
    if (this.currentRoomId && this.currentRoomId !== roomId) {
      this.leaveRoom();
    }

    this.currentRoomId = roomId;
    this.currentUser = user;
    
    if (this.socket.connected) {
      this.socket.emit("join-room", { roomId, user });
    } else {
      this.queueMessage("join-room", { roomId, user });
    }
  }

  leaveRoom() {
    if (this.socket && this.currentRoomId) {
      if (this.socket.connected) {
        this.socket.emit("leave-room", { roomId: this.currentRoomId });
      }
      this.currentRoomId = null;
      this.currentUser = null;
    }
  }

  sendDrawingUpdate(elements, appState) {
    if (!this.currentRoomId) {
      return;
    }

    const data = {
      roomId: this.currentRoomId,
      elements,
      appState,
      timestamp: Date.now() // Add timestamp for conflict resolution
    };

    if (this.socket?.connected) {
      this.socket.emit("drawing-update", data);
    } else {
      // Queue the message if not connected
      this.queueMessage("drawing-update", data);
    }
  }

  sendPointerUpdate(pointer, user) {
    if (!this.socket || !this.currentRoomId || !pointer) {
      return;
    }

    // Throttle pointer updates to reduce network traffic
    if (this.lastPointerSendTime && Date.now() - this.lastPointerSendTime < 50) {
      return;
    }
    this.lastPointerSendTime = Date.now();

    this.socket.emit("pointer-update", {
      roomId: this.currentRoomId,
      pointer: {
        x: pointer.x,
        y: pointer.y,
      },
      user,
    });
  }

  onRoomState(callback) {
    if (this.socket) {
      this.socket.off("room-state"); // Remove old listeners first
      const wrappedCallback = (data) => {
        // Add debouncing to prevent duplicate state updates
        if (this.lastRoomStateTime && Date.now() - this.lastRoomStateTime < 100) {
          return;
        }
        this.lastRoomStateTime = Date.now();
        callback(data);
      };
      this.socket.on("room-state", wrappedCallback);
      this.eventHandlers.set("room-state", wrappedCallback);
    }
  }

  onDrawingUpdate(callback) {
    if (this.socket) {
      this.socket.off("drawing-update"); // Remove old listeners first
      let lastUpdateTimestamp = 0;
      
      const wrappedCallback = (data) => {
        // Only process if this update is newer
        if (data.timestamp && data.timestamp <= lastUpdateTimestamp) {
          console.log("Skipping outdated drawing update");
          return;
        }
        lastUpdateTimestamp = data.timestamp || Date.now();
        callback(data);
      };
      
      this.socket.on("drawing-update", wrappedCallback);
      this.eventHandlers.set("drawing-update", wrappedCallback);
    }
  }

  onPointerUpdate(callback) {
    if (this.socket) {
      this.socket.off("pointer-update"); // Remove old listeners first
      const wrappedCallback = (data) => {
        // Throttle pointer updates to avoid too many events
        if (this.lastPointerUpdateTime && Date.now() - this.lastPointerUpdateTime < 50) {
          return;
        }
        this.lastPointerUpdateTime = Date.now();
        callback(data);
      };
      this.socket.on("pointer-update", wrappedCallback);
      this.eventHandlers.set("pointer-update", wrappedCallback);
    }
  }

  onUserJoined(callback) {
    if (this.socket) {
      this.socket.off("user-joined"); // Remove old listeners first
      const wrappedCallback = callback;
      this.socket.on("user-joined", wrappedCallback);
      this.eventHandlers.set("user-joined", wrappedCallback);
    }
  }

  onUserLeft(callback) {
    if (this.socket) {
      this.socket.off("user-left"); // Remove old listeners first
      const wrappedCallback = callback;
      this.socket.on("user-left", wrappedCallback);
      this.eventHandlers.set("user-left", wrappedCallback);
    }
  }

  onUserCount(callback) {
    if (this.socket) {
      this.socket.off("user-count"); // Remove old listeners first
      const wrappedCallback = callback;
      this.socket.on("user-count", wrappedCallback);
      this.eventHandlers.set("user-count", wrappedCallback);
    }
  }

  removeAllListeners() {
    if (this.socket) {
      // Remove specific tracked listeners
      for (const [event] of this.eventHandlers) {
        this.socket.off(event);
      }
      this.eventHandlers.clear();
    }
  }

  // Thêm vào class SocketService:

  sendChatMessage(message, user) {
    if (!this.socket || !this.currentRoomId) {
      return;
    }

    this.socket.emit("chat-message", {
      roomId: this.currentRoomId,
      message,
      user,
    });
  }

  sendTypingStatus(user, isTyping) {
    if (!this.socket || !this.currentRoomId) {
      return;
    }

    this.socket.emit("typing", {
      roomId: this.currentRoomId,
      user,
      isTyping,
    });
  }

  onChatMessage(callback) {
    if (this.socket) {
      this.socket.off("chat-message");
      this.socket.on("chat-message", callback);
    }
  }

  onUserTyping(callback) {
    if (this.socket) {
      this.socket.off("user-typing");
      this.socket.on("user-typing", callback);
    }
  }
}

export default new SocketService();
