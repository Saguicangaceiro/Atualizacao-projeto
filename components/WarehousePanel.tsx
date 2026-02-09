import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Package, CheckCircle, XCircle, ClipboardList, History, AlertTriangle, PlusCircle, FileText, Box, Tag, Building, User, Truck, ArrowDownCircle, Search, Filter } from 'lucide-react';
import { RequestStatus, User as UserType } from '../types';

interface WarehousePanelProps {
  currentUser?: UserType;
}

export const WarehousePanel: React.FC<WarehousePanelProps> = ({ currentUser }) => {
  const { 
    inventory, 
    materialRequests, 
    resourceRequests, 
    purchaseOrders,
    sectors,
    processRequest, 
    processResourceRequest, 
    usageLogs, 
    stockEntries, 
    addInventoryItem, 
    restockInventoryItem,
    completePurchaseReception
  } = useApp();
  
  const [activeTab, setActiveTab] = useState<'REQUESTS' | 'RECEIVING' | 'GENERAL_RESOURCES' | 'INVENTORY' | 'LOGS'>('REQUESTS');
  
  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showRestockModal, setShowRestockModal] = useState(false);
  const [selectedItemForRestock, setSelectedItemForRestock] = useState<{id: string, name: string} | null>(null);

  // Reception Confirmation Modal
  const [receptionModalPO, setReceptionModalPO] = useState<string | null>(null);

  // Form State - Shared Compliance Fields
  const [purchaseId, setPurchaseId] = useState('');
  const [invoice, setInvoice] = useState('');
  const [noInvoiceReason, setNoInvoiceReason] = useState('');

  // New Item State
  const [newItemName, setNewItemName] = useState('');
  const [newItemQty, setNewItemQty] = useState('');
  const [newItemUnit, setNewItemUnit] = useState('');
  const [newItemCategory, setNewItemCategory] = useState('');
  const [newItemSectorId, setNewItemSectorId] = useState('');

  // Restock State
  const [restockQty, setRestockQty] = useState('');

  // Inventory Filter State
  const [inventorySearch, setInventorySearch] = useState('');
  const [sectorFilter, setSectorFilter] = useState('');

  const pendingRequests = materialRequests.filter(r => r.status === RequestStatus.PENDING);
  const pendingResources = resourceRequests.filter(r => r.status === 'PENDENTE');
  const arrivedPurchases = purchaseOrders.filter(po => po.status === 'ARRIVED');

  const resetForms = () => {
    setNewItemName('');
    setNewItemQty('');
    setNewItemUnit('');
    setNewItemCategory('');
    setNewItemSectorId('');
    setRestockQty('');
    setPurchaseId('');
    setInvoice('');
    setNoInvoiceReason('');
    setSelectedItemForRestock(null);
    setReceptionModalPO(null);
  };

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoice && !noInvoiceReason) return; // Validation check

    addInventoryItem({
      name: newItemName,
      quantity: Number(newItemQty),
      unit: newItemUnit,
      category: newItemCategory,
      sectorId: newItemSectorId || undefined,
      minThreshold: 5
    }, {
      purchaseId,
      invoiceNumber: invoice,
      noInvoiceReason: !invoice ? noInvoiceReason : undefined
    });
    
    setShowAddModal(false);
    resetForms();
  };

  const handleRestockItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItemForRestock || (!invoice && !noInvoiceReason)) return;

    restockInventoryItem(selectedItemForRestock.id, Number(restockQty), {
      purchaseId,
      invoiceNumber: invoice,
      noInvoiceReason: !invoice ? noInvoiceReason : undefined
    });

    setShowRestockModal(false);
    resetForms();
  };

  const handleConfirmReception = () => {
    if (receptionModalPO) {
      completePurchaseReception(receptionModalPO);
      setReceptionModalPO(null);
    }
  };

  const openRestockModal = (item: {id: string, name: string}) => {
    setSelectedItemForRestock(item);
    setShowRestockModal(true);
  };

  // Helper for compliance fields rendering
  const renderComplianceFields = () => (
    <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg border border-gray-200 dark:border-gray-600 space-y-3">
      <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Dados da Compra</h4>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">ID da Compra *</label>
        <input 
          required 
          type="text" 
          placeholder="Ex: CMP-2024-001"
          className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-gray-700 dark:text-white" 
          value={purchaseId} 
          onChange={e => setPurchaseId(e.target.value)} 
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
          <FileText className="w-3 h-3" /> Nota Fiscal (Opcional)
        </label>
        <input 
          type="text" 
          placeholder="Número da NF"
          className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-gray-700 dark:text-white" 
          value={invoice} 
          onChange={e => setInvoice(e.target.value)} 
        />
      </div>

      {!invoice && (
        <div className="animate-in fade-in slide-in-from-top-2 duration-300">
          <label className="block text-sm font-bold text-orange-600 dark:text-orange-400 mb-1">Motivo da falta de NF *</label>
          <textarea 
            required
            rows={2}
            placeholder="Explique por que não há nota fiscal..."
            className="w-full border border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/20 rounded-lg p-2 text-sm focus:ring-2 focus:ring-orange-500 outline-none placeholder-orange-300 text-orange-800 dark:text-orange-200"
            value={noInvoiceReason}
            onChange={e => setNoInvoiceReason(e.target.value)}
          />
          <p className="text-xs text-orange-500 mt-1">Este campo é obrigatório quando não há Nota Fiscal.</p>
        </div>
      )}
    </div>
  );

  const renderRequests = () => (
    <div className="space-y-4">
       <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
        <ClipboardList className="w-6 h-6 text-orange-600 dark:text-orange-400" />
        Solicitações de O.S.
      </h2>
      
      {pendingRequests.length === 0 ? (
         <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
           <p className="text-gray-500 dark:text-gray-400">Nenhuma solicitação de O.S. pendente.</p>
         </div>
      ) : (
        <div className="grid gap-4">
          {pendingRequests.map(req => (
            <div key={req.id} className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-200 dark:border-gray-700 border-l-4 border-l-orange-400 dark:border-l-orange-500">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-bold text-gray-800 dark:text-gray-100">Solicitação #{req.id.slice(0,6)}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Para O.S.: {req.workOrderTitle}</p>
                </div>
                <span className="text-xs bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 px-2 py-1 rounded-full font-medium">
                  Aguardando Aprovação
                </span>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 mb-4">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-600">
                      <th className="pb-2">Item</th>
                      <th className="pb-2 text-right">Qtd Solicitada</th>
                      <th className="pb-2 text-right">Em Estoque</th>
                    </tr>
                  </thead>
                  <tbody>
                    {req.items.map(item => {
                      const stockItem = inventory.find(i => i.id === item.itemId);
                      const hasStock = (stockItem?.quantity || 0) >= item.quantityRequested;
                      return (
                        <tr key={item.itemId} className="border-b border-gray-100 dark:border-gray-700 last:border-0">
                          <td className="py-2 text-gray-800 dark:text-gray-200">{item.itemName}</td>
                          <td className="py-2 text-right font-medium text-gray-700 dark:text-gray-300">{item.quantityRequested}</td>
                          <td className={`py-2 text-right font-bold ${hasStock ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                            {stockItem?.quantity || 0} {stockItem?.unit}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="flex gap-3 justify-end">
                <button 
                  onClick={() => processRequest(req.id, false)}
                  className="px-4 py-2 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-lg text-sm font-medium transition"
                >
                  Rejeitar
                </button>
                <button 
                   onClick={() => processRequest(req.id, true)}
                   className="px-4 py-2 text-white bg-green-600 hover:bg-green-700 rounded-lg text-sm font-medium transition flex items-center gap-2 shadow-sm"
                >
                  <CheckCircle className="w-4 h-4" /> Aprovar Saída
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderReceiving = () => (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
        <ArrowDownCircle className="w-6 h-6 text-blue-600 dark:text-blue-400" />
        Recebimento de Mercadorias
      </h2>

      {arrivedPurchases.length === 0 ? (
         <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
           <Truck className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
           <p className="text-gray-500 dark:text-gray-400">Nenhuma mercadoria aguardando conferência.</p>
         </div>
      ) : (
        <div className="grid gap-4">
          {arrivedPurchases.map(po => (
             <div key={po.id} className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-200 dark:border-gray-700 border-l-4 border-l-blue-400 dark:border-l-blue-500">
                <div className="flex justify-between items-start mb-3">
                   <div>
                      <h3 className="font-bold text-gray-800 dark:text-gray-100 text-lg">Pedido #{po.orderNumber}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Fornecedor: {po.supplier}</p>
                      {po.invoiceNumber && <span className="text-xs bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 px-2 py-0.5 rounded text-gray-600 dark:text-gray-300 mt-1 inline-block">NF: {po.invoiceNumber}</span>}
                   </div>
                   <div className="text-right">
                      <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 px-3 py-1 rounded-full font-bold flex items-center gap-1 ml-auto w-fit">
                         <Truck className="w-3 h-3" /> Aguardando Conferência
                      </span>
                      <p className="text-xs text-gray-400 mt-2">Comprador: {po.purchaserName}</p>
                   </div>
                </div>

                <div className="bg-blue-50/50 dark:bg-blue-900/10 rounded-lg p-4 border border-blue-100 dark:border-blue-900/30 mb-4">
                   <p className="text-xs font-bold text-blue-800 dark:text-blue-300 uppercase mb-2">Itens para Entrada</p>
                   <ul className="space-y-2">
                      {po.items.map(item => {
                         const match = inventory.find(i => i.name.toLowerCase().trim() === item.name.toLowerCase().trim());
                         return (
                            <li key={item.id} className="flex justify-between items-center text-sm border-b border-blue-100 dark:border-blue-900/30 last:border-0 pb-1.5 last:pb-0">
                               <div>
                                  <span className="font-medium text-gray-800 dark:text-gray-200">{item.name}</span>
                                  {match ? (
                                    <span className="ml-2 text-[10px] bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-1 rounded">Item Existente</span>
                                  ) : (
                                    <span className="ml-2 text-[10px] bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-1 rounded">Novo Cadastro</span>
                                  )}
                               </div>
                               <span className="font-mono font-bold text-gray-600 dark:text-gray-300">{item.quantity} {item.unit}</span>
                            </li>
                         );
                      })}
                   </ul>
                </div>

                <div className="flex justify-end">
                   <button 
                     onClick={() => setReceptionModalPO(po.id)}
                     className="bg-blue-600 text-white px-5 py-2.5 rounded-lg font-bold hover:bg-blue-700 transition flex items-center gap-2 shadow-sm"
                   >
                     <CheckCircle className="w-4 h-4" /> Conferir e Dar Entrada
                   </button>
                </div>
             </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderGeneralResources = () => (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
        <Box className="w-6 h-6 text-purple-600 dark:text-purple-400" />
        Liberação de Recursos Gerais
      </h2>

      {pendingResources.length === 0 ? (
         <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
           <p className="text-gray-500 dark:text-gray-400">Nenhuma solicitação de recursos gerais pendente.</p>
         </div>
      ) : (
        <div className="grid gap-4">
           {pendingResources.map(req => (
              <div key={req.id} className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-200 dark:border-gray-700 border-l-4 border-l-purple-400 dark:border-l-purple-500">
                 <div className="flex justify-between items-start mb-4">
                    <div className="flex gap-3">
                       <div className="bg-purple-100 dark:bg-purple-900/30 p-2 rounded-lg h-fit">
                          <Box className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                       </div>
                       <div>
                          <h3 className="font-bold text-gray-800 dark:text-gray-100 text-lg">{req.itemName}</h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2 mt-1">
                             <Tag className="w-3 h-3" /> Marca: <span className="text-gray-700 dark:text-gray-300">{req.brand}</span>
                          </p>
                       </div>
                    </div>
                    <div className="text-right">
                       <span className="block text-2xl font-bold text-gray-800 dark:text-gray-100">{req.quantity}</span>
                       <span className="text-xs text-gray-400 uppercase">Unidades</span>
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-4 bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg mb-4 text-sm">
                    <div>
                       <span className="text-xs text-gray-400 block uppercase tracking-wider mb-1">Solicitante</span>
                       <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300 font-medium">
                          <User className="w-4 h-4 text-gray-400" />
                          {req.requesterName}
                       </div>
                    </div>
                    <div>
                       <span className="text-xs text-gray-400 block uppercase tracking-wider mb-1">Setor Solicitante</span>
                       <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300 font-medium">
                          <Building className="w-4 h-4 text-gray-400" />
                          {req.sector}
                       </div>
                    </div>
                    <div className="col-span-2 border-t border-gray-200 dark:border-gray-600 pt-2 mt-1">
                       <span className="text-xs text-gray-400 block uppercase tracking-wider mb-1">Centro de Custo</span>
                       <span className="font-mono text-gray-800 dark:text-gray-200 font-bold bg-white dark:bg-gray-600 border border-gray-200 dark:border-gray-500 px-2 py-1 rounded inline-block shadow-sm">
                          {req.costCenter}
                       </span>
                    </div>
                 </div>

                 <div className="flex gap-3 justify-end">
                    <button 
                       onClick={() => processResourceRequest(req.id, false, currentUser?.name || 'Almoxarifado')}
                       className="px-4 py-2 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-lg text-sm font-medium transition"
                    >
                       Rejeitar
                    </button>
                    <button 
                       onClick={() => processResourceRequest(req.id, true, currentUser?.name || 'Almoxarifado')}
                       className="px-4 py-2 text-white bg-green-600 hover:bg-green-700 rounded-lg text-sm font-medium transition flex items-center gap-2 shadow-sm"
                    >
                       <CheckCircle className="w-4 h-4" /> Liberar Recurso
                    </button>
                 </div>
              </div>
           ))}
        </div>
      )}

      {/* Historical List of Approved Resources */}
      <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
         <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <History className="w-4 h-4" /> Últimas Liberações
         </h3>
         <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <table className="w-full text-left text-sm">
               <thead className="bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400 font-medium border-b border-gray-200 dark:border-gray-600">
                  <tr>
                     <th className="p-3">Data</th>
                     <th className="p-3">Item</th>
                     <th className="p-3">Setor</th>
                     <th className="p-3">C. Custo</th>
                     <th className="p-3">Solicitante</th>
                     <th className="p-3">Liberado Por</th>
                     <th className="p-3 text-right">Status</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {resourceRequests.filter(r => r.status !== 'PENDENTE').sort((a,b) => (b.approvedAt || 0) - (a.approvedAt || 0)).map(req => (
                     <tr key={req.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        <td className="p-3 text-gray-500 dark:text-gray-400">{new Date(req.approvedAt || 0).toLocaleDateString()}</td>
                        <td className="p-3 font-medium text-gray-800 dark:text-gray-200">{req.itemName} <span className="text-gray-400 font-normal">({req.quantity})</span></td>
                        <td className="p-3 text-gray-600 dark:text-gray-400">{req.sector}</td>
                        <td className="p-3 font-mono text-gray-600 dark:text-gray-400 text-xs">{req.costCenter}</td>
                        <td className="p-3 text-gray-600 dark:text-gray-400">{req.requesterName}</td>
                        <td className="p-3 text-purple-600 dark:text-purple-400 font-medium">{req.approvedBy}</td>
                        <td className="p-3 text-right">
                           <span className={`text-xs px-2 py-1 rounded-full font-bold ${req.status === 'LIBERADO' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'}`}>
                              {req.status}
                           </span>
                        </td>
                     </tr>
                  ))}
                  {resourceRequests.filter(r => r.status !== 'PENDENTE').length === 0 && (
                     <tr>
                        <td colSpan={7} className="p-4 text-center text-gray-400 dark:text-gray-500 text-xs">Nenhum histórico disponível.</td>
                     </tr>
                  )}
               </tbody>
            </table>
         </div>
      </div>
    </div>
  );

  const renderInventory = () => {
    const filteredInventory = inventory.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(inventorySearch.toLowerCase());
      const matchesSector = sectorFilter === '' || item.sectorId === sectorFilter;
      return matchesSearch && matchesSector;
    });

    return (
      <div>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
            <Package className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            Gerenciamento de Estoque
          </h2>
          <button 
            onClick={() => setShowAddModal(true)}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition shadow-sm w-full md:w-auto"
          >
            + Novo Item
          </button>
        </div>

        {/* Inventory Filters */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 mb-6 flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Buscar item pelo nome..." 
              className="w-full pl-9 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm outline-none bg-white dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-indigo-500"
              value={inventorySearch}
              onChange={e => setInventorySearch(e.target.value)}
            />
          </div>
          <div className="relative w-full md:w-64">
            <Filter className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
            <select 
              className="w-full pl-9 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm outline-none bg-white dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-indigo-500 appearance-none"
              value={sectorFilter}
              onChange={e => setSectorFilter(e.target.value)}
            >
              <option value="">Todos os Setores</option>
              {sectors.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          {(inventorySearch || sectorFilter) && (
            <button 
              onClick={() => { setInventorySearch(''); setSectorFilter(''); }}
              className="text-xs text-red-500 hover:text-red-700 font-bold whitespace-nowrap"
            >
              Limpar Filtros
            </button>
          )}
        </div>

        <div className="bg-white dark:bg-gray-800 shadow-sm rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-sm uppercase tracking-wider border-b border-gray-200 dark:border-gray-600">
                <th className="p-4 font-semibold">Item</th>
                <th className="p-4 font-semibold">Categoria</th>
                <th className="p-4 font-semibold">Setor</th>
                <th className="p-4 font-semibold text-right">Qtd Atual</th>
                <th className="p-4 font-semibold text-center">Status</th>
                <th className="p-4 font-semibold text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {filteredInventory.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-400 dark:text-gray-500 italic">Nenhum item encontrado com os filtros aplicados.</td>
                </tr>
              ) : (
                filteredInventory.map(item => {
                  const itemSector = sectors.find(s => s.id === item.sectorId);
                  return (
                    <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                      <td className="p-4 font-medium text-gray-900 dark:text-gray-100">{item.name}</td>
                      <td className="p-4 text-gray-500 dark:text-gray-400">{item.category}</td>
                      <td className="p-4">
                        {itemSector ? (
                          <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 px-2 py-0.5 rounded-full border border-indigo-100 dark:border-indigo-800">
                            {itemSector.name}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">Geral</span>
                        )}
                      </td>
                      <td className="p-4 text-right font-mono text-gray-700 dark:text-gray-300">{item.quantity} <span className="text-xs text-gray-400">{item.unit}</span></td>
                      <td className="p-4 text-center">
                         {item.quantity <= item.minThreshold ? (
                           <span className="inline-flex items-center gap-1 text-xs font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 px-2 py-1 rounded-full">
                             <AlertTriangle className="w-3 h-3" /> Baixo
                           </span>
                         ) : (
                          <span className="text-xs font-bold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30 px-2 py-1 rounded-full">OK</span>
                         )}
                      </td>
                      <td className="p-4 text-right">
                        <button 
                          onClick={() => openRestockModal(item)}
                          className="text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 p-2 rounded-full transition"
                          title="Adicionar Estoque"
                        >
                          <PlusCircle className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderLogs = () => (
    <div>
      <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-6 flex items-center gap-2">
        <History className="w-6 h-6 text-gray-600 dark:text-gray-400" />
        Histórico de Movimentação
      </h2>
      
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Outgoing Logs */}
        <div className="bg-white dark:bg-gray-800 shadow-sm rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="bg-red-50 dark:bg-red-900/30 p-3 border-b border-red-100 dark:border-red-900/50 text-red-800 dark:text-red-200 font-bold text-sm">Saídas de Material (O.S.)</div>
          {usageLogs.length === 0 ? (
             <div className="p-8 text-center text-gray-400 dark:text-gray-500 text-sm">Nenhuma saída registrada.</div>
          ) : (
            <div className="max-h-96 overflow-y-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 dark:bg-gray-700 text-xs uppercase text-gray-500 dark:text-gray-400 font-semibold border-b border-gray-200 dark:border-gray-600">
                  <tr>
                    <th className="p-3">Data</th>
                    <th className="p-3">Item</th>
                    <th className="p-3 text-right">Qtd</th>
                    <th className="p-3">O.S.</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700 text-sm">
                  {usageLogs.sort((a,b) => b.date - a.date).map(log => (
                    <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="p-3 text-gray-600 dark:text-gray-400 text-xs">
                        {new Date(log.date).toLocaleDateString()}
                      </td>
                      <td className="p-3 font-medium text-gray-800 dark:text-gray-200">{log.itemName}</td>
                      <td className="p-3 text-right font-mono text-red-600 dark:text-red-400">-{log.quantityUsed}</td>
                      <td className="p-3 text-blue-600 dark:text-blue-400 text-xs">#{log.workOrderId.slice(0,6)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Incoming Logs */}
        <div className="bg-white dark:bg-gray-800 shadow-sm rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="bg-green-50 dark:bg-green-900/30 p-3 border-b border-green-100 dark:border-green-900/50 text-green-800 dark:text-green-200 font-bold text-sm">Entradas de Material</div>
          {stockEntries.length === 0 ? (
             <div className="p-8 text-center text-gray-400 dark:text-gray-500 text-sm">Nenhuma entrada registrada.</div>
          ) : (
            <div className="max-h-96 overflow-y-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 dark:bg-gray-700 text-xs uppercase text-gray-500 dark:text-gray-400 font-semibold border-b border-gray-200 dark:border-gray-600">
                  <tr>
                    <th className="p-3">Data</th>
                    <th className="p-3">Item</th>
                    <th className="p-3 text-right">Qtd</th>
                    <th className="p-3">Compra</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700 text-sm">
                  {stockEntries.sort((a,b) => b.date - a.date).map(entry => (
                    <tr key={entry.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="p-3 text-gray-600 dark:text-gray-400 text-xs">
                        {new Date(entry.date).toLocaleDateString()}
                      </td>
                      <td className="p-3 font-medium text-gray-800 dark:text-gray-200">
                        {entry.itemName}
                        {entry.type === 'INITIAL' && <span className="ml-2 text-[10px] bg-gray-200 dark:bg-gray-600 dark:text-gray-300 px-1 rounded">Novo</span>}
                      </td>
                      <td className="p-3 text-right font-mono text-green-600 dark:text-green-400">+{entry.quantityAdded}</td>
                      <td className="p-3 text-xs text-gray-500 dark:text-gray-400">
                        <div title={entry.purchaseId}>ID: {entry.purchaseId}</div>
                        {entry.invoiceNumber ? (
                          <div className="text-green-700 dark:text-green-400" title="Nota Fiscal">NF: {entry.invoiceNumber}</div>
                        ) : (
                           <div className="text-orange-500 dark:text-orange-400 truncate max-w-[100px]" title={entry.noInvoiceReason}>⚠️ S/ NF</div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-6">
      {/* Navigation Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6 overflow-x-auto scrollbar-hide">
        <button
          onClick={() => setActiveTab('REQUESTS')}
          className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'REQUESTS' 
              ? 'border-orange-500 text-orange-600 dark:text-orange-400' 
              : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
          }`}
        >
          <ClipboardList className="w-4 h-4" /> Solicitações O.S.
          {pendingRequests.length > 0 && (
            <span className="bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 text-xs px-2 py-0.5 rounded-full">{pendingRequests.length}</span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('RECEIVING')}
          className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'RECEIVING' 
              ? 'border-blue-500 text-blue-600 dark:text-blue-400' 
              : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
          }`}
        >
          <ArrowDownCircle className="w-4 h-4" /> Recebimento
          {arrivedPurchases.length > 0 && (
            <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs px-2 py-0.5 rounded-full">{arrivedPurchases.length}</span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('GENERAL_RESOURCES')}
          className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'GENERAL_RESOURCES' 
              ? 'border-purple-500 text-purple-600 dark:text-purple-400' 
              : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
          }`}
        >
          <Box className="w-4 h-4" /> Recursos Gerais
          {pendingResources.length > 0 && (
            <span className="bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs px-2 py-0.5 rounded-full">{pendingResources.length}</span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('INVENTORY')}
          className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'INVENTORY' 
              ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400' 
              : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
          }`}
        >
          <Package className="w-4 h-4" /> Estoque
        </button>
        <button
          onClick={() => setActiveTab('LOGS')}
          className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'LOGS' 
              ? 'border-gray-500 text-gray-600 dark:text-gray-400' 
              : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
          }`}
        >
          <History className="w-4 h-4" /> Histórico
        </button>
      </div>

      {/* Main Content */}
      {activeTab === 'REQUESTS' && renderRequests()}
      {activeTab === 'RECEIVING' && renderReceiving()}
      {activeTab === 'GENERAL_RESOURCES' && renderGeneralResources()}
      {activeTab === 'INVENTORY' && renderInventory()}
      {activeTab === 'LOGS' && renderLogs()}

      {/* Modals */}
      {/* Add Item Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-100 flex items-center gap-2">
              <PlusCircle className="w-6 h-6 text-indigo-600 dark:text-indigo-400" /> Novo Item
            </h3>
            <form onSubmit={handleAddItem} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nome do Item</label>
                <input required type="text" className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 outline-none bg-white dark:bg-gray-700 dark:text-white" value={newItemName} onChange={e => setNewItemName(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Qtd Inicial</label>
                  <input required type="number" min="0" className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 outline-none bg-white dark:bg-gray-700 dark:text-white" value={newItemQty} onChange={e => setNewItemQty(e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Unidade</label>
                  <input required type="text" placeholder="un, kg, L" className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 outline-none bg-white dark:bg-gray-700 dark:text-white" value={newItemUnit} onChange={e => setNewItemUnit(e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Categoria</label>
                  <select className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 outline-none bg-white dark:bg-gray-700 dark:text-white" value={newItemCategory} onChange={e => setNewItemCategory(e.target.value)}>
                    <option value="">Selecione...</option>
                    <option value="Elétrica">Elétrica</option>
                    <option value="Hidráulica">Hidráulica</option>
                    <option value="Mecânica">Mecânica</option>
                    <option value="Civil">Civil</option>
                    <option value="EPI">EPI</option>
                    <option value="Ferramentas">Ferramentas</option>
                    <option value="Outros">Outros</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Setor</label>
                  <select className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 outline-none bg-white dark:bg-gray-700 dark:text-white" value={newItemSectorId} onChange={e => setNewItemSectorId(e.target.value)}>
                    <option value="">Geral</option>
                    {sectors.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {renderComplianceFields()}

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 border border-gray-300 dark:border-gray-600 py-2.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition">Cancelar</button>
                <button type="submit" className="flex-1 bg-indigo-600 text-white py-2.5 rounded-lg font-medium hover:bg-indigo-700 shadow-sm transition">Cadastrar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Restock Modal */}
      {showRestockModal && selectedItemForRestock && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-100 flex items-center gap-2">
              <PlusCircle className="w-6 h-6 text-green-600 dark:text-green-400" /> Entrada de Estoque
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Adicionando itens para: <span className="font-bold text-gray-800 dark:text-gray-200">{selectedItemForRestock.name}</span></p>
            
            <form onSubmit={handleRestockItem} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Quantidade a Adicionar</label>
                <input required type="number" min="1" className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2 focus:ring-2 focus:ring-green-500 outline-none text-lg font-bold text-green-700 dark:text-green-400 bg-white dark:bg-gray-700" value={restockQty} onChange={e => setRestockQty(e.target.value)} />
              </div>

              {renderComplianceFields()}

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowRestockModal(false)} className="flex-1 border border-gray-300 dark:border-gray-600 py-2.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition">Cancelar</button>
                <button type="submit" className="flex-1 bg-green-600 text-white py-2.5 rounded-lg font-medium hover:bg-green-700 shadow-sm transition">Confirmar Entrada</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Purchase Reception Confirmation Modal */}
      {receptionModalPO && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full p-6 text-center">
             <div className="bg-blue-100 dark:bg-blue-900/30 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-blue-600 dark:text-blue-400" />
             </div>
             <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">Confirmar Recebimento?</h3>
             <p className="text-gray-500 dark:text-gray-400 mb-6 text-sm">
                Isso irá dar entrada automática no estoque para todos os itens deste pedido. Certifique-se de ter conferido as quantidades físicas.
             </p>
             <div className="flex gap-3">
                <button 
                  onClick={() => setReceptionModalPO(null)}
                  className="flex-1 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                >
                   Cancelar
                </button>
                <button 
                  onClick={handleConfirmReception}
                  className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold transition shadow-sm"
                >
                   Confirmar Entrada
                </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};