import { useMemo } from 'react';
import { Line } from '@react-three/drei';
import * as THREE from 'three';
import { useSimulationStore } from '../store/simulationStore';
import { computeSpinAxis } from '../physics/forces';
import { Vec3 } from '../utils/vector3';
import { MeshArrow } from './MeshArrow';

const AXIS_COLOR = '#e879f9';

/**
 * 회전 방향 원호 — 스핀축 둘레를 도는 화살표.
 * 오른손 법칙: ω̂ 방향으로 엄지를 두면 손가락이 감기는 방향이 회전 방향.
 */
function buildRotationArc(origin: Vec3, axis: Vec3, radius: number) {
  const a = new THREE.Vector3(axis.x, axis.y, axis.z).normalize();
  // 축에 수직인 기저 (u × w = a → 호의 진행 방향이 회전 방향과 일치)
  const tmp = Math.abs(a.y) < 0.9 ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(1, 0, 0);
  const u = new THREE.Vector3().crossVectors(tmp, a).normalize();
  const w = new THREE.Vector3().crossVectors(a, u).normalize();

  const c = new THREE.Vector3(origin.x, origin.y, origin.z);
  const start = Math.PI * 0.15;
  const end = Math.PI * 1.75;
  const segments = 40;

  const points: THREE.Vector3[] = [];
  for (let i = 0; i <= segments; i++) {
    const th = start + ((end - start) * i) / segments;
    points.push(
      c
        .clone()
        .add(u.clone().multiplyScalar(radius * Math.cos(th)))
        .add(w.clone().multiplyScalar(radius * Math.sin(th))),
    );
  }

  // 호 끝의 접선 방향 = 회전 진행 방향 → 화살촉
  const tangent = u
    .clone()
    .multiplyScalar(-Math.sin(end))
    .add(w.clone().multiplyScalar(Math.cos(end)))
    .normalize();
  const tip = points[points.length - 1];

  return { points, tip, tangent };
}

/** 릴리즈 포인트에서 스핀축(양방향 화살표) + 회전 방향(원호 화살표) 표시 */
export function SpinAxisGizmo() {
  const result = useSimulationStore((s) => s.result);

  const gizmo = useMemo(() => {
    if (!result || result.params.spinRpm < 30) return null;
    const axis = computeSpinAxis(result.params);
    const origin = result.params.releasePosition;
    const arc = buildRotationArc(origin, axis, 0.16);
    return { axis, origin, arc };
  }, [result]);

  if (!gizmo) return null;

  const len = 0.42;
  const o = gizmo.origin;
  const a = gizmo.axis;
  const { arc } = gizmo;

  return (
    <group>
      {/* 스핀축 (+ω̂ 방향이 밝은 쪽) */}
      <MeshArrow
        origin={[o.x, o.y, o.z]}
        dir={[a.x, a.y, a.z]}
        length={len}
        color={AXIS_COLOR}
        opacity={0.85}
        shaftRadius={0.01}
      />
      <MeshArrow
        origin={[o.x, o.y, o.z]}
        dir={[-a.x, -a.y, -a.z]}
        length={len * 0.55}
        color={AXIS_COLOR}
        opacity={0.45}
        shaftRadius={0.01}
      />
      {/* 회전 방향 원호 + 화살촉 */}
      <Line points={arc.points} color="#facc15" lineWidth={2.5} transparent opacity={0.95} />
      <MeshArrow
        origin={arc.tip.toArray() as [number, number, number]}
        dir={arc.tangent.toArray() as [number, number, number]}
        length={0.085}
        color="#facc15"
        opacity={0.95}
        shaftRadius={0.008}
      />
    </group>
  );
}
