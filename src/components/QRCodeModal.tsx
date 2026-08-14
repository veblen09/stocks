import React, { useState, useEffect } from 'react';
import { X, Copy, Check, QrCode, ExternalLink, Globe, AlertCircle, Edit2 } from 'lucide-react';

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const QRCodeModal: React.FC<QRCodeModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [baseUrl, setBaseUrl] = useState<string>('https://moneytrack.vercel.app');
  const [isEditingUrl, setIsEditingUrl] = useState<boolean>(false);
  const [tempUrl, setTempUrl] = useState<string>('');
  const [isLocalhost, setIsLocalhost] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const origin = window.location.origin;
      const isLocal = origin.includes('localhost') || origin.includes('127.0.0.1');
      setIsLocalhost(isLocal);

      // localhost 접속 시에는 스마트폰에서 열 수 있는 Vercel 실사용 기본 도메인으로 설정
      if (isLocal) {
        setBaseUrl('https://moneytrack.vercel.app');
      } else {
        setBaseUrl(origin);
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // 도메인 끝에 / 제거 후 ?app=true 결합
  const cleanBaseUrl = baseUrl.replace(/\/+$/, '');
  const qrAppUrl = `${cleanBaseUrl}/?app=true`;

  // QRServer API를 활용하여 300x300 고화질 QR 코드 생성
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrAppUrl)}&color=0f172a&bgcolor=ffffff`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(qrAppUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveCustomUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (tempUrl.trim()) {
      let formatted = tempUrl.trim();
      if (!formatted.startsWith('http://') && !formatted.startsWith('https://')) {
        formatted = `https://${formatted}`;
      }
      setBaseUrl(formatted);
      setIsEditingUrl(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-indigo-500/40 rounded-3xl p-6 max-w-sm w-full text-white shadow-2xl relative overflow-hidden text-center">
        {/* 배경 은은한 빛 */}
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-indigo-500/20 rounded-full blur-2xl pointer-events-none" />

        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1.5 rounded-full hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="inline-flex p-3 bg-gradient-to-tr from-indigo-600 to-purple-600 rounded-2xl shadow-md mb-3">
          <QrCode className="w-7 h-7 text-white" />
        </div>

        <h3 className="text-xl font-extrabold text-white tracking-tight">
          📱 스마트폰 어플 전용 QR 코드
        </h3>
        <p className="text-xs text-indigo-200 mt-1 mb-3 leading-relaxed">
          스마트폰 카메라인으로 이 QR 코드를 스캔하면<br />
          <strong className="text-amber-300 font-bold">어플 모드(?app=true)</strong>로 즉시 접속됩니다.
        </p>

        {/* 로컬호스트 안내 경고 뱃지 */}
        {isLocalhost && (
          <div className="bg-amber-500/10 border border-amber-500/30 text-amber-300 p-2 rounded-xl text-[11px] mb-3 flex items-start space-x-1.5 text-left">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>
              <strong>안내:</strong> 현재 PC 테스트(localhost) 중이므로 스마트폰에서 스캔 가능하도록 <strong>Vercel 실서버 주소</strong>로 QR이 생성되었습니다.
            </span>
          </div>
        )}

        {/* QR 코드 이미지 액자 */}
        <div className="bg-white p-3.5 rounded-2xl shadow-xl inline-block border-4 border-indigo-500/30 mb-3 group relative">
          <img
            src={qrImageUrl}
            alt="MoneyTrack App Mode QR Code"
            className="w-48 h-48 object-contain mx-auto rounded-lg"
          />
          <div className="absolute inset-0 bg-indigo-900/5 rounded-2xl pointer-events-none" />
        </div>

        {/* 주소 복사 및 Vercel 도메인 변경 영역 */}
        <div className="bg-slate-800/80 border border-slate-700 p-2.5 rounded-xl space-y-2 mb-4 text-xs">
          {!isEditingUrl ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1.5 truncate max-w-[210px] text-left">
                <Globe className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                <span className="text-slate-300 font-mono truncate text-[11px]">
                  {qrAppUrl}
                </span>
              </div>
              <div className="flex items-center space-x-1 flex-shrink-0">
                <button
                  onClick={() => {
                    setTempUrl(baseUrl);
                    setIsEditingUrl(true);
                  }}
                  title="Vercel 주소 직접 수정"
                  className="p-1 text-slate-400 hover:text-white bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
                >
                  <Edit2 className="w-3 h-3" />
                </button>
                <button
                  onClick={handleCopyLink}
                  className="flex items-center space-x-1 bg-indigo-600 hover:bg-indigo-500 text-white px-2 py-1 rounded-lg font-bold text-[11px] transition-colors"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-300" /> : <Copy className="w-3 h-3" />}
                  <span>{copied ? '복사됨' : '복사'}</span>
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSaveCustomUrl} className="space-y-2">
              <div className="text-[11px] text-indigo-300 text-left font-semibold">
                Vercel 도메인 주소 직접 입력:
              </div>
              <div className="flex space-x-1.5">
                <input
                  type="text"
                  value={tempUrl}
                  onChange={(e) => setTempUrl(e.target.value)}
                  placeholder="https://내-프로젝트.vercel.app"
                  className="flex-1 bg-slate-900 border border-indigo-500/50 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-400 font-mono"
                />
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-2.5 py-1 rounded-lg text-xs font-bold"
                >
                  저장
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditingUrl(false)}
                  className="bg-slate-700 hover:bg-slate-600 text-slate-300 px-2 py-1 rounded-lg text-xs"
                >
                  취소
                </button>
              </div>
            </form>
          )}
        </div>

        <div className="flex space-x-2">
          <a
            href={qrAppUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold py-2.5 rounded-xl text-xs flex items-center justify-center space-x-1 transition-colors"
          >
            <span>어플 모드 미리보기</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
          <button
            onClick={onClose}
            className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold py-2.5 rounded-xl text-xs transition-all shadow-md"
          >
            확인 (닫기)
          </button>
        </div>
      </div>
    </div>
  );
};
