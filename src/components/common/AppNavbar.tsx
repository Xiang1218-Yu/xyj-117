import { motion } from 'framer-motion';
import { 
  Atom,
  FlaskConical,
  Activity,
  Workflow,
  Home,
  LucideIcon
} from 'lucide-react';
import { useLocation } from 'react-router-dom';

interface NavItem {
  path: string;
  icon: LucideIcon;
  label: string;
  gradient: string;
  borderColor: string;
  textColor: string;
}

const navItems: NavItem[] = [
  {
    path: '/',
    icon: Home,
    label: '工作台',
    gradient: 'from-blue-500/20 to-cyan-500/20',
    borderColor: 'border-blue-500/30',
    textColor: 'text-blue-400',
  },
  {
    path: '/reaction-mechanism',
    icon: FlaskConical,
    label: '反应机理',
    gradient: 'from-amber-500/20 to-orange-500/20',
    borderColor: 'border-amber-500/30',
    textColor: 'text-amber-400',
  },
  {
    path: '/spectrum-simulator',
    icon: Activity,
    label: '光谱模拟',
    gradient: 'from-purple-500/20 to-pink-500/20',
    borderColor: 'border-purple-500/30',
    textColor: 'text-purple-400',
  },
  {
    path: '/workflow-editor',
    icon: Workflow,
    label: '工作流',
    gradient: 'from-emerald-500/20 to-teal-500/20',
    borderColor: 'border-emerald-500/30',
    textColor: 'text-emerald-400',
  },
];

interface AppNavbarProps {
  className?: string;
}

export default function AppNavbar({ className }: AppNavbarProps) {
  const location = useLocation();
  
  const handleNavigate = (path: string) => {
    window.location.href = path;
  };
  
  return (
    <div className={className}>
      <div className="flex items-center gap-3 px-4 py-2">
        <div className="flex items-center gap-3 mr-4">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Atom size={20} className="text-white" />
          </div>
          <div>
            <h1 className="font-display font-bold text-lg bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
              Molecular Lab
            </h1>
            <p className="text-[10px] text-slate-500 font-mono -mt-1">化学信息学平台</p>
          </div>
        </div>
        
        <div className="h-6 w-px bg-slate-700" />
        
        <div className="flex items-center gap-1">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <motion.button
                key={item.path}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleNavigate(item.path)}
                className={[
                  'flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
                  isActive
                    ? `bg-gradient-to-r ${item.gradient} ${item.textColor} border ${item.borderColor}`
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
                ].join(' ')}
                title={item.label}
              >
                <Icon size={16} />
                <span className="hidden md:inline">{item.label}</span>
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
