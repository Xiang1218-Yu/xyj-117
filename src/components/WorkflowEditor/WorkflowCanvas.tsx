import { useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { WorkflowNodeType } from '../../types';
import { useStore } from '../../store/useStore';
import { cn } from '../../lib/utils';
import WorkflowNodeComponent from './WorkflowNode';
import { ConnectionLine, TempConnectionLine } from './ConnectionLines';

interface WorkflowCanvasProps {
  className?: string;
}

export default function WorkflowCanvas({ className }: WorkflowCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  
  const currentWorkflow = useStore(state => state.currentWorkflow);
  const selectedNodeId = useStore(state => state.selectedNodeId);
  const dragState = useStore(state => state.dragState);
  const connectionDragState = useStore(state => state.connectionDragState);
  const zoomLevel = useStore(state => state.zoomLevel);
  const panOffset = useStore(state => state.panOffset);
  const workflowExecution = useStore(state => state.workflowExecution);
  
  const addNode = useStore(state => state.addNode);
  const selectNode = useStore(state => state.selectNode);
  const updateNodePosition = useStore(state => state.updateNodePosition);
  const setDragState = useStore(state => state.setDragState);
  const setConnectionDragState = useStore(state => state.setConnectionDragState);
  const setZoomLevel = useStore(state => state.setZoomLevel);
  const setPanOffset = useStore(state => state.setPanOffset);
  const removeConnection = useStore(state => state.removeConnection);
  
  const screenToCanvas = useCallback((screenX: number, screenY: number) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    
    return {
      x: (screenX - rect.left - panOffset.x) / zoomLevel,
      y: (screenY - rect.top - panOffset.y) / zoomLevel,
    };
  }, [panOffset, zoomLevel]);
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    
    const nodeType = e.dataTransfer.getData('nodeType') as WorkflowNodeType;
    if (!nodeType) return;
    
    const { x, y } = screenToCanvas(e.clientX, e.clientY);
    addNode(nodeType, x - 100, y - 60);
    
    setDragState({
      isDragging: false,
      nodeType: null,
      nodeId: null,
      startX: 0,
      startY: 0,
      offsetX: 0,
      offsetY: 0,
    });
  };
  
  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0 && !e.defaultPrevented) {
      selectNode(null);
    }
    
    if (e.button === 1 || (e.button === 0 && e.altKey)) {
      e.preventDefault();
      setDragState({
        isDragging: true,
        nodeType: null,
        nodeId: null,
        startX: e.clientX,
        startY: e.clientY,
        offsetX: panOffset.x,
        offsetY: panOffset.y,
      });
    }
  };
  
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (dragState.isDragging && dragState.nodeId) {
      const { x, y } = screenToCanvas(e.clientX, e.clientY);
      updateNodePosition(
        dragState.nodeId,
        x - dragState.offsetX / zoomLevel,
        y - dragState.offsetY / zoomLevel
      );
    } else if (dragState.isDragging && !dragState.nodeId && !dragState.nodeType) {
      const dx = e.clientX - dragState.startX;
      const dy = e.clientY - dragState.startY;
      setPanOffset(
        dragState.offsetX + dx,
        dragState.offsetY + dy
      );
    }
    
    if (connectionDragState.isDragging) {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        setConnectionDragState({
          currentX: (e.clientX - rect.left - panOffset.x) / zoomLevel,
          currentY: (e.clientY - rect.top - panOffset.y) / zoomLevel,
        });
      }
    }
  }, [dragState, connectionDragState.isDragging, screenToCanvas, zoomLevel, panOffset, updateNodePosition, setPanOffset, setConnectionDragState]);
  
  const handleMouseUp = useCallback(() => {
    if (dragState.isDragging) {
      setDragState({
        isDragging: false,
        nodeType: null,
        nodeId: null,
        startX: 0,
        startY: 0,
        offsetX: 0,
        offsetY: 0,
      });
    }
    
    if (connectionDragState.isDragging) {
      setConnectionDragState({
        isDragging: false,
        fromNodeId: null,
        fromPortId: null,
        fromPortType: null,
        currentX: 0,
        currentY: 0,
      });
    }
  }, [dragState.isDragging, connectionDragState.isDragging, setDragState, setConnectionDragState]);
  
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    const newZoom = Math.max(0.25, Math.min(2, zoomLevel + delta));
    
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      
      const scaleRatio = newZoom / zoomLevel;
      const newOffsetX = mouseX - (mouseX - panOffset.x) * scaleRatio;
      const newOffsetY = mouseY - (mouseY - panOffset.y) * scaleRatio;
      
      setPanOffset(newOffsetX, newOffsetY);
    }
    
    setZoomLevel(newZoom);
  };
  
  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);
  
  const getConnectionStartPoint = () => {
    if (!connectionDragState.isDragging || !connectionDragState.fromNodeId || !connectionDragState.fromPortId) {
      return null;
    }
    
    const node = currentWorkflow?.nodes.find(n => n.id === connectionDragState.fromNodeId);
    if (!node) return null;
    
    if (connectionDragState.fromPortType === 'output') {
      const portIndex = node.outputs.findIndex(p => p.id === connectionDragState.fromPortId);
      const portY = node.outputs.length > 1 ? 60 + portIndex * 22 : 70;
      return {
        x: node.x + node.width,
        y: node.y + portY,
      };
    } else {
      const portIndex = node.inputs.findIndex(p => p.id === connectionDragState.fromPortId);
      const portY = node.inputs.length > 1 ? 60 + portIndex * 22 : 70;
      return {
        x: node.x,
        y: node.y + portY,
      };
    }
  };
  
  const handleConnectionDelete = (connectionId: string) => {
    removeConnection(connectionId);
  };
  
  const renderGrid = () => {
    const gridSize = 50;
    const width = 5000;
    const height = 3000;
    
    const lines = [];
    
    for (let x = 0; x <= width; x += gridSize) {
      lines.push(
        <line
          key={`v-${x}`}
          x1={x}
          y1={0}
          x2={x}
          y2={height}
          stroke="#334155"
          strokeWidth={0.5}
          strokeDasharray={x % 200 === 0 ? 'none' : '2,4'}
        />
      );
    }
    
    for (let y = 0; y <= height; y += gridSize) {
      lines.push(
        <line
          key={`h-${y}`}
          x1={0}
          y1={y}
          x2={width}
          y2={y}
          stroke="#334155"
          strokeWidth={0.5}
          strokeDasharray={y % 200 === 0 ? 'none' : '2,4'}
        />
      );
    }
    
    return lines;
  };
  
  const renderEmptyState = () => {
    if (currentWorkflow && currentWorkflow.nodes.length > 0) return null;
    
    return (
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="text-center">
          <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-slate-800/50 flex items-center justify-center">
            <svg className="w-12 h-12 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-slate-400 mb-2">开始构建工作流</h3>
          <p className="text-slate-500 max-w-md">
            从左侧节点库拖拽节点到画布，连接它们以创建自动化分析流程
          </p>
        </div>
      </div>
    );
  };
  
  const connectionStartPoint = getConnectionStartPoint();
  
  return (
    <div
      ref={canvasRef}
      className={cn(
        'relative flex-1 bg-slate-950 overflow-hidden',
        className
      )}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onMouseDown={handleCanvasMouseDown}
      onWheel={handleWheel}
    >
      <div
        className="absolute inset-0 origin-top-left"
        style={{
          transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel})`,
          width: '5000px',
          height: '3000px',
        }}
      >
        <svg
          ref={svgRef}
          className="absolute inset-0 w-full h-full pointer-events-none"
          style={{ zIndex: 1 }}
        >
          {renderGrid()}
          
          {currentWorkflow?.connections.map(conn => (
            <ConnectionLine
              key={conn.id}
              connection={conn}
              nodes={currentWorkflow.nodes}
              onDelete={handleConnectionDelete}
            />
          ))}
          
          {connectionDragState.isDragging && connectionStartPoint && (
            <TempConnectionLine
              startX={connectionStartPoint.x}
              startY={connectionStartPoint.y}
              endX={connectionDragState.currentX}
              endY={connectionDragState.currentY}
              isValid={true}
            />
          )}
        </svg>
        
        <div className="absolute inset-0" style={{ zIndex: 2 }}>
          {currentWorkflow?.nodes.map(node => (
            <WorkflowNodeComponent
              key={node.id}
              node={node}
              isSelected={selectedNodeId === node.id}
            />
          ))}
        </div>
        
        {renderEmptyState()}
      </div>
      
      <div className="absolute bottom-4 right-4 flex items-center gap-2 bg-slate-800/90 backdrop-blur-sm rounded-lg px-3 py-2 border border-slate-700">
        <button
          onClick={() => setZoomLevel(zoomLevel - 0.1)}
          className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-colors"
          disabled={zoomLevel <= 0.25}
        >
          −
        </button>
        <span className="text-sm text-slate-300 w-16 text-center">
          {Math.round(zoomLevel * 100)}%
        </span>
        <button
          onClick={() => setZoomLevel(zoomLevel + 0.1)}
          className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-colors"
          disabled={zoomLevel >= 2}
        >
          +
        </button>
        <div className="w-px h-6 bg-slate-600 mx-2" />
        <button
          onClick={() => {
            setZoomLevel(1);
            setPanOffset(0, 0);
          }}
          className="text-xs text-slate-400 hover:text-white transition-colors"
        >
          重置视图
        </button>
      </div>
      
      {workflowExecution.error && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-red-900/90 border border-red-700 text-red-200 px-4 py-3 rounded-lg shadow-lg"
          >
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{workflowExecution.error}</span>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
