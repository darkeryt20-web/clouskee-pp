import {Component, ErrorInfo, ReactNode} from 'react';
import {AlertTriangle, Home, RotateCw} from 'lucide-react';

const CHUNK_RELOAD_FLAG = 'clouskee_chunk_reload_retried';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  errorMessage: string;
}

function isChunkLoadError(error: Error): boolean {
  const msg = `${error.name} ${error.message}`.toLowerCase();
  return (
    msg.includes('failed to fetch dynamically imported module') ||
    msg.includes('importing a module script failed') ||
    msg.includes('chunkloaderror') ||
    msg.includes('loading chunk') ||
    msg.includes('error loading dynamically imported module')
  );
}

export class LazyErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    errorMessage: '',
  };

  public static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      errorMessage: error.message || 'An unexpected rendering error occurred.',
    };
  }

  public componentDidCatch(error: Error, _errorInfo: ErrorInfo) {
    if (typeof window !== 'undefined' && isChunkLoadError(error)) {
      try {
        const alreadyRetried =
          window.sessionStorage.getItem(CHUNK_RELOAD_FLAG) === '1';
        if (!alreadyRetried) {
          window.sessionStorage.setItem(CHUNK_RELOAD_FLAG, '1');
          window.location.reload();
        }
      } catch {
        // Ignore sessionStorage restrictions
      }
    }
  }

  private handleManualReload = () => {
    try {
      window.sessionStorage.removeItem(CHUNK_RELOAD_FLAG);
    } catch {
      // Ignore
    }
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[80vh] bg-[#07030d] px-4 py-24 flex items-center justify-center">
          <div className="w-full max-w-md rounded-2xl bg-[#0e071a] border border-purple-500/30 p-7 text-center shadow-[0_24px_80px_rgba(7,3,13,0.9)]">
            <div className="mx-auto w-12 h-12 rounded-full bg-amber-500/15 border border-amber-400/30 flex items-center justify-center mb-4">
              <AlertTriangle
                className="w-6 h-6 text-amber-400"
                aria-hidden="true"
              />
            </div>

            <h1 className="text-xl font-bold text-white">
              Unable to load this page
            </h1>
            <p className="mt-2.5 text-xs sm:text-sm text-[#b2abc4] leading-relaxed">
              A new update may have been deployed or your connection dropped
              while fetching this view.
            </p>

            {this.state.errorMessage && (
              <p className="mt-3 rounded-lg bg-[#07030d] border border-purple-500/20 px-3 py-2 font-mono text-[11px] text-slate-400 break-words">
                {this.state.errorMessage}
              </p>
            )}

            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={this.handleManualReload}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#6d28d9] to-[#8b5cf6] hover:brightness-110 px-5 py-2.5 text-xs sm:text-sm font-semibold text-white cursor-pointer transition-all"
              >
                <RotateCw className="w-4 h-4" aria-hidden="true" />
                <span>Reload Page / Retry</span>
              </button>

              <a
                href="/"
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#160b29] border border-purple-500/30 px-5 py-2.5 text-xs sm:text-sm font-semibold text-slate-200 hover:text-white transition-colors"
              >
                <Home className="w-4 h-4" aria-hidden="true" />
                <span>Home</span>
              </a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
