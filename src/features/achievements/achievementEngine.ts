import type { StockGameState } from '../../types/stockGame';


export function evaluateAchievements(state: StockGameState): string[] {
  const currentUnlocked = new Set(state.unlockedAchievementIds || []);
  const newlyUnlocked: string[] = [];

  // 1. first_evidence_trade
  if (!currentUnlocked.has('first_evidence_trade')) {
    const hasEvidenceTrade = state.tradeLogs.some(
      t => (t.linkedNewsIds && t.linkedNewsIds.length > 0) || (t.thesis && t.thesis.trim().length > 0)
    );
    if (hasEvidenceTrade) {
      newlyUnlocked.push('first_evidence_trade');
    }
  }

  // 2. filing_detective
  if (!currentUnlocked.has('filing_detective')) {
    const notesCount = Object.keys(state.investmentNotes || {}).length;
    if (notesCount >= 10) {
      newlyUnlocked.push('filing_detective');
    }
  }

  // 3. five_year_discipline
  if (!currentUnlocked.has('five_year_discipline')) {
    if (state.history.length >= 5) {
      newlyUnlocked.push('five_year_discipline');
    }
  }

  // 4. diversification_designer
  if (!currentUnlocked.has('diversification_designer')) {
    const holdingKeys = Object.keys(state.holdings || {});
    if (holdingKeys.length >= 5) {
      newlyUnlocked.push('diversification_designer');
    }
  }

  // 5. concentration_manager
  if (!currentUnlocked.has('concentration_manager')) {
    const totalAssets = state.cashKRW + Object.values(state.holdings || {}).reduce((s, h) => s + (h.currentValueKRW || 0), 0);
    if (totalAssets > 0 && Object.keys(state.holdings || {}).length >= 3) {
      const maxHoldingVal = Math.max(...Object.values(state.holdings || {}).map(h => h.currentValueKRW || 0), 0);
      if (maxHoldingVal / totalAssets <= 0.35) {
        newlyUnlocked.push('concentration_manager');
      }
    }
  }

  // 6. cost_saver
  if (!currentUnlocked.has('cost_saver')) {
    const totalFees = state.tradeLogs.reduce((s, t) => s + t.feeKRW, 0);
    const totalAssets = state.cashKRW + Object.values(state.holdings || {}).reduce((s, h) => s + (h.currentValueKRW || 0), 0);
    if (state.history.length >= 3 && totalAssets > 0 && (totalFees / totalAssets) <= 0.005) {
      newlyUnlocked.push('cost_saver');
    }
  }

  // 7. crisis_survivor
  if (!currentUnlocked.has('crisis_survivor')) {
    const hadCrisis = state.history.some(h => (h.benchmarkReturns?.kospi || 0) < -0.15 || (h.benchmarkReturns?.sp500KRW || 0) < -0.15);
    if (hadCrisis && state.history.length >= 2) {
      newlyUnlocked.push('crisis_survivor');
    }
  }

  // 8. fx_analyst
  if (!currentUnlocked.has('fx_analyst')) {
    const hasFxNote = Object.values(state.investmentNotes || {}).some(
      n => n.includes('환율') || n.includes('달러') || n.includes('원화') || n.includes('FX')
    );
    if (hasFxNote) {
      newlyUnlocked.push('fx_analyst');
    }
  }

  // 9. contrary_evidence
  if (!currentUnlocked.has('contrary_evidence')) {
    const hasEvidence = Object.values(state.investmentNotes || {}).some(
      n => n.includes('리스크') || n.includes('우려') || n.includes('한계') || n.includes('부정')
    );
    if (hasEvidence) {
      newlyUnlocked.push('contrary_evidence');
    }
  }

  // 10. benchmark_reviewer
  if (!currentUnlocked.has('benchmark_reviewer')) {
    if (state.history.length >= 1) {
      newlyUnlocked.push('benchmark_reviewer');
    }
  }

  return newlyUnlocked;
}
