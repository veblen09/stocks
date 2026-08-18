/**
 * Korean Currency & Percentage Formatting Utilities
 */

/**
 * Formats a KRW amount into Korean units (조, 억, 만 원)
 * e.g. 10000000 -> 1,000만 원
 *      125000000 -> 1억 2,500만 원
 *      36216702407 -> 362억 1,670만 원
 */
export function formatKRW(amount: number): string {
  if (!isFinite(amount) || isNaN(amount)) return '0원';
  const rounded = Math.round(amount);
  if (rounded === 0) return '0원';
  if (rounded < 0) return `-${formatKRW(Math.abs(rounded))}`;

  const absVal = Math.abs(rounded);
  const jo = Math.floor(absVal / 1000000000000);
  const eok = Math.floor((absVal % 1000000000000) / 100000000);
  const man = Math.floor((absVal % 100000000) / 10000);
  const won = absVal % 10000;

  const parts: string[] = [];
  if (jo > 0) parts.push(`${jo.toLocaleString()}조`);
  if (eok > 0) parts.push(`${eok.toLocaleString()}억`);
  if (man > 0 && jo === 0) parts.push(`${man.toLocaleString()}만`);
  if (parts.length === 0) return `${won.toLocaleString()}원`;

  return `${parts.join(' ')} 원`;
}

/**
 * Simple formatted won with commas
 */
export function formatWonNumber(amount: number): string {
  if (!isFinite(amount) || isNaN(amount)) return '0';
  return Math.round(amount).toLocaleString();
}

/**
 * Formats percentage rate
 * @param rate 0.152 -> "+15.20%"
 * @param asPercentage if false (rate is decimal e.g. 0.15), multiplies by 100
 */
export function formatPercent(rate: number, asPercentage = false): string {
  if (!isFinite(rate) || isNaN(rate)) return '0.00%';
  const val = asPercentage ? rate : rate * 100;
  const sign = val > 0.0001 ? '+' : '';
  return `${sign}${val.toFixed(2)}%`;
}

/**
 * Returns color class for return / profit
 */
export function getReturnColor(rate: number): string {
  if (rate > 0.0001) return 'text-rose-600'; // Korean market convention: Red is UP
  if (rate < -0.0001) return 'text-blue-600'; // Korean market convention: Blue is DOWN
  return 'text-slate-600';
}

export function getReturnBgColor(rate: number): string {
  if (rate > 0.0001) return 'bg-rose-50 text-rose-700 border-rose-200';
  if (rate < -0.0001) return 'bg-blue-50 text-blue-700 border-blue-200';
  return 'bg-slate-50 text-slate-700 border-slate-200';
}
