import { useRef, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  Flame, 
  Zap, 
  ArrowDown,
  ArrowUp,
  Info
} from 'lucide-react';
import { ReactionEnergyPoint } from '../../types';

interface EnergyProfileChartProps {
  energyProfile: ReactionEnergyPoint[];
  currentTime: number;
  currentEnergy: number;
  activationEnergy: number;
  reactionEnthalpy: number;
}

export function EnergyProfileChart({ 
  energyProfile, 
  currentTime, 
  currentEnergy,
  activationEnergy,
  reactionEnthalpy
}: EnergyProfileChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const chartData = useMemo(() => {
    if (energyProfile.length === 0) return null;

    const minEnergy = Math.min(...energyProfile.map(p => p.energy));
    const maxEnergy = Math.max(...energyProfile.map(p => p.energy));
    const padding = (maxEnergy - minEnergy) * 0.2 || 10;
    const yMin = minEnergy - padding;
    const yMax = maxEnergy + padding;
    const yRange = yMax - yMin;

    const totalDuration = energyProfile[energyProfile.length - 1]?.time || 100;
    const progress = Math.min(1, currentTime / totalDuration);

    const points = energyProfile.map(p => {
      const x = (p.time / totalDuration) * 100;
      const y = 100 - ((p.energy - yMin) / yRange) * 100;
      return { x, y, ...p };
    });

    const currentX = progress * 100;
    const currentY = 100 - ((currentEnergy - yMin) / yRange) * 100;

    return { points, currentX, currentY, yMin, yMax, yRange, totalDuration };
  }, [energyProfile, currentTime, currentEnergy]);

  const getPhaseColor = (type: string) => {
    const colors: Record<string, string> = {
      reactant: '#3B82F6',
      transition_state: '#F59E0B',
      intermediate: '#8B5CF6',
      product: '#22C55E',
    };
    return colors[type] || '#64748B';
  };

  if (!chartData) return null;

  const { points, currentX, currentY, yMin, yMax, yRange } = chartData;

  const pathD = points.map((p, i) => 
    `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`
  ).join(' ');

  const areaD = `${pathD} L 100 100 L 0 100 Z`;

  return (
    <div className="w-80 bg-slate-900/95 backdrop-blur-xl border-l border-slate-700/50 flex flex-col h-full">
      <div className="p-4 border-b border-slate-700/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">能量曲线</h2>
            <p className="text-xs text-slate-400">反应进程能量变化</p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gradient-to-br from-red-500/20 to-orange-500/20 rounded-xl p-3 border border-red-500/30">
            <div className="flex items-center gap-2 mb-1">
              <Zap className="w-4 h-4 text-red-400" />
              <span className="text-xs text-red-400 font-medium">活化能</span>
            </div>
            <p className="text-xl font-bold text-white">
              {activationEnergy.toFixed(1)}
              <span className="text-xs text-slate-400 ml-1">kJ/mol</span>
            </p>
          </div>
          
          <div className={`rounded-xl p-3 border ${
            reactionEnthalpy < 0 
              ? 'bg-gradient-to-br from-green-500/20 to-emerald-500/20 border-green-500/30'
              : 'bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border-blue-500/30'
          }`}>
            <div className="flex items-center gap-2 mb-1">
              {reactionEnthalpy < 0 ? (
                <ArrowDown className="w-4 h-4 text-green-400" />
              ) : (
                <ArrowUp className="w-4 h-4 text-blue-400" />
              )}
              <span className={`text-xs font-medium ${
                reactionEnthalpy < 0 ? 'text-green-400' : 'text-blue-400'
              }`}>焓变 ΔH</span>
            </div>
            <p className="text-xl font-bold text-white">
              {reactionEnthalpy > 0 ? '+' : ''}{reactionEnthalpy.toFixed(1)}
              <span className="text-xs text-slate-400 ml-1">kJ/mol</span>
            </p>
          </div>
        </div>

        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-white">当前能量</span>
            <span className="text-lg font-bold text-amber-400">
              {currentEnergy.toFixed(2)} kJ/mol
            </span>
          </div>
          
          <div 
            ref={containerRef}
            className="relative h-48 bg-slate-900/50 rounded-lg overflow-hidden"
          >
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              <defs>
                <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#10B981" stopOpacity="0.05" />
                </linearGradient>
                <linearGradient id="chartStroke" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#3B82F6" />
                  <stop offset="50%" stopColor="#F59E0B" />
                  <stop offset="100%" stopColor="#22C55E" />
                </linearGradient>
              </defs>

              {[0.25, 0.5, 0.75].map((p, i) => (
                <line
                  key={i}
                  x1="0"
                  y1={p * 100}
                  x2="100"
                  y2={p * 100}
                  stroke="#334155"
                  strokeWidth="0.5"
                  strokeDasharray="2,2"
                />
              ))}

              <path
                d={areaD}
                fill="url(#chartGradient)"
              />

              <path
                d={pathD}
                fill="none"
                stroke="url(#chartStroke)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {points.map((p, i) => (
                <g key={i}>
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r="2"
                    fill={getPhaseColor(p.type)}
                    stroke="white"
                    strokeWidth="0.5"
                  />
                  {p.label && (
                    <text
                      x={p.x}
                      y={p.y - 4}
                      textAnchor="middle"
                      fill="#94A3B8"
                      fontSize="3"
                      fontWeight="500"
                    >
                      {p.label}
                    </text>
                  )}
                </g>
              ))}

              <line
                x1={currentX}
                y1="0"
                x2={currentX}
                y2="100"
                stroke="#F59E0B"
                strokeWidth="1"
                strokeDasharray="3,2"
                opacity="0.8"
              />

              <circle
                cx={currentX}
                cy={currentY}
                r="3"
                fill="#F59E0B"
                stroke="white"
                strokeWidth="1"
                filter="url(#glow)"
              />
            </svg>

            <div className="absolute bottom-2 left-2 right-2 flex justify-between text-[10px] text-slate-500">
              <span>反应开始</span>
              <span>反应进程</span>
              <span>反应结束</span>
            </div>
            
            <div className="absolute top-2 left-2 text-[10px] text-slate-500">
              <div>最高: {yMax.toFixed(1)}</div>
              <div>最低: {yMin.toFixed(1)}</div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-xl p-3 border border-blue-500/20">
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs text-slate-300 leading-relaxed">
                {reactionEnthalpy < 0 
                  ? '这是一个放热反应，产物能量低于反应物，反应自发进行。'
                  : '这是一个吸热反应，产物能量高于反应物，需要外部能量输入。'
                }
              </p>
              <p className="text-xs text-slate-500 mt-1">
                活化能越高，反应速率越慢，通常需要催化剂或加热。
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-auto p-4 border-t border-slate-700/50">
        <div className="flex flex-wrap gap-2 justify-center">
          {['reactant', 'transition_state', 'intermediate', 'product'].map((type) => (
            <div key={type} className="flex items-center gap-1.5">
              <div
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: getPhaseColor(type) }}
              />
              <span className="text-[10px] text-slate-400">
                {type === 'reactant' ? '反应物' : 
                 type === 'transition_state' ? '过渡态' :
                 type === 'intermediate' ? '中间体' : '产物'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
