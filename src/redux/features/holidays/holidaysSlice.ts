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

interface HolidaysState {
  // Upcoming holidays state
  holidays: Holiday[];
  filteredHoliday: Holiday[];
  loading: boolean;
  error: string | null;
  total: number;

  // Past holidays state
  pastHolidays: Holiday[];
  filteredPastHoliday: Holiday[];
  pastLoading: boolean;
  pastError: string | null;
  pastTotal: number;
}

const initialState: HolidaysState = {
  // Upcoming
  holidays: [],
  filteredHoliday: [],
  loading: false,
  error: null,
  total: 0,

  // Past
  pastHolidays: [],
  filteredPastHoliday: [],
  pastLoading: false,
  pastError: null,
  pastTotal: 0,
};

// Async thunk for upcoming holidays (unchanged)
export const fetchHolidays = createAsyncThunk<{
  holidays: Holiday[];
  total: number;
}, { page: number; limit: number; keyword: string }>(
  'holidays/fetchHolidays',
  async ({ page, limit, keyword }) => {
    let token: string | null = null;
    const { company_id } = typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("user") || '{}')
      : {};

    if (typeof window !== "undefined") {
      token = localStorage.getItem("token");
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

    return (await response.json()) as { holidays: Holiday[]; total: number };
  }
);

// Async thunk for past holidays
export const fetchPastHolidays = createAsyncThunk<{
  holidays: Holiday[];
  total: number;
}, { page: number; limit: number; keyword: string }>(
  'holidays/fetchPastHolidays',
  async ({ page, limit, keyword }) => {
    let token: string | null = null;
    const { company_id } = typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("user") || '{}')
      : {};

    if (typeof window !== "undefined") {
      token = localStorage.getItem("token");
    }

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL}/holidays/getPast?page=${page}&limit=${limit}&keyword=${encodeURIComponent(keyword)}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token} ${company_id}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch past holidays');
    }

    return (await response.json()) as { holidays: Holiday[]; total: number };
  }
);

const holidaysSlice = createSlice({
  name: 'holidays',
  initialState,
  reducers: {
    // Filter upcoming holidays by title
    filterHoliday(state, action: PayloadAction<{ title: string }>) {
      const { title } = action.payload;
      state.filteredHoliday = state.holidays.filter((holiday) =>
        title ? holiday.title.toLowerCase().includes(title.toLowerCase()) : true
      );
    },
    resetFilter(state) {
      state.filteredHoliday = state.holidays;
    },
    // Filter past holidays by title
    filterPastHoliday(state, action: PayloadAction<{ title: string }>) {
      const { title } = action.payload;
      state.filteredPastHoliday = state.pastHolidays.filter((holiday) =>
        title ? holiday.title.toLowerCase().includes(title.toLowerCase()) : true
      );
    },
    resetPastFilter(state) {
      state.filteredPastHoliday = state.pastHolidays;
    },
  },
  extraReducers: (builder) => {
    // Upcoming holidays cases
    builder.addCase(fetchHolidays.pending, (state) => {
      state.loading = true;
      state.error = null;
    })
      .addCase(fetchHolidays.fulfilled, (state, action) => {
        state.holidays = action.payload.holidays;
        state.filteredHoliday = action.payload.holidays; // Optionally update filtered list
        state.total = action.payload.total;
        state.loading = false;
      })
      .addCase(fetchHolidays.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Something went wrong';
      });

    // Past holidays cases
    builder.addCase(fetchPastHolidays.pending, (state) => {
      state.pastLoading = true;
      state.pastError = null;
    })
      .addCase(fetchPastHolidays.fulfilled, (state, action) => {
        state.pastHolidays = action.payload.holidays;
        state.filteredPastHoliday = action.payload.holidays; // Optionally update filtered list
        state.pastTotal = action.payload.total;
        state.pastLoading = false;
      })
      .addCase(fetchPastHolidays.rejected, (state, action) => {
        state.pastLoading = false;
        state.pastError = action.error.message || 'Something went wrong';
      });
  }
});

export const { filterHoliday, resetFilter, filterPastHoliday, resetPastFilter } = holidaysSlice.actions;

export default holidaysSlice.reducer;
