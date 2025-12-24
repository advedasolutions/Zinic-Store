import React, { useEffect, useState, useCallback } from 'react';
import { store } from '../services/mockStore';
import { useAuth } from '../App';
import { Vendor, VendorInvoice, UserRole, PaymentMode } from '../types';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { 
  X, Truck, Mail, Phone, User as UserIcon, Plus, 
  ArrowLeft, FileText, ChevronRight, Hash, Receipt, 
  Trash2, DollarSign, Wallet, Loader2, Calendar, CreditCard
} from 'lucide-react';

const PAYMENT_MODES: { value: PaymentMode; label: string }[] = [
  { value: 'CREDIT', label: 'Credit (Pay Later)' },
  { value: 'CASH', label: 'Cash Payment' },
  { value: 'BANK_TRANSFER', label: 'Bank Transfer / NEFT' },
  { value: 'UPI', label: 'UPI / GPay' },
  { value: 'CHEQUE', label: 'Cheque' },
];

export const Vendors: React.FC = () => {
  const { session } = useAuth();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  const [showVendorModal, setShowVendorModal] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [editingInvoice, setEditingInvoice] = useState<VendorInvoice | null>(null);

  const [vendorForm, setVendorForm] = useState({ name: '', contactPerson: '', email: '', phone: '' });
  const [invoiceForm, setInvoiceForm] = useState({ 
    invoiceNumber: '', 
    date: new Date().toISOString().split('T')[0], 
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    totalAmount: 0, 
    paidAmount: 0, 
    paymentMode: 'CREDIT' as PaymentMode,
    notes: '' 
  });

  const canManageFinance = session.user?.role === UserRole.SUPERADMIN || 
                           session.user?.role === UserRole.HOTEL_ADMIN || 
                           session.user?.permissions?.includes('MANAGE_FINANCE');

  const loadVendors = useCallback(async () => {
    if (!session.user) return;
    setLoading(true);
    const data = await store.getVendors(session.user.clientId);
    setVendors(data);
    if (selectedVendor) {
      const updated = data.find(v => v.id === selectedVendor.id);
      if (updated) setSelectedVendor(updated);
    }
    setLoading(false);
  }, [session.user, selectedVendor]);

  useEffect(() => { loadVendors(); }, [loadVendors]);

  const handleOpenVendorModal = (vendor: Vendor | null = null) => {
    if (vendor) {
      setEditingVendor(vendor);
      setVendorForm({ name: vendor.name, contactPerson: vendor.contactPerson, email: vendor.email, phone: vendor.phone });
    } else {
      setEditingVendor(null);
      setVendorForm({ name: '', contactPerson: '', email: '', phone: '' });
    }
    setShowVendorModal(true);
  };

  const handleSaveVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session.user) return;
    setIsSaving(true);
    await store.saveVendor({ id: editingVendor?.id || '', clientId: session.user.clientId, ...vendorForm, invoices: editingVendor?.invoices || [] });
    setShowVendorModal(false);
    setIsSaving(false);
    loadVendors();
  };

  const handleOpenInvoiceModal = (inv: VendorInvoice | null = null) => {
    if (inv) {
      setEditingInvoice(inv);
      setInvoiceForm({ 
        invoiceNumber: inv.invoiceNumber, 
        date: inv.date, 
        dueDate: inv.dueDate || inv.date,
        totalAmount: inv.totalAmount, 
        paidAmount: inv.paidAmount, 
        paymentMode: inv.paymentMode || 'CREDIT',
        notes: inv.notes || '' 
      });
    } else {
      setEditingInvoice(null);
      setInvoiceForm({ 
        invoiceNumber: `INV-${Date.now().toString().slice(-6)}`, 
        date: new Date().toISOString().split('T')[0], 
        dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        totalAmount: 0, 
        paidAmount: 0, 
        paymentMode: 'CREDIT',
        notes: '' 
      });
    }
    setShowInvoiceModal(true);
  };

  const handleSaveInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVendor) return;
    setIsSaving(true);
    
    const total = Number(invoiceForm.totalAmount);
    const paid = Number(invoiceForm.paidAmount);
    const status = paid >= total ? 'PAID' : (paid > 0 ? 'PARTIAL' : 'UNPAID');

    await store.saveInvoice(selectedVendor.id, { 
      id: editingInvoice?.id || '', 
      ...invoiceForm, 
      status, 
      totalAmount: total, 
      paidAmount: paid 
    });
    
    setShowInvoiceModal(false);
    setIsSaving(false);
    loadVendors();
  };

  const handleDeleteInvoice = async (invId: string) => {
    if (!selectedVendor || !confirm("Permanently delete this invoice?")) return;
    await store.deleteInvoice(selectedVendor.id, invId);
    loadVendors();
  };

  if (loading && vendors.length === 0) return (
    <div className="flex flex-col items-center justify-center p-20 text-brand-navy">
      <Loader2 size={40} className="animate-spin mb-4 text-brand-accent" />
      <p className="text-xs font-black uppercase tracking-widest">Opening Secure Ledger...</p>
    </div>
  );

  return (
    <div className="space-y-10 animate-fade-in pb-10 max-w-6xl mx-auto">
      {/* UI BRANCH: Detail View vs List View */}
      {selectedVendor ? (
        <div className="space-y-8 animate-slide-up pb-10">
          <button onClick={() => setSelectedVendor(null)} className="group flex items-center gap-3 text-brand-navy font-black text-xs uppercase tracking-widest hover:text-brand-accent transition-all">
            <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" /> Back to Directory
          </button>

          <div className="bg-brand-navy rounded-[3rem] p-10 text-white relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 w-64 h-64 bg-brand-accent/20 rounded-full blur-[80px] -mr-32 -mt-32"></div>
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 relative z-10">
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 bg-white/10 backdrop-blur-md rounded-3xl flex items-center justify-center text-brand-accent border border-white/10"><Truck size={40} /></div>
                <div>
                  <h2 className="text-4xl font-black tracking-tight">{selectedVendor.name}</h2>
                  <p className="text-brand-accent/60 font-black text-xs uppercase tracking-[0.3em] mt-1">Operational Ledger • {selectedVendor.contactPerson}</p>
                </div>
              </div>
              <div className="flex gap-4">
                <Button variant="secondary" onClick={() => handleOpenVendorModal(selectedVendor)} className="!bg-white/10 !text-white !border-white/20 hover:!bg-white hover:!text-brand-navy !rounded-2xl">Profile</Button>
                {canManageFinance && (
                  <Button onClick={() => handleOpenInvoiceModal()} className="!bg-brand-accent !text-brand-navy !rounded-2xl shadow-xl"><Plus size={20} className="mr-2" /> Log Invoice</Button>
                )}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
              <div className="p-8 rounded-[2rem] border bg-rose-500/10 text-rose-400 border-rose-500/20">
                <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-2">Total Outstanding</p>
                <p className="text-4xl font-black">₹{(selectedVendor.invoices?.reduce((acc, inv) => acc + (Number(inv.totalAmount) - Number(inv.paidAmount)), 0) || 0).toLocaleString()}</p>
              </div>
              <div className="p-8 rounded-[2rem] border bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-2">Total Paid</p>
                <p className="text-4xl font-black">₹{(selectedVendor.invoices?.reduce((acc, inv) => acc + Number(inv.paidAmount), 0) || 0).toLocaleString()}</p>
              </div>
              <div className="p-8 rounded-[2rem] border bg-white/5 text-white border-white/10">
                <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-2">Active Bills</p>
                <p className="text-4xl font-black">{selectedVendor.invoices?.length || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 overflow-hidden">
            <div className="p-8 border-b border-slate-50 flex justify-between items-center">
               <h3 className="text-xl font-black text-brand-navy flex items-center gap-3"><Receipt size={24} className="text-brand-accent" /> Financial Transaction History</h3>
            </div>
            <div className="overflow-x-auto no-scrollbar">
              <table className="w-full text-left">
                <thead className="bg-slate-50/50 text-slate-400 font-black uppercase tracking-[0.2em] text-[10px]">
                  <tr>
                    <th className="px-10 py-6">ID & Mode</th>
                    <th className="px-10 py-6">Date</th>
                    <th className="px-10 py-6">Bill Value</th>
                    <th className="px-10 py-6">Settled</th>
                    <th className="px-10 py-6">Status</th>
                    <th className="px-10 py-6 text-right">Ops</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {selectedVendor.invoices?.length === 0 ? (
                    <tr><td colSpan={6} className="py-20 text-center text-slate-300 font-bold">No records found.</td></tr>
                  ) : selectedVendor.invoices?.sort((a,b) => b.date.localeCompare(a.date)).map((inv) => (
                    <tr key={inv.id} className="group hover:bg-slate-50/50 transition-all">
                      <td className="px-10 py-6">
                        <div className="flex items-center gap-4">
                           <div className="w-10 h-10 rounded-xl bg-brand-navy/5 flex items-center justify-center text-brand-navy"><Hash size={18} /></div>
                           <div>
                              <p className="font-black text-brand-navy">{inv.invoiceNumber}</p>
                              <p className={`text-[9px] font-bold uppercase ${inv.paymentMode === 'CREDIT' ? 'text-amber-500' : 'text-slate-400'}`}>
                                Mode: {inv.paymentMode?.replace('_', ' ') || 'CREDIT'}
                              </p>
                           </div>
                        </div>
                      </td>
                      <td className="px-10 py-6">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-600 text-sm">{new Date(inv.date).toLocaleDateString()}</span>
                          {inv.dueDate && inv.status !== 'PAID' && (
                            <span className="text-[9px] font-bold text-rose-400">Due: {new Date(inv.dueDate).toLocaleDateString()}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-10 py-6 font-black text-brand-navy text-lg">₹{(Number(inv.totalAmount) || 0).toLocaleString()}</td>
                      <td className="px-10 py-6 font-black text-emerald-600">₹{(Number(inv.paidAmount) || 0).toLocaleString()}</td>
                      <td className="px-10 py-6">
                        <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${
                          inv.status === 'PAID' ? 'bg-emerald-100 text-emerald-700' : 
                          inv.status === 'PARTIAL' ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'
                        }`}>{inv.status}</span>
                      </td>
                      <td className="px-10 py-6 text-right">
                        {canManageFinance && (
                          <div className="flex items-center justify-end gap-2 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                            <button onClick={() => handleOpenInvoiceModal(inv)} className="p-2 text-slate-400 hover:text-brand-navy hover:bg-white rounded-lg"><FileText size={16}/></button>
                            <button onClick={() => handleDeleteInvoice(inv.id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-white rounded-lg"><Trash2 size={16}/></button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-10 animate-fade-in pb-10">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <h1 className="text-4xl font-black text-brand-navy tracking-tight">Partner Ecosystem</h1>
              <p className="text-slate-500 text-sm font-medium mt-1">Vendor lifecycle and procurement finance tracking.</p>
            </div>
            {canManageFinance && (
              <Button onClick={() => handleOpenVendorModal()} className="!bg-brand-navy !text-brand-accent !rounded-2xl h-14 px-8 shadow-xl">
                <Plus size={20} className="mr-2" /> Add Partner
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {vendors.map(v => {
              const outstanding = v.invoices?.reduce((acc, inv) => acc + (Number(inv.totalAmount) - Number(inv.paidAmount)), 0) || 0;
              return (
                <div key={v.id} onClick={() => setSelectedVendor(v)} className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-50 hover:border-brand-accent hover:shadow-2xl transition-all group cursor-pointer relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-40 transition-opacity"><Truck size={40} /></div>
                  <div className="flex items-center gap-4 mb-8">
                    <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center text-brand-navy font-black text-xl group-hover:bg-brand-navy group-hover:text-brand-accent transition-colors">{v.name.charAt(0)}</div>
                    <div>
                      <h3 className="font-black text-brand-navy text-xl leading-tight">{v.name}</h3>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Partner ID: {v.id.slice(-6)}</p>
                    </div>
                  </div>
                  <div className="space-y-3 mb-8">
                    <div className="flex items-center gap-3 text-sm font-bold text-slate-500"><UserIcon size={16} className="text-slate-300" /> {v.contactPerson}</div>
                    <div className="flex items-center gap-3 text-sm font-bold text-slate-500"><Phone size={16} className="text-slate-300" /> {v.phone}</div>
                  </div>
                  <div className="pt-6 border-t border-slate-50 flex justify-between items-center">
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Outstanding</p>
                      <p className={`text-xl font-black ${outstanding > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>₹{outstanding.toLocaleString()}</p>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-brand-navy group-hover:text-white transition-all"><ChevronRight size={20} /></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SHARED MODALS */}
      {showVendorModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-brand-navy/60 backdrop-blur-md animate-fade-in">
          <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h2 className="text-2xl font-black text-brand-navy">{editingVendor ? 'Update Profile' : 'New Partner'}</h2>
              <button onClick={() => setShowVendorModal(false)}><X className="text-slate-400"/></button>
            </div>
            <form onSubmit={handleSaveVendor} className="p-8 space-y-6">
              <Input label="Business Name" value={vendorForm.name} onChange={e => setVendorForm({...vendorForm, name: e.target.value})} required />
              <Input label="Key Contact" value={vendorForm.contactPerson} onChange={e => setVendorForm({...vendorForm, contactPerson: e.target.value})} required />
              <div className="grid grid-cols-2 gap-4">
                 <Input label="Email" type="email" value={vendorForm.email} onChange={e => setVendorForm({...vendorForm, email: e.target.value})} required />
                 <Input label="Phone" value={vendorForm.phone} onChange={e => setVendorForm({...vendorForm, phone: e.target.value})} required />
              </div>
              <Button type="submit" className="w-full !bg-brand-navy !text-brand-accent h-16" isLoading={isSaving}>Commit Identity</Button>
            </form>
          </div>
        </div>
      )}

      {showInvoiceModal && selectedVendor && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-brand-navy/70 backdrop-blur-md animate-fade-in overflow-y-auto no-scrollbar">
          <div className="bg-white rounded-[3.5rem] shadow-2xl w-full max-w-2xl my-8 animate-slide-up">
            <div className="p-10 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div className="flex items-center gap-4">
                <Receipt size={32} className="text-brand-accent" />
                <div>
                  <h2 className="text-3xl font-black text-brand-navy tracking-tight">{editingInvoice ? 'Modify Transaction' : 'Record New Invoice'}</h2>
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Financial Ledger for {selectedVendor.name}</p>
                </div>
              </div>
              <button onClick={() => setShowInvoiceModal(false)}><X size={28} className="text-slate-300 hover:text-rose-500" /></button>
            </div>
            <form onSubmit={handleSaveInvoice} className="p-10 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-6">
                  <Input label="Bill Reference #" placeholder="INV/2024/001" value={invoiceForm.invoiceNumber} onChange={e => setInvoiceForm({...invoiceForm, invoiceNumber: e.target.value})} required />
                  <div className="grid grid-cols-1 gap-4">
                    <div className="relative">
                      <Input label="Invoice Date" type="date" value={invoiceForm.date} onChange={e => setInvoiceForm({...invoiceForm, date: e.target.value})} required />
                      <Calendar size={18} className="absolute right-4 top-[42px] text-slate-300 pointer-events-none" />
                    </div>
                    <div className="relative">
                      <Input label="Due Date" type="date" value={invoiceForm.dueDate} onChange={e => setInvoiceForm({...invoiceForm, dueDate: e.target.value})} required />
                      <Calendar size={18} className="absolute right-4 top-[42px] text-slate-300 pointer-events-none" />
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <CreditCard size={14} /> Settlement Mode
                    </label>
                    <select 
                      className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl font-bold text-slate-900 focus:ring-4 focus:ring-brand-accent/5 outline-none"
                      value={invoiceForm.paymentMode}
                      onChange={e => setInvoiceForm({ ...invoiceForm, paymentMode: e.target.value as PaymentMode })}
                      required
                    >
                      {PAYMENT_MODES.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                    </select>
                  </div>
                  <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 space-y-4">
                    <Input label="Grand Total (₹)" type="number" className="!bg-white" value={invoiceForm.totalAmount} onChange={e => setInvoiceForm({...invoiceForm, totalAmount: Number(e.target.value)})} required />
                    <Input label="Initial Payment (₹)" type="number" className="!bg-white" value={invoiceForm.paidAmount} onChange={e => setInvoiceForm({...invoiceForm, paidAmount: Number(e.target.value)})} required />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Internal Audit Notes</label>
                <textarea 
                  className="w-full p-5 bg-slate-50 border-none rounded-2xl text-sm font-medium h-24 focus:ring-4 focus:ring-brand-accent/5 outline-none resize-none" 
                  placeholder="Details about items, delivery state, or payment reference..." 
                  value={invoiceForm.notes} 
                  onChange={e => setInvoiceForm({...invoiceForm, notes: e.target.value})} 
                />
              </div>

              <div className="flex gap-4">
                <Button type="button" variant="secondary" className="flex-1 !rounded-2xl" onClick={() => setShowInvoiceModal(false)}>Cancel</Button>
                <Button type="submit" className="flex-2 !bg-brand-navy !text-brand-accent !rounded-2xl h-16 !text-lg shadow-xl" isLoading={isSaving}>Authorize Entry</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};