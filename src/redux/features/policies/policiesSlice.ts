import type { PayloadAction } from "@reduxjs/toolkit";
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

interface Policy {
  _id: string;
  name: string;
  description: string;
  document_url: string;
  company_id: string;
}

interface PoliciesState {
  policies: Policy[];
  filteredPolicies: Policy[];
  loading: boolean;
  error: string | null;
  total: number;
}

const initialState: PoliciesState = {
  policies: [],
  filteredPolicies: [],
  loading: false,
  error: null,
  total: 0,
};

export const fetchPolicies = createAsyncThunk<
  { policies: Policy[]; total: number },
  { page?: number; limit?: number; keyword?: string }
>(
  "policies/fetchPolicies",
  async ({ page = 1, limit = 10, keyword = "" }) => {

    let token: string | null = null;
    const { company_id } = typeof window !== "undefined" ? JSON.parse(localStorage?.getItem("user")) : {};

    if (typeof window !== "undefined") {
      token = localStorage?.getItem("token");
    }

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL}/policies/get?page=${page}&limit=${limit}&keyword=${encodeURIComponent(
        keyword
      )}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token} ${company_id}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch policies");
    }

    const data = await response.json();

    return data as { policies: Policy[]; total: number };
  }
);

export const policiesSlice = createSlice({
  name: "policies",
  initialState,
  reducers: {
    filterPolicy(state, action: PayloadAction<{ name: string }>) {
      const { name } = action.payload;

      state.filteredPolicies = state.policies.filter((policy) =>
        name ? policy.name.toLowerCase().includes(name.toLowerCase()) : true
      );
    },
    resetFilter(state) {
      state.filteredPolicies = state.policies;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPolicies.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPolicies.fulfilled, (state, action) => {
        state.policies = action.payload.policies;
        state.filteredPolicies = action.payload.policies;
        state.total = action.payload.total;
        state.loading = false;
      })
      .addCase(fetchPolicies.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Something went wrong";
      });
  },
});

export const { filterPolicy, resetFilter } = policiesSlice.actions;
export default policiesSlice.reducer;
