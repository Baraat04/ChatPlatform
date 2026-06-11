'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { 
  Zap, MessageSquare, Bot, ArrowRight, Check, Play, Globe, CheckCircle2, 
  ChevronDown, Phone, Cpu, Layers, Award, Users, X, Mail, MapPin, Send,
  Shield, RefreshCw, Sparkles, MessageCircle, BarChart3, ChevronRight,
  Briefcase, TrendingUp
} from 'lucide-react';
import { API_URL } from '../config';

const localT = {
  EN: {
    heroTitle1: "Connect AI agents to automate ",
    heroTitleHighlight: "sales and customer support",
    heroSub: "Delegate routine support and active sales to smart agents. Upload your own knowledge base and instantly communicate with clients in WhatsApp & Telegram.",
    createAgentBtn: "Create AI Agent",
    interactiveDemoBtn: "Create Bot in a Few Clicks",
    features: "Features",
    pricing: "Pricing",
    company: "Company",
    privacy: "Privacy Policy",
    terms: "Terms of Use",
    offer: "Public Offer",
    cabinet: "To Cabinet",
    signIn: "Sign In",
    getStarted: "Start Free",
    product: "Product",
    partnership: "Partnership",
    allSystemsOperational: "All systems operational",
    buildToday: "Custom Solutions & Cooperation",
    buildTodaySub: "Need a complex integration with your CRM/ERP or custom database? Fill out the form and our team will get in touch.",
    nameLabel: "Your Name",
    phoneLabel: "Phone Number (WhatsApp)",
    businessTypeLabel: "Niche",
    messageLabel: "Project Scope Description",
    sendRequest: "Submit Inquiry",
    requestSent: "Inquiry Sent!",
    requestSentSub: "Our team will reach out within 1 business day.",
    aboutUs: "About Us",
    solutions: "Solutions",
    featuresTab: "Features",
    pricingTab: "Pricing",
    mockupConversations: "Conversations processed",
    mockupToday: "+12% today",
    mockupLeads: "Leads gathered",
    mockupSupportLoad: "Support load",
    mockupAiAnswers: "92% AI-responses",
    mockupLiveChat: "Live chat",
    mockupWhatsAppChat: "WhatsApp chat",
    mockupUserMsg: "Hi! I want to order delivery to Almaty. What are the delivery times?",
    mockupBotMsg: "Hello! 🚚 We deliver to Almaty in 1-2 days. Would you like to place an order now?",
    mockupResponseTime: "AI response time",
    mockupSeconds: "0.8 seconds ⚡",
    mockupTimeSaved: "Time saved",
    mockupHours: "148 hours/mo",
    scenariosSubtitle: "AI Dialogue Scenarios",
    scenariosTitle: "See how an AI agent solves tasks in chat",
    scenariosWhatAgentDoes: "What the AI agent does:",
    scenariosOnline: "AI online",
    scenariosInputPlaceholder: "Message...",
    aboutSubtitle: "About Platform",
    aboutTitle: "With UP-CHAT business gets more leads and sales",
    aboutDescription: "AI assistant instantly answers requests at any time, collects customer data, distributes leads, and helps managers close deals faster.",
    stat1Title: "Response accuracy",
    stat1Desc: "The accuracy of UP-CHAT AI assistants in real business cases reaches record metrics due to our knowledge base.",
    stat2Title: "Average response time",
    stat2Desc: "AI assistant instantly processes incoming messages and answers customers without queues or delays.",
    stat3Title: "Routine automated",
    stat3Desc: "AI handles the majority of questions in the sales funnel, freeing up human operators for complex tasks.",
    featuresSectionTitle: "What the AI agent can do",
    featuresSectionSub: "Opportunities for growth and communication automation across all key channels.",
    feature1Title: "WhatsApp & Telegram Channels",
    feature1Desc: "AI agent works in all popular messengers, conducting a full dialogue with clients from the first contact.",
    feature2Title: "Knowledge base PDF / TXT",
    feature2Desc: "Easily train the agent on company regulations, instructions, and scripts. Information is absorbed in a couple of seconds.",
    feature3Title: "Live chat with operator",
    feature3Desc: "The convenient 'Conversations' section allows you to control the quality of responses and take over dialogue with a customer manually.",
    stepsTitle: "Set up AI in just a few steps",
    stepsSub: "All scenarios, answers, and logic are configured through a simple web interface — no programming required.",
    step1Title: "Create an agent",
    step1Desc: "Enter your company name and select your business niche.",
    step2Title: "Configure prompt",
    step2Desc: "Choose the communication format (tone) and the main goal of the AI agent.",
    step3Title: "Upload knowledge base",
    step3Desc: "Upload PDF or TXT files with your regulations and scripts.",
    step4Title: "Connect channels",
    step4Desc: "Link your WhatsApp or Telegram accounts and start the bot.",
    pricingSubtitle: "Pricing plans",
    pricingTitle: "Cost of use",
    pricingSub: "Choose the right message volume. Message limits are renewed every month.",
    planFreeDesc: "Try for free",
    planStarterDesc: "For small projects",
    planPopularBadge: "Popular ⭐",
    planGrowthDesc: "For teams with active traffic and growing sales",
    planProDesc: "For large projects, integrators, and agencies",
    planStarterNote: "If you run out of limits, you can upgrade at any time. The message balance is updated monthly.",
    btnStartFree: "Start Free",
    btnSelectStarter: "Select Starter",
    btnSelectGrowth: "Select Growth",
    btnSelectPro: "Select Pro",
    featFree1: "100 AI-messages",
    featFree2: "1 channel (WhatsApp or Telegram)",
    featFree3: "AI-processing 24/7",
    featFree4: "Knowledge base PDF / TXT",
    featStarter1: "1,000 AI-messages",
    featGrowth1: "6,000 AI-messages",
    featGrowth2: "Up to 3 channels",
    featGrowth5: "'Conversations' section (Live chat)",
    featPro1: "15,000 AI-messages",
    featPro2: "Unlimited channels",
    faqTitle: "Frequently Asked Questions",
    faqQ1: "How long does it take to launch an AI agent?",
    faqA1: "Just a few minutes! In our quick wizard, you select the messenger, specify your company name, its niche, and communication tone. Immediately after that, the AI is ready for the first dialogue.",
    faqQ2: "Are technical specialists needed for setup?",
    faqA2: "No, absolutely. The UP-CHAT platform is designed as a no-code tool. You don't need to write code, configure servers, or hire developers.",
    faqQ3: "Which channels can I connect the AI agent to?",
    faqA3: "Currently, you can easily connect your AI agent to Telegram and WhatsApp messengers.",
    faqQ4: "Can the agent completely replace a manager?",
    faqA4: "The AI agent handles the routine: greetings, gathering contact info, and consulting on schedules and services. In case of a complex question, the chat is saved in the 'Conversations' section, allowing a human operator to seamlessly take over.",
    footerCopyright: "All rights reserved.",
    namePlaceholder: "Your name",
    messagePlaceholder: "What custom cooperation solution are you interested in?",
    aboutDesc: "AI assistant instantly answers requests at any time, collects customer data, distributes leads, and helps managers close deals faster.",
    featuresTitle: "What the AI agent can do",
    featuresSub: "Opportunities for growth and communication automation across all key channels.",
    pricingDesc: "Choose the right message volume. Message limits are renewed every month.",
    perMonth: "/mo",
    planPopular: "Popular",
    planFreeSubtitle: "Try for free",
    planFreeBtn: "Start Free",
    planFreeFeatures: ['100 AI-messages', '1 channel (WhatsApp or Telegram)', 'AI-processing 24/7', 'Knowledge base PDF / TXT'],
    planStarterSubtitle: "For small projects",
    planStarterBtn: "Select Starter",
    planStarterFeatures: ['1,000 AI-messages', '1 channel (WhatsApp or Telegram)', 'AI-processing 24/7', 'Knowledge base PDF / TXT'],
    planUpgradeNote: "If you run out of limits, you can upgrade at any time. The message balance is updated monthly.",
    planGrowthSubtitle: "For teams with active traffic and growing sales",
    planGrowthBtn: "Select Growth",
    planGrowthFeatures: ['6,000 AI-messages', 'Up to 3 channels', 'AI-processing 24/7', 'Knowledge base PDF / TXT', '"Conversations" section (Live chat)'],
    planProSubtitle: "For large projects, integrators, and agencies",
    planProBtn: "Select Pro",
    planProFeatures: ['15,000 AI-messages', 'Unlimited channels', 'AI-processing 24/7', 'Knowledge base PDF / TXT', '"Conversations" section (Live chat)'],
    stat2Value: "8 sec",
    stat3Value: "up to 80%",
    businessTypes: ['E-commerce', 'Car Dealership', 'Online School', 'Services / Agency', 'Other'],
    footerCompanyName: 'LLP "SAAMA GROUP", BIN: 171040010072',
    footerAddress: 'Legal Address: 140000, Republic of Kazakhstan, Pavlodar, Malakhova St., 11',
    footerContacts: 'Contacts: +7 777 420-19-89 | geducation1017@gmail.com',
    footerHours: 'Support hours: Mon-Fri: 09:00 - 18:00 (GMT+5)',
    faqItems: [
      { q: 'How long does it take to launch an AI agent?', a: 'Just a few minutes! In our quick wizard, you select the messenger, specify your company name, its niche, and communication tone. Immediately after that, the AI is ready for the first dialogue.' },
      { q: 'Are technical specialists needed for setup?', a: "No, absolutely not. The UP-CHAT platform is designed as a no-code tool. You don't need to write code, configure servers, or hire developers." },
      { q: 'Which channels can I connect the AI agent to?', a: 'Currently, you can easily connect your AI agent to Telegram and WhatsApp messengers.' },
      { q: 'Can the agent completely replace a manager?', a: "The AI agent handles the routine: greetings, gathering contact info, and consulting on schedules and services. For complex questions, the chat is saved in the 'Conversations' section, allowing a human operator to seamlessly take over." }
    ]
  },
  RU: {
    heroTitle1: "Подключайте ИИ-агентов для автоматизации ",
    heroTitleHighlight: "продаж и поддержки клиентов",
    heroSub: "Делегируйте рутинную поддержку и активные продажи умным агентам. Подключите собственную базу знаний и общайтесь с клиентами в WhatsApp и Telegram.",
    createAgentBtn: "Создать ИИ агента",
    interactiveDemoBtn: "Создайте бота за пару кликов",
    features: "Возможности",
    pricing: "Тарифы",
    company: "Компания",
    privacy: "Политика конфиденциальности",
    terms: "Условия использования",
    offer: "Публичная оферта",
    cabinet: "Личный кабинет",
    signIn: "Войти",
    getStarted: "Начать бесплатно",
    product: "Продукт",
    partnership: "Сотрудничество",
    allSystemsOperational: "Все системы работают в штатном режиме",
    buildToday: "Кастомные решения и сотрудничество",
    buildTodaySub: "Требуется сложная интеграция с вашей CRM/ERP или кастомная база данных? Оставьте контакты, и наш специалист свяжется с вами.",
    nameLabel: "Ваше имя",
    phoneLabel: "Номер телефона (WhatsApp)",
    businessTypeLabel: "Отрасль бизнеса",
    messageLabel: "Какую задачу нужно решить ИИ-боту?",
    sendRequest: "Отправить заявку",
    requestSent: "Заявка принята!",
    requestSentSub: "Специалист свяжется с вами в течение рабочего дня.",
    aboutUs: "О нас",
    solutions: "Решения",
    featuresTab: "Функционал",
    pricingTab: "Стоимость",
    mockupConversations: "Диалогов обработано",
    mockupToday: "+12% сегодня",
    mockupLeads: "Собрано лидов",
    mockupSupportLoad: "Нагрузка на поддержку",
    mockupAiAnswers: "92% ИИ-ответы",
    mockupLiveChat: "Живой диалог",
    mockupWhatsAppChat: "Чат WhatsApp",
    mockupUserMsg: "Привет! Хочу заказать доставку в Алматы. Какие сроки?",
    mockupBotMsg: "Здравствуйте! 🚚 Доставим в Алматы за 1-2 дня. Оформить заказ прямо сейчас?",
    mockupResponseTime: "Время ответа ИИ",
    mockupSeconds: "0.8 секунд ⚡",
    mockupTimeSaved: "Сэкономлено времени",
    mockupHours: "148 часов в мес",
    scenariosSubtitle: "Сценарии ИИ-диалогов",
    scenariosTitle: "Показываем, как ИИ-агент решает задачи в чате",
    scenariosWhatAgentDoes: "Что делает ИИ-агент:",
    scenariosOnline: "ИИ в сети",
    scenariosInputPlaceholder: "Сообщение...",
    aboutSubtitle: "О платформе",
    aboutTitle: "С UP-CHAT бизнес получает больше заявок и продаж",
    aboutDescription: "ИИ-ассистент мгновенно отвечает на обращения в любое время, собирает данные о клиентах, распределяет заявки и помогает менеджерам быстрее закрывать сделки",
    stat1Title: "Точность ответов",
    stat1Desc: "Точность ИИ-ассистентов UP-CHAT в реальных бизнес-кейсах достигает рекордных показателей за счет базы знаний.",
    stat2Title: "Среднее время ответа",
    stat2Desc: "ИИ-ассистент мгновенно обрабатывает входящее сообщение и отвечает клиентам без очередей и задержек.",
    stat3Title: "Рутины автоматизировано",
    stat3Desc: "ИИ берет на себя большинство вопросов в воронке продаж, освобождая операторов для сложных задач.",
    featuresSectionTitle: "Что умеет ИИ-агент",
    featuresSectionSub: "Возможности для роста и автоматизации общения во всех ключевых каналах.",
    feature1Title: "Каналы WhatsApp & Telegram",
    feature1Desc: "AI-агент работает во всех популярных мессенджерах, ведя полноценный диалог с клиентами от первого контакта.",
    feature2Title: "База знаний PDF / TXT",
    feature2Desc: "Легко обучайте агента на регламентах компании, инструкциях и скриптах. Информация усваивается за пару секунд.",
    feature3Title: "Живой чат с оператором",
    feature3Desc: "Удобный раздел «Диалоги» позволяет контролировать качество ответов и перехватывать диалог с клиентом вручную.",
    stepsTitle: "Настройте ИИ всего за несколько шагов",
    stepsSub: "Все сценарии, ответы и логика задаются через простой веб-интерфейс — без программирования.",
    step1Title: "Создайте агента",
    step1Desc: "Укажите имя компании и выберите сферу вашей деятельности.",
    step2Title: "Настройте промпт",
    step2Desc: "Выберите формат общения (тон) и главную цель ИИ-агента.",
    step3Title: "Загрузите базу знаний",
    step3Desc: "Загрузите PDF или TXT файлы с регламентами и скриптами.",
    step4Title: "Подключите каналы",
    step4Desc: "Подвяжите аккаунты WhatsApp или Telegram и запустите бота.",
    pricingSubtitle: "Тарифные планы",
    pricingTitle: "Стоимость использования",
    pricingSub: "Выберите подходящий объем сообщений. Лимиты сообщений обновляются каждый месяц.",
    planFreeDesc: "Попробуйте без оплаты",
    planStarterDesc: "Для небольших проектов",
    planPopularBadge: "Популярно ⭐",
    planGrowthDesc: "Для команд с активным трафиком и растущих продаж",
    planProDesc: "Для крупных проектов, интеграторов и агентств",
    planStarterNote: "При нехватке лимита вы можете в любой момент перейти на тариф выше. Баланс сообщений обновляется ежемесячно.",
    btnStartFree: "Начать бесплатно",
    btnSelectStarter: "Выбрать Starter",
    btnSelectGrowth: "Выбрать Growth",
    btnSelectPro: "Выбрать Pro",
    featFree1: "100 ИИ-сообщений",
    featFree2: "1 канал (WhatsApp и Telegram)",
    featFree3: "ИИ-обработка 24/7",
    featFree4: "База знаний PDF / TXT",
    featStarter1: "1 000 ИИ-сообщений",
    featGrowth1: "6 000 ИИ-сообщений",
    featGrowth2: "До 3 каналов связи",
    featGrowth5: "Раздел \"Диалоги\" (Live-чат)",
    featPro1: "15 000 ИИ-сообщений",
    featPro2: "Неограниченные каналы",
    faqTitle: "Часто задаваемые вопросы",
    faqQ1: "Сколько времени занимает запуск ИИ-агента?",
    faqA1: "Всего несколько минут! В нашем быстром мастере вы выбираете мессенджер, указываете название компании, её сферу и тональность общения. Сразу после этого ИИ готов к первичному диалогу.",
    faqQ2: "Нужны ли технические специалисты для настройки?",
    faqA2: "Нет, абсолютно. Платформа UP-CHAT спроектирована как no-code инструмент. Вам не нужно писать код, настраивать сервера или привлекать программистов.",
    faqQ3: "В какие каналы можно подключить ИИ-агента?",
    faqA3: "На текущий момент вы можете без труда подключить своего ИИ-агента к мессенджерам Telegram и WhatsApp.",
    faqQ4: "Может ли агент полностью заменить менеджера?",
    faqA4: "ИИ-агент берет на себя рутину: приветствие, сбор контактных данных, консультацию по графику и услугам. В случае сложного вопроса диалог сохраняется в разделе «Диалоги», и живой оператор может бесшовно подключиться к переписке.",
    footerCopyright: "Все права защищены.",
    namePlaceholder: "Ваше имя",
    messagePlaceholder: "Какое кастомное решение сотрудничества вас интересует?",
    aboutDesc: "ИИ-ассистент мгновенно отвечает на обращения в любое время, собирает данные о клиентах, распределяет заявки и помогает менеджерам быстрее закрывать сделки.",
    featuresTitle: "Что умеет ИИ-агент",
    featuresSub: "Возможности для роста и автоматизации общения во всех ключевых каналах.",
    pricingDesc: "Выберите подходящий объем сообщений. Лимиты сообщений обновляются каждый месяц.",
    perMonth: "/мес",
    planPopular: "Популярно",
    planFreeSubtitle: "Попробуйте без оплаты",
    planFreeBtn: "Начать бесплатно",
    planFreeFeatures: ['100 ИИ-сообщений', '1 канал (WhatsApp и Telegram)', 'ИИ-обработка 24/7', 'База знаний PDF / TXT'],
    planStarterSubtitle: "Для небольших проектов",
    planStarterBtn: "Выбрать Starter",
    planStarterFeatures: ['1 000 ИИ-сообщений', '1 канал (WhatsApp и Telegram)', 'ИИ-обработка 24/7', 'База знаний PDF / TXT'],
    planUpgradeNote: "При нехватке лимита вы можете в любой момент перейти на тариф выше. Баланс сообщений обновляется ежемесячно.",
    planGrowthSubtitle: "Для команд с активным трафиком и растущих продаж",
    planGrowthBtn: "Выбрать Growth",
    planGrowthFeatures: ['6 000 ИИ-сообщений', 'До 3 каналов связи', 'ИИ-обработка 24/7', 'База знаний PDF / TXT', 'Раздел "Диалоги" (Live-чат)'],
    planProSubtitle: "Для крупных проектов, интеграторов и агентств",
    planProBtn: "Выбрать Pro",
    planProFeatures: ['15 000 ИИ-сообщений', 'Неограниченные каналы', 'ИИ-обработка 24/7', 'База знаний PDF / TXT', 'Раздел "Диалоги" (Live-чат)'],
    stat2Value: "8 сек",
    stat3Value: "до 80%",
    businessTypes: ['E-commerce', 'Автосалон', 'Онлайн-школа', 'Услуги / Агентство', 'Другое'],
    footerCompanyName: 'ТОО "SAAMA GROUP", БИН: 171040010072',
    footerAddress: 'Юридический адрес: 140000, Республика Казахстан, г. Павлодар, улица Малахова, дом 11',
    footerContacts: 'Контакты: +7 777 420-19-89 | geducation1017@gmail.com',
    footerHours: 'График работы службы поддержки: Пн-Пт: 09:00 - 18:00 (GMT+5)',
    faqItems: [
      { q: 'Сколько времени занимает запуск ИИ-агента?', a: 'Всего несколько минут! В нашем быстром мастере вы выбираете мессенджер, указываете название компании, её сферу и тональность общения. Сразу после этого ИИ готов к первичному диалогу.' },
      { q: 'Нужны ли технические специалисты для настройки?', a: 'Нет, абсолютно. Платформа UP-CHAT спроектирована как no-code инструмент. Вам не нужно писать код, настраивать сервера или привлекать программистов.' },
      { q: 'В какие каналы можно подключить ИИ-агента?', a: 'На текущий момент вы можете без труда подключить своего ИИ-агента к мессенджерам Telegram и WhatsApp.' },
      { q: 'Может ли агент полностью заменить менеджера?', a: 'ИИ-агент берет на себя рутину: приветствие, сбор контактных данных, консультацию по графику и услугам. В случае сложного вопроса диалог сохраняется в разделе «Диалоги», и живой оператор может бесшовно подключиться к переписке.' }
    ]
  },
  KZ: {
    heroTitle1: "Сату мен қолдауды автоматтандыру үшін ",
    heroTitleHighlight: "ЖИ-агенттерін қосыңыз",
    heroSub: "Қолдау көрсету мен сатуды ақылды агенттерге тапсырыңыз. Жеке білім базаңызды қосып, WhatsApp және Telegram желілерінде жұмыс істеңіз.",
    createAgentBtn: "ЖИ агентін жасау",
    interactiveDemoBtn: "Ботты бірнеше рет нұқып жасау",
    features: "Мүмкіндіктер",
    pricing: "Тарифтер",
    company: "Компания",
    privacy: "Құпиялылық саясаты",
    terms: "Пайдалану шарттары",
    offer: "Жария оферта",
    cabinet: "Жеке кабинет",
    signIn: "Кіру",
    getStarted: "Тегін бастау",
    product: "Өнім",
    partnership: "Серіктестік",
    allSystemsOperational: "Барлық жүйелер қалыпты жұмыс істеуде",
    buildToday: "Кастомды шешімдер мен серіктестік",
    buildTodaySub: "CRM/ERP жүйесімен интеграция қажет пе? Сұрақтарыңызды қалдырыңыз, біз көмектесеміз.",
    nameLabel: "Атыңыз",
    phoneLabel: "Телефон нөмірі (WhatsApp)",
    businessTypeLabel: "Бизнес саласы",
    messageLabel: "ЖИ-бот қандай мәселені шешуі керек?",
    sendRequest: "Сұранысты жіберу",
    requestSent: "Сұраныс қабылданды!",
    requestSentSub: "Маман жұмыс күні ішінде сізге хабарласады.",
    aboutUs: "Біз туралы",
    solutions: "Шешімдер",
    featuresTab: "Мүмкіндіктер",
    pricingTab: "Тарифтер",
    mockupConversations: "Өңделген диалогтар",
    mockupToday: "бүгін +12%",
    mockupLeads: "Жиналған лидтер",
    mockupSupportLoad: "Қолдау жүктемесі",
    mockupAiAnswers: "92% ЖИ-жауаптар",
    mockupLiveChat: "Тікелей әңгіме",
    mockupWhatsAppChat: "WhatsApp чаты",
    mockupUserMsg: "Сәлем! Алматыға жеткізуге тапсырыс бергім келеді. Мерзімі қандай?",
    mockupBotMsg: "Сәлеметсіз бе! 🚚 Алматыға 1-2 күнде жеткіземіз. Тапсырысты қазір ресімдейміз бе?",
    mockupResponseTime: "ЖИ жауап беру уақыты",
    mockupSeconds: "0.8 секунд ⚡",
    mockupTimeSaved: "Үнемделген уақыт",
    mockupHours: "айына 148 сағат",
    scenariosSubtitle: "ЖИ-диалогтардың сценарийлері",
    scenariosTitle: "ЖИ-агент чатта тапсырмаларды қалай шешетінін көрсетеміз",
    scenariosWhatAgentDoes: "ЖИ-агент не істейді:",
    scenariosOnline: "ЖИ желіде",
    scenariosInputPlaceholder: "Хабарлама...",
    aboutSubtitle: "Платформа туралы",
    aboutTitle: "UP-CHAT көмегімен бизнес көбірек өтінімдер мен сатылымдар алады",
    aboutDescription: "ЖИ-көмекші кез келген уақытта сұраныстарға бірден жауап береді, клиенттер туралы деректерді жинайды, өтінімдерді таратады және менеджерлерге мәмілелерді тезірек жабуға көмектеседі.",
    stat1Title: "Жауаптардың дәлдігі",
    stat1Desc: "Нақты бизнес-кейстердегі UP-CHAT ЖИ-көмекшілерінің дәлдігі білім базасының арқасында рекордтық көрсеткіштерге жетеді.",
    stat2Title: "Орташа жауап беру уақыты",
    stat2Desc: "ЖИ-көмекші кіріс хабарламаны бірден өңдейді және клиенттерге кезексіз әрі кешігусіз жауап береді.",
    stat3Title: "Рутина автоматтандырылды",
    stat3Desc: "ЖИ сату воронкасындағы сұрақтардың көпшілігін өз мойнына алып, операторларды күрделі тапсырмаларға босатады.",
    featuresSectionTitle: "ЖИ-агент не істей алады",
    featuresSectionSub: "Барлық негізгі арналардағы қарым-қатынасты дамыту және автоматтандыру мүмкіндіктері.",
    feature1Title: "WhatsApp & Telegram арналары",
    feature1Desc: "ЖИ-агент барлық танымал мессенджерлерде жұмыс істейді және бірінші контактіден бастап клиенттермен толыққанды диалог жүргізеді.",
    feature2Title: "PDF / TXT білім базасы",
    feature2Desc: "Агентті компания регламенттеріне, нұсқаулықтарға және скрипттерге оңай үйретіңіз. Ақпарат бірнеше секундта игеріледі.",
    feature3Title: "Оператормен тікелей чат",
    feature3Desc: "Ыңғайлы «Диалогтар» бөлімі жауаптардың сапасын бақылауға және клиентпен диалогты қолмен ауыстыруға мүмкіндік береді.",
    stepsTitle: "ЖИ-ді бірнеше қадаммен баптаңыз",
    stepsSub: "ЖИ-дің барлық сценарийлері, жауаптары мен логикасы қарапайым веб-интерфейс арқылы орнатылады — кодтау қажет емес.",
    step1Title: "Агентті құрыңыз",
    step1Desc: "Компания атауын көрсетіп, бизнес бағытыңызды таңдаңыз.",
    step2Title: "Промптты баптаңыз",
    step2Desc: "Қарым-қатынас стилін (тон) және ЖИ-агенттің негізгі мақсатын таңдаңыз.",
    step3Title: "Білім базасын жүктеңіз",
    step3Desc: "Регламенттер мен скрипттері бар PDF немесе TXT файлдарын жүктеңіз.",
    step4Title: "Арналарды қосыңыз",
    step4Desc: "WhatsApp немесе Telegram аккаунттарын байланыстырып, ботты іске қосыңыз.",
    pricingSubtitle: "Тарифтік жоспарлар",
    pricingTitle: "Пайдалану құны",
    pricingSub: "Қолайлы хабарлама көлемін таңдаңыз. Хабарлама лимиттері ай сайын жаңарып отырады.",
    planFreeDesc: "Тегін байқап көріңіз",
    planStarterDesc: "Шағын жобалар үшін",
    planPopularBadge: "Танымал ⭐",
    planGrowthDesc: "Белсенді трафигі мен сатылымы өсіп жатқан командалар үшін",
    planProDesc: "Ірі жобалар, агенттіктер мен интеграторлар үшін",
    planStarterNote: "Лимит жеткіліксіз болса, кез келген уақытта жоғары тарифке өте аласыз. Хабарламалар балансы ай сайын жаңартылады.",
    btnStartFree: "Тегін бастау",
    btnSelectStarter: "Starter таңдау",
    btnSelectGrowth: "Growth таңдау",
    btnSelectPro: "Pro таңдау",
    featFree1: "100 ЖИ-хабарламасы",
    featFree2: "1 арна (WhatsApp және Telegram)",
    featFree3: "ЖИ-өңдеу 24/7",
    featFree4: "PDF / TXT білім базасы",
    featStarter1: "1 000 ЖИ-хабарламасы",
    featGrowth1: "6 000 ЖИ-хабарламасы",
    featGrowth2: "3 арнаға дейін",
    featGrowth5: "«Диалогтар» бөлімі (Тікелей чат)",
    featPro1: "15 000 ЖИ-хабарламасы",
    featPro2: "Шектеусіз арналар",
    faqTitle: "Жиі қойылатын сұрақтар",
    faqQ1: "ЖИ-агентті іске қосу қанша уақытты алады?",
    faqA1: "Бар болғаны бірнеше минут! Біздің жылдам шеберімізде сіз мессенджерді таңдайсыз, компания атауын, оның саласын және сөйлесу мәнерін көрсетесіз. Осыдан кейін ЖИ алғашқы сұрақтарға жауап беруге дайын.",
    faqQ2: "Баптау үшін техникалық мамандар қажет пе?",
    faqA2: "Жоқ, мүлдем. UP-CHAT платформасы no-code құралы ретінде жасалған. Сізге код жазу, серверлерді баптау немесе бағдарламашыларды тарту қажет емес.",
    faqQ3: "ЖИ-агентті қандай арналарға қосуға болады?",
    faqA3: "Қазіргі уақытта сіз өзіңіздің ЖИ-агентіңізді Telegram және WhatsApp мессенджерлеріне оңай қоса аласыз.",
    faqQ4: "Агент менеджерді толық алмастыра ала ма?",
    faqA4: "ЖИ-агент күнделікті рутинаны өз мойнына алады: амандасу, байланыс деректерін жинау, жұмыс кестесі мен қызметтер бойынша кеңес беру. Күрделі сұрақ туындаған жағдайда, чат «Диалогтар» бөлімінде сақталады және оператор кедергісіз жалғастыра алады.",
    businessTypeServices: "Қызметтер / Агенттік",
    businessTypeOther: "Басқа",
    messagePlaceholder: "Сізді қандай кастомды серіктестік шешімі қызықтырады?",
    companyRegInfo: "«SAAMA GROUP» ЖШС, БСН: 171040010072",
    companyAddressInfo: "Заңды мекенжайы: 140000, Қазақстан Республикасы, Павлодар қ., Малахов көшесі, 11-үй",
    companyContactsInfo: "Байланыс телефондары: +7 777 420-19-89 | geducation1017@gmail.com",
    companySupportHours: "Қолдау қызметінің жұмыс кестесі: Дс-Жм: 09:00 - 18:00 (GMT+5)",
    footerCopyright: "Барлық құқықтар қорғалған.",
    namePlaceholder: "Атыңыз",
    aboutDesc: "ЖИ-көмекші кез келген уақытта сұраныстарға бірден жауап береді, клиенттер туралы деректерді жинайды, өтінімдерді таратады және менеджерлерге мәмілелерді тезірек жабуға көмектеседі.",
    featuresTitle: "ЖИ-агент не істей алады",
    featuresSub: "Барлық негізгі арналардағы қарым-қатынасты дамыту және автоматтандыру мүмкіндіктері.",
    pricingDesc: "Қолайлы хабарлама көлемін таңдаңыз. Хабарлама лимиттері ай сайын жаңарып отырады.",
    perMonth: "/ай",
    planPopular: "Танымал",
    planFreeSubtitle: "Тегін байқап көріңіз",
    planFreeBtn: "Тегін бастау",
    planFreeFeatures: ['100 ЖИ-хабарламасы', '1 арна (WhatsApp және Telegram)', 'ЖИ-өңдеу 24/7', 'PDF / TXT білім базасы'],
    planStarterSubtitle: "Шағын жобалар үшін",
    planStarterBtn: "Starter таңдау",
    planStarterFeatures: ['1 000 ЖИ-хабарламасы', '1 арна (WhatsApp және Telegram)', 'ЖИ-өңдеу 24/7', 'PDF / TXT білім базасы'],
    planUpgradeNote: "Лимит жеткіліксіз болса, кез келген уақытта жоғары тарифке өте аласыз. Хабарламалар балансы ай сайын жаңартылады.",
    planGrowthSubtitle: "Белсенді трафигі мен сатылымы өсіп жатқан командалар үшін",
    planGrowthBtn: "Growth таңдау",
    planGrowthFeatures: ['6 000 ЖИ-хабарламасы', '3 арнаға дейін', 'ЖИ-өңдеу 24/7', 'PDF / TXT білім базасы', '«Диалогтар» бөлімі (Тікелей чат)'],
    planProSubtitle: "Ірі жобалар, агенттіктер мен интеграторлар үшін",
    planProBtn: "Pro таңдау",
    planProFeatures: ['15 000 ЖИ-хабарламасы', 'Шектеусіз арналар', 'ЖИ-өңдеу 24/7', 'PDF / TXT білім базасы', '«Диалогтар» бөлімі (Тікелей чат)'],
    stat2Value: "8 сек",
    stat3Value: "80%-ға дейін",
    businessTypes: ['E-commerce', 'Автосалон', 'Онлайн-мектеп', 'Қызметтер / Агенттік', 'Басқа'],
    footerCompanyName: '«SAAMA GROUP» ЖШС, БСН: 171040010072',
    footerAddress: 'Заңды мекенжайы: 140000, Қазақстан Республикасы, Павлодар қ., Малахов көшесі, 11-үй',
    footerContacts: 'Байланыс: +7 777 420-19-89 | geducation1017@gmail.com',
    footerHours: 'Қолдау қызметі: Дс-Жм: 09:00 - 18:00 (GMT+5)',
    faqItems: [
      { q: 'ЖИ-агентті іске қосу қанша уақытты алады?', a: 'Бар болғаны бірнеше минут! Біздің жылдам шеберімізде мессенджерді таңдайсыз, компания атауын, саласын және сөйлесу мәнерін көрсетесіз. Осыдан кейін ЖИ алғашқы сұрақтарға жауап беруге дайын.' },
      { q: 'Баптау үшін техникалық мамандар қажет пе?', a: 'Жоқ, мүлдем. UP-CHAT платформасы no-code құралы ретінде жасалған. Сізге код жазу, серверлерді баптау немесе бағдарламашыларды тарту қажет емес.' },
      { q: 'ЖИ-агентті қандай арналарға қосуға болады?', a: 'Қазіргі уақытта ЖИ-агентіңізді Telegram және WhatsApp мессенджерлеріне оңай қоса аласыз.' },
      { q: 'Агент менеджерді толық алмастыра ала ма?', a: 'ЖИ-агент рутинаны өз мойнына алады: амандасу, байланыс деректерін жинау, кесте мен қызметтер бойынша кеңес беру. Күрделі сұрақ туындаса, чат «Диалогтар» бөлімінде сақталады және оператор кедергісіз жалғастыра алады.' }
    ]
  }
};

export default function LandingPage() {
  const { t: globalT, language, setLanguage } = useLanguage();
  const { user } = useAuth();
  const router = useRouter();

  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    businessType: 'E-commerce',
    message: ''
  });

  // Scenario state
  const [activeScenarioId, setActiveScenarioId] = useState('beauty');
  const [visibleMsgCount, setVisibleMsgCount] = useState(1);
  const [typing, setTyping] = useState(false);

  // Rotating words typewriter effect
  const rotatingWords = language === 'EN' 
    ? ['sales', 'support', 'clients', 'routine'] 
    : language === 'KZ' 
      ? ['сатуды', 'қолдауды', 'клиенттерді', 'рутинаны'] 
      : ['продаж', 'поддержки', 'клиентов', 'рутины'];
  const [wordIdx, setWordIdx] = useState(0);
  const [subWord, setSubWord] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const t = { ...globalT, ...localT[language as keyof typeof localT] };

  const demoScenarios = [
    {
      id: 'beauty',
      name: language === 'EN' ? 'Beauty Salons' : language === 'KZ' ? 'Сұлулық салондары' : 'Салоны красоты',
      iconSrc: '/beauty-icon.png',
      features: language === 'EN' ? [
        'Manages appointments and checks slot availability',
        'Consults on services, times, and booking terms, answers questions',
        'Integrates with calendars and booking systems'
      ] : language === 'KZ' ? [
        'Жазылуды жүргізеді және бос уақыттарды тексереді',
        'Қызметтер, уақыт және жазылу шарттары бойынша кеңес береді, сұрақтарға жауап береді',
        'Күнтізбелермен және брондау жүйелерімен жұмыс істейді'
      ] : [
        'Ведёт запись и проверяет доступность слотов',
        'Консультирует по услугам, времени и условиям записи, отвечает на вопросы',
        'Работает с календарями и системами бронирования'
      ],
      messages: language === 'EN' ? [
        { sender: 'user', text: 'Hi! I want to book a haircut and coloring for tomorrow after 14:00.' },
        { sender: 'bot', text: 'Hello! 🌸 I would love to help. For tomorrow after 14:00 we have open slots at 15:00 and 17:30 with our top stylist Alina. Which time works best for you?' },
        { sender: 'user', text: "Let's do 15:00. How long will it take?" },
        { sender: 'bot', text: 'Great, booked you for 15:00! The procedure will take about 2.5 hours. I will send you a reminder one hour before your visit. See you! 😊' }
      ] : language === 'KZ' ? [
        { sender: 'user', text: 'Сәлеметсіз бе! Ертең сағат 14:00-ден кейін шаш қию мен бояуға жазылғым келеді.' },
        { sender: 'bot', text: 'Сәлеметсіз бе! 🌸 Қуана көмектесемін. Ертең 14:00-ден кейін сағат 15:00 және 17:30-да топ-стилист Алинада бос уақыт бар. Қай уақыт сізге ыңғайлы?' },
        { sender: 'user', text: 'Сағат 15:00 болсын. Ол қанша уақыт алады?' },
        { sender: 'bot', text: 'Тамаша, сізді сағат 15:00-ге жаздым! Процедура шамамен 2.5 сағат алады. Келуден бір сағат бұрын сізге ескерту жіберемін. Күтеміз! 😊' }
      ] : [
        { sender: 'user', text: 'Привет! Хочу записаться на стрижку и окрашивание на завтра после 14:00.' },
        { sender: 'bot', text: 'Привет! 🌸 С удовольствием помогу. На завтра после 14:00 есть свободные slots на 15:00 и 17:30 к топ-стилисту Алине. Какое время вам подходит больше?' },
        { sender: 'user', text: 'Давайте на 15:00. А сколько по времени это займет?' },
        { sender: 'bot', text: 'Отлично, забронировала для вас 15:00! Процедура займет около 2.5 часов. За час до визита я пришлю вам напоминание. Ждем вас! 😊' }
      ]
    },
    {
      id: 'travel',
      name: language === 'EN' ? 'Travel Agencies' : language === 'KZ' ? 'Туристік компаниялар' : 'Туристические компании',
      iconSrc: '/travel-icon.png',
      features: language === 'EN' ? [
        'Selects tours based on preferences and budget',
        'Answers visa, hotel, and transfer questions 24/7',
        'Collects contacts for handoff to a manager'
      ] : language === 'KZ' ? [
        'Қалаулар мен бюджет бойынша турларды таңдайды',
        'Визалар, қонақүйлер және трансфер туралы сұрақтарға 24/7 жауап береді',
        'Менеджерге беру үшін контактілерді жинайды'
      ] : [
        'Подбирает туры по предпочтениям и бюджету',
        'Отвечает на вопросы о визах, отелях и трансфере 24/7',
        'Собирает контакты для передачи менеджеру'
      ],
      messages: language === 'EN' ? [
        { sender: 'user', text: 'Hello, looking for a tour to Egypt for two at the end of June, budget up to 800k tenge.' },
        { sender: 'bot', text: 'Hello! ☀️ Great choice. For the end of June within your budget, I can suggest a lovely 5* hotel in Sharm El Sheikh (all inclusive, direct flight). Would you like to see a detailed description of the hotel?' },
        { sender: 'user', text: 'Yes, please send it.' },
        { sender: 'bot', text: 'Here is the info. Leave your contact phone number (WhatsApp), I will send you a detailed estimate and help you book!' }
      ] : language === 'KZ' ? [
        { sender: 'user', text: 'Сәлеметсіз бе, маусымның соңында екі адамға Мысырға тур іздеп жүрмін, бюджеті 800 мың теңгеге дейін.' },
        { sender: 'bot', text: 'Сәлеметсіз бе! ☀️ Тамаша таңдау. Маусымның соңында сіздің бюджетіңіз шегінде Шарм-эль-Шейхтегі керемет 5* қонақүйді ұсына аламын (барлығы қосылған, тікелей рейс). Қонақүйдің толық сипаттамасын көргіңіз келе ме?' },
        { sender: 'user', text: 'Иә, жіберіңізші.' },
        { sender: 'bot', text: 'Міне ақпарат. Байланыс телефоныңызды қалдырыңыз (WhatsApp), мен сізге толық сметаны жіберіп, брондауға көмектесемін!' }
      ] : [
        { sender: 'user', text: 'Здравствуйте, ищу тур в Египет на двоих в конце июня, бюджет до 800 тыс. тенге.' },
        { sender: 'bot', text: 'Здравствуйте! ☀️ Отличный выбор. На конец июня в рамках вашего бюджета могу предложить прекрасный отель 5* в Шарм-эль-Шейхе (все включено, прямой перелет). Хотите посмотреть подробное описание отеля?' },
        { sender: 'user', text: 'Да, пришлите, пожалуйста.' },
        { sender: 'bot', text: 'Вот информация. Оставьте ваш контактный номер телефона (WhatsApp), я отправлю вам подробную смету и помогу забронировать!' }
      ]
    },
    {
      id: 'consult',
      name: language === 'EN' ? 'Services & Consulting' : language === 'KZ' ? 'Қызметтер мен консалтинг' : 'Услуги и консалтинг',
      iconSrc: '/consulting-icon.png',
      features: language === 'EN' ? [
        'Answers questions about rates and company services',
        'Qualifies leads before passing them to a manager',
        'Saves the entire history of interactions'
      ] : language === 'KZ' ? [
        'Компанияның тарифтері мен қызметтері туралы сұрақтарға жауап береді',
        'Лидтерді менеджерге өткізбес бұрын біліктілігін тексереді',
        'Барлық өтініштер тарихын сақтайды'
      ] : [
        'Отвечает на вопросы о тарифах и услугах компании',
        'Квалифицирует лиды перед передачей менеджеру',
        'Сохраняет всю историю обращений'
      ],
      messages: language === 'EN' ? [
        { sender: 'user', text: 'Good day. What are your terms for a sales department audit?' },
        { sender: 'bot', text: 'Good day! 💼 We conduct a comprehensive audit in 5 business days: we analyze calls, CRM, and the incentive system. Tell me, how many managers are currently in your department?' },
        { sender: 'user', text: 'Currently 6 people.' },
        { sender: 'bot', text: 'Got it. For a department of 6 people, the audit cost is 120,000 tenge. Leave your contact number, our analyst will contact you to coordinate details!' }
      ] : language === 'KZ' ? [
        { sender: 'user', text: 'Қайырлы күн. Сату бөлімінің аудиті бойынша сізде қандай шарттар бар?' },
        { sender: 'bot', text: 'Қайырлы күн! 💼 Біз 5 жұмыс күні ішінде кешенді аудит жүргіземіз: қоңырауларды, CRM және мотивация жүйесін талдаймыз. Айтыңызшы, қазір сіздің бөлімде қанша менеджер бар?' },
        { sender: 'user', text: 'Қазір 6 адам.' },
        { sender: 'bot', text: 'Түсіндім. 6 адамнан тұратын бөлім үшін аудит құны 120 000 теңгені құрайды. Байланыс нөміріңізді қалдырыңыз, біздің аналитик мәліметтерді келісу үшін сізбен байланысады!' }
      ] : [
        { sender: 'user', text: 'Добрый день. Какие у вас условия по аудиту отдела продаж?' },
        { sender: 'bot', text: 'Добрый день! 💼 Мы проводим комплексный аудит за 5 рабочих дней: анализируем звонки, CRM и систему мотивации. Подскажите, сколько менеджеров сейчас в вашем отделе?' },
        { sender: 'user', text: 'Сейчас 6 человек.' },
        { sender: 'bot', text: 'Поняла. Для отдела из 6 человек стоимость аудита составит 120 000 тенге. Оставьте ваш контактный номер, наш аналитик свяжется с вами для согласования деталей!' }
      ]
    }
  ];

  const currentScenario = demoScenarios.find(s => s.id === activeScenarioId) || demoScenarios[0];

  useEffect(() => {
    let timer: NodeJS.Timeout;
    const currentWord = rotatingWords[wordIdx];
    const typeSpeed = isDeleting ? 40 : 80;

    if (!isDeleting && subWord === currentWord) {
      timer = setTimeout(() => setIsDeleting(true), 2500);
    } else if (isDeleting && subWord === '') {
      setIsDeleting(false);
      setWordIdx((prev) => (prev + 1) % rotatingWords.length);
    } else {
      timer = setTimeout(() => {
        setSubWord(prev => 
          isDeleting 
            ? currentWord.substring(0, prev.length - 1) 
            : currentWord.substring(0, prev.length + 1)
        );
      }, typeSpeed);
    }

    return () => clearTimeout(timer);
  }, [subWord, isDeleting, wordIdx]);

  useEffect(() => {
    setVisibleMsgCount(1);
    setTyping(false);
  }, [activeScenarioId]);

  useEffect(() => {
    if (visibleMsgCount < currentScenario.messages.length) {
      const isNextBot = currentScenario.messages[visibleMsgCount].sender === 'bot';
      const delay = isNextBot ? 1800 : 1200;
      
      const timer = setTimeout(() => {
        if (isNextBot) {
          setTyping(true);
          const typingTimer = setTimeout(() => {
            setTyping(false);
            setVisibleMsgCount(prev => prev + 1);
          }, 1000);
          return () => clearTimeout(typingTimer);
        } else {
          setVisibleMsgCount(prev => prev + 1);
        }
      }, delay);

      return () => clearTimeout(timer);
    }
  }, [visibleMsgCount, activeScenarioId, currentScenario]);

  const handleContactForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone) return;
    setFormSubmitted(true);
    setFormData({
      name: '',
      phone: '',
      businessType: 'E-commerce',
      message: ''
    });
  };

  return (
    <div className="font-body-md text-slate-800 bg-[#FAFBFD] min-h-screen relative overflow-hidden">
      
      {/* Dynamic Radial Background Gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none -z-10"></div>
      <div className="absolute bottom-[20%] right-[-10%] w-[60%] h-[60%] bg-blue-500/5 rounded-full blur-[140px] pointer-events-none -z-10"></div>
      <div className="absolute top-[40%] right-[10%] w-[40%] h-[40%] bg-emerald-400/5 rounded-full blur-[120px] pointer-events-none -z-10"></div>

      <style jsx global>{`
        body {
          background-color: #FAFBFD;
          font-family: var(--font-inter), -apple-system, sans-serif;
          color: #1E293B;
          letter-spacing: -0.01em;
        }
        .heading-font {
          font-family: var(--font-space-grotesk), -apple-system, sans-serif;
        }
        .thin-border {
          border: 1px solid rgba(226, 232, 240, 0.7);
        }
        .glass-header {
          background: rgba(250, 251, 253, 0.85);
          backdrop-filter: blur(14px);
          border-bottom: 1px solid rgba(226, 232, 240, 0.5);
        }
        .pricing-card {
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .pricing-card:hover {
          transform: translateY(-5px);
          border-color: #10b981;
          box-shadow: 0 22px 45px -15px rgba(16, 185, 129, 0.1);
        }
        @keyframes blink {
          50% { opacity: 0.3; }
        }
        .typing-dot {
          animation: blink 1s infinite;
        }
        .animate-fade-in {
          animation: fadeIn 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .animate-slide-up {
          animation: slideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .cursor-blink::after {
          content: '|';
          color: #10b981;
          animation: blink 0.8s infinite;
          font-weight: 400;
        }
        .hero-mockup-card {
          transform: none;
          box-shadow: 0 15px 35px -10px rgba(0,0,0,0.2), 0 0 30px 0 rgba(16,185,129,0.04);
        }
        @media (min-width: 1024px) {
          .hero-mockup-card {
            transform: perspective(1200px) rotateY(-8deg) rotateX(4deg);
            transform-style: preserve-3d;
            box-shadow: 0 30px 60px -15px rgba(0,0,0,0.3), 0 0 50px 0 rgba(16,185,129,0.06);
          }
        }
      `}</style>

      {/* Header */}
      <header className="glass-header sticky top-0 w-full z-50">
        <div className="flex justify-between items-center max-w-7xl mx-auto px-4 sm:px-6 h-16">
          <Link href="/landing" className="flex items-center gap-2 select-none cursor-pointer">
            <img src="/logo.jpg" alt="Logo" style={{ width: '32px', height: '32px', borderRadius: '8px', objectFit: 'cover' }} />
            <span className="font-semibold text-lg tracking-tight heading-font text-slate-900">UP-CHAT</span>
          </Link>

          <nav className="hidden md:flex gap-8 items-center">
            <a className="text-sm font-medium text-slate-500 hover:text-emerald-600 transition-colors" href="#about-us">
              {t.aboutUs}
            </a>
            <a className="text-sm font-medium text-slate-500 hover:text-emerald-600 transition-colors" href="#scenarios">
              {t.solutions}
            </a>
            <a className="text-sm font-medium text-slate-500 hover:text-emerald-600 transition-colors" href="#features">
              {t.featuresTab}
            </a>
            <a className="text-sm font-medium text-slate-500 hover:text-emerald-600 transition-colors" href="#pricing">
              {t.pricingTab}
            </a>
            <a className="text-sm font-medium text-slate-500 hover:text-emerald-600 transition-colors" href="#contact-section">
              {t.partnership}
            </a>
          </nav>

          <div className="flex items-center gap-2 sm:gap-4">
            <div className="relative">
              <button
                onClick={() => setLangDropdownOpen(!langDropdownOpen)}
                className="flex items-center gap-1 sm:gap-1.5 bg-white border border-slate-200 px-2 py-1.5 sm:px-3 rounded-lg text-xs font-medium text-slate-600 hover:text-emerald-600 hover:border-emerald-600 transition-all select-none cursor-pointer"
              >
                <Globe className="w-3.5 h-3.5" />
                <span>{language}</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>
              {langDropdownOpen && (
                <div className="absolute right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-lg shadow-lg py-1 w-24 z-50">
                  {(['EN', 'RU', 'KZ'] as const).map((lang) => (
                    <button
                      key={lang}
                      onClick={() => {
                        setLanguage(lang);
                        setLangDropdownOpen(false);
                      }}
                      className={`flex items-center justify-between w-full px-3 py-2 text-left text-xs ${
                        language === lang ? 'bg-emerald-50 text-emerald-600 font-semibold' : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <span>{lang}</span>
                      {language === lang && <Check className="w-3 h-3" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {user ? (
              <Link 
                href="/bots" 
                className="bg-slate-900 text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs font-medium hover:bg-slate-800 transition-all active:scale-[0.98]"
              >
                {t.cabinet}
              </Link>
            ) : (
              <>
                <Link href="/login" className="hidden sm:inline-block text-xs font-medium text-slate-600 hover:text-emerald-600 transition-colors">
                  {t.signIn}
                </Link>
                <Link 
                  href="/register" 
                  className="bg-emerald-600 text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs font-medium hover:bg-emerald-700 transition-all active:scale-[0.98]"
                >
                  {t.getStarted}
                </Link>
              </>
            )}

            {/* Mobile burger menu */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden flex flex-col gap-1 p-2 rounded-lg hover:bg-slate-100 transition-colors"
              aria-label="Menu"
            >
              <span className={`block w-5 h-0.5 bg-slate-700 transition-all duration-300 ${mobileMenuOpen ? 'rotate-45 translate-y-1.5' : ''}`} />
              <span className={`block w-5 h-0.5 bg-slate-700 transition-all duration-300 ${mobileMenuOpen ? 'opacity-0' : ''}`} />
              <span className={`block w-5 h-0.5 bg-slate-700 transition-all duration-300 ${mobileMenuOpen ? '-rotate-45 -translate-y-1.5' : ''}`} />
            </button>
          </div>
        </div>

        {/* Mobile dropdown nav */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-slate-100 shadow-lg">
            <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col gap-1">
              {[
                ['#about-us', t.aboutUs],
                ['#scenarios', t.solutions],
                ['#features', t.featuresTab],
                ['#pricing', t.pricingTab],
                ['#contact-section', t.partnership],
              ].map(([href, label]) => (
                <a
                  key={href}
                  href={href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-4 py-3 text-sm font-medium text-slate-700 hover:bg-emerald-50 hover:text-emerald-600 rounded-xl transition-colors"
                >
                  {label}
                </a>
              ))}
              <div className="pt-2 border-t border-slate-100 mt-1 flex gap-2">
                <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="flex-1 text-center py-2.5 text-sm font-medium text-slate-600 hover:text-emerald-600 border border-slate-200 rounded-xl transition-colors">
                  {t.signIn}
                </Link>
                <Link href="/register" onClick={() => setMobileMenuOpen(false)} className="flex-1 text-center py-2.5 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors">
                  {t.getStarted}
                </Link>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-12 space-y-24 sm:space-y-32">
        
        {/* HERO SECTION - REWORKED SPLIT LAYOUT */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center py-12 animate-fade-in">
          <div className="lg:col-span-6 space-y-8 text-left">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-slate-950 heading-font leading-[1.1]">
              <span>{t.heroTitle1}</span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-700 font-extrabold cursor-blink">
                {subWord}
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-500 font-light leading-relaxed max-w-xl">
              {t.heroSub}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 items-center pt-2">
              <Link 
                href={user ? "/bots" : "/register"} 
                className="bg-slate-900 text-white px-8 py-3.5 rounded-lg text-sm font-medium hover:bg-slate-800 transition-all active:scale-[0.98] w-full sm:w-auto text-center shadow-md shadow-slate-900/10"
              >
                {t.createAgentBtn}
              </Link>
              <Link 
                href={user ? "/create-bot" : "/register?redirect=create-bot"} 
                className="bg-white border border-slate-200 text-slate-600 hover:text-slate-950 hover:border-slate-300 px-8 py-3.5 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-all w-full sm:w-auto cursor-pointer"
              >
                <Play className="w-4 h-4 fill-slate-400 stroke-none" />
                <span>{t.interactiveDemoBtn}</span>
              </Link>
            </div>
          </div>

          {/* HERO RIGHT PANEL: PREMIUM MOCKUP OF THE DASHBOARD APP - HIGHLY SELLING VERSION */}
          <div className="lg:col-span-6 relative flex items-center justify-center min-h-[480px] animate-slide-up">
            
            {/* Ambient glowing meshes behind the card */}
            <div className="absolute top-[10%] left-[20%] w-[250px] h-[250px] bg-emerald-500/10 rounded-full blur-[80px] -z-10 animate-pulse"></div>
            <div className="absolute bottom-[10%] right-[10%] w-[220px] h-[220px] bg-blue-500/5 rounded-full blur-[70px] -z-10"></div>

            {/* Outer wrapper: premium dark glass mockup card */}
            <div className="hero-mockup-card w-full max-w-[480px] bg-slate-950/95 border border-slate-800/80 rounded-3xl p-6 relative overflow-hidden">
              
              {/* Header bar */}
              <div className="flex items-center justify-between border-b border-slate-800/60 pb-4 mb-4">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-mono">
                  <Shield size={10} className="text-emerald-500" />
                  <span>app.up-chat.com</span>
                </div>
                <div className="w-6"></div>
              </div>

              {/* Dashboard preview */}
              <div className="space-y-4">
                {/* Stats Row */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-xl relative overflow-hidden">
                    <span className="text-[9px] uppercase text-slate-500 font-semibold tracking-wider block">{t.mockupConversations}</span>
                    <div className="text-2xl font-bold mt-1 text-white heading-font tracking-tight">42 918</div>
                    <span className="text-[9px] text-emerald-400 font-semibold flex items-center gap-0.5 mt-1">
                      <TrendingUp size={10} /> {t.mockupToday}
                    </span>
                  </div>
                  <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-xl relative overflow-hidden">
                    <span className="text-[9px] uppercase text-slate-500 font-semibold tracking-wider block">{t.mockupLeads}</span>
                    <div className="text-2xl font-bold mt-1 text-white heading-font tracking-tight">1 482</div>
                    <span className="text-[9px] text-emerald-400 font-semibold flex items-center gap-0.5 mt-1">
                      <TrendingUp size={10} /> +18.4%
                    </span>
                  </div>
                </div>

                {/* SVG Area Chart inside the card */}
                <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-xl relative overflow-hidden">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">{t.mockupSupportLoad}</span>
                    <span className="text-[9px] bg-emerald-500/15 text-emerald-400 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">{t.mockupAiAnswers}</span>
                  </div>
                  <svg className="w-full h-16 mt-2" viewBox="0 0 100 30" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" stopOpacity="0.35" />
                        <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <path d="M0 25 Q 15 12, 30 20 T 60 7 T 90 2 L 100 2 L 100 30 L 0 30 Z" fill="url(#chartGradient)" />
                    <path d="M0 25 Q 15 12, 30 20 T 60 7 T 90 2" fill="none" stroke="#10b981" strokeWidth="1.5" />
                  </svg>
                </div>

                {/* Live Chat Notification Stream */}
                <div className="bg-slate-950 border border-slate-800/80 p-4 rounded-xl space-y-3 relative">
                  <div className="flex items-center justify-between border-b border-slate-900 pb-2">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                      {t.mockupLiveChat}
                    </span>
                    <span className="text-[9px] text-slate-500">{t.mockupWhatsAppChat}</span>
                  </div>
                  <div className="flex flex-col gap-2.5">
                    <div className="bg-slate-900 text-[11px] p-2.5 rounded-xl max-w-[85%] self-start border border-slate-800/60 text-slate-200">
                      {t.mockupUserMsg}
                    </div>
                    <div className="bg-emerald-600 text-[11px] p-2.5 rounded-xl max-w-[85%] self-end text-white shadow-md shadow-emerald-700/20">
                      {t.mockupBotMsg}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Overlapping Floating badge 1 */}
            <div className="hidden sm:flex absolute top-[8%] right-[-3%] bg-white border border-slate-100/90 px-4 py-3 rounded-2xl shadow-2xl items-center gap-3 animate-bounce" style={{ animationDuration: '5.5s' }}>
              <div className="w-8 h-8 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                <Zap size={14} className="fill-emerald-100 stroke-emerald-600" />
              </div>
              <div>
                <div className="text-[10px] text-slate-400 font-semibold">{t.mockupResponseTime}</div>
                <div className="text-xs font-bold text-slate-900">{t.mockupSeconds}</div>
              </div>
            </div>

            {/* Overlapping Floating badge 2 */}
            <div className="hidden sm:flex absolute bottom-[5%] left-[-3%] bg-white border border-slate-100/90 px-4 py-3 rounded-2xl shadow-2xl items-center gap-3 animate-pulse">
              <div className="w-8 h-8 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
                <CheckCircle2 size={14} className="fill-blue-100 stroke-blue-600" />
              </div>
              <div>
                <div className="text-[10px] text-slate-400 font-semibold">{t.mockupTimeSaved}</div>
                <div className="text-xs font-bold text-slate-900">{t.mockupHours}</div>
              </div>
            </div>
          </div>
        </section>

        {/* INTERACTIVE CHAT SIMULATOR (Бизнес-сценарии) */}
        <section id="scenarios" className="space-y-12 scroll-mt-24">
          <div className="text-center space-y-3">
            <div className="inline-flex items-center gap-1 bg-slate-100 border border-slate-200 px-3 py-1 rounded-full text-xs font-semibold text-slate-600 uppercase tracking-wider">
              {t.scenariosSubtitle}
            </div>
            <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-slate-950 heading-font">
              {t.scenariosTitle}
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Scenarios Tabs & Features */}
            <div className="lg:col-span-6 flex flex-col justify-between gap-6">
              <div className="flex flex-col gap-3">
                {demoScenarios.map((sc) => (
                  <button
                    key={sc.id}
                    onClick={() => setActiveScenarioId(sc.id)}
                    className={`flex items-center gap-3 px-5 py-4 rounded-2xl text-left border cursor-pointer transition-all ${
                      activeScenarioId === sc.id 
                        ? 'bg-white border-slate-200 shadow-md shadow-slate-100/40 text-emerald-600 font-semibold' 
                        : 'bg-transparent border-transparent text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center p-1 shrink-0">
                      <img src={sc.iconSrc} alt={sc.name} className="w-full h-full object-contain" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-slate-900">{sc.name}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">{language === 'EN' ? 'Business chat' : language === 'KZ' ? 'Бизнес-чат' : 'Бизнес-чат'}</div>
                    </div>
                    <ChevronRight size={16} className={`ml-auto text-slate-400 transition-opacity ${activeScenarioId === sc.id ? 'opacity-100' : 'opacity-0'}`} />
                  </button>
                ))}
              </div>

              <div className="bg-slate-50/60 border border-slate-200/50 p-6 rounded-2xl">
                <h4 className="font-semibold text-sm text-slate-900 mb-4">{t.scenariosWhatAgentDoes}</h4>
                <ul className="space-y-3">
                  {currentScenario.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-xs leading-relaxed text-slate-600">
                      <CheckCircle2 size={14} className="text-emerald-600 shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Chat Sandbox Display - NEATLY PLACED INSIDE THE MOBILE PHONE FRAME */}
            <div className="lg:col-span-6 flex justify-center items-center overflow-visible">
              {/* Outer container to match the 1:2 aspect ratio of the cropped phone-frame.png */}
              <div className="relative w-[260px] h-[520px] min-[360px]:w-[280px] min-[360px]:h-[560px] sm:w-[320px] sm:h-[640px] md:w-[340px] md:h-[680px] mx-auto shadow-2xl rounded-[36px]" style={{ boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.35)' }}>
                
                {/* Phone Bezel Frame Image Overlay (Opaque screen center requires placing content ON TOP, so this is z-0 and chat is z-10) */}
                <img 
                  src="/phone-frame.png" 
                  alt="Phone Frame" 
                  className="absolute inset-0 w-full h-full object-contain pointer-events-none z-0" 
                />

                {/* Inner screen content container positioned exactly over the white area of the cropped image (z-10) */}
                <div 
                  className="absolute z-10 overflow-hidden flex flex-col justify-between text-white" 
                  style={{ 
                    top: '2.8%', 
                    bottom: '2.8%', 
                    left: '6.5%', 
                    right: '6.5%', 
                    borderRadius: '28px',
                    background: 'linear-gradient(to bottom, #0B0F19 0%, #1E293B 100%)',
                    padding: '35px 16px 16px 16px'
                  }}
                >
                  
                  {/* Active bot chat header */}
                  <div className="flex items-center gap-2 border-b border-slate-800 pb-2.5 mb-2.5 shrink-0">
                    <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center p-0.5 shrink-0">
                      <img src={currentScenario.iconSrc} alt="" className="w-full h-full object-contain" />
                    </div>
                    <div>
                      <div className="text-[10px] sm:text-xs font-bold text-slate-100 leading-tight">{currentScenario.name}</div>
                      <div className="text-[9px] text-[#10b981] flex items-center gap-1 mt-0.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] animate-pulse"></span> {t.scenariosOnline}
                      </div>
                    </div>
                  </div>

                  {/* Scrollable messages panel with padding on left and right */}
                  <div className="flex-1 flex flex-col gap-3 overflow-y-auto px-1 scrollbar-none">
                    {currentScenario.messages.slice(0, visibleMsgCount).map((msg, index) => {
                      const isUser = msg.sender === 'user';
                      return (
                        <div
                          key={index}
                          className={`px-3 py-2.5 rounded-2xl max-w-[85%] text-[10px] sm:text-[11px] leading-relaxed transition-all duration-300 shadow-sm ${
                            isUser 
                              ? 'self-end bg-emerald-600 text-white rounded-tr-none ml-auto' 
                              : 'self-start bg-slate-800/95 border border-slate-850 text-slate-100 rounded-bl-none'
                          }`}
                        >
                          {msg.text}
                        </div>
                      );
                    })}

                    {typing && (
                      <div className="self-start bg-slate-800/95 border border-slate-850 py-2.5 px-3.5 rounded-2xl rounded-bl-none flex gap-1 items-center w-12">
                        <div className="typing-dot w-1 h-1 rounded-full bg-white"></div>
                        <div className="typing-dot w-1 h-1 rounded-full bg-white" style={{ animationDelay: '0.2s' }}></div>
                        <div className="typing-dot w-1 h-1 rounded-full bg-white" style={{ animationDelay: '0.4s' }}></div>
                      </div>
                    )}
                  </div>

                  {/* Mock message input at the bottom of the screen */}
                  <div className="mt-2.5 pt-2.5 border-t border-slate-800/80 shrink-0">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder={t.scenariosInputPlaceholder}
                        disabled
                        className="flex-1 bg-slate-900/60 border border-slate-850 rounded-xl px-3 py-2 text-[9px] sm:text-[10px] text-slate-500 outline-none"
                      />
                      <button className="bg-emerald-600 text-white rounded-xl w-8 h-8 flex items-center justify-center shrink-0">
                        <Send size={11} />
                      </button>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          </div>
        </section>

        {/* STATISTICS / ABOUT US */}
        <section id="about-us" className="space-y-16 scroll-mt-24">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <div className="inline-flex items-center gap-1 bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-full text-xs font-semibold text-emerald-700 uppercase tracking-wider">
              {t.aboutSubtitle}
            </div>
            <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-slate-950 heading-font">
              {t.aboutTitle}
            </h2>
            <p className="text-slate-500 text-base font-light leading-relaxed">
              {t.aboutDesc}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white thin-border rounded-2xl p-8 space-y-4 shadow-sm text-center flex flex-col items-center">
              <div className="w-16 h-16 rounded-2xl bg-emerald-50/50 border border-emerald-100/50 flex items-center justify-center p-3 animate-pulse" style={{ animationDuration: '4s' }}>
                <img src="/target-icon.png" alt="Точность ответов" className="w-full h-full object-contain" />
              </div>
              <div className="space-y-2">
                <div className="text-4xl font-extrabold text-emerald-600 heading-font">98,8%</div>
                <h4 className="font-semibold text-slate-900 text-sm">{t.stat1Title}</h4>
                <p className="text-slate-500 text-xs font-light leading-relaxed">
                  {t.stat1Desc}
                </p>
              </div>
            </div>
            <div className="bg-white thin-border rounded-2xl p-8 space-y-4 shadow-sm text-center flex flex-col items-center">
              <div className="w-16 h-16 rounded-2xl bg-emerald-50/50 border border-emerald-100/50 flex items-center justify-center p-3 animate-pulse" style={{ animationDuration: '5s' }}>
                <img src="/clock-icon.png" alt="Среднее время ответа" className="w-full h-full object-contain" />
              </div>
              <div className="space-y-2">
                <div className="text-4xl font-extrabold text-emerald-600 heading-font">{t.stat2Value}</div>
                <h4 className="font-semibold text-slate-900 text-sm">{t.stat2Title}</h4>
                <p className="text-slate-500 text-xs font-light leading-relaxed">
                  {t.stat2Desc}
                </p>
              </div>
            </div>
            <div className="bg-white thin-border rounded-2xl p-8 space-y-4 shadow-sm text-center flex flex-col items-center">
              <div className="w-16 h-16 rounded-2xl bg-emerald-50/50 border border-emerald-100/50 flex items-center justify-center p-3 animate-pulse" style={{ animationDuration: '6s' }}>
                <img src="/automation-icon.png" alt="Рутины автоматизировано" className="w-full h-full object-contain" />
              </div>
              <div className="space-y-2">
                <div className="text-4xl font-extrabold text-emerald-600 heading-font">{t.stat3Value}</div>
                <h4 className="font-semibold text-slate-900 text-sm">{t.stat3Title}</h4>
                <p className="text-slate-500 text-xs font-light leading-relaxed">
                  {t.stat3Desc}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* FEATURES */}
        <section id="features" className="space-y-16 scroll-mt-24">
          <div className="text-center space-y-3">
            <h2 className="text-3xl font-semibold tracking-tight text-slate-950 heading-font">
              {t.featuresTitle}
            </h2>
            <p className="text-slate-500 text-sm max-w-xl mx-auto">
              {t.featuresSub}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white thin-border rounded-2xl p-8 space-y-4 shadow-sm flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex gap-2">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center p-1.5 shadow-sm">
                    <img src="/whatsapp-icon.png" alt="WhatsApp" className="w-full h-full object-contain" />
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center p-1.5 shadow-sm">
                    <img src="/telegram-icon.png" alt="Telegram" className="w-full h-full object-contain" />
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-slate-900 heading-font">{t.feature1Title}</h3>
                <p className="text-slate-500 text-sm font-light leading-relaxed">
                  {t.feature1Desc}
                </p>
              </div>
              <div className="flex gap-2.5 pt-2 border-t border-slate-100">
                <span className="text-[10px] uppercase font-bold text-emerald-600 tracking-wider flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span> WhatsApp Business API
                </span>
                <span className="text-[10px] uppercase font-bold text-blue-500 tracking-wider flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping"></span> Telegram Bot
                </span>
              </div>
            </div>

            <div className="bg-white thin-border rounded-2xl overflow-hidden shadow-sm flex flex-col justify-between" style={{ minHeight: '340px' }}>
              <div className="p-8 pb-2 space-y-3">
                <h3 className="text-lg font-semibold text-slate-900 heading-font">{t.feature2Title}</h3>
                <p className="text-slate-500 text-sm font-light leading-relaxed">
                  {t.feature2Desc}
                </p>
              </div>
              <div className="w-full flex items-end justify-center bg-gradient-to-b from-white to-slate-50/50 mt-auto min-h-[220px] overflow-hidden">
                <img src="/brain-icon.png" alt="База знаний" className="w-11/12 h-52 object-contain object-bottom drop-shadow-xl transform hover:scale-105 transition-transform duration-300" />
              </div>
            </div>

            <div className="bg-white thin-border rounded-2xl p-8 space-y-4 shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center p-1.5 shadow-sm">
                <img src="/operator-icon.png" alt="Живой чат" className="w-full h-full object-contain" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 heading-font">{t.feature3Title}</h3>
              <p className="text-slate-500 text-sm font-light leading-relaxed">
                {t.feature3Desc}
              </p>
            </div>
          </div>
        </section>

        {/* STEPS TO CONFIGURE */}
        <section className="space-y-16">
          <div className="text-center space-y-3">
            <h2 className="text-3xl font-semibold tracking-tight text-slate-950 heading-font">
              {t.stepsTitle}
            </h2>
            <p className="text-slate-500 text-sm max-w-xl mx-auto">
              {t.stepsSub}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-3">
              <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-sm">1</div>
              <h4 className="font-semibold text-slate-900">{t.step1Title}</h4>
              <p className="text-slate-500 text-xs font-light">{t.step1Desc}</p>
            </div>
            <div className="space-y-3">
              <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-sm">2</div>
              <h4 className="font-semibold text-slate-900">{t.step2Title}</h4>
              <p className="text-slate-500 text-xs font-light">{t.step2Desc}</p>
            </div>
            <div className="space-y-3">
              <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-sm">3</div>
              <h4 className="font-semibold text-slate-900">{t.step3Title}</h4>
              <p className="text-slate-500 text-xs font-light">{t.step3Desc}</p>
            </div>
            <div className="space-y-3">
              <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-sm">4</div>
              <h4 className="font-semibold text-slate-900">{t.step4Title}</h4>
              <p className="text-slate-500 text-xs font-light">{t.step4Desc}</p>
            </div>
          </div>
        </section>

        {/* PRICING PLANS */}
        <section id="pricing" className="space-y-16 scroll-mt-24">
          <div className="text-center space-y-3">
            <div className="inline-flex items-center gap-1 bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-full text-xs font-semibold text-emerald-700 uppercase tracking-wider">
              {t.pricingSubtitle}
            </div>
            <h2 className="text-3xl font-semibold tracking-tight text-slate-950 heading-font">
              {t.pricingTitle}
            </h2>
            <p className="text-slate-500 text-sm max-w-xl mx-auto">
              {t.pricingDesc}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {/* Free */}
            <div className="pricing-card bg-white thin-border rounded-2xl p-7 flex flex-col justify-between shadow-sm relative">
              <div className="space-y-5">
                <div className="space-y-1">
                  <h3 className="text-base font-semibold text-slate-900 heading-font">Free</h3>
                  <p className="text-xs text-slate-400 font-light">{t.planFreeSubtitle}</p>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-slate-900 heading-font">0 ₸</span>
                  <span className="text-xs text-slate-500 font-light">{t.perMonth}</span>
                </div>
                <ul className="border-t border-slate-100 pt-5 space-y-3">
                  {t.planFreeFeatures.map((f: string) => (
                    <li key={f} className="flex items-center gap-2.5 text-xs text-slate-600">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" /><span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="pt-7">
                <Link href="/register" className="block text-center bg-slate-50 hover:bg-slate-100 text-slate-800 py-2.5 rounded-lg text-xs font-medium transition-all">
                  {t.planFreeBtn}
                </Link>
              </div>
            </div>

            {/* Starter */}
            <div className="pricing-card bg-white thin-border rounded-2xl p-7 flex flex-col justify-between shadow-sm relative">
              <div className="space-y-5">
                <div className="space-y-1">
                  <h3 className="text-base font-semibold text-slate-900 heading-font">Starter</h3>
                  <p className="text-xs text-slate-400 font-light">{t.planStarterSubtitle}</p>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-slate-900 heading-font">6 990 ₸</span>
                  <span className="text-xs text-slate-500 font-light">{t.perMonth}</span>
                </div>
                <ul className="border-t border-slate-100 pt-5 space-y-3">
                  {t.planStarterFeatures.map((f: string) => (
                    <li key={f} className="flex items-center gap-2.5 text-xs text-slate-600">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" /><span>{f}</span>
                    </li>
                  ))}
                </ul>
                <div style={{ fontSize: '11px', color: '#64748b', opacity: 0.8, fontStyle: 'italic', paddingTop: '8px', lineHeight: '1.4' }}>
                  {t.planUpgradeNote}
                </div>
              </div>
              <div className="pt-7">
                <Link href="/register" className="block text-center bg-slate-50 hover:bg-slate-100 text-slate-800 py-2.5 rounded-lg text-xs font-medium transition-all">
                  {t.planStarterBtn}
                </Link>
              </div>
            </div>

            {/* Growth */}
            <div className="pricing-card bg-white thin-border rounded-2xl p-7 flex flex-col justify-between shadow-sm relative border-emerald-600 ring-1 ring-emerald-600/30">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-600 text-white px-3 py-1 rounded-full text-[9px] font-bold tracking-wider uppercase whitespace-nowrap">
                {t.planPopular} ⭐
              </div>
              <div className="space-y-5">
                <div className="space-y-1">
                  <h3 className="text-base font-semibold text-slate-900 heading-font">Growth</h3>
                  <p className="text-xs text-slate-400 font-light">{t.planGrowthSubtitle}</p>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-slate-900 heading-font">15 990 ₸</span>
                  <span className="text-xs text-slate-500 font-light">{t.perMonth}</span>
                </div>
                <ul className="border-t border-slate-100 pt-5 space-y-3">
                  {t.planGrowthFeatures.map((f: string) => (
                    <li key={f} className="flex items-center gap-2.5 text-xs text-slate-800">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" /><span className="font-medium">{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="pt-7">
                <Link href="/register" className="block text-center bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-lg text-xs font-medium transition-all shadow-sm shadow-emerald-600/10">
                  {t.planGrowthBtn}
                </Link>
              </div>
            </div>

            {/* Pro */}
            <div className="pricing-card bg-white thin-border rounded-2xl p-7 flex flex-col justify-between shadow-sm relative">
              <div className="space-y-5">
                <div className="space-y-1">
                  <h3 className="text-base font-semibold text-slate-900 heading-font">Pro</h3>
                  <p className="text-xs text-slate-400 font-light">{t.planProSubtitle}</p>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-slate-900 heading-font">33 990 ₸</span>
                  <span className="text-xs text-slate-500 font-light">{t.perMonth}</span>
                </div>
                <ul className="border-t border-slate-100 pt-5 space-y-3">
                  {t.planProFeatures.map((f: string) => (
                    <li key={f} className="flex items-center gap-2.5 text-xs text-slate-600">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" /><span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="pt-7">
                <Link href="/register" className="block text-center bg-slate-900 hover:bg-slate-800 text-white py-2.5 rounded-lg text-xs font-medium transition-all">
                  {t.planProBtn}
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ SECTION */}
        <section className="space-y-16">
          <div className="text-center space-y-3">
            <h2 className="text-3xl font-semibold tracking-tight text-slate-950 heading-font">
              {t.faqTitle}
            </h2>
          </div>

          <div className="max-w-3xl mx-auto space-y-4">
            {t.faqItems.map((item: { q: string; a: string }, idx: number) => (
              <div key={idx} className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm">
                <h4 className="font-bold text-sm text-slate-900 mb-2">{item.q}</h4>
                <p className="text-slate-500 text-xs leading-relaxed">{item.a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CONTACT FORM */}
        <section id="contact-section" className="scroll-mt-24">
          <div className="bg-white thin-border rounded-3xl shadow-sm overflow-hidden grid grid-cols-1 md:grid-cols-2">
            <div className="p-6 sm:p-12 space-y-8 flex flex-col justify-center bg-slate-50/50">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div className="space-y-3">
                <h3 className="text-2xl font-bold tracking-tight text-slate-900 heading-font">
                  {t.buildToday}
                </h3>
                <p className="text-slate-500 text-sm font-light leading-relaxed">
                  {t.buildTodaySub}
                </p>
              </div>
              <div className="space-y-4 pt-4 border-t border-slate-200/50 text-sm text-slate-600 font-light">
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-emerald-600" />
                  <span>geducation1017@gmail.com</span>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-emerald-600" />
                  <span>+7 777 420-19-89</span>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin className="w-4 h-4 text-emerald-600" />
                  <span>140000, Казахстан, г. Павлодар, ул. Малахова, д. 11</span>
                </div>
              </div>
            </div>

            <div className="p-6 sm:p-12 bg-white flex flex-col justify-center">
              {formSubmitted ? (
                <div className="text-center space-y-4 py-8">
                  <div className="w-16 h-16 bg-emerald-50 border border-emerald-100 rounded-full flex items-center justify-center text-emerald-600 mx-auto">
                    <Check className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-semibold text-slate-900 heading-font">{t.requestSent}</h3>
                  <p className="text-slate-500 text-sm font-light">{t.requestSentSub}</p>
                </div>
              ) : (
                <form onSubmit={handleContactForm} className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-slate-500">{t.nameLabel}</label>
                    <input 
                      required
                      value={formData.name}
                      onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full bg-slate-50/50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:border-emerald-500 focus:bg-white outline-none transition-all font-light" 
                      placeholder={t.namePlaceholder} 
                      type="text"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-slate-500">{t.phoneLabel}</label>
                    <input 
                      required
                      value={formData.phone}
                      onChange={e => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      className="w-full bg-slate-50/50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:border-emerald-500 focus:bg-white outline-none transition-all font-light" 
                      placeholder="+7 (707) 123-45-67" 
                      type="tel"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-slate-500">{t.businessTypeLabel}</label>
                    <select 
                      value={formData.businessType}
                      onChange={e => setFormData(prev => ({ ...prev, businessType: e.target.value }))}
                      className="w-full bg-slate-50/50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:border-emerald-500 focus:bg-white outline-none transition-all cursor-pointer text-slate-700 font-light"
                    >
                      {t.businessTypes.map((bt: string) => (
                        <option key={bt}>{bt}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-slate-500">{t.messageLabel}</label>
                    <textarea 
                      value={formData.message}
                      onChange={e => setFormData(prev => ({ ...prev, message: e.target.value }))}
                      className="w-full bg-slate-50/50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:border-emerald-500 focus:bg-white outline-none transition-all font-light" 
                      placeholder={t.messagePlaceholder} 
                      rows={3}
                    ></textarea>
                  </div>
                  <button className="w-full bg-slate-900 text-white py-3 rounded-lg text-sm font-medium hover:bg-slate-800 transition-all cursor-pointer active:scale-[0.98]" type="submit">
                    {t.sendRequest}
                  </button>
                </form>
              )}
            </div>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200/60 mt-32">
        <div className="max-w-7xl mx-auto px-6 py-12 space-y-12">
          
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
            <div className="md:col-span-8 space-y-4">
              <div className="flex items-center gap-2 select-none">
                <img src="/logo.jpg" alt="Logo" style={{ width: '28px', height: '28px', borderRadius: '6px', objectFit: 'cover' }} />
                <span className="font-semibold text-md tracking-tight heading-font text-slate-900">UP-CHAT</span>
              </div>
              <div className="text-[13px] text-slate-400 font-light leading-relaxed space-y-1 max-w-2xl">
                <div>{t.footerCompanyName}</div>
                <div>{t.footerAddress}</div>
                <div>{t.footerContacts}</div>
                <div>{t.footerHours}</div>
              </div>
            </div>

            <div className="md:col-span-4 grid grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="text-sm font-semibold text-slate-900 uppercase tracking-wider">{t.product}</div>
                <div className="flex flex-col gap-2 text-sm font-light text-slate-500">
                  <a className="hover:text-emerald-600 transition-colors" href="#scenarios">{t.solutions}</a>
                  <a className="hover:text-emerald-600 transition-colors" href="#pricing">{t.pricing}</a>
                </div>
              </div>
              <div className="space-y-3">
                <div className="text-sm font-semibold text-slate-900 uppercase tracking-wider">{t.company}</div>
                <div className="flex flex-col gap-2 text-sm font-light text-slate-500">
                  <Link href="/offer" className="hover:text-emerald-600 transition-colors select-none">{t.offer}</Link>
                  <Link href="/privacy-policy" className="hover:text-emerald-600 transition-colors select-none">{t.privacy}</Link>
                  <Link href="/terms-of-use" className="hover:text-emerald-600 transition-colors select-none">{t.terms}</Link>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4 text-sm font-light text-slate-400">
            <p>© 2026 UP-CHAT. up-chat.com. {t.footerCopyright}</p>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 pulse-animation"></span>
              <span>{t.allSystemsOperational}</span>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}
