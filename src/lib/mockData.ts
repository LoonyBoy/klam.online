import { Project, Album, Event, User } from '../App';

export const mockProjects: Project[] = [
  {
    id: '1',
    code: 'ПР-2025-001',
    name: 'Жилой комплекс "Северный"',
    client: 'ООО "СтройИнвест"',
    address: 'г. Москва, ул. Северная, д. 15',
    department: 'Архитектура',
    departments: ['Архитектура', 'Конструкции', 'ОВиК', 'ВК'],
    executor: 'Иванов И.И.',
    status: 'Активный',
    deadline: '2025-12-15',
    telegramLink: 'https://t.me/project_001',
    driveLink: 'https://drive.google.com/project1',
    projectUsers: {
      executors: [
        { id: '1', name: 'Иванов Иван', email: 'ivanov@company.ru', telegramId: '@ivanov', role: 'executor', department: 'Архитектура' },
        { id: '2', name: 'Петрова Мария', email: 'petrova@company.ru', telegramId: '@petrova', role: 'executor', department: 'Конструкции' },
        { id: '3', name: 'Сидоров Петр', email: 'sidorov@company.ru', telegramId: '@sidorov', role: 'executor', department: 'ОВиК' },
      ],
      clients: [
        { id: '4', name: 'Козлов Алексей', email: 'kozlov@client.ru', telegramId: '@kozlov_client', role: 'client', department: 'Отдел заказчика' },
        { id: '5', name: 'Новикова Елена', email: 'novikova@client.ru', telegramId: '@novikova', role: 'client', department: 'Отдел заказчика' },
      ]
    }
  },
  {
    id: '2',
    code: 'ПР-2025-002',
    name: 'Торговый центр "Plaza"',
    client: 'ЗАО "Ритейл Групп"',
    address: 'г. Санкт-Петербург, Невский пр., д. 120',
    department: 'Конструкции',
    departments: ['Архитектура', 'Конструкции', 'ВК'],
    executor: 'Петров П.П.',
    status: 'Активный',
    deadline: '2025-11-20',
    telegramLink: 'https://t.me/project_002',
    driveLink: 'https://drive.google.com/project2',
    projectUsers: {
      executors: [
        { id: '6', name: 'Петров Павел', email: 'petrov@company.ru', telegramId: '@petrov_p', role: 'executor', department: 'Конструкции' },
        { id: '7', name: 'Федорова Анна', email: 'fedorova@company.ru', telegramId: '@fedorova', role: 'executor', department: 'Архитектура' },
      ],
      clients: [
        { id: '8', name: 'Морозов Дмитрий', email: 'morozov@retail.ru', telegramId: '@morozov_d', role: 'client', department: 'Отдел заказчика' },
      ]
    }
  },
  {
    id: '3',
    code: 'ПР-2024-098',
    name: 'Офисное здание "Бизнес Парк"',
    client: 'ООО "Капитал"',
    address: 'г. Москва, ул. Тверская, д. 45',
    department: 'ОВиК',
    departments: ['Архитектура', 'ОВиК', 'ЭОМ'],
    executor: 'Сидоров С.С.',
    status: 'Завершён',
    deadline: '2024-10-30',
    telegramLink: 'https://t.me/project_098',
    projectUsers: {
      executors: [
        { id: '9', name: 'Сидоров Сергей', email: 'sidorov_s@company.ru', telegramId: '@sidorov_s', role: 'executor', department: 'ОВиК' },
      ],
      clients: [
        { id: '10', name: 'Васильев Игорь', email: 'vasiliev@kapital.ru', telegramId: '@vasiliev', role: 'client', department: 'Отдел заказчика' },
      ]
    }
  },
  {
    id: '4',
    code: 'ПР-2025-003',
    name: 'Школа №45',
    client: 'Департамент образования',
    address: 'г. Москва, ул. Школьная, д. 10',
    department: 'Архитектура',
    departments: ['Архитектура', 'Конструкции'],
    executor: 'Козлов К.К.',
    status: 'Активный',
    deadline: '2025-11-25',
    projectUsers: {
      executors: [
        { id: '11', name: 'Козлов Кирилл', email: 'kozlov_k@company.ru', telegramId: '@kozlov_k', role: 'executor', department: 'Архитектура' },
      ],
      clients: [
        { id: '12', name: 'Соколова Ольга', email: 'sokolova@edu.gov.ru', telegramId: '@sokolova_o', role: 'client', department: 'Департамент образования' },
      ]
    }
  }
];

export const mockAlbums: Album[] = [
  {
    id: '1',
    name: 'Архитектурные решения',
    code: 'АР',
    status: 'На проверке',
    deadline: '2025-11-15',
    department: 'Архитектура',
    projectId: '1',
    category: 'СВОК ПД',
    executor: {
      id: '1',
      name: 'Иван Петров',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ivan'
    },
    lastEvent: {
      type: '#выгрузка',
      date: '2025-11-10T14:30:00'
    },
    comment: 'Ожидание согласования фасадов с заказчиком',
    albumLink: 'https://drive.google.com/drive/folders/album1'
  },
  {
    id: '2',
    name: 'Конструктивные решения',
    code: 'КР',
    status: 'Замечания',
    deadline: '2025-11-18',
    department: 'Конструкции',
    projectId: '1',
    category: 'СВОК ПД',
    executor: {
      id: '2',
      name: 'Мария Сидорова',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Maria'
    },
    lastEvent: {
      type: '#замечания',
      date: '2025-11-09T10:15:00'
    },
    comment: 'Требуется пересчёт нагрузок на несущие конструкции',
    albumLink: 'https://disk.yandex.ru/d/album2'
  },
  {
    id: '3',
    name: 'Генеральный план',
    code: 'ГП',
    status: 'Принято',
    deadline: '2025-11-10',
    department: 'Архитектура',
    projectId: '1',
    category: 'СВОК ПД',
    executor: {
      id: '1',
      name: 'Иван Петров',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ivan'
    },
    lastEvent: {
      type: '#принято',
      date: '2025-11-08T16:45:00'
    },
    comment: 'Все замечания устранены, альбом принят',
    albumLink: 'https://cloud.mail.ru/public/album3'
  },
  {
    id: '4',
    name: 'Водоснабжение и канализация',
    code: 'ВК',
    status: 'На проверке',
    deadline: '2025-11-16',
    department: 'ОВиК',
    projectId: '1',
    category: 'СВОК РД',
    executor: {
      id: '3',
      name: 'Алексей Кузнецов',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alexey'
    },
    lastEvent: {
      type: '#выгрузка',
      date: '2025-11-11T09:20:00'
    },
    comment: 'Передано на проверку главному инженеру',
    albumLink: 'https://drive.google.com/drive/folders/album6'
  },
  {
    id: '5',
    name: 'Отопление и вентиляция',
    code: 'ОВ',
    status: 'В работе',
    deadline: '2025-11-19',
    department: 'ОВиК',
    projectId: '1',
    category: 'СВОК РД',
    executor: {
      id: '3',
      name: 'Алексей Кузнецов',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alexey'
    },
    lastEvent: {
      type: '#правки',
      date: '2025-11-10T11:00:00'
    },
    comment: 'Внесение правок по системе вентиляции'
  },
  {
    id: '6',
    name: 'Электроснабжение',
    code: 'ЭО',
    status: 'В работе',
    deadline: '2025-11-22',
    department: 'Электрика',
    projectId: '1',
    category: 'СВОК РД',
    executor: {
      id: '4',
      name: 'Елена Волкова',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Elena'
    },
    lastEvent: {
      type: '#выгрузка',
      date: '2025-11-09T15:30:00'
    },
    comment: 'Разработка схем электроснабжения в процессе',
    albumLink: 'https://disk.yandex.ru/d/album5'
  },
  {
    id: '7',
    name: 'Слаботочные системы',
    code: 'СС',
    status: 'В работе',
    deadline: '2025-11-25',
    department: 'Электрика',
    projectId: '1',
    category: 'СВОК РД',
    executor: {
      id: '4',
      name: 'Елена Волкова',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Elena'
    },
    comment: 'Подготовка документации по системам безопасности',
    albumLink: 'https://cloud.mail.ru/public/album7'
  },
];

export const mockEvents: Event[] = [
  {
    id: '1',
    date: '2025-11-08T10:30:00',
    type: '#замечания',
    user: 'Смирнов А.В. (Заказчик)',
    comment: 'Не соответствует нормам высоты потолков в разделе 3.2',
    projectId: '1',
    albumId: '1'
  },
  {
    id: '2',
    date: '2025-11-07T14:20:00',
    type: '#выгрузка',
    user: 'Иванов И.И.',
    comment: 'Загружена версия 2.3 альбома АР',
    projectId: '1',
    albumId: '1'
  },
  {
    id: '3',
    date: '2025-11-07T09:15:00',
    type: '#принято',
    user: 'Кузнецов Д.И. (Заказчик)',
    comment: 'Генплан утверждён без замечаний',
    projectId: '1',
    albumId: '3'
  },
  {
    id: '4',
    date: '2025-11-06T16:45:00',
    type: '#замечания',
    user: 'Морозов В.С. (Заказчик)',
    comment: 'Необходимо уточнить расчёт нагрузок на фундамент',
    projectId: '1',
    albumId: '2'
  },
  {
    id: '5',
    date: '2025-11-06T11:00:00',
    type: '#правки',
    user: 'Петров П.П.',
    comment: 'Внесены исправления по замечаниям от 05.11',
    projectId: '2',
    albumId: '4'
  },
  {
    id: '6',
    date: '2025-11-05T13:30:00',
    type: '#выгрузка',
    user: 'Иванов И.И.',
    comment: 'Выгружена ревизия 1.5',
    projectId: '1',
    albumId: '2'
  },
  {
    id: '7',
    date: '2025-11-05T10:00:00',
    type: '#отклонено',
    user: 'Смирнов А.В. (Заказчик)',
    comment: 'Критические замечания по разделу ОВ',
    projectId: '1',
    albumId: '2'
  },
  {
    id: '8',
    date: '2025-11-04T15:20:00',
    type: '#принято',
    user: 'Волков Е.А. (Заказчик)',
    comment: 'Согласовано без замечаний',
    projectId: '3',
    albumId: '3'
  }
];

export const mockUsers: User[] = [
  {
    id: '1',
    name: 'Иванов Иван Иванович',
    email: 'ivanov@company.ru',
    telegramId: '@ivanov_ii',
    role: 'executor',
    department: 'Архитектура'
  },
  {
    id: '2',
    name: 'Петров Пётр Петрович',
    email: 'petrov@company.ru',
    telegramId: '@petrov_pp',
    role: 'executor',
    department: 'Конструкции'
  },
  {
    id: '3',
    name: 'Смирнов Алексей Викторович',
    email: 'smirnov@client.ru',
    telegramId: '@smirnov_av',
    role: 'client',
    department: 'Заказчик'
  },
  {
    id: '4',
    name: 'Сидоров Сергей Сергеевич',
    email: 'sidorov@company.ru',
    telegramId: '@sidorov_ss',
    role: 'executor',
    department: 'ОВиК'
  },
  {
    id: '5',
    name: 'Козлов Константин Константинович',
    email: 'kozlov@company.ru',
    telegramId: '@kozlov_kk',
    role: 'executor',
    department: 'Архитектура'
  },
  {
    id: '6',
    name: 'Кузнецов Дмитрий Игоревич',
    email: 'kuznetsov@client.ru',
    telegramId: '@kuznetsov_di',
    role: 'client',
    department: 'Заказчик'
  },
  {
    id: '7',
    name: 'Морозов Виктор Сергеевич',
    email: 'morozov@client.ru',
    telegramId: '@morozov_vs',
    role: 'client',
    department: 'Заказчик'
  }
];