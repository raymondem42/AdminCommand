'use client';

import { useActionState } from 'react';
import { signInAction } from '@/services/msEntraId';

const valueCards = [
  {
    title: 'Savings Scan',
    text: 'Identify waste across unused licenses, inactive users, and overprovisioned accounts.',
  },
  {
    title: 'One-click fixes',
    text: 'Run guided admin actions without bouncing between Microsoft 365 admin portals.',
  },
  {
    title: 'Task scheduler',
    text: 'Create a task once and let AdminCommand handle recurring cleanup automatically.',
  },
];

const permissionGroups = [
  {
    title: 'Read tenant state',
    description:
      'Used to understand users, licenses, authentication coverage, audit signals, and tenant-wide findings.',
  },
  {
    title: 'Run approved actions',
    description:
      'Used only when you choose an action, like disabling inactive users, removing licenses, or updating access.',
  },
  {
    title: 'Maintain connection',
    description:
      'Used to keep your session active and support scheduled jobs or background sync features when enabled.',
  },
];

const trustItems = [
  'Nothing runs without your approval',
  'Every action can show a preview before execution',
  'Runs and results are written to history for review',
];

export default function SignInPage() {
  const [errorMessage, formAction, isPending] = useActionState(
    signInAction,
    undefined
  );

  return (
    <div
      style={{
        minHeight: 'calc(100vh - 64px)',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 20px 72px',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 1120,
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.1fr) minmax(320px, 420px)',
          gap: 20,
        }}
      >
        {/* Left side */}
        <section
          style={{
            borderRadius: 32,
            border: '1px solid rgba(255,255,255,0.08)',
            background:
              'linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.025))',
            boxShadow:
              '0 28px 80px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.04)',
            padding: '34px 30px',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: 0,
              pointerEvents: 'none',
              background: `
                radial-gradient(circle at 10% 10%, rgba(96,165,250,0.14), transparent 28%),
                radial-gradient(circle at 85% 18%, rgba(167,139,250,0.10), transparent 24%),
                radial-gradient(circle at 45% 100%, rgba(52,211,153,0.06), transparent 28%)
              `,
            }}
          />

          <div style={{ position: 'relative', zIndex: 1 }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '7px 12px',
                borderRadius: 999,
                border: '1px solid rgba(255,255,255,0.08)',
                background: 'rgba(255,255,255,0.03)',
                color: 'rgba(255,255,255,0.56)',
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                marginBottom: 20,
              }}
            >
              Microsoft 365 admin automation
            </div>

            <h1
              style={{
                margin: '0 0 14px',
                fontSize: 'clamp(34px, 5vw, 58px)',
                lineHeight: 0.98,
                fontWeight: 800,
                letterSpacing: '-0.06em',
                color: 'white',
                maxWidth: 620,
              }}
            >
              Connect your Microsoft 365 tenant
            </h1>

            <p
              style={{
                margin: 0,
                maxWidth: 640,
                fontSize: 16,
                lineHeight: 1.75,
                color: 'rgba(255,255,255,0.48)',
              }}
            >
              Find waste, fix issues, and automate recurring admin work from one place.
            </p>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: 12,
                marginTop: 28,
              }}
            >
              {valueCards.map((item) => (
                <div
                  key={item.title}
                  style={{
                    borderRadius: 20,
                    border: '1px solid rgba(255,255,255,0.07)',
                    background: 'rgba(255,255,255,0.03)',
                    padding: '18px 16px',
                    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.03)',
                  }}
                >
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 700,
                      color: 'white',
                      marginBottom: 7,
                      letterSpacing: '-0.02em',
                    }}
                  >
                    {item.title}
                  </div>
                  <div
                    style={{
                      fontSize: 13,
                      lineHeight: 1.6,
                      color: 'rgba(255,255,255,0.42)',
                    }}
                  >
                    {item.text}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Right side */}
        <section
          style={{
            borderRadius: 32,
            border: '1px solid rgba(255,255,255,0.08)',
            background:
              'linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.025))',
            boxShadow:
              '0 28px 80px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.04)',
            padding: '28px 24px',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.32)',
              marginBottom: 10,
            }}
          >
            Secure access
          </div>

          <div
            style={{
              fontSize: 28,
              fontWeight: 800,
              letterSpacing: '-0.05em',
              color: 'white',
              lineHeight: 1.02,
              marginBottom: 10,
            }}
          >
            Continue with Microsoft
          </div>

          <p
            style={{
              margin: '0 0 18px',
              fontSize: 14,
              lineHeight: 1.7,
              color: 'rgba(255,255,255,0.46)',
            }}
          >
            Use your Microsoft Entra ID account to access reports, actions, and command search.
          </p>

          <form action={formAction} style={{ marginBottom: 20 }}>
            <button
              disabled={isPending}
              style={{
                width: '100%',
                height: 50,
                borderRadius: 16,
                border: '1px solid rgba(96,165,250,0.22)',
                background: isPending
                  ? 'rgba(96,165,250,0.08)'
                  : 'rgba(96,165,250,0.12)',
                color: '#DBEAFE',
                fontSize: 14,
                fontWeight: 700,
                cursor: isPending ? 'default' : 'pointer',
                fontFamily: 'inherit',
                boxShadow: '0 10px 30px rgba(59,130,246,0.12)',
              }}
            >
              {isPending ? 'Connecting...' : 'Continue with Microsoft'}
            </button>

            {errorMessage && (
              <p
                role="alert"
                style={{
                  marginTop: 12,
                  marginBottom: 0,
                  fontSize: 13,
                  lineHeight: 1.6,
                  color: '#FCA5A5',
                }}
              >
                {errorMessage}
              </p>
            )}
          </form>

          <div
            style={{
              borderRadius: 20,
              border: '1px solid rgba(255,255,255,0.08)',
              background: 'rgba(255,255,255,0.03)',
              padding: '16px 16px',
              marginBottom: 14,
            }}
          >
            <div
              style={{
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: 'rgba(255,255,255,0.34)',
                marginBottom: 10,
              }}
            >
              Why access is needed
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {permissionGroups.map((group) => (
                <div key={group.title}>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: 'white',
                      marginBottom: 4,
                    }}
                  >
                    {group.title}
                  </div>
                  <div
                    style={{
                      fontSize: 13,
                      lineHeight: 1.6,
                      color: 'rgba(255,255,255,0.44)',
                    }}
                  >
                    {group.description}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div
            style={{
              borderRadius: 20,
              border: '1px solid rgba(255,255,255,0.08)',
              background: 'rgba(255,255,255,0.03)',
              padding: '16px 16px',
            }}
          >
            <div
              style={{
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: 'rgba(255,255,255,0.34)',
                marginBottom: 10,
              }}
            >
              Built for trust
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {trustItems.map((item) => (
                <div
                  key={item}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 10,
                  }}
                >
                  <div
                    style={{
                      width: 7,
                      height: 7,
                      borderRadius: '50%',
                      background: '#60A5FA',
                      marginTop: 6,
                      flexShrink: 0,
                      boxShadow: '0 0 12px rgba(96,165,250,0.45)',
                    }}
                  />
                  <div
                    style={{
                      fontSize: 13,
                      lineHeight: 1.6,
                      color: 'rgba(255,255,255,0.48)',
                    }}
                  >
                    {item}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      <style>{`
        @media (max-width: 920px) {
          div[style*="grid-template-columns: minmax(0, 1.1fr) minmax(320px, 420px)"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}