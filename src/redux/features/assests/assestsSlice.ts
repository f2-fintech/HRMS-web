import type { PayloadAction } from "@reduxjs/toolkit";
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import type { RootState } from "@/redux/store";


interface Assest {
  _id: string;
  employee: {
    _id: string;
    first_name: string;
    last_name: string;
    image: string;
  };
  employee_id: string;
  name: string;
  assignment_date: string;
  return_date: string;
}

interface assestsState {
  assests: Assest[];
  filteredAssest: Assest[];
  loading: boolean;
  error: string | null;
  total: number
}

const initialState: assestsState = {
  assests: [],
  filteredAssest: [],
  loading: false,
  error: null,
  total: 0
}



export const fetchAssests = createAsyncThunk<{
  assests: Assest[];
  total: number;
}, { page?: number; limit?: number; keyword?: string }, { state: RootState }>(
  'leaves/fetchAssests',
  async ({ page, limit, keyword }: { page: number; limit: number; keyword: string }) => {
    let token: string | null = null;
    const user = typeof window !== "undefined" ? JSON.parse(localStorage?.getItem("user") || '{}') : {};
    const company_id = user?.company_id;
    if (typeof window !== "undefined") {
      token = localStorage?.getItem('token');
    }

    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/assests/get?page=${page}&limit=${limit}&keyword=${encodeURIComponent(keyword)}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token} ${company_id}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch assests')
    }


    return (await response.json()) as { assests: Assest[], total: number };
  })

const assestsSlice = createSlice({
  name: 'assests',
  initialState,
  reducers: {
    filterAssest(state, action: PayloadAction<{ name: string }>) {
      const { name } = action.payload

      state.filteredAssest = state.assests.filter(assest => {
        return (
          (name ? assest.employee.first_name.toLowerCase().includes(name.toLowerCase()) || assest.employee.last_name.toLowerCase().includes(name.toLowerCase()) : true)
        );
      })
    },
    resetFilter(state) {
      state.filteredAssest = state.assests;
    }
  },
  extraReducers: (builder) => {
    builder.addCase(fetchAssests.pending, (state) => {
      state.loading = true;
      state.error = null;
    })
      .addCase(fetchAssests.fulfilled, (state, action) => {
        state.assests = action.payload.assests;
        state.total = action.payload.total; // Set total number of records
        state.loading = false;
      })
      .addCase(fetchAssests.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Something went wrong';
      })
  },
})

export const { filterAssest, resetFilter } = assestsSlice.actions;

export default assestsSlice.reducer;
