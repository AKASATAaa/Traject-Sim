/**
 * 물리 모델 벤치마크 검증 스크립트
 * 실행: npm run validate
 */
import process from 'node:process';
import { Vec3 } from '../src/utils/vector3';
import { runSimulation } from '../src/physics/simulator';
import { computeAirDensity } from '../src/physics/environment';
import { kmhToMs, degToRad } from '../src/utils/units';
import type { EnvironmentParams, SimParams } from '../src/physics/types';
import { PITCH_PRESETS } from '../src/data/presets';
import { buildSimParams } from '../src/store/simulationStore';

const SEA_LEVEL: EnvironmentParams = { altitudeM: 0, temperatureC: 18, humidityPct: 50 };

function makeParams(overrides: Partial<SimParams> & { speedKmh: number; angleV?: number }): SimParams {
  const speed = kmhToMs(overrides.speedKmh);
  const aV = degToRad(overrides.angleV ?? -1.6);
  return {
    releasePosition: new Vec3(-0.55, 1.8, 1.9),
    releaseVelocity: new Vec3(0, speed * Math.sin(aV), speed * Math.cos(aV)),
    spinRpm: 2400,
    spinEfficiency: 1.0,
    spinDirectionDeg: 0,
    seamOrientationDeg: 0,
    seamLatitudeDeg: 90, // SSW 비활성
    dragScale: 1.0,
    wakeEnabled: false,
    seed: 1,
    ...overrides,
  };
}

let failures = 0;
function check(name: string, value: number, min: number, max: number, unit = '') {
  const ok = value >= min && value <= max;
  if (!ok) failures++;
  console.log(
    `${ok ? 'PASS' : 'FAIL'}  ${name}: ${value.toFixed(2)}${unit} (기대: ${min}–${max}${unit})`,
  );
}

console.log('=== 벤치마크 1: 153 km/h, 2400rpm 백스핀, 해수면 ===');
{
  const r = runSimulation(makeParams({ speedKmh: 153 }), SEA_LEVEL);
  const m = r.metrics;
  console.log(
    `  초속 ${m.releaseSpeedKmh} → 종속 ${m.plateSpeedKmh} km/h (감속 ${m.speedLossPct}%), 비행 ${m.flightTime}s`,
  );
  check('IVB', m.ivbCm, 38, 48, 'cm');
  check('HB', Math.abs(m.hbCm), 0, 3, 'cm');
  check('감속률', m.speedLossPct, 7, 12, '%');
  check('VAA', m.vaaDeg, -7, -3, '°');
}

console.log('\n=== 벤치마크 2: 137 km/h 슬라이더 (자이로 + SSW) ===');
{
  const r = runSimulation(
    makeParams({
      speedKmh: 137,
      angleV: 0.2,
      spinRpm: 2500,
      spinEfficiency: 0.35,
      spinDirectionDeg: 100,
      seamOrientationDeg: 100,
      seamLatitudeDeg: 25,
    }),
    SEA_LEVEL,
  );
  const m = r.metrics;
  console.log(`  IVB ${m.ivbCm}cm, HB ${m.hbCm}cm, SSW 기여 ${m.sswBreakCm}cm`);
  check('HB (글러브쪽 +)', m.hbCm, 8, 40, 'cm');
  check('IVB (낮음)', m.ivbCm, -12, 12, 'cm');
  check('SSW 기여', m.sswBreakCm, 3, 20, 'cm');
}

console.log('\n=== 벤치마크 3: 고도 효과 (쿠어스 1,600m) ===');
{
  const sea = runSimulation(makeParams({ speedKmh: 153 }), SEA_LEVEL);
  const coors = runSimulation(makeParams({ speedKmh: 153 }), {
    altitudeM: 1600,
    temperatureC: 18,
    humidityPct: 50,
  });
  const ratio = coors.metrics.ivbCm / sea.metrics.ivbCm;
  console.log(
    `  해수면 IVB ${sea.metrics.ivbCm}cm vs 쿠어스 ${coors.metrics.ivbCm}cm (ρ ${computeAirDensity(SEA_LEVEL).toFixed(3)} → ${computeAirDensity({ altitudeM: 1600, temperatureC: 18, humidityPct: 50 }).toFixed(3)})`,
  );
  check('IVB 감소 비율 (낮은 ρ → 마그누스 약화)', ratio, 0.78, 0.95);
  check('쿠어스 감속률 감소', coors.metrics.speedLossPct, 5, sea.metrics.speedLossPct);
}

console.log('\n=== 벤치마크 4: 고급 속도 — dragScale 역산 수렴 ===');
{
  const target = kmhToMs(135);
  const r = runSimulation(makeParams({ speedKmh: 150 }), SEA_LEVEL, {
    targetPlateSpeed: target,
  });
  console.log(`  목표 135.0 → 실측 ${r.metrics.plateSpeedKmh} km/h, dragScale ×${r.metrics.dragScale}`);
  check('종속 수렴 오차', Math.abs(r.metrics.plateSpeedKmh - 135), 0, 0.5, 'km/h');
  check('dragScale 범위', r.metrics.dragScale, 0.2, 4.0);
}

console.log('\n=== 벤치마크 5: 너클볼 — 웨이크 진동 편차 ===');
{
  const r = runSimulation(
    makeParams({
      speedKmh: 110,
      angleV: 1.8,
      spinRpm: 90,
      spinEfficiency: 0.1,
      seamLatitudeDeg: 0,
      seamOrientationDeg: 45,
      wakeEnabled: true,
    }),
    SEA_LEVEL,
    { ensembleRuns: 8 },
  );
  const m = r.metrics;
  const magnusAtRelease = r.trajectory.points[0].forces.magnus.length();
  console.log(
    `  IVB ${m.ivbCm}cm (SSW 포함), HB ${m.hbCm}cm | 마그누스 힘 ${magnusAtRelease.toFixed(4)}N | 앙상블 ${m.ensemble?.count}회: HB ±${m.ensemble?.hbStdCm}cm, IVB ±${m.ensemble?.ivbStdCm}cm`,
  );
  check('마그누스 힘 거의 0 (저회전)', magnusAtRelease, 0, 0.05, 'N');
  check('HB 편차 (춤추는 효과)', m.ensemble?.hbStdCm ?? 0, 2, 30, 'cm');
  check('IVB 편차', m.ensemble?.ivbStdCm ?? 0, 1.5, 30, 'cm');
}

console.log('\n=== 벤치마크 6: 고회전 시 웨이크 자동 소멸 ===');
{
  const r = runSimulation(
    makeParams({ speedKmh: 150, spinRpm: 2400, wakeEnabled: true }),
    SEA_LEVEL,
  );
  console.log(`  2400rpm + 웨이크 ON → 앙상블 ${r.ensemble.length}개 (0이어야 함)`);
  check('앙상블 수', r.ensemble.length, 0, 0);
}

console.log('\n=== 프리셋 플레이트 도달 위치 (존: x ±21.6cm, y 46–107cm) ===');
for (const preset of PITCH_PRESETS) {
  const params = buildSimParams(preset.settings, 1);
  const r = runSimulation(params, SEA_LEVEL);
  const m = r.metrics;
  console.log(
    `  ${preset.name.padEnd(14)} x=${(m.plateX * 100).toFixed(0).padStart(4)}cm y=${(m.plateY * 100).toFixed(0).padStart(4)}cm ${m.inZone ? '존' : '밖'} | IVB ${String(m.ivbCm).padStart(6)}cm HB ${String(m.hbCm).padStart(6)}cm | ${m.releaseSpeedKmh}→${m.plateSpeedKmh}km/h`,
  );
}

console.log(`\n${failures === 0 ? '모든 벤치마크 통과' : `${failures}개 항목 실패`}`);
process.exit(failures === 0 ? 0 : 1);
