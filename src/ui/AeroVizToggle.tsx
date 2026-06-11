import { useSimulationStore } from '../store/simulationStore';
import { Toggle, LabeledSlider } from './common';
import { FORCE_COLORS } from '../utils/colors';

function ColorDot({ color }: { color: string }) {
  return (
    <span
      className="mr-1.5 inline-block h-2 w-2 rounded-full align-middle"
      style={{ background: color }}
    />
  );
}

export function AeroVizToggle() {
  const aero = useSimulationStore((s) => s.aero);
  const update = useSimulationStore((s) => s.updateAero);
  const off = !aero.enabled;

  return (
    <div className="border-t border-slate-800 p-4">
      <div className="mb-2.5 flex items-center justify-between">
        <span className="text-[13px] font-semibold text-slate-200">공기역학 표시</span>
        <Toggle label="" checked={aero.enabled} onChange={(v) => update({ enabled: v })} />
      </div>

      <div className="space-y-2">
        <Toggle
          label="중력"
          checked={aero.showGravity}
          disabled={off}
          onChange={(v) => update({ showGravity: v })}
        />
        <Toggle
          label="드래그"
          checked={aero.showDrag}
          disabled={off}
          onChange={(v) => update({ showDrag: v })}
        />
        <Toggle
          label="마그누스"
          checked={aero.showMagnus}
          disabled={off}
          onChange={(v) => update({ showMagnus: v })}
        />
        <Toggle
          label="SSW / 웨이크 진동"
          checked={aero.showSSW}
          disabled={off}
          onChange={(v) => update({ showSSW: v })}
        />
        <Toggle
          label="속도 벡터"
          checked={aero.showVelocity}
          disabled={off}
          onChange={(v) => update({ showVelocity: v })}
        />
        <Toggle
          label="웨이크 원뿔"
          checked={aero.showWake}
          disabled={off}
          onChange={(v) => update({ showWake: v })}
        />
        <Toggle
          label="기류선"
          checked={aero.showStreamlines}
          disabled={off}
          onChange={(v) => update({ showStreamlines: v })}
        />
        <LabeledSlider
          label="벡터 배율"
          value={aero.vectorScale}
          min={0.5}
          max={3}
          step={0.1}
          unit="×"
          digits={1}
          disabled={off}
          onChange={(v) => update({ vectorScale: v })}
        />
      </div>

      {aero.enabled && (
        <div className="mt-3 grid grid-cols-2 gap-x-2 gap-y-0.5 rounded bg-slate-900/60 p-2 text-[10px] text-slate-400">
          <span>
            <ColorDot color={FORCE_COLORS.gravity} />
            중력
          </span>
          <span>
            <ColorDot color={FORCE_COLORS.drag} />
            드래그
          </span>
          <span>
            <ColorDot color={FORCE_COLORS.magnus} />
            마그누스
          </span>
          <span>
            <ColorDot color={FORCE_COLORS.ssw} />
            SSW
          </span>
          <span>
            <ColorDot color={FORCE_COLORS.wake} />
            웨이크 진동
          </span>
          <span>
            <ColorDot color={FORCE_COLORS.velocity} />
            속도
          </span>
        </div>
      )}
    </div>
  );
}
