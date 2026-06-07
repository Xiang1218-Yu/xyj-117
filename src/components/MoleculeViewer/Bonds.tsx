import { useRef, useMemo, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Atom, Bond, EditorState, DisplayMode, BallStickConfig, LineConfig, StickConfig } from '../../types';
import { getAtomColor } from '../../utils/atomColors';

interface BondsProps {
  bonds: Bond[];
  atoms: Atom[];
  displayMode: DisplayMode;
  showHydrogens: boolean;
  editor?: EditorState;
  onBondClick?: (bondId: string) => void;
  onBondHover?: (bondId: string | null) => void;
  onBondDelete?: (bondId: string) => void;
  config?: {
    ball_stick?: Partial<BallStickConfig>;
    line?: Partial<LineConfig>;
    stick?: Partial<StickConfig>;
  };
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
  config,
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
        
        let bondRadius = 0.15;
        let metalness = 0.2;
        let roughness = 0.5;
        
        switch (displayMode) {
          case 'ball_stick':
            bondRadius = config?.ball_stick?.bondRadius ?? 0.15;
            metalness = config?.ball_stick?.bondMetalness ?? 0.2;
            roughness = config?.ball_stick?.bondRoughness ?? 0.5;
            break;
          case 'stick':
            bondRadius = config?.stick?.stickRadius ?? 0.2;
            metalness = config?.stick?.metalness ?? 0.3;
            roughness = config?.stick?.roughness ?? 0.4;
            break;
          case 'line':
            bondRadius = 0.02;
            break;
          case 'space_filling':
          case 'ribbon':
          case 'surface':
          case 'point_cloud':
            bondRadius = 0;
            break;
          default:
            bondRadius = 0.15;
        }
        
        const lineConfig = config?.line;
        if (displayMode === 'line' && lineConfig?.colorBy === 'uniform') {
          color1 = new THREE.Color(lineConfig.uniformColor ?? '#ffffff');
          color2 = new THREE.Color(lineConfig.uniformColor ?? '#ffffff');
        }
        
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
          metalness,
          roughness,
        };
      });
  }, [bonds, atomMap, displayMode, showHydrogens, editor, hoveredBondRef.current, config]);

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

  if (displayMode === 'space_filling' || displayMode === 'ribbon' || displayMode === 'surface' || displayMode === 'point_cloud') {
    return null;
  }

  const visibleBonds = bondData.filter(d => d.bondRadius > 0);
  if (visibleBonds.length === 0) return null;

  const linePositions = useMemo(() => {
    const positions = new Float32Array(bondData.length * 6);
    const colors = new Float32Array(bondData.length * 6);
    
    bondData.forEach((d, i) => {
      const baseIndex = i * 6;
      positions[baseIndex] = d.start.x;
      positions[baseIndex + 1] = d.start.y;
      positions[baseIndex + 2] = d.start.z;
      positions[baseIndex + 3] = d.end.x;
      positions[baseIndex + 4] = d.end.y;
      positions[baseIndex + 5] = d.end.z;
      
      colors[baseIndex] = d.color1.r;
      colors[baseIndex + 1] = d.color1.g;
      colors[baseIndex + 2] = d.color1.b;
      colors[baseIndex + 3] = d.color2.r;
      colors[baseIndex + 4] = d.color2.g;
      colors[baseIndex + 5] = d.color2.b;
    });
    
    return { positions, colors };
  }, [bondData]);

  if (displayMode === 'line') {
    const lineConfig = config?.line;
    return (
      <>
        <lineSegments
          onPointerMove={handlePointerMove}
          onPointerOut={handlePointerOut}
          onClick={handleClick}
        >
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={bondData.length * 2}
              array={linePositions.positions}
              itemSize={3}
            />
            <bufferAttribute
              attach="attributes-color"
              count={bondData.length * 2}
              array={linePositions.colors}
              itemSize={3}
            />
          </bufferGeometry>
          <lineBasicMaterial
            vertexColors
            linewidth={lineConfig?.lineWidth ?? 2}
            transparent
            opacity={0.9}
          />
        </lineSegments>
      </>
    );
  }

  const instanceCount = bondData.length * 2;
  const materialMetalness = bondData[0]?.metalness ?? 0.2;
  const materialRoughness = bondData[0]?.roughness ?? 0.5;

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
        metalness={materialMetalness}
        roughness={materialRoughness}
      />
    </instancedMesh>
  );
}
