
import { User, Hotel, InventoryItem, StockRequest, Vendor, UserRole, Department, RequestStatus, DemoLead, VendorInvoice, DEFAULT_DEPARTMENTS, UserPermission } from '../types.ts';
import { supabase } from './supabase.ts';

const DEMO_ITEMS_KEY = 'zinic_demo_items';
const DEMO_REQUESTS_KEY = 'zinic_demo_requests';
const DEMO_VENDORS_KEY = 'zinic_demo_vendors';
const DEMO_DEPTS_KEY = 'zinic_demo_departments';
const DEMO_USERS_KEY = 'zinic_demo_users';

class ZinicStore {
  private listeners: Set<() => void> = new Set();
  private channels: any[] = [];
  private dbStatus: 'CONNECTED' | 'DISCONNECTED' | 'CONNECTING' = 'CONNECTING';
  
  private hotels: Hotel[] = [];
  private users: User[] = [];
  private items: InventoryItem[] = [];
  private requests: StockRequest[] = [];
  private vendors: Vendor[] = [];
  private departments: string[] = [];

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
      role: (u.role as string).toUpperCase() as UserRole,
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
    this.isDemoMode = clientId.startsWith('DEMO-');
    
    if (this.isDemoMode) {
      this.currentClientId = clientId;
      this.loadDemoStorage();
      return;
    }

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
        .on('postgres_changes', { event: '*', schema: 'public', table: 'departments' }, () => this.fetchInitialData(this.currentClientId, this.currentIsGlobal))
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
      const [hotelsRes, usersRes, itemsRes, requestsRes, vendorsRes, deptsRes] = await Promise.all([
        isGlobal ? supabase.from('hotels').select('*').order('name') : supabase.from('hotels').select('*').ilike('id', clientId),
        isGlobal ? supabase.from('users').select('*') : supabase.from('users').select('*').ilike('client_id', clientId),
        isGlobal ? supabase.from('inventory').select('*') : supabase.from('inventory').select('*').ilike('client_id', clientId),
        isGlobal ? supabase.from('requests').select('*').order('requested_at', { ascending: false }) : supabase.from('requests').select('*').ilike('client_id', clientId).order('requested_at', { ascending: false }),
        isGlobal ? supabase.from('vendors').select('*') : supabase.from('vendors').select('*').ilike('client_id', clientId),
        isGlobal ? supabase.from('departments').select('*') : supabase.from('departments').select('name').ilike('client_id', clientId)
      ]);

      if (hotelsRes.data) this.hotels = hotelsRes.data.map(h => this.mapHotel(h));
      if (usersRes.data) this.users = usersRes.data.map(u => this.mapUser(u));
      if (itemsRes.data) this.items = itemsRes.data.map(i => this.mapItem(i));
      if (requestsRes.data) this.requests = requestsRes.data.map(r => this.mapRequest(r));
      if (vendorsRes.data) this.vendors = vendorsRes.data.map(v => this.mapVendor(v));
      
      if (deptsRes.data && deptsRes.data.length > 0) {
        this.departments = deptsRes.data.map(d => d.name);
      } else {
        this.departments = [...DEFAULT_DEPARTMENTS];
      }
      
      this.notify();
    } catch (e) {
      console.error("Data Hydration Failed:", e);
    }
  }

  private loadDemoStorage() {
    const items = localStorage.getItem(DEMO_ITEMS_KEY);
    const requests = localStorage.getItem(DEMO_REQUESTS_KEY);
    const vendors = localStorage.getItem(DEMO_VENDORS_KEY);
    const depts = localStorage.getItem(DEMO_DEPTS_KEY);
    const users = localStorage.getItem(DEMO_USERS_KEY);

    this.items = items ? JSON.parse(items) : this.generateMockItems();
    this.requests = requests ? JSON.parse(requests) : [];
    this.vendors = vendors ? JSON.parse(vendors) : [];
    this.departments = depts ? JSON.parse(depts) : [...DEFAULT_DEPARTMENTS];
    this.users = users ? JSON.parse(users) : [];
    
    if (!items) this.saveDemoStorage();
    this.notify();
  }

  private saveDemoStorage() {
    localStorage.setItem(DEMO_ITEMS_KEY, JSON.stringify(this.items));
    localStorage.setItem(DEMO_REQUESTS_KEY, JSON.stringify(this.requests));
    localStorage.setItem(DEMO_VENDORS_KEY, JSON.stringify(this.vendors));
    localStorage.setItem(DEMO_DEPTS_KEY, JSON.stringify(this.departments));
    localStorage.setItem(DEMO_USERS_KEY, JSON.stringify(this.users));
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
             
             const demoPermissions: UserPermission[] = [
               'dashboard:view', 'inventory:view', 'inventory:add', 'inventory:modify',
               'requests:view', 'requests:add', 'requests:modify', 'reports:view',
               'users:view', 'users:add', 'users:modify', 'vendors:view',
               'vendors:add', 'vendors:modify', 'settings:view', 'support:view'
             ];

             const demoUser: User = {
                id: 'demo-admin',
                clientId: demoData.clientId,
                username: 'admin',
                fullName: demoData.fullName,
                email: demoData.email,
                role: UserRole.HOTEL_ADMIN,
                department: 'Admin',
                permissions: demoPermissions,
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
             if (!this.users.find(u => u.id === demoUser.id)) {
               this.users.push(demoUser);
               this.saveDemoStorage();
             }
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
      
      this.isDemoMode = false;
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

    const adminPermissions: UserPermission[] = [
      'dashboard:view', 'inventory:view', 'inventory:add', 'inventory:modify',
      'requests:view', 'requests:add', 'requests:modify', 'reports:view',
      'users:view', 'users:add', 'users:modify', 'vendors:view',
      'vendors:add', 'vendors:modify', 'settings:view', 'support:view'
    ];

    const { error: userError } = await supabase.from('users').insert({
      id: `u-${Date.now()}`,
      client_id: hotel.id.toUpperCase(),
      username: admin.username,
      full_name: admin.fullName,
      email: admin.email,
      role: UserRole.HOTEL_ADMIN,
      department: 'Admin',
      permissions: adminPermissions,
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
    await supabase.from('departments').delete().ilike('client_id', hotelId);
    
    const { error } = await supabase.from('hotels').delete().ilike('id', hotelId);
    if (error) throw new Error(`Decommission Failure: ${error.message}`);
    
    await this.refreshHotels();
  }

  async getHotels() { return this.hotels; }
  async getUsers(clientId: string) { return this.currentIsGlobal ? this.users : this.users.filter(u => u.clientId.toUpperCase() === clientId.toUpperCase()); }
  async getItems(clientId: string) { return this.currentIsGlobal ? this.items : this.items.filter(i => i.clientId.toUpperCase() === clientId.toUpperCase()); }
  async getRequests(clientId: string) { return this.currentIsGlobal ? this.requests : this.requests.filter(r => r.clientId.toUpperCase() === clientId.toUpperCase()); }
  async getVendors(clientId: string) { return this.currentIsGlobal ? this.vendors : this.vendors.filter(v => v.clientId.toUpperCase() === clientId.toUpperCase()); }
  async getDepartments(clientId: string) { return this.departments; }

  async addDepartment(clientId: string, name: string) {
    if (this.isDemoMode) {
      this.departments = [...this.departments, name];
      this.saveDemoStorage();
      this.notify();
      return;
    }
    const { error } = await supabase.from('departments').insert([{
      client_id: clientId.toUpperCase(),
      name: name
    }]);
    if (error) throw error;
    await this.fetchInitialData(this.currentClientId, this.currentIsGlobal);
  }

  async deleteDepartment(clientId: string, name: string) {
    if (this.isDemoMode) {
      this.departments = this.departments.filter(d => d !== name);
      this.saveDemoStorage();
      this.notify();
      return;
    }
    const { error } = await supabase.from('departments').delete().ilike('client_id', clientId).eq('name', name);
    if (error) throw error;
    await this.fetchInitialData(this.currentClientId, this.currentIsGlobal);
  }

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

  async createRequest(req: StockRequest) {
    if (this.isDemoMode) {
      const newReq = { ...req, id: req.id || `req-${Date.now()}-${Math.floor(Math.random() * 1000)}` };
      this.requests = [newReq, ...this.requests];
      this.saveDemoStorage();
      this.notify();
      return;
    }
    const { error } = await supabase.from('requests').insert([{
      id: req.id || `req-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      client_id: req.clientId,
      requester_id: req.requesterId,
      requester_name: req.requesterName,
      department: req.department,
      items: req.items,
      status: req.status,
      requested_at: req.requestedAt
    }]);
    if (error) throw error;
  }

  async updateRequestStatus(reqId: string, status: RequestStatus) {
    if (this.isDemoMode) {
      this.requests = this.requests.map(r => r.id === reqId ? { ...r, status } : r);
      this.saveDemoStorage();
      this.notify();
      return;
    }
    const { error } = await supabase.from('requests').update({ status }).eq('id', reqId);
    if (error) throw error;
    
    // Update local cache and notify listeners
    this.requests = this.requests.map(r => r.id === reqId ? { ...r, status } : r);
    this.notify();
  }

  async consumeRequestItem(reqId: string, itemId: string, quantity: number, userId: string, remark: string, userName: string) {
    if (this.isDemoMode) {
      const request = this.requests.find(r => r.id === reqId);
      if (!request) return;
      
      const updatedItems = request.items.map((item: any) => {
        if (item.itemId === itemId) {
          const logs = item.logs || [];
          logs.push({ id: `log-${Date.now()}`, amount: quantity, remark, timestamp: new Date().toISOString(), userId, userName });
          return { ...item, consumedQuantity: (item.consumedQuantity || 0) + quantity, logs };
        }
        return item;
      });

      const isFullyConsumed = updatedItems.every((item: any) => item.consumedQuantity >= item.quantity);
      const newStatus = isFullyConsumed ? RequestStatus.CONSUMED : request.status;
      
      this.requests = this.requests.map(r => r.id === reqId ? { ...r, items: updatedItems, status: newStatus } : r);
      this.saveDemoStorage();
      this.adjustStock(itemId, -quantity);
      this.notify();
      return;
    }
    
    const { data: request } = await supabase.from('requests').select('*').eq('id', reqId).single();
    if (!request) throw new Error("Request not found");
    
    const updatedItems = request.items.map((item: any) => {
      if (item.itemId === itemId) {
        const logs = item.logs || [];
        logs.push({ id: `log-${Date.now()}`, amount: quantity, remark, timestamp: new Date().toISOString(), userId, userName });
        return { ...item, consumedQuantity: (item.consumedQuantity || 0) + quantity, logs };
      }
      return item;
    });

    const isFullyConsumed = updatedItems.every((item: any) => item.consumedQuantity >= item.quantity);
    const newStatus = isFullyConsumed ? RequestStatus.CONSUMED : request.status;

    const { error } = await supabase.from('requests').update({ items: updatedItems, status: newStatus }).eq('id', reqId);
    if (error) throw error;
    
    await this.adjustStock(itemId, -quantity);
    
    // Update local cache and notify listeners
    this.requests = this.requests.map(r => r.id === reqId ? { ...r, items: updatedItems, status: newStatus } : r);
    this.notify();
  }

  async adjustStock(itemId: string, amount: number) {
    if (this.isDemoMode) {
      this.items = this.items.map(i => i.id === itemId ? { ...i, currentStock: Math.max(0, i.currentStock + amount), lastUpdated: new Date().toISOString() } : i);
      this.saveDemoStorage();
      this.notify();
      return;
    }
    const { data: item } = await supabase.from('inventory').select('current_stock').eq('id', itemId).single();
    if (item) {
      const newStock = Math.max(0, item.current_stock + amount);
      const { error } = await supabase.from('inventory').update({ current_stock: newStock, last_updated: new Date().toISOString() }).eq('id', itemId);
      if (error) throw error;
      
      // Update local cache and notify
      this.items = this.items.map(i => i.id === itemId ? { ...i, currentStock: newStock, lastUpdated: new Date().toISOString() } : i);
      this.notify();
    }
  }

  async saveUser(user: User) {
    if (this.isDemoMode) {
      const idx = this.users.findIndex(u => u.id === user.id);
      if (idx >= 0) this.users[idx] = user;
      else this.users.push({ ...user, id: user.id || `u-${Date.now()}` });
      this.saveDemoStorage();
      this.notify();
      return;
    }
    const { error } = await supabase.from('users').upsert({
      id: user.id || `u-${Date.now()}`,
      client_id: user.clientId,
      username: user.username,
      full_name: user.fullName,
      email: user.email,
      role: user.role,
      department: user.department,
      permissions: user.permissions,
      password: user.password
    });
    if (error) throw error;
    await this.fetchInitialData(this.currentClientId, this.currentIsGlobal);
  }

  async updateItem(item: InventoryItem) {
    if (this.isDemoMode) {
      const idx = this.items.findIndex(i => i.id === item.id);
      if (idx >= 0) this.items[idx] = item;
      else this.items.push(item);
      this.saveDemoStorage();
      this.notify();
      return;
    }
    const { error } = await supabase.from('inventory').upsert({
      id: item.id,
      client_id: item.clientId,
      name: item.name,
      category: item.category,
      unit: item.unit,
      current_stock: item.currentStock,
      min_stock_level: item.minStockLevel,
      vendor_id: item.vendorId,
      last_updated: item.lastUpdated
    });
    if (error) throw error;
    await this.fetchInitialData(this.currentClientId, this.currentIsGlobal);
  }

  async deleteItem(itemId: string) {
    if (this.isDemoMode) {
      this.items = this.items.filter(i => i.id !== itemId);
      this.saveDemoStorage();
      this.notify();
      return;
    }
    const { error } = await supabase.from('inventory').delete().eq('id', itemId);
    if (error) throw error;
    await this.fetchInitialData(this.currentClientId, this.currentIsGlobal);
  }

  async saveVendor(vendor: Vendor) {
    if (this.isDemoMode) {
      const idx = this.vendors.findIndex(v => v.id === vendor.id);
      if (idx >= 0) this.vendors[idx] = vendor;
      else this.vendors.push({ ...vendor, id: vendor.id || `v-${Date.now()}` });
      this.saveDemoStorage();
      this.notify();
      return;
    }
    const { error } = await supabase.from('vendors').upsert({
      id: vendor.id || `v-${Date.now()}`,
      client_id: vendor.clientId,
      name: vendor.name,
      contact_person: vendor.contactPerson,
      email: vendor.email,
      phone: vendor.phone,
      invoices: vendor.invoices
    });
    if (error) throw error;
    await this.fetchInitialData(this.currentClientId, this.currentIsGlobal);
  }

  async saveInvoice(vendorId: string, invoice: VendorInvoice) {
    if (this.isDemoMode) {
      const vendor = this.vendors.find(v => v.id === vendorId);
      if (vendor) {
        const invoices = vendor.invoices || [];
        const idx = invoices.findIndex((i: any) => i.id === invoice.id);
        if (idx >= 0) invoices[idx] = invoice;
        else invoices.push({ ...invoice, id: `inv-${Date.now()}` });
        this.vendors = this.vendors.map(v => v.id === vendorId ? { ...v, invoices } : v);
        this.saveDemoStorage();
        this.notify();
      }
      return;
    }
    const { data: vendor } = await supabase.from('vendors').select('invoices').eq('id', vendorId).single();
    if (vendor) {
      const invoices = vendor.invoices || [];
      const idx = invoices.findIndex((i: any) => i.id === invoice.id);
      if (idx >= 0) invoices[idx] = invoice;
      else invoices.push({ ...invoice, id: `inv-${Date.now()}` });
      await supabase.from('vendors').update({ invoices }).eq('id', vendorId);
      await this.fetchInitialData(this.currentClientId, this.currentIsGlobal);
    }
  }

  async deleteInvoice(vendorId: string, invoiceId: string) {
    if (this.isDemoMode) {
      const vendor = this.vendors.find(v => v.id === vendorId);
      if (vendor) {
        const invoices = (vendor.invoices || []).filter((i: any) => i.id !== invoiceId);
        this.vendors = this.vendors.map(v => v.id === vendorId ? { ...v, invoices } : v);
        this.saveDemoStorage();
        this.notify();
      }
      return;
    }
    const { data: vendor } = await supabase.from('vendors').select('invoices').eq('id', vendorId).single();
    if (vendor) {
      const invoices = (vendor.invoices || []).filter((i: any) => i.id !== invoiceId);
      await supabase.from('vendors').update({ invoices }).eq('id', vendorId);
      await this.fetchInitialData(this.currentClientId, this.currentIsGlobal);
    }
  }

  async changePassword(userId: string, old: string, newP: string) {
    if (this.isDemoMode) {
      const user = this.users.find(u => u.id === userId);
      if (user?.password === old) {
        this.users = this.users.map(u => u.id === userId ? { ...u, password: newP } : u);
        this.saveDemoStorage();
        this.notify();
      } else {
        throw new Error("Handshake denied: Old password incorrect.");
      }
      return;
    }
    const { data: user } = await supabase.from('users').select('password').eq('id', userId).single();
    if (user?.password === old) {
      await supabase.from('users').update({ password: newP }).eq('id', userId);
    } else {
      throw new Error("Handshake denied: Old password incorrect.");
    }
  }
}

export const store = new ZinicStore();
