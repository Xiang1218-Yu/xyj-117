import { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import { Canvas, useFrame, useThree, ThreeEvent } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';
import { Molecule, Atom, Bond, DisplayMode, EditorState } from '../../types';
import { Atoms } from './Atoms';
import { Bonds } from './Bonds';
import { Ribbon } from './Ribbon';
import { ElectronCloud } from './ElectronCloud';
import { Starfield } from './Starfield';
import { calculateCenterOfMass } from '../../utils/simulationEngine';
import { getAtomColor } from '../../utils/atomColors';

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
  editor?: EditorState;
  onAddAtom?: (x: number, y: number, z: number) => void;
  onDeleteAtom?: (atomId: string) => void;
  onAddBond?: (atom1Id: string, atom2Id: string) => void;
  onDeleteBond?: (bondId: string) => void;
  onBondStart?: (atomId: string) => void;
  onBondClick?: (bondId: string) => void;
  onAtomDrag?: (atomId: string, x: number, y: number, z: number) => void;
  onSceneClick?: (point: THREE.Vector3) => void;
  onClearSelection?: () => void;
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
  editor,
  onAddAtom,
  onDeleteAtom,
  onAddBond,
  onDeleteBond,
  onBondStart,
  onBondClick,
  onAtomDrag,
  onSceneClick,
  onClearSelection,
}: Omit<MoleculeSceneProps, 'showLabels' | 'backgroundColor'>) {
  const [hoveredAtom, setHoveredAtom] = useState<string | null>(null);
  const [hoveredBond, setHoveredBond] = useState<string | null>(null);
  const [previewPosition, setPreviewPosition] = useState<THREE.Vector3 | null>(null);
  const { camera, raycaster, pointer } = useThree();
  const atoms = currentAtoms || molecule?.atoms || [];
  const bonds = molecule?.bonds || [];
  const planeRef = useRef(new THREE.Plane(new THREE.Vector3(0, 0, 1), 0));
  const controlsRef = useRef<any>(null);

  const isEditMode = editor?.mode === 'edit';
  const canInteract = isEditMode && !editor?.isDragging;

  const bondStartAtom = useMemo(() => {
    if (!editor?.bondStartAtomId || !molecule) return null;
    return molecule.atoms.find(a => a.id === editor.bondStartAtomId) || null;
  }, [editor?.bondStartAtomId, molecule]);

  const handlePointerMove = useCallback(() => {
    if (!isEditMode || !editor) return;
    
    if (editor.activeTool === 'add_atom') {
      const intersection = new THREE.Vector3();
      const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1).applyQuaternion(camera.quaternion), 0);
      raycaster.setFromCamera(pointer, camera);
      raycaster.ray.intersectPlane(plane, intersection);
      
      if (intersection) {
        setPreviewPosition(intersection);
      }
    }
  }, [isEditMode, editor, camera, raycaster, pointer]);


  const handleSceneClick = useCallback((e: ThreeEvent<MouseEvent>) => {
    if (!isEditMode || !editor) return;
    
    if (editor.activeTool === 'add_atom' && onAddAtom && previewPosition) {
      const target = e.target as any;
      const isPlaneClick = target?.geometry?.type === 'PlaneGeometry';
      const isEmptyClick = e.instanceId === undefined;
      
      if (isEmptyClick || isPlaneClick) {
        e.stopPropagation();
        onAddAtom(previewPosition.x, previewPosition.y, previewPosition.z);
        setPreviewPosition(null);
      }
    } else if (editor.activeTool === 'select' && onClearSelection && e.instanceId === undefined) {
      onClearSelection();
    }
  }, [isEditMode, editor, previewPosition, onAddAtom, onClearSelection]);
  const handleAtomClick = useCallback((atomId: string) => {
    if (!isEditMode || !editor) {
      onAtomClick(atomId);
      return;
    }

    if (editor.activeTool === 'bond') {
      if (editor.bondStartAtomId) {
        if (editor.bondStartAtomId !== atomId && onAddBond) {
          onAddBond(editor.bondStartAtomId, atomId);
        }
      } else if (onBondStart) {
        onBondStart(atomId);
      }
    } else if (editor.activeTool === 'delete' && onDeleteAtom) {
      onDeleteAtom(atomId);
    } else {
      onAtomClick(atomId);
    }
  }, [isEditMode, editor, onAtomClick, onAddBond, onBondStart, onDeleteAtom]);

  const handleBondClick = useCallback((bondId: string) => {
    if (!isEditMode || !editor) return;
    
    if ((editor.activeTool === 'delete' || editor.activeTool === 'erase_bond') && onDeleteBond) {
      onDeleteBond(bondId);
    } else if (editor.activeTool === 'select' && onBondClick) {
      onBondClick(bondId);
    }
  }, [isEditMode, editor, onDeleteBond, onBondClick]);

  const controlsEnabled = !isEditMode || editor?.activeTool === 'select' || editor?.activeTool === 'add_atom';
  const rotateEnabled = controlsEnabled && !editor?.isDragging;

  return (
    <>
      <Starfield />
      
      <ambientLight intensity={0.4} />
      <directionalLight position={[10, 10, 5]} intensity={1} castShadow />
      <directionalLight position={[-10, -5, -10]} intensity={0.5} color="#8B5CF6" />
      <pointLight position={[0, 10, 0]} intensity={0.6} color="#3B82F6" />
      <pointLight position={[0, -10, 0]} intensity={0.4} color="#06B6D4" />
      
      <group>
        {/* 透明交互平面，用于捕获鼠标事件 - 移到AutoRotatingGroup外部 */}
        <mesh
          onPointerMove={handlePointerMove}
          onClick={handleSceneClick}
        >
          <planeGeometry args={[200, 200]} />
          <meshBasicMaterial transparent opacity={0} />
        </mesh>

        <AutoRotatingGroup autoRotate={autoRotate && !isEditMode} molecule={molecule}>
          <Atoms
            atoms={atoms}
            displayMode={displayMode}
            showHydrogens={showHydrogens}
            selectedAtomId={selectedAtomId}
            onAtomClick={handleAtomClick}
            onAtomHover={setHoveredAtom}
            editor={editor}
            onAtomDrag={onAtomDrag}
            onBondStart={onBondStart}
            onAtomDelete={onDeleteAtom}
          />
          
          <Bonds
            bonds={bonds}
            atoms={atoms}
            displayMode={displayMode}
            showHydrogens={showHydrogens}
            editor={editor}
            onBondClick={handleBondClick}
            onBondHover={setHoveredBond}
            onBondDelete={onDeleteBond}
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

          {bondStartAtom && previewPosition && (
            <line>
              <bufferGeometry>
                <bufferAttribute
                  attach="attributes-position"
                  count={2}
                  array={new Float32Array([
                    bondStartAtom.x, bondStartAtom.y, bondStartAtom.z,
                    previewPosition.x, previewPosition.y, previewPosition.z,
                  ])}
                  itemSize={3}
                />
              </bufferGeometry>
              <lineBasicMaterial color="#A855F7" linewidth={3} />
            </line>
          )}
        </AutoRotatingGroup>

        {editor?.activeTool === 'add_atom' && previewPosition && (
          <mesh position={previewPosition.toArray() as [number, number, number]}>
            <sphereGeometry args={[0.3, 16, 16]} />
            <meshBasicMaterial 
              color={getAtomColor(editor.selectedElement)} 
              transparent 
              opacity={0.6} 
            />
          </mesh>
        )}
      </group>

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
        ref={controlsRef}
        enableDamping
        dampingFactor={0.05}
        minDistance={5}
        maxDistance={100}
        autoRotate={false}
        enablePan={rotateEnabled}
        enableZoom={true}
        enableRotate={rotateEnabled}
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
