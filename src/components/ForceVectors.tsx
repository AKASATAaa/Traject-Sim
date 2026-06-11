import { useMemo } from 'react';
import { useSimulationStore } from '../store/simulationStore';
import { MeshArrow } from './MeshArrow';
import { FORCE_COLORS, forceArrowLength, velocityArrowLength } from '../utils/colors';
import type { TrajectoryPoint } from '../physics/types';
import type { Vec3 } from '../utils/vector3';

const STATION_COUNT = 12;

interface ArrowSpec {
  key: string;
  origin: [number, number, number];
  dir: [number, number, number];
  length: number;
  color: string;
}

function pushForce(
  arrows: ArrowSpec[],
  key: string,
  origin: Vec3,
  force: Vec3,
  color: string,
  vectorScale: number,
) {
  const mag = force.length();
  const length = forceArrowLength(mag, vectorScale);
  if (length < 0.02) return;
  const dir = force.div(mag);
  arrows.push({
    key,
    origin: origin.toArray(),
    dir: dir.toArray(),
    length,
    color,
  });
}

/** 정적 모드 — 궤적을 따라 일정 간격으로 힘/속도 벡터 표시 */
export function ForceVectors() {
  const result = useSimulationStore((s) => s.result);
  const aero = useSimulationStore((s) => s.aero);

  const arrows = useMemo(() => {
    if (!aero.enabled || aero.animationMode !== 'static' || !result) return [];
    const pts = result.trajectory.points;
    if (pts.length < 2) return [];

    const stride = Math.max(1, Math.floor(pts.length / STATION_COUNT));
    const stations: TrajectoryPoint[] = [];
    for (let i = 0; i < pts.length; i += stride) stations.push(pts[i]);

    const specs: ArrowSpec[] = [];
    stations.forEach((p, i) => {
      const o = p.position;
      const f = p.forces;
      if (aero.showGravity)
        pushForce(specs, `g${i}`, o, f.gravity, FORCE_COLORS.gravity, aero.vectorScale);
      if (aero.showDrag)
        pushForce(specs, `d${i}`, o, f.drag, FORCE_COLORS.drag, aero.vectorScale);
      if (aero.showMagnus)
        pushForce(specs, `m${i}`, o, f.magnus, FORCE_COLORS.magnus, aero.vectorScale);
      if (aero.showSSW)
        pushForce(specs, `s${i}`, o, f.ssw, FORCE_COLORS.ssw, aero.vectorScale);
      if (aero.showSSW && f.wake.length() > 0.005)
        pushForce(specs, `w${i}`, o, f.wake, FORCE_COLORS.wake, aero.vectorScale);
      if (aero.showVelocity) {
        const len = velocityArrowLength(p.speed, aero.vectorScale);
        const dir = p.velocity.normalize();
        specs.push({
          key: `v${i}`,
          origin: o.toArray(),
          dir: dir.toArray(),
          length: len,
          color: FORCE_COLORS.velocity,
        });
      }
    });
    return specs;
  }, [result, aero]);

  return (
    <group>
      {arrows.map((a) => (
        <MeshArrow
          key={a.key}
          origin={a.origin}
          dir={a.dir}
          length={a.length}
          color={a.color}
          opacity={0.85}
        />
      ))}
    </group>
  );
}
