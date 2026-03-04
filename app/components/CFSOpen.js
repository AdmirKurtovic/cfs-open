"use client";
import React from "react";
import { useState, useEffect, useCallback, useRef } from "react";

const STORAGE_KEY = "cfs-open-data-v3-preloaded";
const uid = () => Math.random().toString(36).slice(2, 9);

const formatTime = (s) => {
  if (!s && s !== 0) return "—";
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, "0")}`;
};

const formatScore = (val, type, status) => {
  if (status === "dnf") return "DNF";
  if (val === null || val === undefined || val === "") return "—";
  if (type === "time") return formatTime(Number(val));
  if (type === "weight") return `${val} kg`;
  if (type === "distance") return `${val} m`;
  return String(val);
};

const parseTimeInput = (str) => {
  if (!str) return null;
  const parts = str.split(":");
  if (parts.length === 2) return parseInt(parts[0]) * 60 + parseInt(parts[1]);
  return parseInt(str);
};

const ordinal = (n) => { const s = ["th","st","nd","rd"]; const v = n % 100; return n + (s[(v-20)%10] || s[v] || s[0]); };

const T = {
  bg: "#0B0C0F", surface: "#111318", surface2: "#181B21", surface3: "#1F222A",
  border: "rgba(255,255,255,0.06)", border2: "rgba(255,255,255,0.10)",
  text: "#EAEDF3", textMuted: "#777D8A", textDim: "#454952",
  accent: "#E63946", accentSoft: "rgba(230,57,70,0.12)",
  blue: "#3B82F6", blueSoft: "rgba(59,130,246,0.12)",
  green: "#22C55E", greenSoft: "rgba(34,197,94,0.10)",
  yellow: "#FBBF24", gold: "#FFD700", silver: "#A8B4C0", bronze: "#CD7F32",
  podium1: "rgba(255,215,0,0.06)", podium2: "rgba(168,180,192,0.05)", podium3: "rgba(205,127,50,0.05)",
  radius: "6px", radiusLg: "10px",
  font: "'DM Sans','Helvetica Neue',sans-serif", fontMono: "'DM Mono','SF Mono',monospace",
};

const DIVISION_COLORS = {
  "Men RX": { bg: T.accent, soft: T.accentSoft, text: T.accent },
  "Women RX": { bg: "#D946A8", soft: "rgba(217,70,168,0.12)", text: "#D946A8" },
  "Men Scaled": { bg: T.blue, soft: T.blueSoft, text: T.blue },
  "Women Scaled": { bg: "#8B5CF6", soft: "rgba(139,92,246,0.12)", text: "#8B5CF6" },
};

const defaultData = () => {
  // Pre-loaded with CFS Open 2025 results
  const w1 = "w_251", w2 = "w_252", w3 = "w_253", w4 = "w_fin";

  // Athletes
  const menRX = [
    { id: "mrx01", name: "Nedim Kurtović", division: "Men RX" },
    { id: "mrx02", name: "Samir Vaha", division: "Men RX" },
    { id: "mrx03", name: "Edin Šeko", division: "Men RX" },
    { id: "mrx04", name: "Armin Omerbegovic", division: "Men RX" },
    { id: "mrx05", name: "Din Gujic", division: "Men RX" },
    { id: "mrx06", name: "Eldar Junuzovic", division: "Men RX" },
    { id: "mrx07", name: "Zlatko Terzic", division: "Men RX" },
    { id: "mrx08", name: "Jasmin Paco", division: "Men RX" },
    { id: "mrx09", name: "Davor Radivojša", division: "Men RX" },
    { id: "mrx10", name: "Ahmed Kadrić", division: "Men RX" },
    { id: "mrx11", name: "Nedim Sarvan", division: "Men RX" },
    { id: "mrx12", name: "Kenan Kapo", division: "Men RX" },
    { id: "mrx13", name: "Sandro Komljenovic", division: "Men RX" },
  ];
  const womenRX = [
    { id: "wrx01", name: "Irma Kurtovic", division: "Women RX" },
    { id: "wrx02", name: "Inra Lapo", division: "Women RX" },
    { id: "wrx03", name: "April Pao", division: "Women RX" },
    { id: "wrx04", name: "Temima Isaković", division: "Women RX" },
  ];
  const menScaled = [
    { id: "ms01", name: "Adnan Kalauzovic", division: "Men Scaled" },
    { id: "ms02", name: "Amar Šabic", division: "Men Scaled" },
    { id: "ms03", name: "Ibrahim Celik", division: "Men Scaled" },
    { id: "ms04", name: "Sanjin Kešmer", division: "Men Scaled" },
  ];

  const athletes = [...menRX, ...womenRX, ...menScaled];

  const workouts = [
    { id: w1, name: "Workout 25.1", type: "reps", description: "Max reps", timeCap: null, isFinals: false, hasTiebreak: false },
    { id: w2, name: "Workout 25.2", type: "time", description: "For time", timeCap: 900, isFinals: false, hasTiebreak: true },
    { id: w3, name: "Workout 25.3", type: "time", description: "For time", timeCap: null, isFinals: false, hasTiebreak: false },
    { id: w4, name: "Finals", type: "time", description: "Finals workout", timeCap: null, isFinals: true, hasTiebreak: false },
  ];

  // Helper: mm:ss to seconds
  const t = (m, s) => m * 60 + s;

  const scores = {
    // ── Men RX ── Workout 25.1 (reps, higher = better)
    [`mrx01_${w1}`]: { value: 304, status: "complete", tiebreak: null, timestamp: 0 },
    [`mrx02_${w1}`]: { value: 298, status: "complete", tiebreak: null, timestamp: 0 },
    [`mrx03_${w1}`]: { value: 278, status: "complete", tiebreak: null, timestamp: 0 },
    [`mrx04_${w1}`]: { value: 290, status: "complete", tiebreak: null, timestamp: 0 },
    [`mrx05_${w1}`]: { value: 314, status: "complete", tiebreak: null, timestamp: 0 },
    [`mrx06_${w1}`]: { value: 274, status: "complete", tiebreak: null, timestamp: 0 },
    [`mrx07_${w1}`]: { value: 268, status: "complete", tiebreak: null, timestamp: 0 },
    [`mrx08_${w1}`]: { value: 265, status: "complete", tiebreak: null, timestamp: 0 },
    [`mrx09_${w1}`]: { value: 228, status: "complete", tiebreak: null, timestamp: 0 },
    [`mrx10_${w1}`]: { value: 261, status: "complete", tiebreak: null, timestamp: 0 },
    [`mrx11_${w1}`]: { value: 231, status: "complete", tiebreak: null, timestamp: 0 },
    [`mrx12_${w1}`]: { value: 181, status: "complete", tiebreak: null, timestamp: 0 },
    [`mrx13_${w1}`]: { value: 204, status: "complete", tiebreak: null, timestamp: 0 },

    // ── Men RX ── Workout 25.2 (time or capped reps + tiebreak)
    [`mrx01_${w2}`]: { value: t(13,50), status: "complete", tiebreak: null, timestamp: 0 },
    [`mrx02_${w2}`]: { value: t(14,45), status: "complete", tiebreak: null, timestamp: 0 },
    [`mrx03_${w2}`]: { value: 298, status: "cap", tiebreak: t(7,32), timestamp: 0 },
    [`mrx04_${w2}`]: { value: 305, status: "cap", tiebreak: t(7,29), timestamp: 0 },
    [`mrx05_${w2}`]: { value: t(14,17), status: "complete", tiebreak: null, timestamp: 0 },
    [`mrx06_${w2}`]: { value: 295, status: "cap", tiebreak: t(8,37), timestamp: 0 },
    [`mrx07_${w2}`]: { value: 296, status: "cap", tiebreak: t(7,59), timestamp: 0 },
    [`mrx08_${w2}`]: { value: 295, status: "cap", tiebreak: t(11,8), timestamp: 0 },
    [`mrx09_${w2}`]: { value: 294, status: "cap", tiebreak: t(9,28), timestamp: 0 },
    [`mrx10_${w2}`]: { value: 282, status: "cap", tiebreak: null, timestamp: 0 },
    [`mrx11_${w2}`]: { value: 239, status: "cap", tiebreak: t(12,8), timestamp: 0 },
    [`mrx12_${w2}`]: { value: 172, status: "cap", tiebreak: t(6,34), timestamp: 0 },
    [`mrx13_${w2}`]: { value: 180, status: "cap", tiebreak: t(6,43), timestamp: 0 },

    // ── Men RX ── Workout 25.3 (time)
    [`mrx01_${w3}`]: { value: t(6,34), status: "complete", tiebreak: null, timestamp: 0 },
    [`mrx02_${w3}`]: { value: t(6,52), status: "complete", tiebreak: null, timestamp: 0 },
    [`mrx03_${w3}`]: { value: t(6,36), status: "complete", tiebreak: null, timestamp: 0 },
    [`mrx04_${w3}`]: { value: t(9,21), status: "complete", tiebreak: null, timestamp: 0 },
    [`mrx05_${w3}`]: { value: t(9,38), status: "complete", tiebreak: null, timestamp: 0 },
    [`mrx06_${w3}`]: { value: t(9,5), status: "complete", tiebreak: null, timestamp: 0 },
    [`mrx07_${w3}`]: { value: t(10,33), status: "complete", tiebreak: null, timestamp: 0 },
    [`mrx08_${w3}`]: { value: t(12,33), status: "complete", tiebreak: null, timestamp: 0 },
    [`mrx09_${w3}`]: { value: t(12,53), status: "complete", tiebreak: null, timestamp: 0 },
    [`mrx10_${w3}`]: { value: t(15,11), status: "complete", tiebreak: null, timestamp: 0 },
    // mrx11 Sarvan — no score for WOD 3
    [`mrx12_${w3}`]: { value: t(15,8), status: "complete", tiebreak: null, timestamp: 0 },
    [`mrx13_${w3}`]: { value: t(18,6), status: "complete", tiebreak: null, timestamp: 0 },

    // ── Men RX ── Finals (time, top 7 competed)
    [`mrx01_${w4}`]: { value: t(15,30), status: "complete", tiebreak: null, timestamp: 0 },
    [`mrx02_${w4}`]: { value: t(17,0), status: "complete", tiebreak: null, timestamp: 0 },
    [`mrx03_${w4}`]: { value: t(15,31), status: "complete", tiebreak: null, timestamp: 0 },
    [`mrx04_${w4}`]: { value: t(16,56), status: "complete", tiebreak: null, timestamp: 0 },
    // mrx05 Din Gujic — didn't compete in finals
    [`mrx06_${w4}`]: { value: t(19,36), status: "complete", tiebreak: null, timestamp: 0 },
    [`mrx07_${w4}`]: { value: t(18,27), status: "complete", tiebreak: null, timestamp: 0 },

    // ── Women RX ── Workout 25.1 (reps)
    [`wrx01_${w1}`]: { value: 236, status: "complete", tiebreak: null, timestamp: 0 },
    [`wrx02_${w1}`]: { value: 228, status: "complete", tiebreak: null, timestamp: 0 },
    [`wrx03_${w1}`]: { value: 182, status: "complete", tiebreak: null, timestamp: 0 },
    [`wrx04_${w1}`]: { value: 195, status: "complete", tiebreak: null, timestamp: 0 },

    // ── Women RX ── Workout 25.2 (time/cap + tiebreak)
    [`wrx01_${w2}`]: { value: 296, status: "cap", tiebreak: t(8,20), timestamp: 0 },
    [`wrx02_${w2}`]: { value: 294, status: "cap", tiebreak: t(11,1), timestamp: 0 },
    [`wrx03_${w2}`]: { value: 113, status: "cap", tiebreak: t(12,30), timestamp: 0 },
    [`wrx04_${w2}`]: { value: 296, status: "cap", tiebreak: t(7,45), timestamp: 0 },

    // ── Women RX ── Workout 25.3 (time)
    [`wrx01_${w3}`]: { value: t(11,40), status: "complete", tiebreak: null, timestamp: 0 },
    [`wrx02_${w3}`]: { value: t(8,40), status: "complete", tiebreak: null, timestamp: 0 },
    [`wrx03_${w3}`]: { value: t(17,25), status: "complete", tiebreak: null, timestamp: 0 },
    [`wrx04_${w3}`]: { value: t(13,30), status: "complete", tiebreak: null, timestamp: 0 },

    // ── Women RX ── Finals
    [`wrx01_${w4}`]: { value: 155, status: "complete", tiebreak: null, timestamp: 0 },
    [`wrx02_${w4}`]: { value: t(18,34), status: "complete", tiebreak: null, timestamp: 0 },
    [`wrx03_${w4}`]: { value: 108, status: "complete", tiebreak: null, timestamp: 0 },

    // ── Men Scaled ── Workout 25.1 (reps)
    [`ms01_${w1}`]: { value: 228, status: "complete", tiebreak: null, timestamp: 0 },
    [`ms02_${w1}`]: { value: 257, status: "complete", tiebreak: null, timestamp: 0 },
    [`ms03_${w1}`]: { value: 247, status: "complete", tiebreak: null, timestamp: 0 },
    [`ms04_${w1}`]: { value: 197, status: "complete", tiebreak: null, timestamp: 0 },

    // ── Men Scaled ── Workout 25.2 (time)
    [`ms01_${w2}`]: { value: t(11,55), status: "complete", tiebreak: null, timestamp: 0 },
    [`ms02_${w2}`]: { value: t(10,21), status: "complete", tiebreak: null, timestamp: 0 },
    [`ms03_${w2}`]: { value: t(9,35), status: "complete", tiebreak: null, timestamp: 0 },
    [`ms04_${w2}`]: { value: 299, status: "cap", tiebreak: t(9,22), timestamp: 0 },

    // ── Men Scaled ── Workout 25.3 (time)
    [`ms01_${w3}`]: { value: t(9,56), status: "complete", tiebreak: null, timestamp: 0 },
    [`ms02_${w3}`]: { value: t(11,56), status: "complete", tiebreak: null, timestamp: 0 },
    [`ms03_${w3}`]: { value: t(12,49), status: "complete", tiebreak: null, timestamp: 0 },
    [`ms04_${w3}`]: { value: t(11,50), status: "complete", tiebreak: null, timestamp: 0 },

    // ── Men Scaled ── Finals (time)
    [`ms01_${w4}`]: { value: t(15,48), status: "complete", tiebreak: null, timestamp: 0 },
    [`ms02_${w4}`]: { value: t(17,9), status: "complete", tiebreak: null, timestamp: 0 },
    [`ms03_${w4}`]: { value: t(17,11), status: "complete", tiebreak: null, timestamp: 0 },
  };

  return {
    competition: { name: "Community Fitness Sarajevo Open", date: "2025-01-25" },
    divisions: ["Men RX", "Women RX", "Men Scaled"],
    athletes,
    workouts,
    scores,
  };
};

const loadData = () => { try { const r = localStorage.getItem(STORAGE_KEY); return r ? JSON.parse(r) : defaultData(); } catch { return defaultData(); } };
const saveData = (d) => { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(d)); } catch {} };

// ── Shared styles ───────────────────────────────────────────────
const thS = { padding: "8px 12px", fontSize: 11, fontWeight: 700, color: T.textMuted, textTransform: "uppercase", letterSpacing: "0.05em", textAlign: "left", whiteSpace: "nowrap", background: T.surface2 };
const tdS = { padding: "10px 12px", fontSize: 14, borderBottom: `1px solid ${T.border}`, whiteSpace: "nowrap" };
const inputS = { padding: "8px 12px", fontSize: 13, fontWeight: 500, border: `1px solid ${T.border2}`, borderRadius: T.radius, background: T.surface2, color: T.text, fontFamily: T.font, outline: "none", width: "100%", boxSizing: "border-box" };
const labelS = { fontSize: 11, fontWeight: 700, color: T.textMuted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 5, display: "block" };
const cardS = { background: T.surface, border: `1px solid ${T.border}`, borderRadius: T.radiusLg, padding: 20, marginBottom: 14 };
const btnP = { padding: "7px 16px", fontSize: 12, fontWeight: 700, border: "none", borderRadius: T.radius, cursor: "pointer", fontFamily: T.font, background: T.accent, color: "#fff", display: "inline-flex", alignItems: "center", gap: 5, transition: "all 0.15s" };
const btnG = { ...btnP, background: "transparent", border: `1px solid ${T.border2}`, color: T.textMuted };
const btnSm = (a) => ({ padding: "5px 11px", fontSize: 11, fontWeight: 700, border: "none", borderRadius: 4, cursor: "pointer", fontFamily: T.font, background: a ? T.accent : T.surface3, color: a ? "#fff" : T.textMuted, transition: "all 0.12s" });
const divBadge = (d) => { const c = DIVISION_COLORS[d] || DIVISION_COLORS["Men RX"]; return { padding: "2px 7px", fontSize: 10, fontWeight: 700, borderRadius: 3, background: c.soft, color: c.text, textTransform: "uppercase", letterSpacing: "0.04em" }; };

function EmptyState({ icon, title, sub }) {
  return <div style={cardS}><div style={{ textAlign: "center", padding: "50px 20px", color: T.textDim }}><div style={{ fontSize: 36, marginBottom: 12 }}>{icon}</div><div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6, color: T.textMuted }}>{title}</div><div style={{ fontSize: 13 }}>{sub}</div></div></div>;
}

function RankBadge({ pos }) {
  const bg = pos === 1 ? "linear-gradient(135deg,#FFD700,#FFA500)" : pos === 2 ? "linear-gradient(135deg,#C0C0C0,#8A8A8A)" : pos === 3 ? "linear-gradient(135deg,#CD7F32,#A0522D)" : T.surface3;
  return <div style={{ width: 26, height: 26, borderRadius: "50%", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, background: bg, color: pos <= 3 ? "#000" : T.textMuted }}>{pos}</div>;
}

function StatusBadge({ status }) {
  const s = status === "dnf" ? { bg: "rgba(239,68,68,0.15)", c: "#EF4444", t: "DNF" } : status === "cap" ? { bg: "rgba(251,191,36,0.15)", c: "#FBBF24", t: "CAP" } : { bg: T.greenSoft, c: T.green, t: "✓" };
  return <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 3, background: s.bg, color: s.c, textTransform: "uppercase" }}>{s.t}</span>;
}

// ── Main App ────────────────────────────────────────────────────
export default function CFSOpen() {
  const [data, setData] = useState(null);
  const [tab, setTab] = useState("leaderboard");

  useEffect(() => { setData(loadData()); }, []);
  const save = useCallback((d) => { setData(d); saveData(d); }, []);
  const resetAll = () => { if (confirm("Delete ALL data?")) save(defaultData()); };

  if (!data) return <div style={{ background: T.bg, color: T.text, display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", fontFamily: T.font }}><div style={{ color: T.textMuted, fontSize: 13 }}>Loading...</div></div>;

  const tabs = ["leaderboard", "scoring", "athletes", "workouts", "settings"];

  return (
    <div style={{ fontFamily: T.font, background: T.bg, color: T.text, minHeight: "100vh" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet" />
      <header style={{ background: T.surface, borderBottom: `1px solid ${T.border}`, padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 56, position: "sticky", top: 0, zIndex: 100, backdropFilter: "blur(16px)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 28, height: 28, background: T.accent, borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 10, color: "#fff", letterSpacing: "0.02em" }}>CFS</div>
          <span style={{ fontSize: 15, fontWeight: 700, letterSpacing: "-0.02em" }}>{data.competition.name}</span>
        </div>
        <nav style={{ display: "flex", gap: 1, background: T.surface2, borderRadius: T.radius, padding: 3 }}>
          {tabs.map(t => <button key={t} onClick={() => setTab(t)} style={{ padding: "6px 14px", fontSize: 12, fontWeight: 600, border: "none", borderRadius: 4, cursor: "pointer", fontFamily: T.font, background: tab === t ? T.accent : "transparent", color: tab === t ? "#fff" : T.textMuted, transition: "all 0.15s" }}>{t.charAt(0).toUpperCase() + t.slice(1)}</button>)}
        </nav>
      </header>
      <div style={{ maxWidth: 1400, margin: "0 auto", padding: "20px 20px 80px" }}>
        {tab === "leaderboard" && <Leaderboard data={data} />}
        {tab === "scoring" && <Scoring data={data} save={save} />}
        {tab === "athletes" && <Athletes data={data} save={save} />}
        {tab === "workouts" && <Workouts data={data} save={save} />}
        {tab === "settings" && <Settings data={data} save={save} resetAll={resetAll} />}
      </div>
    </div>
  );
}

// ── Leaderboard ─────────────────────────────────────────────────
function Leaderboard({ data }) {
  const { athletes, workouts, scores, divisions } = data;
  if (!athletes.length || !workouts.length) return <EmptyState icon="🏋️" title="No scores yet" sub="Add athletes and workouts, then start scoring." />;

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-0.02em", margin: 0 }}>Leaderboard</h1>
        <p style={{ fontSize: 13, color: T.textMuted, marginTop: 4 }}>{athletes.length} athletes · {workouts.length} workouts · {data.competition.date}</p>
      </div>
      {(divisions || []).map(div => {
        const da = athletes.filter(a => a.division === div);
        if (!da.length) return null;
        const colors = DIVISION_COLORS[div] || DIVISION_COLORS["Men RX"];

        // Rank per workout
        const wRanks = {};
        workouts.forEach(w => {
          const ents = da.map(a => ({ a, s: scores[`${a.id}_${w.id}`] })).filter(e => e.s && e.s.status !== "dnf");
          // Sort: time = lower better, else higher better. Tiebreak: lower time better
          ents.sort((x, y) => {
            const xv = Number(x.s.value), yv = Number(y.s.value);
            const diff = w.type === "time" ? xv - yv : yv - xv;
            if (diff !== 0) return diff;
            if (x.s.tiebreak && y.s.tiebreak) return x.s.tiebreak - y.s.tiebreak;
            return 0;
          });
          ents.forEach((e, i) => { wRanks[`${e.a.id}_${w.id}`] = i + 1; });
          da.forEach(a => { const s = scores[`${a.id}_${w.id}`]; if (s && s.status === "dnf") wRanks[`${a.id}_${w.id}`] = da.length; });
        });

        const rows = da.map(a => {
          const pw = {}; let total = 0;
          workouts.forEach(w => {
            const k = `${a.id}_${w.id}`;
            const s = scores[k];
            const pts = wRanks[k] || (da.length + 1);
            pw[w.id] = { score: s, points: s ? pts : da.length + 1 };
            total += pw[w.id].points;
          });
          // Running totals
          const rt = {}; let cum = 0;
          workouts.forEach(w => { cum += pw[w.id].points; rt[w.id] = cum; });
          return { athlete: a, pw, total, rt };
        });
        rows.sort((a, b) => a.total - b.total);

        // Find "logical group" boundaries for running totals — show total after every 2nd+ workout
        const showRunningAfter = [];
        if (workouts.length > 2) {
          // Show running total after workout index 1 (after first two), and before finals
          const finalsIdx = workouts.findIndex(w => w.isFinals);
          if (finalsIdx > 1) showRunningAfter.push(finalsIdx - 1);
          if (finalsIdx === -1 && workouts.length > 2) showRunningAfter.push(1);
        }

        return (
          <div key={div} style={{ marginBottom: 28 }}>
            {/* Division bar */}
            <div style={{ background: colors.bg, borderRadius: "6px 6px 0 0", padding: "10px 18px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 14, fontWeight: 800, color: "#fff", textTransform: "uppercase", letterSpacing: "0.06em" }}>{div}</span>
                <span style={{ fontSize: 12, color: "rgba(255,255,255,0.6)" }}>{da.length} athletes</span>
              </div>
            </div>

            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderTop: "none", borderRadius: "0 0 10px 10px", overflow: "hidden" }}>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 700 }}>
                  <thead>
                    {/* Row 1: Workout names */}
                    <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                      <th rowSpan={2} style={{ ...thS, width: 44, textAlign: "center", position: "sticky", left: 0, zIndex: 2, background: T.surface2 }}>#</th>
                      <th rowSpan={2} style={{ ...thS, minWidth: 150, position: "sticky", left: 44, zIndex: 2, background: T.surface2 }}>Athlete</th>
                      {workouts.map((w, wi) => (
                        <React.Fragment key={w.id}>
                          <th colSpan={w.hasTiebreak ? 3 : 2} style={{ ...thS, textAlign: "center", borderLeft: `1px solid ${T.border}`, color: w.isFinals ? T.yellow : T.textMuted }}>
                            {w.name} {w.isFinals && "★"}
                          </th>
                          {showRunningAfter.includes(wi) && (
                            <th rowSpan={2} style={{ ...thS, textAlign: "center", borderLeft: `2px solid ${colors.bg}`, fontWeight: 800, color: colors.text, width: 50, fontSize: 10, background: T.surface2 }}>
                              Total
                            </th>
                          )}
                        </React.Fragment>
                      ))}
                      <th rowSpan={2} style={{ ...thS, textAlign: "center", borderLeft: `2px solid ${colors.bg}`, fontWeight: 800, color: "#fff", background: colors.bg, width: 56, fontSize: 11 }}>
                        Total
                      </th>
                    </tr>
                    {/* Row 2: Score / TB / Pts */}
                    <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                      {workouts.map((w, wi) => (
                        <React.Fragment key={w.id + "_sub"}>
                          <td style={{ ...thS, textAlign: "center", borderLeft: `1px solid ${T.border}`, fontSize: 10, padding: "4px 8px" }}>Score</td>
                          {w.hasTiebreak && <td style={{ ...thS, textAlign: "center", fontSize: 10, padding: "4px 8px", color: T.textDim }}>TB</td>}
                          <td style={{ ...thS, textAlign: "center", fontSize: 10, padding: "4px 8px" }}>Pts</td>
                        </React.Fragment>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, i) => {
                      const podBg = i === 0 ? T.podium1 : i === 1 ? T.podium2 : i === 2 ? T.podium3 : "transparent";
                      const altBg = i >= 3 && i % 2 === 1 ? "rgba(255,255,255,0.015)" : "transparent";
                      return (
                        <tr key={row.athlete.id} style={{ background: i < 3 ? podBg : altBg }}>
                          <td style={{ ...tdS, textAlign: "center", position: "sticky", left: 0, background: i < 3 ? podBg : (i % 2 === 1 ? T.surface : T.surface), zIndex: 1 }}><RankBadge pos={i + 1} /></td>
                          <td style={{ ...tdS, fontWeight: 600, fontSize: 13, position: "sticky", left: 44, background: i < 3 ? podBg : (i % 2 === 1 ? T.surface : T.surface), zIndex: 1 }}>{row.athlete.name}</td>
                          {workouts.map((w, wi) => {
                            const p = row.pw[w.id];
                            const s = p?.score;
                            const pts = p?.points;
                            const ptsColor = s ? (pts === 1 ? T.gold : pts === 2 ? T.silver : pts === 3 ? T.bronze : T.textMuted) : T.textDim;
                            const scoreColor = s ? (pts === 1 ? T.gold : pts === 2 ? T.silver : pts === 3 ? T.bronze : T.text) : T.textDim;
                            return (
                              <React.Fragment key={w.id}>
                                <td style={{ ...tdS, textAlign: "center", borderLeft: `1px solid ${T.border}`, fontFamily: T.fontMono, fontSize: 13 }}>
                                  {s ? (
                                    s.status === "dnf" ? <span style={{ color: "#EF4444", fontWeight: 700, fontSize: 10 }}>DNF</span>
                                    : s.status === "cap" ? <span><span style={{ color: T.yellow, fontSize: 10, fontWeight: 700 }}>CAP </span><span style={{ color: T.textMuted }}>{s.value}</span></span>
                                    : <span style={{ color: scoreColor }}>{formatScore(s.value, w.type, s.status)}</span>
                                  ) : <span style={{ color: T.textDim }}>—</span>}
                                </td>
                                {w.hasTiebreak && <td style={{ ...tdS, textAlign: "center", fontSize: 11, color: T.textDim, fontFamily: T.fontMono }}>{s?.tiebreak ? formatTime(s.tiebreak) : ""}</td>}
                                <td style={{ ...tdS, textAlign: "center", fontWeight: 700, fontSize: 12, color: ptsColor }}>{s ? pts : "—"}</td>
                                {showRunningAfter.includes(wi) && (
                                  <td style={{ ...tdS, textAlign: "center", borderLeft: `2px solid ${colors.bg}`, fontWeight: 700, fontSize: 13, fontFamily: T.fontMono, color: T.textMuted }}>{row.rt[w.id]}</td>
                                )}
                              </React.Fragment>
                            );
                          })}
                          <td style={{ ...tdS, textAlign: "center", borderLeft: `2px solid ${colors.bg}`, fontWeight: 800, fontSize: 16, fontFamily: T.fontMono, color: T.text, background: i < 3 ? `rgba(${i===0?'255,215,0':i===1?'168,180,192':'205,127,50'},0.04)` : "transparent" }}>{row.total}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Score Input ─────────────────────────────────────────────────
function ScoreInput({ type, hasTiebreak, initialValue, initialTiebreak, onSave, onCancel }) {
  const [v, setV] = useState(type === "time" && initialValue ? `${Math.floor(initialValue/60)}:${(initialValue%60).toString().padStart(2,"0")}` : initialValue || "");
  const [tb, setTb] = useState(initialTiebreak ? `${Math.floor(initialTiebreak/60)}:${(initialTiebreak%60).toString().padStart(2,"0")}` : "");
  const ref = useRef(null);
  useEffect(() => { ref.current?.focus(); }, []);
  const doSave = () => onSave(v, tb);
  return (
    <div style={{ display: "flex", gap: 5, alignItems: "center", justifyContent: "center" }}>
      <input ref={ref} style={{ ...inputS, width: 90, textAlign: "center", fontFamily: T.fontMono, fontSize: 12 }} placeholder={type === "time" ? "m:ss" : type === "weight" ? "kg" : type === "distance" ? "m" : "reps"} value={v} onChange={e => setV(e.target.value)} onKeyDown={e => { if (e.key === "Enter") doSave(); if (e.key === "Escape") onCancel(); }} />
      {hasTiebreak && <input style={{ ...inputS, width: 70, textAlign: "center", fontFamily: T.fontMono, fontSize: 11 }} placeholder="TB m:ss" value={tb} onChange={e => setTb(e.target.value)} onKeyDown={e => { if (e.key === "Enter") doSave(); if (e.key === "Escape") onCancel(); }} />}
      <button style={btnSm(true)} onClick={doSave}>✓</button>
      <button style={btnSm(false)} onClick={onCancel}>✕</button>
    </div>
  );
}

// ── Scoring ─────────────────────────────────────────────────────
function Scoring({ data, save }) {
  const [selW, setSelW] = useState(data.workouts[0]?.id || "");
  const [selD, setSelD] = useState("all");
  const [ed, setEd] = useState(null);
  const wod = data.workouts.find(w => w.id === selW);
  const fa = selD === "all" ? data.athletes : data.athletes.filter(a => a.division === selD);

  const doSave = (aid, val, tb, status = "complete") => {
    const k = `${aid}_${selW}`;
    const parsed = wod?.type === "time" ? parseTimeInput(val) : Number(val);
    save({ ...data, scores: { ...data.scores, [k]: { value: parsed, status, tiebreak: tb ? parseTimeInput(tb) : null, timestamp: Date.now() } } });
    setEd(null);
  };
  const doDNF = (aid) => { const k = `${aid}_${selW}`; save({ ...data, scores: { ...data.scores, [k]: { value: 0, status: "dnf", tiebreak: null, timestamp: Date.now() } } }); };
  const doCAP = (aid) => { const r = prompt("Reps at cap:"); if (r) { const k = `${aid}_${selW}`; save({ ...data, scores: { ...data.scores, [k]: { value: Number(r), status: "cap", tiebreak: null, timestamp: Date.now() } } }); } };
  const doClear = (aid) => { const ns = { ...data.scores }; delete ns[`${aid}_${selW}`]; save({ ...data, scores: ns }); };

  if (!data.workouts.length || !data.athletes.length) return <EmptyState icon="📝" title="Setup required" sub="Add athletes and workouts first." />;
  return (
    <div>
      <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap", alignItems: "end" }}>
        <div><label style={labelS}>Workout</label><select style={{ ...inputS, width: "auto", minWidth: 180, cursor: "pointer" }} value={selW} onChange={e => setSelW(e.target.value)}>{data.workouts.map(w => <option key={w.id} value={w.id}>{w.name} ({w.type}){w.isFinals ? " ★" : ""}</option>)}</select></div>
        <div><label style={labelS}>Division</label><div style={{ display: "flex", gap: 3 }}><button style={btnSm(selD === "all")} onClick={() => setSelD("all")}>All</button>{data.divisions.map(d => <button key={d} style={btnSm(selD === d)} onClick={() => setSelD(d)}>{d}</button>)}</div></div>
        {wod && <div style={{ marginLeft: "auto", padding: "8px 14px", background: T.surface2, borderRadius: T.radius, fontSize: 11, color: T.textMuted, display: "flex", alignItems: "center", gap: 8 }}><strong style={{ color: T.text }}>{wod.name}</strong><span>{wod.type === "time" ? "⏱" : wod.type === "reps" ? "🔄" : wod.type === "weight" ? "🏋️" : "📏"} {wod.type}</span>{wod.timeCap && <span>Cap: {formatTime(wod.timeCap)}</span>}{wod.isFinals && <span style={{ color: T.yellow }}>★ Finals</span>}{wod.hasTiebreak && <span style={{ color: T.blue }}>TB</span>}</div>}
      </div>
      <div style={{ ...cardS, padding: 0, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr><th style={thS}>Athlete</th><th style={{ ...thS, textAlign: "center", width: 80 }}>Division</th><th style={{ ...thS, textAlign: "center" }}>Score{wod?.hasTiebreak ? " + Tiebreak" : ""}</th><th style={{ ...thS, textAlign: "center", width: 60 }}>Status</th><th style={{ ...thS, textAlign: "center", width: 180 }}>Actions</th></tr></thead>
          <tbody>
            {fa.map(a => {
              const k = `${a.id}_${selW}`; const sc = data.scores[k]; const isEd = ed === a.id;
              return (
                <tr key={a.id} style={{ background: sc ? T.greenSoft : "transparent" }}>
                  <td style={{ ...tdS, fontWeight: 600, fontSize: 13 }}>{a.name}</td>
                  <td style={{ ...tdS, textAlign: "center" }}><span style={divBadge(a.division)}>{a.division}</span></td>
                  <td style={{ ...tdS, textAlign: "center" }}>
                    {isEd ? <ScoreInput type={wod?.type} hasTiebreak={wod?.hasTiebreak} initialValue={sc?.value} initialTiebreak={sc?.tiebreak} onSave={(v, tb) => doSave(a.id, v, tb)} onCancel={() => setEd(null)} /> : (
                      <span style={{ fontFamily: T.fontMono, fontSize: 13 }}>{sc ? <>{formatScore(sc.value, wod?.type, sc.status)}{sc.tiebreak ? <span style={{ color: T.textDim, marginLeft: 8, fontSize: 11 }}>TB {formatTime(sc.tiebreak)}</span> : null}</> : <span style={{ color: T.textDim }}>—</span>}</span>
                    )}
                  </td>
                  <td style={{ ...tdS, textAlign: "center" }}>{sc && <StatusBadge status={sc.status} />}</td>
                  <td style={{ ...tdS, textAlign: "center" }}>{!isEd && <div style={{ display: "flex", gap: 4, justifyContent: "center" }}><button style={btnSm(false)} onClick={() => setEd(a.id)}>{sc ? "Edit" : "Enter"}</button><button style={btnSm(false)} onClick={() => doDNF(a.id)}>DNF</button>{wod?.timeCap && <button style={btnSm(false)} onClick={() => doCAP(a.id)}>CAP</button>}{sc && <button style={{ ...btnSm(false), color: "#EF4444" }} onClick={() => doClear(a.id)}>✕</button>}</div>}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Athletes ────────────────────────────────────────────────────
function Athletes({ data, save }) {
  const [name, setName] = useState(""); const [div, setDiv] = useState(data.divisions[0] || "Men RX");
  const add = () => { if (!name.trim()) return; save({ ...data, athletes: [...data.athletes, { id: uid(), name: name.trim(), division: div }] }); setName(""); };
  const remove = (id) => { const ns = { ...data.scores }; Object.keys(ns).forEach(k => { if (k.startsWith(id + "_")) delete ns[k]; }); save({ ...data, athletes: data.athletes.filter(a => a.id !== id), scores: ns }); };
  const cycle = (id) => { const ds = data.divisions; save({ ...data, athletes: data.athletes.map(a => a.id === id ? { ...a, division: ds[(ds.indexOf(a.division) + 1) % ds.length] } : a) }); };

  return (
    <div>
      <h2 style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-0.02em", margin: "0 0 4px" }}>Athletes</h2>
      <p style={{ fontSize: 13, color: T.textMuted, marginBottom: 16 }}>{data.athletes.length} registered</p>
      <div style={{ ...cardS, display: "flex", gap: 10, alignItems: "end", flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 180 }}><label style={labelS}>Athlete Name</label><input style={inputS} placeholder="First Last" value={name} onChange={e => setName(e.target.value)} onKeyDown={e => e.key === "Enter" && add()} /></div>
        <div><label style={labelS}>Division</label><div style={{ display: "flex", gap: 3 }}>{data.divisions.map(d => <button key={d} style={btnSm(div === d)} onClick={() => setDiv(d)}>{d}</button>)}</div></div>
        <button style={btnP} onClick={add}>+ Add</button>
      </div>
      {!data.athletes.length ? <EmptyState icon="👥" title="No athletes" sub="Add athletes above." /> : (
        <div style={{ ...cardS, padding: 0, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr><th style={{ ...thS, width: 36 }}>#</th><th style={thS}>Name</th><th style={{ ...thS, textAlign: "center" }}>Division</th><th style={{ ...thS, textAlign: "center" }}>Scores</th><th style={{ ...thS, textAlign: "center", width: 80 }}></th></tr></thead>
            <tbody>{data.athletes.map((a, i) => {
              const sc = Object.keys(data.scores).filter(k => k.startsWith(a.id + "_")).length;
              return <tr key={a.id}><td style={{ ...tdS, color: T.textDim, fontSize: 12 }}>{i + 1}</td><td style={{ ...tdS, fontWeight: 600, fontSize: 13 }}>{a.name}</td><td style={{ ...tdS, textAlign: "center" }}><button style={{ ...divBadge(a.division), border: "none", cursor: "pointer", fontFamily: T.font }} onClick={() => cycle(a.id)}>{a.division}</button></td><td style={{ ...tdS, textAlign: "center", color: T.textMuted, fontSize: 12 }}>{sc}/{data.workouts.length}</td><td style={{ ...tdS, textAlign: "center" }}><button style={{ ...btnSm(false), color: "#EF4444" }} onClick={() => remove(a.id)}>Remove</button></td></tr>;
            })}</tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Workouts ────────────────────────────────────────────────────
function Workouts({ data, save }) {
  const [f, setF] = useState({ name: "", type: "time", description: "", timeCap: "", isFinals: false, hasTiebreak: false });
  const icons = { time: "⏱", reps: "🔄", weight: "🏋️", distance: "📏" };
  const add = () => { if (!f.name.trim()) return; save({ ...data, workouts: [...data.workouts, { id: uid(), name: f.name.trim(), type: f.type, description: f.description, timeCap: f.timeCap ? parseTimeInput(f.timeCap) : null, isFinals: f.isFinals, hasTiebreak: f.hasTiebreak }] }); setF({ name: "", type: "time", description: "", timeCap: "", isFinals: false, hasTiebreak: false }); };
  const remove = (id) => { const ns = { ...data.scores }; Object.keys(ns).forEach(k => { if (k.endsWith("_" + id)) delete ns[k]; }); save({ ...data, workouts: data.workouts.filter(w => w.id !== id), scores: ns }); };

  return (
    <div>
      <h2 style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-0.02em", margin: "0 0 4px" }}>Workouts</h2>
      <p style={{ fontSize: 13, color: T.textMuted, marginBottom: 16 }}>{data.workouts.length} configured</p>
      <div style={cardS}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
          <div><label style={labelS}>Name</label><input style={inputS} placeholder="e.g. Workout 25.1" value={f.name} onChange={e => setF({ ...f, name: e.target.value })} /></div>
          <div><label style={labelS}>Score Type</label><div style={{ display: "flex", gap: 3 }}>{["time", "reps", "weight", "distance"].map(t => <button key={t} style={{ ...btnSm(f.type === t), flex: 1, textAlign: "center", justifyContent: "center", display: "flex" }} onClick={() => setF({ ...f, type: t })}>{icons[t]} {t}</button>)}</div></div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 120px", gap: 12, marginBottom: 12 }}>
          <div><label style={labelS}>Description</label><input style={inputS} placeholder="21-15-9 Thrusters & Pull-ups" value={f.description} onChange={e => setF({ ...f, description: e.target.value })} /></div>
          {f.type === "time" && <div><label style={labelS}>Time Cap</label><input style={inputS} placeholder="m:ss" value={f.timeCap} onChange={e => setF({ ...f, timeCap: e.target.value })} /></div>}
        </div>
        <div style={{ display: "flex", gap: 14, alignItems: "center", marginBottom: 14 }}>
          <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: 12, color: T.textMuted }}><input type="checkbox" checked={f.hasTiebreak} onChange={e => setF({ ...f, hasTiebreak: e.target.checked })} /> Has tiebreak time</label>
          <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: 12, color: T.yellow }}><input type="checkbox" checked={f.isFinals} onChange={e => setF({ ...f, isFinals: e.target.checked })} /> ★ Finals workout</label>
        </div>
        <button style={btnP} onClick={add}>+ Add Workout</button>
      </div>
      {!data.workouts.length ? <EmptyState icon="💪" title="No workouts" sub="Configure above." /> : (
        <div style={{ display: "grid", gap: 10 }}>{data.workouts.map((w, i) => (
          <div key={w.id} style={{ ...cardS, display: "flex", alignItems: "center", gap: 14, padding: 16 }}>
            <div style={{ width: 36, height: 36, borderRadius: T.radius, background: w.isFinals ? "rgba(251,191,36,0.15)" : T.surface3, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, color: w.isFinals ? T.yellow : T.accent, flexShrink: 0 }}>{i + 1}</div>
            <div style={{ flex: 1 }}><div style={{ fontWeight: 700, fontSize: 14, marginBottom: 3 }}>{w.name} {w.isFinals && <span style={{ color: T.yellow }}>★</span>}</div><div style={{ fontSize: 11, color: T.textMuted }}>{icons[w.type]} {w.type}{w.timeCap ? ` · Cap ${formatTime(w.timeCap)}` : ""}{w.hasTiebreak ? " · Tiebreak" : ""}{w.description ? ` · ${w.description}` : ""}</div></div>
            <span style={{ fontSize: 11, color: T.textDim }}>{Object.keys(data.scores).filter(k => k.endsWith("_" + w.id)).length} scores</span>
            <button style={{ ...btnSm(false), color: "#EF4444" }} onClick={() => remove(w.id)}>Remove</button>
          </div>
        ))}</div>
      )}
    </div>
  );
}

// ── Settings ────────────────────────────────────────────────────
function Settings({ data, save, resetAll }) {
  const [name, setName] = useState(data.competition.name); const [date, setDate] = useState(data.competition.date); const [newDiv, setNewDiv] = useState("");
  const saveMeta = () => save({ ...data, competition: { ...data.competition, name, date } });
  const addDiv = () => { if (!newDiv.trim() || data.divisions.includes(newDiv.trim())) return; save({ ...data, divisions: [...data.divisions, newDiv.trim()] }); setNewDiv(""); };
  const removeDiv = (d) => { if (data.athletes.some(a => a.division === d)) return alert("Remove athletes first."); save({ ...data, divisions: data.divisions.filter(x => x !== d) }); };
  const total = Object.keys(data.scores).length; const max = data.athletes.length * data.workouts.length;

  return (
    <div>
      <h2 style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-0.02em", marginBottom: 16 }}>Settings</h2>
      <div style={cardS}>
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 14 }}>Competition Info</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}><div><label style={labelS}>Name</label><input style={inputS} value={name} onChange={e => setName(e.target.value)} /></div><div><label style={labelS}>Date</label><input style={inputS} type="date" value={date} onChange={e => setDate(e.target.value)} /></div></div>
        <button style={{ ...btnP, marginTop: 12 }} onClick={saveMeta}>Save</button>
      </div>
      <div style={cardS}>
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 14 }}>Divisions</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>{data.divisions.map(d => { const c = DIVISION_COLORS[d]; return <div key={d} style={{ display: "flex", alignItems: "center", gap: 6, background: c?.soft || T.surface3, borderRadius: T.radius, padding: "6px 12px" }}><span style={{ fontSize: 12, fontWeight: 700, color: c?.text || T.text }}>{d}</span><button onClick={() => removeDiv(d)} style={{ background: "none", border: "none", color: T.textDim, cursor: "pointer", fontSize: 14, padding: 0 }}>×</button></div>; })}</div>
        <div style={{ display: "flex", gap: 8 }}><input style={{ ...inputS, width: 200 }} placeholder="e.g. Women Scaled" value={newDiv} onChange={e => setNewDiv(e.target.value)} onKeyDown={e => e.key === "Enter" && addDiv()} /><button style={btnP} onClick={addDiv}>+ Add</button></div>
      </div>
      <div style={cardS}>
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 14 }}>Stats</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>{[{ l: "Athletes", v: data.athletes.length, c: T.accent }, { l: "Workouts", v: data.workouts.length, c: T.blue }, { l: "Scores", v: `${total}/${max}`, c: T.green }, { l: "Divisions", v: data.divisions.length, c: T.yellow }].map(({ l, v, c }) => <div key={l} style={{ background: T.surface2, borderRadius: T.radius, padding: 14, textAlign: "center" }}><div style={{ fontSize: 22, fontWeight: 800, color: c, fontFamily: T.fontMono }}>{v}</div><div style={{ fontSize: 10, color: T.textMuted, marginTop: 3, textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 700 }}>{l}</div></div>)}</div>
      </div>
      <div style={cardS}>
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 6, color: "#EF4444" }}>Danger Zone</div>
        <p style={{ fontSize: 12, color: T.textMuted, marginBottom: 12 }}>Permanently delete all data.</p>
        <button style={{ ...btnG, borderColor: "#EF4444", color: "#EF4444" }} onClick={resetAll}>Reset All Data</button>
      </div>
    </div>
  );
}
