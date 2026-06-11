import { create } from 'zustand';
import { Vec3 } from '../utils/vector3';
import { runSimulation } from '../physics/simulator';
import { degToRad, kmhToMs } from '../utils/units';
import type { EnvironmentParams, SimParams, SimulationResult } from '../physics/types';
import { PITCH_PRESETS } from '../data/presets';

/** UI 단위 기반 투구 설정 (km/h, m, deg) */
export interface PitchSettings {
  releaseX: number;
  releaseHeight: number;
  extension: number;
  releaseSpeedKmh: number;
  releaseAngleH: number;
  releaseAngleV: number;
  spinRpm: number;
  spinEfficiencyPct: number;
  spinDirectionDeg: number;
  seamOrientationDeg: number;
  seamLatitudeDeg: number;
  wakeOscillation: boolean;
}

export interface SpeedModeState {
  mode: 'simple' | 'advanced';
  targetPlateSpeedKmh: number;
}

export interface AeroVizState {
  enabled: boolean;
  showGravity: boolean;
  showDrag: boolean;
  showMagnus: boolean;
  showSSW: boolean;
  showVelocity: boolean;
  showWake: boolean;
  showStreamlines: boolean;
  vectorScale: number;
  animationMode: 'static' | 'flight';
}

export type CameraPreset = 'side' | 'catcher' | 'pitcher' | 'free';

interface SimulationStore {
  pitch: PitchSettings;
  env: EnvironmentParams;
  speed: SpeedModeState;
  aero: AeroVizState;
  activePresetId: string | null;
  seed: number;
  result: SimulationResult | null;
  cameraPreset: CameraPreset;
  cameraNonce: number;
  playing: boolean;
  playbackRate: number;
  restartNonce: number;

  updatePitch: (partial: Partial<PitchSettings>) => void;
  updateEnv: (partial: Partial<EnvironmentParams>) => void;
  updateSpeed: (partial: Partial<SpeedModeState>) => void;
  updateAero: (partial: Partial<AeroVizState>) => void;
  applyPreset: (id: string) => void;
  rethrow: () => void;
  setCameraPreset: (preset: CameraPreset) => void;
  setPlaying: (playing: boolean) => void;
  setPlaybackRate: (rate: number) => void;
  restartFlight: () => void;
  simulateNow: () => void;
}

/** UI 설정 → SI 시뮬레이션 파라미터 변환 */
export function buildSimParams(pitch: PitchSettings, seed: number): SimParams {
  const speed = kmhToMs(pitch.releaseSpeedKmh);
  const aV = degToRad(pitch.releaseAngleV);
  const aH = degToRad(pitch.releaseAngleH);
  const releaseVelocity = new Vec3(
    speed * Math.cos(aV) * Math.sin(aH),
    speed * Math.sin(aV),
    speed * Math.cos(aV) * Math.cos(aH),
  );
  return {
    releasePosition: new Vec3(pitch.releaseX, pitch.releaseHeight, pitch.extension),
    releaseVelocity,
    spinRpm: pitch.spinRpm,
    spinEfficiency: pitch.spinEfficiencyPct / 100,
    spinDirectionDeg: pitch.spinDirectionDeg,
    seamOrientationDeg: pitch.seamOrientationDeg,
    seamLatitudeDeg: pitch.seamLatitudeDeg,
    dragScale: 1.0,
    wakeEnabled: pitch.wakeOscillation,
    seed,
  };
}

let simTimer: ReturnType<typeof setTimeout> | undefined;

const DEFAULT_PRESET = PITCH_PRESETS[0];

export const useSimulationStore = create<SimulationStore>((set, get) => {
  const scheduleSim = () => {
    clearTimeout(simTimer);
    simTimer = setTimeout(() => get().simulateNow(), 50);
  };

  return {
    pitch: { ...DEFAULT_PRESET.settings },
    env: { altitudeM: 0, temperatureC: 18, humidityPct: 50 },
    speed: { mode: 'simple', targetPlateSpeedKmh: 140 },
    aero: {
      enabled: false,
      showGravity: true,
      showDrag: true,
      showMagnus: true,
      showSSW: true,
      showVelocity: false,
      showWake: false,
      showStreamlines: false,
      vectorScale: 1.0,
      animationMode: 'static',
    },
    activePresetId: DEFAULT_PRESET.id,
    seed: 1,
    result: null,
    cameraPreset: 'side',
    cameraNonce: 0,
    playing: false,
    playbackRate: 0.2,
    restartNonce: 0,

    updatePitch: (partial) => {
      set((s) => ({ pitch: { ...s.pitch, ...partial }, activePresetId: null }));
      scheduleSim();
    },

    updateEnv: (partial) => {
      set((s) => ({ env: { ...s.env, ...partial } }));
      scheduleSim();
    },

    updateSpeed: (partial) => {
      set((s) => {
        const speed = { ...s.speed, ...partial };
        // 종속도는 초속 미만으로 클램프 (드래그가 음수가 될 수 없음)
        const maxTarget = s.pitch.releaseSpeedKmh - 2;
        if (speed.targetPlateSpeedKmh > maxTarget) speed.targetPlateSpeedKmh = maxTarget;
        return { speed };
      });
      scheduleSim();
    },

    updateAero: (partial) => {
      set((s) => ({ aero: { ...s.aero, ...partial } }));
    },

    applyPreset: (id) => {
      const preset = PITCH_PRESETS.find((p) => p.id === id);
      if (!preset) return;
      set({ pitch: { ...preset.settings }, activePresetId: id });
      scheduleSim();
    },

    rethrow: () => {
      set((s) => ({ seed: s.seed + 1 }));
      get().simulateNow();
    },

    setCameraPreset: (preset) =>
      set((s) => ({ cameraPreset: preset, cameraNonce: s.cameraNonce + 1 })),

    setPlaying: (playing) => set({ playing }),

    setPlaybackRate: (rate) => set({ playbackRate: rate }),

    restartFlight: () => set((s) => ({ restartNonce: s.restartNonce + 1, playing: true })),

    simulateNow: () => {
      const { pitch, env, speed, seed } = get();
      const params = buildSimParams(pitch, seed);
      const result = runSimulation(params, env, {
        targetPlateSpeed:
          speed.mode === 'advanced' ? kmhToMs(speed.targetPlateSpeedKmh) : undefined,
      });
      set({ result });
    },
  };
});
