import { useState } from 'react';
import { LayoutDashboard, FolderKanban, Users, Settings, FileText, LogOut, ChevronLeft, ChevronRight, FolderTree } from 'lucide-react';
import { Button } from './ui/button';
import { Page } from '../App';
import { Resizable } from 're-resizable';

interface SidebarProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  onLogout: () => void;
}

export function Sidebar({ currentPage, onNavigate, onLogout }: SidebarProps) {
  const [sidebarWidth, setSidebarWidth] = useState(256);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const menuItems = [
    { id: 'dashboard' as Page, label: 'Главная', icon: LayoutDashboard },
    { id: 'projects' as Page, label: 'Проекты', icon: FolderKanban },
    { id: 'sections' as Page, label: 'Разделы', icon: FolderTree },
    { id: 'users' as Page, label: 'Пользователи', icon: Users },
    { id: 'reports' as Page, label: 'Отчёты', icon: FileText },
    { id: 'settings' as Page, label: 'Настройки', icon: Settings },
  ];

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  const effectiveWidth = isCollapsed ? 80 : sidebarWidth;

  return (
    <>
      {/* Мобильное нижнее меню (Bottom Navigation) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 safe-area-bottom">
        <nav className="flex items-center justify-around px-0 py-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`flex flex-col items-center justify-center gap-0.5 px-2 py-2 rounded-lg transition-all ${
                  isActive 
                    ? 'text-blue-600' 
                    : 'text-gray-600'
                }`}
                title={item.label}
              >
                <div className={`relative ${isActive ? 'scale-110' : ''} transition-transform`}>
                  <Icon className="w-6 h-6" />
                  {isActive && (
                    <div className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-blue-600" />
                  )}
                </div>
                <span className={`text-[10px] leading-tight ${isActive ? 'font-medium' : ''} hidden xs:block`}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Десктопное меню */}
      <Resizable
        size={{ width: effectiveWidth, height: '100%' }}
        minWidth={isCollapsed ? 80 : 200}
        maxWidth={isCollapsed ? 80 : 400}
        enable={{ 
          top: false, 
          right: !isCollapsed, 
          bottom: false, 
          left: false, 
          topRight: false, 
          bottomRight: false, 
          bottomLeft: false, 
          topLeft: false 
        }}
        onResizeStop={(e, direction, ref, d) => {
          if (!isCollapsed) {
            setSidebarWidth(sidebarWidth + d.width);
          }
        }}
        className="hidden md:flex bg-white border-r border-gray-200 flex-col relative"
        handleStyles={{
          right: {
            width: '4px',
            right: 0,
            cursor: 'col-resize',
          }
        }}
        handleClasses={{
          right: 'hover:bg-blue-400 transition-colors'
        }}
      >
        {/* Заголовок */}
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          {!isCollapsed && <h1 className="text-blue-600">klam.online</h1>}
          {isCollapsed && <div className="text-blue-600 text-xl mx-auto">K</div>}
        </div>

        {/* Кнопка сворачивания/разворачивания */}
        <div className="absolute top-6 -right-3 z-10">
          <button
            onClick={toggleCollapse}
            className="w-6 h-6 bg-white border border-gray-200 rounded-full flex items-center justify-center hover:bg-blue-50 hover:border-blue-300 transition-all shadow-sm"
            title={isCollapsed ? 'Развернуть меню' : 'Свернуть меню'}
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4 text-gray-600" />
            ) : (
              <ChevronLeft className="w-4 h-4 text-gray-600" />
            )}
          </button>
        </div>

        {/* Меню */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive 
                    ? 'bg-blue-50 text-blue-600' 
                    : 'text-gray-700 hover:bg-gray-50'
                } ${isCollapsed ? 'justify-center' : ''}`}
                title={isCollapsed ? item.label : ''}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {!isCollapsed && <span>{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* Кнопка выхода */}
        <div className="p-4 border-t border-gray-200">
          <Button
            variant="ghost"
            className={`w-full gap-3 ${isCollapsed ? 'justify-center px-0' : 'justify-start'}`}
            onClick={onLogout}
            title={isCollapsed ? 'Выйти' : ''}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {!isCollapsed && <span>Выйти</span>}
          </Button>
        </div>
      </Resizable>
    </>
  );
}