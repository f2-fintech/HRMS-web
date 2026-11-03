import type { PayloadAction } from '@reduxjs/toolkit';
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

interface DashboardPreferencesState {
    hiddenCards: string[];
    loading: boolean;
    error: string | null;
}

const initialState: DashboardPreferencesState = {
    hiddenCards: [],
    loading: false,
    error: null,
};

// Fetch user preferences
export const fetchPreferences = createAsyncThunk<
    { hiddenCards: string[] },
    { companyId: string }
>(
    'dashboardPreferences/fetchPreferences',
    async ({ companyId }) => {
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

        const response = await fetch(
            `${process.env.NEXT_PUBLIC_APP_URL}/dashboard-preferences/get/${companyId}`,
            {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            }
        );

        if (!response.ok) {
            throw new Error('Failed to fetch dashboard preferences');
        }

        return await response.json();
    }
);

// Update user preferences
export const updatePreferences = createAsyncThunk<
    { hiddenCards: string[] },
    { companyId: string; hiddenCards: string[] }
>(
    'dashboardPreferences/updatePreferences',
    async ({ companyId, hiddenCards }) => {
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

        const response = await fetch(
            `${process.env.NEXT_PUBLIC_APP_URL}/dashboard-preferences/update/${companyId}`,
            {
                method: 'PUT',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ company_id: companyId, hiddenCards }), // ✅ FIX: Ensure company_id is passed in the body
            }
        );

        if (!response.ok) {
            throw new Error('Failed to update dashboard preferences');
        }

        return { hiddenCards };
    }
);

const dashboardPreferencesSlice = createSlice({
    name: 'dashboardPreferences',
    initialState,
    reducers: {
        resetPreferences(state) {
            state.hiddenCards = [];
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchPreferences.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchPreferences.fulfilled, (state, action) => {
                state.hiddenCards = action.payload.hiddenCards;
                state.loading = false;
            })
            .addCase(fetchPreferences.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Something went wrong';
            })
            .addCase(updatePreferences.pending, (state) => {
                state.loading = true;
            })
            .addCase(updatePreferences.fulfilled, (state, action) => {
                state.hiddenCards = action.payload.hiddenCards;
                state.loading = false;
            })
            .addCase(updatePreferences.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Failed to update preferences';
            });
    },
});

export const { resetPreferences } = dashboardPreferencesSlice.actions;
export default dashboardPreferencesSlice.reducer;
