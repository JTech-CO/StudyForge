# StudyForge 디자인 백서 (Design Whitepaper)

**버전**: 1.0
**작성일**: 2026년 06월 08일
**작성자**: Bryan (JTech-CO)
**참고 문서**: HARNESS.md v1, 기술 백서 v1.0

---

## 1. 프로젝트 개요 (Project Overview)
### 1.1. 프로젝트 명
**StudyForge UI/UX Design**

### 1.2. 목적 (Purpose)
이질적 학습 자료를 **읽기 최적화된 노트**로 변환해 학습자가 즉시 흡수·복습할 수 있게 하는 직관적 인터페이스를 구축한다.
- "AI가 만든 티"가 나는 시각 클리셰(그라데이션·네온·글래스·장식 이모지)를 배제하고, Notion급으로 정돈된 가독성을 제공한다.
- 수식·표·코드·다이어그램을 1급 시민으로 다뤄, 복잡한 내용을 직관적으로 전달한다.

### 1.3. 핵심 차별점 (Key Differentiators)
1.  **안티-클리셰 가독성**: 무채(zinc) 기반 + 단일 기능색 액센트. 다색 그라데이션·형광·글래스모피즘 배제, 본문 `72ch` 폭으로 정보 전달력 극대화.
2.  **콘텐츠 충실 렌더**: LaTeX·GFM 표·**언어별 코드 하이라이팅**·Mermaid 순서도를 일관된 스타일로 렌더.
3.  **기기 무관 반응형**: 모바일~데스크톱 최적화, 사이드바↔드로어 전환, 가로 스크롤 발생 0.

## 2. 상세 기능 요구사항 (Detailed Requirements)

### 2.1. 레이아웃 및 인터페이스 (Layout & Interface)
- **뷰 모드 (View Mode)**: Fluid Layout, 콘텐츠 리딩 영역 `max-width: 72ch`.
  - *데스크톱*: 좌측 고정 사이드바(노트북 목록 / 네비) + 메인 리딩 영역 2단.
  - *모바일*: 사이드바를 드로어로 전환, 메인 100% Full Width.
- **테마 정책 (Theme Policy)**: Light / Dark / System Preference.
  - *배경색*: `#fafafa` / dark `#09090b`
  - *기본 텍스트 색*: `#18181b` / dark `#f4f4f5`

### 2.2. 사용자 상호작용 (Interaction Logic)
- **주요 액션 (Actions)**:
  - **Hover Effects**: 미세한 배경 틴트(`zinc-100` / dark `zinc-900`)와 보더 강조만. 과도한 scale·rotate·glow 금지.
  - **Navigation**: 데스크톱 사이드바 / 모바일 햄버거 드로어. 산출물 전환은 상단 탭.
- **입력 방식 (Input)**: 드롭존, 유튜브 URL 바, 텍스트 영역. 설정/키 입력은 모달 팝업(깊이·산출물 토글·보이스 포함).

### 2.3. 데이터 구조 및 모듈 (Component Structure)
1.  **헤더 (Header)**: 로고/제목 좌측, 테마 토글·설정 우측. Sticky, 하단 1px 보더(그림자 없음).
2.  **네비게이션 (Nav, 사이드바)**: 노트북 목록 + 신규 생성 버튼. 무채 배경, 활성 항목은 좌측 액센트 보더로 표시.
3.  **콘텐츠 영역 (Content)**: 넉넉한 패딩, `72ch` 폭. 콜아웃(정보/주의)은 좌측 보더 + 무채 배경(이모지·형광 금지).
4.  **푸터 (Footer)**: 미니멀(레포 링크 / 버전), 상단 보더로 구분.

### 2.4. 출력 및 결과물 (Output)
- **결과물 형식**: React Component (TSX). 산출물은 MD 복사 / PNG / 오디오 / 공유 뷰.
- **품질 기준 (QA Standards)**:
  - 접근성: WCAG 2.1 AA 준수.
  - 반응형: 가로 스크롤 발생 금지, `prefers-reduced-motion` 존중.

## 3. 기술 스택 및 라이브러리 (Tech Stack)

### 3.1. Core
- **Frontend Framework**: React 18 (+ Vite, TypeScript).
- **Styling Engine**: Tailwind CSS (디자인 토큰 확장만 사용).

### 3.2. Libraries & Tools
1.  **tailwindcss**
    - **용도**: 유틸리티 기반 스타일링.
    - **설정 값**: `theme.extend`로 색/폰트/radius/breakpoint 토큰 등록. **임의값(arbitrary value) 사용 금지.**
2.  **shiki**
    - **용도**: VS Code 테마 기반 코드 문법 하이라이팅(차별점).
3.  **katex / mermaid / markmap-view**
    - **용도**: 수식 / 다이어그램·순서도 / 마인드맵 시각화.
4.  **html-to-image**
    - **용도**: 노트 뷰 → PNG 내보내기.

## 4. 아키텍처 및 로직 (Architecture & Logic)

### 4.1. 시각적 계층 구조 (Visual Hierarchy)
- **Level 1 (Page Title)**: `1.875rem`, Weight `700`, `--fg`
- **Level 2 (Section Title)**: `1.25rem`, Weight `600`, 장식 없음(필요 시 하단 보더)
- **Level 3 (Body Text)**: `1rem`, line-height `1.7`
- **Level 4 (Meta/Caption)**: `0.875rem`, `--muted`(zinc-500)

```css
/* 스타일 적용 예시 코드 */
.section-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--fg);
}
.meta {
  font-size: 0.875rem;
  color: var(--muted);
}
```

### 4.2. 반응형 로직 (Responsive Logic)
1.  **Desktop (≥1024px)**: 사이드바 + 메인 2단 레이아웃.
2.  **Transition Point**: `768px`, `1024px`.
3.  **Mobile View (<768px)**: 사이드바 드로어 전환, 1단 배치. 산출물 탭은 가로 스크롤 허용(콘텐츠 본문은 세로), 폰트 소폭 축소.

### 4.3. 핵심 컴포넌트 로직 (Core Components)
- **MarkdownView**: react-markdown + remark-gfm + rehype-katex + shiki + mermaid. 블록 단위 격리 렌더, 코드블록에 언어 라벨 + 복사 버튼.
- **MindMap**: markmap 기반, 접기/펼치기·줌, PNG·SVG 내보내기.
- **Quiz**: 풀이 → 채점 → 해설 토글. 정답 `--success`, 오답 `--error`로 표시.
- **Flashcards**: 절제된 3D flip, 셔플·이전/다음, 간이 학습 모드.
- **PodcastPlayer**: 재생/일시정지/다운로드, 진행바. 장식 비주얼라이저 없음.

## 5. UI/UX 디자인 가이드 (Design System)
*기술 백서와 동일한 토큰을 사용한다(단일 출처: `src/styles/tokens.css`).*

### 5.1. 색상 팔레트 (Color Palette)
- **Primary/Accent**: `#2563eb` (blue-600) — 포커스·링크·주요 액션 / `--accent`. **단일 액센트 원칙**(보조 강조색을 추가하지 않고 무채 위계로 해결).
- **Secondary/Link**: 액센트 톤 공유(별도 secondary 색 없음).
- **Background**: `#fafafa` / dark `#09090b` / `--bg`
- **Text/Neutral**: `#18181b` (본문 / `--fg`), `#71717a` (보조 텍스트 / `--muted`)
- **Border**: `#e4e4e7` / dark `#27272a` / `--border`
- **Error/Success**: `#e11d48` (오답/오류) / `#059669` (정답/성공)
- **금지**: 다색 그라데이션, 형광색, 글래스모피즘.

### 5.2. 타이포그래피 (Typography)
- **Font Family**: `Pretendard`(한글 우선) 또는 `Inter` (Fallback: `system-ui, sans-serif`). 코드 = `ui-monospace` 계열. **최대 2 패밀리.**
- **Font Weight**: Regular(400), Semibold(600), Bold(700).

## 6. 파일 구조 (File Structure)
*정본(canonical) 트리. 기술 백서 §6과 완전히 동일하며, 두 백서·하네스가 이 구조를 공유한다.*

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

1.  **스타일링 전략 (Styling Strategy)**:
    - Tailwind 유틸리티 + `tokens.css` 변수만 사용. 임의 색/그라데이션 클래스 금지.
    - **안티-클리셰 금지 목록 준수**: 네온 글로우, 다색 그라데이션, 그라데이션 텍스트, 글래스모피즘 남용, 장식 이모지 헤더, blob/파티클 배경, shimmer/marquee/glitch, 과한 hover scale/rotate, 폰트 3종 이상.
2.  **접근성 가이드 (Accessibility)**:
    - 모든 비텍스트 요소에 `alt`/`aria` 제공, 키보드 네비게이션·포커스 링 유지.
    - AA 대비 확보. 링크는 색만이 아닌 밑줄/구분으로 표시(색맹 대응).
    - `prefers-reduced-motion` 시 트랜지션 최소화.
3.  **예외 처리 (Exception Handling)**:
    - 생성 중 산출물 영역에 Skeleton UI 노출.
    - 빈 노트북/검색 결과 없음에 Placeholder 디자인.
    - LaTeX/Mermaid/코드 렌더 실패 시 코드 폴백, 이미지·오디오 부재 시 Fallback 디자인.

---
