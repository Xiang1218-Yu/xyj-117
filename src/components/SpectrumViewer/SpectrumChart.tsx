import { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
  ReferenceLine,
  ComposedChart,
  Bar,
  Cell,
} from 'recharts';
import { motion } from 'framer-motion';
import { 
  SpectrumPeak, 
  IRSpectrum, 
  NMRSpectrum, 
  UVViSpectrum,
  SpectrumResult,
} from '../../types';

interface SpectrumChartProps {
  spectrum: SpectrumResult;
  onPeakClick?: (peak: SpectrumPeak) => void;
  selectedPeak?: SpectrumPeak | null;
}

const SPECTRUM_COLORS: Record<string, string> = {
  ir: 'from-rose-500 to-orange-500',
  nmr_1h: 'from-blue-500 to-cyan-500',
  nmr_13c: 'from-emerald-500 to-teal-500',
  uv_vis: 'from-purple-500 to-pink-500',
};

const CHART_STROKE: Record<string, string> = {
  ir: '#f43f5e',
  nmr_1h: '#3b82f6',
  nmr_13c: '#10b981',
  uv_vis: '#a855f7',
};

function formatDataForIR(spectrum: IRSpectrum) {
  const sortedPeaks = [...spectrum.peaks].sort((a, b) => b.wavelength - a.wavelength);
  return sortedPeaks.map(p => ({
    x: p.wavelength,
    y: Math.round((1 - p.intensity) * 100) / 100,
    transmittance: p.intensity,
    label: p.label,
    assignment: p.assignment,
  }));
}

function formatDataForNMR(spectrum: NMRSpectrum) {
  const sortedPeaks = [...spectrum.peaks].sort((a, b) => b.wavelength - a.wavelength);
  return sortedPeaks.map(p => ({
    x: p.wavelength,
    y: p.intensity,
    label: p.label,
    assignment: p.assignment,
  }));
}

function formatDataForUVVis(spectrum: UVViSpectrum) {
  return spectrum.peaks.map(p => ({
    x: p.wavelength,
    y: p.intensity,
    label: p.label,
    assignment: p.assignment,
  }));
}

function CustomTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-space-800/95 backdrop-blur-md border border-space-600 rounded-lg p-3 shadow-2xl">
        <p className="text-xs text-gray-400 mb-1">{label}</p>
        <p className="text-sm font-semibold text-white">
          {data.label || `${data.x.toFixed(2)}`}
        </p>
        {data.assignment && (
          <p className="text-xs text-quantum-cyan mt-1">{data.assignment}</p>
        )}
        {data.transmittance !== undefined && (
          <p className="text-xs text-gray-400 mt-1">
            透射率: {(data.transmittance * 100).toFixed(1)}%
          </p>
        )}
        {data.y !== undefined && data.transmittance === undefined && (
          <p className="text-xs text-gray-400 mt-1">
            强度: {(data.y * 100).toFixed(1)}%
          </p>
        )}
      </div>
    );
  }
  return null;
}

export function SpectrumChart({ spectrum, onPeakClick, selectedPeak }: SpectrumChartProps) {
  const chartData = useMemo(() => {
    switch (spectrum.type) {
      case 'ir':
        return formatDataForIR(spectrum);
      case 'nmr_1h':
      case 'nmr_13c':
        return formatDataForNMR(spectrum);
      case 'uv_vis':
        return formatDataForUVVis(spectrum);
      default:
        return [];
    }
  }, [spectrum]);

  const getXAxisLabel = () => {
    switch (spectrum.type) {
      case 'ir':
        return '波数 (cm⁻¹)';
      case 'nmr_1h':
      case 'nmr_13c':
        return '化学位移 (ppm)';
      case 'uv_vis':
        return '波长 (nm)';
      default:
        return '';
    }
  };

  const getYAxisLabel = () => {
    switch (spectrum.type) {
      case 'ir':
        return '吸光度';
      case 'nmr_1h':
      case 'nmr_13c':
        return '强度';
      case 'uv_vis':
        return '吸光度';
      default:
        return '';
    }
  };

  const isReversed = spectrum.type === 'ir' || spectrum.type === 'nmr_1h' || spectrum.type === 'nmr_13c';

  const handleClick = (data: any) => {
    if (onPeakClick && data && data.activePayload && data.activePayload[0]) {
      const peakData = data.activePayload[0].payload;
      const peak: SpectrumPeak = {
        wavelength: peakData.x,
        intensity: peakData.y,
        label: peakData.label,
        assignment: peakData.assignment,
      };
      onPeakClick(peak);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full h-full"
    >
      <div className={`h-1 w-full bg-gradient-to-r ${SPECTRUM_COLORS[spectrum.type]} rounded-t-lg`} />
      <div className="p-4 h-[calc(100%-4px)]">
        <ResponsiveContainer width="100%" height="100%">
          {spectrum.type === 'ir' ? (
            <AreaChart data={chartData} onClick={handleClick}>
              <defs>
                <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={CHART_STROKE[spectrum.type]} stopOpacity={0.3}/>
                  <stop offset="95%" stopColor={CHART_STROKE[spectrum.type]} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
              <XAxis 
                dataKey="x" 
                stroke="#6b7280"
                tick={{ fill: '#9ca3af', fontSize: 11 }}
                reversed={isReversed}
                domain={spectrum.type === 'ir' ? ['auto', 'auto'] : undefined}
                label={{ value: getXAxisLabel(), position: 'bottom', fill: '#9ca3af', fontSize: 12, offset: 5 }}
              />
              <YAxis 
                stroke="#6b7280"
                tick={{ fill: '#9ca3af', fontSize: 11 }}
                domain={[0, 1]}
                tickFormatter={(value) => value.toFixed(1)}
                label={{ value: getYAxisLabel(), angle: -90, position: 'insideLeft', fill: '#9ca3af', fontSize: 12, offset: 10 }}
              />
              <Tooltip content={<CustomTooltip />} />
              {selectedPeak && (
                <ReferenceLine 
                  x={selectedPeak.wavelength} 
                  stroke="#fbbf24" 
                  strokeDasharray="5 5"
                  strokeWidth={2}
                />
              )}
              <Area 
                type="monotone" 
                dataKey="y" 
                stroke={CHART_STROKE[spectrum.type]} 
                strokeWidth={2}
                fill="url(#colorGradient)"
                dot={false}
                activeDot={{ r: 6, fill: CHART_STROKE[spectrum.type], stroke: '#fff', strokeWidth: 2 }}
              />
            </AreaChart>
          ) : spectrum.type === 'nmr_1h' || spectrum.type === 'nmr_13c' ? (
            <ComposedChart data={chartData} onClick={handleClick}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
              <XAxis 
                dataKey="x" 
                stroke="#6b7280"
                tick={{ fill: '#9ca3af', fontSize: 11 }}
                reversed={isReversed}
                label={{ value: getXAxisLabel(), position: 'bottom', fill: '#9ca3af', fontSize: 12, offset: 5 }}
              />
              <YAxis 
                stroke="#6b7280"
                tick={{ fill: '#9ca3af', fontSize: 11 }}
                domain={[0, 'auto']}
                label={{ value: getYAxisLabel(), angle: -90, position: 'insideLeft', fill: '#9ca3af', fontSize: 12, offset: 10 }}
              />
              <Tooltip content={<CustomTooltip />} />
              {selectedPeak && (
                <ReferenceLine 
                  x={selectedPeak.wavelength} 
                  stroke="#fbbf24" 
                  strokeDasharray="5 5"
                  strokeWidth={2}
                />
              )}
              <Bar 
                dataKey="y" 
                fill={CHART_STROKE[spectrum.type]}
                radius={[2, 2, 0, 0]}
                barSize={3}
              >
                {chartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fillOpacity={
                      selectedPeak && Math.abs(entry.x - selectedPeak.wavelength) < 0.2 
                        ? 1 
                        : 0.7
                    }
                  />
                ))}
              </Bar>
            </ComposedChart>
          ) : (
            <AreaChart data={chartData} onClick={handleClick}>
              <defs>
                <linearGradient id="uvGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={CHART_STROKE[spectrum.type]} stopOpacity={0.4}/>
                  <stop offset="95%" stopColor={CHART_STROKE[spectrum.type]} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
              <XAxis 
                dataKey="x" 
                stroke="#6b7280"
                tick={{ fill: '#9ca3af', fontSize: 11 }}
                label={{ value: getXAxisLabel(), position: 'bottom', fill: '#9ca3af', fontSize: 12, offset: 5 }}
              />
              <YAxis 
                stroke="#6b7280"
                tick={{ fill: '#9ca3af', fontSize: 11 }}
                domain={[0, 'auto']}
                label={{ value: getYAxisLabel(), angle: -90, position: 'insideLeft', fill: '#9ca3af', fontSize: 12, offset: 10 }}
              />
              <Tooltip content={<CustomTooltip />} />
              {selectedPeak && (
                <ReferenceLine 
                  x={selectedPeak.wavelength} 
                  stroke="#fbbf24" 
                  strokeDasharray="5 5"
                  strokeWidth={2}
                />
              )}
              <Area 
                type="monotone" 
                dataKey="y" 
                stroke={CHART_STROKE[spectrum.type]} 
                strokeWidth={2}
                fill="url(#uvGradient)"
                dot={false}
                activeDot={{ r: 6, fill: CHART_STROKE[spectrum.type], stroke: '#fff', strokeWidth: 2 }}
              />
            </AreaChart>
          )}
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
