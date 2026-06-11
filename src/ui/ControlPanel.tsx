import { useSimulationStore } from '../store/simulationStore';
import { PITCH_PRESETS } from '../data/presets';
import { Section, LabeledSlider, Toggle, SegmentButtons } from './common';
import { SpeedProfileChart } from './SpeedProfileChart';

function PitchPresets() {
  const activeId = useSimulationStore((s) => s.activePresetId);
  const applyPreset = useSimulationStore((s) => s.applyPreset);
  return (
    <Section title="구종 프리셋">
      <div className="grid grid-cols-2 gap-1.5">
        {PITCH_PRESETS.map((p) => (
          <button
            key={p.id}
            title={p.description}
            onClick={() => applyPreset(p.id)}
            className={`rounded-md border px-2 py-1.5 text-xs transition-colors ${
              activeId === p.id
                ? 'border-sky-500 bg-sky-600/25 font-semibold text-sky-200'
                : 'border-slate-700 bg-slate-800/50 text-slate-300 hover:border-slate-500'
            }`}
          >
            {p.name}
          </button>
        ))}
      </div>
    </Section>
  );
}

function ReleaseControls() {
  const pitch = useSimulationStore((s) => s.pitch);
  const update = useSimulationStore((s) => s.updatePitch);
  return (
    <Section title="릴리즈 포인트">
      <LabeledSlider
        label="좌우 위치 (캐처 시점)"
        value={pitch.releaseX}
        min={-0.9}
        max={0.9}
        step={0.01}
        unit="m"
        digits={2}
        onChange={(v) => update({ releaseX: v })}
      />
      <LabeledSlider
        label="릴리즈 높이"
        value={pitch.releaseHeight}
        min={0.4}
        max={2.1}
        step={0.01}
        unit="m"
        digits={2}
        onChange={(v) => update({ releaseHeight: v })}
      />
      <LabeledSlider
        label="익스텐션 (플레이트 방향)"
        value={pitch.extension}
        min={1.2}
        max={2.3}
        step={0.01}
        unit="m"
        digits={2}
        onChange={(v) => update({ extension: v })}
      />
      <LabeledSlider
        label="수평 릴리즈 각도"
        value={pitch.releaseAngleH}
        min={-5}
        max={5}
        step={0.1}
        unit="°"
        digits={1}
        onChange={(v) => update({ releaseAngleH: v })}
      />
      <LabeledSlider
        label="수직 릴리즈 각도"
        value={pitch.releaseAngleV}
        min={-8}
        max={8}
        step={0.1}
        unit="°"
        digits={1}
        onChange={(v) => update({ releaseAngleV: v })}
      />
    </Section>
  );
}

function SpeedControls() {
  const pitch = useSimulationStore((s) => s.pitch);
  const speed = useSimulationStore((s) => s.speed);
  const result = useSimulationStore((s) => s.result);
  const updatePitch = useSimulationStore((s) => s.updatePitch);
  const updateSpeed = useSimulationStore((s) => s.updateSpeed);

  const advanced = speed.mode === 'advanced';

  return (
    <Section title="속도">
      <Toggle
        label="고급 속도 설정 (초속/종속)"
        checked={advanced}
        onChange={(v) => updateSpeed({ mode: v ? 'advanced' : 'simple' })}
      />
      <LabeledSlider
        label="초속 (릴리즈 구속)"
        value={pitch.releaseSpeedKmh}
        min={100}
        max={170}
        step={0.5}
        unit="km/h"
        digits={1}
        onChange={(v) => updatePitch({ releaseSpeedKmh: v })}
      />
      {advanced ? (
        <>
          <LabeledSlider
            label="종속도 (플레이트 도달, 목표)"
            value={Math.min(speed.targetPlateSpeedKmh, pitch.releaseSpeedKmh - 2)}
            min={85}
            max={Math.max(86, pitch.releaseSpeedKmh - 2)}
            step={0.5}
            unit="km/h"
            digits={1}
            onChange={(v) => updateSpeed({ targetPlateSpeedKmh: v })}
          />
          {result && (
            <div className="rounded bg-slate-800/60 px-2 py-1.5 text-[11px] text-slate-400">
              유효 드래그 배율{' '}
              <span className="font-mono text-amber-300">
                ×{result.metrics.dragScale.toFixed(2)}
              </span>
              {' · '}실측 종속{' '}
              <span className="font-mono text-sky-300">
                {result.metrics.plateSpeedKmh.toFixed(1)} km/h
              </span>
            </div>
          )}
        </>
      ) : (
        result && (
          <div className="rounded bg-slate-800/60 px-2 py-1.5 text-[11px] text-slate-400">
            종속도 (물리 계산){' '}
            <span className="font-mono text-sky-300">
              {result.metrics.plateSpeedKmh.toFixed(1)} km/h
            </span>
            {' · '}감속{' '}
            <span className="font-mono text-slate-300">
              {result.metrics.speedLossPct.toFixed(1)}%
            </span>
          </div>
        )
      )}
      <SpeedProfileChart />
    </Section>
  );
}

function SpinControls() {
  const pitch = useSimulationStore((s) => s.pitch);
  const update = useSimulationStore((s) => s.updatePitch);
  return (
    <Section title="스핀">
      <LabeledSlider
        label="회전수"
        value={pitch.spinRpm}
        min={0}
        max={3500}
        step={10}
        unit="rpm"
        onChange={(v) => update({ spinRpm: v })}
      />
      <LabeledSlider
        label="스핀 효율 (active spin)"
        value={pitch.spinEfficiencyPct}
        min={0}
        max={100}
        unit="%"
        onChange={(v) => update({ spinEfficiencyPct: v })}
      />
      <LabeledSlider
        label="스핀축 방향 (0°=백스핀↑, 90°=우횡)"
        value={pitch.spinDirectionDeg}
        min={0}
        max={360}
        unit="°"
        onChange={(v) => update({ spinDirectionDeg: v })}
      />
      {pitch.spinRpm < 500 && (
        <div className="rounded bg-purple-900/30 px-2 py-1.5 text-[11px] text-purple-300">
          저회전 — 너클볼 영역. 웨이크 진동을 켜면 매번 다른 궤적이 생성됩니다.
        </div>
      )}
    </Section>
  );
}

function SeamControls() {
  const pitch = useSimulationStore((s) => s.pitch);
  const result = useSimulationStore((s) => s.result);
  const update = useSimulationStore((s) => s.updatePitch);
  const rethrow = useSimulationStore((s) => s.rethrow);
  return (
    <Section title="시임 / SSW">
      <LabeledSlider
        label="시임 방위각 (SSW 횡력 방향)"
        value={pitch.seamOrientationDeg}
        min={0}
        max={360}
        unit="°"
        onChange={(v) => update({ seamOrientationDeg: v })}
      />
      <LabeledSlider
        label="시임 위도 (0°에서 SSW 최대)"
        value={pitch.seamLatitudeDeg}
        min={-90}
        max={90}
        unit="°"
        onChange={(v) => update({ seamLatitudeDeg: v })}
      />
      {result && (
        <div className="rounded bg-slate-800/60 px-2 py-1.5 text-[11px] text-slate-400">
          SSW 추가 이동량{' '}
          <span className="font-mono text-orange-300">
            {result.metrics.sswBreakCm.toFixed(1)} cm
          </span>
        </div>
      )}
      <Toggle
        label="웨이크 진동 (너클볼 난류)"
        checked={pitch.wakeOscillation}
        onChange={(v) => update({ wakeOscillation: v })}
      />
      {pitch.wakeOscillation && (
        <button
          onClick={rethrow}
          className="w-full rounded-md border border-purple-600/60 bg-purple-900/30 px-2 py-1.5 text-xs text-purple-200 transition-colors hover:bg-purple-800/40"
        >
          다시 던지기 (새 난류 시드)
        </button>
      )}
    </Section>
  );
}

function EnvironmentControls() {
  const env = useSimulationStore((s) => s.env);
  const result = useSimulationStore((s) => s.result);
  const update = useSimulationStore((s) => s.updateEnv);
  return (
    <Section title="환경" defaultOpen={false}>
      <LabeledSlider
        label="고도"
        value={env.altitudeM}
        min={0}
        max={2500}
        step={10}
        unit="m"
        onChange={(v) => update({ altitudeM: v })}
      />
      <LabeledSlider
        label="기온"
        value={env.temperatureC}
        min={-10}
        max={45}
        unit="°C"
        onChange={(v) => update({ temperatureC: v })}
      />
      <LabeledSlider
        label="상대습도"
        value={env.humidityPct}
        min={0}
        max={100}
        unit="%"
        onChange={(v) => update({ humidityPct: v })}
      />
      <div className="flex gap-1.5">
        {[
          { label: '해수면', alt: 0, temp: 18 },
          { label: '잠실(가을밤)', alt: 50, temp: 12 },
          { label: '쿠어스(1,600m)', alt: 1600, temp: 24 },
        ].map((p) => (
          <button
            key={p.label}
            onClick={() => update({ altitudeM: p.alt, temperatureC: p.temp })}
            className="flex-1 rounded border border-slate-700 bg-slate-800/50 px-1 py-1 text-[10px] text-slate-400 hover:border-slate-500"
          >
            {p.label}
          </button>
        ))}
      </div>
      {result && (
        <div className="text-[11px] text-slate-500">
          공기밀도 ρ ={' '}
          <span className="font-mono text-slate-300">{result.metrics.airDensity}</span> kg/m³
        </div>
      )}
    </Section>
  );
}

function ViewControls() {
  const aero = useSimulationStore((s) => s.aero);
  const updateAero = useSimulationStore((s) => s.updateAero);
  const playing = useSimulationStore((s) => s.playing);
  const playbackRate = useSimulationStore((s) => s.playbackRate);
  const setPlaying = useSimulationStore((s) => s.setPlaying);
  const setPlaybackRate = useSimulationStore((s) => s.setPlaybackRate);
  const restartFlight = useSimulationStore((s) => s.restartFlight);

  return (
    <Section title="표시 모드">
      <SegmentButtons
        options={[
          { id: 'static', label: '정적 (전 구간)' },
          { id: 'flight', label: '비행 (애니메이션)' },
        ]}
        value={aero.animationMode}
        onChange={(v) => updateAero({ animationMode: v })}
      />
      {aero.animationMode === 'flight' && (
        <>
          <div className="flex gap-1.5">
            <button
              onClick={() => setPlaying(!playing)}
              className="flex-1 rounded-md border border-sky-600 bg-sky-900/40 px-2 py-1.5 text-xs text-sky-200 hover:bg-sky-800/40"
            >
              {playing ? '일시정지' : '재생'}
            </button>
            <button
              onClick={restartFlight}
              className="flex-1 rounded-md border border-slate-600 bg-slate-800/60 px-2 py-1.5 text-xs text-slate-300 hover:bg-slate-700/60"
            >
              처음부터
            </button>
          </div>
          <LabeledSlider
            label="재생 속도"
            value={playbackRate}
            min={0.05}
            max={1}
            step={0.05}
            unit="×"
            digits={2}
            onChange={setPlaybackRate}
          />
        </>
      )}
    </Section>
  );
}

export function ControlPanel() {
  return (
    <div className="flex h-full flex-col overflow-y-auto">
      <div className="border-b border-slate-800 px-4 py-3">
        <h1 className="text-sm font-bold tracking-wide text-slate-100">
          TRAJECT <span className="font-normal text-slate-500">피칭 시뮬레이터</span>
        </h1>
      </div>
      <PitchPresets />
      <ReleaseControls />
      <SpeedControls />
      <SpinControls />
      <SeamControls />
      <EnvironmentControls />
      <ViewControls />
    </div>
  );
}
