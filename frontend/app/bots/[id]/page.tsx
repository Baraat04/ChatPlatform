'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Save, Trash2, Send, Bot, User, Users, UserPlus, Pause, Play, Phone, MessageSquare, Radio, Edit2, Wand2, ChevronDown, Check, Plus, Database, BrainCircuit, FileUp } from 'lucide-react';
import Link from 'next/link';
import { io } from 'socket.io-client';
import { useLanguage } from '../../contexts/LanguageContext';
import { translations } from '../../locales/translations';
import { API_URL, API_BASE as CONFIG_API_BASE, SOCKET_URL } from '../../config';

const API = API_URL;


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

function CustomSelect({ options, displayOptions, value, onChange, placeholder }: any) {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [customInput, setCustomInput] = useState('');
  const [isAddingCustom, setIsAddingCustom] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const disp = displayOptions || options;
  const selectedIndex = options.indexOf(value);
  const displayVal = selectedIndex !== -1 ? disp[selectedIndex] : value;

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
        className="premium-input"
        style={{ 
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 16px',
        }}
      >
        <span>{displayVal || placeholder}</span>
        <ChevronDown size={18} style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }} />
      </div>
      
      {isOpen && (
        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50, background: 'var(--surface-container-lowest)', border: '1px solid var(--outline-variant)', borderRadius: '12px', marginTop: '4px', padding: '8px', maxHeight: '250px', overflowY: 'auto' }}>
          {options.map((opt: string, idx: number) => (
            <div 
              key={opt}
              onClick={() => { onChange(opt); setIsOpen(false); }}
              style={{ padding: '10px 12px', cursor: 'pointer', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: value === opt ? 'var(--primary-container)' : 'transparent', color: value === opt ? 'var(--primary)' : 'var(--on-surface)' }}
            >
              <span>{disp[idx]}</span>
              {value === opt && <Check size={16} />}
            </div>
          ))}
          {!isAddingCustom ? (
            <div 
              style={{ padding: '10px 12px', cursor: 'pointer', color: 'var(--primary)', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', borderTop: '1px solid var(--outline-variant)', marginTop: '8px' }}
              onClick={() => setIsAddingCustom(true)}
            >
              <Plus size={16} style={{ marginRight: '8px' }}/> {t.addCustom}
            </div>
          ) : (
            <div style={{ padding: '8px', borderTop: '1px solid var(--outline-variant)', marginTop: '8px' }}>
              <form onSubmit={addCustom} style={{ display: 'flex', gap: '8px' }}>
                <input 
                  type="text" 
                  value={customInput} 
                  onChange={(e) => setCustomInput(e.target.value)} 
                  placeholder={t.enterCustom} 
                  className="premium-input"
                  style={{ padding: '8px 12px' }}
                  autoFocus
                />
                <button type="submit" className="btn-primary" style={{ padding: '8px 16px', borderRadius: '8px' }}>{t.ok}</button>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function CustomMultiSelect({ options, displayOptions, value, onChange, placeholder }: any) {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [customInput, setCustomInput] = useState('');
  const [isAddingCustom, setIsAddingCustom] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const disp = displayOptions || options;
  const displayValues = value.map((val: string) => {
    const idx = options.indexOf(val);
    return idx !== -1 ? disp[idx] : val;
  });

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
        className="premium-input"
        style={{ 
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 16px',
        }}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: '8px' }}>
          {displayValues.length > 0 ? displayValues.join(', ') : placeholder}
        </span>
        <ChevronDown size={18} style={{ flexShrink: 0, transform: isOpen ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }} />
      </div>
      
      {isOpen && (
        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50, background: 'var(--surface-container-lowest)', border: '1px solid var(--outline-variant)', borderRadius: '12px', marginTop: '4px', padding: '8px', maxHeight: '300px', overflowY: 'auto' }}>
          {options.map((opt: string, idx: number) => (
            <label key={opt} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', cursor: 'pointer', borderRadius: '8px' }}>
              <input 
                type="checkbox" 
                checked={value.includes(opt)} 
                onChange={() => toggleOption(opt)} 
                style={{ width: '18px', height: '18px', accentColor: 'var(--primary)', cursor: 'pointer' }}
              />
              <span style={{ cursor: 'pointer', userSelect: 'none', color: 'var(--on-surface)' }}>{disp[idx]}</span>
            </label>
          ))}
          {value.filter((v: string) => !options.includes(v)).map((opt: string) => (
            <label key={opt} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', cursor: 'pointer', borderRadius: '8px' }}>
              <input 
                type="checkbox" 
                checked={true} 
                onChange={() => toggleOption(opt)} 
                style={{ width: '18px', height: '18px', accentColor: 'var(--primary)', cursor: 'pointer' }}
              />
              <span style={{ cursor: 'pointer', userSelect: 'none', color: 'var(--on-surface)' }}>{opt} ({t.addCustom})</span>
            </label>
          ))}
          {!isAddingCustom ? (
            <div 
              style={{ padding: '10px 12px', cursor: 'pointer', color: 'var(--primary)', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', borderTop: '1px solid var(--outline-variant)', marginTop: '8px' }}
              onClick={() => setIsAddingCustom(true)}
            >
              <Plus size={16} style={{ marginRight: '8px' }}/> {t.addCustom}
            </div>
          ) : (
            <div style={{ padding: '8px', borderTop: '1px solid var(--outline-variant)', marginTop: '8px' }}>
              <form onSubmit={addCustom} style={{ display: 'flex', gap: '8px' }}>
                <input 
                  type="text" 
                  value={customInput} 
                  onChange={(e) => setCustomInput(e.target.value)} 
                  placeholder={t.enterCustom} 
                  className="premium-input"
                  style={{ padding: '8px 12px' }}
                  autoFocus
                />
                <button type="submit" className="btn-primary" style={{ padding: '8px 16px', borderRadius: '8px' }}>{t.ok}</button>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  );
}


interface BotType {
  id: number;
  platform: string;
  isActive: boolean;
  system_prompt: string;
  data_prompt: string;
  slug: string;
}

interface Chat {
  chatId: string;
  lastMessage: string;
  lastAt: string;
  lastSender: string;
  name?: string;
  realJid?: string | null;
}

interface Message {
  id: number;
  botId: number;
  sender: string;
  text: string;
  chatId: string;
  createdAt: string;
}

export default function BotDetails() {
  const { t } = useLanguage();
  const params = useParams();
  const router = useRouter();
  const botId = params.id as string;

  const [bot, setBot] = useState<BotType | null>(null);
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [systemPrompt, setSystemPrompt] = useState('');
  const [dataPrompt, setDataPrompt] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isTogglingActive, setIsTogglingActive] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [activeTab, setActiveTab] = useState<'chats' | 'agent' | 'settings' | 'broadcast'>('chats');
  
  // Agent Chat States
  const [agentChatHistory, setAgentChatHistory] = useState<{role: string, content: string}[]>([]);
  const [agentInput, setAgentInput] = useState('');
  const [isAgentLoading, setIsAgentLoading] = useState(false);
  const [isUploadingPdf, setIsUploadingPdf] = useState(false);
  const [broadcastNumbers, setBroadcastNumbers] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [selectedBroadcastContacts, setSelectedBroadcastContacts] = useState<string[]>([]);
  const [contactSearch, setContactSearch] = useState('');
  const [qrCode, setQrCode] = useState<string | null>(null);
  
  // Full Configuration States
  const [industry, setIndustry] = useState('Финансы');
  const [companyName, setCompanyName] = useState('');
  const [companyDescription, setCompanyDescription] = useState('');
  const [productDescription, setProductDescription] = useState('');
  const [botGoal, setBotGoal] = useState('Консультировать клиентов');
  const [tone, setTone] = useState('Дружелюбный и тёплый');
  const [dataToCollect, setDataToCollect] = useState<string[]>([]);
  const [fallbackBehavior, setFallbackBehavior] = useState('Сообщить, что информации нет');
  const [rules, setRules] = useState({
    onlyKnowledgeBase: true,
    noFabrication: true,
    userLanguage: true,
    leadToRequest: false
  });

  
  const [businessInfo, setBusinessInfo] = useState('');
  const [benefits, setBenefits] = useState('');
  const [pricing, setPricing] = useState('');
  const [faq, setFaq] = useState([{ q: '', a: '' }]);
  const [links, setLinks] = useState([{ title: '', url: '' }]);
  const [managerContact, setManagerContact] = useState('');

  const API_BASE = CONFIG_API_BASE;
  const renderMessageContent = (text: string) => {
    if (!text) return null;
    const parts = text.split(/(\[AUDIO\]\/uploads\/[^\s\n]+)/g);
    return parts.map((part, i) => {
      if (part.startsWith('[AUDIO]/uploads/')) {
        const filePath = part.replace('[AUDIO]', '');
        const audioUrl = `${API_BASE}${filePath}`;
        return (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '12px', padding: '8px 12px' }}>
            <span style={{ fontSize: '1.2rem' }}>🎤</span>
            <audio controls style={{ height: '32px', flex: 1, minWidth: '180px', accentColor: 'var(--primary)' }}>
              <source src={audioUrl} />
              {t.voiceMessage}
            </audio>
          </div>
        );
      }
      return part ? <span key={i} style={{ whiteSpace: 'pre-wrap' }}>{part}</span> : null;
    });
  };

  const parseSystemPrompt = (prompt: string) => {
    if (!prompt) return;
    if (!prompt.includes('Сфера деятельности:') && !prompt.includes('Компания занимается:')) {
      return;
    }
    const companyMatch = prompt.match(/Ты AI-консультант компании (.*?)\./);
    if (companyMatch && companyMatch[1] !== '[Название компании]') setCompanyName(companyMatch[1]);
    const industryMatch = prompt.match(/Сфера деятельности:\s*(.*)/);
    if (industryMatch) setIndustry(industryMatch[1]);
    const companyDescMatch = prompt.match(/Компания занимается:\n([\s\S]*?)\n\nОсновной продукт/);
    if (companyDescMatch && companyDescMatch[1] !== '[Описание компании]') setCompanyDescription(companyDescMatch[1].trim());
    const productDescMatch = prompt.match(/Основной продукт или услуга:\n([\s\S]*?)\n\nТвоя задача:/);
    if (productDescMatch && productDescMatch[1] !== '[Описание продукта]') setProductDescription(productDescMatch[1].trim());
    const botGoalMatch = prompt.match(/Твоя задача:\n([\s\S]*?)\n\nДанные, которые/);
    if (botGoalMatch) setBotGoal(botGoalMatch[1].trim());
    const dataMatch = prompt.match(/Данные, которые необходимо собрать у клиента:\n(.*)/);
    if (dataMatch && dataMatch[1] && dataMatch[1] !== 'Не требуется') {
      setDataToCollect(dataMatch[1].split(', ').map((s: string) => s.trim()));
    } else {
      setDataToCollect([]);
    }
    const toneMatch = prompt.match(/Стиль общения:\n(.*)/);
    if (toneMatch) setTone(toneMatch[1].trim());
    setRules({
      onlyKnowledgeBase: prompt.includes('Отвечай только на основе информации из базы знаний.'),
      noFabrication: prompt.includes('Не выдумывай информацию.'),
      userLanguage: prompt.includes('Отвечай на языке пользователя.'),
      leadToRequest: prompt.includes('привести пользователя к заявке') || prompt.includes('оставить заявку') || prompt.includes('связаться с менеджером')
    });
    const fallbackMatch = prompt.match(/Если ответа нет в базе знаний:\n\s*(.*)/);
    if (fallbackMatch) setFallbackBehavior(fallbackMatch[1].trim());
  };

  const parseDataPrompt = (prompt: string) => {
    if (!prompt) return;
    const businessInfoMatch = prompt.match(/Описание:\n([\s\S]*?)\n\n{t.benefits}:/);
    if (businessInfoMatch) setBusinessInfo(businessInfoMatch[1].trim());
    const benefitsMatch = prompt.match(/{t.benefits}:\n([\s\S]*?)\n\n{t.pricingTerms}:/);
    if (benefitsMatch) setBenefits(benefitsMatch[1].trim());
    const pricingMatch = prompt.match(/{t.pricingTerms}:\n([\s\S]*?)\n\nFAQ:/);
    if (pricingMatch) setPricing(pricingMatch[1].trim());
    const managerContactMatch = prompt.match(/Контакт менеджера:\n(.*)/);
    if (managerContactMatch) setManagerContact(managerContactMatch[1].trim());
    const faqSectionMatch = prompt.match(/FAQ:\n([\s\S]*?)\n\nПолезные ссылки:/);
    if (faqSectionMatch) {
      const faqText = faqSectionMatch[1].trim();
      const faqItems = [];
      const blocks = faqText.split('\n\n');
      for (const block of blocks) {
        const qMatch = block.match(/В: (.*)/);
        const aMatch = block.match(/О: ([\s\S]*)/);
        if (qMatch && aMatch) faqItems.push({ q: qMatch[1], a: aMatch[1] });
      }
      if (faqItems.length > 0) setFaq(faqItems);
    }
    const linksSectionMatch = prompt.match(/Полезные ссылки:\n([\s\S]*?)\n\nКонтакт менеджера:/);
    if (linksSectionMatch) {
      const linksText = linksSectionMatch[1].trim();
      const linksItems = [];
      const lines = linksText.split('\n');
      for (const line of lines) {
        const parts = line.split(': ');
        if (parts.length >= 2) {
          const url = parts.pop()!;
          const title = parts.join(': ');
          linksItems.push({ title, url });
        }
      }
      if (linksItems.length > 0) setLinks(linksItems);
    }
  };

  useEffect(() => {
    let rulesText = '';
    if (rules.onlyKnowledgeBase) rulesText += '- Отвечай только на основе информации из базы знаний.\n';
    if (rules.noFabrication) rulesText += '- Не выдумывай информацию.\n';
    rulesText += `- Если ответа нет в базе знаний:\n  ${fallbackBehavior}\n`;
    if (rules.userLanguage) rulesText += '- Отвечай на языке пользователя.\n';
    rulesText += '- Общайся естественно и профессионально.\n';
    if (rules.leadToRequest) rulesText += '- Если это уместно, помогай пользователю оставить заявку или связаться с менеджером.\n';

    const generated = `Ты AI-консультант компании ${companyName || '[Название компании]'}.\n\nСфера деятельности: ${industry}\n\nКомпания занимается:\n${companyDescription || '[Описание компании]'}\n\nОсновной продукт или услуга:\n${productDescription || '[Описание продукта]'}\n\nТвоя задача:\n${botGoal}\n\nДанные, которые необходимо собрать у клиента:\n${dataToCollect.length > 0 ? dataToCollect.join(', ') : 'Не требуется'}\n\nСтиль общения:\n${tone}\n\nОсновные правила:\n${rulesText}`;
    setSystemPrompt(generated);
  }, [industry, companyName, companyDescription, productDescription, botGoal, tone, dataToCollect, fallbackBehavior, rules]);

  useEffect(() => {
    let faqText = faq.filter(f => f.q || f.a).map(f => `В: ${f.q}\nО: ${f.a}`).join('\n\n');
    let linksText = links.filter(l => l.title || l.url).map(l => `${l.title}: ${l.url}`).join('\n');
    const generated = `Компания:\n${companyName}\n\nОписание:\n${businessInfo}\n\n{t.benefits}:\n${benefits}\n\n{t.pricingTerms}:\n${pricing}\n\nFAQ:\n${faqText}\n\nПолезные ссылки:\n${linksText}\n\nКонтакт менеджера:\n${managerContact}`;
    setDataPrompt(generated);
  }, [companyName, businessInfo, benefits, pricing, faq, links, managerContact]);



  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchBot();
    fetchChats();

    const socket = io(SOCKET_URL);
    socket.on(`chat-${botId}`, (newMsg: any) => {
      setMessages(prev => [...prev, newMsg]);
      setChats(prev => {
        const existing = prev.find(c => c.chatId === newMsg.chatId);
        const updated: Chat = {
          chatId: newMsg.chatId,
          lastMessage: newMsg.text,
          lastAt: newMsg.createdAt,
          lastSender: newMsg.sender,
          name: newMsg.contactName || existing?.name || '',
          realJid: existing?.realJid || null,
        };
        if (existing) return [updated, ...prev.filter(c => c.chatId !== newMsg.chatId)];
        return [updated, ...prev];
      });
    });
    socket.on(`qr-${botId}`, (qr: string) => setQrCode(qr));
    socket.on(`contact-update-${botId}`, (updatedContact: any) => {
      setChats(prev => prev.map(c => {
        if (c.chatId === updatedContact.chatId) {
          return { ...c, name: updatedContact.name || c.name, realJid: updatedContact.realJid || c.realJid };
        }
        return c;
      }));
    });

    socket.on(`status-${botId}`, (status: string) => {
      if (status === 'connected') { 
        setQrCode(null); 
        fetchBot(); 
        fetchChats(); 
      }
    });

    return () => { socket.disconnect(); };
  }, [botId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (selectedChat) fetchChatMessages(selectedChat);
  }, [selectedChat]);

  async function fetchBot() {
    const res = await fetch(`${API}/bot/${botId}`, { credentials: 'include' });
    if (res.ok) {
      const data = await res.json();
      setBot(data);
      if (data.system_prompt) parseSystemPrompt(data.system_prompt);
      if (data.data_prompt) parseDataPrompt(data.data_prompt);
      setSystemPrompt(data.system_prompt || '');
      setDataPrompt(data.data_prompt || '');
      if (data.agentHistory) {
        try {
          setAgentChatHistory(JSON.parse(data.agentHistory));
        } catch (e) {
          console.error("Failed to parse agent history", e);
        }
      }
    }
  }

  async function fetchChats() {
    const res = await fetch(`${API}/bot/${botId}/chats`, { credentials: 'include' });
    if (res.ok) setChats(await res.json());
  }

  async function fetchChatMessages(chatId: string) {
    const res = await fetch(`${API}/bot/${botId}/chat?chatId=${encodeURIComponent(chatId)}`, { credentials: 'include' });
    if (res.ok) setMessages(await res.json());
  }

  async function handleSend() {
    if (!replyText.trim() || !selectedChat) return;
    const res = await fetch(`${API}/bot/${botId}/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: replyText, chatId: selectedChat }),
      credentials: 'include'
    });
    if (res.ok) setReplyText('');
    else alert('Не удалось отправить: ' + (await res.json().catch(() => ({}))).error);
  }

  async function handleToggleActive() {
    if (!bot) return;
    setIsTogglingActive(true);
    const endpoint = bot.isActive ? 'pause' : 'start';
    const res = await fetch(`${API}/bot/${botId}/${endpoint}`, { method: 'POST', credentials: 'include' });
    if (res.ok) await fetchBot();
    else alert('Ошибка при изменении статуса бота');
    setIsTogglingActive(false);
  }

  async function handleSave() {
    setIsSaving(true);
    await fetch(`${API}/bot/${botId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ system_prompt: systemPrompt, data_prompt: dataPrompt }),
      credentials: 'include'
    });
    setIsSaving(false);
  }

  async function sendToAgent(text: string) {
    if (!text.trim()) return;
    const userMsg = { role: 'user', content: text };
    const newHistory = [...agentChatHistory, userMsg];
    setAgentChatHistory(newHistory);
    setIsAgentLoading(true);

    try {
      const res = await fetch(`${API}/bot/${botId}/agent-chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: userMsg.content, history: agentChatHistory }),
        credentials: 'include'
      });
      if (!res.ok) {
        throw new Error(`Server returned ${res.status} (Make sure you restarted the backend!)`);
      }
      const data = await res.json();
      setAgentChatHistory([...newHistory, { role: 'assistant', content: data.reply }]);
      if (data.system_prompt) {
        setSystemPrompt(data.system_prompt);
        parseSystemPrompt(data.system_prompt);
      }
      if (data.data_prompt) {
        setDataPrompt(data.data_prompt);
        parseDataPrompt(data.data_prompt);
      }
    } catch (err: any) {
      console.error(err);
      setAgentChatHistory([...newHistory, { role: 'assistant', content: `Ошибка при связи с ИИ-агентом: ${err.message}` }]);
    } finally {
      setIsAgentLoading(false);
    }
  }

  async function handleAgentSend() {
    if (!agentInput.trim()) return;
    await sendToAgent(agentInput);
    setAgentInput('');
  }

  async function handlePdfUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== 'application/pdf') {
      alert(t.uploadPdfError);
      return;
    }

    setIsUploadingPdf(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch(`${API}/bot/${botId}/upload-pdf`, {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });
      const data = await res.json();
      if (data.text) {
        const appendedData = `\n\n--- ДАННЫЕ ИЗ PDF (${file.name}) ---\n${data.text}`;
        const newDataPrompt = dataPrompt + appendedData;
        setDataPrompt(newDataPrompt);
        
        // Save to backend so agent can see it
        await fetch(`${API}/bot/${botId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ system_prompt: systemPrompt, data_prompt: newDataPrompt }),
          credentials: 'include'
        });
        
        // Автоматически отправляем агенту сообщение о загрузке ПДФ
        setActiveTab('agent');
        await sendToAgent(`Я только что загрузил PDF файл "${file.name}". Пожалуйста, подтверди, что ты успешно прочитал и добавил эти данные.`);
      } else {
        alert(t.extractPdfError);
      }
    } catch (err) {
      console.error(err);
      alert(t.extractPdfError);
    } finally {
      setIsUploadingPdf(false);
      e.target.value = '';
    }
  }

  async function handleBroadcast() {
    if (!broadcastMessage.trim()) return;
    
    let chatIds: string[] = [];
    
    // Mode 1: Manual numbers from textarea
    if (broadcastNumbers.trim()) {
      chatIds = broadcastNumbers.split('\n').map(n => n.trim()).filter(n => n);
    } 
    // Mode 2: Selected contacts
    else if (selectedBroadcastContacts.length > 0) {
      chatIds = selectedBroadcastContacts;
    }
    
    if (chatIds.length === 0) return alert(t.broadcastNoRecipients);

    setIsBroadcasting(true);
    try {
      const res = await fetch(`${API}/bot/${botId}/broadcast`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: broadcastMessage, chatIds }),
        credentials: 'include'
      });
      if (res.ok) {
        alert(t.broadcastFinished);
        setBroadcastMessage('');
        setBroadcastNumbers('');
        setSelectedBroadcastContacts([]);
      }
    } catch (e) {}
    setIsBroadcasting(false);
  }

  async function handleDelete() {
    if (!confirm(t.deleteBotConfirm)) return;
    setIsDeleting(true);
    await fetch(`${API}/bot/${botId}`, { method: 'DELETE', credentials: 'include' });
    router.push('/bots');
  }


  async function handleDeleteChat(chatIdToDelete?: string) {
    const id = chatIdToDelete || selectedChat;
    if (!id) return;
    if (!confirm(t.deleteContactConfirm.replace('{id}', id))) return;
    
    const res = await fetch(`${API}/bot/${botId}/contact/delete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chatId: id }),
      credentials: 'include'
    });

    if (res.ok) {
      if (id === selectedChat) {
        setSelectedChat(null);
        setMessages([]);
      }
      fetchChats();
    } else {
      alert(t.deleteContactError);
    }
  }

  async function handleEditContactName(e: React.MouseEvent, chatId: string, currentName: string) {
    e.stopPropagation();
    const newName = prompt(t.enterContactName, currentName);
    if (newName === null || newName === currentName) return;

    const res = await fetch(`${API}/bot/${botId}/contact/name`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chatId, name: newName }),
      credentials: 'include'
    });

    if (res.ok) {
      fetchChats();
    } else {
      alert(t.saveNameError);
    }
  }



  const formatTime = (d: string) => new Date(d).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  const formatDate = (d: string) => new Date(d).toLocaleDateString('ru-RU', { day: '2-digit', month: 'short' });
  const formatChatId = (id: string) => id.split('@')[0];

  if (!bot) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: '#888', fontFamily: 'Inter, sans-serif', background: '#050505' }}>
      <div className="loader"></div>
      <style>{`
        .loader { width: 40px; height: 40px; border: 3px solid #333; border-top-color: #6366f1; border-radius: 50%; animation: spin 1s linear infinite; }
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );

  return (
    <div className="bot-dashboard-container">
      <style>{`
        .bot-dashboard-container {
          height: 100vh;
          height: 100dvh;
          display: flex;
          flex-direction: column;
          background: var(--background);
          font-family: 'Plus Jakarta Sans', sans-serif;
          color: var(--on-surface);
          overflow: hidden;
          position: relative;
        }

        .top-bar {
          display: flex;
          align-items: center;
          gap: 1.5rem;
          padding: 0.85rem 1.75rem;
          background: var(--surface-container-lowest);
          border-bottom: 1px solid var(--outline-variant);
          flex-shrink: 0;
          z-index: 10;
        }

        .back-btn {
          color: var(--on-surface-variant);
          text-decoration: none;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.875rem;
          font-weight: 500;
          transition: all 0.2s ease;
          padding: 0.4rem 0.75rem;
          border-radius: 8px;
        }
        .back-btn:hover {
          color: var(--primary);
          background: var(--surface-container-high);
          transform: translateX(-2px);
        }

        .status-badge {
          font-size: 0.7rem;
          padding: 0.25rem 0.75rem;
          border-radius: 999px;
          font-weight: 700;
          letter-spacing: 0.5px;
          text-transform: uppercase;
        }

        .btn-action {
          padding: 0.55rem 1.1rem;
          border-radius: 10px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 0.4rem;
          font-size: 0.82rem;
          font-weight: 600;
          transition: all 0.2s ease;
          border: 1px solid transparent;
        }
        
        .btn-toggle {
          background: var(--primary-container);
          color: var(--on-primary-container);
          border: 1px solid var(--primary);
        }
        .btn-toggle:hover { opacity: 0.9; }
        .btn-toggle.paused {
          background: var(--error-container);
          color: var(--on-error-container);
          border: 1px solid var(--error);
        }

        .btn-delete {
          background: var(--error-container);
          color: var(--on-error-container);
          border: 1px solid var(--error);
        }
        .btn-delete:hover { opacity: 0.9; }

        .tab-bar {
          display: flex;
          background: var(--surface-container-lowest);
          border-bottom: 1px solid var(--outline-variant);
          padding: 0 1.5rem;
          flex-shrink: 0;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: none;
        }
        .tab-bar::-webkit-scrollbar { display: none; }

        .tab-btn {
          padding: 1rem 1.5rem;
          background: transparent;
          border: none;
          color: var(--on-surface-variant);
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.875rem;
          font-weight: 600;
          transition: all 0.2s ease;
          position: relative;
          white-space: nowrap;
        }
        .tab-btn:hover { color: var(--primary); }
        .tab-btn.active { color: var(--primary); }
        .tab-btn.active::after {
          content: ''; position: absolute; bottom: -1px; left: 0; width: 100%; height: 3px;
          background: var(--primary);
          border-radius: 3px 3px 0 0;
        }

        .contacts-sidebar {
          width: 300px;
          border-right: 1px solid var(--outline-variant);
          background: var(--surface-container-lowest);
          display: flex;
          flex-direction: column;
        }
        
        .chat-item {
          padding: 1rem;
          cursor: pointer;
          border-bottom: 1px solid var(--outline-variant);
          transition: background 0.2s ease;
          position: relative;
        }
        .chat-item:hover { background: var(--background); }
        .chat-item.active { background: var(--primary-container); }
        .chat-item.active::before {
          content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 4px;
          background: var(--primary);
        }

        .avatar {
          width: 40px; height: 40px; border-radius: 12px;
          background: var(--surface-container-high);
          display: flex; align-items: center; justify-content: center;
          border: 1px solid var(--outline-variant);
          color: var(--on-surface-variant);
        }

        .msg-bubble {
          max-width: 80%; padding: 0.8rem 1rem;
          font-size: 0.92rem; line-height: 1.5;
          position: relative;
          box-shadow: 0 1px 2px rgba(0,0,0,0.05);
        }
        .msg-bot {
          background: var(--surface-container-low);
          border: 1px solid var(--outline-variant);
          border-radius: 16px 16px 4px 16px;
          color: var(--on-surface);
        }
        .msg-user {
          background: var(--primary);
          border-radius: 16px 16px 16px 4px;
          color: var(--on-primary);
        }

        .glass-panel {
          background: var(--surface-container-lowest);
          border: 1px solid var(--outline-variant);
          border-radius: 16px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
        }

        .premium-input {
          width: 100%;
          background: var(--surface-container-lowest);
          border: 1px solid var(--outline);
          border-radius: 12px;
          padding: 0.8rem 1rem;
          color: var(--on-surface);
          font-family: inherit;
          font-size: 0.95rem;
          transition: all 0.2s ease;
          box-sizing: border-box;
        }
        .premium-input:focus {
          outline: none;
          border-color: var(--primary);
          box-shadow: 0 0 0 3px rgba(0, 53, 39, 0.1);
        }

        .btn-primary {
          background: var(--primary);
          color: var(--on-primary);
          border: none;
          border-radius: 12px;
          padding: 0.8rem 2rem;
          font-weight: 600;
          font-size: 0.95rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          transition: all 0.2s ease;
        }
        .btn-primary:hover {
          background: #004d39;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 53, 39, 0.2);
        }

        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: var(--outline-variant); border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: var(--outline); }

        @media (min-width: 769px) {
          .mobile-only-btn { display: none !important; }
        }

        @media (max-width: 768px) {
          .top-bar { padding: 0.75rem 1rem; flex-wrap: wrap; justify-content: space-between; gap: 0.75rem; }
          .contacts-sidebar { width: 100%; border-right: none; }
          .chat-view-container { 
            background: var(--background); 
            display: flex;
            flex-direction: column;
            flex: 1;
          }
          .mobile-hidden { display: none !important; }
          .mobile-only-btn { display: flex; align-items: center; justify-content: center; }
          .content-pad { padding: 1rem !important; }
        }
      `}</style>

      {/* ─── TOP BAR ─── */}
      <div className="top-bar">
        <Link href="/bots" className="back-btn">
          <ArrowLeft size={18} /> {t.dashboard}
        </Link>
        <div style={{ width: '1px', height: '24px', background: 'var(--outline-variant)' }} />
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: bot.isActive ? '#1e7e34' : '#d63031', boxShadow: bot.isActive ? '0 0 10px rgba(30,126,52,0.4)' : '0 0 10px rgba(214,48,49,0.4)', zIndex: 2 }} />
            {bot.isActive && <div style={{ position: 'absolute', width: '12px', height: '12px', borderRadius: '50%', background: '#1e7e34', animation: 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite' }} />}
          </div>
          <span style={{ fontWeight: 700, fontSize: '1.2rem', letterSpacing: '0.2px', color: 'var(--on-surface)' }}>{bot.platform} Agent</span>
          <span className="status-badge" style={{ 
            color: bot.isActive ? '#1e7e34' : '#9b1c1c', 
            background: bot.isActive ? 'rgba(30,126,52,0.1)' : 'rgba(155,28,28,0.1)',
            border: `1px solid ${bot.isActive ? '#1e7e3440' : '#9b1c1c40'}`
          }}>
            {bot.isActive ? t.online : t.paused}
          </span>
        </div>

        <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.75rem' }}>
          <button onClick={handleToggleActive} disabled={isTogglingActive} className={`btn-action btn-toggle ${bot.isActive ? 'paused' : ''}`}>
            {bot.isActive ? <><Pause size={16} /> {t.pauseAgent}</> : <><Play size={16} /> {t.startAgent}</>}
          </button>
          <button onClick={handleDelete} disabled={isDeleting} className="btn-action btn-delete">
            <Trash2 size={16} /> {t.terminate}
          </button>
        </div>
      </div>

      {/* ─── TAB BAR ─── */}
      <div className="tab-bar">
        {([['chats', <MessageSquare size={16} />, t.liveChats], ['agent', <BrainCircuit size={16} />, 'AI Brain'], ['settings', <Bot size={16} />, t.settings || 'Конфигурация'], ['broadcast', <Radio size={16} />, t.campaigns]] as const).map(([tab, icon, label]) => (
          <button key={tab} onClick={() => setActiveTab(tab as any)} className={`tab-btn ${activeTab === tab ? 'active' : ''}`}>
            {icon} {label}
          </button>
        ))}
      </div>

      {/* ─── CONTENT ─── */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex' }}>

        {/* ══ CHATS TAB ══ */}
        {activeTab === 'chats' && (
          <div style={{ display: 'flex', width: '100%', height: '100%' }}>
            
            {/* Contacts sidebar */}
            <div className={`contacts-sidebar ${selectedChat ? 'mobile-hidden' : ''}`}>
              <div style={{ padding: '1.2rem', borderBottom: '1px solid #e0e3e5', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--on-surface-variant)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{t.conversations}</span>
                <span style={{ background: 'var(--primary-container)', color: 'var(--on-primary-container)', padding: '0.2rem 0.6rem', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 700 }}>{chats.length}</span>
              </div>
              
              <div style={{ flex: 1, overflowY: 'auto' }}>
                {chats.length === 0 ? (
                  <div style={{ padding: '3rem 2rem', textAlign: 'center', color: 'var(--on-surface-variant)' }}>
                    <MessageSquare size={32} style={{ opacity: 0.5, marginBottom: '1rem' }} />
                    <div style={{ fontSize: '0.9rem' }}>{t.noActiveConv}<br/>{t.waitingMsgs}</div>
                  </div>
                ) : chats.map(chat => (
                  <div key={chat.chatId} onClick={() => setSelectedChat(chat.chatId)} className={`chat-item ${selectedChat === chat.chatId ? 'active' : ''}`}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div className="avatar">
                        <User size={18} color={selectedChat === chat.chatId ? 'var(--primary)' : 'var(--on-surface-variant)'} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.2rem' }}>
                          <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--on-surface)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {bot?.platform === 'TELEGRAM' 
                              ? (chat.name || chat.chatId)
                              : (chat.name 
                                  ? (chat.realJid || chat.chatId).includes('@lid') ? chat.name : `+${formatChatId(chat.realJid || chat.chatId)} (${chat.name})`
                                  : ((chat.realJid || chat.chatId).includes('@lid') ? 'Скрытый номер' : `+${formatChatId(chat.realJid || chat.chatId)}`))}
                          </div>
                          <Edit2 size={12} color="#666" style={{ cursor: 'pointer', opacity: 0.7 }} onClick={(e) => handleEditContactName(e, chat.chatId, chat.name || '')} />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ fontSize: '0.8rem', color: 'var(--on-surface-variant)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '65%' }}>
                            {chat.lastSender === 'bot' && <span style={{ color: 'var(--primary)', marginRight: '4px', fontWeight: 600 }}>AI:</span>}
                            {chat.lastMessage}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div style={{ fontSize: '0.7rem', color: 'var(--on-surface-variant)' }}>{formatTime(chat.lastAt)}</div>
                            <Trash2 size={12} color="#444" style={{ cursor: 'pointer', opacity: 0.5 }} onClick={(e) => { e.stopPropagation(); handleDeleteChat(chat.chatId); }} />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Chat view */}
            <div className={selectedChat ? 'chat-view-container' : 'mobile-hidden'} style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--background)' }}>
              {!selectedChat ? (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '1.5rem', opacity: 0.8 }}>
                  <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--surface-container-low)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <MessageSquare size={36} color="var(--primary)" />
                  </div>
                  <span style={{ fontSize: '1.1rem', fontWeight: 500, color: 'var(--on-surface)' }}>{t.selectConv}</span>
                </div>
              ) : (
                <>
                  {/* Chat Header */}
                  {(() => {
                    const currentChat = chats.find(c => c.chatId === selectedChat);
                    return (
                      <div className="chat-header-mobile" style={{ 
                        padding: '1rem 1.5rem', 
                        background: 'var(--surface-container-lowest)', 
                        borderBottom: '1px solid var(--outline-variant)', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'space-between', 
                        zIndex: 5,
                        boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <button 
                            onClick={() => setSelectedChat(null)} 
                            style={{ display: 'block', padding: '0.5rem', background: 'none', border: 'none', color: 'var(--on-surface)', cursor: 'pointer' }}
                            className="mobile-only-btn"
                          >
                            <ArrowLeft size={20} />
                          </button>
                          <div className="avatar" style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'var(--primary-container)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <User size={20} color="var(--primary)" />
                          </div>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--on-surface)' }}>
                                {bot?.platform === 'TELEGRAM'
                                  ? (currentChat?.name || selectedChat)
                                  : (currentChat?.name 
                                      ? (currentChat.realJid || selectedChat).includes('@lid') ? currentChat.name : `+${formatChatId(currentChat.realJid || selectedChat)} (${currentChat.name})`
                                      : ((currentChat?.realJid || selectedChat).includes('@lid') ? 'Скрытый номер' : `+${formatChatId(currentChat?.realJid || selectedChat)}`))}
                              </div>
                              <Edit2 size={12} color="#565e74" style={{ cursor: 'pointer', opacity: 0.7 }} onClick={(e) => handleEditContactName(e, selectedChat, currentChat?.name || '')} />
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#565e74', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#1e7e34' }} />
                              Active ID: {formatChatId(currentChat?.realJid || selectedChat).slice(-4)}...
                            </div>
                          </div>
                        </div>
                        <button onClick={() => handleDeleteChat()} className="btn-action" style={{ padding: '0.5rem 0.8rem', fontSize: '0.8rem', background: '#fdf2f2', color: '#9b1c1c', border: '1px solid #fbd5d5' }}>
                          <Trash2 size={14} /> {t.clearChat}
                        </button>
                      </div>
                    );
                  })()}

                  {/* Messages Area */}
                  <div className="messages-area-mobile" style={{ 
                    flex: 1, 
                    overflowY: 'auto', 
                    padding: '1.5rem', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: '1rem', 
                    scrollBehavior: 'smooth',
                    background: 'var(--background)'
                  }}>
                    {messages.length === 0 ? (
                      <div style={{ margin: 'auto', color: '#565e74', fontSize: '0.9rem', textAlign: 'center' }}>
                        <MessageSquare size={48} style={{ opacity: 0.1, marginBottom: '1rem' }} />
                        <div>{t.noMsgsFound}</div>
                      </div>
                    ) : messages.map((msg, i) => (
                      <div key={i} style={{ display: 'flex', flexDirection: msg.sender === 'bot' ? 'row-reverse' : 'row', gap: '0.75rem', alignItems: 'flex-end', maxWidth: '85%', alignSelf: msg.sender === 'bot' ? 'flex-end' : 'flex-start' }}>
                        <div className={`msg-bubble ${msg.sender === 'bot' ? 'msg-bot' : 'msg-user'}`} style={{
                          padding: '0.8rem 1.2rem',
                          borderRadius: '16px',
                          fontSize: '0.95rem',
                          lineHeight: '1.5',
                          boxShadow: msg.sender === 'bot' ? '0 2px 4px rgba(0,0,0,0.05)' : '0 4px 12px rgba(0,53,39,0.1)',
                          background: msg.sender === 'bot' ? 'var(--surface-container-lowest)' : 'var(--primary)',
                          color: msg.sender === 'bot' ? 'var(--on-surface)' : 'var(--on-primary)',
                          borderBottomRightRadius: msg.sender === 'bot' ? '2px' : '16px',
                          borderBottomLeftRadius: msg.sender === 'bot' ? '16px' : '2px',
                          minWidth: '80px',
                          position: 'relative'
                        }}>
                          <div style={{ paddingRight: msg.sender === 'user' ? '1rem' : '0' }}>{renderMessageContent(msg.text)}</div>
                          <div style={{ 
                            fontSize: '0.6rem', 
                            opacity: 0.6, 
                            marginTop: '0.4rem', 
                            textAlign: 'right',
                            fontWeight: 600,
                            letterSpacing: '0.2px'
                          }}>{formatTime(msg.createdAt)}</div>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Quick Correction & Input Area */}
                  <div className="input-area-mobile" style={{ 
                    padding: '1.2rem 1.5rem', 
                    background: 'var(--surface-container-lowest)', 
                    borderTop: '1px solid var(--outline-variant)', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: '1rem' 
                  }}>
                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', background: 'var(--surface-container-low)', padding: '0.5rem 1rem', borderRadius: '12px', border: '1px solid var(--outline-variant)' }}>
                      <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Bot size={14} color="var(--on-primary)" />
                      </div>
                      <input
                        type="text"
                        style={{ 
                          flex: 1,
                          background: 'transparent',
                          border: 'none',
                          fontSize: '0.85rem',
                          color: '#191c1e',
                          padding: '0.2rem 0',
                          outline: 'none',
                          boxShadow: 'none'
                        }}
                        onFocus={(e) => e.target.style.boxShadow = 'none'}
                        placeholder="Направьте бота (например: 'Будь вежливее')"
                        onKeyDown={async (e) => {
                          if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                            const newInstruction = e.currentTarget.value.trim();
                            const updatedPrompt = systemPrompt + `\n\n=== IMPORTANT CORRECTION ===\n${newInstruction}`;
                            setSystemPrompt(updatedPrompt);
                            e.currentTarget.value = '';
                            await fetch(`${API}/bot/${botId}`, {
                              method: 'PUT',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ system_prompt: updatedPrompt, data_prompt: dataPrompt }),
                              credentials: 'include'
                            });
                          }
                        }}
                      />
                      <div style={{ fontSize: '0.7rem', color: '#565e74', fontWeight: 600, opacity: 0.5 }}>ENTER TO APPLY</div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                      <input
                        type="text"
                        className="premium-input"
                        value={replyText}
                        onChange={e => setReplyText(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
                        placeholder={t.takeOver}
                        style={{ flex: 1, borderRadius: '14px', padding: '0.8rem 1.2rem' }}
                      />
                      <button onClick={handleSend} disabled={!replyText.trim()} className="btn-primary" style={{ width: '48px', height: '48px', borderRadius: '14px', padding: 0, justifyContent: 'center' }}>
                        <Send size={20} />
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

                {/* ══ AGENT TAB ══ */}
        {activeTab === 'agent' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--background)' }}>
            <div style={{ padding: '1.5rem', background: 'var(--surface-container-lowest)', borderBottom: '1px solid var(--outline-variant)' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--on-surface)', display: 'flex', alignItems: 'center', gap: '0.75rem', margin: 0 }}>
                <BrainCircuit size={28} color="var(--primary)" /> Взаимодействие с AI Мозгом
              </h2>
              <p style={{ color: 'var(--on-surface-variant)', fontSize: '0.9rem', marginTop: '0.5rem', marginBottom: 0 }}>
                Общайтесь с агентом напрямую для настройки его поведения и базы знаний.
              </p>
            </div>
            
            <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {agentChatHistory.length === 0 ? (
                <div style={{ margin: 'auto', textAlign: 'center', color: '#565e74' }}>
                  <Bot size={48} style={{ opacity: 0.1, marginBottom: '1rem' }} />
                  <div>Напишите, что нужно изменить в поведении бота.</div>
                </div>
              ) : agentChatHistory.map((msg, i) => (
                <div key={i} style={{ display: 'flex', flexDirection: msg.role === 'user' ? 'row-reverse' : 'row', gap: '0.75rem', maxWidth: '85%', alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                  <div style={{
                    padding: '0.8rem 1.2rem',
                    borderRadius: '16px',
                    fontSize: '0.95rem',
                    background: msg.role === 'user' ? 'var(--primary)' : 'var(--surface-container-lowest)',
                    color: msg.role === 'user' ? 'var(--on-primary)' : 'var(--on-surface)',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                    borderBottomRightRadius: msg.role === 'user' ? '2px' : '16px',
                    borderBottomLeftRadius: msg.role === 'user' ? '16px' : '2px',
                    whiteSpace: 'pre-wrap'
                  }}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {isAgentLoading && (
                <div style={{ alignSelf: 'flex-start', background: 'var(--surface-container-lowest)', padding: '0.8rem 1.2rem', borderRadius: '16px', borderBottomLeftRadius: '2px', color: 'var(--on-surface-variant)', fontSize: '0.9rem' }}>
                  ИИ думает...
                </div>
              )}
            </div>

            <div style={{ padding: '1.5rem', background: 'var(--surface-container-lowest)', borderTop: '1px solid var(--outline-variant)', display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <label className="btn-action" style={{ cursor: 'pointer', opacity: isUploadingPdf ? 0.7 : 1, padding: '0.8rem', background: 'var(--surface-container-high)', color: 'var(--on-surface)', borderRadius: '12px', border: '1px solid var(--outline-variant)' }}>
                <FileUp size={20} />
                <input type="file" accept="application/pdf" style={{ display: 'none' }} onChange={handlePdfUpload} disabled={isUploadingPdf} />
              </label>
              <input
                type="text"
                className="premium-input"
                value={agentInput}
                onChange={e => setAgentInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAgentSend()}
                placeholder="Например: 'Будь более вежливым' или 'Добавь в базу, что мы не работаем по выходным'"
                style={{ flex: 1 }}
                disabled={isAgentLoading}
              />
              <button onClick={handleAgentSend} disabled={!agentInput.trim() || isAgentLoading} className="btn-primary" style={{ padding: '0 1.5rem' }}>
                <Send size={18} /> Отправить
              </button>
            </div>
          </div>
        )}

        {/* ══ SETTINGS TAB ══ */}
        {activeTab === 'settings' && (
          <div style={{ flex: 1, overflowY: 'auto', padding: '3rem 2rem' }}>
            <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
              
              {qrCode && bot.platform === 'WHATSAPP' && (
                <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', marginBottom: '3rem', display: 'flex', flexDirection: 'column', alignItems: 'center', background: '#e6f4ea', borderColor: '#c3e6cb' }}>
                  <h3 style={{ margin: '0 0 1rem', color: '#003527', fontSize: '1.5rem' }}>{t.linkWhatsapp}</h3>
                  <p style={{ color: '#565e74', marginBottom: '2rem' }}>{t.scanQr}</p>
                  <div style={{ background: '#fff', padding: '1rem', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,53,39,0.1)' }}>
                    <img src={qrCode} alt="QR Code" style={{ width: '100%', maxWidth: '260px', height: 'auto', display: 'block' }} />
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.8rem', fontWeight: '800', color: 'var(--on-surface)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Wand2 size={28} color="var(--primary)" /> {t.configAiBot}
                </h2>
                <button onClick={handleSave} disabled={isSaving} className="btn-primary">
                  <Save size={18} /> {isSaving ? t.saving : t.saveChanges}
                </button>
              </div>

              <div className="glass-panel" style={{ padding: '2.5rem', marginBottom: '2rem' }}>
                <h3 style={{ fontSize: '1.4rem', color: 'var(--on-surface)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {t.behavior}
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: '1.5rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--on-surface-variant)', marginBottom: '0.5rem', fontWeight: 600 }}>{t.industry}</label>
                    <CustomSelect options={INDUSTRIES} displayOptions={t.industries} value={industry} onChange={setIndustry} placeholder="..." />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--on-surface-variant)', marginBottom: '0.5rem', fontWeight: 600 }}>{t.companyName}</label>
                    <input className="premium-input" type="text" value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="..." />
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--on-surface-variant)', marginBottom: '0.5rem', fontWeight: 600 }}>{t.companyDesc}</label>
                    <textarea className="premium-input" rows={2} style={{ resize: 'vertical' }} value={companyDescription} onChange={e => setCompanyDescription(e.target.value)} placeholder="..." />
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--on-surface-variant)', marginBottom: '0.5rem', fontWeight: 600 }}>{t.mainProduct}</label>
                    <input className="premium-input" type="text" value={productDescription} onChange={e => setProductDescription(e.target.value)} placeholder="..." />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--on-surface-variant)', marginBottom: '0.5rem', fontWeight: 600 }}>{t.dataToCollect}</label>
                    <CustomMultiSelect options={DATA_FIELDS} displayOptions={t.dataFields} value={dataToCollect} onChange={setDataToCollect} placeholder="..." />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--on-surface-variant)', marginBottom: '0.5rem', fontWeight: 600 }}>{t.tone}</label>
                    <CustomSelect options={TONES} displayOptions={t.tones} value={tone} onChange={setTone} placeholder="..." />
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--on-surface-variant)', marginBottom: '0.5rem', fontWeight: 600 }}>{t.fallback}</label>
                    <CustomSelect options={[translations.RU.fallback_noinfo, translations.RU.fallback_manager, translations.RU.fallback_lead]} displayOptions={[t.fallback_noinfo, t.fallback_manager, t.fallback_lead]} value={fallbackBehavior} onChange={setFallbackBehavior} placeholder="..." />
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--on-surface-variant)', marginBottom: '0.5rem', fontWeight: 600 }}>{t.additionalRules}</label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '16px', background: 'var(--surface-container-low)', borderRadius: '12px', border: '1px solid var(--outline-variant)' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: 'var(--on-surface)' }}>
                        <input type="checkbox" checked={rules.onlyKnowledgeBase} onChange={e => setRules({...rules, onlyKnowledgeBase: e.target.checked})} style={{ width: '18px', height: '18px', accentColor: 'var(--primary)' }} />
                        {t.onlyKb}
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: 'var(--on-surface)' }}>
                        <input type="checkbox" checked={rules.noFabrication} onChange={e => setRules({...rules, noFabrication: e.target.checked})} style={{ width: '18px', height: '18px', accentColor: 'var(--primary)' }} />
                        {t.noFabrication}
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: 'var(--on-surface)' }}>
                        <input type="checkbox" checked={rules.userLanguage} onChange={e => setRules({...rules, userLanguage: e.target.checked})} style={{ width: '18px', height: '18px', accentColor: 'var(--primary)' }} />
                        {t.userLanguage}
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: 'var(--on-surface)' }}>
                        <input type="checkbox" checked={rules.leadToRequest} onChange={e => setRules({...rules, leadToRequest: e.target.checked})} style={{ width: '18px', height: '18px', accentColor: 'var(--primary)' }} />
                        {t.leadToRequest}
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              <div className="glass-panel" style={{ padding: '2.5rem', marginBottom: '3rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                  <h3 style={{ fontSize: '1.4rem', color: 'var(--on-surface)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Database size={24} color="var(--primary)" /> {t.dataBase}
                  </h3>
                  <label className="btn-primary" style={{ cursor: 'pointer', opacity: isUploadingPdf ? 0.7 : 1, padding: '0.6rem 1.2rem', fontSize: '0.85rem' }}>
                    <FileUp size={16} /> {isUploadingPdf ? t.uploading : t.uploadPdf}
                    <input type="file" accept="application/pdf" style={{ display: 'none' }} onChange={handlePdfUpload} disabled={isUploadingPdf} />
                  </label>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.9rem', color: '#aaa', marginBottom: '0.5rem', fontWeight: 500 }}>{t.genInfo}</label>
                    <textarea className="premium-input" rows={3} style={{ resize: 'vertical', width: '100%' }} value={businessInfo} onChange={e => setBusinessInfo(e.target.value)} placeholder={t.genInfoHint} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.9rem', color: '#aaa', marginBottom: '0.5rem', fontWeight: 500 }}>{t.benefits}</label>
                    <textarea className="premium-input" rows={2} style={{ resize: 'vertical', width: '100%' }} value={benefits} onChange={e => setBenefits(e.target.value)} placeholder={t.benefitsHint} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.9rem', color: '#aaa', marginBottom: '0.5rem', fontWeight: 500 }}>{t.pricingTerms}</label>
                    <textarea className="premium-input" rows={3} style={{ resize: 'vertical', width: '100%' }} value={pricing} onChange={e => setPricing(e.target.value)} placeholder={t.pricingHint} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.9rem', color: '#aaa', marginBottom: '0.5rem', fontWeight: 500 }}>{t.managerContact}</label>
                    <input className="premium-input" type="text" value={managerContact} onChange={e => setManagerContact(e.target.value)} placeholder={t.managerContact} style={{ width: '100%' }} />
                  </div>
                  
                  <div style={{ background: 'var(--surface-container-low)', padding: '20px', borderRadius: '12px', border: '1px solid var(--outline-variant)' }}>
                    <label style={{ display: 'block', fontSize: '1rem', color: 'var(--on-surface)', marginBottom: '1rem', fontWeight: 600 }}>{t.faqTitle}</label>
                    {faq.map((item, index) => (
                      <div key={index} style={{ display: 'flex', gap: '12px', marginBottom: '16px', alignItems: 'flex-start' }}>
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <input className="premium-input" type="text" value={item.q} onChange={e => { const newFaq = [...faq]; newFaq[index].q = e.target.value; setFaq(newFaq); }} placeholder="Вопрос" style={{ padding: '0.8rem 1rem', width: '100%' }} />
                          <textarea className="premium-input" rows={2} style={{ padding: '0.8rem 1rem', resize: 'vertical', width: '100%' }} value={item.a} onChange={e => { const newFaq = [...faq]; newFaq[index].a = e.target.value; setFaq(newFaq); }} placeholder="Ответ" />
                        </div>
                        <button type="button" onClick={() => { const newFaq = faq.filter((_, i) => i !== index); setFaq(newFaq.length ? newFaq : [{q:'', a:''}]); }} style={{ padding: '0.8rem', background: 'rgba(255, 77, 79, 0.1)', color: '#ff4d4f', borderRadius: '8px', border: '1px solid rgba(255, 77, 79, 0.2)', cursor: 'pointer' }}>
                          <Trash2 size={20} />
                        </button>
                      </div>
                    ))}
                    <button type="button" onClick={() => setFaq([...faq, { q: '', a: '' }])} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'transparent', border: '1px dashed rgba(255,255,255,0.2)', color: '#fff', padding: '12px', borderRadius: '8px', cursor: 'pointer', width: '100%', justifyContent: 'center', fontWeight: '600' }}>
                      <Plus size={18} /> Добавить вопрос
                    </button>
                  </div>

                  <div style={{ background: 'var(--surface-container-low)', padding: '20px', borderRadius: '12px', border: '1px solid var(--outline-variant)' }}>
                    <label style={{ display: 'block', fontSize: '1rem', color: 'var(--on-surface)', marginBottom: '1rem', fontWeight: 600 }}>{t.usefulLinks}</label>
                    {links.map((item, index) => (
                      <div key={index} style={{ display: 'flex', gap: '12px', marginBottom: '12px', alignItems: 'center' }}>
                        <input className="premium-input" type="text" value={item.title} onChange={e => { const newLinks = [...links]; newLinks[index].title = e.target.value; setLinks(newLinks); }} placeholder="Название (напр. Наш сайт)" style={{ flex: 1, padding: '0.8rem 1rem' }} />
                        <input className="premium-input" type="text" value={item.url} onChange={e => { const newLinks = [...links]; newLinks[index].url = e.target.value; setLinks(newLinks); }} placeholder="https://..." style={{ flex: 2, padding: '0.8rem 1rem' }} />
                        <button type="button" onClick={() => { const newLinks = links.filter((_, i) => i !== index); setLinks(newLinks.length ? newLinks : [{title:'', url:''}]); }} style={{ padding: '0.8rem', background: 'rgba(255, 77, 79, 0.1)', color: '#ff4d4f', borderRadius: '8px', border: '1px solid rgba(255, 77, 79, 0.2)', cursor: 'pointer' }}>
                          <Trash2 size={20} />
                        </button>
                      </div>
                    ))}
                    <button type="button" onClick={() => setLinks([...links, { title: '', url: '' }])} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'transparent', border: '1px dashed rgba(255,255,255,0.2)', color: '#fff', padding: '12px', borderRadius: '8px', cursor: 'pointer', width: '100%', justifyContent: 'center', fontWeight: '600' }}>
                      <Plus size={18} /> Добавить ссылку
                    </button>
                  </div>

                  <div style={{ background: 'var(--surface-container-low)', padding: '20px', borderRadius: '12px', border: '1px solid var(--outline-variant)' }}>
                    <label style={{ display: 'block', fontSize: '1rem', color: 'var(--on-surface)', marginBottom: '0.5rem', fontWeight: 600 }}>{t.quickFact}</label>
                    <p style={{ color: 'var(--on-surface-variant)', fontSize: '0.85rem', marginBottom: '1rem', lineHeight: '1.4' }}>{t.quickFactHint}</p>
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <input className="premium-input" type="text" id="customFactInput" placeholder="Введите информацию..." style={{ flex: 1, padding: '0.8rem 1rem' }} onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const val = e.currentTarget.value;
                          if (val.trim()) { setDataPrompt(prev => prev + '\n\nДополнительный факт: ' + val.trim()); e.currentTarget.value = ''; }
                        }
                      }} />
                      <button type="button" className="btn-primary" onClick={() => {
                        const input = document.getElementById('customFactInput') as HTMLInputElement;
                        if (input && input.value.trim()) {
                          setDataPrompt(prev => prev + '\n\nДополнительный факт: ' + input.value.trim());
                          input.value = '';
                        }
                      }}>
                        <Plus size={18} /> Добавить
                      </button>
                    </div>
                  </div>

                </div>
              </div>

              <div className="glass-panel" style={{ padding: '2.5rem', marginBottom: '3rem', border: '1px solid var(--outline-variant)' }}>
                <h3 style={{ fontSize: '1.4rem', color: 'var(--on-surface)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {t.advancedSettings}
                </h3>
                <p style={{ color: 'var(--on-surface-variant)', fontSize: '0.9rem', marginBottom: '2rem' }}>{t.advancedSettingsSub}</p>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '1rem', color: 'var(--on-surface)', marginBottom: '0.5rem', fontWeight: 600 }}>{t.sysPromptFull}</label>
                    <p style={{ color: 'var(--on-surface-variant)', fontSize: '0.85rem', marginBottom: '1rem', lineHeight: '1.4' }}>{t.sysPromptDesc}</p>
                    <textarea className="premium-input" rows={8} value={systemPrompt} onChange={e => setSystemPrompt(e.target.value)} style={{ resize: 'vertical', fontFamily: 'monospace', background: 'var(--surface-container-low)', color: 'var(--primary)', width: '100%' }} />
                  </div>
                  
                  <div>
                    <label style={{ display: 'block', fontSize: '1rem', color: 'var(--on-surface)', marginBottom: '0.5rem', fontWeight: 600 }}>{t.dataPromptFull}</label>
                    <p style={{ color: 'var(--on-surface-variant)', fontSize: '0.85rem', marginBottom: '1rem', lineHeight: '1.4' }}>{t.dataBaseDesc}</p>
                    <textarea className="premium-input" rows={12} value={dataPrompt} onChange={e => setDataPrompt(e.target.value)} style={{ resize: 'vertical', fontFamily: 'monospace', background: 'var(--surface-container-low)', color: 'var(--primary)', width: '100%' }} />
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

        {activeTab === 'broadcast' && (
          <div className="content-pad" style={{ flex: 1, overflowY: 'auto', padding: '3rem 2rem' }}>
            <style>{`
              @media (max-width: 1024px) { .broadcast-grid { grid-template-columns: 1fr !important; } }
            `}</style>
            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <h1 style={{ fontSize: '2rem', fontWeight: 800, margin: '0 0 0.5rem', color: 'var(--on-surface)' }}>{t.massCamp}</h1>
                  <p style={{ color: 'var(--on-surface-variant)', fontSize: '1rem', margin: 0 }}>{t.massCampSub}</p>
                </div>
              </div>
              
              <div className="broadcast-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.2fr', gap: '2rem', alignItems: 'start' }}>
                {/* 1. Selection from existing contacts */}
                <div className="glass-panel broadcast-panel" style={{ padding: '2rem', minHeight: '400px', display: 'flex', flexDirection: 'column' }}>
                  <h2 style={{ margin: '0 0 1rem', fontSize: '1.1rem', fontWeight: 700, color: 'var(--on-surface)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Users size={18} color="var(--primary)"/> {t.selectFromContacts}
                  </h2>
                  <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                    <input 
                      type="text" 
                      className="premium-input" 
                      style={{ padding: '0.5rem 0.8rem', fontSize: '0.8rem' }} 
                      placeholder={t.searchPlaceholder} 
                      value={contactSearch}
                      onChange={e => setContactSearch(e.target.value)}
                    />
                    <button 
                      onClick={() => {
                        if (selectedBroadcastContacts.length === chats.length) setSelectedBroadcastContacts([]);
                        else setSelectedBroadcastContacts(chats.map(c => c.chatId));
                      }}
                      className="btn-action" 
                      style={{ padding: '0.5rem 1rem', fontSize: '0.75rem', whiteSpace: 'nowrap', background: 'var(--surface-container-high)', color: 'var(--on-surface)' }}
                    >
                      {selectedBroadcastContacts.length === chats.length ? t.deselectAll : t.selectAll}
                    </button>
                  </div>
                  
                  <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.4rem', paddingRight: '0.5rem' }}>
                    {chats.filter(c => (c.name || '').toLowerCase().includes(contactSearch.toLowerCase()) || c.chatId.includes(contactSearch)).map(contact => (
                      <label key={contact.chatId} style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', padding: '0.8rem', borderRadius: '10px', background: selectedBroadcastContacts.includes(contact.chatId) ? 'var(--primary-container)' : 'var(--surface-container-lowest)', cursor: 'pointer', transition: 'all 0.2s', border: selectedBroadcastContacts.includes(contact.chatId) ? '1px solid var(--primary)' : '1px solid var(--outline-variant)' }}>
                        <input 
                          type="checkbox" 
                          checked={selectedBroadcastContacts.includes(contact.chatId)}
                          onChange={() => {
                            if (selectedBroadcastContacts.includes(contact.chatId)) {
                              setSelectedBroadcastContacts(selectedBroadcastContacts.filter(id => id !== contact.chatId));
                            } else {
                              setSelectedBroadcastContacts([...selectedBroadcastContacts, contact.chatId]);
                            }
                          }}
                          style={{ accentColor: '#003527' }}
                        />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--on-surface)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{contact.name || t.unknown}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)' }}>{formatChatId(contact.realJid || contact.chatId)}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                  <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)', fontSize: '0.8rem', color: '#aaa' }}>
                    {t.selectedCount} <strong>{selectedBroadcastContacts.length}</strong>
                  </div>
                </div>

                {/* 2. Manual Input */}
                <div className="glass-panel" style={{ padding: '2rem', minHeight: '400px', display: 'flex', flexDirection: 'column' }}>
                  <h2 style={{ margin: '0 0 1rem', fontSize: '1.1rem', fontWeight: 600, color: 'var(--on-surface)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <UserPlus size={18} color="var(--primary)"/> {t.manualNumbers}
                  </h2>
                  <p style={{ color: '#666', fontSize: '0.8rem', marginBottom: '1rem' }}>{t.enterNumbersHint}</p>
                  <textarea 
                    className="premium-input" 
                    value={broadcastNumbers} 
                    onChange={e => {
                      setBroadcastNumbers(e.target.value);
                      if (e.target.value.trim()) setSelectedBroadcastContacts([]); // Clear selected if typing manually
                    }} 
                    style={{ flex: 1, resize: 'none', fontFamily: 'monospace', fontSize: '0.85rem' }} 
                    placeholder={'77001234567\n79998887766'} 
                  />
                  <div style={{ marginTop: '1rem', fontSize: '0.8rem', color: '#666' }}>
                    {t.manualOverrideNote}
                  </div>
                </div>
                
                {/* 3. Message & Launch */}
                <div className="glass-panel" style={{ padding: '2rem', minHeight: '400px', display: 'flex', flexDirection: 'column' }}>
                  <h2 style={{ margin: '0 0 1rem', fontSize: '1.1rem', fontWeight: 600, color: 'var(--on-surface)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <MessageSquare size={18} color="var(--primary)"/> {t.msgContent}
                  </h2>
                  <textarea className="premium-input" value={broadcastMessage} onChange={e => setBroadcastMessage(e.target.value)} style={{ flex: 1, minHeight: '200px', resize: 'none', marginBottom: '2rem' }} placeholder={t.typeBroadcastMsg} />
                  
                  <div style={{ background: 'var(--primary-container)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--primary)', marginBottom: '1.5rem' }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--on-surface-variant)', marginBottom: '0.5rem' }}>{t.campaignSummary}</div>
                    <div style={{ fontSize: '0.9rem', color: 'var(--on-surface)' }}>{t.recipients} <strong>{broadcastNumbers.trim() ? broadcastNumbers.split('\n').filter(n => n.trim()).length : selectedBroadcastContacts.length}</strong></div>
                  </div>

                  <button 
                    onClick={handleBroadcast} 
                    disabled={isBroadcasting || !broadcastMessage.trim() || (!broadcastNumbers.trim() && selectedBroadcastContacts.length === 0)} 
                    className="btn-primary" 
                    style={{ width: '100%', justifyContent: 'center', padding: '1.2rem', fontSize: '1.1rem' }}
                  >
                    <Radio size={20} /> {isBroadcasting ? t.broadcasting : t.launchCamp}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
