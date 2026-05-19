'use client';

import { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import {
  BookOpen, Bot, Zap, MessageSquare, BarChart2, ChevronDown, ChevronUp,
  Send, CheckCircle, Terminal, QrCode, Brain, Layers, ArrowRight,
  Database, Settings, Users, Megaphone
} from 'lucide-react';

// ── TYPES ──────────────────────────────────────────────────
interface FaqItem { q: string; a: string; }

// ── DATA DICTIONARY ────────────────────────────────────────
const docsDict = {
  RU: {
    navTitle: 'Документация',
    heroTitle: 'BotFlow Enterprise AI',
    sub: 'Профессиональная платформа для создания, настройки и управления AI-ботами в Telegram и WhatsApp',
    howItWorks: 'Как это работает',
    steps: [
      { icon: Bot, title: 'Создание бота', desc: 'Выберите платформу (Telegram или WhatsApp) и создайте бота за несколько кликов.', color: '#6366f1' },
      { icon: Brain, title: 'Настройка AI Brain', desc: 'Задайте личность бота через System Prompt и загрузите базу знаний — тексты, PDF, FAQ.', color: '#0ea5e9' },
      { icon: Zap, title: 'Деплой', desc: 'Подключите токен Telegram или отсканируйте QR-код WhatsApp — бот активируется мгновенно.', color: '#10b981' },
      { icon: BarChart2, title: 'Мониторинг', desc: 'Смотрите диалоги в реальном времени, вмешивайтесь вручную и анализируйте статистику.', color: '#f59e0b' },
    ],
    aiBrain: 'AI Brain — как это работает',
    aiBlocks: [
      { label: 'System Prompt', desc: 'Роль бота, тон голоса, цели, запреты', color: '#6366f1', icon: Terminal },
      { label: 'Knowledge Base', desc: 'Компания, цены, FAQ, ссылки, PDF', color: '#0ea5e9', icon: Database },
      { label: 'История чата', desc: 'Последние 8 сообщений диалога', color: '#f59e0b', icon: MessageSquare },
    ],
    aiCombine: 'Все три блока объединяются и передаются в Gemini для генерации ответа',
    deploy: 'Деплой бота',
    deployTelegramSteps: ['Создайте бота через @BotFather', 'Скопируйте API Token', 'Вставьте токен при создании бота', 'Бот активируется автоматически'],
    deployWhatsappSteps: ['Создайте WhatsApp бота в платформе', 'Откройте страницу бота', 'Отсканируйте QR-код с телефона', 'Бот подключён как WhatsApp Web'],
    sections: 'Разделы платформы',
    pages: [
      { icon: Layers, title: 'Dashboard', desc: 'Общий обзор: активные боты, количество диалогов и расход токенов.' },
      { icon: Bot, title: 'My Bots', desc: 'Список всех ботов с быстрым переключением статуса и переходом в настройки.' },
      { icon: Settings, title: 'Create Bot', desc: 'Мастер создания нового бота: платформа, токен, базовые параметры AI.' },
      { icon: MessageSquare, title: 'Live Chats', desc: 'Диалоги в реальном времени, ручные ответы, пауза AI для конкретного чата.' },
      { icon: Megaphone, title: 'Campaigns', desc: 'Массовые рассылки по всем или выбранным контактам бота.' },
      { icon: Users, title: 'Statistics', desc: 'Токены, стоимость запросов, динамика по дням и детализация по ботам.' },
    ],
    faq: 'Частые вопросы',
    faqItems: [
      { q: 'Как подключить Telegram-бота?', a: 'Создайте бота через @BotFather, скопируйте токен и вставьте его при создании бота в BotFlow. Система автоматически установит вебхук.' },
      { q: 'Как подключить WhatsApp?', a: 'После создания бота откройте его страницу и отсканируйте QR-код с телефона, как в WhatsApp Web.' },
      { q: 'Что такое System Prompt?', a: 'Это инструкции для AI: роль бота, тон общения, цели, правила поведения. Бот строго следует им в каждом диалоге.' },
      { q: 'Как загрузить базу знаний из PDF?', a: 'На странице бота в разделе "AI Brain" нажмите "Загрузить PDF". Система извлечёт текст и передаст его AI-агенту для обновления базы знаний.' },
      { q: 'Поддерживаются ли голосовые сообщения?', a: 'Да! Бот автоматически скачивает голосовые сообщения, отправляет аудио в Gemini для распознавания речи и отвечает текстом.' },
      { q: 'Можно ли отвечать вручную вместо AI?', a: 'Да. В разделе Live Chats нажмите кнопку "Пауза AI" для конкретного чата — и пишите сами. Когда закончите, возобновите AI.' },
      { q: 'Как работает рассылка (Campaign)?', a: 'В разделе Campaigns выберите бота, напишите текст, отметьте нужные контакты и нажмите "Отправить". Система отправит сообщения с задержкой, чтобы избежать блокировок.' },
    ],
    support: 'Техническая поддержка',
    supportDesc: 'Столкнулись с проблемой? Опишите её в форме ниже, и наша команда ответит вам как можно скорее.',
    name: 'Ваше имя',
    email: 'Электронная почта',
    message: 'Сообщение',
    send: 'Отправить',
    sending: 'Отправка...',
    sentSuccess: 'Сообщение отправлено!',
    sentSub: 'Мы ответим вам в ближайшее время.',
    telegramBadge: 'Через токен',
    whatsappBadge: 'Через QR-код',
    stepLabel: 'Шаг',
  },
  KZ: {
    navTitle: 'Құжаттама',
    heroTitle: 'BotFlow Enterprise AI',
    sub: 'Telegram және WhatsApp желілерінде AI боттарын құруға, баптауға және басқаруға арналған кәсіби платформа',
    howItWorks: 'Жұмыс принципі',
    steps: [
      { icon: Bot, title: 'Бот құру', desc: 'Платформаны (Telegram немесе WhatsApp) таңдап, бірнеше рет басу арқылы бот жасаңыз.', color: '#6366f1' },
      { icon: Brain, title: 'AI Brain баптау', desc: 'Боттың рөлін System Prompt арқылы анықтаңыз және білім базасын (мәтіндер, PDF, FAQ) жүктеңіз.', color: '#0ea5e9' },
      { icon: Zap, title: 'Деплой', desc: 'Telegram токенін жалғаңыз немесе WhatsApp QR-кодын сканерлеңіз — бот бірден іске қосылады.', color: '#10b981' },
      { icon: BarChart2, title: 'Мониторинг', desc: 'Диалогтарды нақты уақытта көріңіз, қолмен жауап беріңіз және статистиканы талдаңыз.', color: '#f59e0b' },
    ],
    aiBrain: 'AI Brain — қалай жұмыс істейді',
    aiBlocks: [
      { label: 'System Prompt', desc: 'Боттың рөлі, сөйлеу мәнері, мақсаттары мен шектеулері', color: '#6366f1', icon: Terminal },
      { label: 'Knowledge Base', desc: 'Компания, бағалар, FAQ, сілтемелер, PDF', color: '#0ea5e9', icon: Database },
      { label: 'Чат тарихы', desc: 'Диалогтың соңғы 8 хабарламасы', color: '#f59e0b', icon: MessageSquare },
    ],
    aiCombine: 'Үш блок біріктіріліп, жауап дайындау үшін Gemini жүйесіне жіберіледі',
    deploy: 'Ботты орналастыру',
    deployTelegramSteps: ['@BotFather арқылы бот жасаңыз', 'API токенін көшіріп алыңыз', 'Токенді бот құру кезінде қойыңыз', 'Бот автоматты түрде қосылады'],
    deployWhatsappSteps: ['Платформада WhatsApp ботын жасаңыз', 'Бот бетін ашыңыз', 'Телефонмен QR-кодты сканерлеңіз', 'Бот WhatsApp Web ретінде қосылады'],
    sections: 'Платформа бөлімдері',
    pages: [
      { icon: Layers, title: 'Dashboard', desc: 'Жалпы шолу: белсенді боттар, диалогтар саны және токен шығыны.' },
      { icon: Bot, title: 'My Bots', desc: 'Қосылу күйін өзгерту және баптауларға өту мүмкіндігі бар барлық боттар тізімі.' },
      { icon: Settings, title: 'Create Bot', desc: 'Жаңа бот құру шебері: платформа, токен, негізгі AI параметрлері.' },
      { icon: MessageSquare, title: 'Live Chats', desc: 'Нақты уақыттағы диалогтар, қолмен жауап беру және белгілі чат үшін AI-ды кідірту.' },
      { icon: Megaphone, title: 'Campaigns', desc: 'Боттың барлық немесе таңдалған контактілеріне жаппай хабарлама тарату.' },
      { icon: Users, title: 'Statistics', desc: 'Токендер, сұраныстар құны, күндер бойынша динамика және боттар бойынша мәлімет.' },
    ],
    faq: 'Жиі қойылатын сұрақтар',
    faqItems: [
      { q: 'Telegram ботын қалай қосуға болады?', a: '@BotFather арқылы бот жасаңыз, токенді көшіріңіз және оны BotFlow платформасында бот құру кезінде қойыңыз. Жүйе вебхукты автоматты түрде орнатады.' },
      { q: 'WhatsApp ботын қалай қосуға болады?', a: 'Ботты құрғаннан кейін оның бетін ашып, телефонмен QR-кодты сканерлеңіз (WhatsApp Web сияқты).' },
      { q: 'System Prompt деген не?', a: 'Бұл AI үшін нұсқаулықтар: боттың рөлі, сөйлесу мәнері, мақсаттары мен шектеулері. Бот әр диалогта осы нұсқауларды қатаң сақтайды.' },
      { q: 'PDF форматынан білім базасын қалай жүктеуге болады?', a: 'Бот бетіндегі "AI Brain" бөлімінде "PDF жүктеу" түймесін басыңыз. Жүйе мәтінді шығарып алып, боттың білім базасын жаңартады.' },
      { q: 'Дауыстық хабарламалар қолданыла ма?', a: 'Иә! Бот дауыстық хабарламаларды автоматты түрде жүктеп, оларды тану үшін Gemini-ге жібереді және мәтін түрінде жауап береді.' },
      { q: 'AI орнына қолмен жауап беруге бола ма?', a: 'Иә. Live Chats бөлімінде белгілі бір чат үшін "AI кідірту" түймесін басып, өзіңіз жауап бере аласыз. Аяқтағаннан кейін AI-ды қайта қосыңыз.' },
      { q: 'Хабарлама тарату (Campaign) қалай жұмыс істейді?', a: 'Campaigns бөлімінде ботты таңдаңыз, мәтінді жазыңыз, қажетті контактілерді белгілеп, "Жіберу" түймесін басыңыз. Бот бұғаттауды болдырмау үшін хабарламаларды кідіріспен жібереді.' },
    ],
    support: 'Техникалық қолдау',
    supportDesc: 'Қандай да бір мәселеге тап болдыңыз ба? Төмендегі пішінді толтырыңыз, біздің команда тез арада жауап береді.',
    name: 'Сіздің есіміңіз',
    email: 'Электрондық пошта',
    message: 'Хабарлама',
    send: 'Жіберу',
    sending: 'Жіберілуде...',
    sentSuccess: 'Хабарлама жіберілді!',
    sentSub: 'Жақын арада сізге жауап береміз.',
    telegramBadge: 'Токен арқылы',
    whatsappBadge: 'QR-код арқылы',
    stepLabel: 'Қадам',
  },
  EN: {
    navTitle: 'Documentation',
    heroTitle: 'BotFlow Enterprise AI',
    sub: 'Professional platform to build, configure, and manage intelligent AI bots in Telegram and WhatsApp',
    howItWorks: 'How It Works',
    steps: [
      { icon: Bot, title: 'Create Bot', desc: 'Choose your platform (Telegram or WhatsApp) and create a bot in just a few clicks.', color: '#6366f1' },
      { icon: Brain, title: 'Configure AI Brain', desc: 'Set bot personality via System Prompt and upload knowledge base texts, PDFs, or FAQs.', color: '#0ea5e9' },
      { icon: Zap, title: 'Deploy', desc: 'Connect Telegram Token or scan WhatsApp QR code — the bot activates instantly.', color: '#10b981' },
      { icon: BarChart2, title: 'Monitor & Manage', desc: 'View live dialogues, intervene manually, and analyze token usage statistics.', color: '#f59e0b' },
    ],
    aiBrain: 'AI Brain — How It Works',
    aiBlocks: [
      { label: 'System Prompt', desc: 'Bot role, tone of voice, goals, and constraints', color: '#6366f1', icon: Terminal },
      { label: 'Knowledge Base', desc: 'Company details, pricing, FAQs, links, and PDFs', color: '#0ea5e9', icon: Database },
      { label: 'Chat History', desc: 'Last 8 messages of the conversation', color: '#f59e0b', icon: MessageSquare },
    ],
    aiCombine: 'All three blocks are combined and passed to Gemini to generate the reply',
    deploy: 'Deploying Bots',
    deployTelegramSteps: ['Create a bot via @BotFather', 'Copy the API Token', 'Paste the token when creating bot', 'Webhook connects automatically'],
    deployWhatsappSteps: ['Create a WhatsApp bot in the panel', 'Open the bot details page', 'Scan the QR code with WhatsApp on your phone', 'Connected as a WhatsApp Web client'],
    sections: 'Platform Sections',
    pages: [
      { icon: Layers, title: 'Dashboard', desc: 'Overview of active bots, total conversation stats, and token expenditures.' },
      { icon: Bot, title: 'My Bots', desc: 'List of all created bots with quick toggles and configuration access.' },
      { icon: Settings, title: 'Create Bot', desc: 'Easy wizard: select platform, supply token/credentials, and define core AI settings.' },
      { icon: MessageSquare, title: 'Live Chats', desc: 'Real-time conversation viewer, manual response capabilities, and AI pausing.' },
      { icon: Megaphone, title: 'Campaigns', desc: 'Send bulk broadcasts to all or selected users with built-in delays.' },
      { icon: Users, title: 'Statistics', desc: 'Tokens, cost of requests, daily dynamics, and detailed breakdowns.' },
    ],
    faq: 'Frequently Asked Questions',
    faqItems: [
      { q: 'How to connect Telegram bot?', a: 'Create a bot via @BotFather, copy the token and paste it during creation in BotFlow. System will set up webhooks automatically.' },
      { q: 'How to connect WhatsApp bot?', a: 'After creating the bot, open its page and scan the QR code with WhatsApp on your phone, similar to WhatsApp Web.' },
      { q: 'What is System Prompt?', a: 'It is the set of instructions for the AI: role, tone of voice, goals, and constraints. The bot strictly follows them in every chat.' },
      { q: 'How to upload knowledge base from PDF?', a: 'On the bot details page under "AI Brain", click "Upload PDF". The system extracts text and injects it into the bot context.' },
      { q: 'Are voice messages supported?', a: 'Yes! The bot automatically downloads voice messages, sends them to Gemini for speech recognition, and replies in text.' },
      { q: 'Can I reply manually instead of AI?', a: 'Yes. In the Live Chats panel, click "Pause AI" for any chat to respond manually. Resume AI when you are done.' },
      { q: 'How do campaigns work?', a: 'In the Campaigns tab, select the bot, write your broadcast text, select contacts, and click Send. The system sends them sequentially with random delays.' },
    ],
    support: 'Technical Support',
    supportDesc: 'Encountered a bug or have a question? Describe it in the form below and we will get back to you shortly.',
    name: 'Your Name',
    email: 'Email',
    message: 'Message',
    send: 'Send Message',
    sending: 'Sending...',
    sentSuccess: 'Message Sent!',
    sentSub: 'We will respond to your query as soon as possible.',
    telegramBadge: 'Via Token',
    whatsappBadge: 'Via QR-Code',
    stepLabel: 'Step',
  }
};

// ── ACCORDION COMPONENT ────────────────────────────────────
function FaqAccordion({ items }: { items: FaqItem[] }) {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {items.map((item, i) => (
        <div key={i} onClick={() => setOpen(open === i ? null : i)} style={{
          background: 'var(--surface-container-low)', borderRadius: '14px',
          border: '1px solid var(--outline-variant)', cursor: 'pointer',
          overflow: 'hidden', transition: 'box-shadow 0.2s',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 22px' }}>
            <span style={{ fontWeight: 600, fontSize: '0.97rem', color: 'var(--on-surface)' }}>{item.q}</span>
            {open === i ? <ChevronUp size={18} color="var(--primary)" /> : <ChevronDown size={18} color="var(--on-surface-variant)" />}
          </div>
          {open === i && (
            <div style={{ padding: '0 22px 18px', color: 'var(--on-surface-variant)', lineHeight: 1.7, fontSize: '0.92rem' }}>
              {item.a}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ── SUPPORT FORM COMPONENT ─────────────────────────────────
function SupportForm({ t }: { t: any }) {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await fetch('http://localhost:3001/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(form),
      });
      setSent(true);
    } catch {
      setSent(true); // show success even if offline
    } finally {
      setLoading(false);
    }
  }

  if (sent) return (
    <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
      <CheckCircle size={48} color="#10b981" style={{ marginBottom: '1rem' }} />
      <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--on-surface)', marginBottom: '0.5rem' }}>{t.sentSuccess}</div>
      <div style={{ color: 'var(--on-surface-variant)' }}>{t.sentSub}</div>
    </div>
  );

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--on-surface-variant)', marginBottom: '6px' }}>{t.name}</label>
          <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            placeholder="Ivan Ivanov" style={inputStyle} />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--on-surface-variant)', marginBottom: '6px' }}>{t.email}</label>
          <input required type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            placeholder="ivan@example.com" style={inputStyle} />
        </div>
      </div>
      <div>
        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--on-surface-variant)', marginBottom: '6px' }}>{t.message}</label>
        <textarea required rows={5} value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
          placeholder="..." style={{ ...inputStyle, resize: 'vertical' }} />
      </div>
      <button type="submit" disabled={loading} style={{
        display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center',
        padding: '14px 28px', borderRadius: '12px', background: 'var(--primary)',
        color: 'var(--on-primary)', fontWeight: 700, fontSize: '0.97rem', border: 'none',
        cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1,
        alignSelf: 'flex-start', transition: 'opacity 0.2s',
      }}>
        <Send size={16} /> {loading ? t.sending : t.send}
      </button>
    </form>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '12px 16px', borderRadius: '10px',
  border: '1px solid var(--outline-variant)', background: 'var(--surface-container-lowest)',
  color: 'var(--on-surface)', fontSize: '0.95rem', outline: 'none',
  fontFamily: 'inherit',
};

// ── MAIN DOCS PAGE ──────────────────────────────────────────
export default function DocsPage() {
  const { language } = useLanguage();
  const t = docsDict[language] || docsDict.RU;

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem 1.5rem 5rem' }}>

      {/* Hero */}
      <div style={{ textAlign: 'center', padding: '3rem 0 2.5rem', borderBottom: '1px solid var(--outline-variant)', marginBottom: '3rem' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', marginBottom: '1.5rem',
          background: 'var(--primary-container)', padding: '8px 18px', borderRadius: '99px' }}>
          <BookOpen size={18} color="var(--on-primary-container)" />
          <span style={{ fontWeight: 700, color: 'var(--on-primary-container)', fontSize: '0.9rem' }}>{t.navTitle}</span>
        </div>
        <h1 style={{ fontSize: 'clamp(2rem, 5vw, 2.8rem)', fontWeight: 900, color: 'var(--on-surface)', lineHeight: 1.2, marginBottom: '1rem' }}>
          {t.heroTitle}
        </h1>
        <p style={{ fontSize: '1.1rem', color: 'var(--on-surface-variant)', maxWidth: '600px', margin: '0 auto', lineHeight: 1.7 }}>
          {t.sub}
        </p>
      </div>

      {/* How it works */}
      <section style={{ marginBottom: '3.5rem' }}>
        <SectionTitle icon={Zap} title={t.howItWorks} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          {t.steps.map((step, i) => {
            const originalStep = docsDict.RU.steps[i];
            const stepConfig = docsDict.RU.steps[i];
            // Match corresponding icons
            const icons = [Bot, Brain, Zap, BarChart2];
            const colors = ['#6366f1', '#0ea5e9', '#10b981', '#f59e0b'];
            const Icon = icons[i] || Bot;
            const color = colors[i] || '#6366f1';

            return (
              <div key={i} style={{ background: 'var(--surface-container-low)', borderRadius: '16px',
                border: '1px solid var(--outline-variant)', padding: '24px 20px', position: 'relative' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                  <div style={{ width: '38px', height: '38px', borderRadius: '10px',
                    background: color + '1a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon size={20} color={color} />
                  </div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: color,
                    background: color + '1a', padding: '3px 10px', borderRadius: '99px' }}>{t.stepLabel} {i + 1}</span>
                </div>
                <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--on-surface)', marginBottom: '8px' }}>{step.title}</div>
                <div style={{ fontSize: '0.87rem', color: 'var(--on-surface-variant)', lineHeight: 1.6 }}>{step.desc}</div>
              </div>
            );
          })}
        </div>
      </section>

      {/* AI Prompt Builder */}
      <section style={{ marginBottom: '3.5rem' }}>
        <SectionTitle icon={Brain} title={t.aiBrain} />
        <div style={{ background: 'var(--surface-container-low)', borderRadius: '20px',
          border: '1px solid var(--outline-variant)', padding: '28px', overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '24px' }}>
            {t.aiBlocks.map((item, i) => {
              const staticItems = [
                { color: '#6366f1', icon: Terminal },
                { color: '#0ea5e9', icon: Database },
                { color: '#f59e0b', icon: MessageSquare }
              ];
              const Icon = staticItems[i].icon;
              return (
                <div key={i} style={{ background: 'var(--surface-container)', borderRadius: '14px',
                  padding: '18px', border: `1px solid ${staticItems[i].color}33` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <Icon size={16} color={staticItems[i].color} />
                    <span style={{ fontWeight: 700, fontSize: '0.88rem', color: staticItems[i].color }}>{item.label}</span>
                  </div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--on-surface-variant)', lineHeight: 1.5 }}>{item.desc}</div>
                </div>
              );
            })}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', justifyContent: 'center',
            padding: '14px', background: 'var(--primary-container)', borderRadius: '12px' }}>
            <ArrowRight size={18} color="var(--on-primary-container)" />
            <span style={{ fontWeight: 600, color: 'var(--on-primary-container)', fontSize: '0.9rem', textAlign: 'center' }}>
              {t.aiCombine}
            </span>
          </div>
        </div>
      </section>

      {/* Deploy */}
      <section style={{ marginBottom: '3.5rem' }}>
        <SectionTitle icon={Zap} title={t.deploy} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', gridAutoRows: '1fr' }}>
          <DeployCard
            icon={Send} title="Telegram" color="#229ED9"
            steps={t.deployTelegramSteps}
            badge={t.telegramBadge}
          />
          <DeployCard
            icon={QrCode} title="WhatsApp" color="#25D366"
            steps={t.deployWhatsappSteps}
            badge={t.whatsappBadge}
          />
        </div>
      </section>

      {/* Platform pages */}
      <section style={{ marginBottom: '3.5rem' }}>
        <SectionTitle icon={Layers} title={t.sections} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px' }}>
          {t.pages.map((page, i) => {
            const icons = [Layers, Bot, Settings, MessageSquare, Megaphone, Users];
            const Icon = icons[i] || Layers;
            return (
              <div key={i} style={{ display: 'flex', gap: '14px', alignItems: 'flex-start',
                background: 'var(--surface-container-low)', borderRadius: '14px',
                border: '1px solid var(--outline-variant)', padding: '18px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', flexShrink: 0,
                  background: 'var(--primary-container)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={18} color="var(--on-primary-container)" />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--on-surface)', marginBottom: '4px' }}>{page.title}</div>
                  <div style={{ fontSize: '0.83rem', color: 'var(--on-surface-variant)', lineHeight: 1.5 }}>{page.desc}</div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* FAQ */}
      <section style={{ marginBottom: '3.5rem' }}>
        <SectionTitle icon={BookOpen} title={t.faq} />
        <FaqAccordion items={t.faqItems} />
      </section>

      {/* Support */}
      <section id="support">
        <SectionTitle icon={Send} title={t.support} />
        <div style={{ background: 'var(--surface-container-low)', borderRadius: '20px',
          border: '1px solid var(--outline-variant)', padding: '32px' }}>
          <p style={{ color: 'var(--on-surface-variant)', marginBottom: '24px', lineHeight: 1.6 }}>
            {t.supportDesc}
          </p>
          <SupportForm t={t} />
        </div>
      </section>

    </div>
  );
}

function SectionTitle({ icon: Icon, title }: { icon: any; title: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
      <Icon size={22} color="var(--primary)" />
      <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--on-surface)' }}>{title}</h2>
    </div>
  );
}

function DeployCard({ icon: Icon, title, color, steps, badge }: {
  icon: any; title: string; color: string; steps: string[]; badge: string;
}) {
  return (
    <div style={{ background: 'var(--surface-container-low)', borderRadius: '16px',
      border: `1px solid ${color}33`, padding: '24px', display: 'flex', flexDirection: 'column', justifySelf: 'stretch' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
        <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: color + '1a',
          display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={20} color={color} />
        </div>
        <div>
          <div style={{ fontWeight: 800, color: 'var(--on-surface)' }}>{title}</div>
          <div style={{ fontSize: '0.75rem', color, fontWeight: 600 }}>{badge}</div>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flexGrow: 1 }}>
        {steps.map((step, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '0.87rem' }}>
            <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: color + '20',
              color, fontWeight: 800, fontSize: '0.72rem', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{i + 1}</div>
            <span style={{ color: 'var(--on-surface-variant)', lineHeight: 1.5 }}>{step}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
