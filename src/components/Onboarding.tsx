import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Building2, Users, Calendar, UserCheck } from 'lucide-react';
import { companyApi, type Invitation } from '../lib/companyApi';

interface OnboardingProps {
  userName: string;
  userTelegramUsername?: string;
  userEmail?: string;
  onComplete: (companyId: string) => void;
}

type OnboardingStep = 'welcome' | 'invitations' | 'create-company';

export function Onboarding({ userName, userTelegramUsername, userEmail, onComplete }: OnboardingProps) {
  const [step, setStep] = useState<OnboardingStep>('welcome');
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [error, setError] = useState('');

  // Загрузка приглашений при монтировании
  useEffect(() => {
    loadInvitations();
  }, []);

  const loadInvitations = async () => {
    setIsLoading(true);
    
    try {
      // Загружаем приглашения через API
      const data = await companyApi.getInvitations({
        email: userEmail,
        telegramUsername: userTelegramUsername
      });
      
      // Фильтруем только активные приглашения
      const activeInvitations = data.filter(inv => inv.status === 'pending');
      setInvitations(activeInvitations);
    } catch (error) {
      console.error('Ошибка загрузки приглашений:', error);
      setInvitations([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleContinue = () => {
    if (invitations.length > 0) {
      setStep('invitations');
    } else {
      setStep('create-company');
    }
  };

  const handleAcceptInvitation = async (invitationId: string) => {
    setIsLoading(true);
    
    try {
      const result = await companyApi.acceptInvitation(invitationId);
      
      if (result.success) {
        // Редирект на дашборд компании
        onComplete(result.companyId);
      }
    } catch (error) {
      console.error('Ошибка принятия приглашения:', error);
      setError('Не удалось принять приглашение');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeclineInvitation = async (invitationId: string) => {
    setIsLoading(true);
    
    try {
      await companyApi.declineInvitation(invitationId);
      
      // Удаляем приглашение из списка
      setInvitations(prev => prev.filter(inv => inv.id !== invitationId));
    } catch (error) {
      console.error('Ошибка отклонения приглашения:', error);
      setError('Не удалось отклонить приглашение');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!companyName.trim()) {
      setError('Введите название компании');
      return;
    }

    setIsLoading(true);
    setError('');
    
    try {
      const newCompany = await companyApi.createCompany({
        name: companyName,
        ownerId: 'current-user-id' // TODO: получить реальный ID пользователя
      });
      
      // Редирект на дашборд новой компании
      onComplete(newCompany.id);
    } catch (error) {
      console.error('Ошибка создания компании:', error);
      setError('Не удалось создать компанию');
      setIsLoading(false);
    }
  };

  const getRoleName = (role: 'admin' | 'member') => {
    return role === 'admin' ? 'Администратор' : 'Участник';
  };

  const getDaysUntilExpiry = (expiresAt: string) => {
    const today = new Date();
    const expiry = new Date(expiresAt);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'Истекло';
    if (diffDays === 0) return 'Истекает сегодня';
    if (diffDays === 1) return 'Истекает завтра';
    return `Действительно ${diffDays} дней`;
  };

  // Экран 1.1 — Приветствие
  if (step === 'welcome') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <Card className="border-2 shadow-xl">
            <CardHeader className="text-center space-y-4 pb-8">
              <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center">
                <UserCheck className="w-8 h-8 text-white" />
              </div>
              <div>
                <CardTitle className="text-3xl font-bold">
                  Привет, {userName}!
                </CardTitle>
                <CardDescription className="text-base mt-3">
                  Сейчас настроим доступ к вашей компании.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={handleContinue} 
                className="w-full h-12 text-base"
                disabled={isLoading}
              >
                {isLoading ? 'Загрузка...' : 'Продолжить'}
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  // Экран 1.2 — Приглашения
  if (step === 'invitations') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 p-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-3xl mx-auto"
        >
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">Приглашения в компании</h1>
            <p className="text-muted-foreground">
              У вас есть активные приглашения. Выберите компанию для присоединения.
            </p>
          </div>

          <div className="space-y-4 mb-6">
            {invitations.map((invitation) => (
              <motion.div
                key={invitation.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="border-2 hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center flex-shrink-0">
                          <Building2 className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-xl font-semibold mb-2">
                            {invitation.companyName}
                          </h3>
                          <div className="space-y-1.5 text-sm text-muted-foreground">
                            <div className="flex items-center gap-2">
                              <Users className="w-4 h-4" />
                              <span>
                                Вас приглашают как:{' '}
                                <Badge variant="secondary" className="ml-1">
                                  {getRoleName(invitation.role)}
                                </Badge>
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <UserCheck className="w-4 h-4" />
                              <span>
                                Приглашение от: <strong>{invitation.invitedByName}</strong>
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4" />
                              <span>{getDaysUntilExpiry(invitation.expiresAt)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-3">
                      <Button
                        onClick={() => handleAcceptInvitation(invitation.id)}
                        disabled={isLoading}
                        className="flex-1"
                      >
                        Присоединиться
                      </Button>
                      <Button
                        onClick={() => handleDeclineInvitation(invitation.id)}
                        disabled={isLoading}
                        variant="outline"
                        className="flex-1"
                      >
                        Отклонить
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {invitations.length === 0 && (
            <Card className="border-2 border-dashed">
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground mb-4">
                  Нет активных приглашений
                </p>
              </CardContent>
            </Card>
          )}

          <div className="text-center">
            <Button
              onClick={() => setStep('create-company')}
              variant="outline"
              size="lg"
              className="w-full max-w-md"
              disabled={isLoading}
            >
              Создать свою компанию
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  // Экран 1.3 — Создание компании
  if (step === 'create-company') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <Card className="border-2 shadow-xl">
            <CardHeader className="text-center space-y-2">
              <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center mb-2">
                <Building2 className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-2xl font-bold">
                Создание компании
              </CardTitle>
              <CardDescription>
                Укажите название вашей компании для начала работы
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateCompany} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="companyName">
                    Название компании <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="companyName"
                    placeholder="ООО &quot;Название компании&quot;"
                    value={companyName}
                    onChange={(e) => {
                      setCompanyName(e.target.value);
                      setError('');
                    }}
                    disabled={isLoading}
                    className="h-12 text-base"
                    autoFocus
                  />
                  {error && (
                    <p className="text-sm text-red-500">{error}</p>
                  )}
                </div>

                <div className="space-y-3">
                  <Button 
                    type="submit" 
                    className="w-full h-12 text-base"
                    disabled={isLoading || !companyName.trim()}
                  >
                    {isLoading ? 'Создание...' : 'Создать компанию'}
                  </Button>
                  
                  {invitations.length > 0 && (
                    <Button
                      type="button"
                      variant="ghost"
                      className="w-full"
                      onClick={() => setStep('invitations')}
                      disabled={isLoading}
                    >
                      Вернуться к приглашениям
                    </Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return null;
}
