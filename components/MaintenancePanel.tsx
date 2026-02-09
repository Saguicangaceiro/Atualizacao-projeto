import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Plus, Wrench, Search, ShoppingCart, Sparkles, Loader2, Info, CheckCircle, Clock, XCircle, FileText, Play, RotateCcw, AlertTriangle, CheckCheck, Box, User as UserIcon, Tag, Hash, Building, ArrowLeft, Minus, MessageSquareText, Lightbulb, BookOpen, Trash2, PlusCircle, MessageCircle, Printer } from 'lucide-react';
import { suggestMaterialsLocally } from '../services/localAssistant';
import { MaterialRequestItem, RequestStatus, WorkOrderStatus, User, SupportTicketStatus } from '../types';

interface MaintenancePanelProps {
  currentUser?: User;
}

export const MaintenancePanel: React.FC<MaintenancePanelProps> = ({ currentUser }) => {
  const { workOrders, inventory, materialRequests, addWorkOrder, createMaterialRequest, updateWorkOrderStatus, reopenWorkOrder, addResourceRequest, sectors, guides, addGuide, removeGuide, supportTickets, processSupportTicket, equipments } = useApp();
  const [view, setView] = useState<'LIST' | 'CREATE_WO' | 'REQUEST_MATERIAL' | 'RESOURCE_REQUEST'>('LIST');
  const [activeTab, setActiveTab] = useState<'OPEN' | 'FAILED' | 'COMPLETED' | 'TICKETS' | 'GUIDES'>('OPEN');
  
  const [newWODescription, setNewWODescription] = useState('');
  const [newWOTitle, setNewWOTitle] = useState('');
  const [newWOPriority, setNewWOPriority] = useState<'Baixa'|'Média'|'Alta'>('Média');
  const [newWONeedsMaterials, setNewWONeedsMaterials] = useState(true);
  const [newWOEquipmentId, setNewWOEquipmentId] = useState('');
  
  const [selectedWO, setSelectedWO] = useState<string | null>(null);
  const [cart, setCart] = useState<MaterialRequestItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [materialSectorFilter, setMaterialSectorFilter] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<{material: string, reason: string}[]>([]);

  const handleCreateWO = (e: React.FormEvent) => {
    e.preventDefault();
    addWorkOrder({
      title: newWOTitle,
      description: newWODescription,
      priority: newWOPriority,
      requesterName: currentUser?.name || 'Técnico',
      equipmentId: newWOEquipmentId || undefined
    }, newWONeedsMaterials);
    
    setView('LIST');
    setNewWOTitle('');
    setNewWODescription('');
    setNewWOEquipmentId('');
    setNewWONeedsMaterials(true);
    setAiSuggestions([]);
  };

  const handlePrintOS = (woId: string) => {
    const wo = workOrders.find(w => w.id === woId);
    if (!wo) return;
    const equipment = equipments.find(e => e.id === wo.equipmentId);
    const materials = materialRequests.filter(r => r.workOrderId === woId).flatMap(r => r.items);
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Ordem de Serviço - ${wo.title}</title>
          <style>
            body { font-family: sans-serif; padding: 40px; color: #333; }
            .header { border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px; display: flex; justify-content: space-between; }
            .section { margin-bottom: 20px; }
            .section-title { font-weight: bold; text-transform: uppercase; font-size: 12px; color: #666; margin-bottom: 5px; }
            .box { border: 1px solid #ddd; padding: 15px; border-radius: 5px; background: #f9f9f9; }
            .grid { display: grid; grid-template-cols: 1fr 1fr; gap: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background: #eee; }
            .footer { margin-top: 50px; border-top: 1px solid #000; padding-top: 10px; text-align: center; font-size: 10px; }
            .sig { margin-top: 40px; display: flex; justify-content: space-around; }
            .sig-line { border-top: 1px solid #000; width: 200px; padding-top: 5px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div><strong>DutyFinder</strong> - Gestão de Manutenção</div>
            <div>O.S. #${wo.id.slice(0,8).toUpperCase()}</div>
          </div>
          <h1>${wo.title}</h1>
          <div class="grid">
             <div class="section">
                <div class="section-title">Informações Gerais</div>
                <div class="box">
                   <strong>Prioridade:</strong> ${wo.priority}<br>
                   <strong>Data Abertura:</strong> ${new Date(wo.createdAt).toLocaleString()}<br>
                   <strong>Status:</strong> ${wo.status}
                </div>
             </div>
             <div class="section">
                <div class="section-title">Equipamento / Ativo</div>
                <div class="box">
                   ${equipment ? `<strong>${equipment.name}</strong><br>TAG: ${equipment.code}<br>Local: ${equipment.location}` : 'Nenhum equipamento vinculado.'}
                </div>
             </div>
          </div>
          <div class="section">
             <div class="section-title">Descrição do Problema</div>
             <div class="box">${wo.description}</div>
          </div>
          ${materials.length > 0 ? `
            <div class="section">
               <div class="section-title">Materiais Solicitados</div>
               <table>
                  <thead><tr><th>Material</th><th>Quantidade</th></tr></thead>
                  <tbody>${materials.map(m => `<tr><td>${m.itemName}</td><td>${m.quantityRequested}</td></tr>`).join('')}</tbody>
               </table>
            </div>
          ` : ''}
          <div class="sig">
             <div class="sig-line">Assinatura Técnico</div>
             <div class="sig-line">Assinatura Solicitante</div>
          </div>
          <div class="footer">Gerado localmente por DutyFinder System em ${new Date().toLocaleString()}</div>
          <script>window.print();</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const renderList = () => {
    const filteredWOs = workOrders.filter(wo => {
      if (activeTab === 'OPEN') return wo.status === WorkOrderStatus.PREPARATION || wo.status === WorkOrderStatus.IN_PROGRESS;
      if (activeTab === 'FAILED') return wo.status === WorkOrderStatus.FAILED;
      if (activeTab === 'COMPLETED') return wo.status === WorkOrderStatus.COMPLETED;
      return false;
    });

    return (
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
            <Wrench className="w-6 h-6 text-blue-600 dark:text-blue-400" /> Ordens de Serviço
          </h2>
          <button onClick={() => setView('CREATE_WO')} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-blue-600/20 transition">
            <Plus className="w-5 h-5" /> Abrir Nova O.S.
          </button>
        </div>

        <div className="flex border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
          <button onClick={() => setActiveTab('OPEN')} className={`px-6 py-3 text-sm font-medium border-b-2 flex items-center gap-2 ${activeTab === 'OPEN' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500'}`}>
            <Clock className="w-4 h-4" /> Ativas
          </button>
          <button onClick={() => setActiveTab('TICKETS')} className={`px-6 py-3 text-sm font-medium border-b-2 flex items-center gap-2 ${activeTab === 'TICKETS' ? 'border-purple-500 text-purple-600' : 'border-transparent text-gray-500'}`}>
            <MessageCircle className="w-4 h-4" /> Chamados
          </button>
          <button onClick={() => setActiveTab('COMPLETED')} className={`px-6 py-3 text-sm font-medium border-b-2 flex items-center gap-2 ${activeTab === 'COMPLETED' ? 'border-green-500 text-green-600' : 'border-transparent text-gray-500'}`}>
            <CheckCheck className="w-4 h-4" /> Histórico
          </button>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredWOs.map(wo => {
            const equipment = equipments.find(e => e.id === wo.equipmentId);
            return (
              <div key={wo.id} className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm relative overflow-hidden flex flex-col h-full">
                <div className={`absolute top-0 left-0 w-1 h-full ${wo.status === WorkOrderStatus.FAILED ? 'bg-red-500' : wo.status === WorkOrderStatus.COMPLETED ? 'bg-green-500' : 'bg-blue-500'}`} />
                <div className="flex justify-between items-start mb-4 pl-2">
                   <div className="bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 text-[9px] font-black px-2 py-0.5 rounded border border-blue-100 dark:border-blue-800 uppercase">OS #{wo.id.slice(0,6)}</div>
                   <button onClick={() => handlePrintOS(wo.id)} className="text-gray-400 hover:text-blue-600 transition p-1" title="Imprimir OS"><Printer className="w-4 h-4" /></button>
                </div>
                <h3 className="font-bold text-gray-800 dark:text-white pl-2 mb-2">{wo.title}</h3>
                {equipment && (
                  <div className="mx-2 mb-3 bg-gray-50 dark:bg-gray-700/50 p-2 rounded-lg border border-gray-100 dark:border-gray-600 flex items-center gap-2">
                     <HardDrive className="w-3 h-3 text-blue-500" />
                     <span className="text-[10px] font-bold text-gray-600 dark:text-gray-300">{equipment.name} ({equipment.code})</span>
                  </div>
                )}
                <p className="text-sm text-gray-500 dark:text-gray-400 pl-2 line-clamp-3 italic mb-4 flex-1">"{wo.description}"</p>
                
                <div className="mt-auto pt-4 border-t border-gray-50 dark:border-gray-700 flex justify-between items-center pl-2">
                   <span className="text-[10px] text-gray-400 uppercase font-bold">{new Date(wo.createdAt).toLocaleDateString()}</span>
                   <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${wo.status === WorkOrderStatus.COMPLETED ? 'bg-green-50 text-green-700 border-green-200' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>
                     {wo.status}
                   </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderCreate = () => (
    <div className="max-w-3xl mx-auto bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 animate-in fade-in slide-in-from-bottom-4">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => setView('LIST')} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition text-gray-500"><ArrowLeft className="w-6 h-6" /></button>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Registrar Atendimento</h2>
      </div>

      <form onSubmit={handleCreateWO} className="space-y-6">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5">Título Curto</label>
            <input required className="w-full border border-gray-300 dark:border-gray-600 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 dark:text-white" value={newWOTitle} onChange={e => setNewWOTitle(e.target.value)} placeholder="Ex: Ajuste de alinhamento" />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5">Vincular Equipamento / TAG</label>
            <select className="w-full border border-gray-300 dark:border-gray-600 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 dark:text-white" value={newWOEquipmentId} onChange={e => setNewWOEquipmentId(e.target.value)}>
              <option value="">Sem equipamento (Geral)</option>
              {equipments.map(e => <option key={e.id} value={e.id}>{e.code} - {e.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5">Urgência</label>
            <select className="w-full border border-gray-300 dark:border-gray-600 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 dark:text-white" value={newWOPriority} onChange={(e: any) => setNewWOPriority(e.target.value)}>
              <option value="Baixa">Normal</option>
              <option value="Média">Moderada</option>
              <option value="Alta">Urgente / Emergência</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5">Descrição Técnica</label>
          <textarea required rows={5} className="w-full border border-gray-300 dark:border-gray-600 rounded-xl p-4 outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 dark:text-white" value={newWODescription} onChange={e => setNewWODescription(e.target.value)} />
        </div>

        <div className="flex gap-4">
           <button type="button" onClick={() => setView('LIST')} className="flex-1 py-3 border border-gray-200 dark:border-gray-700 rounded-xl font-bold text-gray-400 hover:bg-gray-50 transition">Cancelar</button>
           <button type="submit" className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-600/20">Abrir Ordem de Serviço</button>
        </div>
      </form>
    </div>
  );

  return (
    <div className="p-6">
      {view === 'LIST' && renderList()}
      {view === 'CREATE_WO' && renderCreate()}
      {/* ... outros renders de tab ... */}
    </div>
  );
};
// Helper Icon para abas
function HardDrive(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="12" x2="2" y2="12"></line><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"></path><line x1="6" y1="16" x2="6.01" y2="16"></line><line x1="10" y1="16" x2="10.01" y2="16"></line></svg>
  );
}