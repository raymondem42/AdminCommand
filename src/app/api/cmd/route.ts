import { NextRequest, NextResponse } from 'next/server';
import { actions } from '@/lib/actions/registry';

const reports = [
  { id: 'report-licenses', title: 'Unused Licenses', description: 'Licenses nobody is using', category: 'report', type: 'report' },
  { id: 'report-guests', title: 'Guest Accounts', description: 'Audit external users', category: 'report', type: 'report' },
  { id: 'report-admins', title: 'Admin Role Audit', description: 'Every user with admin privileges', category: 'report', type: 'report' },
  { id: 'report-inactive', title: 'Inactive Users', description: 'Users who haven\'t signed in for 30+ days', category: 'report', type: 'report' },
  { id: 'report-savings', title: 'Savings Scan', description: 'Full breakdown of monthly M365 waste', category: 'report', type: 'report' },
];

const allItems = [
  ...actions.map(a => ({ id: a.id, title: a.title, description: a.description, category: a.category, type: 'action' })),
  ...reports,
];

export async function POST(req: NextRequest) {
  const { query } = await req.json();

  if (!query?.trim()) {
    return NextResponse.json({ results: [] });
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 200,
        system: `You are a search engine for a Microsoft 365 admin tool called AdminCommand.
Given a natural language query from an IT admin, return the IDs of the most relevant actions and reports.

Available items:
${allItems.map(i => `- ${i.id}: ${i.title} — ${i.description}`).join('\n')}

Return ONLY a JSON array of IDs, most relevant first, max 5 results.
Example: ["offboard-employee", "force-signout", "report-inactive"]
Return only the JSON array, nothing else. No explanation.`,
        messages: [{ role: 'user', content: query }],
      }),
    });

    const data = await response.json();
    const text = data.content?.[0]?.text || '[]';
    const clean = text.trim().replace(/```json|```/g, '');
    const ids: string[] = JSON.parse(clean);

    const results = ids
      .map(id => allItems.find(i => i.id === id))
      .filter(Boolean)
      .slice(0, 5);

    return NextResponse.json({ results });
  } catch (e) {
    console.error('AI search failed, falling back to keyword search', e);

    const q = query.toLowerCase();
    const results = allItems
      .filter(i =>
        i.title.toLowerCase().includes(q) ||
        i.description.toLowerCase().includes(q) ||
        (i as any).keywords?.some((k: string) => k.includes(q) || q.includes(k))
      )
      .slice(0, 5);

    return NextResponse.json({ results });
  }
}