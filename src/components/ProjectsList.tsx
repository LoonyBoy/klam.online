import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Plus, Search, Filter, FolderKanban, TrendingUp, ExternalLink } from 'lucide-react';
import { mockProjects, mockAlbums } from '../lib/mockData';
import { CreateProjectWizard } from './CreateProjectWizard';

interface ProjectsListProps {
  onNavigateToProject: (projectId: string) => void;
}

export function ProjectsList({ onNavigateToProject }: ProjectsListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [isWizardOpen, setIsWizardOpen] = useState(false);

  const filteredProjects = mockProjects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         project.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         project.client.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
    const matchesDepartment = departmentFilter === 'all' || project.department === departmentFilter;
    
    return matchesSearch && matchesStatus && matchesDepartment;
  });

  const getProjectAlbumsCount = (projectId: string) => {
    return mockAlbums.filter(a => a.projectId === projectId).length;
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'Активный': return 'default';
      case 'Завершён': return 'default';
      case 'Приостановлен': return 'destructive';
      default: return 'default';
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const departments = Array.from(new Set(mockProjects.map(p => p.department)));

  const handleProjectComplete = (projectData: any) => {
    console.log('Создан новый проект:', projectData);
  };

  const activeCount = mockProjects.filter(p => p.status === 'Активный').length;

  return (
    <div className="p-4 md:p-8 max-w-[1600px] mx-auto">
      {/* Заголовок */}
      <div className="mb-6 md:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
              Проекты
            </h1>
            <p className="text-gray-500 mt-1 text-sm md:text-base">Управление проектами компании</p>
          </div>
          
          <Button 
            className="gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 w-full sm:w-auto"
            onClick={() => setIsWizardOpen(true)}
          >
            <Plus className="w-4 h-4" />
            Создать проект
          </Button>
        </div>
      </div>

      {/* KPI карточки */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6 mb-4 md:mb-6">
        <Card className="border-gray-200 hover:shadow-lg transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Всего проектов</CardTitle>
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
              <FolderKanban className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{mockProjects.length}</div>
            <p className="text-xs text-gray-500 mt-1">в системе</p>
          </CardContent>
        </Card>

        <Card className="border-gray-200 hover:shadow-lg transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Активные проекты</CardTitle>
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{activeCount}</div>
            <p className="text-xs text-gray-500 mt-1">в работе</p>
          </CardContent>
        </Card>

        <Card className="border-gray-200 hover:shadow-lg transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Отделов задействовано</CardTitle>
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center">
              <FolderKanban className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">{departments.length}</div>
            <p className="text-xs text-gray-500 mt-1">отделов</p>
          </CardContent>
        </Card>
      </div>

      {/* Фильтры */}
      <Card className="mb-6 border-gray-200 shadow-sm">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-600" />
            <CardTitle className="text-lg">Фильтры</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Поиск по названию, шифру или заказчику"
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Все статусы" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все статусы</SelectItem>
                <SelectItem value="Активный">Активный</SelectItem>
                <SelectItem value="Завершён">Завершён</SelectItem>
                <SelectItem value="Приостановлен">Приостановлен</SelectItem>
              </SelectContent>
            </Select>

            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Все отделы" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все отделы</SelectItem>
                {departments.map(dept => (
                  <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Таблица проектов */}
      <Card className="border-gray-200 shadow-sm">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-white border-b">
          <CardTitle className="text-lg">
            Найдено проектов: {filteredProjects.length}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          {filteredProjects.length === 0 ? (
            <div className="text-center py-16 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
              <FolderKanban className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-600 mb-1">Проекты не найдены</p>
              <p className="text-sm text-gray-400">Попробуйте изменить фильтры</p>
            </div>
          ) : (
            <>
              {/* Мобильное представление - карточки */}
              <div className="md:hidden space-y-3">
                {filteredProjects.map((project) => (
                  <div
                    key={project.id}
                    className="p-4 rounded-lg border-2 border-gray-200 hover:border-blue-400 bg-white transition-all cursor-pointer"
                    onClick={() => onNavigateToProject(project.id)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <span className="font-mono text-xs text-gray-500">{project.code}</span>
                        <h3 className="font-medium text-gray-900 mt-1">{project.name}</h3>
                      </div>
                      <Badge variant={getStatusBadgeVariant(project.status)} className="ml-2">
                        {project.status}
                      </Badge>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">Заказчик:</span>
                        <span className="font-medium text-gray-900">{project.client}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">Отдел:</span>
                        <Badge variant="outline" className="bg-blue-50 border-blue-200 text-blue-700">
                          {project.department}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">Альбомов:</span>
                        <Badge variant="outline">{getProjectAlbumsCount(project.id)}</Badge>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t">
                        <span className="text-gray-500">Дедлайн:</span>
                        <span className="text-gray-900">{formatDate(project.deadline)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Десктопное представление - таблица */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2 border-gray-200">
                      <th className="text-left py-4 px-4 font-semibold text-gray-700">Шифр</th>
                      <th className="text-left py-4 px-4 font-semibold text-gray-700">Название</th>
                      <th className="text-left py-4 px-4 font-semibold text-gray-700">Заказчик</th>
                      <th className="text-left py-4 px-4 font-semibold text-gray-700">Отдел</th>
                      <th className="text-left py-4 px-4 font-semibold text-gray-700">Альбомов</th>
                      <th className="text-left py-4 px-4 font-semibold text-gray-700">Статус</th>
                      <th className="text-left py-4 px-4 font-semibold text-gray-700">Дедлайн</th>
                      <th className="text-left py-4 px-4"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProjects.map((project) => (
                      <tr 
                        key={project.id} 
                        className="border-b border-gray-100 hover:bg-blue-50/50 transition-colors cursor-pointer group"
                        onClick={() => onNavigateToProject(project.id)}
                      >
                        <td className="py-4 px-4">
                          <span className="font-mono text-sm text-gray-600 group-hover:text-blue-600 transition-colors">
                            {project.code}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <span className="font-medium group-hover:text-blue-600 transition-colors">
                            {project.name}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-gray-600">{project.client}</td>
                        <td className="py-4 px-4">
                          <Badge variant="outline" className="bg-blue-50 border-blue-200 text-blue-700">
                            {project.department}
                          </Badge>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <Badge variant="outline">
                            {getProjectAlbumsCount(project.id)}
                          </Badge>
                        </td>
                        <td className="py-4 px-4">
                          <Badge variant={getStatusBadgeVariant(project.status)}>
                            {project.status}
                          </Badge>
                        </td>
                        <td className="py-4 px-4 text-gray-600 text-sm">
                          {formatDate(project.deadline)}
                        </td>
                        <td className="py-4 px-4">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="gap-2 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => {
                              e.stopPropagation();
                              onNavigateToProject(project.id);
                            }}
                          >
                            <ExternalLink className="w-4 h-4" />
                            Открыть
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Модальное окно создания проекта */}
      <CreateProjectWizard 
        isOpen={isWizardOpen} 
        onClose={() => setIsWizardOpen(false)} 
        onComplete={handleProjectComplete} 
      />
    </div>
  );
}