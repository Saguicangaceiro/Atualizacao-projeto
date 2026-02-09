
import React from 'react';
import { useApp } from '../context/AppContext';
import { Wrench, Package, AlertTriangle, CheckCircle, Clock, ShoppingCart, TrendingUp, Users, Server, RefreshCw } from 'lucide-react';
import { WorkOrderStatus } from '../types';

export const Dashboard: React.FC = () => {
  const { workOrders, inventory, purchaseOrders, serverStatus, refreshData } = useApp();

  const totalOS = workOrders.length;
  const pendingOS = workOrders.filter(o => o.status === WorkOrderStatus.PREPARATION || o.status === WorkOrderStatus.IN_PROGRESS).length;
  const completedOS = workOrders.filter(o => o.status === WorkOrderStatus.COMPLETED).length;
  const failedOS = workOrders.filter(o => o.status === WorkOrderStatus.FAILED).length;

  const lowStockItems = inventory.filter(i => i.quantity <= i.minThreshold).length;
  const pendingPurchases = purchaseOrders.filter(p => p.status === 'ORDERED').length;

  const cards = [
    { title: 'Ordens em Aberto', value: pendingOS, icon: Clock, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20' },
    { title: 'O.S. Concluídas', value: completedOS, icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-900/20' },
    { title: 'Itens c/ Estoque Baixo', value: lowStockItems, icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-900/20' },
    { title: 'Compras em Trânsito', value: pendingPurchases, icon: ShoppingCart, color: 'text-orange-600', bg: 'bg-orange-50 dark:bg-orange-900/20' },
  ];

  return (
    <div className="p-6 space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-indigo-500" />
            Painel de Indicadores
          </h2>
          <p className="text-gray-500 dark:text-gray-400">Resumo da operação e produtividade da manutenção.</p>
        </div>
        
        <div className={`flex items-center gap-3 px-4 py-2 rounded-xl border ${
          serverStatus === 'ONLINE' ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800' :
          serverStatus === 'CONNECTING' ? 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800' :
          'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800'
        }`}>
          <Server className={`w-4 h-4 ${serverStatus === 'CONNECTING' ? 'animate-pulse' : ''}`} />
          <span className="text-xs font-bold uppercase tracking-wider">Servidor {serverStatus}</span>
          <button onClick={() => refreshData()} className="p-1 hover:bg-black/5 rounded transition">
            <RefreshCw className={`w-3 h-3 ${serverStatus === 'CONNECTING' ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card, idx) => (
          <div key={idx} className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-4">
            <div className={`p-4 rounded-xl ${card.bg}`}>
              <card.icon className={`w-6 h-6 ${card.color}`} />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{card.title}</p>
              <p className="text-2xl font-black text-gray-800 dark:text-white">{card.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
          <h3 className="font-bold text-gray-800 dark:text-gray-100 mb-6 flex items-center gap-2">
            <Wrench className="w-5 h-5 text-blue-500" /> Status das Ordens de Serviço
          </h3>
          <div className="space-y-4">
             {[
               { label: 'Em Preparação', value: workOrders.filter(w => w.status === WorkOrderStatus.PREPARATION).length, color: 'bg-yellow-400' },
               { label: 'Em Andamento', value: workOrders.filter(w => w.status === WorkOrderStatus.IN_PROGRESS).length, color: 'bg-blue-500' },
               { label: 'Concluídas', value: completedOS, color: 'bg-green-500' },
               { label: 'Falhas', value: failedOS, color: 'bg-red-500' },
             ].map((item, i) => {
               const percentage = totalOS === 0 ? 0 : (item.value / totalOS) * 100;
               return (
                 <div key={i} className="space-y-1.5">
                   <div className="flex justify-between text-xs font-bold">
                     <span className="text-gray-600 dark:text-gray-400">{item.label}</span>
                     <span className="text-gray-800 dark:text-white">{item.value} ({percentage.toFixed(0)}%)</span>
                   </div>
                   <div className="w-full bg-gray-100 dark:bg-gray-700 h-2 rounded-full overflow-hidden">
                     <div className={`h-full ${item.color}`} style={{ width: `${percentage}%` }}></div>
                   </div>
                 </div>
               );
             })}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
          <h3 className="font-bold text-gray-800 dark:text-gray-100 mb-6 flex items-center gap-2">
            <Package className="w-5 h-5 text-indigo-500" /> Itens Críticos de Estoque
          </h3>
          <div className="overflow-y-auto max-h-64 pr-2">
            {inventory.filter(i => i.quantity <= i.minThreshold).length === 0 ? (
              <div className="text-center py-10 text-gray-400 italic text-sm">Nenhum item em nível crítico.</div>
            ) : (
              <table className="w-full text-left text-sm">
                <thead className="text-gray-400 font-bold uppercase text-[10px] border-b border-gray-50 dark:border-gray-700">
                  <tr>
                    <th className="pb-2">Material</th>
                    <th className="pb-2 text-right">Saldo</th>
                    <th className="pb-2 text-right">Min</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                  {inventory.filter(i => i.quantity <= i.minThreshold).map(item => (
                    <tr key={item.id}>
                      <td className="py-3 font-medium text-gray-700 dark:text-gray-300">{item.name}</td>
                      <td className="py-3 text-right font-mono font-bold text-red-500">{item.quantity}</td>
                      <td className="py-3 text-right font-mono text-gray-400">{item.minThreshold}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
