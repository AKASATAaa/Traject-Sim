import { useEffect } from 'react';
import { Scene } from './components/Scene';
import { ControlPanel } from './ui/ControlPanel';
import { MetricsPanel } from './ui/MetricsPanel';
import { AeroVizToggle } from './ui/AeroVizToggle';
import { CameraButtons } from './ui/CameraButtons';
import { useSimulationStore } from './store/simulationStore';

export default function App() {
  const simulateNow = useSimulationStore((s) => s.simulateNow);

  useEffect(() => {
    simulateNow();
  }, [simulateNow]);

  return (
    <div className="flex h-full">
      <aside className="w-72 shrink-0 border-r border-slate-800 bg-slate-950/60">
        <ControlPanel />
      </aside>

      <main className="relative min-w-0 flex-1">
        <Scene />
        <CameraButtons />
      </main>

      <aside className="w-64 shrink-0 overflow-y-auto border-l border-slate-800 bg-slate-950/60">
        <MetricsPanel />
        <AeroVizToggle />
      </aside>
    </div>
  );
}
