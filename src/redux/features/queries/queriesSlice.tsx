import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../../store';

interface Query {
    _id: string;
    toQuery: string;
    employee: string;
    queryType: string;
    status: string;
    assignedDate: string;
    updateDate: string;
    department: string;
    description: string;
    createdAt: string;
    updatedAt: string;
}

interface QueryState {
    queries: Query[];
    hasMore: boolean;
    loading: boolean;
    error: string | null;
    createLoading: boolean;
    createError: string | null;
    page: number;
    total: number;
    month?: number;
    year?: number;
}

const initialState: QueryState = {
    queries: [],
    hasMore: true,
    loading: false,
    error: null,
    createLoading: false,
    createError: null,
    page: 1,
    total: 0,

};

// Thunk to fetch all queries (Admin)
export const fetchAllQueries = createAsyncThunk(
    'queries/fetchAllQueries',
    async ({ page = 1, limit = 10, keyword = '', month, year }: { page?: number; limit?: number; keyword?: string; month?: string; year?: string }) => {
        const token = localStorage.getItem('token') || '';
        const { company_id } = typeof window !== "undefined" ? JSON.parse(localStorage?.getItem("user")) : {};

        const queryParams = new URLSearchParams({
            page: page,
            limit: limit,
            keyword,
            ...(month !== undefined ? { month: month } : {}),
            ...(year !== undefined ? { year: year } : {}),
        });

        const response = await fetch(
            `${process.env.NEXT_PUBLIC_APP_URL}/queries/get-all?${queryParams}`,
            {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token} ${company_id}`,
                    'Content-Type': 'application/json',
                },
            }
        );

        if (!response.ok) {
            throw new Error('Failed to fetch queries');
        }

        const result = await response.json();
        return { queries: result.data, total: result.total };
    }
);


// Thunk to fetch queries based on the logged-in user's role
export const fetchUserQueries = createAsyncThunk(
    'queries/fetchUserQueries',
    async (
        { page = 1, limit = 10, keyword = '', month = '', year }: { page?: number; limit?: number; keyword?: string; month?: string, year?: string },
        { getState }
    ) => {
        const state = getState() as RootState;
        const token = localStorage.getItem('token') || '';
        const { company_id } = typeof window !== "undefined" ? JSON.parse(localStorage?.getItem("user")) : {};

        // Construct query parameters dynamically
        const queryParams = new URLSearchParams({
            page: page.toString(),
            limit: limit.toString(),
            keyword,
            ...(year ? { year: year.toString() } : {}),
        });

        const response = await fetch(
            `${process.env.NEXT_PUBLIC_APP_URL}/queries/user-queries?${queryParams}`,
            {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token} ${company_id}`,
                    'Content-Type': 'application/json',
                },
            }
        );

        if (!response.ok) {
            throw new Error('Failed to fetch queries');
        }

        const result = await response.json();
        return { queries: result.data, total: result.total };
    }
);


// Fetch queries by toQueryId
export const fetchQueriesByToQueryId = createAsyncThunk(
    'queries/fetchQueriesByToQueryId',
    async (
        { toQueryId, page = 1, limit = 10, keyword = '', year }: { toQueryId: string; page?: number; limit?: number; keyword?: string; month?: string; year?: string }
    ) => {
        const token = localStorage.getItem('token') || '';
        const { company_id } = typeof window !== "undefined" ? JSON.parse(localStorage?.getItem("user")) : {};

        // Construct query parameters dynamically
        const queryParams = new URLSearchParams({
            page: page.toString(),
            limit: limit.toString(),
            keyword,
            ...(year ? { year: year.toString() } : {}),
        });

        const response = await fetch(
            `${process.env.NEXT_PUBLIC_APP_URL}/queries/to-query/${toQueryId}?${queryParams}`,
            {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token} ${company_id}`,
                    'Content-Type': 'application/json',
                },
            }
        );

        if (!response.ok) {
            throw new Error('Failed to fetch queries');
        }

        const result = await response.json();
        return { queries: result.data, total: result.total };
    }
);


export const createQuery = createAsyncThunk(
    'queries/createQuery',
    async (newQueryData: { team: string; employee: string; queryType: string; description: string }) => {
        const token = localStorage.getItem('token') || '';
        const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/queries/create`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(newQueryData),
        });

        if (!response.ok) {
            throw new Error('Failed to create query');
        }

        return await response.json();
    }
);

// Thunk to update a query
export const updateQueryById = createAsyncThunk(
    'queries/updateQuery',
    async ({ id, data }: { id: string; data: Partial<Query> }) => {
        const token = localStorage.getItem('token') || '';
        const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/queries/update/${id}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            throw new Error('Failed to update query');
        }

        return await response.json();
    }
);

const querySlice = createSlice({
    name: 'queries',
    initialState,
    reducers: {
        setPage(state, action: PayloadAction<number>) {
            state.page = action.payload;
        },
        resetQueries(state) {
            state.queries = [];
            state.hasMore = true;
            state.error = null;
            state.createError = null;
            state.page = 1;
            state.month = undefined;
            state.year = undefined;
        },
        updateQuery(state, action: PayloadAction<Query>) {
            const updatedQuery = action.payload;
            const index = state.queries.findIndex(query => query._id === updatedQuery._id);

            if (index !== -1) {
                state.queries[index] = updatedQuery;
            }
        },
        deleteQuery(state, action: PayloadAction<string>) {
            const queryId = action.payload;
            state.queries = state.queries.filter(query => query._id !== queryId);
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchAllQueries.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchAllQueries.fulfilled, (state, action) => {
                state.queries = action.payload.queries;
                state.total = action.payload.total; // Set total number of records
                state.loading = false;
            })
            .addCase(fetchAllQueries.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Failed to fetch queries';
            });

        builder
            .addCase(fetchUserQueries.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchUserQueries.fulfilled, (state, action) => {
                state.queries = action.payload.queries;
                state.total = action.payload.total; // Set total number of records
                state.loading = false;
            })
            .addCase(fetchUserQueries.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Failed to fetch queries';
            });

        builder
            .addCase(createQuery.pending, (state) => {
                state.createLoading = true;
                state.createError = null;
            })
            .addCase(createQuery.fulfilled, (state, action) => {
                state.createLoading = false;
                state.queries.push(action.payload);
            })
            .addCase(createQuery.rejected, (state, action) => {
                state.createLoading = false;
                state.createError = action.error.message || 'Failed to create query';
            });

        builder
            .addCase(fetchQueriesByToQueryId.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchQueriesByToQueryId.fulfilled, (state, action) => {
                state.loading = false;
                state.queries = action.payload.queries;
                state.total = action.payload.total; // Set total number of records
                state.loading = false;
            })
            .addCase(fetchQueriesByToQueryId.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Failed to fetch queries';
            });

        builder
            .addCase(updateQueryById.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(updateQueryById.fulfilled, (state, action) => {
                state.loading = false;
                const updatedQuery = action.payload;
                const index = state.queries.findIndex(query => query._id === updatedQuery._id);
                if (index !== -1) {
                    state.queries[index] = updatedQuery;
                }
            })
            .addCase(updateQueryById.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Failed to update query';
            });
    },
});

// Exporting actions and the reducer
export const { setPage, resetQueries, updateQuery, deleteQuery } = querySlice.actions;
export default querySlice.reducer;
