import React from 'react';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Users, 
  Settings, 
  LogOut, 
  Building2, 
  AlertTriangle,
  CheckCircle,
  Truck,
  FileText,
  LifeBuoy
} from 'lucide-react';

export const APP_NAME = "Zinic";

export const ICONS = {
  Dashboard: <LayoutDashboard size={20} />,
  Inventory: <Package size={20} />,
  Requests: <ShoppingCart size={20} />,
  Users: <Users size={20} />,
  Settings: <Settings size={20} />,
  Logout: <LogOut size={20} />,
  Hotel: <Building2 size={20} />,
  Alert: <AlertTriangle size={18} />,
  Check: <CheckCircle size={18} />,
  Truck: <Truck size={20} />,
  Report: <FileText size={20} />,
  Support: <LifeBuoy size={20} />
};