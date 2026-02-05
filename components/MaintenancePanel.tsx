import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Plus, Wrench, Search, ShoppingCart, Sparkles, Loader2, Info, CheckCircle, Clock, XCircle, FileText, Play, RotateCcw, AlertTriangle, CheckCheck, Box, User as UserIcon, Tag, Hash, Building, ArrowLeft } from 'lucide-react';
import { suggestMaterials } from '../services/geminiService';
import { MaterialRequestItem, RequestStatus, WorkOrderStatus, User } from '../types';

interface MaintenancePanelProps {
  currentUser?: User;
}

export const MaintenancePanel: React.FC<MaintenancePanelProps> = ({ currentUser }) => {
  const { workOrders, inventory, materialRequests, addWorkOrder, createMaterialRequest, updateWorkOrderStatus, reopenWorkOrder, addResourceRequest, sectors } = useApp();
  const [view, setView] = useState<'LIST' | 'CREATE_WO' | 'REQUEST_MATERIAL' | 'RESOURCE_REQUEST'>('LIST');
  
  // Updated tabs to include specific Failed tab
  const [activeTab, setActiveTab] = useState<'OPEN' | 'FAILED' | 'COMPLETED'>('OPEN');
  
  // Forms State
  const [newWODescription, setNewWODescription] = useState('');
  const [newWOTitle, setNewWOTitle] = useState('');
  const [newWOPriority, setNewWOPriority] = useState<'Baixa'|'Média'|'Alta'>('Média');
  const [newWONeedsMaterials, setNewWONeedsMaterials] = useState(true);
  
  // Request Material State
  const [selectedWO, setSelectedWO] = useState<string | null>(null);
  const [cart, setCart] = useState<MaterialRequestItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  // AI State
  const [aiSuggestions, setAiSuggestions] = useState<{material: string, reason: string}[]>([]);
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Resource Request State
  const [resItemName, setResItemName] = useState('');
  const [resQuantity, setResQuantity] = useState('');
  const [resBrand, setResBrand] = useState('');

  // Encontra o setor do usuário logado para pré-preencher
  const userSector = sectors.find(s => s.id === currentUser?.sectorId);
  const [resSector, setResSector] = useState(userSector?.name || '');
  const [resCostCenter, setResCostCenter] = useState(userSector?.costCenter || '');

  // Status Modals State
  const [statusModal, setStatusModal] = useState<{
    isOpen: boolean;
    type: 'COMPLETE' | 'FAIL' | 'REOPEN' | null;
    woId: string | null;
  }>({ isOpen: false, type: null, woId: null });
  const [statusNote, setStatusNote] = useState('');
  const [reopenNeedsMaterial, setReopenNeedsMaterial] = useState(false);

  // Sync sector/cost center defaults
  useEffect(() => {
    if (userSector) {
      setResSector(userSector.name);
      setResCostCenter(userSector.costCenter);
    } else if (sectors.length > 0 && !resSector) {
      setResSector(sectors[0].name);
      setResCostCenter(sectors[0].costCenter);
    }
  }, [sectors, userSector]);

  const handleSectorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedName = e.target.value;
    setResSector(selectedName);
    const foundSector = sectors.find(s => s.name === selectedName);
    if (foundSector) {
      setResCostCenter(foundSector.costCenter);
    }
  };

  const handleCreateWO = (e: React.FormEvent) => {
    e.preventDefault();
    addWorkOrder({
      title: newWOTitle,
      description: newWODescription,
      priority: newWOPriority,
      requesterName: currentUser?.name || 'Técnico' 
    }, newWONeedsMaterials);
    
    setView('LIST');
    setNewWOTitle('');
    setNewWODescription('');
    setNewWONeedsMaterials(true);
  };

  const handleCreateResourceRequest = (e: React.FormEvent) => {
    e.preventDefault();
    addResourceRequest({
      itemName: resItemName,
      quantity: Number(resQuantity),
      brand: resBrand,
      sector: resSector,
      costCenter: resCostCenter,
      requesterName: currentUser?.name || 'Manutenção'
    });
    
    // Reset and go back
    setResItemName('');
    setResQuantity('');
    setResBrand('');
    setView('LIST');
    alert('Solicitação de recurso enviada com sucesso!');
  };

  const handleGetSuggestions = async () => {
    if (!newWODescription) return;
    setIsAiLoading(true);
    const inventoryNames = inventory.map(i => i.name);
    const suggestions = await suggestMaterials(newWODescription, inventoryNames);
    setAiSuggestions(suggestions);
    setIsAiLoading(false);
  };

  const handleRequestSubmit = () => {
    if (selectedWO && cart.length > 0) {
      createMaterialRequest(selectedWO, cart);
      setCart([]);
      setSelectedWO(null);
      setView('LIST');
    }
  };

  const addToCart = (itemId: string, name: string, qty: number) => {
    if (qty <= 0) return;
    setCart(prev => {
      const exists = prev.find(i => i.itemId === itemId);
      if (exists) {
        return prev.map(i => i.itemId === itemId ? { ...i, quantityRequested: i.quantityRequested + qty } : i);
      }
      return [...prev, { itemId, itemName: name, quantityRequested: qty }];
    });
  };

  const removeFromCart = (itemId: string) => {
    setCart(prev => prev.filter(i => i.itemId !== itemId));
  };

  const openStatusModal = (type: 'COMPLETE' | 'FAIL' | 'REOPEN', woId: string) => {
    setStatusModal({ isOpen: true, type, woId });
    setStatusNote('');
    setReopenNeedsMaterial(false);
  };

  const handleStatusSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!statusModal.woId || !statusNote) return;

    if (statusModal.type === 'COMPLETE') {
      updateWorkOrderStatus(statusModal.woId, WorkOrderStatus.COMPLETED, statusNote);
    } else if (statusModal.type === 'FAIL') {
      updateWorkOrderStatus(statusModal.woId, WorkOrderStatus.FAILED, statusNote);
    } else if (statusModal.type === 'REOPEN') {
      reopenWorkOrder(statusModal.woId, statusNote, reopenNeedsMaterial);
      if (reopenNeedsMaterial) {
        setSelectedWO(statusModal.woId);
        setView('REQUEST_MATERIAL');
        setActiveTab('OPEN');
      } else {
        setActiveTab('OPEN');
      }
    }

    setStatusModal({ isOpen: false, type: null, woId: null });
    setStatusNote('');
    setReopenNeedsMaterial(false);
  };

  const getStatusColor = (status: WorkOrderStatus) => {
    switch (status) {
      case WorkOrderStatus.PREPARATION: return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-900/50';
      case WorkOrderStatus.IN_PROGRESS: return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-900/50';
      case WorkOrderStatus.COMPLETED: return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-900/50';
      case WorkOrderStatus.FAILED: return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-900/50';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  const renderList = () => {
    const filteredWOs = workOrders.filter(wo => {
      if (activeTab === 'OPEN') {
        return wo.status === WorkOrderStatus.PREPARATION || wo.status === WorkOrderStatus.IN_PROGRESS;
      } else if (activeTab === 'FAILED') {
        return wo.status === WorkOrderStatus.FAILED;
      } else {
        return wo.status === WorkOrderStatus.COMPLETED;
      }
    });

    const failedCount = workOrders.filter(w => w.status === WorkOrderStatus.FAILED).length;

    return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
          <Wrench className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          Gerenciamento de O.S.
        </h2>
        <div className="flex gap-2 w-full md:w-auto">
          <button 
            onClick={() => setView('RESOURCE_REQUEST')}
            className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm transition"
          >
            <Box className="w-4 h-4" /> Solicitar Recurso
          </button>
          <button 
            onClick={() => setView('CREATE_WO')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm transition"
          >
            <Plus className="w-4 h-4" /> Nova O.S.
          </button>
        </div>
      </div>

      <div className="flex border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
        <button
          onClick={() => setActiveTab('OPEN')}
          className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'OPEN' 
              ? 'border-blue-500 text-blue-600 dark:text-blue-400' 
              : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
          }`}
        >
          <Play className="w-4 h-4" /> Em Execução
        </button>
        <button
          onClick={() => setActiveTab('FAILED')}
          className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'FAILED' 
              ? 'border-red-500 text-red-600 dark:text-red-400' 
              : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
          }`}
        >
          <AlertTriangle className="w-4 h-4" /> Falhas / Não Finalizadas
          {failedCount > 0 && (
            <span className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-xs px-2 py-0.5 rounded-full">{failedCount}</span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('COMPLETED')}
          className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'COMPLETED' 
              ? 'border-green-500 text-green-600 dark:text-green-400' 
              : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
          }`}
        >
          <CheckCheck className="w-4 h-4" /> Concluídas
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredWOs.length === 0 && (
          <div className="col-span-full text-center py-16 text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 rounded-lg border border-dashed border-gray-300 dark:border-gray-700">
            {activeTab === 'OPEN' && 'Nenhuma ordem de serviço ativa no momento.'}
            {activeTab === 'FAILED' && 'Nenhuma tarefa com falha ou pendente.'}
            {activeTab === 'COMPLETED' && 'Nenhum histórico de conclusão.'}
          </div>
        )}
        {filteredWOs.map(wo => {
          const woRequests = materialRequests.filter(r => r.workOrderId === wo.id);
          return (
            <div key={wo.id} className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-500 transition group flex flex-col h-full relative overflow-hidden">
              <div className={`absolute top-0 left-0 w-1 h-full ${
                wo.status === WorkOrderStatus.FAILED ? 'bg-red-500' :
                wo.status === WorkOrderStatus.COMPLETED ? 'bg-green-500' :
                wo.status === WorkOrderStatus.IN_PROGRESS ? 'bg-blue-500' :
                'bg-yellow-400'
              }`} />
              
              <div className="flex justify-between items-start mb-2 pl-2">
                <span className={`px-2 py-1 rounded-full text-[10px] uppercase font-bold border ${getStatusColor(wo.status)}`}>
                  {wo.status}
                </span>
                <span className="text-xs text-gray-400">{new Date(wo.createdAt).toLocaleDateString()}</span>
              </div>
              
              <div className="pl-2">
                <h3 className="font-bold text-lg text-gray-800 dark:text-gray-100 mb-1 leading-tight">{wo.title}</h3>
                <div className="flex items-center gap-2 mb-3">
                   <span className={`px-2 py-0.5 rounded text-[10px] font-medium 
                    ${wo.priority === 'Alta' ? 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300' : 
                      wo.priority === 'Média' ? 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-300' : 
                      'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300'}`}>
                    Prioridade {wo.priority}
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 line-clamp-3">{wo.description}</p>
              </div>
              
              {wo.history.length > 0 && (
                 <div className="mb-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 mx-2 text-xs border border-gray-100 dark:border-gray-600">
                    <p className="font-bold text-gray-500 dark:text-gray-400 uppercase mb-2 flex items-center gap-1">
                      <FileText className="w-3 h-3" /> Relatórios / Histórico
                    </p>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {wo.history.map((h) => (
                        <div key={h.id} className="border-l-2 border-gray-300 dark:border-gray-500 pl-2">
                          <div className="flex justify-between text-gray-400 dark:text-gray-500 text-[10px]">
                             <span>{new Date(h.date).toLocaleDateString()}</span>
                             <span className={h.status === WorkOrderStatus.FAILED ? 'text-red-500 dark:text-red-400' : h.status === WorkOrderStatus.COMPLETED ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}>{h.status}</span>
                          </div>
                          <p className="text-gray-700 dark:text-gray-300 italic mt-0.5">"{h.notes}"</p>
                        </div>
                      ))}
                    </div>
                 </div>
              )}

              {woRequests.length > 0 && (
                <div className="mb-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 border border-gray-100 dark:border-gray-600 mx-2 mt-auto">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Materiais</p>
                  <div className="space-y-1">
                    {woRequests.flatMap(req => 
                      req.items.map((item, idx) => (
                        <div key={`${req.id}-${idx}`} className="flex justify-between items-center text-sm">
                          <span className="text-gray-700 dark:text-gray-300 text-xs font-medium truncate max-w-[120px]" title={item.itemName}>
                            {item.itemName} 
                          </span>
                          {req.status === RequestStatus.APPROVED && <CheckCircle className="w-3 h-3 text-green-600 dark:text-green-400" />}
                          {req.status === RequestStatus.PENDING && <Clock className="w-3 h-3 text-orange-500 dark:text-orange-400" />}
                          {req.status === RequestStatus.REJECTED && <XCircle className="w-3 h-3 text-red-500 dark:text-red-400" />}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              <div className="pt-3 border-t border-gray-100 dark:border-gray-700 mt-2 px-2">
                {wo.status === WorkOrderStatus.PREPARATION && (
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-orange-600 dark:text-orange-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Aguardando Materiais
                    </span>
                    <button onClick={() => { setSelectedWO(wo.id); setView('REQUEST_MATERIAL'); }} className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-bold flex items-center gap-1 bg-blue-50 dark:bg-blue-900/30 px-3 py-1.5 rounded-lg">
                      <Plus className="w-3 h-3" /> Materiais
                    </button>
                  </div>
                )}
                {wo.status === WorkOrderStatus.IN_PROGRESS && (
                   <div className="flex gap-2">
                     <button onClick={() => openStatusModal('FAIL', wo.id)} className="flex-1 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/40 py-1.5 rounded-lg text-xs font-bold border border-red-200 dark:border-red-900/50 transition">Falha</button>
                     <button onClick={() => openStatusModal('COMPLETE', wo.id)} className="flex-1 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-900/40 py-1.5 rounded-lg text-xs font-bold border border-green-200 dark:border-green-900/50 transition">Concluir</button>
                   </div>
                )}
                {wo.status === WorkOrderStatus.FAILED && (
                   <div className="flex justify-between items-center bg-red-50 dark:bg-red-900/20 p-2 rounded-lg border border-red-100 dark:border-red-900/50">
                     <span className="text-xs font-bold text-red-600 dark:text-red-400 flex items-center gap-1"><XCircle className="w-3 h-3"/> Falhou</span>
                     <button onClick={() => openStatusModal('REOPEN', wo.id)} className="text-white bg-orange-500 hover:bg-orange-600 px-3 py-1 rounded text-xs font-bold flex items-center gap-1 shadow-sm transition"><RotateCcw className="w-3 h-3" /> Reabrir O.S.</button>
                   </div>
                )}
                {wo.status === WorkOrderStatus.COMPLETED && (
                   <div className="flex items-center justify-center gap-2 text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-900/20 py-1.5 rounded-lg border border-green-100 dark:border-green-900/50">
                      <CheckCircle className="w-4 h-4" />
                      <span className="text-xs font-bold">Serviço Concluído</span>
                   </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
    );
  };

  const renderCreate = () => (
    <div className="max-w-2xl mx-auto bg-white dark:bg-gray-800 p-8 rounded-xl shadow-md border border-gray-100 dark:border-gray-700">
      <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-gray-100">Nova Ordem de Serviço</h2>
      <form onSubmit={handleCreateWO} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Título</label>
          <input required type="text" className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2.5 outline-none bg-white dark:bg-gray-700 dark:text-white" value={newWOTitle} onChange={e => setNewWOTitle(e.target.value)} placeholder="Ex: Vazamento na tubulação principal" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Prioridade</label>
          <select className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2.5 outline-none bg-white dark:bg-gray-700 dark:text-white" value={newWOPriority} onChange={(e: any) => setNewWOPriority(e.target.value)}>
            <option value="Baixa">Baixa</option>
            <option value="Média">Média</option>
            <option value="Alta">Alta</option>
          </select>
        </div>
        <div className="flex items-center gap-3 p-3 border border-gray-200 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition" onClick={() => setNewWONeedsMaterials(!newWONeedsMaterials)}>
          <div className={`w-5 h-5 rounded border flex items-center justify-center transition ${newWONeedsMaterials ? 'bg-blue-600 border-blue-600' : 'border-gray-300 dark:border-gray-500 bg-white dark:bg-gray-600'}`}>
            {newWONeedsMaterials && <CheckCheck className="w-3 h-3 text-white" />}
          </div>
          <div className="flex-1">
            <span className="block text-sm font-bold text-gray-800 dark:text-gray-200">Necessário materiais do almoxarifado?</span>
            <span className="block text-xs text-gray-500 dark:text-gray-400">
              {newWONeedsMaterials ? 'Sim. A O.S. será criada em "PREPARAÇÃO" aguardando materiais.' : 'Não. A O.S. será criada em "EM ANDAMENTO" para execução imediata.'}
            </span>
          </div>
        </div>
        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Descrição do Problema</label>
            <button type="button" onClick={handleGetSuggestions} disabled={!newWODescription || isAiLoading} className="text-xs bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/50 px-2 py-1 rounded-md flex items-center gap-1 transition disabled:opacity-50">
              {isAiLoading ? <Loader2 className="w-3 h-3 animate-spin"/> : <Sparkles className="w-3 h-3" />}
              Sugestão IA
            </button>
          </div>
          <textarea required rows={4} className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-3 outline-none bg-white dark:bg-gray-700 dark:text-white" value={newWODescription} onChange={e => setNewWODescription(e.target.value)} placeholder="Descreva detalhadamente o serviço a ser realizado..." />
          {aiSuggestions.length > 0 && (
            <div className="mt-3 bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg border border-purple-100 dark:border-purple-800">
              <p className="text-xs font-bold text-purple-800 dark:text-purple-300 mb-2 flex items-center gap-1"><Sparkles className="w-3 h-3" /> Materiais Sugeridos pela IA:</p>
              <ul className="text-xs text-purple-700 dark:text-purple-300 space-y-1">
                {aiSuggestions.map((s, idx) => (
                  <li key={idx} className="flex gap-2"><span className="font-semibold">• {s.material}:</span> {s.reason}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
        <div className="flex gap-3 pt-4">
          <button type="button" onClick={() => setView('LIST')} className="flex-1 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition">Cancelar</button>
          <button type="submit" className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm transition font-medium">Criar O.S.</button>
        </div>
      </form>
    </div>
  );

  const renderResourceRequest = () => (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6 flex items-center gap-4">
        <button onClick={() => setView('LIST')} className="p-2 rounded-full border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-500 transition"><ArrowLeft className="w-5 h-5" /></button>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
          <Box className="w-6 h-6 text-blue-600" />
          Solicitar Recurso de Manutenção
        </h2>
      </div>

      <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-md border border-gray-100 dark:border-gray-700">
        <form onSubmit={handleCreateResourceRequest} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Item Solicitado</label>
              <input required type="text" className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2.5 outline-none bg-white dark:bg-gray-700 dark:text-white" value={resItemName} onChange={e => setResItemName(e.target.value)} placeholder="Ex: Sensor de Pressão" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Quantidade</label>
              <input required type="number" min="1" className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2.5 outline-none bg-white dark:bg-gray-700 dark:text-white" value={resQuantity} onChange={e => setResQuantity(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1"><Tag className="w-3 h-3" /> Marca / Detalhe</label>
              <input required type="text" className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2.5 outline-none bg-white dark:bg-gray-700 dark:text-white" value={resBrand} onChange={e => setResBrand(e.target.value)} placeholder="Ex: Siemens / Modelo X" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1"><Building className="w-3 h-3" /> Setor</label>
              <select className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2.5 outline-none bg-white dark:bg-gray-700 dark:text-white" value={resSector} onChange={handleSectorChange}>
                {sectors.map(sector => <option key={sector.id} value={sector.name}>{sector.name}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1"><Hash className="w-3 h-3" /> Centro de Custo</label>
              <input readOnly className="w-full border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-600 text-gray-600 dark:text-gray-300 rounded-lg p-2.5 cursor-not-allowed font-mono font-bold" value={resCostCenter} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1"><UserIcon className="w-3 h-3" /> Requerente</label>
              <input readOnly className="w-full border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-600 text-gray-600 dark:text-gray-300 rounded-lg p-2.5 cursor-not-allowed" value={currentUser?.name || 'Técnico'} />
            </div>
          </div>

          <button type="submit" className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm transition font-medium text-lg mt-4">Enviar Requisição de Manutenção</button>
        </form>
      </div>
    </div>
  );

  const renderRequestMaterial = () => {
    const wo = workOrders.find(w => w.id === selectedWO);
    const filteredInventory = inventory.filter(i => i.name.toLowerCase().includes(searchTerm.toLowerCase()));
    return (
      <div className="grid lg:grid-cols-3 gap-6 h-[calc(100vh-140px)]">
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden">
          <div className="p-4 border-b border-gray-100 bg-gray-50 dark:bg-gray-800">
            <h3 className="font-bold text-gray-800 dark:text-gray-100 mb-2">Selecione os Materiais</h3>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              <input type="text" placeholder="Buscar item no estoque..." className="w-full pl-9 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm outline-none bg-white dark:bg-gray-700 dark:text-white" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {filteredInventory.map(item => (
              <div key={item.id} className="flex items-center justify-between p-3 border border-gray-100 dark:border-gray-700 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition group">
                <div>
                  <div className="font-medium text-gray-800 dark:text-gray-100">{item.name}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Disponível: <span className={item.quantity === 0 ? "text-red-500 font-bold" : "text-gray-700 dark:text-gray-300"}>{item.quantity} {item.unit}</span></div>
                </div>
                {item.quantity > 0 ? (
                  <button onClick={() => addToCart(item.id, item.name, 1)} className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-blue-600 p-2 rounded-full hover:bg-blue-600 hover:text-white transition shadow-sm"><Plus className="w-4 h-4" /></button>
                ) : (
                  <span className="text-xs text-red-500 bg-red-50 px-2 py-1 rounded">Sem estoque</span>
                )}
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col">
          <div className="p-4 border-b border-gray-100 bg-gray-50 dark:bg-gray-800">
            <h3 className="font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2"><ShoppingCart className="w-5 h-5 text-blue-600" /> Solicitação para O.S.</h3>
            <p className="text-xs text-gray-500 truncate mt-1">Ref: {wo?.title}</p>
          </div>
          <div className="flex-1 p-4 overflow-y-auto">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-400 text-sm"><ShoppingCart className="w-10 h-10 mb-2 opacity-20" /><p>Nenhum item selecionado</p></div>
            ) : (
              <ul className="space-y-3">
                {cart.map(item => (
                  <li key={item.itemId} className="flex justify-between items-center bg-gray-50 dark:bg-gray-700 p-2 rounded-lg">
                    <div className="flex-1"><div className="text-sm font-medium">{item.itemName}</div><div className="text-xs text-gray-500">Qtd: {item.quantityRequested}</div></div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => addToCart(item.itemId, item.itemName, 1)} className="text-gray-500 hover:text-blue-600 p-1"><Plus className="w-3 h-3" /></button>
                      <button onClick={() => removeFromCart(item.itemId)} className="text-red-400 hover:text-red-600 p-1">&times;</button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="p-4 border-t border-gray-100 dark:border-gray-700">
             <div className="bg-yellow-50 dark:bg-yellow-900/30 p-3 rounded-lg mb-4 text-xs text-yellow-800 dark:text-yellow-300 flex gap-2"><Info className="w-4 h-4 shrink-0" />A solicitação passará pela aprovação do almoxarifado.</div>
             <div className="flex gap-2">
                <button onClick={() => { setView('LIST'); setSelectedWO(null); setCart([]); }} className="w-1/3 py-2 border border-gray-300 dark:border-gray-600 text-gray-600 rounded-lg hover:bg-gray-50 transition text-sm">Voltar</button>
                <button onClick={handleRequestSubmit} disabled={cart.length === 0} className="w-2/3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 shadow-sm text-sm font-medium">Enviar Solicitação</button>
             </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-6">
      {view === 'LIST' && renderList()}
      {view === 'CREATE_WO' && renderCreate()}
      {view === 'REQUEST_MATERIAL' && renderRequestMaterial()}
      {view === 'RESOURCE_REQUEST' && renderResourceRequest()}

      {statusModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full p-6">
            <h3 className={`text-xl font-bold mb-4 flex items-center gap-2 ${
              statusModal.type === 'COMPLETE' ? 'text-green-700' : statusModal.type === 'FAIL' ? 'text-red-700' : 'text-orange-700'
            }`}>
              {statusModal.type === 'COMPLETE' && <><CheckCircle className="w-6 h-6"/> Concluir Manutenção</>}
              {statusModal.type === 'FAIL' && <><XCircle className="w-6 h-6"/> Reportar Falha</>}
              {statusModal.type === 'REOPEN' && <><RotateCcw className="w-6 h-6"/> Reabrir O.S.</>}
            </h3>
            <form onSubmit={handleStatusSubmit} className="space-y-4">
              <textarea required rows={4} className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-3 outline-none bg-white dark:bg-gray-700 dark:text-white" placeholder="Digite os detalhes para o histórico..." value={statusNote} onChange={e => setStatusNote(e.target.value)} />
              {statusModal.type === 'REOPEN' && (
                <div className="flex items-center gap-3 p-3 border border-gray-200 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition" onClick={() => setReopenNeedsMaterial(!reopenNeedsMaterial)}>
                  <div className={`w-5 h-5 rounded border flex items-center justify-center transition ${reopenNeedsMaterial ? 'bg-blue-600 border-blue-600' : 'border-gray-300 dark:border-gray-500 bg-white dark:bg-gray-600'}`}>
                    {reopenNeedsMaterial && <CheckCheck className="w-3 h-3 text-white" />}
                  </div>
                  <span className="block text-sm font-bold text-gray-800 dark:text-gray-200">Solicitar novos materiais?</span>
                </div>
              )}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setStatusModal({ isOpen: false, type: null, woId: null })} className="flex-1 border border-gray-300 dark:border-gray-600 py-2.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition">Cancelar</button>
                <button type="submit" className={`flex-1 text-white py-2.5 rounded-lg font-medium shadow-sm transition ${statusModal.type === 'COMPLETE' ? 'bg-green-600 hover:bg-green-700' : statusModal.type === 'FAIL' ? 'bg-red-600 hover:bg-red-700' : 'bg-orange-600 hover:bg-orange-700'}`}>Confirmar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};