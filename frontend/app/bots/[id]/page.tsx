'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Save, Trash2, Send, Bot, User } from 'lucide-react';
import Link from 'next/link';
import { io } from 'socket.io-client';

export default function BotDetails() {
  const params = useParams();
  const router = useRouter();
  const botId = params.id;

  const [bot, setBot] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [systemPrompt, setSystemPrompt] = useState('');
  const [dataPrompt, setDataPrompt] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [replyText, setReplyText] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [broadcastNumbers, setBroadcastNumbers] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [isBroadcasting, setIsBroadcasting] = useState(false);

  async function handleSendReply() {
    if (!replyText.trim() || messages.length === 0) return;
    
    // Find the last INCOMING (user) message to reply to the right person
    const lastUserMsg = [...messages].reverse().find((m: any) => m.sender === 'user');
    if (!lastUserMsg) {
      alert('No user messages to reply to.');
      return;
    }
    const targetChatId = lastUserMsg.chatId;
    
    const res = await fetch(`http://localhost:3001/api/bot/${botId}/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: replyText, chatId: targetChatId })
    });
    
    if (res.ok) {
      setReplyText('');
      await fetchBotDetails();
    } else {
      const err = await res.json().catch(() => ({ error: 'Unknown error' }));
      alert('Failed to send: ' + (err.error || res.statusText));
    }
  }

  async function handleResumeAI() {
    if (messages.length === 0) return;
    const lastChatId = messages[messages.length - 1].chatId;

    const res = await fetch(`http://localhost:3001/api/bot/${botId}/resume`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chatId: lastChatId })
    });

    if (res.ok) {
      fetchBotDetails();
    } else {
      alert('Failed to resume AI');
    }
  }

  async function handleBroadcast() {
    if (!broadcastNumbers.trim() || !broadcastMessage.trim()) return;
    
    const numbers = broadcastNumbers.split('\n').map(n => n.trim()).filter(n => n);
    if (numbers.length === 0) return;

    setIsBroadcasting(true);
    const res = await fetch(`http://localhost:3001/api/bot/${botId}/broadcast`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: broadcastMessage, chatIds: numbers })
    });

    setIsBroadcasting(false);
    if (res.ok) {
      alert('Broadcast finished!');
      setBroadcastMessage('');
      setBroadcastNumbers('');
    } else {
      alert('Broadcast failed');
    }
  }

  useEffect(() => {
    fetchBotDetails();
    fetchMessages();

    // Setup Socket.IO for real-time messages
    const socket = io('http://localhost:3001');
    socket.on(`chat-${botId}`, (newMsg) => {
      setMessages((prev) => [...prev, newMsg]);
    });

    return () => {
      socket.disconnect();
    };
  }, [botId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function fetchBotDetails() {
    const res = await fetch(`http://localhost:3001/api/bot`);
    const allBots = await res.json();
    const currentBot = allBots.find((b: any) => b.id === Number(botId));
    
    if (currentBot) {
      setBot(currentBot);
      setSystemPrompt(currentBot.system_prompt || '');
      setDataPrompt(currentBot.data_prompt || '');
    }
  }

  async function fetchMessages() {
    const res = await fetch(`http://localhost:3001/api/bot/${botId}/messages`);
    const data = await res.json();
    if (Array.isArray(data)) {
      setMessages(data);
    }
  }

  async function handleSave() {
    setIsSaving(true);
    await fetch(`http://localhost:3001/api/bot/${botId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ system_prompt: systemPrompt, data_prompt: dataPrompt }),
    });
    setIsSaving(false);
    alert('Bot prompts saved successfully!');
  }

  async function handleDelete() {
    if (!confirm('Are you sure you want to delete this bot and all its messages?')) return;
    
    setIsDeleting(true);
    await fetch(`http://localhost:3001/api/bot/${botId}`, {
      method: 'DELETE',
    });
    router.push('/bots');
  }

  if (!bot) return <div style={{ padding: '2rem', color: '#fff' }}>Loading bot details...</div>;

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto', color: '#fff', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <Link href="/bots" style={{ color: '#888', textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
          <ArrowLeft size={20} style={{ marginRight: '0.5rem' }} /> Back to Bots
        </Link>
        <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 600 }}>Bot Settings: {bot.platform} #{bot.id}</h1>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '1rem' }}>
          <button 
            onClick={handleDelete}
            disabled={isDeleting}
            style={{ padding: '0.5rem 1rem', background: '#3f1111', color: '#ff4d4f', border: '1px solid #5c1818', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <Trash2 size={16} /> {isDeleting ? 'Deleting...' : 'Delete Bot'}
          </button>
          <button 
            onClick={handleSave}
            disabled={isSaving}
            style={{ padding: '0.5rem 1rem', background: '#fff', color: '#000', border: 'none', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}
          >
            <Save size={16} /> {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        
        {/* Settings Column */}
        <div style={{ background: '#111', border: '1px solid #222', borderRadius: '12px', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 500, color: '#eaeaea' }}>AI Configuration</h2>
          
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#888', fontSize: '0.9rem' }}>System Prompt (Personality & Rules)</label>
            <textarea 
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              style={{ width: '100%', minHeight: '150px', background: '#0a0a0a', border: '1px solid #333', borderRadius: '8px', padding: '1rem', color: '#fff', fontSize: '0.9rem', resize: 'vertical' }}
              placeholder="You are a helpful assistant..."
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#888', fontSize: '0.9rem' }}>Data Prompt (Knowledge Base)</label>
            <textarea 
              value={dataPrompt}
              onChange={(e) => setDataPrompt(e.target.value)}
              style={{ width: '100%', minHeight: '150px', background: '#0a0a0a', border: '1px solid #333', borderRadius: '8px', padding: '1rem', color: '#fff', fontSize: '0.9rem', resize: 'vertical' }}
              placeholder="Here is some information you should know..."
            />
          </div>
        </div>

        {/* Chat Log Column */}
        <div style={{ background: '#111', border: '1px solid #222', borderRadius: '12px', padding: '1.5rem', display: 'flex', flexDirection: 'column', height: '600px' }}>
          <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 500, color: '#eaeaea', marginBottom: '1.5rem' }}>Live Conversation Log</h2>
          
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem', paddingRight: '0.5rem' }}>
            {messages.length === 0 ? (
              <div style={{ margin: 'auto', color: '#555', textAlign: 'center' }}>No messages yet. Send a message on {bot.platform} to see it here.</div>
            ) : (
              messages.map((msg, i) => (
                <div key={i} style={{ display: 'flex', flexDirection: msg.sender === 'bot' ? 'row-reverse' : 'row', gap: '0.75rem', alignItems: 'flex-start' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: msg.sender === 'bot' ? '#222' : '#333', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {msg.sender === 'bot' ? <Bot size={18} color="#fff" /> : <User size={18} color="#888" />}
                  </div>
                  <div style={{ maxWidth: '75%', background: msg.sender === 'bot' ? '#1a1a1a' : '#222', padding: '0.75rem 1rem', borderRadius: '12px', borderBottomLeftRadius: msg.sender === 'user' ? '4px' : '12px', borderBottomRightRadius: msg.sender === 'bot' ? '4px' : '12px', border: '1px solid #333' }}>
                    <div style={{ fontSize: '0.75rem', color: '#666', marginBottom: '0.25rem' }}>
                      {msg.sender === 'user' ? `User (${msg.chatId})` : 'Bot'} • {new Date(msg.createdAt).toLocaleTimeString()}
                    </div>
                    <div style={{ color: '#eaeaea', fontSize: '0.9rem', whiteSpace: 'pre-wrap' }}>{msg.text}</div>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Reply Input */}
          <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
            <input 
              type="text" 
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendReply()}
              placeholder="Send a manual reply..."
              style={{ flex: 1, background: '#0a0a0a', border: '1px solid #333', borderRadius: '8px', padding: '0.75rem 1rem', color: '#fff', fontSize: '0.9rem' }}
            />
            <button 
              onClick={handleSendReply}
              disabled={!replyText.trim() || messages.length === 0}
              style={{ padding: '0.75rem 1.5rem', background: '#fff', color: '#000', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', fontWeight: 600 }}
            >
              <Send size={16} />
            </button>
          </div>
        </div>

      </div>

      {/* Broadcast Section */}
      <div style={{ marginTop: '2rem', background: '#111', border: '1px solid #222', borderRadius: '12px', padding: '1.5rem' }}>
        <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 500, color: '#eaeaea', marginBottom: '1.5rem' }}>Mass Broadcast (Bulk Messaging)</h2>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '2rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#888', fontSize: '0.9rem' }}>Phone Numbers / Chat IDs (One per line)</label>
            <textarea 
              value={broadcastNumbers}
              onChange={(e) => setBroadcastNumbers(e.target.value)}
              style={{ width: '100%', height: '150px', background: '#0a0a0a', border: '1px solid #333', borderRadius: '8px', padding: '1rem', color: '#fff', fontSize: '0.9rem', resize: 'vertical' }}
              placeholder={bot.platform === 'WHATSAPP' ? "79991234567\n79998887766" : "123456789\n987654321"}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#888', fontSize: '0.9rem' }}>Message Content</label>
            <textarea 
              value={broadcastMessage}
              onChange={(e) => setBroadcastMessage(e.target.value)}
              style={{ width: '100%', flex: 1, minHeight: '100px', background: '#0a0a0a', border: '1px solid #333', borderRadius: '8px', padding: '1rem', color: '#fff', fontSize: '0.9rem', resize: 'vertical' }}
              placeholder="Hello! This is a broadcast message..."
            />
            <button 
              onClick={handleBroadcast}
              disabled={isBroadcasting || !broadcastMessage.trim() || !broadcastNumbers.trim()}
              style={{ alignSelf: 'flex-end', padding: '0.75rem 2rem', background: '#fff', color: '#000', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}
            >
              {isBroadcasting ? 'Broadcasting...' : 'Start Broadcast'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
