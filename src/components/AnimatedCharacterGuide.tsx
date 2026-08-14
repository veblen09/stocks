import React from 'react';

export type CharacterMood = 'idle' | 'thinking' | 'event' | 'success' | 'warning';

interface AnimatedCharacterGuideProps {
  mood?: CharacterMood;
  title?: string;
  subtitle?: string;
  message?: string;
  compact?: boolean;
  className?: string;
  age?: number;
  useSprite?: boolean;
}

export function AnimatedCharacterGuide({
  mood = 'idle',
  title = '20대 싱글 청년',
  subtitle = '사회초년생 자산관리 실험 참가자',
  message = '이번 턴에는 어떤 선택을 해볼까요?',
  compact = false,
  className = '',
  age,
  useSprite = false,
}: AnimatedCharacterGuideProps) {
  const [isHovered, setIsHovered] = React.useState(false);

  const isEvent = mood === 'event' || mood === 'warning';
  const isSuccess = mood === 'success';

  // 나이대별 이미지 결정 (반신 늙어가는 모드용)
  let characterImg = 'images/character-guide.gif'; // 25세
  if (age !== undefined) {
    if (age >= 55) {
      characterImg = 'images/character-guide-60s.png'; // 은퇴 준비 / 은퇴 생활 (50~60대 이상)
    } else if (age >= 30) {
      characterImg = 'images/character-guide-30s.png'; // 배우자 / 자녀 등장 / 가족 재무관리 (30~40대)
    }
  }

  // 나이대별 전신 이미지 결정 (생애 변화 및 가족/목표 변화 탭용)
  let fullBodyImg = 'images/character-avatar.png'; // 25세 -> 사회초년생
  if (age !== undefined) {
    if (age >= 55) {
      fullBodyImg = 'images/character-avatar-30s.png'; // 55세 이상 -> 은퇴 준비 및 은퇴 생활 (부부만 남음)
    } else if (age >= 35) {
      fullBodyImg = 'images/character-avatar-35s.png'; // 35세 -> 자녀 등장 및 가족 재무관리 (부부+자녀)
    } else if (age >= 30) {
      fullBodyImg = 'images/character-avatar-30s.png'; // 30세 -> 배우자 등장 (부부)
    }
  }

  // 상황별 세부 상태 및 색상 매핑
  const getMoodConfig = () => {
    switch (mood) {
      case 'warning':
        return {
          border: 'border-rose-200/80 shadow-rose-100/50',
          titleBg: 'bg-rose-50 text-rose-700',
          bubbleBg: 'bg-rose-50/90 border-rose-100/70',
          status: '⚠️ 위험 경보'
        };
      case 'success':
        return {
          border: 'border-emerald-200/80 shadow-emerald-100/50',
          titleBg: 'bg-emerald-50 text-emerald-700',
          bubbleBg: 'bg-emerald-50/90 border-emerald-100/70',
          status: '🎉 성취 완료'
        };
      case 'thinking':
        return {
          border: 'border-violet-200/80 shadow-violet-100/50',
          titleBg: 'bg-violet-50 text-violet-700',
          bubbleBg: 'bg-violet-50/90 border-violet-100/70',
          status: '🤔 생각 정리 중'
        };
      case 'event':
        return {
          border: 'border-amber-200/80 shadow-amber-100/50',
          titleBg: 'bg-amber-50 text-amber-700',
          bubbleBg: 'bg-amber-50/90 border-amber-100/70',
          status: '📢 소식 통신 중'
        };
      case 'idle':
      default:
        return {
          border: 'border-white/70',
          titleBg: 'bg-emerald-50 text-emerald-700',
          bubbleBg: 'bg-white/85 border-white/70',
          status: '💡 상시 가이드'
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
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/90 via-white/75 to-emerald-50/80" />
      <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-blue-200/30 blur-2xl animate-pulse-slow" />
      <div className="absolute -left-10 bottom-10 h-32 w-32 rounded-full bg-emerald-200/30 blur-2xl animate-pulse-slow" style={{ animationDelay: '2.5s' }} />

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
        {/* 더 강조된 상단 헤더 영역 (경계선 구분 및 배지 음영 강화) */}
        <div className="flex justify-between items-center mb-5 pb-3 border-b border-slate-100/50 select-none">
          <div className={`inline-flex items-center gap-2 rounded-2xl px-3.5 py-1.5 text-[11px] font-black shadow-sm border border-slate-200/20 ${conf.titleBg}`}>
            <span className="text-xs">🎯</span>
            {title}
          </div>
          <span className="text-[9px] text-slate-500 font-extrabold bg-white/90 px-2.5 py-1 rounded-full border border-slate-200/50 shadow-sm">
            {conf.status}
          </span>
        </div>

        <div className="relative mx-auto flex flex-col items-center justify-center">
          {/* 캐릭터 바닥 타원형 그림자 - 전신 크기에 맞춤 */}
          <div 
            className="absolute bottom-2 h-2.5 rounded-full bg-slate-900/20 blur-sm character-shadow transition-all duration-300"
            style={{ width: useSprite ? '110px' : '160px' }}
          />

          {/* 생각/경고 중일 때 고개를 미세하게 기울이는 래퍼 */}
          <div className={(mood === 'thinking' || mood === 'warning') ? 'character-tilt' : ''}>
            {/* 호버 시 캐릭터가 살짝 더 위로 올라가며 커지는 애니메이션을 위한 래퍼 (z-20) */}
            <div className="relative transition-all duration-500 transform group-hover:-translate-y-2.5 group-hover:scale-[1.03] z-20">
              {useSprite ? (
                /* 전신 고정 캐릭터 이미지 렌더링 (화면이 이동하거나 왔다 갔다 하지 않도록 고정) */
                <img
                  src={fullBodyImg}
                  alt="생애 단계 전신 캐릭터"
                  className={[
                    compact ? 'h-56' : 'h-80',
                    'character-motion object-contain drop-shadow-2xl relative z-20 mix-blend-multiply',
                  ].join(' ')}
                />
              ) : (
                /* 예전 반신 이미지 늙어가는 버전 렌더링 (마우스 호버 시에만 움직이는 GIF로 전환) */
                <img
                  src={isHovered ? characterImg : (characterImg === 'images/character-guide.gif' ? 'images/character-guide.png' : characterImg)}
                  alt="머니트랙 자산관리 가이드 캐릭터"
                  className={[
                    compact ? 'h-56' : 'h-80',
                    'character-motion object-contain drop-shadow-2xl relative z-20 mix-blend-multiply',
                  ].join(' ')}
                />
              )}

              {/* [위기 상황 표정 변화] 파랗게 질린 이마 + 식은땀 방울 💧 (고정 이미지 위치 대응) */}
              {mood === 'warning' && (
                <div className="absolute inset-0 z-20 pointer-events-none select-none">
                  {/* 파랗게 질린 이마 그늘 */}
                  <div 
                    className="absolute bg-gradient-to-b from-blue-600/50 via-blue-500/20 to-transparent rounded-b-md filter blur-[0.8px] mix-blend-multiply"
                    style={{
                      left: '44%',
                      top: useSprite ? '9%' : '14%',
                      width: useSprite ? '10%' : '7%',
                      height: useSprite ? '3%' : '4%'
                    }}
                  />
                  {/* 식은땀 흘러내림 */}
                  <svg 
                    className="absolute text-sky-400 fill-current animate-satie-sweat"
                    style={{
                      left: useSprite ? '53%' : '52%',
                      top: useSprite ? '8%' : '13%',
                      width: useSprite ? '12px' : '14px',
                      height: useSprite ? '12px' : '14px'
                    }}
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
                  </svg>
                </div>
              )}

              {/* [성공 상황 표정 변화] 볼 발그레 볼터치 😊 */}
              {mood === 'success' && (
                <div className="absolute inset-0 z-20 pointer-events-none select-none">
                  <div 
                    className="absolute bg-rose-400/40 rounded-full filter blur-[0.8px]"
                    style={{
                      left: useSprite ? '38%' : '42%',
                      top: useSprite ? '10.5%' : '18%',
                      width: useSprite ? '6%' : '2.2%',
                      height: useSprite ? '1%' : '1.2%'
                    }}
                  />
                  <div 
                    className="absolute bg-rose-400/40 rounded-full filter blur-[0.8px]"
                    style={{
                      left: useSprite ? '52%' : '48%',
                      top: useSprite ? '10.5%' : '18%',
                      width: useSprite ? '6%' : '2.2%',
                      height: useSprite ? '1%' : '1.2%'
                    }}
                  />
                </div>
              )}

              {/* [생각 상황 표정 변화] 머리 위 흔들리는 물음표 ❓ */}
              {mood === 'thinking' && (
                <div className="absolute left-[54%] top-[4%] z-20 pointer-events-none select-none text-[10px] font-black text-violet-500 animate-bounce">
                  ❓
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 상황에 맞는 커스텀 말풍선 패널 (음수 마진 -mt-3.5 및 z-10으로 캐릭터 발끝이 말풍선 위로 겹치도록 레이아웃 결합) */}
        <div className={`relative -mt-3.5 z-10 rounded-2xl p-4 text-sm text-slate-600 shadow-md border character-bubble ${conf.bubbleBg}`}>
          <div className="absolute -top-1.5 left-12 h-3 w-3 rotate-45 bg-inherit border-l border-t border-inherit z-0" />
          <p className="text-xs font-bold text-blue-600 mb-1 select-none">{subtitle}</p>
          <p className="leading-relaxed font-bold text-slate-700">{message}</p>

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

// 2.5D 캐릭터 애니메이션 용 전용 키프레임 인입 컴포넌트
const CharacterStyles: React.FC = () => (
  <style>{`
    @keyframes characterFloat {
      0%, 100% {
        transform: translateY(0) scale(1);
      }
      50% {
        transform: translateY(-8px) scale(1.015);
      }
    }

    @keyframes characterBreath {
      0%, 100% {
        transform: scale(1);
      }
      50% {
        transform: scale(1.01);
      }
    }

    @keyframes characterTilt {
      0%, 100% {
        transform: rotate(-0.8deg);
      }
      50% {
        transform: rotate(0.8deg);
      }
    }

    @keyframes characterShadow {
      0%, 100% {
        transform: scale(1);
        opacity: 0.22;
      }
      50% {
        transform: scale(0.88);
        opacity: 0.14;
      }
    }

    @keyframes softPulseRing {
      0% {
        transform: scale(0.92);
        opacity: 0.55;
      }
      100% {
        transform: scale(1.25);
        opacity: 0;
      }
    }

    @keyframes sparkleFade {
      0%, 100% {
        opacity: 0.2;
        transform: translateY(0) scale(0.9);
      }
      50% {
        opacity: 0.9;
        transform: translateY(-4px) scale(1.1);
      }
    }

    @keyframes bubbleFadeUp {
      0% {
        opacity: 0;
        transform: translateY(8px);
      }
      100% {
        opacity: 1;
        transform: translateY(0);
      }
    }

    @keyframes typingDot {
      0%, 80%, 100% {
        opacity: 0.25;
        transform: translateY(0);
      }
      40% {
        opacity: 1;
        transform: translateY(-2px);
      }
    }

    /* 식은땀 방울 💧 흘러내리기 */
    @keyframes satieSweat {
      0% { transform: translateY(0) scale(0); opacity: 0; }
      15% { transform: translateY(0) scale(1.1); opacity: 1; }
      80% { transform: translateY(7px) scale(0.95); opacity: 0.8; }
      100% { transform: translateY(10px) scale(0.8); opacity: 0; }
    }

    /* 클래스에 애니메이션 속성 매핑 - 마우스 호버 시에만 동작 */
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

    .character-sparkle {
      opacity: 0.2;
    }
    .group:hover .character-sparkle {
      animation: sparkleFade 1.6s ease-in-out infinite;
    }
    .character-sparkle.delay-200 {
      animation-delay: 200ms;
    }
    .character-sparkle.delay-500 {
      animation-delay: 500ms;
    }

    .character-bubble {
      animation: bubbleFadeUp 0.45s ease-out forwards;
    }

    .character-dot {
      animation: typingDot 1.4s infinite ease-in-out;
    }

    .animate-satie-sweat {
      opacity: 0;
    }
    .group:hover .animate-satie-sweat {
      animation: satieSweat 2.2s infinite ease-in-out;
    }

    @keyframes pulse-slow {
      0%, 100% { opacity: 0.35; transform: scale(0.95); }
      50% { opacity: 0.65; transform: scale(1.05); }
    }
    .group:hover .animate-pulse-slow {
      animation: pulse-slow 6s ease-in-out infinite;
    }

    /* 미디어 쿼리 기반 모션 감소 접근성 지원 */
    @media (prefers-reduced-motion: reduce) {
      .character-motion,
      .character-shadow,
      .character-sparkle,
      .character-bubble,
      .character-tilt,
      .character-pulse-ring,
      .character-dot,
      .animate-satie-sweat {
        animation: none !important;
        transform: none !important;
        opacity: 1 !important;
      }
    }
  `}</style>
);
