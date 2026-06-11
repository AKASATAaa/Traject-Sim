# Traject — 고급 피칭 시뮬레이터

연구급 물리 모델로 야구 투구 궤적을 시뮬레이션하는 브라우저 3D 웹 앱입니다.

## 실행

```bash
npm install
npm run dev        # 개발 서버 (http://localhost:5173)
npm run validate   # 물리 벤치마크 검증
npm run build      # 프로덕션 빌드
```

## 물리 모델

모든 힘은 RK4(4차 Runge-Kutta, dt = 0.1ms)로 적분됩니다.

| 힘 | 모델 |
|------|------|
| 중력 | g = 9.80665 m/s² |
| 드래그 | Nathan(2016) — Cd(SP), 스핀 파라미터 의존 |
| 마그누스 | Cl = SP/(2.32·SP+0.4), Statcast IVB 실측 보정 |
| Seam-Shifted Wake | Barton Smith 계열 현상학 모델 — 시임 방위각·위도 의존, 저회전 증폭 |
| 웨이크 진동 | 너클볼 난류 — 시드 기반 quasi-periodic 횡력, rpm > 800에서 자동 소멸 |
| 환경 | ISA 기압고도 + Tetens 습도 보정 공기밀도 |

### 좌표계
- 원점: 투수판, +y 위, +z 홈플레이트 방향 (18.44 m)
- +x: 캐처 시점 우측
- 내부 계산 SI, UI 표시 미터법 (km/h, m, cm)

## 주요 기능

- **구종 프리셋 6종** — 4-Seam / Sinker / Slider / Curveball / Changeup / Knuckleball
- **릴리즈 조정** — 위치(좌우/높이/익스텐션), 릴리즈 각도, 구속
- **고급 속도 모드** — 초속 + 종속도 직접 지정 → dragScale 이분 탐색 역산
- **스핀 제어** — RPM, 스핀 효율(active spin), 스핀축 방향
- **시임/SSW** — 시임 방위각·위도로 Seam-Shifted Wake 제어
- **너클볼** — 웨이크 진동 + 다중 궤적 오버레이(편차 ± 표시), "다시 던지기"
- **공기역학 시각화 토글** — 힘 벡터(중력/드래그/마그누스/SSW/웨이크), 속도 벡터, 웨이크 원뿔, 기류선
- **표시 모드** — 정적(전 구간) / 비행(슬로모션 애니메이션)
- **환경** — 고도/기온/습도 (쿠어스 필드 프리셋 포함)
- **카메라** — 측면 / 캐처 / 투수 시점

## 기술 스택

Vite · React · TypeScript · Three.js (@react-three/fiber, drei) · Zustand · Tailwind CSS

## 검증 벤치마크 (`npm run validate`)

- 153 km/h, 2400rpm 백스핀 → IVB ≈ 42 cm, 감속 ≈ 9%
- 고도 1,600 m → 마그누스 약 18% 감소
- dragScale 역산 수렴 오차 < 0.5 km/h
- 너클볼 앙상블 HB 편차 ± ~9 cm
