/** 공기역학 시각화 색상 (계획서 범례와 일치) */
export const FORCE_COLORS = {
  gravity: '#3b82f6',
  drag: '#ef4444',
  magnus: '#22c55e',
  ssw: '#f97316',
  wake: '#a855f7',
  velocity: '#f8fafc',
} as const;

export const FORCE_LABELS: Record<keyof typeof FORCE_COLORS, string> = {
  gravity: '중력',
  drag: '드래그',
  magnus: '마그누스',
  ssw: 'SSW',
  wake: '웨이크 진동',
  velocity: '속도',
};

/** 힘 크기(N) → 화살표 길이(m), 로그 스케일 정규화 */
export function forceArrowLength(magnitudeN: number, vectorScale: number): number {
  if (magnitudeN < 0.005) return 0;
  return 0.45 * vectorScale * Math.log10(1 + magnitudeN / 0.05);
}

/** 속도(m/s) → 화살표 길이(m) */
export function velocityArrowLength(speedMs: number, vectorScale: number): number {
  return 0.011 * speedMs * vectorScale;
}
