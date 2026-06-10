# StudyForge

> **강의·문서·영상·녹음을 넣으면 노트·마인드맵·퀴즈·플래시카드·팟캐스트를 자동 생성하는 BYOK 학습 자료 생성기.**

## 1. 소개 (Introduction)

StudyForge는 강의 자료·문서·영상·녹음을 넣으면 **구조화 노트, 마인드맵, 퀴즈, 플래시카드, 2인 팟캐스트**를 학습자 수준에 맞춰 자동 생성하는 웹 애플리케이션입니다.

모든 생성은 **여러분의 Google Gemini API 키(BYOK)**로 브라우저에서 직접 이뤄져 별도 서버 비용이 없으며, 산출물은 Notion 호환 Markdown·PNG·공유 링크로 내보낼 수 있습니다. UI는 한국어/영어를 지원합니다.

**주요 기능**
- **인제스트(6종 소스)**: 텍스트 · PDF · DOCX · HWPX · HWP · TXT · MD · 유튜브 · 오디오 · 영상
- **생성**: 노트(요약/상세 · 깊이 3단계) · 마인드맵 · 퀴즈(채점) · 플래시카드 · 팟캐스트(멀티스피커 TTS). LaTeX · 언어별 코드 하이라이팅 · Mermaid 다이어그램 렌더
- **편집**: 노트북 제목과 노트·마인드맵을 마크다운으로 직접 편집(편집/미리보기 토글)
- **공유**: **읽기 전용 / 편집 가능** 중 선택, 8자리 코드(`/notebook/<code>`)로 다른 기기에서 열람. 편집 가능은 받는 사람이 자기 보관함에 사본을 저장해 편집(원본 불변)
- **로컬 보관**: 생성한 노트북을 브라우저(IndexedDB)에 저장 → 재방문 시 유지

## 2. 기술 스택 (Tech Stack)

- **Frontend**: React 19 · Vite 8 · TypeScript 6 · Tailwind CSS 4 · React Router 7
- **AI**: Google Gemini (생성 · 전사 · 멀티스피커 TTS) — `LLMProvider` 어댑터로 추상화(벤더 교체 가능)
- **렌더링**: react-markdown · KaTeX · Shiki · Mermaid · markmap
- **State Management**: Zustand 5 + immer
- **영속 · 내보내기**: idb(IndexedDB) · html-to-image
- **Backend (선택)**: Cloudflare Worker + KV — 공유 링크(30일 TTL)
- **Deployment**: GitHub Pages(앱) + Cloudflare Workers(공유)

## 3. 설치 및 실행 (Quick Start)

**요구 사항**: Node.js 20 이상

1. **설치 (Install)**
   ```bash
   git clone <레포지토리 URL>
   cd studyforge
   npm install
   ```

2. **환경 변수 (Environment)**
   `.env.example`를 `.env`로 복사합니다. **Gemini API 키는 `.env`가 아니라 앱 설정(⚙)에서 입력**하며, 키는 **이 브라우저(localStorage)에만 저장**되고 자체 서버로 전송되지 않습니다(BYOK · [키 발급](https://aistudio.google.com/apikey)).
   ```bash
   # .env — 아래 항목은 선택 사항
   VITE_SHARE_WORKER_URL=   # 공유 링크용 Cloudflare Worker 주소 (미설정 시 공유 버튼 숨김 → MD/PNG 내보내기로 강등)
   ```

3. **실행 (Run)**
   ```bash
   npm run dev        # 개발 서버 (http://localhost:5173)
   npm run build      # 타입체크 + 프로덕션 빌드 (dist/)
   npm run preview    # 빌드 결과 미리보기
   ```

## 4. 폴더 구조 (Structure)

```text
src/
├── pages/          # Home · Notebook (로컬·공유 통합 라우트)
├── components/     # layout · ingest · render · ui
├── hooks/          # useTheme · useApiKey · useT(i18n) 등
├── lib/
│   ├── ingest/     # pdf · docx · hwp · media → SourceContext
│   ├── ai/         # provider(어댑터) · gemini · prompts · schemas · orchestrator
│   ├── render/     # shiki
│   ├── export/     # md · image · share
│   ├── persist/    # indexeddb
│   ├── i18n/       # strings (ko/en)
│   └── store/      # Zustand 스토어
├── utils/          # id · validate · cx
└── styles/         # tokens.css · global.css
worker/             # (선택) Cloudflare Worker — 공유 링크 KV
```

## 5. 정보 (Info)

- **License**: [MIT](LICENSE)
- **Author**: Bryan (JTech-CO)
- **Contact**: [jtech-bryan@proton.me](mailto:jtech-bryan@proton.me) · GitHub Issues
