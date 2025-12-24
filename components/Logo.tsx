import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  variant?: 'light' | 'dark';
}

export const Logo: React.FC<LogoProps> = ({ size = 'md', className = '', variant = 'dark' }) => {
  const sizeMap = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24',
  };

  const glowColor = variant === 'dark' ? 'rgba(0, 180, 216, 0.4)' : 'rgba(255, 255, 255, 0.2)';

  return (
    <div className={`relative flex items-center justify-center ${sizeMap[size]} ${className}`}>
      {/* Dynamic Background Glow */}
      <div 
        className="absolute inset-0 rounded-2xl blur-xl animate-pulse" 
        style={{ backgroundColor: glowColor, opacity: 0.6 }}
      ></div>
      
      {/* 3D Layered Base */}
      <div className={`absolute inset-0 rounded-2xl transform rotate-6 transition-transform group-hover:rotate-12 duration-500 shadow-2xl ${
        variant === 'dark' 
          ? 'bg-gradient-to-br from-brand-accent via-brand-accent/80 to-brand-navy border border-white/20' 
          : 'bg-white border border-slate-200'
      }`}>
        <div className="absolute inset-0.5 rounded-xl bg-black/10 backdrop-blur-[2px]"></div>
      </div>

      {/* The Geometric 'Z' Symbol */}
      <svg 
        viewBox="0 0 100 100" 
        className={`relative z-10 w-[65%] h-[65%] drop-shadow-lg ${variant === 'dark' ? 'text-brand-navy' : 'text-brand-navy'}`}
        fill="currentColor"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path 
          d="M20 25C20 22.2386 22.2386 20 25 20H75C77.7614 20 80 22.2386 80 25V35C80 37.7614 77.7614 40 75 40H45L80 70V75C80 77.7614 77.7614 80 75 80H25C22.2386 80 20 77.7614 20 75V65C20 62.2386 22.2386 60 25 60H55L20 30V25Z" 
          fill="currentColor"
        />
        {/* Specular Highlight Path */}
        <path 
          d="M25 20H75L45 40H25L25 20Z" 
          fill="white" 
          fillOpacity="0.2"
        />
      </svg>
      
      {/* Outer Rim Light */}
      <div className="absolute inset-0 rounded-2xl border border-white/30 pointer-events-none"></div>
    </div>
  );
};