import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../../store/useStore';
import { calculateAllProperties } from '../../utils/propertyCalculator';
import { exportPropertyReport } from '../../utils/pdfExporter';
import { QuantumDescriptorsCard } from './QuantumDescriptorsCard';
import { ADMETCard } from './ADMETCard';
import { DrugLikenessCard } from './DrugLikenessCard';
import { 
  Calculator, 
  Atom, 
  Activity, 
  Pill, 
  Download, 
  Loader2,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  FileText,
} from 'lucide-react';
import { PropertyCalculationType, PDFExportConfig } from '../../types';

const calculationTypes: { type: PropertyCalculationType; label: string; icon: typeof Atom; description: string }[] = [
  { type: 'quantum', label: 'Quantum Descriptors', icon: Atom, description: '20+ molecular descriptors' },
  { type: 'admet', label: 'ADMET Prediction', icon: Activity, description: '16 ADMET properties' },
  { type: 'drug_likeness', label: 'Drug-Likeness', icon: Pill, description: '5 medicinal chemistry rules' },
];

const defaultExportConfig: PDFExportConfig = {
  includeMoleculeInfo: true,
  includeQuantum: true,
  includeADMET: true,
  includeDrugLikeness: true,
  include3DScreenshot: false,
  pageSize: 'a4',
};

export function PropertyCalculationPanel() {
  const {
    currentMolecule,
    propertyCalculation,
    isExportingPDF,
    toggleCalculationType,
    startCalculation,
    setCalculationError,
    setQuantumDescriptors,
    setADMETProperties,
    setDrugLikeness,
    completeCalculation,
    resetPropertyCalculation,
    setExportingPDF,
  } = useStore();

  const [showExportModal, setShowExportModal] = useState(false);
  const [exportConfig, setExportConfig] = useState<PDFExportConfig>(defaultExportConfig);

  const hasResults = propertyCalculation.quantumDescriptors || 
                     propertyCalculation.admetProperties || 
                     propertyCalculation.drugLikeness;

  const handleCalculate = async () => {
    if (!currentMolecule) {
      setCalculationError('Please select a molecule first');
      return;
    }

    if (propertyCalculation.selectedTypes.length === 0) {
      setCalculationError('Please select at least one calculation type');
      return;
    }

    startCalculation();

    try {
      const results = await calculateAllProperties(
        currentMolecule,
        propertyCalculation.selectedTypes
      );

      if (results.quantumDescriptors) {
        setQuantumDescriptors(results.quantumDescriptors);
      }
      if (results.admetProperties) {
        setADMETProperties(results.admetProperties);
      }
      if (results.drugLikeness) {
        setDrugLikeness(results.drugLikeness);
      }

      completeCalculation();
    } catch (error) {
      setCalculationError(error instanceof Error ? error.message : 'Calculation failed');
    }
  };

  const handleExportPDF = async () => {
    if (!currentMolecule) return;

    setExportingPDF(true);
    try {
      await exportPropertyReport(
        currentMolecule,
        propertyCalculation.quantumDescriptors,
        propertyCalculation.admetProperties,
        propertyCalculation.drugLikeness,
        exportConfig
      );
      setShowExportModal(false);
    } catch (error) {
      console.error('PDF export failed:', error);
    } finally {
      setExportingPDF(false);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-slate-700/50 bg-slate-900/50">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <Calculator className="w-5 h-5 text-cyan-400" />
          Property Calculator
        </h3>
        <p className="text-sm text-slate-400 mt-1">
          Calculate molecular properties and drug-likeness
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {!hasResults && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
              <h4 className="text-sm font-semibold text-slate-200 mb-3">Select Calculation Types</h4>
              
              <div className="space-y-2 mb-4">
                {calculationTypes.map(({ type, label, icon: Icon, description }) => {
                  const isSelected = propertyCalculation.selectedTypes.includes(type) || 
                                    propertyCalculation.selectedTypes.includes('all');
                  return (
                    <button
                      key={type}
                      onClick={() => toggleCalculationType(type)}
                      disabled={propertyCalculation.isCalculating}
                      className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-all ${
                        isSelected
                          ? 'bg-cyan-500/20 border-cyan-500/50 text-white'
                          : 'bg-slate-700/30 border-slate-600/50 text-slate-300 hover:bg-slate-700/50'
                      } ${propertyCalculation.isCalculating ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        isSelected ? 'bg-cyan-500/30' : 'bg-slate-600/30'
                      }`}>
                        <Icon className={`w-5 h-5 ${isSelected ? 'text-cyan-400' : 'text-slate-400'}`} />
                      </div>
                      <div className="text-left flex-1">
                        <p className="font-medium text-sm">{label}</p>
                        <p className="text-xs text-slate-500">{description}</p>
                      </div>
                      {isSelected && <CheckCircle2 className="w-5 h-5 text-cyan-400" />}
                    </button>
                  );
                })}
              </div>

              {propertyCalculation.error && (
                <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg mb-4">
                  <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                  <p className="text-sm text-red-300">{propertyCalculation.error}</p>
                </div>
              )}

              <button
                onClick={handleCalculate}
                disabled={propertyCalculation.isCalculating || !currentMolecule}
                className="w-full py-3 px-4 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-semibold rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-cyan-500/25"
              >
                {propertyCalculation.isCalculating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Calculating...
                  </>
                ) : (
                  <>
                    <Calculator className="w-5 h-5" />
                    Calculate Properties
                  </>
                )}
              </button>
              
              {!currentMolecule && (
                <p className="text-xs text-amber-400 text-center mt-2 flex items-center justify-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  Select a molecule from the library first
                </p>
              )}
            </div>
          </motion.div>
        )}

        <AnimatePresence mode="popLayout">
          {hasResults && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between bg-slate-800/50 rounded-xl p-3 border border-slate-700/50">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <div>
                    <p className="text-sm font-medium text-white">Calculation Complete</p>
                    {propertyCalculation.calculatedAt && (
                      <p className="text-xs text-slate-500">
                        {propertyCalculation.calculatedAt.toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowExportModal(true)}
                    disabled={isExportingPDF}
                    className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white text-sm font-medium rounded-lg transition-all disabled:opacity-50"
                  >
                    {isExportingPDF ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Download className="w-4 h-4" />
                    )}
                    Export PDF
                  </button>
                  <button
                    onClick={resetPropertyCalculation}
                    className="flex items-center gap-2 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm font-medium rounded-lg transition-all"
                  >
                    <RefreshCw className="w-4 h-4" />
                    New
                  </button>
                </div>
              </div>

              {propertyCalculation.quantumDescriptors && (
                <QuantumDescriptorsCard descriptors={propertyCalculation.quantumDescriptors} />
              )}

              {propertyCalculation.admetProperties && (
                <ADMETCard properties={propertyCalculation.admetProperties} />
              )}

              {propertyCalculation.drugLikeness && (
                <DrugLikenessCard result={propertyCalculation.drugLikeness} />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {showExportModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowExportModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-slate-900 rounded-2xl border border-slate-700 w-full max-w-md overflow-hidden"
            >
              <div className="p-4 border-b border-slate-700/50">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-emerald-400" />
                  Export PDF Report
                </h3>
              </div>

              <div className="p-4 space-y-3">
                <label className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg cursor-pointer hover:bg-slate-800 transition-colors">
                  <div className="flex items-center gap-2">
                    <Atom className="w-4 h-4 text-slate-400" />
                    <span className="text-sm text-slate-200">Molecule Information</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={exportConfig.includeMoleculeInfo}
                    onChange={(e) => setExportConfig({ ...exportConfig, includeMoleculeInfo: e.target.checked })}
                    className="w-4 h-4 accent-cyan-500"
                  />
                </label>

                <label className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg cursor-pointer hover:bg-slate-800 transition-colors">
                  <div className="flex items-center gap-2">
                    <Calculator className="w-4 h-4 text-slate-400" />
                    <span className="text-sm text-slate-200">Quantum Descriptors</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={exportConfig.includeQuantum}
                    onChange={(e) => setExportConfig({ ...exportConfig, includeQuantum: e.target.checked })}
                    className="w-4 h-4 accent-cyan-500"
                  />
                </label>

                <label className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg cursor-pointer hover:bg-slate-800 transition-colors">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-slate-400" />
                    <span className="text-sm text-slate-200">ADMET Properties</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={exportConfig.includeADMET}
                    onChange={(e) => setExportConfig({ ...exportConfig, includeADMET: e.target.checked })}
                    className="w-4 h-4 accent-cyan-500"
                  />
                </label>

                <label className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg cursor-pointer hover:bg-slate-800 transition-colors">
                  <div className="flex items-center gap-2">
                    <Pill className="w-4 h-4 text-slate-400" />
                    <span className="text-sm text-slate-200">Drug-Likeness Assessment</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={exportConfig.includeDrugLikeness}
                    onChange={(e) => setExportConfig({ ...exportConfig, includeDrugLikeness: e.target.checked })}
                    className="w-4 h-4 accent-cyan-500"
                  />
                </label>

                <div className="pt-2">
                  <label className="text-sm text-slate-400 mb-2 block">Page Size</label>
                  <div className="flex gap-2">
                    {(['a4', 'letter'] as const).map((size) => (
                      <button
                        key={size}
                        onClick={() => setExportConfig({ ...exportConfig, pageSize: size })}
                        className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                          exportConfig.pageSize === size
                            ? 'bg-cyan-500 text-white'
                            : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                        }`}
                      >
                        {size.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-4 border-t border-slate-700/50 flex gap-3">
                <button
                  onClick={() => setShowExportModal(false)}
                  className="flex-1 py-2.5 px-4 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-lg transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleExportPDF}
                  disabled={isExportingPDF}
                  className="flex-1 py-2.5 px-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-medium rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isExportingPDF ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                  {isExportingPDF ? 'Generating...' : 'Export'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
