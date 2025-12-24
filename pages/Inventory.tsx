
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { store } from '../services/mockStore';
import { useAuth } from '../App';
import { InventoryItem, UserRole } from '../types';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { 
  Package, 
  Search, 
  AlertTriangle, 
  Plus,
  X,
  Edit,
  Trash2,
  RefreshCw,
  Minus,
  ScanLine,
  Camera,
  CheckCircle2,
  Save,
  ArrowRight
} from 'lucide-react';

const MEASUREMENT_UNITS = [
  'kg', 'liters', 'pcs', 'pack', 'box', 'tray', 'bottle', 'bundle', 'bag', 'dozen', 'gm', 'ml'
];

const CATEGORIES = [
  'Dry Goods', 'Perishables', 'Housekeeping', 'F&B', 'Maintenance', 'Linens', 'General Store', 'Chemicals'
];

export const Inventory: React.FC = () => {
  const { session } = useAuth();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [adjustingItem, setAdjustingItem] = useState<InventoryItem | null>(null);
  const [adjustmentValue, setAdjustmentValue] = useState<string>('0');
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    category: CATEGORIES[0],
    unit: 'pcs',
    currentStock: 0,
    minStockLevel: 0
  });

  const canManageInventory = session.user?.role === UserRole.SUPERADMIN || session.user?.permissions?.includes('MANAGE_INVENTORY');

  const loadItems = useCallback(async () => {
    if (!session.user) return;
    setLoading(true);
    try {
      const data = await store.getItems(session.user.clientId);
      setItems(data);
    } catch (err) {
      console.error("Failed to load items", err);
    } finally {
      setLoading(false);
    }
  }, [session.user]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const handleOpenEditModal = (item: InventoryItem | null = null) => {
    setSuccessMsg('');
    if (item) {
      setEditingItem(item);
      setFormData({
        name: item.name,
        category: item.category || CATEGORIES[0],
        unit: item.unit || 'pcs',
        currentStock: item.currentStock,
        minStockLevel: item.minStockLevel
      });
    } else {
      setEditingItem(null);
      setFormData({
        name: '',
        category: CATEGORIES[0],
        unit: 'pcs',
        currentStock: 0,
        minStockLevel: 0
      });
    }
    setShowEditModal(true);
  };

  const handleOpenAdjustModal = (item: InventoryItem) => {
    setAdjustingItem(item);
    setAdjustmentValue('0');
    setShowAdjustModal(true);
  };

  const handleAdjustStock = async () => {
    if (!adjustingItem || !session.user) return;
    const val = parseInt(adjustmentValue);
    if (isNaN(val) || val === 0) return;
    
    setIsSaving(true);
    try {
      await store.adjustStock(adjustingItem.id, val);
      await loadItems();
      setShowAdjustModal(false);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (itemId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Permanently remove this item from catalog?')) return;
    setIsDeleting(itemId);
    try {
      await store.deleteItem(itemId);
      await loadItems();
    } catch (err) {
      console.error(err);
    } finally {
      setIsDeleting(null);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session.user) return;
    setIsSaving(true);
    setSuccessMsg('');

    try {
      const itemData: InventoryItem = {
        ...(editingItem || {}),
        id: editingItem?.id || `i-${Date.now()}`,
        clientId: session.user.clientId,
        name: formData.name,
        category: formData.category,
        unit: formData.unit,
        currentStock: Number(formData.currentStock),
        minStockLevel: Number(formData.minStockLevel),
        lastUpdated: new Date().toISOString()
      };
      await store.updateItem(itemData);
      setSuccessMsg('Record synchronized successfully.');
      setTimeout(() => {
        setShowEditModal(false);
        loadItems();
      }, 1000);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const filteredItems = items.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-4xl font-black text-brand-navy tracking-tight">Stock Ledger</h1>
          <p className="text-slate-500 text-sm font-medium mt-1">Real-time asset monitoring and valuation.</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <Button variant="secondary" onClick={() => setShowScanner(true)} className="!rounded-2xl h-14 !px-5"><ScanLine size={20}/></Button>
          {canManageInventory && (
            <Button onClick={() => handleOpenEditModal()} className="flex-1 md:flex-none !bg-brand-navy !text-brand-accent !rounded-2xl h-14 !px-8 shadow-xl">
              <Plus size={20} className="mr-2" /> Add SKU
            </Button>
          )}
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
        <input 
          type="text" 
          placeholder="Filter by name or category..." 
          className="w-full pl-16 pr-6 py-5 bg-white border border-slate-100 rounded-[2rem] shadow-xl shadow-slate-200/40 focus:ring-4 focus:ring-brand-accent/5 outline-none font-bold text-brand-navy transition-all"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          [1,2,3].map(i => <div key={i} className="h-64 bg-slate-50 animate-pulse rounded-[2.5rem]" />)
        ) : filteredItems.length === 0 ? (
          <div className="col-span-full py-20 text-center border-2 border-dashed border-slate-100 rounded-[3rem]">
            <Package size={48} className="mx-auto text-slate-100 mb-4" />
            <p className="text-slate-300 font-black uppercase tracking-widest text-xs">No matching nodes found in cluster</p>
          </div>
        ) : filteredItems.map(item => (
          <div key={item.id} className="group bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-50 hover:shadow-2xl transition-all relative overflow-hidden">
            {item.currentStock <= item.minStockLevel && (
              <div className="absolute top-0 right-0 p-4">
                <div className="w-10 h-10 bg-rose-50 text-rose-500 rounded-xl flex items-center justify-center animate-pulse"><AlertTriangle size={20} /></div>
              </div>
            )}
            
            <div className="mb-6">
              <span className="text-[10px] font-black text-brand-accent uppercase tracking-widest bg-brand-accent/5 px-3 py-1 rounded-lg">{item.category}</span>
              <h3 className="text-xl font-black text-brand-navy mt-3 leading-tight">{item.name}</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">ID: {item.id.slice(-6)}</p>
            </div>

            <div className="flex items-end justify-between mb-8">
              <div>
                <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Available Supply</p>
                <p className={`text-4xl font-black tracking-tighter ${item.currentStock <= item.minStockLevel ? 'text-rose-500' : 'text-brand-navy'}`}>
                  {item.currentStock}<span className="text-sm font-bold ml-1 opacity-40 uppercase tracking-normal">{item.unit}</span>
                </p>
              </div>
              <div className="text-right">
                <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Threshold</p>
                <p className="text-lg font-black text-slate-400">{item.minStockLevel}</p>
              </div>
            </div>

            <div className="flex gap-3 pt-6 border-t border-slate-50">
              <Button variant="secondary" size="sm" className="flex-1 !rounded-xl" onClick={() => handleOpenAdjustModal(item)} disabled={!canManageInventory}>Adjust</Button>
              <Button variant="secondary" size="sm" className="!px-3 !rounded-xl" onClick={() => handleOpenEditModal(item)} disabled={!canManageInventory}><Edit size={16}/></Button>
              <Button variant="ghost" size="sm" className="!px-3 !rounded-xl text-rose-400" onClick={(e) => handleDelete(item.id, e)} disabled={!canManageInventory || isDeleting === item.id}>
                {isDeleting === item.id ? <RefreshCw className="animate-spin" size={16}/> : <Trash2 size={16}/>}
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* MODALS */}
      {showEditModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-brand-navy/60 backdrop-blur-md animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-xl my-auto animate-reveal overflow-hidden">
            <div className="p-8 lg:p-10 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-brand-navy text-brand-accent rounded-2xl"><Package size={24}/></div>
                <div>
                  <h2 className="text-2xl font-black text-brand-navy tracking-tight">{editingItem ? 'Update Registry' : 'New Asset Entry'}</h2>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Client Node: {session.user?.clientId}</p>
                </div>
              </div>
              <button onClick={() => setShowEditModal(false)} className="p-2 text-slate-300 hover:text-rose-500 transition-all"><X size={28} /></button>
            </div>

            <form onSubmit={handleSave} className="p-8 lg:p-10 space-y-8">
              <div className="space-y-6">
                <Input label="Item Name / SKU Title" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. Basmati Rice 25kg" required />
                
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Asset Category</label>
                    <select className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl font-bold text-brand-navy focus:ring-4 focus:ring-brand-accent/5" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Measurement Unit</label>
                    <select className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl font-bold text-brand-navy focus:ring-4 focus:ring-brand-accent/5" value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value})}>
                      {MEASUREMENT_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6 p-6 bg-slate-50 rounded-[2rem]">
                  <Input label="Initial Stock" type="number" value={formData.currentStock} onChange={e => setFormData({...formData, currentStock: Number(e.target.value)})} />
                  <Input label="Low Stock Warning" type="number" value={formData.minStockLevel} onChange={e => setFormData({...formData, minStockLevel: Number(e.target.value)})} />
                </div>
              </div>

              {successMsg && (
                <div className="p-5 bg-emerald-50 border border-emerald-100 text-emerald-600 text-xs font-black rounded-3xl animate-slide-up flex items-center gap-3">
                  <CheckCircle2 size={18} /> {successMsg}
                </div>
              )}

              <div className="flex gap-4 pt-2">
                <Button type="button" variant="secondary" className="flex-1 !rounded-2xl" onClick={() => setShowEditModal(false)}>Discard</Button>
                <Button type="submit" className="flex-[2] !bg-brand-navy !text-brand-accent h-16 !rounded-2xl shadow-xl !text-sm !font-black !uppercase !tracking-widest" isLoading={isSaving}>
                  <Save size={18} className="mr-2" /> {editingItem ? 'Update Record' : 'Commit to Cluster'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAdjustModal && adjustingItem && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-brand-navy/70 backdrop-blur-xl animate-fade-in">
          <div className="bg-white rounded-[3.5rem] shadow-2xl w-full max-w-md p-10 text-center animate-reveal">
            <div className="w-20 h-20 bg-brand-navy/5 text-brand-navy rounded-3xl flex items-center justify-center mx-auto mb-6">
              <RefreshCw size={32} />
            </div>
            <h3 className="text-2xl font-black text-brand-navy tracking-tight">{adjustingItem.name}</h3>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Manual Audit Adjustment</p>
            
            <div className="my-10 space-y-4">
              <div className="flex items-center justify-center gap-6">
                <button onClick={() => setAdjustmentValue((prev) => (parseInt(prev) - 1).toString())} className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center text-brand-navy hover:bg-rose-50 hover:text-rose-500 transition-all"><Minus size={24}/></button>
                <div className="flex-1">
                  <input 
                    type="number" 
                    value={adjustmentValue} 
                    onChange={(e) => setAdjustmentValue(e.target.value)}
                    className="w-full text-5xl font-black text-center text-brand-navy bg-transparent outline-none"
                  />
                  <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.3em] mt-2">Units to Add/Subtract</p>
                </div>
                <button onClick={() => setAdjustmentValue((prev) => (parseInt(prev) + 1).toString())} className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center text-brand-navy hover:bg-emerald-50 hover:text-emerald-500 transition-all"><Plus size={24}/></button>
              </div>
            </div>

            <div className="flex gap-4">
              <Button variant="secondary" className="flex-1" onClick={() => setShowAdjustModal(false)}>Cancel</Button>
              <Button onClick={handleAdjustStock} className="flex-[2] !bg-brand-navy !text-brand-accent" isLoading={isSaving}>Finalize Adjustment</Button>
            </div>
          </div>
        </div>
      )}

      {showScanner && (
        <div className="fixed inset-0 z-[300] bg-black/95 flex flex-col items-center justify-center p-6 animate-fade-in">
          <div className="w-full max-w-sm relative aspect-[3/4] rounded-[3rem] border-2 border-brand-accent/30 overflow-hidden bg-brand-navy/50">
             {/* Simulated Scan Overlay */}
             <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="w-[80%] h-1 bg-brand-accent shadow-[0_0_20px_rgba(0,209,255,0.8)] animate-bounce mb-20"></div>
                <Camera size={48} className="text-white/10" />
                <p className="text-[10px] font-black text-brand-accent uppercase tracking-[0.5em] mt-8 animate-pulse">Scanning...</p>
             </div>
             {/* Scanner Corner Visuals */}
             <div className="absolute top-8 left-8 w-12 h-12 border-t-4 border-l-4 border-brand-accent rounded-tl-2xl opacity-40"></div>
             <div className="absolute top-8 right-8 w-12 h-12 border-t-4 border-r-4 border-brand-accent rounded-tr-2xl opacity-40"></div>
             <div className="absolute bottom-8 left-8 w-12 h-12 border-b-4 border-l-4 border-brand-accent rounded-bl-2xl opacity-40"></div>
             <div className="absolute bottom-8 right-8 w-12 h-12 border-b-4 border-r-4 border-brand-accent rounded-br-2xl opacity-40"></div>
          </div>
          
          <div className="mt-12 text-center space-y-6">
            <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.3em]">Hardware Ready: System V.5</p>
            <Button variant="secondary" className="!bg-white/10 !text-white !border-white/10 !px-12 !rounded-3xl" onClick={() => setShowScanner(false)}>Close Terminal</Button>
          </div>
        </div>
      )}
    </div>
  );
};
