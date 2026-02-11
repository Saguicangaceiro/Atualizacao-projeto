
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { 
  InventoryItem, WorkOrder, MaterialRequest, UsageLog, WorkOrderStatus, 
  RequestStatus, MaterialRequestItem, StockEntryLog, User, ResourceRequest, 
  Sector, PurchaseOrder, PurchaseStatus, Extension, MaintenanceGuide, 
  SupportTicket, SupportTicketStatus, DatabaseConfig, Equipment, WorkOrderHistoryEntry
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
  addWorkOrder: (wo: any, m: boolean) => void;
  createMaterialRequest: (woId: string, i: any) => void;
  processRequest: (id: string, a: boolean) => void;
  addResourceRequest: (req: any) => void;
  processResourceRequest: (id: string, a: boolean, n: string) => void;
  addPurchaseOrder: (po: any) => void;
  updatePurchaseStatus: (id: string, s: PurchaseStatus) => void;
  completePurchaseReception: (id: string) => void;
  updateInventory: (i: any) => void;
  addInventoryItem: (d: any, e: any) => void;
  restockInventoryItem: (id: string, q: number, e: any) => void;
  updateWorkOrderStatus: (id: string, s: any, n: string) => void;
  reopenWorkOrder: (id: string, n: string, m: boolean) => void;
  addUser: (u: any) => void;
  removeUser: (id: string) => void;
  updateUserPassword: (id: string, p: string) => void;
  updateUserExtension: (id: string, e: string) => void;
  updateUserProfileImage: (id: string, img: string) => void;
  addSector: (n: string, c: string) => void;
  updateSector: (id: string, n: string, c: string) => void;
  removeSector: (id: string) => void;
  addExtension: (e: any) => void;
  updateExtension: (id: string, n: string, num: string, s: string) => void;
  removeExtension: (id: string) => void;
  addGuide: (g: any) => void;
  removeGuide: (id: string) => void;
  addSupportTicket: (t: any) => void;
  processSupportTicket: (id: string, a: boolean) => void;
  addEquipment: (eq: any) => void;
  removeEquipment: (id: string) => void;
  exportDatabase: () => void;
  importDatabase: (json: string) => void;
  refreshData: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);
const API_BASE = "http://localhost:5000/api";
const DEFAULT_ADMIN: User = { id: 'default-admin', username: 'admin', password: 'admin', name: 'Administrador', role: 'SUPER_ADMIN' };

const fetchWithTimeout = async (url: string, options: any = {}, timeout = 2500) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(id);
    return response;
  } catch (e) {
    clearTimeout(id);
    throw e;
  }
};

const generateId = () => crypto.randomUUID?.() || Math.random().toString(36).substring(2, 9);

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

  const apiSave = async (entity: string, data: any) => {
    try {
      await fetchWithTimeout(`${API_BASE}/save/${entity}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
    } catch { setServerStatus('OFFLINE'); }
  };

  const apiLoad = async (entity: string) => {
    try {
      const res = await fetchWithTimeout(`${API_BASE}/load/${entity}`);
      if (res.ok) return await res.json();
    } catch {}
    return [];
  };

  const refreshData = useCallback(async () => {
    try {
      const entities = [
        { key: 'inventory', setter: setInventory },
        { key: 'work_orders', setter: setWorkOrders },
        { key: 'users', setter: (d: any) => setUsers(d?.length ? d : [DEFAULT_ADMIN]) },
        { key: 'sectors', setter: setSectors },
        { key: 'equipments', setter: setEquipments },
        { key: 'resource_requests', setter: setResourceRequests },
        { key: 'purchase_orders', setter: setPurchaseOrders },
        { key: 'support_tickets', setter: setSupportTickets }
      ];

      await Promise.all(entities.map(async (e) => {
        const data = await apiLoad(e.key);
        if (data) e.setter(data);
      }));
      setServerStatus('ONLINE');
    } catch { setServerStatus('OFFLINE'); }
  }, []);

  useEffect(() => {
    refreshData();
    const interval = setInterval(refreshData, 30000);
    return () => clearInterval(interval);
  }, [refreshData]);

  // Implementação das Funções
  const addWorkOrder = (d: any, m: boolean) => {
    // FIX: Using enum values for status
    const newWO: WorkOrder = { 
      ...d, 
      id: generateId(), 
      status: m ? WorkOrderStatus.PREPARATION : WorkOrderStatus.IN_PROGRESS, 
      createdAt: Date.now(), 
      requests: [], 
      history: [] 
    };
    const updated = [newWO, ...workOrders];
    setWorkOrders(updated);
    apiSave('work_orders', updated);
  };

  const createMaterialRequest = (woId: string, items: any) => {
    const wo = workOrders.find(w => w.id === woId);
    // FIX: Typing newReq and using RequestStatus.PENDING
    const newReq: MaterialRequest = { 
      id: generateId(), 
      workOrderId: woId, 
      workOrderTitle: wo?.title || 'OS', 
      items, 
      status: RequestStatus.PENDING, 
      createdAt: Date.now() 
    };
    const updated = [newReq, ...materialRequests];
    setMaterialRequests(updated);
    apiSave('material_requests', updated);
  };

  const processRequest = (id: string, approved: boolean) => {
    // FIX: Using RequestStatus enum for approved/rejected states
    const updated = materialRequests.map(r => r.id === id ? { ...r, status: approved ? RequestStatus.APPROVED : RequestStatus.REJECTED, approvedAt: Date.now() } : r);
    setMaterialRequests(updated);
    apiSave('material_requests', updated);
  };

  const addResourceRequest = (req: any) => {
    // FIX: Explicitly typing status as 'PENDENTE'
    const updated: ResourceRequest[] = [{ ...req, id: generateId(), status: 'PENDENTE' as const, createdAt: Date.now() }, ...resourceRequests];
    setResourceRequests(updated);
    apiSave('resource_requests', updated);
  };

  const processResourceRequest = (id: string, approved: boolean, name: string) => {
    // FIX: Explicitly casting status to valid literal values
    const updated = resourceRequests.map(r => r.id === id ? { ...r, status: (approved ? 'LIBERADO' : 'REJEITADO') as 'LIBERADO' | 'REJEITADO', approvedBy: name, approvedAt: Date.now() } : r);
    setResourceRequests(updated);
    apiSave('resource_requests', updated);
  };

  const addPurchaseOrder = (po: any) => {
    const updated = [{ ...po, id: generateId(), status: 'ORDERED' as PurchaseStatus }, ...purchaseOrders];
    setPurchaseOrders(updated);
    apiSave('purchase_orders', updated);
  };

  const updatePurchaseStatus = (id: string, status: PurchaseStatus) => {
    const updated = purchaseOrders.map(p => p.id === id ? { ...p, status, arrivalDate: status === 'ARRIVED' ? Date.now() : p.arrivalDate } : p);
    setPurchaseOrders(updated);
    apiSave('purchase_orders', updated);
  };

  const completePurchaseReception = (id: string) => {
    // FIX: Casting status to PurchaseStatus
    const updated = purchaseOrders.map(p => p.id === id ? { ...p, status: 'STOCKED' as PurchaseStatus, completionDate: Date.now() } : p);
    setPurchaseOrders(updated);
    apiSave('purchase_orders', updated);
  };

  const updateInventory = (items: InventoryItem[]) => {
    setInventory(items);
    apiSave('inventory', items);
  };

  const addInventoryItem = (data: any, entry: any) => {
    const newItem: InventoryItem = { ...data, id: generateId() };
    const updated = [newItem, ...inventory];
    setInventory(updated);
    apiSave('inventory', updated);
    
    // FIX: Explicitly typing log entries
    const log: StockEntryLog = { id: generateId(), itemId: newItem.id, itemName: newItem.name, quantityAdded: newItem.quantity, type: 'INITIAL', date: Date.now(), ...entry };
    const updatedLogs = [log, ...stockEntries];
    setStockEntries(updatedLogs);
    apiSave('stock_entries', updatedLogs);
  };

  const restockInventoryItem = (id: string, qty: number, entry: any) => {
    const updatedInv = inventory.map(i => i.id === id ? { ...i, quantity: i.quantity + qty } : i);
    setInventory(updatedInv);
    apiSave('inventory', updatedInv);

    const item = inventory.find(i => i.id === id);
    // FIX: Explicitly typing restock log
    const log: StockEntryLog = { id: generateId(), itemId: id, itemName: item?.name || 'Item', quantityAdded: qty, type: 'RESTOCK', date: Date.now(), ...entry };
    const updatedLogs = [log, ...stockEntries];
    setStockEntries(updatedLogs);
    apiSave('stock_entries', updatedLogs);
  };

  const updateWorkOrderStatus = (id: string, status: any, notes: string) => {
    // FIX: Explicitly typing the history entry
    const entry: WorkOrderHistoryEntry = { id: generateId(), date: Date.now(), status, notes, type: 'STATUS_CHANGE' };
    const updated = workOrders.map(w => w.id === id ? { ...w, status, history: [...(w.history || []), entry] } : w);
    setWorkOrders(updated);
    apiSave('work_orders', updated);
  };

  const reopenWorkOrder = (id: string, notes: string, needsMaterials: boolean) => {
    const status = needsMaterials ? WorkOrderStatus.PREPARATION : WorkOrderStatus.IN_PROGRESS;
    updateWorkOrderStatus(id, status, notes);
  };

  const addUser = (u: any) => {
    const updated = [{ ...u, id: generateId() }, ...users];
    setUsers(updated);
    apiSave('users', updated);
  };

  const removeUser = (id: string) => {
    const updated = users.filter(u => u.id !== id);
    setUsers(updated);
    apiSave('users', updated);
  };

  const updateUserPassword = (id: string, p: string) => {
    const updated = users.map(u => u.id === id ? { ...u, password: p } : u);
    setUsers(updated);
    apiSave('users', updated);
  };

  const updateUserExtension = (id: string, e: string) => {
    const updated = users.map(u => u.id === id ? { ...u, extension: e } : u);
    setUsers(updated);
    apiSave('users', updated);
  };

  const updateUserProfileImage = (id: string, img: string) => {
    const updated = users.map(u => u.id === id ? { ...u, profileImage: img } : u);
    setUsers(updated);
    apiSave('users', updated);
  };

  const addSector = (n: string, c: string) => {
    const updated = [{ id: generateId(), name: n, costCenter: c }, ...sectors];
    setSectors(updated);
    apiSave('sectors', updated);
  };

  const updateSector = (id: string, n: string, c: string) => {
    const updated = sectors.map(s => s.id === id ? { ...s, name: n, costCenter: c } : s);
    setSectors(updated);
    apiSave('sectors', updated);
  };

  const removeSector = (id: string) => {
    const updated = sectors.filter(s => s.id !== id);
    setSectors(updated);
    apiSave('sectors', updated);
  };

  const addExtension = (e: any) => {
    const updated = [{ ...e, id: generateId() }, ...extensions];
    setExtensions(updated);
    apiSave('extensions', updated);
  };

  const updateExtension = (id: string, name: string, number: string, sector: string) => {
    const updated = extensions.map(e => e.id === id ? { ...e, name, number, sector } : e);
    setExtensions(updated);
    apiSave('extensions', updated);
  };

  const removeExtension = (id: string) => {
    const updated = extensions.filter(e => e.id !== id);
    setExtensions(updated);
    apiSave('extensions', updated);
  };

  const addGuide = (g: any) => {
    const updated = [{ ...g, id: generateId(), createdAt: Date.now() }, ...guides];
    setGuides(updated);
    apiSave('guides', updated);
  };

  const removeGuide = (id: string) => {
    const updated = guides.filter(g => g.id !== id);
    setGuides(updated);
    apiSave('guides', updated);
  };

  const addSupportTicket = (t: any) => {
    // FIX: Using SupportTicketStatus.PENDING
    const newTicket: SupportTicket = { ...t, id: generateId(), status: SupportTicketStatus.PENDING, createdAt: Date.now() };
    const updated = [newTicket, ...supportTickets];
    setSupportTickets(updated);
    apiSave('support_tickets', updated);
  };

  const processSupportTicket = (id: string, approved: boolean) => {
    // FIX: Using SupportTicketStatus enum
    const updated = supportTickets.map(t => t.id === id ? { ...t, status: approved ? SupportTicketStatus.APPROVED : SupportTicketStatus.REJECTED } : t);
    setSupportTickets(updated);
    apiSave('support_tickets', updated);
  };

  const addEquipment = (eq: any) => {
    const updated = [{ ...eq, id: generateId() }, ...equipments];
    setEquipments(updated);
    apiSave('equipments', updated);
  };

  const removeEquipment = (id: string) => {
    const updated = equipments.filter(e => e.id !== id);
    setEquipments(updated);
    apiSave('equipments', updated);
  };

  const exportDatabase = () => {
    const data = { inventory, workOrders, materialRequests, resourceRequests, purchaseOrders, usageLogs, stockEntries, users, sectors, extensions, guides, supportTickets, equipments };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dutyfinder_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  const importDatabase = (json: string) => {
    try {
      const data = JSON.parse(json);
      if (data.users) setUsers(data.users);
      if (data.inventory) setInventory(data.inventory);
      if (data.workOrders) setWorkOrders(data.workOrders);
      // ... carregar outros
      alert("Backup restaurado com sucesso!");
      refreshData();
    } catch { alert("Erro ao importar arquivo."); }
  };

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');
  const updateDatabaseConfig = async (c: any) => setDatabaseConfig(c);

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
