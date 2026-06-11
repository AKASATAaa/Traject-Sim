/** 단위 변환 — 내부 계산은 SI(m, m/s), UI 표시는 미터법(km/h, m, cm) */

export const kmhToMs = (kmh: number): number => kmh / 3.6;
export const msToKmh = (ms: number): number => ms * 3.6;

export const mToCm = (m: number): number => m * 100;
export const cmToM = (cm: number): number => cm / 100;

export const degToRad = (deg: number): number => (deg * Math.PI) / 180;
export const radToDeg = (rad: number): number => (rad * 180) / Math.PI;

export const rpmToRadS = (rpm: number): number => (rpm * 2 * Math.PI) / 60;

export const round = (v: number, digits = 1): number => {
  const f = 10 ** digits;
  return Math.round(v * f) / f;
};
