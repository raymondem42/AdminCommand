import NextAuth from 'next-auth';
import { authConfig } from '@/config/auth.config';

declare module 'next-auth' {
  interface Session {
    accessToken?: string;
  }
}

export const {
  auth,
  signIn,
  signOut,
  unstable_update,
  handlers: { GET, POST },
} = NextAuth({
  ...authConfig,
});