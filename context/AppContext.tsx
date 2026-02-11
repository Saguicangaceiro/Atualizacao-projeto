
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { 
  InventoryItem, 
  WorkOrder, 
  MaterialRequest, 
  UsageLog, 
  WorkOrderStatus, 
  RequestStatus,
  MaterialRequestItem,
  StockEntryLog,
  User,
  ResourceRequest,
  Sector,
  PurchaseOrder,
  PurchaseStatus,
  Extension,
  MaintenanceGuide,
  SupportTicket,
  SupportTicketStatus,
  DatabaseConfig,
  Equipment
} from '../types.ts';

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
  guides: MaintenanceGuide[];
  supportTickets: SupportTicket[];
  equipments: Equipment[];
  databaseConfig: DatabaseConfig;
  theme: 'light' | 'dark';
  serverStatus: 'ONLINE' | 'OFFLINE' | 'CONNECTING';
  
  toggleTheme: () => void;
  updateDatabaseConfig: (config: DatabaseConfig) => Promise<void>;
  addWorkOrder: (wo: Omit<WorkOrder, 'id' | 'createdAt' | 'requests' | 'status' | 'history'>, needsMaterials: boolean) => void;
  createMaterialRequest: (workOrderId: string, items: MaterialRequestItem[]) => void;
  processRequest: (requestId: string, approved: boolean) => void;
  addResourceRequest: (req: Omit<ResourceRequest, 'id' | 'createdAt' | 'status'>) => void;
  processResourceRequest: (requestId: string, approved: boolean, approverName: string) => void;
  addPurchaseOrder: (po: Omit<PurchaseOrder, 'id' | 'status'>) => void;
  updatePurchaseStatus: (id: string, status: PurchaseStatus) => void;
  completePurchaseReception: (purchaseOrderId: string) => void;
  updateInventory: (item: InventoryItem) => void;
  addInventoryItem: (itemData: Omit<InventoryItem, 'id'>, entryData: any) => void;
  restockInventoryItem: (itemId: string, quantityToAdd: number, entryData: any) => void;
  updateWorkOrderStatus: (workOrderId: string, newStatus: WorkOrderStatus, notes: string) => void;
  reopenWorkOrder: (workOrderId: string, notes: string, needsMaterials: boolean) => void;
  addUser: (user: Omit<User, 'id'>) => void;
  removeUser: (userId: string) => void;
  updateUserPassword: (userId: string, newPassword: string) => void;
  updateUserExtension: (userId: string, extension: string) => void;
  updateUserProfileImage: (userId: string, profileImage: string) => void;
  addSector: (name: string, costCenter: string) => void;
  updateSector: (id: string, name: string, costCenter: string) => void;
  removeSector: (sectorId: string) => void;
  addExtension: (ext: Omit<Extension, 'id'>) => void;
  updateExtension: (id: string, name: string, number: string, sector: string) => void;
  removeExtension: (id: string) => void;
  addGuide: (guide: Omit<MaintenanceGuide, 'id' | 'createdAt'>) => void;
  removeGuide: (id: string) => void;
  addSupportTicket: (ticket: Omit<SupportTicket, 'id' | 'createdAt' | 'status'>) => void;
  processSupportTicket: (ticketId: string, approve: boolean, priority?: 'Baixa' | 'Média' | 'Alta') => void;
  addEquipment: (eq: Omit<Equipment, 'id'>) => void;
  removeEquipment: (id: string) => void;
  exportDatabase: () => void;
  importDatabase: (jsonData: string) => void;
  refreshData: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const API_BASE = "http://localhost:5000/api";

const DEFAULT_ADMIN: User = {
  id: 'default-admin',
  username: 'admin',
  password: 'admin',
  name: 'Administrador do Sistema',
  role: 'SUPER_ADMIN'
};

const generateId = () => {
  try { return crypto.randomUUID(); }
  catch (e) { return Math.random().toString(36).substring(2, 9); }
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [materialRequests, setMaterialRequests] = useState<MaterialRequest[]>([]);
  const [resourceRequests, setResourceRequests] = useState<ResourceRequest[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [usageLogs, setUsageLogs] = useState<UsageLog[]>([]);
  const [stockEntries, setStockEntries] = useState<StockEntryLog[]>([]);
  const [users, setUsers] = useState<User[]>([DEFAULT_ADMIN]);
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [extensions, setExtensions] = useState<Extension[]>([]);
  const [guides, setGuides] = useState<MaintenanceGuide[]>([]);
  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>([]);
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [serverStatus, setServerStatus] = useState<'ONLINE' | 'OFFLINE' | 'CONNECTING'>('CONNECTING');
  const [databaseConfig, setDatabaseConfig] = useState<DatabaseConfig>({ type: 'LOCAL', status: 'LOCAL' });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  const apiSave = async (entity: string, data: any) => {
    if (serverStatus !== 'ONLINE') return;
    try {
      await fetch(`${API_BASE}/save/${entity}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
    } catch (e) {
      setServerStatus('OFFLINE');
    }
  };

  const apiLoad = async (entity: string) => {
    try {
      const res = await fetch(`${API_BASE}/load/${entity}`);
      if (res.ok) {
        const data = await res.json();
        return Array.isArray(data) ? data : [];
      }
    } catch (e) {}
    return [];
  };

  const refreshData = useCallback(async () => {
    try {
      setServerStatus('CONNECTING');
      const healthCheck = await fetch(`${API_BASE}/health`).catch(() => null);

      if (!healthCheck || !healthCheck.ok) {
        setServerStatus('OFFLINE');
        return;
      }

      // Carregar entidades em paralelo para nao travar
      const entities = [
        { key: 'inventory', setter: setInventory },
        { key: 'work_orders', setter: setWorkOrders },
        { key: 'users', setter: (data: User[]) => setUsers(data && data.length > 0 ? data : [DEFAULT_ADMIN]) },
        { key: 'sectors', setter: setSectors },
        { key: 'equipments', setter: setEquipments }
      ];

      Promise.all(entities.map(async (e) => {
        const data = await apiLoad(e.key);
        if (data && data.length > 0) e.setter(data);
      })).then(() => {
        setServerStatus('ONLINE');
      });

    } catch (e) {
      setServerStatus('OFFLINE');
    }
  }, []);

  useEffect(() => {
    refreshData();
    const interval = setInterval(refreshData, 60000);
    return () => clearInterval(interval);
  }, [refreshData]);

  const updateDatabaseConfig = async (config: DatabaseConfig) => {
    try {
      const res = await fetch(`${API_BASE}/config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      if (res.ok) refreshData();
    } catch (e) {
      alert("Falha ao configurar.");
    }
  };

  const addWorkOrder = (woData: any, needsMaterials: boolean) => {
    const newWO: WorkOrder = { ...woData, id: generateId(), status: needsMaterials ? WorkOrderStatus.PREPARATION : WorkOrderStatus.IN_PROGRESS, createdAt: Date.now(), requests: [], history: [] };
    setWorkOrders(prev => [newWO, ...prev]);
  };

  const createMaterialRequest = (workOrderId: string, items: MaterialRequestItem[]) => {
    const wo = workOrders.find(w => w.id === workOrderId);
    if (!wo) return;
    const newRequest: MaterialRequest = { id: generateId(), workOrderId, workOrderTitle: wo.title, items, status: RequestStatus.PENDING, createdAt: Date.now() };
    setMaterialRequests(prev => [newRequest, ...prev]);
    setWorkOrders(prev => prev.map(w => w.id === workOrderId ? { ...w, requests: [...w.requests, newRequest.id] } : w));
  };

  const processRequest = (requestId: string, approved: boolean) => {
    if (!approved) {
      setMaterialRequests(prev => prev.map(r => r.id === requestId ? { ...r, status: RequestStatus.REJECTED } : r));
      return;
    }
    setMaterialRequests(prev => prev.map(r => r.id === requestId ? { ...r, status: RequestStatus.APPROVED, approvedAt: Date.now() } : r));
  };

  const addResourceRequest = (req: any) => setResourceRequests(prev => [{ ...req, id: generateId(), status: 'PENDENTE', createdAt: Date.now() }, ...prev]);
  const processResourceRequest = (id: string, ok: boolean, name: string) => setResourceRequests(prev => prev.map(r => r.id === id ? { ...r, status: ok ? 'LIBERADO' : 'REJEITADO', approvedBy: ok ? name : undefined, approvedAt: Date.now() } : r));
  const addPurchaseOrder = (po: any) => setPurchaseOrders(prev => [{ ...po, id: generateId(), status: 'ORDERED' }, ...prev]);
  const updatePurchaseStatus = (id: string, s: any) => setPurchaseOrders(prev => prev.map(p => p.id === id ? { ...p, status: s } : p));
  const completePurchaseReception = (id: string) => setPurchaseOrders(prev => prev.map(p => p.id === id ? { ...p, status: 'STOCKED' } : p));
  const updateInventory = (i: any) => setInventory(prev => prev.map(old => old.id === i.id ? i : old));
  const addInventoryItem = (d: any, e: any) => setInventory(prev => [...prev, { ...d, id: generateId() }]);
  const restockInventoryItem = (id: string, q: number, e: any) => setInventory(prev => prev.map(i => i.id === id ? { ...i, quantity: i.quantity + q } : i));
  const updateWorkOrderStatus = (id: string, s: any, n: string) => setWorkOrders(prev => prev.map(w => w.id === id ? { ...w, status: s } : w));
  const reopenWorkOrder = (id: string, n: string, m: boolean) => setWorkOrders(prev => prev.map(w => w.id === id ? { ...w, status: m ? WorkOrderStatus.PREPARATION : WorkOrderStatus.IN_PROGRESS } : w));
  const addUser = (u: any) => setUsers(prev => [...prev, { ...u, id: generateId() }]);
  const removeUser = (id: string) => setUsers(prev => prev.filter(u => u.id !== id));
  const updateUserPassword = (id: string, p: string) => setUsers(prev => prev.map(u => u.id === id ? { ...u, password: p } : u));
  const updateUserExtension = (id: string, e: string) => setUsers(prev => prev.map(u => u.id === id ? { ...u, extension: e } : u));
  const updateUserProfileImage = (id: string, i: string) => setUsers(prev => prev.map(u => u.id === id ? { ...u, profileImage: i } : u));
  const addSector = (n: string, c: string) => setSectors(prev => [...prev, { id: generateId(), name: n, costCenter: c }]);
  const updateSector = (id: string, n: string, c: string) => setSectors(prev => prev.map(s => s.id === id ? { ...s, name: n, costCenter: c } : s));
  const removeSector = (id: string) => setSectors(prev => prev.filter(s => s.id !== id));
  const addExtension = (e: any) => setExtensions(prev => [...prev, { ...e, id: generateId() }]);
  const updateExtension = (id: string, n: string, num: string, s: string) => setExtensions(prev => prev.map(e => e.id === id ? { ...e, name: n, number: num, sector: s } : e));
  const removeExtension = (id: string) => setExtensions(prev => prev.filter(e => e.id !== id));
  const addGuide = (g: any) => setGuides(prev => [{ ...g, id: generateId(), createdAt: Date.now() }, ...prev]);
  const removeGuide = (id: string) => setGuides(prev => prev.filter(g => g.id !== id));
  const addSupportTicket = (t: any) => setSupportTickets(prev => [{ ...t, id: generateId(), status: SupportTicketStatus.PENDING, createdAt: Date.now() }, ...prev]);
  const processSupportTicket = (id: string, a: boolean) => setSupportTickets(prev => prev.map(t => t.id === id ? { ...t, status: a ? SupportTicketStatus.APPROVED : SupportTicketStatus.REJECTED } : t));
  const addEquipment = (eq: any) => setEquipments(prev => [...prev, { ...eq, id: generateId() }]);
  const removeEquipment = (id: string) => setEquipments(prev => prev.filter(e => e.id !== id));
  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');
  const exportDatabase = () => {
    const blob = new Blob([JSON.stringify({ inventory, workOrders, users, sectors }, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `dutyfinder_backup.json`;
    link.click();
  };
  const importDatabase = (json: string) => {
    try {
      const d = JSON.parse(json);
      if (d.users) setUsers(d.users);
      if (d.inventory) setInventory(d.inventory);
      alert("Sucesso!");
    } catch (e) { alert("Erro!"); }
  };

  return (
    <AppContext.Provider value={{
      inventory, workOrders, materialRequests, resourceRequests, purchaseOrders, usageLogs, stockEntries, users, sectors, extensions, guides, supportTickets, equipments, databaseConfig, theme, serverStatus,
      toggleTheme, updateDatabaseConfig, addWorkOrder, createMaterialRequest, processRequest, addResourceRequest, processResourceRequest, addPurchaseOrder, updatePurchaseStatus, completePurchaseReception,
      updateInventory, addInventoryItem, restockInventoryItem, updateWorkOrderStatus, reopenWorkOrder, addUser, removeUser, updateUserPassword, updateUserExtension, updateUserProfileImage,
      addSector, updateSector, removeSector, addExtension, updateExtension, removeExtension, addGuide, removeGuide, addSupportTicket, processSupportTicket, addEquipment, removeEquipment, exportDatabase, importDatabase, refreshData
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp deve ser usado dentro de AppProvider");
  return context;
};
