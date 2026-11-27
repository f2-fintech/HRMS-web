"use client";

import { useState } from "react";
import {
    IncentiveRatesConfig,
    DEFAULT_RATES,
    RATE_LABELS,
    CalculationResult,
    SlabRow,
    rs,
    words,
    fmtFull,
    normalizeRole,
} from "@/utils/Incentive-calculator/calculations";

type Props = {
    role: string;
    setRole: (v: string) => void;
    reporting: string;
    setReporting: (v: string) => void;
    salary: number;
    setSalary: (v: number) => void;
    disbursed: number;
    setDisbursed: (v: number) => void;
    ratesConfig: IncentiveRatesConfig;
    setRatesConfig: (cfg: IncentiveRatesConfig) => void;
    result: CalculationResult;
    currentTarget: any;
    hasSavedTarget: boolean;
    saving: boolean;
    loading: boolean;
    saveIncentiveTarget: (data: any) => Promise<void>;
    monthName: string;
};

export default function IncentiveCalculatorForm({
    role,
    setRole,
    reporting,
    setReporting,
    salary,
    setSalary,
    disbursed,
    setDisbursed,
    ratesConfig,
    setRatesConfig,
    result,
    currentTarget,
    hasSavedTarget,
    saving,
    loading,
    saveIncentiveTarget,
    monthName,
}: Props) {
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [confirmSalary, setConfirmSalary] = useState("");
    const [salaryError, setSalaryError] = useState("");
    const [btnFillPct, setBtnFillPct] = useState(0);
    const [btnSaving, setBtnSaving] = useState(false);
    const [btnDone, setBtnDone] = useState(false);
    const [ratesOpen, setRatesOpen] = useState(false);

    const { roleCode } = normalizeRole(role);
    const isEmployee = roleCode === "emp";

    const runFillAnimation = (onComplete: () => void) => {
        setBtnFillPct(0);
        setBtnSaving(true);
        setBtnDone(false);

        let start: number | null = null;
        const duration = 1200;

        const animate = (timestamp: number) => {
            if (!start) start = timestamp;
            const progress = timestamp - start;
            const pct = Math.min((progress / duration) * 100, 100);
            setBtnFillPct(pct);

            if (progress < duration) {
                requestAnimationFrame(animate);
            } else {
                setTimeout(() => {
                    setBtnSaving(false);
                    setBtnDone(true);
                    onComplete();
                    setTimeout(() => setBtnDone(false), 3000);
                }, 150);
            }
        };

        requestAnimationFrame(animate);
    };

    const handleOpenSaveModal = () => {
        setConfirmSalary("");
        setSalaryError("");
        setShowConfirmModal(true);
    };

    const handleConfirmSave = () => {
        const entered = Number(confirmSalary);

        if (isEmployee) {
            if (!confirmSalary || isNaN(entered) || entered <= 0) {
                setSalaryError("Please enter a valid salary amount.");
                return;
            }

            if (Math.abs(entered - salary) > salary * 0.05) {
                setSalaryError(
                    `Salary mismatch! Entered ₹${entered.toLocaleString("en-IN")} but calculator uses ₹${salary.toLocaleString("en-IN")}.`
                );
                return;
            }
        }

        const targetDisbursed = Math.round(disbursed);
        const targetIncentive = Math.round(result.userNetIncentive);

        setShowConfirmModal(false);
        setSalaryError("");

        runFillAnimation(async () => {
            await saveIncentiveTarget({
                designation: role,
                salary: isEmployee ? salary : null,
                targetDisbursed,
                targetIncentive,
                achievedAmount: currentTarget?.achievedAmount || 0,
            });
        });
    };

    const handleRateChange = (key: keyof IncentiveRatesConfig, value: string) => {
        const num = parseFloat(value) || 0;
        const updated = { ...ratesConfig, [key]: num };
        setRatesConfig(updated);
        try {
            localStorage.setItem("f2s3", JSON.stringify(updated));
        } catch { }
    };

    const handleResetRates = () => {
        setRatesConfig({ ...DEFAULT_RATES });
        try {
            localStorage.setItem("f2s3", JSON.stringify(DEFAULT_RATES));
        } catch { }
    };

    // Quick salary preset chips
    const salaryPresets = [15000, 18000, 20000, 25000, 30000, 40000];
    // Quick disbursed preset chips
    const disbursedPresets = [
        { label: "50L", val: 5000000 },
        { label: "75L", val: 7500000 },
        { label: "90L", val: 9000000 },
        { label: "1Cr", val: 10000000 },
        { label: "1.5Cr", val: 15000000 },
        { label: "2Cr", val: 20000000 },
    ];

    return (
        <div className="space-y-4 [&_input::-webkit-outer-spin-button]:appearance-none [&_input::-webkit-inner-spin-button]:appearance-none [&_input[type=number]]:[-moz-appearance:textfield]">
            {/* 1. ROLE SELECTION */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                <div className="font-bold text-slate-800 mb-3 text-base flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-black flex items-center justify-center">1</span>
                    Who disbursed the loan?
                </div>
                <div className="grid grid-cols-3 gap-3">
                    <button
                        type="button"
                        onClick={() => setRole("EMPLOYEE")}
                        className={`py-3 px-4 rounded-xl font-bold text-sm transition-all border-2 flex flex-col items-center gap-1 cursor-pointer
                            ${roleCode === "emp"
                                ? "bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-500/20"
                                : "bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                            }`}
                    >
                        <span className="text-lg">👤</span>
                        <span>Employee</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setRole("TEAM_LEADER")}
                        className={`py-3 px-4 rounded-xl font-bold text-sm transition-all border-2 flex flex-col items-center gap-1 cursor-pointer
                            ${roleCode === "tl"
                                ? "bg-cyan-600 border-cyan-600 text-white shadow-md shadow-cyan-500/20"
                                : "bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                            }`}
                    >
                        <span className="text-lg">👥</span>
                        <span>TL</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setRole("MANAGER")}
                        className={`py-3 px-4 rounded-xl font-bold text-sm transition-all border-2 flex flex-col items-center gap-1 cursor-pointer
                            ${roleCode === "mg"
                                ? "bg-violet-600 border-violet-600 text-white shadow-md shadow-violet-500/20"
                                : "bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                            }`}
                    >
                        <span className="text-lg">🏢</span>
                        <span>Manager</span>
                    </button>
                </div>
            </div>

            {/* 2. REPORTING (VISIBLE ONLY FOR EMPLOYEE) */}
            {isEmployee && (
                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm transition-all animate-fadeIn">
                    <div className="font-bold text-slate-800 mb-3 text-base flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-black flex items-center justify-center">2</span>
                        Who does this employee report to?
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <button
                            type="button"
                            onClick={() => setReporting("tl")}
                            className={`py-3 px-4 rounded-xl font-semibold text-sm transition-all border-2 text-left flex items-center justify-between cursor-pointer
                                ${reporting === "tl"
                                    ? "bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-500/20"
                                    : "bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                                }`}
                        >
                            <span>A TL (TL is in between)</span>
                            {reporting === "tl" && <span className="text-white text-base">✓</span>}
                        </button>

                        <button
                            type="button"
                            onClick={() => setReporting("mg")}
                            className={`py-3 px-4 rounded-xl font-semibold text-sm transition-all border-2 text-left flex items-center justify-between cursor-pointer
                                ${reporting === "mg"
                                    ? "bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-500/20"
                                    : "bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                                }`}
                        >
                            <span>Directly TL/Manager</span>
                            {reporting === "mg" && <span className="text-white text-base">✓</span>}
                        </button>
                    </div>
                </div>
            )}

            {/* 3. SALARY INPUT (VISIBLE ONLY FOR EMPLOYEE) */}
            {isEmployee && (
                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm transition-all animate-fadeIn">
                    <div className="font-bold text-slate-800 mb-3 text-base flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-black flex items-center justify-center">3</span>
                            Employee’s monthly salary (₹)
                        </div>
                        <span className="text-sm font-extrabold text-blue-700 bg-blue-50 px-3 py-1 rounded-lg border border-blue-100">
                            {rs(salary)}
                        </span>
                    </div>

                    <div className="space-y-3">
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-lg">₹</span>
                            <input
                                type="number"
                                min="0"
                                value={salary || ""}
                                onChange={(e) => setSalary(Math.max(0, parseFloat(e.target.value) || 0))}
                                placeholder="e.g. 18000"
                                className="w-full pl-9 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-lg font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                            />
                        </div>

                        {/* Quick Presets */}
                        <div className="flex flex-wrap gap-2">
                            {salaryPresets.map((amt) => (
                                <button
                                    key={amt}
                                    type="button"
                                    onClick={() => setSalary(amt)}
                                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer
                                        ${salary === amt
                                            ? "bg-blue-600 text-white"
                                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                        }`}
                                >
                                    ₹{(amt / 1000)}k
                                </button>
                            ))}
                        </div>

                        {/* Dynamic Hint */}
                        <div className="text-xs font-medium text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                            Target (justification) = salary × {ratesConfig.mult} = <strong className="text-blue-700">{rs(salary * ratesConfig.mult)}</strong>
                        </div>
                    </div>
                </div>
            )}

            {/* 4. TOTAL DISBURSED AMOUNT */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                <div className="font-bold text-slate-800 mb-3 text-base flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-black flex items-center justify-center">
                            {isEmployee ? "4" : "2"}
                        </span>
                        Total amount disbursed (₹)
                    </div>
                    {disbursed > 0 && (
                        <span className="text-sm font-extrabold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-100">
                            {words(disbursed)}
                        </span>
                    )}
                </div>

                <div className="space-y-3">
                    <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-lg">₹</span>
                        <input
                            type="number"
                            min="0"
                            value={disbursed || ""}
                            onChange={(e) => setDisbursed(Math.max(0, parseFloat(e.target.value) || 0))}
                            placeholder="e.g. 9000000"
                            className="w-full pl-9 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-lg font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                        />
                    </div>

                    {/* Quick Presets */}
                    <div className="flex flex-wrap gap-2">
                        {disbursedPresets.map((p) => (
                            <button
                                key={p.val}
                                type="button"
                                onClick={() => setDisbursed(p.val)}
                                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer
                                    ${disbursed === p.val
                                        ? "bg-blue-600 text-white"
                                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                    }`}
                            >
                                {p.label}
                            </button>
                        ))}
                    </div>

                    {disbursed > 0 && (
                        <div className="text-xs font-semibold text-slate-600">
                            = {words(disbursed)} ({rs(disbursed)})
                        </div>
                    )}
                </div>
            </div>

            {/* RESULTS: WHO GETS WHAT */}
            {(!disbursed || (isEmployee && !salary)) ? (
                <div className="bg-blue-50 border border-dashed border-blue-300 rounded-2xl p-6 text-center text-blue-700 font-medium">
                    Fill in the amounts above to see who gets what.
                </div>
            ) : (
                <div className="space-y-4">
                    {/* PAYOUT CARDS */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                        {result.payouts.map((p, idx) => (
                            <div
                                key={idx}
                                className={`p-4 rounded-2xl border transition-all flex flex-col justify-between
                                    ${p.roleCode === roleCode
                                        ? "bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-300 shadow-md ring-2 ring-blue-500/20"
                                        : "bg-white border-slate-200 shadow-sm"
                                    }`}
                            >
                                <div>
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                            {p.name} gets
                                        </span>
                                        {p.roleCode === roleCode && (
                                            <span className="bg-blue-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
                                                You
                                            </span>
                                        )}
                                    </div>
                                    <h3 className="text-2xl font-black text-emerald-700 tabular-nums">
                                        {rs(p.amount)}
                                    </h3>
                                    <p className="text-[11px] text-slate-500 mt-0.5">{p.rateText}</p>
                                </div>

                                {p.roleCode === roleCode && (
                                    <div className="mt-3 pt-2.5 border-t border-slate-200/70 text-xs flex justify-between items-center">
                                        <span className="text-slate-500">Net (after 5% TDS):</span>
                                        <strong className="text-emerald-800 font-bold">{rs(p.net)}</strong>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* SAVE TARGET ACTION BAR */}
                    <div className="bg-gradient-to-r from-slate-900 to-indigo-950 rounded-2xl p-4 sm:p-5 text-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg">
                        <div>
                            <p className="text-xs text-indigo-300 font-semibold uppercase tracking-wider">
                                Target Set for {monthName}
                            </p>
                            <p className="text-base sm:text-lg font-bold text-white mt-0.5">
                                Disbursed: <span className="text-amber-400">{rs(disbursed)}</span> · Net Incentive: <span className="text-emerald-400">{rs(result.userNetIncentive)}</span>
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={handleOpenSaveModal}
                            disabled={saving || loading || btnSaving}
                            className={`w-full sm:w-auto px-6 py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md
                                ${btnDone
                                    ? "bg-emerald-600 text-white"
                                    : "bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white"
                                }`}
                        >
                            {btnSaving ? (
                                <span>Saving... {Math.round(btnFillPct)}%</span>
                            ) : btnDone ? (
                                <span>✓ Target Saved!</span>
                            ) : (
                                <span>{hasSavedTarget ? `Update Target (${monthName})` : `Save Target (${monthName})`}</span>
                            )}
                        </button>
                    </div>

                    {/* HOW IT WAS WORKED OUT */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
                        <div className="font-bold text-slate-800 text-base flex items-center gap-2">
                            <span className="text-lg">💡</span>
                            How it was worked out
                        </div>

                        <div className="space-y-2 text-sm text-slate-700 leading-relaxed">
                            {result.explanations.map((note, idx) => (
                                <p key={idx} className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                                    {note}
                                </p>
                            ))}
                        </div>

                        {/* EMPLOYEE SLABS TABLE */}
                        {isEmployee && result.employeeSlabs && disbursed > (salary * ratesConfig.mult) && (
                            <div className="mt-4">
                                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                                    Employee Slab Breakdown
                                </div>
                                <div className="overflow-x-auto rounded-xl border border-slate-200">
                                    <table className="w-full text-left text-xs sm:text-sm border-collapse">
                                        <thead>
                                            <tr className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                                                <th className="py-2.5 px-3">Slab (disbursed between)</th>
                                                <th className="py-2.5 px-3 text-right">Business in slab</th>
                                                <th className="py-2.5 px-3 text-right">Rate</th>
                                                <th className="py-2.5 px-3 text-right">Incentive</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {result.employeeSlabs.rows.map((r: SlabRow, idx: number) => (
                                                <tr
                                                    key={idx}
                                                    className={r.business > 0 ? "bg-white hover:bg-slate-50/80" : "bg-slate-50/40 text-slate-400"}
                                                >
                                                    <td className="py-2.5 px-3 font-medium">
                                                        {rs(r.lo)} to {isFinite(r.hi) ? rs(r.hi) : "above"}
                                                    </td>
                                                    <td className="py-2.5 px-3 text-right tabular-nums">
                                                        {rs(r.business)}
                                                    </td>
                                                    <td className="py-2.5 px-3 text-right font-semibold text-blue-600">
                                                        {r.rate.toFixed(2)}%
                                                    </td>
                                                    <td className="py-2.5 px-3 text-right font-bold text-emerald-700 tabular-nums">
                                                        {rs(r.incentive)}
                                                    </td>
                                                </tr>
                                            ))}
                                            <tr className="bg-emerald-50/50 font-bold border-t-2 border-emerald-200 text-emerald-900">
                                                <td className="py-2.5 px-3">Total Employee Incentive</td>
                                                <td className="py-2.5 px-3 text-right"></td>
                                                <td className="py-2.5 px-3 text-right"></td>
                                                <td className="py-2.5 px-3 text-right text-base text-emerald-700">
                                                    {rs(result.employeeSlabs.tot)}
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* MANAGER SLABS TABLE (WHEN REPORTING DIRECTLY TO MANAGER) */}
                        {isEmployee && reporting === "mg" && result.managerSlabs && (
                            <div className="mt-4">
                                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                                    Manager (Direct Reporting) Slab Breakdown
                                </div>
                                <div className="overflow-x-auto rounded-xl border border-slate-200">
                                    <table className="w-full text-left text-xs sm:text-sm border-collapse">
                                        <thead>
                                            <tr className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                                                <th className="py-2.5 px-3">Slab (disbursed between)</th>
                                                <th className="py-2.5 px-3 text-right">Business in slab</th>
                                                <th className="py-2.5 px-3 text-right">Rate</th>
                                                <th className="py-2.5 px-3 text-right">Incentive</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {result.managerSlabs.rows.map((r: SlabRow, idx: number) => (
                                                <tr
                                                    key={idx}
                                                    className={r.business > 0 ? "bg-white hover:bg-slate-50/80" : "bg-slate-50/40 text-slate-400"}
                                                >
                                                    <td className="py-2.5 px-3 font-medium">
                                                        {rs(r.lo)} to {isFinite(r.hi) ? rs(r.hi) : "above"}
                                                    </td>
                                                    <td className="py-2.5 px-3 text-right tabular-nums">
                                                        {rs(r.business)}
                                                    </td>
                                                    <td className="py-2.5 px-3 text-right font-semibold text-violet-600">
                                                        {r.rate.toFixed(2)}%
                                                    </td>
                                                    <td className="py-2.5 px-3 text-right font-bold text-emerald-700 tabular-nums">
                                                        {rs(r.incentive)}
                                                    </td>
                                                </tr>
                                            ))}
                                            <tr className="bg-violet-50/50 font-bold border-t-2 border-violet-200 text-violet-900">
                                                <td className="py-2.5 px-3">Total Manager Incentive</td>
                                                <td className="py-2.5 px-3 text-right"></td>
                                                <td className="py-2.5 px-3 text-right"></td>
                                                <td className="py-2.5 px-3 text-right text-base text-violet-700">
                                                    {rs(result.managerSlabs.tot)}
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* OPTIONAL RATES SETTINGS */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                <button
                    type="button"
                    onClick={() => setRatesOpen(!ratesOpen)}
                    className="w-full flex items-center justify-between font-bold text-slate-800 text-sm hover:text-blue-600 transition-colors cursor-pointer"
                >
                    <span className="flex items-center gap-2">
                        <span>⚙️</span>
                        Change rates (optional)
                    </span>
                    <span className="text-xs text-slate-400 font-semibold">
                        {ratesOpen ? "Hide ▲" : "Configure ▼"}
                    </span>
                </button>

                {ratesOpen && (
                    <div className="mt-4 pt-4 border-t border-slate-100 space-y-4 animate-fadeIn">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {(Object.keys(DEFAULT_RATES) as Array<keyof IncentiveRatesConfig>).map((key) => (
                                <div key={key} className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                                        {RATE_LABELS[key]}
                                    </label>
                                    <input
                                        type="number"
                                        step="any"
                                        value={ratesConfig[key]}
                                        onChange={(e) => handleRateChange(key, e.target.value)}
                                        className="w-full bg-white px-2.5 py-1.5 border border-slate-300 rounded-lg text-sm font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    />
                                </div>
                            ))}
                        </div>

                        <p className="text-xs text-slate-500 italic">
                            TL own, manager own and manager-on-TL-own rates are flat % of the amount disbursed, taken from the sheet and not from policy.
                        </p>

                        <div>
                            <button
                                type="button"
                                onClick={handleResetRates}
                                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition-colors cursor-pointer"
                            >
                                Reset rates
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* CONFIRM SAVE MODAL */}
            {showConfirmModal && (
                <div
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                    onClick={(e) => e.target === e.currentTarget && setShowConfirmModal(false)}
                >
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-scaleIn">
                        <div className="h-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600" />

                        <div className="p-6">
                            <h3 className="text-xl font-bold mb-1 text-slate-800">
                                {hasSavedTarget ? `Update Target for ${monthName}` : `Save Target for ${monthName}`}
                            </h3>
                            <p className="text-sm text-slate-500 mb-5">
                                Confirm before {hasSavedTarget ? "updating" : "saving"} your monthly target
                            </p>

                            <div className="bg-blue-50/70 p-4 rounded-xl mb-6 border border-blue-100 space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-slate-600">Role:</span>
                                    <strong className="text-slate-800 capitalize">{role.toLowerCase().replace('_', ' ')}</strong>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-600">Target Disbursed:</span>
                                    <strong className="text-slate-800">{rs(disbursed)}</strong>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-600">Net Incentive (after TDS):</span>
                                    <strong className="text-emerald-700">{rs(result.userNetIncentive)}</strong>
                                </div>
                            </div>

                            {isEmployee && (
                                <div className="mb-6">
                                    <label className="block text-sm font-semibold text-slate-600 mb-2">
                                        Re-enter salary to confirm
                                    </label>
                                    <input
                                        type="number"
                                        value={confirmSalary}
                                        onChange={(e) => {
                                            setConfirmSalary(e.target.value);
                                            setSalaryError("");
                                        }}
                                        placeholder={`Current: ₹${salary.toLocaleString("en-IN")}`}
                                        className={`w-full p-3.5 border ${salaryError ? "border-red-400" : "border-slate-300"} rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400`}
                                        autoFocus
                                    />
                                    {salaryError && <p className="text-red-600 text-sm mt-2">{salaryError}</p>}
                                </div>
                            )}

                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmModal(false)}
                                    className="flex-1 py-3 border border-slate-300 rounded-xl font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={handleConfirmSave}
                                    disabled={saving || loading}
                                    className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl hover:brightness-105 disabled:opacity-70 cursor-pointer shadow-md"
                                >
                                    Confirm & {hasSavedTarget ? "Update" : "Save"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
