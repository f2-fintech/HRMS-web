"use client"
import { useEffect, useState } from "react";
import axios from "axios";

import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
} from "firebase/auth";

import { auth } from "@/libs/firebase";

declare global {
  interface Window {
    recaptchaVerifier: any;
  }
}

export default function TrustMeetPage() {

  // =========================================
  // USER
  // =========================================
  const employee =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("user") || "{}")
      : {};

  const userRole = employee?.role;

  const employeeId =
    employee?._id || employee?.id;

  const employeeName = employee?.name || "Employee";

  const companyId =
    employee?.company_id || employee?.companyId; const [doctorName, setDoctorName] =
      useState("");

  const [doctorPhone, setDoctorPhone] =
    useState("");

  const [feedback, setFeedback] =
    useState("");

  const [visitId, setVisitId] =
    useState("");

  const [otp, setOtp] =
    useState("");

  const [myVisits, setMyVisits] = useState<any[]>([]);
  const [confirmationResult,
    setConfirmationResult] =
    useState<any>(null);

  const [step, setStep] = useState<
    "form" |
    "meeting" |
    "otp" |
    "completed"
  >("form");

  const [loading, setLoading] =
    useState(false);

  const [dashboard, setDashboard] =
    useState<any>(null);

  const [employeeList,
    setEmployeeList] =
    useState<any[]>([]);


  const fetchDashboard = async () => {

    try {

      if (userRole === "1") {

        const response =
          await axios.get(

            `${process.env.NEXT_PUBLIC_APP_URL}/trustmeet/dashboard/admin-summary?companyId=${companyId}`

          );

        setDashboard(
          response.data.dashboard
        );

        setEmployeeList(
          response.data.employees || []
        );
      }

      else {

        const response =
          await axios.get(

            `${process.env.NEXT_PUBLIC_APP_URL}/trustmeet/dashboard/my-summary/${employeeId}`

          );

        setDashboard(
          response.data.dashboard
        );
        setMyVisits(response.data.visits || []);
      }

    } catch (error) {

      console.log(error);
    }
  };

  useEffect(() => {

    fetchDashboard();

  }, []);

  // =========================================
  // CREATE VISIT
  // =========================================
  const createVisit = async () => {

    if (!doctorName || !doctorPhone) {

      alert("Please fill all details");

      return;
    }

    setLoading(true);

    try {

      const response =
        await axios.post(

          `${process.env.NEXT_PUBLIC_APP_URL}/trustmeet/create`,

          {

            employeeId,

            employeeName,

            companyId,

            doctorName,

            doctorPhone,

            doctorLat: 28.6139,
            doctorLng: 77.2090,

            currentLat: 28.6139,
            currentLng: 77.2090,
          }
        );

      setVisitId(
        response.data.visitId
      );

      setStep("meeting");

      fetchDashboard();

    } catch (error: any) {

      console.log(error);

      alert(
        error?.response?.data?.message ||
        error.message
      );
    }

    setLoading(false);
  };

  // =========================================
  // END MEETING
  // =========================================
  const endMeeting = async () => {

    setLoading(true);

    try {
      await axios.post(
        `${process.env.NEXT_PUBLIC_APP_URL}/trustmeet/end-meeting`,
        {
          visitId,
          currentLat: 28.6139,
          currentLng: 77.2090,
        }
      );
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
      }
      window.recaptchaVerifier =
        new RecaptchaVerifier(
          auth,
          "recaptcha-container",
          {
            size: "normal",
          }
        );

      await window.recaptchaVerifier.render();
      const result =
        await signInWithPhoneNumber(

          auth,

          `+91${doctorPhone}`,

          window.recaptchaVerifier
        );

      setConfirmationResult(result);

      setStep("otp");

    } catch (error: any) {

      console.log(error);

      alert(
        error?.response?.data?.message ||
        error.message
      );

      window.recaptchaVerifier = null;
    }

    setLoading(false);
  };

  // =========================================
  // VERIFY OTP
  // =========================================
  const verifyOtp = async () => {
    if (!otp) {
      alert("Please enter OTP");
      return;
    }

    setLoading(true);

    try {
      // Step 1: Firebase verify
      await confirmationResult.confirm(otp);

      // Step 2: Backend sirf status update karo
      await axios.post(
        `${process.env.NEXT_PUBLIC_APP_URL}/trustmeet/verify-otp`,
        {
          visitId,
          feedback,
          // ❌ otp mat bhejo — backend ko chahiye hi nahi ab
        }
      );

      setStep("completed");
      fetchDashboard();

    } catch (error: any) {
      alert("Wrong OTP ❌");
    }

    setLoading(false);
  };

  // =========================================
  // RESET
  // =========================================
  const reset = () => {

    setStep("form");

    setDoctorName("");

    setDoctorPhone("");

    setFeedback("");

    setVisitId("");

    setOtp("");

    setConfirmationResult(null);

    window.recaptchaVerifier = null;
  };

  return (

    <div className="p-6 bg-gray-100 min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">
          TrustMeet Dashboard
        </h1>
        <p className="text-gray-500 mt-1">
          Welcome {employeeName}
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-blue-500 text-white p-5 rounded-2xl shadow-lg">
          <p className="text-sm">
            Total Visits
          </p>
          <h2 className="text-3xl font-bold mt-2">
            {dashboard?.totalVisits || 0}
          </h2>
        </div>

        <div className="bg-green-500 text-white p-5 rounded-2xl shadow-lg">
          <p className="text-sm">
            Completed Visits
          </p>
          <h2 className="text-3xl font-bold mt-2">
            {dashboard?.completedVisits || 0}
          </h2>
        </div>
        <div className="bg-yellow-500 text-white p-5 rounded-2xl shadow-lg">
          <p className="text-sm">
            Pending OTP
          </p>
          <h2 className="text-3xl font-bold mt-2">
            {dashboard?.pendingVisits || 0}
          </h2>
        </div>
        {userRole === "1" && (
          <div className="bg-purple-500 text-white p-5 rounded-2xl shadow-lg">
            <p className="text-sm">
              Total Employees
            </p>
            <h2 className="text-3xl font-bold mt-2">
              {dashboard?.totalEmployees || 0}

            </h2>
          </div>
        )}

      </div>
      {/* ===================================== */}
      {/* MY VISITS TABLE (non-admin) */}
      {/* ===================================== */}
      {userRole !== "1" && myVisits.length > 0 && (
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-8">
          <div className="p-5 border-b">
            <h2 className="text-xl font-bold text-gray-700">
              My Visits
            </h2>
          </div>
          <div className="overflow-x-auto max-h-[500px]">
            <table className="w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-4 text-left">Doctor</th>
                  <th className="p-4 text-left">Contact</th>
                  <th className="p-4 text-left">Start</th>
                  <th className="p-4 text-left">End</th>
                  <th className="p-4 text-left">Duration</th>
                  <th className="p-4 text-left">OTP</th>
                  <th className="p-4 text-left">Feedback</th>
                  <th className="p-4 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {myVisits.map((visit) => (
                  <tr key={visit._id} className="border-b hover:bg-gray-50">
                    <td className="p-4 font-medium">{visit.doctorName}</td>
                    <td className="p-4">+91 {visit.doctorPhone}</td>
                    <td className="p-4 text-blue-600">
                      {visit.startTime ? new Date(visit.startTime).toLocaleString() : "-"}
                    </td>
                    <td className="p-4 text-red-600">
                      {visit.endTime ? new Date(visit.endTime).toLocaleString() : "-"}
                    </td>
                    <td className="p-4">
                      {visit.startTime && visit.endTime
                        ? `${Math.floor((new Date(visit.endTime).getTime() - new Date(visit.startTime).getTime()) / 60000)} mins`
                        : "-"}
                    </td>
                    <td className="p-4">
                      {visit.otpVerified ? (
                        <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold">VERIFIED</span>
                      ) : (
                        <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold">PENDING</span>
                      )}
                    </td>
                    <td className="p-4">{visit.feedback || "-"}</td>
                    <td className="p-4">
                      {visit.status === "COMPLETED" && (
                        <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold">COMPLETED</span>
                      )}
                      {visit.status === "OTP_SENT" && (
                        <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-xs font-bold">OTP SENT</span>
                      )}
                      {visit.status === "MEETING_STARTED" && (
                        <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold">RUNNING</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {/* ===================================== */}
      {/* ADMIN TABLE */}
      {/* ===================================== */}
      {userRole === "1" && (

        <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-8">

          <div className="p-5 border-b">

            <h2 className="text-xl font-bold text-gray-700">

              Meetings Tracking

            </h2>
          </div>

          <div className="overflow-x-auto max-h-[500px]">

            <table className="w-full">

              <thead className="bg-gray-100">

                <tr>

                  <th className="p-4 text-left">

                    Employee

                  </th>

                  <th className="p-4 text-left">

                    Doctor

                  </th>

                  <th className="p-4 text-left">

                    Contact

                  </th>

                  <th className="p-4 text-left">

                    Start

                  </th>

                  <th className="p-4 text-left">

                    End

                  </th>

                  <th className="p-4 text-left">

                    Duration

                  </th>

                  <th className="p-4 text-left">

                    OTP

                  </th>

                  <th className="p-4 text-left">

                    Feedback

                  </th>

                  <th className="p-4 text-left">

                    Status

                  </th>

                </tr>
              </thead>

              <tbody>

                {employeeList.map((visit) => (

                  <tr
                    key={visit._id}
                    className="border-b hover:bg-gray-50"
                  >

                    {/* EMPLOYEE */}
                    <td className="p-4 font-medium">

                      {visit.employeeName}

                    </td>

                    {/* DOCTOR */}
                    <td className="p-4">

                      {visit.doctorName}

                    </td>

                    {/* CONTACT */}
                    <td className="p-4">

                      +91 {visit.doctorPhone}

                    </td>

                    {/* START */}
                    <td className="p-4 text-blue-600">

                      {visit.startTime}

                    </td>

                    {/* END */}
                    <td className="p-4 text-red-600">

                      {visit.endTime || "-"}

                    </td>

                    {/* DURATION */}
                    <td className="p-4">

                      {visit.startTime &&
                        visit.endTime
                        ? `${Math.floor(
                          (
                            new Date(
                              visit.endTime
                            ).getTime() -
                            new Date(
                              visit.startTime
                            ).getTime()
                          ) / 60000
                        )} mins`
                        : "-"
                      }

                    </td>

                    {/* OTP */}
                    <td className="p-4">

                      {visit.otpVerified ? (

                        <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold">

                          VERIFIED

                        </span>

                      ) : (

                        <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold">

                          PENDING

                        </span>
                      )}
                    </td>

                    {/* FEEDBACK */}
                    <td className="p-4">
                      <div className="space-y-2">

                        <div>
                          <b>Employee:</b>{" "}
                          {visit.feedback || "-"}
                        </div>

                        {/* <div>
                          <b>Customer:</b>{" "}
                          {visit.customerFeedback || "-"}
                        </div> */}

                      </div>
                    </td>

                    {/* STATUS */}
                    <td className="p-4">
                      {visit.status === "COMPLETED" && (
                        <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold">
                          COMPLETED
                        </span>
                      )}

                      {visit.status === "OTP_SENT" && (

                        <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-xs font-bold">

                          OTP SENT

                        </span>
                      )}

                      {visit.status === "MEETING_STARTED" && (

                        <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold">

                          RUNNING

                        </span>
                      )}
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ===================================== */}
      {/* MAIN CARD */}
      {/* ===================================== */}
      <div className="max-w-md mx-auto bg-white rounded-2xl shadow-lg p-6">

        <h1 className="text-2xl font-bold text-center mb-6">

          TrustMeet

        </h1>

        {/* ================================= */}
        {/* STEP 1 */}
        {/* ================================= */}
        {step === "form" && (

          <div>

            <label className="text-xs text-gray-500 block mb-1">

              Doctor Name

            </label>

            <input
              className="border border-gray-200 p-3 w-full mb-4 rounded-xl"
              placeholder="Doctor Name"
              value={doctorName}
              onChange={(e) =>
                setDoctorName(
                  e.target.value
                )
              }
            />

            <label className="text-xs text-gray-500 block mb-1">

              Mobile Number

            </label>

            <input
              type="number"
              className="border border-gray-200 p-3 w-full mb-6 rounded-xl"
              placeholder="9876543210"
              value={doctorPhone}
              onChange={(e) =>
                setDoctorPhone(
                  e.target.value
                )
              }
              maxLength={10}
            />

            <button
              className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-xl font-medium"
              onClick={createVisit}
              disabled={loading}
            >

              {loading
                ? "Starting..."
                : "▶ Start Visit"}

            </button>
          </div>
        )}

        {/* ================================= */}
        {/* STEP 2 */}
        {/* ================================= */}
        {step === "meeting" && (

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
              className="bg-red-500 hover:bg-red-600 text-white w-full py-3 rounded-xl"
              onClick={endMeeting}
              disabled={loading}
            >

              {loading
                ? "Ending..."
                : "End Meeting"}

            </button>
          </div>
        )}

        {/* ================================= */}
        {/* STEP 3 */}
        {/* ================================= */}
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
              onChange={(e) =>
                setOtp(e.target.value)
              }
            />

            {/* FEEDBACK */}
            <textarea
              className="border border-gray-200 p-3 w-full mb-4 rounded-xl"
              placeholder="Meeting Feedback"
              value={feedback}
              onChange={(e) =>
                setFeedback(
                  e.target.value
                )
              }
            />

            <button
              className="bg-green-500 hover:bg-green-600 text-white w-full py-3 rounded-xl"
              onClick={verifyOtp}
              disabled={loading}
            >

              {loading
                ? "Verifying..."
                : "Verify OTP"}

            </button>
          </div>
        )}

        {/* ================================= */}
        {/* STEP 4 */}
        {/* ================================= */}
        {step === "completed" && (

          <div className="text-center">

            <div className="bg-green-100 p-6 rounded-xl mb-4">

              <p className="text-5xl mb-3">

                ✅

              </p>

              <p className="font-bold text-xl text-green-700">

                Visit Completed

              </p>

              <p className="text-sm text-gray-600 mt-2">

                Doctor: {doctorName}

              </p>

              <p className="text-sm text-gray-600">

                +91 {doctorPhone}

              </p>
            </div>

            <button
              className="bg-blue-500 hover:bg-blue-600 text-white py-3 px-5 rounded-xl"
              onClick={reset}
            >

              New Visit

            </button>
          </div>
        )}

        {/* RECAPTCHA */}
        {/* RECAPTCHA */}
        <div className="flex justify-center mb-4">
          <div id="recaptcha-container"></div>
        </div>      </div>
    </div>
  );
}
