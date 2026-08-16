import React from 'react';

interface HeroBackgroundProps {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  children?: React.ReactNode;
  height?: string;
  align?: 'left' | 'center';
  overlay?: 'light' | 'blue' | 'dark';
  className?: string;
}

export const HeroBackground: React.FC<HeroBackgroundProps> = ({
  title,
  subtitle,
  children,
  height = 'min-h-screen',
  align = 'left',
  overlay = 'light',
  className = '',
}) => {
  const overlayStyles = {
    light: 'bg-gradient-to-r from-white/95 via-white/80 to-blue-50/20 sm:from-white/90 sm:via-white/70 sm:to-blue-100/30',
    blue: 'bg-gradient-to-r from-blue-950/90 via-blue-900/70 to-blue-800/10',
    dark: 'bg-gradient-to-r from-slate-950/95 via-slate-900/80 to-blue-950/20',
  };

  const alignStyles = {
    left: 'text-left justify-start items-start',
    center: 'text-center justify-center items-center',
  };

  return (
    <div
      className={`relative w-full overflow-hidden bg-cover bg-[position:center_right] sm:bg-center bg-no-repeat transition-all duration-300 ${height} ${className}`}
      style={{ backgroundImage: "url('./images/finance-hero-bg.png')" }}
    >
      {/* Semi-transparent Overlay */}
      <div className={`absolute inset-0 z-0 transition-opacity duration-300 ${overlayStyles[overlay]}`} />

      {/* Content wrapper */}
      <div className={`relative z-10 w-full h-full flex flex-col p-6 sm:p-8 md:p-12 ${alignStyles[align]}`}>
        {(title || subtitle) && (
          <div className={`max-w-2xl mb-4 ${align === 'center' ? 'mx-auto' : ''}`}>
            {title && (
              <h1 className={`text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight ${overlay === 'light' ? 'text-slate-900' : 'text-white'}`}>
                {title}
              </h1>
            )}
            {subtitle && (
              <p className={`mt-2 text-xs sm:text-sm md:text-base font-medium leading-relaxed ${overlay === 'light' ? 'text-slate-500' : 'text-white/80'}`}>
                {subtitle}
              </p>
            )}
          </div>
        )}
        {children}
      </div>
    </div>
  );
};
