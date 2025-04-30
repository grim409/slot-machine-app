'use client';
import { useSession, signIn, signOut } from 'next-auth/react';
import SlotMachine from './components/SlotMachine';

export default function HomePage() {
  const { data: session } = useSession();

  return (
    <main className="p-8">
      {!session ? (
        <button onClick={() => signIn()} className="btn">
          Sign in
        </button>
      ) : (
        <>
          <div className="flex justify-between items-center">
            <h1>Welcome, {session.user.email}</h1>
            <button onClick={() => signOut()} className="btn">
              Sign out
            </button>
          </div>
          <SlotMachine />
        </>
      )}
    </main>
  );
}