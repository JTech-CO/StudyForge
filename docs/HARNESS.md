# StudyForge — 학습 자료 생성기 (오픈소스) · Claude Code 하네스 v1

> 강의·문서·영상·녹음을 넣으면 구조화 노트 / 마인드맵 / 퀴즈 / 플래시카드 / 팟캐스트를 자동 생성하는 BYOK 웹앱.
> `StudyForge`는 작업용 코드네임이며, 최종 레포/제품명은 자유롭게 교체할 것. **원본 서비스명·로고·고유 카피·UI 에셋은 일절 사용하지 않는다.**

---

## 0. 이 문서의 사용법 (Claude Code)

1. **섹션 8(작업 규약)을 그대로 `CLAUDE.md`로 복사**한 뒤 프로젝트 루트에 둔다. 이후 모든 세션은 그 규약을 따른다.
2. 작업은 **M0 → M6 순서로, 한 세션당 마일스톤 하나**만 진행한다. 게이트 통과 기준(섹션 6)을 충족하지 못하면 다음 마일스톤으로 넘어가지 않는다.
3. 막히면 섹션 7(실패 런북)을 먼저 확인하고, 거기에 없는 신규 결정은 사용자에게 묻는다.
4. 모델 문자열·라이브러리 최신 버전은 **구현 시점에 공식 문서로 재확인**한다. 이 문서의 버전 표기는 기준점일 뿐이다.

---

## 1. 프로젝트 개요 & 범위

### 미션
입력 자료(텍스트/문서/유튜브/오디오/영상)를 받아, **학습자 수준에 맞춘 깊이로** 노트·마인드맵·퀴즈·플래시카드·팟캐스트를 생성하고, **Notion에 바로 붙여넣을 수 있는 깔끔한 Markdown**으로 내보낸다. 전 기기 반응형, 안티-AI-클리셰 디자인.

### MVP (v1) 범위 — 빌드 대상
- **인제스트**: 텍스트 직접 입력, 파일 업로드(PDF / DOCX / HWPX / HWP(best-effort) / TXT / MD), 유튜브 링크, 오디오·영상 업로드
- **코어 노트**: 요약 버전 + 상세 버전, **깊이 3단계(입문/중급/심화)** 조절, LaTeX·표·코드블록·Mermaid 순서도/차트 포함
- **마인드맵**: 노트에서 파생한 인터랙티브 마인드맵
- **퀴즈**: 객관식/단답/참거짓 혼합, 채점 + 해설
- **플래시카드**: 앞/뒤 카드, 뒤집기 UI
- **팟캐스트(TTS)**: 2인 대담 스크립트 생성 → 멀티스피커 음성 합성 → 플레이어 + 다운로드
- **생성 토글**: 자료 투입 시점에 각 산출물 On/Off (Gemini 비용·시간 절약)
- **내보내기**: 산출물별 MD 복사, 노트 → PNG 이미지 저장, **공유 링크(읽기 전용)**
- **로컬 보관**: 생성한 노트북을 브라우저에 영속 저장(재방문 시 유지)

### 명시적 비범위 (v2+, 지금 만들지 않음)
- 이미지 생성(핵심 내용 → 일러스트), 강좌 어시스턴트(RAG 챗봇), 숏/롱 비디오 생성, 협업/멀티유저, 계정 시스템, 결제

### 차별화 포인트 (원본 대비 우위 — 반드시 구현)
1. **코드블록 인식 + 언어별 문법 하이라이팅** — 프로그래머 타깃 갭. 노트 생성 프롬프트가 코드를 언어 태그 붙은 펜스 블록으로 보존하고, 렌더는 Shiki(VS Code 테마) 사용.
2. **노트 공유 링크화** — 원본은 이미지 저장만 되고 링크 공유가 없음. 읽기 전용 공유 URL 제공.
3. **인위적 제한 제거** — 셀프호스팅 + BYOK이므로 "하루 3개 / 자료 1개 / 3MB / 15분 / 퀴즈·팟캐스트 미지원" 같은 무료판 제약이 전부 사라진다. 한도는 오직 사용자 자신의 Gemini 쿼터.

---

## 2. 기술 스택 결정 (근거)

### 프론트엔드
- **React 18 + Vite + TypeScript** — TS는 포트폴리오/유지보수 가치. (플레인 JS 선호 시 전환 가능하나, 공개 레포 리뷰어 기대치와 어댑터 타입 안전성 때문에 TS 권장.)
- **Tailwind CSS** — 단, 섹션 4 토큰만 사용. 임의 색·그라데이션 금지.
- **Zustand (+ immer)** — 앱 상태. (이미 익숙한 스택.)
- **React Router** — 라우팅. `/`, `/notebook/:id`, `/share/:id`.
- 렌더링 파이프라인: **react-markdown + remark-gfm**(표) + **rehype-katex / KaTeX**(LaTeX) + **Shiki**(코드 하이라이팅) + **Mermaid**(순서도·다이어그램·기본 차트).
- 마인드맵: **markmap (markmap-lib + markmap-view)** — Markdown 아웃라인을 그대로 인터랙티브 마인드맵으로. MD-네이티브라 파이프라인과 일관.
- 영속화: **IndexedDB(idb 또는 Dexie)** — 노트북 보관. 설정·API 키는 localStorage.
- 노트 → 이미지: **html-to-image** (DOM → PNG).

### AI 레이어 — Gemini 단일 + 어댑터
- 텍스트·구조화 생성: **Gemini Flash 계열**(빠르고 저렴, responseSchema 지원). 심화 노트는 **Gemini Pro 계열** 옵션.
- 전사: 유튜브 URL·오디오·영상을 **Gemini가 네이티브 처리**(별도 Whisper 불필요).
- TTS: **Gemini 멀티스피커 TTS**(2인 음성).
- **모든 텍스트 생성은 `LLMProvider` 인터페이스 뒤에 둔다**(섹션 3.3). 추후 ClaudeProvider/OpenAIProvider로 교체 가능. 전사·TTS는 `MediaProvider`로 분리(현재 Gemini 구현, ElevenLabs 등 pluggable).

### 선택적 서버리스 레이어 (없어도 코어 동작)
- **Cloudflare Workers + KV** — 공유 링크 저장용. 무료 티어로 충분.
- (선택) HWP5 변환 폴백, CORS 프록시.
- **핵심 원칙**: 서버리스 없이도 GitHub Pages 정적 배포 + BYOK로 전 기능(공유 링크 제외) 동작. 공유 링크는 점진적 향상(progressive enhancement). 서버 미설정 시 "MD/이미지 내보내기"로 자연 강등.

### 왜 Gemini 단일인가 (요약)
전사·요약·구조화·TTS·(향후)이미지를 **한 벤더로 일원화** → 1인 유지보수 부담 최소화. 유튜브 URL 네이티브 처리로 다운로드 서버 불필요. 텍스트 생성부만 어댑터로 빼서 벤더 락인을 회피.

---

## 3. 아키텍처

### 3.1 디렉토리 구조
> 정본(canonical) 트리. 기술 백서 §6 · 디자인 백서 §6의 트리 블록과 글자 단위로 동일하다.

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

### 3.2 데이터 흐름 (파이프라인)
```
[소스 추가]
  ├ 문서류(pdf/docx/hwp/hwpx/txt/md) → lib/ingest 로 클라이언트 텍스트 추출 → SourceContext.text
  ├ 유튜브 URL                        → SourceContext.mediaRef = { youtubeUrl }   (Gemini 네이티브)
  └ 오디오/영상                        → Gemini File API 업로드 → mediaRef = { fileUri }
        ↓
[깊이 선택 + 산출물 토글]  (투입 시점에 결정)
        ↓
[orchestrator]  토글된 산출물만 LLMProvider/MediaProvider 메서드로 fan-out (가능한 병렬)
        ↓
[검증/리페어]   구조화 출력 JSON 파싱 실패·Mermaid/LaTeX 오류 시 리페어 재시도
        ↓
[스토어 + IndexedDB 저장]  → 노트북으로 영속
        ↓
[렌더]  탭별 표시
        ↓
[내보내기]  MD 복사 / PNG / 공유 링크
```

### 3.3 어댑터 인터페이스 (핵심 추상화)
```typescript
// src/lib/ai/provider.ts
export type SourceKind =
  | 'text' | 'pdf' | 'docx' | 'hwp' | 'hwpx' | 'txt' | 'md'
  | 'youtube' | 'audio' | 'video';

export interface MediaRef {
  youtubeUrl?: string;   // Gemini 네이티브 처리
  fileUri?: string;      // Gemini File API 업로드 결과
  mimeType?: string;
}

export interface SourceContext {
  id: string;
  kind: SourceKind;
  title: string;
  text?: string;         // 문서류: 추출된 정규화 텍스트
  mediaRef?: MediaRef;   // 미디어류: 프로바이더가 직접 소비
  meta?: Record<string, unknown>;
}

export type Depth = 'beginner' | 'intermediate' | 'expert';
export type Locale = 'ko' | 'en';

export interface GenerateOptions {
  depth: Depth;
  locale: Locale;
}

export interface NotesResult { summaryMd: string; detailedMd: string; }
export interface QuizItem {
  type: 'mcq' | 'short' | 'truefalse';
  question: string;
  options?: string[];     // mcq
  answer: string;
  explanation: string;
}
export interface Flashcard { front: string; back: string; }
export interface PodcastTurn { speaker: 'A' | 'B'; text: string; }

// 텍스트·구조화 생성 — 교체 가능(Gemini→Claude→OpenAI)
export interface LLMProvider {
  readonly name: string;
  generateNotes(ctx: SourceContext[], opt: GenerateOptions): Promise<NotesResult>;
  generateMindmap(ctx: SourceContext[], opt: GenerateOptions): Promise<string>; // markmap용 MD 아웃라인
  generateQuiz(ctx: SourceContext[], opt: GenerateOptions): Promise<QuizItem[]>;
  generateFlashcards(ctx: SourceContext[], opt: GenerateOptions): Promise<Flashcard[]>;
  generatePodcastScript(ctx: SourceContext[], opt: GenerateOptions): Promise<PodcastTurn[]>;
}

// 미디어 — 현재 Gemini 고정, pluggable
export interface MediaProvider {
  readonly name: string;
  // 유튜브/파일은 SourceContext.mediaRef 로 전달되어 생성 시점에 함께 소비됨.
  // 별도 사전 전사가 필요할 때만 사용.
  transcribe?(ref: MediaRef): Promise<string>;
  synthesizeDialogue(turns: PodcastTurn[], voices: { A: string; B: string }): Promise<Blob>; // WAV/MP3
}
```
> `GeminiProvider`는 `LLMProvider`와 `MediaProvider`를 모두 구현한다. 생성 호출 시 `mediaRef`가 있으면 텍스트 대신 미디어 파트를 그대로 Gemini에 넘긴다(전사 단계 생략).

### 3.4 상태 모델
- `sources: SourceContext[]`
- `artifacts: { notes?, mindmap?, quiz?, flashcards?, podcast? }` (토글로 생성된 것만 채워짐)
- `settings: { apiKey, depth, locale, toggles, voices }`
- 노트북 = `{ id, title, sources(meta only), artifacts, createdAt }` → IndexedDB.

---

## 4. 디자인 시스템 (안티-클리셰, 자체 완결)

> Claude Code는 외부 스킬에 의존하지 말고 **이 섹션만으로** 디자인을 결정한다.

### 금지 목록 (하드 룰)
- ❌ 네온 글로우, 다색 그라데이션(보라→분홍 등), 그라데이션 텍스트
- ❌ 글래스모피즘 남용(backdrop-blur 도배), 떠다니는 blob/파티클 배경, mouse-tracking gradient
- ❌ 장식용 이모지 헤더("✨ Features" 류), shimmer/marquee/glitch, 호버 시 과한 scale/rotate
- ❌ 폰트 패밀리 3개 이상 혼용, 그림자 위 그림자 위 glow
- ❌ "AI SaaS 랜딩 풀세트"(거대 그라데이션 텍스트 + 글래스 카드 + 애니메이션 카운터)

### 토큰 (`src/styles/tokens.css`)
- **팔레트 (CSS Variables, 단일 출처 `tokens.css` — 백서 §5와 동일)**: `--bg` #fafafa / dark #09090b, `--fg` #18181b / dark #f4f4f5, `--muted` #71717a, `--border` #e4e4e7 / dark #27272a. 기능색만 사용:
  - `--accent` #2563eb (blue-600) — 포커스·링크·주요 액션, **단일 액센트**.
  - `--success` #059669 (emerald-600) — 정답/성공, `--error` #e11d48 (rose-600) — 오답/오류.
- **타이포**: 본문 = 시스템 폰트 스택 또는 가독성 좋은 단일 본문 서체(예: Pretendard/Inter 하나만). 코드 = 모노 1종. **최대 2 패밀리.**
- **radius**: 일관된 1값(예: `0.5rem`). 카드/버튼/입력 동일.
- **간격**: 4px 그리드. 읽기 영역 `max-width: 72ch`, 넉넉한 줄간격(노트 가독성 우선).
- **모션**: 100–150ms ease 트랜지션만. 장식 애니메이션 없음.

### 렌더링 규칙
- **LaTeX**: `$...$`, `$$...$$` → KaTeX. 렌더 실패 시 원문 코드 표시(앱 깨지지 않게).
- **표**: GFM 표 → 가벼운 보더, zebra 없이 행 구분선만.
- **코드블록**: Shiki, VS Code 다크/라이트 테마, 언어 라벨 표시, 복사 버튼.
- **순서도/다이어그램/기본 차트**: Mermaid(flowchart, sequence, `xychart-beta` 등). 파싱 실패 시 코드 폴백 + 리페어 1회.
- **노트 레이아웃**: 명확한 h2/h3 위계, 콜아웃(정보/주의)은 좌측 보더 + 무채 배경(이모지·형광색 금지).

### 반응형 & 접근성
- 모바일(~380px)~데스크탑. 사이드바는 모바일에서 드로어로.
- WCAG AA 대비, 포커스 링 유지, 키보드 내비, 시맨틱 HTML. prefers-reduced-motion 존중.

---

## 5. 기능 스펙 (수용 기준 포함)

### 5.1 인제스트
- 다중 소스 지원(한 노트북에 여러 자료). 드래그앤드롭 + 클릭 업로드 + 유튜브 URL 입력.
- 추출:
  - **PDF**: pdfjs-dist 텍스트 추출. 스캔 PDF(텍스트 레이어 없음)는 "텍스트가 거의 없습니다" 경고(OCR은 v2).
  - **DOCX**: mammoth.
  - **HWPX**: zip 해제 후 `Contents/section*.xml` 파싱(상대적으로 용이) — **정식 지원**.
  - **HWP5**: hwp.js로 best-effort 텍스트 추출, 실패/부분 추출 시 "PDF로 변환해 다시 올려주세요" 안내로 강등.
  - **TXT/MD**: 그대로.
  - **유튜브**: 다운로드하지 않음. URL을 `mediaRef.youtubeUrl`로 래핑해 Gemini에 직접 전달(공개 영상 한정, 길이/쿼터 한계는 런북 참조).
  - **오디오/영상**: Gemini File API 업로드(>~20MB는 resumable, 소형은 inline) → `fileUri`.
- **수용 기준**: 6개 소스 종류 각각이 깨끗한 컨텍스트를 만든다. 대용량(>3MB) 정상 처리. 모든 실패는 사용자에게 명확히 노출(앱 크래시 없음).

### 5.2 노트 (요약 / 상세 + 깊이 조절)
- 한 번의 생성으로 **요약본**과 **상세본** 둘 다 산출(별도 토글 가능하나 기본 동시).
- **깊이 3단계**가 프롬프트 파라미터로 구성·분량·전제 지식 수준을 바꾼다:
  - 입문: 비유 중심, 용어 풀이, 짧은 섹션.
  - 중급: 표준 깊이, 핵심 메커니즘.
  - 심화: 정밀·완전, 수식/엣지케이스/한계 포함.
- 출력은 Markdown. LaTeX·표·**언어 태그 코드블록**·Mermaid 포함을 프롬프트가 명시적으로 유도.
- **수용 기준**: 샘플 강의 1건으로 3단계 노트가 모두 정상 렌더. 코드가 포함된 자료는 언어 하이라이팅이 적용된 코드블록으로 나온다. MD 복사가 Notion에 붙여 깨지지 않는다.

### 5.3 마인드맵
- 노트(또는 별도 호출)에서 **계층 Markdown 아웃라인** 생성 → markmap으로 인터랙티브 렌더(접기/펼치기, 줌).
- **수용 기준**: 노드 50+ 규모 맵이 부드럽게 렌더·인터랙션. PNG/SVG 내보내기.

### 5.4 퀴즈
- responseSchema로 `QuizItem[]` 강제. 객관식/단답/참거짓 혼합, 각 항목에 정답 + 해설.
- UI: 풀이 → 채점 → 해설 토글, 점수 표시, 재시도.
- **수용 기준**: 10문항 생성, 인터랙티브 채점 동작, 투입 시점 On/Off 반영.

### 5.5 플래시카드
- `Flashcard[]` 강제. 앞(개념/질문)/뒤(정의/답).
- UI: 카드 뒤집기, 이전/다음, 셔플, "안다/모른다" 표시(간이 학습 모드).
- **수용 기준**: 20장 생성, 뒤집기·내비 동작, On/Off 반영.

### 5.6 팟캐스트 (TTS) — MVP 최난도, 마지막에
- 2단계: (1) `PodcastTurn[]`(A/B 2인 대담 스크립트) 생성 → (2) Gemini 멀티스피커 TTS로 음성 합성.
- 장문은 턴 단위로 청크 후 오디오 스티칭. 클라이언트에서 WAV/MP3 인코딩, 플레이어 + 다운로드.
- **수용 기준**: 한 소스에서 2인 음성 오디오 생성·재생·다운로드. On/Off 반영. 길이 초과 시 청크/스티칭으로 처리(런북).

### 5.7 내보내기 & 공유
- **MD 복사**: 모든 산출물에 복사 버튼.
- **노트 → PNG**: html-to-image로 노트 뷰 캡처.
- **공유 링크**: 노트(MD + 메타) 직렬화 → Cloudflare Worker KV에 짧은 ID로 저장 → `/share/:id` 읽기 전용 렌더. **PII 없음, opt-in, 만료 옵션.** Worker 미설정 시 버튼 숨김 + MD/PNG로 강등.
- **수용 기준**: 제3자가 공유 URL을 열어 노트를 읽을 수 있다(서버리스 설정 시).

---

## 6. 마일스톤 게이트 (M0 → M6)

> 각 게이트 통과 = 커밋 + 사용자 확인. 미통과 시 진행 금지.

- **M0 — 스켈레톤 & 디자인 시스템**
  Vite+React+TS+Tailwind 스캐폴드, `tokens.css`, 반응형 셸(사이드바/드로어 + 메인), 라우팅, GitHub Pages 배포 동작.
  *게이트*: 모바일/데스크탑 렌더, Lighthouse 접근성 ≥ 90, 금지 목록 위반 0건, 다크모드 동작.

- **M1 — 인제스트**
  6개 소스 종류 → `SourceContext` 정규화. Gemini File API 업로드, 유튜브 URL 래핑. 에러 핸들링.
  *게이트*: 각 종류가 유효 컨텍스트 생성(HWP5는 best-effort/강등 허용), 대용량 처리, 모든 실패 노출.

- **M2 — 코어 생성 (노트 + 마인드맵)**
  `LLMProvider`/`GeminiProvider`, responseSchema, 노트(요약+상세) 3단계 깊이, MarkdownView(KaTeX+Shiki+Mermaid), markmap.
  *게이트*: 샘플 강의로 3단계 노트 정상 렌더, 코드 하이라이팅 동작, 마인드맵 인터랙션, MD 복사 Notion 호환.

- **M3 — 퀴즈 + 플래시카드**
  구조화 생성 + 인터랙티브 UI + 투입 시점 토글.
  *게이트*: 10문항 퀴즈 채점, 20장 카드 뒤집기, On/Off 반영.

- **M4 — 팟캐스트 (TTS)**
  스크립트 생성 → 멀티스피커 합성 → 플레이어/다운로드, 청크/스티칭.
  *게이트*: 2인 음성 오디오 생성·재생·다운로드, 토글 동작.

- **M5 — 내보내기 & 공유 & 영속화**
  MD 복사 전역, 노트→PNG, IndexedDB 노트북 보관, (선택) Worker 공유 링크.
  *게이트*: 재방문 시 노트북 유지, 공유 URL을 제3자가 열람(서버리스 설정 시), 미설정 시 정상 강등.

- **M6 — 폴리시 & 문서**
  README(BYOK 설정 가이드), MIT LICENSE, 스크린샷, 데모, i18n(ko/en), 빈 상태/로딩/에러 UX 정리.
  *게이트*: 외부인이 README만 보고 자기 키로 띄울 수 있다.

---

## 7. 실패 런북

| 증상 | 원인 | 조치 |
|---|---|---|
| Gemini 429 / 쿼터 초과 | 사용자 키 한도 | 지수 백오프 재시도, 사용자에게 쿼터 안내 + 모델 다운그레이드(Pro→Flash) 옵션 |
| 구조화 출력 JSON 파싱 실패 | LLM이 스키마 이탈 | responseSchema 강제 + 파싱 실패 시 "JSON만 반환" 리페어 프롬프트 1회 재시도, 그래도 실패면 사용자 알림 |
| Mermaid/LaTeX 렌더 에러 | 잘못된 문법 출력 | 해당 블록만 코드 폴백 표시 + 리페어 재생성 1회. 앱 전체는 절대 깨지지 않게 try/catch 격리 |
| 유튜브 URL 처리 불가 | 비공개/길이·쿼터 초과/지역제한 | 명확한 사유 메시지, "직접 다운로드해 파일로 업로드" 대안 안내 |
| HWP5 추출 실패/깨짐 | 포맷 복잡성 | "PDF/HWPX로 변환해 재업로드" 강등 안내 |
| 대용량 미디어 토큰/크기 한계 | 모델 입력 한계 | File API resumable 업로드, 필요 시 분할 처리 |
| TTS 길이 한계 | 합성 입력 상한 | 턴 단위 청크 합성 후 오디오 스티칭 |
| CORS 차단(파일 fetch) | 브라우저 정책 | BYOK 직접 호출(키는 사용자 것) 우선, 불가피하면 선택적 Worker 프록시 |
| 공유 링크 동작 안 함 | Worker/KV 미설정 | 기능 자동 숨김 + MD/PNG로 강등(에러 아님) |
| API 키 누락/무효 | 미설정 | 설정 모달로 유도, "키는 브라우저에만 저장, 서버 전송 없음" 명시 |

---

## 8. Claude Code 작업 규약 (→ `CLAUDE.md`로 복사)

```md
# 작업 규약 — StudyForge

## 범위
- HARNESS.md의 MVP 범위만 구현한다. 비범위(이미지 생성/RAG 챗/비디오/계정/결제)는 만들지 않는다.
- 새 기능·새 의존성·아키텍처 변경은 추가하기 전에 사용자에게 묻는다.

## 진행 방식
- 한 세션 = 한 마일스톤(M0…M6). 게이트 기준 미충족 시 다음으로 넘어가지 않는다.
- 막히면 HARNESS.md 섹션 7(런북) 먼저 확인.

## 코드 & 커밋
- TypeScript strict. 함수/모듈 단위로 작게. 어댑터 인터페이스(provider.ts)를 깨지 않는다.
- 각 게이트마다 conventional commit으로 커밋(feat/fix/chore/docs).
- 생성 경로마다 fixture(샘플 입력)로 검증한 뒤 다음 단계로.

## 디자인
- HARNESS.md 섹션 4 토큰만 사용. 금지 목록 위반 절대 금지(그라데이션/네온/글래스/장식 이모지/3폰트 등).
- 기능색 외 색 도입 금지. 임의 인라인 컬러 금지.

## 보안 (BYOK)
- API 키를 코드에 하드코딩하지 않는다. .env.example만 제공.
- 사용자 키는 브라우저(localStorage)에만 저장하고, 자체 서버로 전송하지 않는다. UI에 이 사실을 명시한다.
- 공유 링크에 PII를 넣지 않는다.

## 견고성
- 모든 LLM/렌더 출력은 검증·격리한다. 한 산출물 실패가 앱 전체를 깨면 안 된다.
- 외부 호출은 에러를 사용자에게 노출한다(조용한 실패 금지).
```

---

## 9. 환경변수 & 보안 (BYOK)

`.env.example`
```
# 사용자가 자기 키를 입력. 레포에는 빈 값만 커밋.
VITE_GEMINI_API_KEY=
# (선택) 공유 링크용 Worker 엔드포인트
VITE_SHARE_WORKER_URL=
```
- 키는 **사용자 브라우저(localStorage)에만** 저장, 자체 서버 전송 없음 — UI 설정 모달에 명시.
- 클라이언트 BYOK는 키가 브라우저에 노출되는 구조이므로, **개인/포트폴리오 용도임을 README에 분명히** 한다(공용 호스팅 시 데모는 별도 키-프록시 Worker 권장, v2).
- 공유 링크: opt-in, 만료 옵션, PII 금지.

---

## 10. v2+ 로드맵 (지금 만들지 않음)
- 이미지 생성(핵심 개념 → 가독성 높은 일러스트, Gemini 이미지/Imagen)
- 강좌 어시스턴트(소스 기반 RAG 챗)
- 숏/롱 비디오 생성
- recharts 기반 고급 데이터 차트(Mermaid 한계 보완)
- 스캔 PDF OCR
- 데모용 키-프록시 Worker, 계정/협업

---
*버전: v1.1 (파일 트리·디자인 토큰을 기술/디자인 백서 정본과 동기화) · 모델 문자열·라이브러리 버전은 구현 시점 공식 문서로 재확인할 것.*
