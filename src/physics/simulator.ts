import { Vec3 } from '../utils/vector3';
import {
  PLATE_DISTANCE,
  SIM_DT,
  AUX_DT,
  SAMPLE_INTERVAL,
  ZONE_HALF_WIDTH,
  ZONE_BOTTOM,
  ZONE_TOP,
} from './constants';
import { computeAirDensity } from './environment';
import {
  computeAcceleration,
  computeForces,
  computeReynolds,
  computeSpinParameter,
  createSimContext,
} from './forces';
import { rk4Step, type BodyState } from './integrator';
import { solveDragScale } from './speedCalibration';
import { msToKmh, radToDeg, round } from '../utils/units';
import type {
  EnsembleStats,
  EnvironmentParams,
  Metrics,
  PlateCrossing,
  SimParams,
  SimulationResult,
  TrajectoryPoint,
  TrajectoryResult,
} from './types';

const MAX_FLIGHT_TIME = 2.5;

/** 단일 궤적 적분 — 플레이트 통과 또는 지면 도달까지 */
export function simulateTrajectory(
  params: SimParams,
  rho: number,
  dt: number = SIM_DT,
  record = true,
): TrajectoryResult {
  const ctx = createSimContext(params, rho);
  const accel = (t: number, v: Vec3) => computeAcceleration(t, v, ctx);

  let state: BodyState = {
    position: params.releasePosition,
    velocity: params.releaseVelocity,
  };
  let t = 0;
  let nextSample = 0;
  const points: TrajectoryPoint[] = [];
  let plate: PlateCrossing | null = null;

  const sample = () => {
    const speed = state.velocity.length();
    points.push({
      t,
      position: state.position,
      velocity: state.velocity,
      speed,
      forces: computeForces(t, state.velocity, ctx),
      spinParameter: computeSpinParameter(ctx.omega, speed),
      reynolds: computeReynolds(speed, rho),
    });
  };

  if (record) {
    sample();
    nextSample = SAMPLE_INTERVAL;
  }

  while (t < MAX_FLIGHT_TIME) {
    const prev = state;
    const prevT = t;
    state = rk4Step(t, state, dt, accel);
    t += dt;

    // 플레이트 평면 통과 — 선형 보간으로 정확한 통과 상태 계산
    if (prev.position.z < PLATE_DISTANCE && state.position.z >= PLATE_DISTANCE) {
      const f = (PLATE_DISTANCE - prev.position.z) / (state.position.z - prev.position.z);
      plate = {
        t: prevT + dt * f,
        position: prev.position.add(state.position.sub(prev.position).mul(f)),
        velocity: prev.velocity.add(state.velocity.sub(prev.velocity).mul(f)),
      };
      if (record) {
        t = plate.t;
        state = { position: plate.position, velocity: plate.velocity };
        sample();
      }
      break;
    }

    if (state.position.y < -0.3) break;

    if (record && t >= nextSample) {
      sample();
      nextSample += SAMPLE_INTERVAL;
    }
  }

  return { points, plate };
}

/** 플레이트 통과 속도(m/s)만 빠르게 계산 (역산용) */
export function plateSpeed(params: SimParams, rho: number, dt: number = AUX_DT): number | null {
  const result = simulateTrajectory(params, rho, dt, false);
  return result.plate ? result.plate.velocity.length() : null;
}

export interface SimulationOptions {
  /** 고급 속도 모드 — 목표 종속도 (m/s). 지정 시 dragScale 역산 */
  targetPlateSpeed?: number;
  /** 너클볼 다중 궤적 수 (주 궤적 제외) */
  ensembleRuns?: number;
}

/** 전체 시뮬레이션 — 주 궤적 + 기준 궤적 + SSW 기여 + 다중 궤적 + 메트릭 */
export function runSimulation(
  inputParams: SimParams,
  env: EnvironmentParams,
  options: SimulationOptions = {},
): SimulationResult {
  const rho = computeAirDensity(env);

  // 고급 속도 모드: 목표 종속도에 맞는 dragScale 역산
  let params = inputParams;
  if (options.targetPlateSpeed !== undefined) {
    const dragScale = solveDragScale(inputParams, rho, options.targetPlateSpeed);
    params = { ...inputParams, dragScale };
  }

  const trajectory = simulateTrajectory(params, rho, SIM_DT);

  // 기준 궤적: 양력 계열 힘 제거 (중력 + 드래그만) → IVB/HB 기준
  const reference = simulateTrajectory({ ...params, liftOff: true }, rho, AUX_DT);

  // SSW 기여도: SSW만 끈 궤적과 비교
  const noSsw = simulateTrajectory({ ...params, sswOff: true, wakeEnabled: false }, rho, AUX_DT);

  // 너클볼 다중 궤적 (웨이크 진동이 유효할 때만)
  const ensemble: TrajectoryResult[] = [];
  const wakeActive = params.wakeEnabled && params.spinRpm < 800 && !params.liftOff;
  const runs = wakeActive ? (options.ensembleRuns ?? 6) : 0;
  for (let i = 1; i <= runs; i++) {
    ensemble.push(simulateTrajectory({ ...params, seed: params.seed + i * 7919 }, rho, AUX_DT));
  }

  const metrics = computeMetrics(params, trajectory, reference, noSsw, ensemble, rho);

  return { trajectory, reference, ensemble, metrics, params };
}

function breakVsReference(
  actual: TrajectoryResult,
  reference: TrajectoryResult,
): { hbCm: number; ivbCm: number } | null {
  if (!actual.plate || !reference.plate) return null;
  return {
    hbCm: (actual.plate.position.x - reference.plate.position.x) * 100,
    ivbCm: (actual.plate.position.y - reference.plate.position.y) * 100,
  };
}

function computeMetrics(
  params: SimParams,
  trajectory: TrajectoryResult,
  reference: TrajectoryResult,
  noSsw: TrajectoryResult,
  ensemble: TrajectoryResult[],
  rho: number,
): Metrics {
  const releaseSpeed = params.releaseVelocity.length();
  const plate = trajectory.plate;
  const plateSpd = plate ? plate.velocity.length() : 0;

  const brk = breakVsReference(trajectory, reference);
  const hbCm = brk?.hbCm ?? 0;
  const ivbCm = brk?.ivbCm ?? 0;

  let sswBreakCm = 0;
  if (plate && noSsw.plate) {
    const dx = (plate.position.x - noSsw.plate.position.x) * 100;
    const dy = (plate.position.y - noSsw.plate.position.y) * 100;
    sswBreakCm = Math.hypot(dx, dy);
  }

  let ensembleStats: EnsembleStats | null = null;
  if (ensemble.length > 0) {
    const breaks = [brk, ...ensemble.map((e) => breakVsReference(e, reference))].filter(
      (b): b is { hbCm: number; ivbCm: number } => b !== null,
    );
    if (breaks.length > 1) {
      const mean = (arr: number[]) => arr.reduce((s, v) => s + v, 0) / arr.length;
      const std = (arr: number[], m: number) =>
        Math.sqrt(arr.reduce((s, v) => s + (v - m) ** 2, 0) / arr.length);
      const hbs = breaks.map((b) => b.hbCm);
      const ivbs = breaks.map((b) => b.ivbCm);
      const hbMean = mean(hbs);
      const ivbMean = mean(ivbs);
      ensembleStats = {
        count: breaks.length,
        hbMeanCm: round(hbMean),
        hbStdCm: round(std(hbs, hbMean)),
        ivbMeanCm: round(ivbMean),
        ivbStdCm: round(std(ivbs, ivbMean)),
      };
    }
  }

  const vaaDeg = plate ? radToDeg(Math.atan2(plate.velocity.y, plate.velocity.z)) : 0;
  const haaDeg = plate ? radToDeg(Math.atan2(plate.velocity.x, plate.velocity.z)) : 0;
  const plateX = plate?.position.x ?? 0;
  const plateY = plate?.position.y ?? 0;

  return {
    releaseSpeedKmh: round(msToKmh(releaseSpeed)),
    plateSpeedKmh: round(msToKmh(plateSpd)),
    speedLossPct: round(releaseSpeed > 0 ? (1 - plateSpd / releaseSpeed) * 100 : 0),
    dragScale: round(params.dragScale, 3),
    flightTime: round(plate?.t ?? 0, 3),
    ivbCm: round(ivbCm),
    hbCm: round(hbCm),
    totalBreakCm: round(Math.hypot(hbCm, ivbCm)),
    sswBreakCm: round(sswBreakCm),
    vaaDeg: round(vaaDeg, 2),
    haaDeg: round(haaDeg, 2),
    plateX: round(plateX, 3),
    plateY: round(plateY, 3),
    inZone:
      plate !== null &&
      Math.abs(plateX) <= ZONE_HALF_WIDTH &&
      plateY >= ZONE_BOTTOM &&
      plateY <= ZONE_TOP,
    spinRpm: Math.round(params.spinRpm),
    activeSpinPct: Math.round(params.spinEfficiency * 100),
    airDensity: round(rho, 4),
    ensemble: ensembleStats,
  };
}
