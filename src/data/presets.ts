import type { PitchSettings } from '../store/simulationStore';

export interface PitchPreset {
  id: string;
  name: string;
  description: string;
  settings: PitchSettings;
}

const BASE_RELEASE = {
  releaseX: -0.55, // 우투수 — 팔쪽(-x)에서 릴리즈
  releaseHeight: 1.8,
  extension: 1.9,
};

export const PITCH_PRESETS: PitchPreset[] = [
  {
    id: 'fourSeam',
    name: '4-Seam FB',
    description: '높은 백스핀, 라이징 효과',
    settings: {
      ...BASE_RELEASE,
      releaseSpeedKmh: 153,
      releaseAngleH: 1.8,
      releaseAngleV: -1.6,
      spinRpm: 2400,
      spinEfficiencyPct: 95,
      spinDirectionDeg: 5,
      seamOrientationDeg: 0,
      seamLatitudeDeg: 75,
      wakeOscillation: false,
    },
  },
  {
    id: 'sinker',
    name: '2-Seam Sinker',
    description: 'SSW로 가라앉으며 팔쪽 횡이동',
    settings: {
      ...BASE_RELEASE,
      releaseSpeedKmh: 148,
      releaseAngleH: 2.8,
      releaseAngleV: -1.0,
      spinRpm: 2200,
      spinEfficiencyPct: 88,
      spinDirectionDeg: 318,
      seamOrientationDeg: 225,
      seamLatitudeDeg: 15,
      wakeOscillation: false,
    },
  },
  {
    id: 'slider',
    name: 'Slider',
    description: '자이로 스핀 + SSW 글러브쪽 브레이크',
    settings: {
      ...BASE_RELEASE,
      releaseSpeedKmh: 137,
      releaseAngleH: 0.9,
      releaseAngleV: 0.2,
      spinRpm: 2500,
      spinEfficiencyPct: 35,
      spinDirectionDeg: 100,
      seamOrientationDeg: 100,
      seamLatitudeDeg: 25,
      wakeOscillation: false,
    },
  },
  {
    id: 'curveball',
    name: 'Curveball',
    description: '탑스핀 급강하',
    settings: {
      ...BASE_RELEASE,
      releaseSpeedKmh: 128,
      releaseAngleH: 2.0,
      releaseAngleV: 2.2,
      spinRpm: 2800,
      spinEfficiencyPct: 85,
      spinDirectionDeg: 185,
      seamOrientationDeg: 180,
      seamLatitudeDeg: 60,
      wakeOscillation: false,
    },
  },
  {
    id: 'changeup',
    name: 'Changeup',
    description: '낮은 RPM, 패스트볼 대비 감속',
    settings: {
      ...BASE_RELEASE,
      releaseSpeedKmh: 138,
      releaseAngleH: 2.7,
      releaseAngleV: -0.7,
      spinRpm: 1750,
      spinEfficiencyPct: 92,
      spinDirectionDeg: 330,
      seamOrientationDeg: 250,
      seamLatitudeDeg: 30,
      wakeOscillation: false,
    },
  },
  {
    id: 'knuckleball',
    name: 'Knuckleball',
    description: '초저회전 — 웨이크 진동, 매번 다른 궤적',
    settings: {
      ...BASE_RELEASE,
      releaseSpeedKmh: 110,
      releaseAngleH: 0.8,
      releaseAngleV: 1.8,
      spinRpm: 90,
      spinEfficiencyPct: 10,
      spinDirectionDeg: 0,
      seamOrientationDeg: 45,
      seamLatitudeDeg: 0,
      wakeOscillation: true,
    },
  },
];
