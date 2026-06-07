import { Atom, Bond, Molecule } from '../types';

const generateId = () => Math.random().toString(36).substr(2, 9);

export const createAtom = (
  element: string,
  x: number,
  y: number,
  z: number,
  charge: number = 0,
  residue?: string,
  chain?: string,
  residueIndex?: number
): Atom => ({
  id: generateId(),
  element,
  x,
  y,
  z,
  charge,
  residue,
  chain,
  residueIndex,
});

export const createBond = (
  atom1: string,
  atom2: string,
  order: 1 | 2 | 3 | 'aromatic',
  length: number
): Bond => ({
  id: generateId(),
  atom1,
  atom2,
  order,
  length,
});

export const calculateBondLength = (atom1: Atom, atom2: Atom): number => {
  const dx = atom1.x - atom2.x;
  const dy = atom1.y - atom2.y;
  const dz = atom1.z - atom2.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
};

export const addAtomToMolecule = (
  molecule: Molecule,
  element: string,
  x: number,
  y: number,
  z: number,
  charge: number = 0
): { molecule: Molecule; newAtom: Atom } => {
  const newAtom = createAtom(element, x, y, z, charge);
  const newAtoms = [...molecule.atoms, newAtom];
  
  let newBonds = [...molecule.bonds];
  
  const updatedMolecule = {
    ...molecule,
    atoms: newAtoms,
    bonds: newBonds,
  };
  
  return { molecule: updatedMolecule, newAtom };
};

export const deleteAtomFromMolecule = (
  molecule: Molecule,
  atomId: string
): { molecule: Molecule; deletedAtom: Atom | null; deletedBonds: Bond[] } => {
  const atomToDelete = molecule.atoms.find(a => a.id === atomId);
  if (!atomToDelete) {
    return { molecule, deletedAtom: null, deletedBonds: [] };
  }
  
  const bondsToDelete = molecule.bonds.filter(
    b => b.atom1 === atomId || b.atom2 === atomId
  );
  
  const newAtoms = molecule.atoms.filter(a => a.id !== atomId);
  const newBonds = molecule.bonds.filter(
    b => b.atom1 !== atomId && b.atom2 !== atomId
  );
  
  const updatedMolecule = {
    ...molecule,
    atoms: newAtoms,
    bonds: newBonds,
  };
  
  return { molecule: updatedMolecule, deletedAtom: atomToDelete, deletedBonds: bondsToDelete };
};

export const addBondToMolecule = (
  molecule: Molecule,
  atom1Id: string,
  atom2Id: string,
  order: 1 | 2 | 3 | 'aromatic'
): { molecule: Molecule; newBond: Bond | null } => {
  if (atom1Id === atom2Id) {
    return { molecule, newBond: null };
  }
  
  const existingBond = molecule.bonds.find(
    b => (b.atom1 === atom1Id && b.atom2 === atom2Id) || 
         (b.atom1 === atom2Id && b.atom2 === atom1Id)
  );
  
  if (existingBond) {
    return { molecule, newBond: null };
  }
  
  const atom1 = molecule.atoms.find(a => a.id === atom1Id);
  const atom2 = molecule.atoms.find(a => a.id === atom2Id);
  
  if (!atom1 || !atom2) {
    return { molecule, newBond: null };
  }
  
  const length = calculateBondLength(atom1, atom2);
  const newBond = createBond(atom1Id, atom2Id, order, length);
  
  const updatedMolecule = {
    ...molecule,
    bonds: [...molecule.bonds, newBond],
  };
  
  return { molecule: updatedMolecule, newBond };
};

export const deleteBondFromMolecule = (
  molecule: Molecule,
  bondId: string
): { molecule: Molecule; deletedBond: Bond | null } => {
  const bondToDelete = molecule.bonds.find(b => b.id === bondId);
  if (!bondToDelete) {
    return { molecule, deletedBond: null };
  }
  
  const newBonds = molecule.bonds.filter(b => b.id !== bondId);
  
  const updatedMolecule = {
    ...molecule,
    bonds: newBonds,
  };
  
  return { molecule: updatedMolecule, deletedBond: bondToDelete };
};

export const updateAtomProperty = (
  molecule: Molecule,
  atomId: string,
  updates: Partial<Pick<Atom, 'element' | 'x' | 'y' | 'z' | 'charge' | 'residue' | 'chain'>>
): { molecule: Molecule; updatedAtom: Atom | null } => {
  const atomIndex = molecule.atoms.findIndex(a => a.id === atomId);
  if (atomIndex === -1) {
    return { molecule, updatedAtom: null };
  }
  
  const originalAtom = molecule.atoms[atomIndex];
  const updatedAtom = { ...originalAtom, ...updates };
  
  const newAtoms = [...molecule.atoms];
  newAtoms[atomIndex] = updatedAtom;
  
  const newBonds = molecule.bonds.map(bond => {
    if (bond.atom1 === atomId || bond.atom2 === atomId) {
      const a1 = bond.atom1 === atomId ? updatedAtom : molecule.atoms.find(a => a.id === bond.atom1)!;
      const a2 = bond.atom2 === atomId ? updatedAtom : molecule.atoms.find(a => a.id === bond.atom2)!;
      return {
        ...bond,
        length: calculateBondLength(a1, a2),
      };
    }
    return bond;
  });
  
  const updatedMolecule = {
    ...molecule,
    atoms: newAtoms,
    bonds: newBonds,
  };
  
  return { molecule: updatedMolecule, updatedAtom };
};

export const updateBondOrder = (
  molecule: Molecule,
  bondId: string,
  newOrder: 1 | 2 | 3 | 'aromatic'
): { molecule: Molecule; updatedBond: Bond | null } => {
  const bondIndex = molecule.bonds.findIndex(b => b.id === bondId);
  if (bondIndex === -1) {
    return { molecule, updatedBond: null };
  }
  
  const originalBond = molecule.bonds[bondIndex];
  const updatedBond = { ...originalBond, order: newOrder };
  
  const newBonds = [...molecule.bonds];
  newBonds[bondIndex] = updatedBond;
  
  const updatedMolecule = {
    ...molecule,
    bonds: newBonds,
  };
  
  return { molecule: updatedMolecule, updatedBond };
};

export const createNewMolecule = (name: string = '新分子'): Molecule => ({
  id: generateId(),
  name,
  formula: '',
  type: 'small_molecule',
  atoms: [],
  bonds: [],
  description: '用户自定义分子',
  category: '自定义',
});

export const updateMoleculeFormula = (molecule: Molecule): Molecule => {
  const elementCounts: Record<string, number> = {};
  
  molecule.atoms.forEach(atom => {
    const symbol = atom.element.charAt(0).toUpperCase() + atom.element.slice(1).toLowerCase();
    elementCounts[symbol] = (elementCounts[symbol] || 0) + 1;
  });
  
  const sortedElements = Object.keys(elementCounts).sort((a, b) => {
    if (a === 'C') return -1;
    if (b === 'C') return 1;
    if (a === 'H') return -1;
    if (b === 'H') return 1;
    return a.localeCompare(b);
  });
  
  const formula = sortedElements
    .map(el => {
      const count = elementCounts[el];
      if (count === 1) return el;
      const subscript = count.toString().split('').map(d => 
        String.fromCharCode(0x2080 + parseInt(d))
      ).join('');
      return el + subscript;
    })
    .join('');
  
  return {
    ...molecule,
    formula,
  };
};

export const findNearestAtom = (
  atoms: Atom[],
  x: number,
  y: number,
  z: number,
  maxDistance: number = 3.0
): Atom | null => {
  let nearest: Atom | null = null;
  let minDist = maxDistance;
  
  atoms.forEach(atom => {
    const dx = atom.x - x;
    const dy = atom.y - y;
    const dz = atom.z - z;
    const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
    if (dist < minDist) {
      minDist = dist;
      nearest = atom;
    }
  });
  
  return nearest;
};

export const autoBondToNearest = (
  molecule: Molecule,
  newAtomId: string,
  maxBondLength: number = 1.8
): Molecule => {
  const newAtom = molecule.atoms.find(a => a.id === newAtomId);
  if (!newAtom) return molecule;
  
  let updatedMolecule = molecule;
  
  molecule.atoms.forEach(atom => {
    if (atom.id === newAtomId) return;
    
    const length = calculateBondLength(newAtom, atom);
    if (length <= maxBondLength) {
      const result = addBondToMolecule(updatedMolecule, newAtomId, atom.id, 1);
      if (result.newBond) {
        updatedMolecule = result.molecule;
      }
    }
  });
  
  return updatedMolecule;
};

export const addHydrogens = (
  molecule: Molecule,
  atomId: string
): Molecule => {
  const atom = molecule.atoms.find(a => a.id === atomId);
  if (!atom) return molecule;
  
  const connectedBonds = molecule.bonds.filter(
    b => b.atom1 === atomId || b.atom2 === atomId
  );
  
  const bondOrderSum = connectedBonds.reduce((sum, b) => {
    const order = b.order === 'aromatic' ? 1.5 : b.order;
    return sum + order;
  }, 0);
  
  const maxValence: Record<string, number> = {
    H: 1, C: 4, N: 3, O: 2, F: 1, P: 5, S: 6,
    Cl: 1, Br: 1, I: 1,
  };
  
  const valence = maxValence[atom.element] || 4;
  const hydrogensNeeded = Math.max(0, Math.round(valence - bondOrderSum));
  
  let updatedMolecule = molecule;
  const bondLength = 1.09;
  
  for (let i = 0; i < hydrogensNeeded; i++) {
    const angle = (i / hydrogensNeeded) * Math.PI * 2;
    const elevation = (i % 2) * Math.PI / 4 - Math.PI / 8;
    
    const hx = atom.x + Math.cos(angle) * Math.cos(elevation) * bondLength;
    const hy = atom.y + Math.sin(angle) * Math.cos(elevation) * bondLength;
    const hz = atom.z + Math.sin(elevation) * bondLength;
    
    const result = addAtomToMolecule(updatedMolecule, 'H', hx, hy, hz);
    updatedMolecule = result.molecule;
    
    const bondResult = addBondToMolecule(updatedMolecule, atomId, result.newAtom.id, 1);
    updatedMolecule = bondResult.molecule;
  }
  
  return updatedMolecule;
};
