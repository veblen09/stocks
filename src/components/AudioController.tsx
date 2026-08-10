import React, { useState, useEffect, useRef } from 'react';
import { audioManager, type AudioSettings } from '../utils/audioManager';
import { GlassCard } from './GlassCard';
import { Volume2, Volume1, VolumeX, Settings, Music, HelpCircle } from 'lucide-react';

export const AudioController: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [settings, setSettings] = useState<AudioSettings>(() => audioManager.getSettings());
  const [trackName, setTrackName] = useState(audioManager.getTrackName());
  const [currentTrackIndex, setCurrentTrackIndex] = useState(audioManager.getCurrentTrackIndex());
  
  const menuRef = useRef<HTMLDivElement>(null);
  const trackList = audioManager.getTrackList();

  // 컴포넌트 마운트 시 설정값 반영
  useEffect(() => {
    setSettings(audioManager.getSettings());
    setTrackName(audioManager.getTrackName());
    setCurrentTrackIndex(audioManager.getCurrentTrackIndex());
  }, []);

  // 외부 클릭 시 패널 닫기
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleToggleBgm = (enable: boolean) => {
    const newSettings = { ...settings, bgmEnabled: enable };
    setSettings(newSettings);
    audioManager.setSettings(newSettings);
    audioManager.playSound('click');
    setTrackName(audioManager.getTrackName());
    setCurrentTrackIndex(audioManager.getCurrentTrackIndex());
  };

  const handleToggleSfx = () => {
    const newSettings = { ...settings, sfxEnabled: !settings.sfxEnabled };
    setSettings(newSettings);
    audioManager.setSettings(newSettings);
    if (newSettings.sfxEnabled) {
      audioManager.playSound('click');
    }
  };

  const handleVolumeChange = (key: 'masterVolume' | 'bgmVolume' | 'sfxVolume', val: number) => {
    const newSettings = { ...settings, [key]: val };
    setSettings(newSettings);
    audioManager.setSettings(newSettings);
  };

  const getVolumeIcon = () => {
    const totalVolume = settings.masterVolume;
    if (!settings.sfxEnabled && !settings.bgmEnabled) return <VolumeX size={16} />;
    if (totalVolume === 0) return <VolumeX size={16} />;
    if (totalVolume < 0.4) return <Volume1 size={16} />;
    return <Volume2 size={16} />;
  };

  // 배경음악 변경 선택 처리
  const handleTrackChange = (index: number) => {
    audioManager.playSound('click');
    audioManager.playTrack(index);
    setTrackName(audioManager.getTrackName());
    setCurrentTrackIndex(index);
    if (!settings.bgmEnabled) {
      handleToggleBgm(true);
    }
  };

  const handlePlayNext = () => {
    audioManager.playSound('click');
    audioManager.playNextBgm();
    setTrackName(audioManager.getTrackName());
    setCurrentTrackIndex(audioManager.getCurrentTrackIndex());
    if (!settings.bgmEnabled) {
      handleToggleBgm(true);
    }
  };

  return (
    <div ref={menuRef} className="fixed top-4 right-4 z-40 select-none no-print">
      {/* 플로팅 볼륨 조절 버튼 */}
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          audioManager.playSound('click');
          setTrackName(audioManager.getTrackName());
          setCurrentTrackIndex(audioManager.getCurrentTrackIndex());
        }}
        className="w-10 h-10 bg-white/80 backdrop-blur-md rounded-2xl border border-slate-200 shadow-md hover:bg-slate-50 transition flex items-center justify-center text-slate-600 active:scale-95 cursor-pointer"
        aria-label="오디오 및 소리 설정 메뉴 열기"
        title="오디오 설정"
      >
        {isOpen ? <Settings size={18} className="animate-spin-slow" /> : getVolumeIcon()}
      </button>

      {/* 사운드 믹서 패널 */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 shadow-2xl">
          <GlassCard className="p-4 border-slate-200/60 flex flex-col gap-4 text-xs font-semibold text-slate-650" variant="strong">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="font-bold text-slate-800 flex items-center gap-1.5">
                🎛️ 사운드 믹서
              </span>
              <span className="text-[10px] text-slate-400 font-bold">BGM 설정</span>
            </div>

            {/* 마스터 볼륨 */}
            <div className="space-y-1">
              <div className="flex justify-between font-bold">
                <span className="flex items-center gap-1 text-slate-700">전체 볼륨</span>
                <span>{Math.round(settings.masterVolume * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={settings.masterVolume}
                onChange={(e) => handleVolumeChange('masterVolume', parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-100 rounded-lg cursor-pointer accent-blue-600"
                aria-label="전체 볼륨 조절"
              />
            </div>

            {/* BGM 및 볼륨 */}
            <div className="space-y-2 pt-1 border-t border-slate-50">
              <div className="flex items-center justify-between">
                <label htmlFor="bgm-toggle" className="flex items-center gap-1.5 cursor-pointer font-bold text-slate-700">
                  <Music size={13} className="text-blue-500" /> 클래식 배경음악
                </label>
                <input
                  id="bgm-toggle"
                  type="checkbox"
                  checked={settings.bgmEnabled}
                  onChange={(e) => handleToggleBgm(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500 cursor-pointer"
                />
              </div>

              {settings.bgmEnabled && (
                <div className="space-y-2.5 pl-1.5">
                  <div className="space-y-2 bg-slate-50 p-2 rounded-xl border border-slate-100">
                    <div className="flex justify-between text-[9.5px] text-slate-400 font-medium">
                      <span>BGM 소리 크기</span>
                      <span>{Math.round(settings.bgmVolume * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={settings.bgmVolume}
                      onChange={(e) => handleVolumeChange('bgmVolume', parseFloat(e.target.value))}
                      className="w-full h-1 bg-slate-100 rounded cursor-pointer accent-blue-500"
                      aria-label="배경음악 볼륨 조절"
                    />
                  </div>

                  {/* 클래식 트랙 선택 드롭다운 */}
                  <div className="flex flex-col gap-1 mt-1 text-left">
                    <span className="text-[9.5px] text-slate-400 font-extrabold">🎵 BGM 클래식 변경</span>
                    <select
                      value={currentTrackIndex}
                      onChange={(e) => handleTrackChange(parseInt(e.target.value))}
                      className="w-full p-1.5 text-[10px] border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 font-bold bg-white cursor-pointer"
                    >
                      {trackList.map((name, index) => (
                        <option key={index} value={index}>{name}</option>
                      ))}
                    </select>
                  </div>

                  <button
                    onClick={handlePlayNext}
                    className="w-full py-1.5 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-200 text-[10px] text-slate-650 hover:text-blue-700 rounded-lg font-extrabold active:scale-[0.97] transition cursor-pointer flex items-center justify-center gap-1"
                  >
                    ⏭️ 다음 클래식 곡 재생
                  </button>

                  {/* 재생 중인 곡 이름 */}
                  <div className="text-[9.5px] text-slate-500 font-bold bg-slate-100 p-1.5 rounded-lg truncate text-left">
                    🎵 {trackName}
                  </div>
                </div>
              )}
            </div>

            {/* 효과음 및 볼륨 */}
            <div className="space-y-1.5 pt-1 border-t border-slate-50">
              <div className="flex items-center justify-between">
                <label htmlFor="sfx-toggle" className="flex items-center gap-1.5 cursor-pointer font-bold text-slate-700">
                  <Volume2 size={13} className="text-emerald-500" /> 학습 효과음 SFX
                </label>
                <input
                  id="sfx-toggle"
                  type="checkbox"
                  checked={settings.sfxEnabled}
                  onChange={handleToggleSfx}
                  className="w-4 h-4 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500 cursor-pointer"
                />
              </div>

              {settings.sfxEnabled && (
                <div className="space-y-1 pl-4">
                  <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                    <span>효과음 소리 크기</span>
                    <span>{Math.round(settings.sfxVolume * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={settings.sfxVolume}
                    onChange={(e) => handleVolumeChange('sfxVolume', parseFloat(e.target.value))}
                    className="w-full h-1 bg-slate-100 rounded cursor-pointer accent-emerald-500"
                    aria-label="효과음 볼륨 조절"
                  />
                </div>
              )}
            </div>

            {/* 안내 */}
            <div className="text-[9px] text-slate-400 font-bold leading-relaxed border-t border-slate-100 pt-2 flex items-center gap-1">
              <HelpCircle size={10} /> 
              <span>곡을 선택하면 해당 클래식 음악이 바로 재생됩니다.</span>
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  );
};
