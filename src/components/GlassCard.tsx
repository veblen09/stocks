import React from 'react';

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: 'default' | 'strong' | 'subtle';
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className = '',
  variant = 'default',
  ...props
}) => {
  const baseStyles = 'backdrop-blur-xl border rounded-3xl transition-all duration-300';
  
  const variants = {
    default: 'bg-white/80 border-white/60 shadow-xl',
    strong: 'bg-white/90 border-white/80 shadow-2xl',
    subtle: 'bg-white/50 border-white/30 shadow-lg',
  };

  return (
    <div
      className={`${baseStyles} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
