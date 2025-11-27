import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Plus, Edit, Users as UsersIcon, UserCheck, UserCog, Edit2, Trash2, Link2, Copy, Check } from 'lucide-react';
import { getCompanyUsers, getCompanyUsersStats, addParticipant, getDepartments, updateParticipant, companyApi, getUserProfile } from '../lib/companyApi';

interface User {
  id: string;
  telegramId: string;
  telegramUsername: string;
  firstName: string;
  lastName: string;
  email: string | null;
  roleInCompany: 'owner' | 'admin' | 'member';
  roleType: 'executor' | 'customer' | null;
  department: {
    id: string;
    code: string;
    name: string;
  } | null;
}

interface Department {
  id: number;
  code: string;
  name: string;
}

export function Users() {
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState({ totalUsers: 0, executors: 0, customers: 0 });
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<string | null>(null);
  
  const [userFirstName, setUserFirstName] = useState('');
  const [userLastName, setUserLastName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userTelegram, setUserTelegram] = useState('');
  const [userRole, setUserRole] = useState('');
  const [userDepartment, setUserDepartment] = useState('');
  
  // Для приглашений
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [inviteRole, setInviteRole] = useState<'admin' | 'member'>('admin');
  const [generatedLink, setGeneratedLink] = useState('');
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  
  // Роль текущего пользователя
  const [currentUserRole, setCurrentUserRole] = useState<'owner' | 'admin' | 'member'>('member');
  
  // Для редактирования админа
  const [editingAdmin, setEditingAdmin] = useState<User | null>(null);
  const [isEditAdminOpen, setIsEditAdminOpen] = useState(false);
  const [adminNewRole, setAdminNewRole] = useState<'admin' | 'member'>('admin');
  const [isUpdatingAdmin, setIsUpdatingAdmin] = useState(false);
  
  // Для удаления админа
  const [deletingAdmin, setDeletingAdmin] = useState<User | null>(null);
  const [isDeleteAdminOpen, setIsDeleteAdminOpen] = useState(false);
  const [isDeletingAdmin, setIsDeletingAdmin] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const companyId = localStorage.getItem('companyId');
      if (!companyId) {
        console.error('❌ No company ID found');
        setIsLoading(false);
        return;
      }

      const [usersResponse, statsResponse, departmentsResponse, profileData] = await Promise.all([
        getCompanyUsers(companyId),
        getCompanyUsersStats(companyId),
        getDepartments(),
        getUserProfile(companyId)
      ]);

      console.log('👥 Users loaded:', usersResponse.users);
      console.log('🔍 First user structure:', usersResponse.users?.[0]);
      console.log('👑 Admins/Owners:', usersResponse.users?.filter((u: User) => u.roleInCompany === 'owner' || u.roleInCompany === 'admin'));
      console.log('👤 Current user role:', profileData.role_in_company);

      setUsers(usersResponse.users || []);
      setStats({
        totalUsers: statsResponse.totalUsers || 0,
        executors: statsResponse.executors || 0,
        customers: statsResponse.customers || 0
      });
      setDepartments(departmentsResponse.departments || []);
      setCurrentUserRole(profileData.role_in_company || 'member');
    } catch (error) {
      console.error('❌ Failed to load users data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Обновление роли админа
  const handleUpdateAdminRole = async () => {
    if (!editingAdmin) return;
    
    try {
      setIsUpdatingAdmin(true);
      const companyId = localStorage.getItem('companyId');
      if (!companyId) return;

      // ID админа имеет формат "admin-{id}", извлекаем числовой id
      const adminId = editingAdmin.id.replace('admin-', '');
      
      await companyApi.updateCompanyUserRole(companyId, adminId, adminNewRole);
      
      setIsEditAdminOpen(false);
      setEditingAdmin(null);
      await loadData();
    } catch (error) {
      console.error('❌ Failed to update admin role:', error);
      alert('Ошибка при изменении роли');
    } finally {
      setIsUpdatingAdmin(false);
    }
  };

  // Удаление админа из компании
  const handleDeleteAdmin = async () => {
    if (!deletingAdmin) return;
    
    try {
      setIsDeletingAdmin(true);
      const companyId = localStorage.getItem('companyId');
      if (!companyId) return;

      // ID админа имеет формат "admin-{id}", извлекаем числовой id
      const adminId = deletingAdmin.id.replace('admin-', '');
      
      await companyApi.removeCompanyUser(companyId, adminId);
      
      setIsDeleteAdminOpen(false);
      setDeletingAdmin(null);
      await loadData();
    } catch (error) {
      console.error('❌ Failed to delete admin:', error);
      alert('Ошибка при удалении администратора');
    } finally {
      setIsDeletingAdmin(false);
    }
  };

  const handleAddUser = async () => {
    if (!userFirstName || !userRole) {
      alert('Пожалуйста, заполните обязательные поля: Имя и Роль');
      return;
    }

    try {
      const companyId = localStorage.getItem('companyId');
      if (!companyId) {
        console.error('❌ No company ID found');
        return;
      }

      const firstName = userFirstName.trim();
      const lastName = userLastName.trim();

      // Находим ID отдела по коду
      const departmentId = userDepartment 
        ? departments.find(d => d.code === userDepartment)?.id 
        : undefined;

      await addParticipant(companyId, {
        firstName,
        lastName,
        telegramUsername: userTelegram || undefined,
        email: userEmail || undefined,
        roleType: userRole as 'executor' | 'customer',
        departmentId
      });

      console.log('✅ Участник успешно добавлен');
      setIsAddUserOpen(false);
      
      // Очистка формы
      setUserFirstName('');
      setUserLastName('');
      setUserEmail('');
      setUserTelegram('');
      setUserRole('');
      setUserDepartment('');
      
      // Перезагружаем список пользователей
      await loadData();
    } catch (error) {
      console.error('❌ Failed to add participant:', error);
      alert('Ошибка при добавлении участника');
    }
  };

  const handleEditUser = (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (user) {
      setUserFirstName(user.firstName);
      setUserLastName(user.lastName || '');
      setUserEmail(user.email || '');
      setUserTelegram(user.telegramUsername || '');
      setUserRole(user.roleType || '');
      setUserDepartment(user.department?.code || '');
      setEditingUser(userId);
    }
  };

  const handleSaveEdit = async () => {
    if (!userFirstName || !userRole || !editingUser) {
      alert('Пожалуйста, заполните обязательные поля: Имя и Роль');
      return;
    }

    try {
      const companyId = localStorage.getItem('companyId');
      if (!companyId) {
        console.error('❌ No company ID found');
        return;
      }

      const firstName = userFirstName.trim();
      const lastName = userLastName.trim();

      // Находим ID отдела по коду
      const departmentId = userDepartment 
        ? departments.find(d => d.code === userDepartment)?.id 
        : undefined;

      await updateParticipant(companyId, editingUser, {
        firstName,
        lastName,
        telegramUsername: userTelegram || undefined,
        email: userEmail || undefined,
        roleType: userRole as 'executor' | 'customer',
        departmentId
      });

      console.log('✅ Участник успешно обновлён');
      
      setEditingUser(null);
      setUserFirstName('');
      setUserLastName('');
      setUserEmail('');
      setUserTelegram('');
      setUserRole('');
      setUserDepartment('');
      
      // Перезагружаем список пользователей
      await loadData();
    } catch (error) {
      console.error('❌ Failed to update participant:', error);
      alert('Ошибка при обновлении участника');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Вы уверены, что хотите удалить этого пользователя?')) {
      return;
    }

    try {
      const companyId = localStorage.getItem('companyId');
      if (!companyId) {
        console.error('❌ No company ID found');
        return;
      }

      await companyApi.deleteParticipant(companyId, userId);
      console.log('✅ Участник успешно удалён');
      
      // Перезагружаем список пользователей
      await loadData();
    } catch (error) {
      console.error('❌ Failed to delete participant:', error);
      alert('Ошибка при удалении участника');
    }
  };

  const getRoleBadgeClass = (roleType: string | null) => {
    return roleType === 'executor' 
      ? 'bg-purple-100 text-purple-700 border-purple-200' 
      : 'bg-orange-100 text-orange-700 border-orange-200';
  };

  const getRoleLabel = (roleType: string | null) => {
    return roleType === 'executor' ? 'Исполнитель' : 'Заказчик';
  };

  const handleGenerateInviteLink = async () => {
    setIsGeneratingLink(true);
    setGeneratedLink('');

    try {
      const companyId = localStorage.getItem('companyId');
      if (!companyId) {
        alert('Компания не найдена');
        return;
      }

      const result = await companyApi.generateInviteLink({
        companyId,
        role: inviteRole
      });

      setGeneratedLink(result.inviteLink);
    } catch (error) {
      console.error('❌ Failed to generate invite link:', error);
      alert('Не удалось создать ссылку-приглашение');
    } finally {
      setIsGeneratingLink(false);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(generatedLink);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch (error) {
      console.error('❌ Failed to copy link:', error);
    }
  };

  const getInitials = (firstName: string, lastName: string | null) => {
    return (firstName.charAt(0) + (lastName?.charAt(0) || '')).toUpperCase();
  };

  if (isLoading) {
    return (
      <div className="p-4 md:p-8 max-w-[1600px] mx-auto">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Загрузка...</div>
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
              Пользователи
            </h1>
            <p className="text-gray-500 mt-1 text-sm md:text-base">Управление участниками системы</p>
          </div>
          
          <div className="flex gap-2">
            <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2 !bg-gradient-to-r !from-green-600 !to-emerald-600 hover:!from-green-700 hover:!to-emerald-700 !text-white">
                  <Link2 className="w-4 h-4" />
                  Пригласить администратора
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Пригласить администратора</DialogTitle>
                  <DialogDescription>
                    Создайте ссылку-приглашение для нового администратора компании
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-blue-700">
                      <UserCog className="w-5 h-5" />
                      <div>
                        <p className="font-medium text-sm">Роль: Администратор</p>
                        <p className="text-xs text-blue-600">Может управлять проектами и приглашать пользователей</p>
                      </div>
                    </div>
                  </div>

                  <Button 
                    type="button" 
                    className="w-full" 
                    onClick={handleGenerateInviteLink}
                    disabled={isGeneratingLink}
                  >
                    <Link2 className="w-4 h-4 mr-2" />
                    {isGeneratingLink ? 'Создание...' : 'Создать ссылку-приглашение'}
                  </Button>

                  {generatedLink && (
                    <div className="space-y-2">
                      <Label>Пригласительная ссылка</Label>
                      <div className="flex gap-2">
                        <Input
                          value={generatedLink}
                          readOnly
                          className="font-mono text-sm"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleCopyLink}
                          className="shrink-0"
                        >
                          {linkCopied ? (
                            <>
                              <Check className="w-4 h-4 mr-2" />
                              Скопировано
                            </>
                          ) : (
                            <>
                              <Copy className="w-4 h-4 mr-2" />
                              Копировать
                            </>
                          )}
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Отправьте эту ссылку людям, которых хотите пригласить. 
                        Они смогут войти через Telegram и автоматически присоединятся к компании.
                      </p>
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
                  <Plus className="w-4 h-4" />
                  Добавить пользователя
                </Button>
              </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Добавить пользователя</DialogTitle>
                <DialogDescription>
                  Введите данные нового пользователя системы
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="user-first-name">Имя</Label>
                  <Input
                    id="user-first-name"
                    placeholder="Иван"
                    value={userFirstName}
                    onChange={(e) => setUserFirstName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="user-last-name">Фамилия</Label>
                  <Input
                    id="user-last-name"
                    placeholder="Иванов"
                    value={userLastName}
                    onChange={(e) => setUserLastName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="user-email">Email</Label>
                  <Input
                    id="user-email"
                    type="email"
                    placeholder="user@company.ru"
                    value={userEmail}
                    onChange={(e) => setUserEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="user-telegram">Telegram ID</Label>
                  <Input
                    id="user-telegram"
                    placeholder="@username"
                    value={userTelegram}
                    onChange={(e) => setUserTelegram(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="user-role">Роль</Label>
                  <Select value={userRole} onValueChange={setUserRole}>
                    <SelectTrigger id="user-role">
                      <SelectValue placeholder="Выберите роль" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="executor">Исполнитель</SelectItem>
                      <SelectItem value="customer">Заказчик</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="user-department">Отдел</Label>
                  <Select value={userDepartment} onValueChange={setUserDepartment}>
                    <SelectTrigger id="user-department">
                      <SelectValue placeholder="Выберите отдел" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((dept) => (
                        <SelectItem key={dept.id} value={dept.code}>
                          {dept.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddUserOpen(false)}>
                  Отмена
                </Button>
                <Button onClick={handleAddUser}>Добавить</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          </div>
        </div>
      </div>

      {/* Администрация компании */}
      <Card className="border-gray-200 shadow-sm mb-6 md:mb-8">
        <CardHeader className="bg-gradient-to-r from-indigo-50 to-white border-b">
          <CardTitle className="text-lg flex items-center gap-2">
            <UserCog className="w-5 h-5" />
            Администрация компании
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-3">
            {users.filter(u => u.roleInCompany === 'owner' || u.roleInCompany === 'admin').length === 0 ? (
              <div className="text-center py-8 text-gray-500 text-sm">
                Администраторы не назначены
              </div>
            ) : (
              users
                .filter(u => u.roleInCompany === 'owner' || u.roleInCompany === 'admin')
                .sort((a, b) => {
                  if (a.roleInCompany === 'owner') return -1;
                  if (b.roleInCompany === 'owner') return 1;
                  return 0;
                })
                .map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-4 rounded-lg border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/50 transition-all">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-medium ${
                        user.roleInCompany === 'owner' 
                          ? 'bg-gradient-to-br from-amber-400 to-orange-500' 
                          : 'bg-gradient-to-br from-indigo-400 to-purple-500'
                      }`}>
                        {getInitials(user.firstName, user.lastName)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-gray-900">
                            {user.firstName} {user.lastName || ''}
                          </p>
                          <Badge variant={user.roleInCompany === 'owner' ? 'default' : 'secondary'} className={
                            user.roleInCompany === 'owner'
                              ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white'
                              : 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white'
                          }>
                            {user.roleInCompany === 'owner' ? 'Владелец' : 'Администратор'}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          {user.email || 'Нет email'}
                          {user.telegramUsername && (
                            <span className="ml-2 text-blue-600">
                              @{user.telegramUsername}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                    {/* Кнопки редактирования и удаления - только для owner и только для админов */}
                    {currentUserRole === 'owner' && user.roleInCompany === 'admin' && (
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => {
                            setEditingAdmin(user);
                            setAdminNewRole('admin');
                            setIsEditAdminOpen(true);
                          }}
                          className="text-gray-500 hover:text-indigo-600"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => {
                            setDeletingAdmin(user);
                            setIsDeleteAdminOpen(true);
                          }}
                          className="text-gray-500 hover:text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Диалог редактирования роли админа */}
      <Dialog open={isEditAdminOpen} onOpenChange={setIsEditAdminOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Изменить роль пользователя</DialogTitle>
            <DialogDescription>
              Изменение роли для {editingAdmin?.firstName} {editingAdmin?.lastName}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label>Новая роль</Label>
            <Select value={adminNewRole} onValueChange={(v) => setAdminNewRole(v as 'admin' | 'member')}>
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="Выберите роль" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Администратор</SelectItem>
                <SelectItem value="member">Участник</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditAdminOpen(false)}>
              Отмена
            </Button>
            <Button 
              onClick={handleUpdateAdminRole}
              disabled={isUpdatingAdmin}
            >
              {isUpdatingAdmin ? 'Сохранение...' : 'Сохранить'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Диалог удаления админа */}
      <Dialog open={isDeleteAdminOpen} onOpenChange={setIsDeleteAdminOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Удалить администратора</DialogTitle>
            <DialogDescription>
              Вы уверены, что хотите удалить {deletingAdmin?.firstName} {deletingAdmin?.lastName} из администраторов компании?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteAdminOpen(false)}>
              Отмена
            </Button>
            <Button 
              variant="destructive"
              onClick={handleDeleteAdmin}
              disabled={isDeletingAdmin}
            >
              {isDeletingAdmin ? 'Удаление...' : 'Удалить'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Статистика */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
        <Card className="border-gray-200 hover:shadow-lg transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Всего пользователей</CardTitle>
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
              <UsersIcon className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{stats.totalUsers}</div>
            <p className="text-xs text-gray-500 mt-1">зарегистрировано в системе</p>
          </CardContent>
        </Card>

        <Card className="border-gray-200 hover:shadow-lg transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Исполнители</CardTitle>
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center">
              <UserCog className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">{stats.executors}</div>
            <p className="text-xs text-gray-500 mt-1">активных исполнителей</p>
          </CardContent>
        </Card>

        <Card className="border-gray-200 hover:shadow-lg transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Заказчики</CardTitle>
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center">
              <UserCheck className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">{stats.customers}</div>
            <p className="text-xs text-gray-500 mt-1">представителей заказчиков</p>
          </CardContent>
        </Card>
      </div>

      {/* Таблица пользователей */}
      <Card className="border-gray-200 shadow-sm">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-white border-b">
          <CardTitle className="text-lg">Список пользователей</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          {/* Фильтруем пользователей - показываем только участников (member), без админов и владельцев */}
          {(() => {
            const memberUsers = users.filter(u => u.roleInCompany === 'member');
            return memberUsers.length === 0 ? (
            <div className="text-center py-16 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
              <UsersIcon className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-600 mb-1">Пользователи не добавлены</p>
              <p className="text-sm text-gray-400">Добавьте первого пользователя</p>
            </div>
          ) : (
            <>
              {/* Мобильное представление - карточки */}
              <div className="md:hidden space-y-3">
                {memberUsers.map((user) => (
                  <div key={user.id} className="p-4 rounded-lg border-2 border-gray-200 bg-white">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-indigo-400 flex items-center justify-center text-white font-medium">
                          {getInitials(user.firstName, user.lastName)}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{user.firstName} {user.lastName || ''}</p>
                          <p className="text-xs text-gray-500">{user.email || 'Нет email'}</p>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Dialog 
                          open={editingUser === user.id} 
                          onOpenChange={(open) => {
                            if (!open) {
                              setEditingUser(null);
                              setUserFirstName('');
                              setUserLastName('');
                              setUserEmail('');
                              setUserTelegram('');
                              setUserRole('');
                              setUserDepartment('');
                            }
                          }}
                        >
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditUser(user.id)}
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                          </DialogTrigger>
                        <DialogContent className="max-w-[90vw] md:max-w-[425px]">
                          <DialogHeader>
                            <DialogTitle>Редактировать пользователя</DialogTitle>
                            <DialogDescription>
                              Измените данные пользователя
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            <div className="space-y-2">
                              <Label htmlFor="edit-user-first-name">Имя</Label>
                              <Input
                                id="edit-user-first-name"
                                value={userFirstName}
                                onChange={(e) => setUserFirstName(e.target.value)}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="edit-user-last-name">Фамилия</Label>
                              <Input
                                id="edit-user-last-name"
                                value={userLastName}
                                onChange={(e) => setUserLastName(e.target.value)}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="edit-user-email">Email</Label>
                              <Input
                                id="edit-user-email"
                                type="email"
                                value={userEmail}
                                onChange={(e) => setUserEmail(e.target.value)}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="edit-user-telegram">Telegram ID</Label>
                              <Input
                                id="edit-user-telegram"
                                value={userTelegram}
                                onChange={(e) => setUserTelegram(e.target.value)}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="edit-user-role">Роль</Label>
                              <Select value={userRole} onValueChange={setUserRole}>
                                <SelectTrigger id="edit-user-role">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="executor">Исполнитель</SelectItem>
                                  <SelectItem value="customer">Заказчик</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="edit-user-department">Отдел</Label>
                              <Select value={userDepartment} onValueChange={setUserDepartment}>
                                <SelectTrigger id="edit-user-department">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {departments.map((dept) => (
                                    <SelectItem key={dept.id} value={dept.code}>
                                      {dept.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <DialogFooter className="flex-col sm:flex-row gap-2">
                            <Button 
                              variant="outline" 
                              onClick={() => {
                                setEditingUser(null);
                                setUserFirstName('');
                                setUserLastName('');
                                setUserEmail('');
                                setUserTelegram('');
                                setUserRole('');
                                setUserDepartment('');
                              }}
                              className="w-full sm:w-auto"
                            >
                              Отмена
                            </Button>
                            <Button onClick={handleSaveEdit} className="w-full sm:w-auto">Сохранить</Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteUser(user.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                      </div>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">Telegram:</span>
                        <span className="text-gray-900">@{user.telegramUsername || 'не указан'}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">Роль:</span>
                        <Badge className={getRoleBadgeClass(user.roleType)}>
                          {getRoleLabel(user.roleType)}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">Отдел:</span>
                        <Badge className="bg-blue-50 border-blue-200 text-blue-700">
                          {user.department?.name || 'Не указан'}
                        </Badge>
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
                      <th className="text-left py-4 px-4 font-semibold text-gray-700">ФИО</th>
                      <th className="text-left py-4 px-4 font-semibold text-gray-700">Email</th>
                      <th className="text-left py-4 px-4 font-semibold text-gray-700">Telegram ID</th>
                      <th className="text-left py-4 px-4 font-semibold text-gray-700">Роль</th>
                      <th className="text-left py-4 px-4 font-semibold text-gray-700">Отдел</th>
                      <th className="text-right py-4 px-4 font-semibold text-gray-700">Действия</th>
                    </tr>
                  </thead>
                  <tbody>
                    {memberUsers.map((user) => (
                      <tr key={user.id} className="border-b border-gray-100 hover:bg-blue-50/50 transition-colors group">
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-indigo-400 flex items-center justify-center text-white text-sm font-medium">
                              {getInitials(user.firstName, user.lastName)}
                            </div>
                            <span className="font-medium">{user.firstName} {user.lastName || ''}</span>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-sm text-gray-600">{user.email || 'Нет email'}</td>
                        <td className="py-4 px-4 text-sm text-gray-600">@{user.telegramUsername || 'не указан'}</td>
                        <td className="py-4 px-4">
                          <Badge className={getRoleBadgeClass(user.roleType)}>
                            {getRoleLabel(user.roleType)}
                          </Badge>
                        </td>
                        <td className="py-4 px-4">
                          <Badge className="bg-blue-50 border-blue-200 text-blue-700">
                            {user.department?.name || 'Не указан'}
                          </Badge>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex justify-end gap-1">
                          <Dialog 
                            open={editingUser === user.id} 
                            onOpenChange={(open) => {
                              if (!open) {
                                setEditingUser(null);
                                setUserFirstName('');
                                setUserLastName('');
                                setUserEmail('');
                                setUserTelegram('');
                                setUserRole('');
                                setUserDepartment('');
                              }
                            }}
                          >
                            <DialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditUser(user.id)}
                              >
                                <Edit2 className="w-4 h-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Редактировать пользователя</DialogTitle>
                                <DialogDescription>
                                  Измените данные пользователя
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                  <Label htmlFor="edit-user-first-name-desktop">Имя</Label>
                                  <Input
                                    id="edit-user-first-name-desktop"
                                    value={userFirstName}
                                    onChange={(e) => setUserFirstName(e.target.value)}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="edit-user-last-name-desktop">Фамилия</Label>
                                  <Input
                                    id="edit-user-last-name-desktop"
                                    value={userLastName}
                                    onChange={(e) => setUserLastName(e.target.value)}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="edit-user-email">Email</Label>
                                  <Input
                                    id="edit-user-email"
                                    type="email"
                                    value={userEmail}
                                    onChange={(e) => setUserEmail(e.target.value)}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="edit-user-telegram">Telegram ID</Label>
                                  <Input
                                    id="edit-user-telegram"
                                    value={userTelegram}
                                    onChange={(e) => setUserTelegram(e.target.value)}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="edit-user-role">Роль</Label>
                                  <Select value={userRole} onValueChange={setUserRole}>
                                    <SelectTrigger id="edit-user-role">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="executor">Исполнитель</SelectItem>
                                      <SelectItem value="customer">Заказчик</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="edit-user-department">Отдел</Label>
                                  <Select value={userDepartment} onValueChange={setUserDepartment}>
                                    <SelectTrigger id="edit-user-department">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {departments.map((dept) => (
                                        <SelectItem key={dept.id} value={dept.code}>
                                          {dept.name}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                              <DialogFooter>
                                <Button 
                                  variant="outline" 
                                  onClick={() => {
                                    setEditingUser(null);
                                    setUserFirstName('');
                                    setUserLastName('');
                                    setUserEmail('');
                                    setUserTelegram('');
                                    setUserRole('');
                                    setUserDepartment('');
                                  }}
                                >
                                  Отмена
                                </Button>
                              <Button onClick={handleSaveEdit}>Сохранить</Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteUser(user.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
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
          );
          })()}
        </CardContent>
      </Card>
    </div>
  );
}