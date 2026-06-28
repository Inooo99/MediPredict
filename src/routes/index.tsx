import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { predict, type PredictInput, type PredictResult } from "../lib/predict";
import { findPatient, type Patient } from "../lib/patients";
import { ResultCard } from "../components/ResultCard";
import { VitalCell } from "../components/VitalCell";

export const Route = createFileRoute("/")({
  component: Index,
});

type Mode = "registered" | "new";

type HistoryEntry = {
  at: number;
  label: string;
  result: PredictResult;
};

function gStatus(g: number) {
  if (g >= 140) return "high" as const;
  if (g >= 110) return "warn" as const;
  return "normal" as const;
}
function bpStatus(bp: number) {
  if (bp >= 90) return "high" as const;
  if (bp >= 80) return "warn" as const;
  return "normal" as const;
}
function bmiStatus(b: number) {
  if (b >= 30) return "high" as const;
  if (b >= 25) return "warn" as const;
  return "normal" as const;
}

function Header() {
  return (
    <header className="sticky top-0 z-20 border-b border-border/70 bg-background/85 backdrop-blur">
      <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M12 21s-7-4.5-9-9a5 5 0 0 1 9-3 5 5 0 0 1 9 3c-2 4.5-9 9-9 9Z" />
            <path d="M3 12h4l2-3 3 6 2-3h7" />
          </svg>
        </div>
        <div className="min-w-0">
          <h1 className="truncate text-base font-semibold leading-tight text-foreground">
            MediCheck
          </h1>
          <p className="truncate text-[11px] mt-1 text-muted-foreground">
            Sistem Prediksi Diabetes
          </p>
        </div>
      </div>
    </header>
  );
}

function ModeToggle({ mode, setMode }: { mode: Mode; setMode: (m: Mode) => void }) {
  return (
    <div className="grid grid-cols-2 gap-1 rounded-lg border bg-card p-1 shadow-sm">
      {(
        [
          { id: "registered", label: "Pasien Terdaftar" },
          { id: "new", label: "Pasien Baru" },
        ] as const
      ).map((o) => {
        const active = mode === o.id;
        return (
          <button
            key={o.id}
            type="button"
            onClick={() => setMode(o.id)}
            aria-pressed={active}
            className={`h-11 rounded-lg text-sm font-medium transition-all ${
              active
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

function RegisteredMode({
  onPredicted,
  selectedModel,
}: {
  onPredicted: (label: string, r: PredictResult) => void;
  selectedModel: string;
}) {
  const [id, setId] = useState("");
  const [patient, setPatient] = useState<Patient | null>(null);
  const [result, setResult] = useState<PredictResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);
    setPatient(null);
    if (!id.trim()) {
      setError("Masukkan ID pasien terlebih dahulu.");
      return;
    }
    setLoading(true);
    await new Promise((r) => setTimeout(r, 500));
    const p = await findPatient(id);
    if (!p) {
      setLoading(false);
      setError(`Pasien dengan ID "${id}" tidak ditemukan.`);
      return;
    }
    setPatient(p);
    try {
      const r = await predict({ ...p.vitals, model_type: selectedModel });
      setResult(r);
      onPredicted(`${p.name} (${p.id})`, r);
    } catch {
      setError("Gagal menghubungi layanan prediksi. Coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSearch} className="rounded-lg border bg-card p-4 shadow-sm">
        <label htmlFor="pid" className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          ID Pasien
        </label>
        <div className="mt-2 flex flex-col gap-2 sm:flex-row">
          <input
            id="pid"
            value={id}
            onChange={(e) => setId(e.target.value)}
            placeholder="Contoh: P-222"
            className="h-12 flex-1 rounded-lg text-gray-500 border border-input bg-background px-4 text-base text-foreground outline-none ring-ring/40 transition focus:border-ring focus:ring-2"
            autoComplete="off"
            inputMode="text"
          />
          <button
            type="submit"
            disabled={loading}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 disabled:opacity-60"
          >
            {loading ? (
              <>
                <Spinner /> Mencari…
              </>
            ) : (
              "Cari Data"
            )}
          </button>
        </div>
        <p className="mt-2 text-[11px] text-muted-foreground">
          Coba ketik dari <code className="rounded bg-muted px-1.5 py-0.5">P-0</code> hingga{" "}
          <code className="rounded bg-muted px-1.5 py-0.5">P-767</code>
        </p>
        {error && (
          <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-red-200">
            {error}
          </p>
        )}
      </form>

      {patient && (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 rounded-2xl border bg-card p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-accent text-accent-foreground font-semibold">
              {patient.name
                .split(" ")
                .slice(0, 2)
                .map((s) => s[0])
                .join("")}
            </div>
            <div className="min-w-0">
              <p className="truncate text-base font-semibold text-foreground">{patient.name}</p>
              <p className="text-xs text-muted-foreground">
                {patient.id} · {patient.gender === "L" ? "Laki-laki" : "Perempuan"} · {patient.age} thn
              </p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <VitalCell label="Glukosa" value={patient.vitals.glucose} unit="mg/dL" status={gStatus(patient.vitals.glucose)} />
            <VitalCell label="Tek. Darah" value={patient.vitals.blood_pressure} unit="mmHg" status={bpStatus(patient.vitals.blood_pressure)} />
            <VitalCell label="BMI" value={patient.vitals.bmi} unit="kg/m²" status={bmiStatus(patient.vitals.bmi)} />
            <VitalCell label="Kehamilan" value={patient.vitals.pregnancies} />
            <VitalCell label="Insulin" value={patient.vitals.insulin} unit="µU/mL" />
            <VitalCell label="Skin Thickness" value={patient.vitals.skin_thickness} unit="mm" />
            <VitalCell label="Keturunan (DPF)" value={patient.vitals.diabetes_pedigree_function} />
            <VitalCell label="Umur" value={patient.vitals.age} unit="thn" />
          </div>

          <div className="mt-4 rounded-lg bg-muted/60 p-3">
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Riwayat Medis
            </p>
            <p className="mt-1 text-sm text-foreground">{patient.history}</p>
          </div>
        </div>
      )}

      {result && <ResultCard result={result} />}

      {result && result.reasons && result.reasons.length > 0 && (
        <div className="animate-in fade-in duration-300 rounded-2xl border border-amber-200 bg-amber-50/60 p-4 text-left">
          <p className="text-xs font-bold uppercase tracking-wider text-amber-800">Analisis Faktor Risiko Utama:</p>
          <ul className="mt-2 list-disc list-inside space-y-1 text-sm text-amber-700">
            {result.reasons.map((reason, index) => (
              <li key={index}>{reason}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

const FIELDS: {
  key: keyof PredictInput;
  label: string;
  unit?: string;
  step?: string;
  placeholder: string;
}[] = [
  { key: "glucose", label: "Glukosa", unit: "mg/dL", placeholder: "120" },
  { key: "blood_pressure", label: "Tekanan Darah", unit: "mmHg", placeholder: "80" },
  { key: "bmi", label: "BMI", unit: "kg/m²", step: "0.1", placeholder: "24.5" },
  { key: "insulin", label: "Insulin", unit: "µU/mL", placeholder: "100" },
  { key: "age", label: "Umur", unit: "thn", placeholder: "35" },
  { key: "skin_thickness", label: "Skin Thickness", unit: "mm", placeholder: "25" },
  { key: "pregnancies", label: "Kehamilan", placeholder: "0" },
  { key: "diabetes_pedigree_function", label: "Riwayat Keturunan (DPF)", step: "0.01", placeholder: "0.5" },
];

function NewPatientMode({
  onPredicted,
  selectedModel,
}: {
  onPredicted: (label: string, r: PredictResult) => void;
  selectedModel: string;
}) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PredictResult | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  function set(k: string, v: string) {
    setValues((s) => ({ ...s, [k]: v }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setApiError(null);
    const newErr: Record<string, string> = {};
    const payload: Partial<PredictInput> = {};
    for (const f of FIELDS) {
      const raw = (values[f.key] ?? "").trim();
      if (raw === "") {
        newErr[f.key] = "Wajib diisi";
        continue;
      }
      const n = Number(raw);
      if (!Number.isFinite(n) || n < 0) {
        newErr[f.key] = "Angka tidak valid";
        continue;
      }
      (payload as Record<string, number>)[f.key] = n;
    }
    setErrors(newErr);
    if (Object.keys(newErr).length) return;

    setLoading(true);
    try {
      const r = await predict({ ...(payload as PredictInput), model_type: selectedModel });
      setResult(r);
      onPredicted("Input manual", r);
    } catch {
      setApiError("Gagal memproses prediksi. Coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={submit} className="rounded-2xl border bg-card p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {FIELDS.map((f) => (
            <div key={f.key}>
              <label htmlFor={f.key} className="text-xs font-medium text-muted-foreground">
                {f.label} {f.unit && <span className="text-muted-foreground/70">({f.unit})</span>}
              </label>
              <input
                id={f.key}
                type="number"
                inputMode="decimal"
                step={f.step ?? "1"}
                min={0}
                placeholder={f.placeholder}
                value={values[f.key] ?? ""}
                onChange={(e) => set(f.key, e.target.value)}
                className={`mt-1 h-12 w-full rounded-xl border bg-background px-4 text-base text-foreground outline-none ring-ring/40 transition focus:ring-2 ${
                  errors[f.key] ? "border-red-400 focus:border-red-500" : "border-input focus:border-ring"
                }`}
              />
              {errors[f.key] && (
                <p className="mt-1 text-[11px] text-red-600">{errors[f.key]}</p>
              )}
            </div>
          ))}
        </div>

        {apiError && (
          <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-red-200">
            {apiError}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="mt-4 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 disabled:opacity-60"
        >
          {loading ? (
            <>
              <Spinner /> Memproses…
            </>
          ) : (
            "Prediksi Sekarang"
          )}
        </button>
      </form>

      {result && <ResultCard result={result} />}

      {result && result.reasons && result.reasons.length > 0 && (
        <div className="animate-in fade-in duration-300 rounded-2xl border border-amber-200 bg-amber-50/60 p-4 text-left">
          <p className="text-xs font-bold uppercase tracking-wider text-amber-800">Analisis Faktor Risiko Utama:</p>
          <ul className="mt-2 list-disc list-inside space-y-1 text-sm text-amber-700">
            {result.reasons.map((reason, index) => (
              <li key={index}>{reason}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function HistoryList({ items }: { items: HistoryEntry[] }) {
  if (!items.length) return null;
  return (
    <section className="rounded-2xl border bg-card p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">Riwayat Prediksi</h2>
        <span className="text-[11px] text-muted-foreground">{items.length} terbaru</span>
      </div>
      <ul className="mt-3 divide-y divide-border">
        {items.map((h, i) => {
          const d = new Date(h.at);
          const ok = h.result.prediction !== "Diabetes";
          return (
            <li key={i} className="flex items-center gap-3 py-2.5">
              <span
                className={`h-2 w-2 shrink-0 rounded-full ${ok ? "bg-emerald-500" : "bg-red-500"}`}
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">{h.label}</p>
                <p className="text-[11px] text-muted-foreground">
                  {d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} ·{" "}
                  {ok ? "Tidak Diabetes" : "Berpotensi Diabetes"}
                </p>
              </div>
              <span className="text-xs font-semibold tabular-nums text-foreground">
                {Math.round(h.result.confidence * 100)}%
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function Spinner() {
  return (
    <span
      className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent"
      aria-hidden
    />
  );
}

function Index() {
  const [mode, setMode] = useState<Mode>("registered");
  const [selectedModel, setSelectedModel] = useState<string>("rf");
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  function record(label: string, result: PredictResult) {
    setHistory((h) => [{ at: Date.now(), label, result }, ...h].slice(0, 5));
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[oklch(0.97_0.02_240)] to-background">
      <Header />
      <main className="mx-auto max-w-3xl space-y-4 px-4 pb-16 pt-5">
        <section className="rounded-lg border bg-card p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-primary">
            Skrining Risiko Diabetes
          </p>
          <h2 className="mt-1 text-xl font-semibold leading-tight text-foreground sm:text-2xl">
            Cek potensi diabetes pasien secara instan.
          </h2>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Pilih pasien terdaftar atau masukkan data baru. Hasil dianalisis oleh model AI dan
            ditampilkan dengan tingkat kepercayaan.
          </p>
        </section>

        <ModeToggle mode={mode} setMode={setMode} />

        <div className="rounded-lg border bg-card p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-left">
            <p className="text-sm font-semibold text-foreground">Model Inti Klasifikasi AI</p>
            <p className="text-xs text-muted-foreground">Pilih algoritma kecerdasan buatan untuk pengujian skrining</p>
          </div>
          <select 
            value={selectedModel} 
            onChange={(e) => setSelectedModel(e.target.value)}
            className="h-11 rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none focus:border-ring focus:ring-1 cursor-pointer"
          >
            <option value="dt">Decision Tree Classifier</option>
            <option value="rf">Random Forest Classifier (Rekomendasi / Akurasi Tinggi)</option>
            <option value="xgb">Extreme Gradient Boosting (XGBoost)</option>
          </select>
        </div>

        {mode === "registered" ? (
          <RegisteredMode onPredicted={record} selectedModel={selectedModel} />
        ) : (
          <NewPatientMode onPredicted={record} selectedModel={selectedModel} />
        )}

        <HistoryList items={history} />

        <footer className="pt-2 text-center text-[11px] text-muted-foreground">
          © {new Date().getFullYear()} MediCheck.
        </footer>
      </main>
    </div>
  );
}