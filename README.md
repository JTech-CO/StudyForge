# StudyForge

> 강의·문서·영상·녹음을 구조화된 학습 자료로 변환하는 오픈소스 BYOK 학습 자료 생성기

[![Deploy to GitHub Pages](https://github.com/JTech-CO/StudyForge/actions/workflows/deploy.yml/badge.svg)](https://github.com/JTech-CO/StudyForge/actions/workflows/deploy.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-111827.svg)](LICENSE)

[라이브 데모](https://jtech-co.github.io/StudyForge/) · [개인정보처리방침](https://jtech-co.github.io/StudyForge/privacy/) · [이용약관](https://jtech-co.github.io/StudyForge/terms/)

## 1. 소개 (Introduction)

StudyForge는 텍스트, 문서, 유튜브, 오디오 및 영상을 입력하면 학습자 수준에 맞춘 **노트, 마인드맵, 퀴즈, 플래시카드, 2인 팟캐스트**를 생성하는 React 웹 애플리케이션입니다.

텍스트 산출물은 **Google Gemini, OpenAI, Anthropic Claude, xAI Grok 또는 OpenAI 호환 로컬 AI** 중 하나를 선택해 생성합니다. API 키와 토큰은 브라우저의 `localStorage`에만 저장되며, 생성 요청은 StudyForge 서버를 거치지 않고 선택한 AI 제공자에게 직접 전송됩니다.

### 주요 기능

- **10종 입력**: 직접 입력, PDF, DOCX, HWP, HWPX, TXT, Markdown, YouTube, 오디오, 영상
- **5종 산출물**: 요약·상세 노트, 마인드맵, 채점형 퀴즈, 플래시카드, 멀티스피커 팟캐스트
- **풍부한 렌더링**: GFM, LaTeX, 코드 하이라이팅, Mermaid 다이어그램, markmap
- **노트북 편집**: 제목, 노트 및 마인드맵 Markdown 편집과 미리보기
- **로컬 보관**: IndexedDB에 노트북 저장, 재방문 시 복원
- **내보내기**: Notion 호환 Markdown 복사, 노트 PNG 저장
- **선택적 공유**: 읽기 전용 또는 편집 가능한 Fork 사본을 8자리 코드로 공유
- **반응형·다국어 UI**: 모바일, 태블릿, 데스크톱 및 한국어·영어 지원

### AI 지원 범위

| 기능 | Gemini | OpenAI | Anthropic | xAI | Local AI |
|---|:---:|:---:|:---:|:---:|:---:|
| 추출된 텍스트 기반 학습 자료 생성 | O | O | O | O | O |
| YouTube·오디오·영상 원본 처리 | O | - | - | - | - |
| 팟캐스트 음성 합성 | O | - | - | - | - |

> 공개 데모에는 현재 공유 Worker URL이 주입되지 않아 공유 버튼이 숨겨집니다. 자체 배포에서 Cloudflare Worker를 연결하면 공유 기능을 활성화할 수 있습니다.

## 2. 기술 스택 (Tech Stack)

- **Frontend**: React 19 · Vite 8 · TypeScript 6 · Tailwind CSS 4 · React Router 7
- **AI**: Google Gemini · OpenAI · Anthropic · xAI · OpenAI 호환 Local AI
- **Architecture**: 텍스트 생성용 `LLMProvider` · Gemini 미디어/TTS용 `MediaProvider`
- **Rendering**: react-markdown · KaTeX · Shiki · Mermaid · markmap
- **State & Persistence**: Zustand · immer · IndexedDB(idb)
- **Export**: html-to-image · Notion 호환 Markdown
- **Optional Backend**: Cloudflare Workers + KV, 공유 데이터 최대 30일 보관
- **Deployment**: GitHub Pages · GitHub Actions

## 3. 설치 및 실행 (Quick Start)

**요구 사항**: Node.js 22 LTS 권장

### 설치

```bash
git clone https://github.com/JTech-CO/StudyForge.git
cd StudyForge
npm install
npm run dev
```

개발 서버는 기본적으로 `http://localhost:5173`에서 실행됩니다.

### AI 제공자 설정

1. 앱 우측 상단의 설정을 엽니다.
2. AI 제공자와 모델을 선택합니다.
3. API 키를 입력하거나 Local AI 엔드포인트를 지정합니다.
4. **연결 확인 및 모델 조회**를 실행합니다.

API 키 발급:

- [Google AI Studio](https://aistudio.google.com/apikey)
- [OpenAI API Keys](https://platform.openai.com/api-keys)
- [Anthropic Console](https://console.anthropic.com/settings/keys)
- [xAI Console](https://console.x.ai/)

AI API 키는 `.env`에 넣지 않습니다. 브라우저 확장 프로그램이나 XSS가 로컬 저장소를 읽을 수 있으므로 공용 기기에서는 키를 저장하지 마세요.

### Local AI

OpenAI 호환 `/v1/chat/completions`와 `/v1/models`를 제공하는 Ollama 또는 LM Studio를 연결할 수 있습니다.

**Ollama**

```powershell
ollama pull gemma3
setx OLLAMA_ORIGINS "http://localhost:5173,https://jtech-co.github.io"
```

Ollama를 다시 시작한 뒤 제공자를 **Local AI**, 엔드포인트를 `http://127.0.0.1:11434/v1`, 모델을 `gemma3`로 설정합니다.

**LM Studio**

Developer 화면에서 서버를 시작하고 **Enable CORS**를 켠 뒤 엔드포인트를 `http://127.0.0.1:1234/v1`로 설정합니다. 인증을 활성화한 경우에만 API 토큰을 입력합니다.

HTTPS 배포 환경에서 로컬 서버 연결이 차단되면 CORS와 Private Network Access 설정을 확인하세요. 로컬 AI는 추출된 텍스트를 처리하며, 미디어 원본 처리와 팟캐스트 음성 합성에는 별도의 Gemini 키가 필요합니다.

### 선택적 공유 Worker

```bash
cd worker
npx wrangler kv namespace create SHARE_KV
# 출력된 namespace id를 worker/wrangler.toml에 입력
npx wrangler deploy
```

배포된 Worker 주소를 앱 빌드 환경에 지정합니다.

```bash
VITE_SHARE_WORKER_URL=https://<worker-name>.<account>.workers.dev
```

공유 링크는 8자리 코드로 생성되며 KV에서 최대 30일간 유지됩니다. 공유 코드는 인증 수단이 아니므로 민감한 자료는 공유하지 마세요.

### 검증 명령어

```bash
npm run typecheck  # 앱과 Worker TypeScript 검사
npm test           # Worker, AI 어댑터, UI 통합 테스트
npm run build      # 타입 검사 후 프로덕션 빌드
npm run preview    # 빌드 결과 미리보기
```

## 4. 폴더 구조 (Structure)

```text
StudyForge/
├── .github/workflows/   # GitHub Pages 배포
├── docs/                # 하네스, 기술·디자인 백서
├── src/
│   ├── components/      # layout · ingest · render · ui
│   ├── hooks/           # 테마, API 키, i18n 훅
│   ├── lib/
│   │   ├── ai/          # AI 제공자 어댑터, 프롬프트, 스키마
│   │   ├── export/      # Markdown, PNG, 공유
│   │   ├── i18n/        # UI 및 법적 문서 ko/en
│   │   ├── ingest/      # 문서·미디어 입력 처리
│   │   ├── persist/     # IndexedDB
│   │   ├── render/      # 코드 렌더링
│   │   └── store/       # Zustand 스토어
│   ├── pages/           # Home · Notebook · Legal
│   ├── styles/          # 디자인 토큰과 전역 스타일
│   └── utils/           # 검증 및 공용 유틸리티
└── worker/              # 선택적 Cloudflare 공유 Worker
```

## 5. 정보 (Info)

- **Live**: [jtech-co.github.io/StudyForge](https://jtech-co.github.io/StudyForge/)
- **Documentation**: [Harness](docs/HARNESS.md) · [기술 백서](docs/StudyForge_기술_백서.md) · [디자인 백서](docs/StudyForge_디자인_백서.md)
- **Legal**: [개인정보처리방침](https://jtech-co.github.io/StudyForge/privacy/) · [이용약관](https://jtech-co.github.io/StudyForge/terms/)
- **License**: [MIT](LICENSE)
- **Author**: Bryan · JTech-CO
- **Contact**: [jtech-bryan@proton.me](mailto:jtech-bryan@proton.me) · [GitHub Issues](https://github.com/JTech-CO/StudyForge/issues)

버그 제보와 개선 제안은 GitHub Issues를 이용해 주세요.
