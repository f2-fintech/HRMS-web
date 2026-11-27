import type { PayloadAction } from "@reduxjs/toolkit";
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";


interface Company {
    _id: string;
    name: string;
    address: Date;
    website: Date;
}

interface companyState {
    companies: Company[];
    loading: boolean;
    error: string | null;
    total: number
}

const initialState: companyState = {
    companies: [],
    loading: false,
    error: null,
    total: 0
};

export const fetchCompanies = createAsyncThunk<{
    companies: Company[];
    total: number;
}, { page?: number; limit?: number; keyword?: string }>(
    'companies/fetchCompanies',
    async ({ page, limit, keyword }: { page: number; limit: number; keyword: string }) => {
        const response = await fetch(
            `${process.env.NEXT_PUBLIC_APP_URL}/company/get?page=${page}&limit=${limit}&keyword=${encodeURIComponent(keyword)}`
        );

        if (!response.ok) {
            throw new Error('Failed to fetch companies');
        }


        return (await response.json()) as { companies: Company[], total: number };
    })

const companiesSlice = createSlice({
    name: 'companies',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder.addCase(fetchCompanies.pending, (state) => {
            state.loading = true;
            state.error = null;
        })
            .addCase(fetchCompanies.fulfilled, (state, action) => {
                state.companies = action.payload.companies;
                state.total = action.payload.total; // Set total number of records
                state.loading = false;
            })
            .addCase(fetchCompanies.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Something went wrong';
            })
    }
});

export const { filterHoliday, resetFilter } = companiesSlice.actions;

export default companiesSlice.reducer;
