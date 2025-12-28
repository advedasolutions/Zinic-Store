
import React, { useEffect, useState } from 'react';
import { useAuth } from '../App';
import { store } from '../services/mockStore';
import { UserRole, RequestStatus } from '../types';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  CartesianGrid, PieChart, Pie, Cell, Legend
} from 'recharts';
import { FileText, PieChart as PieChartIcon, BarChart3, TrendingUp, Download, IndianRupee, X, Calendar, FileSpreadsheet, Package, ShoppingCart, Truck, ClipboardCheck } from 'lucide-react';
import { Button } from '../components/Button';
import { Input } from '../components/Input';

const COLORS = ['#001d3d', '#00b4d8', '#f59e0b', '#10b981', '#6366f1', '#ec4899'];

type ReportType = 'STOCK' | 'CONSUMPTION' | 'FINANCIAL' | 'AUDIT' | 'VENDOR_LIST';

export const Reports: React.FC = () => {
  const { session } = useAuth();
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'FINANCE' | 'INVENTORY' | 'CONSUMPTION'>('FINANCE');
  
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportConfig, setExportConfig] = useState({
    type: 'STOCK' as ReportType,
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [isExporting, setIsExporting] = useState(false);

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

  const handleExport = async () => {
    if (!session.user) return;
    setIsExporting(true);
    
    try {
      let csvRows = [];
      let fileName = `Zinic_Report_${exportConfig.type}_${exportConfig.startDate}_to_${exportConfig.endDate}.csv`;
      const start = new Date(exportConfig.startDate);
      const end = new Date(exportConfig.endDate);
      end.setHours(23, 59, 59);

      if (exportConfig.type === 'STOCK') {
        const items = await store.getItems(session.user.clientId);
        csvRows.push(["Item ID", "Item Name", "Category", "Unit", "Current Stock", "Min Stock Level", "Status", "Last Updated"]);
        items.forEach(i => {
          const status = i.currentStock <= i.minStockLevel ? "CRITICAL/LOW" : "OPTIMAL";
          csvRows.push([i.id, i.name, i.category, i.unit, i.currentStock, i.minStockLevel, status, new Date(i.lastUpdated).toLocaleString()]);
        });
      } 
      else if (exportConfig.type === 'CONSUMPTION') {
        const requests = await store.getRequests(session.user.clientId);
        csvRows.push(["Request Date", "Department", "Requester", "Item Name", "Qty Requested", "Qty Consumed", "Status"]);
        requests
          .filter(r => {
            const date = new Date(r.requestedAt);
            return date >= start && date <= end;
          })
          .forEach(r => {
            r.items.forEach(item => {
              csvRows.push([new Date(r.requestedAt).toLocaleDateString(), r.department, r.requesterName, item.itemName, item.quantity, item.consumedQuantity, r.status]);
            });
          });
      }
      else if (exportConfig.type === 'FINANCIAL') {
        const vendors = await store.getVendors(session.user.clientId);
        csvRows.push(["Invoice Date", "Vendor Name", "Invoice Number", "Due Date", "Total Amount", "Paid Amount", "Balance", "Payment Mode", "Status"]);
        vendors.forEach(v => {
          v.invoices?.filter(inv => {
            const date = new Date(inv.date);
            return date >= start && date <= end;
          }).forEach(inv => {
            const balance = inv.totalAmount - inv.paidAmount;
            csvRows.push([inv.date, v.name, inv.invoiceNumber, inv.dueDate || "N/A", inv.totalAmount, inv.paidAmount, balance, inv.paymentMode, inv.status]);
          });
        });
      }
      else if (exportConfig.type === 'AUDIT') {
        const audits = await store.getAudits(session.user.clientId);
        csvRows.push(["Audit Date", "Auditor Name", "Category", "Item Name", "System Stock", "Actual Physical Stock", "Variance", "Notes"]);
        audits
          .filter(a => {
            const date = new Date(a.auditDate);
            return date >= start && date <= end;
          })
          .forEach(a => {
            a.items.forEach(item => {
              csvRows.push([new Date(a.auditDate).toLocaleString(), a.auditorName, a.category, item.itemName, item.systemStock, item.actualStock, item.variance, item.remarks || ""]);
            });
          });
      }
      else if (exportConfig.type === 'VENDOR_LIST') {
        const vendors = await store.getVendors(session.user.clientId);
        csvRows.push(["Vendor Name", "Contact Person", "Email", "Phone", "Total Invoices"]);
        vendors.forEach(v => {
          csvRows.push([v.name, v.contactPerson, v.email, v.phone, v.invoices?.length || 0]);
        });
      }

      const csvContent = csvRows.map(row => 
        row.map(cell => {
          const content = String(cell).replace(/"/g, '""');
          return `"${content}"`;
        }).join(",")
      ).join("\n");

      const BOM = "\uFEFF";
      const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", fileName);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setShowExportModal(false);
    } catch (err) {
      console.error("Export failed", err);
      alert("Error generating the export file.");
    } finally {
      setIsExporting(false);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[60vh] text-brand-navy">
      <div className="w-12 h-12 border-4 border-brand-accent/20 border-t-brand-accent rounded-full animate-spin mb-4"></div>
      <p className="font-black text-[10px] uppercase tracking-widest animate-pulse">Computing Insight Matrix...</p>
    </div>
  );

  return (
    <div className="space-y-8 animate-fade-in max-w-7xl mx-auto pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-4xl font-black text-brand-navy tracking-tight">Intelligence Dashboard</h1>
          <p className="text-slate-500 text-sm font-medium mt-1">Entity Analytics and Business Reports.</p>
        </div>
        <Button onClick={() => setShowExportModal(true)} className="!bg-brand-navy !text-brand-accent h-14 !px-8 shadow-xl !rounded-2xl">
          <FileSpreadsheet size={18} className="mr-2" /> Export Center
        </Button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
        <TabButton active={activeTab === 'FINANCE'} onClick={() => setActiveTab('FINANCE')} icon={<IndianRupee size={18} />} label="Financial Metrics" />
        <TabButton active={activeTab === 'INVENTORY'} onClick={() => setActiveTab('INVENTORY')} icon={<Package size={18} />} label="Inventory State" />
        <TabButton active={activeTab === 'CONSUMPTION'} onClick={() => setActiveTab('CONSUMPTION')} icon={<ShoppingCart size={18} />} label="Usage Analytics" />
      </div>

      {activeTab === 'FINANCE' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-slide-up">
           <ReportMetric label="Total Payable" value={reportData.finance.totalPending} isCurrency color="rose" />
           <ReportMetric label="Total Settled" value={reportData.finance.totalPaid} isCurrency color="emerald" />
           <ReportMetric label="Account Volume" value={reportData.finance.totalPayable} isCurrency color="navy" />
           
           <div className="lg:col-span-3 bg-white p-10 rounded-[2.5rem] shadow-xl border border-slate-50">
              <h3 className="text-xl font-black text-brand-navy mb-8">Payable vs Paid Analysis</h3>
              <div className="h-80">
                 <ResponsiveContainer width="100%" height="100%">
                   <PieChart>
                     <Pie data={[
                       { name: 'Accounts Payable', value: reportData.finance.totalPending },
                       { name: 'Settled Payments', value: reportData.finance.totalPaid }
                     ]} cx="50%" cy="50%" innerRadius={70} outerRadius={110} paddingAngle={8} dataKey="value">
                        <Cell fill="#f43f5e" />
                        <Cell fill="#10b981" />
                     </Pie>
                     <Tooltip contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }} />
                     <Legend verticalAlign="bottom" height={36}/>
                   </PieChart>
                 </ResponsiveContainer>
              </div>
           </div>
        </div>
      )}

      {activeTab === 'INVENTORY' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-slide-up">
           <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-50">
             <h3 className="text-xl font-black text-brand-navy mb-6">Stock Allocation by Group</h3>
             <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={reportData.inventory.categoryDistribution} cx="50%" cy="50%" innerRadius={70} outerRadius={110} paddingAngle={5} dataKey="value">
                      {reportData.inventory.categoryDistribution.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
             </div>
           </div>
           <div className="space-y-8">
              <div className="bg-brand-navy p-10 rounded-[3rem] text-white relative overflow-hidden shadow-2xl">
                 <div className="absolute top-0 right-0 w-32 h-32 bg-brand-accent opacity-10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                 <p className="text-[10px] font-black uppercase text-brand-accent tracking-[0.2em]">Active Assets</p>
                 <p className="text-6xl font-black mt-4">{reportData.inventory.totalItems}</p>
                 <p className="text-slate-400 text-xs font-bold mt-2 uppercase tracking-widest">Managed SKU IDs</p>
              </div>
              <div className="bg-rose-50 p-10 rounded-[3rem] border border-rose-100 shadow-xl">
                 <p className="text-[10px] font-black uppercase text-rose-500 tracking-[0.2em]">Stock Alarms</p>
                 <p className="text-6xl font-black text-rose-600 mt-4">{reportData.inventory.lowStockCount}</p>
                 <p className="text-rose-400 text-xs font-bold mt-2 uppercase tracking-widest">Items Below Threshold</p>
              </div>
           </div>
        </div>
      )}

      {activeTab === 'CONSUMPTION' && (
        <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-slate-50 animate-slide-up">
          <h3 className="text-xl font-black text-brand-navy mb-8">Resource Depletion by Department</h3>
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={reportData.consumption.byDept} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={12} fontWeight={800} dy={10} stroke="#94a3b8" />
                <YAxis axisLine={false} tickLine={false} fontSize={12} fontWeight={700} stroke="#94a3b8" />
                <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 50px rgba(0,0,0,0.1)' }} />
                <Bar dataKey="value" fill="#00D1FF" radius={[12, 12, 0, 0]} barSize={50} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {showExportModal && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-brand-navy/60 backdrop-blur-2xl animate-fade-in">
          <div className="bg-white rounded-[3.5rem] shadow-2xl w-full max-w-2xl overflow-hidden animate-reveal flex flex-col max-h-[90vh]">
            <div className="p-10 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div className="flex items-center gap-5">
                <div className="w-16 h-16 bg-brand-navy text-brand-accent rounded-[1.5rem] flex items-center justify-center shadow-xl">
                  <FileSpreadsheet size={32}/>
                </div>
                <div>
                  <h3 className="text-2xl font-black text-brand-navy tracking-tight">Report Generator</h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Select Data Stream and Timeline</p>
                </div>
              </div>
              <button onClick={() => setShowExportModal(false)} className="p-4 hover:bg-slate-100 rounded-2xl transition-all"><X size={32} className="text-slate-300"/></button>
            </div>

            <div className="p-10 space-y-10 overflow-y-auto no-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ExportOption label="Stock Report" selected={exportConfig.type === 'STOCK'} onClick={() => setExportConfig({...exportConfig, type: 'STOCK'})} icon={<Package size={20} />} desc="Current stock levels & valuation" />
                <ExportOption label="Usage Report" selected={exportConfig.type === 'CONSUMPTION'} onClick={() => setExportConfig({...exportConfig, type: 'CONSUMPTION'})} icon={<ShoppingCart size={20} />} desc="Item consumption by dept" />
                <ExportOption label="Finance Log" selected={exportConfig.type === 'FINANCIAL'} onClick={() => setExportConfig({...exportConfig, type: 'FINANCIAL'})} icon={<IndianRupee size={20} />} desc="Vendor invoices & payments" />
                <ExportOption label="Audit History" selected={exportConfig.type === 'AUDIT'} onClick={() => setExportConfig({...exportConfig, type: 'AUDIT'})} icon={<ClipboardCheck size={20} />} desc="Physical audit variances" />
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2 px-2">
                  <Calendar size={14} className="text-brand-accent" />
                  <span className="text-[10px] font-black text-brand-navy uppercase tracking-widest">Select Extraction Period</span>
                </div>
                <div className="grid grid-cols-2 gap-6 p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100">
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">From Date</label>
                    <input type="date" value={exportConfig.startDate} onChange={e => setExportConfig({...exportConfig, startDate: e.target.value})} className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl font-bold text-brand-navy focus:ring-4 focus:ring-brand-accent/5 outline-none" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">To Date</label>
                    <input type="date" value={exportConfig.endDate} onChange={e => setExportConfig({...exportConfig, endDate: e.target.value})} className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl font-bold text-brand-navy focus:ring-4 focus:ring-brand-accent/5 outline-none" />
                  </div>
                </div>
              </div>
            </div>

            <div className="p-10 bg-slate-50/50 border-t border-slate-100 flex gap-4">
              <Button variant="secondary" className="flex-1 !h-16 !rounded-2xl" onClick={() => setShowExportModal(false)}>Cancel</Button>
              <Button onClick={handleExport} className="flex-[2] !h-16 !bg-brand-navy !text-brand-accent !rounded-2xl shadow-2xl !text-sm" isLoading={isExporting}>
                <Download size={20} className="mr-2" /> Generate Excel Report
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const ReportMetric = ({ label, value, isCurrency, color }: any) => (
  <div className={`p-8 rounded-[2.5rem] border shadow-xl transition-all hover:scale-[1.02] ${
    color === 'rose' ? 'bg-rose-50 border-rose-100 text-rose-600' :
    color === 'emerald' ? 'bg-emerald-50 border-emerald-100 text-emerald-600' :
    'bg-brand-navy border-brand-navy text-white'
  }`}>
    <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-2">{label}</p>
    <p className="text-4xl font-black">{isCurrency && '₹'}{value.toLocaleString()}</p>
  </div>
);

const TabButton = ({ active, onClick, icon, label }: any) => (
  <button onClick={onClick} className={`flex items-center gap-3 px-6 py-4 rounded-2xl transition-all whitespace-nowrap border-2 ${active ? 'bg-brand-navy text-brand-accent border-brand-navy shadow-xl' : 'bg-white text-slate-400 border-slate-50 hover:border-slate-200'}`}>
    {icon} <span className="font-black text-[10px] uppercase tracking-widest">{label}</span>
  </button>
);

const ExportOption = ({ label, selected, onClick, icon, desc }: any) => (
  <button 
    onClick={onClick}
    className={`flex flex-col items-start p-6 rounded-[2rem] border-2 text-left transition-all ${
      selected ? 'bg-brand-navy text-brand-accent border-brand-navy shadow-xl' : 'bg-slate-50 text-slate-400 border-transparent hover:bg-slate-100'
    }`}
  >
    <div className={`p-3 rounded-xl mb-3 ${selected ? 'bg-white/10' : 'bg-white shadow-sm'}`}>{icon}</div>
    <p className="font-black text-sm uppercase tracking-tight">{label}</p>
    <p className={`text-[10px] mt-1 font-medium leading-tight ${selected ? 'text-white/60' : 'text-slate-400'}`}>{desc}</p>
  </button>
);
