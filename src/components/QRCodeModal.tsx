import React, { useState } from 'react';
import { X, Copy, Check, QrCode, ExternalLink } from 'lucide-react';

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const QRCodeModal: React.FC<QRCodeModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  // 현재 브라우저의 도메인(Vercel 주소 또는 현재 접속 주소) 뒤에 ?app=true 추가
  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://monytrack.vercel.app';
  const qrAppUrl = `${currentOrigin}/?app=true`;

  // QRServer API를 활용하여 300x300 고화질 QR 코드 생성
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrAppUrl)}&color=0f172a&bgcolor=ffffff`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(qrAppUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
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
          📱 학생 / 모바일 어플 전용 QR 코드
        </h3>
        <p className="text-xs text-indigo-200 mt-1 mb-4 leading-relaxed">
          스마트폰 카메라인으로 이 QR 코드를 스캔하면<br />
          <strong className="text-amber-300 font-bold">어플 모드(?app=true)</strong>로 즉시 연결됩니다.
        </p>

        {/* QR 코드 이미지 액자 */}
        <div className="bg-white p-4 rounded-2xl shadow-xl inline-block border-4 border-indigo-500/30 mb-4 group relative">
          <img
            src={qrImageUrl}
            alt="MonyTrack App Mode QR Code"
            className="w-52 h-52 object-contain mx-auto rounded-lg"
          />
          <div className="absolute inset-0 bg-indigo-900/10 rounded-2xl pointer-events-none" />
        </div>

        {/* 주소 복사 및 링크 */}
        <div className="bg-slate-800/80 border border-slate-700 p-2.5 rounded-xl flex items-center justify-between text-xs mb-5">
          <span className="text-slate-300 font-mono truncate max-w-[200px] text-[11px]">
            {qrAppUrl}
          </span>
          <button
            onClick={handleCopyLink}
            className="flex items-center space-x-1 bg-indigo-600 hover:bg-indigo-500 text-white px-2.5 py-1 rounded-lg font-bold text-[11px] transition-colors flex-shrink-0"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-300" />
                <span>복사됨</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>복사</span>
              </>
            )}
          </button>
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
