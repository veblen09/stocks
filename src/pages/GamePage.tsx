import React, { useState } from 'react';
import {
  Search,
  Play,
  Zap,
  RotateCcw,
  PieChart,
  X,
  Sparkles,
} from 'lucide-react';
import { GlassCard } from '../components/GlassCard';
import { useStockGame } from '../store/stockGameStore';
import { STOCKS, STOCKS_BY_ID, isStockListed, getHistoricalStockStats, getStockPriceKRW } from '../engine/returnEngine';
import { formatKRW, formatPercent, getReturnColor, formatWonNumber } from '../utils/formatMoney';
import type { Stock } from '../types/stockGame';
import { audioManager } from '../utils/audioManager';
import { AnimatedCharacterGuide } from '../components/AnimatedCharacterGuide';
import { YearEndBriefingModal } from '../components/YearEndBriefingModal';
import { AutoInvestModal } from '../components/AutoInvestModal';
import { StockDetailModal } from '../components/StockDetailModal';
import { GlossaryModal } from '../components/GlossaryModal';
import { calculatePortfolioValue } from '../engine/portfolioEngine';
import { calculateMDD } from '../engine/metricsEngine';

interface GamePageProps {
  onNavigate: (page: string) => void;
}

export const GamePage: React.FC<GamePageProps> = ({ onNavigate }) => {
  const {
    state,
    buyStock,
    sellStock,
    stepOneYear,
    runAutoInvest,
    saveAutoInvestRule,
    deleteAutoInvestRule,
    undoYear,
  } = useStockGame();

  const { settings, currentYear, cashKRW, holdings, history, isGameOver } = state;
  const priorYear = currentYear - 1;

  // View & Filter States
  const [marketFilter, setMarketFilter] = useState<'ALL' | 'KR' | 'US' | 'HOLDING'>('ALL');
  const [sectorFilter, setSectorFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals
  const [selectedStockForDetail, setSelectedStockForDetail] = useState<Stock | null>(null);
  const [showAutoInvestModal, setShowAutoInvestModal] = useState<boolean>(
    settings.startMode === 'AUTO_RULE' && history.length === 0
  );
  const [showGlossaryModal, setShowGlossaryModal] = useState<boolean>(false);
  const [showYearEndModal, setShowYearEndModal] = useState<boolean>(false);

  // Quick Buy / Sell Dialog State
  const [quickTradeStock, setQuickTradeStock] = useState<Stock | null>(null);
  const [quickTradeAmountKRW, setQuickTradeAmountKRW] = useState<number>(1000000);
  const [quickSellShares, setQuickSellShares] = useState<number>(0);
  const [quickTradeMode, setQuickTradeMode] = useState<'BUY' | 'SELL'>('BUY');

  // Compute live portfolio value at beginning of currentYear (using priorYear prices)
  const currentTotalValue = calculatePortfolioValue(cashKRW, holdings, priorYear);
  const totalDeposits = history.reduce((sum, h, idx) => (idx === 0 ? sum : sum + h.annualDepositKRW), 0);
  const totalPrincipal = settings.initialCashKRW + totalDeposits;
  const netProfit = currentTotalValue - totalPrincipal;
  const profitRate = totalPrincipal > 0 ? netProfit / totalPrincipal : 0;

  // TWR and MDD so far
  const lastHistory = history.length > 0 ? history[history.length - 1] : null;
  const currentTwrIndex = lastHistory ? lastHistory.twrIndexLevel : 100.0;
  const currentTwr = (currentTwrIndex - 100) / 100;
  const twrLevels = [100, ...history.map(h => h.twrIndexLevel)];
  const currentMDD = calculateMDD(twrLevels);

  // Filter stocks
  const allSectors = Array.from(new Set(STOCKS.map(s => s.sector)));
  const filteredStocks = STOCKS.filter(s => {
    if (marketFilter === 'KR' && s.market !== 'KR') return false;
    if (marketFilter === 'US' && s.market !== 'US') return false;
    if (marketFilter === 'HOLDING' && (!holdings[s.canonicalId] || holdings[s.canonicalId].shares <= 1e-7)) return false;
    if (sectorFilter !== 'ALL' && s.sector !== sectorFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        s.nameKo.toLowerCase().includes(q) ||
        s.nameEn.toLowerCase().includes(q) ||
        s.ticker.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Advance 1 Year handler
  const handleStepOneYear = () => {
    audioManager.playSound('click');
    stepOneYear();
    setShowYearEndModal(true);
  };

  // Quick Trade Execution
  const handleExecuteQuickTrade = () => {
    if (!quickTradeStock) return;
    try {
      if (quickTradeMode === 'BUY') {
        buyStock(quickTradeStock.canonicalId, quickTradeAmountKRW);
        audioManager.playSound('success');
      } else {
        sellStock(quickTradeStock.canonicalId, quickSellShares);
        audioManager.playSound('click');
      }
      setQuickTradeStock(null);
    } catch (e: any) {
      alert(e.message || '주문 처리 중 오류가 발생했습니다.');
    }
  };

  return (
    <div className="space-y-5 animate-fade-in-up pb-12">
      {/* Top Header & Year KPI Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        {/* Current Year Indicator */}
        <div className="col-span-2 sm:col-span-2 lg:col-span-1 p-3.5 bg-gradient-to-br from-blue-700 to-indigo-900 text-white rounded-2xl shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between text-[11px] font-bold text-blue-200">
            <span>운용 연도</span>
            <span className="bg-blue-600/60 px-2 py-0.5 rounded-full text-[10px]">{currentYear - settings.startYear}/{settings.endYear - settings.startYear}회차</span>
          </div>
          <div className="mt-1">
            <span className="text-2xl font-black tracking-tight">{currentYear}년</span>
            <span className="text-[10px] text-blue-300 block font-semibold">({settings.startYear}년말 ~ {settings.endYear}년말)</span>
          </div>
        </div>

        {/* Total Assets */}
        <div className="p-3 bg-white rounded-2xl border border-slate-200/70 shadow-sm flex flex-col justify-between">
          <span className="text-[11px] font-extrabold text-slate-500">총 평가 자산</span>
          <div>
            <span className="text-base sm:text-lg font-black text-slate-900 tracking-tight block">
              {formatKRW(currentTotalValue)}
            </span>
            <span className="text-[10px] text-slate-400 font-semibold">{formatWonNumber(currentTotalValue)}원</span>
          </div>
        </div>

        {/* Invested Principal */}
        <div className="p-3 bg-white rounded-2xl border border-slate-200/70 shadow-sm flex flex-col justify-between">
          <span className="text-[11px] font-extrabold text-slate-500">총 납입 원금</span>
          <div>
            <span className="text-base sm:text-lg font-black text-slate-800 tracking-tight block">
              {formatKRW(totalPrincipal)}
            </span>
            <span className="text-[10px] text-slate-400 font-semibold">누적 입금액</span>
          </div>
        </div>

        {/* Net Profit */}
        <div className="p-3 bg-white rounded-2xl border border-slate-200/70 shadow-sm flex flex-col justify-between">
          <span className="text-[11px] font-extrabold text-slate-500">누적 투자 손익</span>
          <div>
            <span className={`text-base sm:text-lg font-black tracking-tight block ${getReturnColor(netProfit)}`}>
              {netProfit > 0 ? '+' : ''}{formatKRW(netProfit)}
            </span>
            <span className={`text-[10px] font-bold ${getReturnColor(profitRate)}`}>
              {formatPercent(profitRate)}
            </span>
          </div>
        </div>

        {/* TWR */}
        <div className="p-3 bg-white rounded-2xl border border-slate-200/70 shadow-sm flex flex-col justify-between">
          <span className="text-[11px] font-extrabold text-slate-500">시간가중수익률 (TWR)</span>
          <div>
            <span className={`text-base sm:text-lg font-black tracking-tight block ${getReturnColor(currentTwr)}`}>
              {formatPercent(currentTwr)}
            </span>
            <span className="text-[10px] text-slate-400 font-semibold">순수 전략 복리</span>
          </div>
        </div>

        {/* MDD */}
        <div className="p-3 bg-white rounded-2xl border border-slate-200/70 shadow-sm flex flex-col justify-between">
          <span className="text-[11px] font-extrabold text-slate-500">최대낙폭 (MDD)</span>
          <div>
            <span className="text-base sm:text-lg font-black text-slate-800 tracking-tight block">
              -{formatPercent(currentMDD)}
            </span>
            <span className="text-[10px] text-slate-400 font-semibold">최대 손실폭</span>
          </div>
        </div>

        {/* Available Cash */}
        <div className="p-3 bg-emerald-50/80 rounded-2xl border border-emerald-200/70 shadow-sm flex flex-col justify-between">
          <span className="text-[11px] font-extrabold text-emerald-800">매매 대기 현금</span>
          <div>
            <span className="text-base sm:text-lg font-black text-emerald-700 tracking-tight block">
              {formatKRW(cashKRW)}
            </span>
            <span className="text-[10px] text-emerald-600 font-semibold">{formatWonNumber(cashKRW)}원</span>
          </div>
        </div>
      </div>

      {/* Main Interactive Workspace (Desktop: 2 Columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Stock Catalog (7 Cols on Desktop) */}
        <div className="lg:col-span-7 space-y-4">
          <GlassCard className="p-5 space-y-4" variant="default">
            {/* Catalog Filter Controls */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
              {/* Market Tabs */}
              <div className="flex bg-slate-100 p-1 rounded-xl gap-1">
                <button
                  onClick={() => setMarketFilter('ALL')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-black transition cursor-pointer ${
                    marketFilter === 'ALL' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  전체 (50)
                </button>
                <button
                  onClick={() => setMarketFilter('KR')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-black transition cursor-pointer flex items-center gap-1 ${
                    marketFilter === 'KR' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span>🇰🇷</span> 한국 (25)
                </button>
                <button
                  onClick={() => setMarketFilter('US')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-black transition cursor-pointer flex items-center gap-1 ${
                    marketFilter === 'US' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span>🇺🇸</span> 미국 (25)
                </button>
                <button
                  onClick={() => setMarketFilter('HOLDING')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-black transition cursor-pointer ${
                    marketFilter === 'HOLDING' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  보유종목 ({Object.keys(holdings).length})
                </button>
              </div>

              {/* Sector Dropdown */}
              <select
                value={sectorFilter}
                onChange={e => setSectorFilter(e.target.value)}
                className="px-3 py-1.5 bg-white rounded-xl border border-slate-200 text-xs font-bold text-slate-700 focus:outline-none shadow-sm"
              >
                <option value="ALL">전체 업종</option>
                {allSectors.map(sec => (
                  <option key={sec} value={sec}>{sec}</option>
                ))}
              </select>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="종목명 또는 티커 검색 (예: 삼성전자, AAPL, 현대차, NVDA)"
                className="w-full pl-10 pr-4 py-2.5 bg-white rounded-xl border border-slate-200 text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 shadow-sm"
              />
            </div>

            {/* Stock Cards List */}
            <div className="space-y-2.5 max-h-[560px] overflow-y-auto pr-1">
              {filteredStocks.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs font-bold">
                  조건에 맞는 종목이 없습니다.
                </div>
              ) : (
                filteredStocks.map(stock => {
                  const isListed = isStockListed(stock.canonicalId, currentYear);
                  const holding = holdings[stock.canonicalId];
                  const stats = getHistoricalStockStats(stock.canonicalId, priorYear, settings.includeFxEffect);
                  const priceKRW = getStockPriceKRW(stock.canonicalId, priorYear);

                  return (
                    <div
                      key={stock.canonicalId}
                      className={`p-3.5 rounded-2xl border transition-all duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        isListed
                          ? 'bg-white hover:border-blue-300 hover:shadow-md border-slate-200/70'
                          : 'bg-slate-50/70 border-slate-200/40 opacity-70'
                      }`}
                    >
                      {/* Left: Stock info */}
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center font-bold text-lg">
                          {stock.market === 'KR' ? '🇰🇷' : '🇺🇸'}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-extrabold text-slate-900 text-sm">{stock.nameKo}</h3>
                            <span className="text-[10px] font-mono text-slate-400 font-bold">({stock.ticker})</span>
                            {isListed ? (
                              <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                                {stock.sector}
                              </span>
                            ) : (
                              <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                                상장 전 ({stock.firstValidYear}년~)
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-[11px] text-slate-500 font-semibold mt-0.5">
                            <span>기준가: {priceKRW !== null ? formatKRW(priceKRW) : '-'}</span>
                            {holding && holding.shares > 0 && (
                              <span className="text-blue-600 font-bold">
                                보유: {holding.shares.toFixed(2)}주 ({formatKRW(holding.currentValueKRW)})
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Middle: Historical Stats */}
                      <div className="flex items-center gap-3 text-[11px] font-bold">
                        <div className="text-center sm:text-right">
                          <span className="text-[10px] text-slate-400 block font-semibold">직전 1년</span>
                          <span className={stats.last1YrReturn !== null ? getReturnColor(stats.last1YrReturn) : 'text-slate-400'}>
                            {stats.last1YrReturn !== null ? formatPercent(stats.last1YrReturn) : '-'}
                          </span>
                        </div>
                        <div className="text-center sm:text-right">
                          <span className="text-[10px] text-slate-400 block font-semibold">3년 CAGR</span>
                          <span className={stats.past3YrCAGR !== null ? getReturnColor(stats.past3YrCAGR) : 'text-slate-400'}>
                            {stats.past3YrCAGR !== null ? formatPercent(stats.past3YrCAGR) : '-'}
                          </span>
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div className="flex items-center gap-1.5 self-end sm:self-center">
                        <button
                          onClick={() => setSelectedStockForDetail(stock)}
                          className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs transition cursor-pointer"
                        >
                          상세
                        </button>
                        {isListed && (
                          <button
                            onClick={() => {
                              setQuickTradeStock(stock);
                              setQuickTradeMode('BUY');
                              setQuickTradeAmountKRW(Math.min(cashKRW, 2000000));
                            }}
                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-lg text-xs shadow-sm transition cursor-pointer"
                          >
                            매수
                          </button>
                        )}
                        {holding && holding.shares > 0 && (
                          <button
                            onClick={() => {
                              setQuickTradeStock(stock);
                              setQuickTradeMode('SELL');
                              setQuickSellShares(holding.shares);
                            }}
                            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white font-black rounded-lg text-xs shadow-sm transition cursor-pointer"
                          >
                            매도
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </GlassCard>
        </div>

        {/* Right Column: Portfolio & Action Hub (5 Cols on Desktop) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Current Portfolio Card */}
          <GlassCard className="p-5 space-y-4" variant="default">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <PieChart size={18} className="text-blue-600" />
                <h3 className="font-extrabold text-slate-800 text-sm">보유 포트폴리오 현황</h3>
              </div>
              <span className="text-xs font-black text-slate-500">
                총 {Object.keys(holdings).length}종목 보유
              </span>
            </div>

            {/* Holdings List */}
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
              {Object.keys(holdings).length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs font-bold">
                  현재 보유 중인 주식이 없습니다.<br />
                  왼쪽 카탈로그에서 종목을 매수하거나 자동투자를 실행해 보세요.
                </div>
              ) : (
                Object.values(holdings).map(h => {
                  const stock = STOCKS_BY_ID[h.canonicalId];
                  if (!stock || h.shares <= 1e-7) return null;
                  const pKRW = getStockPriceKRW(h.canonicalId, priorYear) || 1;
                  const currentVal = h.shares * pKRW;
                  const weightPct = currentTotalValue > 0 ? (currentVal / currentTotalValue) * 100 : 0;
                  const gain = currentVal - h.totalInvestedKRW;
                  const gainPct = h.totalInvestedKRW > 0 ? gain / h.totalInvestedKRW : 0;

                  return (
                    <div key={h.canonicalId} className="p-3 bg-white rounded-xl border border-slate-200/60 shadow-sm flex items-center justify-between text-xs font-semibold">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span>{stock.market === 'KR' ? '🇰🇷' : '🇺🇸'}</span>
                          <span className="font-extrabold text-slate-800">{stock.nameKo}</span>
                          <span className="text-[10px] text-blue-600 font-black">{weightPct.toFixed(1)}%</span>
                        </div>
                        <span className="text-[10px] text-slate-400 block font-mono">
                          {h.shares.toFixed(2)}주 · 평단 {formatWonNumber(h.averageCostKRW)}원
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="font-black text-slate-800 block">{formatKRW(currentVal)}</span>
                        <span className={`text-[10px] font-bold ${getReturnColor(gain)}`}>
                          {gain > 0 ? '+' : ''}{formatWonNumber(gain)}원 ({formatPercent(gainPct)})
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Cash Row */}
            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200/70 flex items-center justify-between text-xs font-bold text-emerald-900">
              <span>매매 대기 현금</span>
              <span className="font-black text-emerald-700 text-sm">{formatKRW(cashKRW)}</span>
            </div>
          </GlassCard>

          {/* Action Execution Card */}
          <GlassCard className="p-5 space-y-3.5" variant="strong">
            <h3 className="font-black text-slate-800 text-sm flex items-center gap-2">
              <Zap size={18} className="text-amber-500" />
              시뮬레이션 실행 제어기
            </h3>

            <div className="space-y-2">
              {/* Advance 1 Year Primary Button */}
              <button
                onClick={handleStepOneYear}
                className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black rounded-2xl shadow-lg shadow-blue-600/25 transition transform active:scale-98 flex items-center justify-center gap-2 text-sm cursor-pointer"
              >
                <Play size={18} />
                <span>{currentYear}년 투자 실행 & 1년 진행하기</span>
              </button>

              {/* Multi-Year Auto-Invest Quick Buttons */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setShowAutoInvestModal(true)}
                  className="py-3 px-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-extrabold rounded-xl border border-indigo-200 transition flex items-center justify-center gap-1 text-xs cursor-pointer"
                >
                  <Sparkles size={14} className="text-indigo-600" />
                  <span>5년·10년 자동투자</span>
                </button>

                <button
                  onClick={() => {
                    if (history.length === 0) {
                      alert('되돌릴 수 있는 이전 연도가 없습니다.');
                      return;
                    }
                    if (confirm('직전 1년 투자를 취소하고 이전 연도로 되돌리시겠습니까?')) {
                      undoYear();
                    }
                  }}
                  disabled={history.length === 0}
                  className="py-3 px-3 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 font-extrabold rounded-xl transition flex items-center justify-center gap-1 text-xs cursor-pointer"
                >
                  <RotateCcw size={14} />
                  <span>해당 연도 되돌리기</span>
                </button>
              </div>
            </div>

            {/* Character Guide Mini */}
            <div className="pt-2">
              <AnimatedCharacterGuide
                compact={true}
                mood="thinking"
                title="나의 투자 길잡이"
                subtitle={`${currentYear}년 시장 의사결정`}
                message={`${currentYear}년 초 자산 배분을 점검하세요. 한국과 미국 우량 기업에 분산하거나 자동투자 규칙을 실행할 수 있습니다.`}
              />
            </div>
          </GlassCard>
        </div>
      </div>

      {/* Quick Trade Buy/Sell Modal */}
      {quickTradeStock && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <GlassCard className="w-full max-w-md p-6 relative animate-fade-in-up border-white/80" variant="strong">
            <button
              onClick={() => setQuickTradeStock(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X size={18} />
            </button>

            <h3 className="text-base font-black text-slate-800 mb-1 flex items-center gap-2">
              <span>{quickTradeStock.market === 'KR' ? '🇰🇷' : '🇺🇸'}</span>
              <span>{quickTradeStock.nameKo} ({quickTradeStock.ticker})</span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                quickTradeMode === 'BUY' ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-800'
              }`}>
                {quickTradeMode === 'BUY' ? '매수 주문' : '매도 주문'}
              </span>
            </h3>
            <p className="text-xs text-slate-500 font-semibold mb-4">
              기준 단가: {formatKRW(getStockPriceKRW(quickTradeStock.canonicalId, priorYear) || 1)}
            </p>

            {quickTradeMode === 'BUY' ? (
              <div className="space-y-4 text-xs font-semibold">
                <div className="space-y-1">
                  <div className="flex justify-between text-slate-700 font-extrabold">
                    <span>매수 금액 설정</span>
                    <span className="text-blue-600 font-black">{formatKRW(quickTradeAmountKRW)}</span>
                  </div>
                  <input
                    type="range"
                    min={100000}
                    max={Math.max(100000, cashKRW)}
                    step={100000}
                    value={quickTradeAmountKRW}
                    onChange={e => setQuickTradeAmountKRW(parseFloat(e.target.value))}
                    className="w-full accent-blue-600"
                  />
                </div>

                <div className="grid grid-cols-4 gap-1.5">
                  {[0.25, 0.5, 0.75, 1.0].map(ratio => (
                    <button
                      key={ratio}
                      type="button"
                      onClick={() => setQuickTradeAmountKRW(Math.floor(cashKRW * ratio))}
                      className="py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-[10px] font-black text-slate-700"
                    >
                      {ratio * 100}% ({formatKRW(Math.floor(cashKRW * ratio))})
                    </button>
                  ))}
                </div>

                <div className="p-3 bg-slate-50 rounded-xl space-y-1 text-[11px] text-slate-500 font-medium">
                  <div className="flex justify-between">
                    <span>예상 매수 수량:</span>
                    <span className="font-bold text-slate-800">
                      {((quickTradeAmountKRW) / (getStockPriceKRW(quickTradeStock.canonicalId, priorYear) || 1)).toFixed(4)}주
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>예상 거래비용 (0.1%):</span>
                    <span className="font-bold text-slate-800">{formatWonNumber(quickTradeAmountKRW * 0.001)}원</span>
                  </div>
                </div>

                <button
                  onClick={handleExecuteQuickTrade}
                  className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl shadow-md transition cursor-pointer text-xs"
                >
                  매수 주문 실행
                </button>
              </div>
            ) : (
              <div className="space-y-4 text-xs font-semibold">
                <div className="space-y-1">
                  <div className="flex justify-between text-slate-700 font-extrabold">
                    <span>매도 수량 설정</span>
                    <span className="text-slate-800 font-black">{quickSellShares.toFixed(4)}주</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={holdings[quickTradeStock.canonicalId]?.shares || 0}
                    step={0.01}
                    value={quickSellShares}
                    onChange={e => setQuickSellShares(parseFloat(e.target.value))}
                    className="w-full accent-slate-800"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setQuickSellShares((holdings[quickTradeStock.canonicalId]?.shares || 0) * 0.5)}
                    className="flex-1 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-bold text-slate-700"
                  >
                    절반 매도 (50%)
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickSellShares(holdings[quickTradeStock.canonicalId]?.shares || 0)}
                    className="flex-1 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-bold text-slate-700"
                  >
                    전량 매도 (100%)
                  </button>
                </div>

                <button
                  onClick={handleExecuteQuickTrade}
                  className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-black rounded-xl shadow-md transition cursor-pointer text-xs"
                >
                  매도 주문 실행
                </button>
              </div>
            )}
          </GlassCard>
        </div>
      )}

      {/* Year-End Briefing Modal */}
      {showYearEndModal && (
        <YearEndBriefingModal
          record={lastHistory}
          isGameOver={isGameOver}
          onProceed={() => {
            setShowYearEndModal(false);
            if (isGameOver) {
              onNavigate('result');
            }
          }}
        />
      )}

      {/* Auto-Invest Modal */}
      <AutoInvestModal
        isOpen={showAutoInvestModal}
        currentYear={currentYear}
        endYear={settings.endYear}
        savedRules={state.savedAutoInvestRules}
        onClose={() => setShowAutoInvestModal(false)}
        onExecuteAutoInvest={(rule, years) => {
          runAutoInvest(rule, years);
          setShowYearEndModal(true);
        }}
        onSaveRule={saveAutoInvestRule}
        onDeleteRule={deleteAutoInvestRule}
      />

      {/* Stock Detail Modal */}
      <StockDetailModal
        stock={selectedStockForDetail}
        currentYear={currentYear}
        onClose={() => setSelectedStockForDetail(null)}
      />

      {/* Glossary Modal */}
      <GlossaryModal isOpen={showGlossaryModal} onClose={() => setShowGlossaryModal(false)} />
    </div>
  );
};
