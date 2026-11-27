import { utility } from '@/utility'
import type { PayloadAction } from '@reduxjs/toolkit'
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'

interface Award {
  _id: string
  employeeName: string
  location: string
  amount: string
  awardTitle: string
}

interface AwardsState {
  awards: Award[]
  specificAward: Award[];
  loading: boolean
  error: string | null
}

const initialState: AwardsState = {
  awards: [],
  specificAward: [],
  loading: false,
  error: null
}

// Async thunk to fetch awards from the server
export const fetchAwards = createAsyncThunk<Award[]>('awards/fetchAwards', async () => {
  let token: string | null = null;
  const { company_id } = typeof window !== "undefined" ? JSON.parse(localStorage?.getItem("user")) : {};

  if (typeof window !== "undefined") {
    token = localStorage?.getItem("token");
  }
  const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/awards`,
    {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token} ${company_id}`,
        'Content-Type': 'application/json',
      },
    }
  )

  if (!response.ok) {
    throw new Error('Failed to fetch awards')
  }

  return (await response.json()) as Award[]
})

// Async thunk to fetch specific awards (awards/get)
export const fetchSpecificAwards = createAsyncThunk<Award[], void, { rejectValue: string }>(
  'awards/fetchSpecificAwards',
  async (_, { rejectWithValue }) => {
    try {
      let token: string | null = null;
      const user =
        typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || '{}') : {};
      const company_id = user.company_id;

      if (typeof window !== 'undefined') {
        token = localStorage?.getItem('token');
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/awards/get`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token} ${company_id}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch specific awards');
      }

      return (await response.json()) as Award[];
    } catch (error) {
      return rejectWithValue((error as Error).message || 'Failed to fetch specific awards');
    }
  }
);

const awardsSlice = createSlice({
  name: 'awards',
  initialState,
  reducers: {
    addAward(state, action: PayloadAction<Award>) {
      state.awards.push(action.payload)
    },
    resetAwards(state) {
      state.awards = [];
      state.specificAward = [];
    }
  },
  extraReducers: builder => {
    builder
      .addCase(fetchAwards.pending, state => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchAwards.fulfilled, (state, action) => {
        state.awards = action.payload
        state.loading = false
      })
      .addCase(fetchAwards.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Something went wrong'
      })
      .addCase(fetchSpecificAwards.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSpecificAwards.fulfilled, (state, action) => {
        state.specificAward = action.payload; // Update specific awards
        state.loading = false;
      })
      .addCase(fetchSpecificAwards.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch specific awards';
      });
  }
})

export const { addAward, resetAwards } = awardsSlice.actions

export default awardsSlice.reducer
