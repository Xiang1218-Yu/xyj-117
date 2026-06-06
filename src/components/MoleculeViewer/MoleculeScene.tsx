import { useRef, useState, useEffect, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';
import { Molecule, Atom, Bond, DisplayMode } from '../../types';
import { Atoms } from './Atoms';
import { Bonds } from './Bonds';
import { Ribbon } from './Ribbon';
import { ElectronCloud } from './ElectronCloud';
import { Starfield } from './Starfield';
import { calculateCenterOfMass } from '../../utils/simulationEngine';

interface MoleculeSceneProps {
  molecule: Molecule | null;
  ligandMolecule?: Molecule | null;
  displayMode: DisplayMode;
  showHydrogens: boolean;
  showLabels: boolean;
  autoRotate: boolean;
  backgroundColor: string;
  selectedAtomId: string | null;
  onAtomClick: (atomId: string) => void;
  showElectronCloud?: boolean;
  currentAtoms?: Atom[];
  ligandAtoms?: Atom[];
}

function AutoRotatingGroup({ 
  children, 
  autoRotate, 
  molecule 
}: { 
  children: React.ReactNode; 
  autoRotate: boolean;
  molecule: Molecule | null;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const centerOfMass = useMemo(() => {
    if (!molecule) return new THREE.Vector3(0, 0, 0);
    const com = calculateCenterOfMass(molecule.atoms);
    return new THREE.Vector3(com.x, com.y, com.z);
  }, [molecule]);

  useFrame((_, delta) => {
    if (groupRef.current && autoRotate) {
      groupRef.current.rotation.y += delta * 0.15;
    }
  });

  if (!molecule) return <>{children}</>;

  return (
    <group ref={groupRef} position={centerOfMass.clone().multiplyScalar(-1)}>
      {children}
    </group>
  );
}

function SceneContent({
  molecule,
  ligandMolecule,
  displayMode,
  showHydrogens,
  autoRotate,
  selectedAtomId,
  onAtomClick,
  showElectronCloud,
  currentAtoms,
  ligandAtoms,
}: Omit<MoleculeSceneProps, 'showLabels' | 'backgroundColor'>) {
  const [hoveredAtom, setHoveredAtom] = useState<string | null>(null);
  const atoms = currentAtoms || molecule?.atoms || [];
  const bonds = molecule?.bonds || [];

  return (
    <>
      <Starfield />
      
      <ambientLight intensity={0.4} />
      <directionalLight position={[10, 10, 5]} intensity={1} castShadow />
      <directionalLight position={[-10, -5, -10]} intensity={0.5} color="#8B5CF6" />
      <pointLight position={[0, 10, 0]} intensity={0.6} color="#3B82F6" />
      <pointLight position={[0, -10, 0]} intensity={0.4} color="#06B6D4" />
      
      <AutoRotatingGroup autoRotate={autoRotate} molecule={molecule}>
        <Atoms
          atoms={atoms}
          displayMode={displayMode}
          showHydrogens={showHydrogens}
          selectedAtomId={selectedAtomId}
          onAtomClick={onAtomClick}
          onAtomHover={setHoveredAtom}
        />
        
        <Bonds
          bonds={bonds}
          atoms={atoms}
          displayMode={displayMode}
          showHydrogens={showHydrogens}
        />
        
        <Ribbon
          atoms={atoms}
          displayMode={displayMode}
        />
        
        <ElectronCloud
          atoms={atoms}
          displayMode={displayMode}
          isVisible={showElectronCloud || false}
        />
      </AutoRotatingGroup>

      {ligandMolecule && (
        <AutoRotatingGroup autoRotate={false} molecule={ligandMolecule}>
          <Atoms
            atoms={ligandAtoms || ligandMolecule.atoms}
            displayMode="ball_stick"
            showHydrogens={showHydrogens}
            selectedAtomId={null}
            onAtomClick={() => {}}
            onAtomHover={() => {}}
          />
          <Bonds
            bonds={ligandMolecule.bonds}
            atoms={ligandAtoms || ligandMolecule.atoms}
            displayMode="ball_stick"
            showHydrogens={showHydrogens}
          />
        </AutoRotatingGroup>
      )}

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
          intensity={0.5}
          mipmapBlur
        />
      </EffectComposer>
    </>
  );
}

export function MoleculeScene(props: MoleculeSceneProps) {
  return (
    <Canvas
      camera={{ position: [0, 0, 25], fov: 50 }}
      gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
      dpr={[1, 2]}
      style={{ background: props.backgroundColor }}
    >
      <SceneContent {...props} />
    </Canvas>
  );
}
