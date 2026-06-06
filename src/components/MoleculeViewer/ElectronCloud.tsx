import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Atom } from '../../types';

interface ElectronCloudProps {
  atoms: Atom[];
  displayMode: 'ball_stick' | 'space_filling' | 'ribbon' | 'surface';
  isVisible: boolean;
}

export function ElectronCloud({ atoms, displayMode, isVisible }: ElectronCloudProps) {
  const groupRef = useRef<THREE.Group>(null);
  const cloudRef = useRef<THREE.Points>(null);

  const cloudData = useMemo(() => {
    if (displayMode !== 'surface' || !isVisible) return null;

    const positions: number[] = [];
    const colors: number[] = [];
    const sizes: number[] = [];

    const gridSize = 15;
    const step = 0.8;

    for (let i = -gridSize; i < gridSize; i++) {
      for (let j = -gridSize; j < gridSize; j++) {
        for (let k = -gridSize; k < gridSize; k++) {
          const x = i * step;
          const y = j * step;
          const z = k * step;

          let density = 0;
          let totalCharge = 0;

          atoms.forEach(atom => {
            const dx = x - atom.x;
            const dy = y - atom.y;
            const dz = z - atom.z;
            const dist2 = dx * dx + dy * dy + dz * dz;
            const dist = Math.sqrt(dist2);
            
            const atomicNumber = getAtomicNumber(atom.element);
            const decay = Math.exp(-dist2 / (atomicNumber * 0.3));
            density += decay * atomicNumber * 0.1;
            totalCharge += (atom.charge || 0) * decay;
          });

          if (density > 0.05) {
            positions.push(x, y, z);
            
            const color = new THREE.Color();
            if (totalCharge > 0) {
              color.setHSL(0.6, 0.8, 0.5 + density * 0.3);
            } else if (totalCharge < 0) {
              color.setHSL(0, 0.8, 0.5 + density * 0.3);
            } else {
              color.setHSL(0.75, 0.6, 0.5 + density * 0.3);
            }
            colors.push(color.r, color.g, color.b);
            sizes.push(density * 0.5);
          }
        }
      }
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.Float32BufferAttribute(sizes, 1));

    return { geometry, count: positions.length / 3 };
  }, [atoms, displayMode, isVisible]);

  useFrame((state) => {
    if (cloudRef.current) {
      cloudRef.current.rotation.y += 0.0005;
      const time = state.clock.elapsedTime;
      const positions = cloudRef.current.geometry.attributes.position as THREE.BufferAttribute;
      const array = positions.array as Float32Array;
      
      for (let i = 0; i < array.length; i += 3) {
        const wave = Math.sin(time + array[i] * 0.5) * 0.02;
        array[i + 2] += wave * 0.1;
      }
      positions.needsUpdate = true;
    }
  });

  if (displayMode !== 'surface' || !cloudData || cloudData.count === 0) return null;

  return (
    <group ref={groupRef}>
      <points ref={cloudRef} geometry={cloudData.geometry}>
        <pointsMaterial
          size={0.3}
          vertexColors
          transparent
          opacity={0.6}
          sizeAttenuation
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>
    </group>
  );
}

function getAtomicNumber(element: string): number {
  const table: Record<string, number> = {
    H: 1, He: 2, Li: 3, Be: 4, B: 5, C: 6, N: 7, O: 8, F: 9, Ne: 10,
    Na: 11, Mg: 12, Al: 13, Si: 14, P: 15, S: 16, Cl: 17, Ar: 18,
    K: 19, Ca: 20, Ti: 22, V: 23, Cr: 24, Mn: 25, Fe: 26, Co: 27, Ni: 28,
    Cu: 29, Zn: 30, Ga: 31, Ge: 32, As: 33, Se: 34, Br: 35, Kr: 36,
    Ag: 47, Au: 79, Pt: 78, Pb: 82,
  };
  return table[element] || 6;
}
