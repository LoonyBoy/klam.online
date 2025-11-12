import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Input } from './ui/input';
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
  MapPin, 
  Users as UsersIcon,
  Mail,
  Send,
  Briefcase,
  Plus,
  Trash2
} from 'lucide-react';
import { mockProjects, mockAlbums, mockEvents } from '../lib/mockData';
import { AlbumsTable } from './AlbumsTable';
import { User as UserType } from '../App';
import { toast } from 'sonner';

interface ProjectCardProps {
  projectId: string;
  onNavigateToAlbum: (albumId: string) => void;
  onNavigateToAlbumsView: (category: 'СВОК ПД' | 'СВОК РД') => void;
  onBack: () => void;
}

export function ProjectCard({ projectId, onNavigateToAlbum, onNavigateToAlbumsView, onBack }: ProjectCardProps) {
  const project = mockProjects.find(p => p.id === projectId);
  const projectAlbums = mockAlbums.filter(a => a.projectId === projectId);
  const projectEvents = mockEvents.filter(e => e.projectId === projectId).slice(0, 8);
  
  // Состояния для отображения категорий
  const [selectedCategory, setSelectedCategory] = useState<'СВОК ПД' | 'СВОК РД' | null>('СВОК ПД');
  const [isExpanded, setIsExpanded] = useState(false);

  // Состояния для управления пользователями
  const [executors, setExecutors] = useState<UserType[]>(project?.projectUsers?.executors || []);
  const [clients, setClients] = useState<UserType[]>(project?.projectUsers?.clients || []);
  
  // Состояния для диалогов добавления пользователей
  const [isAddExecutorOpen, setIsAddExecutorOpen] = useState(false);
  const [isAddClientOpen, setIsAddClientOpen] = useState(false);
  
  // Форма добавления пользователя
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserTelegram, setNewUserTelegram] = useState('');
  const [newUserDepartment, setNewUserDepartment] = useState('');

  if (!project) {
    return (
      <div className="p-8">
        <p>Проект не найден</p>
      </div>
    );
  }

  // Фильтрация альбомов по категории
  const pdAlbums = projectAlbums.filter(a => a.category === 'СВОК ПД');
  const rdAlbums = projectAlbums.filter(a => a.category === 'СВОК РД');
  
  const displayedAlbums = selectedCategory 
    ? projectAlbums.filter(a => a.category === selectedCategory)
    : [];

  const handleCategoryToggle = (category: 'СВОК ПД' | 'СВОК РД') => {
    if (selectedCategory === category) {
      setIsExpanded(!isExpanded);
    } else {
      setSelectedCategory(category);
      setIsExpanded(false);
    }
  };

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

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'В работе': return 'default';
      case 'На проверке': return 'default';
      case 'Принято': return 'default';
      case 'Замечания': return 'destructive';
      default: return 'default';
    }
  };

  const getEventBadgeVariant = (type: string) => {
    switch (type) {
      case '#замечания': return 'destructive';
      case '#отклонено': return 'destructive';
      default: return 'default';
    }
  };

  // Функции управления пользователями
  const handleAddExecutor = () => {
    if (!newUserName || !newUserEmail || !newUserDepartment) {
      toast.error('Заполните все обязательные поля');
      return;
    }

    const newExecutor: UserType = {
      id: Date.now().toString(),
      name: newUserName,
      email: newUserEmail,
      telegramId: newUserTelegram,
      role: 'executor',
      department: newUserDepartment
    };

    setExecutors([...executors, newExecutor]);
    setIsAddExecutorOpen(false);
    resetForm();
    toast.success('Исполнитель добавлен');
  };

  const handleAddClient = () => {
    if (!newUserName || !newUserEmail || !newUserDepartment) {
      toast.error('Заполните все обязательные поля');
      return;
    }

    const newClient: UserType = {
      id: Date.now().toString(),
      name: newUserName,
      email: newUserEmail,
      telegramId: newUserTelegram,
      role: 'client',
      department: newUserDepartment
    };

    setClients([...clients, newClient]);
    setIsAddClientOpen(false);
    resetForm();
    toast.success('Заказчик добавлен');
  };

  const handleRemoveExecutor = (id: string) => {
    setExecutors(executors.filter(e => e.id !== id));
    toast.success('Исполнитель удалён');
  };

  const handleRemoveClient = (id: string) => {
    setClients(clients.filter(c => c.id !== id));
    toast.success('Заказчик удалён');
  };

  const resetForm = () => {
    setNewUserName('');
    setNewUserEmail('');
    setNewUserTelegram('');
    setNewUserDepartment('');
  };

  const departments = project.departments || ['Архитектура', 'Конструкции', 'ОВиК', 'ВК', 'ЭОМ'];

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
              <Badge variant={project.status === 'Активный' ? 'default' : 'destructive'} className="text-xs">
                {project.status}
              </Badge>
              <span className="text-sm text-gray-600 font-mono">{project.code}</span>
            </div>
            <h1 className="text-gray-900 mb-2">{project.name}</h1>
            {project.address && (
              <div className="flex items-center gap-2 text-gray-600">
                <MapPin className="w-4 h-4" />
                <span className="text-sm">{project.address}</span>
              </div>
            )}
          </div>
        </div>
        
        {/* Основная информация в сетке */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-white rounded-lg p-3 border border-gray-200">
            <div className="flex items-center gap-2 text-gray-500 mb-1">
              <User className="w-4 h-4" />
              <span className="text-xs">Заказчик</span>
            </div>
            <p className="text-sm font-medium text-gray-900">{project.client}</p>
          </div>
          
          <div className="bg-white rounded-lg p-3 border border-gray-200">
            <div className="flex items-center gap-2 text-gray-500 mb-1">
              <Calendar className="w-4 h-4" />
              <span className="text-xs">Дедлайн</span>
            </div>
            <p className="text-sm font-medium text-gray-900">{formatDate(project.deadline)}</p>
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
              {project.departments.map((dept, index) => (
                <Badge key={index} variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                  {dept}
                </Badge>
              ))}
            </div>
          </div>
        )}
        
        {/* Ссылки */}
        {(project.telegramLink || project.driveLink) && (
          <div className="flex gap-2">
            {project.telegramLink && (
              <Button variant="outline" size="sm" className="gap-2 bg-white hover:bg-blue-50 border-gray-300" asChild>
                <a href={project.telegramLink} target="_blank" rel="noopener noreferrer">
                  <MessageSquare className="w-4 h-4" />
                  Telegram канал
                </a>
              </Button>
            )}
            {project.driveLink && (
              <Button variant="outline" size="sm" className="gap-2 bg-white hover:bg-blue-50 border-gray-300" asChild>
                <a href={project.driveLink} target="_blank" rel="noopener noreferrer">
                  <FolderOpen className="w-4 h-4" />
                  Облачное хранилище
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
      <Dialog open={isAddExecutorOpen} onOpenChange={setIsAddExecutorOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Добавить исполнителя</DialogTitle>
            <DialogDescription>
              Заполните информацию о новом исполнителе проекта
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="exec-name">Имя и фамилия *</Label>
              <Input 
                id="exec-name" 
                placeholder="Иванов Иван"
                value={newUserName}
                onChange={(e) => setNewUserName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="exec-email">Email *</Label>
              <Input 
                id="exec-email" 
                type="email"
                placeholder="ivanov@company.ru"
                value={newUserEmail}
                onChange={(e) => setNewUserEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="exec-telegram">Telegram</Label>
              <Input 
                id="exec-telegram" 
                placeholder="@ivanov"
                value={newUserTelegram}
                onChange={(e) => setNewUserTelegram(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="exec-department">Отдел *</Label>
              <Select value={newUserDepartment} onValueChange={setNewUserDepartment}>
                <SelectTrigger id="exec-department">
                  <SelectValue placeholder="Выберите отдел" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((dept) => (
                    <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => { setIsAddExecutorOpen(false); resetForm(); }} className="flex-1">
              Отмена
            </Button>
            <Button onClick={handleAddExecutor} className="flex-1">
              Добавить
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Диалог добавления заказчика */}
      <Dialog open={isAddClientOpen} onOpenChange={setIsAddClientOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Добавить заказчика</DialogTitle>
            <DialogDescription>
              Заполните информацию о новом представителе заказчика
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="client-name">Имя и фамилия *</Label>
              <Input 
                id="client-name" 
                placeholder="Петров Петр"
                value={newUserName}
                onChange={(e) => setNewUserName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="client-email">Email *</Label>
              <Input 
                id="client-email" 
                type="email"
                placeholder="petrov@client.ru"
                value={newUserEmail}
                onChange={(e) => setNewUserEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="client-telegram">Telegram</Label>
              <Input 
                id="client-telegram" 
                placeholder="@petrov"
                value={newUserTelegram}
                onChange={(e) => setNewUserTelegram(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="client-department">Отдел *</Label>
              <Input 
                id="client-department" 
                placeholder="Отдел заказчика"
                value={newUserDepartment}
                onChange={(e) => setNewUserDepartment(e.target.value)}
              />
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => { setIsAddClientOpen(false); resetForm(); }} className="flex-1">
              Отмена
            </Button>
            <Button onClick={handleAddClient} className="flex-1">
              Добавить
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Альбомы - упрощенный дизайн */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Альбомы проекта</h2>
        {projectAlbums.length === 0 ? (
          <div className="text-center py-16 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white mb-4 shadow-sm">
              <FolderOpen className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-600 mb-1">Нет альбомов</p>
            <p className="text-sm text-gray-400">Альбомы добавляются в таблице при просмотре категории</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => onNavigateToAlbumsView('СВОК ПД')}
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
              onClick={() => onNavigateToAlbumsView('СВОК РД')}
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
        )}
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