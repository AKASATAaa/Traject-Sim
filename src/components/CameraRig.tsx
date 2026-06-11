import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useSimulationStore, type CameraPreset } from '../store/simulationStore';

const PRESETS: Record<Exclude<CameraPreset, 'free'>, { pos: THREE.Vector3; target: THREE.Vector3 }> = {
  side: { pos: new THREE.Vector3(-8.2, 2.2, 9.2), target: new THREE.Vector3(0, 1.2, 9.2) },
  catcher: { pos: new THREE.Vector3(0, 1.5, 21.3), target: new THREE.Vector3(0, 1.4, 10) },
  pitcher: { pos: new THREE.Vector3(-0.4, 2.2, -2.2), target: new THREE.Vector3(0, 1.0, 18.44) },
};

/** 카메라 프리셋 전환 애니메이션 */
export function CameraRig() {
  const preset = useSimulationStore((s) => s.cameraPreset);
  const nonce = useSimulationStore((s) => s.cameraNonce);
  const { camera, controls } = useThree();
  const anim = useRef<{
    fromPos: THREE.Vector3;
    toPos: THREE.Vector3;
    fromTarget: THREE.Vector3;
    toTarget: THREE.Vector3;
    t: number;
  } | null>(null);

  useEffect(() => {
    if (preset === 'free') return;
    const dest = PRESETS[preset];
    const orbit = controls as unknown as { target: THREE.Vector3 } | null;
    anim.current = {
      fromPos: camera.position.clone(),
      toPos: dest.pos.clone(),
      fromTarget: orbit ? orbit.target.clone() : new THREE.Vector3(0, 1.2, 9.2),
      toTarget: dest.target.clone(),
      t: 0,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nonce, preset]);

  useFrame((_, delta) => {
    const a = anim.current;
    if (!a) return;
    a.t = Math.min(1, a.t + delta * 1.8);
    const e = 1 - Math.pow(1 - a.t, 3); // ease-out cubic
    camera.position.lerpVectors(a.fromPos, a.toPos, e);
    const orbit = controls as unknown as { target: THREE.Vector3; update: () => void } | null;
    if (orbit) {
      orbit.target.lerpVectors(a.fromTarget, a.toTarget, e);
      orbit.update();
    }
    if (a.t >= 1) anim.current = null;
  });

  return null;
}
