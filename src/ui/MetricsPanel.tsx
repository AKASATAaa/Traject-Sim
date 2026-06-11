import { useSimulationStore } from '../store/simulationStore';

function Row({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between py-0.5 text-xs">
      <span className="text-slate-400">{label}</span>
      <span className={`font-mono ${accent ? 'text-sky-300' : 'text-slate-200'}`}>{value}</span>
    </div>
  );
}

export function MetricsPanel() {
  const result = useSimulationStore((s) => s.result);
  const speedMode = useSimulationStore((s) => s.speed.mode);

  if (!result) {
    return <div className="p-4 text-xs text-slate-500">시뮬레이션 대기 중…</div>;
  }

  const m = result.metrics;

  return (
    <div className="space-y-3 p-4">
      <div>
        <h2 className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">
          속도
        </h2>
        <Row label="초속" value={`${m.releaseSpeedKmh.toFixed(1)} km/h`} accent />
        <Row label="종속도" value={`${m.plateSpeedKmh.toFixed(1)} km/h`} accent />
        <Row label="감속률" value={`${m.speedLossPct.toFixed(1)} %`} />
        {speedMode === 'advanced' && (
          <Row label="드래그 배율" value={`×${m.dragScale.toFixed(2)}`} />
        )}
        <Row label="비행 시간" value={`${m.flightTime.toFixed(3)} s`} />
      </div>

      <div>
        <h2 className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">
          무브먼트
        </h2>
        <Row label="IVB (수직 유도 이동)" value={`${m.ivbCm > 0 ? '+' : ''}${m.ivbCm.toFixed(1)} cm`} accent />
        <Row label="HB (수평 이동)" value={`${m.hbCm > 0 ? '+' : ''}${m.hbCm.toFixed(1)} cm`} accent />
        <Row label="총 이동량" value={`${m.totalBreakCm.toFixed(1)} cm`} />
        <Row label="SSW 기여" value={`${m.sswBreakCm.toFixed(1)} cm`} />
        {m.ensemble && (
          <div className="mt-1 rounded bg-purple-900/25 px-2 py-1.5 text-[11px] text-purple-300">
            너클볼 {m.ensemble.count}회 편차 — HB ±{m.ensemble.hbStdCm.toFixed(1)}cm, IVB ±
            {m.ensemble.ivbStdCm.toFixed(1)}cm
          </div>
        )}
      </div>

      <div>
        <h2 className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">
          플레이트 도달
        </h2>
        <Row label="수직 진입각 (VAA)" value={`${m.vaaDeg.toFixed(2)}°`} />
        <Row label="수평 진입각" value={`${m.haaDeg.toFixed(2)}°`} />
        <Row
          label="통과 위치 (좌우/높이)"
          value={`${(m.plateX * 100).toFixed(0)} / ${(m.plateY * 100).toFixed(0)} cm`}
        />
        <div
          className={`mt-1 rounded px-2 py-1 text-center text-[11px] font-semibold ${
            m.inZone ? 'bg-green-900/40 text-green-300' : 'bg-red-900/30 text-red-300'
          }`}
        >
          {m.inZone ? '스트라이크 존' : '존 바깥'}
        </div>
      </div>

      <div>
        <h2 className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">
          스핀
        </h2>
        <Row label="회전수" value={`${m.spinRpm} rpm`} />
        <Row label="액티브 스핀" value={`${m.activeSpinPct} %`} />
      </div>
    </div>
  );
}
