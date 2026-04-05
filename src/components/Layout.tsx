import React from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  Utensils, 
  MessageSquare, 
  ShieldAlert, 
  Zap, 
  LogOut, 
  User as UserIcon,
  ChefHat
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab }) => {
  const { user, logout } = useAuth();

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'student'] },
    { id: 'mess', label: 'Mess Details', icon: Utensils, roles: ['admin', 'student'] },
    { id: 'feedback', label: 'Feedback', icon: MessageSquare, roles: ['admin', 'student'] },
    { id: 'portfolio', label: 'My Portfolio', icon: UserIcon, roles: ['student'] },
    { id: 'audit', label: 'Audit Logs', icon: ShieldAlert, roles: ['admin'] },
    { id: 'performance', label: 'Performance', icon: Zap, roles: ['admin'] },
    { id: 'bplus', label: 'B+ Students', icon: UserIcon, roles: ['admin'] },
  ];

  const filteredMenu = menuItems.filter(item => item.roles.includes(user?.role || ''));

  return (
    <div className="flex h-screen bg-[#F9F9F9]">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-100 flex flex-col">
        <div className="p-6 flex items-center gap-3">
          <div className="w-10 h-10 bg-sage rounded-xl flex items-center justify-center text-white">
            <ChefHat size={24} />
          </div>
          <span className="text-xl font-heading font-bold text-sage">DINEWELL</span>
        </div>

        <nav className="flex-1 px-4 space-y-1">
          {filteredMenu.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
                activeTab === item.id 
                  ? "bg-sage text-white shadow-md" 
                  : "text-gray-500 hover:bg-gray-50 hover:text-sage"
              )}
            >
              <item.icon size={20} />
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-100">
          <div className="flex items-center gap-3 px-4 py-3 mb-2">
            <div className="w-8 h-8 bg-terracotta/20 text-terracotta rounded-full flex items-center justify-center font-bold">
              {user?.name?.[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{user?.name}</p>
              <p className="text-xs text-gray-400 truncate capitalize">{user?.role}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 transition-colors"
          >
            <LogOut size={20} />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="glass-header px-8 py-4 flex items-center justify-between">
          <h2 className="text-xl font-heading font-bold text-gray-800">
            {menuItems.find(i => i.id === activeTab)?.label}
          </h2>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-xs text-gray-400">IIT Gandhinagar</p>
              <p className="text-sm font-medium">Mess Management System</p>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8">
          {children}
        </div>
      </main>
    </div>
  );
};
