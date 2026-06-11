import { Vec3 } from '../utils/vector3';

export interface BodyState {
  position: Vec3;
  velocity: Vec3;
}

type AccelFn = (t: number, velocity: Vec3) => Vec3;

/**
 * 4차 Runge-Kutta 적분 한 스텝.
 * 가속도는 위치에 무관(중력 상수 + 속도 의존 공기력)하므로 velocity만 인자로 받는다.
 */
export function rk4Step(t: number, state: BodyState, dt: number, accel: AccelFn): BodyState {
  const { position: p, velocity: v } = state;

  const a1 = accel(t, v);
  const v1 = v;

  const v2 = v.add(a1.mul(dt / 2));
  const a2 = accel(t + dt / 2, v2);

  const v3 = v.add(a2.mul(dt / 2));
  const a3 = accel(t + dt / 2, v3);

  const v4 = v.add(a3.mul(dt));
  const a4 = accel(t + dt, v4);

  const position = p.add(
    v1.add(v2.mul(2)).add(v3.mul(2)).add(v4).mul(dt / 6),
  );
  const velocity = v.add(
    a1.add(a2.mul(2)).add(a3.mul(2)).add(a4).mul(dt / 6),
  );

  return { position, velocity };
}
