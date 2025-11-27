import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// API Base URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export function TelegramAuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    console.log('🔍 TelegramAuthCallback: Обработка параметров...');
    
    // Получаем параметры из URL
    const params = new URLSearchParams(window.location.search);
    const hash = params.get('hash');
    
    if (!hash) {
      console.error('❌ Нет параметра hash в URL');
      alert('Ошибка авторизации: нет hash параметра');
      navigate('/');
      return;
    }

    // Собираем данные пользователя из URL параметров
    const userData = {
      id: parseInt(params.get('id') || '0'),
      first_name: params.get('first_name') || '',
      last_name: params.get('last_name') || undefined,
      username: params.get('username') || undefined,
      photo_url: params.get('photo_url') || undefined,
      auth_date: parseInt(params.get('auth_date') || '0'),
      hash: hash
    };

    console.log('📦 Данные от Telegram:', userData);

    // Отправляем на backend
    handleAuth(userData);
  }, [navigate]);

  const handleAuth = async (user: any) => {
    try {
      console.log('📤 Отправка данных на backend...');
      
      // Проверяем, есть ли токен приглашения в sessionStorage
      const inviteToken = sessionStorage.getItem('inviteToken');
      if (inviteToken) {
        console.log('🎟️ Найден токен приглашения:', inviteToken);
      }
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      // Передаем inviteToken в заголовке, чтобы не ломать хеш Telegram
      if (inviteToken) {
        headers['X-Invite-Token'] = inviteToken;
      }
      
      const response = await fetch(`${API_BASE_URL}/api/auth/telegram`, {
        method: 'POST',
        headers,
        body: JSON.stringify(user)
      });

      console.log('📡 Ответ получен:', {
        status: response.status,
        ok: response.ok
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Ошибка ответа:', errorText);
        throw new Error('Authentication failed');
      }

      const data = await response.json();
      console.log('✅ Авторизация успешна:', data);
      
      // Если использовали токен приглашения, удаляем его
      if (inviteToken) {
        sessionStorage.removeItem('inviteToken');
        console.log('🗑️ Токен приглашения удален из sessionStorage');
      }
      
      // Сохраняем токен и данные пользователя
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('user', JSON.stringify({
        id: data.user.id,
        telegramId: data.user.telegramId,
        firstName: data.user.firstName,
        lastName: data.user.lastName,
        username: data.user.username,
        photoUrl: data.user.photoUrl,
      }));

      // Перенаправляем на главную страницу
      console.log('🔄 Перенаправление...');
      window.location.href = '/';
      
    } catch (error) {
      console.error('❌ Ошибка авторизации:', error);
      alert('Ошибка при входе. Попробуйте снова.');
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-cyan-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p className="text-gray-600">Авторизация через Telegram...</p>
      </div>
    </div>
  );
}
