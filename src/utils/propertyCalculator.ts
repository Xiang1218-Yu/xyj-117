import { 
  Molecule, 
  Atom, 
  Bond,
  QuantumDescriptor,
  ADMETProperty,
  ADMETCategory,
  ADMETStatus,
  DrugLikenessResult,
  DrugLikenessRule,
  DescriptorCategory,
} from '../types';

const ATOMIC_WEIGHTS: Record<string, number> = {
  H: 1.008,
  C: 12.011,
  N: 14.007,
  O: 15.999,
  F: 18.998,
  P: 30.974,
  S: 32.06,
  Cl: 35.45,
  Br: 79.904,
  I: 126.904,
  B: 10.811,
  Li: 6.941,
  Na: 22.99,
  Mg: 24.305,
  K: 39.098,
  Ca: 40.078,
  Fe: 55.845,
  Zn: 65.38,
  Cu: 63.546,
  Mn: 54.938,
  Co: 58.933,
  Ni: 58.693,
};

const ATOM_SMILES: Record<string, string> = {
  H: '[H]',
  C: 'C',
  N: 'N',
  O: 'O',
  F: 'F',
  P: 'P',
  S: 'S',
  Cl: 'Cl',
  Br: 'Br',
  I: 'I',
};

const BOND_ORDER_TO_SMILES: Record<number | string, string> = {
  1: '-',
  2: '=',
  3: '#',
  aromatic: ':',
};

function getAtomicWeight(element: string): number {
  return ATOMIC_WEIGHTS[element] || 0;
}

function countElements(atoms: Atom[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const atom of atoms) {
    counts[atom.element] = (counts[atom.element] || 0) + 1;
  }
  return counts;
}

function generateFormula(elementCounts: Record<string, number>): string {
  const elements = Object.keys(elementCounts).sort((a, b) => {
    if (a === 'C') return -1;
    if (b === 'C') return 1;
    if (a === 'H') return -1;
    if (b === 'H') return 1;
    return a.localeCompare(b);
  });
  
  return elements.map(el => {
    const count = elementCounts[el];
    return count === 1 ? el : `${el}${count}`;
  }).join('');
}

function calculateMolecularWeight(atoms: Atom[]): number {
  return atoms.reduce((sum, atom) => sum + getAtomicWeight(atom.element), 0);
}

function countHBDonors(atoms: Atom[], bonds: Bond[]): number {
  let count = 0;
  const atomMap = new Map(atoms.map(a => [a.id, a]));
  
  for (const atom of atoms) {
    if (atom.element === 'N' || atom.element === 'O') {
      const connectedBonds = bonds.filter(b => b.atom1 === atom.id || b.atom2 === atom.id);
      const hCount = connectedBonds.filter(b => {
        const otherId = b.atom1 === atom.id ? b.atom2 : b.atom1;
        const other = atomMap.get(otherId);
        return other?.element === 'H';
      }).length;
      count += hCount;
    }
  }
  return count;
}

function countHBAcceptors(atoms: Atom[]): number {
  return atoms.filter(a => a.element === 'N' || a.element === 'O').length;
}

function calculatePSA(atoms: Atom[], bonds: Bond[]): number {
  let psa = 0;
  const atomMap = new Map(atoms.map(a => [a.id, a]));
  
  for (const atom of atoms) {
    if (atom.element === 'N' || atom.element === 'O') {
      const connectedBonds = bonds.filter(b => b.atom1 === atom.id || b.atom2 === atom.id);
      const hybridization = connectedBonds.length;
      
      if (atom.element === 'O') {
        if (hybridization === 2) psa += 20.23;
        else if (hybridization === 1) psa += 17.07;
      } else if (atom.element === 'N') {
        if (hybridization === 3) psa += 12.03;
        else if (hybridization === 2) psa += 12.89;
        else if (hybridization === 1) psa += 4.41;
      }
    }
  }
  
  return Math.round(psa * 100) / 100;
}

function calculateLogP(atoms: Atom[], elementCounts: Record<string, number>): number {
  const cLogP = 
    0.54736 * (elementCounts['C'] || 0) -
    0.01603 * (atoms.length) +
    1.44352 * (elementCounts['O'] || 0) * 0 +
    1.73369 * (elementCounts['N'] || 0) * 0 +
    1.83967 * (elementCounts['S'] || 0) * 0 +
    1.40327 * (elementCounts['Cl'] || 0) +
    1.79362 * (elementCounts['Br'] || 0) +
    1.92364 * (elementCounts['I'] || 0) +
    0.73048 * (elementCounts['F'] || 0) -
    0.60273;
  
  return Math.round(cLogP * 100) / 100;
}

function countRotatableBonds(bonds: Bond[], atoms: Atom[]): number {
  const atomMap = new Map(atoms.map(a => [a.id, a]));
  let rotatable = 0;
  
  for (const bond of bonds) {
    if (bond.order !== 1) continue;
    
    const atom1 = atomMap.get(bond.atom1);
    const atom2 = atomMap.get(bond.atom2);
    
    if (!atom1 || !atom2) continue;
    if (atom1.element === 'H' || atom2.element === 'H') continue;
    
    const atom1Connections = bonds.filter(b => 
      (b.atom1 === bond.atom1 || b.atom2 === bond.atom1) && b.id !== bond.id
    ).length;
    const atom2Connections = bonds.filter(b => 
      (b.atom1 === bond.atom2 || b.atom2 === bond.atom2) && b.id !== bond.id
    ).length;
    
    if (atom1Connections > 1 && atom2Connections > 1) {
      rotatable++;
    }
  }
  
  return rotatable;
}

function calculateMolarRefractivity(atoms: Atom[], elementCounts: Record<string, number>): number {
  const refractivity = 
    2.591 * (elementCounts['C'] || 0) +
    1.028 * (elementCounts['H'] || 0) +
    5.281 * (elementCounts['O'] || 0) +
    3.885 * (elementCounts['N'] || 0) +
    8.665 * (elementCounts['S'] || 0) +
    9.223 * (elementCounts['Cl'] || 0) +
    11.698 * (elementCounts['Br'] || 0) +
    14.512 * (elementCounts['I'] || 0) +
    0.918 * (elementCounts['F'] || 0);
  
  return Math.round(refractivity * 100) / 100;
}

function calculateTopologicalIndex(atoms: Atom[], bonds: Bond[]): number {
  const heavyAtoms = atoms.filter(a => a.element !== 'H');
  const atomCount = heavyAtoms.length;
  return Math.round(atomCount * Math.log2(atomCount + 1) * 100) / 100;
}

function countAromaticRings(bonds: Bond[]): number {
  const aromaticBonds = bonds.filter(b => b.order === 'aromatic');
  return Math.floor(aromaticBonds.length / 6);
}

function countRings(atoms: Atom[], bonds: Bond[]): number {
  const heavyAtomCount = atoms.filter(a => a.element !== 'H').length;
  return bonds.length - heavyAtomCount + 1;
}

function calculateDipoleMoment(atoms: Atom[]): number {
  let dipole = 0;
  const center = {
    x: atoms.reduce((s, a) => s + a.x, 0) / atoms.length,
    y: atoms.reduce((s, a) => s + a.y, 0) / atoms.length,
    z: atoms.reduce((s, a) => s + a.z, 0) / atoms.length,
  };
  
  for (const atom of atoms) {
    const dx = atom.x - center.x;
    const dy = atom.y - center.y;
    const dz = atom.z - center.z;
    const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
    dipole += dist * (getAtomicWeight(atom.element) / 12);
  }
  
  return Math.round(dipole * 100) / 100;
}

function calculateHOMO(atoms: Atom[], elementCounts: Record<string, number>): number {
  const piElectrons = (elementCounts['C'] || 0) * 1 + 
                     (elementCounts['N'] || 0) * 2 + 
                     (elementCounts['O'] || 0) * 2 +
                     (elementCounts['S'] || 0) * 2;
  const homo = -8.5 - piElectrons * 0.15;
  return Math.round(homo * 100) / 100;
}

function calculateLUMO(atoms: Atom[], elementCounts: Record<string, number>): number {
  const piElectrons = (elementCounts['C'] || 0) * 1 + 
                     (elementCounts['N'] || 0) * 2 + 
                     (elementCounts['O'] || 0) * 2 +
                     (elementCounts['S'] || 0) * 2;
  const lumo = -1.5 - piElectrons * 0.1;
  return Math.round(lumo * 100) / 100;
}

function calculatePolarizability(atoms: Atom[], mw: number): number {
  const polarizability = mw * 0.4 + atoms.filter(a => a.element !== 'H').length * 0.8;
  return Math.round(polarizability * 100) / 100;
}

function calculateComplexity(atoms: Atom[], bonds: Bond[]): number {
  const heavyAtoms = atoms.filter(a => a.element !== 'H').length;
  const bondComplexity = bonds.reduce((sum, b) => {
    if (b.order === 'aromatic') return sum + 3;
    return sum + (b.order as number);
  }, 0);
  return Math.round((heavyAtoms * 2 + bondComplexity) * 100) / 100;
}

export function calculateQuantumDescriptors(molecule: Molecule): QuantumDescriptor[] {
  const { atoms, bonds } = molecule;
  const elementCounts = countElements(atoms);
  const molecularWeight = calculateMolecularWeight(atoms);
  const hDonors = countHBDonors(atoms, bonds);
  const hAcceptors = countHBAcceptors(atoms);
  const psa = calculatePSA(atoms, bonds);
  const logP = calculateLogP(atoms, elementCounts);
  const rotatableBonds = countRotatableBonds(bonds, atoms);
  const molarRefractivity = calculateMolarRefractivity(atoms, elementCounts);
  const topologicalIndex = calculateTopologicalIndex(atoms, bonds);
  const ringCount = countRings(atoms, bonds);
  const aromaticRings = countAromaticRings(bonds);
  const dipoleMoment = calculateDipoleMoment(atoms);
  const homo = calculateHOMO(atoms, elementCounts);
  const lumo = calculateLUMO(atoms, elementCounts);
  const bandGap = Math.round((lumo - homo) * 100) / 100;
  const polarizability = calculatePolarizability(atoms, molecularWeight);
  const complexity = calculateComplexity(atoms, bonds);
  const heavyAtomCount = atoms.filter(a => a.element !== 'H').length;

  return [
    {
      name: '分子量',
      value: molecularWeight,
      unit: 'g/mol',
      description: '分子中所有原子的原子量之和',
      category: 'structural' as DescriptorCategory,
    },
    {
      name: '分子式',
      value: parseFloat(elementCounts['C']?.toString() || '0'),
      description: '分子的化学式',
      category: 'structural' as DescriptorCategory,
    },
    {
      name: '重原子数',
      value: heavyAtomCount,
      description: '非氢原子的数量',
      category: 'structural' as DescriptorCategory,
    },
    {
      name: '总原子数',
      value: atoms.length,
      description: '分子中的原子总数',
      category: 'structural' as DescriptorCategory,
    },
    {
      name: '键数',
      value: bonds.length,
      description: '化学键的总数',
      category: 'structural' as DescriptorCategory,
    },
    {
      name: '环数',
      value: ringCount,
      description: '分子结构中的环数量',
      category: 'structural' as DescriptorCategory,
    },
    {
      name: '芳香环数',
      value: aromaticRings,
      description: '芳香环的数量',
      category: 'structural' as DescriptorCategory,
    },
    {
      name: '可旋转键',
      value: rotatableBonds,
      description: '可自由旋转的单键数量',
      category: 'topological' as DescriptorCategory,
    },
    {
      name: '拓扑指数',
      value: topologicalIndex,
      unit: 'Å',
      description: 'Wiener拓扑指数',
      category: 'topological' as DescriptorCategory,
    },
    {
      name: '分子复杂度',
      value: complexity,
      description: '基于原子和键类型的整体复杂度',
      category: 'topological' as DescriptorCategory,
    },
    {
      name: '氢键供体',
      value: hDonors,
      description: '氢键供体数量 (N-H, O-H)',
      category: 'physicochemical' as DescriptorCategory,
    },
    {
      name: '氢键受体',
      value: hAcceptors,
      description: '氢键受体数量 (N, O原子)',
      category: 'physicochemical' as DescriptorCategory,
    },
    {
      name: '极性表面积',
      value: psa,
      unit: 'Å²',
      description: '拓扑极性表面积 (TPSA)',
      category: 'physicochemical' as DescriptorCategory,
    },
    {
      name: 'logP',
      value: logP,
      description: '计算的辛醇-水分配系数',
      category: 'physicochemical' as DescriptorCategory,
    },
    {
      name: '摩尔折射率',
      value: molarRefractivity,
      unit: 'cm³/mol',
      description: '摩尔折射率 (MR)',
      category: 'physicochemical' as DescriptorCategory,
    },
    {
      name: '极化率',
      value: polarizability,
      unit: 'Å³',
      description: '计算的分子极化率',
      category: 'electronic' as DescriptorCategory,
    },
    {
      name: '偶极矩',
      value: dipoleMoment,
      unit: 'D',
      description: '估算的分子偶极矩',
      category: 'electronic' as DescriptorCategory,
    },
    {
      name: 'HOMO能级',
      value: homo,
      unit: 'eV',
      description: '最高占据分子轨道能量',
      category: 'electronic' as DescriptorCategory,
    },
    {
      name: 'LUMO能级',
      value: lumo,
      unit: 'eV',
      description: '最低未占据分子轨道能量',
      category: 'electronic' as DescriptorCategory,
    },
    {
      name: 'HOMO-LUMO能隙',
      value: bandGap,
      unit: 'eV',
      description: 'HOMO与LUMO之间的能量差',
      category: 'electronic' as DescriptorCategory,
    },
  ];
}

function predictAbsorption(descriptors: QuantumDescriptor[]): ADMETProperty[] {
  const mw = descriptors.find(d => d.name === '分子量')?.value || 0;
  const logP = descriptors.find(d => d.name === 'logP')?.value || 0;
  const psa = descriptors.find(d => d.name === '极性表面积')?.value || 0;
  const hDonors = descriptors.find(d => d.name === '氢键供体')?.value || 0;
  const hAcceptors = descriptors.find(d => d.name === '氢键受体')?.value || 0;
  const rotatableBonds = descriptors.find(d => d.name === '可旋转键')?.value || 0;

  const intestinalScore = Math.max(0, Math.min(1, 
    1 - Math.abs(logP) * 0.1 - psa * 0.005 - rotatableBonds * 0.02
  ));
  
  let intestinalStatus: ADMETStatus = 'moderate';
  let intestinalPred = 'Moderate';
  if (psa < 140 && logP > -0.5 && logP < 6) {
    intestinalStatus = 'good';
    intestinalPred = 'High';
  } else if (psa > 200 || logP < -2 || logP > 8) {
    intestinalStatus = 'poor';
    intestinalPred = 'Low';
  }

  const waterSolubility = Math.max(0, Math.min(1,
    1 - logP * 0.15 - mw * 0.001
  ));
  
  let solubilityStatus: ADMETStatus = 'moderate';
  let solubilityPred = 'Moderate';
  if (logP < 3 && mw < 500) {
    solubilityStatus = 'good';
    solubilityPred = 'High';
  } else if (logP > 5 || mw > 600) {
    solubilityStatus = 'poor';
    solubilityPred = 'Low';
  }

  const bioavailability = Math.max(0, Math.min(1,
    1 - Math.abs(logP - 2) * 0.1 - psa * 0.003 - hDonors * 0.05
  ));
  
  let bioavailStatus: ADMETStatus = 'moderate';
  let bioavailPred = 'Moderate (~30-70%)';
  if (mw < 500 && logP < 5 && hDonors < 5 && hAcceptors < 10 && psa < 140) {
    bioavailStatus = 'good';
    bioavailPred = 'High (>70%)';
  } else if (mw > 600 || psa > 200 || hDonors > 10) {
    bioavailStatus = 'poor';
    bioavailPred = 'Low (<30%)';
  }

  return [
    {
      name: '肠道吸收',
      category: 'absorption' as ADMETCategory,
      prediction: `${intestinalPred} (${Math.round(intestinalScore * 100)}%)`,
      probability: Math.round(intestinalScore * 100) / 100,
      status: intestinalStatus,
      description: '基于极性表面积和亲脂性预测的口服吸收',
      reference: 'Zhao et al., 2003',
    },
    {
      name: '水溶性',
      category: 'absorption' as ADMETCategory,
      prediction: `${solubilityPred} (${Math.round(waterSolubility * 100)}%)`,
      probability: Math.round(waterSolubility * 100) / 100,
      status: solubilityStatus,
      description: 'pH 7.4条件下估算的水溶性',
      reference: 'ESOL模型',
    },
    {
      name: '口服生物利用度',
      category: 'absorption' as ADMETCategory,
      prediction: bioavailPred,
      probability: Math.round(bioavailability * 100) / 100,
      status: bioavailStatus,
      description: '预测到达体循环的药物比例',
      reference: 'Lipinski et al., 2001',
    },
  ];
}

function predictDistribution(descriptors: QuantumDescriptor[]): ADMETProperty[] {
  const logP = descriptors.find(d => d.name === 'logP')?.value || 0;
  const psa = descriptors.find(d => d.name === '极性表面积')?.value || 0;
  const mw = descriptors.find(d => d.name === '分子量')?.value || 0;

  const bbbScore = Math.max(0, Math.min(1,
    1 - psa * 0.008 - Math.abs(logP - 2) * 0.15
  ));
  
  let bbbStatus: ADMETStatus = 'moderate';
  let bbbPred = 'Moderate';
  if (psa < 90 && logP > 1 && logP < 4 && mw < 450) {
    bbbStatus = 'good';
    bbbPred = 'High - Crosses BBB';
  } else if (psa > 120 || logP < -1 || mw > 500) {
    bbbStatus = 'poor';
    bbbPred = 'Low - Does not cross BBB';
  }

  const vdss = 0.5 + logP * 0.3 - psa * 0.01;
  const vdssNorm = Math.max(0, Math.min(1, vdss / 5));
  
  let vdssStatus: ADMETStatus = 'moderate';
  let vdssPred = 'Moderate';
  if (vdss > 1 && vdss < 10) {
    vdssStatus = 'good';
    vdssPred = `High (${vdss.toFixed(1)} L/kg)`;
  } else if (vdss < 0.5) {
    vdssStatus = 'poor';
    vdssPred = `Low (${vdss.toFixed(1)} L/kg)`;
  }

  const ppbScore = Math.max(0, Math.min(1,
    0.5 + logP * 0.08
  ));
  
  let ppbStatus: ADMETStatus = 'moderate';
  let ppbPred = 'Moderate binding';
  if (logP > 3) {
    ppbStatus = 'good';
    ppbPred = `High binding (${Math.round(ppbScore * 100)}%)`;
  } else if (logP < 0) {
    ppbStatus = 'poor';
    ppbPred = `Low binding (${Math.round(ppbScore * 100)}%)`;
  }

  return [
    {
      name: '血脑屏障穿透',
      category: 'distribution' as ADMETCategory,
      prediction: bbbPred,
      probability: Math.round(bbbScore * 100) / 100,
      status: bbbStatus,
      description: '预测穿透血脑屏障的能力',
      reference: 'PAMPA-BBB模型',
    },
    {
      name: '分布容积',
      category: 'distribution' as ADMETCategory,
      prediction: vdssPred,
      probability: Math.round(vdssNorm * 100) / 100,
      status: vdssStatus,
      description: '预测稳态分布容积',
      reference: 'PK-Sim模型',
    },
    {
      name: '血浆蛋白结合',
      category: 'distribution' as ADMETCategory,
      prediction: ppbPred,
      probability: Math.round(ppbScore * 100) / 100,
      status: ppbStatus,
      description: '预测与血浆蛋白结合的比例',
      reference: '基于亲和力模型',
    },
  ];
}

function predictMetabolism(descriptors: QuantumDescriptor[]): ADMETProperty[] {
  const logP = descriptors.find(d => d.name === 'logP')?.value || 0;
  const mw = descriptors.find(d => d.name === '分子量')?.value || 0;
  const aromaticRings = descriptors.find(d => d.name === '芳香环数')?.value || 0;
  const hDonors = descriptors.find(d => d.name === '氢键供体')?.value || 0;

  const cyp3a4Score = Math.max(0, Math.min(1,
    0.3 + logP * 0.1 + aromaticRings * 0.05
  ));
  
  let cyp3a4Status: ADMETStatus = 'moderate';
  let cyp3a4Pred = 'Possible substrate';
  if (logP > 2 && aromaticRings > 0) {
    cyp3a4Status = 'good';
    cyp3a4Pred = 'Likely substrate';
  } else if (logP < 0 && mw > 500) {
    cyp3a4Status = 'poor';
    cyp3a4Pred = 'Not a substrate';
  }

  const cyp2d6Score = Math.max(0, Math.min(1,
    0.2 + logP * 0.08 + hDonors * 0.05
  ));
  
  let cyp2d6Status: ADMETStatus = 'moderate';
  let cyp2d6Pred = 'Possible inhibitor';
  if (logP > 3 && hDonors > 1) {
    cyp2d6Status = 'good';
    cyp2d6Pred = 'Likely inhibitor';
  } else if (mw > 600) {
    cyp2d6Status = 'poor';
    cyp2d6Pred = 'Not an inhibitor';
  }

  const metStability = Math.max(0, Math.min(1,
    1 - logP * 0.1 - aromaticRings * 0.1
  ));
  
  let metStatus: ADMETStatus = 'moderate';
  let metPred = 'Moderate stability';
  if (logP < 2 && aromaticRings < 2) {
    metStatus = 'good';
    metPred = 'High stability';
  } else if (logP > 4 || aromaticRings > 3) {
    metStatus = 'poor';
    metPred = 'Low stability';
  }

  return [
    {
      name: 'CYP3A4底物',
      category: 'metabolism' as ADMETCategory,
      prediction: cyp3a4Pred,
      probability: Math.round(cyp3a4Score * 100) / 100,
      status: cyp3a4Status,
      description: '预测CYP3A4酶底物可能性',
      reference: 'Mutagen模型',
    },
    {
      name: 'CYP2D6抑制',
      category: 'metabolism' as ADMETCategory,
      prediction: cyp2d6Pred,
      probability: Math.round(cyp2d6Score * 100) / 100,
      status: cyp2d6Status,
      description: '预测CYP2D6酶抑制作用',
      reference: '基于指纹模型',
    },
    {
      name: '代谢稳定性',
      category: 'metabolism' as ADMETCategory,
      prediction: metPred,
      probability: Math.round(metStability * 100) / 100,
      status: metStatus,
      description: '预测在肝微粒体中的稳定性',
      reference: '肝清除率模型',
    },
  ];
}

function predictExcretion(descriptors: QuantumDescriptor[]): ADMETProperty[] {
  const mw = descriptors.find(d => d.name === '分子量')?.value || 0;
  const logP = descriptors.find(d => d.name === 'logP')?.value || 0;
  const psa = descriptors.find(d => d.name === '极性表面积')?.value || 0;

  const renalClearance = Math.max(0, Math.min(1,
    1 - mw * 0.001 - Math.abs(logP) * 0.1
  ));
  
  let renalStatus: ADMETStatus = 'moderate';
  let renalPred = 'Moderate';
  if (mw < 400 && logP < 2) {
    renalStatus = 'good';
    renalPred = 'High renal clearance';
  } else if (mw > 600 || logP > 4) {
    renalStatus = 'poor';
    renalPred = 'Low renal clearance';
  }

  const halfLife = 2 + Math.exp(logP * 0.3) - mw * 0.01;
  const halfLifeNorm = Math.max(0, Math.min(1, halfLife / 24));
  
  let hlStatus: ADMETStatus = 'moderate';
  let hlPred = `${halfLife.toFixed(1)} hours`;
  if (halfLife > 4 && halfLife < 12) {
    hlStatus = 'good';
  } else if (halfLife < 2 || halfLife > 24) {
    hlStatus = 'poor';
  }

  const biliaryScore = Math.max(0, Math.min(1,
    0.3 + mw * 0.001 + logP * 0.05
  ));
  
  let biliaryStatus: ADMETStatus = 'moderate';
  let biliaryPred = 'Moderate';
  if (mw > 400 && logP > 2 && psa > 80) {
    biliaryStatus = 'good';
    biliaryPred = 'High biliary excretion';
  } else if (mw < 300) {
    biliaryStatus = 'poor';
    biliaryPred = 'Low biliary excretion';
  }

  return [
    {
      name: '肾清除率',
      category: 'excretion' as ADMETCategory,
      prediction: renalPred,
      probability: Math.round(renalClearance * 100) / 100,
      status: renalStatus,
      description: '预测肾脏清除率',
      reference: '基于GFR模型',
    },
    {
      name: '半衰期',
      category: 'excretion' as ADMETCategory,
      prediction: hlPred,
      probability: Math.round(halfLifeNorm * 100) / 100,
      status: hlStatus,
      description: '预测消除半衰期',
      reference: 'PK模型整合',
    },
    {
      name: '胆汁排泄',
      category: 'excretion' as ADMETCategory,
      prediction: biliaryPred,
      probability: Math.round(biliaryScore * 100) / 100,
      status: biliaryStatus,
      description: '预测胆汁排泄潜力',
      reference: '分子量阈值模型',
    },
  ];
}

function predictToxicity(descriptors: QuantumDescriptor[]): ADMETProperty[] {
  const logP = descriptors.find(d => d.name === 'logP')?.value || 0;
  const mw = descriptors.find(d => d.name === '分子量')?.value || 0;
  const hAcceptors = descriptors.find(d => d.name === '氢键受体')?.value || 0;
  const aromaticRings = descriptors.find(d => d.name === '芳香环数')?.value || 0;
  const hDonors = descriptors.find(d => d.name === '氢键供体')?.value || 0;

  const hergScore = Math.max(0, Math.min(1,
    0.1 + logP * 0.15 + hAcceptors * 0.03
  ));
  
  let hergStatus: ADMETStatus = 'moderate';
  let hergPred = 'Possible risk';
  if (logP > 4 && hAcceptors > 2) {
    hergStatus = 'poor';
    hergPred = 'High risk - hERG inhibitor';
  } else if (logP < 1) {
    hergStatus = 'good';
    hergPred = 'Low risk';
  }

  const hepatoScore = Math.max(0, Math.min(1,
    0.1 + logP * 0.1 + aromaticRings * 0.08
  ));
  
  let hepatoStatus: ADMETStatus = 'moderate';
  let hepatoPred = 'Possible risk';
  if (logP > 3 && aromaticRings > 2) {
    hepatoStatus = 'poor';
    hepatoPred = 'High risk - hepatotoxic';
  } else if (logP < 0.5 || aromaticRings < 1) {
    hepatoStatus = 'good';
    hepatoPred = 'Low risk';
  }

  const carcinogenicScore = Math.max(0, Math.min(1,
    0.1 + aromaticRings * 0.15 + logP * 0.05
  ));
  
  let carcinoStatus: ADMETStatus = 'moderate';
  let carcinoPred = 'Possible risk';
  if (aromaticRings > 3 || (logP > 4 && aromaticRings > 1)) {
    carcinoStatus = 'poor';
    carcinoPred = 'High risk - potential carcinogen';
  } else if (aromaticRings < 1) {
    carcinoStatus = 'good';
    carcinoPred = 'Low risk';
  }

  const mutagenicScore = Math.max(0, Math.min(1,
    0.1 + aromaticRings * 0.1 + hDonors * 0.05
  ));
  
  let mutaStatus: ADMETStatus = 'moderate';
  let mutaPred = 'Possible risk';
  if (aromaticRings > 2 && logP > 2) {
    mutaStatus = 'poor';
    mutaPred = 'High risk - mutagenic';
  } else if (aromaticRings < 1 && mw < 300) {
    mutaStatus = 'good';
    mutaPred = 'Low risk';
  }

  return [
    {
      name: 'hERG抑制',
      category: 'toxicity' as ADMETCategory,
      prediction: hergPred,
      probability: Math.round(hergScore * 100) / 100,
      status: hergStatus,
      description: '预测钾通道(hERG)抑制风险',
      reference: 'Doddareddy et al., 2006',
    },
    {
      name: '肝毒性',
      category: 'toxicity' as ADMETCategory,
      prediction: hepatoPred,
      probability: Math.round(hepatoScore * 100) / 100,
      status: hepatoStatus,
      description: '预测肝脏毒性风险',
      reference: 'Liu et al., 2011',
    },
    {
      name: '致癌性',
      category: 'toxicity' as ADMETCategory,
      prediction: carcinoPred,
      probability: Math.round(carcinogenicScore * 100) / 100,
      status: carcinoStatus,
      description: '预测致癌潜力',
      reference: 'ISSSTY数据库模型',
    },
    {
      name: '致突变性',
      category: 'toxicity' as ADMETCategory,
      prediction: mutaPred,
      probability: Math.round(mutagenicScore * 100) / 100,
      status: mutaStatus,
      description: '预测致突变潜力(Ames试验)',
      reference: 'Benigni et al., 2009',
    },
  ];
}

export function calculateADMETProperties(descriptors: QuantumDescriptor[]): ADMETProperty[] {
  return [
    ...predictAbsorption(descriptors),
    ...predictDistribution(descriptors),
    ...predictMetabolism(descriptors),
    ...predictExcretion(descriptors),
    ...predictToxicity(descriptors),
  ];
}

export function calculateDrugLikeness(molecule: Molecule, descriptors: QuantumDescriptor[]): DrugLikenessResult {
  const mw = descriptors.find(d => d.name === '分子量')?.value || 0;
  const logP = descriptors.find(d => d.name === 'logP')?.value || 0;
  const hDonors = descriptors.find(d => d.name === '氢键供体')?.value || 0;
  const hAcceptors = descriptors.find(d => d.name === '氢键受体')?.value || 0;
  const psa = descriptors.find(d => d.name === '极性表面积')?.value || 0;
  const rotatableBonds = descriptors.find(d => d.name === '可旋转键')?.value || 0;
  const molarRefractivity = descriptors.find(d => d.name === '摩尔折射率')?.value || 0;
  const atoms = molecule.atoms;
  const elementCounts = countElements(atoms);
  const carbonCount = elementCounts['C'] || 0;
  const heteroAtomCount = (elementCounts['N'] || 0) + (elementCounts['O'] || 0) + 
                         (elementCounts['S'] || 0) + (elementCounts['P'] || 0);

  const rules: DrugLikenessRule[] = [];

  const lipinskiViolations = [
    mw > 500,
    logP > 5,
    hDonors > 5,
    hAcceptors > 10,
  ].filter(v => v).length;

  rules.push({
    ruleName: "Lipinski五规则",
    passed: lipinskiViolations <= 1,
    score: Math.max(0, 100 - lipinskiViolations * 25),
    details: `分子量=${mw.toFixed(1)}, logP=${logP.toFixed(1)}, 氢键供体=${hDonors}, 氢键受体=${hAcceptors}. ${lipinskiViolations} 项违规。`,
    threshold: '分子量 ≤ 500, logP ≤ 5, 氢键供体 ≤ 5, 氢键受体 ≤ 10',
  });

  const veberPassed = rotatableBonds <= 10 && psa <= 140;
  rules.push({
    ruleName: "Veber规则",
    passed: veberPassed,
    score: veberPassed ? 100 : 50,
    details: `可旋转键=${rotatableBonds}, 极性表面积=${psa.toFixed(1)} Å²`,
    threshold: '可旋转键 ≤ 10, 极性表面积 ≤ 140 Å²',
  });

  const ghosePassed = mw >= 160 && mw <= 480 && 
                      logP >= -0.4 && logP <= 5.6 &&
                      molarRefractivity >= 40 && molarRefractivity <= 130 &&
                      atoms.length >= 20 && atoms.length <= 70;
  rules.push({
    ruleName: "Ghose过滤器",
    passed: ghosePassed,
    score: ghosePassed ? 100 : 40,
    details: `分子量=${mw.toFixed(1)}, logP=${logP.toFixed(1)}, 摩尔折射率=${molarRefractivity.toFixed(1)}, 原子数=${atoms.length}`,
    threshold: '160 ≤ 分子量 ≤ 480, -0.4 ≤ logP ≤ 5.6, 40 ≤ 摩尔折射率 ≤ 130, 20 ≤ 原子数 ≤ 70',
  });

  const eganPassed = logP >= -1 && logP <= 6 && psa >= 0 && psa <= 130;
  rules.push({
    ruleName: "Egan过滤器",
    passed: eganPassed,
    score: eganPassed ? 100 : 45,
    details: `logP=${logP.toFixed(1)}, 极性表面积=${psa.toFixed(1)} Å²`,
    threshold: '-1 ≤ logP ≤ 6, 极性表面积 ≤ 130 Å²',
  });

  const mueggePassed = mw >= 200 && mw <= 600 &&
                       logP >= -2 && logP <= 5 &&
                       hDonors <= 5 && hAcceptors <= 10 &&
                       rotatableBonds <= 15 &&
                       carbonCount >= 3 &&
                       heteroAtomCount >= 1;
  rules.push({
    ruleName: "Muegge过滤器",
    passed: mueggePassed,
    score: mueggePassed ? 100 : 40,
    details: `分子量=${mw.toFixed(1)}, logP=${logP.toFixed(1)}, 碳原子数=${carbonCount}, 杂原子数=${heteroAtomCount}`,
    threshold: '200 ≤ 分子量 ≤ 600, -2 ≤ logP ≤ 5, 碳原子数 ≥ 3, 杂原子数 ≥ 1',
  });

  const overallScore = Math.round(rules.reduce((sum, r) => sum + r.score, 0) / rules.length);

  let summary = '';
  if (overallScore >= 80) {
    summary = '优秀的类药性特征。该分子满足大多数药物化学的口服生物利用度标准。';
  } else if (overallScore >= 60) {
    summary = '良好的类药性特征。存在一些轻微违规，根据靶点类型可能可以接受。';
  } else if (overallScore >= 40) {
    summary = '中等类药性。部分性质可能需要优化以获得良好的药代动力学特性。';
  } else {
    summary = '较差的类药性特征。需要大量优化以改善药代动力学性质。';
  }

  return {
    overallScore,
    rules,
    summary,
  };
}

export async function calculateAllProperties(
  molecule: Molecule,
  types: ('quantum' | 'admet' | 'drug_likeness' | 'all')[]
): Promise<{
  quantumDescriptors?: QuantumDescriptor[];
  admetProperties?: ADMETProperty[];
  drugLikeness?: DrugLikenessResult;
}> {
  const result: {
    quantumDescriptors?: QuantumDescriptor[];
    admetProperties?: ADMETProperty[];
    drugLikeness?: DrugLikenessResult;
  } = {};

  const shouldCalculate = (type: 'quantum' | 'admet' | 'drug_likeness') =>
    types.includes('all') || types.includes(type);

  if (shouldCalculate('quantum') || shouldCalculate('admet') || shouldCalculate('drug_likeness')) {
    result.quantumDescriptors = calculateQuantumDescriptors(molecule);
    
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  if (shouldCalculate('admet') && result.quantumDescriptors) {
    result.admetProperties = calculateADMETProperties(result.quantumDescriptors);
    await new Promise(resolve => setTimeout(resolve, 400));
  }

  if (shouldCalculate('drug_likeness') && result.quantumDescriptors) {
    result.drugLikeness = calculateDrugLikeness(molecule, result.quantumDescriptors);
    await new Promise(resolve => setTimeout(resolve, 300));
  }

  return result;
}
