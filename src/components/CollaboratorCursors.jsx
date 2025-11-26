import React, { useEffect, useRef, useState } from 'react';
import './CollaboratorCursors.css';

const CollaboratorCursors = ({ collaborators, excalidrawAPI }) => {
  const cursorsRef = useRef({});
  const [cursors, setCursors] = useState({});

  useEffect(() => {
    if (!excalidrawAPI) return;

    const updateCursorPosition = (userId, pointer, user) => {
      if (!pointer || !excalidrawAPI) return;

      setCursors(prev => ({
        ...prev,
        [userId]: {
          pointer: pointer, // Store scene coordinates
          user: user,
          timestamp: Date.now(),
        },
      }));
    };

    // Store update function globally for socket service
    window.updateCollaboratorCursor = updateCursorPosition;

    // Update cursor positions when viewport changes
    const updateCursorPositions = () => {
      const appState = excalidrawAPI.getAppState();
      const zoom = appState.zoom || 1;
      const scrollX = appState.scrollX || 0;
      const scrollY = appState.scrollY || 0;

      setCursors(prev => {
        const updated = {};
        Object.entries(prev).forEach(([userId, cursor]) => {
          if (cursor.pointer) {
            // Convert scene coordinates to screen coordinates
            const canvas = document.querySelector('.excalidraw-canvas');
            if (canvas) {
              const rect = canvas.getBoundingClientRect();
              const screenX = (cursor.pointer.x - scrollX) * zoom + rect.left;
              const screenY = (cursor.pointer.y - scrollY) * zoom + rect.top;
              
              updated[userId] = {
                ...cursor,
                x: screenX,
                y: screenY,
              };
            }
          }
        });
        return updated;
      });
    };

    // Update on scroll/zoom
    const interval = setInterval(updateCursorPositions, 100);

    // Cleanup old cursors
    const cleanupInterval = setInterval(() => {
      setCursors(prev => {
        const updated = {};
        Object.entries(prev).forEach(([userId, cursor]) => {
          if (Date.now() - cursor.timestamp < 2000) {
            updated[userId] = cursor;
          }
        });
        return updated;
      });
    }, 1000);

    return () => {
      delete window.updateCollaboratorCursor;
      clearInterval(interval);
      clearInterval(cleanupInterval);
    };
  }, [excalidrawAPI]);

  // Generate color based on user ID
  const getUserColor = (userId) => {
    const colors = [
      '#1e88e5', '#43a047', '#fb8c00', '#e53935',
      '#8e24aa', '#00acc1', '#f57c00', '#7b1fa2',
      '#00897b', '#d32f2f', '#5e35b1', '#c2185b',
    ];
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      hash = userId.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  // Get user initials
  const getUserInitials = (user) => {
    if (!user || !user.name) return '?';
    const names = user.name.split(' ');
    if (names.length >= 2) {
      return (names[0][0] + names[names.length - 1][0]).toUpperCase();
    }
    return user.name.substring(0, 2).toUpperCase();
  };

  return (
    <div className="collaborator-cursors-container">
      {Object.entries(cursors).map(([userId, cursor]) => {
        if (!cursor.x || !cursor.y) return null;
        
        const color = getUserColor(userId);
        const initials = getUserInitials(cursor.user);

        return (
          <div
            key={userId}
            className="collaborator-cursor"
            style={{
              left: `${cursor.x}px`,
              top: `${cursor.y}px`,
              '--cursor-color': color,
            }}
          >
            <div className="cursor-pointer" style={{ borderColor: color }}>
              <div className="cursor-avatar" style={{ backgroundColor: color }}>
                {cursor.user?.picture ? (
                  <img src={cursor.user.picture} alt={cursor.user.name} />
                ) : (
                  <span>{initials}</span>
                )}
              </div>
            </div>
            <div className="cursor-label" style={{ backgroundColor: color }}>
              {cursor.user?.name || 'Unknown'}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default CollaboratorCursors;

