import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Thermometer, 
  Clock, 
  Settings,
  Dna,
  Pill,
  Layers,
  Zap,
  ChevronDown,
  ChevronUp,
  Atom,
  Box,
  Grid3X3,
  Sparkles,
  LineChart,
  Cylinder,
  Cloud
} from 'lucide-react';
import { useStore } from '../../store/useStore';
import { DisplayMode, SimulationType } from '../../types';
import { simulateProteinFolding, simulateDocking, simulateMaterialProperties } from '../../utils/simulationEngine';
import { moleculeLibrary, aspirinMolecule, lysozyme } from '../../data/molecules';
import { PropertyEditor } from '../PropertyEditor/PropertyEditor';
import { DisplayModeConfig } from './DisplayModeConfig';
import { PresetManager } from './PresetManager';

const displayModes: { id: DisplayMode; label: string; icon: any }[] = [
  { id: 'ball_stick', label: '球棍模型', icon: Atom },
  { id: 'space_filling', label: '空间填充', icon: Box },
  { id: 'ribbon', label: '带状图', icon: Grid3X3 },
  { id: 'surface', label: '电子云', icon: Sparkles },
  { id: 'line', label: '线型模型', icon: LineChart },
  { id: 'stick', label: '棍棒模型', icon: Cylinder },
  { id: 'point_cloud', label: '点云模型', icon: Cloud },
];

const simulationTypes: { id: SimulationType; label: string; icon: any; description: string }[] = [
  { 
    id: 'folding', 
    label: '蛋白质折叠', 
    icon: Dna,
    description: '模拟蛋白质从线性链折叠为天然构象的过程'
  },
  { 
    id: 'docking', 
    label: '分子对接', 
    icon: Pill,
    description: '预测药物小分子与靶点蛋白的结合模式和亲和力'
  },
  { 
    id: 'material', 
    label: '材料性质', 
    icon: Layers,
    description: '计算材料的导电性、弹性模量、带隙等性质'
  },
];

const forceFields = ['MMFF94', 'MMFF94s', 'UFF', 'GAFF', 'AMBER'];

export function ControlPanel() {
  const {
    currentMolecule,
    displayMode,
    setDisplayMode,
    showHydrogens,
    toggleHydrogens,
    autoRotate,
    toggleAutoRotate,
    showLabels,
    toggleLabels,
    selectedSimulationType,
    setSimulationType,
    simulation,
    startSimulation,
    stopSimulation,
    resetSimulation,
    setSimulationParameters,
    updateSimulationStep,
    setCalculationResult,
    setCurrentAtoms,
    setLigandMolecule,
    setTargetMolecule,
    ligandMolecule,
    targetMolecule,
    setBackgroundColor,
    backgroundColor,
    showElectronCloud,
    setShowElectronCloud,
    displayConfig,
    setDisplayConfig,
    resetDisplayConfig,
    presets,
    activePresetId,
    savePreset,
    applyPreset,
    deletePreset,
    updatePreset,
  } = useStore();

  const [expandedSection, setExpandedSection] = useState<string | null>('display');
  const [ligandAtoms, setLigandAtoms] = useState<any[] | null>(null);
  const simulationRef = useRef<{ stop: () => void } | null>(null);
  const [ligandSelection, setLigandSelection] = useState(aspirinMolecule.id);
  const [targetSelection, setTargetSelection] = useState(lysozyme.id);

  useEffect(() => {
    if (simulation.isRunning && currentMolecule) {
      const handleStep = (step: number, energy: number, atoms: any[], rmsd?: number, rg?: number) => {
        updateSimulationStep(step, energy, rmsd, rg);
        if (selectedSimulationType !== 'docking') {
          setCurrentAtoms(atoms);
        }
      };

      const handleDockingStep = (step: number, energy: number, atoms: any[], bindingEnergy: number) => {
        updateSimulationStep(step, energy);
        setLigandAtoms(atoms);
      };

      const handleComplete = (result: any) => {
        stopSimulation();
        setCalculationResult(result);
        simulationRef.current = null;
      };

      if (selectedSimulationType === 'folding') {
        simulationRef.current = simulateProteinFolding(
          currentMolecule,
          simulation.parameters,
          handleStep,
          handleComplete
        );
      } else if (selectedSimulationType === 'docking') {
        const ligand = ligandMolecule || moleculeLibrary.find(m => m.id === ligandSelection);
        const target = targetMolecule || currentMolecule;
        if (ligand && target) {
          simulationRef.current = simulateDocking(
            ligand,
            target,
            simulation.parameters,
            handleDockingStep,
            handleComplete
          );
        }
      } else if (selectedSimulationType === 'material') {
        simulationRef.current = simulateMaterialProperties(
          currentMolecule,
          simulation.parameters,
          handleStep,
          handleComplete
        );
      }
    }

    return () => {
      if (simulationRef.current) {
        simulationRef.current.stop();
        simulationRef.current = null;
      }
    };
  }, [simulation.isRunning]);

  const handleStartSimulation = () => {
    if (!currentMolecule || !selectedSimulationType) return;
    
    if (selectedSimulationType === 'docking') {
      const ligand = moleculeLibrary.find(m => m.id === ligandSelection);
      const target = moleculeLibrary.find(m => m.id === targetSelection);
      setLigandMolecule(ligand || null);
      setTargetMolecule(target || null);
    }
    
    startSimulation();
  };

  const handleStopSimulation = () => {
    if (simulationRef.current) {
      simulationRef.current.stop();
      simulationRef.current = null;
    }
    stopSimulation();
  };

  const handleResetSimulation = () => {
    if (simulationRef.current) {
      simulationRef.current.stop();
      simulationRef.current = null;
    }
    resetSimulation();
    setLigandAtoms(null);
    if (currentMolecule) {
      setCurrentAtoms(currentMolecule.atoms);
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const progress = simulation.totalSteps > 0 
    ? (simulation.currentStep / simulation.totalSteps) * 100 
    : 0;

  const bgColors = [
    { color: '#0A1628', label: '深空蓝' },
    { color: '#000000', label: '纯黑' },
    { color: '#1a1a2e', label: '暗紫' },
    { color: '#0d1b2a', label: '深海' },
  ];

  return (
    <div className="h-full flex flex-col bg-space-800/80 backdrop-blur-xl border-l border-space-700">
      <div className="p-4 border-b border-space-700">
        <h2 className="font-display text-xl font-bold bg-gradient-to-r from-quantum-purple to-quantum-cyan bg-clip-text text-transparent">
          控制面板
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto">
        <PropertyEditor />

        <div className="border-b border-space-700">
          <button
            onClick={() => toggleSection('display')}
            className="w-full flex items-center justify-between p-4 hover:bg-space-700/30 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Atom size={18} className="text-quantum-blue" />
              <span className="font-semibold text-white">显示模式</span>
            </div>
            {expandedSection === 'display' ? (
              <ChevronUp size={18} className="text-gray-400" />
            ) : (
              <ChevronDown size={18} className="text-gray-400" />
            )}
          </button>
          
          <AnimatePresence>
            {expandedSection === 'display' && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="p-4 pt-0 space-y-3">
                  <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-1">
                    {displayModes.map(mode => {
                      const Icon = mode.icon;
                      return (
                        <motion.button
                          key={mode.id}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => {
                            setDisplayMode(mode.id);
                            setShowElectronCloud(mode.id === 'surface');
                          }}
                          className={`p-2 rounded-lg flex flex-col items-center gap-1.5 transition-all ${
                            displayMode === mode.id
                              ? 'bg-quantum-blue/20 border border-quantum-blue/50 text-quantum-blue'
                              : 'bg-space-700/50 border border-space-600 text-gray-400 hover:text-white'
                          }`}
                        >
                          <Icon size={18} />
                          <span className="text-[10px] leading-tight text-center">{mode.label}</span>
                        </motion.button>
                      );
                    })}
                  </div>

                  <div className="space-y-2 pt-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-400">显示氢原子</span>
                      <button
                        onClick={toggleHydrogens}
                        className={`w-12 h-6 rounded-full transition-colors ${
                          showHydrogens ? 'bg-quantum-blue' : 'bg-space-600'
                        }`}
                      >
                        <motion.div
                          animate={{ x: showHydrogens ? 24 : 2 }}
                          className="w-5 h-5 bg-white rounded-full shadow-lg"
                        />
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-400">自动旋转</span>
                      <button
                        onClick={toggleAutoRotate}
                        className={`w-12 h-6 rounded-full transition-colors ${
                          autoRotate ? 'bg-quantum-blue' : 'bg-space-600'
                        }`}
                      >
                        <motion.div
                          animate={{ x: autoRotate ? 24 : 2 }}
                          className="w-5 h-5 bg-white rounded-full shadow-lg"
                        />
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-400">显示标签</span>
                      <button
                        onClick={toggleLabels}
                        className={`w-12 h-6 rounded-full transition-colors ${
                          showLabels ? 'bg-quantum-blue' : 'bg-space-600'
                        }`}
                      >
                        <motion.div
                          animate={{ x: showLabels ? 24 : 2 }}
                          className="w-5 h-5 bg-white rounded-full shadow-lg"
                        />
                      </button>
                    </div>
                  </div>

                  <div className="pt-2">
                    <span className="text-sm text-gray-400 block mb-2">背景颜色</span>
                    <div className="flex gap-2">
                      {bgColors.map(bg => (
                        <button
                          key={bg.color}
                          onClick={() => setBackgroundColor(bg.color)}
                          className={`w-8 h-8 rounded-full border-2 transition-all ${
                            backgroundColor === bg.color
                              ? 'border-quantum-blue scale-110'
                              : 'border-space-600 hover:border-gray-400'
                          }`}
                          style={{ backgroundColor: bg.color }}
                          title={bg.label}
                        />
                      ))}
                    </div>
                  </div>

                  <DisplayModeConfig displayMode={displayMode} />
                  <PresetManager />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="border-b border-space-700">
          <button
            onClick={() => toggleSection('simulation')}
            className="w-full flex items-center justify-between p-4 hover:bg-space-700/30 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Zap size={18} className="text-quantum-purple" />
              <span className="font-semibold text-white">模拟类型</span>
            </div>
            {expandedSection === 'simulation' ? (
              <ChevronUp size={18} className="text-gray-400" />
            ) : (
              <ChevronDown size={18} className="text-gray-400" />
            )}
          </button>
          
          <AnimatePresence>
            {expandedSection === 'simulation' && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="p-4 pt-0 space-y-3">
                  <div className="space-y-2">
                    {simulationTypes.map(type => {
                      const Icon = type.icon;
                      return (
                        <motion.button
                          key={type.id}
                          whileHover={{ x: 4 }}
                          onClick={() => setSimulationType(type.id)}
                          className={`w-full p-3 rounded-lg text-left transition-all ${
                            selectedSimulationType === type.id
                              ? 'bg-gradient-to-r from-quantum-purple/20 to-transparent border border-quantum-purple/50'
                              : 'bg-space-700/50 border border-space-600 hover:border-quantum-purple/30'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`p-1.5 rounded-lg ${
                              selectedSimulationType === type.id
                                ? 'bg-quantum-purple/30 text-quantum-purple'
                                : 'bg-space-600 text-gray-400'
                            }`}>
                              <Icon size={16} />
                            </div>
                            <div className="flex-1">
                              <h4 className={`font-medium text-sm ${
                                selectedSimulationType === type.id
                                  ? 'text-quantum-purple'
                                  : 'text-white'
                              }`}>
                                {type.label}
                              </h4>
                              <p className="text-xs text-gray-500 mt-0.5">
                                {type.description}
                              </p>
                            </div>
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>

                  {selectedSimulationType === 'docking' && (
                    <div className="space-y-3 pt-2">
                      <div>
                        <label className="text-xs text-gray-400 block mb-1">配体分子</label>
                        <select
                          value={ligandSelection}
                          onChange={(e) => setLigandSelection(e.target.value)}
                          className="w-full px-3 py-2 bg-space-700/50 border border-space-600 rounded-lg text-sm text-white focus:outline-none focus:border-quantum-purple/50"
                        >
                          {moleculeLibrary.filter(m => m.type === 'small_molecule').map(m => (
                            <option key={m.id} value={m.id}>{m.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-gray-400 block mb-1">靶点蛋白</label>
                        <select
                          value={targetSelection}
                          onChange={(e) => setTargetSelection(e.target.value)}
                          className="w-full px-3 py-2 bg-space-700/50 border border-space-600 rounded-lg text-sm text-white focus:outline-none focus:border-quantum-purple/50"
                        >
                          {moleculeLibrary.filter(m => m.type === 'protein').map(m => (
                            <option key={m.id} value={m.id}>{m.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="border-b border-space-700">
          <button
            onClick={() => toggleSection('parameters')}
            className="w-full flex items-center justify-between p-4 hover:bg-space-700/30 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Settings size={18} className="text-quantum-cyan" />
              <span className="font-semibold text-white">模拟参数</span>
            </div>
            {expandedSection === 'parameters' ? (
              <ChevronUp size={18} className="text-gray-400" />
            ) : (
              <ChevronDown size={18} className="text-gray-400" />
            )}
          </button>
          
          <AnimatePresence>
            {expandedSection === 'parameters' && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="p-4 pt-0 space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-sm text-gray-400 flex items-center gap-1">
                        <Thermometer size={14} />
                        温度
                      </label>
                      <span className="text-sm font-mono text-quantum-cyan">
                        {simulation.parameters.temperature} K
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1000"
                      value={simulation.parameters.temperature}
                      onChange={(e) => setSimulationParameters({ temperature: Number(e.target.value) })}
                      className="w-full h-2 bg-space-600 rounded-lg appearance-none cursor-pointer accent-quantum-cyan"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-sm text-gray-400 flex items-center gap-1">
                        <Clock size={14} />
                        时间步长
                      </label>
                      <span className="text-sm font-mono text-quantum-cyan">
                        {simulation.parameters.timestep} fs
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0.1"
                      max="10"
                      step="0.1"
                      value={simulation.parameters.timestep}
                      onChange={(e) => setSimulationParameters({ timestep: Number(e.target.value) })}
                      className="w-full h-2 bg-space-600 rounded-lg appearance-none cursor-pointer accent-quantum-cyan"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-sm text-gray-400 flex items-center gap-1">
                        <RotateCcw size={14} />
                        迭代次数
                      </label>
                      <span className="text-sm font-mono text-quantum-cyan">
                        {simulation.parameters.iterations.toLocaleString()}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="100"
                      max="5000"
                      step="100"
                      value={simulation.parameters.iterations}
                      onChange={(e) => setSimulationParameters({ iterations: Number(e.target.value) })}
                      className="w-full h-2 bg-space-600 rounded-lg appearance-none cursor-pointer accent-quantum-cyan"
                    />
                  </div>

                  <div>
                    <label className="text-sm text-gray-400 block mb-2">力场</label>
                    <div className="grid grid-cols-2 gap-1">
                      {forceFields.map(ff => (
                        <button
                          key={ff}
                          onClick={() => setSimulationParameters({ forceField: ff })}
                          className={`px-3 py-1.5 rounded text-xs transition-all ${
                            simulation.parameters.forceField === ff
                              ? 'bg-quantum-cyan/20 text-quantum-cyan border border-quantum-cyan/50'
                              : 'bg-space-700/50 text-gray-400 border border-space-600 hover:text-white'
                          }`}
                        >
                          {ff}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="p-4 space-y-3">
          {simulation.isRunning && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">模拟进度</span>
                <span className="font-mono text-quantum-blue">
                  {simulation.currentStep} / {simulation.totalSteps}
                </span>
              </div>
              <div className="h-2 bg-space-700 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-quantum-blue to-quantum-purple rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>
          )}

          <div className="flex gap-2">
            {!simulation.isRunning ? (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleStartSimulation}
                disabled={!currentMolecule || !selectedSimulationType}
                className={`flex-1 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all ${
                  currentMolecule && selectedSimulationType
                    ? 'bg-gradient-to-r from-quantum-blue to-quantum-purple text-white shadow-glow hover:shadow-glow-purple'
                    : 'bg-space-700 text-gray-500 cursor-not-allowed'
                }`}
              >
                <Play size={18} />
                开始模拟
              </motion.button>
            ) : (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleStopSimulation}
                className="flex-1 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 bg-orange-500 text-white hover:bg-orange-600 transition-all"
              >
                <Pause size={18} />
                暂停
              </motion.button>
            )}

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleResetSimulation}
              className="p-3 rounded-lg bg-space-700 text-gray-400 hover:text-white hover:bg-space-600 transition-all"
              title="重置"
            >
              <RotateCcw size={18} />
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );
}
