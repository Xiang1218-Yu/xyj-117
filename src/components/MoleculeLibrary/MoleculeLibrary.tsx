import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Plus, X, Dna, Pill, Layers, ChevronRight } from 'lucide-react';
import { Molecule } from '../../types';
import { moleculeLibrary } from '../../store/useStore';
import { useStore } from '../../store/useStore';
import { getAtomColor } from '../../utils/atomColors';

const categoryIcons: Record<string, any> = {
  '蛋白质': Dna,
  '药物分子': Pill,
  '纳米材料': Layers,
  '半导体材料': Layers,
  '离子晶体': Layers,
  '基础分子': Layers,
  '有机分子': Layers,
};

const categoryColors: Record<string, string> = {
  '蛋白质': 'from-blue-500 to-cyan-500',
  '药物分子': 'from-purple-500 to-pink-500',
  '纳米材料': 'from-green-500 to-emerald-500',
  '半导体材料': 'from-orange-500 to-yellow-500',
  '离子晶体': 'from-red-500 to-rose-500',
  '基础分子': 'from-gray-500 to-slate-500',
  '有机分子': 'from-indigo-500 to-violet-500',
};

interface MoleculeLibraryProps {
  onAddMolecule?: () => void;
}

interface MoleculeCardProps {
  molecule: Molecule;
  isSelected: boolean;
  onClick: () => void;
}

function MoleculeCard({ molecule, isSelected, onClick }: MoleculeCardProps) {
  const Icon = categoryIcons[molecule.category || ''] || Layers;
  const gradient = categoryColors[molecule.category || ''] || 'from-gray-500 to-slate-500';

  const previewColors = useMemo(() => {
    const colors = new Set<string>();
    molecule.atoms.slice(0, 10).forEach(atom => {
      if (atom.element !== 'H') {
        colors.add(getAtomColor(atom.element));
      }
    });
    return Array.from(colors).slice(0, 4);
  }, [molecule]);

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`relative p-3 rounded-xl cursor-pointer transition-all duration-300 ${
        isSelected
          ? 'bg-gradient-to-br from-quantum-blue/30 to-quantum-purple/30 border-2 border-quantum-blue shadow-glow'
          : 'bg-space-700/50 border border-space-600 hover:border-quantum-blue/50'
      }`}
    >
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-lg bg-gradient-to-br ${gradient} shadow-lg`}>
          <Icon size={20} className="text-white" />
        </div>
        
        <div className="flex-1 min-w-0">
          <h4 className="font-display font-semibold text-white text-sm truncate">
            {molecule.name}
          </h4>
          <p className="text-xs text-gray-400 font-mono mt-0.5">
            {molecule.formula}
          </p>
          <p className="text-xs text-gray-500 mt-1 line-clamp-2">
            {molecule.description}
          </p>
          
          <div className="flex items-center gap-1 mt-2">
            <span className="text-xs text-gray-400">原子:</span>
            <span className="text-xs font-mono text-quantum-cyan">
              {molecule.atoms.length}
            </span>
            <span className="text-gray-600 mx-1">|</span>
            <span className="text-xs text-gray-400">键:</span>
            <span className="text-xs font-mono text-quantum-purple">
              {molecule.bonds.length}
            </span>
          </div>
          
          <div className="flex gap-1 mt-2">
            {previewColors.map((color, i) => (
              <div
                key={i}
                className="w-3 h-3 rounded-full border border-white/20"
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </div>
        
        <ChevronRight
          size={16}
          className={`transition-colors ${
            isSelected ? 'text-quantum-blue' : 'text-gray-600'
          }`}
        />
      </div>
      
      {isSelected && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute -top-1 -right-1 w-3 h-3 bg-quantum-blue rounded-full border-2 border-space-900"
        />
      )}
    </motion.div>
  );
}

export function MoleculeLibrary({ onAddMolecule }: MoleculeLibraryProps) {
  const {
    currentMolecule,
    setCurrentMolecule,
    searchQuery,
    setSearchQuery,
    setSimulationType,
    activeTab,
    setActiveTab,
  } = useStore();

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const categories = useMemo(() => {
    const cats = new Set<string>();
    moleculeLibrary.forEach(m => {
      if (m.category) cats.add(m.category);
    });
    return Array.from(cats);
  }, []);

  const filteredMolecules = useMemo(() => {
    return moleculeLibrary.filter(mol => {
      const matchesSearch = mol.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        mol.formula.toLowerCase().includes(searchQuery.toLowerCase()) ||
        mol.description?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = !selectedCategory || mol.category === selectedCategory;
      
      if (activeTab === 'molecules') {
        return matchesSearch && matchesCategory;
      } else if (activeTab === 'proteins') {
        return mol.type === 'protein' && matchesSearch;
      } else if (activeTab === 'drugs') {
        return mol.type === 'small_molecule' && matchesSearch;
      } else if (activeTab === 'materials') {
        return mol.type === 'material' && matchesSearch;
      }
      
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory, activeTab]);

  const tabs = [
    { id: 'molecules', label: '全部', icon: Layers },
    { id: 'proteins', label: '蛋白质', icon: Dna },
    { id: 'drugs', label: '药物', icon: Pill },
    { id: 'materials', label: '材料', icon: Layers },
  ];

  return (
    <div className="h-full flex flex-col bg-space-800/80 backdrop-blur-xl border-r border-space-700">
      <div className="p-4 border-b border-space-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl font-bold bg-gradient-to-r from-quantum-blue to-quantum-purple bg-clip-text text-transparent">
            分子库
          </h2>
          <button 
            onClick={onAddMolecule}
            className="p-1.5 rounded-lg bg-space-700 hover:bg-space-600 text-gray-400 hover:text-white transition-colors"
            title="添加分子"
          >
            <Plus size={18} />
          </button>
        </div>

        <div className="relative mb-3">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="搜索分子..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-9 py-2 bg-space-700/50 border border-space-600 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-quantum-blue/50 focus:ring-1 focus:ring-quantum-blue/50 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div className="flex gap-1">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <motion.button
                key={tab.id}
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex flex-col items-center gap-1 py-2 px-1 rounded-lg text-xs transition-all ${
                  activeTab === tab.id
                    ? 'bg-quantum-blue/20 text-quantum-blue border border-quantum-blue/50'
                    : 'text-gray-400 hover:text-white hover:bg-space-700'
                }`}
              >
                <Icon size={16} />
                <span>{tab.label}</span>
              </motion.button>
            );
          })}
        </div>
      </div>

      <div className="flex gap-2 px-4 py-2 border-b border-space-700 overflow-x-auto">
        <button
          onClick={() => setSelectedCategory(null)}
          className={`px-3 py-1 rounded-full text-xs whitespace-nowrap transition-all ${
            !selectedCategory
              ? 'bg-quantum-purple/20 text-quantum-purple border border-quantum-purple/50'
              : 'bg-space-700/50 text-gray-400 hover:text-white border border-space-600'
          }`}
        >
          全部
        </button>
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1 rounded-full text-xs whitespace-nowrap transition-all ${
              selectedCategory === cat
                ? 'bg-quantum-blue/20 text-quantum-blue border border-quantum-blue/50'
                : 'bg-space-700/50 text-gray-400 hover:text-white border border-space-600'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        <AnimatePresence mode="popLayout">
          {filteredMolecules.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center py-12 text-center"
            >
              <div className="w-16 h-16 rounded-full bg-space-700/50 flex items-center justify-center mb-4">
                <Search size={24} className="text-gray-600" />
              </div>
              <p className="text-gray-500 text-sm">未找到匹配的分子</p>
              <p className="text-gray-600 text-xs mt-1">尝试其他搜索词</p>
            </motion.div>
          ) : (
            filteredMolecules.map(mol => (
              <MoleculeCard
                key={mol.id}
                molecule={mol}
                isSelected={currentMolecule?.id === mol.id}
                onClick={() => {
                  setCurrentMolecule(mol);
                  setSimulationType(null);
                }}
              />
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
