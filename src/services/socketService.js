import { io } from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.currentRoomId = null;
  }

  connect(url = 'http://localhost:5000') {
    if (this.socket?.connected) {
      return this.socket;
    }

    this.socket = io(url, {
      withCredentials: true,
      transports: ['websocket', 'polling']
    });

    this.socket.on('connect', () => {
      console.log('Socket connected:', this.socket.id);
    });

    this.socket.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.currentRoomId = null;
    }
  }

  joinRoom(roomId, user) {
    if (!this.socket) {
      throw new Error('Socket not connected');
    }

    this.currentRoomId = roomId;
    this.socket.emit('join-room', { roomId, user });
  }

  leaveRoom() {
    if (this.socket && this.currentRoomId) {
      this.socket.emit('leave-room', { roomId: this.currentRoomId });
      this.currentRoomId = null;
    }
  }

  sendDrawingUpdate(elements, appState) {
    if (!this.socket || !this.currentRoomId) {
      return;
    }

    this.socket.emit('drawing-update', {
      roomId: this.currentRoomId,
      elements,
      appState
    });
  }

  sendPointerUpdate(pointer, user) {
    if (!this.socket || !this.currentRoomId) {
      return;
    }

    this.socket.emit('pointer-update', {
      roomId: this.currentRoomId,
      pointer,
      user
    });
  }

  onRoomState(callback) {
    if (this.socket) {
      this.socket.off('room-state'); // Remove old listeners first
      this.socket.on('room-state', callback);
    }
  }

  onDrawingUpdate(callback) {
    if (this.socket) {
      this.socket.off('drawing-update'); // Remove old listeners first
      this.socket.on('drawing-update', callback);
    }
  }

  onPointerUpdate(callback) {
    if (this.socket) {
      this.socket.off('pointer-update'); // Remove old listeners first
      this.socket.on('pointer-update', callback);
    }
  }

  onUserJoined(callback) {
    if (this.socket) {
      this.socket.off('user-joined'); // Remove old listeners first
      this.socket.on('user-joined', callback);
    }
  }

  onUserLeft(callback) {
    if (this.socket) {
      this.socket.off('user-left'); // Remove old listeners first
      this.socket.on('user-left', callback);
    }
  }

  onUserCount(callback) {
    if (this.socket) {
      this.socket.off('user-count'); // Remove old listeners first
      this.socket.on('user-count', callback);
    }
  }

  removeAllListeners() {
    if (this.socket) {
      this.socket.removeAllListeners();
    }
  }
}

export default new SocketService();

