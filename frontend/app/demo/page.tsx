'use client';

import { useState } from 'react';
import Link from 'next/link';
import { API_URL } from '../config';
import { 
  Zap, Bot, ArrowRight, Check, 
  Send, RefreshCw, ArrowLeft, MessageSquare
} from 'lucide-react';

export default function DemoPage() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Form Fields
  const [companyName, setCompanyName] = useState('');
  const [platform, setPlatform] = useState<'whatsapp' | 'telegram' | 'instagram'>('telegram');
  const [language, setLanguage] = useState('ru');
  const [tone, setTone] = useState('friendly');
  const [description, setDescription] = useState('');

  // Simulator Chat State
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<{ sender: 'user' | 'bot'; text: string }[]>([]);
  const [chatLoading, setChatLoading] = useState(false);

  const resetPlayground = () => {
    setCompanyName('');
    setDescription('');
    setChatMessages([]);
    setStep(1);
  };

  const startChat = () => {
    setLoading(true);
    setTimeout(() => {
      let initialMsg = '';
      const company = companyName || 'UP-CHAT';
      
      if (language === 'en') {
        if (platform === 'whatsapp') {
          initialMsg = `Hello! Welcome to ${company}. How can I assist you today?`;
        } else if (platform === 'telegram') {
          initialMsg = `Welcome to the ${company} AI Assistant. Ask me anything!`;
        } else {
          initialMsg = `Hi! Thanks for contacting ${company} in Direct. How can I help?`;
        }
      } else if (language === 'kk') {
        if (platform === 'whatsapp') {
          initialMsg = `Сәлеметсіз бе! ${company} компаниясына қош келдіңіз. Бүгін сізге қалай көмектесе аламын?`;
        } else if (platform === 'telegram') {
          initialMsg = `${company} ИИ-ассистенті қосулы. Кез келген сұрағыңызды қойыңыз!`;
        } else {
          initialMsg = `Сәлем! ${company} парақшасына жазғаныңызға рахмет. Көмектесуге дайынмын!`;
        }
      } else {
        // Russian default
        if (platform === 'whatsapp') {
          initialMsg = `Здравствуйте! Вас приветствует ИИ-консультант компании ${company}. Чем я могу помочь вам сегодня?`;
        } else if (platform === 'telegram') {
          initialMsg = `Бот компании ${company} на связи. Задайте мне любой вопрос о наших услугах!`;
        } else {
          initialMsg = `Приветствуем в Direct ${company}! С радостью отвечу на все ваши вопросы.`;
        }
      }

      setChatMessages([{ sender: 'bot', text: initialMsg }]);
      setLoading(false);
      setStep(4);
    }, 1500);
  };

  const handleSendTestMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || chatLoading) return;

    const userText = chatInput.trim();
    setChatInput('');
    setChatMessages(prev => [...prev, { sender: 'user', text: userText }]);
    setChatLoading(true);

    try {
      const historyPayload = chatMessages.map(m => ({
        role: m.sender === 'user' ? 'user' : 'assistant',
        content: m.text
      }));

      const toneDesc = 
        tone === 'professional' ? 'Общайся строго профессионально, вежливо и по делу.' :
        tone === 'fun' ? 'Общайся весело, с юмором, дружелюбно, используй простые выражения.' :
        'Общайся дружелюбно, гостеприимно и открыто.';

      const systemPrompt = `
        Ты ИИ-консультант компании "${companyName || 'UP-CHAT'}".
        Сфера деятельности и правила:
        ${description || 'Компания предоставляет качественные услуги.'}
        
        Инструкции по стилю:
        - ${toneDesc}
        - Отвечай коротко, не пиши огромные абзацы.
        - Отвечай строго на том языке, на котором обращается пользователь (например, если пишут на казахском — отвечай на казахском, если на русском — на русском, если на английском — на английском).
        - НЕ используй маркеры форматирования markdown вроде двойных звездочек (**) для выделения текста жирным! Пиши обычным текстом без спецсимволов разметки.
        - Будь честен. Если информации о бизнесе нет в описании, вежливо ответь, что не владеешь этой информацией, и предложи клиенту оставить свои контакты (номер телефона), чтобы с ним связался менеджер.
      `;

      const response = await fetch(`${API_URL}/public-test-chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_prompt: systemPrompt,
          text: userText,
          history: historyPayload
        })
      });

      if (response.ok) {
        const data = await response.json();
        // Remove any double asterisks that the AI might have still generated
        const cleanReply = data.reply.replace(/\*\*/g, '');
        setChatMessages(prev => [...prev, { sender: 'bot', text: cleanReply }]);
      } else {
        setChatMessages(prev => [...prev, { sender: 'bot', text: 'Произошла ошибка соединения с сервером ИИ.' }]);
      }
    } catch (err) {
      console.error(err);
      setChatMessages(prev => [...prev, { sender: 'bot', text: 'Ошибка сети. Попробуйте еще раз.' }]);
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#07090e] text-[#f1f5f9] font-sans overflow-x-hidden relative flex flex-col justify-between selection:bg-teal-500 selection:text-black">
      
      {/* Background radial lines */}
      <div className="absolute top-[20%] left-[20%] w-[60%] h-[60%] bg-[radial-gradient(circle_at_center,rgba(20,184,166,0.05)_0,transparent_60%)] pointer-events-none" />

      {/* Styled Transition Animations */}
      <style jsx global>{`
        .step-transition {
          animation: slideIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(15px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .chat-bubble {
          animation: popBubble 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes popBubble {
          from { opacity: 0; transform: scale(0.95) translateY(5px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>

      {/* Header */}
      <header className="w-full border-b border-white/5 bg-[#07090e]/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6 h-20 flex justify-between items-center">
          <Link href="/landing" className="flex items-center gap-2 group">
            <div className="w-9 h-9 rounded-xl bg-slate-900 border border-white/10 flex items-center justify-center">
              <MessageSquare className="w-4 h-4 text-teal-400 font-bold" />
            </div>
            <span className="text-xl font-black tracking-tight text-white group-hover:text-teal-400 transition-colors">
              UP-CHAT
            </span>
          </Link>
          
          <Link href="/landing" className="text-sm font-semibold text-slate-400 hover:text-white flex items-center gap-1.5 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span>Вернуться на сайт</span>
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-6 py-12 flex flex-col justify-center items-center">
        
        {/* Progress Bar for Step 1-3 */}
        {step < 4 && (
          <div className="w-full max-w-md bg-white/5 h-1.5 rounded-full mb-12 overflow-hidden">
            <div 
              className="bg-teal-500 h-full transition-all duration-500" 
              style={{ width: `${(step / 3) * 100}%` }}
            />
          </div>
        )}

        {/* STEP 1: Company details and Platform */}
        {step === 1 && (
          <div className="w-full max-w-xl space-y-8 step-transition">
            <div className="text-center space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-teal-400">Шаг 1 из 3</span>
              <h1 className="text-3xl font-black text-white">Создадим личность бота</h1>
              <p className="text-slate-400 text-base">Укажите название вашего бизнеса и выберите основной канал связи.</p>
            </div>

            <div className="bg-slate-900/40 border border-white/5 p-8 rounded-3xl space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-300 uppercase tracking-wider block">Название компании</label>
                <input 
                  type="text" 
                  value={companyName}
                  onChange={e => setCompanyName(e.target.value)}
                  placeholder="Например: Салон красоты Aura или Доставка Пиццы"
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3.5 text-base text-white placeholder-slate-600 focus:border-teal-500 outline-none focus:ring-1 focus:ring-teal-500 transition-all font-medium"
                />
              </div>

              <div className="space-y-3">
                <label className="text-sm font-bold text-slate-300 uppercase tracking-wider block">Где будет общаться ИИ?</label>
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { id: 'telegram', label: 'Telegram', desc: 'Бот-помощник', disabled: false },
                    { id: 'whatsapp', label: 'WhatsApp', desc: 'На вашем номере', disabled: false },
                    { id: 'instagram', label: 'Instagram (coming soon)', desc: 'Интеграция Direct', disabled: true }
                  ].map(item => (
                    <button
                      key={item.id}
                      disabled={item.disabled}
                      onClick={() => !item.disabled && setPlatform(item.id as any)}
                      className={`p-4 rounded-2xl border text-left flex flex-col justify-between h-28 transition-all ${
                        item.disabled 
                          ? 'opacity-40 cursor-not-allowed border-white/5 bg-slate-950/5 text-slate-600'
                          : platform === item.id 
                            ? 'border-teal-500 bg-teal-500/5 text-white cursor-pointer' 
                            : 'border-white/5 bg-slate-950/20 text-slate-400 hover:border-white/10 cursor-pointer'
                      }`}
                    >
                      <span className="text-base font-bold text-white">{item.label}</span>
                      <span className="text-xs text-slate-500 leading-tight">{item.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              <button
                disabled={!companyName.trim()}
                onClick={() => setStep(2)}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-400 text-slate-950 font-extrabold text-base hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-teal-500/10"
              >
                <span>Продолжить</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Tone of voice */}
        {step === 2 && (
          <div className="w-full max-w-xl space-y-8 step-transition">
            <div className="text-center space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-teal-400">Шаг 2 из 3</span>
              <h1 className="text-3xl font-black text-white">Манера общения</h1>
              <p className="text-slate-400 text-base">Настройте стиль общения вашего ИИ-агента.</p>
            </div>

            <div className="bg-slate-900/40 border border-white/5 p-8 rounded-3xl space-y-6">
              <div className="space-y-3">
                <label className="text-sm font-bold text-slate-300 uppercase tracking-wider block">Тон диалога</label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: 'friendly', label: 'Дружелюбный', desc: 'Открытый, с теплотой' },
                    { id: 'professional', label: 'Деловой', desc: 'Вежливо, строго по сути' },
                    { id: 'fun', label: 'Свободный', desc: 'Легкий стиль, смайлики' }
                  ].map(t => (
                    <button
                      key={t.id}
                      onClick={() => setTone(t.id)}
                      className={`p-3 rounded-xl border text-left flex flex-col justify-between h-20 transition-all cursor-pointer ${
                        tone === t.id 
                          ? 'border-teal-500 bg-teal-500/5 text-white' 
                          : 'border-white/5 bg-slate-950/20 text-slate-400 hover:border-white/10'
                      }`}
                    >
                      <span className="text-sm font-bold text-white">{t.label}</span>
                      <span className="text-xs text-slate-500 leading-tight">{t.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 py-4 rounded-xl border border-white/10 text-slate-300 font-bold text-base hover:bg-white/5 transition-colors cursor-pointer"
                >
                  Назад
                </button>
                <button
                  onClick={() => setStep(3)}
                  className="flex-1 py-4 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-400 text-slate-950 font-extrabold text-base hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-teal-500/10"
                >
                  <span>Продолжить</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: Business Knowledge */}
        {step === 3 && (
          <div className="w-full max-w-xl space-y-8 step-transition">
            <div className="text-center space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-teal-400">Шаг 3 из 3</span>
              <h1 className="text-3xl font-black text-white">Чему обучить ИИ?</h1>
              <p className="text-slate-400 text-base">Опишите ваш продукт, цены, адрес или условия доставки.</p>
            </div>

            <div className="bg-slate-900/40 border border-white/5 p-8 rounded-3xl space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-300 uppercase tracking-wider block">Информация о компании</label>
                <textarea 
                  rows={5}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Например: Aura – салон маникюра на ул. Достык, 15. Маникюр с покрытием стоит 8000 тг. Работаем с 10:00 до 21:00 каждый день. Есть скидка 15% новым гостям."
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3.5 text-base text-white placeholder-slate-600 focus:border-teal-500 outline-none focus:ring-1 focus:ring-teal-500 transition-all font-medium"
                />
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setStep(2)}
                  className="flex-1 py-4 rounded-xl border border-white/10 text-slate-300 font-bold text-base hover:bg-white/5 transition-colors cursor-pointer"
                >
                  Назад
                </button>
                <button
                  disabled={!description.trim() || loading}
                  onClick={startChat}
                  className="flex-1 py-4 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-400 text-slate-950 font-extrabold text-base hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-teal-500/10 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Создаем ИИ...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 fill-slate-950/20" />
                      <span>Запустить симулятор</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: Beautiful Mobile Mockup & Interactive Journey Chat */}
        {step === 4 && (
          <div className="w-full max-w-2xl flex flex-col items-center gap-8 step-transition">
            
            <div className="text-center space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/20 text-xs font-semibold text-teal-400">
                <Check className="w-3.5 h-3.5" />
                <span>ИИ успешно обучен</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white">Проверьте бота в действии</h1>
              <p className="text-slate-400 text-sm sm:text-base">Напишите сообщение ниже, чтобы спросить о ценах, условиях или графике работы.</p>
            </div>

            {/* Mobile Phone Mockup */}
            <div className="w-full max-w-md bg-slate-950 border border-white/10 rounded-[40px] p-3 shadow-2xl relative overflow-hidden flex flex-col h-[520px]">
              
              {/* Camera Notch decoration */}
              <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-slate-950 w-28 h-5 rounded-full z-20 flex justify-center items-center">
                <div className="w-3.5 h-3.5 rounded-full bg-slate-900 border border-white/5" />
              </div>

              {/* Chat Simulator Interface */}
              <div className="flex flex-col h-full bg-slate-950 rounded-[32px] overflow-hidden pt-6">
                
                {/* Simulated Header */}
                <div className="px-5 py-4 border-b border-white/5 bg-slate-900/40 flex items-center justify-between z-10">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-teal-500 text-slate-950 font-bold rounded-full flex items-center justify-center text-sm shadow-md">
                      {companyName.slice(0, 2).toUpperCase() || 'AI'}
                    </div>
                    <div>
                      <div className="text-sm font-extrabold text-white leading-tight">{companyName || 'Мой ИИ-Бот'}</div>
                      <div className="text-[10px] text-teal-400 font-semibold flex items-center gap-1.5 mt-0.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
                        <span>в сети</span>
                      </div>
                    </div>
                  </div>

                  <button 
                    onClick={resetPlayground}
                    className="p-2 bg-white/5 hover:bg-white/10 rounded-xl transition-all text-slate-400 hover:text-white cursor-pointer"
                    title="Сбросить и настроить заново"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>

                {/* Messages Container with Larger Font */}
                <div className="flex-1 p-5 overflow-y-auto space-y-4 scrollbar-thin text-base sm:text-lg leading-relaxed">
                  {chatMessages.map((msg, index) => (
                    <div
                      key={index}
                      className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} chat-bubble`}
                    >
                      <div className={`max-w-[85%] rounded-2xl px-4 py-3 whitespace-pre-line ${
                        msg.sender === 'user'
                          ? 'bg-gradient-to-r from-teal-500 to-emerald-400 text-slate-950 font-bold'
                          : 'bg-slate-900 text-slate-200 border border-white/5'
                      }`}>
                        {msg.text}
                      </div>
                    </div>
                  ))}

                  {chatLoading && (
                    <div className="flex justify-start chat-bubble">
                      <div className="bg-slate-900 border border-white/5 rounded-2xl px-4 py-3.5 flex items-center gap-1">
                        <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-100" />
                        <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-200" />
                        <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-300" />
                      </div>
                    </div>
                  )}
                </div>

                {/* Connect now promotional overlay */}
                <div className="p-3 bg-slate-900/80 border-y border-white/5 flex items-center justify-between text-sm text-slate-300">
                  <span className="font-medium text-slate-400">Понравился результат?</span>
                  <Link 
                    href="/register" 
                    className="bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold px-3 py-2 rounded-xl transition-all cursor-pointer text-sm"
                  >
                    Запустить на номере
                  </Link>
                </div>

                {/* Chat Input form */}
                <form onSubmit={handleSendTestMessage} className="p-4 bg-slate-900/30 flex gap-2">
                  <input
                    type="text"
                    placeholder="Задайте вопрос ИИ..."
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                    disabled={chatLoading}
                    className="flex-1 bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-base text-white placeholder-slate-600 focus:border-teal-500 outline-none disabled:opacity-50 font-medium"
                  />
                  <button
                    type="submit"
                    disabled={chatLoading || !chatInput.trim()}
                    className="w-11 h-11 bg-teal-500 hover:bg-teal-400 text-slate-950 rounded-xl flex items-center justify-center disabled:opacity-40 transition-colors cursor-pointer shrink-0"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>

              </div>
            </div>

            {/* Back button */}
            <button
              onClick={() => setStep(3)}
              className="text-sm text-slate-500 hover:text-slate-400 flex items-center gap-1.5 transition-colors font-medium cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Редактировать описание</span>
            </button>
          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="w-full py-8 text-center text-sm text-slate-500 border-t border-white/5">
        <p>© 2026 UP-CHAT. Все права защищены.</p>
      </footer>

    </div>
  );
}
