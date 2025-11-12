import { Button } from './ui/button';
import { ArrowLeft } from 'lucide-react';
import { mockAlbums } from '../lib/mockData';
import { AlbumsTable } from './AlbumsTable';

interface AlbumsViewProps {
  projectId: string;
  projectName: string;
  category: 'СВОК ПД' | 'СВОК РД';
  onBack: () => void;
  onAlbumClick: (albumId: string) => void;
}

export function AlbumsView({ 
  projectId, 
  projectName, 
  category, 
  onBack, 
  onAlbumClick 
}: AlbumsViewProps) {
  const projectAlbums = mockAlbums
    .filter(a => a.projectId === projectId && a.category === category);

  return (
    <div className="p-4 md:p-8 min-h-screen bg-gray-50">
      {/* Навигация назад */}
      <Button variant="ghost" onClick={onBack} className="mb-4 gap-2 -ml-2 hover:bg-transparent hover:text-blue-600">
        <ArrowLeft className="w-4 h-4" />
        <span className="hidden sm:inline">Назад к проекту</span>
        <span className="sm:hidden">Назад</span>
      </Button>

      {/* Заголовок */}
      <div className="mb-4 md:mb-6">
        <h1 className="mb-2 text-xl md:text-3xl bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
          {category}
        </h1>
        <p className="text-gray-600 text-sm md:text-base">{projectName}</p>
      </div>

      {/* Таблица альбомов в полном размере */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <AlbumsTable
          albums={projectAlbums}
          onAlbumClick={onAlbumClick}
          isExpanded={true}
        />
      </div>
    </div>
  );
}
