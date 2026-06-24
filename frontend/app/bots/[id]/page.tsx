'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Save, Trash2, Send, Bot, User, Users, UserPlus, Pause, Play, Phone, MessageSquare, Radio, Edit2, Wand2, ChevronDown, Check, Plus, Database, BrainCircuit, FileUp, Image as LucideImage, FileAudio2, X, Mic, BarChart2, Activity, Settings, FileText, Loader2, Link as LinkIcon, Lock, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { io } from 'socket.io-client';
import { useLanguage } from '../../contexts/LanguageContext';
import { translations } from '../../locales/translations';
import { API_URL, API_BASE as CONFIG_API_BASE, SOCKET_URL } from '../../config';
import { useAuth } from '../../contexts/AuthContext';

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
  "Страхование",
  "Право и бухгалтерия",
  "Недвижимость",
  "Ремонт",
  "Строительство",
  "Логистика и транспорт",
  "Производство",
  "IT и технологии",
  "Маркетинг и реклама",
  "Креатив и контент",
  "HR и услуги для бизнеса",
  "Сфера услуг",
  "Торговля",
  "Интернет-магазин",
  "Красота",
  "Медицина и здоровье",
  "Стоматология",
  "Косметология",
  "Фитнес и спорт",
  "Образование",
  "Кафе и кофейни",
  "Ресторанный бизнес",
  "Автомобильный бизнес",
  "Туризм",
  "Отельный бизнес",
  "Финансы",
  "Розничная торговля"
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
  const { language } = useLanguage();
  const t = (translations as any)[language] || translations.RU;
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
  const { language } = useLanguage();
  const t = (translations as any)[language] || translations.RU;
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
  pausedChats?: string[];
}

interface Chat {
  chatId: string;
  lastMessage: string;
  lastAt: string;
  lastSender: string;
  name?: string;
  realJid?: string | null;
  platform?: string;
  status?: string;
  funnelStage?: string;
  unreadCount?: number;
}

interface Message {
  id: number;
  botId: number;
  sender: string;
  text: string;
  chatId: string;
  createdAt: string;
  mediaUrl?: string | null;
  mediaType?: string | null;
}

interface Channel {
  id: number;
  botId: number;
  platform: string;
  apiToken?: string;
  isActive: boolean;
  slug: string;
}


export default function BotDetails() {
  const { language } = useLanguage();
  const t = (translations as any)[language] || translations.RU;
  const { user } = useAuth();
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const botId = params.id as string;

  const [bot, setBot] = useState<BotType | null>(null);
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [systemPrompt, setSystemPrompt] = useState('');
  const [dataPrompt, setDataPrompt] = useState('');
  const [googleSheetUrl, setGoogleSheetUrl] = useState('');
  const [googleSheetColumns, setGoogleSheetColumns] = useState('');
  const [isGoogleSheetsActive, setIsGoogleSheetsActive] = useState(false);
  const [googleCalendarId, setGoogleCalendarId] = useState('');
  const [isGoogleCalendarActive, setIsGoogleCalendarActive] = useState(false);
  const [bitrixWebhookUrl, setBitrixWebhookUrl] = useState('');
  const [bitrixFields, setBitrixFields] = useState('');
  const [isBitrixActive, setIsBitrixActive] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isTogglingActive, setIsTogglingActive] = useState(false);
  const [isRefreshingStatuses, setIsRefreshingStatuses] = useState(false);
  const [isRefreshingChatStatus, setIsRefreshingChatStatus] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);
  const [fileType, setFileType] = useState<'image' | 'audio' | 'document' | null>(null);
  const [activeTab, setActiveTab] = useState<'chats' | 'agent' | 'settings' | 'broadcast' | 'channels' | 'integrations'>('chats');
  const [chatFilter, setChatFilter] = useState('Все');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);

  const toggleRecording = async () => {
    if (isRecording) {
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        mediaRecorder.onstop = () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/ogg; codecs=opus' });
          const audioFile = new File([audioBlob], `voice_message_${Date.now()}.ogg`, { type: 'audio/ogg' });
          setSelectedFile(audioFile);
          setFileType('audio');
          setFilePreviewUrl(null);
          
          stream.getTracks().forEach(track => track.stop());
        };

        mediaRecorder.start();
        setIsRecording(true);
      } catch (error) {
        console.error('Error accessing microphone:', error);
        alert(t.micError || 'Не удалось получить доступ к микрофону. Пожалуйста, проверьте разрешения.');
      }
    }
  };

  // Onboarding Tour state — per-bot, only triggered when arriving from create-bot (?new=true)
  const [tourStep, setTourStep] = useState<number | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !botId) return;
    const isNewBot = searchParams?.get('new') === 'true';
    const tourKey = `up_tour_done_${botId}`;
    const tourDone = localStorage.getItem(tourKey);
    if (isNewBot && !tourDone) {
      // Mark immediately so it never shows again, even if user closes mid-tour
      localStorage.setItem(tourKey, 'true');
      const timer = setTimeout(() => {
        setTourStep(1);
        window.dispatchEvent(new Event('tour_started'));
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [botId, searchParams]);

  const handleNextTourStep = () => {
    if (tourStep === 1) {
      setActiveTab('channels');
      setTourStep(2);
    } else if (tourStep === 2) {
      setActiveTab('agent');
      setTourStep(3);
    } else if (tourStep === 3) {
      setActiveTab('chats');
      setTourStep(4);
    } else if (tourStep === 4) {
      setActiveTab('settings');
      setTourStep(5);
    } else if (tourStep === 5) {
      setTourStep(null);
      localStorage.setItem(`up_tour_done_${botId}`, 'true');
      window.dispatchEvent(new Event('tour_finished'));
    }
  };

  const handleSkipTour = () => {
    setTourStep(null);
    localStorage.setItem(`up_tour_done_${botId}`, 'true');
    window.dispatchEvent(new Event('tour_finished'));
  };

  const [tourPos, setTourPos] = useState({ bottom: 104, right: 24 });
  
  useEffect(() => {
    const handleWidgetMoved = (e: any) => {
      if (e.detail) {
        setTourPos({ 
          bottom: e.detail.bottom + 76,
          right: Math.max(24, e.detail.right - 296)
        });
      }
    };
    window.addEventListener('widget_moved', handleWidgetMoved);
    return () => window.removeEventListener('widget_moved', handleWidgetMoved);
  }, []);
  
  // Channels States
  const [channels, setChannels] = useState<Channel[]>([]);
  const [isAddingChannel, setIsAddingChannel] = useState(false);
  const [newChannelPlatform, setNewChannelPlatform] = useState<string | null>(null);
  const [newChannelToken, setNewChannelToken] = useState('');
  
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
  const [industry, setIndustry] = useState('');
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
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [isLoadingBot, setIsLoadingBot] = useState(true);

  const API_BASE = CONFIG_API_BASE;
  const renderMessageContent = (msg: any) => {
    if (msg.mediaType === 'image') {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <img src={`${API_BASE}${msg.mediaUrl}`} alt="Attached Image" style={{ maxWidth: '100%', maxHeight: '300px', borderRadius: '12px' }} />
          {msg.text && <span style={{ whiteSpace: 'pre-wrap' }}>{msg.text}</span>}
        </div>
      );
    }
    if (msg.mediaType === 'audio') {
      const cleanText = msg.text ? msg.text.replace(/\[AUDIO\]\/uploads\/[^\s\n]+/g, '').replace(/^voice_message_.*\.(webm|ogg)$/, '').replace(/^wa_audio_.*$/, '').replace(/^tg_audio_.*$/, '').trim() : '';
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxWidth: '100%' }}>
          <audio controls style={{ height: '32px', minWidth: '180px', maxWidth: '100%', width: '240px', accentColor: 'var(--primary)' }}>
            <source src={`${API_BASE}${msg.mediaUrl}`} />
            {t.voiceMessage || 'Голосовое сообщение'}
          </audio>
          {cleanText && <span style={{ whiteSpace: 'pre-wrap' }}>{cleanText}</span>}
        </div>
      );
    }
    if (msg.mediaType === 'document') {
      const filename = msg.mediaUrl ? msg.mediaUrl.split('/').pop() : 'document';
      let displayName = filename;
      if (filename.startsWith('wa_doc_') || filename.startsWith('tg_doc_')) {
        const match = filename.match(/^(?:wa_doc|tg_doc)_\d+_(.+)$/);
        if (match) displayName = match[1];
      } else {
        const match = filename.match(/^\d+-\d+(.+)$/);
        if (match) displayName = match[1];
      }
      
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <a 
            href={`${API_BASE}${msg.mediaUrl}`} 
            target="_blank" 
            rel="noopener noreferrer" 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '12px', 
              padding: '12px 16px', 
              background: 'rgba(0, 0, 0, 0.05)', 
              borderRadius: '12px', 
              color: 'inherit',
              textDecoration: 'none',
              fontWeight: 600,
              fontSize: '0.9rem',
              border: '1px solid rgba(0, 0, 0, 0.1)',
              transition: 'background 0.2s',
              cursor: 'pointer'
            }}
            onMouseOver={(e) => e.currentTarget.style.background = 'rgba(0, 0, 0, 0.1)'}
            onMouseOut={(e) => e.currentTarget.style.background = 'rgba(0, 0, 0, 0.05)'}
          >
            <span style={{ fontSize: '1.5rem', flexShrink: 0 }}>📄</span>
            <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 }}>
              <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                {displayName}
              </span>
              <span style={{ fontSize: '0.75rem', opacity: 0.7, fontWeight: 400 }}>
                Открыть / Скачать
              </span>
            </div>
          </a>
          {msg.text && msg.text !== filename && <span style={{ whiteSpace: 'pre-wrap' }}>{msg.text}</span>}
        </div>
      );
    }
    const text = msg.text || '';
    if (!text) return null;
    const parts = text.split(/(\[AUDIO\]\/uploads\/[^\s\n]+)/g);
    return parts.map((part: string, i: number) => {
      if (part.startsWith('[AUDIO]/uploads/')) {
        const filePath = part.replace('[AUDIO]', '');
        const audioUrl = `${API_BASE}${filePath}`;
        const audioExt = audioUrl.split('.').pop()?.toLowerCase() || 'ogg';
        const audioMimeMap: Record<string, string> = {
          ogg: 'audio/ogg',
          mp4: 'audio/mp4',
          m4a: 'audio/mp4',
          mp3: 'audio/mpeg',
          wav: 'audio/wav',
          oga: 'audio/ogg',
        };
        const audioMime = audioMimeMap[audioExt] || 'audio/ogg';
        return (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '12px', padding: '8px 12px', maxWidth: '100%' }}>
            <span style={{ fontSize: '1.2rem', flexShrink: 0 }}>🎤</span>
            <audio
              controls
              preload="metadata"
              playsInline
              style={{ height: '32px', flex: 1, minWidth: '150px', maxWidth: '100%', width: '240px', accentColor: 'var(--primary)' }}
            >
              <source src={audioUrl} type={audioMime} />
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
    // Try multiple patterns for company name
    const companyMatch = prompt.match(/Ты AI-(?:консультант|сотрудник) компании \"?(.*?)\"?(?:\s*\(Сфера:|\.)/i) ||
                         prompt.match(/компании[: ]+"?([^"()\n]+)"?/i);
    if (companyMatch && companyMatch[1] && companyMatch[1] !== '[Название компании]') {
      setCompanyName(companyMatch[1].replace(/"/g, '').trim());
    }
    // Try multiple industry patterns — handle both formats:
    // New format: "Сфера деятельности: Косметология"
    // Create-bot format: "(Сфера: Косметология)"
    let parsedIndustry = '';
    const industryMatch1 = prompt.match(/\(Сфера:\s*([^\)]+)\)/);
    const industryMatch2 = prompt.match(/Сфера деятельности:\s*([^\n]+)/);
    if (industryMatch1 && industryMatch1[1] && industryMatch1[1].trim()) {
      parsedIndustry = industryMatch1[1].trim();
    } else if (industryMatch2 && industryMatch2[1] && industryMatch2[1].trim()) {
      parsedIndustry = industryMatch2[1].replace(/[\.]+$/, '').trim();
    }
    if (parsedIndustry && parsedIndustry !== '[Сфера деятельности]') {
      setIndustry(parsedIndustry);
    }
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

  // Helper: check if a parsed value is a real value or a placeholder
  const isRealValue = (val: string | null | undefined, placeholderKeywords: string[] = []) => {
    if (!val || !val.trim()) return false;
    const lowerVal = val.toLowerCase();
    const defaultKeywords = ['leave blank', 'description]', 'benefits]', 'pricing]', 'example.com', '[name]', '[оставьте пустым', '[append any', '[no real'];
    const allKeywords = [...defaultKeywords, ...placeholderKeywords];
    return !allKeywords.some(kw => lowerVal.includes(kw.toLowerCase()));
  };

  const parseDataPrompt = (prompt: string) => {
    if (!prompt) return;
    const businessInfoMatch = prompt.match(/Описание:\n([\s\S]*?)\n\nПреимущества:/);
    if (businessInfoMatch && isRealValue(businessInfoMatch[1])) setBusinessInfo(businessInfoMatch[1].trim());
    const benefitsMatch = prompt.match(/Преимущества:\n([\s\S]*?)\n\nЦены и условия:/);
    if (benefitsMatch && isRealValue(benefitsMatch[1])) setBenefits(benefitsMatch[1].trim());
    const pricingMatch = prompt.match(/Цены и условия:\n([\s\S]*?)\n\nFAQ:/);
    if (pricingMatch && isRealValue(pricingMatch[1])) setPricing(pricingMatch[1].trim());
    const managerContactMatch = prompt.match(/Контакт менеджера:\n([^\n]*)/);
    if (managerContactMatch && isRealValue(managerContactMatch[1], ['leave blank', 'no real contact', 'оставьте'])) {
      setManagerContact(managerContactMatch[1].trim());
    } else {
      setManagerContact('');
    }
    const faqSectionMatch = prompt.match(/FAQ:\n([\s\S]*?)\n\nПолезные ссылки:/);
    if (faqSectionMatch) {
      const faqText = faqSectionMatch[1].trim();
      // Check if it's a real FAQ (not placeholder)
      if (isRealValue(faqText, ['leave blank', 'no real faq', 'оставьте'])) {
        const faqItems: {q: string; a: string}[] = [];
        const blocks = faqText.split('\n\n');
        for (const block of blocks) {
          const qMatch = block.match(/В: (.*)/);
          const aMatch = block.match(/О: ([\s\S]*)/);
          if (qMatch && aMatch) faqItems.push({ q: qMatch[1], a: aMatch[1] });
        }
        if (faqItems.length > 0) setFaq(faqItems);
        else setFaq([{ q: '', a: '' }]);
      } else {
        setFaq([{ q: '', a: '' }]);
      }
    } else {
      setFaq([{ q: '', a: '' }]);
    }
    const linksSectionMatch = prompt.match(/Полезные ссылки:\n([\s\S]*?)\n\nКонтакт менеджера:/);
    if (linksSectionMatch) {
      const linksText = linksSectionMatch[1].trim();
      if (isRealValue(linksText, ['leave blank', 'no real links', 'оставьте'])) {
        const linksItems: {title: string; url: string}[] = [];
        const lines = linksText.split('\n');
        for (const line of lines) {
          const parts = line.split(': ');
          if (parts.length >= 2) {
            const url = parts.pop()!;
            const title = parts.join(': ');
            if (url.trim() && title.trim()) linksItems.push({ title, url });
          }
        }
        if (linksItems.length > 0) setLinks(linksItems);
        else setLinks([{ title: '', url: '' }]);
      } else {
        setLinks([{ title: '', url: '' }]);
      }
    } else {
      setLinks([{ title: '', url: '' }]);
    }
    const additionalInfoMatch = prompt.match(/Дополнительная информация:\n([\s\S]*)/);
    if (additionalInfoMatch && isRealValue(additionalInfoMatch[1], ['append any large', 'оставьте'])) {
      setAdditionalInfo(additionalInfoMatch[1].trim());
    }
  };

  useEffect(() => {
    if (isLoadingBot) return;
    let rulesText = '';
    if (rules.onlyKnowledgeBase) rulesText += '- Отвечай только на основе информации из базы знаний.\n';
    if (rules.noFabrication) rulesText += '- Не выдумывай информацию.\n';
    rulesText += `- Если ответа нет в базе знаний:\n  ${fallbackBehavior}\n`;
    if (rules.userLanguage) rulesText += '- Отвечай на языке пользователя.\n';
    rulesText += '- Общайся естественно и профессионально.\n';
    if (rules.leadToRequest) rulesText += '- Если это уместно, помогай пользователю оставить заявку или связаться с менеджером.\n';

    const generated = `Ты AI-консультант компании ${companyName || '[Название компании]'}.\n\nСфера деятельности: ${industry}\n\nКомпания занимается:\n${companyDescription || '[Описание компании]'}\n\nОсновной продукт или услуга:\n${productDescription || '[Описание продукта]'}\n\nТвоя задача:\n${botGoal}\n\nДанные, которые необходимо собрать у клиента:\n${dataToCollect.length > 0 ? dataToCollect.join(', ') : 'Не требуется'}\n\nСтиль общения:\n${tone}\n\nОсновные правила:\n${rulesText}`;
    setSystemPrompt(generated);
  }, [isLoadingBot, industry, companyName, companyDescription, productDescription, botGoal, tone, dataToCollect, fallbackBehavior, rules]);

  useEffect(() => {
    let faqText = faq.filter(f => f.q || f.a).map(f => `В: ${f.q}\nО: ${f.a}`).join('\n\n');
    let linksText = links.filter(l => l.title || l.url).map(l => `${l.title}: ${l.url}`).join('\n');
    const generated = `Компания:\n${companyName}\n\nОписание:\n${businessInfo}\n\nПреимущества:\n${benefits}\n\nЦены и условия:\n${pricing}\n\nFAQ:\n${faqText}\n\nПолезные ссылки:\n${linksText}\n\nКонтакт менеджера:\n${managerContact}\n\nДополнительная информация:\n${additionalInfo}`;
    setDataPrompt(generated);
  }, [companyName, businessInfo, benefits, pricing, faq, links, managerContact, additionalInfo]);



  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchBot();
    fetchChats();
    fetchChannels();

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
          platform: newMsg.platform || existing?.platform
        };
        if (existing) return [updated, ...prev.filter(c => c.chatId !== newMsg.chatId)];
        return [updated, ...prev];
      });
    });
    socket.on(`qr-${botId}`, (qr: string) => setQrCode(qr));
    socket.on(`contact-update-${botId}`, (updatedContact: any) => {
      // Update existing chat with ALL fields from updated contact (status, funnelStage, name, etc.)
      setChats(prev => {
        const exists = prev.some(c => c.chatId === updatedContact.chatId);
        if (!exists) return prev; // Don't add empty contact-only chats
        return prev.map(c => {
          if (c.chatId === updatedContact.chatId) {
            return { 
              ...c, 
              name: updatedContact.name || c.name, 
              realJid: updatedContact.realJid || c.realJid,
              status: updatedContact.status || c.status,
              funnelStage: updatedContact.funnelStage || c.funnelStage,
            };
          }
          return c;
        });
      });
    });

    socket.on(`status-${botId}`, (status: string) => {
      if (status === 'connected') { 
        setQrCode(null);
        setIsAddingChannel(false);
        // Small delay to let backend finish updating DB before we re-fetch
        setTimeout(() => {
          fetchBot();
          fetchChats();
          fetchChannels();
        }, 800);
      }
    });

    socket.on(`bot-update-${botId}`, (updates: any) => {
      setBot((prev: any) => {
        if (!prev) return prev;
        return { ...prev, ...updates };
      });
    });

    return () => { socket.disconnect(); };
  }, [botId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (selectedChat) fetchChatMessages(selectedChat);
    
    if (selectedChat && window.innerWidth <= 768) {
      document.body.classList.add('hide-navbar-mobile');
    } else {
      document.body.classList.remove('hide-navbar-mobile');
    }
    return () => document.body.classList.remove('hide-navbar-mobile');
  }, [selectedChat]);

  async function fetchBot() {
    setIsLoadingBot(true);
    const res = await fetch(`${API}/bot/${botId}`, { credentials: 'include' });
    if (res.ok) {
      const data = await res.json();
      setBot(data);
      if (data.system_prompt) parseSystemPrompt(data.system_prompt);
      if (data.data_prompt) parseDataPrompt(data.data_prompt);
      setSystemPrompt(data.system_prompt || '');
      setDataPrompt(data.data_prompt || '');
      setGoogleSheetUrl(data.googleSheetUrl || '');
      setGoogleSheetColumns(data.googleSheetColumns || '');
      setGoogleCalendarId(data.googleCalendarId || '');
      setBitrixWebhookUrl(data.bitrixWebhookUrl || '');
      setBitrixFields(data.bitrixFields || '');
      if (data.agentHistory) {
        try {
          setAgentChatHistory(JSON.parse(data.agentHistory));
        } catch (e) {
          console.error("Failed to parse agent history", e);
        }
      }
      // Release the lock AFTER all state is set — small delay so React batches the sets
      setTimeout(() => setIsLoadingBot(false), 100);
    } else {
      setIsLoadingBot(false);
    }
  }

  async function fetchChats() {
    const res = await fetch(`${API}/bot/${botId}/chats`, { credentials: 'include' });
    if (res.ok) setChats(await res.json());
  }

  async function fetchChannels() {
    const res = await fetch(`${API}/bot/${botId}/channels`, { credentials: 'include' });
    if (res.ok) setChannels(await res.json());
  }

  async function fetchChatMessages(chatId: string) {
    const res = await fetch(`${API}/bot/${botId}/chat?chatId=${encodeURIComponent(chatId)}`, { credentials: 'include' });
    if (res.ok) setMessages(await res.json());
  }

  async function handleSend() {
    if ((!replyText.trim() && !selectedFile) || !selectedChat || isSendingMessage) return;
    
    setIsSendingMessage(true);
    try {
      const formData = new FormData();
      formData.append('chatId', selectedChat);
      if (replyText.trim()) formData.append('text', replyText);
      if (selectedFile) formData.append('file', selectedFile);

      const res = await fetch(`${API}/bot/${botId}/send`, {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });
      
      if (res.ok) {
        setReplyText('');
        setSelectedFile(null);
        setFilePreviewUrl(null);
        setFileType(null);
      } else {
        alert((t.sendError || 'Failed to send: ') + (await res.json().catch(() => ({}))).error);
      }
    } finally {
      setIsSendingMessage(false);
    }
  }

  async function handleToggleActive() {
    if (!bot) return;
    setIsTogglingActive(true);
    const endpoint = bot.isActive ? 'pause' : 'start';
    const res = await fetch(`${API}/bot/${botId}/${endpoint}`, { method: 'POST', credentials: 'include' });
    if (res.ok) await fetchBot();
    else alert(t.statusChangeError || 'Error changing bot status');
    setIsTogglingActive(false);
  }

  async function handleSave() {
    setIsSaving(true);
    await fetch(`${API}/bot/${botId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        system_prompt: systemPrompt, 
        data_prompt: dataPrompt,
        googleSheetUrl,
        googleSheetColumns,
        googleCalendarId,
        bitrixWebhookUrl,
        bitrixFields
      }),
      credentials: 'include'
    });
    setIsSaving(false);
    setIsGoogleSheetsActive(false);
    setIsGoogleCalendarActive(false);
    setIsBitrixActive(false);
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
          body: JSON.stringify({ 
            system_prompt: systemPrompt, 
            data_prompt: newDataPrompt,
            googleSheetUrl,
            googleSheetColumns,
            googleCalendarId,
            bitrixWebhookUrl,
            bitrixFields
          }),
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

  async function handleToggleChatPause(chatId: string) {
    if (!bot) return;
    const isPaused = bot.pausedChats?.includes(chatId);
    const endpoint = isPaused ? 'resume' : 'pause';
    
    const res = await fetch(`${API}/bot/${botId}/chat/${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chatId }),
      credentials: 'include'
    });
    if (res.ok) {
      await fetchBot();
    } else {
      alert('Ошибка изменения статуса');
    }
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
          overflow-y: hidden;
          white-space: nowrap;
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

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @media (min-width: 769px) {
          .mobile-only-btn { display: none !important; }
        }

        @media (max-width: 768px) {
          .top-bar {
            padding: 0.75rem 1rem;
            gap: 0.75rem;
            flex-wrap: wrap;
          }
          .top-bar .btn-action {
            padding: 0.4rem 0.8rem;
            font-size: 0.75rem;
          }
          .tab-bar {
            padding: 0 1rem;
          }
          .tab-btn {
            padding: 0.75rem 1rem;
            font-size: 0.8rem;
          }
          .contacts-sidebar { width: 100%; border-right: none; }
          .chat-view-container { 
            background: var(--background); 
            display: flex;
            flex-direction: column;
            flex: 1;
            height: 100%;
            width: 100vw;
            max-width: 100vw;
          }
          .mobile-hidden { display: none !important; }
          .mobile-only-btn { display: flex; align-items: center; justify-content: center; }
          .content-pad { padding: 1rem !important; }
          .msg-bubble {
            max-width: 100%;
            padding: 0.6rem 0.8rem;
            font-size: 0.85rem;
            word-break: break-word;
            overflow-wrap: anywhere;
          }
          .messages-area-mobile {
            padding: 1rem !important;
            box-sizing: border-box !important;
          }
          .chat-header-mobile {
            padding: 0.8rem 1rem !important;
            box-sizing: border-box !important;
          }
          .input-area-mobile {
            padding: 0.8rem 1rem !important;
            box-sizing: border-box !important;
          }
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
          <Link href={`/bots/${botId}/analytics`} className="btn-action" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--surface-container-high)', color: 'var(--primary)', fontWeight: 600, padding: '0.5rem 1rem', borderRadius: '10px', textDecoration: 'none' }}>
            <BarChart2 size={16} /> ИИ-Аналитика
          </Link>
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
        {([
          ['chats', <MessageSquare size={16} />, t.chats || 'Dialogs'],
          ['channels', <Phone size={16} />, t.channels || 'Channels'],
          ['agent', <BrainCircuit size={16} />, t.aiBrain || 'AI Brain'], 
          ['integrations', <Activity size={16} />, 'Интеграции'],
          ['settings', <Settings size={16} />, t.settings || 'Configuration'], 
          ['broadcast', <Radio size={16} />, t.campaigns]
        ] as const)
        .filter(([tab]) => tab !== 'broadcast' || (user?.subscriptionPlan === 'GROWTH' || user?.subscriptionPlan === 'PRO'))
        .map(([tab, icon, label]) => (
          <button key={tab} onClick={() => setActiveTab(tab as any)} className={`tab-btn ${activeTab === tab ? 'active' : ''}`}>
            {icon} {label}
          </button>
        ))}
      </div>

      {/* ─── CONTENT ─── */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex' }}>

        {/* ══ CHANNELS TAB ══ */}
        {activeTab === 'channels' && (
          <div style={{ padding: '2.5rem', flex: 1, overflowY: 'auto', background: 'radial-gradient(circle at top right, var(--surface-container-low) 0%, var(--surface-container-lowest) 100%)' }}>
            <div style={{ maxWidth: '850px', margin: '0 auto' }}>
              
              {/* Header section */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem', borderBottom: '1px solid var(--outline-variant)', paddingBottom: '1.5rem' }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 800, color: 'var(--on-surface)', letterSpacing: '-0.5px' }}>
                    {t.channelsTitle || 'Communication Channels'}
                  </h2>
                  <p style={{ margin: '0.4rem 0 0 0', color: 'var(--on-surface-variant)', fontSize: '0.92rem' }}>
                    {t.channelsSub || 'Connect external messengers for automated AI responses.'}
                  </p>
                </div>
                {!isAddingChannel && (
                  <button 
                    onClick={() => setIsAddingChannel(true)} 
                    className="btn-primary" 
                    style={{ 
                      padding: '0.75rem 1.5rem', 
                      borderRadius: '14px', 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '0.6rem', 
                      fontSize: '0.92rem',
                      boxShadow: '0 4px 15px rgba(0, 77, 57, 0.15)',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    <Plus size={18} /> {t.connectNewChannel || 'Connect new channel'}
                  </button>
                )}
              </div>

              {/* No channels view */}
              {channels.length === 0 && !isAddingChannel && (
                <div style={{ 
                  textAlign: 'center', 
                  padding: '5rem 3rem', 
                  background: 'rgba(255, 255, 255, 0.03)', 
                  backdropFilter: 'blur(10px)',
                  borderRadius: '28px', 
                  border: '2px dashed var(--outline-variant)',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.02)'
                }}>
                  <div style={{ 
                    width: '80px', 
                    height: '80px', 
                    background: 'var(--surface-container-highest)', 
                    borderRadius: '24px', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    margin: '0 auto 2rem auto',
                    boxShadow: '0 8px 20px rgba(0,0,0,0.05)',
                    transform: 'rotate(-5deg)'
                  }}>
                    <Phone size={36} color="var(--primary)" />
                  </div>
                  <h3 style={{ margin: '0 0 0.8rem 0', fontSize: '1.4rem', fontWeight: 700, color: 'var(--on-surface)' }}>{t.noChannels || 'No active channels'}</h3>
                  <p style={{ color: 'var(--on-surface-variant)', marginBottom: '2rem', fontSize: '1rem', maxWidth: '460px', margin: '0 auto 2rem auto', lineHeight: '1.6' }}>
                    {t.noChannelsHint || 'Connect Telegram Bot or WhatsApp so your AI assistant can instantly respond to clients 24/7.'}
                  </p>
                  <button 
                    onClick={() => setIsAddingChannel(true)} 
                    className="btn-primary" 
                    style={{ padding: '0.9rem 2rem', borderRadius: '14px', margin: '0 auto', fontSize: '1rem' }}
                  >
                    Connect first channel
                  </button>
                </div>
              )}

              {/* Active Channels Grid */}
              {!isAddingChannel && channels.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '1.8rem' }}>
                  {channels.map(channel => {
                    const isTg = channel.platform === 'TELEGRAM';
                    const isIg = channel.platform === 'INSTAGRAM';
                    return (
                      <div 
                        key={channel.id} 
                        style={{ 
                          background: 'var(--surface-container)', 
                          borderRadius: '20px', 
                          padding: '1.8rem', 
                          border: `1px solid ${channel.isActive ? 'var(--primary-container)' : 'var(--outline-variant)'}`, 
                          position: 'relative', 
                          overflow: 'hidden',
                          boxShadow: channel.isActive 
                            ? '0 10px 25px rgba(0, 77, 57, 0.04), 0 1px 3px rgba(0,0,0,0.02)' 
                            : '0 4px 12px rgba(0,0,0,0.01)',
                          transition: 'all 0.3s ease',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          minHeight: '180px'
                        }}
                      >
                        {channel.isActive && (
                          <div style={{ 
                            position: 'absolute', 
                            top: 0, 
                            left: 0, 
                            right: 0, 
                            height: '5px', 
                            background: isTg 
                              ? 'linear-gradient(90deg, #3aabea 0%, #229ed9 100%)' 
                              : isIg ? 'linear-gradient(90deg, #F58529 0%, #DD2A7B 50%, #8134AF 100%)'
                              : 'linear-gradient(90deg, #62d886 0%, #25d366 100%)'
                          }} />
                        )}
                        
                        <div>
                          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem' }}>
                              <div style={{ 
                                width: '56px', 
                                height: '56px', 
                                borderRadius: '16px', 
                                background: isTg 
                                  ? 'rgba(34, 158, 217, 0.08)' 
                                  : isIg ? 'rgba(225, 48, 108, 0.08)' : 'rgba(37, 211, 102, 0.08)', 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center',
                                border: `1px solid ${isTg ? 'rgba(34, 158, 217, 0.15)' : isIg ? 'rgba(225, 48, 108, 0.15)' : 'rgba(37, 211, 102, 0.15)'}`
                              }}>
                                {isTg ? (
                                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#229ed9" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="22" y1="2" x2="11" y2="13"></line>
                                    <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                                  </svg>
                                ) : isIg ? (
                                  <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#E1306C" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                                    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
                                  </svg>
                                ) : (
                                  <svg width="30" height="30" viewBox="0 0 24 24" fill="#25d366">
                                    <path d="M12.01 2C6.48 2 2 6.48 2 12.01C2 13.86 2.5 15.6 3.39 17.12L2.01 22.01L7.04 20.72C8.5 21.54 10.19 22.01 12 22.01C17.53 22.01 22 17.53 22 12.01C22 6.48 17.53 2 12.01 2ZM17.19 15.61C16.98 16.2 16.03 16.71 15.46 16.82C14.99 16.91 14.37 16.97 12.31 16.12C9.66 15.02 7.95 12.33 7.82 12.15C7.69 11.97 6.74 10.71 6.74 9.41C6.74 8.11 7.4 7.47 7.67 7.21C7.94 6.95 8.38 6.84 8.81 6.84C8.95 6.84 9.07 6.85 9.17 6.85C9.47 6.86 9.62 7.04 9.72 7.28L10.51 9.19C10.6 9.4 10.69 9.63 10.55 9.91C10.41 10.19 10.3 10.32 10.1 10.55L9.61 11.12C9.46 11.29 9.3 11.47 9.49 11.8C9.68 12.12 10.33 13.18 11.29 14.04C12.53 15.15 13.55 15.5 13.9 15.65C14.23 15.79 14.43 15.76 14.62 15.54C14.86 15.26 15.39 14.62 15.72 14.15C15.98 13.78 16.3 13.84 16.63 13.96L18.66 14.96C18.99 15.12 19.22 15.2 19.3 15.34C19.38 15.48 19.38 16.15 19.1 16.74C18.82 17.33 17.47 17.9 16.88 17.9C16.88 17.9 16.89 17.9 16.88 17.9C16.88 17.9 12.63 17.06 17.19 15.61Z"/>
                                  </svg>
                                )}
                              </div>
                              <div>
                                <div style={{ fontWeight: 800, fontSize: '1.25rem', color: 'var(--on-surface)' }}>
                                  {isTg ? (t.telegramBot || 'Telegram Bot') : isIg ? (t.instagramApi || 'Instagram API') : (t.whatsappClient || 'WhatsApp Client')}
                                </div>
                                <div style={{ fontSize: '0.82rem', color: 'var(--on-surface-variant)', fontFamily: 'monospace', background: 'var(--surface-container-high)', padding: '2px 8px', borderRadius: '6px', display: 'inline-block', marginTop: '0.2rem' }}>
                                  ID: {channel.slug}
                                </div>
                              </div>
                            </div>
                            
                            {/* Live pulse dot */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <span style={{ 
                                width: '8px', 
                                height: '8px', 
                                borderRadius: '50%', 
                                background: channel.isActive ? '#25d366' : '#dc3545',
                                boxShadow: channel.isActive ? '0 0 8px rgba(37,211,102,0.6)' : 'none'
                              }} />
                              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: channel.isActive ? '#1e7e34' : '#9b1c1c' }}>
                                {channel.isActive ? (t.connected || 'Connected') : (t.paused || 'Paused')}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem', paddingTop: '1.2rem', borderTop: '1px solid var(--outline-variant)' }}>
                          <span style={{ fontSize: '0.82rem', color: 'var(--on-surface-variant)' }}>
                            {t.msgReception || 'Message Reception Control'}
                          </span>
                          <div style={{ display: 'flex', gap: '0.6rem' }}>
                            <button 
                              onClick={async () => {
                                await fetch(`${API}/bot/${botId}/channels/${channel.id}/toggle`, { method: 'POST', credentials: 'include' });
                                fetchChannels();
                              }} 
                              className={`btn-action`}
                              style={{ 
                                background: channel.isActive ? 'rgba(0,0,0,0.04)' : 'var(--primary-container)', 
                                border: 'none', 
                                color: channel.isActive ? 'var(--on-surface)' : 'var(--on-primary-container)', 
                                cursor: 'pointer', 
                                padding: '0.5rem 0.8rem', 
                                borderRadius: '10px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.4rem',
                                fontSize: '0.82rem',
                                fontWeight: 600,
                                transition: 'all 0.2s'
                              }}
                            >
                              {channel.isActive ? <><Pause size={14} /> {t.paused || 'Pause'}</> : <><Play size={14} /> {t.startAgent || 'Start'}</>}
                            </button>
                            <button 
                              onClick={async () => {
                                if (!confirm(t.deleteChannelConfirm || 'Are you sure you want to disconnect and delete this communication channel?')) return;
                                await fetch(`${API}/bot/${botId}/channels/${channel.id}`, { method: 'DELETE', credentials: 'include' });
                                fetchChannels();
                              }} 
                              style={{ 
                                background: 'rgba(220, 53, 69, 0.08)', 
                                border: 'none', 
                                color: '#dc3545', 
                                cursor: 'pointer', 
                                padding: '0.5rem', 
                                borderRadius: '10px',
                                transition: 'all 0.2s'
                              }}
                              title="Delete Channel"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Add New Channel Wizard */}
              {isAddingChannel && (
                <div style={{ 
                  background: 'var(--surface-container)', 
                  borderRadius: '24px', 
                  padding: '2.5rem', 
                  border: '1px solid var(--outline-variant)',
                  boxShadow: '0 20px 40px rgba(0,0,0,0.05)'
                }}>
                  {/* Wizard Header */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem', marginBottom: '2.5rem' }}>
                    <button 
                      onClick={() => { setIsAddingChannel(false); setNewChannelPlatform(null); setNewChannelToken(''); setQrCode(null); }} 
                      style={{ 
                        background: 'var(--surface-container-high)', 
                        border: 'none', 
                        color: 'var(--on-surface)', 
                        cursor: 'pointer',
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'transform 0.2s',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                      }}
                    >
                      <ArrowLeft size={18} />
                    </button>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800 }}>
                        {!newChannelPlatform ? (t.platformSelection || 'Platform Selection') : newChannelPlatform === 'TELEGRAM' ? (t.connectTelegram || 'Connect Telegram') : newChannelPlatform === 'INSTAGRAM' ? (t.connectInstagram || 'Connect Instagram') : (t.connectWhatsapp || 'Connect WhatsApp')}
                      </h3>
                      <p style={{ margin: '0.2rem 0 0 0', color: 'var(--on-surface-variant)', fontSize: '0.85rem' }}>
                        {!newChannelPlatform ? (t.selectMessenger || 'Select messenger for integration') : (t.stepToConnect || 'Step to connect bot to your account')}
                      </p>
                    </div>
                  </div>

                  {/* Step 1: Select Platform */}
                  {!newChannelPlatform ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.8rem' }}>
                      
                      {/* Telegram selection card */}
                      <div 
                        onClick={() => setNewChannelPlatform('TELEGRAM')} 
                        style={{ 
                          padding: '2.5rem 2rem', 
                          borderRadius: '24px', 
                          border: '2px solid var(--outline-variant)', 
                          cursor: 'pointer', 
                          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', 
                          textAlign: 'center',
                          background: 'var(--surface-container-low)'
                        }} 
                        className="channel-select-card"
                      >
                        <div style={{ 
                          width: '72px', 
                          height: '72px', 
                          background: 'rgba(34, 158, 217, 0.06)', 
                          borderRadius: '50%', 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center', 
                          margin: '0 auto 1.5rem auto',
                          border: '1px solid rgba(34, 158, 217, 0.12)',
                          boxShadow: '0 8px 20px rgba(34,158,217,0.05)'
                        }}>
                          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#229ed9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="22" y1="2" x2="11" y2="13"></line>
                            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                          </svg>
                        </div>
                        <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1.3rem', fontWeight: 700 }}>Telegram Bot</h4>
                        <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--on-surface-variant)', lineHeight: '1.5' }}>
                          {t.tgDescription || 'Ideal for official bots, broadcasts, buttons, and channels.'}
                        </p>
                      </div>

                      {/* WhatsApp selection card */}
                      <div 
                        onClick={() => setNewChannelPlatform('WHATSAPP')} 
                        style={{ 
                          padding: '2.5rem 2rem', 
                          borderRadius: '24px', 
                          border: '2px solid var(--outline-variant)', 
                          cursor: 'pointer', 
                          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', 
                          textAlign: 'center',
                          background: 'var(--surface-container-low)'
                        }} 
                        className="channel-select-card"
                      >
                        <div style={{ 
                          width: '72px', 
                          height: '72px', 
                          background: 'rgba(37, 211, 102, 0.06)', 
                          borderRadius: '50%', 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center', 
                          margin: '0 auto 1.5rem auto',
                          border: '1px solid rgba(37, 211, 102, 0.12)',
                          boxShadow: '0 8px 20px rgba(37,211,102,0.05)'
                        }}>
                          <svg width="38" height="38" viewBox="0 0 24 24" fill="#25d366">
                            <path d="M12.01 2C6.48 2 2 6.48 2 12.01C2 13.86 2.5 15.6 3.39 17.12L2.01 22.01L7.04 20.72C8.5 21.54 10.19 22.01 12 22.01C17.53 22.01 22 17.53 22 12.01C22 6.48 17.53 2 12.01 2ZM17.19 15.61C16.98 16.2 16.03 16.71 15.46 16.82C14.99 16.91 14.37 16.97 12.31 16.12C9.66 15.02 7.95 12.33 7.82 12.15C7.69 11.97 6.74 10.71 6.74 9.41C6.74 8.11 7.4 7.47 7.67 7.21C7.94 6.95 8.38 6.84 8.81 6.84C8.95 6.84 9.07 6.85 9.17 6.85C9.47 6.86 9.62 7.04 9.72 7.28L10.51 9.19C10.6 9.4 10.69 9.63 10.55 9.91C10.41 10.19 10.3 10.32 10.1 10.55L9.61 11.12C9.46 11.29 9.3 11.47 9.49 11.8C9.68 12.12 10.33 13.18 11.29 14.04C12.53 15.15 13.55 15.5 13.9 15.65C14.23 15.79 14.43 15.76 14.62 15.54C14.86 15.26 15.39 14.62 15.72 14.15C15.98 13.78 16.3 13.84 16.63 13.96L18.66 14.96C18.99 15.12 19.22 15.2 19.3 15.34C19.38 15.48 19.38 16.15 19.1 16.74C18.82 17.33 17.47 17.9 16.88 17.9C16.88 17.9 16.89 17.9 16.88 17.9C16.88 17.9 12.63 17.06 17.19 15.61Z"/>
                          </svg>
                        </div>
                        <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1.3rem', fontWeight: 700 }}>WhatsApp</h4>
                        <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--on-surface-variant)', lineHeight: '1.5' }}>
                          {t.waDescription || 'Direct work with personal numbers. Quick start via QR scanning.'}
                        </p>
                      </div>

                      {searchParams?.get('test_instagram') === 'true' && (
                        <div 
                          onClick={() => setNewChannelPlatform('INSTAGRAM')} 
                          style={{ 
                            padding: '2.5rem 2rem', 
                            borderRadius: '24px', 
                            border: '2px solid var(--outline-variant)', 
                            cursor: 'pointer', 
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', 
                            textAlign: 'center',
                            background: 'var(--surface-container-low)'
                          }} 
                          className="channel-select-card"
                        >
                          <div style={{ 
                            width: '72px', 
                            height: '72px', 
                            background: 'rgba(225, 48, 108, 0.06)', 
                            borderRadius: '50%', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center', 
                            margin: '0 auto 1.5rem auto',
                            border: '1px solid rgba(225, 48, 108, 0.12)',
                            boxShadow: '0 8px 20px rgba(225,48,108,0.05)'
                          }}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#E1306C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                              <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                              <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
                            </svg>
                          </div>
                          <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1.3rem', fontWeight: 700 }}>Instagram</h4>
                          <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--on-surface-variant)', lineHeight: '1.5' }}>
                            {t.igDescription || 'Test connection of Instagram channel via Meta API.'}
                          </p>
                        </div>
                      )}
                      
                      <style>{`
                        .channel-select-card:hover { 
                          border-color: var(--primary) !important; 
                          transform: translateY(-5px); 
                          background: var(--surface-container-high) !important;
                          box-shadow: 0 12px 24px rgba(0,0,0,0.06);
                        }
                      `}</style>
                    </div>
                  ) : newChannelPlatform === 'TELEGRAM' ? (
                    
                    /* Telegram Setup Steps */
                    <div>
                      <div style={{ background: 'rgba(34, 158, 217, 0.05)', border: '1px solid rgba(34, 158, 217, 0.15)', padding: '1.8rem', borderRadius: '20px', marginBottom: '2rem' }}>
                        <h4 style={{ margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#229ed9', fontWeight: 700 }}>
                          {t.connectTelegram || 'Instructions for connecting Telegram'}
                        </h4>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                          <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                            <div style={{ background: '#229ed9', color: '#fff', width: '22px', height: '22px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 800, flexShrink: 0, marginTop: '2px' }}>1</div>
                            <div style={{ fontSize: '0.92rem', lineHeight: '1.5' }}>
                              Open Telegram and go to the official bot <a href="https://t.me/BotFather" target="_blank" rel="noopener noreferrer" style={{ color: '#229ed9', fontWeight: 700, textDecoration: 'underline' }}>@BotFather</a>
                            </div>
                          </div>
                          
                          <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                            <div style={{ background: '#229ed9', color: '#fff', width: '22px', height: '22px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 800, flexShrink: 0, marginTop: '2px' }}>2</div>
                            <div style={{ fontSize: '0.92rem', lineHeight: '1.5' }}>
                              {t.tgStep2 || 'Send him the command /newbot to create a new bot'}
                            </div>
                          </div>

                          <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                            <div style={{ background: '#229ed9', color: '#fff', width: '22px', height: '22px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 800, flexShrink: 0, marginTop: '2px' }}>3</div>
                            <div style={{ fontSize: '0.92rem', lineHeight: '1.5' }}>
                              {t.tgStep3 || 'Give the bot a name and a unique username (ending in _bot)'}
                            </div>
                          </div>

                          <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                            <div style={{ background: '#229ed9', color: '#fff', width: '22px', height: '22px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 800, flexShrink: 0, marginTop: '2px' }}>4</div>
                            <div style={{ fontSize: '0.92rem', lineHeight: '1.5' }}>
                              {t.tgStep4 || 'Copy the API Token and enter it in the field below'}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div style={{ marginBottom: '1.8rem' }}>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.6rem', color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          {t.telegramToken || 'Bot Token (API HTTP Token)'}
                        </label>
                        <input 
                          type="text" 
                          value={newChannelToken} 
                          onChange={e => setNewChannelToken(e.target.value)} 
                          placeholder="Example: 123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11" 
                          className="premium-input" 
                          style={{ width: '100%', padding: '1rem 1.2rem', fontSize: '0.98rem' }} 
                        />
                      </div>

                      <button 
                        disabled={!newChannelToken.trim() || isSaving}
                        className="btn-primary" 
                        style={{ width: '100%', padding: '1rem', borderRadius: '14px', justifyContent: 'center', fontSize: '1rem', fontWeight: 700 }}
                        onClick={async () => {
                          setIsSaving(true);
                          const res = await fetch(`${API}/bot/${botId}/channels`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ platform: 'TELEGRAM', apiToken: newChannelToken }),
                            credentials: 'include'
                          });
                          setIsSaving(false);
                          if (res.ok) {
                            setIsAddingChannel(false);
                            setNewChannelPlatform(null);
                            setNewChannelToken('');
                            fetchChannels();
                          } else {
                            alert((await res.json()).error || 'Invalid bot token or connection error');
                          }
                        }}
                      >
                        {isSaving ? (t.saving || 'Connecting...') : (t.connectTelegram || 'Connect Telegram Bot')}
                      </button>
                    </div>
                  ) : newChannelPlatform === 'INSTAGRAM' ? (
                    <div>
                      <div style={{ background: 'rgba(225, 48, 108, 0.05)', border: '1px solid rgba(225, 48, 108, 0.15)', padding: '1.8rem', borderRadius: '20px', marginBottom: '2rem' }}>
                        <h4 style={{ margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#E1306C', fontWeight: 700 }}>
                          {t.connectInstagram || 'Connect Instagram API'}
                        </h4>
                        <p style={{ fontSize: '0.92rem', lineHeight: '1.5', color: 'var(--on-surface-variant)' }}>
                          {t.metaTokenHint || 'Enter Meta API settings to connect Instagram account (Page Access Token).'}
                        </p>
                      </div>
                      
                      <div style={{ marginBottom: '1.8rem' }}>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.6rem', color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          {t.metaPageToken || 'Meta Page Access Token'}
                        </label>
                        <input 
                          type="text" 
                          value={newChannelToken} 
                          onChange={e => setNewChannelToken(e.target.value)} 
                          placeholder="EAA..." 
                          className="premium-input" 
                          style={{ width: '100%', padding: '1rem 1.2rem', fontSize: '0.98rem' }} 
                        />
                      </div>

                      <button 
                        disabled={!newChannelToken.trim() || isSaving}
                        className="btn-primary" 
                        style={{ width: '100%', padding: '1rem', borderRadius: '14px', justifyContent: 'center', fontSize: '1rem', fontWeight: 700, background: '#E1306C', color: '#fff', border: 'none' }}
                        onClick={async () => {
                          setIsSaving(true);
                          const res = await fetch(`${API}/bot/${botId}/channels`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ platform: 'INSTAGRAM', apiToken: newChannelToken }),
                            credentials: 'include'
                          });
                          setIsSaving(false);
                          if (res.ok) {
                            setIsAddingChannel(false);
                            setNewChannelPlatform(null);
                            setNewChannelToken('');
                            fetchChannels();
                          } else {
                            alert((await res.json()).error || 'Invalid token or connection error');
                          }
                        }}
                      >
                        {isSaving ? (t.saving || 'Connecting...') : (t.connectInstagram || 'Connect Instagram')}
                      </button>
                    </div>
                  ) : (
                    
                    /* WhatsApp Setup Steps & QR Scanner */
                    <div>
                      {!qrCode ? (
                        <div style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
                          <div style={{ 
                            width: '64px', 
                            height: '64px', 
                            borderRadius: '50%', 
                            background: 'rgba(37, 211, 102, 0.05)', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center', 
                            margin: '0 auto 1.5rem auto' 
                          }}>
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="#25d366">
                              <path d="M12.01 2C6.48 2 2 6.48 2 12.01C2 13.86 2.5 15.6 3.39 17.12L2.01 22.01L7.04 20.72C8.5 21.54 10.19 22.01 12 22.01C17.53 22.01 22 17.53 22 12.01C22 6.48 17.53 2 12.01 2ZM17.19 15.61C16.98 16.2 16.03 16.71 15.46 16.82C14.99 16.91 14.37 16.97 12.31 16.12C9.66 15.02 7.95 12.33 7.82 12.15C7.69 11.97 6.74 10.71 6.74 9.41C6.74 8.11 7.4 7.47 7.67 7.21C7.94 6.95 8.38 6.84 8.81 6.84C8.95 6.84 9.07 6.85 9.17 6.85C9.47 6.86 9.62 7.04 9.72 7.28L10.51 9.19C10.6 9.4 10.69 9.63 10.55 9.91C10.41 10.19 10.3 10.32 10.1 10.55L9.61 11.12C9.46 11.29 9.3 11.47 9.49 11.8C9.68 12.12 10.33 13.18 11.29 14.04C12.53 15.15 13.55 15.5 13.9 15.65C14.23 15.79 14.43 15.76 14.62 15.54C14.86 15.26 15.39 14.62 15.72 14.15C15.98 13.78 16.3 13.84 16.63 13.96L18.66 14.96C18.99 15.12 19.22 15.2 19.3 15.34C19.38 15.48 19.38 16.15 19.1 16.74C18.82 17.33 17.47 17.9 16.88 17.9C16.88 17.9 16.89 17.9 16.88 17.9C16.88 17.9 12.63 17.06 17.19 15.61Z"/>
                            </svg>
                          </div>
                          <h4 style={{ fontSize: '1.2rem', fontWeight: 700, margin: '0 0 0.5rem 0' }}>{t.qrGenTitle || 'QR Code Generation'}</h4>
                          <p style={{ color: 'var(--on-surface-variant)', fontSize: '0.95rem', marginBottom: '2rem', maxWidth: '380px', margin: '0 auto 2rem auto', lineHeight: '1.6' }}>
                            {t.waDescription || 'To connect WhatsApp session, we will generate a secure QR code web interface.'}
                          </p>
                          <button 
                            className="btn-primary" 
                            style={{ padding: '0.9rem 2.2rem', borderRadius: '14px', margin: '0 auto', display: 'flex', alignItems: 'center', gap: '0.6rem' }}
                            onClick={async () => {
                              const res = await fetch(`${API}/bot/${botId}/channels`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ platform: 'WHATSAPP' }),
                                credentials: 'include'
                              });
                              if (res.ok) fetchChannels(); // Socket will send QR code
                            }}
                          >
                            {t.generateQR || 'Generate QR code'}
                          </button>
                        </div>
                      ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '2.5rem', alignItems: 'center' }}>
                          <div>
                            <h4 style={{ margin: '0 0 1rem 0', color: '#25d366', fontWeight: 700 }}>
                              {t.howToScanQr || 'How to scan QR code'}
                            </h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                              <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                                <div style={{ background: '#25d366', color: '#fff', width: '22px', height: '22px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 800, flexShrink: 0, marginTop: '2px' }}>1</div>
                                <div style={{ fontSize: '0.92rem', lineHeight: '1.5' }}>
                                  {t.waStep1 || 'Open WhatsApp on your phone'}
                                </div>
                              </div>
                              <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                                <div style={{ background: '#25d366', color: '#fff', width: '22px', height: '22px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 800, flexShrink: 0, marginTop: '2px' }}>2</div>
                                <div style={{ fontSize: '0.92rem', lineHeight: '1.5' }}>
                                  {t.waStep2 || 'Go to Menu (three dots) or Settings → Linked Devices'}
                                </div>
                              </div>
                              <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                                <div style={{ background: '#25d366', color: '#fff', width: '22px', height: '22px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 800, flexShrink: 0, marginTop: '2px' }}>3</div>
                                <div style={{ fontSize: '0.92rem', lineHeight: '1.5' }}>
                                  {t.waStep3 || "Click the 'Link a Device' button and point your phone camera at the screen"}
                                </div>
                              </div>
                            </div>
                            
                            <div style={{ 
                              marginTop: '2rem', 
                              padding: '1rem 1.2rem', 
                              background: 'var(--surface-container-high)', 
                              borderRadius: '12px',
                              borderLeft: '4px solid #25d366',
                              fontSize: '0.85rem',
                              color: 'var(--on-surface-variant)',
                              lineHeight: '1.5'
                            }}>
                              {t.qrImportant || '🔔 Important: Do not close the page until scanning is complete. The session will connect automatically.'}
                            </div>
                          </div>
                          
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                            <div style={{ 
                              display: 'inline-block', 
                              background: 'white', 
                              padding: '1.2rem', 
                              borderRadius: '24px', 
                              boxShadow: '0 20px 45px rgba(37,211,102,0.15)',
                              border: '3px solid #25d366',
                              position: 'relative'
                            }}>
                              <img src={qrCode} alt="WhatsApp QR" style={{ width: '240px', height: '240px', display: 'block' }} />
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1.5rem' }}>
                              <span style={{ 
                                width: '8px', 
                                height: '8px', 
                                borderRadius: '50%', 
                                background: 'var(--primary)',
                                animation: 'pulse 1.5s infinite' 
                              }} />
                              <span>
                                {t.waitingPhone || 'Waiting for connection from phone...'}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}


        {/* ══ CHATS TAB ══ */}
        {activeTab === 'chats' && (
          <div style={{ display: 'flex', width: '100%', height: '100%' }}>
            
            {/* Contacts sidebar */}
            <div className={`contacts-sidebar ${selectedChat ? 'mobile-hidden' : ''}`}>
              <div style={{ padding: '1.2rem', borderBottom: '1px solid #e0e3e5', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--on-surface-variant)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{t.conversations}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span
                      title="ИИ анализирует диалоги и обновляет статусы автоматически каждые 15 минут"
                      style={{ fontSize: '0.7rem', color: 'var(--on-surface-variant)', opacity: 0.6, cursor: 'help', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                      15 мин
                    </span>
                    <button
                      onClick={async () => {
                        setIsRefreshingStatuses(true);
                        try {
                          const res = await fetch(`${API}/bot/${botId}/refresh-statuses`, { method: 'POST', credentials: 'include' });
                          if (res.ok) {
                            await fetchChats();
                          }
                        } catch(e) { console.error(e); }
                        finally { setIsRefreshingStatuses(false); }
                      }}
                      disabled={isRefreshingStatuses}
                      title="Обновить статусы всех диалогов прямо сейчас"
                      style={{
                        padding: '0.3rem 0.6rem',
                        borderRadius: '8px',
                        border: '1px solid var(--outline-variant)',
                        background: 'var(--surface-container-high)',
                        color: 'var(--primary)',
                        cursor: isRefreshingStatuses ? 'wait' : 'pointer',
                        fontSize: '0.72rem',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                        transition: 'all 0.2s',
                        opacity: isRefreshingStatuses ? 0.6 : 1
                      }}
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ animation: isRefreshingStatuses ? 'spin 1s linear infinite' : 'none' }}><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
                      {isRefreshingStatuses ? 'Анализирую...' : 'Обновить статусы'}
                    </button>
                    <span style={{ background: 'var(--primary-container)', color: 'var(--on-primary-container)', padding: '0.2rem 0.6rem', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 700 }}>{chats.length}</span>
                  </div>
                </div>
                
                <div style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', top: '50%', left: '12px', transform: 'translateY(-50%)', color: 'var(--on-surface-variant)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                  </div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Поиск по имени или номеру"
                    className="premium-input"
                    style={{ paddingLeft: '38px', borderRadius: '12px', background: 'var(--surface-container-low)', border: 'none', height: '42px', fontSize: '0.9rem' }}
                  />
                </div>
                
                <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.2rem', scrollbarWidth: 'none' }}>
                  {['Все', 'Нужен ответ', 'Вручную'].map(filter => (
                    <button
                      key={filter}
                      onClick={() => setChatFilter(filter)}
                      style={{
                        padding: '0.4rem 0.8rem',
                        borderRadius: '20px',
                        border: 'none',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        background: chatFilter === filter ? 'rgba(37, 211, 102, 0.15)' : 'var(--surface-container-high)',
                        color: chatFilter === filter ? '#1e7e34' : 'var(--on-surface-variant)',
                        transition: 'all 0.2s'
                      }}
                    >
                      {filter}
                    </button>
                  ))}
                </div>
              </div>
              
              <div style={{ flex: 1, overflowY: 'auto' }}>
                {chats.filter(c => {
                  if (chatFilter === 'Вручную') {
                    if (!bot?.pausedChats?.includes(c.chatId)) return false;
                  } else if (chatFilter !== 'Все') {
                    if (c.status !== chatFilter) return false;
                  }
                  
                  if (searchQuery) {
                    const q = searchQuery.toLowerCase();
                    const nameMatch = c.name?.toLowerCase().includes(q);
                    const idMatch = c.chatId.toLowerCase().includes(q) || c.realJid?.toLowerCase().includes(q);
                    if (!nameMatch && !idMatch) return false;
                  }
                  return true;
                }).length === 0 ? (
                  <div style={{ padding: '3rem 2rem', textAlign: 'center', color: 'var(--on-surface-variant)' }}>
                    <MessageSquare size={32} style={{ opacity: 0.5, marginBottom: '1rem' }} />
                    <div style={{ fontSize: '0.9rem' }}>Диалоги не найдены</div>
                  </div>
                ) : chats.filter(c => {
                  if (chatFilter === 'Вручную') {
                    if (!bot?.pausedChats?.includes(c.chatId)) return false;
                  } else if (chatFilter !== 'Все') {
                    if (c.status !== chatFilter) return false;
                  }
                  
                  if (searchQuery) {
                    const q = searchQuery.toLowerCase();
                    const nameMatch = c.name?.toLowerCase().includes(q);
                    const idMatch = c.chatId.toLowerCase().includes(q) || c.realJid?.toLowerCase().includes(q);
                    if (!nameMatch && !idMatch) return false;
                  }
                  return true;
                }).map(chat => (
                  <div key={chat.chatId} onClick={() => setSelectedChat(chat.chatId)} className={`chat-item ${selectedChat === chat.chatId ? 'active' : ''}`}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div className="avatar" style={{ position: 'relative' }}>
                        <User size={18} color={selectedChat === chat.chatId ? 'var(--primary)' : 'var(--on-surface-variant)'} />
                        {chat.platform === 'TELEGRAM' && (
                          <div style={{ 
                            position: 'absolute', 
                            bottom: '-4px', 
                            right: '-4px', 
                            background: 'linear-gradient(135deg, #3aabea 0%, #229ed9 100%)', 
                            borderRadius: '50%', 
                            width: '18px', 
                            height: '18px', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center', 
                            border: '2px solid var(--surface-container-lowest)',
                            boxShadow: '0 2px 5px rgba(34,158,217,0.4)'
                          }}>
                            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                              <line x1="22" y1="2" x2="11" y2="13"></line>
                              <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                            </svg>
                          </div>
                        )}
                        {chat.platform === 'WHATSAPP' && (
                          <div style={{ 
                            position: 'absolute', 
                            bottom: '-4px', 
                            right: '-4px', 
                            background: 'linear-gradient(135deg, #62d886 0%, #25d366 100%)', 
                            borderRadius: '50%', 
                            width: '18px', 
                            height: '18px', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center', 
                            border: '2px solid var(--surface-container-lowest)',
                            boxShadow: '0 2px 5px rgba(37,211,102,0.4)'
                          }}>
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="#fff">
                              <path d="M12.01 2C6.48 2 2 6.48 2 12.01C2 13.86 2.5 15.6 3.39 17.12L2.01 22.01L7.04 20.72C8.5 21.54 10.19 22.01 12 22.01C17.53 22.01 22 17.53 22 12.01C22 6.48 17.53 2 12.01 2ZM17.19 15.61C16.98 16.2 16.03 16.71 15.46 16.82C14.99 16.91 14.37 16.97 12.31 16.12C9.66 15.02 7.95 12.33 7.82 12.15C7.69 11.97 6.74 10.71 6.74 9.41C6.74 8.11 7.4 7.47 7.67 7.21C7.94 6.95 8.38 6.84 8.81 6.84C8.95 6.84 9.07 6.85 9.17 6.85C9.47 6.86 9.62 7.04 9.72 7.28L10.51 9.19C10.6 9.4 10.69 9.63 10.55 9.91C10.41 10.19 10.3 10.32 10.1 10.55L9.61 11.12C9.46 11.29 9.3 11.47 9.49 11.8C9.68 12.12 10.33 13.18 11.29 14.04C12.53 15.15 13.55 15.5 13.9 15.65C14.23 15.79 14.43 15.76 14.62 15.54C14.86 15.26 15.39 14.62 15.72 14.15C15.98 13.78 16.3 13.84 16.63 13.96L18.66 14.96C18.99 15.12 19.22 15.2 19.3 15.34C19.38 15.48 19.38 16.15 19.1 16.74C18.82 17.33 17.47 17.9 16.88 17.9C16.88 17.9 16.89 17.9 16.88 17.9C16.88 17.9 12.63 17.06 17.19 15.61Z"/>
                            </svg>
                          </div>
                        )}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', overflow: 'hidden' }}>
                            <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--on-surface)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {chat.platform === 'TELEGRAM' 
                                ? (chat.name || chat.chatId)
                                : (chat.name 
                                    ? (chat.realJid || chat.chatId).includes('@lid') ? chat.name : `+${formatChatId(chat.realJid || chat.chatId)} (${chat.name})`
                                    : ((chat.realJid || chat.chatId).includes('@lid') ? (t.hiddenNumber || 'Hidden number') : `+${formatChatId(chat.realJid || chat.chatId)}`))}
                            </div>
                            <Edit2 size={12} color="#666" style={{ cursor: 'pointer', opacity: 0.7, flexShrink: 0 }} onClick={(e) => handleEditContactName(e, chat.chatId, chat.name || '')} />
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 600 }}>{formatTime(chat.lastAt)}</div>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', overflow: 'hidden', maxWidth: '75%' }}>
                            {bot?.pausedChats?.includes(chat.chatId) && (
                              <div 
                                title="ИИ приостановлен. Вы перехватили управление этим чатом. ИИ больше не будет отвечать, пока вы не нажмете кнопку 'Возобновить ИИ'."
                                style={{ 
                                background: '#fdf2f2', 
                                color: '#9b1c1c', 
                                padding: '2px 6px', 
                                borderRadius: '4px', 
                                fontSize: '0.7rem', 
                                fontWeight: 600,
                                whiteSpace: 'nowrap',
                                cursor: 'help'
                              }}>
                                Вручную
                              </div>
                            )}
                            {(chat.status && chat.status !== 'Все' && !['Успех', 'Успешно'].includes(chat.status) && chat.status !== chat.funnelStage) && (
                              <div 
                                title={chat.status === 'Нужен ответ' ? "ИИ не смог ответить или клиент ждет реакции человека." : "Текущий статус чата."}
                                style={{ 
                                background: chat.status === 'Нужен ответ' ? '#fee2e2' : 'var(--surface-container-high)', 
                                color: chat.status === 'Нужен ответ' ? '#991b1b' : 'var(--on-surface-variant)', 
                                padding: '2px 6px', 
                                borderRadius: '4px', 
                                fontSize: '0.7rem', 
                                fontWeight: 600,
                                whiteSpace: 'nowrap',
                                cursor: 'help'
                              }}>
                                {chat.status}
                              </div>
                            )}
                            {chat.funnelStage && (
                              <div 
                                title={
                                  chat.funnelStage === 'Лид' ? 'Новый контакт. ИИ только начал общение.' :
                                  chat.funnelStage === 'Квалификация' ? 'ИИ задает вопросы, чтобы понять потребности клиента.' :
                                  chat.funnelStage === 'Презентация' ? 'ИИ рассказывает о товарах, услугах или ценах.' :
                                  chat.funnelStage === 'Отработка возражений' ? 'Клиент сомневается, ИИ отрабатывает возражения.' :
                                  chat.funnelStage === 'Согласие' ? 'Клиент готов к покупке или записи.' :
                                  chat.funnelStage === 'Успешно' ? 'Сделка или запись успешно завершена!' :
                                  chat.funnelStage === 'Отказ' ? 'Клиент отказался от услуг или перестал отвечать.' :
                                  'Текущий этап клиента в воронке продаж.'
                                }
                                style={{ 
                                background: 'rgba(59, 130, 246, 0.1)', 
                                color: '#2563eb', 
                                padding: '2px 6px', 
                                borderRadius: '4px', 
                                fontSize: '0.7rem', 
                                fontWeight: 600,
                                whiteSpace: 'nowrap',
                                cursor: 'help'
                              }}>
                                {chat.funnelStage}
                              </div>
                            )}
                            <div style={{ fontSize: '0.8rem', color: 'var(--on-surface-variant)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {chat.lastSender === 'bot' && <span style={{ color: 'var(--primary)', marginRight: '4px', fontWeight: 600 }}>AI:</span>}
                              {chat.lastMessage}
                            </div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            {(chat.unreadCount || 0) > 0 && (
                              <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#25d366', color: '#fff', fontSize: '0.7rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                {chat.unreadCount}
                              </div>
                            )}
                            <Trash2 size={14} color="#444" style={{ cursor: 'pointer', opacity: 0.5 }} onClick={(e) => { e.stopPropagation(); handleDeleteChat(chat.chatId); }} />
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
                                {currentChat?.platform === 'TELEGRAM'
                                  ? (currentChat?.name || selectedChat)
                                  : (currentChat?.name 
                                      ? (currentChat.realJid || selectedChat).includes('@lid') ? currentChat.name : `+${formatChatId(currentChat.realJid || selectedChat)} (${currentChat.name})`
                                      : ((currentChat?.realJid || selectedChat).includes('@lid') ? (t.hiddenNumber || 'Hidden number') : `+${formatChatId(currentChat?.realJid || selectedChat)}`))}
                              </div>
                              <Edit2 size={12} color="#565e74" style={{ cursor: 'pointer', opacity: 0.7 }} onClick={(e) => handleEditContactName(e, selectedChat, currentChat?.name || '')} />
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#565e74', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#1e7e34' }} />
                              {t.activeId || 'Active ID'}: {formatChatId(currentChat?.realJid || selectedChat).slice(-4)}...
                            </div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button 
                            onClick={() => selectedChat && handleToggleChatPause(selectedChat)} 
                            className="btn-action" 
                            style={{ 
                              padding: '0.5rem 0.8rem', 
                              fontSize: '0.8rem', 
                              background: bot?.pausedChats?.includes(selectedChat) ? '#fff8eb' : '#f0fdf4', 
                              color: bot?.pausedChats?.includes(selectedChat) ? '#b45309' : '#15803d', 
                              border: `1px solid ${bot?.pausedChats?.includes(selectedChat) ? '#fcd34d' : '#bbf7d0'}`
                            }}
                          >
                            {bot?.pausedChats?.includes(selectedChat) ? <><Play size={14} /> {t.turnOnAi || 'Turn on AI'}</> : <><Pause size={14} /> {t.turnOffAi || 'Turn off AI'}</>}
                          </button>
                          <button
                            onClick={async () => {
                              if (!selectedChat) return;
                              setIsRefreshingChatStatus(true);
                              try {
                                const encodedId = encodeURIComponent(selectedChat);
                                await fetch(`${API}/bot/${botId}/refresh-status/${encodedId}`, { method: 'POST', credentials: 'include' });
                                await fetchChats();
                              } catch(e) { console.error(e); }
                              finally { setIsRefreshingChatStatus(false); }
                            }}
                            disabled={isRefreshingChatStatus}
                            title="Обновить статус этого диалога прямо сейчас"
                            className="btn-action"
                            style={{ padding: '0.5rem 0.8rem', fontSize: '0.8rem', background: '#f0f4ff', color: '#3b57eb', border: '1px solid #c7d2fe', display: 'flex', alignItems: 'center', gap: '0.3rem', opacity: isRefreshingChatStatus ? 0.6 : 1 }}
                          >
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ animation: isRefreshingChatStatus ? 'spin 1s linear infinite' : 'none' }}><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
                            {isRefreshingChatStatus ? '...' : 'Статус'}
                          </button>
                          <button onClick={() => handleDeleteChat()} className="btn-action" style={{ padding: '0.5rem 0.8rem', fontSize: '0.8rem', background: '#fdf2f2', color: '#9b1c1c', border: '1px solid #fbd5d5' }}>
                            <Trash2 size={14} /> {t.clearChat}
                          </button>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Messages Area */}
                  <div className="messages-area-mobile" style={{ 
                    flex: 1, 
                    overflowX: 'hidden',
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
                      <div key={i} style={{ display: 'flex', flexDirection: msg.sender === 'bot' ? 'row-reverse' : 'row', gap: '0.75rem', alignItems: 'flex-end', maxWidth: '95%', alignSelf: msg.sender === 'bot' ? 'flex-end' : 'flex-start' }}>
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
                          <div style={{ paddingRight: msg.sender === 'user' ? '1rem' : '0' }}>{renderMessageContent(msg)}</div>
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
                        placeholder={t.directBot || "Direct the bot (e.g. 'Be more polite')"}
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
                      <div style={{ fontSize: '0.7rem', color: '#565e74', fontWeight: 600, opacity: 0.5 }}>{t.enterToApply || 'ENTER TO APPLY'}</div>
                    </div>
                    {selectedFile && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem', background: 'var(--surface-container-low)', borderRadius: '12px', border: '1px solid var(--outline-variant)' }}>
                        {fileType === 'image' && filePreviewUrl && (
                          <img src={filePreviewUrl} alt="Preview" style={{ height: '100px', borderRadius: '8px', objectFit: 'cover' }} />
                        )}
                        {fileType === 'audio' && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem' }}>
                            <FileAudio2 size={24} color="var(--primary)" />
                            <span style={{ fontSize: '0.85rem', color: 'var(--on-surface)' }}>{selectedFile.name}</span>
                          </div>
                        )}
                        {fileType === 'document' && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem' }}>
                            <FileUp size={24} color="var(--primary)" />
                            <span style={{ fontSize: '0.85rem', color: 'var(--on-surface)' }}>{selectedFile.name}</span>
                          </div>
                        )}
                        <button 
                          onClick={() => { setSelectedFile(null); setFilePreviewUrl(null); setFileType(null); }}
                          style={{ background: 'none', border: 'none', color: 'var(--error)', cursor: 'pointer', marginLeft: 'auto', padding: '0.5rem' }}
                        >
                          <X size={20} />
                        </button>
                      </div>
                    )}
                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                      <label style={{ cursor: 'pointer', padding: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--on-surface-variant)', transition: 'color 0.2s' }}>
                        <LucideImage size={24} />
                        <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => {
                          if (e.target.files && e.target.files[0]) {
                            const file = e.target.files[0];
                            setSelectedFile(file);
                            setFileType('image');
                            setFilePreviewUrl(URL.createObjectURL(file));
                          }
                          e.target.value = '';
                        }} />
                      </label>
                      <label style={{ cursor: 'pointer', padding: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--on-surface-variant)', transition: 'color 0.2s' }}>
                        <FileAudio2 size={24} />
                        <input type="file" accept="audio/*" style={{ display: 'none' }} onChange={e => {
                          if (e.target.files && e.target.files[0]) {
                            const file = e.target.files[0];
                            setSelectedFile(file);
                            setFileType('audio');
                            setFilePreviewUrl(null);
                          }
                          e.target.value = '';
                        }} />
                      </label>
                      <label style={{ cursor: 'pointer', padding: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--on-surface-variant)', transition: 'color 0.2s' }}>
                        <FileUp size={24} />
                        <input type="file" accept=".pdf,.docx,.txt,.doc,.xls,.xlsx,.ppt,.pptx" style={{ display: 'none' }} onChange={e => {
                          if (e.target.files && e.target.files[0]) {
                            const file = e.target.files[0];
                            setSelectedFile(file);
                            setFileType('document');
                            setFilePreviewUrl(null);
                          }
                          e.target.value = '';
                        }} />
                      </label>
                      <button
                        onClick={toggleRecording}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          padding: '0.5rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: isRecording ? 'var(--error)' : 'var(--on-surface-variant)',
                          transition: 'all 0.2s',
                          animation: isRecording ? 'pulse 1.5s infinite' : 'none'
                        }}
                      >
                        {isRecording ? <div style={{ width: 12, height: 12, background: 'var(--error)', borderRadius: 2 }} /> : <Mic size={24} />}
                      </button>
                      <input
                        type="text"
                        className="premium-input"
                        value={replyText}
                        onChange={e => setReplyText(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
                        placeholder={t.takeOver}
                        style={{ flex: 1, borderRadius: '14px', padding: '0.8rem 1.2rem' }}
                      />
                      <button onClick={handleSend} disabled={(!replyText.trim() && !selectedFile) || isSendingMessage} className="btn-primary" style={{ width: '48px', height: '48px', borderRadius: '14px', padding: 0, justifyContent: 'center' }}>
                        {isSendingMessage ? <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={20} />}
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
                <BrainCircuit size={28} color="var(--primary)" /> {t.interactionBrain || 'Interaction with AI Brain'}
              </h2>
              <p style={{ color: 'var(--on-surface-variant)', fontSize: '0.9rem', marginTop: '0.5rem', marginBottom: 0 }}>
                {t.agentTabDesc || 'Communicate with the agent directly to configure its behavior and knowledge base.'}
              </p>
            </div>
            
            <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {agentChatHistory.length === 0 ? (
                <div style={{ margin: 'auto', textAlign: 'center', color: '#565e74' }}>
                  <Bot size={48} style={{ opacity: 0.1, marginBottom: '1rem' }} />
                  <div>{t.writeChanges || 'Write what needs to be changed in the bots behavior.'}</div>
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
                  {t.aiThinking || 'AI is thinking...'}
                </div>
              )}
            </div>

            <div style={{ padding: '1.5rem', background: 'var(--surface-container-lowest)', borderTop: '1px solid var(--outline-variant)', display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <label className="btn-action" style={{ cursor: 'pointer', opacity: isUploadingPdf ? 0.7 : 1, padding: '0.8rem', background: 'var(--surface-container-high)', color: 'var(--on-surface)', borderRadius: '12px', border: '1px solid var(--outline-variant)' }}>
                <FileUp size={20} />
                <input type="file" accept="application/pdf" style={{ display: 'none' }} onChange={handlePdfUpload} disabled={isUploadingPdf} />
              </label>
              <textarea
                className="premium-input"
                rows={3}
                value={agentInput}
                onChange={e => setAgentInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAgentSend(); } }}
                placeholder={t.agentInputPlaceholder || "Example: 'Be more polite' or 'Add to the database that we do not work on weekends'"}
                style={{ flex: 1, resize: 'vertical' }}
                disabled={isAgentLoading}
              />
              <button onClick={handleAgentSend} disabled={!agentInput.trim() || isAgentLoading} className="btn-primary" style={{ padding: '0 1.5rem' }}>
                <Send size={18} /> {t.send || 'Send'}
              </button>
            </div>
          </div>
        )}

        {/* ══ INTEGRATIONS TAB ══ */}
        {activeTab === 'integrations' && (
          <div style={{ flex: 1, overflowY: 'auto', padding: '3rem 2rem', background: 'var(--background)' }}>
            <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
              <div style={{ marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.8rem', fontWeight: '800', color: 'var(--on-surface)', display: 'flex', alignItems: 'center', gap: '12px', margin: '0 0 0.5rem 0' }}>
                  <Activity size={28} color="var(--primary)" /> Интеграции
                </h2>
                <p style={{ color: 'var(--on-surface-variant)', margin: 0 }}>Подключите сторонние сервисы и CRM для автоматической передачи лидов.</p>
              </div>

              {(!user || !['PRO', 'GROWTH'].includes(user?.subscriptionPlan || '')) ? (
                <div style={{ background: 'var(--surface)', border: '1px solid var(--outline-variant)', borderRadius: '24px', padding: '4rem 2rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ width: '80px', height: '80px', background: 'var(--primary-container)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
                    <Lock size={40} color="var(--primary)" />
                  </div>
                  <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--on-surface)', margin: '0 0 1rem 0' }}>Интеграции недоступны</h3>
                  <p style={{ color: 'var(--on-surface-variant)', fontSize: '1rem', maxWidth: '500px', margin: '0 0 2rem 0', lineHeight: 1.5 }}>
                    Подключение Google Sheets, amoCRM и Zapier доступно только на тарифах <b>GROWTH</b> и <b>PRO</b>. Перейдите на более продвинутый тариф, чтобы автоматизировать передачу лидов.
                  </p>
                  <Link href="/profile" className="btn-primary" style={{ textDecoration: 'none', padding: '1rem 2rem', fontSize: '1rem' }}>
                    Улучшить тариф
                  </Link>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
                  {/* Google Sheets Card */}
                  {(!isGoogleCalendarActive && !isBitrixActive) && (
                  <div style={{ background: 'var(--surface)', border: '1px solid var(--outline-variant)', borderRadius: '20px', padding: '1.5rem', display: 'flex', flexDirection: 'column', transition: 'all 0.3s ease' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                      <div style={{ width: '48px', height: '48px', background: 'rgba(16, 163, 127, 0.1)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <FileText size={24} color="#10a37f" />
                      </div>
                      <div>
                        <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--on-surface)' }}>Google Sheets</h3>
                        <div style={{ fontSize: '0.8rem', color: '#10a37f', fontWeight: 600 }}>Легкая CRM</div>
                      </div>
                    </div>
                    <p style={{ color: 'var(--on-surface-variant)', fontSize: '0.9rem', marginBottom: '1.5rem', flex: 1 }}>
                      Автоматически выгружайте собранные ИИ лиды и данные прямо в вашу таблицу Excel.
                    </p>

                    {!isGoogleSheetsActive ? (
                      <button 
                        onClick={() => setIsGoogleSheetsActive(true)}
                        style={{ width: '100%', padding: '0.8rem', borderRadius: '12px', border: googleSheetUrl ? '1px solid transparent' : '1px solid #10a37f', background: googleSheetUrl ? '#10a37f' : 'rgba(16, 163, 127, 0.1)', color: googleSheetUrl ? '#fff' : '#10a37f', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s ease', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                        onMouseOver={(e) => e.currentTarget.style.opacity = '0.8'}
                        onMouseOut={(e) => e.currentTarget.style.opacity = '1'}
                      >
                        {googleSheetUrl ? <><CheckCircle2 size={16} /> Подключено (Настроить)</> : 'Подключить интеграцию'}
                      </button>
                    ) : (
                      <div style={{ overflow: 'hidden', animation: 'slideDown 0.4s ease-out forwards' }}>
                        <button onClick={() => setIsGoogleSheetsActive(false)} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: '1px solid var(--outline-variant)', borderRadius: '8px', padding: '6px 14px', cursor: 'pointer', color: 'var(--on-surface-variant)', fontSize: '0.85rem', marginBottom: '1rem' }}>
                          <ArrowLeft size={14} /> Назад
                        </button>
                        {/* Инструкция Шаг 1 */}
                        <div style={{ background: 'var(--surface-container-lowest)', padding: '1rem', borderRadius: '12px', marginBottom: '1rem', borderLeft: '4px solid #10a37f' }}>
                          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--on-surface)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ background: '#10a37f', color: '#fff', width: '20px', height: '20px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', fontSize: '12px' }}>1</span>
                            Создайте Гугл Таблицу
                          </div>
                          <p style={{ color: 'var(--on-surface-variant)', fontSize: '0.85rem', marginBottom: '0.5rem', lineHeight: '1.4' }}>
                            Зайдите в <a href="https://docs.google.com/spreadsheets" target="_blank" rel="noopener noreferrer" style={{ color: '#10a37f', textDecoration: 'underline' }}>Google Таблицы</a> и создайте пустой файл (или откройте существующий). 
                            В первой строке напишите названия колонок (например: <b>Имя</b>, <b>Телефон</b>, <b>Услуга</b>, <b>Дата</b>).
                          </p>
                        </div>

                        {/* Инструкция Шаг 2 */}
                        <div style={{ background: 'var(--surface-container-lowest)', padding: '1rem', borderRadius: '12px', marginBottom: '1rem', borderLeft: '4px solid #10a37f' }}>
                          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--on-surface)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ background: '#10a37f', color: '#fff', width: '20px', height: '20px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', fontSize: '12px' }}>2</span>
                            Выдайте доступ нашему боту
                          </div>
                          <p style={{ color: 'var(--on-surface-variant)', fontSize: '0.85rem', marginBottom: '0.8rem', lineHeight: '1.4' }}>
                            Чтобы ИИ мог добавлять туда заявки, в вашей таблице в правом верхнем углу нажмите зеленую кнопку <b>«Настройки доступа» (Поделиться)</b>. Вставьте туда этот специальный email и обязательно выберите роль <b>«Редактор»</b>:
                          </p>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <code style={{ background: 'rgba(16, 163, 127, 0.1)', padding: '8px 12px', borderRadius: '6px', userSelect: 'all', wordBreak: 'break-all', border: '1px solid rgba(16, 163, 127, 0.2)', width: '100%', display: 'block', color: '#10a37f', fontWeight: 600 }}>chatflowbot@gen-lang-client-0537370402.iam.gserviceaccount.com</code>
                          </div>
                        </div>

                        {/* Инструкция Шаг 3 */}
                        <div style={{ background: 'var(--surface-container-lowest)', padding: '1rem', borderRadius: '12px', marginBottom: '1rem', borderLeft: '4px solid #10a37f' }}>
                          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--on-surface)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ background: '#10a37f', color: '#fff', width: '20px', height: '20px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', fontSize: '12px' }}>3</span>
                            Вставьте ссылку на таблицу
                          </div>
                          <p style={{ color: 'var(--on-surface-variant)', fontSize: '0.85rem', marginBottom: '0.5rem', lineHeight: '1.4' }}>
                            Скопируйте ссылку на вашу таблицу из адресной строки браузера (она длинная, начинается с https://docs.google.com/...) и вставьте сюда:
                          </p>
                          <input 
                            type="text"
                            className="premium-input" 
                            placeholder="https://docs.google.com/spreadsheets/d/..." 
                            value={googleSheetUrl} 
                            onChange={e => setGoogleSheetUrl(e.target.value)} 
                            style={{ background: 'var(--background)', width: '100%', padding: '0.8rem', borderRadius: '8px', fontSize: '0.9rem', border: '1px solid var(--outline-variant)' }} 
                          />
                        </div>

                        {/* Инструкция Шаг 4 */}
                        <div style={{ background: 'var(--surface-container-lowest)', padding: '1rem', borderRadius: '12px', marginBottom: '1.5rem', borderLeft: '4px solid #10a37f' }}>
                          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--on-surface)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ background: '#10a37f', color: '#fff', width: '20px', height: '20px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', fontSize: '12px' }}>4</span>
                            Какие данные собирать?
                          </div>
                          <p style={{ color: 'var(--on-surface-variant)', fontSize: '0.85rem', marginBottom: '0.5rem', lineHeight: '1.4' }}>
                            Укажите названия колонок в вашей таблице через запятую. ИИ сам поймет, какие данные нужно спросить у клиента и запишет их в правильный столбец.
                          </p>
                          <input 
                            type="text"
                            className="premium-input" 
                            placeholder="Например: Имя, Телефон, Город, Услуга" 
                            value={googleSheetColumns} 
                            onChange={e => setGoogleSheetColumns(e.target.value)} 
                            style={{ background: 'var(--background)', width: '100%', padding: '0.8rem', borderRadius: '8px', fontSize: '0.9rem', border: '1px solid var(--outline-variant)' }} 
                          />
                        </div>

                        <button 
                          onClick={handleSave} 
                          disabled={isSaving}
                          style={{ width: '100%', padding: '0.8rem', borderRadius: '12px', border: 'none', background: '#10a37f', color: '#fff', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', transition: 'all 0.2s' }}
                          onMouseOver={(e) => { if(!isSaving) e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 163, 127, 0.3)'; }}
                          onMouseOut={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
                        >
                          {isSaving ? <Loader2 size={16} className="spinning" /> : <CheckCircle2 size={16} />}
                          Сохранить и активировать
                        </button>
                      </div>
                    )}
                  </div>
                  )}

                  {/* Google Calendar Card */}
                  {(!isGoogleSheetsActive && !isBitrixActive) && (
                  <div style={{ background: 'var(--surface)', border: '1px solid var(--outline-variant)', borderRadius: '20px', padding: '1.5rem', display: 'flex', flexDirection: 'column', transition: 'all 0.3s ease' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                      <div style={{ width: '48px', height: '48px', background: 'rgba(66, 133, 244, 0.1)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M19 4H5C3.89543 4 3 4.89543 3 6V20C3 21.1046 3.89543 22 5 22H19C20.1046 22 21 21.1046 21 20V6C21 4.89543 20.1046 4 19 4Z" stroke="#4285F4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M16 2V6" stroke="#4285F4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M8 2V6" stroke="#4285F4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M3 10H21" stroke="#4285F4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                      <div>
                        <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--on-surface)' }}>Google Calendar</h3>
                        <div style={{ fontSize: '0.8rem', color: '#4285F4', fontWeight: 600 }}>Запись клиентов</div>
                      </div>
                    </div>
                    <p style={{ color: 'var(--on-surface-variant)', fontSize: '0.9rem', marginBottom: '1.5rem', flex: 1 }}>
                      ИИ сам будет проверять свободное время и записывать клиентов напрямую в ваш календарь.
                    </p>

                    {!isGoogleCalendarActive ? (
                      <button 
                        onClick={() => setIsGoogleCalendarActive(true)}
                        style={{ width: '100%', padding: '0.8rem', borderRadius: '12px', border: googleCalendarId ? '1px solid transparent' : '1px solid #4285F4', background: googleCalendarId ? '#4285F4' : 'rgba(66, 133, 244, 0.1)', color: googleCalendarId ? '#fff' : '#4285F4', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s ease', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                        onMouseOver={(e) => e.currentTarget.style.opacity = '0.8'}
                        onMouseOut={(e) => e.currentTarget.style.opacity = '1'}
                      >
                        {googleCalendarId ? <><CheckCircle2 size={16} /> Подключено (Настроить)</> : 'Подключить Календарь'}
                      </button>
                    ) : (
                      <div style={{ overflow: 'hidden', animation: 'slideDown 0.4s ease-out forwards' }}>
                        <button onClick={() => setIsGoogleCalendarActive(false)} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: '1px solid var(--outline-variant)', borderRadius: '8px', padding: '6px 14px', cursor: 'pointer', color: 'var(--on-surface-variant)', fontSize: '0.85rem', marginBottom: '1rem' }}>
                          <ArrowLeft size={14} /> Назад
                        </button>

                        <div style={{ background: 'var(--surface-container-lowest)', padding: '1rem', borderRadius: '12px', marginBottom: '1rem', borderLeft: '4px solid #4285F4' }}>
                          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--on-surface)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ background: '#4285F4', color: '#fff', width: '20px', height: '20px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', fontSize: '12px' }}>1</span>
                            Откройте Google Календарь
                          </div>
                          <p style={{ color: 'var(--on-surface-variant)', fontSize: '0.85rem', marginBottom: '0.5rem', lineHeight: '1.4' }}>
                            Перейдите на <a href="https://calendar.google.com" target="_blank" rel="noopener noreferrer" style={{ color: '#4285F4', textDecoration: 'underline' }}>calendar.google.com</a>. В левой панели найдите нужный календарь в разделе <b>«Мои календари»</b> и нажмите на три точки (⋮) рядом с ним → <b>«Настройки и общий доступ»</b>.
                          </p>
                        </div>

                        <div style={{ background: 'var(--surface-container-lowest)', padding: '1rem', borderRadius: '12px', marginBottom: '1rem', borderLeft: '4px solid #4285F4' }}>
                          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--on-surface)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ background: '#4285F4', color: '#fff', width: '20px', height: '20px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', fontSize: '12px' }}>2</span>
                            Добавьте наш email как редактора
                          </div>
                          <p style={{ color: 'var(--on-surface-variant)', fontSize: '0.85rem', marginBottom: '0.8rem', lineHeight: '1.4' }}>
                            Прокрутите вниз до раздела <b>«Доступ для отдельных пользователей»</b> → нажмите <b>«+ Добавить пользователей»</b> → вставьте этот email → выберите роль <b>«Вносить изменения в мероприятия»</b> → нажмите <b>«Отправить»</b>:
                          </p>
                          <code style={{ background: 'rgba(66, 133, 244, 0.1)', padding: '8px 12px', borderRadius: '6px', userSelect: 'all', wordBreak: 'break-all', border: '1px solid rgba(66, 133, 244, 0.2)', width: '100%', display: 'block', color: '#4285F4', fontWeight: 600 }}>chatflowbot@gen-lang-client-0537370402.iam.gserviceaccount.com</code>
                        </div>

                        <div style={{ background: 'var(--surface-container-lowest)', padding: '1rem', borderRadius: '12px', marginBottom: '1rem', borderLeft: '4px solid #4285F4' }}>
                          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--on-surface)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ background: '#4285F4', color: '#fff', width: '20px', height: '20px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', fontSize: '12px' }}>3</span>
                            Скопируйте ID календаря
                          </div>
                          <p style={{ color: 'var(--on-surface-variant)', fontSize: '0.85rem', marginBottom: '0.5rem', lineHeight: '1.4' }}>
                            На той же странице настроек прокрутите вниз до раздела <b>«Интеграция календаря»</b>. Там будет поле <b>«Идентификатор календаря»</b> — скопируйте это значение (обычно это ваш Gmail или длинная строка заканчивающаяся на @group.calendar.google.com) и вставьте сюда:
                          </p>
                          <input 
                            type="text"
                            className="premium-input" 
                            placeholder="my-email@gmail.com или xxxx@group.calendar.google.com" 
                            value={googleCalendarId} 
                            onChange={e => setGoogleCalendarId(e.target.value)} 
                            style={{ background: 'var(--background)', width: '100%', padding: '0.8rem', borderRadius: '8px', fontSize: '0.9rem', border: '1px solid var(--outline-variant)' }} 
                          />
                        </div>

                        <button 
                          onClick={handleSave} 
                          disabled={isSaving}
                          style={{ width: '100%', padding: '0.8rem', borderRadius: '12px', border: 'none', background: '#4285F4', color: '#fff', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', transition: 'all 0.2s' }}
                          onMouseOver={(e) => { if(!isSaving) e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(66, 133, 244, 0.3)'; }}
                          onMouseOut={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
                        >
                          {isSaving ? <Loader2 size={16} className="spinning" /> : <CheckCircle2 size={16} />}
                          Сохранить и активировать
                        </button>
                      </div>
                    )}
                  </div>
                  )}

                  {/* Bitrix24 Card */}
                  {(!isGoogleSheetsActive && !isGoogleCalendarActive) && (
                  <div style={{ background: 'var(--surface)', border: '1px solid var(--outline-variant)', borderRadius: '20px', padding: '1.5rem', display: 'flex', flexDirection: 'column', transition: 'all 0.3s ease' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                      <div style={{ width: '48px', height: '48px', background: 'rgba(47, 198, 246, 0.1)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Database size={24} color="#2fc6f6" />
                      </div>
                      <div>
                        <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--on-surface)' }}>Битрикс24</h3>
                        <div style={{ fontSize: '0.8rem', color: '#2fc6f6', fontWeight: 600 }}>Мощная CRM</div>
                      </div>
                    </div>
                    <p style={{ color: 'var(--on-surface-variant)', fontSize: '0.9rem', marginBottom: '1.5rem', flex: 1 }}>
                      Бот будет автоматически создавать карточки "Лида" в вашем Битрикс24 при получении контакта.
                    </p>

                    {!isBitrixActive ? (
                      <button 
                        onClick={() => setIsBitrixActive(true)}
                        style={{ width: '100%', padding: '0.8rem', borderRadius: '12px', border: bitrixWebhookUrl ? '1px solid transparent' : '1px solid #2fc6f6', background: bitrixWebhookUrl ? '#2fc6f6' : 'rgba(47, 198, 246, 0.1)', color: bitrixWebhookUrl ? '#fff' : '#2fc6f6', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s ease', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                        onMouseOver={(e) => e.currentTarget.style.opacity = '0.8'}
                        onMouseOut={(e) => e.currentTarget.style.opacity = '1'}
                      >
                        {bitrixWebhookUrl ? <><CheckCircle2 size={16} /> Подключено (Настроить)</> : 'Подключить Битрикс24'}
                      </button>
                    ) : (
                      <div style={{ overflow: 'hidden', animation: 'slideDown 0.4s ease-out forwards' }}>
                        <button onClick={() => setIsBitrixActive(false)} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: '1px solid var(--outline-variant)', borderRadius: '8px', padding: '6px 14px', cursor: 'pointer', color: 'var(--on-surface-variant)', fontSize: '0.85rem', marginBottom: '1rem' }}>
                          <ArrowLeft size={14} /> Назад
                        </button>

                        <div style={{ background: 'var(--surface-container-lowest)', padding: '1rem', borderRadius: '12px', marginBottom: '1rem', borderLeft: '4px solid #2fc6f6' }}>
                          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--on-surface)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ background: '#2fc6f6', color: '#fff', width: '20px', height: '20px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', fontSize: '12px' }}>1</span>
                            Создайте Входящий Вебхук
                          </div>
                          <p style={{ color: 'var(--on-surface-variant)', fontSize: '0.85rem', lineHeight: '1.7', marginBottom: 0 }}>
                            В вашем Битрикс24 перейдите по пути:<br/>
                            <b>Приложения</b> → <b>Разработчикам</b> → <b>Другое</b> → <b>Входящий вебхук</b><br/><br/>
                            ⚠️ <b>Важно:</b> В разделе <b>«Настройка прав»</b> обязательно выберите право <b style={{ color: '#2fc6f6' }}>«CRM»</b> (иначе лиды не будут создаваться).<br/><br/>
                            Нажмите кнопку <b>«Сохранить»</b> внизу страницы.
                          </p>
                        </div>

                        <div style={{ background: 'var(--surface-container-lowest)', padding: '1rem', borderRadius: '12px', marginBottom: '1.5rem', borderLeft: '4px solid #2fc6f6' }}>
                          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--on-surface)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ background: '#2fc6f6', color: '#fff', width: '20px', height: '20px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', fontSize: '12px' }}>2</span>
                            Вставьте URL вебхука
                          </div>
                          <p style={{ color: 'var(--on-surface-variant)', fontSize: '0.85rem', marginBottom: '0.5rem', lineHeight: '1.4' }}>
                            Скопируйте полученную ссылку для вызова REST (она длинная) и вставьте её сюда:
                          </p>
                          <input 
                            type="text"
                            className="premium-input" 
                            placeholder="https://b24-xxxx.bitrix24.ru/rest/1/secret_token/" 
                            value={bitrixWebhookUrl} 
                            onChange={e => setBitrixWebhookUrl(e.target.value)} 
                            style={{ background: 'var(--background)', width: '100%', padding: '0.8rem', borderRadius: '8px', fontSize: '0.9rem', border: '1px solid var(--outline-variant)', marginBottom: '1rem' }} 
                          />
                          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--on-surface)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ background: '#2fc6f6', color: '#fff', width: '20px', height: '20px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', fontSize: '12px' }}>3</span>
                            Какие данные передавать в лид? (Необязательно)
                          </div>
                          <p style={{ color: 'var(--on-surface-variant)', fontSize: '0.85rem', marginBottom: '0.5rem', lineHeight: '1.4' }}>
                            Имя и телефон передаются всегда. Напишите, какую еще информацию ИИ должен собирать и записывать в комментарий к лиду:
                          </p>
                          <textarea 
                            className="premium-input" 
                            placeholder="Например: Какую услугу хочет получить клиент, удобное время для записи и город проживания" 
                            value={bitrixFields} 
                            onChange={e => setBitrixFields(e.target.value)} 
                            style={{ background: 'var(--background)', width: '100%', padding: '0.8rem', borderRadius: '8px', fontSize: '0.9rem', border: '1px solid var(--outline-variant)', minHeight: '80px', resize: 'vertical' }} 
                          />
                        </div>

                        <button 
                          onClick={handleSave} 
                          disabled={isSaving}
                          style={{ width: '100%', padding: '0.8rem', borderRadius: '12px', border: 'none', background: '#2fc6f6', color: '#fff', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', transition: 'all 0.2s' }}
                          onMouseOver={(e) => { if(!isSaving) e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(47, 198, 246, 0.3)'; }}
                          onMouseOut={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
                        >
                          {isSaving ? <Loader2 size={16} className="spinning" /> : <CheckCircle2 size={16} />}
                          Сохранить и активировать
                        </button>
                      </div>
                    )}
                  </div>
                  )}

                  {/* AmoCRM (Coming Soon) */}
                  {(!isGoogleSheetsActive && !isGoogleCalendarActive && !isBitrixActive) && (
                  <div style={{ background: 'var(--surface)', border: '1px solid var(--outline-variant)', borderRadius: '20px', padding: '1.5rem', display: 'flex', flexDirection: 'column', opacity: 0.6, cursor: 'not-allowed' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                      <div style={{ width: '48px', height: '48px', background: 'var(--surface-container-highest)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Database size={24} color="var(--on-surface-variant)" />
                      </div>
                      <div>
                        <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--on-surface)' }}>amoCRM</h3>
                        <div style={{ fontSize: '0.8rem', color: 'var(--on-surface-variant)', fontWeight: 600 }}>Полноценная CRM</div>
                      </div>
                    </div>
                    <p style={{ color: 'var(--on-surface-variant)', fontSize: '0.9rem', marginBottom: '1.5rem', flex: 1 }}>
                      Автоматическое создание сделок и перенос переписки с клиентом прямо в воронку продаж amoCRM.
                    </p>
                    <button disabled style={{ width: '100%', padding: '0.8rem', borderRadius: '12px', border: '1px solid var(--outline-variant)', background: 'var(--surface-container-lowest)', color: 'var(--on-surface-variant)', fontWeight: 600 }}>
                      В разработке
                    </button>
                  </div>
                  )}


                </div>
              )}
            </div>
          </div>
        )}

        {/* ══ SETTINGS TAB ══ */}
        {activeTab === 'settings' && (
          <div style={{ flex: 1, overflowY: 'auto', padding: '3rem 2rem' }}>
            <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
              

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
                    <textarea className="premium-input" rows={3} style={{ resize: 'vertical', width: '100%' }} value={businessInfo} onChange={e => setBusinessInfo(e.target.value)} placeholder="..." />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.9rem', color: '#aaa', marginBottom: '0.5rem', fontWeight: 500 }}>{t.benefits}</label>
                    <textarea className="premium-input" rows={2} style={{ resize: 'vertical', width: '100%' }} value={benefits} onChange={e => setBenefits(e.target.value)} placeholder="..." />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.9rem', color: '#aaa', marginBottom: '0.5rem', fontWeight: 500 }}>{t.pricingTerms}</label>
                    <textarea className="premium-input" rows={3} style={{ resize: 'vertical', width: '100%' }} value={pricing} onChange={e => setPricing(e.target.value)} placeholder="..." />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--on-surface-variant)', marginBottom: '0.5rem', fontWeight: 500 }}>{t.managerContact}</label>
                    <input className="premium-input" type="text" value={managerContact} onChange={e => setManagerContact(e.target.value)} placeholder="+7 (777) 123-45-67 или @username" style={{ width: '100%' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.9rem', color: '#aaa', marginBottom: '0.5rem', fontWeight: 500 }}>{t.additionalInfo || 'Дополнительная информация (произвольный текст)'}</label>
                    <textarea className="premium-input" rows={6} style={{ resize: 'vertical', width: '100%' }} value={additionalInfo} onChange={e => setAdditionalInfo(e.target.value)} placeholder="Вставьте сюда любой объемный текст, описание, услуги, цены, который не поместился в другие разделы..." />
                  </div>
                  
                  <div style={{ background: 'var(--surface-container-high)', padding: '20px', borderRadius: '12px', border: '1px solid var(--outline-variant)' }}>
                    <label style={{ display: 'block', fontSize: '1rem', color: 'var(--on-surface)', marginBottom: '1rem', fontWeight: 600 }}>{t.faqTitle}</label>
                    {faq.map((item, index) => (
                      <div key={index} style={{ display: 'flex', gap: '12px', marginBottom: '16px', alignItems: 'flex-start' }}>
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <input className="premium-input" type="text" value={item.q} onChange={e => { const newFaq = [...faq]; newFaq[index].q = e.target.value; setFaq(newFaq); }} placeholder={t.question || 'Вопрос...'} style={{ padding: '0.8rem 1rem', width: '100%', background: 'var(--surface-container-lowest)' }} />
                          <textarea className="premium-input" rows={2} style={{ padding: '0.8rem 1rem', resize: 'vertical', width: '100%', background: 'var(--surface-container-lowest)' }} value={item.a} onChange={e => { const newFaq = [...faq]; newFaq[index].a = e.target.value; setFaq(newFaq); }} placeholder={t.answer || 'Ответ...'} />
                        </div>
                        <button type="button" onClick={() => { const newFaq = faq.filter((_, i) => i !== index); setFaq(newFaq.length ? newFaq : [{q:'', a:''}]); }} style={{ padding: '0.8rem', background: 'rgba(255, 77, 79, 0.1)', color: '#ff4d4f', borderRadius: '8px', border: '1px solid rgba(255, 77, 79, 0.2)', cursor: 'pointer' }}>
                          <Trash2 size={20} />
                        </button>
                      </div>
                    ))}
                    <button type="button" onClick={() => setFaq([...faq, { q: '', a: '' }])} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'transparent', border: '1px dashed var(--outline-variant)', color: 'var(--on-surface-variant)', padding: '12px', borderRadius: '8px', cursor: 'pointer', width: '100%', justifyContent: 'center', fontWeight: '600' }}>
                      <Plus size={18} /> {t.addQuestion || 'Add question'}
                    </button>
                  </div>

                  <div style={{ background: 'var(--surface-container-high)', padding: '20px', borderRadius: '12px', border: '1px solid var(--outline-variant)' }}>
                    <label style={{ display: 'block', fontSize: '1rem', color: 'var(--on-surface)', marginBottom: '1rem', fontWeight: 600 }}>{t.usefulLinks}</label>
                    {links.map((item, index) => (
                      <div key={index} style={{ display: 'flex', gap: '12px', marginBottom: '12px', alignItems: 'center' }}>
                        <input className="premium-input" type="text" value={item.title} onChange={e => { const newLinks = [...links]; newLinks[index].title = e.target.value; setLinks(newLinks); }} placeholder={t.linkName || 'Название...'} style={{ flex: 1, padding: '0.8rem 1rem', background: 'var(--surface-container-lowest)' }} />
                        <input className="premium-input" type="text" value={item.url} onChange={e => { const newLinks = [...links]; newLinks[index].url = e.target.value; setLinks(newLinks); }} placeholder="https://..." style={{ flex: 2, padding: '0.8rem 1rem', background: 'var(--surface-container-lowest)' }} />
                        <button type="button" onClick={() => { const newLinks = links.filter((_, i) => i !== index); setLinks(newLinks.length ? newLinks : [{title:'', url:''}]); }} style={{ padding: '0.8rem', background: 'rgba(255, 77, 79, 0.1)', color: '#ff4d4f', borderRadius: '8px', border: '1px solid rgba(255, 77, 79, 0.2)', cursor: 'pointer' }}>
                          <Trash2 size={20} />
                        </button>
                      </div>
                    ))}
                    <button type="button" onClick={() => setLinks([...links, { title: '', url: '' }])} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'transparent', border: '1px dashed var(--outline-variant)', color: 'var(--on-surface-variant)', padding: '12px', borderRadius: '8px', cursor: 'pointer', width: '100%', justifyContent: 'center', fontWeight: '600' }}>
                      <Plus size={18} /> {t.addLink || 'Add link'}
                    </button>
                  </div>

                  <div style={{ background: 'var(--surface-container-low)', padding: '20px', borderRadius: '12px', border: '1px solid var(--outline-variant)' }}>
                    <label style={{ display: 'block', fontSize: '1rem', color: 'var(--on-surface)', marginBottom: '0.5rem', fontWeight: 600 }}>{t.quickFact}</label>
                    <p style={{ color: 'var(--on-surface-variant)', fontSize: '0.85rem', marginBottom: '1rem', lineHeight: '1.4' }}>{t.quickFactHint}</p>
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <input className="premium-input" type="text" id="customFactInput" placeholder={t.enterInfo || "Enter information..."} style={{ flex: 1, padding: '0.8rem 1rem' }} onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const val = e.currentTarget.value;
                          if (val.trim()) { setDataPrompt(prev => prev + '\n\nAdditional fact: ' + val.trim()); e.currentTarget.value = ''; }
                        }
                      }} />
                      <button type="button" className="btn-primary" onClick={() => {
                        const input = document.getElementById('customFactInput') as HTMLInputElement;
                        if (input && input.value.trim()) {
                          setDataPrompt(prev => prev + '\n\nAdditional fact: ' + input.value.trim());
                          input.value = '';
                        }
                      }}>
                        <Plus size={18} /> {t.add || 'Add'}
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

      {/* ONBOARDING TOUR MODAL */}
      {tourStep !== null && (
        <div style={{
          position: 'fixed',
          bottom: `${tourPos.bottom}px`,
          right: `${tourPos.right}px`,
          width: '360px',
          background: 'var(--surface-container-lowest)',
          border: '1px solid var(--outline-variant)',
          borderRadius: '24px',
          padding: '24px',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          animation: 'popIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards'
        }}>
          <style>{`
            @keyframes popIn {
              0% { opacity: 0; transform: scale(0.9) translateY(20px); }
              100% { opacity: 1; transform: scale(1) translateY(0); }
            }
          `}</style>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '40px', height: '40px', background: 'rgba(43, 108, 0, 0.1)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <img src="/logo.jpg" alt="Logo" style={{ width: '32px', height: '32px', borderRadius: '8px', objectFit: 'cover' }} />
            </div>
            <div>
              <div style={{ fontWeight: 'bold', fontSize: '15px', color: 'var(--on-surface)' }}>{t.assistantTitle || "Помощник UP-CHAT"}</div>
              <div style={{ fontSize: '11px', color: 'var(--on-surface-variant)' }}>{t.tourStepX || "Шаг"} {tourStep} {t.tourStepOf || "из"} 5</div>
            </div>
            <button 
              onClick={handleSkipTour}
              style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'var(--on-surface-variant)', cursor: 'pointer', fontSize: '16px' }}
            >
              ✕
            </button>
          </div>

          <p style={{ fontSize: '14px', lineHeight: '1.5', color: 'var(--on-surface)', margin: 0 }}>
            {tourStep === 1 && (t.tourStep1 || "Ваш ИИ-помощник успешно создан! 🎉 Теперь давайте подключим каналы связи (Telegram или WhatsApp), чтобы он мог общаться с клиентами.")}
            {tourStep === 2 && (t.tourStep2 || "Отлично! После подключения каналов, обязательно настройте базу знаний во вкладке Мозг ИИ. 🧠 Сюда вы можете загрузить файлы, написать описание компании и товаров, добавить полезные ссылки и FAQ. Это обучит помощника вашему продукту.")}
            {tourStep === 3 && (t.tourStep3 || "Вкладка Диалоги 💬 — это ваша живая панель контроля. Здесь в реальном времени отображаются все переписки. В любой момент вы можете перехватить диалог у бота и ответить клиенту лично.")}
            {tourStep === 4 && (t.tourStep4 || "Вкладка Настройки ⚙️ позволяет настроить тон общения, цели бота, собираемые данные лидов и протестировать помощника в песочнице перед публикацией.")}
            {tourStep === 5 && (t.tourStep5 || "Вы готовы к запуску! 🚀 Теперь вы можете подключить Telegram или WhatsApp и тестировать вашего бота. Если возникнут вопросы — наша техподдержка всегда на связи.")}
          </p>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '8px' }}>
            {/* Dots */}
            <div style={{ display: 'flex', gap: '6px' }}>
              {[1, 2, 3, 4, 5].map((s) => (
                <div key={s} style={{
                  width: '6px', height: '6px', borderRadius: '50%',
                  background: tourStep === s ? 'var(--primary)' : 'var(--outline)',
                  transition: 'background 0.3s'
                }}></div>
              ))}
            </div>

            <button 
              onClick={handleNextTourStep}
              className="btn-primary"
              style={{
                marginLeft: 'auto',
                padding: '8px 16px',
                borderRadius: '10px',
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              {tourStep === 5 ? (t.tourFinish || "Завершить") : (t.tourNext || "Далее →")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
