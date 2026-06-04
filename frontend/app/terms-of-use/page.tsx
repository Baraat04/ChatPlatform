'use client';

import Link from 'next/link';
import { Bot, ArrowLeft } from 'lucide-react';

export default function TermsOfUsePage() {
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
        <h1 className="text-3xl font-semibold tracking-tight text-slate-950 heading-font mb-8">Условия пользования</h1>
        <div className="space-y-6 font-light text-slate-700 text-sm leading-relaxed bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
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
        </div>
      </main>
    </div>
  );
}
