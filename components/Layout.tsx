
// Added React to the imports to resolve 'React' namespace errors
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../App';
import { store } from '../services/mockStore';
import { ICONS, APP_NAME } from '../constants';
import { Logo } from './Logo';
import { UserRole, UserPermission } from '../types';
import { LogOut } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  currentPage: string;
  onNavigate: (page: string) => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, currentPage, onNavigate }) => {
  const { session, logout } = useAuth();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [dbStatus, setDbStatus] = useState(store.getDbStatus());
  const navScrollRef = useRef<HTMLElement>(null);
  
  const isSuperAdmin = session?.user?.role === UserRole.SUPERADMIN;
  const isAdmin = isSuperAdmin || session?.user?.role === UserRole.HOTEL_ADMIN;

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

  useEffect(() => {
    if (navScrollRef.current) {
      const activeEl = navScrollRef.current.querySelector('[data-active="true"]');
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      }
    }
  }, [currentPage]);

  const hasPermission = (perm: UserPermission) => {
    if (isAdmin) return true;
    return session.user?.permissions?.includes(perm);
  };

  const menuItems = isSuperAdmin ? [
    { id: 'superadmin', label: 'Network', icon: ICONS.Dashboard },
    { id: 'settings', label: 'Settings', icon: ICONS.Settings },
  ] : [
    { id: 'dashboard', label: 'Home', icon: ICONS.Dashboard, visible: hasPermission('dashboard:view') },
    { id: 'inventory', label: 'Stock', icon: ICONS.Inventory, visible: hasPermission('inventory:view') },
    { id: 'requests', label: 'Orders', icon: ICONS.Requests, visible: hasPermission('requests:view') },
    { id: 'reports', label: 'Insights', icon: ICONS.Report, visible: hasPermission('reports:view') },
    { id: 'users', label: 'Team', icon: ICONS.Users, visible: hasPermission('users:view') },
    { id: 'vendors', label: 'Vendors', icon: ICONS.Truck, visible: hasPermission('vendors:view') },
    { id: 'support', label: 'Help', icon: ICONS.Support, visible: true }, // Mandatory
    { id: 'settings', label: 'Settings', icon: ICONS.Settings, visible: true }, // Mandatory
  ].filter(item => item.visible);

  return (
    <div className="min-h-screen flex flex-col lg:flex-row w-full overflow-x-hidden bg-[#f8fafc] selection:bg-brand-accent selection:text-brand-navy">
      {/* DESKTOP SIDEBAR */}
      <aside className="hidden lg:flex w-80 glass-dark text-white fixed top-0 left-0 bottom-0 z-[100] flex-col overflow-hidden shadow-2xl">
        <div className="h-44 flex flex-col justify-center px-10">
          <div className="flex items-center group cursor-pointer" onClick={() => onNavigate(isSuperAdmin ? 'superadmin' : 'dashboard')}>
            <Logo size="lg" />
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
        </div>
        <div className="bg-white/5 px-3 py-1.5 rounded-xl border border-white/10 flex items-center gap-2">
           <div className={`w-1.5 h-1.5 rounded-full ${dbStatus === 'CONNECTED' ? 'bg-brand-accent animate-pulse' : 'bg-rose-500'}`}></div>
           <span className="text-[9px] font-black uppercase tracking-widest text-brand-accent">{session.user?.clientId || 'ZINIC'}</span>
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 w-full lg:ml-80 pt-20 pb-32 lg:pt-12 lg:pb-12 px-5 md:px-12 relative z-10 overflow-y-auto no-scrollbar">
        <div className="max-w-7xl mx-auto animate-reveal w-full">
          {children}
        </div>
      </main>

      {/* MOBILE BOTTOM NAVIGATION */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-[200] pb-safe">
        <div className="absolute inset-x-0 bottom-0 h-[88px] pointer-events-none bg-gradient-to-t from-black/5 to-transparent"></div>
        <nav 
          ref={navScrollRef}
          className="relative bg-white/90 backdrop-blur-2xl border-t border-slate-100 h-20 flex items-center overflow-x-auto snap-x snap-mandatory no-scrollbar px-4 gap-2 shadow-[0_-10px_40px_rgba(0,0,0,0.08)]"
        >
          <div className="fixed left-0 w-8 h-20 bg-gradient-to-r from-white/90 to-transparent pointer-events-none z-10"></div>
          <div className="fixed right-0 w-8 h-20 bg-gradient-to-l from-white/90 to-transparent pointer-events-none z-10"></div>

          {menuItems.map(item => {
            const isActive = currentPage === item.id;
            return (
              <button 
                key={item.id}
                data-active={isActive}
                onClick={() => onNavigate(item.id)} 
                className={`snap-center flex-shrink-0 flex items-center gap-2.5 h-12 px-5 rounded-2xl transition-all duration-500 active:scale-90 ${
                  isActive 
                    ? 'bg-brand-navy text-brand-accent shadow-xl shadow-brand-navy/10 scale-105' 
                    : 'text-slate-400 hover:bg-slate-50'
                }`}
              >
                <div className={`transition-transform duration-500 ${isActive ? 'scale-110' : 'scale-100 grayscale opacity-70'}`}>
                  {item.icon}
                </div>
                <span className={`text-[10px] font-black tracking-widest uppercase transition-all duration-500 ${
                  isActive ? 'opacity-100 max-w-[100px] ml-1' : 'opacity-0 max-w-0 overflow-hidden'
                }`}>
                  {item.label}
                </span>
              </button>
            );
          })}
          <div className="flex-shrink-0 w-2 h-full"></div>
        </nav>
      </div>
    </div>
  );
};
