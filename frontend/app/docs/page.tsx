'use client';

import { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { API_URL } from '../config';
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
    heroTitle: 'Документация и руководство пользователя',
    sub: 'BotFlow — это платформа для создания и управления умными помощниками в Telegram и WhatsApp без навыков программирования. Бот обучается на текстовых данных компании и берет на себя автоматическое общение с клиентами.',
    howItWorks: 'Пошаговое руководство: Создание и запуск бота',
    steps: [
      { icon: Bot, title: 'Выбор платформы', desc: 'Пользователь выбирает мессенджер, в котором будет работать ассистент: Telegram или WhatsApp.' },
      { icon: Brain, title: 'Обучение и настройка', desc: 'Укажите роль бота и заполните базу знаний — график работы, цены, услуги и ответы на вопросы.' },
      { icon: Zap, title: 'Подключение к мессенджеру', desc: 'Вставьте текстовый ключ для Telegram или отсканируйте QR-код для WhatsApp. Бот моментально активируется.' },
      { icon: BarChart2, title: 'Активация', desc: 'После сохранения бот автоматически начинает обрабатывать входящие сообщения в режиме 24/7.' },
    ],
    aiBrain: 'Как бот понимает вопросы',
    aiBlocks: [
      { label: 'Роль и поведение', desc: 'Описание того, кем является бот и в каком стиле он должен общаться.', icon: Terminal },
      { label: 'База знаний', desc: 'Текстовая информация о компании, которую бот использует для ответов.', icon: Database },
      { label: 'История диалога', desc: 'Последние сообщения клиента для понимания контекста.', icon: MessageSquare },
    ],
    aiCombine: 'Бот анализирует эти данные и самостоятельно формулирует ответ клиенту',
    deploy: 'Подключение к мессенджеру',
    deployTelegramSteps: ['Создайте бота через официального @BotFather', 'Скопируйте полученный текстовый ключ', 'Вставьте ключ при создании бота', 'Бот начнет отвечать автоматически'],
    deployWhatsappSteps: ['Создайте бота для WhatsApp в платформе', 'Откройте страницу вашего бота', 'Отсканируйте QR-код через функцию "Связанные устройства"', 'Бот подключен и готов к работе'],
    sections: 'Панель управления и мониторинг',
    pages: [
      { icon: Layers, title: 'Сводка', desc: 'Общая информация об активных ботах и количестве диалогов.' },
      { icon: Bot, title: 'Мои боты', desc: 'Список всех ваших помощников с возможностью перехода к настройкам.' },
      { icon: Settings, title: 'Создать бота', desc: 'Форма для добавления нового бота и указания базовых параметров.' },
      { icon: MessageSquare, title: 'Живые чаты', desc: 'Интерфейс для просмотра диалогов. Вы можете перехватить управление и ответить вручную.' },
      { icon: Megaphone, title: 'Рассылки', desc: 'Отправка массовых информационных сообщений по списку контактов бота.' },
      { icon: Users, title: 'Статистика', desc: 'Детализация активности ботов и стоимости запросов.' },
    ],
    faq: 'Частые вопросы',
    faqItems: [
      { q: 'Как подключить Telegram-бота?', a: 'Вам нужно создать бота через официального @BotFather в самом Telegram, получить текстовый ключ и вставить его в нашу платформу.' },
      { q: 'Как подключить WhatsApp?', a: 'На странице созданного бота появится QR-код. Отсканируйте его через приложение WhatsApp на вашем телефоне (раздел «Связанные устройства»).' },
      { q: 'Что значит "Роль и поведение"?', a: 'Это инструкции для бота: кем он является (например, продавцом или службой поддержки), как он должен общаться и какие правила соблюдать.' },
      { q: 'Как загрузить информацию из документа (PDF)?', a: 'На странице бота выберите загрузку документа. Платформа сама прочитает текст и добавит его в базу знаний бота.' },
      { q: 'Умеет ли бот слушать голосовые сообщения?', a: 'Да. Бот автоматически переводит голосовые сообщения клиентов в текст и отвечает на них.' },
      { q: 'Могу ли я ответить клиенту сам, отключив бота?', a: 'Да. В разделе "Живые чаты" вы можете нажать кнопку паузы для конкретного диалога и написать ответ лично. Потом бота можно включить обратно.' },
      { q: 'Как работают массовые рассылки?', a: 'В разделе рассылок выберите нужного бота, напишите текст сообщения и нажмите отправить. Бот сам разошлет сообщение вашим контактам.' },
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
    telegramBadge: 'Через текстовый ключ',
    whatsappBadge: 'Через QR-код',
    stepLabel: 'Шаг',
  },
  KZ: {
    navTitle: 'Құжаттама',
    heroTitle: 'Құжаттама және пайдаланушы нұсқаулығы',
    sub: 'BotFlow — бұл бағдарламалау дағдыларынсыз Telegram және WhatsApp желілерінде ақылды көмекшілерді құруға және басқаруға арналған платформа. Бот компанияның мәтіндік деректерінде оқытылады және клиенттермен автоматты түрде сөйлесуді өз мойнына алады.',
    howItWorks: 'Қадамдық нұсқаулық: Ботты құру және іске қосу',
    steps: [
      { icon: Bot, title: 'Платформаны таңдау', desc: 'Пайдаланушы ассистент жұмыс істейтін мессенджерді таңдайды: Telegram немесе WhatsApp.' },
      { icon: Brain, title: 'Оқыту және баптау', desc: 'Боттың рөлін көрсетіп, білім базасын толтырыңыз — жұмыс кестесі, бағалар, қызметтер және сұрақтарға жауаптар.' },
      { icon: Zap, title: 'Мессенджерге қосылу', desc: 'Telegram үшін мәтіндік кілтті қойыңыз немесе WhatsApp үшін QR-кодты сканерлеңіз. Бот бірден іске қосылады.' },
      { icon: BarChart2, title: 'Іске қосу', desc: 'Сақтағаннан кейін бот кіріс хабарламаларды 24/7 режимінде автоматты түрде өңдей бастайды.' },
    ],
    aiBrain: 'Бот сұрақтарды қалай түсінеді',
    aiBlocks: [
      { label: 'Рөлі мен мінезі', desc: 'Бот кім екені және қандай стильде сөйлесуі керек екендігін сипаттау.', icon: Terminal },
      { label: 'Білім базасы', desc: 'Бот жауап беру үшін қолданатын компания туралы мәтіндік ақпарат.', icon: Database },
      { label: 'Чат тарихы', desc: 'Мәтінмәнді түсіну үшін клиенттің соңғы хабарламалары.', icon: MessageSquare },
    ],
    aiCombine: 'Бот осы деректерді талдайды және клиентке жауапты өзі дайындайды',
    deploy: 'Мессенджерге қосылу',
    deployTelegramSteps: ['Ресми @BotFather арқылы бот жасаңыз', 'Алынған мәтіндік кілтті көшіріп алыңыз', 'Ботты құру кезінде кілтті қойыңыз', 'Бот автоматты түрде жауап бере бастайды'],
    deployWhatsappSteps: ['Платформада WhatsApp ботын жасаңыз', 'Ботыңыздың бетін ашыңыз', 'Телефондағы "Байланысқан құрылғылар" арқылы QR-кодты сканерлеңіз', 'Бот қосылды және жұмысқа дайын'],
    sections: 'Басқару тақтасы және мониторинг',
    pages: [
      { icon: Layers, title: 'Жалпы мәлімет', desc: 'Белсенді боттар мен диалогтар саны туралы жалпы ақпарат.' },
      { icon: Bot, title: 'Менің боттарым', desc: 'Баптауларға өту мүмкіндігі бар барлық көмекшілеріңіздің тізімі.' },
      { icon: Settings, title: 'Бот құру', desc: 'Жаңа бот қосуға және негізгі параметрлерді орнатуға арналған форма.' },
      { icon: MessageSquare, title: 'Тікелей чаттар', desc: 'Диалогтарды қарау интерфейсі. Сіз басқаруды өз қолыңызға алып, өзіңіз жауап бере аласыз.' },
      { icon: Megaphone, title: 'Хабарлама тарату', desc: 'Бот контактілеріне жаппай ақпараттық хабарламалар жіберу.' },
      { icon: Users, title: 'Статистика', desc: 'Боттардың белсенділігі мен сұраныстар құнының егжей-тегжейі.' },
    ],
    faq: 'Жиі қойылатын сұрақтар',
    faqItems: [
      { q: 'Telegram ботын қалай қосуға болады?', a: 'Сізге Telegram-дағы ресми @BotFather арқылы бот жасап, мәтіндік кілтті алу және оны біздің платформаға қою қажет.' },
      { q: 'WhatsApp ботын қалай қосуға болады?', a: 'Жасалған боттың бетінде QR-код пайда болады. Оны телефоныңыздағы WhatsApp қолданбасы арқылы сканерлеңіз («Байланысқан құрылғылар» бөлімі).' },
      { q: '"Рөлі мен мінезі" деген не?', a: 'Бұл ботқа арналған нұсқаулық: оның кім екені (мысалы, сатушы немесе қолдау қызметі), қалай сөйлесуі керек және қандай ережелерді сақтау қажеттігі.' },
      { q: 'Құжаттан (PDF) ақпаратты қалай жүктеуге болады?', a: 'Бот бетінде құжат жүктеуді таңдаңыз. Платформа мәтінді өзі оқып, боттың білім базасына қосады.' },
      { q: 'Бот дауыстық хабарламаларды тыңдай ала ма?', a: 'Иә. Бот клиенттердің дауыстық хабарламаларын автоматты түрде мәтінге аударып, оларға жауап береді.' },
      { q: 'Ботты өшіріп, клиентке өзім жауап бере аламын ба?', a: 'Иә. "Тікелей чаттар" бөлімінде белгілі бір диалог үшін кідірту түймесін басып, өзіңіз жауап бере аласыз. Содан кейін ботты қайта қосуға болады.' },
      { q: 'Жаппай хабарлама тарату қалай жұмыс істейді?', a: 'Хабарлама тарату бөлімінде қажетті ботты таңдаңыз, мәтінді жазып, жіберу түймесін басыңыз. Бот сіздің контактілеріңізге хабарламаны өзі таратады.' },
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
    telegramBadge: 'Мәтіндік кілт арқылы',
    whatsappBadge: 'QR-код арқылы',
    stepLabel: 'Қадам',
  },
  EN: {
    navTitle: 'Documentation',
    heroTitle: 'Documentation and User Guide',
    sub: 'BotFlow is a platform for creating and managing smart assistants in Telegram and WhatsApp without coding skills. The bot learns from the company\'s text data and automates communication with clients.',
    howItWorks: 'Step-by-step Guide: Creating and Launching a Bot',
    steps: [
      { icon: Bot, title: 'Platform Selection', desc: 'The user selects the messenger where the assistant will work: Telegram or WhatsApp.' },
      { icon: Brain, title: 'Training and Setup', desc: 'Specify the bot\'s role and fill out the knowledge base — working hours, prices, services, and answers to questions.' },
      { icon: Zap, title: 'Connecting to Messenger', desc: 'Paste the text key for Telegram or scan the QR code for WhatsApp. The bot activates immediately.' },
      { icon: BarChart2, title: 'Activation', desc: 'After saving, the bot automatically starts processing incoming messages 24/7.' },
    ],
    aiBrain: 'How the bot understands questions',
    aiBlocks: [
      { label: 'Role and behavior', desc: 'Description of who the bot is and in what style it should communicate.', icon: Terminal },
      { label: 'Knowledge base', desc: 'Textual information about the company that the bot uses to answer.', icon: Database },
      { label: 'Chat history', desc: 'The latest client messages to understand the context.', icon: MessageSquare },
    ],
    aiCombine: 'The bot analyzes this data and independently formulates an answer for the client',
    deploy: 'Connecting to Messenger',
    deployTelegramSteps: ['Create a bot via the official @BotFather', 'Copy the received text key', 'Paste the key when creating the bot', 'The bot will start replying automatically'],
    deployWhatsappSteps: ['Create a WhatsApp bot in the platform', 'Open your bot\'s page', 'Scan the QR code via "Linked Devices" on your phone', 'The bot is connected and ready to work'],
    sections: 'Dashboard and Monitoring',
    pages: [
      { icon: Layers, title: 'Summary', desc: 'General info on active bots and the number of dialogues.' },
      { icon: Bot, title: 'My bots', desc: 'List of all your assistants with quick access to settings.' },
      { icon: Settings, title: 'Create a bot', desc: 'Form to add a new bot and specify basic parameters.' },
      { icon: MessageSquare, title: 'Live chats', desc: 'Interface to view dialogues. You can intercept control and reply manually.' },
      { icon: Megaphone, title: 'Broadcasts', desc: 'Sending mass informational messages to the bot\'s contact list.' },
      { icon: Users, title: 'Statistics', desc: 'Details on bot activity and request costs.' },
    ],
    faq: 'Frequently Asked Questions',
    faqItems: [
      { q: 'How to connect a Telegram bot?', a: 'You need to create a bot via the official @BotFather in Telegram, get the text key, and paste it into our platform.' },
      { q: 'How to connect WhatsApp?', a: 'A QR code will appear on the created bot\'s page. Scan it using the WhatsApp app on your phone ("Linked devices" section).' },
      { q: 'What does "Role and behavior" mean?', a: 'These are instructions for the bot: who it is (e.g., a salesperson or support), how it should communicate, and what rules to follow.' },
      { q: 'How to upload information from a document (PDF)?', a: 'On the bot\'s page, select upload document. The platform will read the text itself and add it to the bot\'s knowledge base.' },
      { q: 'Can the bot listen to voice messages?', a: 'Yes. The bot automatically translates clients\' voice messages into text and replies to them.' },
      { q: 'Can I reply to the client myself by turning off the bot?', a: 'Yes. In the "Live chats" section, you can press the pause button for a specific dialogue and write the reply yourself. Then you can turn the bot back on.' },
      { q: 'How do mass broadcasts work?', a: 'In the broadcasts section, select the desired bot, write the message text, and click send. The bot will send the message to your contacts itself.' },
    ],
    support: 'Technical Support',
    supportDesc: 'Encountered a bug or have a question? Describe it in the form below and we will get back to you shortly.',
    name: 'Your Name',
    email: 'Email',
    message: 'Message',
    send: 'Send',
    sending: 'Sending...',
    sentSuccess: 'Message Sent!',
    sentSub: 'We will respond to your query as soon as possible.',
    telegramBadge: 'Via text key',
    whatsappBadge: 'Via QR code',
    stepLabel: 'Step',
  }
};

// ── ACCORDION COMPONENT ────────────────────────────────────
function FaqAccordion({ items }: { items: FaqItem[] }) {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {items.map((item, i) => (
        <div key={i} onClick={() => setOpen(open === i ? null : i)} style={{
          background: 'var(--surface-container-lowest)', borderRadius: '8px',
          border: '1px solid var(--outline-variant)', cursor: 'pointer',
          overflow: 'hidden', transition: 'all 0.2s ease',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px' }}>
            <span style={{ fontWeight: 500, fontSize: '0.95rem', color: 'var(--on-surface)' }}>{item.q}</span>
            {open === i ? <ChevronUp size={16} color="var(--on-surface-variant)" /> : <ChevronDown size={16} color="var(--on-surface-variant)" />}
          </div>
          {open === i && (
            <div style={{ padding: '0 20px 16px', color: 'var(--on-surface-variant)', lineHeight: 1.6, fontSize: '0.9rem' }}>
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
      await fetch(`${API_URL}/support`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(form),
      });
      setSent(true);
    } catch {
      setSent(true);
    } finally {
      setLoading(false);
    }
  }

  if (sent) return (
    <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
      <CheckCircle size={32} color="var(--on-surface-variant)" style={{ marginBottom: '1rem', margin: '0 auto' }} />
      <div style={{ fontSize: '1.1rem', fontWeight: 500, color: 'var(--on-surface)', marginBottom: '0.5rem' }}>{t.sentSuccess}</div>
      <div style={{ color: 'var(--on-surface-variant)', fontSize: '0.9rem' }}>{t.sentSub}</div>
    </div>
  );

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--on-surface-variant)', marginBottom: '6px' }}>{t.name}</label>
          <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            placeholder="..." style={inputStyle} />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--on-surface-variant)', marginBottom: '6px' }}>{t.email}</label>
          <input required type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            placeholder="..." style={inputStyle} />
        </div>
      </div>
      <div>
        <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--on-surface-variant)', marginBottom: '6px' }}>{t.message}</label>
        <textarea required rows={4} value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
          placeholder="..." style={{ ...inputStyle, resize: 'vertical' }} />
      </div>
      <button type="submit" disabled={loading} style={{
        display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center',
        padding: '10px 20px', borderRadius: '6px', background: 'var(--on-surface)',
        color: 'var(--surface)', fontWeight: 500, fontSize: '0.9rem', border: 'none',
        cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1,
        alignSelf: 'flex-start', transition: 'opacity 0.2s',
      }}>
        <Send size={14} /> {loading ? t.sending : t.send}
      </button>
    </form>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 14px', borderRadius: '6px',
  border: '1px solid var(--outline-variant)', background: 'var(--surface-container-lowest)',
  color: 'var(--on-surface)', fontSize: '0.9rem', outline: 'none',
  fontFamily: 'inherit',
};

// ── MAIN DOCS PAGE ──────────────────────────────────────────
export default function DocsPage() {
  const { language } = useLanguage();
  const t = docsDict[language as keyof typeof docsDict] || docsDict.RU;

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '3rem 1rem 5rem', fontFamily: 'inherit', boxSizing: 'border-box', overflowX: 'hidden', width: '100%' }}>

      {/* Hero */}
      <div style={{ marginBottom: '4rem' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
          <BookOpen size={16} color="var(--on-surface-variant)" />
          <span style={{ fontWeight: 500, color: 'var(--on-surface-variant)', fontSize: '0.85rem' }}>{t.navTitle}</span>
        </div>
        <h1 style={{ fontSize: '2rem', fontWeight: 600, color: 'var(--on-surface)', lineHeight: 1.2, marginBottom: '1rem', letterSpacing: '-0.02em' }}>
          {t.heroTitle}
        </h1>
        <p style={{ fontSize: '1rem', color: 'var(--on-surface-variant)', lineHeight: 1.6 }}>
          {t.sub}
        </p>
      </div>

      {/* How it works */}
      <section style={{ marginBottom: '4rem' }}>
        <SectionTitle icon={Zap} title={t.howItWorks} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {t.steps.map((step, i) => {
            const icons = [Bot, Brain, Zap, BarChart2];
            const Icon = icons[i] || Bot;

            return (
              <div key={i} style={{ background: 'var(--surface-container-lowest)', borderRadius: '8px',
                border: '1px solid var(--outline-variant)', padding: '20px', display: 'flex', gap: '16px' }}>
                <div style={{ flexShrink: 0, marginTop: '2px' }}>
                  <Icon size={18} color="var(--on-surface-variant)" />
                </div>
                <div>
                  <div style={{ fontWeight: 500, fontSize: '1rem', color: 'var(--on-surface)', marginBottom: '4px' }}>
                    <span style={{ color: 'var(--on-surface-variant)', marginRight: '6px' }}>{i + 1}.</span>
                    {step.title}
                  </div>
                  <div style={{ fontSize: '0.9rem', color: 'var(--on-surface-variant)', lineHeight: 1.5 }}>{step.desc}</div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* AI Prompt Builder */}
      <section style={{ marginBottom: '4rem' }}>
        <SectionTitle icon={Brain} title={t.aiBrain} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
          {t.aiBlocks.map((item, i) => {
            const staticIcons = [Terminal, Database, MessageSquare];
            const Icon = staticIcons[i];
            return (
              <div key={i} style={{ background: 'var(--surface-container-lowest)', borderRadius: '8px',
                padding: '20px', border: '1px solid var(--outline-variant)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                  <Icon size={16} color="var(--on-surface-variant)" />
                  <span style={{ fontWeight: 500, fontSize: '0.95rem', color: 'var(--on-surface)' }}>{item.label}</span>
                </div>
                <div style={{ fontSize: '0.9rem', color: 'var(--on-surface-variant)', lineHeight: 1.5 }}>{item.desc}</div>
              </div>
            );
          })}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '12px',
          padding: '16px', background: 'var(--surface-container-low)', borderRadius: '8px', border: '1px solid var(--outline-variant)' }}>
          <ArrowRight size={16} color="var(--on-surface-variant)" />
          <span style={{ color: 'var(--on-surface-variant)', fontSize: '0.9rem' }}>
            {t.aiCombine}
          </span>
        </div>
      </section>

      {/* Deploy */}
      <section style={{ marginBottom: '4rem' }}>
        <SectionTitle icon={Zap} title={t.deploy} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px', gridAutoRows: '1fr' }}>
          <DeployCard
            icon={Send} title="Telegram"
            steps={t.deployTelegramSteps}
            badge={t.telegramBadge}
          />
          <DeployCard
            icon={QrCode} title="WhatsApp"
            steps={t.deployWhatsappSteps}
            badge={t.whatsappBadge}
          />
        </div>
      </section>

      {/* Platform pages */}
      <section style={{ marginBottom: '4rem' }}>
        <SectionTitle icon={Layers} title={t.sections} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px' }}>
          {t.pages.map((page, i) => {
            const icons = [Layers, Bot, Settings, MessageSquare, Megaphone, Users];
            const Icon = icons[i] || Layers;
            return (
              <div key={i} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start',
                background: 'var(--surface-container-lowest)', borderRadius: '8px',
                border: '1px solid var(--outline-variant)', padding: '20px' }}>
                <div style={{ flexShrink: 0, marginTop: '2px' }}>
                  <Icon size={16} color="var(--on-surface-variant)" />
                </div>
                <div>
                  <div style={{ fontWeight: 500, fontSize: '0.95rem', color: 'var(--on-surface)', marginBottom: '4px' }}>{page.title}</div>
                  <div style={{ fontSize: '0.9rem', color: 'var(--on-surface-variant)', lineHeight: 1.5 }}>{page.desc}</div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* FAQ */}
      <section style={{ marginBottom: '4rem' }}>
        <SectionTitle icon={BookOpen} title={t.faq} />
        <FaqAccordion items={t.faqItems} />
      </section>

      {/* Support */}
      <section id="support">
        <SectionTitle icon={Send} title={t.support} />
        <div style={{ background: 'var(--surface-container-lowest)', borderRadius: '8px',
          border: '1px solid var(--outline-variant)', padding: '24px' }}>
          <p style={{ color: 'var(--on-surface-variant)', fontSize: '0.9rem', marginBottom: '20px', lineHeight: 1.6 }}>
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
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid var(--outline-variant)' }}>
      <Icon size={18} color="var(--on-surface-variant)" />
      <h2 style={{ fontSize: '1.2rem', fontWeight: 500, color: 'var(--on-surface)' }}>{title}</h2>
    </div>
  );
}

function DeployCard({ icon: Icon, title, steps, badge }: {
  icon: any; title: string; steps: string[]; badge: string;
}) {
  return (
    <div style={{ background: 'var(--surface-container-lowest)', borderRadius: '8px',
      border: '1px solid var(--outline-variant)', padding: '20px', display: 'flex', flexDirection: 'column', justifySelf: 'stretch' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
        <Icon size={18} color="var(--on-surface-variant)" />
        <div>
          <div style={{ fontWeight: 500, color: 'var(--on-surface)' }}>{title}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)' }}>{badge}</div>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flexGrow: 1 }}>
        {steps.map((step, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '0.85rem' }}>
            <div style={{ color: 'var(--on-surface-variant)', fontSize: '0.85rem', flexShrink: 0 }}>{i + 1}.</div>
            <span style={{ color: 'var(--on-surface-variant)', lineHeight: 1.5 }}>{step}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
