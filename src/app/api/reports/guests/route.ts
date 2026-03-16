import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { Client } from '@microsoft/microsoft-graph-client';

function getClient(token: string) {
  return Client.init({ authProvider: (done) => done(null, token) });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  const token = (session as any)?.accessToken;
  if (!token) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  try {
    const client = getClient(token);
    const res = await client
      .api('/users')
      .select('id,displayName,userPrincipalName,mail,createdDateTime,accountEnabled')
      .filter("userType eq 'Guest'")
      .get();

    const now = new Date();
    const guests = (res.value || []).map((u: any) => {
      return {
        id: u.id,
        name: u.displayName,
        upn: u.userPrincipalName,
        email: u.mail ?? u.userPrincipalName,
        createdDate: u.createdDateTime,
        lastSignIn: null,
        daysSince: 9999,
        enabled: u.accountEnabled !== false,
      };
    });

    return NextResponse.json({ guests });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}