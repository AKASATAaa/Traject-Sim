/** 불변(immutable) 3D 벡터 — 모든 연산은 새 인스턴스를 반환 */
export class Vec3 {
  constructor(
    public readonly x = 0,
    public readonly y = 0,
    public readonly z = 0,
  ) {}

  add(v: Vec3): Vec3 {
    return new Vec3(this.x + v.x, this.y + v.y, this.z + v.z);
  }

  sub(v: Vec3): Vec3 {
    return new Vec3(this.x - v.x, this.y - v.y, this.z - v.z);
  }

  mul(s: number): Vec3 {
    return new Vec3(this.x * s, this.y * s, this.z * s);
  }

  div(s: number): Vec3 {
    return new Vec3(this.x / s, this.y / s, this.z / s);
  }

  dot(v: Vec3): number {
    return this.x * v.x + this.y * v.y + this.z * v.z;
  }

  cross(v: Vec3): Vec3 {
    return new Vec3(
      this.y * v.z - this.z * v.y,
      this.z * v.x - this.x * v.z,
      this.x * v.y - this.y * v.x,
    );
  }

  lengthSq(): number {
    return this.x * this.x + this.y * this.y + this.z * this.z;
  }

  length(): number {
    return Math.sqrt(this.lengthSq());
  }

  normalize(): Vec3 {
    const len = this.length();
    return len > 1e-12 ? this.div(len) : new Vec3(0, 0, 0);
  }

  toArray(): [number, number, number] {
    return [this.x, this.y, this.z];
  }

  static readonly ZERO = new Vec3(0, 0, 0);
}
