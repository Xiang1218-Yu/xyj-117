import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  FlaskConical, Library, Atom, Activity, Pill, Calculator,
  BarChart3, Dna, GitMerge, Zap, Filter, Combine, Download, Eye,
  X, CheckCircle, AlertCircle, Loader2,
  Settings
} from 'lucide-react';
import { WorkflowNode, WorkflowPort, WorkflowNodeStatus } from '../../types';
import { getNodeDefinition, categoryColors } from '../../data/workflowNodes';
import { useStore } from '../../store/useStore';
import { cn } from '../../lib/utils';

const iconMap: Record<string, React.FC<{ className?: string }>> = {
  FlaskConical, Library, Atom, Activity, Pill, Calculator,
  BarChart3, Dna, GitMerge, Zap, Filter, Combine, Download, Eye,
};

interface WorkflowNodeComponentProps {
  node: WorkflowNode;
  isSelected: boolean;
}

export default function WorkflowNodeComponent({ node, isSelected }: WorkflowNodeComponentProps) {
  const nodeRef = useRef<HTMLDivElement>(null);
  const [showConfig, setShowConfig] = useState(false);
  
  const def = getNodeDefinition(node.type);
  const IconComponent = iconMap[def.icon] || Atom;
  
  const selectNode = useStore(state => state.selectNode);
  const removeNode = useStore(state => state.removeNode);
  const updateNodeConfig = useStore(state => state.updateNodeConfig);
  const setDragState = useStore(state => state.setDragState);
  const setConnectionDragState = useStore(state => state.setConnectionDragState);
  const dragState = useStore(state => state.dragState);
  
  const statusColors: Record<WorkflowNodeStatus, string> = {
    idle: 'border-slate-600',
    running: 'border-yellow-500 shadow-yellow-500/30',
    completed: 'border-green-500 shadow-green-500/30',
    error: 'border-red-500 shadow-red-500/30',
    skipped: 'border-slate-500 opacity-50',
  };
  
  const statusIcons: Record<WorkflowNodeStatus, React.ReactNode> = {
    idle: null,
    running: <Loader2 className="w-4 h-4 text-yellow-400 animate-spin" />,
    completed: <CheckCircle className="w-4 h-4 text-green-400" />,
    error: <AlertCircle className="w-4 h-4 text-red-400" />,
    skipped: null,
  };
  
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    
    e.stopPropagation();
    selectNode(node.id);
    
    const rect = nodeRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    setDragState({
      isDragging: true,
      nodeType: null,
      nodeId: node.id,
      startX: e.clientX,
      startY: e.clientY,
      offsetX: e.clientX - rect.left,
      offsetY: e.clientY - rect.top,
    });
  };
  
  const handlePortMouseDown = (e: React.MouseEvent, port: WorkflowPort, portType: 'input' | 'output') => {
    e.stopPropagation();
    e.preventDefault();
    
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    
    setConnectionDragState({
      isDragging: true,
      fromNodeId: node.id,
      fromPortId: port.id,
      fromPortType: portType,
      currentX: x,
      currentY: y,
    });
  };
  
  const handlePortMouseUp = (e: React.MouseEvent, port: WorkflowPort, portType: 'input' | 'output') => {
    e.stopPropagation();
    
    const connDragState = useStore.getState().connectionDragState;
    if (!connDragState.isDragging) return;
    if (connDragState.fromNodeId === node.id) return;
    
    if (connDragState.fromPortType === 'output' && portType === 'input') {
      useStore.getState().addConnection(
        connDragState.fromNodeId,
        connDragState.fromPortId,
        node.id,
        port.id
      );
    } else if (connDragState.fromPortType === 'input' && portType === 'output') {
      useStore.getState().addConnection(
        node.id,
        port.id,
        connDragState.fromNodeId,
        connDragState.fromPortId
      );
    }
    
    setConnectionDragState({
      isDragging: false,
      fromNodeId: null,
      fromPortId: null,
      fromPortType: null,
      currentX: 0,
      currentY: 0,
    });
  };
  
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    removeNode(node.id);
  };
  
  const handleConfigChange = (key: string, value: any) => {
    updateNodeConfig(node.id, { [key]: value });
  };
  
  const renderConfigPanel = () => {
    if (!showConfig) return null;
    
    return (
      <div className="absolute top-full left-0 mt-2 w-72 bg-slate-800 border border-slate-600 rounded-lg shadow-xl z-50 p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-semibold text-white">节点配置</h4>
          <button
            onClick={() => setShowConfig(false)}
            className="text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-slate-400 mb-1">节点名称</label>
            <input
              type="text"
              value={node.name}
              onChange={(e) => handleConfigChange('name', e.target.value)}
              className="w-full px-2 py-1 bg-slate-700 border border-slate-600 rounded text-sm text-white focus:outline-none focus:border-blue-500"
            />
          </div>
          
          {Object.entries(node.config).map(([key, value]) => {
            if (key === 'name') return null;
            
            return (
              <div key={key}>
                <label className="block text-xs text-slate-400 mb-1 capitalize">
                  {key.replace(/([A-Z])/g, ' $1').trim()}
                </label>
                {typeof value === 'boolean' ? (
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={value}
                      onChange={(e) => handleConfigChange(key, e.target.checked)}
                      className="rounded bg-slate-700 border-slate-600 text-blue-500 focus:ring-blue-500"
                    />
                    <span className="text-sm text-slate-300">{value ? '启用' : '禁用'}</span>
                  </label>
                ) : typeof value === 'number' ? (
                  <input
                    type="number"
                    value={value}
                    onChange={(e) => handleConfigChange(key, parseFloat(e.target.value))}
                    className="w-full px-2 py-1 bg-slate-700 border border-slate-600 rounded text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                ) : Array.isArray(value) ? (
                  <div className="flex flex-wrap gap-1">
                    {value.map((item: any, idx: number) => (
                      <span key={idx} className="px-2 py-0.5 bg-slate-700 rounded text-xs text-slate-300">
                        {String(item)}
                      </span>
                    ))}
                  </div>
                ) : typeof value === 'object' && value !== null ? (
                  <pre className="text-xs text-slate-400 bg-slate-700 p-2 rounded overflow-x-auto">
                    {JSON.stringify(value, null, 2)}
                  </pre>
                ) : (
                  <input
                    type="text"
                    value={String(value)}
                    onChange={(e) => handleConfigChange(key, e.target.value)}
                    className="w-full px-2 py-1 bg-slate-700 border border-slate-600 rounded text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                )}
              </div>
            );
          })}
        </div>
        
        {node.result && (
          <div className="mt-4 pt-3 border-t border-slate-600">
            <h5 className="text-xs font-semibold text-slate-400 mb-2">执行结果</h5>
            <pre className="text-xs text-slate-300 bg-slate-900 p-2 rounded max-h-32 overflow-y-auto">
              {JSON.stringify(node.result, null, 2).slice(0, 500)}
              {JSON.stringify(node.result).length > 500 ? '...' : ''}
            </pre>
          </div>
        )}
        
        {node.error && (
          <div className="mt-4 p-2 bg-red-900/30 border border-red-700 rounded">
            <p className="text-xs text-red-400">{node.error}</p>
          </div>
        )}
      </div>
    );
  };
  
  return (
    <div
      ref={nodeRef}
      className={cn(
        'absolute bg-slate-800/95 backdrop-blur-sm rounded-lg shadow-lg border-2 transition-all duration-200',
        statusColors[node.status],
        isSelected && 'ring-2 ring-blue-500 ring-offset-2 ring-offset-slate-900',
        node.status === 'running' && 'animate-pulse',
        dragState.isDragging && dragState.nodeId === node.id && 'opacity-80 scale-105 z-50'
      )}
      style={{
        left: node.x,
        top: node.y,
        width: node.width,
        minHeight: node.height,
        cursor: 'move',
      }}
      onMouseDown={handleMouseDown}
    >
      <div className={cn(
        'px-3 py-2 rounded-t-md bg-gradient-to-r flex items-center gap-2',
        categoryColors[def.category]
      )}>
        <IconComponent className="w-4 h-4 text-white" />
        <span className="text-sm font-medium text-white flex-1 truncate">
          {node.name}
        </span>
        {statusIcons[node.status]}
        <button
          onClick={() => setShowConfig(!showConfig)}
          className="text-white/70 hover:text-white transition-colors"
        >
          <Settings className="w-4 h-4" />
        </button>
        <button
          onClick={handleDelete}
          className="text-white/70 hover:text-red-400 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      
      <div className="p-3 relative">
        <p className="text-xs text-slate-400 mb-3 line-clamp-2">
          {node.description}
        </p>
        
        <div className="space-y-2">
          {node.inputs.length > 0 && (
            <div className="space-y-1">
              <div className="text-xs text-slate-500 uppercase tracking-wider">输入</div>
              {node.inputs.map(port => (
                <div
                  key={port.id}
                  className="flex items-center gap-2 group"
                  onMouseUp={(e) => handlePortMouseUp(e, port, 'input')}
                >
                  <div
                    className={cn(
                      'w-3 h-3 rounded-full border-2 cursor-crosshair transition-all',
                      'bg-slate-700 border-slate-500 group-hover:border-blue-400 group-hover:bg-blue-500'
                    )}
                    onMouseDown={(e) => handlePortMouseDown(e, port, 'input')}
                    title={port.name}
                  />
                  <span className="text-xs text-slate-300 flex-1">
                    {port.name}
                    {port.required && <span className="text-red-400"> *</span>}
                  </span>
                  <span className="text-xs text-slate-500">{port.dataType}</span>
                </div>
              ))}
            </div>
          )}
          
          {node.outputs.length > 0 && (
            <div className="space-y-1">
              <div className="text-xs text-slate-500 uppercase tracking-wider">输出</div>
              {node.outputs.map(port => (
                <div
                  key={port.id}
                  className="flex items-center gap-2 group"
                  onMouseUp={(e) => handlePortMouseUp(e, port, 'output')}
                >
                  <div
                    className={cn(
                      'w-3 h-3 rounded-full border-2 cursor-crosshair transition-all',
                      'bg-green-700 border-green-500 group-hover:border-green-400 group-hover:bg-green-400'
                    )}
                    onMouseDown={(e) => handlePortMouseDown(e, port, 'output')}
                    title={port.name}
                  />
                  <span className="text-xs text-slate-300 flex-1">
                    {port.name}
                  </span>
                  <span className="text-xs text-slate-500">{port.dataType}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {node.progress !== undefined && node.progress > 0 && node.progress < 100 && (
          <div className="mt-3">
            <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-yellow-500 to-orange-500"
                initial={{ width: 0 }}
                animate={{ width: `${node.progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
            <div className="text-xs text-slate-400 mt-1 text-right">
              {Math.round(node.progress)}%
            </div>
          </div>
        )}
        
        {renderConfigPanel()}
      </div>
    </div>
  );
}
