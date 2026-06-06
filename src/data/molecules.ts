import { Molecule, Atom, Bond } from '../types';

const generateId = () => Math.random().toString(36).substr(2, 9);

const createAtom = (element: string, x: number, y: number, z: number, residue?: string, chain?: string, residueIndex?: number): Atom => ({
  id: generateId(),
  element,
  x,
  y,
  z,
  residue,
  chain,
  residueIndex,
  charge: 0,
});

const createBond = (atom1: string, atom2: string, order: 1 | 2 | 3 | 'aromatic', length: number): Bond => ({
  id: generateId(),
  atom1,
  atom2,
  order,
  length,
});

export const waterMolecule: Molecule = (() => {
  const o = createAtom('O', 0, 0, 0);
  const h1 = createAtom('H', 0.76, 0.58, 0);
  const h2 = createAtom('H', -0.76, 0.58, 0);
  const bonds = [
    createBond(o.id, h1.id, 1, 0.96),
    createBond(o.id, h2.id, 1, 0.96),
  ];
  return {
    id: 'water',
    name: '水分子',
    formula: 'H₂O',
    type: 'small_molecule',
    atoms: [o, h1, h2],
    bonds,
    description: '水分子，生命之源，最基本的溶剂分子',
    category: '基础分子',
  };
})();

export const aspirinMolecule: Molecule = (() => {
  const atoms: Atom[] = [];
  const bonds: Bond[] = [];
  const positions = [
    ['C', -1.20, 0.0, 0.0],
    ['C', 0.0, 0.0, 0.0],
    ['C', 1.20, 1.20, 0.0],
    ['C', 1.20, -1.20, 0.0],
    ['C', 2.40, 1.20, 0.0],
    ['C', 2.40, -1.20, 0.0],
    ['O', 3.60, 0.0, 0.0],
    ['O', 0.0, 1.20, 0.0],
    ['C', 0.0, 2.60, 0.0],
    ['O', -1.20, 2.60, 0.0],
    ['O', -2.40, 0.0, 0.0],
    ['C', -2.40, 1.20, 0.0],
    ['H', 1.20, 2.20, 0.0],
    ['H', 1.20, -2.20, 0.0],
    ['H', 3.30, 2.00, 0.0],
    ['H', 3.30, -2.00, 0.0],
  ];

  positions.forEach(([el, x, y, z]) => {
    atoms.push(createAtom(el as string, x as number, y as number, z as number));
  });

  const bondPairs = [
    [0, 1, 1], [1, 2, 1], [1, 3, 1], [2, 4, 2], [3, 5, 2],
    [4, 5, 1], [4, 6, 1], [2, 7, 1], [7, 8, 1], [8, 9, 2],
    [0, 10, 2], [0, 11, 1], [2, 12, 1], [3, 13, 1], [4, 14, 1],
    [5, 15, 1],
  ];

  bondPairs.forEach(([i, j, o]) => {
    bonds.push(createBond(atoms[i as number].id, atoms[j as number].id, o as 1 | 2, 1.4));
  });

  return {
    id: 'aspirin',
    name: '阿司匹林',
    formula: 'C₉H₈O₄',
    type: 'small_molecule',
    atoms,
    bonds,
    description: '乙酰水杨酸，常用的解热镇痛药物',
    category: '药物分子',
  };
})();

export const caffeineMolecule: Molecule = (() => {
  const atoms: Atom[] = [];
  const bonds: Bond[] = [];
  const positions = [
    ['N', 0.0, 0.0, 0.0],
    ['C', 1.40, 0.0, 0.0],
    ['N', 2.10, 1.20, 0.0],
    ['C', 1.40, 2.40, 0.0],
    ['C', 0.0, 2.40, 0.0],
    ['N', -0.70, 1.20, 0.0],
    ['C', 2.10, -1.20, 0.0],
    ['O', 3.20, -1.20, 0.0],
    ['N', 0.70, 3.60, 0.0],
    ['C', -0.70, 3.60, 0.0],
    ['O', -1.90, 1.20, 0.0],
    ['C', -0.70, -1.20, 0.0],
    ['C', 3.50, 1.20, 0.0],
    ['H', 3.90, 2.20, 0.0],
    ['H', 3.50, 0.20, 0.0],
    ['H', -0.70, -1.70, 0.9],
    ['H', -1.20, -1.70, -0.9],
    ['H', 0.30, -1.70, 0.0],
    ['H', -1.20, 4.10, 0.9],
    ['H', -0.20, 4.10, -0.9],
    ['H', 1.20, 4.10, 0.0],
  ];

  positions.forEach(([el, x, y, z]) => {
    atoms.push(createAtom(el as string, x as number, y as number, z as number));
  });

  return {
    id: 'caffeine',
    name: '咖啡因',
    formula: 'C₈H₁₀N₄O₂',
    type: 'small_molecule',
    atoms,
    bonds,
    description: '黄嘌呤生物碱，中枢神经系统兴奋剂',
    category: '药物分子',
  };
})();

export const benzeneMolecule: Molecule = (() => {
  const atoms: Atom[] = [];
  const bonds: Bond[] = [];
  const radius = 1.39;

  for (let i = 0; i < 6; i++) {
    const angle = (i * Math.PI) / 3;
    atoms.push(createAtom('C', Math.cos(angle) * radius, Math.sin(angle) * radius, 0));
  }
  for (let i = 0; i < 6; i++) {
    const angle = (i * Math.PI) / 3;
    atoms.push(createAtom('H', Math.cos(angle) * (radius + 1.08), Math.sin(angle) * (radius + 1.08), 0));
  }

  for (let i = 0; i < 6; i++) {
    const order: 'aromatic' = 'aromatic';
    bonds.push(createBond(atoms[i].id, atoms[(i + 1) % 6].id, order, 1.39));
  }
  for (let i = 0; i < 6; i++) {
    bonds.push(createBond(atoms[i].id, atoms[i + 6].id, 1, 1.08));
  }

  return {
    id: 'benzene',
    name: '苯',
    formula: 'C₆H₆',
    type: 'small_molecule',
    atoms,
    bonds,
    description: '芳香烃化合物，最简单的芳香族化合物',
    category: '有机分子',
  };
})();

export const ethanolMolecule: Molecule = (() => {
  const atoms: Atom[] = [
    createAtom('C', -0.75, 0.0, 0.0),
    createAtom('C', 0.75, 0.0, 0.0),
    createAtom('O', 1.75, 1.0, 0.0),
    createAtom('H', -1.25, 0.0, 1.0),
    createAtom('H', -1.25, 0.9, -0.5),
    createAtom('H', -1.25, -0.9, -0.5),
    createAtom('H', 0.75, 1.0, 0.0),
    createAtom('H', 0.75, -0.5, -0.9),
    createAtom('H', 1.75, 1.8, 0.0),
  ];

  const bonds: Bond[] = [
    createBond(atoms[0].id, atoms[1].id, 1, 1.54),
    createBond(atoms[1].id, atoms[2].id, 1, 1.43),
    createBond(atoms[0].id, atoms[3].id, 1, 1.09),
    createBond(atoms[0].id, atoms[4].id, 1, 1.09),
    createBond(atoms[0].id, atoms[5].id, 1, 1.09),
    createBond(atoms[1].id, atoms[6].id, 1, 1.09),
    createBond(atoms[1].id, atoms[7].id, 1, 1.09),
    createBond(atoms[2].id, atoms[8].id, 1, 0.96),
  ];

  return {
    id: 'ethanol',
    name: '乙醇',
    formula: 'C₂H₆O',
    type: 'small_molecule',
    atoms,
    bonds,
    description: '酒精，常见的有机溶剂和消毒剂',
    category: '有机分子',
  };
})();

const createAlphaHelix = (sequence: string, chainId: string): Molecule => {
  const atoms: Atom[] = [];
  const bonds: Bond[] = [];
  const residues = sequence.split('');
  const rise = 1.5;
  const angle = 0;

  residues.forEach((res, i) => {
    const z = i * rise;
    const theta = i * 100 * Math.PI / 180;
    const radius = 2.3;
    
    const ca = createAtom('C', Math.cos(theta) * radius, Math.sin(theta) * radius, z, res, chainId, i);
    const n = createAtom('N', Math.cos(theta + 0.4) * (radius - 0.5), Math.sin(theta + 0.4) * (radius - 0.5), z - 0.5, res, chainId, i);
    const c = createAtom('C', Math.cos(theta - 0.4) * (radius + 0.5), Math.sin(theta - 0.4) * (radius + 0.5), z + 0.5, res, chainId, i);
    const o = createAtom('O', Math.cos(theta - 0.6) * (radius + 1.0), Math.sin(theta - 0.6) * (radius + 1.0), z + 0.7, res, chainId, i);
    
    atoms.push(ca, n, c, o);
    
    if (i > 0) {
      const prevN = atoms[(i - 1) * 4 + 1];
      bonds.push(createBond(prevN.id, ca.id, 1, 1.33));
    }
    bonds.push(createBond(n.id, ca.id, 1, 1.46));
    bonds.push(createBond(ca.id, c.id, 1, 1.52));
    bonds.push(createBond(c.id, o.id, 2, 1.23));
  });

  return {
    id: 'helix-' + chainId,
    name: 'α-螺旋多肽',
    formula: '(' + sequence + ')n',
    type: 'protein',
    atoms,
    bonds,
    sequence,
    description: '经典的α-螺旋二级结构',
    category: '蛋白质',
  };
};

export const alphaHelix: Molecule = createAlphaHelix('ACDEFGHIKLMNPQRSTVWY', 'A');

export const grapheneSheet: Molecule = (() => {
  const atoms: Atom[] = [];
  const bonds: Bond[] = [];
  const a = 1.42;
  const layers = 4;
  const rows = 6;

  for (let layer = 0; layer < layers; layer++) {
    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < rows; j++) {
        const x = i * a * 1.5;
        const y = j * a * Math.sqrt(3);
        const offset = (i % 2) * a * Math.sqrt(3) / 2;
        
        const c1 = createAtom('C', x, y + offset, layer * 3.35);
        atoms.push(c1);
        
        if (j < rows - 1) {
          const c2 = createAtom('C', x, y + offset + a * Math.sqrt(3), layer * 3.35);
          atoms.push(c2);
          bonds.push(createBond(c1.id, c2.id, 'aromatic', 1.42));
        }
        
        if (i < layers - 1 && j < rows - 1) {
          const c3 = atoms.find(a => Math.abs(a.x - (x + 1.42 * 1.5)) < 0.1 && Math.abs(a.y - (y + offset + 1.42 * Math.sqrt(3) / 2)) < 0.1 && Math.abs(a.z - layer * 3.35) < 0.1);
          if (c3) {
            bonds.push(createBond(c1.id, c3.id, 'aromatic', 1.42));
          }
        }
      }
    }
  }

  return {
    id: 'graphene',
    name: '石墨烯',
    formula: 'C',
    type: 'material',
    atoms,
    bonds,
    description: '单层碳原子构成的二维材料',
    category: '纳米材料',
  };
})();

export const siliconCrystal: Molecule = (() => {
  const atoms: Atom[] = [];
  const bonds: Bond[] = [];
  const a = 5.43;
  const size = 3;

  const latticePoints = [
    [0, 0, 0], [0.5, 0.5, 0], [0.5, 0, 0.5], [0, 0.5, 0.5],
    [0.25, 0.25, 0.25], [0.75, 0.75, 0.25], [0.75, 0.25, 0.75], [0.25, 0.75, 0.75],
  ];

  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) {
      for (let k = 0; k < size; k++) {
        latticePoints.forEach(([dx, dy, dz]) => {
          const x = (i + dx) * a;
          const y = (j + dy) * a;
          const z = (k + dz) * a;
          atoms.push(createAtom('Si', x - size * a / 2, y - size * a / 2, z - size * a / 2));
        });
      }
    }
  }

  for (let i = 0; i < atoms.length; i++) {
    for (let j = i + 1; j < atoms.length; j++) {
      const dx = atoms[i].x - atoms[j].x;
      const dy = atoms[i].y - atoms[j].y;
      const dz = atoms[i].z - atoms[j].z;
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (dist < 2.4 && dist > 2.3) {
        bonds.push(createBond(atoms[i].id, atoms[j].id, 1, dist));
      }
    }
  }

  return {
    id: 'silicon',
    name: '硅晶体',
    formula: 'Si',
    type: 'material',
    atoms,
    bonds,
    description: '金刚石结构的硅晶体，半导体材料',
    category: '半导体材料',
  };
})();

export const naclCrystal: Molecule = (() => {
  const atoms: Atom[] = [];
  const bonds: Bond[] = [];
  const a = 5.64;
  const size = 4;

  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) {
      for (let k = 0; k < size; k++) {
        const isNa = (i + j + k) % 2 === 0;
        const element = isNa ? 'Na' : 'Cl';
        const x = i * a / 2 - size * a / 4;
        const y = j * a / 2 - size * a / 4;
        const z = k * a / 2 - size * a / 4;
        atoms.push(createAtom(element, x, y, z));
      }
    }
  }

  return {
    id: 'nacl',
    name: '氯化钠晶体',
    formula: 'NaCl',
    type: 'material',
    atoms,
    bonds,
    description: '食盐，面心立方结构',
    category: '离子晶体',
  };
})();

const createProteinBackbone = (name: string, sequence: string): Molecule => {
  const atoms: Atom[] = [];
  const bonds: Bond[] = [];
  const residues = sequence.split('');
  
  for (let i = 0; i < residues.length; i++) {
    const t = i / residues.length;
    const angle = t * Math.PI * 4;
    const radius = 8 + Math.sin(t * Math.PI * 2) * 3;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    const z = (t - 0.5) * 30;

    const n = createAtom('N', x, y, z, residues[i], 'A', i);
    const ca = createAtom('C', x + 0.5, y + 0.3, z + 1.0, residues[i], 'A', i);
    const c = createAtom('C', x + 1.0, y + 0.5, z + 2.0, residues[i], 'A', i);
    const o = createAtom('O', x + 1.2, y + 1.2, z + 2.5, residues[i], 'A', i);

    atoms.push(n, ca, c, o);

    if (i > 0) {
      const prevC = atoms[(i - 1) * 4 + 2];
      bonds.push(createBond(prevC.id, n.id, 1, 1.33));
    }
    bonds.push(createBond(n.id, ca.id, 1, 1.46));
    bonds.push(createBond(ca.id, c.id, 1, 1.52));
    bonds.push(createBond(c.id, o.id, 2, 1.23));
  }

  return {
    id: name.toLowerCase().replace(/\s+/g, '-'),
    name,
    formula: 'C' + (residues.length * 3) + 'H' + (residues.length * 5) + 'N' + residues.length + 'O' + (residues.length * 2),
    type: 'protein',
    atoms,
    bonds,
    sequence,
    description: '含有' + residues.length + '个氨基酸残基的球状蛋白',
    category: '蛋白质',
  };
};

export const lysozyme: Molecule = createProteinBackbone('溶菌酶', 'KVFGRCELAAAMKRHGLDNYRGYSLGNWVCAAKFESNFNTQATNRNTDGSTDYGILQINSRWWCNDGRTPGSRNLCNIPCSALLSSDITASVNCAKKIVSDGNGMNAWVAWRNRCKGTDVQAWIRGCRL');

export const insulin: Molecule = createProteinBackbone('胰岛素', 'GIVEQCCTSICSLYQLENYCNFVNQHLCGSHLVEALYLVCGERGFFYTPKTRREAEDLQVGQVELGGGPGAGSLQPLALEGSLQKRGIVEQCCTSICSLYQLENYCN');

export const moleculeLibrary: Molecule[] = [
  waterMolecule,
  aspirinMolecule,
  caffeineMolecule,
  benzeneMolecule,
  ethanolMolecule,
  alphaHelix,
  lysozyme,
  insulin,
  grapheneSheet,
  siliconCrystal,
  naclCrystal,
];

export const getMoleculeById = (id: string): Molecule | undefined => {
  return moleculeLibrary.find(m => m.id === id);
};

export const getMoleculesByType = (type: Molecule['type']): Molecule[] => {
  return moleculeLibrary.filter(m => m.type === type);
};

export const getMoleculesByCategory = (category: string): Molecule[] => {
  return moleculeLibrary.filter(m => m.category === category);
};
