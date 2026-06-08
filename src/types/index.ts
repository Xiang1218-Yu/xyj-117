export interface Atom {
  id: string;
  element: string;
  x: number;
  y: number;
  z: number;
  charge?: number;
  residue?: string;
  chain?: string;
  residueIndex?: number;
}

export interface Bond {
  id: string;
  atom1: string;
  atom2: string;
  order: 1 | 2 | 3 | 'aromatic';
  length: number;
}

export interface Molecule {
  id: string;
  name: string;
  formula: string;
  type: 'protein' | 'small_molecule' | 'material';
  atoms: Atom[];
  bonds: Bond[];
  sequence?: string;
  pdbId?: string;
  description?: string;
  category?: string;
}

export type DisplayMode = 'ball_stick' | 'space_filling' | 'ribbon' | 'surface' | 'line' | 'stick' | 'point_cloud';

export interface BallStickConfig {
  atomScale: number;
  bondRadius: number;
  atomMetalness: number;
  atomRoughness: number;
  bondMetalness: number;
  bondRoughness: number;
}

export interface SpaceFillingConfig {
  atomScale: number;
  metalness: number;
  roughness: number;
}

export interface RibbonConfig {
  thickness: number;
  tension: number;
  resolution: number;
  colorBy: 'secondary' | 'chain' | 'residue';
}

export interface SurfaceConfig {
  opacity: number;
  quality: 'low' | 'medium' | 'high';
  colorScheme: 'electrostatic' | 'hydrophobic' | 'chain';
}

export interface LineConfig {
  lineWidth: number;
  colorBy: 'element' | 'chain' | 'uniform';
  uniformColor: string;
  showAtomPoints: boolean;
  atomPointSize: number;
}

export interface StickConfig {
  stickRadius: number;
  stickLengthRatio: number;
  metalness: number;
  roughness: number;
  showAtomSpheres: boolean;
  atomSphereScale: number;
}

export interface PointCloudConfig {
  pointSize: number;
  attenuation: boolean;
  colorBy: 'element' | 'chain' | 'residue' | 'bfactor';
  sizeBy: 'element' | 'constant';
  constantSize: number;
  opacity: number;
}

export interface DisplayModeConfig {
  ball_stick: BallStickConfig;
  space_filling: SpaceFillingConfig;
  ribbon: RibbonConfig;
  surface: SurfaceConfig;
  line: LineConfig;
  stick: StickConfig;
  point_cloud: PointCloudConfig;
}

export interface DisplayPreset {
  id: string;
  name: string;
  description?: string;
  displayMode: DisplayMode;
  showHydrogens: boolean;
  showLabels: boolean;
  autoRotate: boolean;
  backgroundColor: string;
  showElectronCloud: boolean;
  config: DisplayModeConfig;
  createdAt: number;
  updatedAt: number;
}
export type SimulationType = 'folding' | 'docking' | 'material';
export type MaterialProperty = 'conductivity' | 'elasticity' | 'band_gap';

export interface SimulationParameters {
  temperature: number;
  timestep: number;
  forceField: string;
  iterations: number;
}

export interface SimulationState {
  isRunning: boolean;
  type: SimulationType | null;
  currentStep: number;
  totalSteps: number;
  energy: number[];
  parameters: SimulationParameters;
  rmsd?: number[];
  radiusOfGyration?: number[];
}

export interface Orbital {
  energy: number;
  occupancy: number;
  type: 'HOMO' | 'LUMO' | 'other';
  coefficients: number[];
}

export interface CalculationResult {
  bindingEnergy?: number;
  bindingAffinity?: number;
  homoEnergy?: number;
  lumoEnergy?: number;
  bandGap?: number;
  conductivity?: number;
  elasticity?: number;
  electronDensity?: number[][];
  molecularOrbitals?: Orbital[];
  hydrogenBonds?: number;
  hydrophobicContacts?: number;
}

export interface EnergyPoint {
  step: number;
  energy: number;
  kinetic?: number;
  potential?: number;
}

export interface HydrogenBond {
  donor: string;
  acceptor: string;
  hydrogen: string;
  distance: number;
  angle: number;
}

export interface Measurement {
  type: 'distance' | 'angle' | 'dihedral';
  atoms: string[];
  value: number;
  unit: string;
}

export type EditorTool = 'select' | 'add_atom' | 'delete' | 'bond' | 'erase_bond' | 'drag';

export type EditorMode = 'view' | 'edit';

export interface EditorState {
  mode: EditorMode;
  activeTool: EditorTool;
  selectedBondId: string | null;
  selectedElement: string;
  bondOrder: 1 | 2 | 3 | 'aromatic';
  bondStartAtomId: string | null;
  isDragging: boolean;
  dragAtomId: string | null;
  showHydrogenOnAdd: boolean;
  autoBond: boolean;
}

export interface EditHistoryEntry {
  type: 'add_atom' | 'delete_atom' | 'add_bond' | 'delete_bond' | 'modify_atom' | 'modify_bond';
  before: any;
  after: any;
  timestamp: number;
}

export type PropertyCalculationType = 'quantum' | 'admet' | 'drug_likeness' | 'all';

export type DescriptorCategory = 'electronic' | 'structural' | 'topological' | 'physicochemical';

export interface QuantumDescriptor {
  name: string;
  value: number;
  unit?: string;
  description?: string;
  category: DescriptorCategory;
}

export type ADMETCategory = 'absorption' | 'distribution' | 'metabolism' | 'excretion' | 'toxicity';

export type ADMETStatus = 'good' | 'moderate' | 'poor' | 'unknown';

export interface ADMETProperty {
  name: string;
  category: ADMETCategory;
  prediction: string;
  probability: number;
  status: ADMETStatus;
  description?: string;
  reference?: string;
}

export interface DrugLikenessRule {
  ruleName: string;
  passed: boolean;
  score: number;
  details: string;
  threshold?: string;
}

export interface DrugLikenessResult {
  overallScore: number;
  rules: DrugLikenessRule[];
  summary: string;
}

export interface PropertyCalculationState {
  isCalculating: boolean;
  selectedTypes: PropertyCalculationType[];
  quantumDescriptors: QuantumDescriptor[] | null;
  admetProperties: ADMETProperty[] | null;
  drugLikeness: DrugLikenessResult | null;
  error: string | null;
  calculatedAt: Date | null;
}

export interface PDFExportConfig {
  includeMoleculeInfo: boolean;
  includeQuantum: boolean;
  includeADMET: boolean;
  includeDrugLikeness: boolean;
  include3DScreenshot: boolean;
  pageSize: 'a4' | 'letter';
}

export type ReactionType = 'SN2' | 'E2' | 'SN1' | 'E1' | 'nucleophilic_addition' | 'elimination' | 'electrophilic_substitution' | 'diels_alder' | 'grignard' | 'hydrolysis' | 'esterification';

export type ElectronTransferType = 'lone_pair_to_bond' | 'bond_to_lone_pair' | 'bond_to_bond' | 'lone_pair_to_lone_pair';

export type BondChangeType = 'break' | 'form' | 'change_order';

export interface ElectronTransfer {
  id: string;
  type: ElectronTransferType;
  fromAtom: string;
  toAtom: string;
  fromBond?: string;
  toBond?: string;
  startTime: number;
  endTime: number;
  color: string;
  curvePoints: { x: number; y: number; z: number }[];
  electronCount: number;
}

export interface BondChange {
  id: string;
  type: BondChangeType;
  atom1: string;
  atom2: string;
  startTime: number;
  endTime: number;
  initialOrder: number;
  finalOrder: number;
  isTransitionState?: boolean;
}

export interface ReactionKeyframe {
  time: number;
  label: string;
  type: 'reactant' | 'transition_state' | 'intermediate' | 'product';
  atoms: { id: string; x: number; y: number; z: number }[];
  bonds: { atom1: string; atom2: string; order: number }[];
  energy: number;
  isHighlighted?: boolean;
}

export interface ReactionEnergyPoint {
  time: number;
  energy: number;
  label?: string;
  type?: 'reactant' | 'transition_state' | 'intermediate' | 'product';
}

export interface ReactionMechanism {
  id: string;
  name: string;
  type: ReactionType;
  description: string;
  chemicalEquation: string;
  reactants: Molecule[];
  products: Molecule[];
  keyframes: ReactionKeyframe[];
  electronTransfers: ElectronTransfer[];
  bondChanges: BondChange[];
  energyProfile: ReactionEnergyPoint[];
  activationEnergy: number;
  reactionEnthalpy: number;
  conditions?: {
    solvent?: string;
    temperature?: string;
    catalyst?: string;
  };
  notes?: string;
}

export interface ReactionSimulationState {
  isRunning: boolean;
  currentReaction: ReactionMechanism | null;
  currentTime: number;
  totalDuration: number;
  playbackSpeed: number;
  isPaused: boolean;
  currentKeyframe: number;
  showElectronFlow: boolean;
  showTransitionStates: boolean;
  showEnergyCurve: boolean;
  showBondChanges: boolean;
}

export interface AnimationParticle {
  id: string;
  position: { x: number; y: number; z: number };
  velocity: { x: number; y: number; z: number };
  color: string;
  size: number;
  life: number;
  maxLife: number;
  trail: { x: number; y: number; z: number }[];
}

export type SpectrumType = 'ir' | 'nmr_1h' | 'nmr_13c' | 'uv_vis';

export interface SpectrumPeak {
  wavelength: number;
  intensity: number;
  label?: string;
  assignment?: string;
  width?: number;
}

export interface IRSpectrum {
  type: 'ir';
  peaks: SpectrumPeak[];
  wavelengthRange: { min: number; max: number };
  resolution: number;
  baseline: number;
  functionalGroups: {
    name: string;
    wavelength: number;
    intensity: string;
    description: string;
  }[];
}

export interface NMRSpectrum {
  type: 'nmr_1h' | 'nmr_13c';
  nucleus: '1H' | '13C';
  peaks: SpectrumPeak[];
  shiftRange: { min: number; max: number };
  solvent: string;
  frequency: number;
  temperature: number;
  assignments: {
    shift: number;
    integration: number;
    multiplicity: string;
    coupling?: number;
    assignment: string;
  }[];
}

export interface UVViSpectrum {
  type: 'uv_vis';
  peaks: SpectrumPeak[];
  wavelengthRange: { min: number; max: number };
  resolution: number;
  solvent: string;
  pathLength: number;
  concentration: number;
  molarAbsorptivity: {
    wavelength: number;
    epsilon: number;
    transition?: string;
  }[];
}

export type SpectrumResult = IRSpectrum | NMRSpectrum | UVViSpectrum;

export interface SpectrumSimulationState {
  isSimulating: boolean;
  selectedSpectrumTypes: SpectrumType[];
  results: Partial<Record<SpectrumType, SpectrumResult>>;
  error: string | null;
  simulatedAt: Date | null;
  selectedPeak: SpectrumPeak | null;
}

export interface SpectrumParameters {
  ir: {
    resolution: number;
    baseline: number;
    peakWidth: number;
  };
  nmr_1h: {
    frequency: number;
    solvent: string;
    temperature: number;
    peakWidth: number;
  };
  nmr_13c: {
    frequency: number;
    solvent: string;
    temperature: number;
    peakWidth: number;
    decoupled: boolean;
  };
  uv_vis: {
    resolution: number;
    solvent: string;
    pathLength: number;
    concentration: number;
  };
}
