'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type Guest = {
  id: string;
  name: string;
  upn: string;
  email: string;
  createdDate: string;
  lastSignIn: string | null;
  daysSince: number;
};

export default function GuestAccountsPage() {
  const router = useRouter();
  const [guests, setGuests] = useState<Guest[]>([]);
  const [scanning, setScanning] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function runScan() {
    setScanning(true);
    setError(null);
    try {
      const res = await fetch('/api/reports/guests', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Scan failed');
      setGuests(data.guests ?? []);
      setScanned(true);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setScanning(false);
    }
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  return (
    <div style={{ color: 'white', padding: '48px 0', maxWidth: 900 }}>
      <Link href="/" style={{
        textDecoration: 'none', color: 'rgba(255,255,255,0.3)', fontSize: 13,
        display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 24,
      }}>
        ← Home
      </Link>

      <div style={{ marginBottom: 36 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.03em', margin: '0 0 6px' }}>
          Guest Accounts
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 14, margin: 0 }}>
          All external guest users in your tenant. Every guest has access to your files, Teams, and SharePoint — review them regularly.
        </p>
      </div>

      {error && (
        <div style={{
          background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)',
          borderRadius: 12, padding: '16px 20px', color: '#FCA5A5', fontSize: 14, marginBottom: 24,
        }}>
          {error}
        </div>
      )}

      {/* Pre-scan */}
      {!scanned && !scanning && (
        <div style={{
          borderRadius: 24, border: '1px solid rgba(52,211,153,0.15)',
          background: 'linear-gradient(180deg, rgba(52,211,153,0.06), rgba(52,211,153,0.02))',
          padding: '48px 32px', textAlign: 'center',
        }}>
          <div style={{ fontSize: 32, marginBottom: 16 }}>👥</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: 'white', marginBottom: 8 }}>
            Scan for guest accounts
          </div>
          <div style={{
            fontSize: 14, color: 'rgba(255,255,255,0.4)', lineHeight: 1.6,
            maxWidth: 400, margin: '0 auto 28px',
          }}>
            Find every external user who has been invited into your tenant.
          </div>
          <button
            onClick={runScan}
            style={{
              height: 48, padding: '0 32px', borderRadius: 99,
              background: 'rgba(52,211,153,0.12)', border: '1px solid rgba(52,211,153,0.25)',
              color: '#34D399', fontSize: 15, fontWeight: 700,
              cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            Scan tenant for guests →
          </button>
        </div>
      )}

      {/* Scanning */}
      {scanning && (
        <div style={{
          borderRadius: 24, border: '1px solid rgba(255,255,255,0.08)',
          background: 'linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.025))',
          padding: '60px 24px', textAlign: 'center',
        }}>
          <div style={{
            width: 40, height: 40, borderRadius: '50%', margin: '0 auto 20px',
            border: '3px solid rgba(255,255,255,0.1)', borderTop: '3px solid #34D399',
            animation: 'spin 0.8s linear infinite',
          }} />
          <div style={{ fontSize: 16, fontWeight: 600, color: 'white', marginBottom: 8 }}>Scanning tenant...</div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>Looking for external guest accounts.</div>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      {/* Results */}
      {scanned && !scanning && (
        <>
          {/* Summary */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 32 }}>
            {[
              { label: 'Total Guests', value: guests.length, color: guests.length > 0 ? '#F87171' : '#34D399' },
              { label: 'Added This Year', value: guests.filter(g => new Date(g.createdDate).getFullYear() === new Date().getFullYear()).length, color: 'white' },
            ].map(stat => (
              <div key={stat.label} style={{
                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 12, padding: '20px 22px',
              }}>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>
                  {stat.label}
                </div>
                <div style={{ fontSize: 32, fontWeight: 800, color: stat.color, letterSpacing: '-0.03em' }}>
                  {stat.value}
                </div>
              </div>
            ))}
          </div>

          {guests.length === 0 ? (
            <div style={{
              background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.2)',
              borderRadius: 12, padding: '20px 24px', color: '#6EE7B7', fontSize: 14, marginBottom: 24,
            }}>
              No guest accounts found. Your tenant has no external users.
            </div>
          ) : (
            <div style={{ marginBottom: 28 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#34D399', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
                  All Guests ({guests.length})
                </span>
                <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
              </div>

              <div style={{
                background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 12, overflow: 'hidden',
              }}>
                {guests.map((g, i) => (
                  <div key={g.id} style={{
                    display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px',
                    borderBottom: i < guests.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                  }}>
                    <div style={{
                      width: 8, height: 8, borderRadius: '50%',
                      background: '#34D399', flexShrink: 0,
                      boxShadow: '0 0 8px #34D39966',
                    }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: 'white' }}>{g.name}</div>
                      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>{g.email}</div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
                        Added {formatDate(g.createdDate)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Fix this */}
          {guests.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
                  Fix this
                </span>
                <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
              </div>

              {/* CSV Download */}
              <button
                onClick={() => {
                  const csv = [
                    'Name,Email,Added',
                    ...guests.map(g => `"${g.name}","${g.email}","${formatDate(g.createdDate)}"`),
                  ].join('\n');
                  const blob = new Blob([csv], { type: 'text/csv' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `guest-accounts-${new Date().toISOString().split('T')[0]}.csv`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                style={{
                  width: '100%', height: 44, borderRadius: 12,
                  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
                  color: 'rgba(255,255,255,0.6)', fontSize: 13, fontWeight: 600,
                  cursor: 'pointer', fontFamily: 'inherit',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}
              >
                ↓ Download as CSV
              </button>

              {/* Remove guests */}
              <button
                onClick={() => {
                  try {
                    localStorage.setItem('admincommand_guest_targets', JSON.stringify(
                    guests.map(g => ({ user: g.name, upn: g.upn, email: g.email, id: g.id }))
                    ));
                  } catch {}
                  router.push('/actions/remove-teams-guests');
                }}
                style={{
                  width: '100%', height: 52, borderRadius: 12,
                  background: 'linear-gradient(135deg, rgba(52,211,153,0.12), rgba(52,211,153,0.06))',
                  border: '1px solid rgba(52,211,153,0.25)',
                  color: '#34D399', fontSize: 15, fontWeight: 700,
                  cursor: 'pointer', fontFamily: 'inherit',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}
              >
                Choose which guests to remove → ({guests.length} found)
              </button>
            </div>
          )}

          <button
            onClick={() => { setScanned(false); setGuests([]); }}
            style={{
              height: 36, padding: '0 16px', borderRadius: 99,
              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
              color: 'rgba(255,255,255,0.4)', fontSize: 12, fontWeight: 600,
              cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            ↺ Scan again
          </button>
        </>
      )}
    </div>
  );
}