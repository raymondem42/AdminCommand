'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { actions } from '@/lib/actions/registry';

type SearchResult = {
  id: string;
  title: string;
  description: string;
  category: string;
  type: 'action' | 'report';
  href?: string;
};

type SearchState = 'idle' | 'results' | 'retry' | 'all' | 'stuck';

const reports: SearchResult[] = [
  { id: 'report-licenses', title: 'Unused Licenses', description: 'Find licenses that are purchased but not assigned to anyone.', category: 'report', type: 'report', href: '/reports/licenses' },
  { id: 'report-guests', title: 'Guest Accounts', description: 'Audit all external guest users in your tenant.', category: 'report', type: 'report', href: '/reports/guests' },
  { id: 'report-admins', title: 'Admin Role Audit', description: 'Every user with admin privileges across your tenant.', category: 'report', type: 'report', href: '/reports/admins' },
  { id: 'report-inactive', title: 'Inactive Users', description: "Users who haven't signed in for 30+ days.", category: 'report', type: 'report', href: '/reports/inactive' },
  { id: 'report-savings', title: 'Savings Scan', description: 'Full breakdown of monthly M365 waste and savings opportunities.', category: 'report', type: 'report', href: '/reports/savings-scan' },
];

const allItems: SearchResult[] = [
  ...actions.map((a) => ({
    id: a.id,
    title: a.title,
    description: a.description,
    category: a.category,
    type: 'action' as const,
  })),
  ...reports,
];

const categoryMeta: Record<
  string,
  { label: string; color: string; bg: string; border: string }
> = {
  license: {
    label: 'License',
    color: '#FBBF24',
    bg: 'rgba(251,191,36,0.10)',
    border: 'rgba(251,191,36,0.18)',
  },
  user: {
    label: 'User',
    color: '#60A5FA',
    bg: 'rgba(96,165,250,0.10)',
    border: 'rgba(96,165,250,0.18)',
  },
  security: {
    label: 'Security',
    color: '#F87171',
    bg: 'rgba(248,113,113,0.10)',
    border: 'rgba(248,113,113,0.18)',
  },
  mailbox: {
    label: 'Mailbox',
    color: '#A78BFA',
    bg: 'rgba(167,139,250,0.10)',
    border: 'rgba(167,139,250,0.18)',
  },
  teams: {
    label: 'Teams',
    color: '#34D399',
    bg: 'rgba(52,211,153,0.10)',
    border: 'rgba(52,211,153,0.18)',
  },
  report: {
    label: 'Report',
    color: '#94A3B8',
    bg: 'rgba(148,163,184,0.10)',
    border: 'rgba(148,163,184,0.18)',
  },
};

const FREE_FEATURES = [
  {
    title: 'Savings Scan',
    description:
      'See how much your tenant wastes on licenses, disabled accounts, and overprovisioned users.',
    color: '#FBBF24',
    href: '/reports/savings-scan',
    action: 'Run scan',
    eyebrow: 'Cost',
  },
  {
    title: 'MFA Coverage',
    description:
      'Find every user without MFA and move straight into a guided remediation flow.',
    color: '#F87171',
    href: '/actions/find-no-mfa',
    action: 'Check coverage',
    eyebrow: 'Security',
  },
  {
    title: 'Inactive Users',
    description:
      "Surface users who haven't signed in recently and clean them up fast.",
    color: '#60A5FA',
    href: '/reports/inactive',
    action: 'Review users',
    eyebrow: 'Identity',
  },
  {
    title: 'Unused Licenses',
    description:
      "See every license SKU where you're paying for seats that are not being used.",
    color: '#FBBF24',
    href: '/reports/licenses',
    action: 'View report',
    eyebrow: 'Licensing',
  },
  {
    title: 'Admin Audit',
    description:
      'Review privileged users across your tenant and spot roles that should be removed.',
    color: '#A78BFA',
    href: '/reports/admins',
    action: 'Audit admins',
    eyebrow: 'Access',
  },
];

const RECENT_KEY = 'admincommand_recent';

function TypedText({ text }: { text: string }) {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    setDisplayed('');
    setDone(false);
    if (!text) return;

    let i = 0;
    const interval = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) {
        clearInterval(interval);
        setDone(true);
      }
    }, 8);

    return () => clearInterval(interval);
  }, [text]);

  function renderLine(line: string, key: number) {
    if (line.trim() === '---') {
      return (
        <div
          key={key}
          style={{
            height: 1,
            background: 'rgba(255,255,255,0.08)',
            margin: '18px 0',
          }}
        />
      );
    }

    const parts = line.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);

    return (
      <span key={key}>
        {parts.map((part, i) => {
          if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
            return (
              <strong
                key={i}
                style={{ color: 'rgba(255,255,255,0.95)', fontWeight: 700 }}
              >
                {part.slice(2, -2)}
              </strong>
            );
          }

          if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
            return (
              <code
                key={i}
                style={{
                  background: 'rgba(156,196,255,0.1)',
                  border: '1px solid rgba(156,196,255,0.2)',
                  borderRadius: 6,
                  padding: '1px 6px',
                  fontSize: 13,
                  fontFamily: 'monospace',
                  color: '#9CC4FF',
                }}
              >
                {part.slice(1, -1)}
              </code>
            );
          }

          return <span key={i}>{part}</span>;
        })}
      </span>
    );
  }

  const lines = displayed.split('\n');

  return (
    <div
      style={{
        fontSize: 14,
        color: 'rgba(255,255,255,0.72)',
        lineHeight: 1.9,
        textAlign: 'left',
      }}
    >
      {lines.map((line, i) => (
        <div key={i} style={{ minHeight: line.trim() === '' ? '0.8em' : undefined }}>
          {renderLine(line, i)}
        </div>
      ))}
      {!done && <span style={{ animation: 'blink 1s step-end infinite' }}>▋</span>}
    </div>
  );
}

function ThinkingDots() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '36px 0 42px',
      }}
    >
      <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: '#9CC4FF',
              animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
            }}
          />
        ))}
      </div>
      <div
        style={{
          fontSize: 14,
          color: 'rgba(255,255,255,0.40)',
          letterSpacing: '0.01em',
        }}
      >
        Thinking through the best path...
      </div>
    </div>
  );
}

export default function HomePage() {
  const [query, setQuery] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchState, setSearchState] = useState<SearchState>('idle');
  const [recentActions, setRecentActions] = useState<SearchResult[]>([]);
  const [aiSuggestion, setAiSuggestion] = useState('');
  const [loadingAiSuggestion, setLoadingAiSuggestion] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    try {
      const stored = localStorage.getItem(RECENT_KEY);
      if (stored) setRecentActions(JSON.parse(stored));
    } catch {}
  }, []);

  async function runSearch(q: string, isRetry = false) {
    if (!q.trim()) return;

    setLoading(true);
    setQuery(q);

    try {
      const res = await fetch('/api/cmd', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: q,
          exclude: isRetry ? results.map((r) => r.id) : [],
        }),
      });

      const data = await res.json();
      const newResults = (data.results || []).slice(0, 3);

      setResults(newResults);
      setSearchState(newResults.length > 0 ? 'results' : 'all');
    } catch {
      const lower = q.toLowerCase();
      const fallback = allItems
        .filter(
          (i) =>
            i.title.toLowerCase().includes(lower) ||
            i.description.toLowerCase().includes(lower)
        )
        .slice(0, 3);

      setResults(fallback);
      setSearchState(fallback.length > 0 ? 'results' : 'all');
    } finally {
      setLoading(false);
    }
  }

  async function loadAiSuggestion(q: string) {
    setLoadingAiSuggestion(true);

    try {
      const res = await fetch('/api/cmd/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q }),
      });

      const data = await res.json();
      setAiSuggestion(data.suggestion || '');
    } catch {
      setAiSuggestion(
        "This might require a manual change in the Microsoft 365 Admin Center or a custom PowerShell script. Try searching Microsoft's documentation at learn.microsoft.com for this specific task."
      );
    } finally {
      setLoadingAiSuggestion(false);
    }
  }

  function handleSelect(result: SearchResult) {
    const updated = [result, ...recentActions.filter((r) => r.id !== result.id)].slice(0, 5);
    setRecentActions(updated);

    try {
      localStorage.setItem(RECENT_KEY, JSON.stringify(updated));
    } catch {}

    if (result.type === 'report' && result.href) {
      router.push(result.href);
    } else {
      router.push(`/actions/${result.id}`);
    }
  }

  function handleReset() {
    setSearchState('idle');
    setResults([]);
    setQuery('');
    setInputValue('');
    setAiSuggestion('');
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  function handleNotMatch() {
    setSearchState('retry');
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  function handleRetrySearch() {
    if (inputValue.trim()) runSearch(inputValue, true);
  }

  function handleShowAll() {
    setSearchState('all');
  }

  function handleStuck() {
    setSearchState('stuck');
    loadAiSuggestion(query);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (searchState === 'retry') handleRetrySearch();
      else runSearch(inputValue);
    } else if (e.key === 'Escape') {
      handleReset();
    }
  }

  const searchInput = (
    <div style={{ width: '100%', marginBottom: 16 }}>
      {searchState === 'retry' && (
        <div
          style={{
            fontSize: 14,
            color: 'rgba(255,255,255,0.42)',
            marginBottom: 16,
            textAlign: 'center',
          }}
        >
          Try describing the outcome you want, not the tool you think you need.
        </div>
      )}

      <div
        style={{
          borderRadius: 22,
          border: '1px solid rgba(255,255,255,0.10)',
          background:
            'linear-gradient(180deg, rgba(255,255,255,0.055), rgba(255,255,255,0.03))',
          boxShadow:
            '0 20px 60px rgba(0,0,0,0.24), inset 0 1px 0 rgba(255,255,255,0.04)',
          padding: 10,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            minHeight: 60,
            padding: '0 10px 0 8px',
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 14,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.07)',
              flexShrink: 0,
            }}
          >
            {loading ? (
              <div
                style={{
                  width: 18,
                  height: 18,
                  border: '2px solid rgba(255,255,255,0.14)',
                  borderTop: '2px solid rgba(255,255,255,0.65)',
                  borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite',
                }}
              />
            ) : (
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="rgba(255,255,255,0.45)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.5-3.5" />
              </svg>
            )}
          </div>

          <input
            ref={inputRef}
            autoFocus
            type="text"
            placeholder={
              searchState === 'retry'
                ? 'Describe what you want to accomplish...'
                : 'Try "disable inactive users" or "remove licenses"...'
            }
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: 'white',
              fontSize: 15,
              fontFamily: 'inherit',
              minWidth: 0,
            }}
          />

          {inputValue && (
            <button
              onClick={() => setInputValue('')}
              style={{
                width: 32,
                height: 32,
                borderRadius: 10,
                border: '1px solid rgba(255,255,255,0.08)',
                background: 'rgba(255,255,255,0.04)',
                color: 'rgba(255,255,255,0.42)',
                cursor: 'pointer',
                padding: 0,
                fontSize: 18,
                lineHeight: 1,
                flexShrink: 0,
              }}
            >
              ×
            </button>
          )}

          <button
            onClick={() => runSearch(inputValue)}
            disabled={!inputValue.trim() || loading}
            style={{
              height: 40,
              padding: '0 16px',
              borderRadius: 999,
              border: '1px solid rgba(96,165,250,0.20)',
              background: inputValue.trim()
                ? 'rgba(96,165,250,0.12)'
                : 'rgba(255,255,255,0.04)',
              color: inputValue.trim() ? '#BFDBFE' : 'rgba(255,255,255,0.28)',
              fontSize: 13,
              fontWeight: 700,
              cursor: inputValue.trim() && !loading ? 'pointer' : 'default',
              fontFamily: 'inherit',
              flexShrink: 0,
            }}
          >
            Search
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div
      style={{
        minHeight: 'calc(100vh - 64px)',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: searchState === 'idle' ? 'center' : 'flex-start',
        padding: searchState === 'idle' ? '42px 20px 84px' : '48px 20px 84px',
      }}
    >
      <div style={{ width: '100%', maxWidth: 980 }}>
        {searchState === 'idle' && (
          <>
            {/* Hero */}
            <div style={{ textAlign: 'center', marginBottom: 28 }}>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '7px 12px',
                  borderRadius: 999,
                  border: '1px solid rgba(255,255,255,0.08)',
                  background: 'rgba(255,255,255,0.03)',
                  color: 'rgba(255,255,255,0.56)',
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  marginBottom: 18,
                }}
              >
                Microsoft 365 command center
              </div>

              <div
                style={{
                  fontSize: 'clamp(42px, 7vw, 76px)',
                  lineHeight: 0.98,
                  fontWeight: 800,
                  letterSpacing: '-0.06em',
                  color: 'white',
                  marginBottom: 14,
                }}
              >
                AdminCommand
              </div>

              <p
                style={{
                  margin: '0 auto',
                  fontSize: 16,
                  color: 'rgba(255,255,255,0.44)',
                  lineHeight: 1.7,
                  maxWidth: 680,
                }}
              >
                Search for the task you need, launch a report, or jump straight into the tools
                your tenant uses most.
              </p>
            </div>

            {/* Search hero shell */}
            <div
              style={{
                borderRadius: 28,
                border: '1px solid rgba(255,255,255,0.08)',
                background:
                  'linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.025))',
                padding: '22px 22px 18px',
                boxShadow:
                  '0 28px 80px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.04)',
                marginBottom: 22,
              }}
            >
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: '0.10em',
                  textTransform: 'uppercase',
                  color: 'rgba(255,255,255,0.32)',
                  marginBottom: 12,
                  textAlign: 'left',
                }}
              >
                Search actions and reports
              </div>

              {searchInput}

              <div
                style={{
                  display: 'flex',
                  gap: 10,
                  flexWrap: 'wrap',
                }}
              >
                {[
                  { label: 'See All Reports', href: '/reports' },
                  { label: 'See All Actions', href: '/actions' },
                ].map((item, i) => (
                  <button
                    key={item.label}
                    onClick={() => router.push(item.href)}
                    style={{
                      height: 42,
                      padding: '0 16px',
                      borderRadius: 999,
                      border:
                        i === 2
                          ? '1px solid rgba(96,165,250,0.20)'
                          : '1px solid rgba(255,255,255,0.08)',
                      background:
                        i === 2
                          ? 'rgba(96,165,250,0.10)'
                          : 'rgba(255,255,255,0.04)',
                      color: i === 2 ? '#BFDBFE' : 'white',
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                    }}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Featured free tools */}
            <div style={{ marginTop: 26, marginBottom: recentActions.length > 0 ? 28 : 0 }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  marginBottom: 16,
                }}
              >
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: 'rgba(255,255,255,0.28)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.12em',
                  }}
                >
                  Free tools. For eveyone. No subscription needed.
                </span>
                <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.05)' }} />
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                  gap: 12,
                }}
              >
                {FREE_FEATURES.map((feature) => (
                  <div
                    key={feature.title}
                    onClick={() => router.push(feature.href)}
                    style={{
                      borderRadius: 20,
                      border: `1px solid ${feature.color}22`,
                      background: `linear-gradient(180deg, ${feature.color}10, rgba(255,255,255,0.02))`,
                      padding: '18px 18px',
                      cursor: 'pointer',
                      transition: 'transform 140ms ease, border-color 140ms ease',
                      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.03)',
                    }}
                    onMouseEnter={(e) => {
                      const el = e.currentTarget as HTMLDivElement;
                      el.style.borderColor = `${feature.color}44`;
                      el.style.transform = 'translateY(-1px)';
                    }}
                    onMouseLeave={(e) => {
                      const el = e.currentTarget as HTMLDivElement;
                      el.style.borderColor = `${feature.color}22`;
                      el.style.transform = 'translateY(0px)';
                    }}
                  >
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        padding: '4px 8px',
                        borderRadius: 999,
                        fontSize: 10,
                        fontWeight: 800,
                        letterSpacing: '0.10em',
                        textTransform: 'uppercase',
                        color: feature.color,
                        background: `${feature.color}16`,
                        border: `1px solid ${feature.color}24`,
                        marginBottom: 12,
                      }}
                    >
                      {feature.eyebrow}
                    </div>

                    <div
                      style={{
                        fontSize: 16,
                        fontWeight: 700,
                        color: 'white',
                        marginBottom: 8,
                        letterSpacing: '-0.02em',
                      }}
                    >
                      {feature.title}
                    </div>

                    <div
                      style={{
                        fontSize: 13,
                        color: 'rgba(255,255,255,0.44)',
                        lineHeight: 1.65,
                        marginBottom: 16,
                      }}
                    >
                      {feature.description}
                    </div>

                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        color: feature.color,
                      }}
                    >
                      {feature.action} →
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent */}
            {recentActions.length > 0 && (
              <div style={{ width: '100%', marginTop: 30 }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    marginBottom: 12,
                  }}
                >
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: 'rgba(255,255,255,0.28)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.12em',
                    }}
                  >
                    Recent
                  </span>
                  <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.05)' }} />
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                    gap: 10,
                  }}
                >
                  {recentActions.map((item) => {
                    const meta = categoryMeta[item.category] ?? categoryMeta.report;

                    return (
                      <div
                        key={item.id}
                        onClick={() => handleSelect(item)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 12,
                          padding: '14px 14px',
                          borderRadius: 16,
                          background: 'rgba(255,255,255,0.03)',
                          border: '1px solid rgba(255,255,255,0.06)',
                          cursor: 'pointer',
                        }}
                      >
                        <div
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            background: meta.color,
                            boxShadow: `0 0 12px ${meta.color}66`,
                            flexShrink: 0,
                          }}
                        />
                        <div style={{ minWidth: 0 }}>
                          <div
                            style={{
                              fontSize: 13,
                              color: 'white',
                              fontWeight: 600,
                              marginBottom: 3,
                            }}
                          >
                            {item.title}
                          </div>
                          <div
                            style={{
                              fontSize: 11,
                              color: 'rgba(255,255,255,0.34)',
                              textTransform: 'uppercase',
                              letterSpacing: '0.08em',
                              fontWeight: 700,
                            }}
                          >
                            {meta.label}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}

        {/* NON-IDLE */}
        {searchState !== 'idle' && (
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <button
              onClick={handleReset}
              style={{
                background: 'none',
                border: 'none',
                color: 'rgba(255,255,255,0.34)',
                fontSize: 13,
                cursor: 'pointer',
                fontFamily: 'inherit',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              ← New search
            </button>
          </div>
        )}

        {searchState === 'retry' && searchInput}

        {/* Results */}
        {searchState === 'results' && (
          <div
            style={{
              borderRadius: 28,
              border: '1px solid rgba(255,255,255,0.08)',
              background:
                'linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.025))',
              boxShadow: '0 24px 80px rgba(0,0,0,0.24)',
              overflow: 'hidden',
            }}
          >
            <div style={{ padding: '24px 22px 8px', textAlign: 'center' }}>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: 'rgba(255,255,255,0.28)',
                  marginBottom: 8,
                }}
              >
                Best matches
              </div>
              <div
                style={{
                  fontSize: 22,
                  fontWeight: 700,
                  color: 'white',
                  letterSpacing: '-0.03em',
                  marginBottom: 8,
                }}
              >
                Here’s the best path for “{query}”
              </div>
              <div
                style={{
                  fontSize: 13,
                  color: 'rgba(255,255,255,0.38)',
                  marginBottom: 18,
                }}
              >
                Pick the closest action or report below.
              </div>
            </div>

            <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {results.map((result, i) => {
                const meta = categoryMeta[result.category] ?? categoryMeta.report;

                return (
                  <div
                    key={result.id}
                    onClick={() => handleSelect(result)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 16,
                      padding: '18px 18px',
                      borderRadius: 18,
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.07)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      position: 'relative',
                    }}
                    onMouseEnter={(e) => {
                      const el = e.currentTarget as HTMLDivElement;
                      el.style.background = 'rgba(255,255,255,0.06)';
                      el.style.borderColor = 'rgba(255,255,255,0.14)';
                    }}
                    onMouseLeave={(e) => {
                      const el = e.currentTarget as HTMLDivElement;
                      el.style.background = 'rgba(255,255,255,0.03)';
                      el.style.borderColor = 'rgba(255,255,255,0.07)';
                    }}
                  >
                    {i === 0 && (
                      <div
                        style={{
                          position: 'absolute',
                          top: -1,
                          left: 18,
                          fontSize: 9,
                          fontWeight: 800,
                          letterSpacing: '0.1em',
                          textTransform: 'uppercase',
                          color: '#9CC4FF',
                          background: 'rgba(96,165,250,0.12)',
                          border: '1px solid rgba(96,165,250,0.2)',
                          borderTop: 'none',
                          padding: '3px 8px',
                          borderBottomLeftRadius: 6,
                          borderBottomRightRadius: 6,
                        }}
                      >
                        Best match
                      </div>
                    )}

                    <div
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: '50%',
                        flexShrink: 0,
                        background: meta.color,
                        boxShadow: `0 0 12px ${meta.color}66`,
                        marginTop: i === 0 ? 8 : 0,
                      }}
                    />

                    <div style={{ flex: 1, minWidth: 0, marginTop: i === 0 ? 8 : 0 }}>
                      <div
                        style={{
                          fontSize: 16,
                          fontWeight: 700,
                          color: 'white',
                          marginBottom: 5,
                        }}
                      >
                        {result.title}
                      </div>
                      <div
                        style={{
                          fontSize: 13,
                          color: 'rgba(255,255,255,0.42)',
                          lineHeight: 1.6,
                        }}
                      >
                        {result.description}
                      </div>
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'flex-end',
                        gap: 8,
                        flexShrink: 0,
                        marginTop: i === 0 ? 8 : 0,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          letterSpacing: '0.08em',
                          textTransform: 'uppercase',
                          padding: '4px 8px',
                          borderRadius: 999,
                          color: meta.color,
                          background: meta.bg,
                          border: `1px solid ${meta.border}`,
                        }}
                      >
                        {meta.label}
                      </span>
                      <span
                        style={{
                          fontSize: 12,
                          color: 'rgba(255,255,255,0.22)',
                        }}
                      >
                        Open →
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
                padding: '18px 20px 8px',
                borderTop: '1px solid rgba(255,255,255,0.05)',
                marginTop: 16,
                flexWrap: 'wrap',
              }}
            >
              <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.26)' }}>
                Not what you need?
              </span>

              <button
                onClick={handleNotMatch}
                style={{
                  height: 34,
                  padding: '0 14px',
                  borderRadius: 999,
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.10)',
                  color: 'rgba(255,255,255,0.66)',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                Try again
              </button>

              <button
                onClick={handleShowAll}
                style={{
                  height: 34,
                  padding: '0 14px',
                  borderRadius: 999,
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.10)',
                  color: 'rgba(255,255,255,0.66)',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                Browse all
              </button>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                margin: '10px 14px 14px',
                borderRadius: 14,
                background: 'rgba(96,165,250,0.06)',
                border: '1px solid rgba(96,165,250,0.12)',
                gap: 12,
                flexWrap: 'wrap',
              }}
            >
              <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.36)' }}>
                Need something more specific or unusual?
              </span>
              <button
                onClick={handleStuck}
                style={{
                  height: 32,
                  padding: '0 14px',
                  borderRadius: 999,
                  background: 'rgba(96,165,250,0.12)',
                  border: '1px solid rgba(96,165,250,0.2)',
                  color: '#9CC4FF',
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  whiteSpace: 'nowrap',
                }}
              >
                Get AI guidance
              </button>
            </div>
          </div>
        )}

        {/* All options */}
        {searchState === 'all' && (
          <div
            style={{
              borderRadius: 28,
              border: '1px solid rgba(255,255,255,0.08)',
              background:
                'linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.025))',
              boxShadow: '0 24px 80px rgba(0,0,0,0.24)',
              padding: '22px 18px 16px',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                marginBottom: 24,
                borderRadius: 14,
                background: 'rgba(96,165,250,0.06)',
                border: '1px solid rgba(96,165,250,0.12)',
                gap: 12,
                flexWrap: 'wrap',
              }}
            >
              <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.36)' }}>
                Still not finding the right match?
              </span>
              <button
                onClick={handleStuck}
                style={{
                  height: 32,
                  padding: '0 14px',
                  borderRadius: 999,
                  background: 'rgba(96,165,250,0.12)',
                  border: '1px solid rgba(96,165,250,0.2)',
                  color: '#9CC4FF',
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  whiteSpace: 'nowrap',
                }}
              >
                Get AI guidance
              </button>
            </div>

            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: 'rgba(255,255,255,0.32)',
                  marginBottom: 10,
                }}
              >
                AdminCommand library
              </div>
              <div
                style={{
                  fontSize: 22,
                  fontWeight: 700,
                  color: 'white',
                  letterSpacing: '-0.03em',
                  marginBottom: 8,
                }}
              >
                Everything available right now
              </div>
              <div
                style={{
                  fontSize: 14,
                  color: 'rgba(255,255,255,0.42)',
                  lineHeight: 1.6,
                }}
              >
                Browse reports and actions by category.
              </div>
            </div>

            {['license', 'user', 'security', 'mailbox', 'teams', 'report'].map((cat) => {
              const items = allItems.filter((i) => i.category === cat);
              if (!items.length) return null;

              const meta = categoryMeta[cat] ?? categoryMeta.report;

              return (
                <div key={cat} style={{ marginBottom: 26 }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      marginBottom: 12,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: meta.color,
                        textTransform: 'uppercase',
                        letterSpacing: '0.12em',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {meta.label}
                    </span>
                    <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {items.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => handleSelect(item)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 14,
                          padding: '15px 16px',
                          borderRadius: 16,
                          background: 'rgba(255,255,255,0.025)',
                          border: '1px solid rgba(255,255,255,0.06)',
                          cursor: 'pointer',
                          transition: 'all 0.16s ease',
                        }}
                        onMouseEnter={(e) => {
                          const el = e.currentTarget as HTMLDivElement;
                          el.style.background = 'rgba(255,255,255,0.05)';
                          el.style.borderColor = 'rgba(255,255,255,0.12)';
                        }}
                        onMouseLeave={(e) => {
                          const el = e.currentTarget as HTMLDivElement;
                          el.style.background = 'rgba(255,255,255,0.025)';
                          el.style.borderColor = 'rgba(255,255,255,0.06)';
                        }}
                      >
                        <div
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            background: meta.color,
                            flexShrink: 0,
                            boxShadow: `0 0 12px ${meta.color}66`,
                          }}
                        />

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              fontSize: 14,
                              fontWeight: 600,
                              color: 'white',
                              marginBottom: 4,
                            }}
                          >
                            {item.title}
                          </div>
                          <div
                            style={{
                              fontSize: 12,
                              color: 'rgba(255,255,255,0.40)',
                              lineHeight: 1.55,
                            }}
                          >
                            {item.description}
                          </div>
                        </div>

                        <div
                          style={{
                            fontSize: 12,
                            color: 'rgba(255,255,255,0.22)',
                            fontWeight: 600,
                            flexShrink: 0,
                          }}
                        >
                          Open →
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Stuck */}
        {searchState === 'stuck' && (
          <div
            style={{
              borderRadius: 28,
              border: '1px solid rgba(255,255,255,0.08)',
              background:
                'linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.025))',
              boxShadow: '0 24px 80px rgba(0,0,0,0.24)',
              padding: '24px 20px 18px',
            }}
          >
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: '#9CC4FF',
                  marginBottom: 10,
                }}
              >
                AI Guidance
              </div>
              <div
                style={{
                  fontSize: 24,
                  fontWeight: 700,
                  color: 'white',
                  letterSpacing: '-0.03em',
                  marginBottom: 10,
                }}
              >
                Best next step
              </div>

              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '8px 12px',
                  borderRadius: 999,
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: 'rgba(255,255,255,0.68)',
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                {query}
              </div>
            </div>

            {loadingAiSuggestion ? (
              <ThinkingDots />
            ) : (
              <>
                <div
                  style={{
                    borderRadius: 22,
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    padding: '28px 24px',
                    marginBottom: 16,
                    minHeight: 160,
                  }}
                >
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      color: 'rgba(255,255,255,0.30)',
                      marginBottom: 10,
                    }}
                  >
                    Recommendation
                  </div>
                  <TypedText text={aiSuggestion} />
                </div>

                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    justifyContent: 'center',
                    gap: 10,
                    paddingTop: 6,
                  }}
                >
                  <button
                    onClick={handleNotMatch}
                    style={{
                      height: 38,
                      padding: '0 16px',
                      borderRadius: 999,
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.10)',
                      color: 'rgba(255,255,255,0.78)',
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                    }}
                  >
                    Try a different search
                  </button>

                  <button
                    onClick={handleShowAll}
                    style={{
                      height: 38,
                      padding: '0 16px',
                      borderRadius: 999,
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.10)',
                      color: 'rgba(255,255,255,0.78)',
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                    }}
                  >
                    Browse actions and reports
                  </button>

                  <button
                    onClick={handleReset}
                    style={{
                      height: 38,
                      padding: '0 16px',
                      borderRadius: 999,
                      background: 'rgba(96,165,250,0.10)',
                      border: '1px solid rgba(96,165,250,0.18)',
                      color: '#9CC4FF',
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                    }}
                  >
                    Start over
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
          40% { transform: translateY(-10px); opacity: 1; }
        }
        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }

        @media (max-width: 720px) {
          input::placeholder {
            font-size: 14px;
          }
        }
      `}</style>
    </div>
  );
}