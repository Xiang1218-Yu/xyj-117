import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Menu, 
  PanelLeft, 
  PanelRight, 
  PanelBottom, 
  Atom,
  Maximize2,
  Download,
  Settings,
  HelpCircle,
  Github,
  Sparkles,
  X,
  FlaskConical
} from 'lucide-react';
import * as THREE from 'three';
import { useStore } from '../store/useStore';
import { MoleculeScene } from '../components/MoleculeViewer/MoleculeScene';
import { MoleculeLibrary } from '../components/MoleculeLibrary/MoleculeLibrary';
import { ControlPanel } from '../components/ControlPanel/ControlPanel';
import { DataPanel } from '../components/DataPanel/DataPanel';
import { EditorToolbar } from '../components/EditorToolbar/EditorToolbar';
import { PropertyEditor } from '../components/PropertyEditor/PropertyEditor';
import { Empty } from '../components/Empty';

export default function Home() {
  const {
    currentMolecule,
    currentAtoms,
    selectedAtomId,
    setSelectedAtom,
    displayMode,
    showHydrogens,
    showLabels,
    autoRotate,
    backgroundColor,
    showElectronCloud,
    ligandMolecule,
    leftPanelOpen,
    rightPanelOpen,
    bottomPanelOpen,
    dataPanelFullscreen,
    toggleLeftPanel,
    toggleRightPanel,
    toggleBottomPanel,
    setDataPanelFullscreen,
    simulation,
    calculationResult,
    editor,
    setSelectedBond,
    setBondStartAtom,
    addAtom,
    deleteAtom,
    addBond,
    deleteBond,
    dragAtom,
    clearEditorSelection,
    undoEdit,
    redoEdit,
    displayConfig,
  } = useStore();

  const [showSettings, setShowSettings] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  const ligandAtoms = simulation.isRunning ? currentAtoms : undefined;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undoEdit();
      } else if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        redoEdit();
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (editor.mode === 'edit' && selectedAtomId) {
          e.preventDefault();
          deleteAtom(selectedAtomId);
        } else if (editor.mode === 'edit' && editor.selectedBondId) {
          e.preventDefault();
          deleteBond(editor.selectedBondId);
        }
      } else if (e.key === 'Escape') {
        clearEditorSelection();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [editor.mode, selectedAtomId, editor.selectedBondId, undoEdit, redoEdit, deleteAtom, deleteBond, clearEditorSelection]);

  const handleAddBond = useCallback((atom1Id: string, atom2Id: string) => {
    addBond(atom1Id, atom2Id);
  }, [addBond]);

  const handleBondStart = useCallback((atomId: string) => {
    setBondStartAtom(atomId);
  }, [setBondStartAtom]);

  const handleBondClick = useCallback((bondId: string) => {
    setSelectedBond(bondId);
  }, [setSelectedBond]);

  const handleSceneClick = useCallback((point: THREE.Vector3) => {
    if (editor.activeTool === 'add_atom') {
      addAtom(point.x, point.y, point.z);
    }
  }, [editor.activeTool, addAtom]);
  
  const showLeftPanel = leftPanelOpen && !dataPanelFullscreen;
  const showRightPanel = rightPanelOpen && !dataPanelFullscreen;

  const handleToggleBottomPanel = useCallback(() => {
    if (dataPanelFullscreen) {
      setDataPanelFullscreen(false);
    } else {
      toggleBottomPanel();
    }
  }, [dataPanelFullscreen, setDataPanelFullscreen, toggleBottomPanel]);

  const handleExport = useCallback(() => {
    if (!currentMolecule) return;
    const data = {
      molecule: currentMolecule,
      simulation: simulation,
      calculationResult: calculationResult,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentMolecule.name}_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [currentMolecule, simulation, calculationResult]);

  return (
    <div className="w-full h-full flex flex-col bg-space-900 overflow-hidden">
      {/* Top Navigation Bar */}
      <header className="h-14 bg-space-800/90 backdrop-blur-xl border-b border-space-700 flex items-center justify-between px-4 z-50">
        <div className="flex items-center gap-4">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={toggleLeftPanel}
            className={`p-2 rounded-lg transition-all ${
              leftPanelOpen 
                ? 'bg-quantum-blue/20 text-quantum-blue' 
                : 'bg-space-700 text-gray-400 hover:text-white hover:bg-space-600'
            }`}
            title="切换分子库"
          >
            <PanelLeft size={18} />
          </motion.button>
          
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-quantum-blue to-quantum-purple flex items-center justify-center shadow-glow">
              <Atom size={20} className="text-white" />
            </div>
            <div>
              <h1 className="font-display font-bold text-lg bg-gradient-to-r from-quantum-blue via-quantum-purple to-quantum-cyan bg-clip-text text-transparent">
                Molecular Lab
              </h1>
              <p className="text-[10px] text-gray-500 font-mono -mt-1">3D分子模拟平台</p>
            </div>
          </div>
        </div>

        {/* Current Molecule Info */}
        <div className="flex items-center gap-4">
          {currentMolecule && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="hidden md:flex items-center gap-3 px-4 py-2 bg-space-700/50 rounded-xl border border-space-600"
            >
              <Sparkles size={14} className="text-quantum-cyan" />
              <div className="text-left">
                <p className="text-sm font-semibold text-white">{currentMolecule.name}</p>
                <p className="text-[10px] text-gray-500 font-mono">{currentMolecule.formula}</p>
              </div>
              <div className="h-6 w-px bg-space-600" />
              <div className="text-right">
                <p className="text-xs text-quantum-blue font-mono">{currentMolecule.atoms.length} 原子</p>
                <p className="text-[10px] text-gray-500 font-mono">{currentMolecule.bonds.length} 键</p>
              </div>
            </motion.div>
          )}
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => window.location.href = '/reaction-mechanism'}
            className="p-2 rounded-lg bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-400 border border-amber-500/30 hover:from-amber-500/30 hover:to-orange-500/30 transition-all"
            title="反应机理模拟"
          >
            <FlaskConical size={18} />
          </motion.button>

          <div className="h-6 w-px bg-space-700 mx-1" />

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleToggleBottomPanel}
            className={`p-2 rounded-lg transition-all ${
              bottomPanelOpen || dataPanelFullscreen
                ? 'bg-quantum-purple/20 text-quantum-purple' 
                : 'bg-space-700 text-gray-400 hover:text-white hover:bg-space-600'
            }`}
            title={bottomPanelOpen || dataPanelFullscreen ? '收起数据面板' : '展开数据面板'}
          >
            <PanelBottom size={18} />
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              if (dataPanelFullscreen) {
                setDataPanelFullscreen(false);
              }
              toggleRightPanel();
            }}
            className={`p-2 rounded-lg transition-all ${
              rightPanelOpen && !dataPanelFullscreen
                ? 'bg-quantum-cyan/20 text-quantum-cyan' 
                : 'bg-space-700 text-gray-400 hover:text-white hover:bg-space-600'
            }`}
            title="切换控制面板"
          >
            <PanelRight size={18} />
          </motion.button>

          <div className="h-6 w-px bg-space-700 mx-1" />

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleExport}
            disabled={!currentMolecule}
            className={`p-2 rounded-lg transition-all ${
              currentMolecule 
                ? 'bg-space-700 text-gray-400 hover:text-white hover:bg-space-600' 
                : 'bg-space-800 text-gray-600 cursor-not-allowed'
            }`}
            title="导出数据"
          >
            <Download size={18} />
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowSettings(!showSettings)}
            className={`p-2 rounded-lg transition-all ${
              showSettings
                ? 'bg-quantum-blue/20 text-quantum-blue'
                : 'bg-space-700 text-gray-400 hover:text-white hover:bg-space-600'
            }`}
            title="设置"
          >
            <Settings size={18} />
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowHelp(!showHelp)}
            className={`p-2 rounded-lg transition-all ${
              showHelp
                ? 'bg-quantum-purple/20 text-quantum-purple'
                : 'bg-space-700 text-gray-400 hover:text-white hover:bg-space-600'
            }`}
            title="帮助"
          >
            <HelpCircle size={18} />
          </motion.button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Panel - Molecule Library */}
        <AnimatePresence mode="wait">
          {showLeftPanel && (
            <motion.aside
              initial={{ x: -320, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -320, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="w-72 h-full flex-shrink-0 z-30"
            >
              <MoleculeLibrary onAddMolecule={() => setShowSettings(true)} />
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Center - 3D Viewer */}
        <main className="flex-1 flex flex-col relative overflow-hidden">
          {/* Editor Toolbar */}
          {currentMolecule && (
            <div className="absolute top-14 left-1/2 transform -translate-x-1/2 z-10">
              <EditorToolbar />
            </div>
          )}

          <div className="flex-1 relative">
            {currentMolecule ? (
              <MoleculeScene
                molecule={currentMolecule}
                ligandMolecule={ligandMolecule}
                displayMode={displayMode}
                showHydrogens={showHydrogens}
                showLabels={showLabels}
                autoRotate={autoRotate}
                backgroundColor={backgroundColor}
                selectedAtomId={selectedAtomId}
                onAtomClick={setSelectedAtom}
                showElectronCloud={showElectronCloud}
                currentAtoms={currentAtoms}
                ligandAtoms={ligandAtoms}
                editor={editor}
                onAddAtom={addAtom}
                onDeleteAtom={deleteAtom}
                onAddBond={handleAddBond}
                onDeleteBond={deleteBond}
                onBondStart={handleBondStart}
                onBondClick={handleBondClick}
                onAtomDrag={dragAtom}
                onSceneClick={handleSceneClick}
                onClearSelection={clearEditorSelection}
                displayConfig={displayConfig}
              />
            ) : (
              <Empty />
            )}

            {/* Floating Controls Overlay */}
            <div className="absolute top-4 left-4 flex flex-col gap-2 z-20">
              {currentMolecule && (
                <>
                  <div className="px-3 py-2 bg-space-800/80 backdrop-blur-md rounded-lg border border-space-700">
                    <p className="text-[10px] text-gray-500 font-mono">
                      鼠标左键: 旋转
                    </p>
                    <p className="text-[10px] text-gray-500 font-mono">
                      鼠标右键: 平移
                    </p>
                    <p className="text-[10px] text-gray-500 font-mono">
                      滚轮: 缩放
                    </p>
                  </div>
                </>
              )}
            </div>

            {/* Simulation Status Badge */}
            <AnimatePresence>
              {simulation.isRunning && (
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="absolute top-4 right-4 flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-quantum-blue/90 to-quantum-purple/90 backdrop-blur-md rounded-full border border-quantum-blue/50 shadow-glow z-20"
                >
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  <span className="text-sm font-medium text-white">模拟运行中</span>
                  <span className="text-xs font-mono text-white/70">
                    {simulation.currentStep} / {simulation.totalSteps}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Bottom Data Panel */}
          <AnimatePresence mode="wait">
            {(bottomPanelOpen || dataPanelFullscreen) && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: dataPanelFullscreen ? '100%' : 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className={`flex-shrink-0 z-20 ${dataPanelFullscreen ? 'absolute inset-0' : ''}`}
                style={{ maxHeight: dataPanelFullscreen ? '100%' : '45%' }}
              >
                <DataPanel />
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* Right Panel - Control Panel */}
        <AnimatePresence mode="wait">
          {showRightPanel && (
            <motion.aside
              initial={{ x: 320, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 320, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="w-72 h-full flex-shrink-0 z-30"
            >
              <ControlPanel />
            </motion.aside>
          )}
        </AnimatePresence>
      </div>

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowSettings(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-space-800 border border-space-700 rounded-2xl shadow-2xl max-w-md w-full p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-display text-xl font-bold bg-gradient-to-r from-quantum-blue to-quantum-purple bg-clip-text text-transparent">
                  设置
                </h3>
                <button
                  onClick={() => setShowSettings(false)}
                  className="p-1.5 rounded-lg bg-space-700 hover:bg-space-600 text-gray-400 hover:text-white transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="space-y-4">
                <p className="text-sm text-gray-400">
                  分子库自定义导入功能即将推出，敬请期待！
                </p>
                <div className="p-4 bg-space-700/50 rounded-xl border border-space-600">
                  <p className="text-xs text-gray-500 mb-2">支持的格式：</p>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-2 py-1 bg-quantum-blue/20 text-quantum-blue text-xs rounded-md">.pdb</span>
                    <span className="px-2 py-1 bg-quantum-purple/20 text-quantum-purple text-xs rounded-md">.xyz</span>
                    <span className="px-2 py-1 bg-quantum-cyan/20 text-quantum-cyan text-xs rounded-md">.mol</span>
                    <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-md">.cif</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Help Modal */}
      <AnimatePresence>
        {showHelp && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowHelp(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-space-800 border border-space-700 rounded-2xl shadow-2xl max-w-lg w-full p-6 max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-display text-xl font-bold bg-gradient-to-r from-quantum-purple to-quantum-cyan bg-clip-text text-transparent">
                  使用帮助
                </h3>
                <button
                  onClick={() => setShowHelp(false)}
                  className="p-1.5 rounded-lg bg-space-700 hover:bg-space-600 text-gray-400 hover:text-white transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="space-y-6">
                <div>
                  <h4 className="font-semibold text-white mb-2 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-quantum-blue/20 text-quantum-blue flex items-center justify-center text-sm">1</span>
                    3D视图操作
                  </h4>
                  <ul className="text-sm text-gray-400 space-y-1 ml-8">
                    <li>• 鼠标左键拖动：旋转分子</li>
                    <li>• 鼠标右键拖动：平移视图</li>
                    <li>• 滚轮：缩放视图</li>
                    <li>• 点击原子：查看原子详细信息</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-white mb-2 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-quantum-purple/20 text-quantum-purple flex items-center justify-center text-sm">2</span>
                    模拟流程
                  </h4>
                  <ul className="text-sm text-gray-400 space-y-1 ml-8">
                    <li>• 从左侧分子库选择分子</li>
                    <li>• 在右侧控制面板选择模拟类型</li>
                    <li>• 调整模拟参数（温度、步长等）</li>
                    <li>• 点击"开始模拟"按钮</li>
                    <li>• 在底部面板查看实时数据</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-white mb-2 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-quantum-cyan/20 text-quantum-cyan flex items-center justify-center text-sm">3</span>
                    显示模式
                  </h4>
                  <ul className="text-sm text-gray-400 space-y-1 ml-8">
                    <li>• 球棍模型：经典分子结构表示</li>
                    <li>• 空间填充：范德华半径显示</li>
                    <li>• 带状图：蛋白质二级结构</li>
                    <li>• 电子云：电子密度可视化</li>
                  </ul>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Status Bar */}
      <footer className="h-7 bg-space-800/90 backdrop-blur-xl border-t border-space-700 flex items-center justify-between px-4 text-[10px] text-gray-500 font-mono z-50">
        <div className="flex items-center gap-4">
          <span>Ready</span>
          {currentMolecule && (
            <span className="text-quantum-blue">
              {currentMolecule.type === 'protein' ? '蛋白质' : 
               currentMolecule.type === 'small_molecule' ? '小分子' : '材料'}
            </span>
          )}
        </div>
        <div className="flex items-center gap-4">
          <span>WebGL 2.0</span>
          <span>Three.js</span>
          <span className="flex items-center gap-1">
            <Github size={12} />
            Molecular Lab v1.0
          </span>
        </div>
      </footer>
    </div>
  );
}