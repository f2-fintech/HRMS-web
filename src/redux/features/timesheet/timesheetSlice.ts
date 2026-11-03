import type { PayloadAction } from '@reduxjs/toolkit'
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'

interface TimeSheet {
  _id: string
  employee: {
    _id: string
    first_name: string
    last_name: string
    image: string
  }
  attendance: {
    _id: string
    date: string
    status: string
  }
  employee_id: string
  time: string
  startShift: string
  endShift: string
  date: string
  note: string
  submission_date: string
  status: string
}

interface timesheetState {
  timesheets: TimeSheet[]
  filteredTimesheet: TimeSheet[]
  loading: boolean
  error: string | null
}

let token: string | null = null

if (typeof window !== 'undefined') {
  token = localStorage?.getItem('token')
}

const initialState: timesheetState = {
  timesheets: [],
  filteredTimesheet: [],
  loading: false,
  error: null
}

export const fetchTimeSheet = createAsyncThunk('timesheets/fetchTimeSheet', async () => {
  const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/timesheets/get`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  })

  if (!response.ok) {
    throw new Error('Failed to fetch time sheets')
  }

  return (await response.json()) as TimeSheet[]
})

export const timesheetSlice = createSlice({
  name: 'timesheets',
  initialState,
  reducers: {
    resetTimesheets(state) {
      state.timesheets = []
      state.filteredTimesheet = []
    },
    filterTimesheet(state, action: PayloadAction<{ name: string; status: string; month: number }>) {
      const { name, status, month } = action.payload

      state.filteredTimesheet = state.timesheets.filter(timesheet => {
        const timesheetMonth = new Date(timesheet.attendance?.date).getMonth() + 1

        return (
          (name
            ? timesheet.employee?.first_name.toLowerCase().includes(name.toLowerCase()) ||
            timesheet.employee?.last_name.toLowerCase().includes(name.toLowerCase())
            : true) &&
          (status ? timesheet.status === status : true) &&
          (month ? timesheetMonth === month : true)
        )
      })
    },
    resetFilter(state) {
      state.filteredTimesheet = state.timesheets
    }
  },
  extraReducers: builder => {
    builder
      .addCase(fetchTimeSheet.pending, state => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchTimeSheet.fulfilled, (state, action) => {
        state.timesheets = action.payload
        state.loading = false
      })
      .addCase(fetchTimeSheet.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Something went wrong'
      })
  }
})

export const { filterTimesheet, resetFilter, resetTimesheets } = timesheetSlice.actions
export default timesheetSlice.reducer
