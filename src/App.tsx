import { useState, useEffect } from 'react';
import { StockGameProvider } from './store/stockGameStore';
import { HomePage } from './pages/HomePage';
import { SetupPage } from './pages/SetupPage';
import { GamePage } from './pages/GamePage';
import { ResultPage } from './pages/ResultPage';
import { TeacherPage } from './pages/TeacherPage';
import { AudioController } from './components/AudioController';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ToastProvider } from './features/notifications/ToastProvider';
import { audioManager } from './utils/audioManager';


function MainRouter() {
  const [currentPage, setCurrentPage] = useState<string>(() => {
    if (typeof window === 'undefined') return 'home';

    const params = new URLSearchParams(window.location.search);
    if (params.get('teacher') === 'true' || params.get('mode') === 'teacher' || params.get('preset')) {
      return 'teacher';
    }

    const saved = localStorage.getItem('money_track_stock_game_state_v2');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.isGameStarted) {
          return parsed.isGameOver ? 'result' : 'game';
        }
      } catch (e) {
        console.error('Error parsing local storage stock game state', e);
      }
    }
    return 'home';
  });

  return (
    <div className="min-h-screen flex flex-col justify-between max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 relative">
      {/* Global Audio Controller */}
      <AudioController />

      <main className="flex-grow">
        {currentPage === 'home' && <HomePage onNavigate={setCurrentPage} />}
        {currentPage === 'setup' && <SetupPage onNavigate={setCurrentPage} />}
        {currentPage === 'game' && <GamePage onNavigate={setCurrentPage} />}
        {currentPage === 'result' && <ResultPage onNavigate={setCurrentPage} />}
        {currentPage === 'teacher' && <TeacherPage onNavigate={setCurrentPage} />}
      </main>

      <footer className="text-center py-6 text-[11px] text-slate-500 border-t border-slate-200/60 mt-12 space-y-1 select-text">
        <div className="font-bold text-slate-700">
          Copyright 2026. 하나고등학교 일반사회 교사 김윤구 All Right Reserved. (veblen@hana.hs.kr)
        </div>
        <div className="text-[10px] text-slate-400 font-medium">
          © 2026 머니트랙: 45년 한·미 주식투자 실험실 (1980~2025). 본 프로그램은 금융교육을 위한 실제 역사 데이터 기반 모의 시뮬레이션입니다.
        </div>
      </footer>
    </div>
  );
}
function App() {

  // Initialize audio system on first user click/keydown
  useEffect(() => {
    audioManager.init();

    const handleUnlockAudio = () => {
      audioManager.unlockAudioContext();
      window.removeEventListener('click', handleUnlockAudio);
      window.removeEventListener('keydown', handleUnlockAudio);
    };

    window.addEventListener('click', handleUnlockAudio);
    window.addEventListener('keydown', handleUnlockAudio);

    return () => {
      window.removeEventListener('click', handleUnlockAudio);
      window.removeEventListener('keydown', handleUnlockAudio);
    };
  }, []);

  return (
    <ErrorBoundary>
      <ToastProvider>
        <StockGameProvider>
          <MainRouter />
        </StockGameProvider>
      </ToastProvider>
    </ErrorBoundary>
  );
}



export default App;
