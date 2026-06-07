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

const defaultSimulationParams: SimulationParameters = {
  temperature: 300,
  timestep: 1,
  forceField: 'MMFF94',
  iterations: 1000,
};

export const useStore = create<MoleculeStore & SimulationStore & UIStore & EditorStore>((set, get) => ({
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
}));

export { moleculeLibrary };
