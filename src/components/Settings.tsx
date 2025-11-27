import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Alert, AlertDescription } from './ui/alert';
import { CheckCircle2, Settings as SettingsIcon, Building, User, Check, AlertCircle, Mail } from 'lucide-react';
import { getUserProfile, updateUserProfile, getCompanySettings, updateCompanySettings } from '../lib/companyApi';
import { toast } from 'sonner';

export function Settings() {
  const companyId = localStorage.getItem('companyId') || '1';
  
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [userRole, setUserRole] = useState<'owner' | 'admin' | 'member'>('member');
  const [canEditCompany, setCanEditCompany] = useState(false);

  // Профиль пользователя
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [userEmail, setUserEmail] = useState('');

  // Компания
  const [companyName, setCompanyName] = useState('');
  const [companyEmail, setCompanyEmail] = useState('');
  const [companyAddress, setCompanyAddress] = useState('');

  // Email настройки
  const [emailProvider, setEmailProvider] = useState<'klam' | 'custom'>('klam');

  // Исходные значения для отслеживания изменений
  const [originalProfile, setOriginalProfile] = useState({ firstName: '', lastName: '', userEmail: '' });
  const [originalCompany, setOriginalCompany] = useState({ 
    companyName: '', 
    companyEmail: '', 
    companyAddress: ''
  });

  // Load data on mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load user profile and company settings in parallel
      const [profileData, companyData] = await Promise.all([
        getUserProfile(companyId),
        getCompanySettings(companyId)
      ]);

      // Set user profile
      setFirstName(profileData.first_name || '');
      setLastName(profileData.last_name || '');
      setUserEmail(profileData.email || '');
      setUserRole(profileData.role_in_company);
      
      setOriginalProfile({
        firstName: profileData.first_name || '',
        lastName: profileData.last_name || '',
        userEmail: profileData.email || ''
      });

      // Set company settings
      setCompanyName(companyData.name || '');
      setCompanyEmail(companyData.email || '');
      setCompanyAddress(companyData.address || '');
      setCanEditCompany(companyData.canEdit);
      
      setOriginalCompany({
        companyName: companyData.name || '',
        companyEmail: companyData.email || '',
        companyAddress: companyData.address || ''
      });
    } catch (error) {
      console.error('Error loading settings:', error);
      toast.error('Не удалось загрузить настройки');
    } finally {
      setLoading(false);
    }
  };

  // Проверка изменений в каждом блоке
  const profileChanged = firstName !== originalProfile.firstName || 
                         lastName !== originalProfile.lastName || 
                         userEmail !== originalProfile.userEmail;
  
  const companyChanged = companyName !== originalCompany.companyName || 
                         companyEmail !== originalCompany.companyEmail || 
                         companyAddress !== originalCompany.companyAddress;

  const saveProfile = async () => {
    try {
      setIsSaving(true);
      await updateUserProfile(companyId, {
        first_name: firstName,
        last_name: lastName,
        email: userEmail
      });
      
      setOriginalProfile({ firstName, lastName, userEmail });
      toast.success('Профиль успешно обновлен');
    } catch (error: any) {
      console.error('Error saving profile:', error);
      toast.error(error.message || 'Не удалось сохранить профиль');
    } finally {
      setIsSaving(false);
    }
  };

  const saveCompany = async () => {
    if (!canEditCompany) {
      toast.error('Только владелец компании может изменять настройки');
      return;
    }

    try {
      setIsSaving(true);
      await updateCompanySettings(companyId, {
        name: companyName,
        email: companyEmail,
        address: companyAddress
      });
      
      setOriginalCompany({
        companyName,
        companyEmail,
        companyAddress
      });
      toast.success('Настройки компании успешно обновлены');
    } catch (error: any) {
      console.error('Error saving company settings:', error);
      toast.error(error.message || 'Не удалось сохранить настройки компании');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4 md:p-8 max-w-[1200px] mx-auto">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Загрузка настроек...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-[1200px] mx-auto">
      {/* Заголовок */}
      <div className="mb-6 md:mb-8">
        <h1 className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
          Настройки
        </h1>
        <p className="text-gray-500 mt-1 text-sm md:text-base">Управление интеграциями и параметрами системы</p>
      </div>

      {saveSuccess && (
        <Alert className="mb-6 border-green-200 bg-green-50">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            Настройки успешно сохранены
          </AlertDescription>
        </Alert>
      )}

      <div className="space-y-6">
        {/* Настройка профиля */}
        <Card className="border-gray-200 shadow-sm">
          <CardHeader className="bg-gradient-to-r from-indigo-50 to-white border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center">
                  <User className="w-5 h-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-lg">Настройка профиля</CardTitle>
                  <CardDescription>
                    Ваши личные данные и контактная информация
                  </CardDescription>
                </div>
              </div>
              {profileChanged && (
                <Button
                  size="sm"
                  onClick={saveProfile}
                  className="gap-2 bg-green-600 hover:bg-green-700"
                >
                  <Check className="w-4 h-4" />
                  Сохранить
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first-name">Имя</Label>
                <Input
                  id="first-name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Иван"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last-name">Фамилия</Label>
                <Input
                  id="last-name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Иванов"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="user-email">Электронная почта</Label>
                <Input
                  id="user-email"
                  type="email"
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  placeholder="ivanov@company.ru"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Настройки компании */}
        <Card className="border-gray-200 shadow-sm">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-white border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                  <Building className="w-5 h-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-lg">Настройки компании</CardTitle>
                  <CardDescription>
                    Основная информация о вашей компании
                  </CardDescription>
                </div>
              </div>
              {companyChanged && canEditCompany && (
                <Button
                  size="sm"
                  onClick={saveCompany}
                  disabled={isSaving}
                  className="gap-2 bg-green-600 hover:bg-green-700"
                >
                  <Check className="w-4 h-4" />
                  Сохранить
                </Button>
              )}
            </div>
            {!canEditCompany && (
              <Alert className="mt-4 border-amber-200 bg-amber-50">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-800 text-xs">
                  Только владелец компании может изменять эти настройки
                </AlertDescription>
              </Alert>
            )}
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="company-name">Название компании</Label>
                <Input
                  id="company-name"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  disabled={!canEditCompany}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company-email">Email компании</Label>
                <Input
                  id="company-email"
                  type="email"
                  value={companyEmail}
                  onChange={(e) => setCompanyEmail(e.target.value)}
                  disabled={!canEditCompany}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="company-address">Адрес</Label>
              <Textarea
                id="company-address"
                placeholder="Юридический адрес компании"
                value={companyAddress}
                onChange={(e) => setCompanyAddress(e.target.value)}
                rows={2}
                disabled={!canEditCompany}
              />
            </div>
          </CardContent>
        </Card>

        {/* Email уведомления */}
        <Card className="border-gray-200 shadow-sm">
          <CardHeader className="bg-gradient-to-r from-orange-50 to-white border-b">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center">
                <Mail className="w-5 h-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-lg">Email уведомления</CardTitle>
                <CardDescription>
                  Настройте SMTP для отправки email уведомлений
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="space-y-3">
              <Label>Выберите способ отправки</Label>
              <div className="flex flex-col gap-3">
                <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  <input
                    type="radio"
                    name="emailProvider"
                    value="klam"
                    checked={emailProvider === 'klam'}
                    onChange={(e) => setEmailProvider(e.target.value as 'klam' | 'custom')}
                    className="w-4 h-4 text-blue-600"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-sm">Почта сервиса klambot.ru</div>
                    <div className="text-xs text-gray-500">Уведомления будут отправляться с noreply@klambot.ru</div>
                  </div>
                </label>
                <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  <input
                    type="radio"
                    name="emailProvider"
                    value="custom"
                    checked={emailProvider === 'custom'}
                    onChange={(e) => setEmailProvider(e.target.value as 'klam' | 'custom')}
                    className="w-4 h-4 text-blue-600"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-sm">Собственный SMTP сервер</div>
                    <div className="text-xs text-gray-500">Настройте свой SMTP сервер для отправки</div>
                  </div>
                </label>
              </div>
            </div>

            {emailProvider === 'custom' && (
              <Alert className="border-amber-200 bg-amber-50">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-800 text-sm">
                  Функция собственного SMTP сервера будет добавлена в следующих версиях
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}