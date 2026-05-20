'use client';

import React from 'react';
import { BookOpen, PlayCircle, Activity, MessageSquare } from 'lucide-react';

export default function DocumentationContent() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-slate-800 font-sans">
      
      {/* 1. Введение */}
      <section className="mb-12">
        <header className="mb-6 flex items-center gap-3">
          <BookOpen size={20} className="text-slate-500" />
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
            Документация и руководство пользователя
          </h1>
        </header>
        <p className="text-lg leading-relaxed text-slate-600">
          BotFlow — это платформа для создания и управления умными AI-помощниками в Telegram и WhatsApp без навыков программирования. Бот обучается на текстовых данных компании и берет на себя автоматическое общение с клиентами.
        </p>
      </section>

      {/* 2. Пошаговое руководство: Создание и запуск бота */}
      <section className="mb-16">
        <header className="mb-6 flex items-center gap-3">
          <PlayCircle size={20} className="text-slate-500" />
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
            Пошаговое руководство: Создание и запуск бота
          </h2>
        </header>
        
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-md p-6 sm:p-8">
            <h3 className="text-lg font-medium text-slate-900 mb-3">
              Шаг 1. Выбор платформы
            </h3>
            <p className="text-slate-600 leading-relaxed">
              Пользователь выбирает мессенджер, в котором будет работать ассистент: Telegram или WhatsApp.
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-md p-6 sm:p-8">
            <h3 className="text-lg font-medium text-slate-900 mb-3">
              Шаг 2. Подключение к мессенджеру
            </h3>
            <ul className="list-disc list-inside space-y-3 text-slate-600 leading-relaxed">
              <li>
                <span className="font-medium text-slate-800">Для Telegram:</span> В специальное поле вставляется текстовый ключ (токен), полученный у официального сервиса BotFather.
              </li>
              <li>
                <span className="font-medium text-slate-800">Для WhatsApp:</span> На экране отображается QR-код. Пользователю нужно отсканировать его через функцию «Связанные устройства» в мобильном приложении WhatsApp (точно так же, как при входе в WhatsApp Web).
              </li>
            </ul>
          </div>

          <div className="bg-white border border-slate-200 rounded-md p-6 sm:p-8">
            <h3 className="text-lg font-medium text-slate-900 mb-3">
              Шаг 3. Обучение и настройка
            </h3>
            <p className="text-slate-600 leading-relaxed mb-4">
              Заполнение простой текстовой формы, где определяются параметры бота:
            </p>
            <ul className="space-y-4 text-slate-600 leading-relaxed">
              <li className="pl-4 border-l-2 border-slate-200">
                <strong className="block text-slate-800 font-medium mb-1">Роль и поведение:</strong>
                Описание того, кем является бот (например, «Консультант автосалона») и в каком стиле он должен общаться (вежливо, дружелюбно, строго официально).
              </li>
              <li className="pl-4 border-l-2 border-slate-200">
                <strong className="block text-slate-800 font-medium mb-1">База знаний:</strong>
                Сюда в свободной текстовой форме вносится вся необходимая информация — график работы организации, адреса филиалов, актуальный прайс-лист, описание услуг и готовые ответы на частые вопросы. Бот будет использовать эти данные для формулирования ответов.
              </li>
            </ul>
          </div>

          <div className="bg-white border border-slate-200 rounded-md p-6 sm:p-8">
            <h3 className="text-lg font-medium text-slate-900 mb-3">
              Шаг 4. Активация
            </h3>
            <p className="text-slate-600 leading-relaxed">
              После нажатия кнопки сохранения бэкэнд автоматически запускает бота, и он моментально начинает обрабатывать входящие сообщения от реальных пользователей в режиме 24/7.
            </p>
          </div>
        </div>
      </section>

      {/* 3. Панель управления и мониторинг */}
      <section>
        <header className="mb-6 flex items-center gap-3">
          <Activity size={20} className="text-slate-500" />
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
            Панель управления и мониторинг
          </h2>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border border-slate-200 rounded-md p-6 flex flex-col h-full">
            <div className="flex items-center gap-2 mb-3">
              <MessageSquare size={16} className="text-slate-400" />
              <h3 className="text-base font-medium text-slate-900">
                Живые чаты
              </h3>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed flex-grow">
              Интерфейс, отображающий все текущие диалоги бота в реальном времени. Если клиент задает нестандартный или слишком сложный вопрос, оператор может в один клик перехватить управление и ответить человеку вручную прямо из панели.
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-md p-6 flex flex-col h-full">
            <div className="flex items-center gap-2 mb-3">
              <BookOpen size={16} className="text-slate-400" />
              <h3 className="text-base font-medium text-slate-900">
                Обновление знаний
              </h3>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed flex-grow">
              Раздел, позволяющий оперативно корректировать информацию. Если у компании изменились цены или адрес, пользователь просто редактирует текст в настройках, и бот мгновенно применяет новые данные в следующих диалогах.
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-md p-6 flex flex-col h-full">
            <div className="flex items-center gap-2 mb-3">
              <Activity size={16} className="text-slate-400" />
              <h3 className="text-base font-medium text-slate-900">
                Рассылки
              </h3>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed flex-grow">
              Инструмент для отправки массовых информационных или сервисных сообщений по списку контактов, которые ранее взаимодействовали с ботом.
            </p>
          </div>
        </div>
      </section>

    </div>
  );
}
