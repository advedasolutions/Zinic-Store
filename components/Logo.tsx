
import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  variant?: 'light' | 'dark';
}

export const Logo: React.FC<LogoProps> = ({ size = 'md', className = '' }) => {
  const sizeMap = {
    sm: 'h-8',
    md: 'h-10',
    lg: 'h-20',
    xl: 'h-32',
  };

  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <img 
        src="https://i.ibb.co/HDHtN1n9/Zinic-Logo.png" 
        alt="Zinic Logo" 
        className={`${sizeMap[size]} w-auto object-contain filter drop-shadow-sm`}
      />
    </div>
  );
};
