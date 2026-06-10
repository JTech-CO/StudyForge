# StudyForge 기술 백서 (Technical Whitepaper)

**버전**: 1.0
**작성일**: 2026년 06월 08일
**작성자**: Bryan (JTech-CO)
**참고 문서**: HARNESS.md v1, 디자인 백서 v1.0

> `StudyForge`는 작업용 코드네임이며 최종 제품명은 교체 가능. 원본 서비스명·로고·고유 카피·UI 에셋은 일절 사용하지 않는다.

## 1. 프로젝트 개요 (Project Overview)
### 1.1. 프로젝트 명
**StudyForge** — 학습 자료 생성기 (오픈소스, BYOK)

### 1.2. 목적 (Purpose)
강의·문서·영상·녹음 등 이질적 입력을 받아, **학습자 수준에 맞춘 깊이**로 구조화 노트·마인드맵·퀴즈·플래시카드·팟캐스트를 자동 생성하고 **Notion 호환 Markdown**으로 내보내는 클라이언트 우선 웹앱을 구축한다.
- 기존 SaaS의 인위적 제약(일 3개 / 자료 1개 / 3MB / 녹음 15분 / 퀴즈·팟캐스트·내보내기 유료 잠금)을 **셀프호스팅 + BYOK**로 제거한다. 한도는 오직 사용자 자신의 Gemini 쿼터.
- 서버 운영 비용 0을 목표로 하며, 공유 링크 등 서버가 필요한 기능만 선택적 서버리스로 분리한다.

### 1.3. 핵심 차별점 (Key Differentiators)
1.  **코드 인식 & 하이라이팅**: 노트 생성 시 코드를 언어 태그가 붙은 펜스 블록으로 보존하고 Shiki(VS Code 테마)로 렌더 → 개발 학습 자료에서 경쟁 도구 대비 강점.
2.  **벤더 추상화 (어댑터)**: 텍스트·구조화 생성은 `LLMProvider` 인터페이스 뒤에 두어 Gemini→Claude/OpenAI 교체 가능. 전사·TTS는 `MediaProvider`로 분리해 벤더 락인 회피.
3.  **클라이언트 우선 + 우아한 강등**: BYOK 정적 배포로 서버 없이 전 기능(공유 제외) 동작. 공유 링크만 선택적 Cloudflare Worker, 미설정 시 MD/PNG 내보내기로 자연 강등.

## 2. 상세 기능 요구사항 (Detailed Requirements)

### 2.1. 시스템 환경 및 인터페이스 (System & Interface)
- **뷰 모드 (View Mode)**: Mobile-first Fluid Layout. 콘텐츠 리딩 영역은 `max-width: 72ch`. 데스크톱은 좌측 고정 사이드바 + 메인 2단, 모바일은 사이드바를 드로어로 전환.
- **테마 정책 (Theme Policy)**: CSS Variables(`tokens.css`) 기반 Light / Dark / System Preference. 헤더 토글로 수동 전환, 선택은 localStorage 저장.
- **브라우저 호환성**: Chrome / Safari / Edge 최신 버전 (IE 미지원).

### 2.2. 사용자 상호작용 로직 (Interaction Logic)
- **이벤트 처리 (Event Handling)**:
  - **Input**: 파일 드롭/선택, 유튜브 URL 입력(디바운스 검증), 텍스트 직접 입력. 투입 시점에 **깊이(입문/중급/심화)** 선택과 **산출물 On/Off 토글**을 함께 확정.
  - **Action**: 생성 트리거 시 토글된 산출물만 비동기 fan-out. 산출물별 진행 상태(스텝/스피너) 노출, 부분 실패는 격리(한 산출물 실패가 전체를 막지 않음).
- **데이터 검증 (Validation)**:
  - 클라이언트: 파일 MIME/크기, URL 형식, API 키 존재 여부.
  - 출력: Gemini `responseSchema`로 구조화 출력(JSON) 강제 + 파싱 실패 시 리페어 재시도.

### 2.3. 데이터 모델 (Data Model)
1.  **SourceContext**: `id(UUID)`, `kind(Enum: text|pdf|docx|hwp|hwpx|txt|md|youtube|audio|video)`, `title(String)`, `text?(String)`(문서류 추출 텍스트), `mediaRef?({ youtubeUrl?, fileUri?, mimeType? })`(미디어류), `meta?(Object)`.
2.  **Notebook**: `id(UUID)`, `title(String)`, `sources(SourceContext meta[])`, `artifacts(Artifacts)`, `createdAt(ISO)`.
3.  **Artifacts**: `notes?({ summaryMd, detailedMd })`, `mindmapMd?(String)`, `quiz?(QuizItem[])`, `flashcards?(Flashcard[])`, `podcast?({ turns: PodcastTurn[], audioRef })`.
4.  **QuizItem**: `type(mcq|short|truefalse)`, `question`, `options?(String[])`, `answer`, `explanation`. **Flashcard**: `front`, `back`. **PodcastTurn**: `speaker(A|B)`, `text`.

### 2.4. 출력 및 성능 기준 (Output & Performance)
- **결과물 형식**: Markdown(복사 / Notion 붙여넣기), PNG(노트 뷰 캡처), WAV/MP3(팟캐스트), 공유 URL(KV 저장 시).
- **품질 기준 (QA Standards)**:
  - 초기 로딩(LCP): 정적 셸 기준 2.5초 이내. 무거운 렌더러(Mermaid/Shiki/markmap)는 동적 import로 지연 로드.
  - 견고성: 산출물 1개 실패가 앱 전체를 깨지 않음(블록 단위 격리).
  - 반응형: 모바일에서 콘텐츠 가로 스크롤 발생 0.

## 3. 기술 스택 및 라이브러리 (Tech Stack)

### 3.1. Core
- **Frontend**: React 18, TypeScript 5, Vite. *(플레인 JS 선호 시 전환 가능하나, 어댑터 타입 안전성·공개 레포 리뷰 가치로 TS 권장.)*
- **Backend**: 없음(클라이언트 우선). 공유 링크 한정 **Cloudflare Workers**(선택).
- **Database**: 브라우저 **IndexedDB**(노트북 영속), **localStorage**(설정/API 키), 공유 시 **Cloudflare KV**.
- **AI**: Google **Gemini** — 생성 + 전사 + 멀티스피커 TTS. 텍스트 생성부는 어댑터로 교체 가능.

### 3.2. Libraries & Tools
1.  **@google/genai (Gemini SDK)** (필수)
    - **용도**: 텍스트·구조화 생성, 유튜브 URL/오디오/영상 네이티브 입력, File API 업로드, 멀티스피커 TTS.
    - **설정 값**: `responseSchema`로 JSON 강제, 생성=Flash 계열 / 심화 노트=Pro 계열, TTS=멀티스피커.
2.  **zustand + immer** (필수) — 전역 상태 관리.
3.  **react-router-dom** (필수) — 라우팅(`/`, `/notebook/:id`, `/share/:id`).
4.  **react-markdown + remark-gfm** (필수) — 마크다운 렌더 + GFM 표.
5.  **katex + rehype-katex** (필수) — LaTeX 수식.
6.  **shiki** (필수) — 언어별 코드 문법 하이라이팅(차별점 1).
7.  **mermaid** (필수) — 순서도·시퀀스·기본 차트(`xychart-beta`).
8.  **markmap-lib + markmap-view** (필수) — 마인드맵.
9.  **pdfjs-dist / mammoth** (필수) — PDF / DOCX 텍스트 추출.
10. **fflate(또는 jszip) + hwp.js** (선택) — HWPX unzip 파싱 / HWP5 best-effort.
11. **idb(또는 dexie)** (필수) — IndexedDB 래퍼.
12. **html-to-image** (필수) — 노트 PNG 내보내기.
13. **tailwindcss** (필수) — 스타일링(디자인 토큰 한정, 임의값 금지).

> 버전은 구현 시점 공식 문서로 재확인. Gemini 모델 문자열은 변동 가능하므로 하드코딩 전 검증.

## 4. 아키텍처 및 로직 (Architecture & Logic)

### 4.1. 상태 관리 전략 (State Management)
- **Scope**: 전역 = `sources`, 현재 `notebook`, `settings`(apiKey/depth/locale/toggles/voices). 지역 = UI 토글·모달 상태.
- **Tool**: Zustand Store + Custom Hooks(`useGeneration`, `useNotebook` 등). 영속은 `persist` 레이어가 IndexedDB/localStorage와 동기화.

```javascript
// 상태 관리 스키마 예시 (src/lib/store)
const useStore = create((set, get) => ({
  sources: [],
  notebook: null,
  settings: { apiKey: '', depth: 'intermediate', locale: 'ko', toggles: {} },
  isGenerating: false,
  generate: async () => {
    set({ isGenerating: true });
    const { sources, settings } = get();
    const artifacts = await orchestrate(sources, settings); // 토글 기반 fan-out
    set({ notebook: { ...get().notebook, artifacts }, isGenerating: false });
  },
}));
```

### 4.2. 주요 동작 파이프라인 (Main Workflow)
1.  **초기화 (Init)**: localStorage에서 키·설정·테마 복원, IndexedDB에서 노트북 목록 로드.
2.  **인제스트 (Ingest)**: 소스별 정규화 — 문서류는 클라이언트 텍스트 추출, 유튜브는 URL 래핑, 오디오/영상은 Gemini File API 업로드 → `SourceContext`.
3.  **생성 (Process)**: 깊이 + 토글 → `orchestrator`가 선택 산출물만 병렬 호출 → `responseSchema` 검증 → 실패 시 리페어.
4.  **렌더/갱신 (Update)**: 스토어 반영 후 IndexedDB 저장, 산출물 탭 렌더. 영속 데이터 변경은 즉시 반영.
5.  **내보내기 (Export)**: MD 복사 / 노트 PNG / 공유 링크(서버리스 설정 시).

### 4.3. 핵심 알고리즘 (Core Algorithms)
- **산출물 오케스트레이션**: 토글된 Provider 메서드만 `Promise.allSettled`로 병렬 실행, 부분 실패 격리, 항목별 재시도 정책.
- **미디어 라우팅**: `SourceContext.mediaRef` 존재 시 텍스트 대신 미디어 파트를 Gemini에 직접 전달(별도 전사 단계 생략). 유튜브 URL은 `fileData`로 래핑(다운로드 없음).
- **구조화 출력 검증·리페어**: `responseSchema` 강제 → 파싱 실패 시 "JSON만 반환" 리페어 프롬프트 1회 재시도.
- **TTS 청크·스티칭**: 대담 스크립트를 턴 단위로 분할 합성한 뒤 오디오 결합(길이 한계 회피).
- **블록 격리 렌더**: LaTeX/Mermaid/코드 블록을 개별 try/catch로 감싸 렌더 실패 시 해당 블록만 코드 폴백(앱 전체 안전).

## 5. UI 구현 가이드 (Implementation Guide)
*디자인 백서와 동일한 토큰을 사용한다(단일 출처: `src/styles/tokens.css`).*

### 5.1. 디자인 토큰 (Design Tokens)
- **Colors**: `--bg` (#fafafa / dark #09090b), `--fg` (#18181b / dark #f4f4f5), `--muted` (#71717a), `--border` (#e4e4e7 / dark #27272a), `--accent` (#2563eb, blue-600), `--success` (#059669, emerald-600), `--error` (#e11d48, rose-600)
- **Typography**: 본문 `Pretendard`(또는 `Inter`), 코드 `ui-monospace`, Base Size `1rem` / line-height `1.7`
- **Breakpoints**: Mobile(`<640px`), Tablet(`768px`), Desktop(`1024px`)
- **Radius**: `0.5rem` (카드/버튼/입력 동일)

### 5.2. 공통 컴포넌트 (Shared Components)
- **Button**: `variant`(primary / ghost / danger), `size`, `disabled`, `loading`.
- **Modal**: React Portal 사용, focus trap + ESC 닫기, `z-index` 토큰 관리. (API 키 입력·설정에 사용.)
- **Tabs**: 산출물 전환(노트 / 마인드맵 / 퀴즈 / 플래시카드 / 팟캐스트).
- **Card**: 토큰 기반 보더·패딩, 그림자 최소.

## 6. 파일 구조 (File Structure)
*정본(canonical) 트리. 디자인 백서 §6과 완전히 동일하며, 두 백서·하네스가 이 구조를 공유한다.*

```text
studyforge/
├── CLAUDE.md                        # 작업 규약 (하네스 §8)
├── HARNESS.md                       # 개발 하네스
├── README.md                        # BYOK 설정 가이드
├── .env.example                     # VITE_GEMINI_API_KEY 등 (값 비움)
├── index.html
├── public/
│   └── favicon.svg
├── src/
│   ├── main.tsx
│   ├── App.tsx                      # 셸 + 라우팅
│   ├── pages/
│   │   ├── Home.tsx                 # 인제스트 + 노트북 목록
│   │   ├── Notebook.tsx             # 산출물 탭 뷰
│   │   └── Share.tsx                # 읽기 전용 공유 뷰
│   ├── components/
│   │   ├── layout/                  # Sidebar, Drawer, Header, Container
│   │   ├── ingest/                  # SourceDropzone, YoutubeInput, DepthSelector, ArtifactToggles
│   │   ├── render/                  # MarkdownView, MindMap, Quiz, Flashcards, PodcastPlayer
│   │   └── ui/                      # Button, Tabs, Card, Modal (원자 컴포넌트, 토큰 기반)
│   ├── hooks/                       # useNotebook, useGeneration, useApiKey, useTheme
│   ├── lib/
│   │   ├── ingest/                  # pdf.ts, docx.ts, hwp.ts, media.ts
│   │   ├── ai/                      # provider.ts, gemini.ts, prompts.ts, schemas.ts, orchestrator.ts
│   │   ├── store/                   # Zustand 스토어
│   │   ├── persist/                 # indexeddb.ts, settings.ts
│   │   └── export/                  # md.ts, image.ts, share.ts
│   ├── utils/                       # id.ts, format.ts, validate.ts
│   ├── types/                       # 공유 타입 (provider 타입 re-export)
│   └── styles/
│       ├── global.css               # reset + base
│       └── tokens.css               # 디자인 토큰 (단일 출처)
└── worker/                          # (선택) Cloudflare Worker — 공유 링크 KV
    ├── src/index.ts
    └── wrangler.toml
```

## 7. 개발 시 주의사항 (Implementation Notes)
1.  **보안 (Security)**:
    - API 키 하드코딩 금지. `.env.example`만 커밋하고, 사용자 키는 **브라우저(localStorage)에만** 저장하며 자체 서버로 전송하지 않는다(UI에 명시).
    - `react-markdown` 사용으로 `dangerouslySetInnerHTML`/`innerHTML`을 회피(XSS 살균). 외부 입력은 살균 처리.
    - 공유 링크에 PII를 넣지 않는다. 공유는 opt-in + 만료 옵션.
2.  **성능 최적화 (Optimization)**:
    - 라우트 및 무거운 렌더러(Mermaid/Shiki/markmap) 코드 스플리팅(동적 import).
    - 대용량 미디어는 Gemini File API resumable 업로드. 생성 결과는 IndexedDB 캐시로 재생성 방지.
    - 불필요한 리렌더 방지(`useMemo`/`useCallback`), 산출물별 메모이즈.
3.  **이슈 대응 (Known Issues)**:
    - **HWP5** 텍스트 추출 한계 → "PDF/HWPX로 변환 후 재업로드" 강등 안내(HWPX는 정식 지원).
    - **유튜브** 비공개/지역제한/쿼터 초과 → 사유 메시지 + "파일 업로드" 대안.
    - **TTS** 입력 길이 한계 → 턴 단위 청크 후 스티칭.
    - **iOS Safari** `100vh` 스크롤 버그 → `dvh` 단위 사용.
    - **Gemini 모델 문자열** 변동 → 구현 시 공식 문서 확인.
