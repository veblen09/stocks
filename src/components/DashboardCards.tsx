import React, { useState } from 'react';
import type { GameState } from '../types/finance';
import { ASSETS } from '../data/assets';
import { formatMoney } from '../utils/formatMoney';
import { MetricCard } from './MetricCard';
import { Wallet, Landmark, TrendingUp, AlertTriangle, Shield, TrendingDown, X } from 'lucide-react';
import { audioManager } from '../utils/audioManager';
import { getSavingsForAge } from '../store/gameStore';

interface DashboardCardsProps {
  state: GameState;
}

export const DashboardCards: React.FC<DashboardCardsProps> = ({ state }) => {
  const { allocations, initialAsset, history, currentTurn, halfYearSavings, loans } = state;
  const [activeCardId, setActiveCardId] = useState<string | null>(null);
  
  // 1. 총자산 (보유한 모든 현금 및 금융, 부동산 자산 합산)
  const totalAssets = Object.values(allocations).reduce((a, b) => a + b, 0);

  // 2. 총부채 (신용대출 + 담보대출 합산)
  const totalDebt = (loans?.credit || 0) + (loans?.mortgage || 0);

  // 3. 순자산 (총자산 - 총부채)
  const netWorth = parseFloat((totalAssets - totalDebt).toFixed(2));
  
  // 안전자산(현금 + 예적금 + 청약) 계산
  const cashVal = allocations['cash'] || 0;
  const depositVal = allocations['deposit'] || 0;
  const savingVal = allocations['saving'] || 0;
  const housingVal = allocations['housing'] || 0;
  const bondVal = allocations['bond'] || 0;
  const pensionVal = allocations['pension'] || 0;

  const safeAssetVal = cashVal + depositVal + savingVal + housingVal;

  // 개별 자산의 누적 수익률 계산기 (역사적 시장 복리 누적 수익률)
  const getAssetCumulativeReturn = (assetId: string): number => {
    let multiplier = 1.0;
    let hasData = false;
    history.forEach((h) => {
      if (h.actualReturns && h.actualReturns[assetId] !== undefined) {
        multiplier *= (1 + h.actualReturns[assetId] / 100);
        hasData = true;
      }
    });
    return hasData ? parseFloat(((multiplier - 1) * 100).toFixed(2)) : 0;
  };

  // 총 투자 원금 (초기 자산 + 연령대별 누적 자동 저축금 합산)
  let totalInvested = initialAsset;
  history.forEach((h) => {
    if (h.turn > 0) {
      const ageAtTurnStart = h.age - 0.5;
      totalInvested += getSavingsForAge(ageAtTurnStart, halfYearSavings);
    }
  });

  // 누적 수익률 계산 (투자원금 대비 순자산 성장률)
  const cumulativeReturn = totalInvested > 0 
    ? parseFloat((((netWorth - totalInvested) / totalInvested) * 100).toFixed(2)) 
    : 0;

  // 최대 낙폭 (MDD) 찾기 (순자산 기준)
  let mdd = 0;
  let peak = initialAsset;
  history.forEach((h) => {
    if (h.netWorth > peak) peak = h.netWorth;
    const dd = ((peak - h.netWorth) / peak) * 100;
    if (dd > mdd) mdd = dd;
  });
  mdd = parseFloat(mdd.toFixed(2));

  // 포트폴리오 위험 점수 (가중 평균)
  let weightedRisk = 0;
  if (totalAssets > 0) {
    ASSETS.forEach((asset) => {
      const val = allocations[asset.id] || 0;
      weightedRisk += (val / totalAssets) * asset.riskScore;
    });
  }
  const riskScore = parseFloat((weightedRisk * 10).toFixed(1)); // 0~100 점으로 환산

  // 비상금 개월 수 (한 달 가상 생활비 기본 100만 원으로 산정)
  const monthlyExpense = 100; // 100만 원
  const emergencyMonths = parseFloat((cashVal / monthlyExpense).toFixed(1));

  // 색상 톤 매퍼
  const getRiskTone = (score: number): 'green' | 'gold' | 'red' => {
    if (score < 30) return 'green';
    if (score < 60) return 'gold';
    return 'red';
  };

  const getEmergencyTone = (months: number): 'green' | 'blue' | 'red' => {
    if (months >= 3) return 'green';
    if (months >= 1) return 'blue';
    return 'red';
  };

  const handleCardClick = (cardId: string) => {
    audioManager.playSound('click');
    setActiveCardId(cardId);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 animate-fade-in-up">
        {/* 1. 순자산 */}
        <MetricCard
          label="순자산"
          value={formatMoney(netWorth)}
          subValue={`원금: ${formatMoney(totalInvested)}`}
          icon={<Wallet size={20} />}
          tone="blue"
          onClick={() => handleCardClick('netWorth')}
        />

        {/* 2. 누적 수익률 */}
        <MetricCard
          label="누적 수익률"
          value={`${cumulativeReturn >= 0 ? '+' : ''}${cumulativeReturn}%`}
          subValue="투자원금 대비 수익률"
          icon={<TrendingUp size={20} />}
          tone={cumulativeReturn >= 0 ? 'green' : 'red'}
          onClick={() => handleCardClick('cumulativeReturn')}
        />

        {/* 3. 총자산 */}
        <MetricCard
          label="총자산"
          value={formatMoney(totalAssets)}
          subValue={`부동산 자산: ${formatMoney((allocations['house'] || 0) + (allocations['rent_deposit'] || 0))}`}
          icon={<Landmark size={20} />}
          tone="blue"
          onClick={() => handleCardClick('totalAssets')}
        />

        {/* 4. 총부채 */}
        <MetricCard
          label="총부채"
          value={formatMoney(totalDebt)}
          subValue={`신용: ${formatMoney(loans.credit)} / 담보: ${formatMoney(loans.mortgage)}`}
          icon={<TrendingDown size={20} />}
          tone={totalDebt > 0 ? 'red' : 'blue'}
          onClick={() => handleCardClick('totalDebt')}
        />

        {/* 5. 위험도 */}
        <MetricCard
          label="위험도"
          value={`${riskScore}점`}
          subValue="자산 위험 가중 점수 (0~100)"
          icon={<AlertTriangle size={20} />}
          tone={getRiskTone(riskScore)}
          onClick={() => handleCardClick('riskScore')}
        />

        {/* 6. 비상금 쿠션 */}
        <MetricCard
          label="비상금 쿠션"
          value={`${emergencyMonths}개월 버팀`}
          subValue="한 달 가상 생활비 100만 원 기준"
          icon={<Shield size={20} />}
          tone={getEmergencyTone(emergencyMonths)}
          onClick={() => handleCardClick('emergencyMonths')}
        />
      </div>

      {/* 대시보드 지표 가이드 모달 */}
      {activeCardId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in no-print">
          <div className="bg-white/95 backdrop-blur-md rounded-3xl border border-slate-100 shadow-2xl max-w-2xl w-full p-6 relative overflow-hidden animate-zoom-in">
            {/* 상단 닫기 버튼 */}
            <button
              onClick={() => { audioManager.playSound('click'); setActiveCardId(null); }}
              className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-650 hover:bg-slate-100 transition cursor-pointer"
              title="닫기"
            >
              <X size={18} />
            </button>

            {/* 모달 헤더 */}
            <div className="mb-4">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2 select-none">
                {activeCardId === 'netWorth' && <>💰 순자산 (Net Worth)</>}
                {activeCardId === 'cumulativeReturn' && <>📈 누적 수익률 (Cumulative Return)</>}
                {activeCardId === 'totalAssets' && <>🏦 총자산 (Total Assets)</>}
                {activeCardId === 'totalDebt' && <>💳 총부채 (Total Liabilities)</>}
                {activeCardId === 'riskScore' && <>⚠️ 위험도 (Portfolio Risk)</>}
                {activeCardId === 'emergencyMonths' && <>🛡️ 비상금 쿠션 (Emergency Cushion)</>}
              </h3>
            </div>

            {/* 모달 콘텐츠 본문 */}
            <div className="space-y-4 text-xs sm:text-sm text-slate-650 leading-relaxed font-semibold text-left">
              {/* 설명 및 교육 팁 */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                <p className="text-slate-700 font-bold select-text">
                  {activeCardId === 'netWorth' && '귀하가 소유한 총자산에서 갚아야 할 총부채(대출 잔액)를 제외한 온전한 귀하의 자산(순 자산가치)입니다.'}
                  {activeCardId === 'cumulativeReturn' && '초기 시드 및 매달 모은 투자 원금 대비 현재 순자산이 얼마나 불어났는지를 나타내는 성과 평가 지표입니다.'}
                  {activeCardId === 'totalAssets' && '입출금 비상금, 예적금, 주식 ETF, 채권, 금, 연금 및 부동산 보증금과 주택 가치를 모두 합산한 귀하가 운용 중인 자산의 총액입니다.'}
                  {activeCardId === 'totalDebt' && '은행에서 빌린 신용대출 및 주택 취득을 위해 빌린 주택담보대출의 미상환 잔액 합계입니다.'}
                  {activeCardId === 'riskScore' && '보유하고 있는 각 자산들의 가격 변동 폭(변동성)과 위험도 가중치를 분배 비율에 따라 평균한 포트폴리오 총체적 위험 지수입니다.'}
                  {activeCardId === 'emergencyMonths' && '별도의 소득이 끊기거나 긴급 지출이 발생했을 때, 투자 상품을 강제 손절해 깨지 않고 현재 비상금 현금 잔고로 버틸 수 있는 생존 한계 기간입니다.'}
                </p>
                <div className="border-t border-slate-200/60 pt-2 text-[11px] text-slate-500 font-medium">
                  <span className="font-extrabold text-blue-600 block mb-0.5 select-none">💡 금융 길잡이 가이드</span>
                  {activeCardId === 'netWorth' && '가계 재정의 핵심 목표는 순자산을 늘리는 것입니다. 부채(대출)를 내어 자산(부동산 등)을 사더라도 순자산이 함께 늘어나는 구조라면 건강한 레버리지 활용입니다.'}
                  {activeCardId === 'cumulativeReturn' && '장기 투자는 조급해하지 않는 마음에서 시작됩니다. 이자 및 배당 소득, 시장 수익률이 복리로 누적되면 시간이 지날수록 누적 성과 곡선이 가파르게 상승합니다.'}
                  {activeCardId === 'totalAssets' && '부동산 임차보증금이나 주택 등 실물 부동산도 훌륭한 자산에 해당합니다. 다만 자산 총액이 많더라도 유동성 자산(현금) 비중이 지나치게 낮으면 일시적인 흑자 도산 위기에 처할 수 있습니다.'}
                  {activeCardId === 'totalDebt' && '대출은 양날의 검입니다. 신용대출(연 6%)은 상대적으로 이율이 높고 한도가 작아 긴급 시에만 써야 하고, 담보대출(연 3.5%)은 장기로 안정적 주거용 실물 자산을 취득하는 레버리지로 쓰기에 유리합니다.'}
                  {activeCardId === 'riskScore' && '위험도가 너무 낮으면 인플레이션으로 인해 실질 자산 가치가 갉아먹히고, 너무 높으면 폭락장에 손실을 감수하고 중도 포기하게 됩니다. 나이와 성향에 맞는 균형 지점을 잡으세요.'}
                  {activeCardId === 'emergencyMonths' && '비상금 쿠션은 재무 방패막입니다. 든든한 비상금이 현금성 계좌에 3~6개월 분량 모여 있어야 하락장이나 금리 격변기에도 투자금을 안정적으로 오랫동안 유지할 수 있습니다.'}
                </div>
              </div>

              {/* 세부 수치 요약 */}
              <div className="p-4 bg-white rounded-2xl border border-slate-100 space-y-3 font-bold">
                <span className="text-[10px] text-slate-400 font-extrabold uppercase select-none block mb-1">상세 대차대조표 계정</span>
                
                {activeCardId === 'netWorth' && (
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div><span className="text-slate-400">총자산액 (+):</span> <span className="font-bold text-slate-700">{formatMoney(totalAssets)}</span></div>
                    <div><span className="text-slate-400">총대출액 (-):</span> <span className="font-bold text-rose-600">{formatMoney(totalDebt)}</span></div>
                    <div className="col-span-2 border-t border-slate-100 pt-2"><span className="text-slate-400">순자산 가치 (Assets - Debts):</span> <span className="font-extrabold text-blue-600">{formatMoney(netWorth)}</span></div>
                  </div>
                )}

                {activeCardId === 'cumulativeReturn' && (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-xs pb-2 border-b border-slate-100 flex-wrap gap-2">
                      <div><span className="text-slate-400">순자산 성장률:</span> <span className={`font-bold ${cumulativeReturn >= 0 ? 'text-rose-500' : 'text-blue-500'}`}>{cumulativeReturn >= 0 ? '+' : ''}{cumulativeReturn}%</span></div>
                      <div><span className="text-slate-400">총 투자 원금:</span> <span className="font-bold text-slate-700">{formatMoney(totalInvested)}</span></div>
                      <div><span className="text-slate-400">총 누적 턴:</span> <span className="font-bold text-slate-700">{currentTurn}턴 ({currentTurn * 6}개월)</span></div>
                    </div>
                    
                    <div>
                      <span className="text-[10px] text-slate-400 font-extrabold block mb-2 select-none">📌 개별 자산의 누적 성과 내역</span>
                      <div className="overflow-x-auto rounded-xl border border-slate-100">
                        <table className="min-w-full text-xs text-left text-slate-500">
                          <thead className="bg-slate-50 text-[9px] uppercase font-bold text-slate-400 border-b border-slate-100 select-none">
                            <tr>
                              <th className="py-2 px-3">자산군 명칭</th>
                              <th className="py-2 px-3 text-center">연 환산 수익률</th>
                              <th className="py-2 px-3 text-center">누적 수익률</th>
                              <th className="py-2 px-3 text-right">현재 보유 잔액</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 bg-white font-semibold">
                            {ASSETS.map((asset) => {
                              const value = allocations[asset.id] || 0;
                              const cumReturn = getAssetCumulativeReturn(asset.id);
                              
                              const yearsElapsed = currentTurn * 0.5;
                              const annualizedReturn = yearsElapsed > 0 
                                ? parseFloat((cumReturn / yearsElapsed).toFixed(2)) 
                                : 0;
                              
                              return (
                                <tr key={asset.id} className="hover:bg-slate-50/50">
                                  <td className="py-2 px-3 text-slate-700 font-bold">{asset.name}</td>
                                  <td className="py-2 px-3 text-center font-bold text-slate-700">
                                    {history.length > 1 ? (
                                      <span className={annualizedReturn > 0 ? 'text-rose-500' : annualizedReturn < 0 ? 'text-blue-500' : 'text-slate-400'}>
                                        {annualizedReturn > 0 ? '+' : ''}{annualizedReturn}%
                                      </span>
                                    ) : '-'}
                                  </td>
                                  <td className="py-2 px-3 text-center">
                                    {history.length > 1 ? (
                                      <span className={cumReturn > 0 ? 'text-rose-600' : cumReturn < 0 ? 'text-blue-600' : 'text-slate-400'}>
                                        {cumReturn > 0 ? '+' : ''}{cumReturn}%
                                      </span>
                                    ) : (
                                      <span className="text-slate-400">-</span>
                                    )}
                                  </td>
                                  <td className="py-2 px-3 text-right text-slate-700">{formatMoney(value)}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {activeCardId === 'totalAssets' && (
                  <div className="grid grid-cols-2 gap-3.5 text-xs">
                    <div><span className="text-slate-400">비상금 (현금):</span> <span className="font-bold text-slate-700">{formatMoney(cashVal)}</span></div>
                    <div><span className="text-slate-400">예적금 잔고:</span> <span className="font-bold text-slate-700">{formatMoney(depositVal + savingVal)}</span></div>
                    <div><span className="text-slate-400">주택청약저축:</span> <span className="font-bold text-slate-700">{formatMoney(housingVal)}</span></div>
                    <div><span className="text-slate-400">부동산 임차보증금:</span> <span className="font-bold text-slate-700">{formatMoney(allocations['rent_deposit'] || 0)}</span></div>
                    <div><span className="text-slate-400">실물 소유 주택 (부동산):</span> <span className="font-bold text-slate-700">{formatMoney(allocations['house'] || 0)}</span></div>
                    <div><span className="text-slate-400">기타 금융 투자 (주식/금/연금):</span> <span className="font-bold text-slate-700">{formatMoney(totalAssets - safeAssetVal - (allocations['rent_deposit'] || 0) - (allocations['house'] || 0))}</span></div>
                    <div className="col-span-2 border-t border-slate-100 pt-2"><span className="text-slate-400">총합 자산 규모 (Total Assets):</span> <span className="font-extrabold text-blue-600">{formatMoney(totalAssets)}</span></div>
                  </div>
                )}

                {activeCardId === 'totalDebt' && (
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div><span className="text-slate-400">신용대출 (금리 연 6.0%):</span> <span className="font-bold text-slate-700">{formatMoney(loans.credit)}</span></div>
                    <div><span className="text-slate-400">주택담보대출 (금리 연 3.5%):</span> <span className="font-bold text-slate-700">{formatMoney(loans.mortgage)}</span></div>
                    <div className="col-span-2 border-t border-slate-100 pt-2"><span className="text-slate-400">총 차입 부채 (Total Debts):</span> <span className="font-extrabold text-rose-600">{formatMoney(totalDebt)}</span></div>
                  </div>
                )}

                {activeCardId === 'riskScore' && (
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div><span className="text-slate-400">안전자산군(위험도 1~3):</span> <span className="font-bold text-emerald-600">{formatMoney(safeAssetVal + bondVal + pensionVal + (allocations['rent_deposit'] || 0))}</span></div>
                    <div><span className="text-slate-400">변동자산군(위험도 4~10):</span> <span className="font-bold text-rose-600">{formatMoney(totalAssets - safeAssetVal - bondVal - pensionVal - (allocations['rent_deposit'] || 0))}</span></div>
                    <div className="col-span-2 border-t border-slate-100 pt-2"><span className="text-slate-400">현재 포트폴리오 가중평균 위험도:</span> <span className="font-extrabold text-slate-700">{riskScore}점 / 100점</span></div>
                  </div>
                )}

                {activeCardId === 'emergencyMonths' && (
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div><span className="text-slate-400">비상금(입출금 현금):</span> <span className="font-bold text-slate-700">{formatMoney(cashVal)}</span></div>
                    <div><span className="text-slate-400">한 달 가상 생활비:</span> <span className="font-bold text-slate-700">{formatMoney(monthlyExpense)}</span></div>
                    <div className="col-span-2 border-t border-slate-100 pt-2"><span className="text-slate-400">최대 생존 가능 개월 수:</span> <span className="font-extrabold text-blue-600">{emergencyMonths}개월 버팀</span></div>
                  </div>
                )}
              </div>
            </div>

            {/* 하단 닫기 버튼 */}
            <div className="mt-5 flex justify-end">
              <button
                onClick={() => { audioManager.playSound('click'); setActiveCardId(null); }}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition transform active:scale-95 duration-100 cursor-pointer text-xs"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
