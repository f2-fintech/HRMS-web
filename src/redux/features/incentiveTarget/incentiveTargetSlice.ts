'use client';

import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

type IncentiveTargetData = {
    _id?: string;
    employee_id: string;
    company_id: string;
    month: string;
    year: string;
    date?: string;
    designation: string;
    salary: number | null;
    targetDisbursed: number;
    targetIncentive: number;
    achievedAmount: number;
    isActive?: boolean;
    createdAt?: string;
    updatedAt?: string;
};

type IncentiveTargetState = {
    currentTarget: IncentiveTargetData | null;
    loading: boolean;
    saving: boolean;
    error: string | null;
    success: boolean;
};

const initialState: IncentiveTargetState = {
    currentTarget: null,
    loading: false,
    saving: false,
    error: null,
    success: false,
};

// month/year helper
function getCurrentMonthYear() {
    const d = new Date();

    return {
        month: String(d.getMonth() + 1).padStart(2, '0'), // "01" - "12"
        year: String(d.getFullYear()), // "2026"
    };
}

// ─────────────────────────────────────────────────────────────
// FETCH TARGET (UPDATED)
// ─────────────────────────────────────────────────────────────
export const fetchTodayTarget = createAsyncThunk(
    'incentiveTarget/fetchTodayTarget',
    async (_, { rejectWithValue }) => {
        try {
            const user =
                typeof window !== 'undefined'
                    ? JSON.parse(localStorage.getItem('user') || '{}')
                    : {};

            const token =
                typeof window !== 'undefined'
                    ? localStorage.getItem('token')
                    : null;

            const employeeId = user?.id || user?._id || '';

            if (!employeeId) {
                return rejectWithValue('Employee ID not found');
            }

            const { month, year } = getCurrentMonthYear();

            // UPDATED API
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_APP_URL}/incentive-targets/by-month/${employeeId}?month=${month}&year=${year}`,
                {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        ...(token ? { Authorization: `Bearer ${token}` } : {}),
                    },
                }
            );

            if (!res.ok) {
                if (res.status === 404) return null;
                const err = await res.json().catch(() => ({}));

                return rejectWithValue(err?.message || 'Failed to fetch target');
            }

            const data = await res.json();

            return data || null;
        } catch (error: any) {
            return rejectWithValue(error?.message || 'Failed to fetch target');
        }
    }
);

// ─────────────────────────────────────────────────────────────
// TARGET (UPDATED)
// ─────────────────────────────────────────────────────────────
export const saveIncentiveTarget = createAsyncThunk(
    'incentiveTarget/saveIncentiveTarget',
    async (
        payload: {
            designation: string;
            salary: number | null;
            targetDisbursed: number;
            targetIncentive: number;
            achievedAmount?: number;
        },
        { rejectWithValue }
    ) => {
        try {
            const user =
                typeof window !== 'undefined'
                    ? JSON.parse(localStorage.getItem('user') || '{}')
                    : {};

            const token =
                typeof window !== 'undefined'
                    ? localStorage.getItem('token')
                    : null;

            const employee_id = user?.id || user?._id || '';
            const company_id = user?.company_id || '';

            if (!employee_id || !company_id) {
                return rejectWithValue('Employee/company details missing');
            }

            const { month, year } = getCurrentMonthYear();

            const body = {
                employee_id,
                company_id,
                month,
                year,
                designation: payload.designation,
                salary: payload.salary,
                targetDisbursed: payload.targetDisbursed,
                targetIncentive: payload.targetIncentive,
                achievedAmount: payload.achievedAmount ?? 0,
            };

            const res = await fetch(
                `${process.env.NEXT_PUBLIC_APP_URL}/incentive-targets/save`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        ...(token ? { Authorization: `Bearer ${token}` } : {}),
                    },
                    body: JSON.stringify(body),
                }
            );

            const data = await res.json().catch(() => ({}));

            if (!res.ok) {
                return rejectWithValue(data?.message || 'Failed to save target');
            }

            return data?.data || data;
        } catch (error: any) {
            return rejectWithValue(error?.message || 'Failed to save target');
        }
    }
);

// ─────────────────────────────────────────────────────────────
// SLICE
// ─────────────────────────────────────────────────────────────
const incentiveTargetSlice = createSlice({
    name: 'incentiveTarget',
    initialState,
    reducers: {
        clearIncentiveTargetState: (state) => {
            state.error = null;
            state.success = false;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchTodayTarget.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchTodayTarget.fulfilled, (state, action) => {
                state.loading = false;
                state.currentTarget = action.payload || null;
            })
            .addCase(fetchTodayTarget.rejected, (state, action: any) => {
                state.loading = false;
                state.error = action.payload || 'Failed to fetch target';
            })

            .addCase(saveIncentiveTarget.pending, (state) => {
                state.saving = true;
                state.error = null;
                state.success = false;
            })
            .addCase(saveIncentiveTarget.fulfilled, (state, action) => {
                state.saving = false;
                state.success = true;
                state.currentTarget = action.payload || null;
            })
            .addCase(saveIncentiveTarget.rejected, (state, action: any) => {
                state.saving = false;
                state.error = action.payload || 'Failed to save target';
            });
    },
});

export const { clearIncentiveTargetState } = incentiveTargetSlice.actions;
export default incentiveTargetSlice.reducer;
