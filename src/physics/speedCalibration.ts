import { AUX_DT } from './constants';
import { plateSpeed } from './simulator';
import type { SimParams } from './types';

const MIN_SCALE = 0.2;
const MAX_SCALE = 4.0;
/** 수렴 허용 오차 (m/s) ≈ 0.5 km/h */
const TOLERANCE = 0.14;

/**
 * 고급 속도 모드 — 목표 종속도를 만드는 dragScale을 이분 탐색으로 역산.
 * 종속도는 dragScale에 대해 단조 감소이므로 이분 탐색이 항상 수렴한다.
 * 목표가 물리적으로 불가능하면(드래그 0으로도 못 미치거나 최대 드래그로도 빠르면)
 * 경계값으로 클램프된다.
 */
export function solveDragScale(
  params: SimParams,
  rho: number,
  targetPlateSpeedMs: number,
): number {
  const speedAt = (dragScale: number) =>
    plateSpeed({ ...params, dragScale, wakeEnabled: false }, rho, AUX_DT);

  const atMin = speedAt(MIN_SCALE);
  const atMax = speedAt(MAX_SCALE);
  if (atMin === null || atMax === null) return 1.0;
  if (targetPlateSpeedMs >= atMin) return MIN_SCALE;
  if (targetPlateSpeedMs <= atMax) return MAX_SCALE;

  let lo = MIN_SCALE;
  let hi = MAX_SCALE;
  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2;
    const speed = speedAt(mid);
    if (speed === null) return 1.0;
    if (Math.abs(speed - targetPlateSpeedMs) < TOLERANCE) return mid;
    // dragScale↑ → 종속도↓
    if (speed > targetPlateSpeedMs) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}
