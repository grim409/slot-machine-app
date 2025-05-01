// src/app/auth/signup/page.tsx
'use client';
import React, { useState } from "react";
import { signIn } from "next-auth/react";

export default function SignUpPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Magic-link via EmailProvider also serves as sign-up
    await signIn("email", { email, callbackUrl: "/" });
    setSubmitted(true);
  };

  const containerClasses = `
    min-h-screen flex items-center justify-center px-4
    bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600
    bg-[length:200%_200%] animate-gradient
  `;

  if (submitted) {
    return (
      <div className={containerClasses}>
        <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-2xl p-6 max-w-sm w-full text-center">
          <p className="text-gray-900 text-lg font-semibold">
            ✅ Check your email for a magic link to complete sign-up.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={containerClasses}>
      <div className="relative max-w-md w-full">
        {/* Frosted glass background */}
        <div className="absolute inset-0 bg-white/80 backdrop-blur-md rounded-xl"></div>
        {/* Content */}
        <div className="relative space-y-6 p-8">
          <h1 className="text-2xl font-bold text-gray-900 text-center">
            Create Your Account
          </h1>

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="email"
              required
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="
                w-full py-3 px-4 rounded-lg
                border border-gray-300
                bg-gray-100 text-gray-900
                placeholder-gray-500
                focus:outline-none focus:ring-2 focus:ring-indigo-500
                transition
              "
            />

            <button
              type="submit"
              className="
                w-full py-3 rounded-lg
                bg-purple-600 hover:bg-purple-700
                text-white font-medium
                shadow-md transition
              "
            >
              Send Magic Link
            </button>
          </form>

          <p className="text-center text-sm text-gray-700">
            Already have an account?{" "}
            <a
              href="/auth/signin"
              className="font-medium text-indigo-600 hover:underline"
            >
              Sign in
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
