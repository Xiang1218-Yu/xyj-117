import { ReactionMechanism, Molecule, Atom, Bond, ReactionKeyframe, ElectronTransfer, BondChange, ReactionEnergyPoint } from '../types';

const generateId = () => Math.random().toString(36).substr(2, 9);

const createAtom = (element: string, x: number, y: number, z: number): Atom => ({
  id: generateId(),
  element,
  x,
  y,
  z,
  charge: 0,
});

const createBond = (atom1: string, atom2: string, order: 1 | 2 | 3 | 'aromatic', length: number): Bond => ({
  id: generateId(),
  atom1,
  atom2,
  order,
  length,
});

const createChloromethane = (): Molecule => {
  const c = createAtom('C', 0, 0, 0);
  const cl = createAtom('Cl', 1.78, 0, 0);
  const h1 = createAtom('H', -0.77, 1.02, 0);
  const h2 = createAtom('H', -0.77, -0.51, 0.88);
  const h3 = createAtom('H', -0.77, -0.51, -0.88);
  
  const bonds = [
    createBond(c.id, cl.id, 1, 1.78),
    createBond(c.id, h1.id, 1, 1.09),
    createBond(c.id, h2.id, 1, 1.09),
    createBond(c.id, h3.id, 1, 1.09),
  ];
  
  return {
    id: 'chloromethane',
    name: '氯甲烷',
    formula: 'CH₃Cl',
    type: 'small_molecule',
    atoms: [c, cl, h1, h2, h3],
    bonds,
  };
};

const createHydroxide = (): Molecule => {
  const o = createAtom('O', -4, 0, 0);
  const h = createAtom('H', -4.96, 0, 0);
  
  const bonds = [
    createBond(o.id, h.id, 1, 0.96),
  ];
  
  return {
    id: 'hydroxide',
    name: '氢氧根离子',
    formula: 'OH⁻',
    type: 'small_molecule',
    atoms: [o, h],
    bonds,
  };
};

const createMethanol = (): Molecule => {
  const c = createAtom('C', 0, 0, 0);
  const o = createAtom('O', 1.43, 0, 0);
  const h1 = createAtom('H', -0.77, 1.02, 0);
  const h2 = createAtom('H', -0.77, -0.51, 0.88);
  const h3 = createAtom('H', -0.77, -0.51, -0.88);
  const h4 = createAtom('H', 2.19, 0.76, 0);
  
  const bonds = [
    createBond(c.id, o.id, 1, 1.43),
    createBond(c.id, h1.id, 1, 1.09),
    createBond(c.id, h2.id, 1, 1.09),
    createBond(c.id, h3.id, 1, 1.09),
    createBond(o.id, h4.id, 1, 0.96),
  ];
  
  return {
    id: 'methanol',
    name: '甲醇',
    formula: 'CH₃OH',
    type: 'small_molecule',
    atoms: [c, o, h1, h2, h3, h4],
    bonds,
  };
};

const createChloride = (): Molecule => {
  const cl = createAtom('Cl', 4, 0, 0);
  
  return {
    id: 'chloride',
    name: '氯离子',
    formula: 'Cl⁻',
    type: 'small_molecule',
    atoms: [cl],
    bonds: [],
  };
};

export const sn2Reaction: ReactionMechanism = (() => {
  const chloromethane = createChloromethane();
  const hydroxide = createHydroxide();
  const methanol = createMethanol();
  const chloride = createChloride();
  
  const reactantAtoms = [
    ...hydroxide.atoms.map(a => ({ ...a, x: a.x - 3 })),
    ...chloromethane.atoms,
  ];
  
  const productAtoms = [
    ...methanol.atoms,
    ...chloride.atoms.map(a => ({ ...a, x: a.x + 2 })),
  ];
  
  const tsAtoms = reactantAtoms.map((a, i) => {
    const productAtom = productAtoms.find(pa => pa.element === a.element);
    if (!productAtom) return { id: a.id, x: a.x, y: a.y, z: a.z };
    const t = 0.5;
    return {
      id: a.id,
      x: a.x + (productAtom.x - a.x) * t,
      y: a.y + (productAtom.y - a.y) * t,
      z: a.z + (productAtom.z - a.z) * t,
    };
  });
  
  const keyframes: ReactionKeyframe[] = [
    {
      time: 0,
      label: '反应物',
      type: 'reactant',
      atoms: reactantAtoms.map(a => ({ id: a.id, x: a.x, y: a.y, z: a.z })),
      bonds: [
        { atom1: hydroxide.atoms[0].id, atom2: hydroxide.atoms[1].id, order: 1 },
        { atom1: chloromethane.atoms[0].id, atom2: chloromethane.atoms[1].id, order: 1 },
        { atom1: chloromethane.atoms[0].id, atom2: chloromethane.atoms[2].id, order: 1 },
        { atom1: chloromethane.atoms[0].id, atom2: chloromethane.atoms[3].id, order: 1 },
        { atom1: chloromethane.atoms[0].id, atom2: chloromethane.atoms[4].id, order: 1 },
      ],
      energy: 0,
      isHighlighted: true,
    },
    {
      time: 50,
      label: '过渡态',
      type: 'transition_state',
      atoms: tsAtoms,
      bonds: [
        { atom1: hydroxide.atoms[0].id, atom2: hydroxide.atoms[1].id, order: 1 },
        { atom1: hydroxide.atoms[0].id, atom2: chloromethane.atoms[0].id, order: 0.5 },
        { atom1: chloromethane.atoms[0].id, atom2: chloromethane.atoms[1].id, order: 0.5 },
        { atom1: chloromethane.atoms[0].id, atom2: chloromethane.atoms[2].id, order: 1 },
        { atom1: chloromethane.atoms[0].id, atom2: chloromethane.atoms[3].id, order: 1 },
        { atom1: chloromethane.atoms[0].id, atom2: chloromethane.atoms[4].id, order: 1 },
      ],
      energy: 45,
      isHighlighted: true,
    },
    {
      time: 100,
      label: '产物',
      type: 'product',
      atoms: productAtoms.map(a => ({ id: a.id, x: a.x, y: a.y, z: a.z })),
      bonds: [
        { atom1: methanol.atoms[0].id, atom2: methanol.atoms[1].id, order: 1 },
        { atom1: methanol.atoms[0].id, atom2: methanol.atoms[2].id, order: 1 },
        { atom1: methanol.atoms[0].id, atom2: methanol.atoms[3].id, order: 1 },
        { atom1: methanol.atoms[0].id, atom2: methanol.atoms[4].id, order: 1 },
        { atom1: methanol.atoms[1].id, atom2: methanol.atoms[5].id, order: 1 },
      ],
      energy: -15,
      isHighlighted: true,
    },
  ];
  
  const electronTransfers: ElectronTransfer[] = [
    {
      id: 'et1',
      type: 'lone_pair_to_bond',
      fromAtom: hydroxide.atoms[0].id,
      toAtom: chloromethane.atoms[0].id,
      startTime: 10,
      endTime: 40,
      color: '#3B82F6',
      curvePoints: [
        { x: -5, y: 0, z: 0 },
        { x: -3, y: 0.5, z: 0 },
        { x: -1.5, y: 0.3, z: 0 },
        { x: 0, y: 0, z: 0 },
      ],
      electronCount: 2,
    },
    {
      id: 'et2',
      type: 'bond_to_lone_pair',
      fromAtom: chloromethane.atoms[0].id,
      toAtom: chloromethane.atoms[1].id,
      startTime: 20,
      endTime: 50,
      color: '#EF4444',
      curvePoints: [
        { x: 0, y: 0, z: 0 },
        { x: 0.8, y: -0.3, z: 0 },
        { x: 1.5, y: -0.5, z: 0 },
        { x: 2.5, y: 0, z: 0 },
      ],
      electronCount: 2,
    },
  ];
  
  const bondChanges: BondChange[] = [
    {
      id: 'bc1',
      type: 'form',
      atom1: hydroxide.atoms[0].id,
      atom2: chloromethane.atoms[0].id,
      startTime: 20,
      endTime: 80,
      initialOrder: 0,
      finalOrder: 1,
    },
    {
      id: 'bc2',
      type: 'break',
      atom1: chloromethane.atoms[0].id,
      atom2: chloromethane.atoms[1].id,
      startTime: 20,
      endTime: 80,
      initialOrder: 1,
      finalOrder: 0,
    },
  ];
  
  const energyProfile: ReactionEnergyPoint[] = [
    { time: 0, energy: 0, label: '反应物', type: 'reactant' },
    { time: 25, energy: 15 },
    { time: 50, energy: 45, label: '过渡态', type: 'transition_state' },
    { time: 75, energy: 10 },
    { time: 100, energy: -15, label: '产物', type: 'product' },
  ];
  
  return {
    id: 'sn2-chloromethane',
    name: 'SN2亲核取代反应',
    type: 'SN2',
    description: '双分子亲核取代反应，氢氧根离子从背面进攻氯甲烷的中心碳原子，同时氯离子离去。反应经历一个五配位的过渡态，构型发生瓦尔登反转。',
    chemicalEquation: 'CH₃Cl + OH⁻ → CH₃OH + Cl⁻',
    reactants: [hydroxide, chloromethane],
    products: [methanol, chloride],
    keyframes,
    electronTransfers,
    bondChanges,
    energyProfile,
    activationEnergy: 45,
    reactionEnthalpy: -15,
    conditions: {
      solvent: '极性非质子溶剂',
      temperature: '室温',
    },
    notes: 'SN2反应速率取决于底物和亲核试剂浓度，二级动力学。空间位阻影响反应活性：CH₃X > 1° > 2° >> 3°',
  };
})();

const createEthylBromide = (): Molecule => {
  const c1 = createAtom('C', -0.75, 0, 0);
  const c2 = createAtom('C', 0.75, 0, 0);
  const br = createAtom('Br', 2.5, 0, 0);
  const h1 = createAtom('H', -1.25, 0, 1.0);
  const h2 = createAtom('H', -1.25, 0.9, -0.5);
  const h3 = createAtom('H', -1.25, -0.9, -0.5);
  const h4 = createAtom('H', 0.75, 1.0, 0);
  const h5 = createAtom('H', 0.75, -0.5, -0.9);
  
  const bonds = [
    createBond(c1.id, c2.id, 1, 1.54),
    createBond(c2.id, br.id, 1, 1.94),
    createBond(c1.id, h1.id, 1, 1.09),
    createBond(c1.id, h2.id, 1, 1.09),
    createBond(c1.id, h3.id, 1, 1.09),
    createBond(c2.id, h4.id, 1, 1.09),
    createBond(c2.id, h5.id, 1, 1.09),
  ];
  
  return {
    id: 'ethyl-bromide',
    name: '溴乙烷',
    formula: 'C₂H₅Br',
    type: 'small_molecule',
    atoms: [c1, c2, br, h1, h2, h3, h4, h5],
    bonds,
  };
};

const createEthoxide = (): Molecule => {
  const c = createAtom('C', -5.5, 0, 0);
  const o = createAtom('O', -4.0, 0, 0);
  const h1 = createAtom('H', -6.0, 0, 1.0);
  const h2 = createAtom('H', -6.0, 0.9, -0.5);
  const h3 = createAtom('H', -6.0, -0.9, -0.5);
  
  const bonds = [
    createBond(c.id, o.id, 1, 1.43),
    createBond(c.id, h1.id, 1, 1.09),
    createBond(c.id, h2.id, 1, 1.09),
    createBond(c.id, h3.id, 1, 1.09),
  ];
  
  return {
    id: 'ethoxide',
    name: '乙氧基离子',
    formula: 'C₂H₅O⁻',
    type: 'small_molecule',
    atoms: [c, o, h1, h2, h3],
    bonds,
  };
};

const createEthylene = (): Molecule => {
  const c1 = createAtom('C', -0.67, 0, 0);
  const c2 = createAtom('C', 0.67, 0, 0);
  const h1 = createAtom('H', -1.24, 0.93, 0);
  const h2 = createAtom('H', -1.24, -0.93, 0);
  const h3 = createAtom('H', 1.24, 0.93, 0);
  const h4 = createAtom('H', 1.24, -0.93, 0);
  
  const bonds = [
    createBond(c1.id, c2.id, 2, 1.34),
    createBond(c1.id, h1.id, 1, 1.09),
    createBond(c1.id, h2.id, 1, 1.09),
    createBond(c2.id, h3.id, 1, 1.09),
    createBond(c2.id, h4.id, 1, 1.09),
  ];
  
  return {
    id: 'ethylene',
    name: '乙烯',
    formula: 'C₂H₄',
    type: 'small_molecule',
    atoms: [c1, c2, h1, h2, h3, h4],
    bonds,
  };
};

const createEthanol = (): Molecule => {
  const c = createAtom('C', -5.5, 0, 0);
  const o = createAtom('O', -4.0, 0, 0);
  const h1 = createAtom('H', -6.0, 0, 1.0);
  const h2 = createAtom('H', -6.0, 0.9, -0.5);
  const h3 = createAtom('H', -6.0, -0.9, -0.5);
  const h4 = createAtom('H', -3.5, 0.8, 0);
  
  const bonds = [
    createBond(c.id, o.id, 1, 1.43),
    createBond(o.id, h4.id, 1, 0.96),
    createBond(c.id, h1.id, 1, 1.09),
    createBond(c.id, h2.id, 1, 1.09),
    createBond(c.id, h3.id, 1, 1.09),
  ];
  
  return {
    id: 'ethanol',
    name: '乙醇',
    formula: 'C₂H₅OH',
    type: 'small_molecule',
    atoms: [c, o, h1, h2, h3, h4],
    bonds,
  };
};

const createBromide = (): Molecule => {
  const br = createAtom('Br', 4, 0, 0);
  
  return {
    id: 'bromide',
    name: '溴离子',
    formula: 'Br⁻',
    type: 'small_molecule',
    atoms: [br],
    bonds: [],
  };
};

export const e2Reaction: ReactionMechanism = (() => {
  const ethylBromide = createEthylBromide();
  const ethoxide = createEthoxide();
  const ethylene = createEthylene();
  const ethanol = createEthanol();
  const bromide = createBromide();
  
  const reactantAtoms = [
    ...ethoxide.atoms,
    ...ethylBromide.atoms,
  ];
  
  const productAtoms = [
    ...ethanol.atoms,
    ...ethylene.atoms,
    ...bromide.atoms,
  ];
  
  const keyframes: ReactionKeyframe[] = [
    {
      time: 0,
      label: '反应物',
      type: 'reactant',
      atoms: reactantAtoms.map(a => ({ id: a.id, x: a.x, y: a.y, z: a.z })),
      bonds: reactantAtoms.length > 0 ? [
        { atom1: ethoxide.atoms[0].id, atom2: ethoxide.atoms[1].id, order: 1 },
        { atom1: ethylBromide.atoms[0].id, atom2: ethylBromide.atoms[1].id, order: 1 },
        { atom1: ethylBromide.atoms[1].id, atom2: ethylBromide.atoms[2].id, order: 1 },
      ] : [],
      energy: 0,
      isHighlighted: true,
    },
    {
      time: 50,
      label: '过渡态',
      type: 'transition_state',
      atoms: reactantAtoms.map((a, i) => {
        const t = 0.5;
        const dx = i < 5 ? 0.5 : (i === 2 ? 1.5 : 0);
        return {
          id: a.id,
          x: a.x + dx * t,
          y: a.y + (i === 5 ? 0.5 : 0) * t,
          z: a.z,
        };
      }),
      bonds: [
        { atom1: ethoxide.atoms[1].id, atom2: ethylBromide.atoms[3].id, order: 0.5 },
        { atom1: ethylBromide.atoms[0].id, atom2: ethylBromide.atoms[1].id, order: 1.5 },
        { atom1: ethylBromide.atoms[1].id, atom2: ethylBromide.atoms[2].id, order: 0.5 },
      ],
      energy: 35,
      isHighlighted: true,
    },
    {
      time: 100,
      label: '产物',
      type: 'product',
      atoms: productAtoms.map(a => ({ id: a.id, x: a.x, y: a.y, z: a.z })),
      bonds: productAtoms.length > 0 ? [
        { atom1: ethanol.atoms[1].id, atom2: ethanol.atoms[5].id, order: 1 },
        { atom1: ethylene.atoms[0].id, atom2: ethylene.atoms[1].id, order: 2 },
      ] : [],
      energy: -10,
      isHighlighted: true,
    },
  ];
  
  const electronTransfers: ElectronTransfer[] = [
    {
      id: 'et1',
      type: 'lone_pair_to_bond',
      fromAtom: ethoxide.atoms[1].id,
      toAtom: ethylBromide.atoms[3].id,
      startTime: 5,
      endTime: 35,
      color: '#10B981',
      curvePoints: [
        { x: -4.0, y: 0, z: 0 },
        { x: -2.5, y: 0.5, z: 0 },
        { x: -1.5, y: 0.8, z: 0 },
        { x: -0.75, y: 1.0, z: 0 },
      ],
      electronCount: 2,
    },
    {
      id: 'et2',
      type: 'bond_to_bond',
      fromAtom: ethylBromide.atoms[3].id,
      toAtom: ethylBromide.atoms[1].id,
      startTime: 15,
      endTime: 45,
      color: '#8B5CF6',
      curvePoints: [
        { x: -0.75, y: 1.0, z: 0 },
        { x: -0.5, y: 0.5, z: 0 },
        { x: 0, y: 0.3, z: 0 },
        { x: 0.75, y: 0, z: 0 },
      ],
      electronCount: 2,
    },
    {
      id: 'et3',
      type: 'bond_to_lone_pair',
      fromAtom: ethylBromide.atoms[1].id,
      toAtom: ethylBromide.atoms[2].id,
      startTime: 25,
      endTime: 55,
      color: '#F59E0B',
      curvePoints: [
        { x: 0.75, y: 0, z: 0 },
        { x: 1.5, y: -0.3, z: 0 },
        { x: 2.5, y: -0.5, z: 0 },
        { x: 3.5, y: 0, z: 0 },
      ],
      electronCount: 2,
    },
  ];
  
  const bondChanges: BondChange[] = [
    {
      id: 'bc1',
      type: 'form',
      atom1: ethoxide.atoms[1].id,
      atom2: ethylBromide.atoms[3].id,
      startTime: 10,
      endTime: 60,
      initialOrder: 0,
      finalOrder: 1,
    },
    {
      id: 'bc2',
      type: 'break',
      atom1: ethylBromide.atoms[0].id,
      atom2: ethylBromide.atoms[3].id,
      startTime: 10,
      endTime: 60,
      initialOrder: 1,
      finalOrder: 0,
    },
    {
      id: 'bc3',
      type: 'change_order',
      atom1: ethylBromide.atoms[0].id,
      atom2: ethylBromide.atoms[1].id,
      startTime: 20,
      endTime: 70,
      initialOrder: 1,
      finalOrder: 2,
    },
    {
      id: 'bc4',
      type: 'break',
      atom1: ethylBromide.atoms[1].id,
      atom2: ethylBromide.atoms[2].id,
      startTime: 20,
      endTime: 70,
      initialOrder: 1,
      finalOrder: 0,
    },
  ];
  
  const energyProfile: ReactionEnergyPoint[] = [
    { time: 0, energy: 0, label: '反应物', type: 'reactant' },
    { time: 25, energy: 12 },
    { time: 50, energy: 35, label: '过渡态', type: 'transition_state' },
    { time: 75, energy: 8 },
    { time: 100, energy: -10, label: '产物', type: 'product' },
  ];
  
  return {
    id: 'e2-ethyl-bromide',
    name: 'E2消除反应',
    type: 'E2',
    description: '双分子消除反应，乙氧基碱夺取溴乙烷的β-氢，同时C-Br键断裂，形成π键生成乙烯。反应经历反式共平面过渡态，遵循扎伊采夫规则。',
    chemicalEquation: 'C₂H₅Br + C₂H₅O⁻ → C₂H₄ + C₂H₅OH + Br⁻',
    reactants: [ethoxide, ethylBromide],
    products: [ethylene, ethanol, bromide],
    keyframes,
    electronTransfers,
    bondChanges,
    energyProfile,
    activationEnergy: 35,
    reactionEnthalpy: -10,
    conditions: {
      solvent: '乙醇',
      temperature: '加热',
      catalyst: '强碱',
    },
    notes: 'E2反应为二级动力学，速率取决于底物和碱浓度。立体化学要求反式共平面消除，优先生成多取代烯烃（扎伊采夫规则）。',
  };
})();

const createFormaldehyde = (): Molecule => {
  const c = createAtom('C', 0, 0, 0);
  const o = createAtom('O', 1.22, 0, 0);
  const h1 = createAtom('H', -0.61, 0.61, 0);
  const h2 = createAtom('H', -0.61, -0.61, 0);
  
  const bonds = [
    createBond(c.id, o.id, 2, 1.22),
    createBond(c.id, h1.id, 1, 1.12),
    createBond(c.id, h2.id, 1, 1.12),
  ];
  
  return {
    id: 'formaldehyde',
    name: '甲醛',
    formula: 'HCHO',
    type: 'small_molecule',
    atoms: [c, o, h1, h2],
    bonds,
  };
};

const createCyanide = (): Molecule => {
  const c = createAtom('C', -3.5, 0, 0);
  const n = createAtom('N', -4.67, 0, 0);
  
  const bonds = [
    createBond(c.id, n.id, 3, 1.17),
  ];
  
  return {
    id: 'cyanide',
    name: '氰离子',
    formula: 'CN⁻',
    type: 'small_molecule',
    atoms: [c, n],
    bonds,
  };
};

const createHydroxynitrile = (): Molecule => {
  const c1 = createAtom('C', 0, 0, 0);
  const o = createAtom('O', 1.43, 0, 0);
  const c2 = createAtom('C', -1.46, 0, 0);
  const n = createAtom('C', -2.63, 0, 0);
  const h1 = createAtom('H', 0, 1.09, 0);
  const h2 = createAtom('H', 0, -1.09, 0);
  const h3 = createAtom('H', 2.0, 0.8, 0);
  
  const bonds = [
    createBond(c1.id, o.id, 1, 1.43),
    createBond(c1.id, c2.id, 1, 1.54),
    createBond(c2.id, n.id, 3, 1.17),
    createBond(c1.id, h1.id, 1, 1.09),
    createBond(c1.id, h2.id, 1, 1.09),
    createBond(o.id, h3.id, 1, 0.96),
  ];
  
  return {
    id: 'hydroxynitrile',
    name: '羟基丙腈',
    formula: 'C₂H₃ON',
    type: 'small_molecule',
    atoms: [c1, o, c2, n, h1, h2, h3],
    bonds,
  };
};

export const nucleophilicAdditionReaction: ReactionMechanism = (() => {
  const formaldehyde = createFormaldehyde();
  const cyanide = createCyanide();
  const hydroxynitrile = createHydroxynitrile();
  
  const reactantAtoms = [
    ...cyanide.atoms,
    ...formaldehyde.atoms,
  ];
  
  const productAtoms = [
    ...hydroxynitrile.atoms,
  ];
  
  const keyframes: ReactionKeyframe[] = [
    {
      time: 0,
      label: '反应物',
      type: 'reactant',
      atoms: reactantAtoms.map(a => ({ id: a.id, x: a.x, y: a.y, z: a.z })),
      bonds: [
        { atom1: cyanide.atoms[0].id, atom2: cyanide.atoms[1].id, order: 3 },
        { atom1: formaldehyde.atoms[0].id, atom2: formaldehyde.atoms[1].id, order: 2 },
        { atom1: formaldehyde.atoms[0].id, atom2: formaldehyde.atoms[2].id, order: 1 },
        { atom1: formaldehyde.atoms[0].id, atom2: formaldehyde.atoms[3].id, order: 1 },
      ],
      energy: 0,
      isHighlighted: true,
    },
    {
      time: 50,
      label: '四面体中间体',
      type: 'intermediate',
      atoms: reactantAtoms.map(a => {
        const t = 0.5;
        const targetAtom = productAtoms.find(pa => pa.element === a.element);
        return {
          id: a.id,
          x: a.x + ((targetAtom?.x || a.x) - a.x) * t,
          y: a.y + ((targetAtom?.y || a.y) - a.y) * t,
          z: a.z + ((targetAtom?.z || a.z) - a.z) * t,
        };
      }),
      bonds: [
        { atom1: cyanide.atoms[0].id, atom2: cyanide.atoms[1].id, order: 3 },
        { atom1: formaldehyde.atoms[0].id, atom2: cyanide.atoms[0].id, order: 0.5 },
        { atom1: formaldehyde.atoms[0].id, atom2: formaldehyde.atoms[1].id, order: 1.5 },
        { atom1: formaldehyde.atoms[0].id, atom2: formaldehyde.atoms[2].id, order: 1 },
        { atom1: formaldehyde.atoms[0].id, atom2: formaldehyde.atoms[3].id, order: 1 },
      ],
      energy: 25,
      isHighlighted: true,
    },
    {
      time: 100,
      label: '产物',
      type: 'product',
      atoms: productAtoms.map(a => ({ id: a.id, x: a.x, y: a.y, z: a.z })),
      bonds: [
        { atom1: hydroxynitrile.atoms[2].id, atom2: hydroxynitrile.atoms[3].id, order: 3 },
        { atom1: hydroxynitrile.atoms[0].id, atom2: hydroxynitrile.atoms[2].id, order: 1 },
        { atom1: hydroxynitrile.atoms[0].id, atom2: hydroxynitrile.atoms[1].id, order: 1 },
        { atom1: hydroxynitrile.atoms[0].id, atom2: hydroxynitrile.atoms[4].id, order: 1 },
        { atom1: hydroxynitrile.atoms[0].id, atom2: hydroxynitrile.atoms[5].id, order: 1 },
        { atom1: hydroxynitrile.atoms[1].id, atom2: hydroxynitrile.atoms[6].id, order: 1 },
      ],
      energy: -20,
      isHighlighted: true,
    },
  ];
  
  const electronTransfers: ElectronTransfer[] = [
    {
      id: 'et1',
      type: 'lone_pair_to_bond',
      fromAtom: cyanide.atoms[0].id,
      toAtom: formaldehyde.atoms[0].id,
      startTime: 10,
      endTime: 40,
      color: '#EC4899',
      curvePoints: [
        { x: -3.5, y: 0, z: 0 },
        { x: -2.0, y: 0.3, z: 0 },
        { x: -1.0, y: 0.2, z: 0 },
        { x: 0, y: 0, z: 0 },
      ],
      electronCount: 2,
    },
    {
      id: 'et2',
      type: 'bond_to_lone_pair',
      fromAtom: formaldehyde.atoms[0].id,
      toAtom: formaldehyde.atoms[1].id,
      startTime: 20,
      endTime: 50,
      color: '#06B6D4',
      curvePoints: [
        { x: 0.6, y: 0, z: 0 },
        { x: 0.9, y: 0.2, z: 0 },
        { x: 1.1, y: 0.3, z: 0 },
        { x: 1.43, y: 0, z: 0 },
      ],
      electronCount: 2,
    },
  ];
  
  const bondChanges: BondChange[] = [
    {
      id: 'bc1',
      type: 'form',
      atom1: cyanide.atoms[0].id,
      atom2: formaldehyde.atoms[0].id,
      startTime: 15,
      endTime: 65,
      initialOrder: 0,
      finalOrder: 1,
    },
    {
      id: 'bc2',
      type: 'change_order',
      atom1: formaldehyde.atoms[0].id,
      atom2: formaldehyde.atoms[1].id,
      startTime: 15,
      endTime: 65,
      initialOrder: 2,
      finalOrder: 1,
    },
  ];
  
  const energyProfile: ReactionEnergyPoint[] = [
    { time: 0, energy: 0, label: '反应物', type: 'reactant' },
    { time: 25, energy: 12 },
    { time: 50, energy: 25, label: '中间体', type: 'intermediate' },
    { time: 75, energy: 5 },
    { time: 100, energy: -20, label: '产物', type: 'product' },
  ];
  
  return {
    id: 'nucleophilic-addition-cyanohydrin',
    name: '亲核加成反应（氰醇形成）',
    type: 'nucleophilic_addition',
    description: '醛酮的亲核加成反应，氰离子作为亲核试剂进攻甲醛的羰基碳原子，π键断裂，氧原子获得负电荷，形成四面体中间体。',
    chemicalEquation: 'HCHO + CN⁻ → HOCH₂CN',
    reactants: [cyanide, formaldehyde],
    products: [hydroxynitrile],
    keyframes,
    electronTransfers,
    bondChanges,
    energyProfile,
    activationEnergy: 25,
    reactionEnthalpy: -20,
    conditions: {
      solvent: '水/乙醇混合',
      temperature: '室温',
      catalyst: '碱性条件',
    },
    notes: '羰基的亲核加成是醛酮的特征反应，反应活性：醛 > 酮。空间位阻和电子效应共同影响反应活性。',
  };
})();

const createCyclopentadiene = (): Molecule => {
  const c1 = createAtom('C', -1.3, 0, 0);
  const c2 = createAtom('C', -0.4, 1.24, 0);
  const c3 = createAtom('C', 1.05, 0.76, 0);
  const c4 = createAtom('C', 1.05, -0.76, 0);
  const c5 = createAtom('C', -0.4, -1.24, 0);
  const h1 = createAtom('H', -2.35, 0, 0);
  const h2 = createAtom('H', -0.65, 2.25, 0);
  const h3 = createAtom('H', 1.9, 1.38, 0);
  const h4 = createAtom('H', 1.9, -1.38, 0);
  const h5 = createAtom('H', -0.65, -2.25, 0);
  const h6 = createAtom('H', -0.4, 0, 0);
  
  const bonds = [
    createBond(c1.id, c2.id, 2, 1.36),
    createBond(c2.id, c3.id, 1, 1.47),
    createBond(c3.id, c4.id, 2, 1.36),
    createBond(c4.id, c5.id, 1, 1.47),
    createBond(c5.id, c1.id, 1, 1.51),
    createBond(c1.id, h1.id, 1, 1.09),
    createBond(c2.id, h2.id, 1, 1.09),
    createBond(c3.id, h3.id, 1, 1.09),
    createBond(c4.id, h4.id, 1, 1.09),
    createBond(c5.id, h5.id, 1, 1.09),
    createBond(c1.id, h6.id, 1, 1.09),
  ];
  
  return {
    id: 'cyclopentadiene',
    name: '环戊二烯',
    formula: 'C₅H₆',
    type: 'small_molecule',
    atoms: [c1, c2, c3, c4, c5, h1, h2, h3, h4, h5, h6],
    bonds,
  };
};

const createMaleicAnhydride = (): Molecule => {
  const c1 = createAtom('C', 4, 0.8, 0);
  const c2 = createAtom('C', 4, -0.8, 0);
  const c3 = createAtom('C', 5.2, 1.2, 0);
  const c4 = createAtom('C', 5.2, -1.2, 0);
  const o1 = createAtom('O', 3, 1.2, 0);
  const o2 = createAtom('O', 3, -1.2, 0);
  const o3 = createAtom('O', 6.4, 0, 0);
  const h1 = createAtom('H', 5.2, 2.2, 0);
  const h2 = createAtom('H', 5.2, -2.2, 0);
  
  const bonds = [
    createBond(c1.id, c2.id, 2, 1.34),
    createBond(c1.id, c3.id, 1, 1.51),
    createBond(c2.id, c4.id, 1, 1.51),
    createBond(c1.id, o1.id, 1, 1.38),
    createBond(c2.id, o2.id, 1, 1.38),
    createBond(c3.id, o3.id, 1, 1.38),
    createBond(c4.id, o3.id, 1, 1.38),
    createBond(c3.id, h1.id, 1, 1.09),
    createBond(c4.id, h2.id, 1, 1.09),
    createBond(o1.id, o2.id, 1, 1.45),
  ];
  
  return {
    id: 'maleic-anhydride',
    name: '马来酸酐',
    formula: 'C₄H₂O₃',
    type: 'small_molecule',
    atoms: [c1, c2, c3, c4, o1, o2, o3, h1, h2],
    bonds,
  };
};

const createDielsAlderAdduct = (): Molecule => {
  const c1 = createAtom('C', -1.3, 0, 0);
  const c2 = createAtom('C', -0.4, 1.24, 0);
  const c3 = createAtom('C', 1.05, 0.76, 0);
  const c4 = createAtom('C', 1.05, -0.76, 0);
  const c5 = createAtom('C', -0.4, -1.24, 0);
  const c6 = createAtom('C', 2.5, 0.8, 0);
  const c7 = createAtom('C', 2.5, -0.8, 0);
  const c8 = createAtom('C', 3.7, 1.2, 0);
  const c9 = createAtom('C', 3.7, -1.2, 0);
  const o1 = createAtom('O', 4.9, 0, 0);
  const o2 = createAtom('O', 3.7, 2.4, 0);
  const o3 = createAtom('O', 3.7, -2.4, 0);
  
  const hAtoms = [];
  for (let i = 0; i < 8; i++) {
    const angle = (i * Math.PI * 2) / 8;
    hAtoms.push(createAtom('H', Math.cos(angle) * 3, Math.sin(angle) * 3, 0));
  }
  
  return {
    id: 'diels-alder-adduct',
    name: '狄尔斯-阿尔德加成物',
    formula: 'C₉H₈O₃',
    type: 'small_molecule',
    atoms: [c1, c2, c3, c4, c5, c6, c7, c8, c9, o1, o2, o3, ...hAtoms],
    bonds: [],
  };
};

export const dielsAlderReaction: ReactionMechanism = (() => {
  const cyclopentadiene = createCyclopentadiene();
  const maleicAnhydride = createMaleicAnhydride();
  const adduct = createDielsAlderAdduct();
  
  const reactantAtoms = [
    ...cyclopentadiene.atoms,
    ...maleicAnhydride.atoms,
  ];
  
  const productAtoms = [
    ...adduct.atoms,
  ];
  
  const keyframes: ReactionKeyframe[] = [
    {
      time: 0,
      label: '反应物',
      type: 'reactant',
      atoms: reactantAtoms.map(a => ({ id: a.id, x: a.x, y: a.y, z: a.z })),
      bonds: [
        { atom1: cyclopentadiene.atoms[0].id, atom2: cyclopentadiene.atoms[1].id, order: 2 },
        { atom1: cyclopentadiene.atoms[2].id, atom2: cyclopentadiene.atoms[3].id, order: 2 },
        { atom1: maleicAnhydride.atoms[0].id, atom2: maleicAnhydride.atoms[1].id, order: 2 },
      ],
      energy: 0,
      isHighlighted: true,
    },
    {
      time: 50,
      label: '过渡态',
      type: 'transition_state',
      atoms: reactantAtoms.map((a, i) => {
        const t = 0.5;
        const dx = i >= 11 ? -2 : 0;
        return {
          id: a.id,
          x: a.x + dx * t,
          y: a.y,
          z: a.z,
        };
      }),
      bonds: [
        { atom1: cyclopentadiene.atoms[1].id, atom2: maleicAnhydride.atoms[0].id, order: 0.5 },
        { atom1: cyclopentadiene.atoms[3].id, atom2: maleicAnhydride.atoms[1].id, order: 0.5 },
        { atom1: cyclopentadiene.atoms[1].id, atom2: cyclopentadiene.atoms[2].id, order: 1.5 },
        { atom1: maleicAnhydride.atoms[0].id, atom2: maleicAnhydride.atoms[1].id, order: 1.5 },
      ],
      energy: 28,
      isHighlighted: true,
    },
    {
      time: 100,
      label: '产物',
      type: 'product',
      atoms: productAtoms.map(a => ({ id: a.id, x: a.x, y: a.y, z: a.z })),
      bonds: productAtoms.length > 0 ? [
        { atom1: adduct.atoms[1].id, atom2: adduct.atoms[5].id, order: 1 },
        { atom1: adduct.atoms[3].id, atom2: adduct.atoms[6].id, order: 1 },
        { atom1: adduct.atoms[1].id, atom2: adduct.atoms[2].id, order: 2 },
        { atom1: adduct.atoms[5].id, atom2: adduct.atoms[6].id, order: 1 },
      ] : [],
      energy: -35,
      isHighlighted: true,
    },
  ];
  
  const electronTransfers: ElectronTransfer[] = [
    {
      id: 'et1',
      type: 'bond_to_bond',
      fromAtom: cyclopentadiene.atoms[0].id,
      toAtom: cyclopentadiene.atoms[1].id,
      startTime: 15,
      endTime: 45,
      color: '#14B8A6',
      curvePoints: [
        { x: -0.8, y: 0.6, z: 0 },
        { x: -0.2, y: 1.0, z: 0 },
        { x: 0.3, y: 1.0, z: 0 },
        { x: 0.3, y: 0.5, z: 0 },
      ],
      electronCount: 2,
    },
    {
      id: 'et2',
      type: 'bond_to_bond',
      fromAtom: cyclopentadiene.atoms[2].id,
      toAtom: maleicAnhydride.atoms[0].id,
      startTime: 15,
      endTime: 45,
      color: '#A855F7',
      curvePoints: [
        { x: 1.05, y: 1.0, z: 0 },
        { x: 2.0, y: 0.9, z: 0 },
        { x: 3.0, y: 0.85, z: 0 },
        { x: 4.0, y: 0.8, z: 0 },
      ],
      electronCount: 2,
    },
    {
      id: 'et3',
      type: 'bond_to_bond',
      fromAtom: maleicAnhydride.atoms[0].id,
      toAtom: maleicAnhydride.atoms[1].id,
      startTime: 20,
      endTime: 50,
      color: '#F97316',
      curvePoints: [
        { x: 4.0, y: 0.8, z: 0 },
        { x: 4.0, y: 0, z: 0 },
        { x: 4.0, y: -0.4, z: 0 },
        { x: 4.0, y: -0.8, z: 0 },
      ],
      electronCount: 2,
    },
  ];
  
  const bondChanges: BondChange[] = [
    {
      id: 'bc1',
      type: 'change_order',
      atom1: cyclopentadiene.atoms[0].id,
      atom2: cyclopentadiene.atoms[1].id,
      startTime: 10,
      endTime: 60,
      initialOrder: 2,
      finalOrder: 1,
    },
    {
      id: 'bc2',
      type: 'change_order',
      atom1: cyclopentadiene.atoms[1].id,
      atom2: cyclopentadiene.atoms[2].id,
      startTime: 10,
      endTime: 60,
      initialOrder: 1,
      finalOrder: 2,
    },
    {
      id: 'bc3',
      type: 'form',
      atom1: cyclopentadiene.atoms[1].id,
      atom2: maleicAnhydride.atoms[0].id,
      startTime: 20,
      endTime: 70,
      initialOrder: 0,
      finalOrder: 1,
    },
    {
      id: 'bc4',
      type: 'change_order',
      atom1: maleicAnhydride.atoms[0].id,
      atom2: maleicAnhydride.atoms[1].id,
      startTime: 20,
      endTime: 70,
      initialOrder: 2,
      finalOrder: 1,
    },
  ];
  
  const energyProfile: ReactionEnergyPoint[] = [
    { time: 0, energy: 0, label: '反应物', type: 'reactant' },
    { time: 25, energy: 15 },
    { time: 50, energy: 28, label: '过渡态', type: 'transition_state' },
    { time: 75, energy: -10 },
    { time: 100, energy: -35, label: '产物', type: 'product' },
  ];
  
  return {
    id: 'diels-alder-cyclopentadiene',
    name: '狄尔斯-阿尔德环加成反应',
    type: 'diels_alder',
    description: '[4+2]环加成反应，环戊二烯作为双烯体，马来酸酐作为亲双烯体，经过协同的环状过渡态，生成内型加成产物。反应具有立体专一性和区域选择性。',
    chemicalEquation: 'C₅H₆ + C₄H₂O₃ → C₉H₈O₃',
    reactants: [cyclopentadiene, maleicAnhydride],
    products: [adduct],
    keyframes,
    electronTransfers,
    bondChanges,
    energyProfile,
    activationEnergy: 28,
    reactionEnthalpy: -35,
    conditions: {
      solvent: '甲苯',
      temperature: '加热回流',
    },
    notes: 'Diels-Alder反应是协同反应，旧键断裂和新键形成同时进行。双烯体需为顺式构象，亲双烯体带有吸电子基团时反应活性更高。',
  };
})();

export const reactionLibrary: ReactionMechanism[] = [
  sn2Reaction,
  e2Reaction,
  nucleophilicAdditionReaction,
  dielsAlderReaction,
];

export const getReactionById = (id: string): ReactionMechanism | undefined => {
  return reactionLibrary.find(r => r.id === id);
};

export const getReactionsByType = (type: string): ReactionMechanism[] => {
  return reactionLibrary.filter(r => r.type === type);
};
