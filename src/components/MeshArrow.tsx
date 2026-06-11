import { useMemo } from 'react';
import * as THREE from 'three';

const UP = new THREE.Vector3(0, 1, 0);

interface MeshArrowProps {
  origin: [number, number, number];
  dir: [number, number, number];
  length: number;
  color: string;
  opacity?: number;
  shaftRadius?: number;
}

/** 원기둥 + 원뿔로 구성된 3D 화살표 (정적 시각화용) */
export function MeshArrow({
  origin,
  dir,
  length,
  color,
  opacity = 0.9,
  shaftRadius = 0.013,
}: MeshArrowProps) {
  const quaternion = useMemo(() => {
    const d = new THREE.Vector3(...dir);
    if (d.lengthSq() < 1e-12) return new THREE.Quaternion();
    return new THREE.Quaternion().setFromUnitVectors(UP, d.normalize());
  }, [dir]);

  if (length < 0.02) return null;

  const head = Math.min(0.1, length * 0.35);
  const shaft = length - head;

  return (
    <group position={origin} quaternion={quaternion}>
      <mesh position={[0, shaft / 2, 0]}>
        <cylinderGeometry args={[shaftRadius, shaftRadius, shaft, 6]} />
        <meshBasicMaterial color={color} transparent opacity={opacity} />
      </mesh>
      <mesh position={[0, shaft + head / 2, 0]}>
        <coneGeometry args={[shaftRadius * 2.8, head, 10]} />
        <meshBasicMaterial color={color} transparent opacity={opacity} />
      </mesh>
    </group>
  );
}
