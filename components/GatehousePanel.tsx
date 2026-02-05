import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Truck, Search, CheckCircle, Clock, History, Box, Calendar, User as UserIcon, FileText, MapPin, Check } from 'lucide-react';
import { User } from '../types';

interface GatehousePanelProps {
  currentUser: User;
}

export const GatehousePanel: React.FC<GatehousePanelProps> = ({ currentUser }) => {
  const { purchaseOrders, updatePurchaseStatus } = useApp();
  const [activeTab, setActiveTab] = useState<'PENDING' | 'HISTORY'>('PENDING');
  const [searchTerm, setSearchTerm] = useState('');

  // Include both ORDERED and ARRIVED in pending for immediate feedback
  const pendingDeliveries = purchaseOrders.filter(po => 
    (po.status === 'ORDERED' || po.status === 'ARRIVED') && 
    (po.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) || 
     po.supplier.toLowerCase().includes(searchTerm.toLowerCase()))
  ).sort((a,b) => {
    // Keep ARRIVED at the bottom of the pending list
    if (a.status === 'ARRIVED' && b.status !== 'ARRIVED') return 1;
    if (a.status !== 'ARRIVED' && b.status === 'ARRIVED') return -1;
    return a.purchaseDate - b.purchaseDate;
  });

  const historyDeliveries = purchaseOrders.filter(po => 
    po.status === 'STOCKED' && 
    (po.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) || 
     po.supplier.toLowerCase().includes(searchTerm.toLowerCase()))
  ).sort((a,b) => (b.arrivalDate || 0) - (a.arrivalDate || 0));

  const handleConfirmArrival = (poId: string) => {
    // Direct call to avoid window.confirm issues
    updatePurchaseStatus(poId, 'ARRIVED');
  };

  return (
    <div className="p-6">
      <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
            <Truck className="w-8 h-8 text-amber-500" />
            Controle de Portaria
          </h2>
          <p className="text-gray-500 dark:text-gray-400">Registro de entrada física de mercadorias no site.</p>
        </div>
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
          <input 
            type="text" 
            placeholder="Buscar por Pedido ou Fornecedor..." 
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-amber-500 transition-shadow shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6 overflow-x-auto scrollbar-hide">
        <button 
          onClick={() => setActiveTab('PENDING')} 
          className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${activeTab === 'PENDING' ? 'border-amber-500 text-amber-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
          <Clock className="w-4 h-4" /> Entregas Aguardadas
          {pendingDeliveries.filter(d => d.status === 'ORDERED').length > 0 && (
            <span className="bg-amber-100 text-amber-700 text-[10px] px-2 py-0.5 rounded-full">
              {pendingDeliveries.filter(d => d.status === 'ORDERED').length}
            </span>
          )}
        </button>
        <button 
          onClick={() => setActiveTab('HISTORY')} 
          className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${activeTab === 'HISTORY' ? 'border-amber-500 text-amber-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
          <History className="w-4 h-4" /> Registro de Entradas (Baixados)
        </button>
      </div>

      <div className="grid gap-6">
        {activeTab === 'PENDING' ? (
          pendingDeliveries.length === 0 ? (
            <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
              <Box className="w-16 h-16 text-gray-200 dark:text-gray-700 mx-auto mb-4" />
              <p className="text-gray-400 font-medium">Nenhum pedido de compra aguardando entrega.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pendingDeliveries.map(po => {
                const isArrived = po.status === 'ARRIVED';
                return (
                  <div 
                    key={po.id} 
                    className={`bg-white dark:bg-gray-800 rounded-2xl shadow-sm border-2 overflow-hidden flex flex-col transition-all duration-300 ${
                      isArrived ? 'border-green-500 bg-green-50/10' : 'border-gray-200 dark:border-gray-700 hover:shadow-md'
                    }`}
                  >
                    <div className={`p-4 border-b flex justify-between items-center ${
                      isArrived ? 'bg-green-100 dark:bg-green-900/40 border-green-200' : 'bg-gray-50 dark:bg-gray-700/50 border-gray-100 dark:border-gray-700'
                    }`}>
                      <span className={`text-xs font-bold uppercase tracking-widest ${isArrived ? 'text-green-700 dark:text-green-300' : 'text-gray-400'}`}>
                        Pedido #{po.orderNumber}
                      </span>
                      <span className={`text-[10px] px-2 py-1 rounded-full font-bold uppercase ${
                        isArrived ? 'bg-green-600 text-white' : 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400'
                      }`}>
                        {isArrived ? 'CHEGOU' : 'EM TRÂNSITO'}
                      </span>
                    </div>
                    
                    <div className="p-5 flex-1 space-y-4">
                      <div>
                        <h3 className="font-bold text-xl text-gray-800 dark:text-white leading-tight mb-1">{po.supplier}</h3>
                        <p className="text-xs text-gray-500 flex items-center gap-1"><Calendar className="w-3 h-3" /> Compra em: {new Date(po.purchaseDate).toLocaleDateString()}</p>
                      </div>

                      <div className={`p-3 rounded-xl border ${
                        isArrived ? 'bg-green-50 dark:bg-green-900/20 border-green-100' : 'bg-gray-50 dark:bg-gray-900/40 border-gray-100 dark:border-gray-700'
                      }`}>
                        <p className={`text-[10px] font-bold uppercase mb-2 ${isArrived ? 'text-green-600' : 'text-gray-400'}`}>Itens do Pedido</p>
                        <ul className="space-y-1">
                          {po.items.map(item => (
                            <li key={item.id} className="text-xs text-gray-600 dark:text-gray-300 flex justify-between">
                              <span>{item.name}</span>
                              <span className="font-mono font-bold text-gray-400">{item.quantity} {item.unit}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <UserIcon className="w-3 h-3" /> Comprador: {po.purchaserName}
                      </div>
                    </div>

                    <div className="p-4 mt-auto">
                      {isArrived ? (
                        <div className="bg-green-600 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-green-600/20 animate-in fade-in zoom-in duration-300">
                          <Check className="w-5 h-5" /> Chegada Confirmada
                        </div>
                      ) : (
                        <button 
                          onClick={() => handleConfirmArrival(po.id)}
                          className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 active:scale-[0.98]"
                        >
                          <CheckCircle className="w-5 h-5" /> Confirmar Chegada
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-700">
                <tr>
                  <th className="p-4 font-bold uppercase text-[10px] tracking-wider">Data Finalização</th>
                  <th className="p-4 font-bold uppercase text-[10px] tracking-wider">Fornecedor / Pedido</th>
                  <th className="p-4 font-bold uppercase text-[10px] tracking-wider">Nota Fiscal</th>
                  <th className="p-4 font-bold uppercase text-[10px] tracking-wider text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {historyDeliveries.map(po => (
                  <tr key={po.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                    <td className="p-4 text-gray-600 dark:text-gray-400">
                      {po.completionDate ? new Date(po.completionDate).toLocaleDateString() : '-'}
                    </td>
                    <td className="p-4">
                      <div className="font-bold text-gray-800 dark:text-gray-100">{po.supplier}</div>
                      <div className="text-xs text-amber-600 dark:text-amber-400 font-mono">Pedido #{po.orderNumber}</div>
                    </td>
                    <td className="p-4">
                      {po.invoiceNumber ? (
                        <div className="flex items-center gap-1 text-gray-600 dark:text-gray-300">
                          <FileText className="w-3 h-3" /> {po.invoiceNumber}
                        </div>
                      ) : <span className="text-gray-300">Não informado</span>}
                    </td>
                    <td className="p-4 text-right">
                      <span className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 px-2 py-1 rounded-full text-[10px] font-bold uppercase">
                        ESTOCADO
                      </span>
                    </td>
                  </tr>
                ))}
                {historyDeliveries.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-gray-400 italic">Nenhum registro de entrada estocado.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};