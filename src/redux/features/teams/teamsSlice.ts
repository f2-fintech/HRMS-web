/* eslint-disable newline-before-return */
/* eslint-disable padding-line-between-statements */
// features/teams/teamsSlice.ts

import { RootState } from '@/redux/store';
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

interface Employee {
  _id: string;
  first_name: string;
  last_name: string;
  image: string;
}

interface AttendanceSummary {
  onTime: Employee[];
  lateArrivals: Employee[];
  workFromHome: Employee[];
  totalOnTime: number;
  totalLate: number;
  totalWFH: number;
}

interface AttendanceStatus {
  date: string;
  status: string; // Present, Absent, On Leave, WFH, etc.
}

interface MonthlyAttendance {
  first_name: string;
  last_name: string;
  image: string;
  attendance: AttendanceStatus[];
}


interface Team {
  _id: string;
  name: string;
  manager_id: string;
  employee_ids: string;
  code: string;
  company_id: string;
  employees?: Employee[];
}

interface TeamsState {
  teams: Team[];
  offToday: Employee[];
  notInYet: Employee[];
  attendanceSummary: AttendanceSummary | null;
  teamsMemberMonthlyAttendence: MonthlyAttendance[] | null;
  loading: boolean;
  error: string | null;
  total: number
}

const initialState: TeamsState = {
  teams: [],
  offToday: [],
  notInYet: [],
  attendanceSummary: null,
  teamsMemberMonthlyAttendence: null,
  loading: false,
  error: null,
  total: 0
};



// Thunk for fetching teams
export const fetchTeams = createAsyncThunk('teams/fetchTeams', async ({ page, limit, keyword }: { page: number; limit: number; keyword: string }) => {
  const token = typeof window !== "undefined" ? localStorage.getItem('token') : "";
  const { company_id } = typeof window !== "undefined" ? JSON.parse(localStorage?.getItem("user")) : {};
  const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/teams/get?page=${page}&limit=${limit}&keyword=${encodeURIComponent(keyword)}`,
    {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token} ${company_id}`,
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    throw new Error('Failed to fetch teams');
  }
  return (await response.json()) as { teams: Team[], total: number };
});

export const fetchTeamsByManager = createAsyncThunk(
  'teams/fetchTeamsByManager',
  async (managerId: string) => {
    const token = typeof window !== "undefined" ? localStorage.getItem('token') : "";
    const { company_id } = typeof window !== "undefined" ? JSON.parse(localStorage?.getItem("user")) : {};
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/teams/manager/${managerId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token} ${company_id}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch teams by manager');
    }

    return (await response.json()) as Team[];
  }
);

export const fetchWhoIsOffToday = createAsyncThunk<
  Employee[],
  { team_id: string; company_id: string; date?: string },
  { state: RootState }
>('teams/fetchWhoIsOffToday', async ({ team_id, company_id, date }) => {
  let token: string | null = null;
  const { company_id: storedCompanyId } =
    typeof window !== 'undefined' ? JSON.parse(localStorage?.getItem('user')) : {};
  if (typeof window !== 'undefined') {
    token = localStorage?.getItem('token');
  }

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_APP_URL}/teams/who-is-off-today?team_id=${team_id}&company_id=${company_id}&date=${date || ''}`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token} ${storedCompanyId}`,
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    throw new Error('Failed to fetch who is off today');
  }

  return (await response.json()) as Employee[];
});

// Thunk for fetching employees who have not punched in yet today
export const fetchNotInYetToday = createAsyncThunk<
  Employee[],
  { team_id: string; company_id: string; date?: string },
  { state: RootState }
>('teams/fetchNotInYetToday', async ({ team_id, company_id, date }) => {
  let token: string | null = null;
  const { company_id: storedCompanyId } =
    typeof window !== 'undefined' ? JSON.parse(localStorage?.getItem('user')) : {};
  if (typeof window !== 'undefined') {
    token = localStorage?.getItem('token');
  }

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_APP_URL}/teams/not-in-yet-today?team_id=${team_id}&company_id=${company_id}&date=${date || ''}`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token} ${storedCompanyId}`,
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    throw new Error('Failed to fetch not in yet today');
  }

  return (await response.json()) as Employee[];
});

export const fetchAttendanceSummary = createAsyncThunk<
  AttendanceSummary,
  { team_id: string; company_id: string; date?: string },
  { state: RootState }
>('teams/fetchAttendanceSummary', async ({ team_id, company_id, date }) => {
  let token: string | null = null;
  const { company_id: storedCompanyId } =
    typeof window !== 'undefined' ? JSON.parse(localStorage?.getItem('user')) : {};
  if (typeof window !== 'undefined') {
    token = localStorage?.getItem('token');
  }

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_APP_URL}/teams/attendance-summary?team_id=${team_id}&company_id=${company_id}&date=${date || ''}`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token} ${storedCompanyId}`,
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    throw new Error('Failed to fetch attendance summary');
  }

  return (await response.json()) as AttendanceSummary;
});

export const fetchTeamsMemberMonthlyAttendence = createAsyncThunk<
  MonthlyAttendance[],
  { team_id: string; company_id: string; month: number; year: number },
  { state: RootState }
>('teams/fetchTeamsMemberMonthlyAttendence', async ({ team_id, company_id, month, year }) => {
  let token: string | null = null;
  const { company_id: storedCompanyId } =
    typeof window !== 'undefined' ? JSON.parse(localStorage?.getItem('user')) : {};
  if (typeof window !== 'undefined') {
    token = localStorage?.getItem('token');
  }

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_APP_URL}/teams/teams-attendance-status?team_id=${team_id}&company_id=${company_id}&month=${month}&year=${year}`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token} ${storedCompanyId}`,
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    throw new Error('Failed to fetch monthly attendance summary');
  }

  return (await response.json()) as MonthlyAttendance[];
});



const teamsSlice = createSlice({
  name: 'teams',
  initialState,
  reducers: {
    // You can add more reducers here for additional actions
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTeams.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTeams.fulfilled, (state, action) => {
        state.teams = action.payload.teams;
        state.total = action.payload.total;
        state.loading = false;
      })
      .addCase(fetchTeams.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Something went wrong';
      })

      .addCase(fetchTeamsByManager.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTeamsByManager.fulfilled, (state, action) => {
        state.teams = action.payload;
        state.loading = false;
      })
      .addCase(fetchTeamsByManager.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch teams by manager';
      })

      .addCase(fetchWhoIsOffToday.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchWhoIsOffToday.fulfilled, (state, action) => {
        state.offToday = action.payload;
        state.loading = false;
      })
      .addCase(fetchWhoIsOffToday.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Something went wrong';
      })

      // Fetch who has not come in yet today
      .addCase(fetchNotInYetToday.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchNotInYetToday.fulfilled, (state, action) => {
        state.notInYet = action.payload;
        state.loading = false;
      })
      .addCase(fetchNotInYetToday.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Something went wrong';
      })
      .addCase(fetchAttendanceSummary.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAttendanceSummary.fulfilled, (state, action) => {
        state.attendanceSummary = action.payload;
        state.loading = false;
      })
      .addCase(fetchAttendanceSummary.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch attendance summary';
      })
      .addCase(fetchTeamsMemberMonthlyAttendence.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTeamsMemberMonthlyAttendence.fulfilled, (state, action) => {
        state.teamsMemberMonthlyAttendence = action.payload;
        state.loading = false;
      })
      .addCase(fetchTeamsMemberMonthlyAttendence.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch monthly attendance summary';
      });

  },
});

export default teamsSlice.reducer;

export const selectWhoIsOffTodayState = (state: RootState) => state.teams.offToday;
export const selectNotInYetTodayState = (state: RootState) => state.teams.notInYet;
export const selectAttendanceSummary = (state: RootState) => state.teams.attendanceSummary;
export const selectTeamsMemberMonthlyAttendenceState = (state: RootState) => state.teams.teamsMemberMonthlyAttendence;
