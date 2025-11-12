import { useState } from 'react';
import { Plus, Edit2, Trash2, FolderTree } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';

interface AlbumTemplate {
  id: string;
  name: string;
  code: string;
  department: 'АР' | 'КР' | 'ОВВК' | 'ЭС' | 'ГП' | 'СС';
}

const departments = [
  { value: 'АР', label: 'АР - Архитектурные решения' },
  { value: 'КР', label: 'КР - Конструктивные решения' },
  { value: 'ОВВК', label: 'ОВВК - Отопление, вентиляция и кондиционирование' },
  { value: 'ЭС', label: 'ЭС - Электроснабжение' },
  { value: 'ГП', label: 'ГП - Генеральный план' },
  { value: 'СС', label: 'СС - Сети связи' },
];

export function Sections() {
  const [templates, setTemplates] = useState<AlbumTemplate[]>([
    { id: '1', name: 'Пояснительная записка', code: 'ПЗ', department: 'АР' },
    { id: '2', name: 'Схема планировочной организации', code: 'ПЗУ', department: 'ГП' },
    { id: '3', name: 'Архитектурные решения', code: 'АР', department: 'АР' },
    { id: '4', name: 'Конструктивные решения', code: 'КР', department: 'КР' },
    { id: '5', name: 'Система электроснабжения', code: 'ИОС1', department: 'ЭС' },
  ]);
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<AlbumTemplate | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    department: '' as AlbumTemplate['department'] | '',
  });

  const handleOpenDialog = (template?: AlbumTemplate) => {
    if (template) {
      setEditingTemplate(template);
      setFormData({
        name: template.name,
        code: template.code,
        department: template.department,
      });
    } else {
      setEditingTemplate(null);
      setFormData({ name: '', code: '', department: '' });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingTemplate(null);
    setFormData({ name: '', code: '', department: '' });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.code || !formData.department) {
      return;
    }

    if (editingTemplate) {
      // Редактирование
      setTemplates(templates.map(t => 
        t.id === editingTemplate.id 
          ? { ...t, name: formData.name, code: formData.code, department: formData.department as AlbumTemplate['department'] }
          : t
      ));
    } else {
      // Создание
      const newTemplate: AlbumTemplate = {
        id: Date.now().toString(),
        name: formData.name,
        code: formData.code,
        department: formData.department as AlbumTemplate['department'],
      };
      setTemplates([...templates, newTemplate]);
    }
    
    handleCloseDialog();
  };

  const handleDelete = (id: string) => {
    if (confirm('Вы уверены, что хотите удалить этот шаблон?')) {
      setTemplates(templates.filter(t => t.id !== id));
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-6">
      {/* Заголовок */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 md:p-8 text-white">
        <div className="flex items-center gap-3 mb-2">
          <FolderTree className="w-8 h-8" />
          <h1>Шаблоны альбомов</h1>
        </div>
        <p className="text-blue-100">
          Создавайте и управляйте шаблонами альбомов для быстрого добавления в проекты
        </p>
      </div>

      {/* Кнопка создания */}
      <div className="flex justify-between items-center">
        <div>
          <p className="text-gray-600">
            Всего шаблонов: <span className="font-medium text-gray-900">{templates.length}</span>
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="w-4 h-4 mr-2" />
              Создать шаблон
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingTemplate ? 'Редактировать шаблон' : 'Создать шаблон'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Наименование альбома</Label>
                <Input
                  id="name"
                  placeholder="Например: Архитектурные решения"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="code">Шифр</Label>
                <Input
                  id="code"
                  placeholder="Например: АР"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="department">Отдел</Label>
                <Select
                  value={formData.department}
                  onValueChange={(value) => setFormData({ ...formData, department: value as AlbumTemplate['department'] })}
                  required
                >
                  <SelectTrigger id="department">
                    <SelectValue placeholder="Выберите отдел" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((dept) => (
                      <SelectItem key={dept.value} value={dept.value}>
                        {dept.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2 pt-4">
                <Button type="submit" className="flex-1">
                  {editingTemplate ? 'Сохранить' : 'Создать'}
                </Button>
                <Button type="button" variant="outline" onClick={handleCloseDialog} className="flex-1">
                  Отмена
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Таблица шаблонов */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-gray-600">Наименование</th>
                <th className="px-6 py-3 text-left text-gray-600">Шифр</th>
                <th className="px-6 py-3 text-left text-gray-600">Отдел</th>
                <th className="px-6 py-3 text-right text-gray-600">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {templates.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                    <FolderTree className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>Нет шаблонов альбомов</p>
                    <p className="text-sm mt-1">Создайте первый шаблон для начала работы</p>
                  </td>
                </tr>
              ) : (
                templates.map((template) => (
                  <tr key={template.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <FolderTree className="w-4 h-4 text-gray-400" />
                        <span>{template.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded bg-blue-100 text-blue-800 text-sm font-medium">
                        {template.code}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded bg-purple-100 text-purple-800 text-sm font-medium">
                        {template.department}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenDialog(template)}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(template.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
