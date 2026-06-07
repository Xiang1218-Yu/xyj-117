import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ElectronTransfer, AnimationParticle } from '../../types';
import { getPointOnCurve, getElectronTransferPosition } from '../../utils/reactionMechanismEngine';

interface ElectronTransferArrowProps {
  transfer: ElectronTransfer & { progress: number; isActive: boolean };
  showFlow: boolean;
}

export function ElectronTransferArrow({ transfer, showFlow }: ElectronTransferArrowProps) {
  const arrowGroupRef = useRef<THREE.Group>(null);
  const tubeMeshRef = useRef<THREE.Mesh>(null);
  const particlesRef = useRef<THREE.Points>(null);
  const glowMeshRef = useRef<THREE.Mesh>(null);

  const { curveGeometry, arrowHeadGeometry, pathPoints } = useMemo(() => {
    if (transfer.curvePoints.length < 2) {
      return { curveGeometry: null, arrowHeadGeometry: null, pathPoints: [] };
    }

    const points: THREE.Vector3[] = [];
    const segments = 50;
    
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const pos = getPointOnCurve(transfer.curvePoints, t);
      points.push(new THREE.Vector3(pos.x, pos.y, pos.z));
    }

    const curve = new THREE.CatmullRomCurve3(points);
    const tubeGeometry = new THREE.TubeGeometry(curve, segments, 0.05, 8, false);
    
    const arrowHeadGeometry = new THREE.ConeGeometry(0.15, 0.4, 8);
    arrowHeadGeometry.translate(0, 0.2, 0);

    return { curveGeometry: tubeGeometry, arrowHeadGeometry, pathPoints: points };
  }, [transfer.curvePoints]);

  const particleData = useMemo(() => {
    const positions = new Float32Array(50 * 3);
    const colors = new Float32Array(50 * 3);
    const sizes = new Float32Array(50);

    const baseColor = new THREE.Color(transfer.color);

    for (let i = 0; i < 50; i++) {
      const offset = (i / 50 + Math.random() * 0.1) % 1;
      const t = (transfer.progress + offset) % 1;
      const pos = getElectronTransferPosition(transfer, t);
      
      positions[i * 3] = pos.x;
      positions[i * 3 + 1] = pos.y;
      positions[i * 3 + 2] = pos.z;

      const intensity = 0.5 + Math.sin(t * Math.PI) * 0.5;
      colors[i * 3] = baseColor.r * intensity;
      colors[i * 3 + 1] = baseColor.g * intensity;
      colors[i * 3 + 2] = baseColor.b * intensity;

      sizes[i] = 0.08 + Math.sin(t * Math.PI) * 0.05;
    }

    return { positions, colors, sizes };
  }, [transfer, transfer.progress]);

  useEffect(() => {
    if (particlesRef.current) {
      const posAttr = particlesRef.current.geometry.attributes.position as THREE.BufferAttribute;
      const colorAttr = particlesRef.current.geometry.attributes.color as THREE.BufferAttribute;
      const sizeAttr = particlesRef.current.geometry.attributes.size as THREE.BufferAttribute;

      posAttr.array = particleData.positions;
      colorAttr.array = particleData.colors;
      sizeAttr.array = particleData.sizes;

      posAttr.needsUpdate = true;
      colorAttr.needsUpdate = true;
      sizeAttr.needsUpdate = true;
    }
  }, [particleData]);

  useFrame((state) => {
    const time = state.clock.elapsedTime;
    
    if (arrowGroupRef.current) {
      const opacity = transfer.isActive ? 0.8 : 0.2;
      const pulse = 1 + Math.sin(time * 4) * 0.1;
      arrowGroupRef.current.scale.setScalar(pulse);
      
      if (tubeMeshRef.current) {
        const material = tubeMeshRef.current.material as THREE.MeshBasicMaterial;
        material.opacity = opacity * (transfer.isActive ? 1 : 0.3);
      }
      
      if (glowMeshRef.current) {
        const material = glowMeshRef.current.material as THREE.MeshBasicMaterial;
        material.opacity = opacity * 0.3 * (transfer.isActive ? 1 : 0.2);
      }
    }

    if (particlesRef.current && showFlow && transfer.isActive) {
      const geometry = particlesRef.current.geometry;
      const positions = geometry.attributes.position as THREE.BufferAttribute;
      
      for (let i = 0; i < 50; i++) {
        const offset = (i / 50 + time * 0.5) % 1;
        const t = (transfer.progress + offset) % 1;
        const pos = getElectronTransferPosition(transfer, t);
        
        positions.array[i * 3] = pos.x;
        positions.array[i * 3 + 1] = pos.y;
        positions.array[i * 3 + 2] = pos.z;
      }
      positions.needsUpdate = true;
    }
  });

  if (!curveGeometry || !arrowHeadGeometry || transfer.curvePoints.length < 2) {
    return null;
  }

  const arrowColor = new THREE.Color(transfer.color);
  const endPoint = pathPoints[pathPoints.length - 1];
  const prevPoint = pathPoints[pathPoints.length - 2];
  const arrowDirection = endPoint?.clone().sub(prevPoint || endPoint).normalize() || new THREE.Vector3(0, 1, 0);

  return (
    <group ref={arrowGroupRef}>
      <mesh ref={tubeMeshRef} geometry={curveGeometry}>
        <meshBasicMaterial
          color={arrowColor}
          transparent
          opacity={transfer.isActive ? 0.8 : 0.2}
          side={THREE.DoubleSide}
        />
      </mesh>

      <mesh ref={glowMeshRef} geometry={curveGeometry.clone()}>
        <meshBasicMaterial
          color={arrowColor}
          transparent
          opacity={0.3}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      <mesh
        position={endPoint?.toArray() as [number, number, number]}
        quaternion={new THREE.Quaternion().setFromUnitVectors(
          new THREE.Vector3(0, 1, 0),
          arrowDirection
        )}
        geometry={arrowHeadGeometry}
      >
        <meshBasicMaterial
          color={arrowColor}
          transparent
          opacity={transfer.isActive ? 1 : 0.3}
        />
      </mesh>

      {showFlow && transfer.isActive && (
        <points ref={particlesRef}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={50}
              array={particleData.positions}
              itemSize={3}
            />
            <bufferAttribute
              attach="attributes-color"
              count={50}
              array={particleData.colors}
              itemSize={3}
            />
            <bufferAttribute
              attach="attributes-size"
              count={50}
              array={particleData.sizes}
              itemSize={1}
            />
          </bufferGeometry>
          <pointsMaterial
            vertexColors
            transparent
            opacity={0.9}
            size={0.12}
            sizeAttenuation
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </points>
      )}
    </group>
  );
}

interface ElectronFlowParticlesProps {
  particles: AnimationParticle[];
  showTrails?: boolean;
}

export function ElectronFlowParticles({ particles, showTrails = true }: ElectronFlowParticlesProps) {
  const pointsRef = useRef<THREE.Points>(null);
  const trailsRef = useRef<THREE.LineSegments>(null);

  const particleData = useMemo(() => {
    const positions = new Float32Array(particles.length * 3);
    const colors = new Float32Array(particles.length * 3);
    const sizes = new Float32Array(particles.length);

    particles.forEach((p, i) => {
      positions[i * 3] = p.position.x;
      positions[i * 3 + 1] = p.position.y;
      positions[i * 3 + 2] = p.position.z;

      const color = new THREE.Color(p.color);
      const lifeIntensity = Math.sin(p.life * Math.PI);
      colors[i * 3] = color.r * lifeIntensity;
      colors[i * 3 + 1] = color.g * lifeIntensity;
      colors[i * 3 + 2] = color.b * lifeIntensity;

      sizes[i] = p.size * (0.5 + lifeIntensity * 0.5);
    });

    return { positions, colors, sizes };
  }, [particles]);

  const trailData = useMemo(() => {
    if (!showTrails) return { positions: new Float32Array(), colors: new Float32Array() };

    let totalTrailPoints = 0;
    particles.forEach(p => {
      totalTrailPoints += Math.max(0, p.trail.length - 1) * 2;
    });

    const positions = new Float32Array(totalTrailPoints * 3);
    const colors = new Float32Array(totalTrailPoints * 3);
    let idx = 0;

    particles.forEach(p => {
      const color = new THREE.Color(p.color);
      for (let i = 0; i < p.trail.length - 1; i++) {
        const t = i / p.trail.length;
        const alpha = (1 - t) * Math.sin(p.life * Math.PI);

        positions[idx * 3] = p.trail[i].x;
        positions[idx * 3 + 1] = p.trail[i].y;
        positions[idx * 3 + 2] = p.trail[i].z;
        colors[idx * 3] = color.r * alpha;
        colors[idx * 3 + 1] = color.g * alpha;
        colors[idx * 3 + 2] = color.b * alpha;
        idx++;

        positions[idx * 3] = p.trail[i + 1].x;
        positions[idx * 3 + 1] = p.trail[i + 1].y;
        positions[idx * 3 + 2] = p.trail[i + 1].z;
        colors[idx * 3] = color.r * alpha * 0.8;
        colors[idx * 3 + 1] = color.g * alpha * 0.8;
        colors[idx * 3 + 2] = color.b * alpha * 0.8;
        idx++;
      }
    });

    return { positions, colors };
  }, [particles, showTrails]);

  useFrame(() => {
    if (pointsRef.current) {
      const posAttr = pointsRef.current.geometry.attributes.position as THREE.BufferAttribute;
      const colorAttr = pointsRef.current.geometry.attributes.color as THREE.BufferAttribute;
      const sizeAttr = pointsRef.current.geometry.attributes.size as THREE.BufferAttribute;

      if (posAttr.array.length !== particleData.positions.length) {
        pointsRef.current.geometry.dispose();
        pointsRef.current.geometry = new THREE.BufferGeometry();
        pointsRef.current.geometry.setAttribute('position', new THREE.BufferAttribute(particleData.positions, 3));
        pointsRef.current.geometry.setAttribute('color', new THREE.BufferAttribute(particleData.colors, 3));
        pointsRef.current.geometry.setAttribute('size', new THREE.BufferAttribute(particleData.sizes, 1));
      } else {
        posAttr.array = particleData.positions;
        colorAttr.array = particleData.colors;
        sizeAttr.array = particleData.sizes;
        posAttr.needsUpdate = true;
        colorAttr.needsUpdate = true;
        sizeAttr.needsUpdate = true;
      }
    }

    if (trailsRef.current && showTrails) {
      const posAttr = trailsRef.current.geometry.attributes.position as THREE.BufferAttribute;
      const colorAttr = trailsRef.current.geometry.attributes.color as THREE.BufferAttribute;

      if (posAttr.array.length !== trailData.positions.length) {
        trailsRef.current.geometry.dispose();
        trailsRef.current.geometry = new THREE.BufferGeometry();
        trailsRef.current.geometry.setAttribute('position', new THREE.BufferAttribute(trailData.positions, 3));
        trailsRef.current.geometry.setAttribute('color', new THREE.BufferAttribute(trailData.colors, 3));
      } else {
        posAttr.array = trailData.positions;
        colorAttr.array = trailData.colors;
        posAttr.needsUpdate = true;
        colorAttr.needsUpdate = true;
      }
    }
  });

  if (particles.length === 0) return null;

  return (
    <group>
      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={particleData.positions.length / 3}
            array={particleData.positions}
            itemSize={3}
          />
          <bufferAttribute
            attach="attributes-color"
            count={particleData.colors.length / 3}
            array={particleData.colors}
            itemSize={3}
          />
          <bufferAttribute
            attach="attributes-size"
            count={particleData.sizes.length}
            array={particleData.sizes}
            itemSize={1}
          />
        </bufferGeometry>
        <pointsMaterial
          vertexColors
          transparent
          opacity={0.95}
          size={0.15}
          sizeAttenuation
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>

      {showTrails && trailData.positions.length > 0 && (
        <lineSegments ref={trailsRef}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={trailData.positions.length / 3}
              array={trailData.positions}
              itemSize={3}
            />
            <bufferAttribute
              attach="attributes-color"
              count={trailData.colors.length / 3}
              array={trailData.colors}
              itemSize={3}
            />
          </bufferGeometry>
          <lineBasicMaterial
            vertexColors
            transparent
            opacity={0.6}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </lineSegments>
      )}
    </group>
  );
}
