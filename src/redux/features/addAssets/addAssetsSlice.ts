import type { PayloadAction } from "@reduxjs/toolkit";
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

interface addAsset {
  _id: string
  assetName: string;
  category: string;
  description: string;
  model: string;
  serialNo: string;
  uniqueCode: string;
  type: string;
  location: string;
  attachment: string;
  company_id: string;
}

interface addAssetsState {
  addassets: addAsset[];
  filteredaddassets: addAsset[];
  loading: boolean;
  error: string | null;
  total: number;
}

const initialState: addAssetsState = {
  addassets: [],
  filteredaddassets: [],
  loading: false,
  error: null,
  total: 0,
};

export const fetchAddAssets = createAsyncThunk<
  { addassets: addAsset[]; total: number },
  { page?: number; limit?: number; keyword?: string }
>(
  "add-assets/fetchAddAssets",
  async ({ page = 1, limit = 10, keyword = "" }) => {
    let token: string | null = null;
    const { company_id } = typeof window !== "undefined" ? JSON.parse(localStorage?.getItem("user")) : {};

    if (typeof window !== "undefined") {
      token = localStorage?.getItem("token");
    }
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL}/add-assets/get?page=${page}&limit=${limit}&keyword=${encodeURIComponent(
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
      throw new Error("Failed to fetch assets");
    }

    return (await response.json()) as { addassets: addAsset[]; total: number };
  }
);

const addAssetsSlice = createSlice({
  name: "addAssets",
  initialState,
  reducers: {
    filterAssest(state, action: PayloadAction<{ assetName: string }>) {
      const { assetName } = action.payload;
      state.filteredaddassets = state.addassets.filter((des) =>
        assetName
          ? des.assetName.toLowerCase().includes(assetName.toLowerCase())
          : true
      );
    },
    resetFilter(state) {
      state.filteredaddassets = state.addassets;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAddAssets.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAddAssets.fulfilled, (state, action) => {
        state.loading = false;
        state.addassets = action.payload.addassets;
        state.total = action.payload.total;
      })
      .addCase(fetchAddAssets.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Something went wrong";
      });
  },
});

export const { filterAssest, resetFilter } = addAssetsSlice.actions; // Corrected this line
export default addAssetsSlice.reducer;
