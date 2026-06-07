import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { BondChange } from '../../types';

interface BondChangeAnimatorProps {
  bondChanges: (BondChange & { progress: number; currentOrder: number; isActive: boolean })[];
  atoms: Map<string, { x: number; y: number; z: number }>;
  showBondChanges: boolean;
}

export function BondChangeAnimator({ bondChanges, atoms, showBondChanges }: BondChangeAnimatorProps) {
  const groupRef = useRef<THREE.Group>(null);
  const glowGroupRef = useRef<THREE.Group>(null);
  const timeRef = useRef(0);
  const geometriesRef = useRef<THREE.BufferGeometry[]>([]);
  const materialsRef = useRef<THREE.Material[]>([]);

  const bondChangeData = useMemo(() => {
    return bondChanges.map(change => {
      const atom1 = atoms.get(change.atom1);
      const atom2 = atoms.get(change.atom2);
      
      if (!atom1 || !atom2) return null;

      const start = new THREE.Vector3(atom1.x, atom1.y, atom1.z);
      const end = new THREE.Vector3(atom2.x, atom2.y, atom2.z);
      const mid = start.clone().add(end).multiplyScalar(0.5);
      const direction = end.clone().sub(start).normalize();
      const length = start.distanceTo(end);

      let color: THREE.Color;
      let opacity: number;
      let dashSize: number;
      let gapSize: number;

      if (change.type === 'break') {
        const breakProgress = change.progress;
        color = new THREE.Color('#EF4444');
        opacity = 1 - breakProgress * 0.7;
        dashSize = 0.1 + breakProgress * 0.3;
        gapSize = 0.1 + breakProgress * 0.2;
      } else if (change.type === 'form') {
        const formProgress = change.progress;
        color = new THREE.Color('#22C55E');
        opacity = 0.3 + formProgress * 0.7;
        dashSize = 0.3 - formProgress * 0.2;
        gapSize = 0.2 - formProgress * 0.15;
      } else {
        color = new THREE.Color('#F59E0B');
        opacity = 0.8;
        dashSize = 0.2;
        gapSize = 0.1;
      }

      const quaternion = new THREE.Quaternion();
      quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction);

      return {
        id: change.id,
        type: change.type,
        start,
        end,
        mid,
        direction,
        length,
        color,
        opacity,
        dashSize,
        gapSize,
        quaternion,
        progress: change.progress,
        isActive: change.isActive,
        currentOrder: change.currentOrder,
        isTransitionState: change.isTransitionState,
      };
    }).filter(Boolean) as {
      id: string;
      type: string;
      start: THREE.Vector3;
      end: THREE.Vector3;
      mid: THREE.Vector3;
      direction: THREE.Vector3;
      length: number;
      color: THREE.Color;
      opacity: number;
      dashSize: number;
      gapSize: number;
      quaternion: THREE.Quaternion;
      progress: number;
      isActive: boolean;
      currentOrder: number;
      isTransitionState?: boolean;
    }[];
  }, [bondChanges, atoms]);

  useFrame((state) => {
    timeRef.current = state.clock.elapsedTime;
    const time = timeRef.current;
    
    if (groupRef.current) {
      groupRef.current.children.forEach((child, i) => {
        const data = bondChangeData[i];
        if (!data || !data.isActive) return;

        if (data.type === 'break') {
          const pulse = 1 + Math.sin(time * 8) * 0.15;
          child.scale.setScalar(pulse);
        } else if (data.type === 'form') {
          const pulse = 1 + Math.sin(time * 6 + i) * 0.1;
          child.scale.setScalar(pulse);
        }
      });
    }

    if (glowGroupRef.current) {
      glowGroupRef.current.children.forEach((child, i) => {
        const data = bondChangeData[i];
        if (!data || !data.isActive) return;

        const glowMesh = child.children[0] as THREE.Mesh;
        if (glowMesh && glowMesh.material) {
          const material = glowMesh.material as THREE.MeshBasicMaterial;
          material.opacity = 0.6 + Math.sin(time * 6 + i * 0.5) * 0.3;
        }
      });
    }
  });

  useEffect(() => {
    geometriesRef.current.forEach(geo => geo.dispose());
    materialsRef.current.forEach(mat => mat.dispose());
    geometriesRef.current = [];
    materialsRef.current = [];
  }, [bondChangeData]);

  useEffect(() => {
    return () => {
      geometriesRef.current.forEach(geo => geo.dispose());
      materialsRef.current.forEach(mat => mat.dispose());
      geometriesRef.current = [];
      materialsRef.current = [];
    };
  }, []);

  if (!showBondChanges || bondChangeData.length === 0) return null;

  return (
    <group>
      <group ref={groupRef}>
        {bondChangeData.map((data) => {
          const points = [data.start, data.end];
          const geometry = new THREE.BufferGeometry().setFromPoints(points);
          geometriesRef.current.push(geometry);

          const material = new THREE.LineDashedMaterial({
            color: data.color,
            transparent: true,
            opacity: data.opacity,
            dashSize: data.dashSize,
            gapSize: data.gapSize,
          });
          materialsRef.current.push(material);

          return (
            <lineSegments
              key={data.id}
              position={[0, 0, 0]}
              geometry={geometry}
              material={material}
            />
          );
        })}
      </group>

      <group ref={glowGroupRef}>
        {bondChangeData.map(data => (
          <group key={`glow-${data.id}`}>
            {data.isActive && (
              <mesh position={data.mid.toArray() as [number, number, number]}>
                <sphereGeometry args={[0.12, 16, 16]} />
                <meshBasicMaterial
                  color={data.color}
                  transparent
                  opacity={0.6}
                />
              </mesh>
            )}
          </group>
        ))}
      </group>
    </group>
  );
}
