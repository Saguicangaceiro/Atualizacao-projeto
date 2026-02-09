import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { Box, Plus, Tag, Hash, Building, User as UserIcon, History, Clock, CheckCircle, XCircle, ArrowLeft, Phone, PhoneCall, Search, Save, ShieldAlert, Wrench, MessageSquare, PlusCircle, Monitor, Camera } from 'lucide-react';
import { User, SupportTicketStatus } from '../types';

interface UserPanelProps {
  currentUser: User;
  onBack?: () => void;
}

export const UserPanel: React.FC<UserPanelProps> = ({ currentUser, onBack }) => {
  const { addResourceRequest, resourceRequests, sectors, extensions, users, updateUserExtension, addSupportTicket, supportTickets, updateUserProfileImage } = useApp();
  const [activeTab, setActiveTab] = useState<'NEW' | 'MAINTENANCE_REQUEST' | 'IT_REQUEST' | 'HISTORY' | 'DIRECTORY' | 'MY_PROFILE'>('NEW');
  const [phoneSearch, setPhoneSearch] = useState('');

  // Personal Extension Form
  const [myExtension, setMyExtension] = useState(currentUser.extension || '');
  
  // Profile Image State
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Resource Form State
  const [resItemName, setResItemName] = useState('');
  const [resQuantity, setResQuantity] = useState('');
  const [resBrand, setResBrand] = useState('');

  // Support Ticket Form State
  const [ticketTitle, setTicketTitle] = useState('');
  const [ticketDescription, setTicketDescription] = useState('');
  
  // Encontra o setor do usuário logado para pré-preencher
  const userSector = sectors.find(s => s.id === currentUser.sectorId);
  const [resSector, setResSector] = useState(userSector?.name || (sectors.length > 0 ? sectors[0].name : 'Geral'));
  const [resCostCenter, setResCostCenter] = useState(userSector?.costCenter || (sectors.length > 0 ? sectors[0].costCenter : '0000'));

  // Atualiza quando os setores carregarem ou o usuário mudar
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
    
    setResItemName('');
    setResQuantity('');
    setResBrand('');
    setActiveTab('HISTORY');
    alert('Solicitação enviada com sucesso ao almoxarifado.');
  };

  const handleCreateSupportTicket = (category: 'MAINTENANCE' | 'IT') => (e: React.FormEvent) => {
    e.preventDefault();
    addSupportTicket({
      category,
      title: ticketTitle,
      description: ticketDescription,
      requesterId: currentUser.id,
      requesterName: currentUser.name,
      sector: resSector
    });
    
    setTicketTitle('');
    setTicketDescription('');
    setActiveTab('HISTORY');
    alert(`Chamado de ${category === 'IT' ? 'TI' : 'Manutenção'} aberto com sucesso!`);
  };

  const handleUpdateMyExtension = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentUser.role === 'SUPER_ADMIN') return;
    updateUserExtension(currentUser.id, myExtension);
    alert('Seu ramal foi atualizado com sucesso!');
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        updateUserProfileImage(currentUser.id, reader.result as string);
        alert('Foto de perfil atualizada!');
      };
      reader.readAsDataURL(file);
    }
  };

  // Filter and build directory items
  // Fix: Add profileImage property as undefined to extensions to resolve TS union type errors in directory list mapping
  const directoryItems = [
    ...users.filter(u => u.extension && u.role !== 'SUPER_ADMIN').map(u => ({ 
      id: u.id, 
      name: u.name, 
      number: u.extension!, 
      sector: sectors.find(s => s.id === u.sectorId)?.name || 'Colaborador', 
      isUser: true,
      profileImage: u.profileImage 
    })),
    ...extensions.map(e => ({ ...e, isUser: false, profileImage: undefined }))
  ];

  const filteredExtensions = directoryItems.filter(item => 
    (item.name || '').toLowerCase().includes(phoneSearch.toLowerCase()) || 
    (item.number || '').includes(phoneSearch) ||
    (item.sector || '').toLowerCase().includes(phoneSearch.toLowerCase())
  ).sort((a,b) => (a.name || '').localeCompare(b.name || ''));

  const myResourceRequests = resourceRequests
    .filter(req => req.requesterName === currentUser.name)
    .sort((a, b) => b.createdAt - a.createdAt);

  const mySupportTickets = supportTickets
    .filter(t => t.requesterId === currentUser.id)
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
          <p className="text-gray-500 dark:text-gray-400 mt-1">Bem-vindo, {currentUser.name}. Gerencie suas solicitações.</p>
        </div>
      </div>

      <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6 overflow-x-auto scrollbar-hide">
        <button onClick={() => setActiveTab('NEW')} className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${activeTab === 'NEW' ? 'border-teal-500 text-teal-600 dark:text-teal-400' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
          <Plus className="w-4 h-4" /> Solicitar Recurso
        </button>
        <button onClick={() => setActiveTab('MAINTENANCE_REQUEST')} className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${activeTab === 'MAINTENANCE_REQUEST' ? 'border-teal-500 text-teal-600 dark:text-teal-400' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
          <Wrench className="w-4 h-4" /> Suporte Manutenção
        </button>
        <button onClick={() => setActiveTab('IT_REQUEST')} className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${activeTab === 'IT_REQUEST' ? 'border-teal-500 text-teal-600 dark:text-teal-400' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
          <Monitor className="w-4 h-4" /> Suporte TI
        </button>
        <button onClick={() => setActiveTab('HISTORY')} className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${activeTab === 'HISTORY' ? 'border-teal-500 text-teal-600 dark:text-teal-400' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
          <History className="w-4 h-4" /> Meus Pedidos
        </button>
        <button onClick={() => setActiveTab('DIRECTORY')} className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${activeTab === 'DIRECTORY' ? 'border-teal-50 text-teal-600 dark:text-teal-400' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
          <Phone className="w-4 h-4" /> Ramais
        </button>
        <button onClick={() => setActiveTab('MY_PROFILE')} className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${activeTab === 'MY_PROFILE' ? 'border-teal-500 text-teal-600 dark:text-teal-400' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
          <UserIcon className="w-4 h-4" /> Perfil
        </button>
      </div>

      {activeTab === 'NEW' && (
        <div className="max-w-2xl bg-white dark:bg-gray-800 p-8 rounded-xl shadow-md border border-gray-100 dark:border-gray-700">
          <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-6 border-l-4 border-teal-500 pl-3">
             Requisição de Recurso
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
                  {sectors.length > 0 ? sectors.map(sector => <option key={sector.id} value={sector.name}>{sector.name}</option>) : <option value="Geral">Geral</option>}
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

      {activeTab === 'MAINTENANCE_REQUEST' && (
        <div className="max-w-2xl bg-white dark:bg-gray-800 p-8 rounded-xl shadow-md border border-gray-100 dark:border-gray-700">
           <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-6 border-l-4 border-blue-500 pl-3 flex items-center gap-2">
              <Wrench className="w-5 h-5 text-blue-500" /> Suporte de Manutenção Predial
           </h3>
           <form onSubmit={handleCreateSupportTicket('MAINTENANCE')} className="space-y-5">
              <div>
                 <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Assunto</label>
                 <input required type="text" placeholder="Ex: Goteira, Lâmpada, Mobiliário..." className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-3 outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 dark:text-white" value={ticketTitle} onChange={e => setTicketTitle(e.target.value)} />
              </div>
              <div>
                 <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Descrição</label>
                 <textarea required rows={5} placeholder="O que está acontecendo?" className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-3 outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 dark:text-white" value={ticketDescription} onChange={e => setTicketDescription(e.target.value)} />
              </div>
              <button type="submit" className="w-full py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition font-bold text-lg flex items-center justify-center gap-2">
                 <PlusCircle className="w-5 h-5" /> Abrir Chamado
              </button>
           </form>
        </div>
      )}

      {activeTab === 'IT_REQUEST' && (
        <div className="max-w-2xl bg-white dark:bg-gray-800 p-8 rounded-xl shadow-md border border-gray-100 dark:border-gray-700">
           <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-6 border-l-4 border-indigo-500 pl-3 flex items-center gap-2">
              <Monitor className="w-5 h-5 text-indigo-500" /> Suporte de Tecnologia (TI)
           </h3>
           <form onSubmit={handleCreateSupportTicket('IT')} className="space-y-5">
              <div>
                 <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Assunto / Problema</label>
                 <input required type="text" placeholder="Ex: Computador não liga, Sem Internet, Acesso ao Sistema..." className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-3 outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 dark:text-white" value={ticketTitle} onChange={e => setTicketTitle(e.target.value)} />
              </div>
              <div>
                 <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Descrição Detalhada</label>
                 <textarea required rows={5} placeholder="Informe detalhes do erro, número do patrimônio do PC ou sistema..." className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-3 outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 dark:text-white" value={ticketDescription} onChange={e => setTicketDescription(e.target.value)} />
              </div>
              <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-xl text-xs text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800">
                O time de TI analisará seu pedido prioritariamente. Mantenha seu ramal atualizado.
              </div>
              <button type="submit" className="w-full py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition font-bold text-lg flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20">
                 <PlusCircle className="w-5 h-5" /> Solicitar Suporte TI
              </button>
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
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-400 shrink-0 border border-gray-200 dark:border-gray-600 overflow-hidden">
                       {item.profileImage ? (
                         <img src={item.profileImage} className="w-full h-full object-cover" alt="" />
                       ) : (
                         <UserIcon className="w-4 h-4" />
                       )}
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-800 dark:text-gray-100 text-sm leading-tight">{item.name}</h4>
                      <span className="text-[10px] text-gray-400 flex items-center gap-1 uppercase tracking-wider mt-0.5"><Building className="w-2.5 h-2.5" /> {item.sector}</span>
                    </div>
                  </div>
                  <span className="text-lg font-mono font-bold text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/20 px-3 py-1 rounded-lg">{item.number}</span>
               </div>
             ))}
             {filteredExtensions.length === 0 && (
               <div className="col-span-full py-12 text-center text-gray-400 italic">Nenhum ramal encontrado para esta busca.</div>
             )}
           </div>
        </div>
      )}

      {activeTab === 'MY_PROFILE' && (
        <div className="max-w-md bg-white dark:bg-gray-800 p-8 rounded-xl shadow-md border border-gray-100 dark:border-gray-700">
           <h3 className="text-lg font-bold mb-6 flex items-center gap-2"><UserIcon className="w-5 h-5 text-teal-600" /> Seus Dados</h3>
           
           {/* Perfil Image Upload Section */}
           <div className="flex flex-col items-center gap-4 mb-8 p-4 bg-gray-50 dark:bg-gray-700/30 rounded-2xl border border-dashed border-gray-200 dark:border-gray-600">
              <div className="relative">
                 <div className="w-32 h-32 rounded-full bg-white dark:bg-gray-800 border-4 border-white dark:border-gray-800 shadow-lg overflow-hidden flex items-center justify-center text-gray-300">
                    {currentUser.profileImage ? (
                      <img src={currentUser.profileImage} className="w-full h-full object-cover" alt="Perfil" />
                    ) : (
                      <UserIcon className="w-16 h-16" />
                    )}
                 </div>
                 <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-0 right-0 bg-teal-600 text-white p-2.5 rounded-full shadow-xl hover:bg-teal-700 transition active:scale-90"
                 >
                    <Camera className="w-5 h-5" />
                 </button>
              </div>
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageChange} />
              <div className="text-center">
                 <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Alterar Foto de Perfil</p>
                 <p className="text-[10px] text-gray-400 mt-1">Formatos: JPG, PNG. Máx: 2MB.</p>
              </div>
           </div>

           <form onSubmit={handleUpdateMyExtension} className="space-y-4">
              <div>
                 <label className="block text-sm font-medium text-gray-500 mb-1">Nome</label>
                 <input disabled className="w-full p-2.5 bg-gray-50 dark:bg-gray-700 text-gray-400 rounded-lg border border-gray-200 dark:border-gray-600 cursor-not-allowed" value={currentUser.name} />
              </div>
              <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Seu Ramal Pessoal</label>
                  <div className="relative">
                    <PhoneCall className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                    <input type="text" className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg outline-none focus:ring-2 focus:ring-teal-500 bg-white dark:bg-gray-800" placeholder="Ex: 501" value={myExtension} onChange={e => setMyExtension(e.target.value)} />
                  </div>
              </div>
              <button type="submit" className="w-full flex items-center justify-center gap-2 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition font-bold shadow-md"><Save className="w-4 h-4" /> Salvar Ramal</button>
           </form>
        </div>
      )}

      {activeTab === 'HISTORY' && (
        <div className="space-y-8 max-w-4xl">
           <div>
              <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">Chamados de Suporte</h3>
              <div className="grid gap-3">
                  {mySupportTickets.map(ticket => (
                    <div key={ticket.id} className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex justify-between items-center group hover:border-blue-300 transition-colors">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                           <span className={`text-[9px] font-black px-1.5 py-0.5 rounded border ${ticket.category === 'IT' ? 'bg-indigo-50 text-indigo-600 border-indigo-200' : 'bg-blue-50 text-blue-600 border-blue-200'}`}>
                             {ticket.category}
                           </span>
                           <h4 className="font-bold text-gray-800 dark:text-gray-100">{ticket.title}</h4>
                        </div>
                        <p className="text-xs text-gray-500 mt-1 line-clamp-1">"{ticket.description}"</p>
                        <p className="text-[10px] text-gray-400 mt-1 uppercase font-bold">{new Date(ticket.createdAt).toLocaleDateString()}</p>
                      </div>
                      <div className="text-right">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter border ${
                          ticket.status === SupportTicketStatus.APPROVED ? 'bg-green-50 text-green-700 border-green-200' :
                          ticket.status === SupportTicketStatus.REJECTED ? 'bg-red-50 text-red-700 border-red-200' :
                          'bg-yellow-50 text-yellow-700 border-yellow-200'}`}>
                          {ticket.status}
                        </span>
                      </div>
                    </div>
                  ))}
                  {mySupportTickets.length === 0 && <p className="text-sm text-gray-400 italic">Nenhum chamado aberto.</p>}
              </div>
           </div>
        </div>
      )}
    </div>
  );
};