import { Vec3 } from '../utils/vector3';

/** 시뮬레이터 내부 파라미터 (전부 SI 단위) */
export interface SimParams {
  /** 릴리즈 위치 (m) — 원점: 투수판, +z: 플레이트 방향 */
  releasePosition: Vec3;
  /** 릴리즈 속도 벡터 (m/s) */
  releaseVelocity: Vec3;
  /** 총 회전수 (rpm) */
  spinRpm: number;
  /** 스핀 효율 0–1 (속도에 수직인 active spin 비율) */
  spinEfficiency: number;
  /** 횡스핀 축 방위각 (deg) — 0°: 순수 백스핀(마그누스 ↑), 90°: +x 방향 횡력 */
  spinDirectionDeg: number;
  /** 시임 방위각 (deg) — SSW 횡력이 미는 방향, 0°: 위 */
  seamOrientationDeg: number;
  /** 시임 위도 (deg, -90–90) — 0°에서 SSW 최대 */
  seamLatitudeDeg: number;
  /** 드래그 배율 (기본 1.0, 고급 속도 모드에서 역산) */
  dragScale: number;
  /** 너클볼 웨이크 진동 활성화 */
  wakeEnabled: boolean;
  /** 난수 시드 (웨이크 진동 위상) */
  seed: number;
  /** true면 양력 계열 힘(마그누스/SSW/웨이크) 비활성 — 기준 궤적용 */
  liftOff?: boolean;
  /** true면 SSW만 비활성 — SSW 기여도 측정용 */
  sswOff?: boolean;
}

export interface EnvironmentParams {
  /** 고도 (m) */
  altitudeM: number;
  /** 기온 (°C) */
  temperatureC: number;
  /** 상대습도 (%) */
  humidityPct: number;
}

export interface ForceBreakdown {
  gravity: Vec3;
  drag: Vec3;
  magnus: Vec3;
  ssw: Vec3;
  wake: Vec3;
  /** 모든 힘의 합 (N) */
  total: Vec3;
}

export interface TrajectoryPoint {
  t: number;
  position: Vec3;
  velocity: Vec3;
  speed: number;
  forces: ForceBreakdown;
  spinParameter: number;
  reynolds: number;
}

export interface PlateCrossing {
  t: number;
  position: Vec3;
  velocity: Vec3;
}

export interface TrajectoryResult {
  points: TrajectoryPoint[];
  /** 플레이트 평면(z = 18.44m) 통과 상태 — 도달 못하면 null */
  plate: PlateCrossing | null;
}

export interface EnsembleStats {
  count: number;
  hbMeanCm: number;
  hbStdCm: number;
  ivbMeanCm: number;
  ivbStdCm: number;
}

export interface Metrics {
  releaseSpeedKmh: number;
  plateSpeedKmh: number;
  speedLossPct: number;
  dragScale: number;
  flightTime: number;
  /** Induced Vertical Break (cm) — 무회전 기준 궤적 대비 수직 이동 */
  ivbCm: number;
  /** Horizontal Break (cm) — +x: 캐처 시점 우측 */
  hbCm: number;
  totalBreakCm: number;
  /** SSW가 기여한 이동량 (cm) */
  sswBreakCm: number;
  /** Vertical Approach Angle (deg, 음수 = 하강) */
  vaaDeg: number;
  haaDeg: number;
  /** 플레이트 통과 위치 (m) */
  plateX: number;
  plateY: number;
  inZone: boolean;
  spinRpm: number;
  activeSpinPct: number;
  airDensity: number;
  ensemble: EnsembleStats | null;
}

export interface SimulationResult {
  trajectory: TrajectoryResult;
  /** 양력 없는 기준 궤적 (IVB/HB 계산 기준) */
  reference: TrajectoryResult;
  /** 너클볼 다중 궤적 (주 궤적 제외) */
  ensemble: TrajectoryResult[];
  metrics: Metrics;
  params: SimParams;
}
