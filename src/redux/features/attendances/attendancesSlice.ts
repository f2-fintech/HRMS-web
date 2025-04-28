import type { PayloadAction } from '@reduxjs/toolkit'
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import type { RootState } from '../../store'
import { utility } from '@/utility'

interface Attendance {
  _id: string
  employee: {
    _id: string
    first_name: string
    last_name: string
    image: string
    location: string
  }
  employee_id: string
  date: Date
  status: string
  timeComplete: string
}

interface attendancesState {
  attendances: Attendance[]
  filteredAttendance: Attendance[]
  count: number // Add count here
  loading: boolean
  error: string | null
}

const initialState: attendancesState = {
  attendances: [],
  filteredAttendance: [],
  count: 0, // Initialize with 0
  loading: false,
  error: null
}

export const fetchAttendances = createAsyncThunk(
  'attendances/fetchAttendances',
  async (
    {
      month,
      year,
      page,
      limit,
      keyword,
      location
    }: { month: number; year: number; page: number; limit: number; keyword: string; location: string },
    { getState }
  ) => {
    const { isTokenExpired } = utility();
    const state = getState() as RootState
    let token: string | null = null
    const { company_id } = typeof window !== 'undefined' ? JSON.parse(localStorage?.getItem('user')) : {}

    if (typeof window !== 'undefined') {
      token = localStorage.getItem('token')
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

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL}/attendence/get?month=${month}&year=${year}&page=${page}&limit=${limit}&keyword=${keyword}&location=${location}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token} ${company_id}`,
          'Content-Type': 'application/json'
        }
      }
    )

    if (!response.ok) {
      throw new Error('Failed to fetch attendances')
    }

    const data = await response.json()

    // Avoid adding duplicate entries
    // const existingAttendances = state.attendances.attendances;
    // const newAttendances = data.attendances.filter((newAttendance: Attendance) =>
    //   !existingAttendances.some(attendance => attendance._id === newAttendance._id)
    // );

    return {
      attendances: data.attendances,
      count: data.totalCount
    }
  }
)

export const fetchEmployeeAttendances = createAsyncThunk(
  'attendances/fetchEmployeeAttendances',
  async ({ employeeId, year, month }: { employeeId: string; year: string; month: string }) => {
    let token: string | null = null

    if (typeof window !== 'undefined') {
      token = localStorage.getItem('token')
    }

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL}/attendence/employee/${employeeId}/${year}/${month}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    )

    if (!response.ok) {
      throw new Error('Failed to fetch employee attendances')
    }

    return (await response.json()) as Attendance[]
  }
)

export const attendancesSlice = createSlice({
  name: 'attendances',
  initialState,
  reducers: {
    resetAttendances(state) {
      state.attendances = []
      state.filteredAttendance = []
      state.count = 0
    },
    filterAttendance(state, action: PayloadAction<{ name: string; location: string }>) {
      const { name, location } = action.payload

      state.filteredAttendance = state.attendances.filter(attendance => {
        // Safeguard against null or undefined employee objects
        const employee = attendance.employee

        // If employee is null or undefined, skip this attendance record
        if (!employee) return false

        const nameMatch = name
          ? employee.first_name?.toLowerCase().includes(name.toLowerCase()) ||
          employee.last_name?.toLowerCase().includes(name.toLowerCase())
          : true

        const locationMatch =
          location && location.toLowerCase() !== 'all'
            ? employee.location?.toLowerCase().includes(location.toLowerCase())
            : true

        return nameMatch && locationMatch
      })
    },

    resetFilter(state) {
      state.filteredAttendance = state.attendances
    },

    addOrUpdateAttendance(state, action: PayloadAction<Attendance>) {
      const updatedAttendance = action.payload

      const index = state.attendances.findIndex(atten => atten._id === updatedAttendance.data._id)

      if (index !== -1) {
        state.attendances[index] = updatedAttendance.data
      } else {
        state.attendances.push(updatedAttendance.data)
      }
    }
  },
  extraReducers: builder => {
    builder
      .addCase(fetchAttendances.pending, state => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchAttendances.fulfilled, (state, action) => {
        state.attendances = action.payload.attendances
        state.count = action.payload.count // Set the count
        state.loading = false
      })
      .addCase(fetchAttendances.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Something went wrong'
      })
      .addCase(fetchEmployeeAttendances.pending, state => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchEmployeeAttendances.fulfilled, (state, action) => {
        state.filteredAttendance = action.payload
        state.loading = false
      })
      .addCase(fetchEmployeeAttendances.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Something went wrong'
      })
  }
})

export const { filterAttendance, resetFilter, resetAttendances, addOrUpdateAttendance } = attendancesSlice.actions

export default attendancesSlice.reducer
