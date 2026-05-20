'use client';

import { useState, useEffect, useRef } from 'react';
import { ArrowRight, ArrowLeft, Bot, Database, Key, MessageCircle, Phone, Plus, Trash2, CheckCircle2, ChevronDown, Check } from 'lucide-react';
import styles from './page.module.css';
import { io, Socket } from 'socket.io-client';
import { useLanguage } from '../contexts/LanguageContext';
import { API_URL, SOCKET_URL } from '../config';

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
  const [companyDescription, setCompanyDescription] = useState('');
  const [productDescription, setProductDescription] = useState('');
  const [botGoal, setBotGoal] = useState('Консультировать клиентов');
  const [tone, setTone] = useState('Дружелюбный и тёплый');
  const [dataToCollect, setDataToCollect] = useState<string[]>([]);
  const [fallbackBehavior, setFallbackBehavior] = useState(t.fallback_noinfo);
  
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
  const [benefits, setBenefits] = useState('');
  const [pricing, setPricing] = useState('');
  const [faq, setFaq] = useState([{ q: '', a: '' }]);
  const [links, setLinks] = useState([{ title: '', url: '' }]);
  const [managerContact, setManagerContact] = useState('');

  // Reset form on mount
  useEffect(() => {
    setIndustry('Финансы');
    setCompanyName('');
    setCompanyDescription('');
    setProductDescription('');
    setBotGoal('Консультировать клиентов');
    setTone('Дружелюбный и тёплый');
    setDataToCollect([]);
    setFallbackBehavior(t.fallback_noinfo);
    setRules({ onlyKnowledgeBase: true, noFabrication: true, userLanguage: true, leadToRequest: false });
    setIsManualSystemPrompt(false);
    setSystemPrompt('');
    setBusinessInfo('');
    setBenefits('');
    setPricing('');
    setFaq([{ q: '', a: '' }]);
    setLinks([{ title: '', url: '' }]);
    setManagerContact('');
  }, []);

  useEffect(() => {
    if (!isManualSystemPrompt) {
      let rulesText = '';
      if (rules.onlyKnowledgeBase) rulesText += `- ${t.onlyKb}.\n`;
      if (rules.noFabrication) rulesText += `- ${t.noFabrication}.\n`;
      rulesText += `- ${t.fallback}:\n  ${fallbackBehavior}\n`;
      if (rules.userLanguage) rulesText += `- ${t.userLanguage}.\n`;
      rulesText += '- Общайся естественно и профессионально.\n';
      if (rules.leadToRequest) rulesText += `- ${t.leadToRequest}.\n`;

      const generated = `Ты AI-консультант компании ${companyName || '[Название компании]'}.

Сфера деятельности: ${industry}

Компания занимается:
${companyDescription || '[Описание компании]'}

Основной продукт или услуга:
${productDescription || '[Описание продукта]'}

Твоя задача:
${botGoal}

Данные, которые необходимо собрать у клиента:
${dataToCollect.length > 0 ? dataToCollect.join(', ') : 'Не требуется'}

Стиль общения:
${tone}

Основные правила:
${rulesText}`;
      setSystemPrompt(generated);
    }
  }, [industry, companyName, companyDescription, productDescription, botGoal, tone, dataToCollect, fallbackBehavior, rules, isManualSystemPrompt]);

  const generateDataPrompt = () => {
    let faqText = faq.filter(f => f.q || f.a).map(f => `В: ${f.q}\nО: ${f.a}`).join('\n\n');
    let linksText = links.filter(l => l.title || l.url).map(l => `${l.title}: ${l.url}`).join('\n');

    return `Компания:
${companyName}

Описание:
${businessInfo}

Преимущества:
${benefits}

Цены и условия:
${pricing}

FAQ:
${faqText}

Полезные ссылки:
${linksText}

Контакт менеджера:
${managerContact}`;
  };

  const dataPrompt = generateDataPrompt();

  // Step 3
  const [platform, setPlatform] = useState<'TELEGRAM' | 'WHATSAPP'>('TELEGRAM');
  const [botToken, setBotToken] = useState('');

  // Step 4
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [waStatus, setWaStatus] = useState<string | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);

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
          apiToken: platform === 'TELEGRAM' ? botToken : undefined,
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
        if (platform === 'TELEGRAM') {
          setMessage({ type: 'success', text: '✅ Telegram бот успешно создан!' });
          setCurrentStep(1);
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
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '32px', position: 'relative' }}>
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
            boxShadow: step === currentStep ? '0 0 15px var(--primary-fixed-dim)' : 'none'
          }} className={step === currentStep ? 'ai-pulse' : ''}>
            {step < currentStep ? <CheckCircle2 size={16} /> : step}
          </div>
          <span style={{ fontSize: '12px', marginTop: '8px', color: step <= currentStep ? 'var(--primary)' : 'var(--on-surface-variant)', fontWeight: step <= currentStep ? '600' : '400', transition: 'all 0.3s' }}>
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
          <img src={qrCode} alt="WhatsApp QR Code" style={{ width: '250px', height: '250px', borderRadius: 'var(--radius-md)', border: '1px solid var(--outline-variant)' }} />
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
            
            <div className={`${styles.formGroup} ${styles.colSpan12}`} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
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
              <label className={styles.label} style={{ color: 'var(--on-surface)' }}>{t.companyDesc}</label>
              <textarea className={styles.input} rows={2} value={companyDescription} onChange={e => setCompanyDescription(e.target.value)} placeholder="..." />
            </div>
            
            <div className={`${styles.formGroup} ${styles.colSpan12}`}>
              <label className={styles.label} style={{ color: 'var(--on-surface)' }}>{t.mainProduct}</label>
              <input className={styles.input} type="text" value={productDescription} onChange={e => setProductDescription(e.target.value)} placeholder="..." />
            </div>

            <div className={`${styles.formGroup} ${styles.colSpan12}`} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
              <div>
                <label className={styles.label} style={{ color: 'var(--on-surface)' }}>{t.dataToCollect}</label>
                <CustomMultiSelect 
                  options={DATA_FIELDS} 
                  value={dataToCollect} 
                  onChange={setDataToCollect} 
                  placeholder="..."
                />
              </div>
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
              <label className={styles.label} style={{ color: 'var(--on-surface)' }}>{t.fallback}</label>
              <CustomSelect 
                options={[
                  t.fallback_noinfo,
                  t.fallback_manager,
                  t.fallback_lead
                ]} 
                value={fallbackBehavior} 
                onChange={setFallbackBehavior} 
                placeholder="..."
              />
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
              <label className={styles.label} style={{ color: 'var(--on-surface)' }}>Общая информация</label>
              <textarea className={styles.input} rows={3} value={businessInfo} onChange={e => setBusinessInfo(e.target.value)} placeholder="..." style={{ background: 'var(--surface-container-low)', color: 'var(--on-surface)' }} />
            </div>

            <div className={`${styles.formGroup} ${styles.colSpan12}`}>
              <label className={styles.label} style={{ color: 'var(--on-surface)' }}>Преимущества</label>
              <textarea className={styles.input} rows={2} value={benefits} onChange={e => setBenefits(e.target.value)} placeholder="Почему стоит выбрать именно вас" />
            </div>

            <div className={`${styles.formGroup} ${styles.colSpan12}`}>
              <label className={styles.label} style={{ color: 'var(--on-surface)' }}>Цены и условия</label>
              <textarea className={styles.input} rows={3} value={pricing} onChange={e => setPricing(e.target.value)} placeholder="Прайс-лист, условия доставки, гарантии" />
            </div>

            <div className={`${styles.formGroup} ${styles.colSpan12}`}>
              <label className={styles.label} style={{ color: 'var(--on-surface)' }}>{t.managerContact}</label>
              <input className={styles.input} type="text" value={managerContact} onChange={e => setManagerContact(e.target.value)} placeholder="..." />
            </div>

            <div className={`${styles.formGroup} ${styles.colSpan12}`} style={{ background: 'var(--surface-container)', padding: '20px', borderRadius: 'var(--radius-lg)' }}>
              <label className={styles.label} style={{ color: 'var(--on-surface)', fontSize: '16px' }}>{t.faqTitle}</label>
              {faq.map((item, index) => (
                <div key={index} style={{ display: 'flex', gap: '12px', marginBottom: '16px', alignItems: 'flex-start', background: 'var(--surface-container-lowest)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--outline-variant)' }}>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <input className={styles.input} type="text" value={item.q} onChange={e => { const newFaq = [...faq]; newFaq[index].q = e.target.value; setFaq(newFaq); }} placeholder="Вопрос" style={{ fontWeight: '600' }} />
                    <textarea className={styles.input} rows={2} value={item.a} onChange={e => { const newFaq = [...faq]; newFaq[index].a = e.target.value; setFaq(newFaq); }} placeholder="Ответ" />
                  </div>
                  <button type="button" onClick={() => { const newFaq = faq.filter((_, i) => i !== index); setFaq(newFaq.length ? newFaq : [{q:'', a:''}]); }} style={{ padding: '12px', background: 'var(--error-container)', color: 'var(--on-error-container)', borderRadius: 'var(--radius-md)', border: 'none', cursor: 'pointer', transition: 'opacity 0.2s' }}>
                    <Trash2 size={20} />
                  </button>
                </div>
              ))}
              <button type="button" onClick={() => setFaq([...faq, { q: '', a: '' }])} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--surface-container-lowest)', border: '2px dashed var(--outline)', color: 'var(--on-surface)', padding: '12px', borderRadius: 'var(--radius-md)', cursor: 'pointer', width: '100%', justifyContent: 'center', fontWeight: '600' }}>
                <Plus size={20} /> Добавить вопрос
              </button>
            </div>

            <div className={`${styles.formGroup} ${styles.colSpan12}`} style={{ background: 'var(--surface-container)', padding: '20px', borderRadius: 'var(--radius-lg)' }}>
              <label className={styles.label} style={{ color: 'var(--on-surface)', fontSize: '16px' }}>{t.usefulLinks}</label>
              {links.map((item, index) => (
                <div key={index} style={{ display: 'flex', gap: '12px', marginBottom: '12px', alignItems: 'center', background: 'var(--surface-container-lowest)', padding: '12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--outline-variant)' }}>
                  <input className={styles.input} type="text" value={item.title} onChange={e => { const newLinks = [...links]; newLinks[index].title = e.target.value; setLinks(newLinks); }} placeholder="Название ссылки (напр. Наш сайт)" style={{ flex: 1 }} />
                  <input className={styles.input} type="text" value={item.url} onChange={e => { const newLinks = [...links]; newLinks[index].url = e.target.value; setLinks(newLinks); }} placeholder="https://..." style={{ flex: 2 }} />
                  <button type="button" onClick={() => { const newLinks = links.filter((_, i) => i !== index); setLinks(newLinks.length ? newLinks : [{title:'', url:''}]); }} style={{ padding: '12px', background: 'var(--error-container)', color: 'var(--on-error-container)', borderRadius: 'var(--radius-md)', border: 'none', cursor: 'pointer' }}>
                    <Trash2 size={20} />
                  </button>
                </div>
              ))}
              <button type="button" onClick={() => setLinks([...links, { title: '', url: '' }])} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--surface-container-lowest)', border: '2px dashed var(--outline)', color: 'var(--on-surface)', padding: '12px', borderRadius: 'var(--radius-md)', cursor: 'pointer', width: '100%', justifyContent: 'center', fontWeight: '600' }}>
                <Plus size={20} /> Добавить ссылку
              </button>
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
                {platform === 'TELEGRAM' ? <MessageCircle size={24} color="#3b82f6" /> : <Phone size={24} color="#22c55e" />}
                {platform === 'TELEGRAM' ? 'Telegram' : 'WhatsApp'}
              </div>
            </div>

            <div className={`${styles.formGroup} ${styles.colSpan12}`}>
              <label className={styles.label} style={{ color: 'var(--on-surface)' }}>{t.sysPromptFull}</label>
              <pre style={{ padding: '20px', background: 'var(--surface-container-low)', borderRadius: 'var(--radius-md)', border: '1px solid var(--outline)', color: 'var(--on-surface)', whiteSpace: 'pre-wrap', fontSize: '14px', fontFamily: 'monospace', lineHeight: '1.6' }}>
                {systemPrompt}
              </pre>
            </div>

            <div className={`${styles.formGroup} ${styles.colSpan12}`}>
              <label className={styles.label} style={{ color: 'var(--on-surface)' }}>{t.dataPromptFull}</label>
              <pre style={{ padding: '20px', background: 'var(--surface-container-low)', borderRadius: 'var(--radius-md)', border: '1px solid var(--outline)', color: 'var(--on-surface)', whiteSpace: 'pre-wrap', fontSize: '14px', fontFamily: 'monospace', lineHeight: '1.6' }}>
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
            <button type="button" className={styles.btnPrimary} onClick={handleSubmit} disabled={isSubmitting || (platform === 'TELEGRAM' && !botToken)} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--primary)', color: 'var(--on-primary)', padding: '12px 24px', borderRadius: 'var(--radius-md)', fontWeight: '600', fontSize: '15px', border: 'none', cursor: (isSubmitting || (platform === 'TELEGRAM' && !botToken)) ? 'not-allowed' : 'pointer', opacity: (isSubmitting || (platform === 'TELEGRAM' && !botToken)) ? 0.7 : 1 }}>
              {isSubmitting ? 'Создание...' : 'Создать бота'} <Bot size={18} />
            </button>
          )}
        </div>
      </div>
      )}
    </div>
  );
}
