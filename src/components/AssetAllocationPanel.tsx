import React, { useState, useEffect } from 'react';
import { useGame, getSavingsForAge } from '../store/gameStore';
import { ASSETS } from '../data/assets';
import { formatMoney } from '../utils/formatMoney';
import { AssetCard } from './AssetCard';
import { AssetEducationModal } from './AssetEducationModal';
import { EducationNotice } from './EducationNotice';
import { CheckCircle, AlertTriangle } from 'lucide-react';
import { audioManager } from '../utils/audioManager';

// 개별 대출 상환용 인라인 폼 컴포넌트
const LoanRepayRow: React.FC<{
  type: 'credit' | 'mortgage';
  name: string;
  rate: string;
  balance: number;
  cash: number;
  repayLoan: (type: 'credit' | 'mortgage', amount: number) => void;
}> = ({ type, name, rate, balance, cash, repayLoan }) => {
  const [amount, setAmount] = useState<string>('');

  const handleRepay = () => {
    const val = parseInt(amount);
    if (!val || val <= 0) return;
    repayLoan(type, val);
    setAmount('');
  };

  const maxRepay = Math.floor(Math.min(cash, balance));

  return (
    <div className="bg-white p-3.5 rounded-xl border border-slate-100 shadow-sm flex flex-col gap-2 text-left">
      <div className="flex justify-between items-center text-xs">
        <span className="font-extrabold text-slate-700">
          {name} <span className="text-[10px] text-rose-500 font-semibold">({rate})</span>
        </span>
        <span className="font-black text-rose-600">대출 잔액: {formatMoney(balance)}</span>
      </div>
      <div className="flex gap-2">
        <input
          type="number"
          min={1}
          max={maxRepay}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder={`상환액 (최대 ${maxRepay}만 원)`}
          className="flex-grow p-2 text-xs border border-slate-200 focus:outline-none focus:border-blue-500 rounded-lg font-medium"
        />
        <button
          type="button"
          onClick={handleRepay}
          disabled={!amount || parseInt(amount) <= 0 || parseInt(amount) > cash || maxRepay <= 0}
          className="px-4 py-2 bg-blue-600 disabled:bg-slate-200 text-white disabled:text-slate-400 font-bold rounded-lg text-xs transition cursor-pointer flex-shrink-0"
        >
          상환하기
        </button>
      </div>
    </div>
  );
};

export const AssetAllocationPanel: React.FC = () => {
  const { state, allocateAndNextTurn, repayLoan, markAssetAsViewed } = useGame();
  const { allocations, cash, viewedAssets, loans } = state;

  const totalAvailableCash = cash;
  const [changes, setChanges] = useState<{ [assetId: string]: number }>({});
  const [activeTipAssetId, setActiveTipAssetId] = useState<string | null>(null);

  useEffect(() => {
    const initialChanges: { [assetId: string]: number } = {};
    ASSETS.forEach((asset) => {
      initialChanges[asset.id] = 0;
    });
    setChanges(initialChanges);
  }, [state.currentTurn]);

  const allocatedTotal = Object.values(changes).reduce((sum, val) => sum + val, 0);
  const remainingCash = parseFloat((totalAvailableCash - allocatedTotal).toFixed(2));

  // 공통 금액 검증 및 제한 (Clamping) 함수
  const clampChange = (
    assetId: string,
    targetChange: number,
    currentChanges: { [id: string]: number },
    currentAllocations: { [id: string]: number },
    availableCash: number
  ): number => {
    const currentVal = currentAllocations[assetId] || 0;
    
    // 이 자산을 제외한 다른 모든 자산의 총 변경 합산액 계산
    const otherChangesSum = Object.keys(currentChanges)
      .filter((id) => id !== assetId)
      .reduce((sum, id) => sum + (currentChanges[id] || 0), 0);
      
    // 추가 가능한 최대 금액 한계 설정
    const maxAllowedChange = availableCash - otherChangesSum;
    
    // 1. 회수(매도)는 현재 자산 보유액을 초과할 수 없음
    let clamped = Math.max(-currentVal, targetChange);
    
    // 2. 추가(매수)는 남은 가용 예산을 초과할 수 없음
    clamped = Math.min(clamped, maxAllowedChange);
    
    return parseFloat(clamped.toFixed(2));
  };

  const handleValueChange = (assetId: string, delta: number) => {
    const currentChange = changes[assetId] || 0;
    const targetChange = currentChange + delta;
    const clampedVal = clampChange(assetId, targetChange, changes, allocations, totalAvailableCash);

    if (clampedVal > 0 && !viewedAssets.includes(assetId) && currentChange === 0) {
      setActiveTipAssetId(assetId);
      markAssetAsViewed(assetId);
    }

    setChanges((prev) => ({
      ...prev,
      [assetId]: clampedVal
    }));
  };

  const handleSliderChange = (assetId: string, targetNewChange: number) => {
    const currentChange = changes[assetId] || 0;
    const clampedVal = clampChange(assetId, targetNewChange, changes, allocations, totalAvailableCash);

    if (clampedVal > 0 && !viewedAssets.includes(assetId) && currentChange === 0) {
      setActiveTipAssetId(assetId);
      markAssetAsViewed(assetId);
    }

    setChanges((prev) => ({
      ...prev,
      [assetId]: clampedVal
    }));
  };

  // 예적금 중도해지 페널티 확인용 상태값
  const [showPenaltyModal, setShowPenaltyModal] = useState(false);
  const [penaltyFee, setPenaltyFee] = useState(0);
  const [withdrawnAmount, setWithdrawnAmount] = useState(0);
  const [preparedChanges, setPreparedChanges] = useState<{ [id: string]: number } | null>(null);

  const handleSubmit = () => {
    if (remainingCash < 0) return;
    audioManager.playSound('click');
    
    const finalChanges = { ...changes };
    if (remainingCash > 0) {
      finalChanges['cash'] = parseFloat(((finalChanges['cash'] || 0) + remainingCash).toFixed(2));
    }

    // 예적금 중도해지 인출 금액 조사
    let totalWithdrawal = 0;
    Object.keys(finalChanges).forEach((id) => {
      const change = finalChanges[id];
      if (change < 0 && (id === 'deposit' || id === 'saving')) {
        totalWithdrawal += Math.abs(change);
      }
    });

    if (totalWithdrawal > 0) {
      const fee = parseFloat((totalWithdrawal * 0.02).toFixed(2));
      setPenaltyFee(fee);
      setWithdrawnAmount(totalWithdrawal);
      setPreparedChanges(finalChanges);
      setShowPenaltyModal(true);
    } else {
      allocateAndNextTurn(finalChanges);
    }
  };

  const handleConfirmPenalty = () => {
    setShowPenaltyModal(false);
    if (preparedChanges) {
      allocateAndNextTurn(preparedChanges);
    }
  };

  // 대출 이자 지출 계산 및 비상금 부족 시 자산 매각 핸들러
  const interestCost = parseFloat((((loans.credit || 0) * 0.030) + ((loans.mortgage || 0) * 0.0175)).toFixed(2));
  const isCashDeficitForInterest = interestCost > 0 && remainingCash < interestCost;
  const interestDeficit = isCashDeficitForInterest ? parseFloat((interestCost - remainingCash).toFixed(2)) : 0;

  const handleAutoSellForInterest = () => {
    if (interestDeficit <= 0) return;
    audioManager.playSound('click');

    let needed = interestDeficit;
    const newChanges = { ...changes };

    // 유동성 점수(liquidityScore) 내림차순 정렬 (유동성이 가장 높은 자산부터 우선 매도하여 대출 이자 상환)
    const sortedAssets = [...ASSETS]
      .filter(a => a.id !== 'cash' && a.id !== 'house' && a.id !== 'rent_deposit' && a.id !== 'housing')
      .sort((a, b) => b.liquidityScore - a.liquidityScore);

    for (const assetObj of sortedAssets) {
      if (needed <= 0) break;
      const assetId = assetObj.id;
      const currentVal = allocations[assetId] || 0;
      const currentChange = newChanges[assetId] || 0;
      const availableToSell = currentVal + currentChange;

      if (availableToSell > 0) {
        const sellAmt = Math.min(availableToSell, needed);
        newChanges[assetId] = parseFloat((currentChange - sellAmt).toFixed(2));
        needed = parseFloat((needed - sellAmt).toFixed(2));
      }
    }

    setChanges(newChanges);
  };

  return (
    <div className="bg-white/85 backdrop-blur-xl p-5 sm:p-6 rounded-3xl border border-slate-100/80 shadow-sm animate-fade-in-up relative select-none">
      {/* 배분 요약 헤더 배너 */}
      <div className="bg-slate-50/50 p-4 sm:p-5 rounded-2xl border border-slate-100 flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
            💼 이번 턴 자산 배분 <span className="text-xs text-slate-400 font-normal">({state.currentTurn + 1}번째 설계)</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1 select-text">
            {state.currentAge >= 65 ? (
              <span className="text-rose-500 font-extrabold">👴 은퇴 완료 (새로운 반기 저축액이 발생하지 않습니다)</span>
            ) : (
              <span>
                {Math.floor(state.currentAge)}세에 맞게 보정된 반기 저축액{' '}
                <strong className="text-blue-600 font-extrabold">
                  {formatMoney(getSavingsForAge(state.currentAge, state.halfYearSavings))}
                </strong>
                {getSavingsForAge(state.currentAge, state.halfYearSavings) / state.halfYearSavings !== 1 && 
                  ` (초기 설정의 ${(getSavingsForAge(state.currentAge, state.halfYearSavings) / state.halfYearSavings).toFixed(1)}배)`
                }이 가용 예산에 가산되었습니다.
              </span>
            )}
          </p>
          {interestCost > 0 && (
            <div className="mt-2 text-xs font-semibold text-rose-600 bg-rose-50/80 px-3.5 py-2.5 rounded-xl border border-rose-100 flex flex-col gap-1.5 select-text">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span>⚠️ 이번 턴 대출 이자 지출 예정액: <strong className="font-extrabold">{formatMoney(interestCost)}</strong></span>
                  {isCashDeficitForInterest ? (
                    <span className="text-[11px] font-black text-rose-700 bg-rose-100 px-2 py-0.5 rounded-md">
                      (비상금 {formatMoney(interestDeficit)} 부족!)
                    </span>
                  ) : (
                    <span className="text-[10.5px] text-slate-500 font-normal hidden sm:inline">(턴 진행 시 비상금 통장에서 차감)</span>
                  )}
                </div>

                {isCashDeficitForInterest && (
                  <button
                    type="button"
                    onClick={handleAutoSellForInterest}
                    className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-extrabold rounded-xl text-xs transition shadow-sm cursor-pointer flex-shrink-0 flex items-center justify-center gap-1 active:scale-95"
                  >
                    ⚡ 자산 자동 매각하여 이자 충당
                  </button>
                )}
              </div>
              
              <div className="text-[10px] text-rose-500 font-medium">
                ※ 대출 이자를 상환할 비상금/자산이 부족하면 미납 이자가 신용대출 원금에 복리로 가산(연체 5% 추가)되며, 총부채가 총자산을 초과(순자산 음수)하면 🚨 <strong>금융 파산 (Game Over)</strong> 처리됩니다.
              </div>
            </div>
          )}
        </div>
        <div className="flex flex-wrap gap-3 text-xs">
          <div className="bg-white px-3 py-1.5 rounded-xl border border-slate-100/60 shadow-sm">
            <span className="text-slate-400 font-medium">이번 턴 투자 가능:</span>{' '}
            <span className="font-bold text-slate-700 select-text">{formatMoney(totalAvailableCash)}</span>
          </div>
          <div className="bg-white px-3 py-1.5 rounded-xl border border-slate-100/60 shadow-sm">
            <span className="text-slate-400 font-medium">배분 완료:</span>{' '}
            <span className="font-bold text-slate-700 select-text">{formatMoney(allocatedTotal)}</span>
          </div>
        </div>
      </div>

      {/* 11가지 자산 리스트 */}
      <div className="space-y-4 max-h-[480px] overflow-y-auto pr-2 mb-6">
        {ASSETS.map((asset) => {
          const currentVal = allocations[asset.id] || 0;
          const change = changes[asset.id] || 0;
          
          const lastHistory = state.history[state.history.length - 1];
          const actualReturn = lastHistory?.actualReturns?.[asset.id];

          return (
            <AssetCard
              key={asset.id}
              asset={asset}
              currentVal={currentVal}
              change={change}
              remainingCash={remainingCash}
              onSliderChange={(val) => handleSliderChange(asset.id, val)}
              onValueChange={(delta) => handleValueChange(asset.id, delta)}
              actualReturn={actualReturn}
              onInfoClick={() => {
                audioManager.playSound('click');
                setActiveTipAssetId(asset.id);
                markAssetAsViewed(asset.id);
              }}
            />
          );
        })}
      </div>

      {/* 💳 대출 관리 및 중도 상환 패널 */}
      {(loans.credit > 0 || loans.mortgage > 0) && (
        <div className="bg-slate-50 border border-slate-200/60 p-4 rounded-2xl mb-6 space-y-3.5 select-none">
          <div>
            <h3 className="text-xs sm:text-sm font-extrabold text-slate-800 flex items-center gap-1.5 text-left">
              💳 대출 부채 관리 및 중도 상환
            </h3>
            <p className="text-[10.5px] text-slate-400 mt-0.5 font-semibold text-left">
              비상금 계좌의 잔액을 활용해 대출 원금을 중도 상환할 수 있습니다. (상환 시 다음 턴 이자 비용이 차감됩니다)
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {loans.credit > 0 && (
              <LoanRepayRow
                type="credit"
                name="신용대출"
                rate="연 6.0%"
                balance={loans.credit}
                cash={allocations['cash'] || 0}
                repayLoan={repayLoan}
              />
            )}

            {loans.mortgage > 0 && (
              <LoanRepayRow
                type="mortgage"
                name="주택담보대출"
                rate="연 3.5%"
                balance={loans.mortgage}
                cash={allocations['cash'] || 0}
                repayLoan={repayLoan}
              />
            )}
          </div>
        </div>
      )}

      {/* 완료 및 제출 영역 (Sticky Glass Footer) */}
      <div className="sticky bottom-0 z-20 pt-4 pb-2 bg-white/95 backdrop-blur-md border-t border-slate-100 flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 w-full">
          <div className="text-xs flex items-center gap-1.5">
            {remainingCash === 0 ? (
              <span className="text-emerald-600 flex items-center gap-1.5 font-bold animate-pulse-subtle">
                <CheckCircle size={15} /> 자산 배분이 정상적으로 완료되었습니다!
              </span>
            ) : remainingCash > 0 ? (
              <span className="text-blue-600 flex items-center gap-1.5 font-bold">
                <CheckCircle size={15} /> 남은 금액 {formatMoney(remainingCash)}은 입출금 통장으로 자동 저축됩니다.
              </span>
            ) : (
              <span className="text-rose-500 flex items-center gap-1.5 font-bold">
                <AlertTriangle size={15} /> 투자 가능 금액을 초과하였습니다. (초과: {formatMoney(-remainingCash)})
              </span>
            )}
          </div>
          
          <button
            onClick={handleSubmit}
            disabled={remainingCash < 0}
            className="w-full sm:w-auto px-8 py-3.5 bg-blue-600 disabled:bg-slate-200 text-white font-extrabold rounded-2xl shadow-md disabled:shadow-none hover:bg-blue-700 disabled:text-slate-400 disabled:cursor-not-allowed transition transform active:scale-95 duration-100 cursor-pointer text-xs sm:text-sm"
          >
            {state.currentTurn + 1 === state.simulationLength * 2 ? '실험 종료 및 결과 보기' : '턴 진행 (6개월 경과)'}
          </button>
        </div>

        {/* 교육용 고지 배너 */}
        <EducationNotice className="mt-2" />
      </div>

      {/* 교육용 자산 정보 팝업 모달 */}
      <AssetEducationModal
        assetId={activeTipAssetId}
        onClose={() => setActiveTipAssetId(null)}
      />

      {/* 중도해지 수수료 경고 모달 */}
      {showPenaltyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in no-print">
          <div className="bg-white/95 backdrop-blur-md rounded-3xl border border-rose-100 shadow-2xl max-w-md w-full p-6 relative overflow-hidden animate-zoom-in text-slate-700 text-left">
            <h3 className="text-base font-extrabold text-rose-600 flex items-center gap-2 mb-3 select-none">
              ⚠️ 예적금 중도해지 수수료 발생 알림
            </h3>
            
            <div className="space-y-3 text-xs sm:text-sm font-semibold leading-relaxed">
              <p>
                정기예금이나 적금은 약정된 만기를 채우지 않고 인출(일부 해지)할 경우, 약정 금리 대신 중도해지 이율이 적용되어 사실상 약정 이자를 수령할 수 없습니다.
              </p>
              
              <div className="p-4 bg-rose-50 border border-rose-100/50 rounded-2xl space-y-1.5 text-xs text-rose-900 select-text font-bold">
                <div>• 총 중도 해지 금액: <strong>{formatMoney(withdrawnAmount)}</strong></div>
                <div>• 중도해지 페널티 수수료 (2.0%): <strong className="text-rose-600 underline font-black">{formatMoney(penaltyFee)}</strong></div>
                <div className="text-[10px] text-rose-500 font-medium mt-1">※ 이 페널티 수수료는 비상금 통장 잔고에서 즉시 차감됩니다.</div>
              </div>
              
              <p className="text-slate-500 font-medium text-xs">
                정말로 페널티 수수료를 차감하고 중도 해지를 진행하시겠습니까?
              </p>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={() => setShowPenaltyModal(false)}
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-650 font-bold rounded-xl transition cursor-pointer text-xs select-none"
              >
                취소 (자산 다시 배분)
              </button>
              <button
                type="button"
                onClick={handleConfirmPenalty}
                className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white font-extrabold rounded-xl transition shadow-md cursor-pointer text-xs select-none"
              >
                네, 진행합니다
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
