import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Atom } from '../../types';
import { getResidueColor } from '../../utils/atomColors';

interface RibbonProps {
  atoms: Atom[];
  displayMode: 'ball_stick' | 'space_filling' | 'ribbon' | 'surface';
}

export function Ribbon({ atoms, displayMode }: RibbonProps) {
  const groupRef = useRef<THREE.Group>(null);
  const tubeRef = useRef<THREE.Mesh>(null);

  const residueGroups = useMemo(() => {
    const groups: Map<string, Atom[]> = new Map();
    const caAtoms: Atom[] = [];
    
    atoms.forEach(atom => {
      if (atom.residue && atom.residueIndex !== undefined) {
        const key = `${atom.chain || 'A'}-${atom.residueIndex}`;
        if (!groups.has(key)) {
          groups.set(key, []);
        }
        groups.get(key)!.push(atom);
        
        if (atom.element === 'C' && atom.x !== 0 || atom.y !== 0 || atom.z !== 0) {
          const isCA = atoms.some(a => 
            a.residueIndex === atom.residueIndex && 
            a.chain === atom.chain &&
            a.element === 'N'
          );
          if (isCA && !caAtoms.some(ca => ca.residueIndex === atom.residueIndex && ca.chain === atom.chain)) {
            caAtoms.push(atom);
          }
        }
      }
    });
    
    caAtoms.sort((a, b) => {
      const chainDiff = (a.chain || 'A').localeCompare(b.chain || 'A');
      if (chainDiff !== 0) return chainDiff;
      return (a.residueIndex || 0) - (b.residueIndex || 0);
    });
    
    return { groups, caAtoms };
  }, [atoms]);

  const tubeGeometry = useMemo(() => {
    if (residueGroups.caAtoms.length < 4) return null;
    
    const points = residueGroups.caAtoms.map(atom => 
      new THREE.Vector3(atom.x, atom.y, atom.z)
    );
    
    const curve = new THREE.CatmullRomCurve3(points);
    const geometry = new THREE.TubeGeometry(curve, points.length * 3, 0.3, 12, false);
    
    const colors: number[] = [];
    const colorAttribute = new THREE.BufferAttribute(new Float32Array(geometry.attributes.position.count * 3), 3);
    
    const positions = geometry.attributes.position;
    for (let i = 0; i < positions.count; i++) {
      const progress = i / positions.count;
      const residueIndex = Math.floor(progress * residueGroups.caAtoms.length);
      const atom = residueGroups.caAtoms[Math.min(residueIndex, residueGroups.caAtoms.length - 1)];
      const color = new THREE.Color(getResidueColor(atom.residue || 'ALA'));
      colorAttribute.setXYZ(i, color.r, color.g, color.b);
    }
    
    geometry.setAttribute('color', colorAttribute);
    
    return geometry;
  }, [residueGroups]);

  useFrame((state) => {
    if (groupRef.current && displayMode === 'ribbon') {
      groupRef.current.rotation.y += 0.001;
    }
  });

  if (displayMode !== 'ribbon') return null;
  if (!tubeGeometry) return null;

  return (
    <group ref={groupRef}>
      <mesh ref={tubeRef} geometry={tubeGeometry}>
        <meshStandardMaterial
          vertexColors
          metalness={0.1}
          roughness={0.6}
          side={THREE.DoubleSide}
        />
      </mesh>
      
      {residueGroups.caAtoms.map((atom, i) => (
        <mesh key={`ca-${i}`} position={[atom.x, atom.y, atom.z]}>
          <sphereGeometry args={[0.4, 16, 16]} />
          <meshStandardMaterial
            color={getResidueColor(atom.residue || 'ALA')}
            metalness={0.3}
            roughness={0.4}
          />
        </mesh>
      ))}
    </group>
  );
}
