import React, { useState, useEffect, useRef } from 'react';
import { FaProjectDiagram, FaNode, FaPlus, FaMinus } from 'react-icons/fa';
import { newElementWith } from '@excalidraw/excalidraw';
import './MindmapToolbar.css';

const MindmapToolbar = ({ excalidrawAPI, onModeChange, isActive }) => {
  const [selectedNode, setSelectedNode] = useState(null);
  const [nodes, setNodes] = useState([]);
  const [connections, setConnections] = useState([]);
  const nodeIdCounter = useRef(0);

  useEffect(() => {
    if (!isActive || !excalidrawAPI) return;

    const handleCanvasClick = (event) => {
      if (!isActive) return;
      
      // Get click position relative to canvas
      const canvas = document.querySelector('.excalidraw-canvas');
      if (!canvas) return;
      
      const rect = canvas.getBoundingClientRect();
      const appState = excalidrawAPI.getAppState();
      const zoom = appState.zoom || 1;
      const scrollX = appState.scrollX || 0;
      const scrollY = appState.scrollY || 0;
      
      // Convert screen coordinates to scene coordinates
      const sceneX = (event.clientX - rect.left) / zoom + scrollX;
      const sceneY = (event.clientY - rect.top) / zoom + scrollY;
      
      createMindmapNode(sceneX, sceneY);
    };

    const handleKeyDown = (event) => {
      if (!isActive || !selectedNode) return;

      if (event.key === 'Tab') {
        event.preventDefault();
        // Tạo node con
        const parentNode = nodes.find(n => n.id === selectedNode);
        if (parentNode) {
          createChildNode(parentNode);
        }
      } else if (event.key === 'Enter') {
        event.preventDefault();
        // Tạo node anh em
        const currentNode = nodes.find(n => n.id === selectedNode);
        if (currentNode && currentNode.parentId) {
          const parentNode = nodes.find(n => n.id === currentNode.parentId);
          if (parentNode) {
            createSiblingNode(currentNode, parentNode);
          }
        }
      }
    };

    // Listen for canvas clicks
    const canvas = document.querySelector('.excalidraw-canvas');
    if (canvas) {
      canvas.addEventListener('click', handleCanvasClick);
    }

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      if (canvas) {
        canvas.removeEventListener('click', handleCanvasClick);
      }
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isActive, excalidrawAPI, selectedNode, nodes]);

  const createMindmapNode = (x, y) => {
    if (!excalidrawAPI) return;

    const nodeId = `mindmap-${nodeIdCounter.current++}`;
    const newNode = {
      id: nodeId,
      x,
      y,
      text: 'New Node',
      parentId: null,
      children: [],
    };

    try {
      // Use Excalidraw's helper to create rectangle
      const appState = excalidrawAPI.getAppState();
      const rectangle = excalidrawAPI.createElement({
        type: 'rectangle',
        x: x - 75, // Center the rectangle
        y: y - 30,
        width: 150,
        height: 60,
        strokeColor: '#1e88e5',
        backgroundColor: '#e3f2fd',
        fillStyle: 'solid',
        strokeWidth: 2,
        roughness: 1,
        opacity: 100,
        roundness: { type: 3 },
      });

      // Create text element
      const textElement = excalidrawAPI.createElement({
        type: 'text',
        x: x - 65,
        y: y - 10,
        width: 130,
        height: 40,
        text: 'New Node',
        fontSize: 20,
        fontFamily: 1,
        textAlign: 'left',
        verticalAlign: 'middle',
        strokeColor: '#000000',
        backgroundColor: 'transparent',
        fillStyle: 'solid',
        strokeWidth: 1,
        containerId: rectangle.id,
      });

      const currentElements = excalidrawAPI.getSceneElements();
      excalidrawAPI.updateScene({
        elements: [...currentElements, rectangle, textElement],
      });

      setNodes(prev => [...prev, newNode]);
      setSelectedNode(nodeId);
    } catch (error) {
      console.error('Error creating mindmap node:', error);
    }
  };

  const createChildNode = (parentNode) => {
    if (!excalidrawAPI) return;

    const childX = parentNode.x + 200;
    const childY = parentNode.y;
    const childId = `mindmap-${nodeIdCounter.current++}`;

    const newNode = {
      id: childId,
      x: childX,
      y: childY,
      text: 'Child Node',
      parentId: parentNode.id,
      children: [],
    };

    // Tạo rectangle và text cho child node
    const rectangle = {
      type: 'rectangle',
      x: childX,
      y: childY,
      width: 150,
      height: 60,
      strokeColor: '#43a047',
      backgroundColor: '#e8f5e9',
      fillStyle: 'solid',
      strokeWidth: 2,
      roughness: 1,
      opacity: 100,
      groupIds: [],
      frameId: null,
      roundness: { type: 3 },
      seed: Math.floor(Math.random() * 1000000),
      versionNonce: Math.floor(Math.random() * 1000000),
      isDeleted: false,
      boundElements: [],
      updated: Date.now(),
      link: null,
      locked: false,
    };

    const textElement = {
      type: 'text',
      x: childX + 10,
      y: childY + 20,
      width: 130,
      height: 40,
      angle: 0,
      strokeColor: '#000000',
      backgroundColor: 'transparent',
      fillStyle: 'solid',
      strokeWidth: 1,
      strokeStyle: 'solid',
      roughness: 1,
      opacity: 100,
      groupIds: [],
      frameId: null,
      roundness: null,
      seed: Math.floor(Math.random() * 1000000),
      versionNonce: Math.floor(Math.random() * 1000000),
      isDeleted: false,
      boundElements: [],
      updated: Date.now(),
      link: null,
      locked: false,
      text: 'Child Node',
      fontSize: 20,
      fontFamily: 1,
      textAlign: 'left',
      verticalAlign: 'middle',
      baseline: 27,
      containerId: null,
      originalText: 'Child Node',
      lineHeight: 1.25,
    };

    // Tạo đường kết nối
    const line = {
      type: 'arrow',
      x: parentNode.x + 150,
      y: parentNode.y + 30,
      width: 50,
      height: 0,
      angle: 0,
      strokeColor: '#666666',
      backgroundColor: 'transparent',
      fillStyle: 'solid',
      strokeWidth: 2,
      strokeStyle: 'solid',
      roughness: 1,
      opacity: 100,
      groupIds: [],
      frameId: null,
      roundness: null,
      seed: Math.floor(Math.random() * 1000000),
      versionNonce: Math.floor(Math.random() * 1000000),
      isDeleted: false,
      boundElements: [],
      updated: Date.now(),
      link: null,
      locked: false,
      points: [
        [0, 0],
        [50, 0],
      ],
      lastCommittedPoint: null,
      startBinding: null,
      endBinding: null,
      startArrowhead: null,
      endArrowhead: 'arrow',
    };

    const currentElements = excalidrawAPI.getSceneElements();
    const newElements = [
      ...currentElements,
      {
        ...rectangle,
        id: `${childId}-rect`,
      },
      {
        ...textElement,
        id: `${childId}-text`,
        containerId: `${childId}-rect`,
      },
      {
        ...line,
        id: `${parentNode.id}-${childId}-line`,
      },
    ];

    excalidrawAPI.updateScene({ elements: newElements });

    setNodes(prev => [...prev, newNode]);
    setConnections(prev => [...prev, { from: parentNode.id, to: childId }]);
    setSelectedNode(childId);
  };

  const createSiblingNode = (currentNode, parentNode) => {
    if (!excalidrawAPI) return;

    const siblingX = currentNode.x;
    const siblingY = currentNode.y + 100;
    const siblingId = `mindmap-${nodeIdCounter.current++}`;

    const newNode = {
      id: siblingId,
      x: siblingX,
      y: siblingY,
      text: 'Sibling Node',
      parentId: parentNode.id,
      children: [],
    };

    // Tạo rectangle và text cho sibling node
    const rectangle = {
      type: 'rectangle',
      x: siblingX,
      y: siblingY,
      width: 150,
      height: 60,
      strokeColor: '#fb8c00',
      backgroundColor: '#fff3e0',
      fillStyle: 'solid',
      strokeWidth: 2,
      roughness: 1,
      opacity: 100,
      groupIds: [],
      frameId: null,
      roundness: { type: 3 },
      seed: Math.floor(Math.random() * 1000000),
      versionNonce: Math.floor(Math.random() * 1000000),
      isDeleted: false,
      boundElements: [],
      updated: Date.now(),
      link: null,
      locked: false,
    };

    const textElement = {
      type: 'text',
      x: siblingX + 10,
      y: siblingY + 20,
      width: 130,
      height: 40,
      angle: 0,
      strokeColor: '#000000',
      backgroundColor: 'transparent',
      fillStyle: 'solid',
      strokeWidth: 1,
      strokeStyle: 'solid',
      roughness: 1,
      opacity: 100,
      groupIds: [],
      frameId: null,
      roundness: null,
      seed: Math.floor(Math.random() * 1000000),
      versionNonce: Math.floor(Math.random() * 1000000),
      isDeleted: false,
      boundElements: [],
      updated: Date.now(),
      link: null,
      locked: false,
      text: 'Sibling Node',
      fontSize: 20,
      fontFamily: 1,
      textAlign: 'left',
      verticalAlign: 'middle',
      baseline: 27,
      containerId: null,
      originalText: 'Sibling Node',
      lineHeight: 1.25,
    };

    // Tạo đường kết nối từ parent
    const line = {
      type: 'arrow',
      x: parentNode.x + 75,
      y: parentNode.y + 60,
      width: 0,
      height: 40,
      angle: 0,
      strokeColor: '#666666',
      backgroundColor: 'transparent',
      fillStyle: 'solid',
      strokeWidth: 2,
      strokeStyle: 'solid',
      roughness: 1,
      opacity: 100,
      groupIds: [],
      frameId: null,
      roundness: null,
      seed: Math.floor(Math.random() * 1000000),
      versionNonce: Math.floor(Math.random() * 1000000),
      isDeleted: false,
      boundElements: [],
      updated: Date.now(),
      link: null,
      locked: false,
      points: [
        [0, 0],
        [0, 40],
      ],
      lastCommittedPoint: null,
      startBinding: null,
      endBinding: null,
      startArrowhead: null,
      endArrowhead: 'arrow',
    };

    const currentElements = excalidrawAPI.getSceneElements();
    const newElements = [
      ...currentElements,
      {
        ...rectangle,
        id: `${siblingId}-rect`,
      },
      {
        ...textElement,
        id: `${siblingId}-text`,
        containerId: `${siblingId}-rect`,
      },
      {
        ...line,
        id: `${parentNode.id}-${siblingId}-line`,
      },
    ];

    excalidrawAPI.updateScene({ elements: newElements });

    setNodes(prev => [...prev, newNode]);
    setConnections(prev => [...prev, { from: parentNode.id, to: siblingId }]);
    setSelectedNode(siblingId);
  };

  return (
    <div className={`mindmap-toolbar ${isActive ? 'active' : ''}`}>
      <div className="toolbar-header">
        <FaProjectDiagram className="toolbar-icon" />
        <span className="toolbar-title">Mindmap Mode</span>
      </div>
      <div className="toolbar-hint">
        <p>💡 Click vào canvas để tạo node</p>
        <p>⌨️ Tab: Tạo node con | Enter: Tạo node anh em</p>
      </div>
      <div className="toolbar-actions">
        <button
          className="toolbar-btn"
          onClick={() => onModeChange('normal')}
          title="Quay về chế độ vẽ thường"
        >
          <FaMinus /> Thoát Mindmap
        </button>
      </div>
    </div>
  );
};

export default MindmapToolbar;

