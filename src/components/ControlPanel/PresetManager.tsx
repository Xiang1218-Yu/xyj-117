import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Save, 
  Trash2, 
  Bookmark, 
  ChevronDown, 
  ChevronUp, 
  Plus, 
  X, 
  Edit3,
  Check,
  Download
} from 'lucide-react';
import { useStore } from '../../store/useStore';
import { DisplayPreset } from '../../types';

export function PresetManager() {
  const {
    presets,
    activePresetId,
    savePreset,
    applyPreset,
    deletePreset,
    updatePreset,
  } = useStore();

  const [expanded, setExpanded] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [newPresetName, setNewPresetName] = useState('');
  const [newPresetDescription, setNewPresetDescription] = useState('');
  const [editingPresetId, setEditingPresetId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');

  const modeLabels: Record<string, string> = {
    ball_stick: '球棍模型',
    space_filling: '空间填充',
    ribbon: '带状图',
    surface: '电子云',
    line: '线型模型',
    stick: '棍棒模型',
    point_cloud: '点云模型',
  };

  const handleSavePreset = () => {
    if (!newPresetName.trim()) return;
    savePreset(newPresetName.trim(), newPresetDescription.trim() || undefined);
    setNewPresetName('');
    setNewPresetDescription('');
    setShowSaveDialog(false);
  };

  const handleStartEdit = (preset: DisplayPreset) => {
    setEditingPresetId(preset.id);
    setEditName(preset.name);
    setEditDescription(preset.description || '');
  };

  const handleSaveEdit = () => {
    if (!editingPresetId || !editName.trim()) return;
    updatePreset(editingPresetId, {
      name: editName.trim(),
      description: editDescription.trim() || undefined,
    });
    setEditingPresetId(null);
  };

  const handleCancelEdit = () => {
    setEditingPresetId(null);
    setEditName('');
    setEditDescription('');
  };

  const defaultPresets = presets.filter(p => p.id.startsWith('default-'));
  const userPresets = presets.filter(p => !p.id.startsWith('default-'));

  const renderPresetItem = (preset: DisplayPreset, isDefault: boolean) => {
    const isEditing = editingPresetId === preset.id;
    const isActive = activePresetId === preset.id;

    if (isEditing) {
      return (
        <div
          key={preset.id}
          className="p-3 rounded-lg bg-space-700/50 border border-quantum-purple/50 space-y-2"
        >
          <input
            type="text"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            placeholder="预设名称"
            className="w-full px-2 py-1 bg-space-800 border border-space-600 rounded text-sm text-white focus:outline-none focus:border-quantum-purple/50"
            autoFocus
          />
          <input
            type="text"
            value={editDescription}
            onChange={(e) => setEditDescription(e.target.value)}
            placeholder="描述（可选）"
            className="w-full px-2 py-1 bg-space-800 border border-space-600 rounded text-xs text-gray-400 focus:outline-none focus:border-quantum-purple/50"
          />
          <div className="flex gap-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSaveEdit}
              className="flex-1 py-1.5 rounded bg-quantum-purple/20 text-quantum-purple text-xs font-medium flex items-center justify-center gap-1"
            >
              <Check size={12} />
              保存
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleCancelEdit}
              className="flex-1 py-1.5 rounded bg-space-600 text-gray-400 text-xs font-medium flex items-center justify-center gap-1"
            >
              <X size={12} />
              取消
            </motion.button>
          </div>
        </div>
      );
    }

    return (
      <motion.div
        key={preset.id}
        whileHover={{ scale: 1.01 }}
        className={`p-3 rounded-lg border transition-all cursor-pointer group ${
          isActive
            ? 'bg-quantum-blue/20 border-quantum-blue/50'
            : 'bg-space-700/30 border-space-600 hover:border-space-500'
        }`}
        onClick={() => applyPreset(preset.id)}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <Bookmark size={14} className={isActive ? 'text-quantum-blue' : 'text-gray-500'} />
              <span className={`text-sm font-medium truncate ${isActive ? 'text-quantum-blue' : 'text-white'}`}>
                {preset.name}
              </span>
              {isActive && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-quantum-blue/30 text-quantum-blue">
                  当前
                </span>
              )}
            </div>
            {preset.description && (
              <p className="text-xs text-gray-500 mt-1 ml-6 line-clamp-2">
                {preset.description}
              </p>
            )}
            <div className="flex items-center gap-2 mt-2 ml-6">
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-space-600 text-gray-400">
                {modeLabels[preset.displayMode] || preset.displayMode}
              </span>
              <span className="text-[10px] text-gray-600">
                {new Date(preset.updatedAt).toLocaleDateString('zh-CN')}
              </span>
            </div>
          </div>
          {!isDefault && (
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleStartEdit(preset);
                }}
                className="p-1 rounded hover:bg-space-600 text-gray-400 hover:text-white transition-colors"
                title="编辑"
              >
                <Edit3 size={12} />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm(`确定要删除预设「${preset.name}」吗？`)) {
                    deletePreset(preset.id);
                  }
                }}
                className="p-1 rounded hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-colors"
                title="删除"
              >
                <Trash2 size={12} />
              </motion.button>
            </div>
          )}
        </div>
      </motion.div>
    );
  };

  return (
    <div className="border-t border-space-700">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-space-700/30 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Bookmark size={18} className="text-quantum-purple" />
          <span className="font-semibold text-white text-sm">显示预设</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-space-700 text-gray-400">
            {presets.length}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={(e) => {
              e.stopPropagation();
              setShowSaveDialog(true);
            }}
            className="p-1.5 rounded-lg bg-quantum-purple/20 text-quantum-purple hover:bg-quantum-purple/30 transition-colors"
            title="保存当前设置为预设"
          >
            <Save size={14} />
          </motion.button>
          {expanded ? (
            <ChevronUp size={18} className="text-gray-400" />
          ) : (
            <ChevronDown size={18} className="text-gray-400" />
          )}
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="p-4 pt-0 space-y-4">
              {showSaveDialog && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="p-3 rounded-lg bg-space-700/50 border border-quantum-purple/30 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-white">保存为预设</span>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => {
                        setShowSaveDialog(false);
                        setNewPresetName('');
                        setNewPresetDescription('');
                      }}
                      className="p-1 rounded hover:bg-space-600 text-gray-400 hover:text-white"
                    >
                      <X size={14} />
                    </motion.button>
                  </div>
                  <input
                    type="text"
                    value={newPresetName}
                    onChange={(e) => setNewPresetName(e.target.value)}
                    placeholder="预设名称"
                    className="w-full px-3 py-2 bg-space-800 border border-space-600 rounded-lg text-sm text-white focus:outline-none focus:border-quantum-purple/50"
                    autoFocus
                  />
                  <textarea
                    value={newPresetDescription}
                    onChange={(e) => setNewPresetDescription(e.target.value)}
                    placeholder="描述（可选）"
                    rows={2}
                    className="w-full px-3 py-2 bg-space-800 border border-space-600 rounded-lg text-xs text-gray-400 focus:outline-none focus:border-quantum-purple/50 resize-none"
                  />
                  <div className="flex gap-2">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleSavePreset}
                      disabled={!newPresetName.trim()}
                      className={`flex-1 py-2 rounded-lg font-medium text-sm flex items-center justify-center gap-2 transition-all ${
                        newPresetName.trim()
                          ? 'bg-gradient-to-r from-quantum-purple to-quantum-blue text-white'
                          : 'bg-space-600 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      <Plus size={14} />
                      保存预设
                    </motion.button>
                  </div>
                </motion.div>
              )}

              {userPresets.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs text-gray-500 px-1">我的预设</p>
                  <div className="space-y-2">
                    {userPresets.map(preset => renderPresetItem(preset, false))}
                  </div>
                </div>
              )}

              {defaultPresets.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs text-gray-500 px-1">默认预设</p>
                  <div className="space-y-2">
                    {defaultPresets.map(preset => renderPresetItem(preset, true))}
                  </div>
                </div>
              )}

              {presets.length === 0 && (
                <div className="text-center py-6">
                  <Download size={32} className="mx-auto text-gray-600 mb-2" />
                  <p className="text-xs text-gray-500">暂无预设</p>
                  <p className="text-xs text-gray-600 mt-1">点击上方按钮保存当前设置</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
