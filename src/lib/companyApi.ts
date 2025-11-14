// Типы для работы с компаниями и приглашениями

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

  // Получить участников компании
  async getCompanyMembers(companyId: string): Promise<CompanyMember[]> {
    console.log('Fetching members for company:', companyId);
    
    // TODO: Реализовать реальный API запрос
    return [];
  }
};

/**
 * Получить список пользователей компании
 */
export async function getCompanyUsers(companyId: string) {
  const response = await fetch(`http://localhost:3001/api/companies/${companyId}/users`, {
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
  const response = await fetch(`http://localhost:3001/api/companies/${companyId}/users/stats`, {
    headers: getAuthHeaders()
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch company users stats');
  }
  
  return response.json();
}

