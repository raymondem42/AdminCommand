import { auth } from '@/auth';
import { SignOutForm } from '@/components/sign-out-form';
import Link from 'next/link';

export default async function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const userName = session?.user?.name?.split(' ')[0] || 'Admin';

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0b1020',
      backgroundImage: `
        radial-gradient(circle at top, rgba(255,255,255,0.05), transparent 35%),
        linear-gradient(180deg, #0b1020 0%, #0a0f1d 100%)
      `,
      color: 'white',
      fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    }}>

      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 20,
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        background: 'rgba(11,16,32,0.72)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        <div style={{
          maxWidth: 1280,
          margin: '0 auto',
          padding: '0 32px',
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>

          {/* Left — logo */}
          <Link href="/" style={{
            textDecoration: 'none',
            color: 'white',
            fontSize: 15,
            fontWeight: 700,
            letterSpacing: '-0.03em',
          }}>
            AdminCommand
          </Link>

          {/* Right — nav + user */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>

            <Link href="/history" style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              height: 34, padding: '0 14px', borderRadius: 99,
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: 'rgba(255,255,255,0.55)', fontSize: 13, fontWeight: 500,
              textDecoration: 'none', letterSpacing: '-0.01em',
            }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              History
            </Link>

            <Link href="/schedule" style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              height: 34, padding: '0 14px', borderRadius: 99,
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: 'rgba(255,255,255,0.55)', fontSize: 13, fontWeight: 500,
              textDecoration: 'none', letterSpacing: '-0.01em',
            }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
              Schedule
            </Link>

            <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.08)', margin: '0 6px' }} />

            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '4px 10px 4px 6px',
              borderRadius: 99,
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.07)',
            }}>
              <div style={{
                width: 26, height: 26, borderRadius: '50%',
                background: 'linear-gradient(135deg, #60A5FA, #A78BFA)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 700, color: 'white', flexShrink: 0,
              }}>
                {userName.charAt(0).toUpperCase()}
              </div>
              <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, fontWeight: 500 }}>
                {userName}
              </span>
            </div>

            <SignOutForm />
          </div>
        </div>
      </header>

      <main style={{
        maxWidth: 1280,
        margin: '0 auto',
        padding: '0 32px',
        minHeight: 'calc(100vh - 64px)',
      }}>
        {children}
      </main>

    </div>
  );
}