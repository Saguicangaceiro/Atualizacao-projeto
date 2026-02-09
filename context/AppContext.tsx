
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

// URL do Servidor Python na Intranet (Pode ser alterado para o IP do servidor)
const API_BASE = "http://localhost:5000/api";

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
  const [guides, setGuides] = useState<MaintenanceGuide[]>([]);
  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>([]);
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [serverStatus, setServerStatus] = useState<'ONLINE' | 'OFFLINE' | 'CONNECTING'>('CONNECTING');
  const [databaseConfig, setDatabaseConfig] = useState<DatabaseConfig>({ type: 'LOCAL', status: 'LOCAL' });

  // Funções de API
  const apiSave = async (entity: string, data: any) => {
    try {
      await fetch(`${API_BASE}/save/${entity}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
    } catch (e) {
      console.error(`Falha ao salvar ${entity} no servidor:`, e);
      setServerStatus('OFFLINE');
    }
  };

  const apiLoad = async (entity: string) => {
    try {
      const res = await fetch(`${API_BASE}/load/${entity}`);
      if (res.ok) return await res.json();
    } catch (e) {
      setServerStatus('OFFLINE');
    }
    return null;
  };

  const refreshData = useCallback(async () => {
    setServerStatus('CONNECTING');
    const entities = [
      { key: 'inventory', setter: setInventory },
      { key: 'work_orders', setter: setWorkOrders },
      { key: 'material_requests', setter: setMaterialRequests },
      { key: 'resource_requests', setter: setResourceRequests },
      { key: 'purchase_orders', setter: setPurchaseOrders },
      { key: 'usage_logs', setter: setUsageLogs },
      { key: 'stock_entries', setter: setStockEntries },
      { key: 'users', setter: setUsers },
      { key: 'sectors', setter: setSectors },
      { key: 'extensions', setter: setExtensions },
      { key: 'guides', setter: setGuides },
      { key: 'support_tickets', setter: setSupportTickets },
      { key: 'equipments', setter: setEquipments }
    ];

    let allOk = true;
    for (const entity of entities) {
      const data = await apiLoad(entity.key);
      if (data) entity.setter(data);
      else allOk = false;
    }
    
    if (allOk) setServerStatus('ONLINE');
    else setServerStatus('OFFLINE');
  }, []);

  useEffect(() => {
    refreshData();
    // Pooling para manter dados atualizados na intranet a cada 30 segundos
    const interval = setInterval(refreshData, 30000);
    return () => clearInterval(interval);
  }, [refreshData]);

  // Wrappers para persistência automática
  useEffect(() => { if(inventory.length) apiSave('inventory', inventory); }, [inventory]);
  useEffect(() => { if(workOrders.length) apiSave('work_orders', workOrders); }, [workOrders]);
  useEffect(() => { if(materialRequests.length) apiSave('material_requests', materialRequests); }, [materialRequests]);
  useEffect(() => { if(resourceRequests.length) apiSave('resource_requests', resourceRequests); }, [resourceRequests]);
  useEffect(() => { if(purchaseOrders.length) apiSave('purchase_orders', purchaseOrders); }, [purchaseOrders]);
  useEffect(() => { if(usageLogs.length) apiSave('usage_logs', usageLogs); }, [usageLogs]);
  useEffect(() => { if(stockEntries.length) apiSave('stock_entries', stockEntries); }, [stockEntries]);
  useEffect(() => { if(users.length) apiSave('users', users); }, [users]);
  useEffect(() => { if(sectors.length) apiSave('sectors', sectors); }, [sectors]);
  useEffect(() => { if(extensions.length) apiSave('extensions', extensions); }, [extensions]);
  useEffect(() => { if(guides.length) apiSave('guides', guides); }, [guides]);
  useEffect(() => { if(supportTickets.length) apiSave('support_tickets', supportTickets); }, [supportTickets]);
  useEffect(() => { if(equipments.length) apiSave('equipments', equipments); }, [equipments]);

  const updateDatabaseConfig = async (config: DatabaseConfig) => {
    try {
      const res = await fetch(`${API_BASE}/config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      const result = await res.json();
      if (res.ok) {
        setDatabaseConfig({ ...config, status: 'CONNECTED' });
        alert(result.message);
        refreshData();
      } else {
        alert("Erro: " + result.message);
      }
    } catch (e) {
      alert("Falha ao conectar ao servidor backend Python.");
    }
  };

  // Funções de Negócio (Adaptadas para chamadas de estado que disparam useEffects de API)
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
    const updatedInventory = [...inventory];
    let canProcess = true;
    for (const reqItem of request.items) {
      const invItem = updatedInventory.find(i => i.id === reqItem.itemId);
      if (!invItem || invItem.quantity < reqItem.quantityRequested) {
        canProcess = false;
        alert(`Estoque insuficiente: ${reqItem.itemName}`);
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
      setWorkOrders(prev => prev.map(wo => wo.id === request.workOrderId && wo.status === WorkOrderStatus.PREPARATION ? { ...wo, status: WorkOrderStatus.IN_PROGRESS } : wo));
    }
  };

  const addResourceRequest = (req: any) => setResourceRequests(prev => [{ ...req, id: crypto.randomUUID(), status: 'PENDENTE', createdAt: Date.now() }, ...prev]);
  const processResourceRequest = (requestId: string, approved: boolean, approverName: string) => setResourceRequests(prev => prev.map(req => req.id === requestId ? { ...req, status: approved ? 'LIBERADO' : 'REJEITADO', approvedBy: approved ? approverName : undefined, approvedAt: Date.now() } : req));
  const addPurchaseOrder = (po: any) => setPurchaseOrders(prev => [{ ...po, id: crypto.randomUUID(), status: 'ORDERED' }, ...prev]);
  const updatePurchaseStatus = (id: string, status: PurchaseStatus) => setPurchaseOrders(prev => prev.map(po => po.id === id ? { ...po, status, arrivalDate: status === 'ARRIVED' ? Date.now() : po.arrivalDate } : po));
  const completePurchaseReception = (purchaseOrderId: string) => {
    const po = purchaseOrders.find(p => p.id === purchaseOrderId);
    if (!po || po.status === 'STOCKED') return;
    const newInventory = [...inventory];
    const entries: StockEntryLog[] = [];
    po.items.forEach(item => {
      const idx = newInventory.findIndex(i => i.name.toLowerCase().trim() === item.name.toLowerCase().trim());
      if (idx >= 0) {
        newInventory[idx].quantity += item.quantity;
        entries.push({ id: crypto.randomUUID(), itemId: newInventory[idx].id, itemName: item.name, quantityAdded: item.quantity, purchaseId: po.orderNumber, invoiceNumber: po.invoiceNumber, date: Date.now(), type: 'RESTOCK' });
      } else {
        const id = crypto.randomUUID();
        newInventory.push({ id, name: item.name, category: item.category, quantity: item.quantity, unit: item.unit, minThreshold: 5 });
        entries.push({ id: crypto.randomUUID(), itemId: id, itemName: item.name, quantityAdded: item.quantity, purchaseId: po.orderNumber, invoiceNumber: po.invoiceNumber, date: Date.now(), type: 'INITIAL' });
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
  const updateWorkOrderStatus = (workOrderId: string, newStatus: WorkOrderStatus, notes: string) => setWorkOrders(prev => prev.map(wo => wo.id === workOrderId ? { ...wo, status: newStatus, history: [{ id: crypto.randomUUID(), date: Date.now(), status: newStatus, notes, type: 'STATUS_CHANGE' }, ...wo.history] } : wo));
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
    if (approve && ticket.category === 'MAINTENANCE') addWorkOrder({ title: `Chamado: ${ticket.title}`, description: ticket.description, priority, requesterName: ticket.requesterName }, false);
    setSupportTickets(prev => prev.map(t => t.id === id ? { ...t, status: approve ? SupportTicketStatus.APPROVED : SupportTicketStatus.REJECTED } : t));
  };
  const addEquipment = (eq: any) => setEquipments(prev => [...prev, { ...eq, id: crypto.randomUUID() }]);
  const removeEquipment = (id: string) => setEquipments(prev => prev.filter(e => e.id !== id));
  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');
  const exportDatabase = () => {
    const data = { inventory, workOrders, materialRequests, resourceRequests, purchaseOrders, usageLogs, stockEntries, users, sectors, extensions, guides, supportTickets, equipments };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `dutyfinder_intranet_backup.json`;
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
      alert("Importação concluída. Sincronizando com servidor...");
    } catch (e) {
      alert("Erro ao importar.");
    }
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
  if (!context) throw new Error("useApp must be used within AppProvider");
  return context;
};
