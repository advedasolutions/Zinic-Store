
import { User, Hotel, InventoryItem, StockRequest, Vendor, UserRole, Department, RequestStatus, DemoLead, VendorInvoice, ConsumptionLog } from '../types.ts';
import { supabase } from './supabase.ts';

const DEMO_ITEMS_KEY = 'zinic_demo_items';
const DEMO_REQUESTS_KEY = 'zinic_demo_requests';
const DEMO_VENDORS_KEY = 'zinic_demo_vendors';

class ZinicStore {
  private listeners: Set<() => void> = new Set();
  private channels: any[] = [];
  private dbStatus: 'CONNECTED' | 'DISCONNECTED' | 'CONNECTING' = 'CONNECTING';
  
  private hotels: Hotel[] = [];
  private users: User[] = [];
  private items: InventoryItem[] = [];
  private requests: StockRequest[] = [];
  private vendors: Vendor[] = [];

  private currentClientId: string = '';
  private currentIsGlobal: boolean = false;
  private isDemoMode: boolean = false;

  constructor() {
    this.checkConnection();
    this.fetchHotelsOnly();
  }

  public async checkConnection(): Promise<boolean> {
    try {
      this.dbStatus = 'CONNECTING';
      this.notify();
      const { error } = await supabase.from('hotels').select('id').limit(1);
      this.dbStatus = error ? 'DISCONNECTED' : 'CONNECTED';
      this.notify();
      return this.dbStatus === 'CONNECTED';
    } catch (e) {
      this.dbStatus = 'DISCONNECTED';
      this.notify();
      return false;
    }
  }

  private async fetchHotelsOnly() {
    try {
      const { data } = await supabase.from('hotels').select('*').order('name');
      if (data) this.hotels = data.map(h => this.mapHotel(h));
      this.notify();
    } catch (e) {
      console.error("Fetch Hotels Failed", e);
    }
  }

  public getDbStatus() { return this.dbStatus; }

  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() { this.listeners.forEach(l => l()); }

  private mapHotel(h: any): Hotel {
    return {
      id: h.id,
      name: h.name,
      isActive: h.is_active,
      maxUsers: h.max_users,
      maxItems: h.max_items,
      contactEmail: h.contact_email,
      createdAt: h.created_at
    };
  }

  private mapUser(u: any): User {
    return {
      id: u.id,
      clientId: u.client_id,
      username: u.username,
      fullName: u.full_name,
      email: u.email,
      role: u.role as UserRole,
      department: u.department as Department,
      permissions: u.permissions || [],
      password: u.password
    };
  }

  private mapItem(i: any): InventoryItem {
    return {
      id: i.id,
      clientId: i.client_id,
      name: i.name,
      category: i.category,
      unit: i.unit,
      currentStock: Number(i.current_stock),
      minStockLevel: Number(i.min_stock_level),
      vendorId: i.vendor_id,
      lastUpdated: i.last_updated
    };
  }

  private mapRequest(r: any): StockRequest {
    return {
      id: r.id,
      clientId: r.client_id,
      requesterId: r.requester_id,
      requesterName: r.requester_name,
      department: r.department as Department,
      items: r.items || [],
      status: r.status as RequestStatus,
      requestedAt: r.requested_at,
      notes: r.notes
    };
  }

  private mapVendor(v: any): Vendor {
    return {
      id: v.id,
      clientId: v.client_id,
      name: v.name,
      contactPerson: v.contact_person,
      email: v.email,
      phone: v.phone,
      invoices: v.invoices || []
    };
  }

  async login(clientId: string, username: string, password?: string): Promise<{user: User, hotel: Hotel, isDemo: boolean} | null> {
    const { data: userData, error } = await supabase
      .from('users')
      .select('*')
      .ilike('client_id', clientId)
      .eq('username', username)
      .eq('password', password)
      .single();

    if (error || !userData) return null;

    const { data: hotelData } = await supabase
      .from('hotels')
      .select('*')
      .eq('id', clientId)
      .single();

    if (!hotelData) return null;

    const user = this.mapUser(userData);
    const hotel = this.mapHotel(hotelData);
    
    await this.initRealtimeSync(clientId, user.role);
    return { user, hotel, isDemo: false };
  }

  async initRealtimeSync(clientId: string, role?: UserRole) {
    if (!clientId) return;
    this.isDemoMode = false;
    this.currentClientId = clientId;
    const isGlobalSync = role === UserRole.SUPERADMIN;
    this.currentIsGlobal = isGlobalSync;
    
    try {
      await this.fetchInitialData(clientId, isGlobalSync);
      const channel = supabase
        .channel(`zinic-sync-${clientId}`)
        .on('postgres_changes', { event: '*', schema: 'public' }, () => this.fetchInitialData(this.currentClientId, this.currentIsGlobal))
        .subscribe();
      this.channels.push(channel);
    } catch (e) {
      console.error("Sync init failed", e);
    }
  }

  private async fetchInitialData(clientId: string, isGlobal: boolean) {
    const [hRes, uRes, iRes, rRes, vRes] = await Promise.all([
      isGlobal ? supabase.from('hotels').select('*') : supabase.from('hotels').select('*').eq('id', clientId),
      isGlobal ? supabase.from('users').select('*') : supabase.from('users').select('*').eq('client_id', clientId),
      isGlobal ? supabase.from('inventory').select('*') : supabase.from('inventory').select('*').eq('client_id', clientId),
      isGlobal ? supabase.from('requests').select('*') : supabase.from('requests').select('*').eq('client_id', clientId),
      isGlobal ? supabase.from('vendors').select('*') : supabase.from('vendors').select('*').eq('client_id', clientId)
    ]);

    if (hRes.data) this.hotels = hRes.data.map(h => this.mapHotel(h));
    if (uRes.data) this.users = uRes.data.map(u => this.mapUser(u));
    if (iRes.data) this.items = iRes.data.map(i => this.mapItem(i));
    if (rRes.data) this.requests = rRes.data.map(r => this.mapRequest(r));
    if (vRes.data) this.vendors = vRes.data.map(v => this.mapVendor(v));
    this.notify();
  }

  async getHotels() { return this.hotels; }
  async getUsers(clientId: string) { return this.users.filter(u => u.clientId === clientId); }
  async getItems(clientId: string) { return this.items.filter(i => i.clientId === clientId); }
  async getRequests(clientId: string) { return this.requests.filter(r => r.clientId === clientId); }
  async getVendors(clientId: string) { return this.vendors.filter(v => v.clientId === clientId); }

  async getStats(clientId: string) {
    const clientItems = this.items.filter(i => i.clientId === clientId);
    const clientRequests = this.requests.filter(r => r.clientId === clientId);
    const clientVendors = this.vendors.filter(v => v.clientId === clientId);

    return {
      totalItems: clientItems.length,
      lowStock: clientItems.filter(i => i.currentStock <= i.minStockLevel).length,
      pendingRequests: clientRequests.filter(r => r.status === RequestStatus.PENDING).length,
      activeVendors: clientVendors.length,
      totalUsers: this.users.filter(u => u.clientId === clientId).length
    };
  }

  async createRequest(req: StockRequest) {
    // FIX: Generate unique ID to prevent null constraint violation
    const newId = `REQ-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    
    if (this.isDemoMode) {
      const newReq = { ...req, id: newId };
      this.requests.unshift(newReq);
      this.saveDemoStorage();
      this.notify();
      return;
    }

    const { error } = await supabase.from('requests').insert([{
      id: newId,
      client_id: req.clientId,
      requester_id: req.requesterId,
      requester_name: req.requesterName,
      department: req.department,
      items: req.items,
      status: req.status,
      requested_at: req.requestedAt,
      notes: req.notes
    }]);

    if (error) throw error;
    await this.fetchInitialData(this.currentClientId, this.currentIsGlobal);
  }

  async updateRequestStatus(id: string, status: RequestStatus) {
    if (this.isDemoMode) {
      this.requests = this.requests.map(r => r.id === id ? { ...r, status } : r);
      this.saveDemoStorage();
      this.notify();
      return;
    }
    const { error } = await supabase.from('requests').update({ status }).eq('id', id);
    if (error) throw error;
    await this.fetchInitialData(this.currentClientId, this.currentIsGlobal);
  }

  async consumeRequestItem(reqId: string, itemId: string, amount: number, userId: string, remark: string, userName: string) {
    const req = this.requests.find(r => r.id === reqId);
    if (!req) return;

    const log: ConsumptionLog = {
      id: `log-${Date.now()}`,
      amount,
      remark,
      timestamp: new Date().toISOString(),
      userId,
      userName
    };

    const updatedItems = req.items.map(i => {
      if (i.itemId === itemId) {
        return {
          ...i,
          consumedQuantity: (i.consumedQuantity || 0) + amount,
          logs: [...(i.logs || []), log]
        };
      }
      return i;
    });

    const isFullyConsumed = updatedItems.every(i => i.consumedQuantity >= i.quantity);
    const status = isFullyConsumed ? RequestStatus.CONSUMED : req.status;

    if (this.isDemoMode) {
      this.requests = this.requests.map(r => r.id === reqId ? { ...r, items: updatedItems, status } : r);
      this.saveDemoStorage();
      this.notify();
      return;
    }

    const { error } = await supabase.from('requests').update({ items: updatedItems, status }).eq('id', reqId);
    if (error) throw error;
    await this.fetchInitialData(this.currentClientId, this.currentIsGlobal);
  }

  async adjustStock(id: string, delta: number) {
    const item = this.items.find(i => i.id === id);
    if (!item) return;
    const newStock = Math.max(0, item.currentStock + delta);
    
    if (this.isDemoMode) {
      this.items = this.items.map(i => i.id === id ? { ...i, currentStock: newStock } : i);
      this.saveDemoStorage();
      this.notify();
      return;
    }

    const { error } = await supabase.from('inventory').update({ current_stock: newStock }).eq('id', id);
    if (error) throw error;
    await this.fetchInitialData(this.currentClientId, this.currentIsGlobal);
  }

  async updateItem(item: InventoryItem) {
    const dbPayload = {
      client_id: item.clientId,
      name: item.name,
      category: item.category,
      unit: item.unit,
      current_stock: item.currentStock,
      min_stock_level: item.minStockLevel,
      last_updated: new Date().toISOString()
    };

    const { error } = await supabase.from('inventory').upsert([{ id: item.id, ...dbPayload }]);
    if (error) throw error;
    await this.fetchInitialData(this.currentClientId, this.currentIsGlobal);
  }

  async deleteItem(id: string) {
    const { error } = await supabase.from('inventory').delete().eq('id', id);
    if (error) throw error;
    await this.fetchInitialData(this.currentClientId, this.currentIsGlobal);
  }

  async saveVendor(vendor: Vendor) {
    const { error } = await supabase.from('vendors').upsert([{
      id: vendor.id || `vnd-${Date.now()}`,
      client_id: vendor.clientId,
      name: vendor.name,
      contact_person: vendor.contactPerson,
      email: vendor.email,
      phone: vendor.phone,
      invoices: vendor.invoices
    }]);
    if (error) throw error;
    await this.fetchInitialData(this.currentClientId, this.currentIsGlobal);
  }

  async saveInvoice(vendorId: string, invoice: VendorInvoice) {
    const vendor = this.vendors.find(v => v.id === vendorId);
    if (!vendor) return;

    const newInvoice = { ...invoice, id: invoice.id || `inv-${Date.now()}` };
    const updatedInvoices = vendor.invoices.some(i => i.id === newInvoice.id)
      ? vendor.invoices.map(i => i.id === newInvoice.id ? newInvoice : i)
      : [...vendor.invoices, newInvoice];

    const { error } = await supabase.from('vendors').update({ invoices: updatedInvoices }).eq('id', vendorId);
    if (error) throw error;
    await this.fetchInitialData(this.currentClientId, this.currentIsGlobal);
  }

  async deleteInvoice(vendorId: string, invoiceId: string) {
    const vendor = this.vendors.find(v => v.id === vendorId);
    if (!vendor) return;
    const updated = vendor.invoices.filter(i => i.id !== invoiceId);
    const { error } = await supabase.from('vendors').update({ invoices: updated }).eq('id', vendorId);
    if (error) throw error;
    await this.fetchInitialData(this.currentClientId, this.currentIsGlobal);
  }

  async getReportData(clientId: string) {
    const items = this.items.filter(i => i.clientId === clientId);
    const vendors = this.vendors.filter(v => v.clientId === clientId);
    const requests = this.requests.filter(r => r.clientId === clientId);

    let totalPaid = 0;
    let totalPending = 0;
    vendors.forEach(v => {
      v.invoices?.forEach(inv => {
        totalPaid += Number(inv.paidAmount || 0);
        totalPending += (Number(inv.totalAmount || 0) - Number(inv.paidAmount || 0));
      });
    });

    const categories = Array.from(new Set(items.map(i => i.category)));
    const catDist = categories.map(c => ({
      name: c,
      value: items.filter(i => i.category === c).length
    }));

    const depts = Array.from(new Set(requests.map(r => r.department)));
    const deptUsage = depts.map(d => ({
      name: d,
      value: requests.filter(r => r.department === d).length
    }));

    return {
      finance: { totalPaid, totalPending, totalPayable: totalPaid + totalPending },
      inventory: { totalItems: items.length, lowStockCount: items.filter(i => i.currentStock <= i.minStockLevel).length, categoryDistribution: catDist },
      consumption: { byDept: deptUsage }
    };
  }

  private saveDemoStorage() {
    localStorage.setItem(DEMO_ITEMS_KEY, JSON.stringify(this.items));
    localStorage.setItem(DEMO_REQUESTS_KEY, JSON.stringify(this.requests));
    localStorage.setItem(DEMO_VENDORS_KEY, JSON.stringify(this.vendors));
  }

  async getDemoLeads() {
    const { data } = await supabase.from('demo_leads').select('*').order('registered_at', { ascending: false });
    return data || [];
  }

  async initiateDemoLead(lead: Partial<DemoLead>) {
    const clientId = `DEMO-${Math.random().toString(36).slice(-4).toUpperCase()}`;
    const newLead: DemoLead = {
      id: `lead-${Date.now()}`,
      fullName: lead.fullName!,
      hotelName: lead.hotelName!,
      position: lead.position!,
      location: lead.location!,
      email: lead.email!,
      mobile: lead.mobile!,
      registeredAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
      clientId,
      status: 'PENDING'
    };
    const { error } = await supabase.from('demo_leads').insert([newLead]);
    if (error) throw error;
    return newLead;
  }

  async finalizeDemo(lead: DemoLead, password: string) {
    const { error } = await supabase.from('users').insert([{
      id: `u-${lead.clientId}`,
      client_id: lead.clientId,
      username: 'admin',
      full_name: lead.fullName,
      role: UserRole.HOTEL_ADMIN,
      department: Department.ADMIN,
      password: password
    }]);
    if (error) throw error;
    await supabase.from('hotels').insert([{
      id: lead.clientId,
      name: `${lead.hotelName} (Demo)`,
      is_active: true,
      max_users: 5,
      max_items: 100
    }]);
  }

  async saveUser(user: User) {
    const { error } = await supabase.from('users').upsert([{
      id: user.id || `u-${Date.now()}`,
      client_id: user.clientId,
      username: user.username,
      full_name: user.fullName,
      email: user.email,
      role: user.role,
      department: user.department,
      permissions: user.permissions,
      password: user.password
    }]);
    if (error) throw error;
    await this.fetchInitialData(this.currentClientId, this.currentIsGlobal);
  }

  async createHotelWithAdmin(hotel: Hotel, admin: any) {
    await supabase.from('hotels').insert([{
      id: hotel.id,
      name: hotel.name,
      is_active: hotel.isActive,
      max_users: hotel.maxUsers,
      max_items: hotel.maxItems,
      contact_email: hotel.contactEmail
    }]);
    
    await supabase.from('users').insert([{
      client_id: hotel.id,
      username: admin.username,
      full_name: admin.fullName,
      email: admin.email,
      role: UserRole.HOTEL_ADMIN,
      department: Department.ADMIN,
      password: admin.password,
      permissions: ['MANAGE_USERS', 'APPROVE_REQUESTS', 'MANAGE_INVENTORY', 'MANAGE_CONSUMPTION', 'MANAGE_FINANCE']
    }]);
  }

  async updateHotel(hotel: Hotel) {
    const { error } = await supabase.from('hotels').update({
      name: hotel.name,
      is_active: hotel.isActive,
      max_users: hotel.maxUsers,
      max_items: hotel.maxItems,
      contact_email: hotel.contactEmail
    }).eq('id', hotel.id);
    if (error) throw error;
    await this.fetchInitialData(this.currentClientId, this.currentIsGlobal);
  }

  async forceResetAdminPassword(clientId: string, pass: string) {
    await supabase.from('users').update({ password: pass }).eq('client_id', clientId).eq('username', 'admin');
  }

  async deleteHotel(id: string) {
    await supabase.from('users').delete().eq('client_id', id);
    await supabase.from('inventory').delete().eq('client_id', id);
    await supabase.from('requests').delete().eq('client_id', id);
    await supabase.from('vendors').delete().eq('client_id', id);
    await supabase.from('hotels').delete().eq('id', id);
    await this.fetchInitialData(this.currentClientId, this.currentIsGlobal);
  }

  async changePassword(userId: string, old: string, next: string) {
    const { data } = await supabase.from('users').select('password').eq('id', userId).single();
    if (data?.password !== old) throw new Error("Incorrect current key.");
    await supabase.from('users').update({ password: next }).eq('id', userId);
  }
}

export const store = new ZinicStore();
