import React, { useState, useEffect } from 'react';
import { Smartphone, Download, Share2, PlusSquare, CheckCircle, X, Sparkles, ArrowRight } from 'lucide-react';

interface AppModeBannerProps {
  onStartGame?: () => void;
}

export const AppModeBanner: React.FC<AppModeBannerProps> = ({ onStartGame }) => {
  const [isAppMode, setIsAppMode] = useState<boolean>(false);
  const [showInstallModal, setShowInstallModal] = useState<boolean>(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState<boolean>(false);
  const [isStandalone, setIsStandalone] = useState<boolean>(false);

  useEffect(() => {
    // 1. URL 파라미터 확인 (?app=true, ?mode=app, ?qr=true 등)
    const params = new URLSearchParams(window.location.search);
    const hasAppParam = 
      params.get('app') === 'true' || 
      params.get('mode') === 'app' || 
      params.get('qr') === 'true' ||
      params.get('mobile') === 'true';

    // 2. 홈 화면 아이콘 설치(Standalone PWA) 여부 확인
    const standaloneMode = 
      window.matchMedia('(display-mode: standalone)').matches || 
      (window.navigator as any).standalone === true;
    setIsStandalone(standaloneMode);

    if (hasAppParam || standaloneMode) {
      setIsAppMode(true);
      // QR 코드로 처음 들어왔을 때 팝업 표시 (이미 닫았던 기록이 없으면)
      const dismissed = sessionStorage.getItem('moneytrack_app_modal_dismissed');
      if (!dismissed) {
        setShowInstallModal(true);
      }
    }

    // 3. iOS 디바이스 여부 확인
    const userAgent = window.navigator.userAgent.toLowerCase();
    const iosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(iosDevice);

    // 4. Chrome/Android PWA 설치 이벤트 감지
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
        setShowInstallModal(false);
      }
      setDeferredPrompt(null);
    }
  };

  const handleDismissModal = () => {
    setShowInstallModal(false);
    sessionStorage.setItem('moneytrack_app_modal_dismissed', 'true');
  };

  if (!isAppMode) return null;

  return (
    <>
      {/* 📱 어플 모드 상단 배너 */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-purple-900 text-white px-4 py-2.5 rounded-2xl mb-4 shadow-lg flex items-center justify-between border border-indigo-500/30">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-full bg-indigo-500/30 flex items-center justify-center border border-indigo-400/40 animate-pulse">
            <Smartphone className="w-4 h-4 text-indigo-200" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-sm tracking-tight">📱 머니트랙 모바일 어플 모드</span>
              <span className="text-[10px] bg-emerald-500 text-white font-extrabold px-2 py-0.5 rounded-full shadow-sm">
                QR 접속
              </span>
            </div>
            <p className="text-xs text-indigo-200/90 hidden sm:block">
              스마트폰 터치에 최적화된 모바일 화면으로 게임이 진행됩니다.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {!isStandalone && (
            <button
              onClick={() => setShowInstallModal(true)}
              className="flex items-center space-x-1.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 font-bold px-3 py-1.5 rounded-xl text-xs shadow-md transition-all active:scale-95"
            >
              <Download className="w-3.5 h-3.5" />
              <span>앱 설치</span>
            </button>
          )}
          {onStartGame && (
            <button
              onClick={onStartGame}
              className="flex items-center space-x-1 bg-white/20 hover:bg-white/30 text-white font-semibold px-3 py-1.5 rounded-xl text-xs transition-all active:scale-95"
            >
              <span>게임 시작</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* 📲 홈 화면 앱 설치 유도 모달 */}
      {showInstallModal && !isStandalone && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div className="bg-slate-900 border border-indigo-500/40 rounded-3xl p-6 max-w-md w-full text-white shadow-2xl relative overflow-hidden">
            {/* 은은한 배경 오라 */}
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />

            <button
              onClick={handleDismissModal}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center space-y-3 mb-6">
              <div className="inline-flex p-3 bg-gradient-to-tr from-indigo-600 to-purple-600 rounded-2xl shadow-lg ring-4 ring-indigo-500/20">
                <Sparkles className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-white via-indigo-100 to-indigo-300 bg-clip-text text-transparent">
                스마트폰 바탕화면에 앱 설치하기
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                QR 코드로 접속하셨습니다! 스마트폰 바탕화면에 어플 아이콘을 추가하면 <strong className="text-amber-300">주소창 없는 전체화면 앱</strong>으로 언제든 편하게 접속하실 수 있습니다.
              </p>
            </div>

            {/* 설치 방법 안내 */}
            <div className="bg-slate-800/80 border border-slate-700/60 rounded-2xl p-4 space-y-3 text-xs mb-6">
              {deferredPrompt ? (
                /* Chrome/Android 원클릭 버튼 */
                <div className="text-center py-2">
                  <button
                    onClick={handleInstallClick}
                    className="w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600 hover:from-indigo-600 hover:to-purple-600 text-white font-bold py-3 px-4 rounded-xl shadow-lg flex items-center justify-center space-x-2 text-sm transition-all transform active:scale-98"
                  >
                    <Download className="w-4 h-4" />
                    <span>원클릭으로 바탕화면에 어플 추가</span>
                  </button>
                </div>
              ) : isIOS ? (
                /* iOS 사파리 안내 */
                <div className="space-y-2.5">
                  <div className="font-bold text-amber-300 flex items-center space-x-1">
                    <span>iPhone / iPad (Safari) 설치 방법:</span>
                  </div>
                  <ol className="space-y-2 text-slate-300 pl-1">
                    <li className="flex items-center space-x-2">
                      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-slate-700 text-amber-300 flex items-center justify-center font-bold text-[11px]">1</span>
                      <span>하단 중앙의 <strong className="text-white font-semibold flex inline-flex items-center gap-1"><Share2 className="w-3.5 h-3.5 text-indigo-400" /> 공유 버튼</strong>을 누릅니다.</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-slate-700 text-amber-300 flex items-center justify-center font-bold text-[11px]">2</span>
                      <span>메뉴 목록을 내려 <strong className="text-white font-semibold flex inline-flex items-center gap-1"><PlusSquare className="w-3.5 h-3.5 text-indigo-400" /> 홈 화면에 추가</strong>를 선택합니다.</span>
                    </li>
                  </ol>
                </div>
              ) : (
                /* Android / 브라우저 일반 안내 */
                <div className="space-y-2.5">
                  <div className="font-bold text-amber-300">스마트폰 브라우저 설치 방법:</div>
                  <ol className="space-y-2 text-slate-300 pl-1">
                    <li className="flex items-center space-x-2">
                      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-slate-700 text-amber-300 flex items-center justify-center font-bold text-[11px]">1</span>
                      <span>브라우저 우측 상단 메뉴 <strong className="text-white font-semibold">(⋮ 또는 더보기)</strong>를 누릅니다.</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-slate-700 text-amber-300 flex items-center justify-center font-bold text-[11px]">2</span>
                      <span><strong className="text-white font-semibold">"홈 화면에 추가"</strong> 또는 <strong className="text-white font-semibold">"앱 설치"</strong>를 누릅니다.</span>
                    </li>
                  </ol>
                </div>
              )}
            </div>

            <div className="flex space-x-3">
              <button
                onClick={handleDismissModal}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold py-2.5 rounded-xl transition-colors text-xs"
              >
                닫기 (웹으로 이용)
              </button>
              {onStartGame && (
                <button
                  onClick={() => {
                    handleDismissModal();
                    onStartGame();
                  }}
                  className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold py-2.5 rounded-xl transition-all shadow-md text-xs flex items-center justify-center space-x-1"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>게임 시작하기</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
