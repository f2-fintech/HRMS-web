import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

import type { RootState } from '@/redux/store';
import { utility } from '@/utility';

interface Employee {
    _id: string;
    first_name: string;
    last_name: string;
    email: string;
    code: string;
    image: string;
    designation: string;
}

interface Payroll {
    _id: string;
    employee: Employee;
    company_id: string;
    month: number;
    year: number;
    basicPay: number;
    incentive: number;
    totalPaydays: number;
    leaveTaken: number;
    leaveDeducted: number;
    perDaySalary: number;
    leaveDeductionAmount: number;
    fineAmount: number;
    grossAmount: number;
    totalDeductions: number;
    netAmount: number;
    status: 'draft' | 'approved' | 'paid';
    remarks: string;
    payslipGenerated: boolean;
    createdAt: string;
    updatedAt: string;
}

interface PayrollTemplate {
    _id: string;
    employee: Employee;
    company_id: string;
    basicPay: number;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

interface PayrollState {
    payrolls: Payroll[];
    templates: PayrollTemplate[];
    loading: boolean;
    error: string | null;
    total: number;
    templateTotal: number;
}

const initialState: PayrollState = {
    payrolls: [],
    templates: [],
    loading: false,
    error: null,
    total: 0,
    templateTotal: 0,
};

// Async action to fetch payrolls
export const fetchPayrolls = createAsyncThunk<
    { payrolls: Payroll[]; total: number },
    { page?: number; limit?: number; keyword?: string; month?: string; year?: string; status?: string },
    { state: RootState }
>(
    'payroll/fetchPayrolls',
    async ({ page = 1, limit = 10, keyword = '', month = '', year = '', status = '' }) => {
        const { isTokenExpired } = utility();
        let token: string | null = null;
        const { company_id } = typeof window !== "undefined" ? JSON.parse(localStorage?.getItem("user") || "{}") : {};

        if (typeof window !== "undefined") {
            token = localStorage?.getItem('token');
        }

        if (!token || isTokenExpired(token)) {
            if (token) {
                localStorage.removeItem('token');
            }
            window.location.href = '/login';
            return { payrolls: [], total: 0 };
        }

        const params = new URLSearchParams({
            page: page.toString(),
            limit: limit.toString(),
            keyword,
            month,
            year,
            status,
        });

        const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/payroll/getAll?${params}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token} ${company_id}`,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error('Failed to fetch payrolls');
        }

        return (await response.json()) as { payrolls: Payroll[]; total: number };
    }
);

// Async action to fetch payroll templates
export const fetchPayrollTemplates = createAsyncThunk<
    { templates: PayrollTemplate[]; total: number },
    { page?: number; limit?: number },
    { state: RootState }
>(
    'payroll/fetchPayrollTemplates',
    async ({ page = 1, limit = 10 }) => {
        const { isTokenExpired } = utility();
        let token: string | null = null;
        const { company_id } = typeof window !== "undefined" ? JSON.parse(localStorage?.getItem("user") || "{}") : {};

        if (typeof window !== "undefined") {
            token = localStorage?.getItem('token');
        }

        if (!token || isTokenExpired(token)) {
            if (token) {
                localStorage.removeItem('token');
            }
            window.location.href = '/login';
            return { templates: [], total: 0 };
        }

        const params = new URLSearchParams({
            page: page.toString(),
            limit: limit.toString(),
        });

        const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/payroll/templates/getAll?${params}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token} ${company_id}`,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error('Failed to fetch payroll templates');
        }

        return (await response.json()) as { templates: PayrollTemplate[]; total: number };
    }
);

// Payroll Slice
const payrollSlice = createSlice({
    name: 'payroll',
    initialState,
    reducers: {
        clearPayrollError(state) {
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            // Fetch Payrolls
            .addCase(fetchPayrolls.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchPayrolls.fulfilled, (state, action) => {
                state.payrolls = action.payload.payrolls;
                state.total = action.payload.total;
                state.loading = false;
            })
            .addCase(fetchPayrolls.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Something went wrong';
            })
            // Fetch Templates
            .addCase(fetchPayrollTemplates.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchPayrollTemplates.fulfilled, (state, action) => {
                state.templates = action.payload.templates;
                state.templateTotal = action.payload.total;
                state.loading = false;
            })
            .addCase(fetchPayrollTemplates.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Something went wrong';
            });
    },
});

export const { clearPayrollError } = payrollSlice.actions;

export default payrollSlice.reducer;

export const selectPayrollState = (state: RootState) => state.payroll;
