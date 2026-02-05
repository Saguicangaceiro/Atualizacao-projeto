/**
 * DutyFinder Service Manager
 * Developed by Antônio Marcos
 */
import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { MaintenancePanel } from './components/MaintenancePanel';
import { WarehousePanel } from './components/WarehousePanel';
import { AdminPanel } from './components/AdminPanel';
import { UserPanel } from './components/UserPanel';
import { PurchasingPanel } from './components/PurchasingPanel';
import { GatehousePanel } from './components/GatehousePanel';
import { LoginScreen } from './components/LoginScreen';
import { Settings, Users, LogOut, PenTool, Box, Shield, Crown, User as UserIcon, ShoppingBag, Code, Moon, Sun, LayoutDashboard, Truck } from 'lucide-react';
import { User } from './types';

const AppContent: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [adminViewMode, setAdminViewMode] = useState<'ADMIN' | 'USER'>('ADMIN');
  const { theme, toggleTheme } = useApp();

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    setAdminViewMode('ADMIN'); // Reset to Admin view on login
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setAdminViewMode('ADMIN');
  };

  if (!currentUser) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  const isAdmin = currentUser.role === 'IT_ADMIN' || currentUser.role === 'SUPER_ADMIN';
  const canAccessPortal = currentUser.role === 'USER' || isAdmin || currentUser.hasPortalAccess;

  // Determine effective view role (what component to show)
  const isViewingAsAdmin = adminViewMode === 'ADMIN';

  const getThemeColor = () => {
    // If not viewing as admin (and not a standard user), use User color
    if (currentUser.role !== 'USER' && !isViewingAsAdmin) return 'bg-teal-600';

    switch (currentUser.role) {
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
    if (currentUser.role !== 'USER' && !isViewingAsAdmin) return 'Modo Colaborador';

    switch (currentUser.role) {
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
    if (currentUser.role !== 'USER' && !isViewingAsAdmin) return <Box className="w-6 h-6 text-white" />;

    if (currentUser.role === 'SUPER_ADMIN') return <Crown className="w-6 h-6 text-white" />;
    if (currentUser.role === 'IT_ADMIN') return <Shield className="w-6 h-6 text-white" />;
    if (currentUser.role === 'PURCHASING') return <ShoppingBag className="w-6 h-6 text-white" />;
    if (currentUser.role === 'GATEHOUSE') return <Truck className="w-6 h-6 text-white" />;
    if (currentUser.role === 'USER') return <Box className="w-6 h-6 text-white" />;
    return <Settings className="w-6 h-6 text-white" />;
  };

  const renderRoleIcon = () => {
     if (currentUser.role === 'MAINTENANCE') return 'bg-blue-400';
     if (currentUser.role === 'IT_ADMIN') return 'bg-purple-500';
     if (currentUser.role === 'PURCHASING') return 'bg-rose-500';
     if (currentUser.role === 'GATEHOUSE') return 'bg-amber-500';
     if (currentUser.role === 'SUPER_ADMIN') return 'bg-amber-500';
     if (currentUser.role === 'USER') return 'bg-teal-500';
     return 'bg-indigo-400';
  };

  const showPortalToggle = currentUser.role !== 'USER' && (isAdmin || currentUser.hasPortalAccess);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col font-sans transition-colors duration-200">
      {/* Header / Navbar */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-30 shadow-sm transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded-lg ${getThemeColor()} transition-colors duration-300`}>
              {renderIcon()}
            </div>
            <div>
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-800 to-gray-600 dark:from-gray-100 dark:to-gray-300">
                DutyFinder
              </span>
              <span className="hidden sm:inline text-xs text-gray-400 dark:text-gray-500 border-l border-gray-300 dark:border-gray-600 pl-2 ml-2 uppercase tracking-wide">
                {getRoleName()}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Portal View Toggle */}
            {showPortalToggle && (
              <button
                onClick={() => setAdminViewMode(prev => prev === 'ADMIN' ? 'USER' : 'ADMIN')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition border ${
                  adminViewMode === 'ADMIN' 
                    ? 'bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-800 hover:bg-teal-100 dark:hover:bg-teal-900/40' 
                    : 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800 hover:bg-purple-100 dark:hover:bg-purple-900/40'
                }`}
                title={adminViewMode === 'ADMIN' ? 'Acessar como Colaborador' : 'Voltar para Painel Principal'}
              >
                {adminViewMode === 'ADMIN' ? (
                  <>
                    <Box className="w-3 h-3" />
                    <span className="hidden md:inline">Acessar Portal</span>
                  </>
                ) : (
                  <>
                    <LayoutDashboard className="w-3 h-3" />
                    <span className="hidden md:inline">Painel Principal</span>
                  </>
                )}
              </button>
            )}

            <button
              onClick={toggleTheme}
              className="p-2 rounded-full text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 transition"
              title={theme === 'light' ? 'Ativar Modo Escuro' : 'Ativar Modo Claro'}
            >
              {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </button>

            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 px-3 py-1.5 rounded-full border border-gray-100 dark:border-gray-600">
               <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white ${renderRoleIcon()}`}>
                 <Users className="w-3 h-3" />
               </div>
               <span className="font-medium">{currentUser.name}</span>
            </div>

            <button 
              onClick={handleLogout}
              className="text-gray-400 hover:text-red-600 transition p-2 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20"
              title="Sair"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <main className="flex-1 max-w-7xl mx-auto w-full">
        {/* Render Primary Role Panels only if NOT in User Mode */}
        {adminViewMode === 'ADMIN' && currentUser.role === 'MAINTENANCE' && <MaintenancePanel currentUser={currentUser} />}
        {adminViewMode === 'ADMIN' && currentUser.role === 'WAREHOUSE' && <WarehousePanel currentUser={currentUser} />}
        {adminViewMode === 'ADMIN' && currentUser.role === 'PURCHASING' && <PurchasingPanel currentUser={currentUser} />}
        {adminViewMode === 'ADMIN' && currentUser.role === 'GATEHOUSE' && <GatehousePanel currentUser={currentUser} />}
        {adminViewMode === 'ADMIN' && isAdmin && <AdminPanel currentUser={currentUser} />}
        
        {/* Render UserPanel if explicitly USER role OR if viewing as USER */}
        {(currentUser.role === 'USER' || adminViewMode === 'USER') && (
          <UserPanel currentUser={currentUser} />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-auto transition-colors duration-200">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2 text-gray-400 text-sm">
            <Code className="w-4 h-4" />
            <span>Desenvolvido pela equipe de TI</span>
          </div>
          <div className="text-xs text-gray-400">
            &copy; {new Date().getFullYear()} DutyFinder System. Todos os direitos reservados.
          </div>
        </div>
      </footer>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
};

export default App;