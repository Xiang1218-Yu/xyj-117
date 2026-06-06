import { useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

interface StarfieldProps {
  count?: number;
  radius?: number;
}

export function Starfield({ count = 2000, radius = 100 }: StarfieldProps) {
  const starsRef = useRef<THREE.Points>(null);
  const nebulaRef = useRef<THREE.Points>(null);
  const { camera } = useThree();

  const starGeometry = useMemo(() => {
    const geometry = new THREE.BufferGeometry();
    const positions: number[] = [];
    const colors: number[] = [];
    const sizes: number[] = [];

    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = radius * (0.5 + Math.random() * 0.5);

      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.sin(phi) * Math.sin(theta);
      const z = r * Math.cos(phi);

      positions.push(x, y, z);

      const hue = 0.55 + Math.random() * 0.15;
      const color = new THREE.Color().setHSL(hue, 0.3 + Math.random() * 0.4, 0.6 + Math.random() * 0.4);
      colors.push(color.r, color.g, color.b);

      sizes.push(0.3 + Math.random() * 1.2);
    }

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.Float32BufferAttribute(sizes, 1));

    return geometry;
  }, [count, radius]);

  const nebulaGeometry = useMemo(() => {
    const geometry = new THREE.BufferGeometry();
    const positions: number[] = [];
    const colors: number[] = [];

    for (let i = 0; i < 200; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = radius * 0.3 + Math.random() * radius * 0.4;

      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.sin(phi) * Math.sin(theta) * 0.5;
      const z = r * Math.cos(phi);

      positions.push(x, y, z);

      const t = Math.random();
      let color: THREE.Color;
      if (t < 0.33) {
        color = new THREE.Color().setHSL(0.65, 0.8, 0.3);
      } else if (t < 0.66) {
        color = new THREE.Color().setHSL(0.8, 0.8, 0.25);
      } else {
        color = new THREE.Color().setHSL(0.55, 0.8, 0.3);
      }
      colors.push(color.r, color.g, color.b);
    }

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

    return geometry;
  }, [radius]);

  useFrame((state) => {
    if (starsRef.current) {
      starsRef.current.rotation.y += 0.0001;
      starsRef.current.rotation.x += 0.00005;
      
      const positions = starsRef.current.geometry.attributes.position as THREE.BufferAttribute;
      const array = positions.array as Float32Array;
      for (let i = 0; i < array.length; i += 3) {
        const twinkle = Math.sin(state.clock.elapsedTime * 2 + i) * 0.002;
        array[i] += twinkle;
        array[i + 1] += twinkle * 0.7;
      }
      positions.needsUpdate = true;
    }

    if (nebulaRef.current) {
      nebulaRef.current.rotation.y -= 0.0002;
    }
  });

  return (
    <group>
      <points ref={starsRef} geometry={starGeometry}>
        <pointsMaterial
          size={0.5}
          vertexColors
          transparent
          opacity={0.9}
          sizeAttenuation
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>
      
      <points ref={nebulaRef} geometry={nebulaGeometry}>
        <pointsMaterial
          size={15}
          vertexColors
          transparent
          opacity={0.15}
          sizeAttenuation
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>
    </group>
  );
}
