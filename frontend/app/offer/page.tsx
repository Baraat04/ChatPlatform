'use client';

import Link from 'next/link';
import { Bot, ArrowLeft } from 'lucide-react';

export default function OfferPage() {
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
            <Bot className="w-6 h-6 text-teal-600" />
            <span className="font-semibold text-lg tracking-tight heading-font text-slate-900">UP-CHAT</span>
          </Link>
          <Link href="/landing" className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-teal-600 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Назад
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-16 space-y-6">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-950 heading-font mb-8">Договор-оферта</h1>
        <div className="space-y-6 font-light text-slate-700 text-sm leading-relaxed bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
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
            Наименование: ТОО &quot;SAAMA GROUP&quot;<br />
            Юридический адрес: 140000, Республика Казахстан, г. Павлодар, улица Малахова, дом 11<br />
            БИН: 171040010072<br />
            КБе: 17<br />
            <br />
            Банк: АО &quot;Народный Банк Казахстана&quot;<br />
            БИК: HSBKKZKX<br />
            <br />
            Расчетный счёт (KZT): KZ43601A871020245111<br />
            Расчетный счёт (RUB): KZ75601A241017267491<br />
            Расчетный счёт (USD): KZ78601A871048411341<br />
            <br />
            Телефон: +7 777 420-19-89<br />
            E-mail: geducation1017@gmail.com
          </p>
        </div>
      </main>
    </div>
  );
}
