import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { ArrowLeft } from 'lucide-react';
import { AlbumsTable } from './AlbumsTable';
import { companyApi } from '../lib/companyApi';
import { toast } from 'sonner';

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
  const [albums, setAlbums] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingAlbum, setIsAddingAlbum] = useState(false);

  useEffect(() => {
    loadAlbums();
  }, [projectId, category]);

  const loadAlbums = async () => {
    try {
      setIsLoading(true);
      const companyId = localStorage.getItem('companyId');
      
      if (!companyId) {
        toast.error('Не удалось определить компанию');
        setIsLoading(false);
        return;
      }

      const response = await companyApi.getProjectAlbums(companyId, projectId, category);
      
      if (response.success) {
        setAlbums(response.albums || []);
      } else {
        toast.error('Не удалось загрузить альбомы');
      }
    } catch (error) {
      console.error('❌ Failed to load albums:', error);
      toast.error('Ошибка при загрузке альбомов');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddAlbum = () => {
    // Этот обработчик вызовется при клике на кнопку "Создать альбом"
    // Форма быстрого добавления будет показана автоматически через состояние таблицы
    setIsAddingAlbum(true);
  };

  const handleQuickAdd = async (albumData: any) => {
    try {
      console.log('Quick add album:', albumData);
      
      const companyId = localStorage.getItem('companyId');
      if (!companyId) {
        toast.error('Компания не найдена');
        return;
      }

      // Преобразуем данные формы в формат API
      const apiData = {
        name: albumData.name,
        code: albumData.code,
        category: category, // Используем категорию из пропсов
        departmentId: parseInt(albumData.department),
        executorId: albumData.executor ? parseInt(albumData.executor) : undefined,
        customerId: albumData.customer ? parseInt(albumData.customer) : undefined,
        deadline: albumData.deadline || undefined,
        comment: albumData.comment || undefined,
        link: albumData.albumLink || undefined,
      };

      // Создаем альбом через API
      await companyApi.createAlbum(companyId, projectId, apiData);
      
      toast.success('Альбом успешно создан');
      
      // Обновляем список альбомов
      await loadAlbums();
      
    } catch (error) {
      console.error('Failed to add album:', error);
      toast.error(error instanceof Error ? error.message : 'Ошибка при добавлении альбома');
    } finally {
      setIsAddingAlbum(false);
    }
  };

  const handleUpdateAlbum = async (albumId: string, updatedData: any) => {
    try {
      console.log('Updating album:', albumId, updatedData);
      
      const companyId = localStorage.getItem('companyId');
      if (!companyId) {
        toast.error('Компания не найдена');
        return;
      }

      // Преобразуем данные для API
      const apiData: any = {};
      
      if (updatedData.name !== undefined) apiData.name = updatedData.name;
      if (updatedData.code !== undefined) apiData.code = updatedData.code;
      if (updatedData.department !== undefined) apiData.departmentId = parseInt(updatedData.department);
      if (updatedData.executor !== undefined) apiData.executorId = updatedData.executor.id ? parseInt(updatedData.executor.id) : undefined;
      if (updatedData.customer !== undefined) apiData.customerId = updatedData.customer.id ? parseInt(updatedData.customer.id) : undefined;
      if (updatedData.deadline !== undefined) apiData.deadline = updatedData.deadline;
      if (updatedData.comment !== undefined) apiData.comment = updatedData.comment;
      if (updatedData.albumLink !== undefined) apiData.link = updatedData.albumLink;

      // Обновляем альбом через API
      await companyApi.updateAlbum(companyId, projectId, albumId, apiData);
      
      toast.success('Альбом успешно обновлен');
      
      // Обновляем список альбомов
      await loadAlbums();
      
    } catch (error) {
      console.error('Failed to update album:', error);
      toast.error('Ошибка при обновлении альбома');
    }
  };

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
          albums={albums}
          onAlbumClick={onAlbumClick}
          onAddAlbum={handleAddAlbum}
          onQuickAdd={handleQuickAdd}
          onUpdateAlbum={handleUpdateAlbum}
          onRetry={loadAlbums}
          isExpanded={true}
          isLoading={isLoading}
          companyId={localStorage.getItem('companyId') || ''}
          projectId={projectId}
        />
      </div>
    </div>
  );
}
