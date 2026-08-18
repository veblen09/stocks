import { useState, useEffect } from 'react';
import { GameProvider } from './store/gameStore';
import { HomePage } from './pages/HomePage';
import { MobileAppHomePage } from './pages/MobileAppHomePage';
import { SetupPage } from './pages/SetupPage';
import { GamePage } from './pages/GamePage';
import { ResultPage } from './pages/ResultPage';
import { TeacherPage } from './pages/TeacherPage';
import { AudioController } from './components/AudioController';
import { AppModeBanner } from './components/AppModeBanner';
import { audioManager } from './utils/audioManager';

function App() {
  // QR 코드 접속 (?app=true, ?mode=app 등) 및 어플 모드 여부 감지
  const [isQRAppMode, setIsQRAppMode] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const params = new URLSearchParams(window.location.search);
    const hasAppParam = 
      params.get('app') === 'true' || 
      params.get('mode') === 'app' || 
      params.get('qr') === 'true' ||
      params.get('mobile') === 'true';
    const standaloneMode = 
      window.matchMedia('(display-mode: standalone)').matches || 
      (window.navigator as any).standalone === true;
    return hasAppParam || standaloneMode;
  });

  // 새로고침 시 이어서 진행할 수 있도록 초기 페이지 선택
  const [currentPage, setCurrentPage] = useState<string>(() => {
    const saved = localStorage.getItem('money_track_game_state');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.nickname) {
          return parsed.isGameOver ? 'result' : 'game';
        }
      } catch (e) {
        console.error('Error parsing local storage game state', e);
      }
    }
    return 'home';
  });

  // 오디오 시스템 초기화 및 자동재생 차단 해제 연동
  useEffect(() => {
    audioManager.init();

    const handleUnlockAudio = () => {
      audioManager.unlockAudioContext();
      
      // 첫 상호작용 후 리스너 제거
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
    <GameProvider>
      <div className="min-h-screen flex flex-col justify-between max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 relative">
        {/* QR 접속 어플 모드 상단 배너 및 어플 설치 안내 */}
        <AppModeBanner onStartGame={() => setCurrentPage('setup')} />

        {/* 글로벌 오디오 설정 제어기 */}
        <AudioController />

        <main className="flex-grow">
          {currentPage === 'home' && (
            isQRAppMode ? (
              <MobileAppHomePage 
                onNavigate={setCurrentPage} 
                onSwitchToWebMode={() => setIsQRAppMode(false)} 
              />
            ) : (
              <HomePage onNavigate={setCurrentPage} />
            )
          )}
          {currentPage === 'setup' && <SetupPage onNavigate={setCurrentPage} />}
          {currentPage === 'game' && <GamePage onNavigate={setCurrentPage} />}
          {currentPage === 'result' && <ResultPage onNavigate={setCurrentPage} />}
          {currentPage === 'teacher' && <TeacherPage onNavigate={setCurrentPage} />}
        </main>
        
        <footer className="text-center py-6 text-[10px] text-slate-400 border-t border-slate-200/40 mt-12 no-print space-y-1 font-semibold">
          <div>Copyright 2026. 하나고등학교 일반사회 교사 김윤구 All Right Reserved. (veblen@hana.hs.kr)</div>
          <div>&copy; {new Date().getFullYear()} 머니트랙: 20년 자산관리 실험실. 본 프로그램은 금융교육을 위한 가상 시뮬레이션입니다.</div>
        </footer>
      </div>
    </GameProvider>
  );
}

export default App;
