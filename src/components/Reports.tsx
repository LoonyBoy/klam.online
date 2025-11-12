import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Download, Filter, FileText, Bell, Calendar, TrendingUp } from 'lucide-react';
import { mockEvents, mockProjects, mockAlbums, mockUsers } from '../lib/mockData';

interface ReportsProps {
  onNavigateToProject: (projectId: string) => void;
  onNavigateToAlbum: (albumId: string) => void;
}

export function Reports({ onNavigateToProject, onNavigateToAlbum }: ReportsProps) {
  const [dateFrom, setDateFrom] = useState('2025-11-01');
  const [dateTo, setDateTo] = useState('2025-11-08');
  const [projectFilter, setProjectFilter] = useState('all');
  const [eventTypeFilter, setEventTypeFilter] = useState('all');
  const [userFilter, setUserFilter] = useState('all');

  const filteredEvents = mockEvents.filter(event => {
    const eventDate = new Date(event.date);
    const fromDate = dateFrom ? new Date(dateFrom) : null;
    const toDate = dateTo ? new Date(dateTo) : null;

    const matchesDate = (!fromDate || eventDate >= fromDate) && (!toDate || eventDate <= toDate);
    const matchesProject = projectFilter === 'all' || event.projectId === projectFilter;
    const matchesType = eventTypeFilter === 'all' || event.type === eventTypeFilter;
    const matchesUser = userFilter === 'all' || event.user.includes(userFilter);

    return matchesDate && matchesProject && matchesType && matchesUser;
  });

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ru-RU', { 
      day: '2-digit', 
      month: '2-digit',
      year: 'numeric',
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

  const handleExport = (format: 'csv' | 'pdf') => {
    console.log(`Экспорт отчёта в формате ${format.toUpperCase()}`, {
      dateFrom,
      dateTo,
      projectFilter,
      eventTypeFilter,
      userFilter,
      totalEvents: filteredEvents.length
    });
    alert(`Начат экспорт ${filteredEvents.length} событий в формате ${format.toUpperCase()}`);
  };

  const getProjectName = (projectId?: string) => {
    if (!projectId) return '—';
    const project = mockProjects.find(p => p.id === projectId);
    return project ? `${project.code} ${project.name}` : '—';
  };

  const getAlbumName = (albumId?: string) => {
    if (!albumId) return '—';
    const album = mockAlbums.find(a => a.id === albumId);
    return album ? album.name : '—';
  };

  // Последние уведомления
  const recentNotifications = [
    {
      id: '1',
      type: 'deadline',
      message: 'Приближается дедлайн по альбому АР',
      project: 'ПР-2025-001',
      time: '2 часа назад'
    },
    {
      id: '2',
      type: 'comment',
      message: 'Новое замечание от заказчика',
      project: 'ПР-2025-002',
      time: '5 часов назад'
    },
    {
      id: '3',
      type: 'approval',
      message: 'Альбом ГП принят заказчиком',
      project: 'ПР-2025-001',
      time: '1 день назад'
    },
    {
      id: '4',
      type: 'upload',
      message: 'Загружена новая версия альбома КР',
      project: 'ПР-2025-001',
      time: '1 день назад'
    }
  ];

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'deadline': return '⏰';
      case 'comment': return '💬';
      case 'approval': return '✅';
      case 'upload': return '📤';
      default: return '📋';
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-[1600px] mx-auto">
      {/* Заголовок */}
      <div className="mb-6 md:mb-8">
        <h1 className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
          Отчёты и уведомления
        </h1>
        <p className="text-gray-500 mt-1 text-sm md:text-base">Просмотр истории событий и выгрузка отчётов</p>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-4 md:mb-6">
        <Card className="border-gray-200 hover:shadow-lg transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Всего событий</CardTitle>
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{mockEvents.length}</div>
            <p className="text-xs text-gray-500 mt-1">за всё время</p>
          </CardContent>
        </Card>

        <Card className="border-gray-200 hover:shadow-lg transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Найдено событий</CardTitle>
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center">
              <Filter className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{filteredEvents.length}</div>
            <p className="text-xs text-gray-500 mt-1">по фильтрам</p>
          </CardContent>
        </Card>

        <Card className="border-gray-200 hover:shadow-lg transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Уведомления</CardTitle>
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center">
              <Bell className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">{recentNotifications.length}</div>
            <p className="text-xs text-gray-500 mt-1">новых</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 mb-4 md:mb-6">
        {/* Фильтры */}
        <Card className="lg:col-span-2 border-gray-200 shadow-sm">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-white border-b">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-blue-600" />
              <CardTitle className="text-lg">Фильтры отчёта</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date-from" className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  Дата с
                </Label>
                <Input
                  id="date-from"
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="date-to" className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  Дата по
                </Label>
                <Input
                  id="date-to"
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="project-filter">Проект</Label>
                <Select value={projectFilter} onValueChange={setProjectFilter}>
                  <SelectTrigger id="project-filter">
                    <SelectValue placeholder="Все проекты" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Все проекты</SelectItem>
                    {mockProjects.map(project => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.code}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="type-filter">Тип события</Label>
                <Select value={eventTypeFilter} onValueChange={setEventTypeFilter}>
                  <SelectTrigger id="type-filter">
                    <SelectValue placeholder="Все типы" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Все типы</SelectItem>
                    <SelectItem value="#выгрузка">#выгрузка</SelectItem>
                    <SelectItem value="#замечания">#замечания</SelectItem>
                    <SelectItem value="#принято">#принято</SelectItem>
                    <SelectItem value="#отклонено">#отклонено</SelectItem>
                    <SelectItem value="#правки">#правки</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="user-filter">Пользователь</Label>
                <Select value={userFilter} onValueChange={setUserFilter}>
                  <SelectTrigger id="user-filter">
                    <SelectValue placeholder="Все пользователи" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Все пользователи</SelectItem>
                    {mockUsers.map(user => (
                      <SelectItem key={user.id} value={user.name}>
                        {user.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button 
                variant="outline" 
                className="gap-2 flex-1 hover:bg-green-50"
                onClick={() => handleExport('csv')}
              >
                <Download className="w-4 h-4" />
                Экспорт CSV
              </Button>
              <Button 
                variant="outline" 
                className="gap-2 flex-1 hover:bg-red-50"
                onClick={() => handleExport('pdf')}
              >
                <FileText className="w-4 h-4" />
                Экспорт PDF
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Уведомления */}
        <Card className="border-gray-200 shadow-sm">
          <CardHeader className="bg-gradient-to-r from-orange-50 to-white border-b">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-orange-600" />
              <CardTitle className="text-lg">Уведомления</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-2">
              {recentNotifications.map(notification => (
                <div key={notification.id} className="p-3 rounded-lg bg-gray-50 hover:bg-orange-50/50 transition-colors border border-transparent hover:border-orange-200">
                  <div className="flex items-start gap-2">
                    <span className="text-lg">{getNotificationIcon(notification.type)}</span>
                    <div className="flex-1">
                      <p className="text-sm text-gray-900">{notification.message}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {notification.project} • {notification.time}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Таблица событий */}
      <Card className="border-gray-200 shadow-sm">
        <CardHeader className="bg-gradient-to-r from-indigo-50 to-white border-b">
          <CardTitle className="text-lg">
            События ({filteredEvents.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          {filteredEvents.length === 0 ? (
            <div className="text-center py-16 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
              <FileText className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-600 mb-1">Нет событий за выбранный период</p>
              <p className="text-sm text-gray-400">Измените фильтры для просмотра других данных</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    <th className="text-left py-4 px-4 font-semibold text-gray-700">Дата и время</th>
                    <th className="text-left py-4 px-4 font-semibold text-gray-700">Тип</th>
                    <th className="text-left py-4 px-4 font-semibold text-gray-700">Проект</th>
                    <th className="text-left py-4 px-4 font-semibold text-gray-700">Альбом</th>
                    <th className="text-left py-4 px-4 font-semibold text-gray-700">Пользователь</th>
                    <th className="text-left py-4 px-4 font-semibold text-gray-700">Комментарий</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEvents.map((event) => (
                    <tr key={event.id} className="border-b border-gray-100 hover:bg-blue-50/50 transition-colors">
                      <td className="py-4 px-4 text-sm text-gray-600">
                        {formatDateTime(event.date)}
                      </td>
                      <td className="py-4 px-4">
                        <Badge variant={getEventBadgeVariant(event.type)}>
                          {event.type}
                        </Badge>
                      </td>
                      <td className="py-4 px-4 text-sm">
                        {event.projectId && (
                          <button
                            className="text-blue-600 hover:underline font-medium"
                            onClick={() => onNavigateToProject(event.projectId!)}
                          >
                            {mockProjects.find(p => p.id === event.projectId)?.code}
                          </button>
                        )}
                      </td>
                      <td className="py-4 px-4 text-sm text-gray-600">
                        {getAlbumName(event.albumId)}
                      </td>
                      <td className="py-4 px-4 text-sm text-gray-900">{event.user}</td>
                      <td className="py-4 px-4 text-sm text-gray-600">{event.comment}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}