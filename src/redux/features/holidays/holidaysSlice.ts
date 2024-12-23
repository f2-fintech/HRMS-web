import type { PayloadAction } from "@reduxjs/toolkit";
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";


interface Holiday {
  _id: string;
  title: string;
  start_date: Date;
  end_date: Date;
  note: string;
  day: string;
}

interface holidaysState {
  holidays: Holiday[];
  filteredHoliday: Holiday[];
  loading: boolean;
  error: string | null;
  total: number
}

const initialState: holidaysState = {
  holidays: [],
  filteredHoliday: [],
  loading: false,
  error: null,
  total: 0
};

export const fetchHolidays = createAsyncThunk<{
  holidays: Holiday[];
  total: number;
}, { page?: number; limit?: number; keyword?: string }>(
  'holidays/fetchHolidays',
  async ({ page, limit, keyword }: { page: number; limit: number; keyword: string }) => {

    let token: string | null = null;
    const { company_id } = typeof window !== "undefined" ? JSON.parse(localStorage?.getItem("user")) : {};

    if (typeof window !== "undefined") {
      token = localStorage?.getItem("token");
    }

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL}/holidays/get?page=${page}&limit=${limit}&keyword=${encodeURIComponent(keyword)}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token} ${company_id}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch holidays');
    }


    return (await response.json()) as { holidays: Holiday[], total: number };
  })

const holidaysSlice = createSlice({
  name: 'holidays',
  initialState,
  reducers: {
    filterHoliday(state, action: PayloadAction<{ title: string }>) {
      const { title } = action.payload;

      state.filteredHoliday = state.holidays.filter((holiday) => {
        return title ? holiday.title.toLowerCase().includes(title.toLowerCase()) : true;
      });
    },
    resetFilter(state) {
      state.filteredHoliday = state.holidays;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchHolidays.pending, (state) => {
      state.loading = true;
      state.error = null;
    })
      .addCase(fetchHolidays.fulfilled, (state, action) => {
        state.holidays = action.payload.holidays;
        state.total = action.payload.total; // Set total number of records
        state.loading = false;
      })
      .addCase(fetchHolidays.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Something went wrong';
      })
  }
});

export const { filterHoliday, resetFilter } = holidaysSlice.actions;

export default holidaysSlice.reducer;
