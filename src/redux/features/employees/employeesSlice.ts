import type { PayloadAction } from '@reduxjs/toolkit'
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'

import type { RootState } from '../../store'

interface Employee {
  _doc: any
  _id: string
  first_name: string
  last_name: string
  email: string
  contact: string
  role_priority: string
  dob: string
  gender: string
  designation: string
  password: string
  joining_date: string
  leaving_date: string
  status: string
  company_id: string
  image?: string
}

interface EmployeesState {
  employees: Employee[]
  filteredEmployees: Employee[]
  upcomingBirthdays: Employee[]
  workAnniversaries: Employee[]
  hasMore: boolean
  loading: boolean
  loadingBirthdays: boolean
  loadingAnniversaries: boolean
  error: string | null
  errorBirthdays: string | null
  errorAnniversaries: string | null
}

const initialState: EmployeesState = {
  employees: [],
  filteredEmployees: [],
  upcomingBirthdays: [],
  workAnniversaries: [],
  hasMore: true,
  loading: false,
  loadingBirthdays: false,
  loadingAnniversaries: false,
  error: null,
  errorBirthdays: null,
  errorAnniversaries: null
}

export const fetchWorkAnniversaries = createAsyncThunk(
  'employees/fetchWorkAnniversaries',
  async (days: number = 30) => {
    let token: string | null = null
    const { company_id } = typeof window !== 'undefined' && JSON.parse(localStorage?.getItem('user') || '{}')

    if (typeof window !== 'undefined') {
      token = localStorage?.getItem('token')
    }

    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/employees/work-anniversaries?days=${days}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token} ${company_id}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error('Failed to fetch work anniversaries')
    }

    return response.json()
  }
)

export const fetchUpcomingBirthdays = createAsyncThunk(
  'employees/fetchUpcomingBirthdays',
  async (days: number = 30) => {
    let token: string | null = null
    const { company_id } = typeof window !== 'undefined' && JSON.parse(localStorage?.getItem('user') || '{}')

    if (typeof window !== 'undefined') {
      token = localStorage?.getItem('token')
    }

    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/employees/upcoming-birthdays?days=${days}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token} ${company_id}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error('Failed to fetch upcoming birthdays')
    }

    return response.json()
  }
)

export const fetchEmployees = createAsyncThunk(
  'employees/fetchEmployees',
  async (
    {
      page = 1,
      limit = 12,
      search = '',
      designation = ''
    }: { page?: number; limit?: number; search?: string; designation?: string },
    { getState }
  ) => {
    const state = getState() as RootState
    const isSearch = search.trim().length > 0

    let token: string | null = null
    const { company_id } = typeof window !== 'undefined' && JSON.parse(localStorage?.getItem('user') || '{}')

    if (typeof window !== 'undefined') {
      token = localStorage?.getItem('token')
    }

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL}/employees/get?page=${page}&limit=${limit}&search=${search}&designation=${designation}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token} ${company_id === 'owner' ? '' : company_id}`,
          'Content-Type': 'application/json'
        }
      }
    )

    if (!response.ok) {
      throw new Error('Failed to fetch employees')
    }

    const data = await response.json()

    const employees = isSearch ? [] : state.employees.employees

    const newEmployees = data.filter(
      (employee: Employee) => !employees.some(existingEmployee => existingEmployee._id === employee._id)
    )

    return {
      employees: [...employees, ...newEmployees],
      hasMore: data.length === limit
    }
  }
)

const employeesSlice = createSlice({
  name: 'employees',
  initialState,
  reducers: {
    resetEmployees(state) {
      state.employees = []
      state.filteredEmployees = []
      state.upcomingBirthdays = []
      state.workAnniversaries = []
      state.hasMore = true
      state.error = null
      state.errorBirthdays = null
      state.errorAnniversaries = null
    },
    updateEmployee(state, action: PayloadAction<Employee>) {
      const updatedEmployee = action.payload
      const index = state.employees.findIndex(emp => emp._id === updatedEmployee._id)

      if (index !== -1) {
        state.employees[index] = updatedEmployee
      }
    },
    addOrUpdateEmployee(state, action: PayloadAction<Employee>) {
      const updatedEmployee = action.payload
      const index = state.employees.findIndex(emp => emp._id === updatedEmployee._id)

      if (index !== -1) {
        state.employees[index] = updatedEmployee
      } else {
        state.employees.push(updatedEmployee)
      }
    },
    deleteEmployee(state, action: PayloadAction<string>) {
      const employeeId = action.payload
      const index = state.employees.findIndex(emp => emp._id === employeeId)

      if (index !== -1) {
        state.employees.splice(index, 1)
      }
    }
  },
  extraReducers: builder => {
    builder
      .addCase(fetchEmployees.pending, state => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchEmployees.fulfilled, (state, action) => {
        state.loading = false
        state.employees = action.payload.employees
        state.filteredEmployees = action.payload.employees
        state.hasMore = action.payload.hasMore
      })
      .addCase(fetchEmployees.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Something went wrong'
      })

    builder
      .addCase(fetchUpcomingBirthdays.pending, state => {
        state.loadingBirthdays = true
        state.errorBirthdays = null
      })
      .addCase(fetchUpcomingBirthdays.fulfilled, (state, action) => {
        state.loadingBirthdays = false
        state.upcomingBirthdays = action.payload
      })
      .addCase(fetchUpcomingBirthdays.rejected, (state, action) => {
        state.loadingBirthdays = false
        state.errorBirthdays = action.error.message || 'Failed to fetch upcoming birthdays'
      })

    builder
      .addCase(fetchWorkAnniversaries.pending, state => {
        state.loadingAnniversaries = true
        state.errorAnniversaries = null
      })
      .addCase(fetchWorkAnniversaries.fulfilled, (state, action) => {
        state.loadingAnniversaries = false
        state.workAnniversaries = action.payload
      })
      .addCase(fetchWorkAnniversaries.rejected, (state, action) => {
        state.loadingAnniversaries = false
        state.errorAnniversaries = action.error.message || 'Failed to fetch work anniversaries'
      })
  }
})

export const { resetEmployees, updateEmployee, addOrUpdateEmployee, deleteEmployee } = employeesSlice.actions
export default employeesSlice.reducer
