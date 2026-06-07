import { motion } from 'framer-motion';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  SkipBack, 
  SkipForward,
  FastForward,
  Gauge,
  Eye,
  EyeOff,
  Zap,
  Link,
  Activity
} from 'lucide-react';
import { ReactionSimulationState } from '../../types';

interface ReactionControlBarProps {
  simulationState: ReactionSimulationState;
  onTogglePlay: () => void;
  onReset: () => void;
  onStepBackward: (amount?: number) => void;
  onStepForward: (amount?: number) => void;
  onSetSpeed: (speed: number) => void;
  onToggleElectronFlow: () => void;
  onToggleTransitionStates: () => void;
  onToggleBondChanges: () => void;
}

export function ReactionControlBar({
  simulationState,
  onTogglePlay,
  onReset,
  onStepBackward,
  onStepForward,
  onSetSpeed,
  onToggleElectronFlow,
  onToggleTransitionStates,
  onToggleBondChanges,
}: ReactionControlBarProps) {
  const { isRunning, playbackSpeed, showElectronFlow, showTransitionStates, showBondChanges } = simulationState;

  const speedOptions = [0.25, 0.5, 1, 1.5, 2, 4];

  const getPhaseLabel = (phase: string) => {
    const labels: Record<string, string> = {
      reactant: '反应物',
      transition: '过渡态',
      intermediate: '中间体',
      product: '产物',
    };
    return labels[phase] || phase;
  };

  return (
    <div className="bg-slate-900/95 backdrop-blur-xl border-t border-slate-700/50 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-slate-800/50 rounded-xl p-1">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onReset}
              className="p-2 rounded-lg hover:bg-slate-700/50 text-slate-400 hover:text-white transition-colors"
              title="重置"
            >
              <RotateCcw className="w-5 h-5" />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onStepBackward(5)}
              className="p-2 rounded-lg hover:bg-slate-700/50 text-slate-400 hover:text-white transition-colors"
              title="后退5帧"
            >
              <SkipBack className="w-5 h-5" />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onTogglePlay}
              className={`p-3 rounded-xl transition-all ${
                isRunning
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/30'
                  : 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg shadow-green-500/30'
              }`}
              title={isRunning ? '暂停' : '播放'}
            >
              {isRunning ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onStepForward(5)}
              className="p-2 rounded-lg hover:bg-slate-700/50 text-slate-400 hover:text-white transition-colors"
              title="前进5帧"
            >
              <SkipForward className="w-5 h-5" />
            </motion.button>
          </div>

          <div className="flex items-center gap-2 bg-slate-800/50 rounded-xl px-3 py-2">
            <Gauge className="w-4 h-4 text-slate-400" />
            <span className="text-xs text-slate-400 mr-2">速度:</span>
            <div className="flex items-center gap-1">
              {speedOptions.map((speed) => (
                <motion.button
                  key={speed}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => onSetSpeed(speed)}
                  className={`px-2 py-1 rounded-lg text-xs font-medium transition-all ${
                    playbackSpeed === speed
                      ? 'bg-amber-500 text-white'
                      : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                  }`}
                >
                  {speed}x
                </motion.button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onToggleElectronFlow}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-all ${
                showElectronFlow
                  ? 'bg-purple-500/20 text-purple-400 border border-purple-500/50'
                  : 'bg-slate-800/50 text-slate-500 border border-slate-700/50 hover:text-slate-400'
              }`}
            >
              <Zap className="w-4 h-4" />
              <span className="hidden sm:inline">电子转移</span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onToggleBondChanges}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-all ${
                showBondChanges
                  ? 'bg-green-500/20 text-green-400 border border-green-500/50'
                  : 'bg-slate-800/50 text-slate-500 border border-slate-700/50 hover:text-slate-400'
              }`}
            >
              <Link className="w-4 h-4" />
              <span className="hidden sm:inline">键变化</span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onToggleTransitionStates}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-all ${
                showTransitionStates
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/50'
                  : 'bg-slate-800/50 text-slate-500 border border-slate-700/50 hover:text-slate-400'
              }`}
            >
              <Activity className="w-4 h-4" />
              <span className="hidden sm:inline">过渡态</span>
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );
}
