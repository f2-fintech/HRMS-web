"use client";

import { useState } from "react";
import axios from "axios";
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import { auth } from "@/libs/firebase";

declare global {
  interface Window {
    recaptchaVerifier: any;
  }
}

export default function TrustMeetPage() {

  const [doctorName, setDoctorName] = useState("");
  const [doctorPhone, setDoctorPhone] = useState("");

  const [visitId, setVisitId] = useState("");

  const [otp, setOtp] = useState("");

  const [confirmationResult, setConfirmationResult] =
    useState<any>(null);

  const [step, setStep] = useState<
    "form" | "meeting" | "otp" | "completed"
  >("form");

  const [loading, setLoading] = useState(false);

  // =========================================
  // STEP 1 - CREATE VISIT
  // =========================================
  const createVisit = async () => {

    if (!doctorName || !doctorPhone) {

      alert("Please fill all details");

      return;
    }

    setLoading(true);

    try {

      const response = await axios.post(

        `${process.env.NEXT_PUBLIC_APP_URL}/trustmeet/create`,

        {
          employeeId: "EMP001",

          doctorName,

          doctorPhone,

          doctorLat: 28.6139,
          doctorLng: 77.2090,

          currentLat: 28.6139,
          currentLng: 77.2090,
        }
      );

      setVisitId(response.data.visitId);

      setStep("meeting");

    } catch (error: any) {

      console.log(error);

      alert(
        "Error: " +
        (error?.response?.data?.message || error.message)
      );
    }

    setLoading(false);
  };

  // =========================================
  // STEP 2 - END MEETING + SEND OTP
  // =========================================
  const endMeeting = async () => {

    setLoading(true);

    try {

      // END MEETING API
      await axios.post(

        `${process.env.NEXT_PUBLIC_APP_URL}/trustmeet/end-meeting`,

        {
          visitId,

          currentLat: 28.6139,
          currentLng: 77.2090,
        }
      );

      // FIREBASE RECAPTCHA
      if (!window.recaptchaVerifier) {

        window.recaptchaVerifier =
          new RecaptchaVerifier(

            auth,

            "recaptcha-container",

            {
              size: "invisible"
            }
          );
      }

      // SEND OTP
      const result = await signInWithPhoneNumber(

        auth,

        `+91${doctorPhone}`,

        window.recaptchaVerifier
      );

      setConfirmationResult(result);

      setStep("otp");

    } catch (error: any) {

      console.log(error);

      alert(
        "Error: " +
        (error?.response?.data?.message || error.message)
      );

      window.recaptchaVerifier = null;
    }

    setLoading(false);
  };

  // =========================================
  // STEP 3 - VERIFY OTP
  // =========================================
  const verifyOtp = async () => {

    if (!otp) {

      alert("Please enter OTP");

      return;
    }

    setLoading(true);

    try {

      // FIREBASE VERIFY
      await confirmationResult.confirm(otp);

      // BACKEND VERIFY
      await axios.post(

        `${process.env.NEXT_PUBLIC_APP_URL}/trustmeet/verify-otp`,

        {
          visitId,
          otp
        }
      );

      setStep("completed");

    } catch (error: any) {

      console.log(error);

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

    setVisitId("");

    setOtp("");

    setConfirmationResult(null);

    window.recaptchaVerifier = null;
  };

  return (

    <div className="p-10 max-w-md mx-auto">

      {/* TITLE */}
      <h1 className="text-2xl font-bold text-gray-900 text-center mb-6">

        TrustMeet

      </h1>

      {/* ========================================= */}
      {/* STEP 1 - FORM */}
      {/* ========================================= */}
      {step === "form" && (

        <div>

          {/* DOCTOR NAME */}
          <label className="text-xs text-gray-500 mb-1.5 block">

            Doctor Name

          </label>

          <input
            className="border border-gray-200 p-3 w-full mb-4 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-100"
            placeholder="Dr. Ramesh Sharma"
            value={doctorName}
            autoCapitalize="words"
            onChange={(e) => {

              const val = e.target.value;

              const capitalized =
                val.replace(/\b\w/g, (c) =>
                  c.toUpperCase()
                );

              setDoctorName(capitalized);
            }}
          />

          {/* PHONE */}
          <label className="text-xs text-gray-500 mb-1.5 block">

            Mobile Number

          </label>

          <div className="relative mb-6">

            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">

              +91

            </span>

            <input
              className="border border-gray-200 p-3 pl-10 w-full rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-100"
              placeholder="9XXXXXXXXX"
              value={doctorPhone}
              onChange={(e) =>
                setDoctorPhone(e.target.value)
              }
              maxLength={10}
            />
          </div>

          {/* START BUTTON */}
          <button
            className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-xl text-sm font-medium disabled:opacity-50"
            onClick={createVisit}
            disabled={loading}
          >

            {loading
              ? "Starting..."
              : "▶ Start Visit"}

          </button>

          <p className="text-center text-xs text-gray-400 mt-4">

            🔒 OTP will be sent to the doctor after the meeting ends

          </p>
        </div>
      )}

      {/* ========================================= */}
      {/* STEP 2 - MEETING */}
      {/* ========================================= */}
      {step === "meeting" && (

        <div>

          <div className="bg-blue-100 p-4 rounded mb-6">

            <p className="text-blue-800 font-bold text-lg">

              🟢 Meeting Active

            </p>

            <p className="text-sm text-gray-600 mt-1">

              Doctor: {doctorName}

            </p>

            <p className="text-sm text-gray-600">

              Phone: +91{doctorPhone}

            </p>
          </div>

          <button
            className="bg-red-500 text-white px-5 py-3 rounded w-full"
            onClick={endMeeting}
            disabled={loading}
          >

            {loading
              ? "Ending..."
              : "End Meeting"}

          </button>
        </div>
      )}

      {/* ========================================= */}
      {/* STEP 3 - OTP */}
      {/* ========================================= */}
      {step === "otp" && (

        <div>

          <div className="bg-yellow-100 p-4 rounded mb-4">

            <p className="text-yellow-800 font-bold">

              📱 OTP has been sent to the doctor's phone

            </p>

            <p className="text-sm text-gray-600">

              Please ask the doctor for the OTP and enter it below

            </p>
          </div>

          <input
            className="border p-3 w-full mb-4 rounded text-center text-2xl tracking-widest"
            placeholder="_ _ _ _ _ _"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            maxLength={6}
          />

          <button
            className="bg-green-500 text-white px-5 py-3 rounded w-full"
            onClick={verifyOtp}
            disabled={loading}
          >

            {loading
              ? "Verifying..."
              : "Verify OTP"}

          </button>
        </div>
      )}

      {/* ========================================= */}
      {/* STEP 4 - COMPLETED */}
      {/* ========================================= */}
      {step === "completed" && (

        <div>

          <div className="bg-green-100 p-6 rounded text-center mb-4">

            <p className="text-5xl mb-3">

              ✅

            </p>

            <p className="text-green-800 font-bold text-xl">

              Visit Completed!

            </p>

            <p className="text-sm text-gray-600 mt-2">

              Doctor: {doctorName}

            </p>

            <p className="text-sm text-gray-600">

              Phone: +91{doctorPhone}

            </p>
          </div>

          <button
            className="bg-blue-500 text-white px-5 py-3 rounded w-full"
            onClick={reset}
          >

            New Visit

          </button>
        </div>
      )}

      {/* RECAPTCHA */}
      <div id="recaptcha-container"></div>
    </div>
  );
}
