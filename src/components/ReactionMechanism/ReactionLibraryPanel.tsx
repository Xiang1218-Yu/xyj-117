import { motion } from 'framer-motion';
import { 
  FlaskConical, 
  Zap, 
  ArrowRight, 
  ChevronRight,
  Info,
  Thermometer,
  Droplets
} from 'lucide-react';
import { ReactionMechanism, ReactionType } from '../../types';
import { reactionLibrary } from '../../data/reactions';

interface ReactionLibraryPanelProps {
  selectedReaction: ReactionMechanism | null;
  onSelectReaction: (reaction: ReactionMechanism) => void;
}

const reactionTypeLabels: Record<ReactionType, string> = {
  SN2: 'SN2 亲核取代',
  E2: 'E2 消除',
  SN1: 'SN1 亲核取代',
  E1: 'E1 消除',
  nucleophilic_addition: '亲核加成',
  elimination: '消除反应',
  electrophilic_substitution: '亲电取代',
  diels_alder: 'Diels-Alder',
  grignard: '格氏反应',
  hydrolysis: '水解反应',
  esterification: '酯化反应',
};

export function ReactionLibraryPanel({ selectedReaction, onSelectReaction }: ReactionLibraryPanelProps) {
  return (
    <div className="w-80 bg-slate-900/95 backdrop-blur-xl border-r border-slate-700/50 flex flex-col h-full">
      <div className="p-4 border-b border-slate-700/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
            <FlaskConical className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">反应机理库</h2>
            <p className="text-xs text-slate-400">选择有机化学反应类型</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {reactionLibrary.map((reaction) => (
          <motion.button
            key={reaction.id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelectReaction(reaction)}
            className={`w-full text-left p-3 rounded-xl transition-all ${
              selectedReaction?.id === reaction.id
                ? 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 border-2 border-amber-500/50 shadow-lg shadow-amber-500/20'
                : 'bg-slate-800/50 border border-slate-700/50 hover:bg-slate-800 hover:border-slate-600'
            }`}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  selectedReaction?.id === reaction.id
                    ? 'bg-amber-500/30'
                    : 'bg-slate-700/50'
                }`}>
                  <Zap className={`w-4 h-4 ${
                    selectedReaction?.id === reaction.id ? 'text-amber-400' : 'text-slate-400'
                  }`} />
                </div>
                <div>
                  <h3 className={`font-semibold text-sm ${
                    selectedReaction?.id === reaction.id ? 'text-amber-400' : 'text-white'
                  }`}>
                    {reaction.name}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {reactionTypeLabels[reaction.type]}
                  </p>
                </div>
              </div>
              <ChevronRight className={`w-4 h-4 ${
                selectedReaction?.id === reaction.id ? 'text-amber-400' : 'text-slate-500'
              }`} />
            </div>
            
            <div className="text-xs text-slate-400 font-mono bg-slate-900/50 rounded-lg px-2 py-1.5 mb-2">
              {reaction.chemicalEquation}
            </div>

            {reaction.conditions && (
              <div className="flex flex-wrap gap-1.5">
                {reaction.conditions.solvent && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded-full text-xs">
                    <Droplets className="w-3 h-3" />
                    {reaction.conditions.solvent}
                  </span>
                )}
                {reaction.conditions.temperature && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-500/20 text-red-400 rounded-full text-xs">
                    <Thermometer className="w-3 h-3" />
                    {reaction.conditions.temperature}
                  </span>
                )}
              </div>
            )}
          </motion.button>
        ))}
      </div>

      {selectedReaction && (
        <div className="p-4 border-t border-slate-700/50 bg-slate-800/50">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-semibold text-white mb-1">反应说明</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                {selectedReaction.description}
              </p>
              {selectedReaction.notes && (
                <p className="text-xs text-amber-400 mt-2">
                  💡 {selectedReaction.notes}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
