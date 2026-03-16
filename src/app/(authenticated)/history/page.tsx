'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

const HISTORY_KEY = 'admincommand_history';

type HistoryEntry = {
  id: string;
  actionId: string;
  actionTitle: string;
  category: string;
  summary: string;
  ranAt: string;
  success: boolean;
};

const categoryMeta: Record<
  string,
  { label: string; color: string; bg: string; border: string }
> = {
  license: {
    label: 'License',
    color: '#FBBF24',
    bg: 'rgba(251,191,36,0.10)',
    border: 'rgba(251,191,36,0.20)',
  },
  user: {
    label: 'User',
    color: '#60A5FA',
    bg: 'rgba(96,165,250,0.10)',
    border: 'rgba(96,165,250,0.20)',
  },
  security: {
    label: 'Security',
    color: '#F87171',
    bg: 'rgba(248,113,113,0.10)',
    border: 'rgba(248,113,113,0.20)',
  },
  mailbox: {
    label: 'Mailbox',
    color: '#A78BFA',
    bg: 'rgba(167,139,250,0.10)',
    border: 'rgba(167,139,250,0.20)',
  },
  teams: {
    label: 'Teams',
    color: '#34D399',
    bg: 'rgba(52,211,153,0.10)',
    border: 'rgba(52,211,153,0.20)',
  },
  report: {
    label: 'Report',
    color: '#94A3B8',
    bg: 'rgba(148,163,184,0.10)',
    border: 'rgba(148,163,184,0.20)',
  },
};

function downloadFile(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function toCsv(entries: HistoryEntry[]) {
  const escape = (value: string) => `"${String(value).replace(/"/g, '""')}"`;

  const rows = [
    ['Action', 'Category', 'Summary', 'Ran At', 'Success'],
    ...entries.map((entry) => [
      entry.actionTitle,
      entry.category,
      entry.summary,
      entry.ranAt,
      entry.success ? 'Success' : 'Failed',
    ]),
  ];

  return rows.map((row) => row.map(escape).join(',')).join('\n');
}

function formatDateParts(value: string) {
  const date = new Date(value);

  return {
    shortDate: date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    }),
    shortTime: date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    }),
    full: date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }),
  };
}

export default function HistoryPage() {
  const router = useRouter();
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'success' | 'failed'>('all');

  useEffect(() => {
    try {
      const stored = localStorage.getItem(HISTORY_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as HistoryEntry[];
        const sorted = [...parsed].sort(
          (a, b) => new Date(b.ranAt).getTime() - new Date(a.ranAt).getTime()
        );
        setEntries(sorted);
      }
    } catch {}
  }, []);

  function clearHistory() {
    try {
      localStorage.removeItem(HISTORY_KEY);
    } catch {}
    setEntries([]);
  }

  function exportJson() {
    downloadFile(
      'admincommand-history.json',
      JSON.stringify(filteredEntries, null, 2),
      'application/json'
    );
  }

  function exportCsv() {
    downloadFile(
      'admincommand-history.csv',
      toCsv(filteredEntries),
      'text/csv;charset=utf-8'
    );
  }

  const filteredEntries = useMemo(() => {
    return entries.filter((entry) => {
      const q = search.trim().toLowerCase();

      const matchesSearch =
        !q ||
        entry.actionTitle.toLowerCase().includes(q) ||
        entry.summary.toLowerCase().includes(q) ||
        entry.category.toLowerCase().includes(q);

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'success' && entry.success) ||
        (statusFilter === 'failed' && !entry.success);

      return matchesSearch && matchesStatus;
    });
  }, [entries, search, statusFilter]);

  const totalRuns = entries.length;
  const successCount = entries.filter((e) => e.success).length;
  const failedCount = entries.filter((e) => !e.success).length;
  const successRate = totalRuns ? Math.round((successCount / totalRuns) * 100) : 0;

  return (
    <>
      <div
        style={{
          width: '100%',
          maxWidth: 1040,
          margin: '0 auto',
          padding: '44px 20px 88px',
          color: 'white',
        }}
      >
        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.34)',
              marginBottom: 12,
            }}
          >
            AdminCommand
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'space-between',
              gap: 18,
              flexWrap: 'wrap',
            }}
          >
            <div style={{ maxWidth: 700 }}>
              <h1
                style={{
                  fontSize: 'clamp(30px, 5vw, 48px)',
                  lineHeight: 1.02,
                  fontWeight: 800,
                  letterSpacing: '-0.05em',
                  color: 'white',
                  margin: '0 0 10px',
                }}
              >
                History & audit log
              </h1>
              <p
                style={{
                  margin: 0,
                  fontSize: 15,
                  color: 'rgba(255,255,255,0.5)',
                  lineHeight: 1.65,
                  maxWidth: 680,
                }}
              >
                Every report, action, and automation result in one clean audit trail.
              </p>
            </div>

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {entries.length > 0 && (
                <>
                  <button
                    onClick={exportCsv}
                    style={{
                      height: 38,
                      padding: '0 14px',
                      borderRadius: 999,
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.09)',
                      color: 'white',
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                    }}
                  >
                    Export CSV
                  </button>

                  <button
                    onClick={exportJson}
                    style={{
                      height: 38,
                      padding: '0 14px',
                      borderRadius: 999,
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.09)',
                      color: 'white',
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                    }}
                  >
                    Export JSON
                  </button>

                  <button
                    onClick={() => setConfirmClearOpen(true)}
                    style={{
                      height: 38,
                      padding: '0 14px',
                      borderRadius: 999,
                      background: 'rgba(248,113,113,0.08)',
                      border: '1px solid rgba(248,113,113,0.18)',
                      color: '#FCA5A5',
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                    }}
                  >
                    Clear history
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Summary cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: 12,
            marginBottom: 20,
          }}
        >
          {[
            { label: 'Total runs', value: totalRuns, tone: 'rgba(255,255,255,0.92)' },
            { label: 'Successful', value: successCount, tone: '#34D399' },
            { label: 'Failed', value: failedCount, tone: '#F87171' },
            { label: 'Success rate', value: `${successRate}%`, tone: '#60A5FA' },
          ].map((card) => (
            <div
              key={card.label}
              style={{
                borderRadius: 20,
                border: '1px solid rgba(255,255,255,0.07)',
                background:
                  'linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.025))',
                padding: '18px 18px',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.03)',
              }}
            >
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
                {card.label}
              </div>
              <div
                style={{
                  fontSize: 28,
                  fontWeight: 800,
                  letterSpacing: '-0.04em',
                  color: card.tone,
                }}
              >
                {card.value}
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div
          style={{
            position: 'sticky',
            top: 84,
            zIndex: 20,
            marginBottom: 18,
            borderRadius: 20,
            border: '1px solid rgba(255,255,255,0.08)',
            background: 'rgba(8,11,20,0.72)',
            backdropFilter: 'blur(14px)',
            WebkitBackdropFilter: 'blur(14px)',
            padding: 12,
          }}
        >
          <div
            style={{
              display: 'flex',
              gap: 10,
              flexWrap: 'wrap',
              alignItems: 'center',
            }}
          >
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search history"
              style={{
                flex: '1 1 260px',
                minWidth: 220,
                height: 40,
                borderRadius: 14,
                border: '1px solid rgba(255,255,255,0.08)',
                background: 'rgba(255,255,255,0.04)',
                color: 'white',
                padding: '0 14px',
                fontSize: 13,
                outline: 'none',
                fontFamily: 'inherit',
              }}
            />

            {(['all', 'success', 'failed'] as const).map((filter) => {
              const active = statusFilter === filter;
              return (
                <button
                  key={filter}
                  onClick={() => setStatusFilter(filter)}
                  style={{
                    height: 40,
                    padding: '0 14px',
                    borderRadius: 999,
                    border: active
                      ? '1px solid rgba(96,165,250,0.22)'
                      : '1px solid rgba(255,255,255,0.08)',
                    background: active
                      ? 'rgba(96,165,250,0.12)'
                      : 'rgba(255,255,255,0.04)',
                    color: active ? '#9CC4FF' : 'rgba(255,255,255,0.75)',
                    fontSize: 12,
                    fontWeight: 700,
                    textTransform: 'capitalize',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                  }}
                >
                  {filter}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        {filteredEntries.length === 0 ? (
          <div
            style={{
              borderRadius: 24,
              border: '1px solid rgba(255,255,255,0.06)',
              background: 'rgba(255,255,255,0.02)',
              padding: '42px 24px',
            }}
          >
            <div
              style={{
                fontSize: 16,
                fontWeight: 700,
                color: 'white',
                marginBottom: 8,
              }}
            >
              {entries.length === 0 ? 'No history yet' : 'No matching results'}
            </div>

            <div
              style={{
                fontSize: 13,
                color: 'rgba(255,255,255,0.38)',
                lineHeight: 1.6,
                marginBottom: 18,
              }}
            >
              {entries.length === 0
                ? 'When actions run, results will appear here as a permanent audit trail.'
                : 'Try changing your search or status filter.'}
            </div>

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button
                onClick={() => router.push('/')}
                style={{
                  height: 38,
                  padding: '0 16px',
                  borderRadius: 999,
                  background: 'rgba(96,165,250,0.1)',
                  border: '1px solid rgba(96,165,250,0.2)',
                  color: '#9CC4FF',
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                Run action
              </button>

              {entries.length > 0 && (
                <button
                  onClick={() => {
                    setSearch('');
                    setStatusFilter('all');
                  }}
                  style={{
                    height: 38,
                    padding: '0 16px',
                    borderRadius: 999,
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    color: 'white',
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                  }}
                >
                  Reset filters
                </button>
              )}
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {filteredEntries.map((entry) => {
              const meta = categoryMeta[entry.category] ?? categoryMeta.report;
              const date = formatDateParts(entry.ranAt);

              return (
                <div
                  key={entry.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => router.push(`/actions/${entry.actionId}`)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      router.push(`/actions/${entry.actionId}`);
                    }
                  }}
                  style={{
                    borderRadius: 22,
                    background:
                      'linear-gradient(180deg, rgba(255,255,255,0.045), rgba(255,255,255,0.025))',
                    border: '1px solid rgba(255,255,255,0.07)',
                    padding: '18px 20px',
                    cursor: 'pointer',
                    display: 'grid',
                    gridTemplateColumns: 'auto minmax(0,1fr) auto',
                    gap: 16,
                    alignItems: 'center',
                    transition: 'transform 140ms ease, border-color 140ms ease',
                    outline: 'none',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.13)';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)';
                    e.currentTarget.style.transform = 'translateY(0px)';
                  }}
                >
                  {/* Status light */}
                  <div
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: '50%',
                      flexShrink: 0,
                      background: entry.success ? '#34D399' : '#F87171',
                      boxShadow: `0 0 12px ${entry.success ? '#34D39966' : '#F8717166'}`,
                    }}
                  />

                  {/* Main content */}
                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        marginBottom: 6,
                        flexWrap: 'wrap',
                      }}
                    >
                      <span
                        style={{
                          fontSize: 15,
                          fontWeight: 700,
                          color: 'white',
                        }}
                      >
                        {entry.actionTitle}
                      </span>

                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          letterSpacing: '0.08em',
                          textTransform: 'uppercase',
                          padding: '3px 8px',
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
                          fontSize: 10,
                          fontWeight: 700,
                          letterSpacing: '0.08em',
                          textTransform: 'uppercase',
                          padding: '3px 8px',
                          borderRadius: 999,
                          color: entry.success ? '#34D399' : '#F87171',
                          background: entry.success
                            ? 'rgba(52,211,153,0.10)'
                            : 'rgba(248,113,113,0.10)',
                          border: entry.success
                            ? '1px solid rgba(52,211,153,0.18)'
                            : '1px solid rgba(248,113,113,0.18)',
                        }}
                      >
                        {entry.success ? 'Success' : 'Failed'}
                      </span>
                    </div>

                    <div
                      style={{
                        fontSize: 13,
                        color: 'rgba(255,255,255,0.43)',
                        lineHeight: 1.55,
                        marginBottom: 12,
                      }}
                    >
                      {entry.summary}
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        gap: 8,
                        flexWrap: 'wrap',
                      }}
                    >
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/actions/${entry.actionId}`);
                        }}
                        style={{
                          height: 32,
                          padding: '0 12px',
                          borderRadius: 999,
                          background: 'rgba(96,165,250,0.10)',
                          border: '1px solid rgba(96,165,250,0.20)',
                          color: '#9CC4FF',
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: 'pointer',
                          fontFamily: 'inherit',
                        }}
                      >
                        Run again
                      </button>
                    </div>
                  </div>

                  {/* Time */}
                  <div
                    style={{
                      fontSize: 11,
                      color: 'rgba(255,255,255,0.28)',
                      flexShrink: 0,
                      textAlign: 'right',
                      lineHeight: 1.6,
                      minWidth: 108,
                    }}
                    title={date.full}
                  >
                    {date.shortDate}
                    <br />
                    {date.shortTime}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Clear confirmation modal */}
      {confirmClearOpen && (
        <div
          onClick={() => setConfirmClearOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(2,6,23,0.72)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: 24,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: 600,
              borderRadius: 28,
              border: '1px solid rgba(255,255,255,0.08)',
              background:
                'linear-gradient(180deg, rgba(15,23,42,0.96), rgba(10,14,25,0.96))',
              padding: '30px 28px',
              boxShadow: '0 40px 120px rgba(0,0,0,0.55)',
            }}
          >
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 48,
                height: 48,
                borderRadius: 16,
                marginBottom: 18,
                background: 'rgba(248,113,113,0.10)',
                border: '1px solid rgba(248,113,113,0.18)',
                color: '#FCA5A5',
              }}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 6h18" />
                <path d="M8 6V4h8v2" />
                <path d="M19 6l-1 14H6L5 6" />
                <path d="M10 11v6" />
                <path d="M14 11v6" />
              </svg>
            </div>

            <div
              style={{
                fontSize: 28,
                fontWeight: 800,
                letterSpacing: '-0.04em',
                color: 'white',
                marginBottom: 10,
              }}
            >
              Clear all history?
            </div>

            <div
              style={{
                fontSize: 15,
                color: 'rgba(255,255,255,0.48)',
                lineHeight: 1.7,
                marginBottom: 26,
                maxWidth: 500,
              }}
            >
              This removes your local AdminCommand audit history from this browser. Export it first
              if you want to keep a backup.
            </div>

            <div
              style={{
                display: 'flex',
                gap: 10,
                flexWrap: 'wrap',
                justifyContent: 'flex-end',
              }}
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  exportCsv();
                }}
                style={{
                  height: 42,
                  padding: '0 16px',
                  borderRadius: 999,
                  border: '1px solid rgba(255,255,255,0.10)',
                  background: 'rgba(255,255,255,0.04)',
                  color: 'white',
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                Export CSV first
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setConfirmClearOpen(false);
                }}
                style={{
                  height: 42,
                  padding: '0 16px',
                  borderRadius: 999,
                  border: '1px solid rgba(255,255,255,0.10)',
                  background: 'rgba(255,255,255,0.04)',
                  color: 'white',
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                Cancel
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  clearHistory();
                  setConfirmClearOpen(false);
                }}
                style={{
                  height: 42,
                  padding: '0 16px',
                  borderRadius: 999,
                  border: '1px solid rgba(248,113,113,0.20)',
                  background: 'rgba(248,113,113,0.14)',
                  color: '#FCA5A5',
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                Clear history
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}