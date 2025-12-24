import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { store } from '../services/mockStore';
import { ICONS, APP_NAME } from '../constants';
import { Logo } from './Logo';
import { UserRole } from '../types';
import { Wifi, WifiOff, Database, CloudOff, LogOut, Menu, X } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  currentPage: string;
  onNavigate: (page: string) => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, currentPage, onNavigate }) => {
  const { session, logout } = useAuth();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [dbStatus, setDbStatus] = useState(store.getDbStatus());
  
  const isSuperAdmin = session?.user?.role === UserRole.SUPERADMIN;

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    const unsubscribe = store.subscribe(() => {
      setDbStatus(store.getDbStatus());
    });

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      unsubscribe();
    };
  }, []);

  const menuItems = isSuperAdmin ? [
    { id: 'superadmin', label: 'Network', icon: ICONS.Dashboard },
    { id: 'settings', label: 'Settings', icon: ICONS.Settings },
  ] : [
    { id: 'dashboard', label: 'Dashboard', icon: ICONS.Dashboard },
    { id: 'inventory', label: 'Items', icon: ICONS.Inventory },
    { id: 'requests', label: 'Orders', icon: ICONS.Requests },
    { id: 'reports', label: 'Analytics', icon: ICONS.Report },
    { id: 'users', label: "User's", icon: ICONS.Users },
    { id: 'vendors', label: 'Vendors', icon: ICONS.Truck },
    { id: 'support', label: 'Support', icon: ICONS.Support },
    { id: 'settings', label: 'More', icon: ICONS.Settings },
  ];

  return (
    <div className="min-h-screen flex flex-col lg:flex-row w-full overflow-x-hidden bg-[#f8fafc] selection:bg-brand-accent selection:text-brand-navy">
      {/* DESKTOP SIDEBAR */}
      <aside className="hidden lg:flex w-80 glass-dark text-white fixed top-0 left-0 bottom-0 z-[100] flex-col overflow-hidden shadow-2xl">
        <div className="h-44 flex flex-col justify-center px-10">
          <div className="flex items-center group cursor-pointer" onClick={() => onNavigate(isSuperAdmin ? 'superadmin' : 'dashboard')}>
            <Logo size="md" />
            <div className="ml-5">
              <span className="text-2xl font-black tracking-tighter text-white block leading-none">{APP_NAME}</span>
              <span className="text-[8px] font-bold text-brand-accent tracking-[0.4em] uppercase opacity-80 mt-1 block">PLATFORM</span>
            </div>
          </div>
          
          <div className="mt-6 px-4 py-3 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-400' : 'bg-rose-400'}`}></div>
              <span className="text-[9px] font-black uppercase tracking-widest text-white/40">Link Integrity</span>
            </div>
            <span className={`text-[9px] font-black uppercase ${isOnline ? 'text-emerald-400' : 'text-rose-400'}`}>
              {isOnline ? 'Active' : 'Broken'}
            </span>
          </div>
        </div>

        <div className="flex-1 px-6 py-4 space-y-1 overflow-y-auto no-scrollbar">
          {menuItems.map(item => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-[11px] font-black transition-all duration-300 uppercase tracking-widest ${
                currentPage === item.id 
                  ? 'bg-brand-accent text-brand-navy shadow-lg scale-[1.02]' 
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <span className="shrink-0">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </div>

        <div className="p-8 border-t border-white/5 bg-black/10">
          <button 
            onClick={logout} 
            className="w-full flex items-center justify-center gap-3 px-4 py-4 rounded-2xl text-[10px] font-black bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white transition-all border border-rose-500/20 uppercase tracking-widest"
          >
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </aside>

      {/* MOBILE HEADER */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-brand-navy/98 backdrop-blur-xl text-white z-[150] flex items-center justify-between px-6 shadow-2xl border-b border-white/5">
        <div className="flex items-center gap-3" onClick={() => onNavigate(isSuperAdmin ? 'superadmin' : 'dashboard')}>
          <Logo size="sm" />
          <span className="text-xl font-black tracking-tighter">{APP_NAME}</span>
        </div>
        <div className="bg-white/5 px-3 py-1.5 rounded-xl border border-white/10 flex items-center gap-2">
           <div className={`w-1.5 h-1.5 rounded-full ${dbStatus === 'CONNECTED' ? 'bg-brand-accent animate-pulse' : 'bg-rose-500'}`}></div>
           <span className="text-[9px] font-black uppercase tracking-widest text-brand-accent">{session.user?.clientId || 'ZINIC'}</span>
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 w-full lg:ml-80 pt-20 pb-28 lg:pt-12 lg:pb-12 px-5 md:px-12 relative z-10 overflow-y-auto no-scrollbar">
        <div className="max-w-7xl mx-auto animate-reveal w-full">
          {children}
        </div>
      </main>

      {/* MOBILE BOTTOM NAVIGATION */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-[72px] bg-white z-[200] flex items-center justify-around px-2 shadow-[0_-8px_30px_rgba(0,0,0,0.1)] border-t border-slate-100 pb-safe">
        {menuItems.map(item => {
          const isActive = currentPage === item.id;
          return (
            <button 
              key={item.id}
              onClick={() => onNavigate(item.id)} 
              className={`flex-1 flex flex-col items-center justify-center h-full transition-all relative ${
                isActive ? 'text-brand-navy' : 'text-slate-400'
              }`}
            >
              <div className={`transition-all duration-300 ${isActive ? 'scale-110 -translate-y-1' : 'scale-100 opacity-50'}`}>
                {item.icon && React.isValidElement(item.icon) 
                  ? React.cloneElement(item.icon as React.ReactElement<any>, { 
                      size: isActive ? 22 : 20, 
                      strokeWidth: isActive ? 2.5 : 2,
                    }) 
                  : <span>•</span>}
              </div>
              <span className={`text-[8px] font-black tracking-widest uppercase mt-1.5 ${
                isActive ? 'text-brand-navy' : 'text-slate-500'
              }`}>
                {item.label}
              </span>
              
              {isActive && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-brand-navy rounded-b-full"></div>
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
};