import { Vec3 } from '../utils/vector3';
import {
  BALL_AREA,
  BALL_DIAMETER,
  BALL_MASS,
  BALL_RADIUS,
  AIR_VISCOSITY,
  G,
} from './constants';
import { dragCoefficient } from './models/dragModel';
import { liftCoefficient } from './models/magnusModel';
import { sswCoefficient } from './models/sswModel';
import { createWakeModel, transverseDir, type WakeModel } from './knuckleWake';
import { rpmToRadS } from '../utils/units';
import type { ForceBreakdown, SimParams } from './types';

const GRAVITY_FORCE = new Vec3(0, -G * BALL_MASS, 0);

/** 시뮬레이션 1회분 컨텍스트 — 시드 기반 웨이크 모델 포함 */
export interface SimContext {
  params: SimParams;
  rho: number;
  omega: number; // 총 각속도 (rad/s)
  wake: WakeModel;
}

export function createSimContext(params: SimParams, rho: number): SimContext {
  return {
    params,
    rho,
    omega: rpmToRadS(params.spinRpm),
    wake: createWakeModel(
      params.spinRpm,
      params.seamOrientationDeg,
      params.wakeEnabled && !params.liftOff,
      params.seed,
    ),
  };
}

export function computeSpinParameter(omega: number, speed: number): number {
  return speed > 0.01 ? (BALL_RADIUS * omega) / speed : 0;
}

export function computeReynolds(speed: number, rho: number): number {
  return (rho * speed * BALL_DIAMETER) / AIR_VISCOSITY;
}

/** 시각 t, 속도 v에서 작용하는 모든 힘 분해 (N) */
export function computeForces(t: number, velocity: Vec3, ctx: SimContext): ForceBreakdown {
  const { params, rho, omega } = ctx;
  const speed = velocity.length();

  if (speed < 0.01) {
    return {
      gravity: GRAVITY_FORCE,
      drag: Vec3.ZERO,
      magnus: Vec3.ZERO,
      ssw: Vec3.ZERO,
      wake: Vec3.ZERO,
      total: GRAVITY_FORCE,
    };
  }

  const vHat = velocity.div(speed);
  const q = 0.5 * rho * BALL_AREA * speed * speed; // 동압 × 면적

  const spTotal = computeSpinParameter(omega, speed);

  // 드래그 — Cd는 총 스핀에 의존, dragScale로 감속률 보정 (고급 속도 모드)
  const drag = vHat.mul(-q * dragCoefficient(spTotal) * params.dragScale);

  let magnus = Vec3.ZERO;
  let ssw = Vec3.ZERO;
  let wake = Vec3.ZERO;

  if (!params.liftOff) {
    // 마그누스 — 횡스핀(active spin) 성분만 양력 생성
    const spTransverse = spTotal * params.spinEfficiency;
    if (spTransverse > 1e-6) {
      const magnusDir = transverseDir(vHat, params.spinDirectionDeg);
      magnus = magnusDir.mul(q * liftCoefficient(spTransverse));
    }

    // Seam-Shifted Wake — 시임 방위각 방향의 추가 횡력
    if (!params.sswOff) {
      const sswDir = transverseDir(vHat, params.seamOrientationDeg);
      ssw = sswDir.mul(q * sswCoefficient(params.seamLatitudeDeg, spTotal));
    }

    // 너클볼 웨이크 진동
    wake = ctx.wake.force(t, speed, vHat, rho);
  }

  const total = GRAVITY_FORCE.add(drag).add(magnus).add(ssw).add(wake);
  return { gravity: GRAVITY_FORCE, drag, magnus, ssw, wake, total };
}

/** 가속도 (m/s²) */
export function computeAcceleration(t: number, velocity: Vec3, ctx: SimContext): Vec3 {
  return computeForces(t, velocity, ctx).total.div(BALL_MASS);
}

/** 스핀축 단위 벡터 (시각화용) — 횡스핀 축 + 자이로 성분 */
export function computeSpinAxis(params: SimParams): Vec3 {
  const vHat = params.releaseVelocity.normalize();
  const magnusDir = transverseDir(vHat, params.spinDirectionDeg);
  const transverseAxis = vHat.cross(magnusDir).normalize();
  const eff = Math.min(1, Math.max(0, params.spinEfficiency));
  const gyro = Math.sqrt(Math.max(0, 1 - eff * eff));
  return transverseAxis.mul(eff).add(vHat.mul(gyro)).normalize();
}
