import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useSimulationStore } from '../store/simulationStore';
import { BallMesh } from './BallMesh';
import { Streamlines } from './Streamlines';
import { wakeTransform } from './WakeCone';
import { SAMPLE_INTERVAL } from '../physics/constants';
import { computeSpinAxis } from '../physics/forces';
import { rpmToRadS } from '../utils/units';
import { FORCE_COLORS, forceArrowLength, velocityArrowLength } from '../utils/colors';
import { Vec3 } from '../utils/vector3';
import type { ForceBreakdown } from '../physics/types';

type ForceKey = 'gravity' | 'drag' | 'magnus' | 'ssw' | 'wake';
const FORCE_KEYS: ForceKey[] = ['gravity', 'drag', 'magnus', 'ssw', 'wake'];

/** 비행 모드 — 공이 궤적을 따라 이동하며 현재 시점의 힘 벡터를 실시간 표시 */
export function FlightBall() {
  const result = useSimulationStore((s) => s.result);
  const restartNonce = useSimulationStore((s) => s.restartNonce);
  const pitch = useSimulationStore((s) => s.pitch);

  const ballRef = useRef<THREE.Group>(null);
  const spinGroupRef = useRef<THREE.Group>(null);
  const streamRef = useRef<THREE.Group>(null);
  const wakeRef = useRef<THREE.Mesh>(null);
  const timeRef = useRef(0);

  const arrows = useMemo(() => {
    const make = (color: string) => {
      const a = new THREE.ArrowHelper(
        new THREE.Vector3(0, 1, 0),
        new THREE.Vector3(),
        0.3,
        new THREE.Color(color).getHex(),
        0.08,
        0.045,
      );
      a.visible = false;
      return a;
    };
    return {
      gravity: make(FORCE_COLORS.gravity),
      drag: make(FORCE_COLORS.drag),
      magnus: make(FORCE_COLORS.magnus),
      ssw: make(FORCE_COLORS.ssw),
      wake: make(FORCE_COLORS.wake),
      velocity: make(FORCE_COLORS.velocity),
    };
  }, []);

  useEffect(() => {
    timeRef.current = 0;
  }, [restartNonce, result]);

  useFrame((_, delta) => {
    const st = useSimulationStore.getState();
    const res = st.result;
    if (!res || res.trajectory.points.length < 2) return;

    const pts = res.trajectory.points;
    const flightEnd = pts[pts.length - 1].t;

    if (st.playing) {
      timeRef.current += delta * st.playbackRate;
      if (timeRef.current > flightEnd + 0.25) timeRef.current = 0;
    }
    const t = Math.min(timeRef.current, flightEnd);

    const idx = Math.min(pts.length - 2, Math.max(0, Math.floor(t / SAMPLE_INTERVAL)));
    const p0 = pts[idx];
    const p1 = pts[idx + 1];
    const alpha = Math.min(1, Math.max(0, (t - p0.t) / Math.max(1e-6, p1.t - p0.t)));

    const px = p0.position.x + (p1.position.x - p0.position.x) * alpha;
    const py = p0.position.y + (p1.position.y - p0.position.y) * alpha;
    const pz = p0.position.z + (p1.position.z - p0.position.z) * alpha;

    if (ballRef.current) ballRef.current.position.set(px, py, pz);
    if (streamRef.current) streamRef.current.position.set(px, py, pz);

    // 공 회전 (스핀축 기준)
    if (spinGroupRef.current && st.playing) {
      const axis = computeSpinAxis(res.params);
      const angle = rpmToRadS(res.params.spinRpm) * delta * st.playbackRate;
      spinGroupRef.current.rotateOnWorldAxis(
        new THREE.Vector3(axis.x, axis.y, axis.z),
        angle,
      );
    }

    // 힘 벡터 업데이트
    const aero = st.aero;
    const showFlags: Record<ForceKey, boolean> = {
      gravity: aero.showGravity,
      drag: aero.showDrag,
      magnus: aero.showMagnus,
      ssw: aero.showSSW,
      wake: aero.showSSW,
    };
    const origin = new THREE.Vector3(px, py, pz);

    for (const key of FORCE_KEYS) {
      const arrow = arrows[key];
      const force = p0.forces[key as keyof ForceBreakdown];
      const mag = force.length();
      const len = forceArrowLength(mag, aero.vectorScale);
      const visible = aero.enabled && showFlags[key] && len >= 0.02;
      arrow.visible = visible;
      if (visible) {
        arrow.position.copy(origin);
        arrow.setDirection(new THREE.Vector3(force.x / mag, force.y / mag, force.z / mag));
        arrow.setLength(len, Math.min(0.09, len * 0.3), 0.04);
      }
    }

    // 속도 벡터
    const vArrow = arrows.velocity;
    const speed = p0.speed;
    const vLen = velocityArrowLength(speed, aero.vectorScale);
    vArrow.visible = aero.enabled && aero.showVelocity && vLen >= 0.02;
    if (vArrow.visible) {
      const vDir = p0.velocity.div(speed);
      vArrow.position.copy(origin);
      vArrow.setDirection(new THREE.Vector3(vDir.x, vDir.y, vDir.z));
      vArrow.setLength(vLen, Math.min(0.09, vLen * 0.3), 0.04);
    }

    // 웨이크 원뿔
    if (wakeRef.current) {
      const visible = aero.enabled && aero.showWake;
      wakeRef.current.visible = visible;
      if (visible) {
        const { position, quaternion } = wakeTransform(
          { ...p0, position: new Vec3(px, py, pz) },
          0.5,
        );
        wakeRef.current.position.copy(position);
        wakeRef.current.quaternion.copy(quaternion);
      }
    }

    // 기류선
    if (streamRef.current) {
      streamRef.current.visible =
        useSimulationStore.getState().aero.enabled &&
        useSimulationStore.getState().aero.showStreamlines;
    }
  });

  if (!result) return null;

  return (
    <group>
      <group ref={ballRef}>
        <group ref={spinGroupRef}>
          <BallMesh
            seamOrientationDeg={pitch.seamOrientationDeg}
            seamLatitudeDeg={pitch.seamLatitudeDeg}
          />
        </group>
      </group>
      {Object.values(arrows).map((a, i) => (
        <primitive key={i} object={a} />
      ))}
      <mesh ref={wakeRef} visible={false}>
        <coneGeometry args={[0.1, 0.5, 14, 1, true]} />
        <meshBasicMaterial
          color="#94a3b8"
          transparent
          opacity={0.22}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
      <group ref={streamRef} visible={false}>
        <Streamlines position={[0, 0, 0]} />
      </group>
    </group>
  );
}
