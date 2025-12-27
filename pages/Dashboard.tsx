
import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../App.tsx';
import { store } from '../services/mockStore.ts';
import { ICONS } from '../constants.tsx';
import { InventoryItem } from '../types.ts';
import { Clock, Loader2, RefreshCw, Link2 } from 'lucide-react';
import { Button } from '../components/Button.tsx';

export const Dashboard: React.FC = () => {
  const { session } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [lastSync, setLastSync] = useState(new Date().toLocaleTimeString());
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Detect if opened via handshake
  const isIntegrated = new URLSearchParams(window.location.search).has('handshake');

  const loadData = useCallback(async () => {
    if (!session.user) return;
    setIsRefreshing(true);
    try {
      const s = await store.getStats(session.user.clientId);
      const i = await store.getItems(session.user.clientId);
      setStats(s);
      setItems(i);
      setLastSync(new Date().toLocaleTimeString());
    } catch (e) {
      console.error("Dashboard sync failed", e);
    } finally {
      setIsRefreshing(false);
    }
  }, [session.user]);

  useEffect(() => {
    loadData();
    const unsubscribe = store.subscribe(() => {
      loadData();
    });
    return () => { unsubscribe(); };
  }, [loadData]);

  if (!stats) return (
    <div className="flex flex-col items-center justify-center h-[60vh] text-brand-navy">
      <Loader2 size={40} className="animate-spin mb-4 text-brand-accent" />
      <p className="text-xs font-black uppercase tracking-widest animate-pulse">Establishing Secure Node Link...</p>
    </div>
  );

  return (
    <div className="space-y-8 animate-fade-in pb-10 w-full">
      {isIntegrated && (
        <div className="flex items-center gap-3 px-6 py-3 bg-brand-navy text-brand-accent rounded-2xl border border-brand-accent/20 animate-reveal">
          <Link2 size={16} />
          <p className="text-[10px] font-black uppercase tracking-widest">Linked to Primary PMS Dashboard</p>
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div>
          <h1 className="text-3xl lg:text-5xl font-black text-brand-navy tracking-tighter">Command Center</h1>
          <p className="text-slate-500 text-[11px] font-black uppercase tracking-widest mt-1 flex items-center gap-2">
            <Clock size={14} className="text-brand-accent" /> Last Sync: {lastSync}
          </p>
        </div>
        <div className="flex gap-4 w-full sm:w-auto">
          <Button onClick={loadData} isLoading={isRefreshing} variant="secondary" className="flex-1 sm:flex-none !rounded-2xl h-14 shadow-xl">
            <RefreshCw size={18} className={`mr-2 ${isRefreshing ? 'animate-spin' : ''}`} /> Refresh Data
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <StatCard label="Total Inventory" value={stats.totalItems} icon={ICONS.Inventory} trend="+12%" />
        <StatCard label="Critical Shortage" value={stats.lowStock} icon={ICONS.Alert} trend="Warning" color="rose" />
        <StatCard label="Pending Orders" value={stats.pendingRequests} icon={ICONS.Requests} trend="Action" />
        <StatCard label="Active Vendors" value={stats.activeVendors} icon={ICONS.Truck} trend="Stable" />
      </div>

      <div className="bg-white p-8 lg:p-12 rounded-[2.5rem] lg:rounded-[3rem] shadow-xl border border-slate-50">
        <div className="max-w-xl">
          <h3 className="text-xl lg:text-3xl font-black text-brand-navy tracking-tight">System Status</h3>
          <p className="text-slate-500 text-sm font-medium leading-relaxed mt-2">
            All inventory nodes are currently synchronized with the central cloud registry. Automated replenishment alerts are active based on your threshold settings.
          </p>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ label, value, icon, trend, color = 'navy' }: any) => (
  <div className="bg-white p-6 lg:p-8 rounded-[2rem] lg:rounded-[2.5rem] shadow-lg lg:shadow-xl border border-slate-50 group hover:-translate-y-1 transition-all duration-300">
    <div className="flex justify-between items-start mb-6">
      <div className={`p-3 lg:p-4 rounded-xl lg:rounded-2xl ${color === 'rose' ? 'bg-rose-50 text-rose-500' : 'bg-slate-50 text-brand-navy'} group-hover:scale-110 transition-transform`}>
        {icon && React.isValidElement(icon) ? React.cloneElement(icon as React.ReactElement<any>, { size: 20 }) : null}
      </div>
      <span className={`text-[8px] lg:text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md ${color === 'rose' ? 'bg-rose-50 text-rose-500' : 'bg-brand-accent/10 text-brand-navy'}`}>
        {trend}
      </span>
    </div>
    <p className={`text-3xl lg:text-4xl font-black tracking-tighter ${color === 'rose' ? 'text-rose-500' : 'text-brand-navy'}`}>{value}</p>
    <p className="text-[9px] lg:text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1 lg:mt-2">{label}</p>
  </div>
);
