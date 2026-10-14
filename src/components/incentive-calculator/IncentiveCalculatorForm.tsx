"use client";

import { useState } from "react";

import {
    TDS_RATE,
    fmtShort,
    fmtFull,
    PHASE_COLORS,
} from "@/utils/Incentive-calculator/calculations";

type Props = {
    role: string;
    salary: number;
    setSalary: (v: number) => void;
    disbursed: number;
    setDisbursed: (v: number) => void;
    managerFileType: string;
    setManagerFileType: (v: string) => void;
    result: any;
    activeRole: any;
    currentTarget: any;
    hasSavedTarget: boolean;
    saving: boolean;
    loading: boolean;
    saveIncentiveTarget: (data: any) => Promise<void>;
    monthName: string;
    clearIncentiveTargetState: () => void;
    success: boolean;
};

export default function IncentiveCalculatorForm({
    role,
    salary,
    setSalary,
    disbursed,
    setDisbursed,
    managerFileType,
    setManagerFileType,
    result,
    activeRole,
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

    const gross = result?.grossIncentive || 0;
    const tds = result?.tdsAmount || 0;
    const net = result?.netIncentive || 0;
    const justified = result?.justifiedSalary || 0;
    const phases = result?.phases || [];
    const belowThreshold = result?.belowThreshold;
    const isManagerOwn = result?.isManagerOwn;

    const maxDisbursed = Math.max(
        activeRole?.hasSalary ? salary * 200 * 5 : 0,
        disbursed * 1.2,
        10000000
    );

    const maxSalary = 200000;
    const disbursedPct = Math.min((disbursed / maxDisbursed) * 100, 100);
    const salaryPct = Math.min((salary / maxSalary) * 100, 100);
    const netRate = disbursed > 0 ? ((net / disbursed) * 100).toFixed(3) : "0.000";

    const R = 52,
        CX = 60,
        CY = 60,
        SW = 12;

    const circ = 2 * Math.PI * R;
    const grossArc = disbursed > 0 ? Math.min(gross / disbursed, 1) * circ : 0;
    const tdsArc = disbursed > 0 ? Math.min(tds / disbursed, 1) * circ : 0;
    const baseArc = justified > 0 && disbursed > 0 ? Math.min(justified / disbursed, 1) * circ : 0;

    const runFillAnimation = (onComplete: () => void) => {
        setBtnFillPct(0);
        setBtnSaving(true);
        setBtnDone(false);

        let start: number | null = null;
        const duration = 1400;

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

        if (activeRole?.hasSalary && !(role === "MANAGER" && managerFileType === "own")) {
            if (!confirmSalary || isNaN(entered) || entered <= 0) {
                setSalaryError("Please enter a valid salary amount.");

                return;
            }

            if (Math.abs(entered - salary) > salary * 0.05) {
                setSalaryError(
                    `Salary mismatch! Entered ₹${entered.toLocaleString(
                        "en-IN"
                    )} but calculator uses ₹${salary.toLocaleString("en-IN")}.`
                );

                return;
            }
        }

        const targetDisbursed = Math.round(disbursed);
        const targetIncentive = Math.round(net);

        setShowConfirmModal(false);
        setSalaryError("");

        runFillAnimation(async () => {
            await saveIncentiveTarget({
                designation: role,
                salary: activeRole?.hasSalary ? salary : null,
                targetDisbursed,
                targetIncentive,
                achievedAmount: currentTarget?.achievedAmount || 0,
            });
        });
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* LEFT – Inputs */}
            <div className="bg-white rounded-2xl shadow-sm p-5 border border-slate-100">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
                    {activeRole?.icon} {activeRole?.label} Parameters
                </p>

                {role === "MANAGER" && (
                    <div className="mb-5">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                File Type
                            </span>
                            <span
                                className="text-xs font-semibold px-2.5 py-1 rounded-full"
                                style={{
                                    background: managerFileType === "own" ? "#f5f3ff" : "#eff6ff",
                                    color: managerFileType === "own" ? "#7c3aed" : "#2563eb",
                                }}
                            >
                                {managerFileType === "own" ? "Flat 0.35%" : "Slab-based"}
                            </span>
                        </div>

                        <select
                            className="w-full p-3 border border-slate-300 rounded-xl text-sm focus:outline-none focus:border-indigo-400"
                            value={managerFileType}
                            onChange={(e) => setManagerFileType(e.target.value)}
                        >
                            <option value="team">📋 File from Team — Standard slab rates (0.10% start)</option>
                            <option value="own">🙋 Own File — Flat 0.35% on full disbursed amount</option>
                        </select>

                        <div
                            className={`mt-3 p-3 rounded-xl flex items-start gap-3 text-xs ${managerFileType === "own"
                                ? "bg-violet-50 border border-violet-200 text-violet-800"
                                : "bg-blue-50 border border-blue-100 text-blue-800"
                                }`}
                        >
                            <span className="text-lg">{managerFileType === "own" ? "🙋" : "📋"}</span>
                            <p>
                                {managerFileType === "own"
                                    ? "Own file: flat 0.35% on entire disbursed amount — no threshold"
                                    : "Team file: slab-based from 0.10%, threshold = Salary × 200"}
                            </p>
                        </div>
                    </div>
                )}

                {activeRole?.hasSalary && !(role === "MANAGER" && managerFileType === "own") && (
                    <div className="mb-5">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                Monthly Salary
                            </span>
                            <input
                                type="number"
                                value={salary}
                                onChange={(e) => setSalary(Math.max(0, Number(e.target.value)))}
                                className="w-32 p-2 text-right border border-slate-300 rounded-lg font-semibold"
                            />
                        </div>
                        <div className="relative h-2 bg-slate-200 rounded-full">
                            <div
                                className="absolute h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"
                                style={{ width: `${salaryPct}%` }}
                            />
                            <input
                                type="range"
                                min={5000}
                                max={maxSalary}
                                step={1000}
                                value={salary}
                                onChange={(e) => setSalary(Number(e.target.value))}
                                className="absolute inset-0 w-full opacity-0 cursor-pointer"
                            />
                        </div>
                        <div className="flex justify-between text-xs text-slate-400 mt-1">
                            <span>₹5,000</span>
                            <span>{fmtShort(maxSalary)}</span>
                        </div>
                    </div>
                )}

                <div className="mb-5">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                            Disbursed Amount
                        </span>
                        <input
                            type="number"
                            value={disbursed}
                            onChange={(e) => setDisbursed(Math.max(0, Number(e.target.value)))}
                            className="w-40 p-2 text-right border border-slate-300 rounded-lg font-semibold"
                        />
                    </div>
                    <div className="relative h-2 bg-slate-200 rounded-full">
                        <div
                            className="absolute h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"
                            style={{ width: `${disbursedPct}%` }}
                        />
                        <input
                            type="range"
                            min={0}
                            max={maxDisbursed}
                            step={50000}
                            value={disbursed}
                            onChange={(e) => setDisbursed(Number(e.target.value))}
                            className="absolute inset-0 w-full opacity-0 cursor-pointer"
                        />
                    </div>
                    <div className="flex justify-between text-xs text-slate-400 mt-1">
                        <span>₹0</span>
                        <span>{fmtShort(maxDisbursed)}</span>
                    </div>
                </div>

                {/* Info chips */}
                <div className="flex flex-col gap-2.5">
                    {activeRole?.hasSalary && !(role === "MANAGER" && managerFileType === "own") && (
                        <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm">
                            <span>⚡</span>
                            <div>
                                <p className="font-bold text-amber-800">Justification Threshold</p>
                                <p className="font-semibold tabular-nums">{fmtFull(justified)}</p>
                            </div>
                        </div>
                    )}

                    <div className="flex items-center gap-3 bg-rose-50 border border-rose-200 rounded-xl p-3 text-sm">
                        <span>🏛️</span>
                        <p className="font-semibold text-rose-800">TDS @ {TDS_RATE * 100}% deducted</p>
                    </div>
                </div>
            </div>

            {/* RIGHT – Result + Save */}
            <div className="flex flex-col gap-4">
                <div className="bg-white rounded-2xl shadow-sm p-5 border border-slate-100">
                    {belowThreshold ? (
                        <div className="py-10 text-center text-slate-500">
                            <div className="text-5xl mb-4">📊</div>
                            <p>Incentive starts after crossing threshold.</p>
                            {role !== "SOURCER" && <p>Threshold = Salary × 200</p>}
                        </div>
                    ) : (
                        <>
                            <div className="flex items-center gap-5 mb-5">
                                {/* Circular progress */}
                                <svg width={120} height={120} viewBox="0 0 120 120" className="shrink-0">
                                    <circle cx={CX} cy={CY} r={R} fill="none" stroke="#f1f5f9" strokeWidth={SW} />
                                    {baseArc > 0 && (
                                        <circle
                                            cx={CX}
                                            cy={CY}
                                            r={R}
                                            fill="none"
                                            stroke="#c7d2fe"
                                            strokeWidth={SW}
                                            strokeDasharray={`${baseArc} ${circ - baseArc}`}
                                            strokeDashoffset={circ / 4}
                                        />
                                    )}
                                    {grossArc > 0 && (
                                        <circle
                                            cx={CX}
                                            cy={CY}
                                            r={R}
                                            fill="none"
                                            stroke="url(#grossGrad)"
                                            strokeWidth={SW}
                                            strokeDasharray={`${grossArc} ${circ - grossArc}`}
                                            strokeDashoffset={circ / 4 - baseArc}
                                        />
                                    )}
                                    {tdsArc > 0 && (
                                        <circle
                                            cx={CX}
                                            cy={CY}
                                            r={R}
                                            fill="none"
                                            stroke="#f43f5e"
                                            strokeWidth={SW}
                                            strokeDasharray={`${tdsArc} ${circ - tdsArc}`}
                                            strokeDashoffset={circ / 4 - baseArc}
                                            opacity={0.7}
                                        />
                                    )}
                                    <defs>
                                        <linearGradient id="grossGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                            <stop offset="0%" stopColor={activeRole?.color} />
                                            <stop offset="100%" stopColor="#7C3AED" />
                                        </linearGradient>
                                    </defs>
                                    <text
                                        x={CX}
                                        y={CY - 8}
                                        textAnchor="middle"
                                        fill="#94a3b8"
                                        fontSize="7"
                                        fontWeight="600"
                                    >
                                        NET RATE
                                    </text>
                                    <text
                                        x={CX}
                                        y={CY + 10}
                                        textAnchor="middle"
                                        fill={activeRole?.color}
                                        fontSize="13"
                                        fontWeight="bold"
                                    >
                                        {netRate}%
                                    </text>
                                </svg>

                                <div className="flex-1">
                                    <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-1">
                                        Gross Incentive
                                    </p>
                                    <p className="text-3xl font-bold" style={{ color: activeRole?.color }}>
                                        {fmtFull(gross)}
                                    </p>

                                    <div className="mt-3 border border-slate-100 rounded-xl overflow-hidden">
                                        <div className="flex justify-between items-center bg-rose-50 px-4 py-2 text-sm">
                                            <span className="font-semibold text-rose-600">TDS (5%)</span>
                                            <span className="font-bold text-rose-600">− {fmtFull(tds)}</span>
                                        </div>
                                        <div className="flex justify-between items-center bg-emerald-50 px-4 py-3 text-base">
                                            <span className="font-bold text-emerald-700">Net Payout</span>
                                            <span className="font-bold text-emerald-700">{fmtFull(net)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Save section */}
                            <div className="mt-4 pt-4 border-t border-slate-100">
                                <div className="flex items-center justify-between bg-slate-50 rounded-xl p-4 mb-4">
                                    <div>
                                        <p className="text-sm font-semibold text-slate-600">
                                            {hasSavedTarget ? "Update preview" : "Target to save"}
                                        </p>
                                        <p className="text-2xl font-bold">{fmtFull(disbursed)}</p>
                                        <p className="text-emerald-600">Net incentive: {fmtFull(net)}</p>
                                    </div>
                                    <span className="text-4xl">🎯</span>
                                </div>

                                <button
                                    onClick={handleOpenSaveModal}
                                    disabled={saving || loading || btnSaving || btnDone}
                                    className={`relative w-full py-3.5 px-6 rounded-xl font-bold text-white overflow-hidden transition-all
                    ${btnDone ? "bg-emerald-600" : btnSaving ? "bg-slate-200 text-slate-700" : "bg-gradient-to-r from-indigo-500 to-violet-600 shadow-lg"}
                  `}
                                >
                                    <div
                                        className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-violet-700 transition-all duration-300"
                                        style={{ width: btnSaving ? `${btnFillPct}%` : "0%" }}
                                    />
                                    <span className="relative z-10">
                                        {btnDone
                                            ? `✓ ${monthName} Saved!`
                                            : btnSaving || saving
                                                ? "Saving..."
                                                : hasSavedTarget
                                                    ? `✏️ Update ${monthName} Target`
                                                    : `📌 Save ${monthName} Target`}
                                    </span>
                                </button>

                                <p className="text-center text-xs text-slate-400 mt-2">
                                    Saves disbursement goal + net incentive to dashboard
                                </p>
                            </div>
                        </>
                    )}
                </div>

                {/* Phase Breakdown */}
                {phases.length > 0 && (
                    <div className="bg-white rounded-2xl shadow-sm p-5 border border-slate-100">
                        <div className="flex justify-between items-center mb-4">
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                                Phase Breakdown
                            </p>
                            <div className="flex gap-2">
                                <span className="text-xs bg-indigo-100 text-indigo-700 px-2.5 py-1 rounded-full">
                                    {phases.length} phase{phases.length > 1 ? "s" : ""}
                                </span>
                                {isManagerOwn && (
                                    <span className="text-xs bg-violet-100 text-violet-700 px-2.5 py-1 rounded-full">
                                        Own file
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="space-y-2 max-h-48 overflow-y-auto">
                            {phases.map((p: any, i: number) => (
                                <div
                                    key={p.phase}
                                    className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100 hover:bg-slate-100 transition-colors"
                                >
                                    <div
                                        className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white shrink-0"
                                        style={{ background: PHASE_COLORS[i % PHASE_COLORS.length] }}
                                    >
                                        {p.phase}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs text-slate-500">
                                            {fmtShort(p.from)} → {fmtShort(p.to)}
                                        </p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full rounded-full"
                                                    style={{
                                                        width: `${Math.min((p.incentive / gross) * 100, 100)}%`,
                                                        background: PHASE_COLORS[i % PHASE_COLORS.length],
                                                    }}
                                                />
                                            </div>
                                            <span className="text-xs font-semibold text-slate-600">
                                                {p.ratePercent.toFixed(2)}%
                                            </span>
                                        </div>
                                    </div>

                                    <div className="text-right">
                                        <p className="font-bold text-slate-800">{fmtFull(p.incentive)}</p>
                                        <p className="text-xs text-rose-500">−{fmtFull(p.incentive * TDS_RATE)}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-4 p-3 bg-gradient-to-r from-indigo-50 to-emerald-50 rounded-xl text-sm">
                            <p className="text-slate-600">
                                Gross: <strong>{fmtFull(gross)}</strong> − TDS:{" "}
                                <strong>{fmtFull(tds)}</strong> = Net:{" "}
                                <strong className="text-emerald-700">{fmtFull(net)}</strong>
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* Confirm Save Modal */}
            {showConfirmModal && (
                <div
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                    onClick={(e) => e.target === e.currentTarget && setShowConfirmModal(false)}
                >
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
                        <div className="h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-violet-500" />

                        <div className="p-6">
                            <h3 className="text-xl font-bold mb-1">
                                {hasSavedTarget ? `Update ${monthName}` : `Save ${monthName}`}
                            </h3>
                            <p className="text-sm text-slate-500 mb-5">
                                Confirm before {hasSavedTarget ? "updating" : "saving"}
                            </p>

                            <div className="bg-indigo-50/70 p-4 rounded-xl mb-6 border border-indigo-100">
                                <p className="text-sm font-semibold text-indigo-700 mb-2">Will be saved</p>
                                <div className="flex justify-between text-lg">
                                    <span>Disbursement:</span>
                                    <strong>{fmtFull(disbursed)}</strong>
                                </div>
                                <div className="flex justify-between mt-2 text-lg">
                                    <span>Net Incentive:</span>
                                    <strong className="text-emerald-700">{fmtFull(net)}</strong>
                                </div>
                            </div>

                            {activeRole?.hasSalary && !(role === "MANAGER" && managerFileType === "own") && (
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
                                        className={`w-full p-3.5 border ${salaryError ? "border-red-400" : "border-slate-300"} rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400`}
                                        autoFocus
                                    />
                                    {salaryError && <p className="text-red-600 text-sm mt-2">{salaryError}</p>}
                                </div>
                            )}

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowConfirmModal(false)}
                                    className="flex-1 py-3 border border-slate-300 rounded-xl font-medium hover:bg-slate-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleConfirmSave}
                                    disabled={saving || loading}
                                    className="flex-1 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold rounded-xl hover:brightness-105 disabled:opacity-70"
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
