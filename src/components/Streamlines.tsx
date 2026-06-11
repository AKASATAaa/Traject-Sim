import { useMemo } from 'react';
import { Line } from '@react-three/drei';
import * as THREE from 'three';
import { useSimulationStore } from '../store/simulationStore';
import { BALL_VISUAL_RADIUS } from './BallMesh';

const LINE_COUNT = 10;

/**
 * 공 주변 기류선 (정적 근사) — 상대풍이 공 앞에서 갈라져 표면을 따라 흐르고,
 * 뒤쪽 웨이크에서 양력 반대 방향으로 휘어지는 모습을 표현.
 * 릴리즈 시점의 속도/힘 기준으로 생성하며 그룹 위치로 이동시켜 재사용한다.
 */
export function buildStreamlinePoints(
  vHat: THREE.Vector3,
  liftDir: THREE.Vector3 | null,
): THREE.Vector3[][] {
  const R = BALL_VISUAL_RADIUS;
  // v̂에 수직인 기저
  const tmp = Math.abs(vHat.y) < 0.9 ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(1, 0, 0);
  const u = new THREE.Vector3().crossVectors(tmp, vHat).normalize();
  const w = new THREE.Vector3().crossVectors(vHat, u).normalize();
  const defl = liftDir ? liftDir.clone().multiplyScalar(-1) : new THREE.Vector3();

  const lines: THREE.Vector3[][] = [];
  for (let i = 0; i < LINE_COUNT; i++) {
    const theta = (i / LINE_COUNT) * Math.PI * 2;
    const off = u
      .clone()
      .multiplyScalar(Math.cos(theta))
      .add(w.clone().multiplyScalar(Math.sin(theta)));

    const ctrl = [
      vHat.clone().multiplyScalar(0.5).add(off.clone().multiplyScalar(R * 0.45)),
      vHat.clone().multiplyScalar(0.16).add(off.clone().multiplyScalar(R * 1.5)),
      off.clone().multiplyScalar(R * 1.85),
      vHat
        .clone()
        .multiplyScalar(-0.16)
        .add(off.clone().multiplyScalar(R * 1.5))
        .add(defl.clone().multiplyScalar(0.025)),
      vHat
        .clone()
        .multiplyScalar(-0.5)
        .add(off.clone().multiplyScalar(R * 0.8))
        .add(defl.clone().multiplyScalar(0.14)),
    ];
    const curve = new THREE.CatmullRomCurve3(ctrl);
    lines.push(curve.getPoints(28));
  }
  return lines;
}

interface StreamlinesProps {
  position: [number, number, number];
}

export function Streamlines({ position }: StreamlinesProps) {
  const result = useSimulationStore((s) => s.result);

  const lines = useMemo(() => {
    if (!result || result.trajectory.points.length === 0) return [];
    const p0 = result.trajectory.points[0];
    const vHat = new THREE.Vector3(...p0.velocity.normalize().toArray());
    const lift = p0.forces.magnus.add(p0.forces.ssw);
    const liftMag = lift.length();
    const liftDir =
      liftMag > 0.01 ? new THREE.Vector3(...lift.div(liftMag).toArray()) : null;
    return buildStreamlinePoints(vHat, liftDir);
  }, [result]);

  return (
    <group position={position}>
      {lines.map((pts, i) => (
        <Line
          key={i}
          points={pts}
          color="#67e8f9"
          transparent
          opacity={0.38}
          lineWidth={1}
        />
      ))}
    </group>
  );
}
