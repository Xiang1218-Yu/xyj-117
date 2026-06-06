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

export type DisplayMode = 'ball_stick' | 'space_filling' | 'ribbon' | 'surface';
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
