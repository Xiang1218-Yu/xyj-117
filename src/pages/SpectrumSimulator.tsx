import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Atom, Home, Microwave, Radio, BarChart3, Sun, AlertCircle, Activity } from 'lucide-react';
import { useStore } from '../store/useStore';
import { SpectrumControlPanel } from '../components/SpectrumViewer/SpectrumControlPanel';
import { SpectrumChart } from '../components/SpectrumViewer/SpectrumChart';
import { SpectrumResultPanel } from '../components/SpectrumViewer/SpectrumResultPanel';
import { SpectrumType, SpectrumResult } from '../types';

const SPECTRUM_TAB_INFO: Record<SpectrumType, {
  label: string;
  icon: React.ReactNode;
  color: string;
}> = {
  ir: { label: '红外', icon: <Microwave size={16} />, color: 'rose' },
  nmr_1h: { label: '¹H NMR', icon: <Radio size={16} />, color: 'blue' },
  nmr_13c: { label: '¹³C NMR', icon: <BarChart3 size={16} />, color: 'emerald' },
  uv_vis: { label: 'UV-Vis', icon: <Sun size={16} />, color: 'purple' },
};

const tabColorClasses: Record<string, { active: string; inactive: string; gradient: string }> = {
  rose: {
    active: 'text-rose-400 bg-rose-500/20 border-rose-500/50',
    inactive: 'text-gray-400 hover:text-rose-400 hover:bg-rose-500/10',
    gradient: 'from-rose-500 to-orange-500',
  },
  blue: {
    active: 'text-blue-400 bg-blue-500/20 border-blue-500/50',
    inactive: 'text-gray-400 hover:text-blue-400 hover:bg-blue-500/10',
    gradient: 'from-blue-500 to-cyan-500',
  },
  emerald: {
    active: 'text-emerald-400 bg-emerald-500/20 border-emerald-500/50',
    inactive: 'text-gray-400 hover:text-emerald-400 hover:bg-emerald-500/10',
    gradient: 'from-emerald-500 to-teal-500',
  },
  purple: {
    active: 'text-purple-400 bg-purple-500/20 border-purple-500/50',
    inactive: 'text-gray-400 hover:text-purple-400 hover:bg-purple-500/10',
    gradient: 'from-purple-500 to-pink-500',
  },
};

export default function SpectrumSimulator() {
  const {
    spectrumSimulation,
    selectedSpectrumMolecule,
    setSelectedSpectrumPeak,
  } = useStore();

  const [activeTab, setActiveTab] = useState<SpectrumType>('ir');
  const [showResultPanel, setShowResultPanel] = useState(true);

  useEffect(() => {
    const availableTypes = Object.keys(spectrumSimulation.results) as SpectrumType[];
    if (availableTypes.length > 0 && !availableTypes.includes(activeTab)) {
      setActiveTab(availableTypes[0]);
    }
  }, [spectrumSimulation.results, activeTab]);

  const availableSpectra = spectrumSimulation.selectedSpectrumTypes.filter(
    type => spectrumSimulation.results[type]
  );

  const currentSpectrum = spectrumSimulation.results[activeTab] as SpectrumResult | undefined;

  return (
    <div className="w-full h-full flex flex-col bg-space-900 overflow-hidden">
      <header className="h-14 bg-space-800/90 backdrop-blur-xl border-b border-space-700 flex items-center justify-between px-4 z-50">
        <div className="flex items-center gap-4">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => window.location.href = '/'}
            className="p-2 rounded-lg bg-space-700 text-gray-400 hover:text-white hover:bg-space-600 transition-all"
            title="返回主页"
          >
            <Home size={18} />
          </motion.button>
          
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-quantum-purple to-quantum-pink flex items-center justify-center shadow-glow">
              <Activity size={20} className="text-white" />
            </div>
            <div>
              <h1 className="font-display font-bold text-lg bg-gradient-to-r from-quantum-purple via-quantum-pink to-rose-400 bg-clip-text text-transparent">
                分子光谱模拟器
              </h1>
              <p className="text-[10px] text-gray-500 font-mono -mt-1">IR · NMR · UV-Vis</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {selectedSpectrumMolecule && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3 px-4 py-2 bg-space-700/50 rounded-xl border border-space-600"
            >
              <Atom size={14} className="text-quantum-cyan" />
              <div className="text-left">
                <p className="text-sm font-semibold text-white">{selectedSpectrumMolecule.name}</p>
                <p className="text-[10px] text-gray-500 font-mono">
                  {selectedSpectrumMolecule.formula}
                </p>
              </div>
            </motion.div>
          )}

          {spectrumSimulation.simulatedAt && (
            <div className="text-xs text-gray-500 font-mono">
              模拟完成于 {spectrumSimulation.simulatedAt.toLocaleTimeString()}
            </div>
          )}
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <div className="w-72 flex-shrink-0 z-20">
          <SpectrumControlPanel />
        </div>

        <div className="flex-1 flex flex-col relative overflow-hidden">
          {availableSpectra.length > 0 && (
            <div className="h-12 border-b border-space-700 flex items-center gap-1 px-4 bg-space-800/50">
              {availableSpectra.map((type) => {
                const info = SPECTRUM_TAB_INFO[type];
                const colors = tabColorClasses[info.color];
                const isActive = activeTab === type;

                return (
                  <motion.button
                    key={type}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setActiveTab(type)}
                    className={`flex items-center gap-2 px-4 py-1.5 rounded-lg border transition-all text-sm font-medium ${
                      isActive ? colors.active : colors.inactive + ' border-transparent'
                    }`}
                  >
                    {info.icon}
                    {info.label}
                  </motion.button>
                );
              })}
            </div>
          )}

          <div className="flex-1 relative overflow-hidden">
            <AnimatePresence mode="wait">
              {spectrumSimulation.isSimulating ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 flex flex-col items-center justify-center"
                >
                  <div className="relative">
                    <div className="w-20 h-20 border-4 border-space-700 border-t-quantum-purple rounded-full animate-spin" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Atom size={32} className="text-quantum-purple animate-pulse" />
                    </div>
                  </div>
                  <p className="mt-6 text-lg font-medium text-white">正在模拟光谱数据...</p>
                  <p className="text-sm text-gray-500 mt-2">
                    分析分子结构和化学键信息
                  </p>
                </motion.div>
              ) : spectrumSimulation.error ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 flex flex-col items-center justify-center"
                >
                  <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mb-4">
                    <AlertCircle size={32} className="text-red-400" />
                  </div>
                  <p className="text-lg font-medium text-white mb-2">模拟失败</p>
                  <p className="text-sm text-red-400">{spectrumSimulation.error}</p>
                </motion.div>
              ) : currentSpectrum ? (
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="absolute inset-0"
                >
                  <SpectrumChart
                    spectrum={currentSpectrum}
                    onPeakClick={setSelectedSpectrumPeak}
                    selectedPeak={spectrumSimulation.selectedPeak}
                  />
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 flex flex-col items-center justify-center"
                >
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-quantum-purple/20 to-quantum-pink/20 flex items-center justify-center mb-6">
                    <Activity size={48} className="text-quantum-purple/50" />
                  </div>
                  <h3 className="text-xl font-display font-semibold text-white mb-2">
                    开始光谱模拟
                  </h3>
                  <p className="text-sm text-gray-500 max-w-md text-center mb-6">
                    从左侧面板选择分子和光谱类型，调整参数后点击"开始模拟"按钮
                  </p>
                  <div className="flex gap-8">
                    {(['ir', 'nmr_1h', 'nmr_13c', 'uv_vis'] as SpectrumType[]).map((type) => {
                      const info = SPECTRUM_TAB_INFO[type];
                      const colors = tabColorClasses[info.color];
                      return (
                        <div
                          key={type}
                          className="flex flex-col items-center gap-2"
                        >
                          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colors.gradient} flex items-center justify-center shadow-lg opacity-50`}>
                            {React.cloneElement(info.icon as React.ReactElement, { className: 'text-white', size: 24 })}
                          </div>
                          <span className="text-xs text-gray-500">{info.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {spectrumSimulation.simulatedAt && Object.keys(spectrumSimulation.results).length > 0 && (
            <div className="h-10 border-t border-space-700 flex items-center justify-between px-4 bg-space-800/50">
              <div className="flex items-center gap-4">
                <span className="text-xs text-gray-500">
                  已生成 {Object.keys(spectrumSimulation.results).length} 种光谱数据
                </span>
                {spectrumSimulation.selectedPeak && (
                  <span className="text-xs text-quantum-cyan">
                    已选中峰: {spectrumSimulation.selectedPeak.wavelength.toFixed(2)}
                  </span>
                )}
              </div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowResultPanel(!showResultPanel)}
                className={`text-xs px-3 py-1 rounded-lg transition-all ${
                  showResultPanel
                    ? 'bg-quantum-purple/20 text-quantum-purple border border-quantum-purple/30'
                    : 'bg-space-700 text-gray-400 hover:text-white'
                }`}
              >
                {showResultPanel ? '隐藏详情' : '显示详情'}
              </motion.button>
            </div>
          )}
        </div>

        <AnimatePresence>
          {showResultPanel && currentSpectrum && (
            <div className="w-72 flex-shrink-0 z-20">
              <SpectrumResultPanel
                spectrum={currentSpectrum}
                onClose={() => setShowResultPanel(false)}
              />
            </div>
          )}
        </AnimatePresence>
      </div>

      <footer className="h-7 bg-space-800/90 backdrop-blur-xl border-t border-space-700 flex items-center justify-between px-4 text-[10px] text-gray-500 font-mono z-50">
        <div className="flex items-center gap-4">
          <span>Spectrum Simulator</span>
          {selectedSpectrumMolecule && (
            <span className="text-quantum-purple">
              {selectedSpectrumMolecule.name}
            </span>
          )}
        </div>
        <div className="flex items-center gap-4">
          <span>基于半经验方法模拟</span>
          <span>仅供研究参考</span>
        </div>
      </footer>
    </div>
  );
}
