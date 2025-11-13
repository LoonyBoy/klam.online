import { useEffect, useRef } from 'react';

interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
}

interface TelegramLoginButtonProps {
  botName: string;
  buttonSize?: 'large' | 'medium' | 'small';
  cornerRadius?: number;
  requestAccess?: boolean;
  usePic?: boolean;
  dataOnauth: (user: TelegramUser) => void;
  dataAuthUrl?: string;
}

declare global {
  interface Window {
    TelegramLoginWidget?: {
      dataOnauth?: (user: TelegramUser) => void;
    };
  }
}

export function TelegramLoginButton({
  botName,
  buttonSize = 'large',
  cornerRadius = 10,
  requestAccess = true,
  usePic = false,
  dataOnauth,
  dataAuthUrl,
}: TelegramLoginButtonProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Удаляем @ если есть
    const cleanBotName = botName.replace('@', '');

    // Создаем глобальную функцию для callback
    const callbackName = 'onTelegramAuth';
    (window as any)[callbackName] = dataOnauth;

    // Создаем скрипт виджета
    const script = document.createElement('script');
    script.src = 'https://telegram.org/js/telegram-widget.js?22';
    script.setAttribute('data-telegram-login', cleanBotName);
    script.setAttribute('data-size', buttonSize);
    script.setAttribute('data-radius', cornerRadius.toString());
    script.setAttribute('data-request-access', requestAccess ? 'write' : 'read');
    
    if (usePic) {
      script.setAttribute('data-userpic', 'true');
    }

    if (dataAuthUrl) {
      script.setAttribute('data-auth-url', dataAuthUrl);
    } else {
      script.setAttribute('data-onauth', callbackName);
    }

    script.async = true;

    // Очищаем контейнер и добавляем скрипт
    if (containerRef.current) {
      containerRef.current.innerHTML = '';
      containerRef.current.appendChild(script);
    }

    // Cleanup
    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
      delete (window as any)[callbackName];
    };
  }, [botName, buttonSize, cornerRadius, requestAccess, usePic, dataOnauth, dataAuthUrl]);

  return <div ref={containerRef} />;
}
