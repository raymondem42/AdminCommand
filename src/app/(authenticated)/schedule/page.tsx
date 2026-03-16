'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { actions } from '@/lib/actions/registry';

const SCHEDULE_KEY = 'admincommand_scheduled_tasks';

type ScheduledTask = {
  id: string;
  actionId: string;
  frequency: string;
  time: string;
  nextRun: string;
  lastRun: string | null;
  lastResult: string | null;
  lastSummary: string | null;
  enabled: boolean;
  createdAt: string;
};

const frequencyColor: Record<string, string> = {
  Daily: '#7DD3FC',
  Weekly: '#34D399',
  Monthly: '#A78BFA',
};

export default function SchedulePage() {
  const router = useRouter();
  const [tasks, setTasks] = useState<ScheduledTask[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(SCHEDULE_KEY);
      if (stored) setTasks(JSON.parse(stored));
    } catch {}
  }, []);

  function toggleTask(id: string) {
    const updated = tasks.map(t => t.id === id ? { ...t, enabled: !t.enabled } : t);
    setTasks(updated);
    try { localStorage.setItem(SCHEDULE_KEY, JSON.stringify(updated)); } catch {}
  }

  function deleteTask(id: string) {
    const updated = tasks.filter(t => t.id !== id);
    setTasks(updated);
    try { localStorage.setItem(SCHEDULE_KEY, JSON.stringify(updated)); } catch {}
  }

  const schedulableActions = actions.filter(a => a.schedulable);
  const totalTasks = tasks.length;
  const enabledTasks = tasks.filter(t => t.enabled).length;
  const pausedTasks = tasks.filter(t => !t.enabled).length;
  const failedTasks = tasks.filter(t => t.lastResult === 'error').length;

  return (
    <div style={{
      width: '100%', maxWidth: 1120, margin: '0 auto',
      padding: '44px 20px 88px', color: 'white',
    }}>

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{
          fontSize: 11, fontWeight: 700, letterSpacing: '0.12em',
          textTransform: 'uppercase', color: 'rgba(255,255,255,0.34)', marginBottom: 12,
        }}>
          Automation
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 18, flexWrap: 'wrap' }}>
          <div style={{ maxWidth: 720 }}>
            <h1 style={{
              fontSize: 'clamp(30px, 5vw, 48px)', lineHeight: 1.02, fontWeight: 800,
              letterSpacing: '-0.05em', color: 'white', margin: '0 0 10px',
            }}>
              Scheduled Tasks
            </h1>
            <p style={{ margin: 0, fontSize: 15, color: 'rgba(255,255,255,0.5)', lineHeight: 1.65, maxWidth: 620 }}>
              Automate recurring admin work across your tenant. Review what runs, when it runs, and how each task performed last time.
            </p>
          </div>
          <button
            onClick={() => router.push('/schedule/new')}
            style={{
              height: 44, padding: '0 18px', borderRadius: 999,
              background: 'rgba(96,165,250,0.10)', border: '1px solid rgba(96,165,250,0.22)',
              color: '#A9CBFF', fontSize: 13, fontWeight: 700,
              cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap',
            }}
          >
            + New scheduled task
          </button>
        </div>
      </div>

      {/* Summary band */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: 12, marginBottom: 34,
      }}>
        {[
          { label: 'Total tasks', value: totalTasks },
          { label: 'Running', value: enabledTasks },
          { label: 'Paused', value: pausedTasks },
          { label: 'Needs attention', value: failedTasks },
        ].map(item => (
          <div key={item.label} style={{
            borderRadius: 18, border: '1px solid rgba(255,255,255,0.07)',
            background: 'rgba(255,255,255,0.03)', padding: '18px',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.03)',
          }}>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.38)', marginBottom: 8, lineHeight: 1.3 }}>
              {item.label}
            </div>
            <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.04em', color: 'white', lineHeight: 1 }}>
              {item.value}
            </div>
          </div>
        ))}
      </div>

      {/* Active scheduled tasks */}
      {tasks.length > 0 && (
        <section style={{ marginBottom: 52 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.34)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
              Active schedules
            </span>
            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {tasks.map(task => {
              const action = actions.find(a => a.id === task.actionId);
              if (!action) return null;
              const badgeColor = frequencyColor[task.frequency] || '#94A3B8';
              const isSuccess = task.lastResult === 'success';

              return (
                <div key={task.id} style={{
                  borderRadius: 24,
                  background: 'linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.025))',
                  border: `1px solid ${task.enabled ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.05)'}`,
                  padding: '22px 22px 20px',
                  boxShadow: '0 18px 40px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.03)',
                  opacity: task.enabled ? 1 : 0.62,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 18, flexWrap: 'wrap', marginBottom: 18 }}>
                    <div style={{ flex: '1 1 520px', minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
                        <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.03em', color: 'white', lineHeight: 1.2 }}>
                          {action.title}
                        </div>
                        <span style={{
                          fontSize: 11, fontWeight: 700, letterSpacing: '0.08em',
                          textTransform: 'uppercase', padding: '5px 9px', borderRadius: 999,
                          color: badgeColor, background: `${badgeColor}18`, border: `1px solid ${badgeColor}2f`,
                        }}>
                          {task.frequency}
                        </span>
                        <span style={{
                          fontSize: 11, color: 'rgba(255,255,255,0.35)',
                        }}>
                          {task.time}
                        </span>
                        {!task.enabled && (
                          <span style={{
                            fontSize: 11, fontWeight: 700, letterSpacing: '0.08em',
                            textTransform: 'uppercase', padding: '5px 9px', borderRadius: 999,
                            color: 'rgba(255,255,255,0.42)', background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.08)',
                          }}>
                            Paused
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.48)', lineHeight: 1.6, maxWidth: 760 }}>
                        {action.description}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                      <button
                        onClick={() => toggleTask(task.id)}
                        style={{
                          height: 36, padding: '0 14px', borderRadius: 999,
                          background: 'rgba(255,255,255,0.045)', border: '1px solid rgba(255,255,255,0.08)',
                          color: 'rgba(255,255,255,0.72)', fontSize: 12, fontWeight: 600,
                          cursor: 'pointer', fontFamily: 'inherit',
                        }}
                      >
                        {task.enabled ? 'Pause' : 'Resume'}
                      </button>
                      <button
                        onClick={() => deleteTask(task.id)}
                        style={{
                          height: 36, padding: '0 14px', borderRadius: 999,
                          background: 'rgba(248,113,113,0.07)', border: '1px solid rgba(248,113,113,0.16)',
                          color: '#FCA5A5', fontSize: 12, fontWeight: 600,
                          cursor: 'pointer', fontFamily: 'inherit',
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
                    {[
                      { label: 'Next run', value: task.nextRun, dot: null },
                      { label: 'Last run', value: task.lastRun ?? 'Not yet run', dot: null },
                      { label: 'Last result', value: task.lastSummary ?? 'Pending', dot: task.lastResult ? isSuccess : null },
                    ].map(stat => (
                      <div key={stat.label} style={{
                        borderRadius: 16, background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.06)', padding: '14px',
                      }}>
                        <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.28)', marginBottom: 6 }}>
                          {stat.label}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          {stat.dot !== null && (
                            <div style={{
                              width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                              background: stat.dot ? '#34D399' : '#F87171',
                              boxShadow: `0 0 12px ${stat.dot ? '#34D39966' : '#F8717166'}`,
                            }} />
                          )}
                          <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.76)', fontWeight: 600, lineHeight: 1.45 }}>
                            {stat.value}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Empty state */}
      {tasks.length === 0 && (
        <section style={{ marginBottom: 52 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.34)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
              Active schedules
            </span>
            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
          </div>
          <div style={{
            borderRadius: 20, border: '1px solid rgba(255,255,255,0.06)',
            background: 'rgba(255,255,255,0.02)',
            padding: '48px 24px', textAlign: 'center',
          }}>
            <div style={{ fontSize: 28, marginBottom: 14 }}>🕐</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'white', marginBottom: 8 }}>No scheduled tasks yet</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', marginBottom: 24, lineHeight: 1.6 }}>
              Pick an action below and set it to run automatically.
            </div>
          </div>
        </section>
      )}

      {/* Available to schedule */}
      <section>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.34)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
            Available to schedule
          </span>
          <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
        </div>

        <div style={{
          borderRadius: 24,
          background: 'linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.02))',
          border: '1px solid rgba(255,255,255,0.06)',
          padding: '10px',
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {schedulableActions.map(action => {
              const alreadyScheduled = tasks.some(t => t.actionId === action.id);
              return (
                <div key={action.id} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
                  padding: '14px', borderRadius: 16,
                  background: alreadyScheduled ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.05)',
                  opacity: alreadyScheduled ? 0.45 : 1,
                }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'white', marginBottom: 4, letterSpacing: '-0.01em' }}>
                      {action.title}
                    </div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.42)', lineHeight: 1.55 }}>
                      {action.description}
                    </div>
                  </div>
                  <button
                    disabled={alreadyScheduled}
                    onClick={() => router.push(`/schedule/new?action=${action.id}`)}
                    style={{
                      height: 36, padding: '0 14px', borderRadius: 999,
                      background: alreadyScheduled ? 'rgba(255,255,255,0.03)' : 'rgba(96,165,250,0.10)',
                      border: `1px solid ${alreadyScheduled ? 'rgba(255,255,255,0.06)' : 'rgba(96,165,250,0.20)'}`,
                      color: alreadyScheduled ? 'rgba(255,255,255,0.24)' : '#A9CBFF',
                      fontSize: 12, fontWeight: 700,
                      cursor: alreadyScheduled ? 'default' : 'pointer',
                      fontFamily: 'inherit', whiteSpace: 'nowrap', flexShrink: 0,
                    }}
                  >
                    {alreadyScheduled ? 'Already scheduled' : 'Schedule'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}