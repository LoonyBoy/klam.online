import { useState, useMemo } from 'react';
import { Album } from '../App';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { 
  Search, 
  Plus, 
  ExternalLink, 
  Info,
  FolderOpen,
  AlertCircle,
  Loader2,
  Check,
  X,
  Edit,
  Save
} from 'lucide-react';

interface AlbumsTableProps {
  albums: Album[];
  onAlbumClick: (albumId: string) => void;
  onAddAlbum?: () => void;
  onQuickAdd?: (albumData: Partial<Album>) => void;
  onUpdateAlbum?: (albumId: string, updatedData: Partial<Album>) => void;
  isExpanded?: boolean;
  isLoading?: boolean;
  error?: string;
  onRetry?: () => void;
}

export function AlbumsTable({ 
  albums, 
  onAlbumClick, 
  onAddAlbum,
  onQuickAdd,
  onUpdateAlbum,
  isExpanded = false,
  isLoading = false,
  error = null,
  onRetry
}: AlbumsTableProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [executorFilter, setExecutorFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedRow, setSelectedRow] = useState<string | null>(null);
  
  // Edit mode state
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingAlbums, setEditingAlbums] = useState<Record<string, Partial<Album>>>({});
  
  // Quick add state
  const [isQuickAdding, setIsQuickAdding] = useState(false);
  const [quickAddData, setQuickAddData] = useState({
    name: '',
    code: '',
    department: '',
    executor: '',
    deadline: '',
    albumLink: '',
    comment: ''
  });

  // Album templates
  const albumTemplates = [
    { id: '1', name: 'Пояснительная записка', code: 'ПЗ', department: 'АР' },
    { id: '2', name: 'Схема планировочной организации', code: 'ПЗУ', department: 'ГП' },
    { id: '3', name: 'Архитектурные решения', code: 'АР', department: 'АР' },
    { id: '4', name: 'Конструктивные решения', code: 'КР', department: 'КР' },
    { id: '5', name: 'Система электроснабжения', code: 'ИОС1', department: 'ЭС' },
    { id: '6', name: 'Система отопления, вентиляции и кондиционирования', code: 'ОВ', department: 'ОВВК' },
    { id: '7', name: 'Система водоснабжения и водоотведения', code: 'ВК', department: 'ОВВК' },
    { id: '8', name: 'Сети связи', code: 'СС', department: 'СС' },
  ];

  const [selectedTemplate, setSelectedTemplate] = useState('');

  // Apply template
  const handleApplyTemplate = (templateId: string) => {
    const template = albumTemplates.find(t => t.id === templateId);
    if (template) {
      setQuickAddData({
        ...quickAddData,
        name: template.name,
        code: template.code,
        department: template.department
      });
      setSelectedTemplate(templateId);
    }
  };

  // Get unique values for filters
  const departments = useMemo(() => {
    return ['all', ...new Set(albums.map(a => a.department))];
  }, [albums]);

  const executors = useMemo(() => {
    return ['all', ...new Set(albums.map(a => a.executor.name))];
  }, [albums]);

  const statuses = ['all', 'Принято', 'На проверке', 'Замечания', 'В работе'];

  // Filter albums
  const filteredAlbums = useMemo(() => {
    return albums.filter(album => {
      const matchesSearch = 
        album.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        album.code.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesDepartment = departmentFilter === 'all' || album.department === departmentFilter;
      const matchesExecutor = executorFilter === 'all' || album.executor.name === executorFilter;
      const matchesStatus = statusFilter === 'all' || album.status === statusFilter;

      return matchesSearch && matchesDepartment && matchesExecutor && matchesStatus;
    });
  }, [albums, searchQuery, departmentFilter, executorFilter, statusFilter]);

  // Calculate summary statistics
  const summary = useMemo(() => {
    const total = filteredAlbums.length;
    const accepted = filteredAlbums.filter(a => a.status === 'Принято').length;
    const inProgress = filteredAlbums.filter(a => a.status === 'В работе' || a.status === 'На проверке').length;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const overdue = filteredAlbums.filter(a => {
      const deadline = new Date(a.deadline);
      return deadline < today && a.status !== 'Принято';
    }).length;

    return { total, accepted, inProgress, overdue };
  }, [filteredAlbums]);

  // Get deadline color indicator
  const getDeadlineColor = (deadline: string, status: string): string => {
    if (status === 'Принято') return 'text-green-600';
    
    const deadlineDate = new Date(deadline);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const daysUntilDeadline = Math.ceil((deadlineDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilDeadline < 0) return 'text-red-600';
    if (daysUntilDeadline <= 3) return 'text-yellow-600';
    return 'text-green-600';
  };

  // Get status badge variant and text
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'Принято':
        return { variant: 'default' as const, text: 'Принято', className: 'bg-green-100 text-green-700 border-green-200' };
      case 'На проверке':
        return { variant: 'default' as const, text: 'Отправлено', className: 'bg-blue-100 text-blue-700 border-blue-200' };
      case 'Замечания':
        return { variant: 'destructive' as const, text: 'Замечания', className: 'bg-red-100 text-red-700 border-red-200' };
      case 'В работе':
        return { variant: 'default' as const, text: 'В работе', className: 'bg-gray-100 text-gray-700 border-gray-200' };
      default:
        return { variant: 'default' as const, text: status, className: '' };
    }
  };

  // Get event badge config
  const getEventBadgeConfig = (type: string) => {
    switch (type) {
      case '#принято':
        return { className: 'bg-green-50 text-green-700 border-green-200' };
      case '#выгрузка':
        return { className: 'bg-blue-50 text-blue-700 border-blue-200' };
      case '#замечания':
        return { className: 'bg-red-50 text-red-700 border-red-200' };
      case '#отклонено':
        return { className: 'bg-red-50 text-red-700 border-red-200' };
      case '#правки':
        return { className: 'bg-yellow-50 text-yellow-700 border-yellow-200' };
      default:
        return { className: 'bg-gray-50 text-gray-700 border-gray-200' };
    }
  };

  // Format date
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

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex gap-4 items-center">
          <div className="h-10 bg-gray-200 rounded-lg w-full max-w-sm animate-pulse" />
          <div className="h-10 bg-gray-200 rounded-lg w-40 animate-pulse" />
          <div className="h-10 bg-gray-200 rounded-lg w-40 animate-pulse" />
          <div className="h-10 bg-gray-200 rounded-lg w-40 animate-pulse" />
        </div>
        <div className="rounded-lg border border-gray-200 overflow-hidden">
          <div className="bg-gray-100 h-12" />
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 border-t border-gray-200 animate-pulse bg-gray-50" />
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-8 text-center">
        <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
        <h3 className="text-red-900 mb-2">Не удалось загрузить данные</h3>
        <p className="text-red-700 text-sm mb-4">{error}</p>
        {onRetry && (
          <Button onClick={onRetry} variant="outline" className="gap-2">
            Попробовать снова
          </Button>
        )}
      </div>
    );
  }

  // Empty state
  if (albums.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 p-12 text-center bg-white">
        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <FolderOpen className="w-12 h-12 text-gray-400" />
        </div>
        <h3 className="text-gray-900 mb-2">Нет альбомов</h3>
        <p className="text-gray-500 text-sm mb-6">Создте первый альбом для проекта</p>
        {onAddAlbum && (
          <Button onClick={onAddAlbum} className="gap-2">
            <Plus className="w-4 h-4" />
            Создать альбом
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="text-sm text-gray-600 flex items-center gap-6 px-2" style={{ fontSize: '13px' }}>
        <span>Всего альбомов: <strong className="text-gray-900">{summary.total}</strong></span>
        <span className="text-green-700">Принято: <strong>{summary.accepted}</strong></span>
        <span className="text-blue-700">В работе: <strong>{summary.inProgress}</strong></span>
        {summary.overdue > 0 && (
          <span className="text-red-700">Просрочено: <strong>{summary.overdue}</strong></span>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Поиск по названию или шифру"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-white"
          />
        </div>

        <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
          <SelectTrigger className="w-[180px] bg-white">
            <SelectValue placeholder="Отдел" />
          </SelectTrigger>
          <SelectContent className="z-[100]">
            <SelectItem value="all">Все отделы</SelectItem>
            {departments.slice(1).map(dept => (
              <SelectItem key={dept} value={dept}>{dept}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={executorFilter} onValueChange={setExecutorFilter}>
          <SelectTrigger className="w-[200px] bg-white">
            <SelectValue placeholder="Исполнитель" />
          </SelectTrigger>
          <SelectContent className="z-[100]">
            <SelectItem value="all">Все исполнители</SelectItem>
            {executors.slice(1).map(exec => (
              <SelectItem key={exec} value={exec}>{exec}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px] bg-white">
            <SelectValue placeholder="Статус" />
          </SelectTrigger>
          <SelectContent className="z-[100]">
            <SelectItem value="all">Все статусы</SelectItem>
            {statuses.slice(1).map(status => (
              <SelectItem key={status} value={status}>{status}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button 
          onClick={() => {
            if (isEditMode && onUpdateAlbum) {
              // Save all changes
              Object.entries(editingAlbums).forEach(([albumId, updates]) => {
                onUpdateAlbum(albumId, updates);
              });
              setEditingAlbums({});
            }
            setIsEditMode(!isEditMode);
          }}
          variant={isEditMode ? 'default' : 'outline'}
          className="gap-2 ml-auto"
        >
          {isEditMode ? (
            <>
              <Save className="w-4 h-4" />
              Сохранить
            </>
          ) : (
            <>
              <Edit className="w-4 h-4" />
              Редактировать
            </>
          )}
        </Button>
      </div>

      {/* Table */}
      <div className={`rounded-lg border border-gray-200 overflow-hidden bg-white shadow-sm transition-all ${isExpanded ? 'max-h-none' : 'max-h-[600px]'}`}>
        <div className="overflow-x-auto overflow-y-auto max-h-full">
          <table className="w-full" style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px' }}>
            <thead className="sticky top-0 bg-[#E2E8F0]">
              <tr>
                <th className="text-left py-1 px-3 font-semibold text-gray-700" style={{ fontSize: '13px' }}>№</th>
                <th className="text-left py-1 px-3 font-semibold text-gray-700" style={{ fontSize: '13px' }}>Шифр</th>
                <th className="text-left py-1 px-3 font-semibold text-gray-700 min-w-[180px]" style={{ fontSize: '13px' }}>Название альбома</th>
                <th className="text-left py-1 px-3 font-semibold text-gray-700" style={{ fontSize: '13px' }}>Отдел</th>
                <th className="text-left py-1 px-3 font-semibold text-gray-700 min-w-[140px]" style={{ fontSize: '13px' }}>Исполнитель</th>
                <th className="text-left py-1 px-3 font-semibold text-gray-700" style={{ fontSize: '13px' }}>Дедлайн</th>
                <th className="text-left py-1 px-3 font-semibold text-gray-700 min-w-[150px]" style={{ fontSize: '13px' }}>Последнее событие</th>
                <th className="text-left py-1 px-3 font-semibold text-gray-700" style={{ fontSize: '13px' }}>Ссылки</th>
                <th className="text-left py-1 px-3 font-semibold text-gray-700 min-w-[180px]" style={{ fontSize: '13px' }}>Комментарий</th>
              </tr>
            </thead>
            <tbody>
              {filteredAlbums.map((album, index) => {
                const statusConfig = getStatusConfig(album.status);
                const deadlineColor = getDeadlineColor(album.deadline, album.status);
                const isSelected = selectedRow === album.id;
                
                // Get current values (either from editing state or original album)
                const currentAlbum = editingAlbums[album.id] ? { ...album, ...editingAlbums[album.id] } : album;
                
                const updateField = (field: string, value: any) => {
                  setEditingAlbums(prev => ({
                    ...prev,
                    [album.id]: {
                      ...prev[album.id],
                      [field]: value
                    }
                  }));
                };

                return (
                  <tr
                    key={album.id}
                    onClick={() => {
                      if (!isEditMode) {
                        setSelectedRow(album.id);
                        onAlbumClick(album.id);
                      }
                    }}
                    className={`
                      border-t border-gray-100 ${!isEditMode ? 'cursor-pointer' : ''} transition-colors
                      ${index % 2 === 0 ? 'bg-white' : 'bg-[#F1F5F9]'}
                      ${!isEditMode ? 'hover:bg-[#EFF6FF]' : ''}
                      ${isSelected && !isEditMode ? 'border-l-4 border-l-[#3B82F6]' : ''}
                    `}
                  >
                    <td className="py-1 px-3 text-gray-600 text-sm">{index + 1}</td>
                    
                    {/* Шифр */}
                    <td className="py-1 px-3" onClick={(e) => isEditMode && e.stopPropagation()}>
                      {isEditMode ? (
                        <Input
                          value={currentAlbum.code}
                          onChange={(e) => updateField('code', e.target.value)}
                          className="h-7 text-xs font-mono"
                        />
                      ) : (
                        <span className="text-gray-600 font-mono text-xs">{album.code}</span>
                      )}
                    </td>
                    
                    {/* Название альбома */}
                    <td className="py-1 px-3" onClick={(e) => isEditMode && e.stopPropagation()}>
                      {isEditMode ? (
                        <Input
                          value={currentAlbum.name}
                          onChange={(e) => updateField('name', e.target.value)}
                          className="h-7 text-xs"
                        />
                      ) : (
                        <span className="text-gray-900 text-sm">{album.name}</span>
                      )}
                    </td>
                    
                    {/* Отдел */}
                    <td className="py-1 px-3" onClick={(e) => isEditMode && e.stopPropagation()}>
                      {isEditMode ? (
                        <Select 
                          value={currentAlbum.department} 
                          onValueChange={(val) => updateField('department', val)}
                        >
                          <SelectTrigger className="h-8 text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {departments.slice(1).map(dept => (
                              <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
                          {album.department}
                        </Badge>
                      )}
                    </td>
                    
                    {/* Исполнитель */}
                    <td className="py-1 px-3" onClick={(e) => isEditMode && e.stopPropagation()}>
                      {isEditMode ? (
                        <Select 
                          value={currentAlbum.executor.name} 
                          onValueChange={(val) => {
                            const selectedExecutor = albums.find(a => a.executor.name === val)?.executor;
                            if (selectedExecutor) {
                              updateField('executor', selectedExecutor);
                            }
                          }}
                        >
                          <SelectTrigger className="h-7 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {executors.slice(1).map(exec => (
                              <SelectItem key={exec} value={exec}>{exec}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <img 
                            src={album.executor.avatar} 
                            alt={album.executor.name}
                            className="w-5 h-5 rounded-full"
                          />
                          <span className="text-gray-900 text-xs">{album.executor.name}</span>
                        </div>
                      )}
                    </td>
                    
                    {/* Дедлайн */}
                    <td className="py-1 px-3" onClick={(e) => isEditMode && e.stopPropagation()}>
                      {isEditMode ? (
                        <Input
                          type="date"
                          value={currentAlbum.deadline}
                          onChange={(e) => updateField('deadline', e.target.value)}
                          className="h-7 text-xs"
                        />
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <div className={`w-1.5 h-1.5 rounded-full ${deadlineColor.replace('text-', 'bg-')}`} />
                          <span className={`${deadlineColor} text-xs`}>{formatDate(album.deadline)}</span>
                        </div>
                      )}
                    </td>
                    
                    {/* Последнее событие */}
                    <td className="py-1 px-3">
                      {album.lastEvent ? (
                        <div className="space-y-1">
                          <Badge 
                            variant="outline" 
                            className={getEventBadgeConfig(album.lastEvent.type).className}
                          >
                            {album.lastEvent.type}
                          </Badge>
                          <p className="text-xs text-gray-500">{formatDateTime(album.lastEvent.date)}</p>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-xs">—</span>
                      )}
                    </td>
                    
                    {/* Ссылки */}
                    <td className="py-1 px-3" onClick={(e) => isEditMode && e.stopPropagation()}>
                      {isEditMode ? (
                        <Input
                          value={currentAlbum.albumLink || ''}
                          onChange={(e) => updateField('albumLink', e.target.value)}
                          placeholder="https://"
                          className="h-7 text-xs"
                        />
                      ) : (
                        <div className="flex items-center gap-2">
                          {album.albumLink ? (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <a 
                                    href={album.albumLink} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    className="text-[#64748B] hover:text-[#3B82F6] transition-colors inline-block"
                                  >
                                    <ExternalLink className="w-4 h-4" />
                                  </a>
                                </TooltipTrigger>
                                <TooltipContent>Открыть альбом</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          ) : (
                            <span className="text-gray-400 text-xs">—</span>
                          )}
                        </div>
                      )}
                    </td>
                    
                    {/* Комментарий */}
                    <td className="py-1 px-3" onClick={(e) => isEditMode && e.stopPropagation()}>
                      {isEditMode ? (
                        <Input
                          value={currentAlbum.comment || ''}
                          onChange={(e) => updateField('comment', e.target.value)}
                          placeholder="Комментарий"
                          className="h-7 text-xs"
                        />
                      ) : (
                        album.comment ? (
                          <div className="flex items-center gap-2">
                            <span className="text-gray-700 text-sm truncate max-w-[150px]">
                              {album.comment}
                            </span>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Info className="w-4 h-4 text-gray-400 flex-shrink-0 cursor-help" />
                                </TooltipTrigger>
                                <TooltipContent className="max-w-xs">
                                  {album.comment}
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-xs">—</span>
                        )
                      )}
                    </td>
                  </tr>
                );
              })}

              {/* Quick add row */}
              {isQuickAdding ? (
                <tr className="border-t-2 border-blue-300 bg-gradient-to-r from-blue-50 to-indigo-50">
                  <td colSpan={9} className="p-6">
                    <div className="bg-white rounded-lg p-6 shadow-sm border border-blue-200">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="font-semibold text-gray-900">Создание нового альбома</h3>
                          <p className="text-sm text-gray-500 mt-1">Заполните основные данные для альбома</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            disabled={!quickAddData.name || !quickAddData.code}
                            className="gap-2 bg-green-600 hover:bg-green-700"
                            onClick={() => {
                              if (onQuickAdd && quickAddData.name && quickAddData.code) {
                                onQuickAdd(quickAddData);
                                setQuickAddData({ name: '', code: '', department: '', executor: '', deadline: '', albumLink: '', comment: '' });
                                setSelectedTemplate('');
                                setIsQuickAdding(false);
                              }
                            }}
                          >
                            <Check className="w-4 h-4" />
                            Создать альбом
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-2"
                            onClick={() => {
                              setQuickAddData({ name: '', code: '', department: '', executor: '', deadline: '', albumLink: '', comment: '' });
                              setSelectedTemplate('');
                              setIsQuickAdding(false);
                            }}
                          >
                            <X className="w-4 h-4" />
                            Отмена
                          </Button>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-6">
                        {/* Left column */}
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Использовать шаблон
                            </label>
                            <Select 
                              value={selectedTemplate} 
                              onValueChange={handleApplyTemplate}
                            >
                              <SelectTrigger className="h-10">
                                <SelectValue placeholder="Выберите шаблон (опционально)" />
                              </SelectTrigger>
                              <SelectContent className="z-[100]">
                                <SelectItem value="none">Без шаблона</SelectItem>
                                {albumTemplates.map(template => (
                                  <SelectItem key={template.id} value={template.id}>
                                    {template.name} ({template.code})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Название альбома <span className="text-red-500">*</span>
                            </label>
                            <Input
                              placeholder="Например: Архитектурные решения"
                              value={quickAddData.name}
                              onChange={(e) => setQuickAddData({...quickAddData, name: e.target.value})}
                              className="h-10"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Шифр альбома <span className="text-red-500">*</span>
                            </label>
                            <Input
                              placeholder="Например: АР"
                              value={quickAddData.code}
                              onChange={(e) => setQuickAddData({...quickAddData, code: e.target.value})}
                              className="h-10 font-mono"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Отдел
                            </label>
                            <Select 
                              value={quickAddData.department} 
                              onValueChange={(val) => setQuickAddData({...quickAddData, department: val})}
                            >
                              <SelectTrigger className="h-10">
                                <SelectValue placeholder="Выберите отдел" />
                              </SelectTrigger>
                              <SelectContent className="z-[100]">
                                {departments.slice(1).map(dept => (
                                  <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Исполнитель
                            </label>
                            <Select 
                              value={quickAddData.executor} 
                              onValueChange={(val) => setQuickAddData({...quickAddData, executor: val})}
                            >
                              <SelectTrigger className="h-10">
                                <SelectValue placeholder="Выберите исполнителя" />
                              </SelectTrigger>
                              <SelectContent className="z-[100]">
                                {executors.slice(1).map(exec => (
                                  <SelectItem key={exec} value={exec}>{exec}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        
                        {/* Right column */}
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Дедлайн
                            </label>
                            <Input
                              type="date"
                              value={quickAddData.deadline}
                              onChange={(e) => setQuickAddData({...quickAddData, deadline: e.target.value})}
                              className="h-10"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Ссылка на альбом
                            </label>
                            <Input
                              type="url"
                              placeholder="https://drive.google.com/..."
                              value={quickAddData.albumLink}
                              onChange={(e) => setQuickAddData({...quickAddData, albumLink: e.target.value})}
                              className="h-10"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Комментарий
                            </label>
                            <Input
                              placeholder="Добавьте комментарий (опционально)"
                              value={quickAddData.comment}
                              onChange={(e) => setQuickAddData({...quickAddData, comment: e.target.value})}
                              className="h-10"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                <tr className="border-t border-gray-200 hover:bg-gray-50 transition-colors">
                  <td colSpan={9} className="py-3 px-4">
                    <button
                      onClick={() => setIsQuickAdding(true)}
                      className="w-full flex items-center justify-center gap-2 text-gray-500 hover:text-[#3B82F6] transition-colors py-2 rounded-lg hover:bg-blue-50"
                    >
                      <Plus className="w-5 h-5" />
                      <span>Добавить новый альбом</span>
                    </button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}