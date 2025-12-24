
import React, { forwardRef } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({ label, error, className = '', ...props }, ref) => {
  return (
    <div className="flex flex-col gap-2 w-full">
      {label && <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">{label}</label>}
      <div className="relative">
        <input 
          ref={ref}
          className={`w-full px-5 py-4 bg-white border rounded-2xl text-slate-900 font-semibold placeholder:text-slate-300 placeholder:font-medium focus:outline-none transition-all duration-300 ${error ? 'border-rose-300 ring-4 ring-rose-50' : 'border-slate-200'} ${className}`}
          {...props}
        />
        {error && <span className="absolute -bottom-5 left-1 text-[10px] text-rose-500 font-black uppercase tracking-wider">{error}</span>}
      </div>
    </div>
  );
});

Input.displayName = 'Input';
