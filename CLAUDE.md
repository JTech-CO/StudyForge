# 작업 규약 — StudyForge

> 출처: `docs/HARNESS.md` §8. 모든 세션은 이 규약을 따른다. 새 결정이 필요하면 `docs/HARNESS.md` §7(런북)을 먼저 확인하고, 거기 없으면 사용자에게 묻는다.

## 범위
- docs/HARNESS.md의 MVP 범위만 구현한다. 비범위(이미지 생성/RAG 챗/비디오/계정/결제)는 만들지 않는다.
- 새 기능·새 의존성·아키텍처 변경은 추가하기 전에 사용자에게 묻는다.

## 진행 방식
- 한 세션 = 한 마일스톤(M0…M6). 게이트 기준 미충족 시 다음으로 넘어가지 않는다.
- 막히면 docs/HARNESS.md 섹션 7(런북) 먼저 확인.

## 코드 & 커밋
- TypeScript strict. 함수/모듈 단위로 작게. 어댑터 인터페이스(provider.ts)를 깨지 않는다.
- 각 게이트마다 conventional commit으로 커밋(feat/fix/chore/docs).
- 생성 경로마다 fixture(샘플 입력)로 검증한 뒤 다음 단계로.

## 디자인
- docs/HARNESS.md 섹션 4 토큰만 사용. 금지 목록 위반 절대 금지(그라데이션/네온/글래스/장식 이모지/3폰트 등).
- 기능색 외 색 도입 금지. 임의 인라인 컬러 금지.

## 보안 (BYOK)
- API 키를 코드에 하드코딩하지 않는다. .env.example만 제공.
- 사용자 키는 브라우저(localStorage)에만 저장하고, 자체 서버로 전송하지 않는다. UI에 이 사실을 명시한다.
- 공유 링크에 PII를 넣지 않는다.

## 견고성
- 모든 LLM/렌더 출력은 검증·격리한다. 한 산출물 실패가 앱 전체를 깨면 안 된다.
- 외부 호출은 에러를 사용자에게 노출한다(조용한 실패 금지).

---

## 진행 현황 (마일스톤 트래커)

| 마일스톤 | 상태 | 비고 |
|---|---|---|
| **M0 — 스켈레톤 & 디자인 시스템** | ✅ 완료 | 커밋 `ab359a3` (+ `.gitattributes` `ec0fa0f`) |
| **M1 — 인제스트** | ✅ 완료 | 커밋 `8cb889d` |
| **M2 — 코어 생성(노트+마인드맵)** | ✅ 완료 | GeminiProvider/responseSchema, 3단계 깊이 노트, MarkdownView(KaTeX·Shiki·Mermaid·GFM), markmap. 샘플 렌더 e2e 검증(실제 생성은 키 필요) |
| **M3 — 퀴즈 + 플래시카드** | ✅ 완료 | QuizItem[]/Flashcard[] responseSchema, 10문항 채점·20장 뒤집기·셔플·토글 e2e 검증(실제 생성은 키 필요) |
| **M4 — 팟캐스트(TTS)** | ✅ 완료 | PodcastTurn[] 스크립트 + 멀티스피커 TTS → PCM 스티칭/WAV → 네이티브 플레이어/다운로드. 합성 PCM e2e(WAV 헤더·0.5s 스티칭·재생) 검증, 실 TTS는 키 필요 |
| **M5 — 내보내기 & 공유 & 영속화** | ✅ 완료 | IndexedDB 영속화(재방문 유지 e2e 검증)·MD 복사 전역·노트→PNG·공유 Worker(미설정 시 강등). ArtifactTabs 로 Notebook/Share 공용 |
| **M6 — 폴리시 & 문서** | ✅ 완료 | README(BYOK 가이드)·MIT LICENSE·**전체 UI i18n(ko/en)**·UX. 언어 토글 e2e 검증. MVP 전 마일스톤 완료 🎉 |

### Post-MVP 기능 (사용자 요청 · 2026-06)
| 항목 | 상태 | 비고 |
|---|---|---|
| **노트북 제목 변경 + 노트·마인드맵 편집** | ✅ 완료 | 헤더 제목 인라인 편집(공백 거부) + `MarkdownEditor`(편집/미리보기 토글, 미리보기는 lazy `MarkdownView`를 `RenderBoundary`로 격리). 스토어 `renameNotebook`/`updateNotebookArtifacts`(save-before-set 평문객체). 퀴즈·플래시·팟캐스트는 읽기전용 유지. |
| **공유 v2 — 8자리 코드·모드·Fork** | ✅ 완료 | Worker `makeId(8)`+충돌검사. 공유 URL `…/notebook/<code>`(BASE_URL 경유). 모달에서 **읽기전용/편집가능** 선택. 라우트는 `isShareCode(id)` 술어로 로컬(owner)/원격(공유) **무충돌 분기**, `/share/:id`→`/notebook/:id` 리다이렉트(M5 호환), `Share.tsx` 제거. 편집가능=**Fork**(받는 사람이 `importSharedNotebook`으로 자기 IndexedDB에 사본 생성 후 편집, 원본 KV 불변 — wrangler dev로 생성→조회→Fork→원본불변 e2e 검증). **PII**: 페이로드 sources 는 `{id,kind}`만(파일명 제외), `mode`는 접근제어 아님(클라 힌트). RemoteNotebook 은 deps `[code]`+alive 플래그(ref 가드 금지 — StrictMode와 충돌). |

### 확정 스택 (구현 시점 검증 완료 · 2026-06)
- React **19**, Vite **8**, TypeScript **6**, Tailwind CSS **4**(@tailwindcss/vite), react-router-dom **7**.
- 하네스의 버전 표기(React 18/TS 5 등)는 기준점이며, 최신 안정 버전으로 채택함(하네스 §0-4 지침).
- 본문 폰트: **시스템 폰트 스택** 채택(외부 CDN 의존 제거 → 오프라인·LCP·재현성). `--font-sans` 는 로컬 Pretendard 우선, 셀프호스팅은 M6 폴리시에서 선택적 추가.
- 빌드 주의: 프리뷰로 띄운 `npm run dev` 고아 프로세스가 남으면 `vite build` 가 조용히 실패(exit 127)할 수 있음 → 해당 node 프로세스 종료 후 재빌드.
- M1 의존성: pdfjs-dist 6(워커 `?worker` 번들), mammoth 1, fflate(HWPX unzip), hwp.js(HWP5 best-effort · `fs` externalize 경고는 무해), @google/genai 2(브라우저 File API 업로드), zustand 5 + immer 11(store · settings persist). 무거운 추출기는 디스패처에서 동적 import 로 코드 스플리팅(메인 번들 ~89KB gz 유지).
- M2 의존성: react-markdown 10 + remark-gfm/remark-math + rehype-katex/katex(LaTeX) + shiki 4(코드 하이라이팅, **JS 정규식 엔진**으로 wasm 회피 → dev/prod 안정, `@shikijs/langs`·`@shikijs/themes` fine-grained) + mermaid 11 + markmap-lib/view. MarkdownView·MindMap·GeminiProvider(@google/genai)는 모두 lazy → 메인 진입 ~90KB gz 유지. Gemini 모델: 기본 `gemini-3.5-flash`(최신 안정), 심화(expert) 노트 `gemini-2.5-pro`(`lib/ai/gemini.ts` 상수).
- M6 폴리시 최적화 후보: shiki 언어를 온디맨드(`loadLanguage`)로 전환 → MarkdownView 청크(~418KB gz, 20개 언어 정적 포함) 축소.
- M4 의존성: **없음**. Gemini 멀티스피커 TTS(`gemini-2.5-flash-preview-tts`, 보이스 A=Kore/B=Puck) → PCM(24kHz/16bit/mono) → 수동 WAV 인코딩·스티칭(`lib/ai/audio.ts`). 스크립트는 생성 흐름, 음성 합성은 팟캐스트 탭 온디맨드(유료 한도).
- M5 의존성: idb 8(IndexedDB 노트북 영속), html-to-image 1(노트→PNG, **동적 import** 로 메인 번들에서 분리). 공유 링크는 선택적 Cloudflare Worker(`worker/` — KV, 30일 TTL · `VITE_SHARE_WORKER_URL` 미설정 시 버튼 숨김 → MD/PNG 강등). `ArtifactTabs` 로 Notebook/Share 산출물 렌더 공용. 메인 진입 ~96KB gz.
- M6 i18n: **경량 자체 구현**(`lib/i18n/strings.ts` 사전 + `useT` 훅, 새 의존성 0). 전체 UI 문자열 ko/en, 헤더 언어 토글 + 설정 언어 + `<html lang>` 동기화. 생성 콘텐츠는 프롬프트 locale 로 ko/en. **경계**: lib 레이어(인제스트/Gemini provider)의 에러 *상세* 메시지는 어댑터 결합 회피를 위해 한국어 유지(UI 프레임·스토어 에러는 번역됨). 메인 진입 ~100KB gz.
