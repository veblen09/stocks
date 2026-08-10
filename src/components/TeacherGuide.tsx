import React from 'react';
import { HeroBackground } from './HeroBackground';
import { GlassCard } from './GlassCard';
import { BookOpen, Clock, Lightbulb, Users, HelpCircle, ArrowRight } from 'lucide-react';

export const TeacherGuide: React.FC = () => {
  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12 animate-fade-in-up">
      {/* 1. 교사용 가이드 히어로 배너 */}
      <HeroBackground
        height="min-h-[180px]"
        overlay="blue"
        className="rounded-3xl shadow-xl overflow-hidden"
      >
        <div className="flex flex-col justify-between h-full w-full z-10 text-white select-none">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-white/20 backdrop-blur-md rounded-lg text-white">
              <BookOpen size={16} />
            </div>
            <span className="text-xs font-black tracking-wider uppercase">교수자 자료실</span>
          </div>
          
          <div className="mt-4">
            <h2 className="text-base sm:text-lg md:text-xl font-black flex items-center gap-2">
              [교사용] 시뮬레이션 수업 지도안 가이드
            </h2>
            <p className="text-[11px] text-blue-200 font-semibold mt-1">
              머니트랙을 활용하여 교실에서 학생들과 다채로운 금융 교육 활동을 진행하는 수업 계획안입니다.
            </p>
          </div>
        </div>
      </HeroBackground>

      {/* 2. 수업 지도안 (시간별 활동안) */}
      <GlassCard className="p-6 border-slate-100/80" variant="default">
        <h3 className="text-xs sm:text-sm font-bold text-slate-800 flex items-center gap-1.5 pb-2 border-b border-slate-100 select-none">
          <Clock size={16} className="text-blue-500" /> 교실 운영 시나리오 제안 (수업 활동안)
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 font-medium">
          {/* 15분 단기 */}
          <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-200/50 space-y-3 flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-[9px] font-extrabold text-blue-600 px-2 py-0.5 rounded bg-blue-50 border border-blue-100/30 select-none">15분 코스</span>
                <span className="text-[10px] text-slate-400 select-none">핵심 체험</span>
              </div>
              <h4 className="text-xs font-bold text-slate-850 select-text">핵심 체험 및 자율 성찰</h4>
              <ul className="text-[10px] text-slate-500 space-y-1.5 list-disc pl-4 leading-relaxed select-text">
                <li><strong>0~3분:</strong> 프로그램 배경 설명 및 설정 완료.</li>
                <li><strong>3~10분:</strong> 10년/20년 시뮬레이션 개별 플레이.</li>
                <li><strong>10~15분:</strong> 유형 분석 결과 확인 후 회고 질문지 작성 및 제출.</li>
              </ul>
            </div>
            <div className="text-[9px] text-slate-400 font-bold select-none border-t border-slate-100 pt-2 flex items-center gap-1">
              추천: 자율 학습 과제 <ArrowRight size={10} />
            </div>
          </div>

          {/* 30분 중기 */}
          <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-200/50 space-y-3 flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-[9px] font-extrabold text-emerald-600 px-2 py-0.5 rounded bg-emerald-50 border border-emerald-100/30 select-none">30분 코스</span>
                <span className="text-[10px] text-slate-400 select-none">모둠 활동</span>
              </div>
              <h4 className="text-xs font-bold text-slate-850 select-text">모둠 토론 및 리밸런싱 학습</h4>
              <ul className="text-[10px] text-slate-500 space-y-1.5 list-disc pl-4 leading-relaxed select-text">
                <li><strong>0~5분:</strong> 금융 개념(자산군 특징, 위험/수익 관계) 사전 지도.</li>
                <li><strong>5~18분:</strong> 개별 시뮬레이션 및 돌발 이벤트 대응.</li>
                <li><strong>18~30분:</strong> 모둠별 결과 공유 (최고 수익률 vs 최소 손실률, 서로의 아키타입 비교 토론).</li>
              </ul>
            </div>
            <div className="text-[9px] text-slate-400 font-bold select-none border-t border-slate-100 pt-2 flex items-center gap-1">
              추천: 창체 및 특별 활동 <ArrowRight size={10} />
            </div>
          </div>

          {/* 50분 정규 */}
          <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-200/50 space-y-3 flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-[9px] font-extrabold text-purple-600 px-2 py-0.5 rounded bg-purple-50 border border-purple-100/30 select-none">50분 코스</span>
                <span className="text-[10px] text-slate-400 select-none">정규 차시</span>
              </div>
              <h4 className="text-xs font-bold text-slate-850 select-text">종합 토론 및 발표 수업</h4>
              <ul className="text-[10px] text-slate-500 space-y-1.5 list-disc pl-4 leading-relaxed select-text">
                <li><strong>0~10분:</strong> 동기유발 (생애주기 자산관리 개념).</li>
                <li><strong>10~25분:</strong> 시뮬레이션 1회차 완주.</li>
                <li><strong>25~35분:</strong> 피드백 확인 후 전략 수정하여 2회차 도전.</li>
                <li><strong>35~50분:</strong> 교사용 분석 가이드를 토대로 포트폴리오 분산 및 금융사기 예방 종합 토론.</li>
              </ul>
            </div>
            <div className="text-[9px] text-slate-400 font-bold select-none border-t border-slate-100 pt-2 flex items-center gap-1">
              추천: 사회/경제 정규수업 <ArrowRight size={10} />
            </div>
          </div>
        </div>
      </GlassCard>

      {/* 3. 학생에게 강조할 핵심 금융 개념 */}
      <GlassCard className="p-6 border-slate-100/80" variant="default">
        <h3 className="text-xs sm:text-sm font-bold text-slate-800 flex items-center gap-1.5 pb-2 border-b border-slate-100 select-none">
          <Lightbulb size={16} className="text-amber-500" /> 수업 시 강조할 핵심 학습 개념
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs mt-4 font-semibold">
          <div className="space-y-1.5 p-3.5 bg-white/50 rounded-xl border border-slate-100 shadow-sm">
            <h4 className="font-bold text-slate-800">🔄 복리 (Compound Interest)</h4>
            <p className="text-[10.5px] text-slate-500 leading-relaxed font-medium select-text">돈이 스스로 돈을 버는 스노볼 효과입니다. 초기에 모은 종잣돈이 오랜 기간 유지될 때 자산이 기하급수적으로 불어나는 것을 주시하도록 지도해 주세요.</p>
          </div>

          <div className="space-y-1.5 p-3.5 bg-white/50 rounded-xl border border-slate-100 shadow-sm">
            <h4 className="font-bold text-slate-800">⚖️ 분산투자 (Diversification)</h4>
            <p className="text-[10.5px] text-slate-500 leading-relaxed font-medium select-text">개별 주식 폭락 사건을 겪으며, 한국 지수와 글로벌 지수 등 여러 자산에 나누어 담아 비체계적 위험을 소멸시키는 가치를 학습시킵니다.</p>
          </div>

          <div className="space-y-1.5 p-3.5 bg-white/50 rounded-xl border border-slate-100 shadow-sm">
            <h4 className="font-bold text-slate-800">📈 위험과 수익 (Risk and Return)</h4>
            <p className="text-[10.5px] text-slate-500 leading-relaxed font-medium select-text">기대수익이 높을수록 반드시 큰 변동성(위험)을 감수해야 함을 배웁니다. 원금 보장이 되면서 초고수익을 내는 정상적인 금융 상품은 없음을 인지시킵니다.</p>
          </div>

          <div className="space-y-1.5 p-3.5 bg-white/50 rounded-xl border border-slate-100 shadow-sm">
            <h4 className="font-bold text-slate-800">💧 유동성 (Liquidity)</h4>
            <p className="text-[10.5px] text-slate-500 leading-relaxed font-medium select-text">비상금이 부족하여 만기가 다가온 예적금이나 손실 난 해외 ETF를 급하게 깨서 손절하는 시나리오를 통해, 필요할 때 즉각 현금화할 수 있는 비상금 확보의 중요성을 전합니다.</p>
          </div>

          <div className="space-y-1.5 p-3.5 bg-white/50 rounded-xl border border-slate-100 shadow-sm">
            <h4 className="font-bold text-slate-800">💸 인플레이션 (Inflation)</h4>
            <p className="text-[10.5px] text-slate-500 leading-relaxed font-medium select-text">물가가 급격히 상승할 때 아무 투자도 하지 않고 현금만 쥐고 있으면 실질 구매력이 떨어져 가만히 있어도 손실이 난다는 경제 사실을 경험시킵니다.</p>
          </div>

          <div className="space-y-1.5 p-3.5 bg-white/50 rounded-xl border border-slate-100 shadow-sm">
            <h4 className="font-bold text-slate-800">🚫 고수익 사기 경계 (Anti-Fraud)</h4>
            <p className="text-[10.5px] text-slate-500 leading-relaxed font-medium select-text">보이스피싱, 폰지 사기, 뇌동 테마주 베팅 등 고교생들이 실제 사회에 나가 마주할 위험 금융 함정에 대처하는 금융 면역력을 향상시킵니다.</p>
          </div>
        </div>
      </GlassCard>

      {/* 4. 토론 및 결과 해석 가이드 */}
      <GlassCard className="p-6 border-slate-100/80" variant="default">
        <h3 className="text-xs sm:text-sm font-bold text-slate-800 flex items-center gap-1.5 pb-2 border-b border-slate-100 select-none">
          <Users size={16} className="text-blue-500" /> 수업 토론 발문 및 해석 가이드
        </h3>

        <div className="space-y-4 mt-4 font-semibold text-xs">
          <div className="p-4 bg-purple-50/30 border border-purple-100/40 rounded-xl">
            <div className="font-bold text-purple-700 mb-1.5 flex items-center gap-1.5 select-none">
              <HelpCircle size={14} /> 💬 심화 토론 발문 예시
            </div>
            <ul className="list-decimal pl-4 space-y-1 text-[11px] text-slate-600 leading-relaxed select-text">
              <li>&ldquo;금리 인상 소식이 나왔을 때 주식을 계속 들고 있었던 모둠원과 안전자산으로 바꾼 모둠원의 자산은 결과적으로 어떻게 달라졌나요?&rdquo;</li>
              <li>&ldquo;친구의 테마주 추천에 응했던 사람들은 왜 폭락 시에 리밸런싱이나 물타기 유혹에 쉽게 빠졌을까요?&rdquo;</li>
              <li>&ldquo;실생활에서 비상금 쿠션(입출금 통장 분량)은 어느 정도로 떼어놓는 것이 가계 가치 유지에 안전할까요?&rdquo;</li>
            </ul>
          </div>

          <div className="p-4 bg-blue-50/30 border border-blue-100/40 rounded-xl">
            <div className="font-bold text-blue-700 mb-1.5 flex items-center gap-1.5 select-none">
              <BookOpen size={14} /> 📊 아키타입 해석 방향 가이드
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed select-text font-medium">
              학생들의 최종 결과 아키타입은 <strong>비난이 아닌 학습의 출발점</strong>입니다.<br />
              - <strong>안정적 계획가:</strong> 자산을 잃진 않았으나 물가상승 위험에 취약합니다. 소액 지수 ETF 투자 권유.<br />
              - <strong>위험추구형 모험가 / 테마주 과몰입형:</strong> 상승장에 취해 변동성에 과노출되어 있습니다. 자산 30% 수준의 안전자산 배분 유도.<br />
              - <strong>현금부족형 투자자:</strong> 급한 지출에 대비할 비상금이 없으므로 시드머니 모으기 전 유동성 설계 교육이 시급합니다.
            </p>
          </div>
        </div>
      </GlassCard>
    </div>
  );
};
