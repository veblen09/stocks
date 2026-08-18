import type { FinalMetrics, StockGameState } from '../types/stockGame';

/**
 * Generates and downloads a CSV export of the entire simulation history
 */
export function exportSimulationToCsv(state: StockGameState, metrics: FinalMetrics) {
  const lines: string[] = [];

  // UTF-8 BOM for Excel compatibility with Korean text
  lines.push('\uFEFF');

  // Title & Metadata
  lines.push(`"머니트랙: 45년 한·미 주식투자 실험실 결과 보고서"`);
  lines.push(`"투자자 닉네임","${state.settings.nickname}"`);
  lines.push(`"운용 기간","${state.settings.startYear}년 말 ~ ${state.settings.endYear}년 말 (${state.history.length}개년)"`);
  lines.push(`"초기 투자금","${state.settings.initialCashKRW.toLocaleString()}원"`);
  lines.push(`"연간 추가 투자금","${state.settings.annualContributionKRW.toLocaleString()}원"`);
  lines.push(`"총 납입 원금","${metrics.totalInvestedPrincipal.toLocaleString()}원"`);
  lines.push(`"최종 평가 금액","${Math.round(metrics.finalPortfolioValue).toLocaleString()}원"`);
  lines.push(`"누적 순손익","${Math.round(metrics.totalNetProfitKRW).toLocaleString()}원"`);
  lines.push(`"시간가중수익률 (TWR)","${(metrics.twr * 100).toFixed(2)}%"`);
  lines.push(`"연평균복리수익률 (CAGR)","${(metrics.twrCAGR * 100).toFixed(2)}%"`);
  lines.push(`"금액가중수익률 (IRR)","${(metrics.mwrIRR * 100).toFixed(2)}%"`);
  lines.push(`"최대낙폭 (MDD)","${(metrics.maxDrawdownMDD * 100).toFixed(2)}%"`);
  lines.push(`"연간 변동성","${(metrics.annualVolatility * 100).toFixed(2)}%"`);
  lines.push(`"투자 성향 유형","${metrics.scoreAndPersona.personaType} (${metrics.scoreAndPersona.personaBadge})"`);
  lines.push('');

  // 1. Annual History Table
  lines.push(`"=== 연도별 운용 성과 표 ==="`);
  lines.push(`"연도","기초 총자산(원)","연초 입금(원)","기말 총자산(원)","포트폴리오 수익률(%)","TWR 지수(100기준)","코스피 수익률(%)","S&P500(원화) 수익률(%)","50:50혼합 수익률(%)","USD/KRW 환율","환율 기여손익(원)","거래비용(원)","시장 역사 브리핑"`);

  state.history.forEach(h => {
    const pRet = (h.annualReturn * 100).toFixed(2);
    const kRet = (h.benchmarkReturns.kospi * 100).toFixed(2);
    const spRet = (h.benchmarkReturns.sp500KRW * 100).toFixed(2);
    const blendRet = (h.benchmarkReturns.blend5050 * 100).toFixed(2);
    const briefing = `[${h.marketBriefing.titleKo}] ${h.marketBriefing.descriptionKo}`.replace(/"/g, '""');

    lines.push(
      `"${h.year}","${Math.round(h.startTotalAssetsKRW)}","${h.annualDepositKRW}","${Math.round(h.endTotalAssetsKRW)}","${pRet}%","${h.twrIndexLevel.toFixed(2)}","${kRet}%","${spRet}%","${blendRet}%","${h.fxRate.toFixed(2)}","${Math.round(h.fxContributionPnlKRW)}","${Math.round(h.totalFeesPaidKRW)}","${briefing}"`
    );
  });

  lines.push('');

  // 2. Trade Logs Table
  lines.push(`"=== 거래 내역 로그 ==="`);
  lines.push(`"연도","종목코드","종목명","구분","거래수량","현지원가","환율","원화단가","거래총액(원)","거래비용(원)"`);

  state.tradeLogs.forEach(l => {
    lines.push(
      `"${l.year}","${l.canonicalId}","${l.stockNameKo}","${l.action}","${l.shares.toFixed(4)}","${l.priceLocal.toFixed(2)}","${l.fxRate.toFixed(2)}","${Math.round(l.priceKRW)}","${Math.round(l.totalAmountKRW)}","${Math.round(l.feeKRW)}"`
    );
  });

  const csvContent = lines.join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `머니트랙_45년_주식투자_결과_${state.settings.nickname}_${Date.now()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
