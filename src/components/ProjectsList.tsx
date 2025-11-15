import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Plus, Search, Filter, FolderKanban, TrendingUp, ExternalLink, Trash2 } from 'lucide-react';
import { CreateProjectWizard } from './CreateProjectWizard';
import { companyApi, createProject } from '../lib/companyApi';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';

interface ProjectsListProps {
  onNavigateToProject: (projectId: string) => void;
}

export function ProjectsList({ onNavigateToProject }: ProjectsListProps) {
  const [projects, setProjects] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<any>(null);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const companyId = localStorage.getItem('companyId');
      if (!companyId) {
        console.error('❌ No company ID found');
        setIsLoading(false);
        return;
      }

      const response = await companyApi.getCompanyProjects(companyId);
      setProjects(response.projects || []);
    } catch (error) {
      console.error('❌ Failed to load projects:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         project.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (project.customerCompanyName && project.customerCompanyName.toLowerCase().includes(searchQuery.toLowerCase()));
    // TODO: добавить фильтрацию по статусу когда будет поле status в БД
    // TODO: добавить фильтрацию по отделу когда будет связь с departments
    
    return matchesSearch;
  });

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  // Подсчет статистики из реальных данных
  const activeProjects = projects.filter(p => p.stats.activeAlbums > 0);
  const uniqueDepartments = new Set<string>();
  // TODO: когда будет связь с departments, подсчитывать уникальные отделы

  const handleProjectComplete = async (projectData: any) => {
    console.log('Создан новый проект:', projectData);
    console.log('📤 Отправляемые данные:', JSON.stringify(projectData, null, 2));
    
    try {
      const companyId = localStorage.getItem('companyId');
      if (!companyId) {
        toast.error('Компания не выбрана');
        return;
      }

      // Вызываем API для создания проекта
      const result = await createProject(companyId, projectData);
      
      if (result.success) {
        toast.success(`Проект "${projectData.projectName}" успешно создан!`);
        loadProjects(); // Перезагружаем список проектов
      } else {
        toast.error('Не удалось создать проект');
      }
    } catch (error) {
      console.error('Ошибка при создании проекта:', error);
      toast.error(error instanceof Error ? error.message : 'Не удалось создать проект');
    }
  };

  const handleDeleteProject = async () => {
    if (!projectToDelete) return;

    try {
      const companyId = localStorage.getItem('companyId');
      if (!companyId) {
        toast.error('Компания не выбрана');
        return;
      }

      await companyApi.deleteProject(companyId, projectToDelete.id);
      
      toast.success(`Проект "${projectToDelete.name}" успешно удалён`);
      loadProjects();
    } catch (error) {
      console.error('Ошибка при удалении проекта:', error);
      toast.error('Не удалось удалить проект');
    } finally {
      setProjectToDelete(null);
    }
  };

  if (isLoading) {
    return (
      <div className="p-4 md:p-8 max-w-[1600px] mx-auto flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Загрузка проектов...</p>
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
            <div className="text-3xl font-bold text-blue-600">{projects.length}</div>
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
            <div className="text-3xl font-bold text-green-600">{activeProjects.length}</div>
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
            <div className="text-3xl font-bold text-purple-600">{uniqueDepartments.size}</div>
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

            {/* TODO: Вернуть фильтр по отделам когда будет связь с project_departments */}
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
                      <Badge variant="default" className="ml-2">
                        {project.stats.activeAlbums > 0 ? 'Активный' : 'Неактивный'}
                      </Badge>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">Заказчик:</span>
                        <span className="font-medium text-gray-900">{project.customerCompanyName || 'Не указан'}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">Владелец:</span>
                        <span className="font-medium text-gray-900">
                          {project.owner ? `${project.owner.firstName} ${project.owner.lastName || ''}`.trim() : 'Не назначен'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">Альбомов:</span>
                        <Badge variant="outline">{project.stats.activeAlbums} / {project.stats.totalAlbums}</Badge>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-3 pt-3 border-t border-gray-200">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="flex-1 gap-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          onNavigateToProject(project.id);
                        }}
                      >
                        <ExternalLink className="w-4 h-4" />
                        Открыть
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="hover:bg-red-100 hover:text-red-600"
                        onClick={(e) => {
                          e.stopPropagation();
                          setProjectToDelete(project);
                        }}
                        title="Удалить"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
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
                      <th className="text-left py-4 px-4 font-semibold text-gray-700">Владелец</th>
                      <th className="text-left py-4 px-4 font-semibold text-gray-700">Альбомов</th>
                      <th className="text-left py-4 px-4 font-semibold text-gray-700">Статус</th>
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
                        <td className="py-4 px-4 text-gray-600">{project.customerCompanyName || 'Не указан'}</td>
                        <td className="py-4 px-4 text-gray-600">
                          {project.owner 
                            ? `${project.owner.firstName} ${project.owner.lastName || ''}`.trim()
                            : 'Не назначен'}
                        </td>
                        <td className="py-4 px-4 text-center">
                          <Badge variant="outline">
                            {project.stats.activeAlbums} / {project.stats.totalAlbums}
                          </Badge>
                        </td>
                        <td className="py-4 px-4">
                          <Badge variant="default">
                            {project.stats.activeAlbums > 0 ? 'Активный' : 'Неактивный'}
                          </Badge>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className="gap-2"
                              onClick={(e) => {
                                e.stopPropagation();
                                onNavigateToProject(project.id);
                              }}
                            >
                              <ExternalLink className="w-4 h-4" />
                              Открыть
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className="hover:bg-red-100 hover:text-red-600"
                              onClick={(e) => {
                                e.stopPropagation();
                                setProjectToDelete(project);
                              }}
                              title="Удалить проект"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
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
        companyId={localStorage.getItem('companyId') || '1'}
      />

      {/* Диалог подтверждения удаления */}
      <AlertDialog open={!!projectToDelete} onOpenChange={() => setProjectToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить проект?</AlertDialogTitle>
            <AlertDialogDescription>
              Вы уверены, что хотите удалить проект <strong>{projectToDelete?.name}</strong> ({projectToDelete?.code})?
              <br />
              <br />
              Это действие нельзя будет отменить. Все данные проекта, включая альбомы и файлы, будут удалены.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteProject}
              className="!bg-red-600 hover:!bg-red-700 !text-white"
            >
              Удалить проект
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}