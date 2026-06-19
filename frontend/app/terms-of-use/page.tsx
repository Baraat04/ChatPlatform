'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

export default function TermsOfUsePage() {
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
            {/* Language Switcher */}
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
          {language === 'RU' ? 'Условия пользования' : language === 'KZ' ? 'Параметрлер және пайдалану шарттары' : 'Terms of Use'}
        </h1>
        <div className="space-y-6 font-light text-slate-700 text-sm leading-relaxed bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
          {language === 'RU' && (
            <>
              <p className="font-normal text-slate-950 text-xs">Дата вступления в силу: 29 мая 2026 г.</p>
              
              <h4 className="font-semibold text-slate-900 mt-4">Введение</h4>
              <p>
                <strong>ТОО &quot;SAAMA GROUP&quot;</strong> (&quot;Компания&quot;, &quot;мы&quot;, &quot;наш&quot;, &quot;нас&quot;), расположенное по адресу Республика Казахстан, г. Павлодар, ул. Едыге Би, 71Б, БИН: 171040010072, обязуется защищать ваши персональные данные. Для обработки ваших данных нам требуется ваше явное согласие в соответствии со статьями Закона Республики Казахстан &quot;О персональных данных и их защите&quot; (далее - &quot;Закон&quot;).
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
                Почтовый адрес: 140000, Республика Казахстан, г. Павлодар, ул. Едыге Би, 71Б
              </p>
            </>
          )}

          {language === 'EN' && (
            <>
              <p className="font-normal text-slate-950 text-xs">Effective Date: May 29, 2026</p>
              
              <h4 className="font-semibold text-slate-900 mt-4">Introduction</h4>
              <p>
                <strong>SAAMA GROUP LLP</strong> (&quot;Company&quot;, &quot;we&quot;, &quot;our&quot;, &quot;us&quot;), located at Edyge Bi St., 71B, Pavlodar, Republic of Kazakhstan, BIN: 171040010072, is committed to protecting your personal data. To process your data, we require your explicit consent in accordance with the articles of the Law of the Republic of Kazakhstan &quot;On Personal Data and Their Protection&quot; (hereinafter referred to as the &quot;Law&quot;).
              </p>

              <h4 className="font-semibold text-slate-900 mt-4">1. Purpose of Data Processing</h4>
              <p>
                We process personal data for the following purposes: sending marketing and information emails; personalizing interaction with the platform; sharing with partners for analytics; providing access to website functionality and account management; using project creation tools and other legitimate purposes.
              </p>

              <h4 className="font-semibold text-slate-900 mt-4">2. Data We Collect</h4>
              <p>
                The collection includes: full name, date of birth, gender, email address, phone number, ID card data, bank account number, and other necessary data. List of actions: collection, recording, systematization, storage, clarification, extraction, usage, blocking, deletion, destruction.
              </p>

              <h4 className="font-semibold text-slate-900 mt-4">3. Legal Grounds for Processing</h4>
              <p>
                Your consent provides the legal basis for processing. You may withdraw your consent at any time by sending a request to <strong>geducation1017@gmail.com</strong>.
              </p>

              <h4 className="font-semibold text-slate-900 mt-4">4. Your Rights</h4>
              <p>
                Under the Law, you have the right to: access data; correct inaccurate data; request deletion; restrict processing; withdraw consent; request data portability.
              </p>

              <h4 className="font-semibold text-slate-900 mt-4">5. Data Retention</h4>
              <p>
                Data is stored solely for the period necessary to achieve the goals of processing, unless otherwise provided by the legislation of the Republic of Kazakhstan.
              </p>

              <h4 className="font-semibold text-slate-900 mt-4">6. Third-Party Sharing</h4>
              <p>
                We may share data with service providers, analytical partners, or state authorities of the Republic of Kazakhstan when required by law.
              </p>

              <h4 className="font-semibold text-slate-900 mt-4">7. Cross-Border Data Transfer</h4>
              <p>
                In case of cross-border data transfer, the Company takes all appropriate precautions in accordance with the legislation of the Republic of Kazakhstan.
              </p>

              <h4 className="font-semibold text-slate-900 mt-4">8. Contact Information</h4>
              <p>
                Email: <strong>geducation1017@gmail.com</strong><br />
                Mailing Address: 140000, Republic of Kazakhstan, Pavlodar, Edyge Bi St., 71B
              </p>
            </>
          )}

          {language === 'KZ' && (
            <>
              <p className="font-normal text-slate-950 text-xs">Күшіне енген күні: 29 мамыр 2026 ж.</p>
              
              <h4 className="font-semibold text-slate-900 mt-4">Кіріспе</h4>
              <p>
                <strong>«SAAMA GROUP» ЖШС</strong> (&quot;Серіктестік&quot;, &quot;біз&quot;, &quot;біздің&quot;), Қазақстан Республикасы, Павлодар қ., Едыге Би к-сі, 71Б мекенжайында орналасқан, БСН: 171040010072, сіздің жеке деректеріңізді қорғауға міндеттенеді. Деректеріңізді өңдеу үшін Қазақстан Республикасының «Дербес деректер және оларды қорғау туралы» Заңының (бұдан әрі — «Заң») баптарына сәйкес сіздің айқын келісіміңіз қажет.
              </p>

              <h4 className="font-semibold text-slate-900 mt-4">1. Деректерді өңдеу мақсаты</h4>
              <p>
                Біз жеке деректерді келесі мақсаттарда өңдейміз: жарнамалық және ақпараттық электрондық хаттарды жіберу; платформамен өзара әрекеттесуді дербестендіру; талдау үшін серіктестерге беру; сайт функционалына және аккаунтты басқаруға қолжетімділікті қамтамасыз ету; жобаларды құру құралдарын пайдалану және өзге де заңды мақсаттар.
              </p>

              <h4 className="font-semibold text-slate-900 mt-4">2. Біз жинайтын деректер</h4>
              <p>
                Жинауға мыналар кіреді: Т.А.Ә., туған күні, жынысы, электрондық пошта мекенжайы, телефон нөмірі, жеке куәлік деректері, есеп айырысу шотының нөмірі және өзге де қажетті деректер. Әрекеттер тізімі: жинау, жазу, жүйелеу, жинақтау, сақтау, нақтылау, алу, пайдалану, блоктау, өшіру, жою.
              </p>

              <h4 className="font-semibold text-slate-900 mt-4">3. Өңдеудің құқықтық негіздері</h4>
              <p>
                Сіздің келісіміңіз өңдеудің құқықтық негізін қамтамасыз етеді. Келісіміңізді кез келген уақытта <strong>geducation1017@gmail.com</strong> мекенжайына сұрау жіберу арқылы қайтарып ала аласыз.
              </p>

              <h4 className="font-semibold text-slate-900 mt-4">4. Сіздің құқықтарыңыз</h4>
              <p>
                Заңға сәйкес сіздің құқығыңыз бар: деректерге қол жеткізу; қате деректерді түзету; жоюды сұрау; өңдеуді шектеу; келісімді қайтарып алу; деректердің тасымалдануын сұрау.
              </p>

              <h4 className="font-semibold text-slate-900 mt-4">5. Деректерді сақтау</h4>
              <p>
                Деректер Қазақстан Республикасының заңнамасында өзгеше көзделмесе, тек өңдеу мақсаттарына қол жеткізу үшін қажетті мерзім ішінде ғана сақталады.
              </p>

              <h4 className="font-semibold text-slate-900 mt-4">6. Үшінші тұлғалармен бөлісу</h4>
              <p>
                Біз деректерді қызмет көрсетушілерге, аналитикалық серіктестерге немесе Қазақстан Республикасының мемлекеттік органдарына заң талап еткен жағдайларда бере аламыз.
              </p>

              <h4 className="font-semibold text-slate-900 mt-4">7. Деректерді халықаралық тасымалдау</h4>
              <p>
                Деректерді трансшекаралық тасымалдау кезінде Серіктестік Қазақстан Республикасының заңнамасына сәйкес барлық тиісті сақтық шараларын қабылдайды.
              </p>

              <h4 className="font-semibold text-slate-900 mt-4">8. Байланыс ақпараты</h4>
              <p>
                Электрондық пошта: <strong>geducation1017@gmail.com</strong><br />
                Пошталық мекенжайы: 140000, Қазақстан Республикасы, Павлодар қ., Едыге Би к-сі, 71Б
              </p>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
