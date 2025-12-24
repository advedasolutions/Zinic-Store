import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, AuthSession, UserRole, Hotel } from './types.ts';
import { store } from './services/mockStore.ts';
import { Login } from './pages/Login.tsx';
import { Dashboard } from './pages/Dashboard.tsx';
import { Inventory } from './pages/Inventory.tsx';
import { Requests } from './pages/Requests.tsx';
import { Users } from './pages/Users.tsx';
import { Vendors } from './pages/Vendors.tsx';
import { SuperAdmin } from './pages/SuperAdmin.tsx';
import { Settings } from './pages/Settings.tsx';
import { Reports } from './pages/Reports.tsx';
import { Support } from './pages/Support.tsx';
import { Layout } from './components/Layout.tsx';
import { Logo } from './components/Logo.tsx';
import { Button } from './components/Button.tsx';
import { Zap, AlertTriangle, Link2 } from 'lucide-react';

const AUTH_STORAGE_KEY = 'zinic_auth_v5';
const SESSION_DURATION = 24 * 60 * 60 * 1000; 

interface AuthContextType {
  session: AuthSession;
  login: (c: string, u: string, p: string) => Promise<{success: boolean, hotel?: Hotel, isDemo?: boolean, error?: string}>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);
export const useAuth = () => useContext(AuthContext);

export const App: React.FC = () => {
  const [session, setSession] = useState<AuthSession>({ user: null, hotel: null, isAuthenticated: false });
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [isInitializing, setIsInitializing] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);
  const [isIntegrated, setIsIntegrated] = useState(false);

  useEffect(() => {
    const bootstrap = async () => {
      try {
        // Check for Integration Handshake (e.g., from a main PMS)
        const params = new URLSearchParams(window.location.search);
        const handshakeToken = params.get('handshake');
        const externalClientId = params.get('clientId');
        const externalUser = params.get('user');

        if (handshakeToken && externalClientId && externalUser) {
          setIsIntegrated(true);
          // In a real scenario, you'd verify the handshakeToken with your backend
          // For this mock, we attempt a 'Silent Login'
          const res = await store.login(externalClientId, externalUser, handshakeToken);
          if (res) {
            const { user, hotel } = res;
            const expiresAt = Date.now() + SESSION_DURATION;
            setSession({ user, hotel, isAuthenticated: true });
            localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ user, hotel, expiresAt }));
            setIsInitializing(false);
            return;
          }
        }

        // Standard Session Restoration
        const saved = localStorage.getItem(AUTH_STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && parsed.user && parsed.expiresAt && Date.now() < parsed.expiresAt) {
            setSession({ user: parsed.user, hotel: parsed.hotel || null, isAuthenticated: true, isDemo: parsed.isDemo });
            setCurrentPage(parsed.lastPage || (parsed.user.role === UserRole.SUPERADMIN ? 'superadmin' : 'dashboard'));
            if (!parsed.isDemo) {
              await store.initRealtimeSync(parsed.user.clientId, parsed.user.role);
            }
          } else {
            localStorage.removeItem(AUTH_STORAGE_KEY);
          }
        }
      } catch (e: any) { 
        console.error("Bootstrap Protocol Failure", e);
        localStorage.removeItem(AUTH_STORAGE_KEY); 
      } finally {
        setTimeout(() => setIsInitializing(false), 800);
      }
    };
    bootstrap();
  }, []);

  const login = async (c: string, u: string, p: string) => {
    try {
      const res = await store.login(c, u, p);
      if (res) {
        const { user, hotel, isDemo } = res;
        const expiresAt = Date.now() + SESSION_DURATION;
        const startPage = user.role === UserRole.SUPERADMIN ? 'superadmin' : 'dashboard';
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ user, hotel, expiresAt, lastPage: startPage, isDemo }));
        setSession({ user, hotel, isAuthenticated: true, isDemo });
        setCurrentPage(startPage);
        return { success: true, hotel, isDemo };
      }
    } catch (e: any) { 
      console.error("Login attempt failed", e); 
      return { success: false, error: e.message || "Cluster link protocol failed." };
    }
    return { success: false, error: "Access Denied: Invalid credentials." };
  };

  const logout = () => {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    setSession({ user: null, hotel: null, isAuthenticated: false });
    setCurrentPage('login');
    // Clear URL parameters on logout
    if (window.location.search) {
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  };

  const renderPage = () => {
    if (!session.isAuthenticated || !session.user) return <Login />;
    
    if (session.user.role === UserRole.SUPERADMIN) {
      switch (currentPage) {
        case 'settings': return <Settings />;
        case 'superadmin': return <SuperAdmin />;
        default: return <SuperAdmin />;
      }
    }
    
    switch (currentPage) {
      case 'dashboard': return <Dashboard />;
      case 'inventory': return <Inventory />;
      case 'requests': return <Requests />;
      case 'users': return <Users />;
      case 'vendors': return <Vendors />;
      case 'reports': return <Reports />;
      case 'settings': return <Settings />;
      case 'support': return <Support />;
      default: return <Dashboard />;
    }
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-brand-navy flex flex-col items-center justify-center p-10">
        <Logo size="xl" className="logo-shimmer mb-10" />
        <div className="flex flex-col items-center gap-4">
          <p className="text-[10px] font-black text-brand-accent uppercase tracking-[0.5em] opacity-60 animate-pulse">
            {isIntegrated ? "Establishing PMS Bridge..." : "Syncing Cloud Node..."}
          </p>
          {isIntegrated && (
            <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/10">
              <Link2 size={12} className="text-brand-accent animate-spin" />
              <span className="text-[8px] font-bold text-white/40 uppercase tracking-widest">Secure Handshake in Progress</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (initError) {
    return (
      <div className="min-h-screen bg-brand-navy flex flex-col items-center justify-center p-10 text-center">
        <div className="w-20 h-20 bg-rose-500/10 text-rose-500 rounded-3xl flex items-center justify-center mb-6">
          <AlertTriangle size={40} />
        </div>
        <h1 className="text-xl font-black text-white uppercase tracking-widest mb-2">Initialization Failed</h1>
        <p className="text-slate-400 text-xs mb-8">{initError}</p>
        <Button onClick={() => window.location.reload()} className="!bg-white !text-brand-navy">Retry Handshake</Button>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ session, login, logout }}>
      {session.isAuthenticated ? (
        <Layout currentPage={currentPage} onNavigate={setCurrentPage}>
          {session.isDemo && (
            <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-3xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-amber-500 rounded-xl flex items-center justify-center text-brand-navy">
                  <Zap size={16} fill="currentColor" />
                </div>
                <div>
                   <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Active 48H Sandbox</p>
                   <p className="text-[9px] font-bold text-amber-500/60 uppercase">Local Storage Mode Only</p>
                </div>
              </div>
              <button 
                onClick={() => logout()}
                className="px-4 py-2 bg-amber-500 text-brand-navy font-black text-[9px] uppercase tracking-widest rounded-xl hover:scale-105 transition-all"
              >
                End Session
              </button>
            </div>
          )}
          {renderPage()}
        </Layout>
      ) : (
        <Login />
      )}
    </AuthContext.Provider>
  );
};

export default App;