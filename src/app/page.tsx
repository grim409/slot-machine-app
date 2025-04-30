'use client';
import React from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import SlotMachine from './components/SlotMachine';

export default function HomePage() {
  const { data: session } = useSession();

  // If there's no session *or* no user on the session, show Sign-in
  if (!session || !session.user) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <button onClick={() => signIn()} className="btn">
          Sign in
        </button>
      </div>
    );
  }

  // From here TS knows session.user is defined
  return (
    <>
      <div className="flex justify-between items-center">
        <h1>Welcome, {session.user.email}</h1>
        <button onClick={() => signOut()} className="btn">
          Sign out
        </button>
      </div>
      <SlotMachine />
    </>
  );
}
