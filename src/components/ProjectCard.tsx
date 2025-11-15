import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
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
  Trash2
} from 'lucide-react';
import { mockEvents } from '../lib/mockData';
import { User as UserType } from '../App';
import { toast } from 'sonner';
import { companyApi } from '../lib/companyApi';

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
  
  // Состояния для управления пользователями
  const [executors, setExecutors] = useState<UserType[]>([]);
  const [clients, setClients] = useState<UserType[]>([]);
  
  // Состояния для диалогов добавления пользователей
  const [isAddExecutorOpen, setIsAddExecutorOpen] = useState(false);
  const [isAddClientOpen, setIsAddClientOpen] = useState(false);
  
  // Списки доступных участников компании
  const [availableExecutors, setAvailableExecutors] = useState<any[]>([]);
  const [availableClients, setAvailableClients] = useState<any[]>([]);
  const [isLoadingParticipants, setIsLoadingParticipants] = useState(false);
  
  // Форма добавления пользователя
  const [selectedParticipantId, setSelectedParticipantId] = useState('');

  // Загрузка данных проекта при монтировании компонента
  useEffect(() => {
    loadProjectDetails();
    loadProjectAlbums();
  }, [projectId]);

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

  const loadAvailableParticipants = async () => {
    try {
      setIsLoadingParticipants(true);
      const companyId = localStorage.getItem('companyId');
      
      if (!companyId) {
        return;
      }

      const response = await companyApi.getCompanyParticipants(companyId);
      
      if (response.success && response.participants) {
        // Фильтруем участников, которые ещё не добавлены в проект
        const currentExecutorIds = executors.map(e => e.id);
        const currentClientIds = clients.map(c => c.id);
        
        const executorsList = response.participants
          .filter((p: any) => p.roleType === 'executor' && !currentExecutorIds.includes(p.id.toString()));
        
        const clientsList = response.participants
          .filter((p: any) => p.roleType === 'customer' && !currentClientIds.includes(p.id.toString()));
        
        setAvailableExecutors(executorsList);
        setAvailableClients(clientsList);
      }
    } catch (error) {
      console.error('❌ Failed to load participants:', error);
      toast.error('Не удалось загрузить список участников');
    } finally {
      setIsLoadingParticipants(false);
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

      // TODO: Добавить API для добавления участника в проект
      // await companyApi.addParticipantToProject(companyId, projectId, selectedParticipantId);
      
      toast.success('Исполнитель добавлен');
      setIsAddExecutorOpen(false);
      setSelectedParticipantId('');
      
      // Перезагружаем данные проекта
      await loadProjectDetails();
    } catch (error) {
      console.error('❌ Error adding executor:', error);
      toast.error('Не удалось добавить исполнителя');
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

      // TODO: Добавить API для добавления участника в проект
      // await companyApi.addParticipantToProject(companyId, projectId, selectedParticipantId);
      
      toast.success('Заказчик добавлен');
      setIsAddClientOpen(false);
      setSelectedParticipantId('');
      
      // Перезагружаем данные проекта
      await loadProjectDetails();
    } catch (error) {
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

      await companyApi.deleteParticipant(companyId, id);
      toast.success('Исполнитель удалён из всех проектов');
      
      // Перезагружаем данные проекта
      await loadProjectDetails();
    } catch (error) {
      console.error('❌ Error removing executor:', error);
      toast.error('Не удалось удалить исполнителя');
    }
  };

  const handleRemoveClient = async (id: string) => {
    try {
      const companyId = localStorage.getItem('companyId');
      if (!companyId) {
        toast.error('Не удалось определить компанию');
        return;
      }

      await companyApi.deleteParticipant(companyId, id);
      toast.success('Заказчик удалён из всех проектов');
      
      // Перезагружаем данные проекта
      await loadProjectDetails();
    } catch (error) {
      console.error('❌ Error removing client:', error);
      toast.error('Не удалось удалить заказчика');
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

      {/* Заголовок проекта - улучшенный дизайн */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 md:p-6 mb-4 md:mb-6 border border-blue-100">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <Badge variant="default" className="text-xs">
                Активный
              </Badge>
              <span className="text-sm text-gray-600 font-mono">{project.code}</span>
            </div>
            <h1 className="text-gray-900 mb-2">{project.name}</h1>
          </div>
        </div>
        
        {/* Основная информация в сетке */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-white rounded-lg p-3 border border-gray-200">
            <div className="flex items-center gap-2 text-gray-500 mb-1">
              <User className="w-4 h-4" />
              <span className="text-xs">Заказчик</span>
            </div>
            <p className="text-sm font-medium text-gray-900">{project.customerCompanyName || 'Не указан'}</p>
          </div>
          
          <div className="bg-white rounded-lg p-3 border border-gray-200">
            <div className="flex items-center gap-2 text-gray-500 mb-1">
              <Calendar className="w-4 h-4" />
              <span className="text-xs">Создан</span>
            </div>
            <p className="text-sm font-medium text-gray-900">{formatDate(project.createdAt)}</p>
          </div>
        </div>

        {/* Отделы */}
        {project.departments && project.departments.length > 0 && (
          <div className="bg-white rounded-lg p-3 border border-gray-200 mb-4">
            <div className="flex items-center gap-2 text-gray-500 mb-2">
              <Building2 className="w-4 h-4" />
              <span className="text-xs">Задействованные отделы</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {project.departments.map((dept: any, index: number) => (
                <Badge key={index} variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                  {dept.name}
                </Badge>
              ))}
            </div>
          </div>
        )}
        
        {/* Ссылки */}
        {project.telegramChannel && (
          <div className="flex gap-2">
            {project.telegramChannel.inviteLink && (
              <Button variant="outline" size="sm" className="gap-2 bg-white hover:bg-blue-50 border-gray-300" asChild>
                <a href={project.telegramChannel.inviteLink} target="_blank" rel="noopener noreferrer">
                  <MessageSquare className="w-4 h-4" />
                  Telegram канал
                </a>
              </Button>
            )}
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
          <CardContent className="pt-4">
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
          <CardContent className="pt-4">
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
        } else {
          setSelectedParticipantId('');
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Добавить исполнителя</DialogTitle>
            <DialogDescription>
              Выберите исполнителя из списка участников компании
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {isLoadingParticipants ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-sm text-gray-500 mt-2">Загрузка...</p>
              </div>
            ) : availableExecutors.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <UsersIcon className="w-12 h-12 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Нет доступных исполнителей</p>
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
                            {participant.email} {participant.departmentName ? `• ${participant.departmentName}` : ''}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <div className="flex gap-3">
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
        </DialogContent>
      </Dialog>

      {/* Диалог добавления заказчика */}
      <Dialog open={isAddClientOpen} onOpenChange={(open) => {
        setIsAddClientOpen(open);
        if (open) {
          loadAvailableParticipants();
        } else {
          setSelectedParticipantId('');
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Добавить заказчика</DialogTitle>
            <DialogDescription>
              Выберите заказчика из списка участников компании
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {isLoadingParticipants ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
                <p className="text-sm text-gray-500 mt-2">Загрузка...</p>
              </div>
            ) : availableClients.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <User className="w-12 h-12 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Нет доступных заказчиков</p>
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
                            {participant.email} {participant.departmentName ? `• ${participant.departmentName}` : ''}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <div className="flex gap-3">
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
        </DialogContent>
      </Dialog>

      {/* Альбомы - упрощенный дизайн */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Альбомы проекта</h2>
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => onNavigateToAlbumsView('СВОК ПД', project?.name || '')}
            className="group bg-white border-2 border-gray-200 rounded-xl p-6 hover:border-blue-400 hover:shadow-md transition-all text-left"
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
            className="group bg-white border-2 border-gray-200 rounded-xl p-6 hover:border-blue-400 hover:shadow-md transition-all text-left"
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