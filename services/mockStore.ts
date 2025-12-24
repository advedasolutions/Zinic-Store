import { User, Hotel, InventoryItem, StockRequest, Vendor, UserRole, Department, RequestStatus, DemoLead, VendorInvoice } from '../types.ts';
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
    this.refreshHotels();
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

  public async refreshHotels() {
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
    if (!h) throw new Error("Terminal Registry Corrupted: Hotel entity missing.");
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
    if (!u) throw new Error("Identity Protocol Failure: User data missing.");
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
    } as any;
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

  async initRealtimeSync(clientId: string, role?: UserRole) {
    if (!clientId) return;
    this.isDemoMode = false;
    const normalizedId = clientId.trim();
    const isGlobalSync = role === UserRole.SUPERADMIN;
    
    this.currentClientId = normalizedId;
    this.currentIsGlobal = isGlobalSync;
    
    try {
      await Promise.all(this.channels.map(ch => supabase.removeChannel(ch)));
      this.channels = [];
      
      await this.fetchInitialData(normalizedId, isGlobalSync);
      
      const channel = supabase
        .channel(`zinic-node-${Date.now()}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'hotels' }, () => this.fetchInitialData(this.currentClientId, this.currentIsGlobal))
        .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, () => this.fetchInitialData(this.currentClientId, this.currentIsGlobal))
        .on('postgres_changes', { event: '*', schema: 'public', table: 'inventory' }, () => this.fetchInitialData(this.currentClientId, this.currentIsGlobal))
        .on('postgres_changes', { event: '*', schema: 'public', table: 'requests' }, () => this.fetchInitialData(this.currentClientId, this.currentIsGlobal))
        .on('postgres_changes', { event: '*', schema: 'public', table: 'vendors' }, () => this.fetchInitialData(this.currentClientId, this.currentIsGlobal))
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            this.dbStatus = 'CONNECTED';
            this.notify();
          }
        });
        
      this.channels.push(channel);
    } catch (e) { 
      console.error("Sync Engine Error:", e); 
    }
  }

  private async fetchInitialData(clientId: string, isGlobal: boolean) {
    if (this.isDemoMode) {
      this.loadDemoStorage();
      return;
    }
    try {
      const [hotelsRes, usersRes, itemsRes, requestsRes, vendorsRes] = await Promise.all([
        isGlobal ? supabase.from('hotels').select('*').order('name') : supabase.from('hotels').select('*').ilike('id', clientId),
        isGlobal ? supabase.from('users').select('*') : supabase.from('users').select('*').ilike('client_id', clientId),
        isGlobal ? supabase.from('inventory').select('*') : supabase.from('inventory').select('*').ilike('client_id', clientId),
        isGlobal ? supabase.from('requests').select('*').order('requested_at', { ascending: false }) : supabase.from('requests').select('*').ilike('client_id', clientId).order('requested_at', { ascending: false }),
        isGlobal ? supabase.from('vendors').select('*') : supabase.from('vendors').select('*').ilike('client_id', clientId)
      ]);

      if (hotelsRes.data) this.hotels = hotelsRes.data.map(h => this.mapHotel(h));
      if (usersRes.data) this.users = usersRes.data.map(u => this.mapUser(u));
      if (itemsRes.data) this.items = itemsRes.data.map(i => this.mapItem(i));
      if (requestsRes.data) this.requests = requestsRes.data.map(r => this.mapRequest(r));
      if (vendorsRes.data) this.vendors = vendorsRes.data.map(v => this.mapVendor(v));
      
      this.notify();
    } catch (e) {
      console.error("Data Hydration Failed:", e);
    }
  }

  private loadDemoStorage() {
    const items = localStorage.getItem(DEMO_ITEMS_KEY);
    const requests = localStorage.getItem(DEMO_REQUESTS_KEY);
    const vendors = localStorage.getItem(DEMO_VENDORS_KEY);

    this.items = items ? JSON.parse(items) : this.generateMockItems();
    this.requests = requests ? JSON.parse(requests) : [];
    this.vendors = vendors ? JSON.parse(vendors) : [];
    
    if (!items) this.saveDemoStorage();
    this.notify();
  }

  private saveDemoStorage() {
    localStorage.setItem(DEMO_ITEMS_KEY, JSON.stringify(this.items));
    localStorage.setItem(DEMO_REQUESTS_KEY, JSON.stringify(this.requests));
    localStorage.setItem(DEMO_VENDORS_KEY, JSON.stringify(this.vendors));
  }

  private generateMockItems(): InventoryItem[] {
    const categories = ['Dry Goods', 'Perishables', 'Housekeeping', 'F&B'];
    const names = ['Basmati Rice', 'Cooking Oil', 'Liquid Detergent', 'Bath Towels', 'Printer Ink', 'Napkins'];
    return names.map((name, i) => ({
      id: `demo-item-${i}`,
      clientId: this.currentClientId,
      name,
      category: categories[i % categories.length],
      unit: 'pcs',
      currentStock: Math.floor(Math.random() * 50) + 10,
      minStockLevel: 20,
      lastUpdated: new Date().toISOString()
    }));
  }

  async login(clientId: string, username: string, password: string): Promise<{user: User, hotel: Hotel, isDemo?: boolean} | null> {
    const normalizedClientId = clientId.trim().toUpperCase();
    
    try {
      const localDemo = localStorage.getItem('zinic_demo_account');
      if (localDemo) {
        const demoData = JSON.parse(localDemo);
        const isExpired = new Date(demoData.expiresAt).getTime() < Date.now();
        
        if (!isExpired && demoData.clientId === normalizedClientId && username === 'admin' && demoData.password === password) {
             this.isDemoMode = true;
             this.currentClientId = normalizedClientId;
             this.loadDemoStorage();
             const demoUser: User = {
                id: 'demo-admin',
                clientId: demoData.clientId,
                username: 'admin',
                fullName: demoData.fullName,
                email: demoData.email,
                role: UserRole.HOTEL_ADMIN,
                department: Department.ADMIN,
                permissions: ['MANAGE_USERS', 'APPROVE_REQUESTS', 'MANAGE_INVENTORY', 'MANAGE_CONSUMPTION', 'MANAGE_FINANCE'],
                password: password
             };
             const demoHotel: Hotel = {
                id: demoData.clientId,
                name: demoData.hotelName,
                isActive: true,
                maxUsers: 5,
                maxItems: 50,
                createdAt: demoData.registeredAt
             };
             return { user: demoUser, hotel: demoHotel, isDemo: true };
        }
      }
    } catch(e) { console.error("Demo login check failed", e); }

    try {
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('*')
        .ilike('client_id', normalizedClientId)
        .eq('username', username)
        .maybeSingle();
        
      if (userError) throw userError;
      if (!user) throw new Error("Invalid Node Credentials: User not found in this client cluster.");
      if (user.password !== password) throw new Error("Authorization Denied: Security key mismatch.");

      const { data: hotel, error: hotelError } = await supabase
        .from('hotels')
        .select('*')
        .ilike('id', user.client_id)
        .maybeSingle();
        
      if (hotelError) throw hotelError;

      const mappedHotel = this.mapHotel(hotel);
      const mappedUser = this.mapUser(user);

      if (mappedHotel && !mappedHotel.isActive && mappedUser.role !== UserRole.SUPERADMIN) {
        throw new Error("Terminal access suspended for this Client ID.");
      }
      
      await this.initRealtimeSync(mappedUser.clientId, mappedUser.role);
      return { user: mappedUser, hotel: mappedHotel };
    } catch (e) { throw e; }
  }

  async createHotelWithAdmin(hotel: Hotel, admin: any) {
    const { error: hotelError } = await supabase.from('hotels').insert({
      id: hotel.id.toUpperCase(),
      name: hotel.name,
      is_active: hotel.isActive,
      max_users: hotel.maxUsers,
      max_items: hotel.maxItems,
      contact_email: hotel.contactEmail
    });
    if (hotelError) throw new Error(`Registry Failure: ${hotelError.message}`);

    const { error: userError } = await supabase.from('users').insert({
      id: `u-${Date.now()}`,
      client_id: hotel.id.toUpperCase(),
      username: admin.username,
      full_name: admin.fullName,
      email: admin.email,
      role: UserRole.HOTEL_ADMIN,
      department: Department.ADMIN,
      permissions: ['MANAGE_USERS', 'APPROVE_REQUESTS', 'MANAGE_INVENTORY', 'MANAGE_CONSUMPTION', 'MANAGE_FINANCE'],
      password: admin.password
    });

    if (userError) {
      await supabase.from('hotels').delete().eq('id', hotel.id.toUpperCase());
      throw new Error(`Admin Provisioning Failure: ${userError.message}`);
    }
    
    await this.refreshHotels();
  }

  async updateHotel(hotel: Hotel) {
    const { error } = await supabase.from('hotels').upsert({
      id: hotel.id.toUpperCase(),
      name: hotel.name,
      is_active: hotel.isActive,
      max_users: hotel.maxUsers,
      max_items: hotel.maxItems,
      contact_email: hotel.contactEmail
    });
    if (error) throw new Error(`Cluster Update Error: ${error.message}`);
    await this.refreshHotels();
  }

  async deleteHotel(hotelId: string) {
    await supabase.from('users').delete().ilike('client_id', hotelId);
    await supabase.from('inventory').delete().ilike('client_id', hotelId);
    await supabase.from('requests').delete().ilike('client_id', hotelId);
    await supabase.from('vendors').delete().ilike('client_id', hotelId);
    
    const { error } = await supabase.from('hotels').delete().ilike('id', hotelId);
    if (error) throw new Error(`Decommission Failure: ${error.message}`);
    
    await this.refreshHotels();
  }

  async getHotels() { return this.hotels; }
  async getUsers(clientId: string) { return this.currentIsGlobal ? this.users : this.users.filter(u => u.clientId.toUpperCase() === clientId.toUpperCase()); }
  async getItems(clientId: string) { return this.currentIsGlobal ? this.items : this.items.filter(i => i.clientId.toUpperCase() === clientId.toUpperCase()); }
  async getRequests(clientId: string) { return this.currentIsGlobal ? this.requests : this.requests.filter(r => r.clientId.toUpperCase() === clientId.toUpperCase()); }
  async getVendors(clientId: string) { return this.currentIsGlobal ? this.vendors : this.vendors.filter(v => v.clientId.toUpperCase() === clientId.toUpperCase()); }

  async getStats(clientId: string) {
    const items = await this.getItems(clientId);
    const requests = await this.getRequests(clientId);
    const vendors = await this.getVendors(clientId);
    const users = await this.getUsers(clientId);
    
    return {
      totalItems: items.length,
      lowStock: items.filter(i => i.currentStock <= i.minStockLevel).length,
      pendingRequests: requests.filter(r => r.status === RequestStatus.PENDING).length,
      activeVendors: vendors.length,
      totalUsers: users.length
    };
  }

  async getDemoLeads() {
    try {
      const { data } = await supabase.from('demo_leads').select('*').order('registered_at', { ascending: false });
      return (data || []) as DemoLead[];
    } catch (e) { return []; }
  }

  async forceResetAdminPassword(hotelId: string, password: string) {
    await supabase.from('users').update({ password }).ilike('client_id', hotelId).eq('role', UserRole.HOTEL_ADMIN);
  }

  async getReportData(clientId: string) {
    const items = await this.getItems(clientId);
    const requests = await this.getRequests(clientId);
    const vendors = await this.getVendors(clientId);

    const finance = {
      totalPending: vendors.reduce((sum, v) => sum + (v.invoices?.reduce((s: number, i: any) => s + (i.totalAmount - i.paidAmount), 0) || 0), 0),
      totalPaid: vendors.reduce((sum, v) => sum + (v.invoices?.reduce((s: number, i: any) => s + i.paidAmount, 0) || 0), 0),
      totalPayable: vendors.reduce((sum, v) => sum + (v.invoices?.reduce((s: number, i: any) => s + i.totalAmount, 0) || 0), 0)
    };

    const categoryCounts: Record<string, number> = {};
    items.forEach(i => { categoryCounts[i.category] = (categoryCounts[i.category] || 0) + 1; });

    return { 
      finance, 
      inventory: { 
        totalItems: items.length, 
        lowStockCount: items.filter(i => i.currentStock <= i.minStockLevel).length, 
        categoryDistribution: Object.entries(categoryCounts).map(([name, value]) => ({ name, value })) 
      }, 
      consumption: { byDept: [] } 
    };
  }

  async initiateDemoLead(leadData: any) {
    const lead: DemoLead = { ...leadData, id: `lead-${Date.now()}`, clientId: `DEMO-${Math.floor(100000 + Math.random() * 900000)}`, registeredAt: new Date().toISOString(), expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(), status: 'PENDING' };
    await supabase.from('demo_leads').insert([{
      id: lead.id,
      full_name: lead.fullName,
      hotel_name: lead.hotelName,
      position: lead.position,
      location: lead.location,
      email: lead.email,
      mobile: lead.mobile,
      registered_at: lead.registeredAt,
      expires_at: lead.expiresAt,
      client_id: lead.clientId,
      status: lead.status
    }]);
    return lead;
  }

  async finalizeDemo(lead: DemoLead, password?: string) {
    await supabase.from('demo_leads').update({ status: 'VERIFIED' }).eq('id', lead.id);
    localStorage.setItem('zinic_demo_account', JSON.stringify({ ...lead, status: 'VERIFIED', password }));
    this.notify();
  }

  // Stock & Requisition methods omitted for brevity, assume they stay same as your zip
  async createRequest(req: StockRequest) { /* ... */ }
  async updateRequestStatus(reqId: string, status: RequestStatus) { /* ... */ }
  async consumeRequestItem(reqId: string, itemId: string, quantity: number, userId: string, remark: string, userName: string) { /* ... */ }
  async adjustStock(itemId: string, amount: number) { /* ... */ }
  async saveUser(user: User) { /* ... */ }
  async updateItem(item: InventoryItem) { /* ... */ }
  async deleteItem(itemId: string) { /* ... */ }
  async saveVendor(vendor: Vendor) { /* ... */ }
  async saveInvoice(vendorId: string, invoice: VendorInvoice) { /* ... */ }
  async deleteInvoice(vendorId: string, invoiceId: string) { /* ... */ }
  async changePassword(userId: string, old: string, newP: string) { /* ... */ }
}

export const store = new ZinicStore();