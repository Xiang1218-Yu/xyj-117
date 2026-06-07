import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MousePointer2,
  Plus,
  Trash2,
  Link,
  Unlink,
  Move,
  Eye,
  Edit3,
  Undo2,
  Redo2,
  PlusCircle,
  ChevronDown,
  Sparkles,
  Zap,
} from 'lucide-react';
import { useStore } from '../../store/useStore';
import { EditorTool, EditorMode } from '../../types';
import { getAtomColor, atomColors } from '../../utils/atomColors';

const editorTools: { id: EditorTool; label: string; icon: any; description: string }[] = [
  { id: 'select', label: '选择', icon: MousePointer2, description: '选择原子或键进行编辑' },
  { id: 'add_atom', label: '添加原子', icon: Plus, description: '在3D视图中点击添加原子' },
  { id: 'delete', label: '删除', icon: Trash2, description: '点击原子或键将其删除' },
  { id: 'bond', label: '创建键', icon: Link, description: '依次点击两个原子创建化学键' },
  { id: 'erase_bond', label: '删除键', icon: Unlink, description: '点击化学键将其删除' },
  { id: 'drag', label: '拖拽', icon: Move, description: '拖拽原子调整位置' },
];

const commonElements = [
  'H', 'C', 'N', 'O', 'F', 'Cl', 'Br', 'I',
  'S', 'P', 'B', 'Si', 'Li', 'Na', 'K', 'Mg',
  'Ca', 'Fe', 'Cu', 'Zn', 'Ag', 'Au', 'Pt',
];

const bondOrders: { id: 1 | 2 | 3 | 'aromatic'; label: string }[] = [
  { id: 1, label: '单键' },
  { id: 2, label: '双键' },
  { id: 3, label: '三键' },
  { id: 'aromatic', label: '芳香键' },
];

export function EditorToolbar() {
  const {
    editor,
    setEditorMode,
    setEditorTool,
    setSelectedElement,
    setBondOrder,
    toggleShowHydrogenOnAdd,
    toggleAutoBond,
    createNewEmptyMolecule,
    undoEdit,
    redoEdit,
    historyIndex,
    editHistory,
  } = useStore();

  const [showElementPicker, setShowElementPicker] = useState(false);

  const canUndo = historyIndex >= 0;
  const canRedo = historyIndex < editHistory.length - 1;

  const handleModeToggle = (mode: EditorMode) => {
    setEditorMode(mode);
  };

  return (
    <div className="bg-space-800/90 backdrop-blur-xl border-b border-space-700">
      <div className="flex items-center justify-between px-4 py-2">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-space-700/50 rounded-lg p-1">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleModeToggle('view')}
              className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 text-sm transition-all ${
                editor.mode === 'view'
                  ? 'bg-quantum-blue text-white shadow-lg'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Eye size={14} />
              浏览
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleModeToggle('edit')}
              className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 text-sm transition-all ${
                editor.mode === 'edit'
                  ? 'bg-gradient-to-r from-quantum-purple to-quantum-cyan text-white shadow-lg'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Edit3 size={14} />
              编辑
            </motion.button>
          </div>

          <div className="h-6 w-px bg-space-600 mx-1" />

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={createNewEmptyMolecule}
            className="p-2 rounded-lg bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 text-green-400 hover:text-green-300 transition-all"
            title="创建新分子"
          >
            <PlusCircle size={16} />
          </motion.button>

          <div className="flex items-center gap-1 bg-space-700/50 rounded-lg p-1">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={undoEdit}
              disabled={!canUndo}
              className={`p-1.5 rounded-md transition-all ${
                canUndo
                  ? 'text-gray-400 hover:text-white hover:bg-space-600'
                  : 'text-gray-600 cursor-not-allowed'
              }`}
              title="撤销 (Ctrl+Z)"
            >
              <Undo2 size={14} />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={redoEdit}
              disabled={!canRedo}
              className={`p-1.5 rounded-md transition-all ${
                canRedo
                  ? 'text-gray-400 hover:text-white hover:bg-space-600'
                  : 'text-gray-600 cursor-not-allowed'
              }`}
              title="重做 (Ctrl+Y)"
            >
              <Redo2 size={14} />
            </motion.button>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {editor.mode === 'edit' && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center gap-4"
            >
              <div className="flex items-center gap-1 bg-space-700/50 rounded-lg p-1">
                {editorTools.map((tool) => {
                  const Icon = tool.icon;
                  return (
                    <motion.button
                      key={tool.id}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setEditorTool(tool.id)}
                      className={`p-2 rounded-md transition-all ${
                        editor.activeTool === tool.id
                          ? 'bg-quantum-purple text-white shadow-lg'
                          : 'text-gray-400 hover:text-white hover:bg-space-600'
                      }`}
                      title={tool.description}
                    >
                      <Icon size={16} />
                    </motion.button>
                  );
                })}
              </div>

              <div className="h-6 w-px bg-space-600" />

              {editor.activeTool === 'add_atom' && (
                <div className="relative">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowElementPicker(!showElementPicker)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-space-700/50 border border-space-600 hover:border-quantum-purple/50 transition-all"
                  >
                    <div
                      className="w-5 h-5 rounded-full border-2 border-white/30 shadow-inner"
                      style={{ backgroundColor: getAtomColor(editor.selectedElement) }}
                    />
                    <span className="text-sm font-semibold text-white">{editor.selectedElement}</span>
                    <ChevronDown size={14} className="text-gray-400" />
                  </motion.button>

                  <AnimatePresence>
                    {showElementPicker && (
                      <motion.div
                        initial={{ opacity: 0, y: -5, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -5, scale: 0.95 }}
                        className="absolute top-full mt-2 right-0 p-3 bg-space-800 border border-space-600 rounded-xl shadow-2xl z-50"
                      >
                        <p className="text-xs text-gray-400 mb-2 px-1">选择元素</p>
                        <div className="grid grid-cols-8 gap-1 max-w-xs">
                          {commonElements.map((el) => (
                            <motion.button
                              key={el}
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => {
                                setSelectedElement(el);
                                setShowElementPicker(false);
                              }}
                              className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold transition-all ${
                                editor.selectedElement === el
                                  ? 'ring-2 ring-quantum-purple scale-110'
                                  : 'hover:ring-1 hover:ring-white/30'
                              }`}
                              style={{
                                backgroundColor: atomColors[el] || '#808080',
                                color: ['H', 'He', 'Ne', 'Ar', 'F', 'Cl'].includes(el) ? '#333' : '#fff',
                              }}
                              title={el}
                            >
                              {el}
                            </motion.button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {(editor.activeTool === 'bond' || editor.activeTool === 'add_atom') && (
                <div className="flex items-center gap-2">
                  {editor.activeTool === 'bond' && (
                    <div className="flex items-center gap-1 bg-space-700/50 rounded-lg p-1">
                      {bondOrders.map((order) => (
                        <motion.button
                          key={order.id}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setBondOrder(order.id)}
                          className={`px-2 py-1 rounded text-xs font-medium transition-all ${
                            editor.bondOrder === order.id
                              ? 'bg-quantum-cyan text-white'
                              : 'text-gray-400 hover:text-white hover:bg-space-600'
                          }`}
                        >
                          {order.label}
                        </motion.button>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-1.5 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={editor.autoBond}
                        onChange={toggleAutoBond}
                        className="w-4 h-4 accent-quantum-purple rounded"
                      />
                      <span className="text-xs text-gray-400 group-hover:text-white transition-colors flex items-center gap-1">
                        <Zap size={12} className="text-quantum-purple" />
                        自动成键
                      </span>
                    </label>

                    <label className="flex items-center gap-1.5 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={editor.showHydrogenOnAdd}
                        onChange={toggleShowHydrogenOnAdd}
                        className="w-4 h-4 accent-quantum-cyan rounded"
                      />
                      <span className="text-xs text-gray-400 group-hover:text-white transition-colors flex items-center gap-1">
                        <Sparkles size={12} className="text-quantum-cyan" />
                        自动加氢
                      </span>
                    </label>
                  </div>
                </div>
              )}

              {editor.bondStartAtomId && (
                <motion.div
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="px-3 py-1.5 rounded-lg bg-quantum-purple/20 border border-quantum-purple/50 text-quantum-purple text-sm font-medium"
                >
                  请选择第二个原子以创建键
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {editor.mode === 'edit' && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          className="overflow-hidden border-t border-space-700/50"
        >
          <div className="px-4 py-1.5 bg-space-900/50">
            <p className="text-xs text-gray-500">
              {editor.activeTool === 'select' && '点击原子或键查看并编辑其属性。拖拽可以旋转视图。'}
              {editor.activeTool === 'add_atom' && `在3D视图中点击放置 ${editor.selectedElement} 原子。${editor.autoBond ? '靠近已有原子时会自动创建键。' : ''}`}
              {editor.activeTool === 'delete' && '点击原子或键将其删除。删除原子会同时删除连接的键。'}
              {editor.activeTool === 'bond' && '依次点击两个原子创建化学键。当前键级：' + 
                (editor.bondOrder === 'aromatic' ? '芳香键' : editor.bondOrder + '级键')}
              {editor.activeTool === 'erase_bond' && '点击化学键将其删除，不会删除原子。'}
              {editor.activeTool === 'drag' && '按住并拖拽原子可以调整其位置。'}
            </p>
          </div>
        </motion.div>
      )}
    </div>
  );
}
