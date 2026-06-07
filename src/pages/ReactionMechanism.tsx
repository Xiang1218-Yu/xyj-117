import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Menu, 
  PanelLeft, 
  PanelRight, 
  Home,
  Maximize2,
  Download,
  Settings,
  HelpCircle,
  FlaskConical,
  X
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { ReactionMechanism, ReactionSimulationState } from '../types';
import { reactionLibrary } from '../data/reactions';
import { ReactionMechanismEngine } from '../utils/reactionMechanismEngine';
import { ReactionLibraryPanel } from '../components/ReactionMechanism/ReactionLibraryPanel';
import { ReactionControlBar } from '../components/ReactionMechanism/ReactionControlBar';
import { ReactionTimeline } from '../components/ReactionMechanism/ReactionTimeline';
import { EnergyProfileChart } from '../components/ReactionMechanism/EnergyProfileChart';
import { ReactionMechanismScene } from '../components/MoleculeViewer/ReactionMechanismScene';

const initialSimulationState: ReactionSimulationState = {
  isRunning: false,
  currentReaction: null,
  currentTime: 0,
  totalDuration: 100,
  playbackSpeed: 1,
  isPaused: false,
  currentKeyframe: 0,
  showElectronFlow: true,
  showTransitionStates: true,
  showEnergyCurve: true,
  showBondChanges: true,
};

export default function ReactionMechanismPage() {
  const {
    showHydrogens,
    autoRotate,
    backgroundColor,
  } = useStore();

  const [simulationState, setSimulationState] = useState<ReactionSimulationState>(initialSimulationState);
  const [engine] = useState(() => new ReactionMechanismEngine());
  const [leftPanelOpen, setLeftPanelOpen] = useState(true);
  const [rightPanelOpen, setRightPanelOpen] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [renderState, setRenderState] = useState<any>(null);

  useEffect(() => {
    const unsubscribe = engine.subscribe(() => {
      const state = engine.getRenderState();
      setRenderState(state);
      
      setSimulationState(prev => ({
        ...prev,
        currentTime: state?.currentTime || 0,
        totalDuration: state?.totalDuration || 100,
        isRunning: engine.isPlayingState(),
      }));
    });

    return unsubscribe;
  }, [engine]);

  useEffect(() => {
    if (reactionLibrary.length > 0 && !simulationState.currentReaction) {
      handleSelectReaction(reactionLibrary[0]);
    }
  }, []);

  const handleSelectReaction = useCallback((reaction: ReactionMechanism) => {
    engine.setReaction(reaction);
    engine.reset();
    const state = engine.getRenderState();
    setRenderState(state);
    
    setSimulationState(prev => ({
      ...prev,
      currentReaction: reaction,
      currentTime: 0,
      totalDuration: state?.totalDuration || 100,
      isRunning: false,
      currentKeyframe: 0,
    }));
  }, [engine]);

  const handleTogglePlay = useCallback(() => {
    engine.togglePlay();
    setSimulationState(prev => ({
      ...prev,
      isRunning: engine.isPlayingState(),
    }));
  }, [engine]);

  const handleReset = useCallback(() => {
    engine.reset();
    const state = engine.getRenderState();
    setRenderState(state);
    setSimulationState(prev => ({
      ...prev,
      currentTime: 0,
      isRunning: false,
    }));
  }, [engine]);

  const handleStepForward = useCallback((amount: number = 1) => {
    engine.stepForward(amount);
    const state = engine.getRenderState();
    setRenderState(state);
  }, [engine]);

  const handleStepBackward = useCallback((amount: number = 1) => {
    engine.stepBackward(amount);
    const state = engine.getRenderState();
    setRenderState(state);
  }, [engine]);

  const handleSetSpeed = useCallback((speed: number) => {
    engine.setPlaybackSpeed(speed);
    setSimulationState(prev => ({
      ...prev,
      playbackSpeed: speed,
    }));
  }, [engine]);

  const handleSeek = useCallback((time: number) => {
    engine.setTime(time);
    const state = engine.getRenderState();
    setRenderState(state);
  }, [engine]);

  const handleToggleElectronFlow = useCallback(() => {
    setSimulationState(prev => ({
      ...prev,
      showElectronFlow: !prev.showElectronFlow,
    }));
  }, []);

  const handleToggleTransitionStates = useCallback(() => {
    setSimulationState(prev => ({
      ...prev,
      showTransitionStates: !prev.showTransitionStates,
    }));
  }, []);

  const handleToggleBondChanges = useCallback(() => {
    setSimulationState(prev => ({
      ...prev,
      showBondChanges: !prev.showBondChanges,
    }));
  }, []);

  const currentReaction = simulationState.currentReaction;

  return (
    <div className="h-screen w-screen bg-slate-950 flex flex-col overflow-hidden">
      <header className="flex items-center justify-between px-4 py-3 bg-slate-900/80 backdrop-blur-xl border-b border-slate-700/50 z-50">
        <div className="flex items-center gap-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setLeftPanelOpen(!leftPanelOpen)}
            className="p-2 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 text-slate-400 hover:text-white transition-all"
          >
            {leftPanelOpen ? <PanelLeft className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </motion.button>
          
          <a 
            href="/"
            className="p-2 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 text-slate-400 hover:text-white transition-all"
          >
            <Home className="w-5 h-5" />
          </a>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
              <FlaskConical className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">有机化学反应机理模拟</h1>
              <p className="text-xs text-slate-400">电子转移 · 键形成与断裂 · 过渡态可视化</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setRightPanelOpen(!rightPanelOpen)}
            className="p-2 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 text-slate-400 hover:text-white transition-all"
          >
            <PanelRight className="w-5 h-5" />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 text-slate-400 hover:text-white transition-all"
          >
            <Settings className="w-5 h-5" />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowHelp(!showHelp)}
            className="p-2 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 text-slate-400 hover:text-white transition-all"
          >
            <HelpCircle className="w-5 h-5" />
          </motion.button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <AnimatePresence>
          {leftPanelOpen && (
            <motion.div
              initial={{ x: -320, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -320, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="flex-shrink-0 h-full"
            >
              <ReactionLibraryPanel
                selectedReaction={currentReaction}
                onSelectReaction={handleSelectReaction}
              />
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex-1 flex flex-col min-w-0">
          {currentReaction ? (
            <>
              <div className="flex-1 relative min-h-0">
                <ReactionMechanismScene
                  reaction={currentReaction}
                  engine={engine}
                  simulationState={simulationState}
                  showHydrogens={showHydrogens}
                  autoRotate={autoRotate}
                  backgroundColor={backgroundColor}
                />

                {renderState?.phase && (
                  <div className="absolute top-4 left-1/2 -translate-x-1/2">
                    <motion.div
                      initial={{ opacity: 0, y: -20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="px-6 py-3 bg-slate-900/90 backdrop-blur-xl rounded-2xl border border-slate-700/50 shadow-2xl"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${
                          renderState.phase === 'reactant' ? 'bg-blue-500' :
                          renderState.phase === 'transition' ? 'bg-amber-500 animate-pulse' :
                          renderState.phase === 'intermediate' ? 'bg-purple-500' :
                          'bg-green-500'
                        }`} />
                        <span className="text-white font-semibold">
                          {renderState.phase === 'reactant' ? '反应物阶段' :
                           renderState.phase === 'transition' ? '过渡态 ⚡' :
                           renderState.phase === 'intermediate' ? '中间体' :
                           '产物阶段 ✓'}
                        </span>
                      </div>
                    </motion.div>
                  </div>
                )}

                {renderState?.atTransitionState && (
                  <div className="absolute top-20 left-1/2 -translate-x-1/2">
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="px-4 py-2 bg-amber-500/20 backdrop-blur-xl rounded-xl border border-amber-500/50"
                    >
                      <span className="text-amber-400 font-semibold text-sm">
                        ⚠️ 过渡态 - 注意电子转移和键变化
                      </span>
                    </motion.div>
                  </div>
                )}
              </div>

              {currentReaction && (
                <ReactionTimeline
                  simulationState={simulationState}
                  keyframes={currentReaction.keyframes}
                  energyProfile={currentReaction.energyProfile}
                  onSeek={handleSeek}
                />
              )}

              <ReactionControlBar
                simulationState={simulationState}
                onTogglePlay={handleTogglePlay}
                onReset={handleReset}
                onStepBackward={handleStepBackward}
                onStepForward={handleStepForward}
                onSetSpeed={handleSetSpeed}
                onToggleElectronFlow={handleToggleElectronFlow}
                onToggleTransitionStates={handleToggleTransitionStates}
                onToggleBondChanges={handleToggleBondChanges}
              />
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <FlaskConical className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                <h2 className="text-xl font-bold text-slate-400 mb-2">选择一个反应</h2>
                <p className="text-slate-500">从左侧面板选择有机化学反应类型开始模拟</p>
              </div>
            </div>
          )}
        </div>

        <AnimatePresence>
          {rightPanelOpen && currentReaction && renderState && (
            <motion.div
              initial={{ x: 320, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 320, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="flex-shrink-0 h-full"
            >
              <EnergyProfileChart
                energyProfile={currentReaction.energyProfile}
                currentTime={renderState.currentTime || 0}
                currentEnergy={renderState.currentEnergy || 0}
                activationEnergy={currentReaction.activationEnergy}
                reactionEnthalpy={currentReaction.reactionEnthalpy}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center"
            onClick={() => setShowSettings(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-slate-900 rounded-2xl p-6 max-w-md w-full mx-4 border border-slate-700/50"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">设置</h2>
                <button
                  onClick={() => setShowSettings(false)}
                  className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-xl">
                  <span className="text-slate-300">显示氢原子</span>
                  <div className="w-12 h-6 bg-amber-500 rounded-full relative cursor-pointer">
                    <div className="w-5 h-5 bg-white rounded-full absolute top-0.5 right-0.5 shadow-md" />
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-xl">
                  <span className="text-slate-300">自动旋转</span>
                  <div className="w-12 h-6 bg-slate-700 rounded-full relative cursor-pointer">
                    <div className="w-5 h-5 bg-white rounded-full absolute top-0.5 left-0.5 shadow-md" />
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showHelp && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center"
            onClick={() => setShowHelp(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-slate-900 rounded-2xl p-6 max-w-lg w-full mx-4 border border-slate-700/50"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">使用帮助</h2>
                <button
                  onClick={() => setShowHelp(false)}
                  className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-4 text-slate-300">
                <div className="p-4 bg-blue-500/10 rounded-xl border border-blue-500/30">
                  <h3 className="font-semibold text-blue-400 mb-2">🎮 基本操作</h3>
                  <ul className="space-y-1 text-sm">
                    <li>• 点击播放按钮开始反应动画</li>
                    <li>• 使用时间轴滑块手动控制反应进程</li>
                    <li>• 点击前进/后退按钮逐帧查看</li>
                    <li>• 调整播放速度控制动画快慢</li>
                  </ul>
                </div>
                
                <div className="p-4 bg-purple-500/10 rounded-xl border border-purple-500/30">
                  <h3 className="font-semibold text-purple-400 mb-2">⚡ 电子转移</h3>
                  <ul className="space-y-1 text-sm">
                    <li>• 紫色曲线箭头表示电子移动方向</li>
                    <li>• 发光粒子表示电子的流动</li>
                    <li>• 可以切换显示/隐藏电子转移效果</li>
                  </ul>
                </div>
                
                <div className="p-4 bg-green-500/10 rounded-xl border border-green-500/30">
                  <h3 className="font-semibold text-green-400 mb-2">🔗 键变化</h3>
                  <ul className="space-y-1 text-sm">
                    <li>• <span className="text-red-400">红色虚线</span> 表示化学键正在断裂</li>
                    <li>• <span className="text-green-400">绿色虚线</span> 表示化学键正在形成</li>
                    <li>• <span className="text-amber-400">橙色虚线</span> 表示键级变化</li>
                  </ul>
                </div>
                
                <div className="p-4 bg-amber-500/10 rounded-xl border border-amber-500/30">
                  <h3 className="font-semibold text-amber-400 mb-2">⚠️ 过渡态</h3>
                  <ul className="space-y-1 text-sm">
                    <li>• 橙色高亮表示反应的过渡态</li>
                    <li>• 此时键处于部分形成/断裂状态</li>
                    <li>• 系统能量达到最高点</li>
                  </ul>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
