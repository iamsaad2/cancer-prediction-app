import React, { useState, useEffect, useCallback, useRef } from "react";

// ── Constants ────────────────────────────────────────────────────────────

const API_BASE =
  process.env.NODE_ENV === "production"
    ? process.env.REACT_APP_API_URL ||
      "https://cancer-predictor-production-ae67.up.railway.app"
    : "https://cancer-predictor-production-ae67.up.railway.app";

const CANCER_DISPLAY_NAMES = {
  breast: "Breast",
  prostate: "Prostate",
  colon: "Colon",
  rectum: "Rectum",
  urine: "Urinary / Bladder",
  esophagu: "Esophageal",
  melanoma: "Melanoma",
  liver: "Liver",
  kidney: "Kidney",
  ovary: "Ovary",
  retroper: "Retroperitoneal",
  testis: "Testicular",
  LNSC: "Lung (Non-Small Cell)",
  LSC: "Lung (Small Cell)",
};

// Estimated prediction times in seconds based on model sizes
// Calibrated from: colon 308MB=21s, breast 122MB(rds)=9s, prostate 935MB=42s
const ESTIMATED_TIMES = {
  breast: 10,
  prostate: 45,
  colon: 21,
  rectum: 8,
  urine: 11,
  esophagu: 6,
  melanoma: 11,
  liver: 7,
  kidney: 13,
  ovary: 6,
  retroper: 4,
  testis: 5,
  LNSC: 24,
  LSC: 7,
};

const FIELD_LABELS = {
  age: "Age",
  tnm_n: "Lymph Node Stage (N)",
  tnm_t: "Tumor Stage (T)",
  sex: "Sex",
  er_status: "ER Status",
  pr_status: "PR Status",
  her2_status: "HER2 Status",
  grade: "Grade",
  psa: "PSA Level",
  core_ratio: "Core Ratio",
  gleason: "Gleason Score",
  cea: "CEA Level",
  cea_status: "CEA Status",
  afp_status: "AFP Status",
  fibrosis_score: "Fibrosis Score",
  surgical_factors: "Sarcomatoid Features",
  fuhrman_grade: "Fuhrman Grade",
  ca125_status: "CA-125 Status",
  surgical_grade: "Surgical Grade",
  hcg_status: "HCG Status",
  ldh_status: "LDH Status",
};

// ── Correct input options from R code ────────────────────────────────────

const FIELD_OPTIONS = {
  // Shared fields
  tnm_n: ["N0", "N1", "N2", "N3"],
  tnm_t: ["T0", "T1", "T2", "T3", "T4"],
  sex: ["male", "female"],

  // Breast
  er_status: ["No", "Yes"],
  pr_status: ["No", "Yes"],
  her2_status: ["No", "Yes"],
  grade: ["Grade 1", "Grade 2", "Grade 3", "Grade 4"],

  // Prostate
  gleason: ["Grade group 1", "Grade group 2", "Grade group 3", "Grade group 4", "Grade group 5"],

  // Rectum
  cea_status: ["Negative/normal; within normal limits", "Positive/elevated"],

  // Liver
  afp_status_liver: ["Negative/normal", "Positive/elevated"],
  fibrosis_score: ["Fibrosis score 0-4", "Fibrosis score 5-6"],

  // Kidney
  surgical_factors: ["Yes", "No"],
  fuhrman_grade: ["1", "2", "3", "4"],

  // Ovary
  ca125_status: ["Negative/normal; within normal limits", "Positive/elevated"],

  // Retroperitoneal
  surgical_grade: ["1", "2", "3"],

  // Testis
  afp_status_testis: ["Within normal limits", "Elevated"],
  hcg_status: ["Within normal limits", "Elevated"],
  ldh_status: ["Within normal limits", "Elevated"],
};

// Which cancer types need which fields, with correct option keys
const CANCER_FIELDS = {
  breast: [
    { key: "age", type: "number", min: 0, max: 120, step: 1 },
    { key: "tnm_n", type: "select", options: "tnm_n" },
    { key: "tnm_t", type: "select", options: "tnm_t" },
    { key: "er_status", type: "select", options: "er_status" },
    { key: "pr_status", type: "select", options: "pr_status" },
    { key: "her2_status", type: "select", options: "her2_status" },
    { key: "grade", type: "select", options: "grade" },
  ],
  prostate: [
    { key: "age", type: "number", min: 0, max: 120, step: 1 },
    { key: "tnm_n", type: "select", options: "tnm_n" },
    { key: "tnm_t", type: "select", options: "tnm_t" },
    { key: "psa", type: "number", min: 0, step: 0.1 },
    { key: "core_ratio", type: "number", min: 0, max: 1, step: 0.01 },
    { key: "gleason", type: "select", options: "gleason" },
  ],
  colon: [
    { key: "age", type: "number", min: 0, max: 120, step: 1 },
    { key: "sex", type: "select", options: "sex" },
    { key: "tnm_n", type: "select", options: "tnm_n" },
    { key: "tnm_t", type: "select", options: "tnm_t" },
    { key: "cea", type: "number", min: 0, step: 0.1 },
  ],
  rectum: [
    { key: "age", type: "number", min: 0, max: 120, step: 1 },
    { key: "sex", type: "select", options: "sex" },
    { key: "tnm_n", type: "select", options: "tnm_n" },
    { key: "tnm_t", type: "select", options: "tnm_t" },
    { key: "cea_status", type: "select", options: "cea_status" },
  ],
  urine: [
    { key: "age", type: "number", min: 0, max: 120, step: 1 },
    { key: "sex", type: "select", options: "sex" },
    { key: "tnm_n", type: "select", options: "tnm_n" },
    { key: "tnm_t", type: "select", options: "tnm_t" },
  ],
  esophagu: [
    { key: "age", type: "number", min: 0, max: 120, step: 1 },
    { key: "sex", type: "select", options: "sex" },
    { key: "tnm_n", type: "select", options: "tnm_n" },
    { key: "tnm_t", type: "select", options: "tnm_t" },
  ],
  melanoma: [
    { key: "age", type: "number", min: 0, max: 120, step: 1 },
    { key: "sex", type: "select", options: "sex" },
    { key: "tnm_n", type: "select", options: "tnm_n" },
    { key: "tnm_t", type: "select", options: "tnm_t" },
  ],
  liver: [
    { key: "age", type: "number", min: 0, max: 120, step: 1 },
    { key: "sex", type: "select", options: "sex" },
    { key: "tnm_n", type: "select", options: "tnm_n" },
    { key: "tnm_t", type: "select", options: "tnm_t" },
    { key: "afp_status", type: "select", options: "afp_status_liver" },
    { key: "fibrosis_score", type: "select", options: "fibrosis_score" },
  ],
  kidney: [
    { key: "age", type: "number", min: 0, max: 120, step: 1 },
    { key: "sex", type: "select", options: "sex" },
    { key: "tnm_n", type: "select", options: "tnm_n" },
    { key: "tnm_t", type: "select", options: "tnm_t" },
    { key: "surgical_factors", type: "select", options: "surgical_factors" },
    { key: "fuhrman_grade", type: "select", options: "fuhrman_grade" },
  ],
  ovary: [
    { key: "age", type: "number", min: 0, max: 120, step: 1 },
    { key: "tnm_n", type: "select", options: "tnm_n" },
    { key: "tnm_t", type: "select", options: "tnm_t" },
    { key: "ca125_status", type: "select", options: "ca125_status" },
  ],
  retroper: [
    { key: "age", type: "number", min: 0, max: 120, step: 1 },
    { key: "sex", type: "select", options: "sex" },
    { key: "tnm_n", type: "select", options: "tnm_n" },
    { key: "tnm_t", type: "select", options: "tnm_t" },
    { key: "surgical_grade", type: "select", options: "surgical_grade" },
  ],
  testis: [
    { key: "age", type: "number", min: 0, max: 120, step: 1 },
    { key: "tnm_n", type: "select", options: "tnm_n" },
    { key: "tnm_t", type: "select", options: "tnm_t" },
    { key: "afp_status", type: "select", options: "afp_status_testis" },
    { key: "hcg_status", type: "select", options: "hcg_status" },
    { key: "ldh_status", type: "select", options: "ldh_status" },
  ],
  LNSC: [
    { key: "age", type: "number", min: 0, max: 120, step: 1 },
    { key: "sex", type: "select", options: "sex" },
    { key: "tnm_n", type: "select", options: "tnm_n" },
    { key: "tnm_t", type: "select", options: "tnm_t" },
  ],
  LSC: [
    { key: "age", type: "number", min: 0, max: 120, step: 1 },
    { key: "sex", type: "select", options: "sex" },
    { key: "tnm_n", type: "select", options: "tnm_n" },
    { key: "tnm_t", type: "select", options: "tnm_t" },
  ],
};

// ── Inject fonts + keyframes ─────────────────────────────────────────────

const injectStyles = () => {
  if (document.getElementById("app-styles")) return;
  const style = document.createElement("style");
  style.id = "app-styles";
  style.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Source+Serif+4:ital,opsz,wght@0,8..60,300;0,8..60,400;0,8..60,500;0,8..60,600;0,8..60,700&family=Outfit:wght@300;400;500;600;700&display=swap');

    @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes spin { to { transform: rotate(360deg); } }
    @keyframes barFill { from { width: 0%; } }
    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
    @keyframes timerRing {
      0% { stroke-dashoffset: 251.2; }
      100% { stroke-dashoffset: 0; }
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }

    select:focus, input:focus {
      border-color: #1a6b4f !important;
      box-shadow: 0 0 0 3px rgba(26,107,79,0.08) !important;
      outline: none;
    }
    select option { background: #fff; color: #1a1a1a; }
    input::placeholder { color: #a0a0a0; }

    button:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 6px 24px rgba(26,107,79,0.2) !important; }
    button:active:not(:disabled) { transform: translateY(0); }

    html { scroll-behavior: smooth; }
  `;
  document.head.appendChild(style);
};

// ── Timer Loader Component ───────────────────────────────────────────────

function PredictionTimer({ estimatedSeconds }) {
  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef(null);

  useEffect(() => {
    setElapsed(0);
    intervalRef.current = setInterval(() => {
      setElapsed((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [estimatedSeconds]);

  const progress = Math.min(elapsed / estimatedSeconds, 0.95);
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - progress);

  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return m > 0 ? `${m}:${sec.toString().padStart(2, "0")}` : `${sec}s`;
  };

  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      padding: "40px 20px", gap: 20,
    }}>
      <div style={{ position: "relative", width: 96, height: 96 }}>
        <svg width="96" height="96" viewBox="0 0 96 96" style={{ transform: "rotate(-90deg)" }}>
          <circle cx="48" cy="48" r={radius} fill="none" stroke="#e8efe8" strokeWidth="6" />
          <circle
            cx="48" cy="48" r={radius} fill="none"
            stroke="#1a6b4f" strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            style={{ transition: "stroke-dashoffset 1s linear" }}
          />
        </svg>
        <div style={{
          position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 20, fontWeight: 700, color: "#1a6b4f", fontFamily: "'Outfit', sans-serif",
        }}>
          {formatTime(elapsed)}
        </div>
      </div>
      <div style={{ textAlign: "center" }}>
        <div style={{
          fontSize: 14, fontWeight: 600, color: "#1a1a1a", fontFamily: "'Outfit', sans-serif",
          marginBottom: 4,
        }}>
          Running prediction model
        </div>
        <div style={{
          fontSize: 12, color: "#888", fontFamily: "'Outfit', sans-serif",
        }}>
          Estimated time: ~{estimatedSeconds}s
        </div>
      </div>
    </div>
  );
}

// ── Field Input Component ────────────────────────────────────────────────

function FieldInput({ field, fieldDef, value, onChange }) {
  const label = FIELD_LABELS[field.key] || field.key.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());

  const selectStyle = {
    width: "100%", padding: "13px 16px", borderRadius: 10,
    border: "1.5px solid #ddd", background: "#fff", color: "#1a1a1a",
    fontSize: 15, fontFamily: "'Outfit', sans-serif", fontWeight: 400,
    appearance: "none", cursor: "pointer", transition: "all 0.2s ease",
  };
  const inputStyle = { ...selectStyle, cursor: "text", boxSizing: "border-box" };
  const labelStyle = {
    display: "block", fontSize: 13, fontWeight: 600, color: "#444",
    marginBottom: 6, fontFamily: "'Outfit', sans-serif", letterSpacing: "0.01em",
  };

  if (field.type === "select") {
    const options = FIELD_OPTIONS[field.options] || [];
    return (
      <div>
        <label style={labelStyle}>{label}</label>
        <div style={{ position: "relative" }}>
          <select style={selectStyle} value={value || ""} onChange={(e) => onChange(e.target.value)} required>
            <option value="">Select {label}</option>
            {options.map((opt) => (<option key={opt} value={opt}>{opt}</option>))}
          </select>
          <span style={{
            position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)",
            pointerEvents: "none", color: "#999", fontSize: 11,
          }}>▼</span>
        </div>
      </div>
    );
  }

  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <input
        type="number" style={inputStyle} value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={`Enter ${label.toLowerCase()}`} required
        min={field.min} max={field.max} step={field.step}
      />
    </div>
  );
}

// ── Result Card ──────────────────────────────────────────────────────────

function ResultCard({ title, accent, data }) {
  const pct = (data.metastasis * 100).toFixed(1);
  const isHigh = data.risk_level === "HIGH";

  return (
    <div style={{
      background: "#fff", border: "1.5px solid #e8e8e8", borderRadius: 16,
      padding: 28, boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
    }}>
      <div style={{
        fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase",
        color: accent, marginBottom: 20, fontFamily: "'Outfit', sans-serif",
      }}>{title}</div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
        <span style={{ fontSize: 13, color: "#666", fontFamily: "'Outfit', sans-serif" }}>Metastasis Probability</span>
        <span style={{ fontSize: 28, fontWeight: 700, color: "#1a1a1a", fontFamily: "'Source Serif 4', serif" }}>{pct}%</span>
      </div>

      <div style={{ height: 8, borderRadius: 4, background: "#f0f0f0", overflow: "hidden", marginBottom: 20 }}>
        <div style={{
          height: "100%", borderRadius: 4, width: `${pct}%`,
          background: isHigh ? "linear-gradient(90deg, #e74c3c, #c0392b)" : "linear-gradient(90deg, #1a6b4f, #2ecc71)",
          transition: "width 1s cubic-bezier(0.16, 1, 0.3, 1)",
          animation: "barFill 1s cubic-bezier(0.16, 1, 0.3, 1)",
        }} />
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderTop: "1px solid #f0f0f0" }}>
        <span style={{ fontSize: 13, color: "#666", fontFamily: "'Outfit', sans-serif" }}>No Metastasis</span>
        <span style={{ fontSize: 15, fontWeight: 600, color: "#1a1a1a", fontFamily: "'Outfit', sans-serif" }}>{(data.no_metastasis * 100).toFixed(1)}%</span>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderTop: "1px solid #f0f0f0" }}>
        <span style={{ fontSize: 13, color: "#666", fontFamily: "'Outfit', sans-serif" }}>Risk Level</span>
        <span style={{
          display: "inline-block", padding: "5px 14px", borderRadius: 6, fontSize: 12, fontWeight: 700,
          fontFamily: "'Outfit', sans-serif", letterSpacing: "0.05em",
          background: isHigh ? "#fdf0f0" : "#edf9f4",
          color: isHigh ? "#c0392b" : "#1a6b4f",
          border: `1px solid ${isHigh ? "#f5c6c6" : "#b8e6d0"}`,
        }}>{data.risk_level}</span>
      </div>
    </div>
  );
}

// ── Main App ─────────────────────────────────────────────────────────────

const App = () => {
  const [cancerTypes, setCancerTypes] = useState([]);
  const [selectedCancer, setSelectedCancer] = useState("");
  const [formData, setFormData] = useState({});
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const resultsRef = useRef(null);

  useEffect(() => { injectStyles(); fetchCancerTypes(); }, []);

  const fetchCancerTypes = async () => {
    try {
      const res = await fetch(`${API_BASE}/cancer-types`);
      const data = await res.json();
      setCancerTypes(data.cancer_types || []);
    } catch {
      setError("Failed to connect to prediction API. It may be starting up — try refreshing in 30 seconds.");
    }
  };

  const handleCancerChange = (val) => {
    setSelectedCancer(val);
    setFormData({});
    setPrediction(null);
    setError("");
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError("");
    setPrediction(null);

    // Scroll to loading area
    setTimeout(() => {
      resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 100);

    try {
      const res = await fetch(`${API_BASE}/predict/${selectedCancer}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.error) setError(data.error);
      else setPrediction(data);
    } catch {
      setError("Prediction failed. Please check your inputs and try again.");
    } finally {
      setLoading(false);
    }
  };

  const fields = CANCER_FIELDS[selectedCancer] || [];
  const hasLogistic = prediction && prediction.predictions && prediction.predictions.logistic_regression;
  const estTime = ESTIMATED_TIMES[selectedCancer] || 15;

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(180deg, #f7f9f8 0%, #eef2f0 100%)",
      fontFamily: "'Outfit', sans-serif",
      color: "#1a1a1a",
    }}>
      {/* Top accent bar */}
      <div style={{ height: 4, background: "linear-gradient(90deg, #1a6b4f, #2ecc71, #1a6b4f)" }} />

      <div style={{ maxWidth: 860, margin: "0 auto", padding: "48px 24px 80px" }}>

        {/* Header */}
        <header style={{ marginBottom: 40 }}>
          <h1 style={{
            fontSize: 38, fontWeight: 700, color: "#1a1a1a",
            fontFamily: "'Source Serif 4', serif", lineHeight: 1.2,
            letterSpacing: "-0.02em", marginBottom: 10,
          }}>
            Cancer Metastasis<br />Risk Prediction
          </h1>
          <p style={{ fontSize: 16, color: "#777", fontWeight: 400, lineHeight: 1.6 }}>
            Enter patient information below to estimate metastasis risk.
          </p>
        </header>

        {/* Error */}
        {error && (
          <div style={{
            background: "#fdf5f5", border: "1px solid #f0c4c4", borderRadius: 12,
            padding: "14px 18px", marginBottom: 24, color: "#b33a3a", fontSize: 14,
            display: "flex", alignItems: "center", gap: 10,
          }}>
            <span>⚠</span> {error}
          </div>
        )}

        {/* ── Single Card: Cancer Type + Inputs + Button ── */}
        <div style={{
          background: "#fff", border: "1.5px solid #e8e8e8", borderRadius: 16,
          padding: 32, marginBottom: 24, boxShadow: "0 2px 12px rgba(0,0,0,0.03)",
        }}>
          {/* Cancer Type */}
          <div style={{
            fontSize: 13, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase",
            color: "#999", marginBottom: 18, display: "flex", alignItems: "center", gap: 8,
          }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#1a6b4f" }} />
            Cancer Type
          </div>
          <div style={{ position: "relative", marginBottom: selectedCancer ? 28 : 0 }}>
            <select
              style={{
                width: "100%", padding: "14px 16px", borderRadius: 10,
                border: "1.5px solid #ddd", background: "#fff", color: "#1a1a1a",
                fontSize: 15, fontFamily: "'Outfit', sans-serif", fontWeight: 500,
                appearance: "none", cursor: "pointer", transition: "all 0.2s ease",
              }}
              value={selectedCancer}
              onChange={(e) => handleCancerChange(e.target.value)}
            >
              <option value="">Choose a cancer type…</option>
              {cancerTypes.map((type) => (
                <option key={type} value={type}>{CANCER_DISPLAY_NAMES[type] || type}</option>
              ))}
            </select>
            <span style={{
              position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)",
              pointerEvents: "none", color: "#999", fontSize: 11,
            }}>▼</span>
          </div>

          {/* Patient Inputs */}
          {selectedCancer && fields.length > 0 && (
            <>
              <div style={{
                height: 1, background: "#f0f0f0", marginBottom: 24,
              }} />
              <div style={{
                fontSize: 13, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase",
                color: "#999", marginBottom: 18, display: "flex", alignItems: "center", gap: 8,
              }}>
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#d4a843" }} />
                Patient Information
              </div>

              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
                gap: 18,
              }}>
                {fields.map((f) => (
                  <FieldInput
                    key={f.key}
                    field={f}
                    value={formData[f.key]}
                    onChange={(val) => setFormData((prev) => ({ ...prev, [f.key]: val }))}
                  />
                ))}
              </div>

              <button
                style={{
                  width: "100%", padding: "15px 24px", borderRadius: 12, border: "none",
                  cursor: loading ? "not-allowed" : "pointer", fontSize: 15, fontWeight: 600,
                  fontFamily: "'Outfit', sans-serif", color: "#fff",
                  background: loading ? "#a0c4b8" : "linear-gradient(135deg, #1a6b4f 0%, #238c65 100%)",
                  boxShadow: loading ? "none" : "0 4px 16px rgba(26,107,79,0.15)",
                  transition: "all 0.3s ease", marginTop: 24,
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                }}
                disabled={loading}
                onClick={handleSubmit}
              >
                {loading && <div style={{
                  width: 16, height: 16, border: "2px solid rgba(255,255,255,0.3)",
                  borderTop: "2px solid #fff", borderRadius: "50%", animation: "spin 0.8s linear infinite",
                }} />}
                {loading ? "Running prediction…" : "Predict Metastasis Risk"}
              </button>
            </>
          )}
        </div>

        {/* ── Loading Timer ── */}
        <div ref={resultsRef}>
          {loading && (
            <div style={{
              background: "#fff", border: "1.5px solid #e8e8e8", borderRadius: 16,
              marginBottom: 24, boxShadow: "0 2px 12px rgba(0,0,0,0.03)",
              animation: "fadeUp 0.4s ease",
            }}>
              <PredictionTimer estimatedSeconds={estTime} />
            </div>
          )}

          {/* ── Results ── */}
          {prediction && !loading && (
            <div style={{
              background: "#fff", border: "1.5px solid #e8e8e8", borderRadius: 16,
              padding: 32, marginBottom: 24, boxShadow: "0 2px 12px rgba(0,0,0,0.03)",
              animation: "fadeUp 0.5s ease",
            }}>
              <div style={{
                fontSize: 13, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase",
                color: "#999", marginBottom: 18, display: "flex", alignItems: "center", gap: 8,
              }}>
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#1a6b4f" }} />
                Prediction Results
              </div>

              <div style={{
                display: "grid",
                gridTemplateColumns: hasLogistic ? "1fr 1fr" : "1fr",
                gap: 20,
              }}>
                {hasLogistic && (
                  <ResultCard title="Logistic Regression" accent="#2980b9" data={prediction.predictions.logistic_regression} />
                )}
                <ResultCard title="Random Forest" accent="#1a6b4f" data={prediction.predictions.random_forest} />
              </div>

              <div style={{
                textAlign: "center", fontSize: 12, color: "#bbb", marginTop: 16,
                fontFamily: "'Outfit', sans-serif",
              }}>
                Prediction generated at {new Date().toLocaleString()}
              </div>
            </div>
          )}
        </div>

        {/* Disclaimer */}
        <p style={{
          textAlign: "center", fontSize: 12, color: "#aaa", marginTop: 40,
          lineHeight: 1.7, padding: "0 40px", fontFamily: "'Outfit', sans-serif",
        }}>
          This tool is intended for research and educational purposes only.
          It should not replace clinical judgment or be used as the sole basis for medical decisions.
          Always consult with qualified healthcare professionals for patient care.
        </p>
      </div>
    </div>
  );
};

export default App;
