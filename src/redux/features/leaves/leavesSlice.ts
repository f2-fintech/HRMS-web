import type { PayloadAction } from '@reduxjs/toolkit';
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

import type { RootState } from '@/redux/store';
import { utility } from '@/utility';

interface Leave {
  _id: string;
  employee: {
    _id: string;
    first_name: string;
    last_name: string;
    image: string;
  };
  employee_id: string;
  start_date: string;
  end_date: string;
  status: string;
  application: string;
  reason: string;
  type: string;
  day: string;
}

interface leaveState {
  leaves: Leave[];
  filteredLeave: Leave[];
  loading: boolean;
  error: string | null;
  total: number;
}

const initialState: leaveState = {
  leaves: [],
  filteredLeave: [],
  loading: false,
  error: null,
  total: 0,
};


export const fetchLeaves = createAsyncThunk<{
  leaves: Leave[];
  total: number;
}, { page?: number; limit?: number; keyword?: string; month?: string; year?: string }, { state: RootState }>(
  'leaves/fetchLeaves',
  async ({ page, limit, keyword, month, year }: { page: number; limit: number; keyword: string; month: string; year: string }) => {
    const { isTokenExpired } = utility();
    let token: string | null = null;
    const { company_id } = typeof window !== "undefined" ? JSON.parse(localStorage?.getItem("user")) : {};

    if (typeof window !== "undefined") {
      token = localStorage?.getItem('token');
    }

    if (!token || isTokenExpired(token)) {
      // Clean up localStorage if needed
      if (token) {
        localStorage.removeItem('token');
      }

      // Redirect to login with page refresh
      window.location.href = '/login';
      return { error: token ? "Token expired" : "No token found" };
    }

    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/leaves/get?page=${page}&limit=${limit}&month=${month}&year=${year}&keyword=${encodeURIComponent(keyword)}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token} ${company_id}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch leaves');
    }

    return (await response.json()) as { leaves: Leave[], total: number };
  }
);

const leaveSlice = createSlice({
  name: 'leaves',
  initialState,
  reducers: {
    filterLeave(state, action: PayloadAction<{ name: string; status: string }>) {
      const { name, status } = action.payload;

      state.filteredLeave = state.leaves.filter((leave) => {
        return (
          (name
            ? leave.employee.first_name.toLowerCase().includes(name.toLowerCase()) ||
            leave.employee.last_name.toLowerCase().includes(name.toLowerCase())
            : true) && (status ? leave.status === status : true)
        );
      });
    },
    resetFilter(state) {
      state.filteredLeave = state.leaves;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchLeaves.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchLeaves.fulfilled, (state, action) => {
        state.leaves = action.payload.leaves;
        state.total = action.payload.total; // Set total number of records
        state.loading = false;
      })
      .addCase(fetchLeaves.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Something went wrong';
      });
  },
});

export const { filterLeave, resetFilter } = leaveSlice.actions;
export default leaveSlice.reducer;
