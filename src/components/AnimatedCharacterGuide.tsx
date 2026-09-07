import React from 'react';

export type CharacterMood = 'idle' | 'thinking' | 'event' | 'success' | 'warning';

interface AnimatedCharacterGuideProps {
  mood?: CharacterMood;
  title?: string;
  subtitle?: string;
  message?: string;
  compact?: boolean;
  className?: string;
}

export function AnimatedCharacterGuide({
  mood = 'idle',
  title = '나의 투자 길잡이',
  subtitle = '45년 시장 해설가',
  message = '1980년 말부터 시작된 대한민국과 미국의 경제사 속에서 원칙을 지키는 투자를 설계해 보세요!',
  compact = false,
  className = '',
}: AnimatedCharacterGuideProps) {
  const [isHovered, setIsHovered] = React.useState(false);

  const isEvent = mood === 'event' || mood === 'warning';
  const isSuccess = mood === 'success';

  // 상황별 세부 상태 및 색상 매핑
  const getMoodConfig = () => {
    switch (mood) {
      case 'warning':
        return {
          border: 'border-rose-200/80 shadow-rose-100/50',
          titleBg: 'bg-rose-50 text-rose-700',
          bubbleBg: 'bg-rose-50/90 border-rose-100/70',
          status: '⚠️ 위험 분석 중'
        };
      case 'success':
        return {
          border: 'border-emerald-200/80 shadow-emerald-100/50',
          titleBg: 'bg-emerald-50 text-emerald-700',
          bubbleBg: 'bg-emerald-50/90 border-emerald-100/70',
          status: '🎉 목표 달성'
        };
      case 'thinking':
        return {
          border: 'border-violet-200/80 shadow-violet-100/50',
          titleBg: 'bg-violet-50 text-violet-700',
          bubbleBg: 'bg-violet-50/90 border-violet-100/70',
          status: '🤔 퀀트 분석 중'
        };
      case 'event':
        return {
          border: 'border-amber-200/80 shadow-amber-100/50',
          titleBg: 'bg-amber-50 text-amber-700',
          bubbleBg: 'bg-amber-50/90 border-amber-100/70',
          status: '📢 시장 브리핑'
        };
      case 'idle':
      default:
        return {
          border: 'border-white/70',
          titleBg: 'bg-blue-50 text-blue-700',
          bubbleBg: 'bg-white/85 border-white/70',
          status: '💡 투자 인사이트'
        };
    }
  };

  const conf = getMoodConfig();

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={[
        'relative overflow-hidden rounded-3xl border bg-white/80 backdrop-blur-xl shadow-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl group',
        conf.border,
        className,
      ].join(' ')}
    >
      <CharacterStyles />
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/90 via-white/75 to-indigo-50/80" />
      <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-blue-200/30 blur-2xl animate-pulse-slow" />
      <div className="absolute -left-10 bottom-10 h-32 w-32 rounded-full bg-indigo-200/30 blur-2xl animate-pulse-slow" style={{ animationDelay: '2.5s' }} />

      {/* 이벤트/경보 펄스 링 */}
      {isEvent && (
        <div className="absolute left-1/2 top-[40%] h-56 w-56 -translate-x-1/2 -translate-y-1/2 rounded-full border border-blue-400/25 character-pulse-ring pointer-events-none" />
      )}

      {/* 성공 시 반짝이 입자 */}
      {isSuccess && (
        <>
          <span className="absolute right-10 top-16 h-2.5 w-2.5 rounded-full bg-yellow-400 character-sparkle" />
          <span className="absolute left-12 top-24 h-2 w-2 rounded-full bg-emerald-400 character-sparkle delay-200" />
          <span className="absolute right-16 bottom-24 h-1.5 w-1.5 rounded-full bg-blue-400 character-sparkle delay-500" />
        </>
      )}

      <div className="relative z-10 p-5">
        {/* 상단 헤더 영역 */}
        <div className="flex justify-between items-center mb-4 pb-2.5 border-b border-slate-100/50 select-none">
          <div className={`inline-flex items-center gap-2 rounded-2xl px-3.5 py-1.5 text-[11px] font-black shadow-sm border border-slate-200/20 ${conf.titleBg}`}>
            <span className="text-xs">🎯</span>
            {title}
          </div>
          <span className="text-[9px] text-slate-500 font-extrabold bg-white/90 px-2.5 py-1 rounded-full border border-slate-200/50 shadow-sm">
            {conf.status}
          </span>
        </div>

        <div className="relative mx-auto flex flex-col items-center justify-center">
          {/* 캐릭터 바닥 타원형 그림자 */}
          <div 
            className="absolute bottom-2 h-2.5 rounded-full bg-slate-900/20 blur-sm character-shadow transition-all duration-300"
            style={{ width: '160px' }}
          />

          {/* 캐릭터 모션 래퍼 */}
          <div className={(mood === 'thinking' || mood === 'warning') ? 'character-tilt' : ''}>
            <div className="relative transition-all duration-500 transform group-hover:-translate-y-2.5 group-hover:scale-[1.03] z-20">
              <img
                src={isHovered ? 'images/character-guide.gif' : 'images/character-guide.png'}
                alt="머니트랙 투자 길잡이"
                className={[
                  compact ? 'h-44' : 'h-64',
                  'character-motion object-contain drop-shadow-2xl relative z-20 mix-blend-multiply',
                ].join(' ')}
              />

              {/* 생각 중 말풍선 아이콘 */}
              {mood === 'thinking' && (
                <div className="absolute left-[54%] top-[4%] z-20 pointer-events-none select-none text-[12px] font-black text-violet-500 animate-bounce">
                  💡
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 상황에 맞는 커스텀 말풍선 패널 */}
        <div className={`relative -mt-3 z-10 rounded-2xl p-4 text-sm text-slate-600 shadow-md border character-bubble ${conf.bubbleBg}`}>
          <div className="absolute -top-1.5 left-12 h-3 w-3 rotate-45 bg-inherit border-l border-t border-inherit z-0" />
          <p className="text-xs font-bold text-blue-600 mb-1 select-none">{subtitle}</p>
          <p className="leading-relaxed font-bold text-slate-700 text-xs">{message}</p>

          {mood === 'thinking' && (
            <div className="mt-2.5 flex gap-1.5" aria-label="생각 중">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-400 character-dot" style={{ animationDelay: '0ms' }} />
              <span className="h-1.5 w-1.5 rounded-full bg-blue-400 character-dot" style={{ animationDelay: '150ms' }} />
              <span className="h-1.5 w-1.5 rounded-full bg-blue-400 character-dot" style={{ animationDelay: '300ms' }} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const CharacterStyles: React.FC = () => (
  <style>{`
    @keyframes characterFloat {
      0%, 100% { transform: translateY(0) scale(1); }
      50% { transform: translateY(-6px) scale(1.01); }
    }
    @keyframes characterBreath {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.01); }
    }
    @keyframes characterTilt {
      0%, 100% { transform: rotate(-0.8deg); }
      50% { transform: rotate(0.8deg); }
    }
    @keyframes characterShadow {
      0%, 100% { transform: scale(1); opacity: 0.22; }
      50% { transform: scale(0.88); opacity: 0.14; }
    }
    @keyframes softPulseRing {
      0% { transform: scale(0.92); opacity: 0.55; }
      100% { transform: scale(1.25); opacity: 0; }
    }
    @keyframes sparkleFade {
      0%, 100% { opacity: 0.2; transform: translateY(0) scale(0.9); }
      50% { opacity: 0.9; transform: translateY(-4px) scale(1.1); }
    }
    @keyframes bubbleFadeUp {
      0% { opacity: 0; transform: translateY(6px); }
      100% { opacity: 1; transform: translateY(0); }
    }
    @keyframes typingDot {
      0%, 80%, 100% { opacity: 0.25; transform: translateY(0); }
      40% { opacity: 1; transform: translateY(-2px); }
    }

    .character-motion {
      transform-origin: bottom center;
      transition: transform 0.3s ease-in-out;
    }
    .group:hover .character-motion {
      animation: characterFloat 3.8s ease-in-out infinite, characterBreath 3.8s ease-in-out infinite;
    }
    
    .character-shadow {
      transform-origin: center;
      transition: transform 0.3s ease-in-out, opacity 0.3s ease-in-out;
    }
    .group:hover .character-shadow {
      animation: characterShadow 3.8s ease-in-out infinite;
    }

    .character-tilt {
      display: inline-block;
      transform-origin: bottom center;
      transition: transform 0.3s ease-in-out;
    }
    .group:hover .character-tilt {
      animation: characterTilt 3.5s ease-in-out infinite;
    }

    .character-pulse-ring {
      transform-origin: center;
      opacity: 0;
    }
    .group:hover .character-pulse-ring {
      animation: softPulseRing 1.8s ease-out infinite;
    }

    .character-sparkle { opacity: 0.2; }
    .group:hover .character-sparkle { animation: sparkleFade 1.6s ease-in-out infinite; }
    .character-bubble { animation: bubbleFadeUp 0.45s ease-out forwards; }
    .character-dot { animation: typingDot 1.4s infinite ease-in-out; }

    @keyframes pulse-slow {
      0%, 100% { opacity: 0.35; transform: scale(0.95); }
      50% { opacity: 0.65; transform: scale(1.05); }
    }
    .group:hover .animate-pulse-slow { animation: pulse-slow 6s ease-in-out infinite; }

    @media (prefers-reduced-motion: reduce) {
      .character-motion, .character-shadow, .character-sparkle, .character-bubble, .character-tilt, .character-pulse-ring, .character-dot {
        animation: none !important;
        transform: none !important;
        opacity: 1 !important;
      }
    }
  `}</style>
);
