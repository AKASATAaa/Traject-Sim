import { forwardRef } from 'react';
import * as THREE from 'three';
import { degToRad } from '../utils/units';

/** 시각화용 공 크기 배율 (실제 반지름 0.0366m는 화면에서 너무 작음) */
export const BALL_VISUAL_RADIUS = 0.066;

interface BallMeshProps {
  seamOrientationDeg: number;
  seamLatitudeDeg: number;
}

/** 야구공 메시 — 흰 구체 + 시임을 나타내는 두 개의 붉은 링 */
export const BallMesh = forwardRef<THREE.Group, BallMeshProps>(
  ({ seamOrientationDeg, seamLatitudeDeg }, ref) => {
    const r = BALL_VISUAL_RADIUS;
    return (
      <group ref={ref}>
        <group
          rotation={[
            degToRad(seamLatitudeDeg),
            0,
            degToRad(seamOrientationDeg),
          ]}
        >
          <mesh>
            <sphereGeometry args={[r, 24, 24]} />
            <meshStandardMaterial color="#f8fafc" roughness={0.4} />
          </mesh>
          <mesh rotation={[Math.PI / 2.6, 0.5, 0]}>
            <torusGeometry args={[r * 0.92, r * 0.07, 8, 48]} />
            <meshStandardMaterial color="#dc2626" roughness={0.5} />
          </mesh>
          <mesh rotation={[-Math.PI / 2.6, -0.5, 0]}>
            <torusGeometry args={[r * 0.92, r * 0.07, 8, 48]} />
            <meshStandardMaterial color="#dc2626" roughness={0.5} />
          </mesh>
        </group>
      </group>
    );
  },
);
BallMesh.displayName = 'BallMesh';
