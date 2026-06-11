import { degToRad } from '../../utils/units';

/**
 * Seam-Shifted Wake 계수 — Barton Smith 연구 기반 현상학 모델.
 *
 * - 시임 위도(latitude)가 0°(웨이크 분리 지점 근처)일 때 효과 최대
 * - 저회전(SP < 0.1)에서는 시임이 웨이크를 오래 비대칭으로 유지해 효과가 크게 증폭
 * - 고회전에서는 시임 위치가 평균화되어 기본 수준으로 수렴
 */
export function sswCoefficient(seamLatitudeDeg: number, spinParameter: number): number {
  const latFactor = Math.cos(degToRad(seamLatitudeDeg)) ** 2;
  const lowSpinBoost = 1 + 1.8 * Math.exp(-((spinParameter / 0.08) ** 2));
  return 0.045 * latFactor * lowSpinBoost;
}
