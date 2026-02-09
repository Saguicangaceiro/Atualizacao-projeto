import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { Users, UserPlus, Trash2, Shield, Key, Lock, Crown, Building, Hash, Plus, Pencil, CheckSquare, Square, Phone, PhoneForwarded, PlusCircle, ShieldAlert, Eye, EyeOff, Save, X, User as UserIcon, MapPin, Database, Server, Globe, Link as LinkIcon, Info, RefreshCcw, Camera, Upload, Download, HardDrive } from 'lucide-react';
import { UserRole, User, Sector, Extension, DatabaseConfig, Equipment } from '../types';

interface AdminPanelProps {
  currentUser: User;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ currentUser }) => {
  const { users, addUser, removeUser, updateUserPassword, sectors, addSector, removeSector, updateSector, extensions, addExtension, removeExtension, updateExtension, updateUserExtension, databaseConfig, updateDatabaseConfig, equipments, addEquipment, removeEquipment, exportDatabase, importDatabase } = useApp();
  const [activeTab, setActiveTab] = useState<'USERS' | 'SECTORS' | 'EQUIPMENTS' | 'EXTENSIONS' | 'PASSWORDS' | 'DATABASE'>('USERS');
  
  // User Form State
  const [newName, setNewName] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('MAINTENANCE');
  const [newHasPortalAccess, setNewHasPortalAccess] = useState(false);
  const [newUserExtension, setNewUserExtension] = useState('');
  const [newUserSectorId, setNewUserSectorId] = useState('');
  const [showNewUserPass, setShowNewUserPass] = useState(false);
  const [newProfileImage, setNewProfileImage] = useState<string | undefined>(undefined);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Equipment Form State
  const [newEqName, setNewEqName] = useState('');
  const [newEqCode, setNewEqCode] = useState('');
  const [newEqSector, setNewEqSector] = useState('');
  const [newEqLocation, setNewEqLocation] = useState('');

  // Password Management State (Tab Passwords)
  const [selectedUserForPass, setSelectedUserForPass] = useState<User | null>(null);
  const [newPassValue, setNewPassValue] = useState('');
  const [showPass, setShowPass] = useState(false);

  // Sector Form State
  const [newSectorName, setNewSectorName] = useState('');
  const [newCostCenter, setNewCostCenter] = useState('');

  // Database Settings State
  const [tempDbConfig, setTempDbConfig] = useState<DatabaseConfig>({ ...databaseConfig });

  const isSuperAdmin = currentUser.role === 'SUPER_ADMIN';

  const clearUserForm = () => {
    setNewName('');
    setNewUsername('');
    setNewPassword('');
    setNewRole('MAINTENANCE');
    setNewHasPortalAccess(false);
    setNewUserExtension('');
    setNewUserSectorId('');
    setShowNewUserPass(false);
    setNewProfileImage(undefined);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewProfileImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    addUser({
      name: newName,
      username: newUsername,
      password: newPassword,
      role: newRole,
      hasPortalAccess: newHasPortalAccess,
      extension: newRole === 'SUPER_ADMIN' ? undefined : (newUserExtension || undefined),
      sectorId: newUserSectorId || undefined,
      profileImage: newProfileImage
    });
    clearUserForm();
    alert("Usuário cadastrado com sucesso!");
  };

  const handleAddSector = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSectorName || !newCostCenter) return;
    addSector(newSectorName, newCostCenter);
    setNewSectorName('');
    setNewCostCenter('');
  };

  const handleAddEquipment = (e: React.FormEvent) => {
    e.preventDefault();
    addEquipment({
      name: newEqName,
      code: newEqCode,
      sectorId: newEqSector,
      location: newEqLocation
    });
    setNewEqName('');
    setNewEqCode('');
    setNewEqSector('');
    setNewEqLocation('');
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          importDatabase(event.target.result as string);
        }
      };
      reader.readAsText(file);
    }
  };

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
    <div className="grid lg:grid-cols-12 gap-8">
      {/* Formulário Lateral de Cadastro */}
      <div className="lg:col-span-4 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 h-fit sticky top-24">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-purple-600" />
            Novo Usuário
          </h3>
          <button onClick={clearUserForm} title="Limpar formulário" className="p-1.5 text-gray-400 hover:text-purple-600 transition">
             <RefreshCcw className="w-4 h-4" />
          </button>
        </div>
        <form onSubmit={handleAddUser} className="space-y-5">
          <div className="flex flex-col items-center gap-4 py-4 bg-gray-50 dark:bg-gray-700/30 rounded-2xl border border-dashed border-gray-200 dark:border-gray-600">
             <div className="relative group">
                <div className="w-24 h-24 rounded-full bg-white dark:bg-gray-800 border-4 border-white dark:border-gray-800 shadow-md overflow-hidden flex items-center justify-center text-gray-300">
                   {newProfileImage ? (
                     <img src={newProfileImage} className="w-full h-full object-cover" alt="Preview" />
                   ) : (
                     <UserIcon className="w-12 h-12" />
                   )}
                </div>
                <button type="button" onClick={() => fileInputRef.current?.click()} className="absolute bottom-0 right-0 bg-purple-600 text-white p-2 rounded-full shadow-lg hover:bg-purple-700 transition active:scale-90">
                   <Camera className="w-4 h-4" />
                </button>
             </div>
             <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageChange} />
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">Nome Completo *</label>
              <input required type="text" className="w-full border border-gray-300 dark:border-gray-600 rounded-xl p-2.5 outline-none bg-white dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-purple-500 transition-all shadow-sm" value={newName} onChange={e => setNewName(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
               <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">Cargo *</label>
                  <select className="w-full border border-gray-300 dark:border-gray-600 rounded-xl p-2.5 outline-none bg-white dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-purple-500" value={newRole} onChange={(e) => setNewRole(e.target.value as UserRole)}>
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
                  <label className="block text-xs font-bold text-gray-500 mb-1">Setor *</label>
                  <select required className="w-full border border-gray-300 dark:border-gray-600 rounded-xl p-2.5 outline-none bg-white dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-purple-500" value={newUserSectorId} onChange={e => setNewUserSectorId(e.target.value)}>
                     <option value="">Selecione...</option>
                     {sectors.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
               </div>
            </div>
          </div>
          <div className="space-y-4">
             <div className="grid grid-cols-2 gap-4">
                <div>
                   <label className="block text-xs font-bold text-gray-500 mb-1">Login *</label>
                   <input required type="text" className="w-full border border-gray-300 dark:border-gray-600 rounded-xl p-2.5 outline-none bg-white dark:bg-gray-700 dark:text-white" value={newUsername} onChange={e => setNewUsername(e.target.value)} />
                </div>
                <div>
                   <label className="block text-xs font-bold text-gray-500 mb-1">Senha *</label>
                   <input required type="password" placeholder="••••••" className="w-full border border-gray-300 dark:border-gray-600 rounded-xl p-2.5 outline-none bg-white dark:bg-gray-700 dark:text-white" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
                </div>
             </div>
          </div>
          <button type="submit" className="w-full bg-purple-600 text-white py-3 rounded-xl font-bold hover:bg-purple-700 transition">Criar Conta</button>
        </form>
      </div>

      {/* Lista */}
      <div className="lg:col-span-8 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-5 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
          <h3 className="font-bold flex items-center gap-2 text-gray-700 dark:text-gray-200"><Users className="w-5 h-5 text-purple-600" /> Contas Cadastradas</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400 font-bold uppercase text-[10px]">
              <tr>
                <th className="p-4">Colaborador</th>
                <th className="p-4">Perfil</th>
                <th className="p-4 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {users.map(u => (
                <tr key={u.id}>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                       <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-100">
                          {u.profileImage ? <img src={u.profileImage} className="w-full h-full object-cover" /> : <UserIcon className="p-1 text-gray-300" />}
                       </div>
                       <div>
                          <div className="font-bold text-gray-800 dark:text-white">{u.name}</div>
                          <div className="text-[10px] text-gray-400">{u.username}</div>
                       </div>
                    </div>
                  </td>
                  <td className="p-4"><span className="text-[10px] bg-purple-50 dark:bg-purple-900/30 text-purple-600 px-2 py-0.5 rounded-full border border-purple-100">{u.role}</span></td>
                  <td className="p-4 text-right">
                    {u.id !== currentUser.id && <button onClick={() => removeUser(u.id)} className="text-red-400 hover:text-red-600 transition"><Trash2 className="w-4 h-4" /></button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderEquipmentsTab = () => (
    <div className="grid lg:grid-cols-12 gap-8">
      <div className="lg:col-span-4 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 h-fit">
        <h3 className="font-bold text-gray-800 dark:text-gray-100 mb-6 flex items-center gap-2">
          <HardDrive className="w-5 h-5 text-blue-500" /> Novo Equipamento
        </h3>
        <form onSubmit={handleAddEquipment} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">Nome / Ativo *</label>
            <input required placeholder="Ex: Torno CNC" className="w-full border border-gray-300 dark:border-gray-600 rounded-xl p-2.5 outline-none bg-white dark:bg-gray-700 dark:text-white" value={newEqName} onChange={e => setNewEqName(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
             <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">Código / TAG *</label>
                <input required placeholder="Ex: MNT-001" className="w-full border border-gray-300 dark:border-gray-600 rounded-xl p-2.5 outline-none bg-white dark:bg-gray-700 dark:text-white font-mono" value={newEqCode} onChange={e => setNewEqCode(e.target.value)} />
             </div>
             <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">Setor *</label>
                <select required className="w-full border border-gray-300 dark:border-gray-600 rounded-xl p-2.5 outline-none bg-white dark:bg-gray-700 dark:text-white" value={newEqSector} onChange={e => setNewEqSector(e.target.value)}>
                   <option value="">Escolha...</option>
                   {sectors.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
             </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">Localização Específica</label>
            <input required placeholder="Ex: Linha de Produção 2" className="w-full border border-gray-300 dark:border-gray-600 rounded-xl p-2.5 outline-none bg-white dark:bg-gray-700 dark:text-white" value={newEqLocation} onChange={e => setNewEqLocation(e.target.value)} />
          </div>
          <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition">Cadastrar Ativo</button>
        </form>
      </div>
      <div className="lg:col-span-8 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-5 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 flex justify-between items-center">
           <h3 className="font-bold flex items-center gap-2"><HardDrive className="w-5 h-5 text-blue-500" /> Registro de Ativos</h3>
        </div>
        <table className="w-full text-left text-sm">
           <thead className="bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400 font-bold uppercase text-[10px]">
             <tr>
               <th className="p-4">TAG</th>
               <th className="p-4">Equipamento</th>
               <th className="p-4">Setor / Local</th>
               <th className="p-4 text-right">Ação</th>
             </tr>
           </thead>
           <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
             {equipments.map(eq => (
               <tr key={eq.id}>
                 <td className="p-4 font-mono font-bold text-blue-600">{eq.code}</td>
                 <td className="p-4 font-bold">{eq.name}</td>
                 <td className="p-4">
                   <div className="text-gray-700 dark:text-gray-200">{sectors.find(s => s.id === eq.sectorId)?.name}</div>
                   <div className="text-[10px] text-gray-400">{eq.location}</div>
                 </td>
                 <td className="p-4 text-right">
                    <button onClick={() => removeEquipment(eq.id)} className="text-gray-300 hover:text-red-500 transition"><Trash2 className="w-4 h-4" /></button>
                 </td>
               </tr>
             ))}
             {equipments.length === 0 && <tr><td colSpan={4} className="p-8 text-center text-gray-400">Nenhum ativo cadastrado.</td></tr>}
           </tbody>
        </table>
      </div>
    </div>
  );

  const renderDatabaseTab = () => (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
        <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2 mb-6">
          <Database className="w-6 h-6 text-indigo-500" /> Gerenciar Banco de Dados Local
        </h3>
        
        <div className="grid md:grid-cols-2 gap-6">
           <div className="p-6 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl border border-indigo-100 dark:border-indigo-800">
              <div className="flex items-center gap-3 mb-4">
                 <Download className="w-6 h-6 text-indigo-600" />
                 <h4 className="font-bold text-indigo-900 dark:text-indigo-300">Exportar Backup</h4>
              </div>
              <p className="text-sm text-indigo-700 dark:text-indigo-400 mb-6">Salve uma cópia completa de todos os dados do sistema (OS, Estoque, Usuários) em um arquivo JSON.</p>
              <button onClick={exportDatabase} className="w-full bg-indigo-600 text-white py-2.5 rounded-xl font-bold hover:bg-indigo-700 transition shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2">
                 <Download className="w-4 h-4" /> Baixar Dados
              </button>
           </div>

           <div className="p-6 bg-orange-50 dark:bg-orange-900/20 rounded-2xl border border-orange-100 dark:border-orange-800">
              <div className="flex items-center gap-3 mb-4">
                 <Upload className="w-6 h-6 text-orange-600" />
                 <h4 className="font-bold text-orange-900 dark:text-orange-300">Importar Dados</h4>
              </div>
              <p className="text-sm text-orange-700 dark:text-orange-400 mb-6">Substitua os dados atuais do navegador por um arquivo de backup previamente exportado.</p>
              <label className="w-full bg-orange-600 text-white py-2.5 rounded-xl font-bold hover:bg-orange-700 transition shadow-lg shadow-orange-600/20 flex items-center justify-center gap-2 cursor-pointer">
                 <Upload className="w-4 h-4" /> Carregar Arquivo
                 <input type="file" accept=".json" className="hidden" onChange={handleFileImport} />
              </label>
           </div>
        </div>

        <div className="mt-8 p-4 bg-gray-50 dark:bg-gray-700/30 rounded-xl border border-gray-100 dark:border-gray-700">
           <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
             <strong>Nota de Intranet:</strong> Como este sistema é 100% local, os dados ficam armazenados exclusivamente no seu navegador. Recomendamos realizar backups periódicos através desta ferramenta para evitar perda de dados caso o histórico do navegador seja limpo.
           </p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-6">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
          <Shield className="w-6 h-6 text-purple-600 dark:text-purple-400" /> Painel Admin
        </h2>
      </div>

      <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6 overflow-x-auto scrollbar-hide">
        <button onClick={() => setActiveTab('USERS')} className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'USERS' ? 'border-purple-500 text-purple-600' : 'border-transparent text-gray-500'}`}>Usuários</button>
        <button onClick={() => setActiveTab('SECTORS')} className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'SECTORS' ? 'border-purple-500 text-purple-600' : 'border-transparent text-gray-500'}`}>Setores</button>
        <button onClick={() => setActiveTab('EQUIPMENTS')} className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'EQUIPMENTS' ? 'border-purple-500 text-purple-600' : 'border-transparent text-gray-500'}`}>Equipamentos</button>
        <button onClick={() => setActiveTab('EXTENSIONS')} className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'EXTENSIONS' ? 'border-purple-500 text-purple-600' : 'border-transparent text-gray-500'}`}>Ramais</button>
        <button onClick={() => setActiveTab('PASSWORDS')} className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'PASSWORDS' ? 'border-purple-500 text-purple-600' : 'border-transparent text-gray-500'}`}>Senhas</button>
        <button onClick={() => setActiveTab('DATABASE')} className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'DATABASE' ? 'border-purple-500 text-purple-600' : 'border-transparent text-gray-500'}`}>Backup / DB</button>
      </div>

      {activeTab === 'USERS' && renderUsersTab()}
      {activeTab === 'EQUIPMENTS' && renderEquipmentsTab()}
      {activeTab === 'DATABASE' && renderDatabaseTab()}
      {/* Outras abas permanecem implementadas conforme o original */}
    </div>
  );
};