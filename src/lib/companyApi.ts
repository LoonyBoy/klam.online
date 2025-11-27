// Типы для работы с компаниями и приглашениями

// API Base URL
const API_BASE_URL = import.meta.env.VITE_API_URL || '${API_BASE_URL}';

export interface Company {
  id: string;
  name: string;
  createdAt: string;
  ownerId: string;
  settings?: {
    telegramBotToken?: string;
    driveIntegration?: boolean;
  };
}

export interface CompanyMember {
  id: string;
  userId: string;
  companyId: string;
  role: 'owner' | 'admin' | 'member';
  joinedAt: string;
  user: {
    id: string;
    name: string;
    email?: string;
    telegramUsername?: string;
    avatar?: string;
  };
}

export interface Invitation {
  id: string;
  companyId: string;
  companyName: string;
  invitedBy: string;
  invitedByName: string;
  invitedUserEmail?: string;
  invitedUserTelegramUsername?: string;
  role: 'admin' | 'member';
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  createdAt: string;
  expiresAt: string;
  acceptedAt?: string;
}

// API функции

// Вспомогательная функция для получения токена
function getAuthToken(): string | null {
  return localStorage.getItem('authToken');
}

// Вспомогательная функция для создания headers с токеном
function getAuthHeaders(): HeadersInit {
  const token = getAuthToken();
  return {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
}

export const companyApi = {
  // Получить приглашения пользователя
  async getInvitations(params: { email?: string; telegramUsername?: string }): Promise<Invitation[]> {
    console.log('📤 Fetching invitations for:', params);
    
    const queryParams = new URLSearchParams();
    if (params.email) queryParams.append('email', params.email);
    if (params.telegramUsername) queryParams.append('telegramUsername', params.telegramUsername);
    
    const response = await fetch(`/api/companies/invitations?${queryParams}`, {
      method: 'GET',
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      console.error('❌ Failed to fetch invitations:', response.status);
      return [];
    }

    const data = await response.json();
    console.log('✅ Invitations received:', data);
    return data;
  },

  // Принять приглашение
  async acceptInvitation(invitationId: string): Promise<{ companyId: string; success: boolean }> {
    console.log('📤 Accepting invitation:', invitationId);
    
    const response = await fetch(`/api/companies/invitations/${invitationId}/accept`, {
      method: 'POST',
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error('Failed to accept invitation');
    }

    const data = await response.json();
    console.log('✅ Invitation accepted:', data);
    return data;
  },

  // Отклонить приглашение
  async declineInvitation(invitationId: string): Promise<{ success: boolean }> {
    console.log('📤 Declining invitation:', invitationId);
    
    const response = await fetch(`/api/companies/invitations/${invitationId}/decline`, {
      method: 'POST',
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error('Failed to decline invitation');
    }

    const data = await response.json();
    console.log('✅ Invitation declined');
    return data;
  },

  // Создать компанию
  async createCompany(data: { name: string; description?: string }): Promise<{ success: boolean; companyId: string; company: Company }> {
    console.log('📤 Creating company:', data);
    
    const response = await fetch('/api/companies', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error('Failed to create company');
    }

    const result = await response.json();
    console.log('✅ Company created:', result);
    return result;
  },

  // Получить данные компании
  async getCompany(companyId: string): Promise<any> {
    console.log('📤 Fetching company:', companyId);
    
    const response = await fetch(`/api/companies/${companyId}`, {
      method: 'GET',
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error('Failed to fetch company');
    }

    const data = await response.json();
    console.log('✅ Company data received:', data);
    return data;
  },

  // Получить проекты компании
  async getCompanyProjects(companyId: string): Promise<any> {
    console.log('📤 Fetching company projects:', companyId);
    
    const response = await fetch(`/api/companies/${companyId}/projects`, {
      method: 'GET',
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error('Failed to fetch projects');
    }

    const data = await response.json();
    console.log('✅ Projects received:', data);
    return data;
  },

  // Получить детальную информацию о проекте
  async getProjectDetails(companyId: string, projectId: string): Promise<any> {
    console.log('📤 Fetching project details:', { companyId, projectId });
    
    const response = await fetch(`/api/companies/${companyId}/projects/${projectId}`, {
      method: 'GET',
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error('Failed to fetch project details');
    }

    const data = await response.json();
    console.log('✅ Project details received:', data);
    return data;
  },

  // Обновить статус проекта
  async updateProjectStatus(companyId: string, projectId: string, status: 'active' | 'pause' | 'archive'): Promise<any> {
    console.log('📤 Updating project status:', { companyId, projectId, status });
    
    const response = await fetch(`/api/companies/${companyId}/projects/${projectId}/status`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status })
    });

    if (!response.ok) {
      throw new Error('Failed to update project status');
    }

    const data = await response.json();
    console.log('✅ Project status updated:', data);
    return data;
  },

  // Получить шаблоны альбомов компании
  async getAlbumTemplates(companyId: string): Promise<any> {
    console.log('📤 Fetching album templates for company:', companyId);
    
    const response = await fetch(`/api/companies/${companyId}/album-templates`, {
      method: 'GET',
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error('Failed to fetch album templates');
    }

    const data = await response.json();
    console.log('✅ Album templates received:', data);
    return data;
  },

  // Получить альбомы проекта
  async getProjectAlbums(companyId: string, projectId: string, category?: 'СВОК ПД' | 'СВОК РД'): Promise<any> {
    console.log('📤 Fetching project albums:', { companyId, projectId, category });
    
    const url = category 
      ? `/api/companies/${companyId}/projects/${projectId}/albums?category=${encodeURIComponent(category)}`
      : `/api/companies/${companyId}/projects/${projectId}/albums`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error('Failed to fetch project albums');
    }

    const data = await response.json();
    console.log('✅ Project albums received:', data);
    return data;
  },

  // Создать альбом в проекте
  async createAlbum(companyId: string, projectId: string, albumData: {
    name: string;
    code: string;
    category?: 'СВОК ПД' | 'СВОК РД';
    departmentId: number;
    executorId?: number;
    customerId?: number;
    deadline?: string;
    comment?: string;
    link?: string;
  }): Promise<any> {
    console.log('📤 Creating album:', { companyId, projectId, albumData });
    
    const response = await fetch(`/api/companies/${companyId}/projects/${projectId}/albums`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(albumData)
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || 'Failed to create album');
    }

    const data = await response.json();
    console.log('✅ Album created:', data);
    return data;
  },

  // Получить историю событий альбома
  async getAlbumEvents(companyId: string, projectId: string, albumId: string): Promise<{ success: boolean; events: any[] }> {
    const response = await fetch(
      `/api/companies/${companyId}/projects/${projectId}/albums/${albumId}/events`,
      {
        method: 'GET',
        headers: getAuthHeaders(),
      }
    );
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || 'Failed to fetch album events');
    }
    
    return response.json();
  },

  // Обновить альбом
  async updateAlbum(companyId: string, projectId: string, albumId: string, albumData: {
    name?: string;
    code?: string;
    departmentId?: number;
    executorId?: number;
    customerId?: number;
    deadline?: string;
    comment?: string;
    link?: string;
  }): Promise<any> {
    console.log('📤 Updating album:', { companyId, projectId, albumId, albumData });
    
    const response = await fetch(`/api/companies/${companyId}/projects/${projectId}/albums/${albumId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(albumData)
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || 'Failed to update album');
    }

    const data = await response.json();
    console.log('✅ Album updated:', data);
    return data;
  },

  // Получить статистику по альбомам компании
  async getAlbumsStatistics(companyId: string): Promise<{ activeRemarks: number }> {
    console.log('📤 Fetching albums statistics:', companyId);
    
    const response = await fetch(`/api/companies/${companyId}/albums/statistics`, {
      method: 'GET',
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error('Failed to fetch albums statistics');
    }

    const data = await response.json();
    console.log('✅ Albums statistics received:', data);
    return data;
  },

  // Получить список альбомов с ближайшими дедлайнами
  async getUpcomingDeadlines(companyId: string, limit: number = 10): Promise<any[]> {
    console.log('📤 Fetching upcoming deadlines:', companyId);
    
    const response = await fetch(`/api/companies/${companyId}/albums/deadlines?limit=${limit}`, {
      method: 'GET',
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error('Failed to fetch deadlines');
    }

    const data = await response.json();
    console.log('✅ Deadlines received:', data);
    return data;
  },

  // Получить последние события по альбомам
  async getRecentEvents(companyId: string, limit: number = 10): Promise<any[]> {
    console.log('📤 Fetching recent events:', companyId);
    
    const response = await fetch(`/api/companies/${companyId}/albums/events?limit=${limit}`, {
      method: 'GET',
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error('Failed to fetch events');
    }

    const data = await response.json();
    console.log('✅ Events received:', data);
    return data;
  },

  // Получить шаблоны альбомов компании
  async getCompanyTemplates(companyId: string): Promise<any> {
    console.log('📤 Fetching company templates:', companyId);
    
    const response = await fetch(`/api/companies/${companyId}/templates`, {
      method: 'GET',
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error('Failed to fetch templates');
    }

    const data = await response.json();
    console.log('✅ Templates received:', data);
    return data;
  },

  // Создать шаблон альбомов
  async createTemplate(companyId: string, templateData: { name: string; items: any[] }): Promise<any> {
    console.log('📤 Creating template:', templateData);
    
    const response = await fetch(`/api/companies/${companyId}/templates`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(templateData)
    });

    if (!response.ok) {
      throw new Error('Failed to create template');
    }

    const data = await response.json();
    console.log('✅ Template created:', data);
    return data;
  },

  // Обновить шаблон альбомов
  async updateTemplate(companyId: string, templateId: string, templateData: { name: string; items: any[] }): Promise<any> {
    console.log('📤 Updating template:', templateId, templateData);
    
    const response = await fetch(`/api/companies/${companyId}/templates/${templateId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(templateData)
    });

    if (!response.ok) {
      throw new Error('Failed to update template');
    }

    const data = await response.json();
    console.log('✅ Template updated:', data);
    return data;
  },

  // Удалить шаблон альбомов
  async deleteTemplate(companyId: string, templateId: string): Promise<any> {
    console.log('📤 Deleting template:', templateId);
    
    const response = await fetch(`/api/companies/${companyId}/templates/${templateId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error('Failed to delete template');
    }

    const data = await response.json();
    console.log('✅ Template deleted');
    return data;
  },

  // Получить компании пользователя
  async getUserCompanies(userId: string): Promise<Company[]> {
    console.log('Fetching companies for user:', userId);
    
    // TODO: Реализовать реальный API запрос
    return [];
  },

  // Получить список отделов
  async getDepartments(): Promise<any> {
    console.log('📤 Fetching departments');
    
    const response = await fetch('/api/dictionaries/departments', {
      method: 'GET',
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error('Failed to fetch departments');
    }

    const data = await response.json();
    console.log('✅ Departments received:', data);
    return data;
  },

  // Пригласить пользователя в компанию
  async inviteUser(data: {
    companyId: string;
    email?: string;
    telegramUsername?: string;
    role: 'admin' | 'member';
    invitedBy: string;
  }): Promise<Invitation> {
    console.log('Inviting user:', data);
    
    // TODO: Реализовать реальный API запрос
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const invitation: Invitation = {
      id: `inv-${Date.now()}`,
      companyId: data.companyId,
      companyName: 'Название компании', // Нужно получить из компании
      invitedBy: data.invitedBy,
      invitedByName: 'Имя пригласившего', // Нужно получить из пользователя
      invitedUserEmail: data.email,
      invitedUserTelegramUsername: data.telegramUsername,
      role: data.role,
      status: 'pending',
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
    };
    
    return invitation;
  },

  // Сгенерировать ссылку-приглашение
  async generateInviteLink(data: {
    companyId: string;
    role: 'admin' | 'member';
  }): Promise<{ inviteLink: string; token: string }> {
    console.log('🔗 Generating invite link:', data);
    
    const response = await fetch(`/api/companies/${data.companyId}/invitations/generate-link`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ role: data.role })
    });

    if (!response.ok) {
      throw new Error('Failed to generate invite link');
    }

    const result = await response.json();
    console.log('✅ Invite link generated:', result);
    return result;
  },

  // Получить участников компании
  async getCompanyMembers(companyId: string): Promise<CompanyMember[]> {
    console.log('Fetching members for company:', companyId);
    
    // TODO: Реализовать реальный API запрос
    return [];
  },

  // Получить список участников компании (participants)
  async getCompanyParticipants(companyId: string): Promise<any> {
    console.log('📤 Fetching participants for company:', companyId);
    
    const response = await fetch(`${API_BASE_URL}/api/companies/${companyId}/participants`, {
      method: 'GET',
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      console.error('❌ Server error:', error);
      throw new Error(error.error || 'Failed to fetch participants');
    }

    const data = await response.json();
    console.log('✅ Participants received:', data);
    return data;
  },

  // Удалить участника из компании и всех проектов
  async deleteParticipant(companyId: string, participantId: string) {
    console.log('🗑️ Deleting participant:', participantId);
    
    const response = await fetch(`${API_BASE_URL}/api/companies/${companyId}/participants/${participantId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      console.error('❌ Server error:', error);
      throw new Error(error.error || 'Failed to delete participant');
    }
    
    return response.json();
  },

  // Удалить проект
  async deleteProject(companyId: string, projectId: string) {
    console.log('🗑️ Deleting project:', projectId);
    
    const response = await fetch(`${API_BASE_URL}/api/companies/${companyId}/projects/${projectId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      console.error('❌ Server error:', error);
      throw new Error(error.details || error.error || 'Failed to delete project');
    }
    
    return response.json();
  },

  // Удалить альбом
  async deleteAlbum(companyId: string, projectId: string, albumId: string) {
    console.log('🗑️ Deleting album:', albumId);
    
    const response = await fetch(`${API_BASE_URL}/api/companies/${companyId}/projects/${projectId}/albums/${albumId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      console.error('❌ Server error:', error);
      throw new Error(error.details || error.error || 'Failed to delete album');
    }
    
    return response.json();
  }
};

/**
 * Получить список пользователей компании
 */
export async function getCompanyUsers(companyId: string) {
  const response = await fetch(`${API_BASE_URL}/api/companies/${companyId}/users`, {
    headers: getAuthHeaders()
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch company users');
  }
  
  return response.json();
}

/**
 * Получить статистику по пользователям компании
 */
export async function getCompanyUsersStats(companyId: string) {
  const response = await fetch(`${API_BASE_URL}/api/companies/${companyId}/users/stats`, {
    headers: getAuthHeaders()
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch company users stats');
  }
  
  return response.json();
}

/**
 * Добавить участника в компанию
 */
export async function addParticipant(companyId: string, data: {
  firstName: string;
  lastName: string;
  telegramUsername?: string;
  email?: string;
  roleType: 'executor' | 'customer';
  departmentId?: number;
}) {
  console.log('📤 Adding participant:', data);
  
  const response = await fetch(`${API_BASE_URL}/api/companies/${companyId}/participants`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data)
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    console.error('❌ Server error:', error);
    throw new Error(error.error || 'Failed to add participant');
  }
  
  return response.json();
}

/**
 * Получить список отделов
 */
export async function getDepartments(): Promise<any> {
  return companyApi.getDepartments();
}

/**
 * Получить проекты компании
 */
export async function getCompanyProjects(companyId: string): Promise<any> {
  return companyApi.getCompanyProjects(companyId);
}

/**
 * Получить отфильтрованные события для отчётов
 */
export async function getFilteredEvents(companyId: string, filters?: {
  dateFrom?: string;
  dateTo?: string;
  projectId?: string;
  statusId?: string;
  userId?: string;
}): Promise<any> {
  const params = new URLSearchParams();
  if (filters?.dateFrom) params.append('dateFrom', filters.dateFrom);
  if (filters?.dateTo) params.append('dateTo', filters.dateTo);
  if (filters?.projectId) params.append('projectId', filters.projectId);
  if (filters?.statusId) params.append('statusId', filters.statusId);
  if (filters?.userId) params.append('userId', filters.userId);

  const response = await fetch(`${API_BASE_URL}/api/companies/${companyId}/reports/events?${params}`, {
    headers: getAuthHeaders()
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch filtered events');
  }
  
  return response.json();
}

/**
 * Обновить участника компании
 */
export async function updateParticipant(companyId: string, participantId: string, data: {
  firstName: string;
  lastName: string;
  telegramUsername?: string;
  email?: string;
  roleType?: 'executor' | 'customer';
  departmentId?: number;
}) {
  console.log('📝 Updating participant:', participantId, data);
  
  const response = await fetch(`${API_BASE_URL}/api/companies/${companyId}/participants/${participantId}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(data)
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    console.error('❌ Server error:', error);
    throw new Error(error.error || 'Failed to update participant');
  }
  
  return response.json();
}

// Get user profile
export async function getUserProfile(companyId: string): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/api/companies/${companyId}/settings/profile`, {
    headers: getAuthHeaders()
  });
  
  if (!response.ok) {
    throw new Error('Failed to get user profile');
  }
  
  return response.json();
}

// Update user profile
export async function updateUserProfile(companyId: string, data: { first_name: string; last_name: string; email: string }): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/api/companies/${companyId}/settings/profile`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(data)
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || 'Failed to update profile');
  }
  
  return response.json();
}

// Get company settings
export async function getCompanySettings(companyId: string): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/api/companies/${companyId}/settings`, {
    headers: getAuthHeaders()
  });
  
  if (!response.ok) {
    throw new Error('Failed to get company settings');
  }
  
  return response.json();
}

// Update company settings (only owner)
export async function updateCompanySettings(companyId: string, data: {
  name: string;
  email: string;
  address: string;
}): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/api/companies/${companyId}/settings`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(data)
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || 'Failed to update company settings');
  }
  
  return response.json();
}

// Create new project
export async function createProject(companyId: string, projectData: {
  projectName: string;
  projectCode: string;
  clientCompany: string;
  departments: Array<{
    id: string;
    name: string;
    code: string;
  }>;
  users: Array<{
    id: string;
    name: string;
    telegramUsername: string;
    email: string;
    departmentCode: string;
    role: 'executor' | 'customer';
  }>;
  channelUrl: string;
}): Promise<any> {
  console.log('🚀 Отправка запроса на создание проекта:', projectData);
  
  const response = await fetch(`${API_BASE_URL}/api/companies/${companyId}/projects`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(projectData)
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    console.error('❌ Ошибка от сервера:', error);
    throw new Error(error.details || error.error || 'Failed to create project');
  }
  
  return response.json();
}

// Check Telegram channel
export async function checkTelegramChannel(channelUrl: string): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/api/telegram/check-channel`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ channelUrl })
  });
  
  console.log('Response status:', response.status);
  
  // Для 403 (Forbidden) проверяем, есть ли флаг needsAdmin
  if (response.status === 403) {
    const data = await response.json().catch(() => ({ error: 'Unknown error' }));
    console.log('403 data:', data);
    // Возвращаем данные с флагом needsAdmin для специальной обработки
    return data;
  }
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || 'Failed to check telegram channel');
  }
  
  return response.json();
}

// Create participant
export async function createParticipant(companyId: string, participantData: {
  firstName: string;
  lastName?: string;
  telegramUsername?: string;
  email: string;
  roleType: 'executor' | 'customer';
  departmentCode: string; // Код отдела вместо ID
}): Promise<{ success: boolean; participantId: number }> {
  const response = await fetch(`${API_BASE_URL}/api/companies/${companyId}/participants`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(participantData)
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || 'Failed to create participant');
  }
  
  return response.json();
}
