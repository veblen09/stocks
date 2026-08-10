/**
 * 만 원 단위의 숫자를 한국 통화 표기법(억, 만 원)으로 포맷팅합니다.
 * 예: 1000 -> 1,000만 원
 *     12500 -> 1억 2,500만 원
 *     10000 -> 1억 원
 */
export function formatMoney(valueInManWon: number): string {
  const rounded = Math.round(valueInManWon);
  if (rounded === 0) return '0원';
  if (rounded < 0) return `-${formatMoney(Math.abs(rounded))}`;

  const eok = Math.floor(rounded / 10000);
  const man = rounded % 10000;

  let result = '';
  if (eok > 0) {
    result += `${eok.toLocaleString()}억`;
  }
  
  if (man > 0) {
    result += eok > 0 ? ` ${man.toLocaleString()}만 원` : `${man.toLocaleString()}만 원`;
  } else {
    result += ' 원';
  }

  return result.trim();
}

/**
 * 퍼센트 표기 유틸리티
 */
export function formatPercent(value: number): string {
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
}
