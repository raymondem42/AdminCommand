'use client';

import { useRouter } from 'next/navigation';

export function SignOutForm() {
  const router = useRouter();

  async function handleSignOut() {
    await fetch('/api/auth/signout', { method: 'POST' });
    router.push('/signin');
  }

  return (
    <button
      onClick={handleSignOut}
      type="button"
      style={{
        height: 38,
        padding: '0 14px',
        borderRadius: 12,
        border: '1px solid rgba(255,255,255,0.10)',
        background: 'linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.03))',
        color: 'rgba(255,255,255,0.72)',
        fontSize: 13,
        fontWeight: 700,
        letterSpacing: '-0.01em',
        cursor: 'pointer',
        fontFamily: 'inherit',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)',
        transition: 'all 140ms ease',
        WebkitTapHighlightColor: 'transparent',
      }}
      onMouseEnter={e => {
        const el = e.currentTarget;
        el.style.background = 'linear-gradient(180deg, rgba(255,255,255,0.09), rgba(255,255,255,0.05))';
        el.style.borderColor = 'rgba(255,255,255,0.16)';
        el.style.color = 'rgba(255,255,255,0.9)';
      }}
      onMouseLeave={e => {
        const el = e.currentTarget;
        el.style.background = 'linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.03))';
        el.style.borderColor = 'rgba(255,255,255,0.10)';
        el.style.color = 'rgba(255,255,255,0.72)';
      }}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
        <path d="m16 17 5-5-5-5" />
        <path d="M21 12H9" />
      </svg>
      <span>Sign out</span>
    </button>
  );
}