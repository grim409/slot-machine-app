'use client';
import React from 'react';
import { signIn } from 'next-auth/react';

export default function SignInPage() {
  const containerClasses = `
    min-h-screen flex items-center justify-center px-4
    bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600
    bg-[length:200%_200%] animate-gradient
  `;

  return (
    <div className={containerClasses}>
      <div className="relative max-w-md w-full">
        {/* Frosted-glass card */}
        <div className="absolute inset-0 bg-white/80 backdrop-blur-md rounded-xl"></div>
        <div className="relative p-8 space-y-6 text-center">
          <h1 className="text-2xl font-bold text-gray-900">Welcome Back</h1>

          <button
            onClick={() => signIn('google', { callbackUrl: '/' })}
            className="
              w-full py-3 rounded-lg
              bg-indigo-700 hover:bg-indigo-800
              text-white font-medium
              shadow-md transition
            "
          >
            Sign in with Google
          </button>
        </div>
      </div>
    </div>
  );
}
