import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { Alert, AlertDescription } from './ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { toast } from 'sonner';
import { getCompanyParticipants, checkTelegramChannel, createParticipant } from '../lib/companyApi';
import { 
  Plus, 
  Trash2, 
  ChevronRight, 
  ChevronLeft, 
  Check, 
  Users, 
  Building2, 
  MessageSquare, 
  FolderOpen,
  Info,
  Copy,
  Loader2,
  CheckCircle,
  XCircle,
  UserPlus
} from 'lucide-react';

interface CreateProjectWizardProps {
  isOpen: boolean;
  onClose: (open: boolean) => void;
  onComplete: (projectData: any) => void;
  companyId: string;
}

interface Department {
  id: string;
  name: string;
  code: string;
}

interface User {
  id: string;
  participantId?: number; // ID из таблицы participants, если пользователь из базы
  name: string;
  telegramUsername: string;
  email: string;
  departmentId: string;
  role: 'executor' | 'client';
}

interface Album {
  id: string;
  name: string;
  type: 'PD' | 'RD';
}

// Предопределенные отделы
const AVAILABLE_DEPARTMENTS = [
  { code: 'AR', name: 'Архитектурный отдел' },
  { code: 'KR', name: 'Конструкторский отдел' },
  { code: 'OVVK', name: 'Отдел отопления, вентиляции и кондиционирования' },
  { code: 'ES', name: 'Отдел электроснабжения' },
  { code: 'GP', name: 'Отдел генерального плана' },
  { code: 'SS', name: 'Отдел слаботочных систем' },
];

export function CreateProjectWizard({ isOpen, onClose, onComplete, companyId }: CreateProjectWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  
  // Шаг 1: Основная информация
  const [projectName, setProjectName] = useState('');
  const [projectCode, setProjectCode] = useState('');
  const [clientCompany, setClientCompany] = useState('');

  // Загрузка участников из базы
  const [availableParticipants, setAvailableParticipants] = useState<any[]>([]);
  const [isLoadingParticipants, setIsLoadingParticipants] = useState(false);

  // Шаг 2: Отделы
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDepartmentCode, setSelectedDepartmentCode] = useState('');

  // Шаг 3: Пользователи
  const [users, setUsers] = useState<User[]>([]);
  const [newUserName, setNewUserName] = useState('');
  const [newUserTelegram, setNewUserTelegram] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserDepartment, setNewUserDepartment] = useState('');
  const [newUserRole, setNewUserRole] = useState<'executor' | 'client'>('executor');
  const [selectedExistingUserId, setSelectedExistingUserId] = useState('');
  const [existingUserDepartment, setExistingUserDepartment] = useState('');

  // Шаг 4: Telegram бот
  const [channelUrl, setChannelUrl] = useState('');
  const [isCheckingConnection, setIsCheckingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [connectionErrorMessage, setConnectionErrorMessage] = useState('');
  const [connectionChannelTitle, setConnectionChannelTitle] = useState('');
  const [isCopied, setIsCopied] = useState(false);

  // Шаг 5: Альбомы
  const [albumsPD, setAlbumsPD] = useState<Album[]>([]);
  const [albumsRD, setAlbumsRD] = useState<Album[]>([]);
  const [newAlbumName, setNewAlbumName] = useState('');
  const [newAlbumType, setNewAlbumType] = useState<'PD' | 'RD'>('PD');

  const steps = [
    { number: 1, title: 'Информация о проекте', icon: Building2 },
    { number: 2, title: 'Отделы', icon: Building2 },
    { number: 3, title: 'Пользователи', icon: Users },
    { number: 4, title: 'Telegram бот', icon: MessageSquare },
    { number: 5, title: 'Всё готово', icon: Check },
  ];

  // Загрузить участников компании при открытии визарда
  const loadParticipants = async () => {
    setIsLoadingParticipants(true);
    try {
      const companyId = localStorage.getItem('companyId');
      if (!companyId) {
        toast.error('Компания не выбрана');
        return;
      }

      const result = await getCompanyParticipants(companyId);
      if (result.users) {
        setAvailableParticipants(result.users);
      }
    } catch (error) {
      console.error('Ошибка загрузки участников:', error);
      toast.error('Не удалось загрузить участников компании');
    } finally {
      setIsLoadingParticipants(false);
    }
  };

  const handleNext = () => {
    if (currentStep < 5) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    const projectData = {
      projectName,
      projectCode,
      clientCompany,
      departments,
      users,
      channelUrl,
      albums: [...albumsPD, ...albumsRD],
    };
    
    onComplete(projectData);
    resetForm();
    onClose(false);
  };

  const handleSkipAlbums = () => {
    handleComplete();
  };

  const resetForm = () => {
    setCurrentStep(1);
    setProjectName('');
    setProjectCode('');
    setClientCompany('');
    setDepartments([]);
    setUsers([]);
    setChannelUrl('');
    setAlbumsPD([]);
    setAlbumsRD([]);
  };

  // Управление отделами
  const addDepartment = () => {
    const selectedDepartment = AVAILABLE_DEPARTMENTS.find(d => d.code === selectedDepartmentCode);
    if (selectedDepartment) {
      setDepartments([
        ...departments,
        {
          id: Date.now().toString(),
          name: selectedDepartment.name,
          code: selectedDepartment.code,
        },
      ]);
      setSelectedDepartmentCode('');
    }
  };

  const removeDepartment = (id: string) => {
    setDepartments(departments.filter(d => d.id !== id));
    // Удаляем пользователей из этого отдела
    setUsers(users.filter(u => u.departmentId !== id));
  };

  // Управление пользователями
    const addUser = async () => {
    if (newUserName.trim() && newUserTelegram.trim() && newUserEmail.trim() && newUserDepartment) {
      try {
        // Получаем отдел
        const department = departments.find(d => d.id === newUserDepartment);
        if (!department) {
          toast.error('Отдел не найден');
          return;
        }

        // Разбиваем имя на firstName и lastName
        const nameParts = newUserName.trim().split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';

        // Создаем участника в базе данных (backend принимает departmentCode, не ID)
        const result = await createParticipant(companyId, {
          firstName,
          lastName,
          telegramUsername: newUserTelegram.trim().replace('@', ''),
          email: newUserEmail.trim(),
          roleType: newUserRole === 'client' ? 'customer' : 'executor',
          departmentCode: department.code // Используем код отдела
        });

        // Добавляем пользователя в локальный массив с participantId из БД
        setUsers([
          ...users,
          {
            id: Date.now().toString(),
            participantId: result.participantId,
            name: newUserName.trim(),
            telegramUsername: newUserTelegram.trim(),
            email: newUserEmail.trim(),
            departmentId: newUserDepartment,
            role: newUserRole,
          },
        ]);
        
        setNewUserName('');
        setNewUserTelegram('');
        setNewUserEmail('');
        setNewUserDepartment('');
        setNewUserRole('executor');
        toast.success('Пользователь добавлен');
      } catch (error: any) {
        console.error('Ошибка при создании участника:', error);
        toast.error(error.message || 'Не удалось создать участника');
      }
    }
  };

  const addExistingUser = () => {
    console.log('addExistingUser called', { selectedExistingUserId, availableParticipants });
    
    if (selectedExistingUserId) {
      const existingUser = availableParticipants.find(u => u.id.toString() === selectedExistingUserId);
      console.log('Found existingUser:', existingUser);
      
      if (existingUser) {
        // Проверяем, не добавлен ли уже этот пользователь по participantId
        const alreadyAdded = users.some(u => u.participantId === existingUser.id);
        console.log('Already added check:', alreadyAdded);
        
        if (alreadyAdded) {
          toast.error('Этот пользователь уже добавлен в проект');
          return;
        }

        // Проверяем, что у пользователя есть отдел
        console.log('User department:', existingUser.department);
        
        if (!existingUser.department) {
          toast.error('У этого пользователя не указан отдел в базе данных');
          return;
        }

        // Проверяем, что отдел пользователя добавлен в проект, если нет - добавляем автоматически
        console.log('Current departments:', departments);
        console.log('Departments detail:', departments.map(d => ({ id: d.id, code: d.code, name: d.name })));
        console.log('Looking for department with code:', existingUser.department.code);
        
        let userDeptInProject = departments.find(d => d.code === existingUser.department.code);
        console.log('Department in project:', userDeptInProject);
        
        if (!userDeptInProject) {
          // Автоматически добавляем отдел пользователя в проект
          const newDept = {
            id: Date.now().toString(),
            name: existingUser.department.name,
            code: existingUser.department.code,
          };
          setDepartments([...departments, newDept]);
          userDeptInProject = newDept;
          console.log('Auto-added department:', newDept);
          toast.info(`Отдел "${existingUser.department.name}" автоматически добавлен в проект`);
        }

        const fullName = `${existingUser.firstName || ''} ${existingUser.lastName || ''}`.trim();
        setUsers([
          ...users,
          {
            id: Date.now().toString(),
            participantId: existingUser.id, // Сохраняем ID из таблицы participants
            name: fullName,
            telegramUsername: existingUser.telegramUsername || '',
            email: existingUser.email,
            departmentId: userDeptInProject.id,
            role: existingUser.roleType === 'customer' ? 'client' : 'executor',
          },
        ]);
        setSelectedExistingUserId('');
        toast.success('Пользователь добавлен из базы');
      }
    }
  };

  const removeUser = (id: string) => {
    setUsers(users.filter(u => u.id !== id));
  };

  // Управление альбомами
  const addAlbum = () => {
    if (newAlbumName.trim()) {
      const newAlbum: Album = {
        id: Date.now().toString(),
        name: newAlbumName.trim(),
        type: newAlbumType,
      };
      
      if (newAlbumType === 'PD') {
        setAlbumsPD([...albumsPD, newAlbum]);
      } else {
        setAlbumsRD([...albumsRD, newAlbum]);
      }
      
      setNewAlbumName('');
    }
  };

  const removeAlbum = (id: string, type: 'PD' | 'RD') => {
    if (type === 'PD') {
      setAlbumsPD(albumsPD.filter(a => a.id !== id));
    } else {
      setAlbumsRD(albumsRD.filter(a => a.id !== id));
    }
  };

  const getDepartmentName = (departmentId: string) => {
    return departments.find(d => d.id === departmentId)?.name || 'Неизвестно';
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return projectName.trim() && projectCode.trim() && clientCompany.trim();
      case 2:
        return departments.length > 0;
      case 3:
        return users.length > 0;
      case 4:
        return channelUrl.trim() && connectionStatus === 'success';
      case 5:
        return true; // Этот шаг опционален
      default:
        return false;
    }
  };

  const copyBotUsername = async () => {
    try {
      await navigator.clipboard.writeText('@klamonline_bot');
      toast.success('Username бота скопирован в буфер обмена');
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 4000);
    } catch (error) {
      // Fallback для случаев, когда Clipboard API недоступен
      const textArea = document.createElement('textarea');
      textArea.value = '@klamonline_bot';
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand('copy');
        textArea.remove();
        toast.success('Username бота скопирован в буфер обмена');
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 4000);
      } catch (err) {
        textArea.remove();
        toast.info('@klamonline_bot - скопируйте вручную');
      }
    }
  };

  const checkConnection = async () => {
    if (!channelUrl.trim()) {
      toast.error('Введите URL канала или ID беседы');
      return;
    }

    setIsCheckingConnection(true);
    setConnectionStatus('idle');
    
    // Очищаем все предыдущие toast'ы
    toast.dismiss();

    try {
      // Реальная проверка через Telegram Bot API
      const result = await checkTelegramChannel(channelUrl);
      
      console.log('Результат проверки канала:', result);
      
      if (result.success) {
        setConnectionStatus('success');
        
        // Если есть предупреждение (бот не админ), показываем его
        if (result.warning) {
          toast.warning(result.warning, {
            duration: 6000,
          });
        } else {
          toast.success(`Соединение установлено! Канал: ${result.channel.title}`);
        }
      } else {
        setConnectionStatus('error');
        
        // Если бот не является администратором
        if (result.needsAdmin) {
          const errorMsg = result.message || 'Пожалуйста, сделайте бота администратором канала и нажмите "Проверить соединение" снова';
          const channelTitle = result.channel?.title || 'Неизвестно';
          setConnectionErrorMessage(errorMsg);
          setConnectionChannelTitle(channelTitle);
          toast.error(`${errorMsg}\n\nКанал: ${channelTitle}`, { duration: 8000 });
        } else {
          const errorMsg = result.error || 'Не удалось проверить канал';
          setConnectionErrorMessage(errorMsg);
          setConnectionChannelTitle('');
          toast.error(errorMsg);
        }
      }
    } catch (error: any) {
      console.error('Ошибка проверки канала (catch):', error);
      const errorMsg = 'Не удалось установить соединение. Проверьте правильность URL и убедитесь, что бот добавлен в канал.';
      setConnectionStatus('error');
      setConnectionErrorMessage(errorMsg);
      setConnectionChannelTitle('');
      toast.error(errorMsg);
    } finally {
      setIsCheckingConnection(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Создание нового проекта</DialogTitle>
          <DialogDescription>
            Заполните все необходимые поля для создания проекта.
          </DialogDescription>
        </DialogHeader>

        {/* Stepper */}
        <div className="flex items-start justify-center mb-6 pb-4 border-b gap-0">
          {steps.map((step, index) => (
            <div key={step.number} className="flex items-start" style={{ width: `${100 / steps.length}%` }}>
              <div className="flex flex-col items-center w-full">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors flex-shrink-0 ${
                    currentStep > step.number
                      ? 'bg-green-500 text-white'
                      : currentStep === step.number
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {currentStep > step.number ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <step.icon className="w-5 h-5" />
                  )}
                </div>
                <p className="text-xs mt-2 text-center hidden md:block leading-tight px-1">{step.title}</p>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`h-0.5 flex-shrink-0 mt-5 transition-colors ${
                    currentStep > step.number ? 'bg-green-500' : 'bg-gray-200'
                  }`}
                  style={{ width: `calc(${100 / steps.length}% - 40px)`, marginLeft: '-20px', marginRight: '-20px' }}
                />
              )}
            </div>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-1">
          {/* Шаг 1: Основная информация */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="project-name">
                  Наименование проекта <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="project-name"
                  placeholder="Жилой комплекс 'Северный'"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="project-code">
                  Шифр проекта <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="project-code"
                  placeholder="ПР-2025-004"
                  value={projectCode}
                  onChange={(e) => setProjectCode(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="client-company">
                  Компания-заказчик проекта <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="client-company"
                  placeholder="ООО 'СтройИнвест'"
                  value={clientCompany}
                  onChange={(e) => setClientCompany(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Шаг 2: Отделы */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Select value={selectedDepartmentCode} onValueChange={setSelectedDepartmentCode}>
                    <SelectTrigger id="department-code" className="flex-1">
                      <SelectValue placeholder="Выберите отдел">
                        {selectedDepartmentCode && (
                          <span className="truncate">
                            {AVAILABLE_DEPARTMENTS.find(d => d.code === selectedDepartmentCode)?.code || ''}
                          </span>
                        )}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {AVAILABLE_DEPARTMENTS.filter(
                        dept => !departments.some(d => d.code === dept.code)
                      ).map((dept) => (
                        <SelectItem key={dept.code} value={dept.code}>
                          {dept.name} ({dept.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button onClick={addDepartment} className="gap-2 flex-shrink-0">
                    <Plus className="w-4 h-4" />
                    Добавить
                  </Button>
                </div>

                {departments.length === 0 ? (
                  <Alert>
                    <Info className="w-4 h-4" />
                    <AlertDescription>
                      Добавьте хотя бы один отдел для продолжения
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">Добавлено отделов: {departments.length}</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {departments.map((dept) => (
                        <div
                          key={dept.id}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border"
                        >
                          <span>{dept.name} ({dept.code})</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeDepartment(dept.id)}
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Шаг 3: Пользователи */}
          {currentStep === 3 && (
            <div className="space-y-6">
              {departments.length === 0 ? (
                <Alert>
                  <Info className="w-4 h-4" />
                  <AlertDescription>
                    Сначала создайте отделы на предыдущем шаге
                  </AlertDescription>
                </Alert>
              ) : (
                <>
                  <Tabs defaultValue="new" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="new" className="gap-2">
                        <Plus className="w-4 h-4" />
                        Создать нового
                      </TabsTrigger>
                      <TabsTrigger value="existing" className="gap-2">
                        <UserPlus className="w-4 h-4" />
                        Из базы
                      </TabsTrigger>
                    </TabsList>

                    {/* Вкладка: Создать нового пользователя */}
                    <TabsContent value="new" className="space-y-4">
                      <div className="space-y-4 p-4 bg-gray-50 rounded-lg border">
                        <h3 className="font-medium">Добавить нового пользователя</h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="user-name">Имя</Label>
                            <Input
                              id="user-name"
                              placeholder="Иван Иванов"
                              value={newUserName}
                              onChange={(e) => setNewUserName(e.target.value)}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="user-telegram">Telegram Username</Label>
                            <Input
                              id="user-telegram"
                              placeholder="@username"
                              value={newUserTelegram}
                              onChange={(e) => setNewUserTelegram(e.target.value)}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="user-email">Email</Label>
                            <Input
                              id="user-email"
                              type="email"
                              placeholder="user@company.ru"
                              value={newUserEmail}
                              onChange={(e) => setNewUserEmail(e.target.value)}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="user-department">Отдел</Label>
                            <Select value={newUserDepartment} onValueChange={setNewUserDepartment}>
                              <SelectTrigger id="user-department">
                                <SelectValue placeholder="Выберите отдел" />
                              </SelectTrigger>
                              <SelectContent>
                                {departments.map((dept) => (
                                  <SelectItem key={dept.id} value={dept.id}>
                                    {dept.name} ({dept.code})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="user-role">Роль</Label>
                            <Select value={newUserRole} onValueChange={setNewUserRole}>
                              <SelectTrigger id="user-role">
                                <SelectValue placeholder="Выберите роль" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="executor">Исполнитель</SelectItem>
                                <SelectItem value="client">Заказчик</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <Button onClick={addUser} className="w-full gap-2">
                          <Plus className="w-4 h-4" />
                          Добавить пользователя
                        </Button>
                      </div>
                    </TabsContent>

                    {/* Вкладка: Добавить из базы */}
                    <TabsContent value="existing" className="space-y-4">
                      <div className="space-y-4 p-4 bg-gray-50 rounded-lg border">
                        <h3 className="font-medium">Добавить пользователя из базы</h3>
                        
                        <div className="space-y-2">
                          <Label htmlFor="existing-user">Пользователь</Label>
                            <Select 
                              value={selectedExistingUserId} 
                              onValueChange={setSelectedExistingUserId}
                              onOpenChange={(open) => {
                                if (open && availableParticipants.length === 0 && !isLoadingParticipants) {
                                  loadParticipants();
                                }
                              }}
                            >
                              <SelectTrigger id="existing-user">
                                <SelectValue placeholder={isLoadingParticipants ? "Загрузка..." : "Выберите пользователя"} />
                              </SelectTrigger>
                              <SelectContent>
                                {isLoadingParticipants ? (
                                  <SelectItem value="loading" disabled>
                                    Загрузка участников...
                                  </SelectItem>
                                ) : availableParticipants.filter(user => !users.some(u => u.participantId === user.id)).length === 0 ? (
                                  <SelectItem value="empty" disabled>
                                    Нет доступных участников
                                  </SelectItem>
                                ) : (
                                  availableParticipants
                                    .filter(user => !users.some(u => u.participantId === user.id))
                                    .map((user) => (
                                      <SelectItem key={user.id} value={user.id.toString()}>
                                        {user.firstName} {user.lastName} ({user.roleType === 'executor' ? 'Исполнитель' : 'Заказчик'})
                                      </SelectItem>
                                    ))
                                )}
                              </SelectContent>
                            </Select>
                        </div>

                        {selectedExistingUserId && (
                          <div className="p-3 bg-blue-50 rounded border border-blue-200">
                            <p className="text-sm font-medium text-blue-900 mb-2">Информация о пользователе:</p>
                            {(() => {
                              const user = availableParticipants.find(u => u.id.toString() === selectedExistingUserId);
                              return user ? (
                                <div className="text-sm text-blue-800 space-y-1">
                                  <p><strong>Email:</strong> {user.email || 'Не указан'}</p>
                                  <p><strong>Telegram:</strong> {user.telegramUsername || 'Не указан'}</p>
                                  {user.department && (
                                    <p><strong>Отдел:</strong> {user.department.name} ({user.department.code})</p>
                                  )}
                                </div>
                              ) : null;
                            })()}
                          </div>
                        )}

                        <Button 
                          onClick={addExistingUser} 
                          className="w-full gap-2"
                          disabled={!selectedExistingUserId}
                        >
                          <UserPlus className="w-4 h-4" />
                          Добавить из базы
                        </Button>
                      </div>
                    </TabsContent>
                  </Tabs>

                  {users.length === 0 ? (
                    <Alert>
                      <Info className="w-4 h-4" />
                      <AlertDescription>
                        Добавьте хотя бы одного пользователя для продолжения
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600">Добавлено пользователей: {users.length}</p>
                      <div className="space-y-2">
                        {users.map((user) => (
                          <div
                            key={user.id}
                            className="flex items-center justify-between p-4 bg-white rounded-lg border"
                          >
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <p className="font-medium">{user.name}</p>
                                <Badge variant={user.role === 'executor' ? 'default' : 'secondary'}>
                                  {user.role === 'executor' ? 'Исполнитель' : 'Заказчик'}
                                </Badge>
                              </div>
                              <div className="flex gap-4 mt-1">
                                <p className="text-sm text-gray-600">{user.telegramUsername}</p>
                                <p className="text-sm text-gray-600">{user.email}</p>
                              </div>
                              <Badge variant="outline" className="mt-2">
                                {getDepartmentName(user.departmentId)}
                              </Badge>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeUser(user.id)}
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Шаг 4: Telegram бот */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <Alert className="bg-blue-50 border-blue-200">
                <MessageSquare className="w-4 h-4 text-blue-600" />
                <AlertDescription className="text-blue-900">
                  <p className="font-medium mb-2">Инструкция по подключению бота:</p>
                  <ol className="list-decimal list-inside space-y-1 text-sm">
                    <li>Создайте канал в Telegram для проекта</li>
                    <li>Пригласите бота <strong>@klamonline_bot</strong> в канал</li>
                    <li>Сделайте бота администратором канала</li>
                    <li>Скопируйте URL-ссылку канала и вставьте ниже</li>
                  </ol>
                </AlertDescription>
              </Alert>

              <div className="p-4 bg-white rounded-lg border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-1">Username бота</p>
                    <p className="text-lg font-mono font-semibold text-gray-900">@klamonline_bot</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={copyBotUsername}
                    className="gap-2 shrink-0"
                  >
                    {isCopied ? (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        Скопировано!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        Скопировать
                      </>
                    )}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="channel-url">
                  URL-ссылка на канал или ID беседы <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="channel-url"
                  placeholder="https://t.me/your_channel или -5078073427"
                  value={channelUrl}
                  onChange={(e) => setChannelUrl(e.target.value)}
                />
                <p className="text-xs text-gray-500">
                  Пример: https://t.me/project_channel, https://web.telegram.org/a/#-5078073427 или просто -5078073427
                </p>
              </div>

              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <p className="text-sm text-green-900">
                  <strong>Совет:</strong> После создания проекта, бот автоматически начнёт отслеживать 
                  события и отправлять уведомления в канал.
                </p>
              </div>

              <div className="space-y-3">
                <Button
                  onClick={checkConnection}
                  disabled={!channelUrl.trim() || isCheckingConnection}
                  className="w-full gap-2"
                >
                  {isCheckingConnection ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Проверка соединения...
                    </>
                  ) : connectionStatus === 'success' ? (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Соединение установлено
                    </>
                  ) : (
                    <>
                      <MessageSquare className="w-4 h-4" />
                      Проверить соединение
                    </>
                  )}
                </Button>

                {connectionStatus === 'success' && (
                  <Alert className="bg-green-50 border-green-200">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <AlertDescription className="text-green-900">
                      Соединение с ботом успешно установлено! Можно продолжить.
                    </AlertDescription>
                  </Alert>
                )}

                {connectionStatus === 'error' && (
                  <Alert className="bg-red-50 border-red-200">
                    <XCircle className="w-4 h-4 text-red-600" />
                    <AlertDescription className="text-red-900">
                      {connectionErrorMessage}
                      {connectionChannelTitle && (
                        <div className="mt-2 font-medium">Канал: {connectionChannelTitle}</div>
                      )}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </div>
          )}

          {/* Шаг 5: Всё готово */}
          {currentStep === 5 && (
            <div className="space-y-6">
              <div className="text-center py-8">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle className="w-12 h-12 text-green-600" />
                </div>
                <h2 className="text-2xl mb-2">Всё готово!</h2>
                <p className="text-gray-600">
                  Проект успешно настроен и готов к использованию
                </p>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-white rounded-lg border">
                  <h3 className="font-medium mb-4">Сводка по проекту</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <span className="text-gray-600">Название проекта:</span>
                      <span className="font-medium text-right">{projectName}</span>
                    </div>
                    <div className="flex justify-between items-start">
                      <span className="text-gray-600">Шифр проекта:</span>
                      <span className="font-medium">{projectCode}</span>
                    </div>
                    <div className="flex justify-between items-start">
                      <span className="text-gray-600">Заказчик:</span>
                      <span className="font-medium text-right">{clientCompany}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Отделов:</span>
                      <Badge variant="outline">{departments.length}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Пользователей:</span>
                      <Badge variant="outline">{users.length}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Telegram бот:</span>
                      <Badge className="bg-green-100 text-green-900 hover:bg-green-200">Подключен</Badge>
                    </div>
                  </div>
                </div>

                <Alert className="bg-blue-50 border-blue-200">
                  <Info className="w-4 h-4 text-blue-600" />
                  <AlertDescription className="text-blue-900">
                    После открытия проекта вы сможете добавить альбомы документации (СВОК ПД и СВОК РД), загрузить файлы и начать работу.
                  </AlertDescription>
                </Alert>
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between pt-4 border-t mt-4">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 1}
            className="gap-2"
          >
            <ChevronLeft className="w-4 h-4" />
            Назад
          </Button>

          <div className="flex gap-2">
            {currentStep < 5 ? (
              <Button
                onClick={handleNext}
                disabled={!canProceed()}
                className="gap-2"
              >
                Далее
                <ChevronRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button onClick={handleComplete} className="gap-2 bg-green-600 hover:bg-green-700">
                <Check className="w-4 h-4" />
                Открыть проект
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}