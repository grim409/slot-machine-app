'use client';
import React from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import SlotMachine from '../components/SlotMachine';
import TitleScreen from '../components/TitleScreen';

export default function HomePage() {
  const { data: session } = useSession();

  if (!session || !session.user) {
    return <TitleScreen />;
  }

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
