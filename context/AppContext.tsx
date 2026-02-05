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
  dbConnected: boolean;
  
  toggleTheme: () => void;
  refreshData: () => Promise<void>;
  addWorkOrder: (wo: any, needsMaterials: boolean) => Promise<void>;
  createMaterialRequest: (workOrderId: string, items: MaterialRequestItem[]) => Promise<void>;
  processRequest: (requestId: string, approved: boolean) => Promise<void>;
  addResourceRequest: (req: any) => Promise<void>;
  processResourceRequest: (requestId: string, approved: boolean, approverName: string) => Promise<void>;
  addPurchaseOrder: (po: any) => Promise<void>;
  updatePurchaseStatus: (id: string, status: PurchaseStatus) => Promise<void>;
  completePurchaseReception: (purchaseOrderId: string) => Promise<void>;
  updateInventory: (item: InventoryItem) => Promise<void>;
  addInventoryItem: (itemData: any, entryData: any) => Promise<void>;
  restockInventoryItem: (itemId: string, quantityToAdd: number, entryData: any) => Promise<void>;
  updateWorkOrderStatus: (workOrderId: string, newStatus: WorkOrderStatus, notes: string) => Promise<void>;
  reopenWorkOrder: (workOrderId: string, notes: string, needsMaterials: boolean) => Promise<void>;
  addUser: (user: any) => Promise<void>;
  removeUser: (userId: string) => Promise<void>;
  updateUserPassword: (userId: string, newPassword: string) => Promise<void>;
  updateUserExtension: (userId: string, extension: string) => Promise<void>;
  addSector: (name: string, costCenter: string) => Promise<void>;
  updateSector: (id: string, name: string, costCenter: string) => Promise<void>;
  removeSector: (sectorId: string) => Promise<void>;
  addExtension: (ext: any) => Promise<void>;
  updateExtension: (id: string, name: string, number: string, sector: string) => Promise<void>;
  removeExtension: (id: string) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Initial Data for Fallback
const INITIAL_USERS: User[] = [
  { id: '0', username: 'super', password: '123', name: 'Super Admin', role: 'SUPER_ADMIN', hasPortalAccess: true },
  { id: '1', username: 'admin', password: '123', name: 'Admin TI', role: 'IT_ADMIN', hasPortalAccess: true, extension: '101' },
];

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [materialRequests, setMaterialRequests] = useState<MaterialRequest[]>([]);
  const [resourceRequests, setResourceRequests] = useState<ResourceRequest[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [usageLogs, setUsageLogs] = useState<UsageLog[]>([]);
  const [stockEntries, setStockEntries] = useState<StockEntryLog[]>([]);
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [extensions, setExtensions] = useState<Extension[]>([]);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [dbConnected, setDbConnected] = useState(false);

  const loadLocal = <T,>(key: string, defaultValue: T): T => {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : defaultValue;
  };

  const saveLocal = (key: string, data: any) => {
    if (!dbConnected) localStorage.setItem(key, JSON.stringify(data));
  };

  const refreshData = async () => {
    try {
      const res = await fetch('/api/data');
      if (!res.ok) throw new Error("Database offline");
      const data = await res.json();
      
      setInventory(data.inventory || []);
      setWorkOrders(data.workOrders || []);
      setMaterialRequests(data.materialRequests || []);
      setResourceRequests(data.resourceRequests || []);
      setPurchaseOrders(data.purchaseOrders || []);
      setUsageLogs(data.usageLogs || []);
      setStockEntries(data.stockEntries || []);
      setUsers(data.users || INITIAL_USERS);
      setSectors(data.sectors || []);
      setExtensions(data.extensions || []);
      setDbConnected(true);
    } catch (e) {
      setDbConnected(false);
      // Revert to LocalStorage
      setInventory(loadLocal('inventory', []));
      setWorkOrders(loadLocal('workOrders', []));
      setMaterialRequests(loadLocal('materialRequests', []));
      setResourceRequests(loadLocal('resourceRequests', []));
      setPurchaseOrders(loadLocal('purchaseOrders', []));
      setUsageLogs(loadLocal('usageLogs', []));
      setStockEntries(loadLocal('stockEntries', []));
      setUsers(loadLocal('users', INITIAL_USERS));
      setSectors(loadLocal('sectors', []));
      setExtensions(loadLocal('extensions', []));
    }
  };

  useEffect(() => {
    refreshData();
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark';
    if (savedTheme) setTheme(savedTheme);
  }, []);

  // Save to local storage whenever state changes if NOT connected to DB
  useEffect(() => { if (!dbConnected) saveLocal('inventory', inventory); }, [inventory, dbConnected]);
  useEffect(() => { if (!dbConnected) saveLocal('workOrders', workOrders); }, [workOrders, dbConnected]);
  useEffect(() => { if (!dbConnected) saveLocal('materialRequests', materialRequests); }, [materialRequests, dbConnected]);
  useEffect(() => { if (!dbConnected) saveLocal('users', users); }, [users, dbConnected]);
  useEffect(() => { if (!dbConnected) saveLocal('sectors', sectors); }, [sectors, dbConnected]);
  useEffect(() => { if (!dbConnected) saveLocal('extensions', extensions); }, [extensions, dbConnected]);

  const apiCall = async (url: string, method: string, body?: any) => {
    if (dbConnected) {
      try {
        await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: body ? JSON.stringify(body) : undefined
        });
        await refreshData();
      } catch (e) {
        console.error("API Call failed:", e);
      }
    } else {
      // Mocked local logic for immediate feedback when DB is offline
      // This is a simplified fallback to keep the UI interactive
      console.log("Database offline - Action simulated locally");
      if (method === 'POST' && url.includes('work-orders')) {
        const newWO = { ...body, id: crypto.randomUUID(), createdAt: Date.now(), history: [], requests: [], status: body.needsMaterials ? 'PREPARAÇÃO' : 'EM ANDAMENTO' };
        setWorkOrders(prev => [newWO, ...prev]);
      }
      // Add other fallback logic as needed...
    }
  };

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  // API Methods
  const addWorkOrder = async (woData: any, needsMaterials: boolean) => apiCall('/api/work-orders', 'POST', { ...woData, needsMaterials });
  const createMaterialRequest = async (workOrderId: string, items: MaterialRequestItem[]) => apiCall(`/api/work-orders/${workOrderId}/requests`, 'POST', { items });
  const processRequest = async (requestId: string, approved: boolean) => apiCall(`/api/requests/${requestId}/process`, 'POST', { approved });
  const addResourceRequest = async (req: any) => apiCall('/api/resource-requests', 'POST', req);
  const processResourceRequest = async (requestId: string, approved: boolean, approverName: string) => apiCall(`/api/resource-requests/${requestId}/process`, 'POST', { approved, approverName });
  const addPurchaseOrder = async (po: any) => apiCall('/api/purchase-orders', 'POST', po);
  const updatePurchaseStatus = async (id: string, status: PurchaseStatus) => apiCall(`/api/purchase-orders/${id}/status`, 'PUT', { status });
  const completePurchaseReception = async (id: string) => apiCall(`/api/purchase-orders/${id}/receive`, 'POST');
  const updateInventory = async (item: InventoryItem) => apiCall(`/api/inventory/${item.id}`, 'PUT', item);
  const addInventoryItem = async (itemData: any, entryData: any) => apiCall('/api/inventory', 'POST', { ...itemData, entryData });
  const restockInventoryItem = async (itemId: string, qty: number, entry: any) => apiCall(`/api/inventory/${itemId}/restock`, 'POST', { quantity: qty, entryData: entry });
  const updateWorkOrderStatus = async (id: string, status: WorkOrderStatus, notes: string) => apiCall(`/api/work-orders/${id}/status`, 'PUT', { status, notes });
  const reopenWorkOrder = async (id: string, notes: string, needsMat: boolean) => apiCall(`/api/work-orders/${id}/reopen`, 'POST', { notes, needsMaterials: needsMat });
  const addUser = async (user: any) => apiCall('/api/users', 'POST', user);
  const removeUser = async (id: string) => apiCall(`/api/users/${id}`, 'DELETE');
  const updateUserPassword = async (id: string, password: string) => apiCall(`/api/users/${id}/password`, 'PUT', { password });
  const updateUserExtension = async (id: string, ext: string) => apiCall(`/api/users/${id}/extension`, 'PUT', { extension: ext });
  const addSector = async (name: string, costCenter: string) => apiCall('/api/sectors', 'POST', { name, costCenter });
  const updateSector = async (id: string, name: string, cc: string) => apiCall(`/api/sectors/${id}`, 'PUT', { name, costCenter: cc });
  const removeSector = async (id: string) => apiCall(`/api/sectors/${id}`, 'DELETE');
  const addExtension = async (ext: any) => apiCall('/api/extensions', 'POST', ext);
  const updateExtension = async (id: string, name: string, num: string, sec: string) => apiCall(`/api/extensions/${id}`, 'PUT', { name, number: num, sector: sec });
  const removeExtension = async (id: string) => apiCall(`/api/extensions/${id}`, 'DELETE');

  return (
    <AppContext.Provider value={{
      inventory, workOrders, materialRequests, resourceRequests, purchaseOrders,
      usageLogs, stockEntries, users, sectors, extensions, theme, dbConnected,
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