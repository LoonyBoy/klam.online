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

// API функции (заглушки для будущей реализации)

export const companyApi = {
  // Получить приглашения пользователя
  async getInvitations(params: { email?: string; telegramUsername?: string }): Promise<Invitation[]> {
    // TODO: Реализовать реальный API запрос
    console.log('Fetching invitations for:', params);
    
    // Моковые данные
    return [
      {
        id: '1',
        companyId: 'company-1',
        companyName: 'ООО "Проектная компания"',
        invitedBy: 'user-123',
        invitedByName: 'Иван Петров',
        invitedUserEmail: params.email,
        role: 'admin',
        status: 'pending',
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: '2',
        companyId: 'company-2',
        companyName: 'ООО "Архитектурное бюро"',
        invitedBy: 'user-456',
        invitedByName: 'Мария Сидорова',
        invitedUserTelegramUsername: params.telegramUsername,
        role: 'member',
        status: 'pending',
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        expiresAt: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];
  },

  // Принять приглашение
  async acceptInvitation(invitationId: string): Promise<{ companyId: string; success: boolean }> {
    console.log('Accepting invitation:', invitationId);
    
    // TODO: Реализовать реальный API запрос
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return {
      companyId: `company-${invitationId}`,
      success: true
    };
  },

  // Отклонить приглашение
  async declineInvitation(invitationId: string): Promise<{ success: boolean }> {
    console.log('Declining invitation:', invitationId);
    
    // TODO: Реализовать реальный API запрос
    await new Promise(resolve => setTimeout(resolve, 300));
    
    return { success: true };
  },

  // Создать компанию
  async createCompany(data: { name: string; ownerId: string }): Promise<Company> {
    console.log('Creating company:', data);
    
    // TODO: Реализовать реальный API запрос
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const newCompany: Company = {
      id: `company-${Date.now()}`,
      name: data.name,
      ownerId: data.ownerId,
      createdAt: new Date().toISOString()
    };
    
    return newCompany;
  },

  // Получить компании пользователя
  async getUserCompanies(userId: string): Promise<Company[]> {
    console.log('Fetching companies for user:', userId);
    
    // TODO: Реализовать реальный API запрос
    return [];
  },

  // Получить данные компании
  async getCompany(companyId: string): Promise<Company | null> {
    console.log('Fetching company:', companyId);
    
    // TODO: Реализовать реальный API запрос
    return null;
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
