"use client";

import { useEffect, useState, FormEvent } from "react";
import { createClient } from "@/lib/supabase";
import type { Profile, IcuSettings } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  UserPlus,
  Loader2,
  AlertCircle,
  Bed,
  Users,
} from "lucide-react";

export default function NewPatientPage() {
  const supabase = createClient();
  const router = useRouter();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [residents, setResidents] = useState<Profile[]>([]);
  const [settings, setSettings] = useState<IcuSettings | null>(null);
  const [occupiedBeds, setOccupiedBeds] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    mrn: "",
    full_name: "",
    age: "",
    gender: "Male" as "Male" | "Female" | "Other",
    diagnosis: "",
    bed_number: "",
    primary_resident_id: "",
  });

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace("/login");
        return;
      }
      const [{ data: prof }, { data: res }, { data: st }, { data: pts }] =
        await Promise.all([
          supabase.from("profiles").select("*").eq("id", user.id).single(),
          supabase.from("profiles").select("*").eq("role", "resident"),
          supabase.from("icu_settings").select("*").single(),
          supabase.from("patients").select("bed_number"),
        ]);
      setProfile(prof);
      setResidents(res || []);
      setSettings(st);
      setOccupiedBeds(
        (pts || []).map((p) => p.bed_number).filter((n): n is number => n != null)
      );
      if (prof) {
        setForm((f) => ({ ...f, primary_resident_id: prof.id }));
      }
    })();
  }, [router, supabase]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    const bedNum = form.bed_number ? Number(form.bed_number) : null;

    const { data, error: insertErr } = await supabase
      .from("patients")
      .insert({
        mrn: form.mrn,
        full_name: form.full_name,
        age: Number(form.age),
        gender: form.gender,
        diagnosis: form.diagnosis || null,
        bed_number: bedNum,
        bed_status: bedNum ? "occupied" : "available",
        primary_resident_id: form.primary_resident_id || null,
        created_by: user.id,
      })
      .select()
      .single();

    if (insertErr) {
      setError(insertErr.message);
      setLoading(false);
      return;
    }

    router.push(`/patients/${data.id}`);
  }

  const totalBeds = settings?.total_beds || 10;
  const availableBeds = Array.from({ length: totalBeds }, (_, i) => i + 1).filter(
    (n) => !occupiedBeds.includes(n)
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-3">
          <Link
            href="/dashboard"
            className="p-2 rounded-lg hover:bg-slate-100 text-slate-600"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-sky-600 to-teal-600 flex items-center justify-center">
            <UserPlus className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="font-semibold text-slate-800">Admit New Patient</h1>
            <p className="text-xs text-slate-500">ICU intake form</p>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          <section className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <h2 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <Users className="w-4 h-4 text-sky-600" /> Demographics
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Full Name *">
                <input
                  required
                  value={form.full_name}
                  onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                  className="input"
                  placeholder="John Doe"
                />
              </Field>
              <Field label="Medical Record Number (MRN) *">
                <input
                  required
                  value={form.mrn}
                  onChange={(e) => setForm({ ...form, mrn: e.target.value })}
                  className="input"
                  placeholder="MRN-100300"
                />
              </Field>
              <Field label="Age *">
                <input
                  required
                  type="number"
                  min={0}
                  max={130}
                  value={form.age}
                  onChange={(e) => setForm({ ...form, age: e.target.value })}
                  className="input"
                  placeholder="65"
                />
              </Field>
              <Field label="Gender *">
                <select
                  value={form.gender}
                  onChange={(e) =>
                    setForm({ ...form, gender: e.target.value as any })
                  }
                  className="input"
                >
                  <option>Male</option>
                  <option>Female</option>
                  <option>Other</option>
                </select>
              </Field>
              <Field label="Primary Diagnosis" full>
                <textarea
                  value={form.diagnosis}
                  onChange={(e) => setForm({ ...form, diagnosis: e.target.value })}
                  className="input min-h-[70px] resize-y"
                  placeholder="e.g. Septic shock secondary to pneumonia"
                />
              </Field>
            </div>
          </section>

          <section className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <h2 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <Bed className="w-4 h-4 text-sky-600" /> Bed & Assignment
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Bed Assignment">
                <select
                  value={form.bed_number}
                  onChange={(e) => setForm({ ...form, bed_number: e.target.value })}
                  className="input"
                >
                  <option value="">— Unassigned —</option>
                  {availableBeds.map((n) => (
                    <option key={n} value={n}>
                      Bed {n}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Primary Resident">
                <select
                  value={form.primary_resident_id}
                  onChange={(e) =>
                    setForm({ ...form, primary_resident_id: e.target.value })
                  }
                  className="input"
                >
                  <option value="">— None —</option>
                  {residents.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.full_name || r.email}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
          </section>

          {error && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-100 text-red-700 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex gap-2 sticky bottom-4">
            <Link
              href="/dashboard"
              className="flex-1 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 font-medium hover:bg-slate-50 text-center"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-sky-600 to-teal-600 text-white font-medium hover:opacity-90 shadow-md shadow-sky-200 disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Admitting…
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" /> Admit Patient
                </>
              )}
            </button>
          </div>
        </form>
      </main>

      <style jsx>{`
        .input {
          width: 100%;
          padding: 0.5rem 0.75rem;
          border-radius: 0.5rem;
          border: 1px solid #e2e8f0;
          font-size: 0.875rem;
          outline: none;
          transition: all 0.15s;
          background: white;
        }
        .input:focus {
          border-color: #0284c7;
          box-shadow: 0 0 0 3px rgba(2, 132, 199, 0.1);
        }
      `}</style>
    </div>
  );
}

function Field({
  label,
  children,
  full,
}: {
  label: string;
  children: React.ReactNode;
  full?: boolean;
}) {
  return (
    <div className={full ? "sm:col-span-2" : ""}>
      <label className="block text-xs font-medium text-slate-600 mb-1.5">
        {label}
      </label>
      {children}
    </div>
  );
}
