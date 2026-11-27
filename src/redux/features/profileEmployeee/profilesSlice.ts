// src/redux/profilesSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

export const fetchProfiles = createAsyncThunk(
    'profiles/fetchProfiles',
    async ({ companyId, searchQuery, limit, page }) => {
        const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/profile/byCompany/${companyId}?search=${searchQuery}&limit=${limit}&page=${page}`);
        const data = await response.json();
        return data;
    }
);

const profilesSlice = createSlice({
    name: 'profiles',
    initialState: {
        profiles: [],
        status: 'idle',
        error: null,
        page: 1,
        limit: 10,
        searchQuery: '',
    },
    reducers: {
        setSearchQuery(state, action) {
            state.searchQuery = action.payload;
            state.page = 1;  // Reset to first page on new search
        },
        setPage(state, action) {
            state.page = action.payload;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchProfiles.pending, (state) => {
                state.status = 'loading';
            })
            .addCase(fetchProfiles.fulfilled, (state, action) => {
                state.status = 'succeeded';
                if (state.page === 1) {
                    state.profiles = action.payload; // Reset to new data if it's the first page
                } else {
                    state.profiles = [...state.profiles, ...action.payload]; // Append new page data
                }
            })
            .addCase(fetchProfiles.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.error.message;
            });
    },
});

export const { setSearchQuery, setPage } = profilesSlice.actions;

export default profilesSlice.reducer;
