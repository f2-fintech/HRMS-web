import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit'
import type { RootState } from '@/redux/store'
import { utility } from '@/utility'

interface SeatingArrangement {
    _id: string
    seatNo: number
    employee: {
        _id?: string
        first_name: string
        last_name: string
        image: string
        code: string
        location: string
        designation: string
    }
    createdAt: string
    updatedAt: string
}

interface SeatingArrangementState {
    seatingArrangements: SeatingArrangement[]
    loading: boolean
    error: string | null
    total: number
}

const initialState: SeatingArrangementState = {
    seatingArrangements: [],
    loading: false,
    error: null,
    total: 0
}

export const fetchSeatingArrangements = createAsyncThunk<
    { seatingArrangements: SeatingArrangement[]; total: number },
    { page?: number; limit?: number; keyword?: string },
    { state: RootState }
>('seatingArrangement/fetchSeatingArrangements', async ({ page = 1, limit = 10, keyword = '' }) => {
    const { isTokenExpired } = utility();
    const token = localStorage?.getItem('token');
    const user = localStorage?.getItem('user'); // Retrieve the user object from localStorage
    if (!token || isTokenExpired(token)) {
        // Clean up localStorage if needed
        if (token) {
            localStorage.removeItem('token');
        }

        // Redirect to login with page refresh
        window.location.href = '/login';
        return { error: token ? "Token expired" : "No token found" };
    }

    if (!user) {
        throw new Error('User information is missing');
    }

    const parsedUser = JSON.parse(user); // Parse the user JSON
    const company_id = parsedUser?.company_id; // Extract company_id

    if (!company_id) {
        throw new Error('Company ID is missing');
    }

    const response = await fetch(
        `${process.env.NEXT_PUBLIC_APP_URL}/seating-arrangement/get-all?page=${page}&limit=${limit}&keyword=${encodeURIComponent(
            keyword
        )}&company_id=${company_id}`, // Add company_id to the query parameters
        {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        }
    );

    if (!response.ok) {
        throw new Error('Failed to fetch seating arrangements');
    }

    const result = await response.json();

    const seatingArrangements = result.data.map((item: any) => ({
        ...item,
        employee: item.employeeData,
        company_id: item.company_id, // Include company_id in the mapped results
    }));

    return { seatingArrangements, total: result.total };
});


export const fetchSeatingByEmployeeId = createAsyncThunk<
    { seatingArrangements: SeatingArrangement[]; total: number },
    { employeeId: string; page?: number; limit?: number },
    { state: RootState }
>('seatingArrangement/fetchSeatingByEmployeeId', async ({ employeeId, page = 1, limit = 10 }) => {
    const { isTokenExpired } = utility();
    const token = localStorage.getItem('token') || ''

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
        `${process.env.NEXT_PUBLIC_APP_URL}/seating-arrangement/by-employee/${employeeId}?page=${page}&limit=${limit}`,
        {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        }
    )

    if (!response.ok) {
        throw new Error('Failed to fetch seating arrangements by employee ID')
    }

    const result = await response.json()

    const seatingArrangements = result.data.map((item: any) => ({
        ...item,
        employee: item.employeeData
    }))

    return { seatingArrangements, total: result.total }
})

const seatingArrangementSlice = createSlice({
    name: 'seatingArrangement',
    initialState,
    reducers: {
        resetFilter(state) {
            state.seatingArrangements = initialState.seatingArrangements
        }
    },
    extraReducers: builder => {
        builder
            .addCase(fetchSeatingArrangements.pending, state => {
                state.loading = true
                state.error = null
            })
            .addCase(fetchSeatingArrangements.fulfilled, (state, action) => {
                state.seatingArrangements = action.payload.seatingArrangements
                state.total = action.payload.total
                state.loading = false
            })
            .addCase(fetchSeatingArrangements.rejected, (state, action) => {
                state.loading = false
                state.error = action.error.message || 'Something went wrong'
            })

            .addCase(fetchSeatingByEmployeeId.pending, state => {
                state.loading = true
                state.error = null
            })
            .addCase(
                fetchSeatingByEmployeeId.fulfilled,
                (state, action: PayloadAction<{ seatingArrangements: SeatingArrangement[]; total: number }>) => {
                    state.seatingArrangements = action.payload.seatingArrangements
                    state.total = action.payload.total
                    state.loading = false
                }
            )

            .addCase(fetchSeatingByEmployeeId.rejected, (state, action) => {
                state.loading = false
                state.error = action.error.message || 'Failed to fetch seating arrangements by employee ID'
            })
    }
})

export const { resetFilter } = seatingArrangementSlice.actions
export default seatingArrangementSlice.reducer
