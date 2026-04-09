"use client";

import { useState } from "react";

const STORAGE_KEY = "tutoreels_user";

export function getStoredUser(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(STORAGE_KEY);
}

export function setStoredUser(mobile: string) {
  localStorage.setItem(STORAGE_KEY, mobile);
}

export function clearStoredUser() {
  localStorage.removeItem(STORAGE_KEY);
}

interface LoginScreenProps {
  onLogin: (mobile: string) => void;
}

export function LoginScreen({ onLogin }: LoginScreenProps) {
  const [mobile, setMobile] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = () => {
    const cleaned = mobile.replace(/\D/g, "");
    if (cleaned.length < 10) {
      setError("Enter a valid mobile number (at least 10 digits)");
      return;
    }
    setStoredUser(cleaned);
    onLogin(cleaned);
  };

  return (
    <div className="min-h-screen bg-zinc-900 flex items-center justify-center">
      <div className="w-full max-w-sm mx-auto p-8">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">TutoReels</h1>
          <p className="text-sm text-zinc-400">
            Create explainer animations for any concept
          </p>
        </div>

        {/* Login card */}
        <div className="bg-zinc-800 border border-zinc-700 rounded-xl p-6 shadow-xl">
          <h2 className="text-lg font-medium text-white mb-1">Welcome</h2>
          <p className="text-xs text-zinc-400 mb-5">
            Enter your mobile number to get started
          </p>

          <div className="space-y-4">
            <div>
              <label className="text-xs text-zinc-400 block mb-1.5">
                Mobile Number
              </label>
              <input
                type="tel"
                value={mobile}
                onChange={(e) => {
                  setMobile(e.target.value);
                  setError("");
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSubmit();
                }}
                placeholder="+91 98765 43210"
                className="w-full bg-zinc-900 border border-zinc-600 rounded-lg px-4 py-3 text-white text-sm placeholder-zinc-500 focus:outline-none focus:border-blue-500 transition-colors"
                autoFocus
              />
              {error && (
                <p className="text-xs text-red-400 mt-1.5">{error}</p>
              )}
            </div>

            <button
              onClick={handleSubmit}
              disabled={!mobile.trim()}
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-600 disabled:cursor-not-allowed rounded-lg text-sm font-medium text-white transition-colors"
            >
              Continue
            </button>
          </div>

          <p className="text-[10px] text-zinc-600 text-center mt-4">
            Your number is stored locally on this device only
          </p>
        </div>
      </div>
    </div>
  );
}
