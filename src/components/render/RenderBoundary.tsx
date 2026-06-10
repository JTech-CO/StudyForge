import { Component, type ReactNode } from 'react';
import { translate } from '../../lib/i18n/strings';
import { useStore } from '../../lib/store';

interface Props {
  children: ReactNode;
  label?: string;
}
interface State {
  error: Error | null;
}

/**
 * 렌더 격리 경계: 무거운 렌더러(Markdown/마인드맵)가 throw 해도
 * 노트북 전체가 깨지지 않고 해당 영역만 폴백한다(HARNESS §4.3 블록 격리).
 */
export class RenderBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidUpdate(prev: Props) {
    // 콘텐츠가 바뀌면 다시 렌더 시도
    if (prev.children !== this.props.children && this.state.error) {
      this.setState({ error: null });
    }
  }

  render() {
    if (this.state.error) {
      const locale = useStore.getState().settings.locale;
      const msg = this.state.error.message || '';
      // 개발 서버 재시작·신규 배포로 lazy 청크 URL 이 무효화된 경우(stale chunk)
      const isChunkError =
        /dynamically imported module|Failed to fetch|Importing a module script failed|ChunkLoadError|error loading dynamically/i.test(
          msg,
        );
      if (isChunkError) {
        return (
          <div className="rounded-lg border border-dashed border-border px-4 py-12 text-center">
            <p className="text-sm font-medium text-fg">{translate(locale, 'render.staleTitle')}</p>
            <p className="mt-1 text-xs text-muted">
              {translate(locale, 'render.staleDesc')}
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-4 inline-flex h-9 items-center justify-center rounded-lg bg-accent px-4 text-sm font-medium text-accent-fg transition-colors duration-100 hover:bg-accent/90"
            >
              {translate(locale, 'render.refresh')}
            </button>
          </div>
        );
      }
      return (
        <div className="rounded-lg border border-dashed border-border px-4 py-12 text-center">
          <p className="text-sm text-error">
            {translate(locale, 'render.failed', { label: this.props.label ?? translate(locale, 'render.thisArea') })}
          </p>
          <p className="mt-1 text-xs text-muted">{msg}</p>
        </div>
      );
    }
    return this.props.children;
  }
}
