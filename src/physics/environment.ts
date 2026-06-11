import type { EnvironmentParams } from './types';

const P0 = 101325; // 해수면 표준 기압 (Pa)
const R_DRY = 287.058; // 건조공기 기체상수 (J/(kg·K))
const R_VAPOR = 461.495; // 수증기 기체상수 (J/(kg·K))

/**
 * 고도·온도·습도로 공기밀도(kg/m³) 계산.
 * 기압: 국제표준대기(ISA) 기압 고도식, 습도: Tetens 포화수증기압.
 */
export function computeAirDensity(env: EnvironmentParams): number {
  const T = env.temperatureC + 273.15;
  const pressure = P0 * Math.pow(1 - 2.25577e-5 * env.altitudeM, 5.25588);
  const satVapor = 610.78 * Math.exp((17.27 * env.temperatureC) / (env.temperatureC + 237.3));
  const pVapor = (env.humidityPct / 100) * satVapor;
  const pDry = pressure - pVapor;
  return pDry / (R_DRY * T) + pVapor / (R_VAPOR * T);
}
