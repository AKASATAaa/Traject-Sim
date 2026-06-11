import { Vec3 } from '../utils/vector3';
import { BALL_AREA } from './constants';
import { degToRad } from '../utils/units';

/** mulberry32 — 시드 기반 결정론적 난수 생성기 */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface WakeModel {
  /** 진폭 계수 (0이면 비활성) */
  amplitude: number;
  /** 시각 t에서의 웨이크 진동 힘 (N) */
  force(t: number, speed: number, vHat: Vec3, rho: number): Vec3;
}

/** 속도에 수직인 평면에서 방위각 az(0°=위)에 해당하는 단위 벡터 */
export function transverseDir(vHat: Vec3, azimuthDeg: number): Vec3 {
  const worldUp = new Vec3(0, 1, 0);
  let up = worldUp.sub(vHat.mul(worldUp.dot(vHat)));
  up = up.lengthSq() < 1e-12 ? new Vec3(0, 0, -1) : up.normalize();
  const side = up.cross(vHat).normalize();
  const a = degToRad(azimuthDeg);
  return up.mul(Math.cos(a)).add(side.mul(Math.sin(a)));
}

/**
 * 너클볼 웨이크 진동 모델.
 *
 * 저회전 시 공 뒤 난류 웨이크가 불안정하게 진동하며 quasi-periodic 횡력을 만든다:
 *   F(t) = ½·ρ·A·v² · Cw · [sin(2πf₁t+φ₁)·n̂(az₁(t)) + 0.45·sin(2πf₂t+φ₂)·n̂(az₂(t))]
 *
 * - Cw: rpm이 낮을수록 큼 (rpm > 800이면 사실상 0 → 일반 구종으로 자연 전환)
 * - 주파수·위상·방향 드리프트는 시드 기반 난수 → 같은 시드면 재현 가능,
 *   시드를 바꾸면 매번 다른 "춤추는" 궤적
 */
export function createWakeModel(
  spinRpm: number,
  seamOrientationDeg: number,
  enabled: boolean,
  seed: number,
): WakeModel {
  const amplitude = enabled ? 0.22 * Math.exp(-((spinRpm / 320) ** 2)) : 0;

  if (amplitude < 1e-4) {
    return { amplitude: 0, force: () => Vec3.ZERO };
  }

  const rng = mulberry32(seed * 2654435761 + 1013904223);
  const f1 = 1.2 + rng() * 2.3; // 1.2–3.5 Hz 주 진동
  const f2 = 3.0 + rng() * 3.0; // 3–6 Hz 보조 진동
  const phase1 = rng() * Math.PI * 2;
  const phase2 = rng() * Math.PI * 2;
  const az1 = seamOrientationDeg + (rng() - 0.5) * 120;
  const az2 = rng() * 360;
  const drift1 = (rng() - 0.5) * 360; // deg/s 방향 드리프트
  const drift2 = (rng() - 0.5) * 540;

  return {
    amplitude,
    force(t: number, speed: number, vHat: Vec3, rho: number): Vec3 {
      const q = 0.5 * rho * BALL_AREA * speed * speed * amplitude;
      const c1 = Math.sin(2 * Math.PI * f1 * t + phase1);
      const c2 = 0.45 * Math.sin(2 * Math.PI * f2 * t + phase2);
      const d1 = transverseDir(vHat, az1 + drift1 * t);
      const d2 = transverseDir(vHat, az2 + drift2 * t);
      return d1.mul(q * c1).add(d2.mul(q * c2));
    },
  };
}
