import { CD_BASE, CD_SPIN_FACTOR } from '../constants';

/**
 * 드래그 계수 Cd(SP) — Nathan(2016) 계열 모델.
 * 회전이 빠를수록 경계층 분리가 비대칭이 되어 Cd가 소폭 증가한다.
 */
export function dragCoefficient(spinParameter: number): number {
  return CD_BASE + CD_SPIN_FACTOR * spinParameter;
}
