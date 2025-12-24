
import React, { useEffect, useState } from 'react';
import { useAuth } from '../App';
import { store } from '../services/mockStore';
import { UserRole } from '../types';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  CartesianGrid, PieChart, Pie, Cell, Legend
} from 'recharts';
import { FileText, PieChart as PieChartIcon, BarChart3, TrendingUp, Download, IndianRupee } from 'lucide-react';

const COLORS = ['#001d3d', '#00b4d8', '#f59e0b', '#10b981', '#6366f1', '#ec4899'];

export const Reports: React.FC = () => {
  const { session } = useAuth();
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'FINANCE' | 'INVENTORY' | 'CONSUMPTION'>('FINANCE');

  const isAdmin = session.user?.role === UserRole.HOTEL_ADMIN || session.user?.role === UserRole.SUPERADMIN;

  useEffect(() => {
    const loadData = async () => {
      if (!session.user) return;
      setLoading(true);
      const data = await store.getReportData(session.user.clientId);
      setReportData(data);
      setLoading(false);
    };
    loadData();
  }, [session.user]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[60vh] text-brand-navy">
      <div className="w-12 h-12 border-4 border-brand-accent/20 border-t-brand-accent rounded-full animate-spin mb-4"></div>
      <p className="font-bold">Aggregating Cross-Module Data...</p>
    </div>
  );

  return (
    <div className="space-y-8 animate-fade-in max-w-7xl mx-auto pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-4xl font-black text-brand-navy tracking-tight">Intelligence Dashboard</h1>
          <p className="text-slate-500 text-sm font-medium mt-1">Operational and financial summary for {session.user?.clientId}.</p>
        </div>
        <button className="flex items-center gap-2 px-6 py-3 bg-brand-navy text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-brand-accent hover:text-brand-navy transition-all shadow-xl">
          <Download size={16} /> Export Records
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
        <TabButton active={activeTab === 'FINANCE'} onClick={() => setActiveTab('FINANCE')} icon={<IndianRupee size={18} />} label="Financial Summary" />
        <TabButton active={activeTab === 'INVENTORY'} onClick={() => setActiveTab('INVENTORY')} icon={<BarChart3 size={18} />} label="Stock Efficiency" />
        <TabButton active={activeTab === 'CONSUMPTION'} onClick={() => setActiveTab('CONSUMPTION')} icon={<PieChartIcon size={18} />} label="Usage Analysis" />
      </div>

      {activeTab === 'FINANCE' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-slide-up">
           <ReportMetric label="Accounts Payable" value={reportData.finance.totalPending} isCurrency color="rose" />
           <ReportMetric label="Paid to Vendors" value={reportData.finance.totalPaid} isCurrency color="emerald" />
           <ReportMetric label="Total Bill Volume" value={reportData.finance.totalPayable} isCurrency color="navy" />
           
           <div className="lg:col-span-3 bg-white p-10 rounded-[2.5rem] shadow-xl border border-slate-50">
              <h3 className="text-xl font-black text-brand-navy mb-8">Financial Liquidity Analysis</h3>
              <div className="h-80">
                 <ResponsiveContainer width="100%" height="100%">
                   <PieChart>
                     <Pie data={[
                       { name: 'Pending', value: reportData.finance.totalPending },
                       { name: 'Settled', value: reportData.finance.totalPaid }
                     ]} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
                        <Cell fill="#f43f5e" />
                        <Cell fill="#10b981" />
                     </Pie>
                     <Tooltip />
                     <Legend />
                   </PieChart>
                 </ResponsiveContainer>
              </div>
           </div>
        </div>
      )}

      {activeTab === 'INVENTORY' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-slide-up">
           <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-50">
             <h3 className="text-xl font-black text-brand-navy mb-6">Asset Groups</h3>
             <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={reportData.inventory.categoryDistribution} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
                      {reportData.inventory.categoryDistribution.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
             </div>
           </div>
           <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-50 space-y-6 flex flex-col justify-center">
              <div className="p-8 bg-brand-navy/5 rounded-[2rem]">
                 <p className="text-[10px] font-black uppercase text-slate-400">Inventory Velocity</p>
                 <p className="text-5xl font-black text-brand-navy mt-2">{reportData.inventory.totalItems} <span className="text-sm">SKUs</span></p>
              </div>
              <div className="p-8 bg-rose-50 rounded-[2rem]">
                 <p className="text-[10px] font-black uppercase text-rose-400">Critical Threshold Warnings</p>
                 <p className="text-5xl font-black text-rose-600 mt-2">{reportData.inventory.lowStockCount}</p>
              </div>
           </div>
        </div>
      )}

      {activeTab === 'CONSUMPTION' && (
        <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-slate-50 animate-slide-up">
          <h3 className="text-xl font-black text-brand-navy mb-8">Inter-Departmental Allocation Flow</h3>
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={reportData.consumption.byDept} margin={{left: 20}}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={12} fontWeight={700} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip cursor={{fill: '#f8fafc'}} />
                <Bar dataKey="value" fill="#00b4d8" radius={[10, 10, 0, 0]} barSize={60} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};

const ReportMetric = ({ label, value, isCurrency, color }: any) => (
  <div className={`p-8 rounded-[2.5rem] border shadow-xl ${
    color === 'rose' ? 'bg-rose-50 border-rose-100 text-rose-600' :
    color === 'emerald' ? 'bg-emerald-50 border-emerald-100 text-emerald-600' :
    'bg-brand-navy border-brand-navy text-white'
  }`}>
    <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-2">{label}</p>
    <p className="text-4xl font-black">{isCurrency && '₹'}{value.toLocaleString()}</p>
  </div>
);

const TabButton = ({ active, onClick, icon, label }: any) => (
  <button onClick={onClick} className={`flex items-center gap-3 px-6 py-4 rounded-2xl transition-all whitespace-nowrap ${active ? 'bg-brand-navy text-brand-accent shadow-xl' : 'bg-white text-slate-400 hover:text-brand-navy'}`}>
    {icon} <span className="font-black text-[10px] uppercase tracking-widest">{label}</span>
  </button>
);
