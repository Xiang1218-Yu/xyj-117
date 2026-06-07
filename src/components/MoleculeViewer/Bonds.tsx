import { useRef, useMemo, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Atom, Bond, EditorState } from '../../types';
import { getAtomColor } from '../../utils/atomColors';

interface BondsProps {
  bonds: Bond[];
  atoms: Atom[];
  displayMode: 'ball_stick' | 'space_filling' | 'ribbon' | 'surface';
  showHydrogens: boolean;
  editor?: EditorState;
  onBondClick?: (bondId: string) => void;
  onBondHover?: (bondId: string | null) => void;
  onBondDelete?: (bondId: string) => void;
}

export function Bonds({ 
  bonds, 
  atoms, 
  displayMode, 
  showHydrogens,
  editor,
  onBondClick,
  onBondHover,
  onBondDelete,
}: BondsProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const cylinderRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const cylinderDummy = useMemo(() => new THREE.Object3D(), []);
  const atomMap = useMemo(() => new Map(atoms.map(a => [a.id, a])), [atoms]);
  const hoveredBondRef = useRef<string | null>(null);

  const bondData = useMemo(() => {
    return bonds
      .filter(bond => {
        const a1 = atomMap.get(bond.atom1);
        const a2 = atomMap.get(bond.atom2);
        if (!a1 || !a2) return false;
        if (!showHydrogens && (a1.element === 'H' || a2.element === 'H')) return false;
        return true;
      })
      .map(bond => {
        const a1 = atomMap.get(bond.atom1)!;
        const a2 = atomMap.get(bond.atom2)!;
        
        const start = new THREE.Vector3(a1.x, a1.y, a1.z);
        const end = new THREE.Vector3(a2.x, a2.y, a2.z);
        const mid = start.clone().add(end).multiplyScalar(0.5);
        
        const direction = end.clone().sub(start).normalize();
        const length = start.distanceTo(end);
        
        let color1 = new THREE.Color(getAtomColor(a1.element));
        let color2 = new THREE.Color(getAtomColor(a2.element));
        
        let bondRadius = displayMode === 'space_filling' ? 0.1 : 0.15;
        
        const isSelected = editor?.selectedBondId === bond.id;
        const isHovered = hoveredBondRef.current === bond.id;
        
        if (isSelected) {
          color1 = new THREE.Color('#A855F7');
          color2 = new THREE.Color('#A855F7');
          bondRadius *= 1.5;
        } else if (isHovered && editor?.mode === 'edit') {
          if (editor?.activeTool === 'delete' || editor?.activeTool === 'erase_bond') {
            color1 = new THREE.Color('#EF4444');
            color2 = new THREE.Color('#EF4444');
            bondRadius *= 1.3;
          } else if (editor?.activeTool === 'select') {
            color1 = new THREE.Color('#22D3EE');
            color2 = new THREE.Color('#22D3EE');
            bondRadius *= 1.2;
          }
        }
        
        const quaternion = new THREE.Quaternion();
        quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction);
        
        const halfLength = length / 2;
        const order = bond.order === 'aromatic' ? 1.5 : bond.order;
        
        return {
          start,
          end,
          mid,
          direction,
          length,
          halfLength,
          bondRadius,
          color1,
          color2,
          order,
          quaternion,
          bondId: bond.id,
          isSelected,
          isHovered,
        };
      });
  }, [bonds, atomMap, displayMode, showHydrogens, editor, hoveredBondRef.current]);

  useEffect(() => {
    if (!meshRef.current || !cylinderRef.current) return;

    bondData.forEach((data, i) => {
      const baseIndex = i * 2;
      
      dummy.position.copy(data.start).add(data.direction.clone().multiplyScalar(data.halfLength / 2));
      dummy.quaternion.copy(data.quaternion);
      dummy.scale.set(data.bondRadius, data.halfLength, data.bondRadius);
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(baseIndex, dummy.matrix);
      meshRef.current!.setColorAt(baseIndex, data.color1);

      cylinderDummy.position.copy(data.mid).add(data.direction.clone().multiplyScalar(data.halfLength / 2));
      cylinderDummy.quaternion.copy(data.quaternion);
      cylinderDummy.scale.set(data.bondRadius, data.halfLength, data.bondRadius);
      cylinderDummy.updateMatrix();
      meshRef.current!.setMatrixAt(baseIndex + 1, cylinderDummy.matrix);
      meshRef.current!.setColorAt(baseIndex + 1, data.color2);
    });

    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) {
      meshRef.current.instanceColor.needsUpdate = true;
    }
  }, [bondData, dummy, cylinderDummy]);

  useFrame(() => {
    if (!meshRef.current) return;
  });

  const handlePointerMove = (e: any) => {
    if (!editor || editor.mode !== 'edit') return;
    e.stopPropagation();
    
    const instanceId = e.instanceId;
    if (instanceId !== undefined) {
      const bondIndex = Math.floor(instanceId / 2);
      if (bondIndex < bondData.length) {
        const bondId = bondData[bondIndex].bondId;
        if (hoveredBondRef.current !== bondId) {
          hoveredBondRef.current = bondId;
          onBondHover?.(bondId);
          
          if (editor.activeTool === 'delete' || editor.activeTool === 'erase_bond') {
            document.body.style.cursor = 'not-allowed';
          } else if (editor.activeTool === 'select') {
            document.body.style.cursor = 'pointer';
          }
        }
      }
    }
  };

  const handlePointerOut = () => {
    if (hoveredBondRef.current) {
      hoveredBondRef.current = null;
      onBondHover?.(null);
      document.body.style.cursor = 'auto';
    }
  };

  const handleClick = (e: any) => {
    if (!editor || editor.mode !== 'edit') return;
    e.stopPropagation();
    
    const instanceId = e.instanceId;
    if (instanceId !== undefined) {
      const bondIndex = Math.floor(instanceId / 2);
      if (bondIndex < bondData.length) {
        const bondId = bondData[bondIndex].bondId;
        
        if (editor.activeTool === 'delete' || editor.activeTool === 'erase_bond') {
          onBondDelete?.(bondId);
        } else if (editor.activeTool === 'select') {
          onBondClick?.(bondId);
        }
      }
    }
  };

  if (displayMode === 'space_filling' || displayMode === 'ribbon' || displayMode === 'surface') {
    return null;
  }

  const instanceCount = bondData.length * 2;
  if (instanceCount === 0) return null;

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, instanceCount]}
      onPointerMove={handlePointerMove}
      onPointerOut={handlePointerOut}
      onClick={handleClick}
    >
      <cylinderGeometry args={[1, 1, 1, 8]} />
      <meshStandardMaterial
        metalness={0.2}
        roughness={0.5}
      />
    </instancedMesh>
  );
}
