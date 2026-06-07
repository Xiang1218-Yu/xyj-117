import { motion } from 'framer-motion';
import { DrugLikenessResult, DrugLikenessRule } from '../../types';
import { Pill, CheckCircle2, XCircle, AlertCircle, Award, Info } from 'lucide-react';

interface DrugLikenessCardProps {
  result: DrugLikenessResult;
}

const getScoreColor = (score: number) => {
  if (score >= 80) return 'from-emerald-500 to-green-500';
  if (score >= 60) return 'from-amber-500 to-yellow-500';
  if (score >= 40) return 'from-orange-500 to-red-500';
  return 'from-red-500 to-rose-500';
};

const getScoreTextColor = (score: number) => {
  if (score >= 80) return 'text-emerald-400';
  if (score >= 60) return 'text-amber-400';
  if (score >= 40) return 'text-orange-400';
  return 'text-red-400';
};

const getScoreLabel = (score: number) => {
  if (score >= 80) return 'Excellent';
  if (score >= 60) return 'Good';
  if (score >= 40) return 'Moderate';
  return 'Poor';
};

function RuleItem({ rule, index }: { rule: DrugLikenessRule; index: number }) {
  const StatusIcon = rule.passed ? CheckCircle2 : XCircle;
  const statusColor = rule.passed ? 'text-emerald-400' : 'text-red-400';
  const bgColor = rule.passed ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-red-500/10 border-red-500/30';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className={`rounded-lg p-4 border ${bgColor}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <StatusIcon className={`w-5 h-5 ${statusColor} shrink-0`} />
            <h4 className="text-sm font-semibold text-white truncate">{rule.ruleName}</h4>
          </div>
          <p className="text-sm text-slate-400 mt-1">{rule.details}</p>
          {rule.threshold && (
            <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
              <Info className="w-3 h-3" />
              Threshold: {rule.threshold}
            </p>
          )}
        </div>
        <div className="shrink-0 text-right">
          <div className={`text-lg font-bold ${getScoreTextColor(rule.score)}`}>
            {rule.score}
          </div>
          <p className="text-xs text-slate-500">score</p>
        </div>
      </div>

      <div className="mt-3">
        <div className="h-2 bg-slate-700/50 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${rule.score}%` }}
            transition={{ delay: index * 0.1 + 0.2, duration: 0.5 }}
            className={`h-full rounded-full bg-gradient-to-r ${getScoreColor(rule.score)}`}
          />
        </div>
      </div>
    </motion.div>
  );
}

export function DrugLikenessCard({ result }: DrugLikenessCardProps) {
  const passedRules = result.rules.filter(r => r.passed).length;
  const totalRules = result.rules.length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="bg-slate-900/60 backdrop-blur-xl rounded-xl border border-slate-700/50 overflow-hidden"
    >
      <div className="p-4 border-b border-slate-700/50 bg-gradient-to-r from-purple-600/20 to-pink-600/20">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <Pill className="w-5 h-5 text-purple-400" />
          Drug-Likeness Assessment
        </h3>
        <p className="text-sm text-slate-400 mt-1">
          {passedRules} of {totalRules} rules passed
        </p>
      </div>

      <div className="p-4 space-y-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${getScoreColor(result.overallScore)} flex items-center justify-center shadow-lg`}>
                <Award className="w-7 h-7 text-white" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Overall Score</p>
                <p className={`text-3xl font-bold ${getScoreTextColor(result.overallScore)}`}>
                  {result.overallScore}
                  <span className="text-lg text-slate-500">/100</span>
                </p>
              </div>
            </div>
            <div className={`px-4 py-2 rounded-full text-sm font-semibold bg-gradient-to-r ${getScoreColor(result.overallScore)} text-white`}>
              {getScoreLabel(result.overallScore)}
            </div>
          </div>

          <div className="h-3 bg-slate-700/50 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${result.overallScore}%` }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className={`h-full rounded-full bg-gradient-to-r ${getScoreColor(result.overallScore)} shadow-lg`}
            />
          </div>

          <div className="mt-4 p-3 bg-slate-700/30 rounded-lg border border-slate-600/30">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
              <p className="text-sm text-slate-300">{result.summary}</p>
            </div>
          </div>
        </motion.div>

        <div className="space-y-3">
          {result.rules.map((rule, idx) => (
            <RuleItem key={rule.ruleName} rule={rule} index={idx} />
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="pt-3 border-t border-slate-700/50"
        >
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span className="text-slate-400">{passedRules} passed</span>
              </div>
              <div className="flex items-center gap-1">
                <XCircle className="w-4 h-4 text-red-400" />
                <span className="text-slate-400">{totalRules - passedRules} failed</span>
              </div>
            </div>
            <div className="text-right">
              <span className={`font-semibold ${getScoreTextColor(result.overallScore)}`}>
                {Math.round((passedRules / totalRules) * 100)}%
              </span>
              <span className="text-slate-500"> pass rate</span>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
