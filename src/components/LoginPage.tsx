import { useState } from 'react';
import { motion } from 'motion/react';
import { Button } from './ui/button';
import { Send, FileText, Folder, Clipboard, MessageSquare, File, Archive, FolderOpen, Package, Inbox, FileCheck, PenTool } from 'lucide-react';

interface LoginPageProps {
  onLogin: () => void;
}

export function LoginPage({ onLogin }: LoginPageProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleTelegramLogin = () => {
    setIsLoading(true);
    
    // Симуляция авторизации через Telegram
    setTimeout(() => {
      setIsLoading(false);
      onLogin();
    }, 1500);
  };

  // Хэштеги для анимации
  const hashtags = [
    '#выгрузка',
    '#отправлено',
    '#когдадомой?',
    '#НастяПривет!',
    '#простохэштег',
    '#КудаЯлечу?',
    '#замечания',
    '#принято',
    '#правки',
    '#наПроверке',
    '#готово',
    '#срочно',
    '#дедлайн',
    '#проект',
    '#документы'
  ];

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-blue-50 via-white to-cyan-50">
      {/* Flying Paper Planes - увеличено количество */}
      <FlyingPaperPlane 
        delay={0}
        duration={15}
        startX={-10}
        startY={20}
        endX={110}
        endY={80}
      />
      <FlyingPaperPlane 
        delay={3}
        duration={18}
        startX={110}
        startY={10}
        endX={-10}
        endY={90}
      />
      <FlyingPaperPlane 
        delay={6}
        duration={20}
        startX={-10}
        startY={60}
        endX={110}
        endY={30}
      />
      <FlyingPaperPlane 
        delay={9}
        duration={16}
        startX={50}
        startY={-10}
        endX={50}
        endY={110}
      />
      <FlyingPaperPlane 
        delay={12}
        duration={17}
        startX={-10}
        startY={80}
        endX={110}
        endY={15}
      />
      <FlyingPaperPlane 
        delay={4}
        duration={19}
        startX={90}
        startY={-10}
        endX={10}
        endY={110}
      />
      
      {/* Flying Documents - больше иконок */}
      <FlyingDocument 
        icon={<FileText className="w-6 h-6 text-blue-400" />}
        delay={2}
        duration={22}
        startX={-5}
        startY={40}
        endX={105}
        endY={70}
      />
      <FlyingDocument 
        icon={<Folder className="w-6 h-6 text-cyan-400" />}
        delay={5}
        duration={19}
        startX={105}
        startY={50}
        endX={-5}
        endY={20}
      />
      <FlyingDocument 
        icon={<Clipboard className="w-6 h-6 text-indigo-400" />}
        delay={8}
        duration={21}
        startX={20}
        startY={-5}
        endX={80}
        endY={105}
      />
      <FlyingDocument 
        icon={<File className="w-7 h-7 text-purple-400" />}
        delay={1}
        duration={23}
        startX={110}
        startY={70}
        endX={-10}
        endY={40}
      />
      <FlyingDocument 
        icon={<Archive className="w-6 h-6 text-teal-400" />}
        delay={7}
        duration={20}
        startX={-5}
        startY={15}
        endX={105}
        endY={85}
      />
      <FlyingDocument 
        icon={<FolderOpen className="w-6 h-6 text-orange-400" />}
        delay={10}
        duration={18}
        startX={75}
        startY={-5}
        endX={25}
        endY={105}
      />
      <FlyingDocument 
        icon={<Package className="w-6 h-6 text-pink-400" />}
        delay={4}
        duration={24}
        startX={105}
        startY={25}
        endX={-5}
        endY={75}
      />
      <FlyingDocument 
        icon={<Inbox className="w-6 h-6 text-emerald-400" />}
        delay={11}
        duration={17}
        startX={-5}
        startY={55}
        endX={105}
        endY={35}
      />
      <FlyingDocument 
        icon={<FileCheck className="w-6 h-6 text-lime-400" />}
        delay={6}
        duration={21}
        startX={40}
        startY={-5}
        endX={60}
        endY={105}
      />
      <FlyingDocument 
        icon={<PenTool className="w-6 h-6 text-rose-400" />}
        delay={9}
        duration={19}
        startX={105}
        startY={45}
        endX={-5}
        endY={60}
      />

      {/* Flying Hashtags */}
      {hashtags.map((tag, index) => (
        <FlyingHashtag
          key={tag}
          text={tag}
          delay={index * 1.2}
          duration={20 + (index % 5)}
          startX={index % 2 === 0 ? -10 : 110}
          startY={10 + (index * 6) % 80}
          endX={index % 2 === 0 ? 110 : -10}
          endY={20 + ((index * 7) % 70)}
        />
      ))}

      {/* Subtle Dots Pattern */}
      <div 
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: 'radial-gradient(circle, #3b82f6 1px, transparent 1px)',
          backgroundSize: '30px 30px',
        }}
      />

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-5xl">
          {/* Logo and Title */}
          <motion.div
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-12"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="inline-flex items-center gap-3 mb-4"
            >
              <div className="relative">
                <Send className="w-12 h-12 text-blue-600" />
                <motion.div
                  className="absolute -top-1 -right-1 w-3 h-3 bg-cyan-400 rounded-full"
                  animate={{
                    scale: [1, 1.5, 1],
                    opacity: [1, 0.5, 1],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                />
              </div>
              <h1 className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-600">
                klam.online
              </h1>
            </motion.div>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.8 }}
              className="text-xl text-gray-600 max-w-2xl mx-auto"
            >
              Платформа для мониторинга проектной и рабочей документации
            </motion.p>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.8 }}
              className="text-sm text-gray-400 mt-2"
            >
              Отправляйте проекты в полёт вместе с командой 🚀
            </motion.p>
          </motion.div>

          {/* Login Card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="max-w-md mx-auto"
          >
            <div className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-3xl shadow-2xl shadow-blue-200/50 p-12">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-semibold text-gray-800 mb-2">
                  Войти в систему
                </h2>
                <p className="text-gray-500">
                  Используйте Telegram для быстрого входа
                </p>
              </div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.6 }}
                className="space-y-4"
              >
                <Button
                  onClick={handleTelegramLogin}
                  disabled={isLoading}
                  className="w-full h-14 bg-[#0088cc] hover:bg-[#0077b3] text-white gap-3 text-lg shadow-lg shadow-blue-500/30"
                >
                  <MessageSquare className="w-6 h-6" />
                  {isLoading ? 'Ждем ваш самолётик...' : 'Войти через Telegram'}
                </Button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-white/80 text-gray-500">
                      Быстро и безопасно
                    </span>
                  </div>
                </div>

                <div className="bg-blue-50/50 rounded-xl p-4 border border-blue-100">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                        <MessageSquare className="w-4 h-4 text-blue-600" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-gray-800 mb-1">
                        Как это работает?
                      </h3>
                      <p className="text-xs text-gray-600 leading-relaxed">
                        Нажмите кнопку выше, и вы будете перенаправлены в Telegram бота для авторизации. Ваши данные защищены и используются только для входа в систему.
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

// Flying Paper Plane Component
function FlyingPaperPlane({ 
  delay, 
  duration, 
  startX, 
  startY, 
  endX, 
  endY 
}: { 
  delay: number; 
  duration: number; 
  startX: number; 
  startY: number; 
  endX: number; 
  endY: number; 
}) {
  const rotation = Math.atan2(endY - startY, endX - startX) * (180 / Math.PI);
  
  return (
    <motion.div
      className="absolute pointer-events-none"
      initial={{ 
        left: `${startX}%`, 
        top: `${startY}%`,
        opacity: 0,
      }}
      animate={{ 
        left: `${endX}%`, 
        top: `${endY}%`,
        opacity: [0, 0.6, 0.6, 0],
      }}
      transition={{
        duration,
        delay,
        repeat: Infinity,
        ease: 'linear',
      }}
      style={{ rotate: `${rotation}deg` }}
    >
      <Send className="w-8 h-8 text-blue-400/40" />
    </motion.div>
  );
}

// Flying Document Component
function FlyingDocument({ 
  icon,
  delay, 
  duration, 
  startX, 
  startY, 
  endX, 
  endY 
}: { 
  icon: React.ReactNode;
  delay: number; 
  duration: number; 
  startX: number; 
  startY: number; 
  endX: number; 
  endY: number; 
}) {
  return (
    <motion.div
      className="absolute pointer-events-none"
      initial={{ 
        left: `${startX}%`, 
        top: `${startY}%`,
        opacity: 0,
        rotate: 0,
      }}
      animate={{ 
        left: `${endX}%`, 
        top: `${endY}%`,
        opacity: [0, 0.4, 0.4, 0],
        rotate: 360,
      }}
      transition={{
        duration,
        delay,
        repeat: Infinity,
        ease: 'linear',
      }}
    >
      {icon}
    </motion.div>
  );
}

// Flying Hashtag Component
function FlyingHashtag({ 
  text,
  delay, 
  duration, 
  startX, 
  startY, 
  endX, 
  endY 
}: { 
  text: string;
  delay: number; 
  duration: number; 
  startX: number; 
  startY: number; 
  endX: number; 
  endY: number; 
}) {
  const colors = [
    'text-blue-400/30',
    'text-cyan-400/30',
    'text-indigo-400/30',
    'text-purple-400/30',
    'text-pink-400/30',
    'text-teal-400/30',
  ];
  
  const randomColor = colors[Math.floor(Math.random() * colors.length)];
  
  return (
    <motion.div
      className="absolute pointer-events-none"
      initial={{ 
        left: `${startX}%`, 
        top: `${startY}%`,
        opacity: 0,
        scale: 0.8,
      }}
      animate={{ 
        left: `${endX}%`, 
        top: `${endY}%`,
        opacity: [0, 0.5, 0.5, 0],
        scale: [0.8, 1, 1, 0.8],
      }}
      transition={{
        duration,
        delay,
        repeat: Infinity,
        ease: 'linear',
      }}
    >
      <span className={`text-sm font-medium ${randomColor} whitespace-nowrap`}>
        {text}
      </span>
    </motion.div>
  );
}
