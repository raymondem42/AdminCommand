'use client';

import { useMemo, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { actions } from '@/lib/actions/registry';

const categoryMeta: Record<string, { label: string; color: string; bg: string; border: string }> = {
  license: { label: 'License', color: '#FBBF24', bg: 'rgba(251,191,36,0.10)', border: 'rgba(251,191,36,0.22)' },
  user: { label: 'User', color: '#60A5FA', bg: 'rgba(96,165,250,0.10)', border: 'rgba(96,165,250,0.22)' },
  security: { label: 'Security', color: '#F87171', bg: 'rgba(248,113,113,0.10)', border: 'rgba(248,113,113,0.22)' },
  mailbox: { label: 'Mailbox', color: '#A78BFA', bg: 'rgba(167,139,250,0.10)', border: 'rgba(167,139,250,0.22)' },
  teams: { label: 'Teams', color: '#34D399', bg: 'rgba(52,211,153,0.10)', border: 'rgba(52,211,153,0.22)' },
  report: { label: 'Report', color: '#94A3B8', bg: 'rgba(148,163,184,0.10)', border: 'rgba(148,163,184,0.22)' },
};

const frequencyColor: Record<string, string> = {
  Daily: '#7DD3FC',
  Weekly: '#34D399',
  Monthly: '#A78BFA',
};

const WEEK_OPTIONS = [
  { value: '1', label: '1st' },
  { value: '2', label: '2nd' },
  { value: '3', label: '3rd' },
  { value: '4', label: '4th' },
  { value: 'last', label: 'Last' },
];

const DAY_OPTIONS = [
  { value: '0', label: 'Sun' },
  { value: '1', label: 'Mon' },
  { value: '2', label: 'Tue' },
  { value: '3', label: 'Wed' },
  { value: '4', label: 'Thu' },
  { value: '5', label: 'Fri' },
  { value: '6', label: 'Sat' },
];

const SCHEDULE_KEY = 'admincommand_scheduled_tasks';

function to24Hour(hour12: number, ampm: 'AM' | 'PM') {
  if (ampm === 'AM') return hour12 === 12 ? 0 : hour12;
  return hour12 === 12 ? 12 : hour12 + 12;
}

function getMonthlyDate(week: string, weekday: number, year: number, month: number): number {
  if (week === 'last') {
    const lastDay = new Date(year, month + 1, 0);
    while (lastDay.getDay() !== weekday) lastDay.setDate(lastDay.getDate() - 1);
    return lastDay.getDate();
  }
  const nth = Number(week);
  const d = new Date(year, month, 1);
  while (d.getDay() !== weekday) d.setDate(d.getDate() + 1);
  d.setDate(d.getDate() + (nth - 1) * 7);
  return d.getDate();
}

function buildScheduledDate(
  frequency: 'Daily' | 'Weekly' | 'Monthly',
  hour: string,
  minute: string,
  ampm: 'AM' | 'PM',
  weekday: number,
  monthlyWeek: string,
  monthlyWeekday: string,
) {
  const now = new Date();
  const h24 = to24Hour(Number(hour), ampm);
  const m = Number(minute);

  if (frequency === 'Daily') {
    const candidate = new Date(now);
    candidate.setHours(h24, m, 0, 0);
    if (candidate <= now) candidate.setDate(candidate.getDate() + 1);
    return candidate;
  }

  if (frequency === 'Weekly') {
    const candidate = new Date(now);
    candidate.setHours(h24, m, 0, 0);
    const currentDay = candidate.getDay();
    let daysUntil = (weekday - currentDay + 7) % 7;
    if (daysUntil === 0 && candidate <= now) daysUntil = 7;
    candidate.setDate(candidate.getDate() + daysUntil);
    return candidate;
  }

  // Monthly
  const candidate = new Date(now);
  candidate.setHours(h24, m, 0, 0);
  const day = getMonthlyDate(monthlyWeek, Number(monthlyWeekday), candidate.getFullYear(), candidate.getMonth());
  candidate.setDate(day);
  if (candidate <= now) {
    candidate.setMonth(candidate.getMonth() + 1);
    const nextDay = getMonthlyDate(monthlyWeek, Number(monthlyWeekday), candidate.getFullYear(), candidate.getMonth());
    candidate.setDate(nextDay);
  }
  return candidate;
}

function formatNextRun(date: Date) {
  return date.toLocaleString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
    hour: 'numeric', minute: '2-digit',
  });
}

function buildSummaryText(
  actionTitle: string,
  frequency: 'Daily' | 'Weekly' | 'Monthly',
  weekday: number,
  monthlyWeek: string,
  monthlyWeekday: string,
  hour: string,
  minute: string,
  ampm: 'AM' | 'PM',
) {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const time = `${hour}:${minute} ${ampm}`;
  if (frequency === 'Daily') return `${actionTitle} will run every day at ${time}.`;
  if (frequency === 'Weekly') return `${actionTitle} will run every ${days[weekday]} at ${time}.`;
  const weekLabel = WEEK_OPTIONS.find(o => o.value === monthlyWeek)?.label ?? '';
  const dayLabel = DAY_OPTIONS.find(o => o.value === monthlyWeekday)?.label ?? '';
  return `${actionTitle} will run on the ${weekLabel} ${dayLabel} of every month at ${time}.`;
}

function ScheduleNewInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const actionId = searchParams.get('action') ?? '';
  const action = actions.find(a => a.id === actionId);

  const [frequency, setFrequency] = useState<'Daily' | 'Weekly' | 'Monthly'>('Weekly');
  const [hour, setHour] = useState('9');
  const [minute, setMinute] = useState('00');
  const [ampm, setAmpm] = useState<'AM' | 'PM'>('AM');
  const [weekday, setWeekday] = useState<number>(1);
  const [monthlyWeek, setMonthlyWeek] = useState('1');
  const [monthlyWeekday, setMonthlyWeekday] = useState('1');
  const [saved, setSaved] = useState(false);

  const meta = action ? categoryMeta[action.category] ?? categoryMeta.report : null;
  const accent = meta?.color ?? '#9CC4FF';

  const nextRunDate = useMemo(
    () => buildScheduledDate(frequency, hour, minute, ampm, weekday, monthlyWeek, monthlyWeekday),
    [frequency, hour, minute, ampm, weekday, monthlyWeek, monthlyWeekday]
  );
  const nextRunLabel = useMemo(() => formatNextRun(nextRunDate), [nextRunDate]);

  function handleSave() {
    if (!action) return;
    const newTask = {
      id: `task-${Date.now()}`,
      actionId: action.id,
      frequency,
      time: `${hour}:${minute} ${ampm}`,
      ...(frequency === 'Weekly' && { weekday }),
      ...(frequency === 'Monthly' && { monthlyWeek, monthlyWeekday }),
      nextRun: nextRunLabel,
      nextRunIso: nextRunDate.toISOString(),
      lastRun: null, lastResult: null, lastSummary: null,
      enabled: true, createdAt: new Date().toISOString(),
    };
    try {
      const stored = localStorage.getItem(SCHEDULE_KEY);
      const existing = stored ? JSON.parse(stored) : [];
      localStorage.setItem(SCHEDULE_KEY, JSON.stringify([...existing, newTask]));
    } catch {}
    setSaved(true);
    setTimeout(() => router.push('/schedule'), 1400);
  }

  // No action — show picker
  if (!actionId) {
    return (
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '48px 20px 120px', color: 'white' }}>
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.32)', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 30, padding: 0 }}>
          ← Back
        </button>
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.34)', marginBottom: 12 }}>New scheduled task</div>
          <h1 style={{ fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 800, letterSpacing: '-0.05em', color: 'white', margin: '0 0 10px', lineHeight: 1.02 }}>What should run automatically?</h1>
          <p style={{ margin: 0, fontSize: 15, color: 'rgba(255,255,255,0.46)', lineHeight: 1.65, maxWidth: 680 }}>Pick a task that makes sense to run on a recurring cadence.</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12 }}>
          {actions.filter(a => a.schedulable).map(a => {
            const itemMeta = categoryMeta[a.category] ?? categoryMeta.report;
            return (
              <div
                key={a.id}
                onClick={() => router.push(`/schedule/new?action=${a.id}`)}
                style={{ borderRadius: 22, border: `1px solid ${itemMeta.border}`, background: `linear-gradient(180deg, ${itemMeta.bg}, rgba(255,255,255,0.02))`, padding: '20px', cursor: 'pointer', transition: 'transform 140ms ease, border-color 140ms ease', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.03)' }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = itemMeta.color + '55'; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-1px)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = itemMeta.border; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0px)'; }}
              >
                <div style={{ display: 'inline-flex', alignItems: 'center', padding: '4px 8px', borderRadius: 999, fontSize: 10, fontWeight: 800, letterSpacing: '0.10em', textTransform: 'uppercase', color: itemMeta.color, background: itemMeta.bg, border: `1px solid ${itemMeta.border}`, marginBottom: 12 }}>{itemMeta.label}</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: 'white', marginBottom: 6, letterSpacing: '-0.02em' }}>{a.title}</div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.44)', lineHeight: 1.6, marginBottom: 16 }}>{a.description}</div>
                <div style={{ fontSize: 13, color: itemMeta.color, fontWeight: 700 }}>Schedule →</div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Action not found
  if (!action) {
    return (
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '48px 20px', color: 'white', textAlign: 'center' }}>
        <div style={{ fontSize: 16, color: 'rgba(255,255,255,0.42)', marginBottom: 16 }}>Action not found.</div>
        <button onClick={() => router.push('/schedule')} style={{ height: 40, padding: '0 20px', borderRadius: 999, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.68)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
          Back to Schedule
        </button>
      </div>
    );
  }

  // Saved
  if (saved) {
    return (
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '64px 20px', color: 'white', textAlign: 'center' }}>
        <div style={{ width: 68, height: 68, borderRadius: '50%', background: 'rgba(52,211,153,0.12)', border: '1px solid rgba(52,211,153,0.24)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', boxShadow: '0 0 30px rgba(52,211,153,0.12)' }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#34D399" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
        </div>
        <div style={{ fontSize: 24, fontWeight: 800, color: '#34D399', marginBottom: 8, letterSpacing: '-0.03em' }}>Task scheduled</div>
        <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.42)' }}>Redirecting to your schedule...</div>
      </div>
    );
  }

  const fc_weekly = frequencyColor['Weekly'];
  const fc_monthly = frequencyColor['Monthly'];

  // Config form
  return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: '48px 20px 120px', color: 'white' }}>
      <button onClick={() => router.back()} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.32)', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 30, padding: 0 }}>
        ← Back
      </button>

      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.34)', marginBottom: 12 }}>New scheduled task</div>
        <h1 style={{ fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 800, letterSpacing: '-0.05em', color: 'white', margin: '0 0 10px', lineHeight: 1.02 }}>Schedule {action.title}</h1>
        <p style={{ margin: 0, fontSize: 15, color: 'rgba(255,255,255,0.46)', lineHeight: 1.65, maxWidth: 700 }}>Choose how often this task should run and when the next execution should happen.</p>
      </div>

      {/* Action info */}
      <div style={{ borderRadius: 22, border: `1px solid ${meta!.border}`, background: `linear-gradient(180deg, ${meta!.bg}, rgba(255,255,255,0.02))`, padding: '18px 20px', marginBottom: 18, boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.03)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: accent, boxShadow: `0 0 12px ${accent}66`, flexShrink: 0 }} />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: accent, marginBottom: 3 }}>{meta!.label}</div>
            <div style={{ fontSize: 14, color: 'white', fontWeight: 600 }}>{action.title}</div>
          </div>
          <div style={{ marginLeft: 'auto', fontSize: 10, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '4px 10px', borderRadius: 999, color: '#34D399', background: 'rgba(52,211,153,0.10)', border: '1px solid rgba(52,211,153,0.18)' }}>
            Schedulable
          </div>
        </div>
      </div>

      {/* Config card */}
      <div style={{ borderRadius: 28, border: '1px solid rgba(255,255,255,0.08)', background: 'linear-gradient(180deg, rgba(255,255,255,0.045), rgba(255,255,255,0.025))', padding: '28px 24px', boxShadow: '0 22px 60px rgba(0,0,0,0.22), inset 0 1px 0 rgba(255,255,255,0.03)', marginBottom: 18 }}>

        {/* Frequency */}
        <div style={{ marginBottom: 28 }}>
          <label style={{ display: 'block', fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,0.72)', marginBottom: 14 }}>How often should this run?</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 10 }}>
            {(['Daily', 'Weekly', 'Monthly'] as const).map(f => {
              const fc = frequencyColor[f];
              const isSelected = frequency === f;
              return (
                <button key={f} onClick={() => setFrequency(f)} style={{ height: 52, borderRadius: 14, background: isSelected ? `${fc}16` : 'rgba(255,255,255,0.03)', border: `1px solid ${isSelected ? `${fc}40` : 'rgba(255,255,255,0.08)'}`, color: isSelected ? fc : 'rgba(255,255,255,0.48)', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s ease' }}>
                  {f}
                </button>
              );
            })}
          </div>
        </div>

        {/* Day picker — Weekly */}
        {frequency === 'Weekly' && (
          <div style={{ marginBottom: 28 }}>
            <label style={{ display: 'block', fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,0.72)', marginBottom: 14 }}>Which day?</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8 }}>
              {DAY_OPTIONS.map(opt => {
                const isSelected = weekday === Number(opt.value);
                return (
                  <button key={opt.value} onClick={() => setWeekday(Number(opt.value))} style={{ height: 44, borderRadius: 12, background: isSelected ? `${fc_weekly}16` : 'rgba(255,255,255,0.03)', border: `1px solid ${isSelected ? `${fc_weekly}40` : 'rgba(255,255,255,0.08)'}`, color: isSelected ? fc_weekly : 'rgba(255,255,255,0.45)', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s ease' }}>
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Two-step picker — Monthly */}
        {frequency === 'Monthly' && (
          <div style={{ marginBottom: 28 }}>
            <label style={{ display: 'block', fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,0.72)', marginBottom: 14 }}>When during the month?</label>

            {/* Which week */}
            <div style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Which week</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8, marginBottom: 18 }}>
              {WEEK_OPTIONS.map(opt => {
                const isSelected = monthlyWeek === opt.value;
                return (
                  <button key={opt.value} onClick={() => setMonthlyWeek(opt.value)} style={{ height: 44, borderRadius: 12, background: isSelected ? `${fc_monthly}16` : 'rgba(255,255,255,0.03)', border: `1px solid ${isSelected ? `${fc_monthly}40` : 'rgba(255,255,255,0.08)'}`, color: isSelected ? fc_monthly : 'rgba(255,255,255,0.45)', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s ease' }}>
                    {opt.label}
                  </button>
                );
              })}
            </div>

            {/* Which day */}
            <div style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Which day</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8 }}>
              {DAY_OPTIONS.map(opt => {
                const isSelected = monthlyWeekday === opt.value;
                return (
                  <button key={opt.value} onClick={() => setMonthlyWeekday(opt.value)} style={{ height: 44, borderRadius: 12, background: isSelected ? `${fc_monthly}16` : 'rgba(255,255,255,0.03)', border: `1px solid ${isSelected ? `${fc_monthly}40` : 'rgba(255,255,255,0.08)'}`, color: isSelected ? fc_monthly : 'rgba(255,255,255,0.45)', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s ease' }}>
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Time */}
        <div style={{ marginBottom: 28 }}>
          <label style={{ display: 'block', fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,0.72)', marginBottom: 14 }}>What time?</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) auto minmax(0,1fr) auto', gap: 10, alignItems: 'center' }}>
            <select value={hour} onChange={e => setHour(e.target.value)} style={{ padding: '12px 14px', borderRadius: 14, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.10)', color: 'white', fontSize: 15, fontFamily: 'inherit', outline: 'none', cursor: 'pointer' }}>
              {Array.from({ length: 12 }, (_, i) => i + 1).map(h => (
                <option key={h} value={String(h)} style={{ background: '#0b1020' }}>{h}</option>
              ))}
            </select>
            <span style={{ fontSize: 20, color: 'rgba(255,255,255,0.28)', fontWeight: 700 }}>:</span>
            <select value={minute} onChange={e => setMinute(e.target.value)} style={{ padding: '12px 14px', borderRadius: 14, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.10)', color: 'white', fontSize: 15, fontFamily: 'inherit', outline: 'none', cursor: 'pointer' }}>
              {['00', '15', '30', '45'].map(m => (
                <option key={m} value={m} style={{ background: '#0b1020' }}>{m}</option>
              ))}
            </select>
            <div style={{ display: 'flex', borderRadius: 14, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.10)', background: 'rgba(255,255,255,0.03)' }}>
              {(['AM', 'PM'] as const).map(p => (
                <button key={p} onClick={() => setAmpm(p)} style={{ width: 58, height: 48, background: ampm === p ? 'rgba(255,255,255,0.10)' : 'transparent', border: 'none', color: ampm === p ? 'white' : 'rgba(255,255,255,0.36)', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Summary preview */}
        <div style={{ borderRadius: 18, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', padding: '18px' }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.30)', marginBottom: 10 }}>Summary</div>
          <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)', lineHeight: 1.7, marginBottom: 8, fontWeight: 500 }}>
            {buildSummaryText(action.title, frequency, weekday, monthlyWeek, monthlyWeekday, hour, minute, ampm)}
          </div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.46)', lineHeight: 1.6, marginBottom: 6 }}>
            Next run: <span style={{ color: 'white', fontWeight: 600 }}>{nextRunLabel}</span>
          </div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', marginTop: 10, lineHeight: 1.6 }}>
            💡 Background execution requires Supabase + Vercel cron — coming soon. Tasks are stored locally for now.
          </div>
        </div>
      </div>

      <button onClick={handleSave} style={{ width: '100%', height: 54, borderRadius: 16, background: `linear-gradient(135deg, ${accent}22, ${accent}12)`, border: `1px solid ${accent}40`, color: accent, fontSize: 15, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 16px 40px rgba(0,0,0,0.18)' }}>
        Save scheduled task
      </button>
    </div>
  );
}

export default function ScheduleNewPage() {
  return (
    <Suspense fallback={<div style={{ color: 'white', padding: 48 }}>Loading...</div>}>
      <ScheduleNewInner />
    </Suspense>
  );
}