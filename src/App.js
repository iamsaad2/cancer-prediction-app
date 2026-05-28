import React, { useState, useEffect, useRef } from "react";

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
  mets_bone: "Bone Metastasis",
  mets_brain: "Brain Metastasis",
  mets_liver: "Liver Metastasis",
  mets_lung: "Lung Metastasis",
  mets_other: "Other Metastasis",
};

const SITE_LABELS = {
  bone:  "Bone",
  brain: "Brain",
  liver: "Liver",
  lung:  "Lung",
};

// Options match each model's actual training factor levels (see backend xlevels).
const FIELD_OPTIONS = {
  // TNM N: most cancers have full N0-N3, a few subsets.
  tnm_n: ["N0", "N1", "N2", "N3", "Other/Unknown"],
  tnm_n_n01: ["N0", "N1", "Other/Unknown"],            // ovary, prostate, liver, retroper
  tnm_n_n012: ["N0", "N1", "N2", "Other/Unknown"],     // rectum, colon

  // TNM T: ovary has no T4.
  tnm_t: ["T0", "T1", "T2", "T3", "T4", "Other/Unknown"],
  tnm_t_no_t4: ["T0", "T1", "T2", "T3", "Other/Unknown"],

  sex: ["male", "female"],

  // Breast
  er_status: ["No", "Yes", "Other/Unknown"],
  pr_status: ["No", "Yes", "Other/Unknown"],
  her2_status: ["No", "Yes", "Other/Unknown"],
  grade: ["Grade 1", "Grade 2", "Grade 3", "Grade 4", "Other/Unknown"],

  // Prostate
  gleason: [
    "Grade group 1",
    "Grade group 2",
    "Grade group 3",
    "Grade group 4",
    "Grade group 5",
    "Other/Unknown",
  ],

  // Rectum
  cea_status: [
    "Negative/normal; within normal limits",
    "Positive/elevated",
    "Other/Unknown",
  ],

  // Liver
  afp_status_liver: ["Negative/normal", "Positive/elevated", "Other/Unknown"],
  fibrosis_score: ["Fibrosis score 0-4", "Fibrosis score 5-6", "Other/Unknown"],

  // Kidney — model only knows "Yes" / "Other/Unknown" for sarcomatoid features.
  surgical_factors: ["Yes", "Other/Unknown"],
  fuhrman_grade: ["1", "2", "3", "4", "Other/Unknown"],

  // Ovary
  ca125_status: [
    "Negative/normal; within normal limits",
    "Positive/elevated",
    "Other/Unknown",
  ],

  // Retroperitoneal
  surgical_grade: ["1", "2", "3", "Other/Unknown"],

  // Testis — model expects clinically meaningful ranges, not binary.
  afp_status_testis: [
    "Within normal limits",
    "Above normal; < 1,000 ng/ml",
    "1,000 -10,000 ng/ml",
    ">10,000 ng/ml",
    "Other/Unknown",
  ],
  hcg_status: [
    "Within normal limits",
    "Above normal; < 5,000 mIU/ml",
    "5,000 -50,000 mIU/ml",
    ">50,000 mIU/ml",
    "Other/Unknown",
  ],
  ldh_status: [
    "Within normal limits",
    "< 1.5 x upper normal limit (N)",
    "1.5 - 10 x N",
    "> 10 x N",
    "Other/Unknown",
  ],

  // Aim 2 mets fields — backend only accepts Yes/No
  mets_yn: ["No", "Yes"],
};

// Aim 2 — applied on top of CANCER_FIELDS for each cancer. Backend requires all 5.
const METS_FIELDS = [
  { key: "mets_bone",  type: "select", options: "mets_yn" },
  { key: "mets_brain", type: "select", options: "mets_yn" },
  { key: "mets_liver", type: "select", options: "mets_yn" },
  { key: "mets_lung",  type: "select", options: "mets_yn" },
  { key: "mets_other", type: "select", options: "mets_yn" },
];

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
    { key: "tnm_n", type: "select", options: "tnm_n_n01" },
    { key: "tnm_t", type: "select", options: "tnm_t" },
    { key: "psa", type: "number", min: 0, step: 0.1 },
    { key: "core_ratio", type: "number", min: 0, max: 1, step: 0.01 },
    { key: "gleason", type: "select", options: "gleason" },
  ],
  colon: [
    { key: "age", type: "number", min: 0, max: 120, step: 1 },
    { key: "sex", type: "select", options: "sex" },
    { key: "tnm_n", type: "select", options: "tnm_n_n012" },
    { key: "tnm_t", type: "select", options: "tnm_t" },
    { key: "cea", type: "number", min: 0, step: 0.1 },
  ],
  rectum: [
    { key: "age", type: "number", min: 0, max: 120, step: 1 },
    { key: "sex", type: "select", options: "sex" },
    { key: "tnm_n", type: "select", options: "tnm_n_n012" },
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
    { key: "tnm_n", type: "select", options: "tnm_n_n01" },
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
    { key: "tnm_n", type: "select", options: "tnm_n_n01" },
    { key: "tnm_t", type: "select", options: "tnm_t_no_t4" },
    { key: "ca125_status", type: "select", options: "ca125_status" },
  ],
  retroper: [
    { key: "age", type: "number", min: 0, max: 120, step: 1 },
    { key: "sex", type: "select", options: "sex" },
    { key: "tnm_n", type: "select", options: "tnm_n_n01" },
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

// ── Loading Indicator ────────────────────────────────────────────────────

function PredictionLoading() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "32px 20px",
        gap: 14,
      }}
    >
      <div
        style={{
          width: 28,
          height: 28,
          border: "3px solid #e8efe8",
          borderTop: "3px solid #1a6b4f",
          borderRadius: "50%",
          animation: "spin 0.8s linear infinite",
        }}
      />
      <div
        style={{
          fontSize: 14,
          fontWeight: 600,
          color: "#1a1a1a",
          fontFamily: "'Outfit', sans-serif",
        }}
      >
        Computing prediction…
      </div>
    </div>
  );
}

// ── Field Input Component ────────────────────────────────────────────────

function FieldInput({ field, fieldDef, value, onChange }) {
  const label =
    FIELD_LABELS[field.key] ||
    field.key.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());

  const selectStyle = {
    width: "100%",
    padding: "13px 16px",
    borderRadius: 10,
    border: "1.5px solid #ddd",
    background: "#fff",
    color: "#1a1a1a",
    fontSize: 15,
    fontFamily: "'Outfit', sans-serif",
    fontWeight: 400,
    appearance: "none",
    cursor: "pointer",
    transition: "all 0.2s ease",
  };
  const inputStyle = {
    ...selectStyle,
    cursor: "text",
    boxSizing: "border-box",
  };
  const labelStyle = {
    display: "block",
    fontSize: 13,
    fontWeight: 600,
    color: "#444",
    marginBottom: 6,
    fontFamily: "'Outfit', sans-serif",
    letterSpacing: "0.01em",
  };

  if (field.type === "select") {
    const options = FIELD_OPTIONS[field.options] || [];
    return (
      <div>
        <label style={labelStyle}>{label}</label>
        <div style={{ position: "relative" }}>
          <select
            style={selectStyle}
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            required
          >
            <option value="">Select…</option>
            {options.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
          <span
            style={{
              position: "absolute",
              right: 14,
              top: "50%",
              transform: "translateY(-50%)",
              pointerEvents: "none",
              color: "#999",
              fontSize: 11,
            }}
          >
            ▼
          </span>
        </div>
      </div>
    );
  }

  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <input
        type="number"
        style={inputStyle}
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={`Enter ${label.toLowerCase()}`}
        required
        min={field.min}
        max={field.max}
        step={field.step}
      />
    </div>
  );
}

// ── Result Card ──────────────────────────────────────────────────────────

function ResultCard({ title, accent, data }) {
  const pct = (data.metastasis * 100).toFixed(1);
  const isHigh = data.risk_level === "HIGH";

  return (
    <div
      style={{
        background: "#fff",
        border: "1.5px solid #e8e8e8",
        borderRadius: 16,
        padding: 28,
        boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
      }}
    >
      <div
        style={{
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: accent,
          marginBottom: 20,
          fontFamily: "'Outfit', sans-serif",
        }}
      >
        {title}
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          marginBottom: 6,
        }}
      >
        <span
          style={{
            fontSize: 13,
            color: "#666",
            fontFamily: "'Outfit', sans-serif",
          }}
        >
          Metastasis Probability
        </span>
        <span
          style={{
            fontSize: 28,
            fontWeight: 700,
            color: "#1a1a1a",
            fontFamily: "'Source Serif 4', serif",
          }}
        >
          {pct}%
        </span>
      </div>

      <div
        style={{
          height: 8,
          borderRadius: 4,
          background: "#f0f0f0",
          overflow: "hidden",
          marginBottom: 20,
        }}
      >
        <div
          style={{
            height: "100%",
            borderRadius: 4,
            width: `${pct}%`,
            background: isHigh
              ? "linear-gradient(90deg, #e74c3c, #c0392b)"
              : "linear-gradient(90deg, #1a6b4f, #2ecc71)",
            transition: "width 1s cubic-bezier(0.16, 1, 0.3, 1)",
            animation: "barFill 1s cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        />
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "12px 0",
          borderTop: "1px solid #f0f0f0",
        }}
      >
        <span
          style={{
            fontSize: 13,
            color: "#666",
            fontFamily: "'Outfit', sans-serif",
          }}
        >
          No Metastasis
        </span>
        <span
          style={{
            fontSize: 15,
            fontWeight: 600,
            color: "#1a1a1a",
            fontFamily: "'Outfit', sans-serif",
          }}
        >
          {(data.no_metastasis * 100).toFixed(1)}%
        </span>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "12px 0",
          borderTop: "1px solid #f0f0f0",
        }}
      >
        <span
          style={{
            fontSize: 13,
            color: "#666",
            fontFamily: "'Outfit', sans-serif",
          }}
        >
          Risk Level
        </span>
        <span
          style={{
            display: "inline-block",
            padding: "5px 14px",
            borderRadius: 6,
            fontSize: 12,
            fontWeight: 700,
            fontFamily: "'Outfit', sans-serif",
            letterSpacing: "0.05em",
            background: isHigh ? "#fdf0f0" : "#edf9f4",
            color: isHigh ? "#c0392b" : "#1a6b4f",
            border: `1px solid ${isHigh ? "#f5c6c6" : "#b8e6d0"}`,
          }}
        >
          {data.risk_level}
        </span>
      </div>
    </div>
  );
}

// ── Aim 2 Site Results Grid ──────────────────────────────────────────────

function SiteResultsGrid({ predictions, patientData }) {
  const sites = ["bone", "brain", "liver", "lung"];
  const isConfirmed = (s) => patientData && patientData[`mets_${s}`] === "Yes";
  // Confirmed first, then predicted sites sorted by descending probability.
  const sorted = [...sites].sort((a, b) => {
    const ca = isConfirmed(a) ? 1 : 0;
    const cb = isConfirmed(b) ? 1 : 0;
    if (ca !== cb) return cb - ca;
    return predictions[b].p_mets - predictions[a].p_mets;
  });
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
        gap: 16,
      }}
    >
      {sorted.map((site) => {
        const confirmed = isConfirmed(site);
        const data = predictions[site];
        const pct = (data.p_mets * 100).toFixed(1);
        const isHigh = data.risk_level === "HIGH";
        const accent = confirmed ? "#2980b9" : isHigh ? "#c0392b" : "#1a6b4f";
        return (
          <div
            key={site}
            style={{
              background: confirmed ? "#f3f8fc" : "#fff",
              border: `1.5px solid ${confirmed ? "#cfe2f2" : "#e8e8e8"}`,
              borderRadius: 12,
              padding: 20,
              boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: accent,
                marginBottom: 14,
                fontFamily: "'Outfit', sans-serif",
              }}
            >
              {SITE_LABELS[site]}
            </div>

            {confirmed ? (
              <>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    marginBottom: 10,
                  }}
                >
                  <span
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: "50%",
                      background: "#2980b9",
                      color: "#fff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 16,
                      fontWeight: 700,
                    }}
                  >
                    ✓
                  </span>
                  <span
                    style={{
                      fontSize: 20,
                      fontWeight: 700,
                      color: "#1a1a1a",
                      fontFamily: "'Source Serif 4', serif",
                    }}
                  >
                    Confirmed
                  </span>
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: "#666",
                    fontFamily: "'Outfit', sans-serif",
                    lineHeight: 1.4,
                    marginBottom: 12,
                  }}
                >
                  Marked as known on input.
                </div>
                <span
                  style={{
                    display: "inline-block",
                    padding: "3px 10px",
                    borderRadius: 5,
                    fontSize: 10,
                    fontWeight: 700,
                    fontFamily: "'Outfit', sans-serif",
                    letterSpacing: "0.05em",
                    background: "#eaf3fa",
                    color: "#2980b9",
                    border: "1px solid #cfe2f2",
                  }}
                >
                  KNOWN
                </span>
              </>
            ) : (
              <>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "baseline",
                    marginBottom: 6,
                  }}
                >
                  <span
                    style={{
                      fontSize: 12,
                      color: "#666",
                      fontFamily: "'Outfit', sans-serif",
                    }}
                  >
                    Probability
                  </span>
                  <span
                    style={{
                      fontSize: 24,
                      fontWeight: 700,
                      color: "#1a1a1a",
                      fontFamily: "'Source Serif 4', serif",
                    }}
                  >
                    {pct}%
                  </span>
                </div>
                <div
                  style={{
                    height: 6,
                    borderRadius: 3,
                    background: "#f0f0f0",
                    overflow: "hidden",
                    marginBottom: 12,
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      borderRadius: 3,
                      width: `${pct}%`,
                      background: isHigh
                        ? "linear-gradient(90deg, #e74c3c, #c0392b)"
                        : "linear-gradient(90deg, #1a6b4f, #2ecc71)",
                      transition: "width 1s cubic-bezier(0.16, 1, 0.3, 1)",
                      animation: "barFill 1s cubic-bezier(0.16, 1, 0.3, 1)",
                    }}
                  />
                </div>
                <span
                  style={{
                    display: "inline-block",
                    padding: "3px 10px",
                    borderRadius: 5,
                    fontSize: 10,
                    fontWeight: 700,
                    fontFamily: "'Outfit', sans-serif",
                    letterSpacing: "0.05em",
                    background: isHigh ? "#fdf0f0" : "#edf9f4",
                    color: isHigh ? "#c0392b" : "#1a6b4f",
                    border: `1px solid ${isHigh ? "#f5c6c6" : "#b8e6d0"}`,
                  }}
                >
                  {data.risk_level}
                </span>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Footer with simplifications / assumptions ───────────────────────────

function AssumptionsFooter() {
  const item = {
    fontSize: 11,
    color: "#999",
    lineHeight: 1.5,
    fontFamily: "'Outfit', sans-serif",
    marginBottom: 2,
  };
  return (
    <footer
      style={{
        marginTop: "auto",
        paddingTop: 12,
        borderTop: "1px solid #eef1ef",
        fontFamily: "'Outfit', sans-serif",
        opacity: 0.85,
      }}
    >
      <div
        style={{
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: "#b3b3b3",
          marginBottom: 6,
        }}
      >
        Assumptions
      </div>
      <ul style={{ paddingLeft: 16, margin: 0 }}>
        <li style={item}>Overall Risk uses exact age (0-99).</li>
        <li style={item}>
          Site-Specific buckets age to 10-year groups (midpoints 5, 15, … 95).
        </li>
        <li style={item}>
          Numeric inputs are mapped to the nearest clinical bucket — PSA: 2/7/15/35/75/150,
          core ratio: 0.1/0.3/0.5/0.7/0.9, CEA: 1/3.75/7.5/15/35/100.
        </li>
      </ul>
    </footer>
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
  const [mode, setMode] = useState("aim1"); // "aim1" = overall risk, "aim2" = site-specific
  const resultsRef = useRef(null);

  useEffect(() => {
    injectStyles();
    fetchCancerTypes();
  }, []);

  const fetchCancerTypes = async () => {
    try {
      const res = await fetch(`${API_BASE}/cancer-types`);
      const data = await res.json();
      setCancerTypes(data.cancer_types || []);
    } catch {
      setError(
        "Failed to connect to prediction API. It may be starting up — try refreshing in 30 seconds."
      );
    }
  };

  const handleCancerChange = (val) => {
    setSelectedCancer(val);
    setFormData({});
    setPrediction(null);
    setError("");
  };

  const handleModeChange = (val) => {
    setMode(val);
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
      resultsRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }, 100);

    const endpoint =
      mode === "aim2"
        ? `${API_BASE}/predict-sites/${selectedCancer}`
        : `${API_BASE}/predict/${selectedCancer}`;
    try {
      const res = await fetch(endpoint, {
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

  const fields = [
    ...(CANCER_FIELDS[selectedCancer] || []),
    ...(mode === "aim2" ? METS_FIELDS : []),
  ];

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(180deg, #f7f9f8 0%, #eef2f0 100%)",
        fontFamily: "'Outfit', sans-serif",
        color: "#1a1a1a",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Top accent bar */}
      <div
        style={{
          height: 4,
          background: "linear-gradient(90deg, #1a6b4f, #2ecc71, #1a6b4f)",
        }}
      />

      <div
        style={{
          maxWidth: 1180,
          width: "100%",
          margin: "0 auto",
          padding: "24px 24px 32px",
          flex: 1,
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Header */}
        <header style={{ marginBottom: 16 }}>
          <h1
            style={{
              fontSize: 26,
              fontWeight: 700,
              color: "#1a1a1a",
              fontFamily: "'Source Serif 4', serif",
              lineHeight: 1.2,
              letterSpacing: "-0.02em",
              marginBottom: 4,
            }}
          >
            Cancer Metastasis Risk Prediction
          </h1>
          <p
            style={{
              fontSize: 13,
              color: "#777",
              fontWeight: 400,
              lineHeight: 1.5,
            }}
          >
            {mode === "aim1"
              ? "Estimate the patient's overall risk of metastasis."
              : "Given known metastasis status, estimate risk for each specific site."}
          </p>
        </header>

        {/* Mode tabs */}
        <div
          style={{
            display: "flex",
            gap: 4,
            padding: 3,
            background: "#eef2f0",
            borderRadius: 10,
            marginBottom: 16,
            width: "fit-content",
          }}
        >
          {[
            { id: "aim1", label: "Overall Risk" },
            { id: "aim2", label: "Site-Specific" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleModeChange(tab.id)}
              style={{
                padding: "8px 18px",
                borderRadius: 8,
                border: "none",
                cursor: "pointer",
                fontSize: 14,
                fontWeight: 600,
                fontFamily: "'Outfit', sans-serif",
                background: mode === tab.id ? "#fff" : "transparent",
                color: mode === tab.id ? "#1a6b4f" : "#666",
                boxShadow:
                  mode === tab.id ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
                transition: "all 0.2s ease",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div
            style={{
              background: "#fdf5f5",
              border: "1px solid #f0c4c4",
              borderRadius: 12,
              padding: "14px 18px",
              marginBottom: 24,
              color: "#b33a3a",
              fontSize: 14,
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <span>⚠</span> {error}
          </div>
        )}

        {/* Two-column on wide screens; auto-stacks on mobile via auto-fit */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              loading || prediction
                ? "repeat(auto-fit, minmax(340px, 1fr))"
                : "1fr",
            gap: 18,
            alignItems: "start",
          }}
        >
        {/* ── Form Card: Cancer Type + Inputs + Button ── */}
        <div
          style={{
            background: "#fff",
            border: "1.5px solid #e8e8e8",
            borderRadius: 14,
            padding: 20,
            boxShadow: "0 2px 12px rgba(0,0,0,0.03)",
          }}
        >
          {/* Cancer Type */}
          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              color: "#999",
              marginBottom: 18,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: "#1a6b4f",
              }}
            />
            Cancer Type
          </div>
          <div
            style={{
              position: "relative",
              marginBottom: selectedCancer ? 28 : 0,
            }}
          >
            <select
              style={{
                width: "100%",
                padding: "14px 16px",
                borderRadius: 10,
                border: "1.5px solid #ddd",
                background: "#fff",
                color: "#1a1a1a",
                fontSize: 15,
                fontFamily: "'Outfit', sans-serif",
                fontWeight: 500,
                appearance: "none",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
              value={selectedCancer}
              onChange={(e) => handleCancerChange(e.target.value)}
            >
              <option value="">Choose a cancer type…</option>
              {cancerTypes.map((type) => (
                <option key={type} value={type}>
                  {CANCER_DISPLAY_NAMES[type] || type}
                </option>
              ))}
            </select>
            <span
              style={{
                position: "absolute",
                right: 14,
                top: "50%",
                transform: "translateY(-50%)",
                pointerEvents: "none",
                color: "#999",
                fontSize: 11,
              }}
            >
              ▼
            </span>
          </div>

          {/* Patient Inputs */}
          {selectedCancer && fields.length > 0 && (
            <>
              <div
                style={{
                  height: 1,
                  background: "#f0f0f0",
                  marginBottom: 24,
                }}
              />
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  color: "#999",
                  marginBottom: 18,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <span
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: "50%",
                    background: "#d4a843",
                  }}
                />
                Patient Information
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
                  gap: 12,
                }}
              >
                {fields.map((f) => (
                  <FieldInput
                    key={f.key}
                    field={f}
                    value={formData[f.key]}
                    onChange={(val) =>
                      setFormData((prev) => ({ ...prev, [f.key]: val }))
                    }
                  />
                ))}
              </div>

              <button
                style={{
                  width: "100%",
                  padding: "12px 20px",
                  borderRadius: 10,
                  border: "none",
                  cursor: loading ? "not-allowed" : "pointer",
                  fontSize: 14,
                  fontWeight: 600,
                  fontFamily: "'Outfit', sans-serif",
                  color: "#fff",
                  background: loading
                    ? "#a0c4b8"
                    : "linear-gradient(135deg, #1a6b4f 0%, #238c65 100%)",
                  boxShadow: loading
                    ? "none"
                    : "0 4px 16px rgba(26,107,79,0.15)",
                  transition: "all 0.3s ease",
                  marginTop: 16,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 10,
                }}
                disabled={loading}
                onClick={handleSubmit}
              >
                {loading && (
                  <div
                    style={{
                      width: 16,
                      height: 16,
                      border: "2px solid rgba(255,255,255,0.3)",
                      borderTop: "2px solid #fff",
                      borderRadius: "50%",
                      animation: "spin 0.8s linear infinite",
                    }}
                  />
                )}
                {loading
                  ? "Running prediction…"
                  : mode === "aim2"
                  ? "Predict Site Risks"
                  : "Predict Metastasis Risk"}
              </button>
            </>
          )}
        </div>

        {/* ── Loading Timer ── */}
        <div ref={resultsRef}>
          {loading && (
            <div
              style={{
                background: "#fff",
                border: "1.5px solid #e8e8e8",
                borderRadius: 16,
                marginBottom: 24,
                boxShadow: "0 2px 12px rgba(0,0,0,0.03)",
                animation: "fadeUp 0.4s ease",
              }}
            >
              <PredictionLoading />
            </div>
          )}

          {/* ── Results ── */}
          {prediction && !loading && (
            <div
              style={{
                background: "#fff",
                border: "1.5px solid #e8e8e8",
                borderRadius: 14,
                padding: 20,
                boxShadow: "0 2px 12px rgba(0,0,0,0.03)",
                animation: "fadeUp 0.5s ease",
              }}
            >
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  color: "#999",
                  marginBottom: 14,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: "#1a6b4f",
                  }}
                />
                Prediction Results
              </div>

              {prediction.predictions.random_forest ? (
                <ResultCard
                  title="Random Forest"
                  accent="#1a6b4f"
                  data={prediction.predictions.random_forest}
                />
              ) : (
                <SiteResultsGrid
                  predictions={prediction.predictions}
                  patientData={prediction.patient_data}
                />
              )}
            </div>
          )}
        </div>
        {/* end results column */}
        </div>
        {/* end two-column grid */}

        <AssumptionsFooter />
      </div>
    </div>
  );
};

export default App;
