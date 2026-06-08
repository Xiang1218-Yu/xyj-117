import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FlaskConical, 
  Library, 
  Atom, 
  Activity, 
  Pill, 
  Calculator,
  BarChart3,
  Dna,
  GitMerge,
  Zap,
  Filter,
  Combine,
  Download,
  Eye,
  ChevronDown,
  ChevronRight,
  GripVertical,
} from 'lucide-react';
import { WorkflowNodeType } from '../../types';
import { 
  getNodeDefinitionsByCategory, 
  categoryNames, 
  categoryColors 
} from '../../data/workflowNodes';
import { useStore } from '../../store/useStore';
import { cn } from '../../lib/utils';

const iconMap: Record<string, React.FC<{ className?: string }>> = {
  FlaskConical,
  Library,
  Atom,
  Activity,
  Pill,
  Calculator,
  BarChart3,
  Dna,
  GitMerge,
  Zap,
  Filter,
  Combine,
  Download,
  Eye,
};

interface NodePanelProps {
  className?: string;
}

export default function NodePanel({ className }: NodePanelProps) {
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    input: true,
    calculation: true,
    simulation: true,
    transformation: true,
    output: true,
    visualization: true,
  });
  
  const setDragState = useStore(state => state.setDragState);
  const nodeDefinitions = getNodeDefinitionsByCategory();
  
  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category],
    }));
  };
  
  const handleDragStart = (e: React.DragEvent, nodeType: WorkflowNodeType) => {
    e.dataTransfer.effectAllowed = 'copy';
    e.dataTransfer.setData('nodeType', nodeType);
    setDragState({
      isDragging: true,
      nodeType,
      nodeId: null,
      startX: e.clientX,
      startY: e.clientY,
      offsetX: 0,
      offsetY: 0,
    });
  };
  
  const handleDragEnd = () => {
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
  
  return (
    <div className={cn(
      'w-64 bg-slate-900/90 backdrop-blur-sm border-r border-slate-700/50 flex flex-col h-full',
      className
    )}>
      <div className="p-4 border-b border-slate-700/50">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <Library className="w-5 h-5 text-blue-400" />
          节点库
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          拖拽节点到画布构建工作流
        </p>
      </div>
      
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {Object.entries(nodeDefinitions).map(([category, definitions]) => (
          <div key={category} className="rounded-lg overflow-hidden">
            <button
              onClick={() => toggleCategory(category)}
              className={cn(
                'w-full px-3 py-2 flex items-center justify-between bg-gradient-to-r',
                categoryColors[category],
                'text-white text-sm font-medium hover:opacity-90 transition-opacity'
              )}
            >
              <span>{categoryNames[category]}</span>
              {expandedCategories[category] ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </button>
            
            <AnimatePresence>
              {expandedCategories[category] && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="bg-slate-800/50"
                >
                  <div className="p-2 space-y-1">
                    {definitions.map(def => {
                      const IconComponent = iconMap[def.icon] || Atom;
                      return (
                        <div
                          key={def.type}
                          draggable
                          onDragStart={(e) => handleDragStart(e, def.type)}
                          onDragEnd={handleDragEnd}
                          className="group flex items-center gap-2 px-3 py-2 bg-slate-700/30 hover:bg-slate-700/60 rounded-md cursor-grab active:cursor-grabbing transition-all border border-transparent hover:border-slate-600"
                        >
                          <GripVertical className="w-4 h-4 text-slate-500 group-hover:text-slate-400" />
                          <IconComponent className="w-4 h-4 text-slate-300" />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm text-slate-200 font-medium truncate">
                              {def.name}
                            </div>
                            <div className="text-xs text-slate-500 truncate">
                              {def.description}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </div>
  );
}
