"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { Flame, Target, TrendingDown } from "lucide-react";

export default function AuthPage() {
  const [isSigningIn, setIsSigningIn] = useState(false);

  const handleGoogleSignIn = async () => {
    if (isSigningIn) return;

    setIsSigningIn(true);
    try {
      await signIn("google", { callbackUrl: "/onboarding" });
    } finally {
      setIsSigningIn(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-orange-50 via-white to-red-50 px-4">
      <div className="w-full max-w-md space-y-8">
        {/* Logo + Title */}
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center shadow-lg">
              <Flame className="w-10 h-10 text-white" />
            </div>
          </div>

          <div>
            <h1 className="text-4xl font-bold text-orange-600">
              Calorie Tracker
            </h1>
            <p className="text-gray-500 text-lg">
              Your simple way to track and achieve your calorie goals
            </p>
          </div>
        </div>

        {/* Feature Cards */}
        <div className="space-y-3">
          <div className="flex items-center gap-4 p-4 bg-white rounded-2xl border shadow-sm">
            <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
              <Target className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="font-semibold text-black">Set Your Goals</p>
              <p className="text-sm text-gray-500">
                Customize your daily calorie target
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-4 bg-white rounded-2xl border shadow-sm">
            <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
              <Flame className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="font-semibold text-black">Track Your Meals</p>
              <p className="text-sm text-gray-500">
                Log food and calories easily
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-4 bg-white rounded-2xl border shadow-sm">
            <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
              <TrendingDown className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="font-semibold text-black">Monitor Progress</p>
              <p className="text-sm text-gray-500">
                See your calorie deficit in real-time
              </p>
            </div>
          </div>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-3xl shadow-lg border p-8 text-center">
          <h2 className="text-xl font-semibold text-black mb-2">Get Started</h2>
          <p className="text-gray-500 text-sm mb-6">
            Sign in with Google to start tracking
          </p>

          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isSigningIn}
            className="w-full h-12 rounded-xl bg-black text-white font-semibold flex items-center justify-center gap-3 hover:bg-black/90 active:bg-black/80 transition"
          >
            {/* Google Logo */}
            <svg className="w-5 h-5" viewBox="0 0 48 48">
              <path
                fill="#FFC107"
                d="M43.611 20.083H42V20H24v8h11.303C33.659 32.657 29.215 36 24 36c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"
              />
              <path
                fill="#FF3D00"
                d="M6.306 14.691l6.571 4.819C14.655 16.108 18.961 13 24 13c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4c-7.732 0-14.41 4.388-17.694 10.691z"
              />
              <path
                fill="#4CAF50"
                d="M24 44c5.135 0 9.86-1.969 13.409-5.176l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.192 0-9.626-3.314-11.283-7.946l-6.522 5.025C9.455 39.556 16.227 44 24 44z"
              />
              <path
                fill="#1976D2"
                d="M43.611 20.083H42V20H24v8h11.303c-1.011 2.87-3.065 5.241-5.591 6.586l.003-.002 6.19 5.238C33.999 36.218 44 30 44 24c0-1.341-.138-2.65-.389-3.917z"
              />
            </svg>

            <span>{isSigningIn ? "Connecting..." : "Continue with Google"}</span>
          </button>

          <p className="text-xs text-gray-500 mt-6">
            By continuing, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
}
