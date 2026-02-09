export interface Extension {
  id: string;
  name: string;
  number: string;
  sector: string;
  userId?: string; 
}

export interface MaintenanceGuide {
  id: string;
  title: string;
  content: string;
  category: string;
  createdAt: number;
  authorName: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  minThreshold: number;
  sectorId?: string;
}

export interface Equipment {
  id: string;
  name: string;
  code: string;
  sectorId: string;
  location: string;
  description?: string;
}

export interface Sector {
  id: string;
  name: string;
  costCenter: string;
}

export enum WorkOrderStatus {
  PREPARATION = 'PREPARAÇÃO',
  IN_PROGRESS = 'EM ANDAMENTO',
  COMPLETED = 'CONCLUÍDA',
  FAILED = 'FALHA'
}

export enum RequestStatus {
  PENDING = 'PENDENTE',
  APPROVED = 'APROVADO',
  REJECTED = 'REJEITADO'
}

export enum SupportTicketStatus {
  PENDING = 'PENDENTE',
  APPROVED = 'APROVADO',
  REJECTED = 'REJEITADO'
}

export interface SupportTicket {
  id: string;
  category: 'MAINTENANCE' | 'IT';
  title: string;
  description: string;
  requesterId: string;
  requesterName: string;
  sector: string;
  status: SupportTicketStatus;
  createdAt: number;
  workOrderId?: string;
}

export interface DatabaseConfig {
  type: 'LOCAL' | 'MYSQL_API';
  host?: string;
  port?: string;
  user?: string;
  password?: string;
  database?: string;
  apiUrl?: string;
  status: 'CONNECTED' | 'DISCONNECTED' | 'LOCAL';
}

export interface MaterialRequestItem {
  itemId: string;
  itemName: string;
  quantityRequested: number;
}

export interface MaterialRequest {
  id: string;
  workOrderId: string;
  workOrderTitle: string;
  items: MaterialRequestItem[];
  status: RequestStatus;
  createdAt: number;
  approvedAt?: number;
}

export interface ResourceRequest {
  id: string;
  itemName: string;
  quantity: number;
  brand: string;
  sector: string;
  costCenter: string;
  requesterName: string;
  status: 'PENDENTE' | 'LIBERADO' | 'REJEITADO';
  createdAt: number;
  approvedBy?: string;
  approvedAt?: number;
}

export type PurchaseStatus = 'ORDERED' | 'ARRIVED' | 'STOCKED';

export interface PurchaseOrderItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  category: string;
  unitCost?: number;
}

export interface PurchaseOrder {
  id: string;
  orderNumber: string;
  invoiceNumber?: string;
  supplier: string;
  purchaseDate: number;
  arrivalDate?: number;
  completionDate?: number;
  status: PurchaseStatus;
  items: PurchaseOrderItem[];
  purchaserName: string;
  notes?: string;
}

export interface WorkOrderHistoryEntry {
  id: string;
  date: number;
  status: WorkOrderStatus;
  notes: string;
  type: 'STATUS_CHANGE' | 'REOPEN';
}

export interface WorkOrder {
  id: string;
  title: string;
  description: string;
  priority: 'Baixa' | 'Média' | 'Alta';
  status: WorkOrderStatus;
  requesterName: string;
  equipmentId?: string;
  createdAt: number;
  requests: string[];
  history: WorkOrderHistoryEntry[];
}

export interface UsageLog {
  id: string;
  requestId: string;
  workOrderId: string;
  itemName: string;
  quantityUsed: number;
  date: number;
}

export interface StockEntryLog {
  id: string;
  itemId: string;
  itemName: string;
  quantityAdded: number;
  purchaseId: string;
  invoiceNumber?: string;
  noInvoiceReason?: string;
  date: number;
  type: 'INITIAL' | 'RESTOCK';
}

export type UserRole = 'MAINTENANCE' | 'WAREHOUSE' | 'PURCHASING' | 'IT_ADMIN' | 'SUPER_ADMIN' | 'USER' | 'GATEHOUSE';

export interface User {
  id: string;
  username: string;
  password?: string;
  name: string;
  role: UserRole;
  hasPortalAccess?: boolean;
  extension?: string; 
  sectorId?: string;
  profileImage?: string;
}