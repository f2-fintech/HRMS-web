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

// ─── Badge helper ─────────────────────────────────────────────────────────────
const BADGE: Record<string, { bg: string; color: string; border: string; dot: string }> = {
  green: { bg: "#EAF3DE", color: "#27500A", border: "#97C459", dot: "#3B6D11" },
  amber: { bg: "#FAEEDA", color: "#633806", border: "#EF9F27", dot: "#BA7517" },
  red: { bg: "#FCEBEB", color: "#791F1F", border: "#F09595", dot: "#A32D2D" },
  blue: { bg: "#E6F1FB", color: "#0C447C", border: "#85B7EB", dot: "#185FA5" },
  indigo: { bg: "#EEEDFE", color: "#3C3489", border: "#AFA9EC", dot: "#534AB7" },
};

function Badge({ variant, label, pulse }: { variant: keyof typeof BADGE; label: string; pulse?: boolean }) {
  const c = BADGE[variant];
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 10px", borderRadius: 20, fontSize: 10, fontWeight: 600, letterSpacing: ".04em", background: c.bg, color: c.color, border: `0.5px solid ${c.border}`, whiteSpace: "nowrap" }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: c.dot, display: "inline-block", flexShrink: 0, ...(pulse ? { animation: "tm-pulse 1.5s infinite" } : {}) }} />
      {label}
    </span>
  );
}

// ─── Status badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  if (status === "COMPLETED") return <Badge variant="green" label="Completed" />;
  if (status === "OTP_SENT") return <Badge variant="amber" label="OTP Sent" />;
  if (status === "MEETING_STARTED") return <Badge variant="blue" label="Running" pulse />;
  return null;
}

// ─── OTP badge ────────────────────────────────────────────────────────────────
function OtpBadge({ verified }: { verified: boolean }) {
  return verified ? <Badge variant="green" label="Verified" /> : <Badge variant="red" label="Pending" />;
}

// ─── Step indicator ───────────────────────────────────────────────────────────
const STEPS: StepType[] = ["form", "meeting", "otp", "completed"];

function StepIndicator({ current }: { current: StepType }) {
  const ci = STEPS.indexOf(current);
  return (
    <div style={{ display: "flex", alignItems: "center", marginBottom: 24 }}>
      {STEPS.map((_, i) => {
        const done = ci > i;
        const active = ci === i;
        return (
          <div key={i} style={{ display: "flex", alignItems: "center", flex: i < STEPS.length - 1 ? 1 : "none" }}>
            <div style={{
              width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center",
              justifyContent: "center", fontSize: 11, fontWeight: 600, flexShrink: 0, zIndex: 1,
              background: done || active ? "#EEEDFE" : "#F1EFE8",
              border: `1.5px solid ${done || active ? "#534AB7" : "#D3D1C7"}`,
              color: done || active ? "#534AB7" : "#888780",
            }}>
              {done ? "✓" : i + 1}
            </div>
            {i < STEPS.length - 1 && (
              <div style={{ flex: 1, height: 1, background: ci > i ? "#534AB7" : "#D3D1C7", margin: "0 2px" }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Feedback Modal ───────────────────────────────────────────────────────────
function FeedbackModal({ visit, onClose }: { visit: any; onClose: () => void }) {
  const dur = visit.startTime && visit.endTime
    ? `${Math.floor((new Date(visit.endTime).getTime() - new Date(visit.startTime).getTime()) / 60000)} mins`
    : "—";

  return (
    <div
      onClick={onClose}
      style={{ position: "fixed", inset: 0, zIndex: 50, background: "rgba(0,0,0,0.35)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ background: "#fff", borderRadius: 16, border: "0.5px solid #D3D1C7", padding: 24, width: 400, maxWidth: "100%", boxShadow: "0 4px 24px rgba(0,0,0,0.08)" }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16 }}>
          <div>
            <p style={{ fontSize: 14, fontWeight: 600, color: "#1a1a1a" }}>Feedback — {visit.doctorName}</p>
            <p style={{ fontSize: 12, color: "#888780", marginTop: 3 }}>
              {visit.employeeName} · {visit.doctorPhone ? `+91 ${visit.doctorPhone}` : ""}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{ background: "#F1EFE8", border: "0.5px solid #D3D1C7", borderRadius: 8, width: 28, height: 28, cursor: "pointer", color: "#888780", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            ✕
          </button>
        </div>

        {/* Meta */}
        <div style={{ display: "flex", gap: 8, marginBottom: 16, padding: 12, background: "#F8F8FF", border: "0.5px solid #AFA9EC", borderRadius: 10 }}>
          {[{ l: "Employee", v: visit.employeeName || "—" }, { l: "Duration", v: dur }, { l: "Status", v: (visit.status || "").replace("_", " ") }].map(({ l, v }, i, arr) => (
            <div key={l} style={{ flex: 1, textAlign: "center", ...(i < arr.length - 1 ? { borderRight: "0.5px solid #AFA9EC", paddingRight: 8 } : {}) }}>
              <p style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".08em", color: "#534AB7", marginBottom: 3 }}>{l}</p>
              <p style={{ fontSize: 12, fontWeight: 500, color: "#3C3489" }}>{v}</p>
            </div>
          ))}
        </div>

        {/* Body */}
        {visit.feedback ? (
          <div style={{ background: "#F8F8FF", border: "0.5px solid #AFA9EC", borderRadius: 10, padding: "14px 16px", fontSize: 13, color: "#3C3489", lineHeight: 1.6, fontStyle: "italic" }}>
            "{visit.feedback}"
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: "24px 0", color: "#888780" }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>📝</div>
            <p style={{ fontSize: 13 }}>No feedback recorded for this visit.</p>
          </div>
        )}

        <button
          onClick={onClose}
          style={{ width: "100%", marginTop: 16, padding: "10px", borderRadius: 10, background: "#F1EFE8", border: "0.5px solid #D3D1C7", fontSize: 13, cursor: "pointer", color: "#5F5E5A", fontWeight: 500 }}
        >
          Close
        </button>
      </div>
    </div>
  );
}

// ─── Avatar color helper ──────────────────────────────────────────────────────
const AVATAR_RAMPS = [
  { bg: "#EEEDFE", border: "#AFA9EC", text: "#3C3489" },
  { bg: "#E1F5EE", border: "#5DCAA5", text: "#085041" },
  { bg: "#FAEEDA", border: "#EF9F27", text: "#633806" },
  { bg: "#E6F1FB", border: "#85B7EB", text: "#0C447C" },
  { bg: "#FCEBEB", border: "#F09595", text: "#791F1F" },
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
      if (window.recaptchaVerifier) window.recaptchaVerifier.clear();
      window.recaptchaVerifier = new RecaptchaVerifier(auth, "recaptcha-container", { size: "normal" });
      await window.recaptchaVerifier.render();
      const result = await signInWithPhoneNumber(auth, `+91${doctorPhone}`, window.recaptchaVerifier);
      setConfirmationResult(result);
      setStep("otp");
    } catch (e: any) {
      alert(e?.response?.data?.message || e.message);
      window.recaptchaVerifier = null;
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
  // =========================================
  // RESEND OTP
  // =========================================
  const resendOtp = async () => {
    setLoading(true);

    try {
      // Step 1: Backend ko notify karo
      await axios.post(
        `${process.env.NEXT_PUBLIC_APP_URL}/trustmeet/resend-otp`,
        { visitId }
      );

      // Step 2: Purana recaptcha clear karo
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = null;
      }

      // Step 3: Naya recaptcha banao
      window.recaptchaVerifier =
        new RecaptchaVerifier(
          auth,
          "recaptcha-container",
          { size: "normal" }
        );

      await window.recaptchaVerifier.render();

      // Step 4: Firebase se dobara OTP bhejo
      const result =
        await signInWithPhoneNumber(
          auth,
          `+91${doctorPhone}`,
          window.recaptchaVerifier
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
      window.recaptchaVerifier = null;
    }

    setLoading(false);
  };
  const reset = () => {
    setStep("form"); setDoctorName(""); setDoctorPhone("");
    setFeedback(""); setVisitId(""); setOtp("");
    setConfirmationResult(null); window.recaptchaVerifier = null;
  };

  const duration = (s: string, e: string) =>
    s && e ? `${Math.floor((new Date(e).getTime() - new Date(s).getTime()) / 60000)} mins` : "—";

  const statCards = [
    { label: "Total Visits", value: dashboard?.totalVisits ?? 0, color: "#534AB7", accent: "#534AB7" },
    { label: "Completed", value: dashboard?.completedVisits ?? 0, color: "#3B6D11", accent: "#3B6D11" },
    { label: "Pending OTP", value: dashboard?.pendingVisits ?? 0, color: "#BA7517", accent: "#BA7517" },
    ...(isAdmin ? [{ label: "Employees", value: dashboard?.totalEmployees ?? 0, color: "#185FA5", accent: "#185FA5" }] : []),
  ];

  const tableData = isAdmin ? employeeList : myVisits;

  // Input / button shared styles
  const inp: React.CSSProperties = {
    width: "100%", padding: "10px 13px", borderRadius: 8, fontSize: 13, outline: "none",
    background: "#fff", border: "0.5px solid #D3D1C7", color: "#1a1a1a",
    fontFamily: "inherit",
  };
  const btnPrimary: React.CSSProperties = {
    width: "100%", padding: "11px", borderRadius: 8, background: "#534AB7", color: "#fff",
    border: "none", fontSize: 13, fontWeight: 600, cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
  };
  const btnDanger: React.CSSProperties = {
    width: "100%", padding: "11px", borderRadius: 8,
    background: "#FCEBEB", color: "#791F1F", border: "0.5px solid #F09595",
    fontSize: 13, fontWeight: 600, cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
  };
  const btnSuccess: React.CSSProperties = {
    width: "100%", padding: "11px", borderRadius: 8,
    background: "#EAF3DE", color: "#27500A", border: "0.5px solid #97C459",
    fontSize: 13, fontWeight: 600, cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
  };

  return (
    <div style={{ minHeight: "100vh", background: "#F5F6FA", color: "#1a1a1a", padding: 24 }}>
      <style>{`
        @keyframes tm-pulse { 0%,100%{opacity:1} 50%{opacity:.35} }
        @keyframes tm-livepulse { 0%{box-shadow:0 0 0 0 rgba(83,74,183,.4)} 70%{box-shadow:0 0 0 8px rgba(83,74,183,0)} 100%{box-shadow:0 0 0 0 rgba(83,74,183,0)} }
        input[type=number]::-webkit-outer-spin-button,
        input[type=number]::-webkit-inner-spin-button{-webkit-appearance:none;margin:0}
      `}</style>

      {selectedFeedback && (
        <FeedbackModal visit={selectedFeedback} onClose={() => setSelectedFeedback(null)} />
      )}

      <div style={{ maxWidth: 960, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
          <div>
            <p style={{ fontSize: 20, fontWeight: 600, color: "#1a1a1a" }}>TrustMeet</p>
            <p style={{ fontSize: 13, color: "#888780", marginTop: 3 }}>Welcome, {employeeName}</p>
          </div>
          {isAdmin && <Badge variant="indigo" label="Admin" />}
        </div>

        {/* Stat cards */}
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${statCards.length},1fr)`, gap: 12, marginBottom: 28 }}>
          {statCards.map(({ label, value, color, accent }) => (
            <div key={label} style={{ background: "#fff", border: "0.5px solid #D3D1C7", borderRadius: 12, padding: "18px 20px", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: accent, borderRadius: 0 }} />
              <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".1em", color: "#888780", marginBottom: 8 }}>{label}</p>
              <p style={{ fontSize: 30, fontWeight: 600, color }}>{value}</p>
            </div>
          ))}
        </div>

        {/* Visits table */}
        {tableData.length > 0 && (
          <div style={{ background: "#fff", border: "0.5px solid #D3D1C7", borderRadius: 12, marginBottom: 28, overflow: "hidden" }}>
            {/* Table header bar */}
            <div style={{ padding: "14px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "0.5px solid #D3D1C7", background: "#F8F8FF" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#534AB7", display: "inline-block", animation: "tm-pulse 1.5s infinite" }} />
                <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".08em", color: "#3C3489" }}>
                  {isAdmin ? "Meetings Tracking" : "My Visits"}
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {isAdmin && <Badge variant="indigo" label="Live" pulse />}
                <span style={{ fontSize: 11, color: "#888780", background: "#F1EFE8", border: "0.5px solid #D3D1C7", padding: "3px 10px", borderRadius: 20 }}>
                  {tableData.length} records
                </span>
              </div>
            </div>

            <div style={{ overflowX: "auto", maxHeight: 460, overflowY: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                <thead>
                  <tr style={{ background: "#FAFAFA", position: "sticky", top: 0, zIndex: 1 }}>
                    {[
                      ...(isAdmin ? ["Employee"] : []),
                      "Doctor", "Contact", "Start", "End", "Duration", "OTP", "Feedback", "Status"
                    ].map(h => (
                      <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: 9, fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: "#B4B2A9", borderBottom: "0.5px solid #D3D1C7", whiteSpace: "nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tableData.map((visit) => {
                    const av = avatarRamp(visit.employeeName || "");
                    return (
                      <tr
                        key={visit._id}
                        style={{ borderBottom: "0.5px solid #E8E6E0", transition: "background .12s", cursor: "default" }}
                        onMouseEnter={e => (e.currentTarget.style.background = "#F8F8FF")}
                        onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                      >
                        {isAdmin && (
                          <td style={{ padding: "12px 16px", whiteSpace: "nowrap" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                              <div style={{ width: 28, height: 28, borderRadius: "50%", background: av.bg, border: `0.5px solid ${av.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: av.text, flexShrink: 0 }}>
                                {visit.employeeName?.charAt(0)?.toUpperCase()}
                              </div>
                              <span style={{ fontSize: 12, fontWeight: 500, color: "#1a1a1a" }}>{visit.employeeName}</span>
                            </div>
                          </td>
                        )}
                        <td style={{ padding: "12px 16px", fontSize: 12, color: "#5F5E5A", whiteSpace: "nowrap" }}>{visit.doctorName}</td>
                        <td style={{ padding: "12px 16px", fontSize: 11, color: "#B4B2A9", fontFamily: "monospace", whiteSpace: "nowrap" }}>+91 {visit.doctorPhone}</td>

                       <td style={{ padding: "12px 16px", fontSize: 12, color: "#185FA5", whiteSpace: "nowrap" }}>
  {formatDateTime(visit.startTime)}
</td>
<td style={{ padding: "12px 16px", fontSize: 12, color: "#185FA5", whiteSpace: "nowrap" }}>
  {formatDateTime(visit.endTime)}
</td>
                        <td style={{ padding: "12px 16px", whiteSpace: "nowrap" }}>
                          {visit.startTime && visit.endTime ? (
                            <span style={{ fontSize: 11, color: "#534AB7", background: "#EEEDFE", border: "0.5px solid #AFA9EC", borderRadius: 6, padding: "2px 8px", fontFamily: "monospace" }}>
                              {duration(visit.startTime, visit.endTime)}
                            </span>
                          ) : <span style={{ color: "#B4B2A9" }}>—</span>}
                        </td>
                        <td style={{ padding: "12px 16px" }}>
                          <OtpBadge verified={visit.otpVerified} />
                        </td>
                        <td style={{ padding: "12px 16px" }}>
                          <button
                            onClick={() => setSelectedFeedback(visit)}
                            style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 11px", borderRadius: 8, border: "0.5px solid #D3D1C7", background: "#fff", fontSize: 11, color: "#444441", cursor: "pointer", whiteSpace: "nowrap", transition: "background .12s" }}
                            onMouseEnter={e => (e.currentTarget.style.background = "#F1EFE8")}
                            onMouseLeave={e => (e.currentTarget.style.background = "#fff")}
                          >
                            <span style={{ color: "#534AB7", fontSize: 13 }}>👁</span>
                            {visit.feedback ? "View feedback" : "No notes"}
                          </button>
                        </td>
                        <td style={{ padding: "12px 16px" }}>
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
        <div style={{ maxWidth: 420, margin: "0 auto", background: "#fff", border: "0.5px solid #D3D1C7", borderRadius: 16, padding: 28 }}>
          <StepIndicator current={step} />

          {/* Step 1 — Form */}
          {step === "form" && (
            <div>
              <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 4, color: "#1a1a1a" }}>Start a new visit</p>
              <p style={{ fontSize: 12, color: "#888780", marginBottom: 20 }}>Enter doctor's details to begin tracking</p>

              <label style={{ display: "block", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".1em", color: "#888780", marginBottom: 6 }}>Doctor name</label>
              <input style={{ ...inp, marginBottom: 14 }} placeholder="Dr. Anil Sharma" value={doctorName} onChange={e => setDoctorName(e.target.value)} />

              <label style={{ display: "block", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".1em", color: "#888780", marginBottom: 6 }}>Mobile number</label>
              <div style={{ display: "flex", alignItems: "center", marginBottom: 22, borderRadius: 8, overflow: "hidden", border: "0.5px solid #D3D1C7" }}>
                <span style={{ padding: "10px 12px", fontSize: 13, color: "#888780", borderRight: "0.5px solid #D3D1C7", background: "#F5F6FA" }}>+91</span>
                <input type="number" style={{ flex: 1, background: "transparent", padding: "10px 12px", fontSize: 13, color: "#1a1a1a", outline: "none", border: "none", fontFamily: "inherit" }} placeholder="9876543210" value={doctorPhone} onChange={e => setDoctorPhone(e.target.value)} />
              </div>

              <button style={btnPrimary} onClick={createVisit} disabled={loading}>
                {loading ? "Starting…" : "▶  Start Visit"}
              </button>
            </div>
          )}

          {/* Step 2 — Meeting */}
          {step === "meeting" && (
            <div>
              <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 4, color: "#1a1a1a" }}>Visit in progress</p>
              <p style={{ fontSize: 12, color: "#888780", marginBottom: 20 }}>End the meeting when the visit is complete</p>

              <div style={{ display: "flex", alignItems: "center", gap: 14, borderRadius: 10, padding: 16, marginBottom: 22, background: "#EAF3DE", border: "0.5px solid #97C459" }}>
                <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#3B6D11", flexShrink: 0, animation: "tm-livepulse 1.5s infinite" }} />
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: 600, fontSize: 13, color: "#1a1a1a" }}>{doctorName}</p>
                  <p style={{ fontSize: 12, marginTop: 2, color: "#5F5E5A" }}>+91 {doctorPhone}</p>
                </div>
                <span style={{ fontSize: 11, fontWeight: 600, color: "#3B6D11" }}>● Live</span>
              </div>

              <button style={btnDanger} onClick={endMeeting} disabled={loading}>
                {loading ? "Ending…" : "⏹  End Meeting"}
              </button>
            </div>
          )}

          {/* Step 3 — OTP */}
          {step === "otp" && (
            <div>
              <div className="bg-yellow-100 p-4 rounded-xl mb-4">
                <p className="font-semibold text-yellow-700">
                  📱 OTP Sent To Doctor
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  Ask doctor for OTP
                </p>
              </div>

              <input
                type="number"
                className="border border-gray-200 p-3 w-full mb-4 rounded-xl text-center text-2xl tracking-widest"
                placeholder="Enter OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
              />

              <textarea
                className="border border-gray-200 p-3 w-full mb-4 rounded-xl"
                placeholder="Meeting Feedback"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
              />

              <button
                className="bg-green-500 hover:bg-green-600 text-white w-full py-3 rounded-xl mb-3"
                onClick={verifyOtp}
                disabled={loading}
              >
                {loading ? "Verifying..." : "Verify OTP"}
              </button>

              {/* ✅ RESEND OTP BUTTON */}
              {/* <button
                className="bg-gray-200 hover:bg-gray-300 text-gray-700 w-full py-3 rounded-xl text-sm"
                onClick={resendOtp}
                disabled={loading}
              >
                {loading ? "Sending..." : "🔄 Resend OTP"}
              </button> */}
            </div>
          )}
          {/* <div
            style={{
              display: "flex",
              justifyContent: "center",
              marginBottom: 16,
            }}
          >
            <button
              type="button"
              onClick={resendOtp}
              disabled={resendLoading}
              style={{
                background: "transparent",
                border: "none",
                color: "#534AB7",
                cursor: "pointer",
                fontSize: 13,
                fontWeight: 600,
                textDecoration: "underline",
              }}
            >
              {resendLoading ? "Resending..." : "Resend OTP"}
            </button>
          </div> */}
          {/* Step 4 — Completed */}
          {step === "completed" && (
            <div style={{ textAlign: "center" }}>
              <div style={{ borderRadius: 12, padding: 32, marginBottom: 20, background: "#EAF3DE", border: "0.5px solid #97C459" }}>
                <div style={{ width: 56, height: 56, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", background: "#fff", border: "1.5px solid #3B6D11" }}>
                  <span style={{ fontSize: 22, color: "#3B6D11" }}>✓</span>
                </div>
                <p style={{ fontSize: 18, fontWeight: 600, marginBottom: 6, color: "#27500A" }}>Visit Completed</p>
                <p style={{ fontSize: 13, color: "#5F5E5A" }}>{doctorName}</p>
                <p style={{ fontSize: 12, marginTop: 4, color: "#888780" }}>+91 {doctorPhone}</p>
              </div>

              <button
                onClick={reset}
                style={{ padding: "10px 24px", borderRadius: 10, background: "transparent", color: "#534AB7", border: "1px solid #534AB7", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
              >
                + New Visit
              </button>
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "center", marginTop: 16 }}>
            <div id="recaptcha-container" />
          </div>
        </div>

      </div>
    </div>
  );
}
