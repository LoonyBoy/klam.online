import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Alert, AlertDescription } from './ui/alert';
import { CheckCircle2, Settings as SettingsIcon, MessageSquare, Database, Mail, Building, User, Check } from 'lucide-react';

export function Settings() {
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Профиль пользователя
  const [firstName, setFirstName] = useState('Иван');
  const [lastName, setLastName] = useState('Иванов');
  const [position, setPosition] = useState('Главный инженер проекта');
  const [userEmail, setUserEmail] = useState('ivanov@company.ru');

  // Исходные значения для отслеживания изменений
  const [originalProfile, setOriginalProfile] = useState({ firstName: 'Иван', lastName: 'Иванов', position: 'Главный инженер проекта', userEmail: 'ivanov@company.ru' });
  const [originalCompany, setOriginalCompany] = useState({ companyName: 'ООО "Проектная компания"', companyEmail: 'info@company.ru', companyPhone: '+7 (999) 123-45-67', companyAddress: '' });
  const [originalStorage, setOriginalStorage] = useState({ driveLink: '', yandexDiskLink: '', shareDiskLink: '' });
  const [originalEmail, setOriginalEmail] = useState({ emailProvider: 'klam' as 'klam' | 'custom', smtpServer: '', smtpPort: '', smtpUsername: '', smtpPassword: '', emailFrom: '' });

  // Хранилища
  const [driveLink, setDriveLink] = useState('');
  const [yandexDiskLink, setYandexDiskLink] = useState('');
  const [shareDiskLink, setShareDiskLink] = useState('');

  // Email настройки
  const [emailProvider, setEmailProvider] = useState<'klam' | 'custom'>('klam');
  const [smtpServer, setSmtpServer] = useState('');
  const [smtpPort, setSmtpPort] = useState('');
  const [smtpUsername, setSmtpUsername] = useState('');
  const [smtpPassword, setSmtpPassword] = useState('');
  const [emailFrom, setEmailFrom] = useState('');

  // Компания
  const [companyName, setCompanyName] = useState('ООО "Проектная компания"');
  const [companyEmail, setCompanyEmail] = useState('info@company.ru');
  const [companyPhone, setCompanyPhone] = useState('+7 (999) 123-45-67');
  const [companyAddress, setCompanyAddress] = useState('');

  // Проверка изменений в каждом блоке
  const profileChanged = firstName !== originalProfile.firstName || lastName !== originalProfile.lastName || 
                         position !== originalProfile.position || userEmail !== originalProfile.userEmail;
  
  const companyChanged = companyName !== originalCompany.companyName || companyEmail !== originalCompany.companyEmail || 
                         companyPhone !== originalCompany.companyPhone || companyAddress !== originalCompany.companyAddress;
  
  const storageChanged = driveLink !== originalStorage.driveLink || yandexDiskLink !== originalStorage.yandexDiskLink || 
                         shareDiskLink !== originalStorage.shareDiskLink;
  
  const emailChanged = emailProvider !== originalEmail.emailProvider || smtpServer !== originalEmail.smtpServer || 
                       smtpPort !== originalEmail.smtpPort || smtpUsername !== originalEmail.smtpUsername || 
                       smtpPassword !== originalEmail.smtpPassword || emailFrom !== originalEmail.emailFrom;

  const saveProfile = () => {
    setOriginalProfile({ firstName, lastName, position, userEmail });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const saveCompany = () => {
    setOriginalCompany({ companyName, companyEmail, companyPhone, companyAddress });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const saveStorage = () => {
    setOriginalStorage({ driveLink, yandexDiskLink, shareDiskLink });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const saveEmail = () => {
    setOriginalEmail({ emailProvider, smtpServer, smtpPort, smtpUsername, smtpPassword, emailFrom });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const handleSave = () => {
    setIsSaving(true);
    setSaveSuccess(false);

    // Симуляция сохранения
    setTimeout(() => {
      setIsSaving(false);
      setSaveSuccess(true);
      
      console.log('Сохранение настроек:', {
        profile: { firstName, lastName, position, userEmail },
        storage: { driveLink, yandexDiskLink, shareDiskLink },
        email: { smtpServer, smtpPort, smtpUsername, emailFrom },
        company: { companyName, companyEmail, companyPhone, companyAddress }
      });

      // Скрыть сообщение об успехе через 3 секунды
      setTimeout(() => setSaveSuccess(false), 3000);
    }, 800);
  };

  const handleTestConnection = (service: string) => {
    alert(`Тестирование подключения к ${service}...`);
  };

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
                <Label htmlFor="position">Должность</Label>
                <Input
                  id="position"
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                  placeholder="Главный инженер проекта"
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
              {companyChanged && (
                <Button
                  size="sm"
                  onClick={saveCompany}
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
                <Label htmlFor="company-name">Название компании</Label>
                <Input
                  id="company-name"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company-email">Email компании</Label>
                <Input
                  id="company-email"
                  type="email"
                  value={companyEmail}
                  onChange={(e) => setCompanyEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company-phone">Телефон</Label>
                <Input
                  id="company-phone"
                  value={companyPhone}
                  onChange={(e) => setCompanyPhone(e.target.value)}
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
              />
            </div>
          </CardContent>
        </Card>

        {/* Хранилища */}
        <Card className="border-gray-200 shadow-sm">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-white border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center">
                  <Database className="w-5 h-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-lg">Хранилища документов</CardTitle>
                  <CardDescription>
                    Настройте ссылки на облачные хранилища для проектов
                  </CardDescription>
                </div>
              </div>
              {storageChanged && (
                <Button
                  size="sm"
                  onClick={saveStorage}
                  className="gap-2 bg-green-600 hover:bg-green-700"
                >
                  <Check className="w-4 h-4" />
                  Сохранить
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="drive-link">Google Drive</Label>
              <Input
                id="drive-link"
                type="url"
                placeholder="https://drive.google.com/drive/folders/..."
                value={driveLink}
                onChange={(e) => setDriveLink(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="yandex-link">Яндекс.Диск</Label>
              <Input
                id="yandex-link"
                type="url"
                placeholder="https://disk.yandex.ru/d/..."
                value={yandexDiskLink}
                onChange={(e) => setYandexDiskLink(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="share-link">ShareDisk</Label>
              <Input
                id="share-link"
                type="url"
                placeholder="https://sharedisk.com/..."
                value={shareDiskLink}
                onChange={(e) => setShareDiskLink(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Email уведомления */}
        <Card className="border-gray-200 shadow-sm">
          <CardHeader className="bg-gradient-to-r from-orange-50 to-white border-b">
            <div className="flex items-center justify-between">
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
              {emailChanged && (
                <Button
                  size="sm"
                  onClick={saveEmail}
                  className="gap-2 bg-green-600 hover:bg-green-700"
                >
                  <Check className="w-4 h-4" />
                  Сохранить
                </Button>
              )}
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
                    <div className="font-medium text-sm">Почта сервиса klam.online</div>
                    <div className="text-xs text-gray-500">Уведомления будут отправляться с noreply@klam.online</div>
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
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="smtp-server">SMTP сервер</Label>
                    <Input
                      id="smtp-server"
                      placeholder="smtp.gmail.com"
                      value={smtpServer}
                      onChange={(e) => setSmtpServer(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="smtp-port">Порт</Label>
                    <Input
                      id="smtp-port"
                      placeholder="587"
                      value={smtpPort}
                      onChange={(e) => setSmtpPort(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="smtp-username">Имя пользователя</Label>
                    <Input
                      id="smtp-username"
                      type="email"
                      placeholder="notifications@company.ru"
                      value={smtpUsername}
                      onChange={(e) => setSmtpUsername(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="smtp-password">Пароль</Label>
                    <Input
                      id="smtp-password"
                      type="password"
                      value={smtpPassword}
                      onChange={(e) => setSmtpPassword(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email-from">Email отправителя</Label>
                  <Input
                    id="email-from"
                    type="email"
                    placeholder="noreply@company.ru"
                    value={emailFrom}
                    onChange={(e) => setEmailFrom(e.target.value)}
                  />
                </div>
              </>
            )}

            <Button 
              variant="outline" 
              size="sm"
              className="gap-2 hover:bg-orange-50"
              onClick={() => handleTestConnection('Email')}
            >
              <Mail className="w-4 h-4" />
              Отправить тестовое письмо
            </Button>
          </CardContent>
        </Card>

        {/* Кнопка сохранения */}
        <div className="flex justify-end">
          <Button 
            onClick={handleSave}
            disabled={isSaving}
            className="gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
          >
            <SettingsIcon className="w-4 h-4" />
            {isSaving ? 'Сохранение...' : 'Сохранить настройки'}
          </Button>
        </div>
      </div>
    </div>
  );
}