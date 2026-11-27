import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "@/redux/store";

// Define the configuration data structure
interface Configuration {
    _id: string;
    name: string;
    description: string;
    image: string;
    email: string;
    contactNo: string;
    branch: string[];
    address: string[];
    company_id: string;
    createdAt: string;
    updatedAt: string;
}

interface ConfigurationState {
    data: Configuration | null;
    loading: boolean;
    error: string | null;
}

// Initial state for the slice
const initialState: ConfigurationState = {
    data: null,
    loading: false,
    error: null,
};

// Async thunk for fetching configuration
export const fetchConfiguration = createAsyncThunk<
    Configuration,
    void,
    { state: RootState }
>("configuration/fetchConfiguration", async (_, { rejectWithValue, getState }) => {
    // Check if data already exists in the state
    const state = getState();
    if (state.configuration.data) {
        return state.configuration.data;
    }

    let token: string | null = null;
    const user = typeof window !== "undefined" ? JSON.parse(localStorage?.getItem("user") || "{}") : {};
    const company_id = user?.company_id;

    if (typeof window !== "undefined") {
        token = localStorage?.getItem("token");
    }

    try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/configuration`, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${token} ${company_id}`,
                "Content-Type": "application/json",
            },
        });

        if (!response.ok) {
            throw new Error("Failed to fetch configuration");
        }

        const data = await response.json();

        if (Array.isArray(data) && data.length > 0) {
            return data[0]; // Return the first object if API returns an array
        } else {
            throw new Error("Configuration data is empty or invalid");
        }
    } catch (error: any) {
        console.error("Error fetching configuration:", error);
        return rejectWithValue(error.message || "Error fetching configuration");
    }
});

// Configuration slice
const configurationSlice = createSlice({
    name: "configuration",
    initialState,
    reducers: {
        resetConfiguration(state) {
            state.data = null;
            state.error = null;
            state.loading = false;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchConfiguration.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchConfiguration.fulfilled, (state, action: PayloadAction<Configuration>) => {
                state.data = action.payload;
                state.loading = false;
            })
            .addCase(fetchConfiguration.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            });
    },
});

export const { resetConfiguration } = configurationSlice.actions;

export default configurationSlice.reducer;
