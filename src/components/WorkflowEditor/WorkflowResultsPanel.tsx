import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronDown, 
  ChevronRight, 
  CheckCircle, 
  AlertCircle, 
  Clock,
  Play,
  FileJson,
  FlaskConical,
  BarChart3,
  Activity
} from 'lucide-react';
import { useStore } from '../../store/useStore';
import { cn } from '../../lib/utils';

export default function WorkflowResultsPanel() {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [isPanelOpen, setIsPanelOpen] = useState(true);
  
  const currentWorkflow = useStore(state => state.currentWorkflow);
  const workflowExecution = useStore(state => state.workflowExecution);
  const selectedNodeId = useStore(state => state.selectedNodeId);
  const selectNode = useStore(state => state.selectNode);
  
  if (!currentWorkflow || currentWorkflow.nodes.length === 0) return null;
  
  const toggleNodeExpanded = (nodeId: string) => {
    setExpandedNodes(prev => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  };
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'running':
        return <Play className="w-4 h-4 text-yellow-400 animate-pulse" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-400" />;
      default:
        return <Clock className="w-4 h-4 text-slate-500" />;
    }
  };
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-400';
      case 'running': return 'text-yellow-400';
      case 'error': return 'text-red-400';
      default: return 'text-slate-500';
    }
  };
  
  const getResultIcon = (node: any) => {
    const dataType = node.outputs?.[0]?.dataType;
    switch (dataType) {
      case 'molecule':
      case 'molecule_list':
        return <FlaskConical className="w-4 h-4" />;
      case 'descriptors':
      case 'admet':
      case 'drug_likeness':
        return <Activity className="w-4 h-4" />;
      case 'spectrum':
      case 'simulation_result':
        return <BarChart3 className="w-4 h-4" />;
      default:
        return <FileJson className="w-4 h-4" />;
    }
  };
  
  const formatValue = (value: any, depth = 0): React.ReactNode => {
    if (depth > 3) return '...';
    
    if (value === null || value === undefined) {
      return <span className="text-slate-500">null</span>;
    }
    
    if (typeof value === 'boolean') {
      return <span className={value ? 'text-green-400' : 'text-red-400'}>{String(value)}</span>;
    }
    
    if (typeof value === 'number') {
      return <span className="text-blue-400">{value.toFixed(2)}</span>;
    }
    
    if (typeof value === 'string') {
      if (value.length > 100) {
        return <span className="text-yellow-300">"{value.slice(0, 100)}..."</span>;
      }
      return <span className="text-yellow-300">"{value}"</span>;
    }
    
    if (Array.isArray(value)) {
      if (value.length === 0) return <span className="text-slate-500">[]</span>;
      return (
        <div>
          <span className="text-slate-400">[</span>
          <div className="pl-4">
            {value.slice(0, 10).map((item, idx) => (
              <div key={idx} className="flex">
                <span className="text-slate-500 mr-2">{idx}:</span>
                {formatValue(item, depth + 1)}
                {idx < value.length - 1 && <span className="text-slate-500">,</span>}
              </div>
            ))}
            {value.length > 10 && (
              <div className="text-slate-500">... ({value.length - 10} more items)</div>
            )}
          </div>
          <span className="text-slate-400">]</span>
        </div>
      );
    }
    
    if (typeof value === 'object') {
      const entries = Object.entries(value);
      if (entries.length === 0) return <span className="text-slate-500">{'{}'}</span>;
      return (
        <div>
          <span className="text-slate-400">{'{'}</span>
          <div className="pl-4">
            {entries.slice(0, 15).map(([key, val], idx) => (
              <div key={key} className="flex">
                <span className="text-cyan-400 mr-2">{key}:</span>
                {formatValue(val, depth + 1)}
                {idx < entries.length - 1 && <span className="text-slate-500">,</span>}
              </div>
            ))}
            {entries.length > 15 && (
              <div className="text-slate-500">... ({entries.length - 15} more keys)</div>
            )}
          </div>
          <span className="text-slate-400">{'}'}</span>
        </div>
      );
    }
    
    return String(value);
  };
  
  const completedCount = currentWorkflow.nodes.filter(n => n.status === 'completed').length;
  const runningCount = currentWorkflow.nodes.filter(n => n.status === 'running').length;
  const errorCount = currentWorkflow.nodes.filter(n => n.status === 'error').length;
  const idleCount = currentWorkflow.nodes.filter(n => n.status === 'idle').length;
  
  const hasResults = currentWorkflow.nodes.some(n => n.result || n.status !== 'idle');
  
  if (!hasResults && !workflowExecution.startedAt) return null;
  
  return (
    <div className={cn(
      'bg-slate-900/90 backdrop-blur-sm border-l border-slate-700/50 transition-all duration-300',
      isPanelOpen ? 'w-80' : 'w-10'
    )}>
      {isPanelOpen ? (
        <div className="h-full flex flex-col">
          <div className="flex items-center justify-between p-3 border-b border-slate-700/50">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-purple-400" />
              执行结果
            </h3>
            <button
              onClick={() => setIsPanelOpen(false)}
              className="text-slate-400 hover:text-white"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          
          <div className="p-3 border-b border-slate-700/50">
            <div className="grid grid-cols-4 gap-2 text-center">
              <div className="bg-slate-800/50 rounded p-2">
                <div className="text-lg font-semibold text-green-400">{completedCount}</div>
                <div className="text-xs text-slate-500">完成</div>
              </div>
              <div className="bg-slate-800/50 rounded p-2">
                <div className="text-lg font-semibold text-yellow-400">{runningCount}</div>
                <div className="text-xs text-slate-500">运行中</div>
              </div>
              <div className="bg-slate-800/50 rounded p-2">
                <div className="text-lg font-semibold text-red-400">{errorCount}</div>
                <div className="text-xs text-slate-500">错误</div>
              </div>
              <div className="bg-slate-800/50 rounded p-2">
                <div className="text-lg font-semibold text-slate-400">{idleCount}</div>
                <div className="text-xs text-slate-500">等待</div>
              </div>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            <div className="p-2 space-y-1">
              {currentWorkflow.nodes.map(node => (
                <div
                  key={node.id}
                  className={cn(
                    'rounded-lg overflow-hidden transition-all',
                    selectedNodeId === node.id ? 'ring-2 ring-blue-500' : '',
                    node.status === 'error' ? 'bg-red-900/20' :
                    node.status === 'completed' ? 'bg-green-900/10' :
                    node.status === 'running' ? 'bg-yellow-900/10' : 'bg-slate-800/30'
                  )}
                >
                  <div
                    className="flex items-center gap-2 p-2 cursor-pointer hover:bg-slate-700/30"
                    onClick={() => toggleNodeExpanded(node.id)}
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        selectNode(node.id);
                      }}
                      className="text-slate-400 hover:text-white"
                    >
                      {expandedNodes.has(node.id) ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </button>
                    
                    {getStatusIcon(node.status)}
                    
                    <div className="flex-1 min-w-0">
                      <div className={cn(
                        'text-sm font-medium truncate',
                        getStatusColor(node.status)
                      )}>
                        {node.name}
                      </div>
                      <div className="text-xs text-slate-500 truncate">
                        {node.type.replace(/_/g, ' ')}
                      </div>
                    </div>
                    
                    {node.progress !== undefined && node.status === 'running' && (
                      <div className="text-xs text-yellow-400 font-mono">
                        {Math.round(node.progress)}%
                      </div>
                    )}
                  </div>
                  
                  <AnimatePresence>
                    {expandedNodes.has(node.id) && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <div className="px-3 pb-3 border-t border-slate-700/30">
                          {node.error ? (
                            <div className="mt-2 p-2 bg-red-900/30 border border-red-700 rounded">
                              <div className="text-xs text-red-400 font-medium mb-1">错误信息</div>
                              <p className="text-xs text-red-300">{node.error}</p>
                            </div>
                          ) : node.result ? (
                            <div className="mt-2">
                              <div className="text-xs text-slate-400 mb-1 flex items-center gap-1">
                                {getResultIcon(node)}
                                执行结果
                              </div>
                              <div className="bg-slate-900 rounded p-2 text-xs font-mono text-slate-300 max-h-48 overflow-y-auto">
                                {formatValue(node.result)}
                              </div>
                            </div>
                          ) : (
                            <div className="mt-2 text-xs text-slate-500 italic">
                              {node.status === 'running' ? '正在执行...' :
                               node.status === 'idle' ? '等待执行' : '无结果'}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </div>
          
          {workflowExecution.startedAt && (
            <div className="p-3 border-t border-slate-700/50 text-xs text-slate-500">
              <div className="flex justify-between">
                <span>开始时间:</span>
                <span className="font-mono">{new Date(workflowExecution.startedAt).toLocaleTimeString()}</span>
              </div>
              {workflowExecution.completedAt && (
                <div className="flex justify-between mt-1">
                  <span>完成时间:</span>
                  <span className="font-mono">{new Date(workflowExecution.completedAt).toLocaleTimeString()}</span>
                </div>
              )}
              {workflowExecution.startedAt && (
                <div className="flex justify-between mt-1">
                  <span>执行时长:</span>
                  <span className="font-mono text-green-400">
                    {((workflowExecution.completedAt || Date.now()) - workflowExecution.startedAt) / 1000}s
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <button
          onClick={() => setIsPanelOpen(true)}
          className="w-full h-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800/50 transition-colors"
          title="展开结果面板"
        >
          <ChevronDown className="w-4 h-4 -rotate-90" />
        </button>
      )}
    </div>
  );
}
