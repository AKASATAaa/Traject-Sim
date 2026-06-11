import { Vec3 } from '../utils/vector3';

/** MLB 공인구 질량 (kg) — 5 oz */
export const BALL_MASS = 0.14515;
/** 공 반지름 (m) — 둘레 약 9.1 in */
export const BALL_RADIUS = 0.0366;
/** 공 단면적 (m²) */
export const BALL_AREA = Math.PI * BALL_RADIUS * BALL_RADIUS;
/** 공 지름 (m) */
export const BALL_DIAMETER = BALL_RADIUS * 2;

/** 투수판 → 홈플레이트 거리 (m) = 60.5 ft */
export const PLATE_DISTANCE = 18.44;

/** 중력 가속도 (m/s²) */
export const G = 9.80665;
export const GRAVITY_ACCEL = new Vec3(0, -G, 0);

/** 공기 점성 계수 (Pa·s, 15°C 근방) */
export const AIR_VISCOSITY = 1.81e-5;

/** 메인 시뮬레이션 적분 시간 간격 (s) */
export const SIM_DT = 1e-4;
/** 보조 시뮬레이션(역산·기준 궤적)용 간격 (s) — RK4라 충분히 정확 */
export const AUX_DT = 5e-4;
/** 궤적 샘플링 간격 (s) — 렌더링용 */
export const SAMPLE_INTERVAL = 0.004;

/**
 * 양력 계수 보정 배율.
 * Nathan Cl 피팅(SP/(2.32SP+0.4))은 IVB를 과대 예측하는 경향이 있어
 * Statcast 실측(153km/h, 2400rpm → IVB ≈ 43cm)에 맞춰 보정한다.
 * scripts/validate.ts에서 검증.
 */
export const LIFT_SCALE = 0.72;

/** 드래그 계수 기본값 + 스핀 의존 보정 */
export const CD_BASE = 0.33;
export const CD_SPIN_FACTOR = 0.1;

/** 스트라이크존 (m) — 폭 17in, 높이는 평균 타자 기준 */
export const ZONE_HALF_WIDTH = 0.216;
export const ZONE_BOTTOM = 0.46;
export const ZONE_TOP = 1.07;
