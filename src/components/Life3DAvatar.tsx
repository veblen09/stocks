import React from 'react';
import { useGame } from '../store/gameStore';
import { AnimatedCharacterGuide } from './AnimatedCharacterGuide';

export const Life3DAvatar: React.FC = () => {
  const { state } = useGame();
  const { currentAge } = state;

  // 생애 단계 판별 및 상세 안내 문구 (25세, 30세, 35세, 45세, 55세, 65세 구간 적용)
  let stageTitle = '사회초년생 (20대)';
  let stageDesc = '사회 초년생으로서 적극적으로 시드머니를 마련하고 기초 투자를 배웁니다.';

  if (currentAge >= 65) {
    stageTitle = '은퇴 생활 (60대 이상)';
    stageDesc = '안정적인 연금 소득과 안전자산의 인출 계획을 세우며 풍요롭고 건강한 노후 생활을 영위합니다.';
  } else if (currentAge >= 55) {
    stageTitle = '은퇴 준비 (50대~60대)';
    stageDesc = '은퇴가 임박한 시기로, 자산을 안전자산 및 개인연금(IRP) 위주로 안정되게 재배분하여 노후를 대비합니다.';
  } else if (currentAge >= 45) {
    stageTitle = '가족 재무관리 (40대~50대)';
    stageDesc = '소득이 정점에 달하지만 자녀 교육비 및 가계 소비도 극대화되는 시기이므로 철저한 포트폴리오 관리가 필요합니다.';
  } else if (currentAge >= 35) {
    stageTitle = '자녀 등장 (30대~40대)';
    stageDesc = '자녀 출산 및 양육으로 인해 소비가 급증하므로, 비상금 쿠션 확보와 위험 자산 비중 조율이 필수가 됩니다.';
  } else if (currentAge >= 30) {
    stageTitle = '배우자 등장 (30대)';
    stageDesc = '결혼으로 인해 가족이 형성되며, 내 집 마련 및 공동의 장기 재무 목표를 위해 포트폴리오를 설계합니다.';
  }

  return (
    <AnimatedCharacterGuide
      mood="idle"
      title={stageTitle}
      subtitle="생애주기별 자산 가이드"
      message={stageDesc}
      className="h-full border-slate-100/70"
      age={currentAge}
      useSprite={true}
    />
  );
};
