'use client';

import { useDispatch, useSelector } from 'react-redux';

import type { RootState, AppDispatch } from '@/redux/store';
import {
    fetchTodayTarget,
    saveIncentiveTarget,
    clearIncentiveTargetState,
} from '@/redux/features/incentiveTarget/incentiveTargetSlice';

type SaveIncentiveTargetPayload = {
    designation: string;
    salary: number | null;
    targetDisbursed: number;
    targetIncentive: number;
    achievedAmount?: number;
};

export function useIncentiveTarget() {
    const dispatch = useDispatch<AppDispatch>();

    const {
        currentTarget,
        loading,
        saving,
        success,
        error,
    } = useSelector((state: RootState) => state.incentiveTarget);

    // Get employee & company from localStorage
    const getUserContext = () => {
        if (typeof window === "undefined") return null;

        try {
            const user = JSON.parse(localStorage.getItem("user") || "{}");

            return {
                employee_id: user?.id,
                company_id: user?.company_id,
            };
        } catch {
            return null;
        }
    };

    // Get current month/year in required format
    const getCurrentMonthYear = () => {
        const now = new Date();

        return {
            month: String(now.getMonth() + 1).padStart(2, "0"),
            year: String(now.getFullYear()),
        };
    };

    return {
        currentTarget,
        loading,
        saving,
        success,
        error,

        fetchTodayTarget: () => dispatch(fetchTodayTarget()),

        // UPDATED SAVE FUNCTION
        saveIncentiveTarget: (payload: SaveIncentiveTargetPayload) => {
            const userCtx = getUserContext();
            const { month, year } = getCurrentMonthYear();

            if (!userCtx?.employee_id || !userCtx?.company_id) {
                console.error("Missing employee/company context");

                return;
            }

            const finalPayload = {
                ...payload,
                employee_id: userCtx.employee_id,
                company_id: userCtx.company_id,
                month,
                year,
            };

            return dispatch(saveIncentiveTarget(finalPayload));
        },

        clearIncentiveTargetState: () =>
            dispatch(clearIncentiveTargetState()),
    };
}
