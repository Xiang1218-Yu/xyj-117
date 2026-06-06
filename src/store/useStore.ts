import { create } from 'zustand';
import { 
  Molecule, 
  DisplayMode, 
  SimulationType, 
  SimulationState, 
  SimulationParameters,
  CalculationResult,
  Atom,
  Measurement,
} from '../types';
import { moleculeLibrary, caffeineMolecule } from '../data/molecules';

interface MoleculeStore {
  currentMolecule: Molecule | null;
  currentAtoms: Atom[];
  selectedAtomId: string | null;
  displayMode: DisplayMode;
  showLabels: boolean;
  showHydrogens: boolean;
  autoRotate: boolean;
  backgroundColor: string;
  showElectronCloud: boolean;
  setCurrentMolecule: (molecule: Molecule | null) => void;
  setCurrentAtoms: (atoms: Atom[]) => void;
  setSelectedAtom: (atomId: string | null) => void;
  setDisplayMode: (mode: DisplayMode) => void;
  toggleLabels: () => void;
  toggleHydrogens: () => void;
  toggleAutoRotate: () => void;
  setBackgroundColor: (color: string) => void;
  setShowElectronCloud: (show: boolean) => void;
  resetView: () => void;
}

interface SimulationStore {
  simulation: SimulationState;
  calculationResult: CalculationResult | null;
  selectedSimulationType: SimulationType | null;
  ligandMolecule: Molecule | null;
  targetMolecule: Molecule | null;
  setSimulationType: (type: SimulationType | null) => void;
  setSimulationParameters: (params: Partial<SimulationParameters>) => void;
  startSimulation: () => void;
  stopSimulation: () => void;
  resetSimulation: () => void;
  updateSimulationStep: (step: number, energy: number, rmsd?: number, rg?: number) => void;
  setCalculationResult: (result: CalculationResult | null) => void;
  setLigandMolecule: (molecule: Molecule | null) => void;
  setTargetMolecule: (molecule: Molecule | null) => void;
}

interface UIStore {
  leftPanelOpen: boolean;
  rightPanelOpen: boolean;
  bottomPanelOpen: boolean;
  dataPanelFullscreen: boolean;
  activeTab: string;
  measurements: Measurement[];
  searchQuery: string;
  toggleLeftPanel: () => void;
  toggleRightPanel: () => void;
  toggleBottomPanel: () => void;
  setDataPanelFullscreen: (fullscreen: boolean) => void;
  setActiveTab: (tab: string) => void;
  addMeasurement: (measurement: Measurement) => void;
  removeMeasurement: (index: number) => void;
  clearMeasurements: () => void;
  setSearchQuery: (query: string) => void;
}

const defaultSimulationParams: SimulationParameters = {
  temperature: 300,
  timestep: 1,
  forceField: 'MMFF94',
  iterations: 1000,
};

export const useStore = create<MoleculeStore & SimulationStore & UIStore>((set, get) => ({
  currentMolecule: caffeineMolecule,
  currentAtoms: caffeineMolecule.atoms,
  selectedAtomId: null,
  displayMode: 'ball_stick',
  showLabels: false,
  showHydrogens: true,
  autoRotate: true,
  backgroundColor: '#0A1628',
  showElectronCloud: false,

  setCurrentMolecule: (molecule) => set({ 
    currentMolecule: molecule,
    currentAtoms: molecule?.atoms || [],
    selectedAtomId: null,
    showElectronCloud: false,
  }),
  
  setCurrentAtoms: (atoms) => set({ currentAtoms: atoms }),
  
  setSelectedAtom: (atomId) => set({ selectedAtomId: atomId }),
  
  setDisplayMode: (mode) => set({ displayMode: mode }),
  
  toggleLabels: () => set((state) => ({ showLabels: !state.showLabels })),
  
  toggleHydrogens: () => set((state) => ({ showHydrogens: !state.showHydrogens })),
  
  toggleAutoRotate: () => set((state) => ({ autoRotate: !state.autoRotate })),
  
  setBackgroundColor: (color) => set({ backgroundColor: color }),
  
  setShowElectronCloud: (show) => set({ showElectronCloud: show }),
  
  resetView: () => {
    const molecule = get().currentMolecule;
    if (molecule) {
      set({
        currentAtoms: molecule.atoms,
        selectedAtomId: null,
      });
    }
  },

  simulation: {
    isRunning: false,
    type: null,
    currentStep: 0,
    totalSteps: 1000,
    energy: [],
    parameters: defaultSimulationParams,
    rmsd: [],
    radiusOfGyration: [],
  },
  
  calculationResult: null,
  
  selectedSimulationType: null,
  
  ligandMolecule: null,
  
  targetMolecule: null,

  setSimulationType: (type) => set({ 
    selectedSimulationType: type,
    simulation: {
      ...get().simulation,
      type,
    },
  }),
  
  setSimulationParameters: (params) => set((state) => ({
    simulation: {
      ...state.simulation,
      parameters: {
        ...state.simulation.parameters,
        ...params,
      },
    },
  })),
  
  startSimulation: () => set((state) => ({
    simulation: {
      ...state.simulation,
      isRunning: true,
      currentStep: 0,
      energy: [],
      rmsd: [],
      radiusOfGyration: [],
      totalSteps: state.simulation.parameters.iterations,
    },
    calculationResult: null,
  })),
  
  stopSimulation: () => set((state) => ({
    simulation: {
      ...state.simulation,
      isRunning: false,
    },
  })),
  
  resetSimulation: () => set({
    simulation: {
      isRunning: false,
      type: null,
      currentStep: 0,
      totalSteps: 1000,
      energy: [],
      parameters: defaultSimulationParams,
      rmsd: [],
      radiusOfGyration: [],
    },
    calculationResult: null,
    selectedSimulationType: null,
  }),
  
  updateSimulationStep: (step, energy, rmsd, rg) => set((state) => ({
    simulation: {
      ...state.simulation,
      currentStep: step,
      energy: [...state.simulation.energy, energy],
      rmsd: rmsd !== undefined ? [...(state.simulation.rmsd || []), rmsd] : state.simulation.rmsd,
      radiusOfGyration: rg !== undefined ? [...(state.simulation.radiusOfGyration || []), rg] : state.simulation.radiusOfGyration,
    },
  })),
  
  setCalculationResult: (result) => set({ calculationResult: result }),
  
  setLigandMolecule: (molecule) => set({ ligandMolecule: molecule }),
  
  setTargetMolecule: (molecule) => set({ targetMolecule: molecule }),

  leftPanelOpen: true,
  rightPanelOpen: true,
  bottomPanelOpen: true,
  dataPanelFullscreen: false,
  activeTab: 'molecules',
  measurements: [],
  searchQuery: '',

  toggleLeftPanel: () => set((state) => ({ leftPanelOpen: !state.leftPanelOpen })),
  toggleRightPanel: () => set((state) => ({ rightPanelOpen: !state.rightPanelOpen })),
  toggleBottomPanel: () => set((state) => ({ bottomPanelOpen: !state.bottomPanelOpen })),
  setDataPanelFullscreen: (fullscreen) => set({ dataPanelFullscreen: fullscreen }),
  
  setActiveTab: (tab) => set({ activeTab: tab }),
  
  addMeasurement: (measurement) => set((state) => ({
    measurements: [...state.measurements, measurement],
  })),
  
  removeMeasurement: (index) => set((state) => ({
    measurements: state.measurements.filter((_, i) => i !== index),
  })),
  
  clearMeasurements: () => set({ measurements: [] }),
  
  setSearchQuery: (query) => set({ searchQuery: query }),
}));

export { moleculeLibrary };
