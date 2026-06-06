import { Atom, Molecule, CalculationResult, SimulationParameters } from '../types';

const EPSILON = 0.001;
const K_B = 1.38e-23;
const R = 8.314;

const lennardJonesPotential = (distance: number, epsilon: number = 1.0, sigma: number = 1.0): number => {
  const ratio = sigma / distance;
  const ratio6 = Math.pow(ratio, 6);
  const ratio12 = ratio6 * ratio6;
  return 4 * epsilon * (ratio12 - ratio6);
};

const coulombPotential = (distance: number, charge1: number, charge2: number): number => {
  const K = 8.988e9;
  return K * (charge1 * charge2) / distance;
};

const harmonicBondPotential = (distance: number, equilibrium: number, k: number = 1000): number => {
  const diff = distance - equilibrium;
  return 0.5 * k * diff * diff;
};

const calculateDistance = (a1: Atom, a2: Atom): number => {
  const dx = a1.x - a2.x;
  const dy = a1.y - a2.y;
  const dz = a1.z - a2.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
};

const calculateCenterOfMass = (atoms: Atom[]): { x: number; y: number; z: number } => {
  let totalMass = 0;
  let cx = 0, cy = 0, cz = 0;
  const masses: Record<string, number> = {
    H: 1, C: 12, N: 14, O: 16, S: 32, P: 31, F: 19, Cl: 35.5,
  };
  
  atoms.forEach(atom => {
    const mass = masses[atom.element] || 12;
    totalMass += mass;
    cx += atom.x * mass;
    cy += atom.y * mass;
    cz += atom.z * mass;
  });
  
  return {
    x: cx / totalMass,
    y: cy / totalMass,
    z: cz / totalMass,
  };
};

const calculateRadiusOfGyration = (atoms: Atom[]): number => {
  const com = calculateCenterOfMass(atoms);
  let totalMass = 0;
  let rg2 = 0;
  const masses: Record<string, number> = {
    H: 1, C: 12, N: 14, O: 16, S: 32, P: 31,
  };
  
  atoms.forEach(atom => {
    const mass = masses[atom.element] || 12;
    totalMass += mass;
    const dx = atom.x - com.x;
    const dy = atom.y - com.y;
    const dz = atom.z - com.z;
    rg2 += mass * (dx * dx + dy * dy + dz * dz);
  });
  
  return Math.sqrt(rg2 / totalMass);
};

const calculateRMSD = (atoms1: Atom[], atoms2: Atom[]): number => {
  if (atoms1.length !== atoms2.length) return 0;
  
  let sum = 0;
  const n = atoms1.length;
  
  for (let i = 0; i < n; i++) {
    const dx = atoms1[i].x - atoms2[i].x;
    const dy = atoms1[i].y - atoms2[i].y;
    const dz = atoms1[i].z - atoms2[i].z;
    sum += dx * dx + dy * dy + dz * dz;
  }
  
  return Math.sqrt(sum / n);
};

const calculateTotalEnergy = (atoms: Atom[], bonds: { atom1: string; atom2: string; length: number }[], params: SimulationParameters): { potential: number; kinetic: number; total: number } => {
  let potential = 0;
  const atomMap = new Map(atoms.map(a => [a.id, a]));
  
  for (let i = 0; i < atoms.length; i++) {
    for (let j = i + 1; j < atoms.length; j++) {
      const dist = calculateDistance(atoms[i], atoms[j]);
      if (dist < EPSILON) continue;
      
      const epsilon = 0.5;
      const sigma = 1.0;
      potential += lennardJonesPotential(dist, epsilon, sigma);
      
      if (atoms[i].charge !== undefined && atoms[j].charge !== undefined) {
        potential += coulombPotential(dist, atoms[i].charge, atoms[j].charge);
      }
    }
  }
  
  bonds.forEach(bond => {
    const a1 = atomMap.get(bond.atom1);
    const a2 = atomMap.get(bond.atom2);
    if (a1 && a2) {
      const dist = calculateDistance(a1, a2);
      potential += harmonicBondPotential(dist, bond.length);
    }
  });
  
  const kinetic = 1.5 * atoms.length * K_B * params.temperature;
  
  return {
    potential,
    kinetic,
    total: potential + kinetic,
  };
};

const molecularDynamicsStep = (atoms: Atom[], params: SimulationParameters): Atom[] => {
  const dt = params.timestep * 1e-15;
  const newAtoms = atoms.map(atom => ({ ...atom }));
  const velocities = atoms.map(() => ({
    vx: (Math.random() - 0.5) * 0.01,
    vy: (Math.random() - 0.5) * 0.01,
    vz: (Math.random() - 0.5) * 0.01,
  }));
  
  const forces = atoms.map(() => ({ fx: 0, fy: 0, fz: 0 }));
  
  for (let i = 0; i < atoms.length; i++) {
    for (let j = i + 1; j < atoms.length; j++) {
      const dist = calculateDistance(atoms[i], atoms[j]);
      if (dist < EPSILON) continue;
      
      const dx = atoms[j].x - atoms[i].x;
      const dy = atoms[j].y - atoms[i].y;
      const dz = atoms[j].z - atoms[i].z;
      
      const forceMagnitude = 0.01 / (dist * dist + 0.1);
      
      forces[i].fx += forceMagnitude * dx / dist;
      forces[i].fy += forceMagnitude * dy / dist;
      forces[i].fz += forceMagnitude * dz / dist;
      forces[j].fx -= forceMagnitude * dx / dist;
      forces[j].fy -= forceMagnitude * dy / dist;
      forces[j].fz -= forceMagnitude * dz / dist;
    }
  }
  
  const tempFactor = Math.sqrt(params.temperature / 300);
  
  for (let i = 0; i < newAtoms.length; i++) {
    const damping = 0.995;
    
    velocities[i].vx = velocities[i].vx * damping + forces[i].fx * dt * tempFactor;
    velocities[i].vy = velocities[i].vy * damping + forces[i].fy * dt * tempFactor;
    velocities[i].vz = velocities[i].vz * damping + forces[i].fz * dt * tempFactor;
    
    newAtoms[i].x += velocities[i].vx * 1e-5;
    newAtoms[i].y += velocities[i].vy * 1e-5;
    newAtoms[i].z += velocities[i].vz * 1e-5;
  }
  
  return newAtoms;
};

const monteCarloFolding = (atoms: Atom[], temperature: number): Atom[] => {
  const newAtoms = atoms.map(a => ({ ...a }));
  const beta = 1 / (R * temperature / 1000);
  const com = calculateCenterOfMass(atoms);
  
  const moveIndex = Math.floor(Math.random() * atoms.length);
  const moveSize = 0.1 * Math.exp(-beta * 10);
  
  const dx = (Math.random() - 0.5) * moveSize;
  const dy = (Math.random() - 0.5) * moveSize;
  const dz = (Math.random() - 0.5) * moveSize;
  
  newAtoms[moveIndex].x += dx;
  newAtoms[moveIndex].y += dy;
  newAtoms[moveIndex].z += dz;
  
  if (atoms.length > 10 && moveIndex > 2 && moveIndex < atoms.length - 2) {
    const angle = (Math.random() - 0.5) * 0.3;
    for (let i = moveIndex; i < atoms.length; i++) {
      const relX = atoms[i].x - com.x;
      const relY = atoms[i].y - com.y;
      newAtoms[i].x = com.x + relX * Math.cos(angle) - relY * Math.sin(angle);
      newAtoms[i].y = com.y + relX * Math.sin(angle) + relY * Math.cos(angle);
    }
  }
  
  return newAtoms;
};

export const simulateProteinFolding = (
  molecule: Molecule,
  params: SimulationParameters,
  onStep: (step: number, energy: number, atoms: Atom[], rmsd: number, rg: number) => void,
  onComplete: (result: CalculationResult) => void
): { stop: () => void } => {
  let isRunning = true;
  let step = 0;
  const originalAtoms = [...molecule.atoms];
  let currentAtoms = [...molecule.atoms];
  
  const runStep = () => {
    if (!isRunning || step >= params.iterations) {
      const finalEnergy = calculateTotalEnergy(currentAtoms, molecule.bonds, params);
      onComplete({
        homoEnergy: finalEnergy.potential / 1000,
        lumoEnergy: finalEnergy.potential / 1000 + 5,
        bandGap: 5,
        hydrogenBonds: Math.floor(currentAtoms.length / 10),
        hydrophobicContacts: Math.floor(currentAtoms.length / 15),
      });
      return;
    }
    
    if (step % 10 === 0) {
      currentAtoms = monteCarloFolding(currentAtoms, params.temperature);
    } else {
      currentAtoms = molecularDynamicsStep(currentAtoms, params);
    }
    
    const energy = calculateTotalEnergy(currentAtoms, molecule.bonds, params);
    const rmsd = calculateRMSD(currentAtoms, originalAtoms);
    const rg = calculateRadiusOfGyration(currentAtoms);
    
    if (step % 5 === 0) {
      onStep(step, energy.total, currentAtoms, rmsd, rg);
    }
    
    step++;
    setTimeout(runStep, 10);
  };
  
  setTimeout(runStep, 0);
  
  return {
    stop: () => {
      isRunning = false;
    },
  };
};

export const simulateDocking = (
  ligand: Molecule,
  target: Molecule,
  params: SimulationParameters,
  onStep: (step: number, energy: number, ligandAtoms: Atom[], bindingEnergy: number) => void,
  onComplete: (result: CalculationResult) => void
): { stop: () => void } => {
  let isRunning = true;
  let step = 0;
  let currentLigandAtoms = [...ligand.atoms];
  
  const targetCom = calculateCenterOfMass(target.atoms);
  const ligandCom = calculateCenterOfMass(ligand.atoms);
  
  let translation = {
    x: targetCom.x - ligandCom.x + (Math.random() - 0.5) * 10,
    y: targetCom.y - ligandCom.y + (Math.random() - 0.5) * 10,
    z: targetCom.z - ligandCom.z + (Math.random() - 0.5) * 10,
  };
  
  currentLigandAtoms = currentLigandAtoms.map(a => ({
    ...a,
    x: a.x + translation.x,
    y: a.y + translation.y,
    z: a.z + translation.z,
  }));
  
  const calculateBindingEnergy = (ligandAtoms: Atom[]): number => {
    let binding = 0;
    
    ligandAtoms.forEach(la => {
      target.atoms.forEach(ta => {
        const dist = calculateDistance(la, ta);
        if (dist < 5 && dist > 0.5) {
          const lj = lennardJonesPotential(dist, 0.8, 1.2);
          binding += lj;
          
          if (dist < 3.5 && 
              ((la.element === 'O' && ta.element === 'H') ||
               (la.element === 'H' && ta.element === 'O') ||
               (la.element === 'N' && ta.element === 'H') ||
               (la.element === 'H' && ta.element === 'N'))) {
            binding -= 2;
          }
          
          if (dist < 4.5 && 
              ((la.element === 'C' && ta.element === 'C') ||
               (la.element === 'S' && ta.element === 'C'))) {
            binding -= 0.5;
          }
        }
      });
    });
    
    return binding;
  };
  
  const runStep = () => {
    if (!isRunning || step >= params.iterations) {
      const finalBinding = calculateBindingEnergy(currentLigandAtoms);
      onComplete({
        bindingEnergy: finalBinding,
        bindingAffinity: finalBinding / 1.36,
        hydrogenBonds: Math.floor(Math.abs(finalBinding) / 5),
        hydrophobicContacts: Math.floor(Math.abs(finalBinding) / 8),
      });
      return;
    }
    
    const moveStep = Math.max(0.05, 2.0 - step * 0.002);
    const rotStep = Math.max(0.02, 0.3 - step * 0.0003);
    
    const newLigandAtoms = currentLigandAtoms.map(a => ({ ...a }));
    
    const dx = (Math.random() - 0.5) * moveStep;
    const dy = (Math.random() - 0.5) * moveStep;
    const dz = (Math.random() - 0.5) * moveStep;
    
    const rx = (Math.random() - 0.5) * rotStep;
    const ry = (Math.random() - 0.5) * rotStep;
    const rz = (Math.random() - 0.5) * rotStep;
    
    const currentCom = calculateCenterOfMass(currentLigandAtoms);
    
    newLigandAtoms.forEach(a => {
      let relX = a.x - currentCom.x;
      let relY = a.y - currentCom.y;
      let relZ = a.z - currentCom.z;
      
      const y1 = relY * Math.cos(rx) - relZ * Math.sin(rx);
      const z1 = relY * Math.sin(rx) + relZ * Math.cos(rx);
      relY = y1; relZ = z1;
      
      const x2 = relX * Math.cos(ry) + relZ * Math.sin(ry);
      const z2 = -relX * Math.sin(ry) + relZ * Math.cos(ry);
      relX = x2; relZ = z2;
      
      const x3 = relX * Math.cos(rz) - relY * Math.sin(rz);
      const y3 = relX * Math.sin(rz) + relY * Math.cos(rz);
      relX = x3; relY = y3;
      
      a.x = currentCom.x + relX + dx;
      a.y = currentCom.y + relY + dy;
      a.z = currentCom.z + relZ + dz;
    });
    
    const oldEnergy = calculateBindingEnergy(currentLigandAtoms);
    const newEnergy = calculateBindingEnergy(newLigandAtoms);
    
    const beta = 1 / (R * params.temperature / 1000);
    const acceptProbability = Math.exp(-beta * (newEnergy - oldEnergy));
    
    if (newEnergy < oldEnergy || Math.random() < acceptProbability) {
      currentLigandAtoms = newLigandAtoms;
    }
    
    const totalEnergy = calculateTotalEnergy(currentLigandAtoms, ligand.bonds, params).total;
    const bindingEnergy = calculateBindingEnergy(currentLigandAtoms);
    
    if (step % 3 === 0) {
      onStep(step, totalEnergy, currentLigandAtoms, bindingEnergy);
    }
    
    step++;
    setTimeout(runStep, 15);
  };
  
  setTimeout(runStep, 0);
  
  return {
    stop: () => {
      isRunning = false;
    },
  };
};

export const simulateMaterialProperties = (
  material: Molecule,
  params: SimulationParameters,
  onStep: (step: number, energy: number, atoms: Atom[]) => void,
  onComplete: (result: CalculationResult) => void
): { stop: () => void } => {
  let isRunning = true;
  let step = 0;
  let currentAtoms = [...material.atoms];
  
  const runStep = () => {
    if (!isRunning || step >= params.iterations) {
      const finalEnergy = calculateTotalEnergy(currentAtoms, material.bonds, params);
      
      const materialType = material.id;
      let conductivity = 0.1;
      let elasticity = 50;
      let bandGap = 5;
      
      if (materialType === 'graphene') {
        conductivity = 1e6;
        elasticity = 1000;
        bandGap = 0;
      } else if (materialType === 'silicon') {
        conductivity = 1e-3;
        elasticity = 130;
        bandGap = 1.12;
      } else if (materialType === 'nacl') {
        conductivity = 1e-14;
        elasticity = 40;
        bandGap = 8.5;
      } else {
        conductivity = Math.exp(-finalEnergy.total / 1000);
        elasticity = 50 + Math.abs(finalEnergy.potential) / 100;
        bandGap = Math.abs(Math.sin(finalEnergy.total / 1000)) * 5 + 0.5;
      }
      
      const orbitals = [];
      for (let i = -5; i <= 5; i++) {
        orbitals.push({
          energy: i * 0.5,
          occupancy: i < 0 ? 2 : (i === 0 ? 1 : 0),
          type: i === -1 ? 'HOMO' as const : i === 0 ? 'LUMO' as const : 'other' as const,
          coefficients: Array(10).fill(0).map(() => Math.random()),
        });
      }
      
      const densityGrid: number[][] = [];
      for (let i = 0; i < 20; i++) {
        densityGrid.push([]);
        for (let j = 0; j < 20; j++) {
          let density = 0;
          currentAtoms.forEach(atom => {
            const dist = Math.sqrt(
              Math.pow((i - 10) * 0.5 - atom.x, 2) +
              Math.pow((j - 10) * 0.5 - atom.y, 2)
            );
            density += Math.exp(-dist * dist) * 0.1;
          });
          densityGrid[i].push(density);
        }
      }
      
      onComplete({
        conductivity,
        elasticity,
        bandGap,
        homoEnergy: -bandGap / 2,
        lumoEnergy: bandGap / 2,
        molecularOrbitals: orbitals,
        electronDensity: densityGrid,
      });
      return;
    }
    
    currentAtoms = molecularDynamicsStep(currentAtoms, params);
    
    const energy = calculateTotalEnergy(currentAtoms, material.bonds, params);
    
    if (step % 5 === 0) {
      onStep(step, energy.total, currentAtoms);
    }
    
    step++;
    setTimeout(runStep, 10);
  };
  
  setTimeout(runStep, 0);
  
  return {
    stop: () => {
      isRunning = false;
    },
  };
};

export const calculateHydrogenBonds = (atoms: Atom[]): { donor: Atom; acceptor: Atom; distance: number; angle: number }[] => {
  const hbonds = [];
  const hydrogens = atoms.filter(a => a.element === 'H');
  const donors = atoms.filter(a => a.element === 'O' || a.element === 'N' || a.element === 'F');
  const acceptors = atoms.filter(a => a.element === 'O' || a.element === 'N' || a.element === 'F');
  
  hydrogens.forEach(h => {
    donors.forEach(d => {
      const dHdist = calculateDistance(d, h);
      if (dHdist < 1.2) {
        acceptors.forEach(a => {
          if (a.id === d.id) return;
          const hAdist = calculateDistance(h, a);
          const dAdist = calculateDistance(d, a);
          
          if (hAdist < 2.5 && dAdist < 3.5) {
            const angle = Math.acos(
              ((d.x - h.x) * (a.x - h.x) + (d.y - h.y) * (a.y - h.y) + (d.z - h.z) * (a.z - h.z)) /
              (dHdist * hAdist)
            ) * 180 / Math.PI;
            
            if (angle > 120) {
              hbonds.push({
                donor: d,
                acceptor: a,
                distance: dAdist,
                angle,
              });
            }
          }
        });
      }
    });
  });
  
  return hbonds;
};

export { calculateDistance, calculateCenterOfMass, calculateRadiusOfGyration, calculateRMSD, calculateTotalEnergy };
