import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ShoppingBag, Plus, Clock, CheckCircle, Truck, FileText, Calendar, Trash2, MapPin } from 'lucide-react';
import { User, PurchaseOrderItem } from '../types';

interface PurchasingPanelProps {
  currentUser: User;
}

export const PurchasingPanel: React.FC<PurchasingPanelProps> = ({ currentUser }) => {
  const { purchaseOrders, addPurchaseOrder, updatePurchaseStatus } = useApp();
  const [activeTab, setActiveTab] = useState<'NEW' | 'TRACKING' | 'HISTORY'>('NEW');

  // Form State
  const [orderNumber, setOrderNumber] = useState('');
  const [supplier, setSupplier] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');

  // Item Form State
  const [items, setItems] = useState<PurchaseOrderItem[]>([]);
  const [tempItemName, setTempItemName] = useState('');
  const [tempItemQty, setTempItemQty] = useState('');
  const [tempItemUnit, setTempItemUnit] = useState('');
  const [tempItemCategory, setTempItemCategory] = useState('Outros');

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tempItemName || !tempItemQty) return;

    const newItem: PurchaseOrderItem = {
      id: crypto.randomUUID(),
      name: tempItemName,
      quantity: Number(tempItemQty),
      unit: tempItemUnit,
      category: tempItemCategory
    };

    setItems([...items, newItem]);
    // Reset temp fields
    setTempItemName('');
    setTempItemQty('');
    setTempItemUnit('');
    setTempItemCategory('Outros');
  };

  const handleRemoveItem = (id: string) => {
    setItems(items.filter(i => i.id !== id));
  };

  const handleSubmitOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) {
      alert("Adicione pelo menos um item ao pedido.");
      return;
    }

    addPurchaseOrder({
      orderNumber,
      supplier,
      invoiceNumber: invoiceNumber || undefined,
      purchaseDate: new Date(purchaseDate).getTime(),
      items,
      purchaserName: currentUser.name,
      notes: notes || undefined
    });

    // Reset Form
    setOrderNumber('');
    setSupplier('');
    setInvoiceNumber('');
    setNotes('');
    setItems([]);
    setActiveTab('TRACKING');
  };

  // Prioritize arrived orders in the list
  const activeOrders = purchaseOrders
    .filter(po => po.status === 'ORDERED' || po.status === 'ARRIVED')
    .sort((a, b) => {
      if (a.status === 'ARRIVED' && b.status !== 'ARRIVED') return -1;
      if (a.status !== 'ARRIVED' && b.status === 'ARRIVED') return 1;
      return b.purchaseDate - a.purchaseDate;
    });

  const historyOrders = purchaseOrders.filter(po => po.status === 'STOCKED');

  const renderNewOrder = () => (
    <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
      <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-6 flex items-center gap-2">
        <Plus className="w-6 h-6 text-rose-600 dark:text-rose-400" />
        Novo Pedido de Compra
      </h3>

      <form onSubmit={handleSubmitOrder}>
        {/* Header Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div>
             <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nº do Pedido *</label>
             <input required type="text" className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2 focus:ring-2 focus:ring-rose-500 outline-none bg-white dark:bg-gray-700 dark:text-white" value={orderNumber} onChange={e => setOrderNumber(e.target.value)} />
          </div>
          <div>
             <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fornecedor *</label>
             <input required type="text" className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2 focus:ring-2 focus:ring-rose-500 outline-none bg-white dark:bg-gray-700 dark:text-white" value={supplier} onChange={e => setSupplier(e.target.value)} />
          </div>
          <div>
             <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Data da Compra</label>
             <input required type="date" className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2 focus:ring-2 focus:ring-rose-500 outline-none bg-white dark:bg-gray-700 dark:text-white" value={purchaseDate} onChange={e => setPurchaseDate(e.target.value)} />
          </div>
          <div>
             <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nota Fiscal (Opcional)</label>
             <input type="text" className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2 focus:ring-2 focus:ring-rose-500 outline-none bg-white dark:bg-gray-700 dark:text-white" value={invoiceNumber} onChange={e => setInvoiceNumber(e.target.value)} />
          </div>
        </div>

        {/* Item Addition Section */}
        <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg border border-gray-200 dark:border-gray-600 mb-6">
          <h4 className="text-sm font-bold text-gray-600 dark:text-gray-400 mb-3 uppercase">Adicionar Itens</h4>
          <div className="flex flex-wrap gap-3 items-end">
             <div className="flex-grow min-w-[200px]">
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Item</label>
                <input placeholder="Ex: Cimento CP II" type="text" className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2 text-sm focus:ring-2 focus:ring-rose-500 outline-none bg-white dark:bg-gray-700 dark:text-white" value={tempItemName} onChange={e => setTempItemName(e.target.value)} />
             </div>
             <div className="w-24">
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Qtd</label>
                <input placeholder="0" type="number" min="0" className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2 text-sm focus:ring-2 focus:ring-rose-500 outline-none bg-white dark:bg-gray-700 dark:text-white" value={tempItemQty} onChange={e => setTempItemQty(e.target.value)} />
             </div>
             <div className="w-24">
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Unid</label>
                <input placeholder="kg, sc" type="text" className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2 text-sm focus:ring-2 focus:ring-rose-500 outline-none bg-white dark:bg-gray-700 dark:text-white" value={tempItemUnit} onChange={e => setTempItemUnit(e.target.value)} />
             </div>
             <div className="w-32">
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Categoria</label>
                <select className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2 text-sm focus:ring-2 focus:ring-rose-500 outline-none bg-white dark:bg-gray-700 dark:text-white" value={tempItemCategory} onChange={e => setTempItemCategory(e.target.value)}>
                   <option>Elétrica</option>
                   <option>Hidráulica</option>
                   <option>Mecânica</option>
                   <option>Civil</option>
                   <option>EPI</option>
                   <option>Ferramentas</option>
                   <option>Outros</option>
                </select>
             </div>
             <button type="button" onClick={handleAddItem} className="bg-rose-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-rose-700 transition h-[38px]">
               Adicionar
             </button>
          </div>
        </div>

        {/* Item List */}
        <div className="mb-6">
          <table className="w-full text-sm text-left">
             <thead className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 uppercase text-xs font-semibold">
               <tr>
                 <th className="p-3 rounded-tl-lg">Item</th>
                 <th className="p-3">Qtd</th>
                 <th className="p-3">Categoria</th>
                 <th className="p-3 text-right rounded-tr-lg">Ação</th>
               </tr>
             </thead>
             <tbody className="divide-y divide-gray-100 dark:divide-gray-700 border border-gray-100 dark:border-gray-700 border-t-0">
               {items.length === 0 && (
                 <tr>
                   <td colSpan={4} className="p-4 text-center text-gray-400 dark:text-gray-500">Nenhum item adicionado ao pedido.</td>
                 </tr>
               )}
               {items.map(item => (
                 <tr key={item.id}>
                   <td className="p-3 text-gray-800 dark:text-gray-200">{item.name}</td>
                   <td className="p-3 text-gray-800 dark:text-gray-200">{item.quantity} {item.unit}</td>
                   <td className="p-3"><span className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-xs text-gray-700 dark:text-gray-300">{item.category}</span></td>
                   <td className="p-3 text-right">
                     <button type="button" onClick={() => handleRemoveItem(item.id)} className="text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                   </td>
                 </tr>
               ))}
             </tbody>
          </table>
        </div>

        <div>
           <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Observações</label>
           <textarea className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2 focus:ring-2 focus:ring-rose-500 outline-none bg-white dark:bg-gray-700 dark:text-white" rows={2} value={notes} onChange={e => setNotes(e.target.value)}></textarea>
        </div>

        <div className="mt-6 flex justify-end">
           <button type="submit" className="bg-rose-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-rose-700 shadow-sm flex items-center gap-2">
             <CheckCircle className="w-5 h-5" /> Registrar Pedido
           </button>
        </div>
      </form>
    </div>
  );

  const renderTracking = () => (
    <div className="space-y-6">
      <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
        <Truck className="w-6 h-6 text-rose-600 dark:text-rose-400" />
        Acompanhamento de Pedidos
      </h3>

      {activeOrders.length === 0 ? (
         <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
           <p className="text-gray-500 dark:text-gray-400">Nenhum pedido em aberto.</p>
         </div>
      ) : (
        <div className="grid gap-6">
           {activeOrders.map(po => (
             <div 
               key={po.id} 
               className={`bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border-2 transition-all relative overflow-hidden ${
                 po.status === 'ARRIVED' 
                  ? 'border-green-400 dark:border-green-600 animate-pulse-subtle bg-green-50/10 dark:bg-green-900/5' 
                  : 'border-gray-200 dark:border-gray-700'
               }`}
             >
                <div className="flex flex-col md:flex-row justify-between items-start mb-4 gap-4">
                   <div>
                      <div className="flex items-center gap-3 mb-1 flex-wrap">
                        <h4 className="font-bold text-lg text-gray-800 dark:text-gray-100">Pedido #{po.orderNumber}</h4>
                        {po.invoiceNumber && <span className="text-[10px] bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded border border-gray-200 dark:border-gray-600 font-mono">NF: {po.invoiceNumber}</span>}
                        {po.status === 'ARRIVED' && (
                          <span className="bg-green-600 text-white text-[10px] font-black px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm uppercase tracking-tighter">
                            <MapPin className="w-3 h-3" /> Chegou na Portaria
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Fornecedor: <span className="font-medium text-gray-700 dark:text-gray-300">{po.supplier}</span></p>
                      <p className="text-xs text-gray-400 mt-1 flex items-center gap-1"><Calendar className="w-3 h-3"/> Compra em {new Date(po.purchaseDate).toLocaleDateString()}</p>
                   </div>
                   <div className="text-right flex flex-col items-end gap-2">
                      {po.status === 'ORDERED' && (
                        <span className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 text-[10px] font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 border border-yellow-200 dark:border-yellow-900/50 uppercase tracking-wider">
                          <Clock className="w-3.5 h-3.5" /> Aguardando Entrega
                        </span>
                      )}
                      {po.status === 'ARRIVED' && (
                        <div className="flex flex-col items-end">
                           <span className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 text-[10px] font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 border border-green-200 dark:border-green-900/50 uppercase tracking-wider shadow-sm">
                             <CheckCircle className="w-3.5 h-3.5" /> Confirmado pela Portaria
                           </span>
                           <span className="text-[10px] text-green-500 font-bold mt-1.5 flex items-center gap-1">
                              <MapPin className="w-3 h-3" /> Material fisicamente na empresa
                           </span>
                        </div>
                      )}
                   </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 mb-4 border border-gray-100 dark:border-gray-600 shadow-inner">
                   <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase mb-3 tracking-widest">Itens do Pedido</p>
                   <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-2">
                      {po.items.map(item => (
                        <li key={item.id} className="flex justify-between items-center border-b border-gray-200/50 dark:border-gray-600/50 last:border-0 pb-1.5 last:pb-0">
                           <span className="font-medium">{item.name}</span>
                           <span className="font-mono text-gray-500 dark:text-gray-400 font-bold bg-white dark:bg-gray-800 px-2 rounded border border-gray-100 dark:border-gray-700">{item.quantity} {item.unit}</span>
                        </li>
                      ))}
                   </ul>
                </div>

                {po.status === 'ORDERED' && (
                  <div className="flex justify-end pt-2">
                     <button 
                       onClick={() => updatePurchaseStatus(po.id, 'ARRIVED')}
                       className="bg-gray-800 dark:bg-gray-700 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-gray-900 transition flex items-center gap-2 shadow-lg shadow-gray-500/20"
                     >
                       <Truck className="w-4 h-4" /> Marcar Chegada Manual
                     </button>
                  </div>
                )}
                
                {po.status === 'ARRIVED' && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 p-3 rounded-xl text-xs text-center border border-blue-100 dark:border-blue-900/30 flex items-center justify-center gap-2 font-medium">
                     <Clock className="w-4 h-4 animate-spin-slow" />
                     Aguardando conferência do Almoxarifado para baixa final no estoque.
                  </div>
                )}
             </div>
           ))}
        </div>
      )}
      
      <style>{`
        @keyframes pulse-subtle {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.95; border-color: rgba(34, 197, 94, 0.5); }
        }
        .animate-pulse-subtle {
          animation: pulse-subtle 3s infinite ease-in-out;
        }
        .animate-spin-slow {
          animation: spin 3s linear infinite;
        }
      `}</style>
    </div>
  );

  const renderHistory = () => (
    <div className="space-y-4">
       <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
        <FileText className="w-6 h-6 text-gray-600 dark:text-gray-400" />
        Histórico de Compras Finalizadas
      </h3>
      
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <table className="w-full text-left text-sm">
           <thead className="bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400 font-medium border-b border-gray-200 dark:border-gray-600">
             <tr>
               <th className="p-3">Data Compra</th>
               <th className="p-3">Pedido / NF</th>
               <th className="p-3">Fornecedor</th>
               <th className="p-3">Itens</th>
               <th className="p-3">Baixa em</th>
               <th className="p-3 text-right">Status</th>
             </tr>
           </thead>
           <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
             {historyOrders.length === 0 && (
               <tr><td colSpan={6} className="p-4 text-center text-gray-400 dark:text-gray-500">Nenhum histórico disponível.</td></tr>
             )}
             {historyOrders.map(po => (
               <tr key={po.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="p-3 text-gray-600 dark:text-gray-400">{new Date(po.purchaseDate).toLocaleDateString()}</td>
                  <td className="p-3">
                     <div className="font-bold text-gray-800 dark:text-gray-200">#{po.orderNumber}</div>
                     {po.invoiceNumber && <div className="text-xs text-gray-500 dark:text-gray-400">NF: {po.invoiceNumber}</div>}
                  </td>
                  <td className="p-3 text-gray-700 dark:text-gray-300">{po.supplier}</td>
                  <td className="p-3 text-gray-600 dark:text-gray-400">
                     {po.items.length} itens 
                     <span className="text-xs text-gray-400 dark:text-gray-500 block truncate max-w-[150px]">{po.items.map(i => i.name).join(', ')}</span>
                  </td>
                  <td className="p-3 text-gray-600 dark:text-gray-400 text-xs">
                     {po.completionDate ? new Date(po.completionDate).toLocaleDateString() : '-'}
                  </td>
                  <td className="p-3 text-right">
                     <span className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs font-bold px-2 py-1 rounded-full">Baixado</span>
                  </td>
               </tr>
             ))}
           </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="p-6">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
          <ShoppingBag className="w-6 h-6 text-rose-600 dark:text-rose-400" />
          Gestão de Compras
        </h2>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Registro, acompanhamento e histórico de pedidos.</p>
      </div>

      <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
        <button onClick={() => setActiveTab('NEW')} className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'NEW' ? 'border-rose-500 text-rose-600 dark:text-rose-400' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}>
          <Plus className="w-4 h-4" /> Novo Pedido
        </button>
        <button onClick={() => setActiveTab('TRACKING')} className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'TRACKING' ? 'border-rose-500 text-rose-600 dark:text-rose-400' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}>
          <Truck className="w-4 h-4" /> Acompanhamento
          {activeOrders.length > 0 && <span className="bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 text-xs px-2 py-0.5 rounded-full">{activeOrders.length}</span>}
        </button>
        <button onClick={() => setActiveTab('HISTORY')} className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'HISTORY' ? 'border-rose-500 text-rose-600 dark:text-rose-400' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}>
          <FileText className="w-4 h-4" /> Histórico
        </button>
      </div>

      {activeTab === 'NEW' && renderNewOrder()}
      {activeTab === 'TRACKING' && renderTracking()}
      {activeTab === 'HISTORY' && renderHistory()}
    </div>
  );
};