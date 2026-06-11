import { useMemo } from 'react';
import * as THREE from 'three';
import {
  PLATE_DISTANCE,
  ZONE_HALF_WIDTH,
  ZONE_BOTTOM,
  ZONE_TOP,
} from '../physics/constants';
import { useSimulationStore } from '../store/simulationStore';

function HomePlate() {
  const shape = useMemo(() => {
    // 홈플레이트 오각형 — 폭 0.432m, 깊이 0.432m
    const s = new THREE.Shape();
    const w = 0.216;
    s.moveTo(-w, 0);
    s.lineTo(w, 0);
    s.lineTo(w, -0.216);
    s.lineTo(0, -0.432);
    s.lineTo(-w, -0.216);
    s.closePath();
    return s;
  }, []);

  return (
    <mesh
      position={[0, 0.012, PLATE_DISTANCE]}
      rotation={[-Math.PI / 2, 0, 0]}
    >
      <shapeGeometry args={[shape]} />
      <meshStandardMaterial color="#e2e8f0" />
    </mesh>
  );
}

function StrikeZone() {
  const result = useSimulationStore((s) => s.result);
  const metrics = result?.metrics ?? null;

  const w = ZONE_HALF_WIDTH;
  const cy = (ZONE_BOTTOM + ZONE_TOP) / 2;
  const h = ZONE_TOP - ZONE_BOTTOM;

  return (
    <group position={[0, cy, PLATE_DISTANCE]}>
      <mesh>
        <planeGeometry args={[w * 2, h]} />
        <meshBasicMaterial color="#38bdf8" transparent opacity={0.07} side={THREE.DoubleSide} />
      </mesh>
      <lineSegments>
        <edgesGeometry args={[new THREE.PlaneGeometry(w * 2, h)]} />
        <lineBasicMaterial color="#7dd3fc" transparent opacity={0.8} />
      </lineSegments>
      {/* 존 9분할 가이드 */}
      <lineSegments>
        <edgesGeometry args={[new THREE.PlaneGeometry((w * 2) / 3, h / 3)]} />
        <lineBasicMaterial color="#38bdf8" transparent opacity={0.25} />
      </lineSegments>
      {/* 플레이트 통과 지점 마커 */}
      {metrics && result?.trajectory.plate && (
        <mesh position={[metrics.plateX, metrics.plateY - cy, 0]}>
          <sphereGeometry args={[0.045, 16, 16]} />
          <meshBasicMaterial color={metrics.inZone ? '#4ade80' : '#f87171'} />
        </mesh>
      )}
    </group>
  );
}

export function Field() {
  return (
    <group>
      {/* 잔디 */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 9]}>
        <planeGeometry args={[36, 46]} />
        <meshStandardMaterial color="#10331f" />
      </mesh>

      {/* 마운드 (흙) */}
      <mesh position={[0, 0.04, 0.4]}>
        <cylinderGeometry args={[2.7, 2.9, 0.22, 40]} />
        <meshStandardMaterial color="#7c5a3a" />
      </mesh>
      {/* 투수판 */}
      <mesh position={[0, 0.16, 0]}>
        <boxGeometry args={[0.61, 0.02, 0.15]} />
        <meshStandardMaterial color="#f1f5f9" />
      </mesh>

      {/* 타석 주변 흙 */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.001, PLATE_DISTANCE]}>
        <circleGeometry args={[2.4, 40]} />
        <meshStandardMaterial color="#6b4f33" />
      </mesh>

      {/* 거리 가이드 라인 (5m 간격) */}
      {[5, 10, 15].map((z) => (
        <mesh key={z} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.002, z]}>
          <planeGeometry args={[6, 0.02]} />
          <meshBasicMaterial color="#1e3a2f" />
        </mesh>
      ))}

      <HomePlate />
      <StrikeZone />
    </group>
  );
}
