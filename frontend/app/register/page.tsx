"use client";

import { useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { useRouter } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import Link from 'next/link';
import { API_URL } from '../config';

const localT = {
  EN: {
    createAccountTitle: "Create Account",
    subtitle: "Join UP-CHAT and create smart bots",
    name: "Name",
    email: "Email",
    password: "Password",
    register: "Register",
    alreadyHaveAccount: "Already have an account?",
    signIn: "Sign In",
    regError: "Registration error",
    connError: "Connection error",
    namePlaceholder: "John Doe",
    confirmPassword: "Confirm Password",
    passwordsDoNotMatch: "Passwords do not match"
  },
  RU: {
    createAccountTitle: "Создать аккаунт",
    subtitle: "Присоединяйтесь к UP-CHAT и создавайте умных ботов",
    name: "Имя",
    email: "Email",
    password: "Пароль",
    register: "Зарегистрироваться",
    alreadyHaveAccount: "Уже есть аккаунт?",
    signIn: "Войти",
    regError: "Ошибка регистрации",
    connError: "Ошибка соединения",
    namePlaceholder: "Иван Иванов",
    confirmPassword: "Подтвердите пароль",
    passwordsDoNotMatch: "Пароли не совпадают"
  },
  KZ: {
    createAccountTitle: "Тіркелгі жасау",
    subtitle: "UP-CHAT-қа қосылып, ақылды боттар жасаңыз",
    name: "Аты",
    email: "Email",
    password: "Құпия сөз",
    register: "Тіркелу",
    alreadyHaveAccount: "Тіркелгіңіз бар ма?",
    signIn: "Кіру",
    regError: "Тіркелу қатесі",
    connError: "Қосылу қатесі",
    namePlaceholder: "Әлібек Асқаров",
    confirmPassword: "Құпия сөзді растау",
    passwordsDoNotMatch: "Құпия сөздер сәйкес келмейді"
  }
};

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [successEmail, setSuccessEmail] = useState('');
  const { login } = useAuth();
  const { language } = useLanguage();
  const router = useRouter();
  const t = localT[language];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError(t.passwordsDoNotMatch);
      return;
    }

    setIsLoading(true);
    
    try {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name, email, password })
      });
      
      const data = await res.json();
      
      if (res.ok) {
        // Show success — user must verify email before logging in
        setSuccessEmail(email);
      } else {
        setError(data.error || t.regError);
      }
    } catch (err) {
      setError(t.connError);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse: any) => {
    try {
      const res = await fetch(`${API_URL}/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ idToken: credentialResponse.credential })
      });
      
      const data = await res.json();
      if (res.ok) {
        login(data.user);
        router.push('/bots');
      } else {
        setError(data.error || "Google login failed");
      }
    } catch (err) {
      setError(t.connError);
    }
  };

  const [verificationCode, setVerificationCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsVerifying(true);
    
    try {
      const res = await fetch(`${API_URL}/auth/verify-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: successEmail, code: verificationCode })
      });
      
      const data = await res.json();
      
      if (res.ok) {
        // Automatically redirect to login after successful verification
        router.push('/login');
      } else {
        setError(data.error || 'Invalid code');
      }
    } catch (err) {
      setError(t.connError);
    } finally {
      setIsVerifying(false);
    }
  };

  // ---- Экран успеха после регистрации ----
  if (successEmail) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--background)', padding: '24px' }}>
        <div style={{ 
          background: 'var(--surface-container-lowest)', 
          padding: '40px', 
          width: '100%', 
          maxWidth: '450px',
          borderRadius: 'var(--radius-xl)',
          boxShadow: '0 8px 32px rgba(0, 53, 39, 0.08)',
          border: '1px solid var(--outline-variant)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>✉️</div>
          <h1 style={{ fontSize: '22px', fontWeight: '800', color: 'var(--primary)', marginBottom: '12px' }}>
            {language === 'RU' ? 'Введите код подтверждения' : language === 'KZ' ? 'Растау кодын енгізіңіз' : 'Enter verification code'}
          </h1>
          <p style={{ color: 'var(--on-surface-variant)', fontSize: '15px', marginBottom: '8px' }}>
            {language === 'RU' 
              ? 'Мы отправили код на:' 
              : language === 'KZ' 
                ? 'Біз кодты мына мекенжайға жібердік:' 
                : 'We sent a code to:'}
          </p>
          <p style={{ color: 'var(--primary)', fontWeight: '700', fontSize: '16px', marginBottom: '12px' }}>
            {successEmail}
          </p>
          <p style={{ color: 'var(--on-surface-variant)', fontSize: '13px', fontStyle: 'italic', marginBottom: '24px' }}>
            {language === 'RU' 
              ? '⚠️ Если письмо не пришло в течение минуты, обязательно проверьте папку Спам.' 
              : language === 'KZ' 
                ? '⚠️ Егер хат бір минут ішінде келмесе, Спам қалтасын міндетті түрде тексеріңіз.' 
                : '⚠️ If the email did not arrive within a minute, please be sure to check your Spam folder.'}
          </p>
          
          {error && (
            <div style={{ 
              background: 'var(--error-container)', 
              color: 'var(--on-error-container)', 
              padding: '12px 16px', 
              borderRadius: 'var(--radius-md)', 
              marginBottom: '24px', 
              fontSize: '14px',
              border: '1px solid rgba(186, 26, 26, 0.2)'
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleVerify} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <input 
                type="text" 
                value={verificationCode} 
                onChange={e => setVerificationCode(e.target.value)} 
                maxLength={6}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--outline-variant)',
                  background: 'var(--surface-container-low)',
                  color: 'var(--on-surface)',
                  fontSize: '24px',
                  letterSpacing: '8px',
                  textAlign: 'center',
                  outline: 'none',
                  transition: 'border-color 0.2s'
                }}
                onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
                onBlur={(e) => e.target.style.borderColor = 'var(--outline-variant)'}
                required 
                placeholder="000000"
              />
            </div>
            <button 
              type="submit"
              disabled={isVerifying || verificationCode.length < 6}
              style={{ 
                background: (isVerifying || verificationCode.length < 6) ? 'var(--primary-container)' : 'var(--primary)', 
                color: (isVerifying || verificationCode.length < 6) ? 'var(--on-primary-container)' : 'var(--on-primary)', 
                border: 'none', 
                borderRadius: 'var(--radius-md)', 
                padding: '14px', 
                fontSize: '16px', 
                fontWeight: '600',
                cursor: (isVerifying || verificationCode.length < 6) ? 'not-allowed' : 'pointer',
                transition: 'background 0.2s',
                width: '100%',
              }}
            >
              {isVerifying ? '...' : (language === 'RU' ? 'Подтвердить' : 'Verify')}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--background)', padding: '24px' }}>
      <div style={{ 
        background: 'var(--surface-container-lowest)', 
        padding: '40px', 
        width: '100%', 
        maxWidth: '450px',
        borderRadius: 'var(--radius-xl)',
        boxShadow: '0 8px 32px rgba(0, 53, 39, 0.08)',
        border: '1px solid var(--outline-variant)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <img src="/logo.jpg" alt="Logo" style={{ 
            width: '48px', height: '48px', 
            borderRadius: '12px',
            margin: '0 auto 16px auto',
            objectFit: 'cover'
          }} />
          <h1 style={{ fontSize: '24px', fontWeight: '800', color: 'var(--on-surface)', marginBottom: '8px' }}>{t.createAccountTitle}</h1>
          <p style={{ color: 'var(--on-surface-variant)', fontSize: '15px' }}>{t.subtitle}</p>
        </div>
        
        {error && (
          <div style={{ 
            background: 'var(--error-container)', 
            color: 'var(--on-error-container)', 
            padding: '12px 16px', 
            borderRadius: 'var(--radius-md)', 
            marginBottom: '24px', 
            fontSize: '14px',
            border: '1px solid rgba(186, 26, 26, 0.2)'
          }}>
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: 'var(--on-surface)' }}>{t.name}</label>
            <input 
              type="text" 
              value={name} 
              onChange={e => setName(e.target.value)} 
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--outline-variant)',
                background: 'var(--surface-container-low)',
                color: 'var(--on-surface)',
                fontSize: '15px',
                outline: 'none',
                transition: 'border-color 0.2s'
              }}
              onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
              onBlur={(e) => e.target.style.borderColor = 'var(--outline-variant)'}
              required 
              placeholder={t.namePlaceholder}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: 'var(--on-surface)' }}>{t.email}</label>
            <input 
              type="email" 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--outline-variant)',
                background: 'var(--surface-container-low)',
                color: 'var(--on-surface)',
                fontSize: '15px',
                outline: 'none',
                transition: 'border-color 0.2s'
              }}
              onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
              onBlur={(e) => e.target.style.borderColor = 'var(--outline-variant)'}
              required 
              placeholder="name@company.com"
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: 'var(--on-surface)' }}>{t.password}</label>
            <div style={{ position: 'relative' }}>
              <input 
                type={showPassword ? "text" : "password"} 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                style={{
                  width: '100%',
                  padding: '12px 40px 12px 16px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--outline-variant)',
                  background: 'var(--surface-container-low)',
                  color: 'var(--on-surface)',
                  fontSize: '15px',
                  outline: 'none',
                  transition: 'border-color 0.2s'
                }}
                onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
                onBlur={(e) => e.target.style.borderColor = 'var(--outline-variant)'}
                required 
                placeholder="••••••••"
              />
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '16px',
                  color: 'var(--on-surface-variant)'
                }}
              >
                {showPassword ? '👁️' : '🔒'}
              </button>
            </div>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: 'var(--on-surface)' }}>{t.confirmPassword}</label>
            <div style={{ position: 'relative' }}>
              <input 
                type={showPassword ? "text" : "password"} 
                value={confirmPassword} 
                onChange={e => setConfirmPassword(e.target.value)} 
                style={{
                  width: '100%',
                  padding: '12px 40px 12px 16px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--outline-variant)',
                  background: 'var(--surface-container-low)',
                  color: 'var(--on-surface)',
                  fontSize: '15px',
                  outline: 'none',
                  transition: 'border-color 0.2s'
                }}
                onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
                onBlur={(e) => e.target.style.borderColor = 'var(--outline-variant)'}
                required 
                placeholder="••••••••"
              />
            </div>
          </div>
          
          <button 
            type="submit"
            disabled={isLoading}
            style={{ 
              background: isLoading ? 'var(--primary-container)' : 'var(--primary)', 
              color: isLoading ? 'var(--on-primary-container)' : 'var(--on-primary)', 
              border: 'none', 
              borderRadius: 'var(--radius-md)', 
              padding: '14px', 
              fontSize: '16px', 
              fontWeight: '600',
              marginTop: '8px',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              transition: 'background 0.2s, opacity 0.2s',
              boxShadow: '0 4px 12px rgba(0, 53, 39, 0.2)',
              width: '100%',
              opacity: isLoading ? 0.7 : 1,
            }}
            onMouseOver={(e) => { if (!isLoading) e.currentTarget.style.filter = 'brightness(0.9)'; }}
            onMouseOut={(e) => { e.currentTarget.style.filter = 'brightness(1)'; }}
          >
            {isLoading ? '...' : t.register}
          </button>
        </form>

        <div style={{ margin: '20px 0', textAlign: 'center', color: 'var(--on-surface-variant)', fontSize: '14px', position: 'relative' }}>
          <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: '1px', background: 'var(--outline-variant)', zIndex: 1 }}></div>
          <span style={{ position: 'relative', zIndex: 2, background: 'var(--surface-container-lowest)', padding: '0 10px' }}>OR</span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => setError('Google Registration Failed')}
            useOneTap
          />
        </div>
        
        <p style={{ marginTop: '32px', textAlign: 'center', color: 'var(--on-surface-variant)', fontSize: '14px' }}>
          {t.alreadyHaveAccount} <Link href="/login" style={{ color: 'var(--primary)', fontWeight: '600', textDecoration: 'none' }}>{t.signIn}</Link>
        </p>
      </div>
    </div>
  );
}
