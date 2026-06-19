'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

export default function PrivacyPolicyPage() {
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
          {language === 'RU' ? 'Политика конфиденциальности' : language === 'KZ' ? 'Құпиялылық саясаты' : 'Privacy Policy'}
        </h1>
        <div className="space-y-6 font-light text-slate-700 text-sm leading-relaxed bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
          {language === 'RU' && (
            <>
              <p className="font-normal text-slate-950 text-xs">Дата вступления в силу: 10 июня 2026 г.</p>
              
              <p>
                Настоящая политика конфиденциальности и обработки персональных данных регулирует порядок обработки и использования персональных и иных данных онлайн ресурса <strong>ТОО &quot;SAAMA GROUP&quot;</strong> (дальше — Оператор). Действующая редакция настоящей Политики конфиденциальности, постоянно доступна для ознакомления, и размещена в сети Интернет по адресу: <strong>https://up-chat.com/privacy-policy</strong>
              </p>
              <p>
                Передавая Оператору персональные и иные данные посредством их заполнения через онлайн ресурс, Пользователь подтверждает свое согласие на использование указанных данных на условиях, изложенных в настоящей Политике конфиденциальности.
              </p>
              <p>
                Если Пользователь не согласен с условиями настоящей Политики конфиденциальности, он обязан прекратить использование онлайн ресурса.
              </p>
              <p>
                Безусловным акцептом настоящей Политики конфиденциальности является начало использования онлайн ресурса Пользователем.
              </p>

              <h4 className="font-semibold text-slate-900 mt-4">1. ТЕРМИНЫ</h4>
              <p>
                1.1. онлайн ресурс – сайт/телеграм-бот, расположенный в сети Интернет по адресу <strong>https://up-chat.com</strong><br />
                Все исключительные права на онлайн ресурс и его отдельные элементы (включая программное обеспечение, дизайн) принадлежат Оператору в полном объеме. Передача исключительных прав Пользователю не является предметом настоящей Политики конфиденциальности.
              </p>
              <p>
                1.2. Пользователь — лицо, использующее онлайн ресурс.
              </p>
              <p>
                1.3. Законодательство — действующее законодательство Республики Казахстан.
              </p>
              <p>
                1.4. Персональные данные — персональные данные Пользователя, которые Пользователь предоставляет самостоятельно при регистрации или в процессе использования функционала онлайн ресурса.
              </p>
              <p>
                1.5. Данные — иные данные о Пользователе (не входящие в понятие Персональных данных).
              </p>
              <p>
                1.6. Регистрация — заполнение Пользователем Регистрационной формы, путем указания необходимых сведений и отправки сканированных документов.
              </p>
              <p>
                1.7. Регистрационная форма — форма, которую Пользователь должен заполнить для возможности использования онлайн ресурса в полном объеме.
              </p>
              <p>
                1.8. Услуга(и) — услуги, предоставляемые Оператором на основании соглашения.
              </p>

              <h4 className="font-semibold text-slate-900 mt-4">2. СБОР И ОБРАБОТКА ПЕРСОНАЛЬНЫХ ДАННЫХ</h4>
              <p>
                2.1. Оператор собирает и хранит только те Персональные данные, которые необходимы для оказания Услуг Оператором и взаимодействия с Пользователем.
              </p>
              <p>
                2.2. Персональные данные могут использоваться в следующих целях:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>2.2.1 оказание Услуг Пользователю;</li>
                <li>2.2.2 идентификация Пользователя;</li>
                <li>2.2.3 взаимодействие с Пользователем;</li>
                <li>2.2.4 направление Пользователю рекламных материалов, информации и запросов;</li>
                <li>2.2.5 проведение статистических и иных исследований;</li>
              </ul>
              <p>
                2.3. Оператор в том числе обрабатывает следующие данные:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>2.3.1 фамилия, имя и отчество;</li>
                <li>2.3.2 адрес электронной почты;</li>
                <li>2.3.3 номер телефона (в т.ч. мобильного).</li>
              </ul>
              <p>
                2.4. Пользователю запрещается указывать персональные данные третьих лиц (за исключением условия представления интересов этих лиц, имея документальное подтверждение третьих лиц на осуществление таких действий).
              </p>

              <h4 className="font-semibold text-slate-900 mt-4">3. ПОРЯДОК ОБРАБОТКИ ПЕРСОНАЛЬНЫХ И ИНЫХ ДАННЫХ</h4>
              <p>
                3.1. Оператор обязуется использовать Персональные данные в соответствии с Законом «О персональных данных» Республики Казахстан и внутренними документами Оператора.
              </p>
              <p>
                3.2. В отношении Персональных данных и иных Данных Пользователя сохраняется их конфиденциальность, кроме случаев, когда указанные данные являются общедоступными.
              </p>
              <p>
                3.3. Оператор имеет право сохранять архивную копию Персональных данных.<br />
                Оператор имеет право хранить Персональные данные и Данные на серверах вне территории Республики Казахстан.
              </p>
              <p>
                3.4. Оператор имеет право передавать Персональные данные и Данные Пользователя без согласия Пользователя следующим лицам:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>3.4.1 государственным органам, в том числе органам дознания и следствия, и органам местного самоуправления по их мотивированному запросу;</li>
                <li>3.4.2 в иных случаях, прямо предусмотренных действующим законодательством Республики Казахстан.</li>
              </ul>
              <p>
                3.5. Оператор имеет право передавать Персональные данные и Данные третьим лицам, не указанным в п.3.4. настоящей Политики конфиденциальности, в следующих случаях:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>3.5.1 Пользователь выразил свое согласие на такие действия;</li>
                <li>3.5.2 передача необходима в рамках использования Пользователем онлайн ресурса или оказания Услуг Пользователю;</li>
              </ul>
              <p>
                3.6. Оператор осуществляет автоматизированную обработку Персональных данных и Данных.
              </p>

              <h4 className="font-semibold text-slate-900 mt-4">4. ЗАЩИТА ПЕРСОНАЛЬНЫХ ДАННЫХ</h4>
              <p>
                4.1. Оператор осуществляет надлежащую защиту Персональных и иных данных в соответствии с Законодательством и принимает необходимые и достаточные организационные и технические меры для защиты Персональных данных.
              </p>
              <p>
                4.2. Применяемые меры защиты в том числе позволяют защитить Персональные данные от неправомерного или случайного доступа, уничтожения, изменения, блокирования, копирования, распространения, а также от иных неправомерных действий с ними третьих лиц.
              </p>

              <h4 className="font-semibold text-slate-900 mt-4">5. ИНЫЕ ПОЛОЖЕНИЯ</h4>
              <p>
                5.1. К настоящей Политике конфиденциальности и отношениям между Пользователем и Оператором, возникающим в связи с применением Политики конфиденциальности, подлежит применению право Республики Казахстан.
              </p>
              <p>
                5.2. Все возможные споры, вытекающие из настоящего Соглашения, подлежат разрешению в соответствии с действующим законодательством по месту регистрации Оператора.<br />
                Перед обращением в суд Пользователь должен соблюсти обязательный досудебный порядок и направить Оператору соответствующую претензию в письменном виде. Срок ответа на претензию составляет 30 (тридцать) рабочих дней.
              </p>
              <p>
                5.3. Если по тем или иным причинам одно или несколько положений Политики конфиденциальности будут признаны недействительными или не имеющими юридической силы, это не оказывает влияния на действительность или применимость остальных положений Политики конфиденциальности.
              </p>
              <p>
                5.4. Оператор имеет право в любой момент изменять Политику конфиденциальности (полностью или в части) в одностороннем порядке без предварительного согласования с Пользователем. Все изменения вступают в силу с момента ее размещения в онлайн ресурсе.
              </p>
              <p>
                5.5. Пользователь обязуется самостоятельно следить за изменениями Политики конфиденциальности путем ознакомления с актуальной редакцией.
              </p>
              <p>
                5.6. Все предложения или вопросы по настоящей Политике конфиденциальности следует сообщать по электронной почте <strong>geducation1017@gmail.com</strong> или по телефонам: <strong>+7 (706) 430-71-95</strong>
              </p>
            </>
          )}

          {language === 'EN' && (
            <>
              <p className="font-normal text-slate-950 text-xs">Effective Date: June 10, 2026</p>
              
              <p>
                This Privacy and Personal Data Processing Policy governs the procedure for processing and using personal and other data of the online resource of <strong>SAAMA GROUP LLP</strong> (hereinafter referred to as the Operator). The current edition of this Privacy Policy is constantly available for review and is posted on the Internet at: <strong>https://up-chat.com/privacy-policy</strong>
              </p>
              <p>
                By transferring personal and other data to the Operator by filling them out through the online resource, the User confirms their consent to the use of the specified data under the terms set forth in this Privacy Policy.
              </p>
              <p>
                If the User does not agree with the terms of this Privacy Policy, they must immediately terminate the use of the online resource.
              </p>
              <p>
                The unconditional acceptance of this Privacy Policy is the beginning of the use of the online resource by the User.
              </p>

              <h4 className="font-semibold text-slate-900 mt-4">1. TERMS</h4>
              <p>
                1.1. Online resource – the website/telegram-bot located on the Internet at <strong>https://up-chat.com</strong><br />
                All exclusive rights to the online resource and its individual elements (including software, design) belong to the Operator in full. The transfer of exclusive rights to the User is not the subject of this Privacy Policy.
              </p>
              <p>
                1.2. User — any individual or entity using the online resource.
              </p>
              <p>
                1.3. Legislation — the current legislation of the Republic of Kazakhstan.
              </p>
              <p>
                1.4. Personal data — personal data of the User, which the User provides independently during registration or in the process of using the functionality of the online resource.
              </p>
              <p>
                1.5. Data — other data about the User (not included in the definition of Personal data).
              </p>
              <p>
                1.6. Registration — filling out the Registration Form by the User, by indicating the necessary information and sending scanned documents.
              </p>
              <p>
                1.7. Registration form — the form that the User must fill out to be able to use the online resource to its full extent.
              </p>
              <p>
                1.8. Service(s) — services provided by the Operator on the basis of the agreement.
              </p>

              <h4 className="font-semibold text-slate-900 mt-4">2. COLLECTION AND PROCESSING OF PERSONAL DATA</h4>
              <p>
                2.1. The Operator collects and stores only those Personal data that are necessary for the provision of Services by the Operator and interaction with the User.
              </p>
              <p>
                2.2. Personal data may be used for the following purposes:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>2.2.1 provision of Services to the User;</li>
                <li>2.2.2 identification of the User;</li>
                <li>2.2.3 interaction with the User;</li>
                <li>2.2.4 sending promotional materials, info, and requests to the User;</li>
                <li>2.2.5 conducting statistical and other research;</li>
              </ul>
              <p>
                2.3. The Operator processes, among other things, the following data:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>2.3.1 full name (surname, first name, and patronymic);</li>
                <li>2.3.2 email address;</li>
                <li>2.3.3 phone number (including mobile phone).</li>
              </ul>
              <p>
                2.4. The User is prohibited from specifying personal data of third parties.
              </p>

              <h4 className="font-semibold text-slate-900 mt-4">3. PROCESSING OF PERSONAL AND OTHER DATA</h4>
              <p>
                3.1. The Operator undertakes to use Personal data in accordance with the Law "On Personal Data" of the Republic of Kazakhstan and the internal documents of the Operator.
              </p>
              <p>
                3.2. Confidentiality is maintained with respect to the User's Personal Data and other Data, except when such data is publicly available.
              </p>
              <p>
                3.3. The Operator has the right to save an archive copy of Personal data.<br />
                The Operator has the right to store Personal data and Data on servers outside the territory of the Republic of Kazakhstan.
              </p>
              <p>
                3.4. The Operator has the right to transfer Personal data and Data of the User without the User's consent to:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>3.4.1 state authorities, including inquiry and investigation bodies, and local government bodies upon their motivated request;</li>
                <li>3.4.2 in other cases directly provided for by the current legislation of the Republic of Kazakhstan.</li>
              </ul>
              <p>
                3.5. The Operator has the right to transfer Personal data and Data to third parties not specified in clause 3.4 of this Privacy Policy in cases where:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>3.5.1 the User has expressed their consent to such actions;</li>
                <li>3.5.2 the transfer is necessary as part of the User's use of the online resource or the provision of Services to the User.</li>
              </ul>

              <h4 className="font-semibold text-slate-900 mt-4">4. PROTECTION OF PERSONAL DATA</h4>
              <p>
                4.1. The Operator carries out proper protection of Personal and other data in accordance with the Legislation and takes necessary and sufficient organizational and technical measures to protect Personal data.
              </p>
              <p>
                4.2. Applied security measures protect Personal data from unauthorized or accidental access, destruction, alteration, blocking, copying, distribution, as well as from other unlawful actions with them by third parties.
              </p>

              <h4 className="font-semibold text-slate-900 mt-4">5. OTHER PROVISIONS</h4>
              <p>
                5.1. The law of the Republic of Kazakhstan shall apply to this Privacy Policy and the relations between the User and the Operator.
              </p>
              <p>
                5.2. All possible disputes arising from this Agreement shall be resolved in accordance with the current legislation at the place of registration of the Operator.<br />
                Before applying to the court, the User must comply with the mandatory pre-trial claim procedure and send the corresponding claim to the Operator in writing. The response time is 30 (thirty) business days.
              </p>
              <p>
                5.3. If one or more provisions of the Privacy Policy are found invalid, it does not affect the validity of the remaining provisions.
              </p>
              <p>
                5.4. The Operator has the right to change the Privacy Policy at any time unilaterally.
              </p>
              <p>
                5.5. Suggestions or questions regarding this Privacy Policy should be reported by email to <strong>geducation1017@gmail.com</strong> or by phone: <strong>+7 (706) 430-71-95</strong>.
              </p>
            </>
          )}

          {language === 'KZ' && (
            <>
              <p className="font-normal text-slate-950 text-xs">Күшіне енген күні: 10 маусым 2026 ж.</p>
              
              <p>
                Осы құпиялылық және жеке деректерді өңдеу саясаты <strong>«SAAMA GROUP» ЖШС</strong> (бұдан әрі — Оператор) онлайн-ресурсының жеке және өзге де деректерін өңдеу мен пайдалану тәртібін реттейді. Құпиялылық саясатының қолданыстағы редакциясы танысу үшін әрдайым қолжетімді және Интернет желісінде мына мекенжай бойынша орналасқан: <strong>https://up-chat.com/privacy-policy</strong>
              </p>
              <p>
                Пайдаланушы жеке және өзге де деректерді онлайн-ресурс арқылы толтыру арқылы Операторға бере отырып, осы Құпиялылық саясатында көрсетілген шарттарда пайдалануға келісімін растайды.
              </p>
              <p>
                Егер Пайдаланушы осы Құпиялылық саясатының шарттарымен келіспесе, ол онлайн-ресурсты пайдалануды дереу тоқтатуға міндетті.
              </p>
              <p>
                Пайдаланушының онлайн-ресурсты пайдалана бастауы осы Құпиялылық саясатының сөзсіз акцепті болып табылады.
              </p>

              <h4 className="font-semibold text-slate-900 mt-4">1. ТЕРМИНДЕР</h4>
              <p>
                1.1. онлайн-ресурс – Интернет желісінде <strong>https://up-chat.com</strong> мекенжайы бойынша орналасқан сайт/телеграм-бот.<br />
                Онлайн-ресурсқа және оның жекелеген элементтеріне (бағдарламалық қамтамасыз етуді, дизайнды қоса алғанда) барлық айрықша құқықтар толық көлемде Операторға тиесілі. Айрықша құқықтарды Пайдаланушыға беру осы Құпиялылық саясатының пәні болып табылмайды.
              </p>
              <p>
                1.2. Пайдаланушы — онлайн-ресурсты пайдаланатын кез келген тұлға.
              </p>
              <p>
                1.3. Заңнама — Қазақстан Республикасының қолданыстағы заңнамасы.
              </p>
              <p>
                1.4. Жеке деректер — Пайдаланушы онлайн-ресурс функционалын тіркеу немесе пайдалану процесінде дербес беретін жеке деректері.
              </p>
              <p>
                1.5. Деректер — Пайдаланушы туралы өзге де деректер (Жеке деректер ұғымына кірмейтін).
              </p>
              <p>
                1.6. Тіркелу — Пайдаланушының қажетті мәліметтерді көрсету және сканерленген құжаттарды жіберу арқылы Тіркеу нысанын толтыруы.
              </p>
              <p>
                1.7. Тіркеу нысаны — Пайдаланушы онлайн-ресурсты толық көлемде пайдалану үшін толтыруы қажет нысан.
              </p>
              <p>
                1.8. Қызмет(тер) — Оператор келісім негізінде көрсететін қызметтер.
              </p>

              <h4 className="font-semibold text-slate-900 mt-4">2. ЖЕКЕ ДЕРЕКТЕРДІ ЖИНАУ ЖӘНЕ ӨҢДЕУ</h4>
              <p>
                2.1. Оператор тек Қызмет көрсету және Пайдаланушымен өзара әрекеттесу үшін қажетті Жеке деректерді жинайды және сақтайды.
              </p>
              <p>
                2.2. Жеке деректер келесі мақсаттарда пайдаланылуы мүмкін:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>2.2.1 Пайдаланушыға Қызмет көрсету;</li>
                <li>2.2.2 Пайдаланушыны сәйкестендіру;</li>
                <li>2.2.3 Пайдаланушымен өзара әрекеттесу;</li>
                <li>2.2.4 Пайдаланушыға жарнамалық материалдар мен ақпараттық сұрауларды жолдау;</li>
                <li>2.2.5 статистикалық және өзге де зерттеулер жүргізу;</li>
              </ul>
              <p>
                2.3. Оператор, сондай-ақ келесі деректерді өңдейді:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>2.3.1 тегі, аты және әкесінің аты (бар болса);</li>
                <li>2.3.2 электрондық пошта мекенжайы;</li>
                <li>2.3.3 телефон нөмірі (оның ішінде ұялы телефон).</li>
              </ul>
              <p>
                2.4. Пайдаланушыға үшінші тұлғалардың жеке деректерін көрсетуге тыйым салынады.
              </p>

              <h4 className="font-semibold text-slate-900 mt-4">3. ЖЕКЕ ЖӘНЕ ӨЗГЕ ДЕ ДЕРЕКТЕРДІ ӨҢДЕУ ТӘРТІБІ</h4>
              <p>
                3.1. Оператор Жеке деректерді Қазақстан Республикасының «Дербес деректер және оларды қорғау туралы» Заңына және Оператордың ішкі құжаттарына сәйкес пайдалануға міндеттенеді.
              </p>
              <p>
                3.2. Пайдаланушының Жеке деректері мен өзге де Деректеріне қатысты олардың құпиялылығы сақталады, тек осы деректер жалпыға қолжетімді болған жағдайларды қоспағанда.
              </p>
              <p>
                3.3. Оператордың Жеке деректердің архивтік көшірмесін сақтауға және деректерді Қазақстан Республикасының аумағынан тыс серверлерде сақтауға құқығы бар.
              </p>
              <p>
                3.4. Оператордың Пайдаланушының келісімінсіз Жеке деректерін келесі тұлғаларға беруге құқығы бар:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>3.4.1 мемлекеттік органдарға, оның ішінде анықтау және тергеу органдарына олардың дәлелді сұрауы бойынша;</li>
                <li>3.4.2 Қазақстан Республикасының қолданыстағы заңнамасында тікелей көзделген өзге де жағдайларда.</li>
              </ul>

              <h4 className="font-semibold text-slate-900 mt-4">4. ЖЕКЕ ДЕРЕКТЕРДІ ҚОРҒАУ</h4>
              <p>
                4.1. Оператор Заңнамаға сәйкес Жеке және өзге де деректерді тиісті түрде қорғауды жүзеге асырады және қажетті ұйымдық-техникалық шараларды қабылдайды.
              </p>
              <p>
                4.2. Қабылданған қорғау шаралары Жеке деректерді рұқсатсыз немесе кездейсоқ қол жеткізуден, жоюдан, өзгертуден, блоктаудан, көшіруден және үшінші тұлғалардың басқа да заңсыз әрекеттерінен қорғауға мүмкіндік береді.
              </p>

              <h4 className="font-semibold text-slate-900 mt-4">5. БАСҚА ДА ЕРЕЖЕЛЕР</h4>
              <p>
                5.1. Осы Құпиялылық саясатына және Пайдаланушы мен Оператор арасындағы құқықтық қатынастарға Қазақстан Республикасының құқығы қолданылады.
              </p>
              <p>
                5.2. Даулар Оператор тіркелген жер бойынша сотта қаралады. Сотқа жүгінер алдында Пайдаланушы жазбаша түрде шағым жолдауы тиіс. Жауап беру мерзімі — 30 (отыз) жұмыс күні.
              </p>
              <p>
                5.3. Егер Құпиялылық саясатының қандай да бір ережесі жарамсыз деп танылса, бұл оның қалған ережелерінің заңды күшіне әсер етпейді.
              </p>
              <p>
                5.4. Барлық ұсыныстар немесе сұрақтар бойынша мына электрондық поштаға хабарласу керек: <strong>geducation1017@gmail.com</strong> немесе телефон нөмірі: <strong>+7 (706) 430-71-95</strong>.
              </p>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
