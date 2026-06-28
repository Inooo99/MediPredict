import type { PredictResult } from "../lib/predict";

export function ResultCard({ result }: { result: PredictResult }) {
  const isDiabetes = result.prediction === "Diabetes";
  const pct = Math.round(result.confidence * 100);

  return (
    <div
      className="animate-in fade-in slide-in-from-bottom-2 duration-500 rounded-2xl border bg-card p-5 shadow-sm"
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center gap-3">
        <span
          className={`inline-flex h-10 w-10 items-center justify-center rounded-full text-lg ${
            isDiabetes
              ? "bg-red-100 text-red-600"
              : "bg-emerald-100 text-emerald-600"
          }`}
          aria-hidden
        >
          {isDiabetes ? "⚠" : "✓"}
        </span>
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Hasil Skrining AI
          </p>
          <p
            className={`text-lg font-semibold leading-tight ${
              isDiabetes ? "text-red-600" : "text-emerald-600"
            }`}
          >
            {isDiabetes ? "Berpotensi Diabetes" : "Tidak Diabetes"}
          </p>
        </div>
        <div className="ml-auto text-right">
          <p className="text-xs text-muted-foreground">Confidence</p>
          <p className="text-xl font-bold tabular-nums text-foreground">{pct}%</p>
        </div>
      </div>

      <div className="mt-4">
        <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
          <div
            className={`h-full rounded-full transition-all duration-700 ${
              isDiabetes ? "bg-red-500" : "bg-emerald-500"
            }`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
        {isDiabetes
          ? "Indikator menunjukkan risiko diabetes yang signifikan. Disarankan pemeriksaan lanjutan (HbA1c, glukosa puasa) dan konsultasi dengan dokter."
          : "Indikator menunjukkan risiko rendah saat ini. Tetap jaga pola makan, aktivitas fisik, dan lakukan kontrol rutin."}
      </p>
    </div>
  );
}
