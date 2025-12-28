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
import { Audit } from './pages/Audit.tsx';
import { Transfers } from './pages/Transfers.tsx';
import { Layout } from './components/Layout.tsx';
import { Logo } from './components/Logo.tsx';

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

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const handshakeToken = params.get('handshake');
        const externalClientId = params.get('clientId');
        const externalUser = params.get('user');

        if (handshakeToken && externalClientId && externalUser) {
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
    if (window.location.search) {
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  };

  const renderPage = () => {
    if (!session.isAuthenticated || !session.user) return <Login />;
    
    if (session.user.role === UserRole.SUPERADMIN) {
      switch (currentPage) {
        case 'superadmin': return <SuperAdmin />;
        case 'settings': return <Settings />;
        default: return <SuperAdmin />;
      }
    }

    switch (currentPage) {
      case 'dashboard': return <Dashboard />;
      case 'inventory': return <Inventory />;
      case 'requests': return <Requests />;
      case 'audit': return <Audit />;
      case 'transfers': return <Transfers />;
      case 'reports': return <Reports />;
      case 'users': return <Users />;
      case 'vendors': return <Vendors />;
      case 'settings': return <Settings />;
      case 'support': return <Support />;
      default: return <Dashboard />;
    }
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-brand-navy flex flex-col items-center justify-center">
        <Logo size="xl" className="animate-pulse" />
        <p className="mt-8 text-brand-accent text-[10px] font-black uppercase tracking-[0.5em]">Initializing Secure Channel...</p>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ session, login, logout }}>
      {session.isAuthenticated ? (
        <Layout currentPage={currentPage} onNavigate={setCurrentPage}>
          {renderPage()}
        </Layout>
      ) : (
        <Login />
      )}
    </AuthContext.Provider>
  );
};

export default App;