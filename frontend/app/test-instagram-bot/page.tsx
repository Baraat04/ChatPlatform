'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Bot, MessageCircle, Phone, Globe, ArrowRight, ArrowLeft, CheckCircle2, ChevronDown, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '../contexts/LanguageContext';
import { API_URL } from '../config';

const InstagramIcon = ({ size = 24, color = 'currentColor' }: { size?: number; color?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);

// Custom Select Component — uses portal to escape overflow/z-index issues
function CustomSelect({ options, value, onChange, placeholder }: any) {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
  const [mounted, setMounted] = useState(false);
  const isCustomOption = value !== '' && !options.includes(value);
  const [showCustomInput, setShowCustomInput] = useState(isCustomOption);
  const triggerRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    const isCustom = value !== '' && !options.includes(value);
    setShowCustomInput(isCustom);
  }, [value, options]);

  const openDropdown = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setDropdownStyle({
        position: 'fixed',
        top: rect.bottom + 8,
        left: rect.left,
        width: rect.width,
        zIndex: 99999,
        background: '#ffffff',
        border: '1px solid #cbd5e1',
        borderRadius: '16px',
        boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
        maxHeight: '260px',
        overflowY: 'auto',
        padding: '8px 0',
      });
    }
    setIsOpen(true);
  };

  const handleSelectOption = (opt: string) => {
    if (opt === 'CUSTOM_OPTION') {
      setShowCustomInput(true);
      onChange('');
    } else {
      setShowCustomInput(false);
      onChange(opt);
    }
    setIsOpen(false);
  };

  useEffect(() => {
    if (!isOpen) return;
    const handleOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.cs-trigger') && !target.closest('.cs-dropdown')) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [isOpen]);

  const displayLabel = showCustomInput ? '✍️ Custom option...' : (value || placeholder);

  const dropdownContent = (
    <div className="cs-dropdown" style={dropdownStyle}>
      {options.map((opt: string) => {
        const isSelected = value === opt;
        return (
          <div
            key={opt}
            onMouseDown={(e) => { e.preventDefault(); handleSelectOption(opt); }}
            style={{
              padding: '12px 20px',
              fontSize: '15px',
              color: isSelected ? '#047857' : '#0f172a',
              fontWeight: isSelected ? '600' : '400',
              background: isSelected ? '#ecfdf5' : '#ffffff',
              cursor: 'pointer',
            }}
            onMouseOver={(e) => { if (!isSelected) e.currentTarget.style.background = '#f1f5f9'; }}
            onMouseOut={(e) => { if (!isSelected) e.currentTarget.style.background = '#ffffff'; }}
          >
            {opt}
          </div>
        );
      })}
      <div
        onMouseDown={(e) => { e.preventDefault(); handleSelectOption('CUSTOM_OPTION'); }}
        style={{
          padding: '12px 20px',
          fontSize: '15px',
          color: showCustomInput ? '#047857' : '#64748b',
          fontWeight: showCustomInput ? '600' : '500',
          borderTop: '1px solid #e2e8f0',
          cursor: 'pointer',
          background: showCustomInput ? '#ecfdf5' : '#ffffff',
          marginTop: '4px',
        }}
        onMouseOver={(e) => { if (!showCustomInput) e.currentTarget.style.background = '#f1f5f9'; }}
        onMouseOut={(e) => { if (!showCustomInput) e.currentTarget.style.background = '#ffffff'; }}
      >
        ✍️ Custom option...
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
      <div
        ref={triggerRef}
        className="cs-trigger"
        onClick={() => isOpen ? setIsOpen(false) : openDropdown()}
        style={{
          width: '100%',
          padding: '16px 20px',
          borderRadius: '16px',
          border: isOpen ? '1px solid var(--primary)' : '1px solid var(--outline-variant)',
          background: '#ffffff',
          color: value || showCustomInput ? '#0f172a' : '#64748b',
          fontSize: '16px',
          cursor: 'pointer',
          transition: 'all 0.2s',
          boxShadow: isOpen ? '0 0 0 4px rgba(4,120,87,0.1)' : '0 2px 8px rgba(0,0,0,0.04)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          userSelect: 'none',
        }}
      >
        <span style={{ flex: 1, color: 'inherit' }}>{displayLabel}</span>
        <ChevronDown
          size={20}
          color="#64748b"
          style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s', pointerEvents: 'none' }}
        />
      </div>

      {mounted && isOpen && createPortal(dropdownContent, document.body)}

      {showCustomInput && (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); (e.target as HTMLInputElement).blur(); } }}
          placeholder="Write your option here..."
          className="input-field anim-item"
          autoFocus
          style={{ marginTop: '4px' }}
        />
      )}
    </div>
  );
}

export default function CreateBotFast() {
  const router = useRouter();
  const { t } = useLanguage();
  
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Form State
  const [platform, setPlatform] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [industry, setIndustry] = useState('');
  const [tone, setTone] = useState('');
  const [goal, setGoal] = useState('');

  // Data Options - ONLY INSTAGRAM HERE
  const platforms = [
    { id: 'INSTAGRAM', name: 'Instagram', icon: <InstagramIcon size={32} color="#E1306C" />, bg: 'rgba(225,48,108,0.1)' },
  ];

  const industries = [
    "Insurance",
    "Law & Accounting",
    "Real Estate",
    "Renovation",
    "Construction",
    "Logistics & Transport",
    "Manufacturing",
    "IT & Technology",
    "Marketing & Advertising",
    "Creative & Content",
    "HR & Business Services",
    "Industry услуг",
    "Retail",
    "E-commerce",
    "Beauty",
    "Medicine & Health",
    "Dentistry",
    "Cosmetology",
    "Fitness & Sports",
    "Education",
    "Cafes & Coffee Shops",
    "Restaurant Business",
    "Automotive Business",
    "Tourism",
    "Hotel Business",
    "Finance"
  ];

  const tones = [
    "Friendly & Caring (like a friend)",
    "Strict & Business (corporate style)",
    "Energetic & Selling (motivator)",
    "Concise Assistant (only the point, no fluff)",
    "Cheeky & Youthful (humor, slang)",
    "Calming & Empathetic",
    "Expert & Academic"
  ];

  const goals = [
    "Qualify request (ask questions and collect contacts)",
    "Book consultation/appointment (agree on time)",
    "Answer common questions (FAQ & Support)",
    "Sell product/service (handle objections and prices)",
    "Collect feedback after service",
    "Remind about booking or webinar (Follow-up)"
  ];

  const totalSteps = 3;

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const systemPrompt = `You are an AI employee of the company "${companyName}" (Industry: ${industry}).
Your main goal: ${goal}.
Communication format: ${tone}.
Communicate with clients naturally, always stick to your communication format and strive to achieve your main goal.`;
      
      const pId = 'INSTAGRAM';
      
      const response = await fetch(`${API_URL}/bot`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          system_prompt: systemPrompt,
          data_prompt: `Company name: ${companyName}\nIndustry: ${industry}`,
          platform: pId,
          apiToken: '' // Without token for fast creation
        }),
      });

      const data = await response.json();
      if (response.ok) {
        setTimeout(() => {
          router.push(`/bots/${data.id}?new=true`);
        }, 2500);
      } else {
        setErrorMsg(data.error || 'Error creating bot');
        setIsSubmitting(false);
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Network error creating bot. Check connection to server.');
      setIsSubmitting(false);
    }
  };

  const nextStep = () => {
    if (step === 1 && !platform) return;
    if (step === 2 && (!companyName || !industry)) return;
    if (step === 3 && (!tone || !goal)) return;

    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      handleSubmit();
    }
  };

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  const renderRightPanelPreview = () => {
    if (step === 1) {
      const selectedPlatformInfo = platforms.find(p => p.name === platform) || { name: 'Select platform', icon: <Bot size={32} color="#ffffff" />, bg: 'rgba(255,255,255,0.2)' };
      return (
        <div className="anim-item" style={{ animationDelay: '0.2s', margin: 'auto 0', display: 'flex', justifyContent: 'center' }}>
          <div style={{
            width: '280px',
            height: '240px',
            background: '#0f172a',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: '24px',
            padding: '20px',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            position: 'relative',
            color: 'white'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '12px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ff5f56' }}></div>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ffbd2e' }}></div>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#27c93f' }}></div>
              <span style={{ fontSize: '12px', opacity: 0.5, marginLeft: 'auto' }}>Preview</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', marginTop: '10px' }}>
              <div style={{ 
                width: '60px', 
                height: '60px', 
                borderRadius: '50%', 
                background: '#1e293b', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                boxShadow: '0 8px 16px rgba(0,0,0,0.1)'
              }}>
                {selectedPlatformInfo.icon}
              </div>
              <span style={{ fontSize: '15px', fontWeight: '600' }}>{selectedPlatformInfo.name}</span>
            </div>

            <div style={{
              background: '#1e293b',
              borderRadius: '12px 12px 12px 0px',
              padding: '12px',
              fontSize: '13px',
              lineHeight: '1.4',
              alignSelf: 'flex-start',
              maxWidth: '90%',
              marginTop: '10px',
              border: '1px solid rgba(255,255,255,0.05)'
            }}>
              {platform 
                ? `Hi! I am your new AI assistant on ${platform}. Waiting to launch! 🚀` 
                : 'Select a platform on the left to link your AI employee.'}
            </div>
          </div>
        </div>
      );
    }
    
    if (step === 2) {
      return (
        <div className="anim-item" style={{ animationDelay: '0.2s', margin: 'auto 0', display: 'flex', justifyContent: 'center' }}>
          <div style={{
            width: '300px',
            background: '#0f172a',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: '24px',
            padding: '24px',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            color: 'white'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', fontWeight: 'bold', letterSpacing: '1px', opacity: 0.6, textTransform: 'uppercase' }}>AI Agent Memory</span>
              <span style={{ fontSize: '12px', background: '#1e293b', padding: '2px 8px', borderRadius: '20px' }}>Step 2 of 3</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '8px' }}>
              <div style={{ borderLeft: '3px solid #60a5fa', paddingLeft: '12px' }}>
                <div style={{ fontSize: '11px', opacity: 0.5 }}>Company / Name</div>
                <div style={{ fontSize: '15px', fontWeight: '600' }}>{companyName || 'Enter name...'}</div>
              </div>

              <div style={{ borderLeft: '3px solid #34d399', paddingLeft: '12px' }}>
                <div style={{ fontSize: '11px', opacity: 0.5 }}>Industry</div>
                <div style={{ fontSize: '15px', fontWeight: '600' }}>{industry || 'Select industry...'}</div>
              </div>
            </div>

            <div style={{ fontSize: '12px', opacity: 0.8, lineHeight: '1.4', background: '#1e293b', padding: '10px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
              🧠 Based on this data, the AI will automatically generate your company competency profile.
            </div>
          </div>
        </div>
      );
    }

    if (step === 3) {
      const getSampleMessage = () => {
        let msg = "Hello! How can I help you today?";
        if (tone.includes("Дружелюбный")) {
          msg = "Привет! 😊 Glad to hear from you! How are you, how can I help you today?";
        } else if (tone.includes("Мотивирующий")) {
          msg = "Привет! 🔥 We have great news today! Ready to make the best choice right now?";
        } else if (tone.includes("Профессиональный")) {
          msg = "Greetings. The company welcomes your request. What task are we facing?";
        } else if (tone.includes("Заботливый")) {
          msg = "Hello. Dont worry, I am here to calmly figure everything out and help you.";
        }
        
        let goalMsg = "I will help qualify the request.";
        if (goal.includes("собрать контакты") || goal.includes("Квалифицировать")) {
          goalMsg = "First, could you please tell me your phone number or email?";
        } else if (goal.includes("Записать") || goal.includes("запись")) {
          goalMsg = "What time would be convenient for you to come for a consultation?";
        } else if (goal.includes("Ответить") || goal.includes("вопросы")) {
          goalMsg = "You can ask any question you have about our rates and services!";
        } else if (goal.includes("Продать") || goal.includes("оформить")) {
          goalMsg = "We currently have a special promotion. Shall we place an order?";
        }
        
        return { msg, goalMsg };
      };

      const sample = getSampleMessage();

      return (
        <div className="anim-item" style={{ animationDelay: '0.2s', margin: 'auto 0', display: 'flex', justifyContent: 'center' }}>
          <div style={{
            width: '320px',
            background: '#0f172a',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: '24px',
            padding: '20px',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            color: 'white'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', opacity: 0.6, fontSize: '11px', fontWeight: 'bold' }}>
              <span>💬 DIALOGUE SIMULATOR</span>
              <span style={{ marginLeft: 'auto', color: '#34d399' }}>Live Preview</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
              <div style={{
                background: '#1e293b',
                alignSelf: 'flex-start',
                padding: '10px 14px',
                borderRadius: '16px 16px 16px 4px',
                fontSize: '13px',
                lineHeight: '1.4',
                maxWidth: '90%'
              }}>
                {sample.msg}
              </div>

              <div style={{
                background: '#1e293b',
                alignSelf: 'flex-start',
                padding: '10px 14px',
                borderRadius: '16px 16px 16px 4px',
                fontSize: '13px',
                lineHeight: '1.4',
                maxWidth: '90%'
              }}>
                {sample.goalMsg}
              </div>
            </div>

            <div style={{ fontSize: '11px', opacity: 0.5, textAlign: 'center', marginTop: '4px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '8px' }}>
              Goal: {goal ? goal.slice(0, 35) : 'Not selected'}
            </div>
          </div>
        </div>
      );
    }

    return null;
  };

  // Helper for step validation
  const isStep1Valid = !!platform;
  const isStep2Valid = !!companyName && !!industry;
  const isStep3Valid = !!tone && !!goal;
  
  const canProceed = 
    (step === 1 && isStep1Valid) || 
    (step === 2 && isStep2Valid) || 
    (step === 3 && isStep3Valid);

  // Right Panel Content based on step
  const getRightPanelTitle = () => {
    if (step === 1) return "Hi! 👋 Lets create your first AI agent for Instagram.";
    if (step === 2) return "Great! Tell us a little about your business.";
    if (step === 3) return "Almost done! How should your agent communicate?";
    return "Creating magic... ✨";
  };

  const getRightPanelDesc = () => {
    if (step === 1) return "Choose the platform where the bot will meet your clients.";
    if (step === 2) return "This info will help the AI understand your context and reply better to clients.";
    if (step === 3) return "Tone of voice and main goal are what distinguishes a regular bot from a genius AI.";
    return "Packing neural networks, setting up servers and preparing your dashboard.";
  };

  return (
    <div className="main-container">
      <style>{`
        @keyframes fadeInScale {
          0% { opacity: 0; transform: scale(0.95) translateY(10px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes slideInRight {
          0% { opacity: 0; transform: translateX(-20px); }
          100% { opacity: 1; transform: translateX(0); }
        }
        @keyframes pulseBg {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .anim-step {
          animation: fadeInScale 0.4s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
        }
        .anim-item {
          opacity: 0;
          animation: slideInRight 0.4s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
        }
        
        .platform-card {
          border: 2px solid var(--outline-variant);
          transition: all 0.2s;
        }
        .platform-card:hover {
          border-color: var(--primary);
          transform: translateY(-4px);
          box-shadow: 0 12px 24px rgba(43, 108, 0, 0.1);
        }
        .platform-card.selected {
          border-color: var(--primary);
          background: var(--primary-container);
        }

        .primary-btn {
          background: var(--primary);
          color: var(--on-primary);
          transition: all 0.2s;
        }
        .primary-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 16px rgba(43, 108, 0, 0.2);
        }
        .primary-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .input-field {
          width: 100%;
          padding: 16px 20px;
          border-radius: 16px;
          border: 1px solid var(--outline-variant);
          background: var(--surface-container-lowest);
          color: var(--on-surface);
          font-size: 16px;
          transition: all 0.2s;
          outline: none;
        }
        .input-field:focus {
          border-color: var(--primary);
          box-shadow: 0 0 0 4px rgba(43, 108, 0, 0.1);
        }

        /* Responsive Layout Rules */
        .main-container {
          display: flex;
          height: 100vh;
          height: 100dvh;
          background: var(--surface-container-lowest);
          width: 100%;
          overflow: hidden;
        }
        .left-panel {
          flex: 1;
          display: flex;
          flex-direction: column;
          position: relative;
          background: var(--surface-container-lowest);
          overflow: hidden;
        }
        .right-panel {
          flex: 1;
          background: linear-gradient(135deg, var(--primary), #0a2f00);
          background-size: 200% 200%;
          animation: pulseBg 15s ease infinite;
          color: #ffffff;
          padding: clamp(24px, 4vw, 48px);
          display: flex;
          flex-direction: column;
          min-width: 0;
          position: relative;
        }
        .right-panel * {
          color: inherit;
        }
        .header-container {
          padding: 16px 32px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid var(--outline-variant);
          position: relative;
          z-index: 1;
        }
        .form-outer {
          flex: 1;
          display: flex;
          align-items: flex-start;
          justify-content: center;
          padding: 32px 32px 0 32px;
          overflow-y: auto;
          overflow-x: visible;
        }
        .form-inner {
          width: 100%;
          max-width: 560px;
          padding-bottom: 48px;
        }
        .mobile-step-badge {
          display: none;
        }

        @media (max-width: 1023px) {
          .main-container {
            flex-direction: column;
            height: auto;
            min-height: 100dvh;
            overflow: visible;
          }
          .left-panel {
            min-height: auto;
            order: 2;
            display: flex;
            flex-direction: column;
            overflow: visible;
          }
          .right-panel {
            min-height: auto;
            width: 100%;
            padding: 32px 20px;
            order: 1;
          }
          .right-panel-steps {
            display: none !important;
          }
          .header-container {
            padding: 12px 20px;
            border-top: 1px solid var(--outline-variant);
            border-bottom: none;
            order: 3;
            margin-top: auto;
          }
          .form-outer {
            padding: 24px 20px 0 20px;
            order: 1;
          }
          .form-inner {
            padding-bottom: 32px;
          }
          .mobile-step-badge {
            display: inline-block;
            font-size: 13px;
            font-weight: 600;
            background: var(--primary-container);
            color: var(--on-primary-container);
            padding: 4px 12px;
            border-radius: 12px;
          }
        }
        
        @media (max-width: 480px) {
          .platform-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      {/* LEFT PANEL - FORM */}
      <div className="left-panel">
        
        {/* Top Header/Nav */}
        <div className="header-container">
          {/* Always-visible: back to dashboard */}
          <button 
            onClick={() => router.push('/')} 
            style={{ background: 'none', border: 'none', color: 'var(--on-surface-variant)', fontSize: '15px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', transition: 'color 0.2s', padding: '8px 0' }}
          >
            <ArrowLeft size={18} /> На главную
          </button>

          {/* Mobile step indicator */}
          <div className="mobile-step-badge">
            Шаг {step} из {totalSteps}
          </div>

          {/* Prev step (only if step > 1) */}
          {step > 1 && !isSubmitting ? (
            <button 
              onClick={prevStep} 
              style={{ background: 'var(--surface-container-high)', border: 'none', color: 'var(--on-surface)', fontSize: '14px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', transition: 'all 0.2s', padding: '8px 16px', borderRadius: '30px' }}
            >
              <ArrowLeft size={16} /> Back
            </button>
          ) : <div />}
        </div>


        {/* Form Container */}
        <div className="form-outer">
          <div className="form-inner">
            
            {/* STEP 1: PLATFORM */}
            {step === 1 && (
              <div key="step1" className="anim-step">
                <h2 style={{ fontSize: '28px', fontWeight: 'bold', color: 'var(--on-surface)', marginBottom: '24px' }}>Тестовое создание Instagram бота</h2>
                
                <div className="platform-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(1, 1fr)', gap: '16px' }}>
                  {platforms.map((p, idx) => (
                    <div 
                      key={p.id} 
                      className={`platform-card anim-item ${platform === p.name ? 'selected' : ''}`}
                      style={{ animationDelay: `${idx * 0.1}s`, padding: '24px', borderRadius: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px', cursor: 'pointer', background: 'var(--surface-container-lowest)' }}
                      onClick={() => setPlatform(p.name)}
                    >
                      <div style={{ background: p.bg, padding: '16px', borderRadius: '50%' }}>
                        {p.icon}
                      </div>
                      <span style={{ fontSize: '18px', fontWeight: '600', color: 'var(--on-surface)' }}>{p.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 2: COMPANY INFO */}
            {step === 2 && (
              <div key="step2" className="anim-step">
                <h2 style={{ fontSize: '28px', fontWeight: 'bold', color: 'var(--on-surface)', marginBottom: '24px' }}>Базовая информация</h2>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  <div className="anim-item" style={{ animationDelay: '0.1s' }}>
                    <label style={{ display: 'block', fontSize: '15px', fontWeight: '600', color: 'var(--on-surface)', marginBottom: '8px' }}>Company name (или ваше имя)</label>
                    <input 
                      type="text" 
                      className="input-field" 
                      placeholder="Например: Студия красоты 'Эйфория'" 
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                        }
                      }}
                    />
                  </div>

                  <div className="anim-item" style={{ animationDelay: '0.2s', position: 'relative', zIndex: 100 }}>
                    <label style={{ display: 'block', fontSize: '15px', fontWeight: '600', color: 'var(--on-surface)', marginBottom: '8px' }}>Industry</label>
                    <CustomSelect 
                      options={industries} 
                      value={industry} 
                      onChange={setIndustry} 
                      placeholder="Выберите сферу бизнеса..."
                    />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: AI BEHAVIOR */}
            {step === 3 && (
              <div key="step3" className="anim-step">
                <h2 style={{ fontSize: '28px', fontWeight: 'bold', color: 'var(--on-surface)', marginBottom: '24px' }}>Настройка ИИ-агента</h2>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  <div className="anim-item" style={{ animationDelay: '0.1s', position: 'relative', zIndex: 101 }}>
                    <label style={{ display: 'block', fontSize: '15px', fontWeight: '600', color: 'var(--on-surface)', marginBottom: '8px' }}>Communication format ИИ-сотрудника</label>
                    <CustomSelect 
                      options={tones} 
                      value={tone} 
                      onChange={setTone} 
                      placeholder="Выберите формат (тон)..."
                    />
                  </div>

                  <div className="anim-item" style={{ animationDelay: '0.2s', position: 'relative', zIndex: 100 }}>
                    <label style={{ display: 'block', fontSize: '15px', fontWeight: '600', color: 'var(--on-surface)', marginBottom: '8px' }}>Основная цель ИИ-агента</label>
                    <CustomSelect 
                      options={goals} 
                      value={goal} 
                      onChange={setGoal} 
                      placeholder="Что должен делать бот?..."
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Error Message */}
            {errorMsg && (
              <div style={{ marginTop: '24px', padding: '16px', background: 'var(--error-container)', color: 'var(--on-error-container)', borderRadius: '12px', fontSize: '14px', fontWeight: '500' }}>
                ⚠️ {errorMsg}
              </div>
            )}

            {/* Action Button */}
            <div className="anim-item" style={{ marginTop: '32px', animationDelay: '0.3s', position: 'relative', zIndex: 1 }}>
              <button 
                onClick={nextStep}
                disabled={!canProceed || isSubmitting}
                className="primary-btn"
                style={{ 
                  width: '100%', 
                  padding: '18px', 
                  border: 'none', 
                  borderRadius: '16px', 
                  fontSize: '18px', 
                  fontWeight: '600', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  gap: '12px',
                  position: 'relative',
                  zIndex: 1
                }}
              >
                {isSubmitting ? (
                  <>Создаем агента... ✨</>
                ) : step === totalSteps ? (
                  <>Запустить ИИ-агента <Sparkles size={20} /></>
                ) : (
                  <>Далее <ArrowRight size={20} /></>
                )}
              </button>
            </div>

          </div>
        </div>
      </div>

      {/* RIGHT PANEL - PROGRESS & INFO */}
      <div className="right-panel">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: 'clamp(20px, 4vh, 60px)' }}>
          <img src="/logo.jpg" alt="Logo" style={{ width: '48px', height: '48px', borderRadius: '12px', objectFit: 'cover' }} />
          <span style={{ fontSize: '20px', fontWeight: 'bold', letterSpacing: '1px' }}>UP-CHAT</span>
        </div>

        <div key={`title-${step}`} className="anim-item" style={{ marginBottom: 'clamp(12px, 2vh, 16px)' }}>
          <h2 style={{ fontSize: 'clamp(22px, 3vw, 30px)', fontWeight: 'bold', lineHeight: '1.3', color: '#ffffff', margin: 0 }}>{getRightPanelTitle()}</h2>
        </div>
        
        <div key={`desc-${step}`} className="anim-item" style={{ animationDelay: '0.1s', marginBottom: 'clamp(20px, 3vh, 40px)' }}>
          <p style={{ fontSize: 'clamp(14px, 1.6vw, 17px)', lineHeight: '1.6', color: 'rgba(255,255,255,0.70)', marginBottom: 0 }}>
            {getRightPanelDesc()}
          </p>
        </div>

        {renderRightPanelPreview()}

        {/* Progress Steps */}
        <div className="right-panel-steps" style={{ marginTop: 'auto', paddingTop: 'clamp(16px, 3vh, 32px)', display: 'flex', flexDirection: 'column', gap: 'clamp(12px, 2vh, 24px)' }}>
          {[
            { num: 1, label: 'Платформа' },
            { num: 2, label: 'Базовая информация' },
            { num: 3, label: 'Настройка поведения' }
          ].map((s) => {
            const isCompleted = step > s.num;
            const isActive = step === s.num;
            const color = isCompleted || isActive ? 'white' : 'rgba(255,255,255,0.3)';
            const weight = isActive ? '700' : '500';
            
            return (
              <div key={s.num} style={{ display: 'flex', alignItems: 'center', gap: '16px', transition: 'all 0.3s' }}>
                <div style={{ 
                  width: '32px', height: '32px', borderRadius: '50%', 
                  background: isCompleted ? 'rgba(255,255,255,0.2)' : isActive ? 'white' : 'transparent',
                  border: `2px solid ${isCompleted || isActive ? 'white' : 'rgba(255,255,255,0.3)'}`,
                  color: isActive ? 'var(--primary)' : color,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 'bold', fontSize: '14px', flexShrink: 0,
                  transition: 'all 0.3s'
                }}>
                  {isCompleted ? <CheckCircle2 size={18} color="white" /> : s.num}
                </div>
                <span style={{ color, fontWeight: weight, fontSize: '16px', transition: 'all 0.3s' }}>
                  {s.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Decorative elements */}
        <div style={{ position: 'absolute', top: '-10%', right: '-20%', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }}></div>
        <div style={{ position: 'absolute', bottom: '-5%', left: '-10%', width: '400px', height: '400px', background: 'radial-gradient(circle, rgba(255,255,255,0.05) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }}></div>
      </div>

      {/* FULL-SCREEN ACTIVATION ANIMATION OVERLAY */}
      {isSubmitting && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'radial-gradient(circle at center, #0a1f10 0%, #020704 100%)',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontFamily: 'system-ui, -apple-system, sans-serif'
        }}>
          <style>{`
            @keyframes pulseBrain {
              0% { transform: scale(1); filter: drop-shadow(0 0 20px rgba(34, 197, 94, 0.4)); }
              50% { transform: scale(1.05); filter: drop-shadow(0 0 40px rgba(34, 197, 94, 0.8)); }
              100% { transform: scale(1); filter: drop-shadow(0 0 20px rgba(34, 197, 94, 0.4)); }
            }
            @keyframes rotateOuter {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
            .brain-glow {
              animation: pulseBrain 2s infinite ease-in-out;
            }
            .ring-rotate {
              animation: rotateOuter 8s infinite linear;
            }
          `}</style>
          
          <div style={{ position: 'relative', width: '160px', height: '160px', marginBottom: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {/* Outer rotating glowing ring */}
            <div className="ring-rotate" style={{
              position: 'absolute',
              width: '140px', height: '140px',
              border: '2px dashed rgba(34, 197, 94, 0.3)',
              borderRadius: '50%',
            }}></div>
            <div className="ring-rotate" style={{
              position: 'absolute',
              width: '160px', height: '160px',
              border: '2px solid transparent',
              borderTopColor: '#22c55e',
              borderBottomColor: '#10b981',
              borderRadius: '50%',
              animationDuration: '4s'
            }}></div>
            
            {/* Logo/Icon inside */}
            <div className="brain-glow" style={{
              width: '100px', height: '100px',
              background: 'white',
              borderRadius: '30px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 40px rgba(34, 197, 94, 0.5)',
              overflow: 'hidden'
            }}>
              <img src="/logo.jpg" alt="Logo" style={{ width: '80px', height: '80px', borderRadius: '20px', objectFit: 'cover' }} />
            </div>
          </div>

          <h2 style={{ fontSize: '28px', fontWeight: 'bold', letterSpacing: '0.5px', marginBottom: '16px', backgroundImage: 'linear-gradient(to right, #22c55e, #10b981)', backgroundClip: 'text', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Активация вашего бот-ассистента...
          </h2>
          
          {/* Progress sequence */}
          <div style={{ fontSize: '16px', color: '#9ca3af', minHeight: '24px', transition: 'all 0.3s' }}>
            {companyName ? `Инициализация нейросети для "${companyName}"...` : 'Инициализация нейросети...'}
          </div>
          
          <div style={{ marginTop: '40px', display: 'flex', gap: '8px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e', animation: 'pulseBrain 1s infinite alternate' }}></div>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', animation: 'pulseBrain 1s infinite alternate', animationDelay: '0.3s' }}></div>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#a7f3d0', animation: 'pulseBrain 1s infinite alternate', animationDelay: '0.6s' }}></div>
          </div>
        </div>
      )}
    </div>
  );
}
