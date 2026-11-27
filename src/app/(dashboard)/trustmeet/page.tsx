"use client"
import { useEffect, useState } from "react";
import axios from "axios";
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import { auth } from "@/libs/firebase";

declare global {
  interface Window { recaptchaVerifier: any; }
}

// ─── Types ────────────────────────────────────────────────────────────────────
type StepType = "form" | "meeting" | "otp" | "completed";

// ─── Design tokens ─────────────────────────────────────────────────────────────
// Ink:    #1B1840  deep ink-violet, headers / hero
// Canvas: #F6F5FB  cool lavender-white background
// Brand:  #5B4FE8  primary violet (richer than before)
// Brand2: #8B7CFF  lighter accent for gradients/glow
// Success:#1F8A5F  Amber:#C97A1B  Danger:#C5403F
const T = {
  ink: "#1B1840",
  inkSoft: "#46437A",
  canvas: "#F6F5FB",
  card: "#FFFFFF",
  border: "#E4E1F5",
  brand: "#5B4FE8",
  brand2: "#8B7CFF",
  brandDeep: "#241F66",
  success: "#1F8A5F",
  successBg: "#E7F6EE",
  successBorder: "#A9DCC2",
  amber: "#B5740F",
  amberBg: "#FBF0DC",
  amberBorder: "#EFCB87",
  danger: "#C5403F",
  dangerBg: "#FBEAE9",
  dangerBorder: "#F0B7B5",
  muted: "#8C89AE",
};

const FONTS_LINK = "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap";

// ─── Badge helper ─────────────────────────────────────────────────────────────
const BADGE: Record<string, { bg: string; color: string; border: string; dot: string }> = {
  green: { bg: T.successBg, color: T.success, border: T.successBorder, dot: T.success },
  amber: { bg: T.amberBg, color: T.amber, border: T.amberBorder, dot: T.amber },
  red: { bg: T.dangerBg, color: T.danger, border: T.dangerBorder, dot: T.danger },
  blue: { bg: "#E8EEFB", color: "#2554A8", border: "#AFC8EF", dot: "#2554A8" },
  indigo: { bg: "#EEECFE", color: T.brandDeep, border: "#C8C1F7", dot: T.brand },
};

function Badge({ variant, label, pulse }: { variant: keyof typeof BADGE; label: string; pulse?: boolean }) {
  const c = BADGE[variant];
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 11px", borderRadius: 20, fontSize: 10.5, fontWeight: 600, letterSpacing: ".03em", background: c.bg, color: c.color, border: `1px solid ${c.border}`, whiteSpace: "nowrap", fontFamily: "'Inter', sans-serif" }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: c.dot, display: "inline-block", flexShrink: 0, ...(pulse ? { animation: "tm-pulse 1.6s infinite" } : {}) }} />
      {label}
    </span>
  );
}

// ─── Status badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  if (status === "COMPLETED") return <Badge variant="green" label="Completed" />;
  if (status === "OTP_SENT") return <Badge variant="amber" label="OTP sent" />;
  if (status === "MEETING_STARTED") return <Badge variant="blue" label="Running" pulse />;
  return null;
}

// ─── OTP badge ────────────────────────────────────────────────────────────────
function OtpBadge({ verified }: { verified: boolean }) {
  return verified ? <Badge variant="green" label="Verified" /> : <Badge variant="red" label="Pending" />;
}

// ─── Step indicator — a "trust seal" that fills in as each step is verified ───
const STEPS: { key: StepType; label: string }[] = [
  { key: "form", label: "Details" },
  { key: "meeting", label: "Visit" },
  { key: "otp", label: "Verify" },
  { key: "completed", label: "Sealed" },
];

function StepIndicator({ current }: { current: StepType }) {
  const ci = STEPS.findIndex(s => s.key === current);
  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{ display: "flex", alignItems: "center" }}>
        {STEPS.map((s, i) => {
          const done = ci > i;
          const active = ci === i;
          return (
            <div key={s.key} style={{ display: "flex", alignItems: "center", flex: i < STEPS.length - 1 ? 1 : "none" }}>
              <div style={{
                width: 30, height: 30, borderRadius: "50%", display: "flex", alignItems: "center",
                justifyContent: "center", fontSize: 11, fontWeight: 700, flexShrink: 0, zIndex: 1,
                fontFamily: "'Space Grotesk', sans-serif",
                background: done ? `linear-gradient(135deg, ${T.brand}, ${T.brand2})` : active ? "#fff" : "#fff",
                border: `1.5px solid ${done || active ? T.brand : T.border}`,
                color: done ? "#fff" : active ? T.brand : T.muted,
                boxShadow: active ? `0 0 0 4px ${T.brand}1A` : "none",
                transition: "all .25s ease",
              }}>
                {done ? "✓" : i + 1}
              </div>
              {i < STEPS.length - 1 && (
                <div style={{ flex: 1, height: 1.5, background: ci > i ? T.brand : T.border, margin: "0 4px", transition: "background .25s ease" }} />
              )}
            </div>
          );
        })}
      </div>
      <div style={{ display: "flex", marginTop: 8 }}>
        {STEPS.map((s, i) => (
          <div key={s.key} style={{
            flex: i < STEPS.length - 1 ? 1 : "none",
            width: i === STEPS.length - 1 ? 30 : undefined,
            textAlign: i === 0 ? "left" : i === STEPS.length - 1 ? "right" : "center",
            fontSize: 9.5, fontWeight: 600, letterSpacing: ".06em", textTransform: "uppercase",
            color: ci >= i ? T.brand : T.muted,
            fontFamily: "'Inter', sans-serif",
          }}>
            {s.label}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Duration formatting helper (minutes + seconds) ───────────────────────────
const formatDuration = (start: string, end: string) => {
  if (!start || !end) return "—";
  const totalSeconds = Math.floor((new Date(end).getTime() - new Date(start).getTime()) / 1000);
  if (isNaN(totalSeconds) || totalSeconds < 0) return "—";
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${mins}m ${secs}s`;
};

// ─── Feedback Modal ───────────────────────────────────────────────────────────
function FeedbackModal({ visit, onClose }: { visit: any; onClose: () => void }) {
  const dur = formatDuration(visit.startTime, visit.endTime);

  return (
    <div
      onClick={onClose}
      style={{ position: "fixed", inset: 0, zIndex: 50, background: "rgba(27,24,64,0.45)", backdropFilter: "blur(2px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ background: T.card, borderRadius: 18, border: `1px solid ${T.border}`, padding: 26, width: 408, maxWidth: "100%", boxShadow: "0 24px 60px rgba(27,24,64,0.22)", fontFamily: "'Inter', sans-serif" }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 18 }}>
          <div>
            <p style={{ fontSize: 15, fontWeight: 700, color: T.ink, fontFamily: "'Space Grotesk', sans-serif" }}>Feedback — {visit.doctorName}</p>
            <p style={{ fontSize: 12, color: T.muted, marginTop: 4 }}>
              {visit.employeeName} · {visit.doctorPhone ? `+91 ${visit.doctorPhone}` : ""}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{ background: T.canvas, border: `1px solid ${T.border}`, borderRadius: 9, width: 30, height: 30, cursor: "pointer", color: T.muted, fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", transition: "background .15s" }}
            onMouseEnter={e => (e.currentTarget.style.background = "#ECEAF8")}
            onMouseLeave={e => (e.currentTarget.style.background = T.canvas)}
          >
            ✕
          </button>
        </div>

        {/* Meta */}
        <div style={{ display: "flex", gap: 8, marginBottom: 18, padding: 14, background: `linear-gradient(135deg, #F8F7FD, #EFEDFB)`, border: `1px solid ${T.border}`, borderRadius: 12 }}>
          {[{ l: "Employee", v: visit.employeeName || "—" }, { l: "Duration", v: dur }, { l: "Status", v: (visit.status || "").replace("_", " ") }].map(({ l, v }, i, arr) => (
            <div key={l} style={{ flex: 1, textAlign: "center", ...(i < arr.length - 1 ? { borderRight: `1px solid ${T.border}`, paddingRight: 8 } : {}) }}>
              <p style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".09em", color: T.brand, marginBottom: 4 }}>{l}</p>
              <p style={{ fontSize: 12.5, fontWeight: 600, color: T.ink, fontFamily: l === "Duration" ? "'JetBrains Mono', monospace" : "inherit" }}>{v}</p>
            </div>
          ))}
        </div>

        {/* Body */}
        {visit.feedback ? (
          <div style={{ background: T.canvas, border: `1px solid ${T.border}`, borderRadius: 12, padding: "16px 18px", fontSize: 13.5, color: T.inkSoft, lineHeight: 1.65, fontStyle: "italic", position: "relative" }}>
            <span style={{ position: "absolute", top: 8, left: 12, fontSize: 26, color: T.brand2, opacity: .5, fontFamily: "'Space Grotesk', sans-serif" }}>“</span>
            <span style={{ paddingLeft: 14 }}>{visit.feedback}</span>
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: "26px 0", color: T.muted }}>
            <div style={{ fontSize: 26, marginBottom: 8, opacity: .6 }}>📝</div>
            <p style={{ fontSize: 13 }}>No feedback recorded for this visit.</p>
          </div>
        )}

        <button
          onClick={onClose}
          style={{ width: "100%", marginTop: 18, padding: "11px", borderRadius: 10, background: T.canvas, border: `1px solid ${T.border}`, fontSize: 13, cursor: "pointer", color: T.inkSoft, fontWeight: 600, transition: "background .15s" }}
          onMouseEnter={e => (e.currentTarget.style.background = "#ECEAF8")}
          onMouseLeave={e => (e.currentTarget.style.background = T.canvas)}
        >
          Close
        </button>
      </div>
    </div>
  );
}

// ─── Avatar color helper ──────────────────────────────────────────────────────
const AVATAR_RAMPS = [
  { bg: "#EEECFE", border: "#C8C1F7", text: T.brandDeep },
  { bg: "#E1F5EE", border: "#86D3B4", text: "#0E5E45" },
  { bg: T.amberBg, border: T.amberBorder, text: T.amber },
  { bg: "#E8EEFB", border: "#AFC8EF", text: "#2554A8" },
  { bg: T.dangerBg, border: T.dangerBorder, text: T.danger },
];
const avatarRamp = (name: string) => AVATAR_RAMPS[(name?.charCodeAt(0) || 65) % AVATAR_RAMPS.length];
const formatDateTime = (date: string) => {
  if (!date) return "—";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
    hour12: true,
    timeZone: "Asia/Kolkata",
  });
};

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function TrustMeetPage() {
  const employee =
    typeof window !== "undefined" ? JSON.parse(localStorage.getItem("user") || "{}") : {};

  const userRole = employee?.role;
  const employeeId = employee?._id || employee?.id;
  const employeeName = employee?.name || "Employee";
  const companyId = employee?.company_id || employee?.companyId;

  const [doctorName, setDoctorName] = useState("");
  const [doctorPhone, setDoctorPhone] = useState("");
  const [feedback, setFeedback] = useState("");
  const [visitId, setVisitId] = useState("");
  const [otp, setOtp] = useState("");
  const [myVisits, setMyVisits] = useState<any[]>([]);
  const [confirmationResult, setConfirmationResult] = useState<any>(null);
  const [step, setStep] = useState<StepType>("form");
  const [loading, setLoading] = useState(false);
  const [dashboard, setDashboard] = useState<any>(null);
  const [employeeList, setEmployeeList] = useState<any[]>([]);
  const [selectedFeedback, setSelectedFeedback] = useState<any>(null);
  const [resendLoading, setResendLoading] = useState(false);

  const isAdmin = userRole === "1";

  // ─── Pre-initialize an invisible reCAPTCHA once, on mount ───────────────────
  useEffect(() => {
    if (typeof window === "undefined") return;

    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, "recaptcha-container", {
        size: "invisible",
      });
      window.recaptchaVerifier.render().catch((e: any) => console.log("recaptcha render error", e));
    }

    return () => {
      if (window.recaptchaVerifier) {
        try { window.recaptchaVerifier.clear(); } catch {}
        window.recaptchaVerifier = null;
      }
    };
  }, []);

  const getRecaptchaVerifier = async () => {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, "recaptcha-container", {
        size: "invisible",
      });
      await window.recaptchaVerifier.render();
    }
    return window.recaptchaVerifier;
  };

  const fetchDashboard = async () => {
    try {
      if (isAdmin) {
        const r = await axios.get(`${process.env.NEXT_PUBLIC_APP_URL}/trustmeet/dashboard/admin-summary?companyId=${companyId}`);
        setDashboard(r.data.dashboard);
        setEmployeeList(r.data.employees || []);
      } else {
        const r = await axios.get(`${process.env.NEXT_PUBLIC_APP_URL}/trustmeet/dashboard/my-summary/${employeeId}`);
        setDashboard(r.data.dashboard);
        setMyVisits(r.data.visits || []);
      }
    } catch (e) { console.log(e); }
  };

  useEffect(() => { fetchDashboard(); }, []);

  const createVisit = async () => {
    if (!doctorName || !doctorPhone) { alert("Please fill all details"); return; }
    setLoading(true);
    try {
      const r = await axios.post(`${process.env.NEXT_PUBLIC_APP_URL}/trustmeet/create`, {
        employeeId, employeeName, companyId, doctorName, doctorPhone,
        doctorLat: 28.6139, doctorLng: 77.2090, currentLat: 28.6139, currentLng: 77.2090,
      });
      setVisitId(r.data.visitId);
      setStep("meeting");
      fetchDashboard();
    } catch (e: any) { alert(e?.response?.data?.message || e.message); }
    setLoading(false);
  };

  const endMeeting = async () => {
    setLoading(true);
    try {
      await axios.post(`${process.env.NEXT_PUBLIC_APP_URL}/trustmeet/end-meeting`, {
        visitId, currentLat: 28.6139, currentLng: 77.2090,
      });
      const verifier = await getRecaptchaVerifier();
      const result = await signInWithPhoneNumber(auth, `+91${doctorPhone}`, verifier);
      setConfirmationResult(result);
      setStep("otp");
    } catch (e: any) {
      alert(e?.response?.data?.message || e.message);
      if (window.recaptchaVerifier) {
        try { window.recaptchaVerifier.clear(); } catch {}
        window.recaptchaVerifier = null;
      }
    }
    setLoading(false);
  };

  const verifyOtp = async () => {
    if (!otp) { alert("Please enter OTP"); return; }
    setLoading(true);
    try {
      await confirmationResult.confirm(otp);
      await axios.post(`${process.env.NEXT_PUBLIC_APP_URL}/trustmeet/verify-otp`, { visitId, feedback });
      setStep("completed");
      fetchDashboard();
    } catch { alert("Wrong OTP ❌"); }
    setLoading(false);
  };

  const resendOtp = async () => {
    setLoading(true);

    try {
      await axios.post(
        `${process.env.NEXT_PUBLIC_APP_URL}/trustmeet/resend-otp`,
        { visitId }
      );

      const verifier = await getRecaptchaVerifier();

      const result =
        await signInWithPhoneNumber(
          auth,
          `+91${doctorPhone}`,
          verifier
        );

      setConfirmationResult(result);
      setOtp("");
      alert("OTP resent successfully ✅");

    } catch (error: any) {
      console.log(error);
      alert(
        error?.response?.data?.message ||
        "Failed to resend OTP"
      );
      if (window.recaptchaVerifier) {
        try { window.recaptchaVerifier.clear(); } catch {}
        window.recaptchaVerifier = null;
      }
    }

    setLoading(false);
  };

  const reset = () => {
    setStep("form"); setDoctorName(""); setDoctorPhone("");
    setFeedback(""); setVisitId(""); setOtp("");
    setConfirmationResult(null);
    if (window.recaptchaVerifier) {
      try { window.recaptchaVerifier.clear(); } catch {}
      window.recaptchaVerifier = null;
    }
  };

  const duration = formatDuration;

  const statCards = [
    { label: "Total visits", value: dashboard?.totalVisits ?? 0, accent: T.brand },
    { label: "Completed", value: dashboard?.completedVisits ?? 0, accent: T.success },
    { label: "Pending OTP", value: dashboard?.pendingVisits ?? 0, accent: T.amber },
    ...(isAdmin ? [{ label: "Employees", value: dashboard?.totalEmployees ?? 0, accent: "#2554A8" }] : []),
  ];

  const tableData = isAdmin ? employeeList : myVisits;

  // Input / button shared styles
  const inp: React.CSSProperties = {
    width: "100%", padding: "11px 14px", borderRadius: 10, fontSize: 13.5, outline: "none",
    background: "#fff", border: `1px solid ${T.border}`, color: T.ink,
    fontFamily: "'Inter', sans-serif", transition: "border-color .15s, box-shadow .15s",
  };
  const btnPrimary: React.CSSProperties = {
    width: "100%", padding: "12px", borderRadius: 11,
    background: `linear-gradient(135deg, ${T.brand}, #6E5FF0)`,
    color: "#fff", border: "none", fontSize: 13.5, fontWeight: 600, cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
    boxShadow: `0 8px 20px ${T.brand}40`, transition: "transform .12s, box-shadow .12s",
    fontFamily: "'Inter', sans-serif",
  };
  const btnDanger: React.CSSProperties = {
    width: "100%", padding: "12px", borderRadius: 11,
    background: T.dangerBg, color: T.danger, border: `1px solid ${T.dangerBorder}`,
    fontSize: 13.5, fontWeight: 600, cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
    transition: "background .15s", fontFamily: "'Inter', sans-serif",
  };
  const btnSuccess: React.CSSProperties = {
    width: "100%", padding: "12px", borderRadius: 11,
    background: T.successBg, color: T.success, border: `1px solid ${T.successBorder}`,
    fontSize: 13.5, fontWeight: 600, cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
    transition: "background .15s", fontFamily: "'Inter', sans-serif",
  };

  const hoverLift = (e: React.MouseEvent<HTMLButtonElement>, on: boolean) => {
    e.currentTarget.style.transform = on ? "translateY(-1px)" : "translateY(0)";
    e.currentTarget.style.boxShadow = on ? `0 12px 26px ${T.brand}55` : `0 8px 20px ${T.brand}40`;
  };

  return (
    <div style={{ minHeight: "100vh", background: T.canvas, color: T.ink, fontFamily: "'Inter', sans-serif" }}>
      <link rel="stylesheet" href={FONTS_LINK} />
      <style>{`
        @keyframes tm-pulse { 0%,100%{opacity:1} 50%{opacity:.35} }
        @keyframes tm-livepulse { 0%{box-shadow:0 0 0 0 rgba(91,79,232,.4)} 70%{box-shadow:0 0 0 9px rgba(91,79,232,0)} 100%{box-shadow:0 0 0 0 rgba(91,79,232,0)} }
        @keyframes tm-fadeup { from{opacity:0; transform:translateY(8px)} to{opacity:1; transform:translateY(0)} }
        input[type=number]::-webkit-outer-spin-button,
        input[type=number]::-webkit-inner-spin-button{-webkit-appearance:none;margin:0}
        .tm-anim { animation: tm-fadeup .4s ease both; }
        input:focus, textarea:focus { border-color: ${T.brand} !important; box-shadow: 0 0 0 3px ${T.brand}22; }
        .tm-row:hover { background: #F8F7FD !important; }
      `}</style>

      {selectedFeedback && (
        <FeedbackModal visit={selectedFeedback} onClose={() => setSelectedFeedback(null)} />
      )}

      {/* ── Hero header band ── */}
      <div style={{
        background: `linear-gradient(135deg, ${T.brandDeep} 0%, ${T.ink} 55%, #100E2E 100%)`,
        padding: "30px 24px 56px",
        position: "relative",
        overflow: "hidden",
      }}>
        <div style={{
          position: "absolute", top: -80, right: -60, width: 280, height: 280, borderRadius: "50%",
          background: `radial-gradient(circle, ${T.brand2}33, transparent 70%)`,
        }} />
        <div style={{ maxWidth: 960, margin: "0 auto", position: "relative", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 38, height: 38, borderRadius: 11,
              background: `linear-gradient(135deg, ${T.brand}, ${T.brand2})`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 17, fontWeight: 700, color: "#fff", flexShrink: 0,
              boxShadow: `0 6px 16px ${T.brand}55`,
            }}>✓</div>
            <div>
              <p style={{ fontSize: 21, fontWeight: 700, color: "#fff", fontFamily: "'Space Grotesk', sans-serif", letterSpacing: "-.01em" }}>TrustMeet</p>
              <p style={{ fontSize: 12.5, color: "#B6B2E8", marginTop: 1 }}>Welcome back, {employeeName}</p>
            </div>
          </div>
          {isAdmin && <Badge variant="indigo" label="Admin" />}
        </div>
      </div>

      <div style={{ maxWidth: 960, margin: "-34px auto 0", padding: "0 24px 40px" }}>

        {/* Stat cards */}
        <div className="tm-anim" style={{ display: "grid", gridTemplateColumns: `repeat(${statCards.length},1fr)`, gap: 14, marginBottom: 28 }}>
          {statCards.map(({ label, value, accent }) => (
            <div key={label} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: "20px 20px", position: "relative", overflow: "hidden", boxShadow: "0 4px 14px rgba(27,24,64,0.06)" }}>
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: accent }} />
              <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".1em", color: T.muted, marginBottom: 9 }}>{label}</p>
              <p style={{ fontSize: 32, fontWeight: 700, color: T.ink, fontFamily: "'Space Grotesk', sans-serif" }}>{value}</p>
            </div>
          ))}
        </div>

        {/* Visits table */}
        {tableData.length > 0 && (
          <div className="tm-anim" style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 16, marginBottom: 28, overflow: "hidden", boxShadow: "0 4px 14px rgba(27,24,64,0.06)" }}>
            <div style={{ padding: "16px 22px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: `1px solid ${T.border}`, background: "linear-gradient(135deg, #F8F7FD, #F1EFFC)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: T.brand, display: "inline-block", animation: "tm-pulse 1.6s infinite" }} />
                <span style={{ fontSize: 11.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".08em", color: T.brandDeep, fontFamily: "'Space Grotesk', sans-serif" }}>
                  {isAdmin ? "Meetings tracking" : "My visits"}
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {isAdmin && <Badge variant="indigo" label="Live" pulse />}
                <span style={{ fontSize: 11, color: T.inkSoft, background: "#fff", border: `1px solid ${T.border}`, padding: "4px 11px", borderRadius: 20, fontWeight: 500 }}>
                  {tableData.length} records
                </span>
              </div>
            </div>

            <div style={{ overflowX: "auto", maxHeight: 460, overflowY: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                <thead>
                  <tr style={{ background: "#FAFAFD", position: "sticky", top: 0, zIndex: 1 }}>
                    {[
                      ...(isAdmin ? ["Employee"] : []),
                      "Doctor", "Contact", "Start", "End", "Duration", "OTP", "Feedback", "Status"
                    ].map(h => (
                      <th key={h} style={{ padding: "11px 16px", textAlign: "left", fontSize: 9, fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: T.muted, borderBottom: `1px solid ${T.border}`, whiteSpace: "nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tableData.map((visit) => {
                    const av = avatarRamp(visit.employeeName || "");
                    return (
                      <tr
                        key={visit._id}
                        className="tm-row"
                        style={{ borderBottom: `1px solid #EEECF8`, transition: "background .12s", cursor: "default" }}
                      >
                        {isAdmin && (
                          <td style={{ padding: "13px 16px", whiteSpace: "nowrap" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                              <div style={{ width: 29, height: 29, borderRadius: "50%", background: av.bg, border: `1px solid ${av.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10.5, fontWeight: 700, color: av.text, flexShrink: 0 }}>
                                {visit.employeeName?.charAt(0)?.toUpperCase()}
                              </div>
                              <span style={{ fontSize: 12.5, fontWeight: 600, color: T.ink }}>{visit.employeeName}</span>
                            </div>
                          </td>
                        )}
                        <td style={{ padding: "13px 16px", fontSize: 12.5, color: T.inkSoft, fontWeight: 500, whiteSpace: "nowrap" }}>{visit.doctorName}</td>
                        <td style={{ padding: "13px 16px", fontSize: 11.5, color: T.muted, fontFamily: "'JetBrains Mono', monospace", whiteSpace: "nowrap" }}>+91 {visit.doctorPhone}</td>

                        <td style={{ padding: "13px 16px", fontSize: 12, color: "#2554A8", whiteSpace: "nowrap", fontFamily: "'JetBrains Mono', monospace" }}>
                          {formatDateTime(visit.startTime)}
                        </td>
                        <td style={{ padding: "13px 16px", fontSize: 12, color: "#2554A8", whiteSpace: "nowrap", fontFamily: "'JetBrains Mono', monospace" }}>
                          {formatDateTime(visit.endTime)}
                        </td>
                        <td style={{ padding: "13px 16px", whiteSpace: "nowrap" }}>
                          {visit.startTime && visit.endTime ? (
                            <span style={{ fontSize: 11, color: T.brand, background: "#EEECFE", border: `1px solid #C8C1F7`, borderRadius: 7, padding: "3px 9px", fontFamily: "'JetBrains Mono', monospace", fontWeight: 500 }}>
                              {duration(visit.startTime, visit.endTime)}
                            </span>
                          ) : <span style={{ color: T.muted }}>—</span>}
                        </td>
                        <td style={{ padding: "13px 16px" }}>
                          <OtpBadge verified={visit.otpVerified} />
                        </td>
                        <td style={{ padding: "13px 16px" }}>
                          <button
                            onClick={() => setSelectedFeedback(visit)}
                            style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "5px 12px", borderRadius: 9, border: `1px solid ${T.border}`, background: "#fff", fontSize: 11, color: T.inkSoft, fontWeight: 500, cursor: "pointer", whiteSpace: "nowrap", transition: "background .12s, border-color .12s" }}
                            onMouseEnter={e => { e.currentTarget.style.background = "#F1EFFC"; e.currentTarget.style.borderColor = "#C8C1F7"; }}
                            onMouseLeave={e => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.borderColor = T.border; }}
                          >
                            <span style={{ color: T.brand, fontSize: 13 }}>👁</span>
                            {visit.feedback ? "View feedback" : "No notes"}
                          </button>
                        </td>
                        <td style={{ padding: "13px 16px" }}>
                          <StatusBadge status={visit.status} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Visit flow card */}
        <div className="tm-anim" style={{ maxWidth: 440, margin: "0 auto", background: T.card, border: `1px solid ${T.border}`, borderRadius: 20, padding: 30, boxShadow: "0 10px 32px rgba(27,24,64,0.08)" }}>
          <StepIndicator current={step} />

          {/* Step 1 — Form */}
          {step === "form" && (
            <div className="tm-anim">
              <p style={{ fontSize: 15, fontWeight: 700, marginBottom: 4, color: T.ink, fontFamily: "'Space Grotesk', sans-serif" }}>Start a new visit</p>
              <p style={{ fontSize: 12.5, color: T.muted, marginBottom: 22 }}>Enter the doctor's details to begin tracking</p>

              <label style={{ display: "block", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".1em", color: T.muted, marginBottom: 7 }}>Doctor name</label>
              <input style={{ ...inp, marginBottom: 16 }} placeholder="Dr. Anil Sharma" value={doctorName} onChange={e => setDoctorName(e.target.value)} />

              <label style={{ display: "block", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".1em", color: T.muted, marginBottom: 7 }}>Mobile number</label>
              <div style={{ display: "flex", alignItems: "center", marginBottom: 24, borderRadius: 10, overflow: "hidden", border: `1px solid ${T.border}`, transition: "border-color .15s, box-shadow .15s" }}>
                <span style={{ padding: "11px 13px", fontSize: 13.5, color: T.muted, borderRight: `1px solid ${T.border}`, background: T.canvas, fontFamily: "'JetBrains Mono', monospace" }}>+91</span>
                <input type="number" style={{ flex: 1, background: "transparent", padding: "11px 13px", fontSize: 13.5, color: T.ink, outline: "none", border: "none", fontFamily: "'JetBrains Mono', monospace" }} placeholder="9876543210" value={doctorPhone} onChange={e => setDoctorPhone(e.target.value)} />
              </div>

              <button
                style={btnPrimary}
                onClick={createVisit}
                disabled={loading}
                onMouseEnter={e => hoverLift(e, true)}
                onMouseLeave={e => hoverLift(e, false)}
              >
                {loading ? "Starting…" : "▶  Start visit"}
              </button>
            </div>
          )}

          {/* Step 2 — Meeting */}
          {step === "meeting" && (
            <div className="tm-anim">
              <p style={{ fontSize: 15, fontWeight: 700, marginBottom: 4, color: T.ink, fontFamily: "'Space Grotesk', sans-serif" }}>Visit in progress</p>
              <p style={{ fontSize: 12.5, color: T.muted, marginBottom: 22 }}>End the meeting once the visit is complete</p>

              <div style={{ display: "flex", alignItems: "center", gap: 14, borderRadius: 13, padding: 17, marginBottom: 24, background: T.successBg, border: `1px solid ${T.successBorder}` }}>
                <span style={{ width: 11, height: 11, borderRadius: "50%", background: T.success, flexShrink: 0, animation: "tm-livepulse 1.6s infinite" }} />
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: 700, fontSize: 13.5, color: T.ink }}>{doctorName}</p>
                  <p style={{ fontSize: 12, marginTop: 2, color: T.inkSoft, fontFamily: "'JetBrains Mono', monospace" }}>+91 {doctorPhone}</p>
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, color: T.success }}>● Live</span>
              </div>

              <button
                style={btnDanger}
                onClick={endMeeting}
                disabled={loading}
                onMouseEnter={e => (e.currentTarget.style.background = "#F6DDDC")}
                onMouseLeave={e => (e.currentTarget.style.background = T.dangerBg)}
              >
                {loading ? "Ending…" : "⏹  End meeting"}
              </button>
            </div>
          )}

          {/* Step 3 — OTP */}
          {step === "otp" && (
            <div className="tm-anim">
              <div style={{ background: T.amberBg, border: `1px solid ${T.amberBorder}`, padding: 16, borderRadius: 13, marginBottom: 18 }}>
                <p style={{ fontWeight: 700, color: T.amber, fontSize: 13.5 }}>📱 OTP sent to doctor</p>
                <p style={{ fontSize: 12, color: T.inkSoft, marginTop: 4 }}>Ask the doctor to share the code with you</p>
              </div>

              <input
                type="number"
                style={{
                  ...inp, marginBottom: 16, textAlign: "center", fontSize: 26, letterSpacing: "0.3em",
                  fontFamily: "'JetBrains Mono', monospace", padding: "14px 10px", fontWeight: 600,
                }}
                placeholder="••••••"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
              />

              <textarea
                style={{ ...inp, marginBottom: 16, minHeight: 80, resize: "vertical", fontFamily: "'Inter', sans-serif" }}
                placeholder="Meeting feedback"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
              />

              <button
                style={{ ...btnSuccess, marginBottom: 10 }}
                onClick={verifyOtp}
                disabled={loading}
                onMouseEnter={e => (e.currentTarget.style.background = "#DCF1E5")}
                onMouseLeave={e => (e.currentTarget.style.background = T.successBg)}
              >
                {loading ? "Verifying…" : "✓  Verify OTP"}
              </button>

              <button
                onClick={resendOtp}
                disabled={loading}
                style={{
                  width: "100%", background: "transparent", border: "none",
                  color: T.brand, cursor: "pointer", fontSize: 12.5, fontWeight: 600,
                  padding: "6px 0",
                }}
              >
                {loading ? "Sending…" : "Resend OTP"}
              </button>
            </div>
          )}

          {/* Step 4 — Completed */}
          {step === "completed" && (
            <div className="tm-anim" style={{ textAlign: "center" }}>
              <div style={{ borderRadius: 16, padding: 36, marginBottom: 22, background: `linear-gradient(135deg, ${T.successBg}, #DCF1E5)`, border: `1px solid ${T.successBorder}` }}>
                <div style={{
                  width: 60, height: 60, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                  margin: "0 auto 18px", background: `linear-gradient(135deg, ${T.success}, #2BA875)`,
                  boxShadow: `0 8px 20px ${T.success}55`,
                }}>
                  <span style={{ fontSize: 24, color: "#fff" }}>✓</span>
                </div>
                <p style={{ fontSize: 19, fontWeight: 700, marginBottom: 6, color: T.ink, fontFamily: "'Space Grotesk', sans-serif" }}>Visit sealed &amp; verified</p>
                <p style={{ fontSize: 13.5, color: T.inkSoft, fontWeight: 600 }}>{doctorName}</p>
                <p style={{ fontSize: 12, marginTop: 4, color: T.muted, fontFamily: "'JetBrains Mono', monospace" }}>+91 {doctorPhone}</p>
              </div>

              <button
                onClick={reset}
                style={{ padding: "11px 26px", borderRadius: 11, background: "transparent", color: T.brand, border: `1.5px solid ${T.brand}`, fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "background .15s" }}
                onMouseEnter={e => (e.currentTarget.style.background = "#F1EFFC")}
                onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
              >
                + New visit
              </button>
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "center", marginTop: 18 }}>
            <div id="recaptcha-container" />
          </div>
        </div>

      </div>
    </div>
  );
}
