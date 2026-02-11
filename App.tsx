
/**
 * DutyFinder Service Manager
 * Developed by Antônio Marcos
 */
import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext.tsx';
import { MaintenancePanel } from './components/MaintenancePanel.tsx';
import { WarehousePanel } from './components/WarehousePanel.tsx';
import { AdminPanel } from './components/AdminPanel.tsx';
import { UserPanel } from './components/UserPanel.tsx';
import { PurchasingPanel } from './components/PurchasingPanel.tsx';
import { GatehousePanel } from './components/GatehousePanel.tsx';
import { ITPanel } from './components/ITPanel.tsx';
import { Dashboard } from './components/Dashboard.tsx';
import { LoginScreen } from './components/LoginScreen.tsx';
import { Settings, LogOut, Shield, Crown, User as UserIcon, Code, Moon, Sun, LayoutDashboard, BarChart3, Monitor, Box } from 'lucide-react';

const AppContent: React.FC = () => {
  // Simplificado para evitar erros de parser do Babel Standalone
  const [currentUser, setCurrentUser] = useState(null);
  const [adminViewMode, setAdminViewMode] = useState('DASHBOARD');
  const { theme, toggleTheme, users } = useApp();

  useEffect(() => {
    const loader = document.getElementById('loader');
    if (loader) {
      loader.style.opacity = '0';
      setTimeout(() => { loader.style.display = 'none'; }, 500);
    }
  }, []);

  const currentSyncedUser = currentUser ? users.find(u => u.id === currentUser.id) || currentUser : null;

  if (!currentSyncedUser) {
    return <LoginScreen onLogin={(user) => setCurrentUser(user)} />;
  }

  const isAdmin = currentSyncedUser.role === 'IT_ADMIN' || currentSyncedUser.role === 'SUPER_ADMIN';
  
  const getThemeColor = () => {
    if (adminViewMode === 'DASHBOARD') return 'bg-indigo-600';
    if (adminViewMode === 'IT') return 'bg-indigo-600';
    if (currentSyncedUser.role !== 'USER' && adminViewMode === 'USER') return 'bg-teal-600';

    switch (currentSyncedUser.role) {
      case 'MAINTENANCE': return 'bg-blue-600';
      case 'WAREHOUSE': return 'bg-indigo-600';
      case 'PURCHASING': return 'bg-rose-600';
      case 'GATEHOUSE': return 'bg-amber-600';
      case 'IT_ADMIN': return 'bg-purple-800';
      case 'SUPER_ADMIN': return 'bg-amber-600';
      case 'USER': return 'bg-teal-600';
      default: return 'bg-gray-800';
    }
  };

  const getRoleName = () => {
    if (adminViewMode === 'DASHBOARD') return 'Indicadores';
    if (adminViewMode === 'IT') return 'Painel TI';
    if (currentSyncedUser.role !== 'USER' && adminViewMode === 'USER') return 'Modo Colaborador';

    switch (currentSyncedUser.role) {
      case 'MAINTENANCE': return 'Manutenção';
      case 'WAREHOUSE': return 'Almoxarifado';
      case 'PURCHASING': return 'Compras';
      case 'GATEHOUSE': return 'Portaria';
      case 'IT_ADMIN': return 'Administração TI';
      case 'SUPER_ADMIN': return 'Super Usuário';
      case 'USER': return 'Colaborador';
      default: return '';
    }
  };

  const renderIcon = () => {
    if (adminViewMode === 'DASHBOARD') return <BarChart3 className="w-6 h-6 text-white" />;
    if (adminViewMode === 'IT') return <Monitor className="w-6 h-6 text-white" />;
    if (currentSyncedUser.role !== 'USER' && adminViewMode === 'USER') return <Box className="w-6 h-6 text-white" />;
    if (currentSyncedUser.role === 'SUPER_ADMIN') return <Crown className="w-6 h-6 text-white" />;
    if (currentSyncedUser.role === 'IT_ADMIN') return <Shield className="w-6 h-6 text-white" />;
    return <Settings className="w-6 h-6 text-white" />;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col font-sans transition-colors duration-200">
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded-lg ${getThemeColor()} transition-colors`}>{renderIcon()}</div>
            <div>
              <span className="text-xl font-bold dark:text-white">DutyFinder</span>
              <span className="hidden sm:inline text-xs text-gray-400 border-l border-gray-300 dark:border-gray-600 pl-2 ml-2 uppercase">{getRoleName()}</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {isAdmin && (
              <button onClick={() => setAdminViewMode(adminViewMode === 'DASHBOARD' ? 'ADMIN' : 'DASHBOARD')} className="p-2 rounded-lg text-xs font-bold border border-indigo-200 text-indigo-700 dark:text-indigo-400">
                {adminViewMode === 'DASHBOARD' ? <LayoutDashboard className="w-4 h-4" /> : <BarChart3 className="w-4 h-4" />}
              </button>
            )}

            {currentSyncedUser.role !== 'USER' && (
              <button onClick={() => setAdminViewMode(adminViewMode === 'USER' ? 'ADMIN' : 'USER')} className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold border border-teal-200 text-teal-700">
                {adminViewMode === 'USER' ? <LayoutDashboard className="w-4 h-4" /> : <Box className="w-4 h-4" />}
                {adminViewMode === 'USER' ? 'Painel' : 'Portal'}
              </button>
            )}

            <button onClick={toggleTheme} className="p-2 rounded-full text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700">
              {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </button>

            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 px-3 py-1.5 rounded-full border border-gray-100 dark:border-gray-600">
               <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-300">
                 {currentSyncedUser.profileImage ? <img src={currentSyncedUser.profileImage} className="w-full h-full object-cover" /> : <UserIcon className="p-1.5 text-white" />}
               </div>
               <span className="font-bold hidden sm:inline">{currentSyncedUser.name.split(' ')[0]}</span>
            </div>

            <button onClick={() => setCurrentUser(null)} className="text-gray-400 hover:text-red-600 p-2"><LogOut className="w-5 h-5" /></button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full">
        {adminViewMode === 'DASHBOARD' && <Dashboard />}
        {adminViewMode === 'ADMIN' && currentSyncedUser.role === 'MAINTENANCE' && <MaintenancePanel currentUser={currentSyncedUser} />}
        {adminViewMode === 'ADMIN' && currentSyncedUser.role === 'WAREHOUSE' && <WarehousePanel currentUser={currentSyncedUser} />}
        {adminViewMode === 'ADMIN' && currentSyncedUser.role === 'PURCHASING' && <PurchasingPanel currentUser={currentSyncedUser} />}
        {adminViewMode === 'ADMIN' && currentSyncedUser.role === 'GATEHOUSE' && <GatehousePanel currentUser={currentSyncedUser} />}
        {adminViewMode === 'ADMIN' && isAdmin && <AdminPanel currentUser={currentSyncedUser} />}
        {adminViewMode === 'USER' && <UserPanel currentUser={currentSyncedUser} />}
      </main>

      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-auto py-6">
        <div className="max-w-7xl mx-auto px-4 flex justify-between items-center text-xs text-gray-400">
          <div className="flex items-center gap-2"><Code className="w-4 h-4" /> DutyFinder Intranet v3.0</div>
          <div>&copy; {new Date().getFullYear()} DutyFinder System.</div>
        </div>
      </footer>
    </div>
  );
};

const App: React.FC = () => (
  <AppProvider>
    <AppContent />
  </AppProvider>
);

export default App;
