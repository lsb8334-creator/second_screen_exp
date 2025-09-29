
# 세컨드 스크린 × 광고형식 × 타이밍 — 온라인 실험 스타터 (jsPsych)

이 폴더는 석사 논문용 2×2×2 혼합 설계를 온라인에서 빠르게 구현할 수 있도록 만든 **스타터 키트**입니다.

## 어디서 어떻게 실행하나요?
1) 이 폴더를 통째로 내려받아 압축을 푼 뒤, 로컬에서 `index.html`을 더블클릭(개발 테스트) 하거나  
2) GitHub Pages, Netlify, Vercel 등 **정적 호스팅**에 업로드하세요. (서버/백엔드 불필요)

## URL 파라미터
- `pid` : 참가자 ID (예: `?pid=S001` 없으면 자동 생성)
- `cond`: 세컨드 스크린 조건(0=OFF, 1=ON) (예: `?cond=1`)

예) `https://yourdomain.com/index.html?pid=S001&cond=1`

## 자극 교체
- `assets/` 폴더에 **MP4** 하이라이트를 넣고, `script.js`의 `STIM_LIST`와 파일명 규칙을 맞추세요:  
  예) `BKB_001_arousal_incontent.mp4`, `BKB_001_calm_popup.mp4` 등
- 실제 실험에서는 타임코드에 맞춰 광고 오버레이 타이밍을 조정하세요(`playStim` 함수의 schedule 부분).

## 데이터 저장
- 기본은 **브라우저 로컬 저장(JSON)** 입니다. 실제 연구에선 서버 업로드나 Qualtrics 파이프를 권장합니다.

## 라이선스
- 연구용. 브랜드/로고/영상 저작권에 유의하세요.
