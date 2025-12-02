import { useState, useMemo, useEffect } from 'react';
import { Album } from '../App';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from './ui/alert-dialog';
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
  Save,
  Trash2,
  Upload,
  FileSpreadsheet,
  Download
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { companyApi } from '../lib/companyApi';
import { toast } from 'sonner';

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
  companyId?: string;
  projectId?: string;
  category?: 'СВОК ПД' | 'СВОК РД';
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
  onRetry,
  companyId,
  projectId,
  category = 'СВОК ПД'
}: AlbumsTableProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [executorFilter, setExecutorFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedRow, setSelectedRow] = useState<string | null>(null);
  
  // Local state for optimistic updates
  const [localAlbums, setLocalAlbums] = useState<Album[]>(albums);
  
  // Sync with parent albums
  useEffect(() => {
    setLocalAlbums(albums);
  }, [albums]);
  
  // Hover state for album events history
  const [hoveredAlbumId, setHoveredAlbumId] = useState<string | null>(null);
  const [albumEvents, setAlbumEvents] = useState<Record<string, any[]>>({});
  
  // Delete album state
  const [albumToDelete, setAlbumToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Edit mode state
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingAlbums, setEditingAlbums] = useState<Record<string, Partial<Album>>>({});
  
  // Import state
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importData, setImportData] = useState<any[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0 });
  const [importErrors, setImportErrors] = useState<string[]>([]);

  // Quick add state
  const [isQuickAdding, setIsQuickAdding] = useState(false);
  const [quickAddData, setQuickAddData] = useState({
    name: '',
    code: '',
    department: '',
    executor: '',
    customer: '',
    deadline: '',
    albumLink: '',
    localLink: '',
    comment: ''
  });

  // Album templates
  const [albumTemplates, setAlbumTemplates] = useState<any[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [templatesLoading, setTemplatesLoading] = useState(false);

  // Project participants
  const [executors, setExecutors] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [projectDepartments, setProjectDepartments] = useState<any[]>([]);
  const [participantsLoading, setParticipantsLoading] = useState(false);

  // WebSocket connection for real-time updates
  useEffect(() => {
    if (!companyId || !projectId) return;

    // Determine WebSocket URL based on environment
    const API_URL = import.meta.env.VITE_API_URL || '';
    const hostname = window.location.hostname;
    const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
    const isNgrok = hostname.includes('ngrok');
    
    let wsUrl: string;
    if (isLocalhost) {
      // Local development - connect directly to backend
      wsUrl = 'ws://localhost:3001/ws';
    } else if (isNgrok) {
      // Ngrok development - use current origin with wss and /ws path
      // Vite proxy will handle /ws -> backend
      wsUrl = `wss://${hostname}/ws`;
    } else if (API_URL.includes('https://api.klambot.ru')) {
      // Production - use WSS to API domain
      wsUrl = 'wss://api.klambot.ru/ws';
    } else if (API_URL) {
      // Other environments - derive from API_URL
      const wsProtocol = API_URL.startsWith('https') ? 'wss:' : 'ws:';
      const apiHost = new URL(API_URL).host;
      wsUrl = `${wsProtocol}//${apiHost}/ws`;
    } else {
      // Fallback to current origin
      const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      wsUrl = `${wsProtocol}//${window.location.host}/ws`;
    }
    
    console.log('🔌 Attempting to connect to WebSocket:', wsUrl);
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log('✅ WebSocket connected to', wsUrl);
      
      // Subscribe to project updates
      ws.send(JSON.stringify({
        type: 'subscribe',
        projectId: projectId,
        companyId: companyId
      }));
      console.log('📡 Subscribed to project updates:', { projectId, companyId });
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        console.log('📨 WebSocket message received:', message);

        if (message.type === 'album_status_updated') {
          const { albumId, projectId: msgProjectId, data } = message;
          
          console.log('🔍 Status update details:', {
            albumId,
            msgProjectId,
            currentProjectId: projectId,
            match: msgProjectId.toString() === projectId.toString()
          });
          
          // Only update if the update is for the current project
          if (msgProjectId.toString() === projectId.toString()) {
            console.log('🔄 Updating album status locally');
            
            // Update local album state optimistically
            setLocalAlbums(prevAlbums => {
              return prevAlbums.map(album => {
                if (album.id === albumId.toString()) {
                  // Get new status name from data
                  const statusMap: Record<string, string> = {
                    'waiting': 'Ожидание',
                    'upload': 'Выгрузка',
                    'sent': 'Отправлено',
                    'accepted': 'Принято',
                    'remarks': 'Замечания',
                    'production': 'В производстве'
                  };
                  
                  const newStatus = statusMap[data.statusCode] || album.status;
                  
                  return {
                    ...album,
                    status: newStatus,
                    lastEvent: {
                      status: newStatus,
                      date: message.timestamp || new Date().toISOString()
                    }
                  };
                }
                return album;
              });
            });
            
            // Clear cached events for this album to force reload on hover
            setAlbumEvents(prev => {
              const updated = { ...prev };
              delete updated[albumId];
              return updated;
            });
          } else {
            console.log('⏭️ Skipping update - different project');
          }
        }
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('❌ WebSocket error:', error);
    };

    ws.onclose = () => {
      console.log('🔌 WebSocket disconnected');
    };

    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [companyId, projectId, onRetry]);

  // Load album events when hovering
  const loadAlbumEvents = async (albumId: string) => {
    if (albumEvents[albumId] || !companyId || !projectId) return;
    
    try {
      const response = await companyApi.getAlbumEvents(companyId, projectId, albumId);
      if (response.success && response.events) {
        setAlbumEvents(prev => ({ ...prev, [albumId]: response.events }));
      }
    } catch (error) {
      console.error('Failed to load album events:', error);
    }
  };

  // Load templates from API
  useEffect(() => {
    const loadTemplates = async () => {
      if (!companyId) return;
      
      try {
        setTemplatesLoading(true);
        const response = await companyApi.getAlbumTemplates(companyId);
        
        if (response.success && response.templates) {
          setAlbumTemplates(response.templates);
        }
      } catch (error) {
        console.error('❌ Failed to load album templates:', error);
        toast.error('Не удалось загрузить шаблоны альбомов');
      } finally {
        setTemplatesLoading(false);
      }
    };

    loadTemplates();
  }, [companyId]);

  // Load participants from project
  useEffect(() => {
    const loadParticipants = async () => {
      if (!companyId || !projectId) return;
      
      try {
        setParticipantsLoading(true);
        const response = await companyApi.getProjectDetails(companyId, projectId);
        
        if (response.success && response.project) {
          console.log('📄 Project participants:', response.project.participants);
          console.log('🏭 Project departments:', response.project.departments);
          setExecutors(response.project.participants?.executors || []);
          setClients(response.project.participants?.clients || []);
          setProjectDepartments(response.project.departments || []);
        }
      } catch (error) {
        console.error('❌ Failed to load participants:', error);
      } finally {
        setParticipantsLoading(false);
      }
    };

    loadParticipants();
  }, [companyId, projectId]);

  // Apply template
  const handleApplyTemplate = (templateValue: string) => {
    if (templateValue === 'none') {
      setQuickAddData({
        name: '',
        code: '',
        department: '',
        executor: '',
        customer: '',
        deadline: '',
        albumLink: '',
        localLink: '',
        comment: ''
      });
      setSelectedTemplate('');
      return;
    }

    // Parse template value (format: "templateId-itemId" or just "templateId")
    const parts = templateValue.split('-');
    const templateId = parts[0];
    const itemId = parts.length > 1 ? parts[1] : null;

    const template = albumTemplates.find(t => t.id === templateId);
    if (template) {
      if (itemId && template.items) {
        // Find specific item
        const item = template.items.find((i: any) => i.id === itemId);
        if (item) {
          // Find department ID by code
          const department = projectDepartments.find((d: any) => d.code === item.departmentCode);
          
          setQuickAddData({
            ...quickAddData,
            name: item.name || '',
            code: item.code || '',
            department: department?.id?.toString() || item.departmentCode || ''
          });
        }
      } else if (template.items && template.items.length > 0) {
        // Use first item if no specific item ID
        const item = template.items[0];
        
        // Find department ID by code
        const department = projectDepartments.find((d: any) => d.code === item.departmentCode);
        
        setQuickAddData({
          ...quickAddData,
          name: item.name || template.name,
          code: item.code || '',
          department: department?.id?.toString() || item.departmentCode || ''
        });
      }
      setSelectedTemplate(templateValue);
    }
  };

  // Get unique values for filters
  const departments = useMemo(() => {
    return ['all', ...new Set(albums.map(a => a.department))];
  }, [albums]);

  const executorFilters = useMemo(() => {
    return ['all', ...new Set(albums.map(a => a.executor?.name).filter(Boolean))];
  }, [albums]);

  const statuses = ['all', 'Выгрузка', 'Отправлено', 'Принято', 'Ожидание', 'Замечания', 'В производстве'];

  // Parse CSV file
  const parseCSV = (text: string): any[] => {
    const lines = text.trim().split('\n');
    if (lines.length < 2) return [];
    
    // Parse header - support both comma and semicolon as delimiters
    const delimiter = lines[0].includes(';') ? ';' : ',';
    const headers = lines[0].split(delimiter).map(h => h.trim().toLowerCase().replace(/"/g, ''));
    
    // Map headers to expected fields
    const headerMap: Record<string, string> = {
      'название': 'name',
      'наименование': 'name',
      'наименование альбома': 'name',
      'name': 'name',
      'шифр': 'code',
      'шифр альбома': 'code',
      'код': 'code',
      'code': 'code',
      'отдел': 'department',
      'department': 'department',
      'дедлайн': 'deadline',
      'срок': 'deadline',
      'deadline': 'deadline',
      'ссылка': 'link',
      'внешняя ссылка': 'link',
      'link': 'link',
      'локальная ссылка': 'localLink',
      'внутренняя ссылка': 'localLink',
      'locallink': 'localLink',
      'комментарий': 'comment',
      'comment': 'comment'
    };

    const result: any[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      // Skip comment lines
      if (lines[i].trim().startsWith('#')) continue;
      
      const values = lines[i].split(delimiter).map(v => v.trim().replace(/"/g, ''));
      if (values.length === 0 || values.every(v => !v)) continue;
      
      const row: any = {};
      headers.forEach((header, index) => {
        const field = headerMap[header];
        if (field && values[index]) {
          row[field] = values[index];
        }
      });
      
      if (row.name || row.code) {
        result.push(row);
      }
    }
    
    return result;
  };

  // Handle file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setImportFile(file);
    setImportErrors([]);
    
    try {
      const text = await file.text();
      let data: any[] = [];
      
      if (file.name.endsWith('.csv') || file.name.endsWith('.txt')) {
        data = parseCSV(text);
      } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        // For Excel files, we'll use a simple approach - ask user to save as CSV
        toast.error('Пожалуйста, сохраните Excel файл как CSV и загрузите снова');
        setImportFile(null);
        return;
      }
      
      if (data.length === 0) {
        toast.error('Не удалось распознать данные в файле');
        setImportFile(null);
        return;
      }
      
      setImportData(data);
      toast.success(`Найдено ${data.length} альбомов для импорта`);
    } catch (error) {
      console.error('Error parsing file:', error);
      toast.error('Ошибка при чтении файла');
      setImportFile(null);
    }
  };

  // Perform import
  const handleImport = async () => {
    if (!companyId || !projectId || importData.length === 0) return;
    
    setIsImporting(true);
    setImportProgress({ current: 0, total: importData.length });
    setImportErrors([]);
    
    const errors: string[] = [];
    let successCount = 0;
    
    for (let i = 0; i < importData.length; i++) {
      const row = importData[i];
      setImportProgress({ current: i + 1, total: importData.length });
      
      try {
        // Find department by code (e.g., "КР", "АР", "ОВВК")
        let departmentId: number | undefined;
        if (row.department) {
          const dept = projectDepartments.find((d: any) => 
            d.code?.toLowerCase() === row.department.toLowerCase() ||
            d.name?.toLowerCase() === row.department.toLowerCase()
          );
          if (dept) {
            departmentId = dept.id;
          } else {
            // Department specified but not found - show error
            const availableDepts = projectDepartments.map((d: any) => d.code).join(', ');
            errors.push(`Строка ${i + 2}: Отдел "${row.department}" не найден. Доступные: ${availableDepts}`);
            continue;
          }
        } else {
          // No department specified - use first one
          departmentId = projectDepartments[0]?.id;
        }
        
        if (!departmentId) {
          errors.push(`Строка ${i + 2}: Не указан отдел для "${row.name || row.code}"`);
          continue;
        }
        
        // Parse deadline from DD.MM.YYYY or YYYY-MM-DD format
        let deadline: string | undefined;
        if (row.deadline) {
          const dateStr = row.deadline.trim();
          if (dateStr.includes('.')) {
            // DD.MM.YYYY format
            const [day, month, year] = dateStr.split('.');
            if (day && month && year) {
              deadline = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
            }
          } else if (dateStr.includes('-')) {
            // YYYY-MM-DD format
            deadline = dateStr;
          }
        }
        
        await companyApi.createAlbum(companyId, projectId, {
          name: row.name || row.code || 'Без названия',
          code: row.code || '',
          category: category,
          departmentId,
          deadline: deadline,
          link: row.link || undefined,
          localLink: row.localLink || undefined,
          comment: row.comment || undefined
        });
        
        successCount++;
      } catch (error: any) {
        errors.push(`Строка ${i + 1}: ${error.message || 'Ошибка создания'}`);
      }
    }
    
    setImportErrors(errors);
    setIsImporting(false);
    
    if (successCount > 0) {
      toast.success(`Импортировано ${successCount} из ${importData.length} альбомов`);
      // Refresh albums
      if (onRetry) onRetry();
    }
    
    if (errors.length === 0) {
      setIsImportDialogOpen(false);
      setImportFile(null);
      setImportData([]);
    }
  };

  // Download template
  const downloadTemplate = () => {
    // Create header with all fields
    let template = 'Наименование альбома;Шифр альбома;Отдел;Дедлайн;Внешняя ссылка;Локальная ссылка;Комментарий\n';
    
    // Add example rows with real departments from project
    projectDepartments.forEach((d: any, index: number) => {
      template += `Пример альбома ${index + 1};${d.code}-01;${d.code};31.12.2025;https://example.com;\\\\server\\folder;Комментарий\n`;
    });
    
    // Add comment section with available department codes
    template += '\n# Доступные коды отделов:\n';
    projectDepartments.forEach((d: any) => {
      template += `# ${d.code} - ${d.name}\n`;
    });
    template += '\n# Формат дедлайна: ДД.ММ.ГГГГ или ГГГГ-ММ-ДД\n';
    
    const blob = new Blob(['\ufeff' + template], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'albums_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Filter templates by project departments
  const filteredTemplates = useMemo(() => {
    if (!projectDepartments || projectDepartments.length === 0) {
      return albumTemplates;
    }

    const projectDepartmentCodes = projectDepartments.map((d: any) => d.code);
    
    return albumTemplates.map(template => {
      // Filter template items by department
      const filteredItems = template.items?.filter((item: any) => 
        projectDepartmentCodes.includes(item.departmentCode)
      ) || [];

      return {
        ...template,
        items: filteredItems
      };
    }).filter(template => template.items.length > 0); // Only show templates with matching items
  }, [albumTemplates, projectDepartments]);

  // Filter albums (use localAlbums for real-time updates)
  const filteredAlbums = useMemo(() => {
    return localAlbums.filter(album => {
      const matchesSearch = 
        album.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        album.code.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesDepartment = departmentFilter === 'all' || album.department === departmentFilter;
      const matchesExecutor = executorFilter === 'all' || album.executor?.name === executorFilter;
      const matchesStatus = statusFilter === 'all' || album.status === statusFilter;

      return matchesSearch && matchesDepartment && matchesExecutor && matchesStatus;
    });
  }, [localAlbums, searchQuery, departmentFilter, executorFilter, statusFilter]);

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

  // Handle album deletion
  const handleDeleteAlbum = async () => {
    if (!albumToDelete || !companyId || !projectId) return;
    
    console.log('🗑️ Deleting album:', albumToDelete.id, 'Full album:', albumToDelete);
    
    setIsDeleting(true);
    try {
      await companyApi.deleteAlbum(Number(companyId), Number(projectId), Number(albumToDelete.id));
      toast.success('Альбом успешно удален');
      setAlbumToDelete(null);
      onRetry?.(); // Refresh the albums list
    } catch (error: any) {
      console.error('Error deleting album:', error);
      toast.error(error.message || 'Не удалось удалить альбом');
    } finally {
      setIsDeleting(false);
    }
  };

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
      case 'Ожидание':
        return { 
          variant: 'default' as const, 
          text: 'Ожидание', 
          className: 'bg-slate-100 text-slate-700 border-slate-200',
          rowBgClass: 'bg-slate-50'
        };
      case 'Выгрузка':
        return { 
          variant: 'default' as const, 
          text: 'Выгрузка', 
          className: 'bg-blue-100 text-blue-700 border-blue-200',
          rowBgClass: 'bg-blue-50'
        };
      case 'Отправлено':
        return { 
          variant: 'default' as const, 
          text: 'Отправлено', 
          className: 'bg-emerald-100 text-emerald-700 border-emerald-200',
          rowBgClass: 'bg-emerald-50'
        };
      case 'Принято':
        return { 
          variant: 'default' as const, 
          text: 'Принято', 
          className: 'bg-green-100 text-green-800 border-green-300',
          rowBgClass: 'bg-green-100'
        };
      case 'Замечания':
        return { 
          variant: 'destructive' as const, 
          text: 'Замечания', 
          className: 'bg-orange-100 text-orange-700 border-orange-200',
          rowBgClass: 'bg-orange-50'
        };
      case 'В производстве':
        return { 
          variant: 'default' as const, 
          text: 'В производстве', 
          className: 'bg-violet-100 text-violet-700 border-violet-200',
          rowBgClass: 'bg-violet-50'
        };
      default:
        return { 
          variant: 'default' as const, 
          text: status, 
          className: '',
          rowBgClass: ''
        };
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

  // Format date to YYYY-MM-DD for date input
  const formatDateForInput = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
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

  // Empty state - show quick add form or empty message
  if (albums.length === 0) {
    if (isQuickAdding && onQuickAdd) {
      // Show the table with only quick add form when adding first album
      return (
        <div className="space-y-4">
          <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
            <table className="w-full border-collapse table-fixed min-w-[1200px]">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-[200px]">Название</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-[100px]">Шифр</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-[120px]">Отдел</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-[150px]">Исполнитель</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-[150px]">Заказчик</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-[110px]">Дедлайн</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-[130px]">Статус</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-[120px]">Ссылка</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-[200px]">Комментарий</th>
                </tr>
              </thead>
              <tbody>
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
                                setQuickAddData({ name: '', code: '', department: '', executor: '', deadline: '', albumLink: '', localLink: '', comment: '' });
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
                              setQuickAddData({ name: '', code: '', department: '', executor: '', deadline: '', albumLink: '', localLink: '', comment: '' });
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
                        {/* Quick add form content will be rendered here - copying from below */}
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
                                {templatesLoading ? (
                                  <SelectItem value="loading" disabled>Загрузка шаблонов...</SelectItem>
                                ) : filteredTemplates.length === 0 ? (
                                  <SelectItem value="empty" disabled>Нет доступных шаблонов для этого проекта</SelectItem>
                                ) : (
                                  filteredTemplates.flatMap(template => 
                                    template.items && template.items.length > 0 ? (
                                      template.items.map((item: any) => (
                                        <SelectItem key={`${template.id}-${item.id}`} value={`${template.id}-${item.id}`}>
                                          {item.name} ({item.code})
                                        </SelectItem>
                                      ))
                                    ) : (
                                      <SelectItem key={template.id} value={template.id}>
                                        {template.name}
                                      </SelectItem>
                                    )
                                  )
                                )}
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Название альбома *
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
                              Шифр альбома *
                            </label>
                            <Input
                              placeholder="Например: АР"
                              value={quickAddData.code}
                              onChange={(e) => setQuickAddData({...quickAddData, code: e.target.value})}
                              className="h-10"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Отдел
                            </label>
                            <Select 
                              value={quickAddData.department} 
                              onValueChange={(value) => setQuickAddData({...quickAddData, department: value})}
                            >
                              <SelectTrigger className="h-10">
                                <SelectValue placeholder="Выберите отдел" />
                              </SelectTrigger>
                              <SelectContent className="z-[100]">
                                {participantsLoading ? (
                                  <SelectItem value="loading" disabled>Загрузка...</SelectItem>
                                ) : projectDepartments.length === 0 ? (
                                  <SelectItem value="empty" disabled>Нет отделов</SelectItem>
                                ) : (
                                  projectDepartments.map(dept => (
                                    <SelectItem key={dept.id} value={dept.id}>
                                      {dept.name} ({dept.code})
                                    </SelectItem>
                                  ))
                                )}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Исполнитель
                            </label>
                            <Select 
                              value={quickAddData.executor} 
                              onValueChange={(value) => setQuickAddData({...quickAddData, executor: value})}
                            >
                              <SelectTrigger className="h-10">
                                <SelectValue placeholder="Выберите исполнителя" />
                              </SelectTrigger>
                              <SelectContent className="z-[100]">
                                {participantsLoading ? (
                                  <SelectItem value="loading" disabled>Загрузка...</SelectItem>
                                ) : executors.length === 0 ? (
                                  <SelectItem value="empty" disabled>Нет исполнителей</SelectItem>
                                ) : (
                                  executors.map(executor => (
                                    <SelectItem key={executor.id} value={executor.id}>
                                      {executor.name}
                                    </SelectItem>
                                  ))
                                )}
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Заказчик
                            </label>
                            <Select 
                              value={quickAddData.customer} 
                              onValueChange={(value) => setQuickAddData({...quickAddData, customer: value})}
                            >
                              <SelectTrigger className="h-10">
                                <SelectValue placeholder="Выберите заказчика" />
                              </SelectTrigger>
                              <SelectContent className="z-[100]">
                                {participantsLoading ? (
                                  <SelectItem value="loading" disabled>Загрузка...</SelectItem>
                                ) : clients.length === 0 ? (
                                  <SelectItem value="empty" disabled>Нет заказчиков</SelectItem>
                                ) : (
                                  clients.map(client => (
                                    <SelectItem key={client.id} value={client.id}>
                                      {client.name}
                                    </SelectItem>
                                  ))
                                )}
                              </SelectContent>
                            </Select>
                          </div>                          <div>
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
                              Внешняя ссылка
                            </label>
                            <Input
                              placeholder="https://..."
                              value={quickAddData.albumLink}
                              onChange={(e) => setQuickAddData({...quickAddData, albumLink: e.target.value})}
                              className="h-10"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Внутренняя ссылка (локальная папка)
                            </label>
                            <Input
                              placeholder="C:\Projects\..."
                              value={quickAddData.localLink}
                              onChange={(e) => setQuickAddData({...quickAddData, localLink: e.target.value})}
                              className="h-10"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Комментарий
                            </label>
                            <Input
                              placeholder="Дополнительная информация"
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
              </tbody>
            </table>
          </div>
        </div>
      );
    }
    
    // Show empty state with button
    return (
      <>
        <div className="rounded-lg border border-gray-200 p-12 text-center bg-white">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FolderOpen className="w-12 h-12 text-gray-400" />
          </div>
          <h3 className="text-gray-900 mb-2">Нет альбомов</h3>
          <p className="text-gray-500 text-sm mb-6">Создайте первый альбом для проекта или импортируйте из CSV</p>
          <div className="flex items-center justify-center gap-3">
            {onQuickAdd && (
              <Button onClick={() => setIsQuickAdding(true)} className="gap-2">
                <Plus className="w-4 h-4" />
                Создать альбом
              </Button>
            )}
            <Button onClick={() => setIsImportDialogOpen(true)} variant="outline" className="gap-2">
              <Upload className="w-4 h-4" />
              Импорт из CSV
            </Button>
          </div>
        </div>

        {/* Import Dialog for empty state */}
        <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
          <DialogContent className="max-w-[400px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-blue-600" />
                Импорт альбомов
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              {/* Two column layout */}
              <div className="grid grid-cols-2 gap-3">
                {/* Left: Download template */}
                <button
                  onClick={downloadTemplate}
                  className="flex flex-col items-center gap-2 p-4 border-2 border-dashed border-gray-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors group"
                >
                  <Download className="w-8 h-8 text-gray-400 group-hover:text-blue-500" />
                  <span className="text-sm font-medium text-gray-600 group-hover:text-blue-600">Скачать шаблон</span>
                </button>
                
                {/* Right: Upload file */}
                <label className="flex flex-col items-center gap-2 p-4 border-2 border-dashed border-gray-200 rounded-lg hover:border-green-400 hover:bg-green-50 transition-colors cursor-pointer group">
                  <Upload className="w-8 h-8 text-gray-400 group-hover:text-green-500" />
                  <span className="text-sm font-medium text-gray-600 group-hover:text-green-600">
                    {importFile ? importFile.name : 'Загрузить CSV'}
                  </span>
                  <input
                    type="file"
                    accept=".csv,.txt"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>
              
              {/* Preview */}
              {importData.length > 0 && (
                <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-green-800">
                      ✓ Готово к импорту: {importData.length} альбомов
                    </span>
                  </div>
                  <div className="max-h-24 overflow-auto text-xs text-green-700">
                    {importData.slice(0, 5).map((row, i) => (
                      <div key={i} className="truncate">
                        {row.code} — {row.name || 'Без названия'}
                      </div>
                    ))}
                    {importData.length > 5 && (
                      <div className="text-green-600 italic">... и ещё {importData.length - 5}</div>
                    )}
                  </div>
                </div>
              )}
              
              {/* Progress */}
              {isImporting && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Импорт...</span>
                    <span>{importProgress.current} / {importProgress.total}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all"
                      style={{ width: `${(importProgress.current / importProgress.total) * 100}%` }}
                    />
                  </div>
                </div>
              )}
              
              {/* Errors */}
              {importErrors.length > 0 && (
                <div className="p-3 bg-red-50 rounded-lg border border-red-200 max-h-24 overflow-y-auto">
                  <div className="flex items-center gap-2 text-red-800 font-medium text-sm mb-1">
                    <AlertCircle className="w-4 h-4" />
                    Ошибки ({importErrors.length})
                  </div>
                  <ul className="text-xs text-red-700 space-y-1">
                    {importErrors.slice(0, 3).map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            
            <div className="flex justify-end gap-3 pt-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {
                  setIsImportDialogOpen(false);
                  setImportFile(null);
                  setImportData([]);
                  setImportErrors([]);
                }}
              >
                Отмена
              </Button>
              <Button 
                onClick={handleImport}
                disabled={importData.length === 0 || isImporting}
                className="gap-2"
              >
                {isImporting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Импорт...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Импортировать {importData.length > 0 && `(${importData.length})`}
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </>
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
            {departments.slice(1).map((dept, index) => (
              <SelectItem key={`dept-${index}-${dept}`} value={dept}>{dept}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={executorFilter} onValueChange={setExecutorFilter}>
          <SelectTrigger className="w-[200px] bg-white">
            <SelectValue placeholder="Исполнитель" />
          </SelectTrigger>
          <SelectContent className="z-[100]">
            <SelectItem value="all">Все исполнители</SelectItem>
            {executorFilters.slice(1).map((exec, index) => (
              <SelectItem key={`exec-${index}-${exec}`} value={exec}>{exec}</SelectItem>
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
          onClick={() => setIsImportDialogOpen(true)}
          variant="outline"
          className="gap-2"
        >
          <Upload className="w-4 h-4" />
          Импорт
        </Button>

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
      <div className={`rounded-lg border border-gray-200 bg-white shadow-sm transition-all ${isExpanded ? 'max-h-none' : 'max-h-[600px]'}`}>
        <div className="overflow-x-auto overflow-y-auto max-h-full" style={{ overflow: 'visible' }}>
          <table className="w-full" style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', tableLayout: 'fixed' }}>
            <thead className="sticky top-0 bg-[#E2E8F0]">
              <tr>
                <th className="text-left py-1 px-3 font-semibold text-gray-700" style={{ fontSize: '13px', width: '50px' }}>№</th>
                <th className="text-left py-1 px-3 font-semibold text-gray-700" style={{ fontSize: '13px', width: '80px' }}>Шифр</th>
                <th className="text-left py-1 px-3 font-semibold text-gray-700 min-w-[180px]" style={{ fontSize: '13px', width: '200px' }}>Название альбома</th>
                <th className="text-left py-1 px-3 font-semibold text-gray-700" style={{ fontSize: '13px', width: '180px' }}>Отдел</th>
                <th className="text-left py-1 px-3 font-semibold text-gray-700 min-w-[140px]" style={{ fontSize: '13px', width: '160px' }}>Исполнитель</th>
                <th className="text-left py-1 px-3 font-semibold text-gray-700 min-w-[140px]" style={{ fontSize: '13px', width: '160px' }}>Заказчик</th>
                <th className="text-left py-1 px-3 font-semibold text-gray-700" style={{ fontSize: '13px', width: '110px' }}>Дедлайн</th>
                <th className="text-left py-1 px-3 font-semibold text-gray-700 min-w-[150px]" style={{ fontSize: '13px', width: '150px' }}>Последнее событие</th>
                <th className="text-left py-1 px-3 font-semibold text-gray-700" style={{ fontSize: '13px', width: '80px' }}>Ссылки</th>
                <th className="text-left py-1 px-3 font-semibold text-gray-700 min-w-[180px]" style={{ fontSize: '13px', width: '180px' }}>Комментарий</th>
                <th className="text-left py-1 px-3 font-semibold text-gray-700" style={{ fontSize: '13px', width: '80px' }}>Действия</th>
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

                const getRowBgColor = () => {
                  if (statusConfig.rowBgClass) {
                    switch (album.status) {
                      case 'Ожидание': return '#f8fafc';
                      case 'Выгрузка': return '#eff6ff';
                      case 'Отправлено': return '#ecfdf5';
                      case 'Принято': return '#bbf7d0';
                      case 'Замечания': return '#fff7ed';
                      case 'В производстве': return '#f5f3ff';
                      default: return '';
                    }
                  }
                  return '';
                };

                return (
                  <tr
                    key={album.id}
                    data-album-id={album.id}
                    onClick={() => {
                      if (!isEditMode) {
                        setSelectedRow(album.id);
                        onAlbumClick(album.id);
                      }
                    }}
                    onMouseEnter={() => {
                      setHoveredAlbumId(album.id);
                      loadAlbumEvents(album.id);
                    }}
                    onMouseLeave={() => setHoveredAlbumId(null)}
                    className={`
                      border-t border-gray-100 ${!isEditMode ? 'cursor-pointer' : ''} transition-colors
                      ${!isEditMode ? 'hover:bg-[#EFF6FF]' : ''}
                      ${isSelected && !isEditMode ? 'border-l-4 border-l-[#3B82F6]' : ''}
                    `}
                    style={{ backgroundColor: getRowBgColor() || (index % 2 === 0 ? '#ffffff' : '#F1F5F9') }}
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
                          value={currentAlbum.executor?.id || ''} 
                          onValueChange={(val) => {
                            const selectedExecutor = executors.find((e: any) => e.id === val);
                            if (selectedExecutor) {
                              updateField('executor', { id: selectedExecutor.id, name: selectedExecutor.name });
                            }
                          }}
                        >
                          <SelectTrigger className="h-7 text-xs">
                            <SelectValue placeholder="Выберите исполнителя" />
                          </SelectTrigger>
                          <SelectContent>
                            {executors.length === 0 ? (
                              <SelectItem value="empty" disabled>Нет исполнителей</SelectItem>
                            ) : (
                              executors.map((executor: any) => (
                                <SelectItem key={executor.id} value={executor.id}>{executor.name}</SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          {album.executor && album.executor.name ? (
                            <>
                              <img 
                                src={album.executor.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(album.executor.name)}&background=3B82F6&color=fff&size=32`}
                                alt={album.executor.name}
                                className="w-5 h-5 rounded-full"
                              />
                              <span className="text-gray-900 text-xs">{album.executor.name}</span>
                            </>
                          ) : (
                            <span className="text-gray-400 text-xs">—</span>
                          )}
                        </div>
                      )}
                    </td>
                    
                    {/* Заказчик */}
                    <td className="py-1 px-3" onClick={(e) => isEditMode && e.stopPropagation()}>
                      {isEditMode ? (
                        <Select 
                          value={currentAlbum.customer?.id || ''} 
                          onValueChange={(val) => {
                            const selectedCustomer = clients.find((c: any) => c.id === val);
                            if (selectedCustomer) {
                              updateField('customer', { id: selectedCustomer.id, name: selectedCustomer.name });
                            }
                          }}
                        >
                          <SelectTrigger className="h-7 text-xs">
                            <SelectValue placeholder="Выберите заказчика" />
                          </SelectTrigger>
                          <SelectContent>
                            {clients.length === 0 ? (
                              <SelectItem value="empty" disabled>Нет заказчиков</SelectItem>
                            ) : (
                              clients.map((client: any) => (
                                <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          {album.customer && album.customer.name ? (
                            <>
                              <img 
                                src={album.customer.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(album.customer.name)}&background=10B981&color=fff&size=32`}
                                alt={album.customer.name}
                                className="w-5 h-5 rounded-full"
                              />
                              <span className="text-gray-900 text-xs">{album.customer.name}</span>
                            </>
                          ) : (
                            <span className="text-gray-400 text-xs">—</span>
                          )}
                        </div>
                      )}
                    </td>
                    
                    {/* Дедлайн */}
                    <td className="py-1 px-3" onClick={(e) => isEditMode && e.stopPropagation()}>
                      {isEditMode ? (
                        <Input
                          type="date"
                          value={formatDateForInput(currentAlbum.deadline)}
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
                    <td className="py-1 px-3" style={{ minWidth: '150px' }}>
                      <div className="relative inline-block w-full">
                        {album.lastEvent && album.lastEvent.status ? (
                          <>
                            <div className="space-y-1">
                              <span className="text-gray-700 text-xs font-medium">{album.lastEvent.status}</span>
                              <p className="text-xs text-gray-500">{formatDateTime(album.lastEvent.date)}</p>
                            </div>
                            
                            {/* История при наведении */}
                            {hoveredAlbumId === album.id && albumEvents[album.id] && albumEvents[album.id].length > 1 && (
                              <div className="absolute left-0 top-full mt-2 bg-gradient-to-br from-white to-gray-50 border border-gray-200 rounded-lg shadow-xl p-2.5 w-64 max-h-64 overflow-y-auto backdrop-blur-sm" style={{ zIndex: 9999 }}>
                                <div className="space-y-2">
                                  {albumEvents[album.id].slice(1).map((event: any, idx: number) => (
                                    <div key={idx} className="flex items-start gap-2 p-2 rounded-md hover:bg-white/50 transition-colors">
                                      <div className="flex-shrink-0 w-1.5 h-1.5 mt-1.5 rounded-full bg-gray-400"></div>
                                      <div className="flex-1 min-w-0">
                                        <div className="text-xs font-medium text-gray-700">{event.statusName || event.status}</div>
                                        <div className="text-[11px] text-gray-500 mt-0.5">{formatDateTime(event.createdAt || event.created_at || event.date)}</div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </>
                        ) : (
                          <span className="text-gray-400 text-xs">—</span>
                        )}
                      </div>
                    </td>
                    
                    {/* Ссылки */}
                    <td className="py-1 px-3" onClick={(e) => isEditMode && e.stopPropagation()}>
                      {isEditMode ? (
                        <div className="space-y-1">
                          <Input
                            value={currentAlbum.albumLink || ''}
                            onChange={(e) => updateField('albumLink', e.target.value)}
                            placeholder="Внешняя ссылка https://..."
                            className="h-7 text-xs"
                          />
                          <Input
                            value={currentAlbum.localLink || ''}
                            onChange={(e) => updateField('localLink', e.target.value)}
                            placeholder="Локальная папка C:\..."
                            className="h-7 text-xs"
                          />
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          {album.albumLink && (
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
                                <TooltipContent>Открыть внешнюю ссылку</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                          {album.localLink && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <a 
                                    href={`file:///${album.localLink.replace(/\\/g, '/')}`}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      // Копируем путь в буфер обмена
                                      navigator.clipboard.writeText(album.localLink);
                                      toast.success('Путь скопирован в буфер обмена');
                                    }}
                                    className="text-[#64748B] hover:text-[#F59E0B] transition-colors inline-block cursor-pointer"
                                  >
                                    <FolderOpen className="w-4 h-4" />
                                  </a>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <div>Локальная папка</div>
                                  <div className="text-xs text-gray-400">{album.localLink}</div>
                                  <div className="text-xs">Клик = копировать путь</div>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                          {!album.albumLink && !album.localLink && (
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
                    
                    {/* Действия */}
                    <td className="py-1 px-3" onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setAlbumToDelete(album)}
                        className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                );
              })}

              {/* Quick add row */}
              {isQuickAdding ? (
                <tr className="border-t-2 border-blue-300 bg-gradient-to-r from-blue-50 to-indigo-50">
                  <td colSpan={11} className="p-6">
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
                                setQuickAddData({ name: '', code: '', department: '', executor: '', deadline: '', albumLink: '', localLink: '', comment: '' });
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
                              setQuickAddData({ name: '', code: '', department: '', executor: '', deadline: '', albumLink: '', localLink: '', comment: '' });
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
                                {templatesLoading ? (
                                  <SelectItem value="loading" disabled>Загрузка шаблонов...</SelectItem>
                                ) : filteredTemplates.length === 0 ? (
                                  <SelectItem value="empty" disabled>Нет доступных шаблонов для этого проекта</SelectItem>
                                ) : (
                                  filteredTemplates.flatMap(template => 
                                    template.items && template.items.length > 0 ? (
                                      template.items.map((item: any) => (
                                        <SelectItem key={`${template.id}-${item.id}`} value={`${template.id}-${item.id}`}>
                                          {item.name} ({item.code})
                                        </SelectItem>
                                      ))
                                    ) : (
                                      <SelectItem key={template.id} value={template.id}>
                                        {template.name}
                                      </SelectItem>
                                    )
                                  )
                                )}
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
                                {participantsLoading ? (
                                  <SelectItem value="loading" disabled>Загрузка...</SelectItem>
                                ) : projectDepartments.length === 0 ? (
                                  <SelectItem value="empty" disabled>Нет отделов</SelectItem>
                                ) : (
                                  projectDepartments.map(dept => (
                                    <SelectItem key={dept.id} value={dept.id}>
                                      {dept.name} ({dept.code})
                                    </SelectItem>
                                  ))
                                )}
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
                                {participantsLoading ? (
                                  <SelectItem value="loading" disabled>Загрузка...</SelectItem>
                                ) : executors.length === 0 ? (
                                  <SelectItem value="empty" disabled>Нет исполнителей</SelectItem>
                                ) : (
                                  executors.map(executor => (
                                    <SelectItem key={executor.id} value={executor.id}>
                                      {executor.name}
                                    </SelectItem>
                                  ))
                                )}
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Заказчик
                            </label>
                            <Select 
                              value={quickAddData.customer} 
                              onValueChange={(val) => setQuickAddData({...quickAddData, customer: val})}
                            >
                              <SelectTrigger className="h-10">
                                <SelectValue placeholder="Выберите заказчика" />
                              </SelectTrigger>
                              <SelectContent className="z-[100]">
                                {participantsLoading ? (
                                  <SelectItem value="loading" disabled>Загрузка...</SelectItem>
                                ) : clients.length === 0 ? (
                                  <SelectItem value="empty" disabled>Нет заказчиков</SelectItem>
                                ) : (
                                  clients.map(client => (
                                    <SelectItem key={client.id} value={client.id}>
                                      {client.name}
                                    </SelectItem>
                                  ))
                                )}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        
                        {/* Right column */}
                        <div className="space-y-4">\n                          <div>
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
                              Внешняя ссылка
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
                              Внутренняя ссылка (локальная папка)
                            </label>
                            <Input
                              placeholder="C:\Projects\..."
                              value={quickAddData.localLink}
                              onChange={(e) => setQuickAddData({...quickAddData, localLink: e.target.value})}
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
                  <td colSpan={11} className="py-3 px-4">
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

      {/* Delete confirmation dialog */}
      <AlertDialog open={!!albumToDelete} onOpenChange={() => setAlbumToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить альбом?</AlertDialogTitle>
            <AlertDialogDescription>
              Вы уверены, что хотите удалить альбом <strong>{albumToDelete?.code} - {albumToDelete?.name}</strong>?
              Это действие необратимо и удалит все связанные события.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel 
              disabled={isDeleting}
              className="bg-white text-gray-900 border border-gray-300 hover:bg-gray-100"
            >
              Отмена
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAlbum}
              disabled={isDeleting}
              className="!bg-red-600 !text-white hover:!bg-red-700 border-0"
              style={{ backgroundColor: '#dc2626', color: '#ffffff' }}
            >
              {isDeleting ? 'Удаление...' : 'Удалить'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Import Dialog */}
      <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
        <DialogContent className="max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-blue-600" />
              Импорт альбомов
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Two column layout */}
            <div className="grid grid-cols-2 gap-3">
              {/* Left: Download template */}
              <button
                onClick={downloadTemplate}
                className="flex flex-col items-center gap-2 p-4 border-2 border-dashed border-gray-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors group"
              >
                <Download className="w-8 h-8 text-gray-400 group-hover:text-blue-500" />
                <span className="text-sm font-medium text-gray-600 group-hover:text-blue-600">Скачать шаблон</span>
              </button>
              
              {/* Right: Upload file */}
              <label className="flex flex-col items-center gap-2 p-4 border-2 border-dashed border-gray-200 rounded-lg hover:border-green-400 hover:bg-green-50 transition-colors cursor-pointer group">
                <Upload className="w-8 h-8 text-gray-400 group-hover:text-green-500" />
                <span className="text-sm font-medium text-gray-600 group-hover:text-green-600 text-center">
                  {importFile ? importFile.name : 'Загрузить CSV'}
                </span>
                <input
                  type="file"
                  accept=".csv,.txt"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
            
            {/* Preview */}
            {importData.length > 0 && (
              <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-green-800">
                    ✓ Готово к импорту: {importData.length} альбомов
                  </span>
                </div>
                <div className="max-h-24 overflow-auto text-xs text-green-700">
                  {importData.slice(0, 5).map((row, i) => (
                    <div key={i} className="truncate">
                      {row.code} — {row.name || 'Без названия'}
                    </div>
                  ))}
                  {importData.length > 5 && (
                    <div className="text-green-600 italic">... и ещё {importData.length - 5}</div>
                  )}
                </div>
              </div>
            )}
            
            {/* Progress */}
            {isImporting && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Импорт...</span>
                  <span>{importProgress.current} / {importProgress.total}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{ width: `${(importProgress.current / importProgress.total) * 100}%` }}
                  />
                </div>
              </div>
            )}
            
            {/* Errors */}
            {importErrors.length > 0 && (
              <div className="p-3 bg-red-50 rounded-lg border border-red-200 max-h-32 overflow-y-auto">
                <div className="flex items-center gap-2 text-red-800 font-medium text-sm mb-2">
                  <AlertCircle className="w-4 h-4" />
                  Ошибки ({importErrors.length})
                </div>
                <ul className="text-xs text-red-700 space-y-1">
                  {importErrors.map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          
          <div className="flex justify-end gap-3 pt-2">
            <Button 
              variant="outline"
              size="sm" 
              onClick={() => {
                setIsImportDialogOpen(false);
                setImportFile(null);
                setImportData([]);
                setImportErrors([]);
              }}
            >
              Отмена
            </Button>
            <Button 
              onClick={handleImport}
              disabled={importData.length === 0 || isImporting}
              className="gap-2"
            >
              {isImporting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Импорт...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Импортировать {importData.length > 0 && `(${importData.length})`}
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}