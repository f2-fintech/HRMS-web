"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import { auth } from "@/libs/firebase";

declare global {
  interface Window { recaptchaVerifier: any; }
}

export default function TrustMeetPage() {

  const employee =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("user") || "{}")
      : {};

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
  const [step, setStep] = useState<"form" | "meeting" | "otp" | "completed">("form");
  const [loading, setLoading] = useState(false);
  const [dashboard, setDashboard] = useState<any>(null);
  const [employeeList, setEmployeeList] = useState<any[]>([]);

  const fetchDashboard = async () => {
    try {
      if (userRole === "1") {
        const res = await axios.get(
          `${process.env.NEXT_PUBLIC_APP_URL}/trustmeet/dashboard/admin-summary?companyId=${companyId}`
        );
        console.log(res.data, "hgcnah");
        setDashboard(res.data.dashboard);
        setEmployeeList(res.data.employees || []);
      } else {
        const res = await axios.get(
          `${process.env.NEXT_PUBLIC_APP_URL}/trustmeet/dashboard/my-summary/${employeeId}`
        );
        setDashboard(res.data.dashboard);
        setMyVisits(res.data.visits || []);
      }
    } catch (e) { console.error(e); }
  };

  useEffect(() => { fetchDashboard(); }, []);

  const createVisit = async () => {
    if (!doctorName || !doctorPhone) { alert("Please fill all details"); return; }
    setLoading(true);
    try {
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_APP_URL}/trustmeet/create`,
        {
          employeeId, employeeName, companyId, doctorName, doctorPhone,
          doctorLat: 28.6139, doctorLng: 77.2090, currentLat: 28.6139, currentLng: 77.2090
        }
      );
      setVisitId(res.data.visitId);
      setStep("meeting");
      fetchDashboard();
    } catch (e: any) {
      alert(e?.response?.data?.message || e.message);
    }
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
    } catch {
      alert("Wrong OTP ❌");
    }
    setLoading(false);
  };

  const reset = () => {
    setStep("form"); setDoctorName(""); setDoctorPhone(""); setFeedback("");
    setVisitId(""); setOtp(""); setConfirmationResult(null);
    window.recaptchaVerifier = null;
  };

  const fmtTime = (t: string) => {
    if (!t) return "—";
    // Already formatted string hai, directly return karo
    return t;
  };

  const duration = (s: string, e: string) => {
    if (!s || !e) return "—";
    // "30/5/2026, 2:23:16 pm" → parse karo manually
    const parseIndianDate = (str: string) => {
      // "30/5/2026, 2:23:16 pm" format
      const [datePart, timePart] = str.split(", ");
      const [day, month, year] = datePart.split("/");
      return new Date(`${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")} ${timePart}`);
    };
    const start = parseIndianDate(s);
    const end = parseIndianDate(e);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return "—";
    const mins = Math.floor((end.getTime() - start.getTime()) / 60000);
    return mins < 0 ? "—" : `${mins} mins`;
  };
  const steps = ["form", "meeting", "otp", "completed"];
  const stepIdx = steps.indexOf(step);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">

        {/* ── Header ── */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <p className="text-xs font-semibold tracking-widest text-indigo-500 uppercase mb-1">TrustMeet</p>
            <h1 className="text-2xl font-bold text-gray-900">Visit Tracker</h1>
            <p className="text-sm text-gray-400 mt-1">Welcome back, {employeeName}</p>
          </div>
          <span className="bg-indigo-50 border border-indigo-200 text-indigo-600 text-xs font-medium px-3 py-1 rounded-full">
            {userRole === "1" ? "Admin" : "Employee"}
          </span>
        </div>

        {/* ── Stat Cards ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          <div className="bg-white border border-gray-100 rounded-2xl p-5 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-blue-500 rounded-t-2xl" />
            <p className="text-xs text-gray-400 uppercase tracking-wider font-medium">Total visits</p>
            <p className="text-3xl font-bold text-blue-500 mt-2">{dashboard?.totalVisits ?? 0}</p>
            <p className="text-xs text-gray-400 mt-1">This month</p>
          </div>
          <div className="bg-white border border-gray-100 rounded-2xl p-5 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-green-500 rounded-t-2xl" />
            <p className="text-xs text-gray-400 uppercase tracking-wider font-medium">Completed</p>
            <p className="text-3xl font-bold text-green-500 mt-2">{dashboard?.completedVisits ?? 0}</p>
            <p className="text-xs text-gray-400 mt-1">OTP verified</p>
          </div>
          <div className="bg-white border border-gray-100 rounded-2xl p-5 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-amber-400 rounded-t-2xl" />
            <p className="text-xs text-gray-400 uppercase tracking-wider font-medium">Pending OTP</p>
            <p className="text-3xl font-bold text-amber-500 mt-2">{dashboard?.pendingVisits ?? 0}</p>
            <p className="text-xs text-gray-400 mt-1">Awaiting doctor</p>
          </div>
          {userRole === "1" && (
            <div className="bg-white border border-gray-100 rounded-2xl p-5 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-purple-500 rounded-t-2xl" />
              <p className="text-xs text-gray-400 uppercase tracking-wider font-medium">Employees</p>
              <p className="text-3xl font-bold text-purple-500 mt-2">{dashboard?.totalEmployees ?? 0}</p>
              <p className="text-xs text-gray-400 mt-1">Active reps</p>
            </div>
          )}
        </div>

        {/* ── My Visits Table (non-admin) ── */}
        {userRole !== "1" && myVisits.length > 0 && (
          <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden mb-6">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-base font-semibold text-gray-800">My visits</h2>
              <span className="text-xs text-gray-400 bg-gray-50 px-3 py-1 rounded-full">{myVisits.length} total</span>
            </div>
            <div className="overflow-x-auto max-h-80 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    {["Doctor", "Contact", "Start", "End", "Duration", "OTP", "Feedback", "Status"].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {myVisits.map(v => (
                    <tr key={v._id} className="border-t border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-gray-800">{v.doctorName}</td>
                      <td className="px-4 py-3 text-gray-500 font-mono text-xs">+91 {v.doctorPhone}</td>
                      <td className="px-4 py-3 text-blue-600 font-mono text-xs">{fmtTime(v.startTime)}</td>
                      <td className="px-4 py-3 text-red-500 font-mono text-xs">{fmtTime(v.endTime)}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{duration(v.startTime, v.endTime)}</td>
                      <td className="px-4 py-3">
                        {v.otpVerified
                          ? <span className="bg-green-50 text-green-700 border border-green-200 text-xs font-semibold px-2 py-1 rounded-full">Verified</span>
                          : <span className="bg-red-50 text-red-600 border border-red-200 text-xs font-semibold px-2 py-1 rounded-full">Pending</span>}
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{v.feedback || "—"}</td>
                      <td className="px-4 py-3">
                        {v.status === "COMPLETED" && <span className="bg-green-50 text-green-700 border border-green-200 text-xs font-semibold px-2 py-1 rounded-full">Completed</span>}
                        {v.status === "OTP_SENT" && <span className="bg-amber-50 text-amber-700 border border-amber-200 text-xs font-semibold px-2 py-1 rounded-full">OTP Sent</span>}
                        {v.status === "MEETING_STARTED" && <span className="bg-blue-50 text-blue-700 border border-blue-200 text-xs font-semibold px-2 py-1 rounded-full">Running</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── Admin Table ── */}
        {userRole === "1" && (
          <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden mb-6">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-base font-semibold text-gray-800">Meetings tracking</h2>
              <span className="text-xs text-gray-400 bg-gray-50 px-3 py-1 rounded-full">{employeeList.length} total</span>
            </div>
            <div className="overflow-x-auto max-h-80 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    {["Employee", "Doctor", "Contact", "Start", "End", "Duration", "OTP", "Feedback", "Status"].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {employeeList.map(v => (
                    <tr key={v._id} className="border-t border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-gray-800">{v.employeeName}</td>
                      <td className="px-4 py-3 text-gray-700">{v.doctorName}</td>
                      <td className="px-4 py-3 text-gray-500 font-mono text-xs">+91 {v.doctorPhone}</td>
                      <td className="px-4 py-3 text-blue-600 font-mono text-xs">{fmtTime(v.startTime)}</td>
                      <td className="px-4 py-3 text-red-500 font-mono text-xs">{fmtTime(v.endTime)}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{duration(v.startTime, v.endTime)}</td>
                      <td className="px-4 py-3">
                        {v.otpVerified
                          ? <span className="bg-green-50 text-green-700 border border-green-200 text-xs font-semibold px-2 py-1 rounded-full">Verified</span>
                          : <span className="bg-red-50 text-red-600 border border-red-200 text-xs font-semibold px-2 py-1 rounded-full">Pending</span>}
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{v.feedback || "—"}</td>
                      <td className="px-4 py-3">
                        {v.status === "COMPLETED" && <span className="bg-green-50 text-green-700 border border-green-200 text-xs font-semibold px-2 py-1 rounded-full">Completed</span>}
                        {v.status === "OTP_SENT" && <span className="bg-amber-50 text-amber-700 border border-amber-200 text-xs font-semibold px-2 py-1 rounded-full">OTP Sent</span>}
                        {v.status === "MEETING_STARTED" && <span className="bg-blue-50 text-blue-700 border border-blue-200 text-xs font-semibold px-2 py-1 rounded-full">Running</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── New Visit Form ── */}
        <p className="text-xs font-medium text-gray-400 uppercase tracking-widest mb-3">Start a new visit</p>

        <div className="max-w-sm mx-auto bg-white border border-gray-100 rounded-2xl p-6">

          {/* Step progress dots */}
          <div className="flex gap-1.5 mb-6">
            {steps.map((_, i) => (
              <div
                key={i}
                className={`h-1 flex-1 rounded-full transition-all duration-300 ${i < stepIdx ? "bg-green-400" : i === stepIdx ? "bg-indigo-500" : "bg-gray-100"
                  }`}
              />
            ))}
          </div>

          {/* Step 1 — Form */}
          {step === "form" && (
            <div>
              <h2 className="text-lg font-bold text-gray-900 mb-5">New visit</h2>
              <label className="text-xs font-medium text-gray-400 uppercase tracking-wider block mb-1.5">Doctor name</label>
              <input
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 mb-4 transition-all"
                placeholder="Dr.Name"
                value={doctorName}
                onChange={e => setDoctorName(e.target.value)}
              />
              <label className="text-xs font-medium text-gray-400 uppercase tracking-wider block mb-1.5">Mobile number</label>
              <input
                type="tel"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={10}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 mb-6 transition-all"
                placeholder="9876543210"
                value={doctorPhone}
                onChange={e => setDoctorPhone(e.target.value)}
              />
              <button
                onClick={createVisit}
                disabled={loading}
                className="w-full bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white py-3 rounded-xl font-semibold text-sm transition-colors"
              >
                {loading ? "Starting..." : "▶ Start visit"}
              </button>
            </div>
          )}

          {/* Step 2 — Meeting Active */}   {step === "meeting" && (

            <div>

              <div className="bg-blue-100 p-4 rounded-xl mb-6">

                <p className="font-bold text-blue-700">

                  🟢 Meeting Active

                </p>

                <p className="mt-2">

                  Doctor: {doctorName}

                </p>

                <p>

                  +91 {doctorPhone}

                </p>
              </div>
              <button
                onClick={endMeeting}
                disabled={loading}
                className="w-full bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white py-3 rounded-xl font-semibold text-sm transition-colors"
              >
                {loading ? "Ending..." : "End meeting"}
              </button>
            </div>
          )}

          {/* Step 3 — OTP */}
          {step === "otp" && (
            <div>
              <h2 className="text-lg font-bold text-gray-900 mb-4">Verify visit</h2>
              <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 mb-4">
                <p className="text-amber-700 font-semibold text-sm">OTP sent to doctor</p>
                <p className="text-xs text-gray-500 mt-1">Ask the doctor for the OTP on their phone</p>
              </div>
              <label className="text-xs font-medium text-gray-400 uppercase tracking-wider block mb-1.5">Enter OTP</label>
              <input
                type="number"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-center text-2xl font-bold tracking-widest text-gray-800 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 mb-4 transition-all"
                placeholder="• • • • • •"
                value={otp}
                onChange={e => setOtp(e.target.value)}
              />
              <label className="text-xs font-medium text-gray-400 uppercase tracking-wider block mb-1.5">Meeting feedback</label>
              <textarea
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 mb-4 resize-none transition-all"
                rows={3}
                placeholder="Notes about this visit..."
                value={feedback}
                onChange={e => setFeedback(e.target.value)}
              />
              <div className="flex justify-center mb-4">
                <div id="recaptcha-container" />
              </div>
              <button
                onClick={verifyOtp}
                disabled={loading}
                className="w-full bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white py-3 rounded-xl font-semibold text-sm transition-colors"
              >
                {loading ? "Verifying..." : "Verify OTP"}
              </button>
            </div>
          )}

          {/* Step 4 — Completed */}
          {step === "completed" && (
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-green-50 border border-green-200 flex items-center justify-center mx-auto mb-4 text-3xl text-green-600">
                ✓
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-1">Visit completed!</h2>
              <p className="text-sm text-gray-400 mb-5">{doctorName} · +91 {doctorPhone}</p>
              <div className="bg-green-50 border border-green-100 rounded-xl p-4 mb-5">
                <p className="text-green-700 font-semibold text-sm">OTP verified</p>
                <p className="text-xs text-gray-500 mt-1">Visit has been recorded successfully</p>
              </div>
              <button
                onClick={reset}
                className="bg-indigo-500 hover:bg-indigo-600 text-white py-3 px-6 rounded-xl font-semibold text-sm transition-colors"
              >
                + New visit
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
