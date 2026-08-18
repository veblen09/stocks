import React, { useState, useEffect } from 'react';
import { Landmark, Compass, Smartphone, Download, Share2, PlusSquare, ChevronRight, Globe } from 'lucide-react';
import { GlassCard } from '../components/GlassCard';
import { audioManager } from '../utils/audioManager';

interface MobileAppHomePageProps {
  onNavigate: (page: string) => void;
  onSwitchToWebMode?: () => void;
}

export const MobileAppHomePage: React.FC<MobileAppHomePageProps> = ({ onNavigate, onSwitchToWebMode }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState<boolean>(false);
  const [showInstallGuide, setShowInstallGuide] = useState<boolean>(false);

  useEffect(() => {
    const userAgent = window.navigator.userAgent.toLowerCase();
    setIsIOS(/iphone|ipad|ipod/.test(userAgent));

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    } else {
      setShowInstallGuide(true);
    }
  };

  return (
    <div className="min-h-[85vh] flex flex-col items-center justify-between py-4 px-2 animate-fade-in">
      {/* 상단 모바일 어플 뱃지 */}
      <div className="w-full max-w-md bg-gradient-to-r from-indigo-900 via-indigo-800 to-purple-900 text-white rounded-2xl p-3.5 shadow-xl flex items-center justify-between border border-indigo-500/30">
        <div className="flex items-center space-x-2.5">
          <div className="w-9 h-9 rounded-xl bg-indigo-500/30 flex items-center justify-center border border-indigo-400/40">
            <Smartphone className="w-5 h-5 text-indigo-200 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="font-extrabold text-sm tracking-tight">머니트랙 모바일 어플</span>
              <span className="text-[10px] bg-emerald-500 text-white font-extrabold px-2 py-0.5 rounded-full shadow-sm">
                QR 접속됨
              </span>
            </div>
            <p className="text-[11px] text-indigo-200/90">스마트폰 전용 인터페이스</p>
          </div>
        </div>

        {onSwitchToWebMode && (
          <button
            onClick={onSwitchToWebMode}
            className="text-[11px] bg-white/15 hover:bg-white/25 text-indigo-100 px-2.5 py-1.5 rounded-xl font-medium flex items-center gap-1 transition active:scale-95"
          >
            <Globe className="w-3.5 h-3.5" />
            <span>웹 버전</span>
          </button>
        )}
      </div>

      {/* 메인 어플 카드 UI */}
      <div className="w-full max-w-md my-auto space-y-4">
        <GlassCard className="p-6 text-center space-y-5 border-indigo-500/30 shadow-2xl relative overflow-hidden" variant="strong">
          <div className="absolute -top-16 -right-16 w-32 h-32 bg-indigo-500/20 rounded-full blur-2xl pointer-events-none" />
          
          {/* 어플 아이콘 & 타이틀 */}
          <div className="space-y-2">
            <div className="w-16 h-16 bg-gradient-to-tr from-indigo-600 to-purple-600 text-white rounded-3xl flex items-center justify-center mx-auto shadow-xl shadow-indigo-600/30">
              <Landmark size={32} />
            </div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">
              머니트랙 어플
            </h1>
            <p className="text-xs font-bold text-indigo-600">
              20년 자산관리 모바일 시뮬레이터
            </p>
          </div>

          {/* 간략 설명 */}
          <div className="bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200/60 text-xs text-slate-600 leading-relaxed font-medium">
            QR 코드를 통해 어플 전용 모드로 접속하셨습니다.<br />
            20대 사회초년생이 되어 20년 동안의 저축과 투자를 직관적으로 체험해 보세요!
          </div>

          {/* 주요 작업 버튼들 */}
          <div className="space-y-2.5 pt-2">
            {/* 1. 게임 시작 버튼 */}
            <button
              onClick={() => {
                audioManager.playSound('click');
                onNavigate('setup');
              }}
              className="w-full py-4 px-6 bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 hover:from-indigo-700 hover:to-purple-800 text-white font-extrabold rounded-2xl shadow-xl shadow-indigo-600/25 transition-all flex items-center justify-center space-x-2 text-base active:scale-98 cursor-pointer"
            >
              <Compass className="w-5 h-5" />
              <span>🎮 어플 게임 시작하기</span>
              <ChevronRight className="w-5 h-5" />
            </button>

            {/* 2. 앱 설치 버튼 */}
            <button
              onClick={handleInstallClick}
              className="w-full py-3 px-5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 font-extrabold rounded-2xl shadow-lg transition-all flex items-center justify-center space-x-2 text-xs active:scale-98 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>📲 스마트폰 바탕화면에 앱 아이콘 추가</span>
            </button>
          </div>
        </GlassCard>

        {/* 앱 설치 안내 펼침 가이드 */}
        {showInstallGuide && (
          <div className="bg-slate-900 text-white p-4 rounded-2xl border border-indigo-500/30 text-xs space-y-2 animate-fade-in shadow-xl">
            <div className="font-extrabold text-amber-300 flex items-center justify-between">
              <span>바탕화면 앱 설치 방법</span>
              <button onClick={() => setShowInstallGuide(false)} className="text-slate-400 hover:text-white">닫기</button>
            </div>
            {isIOS ? (
              <p className="text-slate-300 leading-relaxed">
                Safari 하단 중앙의 <strong className="text-white inline-flex items-center gap-1"><Share2 className="w-3 h-3 text-indigo-400" /> 공유</strong> 버튼을 누른 후, 목록에서 <strong className="text-white inline-flex items-center gap-1"><PlusSquare className="w-3 h-3 text-indigo-400" /> 홈 화면에 추가</strong>를 선택하세요!
              </p>
            ) : (
              <p className="text-slate-300 leading-relaxed">
                크롬/네이버 브라우저 우측 상단 메뉴(⋮)에서 <strong>"홈 화면에 추가"</strong> 또는 <strong>"앱 설치"</strong>를 누르면 바탕화면에 생성됩니다!
              </p>
            )}
          </div>
        )}
      </div>

      {/* 하단 저작권 */}
      <footer className="text-center text-[10px] text-slate-400 font-medium py-2">
        &copy; {new Date().getFullYear()} 머니트랙 모바일 어플 모드
      </footer>
    </div>
  );
};
