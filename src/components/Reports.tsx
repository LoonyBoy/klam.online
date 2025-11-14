import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Download, Filter, FileText, Bell, Calendar, TrendingUp } from 'lucide-react';
import { getFilteredEvents, getCompanyProjects, getCompanyUsers } from '../lib/companyApi';

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
  
  const [events, setEvents] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalEvents, setTotalEvents] = useState(0);

  useEffect(() => {
    loadData();
  }, [dateFrom, dateTo, projectFilter, eventTypeFilter, userFilter]);

  const loadData = async () => {
    try {
      const companyId = localStorage.getItem('companyId');
      if (!companyId) {
        console.error('❌ No company ID found');
        setIsLoading(false);
        return;
      }

      const [eventsResponse, projectsResponse, usersResponse] = await Promise.all([
        getFilteredEvents(companyId, {
          dateFrom,
          dateTo,
          projectId: projectFilter,
          statusId: eventTypeFilter,
          userId: userFilter
        }),
        getCompanyProjects(companyId),
        getCompanyUsers(companyId)
      ]);

      setEvents(eventsResponse.events || []);
      setTotalEvents(eventsResponse.total || 0);
      setProjects(projectsResponse.projects || []);
      setUsers(usersResponse.users || []);
    } catch (error) {
      console.error('❌ Failed to load reports data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredEvents = events;

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

  const getEventBadgeVariant = (statusCode: string) => {
    if (statusCode.includes('отклон') || statusCode.includes('замечан')) {
      return 'destructive';
    }
    return 'default';
  };

  if (isLoading) {
    return (
      <div className="p-4 md:p-8 flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Загрузка отчётов...</p>
        </div>
      </div>
    );
  }

  const handleExport = (format: 'csv' | 'pdf') => {
    if (filteredEvents.length === 0) {
      alert('Нет событий для экспорта');
      return;
    }

    if (format === 'csv') {
      exportToCSV();
    } else {
      exportToPDF();
    }
  };

  const exportToCSV = () => {
    // Формируем CSV данные
    const headers = ['Дата и время', 'Тип события', 'Проект', 'Альбом', 'Пользователь', 'Комментарий'];
    const rows = filteredEvents.map(event => [
      formatDateTime(event.createdAt),
      event.status.name,
      event.project.code,
      event.album.name,
      `${event.createdBy.firstName} ${event.createdBy.lastName}`,
      event.comment || ''
    ]);

    // Создаем CSV строку
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    // Создаем Blob и скачиваем
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `report_${dateFrom}_${dateTo}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToPDF = () => {
    // Для PDF используем print с настройками
    const printContent = `
      <html>
        <head>
          <title>Отчёт по событиям</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { color: #2563eb; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f3f4f6; font-weight: bold; }
            tr:nth-child(even) { background-color: #f9fafb; }
          </style>
        </head>
        <body>
          <h1>Отчёт по событиям</h1>
          <p><strong>Период:</strong> ${dateFrom} - ${dateTo}</p>
          <p><strong>Всего событий:</strong> ${filteredEvents.length}</p>
          <table>
            <thead>
              <tr>
                <th>Дата и время</th>
                <th>Тип</th>
                <th>Проект</th>
                <th>Альбом</th>
                <th>Пользователь</th>
                <th>Комментарий</th>
              </tr>
            </thead>
            <tbody>
              ${filteredEvents.map(event => `
                <tr>
                  <td>${formatDateTime(event.createdAt)}</td>
                  <td>${event.status.name}</td>
                  <td>${event.project.code}</td>
                  <td>${event.album.name}</td>
                  <td>${event.createdBy.firstName} ${event.createdBy.lastName}</td>
                  <td>${event.comment || ''}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 250);
    }
  };

  // Последние уведомления (берем последние 4 события для уведомлений)
  const recentNotifications = events.slice(0, 4).map(event => ({
    id: event.id.toString(),
    type: event.status.code.includes('замечан') ? 'comment' : 
          event.status.code.includes('принят') ? 'approval' : 
          event.status.code.includes('выгруз') ? 'upload' : 'other',
    message: event.comment || event.status.name,
    project: event.project.code,
    time: new Date(event.createdAt).toLocaleDateString('ru-RU')
  }));

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
            <div className="text-3xl font-bold text-blue-600">{totalEvents}</div>
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
                    {projects.map(project => (
                      <SelectItem key={project.id} value={project.id.toString()}>
                        {project.code} - {project.name}
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
                    {users.map(user => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.firstName} {user.lastName}
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
                        {formatDateTime(event.createdAt)}
                      </td>
                      <td className="py-4 px-4">
                        <Badge variant={getEventBadgeVariant(event.status.code)}>
                          #{event.status.name}
                        </Badge>
                      </td>
                      <td className="py-4 px-4 text-sm">
                        {event.project && (
                          <button
                            className="text-blue-600 hover:underline font-medium"
                            onClick={() => onNavigateToProject(event.project.id)}
                          >
                            {event.project.code}
                          </button>
                        )}
                      </td>
                      <td className="py-4 px-4 text-sm text-gray-600">
                        {event.album.name}
                      </td>
                      <td className="py-4 px-4 text-sm text-gray-900">
                        {event.createdBy.firstName} {event.createdBy.lastName}
                        {event.createdBy.role === 'customer' && ' (Заказчик)'}
                      </td>
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