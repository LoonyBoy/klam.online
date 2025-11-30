import { useState, useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { LandingPage } from './components/LandingPage';
import { LoginPage } from './components/LoginPage';
import { Onboarding } from './components/Onboarding';
import { Dashboard } from './components/Dashboard';
import { ProjectsList } from './components/ProjectsList';
import { ProjectCard } from './components/ProjectCard';
import { AlbumCard } from './components/AlbumCard';
import { AlbumsView } from './components/AlbumsView';
import { Users } from './components/Users';
import { Settings } from './components/Settings';
import { Reports } from './components/Reports';
import { Sections } from './components/Sections';
import { Sidebar } from './components/Sidebar';
import { InvitePage } from './components/InvitePage';
import { TelegramAuthCallback } from './components/TelegramAuthCallback';
import { Toaster } from './components/ui/sonner';

export type Page = 'landing' | 'login' | 'onboarding' | 'dashboard' | 'projects' | 'project' | 'album' | 'albums-view' | 'users' | 'settings' | 'reports' | 'sections';

export interface User {
  id: string;
  name: string;
  email: string;
  telegramId: string;
  role: 'executor' | 'client';
  department: string;
}

export interface Event {
  id: string;
  date: string;
  type: '#замечания' | '#выгрузка' | '#принято' | '#отклонено' | '#правки';
  user: string;
  comment: string;
  projectId?: string;
  albumId?: string;
}

export interface Album {
  id: string;
  name: string;
  code: string;
  status: 'В работе' | 'На проверке' | 'Принято' | 'Замечания';
  deadline: string;
  department: string;
  projectId: string;
  category: 'СВОК ПД' | 'СВОК РД';
  executor: {
    id: string;
    name: string;
    avatar?: string;
  };
  lastEvent?: {
    type: '#замечания' | '#выгрузка' | '#принято' | '#отклонено' | '#правки';
    date: string;
  };
  comment?: string;
  albumLink?: string;
}

export interface Project {
  id: string;
  code: string;
  name: string;
  client: string;
  address?: string;
  department: string;
  departments?: string[];
  executor: string;
  status: 'Активный' | 'Завершён' | 'Приостановлен';
  deadline: string;
  telegramLink?: string;
  driveLink?: string;
  projectUsers?: {
    executors: User[];
    clients: User[];
  };
}

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('landing');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ name: string; telegramUsername?: string; email?: string } | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedProjectName, setSelectedProjectName] = useState<string>('');
  const [selectedAlbumId, setSelectedAlbumId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<'СВОК ПД' | 'СВОК РД'>('СВОК ПД');
  const [isTelegramAuthProcessing, setIsTelegramAuthProcessing] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Проверяем сохраненную авторизацию при загрузке
  useEffect(() => {
    const checkSavedAuth = async () => {
      console.log('🔍 Проверка сохраненной авторизации...');
      const authToken = localStorage.getItem('authToken');
      const storedUser = localStorage.getItem('user');
      const companyId = localStorage.getItem('companyId');
      
      console.log('📦 Данные из localStorage:', {
        hasToken: !!authToken,
        hasUser: !!storedUser,
        companyId: companyId
      });

      if (authToken && storedUser) {
        try {
          // Проверяем валидность токена
          console.log('🔐 Проверка токена...');
          const response = await fetch('/api/auth/verify', {
            headers: {
              'Authorization': `Bearer ${authToken}`,
              'ngrok-skip-browser-warning': 'true'
            }
          });

          if (response.ok) {
            console.log('✅ Токен действителен, автоматический вход');
            const userData = JSON.parse(storedUser);
            
            setCurrentUser({
              name: userData?.firstName || 'Пользователь',
              telegramUsername: userData?.username ? `@${userData.username}` : undefined,
              email: userData?.email
            });

            setIsAuthenticated(true);
            
            // Проверяем наличие компании
            if (companyId) {
              console.log(`🏢 Проверка компании ${companyId}...`);
              try {
                // Проверяем, действительно ли пользователь состоит в этой компании
                const companyCheckResponse = await fetch(`/api/companies/${companyId}/check`, {
                  headers: {
                    'Authorization': `Bearer ${authToken}`,
                    'ngrok-skip-browser-warning': 'true'
                  }
                });

                console.log('📡 Ответ сервера:', companyCheckResponse.status);

                if (companyCheckResponse.ok) {
                  console.log('✅ Компания найдена, переход в dashboard');
                  localStorage.setItem('hasCompletedOnboarding', 'true');
                  setCurrentPage('dashboard');
                } else {
                  const errorData = await companyCheckResponse.json();
                  console.log('⚠️ Компания не найдена:', errorData);
                  localStorage.removeItem('companyId');
                  localStorage.removeItem('hasCompletedOnboarding');
                  setNeedsOnboarding(true);
                  setCurrentPage('onboarding');
                }
              } catch (error) {
                console.error('❌ Ошибка проверки компании:', error);
                // В случае ошибки показываем онбординг
                setNeedsOnboarding(true);
                setCurrentPage('onboarding');
              }
            } else {
              // Нет сохраненной компании - показываем онбординг
              console.log('📋 Компания не найдена в localStorage, показываем онбординг');
              setNeedsOnboarding(true);
              setCurrentPage('onboarding');
            }
          } else {
            console.log('⚠️ Токен недействителен, требуется повторный вход');
            localStorage.removeItem('authToken');
            localStorage.removeItem('user');
            localStorage.removeItem('companyId');
            localStorage.removeItem('hasCompletedOnboarding');
          }
        } catch (error) {
          console.error('❌ Ошибка проверки токена:', error);
        }
      }
      
      setIsCheckingAuth(false);
    };

    checkSavedAuth();
  }, []);

  // Проверяем параметры URL для Telegram callback
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const hash = params.get('hash');
    
    if (hash && !isTelegramAuthProcessing) {
      console.log('🔍 Обнаружен Telegram callback');
      setIsTelegramAuthProcessing(true);
      handleTelegramCallback(params);
    }
  }, [isTelegramAuthProcessing]);

  const handleTelegramCallback = async (params: URLSearchParams) => {
    try {
      const userData = {
        id: parseInt(params.get('id') || '0'),
        first_name: params.get('first_name') || '',
        last_name: params.get('last_name') || undefined,
        username: params.get('username') || undefined,
        photo_url: params.get('photo_url') || undefined,
        auth_date: parseInt(params.get('auth_date') || '0'),
        hash: params.get('hash') || ''
      };

      console.log('📤 Отправка Telegram данных на backend...');
      console.log('📦 Данные для отправки:', JSON.stringify(userData, null, 2));
      
      const response = await fetch('/api/auth/telegram', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true'
        },
        body: JSON.stringify(userData)
      });

      console.log('📡 Статус ответа:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Ошибка от сервера:', errorText);
        throw new Error(`Authentication failed: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Авторизация успешна');
      
      // Сохраняем токен и данные
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('user', JSON.stringify({
        id: data.user.id,
        telegramId: data.user.telegramId,
        firstName: data.user.firstName,
        lastName: data.user.lastName,
        username: data.user.username,
        photoUrl: data.user.photoUrl,
      }));

      // Очищаем URL от параметров
      window.history.replaceState({}, document.title, window.location.pathname);
      
      // Вызываем handleLogin
      handleLogin();
      
    } catch (error) {
      console.error('❌ Ошибка Telegram авторизации:', error);
      alert('Ошибка при входе через Telegram');
      setIsTelegramAuthProcessing(false);
    }
  };

  const handleGetStarted = () => {
    setCurrentPage('login');
  };

  const handleLogin = async () => {
    console.log('🚀 === ВЫЗВАНА ФУНКЦИЯ handleLogin ===');
    const storedUser = localStorage.getItem('user');
    const userData = storedUser ? JSON.parse(storedUser) : null;
    const authToken = localStorage.getItem('authToken');
    let companyId = localStorage.getItem('companyId');
    
    console.log('📦 Данные для входа:', {
      hasUser: !!storedUser,
      hasToken: !!authToken,
      savedCompanyId: companyId,
      userId: userData?.id
    });
    
    // Устанавливаем данные пользователя
    setCurrentUser({
      name: userData?.firstName || 'Пользователь',
      telegramUsername: userData?.username ? `@${userData.username}` : undefined,
      email: userData?.email
    });
    
    setIsAuthenticated(true);
    
    // Если нет сохраненной компании, пытаемся получить список компаний пользователя
    if (!companyId && authToken) {
      try {
        console.log('🔍 Поиск компаний пользователя...');
        console.log('🔑 Используемый токен:', authToken.substring(0, 20) + '...');
        console.log('📡 Отправка запроса на /api/user/companies');
        
        const companiesResponse = await fetch('/api/user/companies', {
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'ngrok-skip-browser-warning': 'true'
          }
        });

        console.log('📬 Статус ответа:', companiesResponse.status, companiesResponse.statusText);
        
        if (companiesResponse.ok) {
          const companies = await companiesResponse.json();
          console.log('📊 Найдено компаний:', companies.length);
          console.log('📋 Данные компаний:', JSON.stringify(companies, null, 2));
          
          if (companies.length > 0) {
            // Берем первую компанию
            const foundCompanyId = companies[0].id.toString();
            companyId = foundCompanyId;
            localStorage.setItem('companyId', foundCompanyId);
            console.log('💾 Сохранена компания:', foundCompanyId);
          }
        }
      } catch (error) {
        console.error('❌ Ошибка получения компаний:', error);
      }
    }
    
    // Проверяем наличие компании
    console.log('🏢 Проверка наличия компании, companyId:', companyId, 'hasToken:', !!authToken);
    if (companyId && authToken) {
      try {
        console.log('📡 Отправка запроса на /api/companies/' + companyId + '/check');
        // Проверяем, действительно ли пользователь состоит в компании
        const response = await fetch(`/api/companies/${companyId}/check`, {
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'ngrok-skip-browser-warning': 'true'
          }
        });

        console.log('📬 Статус проверки компании:', response.status);
        if (response.ok) {
          console.log('✅ Компания найдена, переход в dashboard');
          localStorage.setItem('hasCompletedOnboarding', 'true');
          setNeedsOnboarding(false);
          setCurrentPage('dashboard');
        } else {
          console.log('⚠️ Компания не найдена, показываем онбординг');
          localStorage.removeItem('companyId');
          localStorage.removeItem('hasCompletedOnboarding');
          setNeedsOnboarding(true);
          setCurrentPage('onboarding');
        }
      } catch (error) {
        console.error('❌ Ошибка проверки компании:', error);
        // В случае ошибки показываем онбординг
        setNeedsOnboarding(true);
        setCurrentPage('onboarding');
      }
    } else {
      // Нет сохраненной компании - показываем онбординг
      console.log('📋 Компания не найдена, показываем онбординг');
      setNeedsOnboarding(true);
      setCurrentPage('onboarding');
    }
  };

  const handleOnboardingComplete = (companyId: string) => {
    console.log('🎯 Компания создана/выбрана:', companyId);
    console.log('💾 Сохранение в localStorage...');
    
    // Сохраняем флаг завершения онбординга
    localStorage.setItem('hasCompletedOnboarding', 'true');
    localStorage.setItem('companyId', companyId);
    
    console.log('✅ Сохранено в localStorage:', {
      hasCompletedOnboarding: localStorage.getItem('hasCompletedOnboarding'),
      companyId: localStorage.getItem('companyId')
    });
    
    setIsAuthenticated(true);
    setNeedsOnboarding(false);
    setCurrentPage('dashboard');
    console.log('🚀 Переход в dashboard');
  };

  const handleLogout = () => {
    // Очищаем все данные авторизации
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    localStorage.removeItem('hasCompletedOnboarding');
    localStorage.removeItem('companyId');
    
    setIsAuthenticated(false);
    setNeedsOnboarding(false);
    setCurrentUser(null);
    setCurrentPage('landing');
  };

  const navigateToProject = (projectId: string) => {
    setSelectedProjectId(projectId);
    setCurrentPage('project');
  };

  const navigateToAlbum = (albumId: string) => {
    setSelectedAlbumId(albumId);
    setCurrentPage('album');
  };

  const navigateToAlbumsView = (category: 'СВОК ПД' | 'СВОК РД', projectName: string) => {
    setSelectedCategory(category);
    setSelectedProjectName(projectName);
    setCurrentPage('albums-view');
  };

  const location = useLocation();
  
  // Специальные роуты (приглашение и Telegram callback)
  const isSpecialRoute = location.pathname.startsWith('/invite/') || location.pathname === '/auth/telegram/callback';

  // Показываем загрузку при проверке авторизации (но не для специальных роутов)
  if (isCheckingAuth && !isSpecialRoute) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Проверка авторизации...</p>
        </div>
      </div>
    );
  }

  // Обработка специальных роутов
  if (isSpecialRoute) {
    return (
      <Routes>
        <Route path="/invite/:token" element={<InvitePage />} />
        <Route path="/auth/telegram/callback" element={<TelegramAuthCallback />} />
      </Routes>
    );
  }

  // Показываем лендинг, если пользователь не аутентифицирован и не на странице логина
  if (!isAuthenticated && currentPage === 'landing') {
    return <LandingPage onGetStarted={handleGetStarted} />;
  }

  // Показываем страницу логина
  if (!isAuthenticated && currentPage === 'login') {
    return <LoginPage onLogin={handleLogin} />;
  }

  // Показываем онбординг после логина
  if (needsOnboarding && currentPage === 'onboarding' && currentUser) {
    return (
      <Onboarding
        userName={currentUser.name}
        userTelegramUsername={currentUser.telegramUsername}
        userEmail={currentUser.email}
        onComplete={handleOnboardingComplete}
      />
    );
  }

  return (
    <>
      <div className="flex h-screen bg-gray-50">
        <Sidebar 
          currentPage={currentPage} 
          onNavigate={setCurrentPage}
          onLogout={handleLogout}
        />
        
        <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
          {currentPage === 'dashboard' && (
            <Dashboard onNavigateToProject={navigateToProject} />
          )}
          {currentPage === 'projects' && (
            <ProjectsList onNavigateToProject={navigateToProject} />
          )}
          {currentPage === 'project' && selectedProjectId && (
            <ProjectCard 
              projectId={selectedProjectId} 
              onNavigateToAlbum={navigateToAlbum}
              onNavigateToAlbumsView={navigateToAlbumsView}
              onBack={() => setCurrentPage('projects')}
            />
          )}
          {currentPage === 'album' && selectedAlbumId && (
            <AlbumCard 
              albumId={selectedAlbumId}
              onBack={() => setCurrentPage('project')}
            />
          )}
          {currentPage === 'albums-view' && selectedProjectId && (
            <AlbumsView 
              projectId={selectedProjectId}
              projectName={selectedProjectName}
              category={selectedCategory}
              onAlbumClick={navigateToAlbum}
              onBack={() => setCurrentPage('project')}
            />
          )}
          {currentPage === 'users' && <Users />}
          {currentPage === 'settings' && <Settings />}
          {currentPage === 'sections' && <Sections />}
          {currentPage === 'reports' && (
            <Reports 
              onNavigateToProject={navigateToProject}
              onNavigateToAlbum={navigateToAlbum}
            />
          )}
        </main>
      </div>
      <Toaster />
    </>
  );
}