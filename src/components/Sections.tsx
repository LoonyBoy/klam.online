import { useState, useEffect } from 'react';
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
import { companyApi } from '../lib/companyApi';

interface AlbumTemplate {
  id: string;
  name: string;
  createdAt: string;
  createdBy: {
    firstName: string;
    lastName: string | null;
  } | null;
  itemsCount: number;
  items: Array<{
    id: string;
    name: string;
    code: string;
    defaultDeadlineDays: number | null;
    department: {
      id: string;
      code: string;
      name: string;
    };
    defaultStatus: {
      id: string;
      code: string;
      name: string;
    } | null;
  }>;
}

export function Sections() {
  const [templates, setTemplates] = useState<AlbumTemplate[]>([]);
  const [departments, setDepartments] = useState<Array<{id: number; code: string; name: string}>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<AlbumTemplate | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    department: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      await Promise.all([loadTemplates(), loadDepartments()]);
    } catch (error) {
      console.error('❌ Failed to load data:', error);
    }
  };

  const loadDepartments = async () => {
    try {
      const response = await companyApi.getDepartments();
      setDepartments(response.departments || []);
    } catch (error) {
      console.error('❌ Failed to load departments:', error);
    }
  };

  const loadTemplates = async () => {
    try {
      const companyId = localStorage.getItem('companyId');
      if (!companyId) {
        console.error('❌ No company ID found');
        setIsLoading(false);
        return;
      }

      const response = await companyApi.getCompanyTemplates(companyId);
      setTemplates(response.templates || []);
    } catch (error) {
      console.error('❌ Failed to load templates:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenDialog = (template?: AlbumTemplate) => {
    if (template) {
      setEditingTemplate(template);
      // Для редактирования показываем информацию о первом элементе
      const firstItem = template.items[0];
      setFormData({
        name: template.name,
        code: firstItem?.code || '',
        department: firstItem?.department.code || '',
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.code || !formData.department) {
      return;
    }

    try {
      const companyId = localStorage.getItem('companyId');
      if (!companyId) {
        console.error('❌ No company ID found');
        return;
      }

      if (editingTemplate) {
        // Редактирование существующего шаблона
        const department = departments.find(d => d.code === formData.department);
        if (!department) {
          alert('Пожалуйста, выберите отдел');
          return;
        }

        const templateData = {
          name: formData.name,
          items: [
            {
              name: formData.name,
              code: formData.code,
              departmentId: department.id,
              defaultStatusId: null,
              defaultDeadlineDays: null,
            },
          ],
        };

        await companyApi.updateTemplate(companyId, editingTemplate.id, templateData);
        await loadTemplates();
      } else {
        // Создание нового шаблона с одним элементом
        const department = departments.find(d => d.code === formData.department);
        if (!department) {
          alert('Пожалуйста, выберите отдел');
          return;
        }

        const templateData = {
          name: formData.name,
          items: [
            {
              name: formData.name,
              code: formData.code,
              departmentId: department.id,
              defaultStatusId: null,
              defaultDeadlineDays: null,
            },
          ],
        };

        await companyApi.createTemplate(companyId, templateData);
        await loadTemplates(); // Перезагружаем список
      }
      
      handleCloseDialog();
    } catch (error) {
      console.error('❌ Failed to save template:', error);
      alert('Ошибка при сохранении шаблона');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Вы уверены, что хотите удалить этот шаблон?')) {
      return;
    }

    try {
      const companyId = localStorage.getItem('companyId');
      if (!companyId) {
        console.error('❌ No company ID found');
        return;
      }

      await companyApi.deleteTemplate(companyId, id);
      await loadTemplates(); // Перезагружаем список
    } catch (error) {
      console.error('❌ Failed to delete template:', error);
      alert('Ошибка при удалении шаблона');
    }
  };

  if (isLoading) {
    return (
      <div className="p-4 md:p-8 flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Загрузка шаблонов...</p>
        </div>
      </div>
    );
  }

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
                  onValueChange={(value) => setFormData({ ...formData, department: value })}
                >
                  <SelectTrigger id="department">
                    <SelectValue placeholder="Выберите отдел" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((dept) => (
                      <SelectItem key={dept.id} value={dept.code}>
                        {dept.code} - {dept.name}
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
                templates.map((template) => {
                  // Берем первый элемент для отображения в таблице
                  const firstItem = template.items[0];
                  
                  return (
                    <tr key={template.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <FolderTree className="w-4 h-4 text-gray-400" />
                          <div>
                            <div>{template.name}</div>
                            {template.itemsCount > 1 && (
                              <div className="text-xs text-gray-500 mt-0.5">
                                {template.itemsCount} элементов
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {firstItem && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded bg-blue-100 text-blue-800 text-sm font-medium">
                            {firstItem.code}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {firstItem && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded bg-purple-100 text-purple-800 text-sm font-medium">
                            {firstItem.department.code}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenDialog(template)}
                            title="Просмотр и редактирование шаблона"
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
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
