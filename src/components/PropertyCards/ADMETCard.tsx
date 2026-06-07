import { motion } from 'framer-motion';
import { ADMETProperty, ADMETCategory, ADMETStatus } from '../../types';
import { 
  Activity, 
  ArrowRightLeft, 
  FlaskRound, 
  Droplets, 
  Skull, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle,
  HelpCircle,
  BookOpen,
} from 'lucide-react';

interface ADMETCardProps {
  properties: ADMETProperty[];
}

const categoryConfig: Record<ADMETCategory, { icon: typeof Activity; label: string; color: string }> = {
  absorption: { icon: Activity, label: '吸收', color: 'from-emerald-500 to-green-500' },
  distribution: { icon: ArrowRightLeft, label: '分布', color: 'from-blue-500 to-sky-500' },
  metabolism: { icon: FlaskRound, label: '代谢', color: 'from-amber-500 to-yellow-500' },
  excretion: { icon: Droplets, label: '排泄', color: 'from-purple-500 to-violet-500' },
  toxicity: { icon: Skull, label: '毒性', color: 'from-red-500 to-rose-500' },
};

const statusConfig: Record<ADMETStatus, { icon: typeof CheckCircle2; color: string; bgColor: string; label: string }> = {
  good: { icon: CheckCircle2, color: 'text-emerald-400', bgColor: 'bg-emerald-500/20', label: '良好' },
  moderate: { icon: AlertTriangle, color: 'text-amber-400', bgColor: 'bg-amber-500/20', label: '中等' },
  poor: { icon: XCircle, color: 'text-red-400', bgColor: 'bg-red-500/20', label: '较差' },
  unknown: { icon: HelpCircle, color: 'text-slate-400', bgColor: 'bg-slate-500/20', label: '未知' },
};

export function ADMETCard({ properties }: ADMETCardProps) {
  const grouped = properties.reduce((acc, p) => {
    if (!acc[p.category]) acc[p.category] = [];
    acc[p.category].push(p);
    return acc;
  }, {} as Record<ADMETCategory, ADMETProperty[]>);

  const categories = Object.keys(categoryConfig) as ADMETCategory[];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="bg-slate-900/60 backdrop-blur-xl rounded-xl border border-slate-700/50 overflow-hidden"
    >
      <div className="p-4 border-b border-slate-700/50 bg-gradient-to-r from-emerald-600/20 to-blue-600/20">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <Activity className="w-5 h-5 text-emerald-400" />
          ADMET性质预测
        </h3>
        <p className="text-sm text-slate-400 mt-1">
          已预测 {properties.length} 项ADMET性质
        </p>
      </div>

      <div className="p-4 space-y-6">
        {categories.map((category) => {
          const categoryProps = grouped[category];
          if (!categoryProps || categoryProps.length === 0) return null;

          const config = categoryConfig[category];
          const Icon = config.icon;

          const goodCount = categoryProps.filter(p => p.status === 'good').length;
          const moderateCount = categoryProps.filter(p => p.status === 'moderate').length;
          const poorCount = categoryProps.filter(p => p.status === 'poor').length;

          return (
            <div key={category}>
              <div className="flex items-center gap-2 mb-3">
                <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${config.color} flex items-center justify-center`}>
                  <Icon className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm font-semibold text-slate-200">{config.label}</span>
                <div className="flex-1 flex items-center gap-1 ml-2">
                  <span className="text-xs text-emerald-400">{goodCount} 良好</span>
                  <span className="text-xs text-slate-600">•</span>
                  <span className="text-xs text-amber-400">{moderateCount} 中等</span>
                  <span className="text-xs text-slate-600">•</span>
                  <span className="text-xs text-red-400">{poorCount} 较差</span>
                </div>
                <div className="flex-1 h-px bg-slate-700 hidden sm:block" />
              </div>

              <div className="space-y-2">
                {categoryProps.map((prop, idx) => {
                  const statusCfg = statusConfig[prop.status];
                  const StatusIcon = statusCfg.icon;

                  return (
                    <motion.div
                      key={prop.name}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="group bg-slate-800/50 rounded-lg p-3 border border-slate-700/50 hover:border-slate-600 transition-all"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-white truncate">{prop.name}</p>
                            <div className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusCfg.bgColor} ${statusCfg.color} flex items-center gap-1 shrink-0`}>
                              <StatusIcon className="w-3 h-3" />
                              {statusCfg.label}
                            </div>
                          </div>
                          <p className="text-sm text-slate-300 mt-1">{prop.prediction}</p>
                          {prop.reference && (
                            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                              <BookOpen className="w-3 h-3" />
                              {prop.reference}
                            </p>
                          )}
                        </div>
                        <div className="shrink-0 text-right">
                          <div className="relative w-16 h-16">
                            <svg className="w-16 h-16 transform -rotate-90">
                              <circle
                                cx="32"
                                cy="32"
                                r="28"
                                fill="none"
                                stroke="#334155"
                                strokeWidth="4"
                              />
                              <circle
                                cx="32"
                                cy="32"
                                r="28"
                                fill="none"
                                stroke={
                                  prop.status === 'good' ? '#10b981' :
                                  prop.status === 'moderate' ? '#f59e0b' :
                                  prop.status === 'poor' ? '#ef4444' : '#64748b'
                                }
                                strokeWidth="4"
                                strokeLinecap="round"
                                strokeDasharray={`${prop.probability * 176} 176`}
                              />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                              <span className="text-lg font-bold text-white">
                                {Math.round(prop.probability * 100)}%
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      {prop.description && (
                        <p className="text-xs text-slate-500 mt-2 pt-2 border-t border-slate-700/50">
                          {prop.description}
                        </p>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
