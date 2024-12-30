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
  loading: boolean
  error: string | null
}

const initialState: AwardsState = {
  awards: [],
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

const awardsSlice = createSlice({
  name: 'awards',
  initialState,
  reducers: {
    addAward(state, action: PayloadAction<Award>) {
      state.awards.push(action.payload)
    },
    resetAwards(state) {
      state.awards = []
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
  }
})

export const { addAward, resetAwards } = awardsSlice.actions

export default awardsSlice.reducer
