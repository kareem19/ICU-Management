"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import type { Patient, Profile, IcuSettings, Consultation } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  HeartPulse,
  LogOut,
  Bed,
  Users,
  Activity,
  CalendarPlus,
  Stethoscope,
  ShieldCheck,
  User,
  Plus,
  Settings,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Search,
} from "lucide-react";

export default function DashboardPage() {
  const supabase = createClient();
  const router = useRouter();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [settings, setSettings] = useState<IcuSettings | null>(null);
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [loading, setLoading] = useState(true);
  const [capacityEdit, setCapacityEdit] = useState(false);
  const [newCapacity, setNewCapacity] = useState(10);
  const [search, setSearch] = useState("");

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.replace("/login");
      return;
    }
    const { data: prof } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();
    setProfile(prof);

    const [{ data: pts }, { data: st }, { data: cons }] = await Promise.all([
      supabase.from("patients").select("*").order("bed_number", { ascending: true }),
      supabase.from("icu_settings").select("*").single(),
      supabase.from("consultations").select("*").eq("status", "pending"),
    ]);
    setPatients(pts || []);
    setSettings(st);
    setNewCapacity(st?.total_beds || 10);
    setConsultations(cons || []);
    setLoading(false);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  async function saveCapacity() {
    if (!settings) return;
    await supabase
      .from("icu_settings")
      .update({ total_beds: newCapacity, updated_at: new Date().toISOString() })
      .eq("id", 1);
    setSettings({ ...settings, total_beds: newCapacity });
    setCapacityEdit(false);
  }

  const totalBeds = settings?.total_beds || 10;
  const occupied = patients.filter((p) => p.bed_status === "occupied").length;
  const reserved = patients.filter((p) => p.bed_status === "reserved").length;
  const available = Math.max(0, totalBeds - occupied - reserved);
  const occupancyRate = totalBeds > 0 ? Math.round((occupied / totalBeds) * 100) : 0;

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const admittedToday = patients.filter(
    (p) => new Date(p.admission_date) >= todayStart
  ).length;

  const filteredPatients = patients.filter((p) =>
    (p.full_name + p.mrn + (p.diagnosis || "")).toLowerCase().includes(search.toLowerCase())
  );

  const beds = Array.from({ length: totalBeds }, (_, i) => {
    const bedNum = i + 1;
    const patient = patients.find((p) => p.bed_number === bedNum);
    return { bedNum, patient };
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-sky-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-600 to-teal-600 flex items-center justify-center shadow-md shadow-sky-200">
              <HeartPulse className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-slate-800 leading-tight">ICU Dashboard</h1>
              <p className="text-xs text-slate-500">Critical Care Unit</p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 text-sm">
              {profile?.role === "admin" ? (
                <ShieldCheck className="w-4 h-4 text-amber-600" />
              ) : (
                <User className="w-4 h-4 text-sky-600" />
              )}
              <span className="text-slate-700 font-medium">{profile?.full_name}</span>
              <span className="text-xs text-slate-500 capitalize">· {profile?.role}</span>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 rounded-lg hover:bg-slate-100 text-slate-600 transition"
              title="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <KpiCard
            icon={<Bed className="w-5 h-5" />}
            label="Total Beds"
            value={totalBeds}
            color="sky"
            action={
              profile?.role === "admin" && (
                <button
                  onClick={() => setCapacityEdit(true)}
                  className="text-xs text-sky-600 hover:underline flex items-center gap-1"
                >
                  <Settings className="w-3 h-3" /> Edit
                </button>
              )
            }
          />
          <KpiCard
            icon={<Activity className="w-5 h-5" />}
            label="Occupancy Rate"
            value={`${occupancyRate}%`}
            color={occupancyRate > 85 ? "red" : occupancyRate > 65 ? "amber" : "teal"}
            sub={`${occupied} occupied · ${available} free`}
          />
          <KpiCard
            icon={<CalendarPlus className="w-5 h-5" />}
            label="Admitted Today"
            value={admittedToday}
            color="violet"
          />
          <KpiCard
            icon={<Stethoscope className="w-5 h-5" />}
            label="Pending Consults"
            value={consultations.length}
            color="amber"
          />
        </div>

        {capacityEdit && (
          <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6">
              <h3 className="text-lg font-semibold text-slate-800 mb-1">
                Adjust Bed Capacity
              </h3>
              <p className="text-sm text-slate-500 mb-4">
                Set the total number of ICU beds available.
              </p>
              <input
                type="number"
                min={1}
                max={200}
                value={newCapacity}
                onChange={(e) => setNewCapacity(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 outline-none"
              />
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => setCapacityEdit(false)}
                  className="flex-1 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={saveCapacity}
                  className="flex-1 py-2 rounded-lg bg-sky-600 text-white hover:bg-sky-700 text-sm font-medium"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}

        <section className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-semibold text-slate-800 flex items-center gap-2">
                <Bed className="w-5 h-5 text-sky-600" /> Bed Layout
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Live occupancy · click a bed to view patient
              </p>
            </div>
            <div className="hidden sm:flex items-center gap-3 text-xs">
              <LegendDot color="bg-emerald-500" label="Available" />
              <LegendDot color="bg-rose-500" label="Occupied" />
              <LegendDot color="bg-amber-400" label="Reserved" />
            </div>
          </div>

          <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-2 sm:gap-3">
            {beds.map(({ bedNum, patient }) => {
              const status = patient?.bed_status || "available";
              const color =
                status === "occupied"
                  ? "bg-rose-50 border-rose-200 hover:bg-rose-100"
                  : status === "reserved"
                  ? "bg-amber-50 border-amber-200 hover:bg-amber-100"
                  : "bg-emerald-50 border-emerald-200 hover:bg-emerald-100";
              const textColor =
                status === "occupied"
                  ? "text-rose-700"
                  : status === "reserved"
                  ? "text-amber-700"
                  : "text-emerald-700";
              return (
                <Link
                  key={bedNum}
                  href={patient ? `/patients/${patient.id}` : "#"}
                  className={`relative aspect-square rounded-xl border-2 ${color} flex flex-col items-center justify-center transition ${
                    patient ? "cursor-pointer" : "cursor-default"
                  }`}
                  onClick={(e) => !patient && e.preventDefault()}
                >
                  <Bed className={`w-4 h-4 sm:w-5 sm:h-5 ${textColor}`} />
                  <span className={`text-xs font-bold mt-1 ${textColor}`}>
                    {bedNum}
                  </span>
                  {patient && (
                    <span className="text-[9px] text-slate-500 mt-0.5 truncate max-w-full px-1">
                      {patient.full_name.split(" ")[0]}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>

          <div className="flex sm:hidden items-center justify-center gap-3 text-xs mt-4">
            <LegendDot color="bg-emerald-500" label="Available" />
            <LegendDot color="bg-rose-500" label="Occupied" />
            <LegendDot color="bg-amber-400" label="Reserved" />
          </div>
        </section>

        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm">
          <div className="p-4 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="font-semibold text-slate-800 flex items-center gap-2">
                <Users className="w-5 h-5 text-sky-600" /> Patients
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {patients.length} total · {occupied} in ICU
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative flex-1 sm:flex-initial">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search name / MRN…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full sm:w-64 pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 outline-none"
                />
              </div>
              <Link
                href="/patients/new"
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gradient-to-r from-sky-600 to-teal-600 text-white text-sm font-medium hover:opacity-90 shadow-md shadow-sky-200"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Admit Patient</span>
                <span className="sm:hidden">New</span>
              </Link>
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {filteredPatients.length === 0 && (
              <div className="p-8 text-center text-sm text-slate-500">
                No patients found.
              </div>
            )}
            {filteredPatients.map((p) => (
              <Link
                key={p.id}
                href={`/patients/${p.id}`}
                className="block p-4 hover:bg-slate-50 transition"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      p.bed_status === "occupied"
                        ? "bg-rose-100 text-rose-600"
                        : p.bed_status === "reserved"
                        ? "bg-amber-100 text-amber-600"
                        : "bg-emerald-100 text-emerald-600"
                    }`}
                  >
                    {p.bed_status === "occupied" ? (
                      <AlertTriangle className="w-5 h-5" />
                    ) : p.bed_status === "reserved" ? (
                      <Clock className="w-5 h-5" />
                    ) : (
                      <CheckCircle2 className="w-5 h-5" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-slate-800 truncate">
                        {p.full_name}
                      </h3>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                        {p.mrn}
                      </span>
                      <span className="text-xs text-slate-500">
                        Bed {p.bed_number ?? "—"}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 truncate mt-0.5">
                      {p.diagnosis || "No diagnosis recorded"}
                    </p>
                  </div>
                  <div className="hidden sm:block text-right text-xs text-slate-500">
                    <div>{p.age}y · {p.gender[0]}</div>
                    <div>
                      {new Date(p.admission_date).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

function KpiCard({
  icon,
  label,
  value,
  color,
  sub,
  action,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  color: "sky" | "teal" | "violet" | "amber" | "red";
  sub?: string;
  action?: React.ReactNode;
}) {
  const colors = {
    sky: "from-sky-500 to-sky-600 shadow-sky-200",
    teal: "from-teal-500 to-teal-600 shadow-teal-200",
    violet: "from-violet-500 to-violet-600 shadow-violet-200",
    amber: "from-amber-500 to-amber-600 shadow-amber-200",
    red: "from-rose-500 to-rose-600 shadow-rose-200",
  };
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
      <div className="flex items-start justify-between">
        <div
          className={`w-9 h-9 rounded-lg bg-gradient-to-br ${colors[color]} text-white flex items-center justify-center shadow-md`}
        >
          {icon}
        </div>
        {action}
      </div>
      <div className="mt-3">
        <div className="text-2xl font-bold text-slate-800">{value}</div>
        <div className="text-xs text-slate-500 mt-0.5">{label}</div>
        {sub && <div className="text-[11px] text-slate-400 mt-1">{sub}</div>}
      </div>
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className={`w-2.5 h-2.5 rounded-full ${color}`} />
      <span className="text-slate-600">{label}</span>
    </div>
  );
}
