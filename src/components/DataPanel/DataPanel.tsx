import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
} from 'recharts';
import { 
  Activity, 
  Zap, 
  Atom, 
  Gauge, 
  TrendingUp,
  ChevronDown,
  ChevronUp,
  Info,
  Download,
  Share2,
  Maximize2,
  Minimize2,
  Check
} from 'lucide-react';
import { useStore } from '../../store/useStore';
import { getAtomColor } from '../../utils/atomColors';

interface DataPoint {
  step: number;
  energy: number;
  rmsd?: number;
  rg?: number;
}

export function DataPanel() {
  const {
    simulation,
    calculationResult,
    currentMolecule,
    selectedSimulationType,
    selectedAtomId,
    currentAtoms,
    dataPanelFullscreen,
    setDataPanelFullscreen,
  } = useStore();

  const [expandedSection, setExpandedSection] = useState<string | null>('energy');
  const [copied, setCopied] = useState(false);
  const isFullscreen = dataPanelFullscreen;

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
    a.download = `${currentMolecule.name}_data_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [currentMolecule, simulation, calculationResult]);

  const handleShare = useCallback(async () => {
    if (!currentMolecule) return;
    
    const shareData = {
      title: `Molecular Lab - ${currentMolecule.name}`,
      text: `查看 ${currentMolecule.name} 的分子模拟结果`,
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch (err) {
      try {
        await navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (clipboardErr) {
        console.error('分享失败:', err);
      }
    }
  }, [currentMolecule]);

  const selectedAtom = useMemo(() => {
    if (!selectedAtomId) return null;
    return currentMolecule?.atoms.find(a => a.id === selectedAtomId) || 
           currentAtoms.find(a => a.id === selectedAtomId);
  }, [selectedAtomId, currentMolecule, currentAtoms]);

  const energyData = useMemo((): DataPoint[] => {
    return simulation.energy.slice(-100).map((energy, i) => {
      const originalIndex = simulation.energy.length - 100 + i;
      return {
        step: originalIndex * 5,
        energy: energy / 1000,
        rmsd: simulation.rmsd?.[originalIndex] || undefined,
        rg: simulation.radiusOfGyration?.[originalIndex] || undefined,
      };
    });
  }, [simulation.energy, simulation.rmsd, simulation.radiusOfGyration]);

  const orbitalData = useMemo(() => {
    if (!calculationResult?.molecularOrbitals) return [];
    return calculationResult.molecularOrbitals.map((orbital, i) => ({
      name: orbital.type === 'HOMO' ? 'HOMO' : orbital.type === 'LUMO' ? 'LUMO' : `MO-${i}`,
      energy: orbital.energy,
      occupancy: orbital.occupancy,
      fill: orbital.type === 'HOMO' ? '#3B82F6' : orbital.type === 'LUMO' ? '#8B5CF6' : '#64748B',
    }));
  }, [calculationResult]);

  const electronDensityData = useMemo(() => {
    if (!calculationResult?.electronDensity) return [];
    const data = [];
    const grid = calculationResult.electronDensity;
    for (let i = 0; i < grid.length; i++) {
      for (let j = 0; j < grid[i].length; j++) {
        data.push({
          x: i,
          y: j,
          density: grid[i][j],
        });
      }
    }
    return data;
  }, [calculationResult]);

  const propertyRadarData = useMemo(() => {
    if (!calculationResult) return [];
    const data = [];
    if (calculationResult.bindingEnergy !== undefined) {
      data.push({ subject: '结合能', A: Math.abs(calculationResult.bindingEnergy), fullMark: 20 });
    }
    if (calculationResult.bandGap !== undefined) {
      data.push({ subject: '带隙', A: calculationResult.bandGap, fullMark: 10 });
    }
    if (calculationResult.conductivity !== undefined) {
      data.push({ subject: '导电性', A: Math.log10(calculationResult.conductivity + 1), fullMark: 10 });
    }
    if (calculationResult.elasticity !== undefined) {
      data.push({ subject: '弹性模量', A: calculationResult.elasticity / 100, fullMark: 20 });
    }
    if (calculationResult.hydrogenBonds !== undefined) {
      data.push({ subject: '氢键', A: calculationResult.hydrogenBonds, fullMark: 20 });
    }
    if (calculationResult.hydrophobicContacts !== undefined) {
      data.push({ subject: '疏水作用', A: calculationResult.hydrophobicContacts, fullMark: 30 });
    }
    return data;
  }, [calculationResult]);

  const atomComposition = useMemo(() => {
    if (!currentMolecule) return [];
    const counts: Record<string, number> = {};
    currentMolecule.atoms.forEach(atom => {
      counts[atom.element] = (counts[atom.element] || 0) + 1;
    });
    return Object.entries(counts).map(([element, count]) => ({
      element,
      count,
      color: getAtomColor(element),
      percentage: ((count / currentMolecule.atoms.length) * 100).toFixed(1),
    }));
  }, [currentMolecule]);

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const formatNumber = (num: number | undefined, decimals: number = 2): string => {
    if (num === undefined) return '-';
    return num.toFixed(decimals);
  };

  const formatScientific = (num: number | undefined): string => {
    if (num === undefined) return '-';
    if (Math.abs(num) < 0.01 || Math.abs(num) > 10000) {
      return num.toExponential(2);
    }
    return num.toFixed(2);
  };

  return (
    <div className={`h-full flex flex-col bg-space-800/80 backdrop-blur-xl border-t border-space-700 transition-all ${
      isFullscreen ? 'fixed inset-0 z-50' : ''
    }`}>
      <div className="flex items-center justify-between p-3 border-b border-space-700">
        <div className="flex items-center gap-2">
          <Activity size={18} className="text-quantum-cyan" />
          <h2 className="font-display text-lg font-bold text-white">实时数据分析</h2>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={handleExport}
            disabled={!currentMolecule}
            className={`p-1.5 rounded-lg transition-colors ${
              currentMolecule 
                ? 'bg-space-700 hover:bg-space-600 text-gray-400 hover:text-white' 
                : 'bg-space-800 text-gray-600 cursor-not-allowed'
            }`}
            title="导出数据"
          >
            <Download size={16} />
          </button>
          <button 
            onClick={handleShare}
            disabled={!currentMolecule}
            className={`p-1.5 rounded-lg transition-colors ${
              currentMolecule 
                ? 'bg-space-700 hover:bg-space-600 text-gray-400 hover:text-white' 
                : 'bg-space-800 text-gray-600 cursor-not-allowed'
            }`}
            title={copied ? '已复制' : '分享'}
          >
            {copied ? <Check size={16} className="text-green-400" /> : <Share2 size={16} />}
          </button>
          <button 
            onClick={() => setDataPanelFullscreen(!isFullscreen)}
            className="p-1.5 rounded-lg bg-space-700 hover:bg-space-600 text-gray-400 hover:text-white transition-colors"
            title={isFullscreen ? '退出全屏' : '全屏'}
          >
            {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        <div className="grid grid-cols-4 gap-2">
          <motion.div 
            whileHover={{ scale: 1.02 }}
            className="p-3 rounded-xl bg-gradient-to-br from-quantum-blue/10 to-transparent border border-quantum-blue/30"
          >
            <div className="flex items-center gap-2 mb-1">
              <Zap size={14} className="text-quantum-blue" />
              <span className="text-xs text-gray-400">总能量</span>
            </div>
            <p className="font-mono text-lg text-quantum-blue">
              {formatNumber(energyData.length > 0 ? energyData[energyData.length - 1].energy : 0)}
              <span className="text-xs text-gray-500 ml-1">kJ/mol</span>
            </p>
          </motion.div>

          <motion.div 
            whileHover={{ scale: 1.02 }}
            className="p-3 rounded-xl bg-gradient-to-br from-quantum-purple/10 to-transparent border border-quantum-purple/30"
          >
            <div className="flex items-center gap-2 mb-1">
              <Gauge size={14} className="text-quantum-purple" />
              <span className="text-xs text-gray-400">RMSD</span>
            </div>
            <p className="font-mono text-lg text-quantum-purple">
              {formatNumber(simulation.rmsd?.[simulation.rmsd.length - 1])}
              <span className="text-xs text-gray-500 ml-1">Å</span>
            </p>
          </motion.div>

          <motion.div 
            whileHover={{ scale: 1.02 }}
            className="p-3 rounded-xl bg-gradient-to-br from-quantum-cyan/10 to-transparent border border-quantum-cyan/30"
          >
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp size={14} className="text-quantum-cyan" />
              <span className="text-xs text-gray-400">回转半径</span>
            </div>
            <p className="font-mono text-lg text-quantum-cyan">
              {formatNumber(simulation.radiusOfGyration?.[simulation.radiusOfGyration.length - 1])}
              <span className="text-xs text-gray-500 ml-1">Å</span>
            </p>
          </motion.div>

          <motion.div 
            whileHover={{ scale: 1.02 }}
            className="p-3 rounded-xl bg-gradient-to-br from-green-500/10 to-transparent border border-green-500/30"
          >
            <div className="flex items-center gap-2 mb-1">
              <Atom size={14} className="text-green-400" />
              <span className="text-xs text-gray-400">原子数</span>
            </div>
            <p className="font-mono text-lg text-green-400">
              {currentMolecule?.atoms.length || 0}
            </p>
          </motion.div>
        </div>

        {selectedAtom && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 rounded-xl bg-gradient-to-r from-quantum-blue/20 to-quantum-purple/20 border border-quantum-blue/30"
          >
            <div className="flex items-center gap-2 mb-2">
              <Info size={14} className="text-quantum-blue" />
              <span className="text-sm font-semibold text-white">选中原子信息</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div>
                <span className="text-gray-400">元素:</span>
                <span className="ml-1 font-mono" style={{ color: getAtomColor(selectedAtom.element) }}>
                  {selectedAtom.element}
                </span>
              </div>
              <div>
                <span className="text-gray-400">残基:</span>
                <span className="ml-1 font-mono text-white">{selectedAtom.residue || '-'}</span>
              </div>
              <div>
                <span className="text-gray-400">链:</span>
                <span className="ml-1 font-mono text-white">{selectedAtom.chain || '-'}</span>
              </div>
              <div>
                <span className="text-gray-400">X:</span>
                <span className="ml-1 font-mono text-white">{formatNumber(selectedAtom.x)}</span>
              </div>
              <div>
                <span className="text-gray-400">Y:</span>
                <span className="ml-1 font-mono text-white">{formatNumber(selectedAtom.y)}</span>
              </div>
              <div>
                <span className="text-gray-400">Z:</span>
                <span className="ml-1 font-mono text-white">{formatNumber(selectedAtom.z)}</span>
              </div>
            </div>
          </motion.div>
        )}

        <div className="rounded-xl overflow-hidden border border-space-700">
          <button
            onClick={() => toggleSection('energy')}
            className="w-full flex items-center justify-between p-3 bg-space-700/50 hover:bg-space-700 transition-colors"
          >
            <div className="flex items-center gap-2">
              <TrendingUp size={16} className="text-quantum-blue" />
              <span className="font-semibold text-white text-sm">能量变化曲线</span>
            </div>
            {expandedSection === 'energy' ? (
              <ChevronUp size={16} className="text-gray-400" />
            ) : (
              <ChevronDown size={16} className="text-gray-400" />
            )}
          </button>
          
          <AnimatePresence>
            {expandedSection === 'energy' && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="p-3 bg-space-900/50" style={{ height: 200 }}>
                  {energyData.length > 1 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={energyData}>
                        <defs>
                          <linearGradient id="energyGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1E3A5F" />
                        <XAxis 
                          dataKey="step" 
                          stroke="#64748B" 
                          fontSize={10}
                          tickLine={false}
                        />
                        <YAxis 
                          stroke="#64748B" 
                          fontSize={10}
                          tickLine={false}
                          tickFormatter={(v) => v.toFixed(0)}
                        />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: '#0F1F38', 
                            border: '1px solid #1E3A5F',
                            borderRadius: '8px',
                            fontSize: '12px',
                          }}
                          labelStyle={{ color: '#94A3B8' }}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="energy" 
                          stroke="#3B82F6" 
                          strokeWidth={2}
                          fill="url(#energyGradient)" 
                          name="能量 (kJ/mol)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-gray-500 text-sm">
                      启动模拟后显示能量曲线
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {selectedSimulationType === 'folding' && (
          <div className="rounded-xl overflow-hidden border border-space-700">
            <button
              onClick={() => toggleSection('rmsd')}
              className="w-full flex items-center justify-between p-3 bg-space-700/50 hover:bg-space-700 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Gauge size={16} className="text-quantum-purple" />
                <span className="font-semibold text-white text-sm">结构参数分析</span>
              </div>
              {expandedSection === 'rmsd' ? (
                <ChevronUp size={16} className="text-gray-400" />
              ) : (
                <ChevronDown size={16} className="text-gray-400" />
              )}
            </button>
            
            <AnimatePresence>
              {expandedSection === 'rmsd' && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="p-3 bg-space-900/50" style={{ height: 180 }}>
                    {energyData.length > 1 && simulation.rmsd && simulation.rmsd.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={energyData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1E3A5F" />
                          <XAxis 
                            dataKey="step" 
                            stroke="#64748B" 
                            fontSize={10}
                            tickLine={false}
                          />
                          <YAxis 
                            stroke="#64748B" 
                            fontSize={10}
                            tickLine={false}
                          />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: '#0F1F38', 
                              border: '1px solid #1E3A5F',
                              borderRadius: '8px',
                              fontSize: '12px',
                            }}
                          />
                          <Legend wrapperStyle={{ fontSize: '10px' }} />
                          <Line 
                            type="monotone" 
                            dataKey="rmsd" 
                            stroke="#8B5CF6" 
                            strokeWidth={2}
                            dot={false}
                            name="RMSD (Å)"
                          />
                          <Line 
                            type="monotone" 
                            dataKey="rg" 
                            stroke="#06B6D4" 
                            strokeWidth={2}
                            dot={false}
                            name="回转半径 (Å)"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center text-gray-500 text-sm">
                        启动折叠模拟后显示RMSD曲线
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {calculationResult && (
          <div className="rounded-xl overflow-hidden border border-space-700">
            <button
              onClick={() => toggleSection('results')}
              className="w-full flex items-center justify-between p-3 bg-space-700/50 hover:bg-space-700 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Zap size={16} className="text-green-400" />
                <span className="font-semibold text-white text-sm">计算结果</span>
              </div>
              {expandedSection === 'results' ? (
                <ChevronUp size={16} className="text-gray-400" />
              ) : (
                <ChevronDown size={16} className="text-gray-400" />
              )}
            </button>
            
            <AnimatePresence>
              {expandedSection === 'results' && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="p-3 bg-space-900/50 space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      {calculationResult.bindingEnergy !== undefined && (
                        <div className="p-3 rounded-lg bg-space-800 border border-space-600">
                          <p className="text-xs text-gray-400 mb-1">结合能</p>
                          <p className="font-mono text-lg text-quantum-blue">
                            {formatNumber(calculationResult.bindingEnergy)} kJ/mol
                          </p>
                        </div>
                      )}
                      {calculationResult.bindingAffinity !== undefined && (
                        <div className="p-3 rounded-lg bg-space-800 border border-space-600">
                          <p className="text-xs text-gray-400 mb-1">结合亲和力</p>
                          <p className="font-mono text-lg text-quantum-purple">
                            {formatNumber(calculationResult.bindingAffinity)} μM
                          </p>
                        </div>
                      )}
                      {calculationResult.bandGap !== undefined && (
                        <div className="p-3 rounded-lg bg-space-800 border border-space-600">
                          <p className="text-xs text-gray-400 mb-1">带隙</p>
                          <p className="font-mono text-lg text-quantum-cyan">
                            {formatNumber(calculationResult.bandGap)} eV
                          </p>
                        </div>
                      )}
                      {calculationResult.homoEnergy !== undefined && (
                        <div className="p-3 rounded-lg bg-space-800 border border-space-600">
                          <p className="text-xs text-gray-400 mb-1">HOMO能级</p>
                          <p className="font-mono text-lg text-blue-400">
                            {formatNumber(calculationResult.homoEnergy)} eV
                          </p>
                        </div>
                      )}
                      {calculationResult.lumoEnergy !== undefined && (
                        <div className="p-3 rounded-lg bg-space-800 border border-space-600">
                          <p className="text-xs text-gray-400 mb-1">LUMO能级</p>
                          <p className="font-mono text-lg text-purple-400">
                            {formatNumber(calculationResult.lumoEnergy)} eV
                          </p>
                        </div>
                      )}
                      {calculationResult.conductivity !== undefined && (
                        <div className="p-3 rounded-lg bg-space-800 border border-space-600">
                          <p className="text-xs text-gray-400 mb-1">电导率</p>
                          <p className="font-mono text-lg text-green-400">
                            {formatScientific(calculationResult.conductivity)} S/m
                          </p>
                        </div>
                      )}
                      {calculationResult.elasticity !== undefined && (
                        <div className="p-3 rounded-lg bg-space-800 border border-space-600">
                          <p className="text-xs text-gray-400 mb-1">弹性模量</p>
                          <p className="font-mono text-lg text-yellow-400">
                            {formatNumber(calculationResult.elasticity)} GPa
                          </p>
                        </div>
                      )}
                      {calculationResult.hydrogenBonds !== undefined && (
                        <div className="p-3 rounded-lg bg-space-800 border border-space-600">
                          <p className="text-xs text-gray-400 mb-1">氢键数目</p>
                          <p className="font-mono text-lg text-cyan-400">
                            {calculationResult.hydrogenBonds}
                          </p>
                        </div>
                      )}
                      {calculationResult.hydrophobicContacts !== undefined && (
                        <div className="p-3 rounded-lg bg-space-800 border border-space-600">
                          <p className="text-xs text-gray-400 mb-1">疏水相互作用</p>
                          <p className="font-mono text-lg text-orange-400">
                            {calculationResult.hydrophobicContacts}
                          </p>
                        </div>
                      )}
                    </div>

                    {propertyRadarData.length > 0 && (
                      <div style={{ height: 250 }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <RadarChart data={propertyRadarData}>
                            <PolarGrid stroke="#1E3A5F" />
                            <PolarAngleAxis dataKey="subject" tick={{ fill: '#94A3B8', fontSize: 10 }} />
                            <PolarRadiusAxis angle={30} domain={[0, 'dataMax']} tick={{ fill: '#64748B', fontSize: 8 }} />
                            <Radar name="性质" dataKey="A" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.5} />
                            <Tooltip 
                              contentStyle={{ 
                                backgroundColor: '#0F1F38', 
                                border: '1px solid #1E3A5F',
                                borderRadius: '8px',
                              }}
                            />
                          </RadarChart>
                        </ResponsiveContainer>
                      </div>
                    )}

                    {orbitalData.length > 0 && (
                      <div>
                        <p className="text-xs text-gray-400 mb-2">分子轨道能级图</p>
                        <div style={{ height: 150 }}>
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={orbitalData}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#1E3A5F" />
                              <XAxis dataKey="name" stroke="#64748B" fontSize={10} />
                              <YAxis stroke="#64748B" fontSize={10} unit=" eV" />
                              <Tooltip 
                                contentStyle={{ 
                                  backgroundColor: '#0F1F38', 
                                  border: '1px solid #1E3A5F',
                                  borderRadius: '8px',
                                }}
                              />
                              <Bar dataKey="energy" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        <div className="rounded-xl overflow-hidden border border-space-700">
          <button
            onClick={() => toggleSection('composition')}
            className="w-full flex items-center justify-between p-3 bg-space-700/50 hover:bg-space-700 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Atom size={16} className="text-yellow-400" />
              <span className="font-semibold text-white text-sm">分子组成</span>
            </div>
            {expandedSection === 'composition' ? (
              <ChevronUp size={16} className="text-gray-400" />
            ) : (
              <ChevronDown size={16} className="text-gray-400" />
            )}
          </button>
          
          <AnimatePresence>
            {expandedSection === 'composition' && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="p-3 bg-space-900/50">
                  {currentMolecule && (
                    <>
                      <div className="flex flex-wrap gap-2 mb-3">
                        {atomComposition.map((item) => (
                          <div
                            key={item.element}
                            className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-space-700/50"
                          >
                            <div
                              className="w-3 h-3 rounded-full border border-white/20"
                              style={{ backgroundColor: item.color }}
                            />
                            <span className="text-xs text-white">{item.element}</span>
                            <span className="text-xs text-gray-400">{item.count}</span>
                            <span className="text-xs text-gray-500">({item.percentage}%)</span>
                          </div>
                        ))}
                      </div>
                      <div className="h-3 rounded-full bg-space-700 overflow-hidden flex">
                        {atomComposition.map((item, i) => (
                          <motion.div
                            key={item.element}
                            initial={{ width: 0 }}
                            animate={{ width: `${item.percentage}%` }}
                            transition={{ delay: i * 0.05, duration: 0.5 }}
                            style={{ backgroundColor: item.color }}
                            className="h-full"
                          />
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
