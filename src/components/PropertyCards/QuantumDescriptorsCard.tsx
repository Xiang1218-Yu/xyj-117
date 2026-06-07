import { motion } from 'framer-motion';
import { QuantumDescriptor, DescriptorCategory } from '../../types';
import { Atom, Zap, Grid3X3, FlaskConical, Info } from 'lucide-react';

interface QuantumDescriptorsCardProps {
  descriptors: QuantumDescriptor[];
}

const categoryConfig: Record<DescriptorCategory, { icon: typeof Atom; label: string; color: string }> = {
  electronic: { icon: Zap, label: '电子性质', color: 'from-purple-500 to-indigo-500' },
  structural: { icon: Atom, label: '结构性质', color: 'from-blue-500 to-cyan-500' },
  topological: { icon: Grid3X3, label: '拓扑性质', color: 'from-emerald-500 to-teal-500' },
  physicochemical: { icon: FlaskConical, label: '物理化学', color: 'from-amber-500 to-orange-500' },
};

const formatValue = (value: number, name: string): string => {
  if (name === 'Molecular Formula') {
    return `C${Math.round(value)}`;
  }
  if (Math.abs(value) >= 1000) return value.toExponential(2);
  if (Math.abs(value) < 0.01 && value !== 0) return value.toExponential(2);
  return value.toFixed(2);
};

export function QuantumDescriptorsCard({ descriptors }: QuantumDescriptorsCardProps) {
  const grouped = descriptors.reduce((acc, d) => {
    if (!acc[d.category]) acc[d.category] = [];
    acc[d.category].push(d);
    return acc;
  }, {} as Record<DescriptorCategory, QuantumDescriptor[]>);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-slate-900/60 backdrop-blur-xl rounded-xl border border-slate-700/50 overflow-hidden"
    >
      <div className="p-4 border-b border-slate-700/50 bg-gradient-to-r from-blue-600/20 to-purple-600/20">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <Atom className="w-5 h-5 text-blue-400" />
          量子化学描述符
        </h3>
        <p className="text-sm text-slate-400 mt-1">
          已计算 {descriptors.length} 个分子描述符
        </p>
      </div>

      <div className="p-4 space-y-6">
        {(Object.keys(categoryConfig) as DescriptorCategory[]).map((category) => {
          const categoryDescriptors = grouped[category];
          if (!categoryDescriptors || categoryDescriptors.length === 0) return null;

          const config = categoryConfig[category];
          const Icon = config.icon;

          return (
            <div key={category}>
              <div className="flex items-center gap-2 mb-3">
                <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${config.color} flex items-center justify-center`}>
                  <Icon className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm font-semibold text-slate-200">{config.label}</span>
                <div className="flex-1 h-px bg-slate-700" />
              </div>

              <div className="grid grid-cols-2 gap-2">
                {categoryDescriptors.map((descriptor, idx) => (
                  <motion.div
                    key={descriptor.name}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.03 }}
                    className="group relative bg-slate-800/50 rounded-lg p-3 border border-slate-700/50 hover:border-slate-600 transition-all"
                  >
                    <div className="flex items-start justify-between">
                      <div className="min-w-0">
                        <p className="text-xs text-slate-400 truncate pr-2">{descriptor.name}</p>
                        <p className="text-lg font-bold text-white mt-0.5">
                          {formatValue(descriptor.value, descriptor.name)}
                          {descriptor.unit && (
                            <span className="text-sm text-slate-500 ml-1">{descriptor.unit}</span>
                          )}
                        </p>
                      </div>
                      {descriptor.description && (
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <Info className="w-4 h-4 text-slate-500 cursor-help" />
                          <div className="absolute right-2 top-full mt-1 w-64 p-2 bg-slate-800 border border-slate-600 rounded-lg text-xs text-slate-300 z-50 opacity-0 group-hover:opacity-100 pointer-events-none">
                            {descriptor.description}
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
