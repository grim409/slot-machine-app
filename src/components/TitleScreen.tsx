'use client';

import React from 'react';
import Link from 'next/link';

export default function TitleScreen() {
  return (
    <div
      className="
        min-h-screen flex items-center justify-center px-4
        bg-gradient-to-r from-amber-400 via-red-500 to-pink-500
        bg-[length:200%_200%] animate-gradient
      "
    >
      <div className="relative max-w-lg w-full">
        {/* Frosted-glass background */}
        <div className="absolute inset-0 bg-white/70 backdrop-blur-md rounded-xl"></div>

        {/* Content */}
        <div className="relative p-10 space-y-6 text-center">
          <h1
            className="
              text-4xl sm:text-5xl md:text-4xl
              font-extrabold text-red-700
              animate-pulse
              whitespace-nowrap
            "
          >
            🎰 Slots of Fun 🎰
          </h1>

          <p className="text-gray-800 text-lg">
            Spin the reels, chase the jackpots, and see if lady luck is on your side!
          </p>

          <Link href="/auth/signin">
            <button
              className="
                mt-4 w-full py-3 rounded-lg
                bg-red-600 hover:bg-red-700
                text-white text-xl font-bold
                shadow-lg transition
              "
            >
              Play Now
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
