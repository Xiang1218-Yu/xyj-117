import { motion, AnimatePresence } from 'framer-motion';
import { Info, X, Microwave, Radio, BarChart3, Sun, Download } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { SpectrumResult, IRSpectrum, NMRSpectrum, UVViSpectrum, SpectrumType } from '../../types';

const SPECTRUM_TITLES: Record<SpectrumType, { label: string; icon: React.ReactNode; color: string }> = {
  ir: { label: '红外光谱 (IR)', icon: <Microwave size={16} />, color: 'rose' },
  nmr_1h: { label: '¹H 核磁共振', icon: <Radio size={16} />, color: 'blue' },
  nmr_13c: { label: '¹³C 核磁共振', icon: <BarChart3 size={16} />, color: 'emerald' },
  uv_vis: { label: '紫外-可见光谱', icon: <Sun size={16} />, color: 'purple' },
};

const colorText: Record<string, string> = {
  rose: 'text-rose-400',
  blue: 'text-blue-400',
  emerald: 'text-emerald-400',
  purple: 'text-purple-400',
};

const colorBg: Record<string, string> = {
  rose: 'bg-rose-500/10',
  blue: 'bg-blue-500/10',
  emerald: 'bg-emerald-500/10',
  purple: 'bg-purple-500/10',
};

const colorBorder: Record<string, string> = {
  rose: 'border-rose-500/30',
  blue: 'border-blue-500/30',
  emerald: 'border-emerald-500/30',
  purple: 'border-purple-500/30',
};

interface SpectrumResultPanelProps {
  spectrum: SpectrumResult;
  onClose?: () => void;
}

function IRResultDetails({ spectrum }: { spectrum: IRSpectrum }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 bg-space-700/50 rounded-lg">
          <p className="text-xs text-gray-500">波数范围</p>
          <p className="text-sm font-medium text-white">
            {spectrum.wavelengthRange.max} - {spectrum.wavelengthRange.min} cm⁻¹
          </p>
        </div>
        <div className="p-3 bg-space-700/50 rounded-lg">
          <p className="text-xs text-gray-500">分辨率</p>
          <p className="text-sm font-medium text-white">{spectrum.resolution} cm⁻¹</p>
        </div>
      </div>

      <div>
        <h5 className="text-sm font-medium text-white mb-2 flex items-center gap-2">
          <Info size={14} className="text-rose-400" />
          识别的官能团
        </h5>
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {spectrum.functionalGroups.map((group, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-white">{group.name}</span>
                <span className="text-xs text-rose-400 font-mono">
                  {group.wavelength.toFixed(0)} cm⁻¹
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  group.intensity.includes('强') 
                    ? 'bg-rose-500/20 text-rose-400' 
                    : group.intensity.includes('中')
                    ? 'bg-yellow-500/20 text-yellow-400'
                    : 'bg-gray-500/20 text-gray-400'
                }`}>
                  强度: {group.intensity}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">{group.description}</p>
            </motion.div>
          ))}
          {spectrum.functionalGroups.length === 0 && (
            <p className="text-sm text-gray-500 text-center py-4">未识别到特征官能团</p>
          )}
        </div>
      </div>
    </div>
  );
}

function NMRResultDetails({ spectrum }: { spectrum: NMRSpectrum }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <div className="p-3 bg-space-700/50 rounded-lg">
          <p className="text-xs text-gray-500">频率</p>
          <p className="text-sm font-medium text-white">{spectrum.frequency} MHz</p>
        </div>
        <div className="p-3 bg-space-700/50 rounded-lg">
          <p className="text-xs text-gray-500">溶剂</p>
          <p className="text-sm font-medium text-white">{spectrum.solvent}</p>
        </div>
        <div className="p-3 bg-space-700/50 rounded-lg">
          <p className="text-xs text-gray-500">温度</p>
          <p className="text-sm font-medium text-white">{spectrum.temperature} K</p>
        </div>
      </div>

      <div>
        <h5 className="text-sm font-medium text-white mb-2 flex items-center gap-2">
          <Info size={14} className={spectrum.type === 'nmr_1h' ? 'text-blue-400' : 'text-emerald-400'} />
          信号指认 ({spectrum.assignments.length} 个信号)
        </h5>
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {spectrum.assignments.map((assignment, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`p-3 ${
                spectrum.type === 'nmr_1h' ? 'bg-blue-500/10 border-blue-500/20' : 'bg-emerald-500/10 border-emerald-500/20'
              } border rounded-lg`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className={`text-lg font-mono font-bold ${
                  spectrum.type === 'nmr_1h' ? 'text-blue-400' : 'text-emerald-400'
                }`}>
                  δ {assignment.shift.toFixed(spectrum.type === 'nmr_1h' ? 2 : 1)}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-space-700 text-gray-300">
                    {assignment.multiplicity}
                  </span>
                  {assignment.coupling && (
                    <span className="text-xs text-gray-400">
                      J = {assignment.coupling.toFixed(1)} Hz
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-400">
                  积分: {assignment.integration.toFixed(1)}H
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">{assignment.assignment}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

function UVVisResultDetails({ spectrum }: { spectrum: UVViSpectrum }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 bg-space-700/50 rounded-lg">
          <p className="text-xs text-gray-500">波长范围</p>
          <p className="text-sm font-medium text-white">
            {spectrum.wavelengthRange.min} - {spectrum.wavelengthRange.max} nm
          </p>
        </div>
        <div className="p-3 bg-space-700/50 rounded-lg">
          <p className="text-xs text-gray-500">溶剂</p>
          <p className="text-sm font-medium text-white">{spectrum.solvent}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 bg-space-700/50 rounded-lg">
          <p className="text-xs text-gray-500">样品池长度</p>
          <p className="text-sm font-medium text-white">{spectrum.pathLength} cm</p>
        </div>
        <div className="p-3 bg-space-700/50 rounded-lg">
          <p className="text-xs text-gray-500">浓度</p>
          <p className="text-sm font-medium text-white">{spectrum.concentration.toExponential(1)} M</p>
        </div>
      </div>

      <div>
        <h5 className="text-sm font-medium text-white mb-2 flex items-center gap-2">
          <Info size={14} className="text-purple-400" />
          电子跃迁 ({spectrum.molarAbsorptivity.length} 个)
        </h5>
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {spectrum.molarAbsorptivity.map((transition, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-purple-400">
                  λ<sub>max</sub> = {transition.wavelength.toFixed(0)} nm
                </span>
                <span className="text-xs font-mono text-white">
                  ε = {transition.epsilon.toExponential(2)}
                </span>
              </div>
              {transition.transition && (
                <p className="text-xs text-gray-500">{transition.transition}</p>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function SpectrumResultPanel({ spectrum, onClose }: SpectrumResultPanelProps) {
  const { spectrumSimulation, setSelectedSpectrumPeak, selectedSpectrumMolecule } = useStore();
  const titleInfo = SPECTRUM_TITLES[spectrum.type];

  const handleExport = () => {
    if (!selectedSpectrumMolecule) return;
    
    const data = {
      molecule: selectedSpectrumMolecule.name,
      formula: selectedSpectrumMolecule.formula,
      spectrumType: spectrum.type,
      spectrum: spectrum,
      exportedAt: new Date().toISOString(),
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedSpectrumMolecule.name}_${spectrum.type}_spectrum.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 300 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 300 }}
      className="h-full flex flex-col bg-space-800/50 backdrop-blur-md border-l border-space-700"
    >
      <div className={`p-4 border-b border-space-700 ${colorBg[spectrum.type]}`}>
        <div className="flex items-center justify-between">
          <h3 className={`font-display font-semibold flex items-center gap-2 ${colorText[spectrum.type]}`}>
            {titleInfo.icon}
            {titleInfo.label}
          </h3>
          <div className="flex items-center gap-1">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleExport}
              className="p-1.5 rounded-lg bg-space-700/50 text-gray-400 hover:text-white hover:bg-space-600 transition-colors"
              title="导出数据"
            >
              <Download size={14} />
            </motion.button>
            {onClose && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onClose}
                className="p-1.5 rounded-lg bg-space-700/50 text-gray-400 hover:text-white hover:bg-space-600 transition-colors"
              >
                <X size={14} />
              </motion.button>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {spectrum.type === 'ir' && <IRResultDetails spectrum={spectrum} />}
        {(spectrum.type === 'nmr_1h' || spectrum.type === 'nmr_13c') && (
          <NMRResultDetails spectrum={spectrum} />
        )}
        {spectrum.type === 'uv_vis' && <UVVisResultDetails spectrum={spectrum} />}

        {spectrumSimulation.selectedPeak && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mt-4 p-3 rounded-xl border ${
              colorBorder[spectrum.type]
            } ${colorBg[spectrum.type]}`}
          >
            <h5 className={`text-sm font-medium mb-2 ${colorText[spectrum.type]}`}>选中的峰</h5>
            <div className="space-y-1">
              <p className="text-sm text-white">
                <span className="text-gray-500">位置: </span>
                {spectrumSimulation.selectedPeak.wavelength.toFixed(2)}
                {spectrum.type === 'ir' ? ' cm⁻¹' : spectrum.type === 'uv_vis' ? ' nm' : ' ppm'}
              </p>
              <p className="text-sm text-white">
                <span className="text-gray-500">强度: </span>
                {(spectrumSimulation.selectedPeak.intensity * 100).toFixed(1)}%
              </p>
              {spectrumSimulation.selectedPeak.label && (
                <p className="text-sm text-white">
                  <span className="text-gray-500">标记: </span>
                  {spectrumSimulation.selectedPeak.label}
                </p>
              )}
              {spectrumSimulation.selectedPeak.assignment && (
                <p className="text-sm text-white">
                  <span className="text-gray-500">归属: </span>
                  {spectrumSimulation.selectedPeak.assignment}
                </p>
              )}
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setSelectedSpectrumPeak(null)}
              className="mt-2 text-xs text-gray-400 hover:text-white transition-colors"
            >
              清除选择
            </motion.button>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
