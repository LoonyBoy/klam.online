import { useState } from 'react';
import { LandingPage } from './components/LandingPage';
import { LoginPage } from './components/LoginPage';
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
import { mockProjects } from './lib/mockData';

export type Page = 'landing' | 'login' | 'dashboard' | 'projects' | 'project' | 'album' | 'albums-view' | 'users' | 'settings' | 'reports' | 'sections';

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
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedAlbumId, setSelectedAlbumId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<'СВОК ПД' | 'СВОК РД'>('СВОК ПД');

  const handleGetStarted = () => {
    setCurrentPage('login');
  };

  const handleLogin = () => {
    setIsAuthenticated(true);
    setCurrentPage('dashboard');
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
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

  const navigateToAlbumsView = (category: 'СВОК ПД' | 'СВОК РД') => {
    setSelectedCategory(category);
    setCurrentPage('albums-view');
  };

  // Показываем лендинг, если пользователь не аутентифицирован и не на странице логина
  if (!isAuthenticated && currentPage === 'landing') {
    return <LandingPage onGetStarted={handleGetStarted} />;
  }

  // Показываем страницу логина
  if (!isAuthenticated) {
    return <LoginPage onLogin={handleLogin} />;
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
            projectName={mockProjects.find(p => p.id === selectedProjectId)?.name || ''}
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