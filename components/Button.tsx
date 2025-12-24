import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  size = 'md',
  isLoading, 
  className = '', 
  ...props 
}) => {
  const baseStyles = "rounded-2xl font-black uppercase tracking-widest text-[11px] transition-all duration-300 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95";
  
  const variants = {
    primary: "bg-brand-navy text-white hover:bg-brand-accent hover:text-brand-navy shadow-xl shadow-brand-navy/10",
    secondary: "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 shadow-sm",
    danger: "bg-rose-500 text-white hover:bg-rose-600 shadow-xl shadow-rose-500/10",
    ghost: "text-slate-500 hover:bg-slate-100 font-bold"
  };

  const sizes = {
    sm: "px-5 py-2.5",
    md: "px-7 py-4",
    lg: "px-10 py-5 text-xs"
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading ? (
        <span className="w-4 h-4 border-3 border-current border-t-transparent rounded-full animate-spin"></span>
      ) : children}
    </button>
  );
};
