'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Action } from '@/lib/actions/registry';

type Step = 'params' | 'preview' | 'running' | 'done' | 'error';

const categoryColor: Record<string, string> = {
  license: '#FBBF24',
  user: '#60A5FA',
  security: '#F87171',
  mailbox: '#A78BFA',
  teams: '#34D399',
  report: '#94A3B8',
};

export default function ActionFlow({ action }: { action: Action }) {
  const router = useRouter();
  const [step, setStep] = useState<Step>('params');
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [result, setResult] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string>('');

  const [preloadedUsers] = useState<any[]>(() => {
    if (typeof window === 'undefined') return [];
    if (action.id === 'enforce-mfa-admins') {
      try {
        const stored = localStorage.getItem('admincommand_mfa_targets');
        if (stored) {
          const parsed = JSON.parse(stored);
          localStorage.removeItem('admincommand_mfa_targets');
          return parsed;
        }
      } catch {}
    }
    if (action.id === 'remove-teams-guests') {
      try {
        const stored = localStorage.getItem('admincommand_guest_targets');
        if (stored) {
          const parsed = JSON.parse(stored);
          localStorage.removeItem('admincommand_guest_targets');
          return parsed;
        }
      } catch {}
    }
    return [];
  });

  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(() => {
    if (typeof window === 'undefined') return new Set();
    if (action.id === 'enforce-mfa-admins') {
      try {
        const stored = localStorage.getItem('admincommand_mfa_targets');
        if (stored) {
          const parsed = JSON.parse(stored);
          return new Set(parsed.map((u: any) => u.upn));
        }
      } catch {}
    }
    if (action.id === 'remove-teams-guests') {
      try {
        const stored = localStorage.getItem('admincommand_guest_targets');
        if (stored) {
          const parsed = JSON.parse(stored);
          return new Set(parsed.map((u: any) => u.upn));
        }
      } catch {}
    }
    return new Set();
  });

  const color = categoryColor[action.category] || '#94A3B8';
  const allSelected = selectedUsers.size === preloadedUsers.length && preloadedUsers.length > 0;
  const isGuestFlow = action.id === 'remove-teams-guests';
  const hasPreloaded = preloadedUsers.length > 0;

  const badgeLabel = isGuestFlow ? 'Guest' : 'No MFA';
  const badgeColor = isGuestFlow ? '#34D399' : '#F87171';
  const badgeBg = isGuestFlow ? 'rgba(52,211,153,0.1)' : 'rgba(248,113,113,0.1)';
  const badgeBorder = isGuestFlow ? 'rgba(52,211,153,0.2)' : 'rgba(248,113,113,0.2)';
  const checkboxLabel = isGuestFlow ? 'Select which guests to remove:' : 'Select which users to enable MFA for:';
  const previewButtonLabel = hasPreloaded && selectedUsers.size > 0
    ? `${isGuestFlow ? 'Remove' : 'Enable MFA for'} ${selectedUsers.size} user${selectedUsers.size !== 1 ? 's' : ''} →`
    : hasPreloaded && selectedUsers.size === 0
    ? 'Select at least one user'
    : 'Preview →';

  function toggleUser(upn: string) {
    const next = new Set(selectedUsers);
    if (next.has(upn)) next.delete(upn);
    else next.add(upn);
    setSelectedUsers(next);
  }

  function toggleAll() {
    if (allSelected) setSelectedUsers(new Set());
    else setSelectedUsers(new Set(preloadedUsers.map((u: any) => u.upn)));
  }

  function downloadCSV(details: any[], filename: string, columns: { header: string; key: string }[]) {
    const csv = [
      columns.map(c => c.header).join(','),
      ...details.map(item => columns.map(c => `"${item[c.key] ?? ''}"`).join(',')),
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleConfirm() {
    setStep('running');
    try {
      const res = await fetch(`/api/actions/${action.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formValues,
          ...(preloadedUsers.length > 0 && { preloadedUsers: JSON.stringify(preloadedUsers) }),
          ...(selectedUsers.size > 0 && { selectedUpns: JSON.stringify([...selectedUsers]) }),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Action failed');
      setResult(data);
      setStep('done');

      try {
        const entry = {
          id: `${action.id}-${Date.now()}`,
          actionId: action.id,
          actionTitle: action.title,
          category: action.category,
          summary: data.summary ?? 'Action completed',
          ranAt: new Date().toISOString(),
          success: true,
        };
        const stored = localStorage.getItem('admincommand_history');
        const existing = stored ? JSON.parse(stored) : [];
        localStorage.setItem('admincommand_history', JSON.stringify([entry, ...existing].slice(0, 50)));
      } catch {}

    } catch (err: any) {
      setErrorMsg(err.message ?? 'Something went wrong');
      setStep('error');

      try {
        const entry = {
          id: `${action.id}-${Date.now()}`,
          actionId: action.id,
          actionTitle: action.title,
          category: action.category,
          summary: `Failed: ${err.message ?? 'Unknown error'}`,
          ranAt: new Date().toISOString(),
          success: false,
        };
        const stored = localStorage.getItem('admincommand_history');
        const existing = stored ? JSON.parse(stored) : [];
        localStorage.setItem('admincommand_history', JSON.stringify([entry, ...existing].slice(0, 50)));
      } catch {}
    }
  }

  function handleReset() {
    setStep('params');
    setResult(null);
    setFormValues({});
    setErrorMsg('');
  }

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: '48px 20px 120px' }}>

      {/* Back */}
      <button
        onClick={() => router.back()}
        style={{
          background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)',
          fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
          display: 'inline-flex', alignItems: 'center', gap: 6,
          marginBottom: 32, padding: 0,
        }}
      >
        ← Back
      </button>

      {/* Header */}
      <div style={{ marginBottom: 36 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <span style={{
            fontSize: 11, fontWeight: 700, letterSpacing: '0.1em',
            textTransform: 'uppercase', padding: '4px 12px', borderRadius: 99,
            color, background: `${color}18`, border: `1px solid ${color}30`,
          }}>
            {action.category}
          </span>
          {action.destructive && (
            <span style={{
              fontSize: 11, fontWeight: 700, letterSpacing: '0.1em',
              textTransform: 'uppercase', padding: '4px 12px', borderRadius: 99,
              color: '#F87171', background: 'rgba(248,113,113,0.08)',
              border: '1px solid rgba(248,113,113,0.2)',
            }}>
              Destructive
            </span>
          )}
        </div>
        <h1 style={{
          fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 800,
          letterSpacing: '-0.04em', color: 'white', margin: '0 0 12px',
        }}>
          {action.title}
        </h1>
        <p style={{ margin: 0, fontSize: 16, color: 'rgba(255,255,255,0.45)', lineHeight: 1.7 }}>
          {action.description}
        </p>
      </div>

      {/* PARAMS */}
      {step === 'params' && (
        <div style={{
          borderRadius: 24, border: '1px solid rgba(255,255,255,0.08)',
          background: 'linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.025))',
          padding: '32px 28px',
        }}>
          {action.why && (
            <div style={{
              borderRadius: 14, background: `${color}0a`, border: `1px solid ${color}20`,
              padding: '18px 20px', marginBottom: 28, fontSize: 14,
              color: 'rgba(255,255,255,0.65)', lineHeight: 1.8,
            }}>
              <span style={{ fontWeight: 700, color, marginRight: 6 }}>Why this matters</span>
              {action.why}
            </div>
          )}

          {hasPreloaded ? (
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: 16 }}>
                {checkboxLabel}
              </div>
              <div
                onClick={toggleAll}
                style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  padding: '12px 16px', borderRadius: 12, marginBottom: 10,
                  background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
                  cursor: 'pointer',
                }}
              >
                <div style={{
                  width: 20, height: 20, borderRadius: 6, flexShrink: 0,
                  background: allSelected ? color : 'rgba(255,255,255,0.06)',
                  border: `2px solid ${allSelected ? color : 'rgba(255,255,255,0.2)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, color: '#0b1020', fontWeight: 800,
                }}>
                  {allSelected ? '✓' : ''}
                </div>
                <span style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.45)' }}>
                  Select all ({preloadedUsers.length})
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 28 }}>
                {preloadedUsers.map((u: any) => {
                  const isSelected = selectedUsers.has(u.upn);
                  return (
                    <div
                      key={u.upn}
                      onClick={() => toggleUser(u.upn)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 14,
                        padding: '14px 16px', borderRadius: 14,
                        background: isSelected ? `${color}0d` : 'rgba(255,255,255,0.02)',
                        border: `1px solid ${isSelected ? `${color}30` : 'rgba(255,255,255,0.07)'}`,
                        cursor: 'pointer', transition: 'all 0.12s ease',
                      }}
                    >
                      <div style={{
                        width: 20, height: 20, borderRadius: 6, flexShrink: 0,
                        background: isSelected ? color : 'rgba(255,255,255,0.06)',
                        border: `2px solid ${isSelected ? color : 'rgba(255,255,255,0.15)'}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 12, color: '#0b1020', fontWeight: 800,
                        transition: 'all 0.12s ease',
                      }}>
                        {isSelected ? '✓' : ''}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 15, fontWeight: 600, color: 'white', marginBottom: 2 }}>{u.user}</div>
                        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)' }}>{u.upn}</div>
                      </div>
                      <span style={{
                        fontSize: 10, fontWeight: 700, letterSpacing: '0.08em',
                        textTransform: 'uppercase', padding: '3px 10px', borderRadius: 99,
                        color: badgeColor, background: badgeBg, border: `1px solid ${badgeBorder}`,
                      }}>
                        {badgeLabel}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : action.parameters.length === 0 ? (
            <p style={{ margin: '0 0 28px', fontSize: 15, color: 'rgba(255,255,255,0.5)', lineHeight: 1.7 }}>
              This action requires no additional input. Click below to preview what will happen.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 22, marginBottom: 28 }}>
              {action.parameters.map((param) => (
                <div key={param.id}>
                  <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.7)', marginBottom: 10 }}>
                    {param.label}
                  </label>
                  {param.type === 'select' && (
                    <select
                      value={formValues[param.id] ?? ''}
                      onChange={(e) => setFormValues((v) => ({ ...v, [param.id]: e.target.value }))}
                      style={{
                        width: '100%', padding: '12px 16px', borderRadius: 12,
                        background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                        color: 'white', fontSize: 15, fontFamily: 'inherit', outline: 'none', cursor: 'pointer',
                      }}
                    >
                      <option value="" disabled>Select an option...</option>
                      {param.options?.map((o) => (
                        <option key={o} value={o} style={{ background: '#0b1020' }}>{o}</option>
                      ))}
                    </select>
                  )}
                  {(param.type === 'text' || param.type === 'number') && (
                    <input
                      type={param.type === 'number' ? 'number' : 'text'}
                      placeholder={param.placeholder ?? ''}
                      value={formValues[param.id] ?? ''}
                      onChange={(e) => setFormValues((v) => ({ ...v, [param.id]: e.target.value }))}
                      style={{
                        width: '100%', padding: '12px 16px', borderRadius: 12,
                        background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                        color: 'white', fontSize: 15, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box',
                      }}
                    />
                  )}
                  {param.type === 'user-picker' && (
                    <input
                      type="text"
                      placeholder="Enter user email or ID..."
                      value={formValues[param.id] ?? ''}
                      onChange={(e) => setFormValues((v) => ({ ...v, [param.id]: e.target.value }))}
                      style={{
                        width: '100%', padding: '12px 16px', borderRadius: 12,
                        background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                        color: 'white', fontSize: 15, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box',
                      }}
                    />
                  )}
                </div>
              ))}
            </div>
          )}

          <button
            onClick={() => {
              if (hasPreloaded) {
                setFormValues(v => ({
                  ...v,
                  targets: 'Users from previous scan',
                  selectedUpns: JSON.stringify([...selectedUsers]),
                }));
              }
              setStep('preview');
            }}
            disabled={hasPreloaded && selectedUsers.size === 0}
            style={{
              width: '100%', height: 52, borderRadius: 14,
              background: hasPreloaded && selectedUsers.size === 0
                ? 'rgba(255,255,255,0.03)'
                : `linear-gradient(135deg, ${color}22, ${color}11)`,
              border: `1px solid ${hasPreloaded && selectedUsers.size === 0 ? 'rgba(255,255,255,0.06)' : `${color}40`}`,
              color: hasPreloaded && selectedUsers.size === 0 ? 'rgba(255,255,255,0.2)' : color,
              fontSize: 15, fontWeight: 700,
              cursor: hasPreloaded && selectedUsers.size === 0 ? 'default' : 'pointer',
              fontFamily: 'inherit',
            }}
          >
            {previewButtonLabel}
          </button>
        </div>
      )}

      {/* PREVIEW */}
      {step === 'preview' && (
        <div style={{
          borderRadius: 24, border: '1px solid rgba(255,255,255,0.08)',
          background: 'linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.025))',
          padding: '32px 28px',
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginBottom: 18 }}>
            About to run
          </div>
          <div style={{ fontSize: 20, fontWeight: 700, color: 'white', marginBottom: 10 }}>
            {action.title}
          </div>
          <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)', lineHeight: 1.7, marginBottom: 24 }}>
            {action.description}
          </div>

          {hasPreloaded && selectedUsers.size > 0 && (
            <div style={{
              borderRadius: 14, background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.07)',
              padding: '16px 18px', marginBottom: 24,
            }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
                Targeting {selectedUsers.size} user{selectedUsers.size !== 1 ? 's' : ''}
              </div>
              {preloadedUsers
                .filter((u: any) => selectedUsers.has(u.upn))
                .map((u: any) => (
                  <div key={u.upn} style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', padding: '4px 0' }}>
                    {u.user} <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>{u.upn}</span>
                  </div>
                ))}
            </div>
          )}

          {Object.keys(formValues).length > 0 && !hasPreloaded && (
            <div style={{
              borderRadius: 14, background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.07)',
              padding: '16px 18px', marginBottom: 24,
            }}>
              {Object.entries(formValues).map(([key, val]) => (
                <div key={key} style={{ display: 'flex', justifyContent: 'space-between', gap: 16, padding: '5px 0' }}>
                  <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)' }}>{key}</span>
                  <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.75)', fontWeight: 600 }}>{val}</span>
                </div>
              ))}
            </div>
          )}

          {action.destructive && (
            <div style={{
              borderRadius: 14, background: 'rgba(248,113,113,0.06)',
              border: '1px solid rgba(248,113,113,0.18)',
              padding: '16px 18px', marginBottom: 24,
              fontSize: 14, color: '#FCA5A5', lineHeight: 1.7,
            }}>
              ⚠ This action makes real changes to your tenant. Please confirm you want to proceed.
            </div>
          )}

          <div style={{ display: 'flex', gap: 12 }}>
            <button
              onClick={() => setStep('params')}
              style={{
                flex: 1, height: 52, borderRadius: 14,
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
                color: 'rgba(255,255,255,0.6)', fontSize: 15, fontWeight: 600,
                cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              ← Back
            </button>
            <button
              onClick={handleConfirm}
              style={{
                flex: 2, height: 52, borderRadius: 14,
                background: `linear-gradient(135deg, ${color}22, ${color}11)`,
                border: `1px solid ${color}40`,
                color, fontSize: 15, fontWeight: 700,
                cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              Confirm & Run
            </button>
          </div>
        </div>
      )}

      {/* RUNNING */}
      {step === 'running' && (
        <div style={{
          borderRadius: 24, border: '1px solid rgba(255,255,255,0.08)',
          background: 'linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.025))',
          padding: '80px 24px', textAlign: 'center',
        }}>
          <div style={{
            width: 48, height: 48, borderRadius: '50%', margin: '0 auto 24px',
            border: '3px solid rgba(255,255,255,0.1)',
            borderTop: `3px solid ${color}`,
            animation: 'spin 0.8s linear infinite',
          }} />
          <div style={{ fontSize: 18, fontWeight: 600, color: 'white', marginBottom: 10 }}>Running...</div>
          <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)' }}>Making changes to your tenant. Please wait.</div>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      {/* DONE */}
      {step === 'done' && result && (
        <div style={{
          borderRadius: 24, border: '1px solid rgba(52,211,153,0.2)',
          background: 'linear-gradient(180deg, rgba(52,211,153,0.06), rgba(52,211,153,0.02))',
          padding: '32px 28px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              background: 'rgba(52,211,153,0.15)', border: '1px solid rgba(52,211,153,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 18, flexShrink: 0,
            }}>✓</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#34D399' }}>Done</div>
          </div>

          <div style={{ fontSize: 16, color: 'white', fontWeight: 600, marginBottom: 20, lineHeight: 1.5 }}>
            {result.summary}
          </div>

          {/* License note */}
          {result.licenseNote && (
            <div style={{
              borderRadius: 14, background: 'rgba(251,191,36,0.06)',
              border: '1px solid rgba(251,191,36,0.18)',
              padding: '16px 18px', marginBottom: 18,
              display: 'flex', alignItems: 'flex-start', gap: 12,
            }}>
              <span style={{ fontSize: 18, flexShrink: 0 }}>💡</span>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#FBBF24', marginBottom: 4 }}>
                  Entra ID P1 required for bulk policy
                </div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', lineHeight: 1.6 }}>
                  Conditional Access policies require Microsoft Entra ID P1 or P2 licensing.
                  Your tenant is on the free tier. Use the per-user links below to enable MFA individually,
                  or upgrade your Microsoft license to unlock bulk policy creation.
                </div>
              </div>
            </div>
          )}

          {/* Details */}
          {Array.isArray(result.details) && result.details.length > 0 && (
            <div style={{
              borderRadius: 14, background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.07)',
              padding: '8px', marginBottom: 18,
              display: 'flex', flexDirection: 'column', gap: 6,
            }}>
              {result.details.map((item: any, i: number) => {
                if (item.type === 'success') {
                  return (
                    <div key={i} style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '10px 14px', borderRadius: 10,
                      background: 'rgba(52,211,153,0.05)',
                    }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#34D399', flexShrink: 0 }} />
                      <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)', fontWeight: 600, flex: 1 }}>{item.user}</span>
                      <span style={{ fontSize: 12, color: '#34D399', fontWeight: 600 }}>
                        {isGuestFlow ? 'Removed' : 'MFA enabled'}
                      </span>
                    </div>
                  );
                }
                if (item.type === 'fallback') {
                  return (
                    <a key={i} href={item.entraUrl} target="_blank" rel="noopener noreferrer" style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      textDecoration: 'none', padding: '10px 14px', borderRadius: 10,
                      background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.15)',
                    }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#FBBF24', flexShrink: 0 }} />
                      <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)', fontWeight: 600, flex: 1 }}>{item.user}</span>
                      <span style={{ fontSize: 12, color: '#FBBF24', fontWeight: 700 }}>Enable in Entra →</span>
                    </a>
                  );
                }
                if (item.type === 'error') {
                  return (
                    <div key={i} style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '10px 14px', borderRadius: 10,
                      background: 'rgba(248,113,113,0.05)',
                    }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#F87171', flexShrink: 0 }} />
                      <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)', fontWeight: 600, flex: 1 }}>{item.user}</span>
                      <span style={{ fontSize: 12, color: '#F87171', fontWeight: 600 }}>Failed</span>
                    </div>
                  );
                }
                return (
                  <div key={i} style={{
                    fontSize: 14, color: 'rgba(255,255,255,0.65)', lineHeight: 1.5,
                    padding: '8px 14px', borderRadius: 10,
                  }}>
                    {typeof item === 'string'
                      ? item
                      : item.user ?? item.team ?? item.mailbox ?? item.name ?? item.role ?? JSON.stringify(item)}
                  </div>
                );
              })}
            </div>
          )}

          {/* Exchange handoff */}
          {result.exchangeUrl && (
            <a href={result.exchangeUrl} target="_blank" rel="noopener noreferrer" style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '16px 18px', borderRadius: 14, marginBottom: 14,
              background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)',
              textDecoration: 'none',
            }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#A78BFA', marginBottom: 4 }}>
                  Finish in Exchange Admin Center
                </div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', lineHeight: 1.5 }}>
                  {result.exchangeNote ?? 'One step requires the Exchange Admin Center to complete.'}
                </div>
              </div>
              <div style={{ fontSize: 18, color: 'rgba(167,139,250,0.5)', flexShrink: 0 }}>→</div>
            </a>
          )}

          {/* Entra policy link */}
          {result.policyName && (
            <a href={result.entraUrl} target="_blank" rel="noopener noreferrer" style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '16px 18px', borderRadius: 14, marginBottom: 14,
              background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.2)',
              textDecoration: 'none',
            }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#34D399', marginBottom: 4 }}>View policy in Entra →</div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', lineHeight: 1.5 }}>{result.policyName}</div>
              </div>
              <div style={{ fontSize: 18, color: 'rgba(52,211,153,0.4)', flexShrink: 0 }}>→</div>
            </a>
          )}

          {/* find-no-mfa → enforce flow */}
          {action.id === 'find-no-mfa' && result.details?.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 14 }}>
              <button
                onClick={() => downloadCSV(result.details, 'no-mfa-users', [
                  { header: 'Name', key: 'user' },
                  { header: 'Email', key: 'upn' },
                ])}
                style={{
                  width: '100%', height: 48, borderRadius: 12,
                  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
                  color: 'rgba(255,255,255,0.6)', fontSize: 14, fontWeight: 600,
                  cursor: 'pointer', fontFamily: 'inherit',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}
              >
                ↓ Download list as CSV
              </button>
              <button
                onClick={() => {
                  try { localStorage.setItem('admincommand_mfa_targets', JSON.stringify(result.details)); } catch {}
                  router.push('/actions/enforce-mfa-admins');
                }}
                style={{
                  width: '100%', height: 52, borderRadius: 12,
                  background: 'linear-gradient(135deg, rgba(248,113,113,0.12), rgba(248,113,113,0.06))',
                  border: '1px solid rgba(248,113,113,0.25)',
                  color: '#FCA5A5', fontSize: 15, fontWeight: 700,
                  cursor: 'pointer', fontFamily: 'inherit',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}
              >
                Enforce MFA — choose which of the {result.details.length} users →
              </button>
            </div>
          )}

          {/* Scan again buttons */}
          {isGuestFlow && (
            <button
              onClick={() => router.push('/reports/guests')}
              style={{
                width: '100%', height: 48, borderRadius: 12, marginBottom: 12,
                background: 'linear-gradient(135deg, rgba(52,211,153,0.12), rgba(52,211,153,0.06))',
                border: '1px solid rgba(52,211,153,0.25)',
                color: '#34D399', fontSize: 14, fontWeight: 700,
                cursor: 'pointer', fontFamily: 'inherit',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}
            >
              ↺ Scan again to verify they're gone
            </button>
          )}

          {action.id === 'enforce-mfa-admins' && (
            <button
              onClick={() => router.push('/actions/find-no-mfa')}
              style={{
                width: '100%', height: 48, borderRadius: 12, marginBottom: 12,
                background: 'linear-gradient(135deg, rgba(248,113,113,0.12), rgba(248,113,113,0.06))',
                border: '1px solid rgba(248,113,113,0.25)',
                color: '#FCA5A5', fontSize: 14, fontWeight: 700,
                cursor: 'pointer', fontFamily: 'inherit',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}
            >
              ↺ Scan again to verify MFA is enforced
            </button>
          )}

          {/* Bottom buttons */}
          <div style={{ display: 'flex', gap: 12 }}>
            <button
              onClick={() => router.push('/')}
              style={{
                flex: 1, height: 48, borderRadius: 12,
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
                color: 'rgba(255,255,255,0.6)', fontSize: 14, fontWeight: 600,
                cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              Back to home
            </button>
            <button
              onClick={handleReset}
              style={{
                flex: 1, height: 48, borderRadius: 12,
                background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.2)',
                color: '#34D399', fontSize: 14, fontWeight: 600,
                cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              Run again
            </button>
          </div>
        </div>
      )}

      {/* ERROR */}
      {step === 'error' && (
        <div style={{
          borderRadius: 24, border: '1px solid rgba(248,113,113,0.2)',
          background: 'linear-gradient(180deg, rgba(248,113,113,0.06), rgba(248,113,113,0.02))',
          padding: '32px 28px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              background: 'rgba(248,113,113,0.15)', border: '1px solid rgba(248,113,113,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 18, flexShrink: 0,
            }}>✕</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#F87171' }}>Action failed</div>
          </div>
          <div style={{
            borderRadius: 14, background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.07)',
            padding: '16px 18px', marginBottom: 24,
            fontSize: 14, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6, fontFamily: 'monospace',
          }}>
            {errorMsg}
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <button
              onClick={() => router.push('/')}
              style={{
                flex: 1, height: 48, borderRadius: 12,
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
                color: 'rgba(255,255,255,0.6)', fontSize: 14, fontWeight: 600,
                cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              Back to home
            </button>
            <button
              onClick={handleReset}
              style={{
                flex: 1, height: 48, borderRadius: 12,
                background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)',
                color: '#F87171', fontSize: 14, fontWeight: 600,
                cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              Try again
            </button>
          </div>
        </div>
      )}
    </div>
  );
}