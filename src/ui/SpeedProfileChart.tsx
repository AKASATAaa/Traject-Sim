import { useMemo } from 'react';
import { useSimulationStore } from '../store/simulationStore';
import { msToKmh } from '../utils/units';

const W = 256;
const H = 96;
const PAD = { l: 34, r: 8, t: 8, b: 18 };

/** 거리(m) 대비 구속(km/h) 감속 곡선 */
export function SpeedProfileChart() {
  const result = useSimulationStore((s) => s.result);

  const chart = useMemo(() => {
    if (!result || result.trajectory.points.length < 2) return null;
    const pts = result.trajectory.points.map((p) => ({
      z: p.position.z,
      v: msToKmh(p.speed),
    }));
    const zMin = pts[0].z;
    const zMax = pts[pts.length - 1].z;
    const vMax = Math.max(...pts.map((p) => p.v));
    const vMin = Math.min(...pts.map((p) => p.v));
    const vPad = Math.max(2, (vMax - vMin) * 0.15);

    const x = (z: number) =>
      PAD.l + ((z - zMin) / Math.max(0.1, zMax - zMin)) * (W - PAD.l - PAD.r);
    const y = (v: number) =>
      PAD.t + (1 - (v - (vMin - vPad)) / (vMax + vPad - (vMin - vPad))) * (H - PAD.t - PAD.b);

    const path = pts
      .map((p, i) => `${i === 0 ? 'M' : 'L'}${x(p.z).toFixed(1)},${y(p.v).toFixed(1)}`)
      .join(' ');

    return { path, vMax, vMin, zMax, x, y };
  }, [result]);

  if (!chart) return null;

  return (
    <div>
      <div className="mb-1 text-[11px] text-slate-500">감속 곡선 (거리 vs 구속)</div>
      <svg width={W} height={H} className="rounded bg-slate-900/70">
        {/* Y축 라벨 */}
        <text x={4} y={PAD.t + 8} fill="#64748b" fontSize={9}>
          {chart.vMax.toFixed(0)}
        </text>
        <text x={4} y={H - PAD.b} fill="#64748b" fontSize={9}>
          {chart.vMin.toFixed(0)}
        </text>
        <text x={2} y={H / 2} fill="#475569" fontSize={8}>
          km/h
        </text>
        {/* X축 라벨 */}
        <text x={PAD.l} y={H - 5} fill="#64748b" fontSize={9}>
          릴리즈
        </text>
        <text x={W - PAD.r - 38} y={H - 5} fill="#64748b" fontSize={9}>
          {chart.zMax.toFixed(1)}m
        </text>
        <line
          x1={PAD.l}
          y1={H - PAD.b}
          x2={W - PAD.r}
          y2={H - PAD.b}
          stroke="#1e293b"
        />
        <path d={chart.path} fill="none" stroke="#38bdf8" strokeWidth={1.8} />
      </svg>
    </div>
  );
}
