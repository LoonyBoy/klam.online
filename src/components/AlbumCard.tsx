import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { ArrowLeft, Plus, ExternalLink, MessageSquare, Calendar, User, Clock } from 'lucide-react';
import { mockAlbums, mockEvents, mockProjects } from '../lib/mockData';

interface AlbumCardProps {
  albumId: string;
  onBack: () => void;
}

export function AlbumCard({ albumId, onBack }: AlbumCardProps) {
  const album = mockAlbums.find(a => a.id === albumId);
  const albumEvents = mockEvents.filter(e => e.albumId === albumId);
  const project = album ? mockProjects.find(p => p.id === album.projectId) : null;

  const [isAddEventOpen, setIsAddEventOpen] = useState(false);
  const [eventType, setEventType] = useState('');
  const [eventComment, setEventComment] = useState('');

  if (!album) {
    return (
      <div className="p-4 md:p-8">
        <p>Альбом не найден</p>
      </div>
    );
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ru-RU', { 
      day: '2-digit', 
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getEventBadgeVariant = (type: string) => {
    switch (type) {
      case '#замечания': return 'destructive';
      case '#отклонено': return 'destructive';
      default: return 'default';
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'В работе': return 'default';
      case 'На проверке': return 'default';
      case 'Принято': return 'default';
      case 'Замечания': return 'destructive';
      default: return 'default';
    }
  };

  // Прогресс по дедлайну
  const daysLeft = Math.ceil(
    (new Date(album.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  );
  const totalDays = 30; // Предполагаем 30 дней на альбом
  const progress = Math.max(0, Math.min(100, ((totalDays - daysLeft) / totalDays) * 100));

  const handleAddEvent = () => {
    console.log('Добавление события:', {
      eventType,
      eventComment,
      albumId
    });
    setIsAddEventOpen(false);
    setEventType('');
    setEventComment('');
  };

  return (
    <div className="p-4 md:p-8">
      {/* Навигация назад */}
      <Button variant="ghost" onClick={onBack} className="mb-4 gap-2 -ml-2 hover:bg-transparent hover:text-blue-600">
        <ArrowLeft className="w-4 h-4" />
        <span className="hidden sm:inline">Назад к проекту</span>
        <span className="sm:hidden">Назад</span>
      </Button>

      {/* Заголовок альбома */}
      <div className="mb-4 md:mb-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div className="flex-1">
            <p className="text-xs md:text-sm text-gray-500">
              {project?.code} / {album.code}
            </p>
            <h1 className="mt-1 text-xl md:text-3xl">{album.name}</h1>
            <p className="text-gray-600 mt-1 text-sm md:text-base">{project?.name}</p>
          </div>
          <Badge variant={getStatusBadgeVariant(album.status)} className="self-start">
            {album.status}
          </Badge>
        </div>
      </div>

      {/* Информация и дедлайн */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 mb-4 md:mb-6">
        <Card className="lg:col-span-2 border-gray-200 shadow-sm">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-white border-b">
            <CardTitle className="text-base md:text-lg">Информация об альбоме</CardTitle>
          </CardHeader>
          <CardContent className="pt-4 md:pt-6 space-y-4">
            <div className="grid grid-cols-2 gap-3 md:gap-4">
              <div>
                <p className="text-xs md:text-sm text-gray-500">Шифр альбома</p>
                <p className="mt-1 text-sm md:text-base font-medium">{album.code}</p>
              </div>
              <div>
                <p className="text-xs md:text-sm text-gray-500">Отдел</p>
                <p className="mt-1 text-sm md:text-base font-medium">{album.department}</p>
              </div>
              <div>
                <p className="text-xs md:text-sm text-gray-500">Статус</p>
                <p className="mt-1 text-sm md:text-base font-medium">{album.status}</p>
              </div>
              <div>
                <p className="text-xs md:text-sm text-gray-500">Дедлайн</p>
                <p className="mt-1 text-sm md:text-base font-medium">{formatDate(album.deadline)}</p>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <p className="text-xs md:text-sm text-gray-500 mb-3">Ссылки и ресурсы</p>
              <div className="flex gap-2 md:gap-3 flex-wrap">
                {album.albumLink && (
                  <Button variant="outline" size="sm" className="gap-2 text-xs md:text-sm" asChild>
                    <a href={album.albumLink} target="_blank" rel="noopener noreferrer">
                      Google Drive
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </Button>
                )}
                {project?.telegramLink && (
                  <Button variant="outline" size="sm" className="gap-2 text-xs md:text-sm" asChild>
                    <a href={project.telegramLink} target="_blank" rel="noopener noreferrer">
                      <MessageSquare className="w-3 h-3 md:w-4 md:h-4" />
                      Telegram
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </Button>
                )}
                {!album.albumLink && !project?.telegramLink && (
                  <p className="text-xs md:text-sm text-gray-400">Ссылки не добавлены</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Дедлайн и прогресс */}
        <Card className="border-gray-200 shadow-sm">
          <CardHeader className="bg-gradient-to-r from-orange-50 to-white border-b">
            <CardTitle className="text-base md:text-lg">Дедлайн</CardTitle>
          </CardHeader>
          <CardContent className="pt-4 md:pt-6 space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs md:text-sm text-gray-500">До дедлайна</span>
                <span className={`text-sm md:text-base font-bold ${daysLeft <= 3 ? 'text-red-600' : 'text-gray-900'}`}>
                  {daysLeft > 0 ? `${daysLeft} дн.` : 'Просрочен'}
                </span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
            
            <div className="pt-4 border-t border-gray-200">
              <p className="text-xs md:text-sm text-gray-500">Целевая дата</p>
              <p className="mt-1 text-sm md:text-base font-medium">{formatDate(album.deadline)}</p>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <p className="text-xs md:text-sm text-gray-500">Событий</p>
              <p className="mt-1 text-sm md:text-base font-medium">{albumEvents.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* События альбома */}
      <Card className="border-gray-200 shadow-sm">
        <CardHeader className="bg-gradient-to-r from-indigo-50 to-white border-b">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <CardTitle className="text-base md:text-lg">События альбома</CardTitle>
            <Dialog open={isAddEventOpen} onOpenChange={setIsAddEventOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-2 w-full sm:w-auto">
                  <Plus className="w-4 h-4" />
                  Добавить событие
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-[90vw] md:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Добавить событие</DialogTitle>
                  <DialogDescription>
                    Зарегистрируйте новое событие для альбома
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="event-type">Тип события</Label>
                    <Select value={eventType} onValueChange={setEventType}>
                      <SelectTrigger id="event-type">
                        <SelectValue placeholder="Выберите тип" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="#выгрузка">#выгрузка</SelectItem>
                        <SelectItem value="#замечания">#замечания</SelectItem>
                        <SelectItem value="#принято">#принято</SelectItem>
                        <SelectItem value="#отклонено">#отклонено</SelectItem>
                        <SelectItem value="#правки">#правки</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="event-comment">Комментарий</Label>
                    <Textarea
                      id="event-comment"
                      placeholder="Опишите событие..."
                      value={eventComment}
                      onChange={(e) => setEventComment(e.target.value)}
                      rows={4}
                    />
                  </div>
                </div>
                <DialogFooter className="flex-col sm:flex-row gap-2">
                  <Button variant="outline" onClick={() => setIsAddEventOpen(false)} className="w-full sm:w-auto">
                    Отмена
                  </Button>
                  <Button onClick={handleAddEvent} className="w-full sm:w-auto">Добавить</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="pt-4 md:pt-6">
          {albumEvents.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
              <Calendar className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-600 mb-1 text-sm md:text-base">Нет зарегистрированных событий</p>
              <p className="text-xs md:text-sm text-gray-400 mt-2">
                Добавьте первое событие для отслеживания истории работы
              </p>
            </div>
          ) : (
            <>
              {/* Мобильное представление - карточки */}
              <div className="md:hidden space-y-3">
                {albumEvents.map((event) => (
                  <div key={event.id} className="p-4 rounded-lg border border-gray-200 bg-white hover:border-blue-300 transition-colors">
                    <div className="flex items-start justify-between mb-2">
                      <Badge variant={getEventBadgeVariant(event.type)}>
                        {event.type}
                      </Badge>
                      <span className="text-xs text-gray-500">{formatDateTime(event.date)}</span>
                    </div>
                    <p className="text-sm text-gray-900 mb-2">{event.comment}</p>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <User className="w-3 h-3" />
                      {event.user}
                    </div>
                  </div>
                ))}
              </div>

              {/* Десктопное представление - таблица */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2 border-gray-200">
                      <th className="text-left py-4 px-4 font-semibold text-gray-700">Дата и время</th>
                      <th className="text-left py-4 px-4 font-semibold text-gray-700">Тип события</th>
                      <th className="text-left py-4 px-4 font-semibold text-gray-700">Пользователь</th>
                      <th className="text-left py-4 px-4 font-semibold text-gray-700">Комментарий</th>
                    </tr>
                  </thead>
                  <tbody>
                    {albumEvents.map((event) => (
                      <tr key={event.id} className="border-b border-gray-100 hover:bg-blue-50/50 transition-colors">
                        <td className="py-4 px-4 text-sm text-gray-600">
                          {formatDateTime(event.date)}
                        </td>
                        <td className="py-4 px-4">
                          <Badge variant={getEventBadgeVariant(event.type)}>
                            {event.type}
                          </Badge>
                        </td>
                        <td className="py-4 px-4 text-sm">{event.user}</td>
                        <td className="py-4 px-4 text-sm">{event.comment}</td>
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
