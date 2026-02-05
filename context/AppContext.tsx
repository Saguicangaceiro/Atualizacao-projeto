import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  InventoryItem, 
  WorkOrder, 
  MaterialRequest, 
  UsageLog, 
  WorkOrderStatus, 
  RequestStatus,
  MaterialRequestItem,
  StockEntryLog,
  WorkOrderHistoryEntry,
  User,
  UserRole,
  ResourceRequest,
  Sector,
  PurchaseOrder,
  PurchaseStatus,
  Extension
} from '../types';

interface AppContextType {
  inventory: InventoryItem[];
  workOrders: WorkOrder[];
  materialRequests: MaterialRequest[];
  resourceRequests: ResourceRequest[];
  purchaseOrders: PurchaseOrder[];
  usageLogs: UsageLog[];
  stockEntries: StockEntryLog[];
  users: User[];
  sectors: Sector[];
  extensions: Extension[];
  theme: 'light' | 'dark';
  
  toggleTheme: () => void;
  refreshData: () => Promise<void>;
  addWorkOrder: (wo: Omit<WorkOrder, 'id' | 'createdAt' | 'requests' | 'status' | 'history'>, needsMaterials: boolean) => Promise<void>;
  createMaterialRequest: (workOrderId: string, items: MaterialRequestItem[]) => Promise<void>;
  processRequest: (requestId: string, approved: boolean) => Promise<void>;
  addResourceRequest: (req: Omit<ResourceRequest, 'id' | 'createdAt' | 'status'>) => Promise<void>;
  processResourceRequest: (requestId: string, approved: boolean, approverName: string) => Promise<void>;
  addPurchaseOrder: (po: Omit<PurchaseOrder, 'id' | 'status'>) => Promise<void>;
  updatePurchaseStatus: (id: string, status: PurchaseStatus) => Promise<void>;
  completePurchaseReception: (purchaseOrderId: string) => Promise<void>;
  updateInventory: (item: InventoryItem) => Promise<void>;
  addInventoryItem: (itemData: Omit<InventoryItem, 'id'>, entryData: any) => Promise<void>;
  restockInventoryItem: (itemId: string, quantityToAdd: number, entryData: any) => Promise<void>;
  updateWorkOrderStatus: (workOrderId: string, newStatus: WorkOrderStatus, notes: string) => Promise<void>;
  reopenWorkOrder: (workOrderId: string, notes: string, needsMaterials: boolean) => Promise<void>;
  addUser: (user: Omit<User, 'id'>) => Promise<void>;
  removeUser: (userId: string) => Promise<void>;
  updateUserPassword: (userId: string, newPassword: string) => Promise<void>;
  updateUserExtension: (userId: string, extension: string) => Promise<void>;
  addSector: (name: string, costCenter: string) => Promise<void>;
  updateSector: (id: string, name: string, costCenter: string) => Promise<void>;
  removeSector: (sectorId: string) => Promise<void>;
  addExtension: (ext: Omit<Extension, 'id'>) => Promise<void>;
  updateExtension: (id: string, name: string, number: string, sector: string) => Promise<void>;
  removeExtension: (id: string) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [materialRequests, setMaterialRequests] = useState<MaterialRequest[]>([]);
  const [resourceRequests, setResourceRequests] = useState<ResourceRequest[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [usageLogs, setUsageLogs] = useState<UsageLog[]>([]);
  const [stockEntries, setStockEntries] = useState<StockEntryLog[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [extensions, setExtensions] = useState<Extension[]>([]);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  const refreshData = async () => {
    try {
      const res = await fetch('/api/data');
      const data = await res.json();
      setInventory(data.inventory);
      setWorkOrders(data.workOrders);
      setMaterialRequests(data.materialRequests);
      setResourceRequests(data.resourceRequests);
      setPurchaseOrders(data.purchaseOrders);
      setUsageLogs(data.usageLogs);
      setStockEntries(data.stockEntries);
      setUsers(data.users);
      setSectors(data.sectors);
      setExtensions(data.extensions);
    } catch (e) {
      console.error("Erro ao carregar dados do banco:", e);
    }
  };

  useEffect(() => {
    refreshData();
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark';
    if (savedTheme) setTheme(savedTheme);
  }, []);

  const apiCall = async (url: string, method: string, body?: any) => {
    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined
    });
    await refreshData();
  };

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  const addWorkOrder = async (woData: any, needsMaterials: boolean) => {
    await apiCall('/api/work-orders', 'POST', { ...woData, needsMaterials });
  };

  const createMaterialRequest = async (workOrderId: string, items: MaterialRequestItem[]) => {
    await apiCall(`/api/work-orders/${workOrderId}/requests`, 'POST', { items });
  };

  const processRequest = async (requestId: string, approved: boolean) => {
    await apiCall(`/api/requests/${requestId}/process`, 'POST', { approved });
  };

  const addResourceRequest = async (req: any) => {
    await apiCall('/api/resource-requests', 'POST', req);
  };

  const processResourceRequest = async (requestId: string, approved: boolean, approverName: string) => {
    await apiCall(`/api/resource-requests/${requestId}/process`, 'POST', { approved, approverName });
  };

  const addPurchaseOrder = async (po: any) => {
    await apiCall('/api/purchase-orders', 'POST', po);
  };

  const updatePurchaseStatus = async (id: string, status: PurchaseStatus) => {
    await apiCall(`/api/purchase-orders/${id}/status`, 'PUT', { status });
  };

  const completePurchaseReception = async (id: string) => {
    await apiCall(`/api/purchase-orders/${id}/receive`, 'POST');
  };

  const updateInventory = async (item: InventoryItem) => {
    await apiCall(`/api/inventory/${item.id}`, 'PUT', item);
  };

  const addInventoryItem = async (itemData: any, entryData: any) => {
    await apiCall('/api/inventory', 'POST', { ...itemData, entryData });
  };

  const restockInventoryItem = async (itemId: string, quantity: number, entryData: any) => {
    await apiCall(`/api/inventory/${itemId}/restock`, 'POST', { quantity, entryData });
  };

  const updateWorkOrderStatus = async (id: string, status: WorkOrderStatus, notes: string) => {
    await apiCall(`/api/work-orders/${id}/status`, 'PUT', { status, notes });
  };

  const reopenWorkOrder = async (id: string, notes: string, needsMaterials: boolean) => {
    await apiCall(`/api/work-orders/${id}/reopen`, 'POST', { notes, needsMaterials });
  };

  const addUser = async (user: any) => {
    await apiCall('/api/users', 'POST', user);
  };

  const removeUser = async (id: string) => {
    await apiCall(`/api/users/${id}`, 'DELETE');
  };

  const updateUserPassword = async (id: string, password: string) => {
    await apiCall(`/api/users/${id}/password`, 'PUT', { password });
  };

  const updateUserExtension = async (id: string, extension: string) => {
    await apiCall(`/api/users/${id}/extension`, 'PUT', { extension });
  };

  const addSector = async (name: string, costCenter: string) => {
    await apiCall('/api/sectors', 'POST', { name, costCenter });
  };

  const updateSector = async (id: string, name: string, costCenter: string) => {
    await apiCall(`/api/sectors/${id}`, 'PUT', { name, costCenter });
  };

  const removeSector = async (id: string) => {
    await apiCall(`/api/sectors/${id}`, 'DELETE');
  };

  const addExtension = async (ext: any) => {
    await apiCall('/api/extensions', 'POST', ext);
  };

  const updateExtension = async (id: string, name: string, number: string, sector: string) => {
    await apiCall(`/api/extensions/${id}`, 'PUT', { name, number, sector });
  };

  const removeExtension = async (id: string) => {
    await apiCall(`/api/extensions/${id}`, 'DELETE');
  };

  return (
    <AppContext.Provider value={{
      inventory, workOrders, materialRequests, resourceRequests, purchaseOrders,
      usageLogs, stockEntries, users, sectors, extensions, theme,
      toggleTheme, refreshData, addWorkOrder, createMaterialRequest, processRequest,
      addResourceRequest, processResourceRequest, addPurchaseOrder, updatePurchaseStatus,
      completePurchaseReception, updateInventory, addInventoryItem, restockInventoryItem,
      updateWorkOrderStatus, reopenWorkOrder, addUser, removeUser, updateUserPassword,
      updateUserExtension, addSector, updateSector, removeSector, addExtension,
      updateExtension, removeExtension
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within AppProvider");
  return context;
};