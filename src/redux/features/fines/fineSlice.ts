import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

import type { RootState } from '@/redux/store';

interface Fine {
  _id: string;
  fineType: string;
  fineAmount: string;
  fineDate: string;
  employee: {
    _id: string;
    first_name: string;
    last_name: string;
    image: string;
  };
}

interface FineState {
  fines: Fine[];
  filteredFines: Fine[];
  loading: boolean;
  error: string | null;
  total: number;
}

const initialState: FineState = {
  fines: [],
  filteredFines: [],
  loading: false,
  error: null,
  total: 0,
};

// Async action to fetch all fines without pagination, limit, or keyword
export const fetchFines = createAsyncThunk<{
  fines: Fine[];
  total: number;
}, { page?: number; limit?: number; keyword?: string; month?: string; year?: string }, { state: RootState }>(
  'fines/fetchFines',
  async ({ page, limit, keyword, month, year }: { page: number; limit: number; keyword: string; month: string; year: string; }) => {
    let token: string | null = null;

    if (typeof window !== "undefined") {
      token = localStorage?.getItem('token');
    }

    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/fines/getAll?page=${page}&limit=${limit}&month=${month}&year=${year}&keyword=${encodeURIComponent(keyword)}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch fines');
    }

    return (await response.json()) as { fines: Fine[], total: number };
  }
);

// Fine Slice
const fineSlice = createSlice({
  name: 'fines',
  initialState,
  reducers: {
    filterFines(state, action: PayloadAction<{ name: string; fineType: string }>) {
      const { name, fineType } = action.payload;

      state.filteredFines = state.fines.filter((fine) => {
        return (
          (name
            ? fine.employee.first_name.toLowerCase().includes(name.toLowerCase()) ||
            fine.employee.last_name.toLowerCase().includes(name.toLowerCase())
            : true) &&
          (fineType ? fine.fineType === fineType : true)
        );
      });
    },
    resetFilter(state) {
      state.filteredFines = state.fines;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchFines.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchFines.fulfilled, (state, action) => {
        state.fines = action.payload.fines;
        state.total = action.payload.total; // Set total number of records
        state.loading = false;
      })
      .addCase(fetchFines.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Something went wrong';
      });
  },
});

// Export actions for filtering fines and resetting the filter
export const { filterFines, resetFilter } = fineSlice.actions;

// Export the fine reducer
export default fineSlice.reducer;

// Selector to access the fines state in components
export const selectFineState = (state: RootState) => state.fines;
