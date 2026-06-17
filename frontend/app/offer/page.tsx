'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

export default function OfferPage() {
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
          {language === 'RU' ? 'Договор-оферта' : language === 'KZ' ? 'Жария оферта келісімшарты' : 'Public Offer Agreement'}
        </h1>
        <div className="space-y-6 font-light text-slate-700 text-sm leading-relaxed bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
          {language === 'RU' && (
            <>
              <p className="font-normal text-slate-950 text-xs">Дата вступления в силу: 10 июня 2026 г.</p>

              <h2 className="text-xl font-semibold text-slate-900 border-b pb-2 mb-4">Политика проведения платежей. Оплата банковской картой онлайн</h2>
              
              <p>
                Наш сайт подключен к интернет-эквайрингу, и Вы можете оплатить заказ банковской картой Visa или Mastercard прямо на сайте. После подтверждения выбранного заказа откроется защищенное окно с платежной страницей платёжного сервиса Robokassa, где Вам необходимо ввести данные Вашей банковской карты и адрес электронной почты для квитанции или фискального чека. Мы используем протокол 3D Secure для подтверждения оплаты. Если Ваш Банк поддерживает данный протокол, Вы будете перенаправлены на сервер банка для дополнительной идентификации c помощью SMS кода. Информацию о правилах и методах дополнительной идентификации уточняйте в Банке, выдавшем Вам банковскую карту.
              </p>

              <p>
                В поля на платежной странице требуется ввести номер карты, адрес электронной почты, срок действия карты, трёхзначный код безопасности (CVV2 для VISA или CVC2 для MasterCard). Все необходимые данные отображены на поверхности банковской карты.<br />
                CVV2/ CVC2 — это трёхзначный код безопасности, находящийся на оборотной стороне карты.<br />
                Далее в том же окне откроется страница Вашего банка-эмитента для ввода 3-D Secure кода. В случае, если у вас не настроен статичный 3-D Secure, он будет отправлен на ваш номер телефона посредством SMS. Если 3-D Secure код к Вам не пришел, то следует обратится в ваш банк-эмитент.<br />
                3-D Secure — это самая современная технология обеспечения безопасности платежей по картам в сети интернет. Позволяет однозначно идентифицировать подлинность держателя карты, осуществляющего операцию, и максимально снизить риск мошеннических операций по карте.
              </p>

              <h3 className="font-semibold text-slate-900 mt-4">Случаи отказа в совершении платежа:</h3>
              <p>В случае, если ваш платёж не прошёл или операция была отменена, проверьте:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>правильно ли были введены реквизиты? Обратите внимание на срок действия вашей карты и номер;</li>
                <li>достаточно ли средств на вашей карте? Подробнее о наличии средств на платежной карте Вы можете узнать, обратившись в банк, выпустивший банковскую карту;</li>
                <li>открыта ли возможность проведения оплат в интернете? Подробнее о возможностях вашей карты Вы можете узнать, обратившись в банк-эмитент;</li>
                <li>хватает ли вам ежедневного лимита на платежи в интернете? Подробнее о лимитах вашей карты Вы можете узнать, обратившись в банк-эмитент.</li>
              </ul>

              <p>
                По вопросам непрошедшей оплаты, пожалуйста обратитесь в службу поддержки банка-эмитента, выпустившего вашу банковскую карту, или в службу поддержки сайта, на котором была произведена оплата.
              </p>

              <h3 className="font-semibold text-slate-900 mt-4">Гарантии безопасности</h3>
              <p>
                Платёжный сервис Robokassa защищает и обрабатывает данные Вашей банковской карты по стандарту безопасности PCI DSS. Передача информации в платежный шлюз происходит с применением технологии шифрования SSL. Дальнейшая передача информации происходит по закрытым банковским сетям, имеющим наивысший уровень надежности. Robokassa не передает данные Вашей карты интернет магазину или третьим лицам. Для дополнительной аутентификации держателя карты используется протокол 3D Secure.<br />
                В случае, если у Вас есть вопросы по совершенному платежу, Вы можете обратиться в службу поддержки клиентов по электронной почте <strong>support@robokassa.kz</strong>
              </p>

              <h3 className="font-semibold text-slate-900 mt-4">Безопасность онлайн платежей</h3>
              <p>
                Предоставляемая Вами персональная информация (e-mail, номер банковской карты) является конфиденциальной и не подлежит разглашению. Данные Вашей банковской карты передаются только в зашифрованном виде и не сохраняются на нашем сервере.<br />
                Безопасность обработки Интернет-платежей гарантирует платёжный сервис Robokassa. Все операции с платежными картами происходят в соответствии с требованиями VISA International, MasterCard Worldwide и других платежных систем. При передаче информации используется специальные технологии безопасности карточных онлайн-платежей, обработка данных ведется на безопасном высокотехнологичном сервере платёжного сервиса.
              </p>

              <p>Оплата платежными картами безопасна, потому что:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Система авторизации гарантирует покупателю, что платежные реквизиты его платежной карты (номер, срок действия, CVV2/CVC2) не попадут в руки мошенников, так как эти данные не хранятся на сервере в зашифрованном виде и не могут быть похищены.</li>
                <li>Покупатель вводит свои платежные данные непосредственно в системе авторизации Robokassa, а не на сайте интернет-магазина, следовательно, платежные реквизиты карточки покупателя не будут доступны третьим лицам.</li>
              </ul>

              <h2 className="text-xl font-semibold text-slate-900 border-b pb-2 mt-8 mb-4">Договор публичной оферты</h2>
              <p className="italic text-xs text-slate-500">
                (Публичная оферта – это содержащее все существенные условия договора предложение, из которого усматривается воля лица, делающего предложение заключить договор на указанных в публичной оферте условиях с любым лицом, которое отзовется на это предложение в соответствии с п. 5 ст. 395 Гражданского кодекса Республики Казахстан)
              </p>
              <p>
                Текст Договора является предложением (публичной офертой) на использование онлайн сервиса: <strong>https://up-chat.com</strong> (далее – Сайт), доступ к которому предоставляет возможность получения услуг и пользования информационными ресурсами Администратора сайта <strong>ТОО &quot;SAAMA GROUP&quot;</strong> (далее – Администратор).
              </p>
              <p>
                Оплата услуг, представленных на сайте Администратора физическим /юридическим лицом (далее – Пользователь) являться акцептом данной публичной оферты, что равносильно заключению договора (далее – Договор) на условиях, изложенных в нем.
              </p>
              <p>
                В случае, если Пользователь не согласен с текстом представленного Договора, Администратор предлагает отказаться от использования предоставляемых услуг.
              </p>

              <h4 className="font-semibold text-slate-900 mt-4">1. Основные положения</h4>
              <p>
                1.1. Пользователь и Администратор заключили настоящий договор (далее – Договор) на получение услуг, представленных Администратором, в соответствии с действующим законодательством Республики Казахстан.
              </p>
              <p>
                1.2. Термины, используемые в тексте Договора:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>«Оферта»</strong> - публичное предложение на использование онлайн сервиса;</li>
                <li><strong>«Акцепт»</strong> - безоговорочное принятие Пользователем условий договора в полном объеме;</li>
                <li><strong>«Администратор»</strong> - сервис-провайдер, являющийся собственником сайта;</li>
                <li><strong>«Пользователь»</strong> - любое физическое/юридическое лицо, которое принимает условия договора и пользуется услугами представленными на сайте Администратора;</li>
                <li><strong>«Услуги»</strong> - предоставление доступа к ПО ИИ-ассистента;</li>
                <li><strong>«Сайт»</strong> - совокупность программных средств, расположенная в сети Интернет по адресу <strong>https://up-chat.com</strong></li>
              </ul>

              <h4 className="font-semibold text-slate-900 mt-4">2. Предмет оферты</h4>
              <p>
                2.1. Администратор предоставляет услуги по предоставлению доступа к ПО ИИ-ассистента на Сайте.
              </p>
              <p>
                2.2. Администратор обязуется оказывать техническое обслуживание и поддержку Сайта.
              </p>
              <p>
                2.3. Действующая редакция Договора находится на Сайте в публичном доступе по адресу: <strong>https://up-chat.com/offer</strong>.
              </p>

              <h4 className="font-semibold text-slate-900 mt-4">3. Использование онлайн сервиса</h4>
              <p>
                3.1. Для получения услуги Администратора Пользователь по своему желанию выбирает тарифный план, проводит регистрацию путем предоставления персональных данных и производит оплату.
              </p>
              <p>
                3.2. Оплата Пользователя означает безоговорочное и полное согласие с условиями Договора. День оплаты Пользователем Услуг считается днем заключения Договора на срок указанный в пакете услуг.
              </p>

              <h4 className="font-semibold text-slate-900 mt-4">4. Регистрация на сайте, конфиденциальность и защита персональных данных</h4>
              <p>
                4.1. Персональные данные содержат в себе следующую информацию: фамилия, имя, отчество Пользователя; адрес электронной почты (E-mail); пароль и логин для входа в личный кабинет.
              </p>
              <p>
                4.2. При необходимости Пользователь имеет право редактировать внесенные данные о себе в личном кабинете.
              </p>
              <p>
                4.3. Администратор обязуется не разглашать полученную от Пользователя информацию. Не считается нарушением обязательств разглашение информации в соответствии с обоснованными требованиями, согласно действующему законодательству Республики Казахстан.
              </p>

              <h4 className="font-semibold text-slate-900 mt-4">5. Права и обязанности сторон</h4>
              <p>5.1. Администратор: обязуется оказывать техническую поддержку; обязуется не разглашать персональные данные; имеет право в одностороннем порядке изменять условия предоставления Услуг.</p>
              <p>5.2. Пользователь: несет полную ответственность за правильность информации; имеет право пользоваться услугами Сайта в своих интересах.</p>

              <h4 className="font-semibold text-slate-900 mt-4">6. Порядок оплаты</h4>
              <p>
                6.1. Оплата производится на счет Администратора банковскими картами или иными безналичными способами после проведения регистрации по тарифным планам.
              </p>
              <p>
                6.2. Услуги предоставляются при условии 100% предоплаты.
              </p>

              <h4 className="font-semibold text-slate-900 mt-4">7. Ответственность сторон, разрешение споров</h4>
              <p>
                7.1. За неисполнение обязательств Стороны несут ответственность в соответствии с действующим законодательством Республики Казахстан.
              </p>

              <h4 className="font-semibold text-slate-900 mt-4">8. Срок действия договора и его расторжение</h4>
              <p>
                8.1. Публичная оферта вступает в силу с момента акцепта Оферты и действует в течение срока предоставления доступа к Сайту Администратора.
              </p>
              <p>
                8.2. Возврат денежных средств производится Администратором за минусом денежной суммы за фактически оказанные Услуги в течение 14 календарных дней с даты получения доступа при направлении письменного заявления.
              </p>

              <h4 className="font-semibold text-slate-900 mt-4">9. Прочие условия</h4>
              <p>
                9.1. Администратор имеет право в одностороннем порядке изменить условия Договора в целом или в его части без согласования с Пользователем.
              </p>

              <h4 className="font-semibold text-slate-900 mt-4">10. РЕКВИЗИТЫ</h4>
              <p className="font-normal text-slate-800">
                <strong>Наименование ИП/ЮЛ:</strong> ТОО &quot;SAAMA GROUP&quot;<br />
                <strong>ИИН/БИН:</strong> 171040010072<br />
                <strong>Расчетный счет (KZT):</strong> KZ87722S000021139717 (АО &quot;Kaspi Bank&quot;, БИК: CASPKZKA)<br />
                <strong>Почта/телефон для обращений:</strong> geducation1017@gmail.com / +7 (706) 430-71-95<br />
                <strong>Юридический адрес:</strong> 140000, Республика Казахстан, г. Павлодар, ул. Едыге Би, 71Б
              </p>
            </>
          )}

          {language === 'EN' && (
            <>
              <p className="font-normal text-slate-950 text-xs">Effective Date: June 10, 2026</p>

              <h2 className="text-xl font-semibold text-slate-900 border-b pb-2 mb-4">Payment Policy. Online Payment by Bank Card</h2>
              
              <p>
                Our site is connected to internet acquiring, and you can pay for your order with a Visa or Mastercard bank card directly on the website. After confirming the selected order, a secure window will open with the payment page of the Robokassa payment service, where you need to enter your bank card details and an email address for a receipt or fiscal check. We use the 3D Secure protocol to confirm payments. If your Bank supports this protocol, you will be redirected to the bank's server for additional identification using an SMS code.
              </p>

              <p>
                On the payment page, you must enter the card number, email address, card expiration date, and three-digit security code (CVV2 for VISA or CVC2 for MasterCard). All necessary data is displayed on the card surface.<br />
                CVV2/CVC2 is a three-digit security code located on the back of the card.
              </p>

              <h3 className="font-semibold text-slate-900 mt-4">Reasons for Payment Rejection:</h3>
              <p>If your payment did not go through or was cancelled, check:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Are card details correct? Expiration date, card number;</li>
                <li>Sufficient funds? Contact the bank that issued the card;</li>
                <li>Is online payment enabled on your card?</li>
                <li>Are daily limits exceeded?</li>
              </ul>

              <h3 className="font-semibold text-slate-900 mt-4">Security Guarantees</h3>
              <p>
                The Robokassa payment service protects and processes your bank card data in accordance with the PCI DSS security standard. Information transmission to the payment gateway is carried out using SSL encryption technology. Robokassa does not transmit your card data to the online store or third parties.<br />
                For queries about payments, contact support via email at <strong>support@robokassa.kz</strong>.
              </p>

              <h2 className="text-xl font-semibold text-slate-900 border-b pb-2 mt-8 mb-4">Public Offer Agreement</h2>
              <p className="italic text-xs text-slate-500">
                (Public offer is a proposal containing all essential terms of the agreement, from which the will of the proposer to conclude the contract under the specified conditions is visible, in accordance with the Civil Code of the Republic of Kazakhstan)
              </p>
              <p>
                This Agreement text is a proposal (public offer) for using the online service: <strong>https://up-chat.com</strong> (hereinafter – the Site), access to which provides the opportunity to receive services and use informational resources of the Site Administrator <strong>SAAMA GROUP LLP</strong> (hereinafter – the Administrator).
              </p>
              <p>
                Payment for services presented on the Administrator's website by a physical or legal person (hereinafter – the User) constitutes acceptance of this public offer, which is equivalent to concluding a contract (hereinafter – the Agreement) on the terms set forth herein.
              </p>

              <h4 className="font-semibold text-slate-900 mt-4">1. General Provisions</h4>
              <p>
                1.1. The User and the Administrator have concluded this Agreement for obtaining services represented by the Administrator in accordance with the legislation of the Republic of Kazakhstan.
              </p>
              <p>
                1.2. Terms used:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>&quot;Offer&quot;</strong> - public proposal for using the online service;</li>
                <li><strong>&quot;Acceptance&quot;</strong> - unconditional acceptance of the agreement conditions by the User;</li>
                <li><strong>&quot;Administrator&quot;</strong> - service provider, owner of the site;</li>
                <li><strong>&quot;User&quot;</strong> - any individual/legal entity accepting the agreement;</li>
                <li><strong>&quot;Services&quot;</strong> - providing access to AI Assistant software.</li>
              </ul>

              <h4 className="font-semibold text-slate-900 mt-4">2. Subject of the Offer</h4>
              <p>
                2.1. The Administrator provides services by granting access to the AI Assistant software on the Site.
              </p>
              <p>
                2.2. The Administrator undertakes to provide technical maintenance and support for the Site.
              </p>

              <h4 className="font-semibold text-slate-900 mt-4">3. Use of the Online Service</h4>
              <p>
                3.1. To receive services, the User chooses a tariff plan, registers, and makes the payment.
              </p>

              <h4 className="font-semibold text-slate-900 mt-4">4. Registration, Confidentiality, and Protection of Personal Data</h4>
              <p>
                4.1. Personal data includes: full name, email, login/password for entering the personal account.
              </p>

              <h4 className="font-semibold text-slate-900 mt-4">5. Rights and Obligations of the Parties</h4>
              <p>5.1. The Administrator: provides technical support, respects confidentiality, holds the right to modify services.</p>
              <p>5.2. The User: takes full responsibility for input accuracy and account security.</p>

              <h4 className="font-semibold text-slate-900 mt-4">6. Payment Procedure</h4>
              <p>
                6.1. Payments are made to the Administrator's account by bank card or other cashless options. Services are provided on a 100% prepayment basis.
              </p>

              <h4 className="font-semibold text-slate-900 mt-4">7. Liabilities of the Parties & Dispute Resolution</h4>
              <p>
                7.1. For failure to perform obligations, the Parties are liable according to the legislation of the Republic of Kazakhstan.
              </p>

              <h4 className="font-semibold text-slate-900 mt-4">8. Duration of the Agreement & Termination</h4>
              <p>
                8.1. The Public Offer comes into force upon acceptance and remains active throughout the service period. Refund requests are accepted within 14 calendar days from access.
              </p>

              <h4 className="font-semibold text-slate-900 mt-4">9. Miscellaneous</h4>
              <p>
                9.1. The Administrator reserves the right to change these terms unilaterally.
              </p>

              <h4 className="font-semibold text-slate-900 mt-4">10. DETAILS</h4>
              <p className="font-normal text-slate-800">
                <strong>Name of Entity:</strong> SAAMA GROUP LLP<br />
                <strong>BIN:</strong> 171040010072<br />
                <strong>Bank Account (KZT):</strong> KZ87722S000021139717 (JSC &quot;Kaspi Bank&quot;, BIC: CASPKZKA)<br />
                <strong>Contact Email/Phone:</strong> geducation1017@gmail.com / +7 (706) 430-71-95<br />
                <strong>Legal Address:</strong> 140000, Republic of Kazakhstan, Pavlodar, Edyge Bi St., 71B
              </p>
            </>
          )}

          {language === 'KZ' && (
            <>
              <p className="font-normal text-slate-950 text-xs">Күшіне енген күні: 10 маусым 2026 ж.</p>

              <h2 className="text-xl font-semibold text-slate-900 border-b pb-2 mb-4">Төлем саясаты. Банк картасымен онлайн төлеу</h2>
              
              <p>
                Біздің сайт интернет-эквайрингке қосылған, сіз тапсырысты тікелей сайтта Visa немесе Mastercard банк картасымен төлей аласыз. Таңдалған тапсырысты растағаннан кейін Robokassa төлем қызметінің қорғалған терезесі ашылады. Төлемді растау үшін біз 3D Secure хаттамасын қолданамыз.
              </p>

              <p>
                Төлем парағындағы өрістерге карта нөмірін, электрондық пошта мекенжайын, картаның қолданылу мерзімін және үш таңбалы қауіпсіздік кодын (VISA үшін CVV2 немесе MasterCard үшін CVC2) енгізу қажет.<br />
                CVV2/CVC2 — картаның сыртқы жағында орналасқан үш таңбалы қауіпсіздік коды.
              </p>

              <h3 className="font-semibold text-slate-900 mt-4">Төлемнен бас тарту жағдайлары:</h3>
              <p>Төлем өтпесе немесе тоқтатылса, тексеріңіз:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Реквизиттердің дұрыстығы (карта нөмірі мен мерзімі);</li>
                <li>Қаражаттың жеткіліктілігі (картаны шығарған банкке хабарласыңыз);</li>
                <li>Интернет-төлемдерге рұқсат берілгендігі;</li>
                <li>Күнделікті лимиттердің асып кетпеуі.</li>
              </ul>

              <h3 className="font-semibold text-slate-900 mt-4">Қауіпсіздік кепілдігі</h3>
              <p>
                Robokassa төлем қызметі сіздің банк картаңыздың деректерін PCI DSS қауіпсіздік стандарты бойынша қорғайды және өңдейді. Төлем шлюзіне ақпарат беру SSL шифрлау технологиясы арқылы жүзеге асырылады. Robokassa сіздің карта деректеріңізді интернет-дүкенге немесе үшінші тұлғаларға бермейді. Төлемдерге қатысты сұрақтар бойынша мына мекенжайға хабарласуға болады: <strong>support@robokassa.kz</strong>.
              </p>

              <h2 className="text-xl font-semibold text-slate-900 border-b pb-2 mt-8 mb-4">Жария оферта келісімшарты</h2>
              <p className="italic text-xs text-slate-500">
                (Жария оферта — бұл шарттың барлық елеулі талаптарын қамтитын, ұсыныста көрсетілген талаптар бойынша оған жауап беретін кез келген тұлғамен шарт жасасуға ниет білдіретін ұсыныс, ҚР Азаматтық кодексінің 395-бабы 5-тармағына сәйкес)
              </p>
              <p>
                Келісімшарт мәтіні мына онлайн қызметті пайдалануға арналған ұсыныс (жария оферта) болып табылады: <strong>https://up-chat.com</strong> (бұдан әрі – Сайт), оған қол жеткізу Сайт Әкімшісі <strong>«SAAMA GROUP» ЖШС</strong> (бұдан әрі – Әкімші) көрсететін қызметтер мен ақпараттық ресурстарды пайдалануға мүмкіндік береді.
              </p>
              <p>
                Әкімші сайтында көрсетілген қызметтер үшін жеке/заңды тұлғаның (бұдан әрі – Пайдаланушы) төлем жасауы осы жария офертаны қабылдауы (акцепттеуі) болып табылады.
              </p>

              <h4 className="font-semibold text-slate-900 mt-4">1. Негізгі ережелер</h4>
              <p>
                1.1. Пайдаланушы мен Әкімші осы Келісімшартты Қазақстан Республикасының қолданыстағы заңнамасына сәйкес жасасты.
              </p>
              <p>
                1.2. Қолданылатын терминдер:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>«Оферта»</strong> - онлайн қызметті пайдалануға жария ұсыныс;</li>
                <li><strong>«Акцепт»</strong> - оферта шарттарын толық және сөзсіз қабылдау;</li>
                <li><strong>«Әкімші»</strong> - сайт иесі болып табылатын қызмет көрсетуші;</li>
                <li><strong>«Пайдаланушы»</strong> - шартты қабылдаған кез келген жеке/заңды тұлға;</li>
                <li><strong>«Қызметтер»</strong> - ИИ-ассистентінің БҚ-сына қолжетімділік беру.</li>
              </ul>

              <h4 className="font-semibold text-slate-900 mt-4">2. Оферта пәні</h4>
              <p>
                2.1. Әкімші Сайтта ИИ-ассистентінің БҚ-сына қолжетімділік беру бойынша қызмет көрсетеді.
              </p>
              <p>
                2.2. Әкімші Сайтқа техникалық қызмет көрсету және қолдау көрсетуді міндетіне алады.
              </p>

              <h4 className="font-semibold text-slate-900 mt-4">3. Онлайн қызметті пайдалану</h4>
              <p>
                3.1. Қызмет алу үшін Пайдаланушы тарифтік жоспарды таңдап, тіркеледі және төлем жасайды.
              </p>

              <h4 className="font-semibold text-slate-900 mt-4">4. Тіркелу және жеке деректерді қорғау</h4>
              <p>
                4.1. Жеке деректерге: Т.А.Ә., электрондық пошта мекенжайы, жеке кабинетке кіруге арналған логин мен құпия сөз кіреді.
              </p>

              <h4 className="font-semibold text-slate-900 mt-4">5. Тараптардың құқықтары мен міндеттері</h4>
              <p>5.1. Әкімші: техникалық қолдау көрсетеді, деректер құпиялығын сақтайды, шартты біржақты өзгертуге құқылы.</p>
              <p>5.2. Пайдаланушы: ақпараттың дұрыстығына және жеке кабинет қауіпсіздігіне жауапты.</p>

              <h4 className="font-semibold text-slate-900 mt-4">6. Төлеу тәртібі</h4>
              <p>
                6.1. Төлем Әкімшінің шотына банк карталары немесе өзге қолма-қол ақшасыз әдістермен 100% алдын ала төлем шартымен жасалады.
              </p>

              <h4 className="font-semibold text-slate-900 mt-4">7. Жауапкершілік және дауларды шешу</h4>
              <p>
                7.1. Міндеттемелерді орындамағаны үшін Тараптар Қазақстан Республикасының қолданыстағы заңнамасына сәйкес жауапты болады.
              </p>

              <h4 className="font-semibold text-slate-900 mt-4">8. Шарттың қолданылу мерзімі және бұзылуы</h4>
              <p>
                8.1. Жария оферта акцепттелген сәттен бастап күшіне енеді. Қаражатты қайтару туралы өтініштер сайтқа қол жеткізген күннен бастап 14 күнтізбелік күн ішінде қабылданады.
              </p>

              <h4 className="font-semibold text-slate-900 mt-4">9. Басқа шарттар</h4>
              <p>
                9.1. Әкімші осы шарттарды біржақты өзгертуге құқылы.
              </p>

              <h4 className="font-semibold text-slate-900 mt-4">10. РЕКВИЗИТТЕР</h4>
              <p className="font-normal text-slate-800">
                <strong>Атауы:</strong> «SAAMA GROUP» ЖШС<br />
                <strong>БСН (БИН):</strong> 171040010072<br />
                <strong>Есеп айырысу шоты (KZT):</strong> KZ87722S000021139717 («Kaspi Bank» АҚ, БИК: CASPKZKA)<br />
                <strong>Электрондық пошта/Телефон:</strong> geducation1017@gmail.com / +7 (706) 430-71-95<br />
                <strong>Заңды мекенжайы:</strong> 140000, Қазақстан Республикасы, Павлодар қ., Едыге Би к-сі, 71Б
              </p>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
