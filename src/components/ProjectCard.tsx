import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { 
  ArrowLeft, 
  ExternalLink, 
  MessageSquare, 
  FolderOpen, 
  Calendar, 
  User, 
  Building2, 
  Users as UsersIcon,
  Mail,
  Send,
  Plus,
  Trash2,
  Play,
  Pause,
  Archive,
  UserPlus
} from 'lucide-react';
import { mockEvents } from '../lib/mockData';
import { toast } from 'sonner';
import { companyApi, addParticipant, getDepartments, addParticipantToProject, removeParticipantFromProject } from '../lib/companyApi';

// Локальный интерфейс для участников проекта
interface ProjectParticipant {
  id: string;
  participantId?: number;
  name: string;
  email?: string;
  telegramId?: string;
  telegramUsername?: string;
  department: string;
  departmentId?: string;
  departmentCode?: string;
  role: 'executor' | 'client';
}

interface ProjectCardProps {
  projectId: string;
  onNavigateToAlbum: (albumId: string) => void;
  onNavigateToAlbumsView: (category: 'СВОК ПД' | 'СВОК РД', projectName: string) => void;
  onBack: () => void;
}

export function ProjectCard({ projectId, onNavigateToAlbumsView, onBack }: ProjectCardProps) {
  // Состояние для загрузки данных из API
  const [project, setProject] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Состояние для альбомов из API
  const [projectAlbums, setProjectAlbums] = useState<any[]>([]);
  const projectEvents = mockEvents.filter(e => e.projectId === projectId).slice(0, 8);
  
  // Фильтрация альбомов по категории
  const pdAlbums = projectAlbums.filter(a => a.category === 'СВОК ПД');
  const rdAlbums = projectAlbums.filter(a => a.category === 'СВОК РД');
  
  // Состояние для статуса проекта
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  
  // Состояния для управления пользователями
  const [executors, setExecutors] = useState<ProjectParticipant[]>([]);
  const [clients, setClients] = useState<ProjectParticipant[]>([]);
  
  // Состояния для диалогов добавления пользователей
  const [isAddExecutorOpen, setIsAddExecutorOpen] = useState(false);
  const [isAddClientOpen, setIsAddClientOpen] = useState(false);
  
  // Списки доступных участников компании
  const [availableExecutors, setAvailableExecutors] = useState<any[]>([]);
  const [availableClients, setAvailableClients] = useState<any[]>([]);
  const [isLoadingParticipants, setIsLoadingParticipants] = useState(false);
  
  // Форма добавления пользователя из списка
  const [selectedParticipantId, setSelectedParticipantId] = useState('');
  
  // Форма создания нового пользователя
  const [departments, setDepartments] = useState<any[]>([]);
  const [newUserFirstName, setNewUserFirstName] = useState('');
  const [newUserLastName, setNewUserLastName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserTelegram, setNewUserTelegram] = useState('');
  const [newUserDepartment, setNewUserDepartment] = useState('');
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  
  // Загрузка данных проекта при монтировании компонента
  useEffect(() => {
    loadProjectDetails();
    loadProjectAlbums();
    loadDepartments();
  }, [projectId]);

  // Загружаем доступных участников когда executors/clients обновились
  useEffect(() => {
    if (!isLoading) {
      loadAvailableParticipants();
    }
  }, [executors, clients, isLoading]);

  const loadProjectAlbums = async () => {
    try {
      const companyId = localStorage.getItem('companyId');
      if (!companyId) return;

      // Загружаем все альбомы проекта (без фильтра по категории)
      const response = await companyApi.getProjectAlbums(companyId, projectId);
      
      if (response.success && response.albums) {
        setProjectAlbums(response.albums);
        console.log('📊 Loaded albums:', response.albums);
      }
    } catch (error) {
      console.error('❌ Failed to load project albums:', error);
    }
  };

  const loadProjectDetails = async () => {
    try {
      setIsLoading(true);
      const companyId = localStorage.getItem('companyId');
      
      if (!companyId) {
        toast.error('Не удалось определить компанию');
        setIsLoading(false);
        return;
      }

      const response = await companyApi.getProjectDetails(companyId, projectId);
      
      console.log('🔍 Project details response:', response);
      console.log('🔍 Executors:', response.project?.participants?.executors);
      console.log('🔍 Clients:', response.project?.participants?.clients);
      
      if (response.success && response.project) {
        setProject(response.project);
        setExecutors(response.project.participants?.executors || []);
        setClients(response.project.participants?.clients || []);
      } else {
        toast.error('Не удалось загрузить данные проекта');
      }
    } catch (error) {
      console.error('❌ Failed to load project details:', error);
      toast.error('Ошибка при загрузке проекта');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateStatus = async (newStatus: 'active' | 'pause' | 'archive') => {
    if (isUpdatingStatus) return;
    
    try {
      setIsUpdatingStatus(true);
      const companyId = localStorage.getItem('companyId');
      
      if (!companyId) {
        toast.error('Не удалось определить компанию');
        return;
      }

      await companyApi.updateProjectStatus(companyId, projectId, newStatus);
      
      // Обновляем локальный статус
      setProject((prev: any) => ({ ...prev, status: newStatus }));
      
      const statusLabels = {
        active: 'В работе',
        pause: 'На паузе',
        archive: 'В архив'
      };
      
      toast.success(`Статус проекта изменён на "${statusLabels[newStatus]}"`);
    } catch (error) {
      console.error('❌ Failed to update project status:', error);
      toast.error('Не удалось обновить статус проекта');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const loadAvailableParticipants = async () => {
    try {
      setIsLoadingParticipants(true);
      const companyId = localStorage.getItem('companyId');
      
      if (!companyId) {
        return;
      }

      const participants = await companyApi.getCompanyParticipants(companyId);
      
      if (Array.isArray(participants)) {
        const currentExecutorIds = executors.map(e => (e.participantId || e.id)?.toString());
        const currentClientIds = clients.map(c => (c.participantId || c.id)?.toString());
        
        const executorsList = participants.filter((p: any) => 
          p.roleType === 'executor' && !currentExecutorIds.includes(p.id.toString())
        );
        
        const clientsList = participants.filter((p: any) => 
          p.roleType === 'customer' && !currentClientIds.includes(p.id.toString())
        );
        
        setAvailableExecutors(executorsList);
        setAvailableClients(clientsList);
      }
    } catch (error) {
      console.error('Failed to load participants:', error);
      toast.error('Не удалось загрузить список участников');
    } finally {
      setIsLoadingParticipants(false);
    }
  };

  // Загрузка списка отделов для формы создания
  const loadDepartments = async () => {
    try {
      const response = await getDepartments();
      if (response.departments) {
        setDepartments(response.departments);
      }
    } catch (error) {
      console.error('Failed to load departments:', error);
    }
  };

  // Сброс формы создания нового пользователя
  const resetNewUserForm = () => {
    setNewUserFirstName('');
    setNewUserLastName('');
    setNewUserEmail('');
    setNewUserTelegram('');
    setNewUserDepartment('');
  };

  // Создание нового исполнителя и добавление в проект
  const handleCreateExecutor = async () => {
    if (!newUserFirstName.trim()) {
      toast.error('Введите имя');
      return;
    }

    try {
      setIsCreatingUser(true);
      const companyId = localStorage.getItem('companyId');
      if (!companyId) {
        toast.error('Не удалось определить компанию');
        return;
      }

      // Находим отдел по коду
      const department = departments.find(d => d.code === newUserDepartment);

      // Создаём участника
      const result = await addParticipant(companyId, {
        firstName: newUserFirstName.trim(),
        lastName: newUserLastName.trim(),
        email: newUserEmail.trim() || undefined,
        telegramUsername: newUserTelegram.trim().replace('@', '') || undefined,
        roleType: 'executor',
        departmentId: department?.id
      });

      if (result.success && result.participantId) {
        // Добавляем созданного участника в проект
        await addParticipantToProject(companyId, projectId, result.participantId);
        
        toast.success('Исполнитель создан и добавлен в проект');
        resetNewUserForm();
        setIsAddExecutorOpen(false);
        
        await loadProjectDetails();
      }
    } catch (error: any) {
      console.error('❌ Error creating executor:', error);
      toast.error(error.message || 'Не удалось создать исполнителя');
    } finally {
      setIsCreatingUser(false);
    }
  };

  // Создание нового заказчика и добавление в проект
  const handleCreateClient = async () => {
    if (!newUserFirstName.trim()) {
      toast.error('Введите имя');
      return;
    }

    try {
      setIsCreatingUser(true);
      const companyId = localStorage.getItem('companyId');
      if (!companyId) {
        toast.error('Не удалось определить компанию');
        return;
      }

      // Находим отдел по коду
      const department = departments.find(d => d.code === newUserDepartment);

      // Создаём участника
      const result = await addParticipant(companyId, {
        firstName: newUserFirstName.trim(),
        lastName: newUserLastName.trim(),
        email: newUserEmail.trim() || undefined,
        telegramUsername: newUserTelegram.trim().replace('@', '') || undefined,
        roleType: 'customer',
        departmentId: department?.id
      });

      if (result.success && result.participantId) {
        // Добавляем созданного участника в проект
        await addParticipantToProject(companyId, projectId, result.participantId);
        
        toast.success('Заказчик создан и добавлен в проект');
        resetNewUserForm();
        setIsAddClientOpen(false);
        
        await loadProjectDetails();
      }
    } catch (error: any) {
      console.error('❌ Error creating client:', error);
      toast.error(error.message || 'Не удалось создать заказчика');
    } finally {
      setIsCreatingUser(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <p>Загрузка данных проекта...</p>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="p-8">
        <p>Проект не найден</p>
      </div>
    );
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ru-RU', { 
      day: '2-digit', 
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getEventBadgeVariant = (type: string) => {
    switch (type) {
      case '#замечания': return 'destructive';
      case '#отклонено': return 'destructive';
      default: return 'default';
    }
  };

  // Функции управления пользователями
  const handleAddExecutor = async () => {
    if (!selectedParticipantId) {
      toast.error('Выберите исполнителя');
      return;
    }

    try {
      const companyId = localStorage.getItem('companyId');
      if (!companyId) {
        toast.error('Не удалось определить компанию');
        return;
      }

      // Добавляем участника в проект
      await addParticipantToProject(companyId, projectId, parseInt(selectedParticipantId));
      
      toast.success('Исполнитель добавлен');
      setIsAddExecutorOpen(false);
      setSelectedParticipantId('');
      
      // Перезагружаем данные проекта
      await loadProjectDetails();
    } catch (error: any) {
      console.error('❌ Error adding executor:', error);
      toast.error(error.message || 'Не удалось добавить исполнителя');
    }
  };

  const handleAddClient = async () => {
    if (!selectedParticipantId) {
      toast.error('Выберите заказчика');
      return;
    }

    try {
      const companyId = localStorage.getItem('companyId');
      if (!companyId) {
        toast.error('Не удалось определить компанию');
        return;
      }

      // Добавляем участника в проект
      await addParticipantToProject(companyId, projectId, parseInt(selectedParticipantId));
      
      toast.success('Заказчик добавлен');
      setIsAddClientOpen(false);
      setSelectedParticipantId('');
      
      // Перезагружаем данные проекта
      await loadProjectDetails();
    } catch (error: any) {
      console.error('❌ Error adding client:', error);
      toast.error('Не удалось добавить заказчика');
    }
  };

  const handleRemoveExecutor = async (id: string) => {
    try {
      const companyId = localStorage.getItem('companyId');
      if (!companyId) {
        toast.error('Не удалось определить компанию');
        return;
      }

      // Удаляем участника из проекта, а не из компании
      await removeParticipantFromProject(companyId, projectId, parseInt(id));
      toast.success('Исполнитель удалён из проекта');
      
      // Перезагружаем данные проекта
      await loadProjectDetails();
    } catch (error: any) {
      console.error('❌ Error removing executor:', error);
      toast.error(error.message || 'Не удалось удалить исполнителя');
    }
  };

  const handleRemoveClient = async (id: string) => {
    try {
      const companyId = localStorage.getItem('companyId');
      if (!companyId) {
        toast.error('Не удалось определить компанию');
        return;
      }

      // Удаляем участника из проекта, а не из компании
      await removeParticipantFromProject(companyId, projectId, parseInt(id));
      toast.success('Заказчик удалён из проекта');
      
      // Перезагружаем данные проекта
      await loadProjectDetails();
    } catch (error: any) {
      console.error('❌ Error removing client:', error);
      toast.error(error.message || 'Не удалось удалить заказчика');
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-[1600px] mx-auto">
      {/* Навигация назад */}
      <Button variant="ghost" onClick={onBack} className="mb-4 md:mb-6 gap-2 -ml-2 hover:bg-transparent hover:text-blue-600">
        <ArrowLeft className="w-4 h-4" />
        <span className="hidden sm:inline">Назад к списку проектов</span>
        <span className="sm:hidden">Назад</span>
      </Button>

      {/* Заголовок проекта - современный минималистичный дизайн */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6 shadow-sm hover:shadow-md transition-shadow">
        {/* Заголовок и статус */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <h1 className="text-2xl font-semibold text-gray-900">{project.name}</h1>
              <span className="text-sm text-gray-500 font-mono bg-gray-100 px-2 py-1 rounded">{project.code}</span>
            </div>
            
            {/* Переключатель статуса */}
            <div className="flex items-center flex-wrap gap-4">
              {/* Рубильник В работе/Пауза с анимированной подложкой */}
              <div className="relative inline-flex items-center bg-white border border-gray-200 rounded-full p-1 shadow-sm">
                {(project.status === 'active' || project.status === 'pause') && (
                  <div
                    className={`absolute top-1 h-[calc(100%-8px)] w-[calc(50%-6px)] rounded-full transition-all duration-300 ease-out ${
                      project.status === 'active'
                        ? 'left-1 bg-gradient-to-r from-emerald-100 to-emerald-200'
                        : 'left-[calc(50%+5px)] bg-gradient-to-r from-rose-100 to-rose-200'
                    }`}
                  />
                )}

                <button
                  onClick={() => handleUpdateStatus('active')}
                  disabled={isUpdatingStatus || project.status === 'active'}
                  style={project.status === 'active' ? { color: 'rgb(5, 150, 105)' } : {}}
                  className={`relative z-10 flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-full transition-colors duration-200 ${
                    project.status === 'active'
                      ? ''
                      : 'text-gray-600 hover:text-gray-900'
                  } disabled:cursor-not-allowed`}
                >
                  <Play className="w-4 h-4" />
                  В работе
                </button>

                <button
                  onClick={() => handleUpdateStatus('pause')}
                  disabled={isUpdatingStatus || project.status === 'pause'}
                  style={project.status === 'pause' ? { color: 'rgb(225, 29, 72)' } : {}}
                  className={`relative z-10 flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-full transition-colors duration-200 ${
                    project.status === 'pause'
                      ? ''
                      : 'text-gray-600 hover:text-gray-900'
                  } disabled:cursor-not-allowed`}
                >
                  <Pause className="w-4 h-4" />
                  Пауза
                </button>
              </div>

              {/* Кнопка архивации */}
              <button
                onClick={() => handleUpdateStatus('archive')}
                disabled={isUpdatingStatus || project.status === 'archive'}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-colors duration-200 ${
                  project.status === 'archive'
                    ? 'bg-black text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <Archive className="w-4 h-4" />
                В архив
              </button>

              {/* Кнопка Telegram-канала */}
              {project.telegramChannel && project.telegramChannel.chatId ? (
                <a
                  href={`https://web.telegram.org/a/#${project.telegramChannel.chatId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-colors duration-200 bg-blue-100 text-blue-700 hover:bg-blue-200"
                >
                  <MessageSquare className="w-4 h-4" />
                  Telegram-канал
                </a>
              ) : (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-colors duration-200 bg-gray-100 text-gray-400 cursor-not-allowed">
                        <MessageSquare className="w-4 h-4" />
                        Telegram-канал
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Канал не привязан. Добавьте бота @klamonline_bot в канал проекта.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
          </div>
        </div>
        
        {/* Основная информация - плоский дизайн */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Заказчик</div>
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-gray-400" />
              <p className="text-base text-gray-900">{project.customerCompanyName || 'Не указан'}</p>
            </div>
          </div>
          
          <div>
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Дата создания</div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-400" />
              <p className="text-base text-gray-900">{formatDate(project.createdAt)}</p>
            </div>
          </div>
        </div>

        {/* Отделы - минималистичный стиль */}
        {project.departments && project.departments.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Building2 className="w-4 h-4 text-gray-400" />
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Задействованные отделы</div>
            </div>
            <div className="flex flex-wrap gap-2">
              {project.departments.map((dept: any, index: number) => (
                <span key={index} className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full">
                  {dept.name}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Участники проекта */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Исполнители */}
        <Card className="shadow-sm border-gray-200">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-white border-b">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <UsersIcon className="w-5 h-5 text-blue-600" />
                Исполнители ({executors.length})
              </CardTitle>
              <Button 
                size="sm" 
                variant="outline" 
                className="gap-2 hover:bg-blue-50"
                onClick={() => setIsAddExecutorOpen(true)}
              >
                <Plus className="w-4 h-4" />
                Добавить
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {executors.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <UsersIcon className="w-12 h-12 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Нет исполнителей</p>
              </div>
            ) : (
              <div className="space-y-3">
                {executors.map((executor) => (
                  <div key={executor.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors group">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-indigo-400 flex items-center justify-center text-white font-medium">
                      {executor.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{executor.name}</p>
                      <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                        <span className="flex items-center gap-1">
                          <Building2 className="w-3 h-3" />
                          {executor.department}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {executor.email && (
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title={executor.email}>
                          <Mail className="w-4 h-4 text-gray-400" />
                        </Button>
                      )}
                      {executor.telegramId && (
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title={executor.telegramId}>
                          <Send className="w-4 h-4 text-gray-400" />
                        </Button>
                      )}
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity" 
                        onClick={() => handleRemoveExecutor(executor.id)}
                        title="Удалить"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Заказчики */}
        <Card className="shadow-sm border-gray-200">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-white border-b">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="w-5 h-5 text-purple-600" />
                Заказчики ({clients.length})
              </CardTitle>
              <Button 
                size="sm" 
                variant="outline" 
                className="gap-2 hover:bg-purple-50"
                onClick={() => setIsAddClientOpen(true)}
              >
                <Plus className="w-4 h-4" />
                Добавить
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {clients.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <User className="w-12 h-12 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Нет заказчиков</p>
              </div>
            ) : (
              <div className="space-y-3">
                {clients.map((client) => (
                  <div key={client.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors group">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-medium">
                      {client.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{client.name}</p>
                      <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                        <span className="flex items-center gap-1">
                          <Building2 className="w-3 h-3" />
                          {client.department}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {client.email && (
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title={client.email}>
                          <Mail className="w-4 h-4 text-gray-400" />
                        </Button>
                      )}
                      {client.telegramId && (
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title={client.telegramId}>
                          <Send className="w-4 h-4 text-gray-400" />
                        </Button>
                      )}
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity" 
                        onClick={() => handleRemoveClient(client.id)}
                        title="Удалить"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Диалог добавления исполнителя */}
      <Dialog open={isAddExecutorOpen} onOpenChange={(open) => {
        setIsAddExecutorOpen(open);
        if (open) {
          loadAvailableParticipants();
          loadDepartments();
        } else {
          setSelectedParticipantId('');
          resetNewUserForm();
        }
      }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Добавить исполнителя</DialogTitle>
            <DialogDescription>
              Выберите из списка или создайте нового
            </DialogDescription>
          </DialogHeader>
          
          <Tabs defaultValue="existing" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="existing" className="gap-2">
                <UsersIcon className="w-4 h-4" />
                Из списка
              </TabsTrigger>
              <TabsTrigger value="new" className="gap-2">
                <UserPlus className="w-4 h-4" />
                Создать
              </TabsTrigger>
            </TabsList>

            <TabsContent value="existing" className="space-y-4 py-4">
              {isLoadingParticipants ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-sm text-gray-500 mt-2">Загрузка...</p>
                </div>
              ) : availableExecutors.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <UsersIcon className="w-12 h-12 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Нет доступных исполнителей</p>
                  <p className="text-xs mt-1">Создайте нового во вкладке "Создать"</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label>Выберите исполнителя *</Label>
                  <Select value={selectedParticipantId} onValueChange={setSelectedParticipantId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите из списка" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableExecutors.map((participant: any) => (
                        <SelectItem key={participant.id} value={participant.id.toString()}>
                          <div className="flex flex-col">
                            <span className="font-medium">
                              {participant.firstName} {participant.lastName}
                            </span>
                            <span className="text-xs text-gray-500">
                              {participant.email} {participant.department?.name ? `• ${participant.department.name}` : ''}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="flex gap-3 pt-2">
                <Button 
                  variant="outline" 
                  onClick={() => { 
                    setIsAddExecutorOpen(false); 
                    setSelectedParticipantId('');
                  }} 
                  className="flex-1"
                >
                  Отмена
                </Button>
                <Button 
                  onClick={handleAddExecutor} 
                  className="flex-1"
                  disabled={!selectedParticipantId || isLoadingParticipants}
                >
                  Добавить
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="new" className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="exec-first-name">Имя *</Label>
                  <Input
                    id="exec-first-name"
                    placeholder="Иван"
                    value={newUserFirstName}
                    onChange={(e) => setNewUserFirstName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="exec-last-name">Фамилия</Label>
                  <Input
                    id="exec-last-name"
                    placeholder="Иванов"
                    value={newUserLastName}
                    onChange={(e) => setNewUserLastName(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="exec-email">Email</Label>
                <Input
                  id="exec-email"
                  type="email"
                  placeholder="ivan@company.ru"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="exec-telegram">Telegram</Label>
                <Input
                  id="exec-telegram"
                  placeholder="@username"
                  value={newUserTelegram}
                  onChange={(e) => setNewUserTelegram(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="exec-department">Отдел</Label>
                <Select value={newUserDepartment} onValueChange={setNewUserDepartment}>
                  <SelectTrigger id="exec-department">
                    <SelectValue placeholder="Выберите отдел" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.length === 0 && (
                      <SelectItem value="_loading" disabled>Загрузка...</SelectItem>
                    )}
                    {departments.map((dept: any) => (
                      <SelectItem key={dept.id} value={dept.code}>
                        {dept.name} ({dept.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex gap-3 pt-2">
                <Button 
                  variant="outline" 
                  onClick={() => { 
                    setIsAddExecutorOpen(false); 
                    resetNewUserForm();
                  }} 
                  className="flex-1"
                >
                  Отмена
                </Button>
                <Button 
                  onClick={handleCreateExecutor} 
                  className="flex-1"
                  disabled={!newUserFirstName.trim() || isCreatingUser}
                >
                  {isCreatingUser ? 'Создание...' : 'Создать'}
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Диалог добавления заказчика */}
      <Dialog open={isAddClientOpen} onOpenChange={(open) => {
        setIsAddClientOpen(open);
        if (!open) {
          setSelectedParticipantId('');
          resetNewUserForm();
        }
      }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Добавить заказчика</DialogTitle>
            <DialogDescription>
              Выберите из списка или создайте нового
            </DialogDescription>
          </DialogHeader>
          
          <Tabs defaultValue="existing" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="existing" className="gap-2">
                <User className="w-4 h-4" />
                Из списка
              </TabsTrigger>
              <TabsTrigger value="new" className="gap-2">
                <UserPlus className="w-4 h-4" />
                Создать
              </TabsTrigger>
            </TabsList>

            <TabsContent value="existing" className="space-y-4 py-4">
              {isLoadingParticipants ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
                  <p className="text-sm text-gray-500 mt-2">Загрузка...</p>
                </div>
              ) : availableClients.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <User className="w-12 h-12 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Нет доступных заказчиков</p>
                  <p className="text-xs mt-1">Создайте нового во вкладке "Создать"</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label>Выберите заказчика *</Label>
                  <Select value={selectedParticipantId} onValueChange={setSelectedParticipantId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите из списка" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableClients.map((participant: any) => (
                        <SelectItem key={participant.id} value={participant.id.toString()}>
                          <div className="flex flex-col">
                            <span className="font-medium">
                              {participant.firstName} {participant.lastName}
                            </span>
                            <span className="text-xs text-gray-500">
                              {participant.email} {participant.department?.name ? `• ${participant.department.name}` : ''}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="flex gap-3 pt-2">
                <Button 
                  variant="outline" 
                  onClick={() => { 
                    setIsAddClientOpen(false); 
                    setSelectedParticipantId('');
                  }} 
                  className="flex-1"
                >
                  Отмена
                </Button>
                <Button 
                  onClick={handleAddClient} 
                  className="flex-1"
                  disabled={!selectedParticipantId || isLoadingParticipants}
                >
                  Добавить
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="new" className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="client-first-name">Имя *</Label>
                  <Input
                    id="client-first-name"
                    placeholder="Иван"
                    value={newUserFirstName}
                    onChange={(e) => setNewUserFirstName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="client-last-name">Фамилия</Label>
                  <Input
                    id="client-last-name"
                    placeholder="Иванов"
                    value={newUserLastName}
                    onChange={(e) => setNewUserLastName(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="client-email">Email</Label>
                <Input
                  id="client-email"
                  type="email"
                  placeholder="ivan@company.ru"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="client-telegram">Telegram</Label>
                <Input
                  id="client-telegram"
                  placeholder="@username"
                  value={newUserTelegram}
                  onChange={(e) => setNewUserTelegram(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="client-department">Отдел</Label>
                <Select value={newUserDepartment} onValueChange={setNewUserDepartment}>
                  <SelectTrigger id="client-department">
                    <SelectValue placeholder="Выберите отдел" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.length === 0 && (
                      <SelectItem value="_loading" disabled>Загрузка...</SelectItem>
                    )}
                    {departments.map((dept: any) => (
                      <SelectItem key={dept.id} value={dept.code}>
                        {dept.name} ({dept.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex gap-3 pt-2">
                <Button 
                  variant="outline" 
                  onClick={() => { 
                    setIsAddClientOpen(false); 
                    resetNewUserForm();
                  }} 
                  className="flex-1"
                >
                  Отмена
                </Button>
                <Button 
                  onClick={handleCreateClient} 
                  className="flex-1"
                  disabled={!newUserFirstName.trim() || isCreatingUser}
                >
                  {isCreatingUser ? 'Создание...' : 'Создать'}
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Альбомы - упрощенный дизайн */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Альбомы проекта</h2>
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => onNavigateToAlbumsView('СВОК ПД', project?.name || '')}
            className="group bg-white border-2 border-gray-200 rounded-xl p-3 hover:border-blue-400 hover:shadow-md transition-all text-left"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                  <FolderOpen className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">СВОК ПД</h3>
                  <p className="text-xs text-gray-500">Проектная документация</p>
                </div>
              </div>
              <ExternalLink className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-gray-900">{pdAlbums.length}</span>
              <span className="text-sm text-gray-500">альбомов</span>
            </div>
          </button>
          
          <button
            onClick={() => onNavigateToAlbumsView('СВОК РД', project?.name || '')}
            className="group bg-white border-2 border-gray-200 rounded-xl p-3 hover:border-blue-400 hover:shadow-md transition-all text-left"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center group-hover:bg-indigo-200 transition-colors">
                  <FolderOpen className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">СВОК РД</h3>
                  <p className="text-xs text-gray-500">Рабочая документация</p>
                </div>
              </div>
              <ExternalLink className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-gray-900">{rdAlbums.length}</span>
              <span className="text-sm text-gray-500">альбомов</span>
            </div>
          </button>
        </div>
      </div>

      {/* История событий - компактный дизайн */}
      {projectEvents.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Последние события</h2>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="divide-y divide-gray-100">
              {projectEvents.map((event) => (
                <div key={event.id} className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors">
                  <Badge 
                    variant={getEventBadgeVariant(event.type)}
                    className="shrink-0"
                  >
                    {event.type}
                  </Badge>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 truncate">{event.comment}</p>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-500 shrink-0">
                    <span>{event.user}</span>
                    <span>•</span>
                    <span>{formatDateTime(event.date)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}