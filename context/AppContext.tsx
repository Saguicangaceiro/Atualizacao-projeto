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
  
  // Actions
  toggleTheme: () => void;
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

  addSector: (name: string, costCenter: string) => void;
  updateSector: (id: string, name: string, costCenter: string) => void;
  removeSector: (sectorId: string) => void;

  addExtension: (ext: Omit<Extension, 'id'>) => void;
  updateExtension: (id: string, name: string, number: string, sector: string) => void;
  removeExtension: (id: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Initial Mock Data
const INITIAL_INVENTORY: InventoryItem[] = [
  { id: '1', name: 'Parafuso Sextavado M6', category: 'Fixadores', quantity: 500, unit: 'un', minThreshold: 100 },
  { id: '2', name: 'Óleo Lubrificante 10W40', category: 'Fluidos', quantity: 25, unit: 'L', minThreshold: 5 },
  { id: '3', name: 'Rolamento 6205', category: 'Peças Mecânicas', quantity: 12, unit: 'un', minThreshold: 3 },
  { id: '4', name: 'Fita Isolante 3M', category: 'Elétrica', quantity: 30, unit: 'rolo', minThreshold: 5 },
  { id: '5', name: 'Cabo 2.5mm', category: 'Elétrica', quantity: 200, unit: 'm', minThreshold: 50 },
  { id: '6', name: 'Disjuntor 20A', category: 'Elétrica', quantity: 15, unit: 'un', minThreshold: 5 },
  { id: '7', name: 'Cola PVC', category: 'Hidráulica', quantity: 8, unit: 'frasco', minThreshold: 2 },
];

const INITIAL_USERS: User[] = [
  { id: '0', username: 'super', password: '123', name: 'Super Admin', role: 'SUPER_ADMIN', hasPortalAccess: true }, // Removido ramal do Super Admin
  { id: '1', username: 'admin', password: '123', name: 'Admin TI', role: 'IT_ADMIN', hasPortalAccess: true, extension: '101' },
  { id: '2', username: 'tecnico', password: '123', name: 'Téc. Silva', role: 'MAINTENANCE', hasPortalAccess: false, extension: '201' },
  { id: '3', username: 'almox', password: '123', name: 'Almox. Roberto', role: 'WAREHOUSE', hasPortalAccess: false, extension: '301' },
  { id: '4', username: 'compras', password: '123', name: 'Compras Juliana', role: 'PURCHASING', hasPortalAccess: false, extension: '401' },
  { id: '5', username: 'portaria', password: '123', name: 'Porteiro João', role: 'GATEHOUSE', hasPortalAccess: false, extension: '501' },
  { id: '6', username: 'user', password: '123', name: 'Funcionário Ana', role: 'USER', hasPortalAccess: true, extension: '601' },
];

const INITIAL_SECTORS: Sector[] = [
  { id: '1', name: 'Manutenção', costCenter: '1001' },
  { id: '2', name: 'TI', costCenter: '1002' },
  { id: '3', name: 'RH', costCenter: '1003' },
  { id: '4', name: 'Administrativo', costCenter: '1004' },
  { id: '5', name: 'Produção', costCenter: '2001' },
];

const INITIAL_EXTENSIONS: Extension[] = [
  { id: '1', name: 'Recepção', number: '100', sector: 'Administrativo' },
  { id: '2', name: 'TI - Suporte', number: '101', sector: 'TI' },
  { id: '3', name: 'Manutenção Predial', number: '201', sector: 'Manutenção' },
];

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [inventory, setInventory] = useState<InventoryItem[]>(INITIAL_INVENTORY);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [materialRequests, setMaterialRequests] = useState<MaterialRequest[]>([]);
  const [resourceRequests, setResourceRequests] = useState<ResourceRequest[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [usageLogs, setUsageLogs] = useState<UsageLog[]>([]);
  const [stockEntries, setStockEntries] = useState<StockEntryLog[]>([]);
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  const [sectors, setSectors] = useState<Sector[]>(INITIAL_SECTORS);
  const [extensions, setExtensions] = useState<Extension[]>(INITIAL_EXTENSIONS);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    if (savedTheme) {
      setTheme(savedTheme);
      if (savedTheme === 'light') {
        document.documentElement.classList.remove('dark');
      } else {
        document.documentElement.classList.add('dark');
      }
    } else {
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const addWorkOrder = (
    woData: Omit<WorkOrder, 'id' | 'createdAt' | 'requests' | 'status' | 'history'>, 
    needsMaterials: boolean
  ) => {
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
    setWorkOrders(prev => prev.map(w => {
      if (w.id === workOrderId) {
        return { 
          ...w, 
          requests: [...w.requests, newRequest.id],
          status: w.status === WorkOrderStatus.FAILED ? w.status : WorkOrderStatus.PREPARATION 
        };
      }
      return w;
    }));
  };

  const processRequest = (requestId: string, approved: boolean) => {
    const request = materialRequests.find(r => r.id === requestId);
    if (!request || request.status !== RequestStatus.PENDING) return;
    let updatedRequests = [...materialRequests];
    if (!approved) {
      updatedRequests = updatedRequests.map(r => r.id === requestId ? { ...r, status: RequestStatus.REJECTED } : r);
      setMaterialRequests(updatedRequests);
      return;
    }
    const newInventory = [...inventory];
    const newLogs: UsageLog[] = [];
    let possible = true;
    for (const reqItem of request.items) {
      const invItem = newInventory.find(i => i.id === reqItem.itemId);
      if (!invItem || invItem.quantity < reqItem.quantityRequested) {
        possible = false;
        alert(`Estoque insuficiente para: ${reqItem.itemName}`);
        break;
      }
    }
    if (possible) {
      request.items.forEach(reqItem => {
        const index = newInventory.findIndex(i => i.id === reqItem.itemId);
        if (index !== -1) {
          newInventory[index] = { ...newInventory[index], quantity: newInventory[index].quantity - reqItem.quantityRequested };
          newLogs.push({
            id: crypto.randomUUID(),
            requestId: request.id,
            workOrderId: request.workOrderId,
            itemName: reqItem.itemName,
            quantityUsed: reqItem.quantityRequested,
            date: Date.now()
          });
        }
      });
      updatedRequests = updatedRequests.map(r => r.id === requestId ? { ...r, status: RequestStatus.APPROVED, approvedAt: Date.now() } : r);
      setInventory(newInventory);
      setUsageLogs(prev => [...newLogs, ...prev]);
      setMaterialRequests(updatedRequests);
      const woRequests = updatedRequests.filter(r => r.workOrderId === request.workOrderId);
      const allApproved = woRequests.every(r => r.status === RequestStatus.APPROVED);
      if (allApproved) {
        setWorkOrders(prev => prev.map(wo => {
          if (wo.id === request.workOrderId && wo.status === WorkOrderStatus.PREPARATION) {
            return { ...wo, status: WorkOrderStatus.IN_PROGRESS };
          }
          return wo;
        }));
      }
    }
  };

  const addResourceRequest = (req: Omit<ResourceRequest, 'id' | 'createdAt' | 'status'>) => {
    const newReq: ResourceRequest = {
      ...req,
      id: crypto.randomUUID(),
      status: 'PENDENTE',
      createdAt: Date.now()
    };
    setResourceRequests(prev => [newReq, ...prev]);
  };

  const processResourceRequest = (requestId: string, approved: boolean, approverName: string) => {
    setResourceRequests(prev => prev.map(req => {
      if (req.id === requestId) {
        return {
          ...req,
          status: approved ? 'LIBERADO' : 'REJEITADO',
          approvedBy: approved ? approverName : undefined,
          approvedAt: Date.now()
        };
      }
      return req;
    }));
  };

  const addPurchaseOrder = (po: Omit<PurchaseOrder, 'id' | 'status'>) => {
    const newPO: PurchaseOrder = {
      ...po,
      id: crypto.randomUUID(),
      status: 'ORDERED'
    };
    setPurchaseOrders(prev => [newPO, ...prev]);
  };

  const updatePurchaseStatus = (id: string, status: PurchaseStatus) => {
    setPurchaseOrders(prev => prev.map(po => {
      if (po.id === id) {
        // Deep copy to ensure update is detected
        return { 
          ...po, 
          status: status, 
          arrivalDate: status === 'ARRIVED' ? Date.now() : po.arrivalDate 
        };
      }
      return po;
    }));
  };

  const completePurchaseReception = (purchaseOrderId: string) => {
    const po = purchaseOrders.find(p => p.id === purchaseOrderId);
    if (!po || po.status === 'STOCKED') return;

    let updatedInventory = [...inventory];
    const newEntries: StockEntryLog[] = [];

    po.items.forEach(poItem => {
      const existingItemIndex = updatedInventory.findIndex(
        i => i.name.toLowerCase().trim() === poItem.name.toLowerCase().trim()
      );

      let itemId = '';

      if (existingItemIndex >= 0) {
        updatedInventory[existingItemIndex] = {
          ...updatedInventory[existingItemIndex],
          quantity: updatedInventory[existingItemIndex].quantity + poItem.quantity
        };
        itemId = updatedInventory[existingItemIndex].id;
      } else {
        itemId = crypto.randomUUID();
        const newItem: InventoryItem = {
          id: itemId,
          name: poItem.name,
          category: poItem.category,
          quantity: poItem.quantity,
          unit: poItem.unit,
          minThreshold: 5
        };
        updatedInventory.push(newItem);
      }

      newEntries.push({
        id: crypto.randomUUID(),
        itemId: itemId,
        itemName: poItem.name,
        quantityAdded: poItem.quantity,
        purchaseId: po.orderNumber,
        invoiceNumber: po.invoiceNumber,
        date: Date.now(),
        type: 'RESTOCK'
      });
    });

    setInventory(updatedInventory);
    setStockEntries(prev => [...newEntries, ...prev]);
    setPurchaseOrders(prev => prev.map(p => 
      p.id === purchaseOrderId 
        ? { ...p, status: 'STOCKED', completionDate: Date.now() } 
        : p
    ));
  };

  const updateInventory = (item: InventoryItem) => {
    setInventory(prev => prev.map(i => i.id === item.id ? item : i));
  };

  const addInventoryItem = (
    itemData: Omit<InventoryItem, 'id'>, 
    entryData: { purchaseId: string; invoiceNumber?: string; noInvoiceReason?: string }
  ) => {
    const newItemId = crypto.randomUUID();
    const newItem: InventoryItem = { ...itemData, id: newItemId };
    const newEntry: StockEntryLog = {
      id: crypto.randomUUID(),
      itemId: newItemId,
      itemName: newItem.name,
      quantityAdded: newItem.quantity,
      purchaseId: entryData.purchaseId,
      invoiceNumber: entryData.invoiceNumber,
      noInvoiceReason: entryData.noInvoiceReason,
      date: Date.now(),
      type: 'INITIAL'
    };
    setInventory(prev => [...prev, newItem]);
    setStockEntries(prev => [newEntry, ...prev]);
  };

  const restockInventoryItem = (
    itemId: string, 
    quantityToAdd: number,
    entryData: { purchaseId: string; invoiceNumber?: string; noInvoiceReason?: string }
  ) => {
    setInventory(prev => prev.map(item => {
      if (item.id === itemId) {
        return { ...item, quantity: item.quantity + quantityToAdd };
      }
      return item;
    }));
    const item = inventory.find(i => i.id === itemId);
    if (item) {
      const newEntry: StockEntryLog = {
        id: crypto.randomUUID(),
        itemId: itemId,
        itemName: item.name,
        quantityAdded: quantityToAdd,
        purchaseId: entryData.purchaseId,
        invoiceNumber: entryData.invoiceNumber,
        noInvoiceReason: entryData.noInvoiceReason,
        date: Date.now(),
        type: 'RESTOCK'
      };
      setStockEntries(prev => [newEntry, ...prev]);
    }
  };

  const updateWorkOrderStatus = (workOrderId: string, newStatus: WorkOrderStatus, notes: string) => {
    setWorkOrders(prev => prev.map(wo => {
      if (wo.id === workOrderId) {
        const historyEntry: WorkOrderHistoryEntry = {
          id: crypto.randomUUID(),
          date: Date.now(),
          status: newStatus,
          notes: notes,
          type: 'STATUS_CHANGE'
        };
        return { ...wo, status: newStatus, history: [historyEntry, ...wo.history] };
      }
      return wo;
    }));
  };

  const reopenWorkOrder = (workOrderId: string, notes: string, needsMaterials: boolean) => {
    setWorkOrders(prev => prev.map(wo => {
      if (wo.id === workOrderId) {
        const nextStatus = needsMaterials ? WorkOrderStatus.PREPARATION : WorkOrderStatus.IN_PROGRESS;
        const historyEntry: WorkOrderHistoryEntry = {
          id: crypto.randomUUID(),
          date: Date.now(),
          status: nextStatus,
          notes: `Reabertura: ${notes}. ${needsMaterials ? 'Solicitação de novos materiais necessária.' : 'Sem necessidade de novos materiais.'}`,
          type: 'REOPEN'
        };
        return { ...wo, status: nextStatus, history: [historyEntry, ...wo.history] };
      }
      return wo;
    }));
  };

  const addUser = (userData: Omit<User, 'id'>) => {
    const newUser: User = { ...userData, id: crypto.randomUUID() };
    setUsers(prev => [...prev, newUser]);
  };

  const removeUser = (userId: string) => {
    setUsers(prev => prev.filter(u => u.id !== userId));
  };

  const updateUserPassword = (userId: string, newPassword: string) => {
    setUsers(prev => prev.map(u => {
      if (u.id === userId) {
        return { ...u, password: newPassword };
      }
      return u;
    }));
  };

  const updateUserExtension = (userId: string, extension: string) => {
    setUsers(prev => prev.map(u => {
      if (u.id === userId) {
        return { ...u, extension };
      }
      return u;
    }));
  };

  const addSector = (name: string, costCenter: string) => {
    const newSector: Sector = { id: crypto.randomUUID(), name, costCenter };
    setSectors(prev => [...prev, newSector]);
  };

  const updateSector = (id: string, name: string, costCenter: string) => {
    setSectors(prev => prev.map(s => s.id === id ? { ...s, name, costCenter } : s));
  };

  const removeSector = (sectorId: string) => {
    setSectors(prev => prev.filter(s => s.id !== sectorId));
  };

  const addExtension = (ext: Omit<Extension, 'id'>) => {
    const newExt: Extension = { ...ext, id: crypto.randomUUID() };
    setExtensions(prev => [...prev, newExt]);
  };

  const updateExtension = (id: string, name: string, number: string, sector: string) => {
    setExtensions(prev => prev.map(e => e.id === id ? { ...e, name, number, sector } : e));
  };

  const removeExtension = (id: string) => {
    setExtensions(prev => prev.filter(e => e.id !== id));
  };

  return (
    <AppContext.Provider value={{
      inventory,
      workOrders,
      materialRequests,
      resourceRequests,
      purchaseOrders,
      usageLogs,
      stockEntries,
      users,
      sectors,
      extensions,
      theme,
      toggleTheme,
      addWorkOrder,
      createMaterialRequest,
      processRequest,
      addResourceRequest,
      processResourceRequest,
      addPurchaseOrder,
      updatePurchaseStatus,
      completePurchaseReception,
      updateInventory,
      addInventoryItem,
      restockInventoryItem,
      updateWorkOrderStatus,
      reopenWorkOrder,
      addUser,
      removeUser,
      updateUserPassword,
      updateUserExtension,
      addSector,
      updateSector,
      removeSector,
      addExtension,
      updateExtension,
      removeExtension
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