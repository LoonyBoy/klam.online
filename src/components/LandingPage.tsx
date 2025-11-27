import { motion } from 'motion/react';
import { Button } from './ui/button';
import { FolderKanban, ArrowRight, Send, FileText, Folder, Clipboard, MessageSquare, File, Archive, FolderOpen, Package, Inbox, FileCheck, PenTool } from 'lucide-react';

interface LandingPageProps {
  onGetStarted: () => void;
}

export function LandingPage({ onGetStarted }: LandingPageProps) {
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
      {/* Flying Paper Planes */}
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
      
      {/* Flying Documents */}
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

      {/* Header */}
      <header className="relative z-10 border-b border-gray-100 bg-white/40 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
                <FolderKanban className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">
                klambot.ru
              </h1>
            </div>
            <Button 
              onClick={onGetStarted}
              className="gap-2 bg-blue-600 hover:bg-blue-700"
            >
              Войти
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex items-center justify-center min-h-[calc(100vh-5rem)]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
          
          {/* Main Message */}
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-5xl sm:text-6xl md:text-7xl font-bold text-gray-900 mb-8 leading-tight"
          >
            Платформа для мониторинга{' '}
            <span className="text-blue-600">проектной и рабочей документации</span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-xl md:text-2xl text-gray-600 mb-12 leading-relaxed max-w-3xl mx-auto"
          >
            События, статусы, дедлайны, автоматическая отправка писем, уведомления в Telegram и многое другое.
          </motion.p>
          
          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <Button 
              onClick={onGetStarted}
              size="lg"
              className="gap-3 bg-blue-600 hover:bg-blue-700 text-xl px-10 py-7 shadow-lg hover:shadow-xl transition-all"
            >
              Войти в систему
              <ArrowRight className="w-6 h-6" />
            </Button>
          </motion.div>
        </div>
      </main>
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