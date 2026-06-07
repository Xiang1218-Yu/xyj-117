import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Atom,
  Link,
  Trash2,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Zap,
  Palette,
  Move,
  Layers,
} from 'lucide-react';
import { useStore } from '../../store/useStore';
import { getAtomColor, atomColors } from '../../utils/atomColors';
import { Bond } from '../../types';

const commonElements = [
  'H', 'C', 'N', 'O', 'F', 'Cl', 'Br', 'I',
  'S', 'P', 'B', 'Si', 'Li', 'Na', 'K', 'Mg',
  'Ca', 'Fe', 'Cu', 'Zn', 'Ag', 'Au', 'Pt',
];

const bondOrders: { id: 1 | 2 | 3 | 'aromatic'; label: string; icon: string }[] = [
  { id: 1, label: '单键', icon: '—' },
  { id: 2, label: '双键', icon: '=' },
  { id: 3, label: '三键', icon: '≡' },
  { id: 'aromatic', label: '芳香键', icon: '◯' },
];

export function PropertyEditor() {
  const {
    currentMolecule,
    selectedAtomId,
    editor,
    updateAtom,
    updateBond,
    deleteAtom,
    deleteBond,
    setSelectedElement,
    setSelectedBond,
    clearEditorSelection,
  } = useStore();

  const [showElementPicker, setShowElementPicker] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string>('properties');

  const selectedAtom = useMemo(() => {
    if (!selectedAtomId || !currentMolecule) return null;
    return currentMolecule.atoms.find(a => a.id === selectedAtomId) || null;
  }, [selectedAtomId, currentMolecule]);

  const selectedBond = useMemo((): Bond | null => {
    if (!editor.selectedBondId || !currentMolecule) return null;
    return currentMolecule.bonds.find(b => b.id === editor.selectedBondId) || null;
  }, [editor.selectedBondId, currentMolecule]);

  const connectedBonds = useMemo(() => {
    if (!selectedAtomId || !currentMolecule) return [];
    return currentMolecule.bonds.filter(
      b => b.atom1 === selectedAtomId || b.atom2 === selectedAtomId
    );
  }, [selectedAtomId, currentMolecule]);

  const connectedAtoms = useMemo(() => {
    if (!currentMolecule) return [];
    return connectedBonds.map(bond => {
      const otherAtomId = bond.atom1 === selectedAtomId ? bond.atom2 : bond.atom1;
      const atom = currentMolecule.atoms.find(a => a.id === otherAtomId);
      return { atom, bond };
    }).filter(item => item.atom !== undefined);
  }, [connectedBonds, currentMolecule, selectedAtomId]);

  const handleElementChange = (element: string) => {
    if (!selectedAtomId) return;
    updateAtom(selectedAtomId, { element });
    setShowElementPicker(false);
  };

  const handleChargeChange = (charge: number) => {
    if (!selectedAtomId) return;
    updateAtom(selectedAtomId, { charge });
  };

  const handlePositionChange = (axis: 'x' | 'y' | 'z', value: number) => {
    if (!selectedAtomId || !selectedAtom) return;
    updateAtom(selectedAtomId, { [axis]: value });
  };

  const handleBondOrderChange = (order: 1 | 2 | 3 | 'aromatic') => {
    if (!editor.selectedBondId) return;
    updateBond(editor.selectedBondId, order);
  };

  const handleDeleteAtom = () => {
    if (!selectedAtomId) return;
    deleteAtom(selectedAtomId);
  };

  const handleDeleteBond = () => {
    if (!editor.selectedBondId) return;
    deleteBond(editor.selectedBondId);
  };

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? '' : section);
  };

  if (!selectedAtom && !selectedBond) {
    return (
      <div className="p-4 border-t border-space-700">
        <div className="text-center py-6">
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-space-700/50 flex items-center justify-center">
            <Atom size={20} className="text-gray-500" />
          </div>
          <p className="text-sm text-gray-500">选择原子或键以编辑其属性</p>
          <p className="text-xs text-gray-600 mt-1">在编辑模式下点击3D视图中的原子或键</p>
        </div>
      </div>
    );
  }

  return (
    <div className="border-t border-space-700">
      <AnimatePresence mode="wait">
        {selectedAtom && (
          <motion.div
            key="atom"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <div className="p-4 border-b border-space-700 bg-gradient-to-r from-quantum-blue/10 to-transparent">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white shadow-lg"
                    style={{ backgroundColor: getAtomColor(selectedAtom.element) }}
                  >
                    {selectedAtom.element}
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">原子属性</h3>
                    <p className="text-xs text-gray-500 font-mono">ID: {selectedAtom.id.slice(0, 8)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleDeleteAtom}
                    className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all"
                    title="删除原子"
                  >
                    <Trash2 size={16} />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={clearEditorSelection}
                    className="p-2 rounded-lg bg-space-700 text-gray-400 hover:text-white hover:bg-space-600 transition-all"
                    title="取消选择"
                  >
                    <RotateCcw size={16} />
                  </motion.button>
                </div>
              </div>
            </div>

            <div className="border-b border-space-700">
              <button
                onClick={() => toggleSection('properties')}
                className="w-full flex items-center justify-between p-3 hover:bg-space-700/30 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Palette size={16} className="text-quantum-blue" />
                  <span className="font-semibold text-white text-sm">基本属性</span>
                </div>
                {expandedSection === 'properties' ? (
                  <ChevronUp size={16} className="text-gray-400" />
                ) : (
                  <ChevronDown size={16} className="text-gray-400" />
                )}
              </button>
              
              <AnimatePresence>
                {expandedSection === 'properties' && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="p-4 pt-0 space-y-4">
                      <div>
                        <label className="text-xs text-gray-400 block mb-2">元素类型</label>
                        <div className="relative">
                          <motion.button
                            whileHover={{ scale: 1.01 }}
                            onClick={() => setShowElementPicker(!showElementPicker)}
                            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-space-700/50 border border-space-600 hover:border-quantum-blue/50 transition-all"
                          >
                            <div
                              className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                              style={{ 
                                backgroundColor: getAtomColor(selectedAtom.element),
                                color: ['H', 'He', 'Ne', 'Ar', 'F', 'Cl'].includes(selectedAtom.element) ? '#333' : '#fff',
                              }}
                            >
                              {selectedAtom.element}
                            </div>
                            <span className="text-white font-medium">{selectedAtom.element}</span>
                            <ChevronDown size={14} className="text-gray-400 ml-auto" />
                          </motion.button>

                          <AnimatePresence>
                            {showElementPicker && (
                              <motion.div
                                initial={{ opacity: 0, y: -5 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -5 }}
                                className="absolute top-full mt-1 left-0 right-0 p-2 bg-space-800 border border-space-600 rounded-lg shadow-2xl z-50"
                              >
                                <div className="grid grid-cols-6 gap-1">
                                  {commonElements.map((el) => (
                                    <motion.button
                                      key={el}
                                      whileHover={{ scale: 1.1 }}
                                      whileTap={{ scale: 0.95 }}
                                      onClick={() => handleElementChange(el)}
                                      className={`w-8 h-8 rounded flex items-center justify-center text-xs font-bold transition-all ${
                                        selectedAtom.element === el
                                          ? 'ring-2 ring-quantum-blue scale-110'
                                          : 'hover:ring-1 hover:ring-white/30'
                                      }`}
                                      style={{
                                        backgroundColor: atomColors[el] || '#808080',
                                        color: ['H', 'He', 'Ne', 'Ar', 'F', 'Cl'].includes(el) ? '#333' : '#fff',
                                      }}
                                    >
                                      {el}
                                    </motion.button>
                                  ))}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>

                      <div>
                        <label className="text-xs text-gray-400 block mb-2 flex items-center gap-1">
                          <Zap size={12} className="text-yellow-500" />
                          电荷 (Charge)
                        </label>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 grid grid-cols-5 gap-1">
                            {[-2, -1, 0, 1, 2].map((charge) => (
                              <motion.button
                                key={charge}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleChargeChange(charge)}
                                className={`py-1.5 rounded text-xs font-mono font-bold transition-all ${
                                  (selectedAtom.charge || 0) === charge
                                    ? 'bg-quantum-purple text-white'
                                    : 'bg-space-700/50 text-gray-400 hover:text-white hover:bg-space-600'
                                }`}
                              >
                                {charge > 0 ? `+${charge}` : charge}
                              </motion.button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="border-b border-space-700">
              <button
                onClick={() => toggleSection('position')}
                className="w-full flex items-center justify-between p-3 hover:bg-space-700/30 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Move size={16} className="text-quantum-cyan" />
                  <span className="font-semibold text-white text-sm">坐标位置</span>
                </div>
                {expandedSection === 'position' ? (
                  <ChevronUp size={16} className="text-gray-400" />
                ) : (
                  <ChevronDown size={16} className="text-gray-400" />
                )}
              </button>
              
              <AnimatePresence>
                {expandedSection === 'position' && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="p-4 pt-0 space-y-3">
                      {(['x', 'y', 'z'] as const).map((axis) => (
                        <div key={axis}>
                          <div className="flex justify-between items-center mb-1">
                            <label className="text-xs text-gray-400 uppercase">{axis} 轴</label>
                            <span className="text-xs font-mono text-quantum-cyan">
                              {selectedAtom[axis].toFixed(3)} Å
                            </span>
                          </div>
                          <input
                            type="range"
                            min={-15}
                            max={15}
                            step={0.1}
                            value={selectedAtom[axis]}
                            onChange={(e) => handlePositionChange(axis, parseFloat(e.target.value))}
                            className="w-full h-2 bg-space-600 rounded-lg appearance-none cursor-pointer accent-quantum-cyan"
                          />
                          <div className="flex justify-between mt-1">
                            <span className="text-[10px] text-gray-600">-15</span>
                            <span className="text-[10px] text-gray-600">15</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {connectedAtoms.length > 0 && (
              <div>
                <button
                  onClick={() => toggleSection('bonds')}
                  className="w-full flex items-center justify-between p-3 hover:bg-space-700/30 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Layers size={16} className="text-quantum-purple" />
                    <span className="font-semibold text-white text-sm">
                      连接的键 ({connectedAtoms.length})
                    </span>
                  </div>
                  {expandedSection === 'bonds' ? (
                    <ChevronUp size={16} className="text-gray-400" />
                  ) : (
                    <ChevronDown size={16} className="text-gray-400" />
                  )}
                </button>
                
                <AnimatePresence>
                  {expandedSection === 'bonds' && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="p-4 pt-0 space-y-2">
                        {connectedAtoms.map(({ atom, bond }) => (
                          <motion.div
                            key={bond.id}
                            whileHover={{ x: 4 }}
                            className="flex items-center justify-between p-2 rounded-lg bg-space-700/30 hover:bg-space-700/50 transition-all cursor-pointer"
                            onClick={() => {
                              setSelectedBond(bond.id);
                            }}
                          >
                            <div className="flex items-center gap-2">
                              <div
                                className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                                style={{ 
                                  backgroundColor: getAtomColor(atom!.element),
                                  color: ['H', 'He', 'Ne', 'Ar', 'F', 'Cl'].includes(atom!.element) ? '#333' : '#fff',
                                }}
                              >
                                {atom!.element}
                              </div>
                              <div>
                                <p className="text-xs text-white font-medium">{atom!.element} 原子</p>
                                <p className="text-[10px] text-gray-500 font-mono">
                                  {bond.order === 'aromatic' ? '芳香键' : `${bond.order}级键`} · {bond.length.toFixed(2)} Å
                                </p>
                              </div>
                            </div>
                            <div
                              className="w-6 h-6 rounded flex items-center justify-center text-sm font-bold text-quantum-purple"
                              title="点击编辑此键"
                            >
                              →
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </motion.div>
        )}

        {selectedBond && (
          <motion.div
            key="bond"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <div className="p-4 border-b border-space-700 bg-gradient-to-r from-quantum-purple/10 to-transparent">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-quantum-purple/20 flex items-center justify-center">
                    <Link size={20} className="text-quantum-purple" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">化学键属性</h3>
                    <p className="text-xs text-gray-500 font-mono">ID: {selectedBond.id.slice(0, 8)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleDeleteBond}
                    className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all"
                    title="删除键"
                  >
                    <Trash2 size={16} />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={clearEditorSelection}
                    className="p-2 rounded-lg bg-space-700 text-gray-400 hover:text-white hover:bg-space-600 transition-all"
                    title="取消选择"
                  >
                    <RotateCcw size={16} />
                  </motion.button>
                </div>
              </div>
            </div>

            <div className="p-4 space-y-4">
              {currentMolecule && (
                <div className="p-3 rounded-xl bg-space-700/30 border border-space-600">
                  <p className="text-xs text-gray-400 mb-2">连接的原子</p>
                  <div className="flex items-center justify-center gap-4">
                    {[selectedBond.atom1, selectedBond.atom2].map((atomId, i) => {
                      const atom = currentMolecule.atoms.find(a => a.id === atomId);
                      if (!atom) return null;
                      return (
                        <motion.div
                          key={atomId}
                          whileHover={{ scale: 1.05 }}
                          className="flex items-center gap-2 cursor-pointer"
                          onClick={() => {
                            setSelectedBond(null);
                            clearEditorSelection();
                            setTimeout(() => {
                              const state = useStore.getState();
                              state.setSelectedAtom(atomId);
                            }, 0);
                          }}
                        >
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white shadow-lg"
                            style={{ backgroundColor: getAtomColor(atom.element) }}
                          >
                            {atom.element}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-white">{atom.element}</p>
                            <p className="text-[10px] text-gray-500">点击选中</p>
                          </div>
                          {i === 0 && (
                            <div className="mx-2 text-quantum-purple">
                              {selectedBond.order === 'aromatic' ? '◯' : 
                               selectedBond.order === 1 ? '—' :
                               selectedBond.order === 2 ? '=' : '≡'}
                            </div>
                          )}
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div>
                <label className="text-xs text-gray-400 block mb-2">键级 (Bond Order)</label>
                <div className="grid grid-cols-4 gap-2">
                  {bondOrders.map((order) => (
                    <motion.button
                      key={order.id.toString()}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleBondOrderChange(order.id)}
                      className={`py-3 rounded-xl flex flex-col items-center gap-1 transition-all ${
                        selectedBond.order === order.id
                          ? 'bg-gradient-to-br from-quantum-purple/30 to-quantum-blue/30 border-2 border-quantum-purple text-white'
                          : 'bg-space-700/30 border border-space-600 text-gray-400 hover:text-white hover:bg-space-600'
                      }`}
                    >
                      <span className="text-xl font-bold">{order.icon}</span>
                      <span className="text-xs">{order.label}</span>
                    </motion.button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-space-700/30 border border-space-600">
                  <p className="text-xs text-gray-400 mb-1">键长</p>
                  <p className="font-mono text-lg text-quantum-cyan">
                    {selectedBond.length.toFixed(3)}
                    <span className="text-xs text-gray-500 ml-1">Å</span>
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-space-700/30 border border-space-600">
                  <p className="text-xs text-gray-400 mb-1">类型</p>
                  <p className="font-medium text-lg text-quantum-blue">
                    {selectedBond.order === 'aromatic' ? '共轭' : '共价'}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
