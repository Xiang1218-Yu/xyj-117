import { useRef, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  Clock, 
  TrendingUp,
  Zap,
  Flame,
  ChevronRight
} from 'lucide-react';
import { ReactionKeyframe, ReactionEnergyPoint, ReactionSimulationState } from '../../types';

interface ReactionTimelineProps {
  simulationState: ReactionSimulationState;
  keyframes: ReactionKeyframe[];
  energyProfile: ReactionEnergyPoint[];
  onSeek: (time: number) => void;
}

export function ReactionTimeline({ simulationState, keyframes, energyProfile, onSeek }: ReactionTimelineProps) {
  const timelineRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const { currentTime, totalDuration } = simulationState;
  const progress = totalDuration > 0 ? (currentTime / totalDuration) * 100 : 0;

  const getPhaseColor = (type: string) => {
    const colors: Record<string, string> = {
      reactant: '#3B82F6',
      transition_state: '#F59E0B',
      intermediate: '#8B5CF6',
      product: '#22C55E',
    };
    return colors[type] || '#64748B';
  };

  const getPhaseLabel = (type: string) => {
    const labels: Record<string, string> = {
      reactant: '反应物',
      transition_state: '过渡态',
      intermediate: '中间体',
      product: '产物',
    };
    return labels[type] || type;
  };

  const handleTimelineClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineRef.current) return;
    
    const rect = timelineRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, x / rect.width));
    const newTime = percentage * totalDuration;
    onSeek(newTime);
  }, [totalDuration, onSeek]);

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    setIsDragging(true);
    handleTimelineClick(e);
  }, [handleTimelineClick]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    handleTimelineClick(e);
  }, [isDragging, handleTimelineClick]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const minEnergy = Math.min(...energyProfile.map(p => p.energy));
  const maxEnergy = Math.max(...energyProfile.map(p => p.energy));
  const energyRange = maxEnergy - minEnergy || 1;

  return (
    <div className="bg-slate-900/95 backdrop-blur-xl border-t border-slate-700/50 px-6 py-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
            <Clock className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">反应时间轴</h3>
            <p className="text-xs text-slate-400">
              时间: {currentTime.toFixed(1)} / {totalDuration.toFixed(1)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gradient-to-br from-red-500 to-orange-500" />
            <span className="text-xs text-slate-400">
              活化能: {simulationState.currentReaction?.activationEnergy.toFixed(1)} kJ/mol
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gradient-to-br from-green-500 to-emerald-500" />
            <span className="text-xs text-slate-400">
              焓变: {simulationState.currentReaction?.reactionEnthalpy.toFixed(1)} kJ/mol
            </span>
          </div>
        </div>
      </div>

      <div className="relative mb-4">
        <div className="flex items-center gap-1 mb-2">
          {keyframes.map((kf, i) => {
            const kfProgress = (kf.time / totalDuration) * 100;
            return (
              <div
                key={i}
                className="relative flex-1 flex flex-col items-center"
                style={{ left: `${kfProgress}%` }}
              >
                <div
                  className={`w-3 h-3 rounded-full border-2 ${
                    currentTime >= kf.time
                      ? 'bg-amber-500 border-amber-400 shadow-lg shadow-amber-500/50'
                      : 'bg-slate-700 border-slate-600'
                  }`}
                />
                <span className="text-[10px] text-slate-500 mt-1 whitespace-nowrap">
                  {kf.label}
                </span>
              </div>
            );
          })}
        </div>

        <div
          ref={timelineRef}
          className="relative h-20 bg-slate-800/50 rounded-xl overflow-hidden cursor-pointer border border-slate-700/50"
          onClick={handleTimelineClick}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
            <defs>
              <linearGradient id="energyGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.1" />
              </linearGradient>
              <linearGradient id="energyStroke" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#3B82F6" />
                <stop offset="50%" stopColor="#F59E0B" />
                <stop offset="100%" stopColor="#22C55E" />
              </linearGradient>
            </defs>

            <path
              d={`M 0 ${100 - ((energyProfile[0]?.energy - minEnergy) / energyRange) * 80 - 10} ${
                energyProfile.map((p, i) => {
                  const x = (p.time / totalDuration) * 100;
                  const y = 100 - ((p.energy - minEnergy) / energyRange) * 80 - 10;
                  return `L ${x} ${y}`;
                }).join(' ')
              } L 100 100 L 0 100 Z`}
              fill="url(#energyGradient)"
            />

            <path
              d={`M 0 ${100 - ((energyProfile[0]?.energy - minEnergy) / energyRange) * 80 - 10} ${
                energyProfile.map((p, i) => {
                  const x = (p.time / totalDuration) * 100;
                  const y = 100 - ((p.energy - minEnergy) / energyRange) * 80 - 10;
                  return `L ${x} ${y}`;
                }).join(' ')
              }`}
              fill="none"
              stroke="url(#energyStroke)"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {energyProfile.map((p, i) => {
              const x = (p.time / totalDuration) * 100;
              const y = 100 - ((p.energy - minEnergy) / energyRange) * 80 - 10;
              return (
                <circle
                  key={i}
                  cx={x}
                  cy={y}
                  r="4"
                  fill={getPhaseColor(p.type)}
                  stroke="white"
                  strokeWidth="2"
                />
              );
            })}
          </svg>

          <div
            className="absolute top-0 bottom-0 w-1 bg-gradient-to-b from-amber-400 to-orange-500 rounded-full shadow-lg shadow-amber-500/50"
            style={{ left: `${progress}%`, transform: 'translateX(-50%)' }}
          />

          <div
            className="absolute top-1/2 -translate-y-1/2 w-6 h-6 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full shadow-lg shadow-amber-500/50 flex items-center justify-center"
            style={{ left: `${progress}%`, transform: 'translate(-50%, -50%)' }}
          >
            <ChevronRight className="w-3 h-3 text-white" />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center gap-6">
        {['reactant', 'transition_state', 'intermediate', 'product'].map((type) => (
          <div key={type} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: getPhaseColor(type) }}
            />
            <span className="text-xs text-slate-400">{getPhaseLabel(type)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
