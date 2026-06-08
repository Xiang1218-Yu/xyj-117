import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, 
  Pause, 
  Square, 
  RotateCcw, 
  Save, 
  FolderOpen, 
  Trash2,
  Plus,
  CheckCircle,
  Clock,
  AlertCircle,
  FileText,
  ChevronDown,
  Download,
  Upload
} from 'lucide-react';
import { useStore } from '../../store/useStore';
import { executeWorkflow, validateWorkflow } from '../../utils/workflowEngine';
import { cn } from '../../lib/utils';

export default function WorkflowControlPanel() {
  const [showSaveMenu, setShowSaveMenu] = useState(false);
  const [showLoadMenu, setShowLoadMenu] = useState(false);
  const [workflowName, setWorkflowName] = useState('');
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  
  const currentWorkflow = useStore(state => state.currentWorkflow);
  const savedWorkflows = useStore(state => state.savedWorkflows);
  const workflowExecution = useStore(state => state.workflowExecution);
  
  const createNewWorkflow = useStore(state => state.createNewWorkflow);
  const saveWorkflow = useStore(state => state.saveWorkflow);
  const loadWorkflow = useStore(state => state.loadWorkflow);
  const deleteSavedWorkflow = useStore(state => state.deleteSavedWorkflow);
  const clearWorkflow = useStore(state => state.clearWorkflow);
  const startWorkflowExecution = useStore(state => state.startWorkflowExecution);
  const pauseWorkflowExecution = useStore(state => state.pauseWorkflowExecution);
  const resumeWorkflowExecution = useStore(state => state.resumeWorkflowExecution);
  const stopWorkflowExecution = useStore(state => state.stopWorkflowExecution);
  const resetWorkflowExecution = useStore(state => state.resetWorkflowExecution);
  const setNodeStatus = useStore(state => state.setNodeStatus);
  const setNodeResult = useStore(state => state.setNodeResult);
  const setCurrentExecutingNode = useStore(state => state.setCurrentExecutingNode);
  const completeWorkflowExecution = useStore(state => state.completeWorkflowExecution);
  const setWorkflowExecutionError = useStore(state => state.setWorkflowExecutionError);
  
  const handleNewWorkflow = () => {
    const name = prompt('输入工作流名称:', '新建工作流');
    if (name !== null) {
      createNewWorkflow(name);
    }
  };
  
  const handleSaveWorkflow = () => {
    if (!currentWorkflow) return;
    
    const name = workflowName || currentWorkflow.name;
    saveWorkflow(name);
    setShowSaveMenu(false);
    setWorkflowName('');
  };
  
  const handleLoadWorkflow = (workflowId: string) => {
    loadWorkflow(workflowId);
    setShowLoadMenu(false);
  };
  
  const handleDeleteWorkflow = (e: React.MouseEvent, workflowId: string) => {
    e.stopPropagation();
    if (confirm('确定要删除这个工作流吗？')) {
      deleteSavedWorkflow(workflowId);
    }
  };
  
  const handleRunWorkflow = async () => {
    if (!currentWorkflow) return;
    
    const validation = validateWorkflow(currentWorkflow);
    if (!validation.valid) {
      setValidationErrors(validation.errors);
      return;
    }
    setValidationErrors([]);
    
    resetWorkflowExecution();
    startWorkflowExecution();
    
    const context = {
      results: {},
      updateNodeStatus: (nodeId: string, status: any, error?: string, progress?: number) => {
        setNodeStatus(nodeId, status, error, progress);
      },
      updateNodeResult: (nodeId: string, result: any) => {
        setNodeResult(nodeId, result);
      },
      setCurrentNode: (nodeId: string | null) => {
        setCurrentExecutingNode(nodeId);
      },
      completeExecution: () => {
        completeWorkflowExecution();
      },
      setError: (error: string) => {
        setWorkflowExecutionError(error);
      },
      isPaused: () => useStore.getState().workflowExecution.isPaused,
      shouldStop: () => !useStore.getState().workflowExecution.isRunning && !useStore.getState().workflowExecution.isPaused,
    };
    
    await executeWorkflow(currentWorkflow, context);
  };
  
  const handlePauseResume = () => {
    if (workflowExecution.isPaused) {
      resumeWorkflowExecution();
    } else {
      pauseWorkflowExecution();
    }
  };
  
  const handleStop = () => {
    stopWorkflowExecution();
  };
  
  const handleReset = () => {
    resetWorkflowExecution();
    setValidationErrors([]);
  };
  
  const handleExportWorkflow = () => {
    if (!currentWorkflow) return;
    
    const dataStr = JSON.stringify(currentWorkflow, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `${currentWorkflow.name}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
  };
  
  const handleImportWorkflow = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e: any) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const workflow = JSON.parse(event.target?.result as string);
            useStore.getState().setCurrentWorkflow({
              ...workflow,
              id: `workflow-${Date.now()}`,
              createdAt: Date.now(),
              updatedAt: Date.now(),
            });
          } catch {
            alert('无效的工作流文件');
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };
  
  const formatDuration = (start: number | null, end: number | null) => {
    if (!start) return '0ms';
    const duration = (end || Date.now()) - start;
    if (duration < 1000) return `${duration}ms`;
    if (duration < 60000) return `${(duration / 1000).toFixed(1)}s`;
    return `${Math.floor(duration / 60000)}m ${Math.floor((duration % 60000) / 1000)}s`;
  };
  
  return (
    <div className="h-14 bg-slate-900/90 backdrop-blur-sm border-b border-slate-700/50 flex items-center justify-between px-4">
      <div className="flex items-center gap-2">
        <button
          onClick={handleNewWorkflow}
          className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-md text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          新建工作流
        </button>
        
        <div className="w-px h-6 bg-slate-700 mx-1" />
        
        <div className="relative">
          <button
            onClick={() => {
              setShowSaveMenu(!showSaveMenu);
              setShowLoadMenu(false);
            }}
            className="flex items-center gap-1 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-md text-sm transition-colors"
          >
            <Save className="w-4 h-4" />
            保存
            <ChevronDown className="w-3 h-3" />
          </button>
          
          <AnimatePresence>
            {showSaveMenu && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute top-full left-0 mt-1 w-64 bg-slate-800 border border-slate-600 rounded-lg shadow-xl z-50 p-3"
              >
                <label className="block text-xs text-slate-400 mb-1">工作流名称</label>
                <input
                  type="text"
                  value={workflowName}
                  onChange={(e) => setWorkflowName(e.target.value)}
                  placeholder={currentWorkflow?.name || '输入名称...'}
                  className="w-full px-2 py-1.5 bg-slate-700 border border-slate-600 rounded text-sm text-white mb-2 focus:outline-none focus:border-blue-500"
                />
                <button
                  onClick={handleSaveWorkflow}
                  className="w-full px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-sm font-medium transition-colors"
                >
                  保存到本地存储
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        <div className="relative">
          <button
            onClick={() => {
              setShowLoadMenu(!showLoadMenu);
              setShowSaveMenu(false);
            }}
            className="flex items-center gap-1 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-md text-sm transition-colors"
          >
            <FolderOpen className="w-4 h-4" />
            加载
            <ChevronDown className="w-3 h-3" />
          </button>
          
          <AnimatePresence>
            {showLoadMenu && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute top-full left-0 mt-1 w-72 bg-slate-800 border border-slate-600 rounded-lg shadow-xl z-50 max-h-80 overflow-y-auto"
              >
                {savedWorkflows.length === 0 ? (
                  <div className="p-4 text-center text-slate-500">
                    <FolderOpen className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">没有保存的工作流</p>
                  </div>
                ) : (
                  <div className="p-1">
                    {savedWorkflows.map(wf => (
                      <div
                        key={wf.id}
                        onClick={() => handleLoadWorkflow(wf.id)}
                        className="flex items-center justify-between px-3 py-2 hover:bg-slate-700 rounded cursor-pointer group"
                      >
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-slate-400" />
                          <div>
                            <div className="text-sm text-slate-200">{wf.name}</div>
                            <div className="text-xs text-slate-500">
                              {wf.nodes.length} 个节点 · {wf.connections.length} 个连接
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={(e) => handleDeleteWorkflow(e, wf.id)}
                          className="text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        <div className="w-px h-6 bg-slate-700 mx-1" />
        
        <button
          onClick={handleImportWorkflow}
          className="flex items-center gap-1 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-md text-sm transition-colors"
        >
          <Upload className="w-4 h-4" />
          导入
        </button>
        
        <button
          onClick={handleExportWorkflow}
          disabled={!currentWorkflow}
          className="flex items-center gap-1 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed text-slate-200 rounded-md text-sm transition-colors"
        >
          <Download className="w-4 h-4" />
          导出
        </button>
        
        <button
          onClick={clearWorkflow}
          disabled={!currentWorkflow || currentWorkflow.nodes.length === 0}
          className="flex items-center gap-1 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed text-slate-200 rounded-md text-sm transition-colors"
        >
          <Trash2 className="w-4 h-4" />
          清空
        </button>
      </div>
      
      <div className="flex items-center gap-4">
        {currentWorkflow && (
          <div className="text-right">
            <div className="text-sm text-slate-300 font-medium">
              {currentWorkflow.name}
            </div>
            <div className="text-xs text-slate-500">
              {currentWorkflow.nodes.length} 节点 · {currentWorkflow.connections.length} 连接
            </div>
          </div>
        )}
        
        <div className="w-px h-6 bg-slate-700 mx-1" />
        
        {validationErrors.length > 0 && (
          <div className="flex items-center gap-1 text-red-400">
            <AlertCircle className="w-4 h-4" />
            <span className="text-xs">{validationErrors.length} 个错误</span>
          </div>
        )}
        
        {workflowExecution.startedAt && (
          <div className="flex items-center gap-1 text-slate-400">
            <Clock className="w-4 h-4" />
            <span className="text-xs font-mono">
              {formatDuration(workflowExecution.startedAt, workflowExecution.completedAt)}
            </span>
          </div>
        )}
        
        {workflowExecution.currentNodeId && (
          <div className="flex items-center gap-1 text-yellow-400">
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 1 }}
            >
              <Play className="w-4 h-4" />
            </motion.div>
            <span className="text-xs">
              执行中: {currentWorkflow?.nodes.find(n => n.id === workflowExecution.currentNodeId)?.name}
            </span>
          </div>
        )}
        
        {workflowExecution.completedAt && !workflowExecution.error && (
          <div className="flex items-center gap-1 text-green-400">
            <CheckCircle className="w-4 h-4" />
            <span className="text-xs">完成</span>
          </div>
        )}
        
        <div className="flex items-center gap-1">
          {!workflowExecution.isRunning && !workflowExecution.isPaused ? (
            <button
              onClick={handleRunWorkflow}
              disabled={!currentWorkflow || currentWorkflow.nodes.length === 0}
              className={cn(
                'flex items-center gap-1 px-4 py-1.5 rounded-md text-sm font-medium transition-colors',
                'bg-green-600 hover:bg-green-500 text-white',
                'disabled:opacity-50 disabled:cursor-not-allowed'
              )}
            >
              <Play className="w-4 h-4" />
              运行
            </button>
          ) : (
            <>
              <button
                onClick={handlePauseResume}
                className="flex items-center gap-1 px-3 py-1.5 bg-yellow-600 hover:bg-yellow-500 text-white rounded-md text-sm font-medium transition-colors"
              >
                {workflowExecution.isPaused ? (
                  <><Play className="w-4 h-4" /> 继续</>
                ) : (
                  <><Pause className="w-4 h-4" /> 暂停</>
                )}
              </button>
              <button
                onClick={handleStop}
                className="flex items-center gap-1 px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-md text-sm font-medium transition-colors"
              >
                <Square className="w-4 h-4" />
                停止
              </button>
            </>
          )}
          
          <button
            onClick={handleReset}
            disabled={!workflowExecution.startedAt && validationErrors.length === 0}
            className="flex items-center gap-1 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed text-slate-200 rounded-md text-sm transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            重置
          </button>
        </div>
      </div>
      
      {validationErrors.length > 0 && (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 right-0 bg-red-900/90 border-t border-red-700 p-3 z-40"
          >
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center gap-2 text-red-200 mb-2">
                <AlertCircle className="w-4 h-4" />
                <span className="font-medium">工作流验证失败</span>
              </div>
              <ul className="text-sm text-red-300 space-y-1">
                {validationErrors.map((error, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-red-400">•</span>
                    {error}
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}
