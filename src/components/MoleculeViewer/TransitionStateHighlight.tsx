import { useRef, useMemo, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ReactionKeyframe } from '../../types';

interface TransitionStateHighlightProps {
  keyframes: ReactionKeyframe[];
  currentTime: number;
  atoms: Map<string, { x: number; y: number; z: number }>;
  showTransitionStates: boolean;
}

export function TransitionStateHighlight({ keyframes, currentTime, atoms, showTransitionStates }: TransitionStateHighlightProps) {
  const groupRef = useRef<THREE.Group>(null);
  const outlineRef = useRef<THREE.InstancedMesh>(null);
  const indicatorRef = useRef<THREE.Mesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const timeRef = useRef(0);
  const [indicatorOpacity, setIndicatorOpacity] = useState(0.8);

  const transitionStateAtoms = useMemo(() => {
    const threshold = 3;
    const activeAtoms = new Set<string>();
    
    keyframes.forEach(kf => {
      if (kf.type === 'transition_state' && Math.abs(kf.time - currentTime) < threshold) {
        kf.atoms.forEach(atom => activeAtoms.add(atom.id));
      }
    });

    return Array.from(activeAtoms).map(atomId => {
      const pos = atoms.get(atomId);
      return pos ? { id: atomId, position: pos } : null;
    }).filter(Boolean) as { id: string; position: { x: number; y: number; z: number } }[];
  }, [keyframes, currentTime, atoms]);

  const isAtTransitionState = useMemo(() => {
    return keyframes.some(
      kf => kf.type === 'transition_state' && Math.abs(kf.time - currentTime) < 5
    );
  }, [keyframes, currentTime]);

  useFrame((state) => {
    timeRef.current = state.clock.elapsedTime;
    const time = timeRef.current;

    if (outlineRef.current && transitionStateAtoms.length > 0) {
      transitionStateAtoms.forEach((data, i) => {
        const pulse = 1 + Math.sin(time * 4 + i) * 0.2;
        dummy.position.set(data.position.x, data.position.y, data.position.z);
        dummy.scale.setScalar(1.8 * pulse);
        dummy.updateMatrix();
        outlineRef.current!.setMatrixAt(i, dummy.matrix);
        
        const color = new THREE.Color('#F59E0B');
        const opacity = 0.4 + Math.sin(time * 3 + i * 0.5) * 0.2;
        outlineRef.current!.setColorAt(i, color.clone().multiplyScalar(opacity * 2));
      });

      outlineRef.current.instanceMatrix.needsUpdate = true;
      if (outlineRef.current.instanceColor) {
        outlineRef.current.instanceColor.needsUpdate = true;
      }
    }

    if (indicatorRef.current && isAtTransitionState) {
      const material = indicatorRef.current.material as THREE.MeshBasicMaterial;
      material.opacity = 0.8 + Math.sin(time * 3) * 0.2;
    }

    if (isAtTransitionState) {
      setIndicatorOpacity(0.8 + Math.sin(time * 3) * 0.2);
    }
  });

  useEffect(() => {
    return () => {
      if (outlineRef.current) {
        outlineRef.current.geometry.dispose();
        if (Array.isArray(outlineRef.current.material)) {
          outlineRef.current.material.forEach(m => m.dispose());
        } else {
          outlineRef.current.material.dispose();
        }
      }
      if (indicatorRef.current) {
        indicatorRef.current.geometry.dispose();
        if (Array.isArray(indicatorRef.current.material)) {
          indicatorRef.current.material.forEach(m => m.dispose());
        } else {
          indicatorRef.current.material.dispose();
        }
      }
    };
  }, []);

  if (!showTransitionStates || transitionStateAtoms.length === 0) return null;

  return (
    <group ref={groupRef}>
      <instancedMesh
        ref={outlineRef}
        args={[undefined, undefined, Math.max(1, transitionStateAtoms.length)]}
      >
        <sphereGeometry args={[1, 16, 16]} />
        <meshBasicMaterial
          color="#F59E0B"
          transparent
          opacity={0.5}
          wireframe
        />
      </instancedMesh>

      {isAtTransitionState && (
        <mesh ref={indicatorRef} position={[0, 3, 0]}>
          <ringGeometry args={[0.8, 1.2, 32]} />
          <meshBasicMaterial
            color="#F59E0B"
            transparent
            opacity={indicatorOpacity}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}
    </group>
  );
}
