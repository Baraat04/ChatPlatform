'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';

const localT = {
  EN: {
    heroTitle1: "Smart ",
    heroTitleHighlight: "AI assistant",
    heroTitle2: " that knows your business. Launch in 5 minutes.",
    heroSub: "Automate sales and support on WhatsApp & Telegram. Connect your knowledge base and let AI handle 90% of queries.",
    startFree: "Start Free",
    watchDemo: "Watch Demo",
    businesses: "businesses",
    messages: "messages",
    deals: "deals",
    bentoTitle: "Everything you need to automate",
    bentoSub: "One platform to manage all your customer interactions across multiple channels with enterprise-grade AI.",
    brainChat: "AI Brain Chat",
    brainChatSub: "Smart response generation based on your unique data.",
    brainChatQ: "How do I cancel my subscription?",
    brainChatA: "You can cancel anytime in the settings panel under the \"Billing\" tab.",
    pdfKb: "PDF Knowledge Base",
    pdfKbSub: "Upload your docs and the AI learns instantly from your data.",
    multichannel: "Multichannel",
    multichannelSub: "WhatsApp, Telegram, and Instagram perfectly synced.",
    liveTakeover: "Live Takeover",
    liveTakeoverSub: "Seamless bot to human handoff when things get complex.",
    broadcasts: "Broadcasts",
    broadcastsSub: "Mass updates to customers.",
    launchSteps: "Launch in three simple steps",
    connectMessenger: "1. Connect messenger",
    connectMessengerSub: "Sync your WhatsApp Business or Telegram account in seconds.",
    uploadPdf: "2. Upload PDF",
    uploadPdfSub: "Upload your FAQs, price lists, or company policy documents.",
    aiWorks: "3. AI works 24/7",
    aiWorksSub: "Sit back while your AI handles sales and support around the clock.",
    plugsWorkflow: "Plugs into your workflow",
    plugsWorkflowSub: "No need to change your stack. We integrate with the tools your team already uses daily.",
    viewAllIntegrations: "View all 50+ Integrations",
    trustedBusinesses: "Trusted by businesses like yours",
    alexQuote: "\"Homelander transformed our support operations. We went from answering the same 10 questions all day to focusing on actual sales strategy.\"",
    sarahQuote: "\"The PDF knowledge base feature is magic. I uploaded our 40-page technical manual and the AI started answering expert questions immediately.\"",
    jamesQuote: "\"The seamless handoff to humans is what sold us. Our bots handle the triage and our sales team steps in only when the lead is warm.\"",
    agenciesTitle: "Agencies & Integrators",
    agenciesSub: "Implement Homelander for your clients and earn high recurring commissions while providing top-tier AI automation.",
    resellersTitle: "Resellers",
    resellersSub: "Join our reseller network and expand your product portfolio with the market's most advanced AI chatbot solution.",
    partnership: "Partnership",
    applyPartnership: "Apply for Partnership",
    learnMore: "Learn More",
    whiteLabelOptions: "White-label options",
    prioritySupport: "Priority support access",
    dedicatedPartner: "Dedicated partner manager",
    exclusiveDiscounts: "Exclusive reseller discounts",
    marketingKits: "Marketing collateral kits",
    trainingWebinars: "Technical training webinars",
    buildToday: "Let's build your AI assistant today",
    buildTodaySub: "Have specific requirements? Our team of AI engineers can help you architect the perfect solution for your scale.",
    headquarters: "Global Headquarters, Silicon Valley",
    nameLabel: "Name",
    phoneLabel: "WhatsApp/Phone",
    businessTypeLabel: "Business Type",
    messageLabel: "Message",
    sendRequest: "Send Request",
    requestSent: "Request Sent!",
    requestSentSub: "Our team will contact you shortly.",
    allSystemsOperational: "All systems operational",
    features: "Features",
    integrations: "Integrations",
    pricing: "Pricing",
    company: "Company",
    privacy: "Privacy",
    terms: "Terms",
    product: "Product",
    signIn: "Sign In",
    getStarted: "Get Started",
    cabinet: "To Cabinet"
  },
  RU: {
    heroTitle1: "Умный ",
    heroTitleHighlight: "ИИ-ассистент",
    heroTitle2: ", который знает ваш бизнес. Запуск за 5 минут.",
    heroSub: "Автоматизируйте продажи и поддержку в WhatsApp и Telegram. Подключите базу знаний, и ИИ закроет до 90% обращений.",
    startFree: "Начать бесплатно",
    watchDemo: "Смотреть демо",
    businesses: "бизнесов",
    messages: "сообщений",
    deals: "сделок",
    bentoTitle: "Всё необходимое для автоматизации",
    bentoSub: "Единая платформа для управления всеми диалогами с клиентами в нескольких каналах с помощью ИИ корпоративного уровня.",
    brainChat: "AI Brain Chat",
    brainChatSub: "Умная генерация ответов на основе ваших уникальных данных.",
    brainChatQ: "Как мне отменить подписку?",
    brainChatA: "Вы можете отменить подписку в любое время в панели настроек во вкладке «Оплата».",
    pdfKb: "База знаний PDF",
    pdfKbSub: "Загрузите свои документы, и ИИ мгновенно обучится на ваших данных.",
    multichannel: "Мультиканальность",
    multichannelSub: "WhatsApp, Telegram и Instagram синхронизированы идеально.",
    liveTakeover: "Живой диалог",
    liveTakeoverSub: "Бесшовный переход с бота на человека, если вопрос становится слишком сложным.",
    broadcasts: "Рассылки",
    broadcastsSub: "Массовые рассылки обновлений вашим клиентам.",
    launchSteps: "Запуск в три простых шага",
    connectMessenger: "1. Подключите мессенджер",
    connectMessengerSub: "Синхронизируйте ваш аккаунт WhatsApp Business или Telegram за секунды.",
    uploadPdf: "2. Загрузите PDF",
    uploadPdfSub: "Загрузите ответы на вопросы, прайс-листы или документы компании.",
    aiWorks: "3. ИИ работает 24/7",
    aiWorksSub: "Отдыхайте, пока ИИ круглосуточно обрабатывает продажи и поддержку.",
    plugsWorkflow: "Интеграция с вашими инструментами",
    plugsWorkflowSub: "Не нужно менять стек технологий. Мы интегрируемся с инструментами, которые ваша команда уже использует каждый день.",
    viewAllIntegrations: "Посмотреть все 50+ интеграций",
    trustedBusinesses: "Доверие сотен компаний по всему миру",
    alexQuote: "«Homelander полностью изменил нашу клиентскую поддержку. Мы перешли от ответов на одни и те же 10 вопросов в день к фокусу на продажах.»",
    sarahQuote: "«Загрузка базы знаний из PDF работает волшебно. Я загрузил наше 40-страничное руководство, и ИИ сразу начал квалифицированно консультировать.»",
    jamesQuote: "«Бесшовный переход диалога к человеку — главная фича. Бот полностью обрабатывает первичный поток, а менеджеры берут только горячих лидов.»",
    agenciesTitle: "Агентства и Интеграторы",
    agenciesSub: "Внедряйте Homelander для ваших клиентов и получайте высокий регулярный доход, предлагая лучшую ИИ-автоматизацию.",
    resellersTitle: "Реселлеры",
    resellersSub: "Присоединяйтесь к нашей сети реселлеров и расширяйте свой портфель решений с помощью самого продвинутого ИИ-бота.",
    partnership: "Партнёрство",
    applyPartnership: "Подать заявку на партнёрство",
    learnMore: "Узнать больше",
    whiteLabelOptions: "White-label опции",
    prioritySupport: "Приоритетная поддержка",
    dedicatedPartner: "Выделенный партнерский менеджер",
    exclusiveDiscounts: "Эксклюзивные скидки реселлера",
    marketingKits: "Маркетинговые материалы",
    trainingWebinars: "Технические обучающие вебинары",
    buildToday: "Давайте создадим вашего ИИ-ассистента сегодня",
    buildTodaySub: "Есть особые требования? Наша команда инженеров поможет спроектировать идеальное решение для вашего масштаба.",
    headquarters: "Штаб-квартира, Кремниевая долина",
    nameLabel: "Имя",
    phoneLabel: "WhatsApp / Телефон",
    businessTypeLabel: "Тип бизнеса",
    messageLabel: "Сообщение",
    sendRequest: "Отправить запрос",
    requestSent: "Заявка отправлена!",
    requestSentSub: "Наш специалист свяжется с вами в ближайшее время.",
    allSystemsOperational: "Все системы работают нормально",
    features: "Функции",
    integrations: "Интеграции",
    pricing: "Цены",
    company: "Компания",
    privacy: "Конфиденциальность",
    terms: "Условия",
    product: "Продукт",
    signIn: "Войти",
    getStarted: "Начать бесплатно",
    cabinet: "В кабинет"
  },
  KZ: {
    heroTitle1: "Сіздің бизнесіңізді білетін ақылды ",
    heroTitleHighlight: "ЖИ-көмекші",
    heroTitle2: ". 5 минутта іске қосыңыз.",
    heroSub: "WhatsApp және Telegram арқылы сату мен қолдауды автоматтандырыңыз. Білім базасын қосып, ЖИ-ге сұраныстардың 90% шешуге мүмкіндік беріңіз.",
    startFree: "Тегін бастау",
    watchDemo: "Демоны көру",
    businesses: "бизнес",
    messages: "хабарлама",
    deals: "мәміле",
    bentoTitle: "Автоматтандыруға қажеттінің бәрі",
    bentoSub: "Корпоративтік деңгейдегі ЖИ көмегімен бірнеше арнадағы барлық клиенттермен әңгімелерді басқаруға арналған бірыңғай платформа.",
    brainChat: "AI Brain Chat",
    brainChatSub: "Сіздің бірегей деректеріңізге негізделген жауаптардың ақылды генерациясы.",
    brainChatQ: "Жазылуымды қалай жоя аламын?",
    brainChatA: "Жазылымды кез келген уақытта «Төлем» қойындысындағы параметрлер панелінде жоя аласыз.",
    pdfKb: "PDF білім базасы",
    pdfKbSub: "Құжаттарыңызды жүктеңіз, ЖИ сіздің деректеріңізден бірден үйренеді.",
    multichannel: "Көп арналы",
    multichannelSub: "WhatsApp, Telegram және Instagram мінсіз синхрондалған.",
    liveTakeover: "Тікелей әңгіме",
    liveTakeoverSub: "Сұрақ тым күрделі болған кезде боттан адамға кедергісіз ауысу.",
    broadcasts: "Таратылымдар",
    broadcastsSub: "Клиенттеріңізге жаңартуларды жаппай тарату.",
    launchSteps: "Үш қарапайым қадаммен іске қосыңыз",
    connectMessenger: "1. Мессенджерді қосыңыз",
    connectMessengerSub: "WhatsApp Business немесе Telegram аккаунтын бірнеше секундта синхрондаңыз.",
    uploadPdf: "2. PDF жүктеңіз",
    uploadPdfSub: "FAQ, баға тізімдерін немесе компания құжаттарын жүктеңіз.",
    aiWorks: "3. ЖИ тәулік бойы жұмыс ітеді",
    aiWorksSub: "ЖИ тәулік бойы сату мен қолдауды реттегенде демалыңыз.",
    plugsWorkflow: "Жұмыс процесіңізге қосылады",
    plugsWorkflowSub: "Стек технологияларын өзгертудің қажеті жоқ. Біз сіздің командаңыз күнделікті қолданатын құралдармен интеграцияланамыз.",
    viewAllIntegrations: "Барлық 50+ интеграцияны көру",
    trustedBusinesses: "Сіздің бизнесіңіз сияқты сенімді серіктестер",
    alexQuote: "«Homelander біздің қолдау қызметімізді толық өзгертті. Күн сайын бірдей 10 сұраққа жауап беруден сату стратегиясына көштік.»",
    sarahQuote: "«PDF білім базасы сиқырлы жұмыс ісейді. Мен 40 беттік нұсқаулықты жүктедім, ЖИ бірден кәсіби кеңес бере бастады.»",
    jamesQuote: "«Роботтан адамға кедергісіз ауысу — ең маңызды функция. Бот бастапқы лекті өңдейді, ал менеджерлер тек дайын клиенттерді алады.»",
    agenciesTitle: "Агенттіктер мен Интеграторлар",
    agenciesSub: "Клиенттеріңіз үшін Homelander енгізіңіз және жоғары серіктестік табыс табыңыз.",
    resellersTitle: "Риселлерлер",
    resellersSub: "Біздің риселлерлер желісіне қосылыңыз және өнімдер портфолиосын кеңейтіңіз.",
    partnership: "Серіктестік",
    applyPartnership: "Серіктестікке өтінім қалдыру",
    learnMore: "Толығырақ білу",
    whiteLabelOptions: "White-label мүмкіндіктері",
    prioritySupport: "Басымдықты қолдау",
    dedicatedPartner: "Жеке серіктестік менеджер",
    exclusiveDiscounts: "Риселлердің эксклюзивті жеңілдіктері",
    marketingKits: "Маркетингтік материалдар жинағы",
    trainingWebinars: "Техникалық оқыту вебинарлары",
    buildToday: "ЖИ көмекшіңізді бүгіннен бастап құрыңыз",
    buildTodaySub: "Ерекше талаптарыңыз бар ма? Біздің ЖИ инженерлеріміз сізге қолайлы шешім әзірлейді.",
    headquarters: "Штаб-пәтер, Силикон алқабы",
    nameLabel: "Аты-жөні",
    phoneLabel: "WhatsApp / Телефон",
    businessTypeLabel: "Бизнес түрі",
    messageLabel: "Хабарлама",
    sendRequest: "Сұранысты жіберу",
    requestSent: "Сұраныс жіберілді!",
    requestSentSub: "Біздің мамандар жақын арада хабарласады.",
    allSystemsOperational: "Барлық жүйелер қалыпты жұмыс істейді",
    features: "Мүмкіндіктер",
    integrations: "Интеграциялар",
    pricing: "Бағалар",
    company: "Компания",
    privacy: "Құпиялылық",
    terms: "Шарттар",
    product: "Өнім",
    signIn: "Кіру",
    getStarted: "Тегін бастау",
    cabinet: "Кабинетке"
  }
};

export default function LandingPage() {
  const { t: globalT, language, setLanguage } = useLanguage();
  const { user } = useAuth();
  const router = useRouter();

  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    businessType: 'E-commerce',
    message: ''
  });

  const t = { ...globalT, ...localT[language] };

  // Set up scroll animations using Intersection Observer
  useEffect(() => {
    const revealCallback = (entries: IntersectionObserverEntry[]) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('active');
        }
      });
    };

    const revealObserver = new IntersectionObserver(revealCallback, {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    });

    document.querySelectorAll('.reveal').forEach(el => {
      revealObserver.observe(el);
    });

    // Run active triggers immediately for items above folds
    document.querySelectorAll('.reveal').forEach(el => {
      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight) {
        el.classList.add('active');
      }
    });

    return () => {
      revealObserver.disconnect();
    };
  }, []);

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
    <div className="font-body-md text-body-md overflow-x-hidden min-h-screen bg-white">
      {/* Import stylesheet dependencies and fonts safely */}
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@600;700&display=swap" rel="stylesheet"/>
      <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet"/>

      {/* Styled configurations block */}
      <style jsx global>{`
        .material-symbols-outlined { font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24; }
        body { background-color: #ffffff; color: #131e18; }
        
        .bento-card, .btn-transition, input, select, textarea {
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .bento-card:hover { 
          border-color: #003527; 
          transform: translateY(-6px); 
          box-shadow: 0 12px 30px -10px rgba(0, 53, 39, 0.15);
        }

        .custom-shadow { box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03); }
        .dashed-connector { background-image: linear-gradient(to right, #e5e7eb 50%, transparent 50%); background-size: 10px 1px; background-repeat: repeat-x; }
        
        @keyframes float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-15px); }
          100% { transform: translateY(0px); }
        }
        .float-animation { animation: float 6s ease-in-out infinite; }

        @keyframes pulse-status {
          0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.7); }
          70% { transform: scale(1); box-shadow: 0 0 0 6px rgba(34, 197, 94, 0); }
          100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(34, 197, 94, 0); }
        }
        .pulse-animation { animation: pulse-status 2s infinite; }

        .reveal {
          opacity: 0;
          transform: translateY(30px);
          transition: all 0.8s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .reveal.active {
          opacity: 1;
          transform: translateY(0);
        }

        .blob-bg {
          position: absolute;
          background: #f4f6f4;
          filter: blur(40px);
          z-index: -1;
          border-radius: 50%;
        }
      `}</style>

      {/* Header element */}
      <header className="bg-bg-base/80 backdrop-blur-md sticky top-0 full-width z-50 border-b border-border-subtle">
        <div className="flex justify-between items-center w-full px-margin-page max-w-7xl mx-auto h-16">
          <Link href="/landing" className="flex items-center">
            <img 
              alt="Homelander Logo" 
              className="h-8 cursor-pointer" 
              src="https://lh3.googleusercontent.com/aida/ADBb0ugwcWVp1D_eYWMoNgFuRqMDgaTLhYBZ-RVdu3mMfLlEZKsjBlGq-Q5j6qhybzRmWDQOnoa0PgVgNowjSXBpeuN8PbMm22TnvjsVD2P0KudnMGlCJ2Hk-VU0FyzuJCstK0BiB2cTOB9ETdbn6XTBKnqXUNUiQYERa93WQdGlEGDgQPADvwzRjYSb2iLPdECLTWaLaph97bEY68_k0Ijc_Y8PaC8HbtkFJVVu_o-sUvKh1F-xkCi8z41HA4Y"
            />
          </Link>

          <nav className="hidden md:flex gap-gutter items-center">
            <a className="font-label-md text-label-md text-primary font-bold border-b-2 border-primary transition-colors duration-200" href="#hero">
              {t.features}
            </a>
            <a className="font-label-md text-label-md text-text-secondary hover:text-primary transition-colors duration-200" href="#bento">
              {t.integrations}
            </a>
            <a className="font-label-md text-label-md text-text-secondary hover:text-primary transition-colors duration-200" href="#partnership">
              {t.pricing}
            </a>
            <a className="font-label-md text-label-md text-text-secondary hover:text-primary transition-colors duration-200" href="#partnership">
              {t.partnership}
            </a>
          </nav>

          <div className="flex items-center gap-4">
            {/* Click-Safe Language Selector dropdown */}
            <div className="relative">
              <button
                onClick={() => setLangDropdownOpen(!langDropdownOpen)}
                className="flex items-center gap-1.5 bg-white border border-border-subtle px-3 py-1.5 rounded-lg font-label-sm text-label-sm text-text-secondary hover:text-primary hover:border-primary transition-all cursor-pointer select-none"
              >
                <span className="material-symbols-outlined text-sm font-semibold">public</span>
                <span>{language}</span>
                <span className="material-symbols-outlined text-xs">keyboard_arrow_down</span>
              </button>
              {langDropdownOpen && (
                <div className="absolute right-0 top-full mt-1.5 bg-white border border-border-subtle rounded-lg shadow-lg py-1.5 w-24 z-50">
                  {(['EN', 'RU', 'KZ'] as const).map((lang) => (
                    <button
                      key={lang}
                      onClick={() => {
                        setLanguage(lang);
                        setLangDropdownOpen(false);
                      }}
                      className={`flex items-center justify-between w-full px-3 py-2 text-left font-label-sm text-label-sm ${
                        language === lang ? 'bg-surface-container text-primary font-bold' : 'text-text-secondary hover:bg-bg-section'
                      }`}
                    >
                      <span>{lang}</span>
                      {language === lang && <span className="material-symbols-outlined text-xs">check</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {user ? (
              <Link 
                href="/bots" 
                className="bg-primary-container text-white px-6 py-2.5 rounded-lg font-label-md text-label-md hover:bg-primary transition-all active:scale-95"
              >
                {t.cabinet}
              </Link>
            ) : (
              <>
                <Link href="/login" className="font-label-md text-label-md text-text-secondary hover:text-primary transition-colors">
                  {t.signIn}
                </Link>
                
                <Link 
                  href="/register" 
                  className="bg-primary-container text-white px-6 py-2.5 rounded-lg font-label-md text-label-md hover:bg-primary transition-all active:scale-95"
                >
                  {t.getStarted}
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main>
        {/* Section 1: Hero */}
        <section className="relative max-w-7xl mx-auto px-margin-page py-24 flex flex-col md:flex-row items-center gap-16 overflow-visible reveal" id="hero">
          <div className="blob-bg w-64 h-64 -top-10 -left-10 opacity-60"></div>
          <div className="flex-1 space-y-8 relative z-10">
            <h1 className="font-headline-xl text-headline-xl text-on-background max-w-lg leading-tight">
              {t.heroTitle1}<span className="text-primary-container">{t.heroTitleHighlight}</span>{t.heroTitle2}
            </h1>
            <p className="font-body-lg text-body-lg text-text-secondary max-w-md">
              {t.heroSub}
            </p>
            <div className="flex gap-4 items-center">
              <Link 
                href={user ? "/bots" : "/register"} 
                className="bg-primary-container text-white px-8 py-4 rounded-lg font-label-md text-label-md hover:bg-primary transition-all active:scale-95 inline-block"
              >
                {user ? t.cabinet : t.startFree}
              </Link>
              <a href="#bento" className="text-text-secondary px-8 py-4 rounded-lg font-label-md text-label-md flex items-center gap-2 hover:text-primary transition-all cursor-pointer">
                <span className="material-symbols-outlined">play_circle</span> {t.watchDemo}
              </a>
            </div>
          </div>
          <div className="flex-1 w-full relative">
            <div className="float-animation">
              <img 
                alt="3D Chat Interface Illustration" 
                className="w-full h-auto drop-shadow-2xl rounded-2xl border border-border-subtle" 
                src="/first.jpg" 
              />
            </div>
          </div>
        </section>

        {/* Section 2: Social Proof */}
        <section className="bg-bg-section py-12 border-y border-border-subtle relative reveal">
          <div className="max-w-7xl mx-auto px-margin-page flex flex-col md:flex-row justify-between items-center gap-8 relative z-10">
            <div className="flex gap-12 items-center opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
              <span className="font-bold text-headline-md tracking-tight">WhatsApp</span>
              <span className="font-bold text-headline-md tracking-tight">Telegram</span>
              <span className="font-bold text-headline-md tracking-tight">Instagram</span>
              <span className="font-bold text-headline-md tracking-tight">Bitrix24</span>
            </div>
            <div className="flex gap-12 border-l border-border-subtle pl-12 hidden md:flex">
              <div className="text-center group cursor-default">
                <div className="font-bold text-headline-md text-primary-container group-hover:scale-110 transition-transform">500+</div>
                <div className="font-label-sm text-text-secondary">{t.businesses}</div>
              </div>
              <div className="text-center group cursor-default">
                <div className="font-bold text-headline-md text-primary-container group-hover:scale-110 transition-transform">2M+</div>
                <div className="font-label-sm text-text-secondary">{t.messages}</div>
              </div>
              <div className="text-center group cursor-default">
                <div className="font-bold text-headline-md text-primary-container group-hover:scale-110 transition-transform">58k+</div>
                <div className="font-label-sm text-text-secondary">{t.deals}</div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 3: Features Bento Grid */}
        <section className="relative max-w-7xl mx-auto px-margin-page py-24" id="bento">
          <div className="blob-bg w-96 h-96 top-1/2 -right-20 opacity-40"></div>
          <div className="text-center mb-16 space-y-4 reveal">
            <h2 className="font-headline-lg text-headline-lg">{t.bentoTitle}</h2>
            <p className="text-text-secondary font-body-md max-w-xl mx-auto">{t.bentoSub}</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 grid-rows-2 gap-gutter reveal">
            {/* Card 1 (2x2) */}
            <div className="md:col-span-2 md:row-span-2 bg-white border border-border-subtle rounded-xl p-8 bento-card flex flex-col gap-6 relative overflow-hidden group">
              <div className="relative z-10">
                <h3 className="font-headline-md text-headline-md mb-2">{t.brainChat}</h3>
                <p className="text-text-secondary max-w-xs">{t.brainChatSub}</p>
              </div>
              
              <div className="bg-bg-section rounded-lg flex-1 border border-border-subtle overflow-hidden relative min-h-[200px]">
                <img 
                  alt="Brain concept background" 
                  className="absolute -left-4 -bottom-4 w-28 opacity-20 grayscale group-hover:opacity-40 group-hover:scale-110 transition-all duration-700 pointer-events-none" 
                  src="/third.jpg"
                />
                <div className="p-6 space-y-4 relative z-10">
                  <div className="bg-white p-3 rounded-lg border border-border-subtle shadow-sm w-3/4 transform translate-x-0 group-hover:translate-x-2 transition-transform duration-500">
                    {t.brainChatQ}
                  </div>
                  <div className="bg-primary-container text-white p-3 rounded-lg shadow-sm ml-auto w-3/4 transform translate-x-0 group-hover:-translate-x-2 transition-transform duration-500 delay-75">
                    {t.brainChatA}
                  </div>
                </div>
              </div>
            </div>

            {/* Card 2 (tall) */}
            <div className="md:row-span-2 bg-white border border-border-subtle rounded-xl p-8 bento-card flex flex-col items-center justify-center text-center gap-6 overflow-hidden group">
              <div className="relative w-full h-48 flex items-center justify-center overflow-hidden rounded-lg">
                <img 
                  alt="PDF Knowledge Base Illustration" 
                  className="w-full h-full object-cover scale-100 group-hover:scale-105 transition-transform duration-700" 
                  src="/second.jpg" 
                />
              </div>
              <div>
                <h3 className="font-headline-md text-headline-md mb-2">{t.pdfKb}</h3>
                <p className="text-text-secondary max-w-[200px] mx-auto text-sm">{t.pdfKbSub}</p>
              </div>
            </div>

            {/* Card 3 (tall) */}
            <div className="md:row-span-2 bg-white border border-border-subtle rounded-xl p-8 bento-card flex flex-col items-center justify-center text-center gap-8 group">
              <div className="flex -space-x-4">
                <div className="w-16 h-16 bg-bg-section border-2 border-white rounded-full flex items-center justify-center relative group-hover:-translate-y-2 transition-transform duration-300">
                  <span className="material-symbols-outlined text-primary-container text-3xl">chat_bubble</span>
                  <div className="absolute top-1 right-1 w-4 h-4 bg-success rounded-full border-2 border-white pulse-animation"></div>
                </div>
                <div className="w-16 h-16 bg-bg-section border-2 border-white rounded-full flex items-center justify-center relative group-hover:translate-y-2 transition-transform duration-300">
                  <span className="material-symbols-outlined text-primary-container text-3xl">send</span>
                  <div className="absolute top-1 right-1 w-4 h-4 bg-success rounded-full border-2 border-white pulse-animation"></div>
                </div>
              </div>
              <div>
                <h3 className="font-headline-md text-headline-md mb-2">{t.multichannel}</h3>
                <p className="text-text-secondary">{t.multichannelSub}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter mt-gutter reveal">
            <div className="md:col-span-2 bg-white border border-border-subtle rounded-xl p-8 bento-card flex items-center gap-8 group">
              <div className="w-16 h-16 bg-bg-section rounded-xl flex items-center justify-center shrink-0 group-hover:rotate-12 transition-transform">
                <span className="material-symbols-outlined text-primary-container text-3xl">transfer_within_a_station</span>
              </div>
              <div>
                <h3 className="font-headline-md text-headline-md mb-1">{t.liveTakeover}</h3>
                <p className="text-text-secondary">{t.liveTakeoverSub}</p>
              </div>
            </div>
            
            <div className="bg-white border border-border-subtle rounded-xl p-8 bento-card flex items-center gap-6 group">
              <div className="w-16 h-16 bg-bg-section rounded-full flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-primary-container text-3xl">campaign</span>
              </div>
              <div>
                <h3 className="font-headline-md text-headline-md mb-1">{t.broadcasts}</h3>
                <p className="text-text-secondary">{t.broadcastsSub}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Section 4: How It Works */}
        <section className="relative max-w-7xl mx-auto px-margin-page py-24 border-t border-border-subtle bg-white">
          <div className="blob-bg w-80 h-80 bottom-0 left-0 opacity-30"></div>
          <h2 className="font-headline-lg text-headline-lg text-center mb-16 relative z-10 reveal">{t.launchSteps}</h2>
          <div className="relative flex flex-col md:flex-row justify-between gap-12 z-10 reveal">
            <div className="hidden md:block absolute top-12 left-0 right-0 h-px dashed-connector -z-10"></div>
            
            <div className="flex-1 flex flex-col items-center text-center gap-6 bg-white group">
              <div className="w-24 h-24 bg-primary-container text-white rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:bg-primary transition-all duration-500">
                <span className="material-symbols-outlined text-4xl">link</span>
              </div>
              <div className="space-y-2">
                <h3 className="font-headline-md text-headline-md group-hover:text-primary transition-colors">{t.connectMessenger}</h3>
                <p className="text-text-secondary">{t.connectMessengerSub}</p>
              </div>
            </div>

            <div className="flex-1 flex flex-col items-center text-center gap-6 bg-white group">
              <div className="w-24 h-24 bg-primary-container text-white rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:bg-primary transition-all duration-500">
                <span className="material-symbols-outlined text-4xl">upload_file</span>
              </div>
              <div className="space-y-2">
                <h3 className="font-headline-md text-headline-md group-hover:text-primary transition-colors">{t.uploadPdf}</h3>
                <p className="text-text-secondary">{t.uploadPdfSub}</p>
              </div>
            </div>

            <div className="flex-1 flex flex-col items-center text-center gap-6 bg-white group">
              <div className="w-24 h-24 bg-primary-container text-white rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:bg-primary transition-all duration-500">
                <span className="material-symbols-outlined text-4xl">auto_awesome</span>
              </div>
              <div className="space-y-2">
                <h3 className="font-headline-md text-headline-md group-hover:text-primary transition-colors">{t.aiWorks}</h3>
                <p className="text-text-secondary">{t.aiWorksSub}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Section 5: Integrations */}
        <section className="bg-bg-section py-24 border-y border-border-subtle overflow-hidden relative">
          <div className="max-w-7xl mx-auto px-margin-page relative z-10">
            <div className="flex flex-col md:flex-row items-end justify-between mb-16 gap-6 reveal">
              <div className="space-y-4">
                <h2 className="font-headline-lg text-headline-lg">{t.plugsWorkflow}</h2>
                <p className="text-text-secondary font-body-md max-w-md">{t.plugsWorkflowSub}</p>
              </div>
              <a href="#contact" className="text-primary-container font-label-md flex items-center gap-2 group hover:gap-3 transition-all cursor-pointer">
                {t.viewAllIntegrations} <span className="material-symbols-outlined transition-transform group-hover:translate-x-1">arrow_forward</span>
              </a>
            </div>

            <div className="flex flex-wrap gap-4 items-center justify-start md:justify-center max-w-4xl mx-auto reveal">
              <div className="px-6 py-4 bg-white border border-border-subtle rounded-full flex items-center gap-3 font-label-md hover:border-primary-container hover:shadow-md transition-all cursor-default group hover:-translate-y-1">
                <div className="w-6 h-6 bg-success/10 rounded-full flex items-center justify-center">
                  <span className="material-symbols-outlined text-success text-xs" style={{ fontVariationSettings: "'FILL' 1" }}>chat</span>
                </div>
                WhatsApp
              </div>
              <div className="px-6 py-4 bg-white border border-border-subtle rounded-full flex items-center gap-3 font-label-md hover:border-primary-container hover:shadow-md transition-all cursor-default group hover:-translate-y-1 md:-ml-4">
                <div className="w-6 h-6 bg-primary-container/10 rounded-full flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary-container text-xs" style={{ fontVariationSettings: "'FILL' 1" }}>send</span>
                </div>
                Telegram
              </div>
              <div className="px-6 py-4 bg-white border border-border-subtle rounded-full flex items-center gap-3 font-label-md hover:border-primary-container hover:shadow-md transition-all cursor-default group hover:-translate-y-1 md:-ml-4">
                <div className="w-6 h-6 bg-error/10 rounded-full flex items-center justify-center">
                  <span className="material-symbols-outlined text-error text-xs" style={{ fontVariationSettings: "'FILL' 1" }}>photo_camera</span>
                </div>
                Instagram
              </div>
              <div className="px-6 py-4 bg-white border border-border-subtle rounded-full flex items-center gap-3 font-label-md hover:border-primary-container hover:shadow-md transition-all cursor-default group hover:-translate-y-1">
                <div className="w-6 h-6 bg-secondary/10 rounded-full flex items-center justify-center">
                  <span className="material-symbols-outlined text-secondary text-xs" style={{ fontVariationSettings: "'FILL' 1" }}>hub</span>
                </div>
                amoCRM
              </div>
              <div className="px-6 py-4 bg-white border border-border-subtle rounded-full flex items-center gap-3 font-label-md hover:border-primary-container hover:shadow-md transition-all cursor-default group hover:-translate-y-1 md:-ml-4">
                <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary text-xs" style={{ fontVariationSettings: "'FILL' 1" }}>corporate_fare</span>
                </div>
                Bitrix24
              </div>
              <div className="px-6 py-4 bg-white border border-border-subtle rounded-full flex items-center gap-3 font-label-md hover:border-primary-container hover:shadow-md transition-all cursor-default group hover:-translate-y-1 md:-ml-4">
                <div className="w-6 h-6 bg-outline/10 rounded-full flex items-center justify-center">
                  <span className="material-symbols-outlined text-outline text-xs" style={{ fontVariationSettings: "'FILL' 1" }}>calendar_today</span>
                </div>
                Google Calendar
              </div>
            </div>
          </div>
        </section>

        {/* Section 6: Testimonials */}
        <section className="max-w-7xl mx-auto px-margin-page py-24 relative overflow-visible">
          <div className="blob-bg w-64 h-64 top-1/2 left-0 opacity-30"></div>
          <h2 className="font-headline-lg text-headline-lg text-center mb-16 reveal">{t.trustedBusinesses}</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter relative z-10 reveal">
            {/* Review 1 */}
            <div className="bg-white border border-border-subtle rounded-xl p-8 space-y-6 bento-card">
              <div className="flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className="material-symbols-outlined text-[#003527]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                ))}
              </div>
              <p className="font-body-md text-text-secondary italic leading-relaxed">{t.alexQuote}</p>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full shrink-0 border border-border-subtle bg-emerald-50 text-emerald-800 flex items-center justify-center font-bold text-sm select-none">
                  AR
                </div>
                <div>
                  <div className="font-label-md">Alex Rivera</div>
                  <div className="font-label-sm text-text-secondary">Founder, GreenTech</div>
                </div>
              </div>
            </div>

            {/* Review 2 */}
            <div className="bg-white border border-border-subtle rounded-xl p-8 space-y-6 bento-card">
              <div className="flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className="material-symbols-outlined text-[#003527]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                ))}
              </div>
              <p className="font-body-md text-text-secondary italic leading-relaxed">{t.sarahQuote}</p>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full shrink-0 border border-border-subtle bg-amber-50 text-amber-800 flex items-center justify-center font-bold text-sm select-none">
                  SC
                </div>
                <div>
                  <div className="font-label-md">Sarah Chen</div>
                  <div className="font-label-sm text-text-secondary">CTO, Modulo Labs</div>
                </div>
              </div>
            </div>

            {/* Review 3 */}
            <div className="bg-white border border-border-subtle rounded-xl p-8 space-y-6 bento-card">
              <div className="flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className="material-symbols-outlined text-[#003527]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                ))}
              </div>
              <p className="font-body-md text-text-secondary italic leading-relaxed">{t.jamesQuote}</p>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full shrink-0 border border-border-subtle bg-sky-50 text-sky-800 flex items-center justify-center font-bold text-sm select-none">
                  JM
                </div>
                <div>
                  <div className="font-label-md">James Miller</div>
                  <div className="font-label-sm text-text-secondary">Sales VP, Propel Real Estate</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 7: Partnership */}
        <section className="bg-white py-24 border-t border-border-subtle" id="partnership">
          <div className="max-w-7xl mx-auto px-margin-page">
            <div className="bg-bg-section border border-border-subtle rounded-2xl overflow-hidden grid grid-cols-1 md:grid-cols-2 shadow-sm reveal">
              
              <div className="p-12 border-b md:border-b-0 md:border-r border-border-subtle space-y-6 bg-white group">
                <div className="w-12 h-12 bg-primary-container/10 rounded-lg flex items-center justify-center transition-transform group-hover:scale-110">
                  <span className="material-symbols-outlined text-primary-container">groups</span>
                </div>
                <h3 className="font-headline-md text-headline-md">{t.agenciesTitle}</h3>
                <p className="text-text-secondary">{t.agenciesSub}</p>
                <ul className="space-y-3 text-body-sm">
                  <li className="flex items-center gap-2 transform translate-x-0 group-hover:translate-x-1 transition-transform">
                    <span className="material-symbols-outlined text-success text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span> {t.whiteLabelOptions}
                  </li>
                  <li className="flex items-center gap-2 transform translate-x-0 group-hover:translate-x-1 transition-transform delay-75">
                    <span className="material-symbols-outlined text-success text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span> {t.prioritySupport}
                  </li>
                  <li className="flex items-center gap-2 transform translate-x-0 group-hover:translate-x-1 transition-transform delay-100">
                    <span className="material-symbols-outlined text-success text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span> {t.dedicatedPartner}
                  </li>
                </ul>
                <a href="#contact" className="bg-primary-container text-white px-8 py-3 rounded-lg font-label-md hover:bg-primary transition-all active:scale-95 inline-block text-center select-none cursor-pointer">
                  {t.applyPartnership}
                </a>
              </div>

              <div className="p-12 space-y-6 group">
                <div className="w-12 h-12 bg-primary-container/10 rounded-lg flex items-center justify-center transition-transform group-hover:scale-110">
                  <span className="material-symbols-outlined text-primary-container">storefront</span>
                </div>
                <h3 className="font-headline-md text-headline-md">{t.resellersTitle}</h3>
                <p className="text-text-secondary">{t.resellersSub}</p>
                <ul className="space-y-3 text-body-sm">
                  <li className="flex items-center gap-2 transform translate-x-0 group-hover:translate-x-1 transition-transform">
                    <span className="material-symbols-outlined text-success text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span> {t.exclusiveDiscounts}
                  </li>
                  <li className="flex items-center gap-2 transform translate-x-0 group-hover:translate-x-1 transition-transform delay-75">
                    <span className="material-symbols-outlined text-success text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span> {t.marketingKits}
                  </li>
                  <li className="flex items-center gap-2 transform translate-x-0 group-hover:translate-x-1 transition-transform delay-100">
                    <span className="material-symbols-outlined text-success text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span> {t.trainingWebinars}
                  </li>
                </ul>
                <a href="#contact" className="border border-primary-container text-primary-container px-8 py-3 rounded-lg font-label-md hover:bg-primary-container/5 transition-all active:scale-95 inline-block text-center select-none cursor-pointer">
                  {t.learnMore}
                </a>
              </div>

            </div>
          </div>
        </section>

        {/* Section 8: Contact Form */}
        <section className="max-w-7xl mx-auto px-margin-page py-24 flex flex-col md:flex-row gap-24 relative overflow-visible" id="contact">
          <div className="blob-bg w-96 h-96 -bottom-20 right-0 opacity-40"></div>
          <div className="flex-1 space-y-8 relative z-10 reveal">
            <h2 className="font-headline-lg text-headline-lg">{t.buildToday}</h2>
            <p className="text-text-secondary text-body-lg">{t.buildTodaySub}</p>
            <div className="space-y-4">
              <div className="flex items-center gap-4 group cursor-pointer">
                <span className="material-symbols-outlined text-primary-container group-hover:scale-110 transition-transform">mail</span>
                <span className="group-hover:text-primary-container transition-colors">contact@homelander.ai</span>
              </div>
              <div className="flex items-center gap-4 group cursor-pointer">
                <span className="material-symbols-outlined text-primary-container group-hover:scale-110 transition-transform">location_on</span>
                <span className="group-hover:text-primary-container transition-colors">{t.headquarters}</span>
              </div>
            </div>
          </div>
          
          <div className="flex-1 relative z-10 reveal">
            {formSubmitted ? (
              <div className="bg-white border border-border-subtle p-8 rounded-2xl custom-shadow text-center space-y-4">
                <span className="material-symbols-outlined text-success text-6xl pulse-animation rounded-full p-2">check_circle</span>
                <h3 className="font-headline-md text-headline-md text-primary">{t.requestSent}</h3>
                <p className="text-text-secondary text-body-md">{t.requestSentSub}</p>
              </div>
            ) : (
              <form onSubmit={handleContactForm} className="space-y-6 bg-white border border-border-subtle p-8 rounded-2xl custom-shadow">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="font-label-md text-text-secondary">{t.nameLabel}</label>
                    <input 
                      required
                      value={formData.name}
                      onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full bg-white border border-border-subtle rounded-lg px-4 py-3 focus:border-primary-container focus:ring-1 focus:ring-primary-container outline-none transition-all" 
                      placeholder="John Doe" 
                      type="text"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="font-label-md text-text-secondary">{t.phoneLabel}</label>
                    <input 
                      required
                      value={formData.phone}
                      onChange={e => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      className="w-full bg-white border border-border-subtle rounded-lg px-4 py-3 focus:border-primary-container focus:ring-1 focus:ring-primary-container outline-none transition-all" 
                      placeholder="+1 (555) 000-0000" 
                      type="tel"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="font-label-md text-text-secondary">{t.businessTypeLabel}</label>
                  <select 
                    value={formData.businessType}
                    onChange={e => setFormData(prev => ({ ...prev, businessType: e.target.value }))}
                    className="w-full bg-white border border-border-subtle rounded-lg px-4 py-3 focus:border-primary-container focus:ring-1 focus:ring-primary-container outline-none transition-all cursor-pointer"
                  >
                    <option>E-commerce</option>
                    <option>Real Estate</option>
                    <option>SaaS</option>
                    <option>Agency</option>
                    <option>Other</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="font-label-md text-text-secondary">{t.messageLabel}</label>
                  <textarea 
                    value={formData.message}
                    onChange={e => setFormData(prev => ({ ...prev, message: e.target.value }))}
                    className="w-full bg-white border border-border-subtle rounded-lg px-4 py-3 focus:border-primary-container focus:ring-1 focus:ring-primary-container outline-none transition-all" 
                    placeholder="How can we help?" 
                    rows={4}
                  ></textarea>
                </div>
                <button className="w-full bg-primary-container text-white py-4 rounded-lg font-label-md font-bold hover:bg-primary transition-all shadow-md active:scale-[0.98]" type="submit">
                  {t.sendRequest}
                </button>
              </form>
            )}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-bg-section full-width border-t border-border-subtle relative z-10">
        <div className="w-full py-stack-lg px-margin-page max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start gap-gutter">
          <div className="space-y-6 max-w-xs">
            <img 
              alt="Homelander Logo" 
              className="h-8" 
              src="https://lh3.googleusercontent.com/aida/ADBb0ugwcWVp1D_eYWMoNgFuRqMDgaTLhYBZ-RVdu3mMfLlEZKsjBlGq-Q5j6qhybzRmWDQOnoa0PgVgNowjSXBpeuN8PbMm22TnvjsVD2P0KudnMGlCJ2Hk-VU0FyzuJCstK0BiB2cTOB9ETdbn6XTBKnXUNUiQYERa93WQdGlEGDgQPADvwzRjYSb2iLPdECLTWaLaph97bEY68_k0Ijc_Y8PaC8HbtkFJVVu_o-sUvKh1F-xkCi8z41HA4Y"
            />
            <p className="font-body-sm text-body-sm text-text-secondary">{t.landingFooterDesc}</p>
            <div className="flex gap-4">
              <span className="material-symbols-outlined text-text-secondary cursor-pointer hover:text-primary transition-all hover:scale-110">public</span>
              <span className="material-symbols-outlined text-text-secondary cursor-pointer hover:text-primary transition-all hover:scale-110">alternate_email</span>
              <span className="material-symbols-outlined text-text-secondary cursor-pointer hover:text-primary transition-all hover:scale-110">hub</span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-12">
            <div className="space-y-4">
              <div className="font-label-md text-primary font-bold">{t.product}</div>
              <div className="flex flex-col gap-2">
                <a className="font-label-sm text-label-sm text-text-secondary hover:text-primary transition-all underline decoration-transparent hover:decoration-primary" href="#hero">
                  {t.features}
                </a>
                <a className="font-label-sm text-label-sm text-text-secondary hover:text-primary transition-all underline decoration-transparent hover:decoration-primary" href="#bento">
                  {t.integrations}
                </a>
                <a className="font-label-sm text-label-sm text-text-secondary hover:text-primary transition-all underline decoration-transparent hover:decoration-primary" href="#partnership">
                  {t.pricing}
                </a>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="font-label-md text-primary font-bold">{t.company}</div>
              <div className="flex flex-col gap-2">
                <a className="font-label-sm text-label-sm text-text-secondary hover:text-primary transition-all underline decoration-transparent hover:decoration-primary" href="#partnership">
                  {t.partnership}
                </a>
                <span className="font-label-sm text-label-sm text-text-secondary hover:text-primary transition-all underline decoration-transparent hover:decoration-primary cursor-pointer">
                  {t.privacy}
                </span>
                <span className="font-label-sm text-label-sm text-text-secondary hover:text-primary transition-all underline decoration-transparent hover:decoration-primary cursor-pointer">
                  {t.terms}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-margin-page pb-8">
          <div className="pt-8 border-t border-border-subtle flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="font-label-sm text-label-sm text-text-secondary">© 2026 Homelander. All rights reserved.</p>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-success pulse-animation"></span>
              <span className="font-label-sm text-label-sm text-text-secondary">{t.allSystemsOperational}</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
