import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Plus, Edit, Users as UsersIcon, UserCheck, UserCog } from 'lucide-react';
import { mockUsers } from '../lib/mockData';

export function Users() {
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<string | null>(null);
  
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userTelegram, setUserTelegram] = useState('');
  const [userRole, setUserRole] = useState('');
  const [userDepartment, setUserDepartment] = useState('');

  const handleAddUser = () => {
    console.log('Добавление пользователя:', {
      userName,
      userEmail,
      userTelegram,
      userRole,
      userDepartment
    });
    setIsAddUserOpen(false);
    // Очистка формы
    setUserName('');
    setUserEmail('');
    setUserTelegram('');
    setUserRole('');
    setUserDepartment('');
  };

  const handleEditUser = (userId: string) => {
    const user = mockUsers.find(u => u.id === userId);
    if (user) {
      setUserName(user.name);
      setUserEmail(user.email);
      setUserTelegram(user.telegramId);
      setUserRole(user.role);
      setUserDepartment(user.department);
      setEditingUser(userId);
    }
  };

  const handleSaveEdit = () => {
    console.log('Обновление пользователя:', editingUser, {
      userName,
      userEmail,
      userTelegram,
      userRole,
      userDepartment
    });
    setEditingUser(null);
    setUserName('');
    setUserEmail('');
    setUserTelegram('');
    setUserRole('');
    setUserDepartment('');
  };

  const getRoleBadgeVariant = (role: string) => {
    return role === 'executor' ? 'default' : 'default';
  };

  const getRoleLabel = (role: string) => {
    return role === 'executor' ? 'Исполнитель' : 'Заказчик';
  };

  const executors = mockUsers.filter(u => u.role === 'executor');
  const clients = mockUsers.filter(u => u.role === 'client');

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
                  <Label htmlFor="user-name">ФИО</Label>
                  <Input
                    id="user-name"
                    placeholder="Иванов Иван Иванович"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
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
                      <SelectItem value="client">Заказчик</SelectItem>
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
                      <SelectItem value="Архитектура">Архитектура</SelectItem>
                      <SelectItem value="Конструкции">Конструкции</SelectItem>
                      <SelectItem value="ОВиК">ОВиК</SelectItem>
                      <SelectItem value="Электрика">Электрика</SelectItem>
                      <SelectItem value="Заказчик">Заказчик</SelectItem>
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

      {/* Статистика */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card className="border-gray-200 hover:shadow-lg transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Всего пользователей</CardTitle>
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
              <UsersIcon className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{mockUsers.length}</div>
            <p className="text-xs text-gray-500 mt-1">в системе</p>
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
            <div className="text-3xl font-bold text-purple-600">{executors.length}</div>
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
            <div className="text-3xl font-bold text-orange-600">{clients.length}</div>
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
          {mockUsers.length === 0 ? (
            <div className="text-center py-16 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
              <UsersIcon className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-600 mb-1">Пользователи не добавлены</p>
              <p className="text-sm text-gray-400">Добавьте первого пользователя</p>
            </div>
          ) : (
            <>
              {/* Мобильное представление - карточки */}
              <div className="md:hidden space-y-3">
                {mockUsers.map((user) => (
                  <div key={user.id} className="p-4 rounded-lg border-2 border-gray-200 bg-white">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-indigo-400 flex items-center justify-center text-white font-medium">
                          {user.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{user.name}</p>
                          <p className="text-xs text-gray-500">{user.email}</p>
                        </div>
                      </div>
                      <Dialog 
                        open={editingUser === user.id} 
                        onOpenChange={(open) => {
                          if (!open) {
                            setEditingUser(null);
                            setUserName('');
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
                            <Edit className="w-4 h-4" />
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
                              <Label htmlFor="edit-user-name">ФИО</Label>
                              <Input
                                id="edit-user-name"
                                value={userName}
                                onChange={(e) => setUserName(e.target.value)}
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
                                  <SelectItem value="client">Заказчик</SelectItem>
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
                                  <SelectItem value="Архитектура">Архитектура</SelectItem>
                                  <SelectItem value="Конструкции">Конструкции</SelectItem>
                                  <SelectItem value="ОВиК">ОВиК</SelectItem>
                                  <SelectItem value="Электрика">Электрика</SelectItem>
                                  <SelectItem value="Заказчик">Заказчик</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <DialogFooter className="flex-col sm:flex-row gap-2">
                            <Button 
                              variant="outline" 
                              onClick={() => {
                                setEditingUser(null);
                                setUserName('');
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
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">Telegram:</span>
                        <span className="text-gray-900">{user.telegramId}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">Роль:</span>
                        <Badge variant={getRoleBadgeVariant(user.role)} className={user.role === 'executor' ? 'bg-purple-100 text-purple-700 border-purple-200' : 'bg-orange-100 text-orange-700 border-orange-200'}>
                          {getRoleLabel(user.role)}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">Отдел:</span>
                        <Badge variant="outline" className="bg-blue-50 border-blue-200 text-blue-700">{user.department}</Badge>
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
                      <th className="text-left py-4 px-4"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {mockUsers.map((user) => (
                      <tr key={user.id} className="border-b border-gray-100 hover:bg-blue-50/50 transition-colors group">
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-indigo-400 flex items-center justify-center text-white text-sm font-medium">
                              {user.name.charAt(0)}
                            </div>
                            <span className="font-medium">{user.name}</span>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-sm text-gray-600">{user.email}</td>
                        <td className="py-4 px-4 text-sm text-gray-600">{user.telegramId}</td>
                        <td className="py-4 px-4">
                          <Badge variant={getRoleBadgeVariant(user.role)} className={user.role === 'executor' ? 'bg-purple-100 text-purple-700 border-purple-200' : 'bg-orange-100 text-orange-700 border-orange-200'}>
                            {getRoleLabel(user.role)}
                          </Badge>
                        </td>
                        <td className="py-4 px-4">
                          <Badge variant="outline" className="bg-blue-50 border-blue-200 text-blue-700">{user.department}</Badge>
                        </td>
                        <td className="py-4 px-4">
                          <Dialog 
                            open={editingUser === user.id} 
                            onOpenChange={(open) => {
                              if (!open) {
                                setEditingUser(null);
                                setUserName('');
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
                                className="gap-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => handleEditUser(user.id)}
                              >
                                <Edit className="w-4 h-4" />
                                Изменить
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
                                  <Label htmlFor="edit-user-name">ФИО</Label>
                                  <Input
                                    id="edit-user-name"
                                    value={userName}
                                    onChange={(e) => setUserName(e.target.value)}
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
                                      <SelectItem value="client">Заказчик</SelectItem>
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
                                      <SelectItem value="Архитектура">Архитектура</SelectItem>
                                      <SelectItem value="Конструкции">Конструкции</SelectItem>
                                      <SelectItem value="ОВиК">ОВиК</SelectItem>
                                      <SelectItem value="Электрика">Электрика</SelectItem>
                                      <SelectItem value="Заказчик">Заказчик</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                              <DialogFooter>
                                <Button 
                                  variant="outline" 
                                  onClick={() => {
                                    setEditingUser(null);
                                    setUserName('');
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
    </div>
  );
}