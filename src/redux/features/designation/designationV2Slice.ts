import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

import type { RootState } from '../../store';

// ================= TYPES =================
export interface Designation {
    _id: string;
    title: string;
    description?: string;
    department_id: string;
    department_name?: string;           // Added for list view
    level: number;
    role_group?: string;
    salary_min?: number;
    salary_max?: number;
    company_id: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface LevelGroup {
    level: string;
    designations: Designation[];
}

export interface DepartmentLevelWiseData {
    department_id: string;
    department_name: string | null;
    department_icon?: string | null;
    department_color?: string | null;
    levels: LevelGroup[];
}

// Payload for Create Designation
export interface CreateDesignationPayload {
    title: string;
    description?: string;
    department_id: string;
    level: number;
    role_group?: string;
    salary_min?: number;
    salary_max?: number;
    company_id: string;
}

interface DesignationV2State {
    designations: Designation[];           // For main list table
    total: number;
    levelWiseData: DepartmentLevelWiseData | null;

    listLoading: boolean;
    levelWiseLoading: boolean;
    createLoading: boolean;
    updateLoading: boolean;
    deleteLoading: boolean;

    error: string | null;
}

// ================= INITIAL STATE =================
const initialState: DesignationV2State = {
    designations: [],
    total: 0,
    levelWiseData: null,

    listLoading: false,
    levelWiseLoading: false,
    createLoading: false,
    updateLoading: false,
    deleteLoading: false,

    error: null,
};

// ================= HELPERS =================
const getAuthData = () => {
    if (typeof window === 'undefined') {
        return { token: null, company_id: null };
    }

    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');


    return { token, company_id: user?.company_id };
};

// ================= THUNKS =================

// ✅ NEW: Fetch List (Main Table) - list-of-designations-department-levelwise
// ✅ Updated Fetch List Thunk
export const fetchDesignationList = createAsyncThunk<
    { data: Designation[]; total: number },
    {
        company_id: string;
        department_id?: string;
        level?: number;
        search?: string;
        page?: number;
        limit?: number;
    },
    { rejectValue: string }
>(
    'designationV2/fetchList',
    async (params, { rejectWithValue }) => {
        try {
            const { token } = getAuthData();
            const url = new URL(`${process.env.NEXT_PUBLIC_APP_URL}/v2/designation-service/list-of-designations-department-levelwise`);

            url.searchParams.append('company_id', params.company_id);
            if (params.department_id) url.searchParams.append('department_id', params.department_id);
            if (params.level !== undefined) url.searchParams.append('level', params.level.toString());
            if (params.search?.trim()) url.searchParams.append('search', params.search.trim());
            if (params.page) url.searchParams.append('page', params.page.toString());
            if (params.limit) url.searchParams.append('limit', params.limit.toString());

            const res = await fetch(url.toString(), {
                headers: { Authorization: `Bearer ${token}` },
            });

            const responseData = await res.json();

            if (!res.ok) {
                throw new Error(responseData?.message || 'Failed to fetch designations list');
            }

            return {
                data: responseData.data || [],
                total: responseData.pagination?.total || 0,   // ← This was the main fix
            };
        } catch (err: any) {
            console.error('Fetch List Error:', err);

            return rejectWithValue(err.message || 'Failed to load designations');
        }
    }
);

// Update Designation
// Update Designation Thunk
export const updateDesignation = createAsyncThunk<
    Designation,
    {
        id: string;
        title?: string;
        role_group?: string;
        level?: number;
        salary_min?: number;
        salary_max?: number;
    },
    { rejectValue: string }
>(
    'designationV2/update',
    async (payload, { rejectWithValue }) => {
        try {
            const { token, company_id } = getAuthData();

            if (!token || !company_id) {
                throw new Error('Authentication data missing');
            }

            const { id, ...updateData } = payload;   // Separate id from update data

            const res = await fetch(
                `${process.env.NEXT_PUBLIC_APP_URL}/v2/designation-service/update-designation`,
                {
                    method: 'PATCH',
                    headers: {
                        Authorization: `Bearer ${token} ${company_id}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        id: id,                    // Send id in body as per your controller
                        ...updateData
                    }),
                }
            );

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data?.message || 'Failed to update designation');
            }

            return data;
        } catch (err: any) {
            return rejectWithValue(err.message || 'Something went wrong');
        }
    }
);

// Fetch Level Wise (Used in View Modal)
export const fetchDesignationsByDepartmentLevelWise = createAsyncThunk<
    DepartmentLevelWiseData,
    { department_id: string; company_id?: string },
    { rejectValue: string }
>(
    'designationV2/fetchByDepartmentLevelWise',
    async ({ department_id, company_id }, { rejectWithValue }) => {
        try {
            const { token } = getAuthData();
            const url = new URL(`${process.env.NEXT_PUBLIC_APP_URL}/v2/designation-service/get-by-department-levelwise`);

            url.searchParams.append('department_id', department_id);
            if (company_id) url.searchParams.append('company_id', company_id);

            const res = await fetch(url.toString(), {
                headers: { Authorization: `Bearer ${token}` },
            });

            const data = await res.json();

            if (!res.ok) throw new Error(data?.message || 'Failed to fetch level wise data');

            return data;
        } catch (err: any) {
            return rejectWithValue(err.message);
        }
    }
);

// Create Designation
export const createDesignation = createAsyncThunk<
    Designation,
    CreateDesignationPayload,
    { rejectValue: string }
>('designationV2/create', async (payload, { rejectWithValue }) => {
    try {
        const { token, company_id } = getAuthData();

        if (!token || !company_id) {
            throw new Error('Authentication data missing');
        }

        const res = await fetch(
            `${process.env.NEXT_PUBLIC_APP_URL}/v2/designation-service/create-designation`,
            {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token} ${company_id}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            }
        );

        const data = await res.json();

        if (!res.ok) {
            throw new Error(data?.message || 'Failed to create designation');
        }

        return data;
    } catch (err: any) {
        return rejectWithValue(err.message || 'Something went wrong');
    }
});

// ================= SLICE =================
const designationV2Slice = createSlice({
    name: 'designationV2',
    initialState,
    reducers: {
        resetDesignationV2State: (state) => {
            state.designations = [];
            state.levelWiseData = null;
            state.error = null;
        },
        clearLevelWiseData: (state) => {
            state.levelWiseData = null;
        },
    },
    extraReducers: (builder) => {
        builder

            // List Fetch (Main Table)
            .addCase(fetchDesignationList.pending, (state) => {
                state.listLoading = true;
                state.error = null;
            })
            .addCase(fetchDesignationList.fulfilled, (state, action) => {
                state.listLoading = false;
                state.designations = action.payload.data || [];
                state.total = action.payload.total || 0;        // ← Important
            })
            .addCase(fetchDesignationList.rejected, (state, action) => {
                state.listLoading = false;
                state.error = action.payload || 'Failed to fetch list';
            })

            // Level Wise
            .addCase(fetchDesignationsByDepartmentLevelWise.pending, (state) => {
                state.levelWiseLoading = true;
                state.error = null;
            })
            .addCase(fetchDesignationsByDepartmentLevelWise.fulfilled, (state, action) => {
                state.levelWiseLoading = false;
                state.levelWiseData = action.payload;
            })
            .addCase(fetchDesignationsByDepartmentLevelWise.rejected, (state, action) => {
                state.levelWiseLoading = false;
                state.error = action.payload || 'Failed to fetch level wise data';
            })

            // Create
            .addCase(createDesignation.pending, (state) => {
                state.createLoading = true;
            })
            .addCase(createDesignation.fulfilled, (state, action) => {
                state.createLoading = false;
                state.designations.unshift(action.payload);
            })
            .addCase(createDesignation.rejected, (state, action) => {
                state.createLoading = false;
                state.error = action.payload || 'Failed to create designation';
            })
            .addCase(updateDesignation.pending, (state) => {
                state.updateLoading = true;
            })
            .addCase(updateDesignation.fulfilled, (state, action) => {
                state.updateLoading = false;

                // Update the item in list if it exists
                const index = state.designations.findIndex(d => d._id === action.payload._id);

                if (index !== -1) {
                    state.designations[index] = action.payload;
                }
            })
            .addCase(updateDesignation.rejected, (state, action) => {
                state.updateLoading = false;
                state.error = action.payload || 'Failed to update designation';
            });

    },
});

export const { resetDesignationV2State, clearLevelWiseData } = designationV2Slice.actions;

export const selectLevelWiseData = (state: RootState) => state.designationV2.levelWiseData;
export const selectLevelWiseLoading = (state: RootState) => state.designationV2.levelWiseLoading;

export default designationV2Slice.reducer;
