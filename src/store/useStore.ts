import { create } from 'zustand';
import { 
  Molecule, 
  DisplayMode, 
  SimulationType, 
  SimulationState, 
  SimulationParameters,
  CalculationResult,
  Atom,
  Bond,
  Measurement,
  EditorState,
  EditorTool,
  EditorMode,
  EditHistoryEntry,
  DisplayModeConfig,
  DisplayPreset,
  BallStickConfig,
  SpaceFillingConfig,
  RibbonConfig,
  SurfaceConfig,
  LineConfig,
  StickConfig,
  PointCloudConfig,
  PropertyCalculationType,
  QuantumDescriptor,
  ADMETProperty,
  DrugLikenessResult,
  PropertyCalculationState,
  ReactionMechanism,
  ReactionSimulationState,
  SpectrumType,
  SpectrumResult,
  SpectrumSimulationState,
  SpectrumParameters,
  SpectrumPeak,
} from '../types';
import { moleculeLibrary, caffeineMolecule } from '../data/molecules';
import {
  addAtomToMolecule,
  deleteAtomFromMolecule,
  addBondToMolecule,
  deleteBondFromMolecule,
  updateAtomProperty,
  updateBondOrder,
  updateMoleculeFormula,
  autoBondToNearest,
  addHydrogens,
  createNewMolecule,
} from '../utils/moleculeEditor';


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
  displayConfig: DisplayModeConfig;
  presets: DisplayPreset[];
  activePresetId: string | null;
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
  setDisplayConfig: <T extends DisplayMode>(mode: T, config: Partial<DisplayModeConfig[T]>) => void;
  resetDisplayConfig: (mode?: DisplayMode) => void;
  savePreset: (name: string, description?: string) => void;
  applyPreset: (presetId: string) => void;
  deletePreset: (presetId: string) => void;
  updatePreset: (presetId: string, updates: Partial<Pick<DisplayPreset, 'name' | 'description'>>) => void;
  setActivePresetId: (id: string | null) => void;
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

interface EditorStore {
  editor: EditorState;
  editHistory: EditHistoryEntry[];
  historyIndex: number;
  setEditorMode: (mode: EditorMode) => void;
  setEditorTool: (tool: EditorTool) => void;
  setSelectedElement: (element: string) => void;
  setBondOrder: (order: 1 | 2 | 3 | 'aromatic') => void;
  setSelectedBond: (bondId: string | null) => void;
  setBondStartAtom: (atomId: string | null) => void;
  setIsDragging: (dragging: boolean) => void;
  setDragAtomId: (atomId: string | null) => void;
  toggleShowHydrogenOnAdd: () => void;
  toggleAutoBond: () => void;
  addAtom: (x: number, y: number, z: number) => void;
  deleteAtom: (atomId: string) => void;
  addBond: (atom1Id: string, atom2Id: string) => void;
  deleteBond: (bondId: string) => void;
  updateAtom: (atomId: string, updates: Partial<Pick<Atom, 'element' | 'x' | 'y' | 'z' | 'charge'>>) => void;
  updateBond: (bondId: string, order: 1 | 2 | 3 | 'aromatic') => void;
  dragAtom: (atomId: string, x: number, y: number, z: number) => void;
  createNewEmptyMolecule: () => void;
  clearEditorSelection: () => void;
  undoEdit: () => void;
  redoEdit: () => void;
}

interface PropertyCalculationStore {
  propertyCalculation: PropertyCalculationState;
  isExportingPDF: boolean;
  setSelectedCalculationTypes: (types: PropertyCalculationType[]) => void;
  toggleCalculationType: (type: PropertyCalculationType) => void;
  startCalculation: () => void;
  setCalculationError: (error: string | null) => void;
  setQuantumDescriptors: (descriptors: QuantumDescriptor[]) => void;
  setADMETProperties: (properties: ADMETProperty[]) => void;
  setDrugLikeness: (result: DrugLikenessResult) => void;
  completeCalculation: () => void;
  resetPropertyCalculation: () => void;
  setExportingPDF: (exporting: boolean) => void;
}

interface ReactionSimulationStore {
  reactionSimulation: ReactionSimulationState;
  setCurrentReaction: (reaction: ReactionMechanism | null) => void;
  setReactionTime: (time: number) => void;
  setReactionPlaybackSpeed: (speed: number) => void;
  toggleReactionPlay: () => void;
  pauseReaction: () => void;
  resetReaction: () => void;
  stepReactionForward: (amount?: number) => void;
  stepReactionBackward: (amount?: number) => void;
  goToReactionKeyframe: (index: number) => void;
  toggleShowElectronFlow: () => void;
  toggleShowTransitionStates: () => void;
  toggleShowEnergyCurve: () => void;
  toggleShowBondChanges: () => void;
  setReactionRunning: (running: boolean) => void;
}

interface SpectrumSimulationStore {
  spectrumSimulation: SpectrumSimulationState;
  spectrumParameters: SpectrumParameters;
  selectedSpectrumMolecule: Molecule | null;
  setSelectedSpectrumMolecule: (molecule: Molecule | null) => void;
  setSelectedSpectrumTypes: (types: SpectrumType[]) => void;
  toggleSpectrumType: (type: SpectrumType) => void;
  setSpectrumParameters: (params: Partial<SpectrumParameters>) => void;
  startSpectrumSimulation: () => void;
  setSpectrumError: (error: string | null) => void;
  setSpectrumResult: (type: SpectrumType, result: SpectrumResult) => void;
  setAllSpectrumResults: (results: Partial<Record<SpectrumType, SpectrumResult>>) => void;
  completeSpectrumSimulation: () => void;
  resetSpectrumSimulation: () => void;
  setSelectedSpectrumPeak: (peak: SpectrumPeak | null) => void;
}

const defaultSimulationParams: SimulationParameters = {
  temperature: 300,
  timestep: 1,
  forceField: 'MMFF94',
  iterations: 1000,
};

const defaultBallStickConfig: BallStickConfig = {
  atomScale: 0.5,
  bondRadius: 0.15,
  atomMetalness: 0.3,
  atomRoughness: 0.4,
  bondMetalness: 0.2,
  bondRoughness: 0.5,
};

const defaultSpaceFillingConfig: SpaceFillingConfig = {
  atomScale: 1.2,
  metalness: 0.2,
  roughness: 0.5,
};

const defaultRibbonConfig: RibbonConfig = {
  thickness: 0.3,
  tension: 0.5,
  resolution: 20,
  colorBy: 'secondary',
};

const defaultSurfaceConfig: SurfaceConfig = {
  opacity: 0.8,
  quality: 'medium',
  colorScheme: 'electrostatic',
};

const defaultLineConfig: LineConfig = {
  lineWidth: 2,
  colorBy: 'element',
  uniformColor: '#ffffff',
  showAtomPoints: false,
  atomPointSize: 0.3,
};

const defaultStickConfig: StickConfig = {
  stickRadius: 0.3,
  stickLengthRatio: 0.8,
  metalness: 0.3,
  roughness: 0.4,
  showAtomSpheres: true,
  atomSphereScale: 0.7,
};

const defaultPointCloudConfig: PointCloudConfig = {
  pointSize: 0.5,
  attenuation: true,
  colorBy: 'element',
  sizeBy: 'element',
  constantSize: 0.5,
  opacity: 0.9,
};

const defaultSpectrumParameters: SpectrumParameters = {
  ir: {
    resolution: 4,
    baseline: 0.05,
    peakWidth: 25,
  },
  nmr_1h: {
    frequency: 400,
    solvent: 'CDCl3',
    temperature: 298,
    peakWidth: 0.05,
  },
  nmr_13c: {
    frequency: 100,
    solvent: 'CDCl3',
    temperature: 298,
    peakWidth: 0.3,
    decoupled: true,
  },
  uv_vis: {
    resolution: 2,
    solvent: 'MeOH',
    pathLength: 1,
    concentration: 1e-5,
  },
};

const defaultDisplayConfig: DisplayModeConfig = {
  ball_stick: defaultBallStickConfig,
  space_filling: defaultSpaceFillingConfig,
  ribbon: defaultRibbonConfig,
  surface: defaultSurfaceConfig,
  line: defaultLineConfig,
  stick: defaultStickConfig,
  point_cloud: defaultPointCloudConfig,
};

const defaultPresets: DisplayPreset[] = [
  {
    id: 'default-ball-stick',
    name: '默认球棍模型',
    description: '经典的球棍模型显示，适合观察分子结构',
    displayMode: 'ball_stick',
    showHydrogens: true,
    showLabels: false,
    autoRotate: true,
    backgroundColor: '#0A1628',
    showElectronCloud: false,
    config: defaultDisplayConfig,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: 'default-space-filling',
    name: '空间填充',
    description: '显示原子的范德华半径，适合观察分子体积',
    displayMode: 'space_filling',
    showHydrogens: true,
    showLabels: false,
    autoRotate: true,
    backgroundColor: '#000000',
    showElectronCloud: false,
    config: defaultDisplayConfig,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: 'default-line',
    name: '线型模型',
    description: '简洁的线条显示，适合大分子快速浏览',
    displayMode: 'line',
    showHydrogens: false,
    showLabels: false,
    autoRotate: false,
    backgroundColor: '#0A1628',
    showElectronCloud: false,
    config: defaultDisplayConfig,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: 'default-stick',
    name: '棍棒模型',
    description: '突出显示化学键，适合观察键连接方式',
    displayMode: 'stick',
    showHydrogens: true,
    showLabels: false,
    autoRotate: true,
    backgroundColor: '#1a1a2e',
    showElectronCloud: false,
    config: defaultDisplayConfig,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: 'default-point-cloud',
    name: '点云模型',
    description: '原子显示为点云，适合观察分子整体分布',
    displayMode: 'point_cloud',
    showHydrogens: false,
    showLabels: false,
    autoRotate: true,
    backgroundColor: '#000000',
    showElectronCloud: false,
    config: defaultDisplayConfig,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
];

export const useStore = create<MoleculeStore & SimulationStore & UIStore & EditorStore & PropertyCalculationStore & ReactionSimulationStore & SpectrumSimulationStore>((set, get) => ({
  currentMolecule: caffeineMolecule,
  currentAtoms: caffeineMolecule.atoms,
  selectedAtomId: null,
  displayMode: 'ball_stick',
  showLabels: false,
  showHydrogens: true,
  autoRotate: true,
  backgroundColor: '#0A1628',
  showElectronCloud: false,
  displayConfig: defaultDisplayConfig,
  presets: defaultPresets,
  activePresetId: 'default-ball-stick',

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

  setDisplayConfig: (mode, config) => set((state) => ({
    displayConfig: {
      ...state.displayConfig,
      [mode]: {
        ...state.displayConfig[mode],
        ...config,
      },
    },
    activePresetId: null,
  })),

  resetDisplayConfig: (mode) => set((state) => {
    if (mode) {
      return {
        displayConfig: {
          ...state.displayConfig,
          [mode]: defaultDisplayConfig[mode],
        },
        activePresetId: null,
      };
    }
    return {
      displayConfig: defaultDisplayConfig,
      activePresetId: null,
    };
  }),

  savePreset: (name, description) => set((state) => {
    const newPreset: DisplayPreset = {
      id: `preset-${Date.now()}`,
      name,
      description,
      displayMode: state.displayMode,
      showHydrogens: state.showHydrogens,
      showLabels: state.showLabels,
      autoRotate: state.autoRotate,
      backgroundColor: state.backgroundColor,
      showElectronCloud: state.showElectronCloud,
      config: JSON.parse(JSON.stringify(state.displayConfig)),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    return {
      presets: [...state.presets, newPreset],
      activePresetId: newPreset.id,
    };
  }),

  applyPreset: (presetId) => set((state) => {
    const preset = state.presets.find(p => p.id === presetId);
    if (!preset) return {};
    return {
      displayMode: preset.displayMode,
      showHydrogens: preset.showHydrogens,
      showLabels: preset.showLabels,
      autoRotate: preset.autoRotate,
      backgroundColor: preset.backgroundColor,
      showElectronCloud: preset.showElectronCloud,
      displayConfig: JSON.parse(JSON.stringify(preset.config)),
      activePresetId: preset.id,
    };
  }),

  deletePreset: (presetId) => set((state) => {
    const isDefaultPreset = presetId.startsWith('default-');
    if (isDefaultPreset) return {};
    return {
      presets: state.presets.filter(p => p.id !== presetId),
      activePresetId: state.activePresetId === presetId ? null : state.activePresetId,
    };
  }),

  updatePreset: (presetId, updates) => set((state) => ({
    presets: state.presets.map(p => 
      p.id === presetId 
        ? { ...p, ...updates, updatedAt: Date.now() }
        : p
    ),
  })),

  setActivePresetId: (id) => set({ activePresetId: id }),

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

  editor: {
    mode: 'view',
    activeTool: 'select',
    selectedBondId: null,
    selectedElement: 'C',
    bondOrder: 1,
    bondStartAtomId: null,
    isDragging: false,
    dragAtomId: null,
    showHydrogenOnAdd: true,
    autoBond: true,
  },

  editHistory: [],
  historyIndex: -1,


  setEditorMode: (mode) => set((state) => {
    const validTools: EditorTool[] = ['select', 'add_atom', 'delete', 'bond', 'erase_bond', 'drag'];
    const currentToolValid = validTools.includes(state.editor.activeTool);
    
    return {
      editor: {
        ...state.editor,
        mode,
        activeTool: mode === 'view'
          ? 'select'
          : (currentToolValid ? state.editor.activeTool : 'select'),
        bondStartAtomId: mode === 'view' ? null : state.editor.bondStartAtomId,
        selectedBondId: mode === 'view' ? null : state.editor.selectedBondId,
        isDragging: mode === 'view' ? false : state.editor.isDragging,
        dragAtomId: mode === 'view' ? null : state.editor.dragAtomId,
      },
      selectedAtomId: null,
    };
  }),
  setEditorTool: (tool) => set((state) => ({
    editor: {
      ...state.editor,
      activeTool: tool,
      bondStartAtomId: null,
    },
    selectedAtomId: null,
    selectedBondId: null,
  })),

  setSelectedElement: (element) => set((state) => ({
    editor: {
      ...state.editor,
      selectedElement: element,
    },
  })),

  setBondOrder: (order) => set((state) => ({
    editor: {
      ...state.editor,
      bondOrder: order,
    },
  })),

  setSelectedBond: (bondId) => set((state) => ({
    editor: {
      ...state.editor,
      selectedBondId: bondId,
    },
    selectedAtomId: bondId ? null : state.selectedAtomId,
  })),

  setBondStartAtom: (atomId) => set((state) => ({
    editor: {
      ...state.editor,
      bondStartAtomId: atomId,
    },
  })),

  setIsDragging: (dragging) => set((state) => ({
    editor: {
      ...state.editor,
      isDragging: dragging,
    },
  })),

  setDragAtomId: (atomId) => set((state) => ({
    editor: {
      ...state.editor,
      dragAtomId: atomId,
    },
  })),

  toggleShowHydrogenOnAdd: () => set((state) => ({
    editor: {
      ...state.editor,
      showHydrogenOnAdd: !state.editor.showHydrogenOnAdd,
    },
  })),

  toggleAutoBond: () => set((state) => ({
    editor: {
      ...state.editor,
      autoBond: !state.editor.autoBond,
    },
  })),

  addAtom: (x, y, z) => {
    const state = get();
    if (!state.currentMolecule) return;

    const result = addAtomToMolecule(
      state.currentMolecule,
      state.editor.selectedElement,
      x, y, z, 0
    );

    let updatedMolecule = result.molecule;

    if (state.editor.autoBond) {
      updatedMolecule = autoBondToNearest(updatedMolecule, result.newAtom.id);
    }

    if (state.editor.showHydrogenOnAdd && state.editor.selectedElement !== 'H') {
      updatedMolecule = addHydrogens(updatedMolecule, result.newAtom.id);
    }

    updatedMolecule = updateMoleculeFormula(updatedMolecule);

    const historyEntry: EditHistoryEntry = {
      type: 'add_atom',
      before: null,
      after: { atom: result.newAtom },
      timestamp: Date.now(),
    };

    set({
      currentMolecule: updatedMolecule,
      currentAtoms: updatedMolecule.atoms,
      selectedAtomId: result.newAtom.id,
      editHistory: [...state.editHistory.slice(0, state.historyIndex + 1), historyEntry],
      historyIndex: state.historyIndex + 1,
    });
  },

  deleteAtom: (atomId) => {
    const state = get();
    if (!state.currentMolecule) return;

    const result = deleteAtomFromMolecule(state.currentMolecule, atomId);
    if (!result.deletedAtom) return;

    const updatedMolecule = updateMoleculeFormula(result.molecule);

    const historyEntry: EditHistoryEntry = {
      type: 'delete_atom',
      before: { atom: result.deletedAtom, bonds: result.deletedBonds },
      after: null,
      timestamp: Date.now(),
    };

    set({
      currentMolecule: updatedMolecule,
      currentAtoms: updatedMolecule.atoms,
      selectedAtomId: null,
      editHistory: [...state.editHistory.slice(0, state.historyIndex + 1), historyEntry],
      historyIndex: state.historyIndex + 1,
    });
  },

  addBond: (atom1Id, atom2Id) => {
    const state = get();
    if (!state.currentMolecule) return;

    const result = addBondToMolecule(
      state.currentMolecule,
      atom1Id,
      atom2Id,
      state.editor.bondOrder
    );

    if (!result.newBond) return;

    const updatedMolecule = updateMoleculeFormula(result.molecule);

    const historyEntry: EditHistoryEntry = {
      type: 'add_bond',
      before: null,
      after: { bond: result.newBond },
      timestamp: Date.now(),
    };

    set({
      currentMolecule: updatedMolecule,
      editor: {
        ...state.editor,
        bondStartAtomId: null,
      },
      editHistory: [...state.editHistory.slice(0, state.historyIndex + 1), historyEntry],
      historyIndex: state.historyIndex + 1,
    });
  },

  deleteBond: (bondId) => {
    const state = get();
    if (!state.currentMolecule) return;

    const result = deleteBondFromMolecule(state.currentMolecule, bondId);
    if (!result.deletedBond) return;

    const historyEntry: EditHistoryEntry = {
      type: 'delete_bond',
      before: { bond: result.deletedBond },
      after: null,
      timestamp: Date.now(),
    };

    set({
      currentMolecule: result.molecule,
      editor: {
        ...state.editor,
        selectedBondId: null,
      },
      editHistory: [...state.editHistory.slice(0, state.historyIndex + 1), historyEntry],
      historyIndex: state.historyIndex + 1,
    });
  },

  updateAtom: (atomId, updates) => {
    const state = get();
    if (!state.currentMolecule) return;

    const originalAtom = state.currentMolecule.atoms.find(a => a.id === atomId);
    if (!originalAtom) return;

    const result = updateAtomProperty(state.currentMolecule, atomId, updates);
    if (!result.updatedAtom) return;

    const updatedMolecule = updateMoleculeFormula(result.molecule);

    const historyEntry: EditHistoryEntry = {
      type: 'modify_atom',
      before: { atom: originalAtom },
      after: { atom: result.updatedAtom },
      timestamp: Date.now(),
    };

    set({
      currentMolecule: updatedMolecule,
      currentAtoms: updatedMolecule.atoms,
      editHistory: [...state.editHistory.slice(0, state.historyIndex + 1), historyEntry],
      historyIndex: state.historyIndex + 1,
    });
  },

  updateBond: (bondId, order) => {
    const state = get();
    if (!state.currentMolecule) return;

    const originalBond = state.currentMolecule.bonds.find(b => b.id === bondId);
    if (!originalBond) return;

    const result = updateBondOrder(state.currentMolecule, bondId, order);
    if (!result.updatedBond) return;

    const historyEntry: EditHistoryEntry = {
      type: 'modify_bond',
      before: { bond: originalBond },
      after: { bond: result.updatedBond },
      timestamp: Date.now(),
    };

    set({
      currentMolecule: result.molecule,
      editHistory: [...state.editHistory.slice(0, state.historyIndex + 1), historyEntry],
      historyIndex: state.historyIndex + 1,
    });
  },

  dragAtom: (atomId, x, y, z) => {
    const state = get();
    if (!state.currentMolecule) return;

    const result = updateAtomProperty(state.currentMolecule, atomId, { x, y, z });
    if (!result.updatedAtom) return;

    set({
      currentMolecule: result.molecule,
      currentAtoms: result.molecule.atoms,
    });
  },

  createNewEmptyMolecule: () => {
    const newMol = createNewMolecule();
    set({
      currentMolecule: newMol,
      currentAtoms: [],
      selectedAtomId: null,
      editHistory: [],
      historyIndex: -1,
      editor: {
        mode: 'edit',
        activeTool: 'add_atom',
        selectedBondId: null,
        selectedElement: 'C',
        bondOrder: 1,
        bondStartAtomId: null,
        isDragging: false,
        dragAtomId: null,
        showHydrogenOnAdd: true,
        autoBond: true,
      },
    });
  },

  clearEditorSelection: () => set({
    selectedAtomId: null,
    editor: {
      ...get().editor,
      selectedBondId: null,
      bondStartAtomId: null,
    },
  }),

  undoEdit: () => {
    const state = get();
    if (state.historyIndex < 0 || !state.currentMolecule) return;

    const entry = state.editHistory[state.historyIndex];
    let updatedMolecule = state.currentMolecule;

    switch (entry.type) {
      case 'add_atom':
        if (entry.after?.atom) {
          const result = deleteAtomFromMolecule(updatedMolecule, entry.after.atom.id);
          updatedMolecule = updateMoleculeFormula(result.molecule);
        }
        break;
      case 'delete_atom':
        if (entry.before?.atom) {
          updatedMolecule = {
            ...updatedMolecule,
            atoms: [...updatedMolecule.atoms, entry.before.atom],
            bonds: [...updatedMolecule.bonds, ...(entry.before.bonds || [])],
          };
          updatedMolecule = updateMoleculeFormula(updatedMolecule);
        }
        break;
      case 'add_bond':
        if (entry.after?.bond) {
          const result = deleteBondFromMolecule(updatedMolecule, entry.after.bond.id);
          updatedMolecule = result.molecule;
        }
        break;
      case 'delete_bond':
        if (entry.before?.bond) {
          updatedMolecule = {
            ...updatedMolecule,
            bonds: [...updatedMolecule.bonds, entry.before.bond],
          };
        }
        break;
      case 'modify_atom':
        if (entry.before?.atom) {
          const atomIndex = updatedMolecule.atoms.findIndex(a => a.id === entry.before.atom.id);
          if (atomIndex !== -1) {
            const newAtoms = [...updatedMolecule.atoms];
            newAtoms[atomIndex] = entry.before.atom;
            updatedMolecule = { ...updatedMolecule, atoms: newAtoms };
            updatedMolecule = updateMoleculeFormula(updatedMolecule);
          }
        }
        break;
      case 'modify_bond':
        if (entry.before?.bond) {
          const bondIndex = updatedMolecule.bonds.findIndex(b => b.id === entry.before.bond.id);
          if (bondIndex !== -1) {
            const newBonds = [...updatedMolecule.bonds];
            newBonds[bondIndex] = entry.before.bond;
            updatedMolecule = { ...updatedMolecule, bonds: newBonds };
          }
        }
        break;
    }

    set({
      currentMolecule: updatedMolecule,
      currentAtoms: updatedMolecule.atoms,
      historyIndex: state.historyIndex - 1,
    });
  },

  redoEdit: () => {
    const state = get();
    if (state.historyIndex >= state.editHistory.length - 1 || !state.currentMolecule) return;

    const nextIndex = state.historyIndex + 1;
    const entry = state.editHistory[nextIndex];
    let updatedMolecule = state.currentMolecule;

    switch (entry.type) {
      case 'add_atom':
        if (entry.after?.atom) {
          updatedMolecule = {
            ...updatedMolecule,
            atoms: [...updatedMolecule.atoms, entry.after.atom],
          };
          updatedMolecule = updateMoleculeFormula(updatedMolecule);
        }
        break;
      case 'delete_atom':
        if (entry.before?.atom) {
          const result = deleteAtomFromMolecule(updatedMolecule, entry.before.atom.id);
          updatedMolecule = updateMoleculeFormula(result.molecule);
        }
        break;
      case 'add_bond':
        if (entry.after?.bond) {
          updatedMolecule = {
            ...updatedMolecule,
            bonds: [...updatedMolecule.bonds, entry.after.bond],
          };
        }
        break;
      case 'delete_bond':
        if (entry.before?.bond) {
          const result = deleteBondFromMolecule(updatedMolecule, entry.before.bond.id);
          updatedMolecule = result.molecule;
        }
        break;
      case 'modify_atom':
        if (entry.after?.atom) {
          const atomIndex = updatedMolecule.atoms.findIndex(a => a.id === entry.after.atom.id);
          if (atomIndex !== -1) {
            const newAtoms = [...updatedMolecule.atoms];
            newAtoms[atomIndex] = entry.after.atom;
            updatedMolecule = { ...updatedMolecule, atoms: newAtoms };
            updatedMolecule = updateMoleculeFormula(updatedMolecule);
          }
        }
        break;
      case 'modify_bond':
        if (entry.after?.bond) {
          const bondIndex = updatedMolecule.bonds.findIndex(b => b.id === entry.after.bond.id);
          if (bondIndex !== -1) {
            const newBonds = [...updatedMolecule.bonds];
            newBonds[bondIndex] = entry.after.bond;
            updatedMolecule = { ...updatedMolecule, bonds: newBonds };
          }
        }
        break;
    }

    set({
      currentMolecule: updatedMolecule,
      currentAtoms: updatedMolecule.atoms,
      historyIndex: nextIndex,
    });
  },

  propertyCalculation: {
    isCalculating: false,
    selectedTypes: ['all'],
    quantumDescriptors: null,
    admetProperties: null,
    drugLikeness: null,
    error: null,
    calculatedAt: null,
  },

  isExportingPDF: false,

  setSelectedCalculationTypes: (types) => set((state) => ({
    propertyCalculation: {
      ...state.propertyCalculation,
      selectedTypes: types,
    },
  })),

  toggleCalculationType: (type) => set((state) => {
    const currentTypes = state.propertyCalculation.selectedTypes;
    let newTypes: PropertyCalculationType[];
    
    if (type === 'all') {
      newTypes = currentTypes.includes('all') ? [] : ['all'];
    } else {
      const withoutAll = currentTypes.filter(t => t !== 'all');
      if (withoutAll.includes(type)) {
        newTypes = withoutAll.filter(t => t !== type);
      } else {
        newTypes = [...withoutAll, type];
      }
    }
    
    return {
      propertyCalculation: {
        ...state.propertyCalculation,
        selectedTypes: newTypes,
      },
    };
  }),

  startCalculation: () => set((state) => ({
    propertyCalculation: {
      ...state.propertyCalculation,
      isCalculating: true,
      error: null,
      quantumDescriptors: null,
      admetProperties: null,
      drugLikeness: null,
      calculatedAt: null,
    },
  })),

  setCalculationError: (error) => set((state) => ({
    propertyCalculation: {
      ...state.propertyCalculation,
      isCalculating: false,
      error,
    },
  })),

  setQuantumDescriptors: (descriptors) => set((state) => ({
    propertyCalculation: {
      ...state.propertyCalculation,
      quantumDescriptors: descriptors,
    },
  })),

  setADMETProperties: (properties) => set((state) => ({
    propertyCalculation: {
      ...state.propertyCalculation,
      admetProperties: properties,
    },
  })),

  setDrugLikeness: (result) => set((state) => ({
    propertyCalculation: {
      ...state.propertyCalculation,
      drugLikeness: result,
    },
  })),

  completeCalculation: () => set((state) => ({
    propertyCalculation: {
      ...state.propertyCalculation,
      isCalculating: false,
      calculatedAt: new Date(),
    },
  })),

  resetPropertyCalculation: () => set({
    propertyCalculation: {
      isCalculating: false,
      selectedTypes: ['all'],
      quantumDescriptors: null,
      admetProperties: null,
      drugLikeness: null,
      error: null,
      calculatedAt: null,
    },
  }),

  setExportingPDF: (exporting) => set({ isExportingPDF: exporting }),

  reactionSimulation: {
    isRunning: false,
    currentReaction: null,
    currentTime: 0,
    totalDuration: 100,
    playbackSpeed: 1,
    isPaused: true,
    currentKeyframe: 0,
    showElectronFlow: true,
    showTransitionStates: true,
    showEnergyCurve: true,
    showBondChanges: true,
  },

  setCurrentReaction: (reaction) => set((state) => {
    const totalDuration = reaction?.keyframes[reaction.keyframes.length - 1]?.time || 100;
    const firstAtoms = reaction?.keyframes[0]?.atoms || [];
    const atomMap = new Map<string, Atom>();
    
    if (reaction) {
      reaction.reactants.forEach(mol => {
        mol.atoms.forEach(atom => atomMap.set(atom.id, atom));
      });
      reaction.products.forEach(mol => {
        mol.atoms.forEach(atom => atomMap.set(atom.id, atom));
      });
    }

    const currentAtoms = firstAtoms.map(ka => {
      const baseAtom = atomMap.get(ka.id);
      return baseAtom ? { ...baseAtom, x: ka.x, y: ka.y, z: ka.z } : null;
    }).filter((a): a is Atom => a !== null);

    const tempMolecule: Molecule | null = reaction ? {
      id: `reaction-${reaction.id}`,
      name: reaction.name,
      formula: reaction.chemicalEquation,
      type: 'small_molecule',
      atoms: currentAtoms,
      bonds: [],
      description: reaction.description,
      category: '有机反应',
    } : null;

    return {
      reactionSimulation: {
        ...state.reactionSimulation,
        currentReaction: reaction,
        currentTime: 0,
        totalDuration,
        currentKeyframe: 0,
        isPaused: true,
        isRunning: false,
      },
      currentMolecule: tempMolecule,
      currentAtoms,
      selectedSimulationType: null,
    };
  }),

  setReactionTime: (time) => set((state) => ({
    reactionSimulation: {
      ...state.reactionSimulation,
      currentTime: Math.max(0, Math.min(state.reactionSimulation.totalDuration, time)),
    },
  })),

  setReactionPlaybackSpeed: (speed) => set((state) => ({
    reactionSimulation: {
      ...state.reactionSimulation,
      playbackSpeed: Math.max(0.25, Math.min(4, speed)),
    },
  })),

  toggleReactionPlay: () => set((state) => ({
    reactionSimulation: {
      ...state.reactionSimulation,
      isPaused: !state.reactionSimulation.isPaused,
      isRunning: state.reactionSimulation.isPaused,
    },
  })),

  pauseReaction: () => set((state) => ({
    reactionSimulation: {
      ...state.reactionSimulation,
      isPaused: true,
      isRunning: false,
    },
  })),

  resetReaction: () => set((state) => ({
    reactionSimulation: {
      ...state.reactionSimulation,
      currentTime: 0,
      currentKeyframe: 0,
      isPaused: true,
      isRunning: false,
    },
  })),

  stepReactionForward: (amount = 1) => set((state) => ({
    reactionSimulation: {
      ...state.reactionSimulation,
      currentTime: Math.min(state.reactionSimulation.totalDuration, state.reactionSimulation.currentTime + amount),
      isPaused: true,
      isRunning: false,
    },
  })),

  stepReactionBackward: (amount = 1) => set((state) => ({
    reactionSimulation: {
      ...state.reactionSimulation,
      currentTime: Math.max(0, state.reactionSimulation.currentTime - amount),
      isPaused: true,
      isRunning: false,
    },
  })),

  goToReactionKeyframe: (index) => set((state) => {
    if (!state.reactionSimulation.currentReaction) return {};
    const keyframes = state.reactionSimulation.currentReaction.keyframes;
    if (index < 0 || index >= keyframes.length) return {};
    return {
      reactionSimulation: {
        ...state.reactionSimulation,
        currentTime: keyframes[index].time,
        currentKeyframe: index,
        isPaused: true,
        isRunning: false,
      },
    };
  }),

  toggleShowElectronFlow: () => set((state) => ({
    reactionSimulation: {
      ...state.reactionSimulation,
      showElectronFlow: !state.reactionSimulation.showElectronFlow,
    },
  })),

  toggleShowTransitionStates: () => set((state) => ({
    reactionSimulation: {
      ...state.reactionSimulation,
      showTransitionStates: !state.reactionSimulation.showTransitionStates,
    },
  })),

  toggleShowEnergyCurve: () => set((state) => ({
    reactionSimulation: {
      ...state.reactionSimulation,
      showEnergyCurve: !state.reactionSimulation.showEnergyCurve,
    },
  })),

  toggleShowBondChanges: () => set((state) => ({
    reactionSimulation: {
      ...state.reactionSimulation,
      showBondChanges: !state.reactionSimulation.showBondChanges,
    },
  })),

  setReactionRunning: (running) => set((state) => ({
    reactionSimulation: {
      ...state.reactionSimulation,
      isRunning: running,
      isPaused: !running,
    },
  })),

  spectrumSimulation: {
    isSimulating: false,
    selectedSpectrumTypes: ['ir', 'nmr_1h', 'nmr_13c', 'uv_vis'],
    results: {},
    error: null,
    simulatedAt: null,
    selectedPeak: null,
  },

  spectrumParameters: defaultSpectrumParameters,

  selectedSpectrumMolecule: null,

  setSelectedSpectrumMolecule: (molecule) => set({ 
    selectedSpectrumMolecule: molecule,
    spectrumSimulation: {
      ...get().spectrumSimulation,
      results: {},
      error: null,
      simulatedAt: null,
    },
  }),

  setSelectedSpectrumTypes: (types) => set((state) => ({
    spectrumSimulation: {
      ...state.spectrumSimulation,
      selectedSpectrumTypes: types,
    },
  })),

  toggleSpectrumType: (type) => set((state) => {
    const currentTypes = state.spectrumSimulation.selectedSpectrumTypes;
    const newTypes = currentTypes.includes(type)
      ? currentTypes.filter(t => t !== type)
      : [...currentTypes, type];
    
    return {
      spectrumSimulation: {
        ...state.spectrumSimulation,
        selectedSpectrumTypes: newTypes,
      },
    };
  }),

  setSpectrumParameters: (params) => set((state) => ({
    spectrumParameters: {
      ...state.spectrumParameters,
      ...params,
    },
  })),

  startSpectrumSimulation: () => set((state) => ({
    spectrumSimulation: {
      ...state.spectrumSimulation,
      isSimulating: true,
      error: null,
      results: {},
      simulatedAt: null,
      selectedPeak: null,
    },
  })),

  setSpectrumError: (error) => set((state) => ({
    spectrumSimulation: {
      ...state.spectrumSimulation,
      isSimulating: false,
      error,
    },
  })),

  setSpectrumResult: (type, result) => set((state) => ({
    spectrumSimulation: {
      ...state.spectrumSimulation,
      results: {
        ...state.spectrumSimulation.results,
        [type]: result,
      },
    },
  })),

  setAllSpectrumResults: (results) => set((state) => ({
    spectrumSimulation: {
      ...state.spectrumSimulation,
      results,
    },
  })),

  completeSpectrumSimulation: () => set((state) => ({
    spectrumSimulation: {
      ...state.spectrumSimulation,
      isSimulating: false,
      simulatedAt: new Date(),
    },
  })),

  resetSpectrumSimulation: () => set({
    spectrumSimulation: {
      isSimulating: false,
      selectedSpectrumTypes: ['ir', 'nmr_1h', 'nmr_13c', 'uv_vis'],
      results: {},
      error: null,
      simulatedAt: null,
      selectedPeak: null,
    },
    spectrumParameters: defaultSpectrumParameters,
  }),

  setSelectedSpectrumPeak: (peak) => set((state) => ({
    spectrumSimulation: {
      ...state.spectrumSimulation,
      selectedPeak: peak,
    },
  })),
}));

export { moleculeLibrary };
