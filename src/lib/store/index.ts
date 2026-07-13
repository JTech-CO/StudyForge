import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { Depth, Locale, SourceContext } from '../ai/provider';
import { ingestFile, ingestText, ingestYoutube } from '../ingest';
import type { GeneratedArtifacts } from '../ai/orchestrator';
import {
  DEFAULT_PROVIDER,
  DEFAULT_PROVIDER_CONFIGS,
  isProviderId,
  providerDefinition,
  type AIProviderId,
  type ProviderConfigs,
} from '../ai/models';
import {
  deleteNotebook,
  getNotebook,
  listNotebooks,
  saveNotebook,
  type NotebookSummary,
} from '../persist/indexeddb';
import { newId } from '../../utils/id';
import { detectKind } from '../../utils/validate';
import { translate } from '../i18n/strings';
import type { SharedNotebook } from '../export/share';

export type ArtifactKind = 'notes' | 'mindmap' | 'quiz' | 'flashcards' | 'podcast';
export type SourceStatus = 'processing' | 'ready' | 'error';

/** 스토어의 소스 = SourceContext + UI 상태(처리중/준비/오류). */
export interface Source extends SourceContext {
  status: SourceStatus;
  error?: string;
  warning?: string;
}

export interface Settings {
  provider: AIProviderId;
  providers: ProviderConfigs;
  depth: Depth;
  locale: Locale;
  toggles: Record<ArtifactKind, boolean>;
}

export interface SourceMeta {
  id: string;
  kind: Source['kind'];
  title: string;
}

/** 생성된 노트북 (M5 전까지 인메모리). */
export interface Notebook {
  id: string;
  title: string;
  createdAt: string;
  sources: SourceMeta[];
  artifacts: GeneratedArtifacts;
}

interface StoreState {
  sources: Source[];
  settings: Settings;
  notebook: Notebook | null;
  notebooks: NotebookSummary[];
  isGenerating: boolean;
  genError?: string;
  storageError?: string;
  generate: () => Promise<string | undefined>;
  loadNotebooks: () => Promise<void>;
  openNotebook: (id: string) => Promise<Notebook | null>;
  removeNotebook: (id: string) => Promise<void>;
  renameNotebook: (id: string, title: string) => Promise<void>;
  updateNotebookArtifacts: (id: string, patch: Pick<GeneratedArtifacts, 'notes' | 'mindmapMd'>) => Promise<void>;
  importSharedNotebook: (shared: SharedNotebook) => Promise<string>;
  addText: (text: string, title?: string) => void;
  addYoutube: (url: string) => void;
  addFiles: (files: File[]) => Promise<void>;
  removeSource: (id: string) => void;
  clearSources: () => void;
  setProvider: (provider: AIProviderId) => void;
  setProviderApiKey: (provider: AIProviderId, key: string) => void;
  setProviderModel: (provider: AIProviderId, model: string) => void;
  setProviderBaseUrl: (provider: AIProviderId, baseUrl: string) => void;
  setDepth: (depth: Depth) => void;
  setLocale: (locale: Locale) => void;
  toggleArtifact: (kind: ArtifactKind) => void;
}

function defaultProviderConfigs(): ProviderConfigs {
  return {
    gemini: { ...DEFAULT_PROVIDER_CONFIGS.gemini },
    openai: { ...DEFAULT_PROVIDER_CONFIGS.openai },
    anthropic: { ...DEFAULT_PROVIDER_CONFIGS.anthropic },
    xai: { ...DEFAULT_PROVIDER_CONFIGS.xai },
    local: { ...DEFAULT_PROVIDER_CONFIGS.local },
  };
}

const DEFAULT_SETTINGS: Settings = {
  provider: DEFAULT_PROVIDER,
  providers: defaultProviderConfigs(),
  depth: 'intermediate',
  locale: 'ko',
  toggles: { notes: true, mindmap: true, quiz: true, flashcards: true, podcast: false },
};

function persistedSettings(value: unknown): Settings {
  const defaults: Settings = { ...DEFAULT_SETTINGS, providers: defaultProviderConfigs() };
  if (!value || typeof value !== 'object') return defaults;
  const input = value as Record<string, unknown>;
  const providers = defaultProviderConfigs();
  const savedProviders = input.providers;
  if (savedProviders && typeof savedProviders === 'object') {
    for (const id of Object.keys(providers) as AIProviderId[]) {
      const saved = (savedProviders as Record<string, unknown>)[id];
      if (!saved || typeof saved !== 'object') continue;
      const config = saved as Record<string, unknown>;
      if (typeof config.apiKey === 'string') providers[id].apiKey = config.apiKey;
      if (typeof config.model === 'string') providers[id].model = config.model;
      if (typeof config.baseUrl === 'string') providers[id].baseUrl = config.baseUrl;
    }
  }

  // v0.1 Gemini 단일 설정을 제공자별 구조로 자동 승격한다.
  if (typeof input.apiKey === 'string') providers.gemini.apiKey = input.apiKey;
  if (typeof input.model === 'string') providers.gemini.model = input.model;

  const toggles = { ...defaults.toggles };
  if (input.toggles && typeof input.toggles === 'object') {
    for (const kind of Object.keys(toggles) as ArtifactKind[]) {
      const saved = (input.toggles as Record<string, unknown>)[kind];
      if (typeof saved === 'boolean') toggles[kind] = saved;
    }
  }

  const depth =
    input.depth === 'beginner' || input.depth === 'intermediate' || input.depth === 'expert'
      ? input.depth
      : defaults.depth;
  const locale = input.locale === 'en' || input.locale === 'ko' ? input.locale : defaults.locale;

  return {
    provider: isProviderId(input.provider) ? input.provider : defaults.provider,
    providers,
    depth,
    locale,
    toggles,
  };
}

const ingestControllers = new Map<string, AbortController>();
let notebookLoadVersion = 0;
const notebookWriteQueues = new Map<string, Promise<void>>();

function enqueueNotebookWrite(id: string, task: () => Promise<void>): Promise<void> {
  const previous = notebookWriteQueues.get(id) ?? Promise.resolve();
  const next = previous.catch(() => undefined).then(task);
  notebookWriteQueues.set(id, next);
  return next.finally(() => {
    if (notebookWriteQueues.get(id) === next) notebookWriteQueues.delete(id);
  });
}

export const useStore = create<StoreState>()(
  persist(
    immer((set, get) => ({
      sources: [],
      settings: DEFAULT_SETTINGS,
      notebook: null,
      notebooks: [],
      isGenerating: false,
      genError: undefined,
      storageError: undefined,

      generate: async () => {
        const { sources, settings } = get();
        const ready = sources.filter((s) => s.status === 'ready');
        const loc = settings.locale;
        if (ready.length === 0) {
          set((s) => {
            s.genError = translate(loc, 'gen.noSources');
          });
          return undefined;
        }
        const providerConfig = settings.providers[settings.provider];
        const providerInfo = providerDefinition(settings.provider);
        if (providerInfo.requiresKey && !providerConfig.apiKey.trim()) {
          set((s) => {
            s.genError = translate(loc, 'gen.noKey', { provider: providerInfo.label });
          });
          return undefined;
        }
        if (!providerConfig.model.trim()) {
          set((s) => {
            s.genError = translate(loc, 'gen.noModel', { provider: providerInfo.label });
          });
          return undefined;
        }
        if (
          settings.provider !== 'gemini' &&
          ready.some((source) => source.mediaRef && !source.text)
        ) {
          set((s) => {
            s.genError = translate(loc, 'gen.mediaRequiresGemini');
          });
          return undefined;
        }
        if (!Object.values(settings.toggles).some(Boolean)) {
          set((s) => {
            s.genError = translate(loc, 'gen.noToggle');
          });
          return undefined;
        }
        set((s) => {
          s.isGenerating = true;
          s.genError = undefined;
        });
        try {
          // 선택한 AI 어댑터는 생성 시점에만 동적 로드한다.
          const { createLlmProvider } = await import('../ai/factory');
          const { orchestrate } = await import('../ai/orchestrator');
          const provider = await createLlmProvider(settings.provider, providerConfig);
          const artifacts = await orchestrate(
            provider,
            ready,
            { depth: settings.depth, locale: settings.locale },
            {
              notes: settings.toggles.notes,
              mindmap: settings.toggles.mindmap,
              quiz: settings.toggles.quiz,
              flashcards: settings.toggles.flashcards,
              podcast: settings.toggles.podcast,
            },
          );
          // 토글된 산출물이 모두 실패하면 빈 노트북으로 이동하지 않고 오류만 노출
          const producedAny =
            !!artifacts.notes ||
            !!artifacts.mindmapMd ||
            !!artifacts.quiz ||
            !!artifacts.flashcards ||
            !!artifacts.podcast;
          if (!producedAny) {
            const firstErr = Object.values(artifacts.errors)[0] ?? translate(loc, 'gen.failed');
            set((s) => {
              s.isGenerating = false;
              s.genError = firstErr;
            });
            return undefined;
          }
          const notebook: Notebook = {
            id: newId(),
            title: ready[0].title,
            createdAt: new Date().toISOString(),
            sources: ready.map((s) => ({ id: s.id, kind: s.kind, title: s.title })),
            artifacts,
          };
          await saveNotebook(notebook); // IndexedDB 영속
          set((s) => {
            s.notebook = notebook;
            s.isGenerating = false;
            s.notebooks = [
              { id: notebook.id, title: notebook.title, createdAt: notebook.createdAt },
              ...s.notebooks.filter((n) => n.id !== notebook.id),
            ];
          });
          return notebook.id;
        } catch (e) {
          const msg = e instanceof Error ? e.message : '생성 중 오류가 발생했습니다.';
          set((s) => {
            s.isGenerating = false;
            s.genError = msg;
          });
          return undefined;
        }
      },

      addText: (text, title) => {
        try {
          const ctx = ingestText(text, title);
          set((s) => {
            s.sources.push({ ...ctx, status: 'ready' });
          });
        } catch (e) {
          const msg = e instanceof Error ? e.message : '빈 텍스트입니다.';
          set((s) => {
            s.sources.push({ id: newId(), kind: 'text', title: '텍스트', status: 'error', error: msg });
          });
        }
      },

      addYoutube: (url) => {
        try {
          const ctx = ingestYoutube(url);
          set((s) => {
            s.sources.push({ ...ctx, status: 'ready' });
          });
        } catch (e) {
          const msg = e instanceof Error ? e.message : '유효한 유튜브 URL 이 아닙니다.';
          set((s) => {
            s.sources.push({ id: newId(), kind: 'youtube', title: 'YouTube', status: 'error', error: msg });
          });
        }
      },

      addFiles: async (files) => {
        const apiKey = get().settings.providers.gemini.apiKey;
        await Promise.all(
          files.map(async (file) => {
            const id = newId();
            const controller = new AbortController();
            ingestControllers.set(id, controller);
            const kind = detectKind(file) ?? 'txt';
            set((s) => {
              s.sources.push({
                id,
                kind,
                title: file.name,
                status: 'processing',
                meta: { size: file.size, mime: file.type },
              });
            });
            try {
              const { context, warning } = await ingestFile(file, { apiKey, signal: controller.signal });
              set((s) => {
                const i = s.sources.findIndex((x) => x.id === id);
                if (i >= 0) s.sources[i] = { ...context, id, status: 'ready', warning };
              });
            } catch (e) {
              const msg = e instanceof Error ? e.message : '파일을 처리하지 못했습니다.';
              set((s) => {
                const i = s.sources.findIndex((x) => x.id === id);
                if (i >= 0) {
                  s.sources[i].status = 'error';
                  s.sources[i].error = msg;
                }
              });
            } finally {
              if (ingestControllers.get(id) === controller) ingestControllers.delete(id);
            }
          }),
        );
      },

      removeSource: (id) => {
        ingestControllers.get(id)?.abort();
        ingestControllers.delete(id);
        set((s) => {
          s.sources = s.sources.filter((x) => x.id !== id);
        });
      },
      clearSources: () => {
        for (const controller of ingestControllers.values()) controller.abort();
        ingestControllers.clear();
        set((s) => {
          s.sources = [];
        });
      },

      loadNotebooks: async () => {
        try {
          const list = await listNotebooks();
          set((s) => {
            s.notebooks = list;
            s.storageError = undefined;
          });
        } catch {
          const locale = get().settings.locale;
          set((s) => {
            s.storageError = translate(locale, 'storage.loadFailed');
          });
        }
      },
      openNotebook: async (id) => {
        const version = ++notebookLoadVersion;
        if (get().notebook?.id === id) return get().notebook;
        const nb = (await getNotebook(id)) ?? null;
        if (nb && version === notebookLoadVersion) {
          set((s) => {
            s.notebook = nb;
          });
        }
        return nb;
      },
      removeNotebook: async (id) => {
        ++notebookLoadVersion;
        await enqueueNotebookWrite(id, async () => {
          await deleteNotebook(id);
          set((s) => {
            s.notebooks = s.notebooks.filter((n) => n.id !== id);
            if (s.notebook?.id === id) s.notebook = null;
          });
        });
      },

      // 제목 변경 — 열린 노트북 대상. 평문 객체로 IDB 저장 후 인메모리 갱신(save-before-set).
      renameNotebook: async (id, title) => {
        await enqueueNotebookWrite(id, async () => {
          const open = get().notebook;
          const current = open?.id === id ? open : await getNotebook(id);
          if (!current || current.id !== id) {
            throw new Error(translate(get().settings.locale, 'notebook.changedBeforeSave'));
          }
          const next: Notebook = { ...current, title };
          await saveNotebook(next);
          set((s) => {
            if (s.notebook?.id === id) s.notebook.title = title;
            const i = s.notebooks.findIndex((n) => n.id === id);
            if (i >= 0) s.notebooks[i].title = title;
          });
        });
      },

      // 노트·마인드맵 편집 저장 — 큐 실행 시점의 최신 산출물에 변경 필드만 병합한다.
      updateNotebookArtifacts: async (id, patch) => {
        await enqueueNotebookWrite(id, async () => {
          const open = get().notebook;
          const current = open?.id === id ? open : await getNotebook(id);
          if (!current || current.id !== id) {
            throw new Error(translate(get().settings.locale, 'notebook.changedBeforeSave'));
          }
          const artifacts: GeneratedArtifacts = { ...current.artifacts, ...patch };
          const next: Notebook = { ...current, artifacts };
          await saveNotebook(next);
          set((s) => {
            if (s.notebook?.id === id) s.notebook.artifacts = artifacts;
          });
        });
      },

      // 편집 가능 공유 받기(Fork) — 새 로컬 id 로 사본 생성(원본/공유자 불변).
      importSharedNotebook: async (shared) => {
        const id = newId();
        const nb: Notebook = {
          id,
          title: shared.title,
          createdAt: new Date().toISOString(),
          // 공유 페이로드의 sources 는 {id, kind} 뿐(파일명 제외) → 표시용 title 은 kind 로.
          sources: (shared.sources ?? []).map((s) => ({ id: s.id, kind: s.kind, title: s.kind })),
          // 네트워크 페이로드 방어: errors 필수 필드 보강(ArtifactTabs 가 무조건 접근).
          artifacts: { ...shared.artifacts, errors: shared.artifacts?.errors ?? {} },
        };
        await saveNotebook(nb);
        set((s) => {
          s.notebook = nb;
          s.notebooks = [
            { id: nb.id, title: nb.title, createdAt: nb.createdAt },
            ...s.notebooks.filter((n) => n.id !== nb.id),
          ];
        });
        return id;
      },

      setProvider: (provider) =>
        set((s) => {
          s.settings.provider = provider;
        }),
      setProviderApiKey: (provider, key) =>
        set((s) => {
          s.settings.providers[provider].apiKey = key;
        }),
      setProviderModel: (provider, model) =>
        set((s) => {
          s.settings.providers[provider].model = model;
        }),
      setProviderBaseUrl: (provider, baseUrl) =>
        set((s) => {
          s.settings.providers[provider].baseUrl = baseUrl;
        }),
      setDepth: (depth) =>
        set((s) => {
          s.settings.depth = depth;
        }),
      setLocale: (locale) =>
        set((s) => {
          s.settings.locale = locale;
        }),
      toggleArtifact: (kind) =>
        set((s) => {
          s.settings.toggles[kind] = !s.settings.toggles[kind];
        }),
    })),
    {
      name: 'sf-store',
      // 설정만 영속(BYOK: 키는 이 브라우저 localStorage 에만). sources 는 휘발성.
      partialize: (s) => ({ settings: s.settings }),
      merge: (saved, current) => {
        const state = saved as { settings?: unknown } | undefined;
        return { ...current, settings: persistedSettings(state?.settings) };
      },
    },
  ),
);
