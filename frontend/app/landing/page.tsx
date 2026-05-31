'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { 
  Zap, MessageSquare, Bot, ArrowRight, Check, Play, Globe, CheckCircle2, 
  ChevronDown, Phone, Cpu, Layers, Award, Users, X, Mail, MapPin, Send,
  Shield, RefreshCw, Sparkles, MessageCircle
} from 'lucide-react';

const localT = {
  EN: {
    heroTitle1: "Elevate operations with ",
    heroTitleHighlight: "AI Agents",
    heroTitle2: " configured in minutes.",
    heroSub: "Automate custom customer support and active sales. Plug in your PDF knowledge base and sync instantly with WhatsApp, Telegram & Instagram (coming soon).",
    startFree: "Start Free",
    watchDemo: "Try Interactive Demo",
    features: "Features",
    pricing: "Pricing",
    company: "Company",
    privacy: "Privacy Policy",
    terms: "Terms of Use",
    offer: "Public Offer",
    cabinet: "To Cabinet",
    signIn: "Sign In",
    getStarted: "Get Started",
    product: "Product",
    partnership: "Partnership",
    allSystemsOperational: "All systems operational",
    buildToday: "Request Enterprise Solution",
    buildTodaySub: "Have complex backend integration requirements? Our team of AI engineers is ready to customize an agent for your scale.",
    nameLabel: "Name",
    phoneLabel: "Phone Number",
    businessTypeLabel: "Niche",
    messageLabel: "Project Scope Description",
    sendRequest: "Submit Inquiry",
    requestSent: "Inquiry Sent!",
    requestSentSub: "Our integration team will reach out within 1 business day."
  },
  RU: {
    heroTitle1: "Умные ",
    heroTitleHighlight: "ИИ-ассистенты",
    heroTitle2: " для автоматизации вашего бизнеса.",
    heroSub: "Делегируйте рутинную поддержку и продажи умным агентам. Подключите собственную базу знаний и общайтесь с клиентами в WhatsApp, Telegram и Instagram (coming soon).",
    startFree: "Начать бесплатно",
    watchDemo: "Протестировать демо",
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
    buildToday: "Оставить заявку на кастомное решение",
    buildTodaySub: "Требуется сложная интеграция с вашей CRM/ERP или кастомная база данных? Свяжитесь с нами для детального проектирования.",
    nameLabel: "Ваше имя",
    phoneLabel: "Номер телефона (WhatsApp)",
    businessTypeLabel: "Отрасль бизнеса",
    messageLabel: "Какую задачу нужно решить ИИ-боту?",
    sendRequest: "Отправить заявку",
    requestSent: "Заявка принята!",
    requestSentSub: "Специалист свяжется с вами в течение рабочего дня."
  },
  KZ: {
    heroTitle1: "Сіздің бизнесіңізге арналған ақылды ",
    heroTitleHighlight: "ЖИ-көмекшілер",
    heroTitle2: ". Бәрін автоматтандыру.",
    heroSub: "Қолдау көрсету мен сатуды ақылды агенттерге тапсырыңыз. Жеке білім базаңызды қосып, WhatsApp, Telegram және Instagram (coming soon) желілерінде жұмыс істеңіз.",
    startFree: "Тегін бастау",
    watchDemo: "Демоны көру",
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
    buildToday: "Жеке шешімге тапсырыс беру",
    buildTodaySub: "CRM/ERP жүйесімен интеграция қажет пе? Сұрақтарыңызды қалдырыңыз, біз көмектесеміз.",
    nameLabel: "Атыңыз",
    phoneLabel: "Телефон нөмірі (WhatsApp)",
    businessTypeLabel: "Бизнес саласы",
    messageLabel: "ЖИ-бот қандай мәселені шешуі керек?",
    sendRequest: "Сұранысты жіберу",
    requestSent: "Сұраныс қабылданды!",
    requestSentSub: "Маман жұмыс күні ішінде сізге хабарласады."
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
  const [activeModal, setActiveModal] = useState<'privacy' | 'terms' | 'offer' | null>(null);

  const t = { ...globalT, ...localT[language] };

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
    <div className="font-body-md text-slate-800 bg-[#FAFAFA] min-h-screen">
      {/* Import Inter & Space Grotesk dynamically */}
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Space+Grotesk:wght@500;600;700&display=swap" rel="stylesheet" />

      {/* Styled configurations block */}
      <style jsx global>{`
        body {
          background-color: #FAFAFA;
          font-family: 'Inter', -apple-system, sans-serif;
          color: #1E293B;
          letter-spacing: -0.01em;
        }
        .heading-font {
          font-family: 'Space Grotesk', -apple-system, sans-serif;
        }
        .custom-glow {
          box-shadow: 0 0 80px -10px rgba(20, 184, 166, 0.04);
        }
        .thin-border {
          border: 1px solid rgba(226, 232, 240, 0.8);
        }
        .glass-header {
          background: rgba(250, 250, 250, 0.8);
          backdrop-filter: blur(12px);
          border-bottom: 1px solid rgba(226, 232, 240, 0.6);
        }
        .pricing-card {
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .pricing-card:hover {
          transform: translateY(-4px);
          border-color: #0D9488;
          box-shadow: 0 20px 40px -15px rgba(13, 148, 136, 0.08);
        }
        .btn-premium {
          transition: all 0.2s ease;
        }
        .btn-premium:hover {
          transform: scale(1.01);
          box-shadow: 0 8px 24px -8px rgba(13, 148, 136, 0.3);
        }
      `}</style>

      {/* Glass Header */}
      <header className="glass-header sticky top-0 w-full z-50">
        <div className="flex justify-between items-center max-w-7xl mx-auto px-6 h-16">
          <Link href="/landing" className="flex items-center gap-2 select-none cursor-pointer">
            <Bot className="w-6 h-6 text-teal-600" />
            <span className="font-semibold text-lg tracking-tight heading-font text-slate-900">UP-CHAT</span>
          </Link>

          <nav className="hidden md:flex gap-8 items-center">
            <Link className="text-sm font-medium text-slate-500 hover:text-teal-600 transition-colors" href="/demo">
              {t.watchDemo}
            </Link>
            <a className="text-sm font-medium text-slate-500 hover:text-teal-600 transition-colors" href="#pricing-section">
              {t.pricing}
            </a>
            <a className="text-sm font-medium text-slate-500 hover:text-teal-600 transition-colors" href="#contact-section">
              {t.partnership}
            </a>
          </nav>

          <div className="flex items-center gap-4">
            {/* Language Selector */}
            <div className="relative">
              <button
                onClick={() => setLangDropdownOpen(!langDropdownOpen)}
                className="flex items-center gap-1.5 bg-white border border-slate-200 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:text-teal-600 hover:border-teal-600 transition-all select-none cursor-pointer"
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
                        language === lang ? 'bg-teal-50 text-teal-600 font-semibold' : 'text-slate-600 hover:bg-slate-50'
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
                className="bg-slate-900 text-white px-4 py-2 rounded-lg text-xs font-medium hover:bg-slate-800 transition-all active:scale-[0.98]"
              >
                {t.cabinet}
              </Link>
            ) : (
              <>
                <Link href="/login" className="text-xs font-medium text-slate-600 hover:text-teal-600 transition-colors">
                  {t.signIn}
                </Link>
                <Link 
                  href="/register" 
                  className="bg-teal-600 text-white px-4 py-2 rounded-lg text-xs font-medium hover:bg-teal-700 transition-all active:scale-[0.98]"
                >
                  {t.getStarted}
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-16 space-y-32">
        
        {/* Hero Section */}
        <section className="text-center max-w-4xl mx-auto py-12 space-y-8 relative overflow-visible">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-teal-50/40 rounded-full blur-[100px] -z-10" />
          
          <div className="inline-flex items-center gap-1.5 bg-teal-50/60 border border-teal-100/80 px-3 py-1 rounded-full text-xs font-medium text-teal-800">
            <Sparkles className="w-3.5 h-3.5 text-teal-600" />
            <span>Next-gen AI Agents Platform</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-semibold tracking-tight text-slate-950 heading-font leading-[1.1]">
            {t.heroTitle1}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-emerald-700 font-bold">
              {t.heroTitleHighlight}
            </span>
            {t.heroTitle2}
          </h1>

          <p className="text-base sm:text-lg text-slate-500 max-w-2xl mx-auto font-light leading-relaxed">
            {t.heroSub}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 items-center justify-center pt-4">
            <Link 
              href={user ? "/bots" : "/register"} 
              className="bg-slate-900 text-white px-8 py-3.5 rounded-lg text-sm font-medium hover:bg-slate-800 transition-all active:scale-[0.98] w-full sm:w-auto"
            >
              {user ? t.cabinet : t.startFree}
            </Link>
            <Link 
              href="/demo" 
              className="bg-white border border-slate-200 text-slate-600 hover:text-slate-950 hover:border-slate-300 px-8 py-3.5 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-all w-full sm:w-auto cursor-pointer"
            >
              <Play className="w-4 h-4 fill-slate-400 stroke-none" />
              <span>{t.watchDemo}</span>
            </Link>
          </div>
        </section>

        {/* Features Bento Grid */}
        <section className="space-y-16">
          <div className="text-center space-y-3">
            <h2 className="text-3xl font-semibold tracking-tight text-slate-950 heading-font">
              Корпоративный уровень в деталях
            </h2>
            <p className="text-slate-500 text-sm max-w-xl mx-auto">
              Гибкие настройки базы знаний и полная автоматизация клиентских путей.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white thin-border rounded-2xl p-8 space-y-4 shadow-sm relative overflow-hidden group">
              <div className="w-10 h-10 rounded-lg bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-600">
                <Cpu className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 heading-font">База знаний PDF / TXT</h3>
              <p className="text-slate-500 text-sm font-light leading-relaxed">
                Загружайте регламенты компании, инструкции по товарам или скрипты продаж. Модель мгновенно обучается на ваших данных.
              </p>
            </div>

            <div className="bg-white thin-border rounded-2xl p-8 space-y-4 shadow-sm relative overflow-hidden group">
              <div className="w-10 h-10 rounded-lg bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-600">
                <MessageSquare className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 heading-font">Гибридный Live-чат</h3>
              <p className="text-slate-500 text-sm font-light leading-relaxed">
                ИИ обрабатывает до 90% запросов самостоятельно. В сложных случаях диалог бесшовно передается на реального оператора.
              </p>
            </div>

            <div className="bg-white thin-border rounded-2xl p-8 space-y-4 shadow-sm relative overflow-hidden group">
              <div className="w-10 h-10 rounded-lg bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-600">
                <Layers className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 heading-font">Мультиканальная связка</h3>
              <p className="text-slate-500 text-sm font-light leading-relaxed">
                Подключайте аккаунты WhatsApp Business, Telegram и Instagram (coming soon). Все переписки доступны в одном удобном дашборде.
              </p>
            </div>
          </div>
        </section>

        {/* Pricing Section (Robokassa KZ Compliant) */}
        <section id="pricing-section" className="space-y-16 scroll-mt-24">
          <div className="text-center space-y-3">
            <h2 className="text-3xl font-semibold tracking-tight text-slate-950 heading-font">
              Пакеты предоплаты сообщений
            </h2>
            <p className="text-slate-500 text-sm max-w-xl mx-auto">
              Оплата производится без подписок и скрытых автосписаний. Вы платите только за реальные объемы ИИ-консультаций.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Tariff 1 */}
            <div className="pricing-card bg-white thin-border rounded-2xl p-8 flex flex-col justify-between shadow-sm relative">
              <div className="space-y-6">
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-slate-900 heading-font">Starter</h3>
                  <p className="text-xs text-slate-400 font-light">Для небольших проектов или тестирования</p>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-slate-900 heading-font">6 750 ₸</span>
                  <span className="text-sm text-slate-500 font-light">(≈ $15)</span>
                </div>
                <div className="border-t border-slate-100 pt-6 space-y-4">
                  <div className="flex items-center gap-2.5 text-sm text-slate-600">
                    <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                    <span>1 000 ИИ-сообщений</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-sm text-slate-600">
                    <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                    <span>Интеграция с WhatsApp/Telegram</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-sm text-slate-600">
                    <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                    <span>ИИ-обработка 24/7</span>
                  </div>
                </div>
              </div>
              <div className="pt-8">
                <Link 
                  href="/register" 
                  className="block text-center bg-slate-50 hover:bg-slate-100 text-slate-800 py-3 rounded-lg text-sm font-medium transition-all"
                >
                  Выбрать Starter
                </Link>
              </div>
            </div>

            {/* Tariff 2 (Popular) */}
            <div className="pricing-card bg-white thin-border rounded-2xl p-8 flex flex-col justify-between shadow-sm relative border-teal-600 ring-1 ring-teal-600/30">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-teal-600 text-white px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase">
                Популярно ⭐
              </div>
              <div className="space-y-6">
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-slate-900 heading-font">Growth</h3>
                  <p className="text-xs text-slate-400 font-light">Отличное решение для растущих компаний</p>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-slate-900 heading-font">15 750 ₸</span>
                  <span className="text-sm text-slate-500 font-light">(≈ $35)</span>
                </div>
                <div className="border-t border-slate-100 pt-6 space-y-4">
                  <div className="flex items-center gap-2.5 text-sm text-slate-600">
                    <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                    <span className="font-medium text-slate-900">6 000 ИИ-сообщений</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-sm text-slate-600">
                    <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                    <span>Интеграция с WhatsApp/Telegram</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-sm text-slate-600">
                    <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                    <span>Приоритетная скорость обработки</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-sm text-slate-600">
                    <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                    <span>Приоритетная техподдержка</span>
                  </div>
                </div>
              </div>
              <div className="pt-8">
                <Link 
                  href="/register" 
                  className="block text-center bg-teal-600 hover:bg-teal-700 text-white py-3 rounded-lg text-sm font-medium transition-all shadow-sm shadow-teal-600/10"
                >
                  Выбрать Growth
                </Link>
              </div>
            </div>

            {/* Tariff 3 */}
            <div className="pricing-card bg-white thin-border rounded-2xl p-8 flex flex-col justify-between shadow-sm relative">
              <div className="space-y-6">
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-slate-900 heading-font">Pro Unlimited</h3>
                  <p className="text-xs text-slate-400 font-light">Для крупного бизнеса с большим трафиком</p>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-slate-900 heading-font">33 750 ₸</span>
                  <span className="text-sm text-slate-500 font-light">(≈ $75)</span>
                </div>
                <div className="border-t border-slate-100 pt-6 space-y-4">
                  <div className="flex items-center gap-2.5 text-sm text-slate-600">
                    <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                    <span className="font-medium text-slate-900">15 000 ИИ-сообщений</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-sm text-slate-600">
                    <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                    <span>Подключение всех мессенджеров</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-sm text-slate-600">
                    <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                    <span>Максимальная скорость ответа ИИ</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-sm text-slate-600">
                    <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                    <span>Выделенный менеджер</span>
                  </div>
                </div>
              </div>
              <div className="pt-8">
                <Link 
                  href="/register" 
                  className="block text-center bg-slate-50 hover:bg-slate-100 text-slate-800 py-3 rounded-lg text-sm font-medium transition-all"
                >
                  Выбрать Pro Unlimited
                </Link>
              </div>
            </div>
          </div>

          <div className="text-center max-w-xl mx-auto">
            <p className="text-xs text-slate-400 leading-normal font-light">
              * 1 сообщение = 1 полный цикл ответа ИИ (до 10 000 токенов контекста, без скрытых доплат).<br />
              По исчерпанию пакета вы можете докупить любой необходимый объём сообщений в панели настроек в любой момент.
            </p>
          </div>
        </section>

        {/* Contact Form Section */}
        <section id="contact-section" className="scroll-mt-24">
          <div className="bg-white thin-border rounded-3xl shadow-sm overflow-hidden grid grid-cols-1 md:grid-cols-2">
            {/* Info panel */}
            <div className="p-12 space-y-8 flex flex-col justify-center bg-slate-50/50">
              <div className="w-10 h-10 rounded-lg bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-600">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div className="space-y-3">
                <h3 className="text-2xl font-semibold tracking-tight text-slate-900 heading-font">
                  {t.buildToday}
                </h3>
                <p className="text-slate-500 text-sm font-light leading-relaxed">
                  {t.buildTodaySub}
                </p>
              </div>
              <div className="space-y-4 pt-4 border-t border-slate-200/50 text-sm text-slate-600 font-light">
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-teal-600" />
                  <span>geducation1017@gmail.com</span>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-teal-600" />
                  <span>+7 777 420-19-89</span>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin className="w-4 h-4 text-teal-600" />
                  <span>140000, Казахстан, г. Павлодар, ул. Малахова, д. 11</span>
                </div>
              </div>
            </div>

            {/* Form panel */}
            <div className="p-12 bg-white flex flex-col justify-center">
              {formSubmitted ? (
                <div className="text-center space-y-4 py-8">
                  <div className="w-16 h-16 bg-teal-50 border border-teal-100 rounded-full flex items-center justify-center text-teal-600 mx-auto">
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
                      className="w-full bg-slate-50/50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:border-teal-500 focus:bg-white outline-none transition-all font-light" 
                      placeholder="Александр" 
                      type="text"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-slate-500">{t.phoneLabel}</label>
                    <input 
                      required
                      value={formData.phone}
                      onChange={e => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      className="w-full bg-slate-50/50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:border-teal-500 focus:bg-white outline-none transition-all font-light" 
                      placeholder="+7 (707) 123-45-67" 
                      type="tel"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-slate-500">{t.businessTypeLabel}</label>
                    <select 
                      value={formData.businessType}
                      onChange={e => setFormData(prev => ({ ...prev, businessType: e.target.value }))}
                      className="w-full bg-slate-50/50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:border-teal-500 focus:bg-white outline-none transition-all cursor-pointer text-slate-700 font-light"
                    >
                      <option>E-commerce</option>
                      <option>Автосалон</option>
                      <option>Онлайн-школа</option>
                      <option>Услуги / Агентство</option>
                      <option>Другое</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-slate-500">{t.messageLabel}</label>
                    <textarea 
                      value={formData.message}
                      onChange={e => setFormData(prev => ({ ...prev, message: e.target.value }))}
                      className="w-full bg-slate-50/50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:border-teal-500 focus:bg-white outline-none transition-all font-light" 
                      placeholder="Опишите ваши задачи..." 
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
            {/* Logo and legal details */}
            <div className="md:col-span-8 space-y-4">
              <div className="flex items-center gap-2 select-none">
                <Bot className="w-5 h-5 text-teal-600" />
                <span className="font-semibold text-md tracking-tight heading-font text-slate-900">UP-CHAT</span>
              </div>
              <div className="text-[13px] text-slate-400 font-light leading-relaxed space-y-1 max-w-2xl">
                <div>ТОО "SAAMA GROUP", БИН: 171040010072</div>
                <div>Юридический адрес: 140000, Республика Казахстан, г. Павлодар, улица Малахова, дом 11</div>
                <div>Контакты: +7 777 420-19-89 | geducation1017@gmail.com</div>
                <div>График работы службы поддержки: Пн-Пт: 09:00 - 18:00 (GMT+5)</div>
              </div>
            </div>

            {/* Links columns */}
            <div className="md:col-span-4 grid grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="text-sm font-semibold text-slate-900 uppercase tracking-wider">{t.product}</div>
                <div className="flex flex-col gap-2 text-sm font-light text-slate-500">
                  <Link className="hover:text-teal-600 transition-colors" href="/demo">{t.watchDemo}</Link>
                  <a className="hover:text-teal-600 transition-colors" href="#pricing-section">{t.pricing}</a>
                </div>
              </div>
              <div className="space-y-3">
                <div className="text-sm font-semibold text-slate-900 uppercase tracking-wider">{t.company}</div>
                <div className="flex flex-col gap-2 text-sm font-light text-slate-500">
                  <span onClick={() => setActiveModal('offer')} className="hover:text-teal-600 transition-colors cursor-pointer select-none">{t.offer}</span>
                  <span onClick={() => setActiveModal('privacy')} className="hover:text-teal-600 transition-colors cursor-pointer select-none">{t.privacy}</span>
                  <span onClick={() => setActiveModal('terms')} className="hover:text-teal-600 transition-colors cursor-pointer select-none">{t.terms}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4 text-sm font-light text-slate-400">
            <p>© 2026 ТОО "SAAMA GROUP". up-chat.com. Все права защищены.</p>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 pulse-animation"></span>
              <span>{t.allSystemsOperational}</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Modal Dialogs with complete customer template texts configured for SAAMA GROUP */}
      {activeModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)' }}>
          <div className="bg-white" style={{ width: '90%', maxWidth: '750px', height: '80vh', borderRadius: '24px', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 30px 60px -15px rgba(0,0,0,0.12)', border: '1px solid rgba(226, 232, 240, 0.8)' }}>
            
            {/* Modal Header */}
            <div style={{ padding: '20px 28px', borderBottom: '1px solid rgba(226, 232, 240, 0.8)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 className="font-semibold text-base text-slate-900 heading-font">
                {activeModal === 'offer' && 'Договор-оферта'}
                {activeModal === 'privacy' && 'Политика конфиденциальности'}
                {activeModal === 'terms' && 'Условия пользования'}
              </h3>
              <button 
                onClick={() => setActiveModal(null)} 
                className="text-slate-400 hover:text-slate-700 transition-colors p-1.5 hover:bg-slate-100 rounded-full cursor-pointer select-none"
              >
                <X size={18} />
              </button>
            </div>
            
            {/* Modal Body */}
            <div style={{ flex: 1, padding: '28px', overflowY: 'auto', fontSize: '13px', lineHeight: '1.7', color: '#475569' }} className="space-y-6 font-light">
              
              {activeModal === 'privacy' && (
                <>
                  <p className="font-normal text-slate-950 text-xs">Дата вступления в силу: 29 мая 2026 г.</p>
                  <p>
                    Настоящая Политика конфиденциальности персональных данных (далее – Политика конфиденциальности) является публичным Договором, заключенным между владельцем сервиса <strong>Товариществом с ограниченной ответственностью «SAAMA GROUP»</strong> (Исполнитель) и Заказчиком (также «Пользователь») в соответствии со ст.387 Гражданского кодекса Республики Казахстан, основана на Законе Республики Казахстан «О персональных данных и их защите», действует в отношении информации, содержащей персональные данные Заказчиков, которую сервис <strong>https://up-chat.com</strong> (далее – сервис) может получить о Заказчиках во время пользования ими сайтом сервиса.
                  </p>
                  
                  <h4 className="font-semibold text-slate-900 mt-4">1. Определение терминов</h4>
                  <ul className="list-disc pl-5 space-y-2">
                    <li><strong>Персональные данные</strong> — сведения, относящиеся к определенному или определяемому на их основании субъекту персональных данных, зафиксированные на электронном, бумажном и (или) ином материальном носителе.</li>
                    <li><strong>Неличные данные</strong> — сведения, которые автоматически передаются в процессе просмотра Заказчиком рекламных блоков и при посещении страниц, на которых установлен статистический скрипт системы: адрес запрашиваемой страницы, информация cookie, IP-адрес, информация о браузере, реферер (адрес предыдущей страницы), время доступа.</li>
                    <li><strong>Сбор персональных данных</strong> — действия, направленные на получение персональных данных.</li>
                    <li><strong>Обработка персональных данных</strong> — действия, направленные на накопление, хранение, изменение, дополнение, использование, распространение, обезличивание, блокирование и уничтожение персональных данных.</li>
                    <li><strong>Защита персональных данных</strong> — комплекс мер, в том числе правовых, организационных и технических, осуществляемых в целях, установленных Законом РК «О персональных данных и их защите».</li>
                    <li><strong>Сервис</strong> — Интернет-сайт, расположенный на сервере и имеющий адрес в сети Интернет <strong>https://up-chat.com</strong>, на котором предлагаются подписки для приобретения Заказчиками.</li>
                    <li><strong>Сервисы Интернет-сайта</strong> — все услуги, доступные для использования на сайте <strong>https://up-chat.com</strong> и поддоменах.</li>
                    <li><strong>Заказчик</strong> — пользователь сервиса.</li>
                    <li><strong>Исполнитель</strong> — Товарищество с ограниченной ответственностью «SAAMA GROUP», являющееся владельцем сервиса, БИН 171040010072.</li>
                    <li><strong>Cookies</strong> — это небольшие текстовые файлы, в которые браузер записывает данные с посещенных Заказчиками сайтов.</li>
                    <li><strong>IP-адрес</strong> — уникальный сетевой адрес узла в компьютерной сети, построенной по протоколу IP, позволяющий определить местонахождение Заказчика (не подробнее, чем город и область).</li>
                  </ul>

                  <h4 className="font-semibold text-slate-900 mt-4">2. Предмет политики конфиденциальности</h4>
                  <p>
                    Настоящая Политика конфиденциальности устанавливает обязательства Исполнителя по неразглашению и обеспечению режима защиты конфиденциальности персональных данных, которые Заказчик предоставляет по запросу Исполнителя при регистрации на сайте сервиса и/или при покупке подписки.
                  </p>
                  <p>
                    Персональные данные, разрешённые к обработке в рамках настоящей Политики конфиденциальности, предоставляются Заказчиком путём заполнения регистрационной формы на сайте сервиса и включают в себя: фамилию, имя, отчество (по желанию); контактный телефон; адрес электронной почты (e-mail).
                  </p>
                  <p>
                    В рамках интеграции с Google Calendar, сервис получает и обрабатывает: статусы в календарях (занято/свободно), мероприятия в календаре (создание, изменение, удаление), access и refresh токены для аутентификации. Пользователь может в любой момент отключить интеграцию, удалив плагин.
                  </p>

                  <h4 className="font-semibold text-slate-900 mt-4">3. Цели сбора и обработки персональных данных Заказчиков</h4>
                  <p>
                    Исполнитель собирает, обрабатывает и хранит только те персональные данные, которые необходимы для предоставления Сервисов. Используются для: идентификации Заказчика; обработки и получения платежей; предоставления клиентской поддержки; связи с Заказчиком; улучшения качества Сервисов; проведения исследований на основе неличных данных.
                  </p>

                  <h4 className="font-semibold text-slate-900 mt-4">4. Права и обязанности сторон</h4>
                  <p>
                    Заказчик обязан предоставлять достоверную информацию и изменять ее при необходимости. Заказчик имеет право на доступ, редактирование, исправление или удаление своих персональных данных, а также на отзыв согласия. Запросы отправляются на почту <strong>geducation1017@gmail.com</strong>.
                  </p>
                  <p>
                    Исполнитель обязан использовать информацию только в целях Соглашения, обеспечивать конфиденциальность, принимать меры защиты.
                  </p>

                  <h4 className="font-semibold text-slate-900 mt-4">5. Прочие условия</h4>
                  <p>
                    Пользование сервисом означает безоговорочное согласие с настоящей Политикой. Настоящая Политика применяется только к сайту <strong>https://up-chat.com</strong> и поддоменам. Исполнитель оставляет за собой право в одностороннем порядке изменять Политику. Вопросы принимаются на e-mail: <strong>geducation1017@gmail.com</strong>.
                  </p>

                  <h4 className="font-semibold text-slate-900 mt-4">6. Контакты</h4>
                  <p>
                    <strong>ТОО "SAAMA GROUP"</strong><br />
                    БИН: 171040010072<br />
                    Адрес: 140000, Казахстан, г. Павлодар, улица Малахова, дом 11<br />
                    Электронная почта: <strong>geducation1017@gmail.com</strong>
                  </p>
                </>
              )}

              {activeModal === 'terms' && (
                <>
                  <p className="font-normal text-slate-950 text-xs">Дата вступления в силу: 29 мая 2026 г.</p>
                  <h4 className="font-semibold text-slate-900 mt-4">Введение</h4>
                  <p>
                    <strong>ТОО "SAAMA GROUP"</strong> ("Компания", "мы", "наш", "нас"), расположенное по адресу Республика Казахстан, г. Павлодар, улица Малахова, дом 11, БИН: 171040010072, обязуется защищать ваши персональные данные. Для обработки ваших данных нам требуется ваше явное согласие в соответствии со статьями Закона Республики Казахстан "О персональных данных и их защите" (далее - "Закон").
                  </p>

                  <h4 className="font-semibold text-slate-900 mt-4">1. Цель обработки данных</h4>
                  <p>
                    Мы обрабатываем персональные данные для следующих целей: отправка рекламных и информационных электронных писем; персонализация взаимодействия с платформой; передача партнерам для аналитики; обеспечение доступа к функционалу сайта и управления учетной записью; использование инструментов создания проектов и иные законные цели.
                  </p>

                  <h4 className="font-semibold text-slate-900 mt-4">2. Данные, которые мы собираем</h4>
                  <p>
                    Сбор включает в себя: ФИО, дату рождения, пол, адрес электронной почты, номер телефона, данные удостоверения личности, номер расчетного счета и иные необходимые данные. Перечень действий: сбор, запись, систематизация, накопление, хранение, уточнение, извлечение, использование, блокирование, удаление, уничтожение.
                  </p>

                  <h4 className="font-semibold text-slate-900 mt-4">3. Правовые основания для обработки</h4>
                  <p>
                    Ваше согласие обеспечивает правовую основу для обработки. Вы можете отозвать согласие в любое время, отправив запрос на <strong>geducation1017@gmail.com</strong>.
                  </p>

                  <h4 className="font-semibold text-slate-900 mt-4">4. Ваши права</h4>
                  <p>
                    В соответствии с Законом вы имеете право: получить доступ к данным; исправить неточные данные; запросить удаление; ограничивать обработку; отозвать согласие; запрашивать переносимость данных.
                  </p>

                  <h4 className="font-semibold text-slate-900 mt-4">5. Хранение данных</h4>
                  <p>
                    Данные хранятся исключительно в течение срока, необходимого для достижения целей обработки, если иное не предусмотрено законодательством Республики Казахстан.
                  </p>

                  <h4 className="font-semibold text-slate-900 mt-4">6. Совместное использование третьими лицами</h4>
                  <p>
                    Мы можем передавать данные поставщикам услуг, аналитическим партнерам или юридическим государственным органам Республики Казахстан в случаях, когда это требуется по закону.
                  </p>

                  <h4 className="font-semibold text-slate-900 mt-4">7. Международная передача данных</h4>
                  <p>
                    При трансграничной передаче данных Компания принимает все надлежащие меры предосторожности в соответствии с законодательством Республики Казахстан.
                  </p>

                  <h4 className="font-semibold text-slate-900 mt-4">8. Контактная информация</h4>
                  <p>
                    Электронная почта: <strong>geducation1017@gmail.com</strong><br />
                    Почтовый адрес: 140000, Республика Казахстан, г. Павлодар, улица Малахова, дом 11
                  </p>
                </>
              )}

              {activeModal === 'offer' && (
                <>
                  <p className="font-normal text-slate-950 text-xs">Дата вступления в силу: 29 мая 2026 г.</p>
                  <h3 className="font-semibold text-slate-900 text-sm">Публичный договор-оферта ТОО "SAAMA GROUP" (далее – Исполнитель)</h3>
                  <p>
                    Настоящая публичная оферта (далее – Оферта) является Договором, заключенным между Исполнителем и пользователем услуг - физическим лицом и/или юридическим лицом (далее - Заказчик), который определяет условия приобретения и оказания услуг с использованием ресурсов Исполнителя.
                  </p>

                  <h4 className="font-semibold text-slate-900 mt-4">Термины и Определения</h4>
                  <ul className="list-disc pl-5 space-y-1">
                    <li><strong>Период действия тарифа</strong> — срок, в течение которого Заказчик имеет право на использование услуг, приобретенных у Исполнителя в рамках выбранного тарифа.</li>
                    <li><strong>Обработка данных</strong> — совокупность действий с персональными данными, включая сбор, хранение, использование, изменение, передачу и удаление.</li>
                    <li><strong>Конфиденциальная информация</strong> — информация, предоставленная Заказчиком или полученная Исполнителем в процессе оказания услуг.</li>
                    <li><strong>ИИ-ассистент</strong> — Программное обеспечение, разработанное Исполнителем, выполняющее функции автоматизации взаимодействия.</li>
                    <li><strong>Тариф</strong> — комплекс услуг, предлагаемый Исполнителем и описанный на сайте.</li>
                    <li><strong>Сайт</strong> — сайт, принадлежащий Исполнителю и имеющий адрес: <strong>https://up-chat.com</strong>.</li>
                    <li><strong>Сервис</strong> — информационная система Исполнителя, разработанная для предоставления услуг.</li>
                  </ul>

                  <h4 className="font-semibold text-slate-900 mt-4">Общие Положения</h4>
                  <p>
                    Исполнитель публикует настоящую Оферту в соответствии со ст. 395, 396 и 447 Гражданского кодекса Республики Казахстан (ГК РК). Договор заключается в момент приобретения тарифа. Заказчик безоговорочно принимает все условия оферты в полном объеме. Акцептом оферты является факт произведения Заказчиком оплаты тарифа на сайте <strong>https://up-chat.com</strong>.
                  </p>

                  <h4 className="font-semibold text-slate-900 mt-4">Статус Сайта Исполнителя</h4>
                  <p>
                    Сайт является собственностью Исполнителя. Произведя оплату оформленного заказа, Заказчик получает услуги на условиях и в порядке, определенных Договором. Исполнитель не несет ответственности за достоверность информации, предоставленной Заказчиком при регистрации.
                  </p>

                  <h4 className="font-semibold text-slate-900 mt-4">Статус Заказчика</h4>
                  <p>
                    Заказчик несет ответственность за достоверность предоставленной информации. Заказчик дает согласие на обработку его персональных данных в целях исполнения соглашения.
                  </p>

                  <h4 className="font-semibold text-slate-900 mt-4">Предмет Оферты</h4>
                  <p>
                    Исполнитель обязуется предоставить услуги по предоставлению доступа к ПО ИИ-ассистента по ценам и тарифам, установленным на сайте. Обязательства считаются исполненными в момент предоставления доступа к личному кабинету с начисленным балансом.
                  </p>

                  <h4 className="font-semibold text-slate-900 mt-4">Порядок Заключения Договора</h4>
                  <p>
                    Заказчик выбирает и оплачивает тариф на странице <strong>https://up-chat.com#pricing-section</strong> после прохождения регистрации. Заявка также может быть подана через почту <strong>geducation1017@gmail.com</strong>.
                  </p>

                  <h4 className="font-semibold text-slate-900 mt-4">Информация о Тарифах</h4>
                  <p>
                    Вся информация о тарифах указана на сайте. Характеристики носят справочный характер. Все вопросы можно задать службе технической поддержки Исполнителя.
                  </p>

                  <h4 className="font-semibold text-slate-900 mt-4">Порядок Приобретения Услуг</h4>
                  <p>
                    Заказчик вправе приобрести выбранный тариф. После оплаты Заказчик в течение 30 минут получает доступ к полному функционалу тарифа. Срок действия тарифа составляет 30 календарных дней.
                  </p>

                  <h4 className="font-semibold text-slate-900 mt-4">Цена Услуг</h4>
                  <p>
                    Цены тарифов приведены на сайте. Указанная на сайте цена может быть изменена Исполнителем в одностороннем порядке для последующих расчетных периодов.
                  </p>

                  <h4 className="font-semibold text-slate-900 mt-4">Оплата Услуг</h4>
                  <p>
                    Оплата услуг производится безналичным расчетом через интегрированную платежную систему. Расчеты производятся в тенге Республики Казахстан. Заказчик может отменить автопродление в своем личному кабинете в любой момент.
                  </p>

                  <h4 className="font-semibold text-slate-900 mt-4">Возврат Денег За Подписку</h4>
                  <p>
                    Возврат денежных средств возможен в случае, если услуги не были оказаны в срок, Исполнитель не предоставил доступ к ПО, либо если выявлены существенные недостатки в работе ИИ-ассистента, которые не были устранены в течение 5 рабочих дней. Заявление о возврате направляется на почту <strong>geducation1017@gmail.com</strong>.
                  </p>

                  <h4 className="font-semibold text-slate-900 mt-4">Ответственность Сторон</h4>
                  <p>
                    Сторон несут ответственность по законодательству Республики Казахстан. Исполнитель не несет ответственности за недостижение Заказчиком субъективно ожидаемых результатов, а также за ошибки, вызванные некорректной интеграцией со стороны Заказчика.
                  </p>

                  <h4 className="font-semibold text-slate-900 mt-4">Прочие Условия</h4>
                  <p>
                    Все споры и разногласия решаются путем переговоров, при невозможности — в суде РК по месту нахождения Исполнителя.
                  </p>

                  <h4 className="font-semibold text-slate-900 mt-4">Адрес и Реквизиты Исполнителя</h4>
                  <p className="font-normal text-slate-800">
                    Наименование: ТОО "SAAMA GROUP"<br />
                    Юридический адрес: 140000, Республика Казахстан, г. Павлодар, улица Малахова, дом 11<br />
                    БИН: 171040010072<br />
                    Номер расчетного счета в тенге: [ВСТАВИТЬ_Р/С_KZT]<br />
                    Номер расчетного счета в рублях: [ВСТАВИТЬ_Р/С_RUB]<br />
                    в банке: [ВСТАВИТЬ_НАЗВАНИЕ_БАНКА]<br />
                    БИК: [ВСТАВИТЬ_БИК]<br />
                    БИН банка: [ВСТАВИТЬ_БИН_БАНКА]
                  </p>
                </>
              )}
            </div>
            
            {/* Modal Footer */}
            <div style={{ padding: '16px 28px', borderTop: '1px solid rgba(226, 232, 240, 0.8)', background: '#F8FAFC', display: 'flex', justifyContent: 'flex-end' }}>
              <button 
                onClick={() => setActiveModal(null)} 
                className="bg-slate-900 hover:bg-slate-800 text-white font-medium py-2 px-6 rounded-lg transition-all active:scale-[0.98] text-xs cursor-pointer select-none"
              >
                Понятно
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
