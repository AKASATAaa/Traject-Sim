import { useSimulationStore, type CameraPreset } from '../store/simulationStore';

const PRESETS: { id: CameraPreset; label: string }[] = [
  { id: 'side', label: '측면' },
  { id: 'catcher', label: '캐처' },
  { id: 'pitcher', label: '투수' },
];

export function CameraButtons() {
  const current = useSimulationStore((s) => s.cameraPreset);
  const setPreset = useSimulationStore((s) => s.setCameraPreset);
  return (
    <div className="pointer-events-auto absolute right-3 top-3 flex gap-1 rounded-lg border border-slate-700/70 bg-slate-900/80 p-1 backdrop-blur">
      {PRESETS.map((p) => (
        <button
          key={p.id}
          onClick={() => setPreset(p.id)}
          className={`rounded-md px-2.5 py-1 text-xs transition-colors ${
            current === p.id
              ? 'bg-sky-600 font-semibold text-white'
              : 'text-slate-300 hover:bg-slate-700/70'
          }`}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}
