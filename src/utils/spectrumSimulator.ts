import {
  Molecule,
  Atom,
  Bond,
  SpectrumType,
  SpectrumResult,
  IRSpectrum,
  NMRSpectrum,
  UVViSpectrum,
  SpectrumPeak,
  SpectrumParameters,
} from '../types';

function hashString(str: string): number {
  let hash = 2166136261;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function hashMolecule(molecule: Molecule): number {
  const atomStr = molecule.atoms
    .map(a => `${a.element}:${a.x.toFixed(2)},${a.y.toFixed(2)},${a.z.toFixed(2)}`)
    .sort()
    .join('|');
  const bondStr = molecule.bonds
    .map(b => `${b.atom1}-${b.atom2}:${b.order}`)
    .sort()
    .join('|');
  return hashString(`${molecule.formula || ''}|${atomStr}|${bondStr}`);
}

function createSeededRandom(seed: number) {
  let s = seed >>> 0;
  return function(): number {
    s = Math.imul(s ^ (s >>> 11), 2654435761);
    s ^= s >>> 15;
    s = Math.imul(s, 1540483477);
    s ^= s >>> 13;
    return (s >>> 0) / 4294967295;
  };
}

function hashAtom(atom: Atom, index: number): number {
  return hashString(`${atom.element}:${atom.id || index}:${atom.x.toFixed(3)}:${atom.y.toFixed(3)}:${atom.z.toFixed(3)}`);
}

const IR_FUNCTIONAL_GROUPS: Record<string, {
  wavelength: number;
  intensity: string;
  description: string;
  bondTypes: string[];
}> = {
  'O-H (醇)': { wavelength: 3600, intensity: '强', description: '羟基伸缩振动', bondTypes: ['O-H'] },
  'O-H (羧酸)': { wavelength: 3000, intensity: '强宽', description: '羧酸羟基伸缩振动', bondTypes: ['O-H'] },
  'N-H': { wavelength: 3400, intensity: '中', description: '氨基伸缩振动', bondTypes: ['N-H'] },
  'C-H (sp3)': { wavelength: 2950, intensity: '强', description: '烷烃C-H伸缩', bondTypes: ['C-H'] },
  'C-H (sp2)': { wavelength: 3080, intensity: '中', description: '烯烃C-H伸缩', bondTypes: ['C-H'] },
  'C-H (芳香)': { wavelength: 3030, intensity: '弱', description: '芳香C-H伸缩', bondTypes: ['C-H'] },
  'C≡C': { wavelength: 2150, intensity: '弱', description: '炔烃伸缩振动', bondTypes: ['C≡C'] },
  'C≡N': { wavelength: 2250, intensity: '中', description: '氰基伸缩振动', bondTypes: ['C≡N'] },
  'C=O (酮)': { wavelength: 1715, intensity: '强', description: '酮羰基伸缩', bondTypes: ['C=O'] },
  'C=O (醛)': { wavelength: 1725, intensity: '强', description: '醛羰基伸缩', bondTypes: ['C=O'] },
  'C=O (羧酸)': { wavelength: 1710, intensity: '强', description: '羧酸羰基伸缩', bondTypes: ['C=O'] },
  'C=O (酯)': { wavelength: 1735, intensity: '强', description: '酯羰基伸缩', bondTypes: ['C=O'] },
  'C=O (酰胺)': { wavelength: 1650, intensity: '强', description: '酰胺羰基伸缩', bondTypes: ['C=O'] },
  'C=C': { wavelength: 1640, intensity: '中', description: '烯烃双键伸缩', bondTypes: ['C=C'] },
  'C-C (芳香)': { wavelength: 1600, intensity: '中', description: '芳香环骨架振动', bondTypes: ['C-C'] },
  'C-O': { wavelength: 1200, intensity: '强', description: '醇/醚C-O伸缩', bondTypes: ['C-O'] },
  'C-N': { wavelength: 1150, intensity: '中', description: '脂肪胺C-N伸缩', bondTypes: ['C-N'] },
  'C-Cl': { wavelength: 750, intensity: '强', description: '碳氯键伸缩', bondTypes: ['C-Cl'] },
  'C-Br': { wavelength: 650, intensity: '强', description: '碳溴键伸缩', bondTypes: ['C-Br'] },
  'C-I': { wavelength: 550, intensity: '强', description: '碳碘键伸缩', bondTypes: ['C-I'] },
};

const H_NMR_SHIFTS: Record<string, { base: number; range: number; description: string }> = {
  '烷烃': { base: 1.0, range: 0.5, description: '烷烃氢' },
  '烯烃': { base: 5.5, range: 1.0, description: '烯烃氢' },
  '芳香': { base: 7.2, range: 0.8, description: '芳香氢' },
  '醛': { base: 9.5, range: 0.5, description: '醛基氢' },
  '羧酸': { base: 11.0, range: 1.5, description: '羧酸氢' },
  '羟基': { base: 3.5, range: 1.5, description: '羟基氢' },
  '氨基': { base: 3.0, range: 1.0, description: '氨基氢' },
  '苄基': { base: 2.5, range: 0.5, description: '苄基氢' },
  '烯丙基': { base: 2.0, range: 0.5, description: '烯丙基氢' },
  '醚': { base: 3.5, range: 0.5, description: '醚α氢' },
  '酮': { base: 2.2, range: 0.3, description: '酮α氢' },
  '酯': { base: 2.0, range: 0.3, description: '酯α氢' },
  '腈': { base: 2.5, range: 0.3, description: '腈α氢' },
};

const C_NMR_SHIFTS: Record<string, { base: number; range: number; description: string }> = {
  '烷烃 (伯)': { base: 14, range: 5, description: '伯碳' },
  '烷烃 (仲)': { base: 25, range: 5, description: '仲碳' },
  '烷烃 (叔)': { base: 35, range: 5, description: '叔碳' },
  '烷烃 (季)': { base: 45, range: 5, description: '季碳' },
  '烯烃': { base: 125, range: 30, description: '烯烃碳' },
  '芳香': { base: 135, range: 30, description: '芳香碳' },
  '酮': { base: 205, range: 10, description: '酮羰基' },
  '醛': { base: 195, range: 10, description: '醛羰基' },
  '羧酸': { base: 180, range: 10, description: '羧酸羰基' },
  '酯': { base: 175, range: 10, description: '酯羰基' },
  '酰胺': { base: 170, range: 10, description: '酰胺羰基' },
  '腈': { base: 115, range: 10, description: '氰基碳' },
  '醇': { base: 65, range: 15, description: '醇碳' },
  '醚': { base: 70, range: 15, description: '醚碳' },
  '胺': { base: 55, range: 15, description: '胺碳' },
  '苄基': { base: 40, range: 10, description: '苄基碳' },
};

const UV_TRANSITIONS: Record<string, { wavelength: number; epsilon: number; description: string }> = {
  'σ→σ*': { wavelength: 135, epsilon: 10000, description: 'σ键电子跃迁' },
  'n→σ*': { wavelength: 195, epsilon: 5000, description: '孤对电子到σ*跃迁' },
  'π→π* (孤立)': { wavelength: 200, epsilon: 10000, description: '孤立双键π→π*跃迁' },
  'π→π* (共轭)': { wavelength: 250, epsilon: 20000, description: '共轭双键π→π*跃迁' },
  'n→π*': { wavelength: 280, epsilon: 100, description: '孤对电子到π*跃迁' },
  'π→π* (芳香)': { wavelength: 260, epsilon: 5000, description: '芳香环π→π*跃迁' },
  'π→π* (多烯)': { wavelength: 320, epsilon: 30000, description: '多烯体系π→π*跃迁' },
  '电荷转移': { wavelength: 400, epsilon: 5000, description: '电荷转移跃迁' },
};

function identifyFunctionalGroups(atoms: Atom[], bonds: Bond[], random: () => number): {
  name: string;
  wavelength: number;
  intensity: string;
  description: string;
  count: number;
}[] {
  const groups: {
    name: string;
    wavelength: number;
    intensity: string;
    description: string;
    count: number;
  }[] = [];
  const atomMap = new Map(atoms.map(a => [a.id, a]));
  const bondSet = new Set(bonds.map(b => [b.atom1, b.atom2].sort().join('-')));

  const hasBond = (atom1: string, atom2: string) => {
    return bondSet.has([atom1, atom2].sort().join('-'));
  };

  const getConnectedAtoms = (atomId: string) => {
    return bonds
      .filter(b => b.atom1 === atomId || b.atom2 === atomId)
      .map(b => {
        const otherId = b.atom1 === atomId ? b.atom2 : b.atom1;
        return { atom: atomMap.get(otherId)!, bond: b };
      });
  };

  for (const atom of atoms) {
    const connected = getConnectedAtoms(atom.id);
    const connectedElements = connected.map(c => c.atom.element);
    const bondOrders = connected.map(c => c.bond.order);

    if (atom.element === 'O') {
      if (connectedElements.includes('H')) {
        const hasCarbonConnected = connectedElements.includes('C');
        const carbonConnected = connected.find(c => c.atom.element === 'C');
        if (carbonConnected) {
          const carbonConnectedAtoms = getConnectedAtoms(carbonConnected.atom.id);
          const hasDoubleBondO = carbonConnectedAtoms.find(c => 
            c.atom.element === 'O' && c.bond.order === 2
          );
          if (hasDoubleBondO) {
            groups.push({
              name: 'O-H (羧酸)',
              wavelength: 3000 + random() * 100 - 50,
              intensity: '强宽',
              description: '羧酸羟基伸缩振动',
              count: 1,
            });
          } else if (hasCarbonConnected) {
            groups.push({
              name: 'O-H (醇)',
              wavelength: 3600 + random() * 50 - 25,
              intensity: '强',
              description: '羟基伸缩振动',
              count: 1,
            });
          }
        }
      }

      if (connected.some(c => c.bond.order === 2 && c.atom.element === 'C')) {
        const carbonAtom = connected.find(c => c.bond.order === 2 && c.atom.element === 'C')?.atom;
        if (carbonAtom) {
          const carbonConnections = getConnectedAtoms(carbonAtom.id);
          const otherConnections = carbonConnections.filter(c => c.atom.id !== atom.id);
          
          if (otherConnections.every(c => c.atom.element === 'C')) {
            groups.push({
              name: 'C=O (酮)',
              wavelength: 1715 + random() * 20 - 10,
              intensity: '强',
              description: '酮羰基伸缩',
              count: 1,
            });
          } else if (otherConnections.some(c => c.atom.element === 'H')) {
            groups.push({
              name: 'C=O (醛)',
              wavelength: 1725 + random() * 20 - 10,
              intensity: '强',
              description: '醛羰基伸缩',
              count: 1,
            });
          } else if (otherConnections.some(c => c.atom.element === 'O')) {
            groups.push({
              name: 'C=O (酯)',
              wavelength: 1735 + random() * 20 - 10,
              intensity: '强',
              description: '酯羰基伸缩',
              count: 1,
            });
          } else if (otherConnections.some(c => c.atom.element === 'N')) {
            groups.push({
              name: 'C=O (酰胺)',
              wavelength: 1650 + random() * 20 - 10,
              intensity: '强',
              description: '酰胺羰基伸缩',
              count: 1,
            });
          }
        }
      }

      if (connected.length === 2 && connected.every(c => c.bond.order === 1 && c.atom.element === 'C')) {
        groups.push({
          name: 'C-O',
          wavelength: 1200 + random() * 30 - 15,
          intensity: '强',
          description: '醚C-O伸缩',
          count: 1,
        });
      }
    }

    if (atom.element === 'N') {
      const hCount = connectedElements.filter(e => e === 'H').length;
      if (hCount > 0) {
        groups.push({
          name: 'N-H',
          wavelength: 3400 + random() * 40 - 20,
          intensity: '中',
          description: '氨基伸缩振动',
          count: hCount,
        });
      }

      const cConnected = connected.filter(c => c.atom.element === 'C');
      if (cConnected.length > 0) {
        groups.push({
          name: 'C-N',
          wavelength: 1150 + random() * 30 - 15,
          intensity: '中',
          description: '脂肪胺C-N伸缩',
          count: cConnected.length,
        });
      }

      if (connected.some(c => c.bond.order === 3 && c.atom.element === 'C')) {
        groups.push({
          name: 'C≡N',
          wavelength: 2250 + random() * 15 - 7.5,
          intensity: '中',
          description: '氰基伸缩振动',
          count: 1,
        });
      }
    }

    if (atom.element === 'C') {
      const connectedH = connected.filter(c => c.atom.element === 'H');
      const doubleBonds = connected.filter(c => c.bond.order === 2);
      const tripleBonds = connected.filter(c => c.bond.order === 3);
      const aromaticBonds = connected.filter(c => c.bond.order === 'aromatic');

      if (connectedH.length > 0) {
        if (aromaticBonds.length > 0) {
          groups.push({
            name: 'C-H (芳香)',
            wavelength: 3030 + random() * 20 - 10,
            intensity: '弱',
            description: '芳香C-H伸缩',
            count: connectedH.length,
          });
        } else if (doubleBonds.some(c => c.atom.element === 'C')) {
          groups.push({
            name: 'C-H (sp2)',
            wavelength: 3080 + random() * 20 - 10,
            intensity: '中',
            description: '烯烃C-H伸缩',
            count: connectedH.length,
          });
        } else {
          groups.push({
            name: 'C-H (sp3)',
            wavelength: 2950 + random() * 30 - 15,
            intensity: '强',
            description: '烷烃C-H伸缩',
            count: connectedH.length,
          });
        }
      }

      if (doubleBonds.some(c => c.atom.element === 'C')) {
        if (aromaticBonds.length === 0) {
          groups.push({
            name: 'C=C',
            wavelength: 1640 + random() * 30 - 15,
            intensity: '中',
            description: '烯烃双键伸缩',
            count: 1,
          });
        }
      }

      if (tripleBonds.some(c => c.atom.element === 'C')) {
        groups.push({
          name: 'C≡C',
          wavelength: 2150 + random() * 20 - 10,
          intensity: '弱',
          description: '炔烃伸缩振动',
          count: 1,
        });
      }

      if (aromaticBonds.length > 0) {
        groups.push({
          name: 'C-C (芳香)',
          wavelength: 1600 + random() * 20 - 10,
          intensity: '中',
          description: '芳香环骨架振动',
          count: 1,
        });
      }
    }

    if (atom.element === 'Cl' || atom.element === 'Br' || atom.element === 'I') {
      const bondType = `C-${atom.element}`;
      if (connectedElements.includes('C')) {
        const info = IR_FUNCTIONAL_GROUPS[bondType];
        if (info) {
          groups.push({
            name: bondType,
            wavelength: info.wavelength + random() * 20 - 10,
            intensity: info.intensity,
            description: info.description,
            count: 1,
          });
        }
      }
    }
  }

  const uniqueGroups = groups.reduce((acc, curr) => {
    const existing = acc.find(g => g.name === curr.name);
    if (existing) {
      existing.count += curr.count;
    } else {
      acc.push({ ...curr });
    }
    return acc;
  }, [] as typeof groups);

  return uniqueGroups.sort((a, b) => b.wavelength - a.wavelength);
}

function analyzeCarbonEnvironment(atoms: Atom[], bonds: Bond[], atom: Atom): {
  type: string;
  hybrid: string;
  neighbors: string[];
} {
  const atomMap = new Map(atoms.map(a => [a.id, a]));
  const connected = bonds
    .filter(b => b.atom1 === atom.id || b.atom2 === atom.id)
    .map(b => {
      const otherId = b.atom1 === atom.id ? b.atom2 : b.atom1;
      return { atom: atomMap.get(otherId)!, bond: b };
    });

  const hasAromatic = connected.some(c => c.bond.order === 'aromatic');
  const hasDoubleBond = connected.some(c => c.bond.order === 2);
  const hasTripleBond = connected.some(c => c.bond.order === 3);

  let hybrid = 'sp3';
  if (hasAromatic || hasDoubleBond) hybrid = 'sp2';
  if (hasTripleBond) hybrid = 'sp';

  const connectedElements = connected.map(c => c.atom.element);
  const hCount = connectedElements.filter(e => e === 'H').length;
  const heavyCount = connectedElements.filter(e => e !== 'H').length;

  let type = '烷烃';
  if (atom.element === 'C') {
    if (hasAromatic) {
      type = '芳香';
    } else if (hasDoubleBond) {
      const doubleBondAtom = connected.find(c => c.bond.order === 2)?.atom;
      if (doubleBondAtom?.element === 'O') {
        const otherNeighbors = connected.filter(c => c.bond.order !== 2 || c.atom.id !== doubleBondAtom.id);
        if (otherNeighbors.some(c => c.atom.element === 'O')) {
          type = '酯';
        } else if (otherNeighbors.some(c => c.atom.element === 'N')) {
          type = '酰胺';
        } else if (otherNeighbors.some(c => c.atom.element === 'H')) {
          type = '醛';
        } else {
          type = '酮';
        }
      } else if (doubleBondAtom?.element === 'C') {
        type = '烯烃';
      }
    } else if (hasTripleBond) {
      const tripleBondAtom = connected.find(c => c.bond.order === 3)?.atom;
      if (tripleBondAtom?.element === 'N') {
        type = '腈';
      } else {
        type = '炔烃';
      }
    } else {
      if (connectedElements.includes('O')) {
        type = '醇';
        const cCount = connectedElements.filter(e => e === 'C').length;
        if (cCount === 2) type = '醚';
      } else if (connectedElements.includes('N')) {
        type = '胺';
      } else if (heavyCount === 4 && hCount === 3) {
        type = '烷烃 (伯)';
      } else if (heavyCount === 4 && hCount === 2) {
        type = '烷烃 (仲)';
      } else if (heavyCount === 4 && hCount === 1) {
        type = '烷烃 (叔)';
      } else if (heavyCount === 4 && hCount === 0) {
        type = '烷烃 (季)';
      }

      const hasAromaticNeighbor = connected.some(c => {
        if (c.atom.element !== 'C') return false;
        const neighborBonds = bonds.filter(b => b.atom1 === c.atom.id || b.atom2 === c.atom.id);
        return neighborBonds.some(nb => nb.order === 'aromatic');
      });
      if (hasAromaticNeighbor && heavyCount === 4) {
        type = '苄基';
      }
    }
  }

  return {
    type,
    hybrid,
    neighbors: connectedElements,
  };
}

function analyzeHydrogenEnvironment(atoms: Atom[], bonds: Bond[], atom: Atom): {
  type: string;
  neighbors: number;
  heteroatoms: string[];
  multiplicity: string;
  integration: number;
} {
  const atomMap = new Map(atoms.map(a => [a.id, a]));
  const connected = bonds
    .filter(b => b.atom1 === atom.id || b.atom2 === atom.id)
    .map(b => {
      const otherId = b.atom1 === atom.id ? b.atom2 : b.atom1;
      return { atom: atomMap.get(otherId)!, bond: b };
    });

  const bondedAtom = connected[0]?.atom;
  if (!bondedAtom) {
    return { type: '烷烃', neighbors: 0, heteroatoms: [], multiplicity: 's', integration: 1 };
  }

  const bondedNeighbors = bonds
    .filter(b => b.atom1 === bondedAtom.id || b.atom2 === bondedAtom.id)
    .map(b => {
      const otherId = b.atom1 === bondedAtom.id ? b.atom2 : b.atom1;
      return { atom: atomMap.get(otherId)!, bond: b };
    })
    .filter(n => n.atom.id !== atom.id);

  const neighborHydrogens = bondedNeighbors.filter(n => n.atom.element === 'H').length;
  const heteroatoms = bondedNeighbors
    .filter(n => !['H', 'C'].includes(n.atom.element))
    .map(n => n.atom.element);

  const bondedEnvironment = analyzeCarbonEnvironment(atoms, bonds, bondedAtom);
  let type = '烷烃';

  if (bondedEnvironment.type === '芳香') {
    type = '芳香';
  } else if (bondedEnvironment.type === '烯烃') {
    type = '烯烃';
  } else if (bondedEnvironment.type === '醛') {
    type = '醛';
  } else if (bondedEnvironment.type === '酯' || bondedEnvironment.type === '羧酸') {
    type = '羧酸';
  } else if (bondedAtom.element === 'O') {
    type = '羟基';
  } else if (bondedAtom.element === 'N') {
    type = '氨基';
  } else if (heteroatoms.includes('O')) {
    type = '醚';
  } else if (bondedEnvironment.type === '酮') {
    type = '酮';
  } else if (bondedEnvironment.type === '苄基') {
    type = '苄基';
  } else if (bondedEnvironment.type === '烯烃') {
    type = '烯丙基';
  } else if (bondedEnvironment.type === '腈') {
    type = '腈';
  } else if (bondedEnvironment.type === '酯') {
    type = '酯';
  }

  let multiplicity = 's';
  if (neighborHydrogens === 1) multiplicity = 'd';
  else if (neighborHydrogens === 2) multiplicity = 't';
  else if (neighborHydrogens === 3) multiplicity = 'q';
  else if (neighborHydrogens > 3) multiplicity = 'm';

  return {
    type,
    neighbors: neighborHydrogens,
    heteroatoms,
    multiplicity,
    integration: 1,
  };
}

function analyzeUVTransitions(atoms: Atom[], bonds: Bond[], random: () => number): {
  name: string;
  wavelength: number;
  epsilon: number;
  description: string;
}[] {
  const transitions: {
    name: string;
    wavelength: number;
    epsilon: number;
    description: string;
  }[] = [];

  let doubleBondCount = 0;
  let aromaticRingCount = 0;
  let hasCarbonyl = false;
  let hasHeteroatom = false;
  let conjugationLength = 0;
  let hasNitrogen = false;
  let hasOxygen = false;

  for (const bond of bonds) {
    if (bond.order === 2) {
      doubleBondCount++;
      const atomMap = new Map(atoms.map(a => [a.id, a]));
      const a1 = atomMap.get(bond.atom1);
      const a2 = atomMap.get(bond.atom2);
      if (a1?.element === 'O' || a2?.element === 'O') {
        hasCarbonyl = true;
      } else if (a1?.element === 'C' && a2?.element === 'C') {
        conjugationLength++;
      }
    } else if (bond.order === 'aromatic') {
      aromaticRingCount++;
    }
  }

  for (const atom of atoms) {
    if (['N', 'O', 'S', 'P', 'F', 'Cl', 'Br', 'I'].includes(atom.element)) {
      hasHeteroatom = true;
      if (atom.element === 'N') hasNitrogen = true;
      if (atom.element === 'O') hasOxygen = true;
    }
  }

  const effectiveAromaticRings = Math.floor(aromaticRingCount / 6);

  if (conjugationLength >= 1) {
    if (conjugationLength >= 4) {
      transitions.push({
        name: 'π→π* (多烯)',
        wavelength: 250 + conjugationLength * 15 + random() * 20,
        epsilon: 20000 + conjugationLength * 2000,
        description: '多烯体系π→π*跃迁',
      });
    } else if (conjugationLength >= 2) {
      transitions.push({
        name: 'π→π* (共轭)',
        wavelength: 220 + conjugationLength * 10 + random() * 15,
        epsilon: 15000 + conjugationLength * 1000,
        description: '共轭双键π→π*跃迁',
      });
    } else {
      transitions.push({
        name: 'π→π* (孤立)',
        wavelength: 200 + random() * 10,
        epsilon: 10000,
        description: '孤立双键π→π*跃迁',
      });
    }
  }

  if (effectiveAromaticRings > 0) {
    transitions.push({
      name: 'π→π* (芳香)',
      wavelength: 255 + effectiveAromaticRings * 10 + random() * 15,
      epsilon: 5000 * effectiveAromaticRings,
      description: '芳香环π→π*跃迁',
    });
    
    if (effectiveAromaticRings >= 2) {
      transitions.push({
        name: 'π→π* (多环芳香)',
        wavelength: 310 + effectiveAromaticRings * 15 + random() * 20,
        epsilon: 8000 * effectiveAromaticRings,
        description: '多环芳香体系π→π*跃迁',
      });
    }
  }

  if (hasCarbonyl) {
    transitions.push({
      name: 'n→π*',
      wavelength: 280 + (effectiveAromaticRings > 0 ? 30 : 0) + random() * 10,
      epsilon: effectiveAromaticRings > 0 ? 150 : 100,
      description: '羰基孤对电子到π*跃迁',
    });
  }

  if (hasHeteroatom) {
    transitions.push({
      name: 'n→σ*',
      wavelength: 190 + (hasNitrogen ? 20 : 0) + (hasOxygen ? 10 : 0) + random() * 10,
      epsilon: 3000 + (hasOxygen ? 1000 : 0),
      description: '杂原子孤对电子到σ*跃迁',
    });
  }

  if (effectiveAromaticRings > 0 && hasHeteroatom) {
    transitions.push({
      name: '电荷转移',
      wavelength: 380 + effectiveAromaticRings * 20 + random() * 30,
      epsilon: 3000 + effectiveAromaticRings * 500,
      description: '电荷转移跃迁',
    });
  }

  transitions.push({
    name: 'σ→σ*',
    wavelength: 135 + random() * 10,
    epsilon: 8000,
    description: 'σ键电子跃迁',
  });

  return transitions.sort((a, b) => a.wavelength - b.wavelength);
}

function binomialCoefficient(n: number, k: number): number {
  if (k === 0 || k === n) return 1;
  const minK = Math.min(k, n - k);
  let result = 1;
  for (let i = 0; i < minK; i++) {
    result = (result * (n - i)) / (i + 1);
  }
  return result;
}

function splitNMRSignal(
  center: number,
  intensity: number,
  multiplicity: string,
  coupling: number | undefined,
  frequency: number,
  label: string,
  assignment: string
): { wavelength: number; intensity: number; label?: string; assignment?: string }[] {
  const jHz = coupling || 7.5;
  const jPpm = jHz / frequency;

  let n = 0;
  switch (multiplicity) {
    case 's': n = 0; break;
    case 'd': n = 1; break;
    case 't': n = 2; break;
    case 'q': n = 3; break;
    case 'quint': n = 4; break;
    case 'sext': n = 5; break;
    case 'sept': n = 6; break;
    case 'm': n = 4; break;
    default: n = 0;
  }

  const result: { wavelength: number; intensity: number; label?: string; assignment?: string }[] = [];

  if (n === 0) {
    result.push({ wavelength: center, intensity, label, assignment });
  } else {
    const totalIntensity = intensity;
    const coeffs: number[] = [];
    for (let i = 0; i <= n; i++) {
      coeffs.push(binomialCoefficient(n, i));
    }
    const sumCoeffs = coeffs.reduce((a, b) => a + b, 0);

    for (let i = 0; i <= n; i++) {
      const offset = (i - n / 2) * jPpm;
      const relIntensity = coeffs[i] / sumCoeffs;
      result.push({
        wavelength: center + offset,
        intensity: totalIntensity * relIntensity,
        label: i === Math.floor(n / 2) ? label : undefined,
        assignment: i === Math.floor(n / 2) ? assignment : undefined,
      });
    }
  }

  return result;
}

function generatePeaks(
  centers: { wavelength: number; intensity: number; label?: string; assignment?: string }[],
  min: number,
  max: number,
  resolution: number,
  peakWidth: number = 20
): SpectrumPeak[] {
  const peaks: SpectrumPeak[] = [];
  
  for (const center of centers) {
    const numPoints = Math.ceil((max - min) / resolution);
    for (let i = 0; i <= numPoints; i++) {
      const x = min + i * resolution;
      const gaussian = Math.exp(-Math.pow((x - center.wavelength) / peakWidth, 2) / 2);
      const intensity = center.intensity * gaussian;
      if (intensity > 0.01) {
        const existing = peaks.find(p => Math.abs(p.wavelength - x) < resolution / 2);
        if (existing) {
          existing.intensity = Math.max(existing.intensity, intensity);
        } else {
          peaks.push({
            wavelength: Math.round(x * 100) / 100,
            intensity: Math.round(intensity * 100) / 100,
            label: Math.abs(x - center.wavelength) < peakWidth / 2 ? center.label : undefined,
            assignment: Math.abs(x - center.wavelength) < peakWidth / 2 ? center.assignment : undefined,
            width: peakWidth,
          });
        }
      }
    }
  }

  return peaks.sort((a, b) => a.wavelength - b.wavelength);
}

export async function simulateIRSpectrum(
  molecule: Molecule,
  params: SpectrumParameters['ir']
): Promise<IRSpectrum> {
  await new Promise(resolve => setTimeout(resolve, 300));

  const seed = hashMolecule(molecule);
  const random = createSeededRandom(seed);

  const functionalGroups = identifyFunctionalGroups(molecule.atoms, molecule.bonds, random);
  
  const peakCenters = functionalGroups.map(g => ({
    wavelength: g.wavelength,
    intensity: g.count * (g.intensity.includes('强') ? 1.0 : g.intensity.includes('中') ? 0.6 : 0.3),
    label: g.name,
    assignment: g.description,
  }));

  const peaks = generatePeaks(
    peakCenters,
    400,
    4000,
    params.resolution,
    params.peakWidth
  ).map(p => ({
    ...p,
    intensity: params.baseline + (1 - params.baseline) * p.intensity,
  }));

  return {
    type: 'ir',
    peaks,
    wavelengthRange: { min: 400, max: 4000 },
    resolution: params.resolution,
    baseline: params.baseline,
    functionalGroups: functionalGroups.map(g => ({
      name: g.name,
      wavelength: Math.round(g.wavelength * 10) / 10,
      intensity: g.intensity,
      description: g.description,
    })),
  };
}

export async function simulateNMR1HSpectrum(
  molecule: Molecule,
  params: SpectrumParameters['nmr_1h']
): Promise<NMRSpectrum> {
  await new Promise(resolve => setTimeout(resolve, 400));

  const seed = hashMolecule(molecule);
  const random = createSeededRandom(seed);

  const hydrogenAtoms = molecule.atoms.filter(a => a.element === 'H');
  const assignments: NMRSpectrum['assignments'] = [];

  for (let i = 0; i < hydrogenAtoms.length; i++) {
    const hAtom = hydrogenAtoms[i];
    const atomSeed = hashAtom(hAtom, i);
    const atomRandom = createSeededRandom(seed ^ atomSeed);

    const env = analyzeHydrogenEnvironment(molecule.atoms, molecule.bonds, hAtom);
    const shiftInfo = H_NMR_SHIFTS[env.type] || H_NMR_SHIFTS['烷烃'];
    const shift = shiftInfo.base + (atomRandom() - 0.5) * shiftInfo.range;
    
    const baseCoupling = env.neighbors > 0 ? 7.0 + atomRandom() * 3.0 : undefined;
    let actualCoupling = baseCoupling;
    if (baseCoupling !== undefined) {
      if (env.type === '烯烃') actualCoupling = 10 + atomRandom() * 6;
      else if (env.type === '芳香') actualCoupling = 7.5 + atomRandom() * 1.5;
      else if (env.type === '炔烃') actualCoupling = 2.5 + atomRandom() * 1;
    }

    assignments.push({
      shift: Math.round(shift * 100) / 100,
      integration: env.integration,
      multiplicity: env.multiplicity,
      coupling: actualCoupling,
      assignment: shiftInfo.description,
    });
  }

  const uniqueAssignments = assignments.reduce((acc, curr) => {
    const existing = acc.find(a => Math.abs(a.shift - curr.shift) < 0.1);
    if (existing) {
      existing.integration += curr.integration;
    } else {
      acc.push({ ...curr });
    }
    return acc;
  }, [] as NMRSpectrum['assignments']).sort((a, b) => b.shift - a.shift);

  let peakCenters: { wavelength: number; intensity: number; label?: string; assignment?: string }[] = [];
  for (const a of uniqueAssignments) {
    const splitPeaks = splitNMRSignal(
      a.shift,
      a.integration * 0.8,
      a.multiplicity,
      a.coupling,
      params.frequency,
      `${a.shift.toFixed(2)} ppm`,
      `${a.assignment} (${a.multiplicity}, J=${a.coupling?.toFixed(1) || '-'} Hz)`
    );
    peakCenters = peakCenters.concat(splitPeaks);
  }

  const peaks = generatePeaks(
    peakCenters,
    0,
    12,
    0.01,
    params.peakWidth
  ).map(p => ({
    ...p,
    wavelength: Math.round(p.wavelength * 100) / 100,
  }));

  return {
    type: 'nmr_1h',
    nucleus: '1H',
    peaks,
    shiftRange: { min: 0, max: 12 },
    solvent: params.solvent,
    frequency: params.frequency,
    temperature: params.temperature,
    assignments: uniqueAssignments,
  };
}

export async function simulateNMR13CSpectrum(
  molecule: Molecule,
  params: SpectrumParameters['nmr_13c']
): Promise<NMRSpectrum> {
  await new Promise(resolve => setTimeout(resolve, 400));

  const seed = hashMolecule(molecule);
  const random = createSeededRandom(seed);

  const carbonAtoms = molecule.atoms.filter(a => a.element === 'C');
  const assignments: NMRSpectrum['assignments'] = [];

  for (let i = 0; i < carbonAtoms.length; i++) {
    const cAtom = carbonAtoms[i];
    const atomSeed = hashAtom(cAtom, i);
    const atomRandom = createSeededRandom(seed ^ atomSeed);

    const env = analyzeCarbonEnvironment(molecule.atoms, molecule.bonds, cAtom);
    const shiftInfo = C_NMR_SHIFTS[env.type] || C_NMR_SHIFTS['烷烃 (仲)'];
    const shift = shiftInfo.base + (atomRandom() - 0.5) * shiftInfo.range;
    
    let multiplicity = 's';
    let coupling: number | undefined = undefined;

    if (!params.decoupled) {
      const atomMap = new Map(molecule.atoms.map(a => [a.id, a]));
      const connected = molecule.bonds
        .filter(b => b.atom1 === cAtom.id || b.atom2 === cAtom.id)
        .map(b => {
          const otherId = b.atom1 === cAtom.id ? b.atom2 : b.atom1;
          return atomMap.get(otherId)!;
        });
      const hCount = connected.filter(a => a.element === 'H').length;
      
      if (hCount === 1) multiplicity = 'd';
      else if (hCount === 2) multiplicity = 't';
      else if (hCount === 3) multiplicity = 'q';
      else if (hCount > 3) multiplicity = 'm';

      coupling = 120 + atomRandom() * 40;
    }

    assignments.push({
      shift: Math.round(shift * 10) / 10,
      integration: 1,
      multiplicity,
      coupling,
      assignment: shiftInfo.description,
    });
  }

  const uniqueAssignments = assignments.reduce((acc, curr) => {
    const existing = acc.find(a => Math.abs(a.shift - curr.shift) < 0.5);
    if (existing) {
      existing.integration += curr.integration;
    } else {
      acc.push({ ...curr });
    }
    return acc;
  }, [] as NMRSpectrum['assignments']).sort((a, b) => b.shift - a.shift);

  let peakCenters: { wavelength: number; intensity: number; label?: string; assignment?: string }[] = [];
  for (const a of uniqueAssignments) {
    const splitPeaks = splitNMRSignal(
      a.shift,
      0.9,
      a.multiplicity,
      a.coupling,
      params.frequency,
      `${a.shift.toFixed(1)} ppm`,
      a.assignment + (a.coupling ? ` (${a.multiplicity}, J=${a.coupling.toFixed(0)} Hz)` : ''),
    );
    peakCenters = peakCenters.concat(splitPeaks);
  }

  const peaks = generatePeaks(
    peakCenters,
    0,
    220,
    0.05,
    params.peakWidth
  ).map(p => ({
    ...p,
    wavelength: Math.round(p.wavelength * 10) / 10,
  }));

  return {
    type: 'nmr_13c',
    nucleus: '13C',
    peaks,
    shiftRange: { min: 0, max: 220 },
    solvent: params.solvent,
    frequency: params.frequency,
    temperature: params.temperature,
    assignments: uniqueAssignments,
  };
}

export async function simulateUVViSSpectrum(
  molecule: Molecule,
  params: SpectrumParameters['uv_vis']
): Promise<UVViSpectrum> {
  await new Promise(resolve => setTimeout(resolve, 350));

  const seed = hashMolecule(molecule);
  const random = createSeededRandom(seed);

  const transitions = analyzeUVTransitions(molecule.atoms, molecule.bonds, random);

  const peakCenters = transitions.map(t => ({
    wavelength: t.wavelength,
    intensity: Math.min(1, Math.log10(t.epsilon) / 5),
    label: `${t.wavelength.toFixed(0)} nm`,
    assignment: `${t.name} - ${t.description}`,
  }));

  const peaks = generatePeaks(
    peakCenters,
    200,
    800,
    params.resolution,
    15
  ).map(p => ({
    ...p,
    wavelength: Math.round(p.wavelength * 10) / 10,
  }));

  return {
    type: 'uv_vis',
    peaks,
    wavelengthRange: { min: 200, max: 800 },
    resolution: params.resolution,
    solvent: params.solvent,
    pathLength: params.pathLength,
    concentration: params.concentration,
    molarAbsorptivity: transitions.map(t => ({
      wavelength: Math.round(t.wavelength * 10) / 10,
      epsilon: t.epsilon,
      transition: t.name,
    })),
  };
}

export const defaultSpectrumParameters: SpectrumParameters = {
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

export async function simulateSpectrum(
  molecule: Molecule,
  type: SpectrumType,
  params: SpectrumParameters
): Promise<SpectrumResult> {
  switch (type) {
    case 'ir':
      return simulateIRSpectrum(molecule, params.ir);
    case 'nmr_1h':
      return simulateNMR1HSpectrum(molecule, params.nmr_1h);
    case 'nmr_13c':
      return simulateNMR13CSpectrum(molecule, params.nmr_13c);
    case 'uv_vis':
      return simulateUVViSSpectrum(molecule, params.uv_vis);
    default:
      throw new Error(`Unknown spectrum type: ${type}`);
  }
}

export async function simulateAllSpectra(
  molecule: Molecule,
  types: SpectrumType[],
  params: SpectrumParameters
): Promise<Partial<Record<SpectrumType, SpectrumResult>>> {
  const results: Partial<Record<SpectrumType, SpectrumResult>> = {};
  
  for (const type of types) {
    results[type] = await simulateSpectrum(molecule, type, params);
  }
  
  return results;
}
