import { useMemo } from 'react';
import { Line } from '@react-three/drei';
import * as THREE from 'three';
import { useSimulationStore } from '../store/simulationStore';

const FAST = new THREE.Color('#38bdf8');
const SLOW = new THREE.Color('#fb7185');

/** 주 궤적 (속도 그라데이션) + 너클볼 다중 궤적 오버레이 */
export function TrajectoryLines() {
  const result = useSimulationStore((s) => s.result);
  const hidden = useSimulationStore(
    (s) => s.aero.animationMode === 'flight' && s.playing,
  );

  const main = useMemo(() => {
    if (!result || result.trajectory.points.length < 2) return null;
    const pts = result.trajectory.points;
    const speeds = pts.map((p) => p.speed);
    const minS = Math.min(...speeds);
    const maxS = Math.max(...speeds);
    const range = Math.max(0.1, maxS - minS);
    const positions = pts.map((p) => p.position.toArray());
    const colors = pts.map((p) => {
      const t = (p.speed - minS) / range;
      return SLOW.clone().lerp(FAST, t).toArray() as [number, number, number];
    });
    return { positions, colors };
  }, [result]);

  const ensemble = useMemo(() => {
    if (!result) return [];
    return result.ensemble.map((traj) => traj.points.map((p) => p.position.toArray()));
  }, [result]);

  if (!main || hidden) return null;

  return (
    <group>
      <Line points={main.positions} vertexColors={main.colors} lineWidth={3} />
      {ensemble.map((pts, i) =>
        pts.length > 1 ? (
          <Line
            key={i}
            points={pts}
            color="#94a3b8"
            transparent
            opacity={0.3}
            lineWidth={1.2}
          />
        ) : null,
      )}
    </group>
  );
}
