import { useRef, useState } from 'react';
import { WorkflowConnection, WorkflowNode } from '../../types';
import { useStore } from '../../store/useStore';
import { cn } from '../../lib/utils';

interface ConnectionLineProps {
  connection: WorkflowConnection;
  nodes: WorkflowNode[];
  onDelete?: (connectionId: string) => void;
}

export function ConnectionLine({ connection, nodes, onDelete }: ConnectionLineProps) {
  const pathRef = useRef<SVGPathElement>(null);
  
  const isActive = useStore(state => 
    state.workflowExecution.executedNodeIds.includes(connection.fromNodeId) &&
    state.workflowExecution.executedNodeIds.includes(connection.toNodeId)
  );
  
  const isError = useStore(state => {
    const fromNodeState = state.currentWorkflow?.nodes.find(n => n.id === connection.fromNodeId);
    const toNodeState = state.currentWorkflow?.nodes.find(n => n.id === connection.toNodeId);
    return fromNodeState?.status === 'error' || toNodeState?.status === 'error';
  });
  
  const fromNode = nodes.find(n => n.id === connection.fromNodeId);
  const toNode = nodes.find(n => n.id === connection.toNodeId);
  
  const fromPort = fromNode?.outputs.find(p => p.id === connection.fromPortId);
  const toPort = toNode?.inputs.find(p => p.id === connection.toPortId);
  
  if (!fromNode || !toNode || !fromPort || !toPort) return null;
  
  const fromPortIndex = fromNode.outputs.findIndex(p => p.id === connection.fromPortId);
  const toPortIndex = toNode.inputs.findIndex(p => p.id === connection.toPortId);
  
  const fromPortY = fromNode.outputs.length > 1 
    ? 60 + fromPortIndex * 22 
    : 70;
  const toPortY = toNode.inputs.length > 1 
    ? 60 + toPortIndex * 22 
    : 70;
  
  const startX = fromNode.x + fromNode.width;
  const startY = fromNode.y + fromPortY;
  const endX = toNode.x;
  const endY = toNode.y + toPortY;
  
  const dx = endX - startX;
  const controlOffset = Math.min(Math.abs(dx) / 2, 100);
  
  const pathD = `M ${startX} ${startY} C ${startX + controlOffset} ${startY}, ${endX - controlOffset} ${endY}, ${endX} ${endY}`;
  
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete(connection.id);
    }
  };
  
  return (
    <g>
      <path
        d={pathD}
        fill="none"
        stroke="transparent"
        strokeWidth={15}
        className="cursor-pointer"
        onClick={handleClick}
      />
      
      <path
        ref={pathRef}
        d={pathD}
        fill="none"
        className={cn(
          'transition-all duration-300',
          isError ? 'stroke-red-500' : isActive ? 'stroke-green-400' : 'stroke-slate-500'
        )}
        strokeWidth={2}
        strokeDasharray={isActive ? 'none' : '5,5'}
        style={{
          filter: isActive ? 'drop-shadow(0 0 6px rgba(74, 222, 128, 0.5))' : 'none',
        }}
      />
      
      <circle
        cx={startX}
        cy={startY}
        r={4}
        className={cn(
          'transition-all duration-300',
          isError ? 'fill-red-500' : isActive ? 'fill-green-400' : 'fill-slate-500'
        )}
      />
      
      <circle
        cx={endX}
        cy={endY}
        r={4}
        className={cn(
          'transition-all duration-300',
          isError ? 'fill-red-500' : isActive ? 'fill-green-400' : 'fill-slate-500'
        )}
      />
      
      <defs>
        <marker
          id={`arrow-${connection.id}`}
          markerWidth="10"
          markerHeight="10"
          refX="9"
          refY="3"
          orient="auto"
        >
          <path
            d="M0,0 L0,6 L9,3 z"
            className={isError ? 'fill-red-500' : isActive ? 'fill-green-400' : 'fill-slate-500'}
          />
        </marker>
      </defs>
      
      <path
        d={pathD}
        fill="none"
        className="pointer-events-none"
        strokeWidth={2}
        markerEnd={`url(#arrow-${connection.id})`}
        stroke="transparent"
      />
    </g>
  );
}

interface TempConnectionLineProps {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  isValid?: boolean;
}

export function TempConnectionLine({ startX, startY, endX, endY, isValid = true }: TempConnectionLineProps) {
  const dx = endX - startX;
  const controlOffset = Math.min(Math.abs(dx) / 2, 100);
  
  const pathD = `M ${startX} ${startY} C ${startX + controlOffset} ${startY}, ${endX - controlOffset} ${endY}, ${endX} ${endY}`;
  
  return (
    <g>
      <path
        d={pathD}
        fill="none"
        stroke={isValid ? '#3b82f6' : '#ef4444'}
        strokeWidth={2}
        strokeDasharray="5,5"
        className="pointer-events-none"
        style={{
          filter: isValid ? 'drop-shadow(0 0 6px rgba(59, 130, 246, 0.5))' : 'drop-shadow(0 0 6px rgba(239, 68, 68, 0.5))',
        }}
      />
      
      <circle
        cx={startX}
        cy={startY}
        r={4}
        fill={isValid ? '#3b82f6' : '#ef4444'}
        className="pointer-events-none"
      />
      
      <circle
        cx={endX}
        cy={endY}
        r={4}
        fill={isValid ? '#3b82f6' : '#ef4444'}
        className="pointer-events-none"
      />
    </g>
  );
}
