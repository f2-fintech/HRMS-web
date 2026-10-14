"use client";

import { useState } from "react";

import { getMonthLabelFromDateString } from "@/utils/Incentive-calculator/calculations";

type MonthlyTargetCardProps = {
    currentTarget: any;
    monthName: string;
    daysLeft: number;
    fmtFull: (n: number) => string;
    saveIncentiveTarget: (data: any) => Promise<void>;
    loading: boolean;
    saving: boolean;
};

export default function MonthlyTargetCard({
    currentTarget,
    monthName,
    daysLeft,
    fmtFull,
    saveIncentiveTarget,
    loading,
    saving,
}: MonthlyTargetCardProps) {
    const [showAchievedModal, setShowAchievedModal] = useState(false);
    const [editAchievedValue, setEditAchievedValue] = useState("");
    const [achievedError, setAchievedError] = useState("");

    if (!currentTarget) return null;

    const targetAmount = Math.floor(currentTarget.targetDisbursed || 0);
    const achievedAmount = Math.floor(currentTarget.achievedAmount || 0);
    const remainingAmount = Math.max(targetAmount - achievedAmount, 0);

    const achievedPercent =
        targetAmount > 0 ? (achievedAmount / targetAmount) * 100 : 0;

    const handleConfirmAchievedUpdate = async () => {
        const value = Number(editAchievedValue);

        if (!editAchievedValue || isNaN(value) || value < 0) {
            setAchievedError("Please enter a valid amount.");

            return;
        }

        await saveIncentiveTarget({
            ...currentTarget,
            achievedAmount: Math.floor(value),
        });

        setShowAchievedModal(false);
        setAchievedError("");
    };

    return (
        <>
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 mb-4">
                {/* TOP SECTION */}
                <div className="flex items-start justify-between gap-4 mb-4">
                    <div>
                        <p className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
                            Monthly Target
                        </p>

                        <div className="flex items-center gap-2 mt-1">
                            <h2 className="text-3xl font-extrabold text-amber-600 tabular-nums">
                                {fmtFull(targetAmount)}
                            </h2>
                            <span className="text-2xl">🎯</span>
                        </div>

                        <p className="text-sm text-slate-500 mt-1">
                            {getMonthLabelFromDateString(currentTarget.date)}
                        </p>
                    </div>

                    <div className="text-right">
                        <p className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
                            Days Left
                        </p>
                        <p className="text-2xl font-bold text-slate-400 mt-1">
                            {daysLeft}d
                        </p>
                    </div>
                </div>

                {/* ACHIEVED SECTION */}
                <div className="mb-4">
                    <div className="flex items-center justify-between mb-1">
                        <div>
                            <p className="text-sm text-slate-500">
                                Current achieved
                            </p>
                            <p className="text-xl font-bold text-emerald-700 tabular-nums">
                                {fmtFull(achievedAmount)}{" "}
                                <span className="text-sm text-slate-500">
                                    ({achievedPercent.toFixed(0)}%)
                                </span>
                            </p>
                        </div>

                        {/* FIXED CURSOR */}
                        <button
                            onClick={() => {
                                setEditAchievedValue(String(achievedAmount));
                                setAchievedError("");
                                setShowAchievedModal(true);
                            }}
                            className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold hover:bg-slate-50 cursor-pointer"
                        >
                            ✏️ Edit
                        </button>
                    </div>

                    <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{
                                width: `${Math.min(achievedPercent, 100)}%`,
                                background:
                                    "linear-gradient(90deg, #34d399, #10b981)",
                            }}
                        />
                    </div>
                </div>

                {/* STATS GRID */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-3 text-center">
                        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                            Target
                        </p>
                        <p className="text-xl font-bold text-amber-700 mt-1">
                            {fmtFull(targetAmount)}
                        </p>
                    </div>

                    <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-3 text-center">
                        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                            Achieved
                        </p>
                        <p className="text-xl font-bold text-emerald-700 mt-1">
                            {fmtFull(achievedAmount)}
                        </p>
                    </div>

                    <div className="rounded-xl border border-rose-200 bg-rose-50/60 p-3 text-center">
                        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                            Remaining
                        </p>
                        <p className="text-xl font-bold text-rose-700 mt-1">
                            {fmtFull(remainingAmount)}
                        </p>
                    </div>
                </div>
            </div>

            {/* MODAL */}
            {showAchievedModal && (
                <div
                    className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                    onClick={(e) =>
                        e.target === e.currentTarget &&
                        setShowAchievedModal(false)
                    }
                >
                    <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full overflow-hidden">
                        <div className="h-1.5 bg-gradient-to-r from-emerald-400 to-teal-400" />

                        <div className="p-5">
                            <h3 className="text-lg font-bold mb-1">
                                Edit Achieved Amount
                            </h3>
                            <p className="text-sm text-slate-500 mb-4">
                                Update progress for {monthName}
                            </p>

                            <div className="bg-emerald-50/70 p-3 rounded-lg mb-4 border border-emerald-100">
                                <p className="text-xs font-semibold text-emerald-700 mb-1">
                                    Current target
                                </p>
                                <p className="text-xl font-bold text-amber-700">
                                    {fmtFull(targetAmount)}
                                </p>
                            </div>

                            <label className="block text-sm font-semibold text-slate-600 mb-1">
                                New achieved amount
                            </label>

                            {/* INPUT FIXED */}
                            <input
                                type="number"
                                value={editAchievedValue}
                                onChange={(e) => {
                                    setEditAchievedValue(
                                        Math.floor(Number(e.target.value || 0)).toString()
                                    );
                                    setAchievedError("");
                                }}
                                className={`w-full p-3 border ${achievedError
                                    ? "border-red-400"
                                    : "border-slate-300"
                                    } rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400`}
                                style={{ cursor: "text" }}
                                autoFocus
                            />

                            {achievedError && (
                                <p className="text-red-600 text-sm mt-2">
                                    {achievedError}
                                </p>
                            )}

                            <div className="flex gap-3 mt-5">
                                <button
                                    onClick={() =>
                                        setShowAchievedModal(false)
                                    }
                                    className="flex-1 py-2.5 border border-slate-300 rounded-lg font-medium hover:bg-slate-50 cursor-pointer"
                                >
                                    Cancel
                                </button>

                                <button
                                    onClick={handleConfirmAchievedUpdate}
                                    disabled={saving || loading}
                                    className="flex-1 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold rounded-lg hover:brightness-105 disabled:opacity-70 cursor-pointer"
                                >
                                    Save
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
