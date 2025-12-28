import { User, Hotel, InventoryItem, StockRequest, Vendor, UserRole, Department, RequestStatus, DemoLead, VendorInvoice, DEFAULT_DEPARTMENTS, UserPermission, AuditRecord, InternalTransfer } from '../types.ts';
import { supabase } from './supabase.ts';
import { notificationService } from './notificationService.ts';

const DEMO_ITEMS_KEY = 'zinic_demo_items';
const DEMO_REQUESTS_KEY = 'zinic_demo_requests';
const DEMO_VENDORS_KEY = 'zinic_demo_vendors';
const DEMO_DEPTS_KEY = 'zinic_demo_departments';
const DEMO_USERS_KEY = 'zinic_demo_users';
const DEMO_AUDITS_KEY = 'zinic_demo_audits';
const DEMO_TRANSFERS_KEY = 'zinic_demo_transfers';

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
  private audits: AuditRecord[] = [];
  private transfers: InternalTransfer[] = [];

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

  private mapAudit(a: any): AuditRecord {
    return {
      id: a.id,
      clientId: a.client_id,
      auditDate: a.audit_date,
      auditorId: a.auditor_id,
      auditorName: a.auditor_name,
      category: a.category,
      items: a.items || [],
      status: a.status
    };
  }

  private mapTransfer(t: any): InternalTransfer {
    return {
      id: t.id,
      clientId: t.client_id,
      fromDept: t.from_dept,
      toDept: t.to_dept,
      initiatedBy: t.initiated_by,
      initiatedAt: t.initiated_at,
      items: t.items || [],
      status: t.status,
      receivedAt: t.received_at,
      receivedBy: t.received_by
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
        .on('postgres_changes', { event: '*', schema: 'public', table: 'requests' }, (payload) => {
          if (payload.eventType === 'INSERT') {
            notificationService.notifyNewOrder(payload.new.id, payload.new.department);
          }
          this.fetchInitialData(this.currentClientId, this.currentIsGlobal);
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'vendors' }, () => this.fetchInitialData(this.currentClientId, this.currentIsGlobal))
        .on('postgres_changes', { event: '*', schema: 'public', table: 'departments' }, () => this.fetchInitialData(this.currentClientId, this.currentIsGlobal))
        .on('postgres_changes', { event: '*', schema: 'public', table: 'audits' }, () => this.fetchInitialData(this.currentClientId, this.currentIsGlobal))
        .on('postgres_changes', { event: '*', schema: 'public', table: 'transfers' }, () => this.fetchInitialData(this.currentClientId, this.currentIsGlobal))
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
      const [hotelsRes, usersRes, itemsRes, requestsRes, vendorsRes, deptsRes, auditsRes, transfersRes] = await Promise.all([
        isGlobal ? supabase.from('hotels').select('*').order('name') : supabase.from('hotels').select('*').ilike('id', clientId),
        isGlobal ? supabase.from('users').select('*') : supabase.from('users').select('*').ilike('client_id', clientId),
        isGlobal ? supabase.from('inventory').select('*') : supabase.from('inventory').select('*').ilike('client_id', clientId),
        isGlobal ? supabase.from('requests').select('*').order('requested_at', { ascending: false }) : supabase.from('requests').select('*').ilike('client_id', clientId).order('requested_at', { ascending: false }),
        isGlobal ? supabase.from('vendors').select('*') : supabase.from('vendors').select('*').ilike('client_id', clientId),
        isGlobal ? supabase.from('departments').select('*') : supabase.from('departments').select('name').ilike('client_id', clientId),
        isGlobal ? supabase.from('audits').select('*').order('audit_date', { ascending: false }) : supabase.from('audits').select('*').ilike('client_id', clientId).order('audit_date', { ascending: false }),
        isGlobal ? supabase.from('transfers').select('*').order('initiated_at', { ascending: false }) : supabase.from('transfers').select('*').ilike('client_id', clientId).order('initiated_at', { ascending: false })
      ]);

      if (hotelsRes.data) this.hotels = hotelsRes.data.map(h => this.mapHotel(h));
      if (usersRes.data) this.users = usersRes.data.map(u => this.mapUser(u));
      if (itemsRes.data) this.items = itemsRes.data.map(i => this.mapItem(i));
      if (requestsRes.data) this.requests = requestsRes.data.map(r => this.mapRequest(r));
      if (vendorsRes.data) this.vendors = vendorsRes.data.map(v => this.mapVendor(v));
      if (auditsRes.data) this.audits = auditsRes.data.map(a => this.mapAudit(a));
      if (transfersRes.data) this.transfers = transfersRes.data.map(t => this.mapTransfer(t));
      
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
    const audits = localStorage.getItem(DEMO_AUDITS_KEY);
    const transfers = localStorage.getItem(DEMO_TRANSFERS_KEY);

    this.items = items ? JSON.parse(items) : this.generateMockItems();
    this.requests = requests ? JSON.parse(requests) : [];
    this.vendors = vendors ? JSON.parse(vendors) : [];
    this.departments = depts ? JSON.parse(depts) : [...DEFAULT_DEPARTMENTS];
    this.users = users ? JSON.parse(users) : [];
    this.audits = audits ? JSON.parse(audits) : [];
    this.transfers = transfers ? JSON.parse(transfers) : [];
    
    if (!items) this.saveDemoStorage();
    this.notify();
  }

  private saveDemoStorage() {
    localStorage.setItem(DEMO_ITEMS_KEY, JSON.stringify(this.items));
    localStorage.setItem(DEMO_REQUESTS_KEY, JSON.stringify(this.requests));
    localStorage.setItem(DEMO_VENDORS_KEY, JSON.stringify(this.vendors));
    localStorage.setItem(DEMO_DEPTS_KEY, JSON.stringify(this.departments));
    localStorage.setItem(DEMO_USERS_KEY, JSON.stringify(this.users));
    localStorage.setItem(DEMO_AUDITS_KEY, JSON.stringify(this.audits));
    localStorage.setItem(DEMO_TRANSFERS_KEY, JSON.stringify(this.transfers));
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
    const normalizedUser = username.trim().toLowerCase();

    try {
      const localDemo = localStorage.getItem('zinic_demo_account');
      if (localDemo) {
        const demoData = JSON.parse(localDemo);
        if (demoData.clientId.toUpperCase() === normalizedClientId && normalizedUser === 'admin' && demoData.password === password) {
             this.isDemoMode = true;
             this.currentClientId = normalizedClientId;
             this.loadDemoStorage();
             const demoPermissions: UserPermission[] = [
               'dashboard:view', 'inventory:view', 'inventory:add', 'inventory:modify',
               'requests:view', 'requests:add', 'requests:modify', 'reports:view',
               'users:view', 'users:add', 'users:modify', 'vendors:view',
               'vendors:add', 'vendors:modify', 'settings:view', 'support:view',
               'audit:view', 'audit:modify', 'transfers:view', 'transfers:modify'
             ];
             const demoUser: User = {
                id: 'demo-admin',
                clientId: demoData.clientId,
                username: 'admin',
                fullName: demoData.fullName,
                role: UserRole.HOTEL_ADMIN,
                department: 'Admin',
                permissions: demoPermissions
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
    } catch(e) {}

    try {
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('*')
        .ilike('client_id', normalizedClientId)
        .ilike('username', normalizedUser) // Changed to case-insensitive ilike
        .maybeSingle();

      if (userError || !user) return null;
      if (user.password !== password) return null;

      const mappedUser = this.mapUser(user);
      const { data: hotel } = await supabase.from('hotels').select('*').ilike('id', user.client_id).maybeSingle();
      
      const mappedHotel = hotel ? this.mapHotel(hotel) : (mappedUser.role === UserRole.SUPERADMIN ? {
        id: 'SUPERADMIN',
        name: 'Zinic Infrastructure Hub',
        isActive: true,
        maxUsers: 999,
        maxItems: 9999,
        createdAt: new Date().toISOString()
      } : null);

      if (!mappedHotel) return null;

      this.isDemoMode = false;
      await this.initRealtimeSync(mappedUser.clientId, mappedUser.role);
      return { user: mappedUser, hotel: mappedHotel };
    } catch (e) {
      return null;
    }
  }

  async initiateDemoLead(data: any): Promise<DemoLead> {
    const lead: DemoLead = {
      id: `lead-${Date.now()}`,
      fullName: data.fullName,
      hotelName: data.hotelName,
      position: data.position,
      location: data.location,
      email: data.email,
      mobile: data.mobile,
      registeredAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
      clientId: `DEMO-${Math.random().toString(36).slice(-4).toUpperCase()}`,
      status: 'VERIFIED'
    };
    return lead;
  }

  async finalizeDemo(lead: DemoLead, autoPass: string) {
    const demoAccount = {
      clientId: lead.clientId,
      hotelName: lead.hotelName,
      fullName: lead.fullName,
      password: autoPass,
      registeredAt: lead.registeredAt
    };
    localStorage.setItem('zinic_demo_account', JSON.stringify(demoAccount));
  }

  async getItems(clientId: string) { return this.items.filter(i => i.clientId === clientId); }
  async getRequests(clientId: string) { return this.requests.filter(r => r.clientId === clientId); }
  async getVendors(clientId: string) { return this.vendors.filter(v => v.clientId === clientId); }
  async getUsers(clientId: string) { return this.users.filter(u => u.clientId === clientId); }
  async getDepartments(clientId: string) { return this.departments; }
  async getHotels() { return this.hotels; }
  async getDemoLeads() { return []; }

  async updateHotel(hotel: Hotel) {
    if (this.isDemoMode) return;
    const { error } = await supabase.from('hotels').update({
      name: hotel.name,
      is_active: hotel.isActive,
      max_users: hotel.maxUsers,
      max_items: hotel.maxItems,
      contact_email: hotel.contactEmail
    }).eq('id', hotel.id);
    if (error) throw error;
    await this.refreshHotels();
  }

  async deleteHotel(hotelId: string) {
    if (this.isDemoMode) return;
    const { error } = await supabase.from('hotels').delete().eq('id', hotelId);
    if (error) throw error;
    await this.refreshHotels();
  }

  async forceResetAdminPassword(hotelId: string, password: string) {
    if (this.isDemoMode) return;
    const { error } = await supabase.from('users').update({ password }).eq('client_id', hotelId).eq('role', 'hotel_admin');
    if (error) throw error;
  }

  async createHotelWithAdmin(hotel: Hotel, admin: any) {
    if (this.isDemoMode) return;
    const { error: hError } = await supabase.from('hotels').insert({
      id: hotel.id,
      name: hotel.name,
      is_active: true,
      max_users: hotel.maxUsers,
      max_items: hotel.maxItems,
      contact_email: hotel.contactEmail
    });
    if (hError) throw hError;

    const { error: uError } = await supabase.from('users').insert({
      client_id: hotel.id,
      full_name: admin.fullName,
      email: admin.email,
      username: admin.username.trim().toLowerCase(),
      password: admin.password,
      role: 'hotel_admin',
      department: 'Admin',
      permissions: [
        'dashboard:view', 'inventory:view', 'inventory:add', 'inventory:modify',
        'requests:view', 'requests:add', 'requests:modify', 'reports:view',
        'users:view', 'users:add', 'users:modify', 'vendors:view',
        'vendors:add', 'vendors:modify', 'settings:view', 'support:view',
        'audit:view', 'audit:modify', 'transfers:view', 'transfers:modify'
      ]
    });
    if (uError) throw uError;
    await this.refreshHotels();
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
      min_stock_level: item.min_stock_level,
      vendor_id: item.vendor_id,
      last_updated: item.last_updated
    });
    if (error) throw error;
  }

  async bulkUpdateItems(items: InventoryItem[]) {
    if (this.isDemoMode) {
      items.forEach(item => {
        const idx = this.items.findIndex(i => i.id === item.id);
        if (idx >= 0) this.items[idx] = item;
        else this.items.push(item);
      });
      this.saveDemoStorage();
      this.notify();
      return;
    }
    const payload = items.map(item => ({
      id: item.id,
      client_id: item.clientId,
      name: item.name,
      category: item.category,
      unit: item.unit,
      current_stock: item.currentStock,
      min_stock_level: item.min_stock_level,
      vendor_id: item.vendorId,
      last_updated: item.last_updated
    }));
    const { error } = await supabase.from('inventory').upsert(payload);
    if (error) throw error;
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
  }

  async adjustStock(itemId: string, amount: number) {
    const item = this.items.find(i => i.id === itemId);
    if (item) {
      item.currentStock = Math.max(0, item.currentStock + amount);
      item.lastUpdated = new Date().toISOString();
      if (this.isDemoMode) {
        this.saveDemoStorage();
        this.notify();
      } else {
        await supabase.from('inventory').update({ current_stock: item.currentStock, last_updated: item.lastUpdated }).eq('id', itemId);
      }
    }
  }

  async updateRequestStatus(reqId: string, status: RequestStatus) {
    const req = this.requests.find(r => r.id === reqId);
    if (!req) return;
    req.status = status;
    if (status === RequestStatus.TRANSFERRED) {
      for (const item of req.items) {
        await this.adjustStock(item.itemId, -item.quantity);
      }
    }
    if (this.isDemoMode) {
      this.saveDemoStorage();
      this.notify();
    } else {
      await supabase.from('requests').update({ status }).eq('id', reqId);
    }
  }

  async consumeRequestItem(reqId: string, itemId: string, amount: number, userId: string, remark: string, userName: string) {
    const req = this.requests.find(r => r.id === reqId);
    if (!req) return;
    const item = req.items.find(i => i.itemId === itemId);
    if (!item) return;

    item.consumedQuantity += amount;
    if (!item.logs) item.logs = [];
    item.logs.push({
      id: `log-${Date.now()}`,
      amount,
      remark,
      timestamp: new Date().toISOString(),
      userId,
      userName
    });

    const allConsumed = req.items.every(i => i.consumedQuantity >= i.quantity);
    if (allConsumed) req.status = RequestStatus.CONSUMED;

    if (this.isDemoMode) {
      this.saveDemoStorage();
      this.notify();
    } else {
      await supabase.from('requests').update({ items: req.items, status: req.status }).eq('id', reqId);
    }
  }

  async createRequest(request: StockRequest) {
    const newRequest = { ...request, id: request.id || `req-${Date.now()}` };
    this.requests.unshift(newRequest);
    if (this.isDemoMode) {
      this.saveDemoStorage();
      this.notify();
    } else {
      await supabase.from('requests').insert({
        id: newRequest.id,
        client_id: newRequest.clientId,
        requester_id: newRequest.requesterId,
        requester_name: newRequest.requesterName,
        department: newRequest.department,
        items: newRequest.items,
        status: newRequest.status,
        requested_at: newRequest.requestedAt,
        notes: newRequest.notes
      });
    }
  }

  async saveUser(user: User) {
    const payload = {
      client_id: user.clientId,
      username: user.username.trim().toLowerCase(),
      full_name: user.fullName,
      email: user.email,
      role: user.role.toLowerCase(),
      department: user.department,
      permissions: user.permissions,
      password: user.password
    };

    if (this.isDemoMode) {
      if (user.id) {
        const idx = this.users.findIndex(u => u.id === user.id);
        if (idx >= 0) this.users[idx] = { ...user };
      } else {
        this.users.push({ ...user, id: `u-${Date.now()}` });
      }
      this.saveDemoStorage();
      this.notify();
      return;
    }

    if (user.id) {
      await supabase.from('users').update(payload).eq('id', user.id);
    } else {
      await supabase.from('users').insert({ ...payload, id: `u-${Date.now()}` });
    }
  }

  async saveVendor(vendor: Vendor) {
    if (this.isDemoMode) {
      if (vendor.id) {
        const idx = this.vendors.findIndex(v => v.id === vendor.id);
        if (idx >= 0) this.vendors[idx] = vendor;
      } else {
        this.vendors.push({ ...vendor, id: `v-${Date.now()}` });
      }
      this.saveDemoStorage();
      this.notify();
      return;
    }
    const payload = {
      client_id: vendor.clientId,
      name: vendor.name,
      contact_person: vendor.contactPerson,
      email: vendor.email,
      phone: vendor.phone,
      invoices: vendor.invoices
    };
    if (vendor.id) {
      await supabase.from('vendors').update(payload).eq('id', vendor.id);
    } else {
      await supabase.from('vendors').insert({ ...payload, id: `v-${Date.now()}` });
    }
  }

  async saveInvoice(vendorId: string, invoice: VendorInvoice) {
    const vendor = this.vendors.find(v => v.id === vendorId);
    if (!vendor) return;
    
    if (!vendor.invoices) vendor.invoices = [];
    const idx = vendor.invoices.findIndex(i => i.id === invoice.id);
    if (idx >= 0) {
      vendor.invoices[idx] = invoice;
    } else {
      vendor.invoices.push({ ...invoice, id: `inv-${Date.now()}` });
    }

    if (this.isDemoMode) {
      this.saveDemoStorage();
      this.notify();
    } else {
      await supabase.from('vendors').update({ invoices: vendor.invoices }).eq('id', vendorId);
    }
  }

  async deleteInvoice(vendorId: string, invoiceId: string) {
    const vendor = this.vendors.find(v => v.id === vendorId);
    if (!vendor) return;
    vendor.invoices = vendor.invoices.filter(i => i.id !== invoiceId);
    if (this.isDemoMode) {
      this.saveDemoStorage();
      this.notify();
    } else {
      await supabase.from('vendors').update({ invoices: vendor.invoices }).eq('id', vendorId);
    }
  }

  async changePassword(userId: string, oldPass: string, newPass: string) {
    if (this.isDemoMode) return;
    const { error } = await supabase.from('users').update({ password: newPass }).eq('id', userId).eq('password', oldPass);
    if (error) throw new Error("Incorrect current password.");
  }

  async addDepartment(clientId: string, name: string) {
    if (this.isDemoMode) {
      this.departments.push(name);
      this.saveDemoStorage();
      this.notify();
      return;
    }
    await supabase.from('departments').insert({ client_id: clientId, name });
  }

  async deleteDepartment(clientId: string, name: string) {
    if (this.isDemoMode) {
      this.departments = this.departments.filter(d => d !== name);
      this.saveDemoStorage();
      this.notify();
      return;
    }
    await supabase.from('departments').delete().eq('client_id', clientId).eq('name', name);
  }

  async createAudit(audit: AuditRecord) {
    const newAudit = { ...audit, id: audit.id || `audit-${Date.now()}` };
    this.audits = [newAudit, ...this.audits];
    
    if (audit.status === 'COMMITTED') {
      for (const item of audit.items) {
        await this.adjustStock(item.itemId, item.actualStock - item.systemStock);
      }
    }

    if (this.isDemoMode) {
      this.saveDemoStorage();
      this.notify();
    } else {
      await supabase.from('audits').insert({
        id: newAudit.id,
        client_id: newAudit.clientId,
        audit_date: newAudit.auditDate,
        auditor_id: newAudit.auditorId,
        auditor_name: newAudit.auditorName,
        category: newAudit.category,
        items: newAudit.items,
        status: newAudit.status
      });
    }
  }

  async getAudits(clientId: string) { return this.audits.filter(a => a.clientId === clientId); }

  async createTransfer(transfer: InternalTransfer) {
    const newTransfer = { ...transfer, id: transfer.id || `trans-${Date.now()}` };
    this.transfers = [newTransfer, ...this.transfers];
    
    // Debit stock from source
    for (const item of transfer.items) {
      await this.adjustStock(item.itemId, -item.quantity);
    }

    if (this.isDemoMode) {
      this.saveDemoStorage();
      this.notify();
    } else {
      await supabase.from('transfers').insert({
        id: newTransfer.id,
        client_id: newTransfer.clientId,
        // Fix: Use correct camelCase property names from the newTransfer object
        from_dept: newTransfer.fromDept,
        to_dept: newTransfer.toDept,
        initiated_by: newTransfer.initiatedBy,
        initiated_at: newTransfer.initiatedAt,
        items: newTransfer.items,
        status: newTransfer.status
      });
    }
  }

  async getTransfers(clientId: string) { return this.transfers.filter(t => t.clientId === clientId); }

  async updateTransferStatus(id: string, status: 'RECEIVED' | 'CANCELLED', receiverName?: string) {
    const transfer = this.transfers.find(t => t.id === id);
    if (!transfer || transfer.status !== 'PENDING') return;
    
    transfer.status = status;
    if (status === 'RECEIVED') {
      transfer.receivedAt = new Date().toISOString();
      transfer.receivedBy = receiverName;
      // Credit stock to destination
      for (const item of transfer.items) {
        await this.adjustStock(item.itemId, item.quantity);
      }
    } else if (status === 'CANCELLED') {
      // Return stock to source
      for (const item of transfer.items) {
        await this.adjustStock(item.itemId, item.quantity);
      }
    }

    if (this.isDemoMode) {
      this.saveDemoStorage();
      this.notify();
    } else {
      await supabase.from('transfers').update({ 
        status: transfer.status,
        received_at: transfer.receivedAt,
        received_by: transfer.receivedBy
      }).eq('id', id);
    }
  }

  async getReportData(clientId: string) {
    const items = await this.getItems(clientId);
    const vendors = await this.getVendors(clientId);
    const requests = await this.getRequests(clientId);
    
    let totalPayable = 0;
    let totalPaid = 0;
    vendors.forEach(v => {
      v.invoices?.forEach(inv => {
        totalPayable += Number(inv.totalAmount);
        totalPaid += Number(inv.paidAmount);
      });
    });

    const catMap: Record<string, number> = {};
    items.forEach(i => {
      catMap[i.category] = (catMap[i.category] || 0) + 1;
    });
    const categoryDistribution = Object.entries(catMap).map(([name, value]) => ({ name, value }));

    const deptMap: Record<string, number> = {};
    requests.filter(r => r.status === RequestStatus.CONSUMED || r.status === RequestStatus.TRANSFERRED).forEach(r => {
      let deptTotal = 0;
      r.items.forEach(item => {
        deptTotal += item.consumedQuantity;
      });
      deptMap[r.department] = (deptMap[r.department] || 0) + deptTotal;
    });
    const consumptionByDept = Object.entries(deptMap).map(([name, value]) => ({ name, value }));

    return {
      finance: {
        totalPayable,
        totalPaid,
        totalPending: totalPayable - totalPaid
      },
      inventory: {
        totalItems: items.length,
        lowStockCount: items.filter(i => i.currentStock <= i.minStockLevel).length,
        categoryDistribution
      },
      consumption: {
        byDept: consumptionByDept
      }
    };
  }

  async getStats(clientId: string) {
    const items = await this.getItems(clientId);
    const requests = await this.getRequests(clientId);
    return {
      totalItems: items.length,
      lowStock: items.filter(i => i.currentStock <= i.minStockLevel).length,
      pendingRequests: requests.filter(r => r.status === RequestStatus.PENDING).length,
      activeVendors: this.vendors.length,
      totalUsers: this.users.length,
      recentAudits: this.audits.length,
      activeTransfers: this.transfers.filter(t => t.status === 'PENDING').length
    };
  }
}

export const store = new ZinicStore();