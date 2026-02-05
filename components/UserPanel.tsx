import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Box, Plus, Tag, Hash, Building, User as UserIcon, History, Clock, CheckCircle, XCircle, ArrowLeft, Phone, PhoneCall, Search, Save, ShieldAlert } from 'lucide-react';
import { User } from '../types';

interface UserPanelProps {
  currentUser: User;
  onBack?: () => void;
}

export const UserPanel: React.FC<UserPanelProps> = ({ currentUser, onBack }) => {
  const { addResourceRequest, resourceRequests, sectors, extensions, users, updateUserExtension } = useApp();
  const [activeTab, setActiveTab] = useState<'NEW' | 'HISTORY' | 'DIRECTORY' | 'MY_PROFILE'>('NEW');
  const [phoneSearch, setPhoneSearch] = useState('');

  // Personal Extension Form
  const [myExtension, setMyExtension] = useState(currentUser.extension || '');

  // Resource Form State
  const [resItemName, setResItemName] = useState('');
  const [resQuantity, setResQuantity] = useState('');
  const [resBrand, setResBrand] = useState('');
  
  // Encontra o setor do usuário logado para pré-preencher
  const userSector = sectors.find(s => s.id === currentUser.sectorId);
  const [resSector, setResSector] = useState(userSector?.name || '');
  const [resCostCenter, setResCostCenter] = useState(userSector?.costCenter || '');

  // Atualiza quando os setores carregarem ou o usuário mudar
  useEffect(() => {
    if (userSector) {
      setResSector(userSector.name);
      setResCostCenter(userSector.costCenter);
    } else if (sectors.length > 0 && !resSector) {
      setResSector(sectors[0].name);
      // Fix: changed undefined foundSector to sectors[0]
      setResCostCenter(sectors[0].costCenter);
    }
  }, [sectors, userSector, resSector]);

  const handleSectorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedName = e.target.value;
    setResSector(selectedName);
    const foundSector = sectors.find(s => s.name === selectedName);
    if (foundSector) {
      setResCostCenter(foundSector.costCenter);
    }
  };

  const handleCreateResourceRequest = (e: React.FormEvent) => {
    e.preventDefault();
    addResourceRequest({
      itemName: resItemName,
      quantity: Number(resQuantity),
      brand: resBrand,
      sector: resSector,
      costCenter: resCostCenter,
      requesterName: currentUser.name
    });
    
    // Reset and feedback
    setResItemName('');
    setResQuantity('');
    setResBrand('');
    setActiveTab('HISTORY');
    alert('Solicitação enviada com sucesso ao almoxarifado.');
  };

  const handleUpdateMyExtension = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentUser.role === 'SUPER_ADMIN') return;
    updateUserExtension(currentUser.id, myExtension);
    alert('Seu ramal foi atualizado com sucesso!');
  };

  // Filter out SUPER_ADMIN role from the directory
  const filteredExtensions = [
    ...users.filter(u => u.extension && u.role !== 'SUPER_ADMIN').map(u => ({ id: u.id, name: u.name, number: u.extension!, sector: 'Colaborador', isUser: true })),
    ...extensions.map(e => ({ ...e, isUser: false }))
  ].filter(item => 
    item.name.toLowerCase().includes(phoneSearch.toLowerCase()) || 
    item.number.includes(phoneSearch) ||
    item.sector.toLowerCase().includes(phoneSearch.toLowerCase())
  ).sort((a,b) => a.name.localeCompare(b.name));

  const myRequests = resourceRequests
    .filter(req => req.requesterName === currentUser.name)
    .sort((a, b) => b.createdAt - a.createdAt);

  return (
    <div className="p-6">
      <div className="mb-8 flex items-center gap-4">
        {onBack && (
          <button onClick={onBack} className="p-2 rounded-full border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-500 transition shadow-sm">
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
            <Box className="w-6 h-6 text-teal-600 dark:text-teal-400" />
            Portal do Colaborador
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Bem-vindo, {currentUser.name}. Gerencie suas solicitações e ramais.</p>
        </div>
      </div>

      <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6 overflow-x-auto scrollbar-hide">
        <button onClick={() => setActiveTab('NEW')} className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${activeTab === 'NEW' ? 'border-teal-500 text-teal-600 dark:text-teal-400' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
          <Plus className="w-4 h-4" /> Solicitar Recurso
        </button>
        <button onClick={() => setActiveTab('HISTORY')} className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${activeTab === 'HISTORY' ? 'border-teal-500 text-teal-600 dark:text-teal-400' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
          <History className="w-4 h-4" /> Meus Pedidos
        </button>
        <button onClick={() => setActiveTab('DIRECTORY')} className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${activeTab === 'DIRECTORY' ? 'border-teal-500 text-teal-600 dark:text-teal-400' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
          <Phone className="w-4 h-4" /> Guia de Ramais
        </button>
        <button onClick={() => setActiveTab('MY_PROFILE')} className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${activeTab === 'MY_PROFILE' ? 'border-teal-500 text-teal-600 dark:text-teal-400' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
          <UserIcon className="w-4 h-4" /> Meu Perfil
        </button>
      </div>

      {activeTab === 'NEW' && (
        <div className="max-w-2xl bg-white dark:bg-gray-800 p-8 rounded-xl shadow-md border border-gray-100 dark:border-gray-700">
          <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-6 border-l-4 border-teal-500 pl-3">
             Formulário de Requisição de Recurso
          </h3>
          <form onSubmit={handleCreateResourceRequest} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
               <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Item Solicitado</label>
                  <input required type="text" className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2.5 outline-none bg-white dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-teal-500" placeholder="Ex: Cadeira Ergonômica" value={resItemName} onChange={e => setResItemName(e.target.value)} />
               </div>
               <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Quantidade</label>
                  <input required type="number" min="1" className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2.5 outline-none bg-white dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-teal-500" value={resQuantity} onChange={e => setResQuantity(e.target.value)} />
               </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1"><Tag className="w-3 h-3" /> Marca / Detalhe</label>
                <input required type="text" className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2.5 outline-none bg-white dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-teal-500" placeholder="Ex: Modelo Standard" value={resBrand} onChange={e => setResBrand(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1"><Building className="w-3 h-3" /> Seu Setor</label>
                <select className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2.5 outline-none bg-white dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-teal-500" value={resSector} onChange={handleSectorChange}>
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
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1"><UserIcon className="w-3 h-3" /> Solicitante</label>
                <input readOnly className="w-full border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-600 text-gray-600 dark:text-gray-300 rounded-lg p-2.5 cursor-not-allowed" value={currentUser.name} />
              </div>
            </div>

            <button type="submit" className="w-full py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 shadow-sm transition font-bold text-lg mt-4">Enviar Solicitação</button>
          </form>
        </div>
      )}

      {activeTab === 'DIRECTORY' && (
        <div className="space-y-6">
           <div className="relative max-w-md">
              <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input type="text" className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl outline-none focus:ring-2 focus:ring-teal-500 bg-white dark:bg-gray-800 transition" placeholder="Buscar por nome, setor ou ramal..." value={phoneSearch} onChange={e => setPhoneSearch(e.target.value)} />
           </div>
           
           <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
             {filteredExtensions.map((item, idx) => (
               <div key={`${item.id}-${idx}`} className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex justify-between items-center group hover:border-teal-400 transition-colors">
                  <div>
                    <h4 className="font-bold text-gray-800 dark:text-gray-100">{item.name}</h4>
                    <span className="text-xs text-gray-400 flex items-center gap-1 uppercase tracking-wider mt-0.5">
                       <Building className="w-3 h-3" /> {item.sector}
                    </span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-xl font-mono font-bold text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/20 px-3 py-1 rounded-lg">
                       {item.number}
                    </span>
                    {item.isUser && <span className="text-[9px] text-teal-600/60 dark:text-teal-400/60 font-bold uppercase mt-1">Colaborador</span>}
                  </div>
               </div>
             ))}
             {filteredExtensions.length === 0 && (
               <div className="col-span-full text-center py-12 text-gray-400">Nenhum ramal encontrado para sua busca.</div>
             )}
           </div>
        </div>
      )}

      {activeTab === 'MY_PROFILE' && (
        <div className="max-w-md bg-white dark:bg-gray-800 p-8 rounded-xl shadow-md border border-gray-100 dark:border-gray-700 mx-auto lg:mx-0">
           <h3 className="text-lg font-bold mb-6 flex items-center gap-2"><UserIcon className="w-5 h-5 text-teal-600" /> Seus Dados</h3>
           <div className="space-y-6">
              <div>
                 <label className="block text-sm font-medium text-gray-500 mb-1">Nome</label>
                 <input disabled className="w-full p-2.5 bg-gray-50 dark:bg-gray-700 text-gray-400 rounded-lg border border-gray-200 dark:border-gray-600 cursor-not-allowed" value={currentUser.name} />
              </div>
              
              {currentUser.role === 'SUPER_ADMIN' ? (
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-4 rounded-xl flex gap-3 items-start">
                  <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-800 dark:text-amber-300 font-medium leading-relaxed">
                    Como <strong>Super Administrador</strong>, sua conta é de nível mestre e não possui ramal associado para manter a privacidade e segurança do sistema.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleUpdateMyExtension} className="space-y-4">
                  <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Seu Ramal Pessoal</label>
                      <div className="relative">
                        <PhoneCall className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                        <input type="text" className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg outline-none focus:ring-2 focus:ring-teal-500 bg-white dark:bg-gray-800" placeholder="Ex: 501" value={myExtension} onChange={e => setMyExtension(e.target.value)} />
                      </div>
                      <p className="text-[10px] text-gray-400 mt-2">Este número será visível para todos no Guia de Ramais.</p>
                  </div>
                  <button type="submit" className="w-full flex items-center justify-center gap-2 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition font-bold shadow-md"><Save className="w-4 h-4" /> Salvar Ramal</button>
                </form>
              )}
           </div>
        </div>
      )}

      {activeTab === 'HISTORY' && (
        <div className="space-y-4 max-w-4xl">
           {myRequests.length === 0 ? (
             <div className="text-center py-12 text-gray-400">Você ainda não realizou solicitações.</div>
           ) : (
             myRequests.map(req => (
                <div key={req.id} className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex justify-between items-center hover:shadow-md transition-shadow">
                   <div>
                      <h4 className="font-bold text-gray-800 dark:text-gray-100">{req.itemName}</h4>
                      <p className="text-sm text-gray-500">{req.brand} • {req.quantity} unidade(s)</p>
                      <p className="text-[10px] text-gray-400 mt-1">Solicitado em: {new Date(req.createdAt).toLocaleDateString()}</p>
                   </div>
                   <div className="text-right">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      req.status === 'LIBERADO' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : 
                      req.status === 'REJEITADO' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' :
                      'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300'}`}>
                      {req.status}
                    </span>
                   </div>
                </div>
             ))
           )}
        </div>
      )}
    </div>
  );
};
