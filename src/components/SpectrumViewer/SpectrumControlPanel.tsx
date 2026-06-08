import { motion } from 'framer-motion';
import { Settings, RotateCcw, Play, BarChart3, Activity, Microwave, Radio, Sun } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { SpectrumType, SpectrumParameters } from '../../types';

const SPECTRUM_TYPE_INFO: Record<SpectrumType, {
  label: string;
  icon: React.ReactNode;
  color: string;
  description: string;
}> = {
  ir: {
    label: '红外光谱',
    icon: <Microwave size={16} />,
    color: 'rose',
    description: '分析官能团和化学键',
  },
  nmr_1h: {
    label: '¹H NMR',
    icon: <Radio size={16} />,
    color: 'blue',
    description: '氢原子化学环境分析',
  },
  nmr_13c: {
    label: '¹³C NMR',
    icon: <BarChart3 size={16} />,
    color: 'emerald',
    description: '碳原子骨架分析',
  },
  uv_vis: {
    label: '紫外-可见',
    icon: <Sun size={16} />,
    color: 'purple',
    description: '电子跃迁和共轭体系',
  },
};

const NMR_SOLVENTS = ['CDCl3', 'DMSO-d6', 'CD3OD', 'D2O', 'C6D6', 'CD3CN', 'Acetone-d6'];
const UV_SOLVENTS = ['MeOH', 'EtOH', 'H2O', 'CH3CN', 'CH2Cl2', 'Hexane', 'THF'];

const colorClasses: Record<string, { bg: string; text: string; border: string; hover: string }> = {
  rose: { bg: 'bg-rose-500/20', text: 'text-rose-400', border: 'border-rose-500/30', hover: 'hover:bg-rose-500/30' },
  blue: { bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/30', hover: 'hover:bg-blue-500/30' },
  emerald: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500/30', hover: 'hover:bg-emerald-500/30' },
  purple: { bg: 'bg-purple-500/20', text: 'text-purple-400', border: 'border-purple-500/30', hover: 'hover:bg-purple-500/30' },
};

export function SpectrumControlPanel() {
  const {
    spectrumSimulation,
    spectrumParameters,
    selectedSpectrumMolecule,
    currentMolecule,
    toggleSpectrumType,
    setSpectrumParameters,
    startSpectrumSimulation,
    resetSpectrumSimulation,
    setSelectedSpectrumMolecule,
    simulateAllSpectra,
    setAllSpectrumResults,
    setSpectrumError,
    completeSpectrumSimulation,
  } = useStore();

  const handleStartSimulation = async () => {
    if (!selectedSpectrumMolecule || spectrumSimulation.selectedSpectrumTypes.length === 0) return;

    startSpectrumSimulation();

    try {
      const results = await simulateAllSpectra(
        selectedSpectrumMolecule,
        spectrumSimulation.selectedSpectrumTypes,
        spectrumParameters
      );
      setAllSpectrumResults(results);
      completeSpectrumSimulation();
    } catch (error) {
      setSpectrumError(error instanceof Error ? error.message : '模拟失败');
    }
  };

  const handleUseCurrentMolecule = () => {
    if (currentMolecule) {
      setSelectedSpectrumMolecule(currentMolecule);
    }
  };

  const handleReset = () => {
    resetSpectrumSimulation();
  };

  const updateParams = <K extends keyof SpectrumParameters>(
    type: K,
    params: Partial<SpectrumParameters[K]>
  ) => {
    setSpectrumParameters({
      [type]: {
        ...spectrumParameters[type],
        ...params,
      },
    } as Partial<SpectrumParameters>);
  };

  return (
    <div className="h-full flex flex-col bg-space-800/50 backdrop-blur-md border-r border-space-700">
      <div className="p-4 border-b border-space-700">
        <h3 className="font-display font-semibold text-white flex items-center gap-2">
          <Settings size={18} className="text-quantum-cyan" />
          光谱参数
        </h3>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-300">选择分子</h4>
          {selectedSpectrumMolecule ? (
            <div className="p-3 bg-space-700/50 rounded-xl border border-space-600">
              <p className="text-sm font-medium text-white">{selectedSpectrumMolecule.name}</p>
              <p className="text-xs text-gray-500 font-mono mt-1">
                {selectedSpectrumMolecule.formula} · {selectedSpectrumMolecule.atoms.length} 原子
              </p>
            </div>
          ) : (
            <p className="text-sm text-gray-500">未选择分子</p>
          )}
          
          {currentMolecule && selectedSpectrumMolecule?.id !== currentMolecule.id && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleUseCurrentMolecule}
              className="w-full py-2 px-3 bg-quantum-blue/20 text-quantum-blue rounded-lg border border-quantum-blue/30 hover:bg-quantum-blue/30 transition-all text-sm font-medium"
            >
              使用当前分子
            </motion.button>
          )}
        </div>

        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-300">光谱类型</h4>
          <div className="grid grid-cols-2 gap-2">
            {(Object.keys(SPECTRUM_TYPE_INFO) as SpectrumType[]).map((type) => {
              const info = SPECTRUM_TYPE_INFO[type];
              const isSelected = spectrumSimulation.selectedSpectrumTypes.includes(type);
              const colors = colorClasses[info.color];

              return (
                <motion.button
                  key={type}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => toggleSpectrumType(type)}
                  className={`p-3 rounded-xl border transition-all text-left ${
                    isSelected
                      ? `${colors.bg} ${colors.border} ${colors.text}`
                      : 'bg-space-700/30 border-space-600 text-gray-400 hover:bg-space-700/50'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    {info.icon}
                    <span className="text-sm font-medium">{info.label}</span>
                  </div>
                  <p className="text-[10px] opacity-70">{info.description}</p>
                </motion.button>
              );
            })}
          </div>
        </div>

        {spectrumSimulation.selectedSpectrumTypes.includes('ir') && (
          <div className="space-y-3 p-3 bg-space-700/30 rounded-xl border border-space-600">
            <h5 className="text-xs font-medium text-rose-400 flex items-center gap-2">
              <Microwave size={14} />
              红外光谱参数
            </h5>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-400 block mb-1">分辨率 (cm⁻¹)</label>
                <input
                  type="number"
                  value={spectrumParameters.ir.resolution}
                  onChange={(e) => updateParams('ir', { resolution: Number(e.target.value) })}
                  min="1"
                  max="16"
                  step="1"
                  className="w-full px-3 py-2 bg-space-800 border border-space-600 rounded-lg text-sm text-white focus:outline-none focus:border-rose-500/50"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">基线噪声</label>
                <input
                  type="number"
                  value={spectrumParameters.ir.baseline}
                  onChange={(e) => updateParams('ir', { baseline: Number(e.target.value) })}
                  min="0"
                  max="0.2"
                  step="0.01"
                  className="w-full px-3 py-2 bg-space-800 border border-space-600 rounded-lg text-sm text-white focus:outline-none focus:border-rose-500/50"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">峰宽 (cm⁻¹)</label>
                <input
                  type="number"
                  value={spectrumParameters.ir.peakWidth}
                  onChange={(e) => updateParams('ir', { peakWidth: Number(e.target.value) })}
                  min="5"
                  max="50"
                  step="1"
                  className="w-full px-3 py-2 bg-space-800 border border-space-600 rounded-lg text-sm text-white focus:outline-none focus:border-rose-500/50"
                />
              </div>
            </div>
          </div>
        )}

        {spectrumSimulation.selectedSpectrumTypes.includes('nmr_1h') && (
          <div className="space-y-3 p-3 bg-space-700/30 rounded-xl border border-space-600">
            <h5 className="text-xs font-medium text-blue-400 flex items-center gap-2">
              <Radio size={14} />
              ¹H NMR 参数
            </h5>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-400 block mb-1">频率 (MHz)</label>
                <select
                  value={spectrumParameters.nmr_1h.frequency}
                  onChange={(e) => updateParams('nmr_1h', { frequency: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-space-800 border border-space-600 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500/50"
                >
                  <option value={60}>60 MHz</option>
                  <option value={90}>90 MHz</option>
                  <option value={200}>200 MHz</option>
                  <option value={300}>300 MHz</option>
                  <option value={400}>400 MHz</option>
                  <option value={500}>500 MHz</option>
                  <option value={600}>600 MHz</option>
                  <option value={800}>800 MHz</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">溶剂</label>
                <select
                  value={spectrumParameters.nmr_1h.solvent}
                  onChange={(e) => updateParams('nmr_1h', { solvent: e.target.value })}
                  className="w-full px-3 py-2 bg-space-800 border border-space-600 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500/50"
                >
                  {NMR_SOLVENTS.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">温度 (K)</label>
                <input
                  type="number"
                  value={spectrumParameters.nmr_1h.temperature}
                  onChange={(e) => updateParams('nmr_1h', { temperature: Number(e.target.value) })}
                  min="200"
                  max="400"
                  step="1"
                  className="w-full px-3 py-2 bg-space-800 border border-space-600 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500/50"
                />
              </div>
            </div>
          </div>
        )}

        {spectrumSimulation.selectedSpectrumTypes.includes('nmr_13c') && (
          <div className="space-y-3 p-3 bg-space-700/30 rounded-xl border border-space-600">
            <h5 className="text-xs font-medium text-emerald-400 flex items-center gap-2">
              <BarChart3 size={14} />
              ¹³C NMR 参数
            </h5>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-400 block mb-1">频率 (MHz)</label>
                <select
                  value={spectrumParameters.nmr_13c.frequency}
                  onChange={(e) => updateParams('nmr_13c', { frequency: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-space-800 border border-space-600 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500/50"
                >
                  <option value={25}>25 MHz</option>
                  <option value={50}>50 MHz</option>
                  <option value={75}>75 MHz</option>
                  <option value={100}>100 MHz</option>
                  <option value={125}>125 MHz</option>
                  <option value={150}>150 MHz</option>
                  <option value={200}>200 MHz</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">溶剂</label>
                <select
                  value={spectrumParameters.nmr_13c.solvent}
                  onChange={(e) => updateParams('nmr_13c', { solvent: e.target.value })}
                  className="w-full px-3 py-2 bg-space-800 border border-space-600 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500/50"
                >
                  {NMR_SOLVENTS.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center justify-between">
                <label className="text-xs text-gray-400">质子去耦</label>
                <button
                  onClick={() => updateParams('nmr_13c', { decoupled: !spectrumParameters.nmr_13c.decoupled })}
                  className={`relative w-10 h-5 rounded-full transition-colors ${
                    spectrumParameters.nmr_13c.decoupled ? 'bg-emerald-500' : 'bg-space-600'
                  }`}
                >
                  <motion.div
                    animate={{ x: spectrumParameters.nmr_13c.decoupled ? 20 : 2 }}
                    className="absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-md"
                  />
                </button>
              </div>
            </div>
          </div>
        )}

        {spectrumSimulation.selectedSpectrumTypes.includes('uv_vis') && (
          <div className="space-y-3 p-3 bg-space-700/30 rounded-xl border border-space-600">
            <h5 className="text-xs font-medium text-purple-400 flex items-center gap-2">
              <Sun size={14} />
              紫外-可见参数
            </h5>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-400 block mb-1">分辨率 (nm)</label>
                <input
                  type="number"
                  value={spectrumParameters.uv_vis.resolution}
                  onChange={(e) => updateParams('uv_vis', { resolution: Number(e.target.value) })}
                  min="1"
                  max="10"
                  step="0.5"
                  className="w-full px-3 py-2 bg-space-800 border border-space-600 rounded-lg text-sm text-white focus:outline-none focus:border-purple-500/50"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">溶剂</label>
                <select
                  value={spectrumParameters.uv_vis.solvent}
                  onChange={(e) => updateParams('uv_vis', { solvent: e.target.value })}
                  className="w-full px-3 py-2 bg-space-800 border border-space-600 rounded-lg text-sm text-white focus:outline-none focus:border-purple-500/50"
                >
                  {UV_SOLVENTS.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">样品池长度 (cm)</label>
                <input
                  type="number"
                  value={spectrumParameters.uv_vis.pathLength}
                  onChange={(e) => updateParams('uv_vis', { pathLength: Number(e.target.value) })}
                  min="0.1"
                  max="10"
                  step="0.1"
                  className="w-full px-3 py-2 bg-space-800 border border-space-600 rounded-lg text-sm text-white focus:outline-none focus:border-purple-500/50"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">浓度 (mol/L)</label>
                <input
                  type="number"
                  value={spectrumParameters.uv_vis.concentration}
                  onChange={(e) => updateParams('uv_vis', { concentration: Number(e.target.value) })}
                  min="1e-7"
                  max="1"
                  step="1e-6"
                  className="w-full px-3 py-2 bg-space-800 border border-space-600 rounded-lg text-sm text-white focus:outline-none focus:border-purple-500/50"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-space-700 space-y-2">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleStartSimulation}
          disabled={!selectedSpectrumMolecule || spectrumSimulation.selectedSpectrumTypes.length === 0 || spectrumSimulation.isSimulating}
          className={`w-full py-3 px-4 rounded-xl font-medium flex items-center justify-center gap-2 transition-all ${
            !selectedSpectrumMolecule || spectrumSimulation.selectedSpectrumTypes.length === 0 || spectrumSimulation.isSimulating
              ? 'bg-space-700 text-gray-500 cursor-not-allowed'
              : 'bg-gradient-to-r from-quantum-blue to-quantum-purple text-white shadow-glow hover:shadow-glow-lg'
          }`}
        >
          {spectrumSimulation.isSimulating ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              模拟中...
            </>
          ) : (
            <>
              <Play size={18} />
              开始模拟
            </>
          )}
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleReset}
          className="w-full py-2 px-4 bg-space-700/50 text-gray-400 rounded-xl hover:bg-space-700 transition-all text-sm flex items-center justify-center gap-2"
        >
          <RotateCcw size={16} />
          重置
        </motion.button>
      </div>
    </div>
  );
}
