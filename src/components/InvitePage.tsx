import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Alert, AlertDescription } from './ui/alert';
import { Building2, Users, AlertCircle, Loader2 } from 'lucide-react';
import { TelegramLoginButton } from './TelegramLoginButton';

// API Base URL
const API_BASE_URL = import.meta.env.VITE_API_URL || '';

interface InvitationInfo {
  companyName: string;
  role: 'admin' | 'member';
  isValid: boolean;
  expiresAt?: string;
}

export function InvitePage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [invitationInfo, setInvitationInfo] = useState<InvitationInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) {
      setError('Неверная ссылка приглашения');
      setIsLoading(false);
      return;
    }

    // Проверяем валидность токена
    checkInvitationToken(token);
  }, [token]);

  const checkInvitationToken = async (inviteToken: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/companies/invitations/${inviteToken}/info`, {
        headers: {
          'ngrok-skip-browser-warning': 'true'
        }
      });

      if (!response.ok) {
        throw new Error('Invitation not found or expired');
      }

      const data = await response.json();
      setInvitationInfo(data);
      
      // Сохраняем токен в sessionStorage для использования после авторизации
      sessionStorage.setItem('inviteToken', inviteToken);
      
    } catch (err) {
      console.error('❌ Ошибка проверки приглашения:', err);
      setError('Приглашение недействительно или истекло');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTelegramAuth = (user: any) => {
    console.log('🔐 Telegram авторизация получена:', user);
    console.log('🎟️ Токен приглашения:', token);
    
    // Токен уже сохранен в sessionStorage в checkInvitationToken
    // Просто логируем, что авторизация началась
    // TelegramAuthCallback обработает остальное
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-cyan-50">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin text-blue-500" />
            <p className="text-gray-600">Проверка приглашения...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !invitationInfo?.isValid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-cyan-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="w-6 h-6" />
              Приглашение недействительно
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {error || 'Это приглашение истекло или было отозвано'}
              </AlertDescription>
            </Alert>
            <Button 
              className="w-full" 
              onClick={() => navigate('/')}
            >
              Вернуться на главную
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getRoleName = (role: 'admin' | 'member') => {
    return role === 'admin' ? 'Администратор' : 'Участник';
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-cyan-50 p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto mb-4 flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full">
            <Building2 className="w-8 h-8 text-blue-600" />
          </div>
          <CardTitle className="text-2xl">Вы приглашены!</CardTitle>
          <CardDescription className="text-base">
            Присоединитесь к компании
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg p-4 space-y-3">
            <div className="flex items-start gap-3">
              <Building2 className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <p className="text-sm text-gray-600">Компания</p>
                <p className="font-semibold text-lg">{invitationInfo.companyName}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Users className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <p className="text-sm text-gray-600">Ваша роль</p>
                <p className="font-semibold">{getRoleName(invitationInfo.role)}</p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-sm text-center text-gray-600">
              Войдите через Telegram, чтобы присоединиться
            </p>
            <div className="flex justify-center">
              <TelegramLoginButton
                botName="klamonline_bot"
                buttonSize="large"
                cornerRadius={12}
                requestAccess={false}
                usePic={false}
                dataOnauth={handleTelegramAuth}
                dataAuthUrl={`${window.location.origin}/auth/telegram/callback`}
              />
            </div>
          </div>

          {invitationInfo.expiresAt && (
            <p className="text-xs text-center text-gray-500">
              Приглашение действительно до{' '}
              {new Date(invitationInfo.expiresAt).toLocaleDateString('ru-RU', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
              })}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
