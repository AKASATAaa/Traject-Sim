import { useMemo } from 'react';
import * as THREE from 'three';
import { useSimulationStore } from '../store/simulationStore';
import type { TrajectoryPoint } from '../physics/types';

const DOWN = new THREE.Vector3(0, -1, 0);

/** 한 지점의 웨이크 원뿔 변환 계산 — 꼭짓점이 공, 밑면이 뒤쪽으로 벌어짐 */
export function wakeTransform(p: TrajectoryPoint, length: number) {
  const vHat = p.velocity.normalize();
  // 웨이크는 양력(마그누스+SSW+웨이크 진동)의 반대 방향으로 휘어짐 (운동량 보존)
  const lift = p.forces.magnus.add(p.forces.ssw).add(p.forces.wake);
  const liftMag = lift.length();
  let trail = vHat.mul(-1);
  if (liftMag > 0.01) {
    trail = trail.add(lift.div(liftMag).mul(-0.3)).normalize();
  }
  const trailV = new THREE.Vector3(trail.x, trail.y, trail.z);
  const quaternion = new THREE.Quaternion().setFromUnitVectors(DOWN, trailV);
  const position = new THREE.Vector3(
    p.position.x + trail.x * (length / 2),
    p.position.y + trail.y * (length / 2),
    p.position.z + trail.z * (length / 2),
  );
  return { position, quaternion };
}

/** 정적 모드 — 궤적을 따라 웨이크 원뿔 표시 */
export function StaticWakeCones() {
  const result = useSimulationStore((s) => s.result);
  const aero = useSimulationStore((s) => s.aero);

  const cones = useMemo(() => {
    if (!aero.enabled || !aero.showWake || aero.animationMode !== 'static' || !result) return [];
    const pts = result.trajectory.points;
    const stride = Math.max(1, Math.floor(pts.length / 8));
    const out: { position: THREE.Vector3; quaternion: THREE.Quaternion }[] = [];
    for (let i = stride; i < pts.length; i += stride) {
      out.push(wakeTransform(pts[i], 0.42));
    }
    return out;
  }, [result, aero]);

  return (
    <group>
      {cones.map((c, i) => (
        <mesh key={i} position={c.position} quaternion={c.quaternion}>
          <coneGeometry args={[0.085, 0.42, 14, 1, true]} />
          <meshBasicMaterial
            color="#94a3b8"
            transparent
            opacity={0.16}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  );
}
