# Процесс онбординга

## Обзор

После входа через Telegram пользователь проходит процесс онбординга для настройки доступа к компании.

## Сценарий

### Экран 1.1 — «Приветствие»

**Контент:**
- Заголовок: «Привет, {Имя из Telegram}!»
- Подзаголовок: «Сейчас настроим доступ к вашей компании.»
- Кнопка: [Продолжить]

**Логика:**
- По кнопке выполняется проверка наличия приглашений
- Если есть приглашения → переход к экрану 1.2
- Если нет приглашений → переход к экрану 1.3

### Экран 1.2 — «Приглашения в компании»

Отображается, если найдены активные приглашения по `telegram_username` или `email`.

**Контент:**
- Заголовок: «Приглашения в компании»
- Карточки приглашений:
  - Название компании
  - Роль: «Вас приглашают как: admin / member»
  - Кто пригласил: «Приглашение от: Иван Петров»
  - Срок действия
  - Кнопки: [Присоединиться] и [Отклонить]
- Внизу: [Создать свою компанию] — вторичная кнопка

**Логика:**
- При нажатии [Присоединиться]:
  - Принимается приглашение
  - Пользователь добавляется в компанию с указанной ролью
  - Редирект на дашборд компании
- При нажатии [Отклонить]:
  - Приглашение отклоняется
  - Карточка удаляется из списка
- При нажатии [Создать свою компанию]:
  - Переход к экрану 1.3

### Экран 1.3 — «Создание компании»

Отображается, если:
- Нет приглашений
- Пользователь выбрал создать свою компанию

**Контент:**
- Заголовок: «Создание компании»
- Форма:
  - Поле: Название компании (обязательное)
  - Кнопка: [Создать компанию]

**Логика:**
- После сабмита:
  - Создаётся новая компания
  - Пользователь становится владельцем (owner)
  - Редирект на дашборд компании

## Типы данных

### Invitation
```typescript
interface Invitation {
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
```

### Company
```typescript
interface Company {
  id: string;
  name: string;
  createdAt: string;
  ownerId: string;
  settings?: {
    telegramBotToken?: string;
    driveIntegration?: boolean;
  };
}
```

### CompanyMember
```typescript
interface CompanyMember {
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
```

## API функции

Все API функции находятся в `src/lib/companyApi.ts`:

- `getInvitations(params)` — получить приглашения пользователя
- `acceptInvitation(invitationId)` — принять приглашение
- `declineInvitation(invitationId)` — отклонить приглашение
- `createCompany(data)` — создать компанию
- `getUserCompanies(userId)` — получить компании пользователя
- `getCompany(companyId)` — получить данные компании
- `inviteUser(data)` — пригласить пользователя в компанию
- `getCompanyMembers(companyId)` — получить участников компании

## Компоненты

### Onboarding
Расположение: `src/components/Onboarding.tsx`

Основной компонент онбординга, управляющий всеми экранами.

**Props:**
```typescript
interface OnboardingProps {
  userName: string;
  userTelegramUsername?: string;
  userEmail?: string;
  onComplete: (companyId: string) => void;
}
```

## Интеграция

В `App.tsx` добавлена логика:

1. После логина через Telegram устанавливается флаг `needsOnboarding`
2. Показывается компонент `Onboarding`
3. После завершения онбординга:
   - Флаг `needsOnboarding` сбрасывается
   - Устанавливается флаг `isAuthenticated`
   - Редирект на дашборд

## TODO

- [ ] Реализовать реальные API запросы вместо моковых данных
- [ ] Добавить обработку ошибок с пользовательскими сообщениями
- [ ] Реализовать получение реального ID пользователя
- [ ] Добавить валидацию email и telegram username
- [ ] Реализовать автоматическое продление/удаление истекших приглашений
- [ ] Добавить возможность отправки приглашений из UI
- [ ] Реализовать переключение между компаниями
- [ ] Добавить настройки компании
