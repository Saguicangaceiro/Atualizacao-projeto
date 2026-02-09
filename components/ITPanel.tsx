import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Monitor, MessageCircle, User as UserIcon, Building, CheckCircle, XCircle, Search, Clock, ShieldAlert, History, Laptop, Network, Server, ArrowLeft } from 'lucide-react';
import { SupportTicketStatus, User } from '../types';

interface ITPanelProps {
  currentUser: User;
}

export const ITPanel: React.FC<ITPanelProps> = ({ currentUser }) => {
  const { supportTickets, processSupportTicket } = useApp();
  const [activeTab, setActiveTab] = useState<'PENDING' | 'RESOLVED'>('PENDING');
  const [searchTerm, setSearchTerm] = useState('');

  // Filtra chamados apenas da categoria IT
  const itTickets = supportTickets.filter(t => t.category === 'IT');
  
  const pendingTickets = itTickets.filter(t => t.status === SupportTicketStatus.PENDING && 
    (t.title.toLowerCase().includes(searchTerm.toLowerCase()) || t.requesterName.toLowerCase().includes(searchTerm.toLowerCase())));
    
  const resolvedTickets = itTickets.filter(t => t.status !== SupportTicketStatus.PENDING);

  return (
    <div className="p-6">
      <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
            <Monitor className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
            Centro de Suporte TI
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Triagem e resolução de chamados tecnológicos.</p>
        </div>
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
          <input 
            type="text" 
            placeholder="Buscar chamado ou usuário..." 
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="flex border-b border-gray-200 dark:border-gray-700 mb-8 overflow-x-auto scrollbar-hide">
        <button 
          onClick={() => setActiveTab('PENDING')} 
          className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${activeTab === 'PENDING' ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
          <Clock className="w-4 h-4" /> Chamados Pendentes
          {pendingTickets.length > 0 && (
            <span className="bg-indigo-100 text-indigo-700 text-[10px] px-2 py-0.5 rounded-full animate-pulse">
              {pendingTickets.length}
            </span>
          )}
        </button>
        <button 
          onClick={() => setActiveTab('RESOLVED')} 
          className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${activeTab === 'RESOLVED' ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
          <History className="w-4 h-4" /> Histórico de Resoluções
        </button>
      </div>

      {activeTab === 'PENDING' ? (
        pendingTickets.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
            <Monitor className="w-16 h-16 text-gray-200 dark:text-gray-700 mx-auto mb-4" />
            <p className="text-gray-400 font-medium">Tudo em ordem! Nenhum chamado de TI pendente.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pendingTickets.map(ticket => (
              <div key={ticket.id} className="bg-white dark:bg-gray-800 rounded-2xl border-2 border-indigo-50 dark:border-indigo-900/20 shadow-sm hover:shadow-md transition flex flex-col overflow-hidden">
                <div className="p-4 border-b bg-gray-50/50 dark:bg-gray-900/40 flex justify-between items-center">
                   <div className="flex gap-2">
                      <Laptop className="w-4 h-4 text-indigo-500" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400">Suporte Técnico</span>
                   </div>
                   <span className="text-[10px] text-gray-400 font-bold">{new Date(ticket.createdAt).toLocaleDateString()}</span>
                </div>
                
                <div className="p-6 flex-1 flex flex-col">
                  <h4 className="text-lg font-bold text-gray-800 dark:text-white mb-2 leading-tight">{ticket.title}</h4>
                  <div className="flex items-center gap-3 mb-4 text-xs text-gray-500 bg-gray-50 dark:bg-gray-900/30 p-2 rounded-lg">
                    <UserIcon className="w-3.5 h-3.5" /> <span className="font-bold">{ticket.requesterName}</span>
                    <span className="text-gray-300">|</span>
                    <Building className="w-3.5 h-3.5" /> {ticket.sector}
                  </div>
                  
                  <div className="flex-1 bg-gray-50 dark:bg-gray-900/40 p-3 rounded-xl mb-6 border border-gray-100 dark:border-gray-800">
                    <p className="text-sm text-gray-600 dark:text-gray-300 italic">"{ticket.description}"</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 mt-auto">
                     <button 
                       onClick={() => processSupportTicket(ticket.id, false)}
                       className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-bold py-2.5 rounded-xl text-sm hover:bg-red-100 transition border border-red-100 dark:border-red-900/30"
                     >
                       Rejeitar
                     </button>
                     <button 
                       onClick={() => processSupportTicket(ticket.id, true)}
                       className="bg-indigo-600 text-white font-bold py-2.5 rounded-xl text-sm hover:bg-indigo-700 shadow-lg shadow-indigo-600/30 transition flex items-center justify-center gap-2"
                     >
                       <CheckCircle className="w-4 h-4" /> Resolver
                     </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
           <table className="w-full text-left text-sm">
             <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-700">
                <tr>
                   <th className="p-4 font-bold uppercase text-[10px] tracking-wider">Data</th>
                   <th className="p-4 font-bold uppercase text-[10px] tracking-wider">Assunto</th>
                   <th className="p-4 font-bold uppercase text-[10px] tracking-wider">Usuário</th>
                   <th className="p-4 font-bold uppercase text-[10px] tracking-wider text-right">Status Final</th>
                </tr>
             </thead>
             <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {resolvedTickets.sort((a,b) => b.createdAt - a.createdAt).map(ticket => (
                   <tr key={ticket.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                      <td className="p-4 text-gray-500 font-mono text-xs">{new Date(ticket.createdAt).toLocaleDateString()}</td>
                      <td className="p-4">
                        <div className="font-bold text-gray-800 dark:text-gray-100">{ticket.title}</div>
                        <div className="text-[10px] text-gray-400 truncate max-w-[200px]">{ticket.description}</div>
                      </td>
                      <td className="p-4 text-gray-600 dark:text-gray-400">{ticket.requesterName}</td>
                      <td className="p-4 text-right">
                         <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter border ${
                            ticket.status === SupportTicketStatus.APPROVED ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'
                         }`}>
                            {ticket.status}
                         </span>
                      </td>
                   </tr>
                ))}
                {resolvedTickets.length === 0 && (
                   <tr>
                      <td colSpan={4} className="p-12 text-center text-gray-400 italic">Nenhum chamado resolvido no histórico.</td>
                   </tr>
                )}
             </tbody>
           </table>
        </div>
      )}

      {/* IT Stats Cards (Informational Only) */}
      <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="bg-indigo-50 dark:bg-indigo-900/20 p-6 rounded-2xl border border-indigo-100 dark:border-indigo-800 flex items-center gap-4">
            <div className="p-3 bg-white dark:bg-indigo-800 rounded-xl shadow-sm"><Laptop className="w-6 h-6 text-indigo-600 dark:text-indigo-300" /></div>
            <div>
               <p className="text-xs font-bold text-indigo-700 dark:text-indigo-400 uppercase">Equipamentos</p>
               <p className="text-xl font-black text-indigo-900 dark:text-white">Gerenciados</p>
            </div>
         </div>
         <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-2xl border border-blue-100 dark:border-blue-800 flex items-center gap-4">
            <div className="p-3 bg-white dark:bg-blue-800 rounded-xl shadow-sm"><Network className="w-6 h-6 text-blue-600 dark:text-blue-300" /></div>
            <div>
               <p className="text-xs font-bold text-blue-700 dark:text-blue-400 uppercase">Rede Local</p>
               <p className="text-xl font-black text-blue-900 dark:text-white">Estável</p>
            </div>
         </div>
         <div className="bg-purple-50 dark:bg-purple-900/20 p-6 rounded-2xl border border-purple-100 dark:border-purple-800 flex items-center gap-4">
            <div className="p-3 bg-white dark:bg-purple-800 rounded-xl shadow-sm"><Server className="w-6 h-6 text-purple-600 dark:text-purple-300" /></div>
            <div>
               <p className="text-xs font-bold text-purple-700 dark:text-purple-400 uppercase">Servidores</p>
               <p className="text-xl font-black text-purple-900 dark:text-white">Online</p>
            </div>
         </div>
      </div>
    </div>
  );
};