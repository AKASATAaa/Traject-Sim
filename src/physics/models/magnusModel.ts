import { LIFT_SCALE } from '../constants';

/**
 * 양력 계수 Cl(SP) — Nathan 피팅: Cl = SP / (2.32·SP + 0.4)
 * LIFT_SCALE로 Statcast 실측 IVB에 맞춰 보정.
 * SP는 횡스핀(active spin) 기준 스핀 파라미터.
 */
export function liftCoefficient(transverseSpinParameter: number): number {
  const sp = Math.max(0, transverseSpinParameter);
  return (LIFT_SCALE * sp) / (2.32 * sp + 0.4);
}
