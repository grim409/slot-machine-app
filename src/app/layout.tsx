import './globals.css';
import React from 'react';
import { SessionProvider } from 'next-auth/react';
import { getServerSession } from 'next-auth';
import { authOptions } from './lib/auth';

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  return (
    <html lang="en">
      <body>
        <SessionProvider session={session}>
          {children}
        </SessionProvider>
      </body>
    </html>
  );
}