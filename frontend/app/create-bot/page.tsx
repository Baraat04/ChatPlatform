'use client';

import { useState, useEffect, useRef } from 'react';
import { ArrowRight, ArrowLeft, Bot, Database, Key, MessageCircle, Phone, Plus, Trash2, CheckCircle2, ChevronDown, Check } from 'lucide-react';
import styles from './page.module.css';
import { io, Socket } from 'socket.io-client';
import { useLanguage } from '../contexts/LanguageContext';
import { API_URL, SOCKET_URL } from '../config';

const InstagramIcon = ({ size = 24, color = 'currentColor' }: { size?: number; color?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);

const TONES = [
  "Мотивирующий и энергичный",
  "Дружелюбный и тёплый",
  "Профессиональный и деловой",
  "Заботливый и внимательный",
  "Краткий и лаконичный",
  "Продающий"
];

const INDUSTRIES = [
  "Финансы",
  "Косметология",
  "Фитнес и спорт",
  "Образование",
  "Кафе и кофейни",
  "Ресторанный бизнес",
  "Автомобильный бизнес",
  "Туризм",
  "Отельный бизнес",
  "Розничная торговля",
  "IT и технологии"
];

const DATA_FIELDS = [
  "Имя клиента",
  "Номер телефона",
  "Бронирование",
  "Запись на консультацию",
  "Адрес",
  "Цель обращения",
  "Желаемые сроки",
  "Количество человек",
  "Город",
  "Предпочтения",
  "Прошлый опыт клиента"
];

function CustomSelect({ options, value, onChange, placeholder }: any) {
  const [isOpen, setIsOpen] = useState(false);
  const [customInput, setCustomInput] = useState('');
  const [isAddingCustom, setIsAddingCustom] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const addCustom = (e: any) => {
    e.preventDefault();
    if (customInput.trim()) {
      onChange(customInput.trim());
      setCustomInput('');
      setIsAddingCustom(false);
      setIsOpen(false);
    }
  };

  return (
    <div ref={ref} style={{ position: 'relative', width: '100%' }}>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        style={{ 
          background: 'var(--surface-container-lowest)', 
          border: isOpen ? '1px solid var(--primary)' : '1px solid var(--outline)', 
          borderRadius: 'var(--radius-DEFAULT)', 
          padding: '12px 16px', 
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          color: 'var(--on-surface)',
          transition: 'all 0.2s',
          boxShadow: isOpen ? '0 0 0 2px rgba(43, 108, 0, 0.1)' : 'none'
        }}
      >
        <span>{value || placeholder}</span>
        <ChevronDown size={18} style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }} />
      </div>
      
      {isOpen && (
        <div className="custom-select-dropdown">
          {options.map((opt: string) => (
            <div 
              key={opt}
              className={`custom-select-option ${value === opt ? 'selected' : ''}`}
              onClick={() => { onChange(opt); setIsOpen(false); }}
            >
              <span>{opt}</span>
              {value === opt && <Check size={16} />}
            </div>
          ))}

          {!isAddingCustom ? (
            <div 
              className="custom-select-option" 
              style={{ color: 'var(--primary)', fontWeight: '600', justifyContent: 'center', marginTop: '8px', borderTop: '1px solid var(--outline-variant)' }}
              onClick={() => setIsAddingCustom(true)}
            >
              <Plus size={16} style={{ marginRight: '8px' }}/> Свой вариант
            </div>
          ) : (
            <div style={{ padding: '12px', marginTop: '8px', borderTop: '1px solid var(--outline-variant)' }}>
              <form onSubmit={addCustom} style={{ display: 'flex', gap: '8px' }}>
                <input 
                  type="text" 
                  value={customInput} 
                  onChange={(e) => setCustomInput(e.target.value)} 
                  placeholder="Введите свой..." 
                  style={{ flex: 1, padding: '8px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--outline)', background: 'var(--surface-container-lowest)' }}
                  autoFocus
                />
                <button type="submit" style={{ padding: '8px 16px', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontWeight: '600' }}>OK</button>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function CustomMultiSelect({ options, value, onChange, placeholder }: any) {
  const [isOpen, setIsOpen] = useState(false);
  const [customInput, setCustomInput] = useState('');
  const [isAddingCustom, setIsAddingCustom] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleOption = (opt: string) => {
    if (value.includes(opt)) {
      onChange(value.filter((v: string) => v !== opt));
    } else {
      onChange([...value, opt]);
    }
  };

  const addCustom = (e: any) => {
    e.preventDefault();
    if (customInput.trim() && !value.includes(customInput.trim())) {
      onChange([...value, customInput.trim()]);
      setCustomInput('');
      setIsAddingCustom(false);
    }
  };

  return (
    <div ref={ref} style={{ position: 'relative', width: '100%' }}>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        style={{ 
          background: 'var(--surface-container-lowest)', 
          border: isOpen ? '1px solid var(--primary)' : '1px solid var(--outline)', 
          borderRadius: 'var(--radius-DEFAULT)', 
          padding: '12px 16px', 
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          color: 'var(--on-surface)',
          transition: 'all 0.2s',
          boxShadow: isOpen ? '0 0 0 2px rgba(43, 108, 0, 0.1)' : 'none'
        }}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: '8px' }}>
          {value.length > 0 ? value.join(', ') : placeholder}
        </span>
        <ChevronDown size={18} style={{ flexShrink: 0, transform: isOpen ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }} />
      </div>
      
      {isOpen && (
        <div className="custom-select-dropdown" style={{ maxHeight: '300px' }}>
          {options.map((opt: string) => (
            <label key={opt} className="custom-select-option" style={{ display: 'flex', justifyContent: 'flex-start', gap: '12px' }}>
              <input 
                type="checkbox" 
                checked={value.includes(opt)} 
                onChange={() => toggleOption(opt)} 
                style={{ width: '18px', height: '18px', accentColor: 'var(--primary)', cursor: 'pointer' }}
              />
              <span style={{ cursor: 'pointer', userSelect: 'none' }}>{opt}</span>
            </label>
          ))}
          
          {value.filter((v: string) => !options.includes(v)).map((opt: string) => (
            <label key={opt} className="custom-select-option" style={{ display: 'flex', justifyContent: 'flex-start', gap: '12px' }}>
              <input 
                type="checkbox" 
                checked={true} 
                onChange={() => toggleOption(opt)} 
                style={{ width: '18px', height: '18px', accentColor: 'var(--primary)', cursor: 'pointer' }}
              />
              <span style={{ cursor: 'pointer', userSelect: 'none' }}>{opt} (Свой вариант)</span>
            </label>
          ))}
          
          {!isAddingCustom ? (
            <div 
              className="custom-select-option" 
              style={{ color: 'var(--primary)', fontWeight: '600', justifyContent: 'center', marginTop: '8px', borderTop: '1px solid var(--outline-variant)' }}
              onClick={() => setIsAddingCustom(true)}
            >
              <Plus size={16} style={{ marginRight: '8px' }}/> Добавить своё
            </div>
          ) : (
            <div style={{ padding: '12px', marginTop: '8px', borderTop: '1px solid var(--outline-variant)' }}>
              <form onSubmit={addCustom} style={{ display: 'flex', gap: '8px' }}>
                <input 
                  type="text" 
                  value={customInput} 
                  onChange={(e) => setCustomInput(e.target.value)} 
                  placeholder="Введите свой вариант..." 
                  style={{ flex: 1, padding: '8px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--outline)', background: 'var(--surface-container-lowest)' }}
                  autoFocus
                />
                <button type="submit" style={{ padding: '8px 16px', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontWeight: '600' }}>OK</button>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function CreateBot() {
  const { t } = useLanguage();
  const [currentStep, setCurrentStep] = useState(1);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Step 1
  const [industry, setIndustry] = useState('Финансы');
  const [companyName, setCompanyName] = useState('');
  const [botGoal, setBotGoal] = useState('Консультировать клиентов');
  const [tone, setTone] = useState('Дружелюбный и тёплый');
  
  const [rules, setRules] = useState({
    onlyKnowledgeBase: true,
    noFabrication: true,
    userLanguage: true,
    leadToRequest: false
  });

  const [isManualSystemPrompt, setIsManualSystemPrompt] = useState(false);
  const [systemPrompt, setSystemPrompt] = useState('');

  // Step 2
  const [businessInfo, setBusinessInfo] = useState('');
  const [isUploadingPdf, setIsUploadingPdf] = useState(false);

  // Reset form on mount
  useEffect(() => {
    setIndustry('Финансы');
    setCompanyName('');
    setBotGoal('Консультировать клиентов');
    setTone('Дружелюбный и тёплый');
    setRules({ onlyKnowledgeBase: true, noFabrication: true, userLanguage: true, leadToRequest: false });
    setIsManualSystemPrompt(false);
    setSystemPrompt('');
    setBusinessInfo('');
  }, []);

  useEffect(() => {
    if (!isManualSystemPrompt) {
      let rulesText = '';
      if (rules.onlyKnowledgeBase) rulesText += `- ${t.onlyKb}.\n`;
      if (rules.noFabrication) rulesText += `- ${t.noFabrication}.\n`;
      if (rules.userLanguage) rulesText += `- ${t.userLanguage}.\n`;
      rulesText += '- Общайся естественно и профессионально.\n';
      if (rules.leadToRequest) rulesText += `- ${t.leadToRequest}.\n`;

      const generated = `Ты AI-консультант: ${companyName || '[Имя / Роль]'}.

Сфера деятельности: ${industry}

Твоя основная задача и инструкции:
${botGoal || '[Описание задачи]'}

Стиль общения:
${tone}

Основные правила:
${rulesText}`;
      setSystemPrompt(generated);
    }
  }, [industry, companyName, botGoal, tone, rules, isManualSystemPrompt]);

  const generateDataPrompt = () => {
    return `Компания:
${companyName}

База знаний (Произвольная информация):
${businessInfo}`;
  };

  const dataPrompt = generateDataPrompt();

  async function handlePdfUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== 'application/pdf') {
      alert("Пожалуйста, выберите PDF файл.");
      return;
    }
    setIsUploadingPdf(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetch(`${API_URL}/bot/0/upload-pdf`, {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });
      const data = await res.json();
      if (data.text) {
        const appendedData = `\n\n--- ДАННЫЕ ИЗ PDF (${file.name}) ---\n${data.text}`;
        setBusinessInfo(prev => prev + appendedData);
      } else {
        alert("Не удалось извлечь текст из PDF.");
      }
    } catch (err) {
      console.error(err);
      alert("Ошибка при загрузке PDF.");
    } finally {
      setIsUploadingPdf(false);
      e.target.value = '';
    }
  }

  // Step 3
  const [platform, setPlatform] = useState<'TELEGRAM' | 'WHATSAPP' | 'INSTAGRAM'>('TELEGRAM');
  const [botToken, setBotToken] = useState('');

  // Step 4
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [waStatus, setWaStatus] = useState<string | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);

  // Test Chat
  const [createdBotId, setCreatedBotId] = useState<number | null>(null);
  const [testChatOpen, setTestChatOpen] = useState(false);
  const [testMessages, setTestMessages] = useState<{role: 'user'|'assistant', content: string}[]>([]);
  const [testInput, setTestInput] = useState('');
  const [isTestLoading, setIsTestLoading] = useState(false);

  const handleTestSend = async () => {
    if (!testInput.trim() || !createdBotId) return;
    const userText = testInput.trim();
    const newHistory = [...testMessages, { role: 'user' as const, content: userText }];
    setTestMessages(newHistory);
    setTestInput('');
    setIsTestLoading(true);

    try {
      const res = await fetch(`${API_URL}/bot/${createdBotId}/agent-chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ text: userText, history: testMessages })
      });
      const data = await res.json();
      setTestMessages([...newHistory, { role: 'assistant', content: data.reply || "Ошибка" }]);
    } catch (e) {
      setTestMessages([...newHistory, { role: 'assistant', content: "Не удалось получить ответ" }]);
    } finally {
      setIsTestLoading(false);
    }
  };

  useEffect(() => {
    const newSocket = io(SOCKET_URL);
    setSocket(newSocket);
    return () => { newSocket.disconnect(); }
  }, []);

  const handleSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setMessage(null);
    setQrCode(null);
    setWaStatus(null);
    
    try {
      const response = await fetch(`${API_URL}/bot`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          system_prompt: systemPrompt,
          data_prompt: dataPrompt,
          apiToken: (platform === 'TELEGRAM' || platform === 'INSTAGRAM') ? botToken : undefined,
          platform: platform
        }),
      });

      const text = await response.text();
      let data: any;
      try { data = JSON.parse(text); } catch {
        setMessage({ type: 'error', text: `Ошибка сервера: ${text.slice(0, 300)}` });
        return;
      }

      if (response.ok) {
        if (platform === 'TELEGRAM' || platform === 'INSTAGRAM') {
          setMessage({ type: 'success', text: `✅ ${platform === 'TELEGRAM' ? 'Telegram' : 'Instagram'} бот успешно создан!` });
          setCreatedBotId(data.id);
          setTestChatOpen(true);
        } else {
          setMessage({ type: 'success', text: '⏳ Генерируем QR-код WhatsApp...' });
          const botId = data.id;
          if (socket) {
            socket.on(`qr-${botId}`, (qrDataUrl) => {
              setQrCode(qrDataUrl);
              setMessage({ type: 'success', text: '📷 Отсканируйте этот QR-код в WhatsApp -> Связанные устройства' });
            });
            socket.on(`status-${botId}`, (status) => {
              if (status === 'connected') {
                setWaStatus('✅ Подключено к WhatsApp!');
                setQrCode(null);
                setMessage({ type: 'success', text: '✅ WhatsApp бот теперь активен и готов к работе!' });
              } else if (status === 'logged_out') {
                setWaStatus('❌ Отключено');
              }
            });
          }
        }
      } else {
        setMessage({ type: 'error', text: `❌ ${data.error || data.details || 'Не удалось создать бота'}` });
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: '❌ Не удалось подключиться к бекенду.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextStep = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentStep(p => Math.min(p + 1, 4));
      setIsTransitioning(false);
    }, 300);
  };
  
  const prevStep = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentStep(p => Math.max(p - 1, 1));
      setIsTransitioning(false);
    }, 300);
  };

  const renderStepsIndicator = () => (
    <div style={{ overflowX: 'auto', marginBottom: '32px', WebkitOverflowScrolling: 'touch' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative', minWidth: '260px' }}>
        {[1, 2, 3, 4].map(step => (
          <div key={step} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 1, flex: 1 }}>
            <div style={{
              width: '32px', height: '32px', borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: step === currentStep ? 'var(--primary)' : step < currentStep ? 'var(--primary-fixed)' : 'var(--surface-container-high)',
              color: step <= currentStep ? 'var(--on-primary)' : 'var(--on-surface-variant)', 
              fontWeight: 'bold', fontSize: '14px',
              border: `2px solid ${step <= currentStep ? 'transparent' : 'var(--outline-variant)'}`,
              transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: step === currentStep ? '0 0 15px var(--primary-fixed-dim)' : 'none',
              flexShrink: 0,
            }} className={step === currentStep ? 'ai-pulse' : ''}>
              {step < currentStep ? <CheckCircle2 size={16} /> : step}
            </div>
            <span style={{ fontSize: '12px', marginTop: '8px', color: step <= currentStep ? 'var(--primary)' : 'var(--on-surface-variant)', fontWeight: step <= currentStep ? '600' : '400', transition: 'all 0.3s', whiteSpace: 'nowrap' }}>
              {step === 1 && t.behavior}
              {step === 2 && t.dataBase}
              {step === 3 && t.platform}
              {step === 4 && 'Предпросмотр'}
            </span>
          </div>
        ))}
        <div style={{ position: 'absolute', top: '16px', left: '12%', right: '12%', height: '2px', background: 'var(--surface-container-high)', zIndex: 0 }}>
          <div style={{ height: '100%', background: 'var(--primary)', width: `${((currentStep - 1) / 3) * 100}%`, transition: 'width 0.5s cubic-bezier(0.4, 0, 0.2, 1)' }} />
        </div>
      </div>
    </div>
  );

  return (
    <div className={styles.container}>
      <style>{`
        @keyframes slideUpFade {
          0% { opacity: 0; transform: translateY(20px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulseGlow {
          0% { box-shadow: 0 0 0 0 rgba(43, 108, 0, 0.4); }
          70% { box-shadow: 0 0 0 10px rgba(43, 108, 0, 0); }
          100% { box-shadow: 0 0 0 0 rgba(43, 108, 0, 0); }
        }
        .ai-animated {
          animation: slideUpFade 0.5s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
        }
        .ai-transition-out {
          opacity: 0;
          transform: translateY(-20px);
          transition: all 0.3s cubic-bezier(0.4, 0, 1, 1);
        }
        .ai-pulse {
          animation: pulseGlow 2s infinite;
        }
        .custom-select-dropdown {
          position: absolute;
          top: calc(100% + 8px);
          left: 0; right: 0;
          background: var(--surface-container-lowest);
          border: 1px solid var(--outline-variant);
          border-radius: var(--radius-md);
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
          z-index: 50;
          max-height: 250px;
          overflow-y: auto;
          padding: 8px;
          animation: slideUpFade 0.2s ease-out;
        }
        .custom-select-option {
          padding: 10px 12px;
          border-radius: var(--radius-sm);
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: space-between;
          color: var(--on-surface);
        }
        .custom-select-option:hover {
          background: var(--surface-container-high);
        }
        .custom-select-option.selected {
          background: var(--primary-container);
          color: var(--primary);
          font-weight: 600;
        }
      `}</style>
      
      <div className={`${styles.header} ai-animated`}>
        <h2 className={styles.title} style={{ color: 'var(--on-surface)', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Bot size={32} color="var(--primary)" /> {t.navCreateBot}
        </h2>
        <p className={styles.subtitle} style={{ color: 'var(--on-surface-variant)' }}>{t.configBotSub}</p>
      </div>

      <div className="ai-animated" style={{ animationDelay: '0.1s' }}>
        {renderStepsIndicator()}
      </div>

      {message && (
        <div className="ai-animated" style={{
          padding: '16px', borderRadius: 'var(--radius-md)', marginBottom: '24px',
          background: message.type === 'success' ? 'var(--primary-container)' : 'var(--error-container)',
          border: `1px solid ${message.type === 'success' ? 'var(--primary)' : 'var(--error)'}`,
          color: message.type === 'success' ? 'var(--on-primary-container)' : 'var(--on-error-container)', 
          fontSize: '15px', fontWeight: '500'
        }}>
          {message.text}
        </div>
      )}

      {qrCode && (
        <div className="ai-animated" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '24px', padding: '24px', background: 'var(--surface-container-lowest)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--outline-variant)' }}>
          <h3 style={{ color: 'var(--on-surface)', marginBottom: '16px', fontSize: '18px', fontWeight: '600' }}>Отсканируйте код в WhatsApp</h3>
          <img src={qrCode} alt="WhatsApp QR Code" style={{ width: '100%', maxWidth: '250px', height: 'auto', borderRadius: 'var(--radius-md)', border: '1px solid var(--outline-variant)' }} />
        </div>
      )}
      
      {waStatus && (
        <div className="ai-animated" style={{ textAlign: 'center', marginBottom: '24px', color: 'var(--primary)', fontWeight: 'bold', fontSize: '16px' }}>
          {waStatus}
        </div>
      )}

      {(!qrCode && !waStatus) && (
      <div className={`${styles.card} ${isTransitioning ? 'ai-transition-out' : 'ai-animated'}`} style={{ background: 'var(--surface-container-lowest)', border: '1px solid var(--outline-variant)', animationDelay: '0.2s' }}>
        {currentStep === 1 && (
          <div className={styles.formGrid}>
            <div className={`${styles.formGroup} ${styles.colSpan12}`}>
              <h3 style={{ fontSize: '20px', fontWeight: '700', color: 'var(--on-surface)', marginBottom: '16px' }}>Шаг 1. {t.behavior}</h3>
            </div>
            
            <div className={`${styles.formGroup} ${styles.colSpan12}`} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 250px), 1fr))', gap: '16px' }}>
              <div>
                <label className={styles.label} style={{ color: 'var(--on-surface)' }}>{t.industry}</label>
                <CustomSelect 
                  options={INDUSTRIES} 
                  value={industry} 
                  onChange={setIndustry} 
                  placeholder="..."
                />
              </div>
              <div>
                <label className={styles.label} style={{ color: 'var(--on-surface)' }}>{t.companyName}</label>
                <input className={styles.input} type="text" value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="..." />
              </div>
            </div>

            <div className={`${styles.formGroup} ${styles.colSpan12}`}>
              <label className={styles.label} style={{ color: 'var(--on-surface)' }}>Основная задача и описание (Твоя роль)</label>
              <textarea className={styles.input} rows={4} value={botGoal} onChange={e => setBotGoal(e.target.value)} placeholder="Пример: Твоя задача консультировать клиентов по нашим услугам и собирать их контакты." />
            </div>
            
            <div className={`${styles.formGroup} ${styles.colSpan12}`} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 250px), 1fr))', gap: '16px' }}>
              <div>
                <label className={styles.label} style={{ color: 'var(--on-surface)' }}>{t.tone}</label>
                <CustomSelect 
                  options={TONES} 
                  value={tone} 
                  onChange={setTone} 
                  placeholder="..."
                />
              </div>
            </div>

            <div className={`${styles.formGroup} ${styles.colSpan12}`}>
              <label className={styles.label} style={{ color: 'var(--on-surface)' }}>{t.additionalRules}</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '8px', padding: '16px', background: 'var(--surface-container)', borderRadius: 'var(--radius-md)' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: 'var(--on-surface)', fontWeight: '500' }}>
                  <input type="checkbox" checked={rules.onlyKnowledgeBase} onChange={e => setRules({...rules, onlyKnowledgeBase: e.target.checked})} style={{ width: '18px', height: '18px', accentColor: 'var(--primary)' }} />
                  {t.onlyKb}
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: 'var(--on-surface)', fontWeight: '500' }}>
                  <input type="checkbox" checked={rules.noFabrication} onChange={e => setRules({...rules, noFabrication: e.target.checked})} style={{ width: '18px', height: '18px', accentColor: 'var(--primary)' }} />
                  {t.noFabrication}
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: 'var(--on-surface)', fontWeight: '500' }}>
                  <input type="checkbox" checked={rules.userLanguage} onChange={e => setRules({...rules, userLanguage: e.target.checked})} style={{ width: '18px', height: '18px', accentColor: 'var(--primary)' }} />
                  {t.userLanguage}
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: 'var(--on-surface)', fontWeight: '500' }}>
                  <input type="checkbox" checked={rules.leadToRequest} onChange={e => setRules({...rules, leadToRequest: e.target.checked})} style={{ width: '18px', height: '18px', accentColor: 'var(--primary)' }} />
                  {t.leadToRequest}
                </label>
              </div>
            </div>

            <div className={`${styles.formGroup} ${styles.colSpan12}`} style={{ borderTop: '1px solid var(--outline-variant)', paddingTop: '24px', marginTop: '16px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: 'var(--on-surface)', fontWeight: '600' }}>
                <input type="checkbox" checked={isManualSystemPrompt} onChange={e => setIsManualSystemPrompt(e.target.checked)} style={{ width: '18px', height: '18px', accentColor: 'var(--primary)' }} />
                Редактировать инструкции вручную
              </label>
              
              {isManualSystemPrompt && (
                <div style={{ marginTop: '16px' }} className="ai-animated">
                  <textarea className={styles.input} rows={12} value={systemPrompt} onChange={e => setSystemPrompt(e.target.value)} style={{ resize: 'vertical', fontFamily: 'monospace', background: 'var(--surface-container-low)', color: 'var(--on-surface)', border: '1px solid var(--outline)' }} />
                </div>
              )}
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className={styles.formGrid}>
            <div className={`${styles.formGroup} ${styles.colSpan12}`}>
              <h3 style={{ fontSize: '20px', fontWeight: '700', color: 'var(--on-surface)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Database size={24} color="var(--primary)" /> 📚 {t.dataBase}
              </h3>
              <p style={{ color: 'var(--on-surface-variant)', fontSize: '15px', marginBottom: '24px', lineHeight: '1.5' }}>
                {t.dataBaseDesc}
              </p>
            </div>

            <div className={`${styles.formGroup} ${styles.colSpan12}`}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <label className={styles.label} style={{ color: 'var(--on-surface)', margin: 0 }}>Произвольная информация (База знаний)</label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: 'var(--primary)', fontWeight: '600', padding: '8px 16px', background: 'var(--primary-container)', borderRadius: 'var(--radius-md)' }}>
                  <Plus size={16} /> Загрузить PDF
                  <input type="file" accept="application/pdf" style={{ display: 'none' }} onChange={handlePdfUpload} disabled={isUploadingPdf} />
                </label>
              </div>
              {isUploadingPdf && <div style={{ color: 'var(--primary)', fontSize: '14px', marginBottom: '8px' }}>⏳ Извлекаем текст из PDF...</div>}
              <textarea className={styles.input} rows={12} value={businessInfo} onChange={e => setBusinessInfo(e.target.value)} placeholder="Скопируйте сюда любую информацию о компании, ценах, услугах, FAQ..." style={{ background: 'var(--surface-container-low)', color: 'var(--on-surface)' }} />
              <p style={{ color: 'var(--on-surface-variant)', fontSize: '13px', marginTop: '8px' }}>Пишите в свободном формате, искусственный интеллект сам все поймет.</p>
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div className={styles.formGrid}>
            <div className={`${styles.formGroup} ${styles.colSpan12}`}>
              <h3 style={{ fontSize: '20px', fontWeight: '700', color: 'var(--on-surface)', marginBottom: '16px' }}>Шаг 3. {t.platform}</h3>
            </div>

            <div className={`${styles.formGroup} ${styles.colSpan12}`}>
              <label className={styles.label} style={{ color: 'var(--on-surface)', fontSize: '16px', marginBottom: '16px' }}>
                <span>{t.platform}</span>
              </label>
              <div style={{ display: 'flex', gap: '16px' }}>
                <button 
                  type="button" 
                  onClick={() => setPlatform('TELEGRAM')}
                  style={{ flex: 1, padding: '24px 16px', borderRadius: 'var(--radius-lg)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px', border: platform === 'TELEGRAM' ? '2px solid #3b82f6' : '1px solid var(--outline)', background: platform === 'TELEGRAM' ? 'rgba(59,130,246,0.1)' : 'var(--surface-container-lowest)', color: 'var(--on-surface)', cursor: 'pointer', transition: 'all 0.2s', boxShadow: platform === 'TELEGRAM' ? '0 4px 12px rgba(59,130,246,0.15)' : 'none' }}>
                  <MessageCircle size={32} color={platform === 'TELEGRAM' ? '#3b82f6' : 'var(--outline)'} /> 
                  <span style={{ fontWeight: '600', fontSize: '16px' }}>Telegram</span>
                </button>
                <button 
                  type="button" 
                  onClick={() => setPlatform('WHATSAPP')}
                  style={{ flex: 1, padding: '24px 16px', borderRadius: 'var(--radius-lg)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px', border: platform === 'WHATSAPP' ? '2px solid #22c55e' : '1px solid var(--outline)', background: platform === 'WHATSAPP' ? 'rgba(34,197,94,0.1)' : 'var(--surface-container-lowest)', color: 'var(--on-surface)', cursor: 'pointer', transition: 'all 0.2s', boxShadow: platform === 'WHATSAPP' ? '0 4px 12px rgba(34,197,94,0.15)' : 'none' }}>
                  <Phone size={32} color={platform === 'WHATSAPP' ? '#22c55e' : 'var(--outline)'} /> 
                  <span style={{ fontWeight: '600', fontSize: '16px' }}>WhatsApp</span>
                </button>
                <button 
                  type="button" 
                  onClick={() => setPlatform('INSTAGRAM')}
                  style={{ flex: 1, padding: '24px 16px', borderRadius: 'var(--radius-lg)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px', border: platform === 'INSTAGRAM' ? '2px solid #e1306c' : '1px solid var(--outline)', background: platform === 'INSTAGRAM' ? 'rgba(225,48,108,0.1)' : 'var(--surface-container-lowest)', color: 'var(--on-surface)', cursor: 'pointer', transition: 'all 0.2s', boxShadow: platform === 'INSTAGRAM' ? '0 4px 12px rgba(225,48,108,0.15)' : 'none' }}>
                  <InstagramIcon size={32} color={platform === 'INSTAGRAM' ? '#e1306c' : 'var(--outline)'} /> 
                  <span style={{ fontWeight: '600', fontSize: '16px' }}>Instagram</span>
                </button>
              </div>
            </div>

            {platform === 'TELEGRAM' && (
              <div className={`ai-animated ${styles.formGroup} ${styles.colSpan12}`} style={{ marginTop: '16px', padding: '20px', background: 'var(--surface-container)', borderRadius: 'var(--radius-lg)' }}>
                <label className={styles.label} htmlFor="botToken" style={{ color: 'var(--on-surface)' }}>
                  <span>{t.telegramToken}</span>
                  <span style={{ color: '#ef4444', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px' }}><Key size={16} /> {t.required}</span>
                </label>
                <input className={styles.input} id="botToken"
                  placeholder="1234567890:ABCDefGhIjKlMnOpQrStUvWxYz"
                  type="text" value={botToken}
                  onChange={(e) => setBotToken(e.target.value)} required style={{ border: '1px solid var(--outline)' }} />
                <div style={{ padding: '16px', background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.3)', borderRadius: 'var(--radius-md)', marginTop: '16px', color: 'var(--on-surface)', fontSize: '14px', lineHeight: '1.6' }}>
                  <h4 style={{ margin: '0 0 12px 0', color: '#3b82f6', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <MessageCircle size={18} /> Как получить токен в Telegram:
                  </h4>
                  <ol style={{ margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <li>Откройте Telegram и найдите официального бота <strong>@BotFather</strong></li>
                    <li>Нажмите <strong>Start</strong> или отправьте команду <code>/newbot</code></li>
                    <li>Введите имя для вашего бота (например, "Мой Консультант")</li>
                    <li>Введите уникальное системное имя (должно заканчиваться на "bot", например "MyAI_bot")</li>
                    <li>BotFather пришлет вам сообщение с токеном (длинная строка символов)</li>
                    <li>Скопируйте и вставьте этот токен в поле выше</li>
                  </ol>
                </div>
              </div>
            )}

            {platform === 'INSTAGRAM' && (
              <div className={`ai-animated ${styles.formGroup} ${styles.colSpan12}`} style={{ marginTop: '16px', padding: '20px', background: 'var(--surface-container)', borderRadius: 'var(--radius-lg)' }}>
                <label className={styles.label} htmlFor="botToken" style={{ color: 'var(--on-surface)' }}>
                  <span>Instagram API Token (Page Access Token)</span>
                  <span style={{ color: '#ef4444', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px' }}><Key size={16} /> {t.required}</span>
                </label>
                <input className={styles.input} id="botToken"
                  placeholder="EAAB..."
                  type="text" value={botToken}
                  onChange={(e) => setBotToken(e.target.value)} required style={{ border: '1px solid var(--outline)' }} />
                <div style={{ padding: '16px', background: 'rgba(225,48,108,0.1)', border: '1px solid rgba(225,48,108,0.3)', borderRadius: 'var(--radius-md)', marginTop: '16px', color: 'var(--on-surface)', fontSize: '14px', lineHeight: '1.6' }}>
                  <h4 style={{ margin: '0 0 12px 0', color: '#e1306c', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <InstagramIcon size={18} /> Как подключить Instagram:
                  </h4>
                  <ol style={{ margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <li>Откройте <strong>Meta for Developers</strong> и создайте приложение типа "Business"</li>
                    <li>Подключите продукт <strong>Instagram Graph API</strong></li>
                    <li>В настройках сгенерируйте <strong>Маркер доступа страницы (Page Access Token)</strong> и вставьте его выше</li>
                    <li>Вам также понадобится настроить Webhook в Meta, используя адрес этого сервера</li>
                  </ol>
                </div>
              </div>
            )}
            
            {platform === 'WHATSAPP' && (
              <div className={`ai-animated ${styles.formGroup} ${styles.colSpan12}`} style={{ marginTop: '16px' }}>
                <div style={{ padding: '20px', borderRadius: 'var(--radius-lg)', background: 'var(--primary-container)', border: '1px solid var(--primary)', color: 'var(--on-surface)' }}>
                  <p style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', fontWeight: '600', fontSize: '16px', color: 'var(--primary)' }}>
                    <CheckCircle2 size={20} /> WhatsApp выбран
                  </p>
                  <p style={{ fontSize: '15px', color: 'var(--on-surface-variant)', lineHeight: '1.5' }}>
                    Токен не требуется. После создания бота появится QR-код для сканирования с телефона в приложении WhatsApp (Раздел "Связанные устройства").
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {currentStep === 4 && (
          <div className={styles.formGrid}>
            <div className={`${styles.formGroup} ${styles.colSpan12}`}>
              <h3 style={{ fontSize: '20px', fontWeight: '700', color: 'var(--on-surface)', marginBottom: '16px' }}>Шаг 4. Предпросмотр</h3>
            </div>

            <div className={`${styles.formGroup} ${styles.colSpan12}`}>
              <label className={styles.label} style={{ color: 'var(--on-surface)' }}>Платформа</label>
              <div style={{ padding: '16px', background: 'var(--surface-container)', borderRadius: 'var(--radius-md)', border: '1px solid var(--outline-variant)', color: 'var(--on-surface)', display: 'flex', alignItems: 'center', gap: '12px', fontWeight: '600', fontSize: '16px' }}>
                {platform === 'TELEGRAM' ? <MessageCircle size={24} color="#3b82f6" /> : platform === 'WHATSAPP' ? <Phone size={24} color="#22c55e" /> : <InstagramIcon size={24} color="#e1306c" />}
                {platform === 'TELEGRAM' ? 'Telegram' : platform === 'WHATSAPP' ? 'WhatsApp' : 'Instagram'}
              </div>
            </div>

            <div className={`${styles.formGroup} ${styles.colSpan12}`}>
              <label className={styles.label} style={{ color: 'var(--on-surface)' }}>{t.sysPromptFull}</label>
              <pre style={{ padding: '20px', background: 'var(--surface-container-low)', borderRadius: 'var(--radius-md)', border: '1px solid var(--outline)', color: 'var(--on-surface)', whiteSpace: 'pre-wrap', wordBreak: 'break-word', overflowWrap: 'break-word', fontSize: '14px', fontFamily: 'monospace', lineHeight: '1.6', maxWidth: '100%', overflow: 'hidden' }}>
                {systemPrompt}
              </pre>
            </div>

            <div className={`${styles.formGroup} ${styles.colSpan12}`}>
              <label className={styles.label} style={{ color: 'var(--on-surface)' }}>{t.dataPromptFull}</label>
              <pre style={{ padding: '20px', background: 'var(--surface-container-low)', borderRadius: 'var(--radius-md)', border: '1px solid var(--outline)', color: 'var(--on-surface)', whiteSpace: 'pre-wrap', wordBreak: 'break-word', overflowWrap: 'break-word', fontSize: '14px', fontFamily: 'monospace', lineHeight: '1.6', maxWidth: '100%', overflow: 'hidden' }}>
                {dataPrompt}
              </pre>
            </div>
          </div>
        )}

        <div className={styles.actionArea} style={{ marginTop: '32px', paddingTop: '24px', borderTop: '1px solid var(--outline-variant)', display: 'flex', justifyContent: 'space-between' }}>
          {currentStep > 1 ? (
            <button type="button" className={styles.btnDiscard} onClick={prevStep} style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--on-surface-variant)', fontWeight: '600' }}>
              <ArrowLeft size={18} /> Назад
            </button>
          ) : (
            <div></div> 
          )}
          
          {currentStep < 4 ? (
            <button type="button" className={styles.btnPrimary} onClick={nextStep} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--primary)', color: 'var(--on-primary)', padding: '12px 24px', borderRadius: 'var(--radius-md)', fontWeight: '600', fontSize: '15px' }}>
              Далее <ArrowRight size={18} />
            </button>
          ) : (
            <button type="button" className={styles.btnPrimary} onClick={handleSubmit} disabled={isSubmitting || ((platform === 'TELEGRAM' || platform === 'INSTAGRAM') && !botToken)} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--primary)', color: 'var(--on-primary)', padding: '12px 24px', borderRadius: 'var(--radius-md)', fontWeight: '600', fontSize: '15px', border: 'none', cursor: (isSubmitting || ((platform === 'TELEGRAM' || platform === 'INSTAGRAM') && !botToken)) ? 'not-allowed' : 'pointer', opacity: (isSubmitting || ((platform === 'TELEGRAM' || platform === 'INSTAGRAM') && !botToken)) ? 0.7 : 1 }}>
              {isSubmitting ? 'Создание...' : 'Создать бота'} <Bot size={18} />
            </button>
          )}
        </div>
      </div>
      )}

      {testChatOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
          <div className="ai-animated" style={{ background: 'var(--surface)', width: '90%', maxWidth: '400px', height: '600px', maxHeight: '90vh', borderRadius: 'var(--radius-lg)', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.3)', border: '1px solid var(--outline-variant)' }}>
            <div style={{ padding: '16px', background: 'var(--primary)', color: 'var(--on-primary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}><Bot size={20} /> Тест бота</div>
              <button onClick={() => setTestChatOpen(false)} style={{ color: 'var(--on-primary)', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <div style={{ flex: 1, padding: '16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', background: 'var(--background)' }}>
              {testMessages.length === 0 && <div style={{ textAlign: 'center', color: 'var(--on-surface-variant)', marginTop: '40px', fontSize: '15px' }}>Напишите что-нибудь, чтобы проверить ответы бота ✨</div>}
              {testMessages.map((msg, i) => (
                <div key={i} style={{ alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start', background: msg.role === 'user' ? 'var(--primary-container)' : 'var(--surface-container)', color: msg.role === 'user' ? 'var(--on-primary-container)' : 'var(--on-surface)', padding: '12px 16px', borderRadius: '16px', borderBottomRightRadius: msg.role === 'user' ? '4px' : '16px', borderBottomLeftRadius: msg.role !== 'user' ? '4px' : '16px', maxWidth: '85%', fontSize: '14.5px', whiteSpace: 'pre-wrap', lineHeight: '1.4' }}>
                  {msg.content}
                </div>
              ))}
              {isTestLoading && <div style={{ alignSelf: 'flex-start', color: 'var(--on-surface-variant)', fontSize: '13px', marginLeft: '4px' }}>Бот печатает...</div>}
            </div>
            <div style={{ padding: '12px', background: 'var(--surface-container-low)', borderTop: '1px solid var(--outline-variant)', display: 'flex', gap: '8px' }}>
              <input type="text" value={testInput} onChange={e => setTestInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleTestSend()} placeholder="Введите сообщение..." style={{ flex: 1, padding: '12px 16px', borderRadius: '24px', border: '1px solid var(--outline-variant)', background: 'var(--surface-container-lowest)', color: 'var(--on-surface)', outline: 'none' }} />
              <button onClick={handleTestSend} disabled={isTestLoading} style={{ background: 'var(--primary)', color: 'var(--on-primary)', borderRadius: '50%', width: '46px', height: '46px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: isTestLoading ? 'not-allowed' : 'pointer', opacity: isTestLoading ? 0.7 : 1 }}>
                <MessageCircle size={20} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
