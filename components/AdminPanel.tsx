import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Users, UserPlus, Trash2, Shield, Key, Lock, Crown, Building, Hash, Plus, Pencil, CheckSquare, Square, Phone, PhoneForwarded, PlusCircle, ShieldAlert, Eye, EyeOff, Save, X, User as UserIcon, MapPin } from 'lucide-react';
import { UserRole, User, Sector, Extension } from '../types';

interface AdminPanelProps {
  currentUser: User;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ currentUser }) => {
  const { users, addUser, removeUser, updateUserPassword, sectors, addSector, removeSector, updateSector, extensions, addExtension, removeExtension, updateExtension, updateUserExtension } = useApp();
  const [activeTab, setActiveTab] = useState<'USERS' | 'SECTORS' | 'EXTENSIONS' | 'PASSWORDS'>('USERS');
  
  // User Form State
  const [newName, setNewName] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('MAINTENANCE');
  const [newHasPortalAccess, setNewHasPortalAccess] = useState(false);
  const [newUserExtension, setNewUserExtension] = useState('');
  const [newUserSectorId, setNewUserSectorId] = useState('');

  // Password Management State
  const [selectedUserForPass, setSelectedUserForPass] = useState<User | null>(null);
  const [newPassValue, setNewPassValue] = useState('');
  const [showPass, setShowPass] = useState(false);

  // Sector Form State
  const [newSectorName, setNewSectorName] = useState('');
  const [newCostCenter, setNewCostCenter] = useState('');

  // Editing Sector State
  const [editingSector, setEditingSector] = useState<Sector | null>(null);
  const [editSectorName, setEditSectorName] = useState('');
  const [editCostCenter, setEditCostCenter] = useState('');

  // Unified Extension Management State
  const [extType, setExtType] = useState<'FIXED' | 'USER'>('FIXED');
  const [extName, setExtName] = useState('');
  const [extNumber, setExtNumber] = useState('');
  const [extSector, setExtSector] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');

  // Editing Extension State
  const [editingItem, setEditingItem] = useState<{ id: string, type: 'FIXED' | 'USER', name: string, number: string, sector: string } | null>(null);

  const isSuperAdmin = currentUser.role === 'SUPER_ADMIN';

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    addUser({
      name: newName,
      username: newUsername,
      password: newPassword,
      role: newRole,
      hasPortalAccess: newHasPortalAccess,
      extension: newRole === 'SUPER_ADMIN' ? undefined : (newUserExtension || undefined),
      sectorId: newUserSectorId || undefined
    });
    setNewName('');
    setNewUsername('');
    setNewPassword('');
    setNewRole('MAINTENANCE');
    setNewHasPortalAccess(false);
    setNewUserExtension('');
    setNewUserSectorId('');
  };

  const handleAddSector = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSectorName || !newCostCenter) return;
    addSector(newSectorName, newCostCenter);
    setNewSectorName('');
    setNewCostCenter('');
  };

  const handleOpenEditSector = (sector: Sector) => {
    setEditingSector(sector);
    setEditSectorName(sector.name);
    setEditCostCenter(sector.costCenter);
  };

  const handleUpdateSector = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingSector && editSectorName && editCostCenter) {
      updateSector(editingSector.id, editSectorName, editCostCenter);
      setEditingSector(null);
      setEditSectorName('');
      setEditCostCenter('');
    }
  };

  const handleAddUnifiedExtension = (e: React.FormEvent) => {
    e.preventDefault();
    if (extType === 'FIXED') {
      addExtension({ name: extName, number: extNumber, sector: extSector });
    } else {
      if (!selectedUserId) return;
      updateUserExtension(selectedUserId, extNumber);
    }
    // Reset
    setExtName('');
    setExtNumber('');
    setExtSector('');
    setSelectedUserId('');
  };

  const handleOpenEditUnified = (item: { id: string, type: 'FIXED' | 'USER', name: string, number: string, sector: string }) => {
    setEditingItem(item);
  };

  const handleUpdateUnified = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    if (editingItem.type === 'FIXED') {
      updateExtension(editingItem.id, editingItem.name, editingItem.number, editingItem.sector);
    } else {
      // In User type, the id is the userId
      updateUserExtension(editingItem.id, editingItem.number);
    }
    setEditingItem(null);
  };

  const handleUpdatePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedUserForPass && newPassValue) {
      updateUserPassword(selectedUserForPass.id, newPassValue);
      alert(`Senha de ${selectedUserForPass.name} atualizada com sucesso!`);
      setSelectedUserForPass(null);
      setNewPassValue('');
    }
  };

  const canChangePasswordOf = (targetUser: User) => {
    if (isSuperAdmin) return true;
    if (currentUser.role === 'IT_ADMIN') {
      return targetUser.role !== 'SUPER_ADMIN' && targetUser.role !== 'IT_ADMIN';
    }
    return false;
  };

  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case 'SUPER_ADMIN': return 'Super Usuário';
      case 'IT_ADMIN': return 'Administrador TI';
      case 'MAINTENANCE': return 'Manutenção';
      case 'WAREHOUSE': return 'Almoxarifado';
      case 'PURCHASING': return 'Compras';
      case 'GATEHOUSE': return 'Portaria';
      case 'USER': return 'Usuário Padrão';
    }
  };

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case 'SUPER_ADMIN': return 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-900/50';
      case 'IT_ADMIN': return 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-900/50';
      case 'MAINTENANCE': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-900/50';
      case 'WAREHOUSE': return 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-900/50';
      case 'PURCHASING': return 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-900/50';
      case 'GATEHOUSE': return 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-900/50';
      case 'USER': return 'bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-900/50';
    }
  };

  // Combine fixed and user extensions for unified directory management
  const unifiedExtensions = [
    ...extensions.map(e => ({ id: e.id, name: e.name, number: e.number, sector: e.sector, type: 'FIXED' as const })),
    ...users
      .filter(u => u.role !== 'SUPER_ADMIN' && u.extension)
      .map(u => ({ 
        id: u.id, 
        name: u.name, 
        number: u.extension!, 
        sector: sectors.find(s => s.id === u.sectorId)?.name || 'Geral', 
        type: 'USER' as const 
      }))
  ].sort((a, b) => a.number.localeCompare(b.number));

  const renderUsersTab = () => (
    <div className="grid lg:grid-cols-3 gap-8">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 h-fit">
        <h3 className="font-bold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
          <UserPlus className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          Novo Usuário
        </h3>
        <form onSubmit={handleAddUser} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nome Completo</label>
            <input required type="text" className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2.5 outline-none bg-white dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-purple-500" value={newName} onChange={e => setNewName(e.target.value)} />
          </div>
          
          <div className="grid grid-cols-2 gap-3">
             <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Cargo</label>
                <select className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2.5 outline-none bg-white dark:bg-gray-700 dark:text-white" value={newRole} onChange={(e) => setNewRole(e.target.value as UserRole)}>
                  <option value="MAINTENANCE">Manutenção</option>
                  <option value="WAREHOUSE">Almoxarifado</option>
                  <option value="PURCHASING">Compras</option>
                  <option value="GATEHOUSE">Portaria</option>
                  <option value="USER">Usuário</option>
                  <option value="IT_ADMIN">Admin TI</option>
                  {isSuperAdmin && <option value="SUPER_ADMIN">Super Admin</option>}
                </select>
             </div>
             <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Setor / C. Custo</label>
                <select required className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2.5 outline-none bg-white dark:bg-gray-700 dark:text-white" value={newUserSectorId} onChange={e => setNewUserSectorId(e.target.value)}>
                   <option value="">Selecione...</option>
                   {sectors.map(s => <option key={s.id} value={s.id}>{s.name} ({s.costCenter})</option>)}
                </select>
             </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
             <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Ramal (Opcional)</label>
                <input 
                  disabled={newRole === 'SUPER_ADMIN'}
                  type="text" 
                  className={`w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2.5 outline-none bg-white dark:bg-gray-700 dark:text-white ${newRole === 'SUPER_ADMIN' ? 'opacity-50 cursor-not-allowed' : ''}`} 
                  placeholder={newRole === 'SUPER_ADMIN' ? "Privado" : "Ex: 101"} 
                  value={newUserExtension} 
                  onChange={e => setNewUserExtension(e.target.value)} 
                />
             </div>
             <div className="flex items-end">
                <div className="flex items-center gap-3 p-2.5 border border-gray-200 dark:border-gray-600 rounded-lg cursor-pointer w-full bg-gray-50 dark:bg-gray-700/50" onClick={() => setNewHasPortalAccess(!newHasPortalAccess)}>
                   {newHasPortalAccess ? <CheckSquare className="w-5 h-5 text-teal-600" /> : <Square className="w-5 h-5 text-gray-400" />}
                   <span className="text-[10px] font-bold uppercase leading-tight">Portal Colaborador</span>
                </div>
             </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <input required type="text" className="border border-gray-300 dark:border-gray-600 rounded-lg p-2.5 outline-none bg-white dark:bg-gray-700 dark:text-white" placeholder="Login" value={newUsername} onChange={e => setNewUsername(e.target.value)} />
            <input required type="password" placeholder="Senha" className="border border-gray-300 dark:border-gray-600 rounded-lg p-2.5 outline-none bg-white dark:bg-gray-700 dark:text-white" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
          </div>
          <button type="submit" className="w-full bg-purple-600 text-white py-3 rounded-lg font-bold hover:bg-purple-700 transition shadow-lg shadow-purple-500/20 flex items-center justify-center gap-2">
            <UserPlus className="w-4 h-4" /> Cadastrar Usuário
          </button>
        </form>
      </div>

      <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex justify-between items-center">
          <h3 className="font-bold flex items-center gap-2 text-gray-700 dark:text-gray-200"><Users className="w-5 h-5 text-purple-500" /> Lista de Usuários</h3>
          <span className="text-xs font-bold text-purple-600 bg-purple-50 dark:bg-purple-900/30 px-2 py-1 rounded-full">{users.length} usuários</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50/50 dark:bg-gray-700/50 text-[10px] uppercase text-gray-500 tracking-wider font-bold">
              <tr>
                <th className="p-4">Nome / Login</th>
                <th className="p-4">Função</th>
                <th className="p-4">Setor / C. Custo</th>
                <th className="p-4">Ramal</th>
                <th className="p-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {users.map(user => {
                const userSector = sectors.find(s => s.id === user.sectorId);
                return (
                  <tr key={user.id} className="hover:bg-gray-50/50 transition">
                    <td className="p-4">
                       <div className="font-bold text-gray-800 dark:text-gray-100">{user.name}</div>
                       <div className="text-xs text-gray-400 font-mono">{user.username}</div>
                    </td>
                    <td className="p-4">
                       <span className={`px-2 py-1 rounded text-[10px] font-bold ${getRoleColor(user.role)}`}>
                          {getRoleLabel(user.role)}
                       </span>
                    </td>
                    <td className="p-4">
                       {userSector ? (
                         <div className="text-xs">
                           <div className="font-medium text-gray-700 dark:text-gray-300">{userSector.name}</div>
                           <div className="text-[10px] text-gray-400 font-mono">{userSector.costCenter}</div>
                         </div>
                       ) : <span className="text-gray-300">-</span>}
                    </td>
                    <td className="p-4 font-mono text-sm text-gray-500">
                      {user.role === 'SUPER_ADMIN' ? (
                        <span className="text-[10px] bg-amber-50 dark:bg-amber-900/20 text-amber-600 px-2 py-1 rounded border border-amber-100 dark:border-amber-800 font-bold uppercase">Privado</span>
                      ) : (user.extension || '-')}
                    </td>
                    <td className="p-4 text-right">
                      {user.id !== currentUser.id && (
                        <button onClick={() => removeUser(user.id)} className="text-red-400 hover:text-red-600 p-2 transition"><Trash2 className="w-4 h-4" /></button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderSectorsTab = () => (
    <div className="grid lg:grid-cols-3 gap-8">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 h-fit">
        <h3 className="font-bold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
          <Building className="w-5 h-5 text-gray-500" /> Gerenciar Setores
        </h3>
        <form onSubmit={handleAddSector} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nome do Setor</label>
            <input required type="text" className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2.5 outline-none bg-white dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-purple-500" placeholder="Ex: Produção, RH, TI" value={newSectorName} onChange={e => setNewSectorName(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Centro de Custo</label>
            <div className="relative">
               <Hash className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
               <input required type="text" className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg outline-none bg-white dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-purple-500" placeholder="Ex: 1001" value={newCostCenter} onChange={e => setNewCostCenter(e.target.value)} />
            </div>
          </div>
          <button type="submit" className="w-full bg-purple-600 text-white py-2.5 rounded-lg font-bold hover:bg-purple-700 transition flex items-center justify-center gap-2">
            <PlusCircle className="w-4 h-4" /> Adicionar Setor
          </button>
        </form>
      </div>

      <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex justify-between items-center">
          <h3 className="font-bold flex items-center gap-2 text-gray-700 dark:text-gray-200"><Building className="w-5 h-5 text-purple-500" /> Setores e Centros de Custo</h3>
        </div>
        <table className="w-full text-left">
          <thead className="bg-gray-50/50 dark:bg-gray-700/50 text-[10px] uppercase text-gray-500 tracking-wider font-bold">
            <tr>
              <th className="p-4">Nome do Setor</th>
              <th className="p-4">Centro de Custo</th>
              <th className="p-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
            {sectors.map(sector => (
              <tr key={sector.id} className="hover:bg-gray-50/50 transition">
                <td className="p-4 font-bold text-gray-800 dark:text-gray-100">{sector.name}</td>
                <td className="p-4 font-mono text-purple-600 dark:text-purple-400 font-bold">{sector.costCenter}</td>
                <td className="p-4 text-right flex justify-end gap-2">
                  <button 
                    onClick={() => handleOpenEditSector(sector)} 
                    className="text-blue-500 hover:text-blue-700 p-2 transition hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg"
                    title="Editar Setor"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button onClick={() => removeSector(sector.id)} className="text-red-400 hover:text-red-600 p-2 transition hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editingSector && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
               <h3 className="font-bold text-lg text-gray-800 dark:text-white flex items-center gap-2">
                 <Pencil className="w-5 h-5 text-blue-500" /> Editar Setor
               </h3>
               <button onClick={() => setEditingSector(null)} className="text-gray-400 hover:text-gray-600 transition">
                 <X className="w-5 h-5" />
               </button>
            </div>
            <form onSubmit={handleUpdateSector} className="p-6 space-y-5">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5">Nome do Setor</label>
                <input 
                  required 
                  type="text" 
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 dark:text-white" 
                  value={editSectorName} 
                  onChange={e => setEditSectorName(e.target.value)} 
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5">Centro de Custo</label>
                <div className="relative">
                   <Hash className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
                   <input 
                    required 
                    type="text" 
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 dark:text-white font-mono" 
                    value={editCostCenter} 
                    onChange={e => setEditCostCenter(e.target.value)} 
                   />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                 <button 
                   type="button" 
                   onClick={() => setEditingSector(null)} 
                   className="flex-1 py-3 border border-gray-200 dark:border-gray-600 text-gray-500 rounded-xl font-bold hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                 >
                   Cancelar
                 </button>
                 <button 
                   type="submit" 
                   className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-600/20 transition flex items-center justify-center gap-2"
                 >
                   <Save className="w-4 h-4" /> Atualizar
                 </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );

  const renderExtensionsTab = () => (
    <div className="grid lg:grid-cols-3 gap-8">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 h-fit">
        <h3 className="font-bold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
          <Phone className="w-5 h-5 text-gray-500" /> Cadastro de Ramal
        </h3>
        <form onSubmit={handleAddUnifiedExtension} className="space-y-4">
          <div className="flex p-1 bg-gray-100 dark:bg-gray-700 rounded-lg mb-2">
            <button 
              type="button"
              onClick={() => setExtType('FIXED')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-md transition ${extType === 'FIXED' ? 'bg-white dark:bg-gray-600 shadow-sm text-purple-600 dark:text-purple-400' : 'text-gray-500'}`}
            >
              Fixo / Local
            </button>
            <button 
              type="button"
              onClick={() => setExtType('USER')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-md transition ${extType === 'USER' ? 'bg-white dark:bg-gray-600 shadow-sm text-purple-600 dark:text-purple-400' : 'text-gray-500'}`}
            >
              Colaborador
            </button>
          </div>

          {extType === 'FIXED' ? (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nome / Localização</label>
                <input required type="text" className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2.5 outline-none bg-white dark:bg-gray-700 dark:text-white" placeholder="Ex: Recepção" value={extName} onChange={e => setExtName(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Setor</label>
                <select className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2.5 outline-none bg-white dark:bg-gray-700 dark:text-white" value={extSector} onChange={e => setExtSector(e.target.value)} required>
                   <option value="">Selecione...</option>
                   {sectors.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                </select>
              </div>
            </>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Selecionar Colaborador</label>
              <select className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2.5 outline-none bg-white dark:bg-gray-700 dark:text-white" value={selectedUserId} onChange={e => setSelectedUserId(e.target.value)} required>
                 <option value="">Escolha um usuário...</option>
                 {users.filter(u => u.role !== 'SUPER_ADMIN').map(u => (
                   <option key={u.id} value={u.id}>{u.name} {u.extension ? `(Atual: ${u.extension})` : '(Sem ramal)'}</option>
                 ))}
              </select>
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Número do Ramal</label>
            <input required type="text" className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2.5 outline-none bg-white dark:bg-gray-700 dark:text-white" placeholder="Ex: 500" value={extNumber} onChange={e => setExtNumber(e.target.value)} />
          </div>

          <button type="submit" className="w-full bg-purple-600 text-white py-2.5 rounded-lg font-bold hover:bg-purple-700 transition flex items-center justify-center gap-2">
            <PlusCircle className="w-4 h-4" /> 
            {extType === 'FIXED' ? 'Cadastrar Ramal' : 'Vincular Ramal'}
          </button>
        </form>
      </div>

      <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex justify-between items-center">
          <h3 className="font-bold flex items-center gap-2 text-gray-700 dark:text-gray-200"><PhoneForwarded className="w-5 h-5 text-purple-500" /> Guia Geral de Ramais</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50/50 dark:bg-gray-700/50 text-[10px] uppercase text-gray-500 tracking-wider font-bold">
              <tr>
                <th className="p-4">Identificação</th>
                <th className="p-4">Setor</th>
                <th className="p-4">Número</th>
                <th className="p-4">Tipo</th>
                <th className="p-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {unifiedExtensions.map((item, idx) => (
                <tr key={`${item.id}-${idx}`} className="hover:bg-gray-50/50 transition">
                  <td className="p-4 font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                    {item.type === 'USER' ? <UserIcon className="w-4 h-4 text-teal-500" /> : <MapPin className="w-4 h-4 text-blue-500" />}
                    {item.name}
                  </td>
                  <td className="p-4 text-sm text-gray-600 dark:text-gray-400">{item.sector}</td>
                  <td className="p-4 font-mono font-bold text-purple-600 dark:text-purple-400">{item.number}</td>
                  <td className="p-4">
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                      item.type === 'USER' ? 'bg-teal-50 text-teal-600 border-teal-200' : 'bg-blue-50 text-blue-600 border-blue-200'
                    }`}>
                      {item.type === 'USER' ? 'COLABORADOR' : 'FIXO / LOCAL'}
                    </span>
                  </td>
                  <td className="p-4 text-right flex justify-end gap-2">
                    <button 
                      onClick={() => handleOpenEditUnified(item)} 
                      className="text-blue-500 hover:text-blue-700 p-2 transition hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg"
                      title="Editar Ramal"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    {item.type === 'FIXED' ? (
                      <button onClick={() => removeExtension(item.id)} className="text-red-400 hover:text-red-600 p-2 transition hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                    ) : (
                      <button 
                        onClick={() => updateUserExtension(item.id, '')} 
                        className="text-orange-400 hover:text-orange-600 p-2 transition hover:bg-orange-50 dark:hover:bg-orange-900/30 rounded-lg"
                        title="Remover Ramal do Usuário"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {unifiedExtensions.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-400 italic">Nenhum ramal cadastrado.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {editingItem && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
               <h3 className="font-bold text-lg text-gray-800 dark:text-white flex items-center gap-2">
                 <Pencil className="w-5 h-5 text-blue-500" /> Editar Ramal
               </h3>
               <button onClick={() => setEditingItem(null)} className="text-gray-400 hover:text-gray-600 transition">
                 <X className="w-5 h-5" />
               </button>
            </div>
            <form onSubmit={handleUpdateUnified} className="p-6 space-y-5">
              {editingItem.type === 'FIXED' && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5">Nome / Localização</label>
                    <input 
                      required 
                      type="text" 
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 dark:text-white" 
                      value={editingItem.name} 
                      onChange={e => setEditingItem({ ...editingItem, name: e.target.value })} 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5">Setor</label>
                    <select 
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 dark:text-white" 
                      value={editingItem.sector} 
                      onChange={e => setEditingItem({ ...editingItem, sector: e.target.value })} 
                      required
                    >
                       {sectors.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                    </select>
                  </div>
                </>
              )}
              
              {editingItem.type === 'USER' && (
                <div className="bg-teal-50 dark:bg-teal-900/20 p-4 rounded-xl flex items-center gap-3 border border-teal-100 dark:border-teal-800">
                  <UserIcon className="w-6 h-6 text-teal-600 shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-teal-800 dark:text-teal-300 uppercase">Alterando ramal de:</p>
                    <p className="text-sm font-bold text-teal-900 dark:text-white">{editingItem.name}</p>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5">Número do Ramal</label>
                <div className="relative">
                   <Phone className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
                   <input 
                    required 
                    type="text" 
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 dark:text-white font-mono" 
                    value={editingItem.number} 
                    onChange={e => setEditingItem({ ...editingItem, number: e.target.value })} 
                   />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                 <button 
                   type="button" 
                   onClick={() => setEditingItem(null)} 
                   className="flex-1 py-3 border border-gray-200 dark:border-gray-600 text-gray-500 rounded-xl font-bold hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                 >
                   Cancelar
                 </button>
                 <button 
                   type="submit" 
                   className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-600/20 transition flex items-center justify-center gap-2"
                 >
                   <Save className="w-4 h-4" /> Atualizar
                 </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );

  const renderPasswordsTab = () => (
    <div className="space-y-6">
      <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-xl border border-amber-100 dark:border-amber-800 flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5" />
        <div className="text-sm text-amber-800 dark:text-amber-300">
          <p className="font-bold">Segurança de Senhas</p>
          <p>Apenas Super Administradores podem alterar senhas de outros administradores. Administradores de TI podem alterar senhas de cargos operacionais.</p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 dark:bg-gray-700/50 text-[10px] uppercase text-gray-500 font-bold tracking-wider">
            <tr>
              <th className="p-4">Usuário</th>
              <th className="p-4">Função</th>
              <th className="p-4 text-right">Ação</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
            {users.map(user => {
              const allowed = canChangePasswordOf(user);
              return (
                <tr key={user.id} className="hover:bg-gray-50/50 transition">
                  <td className="p-4">
                    <div className="font-bold text-gray-800 dark:text-gray-100">{user.name}</div>
                    <div className="text-xs text-gray-400">{user.username}</div>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded text-[10px] font-bold ${getRoleColor(user.role)}`}>
                      {getRoleLabel(user.role)}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    {allowed ? (
                      <button 
                        onClick={() => setSelectedUserForPass(user)}
                        className="text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/30 px-3 py-1.5 rounded-lg text-xs font-bold border border-purple-200 dark:border-purple-800 transition flex items-center gap-1 ml-auto"
                      >
                        <Key className="w-3 h-3" /> Alterar Senha
                      </button>
                    ) : (
                      <span className="text-[10px] text-gray-400 uppercase font-bold px-2 py-1 flex items-center justify-end gap-1">
                        <Lock className="w-3 h-3" /> Restrito
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {selectedUserForPass && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden animate-in fade-in zoom-in duration-200">
             <div className="bg-purple-600 p-6 text-white text-center">
                <div className="bg-white/20 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                   <Lock className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-lg">Alterar Senha</h3>
                <p className="text-purple-100 text-xs mt-1">Usuário: {selectedUserForPass.name}</p>
             </div>
             <form onSubmit={handleUpdatePassword} className="p-6 space-y-4">
                <div className="relative">
                   <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5">Nova Senha</label>
                   <div className="relative">
                      <input 
                        required
                        type={showPass ? 'text' : 'password'}
                        className="w-full border border-gray-300 dark:border-gray-600 rounded-xl p-3 pr-10 outline-none focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-700 dark:text-white"
                        placeholder="••••••••"
                        value={newPassValue}
                        onChange={e => setNewPassValue(e.target.value)}
                        autoFocus
                      />
                      <button 
                        type="button" 
                        onClick={() => setShowPass(!showPass)}
                        className="absolute right-3 top-3.5 text-gray-400 hover:text-purple-600 transition"
                      >
                        {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                   </div>
                </div>
                <div className="flex gap-3 pt-2">
                   <button 
                     type="button"
                     onClick={() => { setSelectedUserForPass(null); setNewPassValue(''); setShowPass(false); }}
                     className="flex-1 py-2.5 border border-gray-200 dark:border-gray-600 text-gray-500 rounded-xl font-bold text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                   >
                     Cancelar
                   </button>
                   <button 
                     type="submit"
                     className="flex-1 py-2.5 bg-purple-600 text-white rounded-xl font-bold text-sm hover:bg-purple-700 shadow-lg shadow-purple-600/20 transition flex items-center justify-center gap-2"
                   >
                     <Save className="w-4 h-4" /> Salvar
                   </button>
                </div>
             </form>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="p-6">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
          <Shield className="w-6 h-6 text-purple-600 dark:text-purple-400" />
          Painel Administrativo
        </h2>
      </div>

      <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6 overflow-x-auto scrollbar-hide">
        <button onClick={() => setActiveTab('USERS')} className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${activeTab === 'USERS' ? 'border-purple-500 text-purple-600' : 'border-transparent text-gray-500'}`}><Users className="w-4 h-4" /> Usuários</button>
        <button onClick={() => setActiveTab('SECTORS')} className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${activeTab === 'SECTORS' ? 'border-purple-500 text-purple-600' : 'border-transparent text-gray-500'}`}><Building className="w-4 h-4" /> Setores</button>
        <button onClick={() => setActiveTab('EXTENSIONS')} className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${activeTab === 'EXTENSIONS' ? 'border-purple-500 text-purple-600' : 'border-transparent text-gray-500'}`}><Phone className="w-4 h-4" /> Ramais</button>
        <button onClick={() => setActiveTab('PASSWORDS')} className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${activeTab === 'PASSWORDS' ? 'border-purple-500 text-purple-600' : 'border-transparent text-gray-500'}`}><Key className="w-4 h-4" /> Senhas</button>
      </div>

      {activeTab === 'USERS' && renderUsersTab()}
      {activeTab === 'EXTENSIONS' && renderExtensionsTab()}
      {activeTab === 'SECTORS' && renderSectorsTab()}
      {activeTab === 'PASSWORDS' && renderPasswordsTab()}
    </div>
  );
};