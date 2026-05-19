'use client';

// Reusable InitialsAvatar component
// Usage: <InitialsAvatar name="John Doe" size={36} fontSize={14} />

interface InitialsAvatarProps {
  name?: string | null;
  size?: number;
  fontSize?: number;
  border?: boolean;
}

export default function InitialsAvatar({ name, size = 36, fontSize = 14, border = false }: InitialsAvatarProps) {
  const initials = name
    ? name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((w) => w[0]?.toUpperCase() ?? '')
        .join('')
    : 'U';

  return (
    <div
      style={{
        width: size,
        height: size,
        minWidth: size,
        borderRadius: '50%',
        background: '#003527',
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize,
        fontWeight: 700,
        fontFamily: 'var(--font-plus-jakarta), sans-serif',
        letterSpacing: '0.5px',
        border: border ? '2px solid rgba(255,255,255,0.3)' : 'none',
        userSelect: 'none',
        flexShrink: 0,
      }}
    >
      {initials}
    </div>
  );
}
