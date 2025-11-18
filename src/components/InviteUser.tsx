import { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Alert, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Mail, Send, Users as UsersIcon, CheckCircle2, XCircle, Clock, Link2, Copy, Check } from 'lucide-react';
import { companyApi, type Invitation } from '../lib/companyApi';

interface InviteUserProps {
  companyId: string;
  companyName: string;
  currentUserId: string;
  onInviteSent?: (invitation: Invitation) => void;
}

export function InviteUser({ companyId, companyName, currentUserId, onInviteSent }: InviteUserProps) {
  const [email, setEmail] = useState('');
  const [telegramUsername, setTelegramUsername] = useState('');
  const [role, setRole] = useState<'admin' | 'member'>('member');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Для генерации ссылки
  const [inviteLinkRole, setInviteLinkRole] = useState<'admin' | 'member'>('member');
  const [generatedLink, setGeneratedLink] = useState('');
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!email && !telegramUsername) {
      setError('Укажите email или Telegram username');
      return;
    }

    setIsLoading(true);

    try {
      const invitation = await companyApi.inviteUser({
        companyId,
        email: email || undefined,
        telegramUsername: telegramUsername || undefined,
        role,
        invitedBy: currentUserId
      });

      setSuccess('Приглашение успешно отправлено!');
      setEmail('');
      setTelegramUsername('');
      setRole('member');
      
      if (onInviteSent) {
        onInviteSent(invitation);
      }
    } catch (err) {
      setError('Не удалось отправить приглашение');
      console.error('Ошибка отправки приглашения:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateLink = async () => {
    setError('');
    setGeneratedLink('');
    setIsGeneratingLink(true);

    try {
      const result = await companyApi.generateInviteLink({
        companyId,
        role: inviteLinkRole
      });

      setGeneratedLink(result.inviteLink);
      setSuccess('Ссылка успешно создана!');
    } catch (err) {
      setError('Не удалось создать ссылку-приглашение');
      console.error('Ошибка генерации ссылки:', err);
    } finally {
      setIsGeneratingLink(false);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(generatedLink);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch (err) {
      console.error('Ошибка копирования:', err);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="w-5 h-5" />
          Пригласить пользователя
        </CardTitle>
        <CardDescription>
          Отправьте приглашение в компанию «{companyName}»
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="email" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="email">
              <Mail className="w-4 h-4 mr-2" />
              Email / Telegram
            </TabsTrigger>
            <TabsTrigger value="link">
              <Link2 className="w-4 h-4 mr-2" />
              Ссылка-приглашение
            </TabsTrigger>
          </TabsList>

          <TabsContent value="email">
            <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="user@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className="flex items-center gap-2">
            <div className="flex-1 border-t" />
            <span className="text-sm text-muted-foreground">или</span>
            <div className="flex-1 border-t" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="telegram">Telegram Username</Label>
            <Input
              id="telegram"
              placeholder="@username"
              value={telegramUsername}
              onChange={(e) => setTelegramUsername(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Роль</Label>
            <Select value={role} onValueChange={(value: string) => setRole(value as 'admin' | 'member')}>
              <SelectTrigger id="role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="member">
                  <div className="flex items-center gap-2">
                    <UsersIcon className="w-4 h-4" />
                    <span>Участник</span>
                  </div>
                </SelectItem>
                <SelectItem value="admin">
                  <div className="flex items-center gap-2">
                    <UsersIcon className="w-4 h-4" />
                    <span>Администратор</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {role === 'admin' 
                ? 'Администраторы могут управлять проектами и приглашать пользователей' 
                : 'Участники могут работать с проектами и альбомами'}
            </p>
          </div>

          {error && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="border-green-500 text-green-700">
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          <Button type="submit" className="w-full" disabled={isLoading}>
            <Send className="w-4 h-4 mr-2" />
            {isLoading ? 'Отправка...' : 'Отправить приглашение'}
          </Button>
        </form>
          </TabsContent>

          <TabsContent value="link" className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="link-role">Роль для приглашенных</Label>
                <Select 
                  value={inviteLinkRole} 
                  onValueChange={(value: string) => setInviteLinkRole(value as 'admin' | 'member')}
                >
                  <SelectTrigger id="link-role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="member">
                      <div className="flex items-center gap-2">
                        <UsersIcon className="w-4 h-4" />
                        <span>Участник</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="admin">
                      <div className="flex items-center gap-2">
                        <UsersIcon className="w-4 h-4" />
                        <span>Администратор</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {inviteLinkRole === 'admin' 
                    ? 'Администраторы могут управлять проектами и приглашать пользователей' 
                    : 'Участники могут работать с проектами и альбомами'}
                </p>
              </div>

              <Button 
                type="button" 
                className="w-full" 
                onClick={handleGenerateLink}
                disabled={isGeneratingLink}
              >
                <Link2 className="w-4 h-4 mr-2" />
                {isGeneratingLink ? 'Создание...' : 'Создать ссылку-приглашение'}
              </Button>

              {generatedLink && (
                <div className="space-y-2">
                  <Label>Пригласительная ссылка</Label>
                  <div className="flex gap-2">
                    <Input
                      value={generatedLink}
                      readOnly
                      className="font-mono text-sm"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCopyLink}
                      className="shrink-0"
                    >
                      {linkCopied ? (
                        <>
                          <Check className="w-4 h-4 mr-2" />
                          Скопировано
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4 mr-2" />
                          Копировать
                        </>
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Отправьте эту ссылку людям, которых хотите пригласить. 
                    Они смогут войти через Telegram и автоматически присоединятся к компании.
                  </p>
                </div>
              )}

              {error && (
                <Alert variant="destructive">
                  <XCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert className="border-green-500 text-green-700">
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertDescription>{success}</AlertDescription>
                </Alert>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

interface InvitationsListProps {
  invitations: Invitation[];
  onRefresh?: () => void;
}

export function InvitationsList({ invitations, onRefresh }: InvitationsListProps) {
  const getStatusBadge = (status: Invitation['status']) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-50"><Clock className="w-3 h-3 mr-1" />Ожидает</Badge>;
      case 'accepted':
        return <Badge variant="outline" className="bg-green-50"><CheckCircle2 className="w-3 h-3 mr-1" />Принято</Badge>;
      case 'declined':
        return <Badge variant="outline" className="bg-red-50"><XCircle className="w-3 h-3 mr-1" />Отклонено</Badge>;
      case 'expired':
        return <Badge variant="outline" className="bg-gray-50"><Clock className="w-3 h-3 mr-1" />Истекло</Badge>;
      default:
        return null;
    }
  };

  const getRoleBadge = (role: 'admin' | 'member') => {
    return role === 'admin' 
      ? <Badge variant="secondary">Администратор</Badge>
      : <Badge variant="outline">Участник</Badge>;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  if (invitations.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">
          <Mail className="w-12 h-12 mx-auto mb-4 opacity-20" />
          <p>Нет отправленных приглашений</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Отправленные приглашения</CardTitle>
          {onRefresh && (
            <Button variant="outline" size="sm" onClick={onRefresh}>
              Обновить
            </Button>
          )}
        </div>
        <CardDescription>
          История приглашений в компанию
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {invitations.map((invitation) => (
            <div
              key={invitation.id}
              className="border rounded-lg p-4 space-y-2"
            >
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    {invitation.invitedUserEmail && (
                      <span className="font-medium">{invitation.invitedUserEmail}</span>
                    )}
                    {invitation.invitedUserTelegramUsername && (
                      <span className="font-medium text-blue-600">
                        {invitation.invitedUserTelegramUsername}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>Отправлено: {formatDate(invitation.createdAt)}</span>
                    <span>•</span>
                    <span>Истекает: {formatDate(invitation.expiresAt)}</span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  {getStatusBadge(invitation.status)}
                  {getRoleBadge(invitation.role)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
