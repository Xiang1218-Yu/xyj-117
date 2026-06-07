import {
  ReactionMechanism,
  ReactionKeyframe,
  ElectronTransfer,
  BondChange,
  ReactionEnergyPoint,
  Atom,
  Bond,
  AnimationParticle,
} from '../types';

export const easeInOutQuad = (t: number): number => {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
};

export const easeInOutCubic = (t: number): number => {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
};

export const easeOutCubic = (t: number): number => {
  return 1 - Math.pow(1 - t, 3);
};

export const easeInCubic = (t: number): number => {
  return t * t * t;
};

export const lerp = (start: number, end: number, t: number): number => {
  return start + (end - start) * t;
};

export const vectorLerp = (
  start: { x: number; y: number; z: number },
  end: { x: number; y: number; z: number },
  t: number
): { x: number; y: number; z: number } => ({
  x: lerp(start.x, end.x, t),
  y: lerp(start.y, end.y, t),
  z: lerp(start.z, end.z, t),
});

export const bezierInterpolate = (
  p0: { x: number; y: number; z: number },
  p1: { x: number; y: number; z: number },
  p2: { x: number; y: number; z: number },
  p3: { x: number; y: number; z: number },
  t: number
): { x: number; y: number; z: number } => {
  const mt = 1 - t;
  const mt2 = mt * mt;
  const mt3 = mt2 * mt;
  const t2 = t * t;
  const t3 = t2 * t;

  return {
    x: mt3 * p0.x + 3 * mt2 * t * p1.x + 3 * mt * t2 * p2.x + t3 * p3.x,
    y: mt3 * p0.y + 3 * mt2 * t * p1.y + 3 * mt * t2 * p2.y + t3 * p3.y,
    z: mt3 * p0.z + 3 * mt2 * t * p1.z + 3 * mt * t2 * p2.z + t3 * p3.z,
  };
};

export const getPointOnCurve = (
  points: { x: number; y: number; z: number }[],
  t: number
): { x: number; y: number; z: number } => {
  if (points.length < 2) return points[0] || { x: 0, y: 0, z: 0 };

  const segmentCount = points.length - 1;
  const scaledT = t * segmentCount;
  const segmentIndex = Math.min(Math.floor(scaledT), segmentCount - 1);
  const localT = scaledT - segmentIndex;

  const p0 = points[segmentIndex];
  const p1 = points[segmentIndex + 1];

  const tangentScale = 0.3;
  const prevP = points[Math.max(0, segmentIndex - 1)];
  const nextP = points[Math.min(segmentCount, segmentIndex + 2)];

  const cp1 = {
    x: p0.x + (p1.x - prevP.x) * tangentScale,
    y: p0.y + (p1.y - prevP.y) * tangentScale,
    z: p0.z + (p1.z - prevP.z) * tangentScale,
  };

  const cp2 = {
    x: p1.x - (nextP.x - p0.x) * tangentScale,
    y: p1.y - (nextP.y - p0.y) * tangentScale,
    z: p1.z - (nextP.z - p0.z) * tangentScale,
  };

  return bezierInterpolate(p0, cp1, cp2, p1, localT);
};

export const findSurroundingKeyframes = (
  keyframes: ReactionKeyframe[],
  currentTime: number
): { prev: ReactionKeyframe; next: ReactionKeyframe; t: number } => {
  if (keyframes.length === 0) {
    throw new Error('No keyframes available');
  }

  if (keyframes.length === 1) {
    return { prev: keyframes[0], next: keyframes[0], t: 0 };
  }

  for (let i = 0; i < keyframes.length - 1; i++) {
    if (currentTime >= keyframes[i].time && currentTime <= keyframes[i + 1].time) {
      const timeRange = keyframes[i + 1].time - keyframes[i].time;
      const t = timeRange > 0 ? (currentTime - keyframes[i].time) / timeRange : 0;
      return { prev: keyframes[i], next: keyframes[i + 1], t };
    }
  }

  if (currentTime <= keyframes[0].time) {
    return { prev: keyframes[0], next: keyframes[0], t: 0 };
  }

  const last = keyframes[keyframes.length - 1];
  return { prev: last, next: last, t: 1 };
};

export const interpolateAtomPositions = (
  prevKeyframe: ReactionKeyframe,
  nextKeyframe: ReactionKeyframe,
  t: number
): Map<string, { x: number; y: number; z: number }> => {
  const positions = new Map<string, { x: number; y: number; z: number }>();
  const easedT = easeInOutCubic(t);

  const allAtomIds = new Set([
    ...prevKeyframe.atoms.map(a => a.id),
    ...nextKeyframe.atoms.map(a => a.id),
  ]);

  allAtomIds.forEach(atomId => {
    const prevAtom = prevKeyframe.atoms.find(a => a.id === atomId);
    const nextAtom = nextKeyframe.atoms.find(a => a.id === atomId);

    if (prevAtom && nextAtom) {
      positions.set(atomId, vectorLerp(prevAtom, nextAtom, easedT));
    } else if (prevAtom) {
      positions.set(atomId, { x: prevAtom.x, y: prevAtom.y, z: prevAtom.z });
    } else if (nextAtom) {
      positions.set(atomId, { x: nextAtom.x, y: nextAtom.y, z: nextAtom.z });
    }
  });

  return positions;
};

export const interpolateBondOrders = (
  prevKeyframe: ReactionKeyframe,
  nextKeyframe: ReactionKeyframe,
  t: number
): Map<string, number> => {
  const bondOrders = new Map<string, number>();
  const easedT = easeInOutQuad(t);

  const getBondKey = (a1: string, a2: string) => {
    const sorted = [a1, a2].sort();
    return `${sorted[0]}-${sorted[1]}`;
  };

  const prevBondMap = new Map<string, number>();
  prevKeyframe.bonds.forEach(b => {
    prevBondMap.set(getBondKey(b.atom1, b.atom2), b.order);
  });

  const nextBondMap = new Map<string, number>();
  nextKeyframe.bonds.forEach(b => {
    nextBondMap.set(getBondKey(b.atom1, b.atom2), b.order);
  });

  const allBondKeys = new Set([...prevBondMap.keys(), ...nextBondMap.keys()]);

  allBondKeys.forEach(bondKey => {
    const prevOrder = prevBondMap.get(bondKey) ?? 0;
    const nextOrder = nextBondMap.get(bondKey) ?? 0;
    bondOrders.set(bondKey, lerp(prevOrder, nextOrder, easedT));
  });

  return bondOrders;
};

export const getActiveElectronTransfers = (
  transfers: ElectronTransfer[],
  currentTime: number
): (ElectronTransfer & { progress: number; isActive: boolean })[] => {
  return transfers.map(transfer => {
    const isActive = currentTime >= transfer.startTime && currentTime <= transfer.endTime;
    const duration = transfer.endTime - transfer.startTime;
    const rawProgress = duration > 0 ? (currentTime - transfer.startTime) / duration : 0;
    const progress = Math.max(0, Math.min(1, rawProgress));

    return {
      ...transfer,
      progress,
      isActive,
    };
  });
};

export const getActiveBondChanges = (
  changes: BondChange[],
  currentTime: number
): (BondChange & { progress: number; currentOrder: number; isActive: boolean })[] => {
  return changes.map(change => {
    const isActive = currentTime >= change.startTime && currentTime <= change.endTime;
    const duration = change.endTime - change.startTime;
    const rawProgress = duration > 0 ? (currentTime - change.startTime) / duration : 0;
    const progress = Math.max(0, Math.min(1, rawProgress));
    const easedProgress = easeInOutQuad(progress);
    const currentOrder = lerp(change.initialOrder, change.finalOrder, easedProgress);

    return {
      ...change,
      progress,
      currentOrder,
      isActive,
    };
  });
};

export const interpolateEnergy = (
  energyProfile: ReactionEnergyPoint[],
  currentTime: number
): number => {
  if (energyProfile.length === 0) return 0;
  if (energyProfile.length === 1) return energyProfile[0].energy;

  for (let i = 0; i < energyProfile.length - 1; i++) {
    if (currentTime >= energyProfile[i].time && currentTime <= energyProfile[i + 1].time) {
      const timeRange = energyProfile[i + 1].time - energyProfile[i].time;
      const t = timeRange > 0 ? (currentTime - energyProfile[i].time) / timeRange : 0;
      const easedT = easeInOutCubic(t);
      return lerp(energyProfile[i].energy, energyProfile[i + 1].energy, easedT);
    }
  }

  if (currentTime <= energyProfile[0].time) return energyProfile[0].energy;
  return energyProfile[energyProfile.length - 1].energy;
};

export const getElectronTransferPosition = (
  transfer: ElectronTransfer,
  progress: number
): { x: number; y: number; z: number } => {
  const easedProgress = easeOutCubic(progress);
  return getPointOnCurve(transfer.curvePoints, easedProgress);
};

export const generateElectronParticles = (
  activeTransfers: (ElectronTransfer & { progress: number; isActive: boolean })[],
  particlePool: Map<string, AnimationParticle[]>,
  time: number
): AnimationParticle[] => {
  const particles: AnimationParticle[] = [];

  activeTransfers.forEach(transfer => {
    if (!transfer.isActive) return;

    const existingParticles = particlePool.get(transfer.id) || [];
    const maxParticles = Math.min(transfer.electronCount * 3, 12);

    for (let i = 0; i < maxParticles; i++) {
      const particleOffset = (i / maxParticles + time * 0.001) % 1;
      const particleProgress = (transfer.progress + particleOffset) % 1;
      const pos = getElectronTransferPosition(transfer, particleProgress);

      const speed = 0.02;
      const angle = (i / maxParticles) * Math.PI * 2;
      
      const existing = existingParticles[i];
      if (existing) {
        existing.position = pos;
        existing.velocity = {
          x: Math.cos(angle) * speed,
          y: Math.sin(angle) * speed,
          z: 0,
        };
        existing.life = particleProgress;
        existing.trail.unshift({ ...pos });
        if (existing.trail.length > 8) existing.trail.pop();
        particles.push(existing);
      } else {
        particles.push({
          id: `${transfer.id}-p${i}`,
          position: { ...pos },
          velocity: {
            x: Math.cos(angle) * speed,
            y: Math.sin(angle) * speed,
            z: 0,
          },
          color: transfer.color,
          size: 0.12,
          life: particleProgress,
          maxLife: 1,
          trail: [{ ...pos }],
        });
      }
    }

    particlePool.set(transfer.id, particles.filter(p => p.id.startsWith(transfer.id)));
  });

  return particles;
};

export const getCurrentAtomsForRender = (
  reaction: ReactionMechanism,
  currentTime: number,
  showHydrogens: boolean = true
): Atom[] => {
  const { prev, next, t } = findSurroundingKeyframes(reaction.keyframes, currentTime);
  const positions = interpolateAtomPositions(prev, next, t);

  const atoms: Atom[] = [];
  const allAtomIds = new Set([
    ...prev.atoms.map(a => a.id),
    ...next.atoms.map(a => a.id),
  ]);

  const allAtoms = new Map<string, Atom>();
  reaction.reactants.forEach(mol => {
    mol.atoms.forEach(atom => allAtoms.set(atom.id, atom));
  });
  reaction.products.forEach(mol => {
    mol.atoms.forEach(atom => allAtoms.set(atom.id, atom));
  });

  allAtomIds.forEach(atomId => {
    const baseAtom = allAtoms.get(atomId);
    const pos = positions.get(atomId);

    if (baseAtom && pos) {
      if (!showHydrogens && baseAtom.element === 'H') return;

      atoms.push({
        ...baseAtom,
        x: pos.x,
        y: pos.y,
        z: pos.z,
      });
    }
  });

  return atoms;
};

export const getCurrentBondsForRender = (
  reaction: ReactionMechanism,
  currentTime: number
): { id: string; atom1: string; atom2: string; order: number; length: number }[] => {
  const { prev, next, t } = findSurroundingKeyframes(reaction.keyframes, currentTime);
  const bondOrders = interpolateBondOrders(prev, next, t);
  const activeChanges = getActiveBondChanges(reaction.bondChanges, currentTime);

  const bonds: { id: string; atom1: string; atom2: string; order: number; length: number }[] = [];
  const processedKeys = new Set<string>();

  const getBondKey = (a1: string, a2: string) => {
    const sorted = [a1, a2].sort();
    return `${sorted[0]}-${sorted[1]}`;
  };

  activeChanges.forEach(change => {
    if (change.currentOrder > 0.1) {
      const key = getBondKey(change.atom1, change.atom2);
      processedKeys.add(key);
      bonds.push({
        id: change.id,
        atom1: change.atom1,
        atom2: change.atom2,
        order: change.currentOrder,
        length: 1.5,
      });
    }
  });

  bondOrders.forEach((order, key) => {
    if (!processedKeys.has(key) && order > 0.1) {
      const [atom1, atom2] = key.split('-');
      bonds.push({
        id: key,
        atom1,
        atom2,
        order,
        length: 1.5,
      });
    }
  });

  return bonds;
};

export const getCurrentKeyframeIndex = (
  keyframes: ReactionKeyframe[],
  currentTime: number
): number => {
  for (let i = keyframes.length - 1; i >= 0; i--) {
    if (currentTime >= keyframes[i].time) {
      return i;
    }
  }
  return 0;
};

export const isAtTransitionState = (
  keyframes: ReactionKeyframe[],
  currentTime: number,
  threshold: number = 5
): boolean => {
  return keyframes.some(
    kf => kf.type === 'transition_state' && Math.abs(kf.time - currentTime) < threshold
  );
};

export const getReactionPhase = (
  keyframes: ReactionKeyframe[],
  currentTime: number
): 'reactant' | 'transition' | 'intermediate' | 'product' => {
  const { prev } = findSurroundingKeyframes(keyframes, currentTime);
  return prev.type === 'transition_state' ? 'transition' : prev.type;
};

export class ReactionMechanismEngine {
  private reaction: ReactionMechanism | null = null;
  private currentTime: number = 0;
  private playbackSpeed: number = 1;
  private isPlaying: boolean = false;
  private particlePool: Map<string, AnimationParticle[]> = new Map();
  private lastFrameTime: number = 0;
  private listeners: Set<() => void> = new Set();

  setReaction(reaction: ReactionMechanism): void {
    this.reaction = reaction;
    this.currentTime = 0;
    this.particlePool.clear();
    this.notifyListeners();
  }

  getReaction(): ReactionMechanism | null {
    return this.reaction;
  }

  setTime(time: number): void {
    if (!this.reaction) return;
    const maxTime = this.reaction.keyframes[this.reaction.keyframes.length - 1]?.time || 100;
    this.currentTime = Math.max(0, Math.min(maxTime, time));
    this.notifyListeners();
  }

  getTime(): number {
    return this.currentTime;
  }

  setPlaybackSpeed(speed: number): void {
    this.playbackSpeed = Math.max(0.25, Math.min(4, speed));
  }

  getPlaybackSpeed(): number {
    return this.playbackSpeed;
  }

  play(): void {
    if (!this.reaction) return;
    
    const maxTime = this.reaction.keyframes[this.reaction.keyframes.length - 1]?.time || 100;
    
    if (this.currentTime >= maxTime) {
      this.currentTime = 0;
      this.particlePool.clear();
    }
    
    this.isPlaying = true;
    this.lastFrameTime = performance.now();
  }

  pause(): void {
    this.isPlaying = false;
  }

  togglePlay(): void {
    if (this.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }

  isPlayingState(): boolean {
    return this.isPlaying;
  }

  reset(): void {
    this.currentTime = 0;
    this.particlePool.clear();
    this.notifyListeners();
  }

  stepForward(amount: number = 1): void {
    if (!this.reaction) return;
    const maxTime = this.reaction.keyframes[this.reaction.keyframes.length - 1]?.time || 100;
    this.currentTime = Math.min(maxTime, this.currentTime + amount);
    this.notifyListeners();
  }

  stepBackward(amount: number = 1): void {
    this.currentTime = Math.max(0, this.currentTime - amount);
    this.notifyListeners();
  }

  goToKeyframe(index: number): void {
    if (!this.reaction || index < 0 || index >= this.reaction.keyframes.length) return;
    this.currentTime = this.reaction.keyframes[index].time;
    this.notifyListeners();
  }

  update(frameTime: number = performance.now()): void {
    if (!this.isPlaying || !this.reaction) return;

    const deltaTime = (frameTime - this.lastFrameTime) / 1000;
    this.lastFrameTime = frameTime;

    const maxTime = this.reaction.keyframes[this.reaction.keyframes.length - 1]?.time || 100;
    const timeIncrement = deltaTime * 20 * this.playbackSpeed;

    this.currentTime += timeIncrement;

    if (this.currentTime >= maxTime) {
      this.currentTime = maxTime;
      this.isPlaying = false;
    }

    this.notifyListeners();
  }

  getRenderState() {
    if (!this.reaction) return null;

    const { prev, next, t } = findSurroundingKeyframes(this.reaction.keyframes, this.currentTime);
    const atomPositions = interpolateAtomPositions(prev, next, t);
    const bondOrders = interpolateBondOrders(prev, next, t);
    const activeTransfers = getActiveElectronTransfers(this.reaction.electronTransfers, this.currentTime);
    const activeBondChanges = getActiveBondChanges(this.reaction.bondChanges, this.currentTime);
    const currentEnergy = interpolateEnergy(this.reaction.energyProfile, this.currentTime);
    const particles = generateElectronParticles(activeTransfers, this.particlePool, this.currentTime);
    const currentKeyframeIndex = getCurrentKeyframeIndex(this.reaction.keyframes, this.currentTime);
    const atTransitionState = isAtTransitionState(this.reaction.keyframes, this.currentTime);
    const phase = getReactionPhase(this.reaction.keyframes, this.currentTime);

    return {
      currentTime: this.currentTime,
      totalDuration: this.reaction.keyframes[this.reaction.keyframes.length - 1]?.time || 100,
      atomPositions,
      bondOrders,
      activeTransfers,
      activeBondChanges,
      currentEnergy,
      particles,
      currentKeyframeIndex,
      atTransitionState,
      phase,
      keyframes: this.reaction.keyframes,
      energyProfile: this.reaction.energyProfile,
      activationEnergy: this.reaction.activationEnergy,
      reactionEnthalpy: this.reaction.reactionEnthalpy,
    };
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener());
  }

  dispose(): void {
    this.listeners.clear();
    this.particlePool.clear();
  }
}
