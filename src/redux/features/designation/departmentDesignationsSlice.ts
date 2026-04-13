import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'

import type { RootState } from '../../store'

// ================= TYPES =================

export interface Department {
    _id: string
    department: string
    icon?: string
    color?: string
    company_id: string
    designation_Count?: number
    createdAt?: string
    updatedAt?: string
}

interface DepartmentState {
    departments: Department[]

    loading: boolean
    createLoading: boolean
    updateLoading: boolean
    deleteLoading: boolean

    error: string | null
}

// ================= INITIAL STATE =================

const initialState: DepartmentState = {
    departments: [],

    loading: false,
    createLoading: false,
    updateLoading: false,
    deleteLoading: false,

    error: null
}

// ================= HELPERS =================

const getAuthData = () => {
    if (typeof window === 'undefined') {
        return { token: null, company_id: null }
    }

    const token = localStorage.getItem('token')
    const user = JSON.parse(localStorage.getItem('user') || '{}')

    return {
        token,
        company_id: user?.company_id
    }
}

// ================= THUNKS =================

// ✅ CREATE DEPARTMENT
export const createDepartment = createAsyncThunk<
    Department,
    { department: string; icon?: string; color?: string },
    { rejectValue: string }
>('department/create', async (payload, { rejectWithValue }) => {
    try {
        const { token, company_id } = getAuthData()

        const res = await fetch(
            `${process.env.NEXT_PUBLIC_APP_URL}/v1/department-group/create`,
            {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token} ${company_id}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    ...payload,
                    company_id
                })
            }
        )

        const data = await res.json()

        if (!res.ok) {
            throw new Error(data?.message || 'Failed to create department')
        }

        return data
    } catch (err: any) {
        return rejectWithValue(err.message)
    }
})

// ✅ FETCH ALL DEPARTMENTS
export const fetchDepartments = createAsyncThunk<
    Department[],
    void,
    { rejectValue: string }
>('department/fetchAll', async (_, { rejectWithValue }) => {
    try {
        const { token, company_id } = getAuthData()

        const res = await fetch(
            `${process.env.NEXT_PUBLIC_APP_URL}/v1/department-group/get-all?company_id=${company_id}`,
            {
                headers: {
                    Authorization: `Bearer ${token} ${company_id}`
                }
            }
        )

        const data = await res.json()

        if (!res.ok) {
            throw new Error(data?.message || 'Failed to fetch departments')
        }

        return data
    } catch (err: any) {
        return rejectWithValue(err.message)
    }
})

// ✅ UPDATE DEPARTMENT
export const updateDepartment = createAsyncThunk<
    Department,
    {
        _id: string
        department?: string
        icon?: string
        color?: string
    },
    { rejectValue: string }
>('department/update', async (payload, { rejectWithValue }) => {
    try {
        const { token, company_id } = getAuthData()

        const res = await fetch(
            `${process.env.NEXT_PUBLIC_APP_URL}/v1/department-group/update`,
            {
                method: 'PATCH',
                headers: {
                    Authorization: `Bearer ${token} ${company_id}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    ...payload,
                    company_id
                })
            }
        )

        const data = await res.json()

        if (!res.ok) {
            throw new Error(data?.message || 'Failed to update department')
        }

        return data
    } catch (err: any) {
        return rejectWithValue(err.message)
    }
})

// ✅ DELETE DEPARTMENT
export const deleteDepartment = createAsyncThunk<
    string,
    string,
    { rejectValue: string }
>('department/delete', async (id, { rejectWithValue }) => {
    try {
        const { token, company_id } = getAuthData()

        const res = await fetch(
            `${process.env.NEXT_PUBLIC_APP_URL}/v1/department-group/delete/${id}?company_id=${company_id}`,
            {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${token} ${company_id}`
                }
            }
        )

        const data = await res.json()

        if (!res.ok) {
            throw new Error(data?.message || 'Failed to delete department')
        }

        return id
    } catch (err: any) {
        return rejectWithValue(err.message)
    }
})

// ================= SLICE =================

const departmentSlice = createSlice({
    name: 'department',
    initialState,
    reducers: {
        resetDepartmentState: state => {
            state.departments = []
            state.error = null
        }
    },
    extraReducers: builder => {
        builder

            // ===== FETCH =====
            .addCase(fetchDepartments.pending, state => {
                state.loading = true
                state.error = null
            })
            .addCase(fetchDepartments.fulfilled, (state, action) => {
                state.loading = false
                state.departments = action.payload
            })
            .addCase(fetchDepartments.rejected, (state, action) => {
                state.loading = false
                state.error = action.payload || 'Failed to fetch departments'
            })

            // ===== CREATE =====
            .addCase(createDepartment.pending, state => {
                state.createLoading = true
            })
            .addCase(createDepartment.fulfilled, (state, action) => {
                state.createLoading = false
                state.departments.unshift(action.payload)
            })
            .addCase(createDepartment.rejected, (state, action) => {
                state.createLoading = false
                state.error = action.payload || 'Failed to create department'
            })

            // ===== UPDATE =====
            .addCase(updateDepartment.pending, state => {
                state.updateLoading = true
            })
            .addCase(updateDepartment.fulfilled, (state, action) => {
                state.updateLoading = false

                const index = state.departments.findIndex(
                    d => d._id === action.payload._id
                )

                if (index !== -1) {
                    state.departments[index] = action.payload
                }
            })
            .addCase(updateDepartment.rejected, (state, action) => {
                state.updateLoading = false
                state.error = action.payload || 'Failed to update department'
            })

            // ===== DELETE =====
            .addCase(deleteDepartment.pending, state => {
                state.deleteLoading = true
            })
            .addCase(deleteDepartment.fulfilled, (state, action) => {
                state.deleteLoading = false

                state.departments = state.departments.filter(
                    d => d._id !== action.payload
                )
            })
            .addCase(deleteDepartment.rejected, (state, action) => {
                state.deleteLoading = false
                state.error = action.payload || 'Failed to delete department'
            })
    }
})

// ================= EXPORTS =================

export const { resetDepartmentState } = departmentSlice.actions

export const selectDepartments = (state: RootState) =>
    state.department.departments

export const selectDepartmentLoading = (state: RootState) =>
    state.department.loading

export default departmentSlice.reducer
