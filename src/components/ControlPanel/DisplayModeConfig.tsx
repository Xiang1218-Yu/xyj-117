import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, RotateCcw, Settings } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { DisplayMode, DisplayModeConfig } from '../../types';

interface DisplayModeConfigProps {
  displayMode: DisplayMode;
}

const modeLabels: Record<DisplayMode, string> = {
  ball_stick: '球棍模型',
  space_filling: '空间填充',
  ribbon: '带状图',
  surface: '电子云',
  line: '线型模型',
  stick: '棍棒模型',
  point_cloud: '点云模型',
};

interface ConfigFieldProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit?: string;
  onChange: (value: number) => void;
}

function ConfigSlider({ label, value, min, max, step, unit, onChange }: ConfigFieldProps) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center">
        <label className="text-xs text-gray-400">{label}</label>
        <span className="text-xs font-mono text-quantum-cyan">
          {value.toFixed(step < 1 ? 2 : 0)}{unit || ''}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-1.5 bg-space-600 rounded-lg appearance-none cursor-pointer accent-quantum-cyan"
      />
    </div>
  );
}

interface ConfigSelectProps {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}

function ConfigSelect({ label, value, options, onChange }: ConfigSelectProps) {
  return (
    <div className="space-y-1">
      <label className="text-xs text-gray-400 block">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-2 py-1.5 bg-space-700/50 border border-space-600 rounded-lg text-xs text-white focus:outline-none focus:border-quantum-cyan/50"
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
}

interface ConfigToggleProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

function ConfigToggle({ label, checked, onChange }: ConfigToggleProps) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-gray-400">{label}</span>
      <button
        onClick={() => onChange(!checked)}
        className={`w-10 h-5 rounded-full transition-colors relative ${
          checked ? 'bg-quantum-cyan' : 'bg-space-600'
        }`}
      >
        <motion.div
          animate={{ x: checked ? 20 : 2 }}
          className="w-4 h-4 bg-white rounded-full shadow-lg absolute top-0.5"
        />
      </button>
    </div>
  );
}

interface ConfigColorProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

function ConfigColor({ label, value, onChange }: ConfigColorProps) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-gray-400">{label}</span>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-8 h-8 rounded cursor-pointer bg-transparent border-2 border-space-600"
        />
        <span className="text-xs font-mono text-gray-500">{value}</span>
      </div>
    </div>
  );
}

export function DisplayModeConfig({ displayMode }: DisplayModeConfigProps) {
  const [expanded, setExpanded] = useState(false);
  const { displayConfig, setDisplayConfig, resetDisplayConfig } = useStore();

  const config = displayConfig[displayMode];

  const handleConfigChange = <K extends keyof DisplayModeConfig[DisplayMode]>(
    key: K,
    value: DisplayModeConfig[DisplayMode][K]
  ) => {
    setDisplayConfig(displayMode, { [key]: value } as Partial<DisplayModeConfig[DisplayMode]>);
  };

  const handleReset = () => {
    resetDisplayConfig(displayMode);
  };

  const renderConfigFields = () => {
    switch (displayMode) {
      case 'ball_stick':
        return (
          <div className="space-y-4">
            <ConfigSlider
              label="原子大小比例"
              value={(config as any).atomScale}
              min={0.1}
              max={2}
              step={0.1}
              onChange={(v) => handleConfigChange('atomScale', v)}
            />
            <ConfigSlider
              label="化学键半径"
              value={(config as any).bondRadius}
              min={0.05}
              max={0.5}
              step={0.05}
              onChange={(v) => handleConfigChange('bondRadius', v)}
            />
            <div className="border-t border-space-700 pt-3">
              <p className="text-xs text-gray-500 mb-2">原子材质</p>
              <ConfigSlider
                label="金属度"
                value={(config as any).atomMetalness}
                min={0}
                max={1}
                step={0.1}
                onChange={(v) => handleConfigChange('atomMetalness', v)}
              />
              <ConfigSlider
                label="粗糙度"
                value={(config as any).atomRoughness}
                min={0}
                max={1}
                step={0.1}
                onChange={(v) => handleConfigChange('atomRoughness', v)}
              />
            </div>
            <div className="border-t border-space-700 pt-3">
              <p className="text-xs text-gray-500 mb-2">化学键材质</p>
              <ConfigSlider
                label="金属度"
                value={(config as any).bondMetalness}
                min={0}
                max={1}
                step={0.1}
                onChange={(v) => handleConfigChange('bondMetalness', v)}
              />
              <ConfigSlider
                label="粗糙度"
                value={(config as any).bondRoughness}
                min={0}
                max={1}
                step={0.1}
                onChange={(v) => handleConfigChange('bondRoughness', v)}
              />
            </div>
          </div>
        );

      case 'space_filling':
        return (
          <div className="space-y-4">
            <ConfigSlider
              label="原子大小比例"
              value={(config as any).atomScale}
              min={0.5}
              max={2}
              step={0.1}
              onChange={(v) => handleConfigChange('atomScale', v)}
            />
            <ConfigSlider
              label="金属度"
              value={(config as any).metalness}
              min={0}
              max={1}
              step={0.1}
              onChange={(v) => handleConfigChange('metalness', v)}
            />
            <ConfigSlider
              label="粗糙度"
              value={(config as any).roughness}
              min={0}
              max={1}
              step={0.1}
              onChange={(v) => handleConfigChange('roughness', v)}
            />
          </div>
        );

      case 'ribbon':
        return (
          <div className="space-y-4">
            <ConfigSlider
              label="丝带厚度"
              value={(config as any).thickness}
              min={0.1}
              max={1}
              step={0.1}
              onChange={(v) => handleConfigChange('thickness', v)}
            />
            <ConfigSlider
              label="平滑度"
              value={(config as any).tension}
              min={0}
              max={1}
              step={0.1}
              onChange={(v) => handleConfigChange('tension', v)}
            />
            <ConfigSlider
              label="分辨率"
              value={(config as any).resolution}
              min={5}
              max={50}
              step={5}
              onChange={(v) => handleConfigChange('resolution', v)}
            />
            <ConfigSelect
              label="颜色方式"
              value={(config as any).colorBy}
              options={[
                { value: 'secondary', label: '二级结构' },
                { value: 'chain', label: '链' },
                { value: 'residue', label: '残基' },
              ]}
              onChange={(v) => handleConfigChange('colorBy', v as any)}
            />
          </div>
        );

      case 'surface':
        return (
          <div className="space-y-4">
            <ConfigSlider
              label="不透明度"
              value={(config as any).opacity}
              min={0.1}
              max={1}
              step={0.1}
              onChange={(v) => handleConfigChange('opacity', v)}
            />
            <ConfigSelect
              label="渲染质量"
              value={(config as any).quality}
              options={[
                { value: 'low', label: '低' },
                { value: 'medium', label: '中' },
                { value: 'high', label: '高' },
              ]}
              onChange={(v) => handleConfigChange('quality', v as any)}
            />
            <ConfigSelect
              label="配色方案"
              value={(config as any).colorScheme}
              options={[
                { value: 'electrostatic', label: '静电势' },
                { value: 'hydrophobic', label: '疏水性' },
                { value: 'chain', label: '链' },
              ]}
              onChange={(v) => handleConfigChange('colorScheme', v as any)}
            />
          </div>
        );

      case 'line':
        return (
          <div className="space-y-4">
            <ConfigSlider
              label="线条宽度"
              value={(config as any).lineWidth}
              min={1}
              max={10}
              step={1}
              unit="px"
              onChange={(v) => handleConfigChange('lineWidth', v)}
            />
            <ConfigSelect
              label="颜色方式"
              value={(config as any).colorBy}
              options={[
                { value: 'element', label: '按元素' },
                { value: 'chain', label: '按链' },
                { value: 'uniform', label: '统一颜色' },
              ]}
              onChange={(v) => handleConfigChange('colorBy', v as any)}
            />
            {(config as any).colorBy === 'uniform' && (
              <ConfigColor
                label="统一颜色"
                value={(config as any).uniformColor}
                onChange={(v) => handleConfigChange('uniformColor', v)}
              />
            )}
            <div className="border-t border-space-700 pt-3">
              <p className="text-xs text-gray-500 mb-2">原子显示</p>
              <ConfigToggle
                label="显示原子点"
                checked={(config as any).showAtomPoints}
                onChange={(v) => handleConfigChange('showAtomPoints', v)}
              />
              {(config as any).showAtomPoints && (
                <div className="mt-3">
                  <ConfigSlider
                    label="原子点大小"
                    value={(config as any).atomPointSize}
                    min={0.1}
                    max={1}
                    step={0.1}
                    onChange={(v) => handleConfigChange('atomPointSize', v)}
                  />
                </div>
              )}
            </div>
          </div>
        );

      case 'stick':
        return (
          <div className="space-y-4">
            <ConfigSlider
              label="棍棒半径"
              value={(config as any).stickRadius}
              min={0.05}
              max={0.5}
              step={0.05}
              onChange={(v) => handleConfigChange('stickRadius', v)}
            />
            <ConfigSlider
              label="金属度"
              value={(config as any).metalness}
              min={0}
              max={1}
              step={0.1}
              onChange={(v) => handleConfigChange('metalness', v)}
            />
            <ConfigSlider
              label="粗糙度"
              value={(config as any).roughness}
              min={0}
              max={1}
              step={0.1}
              onChange={(v) => handleConfigChange('roughness', v)}
            />
            <div className="border-t border-space-700 pt-3">
              <p className="text-xs text-gray-500 mb-2">原子显示</p>
              <ConfigToggle
                label="显示原子球"
                checked={(config as any).showAtomSpheres}
                onChange={(v) => handleConfigChange('showAtomSpheres', v)}
              />
              {(config as any).showAtomSpheres && (
                <div className="mt-3">
                  <ConfigSlider
                    label="原子球比例"
                    value={(config as any).atomSphereScale}
                    min={0.1}
                    max={1}
                    step={0.1}
                    onChange={(v) => handleConfigChange('atomSphereScale', v)}
                  />
                </div>
              )}
            </div>
          </div>
        );

      case 'point_cloud':
        return (
          <div className="space-y-4">
            <ConfigSlider
              label="点大小"
              value={(config as any).pointSize}
              min={0.1}
              max={2}
              step={0.1}
              onChange={(v) => handleConfigChange('pointSize', v)}
            />
            <ConfigSlider
              label="不透明度"
              value={(config as any).opacity}
              min={0.1}
              max={1}
              step={0.1}
              onChange={(v) => handleConfigChange('opacity', v)}
            />
            <ConfigToggle
              label="距离衰减"
              checked={(config as any).attenuation}
              onChange={(v) => handleConfigChange('attenuation', v)}
            />
            <ConfigSelect
              label="颜色方式"
              value={(config as any).colorBy}
              options={[
                { value: 'element', label: '按元素' },
                { value: 'chain', label: '按链' },
                { value: 'residue', label: '按残基' },
                { value: 'bfactor', label: '按B因子' },
              ]}
              onChange={(v) => handleConfigChange('colorBy', v as any)}
            />
            <ConfigSelect
              label="大小方式"
              value={(config as any).sizeBy}
              options={[
                { value: 'element', label: '按元素' },
                { value: 'constant', label: '统一大小' },
              ]}
              onChange={(v) => handleConfigChange('sizeBy', v as any)}
            />
            {(config as any).sizeBy === 'constant' && (
              <ConfigSlider
                label="统一大小"
                value={(config as any).constantSize}
                min={0.1}
                max={2}
                step={0.1}
                onChange={(v) => handleConfigChange('constantSize', v)}
              />
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="border-t border-space-700">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-space-700/30 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Settings size={18} className="text-quantum-cyan" />
          <span className="font-semibold text-white text-sm">
            {modeLabels[displayMode]}设置
          </span>
        </div>
        <div className="flex items-center gap-2">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={(e) => {
              e.stopPropagation();
              handleReset();
            }}
            className="p-1 rounded hover:bg-space-600 text-gray-400 hover:text-white transition-colors"
            title="重置为默认"
          >
            <RotateCcw size={14} />
          </motion.button>
          {expanded ? (
            <ChevronUp size={18} className="text-gray-400" />
          ) : (
            <ChevronDown size={18} className="text-gray-400" />
          )}
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="p-4 pt-0 space-y-4">
              {renderConfigFields()}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
