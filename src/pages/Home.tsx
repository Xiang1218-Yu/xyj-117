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
  Sparkles
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { MoleculeScene } from '../components/MoleculeViewer/MoleculeScene';
import { MoleculeLibrary } from '../components/MoleculeLibrary/MoleculeLibrary';
import { ControlPanel } from '../components/ControlPanel/ControlPanel';
import { DataPanel } from '../components/DataPanel/DataPanel';
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
    toggleLeftPanel,
    toggleRightPanel,
    toggleBottomPanel,
    simulation,
  } = useStore();

  const ligandAtoms = simulation.isRunning ? currentAtoms : undefined;

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
            onClick={toggleBottomPanel}
            className={`p-2 rounded-lg transition-all ${
              bottomPanelOpen 
                ? 'bg-quantum-purple/20 text-quantum-purple' 
                : 'bg-space-700 text-gray-400 hover:text-white hover:bg-space-600'
            }`}
            title="切换数据面板"
          >
            <PanelBottom size={18} />
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={toggleRightPanel}
            className={`p-2 rounded-lg transition-all ${
              rightPanelOpen 
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
            className="p-2 rounded-lg bg-space-700 text-gray-400 hover:text-white hover:bg-space-600 transition-all"
            title="导出"
          >
            <Download size={18} />
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="p-2 rounded-lg bg-space-700 text-gray-400 hover:text-white hover:bg-space-600 transition-all"
            title="设置"
          >
            <Settings size={18} />
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="p-2 rounded-lg bg-space-700 text-gray-400 hover:text-white hover:bg-space-600 transition-all"
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
          {leftPanelOpen && (
            <motion.aside
              initial={{ x: -320, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -320, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="w-72 h-full flex-shrink-0 z-30"
            >
              <MoleculeLibrary />
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Center - 3D Viewer */}
        <main className="flex-1 flex flex-col relative overflow-hidden">
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
            {bottomPanelOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="flex-shrink-0 z-20"
                style={{ maxHeight: '45%' }}
              >
                <DataPanel />
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* Right Panel - Control Panel */}
        <AnimatePresence mode="wait">
          {rightPanelOpen && (
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