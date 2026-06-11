import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { useSimulationStore } from '../store/simulationStore';
import { Field } from './Field';
import { TrajectoryLines } from './TrajectoryLine';
import { SpinAxisGizmo } from './SpinAxisGizmo';
import { BallMesh } from './BallMesh';
import { ForceVectors } from './ForceVectors';
import { StaticWakeCones } from './WakeCone';
import { Streamlines } from './Streamlines';
import { FlightBall } from './FlightBall';
import { CameraRig } from './CameraRig';

/** 정적 모드에서 릴리즈 포인트에 공 표시 */
function StaticBall() {
  const result = useSimulationStore((s) => s.result);
  const pitch = useSimulationStore((s) => s.pitch);
  const aero = useSimulationStore((s) => s.aero);
  if (!result) return null;
  const pos = result.params.releasePosition;
  return (
    <group>
      <group position={pos.toArray()}>
        <BallMesh
          seamOrientationDeg={pitch.seamOrientationDeg}
          seamLatitudeDeg={pitch.seamLatitudeDeg}
        />
      </group>
      {aero.enabled && aero.showStreamlines && <Streamlines position={pos.toArray()} />}
    </group>
  );
}

export function Scene() {
  const animationMode = useSimulationStore((s) => s.aero.animationMode);

  return (
    <Canvas
      camera={{ position: [-8.2, 2.2, 9.2], fov: 42, near: 0.05, far: 200 }}
      dpr={[1, 2]}
    >
      <color attach="background" args={['#0b1020']} />
      <fog attach="fog" args={['#0b1020', 30, 70]} />
      <ambientLight intensity={0.7} />
      <directionalLight position={[6, 12, 4]} intensity={1.2} />
      <directionalLight position={[-6, 8, 16]} intensity={0.4} />

      <Field />
      <TrajectoryLines />
      <SpinAxisGizmo />
      <ForceVectors />
      <StaticWakeCones />
      {animationMode === 'static' ? <StaticBall /> : <FlightBall />}

      <OrbitControls
        makeDefault
        target={[0, 1.2, 9.2]}
        maxPolarAngle={Math.PI / 2 + 0.05}
        minDistance={1}
        maxDistance={45}
      />
      <CameraRig />
    </Canvas>
  );
}
