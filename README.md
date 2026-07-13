# StudyForge

> **강의·문서·영상·녹음을 넣으면 노트·마인드맵·퀴즈·플래시카드·팟캐스트를 자동 생성하는 BYOK 학습 자료 생성기.**

## 1. 소개 (Introduction)

StudyForge는 강의 자료·문서·영상·녹음을 넣으면 **구조화 노트, 마인드맵, 퀴즈, 플래시카드, 2인 팟캐스트**를 학습자 수준에 맞춰 자동 생성하는 웹 애플리케이션입니다.

텍스트 산출물은 **Google Gemini, OpenAI, Anthropic Claude, xAI Grok 또는 사용자 컴퓨터의 OpenAI 호환 로컬 AI** 중 하나를 선택해 생성합니다. 키와 토큰은 브라우저에만 저장되고 선택한 제공자에게 직접 전송됩니다. 유튜브·오디오·영상 원본 처리와 팟캐스트 음성 합성은 Gemini를 사용합니다. 산출물은 Notion 호환 Markdown·PNG·공유 링크로 내보낼 수 있으며 UI는 한국어/영어를 지원합니다.

**주요 기능**
- **인제스트(6종 소스)**: 텍스트 · PDF · DOCX · HWPX · HWP · TXT · MD · 유튜브 · 오디오 · 영상
- **생성**: 노트(요약/상세 · 깊이 3단계) · 마인드맵 · 퀴즈(채점) · 플래시카드 · 팟캐스트(멀티스피커 TTS). LaTeX · 언어별 코드 하이라이팅 · Mermaid 다이어그램 렌더
- **편집**: 노트북 제목과 노트·마인드맵을 마크다운으로 직접 편집(편집/미리보기 토글)
- **공유**: **읽기 전용 / 편집 가능** 중 선택, 8자리 코드(`/notebook/<code>`)로 다른 기기에서 열람. 편집 가능은 받는 사람이 자기 보관함에 사본을 저장해 편집(원본 불변)
- **로컬 보관**: 생성한 노트북을 브라우저(IndexedDB)에 저장 → 재방문 시 유지

## 2. 기술 스택 (Tech Stack)

- **Frontend**: React 19 · Vite 8 · TypeScript 6 · Tailwind CSS 4 · React Router 7
- **AI**: Google Gemini · OpenAI · Anthropic · xAI · OpenAI 호환 로컬 AI(Ollama/LM Studio). 생성은 `LLMProvider` 어댑터, Gemini 미디어/TTS는 `MediaProvider`로 분리
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
   `.env.example`를 `.env`로 복사합니다. **AI API 키는 `.env`가 아니라 앱 설정(⚙)에서 제공자별로 입력**합니다. 키는 이 브라우저(`localStorage`)에만 저장되고, 키와 생성에 사용한 자료는 StudyForge 서버가 아닌 선택한 제공자 API로 직접 전송됩니다. 브라우저 확장 프로그램이나 XSS가 로컬 저장소를 읽을 수 있으므로 공용 기기에서는 키를 저장하지 마세요.
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

4. **AI 제공자 설정**
   앱 우측 상단 설정에서 제공자, API 키, 모델 ID를 입력하고 **연결 확인 및 모델 조회**를 실행합니다. 권장 모델 외에도 제공자가 지원하는 모델 ID를 직접 입력할 수 있습니다.

   - [Google AI Studio](https://aistudio.google.com/apikey)
   - [OpenAI API Keys](https://platform.openai.com/api-keys)
   - [Anthropic Console](https://console.anthropic.com/settings/keys)
   - [xAI Console](https://console.x.ai/)

5. **로컬 AI (선택)**
   OpenAI 호환 `/v1/chat/completions`와 `/v1/models`를 제공하는 서버를 사용할 수 있습니다.

   **Ollama**
   ```powershell
   ollama pull gemma3
   setx OLLAMA_ORIGINS "http://localhost:5173,https://jtech-co.github.io"
   ```
   Ollama를 다시 시작한 뒤 제공자를 **Local AI**, 엔드포인트를 `http://127.0.0.1:11434/v1`, 모델을 `gemma3`로 설정합니다. 다른 배포 도메인을 사용하면 그 origin도 `OLLAMA_ORIGINS`에 추가합니다.

   **LM Studio**
   Developer 화면에서 서버를 시작하고 **Enable CORS**를 켠 뒤 엔드포인트를 `http://127.0.0.1:1234/v1`로 설정합니다. 인증을 켠 경우에만 API 토큰을 입력합니다.

   로컬 모델은 텍스트가 추출된 문서·직접 입력 자료를 처리합니다. 유튜브·오디오·영상 원본과 팟캐스트 음성 합성에는 별도의 Gemini 키가 필요합니다. HTTPS로 배포된 앱에서 localhost 연결이 차단되면 로컬 서버의 CORS·Private Network Access 설정을 확인하세요.

## 4. 폴더 구조 (Structure)

```text
src/
├── pages/          # Home · Notebook (로컬·공유 통합 라우트)
├── components/     # layout · ingest · render · ui
├── hooks/          # useTheme · useApiKey · useT(i18n) 등
├── lib/
│   ├── ingest/     # pdf · docx · hwp · media → SourceContext
│   ├── ai/         # Gemini · OpenAI · Anthropic · xAI · 로컬 어댑터, prompts · schemas
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
