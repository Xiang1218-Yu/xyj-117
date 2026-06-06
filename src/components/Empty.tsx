import { motion } from 'framer-motion';
import { Atom, Sparkles } from 'lucide-react';

export function Empty() {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-space-900">
      <motion.div
        animate={{ 
          y: [0, -10, 0],
          rotate: [0, 5, -5, 0]
        }}
        transition={{ 
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="relative mb-6"
      >
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-quantum-blue/20 to-quantum-purple/20 flex items-center justify-center">
          <Atom size={48} className="text-quantum-blue animate-pulse" />
        </div>
        <motion.div
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.5, 1, 0.5]
          }}
          transition={{ 
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-quantum-purple/20 flex items-center justify-center"
        >
          <Sparkles size={16} className="text-quantum-purple" />
        </motion.div>
      </motion.div>
      
      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="font-display text-2xl font-bold bg-gradient-to-r from-quantum-blue to-quantum-purple bg-clip-text text-transparent mb-2"
      >
        Molecular Lab
      </motion.h2>
      
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="text-gray-500 text-sm mb-8 text-center max-w-md px-4"
      >
        从左侧分子库选择一个分子开始探索
        <br />
        <span className="text-xs text-gray-600">支持蛋白质折叠、分子对接、材料性质计算</span>
      </motion.p>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="flex gap-4"
      >
        <div className="flex flex-col items-center gap-2 px-6 py-4 bg-space-800/50 rounded-xl border border-space-700">
          <div className="w-10 h-10 rounded-lg bg-quantum-blue/20 flex items-center justify-center">
            <span className="text-quantum-blue font-bold text-lg">3D</span>
          </div>
          <span className="text-xs text-gray-400">实时渲染</span>
        </div>
        <div className="flex flex-col items-center gap-2 px-6 py-4 bg-space-800/50 rounded-xl border border-space-700">
          <div className="w-10 h-10 rounded-lg bg-quantum-purple/20 flex items-center justify-center">
            <span className="text-quantum-purple font-bold text-lg">⚛</span>
          </div>
          <span className="text-xs text-gray-400">分子模拟</span>
        </div>
        <div className="flex flex-col items-center gap-2 px-6 py-4 bg-space-800/50 rounded-xl border border-space-700">
          <div className="w-10 h-10 rounded-lg bg-quantum-cyan/20 flex items-center justify-center">
            <span className="text-quantum-cyan font-bold text-lg">📊</span>
          </div>
          <span className="text-xs text-gray-400">数据分析</span>
        </div>
      </motion.div>
    </div>
  );
}
