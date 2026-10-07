
"use client";

import { useEffect, useState, FormEvent } from "react";
import { createClient } from "@/lib/supabase";
import type {
  Patient,
  Profile,
  VitalLog,
  LabResult,
  Consultation,
} from "@/lib/supabase";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Activity,
  FlaskConical,
  Stethoscope,
  Camera,
  Plus,
  Loader2,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Clock,
  User,
  Heart,
  Wind,
  Thermometer,
  Droplet,
  Brain,
  Edit3,
  LogOut,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { CameraLabUploader } from "@/components/CameraLabUploader";

type Tab = "vitals" | "labs" | "consults";

export default function PatientChartPage() {
  const supabase = createClient();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [profile, setProfile] = useState<Profile | null>(null);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [vitals, setVitals] = useState<VitalLog[]>([]);
  const [labs, setLabs] = useState<LabResult[]>([]);
  const [consults, setConsults] = useState<Consultation[]>([]);
  const [tab, setTab] = useState<Tab>("vitals");
  const [loading, setLoading] = useState(true);
  const [showVitalForm, setShowVitalForm] = useState(false);
  const [showLabForm, setShowLabForm] = useState(false);
  const [showConsultForm, setShowConsultForm] = useState(false);
  const [showEditPatient, setShowEditPatient] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    load();
  }, [id]);

  async function load() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.replace("/login");
      return;
    }
    const [{ data: prof }, { data: pat }, { data: v }, { data: l }, { data: c }] =
      await Promise.all([
        supabase.from("profiles").select("*").eq("id", user.id).single(),
        supabase.from("patients").select("*").eq("id", id).single(),
        supabase
          .from("vital_logs")
          .select("*")
          .eq("patient_id", id)
          .order("recorded_at", { ascending: true }),
        supabase
          .from("lab_results")
          .select("*")
          .eq("patient_id", id)
          .order("recorded_at", { ascending: true }),
        supabase
          .from("consultations")
          .select("*")
          .eq("patient_id", id)
          .order("created_at", { ascending: false }),
      ]);
    setProfile(prof);
    setPatient(pat);
    setVitals(v || []);
    setLabs(l || []);
    setConsults(c || []);
    setLoading(false);
  }

  function canEdit(recordedBy: string | null | undefined) {
    if (!profile || !recordedBy) return false;
    return profile.role === "admin" || profile.id === recordedBy;
  }

  async function deleteVital(v: VitalLog) {
    if (!confirm("Delete this vital log entry?")) return;
    setDeleting(v.id);
    await supabase.from("vital_logs").delete().eq("id", v.id);
    setVitals((prev) => prev.filter((x) => x.id !== v.id));
    setDeleting(null);
  }

  async function deleteLab(l: LabResult) {
    if (!confirm("Delete this lab result?")) return;
    setDeleting(l.id);
    await supabase.from("lab_results").delete().eq("id", l.id);
    setLabs((prev) => prev.filter((x) => x.id !== l.id));
    setDeleting(null);
  }

  async function deleteConsult(c: Consultation) {
    if (!confirm("Delete this consultation?")) return;
    setDeleting(c.id);
    await supabase.from("consultations").delete().eq("id", c.id);
    setConsults((prev) => prev.filter((x) => x.id !== c.id));
    setDeleting(null);
  }

  async function dischargePatient() {
    if (!patient) return;
    if (!confirm("Discharge this patient and free the bed?")) return;
    await supabase
      .from("patients")
      .update({ bed_status: "available", bed_number: null })
      .eq("id", patient.id);
    router.push("/dashboard");
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-sky-600" />
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <AlertCircle className="w-10 h-10 text-rose-500 mb-3" />
        <p className="text-slate-700 font-medium">Patient not found</p>
        <Link
          href="/dashboard"
          className="mt-4 px-4 py-2 rounded-lg bg-sky-600 text-white text-sm"
        >
          Back to dashboard
        </Link>
      </div>
    );
  }

  const chartData = vitals.map((v) => ({
    time: new Date(v.recorded_at).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    }),
    HR: v.heart_rate,
    SBP: v.systolic_bp,
    SpO2: v.spo2,
    RR: v.respiratory_rate,
  }));

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-3">
          <Link
            href="/dashboard"
            className="p-2 rounded-lg hover:bg-slate-100 text-slate-600"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-bold text-slate-800 truncate">
                {patient.full_name}
              </h1>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                {patient.mrn}
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-sky-100 text-sky-700">
                Bed {patient.bed_number ?? "—"}
              </span>
            </div>
            <p className="text-xs text-slate-500 truncate">
              {patient.age}y · {patient.gender} · {patient.diagnosis || "No diagnosis"}
            </p>
          </div>
          {profile?.role === "admin" && (
            <button
              onClick={dischargePatient}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 text-sm font-medium"
            >
              <LogOut className="w-4 h-4" /> Discharge
            </button>
          )}
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        <section className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-start justify-between mb-4">
            <h2 className="font-semibold text-slate-800">Patient Summary</h2>
            {(profile?.role === "admin" ||
              profile?.id === patient.created_by) && (
              <button
                onClick={() => setShowEditPatient(true)}
                className="text-xs text-sky-600 hover:underline flex items-center gap-1"
              >
                <Edit3 className="w-3 h-3" /> Edit
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
            <Info label="Age / Gender" value={`${patient.age}y · ${patient.gender}`} />
            <Info
              label="Admitted"
              value={new Date(patient.admission_date).toLocaleString()}
            />
            <Info label="Diagnosis" value={patient.diagnosis || "—"} />
            <Info
              label="Status"
              value={
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                    patient.bed_status === "occupied"
                      ? "bg-rose-100 text-rose-700"
                      : patient.bed_status === "reserved"
                      ? "bg-amber-100 text-amber-700"
                      : "bg-emerald-100 text-emerald-700"
                  }`}
                >
                  {patient.bed_status}
                </span>
              }
            />
          </div>
        </section>

        <div className="flex gap-1 bg-white rounded-xl border border-slate-200 p-1 shadow-sm overflow-x-auto">
          <TabBtn active={tab === "vitals"} onClick={() => setTab("vitals")}>
            <Activity className="w-4 h-4" /> Vitals
          </TabBtn>
          <TabBtn active={tab === "labs"} onClick={() => setTab("labs")}>
            <FlaskConical className="w-4 h-4" /> Labs
          </TabBtn>
          <TabBtn active={tab === "consults"} onClick={() => setTab("consults")}>
            <Stethoscope className="w-4 h-4" /> Consults
            {consults.filter((c) => c.status === "pending").length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold">
                {consults.filter((c) => c.status === "pending").length}
              </span>
            )}
          </TabBtn>
        </div>

        {tab === "vitals" && (
          <section className="space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-slate-800">Vitals Trend</h3>
                <button
                  onClick={() => setShowVitalForm(true)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-sky-600 text-white text-sm font-medium hover:bg-sky-700"
                >
                  <Plus className="w-4 h-4" /> Log Vitals
                </button>
              </div>
              {chartData.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-8">
                  No vitals recorded yet.
                </p>
              ) : (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="time" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                      <Line
                        type="monotone"
                        dataKey="HR"
                        stroke="#e11d48"
                        strokeWidth={2}
                        dot={{ r: 3 }}
                        name="HR"
                      />
                      <Line
                        type="monotone"
                        dataKey="SBP"
                        stroke="#0284c7"
                        strokeWidth={2}
                        dot={{ r: 3 }}
                        name="SBP"
                      />
                      <Line
                        type="monotone"
                        dataKey="SpO2"
                        stroke="#059669"
                        strokeWidth={2}
                        dot={{ r: 3 }}
                        name="SpO2"
                      />
                      <Line
                        type="monotone"
                        dataKey="RR"
                        stroke="#d97706"
                        strokeWidth={2}
                        dot={{ r: 3 }}
                        name="RR"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
              <div className="p-4 border-b border-slate-100">
                <h3 className="font-semibold text-slate-800">Vital Log History</h3>
              </div>
              <div className="divide-y divide-slate-100">
                {vitals.length === 0 && (
                  <p className="p-6 text-center text-sm text-slate-500">
                    No entries yet.
                  </p>
                )}
                {[...vitals].reverse().map((v) => (
                  <div key={v.id} className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="text-xs text-slate-500">
                        {new Date(v.recorded_at).toLocaleString()}
                      </div>
                      {canEdit(v.recorded_by) && (
                        <button
                          onClick={() => deleteVital(v)}
                          disabled={deleting === v.id}
                          className="p-1 rounded hover:bg-rose-50 text-rose-600"
                        >
                          {deleting === v.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                          )}
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 text-xs">
                      <VitalChip icon={<Heart className="w-3 h-3" />} label="HR" value={v.heart_rate ? `${v.heart_rate} bpm` : null} color="rose" />
                      <VitalChip icon={<Activity className="w-3 h-3" />} label="BP" value={v.systolic_bp ? `${v.systolic_bp}/${v.diastolic_bp}` : null} color="sky" />
                      <VitalChip icon={<Droplet className="w-3 h-3" />} label="SpO2" value={v.spo2 ? `${v.spo2}%` : null} color="teal" />
                      <VitalChip icon={<Wind className="w-3 h-3" />} label="RR" value={v.respiratory_rate ? `${v.respiratory_rate}/min` : null} color="amber" />
                      <VitalChip icon={<Thermometer className="w-3 h-3" />} label="Temp" value={v.temperature ? `${v.temperature}°C` : null} color="violet" />
                      <VitalChip icon={<Brain className="w-3 h-3" />} label="GCS" value={v.gcs} color="slate" />
                      <VitalChip label="FiO2" value={v.fio2 ? `${v.fio2}%` : null} color="indigo" />
                      <VitalChip label="PEEP" value={v.peep ? `${v.peep} cmH2O` : null} color="cyan" />
                    </div>
                    {v.inotropes && (
                      <div className="mt-2 text-xs text-slate-600">
                        <span className="font-medium">Inotropes:</span> {v.inotropes}
                      </div>
                    )}
                    {v.notes && (
                      <div className="mt-1 text-xs text-slate-500 italic">
                        {v.notes}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {showVitalForm && (
              <VitalFormModal
                patientId={id}
                onClose={() => setShowVitalForm(false)}
                onSaved={() => {
                  setShowVitalForm(false);
                  load();
                }}
              />
            )}
          </section>
        )}

        {tab === "labs" && (
          <section className="space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-slate-800">Laboratory & ABG</h3>
                <button
                  onClick={() => setShowLabForm(true)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-sky-600 text-white text-sm font-medium hover:bg-sky-700"
                >
                  <Plus className="w-4 h-4" /> Add Lab
                </button>
              </div>
              <div className="space-y-3">
                {labs.length === 0 && (
                  <p className="text-sm text-slate-500 text-center py-6">
                    No lab results yet.
                  </p>
                )}
                {[...labs].reverse().map((l) => (
                  <div
                    key={l.id}
                    className="border border-slate-100 rounded-xl p-4 hover:bg-slate-50 transition"
                  >
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="text-xs text-slate-500">
                        {new Date(l.recorded_at).toLocaleString()}
                      </div>
                      {canEdit(l.recorded_by) && (
                        <button
                          onClick={() => deleteLab(l)}
                          disabled={deleting === l.id}
                          className="p-1 rounded hover:bg-rose-50 text-rose-600"
                        >
                          {deleting === l.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                          )}
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 text-xs">
                      <LabChip label="pH" value={l.ph} />
                      <LabChip label="PaCO2" value={l.paco2} unit="mmHg" />
                      <LabChip label="PaO2" value={l.pao2} unit="mmHg" />
                      <LabChip label="HCO3" value={l.hco3} unit="mEq" />
                      <LabChip label="Lactate" value={l.lactate} unit="mmol" warn={l.lactate ? l.lactate > 2 : false} />
                      <LabChip label="WBC" value={l.wbc} unit="×10³" />
                      <LabChip label="Hgb" value={l.hgb} unit="g/dL" />
                      <LabChip label="Plt" value={l.platelets} unit="×10³" />
                      <LabChip label="Cr" value={l.creatinine} unit="mg/dL" warn={l.creatinine ? l.creatinine > 1.5 : false} />
                      <LabChip label="Na" value={l.sodium} unit="mEq" />
                      <LabChip label="K" value={l.potassium} unit="mEq" warn={l.potassium ? (l.potassium > 5.2 || l.potassium < 3.5) : false} />
                      <LabChip label="ALT" value={l.alt} unit="U/L" />
                      <LabChip label="AST" value={l.ast} unit="U/L" />
                    </div>
                    {l.notes && (
                      <div className="mt-2 text-xs text-slate-500 italic">
                        {l.notes}
                      </div>
                    )}
                    {l.image_url && (
                      <a
                        href={l.image_url}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-3 inline-flex items-center gap-1.5 text-xs text-sky-600 hover:underline"
                      >
                        <Camera className="w-3.5 h-3.5" /> View attached lab sheet
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {showLabForm && (
              <LabFormModal
                patientId={id}
                onClose={() => setShowLabForm(false)}
                onSaved={() => {
                  setShowLabForm(false);
                  load();
                }}
              />
            )}
          </section>
        )}

        {tab === "consults" && (
          <section className="space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-slate-800">
                  Multidisciplinary Consultations
                </h3>
                <button
                  onClick={() => setShowConsultForm(true)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-sky-600 text-white text-sm font-medium hover:bg-sky-700"
                >
                  <Plus className="w-4 h-4" /> Request
                </button>
              </div>
              <div className="space-y-3">
                {consults.length === 0 && (
                  <p className="text-sm text-slate-500 text-center py-6">
                    No consultations requested.
                  </p>
                )}
                {consults.map((c) => (
                  <div
                    key={c.id}
                    className="border border-slate-100 rounded-xl p-4"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                            c.status === "pending"
                              ? "bg-amber-100 text-amber-700"
                              : "bg-emerald-100 text-emerald-700"
                          }`}
                        >
                          {c.status === "pending" ? (
                            <Clock className="w-4 h-4" />
                          ) : (
                            <CheckCircle2 className="w-4 h-4" />
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-slate-800 text-sm">
                            {c.specialty}
                          </div>
                          <div className="text-xs text-slate-500">
                            {new Date(c.created_at).toLocaleString()}
                          </div>
                        </div>
                      </div>
                      {canEdit(c.requested_by) && (
                        <button
                          onClick={() => deleteConsult(c)}
                          disabled={deleting === c.id}
                          className="p-1 rounded hover:bg-rose-50 text-rose-600"
                        >
                          {deleting === c.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                          )}
                        </button>
                      )}
                    </div>
                    {c.reason && (
                      <p className="text-sm text-slate-700 mt-2">
                        <span className="font-medium">Reason:</span> {c.reason}
                      </p>
                    )}
                    {c.recommendations && (
                      <p className="text-sm text-slate-700 mt-1">
                        <span className="font-medium">Recommendations:</span>{" "}
                        {c.recommendations}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {showConsultForm && (
              <ConsultFormModal
                patientId={id}
                onClose={() => setShowConsultForm(false)}
                onSaved={() => {
                  setShowConsultForm(false);
                  load();
                }}
              />
            )}
          </section>
        )}

        {showEditPatient && (
          <EditPatientModal
            patient={patient}
            onClose={() => setShowEditPatient(false)}
            onSaved={() => {
              setShowEditPatient(false);
              load();
            }}
          />
        )}
      </main>
    </div>
  );
}

function Info({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs text-slate-500">{label}</div>
      <div className="text-sm font-medium text-slate-800 mt-0.5">{value}</div>
    </div>
  );
}

function TabBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition ${
        active
          ? "bg-gradient-to-r from-sky-600 to-teal-600 text-white shadow-md shadow-sky-200"
          : "text-slate-600 hover:bg-slate-50"
      }`}
    >
      {children}
    </button>
  );
}

function VitalChip({
  icon,
  label,
  value,
  color,
}: {
  icon?: React.ReactNode;
  label: string;
  value: React.ReactNode;
  color: string;
}) {
  const colors: Record<string, string> = {
    rose: "bg-rose-50 text-rose-700",
    sky: "bg-sky-50 text-sky-700",
    teal: "bg-teal-50 text-teal-700",
    amber: "bg-amber-50 text-amber-700",
    violet: "bg-violet-50 text-violet-700",
    slate: "bg-slate-50 text-slate-700",
    indigo: "bg-indigo-50 text-indigo-700",
    cyan: "bg-cyan-50 text-cyan-700",
  };
  return (
    <div className={`rounded-lg px-2 py-1.5 ${colors[color] || colors.slate}`}>
      <div className="flex items-center gap-1 text-[10px] opacity-80">
        {icon}
        {label}
      </div>
      <div className="font-semibold text-sm">
        {value ?? <span className="opacity-40">—</span>}
      </div>
    </div>
  );
}

function LabChip({
  label,
  value,
  unit,
  warn,
}: {
  label: string;
  value: number | null | undefined;
  unit?: string;
  warn?: boolean;
}) {
  return (
    <div
      className={`rounded-lg px-2 py-1.5 ${
        warn ? "bg-rose-50 text-rose-700" : "bg-slate-50 text-slate-700"
      }`}
    >
      <div className="text-[10px] opacity-70">{label}</div>
      <div className="font-semibold text-sm">
        {value ?? <span className="opacity-40">—</span>}
        {value && unit && <span className="text-[10px] opacity-60 ml-0.5">{unit}</span>}
      </div>
    </div>
  );
}

function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-slate-100 px-5 py-3 flex items-center justify-between">
          <h3 className="font-semibold text-slate-800">{title}</h3>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-slate-100 text-slate-500"
          >
            ✕
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
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

const inputCls =
  "w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 outline-none";

function VitalFormModal({
  patientId,
  onClose,
  onSaved,
}: {
  patientId: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    heart_rate: "",
    systolic_bp: "",
    diastolic_bp: "",
    spo2: "",
    respiratory_rate: "",
    temperature: "",
    gcs: "",
    fio2: "",
    peep: "",
    inotropes: "",
    notes: "",
  });

  async function submit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    const payload: any = { patient_id: patientId, recorded_by: user?.id };
    Object.entries(form).forEach(([k, v]) => {
      if (v !== "") payload[k] = Number(v);
    });
    payload.inotropes = form.inotropes || null;
    payload.notes = form.notes || null;

    await supabase.from("vital_logs").insert(payload);
    setLoading(false);
    onSaved();
  }

  return (
    <Modal title="Log Vitals" onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <Field label="Heart Rate (bpm)">
            <input type="number" className={inputCls} value={form.heart_rate} onChange={(e) => setForm({ ...form, heart_rate: e.target.value })} />
          </Field>
          <Field label="Systolic BP">
            <input type="number" className={inputCls} value={form.systolic_bp} onChange={(e) => setForm({ ...form, systolic_bp: e.target.value })} />
          </Field>
          <Field label="Diastolic BP">
            <input type="number" className={inputCls} value={form.diastolic_bp} onChange={(e) => setForm({ ...form, diastolic_bp: e.target.value })} />
          </Field>
          <Field label="SpO2 (%)">
            <input type="number" step="0.1" className={inputCls} value={form.spo2} onChange={(e) => setForm({ ...form, spo2: e.target.value })} />
          </Field>
          <Field label="Resp. Rate">
            <input type="number" className={inputCls} value={form.respiratory_rate} onChange={(e) => setForm({ ...form, respiratory_rate: e.target.value })} />
          </Field>
          <Field label="Temp (°C)">
            <input type="number" step="0.1" className={inputCls} value={form.temperature} onChange={(e) => setForm({ ...form, temperature: e.target.value })} />
          </Field>
          <Field label="GCS">
            <input type="number" min={3} max={15} className={inputCls} value={form.gcs} onChange={(e) => setForm({ ...form, gcs: e.target.value })} />
          </Field>
          <Field label="FiO2 (%)">
            <input type="number" className={inputCls} value={form.fio2} onChange={(e) => setForm({ ...form, fio2: e.target.value })} />
          </Field>
          <Field label="PEEP (cmH2O)">
            <input type="number" className={inputCls} value={form.peep} onChange={(e) => setForm({ ...form, peep: e.target.value })} />
          </Field>
        </div>
        <Field label="Inotropes / Vasopressors" full>
          <input className={inputCls} placeholder="e.g. Norepinephrine 0.1 mcg/kg/min" value={form.inotropes} onChange={(e) => setForm({ ...form, inotropes: e.target.value })} />
        </Field>
        <Field label="Notes" full>
          <textarea className={`${inputCls} min-h-[60px]`} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        </Field>
        <div className="flex gap-2 pt-2">
          <button type="button" onClick={onClose} className="flex-1 py-2 rounded-lg border border-slate-200 text-slate-700 text-sm font-medium hover:bg-slate-50">
            Cancel
          </button>
          <button type="submit" disabled={loading} className="flex-1 py-2 rounded-lg bg-sky-600 text-white text-sm font-medium hover:bg-sky-700 disabled:opacity-60 flex items-center justify-center gap-2">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />} Save
          </button>
        </div>
      </form>
    </Modal>
  );
}

function LabFormModal({
  patientId,
  onClose,
  onSaved,
}: {
  patientId: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [form, setForm] = useState({
    ph: "", paco2: "", pao2: "", hco3: "", lactate: "",
    wbc: "", hgb: "", platelets: "", creatinine: "",
    alt: "", ast: "", sodium: "", potassium: "", notes: "",
  });

  async function submit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();

    let imageUrl: string | null = null;
    if (imageFile) {
      const path = `${patientId}/${Date.now()}-${imageFile.name}`;
      const { error: upErr } = await supabase.storage
        .from("lab-images")
        .upload(path, imageFile, { upsert: true });
      if (!upErr) {
        const { data: urlData } = supabase.storage
          .from("lab-images")
          .getPublicUrl(path);
        imageUrl = urlData.publicUrl;
      }
    }

    const payload: any = { patient_id: patientId, recorded_by: user?.id, image_url: imageUrl };
    Object.entries(form).forEach(([k, v]) => {
      if (k === "notes") payload[k] = v || null;
      else if (v !== "") payload[k] = Number(v);
    });

    await supabase.from("lab_results").insert(payload);
    setLoading(false);
    onSaved();
  }

  return (
    <Modal title="Add Lab Result" onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
          <div className="text-xs font-medium text-slate-600 mb-2 flex items-center gap-1">
            <Camera className="w-3.5 h-3.5" /> Attach lab sheet (optional)
          </div>
          <CameraLabUploader onFile={setImageFile} currentFile={imageFile} />
        </div>

        <div className="text-xs font-semibold text-slate-700 pt-2">ABG</div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <Field label="pH"><input type="number" step="0.01" className={inputCls} value={form.ph} onChange={(e) => setForm({ ...form, ph: e.target.value })} /></Field>
          <Field label="PaCO2"><input type="number" step="0.1" className={inputCls} value={form.paco2} onChange={(e) => setForm({ ...form, paco2: e.target.value })} /></Field>
          <Field label="PaO2"><input type="number" step="0.1" className={inputCls} value={form.pao2} onChange={(e) => setForm({ ...form, pao2: e.target.value })} /></Field>
          <Field label="HCO3"><input type="number" step="0.1" className={inputCls} value={form.hco3} onChange={(e) => setForm({ ...form, hco3: e.target.value })} /></Field>
          <Field label="Lactate"><input type="number" step="0.1" className={inputCls} value={form.lactate} onChange={(e) => setForm({ ...form, lactate: e.target.value })} /></Field>
        </div>

        <div className="text-xs font-semibold text-slate-700 pt-2">CBC / Chemistry</div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <Field label="WBC"><input type="number" step="0.1" className={inputCls} value={form.wbc} onChange={(e) => setForm({ ...form, wbc: e.target.value })} /></Field>
          <Field label="Hgb"><input type="number" step="0.1" className={inputCls} value={form.hgb} onChange={(e) => setForm({ ...form, hgb: e.target.value })} /></Field>
          <Field label="Platelets"><input type="number" className={inputCls} value={form.platelets} onChange={(e) => setForm({ ...form, platelets: e.target.value })} /></Field>
          <Field label="Creatinine"><input type="number" step="0.01" className={inputCls} value={form.creatinine} onChange={(e) => setForm({ ...form, creatinine: e.target.value })} /></Field>
          <Field label="ALT"><input type="number" className={inputCls} value={form.alt} onChange={(e) => setForm({ ...form, alt: e.target.value })} /></Field>
          <Field label="AST"><input type="number" className={inputCls} value={form.ast} onChange={(e) => setForm({ ...form, ast: e.target.value })} /></Field>
          <Field label="Sodium"><input type="number" step="0.1" className={inputCls} value={form.sodium} onChange={(e) => setForm({ ...form, sodium: e.target.value })} /></Field>
          <Field label="Potassium"><input type="number" step="0.1" className={inputCls} value={form.potassium} onChange={(e) => setForm({ ...form, potassium: e.target.value })} /></Field>
        </div>

        <Field label="Notes" full>
          <textarea className={`${inputCls} min-h-[60px]`} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        </Field>

        <div className="flex gap-2 pt-2">
          <button type="button" onClick={onClose} className="flex-1 py-2 rounded-lg border border-slate-200 text-slate-700 text-sm font-medium hover:bg-slate-50">Cancel</button>
          <button type="submit" disabled={loading} className="flex-1 py-2 rounded-lg bg-sky-600 text-white text-sm font-medium hover:bg-sky-700 disabled:opacity-60 flex items-center justify-center gap-2">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />} Save
          </button>
        </div>
      </form>
    </Modal>
  );
}

function ConsultFormModal({
  patientId,
  onClose,
  onSaved,
}: {
  patientId: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    specialty: "Cardiology",
    reason: "",
    recommendations: "",
  });

  const specialties = [
    "Cardiology","Nephrology","Pulmonology","Neurology","Gastroenterology",
    "Surgery","Infectious Disease","Endocrinology","Hematology","Other",
  ];

  async function submit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from("consultations").insert({
      patient_id: patientId,
      specialty: form.specialty,
      reason: form.reason || null,
      recommendations: form.recommendations || null,
      requested_by: user?.id,
    });
    setLoading(false);
    onSaved();
  }

  return (
    <Modal title="Request Consultation" onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        <Field label="Specialty">
          <select className={inputCls} value={form.specialty} onChange={(e) => setForm({ ...form, specialty: e.target.value })}>
            {specialties.map((s) => <option key={s}>{s}</option>)}
          </select>
        </Field>
        <Field label="Reason for consult" full>
          <textarea className={`${inputCls} min-h-[70px]`} value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} placeholder="Clinical question / indication" />
        </Field>
        <Field label="Recommendations / Notes" full>
          <textarea className={`${inputCls} min-h-[70px]`} value={form.recommendations} onChange={(e) => setForm({ ...form, recommendations: e.target.value })} />
        </Field>
        <div className="flex gap-2 pt-2">
          <button type="button" onClick={onClose} className="flex-1 py-2 rounded-lg border border-slate-200 text-slate-700 text-sm font-medium hover:bg-slate-50">Cancel</button>
          <button type="submit" disabled={loading} className="flex-1 py-2 rounded-lg bg-sky-600 text-white text-sm font-medium hover:bg-sky-700 disabled:opacity-60 flex items-center justify-center gap-2">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />} Submit
          </button>
        </div>
      </form>
    </Modal>
  );
}

function EditPatientModal({
  patient,
  onClose,
  onSaved,
}: {
  patient: Patient;
  onClose: () => void;
  onSaved: () => void;
}) {
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    full_name: patient.full_name,
    diagnosis: patient.diagnosis || "",
    bed_number: patient.bed_number?.toString() || "",
    bed_status: patient.bed_status,
  });

  async function submit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    await supabase
      .from("patients")
      .update({
        full_name: form.full_name,
        diagnosis: form.diagnosis || null,
        bed_number: form.bed_number ? Number(form.bed_number) : null,
        bed_status: form.bed_status,
      })
      .eq("id", patient.id);
    setLoading(false);
    onSaved();
  }

  return (
    <Modal title="Edit Patient" onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        <Field label="Full Name" full>
          <input className={inputCls} value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
        </Field>
        <Field label="Diagnosis" full>
          <textarea className={`${inputCls} min-h-[70px]`} value={form.diagnosis} onChange={(e) => setForm({ ...form, diagnosis: e.target.value })} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Bed #">
            <input type="number" className={inputCls} value={form.bed_number} onChange={(e) => setForm({ ...form, bed_number: e.target.value })} />
          </Field>
          <Field label="Status">
            <select className={inputCls} value={form.bed_status} onChange={(e) => setForm({ ...form, bed_status: e.target.value as any })}>
              <option value="occupied">Occupied</option>
              <option value="reserved">Reserved</option>
              <option value="available">Available</option>
            </select>
          </Field>
        </div>
        <div className="flex gap-2 pt-2">
          <button type="button" onClick={onClose} className="flex-1 py-2 rounded-lg border border-slate-200 text-slate-700 text-sm font-medium hover:bg-slate-50">Cancel</button>
          <button type="submit" disabled={loading} className="flex-1 py-2 rounded-lg bg-sky-600 text-white text-sm font-medium hover:bg-sky-700 disabled:opacity-60 flex items-center justify-center gap-2">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />} Save
          </button>
        </div>
      </form>
    </Modal>
  );
}
