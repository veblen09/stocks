import type { GameState } from '../types/finance';
import { calculateFinalScores } from '../engine/scoring';
import { formatMoney } from './formatMoney';
import { calculateTotalInvested, calculatePeerWorth } from './financeCalculations';

/**
 * 브라우저에서 HTML 문자열을 파일로 다운로드합니다.
 */
export function downloadHtmlFile(filename: string, htmlContent: string) {
  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * 머니트랙 시뮬레이션 결과 보고서를 단독 실행 가능한 HTML 파일로 다운로드합니다.
 */
export function exportReportToHtml(state: GameState) {
  const scores = state.scores || calculateFinalScores(state);
  const { finalNetWorth, cumulativeReturn, maxDrawdown, emergencyFundScore, diversificationScore, longTermScore, decisionScore, archetype } = scores;

  // 원금 및 또래 평균 연산
  const totalInvested = calculateTotalInvested(state);
  const finalPeerWorth = calculatePeerWorth(state);

  // 엔딩 판단
  const richThreshold = Math.round(finalPeerWorth * 1.25);
  const cashVal = state.allocations['cash'] || 0;
  const depositVal = state.allocations['deposit'] || 0;
  const savingVal = state.allocations['saving'] || 0;
  const housingVal = state.allocations['housing'] || 0;
  const safeAssetVal = cashVal + depositVal + savingVal + housingVal;
  const safeAssetPercent = finalNetWorth > 0 ? (safeAssetVal / finalNetWorth) * 100 : 0;

  let endingTitle = '';
  let endingDesc = '';
  let endingTag = '';
  let endingColorClass = '';

  const peerDiffPercent = finalPeerWorth > 0 
    ? Math.round(((finalNetWorth - finalPeerWorth) / finalPeerWorth) * 100)
    : 0;

  if (finalNetWorth >= richThreshold || cumulativeReturn >= 40) {
    const peerPerformanceText = peerDiffPercent > 0
      ? `같은 또래 평균 자산(${formatMoney(finalPeerWorth)}) 대비 +${peerDiffPercent.toLocaleString()}%를 초과 달성하고 누적 +${cumulativeReturn}%의 성과`
      : `누적 +${cumulativeReturn}%의 성과`;

    const hasExtremeRisk = diversificationScore <= 35 || decisionScore <= 35 || emergencyFundScore <= 20;

    if (hasExtremeRisk) {
      endingTag = '👑 고수익 달성 (주의 요망)';
      endingTitle = '위험 집중형 부자 엔딩';
      endingDesc = `${peerPerformanceText}를 올리며, 최종적으로 ${formatMoney(finalNetWorth)}의 거대한 자산을 형성하는 데 성공했습니다. 다만 포트폴리오 분산력(${diversificationScore}점)과 금융 의사결정(${decisionScore}점), 비상금 관리(${emergencyFundScore}점) 면에서 극단적인 위험을 감수했습니다. 이번 시뮬레이션에서는 시장 환경과 시세 차익의 행운이 따랐으나, 현실에서는 하락장이나 금리 급등, 돌발 위기 시 심각한 유동성 경색과 원금 손실을 겪을 수 있습니다. 장기적으로 안전한 부를 지키기 위해선 분산 투자와 비상금 방어벽을 반드시 병행해야 합니다!`;
      endingColorClass = '#d97706';
    } else {
      endingTag = '👑 시장 초과 달성';
      endingTitle = '경제적 자유 부자 엔딩';
      endingDesc = `${peerPerformanceText}를 올리며, 최종적으로 ${formatMoney(finalNetWorth)}의 거대한 자산을 형성하는 데 성공했습니다. 철저한 자산 배분 원칙과 포트폴리오 리밸런싱, 건전한 금융 의사결정을 바탕으로 장기 복리 효과의 과실을 완벽히 수확하셨습니다.`;
      endingColorClass = '#059669';
    }
  } else if (safeAssetPercent >= 75 && cumulativeReturn < 10) {
    endingTag = '💸 인플레이션 벼락거지';
    endingTitle = '보이지 않는 세금 손실 엔딩';
    endingDesc = `최종 순자산은 ${formatMoney(finalNetWorth)}으로 명목 원금은 지켜냈으나, 전체 자산의 ${safeAssetPercent.toFixed(0)}%를 가치가 하락하는 예적금과 현금에만 묶어두었습니다. 그 결과 고물가 상승(인플레이션)으로 인해 화폐 구매력이 하락하여 실질 자산 가치 면에서 손해를 입었습니다.`;
    endingColorClass = '#d97706';
  } else if (finalNetWorth >= totalInvested) {
    endingTag = '🏡 안정적인 성실형 자산가';
    endingTitle = '중산층 안착 엔딩';
    endingDesc = `최종 자산 ${formatMoney(finalNetWorth)}을 일구며 또래 평균 자산 흐름에 발맞추어, 본인의 총 납입 원금(${formatMoney(totalInvested)})을 사수하고 안정적 성장을 만드는 데 성공했습니다.`;
    endingColorClass = '#2563eb';
  } else {
    endingTag = '⚠️ 자산 원금 손실';
    endingTitle = '파산 위기 엔딩';
    endingDesc = `최종 순자산이 ${formatMoney(finalNetWorth)}으로 귀하가 성실히 저축하고 부은 납입 원금 총액(${formatMoney(totalInvested)})보다 자산이 깎여나가며 여정을 마쳤습니다. 뇌동 테마주 몰빵 투자, 고수익 사기 피해, 비상금 부족 등이 원금 손실을 초래했습니다.`;
    endingColorClass = '#e11d48';
  }

  const reflectionQuestions = [
    "내가 가장 많이 투자한 자산은 무엇인가?",
    "그 선택을 한 이유는 무엇인가?",
    "가장 불안했던 순간은 언제였는가?",
    "손실이 났을 때 나는 어떻게 행동했는가?",
    "비상금은 왜 필요하다고 느꼈는가?",
    "분산투자는 어떤 장점과 한계가 있었는가?",
    "장기투자와 단기투자의 차이를 게임에서 어떻게 경험했는가?",
    "실제 인생에서 이 게임과 다른 점은 무엇인가?",
    "오늘 배운 내용 중 실제 생활에 적용할 수 있는 것은 무엇인가?",
    "다음에 다시 플레이한다면 전략을 어떻게 바꿀 것인가?"
  ];

  const historyRowsHtml = state.history
    .map((h) => {
      const turnLabel = h.turn === 0 ? '시작' : `${Math.floor((h.turn - 1) / 2) + 1}년차 ${h.turn % 2 === 1 ? '상반기' : '하반기'}`;
      const eventText = h.event ? `<strong>[${h.event.title}]</strong> ${h.event.choiceMade || ''}` : '-';
      const returnClass = h.returnRate > 0 ? 'positive' : h.returnRate < 0 ? 'negative' : '';
      const returnSign = h.returnRate > 0 ? '+' : '';

      return `
        <tr>
          <td>${h.turn} (${turnLabel})</td>
          <td>${h.age}세</td>
          <td class="bold">${formatMoney(h.netWorth)}</td>
          <td>${formatMoney(h.invested)}</td>
          <td>${formatMoney(h.cash)}</td>
          <td class="${returnClass}">${returnSign}${h.returnRate}%</td>
          <td class="event-cell">${eventText}</td>
        </tr>
      `;
    })
    .join('');

  const questionsHtml = reflectionQuestions
    .map((q, i) => `<li><strong>${i + 1}.</strong> ${q}</li>`)
    .join('');

  const archetypeQuestionsHtml = (archetype.questions || [])
    .map((q) => `<li>${q}</li>`)
    .join('');

  const now = new Date();
  const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  const htmlContent = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>머니트랙 20년 자산관리 실험 보고서 - ${state.nickname}</title>
  <style>
    :root {
      --primary: #2563eb;
      --primary-dark: #1d4ed8;
      --bg: #f8fafc;
      --card-bg: #ffffff;
      --text: #0f172a;
      --text-muted: #64748b;
      --border: #e2e8f0;
      --accent-green: #059669;
      --accent-red: #e11d48;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      background-color: var(--bg);
      color: var(--text);
      line-height: 1.6;
      padding: 2rem 1rem;
    }

    .container {
      max-width: 900px;
      margin: 0 auto;
      background: var(--card-bg);
      padding: 2.5rem;
      border-radius: 24px;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01);
      border: 1px solid var(--border);
    }

    .header {
      border-bottom: 2px solid #f1f5f9;
      padding-bottom: 1.5rem;
      margin-bottom: 2rem;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      flex-wrap: wrap;
      gap: 1rem;
    }

    .badge {
      display: inline-block;
      padding: 0.25rem 0.75rem;
      background: #eff6ff;
      color: var(--primary);
      border: 1px solid #bfdbfe;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 0.5rem;
    }

    h1 {
      font-size: 1.75rem;
      font-weight: 900;
      color: #0f172a;
    }

    .meta-info {
      font-size: 0.85rem;
      color: var(--text-muted);
      font-weight: 600;
    }

    .meta-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 1rem;
      background: #f8fafc;
      padding: 1.25rem;
      border-radius: 16px;
      border: 1px solid #f1f5f9;
      margin-bottom: 2rem;
      font-size: 0.875rem;
    }

    .meta-item label {
      display: block;
      font-size: 0.75rem;
      color: var(--text-muted);
      font-weight: 700;
    }

    .meta-item span {
      font-weight: 800;
      color: #1e293b;
    }

    .card {
      background: #ffffff;
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 1.5rem;
      margin-bottom: 1.75rem;
    }

    .ending-card {
      border-left: 6px solid ${endingColorClass};
      background: #fdfefe;
    }

    .ending-tag {
      font-size: 0.75rem;
      font-weight: 800;
      color: ${endingColorClass};
      text-transform: uppercase;
    }

    .ending-title {
      font-size: 1.25rem;
      font-weight: 900;
      margin: 0.25rem 0 0.75rem 0;
    }

    .ending-desc {
      font-size: 0.95rem;
      color: #334155;
      font-weight: 500;
    }

    .archetype-card {
      background: linear-gradient(135deg, #eff6ff 0%, #f0f9ff 100%);
      border: 1px solid #dbeafe;
    }

    .archetype-header {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-bottom: 1rem;
    }

    .archetype-emoji {
      font-size: 2.5rem;
    }

    .archetype-title {
      font-size: 1.2rem;
      font-weight: 900;
      color: #1e40af;
    }

    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 1rem;
      margin-bottom: 2rem;
    }

    .metric-box {
      background: #f8fafc;
      padding: 1.25rem;
      border-radius: 16px;
      border: 1px solid var(--border);
      text-align: center;
    }

    .metric-label {
      font-size: 0.75rem;
      font-weight: 700;
      color: var(--text-muted);
    }

    .metric-value {
      font-size: 1.35rem;
      font-weight: 900;
      color: #0f172a;
      margin-top: 0.25rem;
    }

    .scores-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(380px, 1fr));
      gap: 1rem;
    }

    .score-row {
      margin-bottom: 1rem;
    }

    .score-header {
      display: flex;
      justify-content: space-between;
      font-size: 0.85rem;
      font-weight: 700;
      margin-bottom: 0.35rem;
    }

    .progress-bar {
      height: 8px;
      background: #e2e8f0;
      border-radius: 9999px;
      overflow: hidden;
    }

    .progress-fill {
      height: 100%;
      border-radius: 9999px;
      background: var(--primary);
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 1rem;
      font-size: 0.825rem;
    }

    th, td {
      padding: 0.65rem 0.75rem;
      text-align: left;
      border-bottom: 1px solid var(--border);
    }

    th {
      background: #f8fafc;
      font-weight: 800;
      color: #475569;
    }

    td.bold {
      font-weight: 800;
    }

    td.positive {
      color: var(--accent-green);
      font-weight: 800;
    }

    td.negative {
      color: var(--accent-red);
      font-weight: 800;
    }

    td.event-cell {
      max-width: 250px;
      font-size: 0.8rem;
      color: #475569;
    }

    .questions-list {
      list-style: none;
      padding: 0;
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(380px, 1fr));
      gap: 0.75rem;
      font-size: 0.85rem;
    }

    .questions-list li {
      background: #f8fafc;
      padding: 0.75rem 1rem;
      border-radius: 12px;
      border: 1px solid #f1f5f9;
      font-weight: 600;
    }

    .footer {
      border-top: 1px solid var(--border);
      padding-top: 1.5rem;
      margin-top: 2.5rem;
      text-align: center;
      font-size: 0.75rem;
      color: var(--text-muted);
      font-weight: 600;
    }

    @media print {
      body {
        background: #fff;
        padding: 0;
      }
      .container {
        box-shadow: none;
        border: none;
        padding: 0;
        max-width: 100%;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div>
        <span class="badge">🎓 시뮬레이션 수료 리포트</span>
        <h1>${state.nickname}님의 ${state.simulationLength}년 자산관리 실험 보고서</h1>
      </div>
      <div class="meta-info">
        발행일시: ${dateStr}
      </div>
    </div>

    <div class="meta-grid">
      <div class="meta-item">
        <label>참여자 이름</label>
        <span>${state.nickname}</span>
      </div>
      <div class="meta-item">
        <label>시작 나이 / 종료 나이</label>
        <span>${state.startAge}세 &rarr; ${state.currentAge}세</span>
      </div>
      <div class="meta-item">
        <label>실험 기간</label>
        <span>${state.simulationLength}년 (${state.currentTurn}턴)</span>
      </div>
      <div class="meta-item">
        <label>난이도 / 시나리오</label>
        <span>${state.difficulty === 'stable' ? '안정형' : state.difficulty === 'normal' ? '일반형' : '변동성 높음'} / ${state.scenario || '표준'}</span>
      </div>
    </div>

    <!-- 1. 엔딩 스토리 카드 -->
    <div class="card ending-card">
      <div class="ending-tag">${endingTag}</div>
      <div class="ending-title">${endingTitle}</div>
      <div class="ending-desc">${endingDesc}</div>
    </div>

    <!-- 2. 최종 자산관리 아키타입 -->
    <div class="card archetype-card">
      <div class="archetype-header">
        <div class="archetype-emoji">${archetype.emoji}</div>
        <div>
          <span style="font-size: 0.75rem; font-weight: 800; color: #3b82f6; text-transform: uppercase;">나의 최종 자산관리 유형</span>
          <div class="archetype-title">당신은 "${archetype.name}" 입니다.</div>
        </div>
      </div>
      <p style="font-size: 0.9rem; color: #334155; font-style: italic; font-weight: 600; margin-bottom: 1rem;">
        "${archetype.description}"
      </p>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 0.75rem; font-size: 0.8rem;">
        <div style="background: rgba(255,255,255,0.7); padding: 0.75rem; border-radius: 10px; border: 1px solid #bfdbfe;">
          <strong style="color: #047857;">✔️ 장점:</strong> ${archetype.pros}
        </div>
        <div style="background: rgba(255,255,255,0.7); padding: 0.75rem; border-radius: 10px; border: 1px solid #bfdbfe;">
          <strong style="color: #be123c;">⚠️ 주의점:</strong> ${archetype.cons}
        </div>
      </div>
      ${archetypeQuestionsHtml ? `
        <div style="margin-top: 1rem; padding-top: 0.75rem; border-top: 1px dashed #bfdbfe; font-size: 0.8rem;">
          <strong style="color: #1d4ed8;">💬 성찰 질문:</strong>
          <ul style="padding-left: 1.25rem; margin-top: 0.35rem; color: #475569;">${archetypeQuestionsHtml}</ul>
        </div>
      ` : ''}
    </div>

    <!-- 3. 핵심 성과 지표 (KPI) -->
    <h3 style="font-size: 1.1rem; font-weight: 800; margin-bottom: 0.75rem;">📊 주요 성과 지표</h3>
    <div class="metrics-grid">
      <div class="metric-box">
        <div class="metric-label">최종 순자산</div>
        <div class="metric-value" style="color: #059669;">${formatMoney(finalNetWorth)}</div>
      </div>
      <div class="metric-box">
        <div class="metric-label">또래 평균 자산</div>
        <div class="metric-value">${formatMoney(finalPeerWorth)}</div>
      </div>
      <div class="metric-box">
        <div class="metric-label">누적 수익률</div>
        <div class="metric-value" style="color: ${cumulativeReturn >= 0 ? '#059669' : '#e11d48'};">${cumulativeReturn > 0 ? '+' : ''}${cumulativeReturn}%</div>
      </div>
      <div class="metric-box">
        <div class="metric-label">최대 낙폭 (MDD)</div>
        <div class="metric-value" style="color: ${maxDrawdown > 20 ? '#e11d48' : '#d97706'};">${maxDrawdown}%</div>
      </div>
    </div>

    <!-- 4. 자산관리 역량 점수표 -->
    <div class="card">
      <h3 style="font-size: 1.05rem; font-weight: 800; margin-bottom: 1.25rem;">🎯 4대 자산관리 역량 성적표</h3>
      <div class="scores-grid">
        <div class="score-row">
          <div class="score-header">
            <span>🛡️ 비상금 유지력</span>
            <span>${emergencyFundScore}점</span>
          </div>
          <div class="progress-bar"><div class="progress-fill" style="width: ${Math.max(0, Math.min(100, emergencyFundScore))}%; background: #38bdf8;"></div></div>
        </div>
        <div class="score-row">
          <div class="score-header">
            <span>⚖️ 포트폴리오 분산력</span>
            <span>${diversificationScore}점</span>
          </div>
          <div class="progress-bar"><div class="progress-fill" style="width: ${Math.max(0, Math.min(100, diversificationScore))}%; background: #818cf8;"></div></div>
        </div>
        <div class="score-row">
          <div class="score-header">
            <span>🌳 장기투자 지구력</span>
            <span>${longTermScore}점</span>
          </div>
          <div class="progress-bar"><div class="progress-fill" style="width: ${Math.max(0, Math.min(100, longTermScore))}%; background: #10b981;"></div></div>
        </div>
        <div class="score-row">
          <div class="score-header">
            <span>🧠 현명한 금융 의사결정</span>
            <span>${decisionScore}점</span>
          </div>
          <div class="progress-bar"><div class="progress-fill" style="width: ${Math.max(0, Math.min(100, decisionScore))}%; background: #c084fc;"></div></div>
        </div>
      </div>
    </div>

    <!-- 5. 턴별 진행 이력 로그 -->
    <div class="card">
      <h3 style="font-size: 1.05rem; font-weight: 800; margin-bottom: 0.5rem;">📜 턴별 자산 및 의사결정 기록</h3>
      <table>
        <thead>
          <tr>
            <th>턴 (시기)</th>
            <th>나이</th>
            <th>순자산</th>
            <th>투자금</th>
            <th>비상금</th>
            <th>수익률</th>
            <th>이벤트 및 선택지</th>
          </tr>
        </thead>
        <tbody>
          ${historyRowsHtml}
        </tbody>
      </table>
    </div>

    <!-- 6. 수업용 성찰 회고 질문 -->
    <div class="card">
      <h3 style="font-size: 1.05rem; font-weight: 800; margin-bottom: 1rem;">📝 수업용 회고(성찰) 질문지</h3>
      <ul class="questions-list">
        ${questionsHtml}
      </ul>
    </div>

    <!-- 하단 푸터 -->
    <div class="footer">
      <div>Copyright 2026. 하나고등학교 일반사회 교사 김윤구 All Right Reserved. (veblen@hana.hs.kr)</div>
      <div>머니트랙: 20년 자산관리 실험실. 본 보고서는 금융교육 시뮬레이션 결과물입니다.</div>
    </div>
  </div>
</body>
</html>`;

  const fileName = `머니트랙_실험보고서_${state.nickname || '학생'}.html`;
  downloadHtmlFile(fileName, htmlContent);
}

/**
 * 교사용 시뮬레이션 수업 지도안을 단독 HTML 파일로 다운로드합니다.
 */
export function exportTeacherGuideToHtml() {
  const now = new Date();
  const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  const htmlContent = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>머니트랙 교사용 시뮬레이션 수업 지도안</title>
  <style>
    :root {
      --primary: #2563eb;
      --bg: #f8fafc;
      --card-bg: #ffffff;
      --text: #0f172a;
      --text-muted: #64748b;
      --border: #e2e8f0;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
      background: var(--bg);
      color: var(--text);
      line-height: 1.6;
      padding: 2rem 1rem;
    }

    .container {
      max-width: 900px;
      margin: 0 auto;
      background: var(--card-bg);
      padding: 2.5rem;
      border-radius: 24px;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05);
      border: 1px solid var(--border);
    }

    .header {
      border-bottom: 2px solid #f1f5f9;
      padding-bottom: 1.5rem;
      margin-bottom: 2rem;
    }

    .badge {
      display: inline-block;
      padding: 0.25rem 0.75rem;
      background: #eff6ff;
      color: var(--primary);
      border: 1px solid #bfdbfe;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 800;
      margin-bottom: 0.5rem;
    }

    h1 { font-size: 1.75rem; font-weight: 900; }
    h2 { font-size: 1.2rem; font-weight: 800; margin-bottom: 1rem; color: #1e293b; }

    .card {
      background: #ffffff;
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 1.5rem;
      margin-bottom: 1.75rem;
    }

    .grid-3 {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1rem;
    }

    .course-box {
      background: #f8fafc;
      padding: 1.25rem;
      border-radius: 14px;
      border: 1px solid var(--border);
    }

    .course-tag {
      display: inline-block;
      font-size: 0.75rem;
      font-weight: 800;
      padding: 0.2rem 0.5rem;
      border-radius: 6px;
      margin-bottom: 0.5rem;
    }

    .concept-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
      gap: 1rem;
    }

    .concept-card {
      background: #f8fafc;
      padding: 1rem;
      border-radius: 12px;
      border: 1px solid var(--border);
    }

    .concept-title { font-weight: 800; font-size: 0.95rem; margin-bottom: 0.35rem; }
    .concept-desc { font-size: 0.85rem; color: #475569; }

    .footer {
      border-top: 1px solid var(--border);
      padding-top: 1.5rem;
      margin-top: 2rem;
      text-align: center;
      font-size: 0.75rem;
      color: var(--text-muted);
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <span class="badge">📘 교수자 자료실</span>
      <h1>[교사용] 머니트랙 시뮬레이션 수업 지도안 가이드</h1>
      <p style="font-size: 0.85rem; color: #64748b; margin-top: 0.35rem;">발행일시: ${dateStr} &bull; 작성자: 하나고등학교 일반사회 교사 김윤구</p>
    </div>

    <!-- 1. 차시별 운영안 -->
    <div class="card">
      <h2>⏱️ 교실 운영 시나리오 제안 (수업 활동안)</h2>
      <div class="grid-3">
        <div class="course-box">
          <span class="course-tag" style="background: #eff6ff; color: #2563eb;">15분 코스</span>
          <h3 style="font-size: 0.95rem; font-weight: 800; margin-bottom: 0.5rem;">핵심 체험 및 자율 성찰</h3>
          <ul style="font-size: 0.8rem; color: #475569; padding-left: 1rem;">
            <li><strong>0~3분:</strong> 프로그램 배경 설명 및 설정.</li>
            <li><strong>3~10분:</strong> 시뮬레이션 개별 플레이.</li>
            <li><strong>10~15분:</strong> 유형 분석 결과 확인 후 회고 작성.</li>
          </ul>
        </div>
        <div class="course-box">
          <span class="course-tag" style="background: #ecfdf5; color: #059669;">30분 코스</span>
          <h3 style="font-size: 0.95rem; font-weight: 800; margin-bottom: 0.5rem;">모둠 토론 및 리밸런싱 학습</h3>
          <ul style="font-size: 0.8rem; color: #475569; padding-left: 1rem;">
            <li><strong>0~5분:</strong> 자산군 위험/수익 관계 사전 지도.</li>
            <li><strong>5~18분:</strong> 시뮬레이션 및 돌발 이벤트 대처.</li>
            <li><strong>18~30분:</strong> 모둠별 결과 공유 및 비교 토론.</li>
          </ul>
        </div>
        <div class="course-box">
          <span class="course-tag" style="background: #f3e8ff; color: #9333ea;">50분 코스</span>
          <h3 style="font-size: 0.95rem; font-weight: 800; margin-bottom: 0.5rem;">종합 토론 및 발표 수업</h3>
          <ul style="font-size: 0.8rem; color: #475569; padding-left: 1rem;">
            <li><strong>0~10분:</strong> 생애주기 자산관리 개념 도입.</li>
            <li><strong>10~25분:</strong> 시뮬레이션 1회차 완주.</li>
            <li><strong>25~35분:</strong> 전략 수정 후 2회차 도전.</li>
            <li><strong>35~50분:</strong> 포트폴리오 및 고수익 사기 예방 종합 토론.</li>
          </ul>
        </div>
      </div>
    </div>

    <!-- 2. 핵심 개념 -->
    <div class="card">
      <h2>💡 수업 시 강조할 핵심 학습 개념</h2>
      <div class="concept-grid">
        <div class="concept-card">
          <div class="concept-title">🔄 복리 (Compound Interest)</div>
          <div class="concept-desc">돈이 스스로 돈을 버는 스노볼 효과. 종잣돈이 오랜 기간 유지될 때 자산이 기하급수적으로 증가함을 지도합니다.</div>
        </div>
        <div class="concept-card">
          <div class="concept-title">⚖️ 분산투자 (Diversification)</div>
          <div class="concept-desc">주식, 채권, 예적금 등 여러 자산에 나누어 담아 비체계적 위험을 소멸시키는 가치를 학습합니다.</div>
        </div>
        <div class="concept-card">
          <div class="concept-title">📈 위험과 수익 (Risk and Return)</div>
          <div class="concept-desc">기대수익이 높을수록 큰 위험을 감수해야 하며, 원금 보장 고수익 상품은 존재하지 않음을 인지시킵니다.</div>
        </div>
        <div class="concept-card">
          <div class="concept-title">💧 유동성 (Liquidity)</div>
          <div class="concept-desc">비상금 부족 시 만기 예금이나 손실 난 ETF를 손절해야 하므로 비상금 확보가 필수적임을 파악합니다.</div>
        </div>
        <div class="concept-card">
          <div class="concept-title">💸 인플레이션 (Inflation)</div>
          <div class="concept-desc">현금만 쥐고 있으면 물가 상승 시 실질 구매력이 떨어져 가만히 있어도 손실이 발생함을 경험시킵니다.</div>
        </div>
        <div class="concept-card">
          <div class="concept-title">🚫 고수익 사기 경계 (Anti-Fraud)</div>
          <div class="concept-desc">보이스피싱, 폰지 사기, 테마주 뇌동매매 등 위험 금융 함정에 대처하는 금융 면역력을 기릅니다.</div>
        </div>
      </div>
    </div>

    <!-- 3. 발문 예시 -->
    <div class="card" style="background: #faf5ff; border-color: #e9d5ff;">
      <h2 style="color: #7e22ce;">💬 심화 토론 발문 예시</h2>
      <ul style="font-size: 0.85rem; color: #4c1d95; padding-left: 1.25rem; line-height: 1.8;">
        <li>"금리 인상 소식이 나왔을 때 주식을 계속 들고 있었던 모둠원과 안전자산으로 바꾼 모둠원의 자산은 결과적으로 어떻게 달라졌나요?"</li>
        <li>"친구의 테마주 추천에 응했던 사람들은 왜 폭락 시에 리밸런싱이나 물타기 유혹에 쉽게 빠졌을까요?"</li>
        <li>"실생활에서 비상금 쿠션(입출금 통장 분량)은 어느 정도로 떼어놓는 것이 안전할까요?"</li>
      </ul>
    </div>

    <div class="footer">
      <div>Copyright 2026. 하나고등학교 일반사회 교사 김윤구 All Right Reserved. (veblen@hana.hs.kr)</div>
      <div>머니트랙: 20년 자산관리 실험실 교사용 가이드</div>
    </div>
  </div>
</body>
</html>`;

  downloadHtmlFile('머니트랙_교사용_수업지도안.html', htmlContent);
}
