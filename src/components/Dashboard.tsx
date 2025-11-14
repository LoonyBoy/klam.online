import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Bell, FolderKanban, Album, AlertCircle, Clock, TrendingUp, ExternalLink } from 'lucide-react';
import { companyApi } from '../lib/companyApi';

interface DashboardProps {
  onNavigateToProject: (projectId: string) => void;
}

export function Dashboard({ onNavigateToProject }: DashboardProps) {
  const [companyData, setCompanyData] = useState<any>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [activeRemarks, setActiveRemarks] = useState(0);
  const [deadlines, setDeadlines] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const companyId = localStorage.getItem('companyId');
      if (!companyId) {
        console.error('❌ No company ID found');
        setIsLoading(false);
        return;
      }

      console.log('📤 Loading dashboard data...');
      
      // Загружаем все данные параллельно
      const [companyResponse, projectsResponse, remarksResponse, deadlinesResponse, eventsResponse] = await Promise.all([
        companyApi.getCompany(companyId),
        companyApi.getCompanyProjects(companyId),
        companyApi.getAlbumsStatistics(companyId),
        companyApi.getUpcomingDeadlines(companyId, 5),
        companyApi.getRecentEvents(companyId, 6)
      ]);
      
      setCompanyData(companyResponse.company);
      setProjects(projectsResponse.projects || []);
      setActiveRemarks(remarksResponse.activeRemarks || 0);
      setDeadlines(deadlinesResponse || []);
      setEvents(eventsResponse || []);
      
      console.log('✅ Dashboard data loaded');
    } catch (error) {
      console.error('❌ Failed to load dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Подсчет статистики из реальных данных
  const activeProjects = projects.filter((p: any) => p.stats.activeAlbums > 0);
  const totalAlbums = projects.reduce((sum: number, p: any) => sum + p.stats.totalAlbums, 0);
  const activeAlbums = projects.reduce((sum: number, p: any) => sum + p.stats.activeAlbums, 0);

  const getEventBadgeColor = (type: string) => {
    // Статус может быть в формате #code или просто code
    const statusCode = type.replace('#', '');
    
    switch (statusCode) {
      case 'замечания':
      case 'remarks': 
        return 'destructive';
      case 'выгрузка':
      case 'upload':
      case 'sent':
        return 'default';
      case 'принято':
      case 'accepted':
        return 'default';
      case 'отклонено':
        return 'destructive';
      case 'правки':
      case 'pending':
        return 'default';
      default: 
        return 'default';
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

  if (isLoading) {
    return (
      <div className="p-4 md:p-8 max-w-[1600px] mx-auto flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Загрузка данных компании...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-[1600px] mx-auto">
      {/* Заголовок */}
      <div className="mb-6 md:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
              {companyData ? companyData.name : 'Добро пожаловать!'}
            </h1>
            <p className="text-gray-500 mt-1 text-sm md:text-base">
              {companyData 
                ? `Обзор активных проектов и событий • Участников: ${companyData.members?.length || 0}`
                : 'Обзор активных проектов и событий'}
            </p>
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
              из {projects.length} всего
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
            <div className="text-2xl md:text-3xl font-bold text-purple-600">{activeAlbums}</div>
            <p className="text-xs text-gray-500 mt-1">всего альбомов: {totalAlbums}</p>
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
            <div className="text-2xl md:text-3xl font-bold text-orange-600">{activeRemarks}</div>
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
              {deadlines[0] ? formatDate(deadlines[0].deadline) : '—'}
            </div>
            <p className="text-xs text-gray-500 mt-1 truncate">
              {deadlines[0]?.albumName || 'нет дедлайнов'}
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
            {events.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>Нет событий</p>
              </div>
            ) : (
              <div className="space-y-2">
                {events.map((event) => {
                  const eventType = `#${event.status.code}`;
                  const userName = `${event.createdBy.firstName} ${event.createdBy.lastName || ''}`;
                  const roleLabel = event.createdBy.role === 'customer' ? ' (Заказчик)' : '';
                  
                  return (
                    <div key={event.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-200">
                      <Badge variant={getEventBadgeColor(eventType)} className="mt-0.5 shrink-0">
                        {eventType}
                      </Badge>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900">{event.comment || event.status.name}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {userName.trim()}{roleLabel} • {formatDateTime(event.createdAt)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Ближайшие дедлайны */}
        <Card className="border-gray-200 shadow-sm">
          <CardHeader className="bg-gradient-to-r from-orange-50 to-white border-b">
            <CardTitle className="text-lg">Ближайшие дедлайны</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {deadlines.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>Нет дедлайнов</p>
              </div>
            ) : (
              <div className="space-y-2">
                {deadlines.map((album) => {
                  const isUrgent = album.daysUntilDeadline <= 3;

                  return (
                    <div key={album.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-200">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">{album.albumName} ({album.albumCode})</p>
                        <p className="text-xs text-gray-500 truncate">{album.projectName}</p>
                      </div>
                      <div className="text-right ml-4">
                        <p className={`text-sm font-medium ${isUrgent || album.isOverdue ? 'text-red-600' : 'text-gray-900'}`}>
                          {formatDate(album.deadline)}
                        </p>
                        <Badge variant={isUrgent || album.isOverdue ? 'destructive' : 'outline'} className="text-xs mt-1">
                          {album.isOverdue ? 'Просрочен' : `${album.daysUntilDeadline} дн.`}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Активные проекты */}
      <Card className="border-gray-200 shadow-sm">
        <CardHeader className="bg-gradient-to-r from-indigo-50 to-white border-b">
          <CardTitle className="text-lg">Активные проекты</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          {projects.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p className="text-lg font-medium mb-2">Нет проектов</p>
              <p className="text-sm mb-4">Создайте первый проект для начала работы</p>
              <Button 
                variant="default" 
                className="mt-2 bg-blue-600 hover:bg-blue-700"
                onClick={() => {/* TODO: открыть мастер создания проекта */}}
              >
                Создать проект
              </Button>
            </div>
          ) : (
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
                      <span className="font-medium">{project.customerCompanyName || 'Не указан'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">Владелец:</span>
                      <span className="font-medium">
                        {project.owner 
                          ? `${project.owner.firstName} ${project.owner.lastName || ''}`.trim()
                          : 'Не назначен'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t mt-2">
                      <span className="text-gray-500">Альбомов:</span>
                      <Badge variant="outline" className="font-medium">
                        {project.stats.activeAlbums} / {project.stats.totalAlbums}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}