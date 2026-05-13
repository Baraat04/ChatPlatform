'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Save, Trash2, Send, Bot, User, Pause, Play, Phone, MessageSquare, Radio, Edit2, Wand2 } from 'lucide-react';
import Link from 'next/link';
import { io } from 'socket.io-client';

const API = 'http://localhost:3001/api';

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
  const [activeTab, setActiveTab] = useState<'chats' | 'settings' | 'broadcast'>('chats');
  const [broadcastNumbers, setBroadcastNumbers] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  
  // Quiz Helper states
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizData, setQuizData] = useState({
    role: '',
    style: 'вежливый и профессиональный',
    goals: '',
    companyInfo: '',
    prices: '',
    faq: ''
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchBot();
    fetchChats();

    const socket = io('http://localhost:3001');
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
        };
        if (existing) return [updated, ...prev.filter(c => c.chatId !== newMsg.chatId)];
        return [updated, ...prev];
      });
    });
    socket.on(`qr-${botId}`, (qr: string) => setQrCode(qr));
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
    const res = await fetch(`${API}/bot/${botId}`);
    if (res.ok) {
      const data = await res.json();
      setBot(data);
      setSystemPrompt(data.system_prompt || '');
      setDataPrompt(data.data_prompt || '');
    }
  }

  async function fetchChats() {
    const res = await fetch(`${API}/bot/${botId}/chats`);
    if (res.ok) setChats(await res.json());
  }

  async function fetchChatMessages(chatId: string) {
    const res = await fetch(`${API}/bot/${botId}/chat?chatId=${encodeURIComponent(chatId)}`);
    if (res.ok) setMessages(await res.json());
  }

  async function handleSend() {
    if (!replyText.trim() || !selectedChat) return;
    const res = await fetch(`${API}/bot/${botId}/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: replyText, chatId: selectedChat }),
    });
    if (res.ok) setReplyText('');
    else alert('Не удалось отправить: ' + (await res.json().catch(() => ({}))).error);
  }

  async function handleToggleActive() {
    if (!bot) return;
    setIsTogglingActive(true);
    const endpoint = bot.isActive ? 'pause' : 'start';
    const res = await fetch(`${API}/bot/${botId}/${endpoint}`, { method: 'POST' });
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
    });
    setIsSaving(false);
  }

  function generateFromQuiz() {
    const sys = `Ты — ${quizData.role || 'полезный ассистент'}.\nТвой стиль общения: ${quizData.style}.\nТвои цели: ${quizData.goals}.`;
    const data = `Информация о компании:\n${quizData.companyInfo}\n\nЦены и услуги:\n${quizData.prices}\n\nЧастые вопросы:\n${quizData.faq}`;
    
    setSystemPrompt(sys);
    setDataPrompt(data);
    setShowQuiz(false);
    alert('Промпты успешно сгенерированы! Не забудьте нажать "Сохранить изменения".');
  }

  async function handleDelete() {
    if (!confirm('Удалить этого бота и все его сообщения?')) return;
    setIsDeleting(true);
    await fetch(`${API}/bot/${botId}`, { method: 'DELETE' });
    router.push('/bots');
  }

  async function handleBroadcast() {
    if (!broadcastNumbers.trim() || !broadcastMessage.trim()) return;
    const chatIds = broadcastNumbers.split('\n').map(n => n.trim()).filter(Boolean);
    setIsBroadcasting(true);
    const res = await fetch(`${API}/bot/${botId}/broadcast`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: broadcastMessage, chatIds }),
    });
    setIsBroadcasting(false);
    if (res.ok) { alert('Рассылка завершена!'); setBroadcastMessage(''); setBroadcastNumbers(''); }
    else alert('Ошибка рассылки');
  }

  async function handleDeleteChat(chatIdToDelete?: string) {
    const id = chatIdToDelete || selectedChat;
    if (!id) return;
    if (!confirm(`Полностью удалить контакт ${id} и всю историю?`)) return;
    
    const res = await fetch(`${API}/bot/${botId}/contact/delete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chatId: id })
    });

    if (res.ok) {
      if (id === selectedChat) {
        setSelectedChat(null);
        setMessages([]);
      }
      fetchChats();
    } else {
      alert('Не удалось удалить контакт');
    }
  }

  async function handleEditContactName(e: React.MouseEvent, chatId: string, currentName: string) {
    e.stopPropagation();
    const newName = prompt('Введите имя для этого контакта:', currentName);
    if (newName === null || newName === currentName) return;

    const res = await fetch(`${API}/bot/${botId}/contact/name`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chatId, name: newName })
    });

    if (res.ok) {
      fetchChats();
    } else {
      alert('Не удалось сохранить имя');
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
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap');
        
        .bot-dashboard-container {
          height: 100vh;
          display: flex;
          flex-direction: column;
          background: radial-gradient(circle at top right, #13111C 0%, #050505 40%, #050505 100%);
          font-family: 'Outfit', 'Inter', sans-serif;
          color: #fff;
          overflow: hidden;
        }

        .top-bar {
          display: flex;
          align-items: center;
          gap: 1.5rem;
          padding: 1rem 2rem;
          background: rgba(10, 10, 10, 0.6);
          backdrop-filter: blur(12px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          flex-shrink: 0;
          z-index: 10;
        }

        .back-btn {
          color: #888;
          text-decoration: none;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.9rem;
          font-weight: 500;
          transition: all 0.3s ease;
          padding: 0.5rem;
          border-radius: 8px;
        }
        .back-btn:hover {
          color: #fff;
          background: rgba(255, 255, 255, 0.05);
          transform: translateX(-2px);
        }

        .status-badge {
          font-size: 0.75rem;
          padding: 0.3rem 0.8rem;
          border-radius: 999px;
          font-weight: 600;
          letter-spacing: 0.5px;
          text-transform: uppercase;
        }

        .btn-action {
          padding: 0.6rem 1.2rem;
          border-radius: 10px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.85rem;
          font-weight: 600;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          border: none;
        }
        
        .btn-toggle {
          background: rgba(34, 197, 94, 0.1);
          color: #22c55e;
          border: 1px solid rgba(34, 197, 94, 0.2);
        }
        .btn-toggle:hover { background: rgba(34, 197, 94, 0.15); transform: translateY(-1px); box-shadow: 0 4px 12px rgba(34, 197, 94, 0.15); }
        .btn-toggle.paused {
          background: rgba(255, 107, 107, 0.1);
          color: #ff6b6b;
          border: 1px solid rgba(255, 107, 107, 0.2);
        }
        .btn-toggle.paused:hover { background: rgba(255, 107, 107, 0.15); box-shadow: 0 4px 12px rgba(255, 107, 107, 0.15); }

        .btn-delete {
          background: rgba(255, 77, 79, 0.05);
          color: #ff4d4f;
          border: 1px solid rgba(255, 77, 79, 0.1);
        }
        .btn-delete:hover { background: rgba(255, 77, 79, 0.15); transform: translateY(-1px); }

        .tab-bar {
          display: flex;
          background: rgba(10, 10, 10, 0.4);
          border-bottom: 1px solid rgba(255, 255, 255, 0.03);
          padding: 0 1.5rem;
        }

        .tab-btn {
          padding: 1rem 1.5rem;
          background: transparent;
          border: none;
          color: #666;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.9rem;
          font-weight: 500;
          transition: all 0.3s ease;
          position: relative;
        }
        .tab-btn:hover { color: #aaa; }
        .tab-btn.active { color: #fff; font-weight: 600; }
        .tab-btn.active::after {
          content: ''; position: absolute; bottom: 0; left: 0; width: 100%; height: 2px;
          background: linear-gradient(90deg, #6366f1, #a855f7);
          border-radius: 2px 2px 0 0;
          box-shadow: 0 -2px 10px rgba(99, 102, 241, 0.5);
        }

        /* Contacts Sidebar */
        .contacts-sidebar {
          width: 320px;
          border-right: 1px solid rgba(255, 255, 255, 0.05);
          background: rgba(5, 5, 5, 0.7);
          backdrop-filter: blur(20px);
          display: flex;
          flex-direction: column;
        }
        
        .chat-item {
          padding: 1rem;
          cursor: pointer;
          border-bottom: 1px solid rgba(255, 255, 255, 0.02);
          transition: all 0.2s ease;
          position: relative;
        }
        .chat-item:hover { background: rgba(255, 255, 255, 0.02); }
        .chat-item.active { background: linear-gradient(90deg, rgba(99, 102, 241, 0.1), transparent); }
        .chat-item.active::before {
          content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 3px;
          background: linear-gradient(180deg, #6366f1, #a855f7);
        }

        .avatar {
          width: 40px; height: 40px; border-radius: 12px;
          background: linear-gradient(135deg, #2a2a35, #1a1a24);
          display: flex; align-items: center; justify-content: center;
          box-shadow: inset 0 1px 1px rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.05);
        }

        /* Message Bubbles */
        .msg-bubble {
          max-width: 70%; padding: 0.8rem 1.2rem;
          font-size: 0.95rem; line-height: 1.5;
          position: relative;
          box-shadow: 0 4px 15px rgba(0,0,0,0.1);
        }
        .msg-bot {
          background: linear-gradient(135deg, #2e2a4a, #1f1b36);
          border: 1px solid rgba(99, 102, 241, 0.2);
          border-radius: 16px 16px 4px 16px;
          color: #f8f9fa;
        }
        .msg-user {
          background: #1a1a1a;
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 16px 16px 16px 4px;
          color: #e0e0e0;
        }

        .glass-panel {
          background: rgba(15, 15, 15, 0.6);
          backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 16px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
        }

        .premium-input {
          width: 100%; background: rgba(0, 0, 0, 0.3);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px; padding: 1rem; color: #fff;
          font-family: inherit; font-size: 0.95rem;
          transition: all 0.3s ease;
          box-shadow: inset 0 2px 4px rgba(0,0,0,0.2);
          box-sizing: border-box;
        }
        .premium-input:focus {
          outline: none; border-color: rgba(99, 102, 241, 0.5);
          box-shadow: inset 0 2px 4px rgba(0,0,0,0.2), 0 0 0 3px rgba(99, 102, 241, 0.1);
        }

        .btn-primary {
          background: linear-gradient(135deg, #6366f1, #a855f7);
          color: #fff; border: none; border-radius: 12px;
          padding: 0.8rem 2rem; font-weight: 600; font-size: 0.95rem;
          cursor: pointer; display: flex; align-items: center; gap: 0.5rem;
          transition: all 0.3s ease;
          box-shadow: 0 4px 15px rgba(99, 102, 241, 0.3);
        }
        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(99, 102, 241, 0.4);
        }
        .btn-primary:active { transform: translateY(0); }
        .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; transform: none; box-shadow: none; }

        /* Custom Scrollbar */
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.1); border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(255, 255, 255, 0.2); }
      `}</style>

      {/* ─── TOP BAR ─── */}
      <div className="top-bar">
        <Link href="/bots" className="back-btn">
          <ArrowLeft size={18} /> Dashboard
        </Link>
        <div style={{ width: '1px', height: '24px', background: 'rgba(255,255,255,0.1)' }} />
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: bot.isActive ? '#22c55e' : '#ff6b6b', boxShadow: bot.isActive ? '0 0 12px #22c55e' : '0 0 12px #ff6b6b', zIndex: 2 }} />
            {bot.isActive && <div style={{ position: 'absolute', width: '12px', height: '12px', borderRadius: '50%', background: '#22c55e', animation: 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite' }} />}
          </div>
          <span style={{ fontWeight: 700, fontSize: '1.2rem', letterSpacing: '0.5px' }}>{bot.platform} Agent</span>
          <span className="status-badge" style={{ 
            color: bot.isActive ? '#22c55e' : '#ff6b6b', 
            background: bot.isActive ? 'rgba(34,197,94,0.1)' : 'rgba(255,107,107,0.1)',
            border: `1px solid ${bot.isActive ? 'rgba(34,197,94,0.2)' : 'rgba(255,107,107,0.2)'}`
          }}>
            {bot.isActive ? 'Online' : 'Paused'}
          </span>
        </div>

        <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.75rem' }}>
          <button onClick={handleToggleActive} disabled={isTogglingActive} className={`btn-action btn-toggle ${bot.isActive ? 'paused' : ''}`}>
            {bot.isActive ? <><Pause size={16} /> Pause Agent</> : <><Play size={16} /> Start Agent</>}
          </button>
          <button onClick={handleDelete} disabled={isDeleting} className="btn-action btn-delete">
            <Trash2 size={16} /> Terminate
          </button>
        </div>
      </div>

      {/* ─── TAB BAR ─── */}
      <div className="tab-bar">
        {([['chats', <MessageSquare size={16} />, 'Live Chats'], ['settings', <Bot size={16} />, 'AI Brain'], ['broadcast', <Radio size={16} />, 'Campaigns']] as const).map(([tab, icon, label]) => (
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
            <div className="contacts-sidebar">
              <div style={{ padding: '1.2rem', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.85rem', color: '#888', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px' }}>Conversations</span>
                <span style={{ background: 'rgba(99, 102, 241, 0.1)', color: '#a855f7', padding: '0.2rem 0.6rem', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 700 }}>{chats.length}</span>
              </div>
              
              <div style={{ flex: 1, overflowY: 'auto' }}>
                {chats.length === 0 ? (
                  <div style={{ padding: '3rem 2rem', textAlign: 'center', color: '#555' }}>
                    <MessageSquare size={32} style={{ opacity: 0.5, marginBottom: '1rem' }} />
                    <div style={{ fontSize: '0.9rem' }}>No active conversations.<br/>Waiting for incoming messages...</div>
                  </div>
                ) : chats.map(chat => (
                  <div key={chat.chatId} onClick={() => setSelectedChat(chat.chatId)} className={`chat-item ${selectedChat === chat.chatId ? 'active' : ''}`}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div className="avatar">
                        <User size={18} color={selectedChat === chat.chatId ? '#a855f7' : '#666'} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.2rem' }}>
                          <div style={{ fontWeight: 600, fontSize: '0.95rem', color: selectedChat === chat.chatId ? '#fff' : '#ddd', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {chat.name 
                              ? (chat.chatId.includes('@lid') && (chat as any).realJid 
                                  ? `${chat.name} (+${((chat as any).realJid).split('@')[0]})` 
                                  : chat.name)
                              : (chat.chatId.includes('@lid') ? 'Скрытый номер' : `+${formatChatId(chat.chatId)}`)}
                          </div>
                          <Edit2 size={12} color="#666" style={{ cursor: 'pointer', opacity: 0.7 }} onClick={(e) => handleEditContactName(e, chat.chatId, chat.name || '')} />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ fontSize: '0.8rem', color: '#666', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '65%' }}>
                            {chat.lastSender === 'bot' && <span style={{ color: '#6366f1', marginRight: '4px' }}>AI:</span>}
                            {chat.lastMessage}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div style={{ fontSize: '0.7rem', color: '#555' }}>{formatTime(chat.lastAt)}</div>
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
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'rgba(0,0,0,0.2)' }}>
              {!selectedChat ? (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '1.5rem', opacity: 0.4 }}>
                  <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <MessageSquare size={36} color="#fff" />
                  </div>
                  <span style={{ fontSize: '1.1rem', fontWeight: 500 }}>Select a conversation to view transcript</span>
                </div>
              ) : (
                <>
                  {/* Chat Header */}
                  {(() => {
                    const currentChat = chats.find(c => c.chatId === selectedChat);
                    return (
                      <div style={{ padding: '1.2rem 2rem', background: 'rgba(10,10,10,0.8)', backdropFilter: 'blur(10px)', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 5 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                          <div className="avatar" style={{ background: 'linear-gradient(135deg, #382c59, #1c1533)' }}>
                            <User size={20} color="#a855f7" />
                          </div>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>
                                {currentChat?.name 
                                  ? (selectedChat.includes('@lid') && (currentChat as any).realJid 
                                      ? `${currentChat.name} (+${((currentChat as any).realJid).split('@')[0]})` 
                                      : currentChat.name)
                                  : (selectedChat.includes('@lid') ? 'Скрытый номер (WhatsApp Privacy)' : `+${formatChatId(selectedChat)}`)}
                              </div>
                              <Edit2 size={14} color="#888" style={{ cursor: 'pointer' }} onClick={(e) => handleEditContactName(e, selectedChat, currentChat?.name || '')} />
                            </div>
                            <div style={{ fontSize: '0.8rem', color: '#666', marginTop: '0.1rem' }}>ID: {formatChatId(selectedChat)}</div>
                          </div>
                        </div>
                        <button onClick={handleDeleteChat} className="btn-action btn-delete" style={{ background: 'transparent' }}>
                          <Trash2 size={18} /> Clear Chat
                        </button>
                      </div>
                    );
                  })()}

                  {/* Messages Area */}
                  <div style={{ flex: 1, overflowY: 'auto', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', scrollBehavior: 'smooth' }}>
                    {messages.length === 0 ? (
                      <div style={{ margin: 'auto', color: '#444', fontSize: '0.9rem' }}>No messages found in this conversation.</div>
                    ) : messages.map((msg, i) => (
                      <div key={i} style={{ display: 'flex', flexDirection: msg.sender === 'bot' ? 'row-reverse' : 'row', gap: '1rem', alignItems: 'flex-end' }}>
                        <div className="avatar" style={{ width: '32px', height: '32px', borderRadius: '50%', background: msg.sender === 'bot' ? 'linear-gradient(135deg, #6366f1, #4f46e5)' : 'linear-gradient(135deg, #333, #222)' }}>
                          {msg.sender === 'bot' ? <Bot size={16} color="#fff" /> : <User size={16} color="#aaa" />}
                        </div>
                        <div className={`msg-bubble ${msg.sender === 'bot' ? 'msg-bot' : 'msg-user'}`}>
                          <div style={{ whiteSpace: 'pre-wrap' }}>{msg.text}</div>
                          <div style={{ fontSize: '0.65rem', opacity: 0.5, marginTop: '0.5rem', textAlign: msg.sender === 'bot' ? 'left' : 'right' }}>{formatTime(msg.createdAt)}</div>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Input Area */}
                  <div style={{ padding: '1.5rem 2rem', background: 'rgba(10,10,10,0.9)', backdropFilter: 'blur(10px)', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: '1rem' }}>
                    <input
                      type="text"
                      className="premium-input"
                      value={replyText}
                      onChange={e => setReplyText(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
                      placeholder="Take over conversation manually..."
                    />
                    <button onClick={handleSend} disabled={!replyText.trim()} className="btn-primary" style={{ padding: '0 1.5rem' }}>
                      <Send size={18} />
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* ══ SETTINGS TAB ══ */}
        {activeTab === 'settings' && (
          <div style={{ flex: 1, overflowY: 'auto', padding: '3rem 2rem' }}>
            <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
              
              {qrCode && (
                <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', marginBottom: '3rem', display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'rgba(99, 102, 241, 0.05)', borderColor: 'rgba(99, 102, 241, 0.2)' }}>
                  <h3 style={{ margin: '0 0 1rem', color: '#fff', fontSize: '1.5rem' }}>Link WhatsApp Account</h3>
                  <p style={{ color: '#aaa', marginBottom: '2rem' }}>Open WhatsApp on your phone, go to Linked Devices, and scan this QR code to activate the agent.</p>
                  <div style={{ background: '#fff', padding: '1rem', borderRadius: '16px', boxShadow: '0 0 40px rgba(99,102,241,0.3)' }}>
                    <img src={qrCode} alt="QR Code" style={{ width: '260px', height: '260px', display: 'block' }} />
                  </div>
                </div>
              )}

              <div style={{ marginBottom: '3rem' }}>
                <button onClick={() => setShowQuiz(!showQuiz)} className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '1.2rem', fontSize: '1.1rem', background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(168, 85, 247, 0.1))', border: '1px solid rgba(168, 85, 247, 0.3)', color: '#e0b3ff', boxShadow: 'none' }}>
                  <Wand2 size={24} /> {showQuiz ? 'Close AI Prompt Builder' : 'Open AI Prompt Builder (Recommended)'}
                </button>
              </div>

              {showQuiz ? (
                <div className="glass-panel" style={{ padding: '2.5rem', animation: 'fadeIn 0.4s ease', marginBottom: '3rem' }}>
                  <h2 style={{ margin: '0 0 2rem', fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#fff' }}>
                    <div style={{ padding: '0.5rem', background: 'rgba(99, 102, 241, 0.2)', borderRadius: '10px' }}><Wand2 size={24} color="#a855f7" /></div>
                    Generate Agent Personas
                  </h2>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.9rem', color: '#aaa', marginBottom: '0.5rem', fontWeight: 500 }}>Agent Persona / Role</label>
                      <input type="text" className="premium-input" value={quizData.role} onChange={e => setQuizData({...quizData, role: e.target.value})} placeholder="e.g. Lead Sales Rep for 'Tech Corp'" />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.9rem', color: '#aaa', marginBottom: '0.5rem', fontWeight: 500 }}>Tone of Voice</label>
                      <select className="premium-input" value={quizData.style} onChange={e => setQuizData({...quizData, style: e.target.value})}>
                        <option value="вежливый и профессиональный">Polite & Professional</option>
                        <option value="дружелюбный и неформальный">Friendly & Casual</option>
                        <option value="официальный и строгий">Strictly Formal</option>
                        <option value="дерзкий и юмористический">Humorous & Witty</option>
                      </select>
                    </div>
                    <div style={{ gridColumn: 'span 2' }}>
                      <label style={{ display: 'block', fontSize: '0.9rem', color: '#aaa', marginBottom: '0.5rem', fontWeight: 500 }}>Primary Objectives</label>
                      <textarea className="premium-input" style={{ height: '100px', resize: 'vertical' }} value={quizData.goals} onChange={e => setQuizData({...quizData, goals: e.target.value})} placeholder="e.g. Answer support questions, guide users to purchase, book appointments." />
                    </div>
                    <div style={{ gridColumn: 'span 2', margin: '1rem 0' }}>
                      <div style={{ height: '1px', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)' }} />
                      <h3 style={{ fontSize: '1.1rem', color: '#a855f7', marginTop: '2rem', marginBottom: '0' }}>Knowledge Base Injection</h3>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.9rem', color: '#aaa', marginBottom: '0.5rem', fontWeight: 500 }}>Company Info & Links</label>
                      <textarea className="premium-input" style={{ height: '120px', resize: 'vertical' }} value={quizData.companyInfo} onChange={e => setQuizData({...quizData, companyInfo: e.target.value})} placeholder="Location, working hours, website links..." />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.9rem', color: '#aaa', marginBottom: '0.5rem', fontWeight: 500 }}>Pricing & Catalog</label>
                      <textarea className="premium-input" style={{ height: '120px', resize: 'vertical' }} value={quizData.prices} onChange={e => setQuizData({...quizData, prices: e.target.value})} placeholder="List of products/services with prices..." />
                    </div>
                  </div>
                  <div style={{ marginTop: '3rem', display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                    <button onClick={() => setShowQuiz(false)} className="btn-action" style={{ padding: '0.8rem 2rem', background: 'rgba(255,255,255,0.05)', color: '#fff' }}>Cancel</button>
                    <button onClick={generateFromQuiz} className="btn-primary">Generate Prompts <Wand2 size={16}/></button>
                  </div>
                </div>
              ) : (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                    <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column' }}>
                      <div style={{ marginBottom: '1.5rem' }}>
                        <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 600, color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Bot size={20} color="#6366f1"/> System Prompt</h2>
                        <p style={{ margin: '0.5rem 0 0', fontSize: '0.85rem', color: '#888' }}>Core identity and instructions for the AI model.</p>
                      </div>
                      <textarea className="premium-input" value={systemPrompt} onChange={e => setSystemPrompt(e.target.value)} style={{ flex: 1, minHeight: '350px', background: 'rgba(0,0,0,0.5)', fontFamily: 'monospace', fontSize: '0.85rem', color: '#bba8ff' }} placeholder="You are an AI assistant..." />
                    </div>
                    
                    <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column' }}>
                      <div style={{ marginBottom: '1.5rem' }}>
                        <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 600, color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Save size={20} color="#a855f7"/> Knowledge Base</h2>
                        <p style={{ margin: '0.5rem 0 0', fontSize: '0.85rem', color: '#888' }}>Factual data the AI can reference during chats.</p>
                      </div>
                      <textarea className="premium-input" value={dataPrompt} onChange={e => setDataPrompt(e.target.value)} style={{ flex: 1, minHeight: '350px', background: 'rgba(0,0,0,0.5)', fontFamily: 'monospace', fontSize: '0.85rem', color: '#99f6e4' }} placeholder="Data facts here..." />
                    </div>
                  </div>
                  
                  <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end' }}>
                    <button onClick={handleSave} disabled={isSaving} className="btn-primary" style={{ padding: '1rem 3rem', fontSize: '1.1rem' }}>
                      <Save size={20} /> {isSaving ? 'Deploying...' : 'Save & Deploy'}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* ══ BROADCAST TAB ══ */}
        {activeTab === 'broadcast' && (
          <div style={{ flex: 1, overflowY: 'auto', padding: '3rem 2rem' }}>
            <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
              <div style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '2rem', fontWeight: 700, margin: '0 0 0.5rem' }}>Mass Campaigns</h1>
                <p style={{ color: '#888', fontSize: '1rem', margin: 0 }}>Send messages to multiple contacts simultaneously.</p>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '2rem' }}>
                <div className="glass-panel" style={{ padding: '2rem' }}>
                  <h2 style={{ margin: '0 0 1rem', fontSize: '1.1rem', fontWeight: 600, color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><User size={18} color="#6366f1"/> Target Numbers</h2>
                  <p style={{ color: '#666', fontSize: '0.85rem', marginBottom: '1.5rem' }}>Enter numbers one per line (include country code).</p>
                  <textarea className="premium-input" value={broadcastNumbers} onChange={e => setBroadcastNumbers(e.target.value)} style={{ height: '300px', resize: 'vertical', fontFamily: 'monospace' }} placeholder={'77001234567\n79998887766'} />
                </div>
                
                <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column' }}>
                  <h2 style={{ margin: '0 0 1rem', fontSize: '1.1rem', fontWeight: 600, color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><MessageSquare size={18} color="#a855f7"/> Message Content</h2>
                  <textarea className="premium-input" value={broadcastMessage} onChange={e => setBroadcastMessage(e.target.value)} style={{ flex: 1, minHeight: '200px', resize: 'vertical', marginBottom: '2rem' }} placeholder="Type your broadcast message here..." />
                  
                  <button onClick={handleBroadcast} disabled={isBroadcasting || !broadcastMessage.trim() || !broadcastNumbers.trim()} className="btn-primary" style={{ alignSelf: 'flex-end', width: '100%', justifyContent: 'center', padding: '1.2rem', fontSize: '1.1rem' }}>
                    <Radio size={20} /> {isBroadcasting ? 'Broadcasting...' : 'Launch Campaign'}
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
