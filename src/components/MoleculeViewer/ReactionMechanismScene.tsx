import { useRef, useEffect, useMemo, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';
import { ReactionMechanism, ReactionSimulationState, Atom, Bond } from '../../types';
import { ReactionMechanismEngine } from '../../utils/reactionMechanismEngine';
import { getAtomColor } from '../../utils/atomColors';
import { Atoms } from './Atoms';
import { Bonds } from './Bonds';
import { ElectronTransferArrow } from './ElectronTransferArrow';
import { BondChangeAnimator } from './BondChangeAnimator';
import { TransitionStateHighlight } from './TransitionStateHighlight';
import { Starfield } from './Starfield';
import { getCurrentAtomsForRender, getCurrentBondsForRender } from '../../utils/reactionMechanismEngine';

interface SceneContentProps {
  reaction: ReactionMechanism;
  engine: ReactionMechanismEngine;
  simulationState: ReactionSimulationState;
  showHydrogens: boolean;
  autoRotate: boolean;
  backgroundColor: string;
}

function SceneContent({ 
  reaction, 
  engine, 
  simulationState, 
  showHydrogens, 
  autoRotate,
  backgroundColor,
}: SceneContentProps) {
  const groupRef = useRef<THREE.Group>(null);
  const [renderState, setRenderState] = useState<any>(null);

  useFrame(() => {
    engine.update();
    const state = engine.getRenderState();
    setRenderState(state);
  });

  const currentAtoms = useMemo(() => {
    if (!reaction || !renderState) return [];
    return getCurrentAtomsForRender(reaction, renderState.currentTime, showHydrogens);
  }, [reaction, renderState, showHydrogens]);

  const currentBonds = useMemo(() => {
    if (!reaction || !renderState) return [];
    return getCurrentBondsForRender(reaction, renderState.currentTime);
  }, [reaction, renderState]);

  const atomMap = useMemo(() => {
    const map = new Map<string, { x: number; y: number; z: number }>();
    currentAtoms.forEach(atom => {
      map.set(atom.id, { x: atom.x, y: atom.y, z: atom.z });
    });
    return map;
  }, [currentAtoms]);

  const centerOfMass = useMemo(() => {
    if (currentAtoms.length === 0) return new THREE.Vector3(0, 0, 0);
    const com = { x: 0, y: 0, z: 0 };
    currentAtoms.forEach(atom => {
      com.x += atom.x;
      com.y += atom.y;
      com.z += atom.z;
    });
    com.x /= currentAtoms.length;
    com.y /= currentAtoms.length;
    com.z /= currentAtoms.length;
    return new THREE.Vector3(com.x, com.y, com.z);
  }, [currentAtoms]);

  useEffect(() => {
    if (groupRef.current) {
      groupRef.current.position.copy(centerOfMass.clone().multiplyScalar(-1));
    }
  }, [centerOfMass]);

  useFrame((_, delta) => {
    if (groupRef.current && autoRotate && !simulationState.isRunning) {
      groupRef.current.rotation.y += delta * 0.15;
    }
  });

  return (
    <>
      <Starfield />
      
      <ambientLight intensity={0.4} />
      <directionalLight position={[10, 10, 5]} intensity={1} castShadow />
      <directionalLight position={[-10, -5, -10]} intensity={0.5} color="#8B5CF6" />
      <pointLight position={[0, 10, 0]} intensity={0.6} color="#3B82F6" />
      <pointLight position={[0, -10, 0]} intensity={0.4} color="#06B6D4" />

      <group ref={groupRef}>
        <Atoms
          atoms={currentAtoms as Atom[]}
          displayMode="ball_stick"
          showHydrogens={showHydrogens}
          selectedAtomId={null}
          onAtomClick={() => {}}
          onAtomHover={() => {}}
        />
        
        <Bonds
          bonds={currentBonds as Bond[]}
          atoms={currentAtoms as Atom[]}
          displayMode="ball_stick"
          showHydrogens={showHydrogens}
        />

        {simulationState.showElectronFlow && renderState?.activeTransfers && (
          renderState.activeTransfers.map((transfer: any) => (
            <ElectronTransferArrow
              key={transfer.id}
              transfer={transfer}
              showFlow={simulationState.showElectronFlow}
            />
          ))
        )}

        {simulationState.showBondChanges && renderState?.activeBondChanges && (
          <BondChangeAnimator
            bondChanges={renderState.activeBondChanges}
            atoms={atomMap}
            showBondChanges={simulationState.showBondChanges}
          />
        )}

        {simulationState.showTransitionStates && renderState?.keyframes && (
          <TransitionStateHighlight
            keyframes={reaction.keyframes}
            currentTime={renderState.currentTime}
            atoms={atomMap}
            showTransitionStates={simulationState.showTransitionStates}
          />
        )}
      </group>

      <ContactShadows
        position={[0, -15, 0]}
        opacity={0.4}
        scale={50}
        blur={2}
        far={30}
        color="#000000"
      />
      
      <OrbitControls
        enableDamping
        dampingFactor={0.05}
        minDistance={5}
        maxDistance={100}
        autoRotate={false}
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
      />

      <EffectComposer>
        <Bloom
          luminanceThreshold={0.2}
          luminanceSmoothing={0.9}
          intensity={0.8}
          mipmapBlur
        />
      </EffectComposer>
    </>
  );
}

interface ReactionMechanismSceneProps {
  reaction: ReactionMechanism;
  engine: ReactionMechanismEngine;
  simulationState: ReactionSimulationState;
  showHydrogens?: boolean;
  autoRotate?: boolean;
  backgroundColor?: string;
}

export function ReactionMechanismScene({
  reaction,
  engine,
  simulationState,
  showHydrogens = true,
  autoRotate = false,
  backgroundColor = '#0f172a',
}: ReactionMechanismSceneProps) {
  return (
    <Canvas
      camera={{ position: [0, 0, 25], fov: 50 }}
      gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
      dpr={[1, 2]}
      style={{ background: backgroundColor }}
    >
      <SceneContent
        reaction={reaction}
        engine={engine}
        simulationState={simulationState}
        showHydrogens={showHydrogens}
        autoRotate={autoRotate}
        backgroundColor={backgroundColor}
      />
    </Canvas>
  );
}
