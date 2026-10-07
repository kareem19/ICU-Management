"use client";

import { useEffect, useState, FormEvent } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import {
  HeartPulse,
  Mail,
  Lock,
  Loader2,
  Stethoscope,
  AlertCircle,
} from "lucide-react";

export default function LoginPage() {
  const supabase = createClient();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if already logged in
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) router.replace("/dashboard");
    });
  }, [router, supabase.auth]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.replace("/dashboard");
    router.refresh();
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-50 via-white to-teal-50 p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8 fade-in">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-sky-600 to-teal-600 shadow-lg shadow-sky-200 mb-4">
            <HeartPulse className="w-9 h-9 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">ICU Management</h1>
          <p className="text-slate-500 text-sm mt-1">
            Critical Care Clinical Platform
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 p-8 fade-in">
          <div className="flex items-center gap-2 mb-6">
            <Stethoscope className="w-5 h-5 text-sky-600" />
            <h2 className="text-lg font-semibold text-slate-800">
              Staff Sign-In
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@hospital.org"
                  className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-slate-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 outline-none transition text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-slate-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 outline-none transition text-sm"
                />
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-100 text-red-700 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg bg-gradient-to-r from-sky-600 to-teal-600 text-white font-medium hover:opacity-90 transition disabled:opacity-60 flex items-center justify-center gap-2 shadow-md shadow-sky-200"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Signing in…
                </>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-100 text-xs text-slate-500 space-y-1">
            <p className="font-medium text-slate-600">Demo credentials:</p>
            <p>Admin: <code className="bg-slate-100 px-1 rounded">admin@icu.local</code> / <code className="bg-slate-100 px-1 rounded">admin123</code></p>
            <p>Resident: <code className="bg-slate-100 px-1 rounded">resident1@icu.local</code> / <code className="bg-slate-100 px-1 rounded">resident123</code></p>
          </div>
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">
          © 2026 ICU Management System · HIPAA-aware environment
        </p>
      </div>
    </div>
  );
}
