import MicrosoftEntraID from '@auth/core/providers/microsoft-entra-id';
import { getUserDetails } from '@/services/msGraph';
import type { NextAuthConfig } from 'next-auth';

const SCOPES = [
  'openid',
  'profile', 
  'email',
  'offline_access',
  'User.Read',
  'User.Read.All',
  'User.ReadWrite.All',
  'Directory.Read.All',
  'AuditLog.Read.All',
  'UserAuthenticationMethod.Read.All',
  'UserAuthenticationMethod.ReadWrite.All',
  'RoleManagement.ReadWrite.Directory',
  'GroupMember.ReadWrite.All',
  'Policy.ReadWrite.ConditionalAccess',
].join(' ');

async function refreshAccessToken(token: any) {
  try {
    const url = `https://login.microsoftonline.com/${process.env.AUTH_MICROSOFT_ENTRA_ID_ISSUER}/oauth2/v2.0/token`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.AUTH_MICROSOFT_ENTRA_ID_ID!,
        client_secret: process.env.AUTH_MICROSOFT_ENTRA_ID_SECRET!,
        grant_type: 'refresh_token',
        refresh_token: token.refreshToken,
        scope: SCOPES,
      }),
    });

    const refreshed = await response.json();
    if (!response.ok) throw refreshed;

    return {
      ...token,
      accessToken: refreshed.access_token,
      refreshToken: refreshed.refresh_token ?? token.refreshToken,
      accessTokenExpires: Date.now() + refreshed.expires_in * 1000,
    };
  } catch (error) {
    console.error('Failed to refresh token', error);
    return { ...token, error: 'RefreshAccessTokenError' };
  }
}

export const authConfig = {
  providers: [
    MicrosoftEntraID({
      clientId: process.env.AUTH_MICROSOFT_ENTRA_ID_ID,
      clientSecret: process.env.AUTH_MICROSOFT_ENTRA_ID_SECRET,
      issuer: `https://login.microsoftonline.com/${process.env.AUTH_MICROSOFT_ENTRA_ID_ISSUER}/v2.0`,
      authorization: {
        params: { scope: SCOPES },
      },
    }),
  ],
  secret: process.env.AUTH_SECRET,
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60,
    updateAge: 60 * 60,
  },
  pages: {
    signIn: '/signin',
    signOut: '/signin',
    error: '/signin',
  },
  callbacks: {
    async jwt({ token, account }) {
      // Initial sign in
      if (account?.access_token) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.accessTokenExpires = Date.now() + (account.expires_in as number) * 1000;
        try {
          token.userDetails = await getUserDetails(account.access_token);
        } catch (error) {
          console.error('Failed to fetch user details', error);
        }
        return token;
      }

      // Token still valid
      if (Date.now() < (token.accessTokenExpires as number)) {
        return token;
      }

      // Token expired — refresh
      return refreshAccessToken(token);
    },

    async session({ session, token }) {
      if (token.userDetails) {
        session.user = { ...session.user, ...token.userDetails };
      }
      (session as any).accessToken = token.accessToken;
      (session as any).error = token.error;
      return session;
    },
  },
} satisfies NextAuthConfig;