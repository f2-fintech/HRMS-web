"use client";

import { useState, useEffect } from "react";

import { Snackbar, Alert, IconButton } from "@mui/material";

import { useIncentiveTarget } from "@/hooks/incentiveTarget";

import MonthlyTargetCard from "@/components/incentive-calculator/TargetSection";
import IncentiveCalculatorForm from "@/components/incentive-calculator/IncentiveCalculatorForm";
import IncentiveTargetTable from "@components/incentive-calculator/IncentiveTargetTable";

import {
    ROLES,
    calculate,
    fmtFull,
    currentMonthName,
    getDaysLeftInMonth,
} from "@/utils/Incentive-calculator/calculations";

export default function IncentiveCalculatorPage() {
    const [role, setRole] = useState("TELECALLER");
    const [salary, setSalary] = useState(20000);
    const [disbursed, setDisbursed] = useState(5000000);
    const [managerFileType, setManagerFileType] = useState("team");

    const {
        currentTarget,
        loading,
        saving,
        success,
        error,
        fetchTodayTarget,
        saveIncentiveTarget,
        clearIncentiveTargetState,
    } = useIncentiveTarget();

    const hasSavedTarget = !!currentTarget?._id;

    const [justSaved, setJustSaved] = useState(false);

    const [snackOpen, setSnackOpen] = useState(false);
    const [snackMessage, setSnackMessage] = useState("");

    // Month & Year calculation
    const getCurrentMonthYear = () => {
        const now = new Date();


        return {
            month: String(now.getMonth() + 1).padStart(2, "0"),
            year: String(now.getFullYear()),
        };
    };

    // fetch target with month/year
    useEffect(() => {
        const { month, year } = getCurrentMonthYear();

        fetchTodayTarget(month, year);

        setJustSaved(false);
        clearIncentiveTargetState?.();
    }, []);

    // Populate form from backend
    useEffect(() => {
        if (currentTarget) {
            setRole(currentTarget.designation || "TELECALLER");
            setSalary(currentTarget.salary || 20000);
            setDisbursed(currentTarget.targetDisbursed || 0);
        }
    }, [currentTarget]);

    // Snackbar logic
    useEffect(() => {
        if (success && justSaved) {
            setSnackMessage(
                hasSavedTarget ? "Target updated successfully" : "Target set successfully"
            );
            setSnackOpen(true);

            setJustSaved(false);
            clearIncentiveTargetState?.();
        }
    }, [success, justSaved, hasSavedTarget, clearIncentiveTargetState]);

    const handleSnackClose = (event?: React.SyntheticEvent | Event, reason?: string) => {
        if (reason === "clickaway") return;
        setSnackOpen(false);
    };

    // save with month/year
    const handleSave = async (data: any) => {
        setJustSaved(true);

        const { month, year } = getCurrentMonthYear();

        await saveIncentiveTarget({
            ...data,
            month,
            year,
        });
    };

    const activeRole = ROLES.find((r) => r.id === role);
    const result = calculate(role, salary, disbursed, managerFileType);

    const monthName = currentMonthName();

    // header month label from month/year (instead of date)
    const headerMonth =
        currentTarget?.month && currentTarget?.year
            ? new Date(
                Number(currentTarget.year),
                Number(currentTarget.month) - 1
            ).toLocaleDateString("en-IN", { month: "long", year: "numeric" })
            : currentMonthName();

    return (
        <div className="min-h-screen bg-slate-100 flex items-start justify-center p-4">
            <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Inter', sans-serif; }

        @keyframes progressShrink {
          from { transform: scaleX(1); }
          to   { transform: scaleX(0); }
        }
      `}</style>

            <div className="w-full max-w-5xl">
                {/* Header */}
                <div className="mb-4">
                    <h1 className="text-xl md:text-2xl font-semibold text-slate-800">
                        Incentive Calculator
                    </h1>
                    <p className="text-sm text-slate-500 mt-0.5">
                        {headerMonth} · Calculate incentive & set your target
                    </p>
                </div>

                <MonthlyTargetCard
                    currentTarget={currentTarget}
                    monthName={monthName}
                    daysLeft={getDaysLeftInMonth()}
                    fmtFull={fmtFull}
                    saveIncentiveTarget={handleSave}
                    loading={loading}
                    saving={saving}
                />

                {/* Snackbar */}
                <Snackbar
                    open={snackOpen}
                    autoHideDuration={4000}
                    onClose={handleSnackClose}
                    anchorOrigin={{ vertical: "top", horizontal: "right" }}
                >
                    <Alert
                        onClose={handleSnackClose}
                        severity="success"
                        icon={false}
                        variant="outlined"
                        sx={{
                            width: "340px",
                            backgroundColor: "#ffffff",
                            color: "#1a1a1a",
                            border: "1px solid #e0e0e0",
                            borderRadius: "8px",
                            boxShadow: "0 6px 20px rgba(0,0,0,0.12)",
                            padding: "12px 48px 12px 16px",
                            fontSize: "15px",
                            fontWeight: 500,
                            position: "relative",
                            overflow: "hidden",
                            alignItems: "center",
                            "&::after": {
                                content: '""',
                                position: "absolute",
                                bottom: 0,
                                left: 0,
                                width: "100%",
                                height: "5px",
                                backgroundColor: "#4caf50",
                                transform: "scaleX(1)",
                                transformOrigin: "left",
                                animation: "progressShrink 4s linear forwards",
                            },
                        }}
                        action={
                            <IconButton size="small" onClick={handleSnackClose}>
                                ×
                            </IconButton>
                        }
                    >
                        <div className="flex items-center gap-2.5">
                            <span className="text-xl">✅</span>
                            {snackMessage}
                        </div>
                    </Alert>
                </Snackbar>

                {/* Error */}
                {error && !error.includes("json") && (
                    <div className="bg-red-500 text-white rounded-xl px-5 py-3 mb-4 flex items-center gap-3">
                        <span>⚠️</span>
                        <span>{error}</span>
                    </div>
                )}

                {/* Role Selector */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-5">
                    {ROLES.map((ro) => (
                        <button
                            key={ro.id}
                            onClick={() => setRole(ro.id)}
                            className={`flex items-center gap-2.5 px-3 py-3 rounded-xl border-2 text-left transition-all
                ${role === ro.id ? `${ro.bg} border-[${ro.color}]` : "bg-white border-slate-200 hover:border-slate-300"}`}
                        >
                            <span className="text-xl">{ro.icon}</span>
                            <div>
                                <p className={`text-sm font-bold ${role === ro.id ? ro.text : "text-slate-700"}`}>
                                    {ro.label}
                                </p>
                                <p className="text-[10px] text-slate-400">{ro.sub}</p>
                            </div>
                        </button>
                    ))}
                </div>

                <IncentiveCalculatorForm
                    role={role}
                    salary={salary}
                    setSalary={setSalary}
                    disbursed={disbursed}
                    setDisbursed={setDisbursed}
                    managerFileType={managerFileType}
                    setManagerFileType={setManagerFileType}
                    result={result}
                    activeRole={activeRole}
                    currentTarget={currentTarget}
                    hasSavedTarget={hasSavedTarget}
                    saving={saving}
                    loading={loading}
                    saveIncentiveTarget={handleSave}
                    monthName={monthName}
                    clearIncentiveTargetState={clearIncentiveTargetState}
                    success={success}
                />
                <IncentiveTargetTable />
            </div>
        </div>
    );
}
