import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Atom } from '../../types';
import { getAtomColor, getAtomRadius } from '../../utils/atomColors';

interface AtomsProps {
  atoms: Atom[];
  displayMode: 'ball_stick' | 'space_filling' | 'ribbon' | 'surface';
  showHydrogens: boolean;
  selectedAtomId: string | null;
  onAtomClick: (atomId: string) => void;
  onAtomHover: (atomId: string | null) => void;
}

export function Atoms({ atoms, displayMode, showHydrogens, selectedAtomId, onAtomClick, onAtomHover }: AtomsProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const hoveredRef = useRef<string | null>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const filteredAtoms = useMemo(() => {
    return showHydrogens ? atoms : atoms.filter(a => a.element !== 'H');
  }, [atoms, showHydrogens]);

  const atomData = useMemo(() => {
    return filteredAtoms.map(atom => {
      const baseScale = displayMode === 'space_filling' ? 1.2 : 0.5;
      const radius = getAtomRadius(atom.element) * baseScale;
      const color = new THREE.Color(getAtomColor(atom.element));
      const isSelected = atom.id === selectedAtomId;
      return {
        position: [atom.x, atom.y, atom.z] as [number, number, number],
        scale: isSelected ? radius * 1.3 : radius,
        color,
        isSelected,
        id: atom.id,
      };
    });
  }, [filteredAtoms, displayMode, selectedAtomId]);

  const positions = useMemo(() => {
    const pos: [number, number, number][] = [];
    const colors: [number, number, number][] = [];
    const scales: number[] = [];
    
    atomData.forEach(d => {
      pos.push(d.position);
      colors.push([d.color.r, d.color.g, d.color.b]);
      scales.push(d.scale);
    });
    
    return { pos, colors, scales };
  }, [atomData]);

  useEffect(() => {
    if (!meshRef.current) return;
    
    positions.pos.forEach((pos, i) => {
      dummy.position.set(pos[0], pos[1], pos[2]);
      dummy.scale.setScalar(positions.scales[i]);
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);
      meshRef.current!.setColorAt(i, new THREE.Color(positions.colors[i][0], positions.colors[i][1], positions.colors[i][2]));
    });
    
    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) {
      meshRef.current.instanceColor.needsUpdate = true;
    }
  }, [positions, dummy]);

  useFrame((state) => {
    if (!meshRef.current) return;
    
    const time = state.clock.elapsedTime;
    
    atomData.forEach((d, i) => {
      if (d.isSelected) {
        const pulse = 1 + Math.sin(time * 5) * 0.1;
        dummy.position.set(d.position[0], d.position[1], d.position[2]);
        dummy.scale.setScalar(d.scale * pulse);
        dummy.updateMatrix();
        meshRef.current!.setMatrixAt(i, dummy.matrix);
      }
    });
    
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  const handlePointerMove = (e: any) => {
    e.stopPropagation();
    const instanceId = e.instanceId;
    if (instanceId !== undefined && instanceId < atomData.length) {
      const atomId = atomData[instanceId].id;
      if (hoveredRef.current !== atomId) {
        hoveredRef.current = atomId;
        onAtomHover(atomId);
        document.body.style.cursor = 'pointer';
      }
    }
  };

  const handlePointerOut = () => {
    hoveredRef.current = null;
    onAtomHover(null);
    document.body.style.cursor = 'auto';
  };

  const handleClick = (e: any) => {
    e.stopPropagation();
    const instanceId = e.instanceId;
    if (instanceId !== undefined && instanceId < atomData.length) {
      onAtomClick(atomData[instanceId].id);
    }
  };

  if (atomData.length === 0) return null;

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, atomData.length]}
      onPointerMove={handlePointerMove}
      onPointerOut={handlePointerOut}
      onClick={handleClick}
    >
      <sphereGeometry args={[1, 32, 32]} />
      <meshStandardMaterial
        metalness={0.3}
        roughness={0.4}
        envMapIntensity={1}
      />
    </instancedMesh>
  );
}
