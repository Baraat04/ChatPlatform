'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

// Meta requires a publicly reachable page describing how users can have their data
// deleted, linked from App Settings → Основные → «Удаление данных пользователей»
// (option: «URL инструкций для удаления данных»). It must be reachable without login.
const SUPPORT_EMAIL = 'jartybaeva_aigul@mail.ru';

export default function DataDeletionPage() {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="font-body-md text-slate-800 bg-[#FAFAFA] min-h-screen">
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Space+Grotesk:wght@500;600;700&display=swap" rel="stylesheet" />
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
        .glass-header {
          background: rgba(250, 250, 250, 0.8);
          backdrop-filter: blur(12px);
          border-bottom: 1px solid rgba(226, 232, 240, 0.6);
        }
      `}</style>

      <header className="glass-header sticky top-0 w-full z-50">
        <div className="flex justify-between items-center max-w-7xl mx-auto px-6 h-16">
          <Link href="/landing" className="flex items-center gap-2 select-none cursor-pointer">
            <img src="/logo.jpg" alt="UP-CHAT" className="h-8 w-auto object-contain rounded-lg" />
          </Link>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-1 bg-slate-200/60 p-1 rounded-xl border border-slate-300/40">
              {(['RU', 'EN', 'KZ'] as const).map((lang) => (
                <button
                  key={lang}
                  onClick={() => setLanguage(lang)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: 700,
                    transition: 'all 0.2s',
                    border: 'none',
                    cursor: 'pointer',
                    background: language === lang ? 'var(--primary)' : 'transparent',
                    color: language === lang ? 'var(--on-primary)' : 'var(--on-surface-variant)',
                  }}
                >
                  {lang}
                </button>
              ))}
            </div>

            <Link href="/landing" className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-teal-600 transition-colors">
              <ArrowLeft className="w-4 h-4" />
              {language === 'RU' ? 'Назад' : language === 'KZ' ? 'Артқа' : 'Back'}
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-16 space-y-6">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-950 heading-font mb-8">
          {language === 'RU' ? 'Удаление данных пользователей'
            : language === 'KZ' ? 'Пайдаланушы деректерін жою'
            : 'User Data Deletion'}
        </h1>

        <div className="space-y-6 font-light text-slate-700 text-sm leading-relaxed bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
          {language === 'RU' && (
            <>
              <p className="font-normal text-slate-950 text-xs">Оператор: ТОО «SAAMA GROUP» · up-chat.com</p>
              <p>
                Вы можете в любой момент удалить свои данные из сервиса UP-Chat. Ниже описаны два способа: самостоятельно в личном кабинете или по запросу в службу поддержки.
              </p>

              <h4 className="font-semibold text-slate-900 mt-4">1. Самостоятельное удаление</h4>
              <p>
                1.1. Войдите в личный кабинет на <strong>https://up-chat.com</strong><br />
                1.2. Откройте нужного бота и нажмите «Удалить» — вместе с ботом удаляются его настройки, подключённые каналы, контакты и вся переписка.<br />
                1.3. Чтобы отключить канал WhatsApp, Instagram или Telegram без удаления бота, перейдите в раздел «Каналы связи» и отключите нужный канал.
              </p>

              <h4 className="font-semibold text-slate-900 mt-4">2. Удаление аккаунта по запросу</h4>
              <p>
                2.1. Отправьте письмо на адрес <strong>{SUPPORT_EMAIL}</strong> с темой «Удаление данных» с той электронной почты, на которую зарегистрирован аккаунт.<br />
                2.2. Мы подтвердим получение запроса и удалим аккаунт и все связанные данные в течение <strong>30 дней</strong>.
              </p>

              <h4 className="font-semibold text-slate-900 mt-4">3. Какие данные удаляются</h4>
              <p>
                Учётная запись и профиль; созданные боты, их инструкции и база знаний; подключения к WhatsApp, Instagram и Telegram; контакты и история переписок; загруженные файлы, изображения и голосовые сообщения; статистика использования.
              </p>

              <h4 className="font-semibold text-slate-900 mt-4">4. Что может сохраняться</h4>
              <p>
                Данные о платежах и бухгалтерские документы хранятся в течение срока, установленного законодательством Республики Казахстан. Эти данные не используются для работы сервиса и не передаются третьим лицам.
              </p>
              <p>
                Обработка персональных данных описана в{' '}
                <Link href="/privacy-policy" className="text-teal-600 hover:underline">Политике конфиденциальности</Link>.
              </p>
            </>
          )}

          {language === 'EN' && (
            <>
              <p className="font-normal text-slate-950 text-xs">Operator: SAAMA GROUP LLP · up-chat.com</p>
              <p>
                You can delete your data from UP-Chat at any time. There are two ways: directly in your account, or by request to support.
              </p>

              <h4 className="font-semibold text-slate-900 mt-4">1. Delete it yourself</h4>
              <p>
                1.1. Sign in at <strong>https://up-chat.com</strong><br />
                1.2. Open the bot and click «Delete» — this removes the bot together with its settings, connected channels, contacts and all conversations.<br />
                1.3. To disconnect a WhatsApp, Instagram or Telegram channel without deleting the bot, go to «Channels» and disconnect it there.
              </p>

              <h4 className="font-semibold text-slate-900 mt-4">2. Request account deletion</h4>
              <p>
                2.1. Email <strong>{SUPPORT_EMAIL}</strong> with the subject «Data deletion», from the email address your account is registered to.<br />
                2.2. We confirm receipt and delete the account and all associated data within <strong>30 days</strong>.
              </p>

              <h4 className="font-semibold text-slate-900 mt-4">3. What is deleted</h4>
              <p>
                Your account and profile; bots you created, their instructions and knowledge base; WhatsApp, Instagram and Telegram connections; contacts and conversation history; uploaded files, images and voice messages; usage statistics.
              </p>

              <h4 className="font-semibold text-slate-900 mt-4">4. What may be retained</h4>
              <p>
                Payment records and accounting documents are kept for the period required by the law of the Republic of Kazakhstan. They are not used to operate the service and are not shared with third parties.
              </p>
              <p>
                How we process personal data is described in our{' '}
                <Link href="/privacy-policy" className="text-teal-600 hover:underline">Privacy Policy</Link>.
              </p>
            </>
          )}

          {language === 'KZ' && (
            <>
              <p className="font-normal text-slate-950 text-xs">Оператор: «SAAMA GROUP» ЖШС · up-chat.com</p>
              <p>
                Сіз UP-Chat сервисіндегі деректеріңізді кез келген уақытта жоя аласыз. Төменде екі тәсіл сипатталған: жеке кабинетте өз бетіңізше немесе қолдау қызметіне сұраныс арқылы.
              </p>

              <h4 className="font-semibold text-slate-900 mt-4">1. Өз бетіңізше жою</h4>
              <p>
                1.1. <strong>https://up-chat.com</strong> сайтындағы жеке кабинетке кіріңіз<br />
                1.2. Қажетті ботты ашып, «Жою» түймесін басыңыз — ботпен бірге оның параметрлері, қосылған арналары, контактілері және барлық хат алмасу жойылады.<br />
                1.3. Ботты жоймай WhatsApp, Instagram немесе Telegram арнасын ажырату үшін «Байланыс арналары» бөліміне өтіңіз.
              </p>

              <h4 className="font-semibold text-slate-900 mt-4">2. Сұраныс бойынша аккаунтты жою</h4>
              <p>
                2.1. Аккаунт тіркелген электрондық поштадан <strong>{SUPPORT_EMAIL}</strong> мекенжайына «Деректерді жою» тақырыбымен хат жіберіңіз.<br />
                2.2. Біз сұранысты алғанымызды растап, аккаунтты және барлық байланысты деректерді <strong>30 күн</strong> ішінде жоямыз.
              </p>

              <h4 className="font-semibold text-slate-900 mt-4">3. Қандай деректер жойылады</h4>
              <p>
                Есептік жазба және профиль; құрылған боттар, олардың нұсқаулары мен білім қоры; WhatsApp, Instagram және Telegram қосылымдары; контактілер мен хат алмасу тарихы; жүктелген файлдар, суреттер және дауыстық хабарламалар; пайдалану статистикасы.
              </p>

              <h4 className="font-semibold text-slate-900 mt-4">4. Не сақталуы мүмкін</h4>
              <p>
                Төлемдер туралы деректер мен бухгалтерлік құжаттар Қазақстан Республикасының заңнамасында белгіленген мерзім ішінде сақталады. Бұл деректер сервистің жұмысында пайдаланылмайды және үшінші тұлғаларға берілмейді.
              </p>
              <p>
                Дербес деректерді өңдеу{' '}
                <Link href="/privacy-policy" className="text-teal-600 hover:underline">Құпиялылық саясатында</Link> сипатталған.
              </p>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
