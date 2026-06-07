import { useRef, useMemo, useEffect, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import { Atom, EditorState } from '../../types';
import { getAtomColor, getAtomRadius } from '../../utils/atomColors';

interface AtomsProps {
  atoms: Atom[];
  displayMode: 'ball_stick' | 'space_filling' | 'ribbon' | 'surface';
  showHydrogens: boolean;
  selectedAtomId: string | null;
  onAtomClick: (atomId: string) => void;
  onAtomHover: (atomId: string | null) => void;
  editor?: EditorState;
  onAtomDrag?: (atomId: string, x: number, y: number, z: number) => void;
  onBondStart?: (atomId: string) => void;
  onAtomDelete?: (atomId: string) => void;
}

export function Atoms({ 
  atoms, 
  displayMode, 
  showHydrogens, 
  selectedAtomId, 
  onAtomClick, 
  onAtomHover,
  editor,
  onAtomDrag,
  onBondStart,
  onAtomDelete,
}: AtomsProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const hoveredRef = useRef<string | null>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const { camera, raycaster, pointer } = useThree();
  const [isDragging, setIsDragging] = useState(false);
  const dragPlane = useRef(new THREE.Plane());
  const dragOffset = useRef(new THREE.Vector3());
  const dragAtomRef = useRef<string | null>(null);

  const filteredAtoms = useMemo(() => {
    return showHydrogens ? atoms : atoms.filter(a => a.element !== 'H');
  }, [atoms, showHydrogens]);

  const atomData = useMemo(() => {
    return filteredAtoms.map(atom => {
      const baseScale = displayMode === 'space_filling' ? 1.2 : 0.5;
      const radius = getAtomRadius(atom.element) * baseScale;
      const color = new THREE.Color(getAtomColor(atom.element));
      const isSelected = atom.id === selectedAtomId;
      const isBondStart = editor?.bondStartAtomId === atom.id;
      const isDragTarget = editor?.dragAtomId === atom.id;
      
      let finalColor = color;
      let finalScale = radius;
      
      if (isSelected) {
        finalScale = radius * 1.4;
      } else if (isBondStart) {
        finalScale = radius * 1.3;
        finalColor = new THREE.Color('#A855F7');
      } else if (isDragTarget) {
        finalScale = radius * 1.25;
      }
      
      if (editor?.activeTool === 'delete' && hoveredRef.current === atom.id) {
        finalColor = new THREE.Color('#EF4444');
      } else if (editor?.activeTool === 'bond' && hoveredRef.current === atom.id && isBondStart) {
        finalColor = new THREE.Color('#22D3EE');
      } else if (editor?.activeTool === 'bond' && editor?.bondStartAtomId && !isBondStart && hoveredRef.current === atom.id) {
        finalColor = new THREE.Color('#34D399');
      }
      
      return {
        position: [atom.x, atom.y, atom.z] as [number, number, number],
        scale: finalScale,
        color: finalColor,
        isSelected,
        isBondStart,
        isDragTarget,
        id: atom.id,
      };
    });
  }, [filteredAtoms, displayMode, selectedAtomId, editor, hoveredRef.current]);

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

  const handlePointerDown = (e: any) => {
    e.stopPropagation();
    const instanceId = e.instanceId;
    if (instanceId === undefined || instanceId >= atomData.length) return;
    
    const atomId = atomData[instanceId].id;
    const atom = filteredAtoms.find(a => a.id === atomId);
    
    if (editor?.activeTool === 'drag' && atom) {
      e.stopPropagation();
      setIsDragging(true);
      dragAtomRef.current = atomId;
      
      const worldPosition = new THREE.Vector3(atom.x, atom.y, atom.z);
      dragPlane.current.setFromNormalAndCoplanarPoint(
        new THREE.Vector3(0, 0, 1).applyQuaternion(camera.quaternion),
        worldPosition
      );
      
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(pointer, camera);
      const intersection = new THREE.Vector3();
      raycaster.ray.intersectPlane(dragPlane.current, intersection);
      
      if (intersection) {
        dragOffset.current.copy(worldPosition).sub(intersection);
      }
      
      document.body.style.cursor = 'grabbing';
    }
  };

  const handlePointerMove = (e: any) => {
    e.stopPropagation();
    
    if (isDragging && dragAtomRef.current && onAtomDrag) {
      e.stopPropagation();
      
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(pointer, camera);
      const intersection = new THREE.Vector3();
      raycaster.ray.intersectPlane(dragPlane.current, intersection);
      
      if (intersection) {
        const newPos = intersection.clone().add(dragOffset.current);
        onAtomDrag(dragAtomRef.current, newPos.x, newPos.y, newPos.z);
      }
      return;
    }
    
    const instanceId = e.instanceId;
    if (instanceId !== undefined && instanceId < atomData.length) {
      const atomId = atomData[instanceId].id;
      if (hoveredRef.current !== atomId) {
        hoveredRef.current = atomId;
        onAtomHover(atomId);
        
        if (editor?.activeTool === 'delete') {
          document.body.style.cursor = 'not-allowed';
        } else if (editor?.activeTool === 'bond') {
          document.body.style.cursor = 'copy';
        } else if (editor?.activeTool === 'drag') {
          document.body.style.cursor = 'grab';
        } else {
          document.body.style.cursor = 'pointer';
        }
      }
    }
  };

  const handlePointerUp = (e: any) => {
    if (isDragging) {
      e.stopPropagation();
      setIsDragging(false);
      dragAtomRef.current = null;
      document.body.style.cursor = 'auto';
    }
  };

  const handlePointerOut = () => {
    if (!isDragging) {
      hoveredRef.current = null;
      onAtomHover(null);
      document.body.style.cursor = 'auto';
    }
  };

  const handleClick = (e: any) => {
    if (isDragging) {
      e.stopPropagation();
      return;
    }
    
    e.stopPropagation();
    const instanceId = e.instanceId;
    if (instanceId === undefined || instanceId >= atomData.length) return;
    
    const atomId = atomData[instanceId].id;
    
    if (editor?.mode === 'edit') {
      switch (editor.activeTool) {
        case 'delete':
          if (onAtomDelete) {
            onAtomDelete(atomId);
          }
          break;
        case 'bond':
          if (editor.bondStartAtomId) {
            if (editor.bondStartAtomId !== atomId) {
              onAtomClick(atomId);
            }
          } else {
            if (onBondStart) {
              onBondStart(atomId);
            }
          }
          break;
        case 'select':
        case 'drag':
        default:
          onAtomClick(atomId);
          break;
      }
    } else {
      onAtomClick(atomId);
    }
  };

  if (atomData.length === 0) return null;

  return (
    <>
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, atomData.length]}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
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

      {/* Atom Label */}
      {selectedAtomId && (() => {
        const atom = filteredAtoms.find(a => a.id === selectedAtomId);
        if (!atom) return null;
        return (
          <Text
            position={[atom.x, atom.y + 0.8, atom.z]}
            fontSize={0.4}
            color="#ffffff"
            anchorX="center"
            anchorY="middle"
            outlineWidth={0.02}
            outlineColor="#000000"
            renderOrder={1000}
          >
            {atom.element}
          </Text>
        );
      })()}
    </>
  );
}
