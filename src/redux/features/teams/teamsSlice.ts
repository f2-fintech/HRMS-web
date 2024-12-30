/* eslint-disable newline-before-return */
/* eslint-disable padding-line-between-statements */
// features/teams/teamsSlice.ts

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

interface Team {
  _id: string;
  name: string;
  manager_id: string;
  employee_ids: string;
  code: string;
  company_id: string;
}

interface TeamsState {
  teams: Team[];
  loading: boolean;
  error: string | null;
  total: number
}

const initialState: TeamsState = {
  teams: [],
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
      });
  },
});

export default teamsSlice.reducer;
