import './globals.css';
import { getServerSession } from 'next-auth';
import { SessionProvider } from 'next-auth/react';
import { authOptions } from './api/auth/[...nextauth]/route';

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