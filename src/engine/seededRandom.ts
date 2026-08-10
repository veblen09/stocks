export class SeededRandom {
  private seed: number;

  constructor(seed: number) {
    // 0이 들어올 경우 처리
    this.seed = seed <= 0 ? 12345 : seed;
  }

  /**
   * 0~1 사이의 의사 난수 반환
   */
  next(): number {
    const x = Math.sin(this.seed++) * 10000;
    return x - Math.floor(x);
  }

  /**
   * min ~ max 사이의 난수 반환
   */
  range(min: number, max: number): number {
    return min + this.next() * (max - min);
  }

  /**
   * Box-Muller 변환을 이용한 정규분포 난수 발생
   * 주식 등의 자산 수익률은 정규분포 또는 로그정규분포를 따르므로
   * 시뮬레이션의 현실성을 높이기 위해 사용합니다.
   */
  normal(mean: number, stdDev: number): number {
    let u1 = this.next();
    let u2 = this.next();
    
    // 0이 되는 것을 방지
    if (u1 === 0) u1 = 0.0001;
    if (u2 === 0) u2 = 0.0001;
    
    const randStdNormal = Math.sqrt(-2.0 * Math.log(u1)) * Math.sin(2.0 * Math.PI * u2);
    return mean + stdDev * randStdNormal;
  }

  /**
   * 배열에서 무작위 요소 추출
   */
  choice<T>(array: T[]): T {
    const index = Math.floor(this.next() * array.length);
    return array[index];
  }
}
