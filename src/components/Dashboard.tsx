import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Bell, FolderKanban, Album, AlertCircle, Clock, TrendingUp, ExternalLink } from 'lucide-react';
import { mockProjects, mockAlbums, mockEvents } from '../lib/mockData';

interface DashboardProps {
  onNavigateToProject: (projectId: string) => void;
}

export function Dashboard({ onNavigateToProject }: DashboardProps) {
  const activeProjects = mockProjects.filter(p => p.status === 'Активный');
  const totalAlbums = mockAlbums.length;
  const activeIssues = mockEvents.filter(e => e.type === '#замечания').length;
  const recentEvents = mockEvents.slice(0, 6);

  // Ближайшие дедлайны
  const upcomingDeadlines = mockAlbums
    .map(album => {
      const project = mockProjects.find(p => p.id === album.projectId);
      return { ...album, projectName: project?.name || '' };
    })
    .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
    .slice(0, 5);

  const getEventBadgeColor = (type: string) => {
    switch (type) {
      case '#замечания': return 'destructive';
      case '#выгрузка': return 'default';
      case '#принято': return 'default';
      case '#отклонено': return 'destructive';
      case '#правки': return 'default';
      default: return 'default';
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

  return (
    <div className="p-4 md:p-8 max-w-[1600px] mx-auto">
      {/* Заголовок */}
      <div className="mb-6 md:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
              Добро пожаловать!
            </h1>
            <p className="text-gray-500 mt-1 text-sm md:text-base">Обзор активных проектов и событий</p>
          </div>
          <Button variant="outline" className="gap-2 hover:bg-blue-50 border-gray-300 w-full sm:w-auto">
            <Bell className="w-4 h-4" />
            Уведомления
          </Button>
        </div>
      </div>

      {/* KPI карточки */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6 mb-6 md:mb-8">
        <Card className="border-gray-200 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs md:text-sm">Активные проекты</CardTitle>
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
              <FolderKanban className="h-4 w-4 md:h-5 md:w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl md:text-3xl font-bold text-blue-600">{activeProjects.length}</div>
            <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              из {mockProjects.length} всего
            </p>
          </CardContent>
        </Card>

        <Card className="border-gray-200 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs md:text-sm">Альбомов в работе</CardTitle>
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center">
              <Album className="h-4 w-4 md:h-5 md:w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl md:text-3xl font-bold text-purple-600">{totalAlbums}</div>
            <p className="text-xs text-gray-500 mt-1">всего альбомов</p>
          </CardContent>
        </Card>

        <Card className="border-gray-200 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs md:text-sm">Активные замечания</CardTitle>
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center">
              <AlertCircle className="h-4 w-4 md:h-5 md:w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl md:text-3xl font-bold text-orange-600">{activeIssues}</div>
            <p className="text-xs text-gray-500 mt-1">требуют внимания</p>
          </CardContent>
        </Card>

        <Card className="border-gray-200 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs md:text-sm">Ближайший дедлайн</CardTitle>
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center">
              <Clock className="h-4 w-4 md:h-5 md:w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-lg md:text-xl font-bold text-red-600">
              {upcomingDeadlines[0] ? formatDate(upcomingDeadlines[0].deadline) : '—'}
            </div>
            <p className="text-xs text-gray-500 mt-1 truncate">
              {upcomingDeadlines[0]?.name || 'нет дедлайнов'}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mb-4 md:mb-6">
        {/* Последние события */}
        <Card className="border-gray-200 shadow-sm">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-white border-b">
            <CardTitle className="text-lg">Последние события</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-2">
              {recentEvents.map((event) => (
                <div key={event.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-200">
                  <Badge variant={getEventBadgeColor(event.type)} className="mt-0.5 shrink-0">
                    {event.type}
                  </Badge>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900">{event.comment}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {event.user} • {formatDateTime(event.date)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Ближайшие дедлайны */}
        <Card className="border-gray-200 shadow-sm">
          <CardHeader className="bg-gradient-to-r from-orange-50 to-white border-b">
            <CardTitle className="text-lg">Ближайшие дедлайны</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-2">
              {upcomingDeadlines.map((album) => {
                const daysLeft = Math.ceil(
                  (new Date(album.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
                );
                const isUrgent = daysLeft <= 3;

                return (
                  <div key={album.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-200">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{album.name} ({album.code})</p>
                      <p className="text-xs text-gray-500 truncate">{album.projectName}</p>
                    </div>
                    <div className="text-right ml-4">
                      <p className={`text-sm font-medium ${isUrgent ? 'text-red-600' : 'text-gray-900'}`}>
                        {formatDate(album.deadline)}
                      </p>
                      <Badge variant={isUrgent ? 'destructive' : 'outline'} className="text-xs mt-1">
                        {daysLeft > 0 ? `${daysLeft} дн.` : 'Просрочен'}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Активные проекты */}
      <Card className="border-gray-200 shadow-sm">
        <CardHeader className="bg-gradient-to-r from-indigo-50 to-white border-b">
          <CardTitle className="text-lg">Активные проекты</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeProjects.map((project) => (
              <div
                key={project.id}
                className="group p-5 border-2 border-gray-200 rounded-xl hover:border-blue-400 hover:shadow-md transition-all cursor-pointer bg-white"
                onClick={() => onNavigateToProject(project.id)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <p className="text-xs text-gray-500 font-mono">{project.code}</p>
                    <h3 className="mt-1 text-gray-900 group-hover:text-blue-600 transition-colors">{project.name}</h3>
                  </div>
                  <ExternalLink className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
                </div>
                <div className="space-y-1.5 text-sm text-gray-600">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Заказчик:</span>
                    <span className="font-medium">{project.client}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Исполнитель:</span>
                    <span className="font-medium">{project.executor}</span>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t mt-2">
                    <span className="text-gray-500">Дедлайн:</span>
                    <Badge variant="outline" className="font-medium">{formatDate(project.deadline)}</Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}