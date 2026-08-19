import { Component, type ErrorInfo, type ReactNode } from 'react';

import { RotateCcw, AlertTriangle, Home } from 'lucide-react';
import { GlassCard } from './GlassCard';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an unhandled error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  private handleClearStorage = () => {
    localStorage.removeItem('money_track_stock_game_state_v2');
    window.location.href = window.location.pathname;
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-slate-950 text-slate-100">
          <GlassCard className="max-w-lg w-full p-6 text-center space-y-4 border-slate-700/80 bg-slate-900/90 shadow-2xl" variant="strong">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto border border-rose-500/30">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div>
              <h2 className="text-lg font-black text-white">화면 표시 중 오류가 발생했습니다</h2>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                데이터 처리 또는 화면 렌더링 중 예기치 않은 오류가 발생했습니다. 아래 버튼을 눌러 안전하게 복구할 수 있습니다.
              </p>
            </div>

            {this.state.error && (
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-left text-[11px] font-mono text-rose-300 max-h-28 overflow-y-auto">
                {this.state.error.toString()}
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <button
                onClick={this.handleReset}
                className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs transition flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-blue-600/30"
              >
                <RotateCcw size={15} />
                <span>화면 다시 불러오기</span>
              </button>

              <button
                onClick={this.handleClearStorage}
                className="py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs transition flex items-center justify-center gap-1.5 cursor-pointer border border-slate-700"
              >
                <Home size={15} />
                <span>처음으로 이동</span>
              </button>
            </div>
          </GlassCard>
        </div>
      );
    }

    return this.props.children;
  }
}
