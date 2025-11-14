import { useState, useEffect } from 'react';
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
        headers: { 'Content-Type': 'application/json' },
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

  const handleLogin = () => {
    // Получаем данные пользователя из localStorage
    const storedUser = localStorage.getItem('user');
    const userData = storedUser ? JSON.parse(storedUser) : null;
    
    // Устанавливаем данные пользователя
    setCurrentUser({
      name: userData?.firstName || 'Пользователь',
      telegramUsername: userData?.username ? `@${userData.username}` : undefined,
      email: userData?.email
    });
    
    // Проверяем, прошел ли пользователь онбординг
    const hasCompletedOnboarding = localStorage.getItem('hasCompletedOnboarding') === 'true';
    
    if (hasCompletedOnboarding) {
      // Пользователь уже проходил онбординг - сразу в dashboard
      console.log('✅ Онбординг пройден ранее, переход в dashboard');
      setIsAuthenticated(true);
      setNeedsOnboarding(false);
      setCurrentPage('dashboard');
    } else {
      // Новый пользователь - показываем онбординг
      console.log('📋 Первый вход, показываем онбординг');
      setNeedsOnboarding(true);
      setCurrentPage('onboarding');
    }
  };

  const handleOnboardingComplete = (companyId: string) => {
    console.log('Компания создана/выбрана:', companyId);
    
    // Сохраняем флаг завершения онбординга
    localStorage.setItem('hasCompletedOnboarding', 'true');
    localStorage.setItem('companyId', companyId);
    
    setIsAuthenticated(true);
    setNeedsOnboarding(false);
    setCurrentPage('dashboard');
  };

  const handleLogout = () => {
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
  );
}