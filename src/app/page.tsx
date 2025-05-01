'use client';

import React from 'react';
import { useSession, signOut } from 'next-auth/react';
import TitleScreen from '../components/TitleScreen';
import SlotMachine from '../components/SlotMachine';

export default function HomePage() {
  const { data: session } = useSession();

  if (!session?.user) {
    return <TitleScreen />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-200 text-gray-800 font-sans">
      <header className="flex justify-between items-center p-6 bg-white shadow-md">
        <h1 className="text-3xl font-extrabold">🎰 Slots of Fun</h1>
        <div className="flex items-center space-x-4">
          <span className="text-lg">
            Welcome, {session.user.name ?? session.user.email}
          </span>
          <button
            onClick={() => signOut()}
            className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition"
          >
            Sign Out
          </button>
        </div>
      </header>

      <main className="p-6">
        <SlotMachine />
      </main>
    </div>
  );
}
