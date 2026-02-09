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
  Extension,
  MaintenanceGuide,
  SupportTicket,
  SupportTicketStatus,
  DatabaseConfig,
  Equipment
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
  guides: MaintenanceGuide[];
  supportTickets: SupportTicket[];
  equipments: Equipment[];
  databaseConfig: DatabaseConfig;
  theme: 'light' | 'dark';
  
  toggleTheme: () => void;
  updateDatabaseConfig: (config: DatabaseConfig) => void;
  addWorkOrder: (wo: Omit<WorkOrder, 'id' | 'createdAt' | 'requests' | 'status' | 'history'>, needsMaterials: boolean) => void;
  createMaterialRequest: (workOrderId: string, items: MaterialRequestItem[]) => void;
  processRequest: (requestId: string, approved: boolean) => void;
  addResourceRequest: (req: Omit<ResourceRequest, 'id' | 'createdAt' | 'status'>) => void;
  processResourceRequest: (requestId: string, approved: boolean, approverName: string) => void;
  addPurchaseOrder: (po: Omit<PurchaseOrder, 'id' | 'status'>) => void;
  updatePurchaseStatus: (id: string, status: PurchaseStatus) => void;
  completePurchaseReception: (purchaseOrderId: string) => void;
  updateInventory: (item: InventoryItem) => void;
  addInventoryItem: (
    itemData: Omit<InventoryItem, 'id'>, 
    entryData: { purchaseId: string; invoiceNumber?: string; noInvoiceReason?: string }
  ) => void;
  restockInventoryItem: (
    itemId: string, 
    quantityToAdd: number,
    entryData: { purchaseId: string; invoiceNumber?: string; noInvoiceReason?: string }
  ) => void;
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
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const KEYS = {
  INVENTORY: 'df_inventory',
  WORK_ORDERS: 'df_work_orders',
  MATERIAL_REQUESTS: 'df_material_requests',
  RESOURCE_REQUESTS: 'df_resource_requests',
  PURCHASE_ORDERS: 'df_purchase_orders',
  USAGE_LOGS: 'df_usage_logs',
  STOCK_ENTRIES: 'df_stock_entries',
  USERS: 'df_users',
  SECTORS: 'df_sectors',
  EXTENSIONS: 'df_extensions',
  GUIDES: 'df_guides',
  SUPPORT_TICKETS: 'df_support_tickets',
  EQUIPMENTS: 'df_equipments',
  THEME: 'df_theme'
};

const INITIAL_INVENTORY: InventoryItem[] = [
  { id: '1', name: 'Parafuso Sextavado M6', category: 'Fixadores', quantity: 500, unit: 'un', minThreshold: 100, sectorId: '1' },
  { id: '2', name: 'Óleo Lubrificante 10W40', category: 'Fluidos', quantity: 25, unit: 'L', minThreshold: 5, sectorId: '1' },
];

const INITIAL_USERS: User[] = [
  { id: '0', username: 'super', password: '123', name: 'Super Admin', role: 'SUPER_ADMIN', hasPortalAccess: true },
  { id: '1', username: 'admin', password: '123', name: 'Admin TI', role: 'IT_ADMIN', hasPortalAccess: true, extension: '101' },
  { id: 'user', username: 'user', password: '123', name: 'Colaborador Teste', role: 'USER', hasPortalAccess: true },
];

const INITIAL_SECTORS: Sector[] = [
  { id: '1', name: 'Manutenção', costCenter: '1001' },
  { id: '2', name: 'TI', costCenter: '1002' },
];

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const load = <T,>(key: string, defaultValue: T): T => {
    const saved = localStorage.getItem(key);
    try {
      return saved ? JSON.parse(saved) : defaultValue;
    } catch {
      return defaultValue;
    }
  };

  const [inventory, setInventory] = useState<InventoryItem[]>(() => load(KEYS.INVENTORY, INITIAL_INVENTORY));
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>(() => load(KEYS.WORK_ORDERS, []));
  const [materialRequests, setMaterialRequests] = useState<MaterialRequest[]>(() => load(KEYS.MATERIAL_REQUESTS, []));
  const [resourceRequests, setResourceRequests] = useState<ResourceRequest[]>(() => load(KEYS.RESOURCE_REQUESTS, []));
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>(() => load(KEYS.PURCHASE_ORDERS, []));
  const [usageLogs, setUsageLogs] = useState<UsageLog[]>(() => load(KEYS.USAGE_LOGS, []));
  const [stockEntries, setStockEntries] = useState<StockEntryLog[]>(() => load(KEYS.STOCK_ENTRIES, []));
  const [users, setUsers] = useState<User[]>(() => load(KEYS.USERS, INITIAL_USERS));
  const [sectors, setSectors] = useState<Sector[]>(() => load(KEYS.SECTORS, INITIAL_SECTORS));
  const [extensions, setExtensions] = useState<Extension[]>(() => load(KEYS.EXTENSIONS, []));
  const [guides, setGuides] = useState<MaintenanceGuide[]>(() => load(KEYS.GUIDES, []));
  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>(() => load(KEYS.SUPPORT_TICKETS, []));
  const [equipments, setEquipments] = useState<Equipment[]>(() => load(KEYS.EQUIPMENTS, []));
  const [theme, setTheme] = useState<'light' | 'dark'>(() => load(KEYS.THEME, 'dark'));
  const [databaseConfig] = useState<DatabaseConfig>({ type: 'LOCAL', status: 'LOCAL' });

  useEffect(() => { localStorage.setItem(KEYS.INVENTORY, JSON.stringify(inventory)); }, [inventory]);
  useEffect(() => { localStorage.setItem(KEYS.WORK_ORDERS, JSON.stringify(workOrders)); }, [workOrders]);
  useEffect(() => { localStorage.setItem(KEYS.MATERIAL_REQUESTS, JSON.stringify(materialRequests)); }, [materialRequests]);
  useEffect(() => { localStorage.setItem(KEYS.RESOURCE_REQUESTS, JSON.stringify(resourceRequests)); }, [resourceRequests]);
  useEffect(() => { localStorage.setItem(KEYS.PURCHASE_ORDERS, JSON.stringify(purchaseOrders)); }, [purchaseOrders]);
  useEffect(() => { localStorage.setItem(KEYS.USAGE_LOGS, JSON.stringify(usageLogs)); }, [usageLogs]);
  useEffect(() => { localStorage.setItem(KEYS.STOCK_ENTRIES, JSON.stringify(stockEntries)); }, [stockEntries]);
  useEffect(() => { localStorage.setItem(KEYS.USERS, JSON.stringify(users)); }, [users]);
  useEffect(() => { localStorage.setItem(KEYS.SECTORS, JSON.stringify(sectors)); }, [sectors]);
  useEffect(() => { localStorage.setItem(KEYS.EXTENSIONS, JSON.stringify(extensions)); }, [extensions]);
  useEffect(() => { localStorage.setItem(KEYS.GUIDES, JSON.stringify(guides)); }, [guides]);
  useEffect(() => { localStorage.setItem(KEYS.SUPPORT_TICKETS, JSON.stringify(supportTickets)); }, [supportTickets]);
  useEffect(() => { localStorage.setItem(KEYS.EQUIPMENTS, JSON.stringify(equipments)); }, [equipments]);
  useEffect(() => {
    localStorage.setItem(KEYS.THEME, JSON.stringify(theme));
    if (theme === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');
  const updateDatabaseConfig = () => {}; 

  const exportDatabase = () => {
    const data = {
      inventory, workOrders, materialRequests, resourceRequests, purchaseOrders, 
      usageLogs, stockEntries, users, sectors, extensions, guides, supportTickets, equipments
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `dutyfinder_backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  };

  const importDatabase = (jsonData: string) => {
    try {
      const data = JSON.parse(jsonData);
      if (data.inventory) setInventory(data.inventory);
      if (data.workOrders) setWorkOrders(data.workOrders);
      if (data.materialRequests) setMaterialRequests(data.materialRequests);
      if (data.resourceRequests) setResourceRequests(data.resourceRequests);
      if (data.purchaseOrders) setPurchaseOrders(data.purchaseOrders);
      if (data.usageLogs) setUsageLogs(data.usageLogs);
      if (data.stockEntries) setStockEntries(data.stockEntries);
      if (data.users) setUsers(data.users);
      if (data.sectors) setSectors(data.sectors);
      if (data.extensions) setExtensions(data.extensions);
      if (data.guides) setGuides(data.guides);
      if (data.supportTickets) setSupportTickets(data.supportTickets);
      if (data.equipments) setEquipments(data.equipments);
      alert("Banco de dados local importado com sucesso!");
    } catch (e) {
      alert("Erro ao importar dados. Verifique o formato do arquivo.");
    }
  };

  const addWorkOrder = (woData: any, needsMaterials: boolean) => {
    const initialStatus = needsMaterials ? WorkOrderStatus.PREPARATION : WorkOrderStatus.IN_PROGRESS;
    const newWO: WorkOrder = {
      ...woData,
      id: crypto.randomUUID(),
      status: initialStatus,
      createdAt: Date.now(),
      requests: [],
      history: []
    };
    setWorkOrders(prev => [newWO, ...prev]);
  };

  const createMaterialRequest = (workOrderId: string, items: MaterialRequestItem[]) => {
    const wo = workOrders.find(w => w.id === workOrderId);
    if (!wo) return;
    const newRequest: MaterialRequest = {
      id: crypto.randomUUID(),
      workOrderId,
      workOrderTitle: wo.title,
      items,
      status: RequestStatus.PENDING,
      createdAt: Date.now()
    };
    setMaterialRequests(prev => [newRequest, ...prev]);
    setWorkOrders(prev => prev.map(w => w.id === workOrderId ? { ...w, requests: [...w.requests, newRequest.id] } : w));
  };

  const processRequest = (requestId: string, approved: boolean) => {
    const request = materialRequests.find(r => r.id === requestId);
    if (!request || request.status !== RequestStatus.PENDING) return;
    if (!approved) {
      setMaterialRequests(prev => prev.map(r => r.id === requestId ? { ...r, status: RequestStatus.REJECTED } : r));
      return;
    }
    let canProcess = true;
    const updatedInventory = [...inventory];
    for (const reqItem of request.items) {
      const invItem = updatedInventory.find(i => i.id === reqItem.itemId);
      if (!invItem || invItem.quantity < reqItem.quantityRequested) {
        canProcess = false;
        alert(`Estoque insuficiente para: ${reqItem.itemName}`);
        break;
      }
    }
    if (canProcess) {
      const logs: UsageLog[] = [];
      request.items.forEach(reqItem => {
        const idx = updatedInventory.findIndex(i => i.id === reqItem.itemId);
        updatedInventory[idx].quantity -= reqItem.quantityRequested;
        logs.push({
          id: crypto.randomUUID(),
          requestId: request.id,
          workOrderId: request.workOrderId,
          itemName: reqItem.itemName,
          quantityUsed: reqItem.quantityRequested,
          date: Date.now()
        });
      });
      setInventory(updatedInventory);
      setUsageLogs(prev => [...logs, ...prev]);
      setMaterialRequests(prev => prev.map(r => r.id === requestId ? { ...r, status: RequestStatus.APPROVED, approvedAt: Date.now() } : r));
      setWorkOrders(prev => prev.map(wo => {
        if (wo.id === request.workOrderId && wo.status === WorkOrderStatus.PREPARATION) {
          return { ...wo, status: WorkOrderStatus.IN_PROGRESS };
        }
        return wo;
      }));
    }
  };

  const addResourceRequest = (req: any) => {
    setResourceRequests(prev => [{ ...req, id: crypto.randomUUID(), status: 'PENDENTE', createdAt: Date.now() }, ...prev]);
  };

  const processResourceRequest = (requestId: string, approved: boolean, approverName: string) => {
    setResourceRequests(prev => prev.map(req => req.id === requestId ? { ...req, status: approved ? 'LIBERADO' : 'REJEITADO', approvedBy: approved ? approverName : undefined, approvedAt: Date.now() } : req));
  };

  const addPurchaseOrder = (po: any) => {
    setPurchaseOrders(prev => [{ ...po, id: crypto.randomUUID(), status: 'ORDERED' }, ...prev]);
  };

  const updatePurchaseStatus = (id: string, status: PurchaseStatus) => {
    setPurchaseOrders(prev => prev.map(po => po.id === id ? { ...po, status, arrivalDate: status === 'ARRIVED' ? Date.now() : po.arrivalDate } : po));
  };

  const completePurchaseReception = (purchaseOrderId: string) => {
    const po = purchaseOrders.find(p => p.id === purchaseOrderId);
    if (!po || po.status === 'STOCKED') return;
    const newInventory = [...inventory];
    const entries: StockEntryLog[] = [];
    po.items.forEach(poItem => {
      const idx = newInventory.findIndex(i => i.name.toLowerCase().trim() === poItem.name.toLowerCase().trim());
      if (idx >= 0) {
        newInventory[idx].quantity += poItem.quantity;
        entries.push({ id: crypto.randomUUID(), itemId: newInventory[idx].id, itemName: poItem.name, quantityAdded: poItem.quantity, purchaseId: po.orderNumber, invoiceNumber: po.invoiceNumber, date: Date.now(), type: 'RESTOCK' });
      } else {
        const newItemId = crypto.randomUUID();
        newInventory.push({ id: newItemId, name: poItem.name, category: poItem.category, quantity: poItem.quantity, unit: poItem.unit, minThreshold: 5 });
        entries.push({ id: crypto.randomUUID(), itemId: newItemId, itemName: poItem.name, quantityAdded: poItem.quantity, purchaseId: po.orderNumber, invoiceNumber: po.invoiceNumber, date: Date.now(), type: 'INITIAL' });
      }
    });
    setInventory(newInventory);
    setStockEntries(prev => [...entries, ...prev]);
    setPurchaseOrders(prev => prev.map(p => p.id === purchaseOrderId ? { ...p, status: 'STOCKED', completionDate: Date.now() } : p));
  };

  const updateInventory = (item: InventoryItem) => setInventory(prev => prev.map(i => i.id === item.id ? item : i));
  const addInventoryItem = (itemData: any, entryData: any) => {
    const id = crypto.randomUUID();
    setInventory(prev => [...prev, { ...itemData, id }]);
    setStockEntries(prev => [{ id: crypto.randomUUID(), itemId: id, itemName: itemData.name, quantityAdded: itemData.quantity, ...entryData, date: Date.now(), type: 'INITIAL' }, ...prev]);
  };

  const restockInventoryItem = (itemId: string, qty: number, entryData: any) => {
    const item = inventory.find(i => i.id === itemId);
    if (!item) return;
    setInventory(prev => prev.map(i => i.id === itemId ? { ...i, quantity: i.quantity + qty } : i));
    setStockEntries(prev => [{ id: crypto.randomUUID(), itemId, itemName: item.name, quantityAdded: qty, ...entryData, date: Date.now(), type: 'RESTOCK' }, ...prev]);
  };

  const updateWorkOrderStatus = (workOrderId: string, newStatus: WorkOrderStatus, notes: string) => {
    setWorkOrders(prev => prev.map(wo => wo.id === workOrderId ? { ...wo, status: newStatus, history: [{ id: crypto.randomUUID(), date: Date.now(), status: newStatus, notes, type: 'STATUS_CHANGE' }, ...wo.history] } : wo));
  };

  const reopenWorkOrder = (workOrderId: string, notes: string, needsMaterials: boolean) => {
    const nextStatus = needsMaterials ? WorkOrderStatus.PREPARATION : WorkOrderStatus.IN_PROGRESS;
    setWorkOrders(prev => prev.map(wo => wo.id === workOrderId ? { ...wo, status: nextStatus, history: [{ id: crypto.randomUUID(), date: Date.now(), status: nextStatus, notes: `Reabertura: ${notes}`, type: 'REOPEN' }, ...wo.history] } : wo));
  };

  const addUser = (u: any) => setUsers(prev => [...prev, { ...u, id: crypto.randomUUID() }]);
  const removeUser = (id: string) => setUsers(prev => prev.filter(u => u.id !== id));
  const updateUserPassword = (id: string, pw: string) => setUsers(prev => prev.map(u => u.id === id ? { ...u, password: pw } : u));
  const updateUserExtension = (id: string, ext: string) => setUsers(prev => prev.map(u => u.id === id ? { ...u, extension: ext } : u));
  const updateUserProfileImage = (id: string, img: string) => setUsers(prev => prev.map(u => u.id === id ? { ...u, profileImage: img } : u));
  
  const addSector = (name: string, costCenter: string) => setSectors(prev => [...prev, { id: crypto.randomUUID(), name, costCenter }]);
  const updateSector = (id: string, name: string, costCenter: string) => setSectors(prev => prev.map(s => s.id === id ? { ...s, name, costCenter } : s));
  const removeSector = (id: string) => setSectors(prev => prev.filter(s => s.id !== id));

  const addExtension = (ext: any) => setExtensions(prev => [...prev, { ...ext, id: crypto.randomUUID() }]);
  const updateExtension = (id: string, name: string, number: string, sector: string) => setExtensions(prev => prev.map(e => e.id === id ? { ...e, name, number, sector } : e));
  const removeExtension = (id: string) => setExtensions(prev => prev.filter(e => e.id !== id));

  const addGuide = (g: any) => setGuides(prev => [{ ...g, id: crypto.randomUUID(), createdAt: Date.now() }, ...prev]);
  const removeGuide = (id: string) => setGuides(prev => prev.filter(g => g.id !== id));

  const addSupportTicket = (t: any) => setSupportTickets(prev => [{ ...t, id: crypto.randomUUID(), status: SupportTicketStatus.PENDING, createdAt: Date.now() }, ...prev]);
  const processSupportTicket = (id: string, approve: boolean, priority: any = 'Média') => {
    const ticket = supportTickets.find(t => t.id === id);
    if (!ticket) return;
    if (approve && ticket.category === 'MAINTENANCE') {
      addWorkOrder({ title: `Chamado: ${ticket.title}`, description: ticket.description, priority, requesterName: ticket.requesterName }, false);
    }
    setSupportTickets(prev => prev.map(t => t.id === id ? { ...t, status: approve ? SupportTicketStatus.APPROVED : SupportTicketStatus.REJECTED } : t));
  };

  const addEquipment = (eq: any) => setEquipments(prev => [...prev, { ...eq, id: crypto.randomUUID() }]);
  const removeEquipment = (id: string) => setEquipments(prev => prev.filter(e => e.id !== id));

  return (
    <AppContext.Provider value={{
      inventory, workOrders, materialRequests, resourceRequests, purchaseOrders, usageLogs, stockEntries, users, sectors, extensions, guides, supportTickets, equipments, databaseConfig, theme,
      toggleTheme, updateDatabaseConfig, addWorkOrder, createMaterialRequest, processRequest, addResourceRequest, processResourceRequest, addPurchaseOrder, updatePurchaseStatus, completePurchaseReception,
      updateInventory, addInventoryItem, restockInventoryItem, updateWorkOrderStatus, reopenWorkOrder, addUser, removeUser, updateUserPassword, updateUserExtension, updateUserProfileImage,
      addSector, updateSector, removeSector, addExtension, updateExtension, removeExtension, addGuide, removeGuide, addSupportTicket, processSupportTicket, addEquipment, removeEquipment, exportDatabase, importDatabase
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