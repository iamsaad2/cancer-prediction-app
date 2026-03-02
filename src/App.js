import React, { useState, useEffect, useCallback } from "react";

// ── Constants ────────────────────────────────────────────────────────────

const API_BASE =
  process.env.NODE_ENV === "production"
    ? process.env.REACT_APP_API_URL ||
      "https://cancer-predictor-production-ae67.up.railway.app"
    : "https://cancer-predictor-production-ae67.up.railway.app";

const AIM2_SITES = ["bone", "brain", "liver", "lung"];

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
  lnsc: "Lung (Non-Small Cell)",
  lsc: "Lung (Small Cell)",
};

const SITE_DISPLAY_NAMES = {
  bone: "Bone",
  brain: "Brain",
  liver: "Liver",
  lung: "Lung",
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
  mate_other: "Other Site Metastasis",
  mets_bone: "Bone Metastasis",
  mets_brain: "Brain Metastasis",
  mets_liver: "Liver Metastasis",
  mets_lung: "Lung Metastasis",
};

// ── Styles ───────────────────────────────────────────────────────────────

const styles = {
  // Root
  app: {
    minHeight: "100vh",
    background:
      "linear-gradient(165deg, #0a0f1c 0%, #101829 40%, #0d1520 100%)",
    color: "#e2e8f0",
    fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif",
    position: "relative",
    overflow: "hidden",
  },
  gridOverlay: {
    position: "fixed",
    inset: 0,
    backgroundImage:
      "linear-gradient(rgba(56,189,248,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(56,189,248,0.03) 1px, transparent 1px)",
    backgroundSize: "60px 60px",
    pointerEvents: "none",
    zIndex: 0,
  },
  glowOrb1: {
    position: "fixed",
    width: 600,
    height: 600,
    borderRadius: "50%",
    background:
      "radial-gradient(circle, rgba(56,189,248,0.08) 0%, transparent 70%)",
    top: -200,
    right: -200,
    pointerEvents: "none",
    zIndex: 0,
  },
  glowOrb2: {
    position: "fixed",
    width: 500,
    height: 500,
    borderRadius: "50%",
    background:
      "radial-gradient(circle, rgba(99,102,241,0.06) 0%, transparent 70%)",
    bottom: -150,
    left: -150,
    pointerEvents: "none",
    zIndex: 0,
  },
  container: {
    maxWidth: 900,
    margin: "0 auto",
    padding: "40px 24px 80px",
    position: "relative",
    zIndex: 1,
  },

  // Header
  header: {
    textAlign: "center",
    marginBottom: 48,
    paddingTop: 20,
  },
  badge: {
    display: "inline-block",
    padding: "6px 16px",
    borderRadius: 100,
    background: "rgba(56,189,248,0.1)",
    border: "1px solid rgba(56,189,248,0.2)",
    color: "#38bdf8",
    fontSize: 12,
    fontWeight: 600,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    marginBottom: 20,
  },
  title: {
    fontSize: 42,
    fontWeight: 800,
    letterSpacing: "-0.03em",
    lineHeight: 1.1,
    margin: 0,
    background: "linear-gradient(135deg, #f1f5f9 0%, #94a3b8 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },
  subtitle: {
    fontSize: 16,
    color: "#64748b",
    marginTop: 12,
    fontWeight: 400,
    lineHeight: 1.6,
  },

  // Aim Toggle
  aimToggleWrap: {
    display: "flex",
    justifyContent: "center",
    marginBottom: 36,
  },
  aimToggle: {
    display: "flex",
    background: "rgba(15,23,42,0.8)",
    border: "1px solid rgba(148,163,184,0.12)",
    borderRadius: 14,
    padding: 4,
    gap: 4,
  },
  aimBtn: (active) => ({
    padding: "12px 28px",
    borderRadius: 10,
    cursor: "pointer",
    fontSize: 14,
    fontWeight: 600,
    fontFamily: "inherit",
    transition: "all 0.25s ease",
    background: active
      ? "linear-gradient(135deg, rgba(56,189,248,0.15) 0%, rgba(99,102,241,0.15) 100%)"
      : "transparent",
    color: active ? "#e2e8f0" : "#64748b",
    boxShadow: active ? "0 0 20px rgba(56,189,248,0.1)" : "none",
    border: active
      ? "1px solid rgba(56,189,248,0.25)"
      : "1px solid transparent",
  }),

  // Cards
  card: {
    background: "rgba(15,23,42,0.6)",
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
    border: "1px solid rgba(148,163,184,0.1)",
    borderRadius: 20,
    padding: 32,
    marginBottom: 24,
    transition: "border-color 0.3s ease",
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: 700,
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    color: "#64748b",
    marginBottom: 20,
    display: "flex",
    alignItems: "center",
    gap: 10,
  },
  cardTitleDot: (color) => ({
    width: 8,
    height: 8,
    borderRadius: "50%",
    background: color,
    boxShadow: `0 0 10px ${color}40`,
  }),

  // Select / Input
  selectWrap: {
    position: "relative",
  },
  select: {
    width: "100%",
    padding: "14px 18px",
    borderRadius: 12,
    border: "1px solid rgba(148,163,184,0.15)",
    background: "rgba(15,23,42,0.8)",
    color: "#e2e8f0",
    fontSize: 15,
    fontFamily: "inherit",
    fontWeight: 500,
    appearance: "none",
    cursor: "pointer",
    transition: "all 0.2s ease",
    outline: "none",
  },
  selectArrow: {
    position: "absolute",
    right: 16,
    top: "50%",
    transform: "translateY(-50%)",
    pointerEvents: "none",
    color: "#475569",
    fontSize: 12,
  },
  input: {
    width: "100%",
    padding: "14px 18px",
    borderRadius: 12,
    border: "1px solid rgba(148,163,184,0.15)",
    background: "rgba(15,23,42,0.8)",
    color: "#e2e8f0",
    fontSize: 15,
    fontFamily: "inherit",
    fontWeight: 500,
    outline: "none",
    transition: "all 0.2s ease",
    boxSizing: "border-box",
  },
  label: {
    display: "block",
    fontSize: 13,
    fontWeight: 600,
    color: "#94a3b8",
    marginBottom: 8,
    letterSpacing: "0.02em",
  },
  fieldHint: {
    fontSize: 11,
    color: "#475569",
    marginTop: 6,
  },

  // Form grid
  formGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
    gap: 20,
  },
  fieldGroup: {
    display: "flex",
    flexDirection: "column",
  },

  // Button
  submitBtn: (loading) => ({
    width: "100%",
    padding: "16px 24px",
    borderRadius: 14,
    border: "none",
    cursor: loading ? "not-allowed" : "pointer",
    fontSize: 15,
    fontWeight: 700,
    fontFamily: "inherit",
    letterSpacing: "0.02em",
    color: "#fff",
    background: loading
      ? "rgba(56,189,248,0.2)"
      : "linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%)",
    boxShadow: loading ? "none" : "0 4px 24px rgba(56,189,248,0.25)",
    transition: "all 0.3s ease",
    marginTop: 8,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  }),

  // Results
  resultsGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 20,
  },
  resultCard: (color) => ({
    background: `linear-gradient(135deg, ${color}08 0%, ${color}04 100%)`,
    border: `1px solid ${color}20`,
    borderRadius: 16,
    padding: 24,
  }),
  resultModelLabel: (color) => ({
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: color,
    marginBottom: 16,
  }),
  resultRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "10px 0",
    borderBottom: "1px solid rgba(148,163,184,0.06)",
  },
  resultLabel: {
    fontSize: 13,
    color: "#94a3b8",
    fontWeight: 500,
  },
  resultValue: {
    fontSize: 15,
    fontWeight: 700,
    color: "#e2e8f0",
  },
  riskBadge: (level) => ({
    display: "inline-block",
    padding: "6px 16px",
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 800,
    letterSpacing: "0.06em",
    background:
      level === "HIGH" ? "rgba(239,68,68,0.15)" : "rgba(34,197,94,0.15)",
    color: level === "HIGH" ? "#ef4444" : "#22c55e",
    border: `1px solid ${
      level === "HIGH" ? "rgba(239,68,68,0.3)" : "rgba(34,197,94,0.3)"
    }`,
  }),

  // Probability bar
  probBarWrap: {
    marginTop: 16,
    marginBottom: 4,
  },
  probBarBg: {
    height: 6,
    borderRadius: 3,
    background: "rgba(148,163,184,0.1)",
    overflow: "hidden",
  },
  probBarFill: (pct, color) => ({
    height: "100%",
    borderRadius: 3,
    width: `${pct}%`,
    background: `linear-gradient(90deg, ${color}, ${color}cc)`,
    transition: "width 0.8s cubic-bezier(0.16, 1, 0.3, 1)",
  }),
  probBarLabel: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: 11,
    color: "#475569",
    marginTop: 4,
  },

  // Error
  errorBox: {
    background: "rgba(239,68,68,0.08)",
    border: "1px solid rgba(239,68,68,0.2)",
    borderRadius: 14,
    padding: "14px 20px",
    marginBottom: 24,
    color: "#fca5a5",
    fontSize: 14,
    display: "flex",
    alignItems: "center",
    gap: 10,
  },

  // Spinner
  spinner: {
    width: 18,
    height: 18,
    border: "2px solid rgba(255,255,255,0.2)",
    borderTop: "2px solid #fff",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
  },

  // Timestamp
  timestamp: {
    textAlign: "center",
    fontSize: 12,
    color: "#334155",
    marginTop: 16,
  },

  // Responsive
  "@media (max-width: 640px)": {
    resultsGrid: { gridTemplateColumns: "1fr" },
    formGrid: { gridTemplateColumns: "1fr" },
  },

  // Disclaimer
  disclaimer: {
    textAlign: "center",
    fontSize: 11,
    color: "#334155",
    marginTop: 40,
    lineHeight: 1.7,
    padding: "0 40px",
  },
};

// ── Spinner keyframes (injected once) ────────────────────────────────────

const injectKeyframes = () => {
  if (document.getElementById("app-keyframes")) return;
  const style = document.createElement("style");
  style.id = "app-keyframes";
  style.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800&display=swap');
    @keyframes spin { to { transform: rotate(360deg); } }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
    select:focus, input:focus { border-color: rgba(56,189,248,0.4) !important; box-shadow: 0 0 0 3px rgba(56,189,248,0.08) !important; }
    select option { background: #0f172a; color: #e2e8f0; }
    input::placeholder { color: #334155; }
    button:hover:not(:disabled) { transform: translateY(-1px); }
    button:active:not(:disabled) { transform: translateY(0); }
    * { box-sizing: border-box; }
  `;
  document.head.appendChild(style);
};

// ── Field Renderer ───────────────────────────────────────────────────────

const HARDCODED_FIELDS = {
  tnm_n: ["N0", "N1", "N2", "N3"],
  tnm_t: ["T0", "T1", "T2", "T3", "T4"],
  sex: ["male", "female"],
  er_status: ["No", "Yes"],
  pr_status: ["No", "Yes"],
  her2_status: ["No", "Yes"],
  grade: ["Grade 1", "Grade 2", "Grade 3", "Grade 4"],
  gleason: [
    "Grade group 1",
    "Grade group 2",
    "Grade group 3",
    "Grade group 4",
    "Grade group 5",
  ],
  fuhrman_grade: ["1", "2", "3", "4"],
  surgical_factors: ["Yes", "No"],
  surgical_grade: ["1", "2", "3"],
  mate_other: ["No", "Yes"],
  mets_bone: ["No", "Yes"],
  mets_brain: ["No", "Yes"],
  mets_liver: ["No", "Yes"],
  mets_lung: ["No", "Yes"],
};

function FieldInput({ field, description, value, onChange }) {
  const label =
    FIELD_LABELS[field] ||
    field.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  const isNumeric = description && description.includes("(number)");

  // Hardcoded select
  if (HARDCODED_FIELDS[field]) {
    const options = HARDCODED_FIELDS[field];
    return (
      <div style={styles.fieldGroup}>
        <label style={styles.label}>{label}</label>
        <div style={styles.selectWrap}>
          <select
            style={styles.select}
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            required
          >
            <option value="">Select {label}</option>
            {options.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
          <span style={styles.selectArrow}>▼</span>
        </div>
      </div>
    );
  }

  // Numeric
  if (isNumeric) {
    const props = {};
    if (field === "age") {
      props.min = 0;
      props.max = 120;
      props.step = 1;
    } else if (field === "core_ratio") {
      props.min = 0;
      props.max = 1;
      props.step = 0.01;
    } else {
      props.min = 0;
      props.step = 0.1;
    }
    return (
      <div style={styles.fieldGroup}>
        <label style={styles.label}>{label}</label>
        <input
          type="number"
          style={styles.input}
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={`Enter ${label.toLowerCase()}`}
          required
          {...props}
        />
      </div>
    );
  }

  // Fallback: parse options from description
  if (description && typeof description === "string") {
    const match = description.match(/\(([^)]+)\)/);
    if (match) {
      const options = match[1].split(",").map((s) => s.trim());
      return (
        <div style={styles.fieldGroup}>
          <label style={styles.label}>{label}</label>
          <div style={styles.selectWrap}>
            <select
              style={styles.select}
              value={value || ""}
              onChange={(e) => onChange(e.target.value)}
              required
            >
              <option value="">Select {label}</option>
              {options.map((opt, i) => (
                <option key={i} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
            <span style={styles.selectArrow}>▼</span>
          </div>
        </div>
      );
    }
  }

  // Default text
  return (
    <div style={styles.fieldGroup}>
      <label style={styles.label}>{label}</label>
      <input
        type="text"
        style={styles.input}
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={`Enter ${label.toLowerCase()}`}
        required
      />
    </div>
  );
}

// ── Result Card ──────────────────────────────────────────────────────────

function ResultCard({ title, color, data }) {
  const pct = (data.metastasis * 100).toFixed(1);
  return (
    <div style={styles.resultCard(color)}>
      <div style={styles.resultModelLabel(color)}>{title}</div>
      <div style={styles.resultRow}>
        <span style={styles.resultLabel}>Metastasis Probability</span>
        <span style={styles.resultValue}>{pct}%</span>
      </div>
      <div style={styles.resultRow}>
        <span style={styles.resultLabel}>No Metastasis</span>
        <span style={styles.resultValue}>
          {(data.no_metastasis * 100).toFixed(1)}%
        </span>
      </div>
      <div style={styles.probBarWrap}>
        <div style={styles.probBarBg}>
          <div style={styles.probBarFill(pct, color)} />
        </div>
        <div style={styles.probBarLabel}>
          <span>0%</span>
          <span>100%</span>
        </div>
      </div>
      <div
        style={{ ...styles.resultRow, borderBottom: "none", paddingBottom: 0 }}
      >
        <span style={styles.resultLabel}>Risk Level</span>
        <span style={styles.riskBadge(data.risk_level)}>{data.risk_level}</span>
      </div>
    </div>
  );
}

// ── Main App ─────────────────────────────────────────────────────────────

const App = () => {
  const [aim, setAim] = useState(1);
  const [cancerTypes, setCancerTypes] = useState([]);
  const [aim2CancerTypes, setAim2CancerTypes] = useState([]);
  const [selectedCancer, setSelectedCancer] = useState("");
  const [selectedSite, setSelectedSite] = useState("");
  const [requiredInputs, setRequiredInputs] = useState({});
  const [formData, setFormData] = useState({});
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    injectKeyframes();
    fetchCancerTypes();
  }, []);

  const fetchCancerTypes = async () => {
    try {
      const res = await fetch(`${API_BASE}/cancer-types`);
      const data = await res.json();
      setCancerTypes(data.cancer_types || []);

      try {
        const res2 = await fetch(`${API_BASE}/aim2/sites`);
        const data2 = await res2.json();
        setAim2CancerTypes(data2.cancer_types || []);
      } catch {
        // Aim2 endpoint might not exist yet — derive from aim1
        setAim2CancerTypes(
          (data.cancer_types || []).map((t) => t.toLowerCase())
        );
      }
    } catch (err) {
      setError(
        "Failed to connect to prediction API. It may be starting up — try refreshing in 30 seconds."
      );
    }
  };

  const fetchInputs = useCallback(async () => {
    if (!selectedCancer) return;

    try {
      let url;
      if (aim === 1) {
        url = `${API_BASE}/inputs/${selectedCancer}`;
      } else {
        if (!selectedSite) return;
        const cancerKey = selectedCancer.toLowerCase();
        url = `${API_BASE}/aim2/inputs/${cancerKey}/${selectedSite}`;
      }

      const res = await fetch(url);
      const data = await res.json();
      setRequiredInputs(data);
      setFormData({});
      setPrediction(null);
      setError("");
    } catch {
      setError("Failed to fetch input requirements.");
    }
  }, [aim, selectedCancer, selectedSite]);

  useEffect(() => {
    fetchInputs();
  }, [fetchInputs]);

  const handleAimChange = (newAim) => {
    setAim(newAim);
    setSelectedCancer("");
    setSelectedSite("");
    setRequiredInputs({});
    setFormData({});
    setPrediction(null);
    setError("");
  };

  const handleCancerChange = (val) => {
    setSelectedCancer(val);
    setSelectedSite("");
    setRequiredInputs({});
    setFormData({});
    setPrediction(null);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError("");

    try {
      let url;
      if (aim === 1) {
        url = `${API_BASE}/predict/${selectedCancer}`;
      } else {
        const cancerKey = selectedCancer.toLowerCase();
        url = `${API_BASE}/aim2/predict/${cancerKey}/${selectedSite}`;
      }

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setPrediction(data);
      }
    } catch {
      setError("Prediction failed. Please check your inputs and try again.");
    } finally {
      setLoading(false);
    }
  };

  const currentCancerList = aim === 1 ? cancerTypes : aim2CancerTypes;

  const showForm =
    aim === 1
      ? selectedCancer && Object.keys(requiredInputs).length > 0
      : selectedCancer &&
        selectedSite &&
        Object.keys(requiredInputs).length > 0;

  return (
    <div style={styles.app}>
      <div style={styles.gridOverlay} />
      <div style={styles.glowOrb1} />
      <div style={styles.glowOrb2} />

      <div style={styles.container}>
        {/* Header */}
        <header style={styles.header}>
          <div style={styles.badge}>Clinical Decision Support</div>
          <h1 style={styles.title}>
            Cancer Metastasis
            <br />
            Risk Prediction
          </h1>
          <p style={styles.subtitle}>
            Machine learning–powered risk assessment using logistic regression
            and random forest models
          </p>
        </header>

        {/* Aim Toggle */}
        <div style={styles.aimToggleWrap}>
          <div style={styles.aimToggle}>
            <button
              style={styles.aimBtn(aim === 1)}
              onClick={() => handleAimChange(1)}
            >
              Any Metastasis
            </button>
            <button
              style={styles.aimBtn(aim === 2)}
              onClick={() => handleAimChange(2)}
            >
              Site-Specific
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div style={styles.errorBox}>
            <span style={{ fontSize: 18 }}>⚠</span>
            {error}
          </div>
        )}

        {/* Cancer Type Selection */}
        <div style={styles.card}>
          <div style={styles.cardTitle}>
            <span style={styles.cardTitleDot("#38bdf8")} />
            {aim === 1
              ? "Select Cancer Type"
              : "Select Cancer Type & Target Site"}
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: aim === 2 ? "1fr 1fr" : "1fr",
              gap: 16,
            }}
          >
            <div style={styles.selectWrap}>
              <select
                style={styles.select}
                value={selectedCancer}
                onChange={(e) => handleCancerChange(e.target.value)}
              >
                <option value="">Choose cancer type…</option>
                {currentCancerList.map((type) => (
                  <option key={type} value={type}>
                    {CANCER_DISPLAY_NAMES[type] || type}
                  </option>
                ))}
              </select>
              <span style={styles.selectArrow}>▼</span>
            </div>

            {aim === 2 && (
              <div style={styles.selectWrap}>
                <select
                  style={styles.select}
                  value={selectedSite}
                  onChange={(e) => {
                    setSelectedSite(e.target.value);
                    setFormData({});
                    setPrediction(null);
                  }}
                  disabled={!selectedCancer}
                >
                  <option value="">Choose target site…</option>
                  {AIM2_SITES.map((site) => (
                    <option key={site} value={site}>
                      {SITE_DISPLAY_NAMES[site]}
                    </option>
                  ))}
                </select>
                <span style={styles.selectArrow}>▼</span>
              </div>
            )}
          </div>
        </div>

        {/* Patient Form */}
        {showForm && (
          <div style={{ ...styles.card, animation: "fadeIn 0.4s ease" }}>
            <div style={styles.cardTitle}>
              <span style={styles.cardTitleDot("#a78bfa")} />
              Patient Information
            </div>

            <div style={styles.formGrid}>
              {Object.entries(requiredInputs).map(([field, desc]) => (
                <FieldInput
                  key={field}
                  field={field}
                  description={desc}
                  value={formData[field]}
                  onChange={(val) =>
                    setFormData((prev) => ({ ...prev, [field]: val }))
                  }
                />
              ))}
            </div>

            <button
              style={styles.submitBtn(loading)}
              disabled={loading}
              onClick={handleSubmit}
            >
              {loading && <div style={styles.spinner} />}
              {loading ? "Running prediction…" : "Predict Metastasis Risk"}
            </button>
          </div>
        )}

        {/* Results */}
        {prediction && (
          <div style={{ ...styles.card, animation: "fadeIn 0.5s ease" }}>
            <div style={styles.cardTitle}>
              <span style={styles.cardTitleDot("#22c55e")} />
              Prediction Results
              {aim === 2 && prediction.target_site && (
                <span
                  style={{
                    fontWeight: 400,
                    textTransform: "none",
                    letterSpacing: 0,
                    marginLeft: 8,
                    color: "#64748b",
                  }}
                >
                  — {SITE_DISPLAY_NAMES[prediction.target_site]} metastasis
                </span>
              )}
            </div>

            <div
              style={{
                ...styles.resultsGrid,
                ...(window.innerWidth < 640 ||
                !prediction.predictions.logistic_regression
                  ? { gridTemplateColumns: "1fr" }
                  : {}),
              }}
            >
              {prediction.predictions.logistic_regression && (
                <ResultCard
                  title="Logistic Regression"
                  color="#38bdf8"
                  data={prediction.predictions.logistic_regression}
                />
              )}
              <ResultCard
                title="Random Forest"
                color="#a78bfa"
                data={prediction.predictions.random_forest}
              />
            </div>

            <div style={styles.timestamp}>
              Prediction generated at{" "}
              {new Date(prediction.timestamp).toLocaleString()}
            </div>
          </div>
        )}

        {/* Disclaimer */}
        <p style={styles.disclaimer}>
          This tool is intended for research and educational purposes only. It
          should not replace clinical judgment or be used as the sole basis for
          medical decisions. Always consult with qualified healthcare
          professionals for patient care.
        </p>
      </div>
    </div>
  );
};

export default App;
