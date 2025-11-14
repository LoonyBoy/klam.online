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
    console.log('🔧 TelegramLoginButton: Инициализация...');
    
    // Удаляем @ если есть
    const cleanBotName = botName.replace('@', '');
    console.log('🤖 Bot name:', cleanBotName);

    // Создаем глобальную функцию для callback
    const callbackName = 'onTelegramAuth';
    (window as any)[callbackName] = (user: TelegramUser) => {
      console.log('✅ TelegramLoginButton: Callback вызван!');
      console.log('📦 Данные от Telegram:', user);
      dataOnauth(user);
    };

    console.log('📝 Создана глобальная функция:', callbackName);
    console.log('🌐 window.onTelegramAuth доступна:', typeof (window as any)[callbackName]);

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
      console.log('📍 Используется data-auth-url:', dataAuthUrl);
      script.setAttribute('data-auth-url', dataAuthUrl);
    } else {
      console.log('📍 Используется data-onauth:', callbackName);
      script.setAttribute('data-onauth', callbackName);
    }

    script.async = true;
    
    script.onload = () => {
      console.log('✅ Telegram Widget скрипт загружен');
    };
    
    script.onerror = () => {
      console.error('❌ Ошибка загрузки Telegram Widget скрипта');
    };

    // Очищаем контейнер и добавляем скрипт
    if (containerRef.current) {
      containerRef.current.innerHTML = '';
      containerRef.current.appendChild(script);
      console.log('✅ Скрипт добавлен в DOM');
    }

    // Cleanup
    return () => {
      console.log('🧹 TelegramLoginButton: Cleanup');
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
      delete (window as any)[callbackName];
    };
  }, [botName, buttonSize, cornerRadius, requestAccess, usePic, dataOnauth, dataAuthUrl]);

  return <div ref={containerRef} />;
}
