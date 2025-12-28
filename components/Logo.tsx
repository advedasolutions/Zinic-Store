import React from 'react';

interface LogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  variant?: 'light' | 'dark';
}

export const Logo: React.FC<LogoProps> = ({ size = 'md', className = '' }) => {
  const sizeMap = {
    xs: 'h-6',
    sm: 'h-8',
    md: 'h-10',
    lg: 'h-20',
    xl: 'h-32',
  };

  return (
    <div className={`relative flex items-center justify-center transition-transform active:scale-95 ${className}`}>
      <img 
        src="https://i.ibb.co/HDHtN1n9/Zinic-Logo.png" 
        alt="Zinic Logo" 
        className={`${sizeMap[size]} w-auto object-contain filter drop-shadow-sm select-none`}
      />
      {size === 'xl' && (
        <div className="absolute -bottom-6 flex flex-col items-center">
          <div className="h-0.5 w-12 bg-brand-accent rounded-full opacity-50 mb-1"></div>
          <span className="text-[10px] font-black text-brand-accent uppercase tracking-[0.4em] ml-1">Intelligence</span>
        </div>
      )}
    </div>
  );
};