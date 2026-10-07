import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export type Profile = {
  id: string;
  email: string;
  full_name: string | null;
  role: "admin" | "resident";
  created_at: string;
};

export type Patient = {
  id: string;
  mrn: string;
  full_name: string;
  age: number;
  gender: "Male" | "Female" | "Other";
  admission_date: string;
  diagnosis: string | null;
  bed_number: number | null;
  bed_status: "occupied" | "available" | "reserved";
  primary_resident_id: string | null;
  created_by: string | null;
  created_at: string;
};

export type VitalLog = {
  id: string;
  patient_id: string;
  recorded_at: string;
  heart_rate: number | null;
  systolic_bp: number | null;
  diastolic_bp: number | null;
  spo2: number | null;
  respiratory_rate: number | null;
  temperature: number | null;
  gcs: number | null;
  fio2: number | null;
  peep: number | null;
  inotropes: string | null;
  notes: string | null;
  recorded_by: string | null;
};

export type LabResult = {
  id: string;
  patient_id: string;
  recorded_at: string;
  ph: number | null;
  paco2: number | null;
  pao2: number | null;
  hco3: number | null;
  lactate: number | null;
  wbc: number | null;
  hgb: number | null;
  platelets: number | null;
  creatinine: number | null;
  alt: number | null;
  ast: number | null;
  sodium: number | null;
  potassium: number | null;
  image_url: string | null;
  notes: string | null;
  recorded_by: string | null;
};

export type Consultation = {
  id: string;
  patient_id: string;
  specialty: string;
  reason: string | null;
  recommendations: string | null;
  status: "pending" | "completed";
  requested_by: string | null;
  created_at: string;
};

export type IcuSettings = {
  id: number;
  total_beds: number;
  updated_at: string;
};
