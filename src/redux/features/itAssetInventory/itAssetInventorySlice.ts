import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { RootState } from '../../store';

export interface ItAsset {
  _id: string;
  equipment: string;
  totalQty: number;
  f2fintechQty: number;
  rentlappyQty: number;
  remarks: string;
  createdAt: string;
}

interface ItAssetState {
  assets: ItAsset[];
  total: number;
  loading: boolean;
  error: string | null;
}

const initialState: ItAssetState = {
  assets: [],
  total: 0,
  loading: false,
  error: null,
};

export const fetchItAssets = createAsyncThunk(
  'itAssetInventory/fetchItAssets',
  async ({ search = '' }: { search?: string }, { getState }) => {
    let token: string | null = null;
    const { company_id } = typeof window !== 'undefined' && JSON.parse(localStorage?.getItem('user') || '{}');

    if (typeof window !== 'undefined') {
      token = localStorage?.getItem('token');
    }

    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/it-asset-inventory/get?search=${search}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token} ${company_id}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch IT assets');
    }

    return response.json();
  }
);

const itAssetInventorySlice = createSlice({
  name: 'itAssetInventory',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchItAssets.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchItAssets.fulfilled, (state, action) => {
        state.loading = false;
        state.assets = action.payload.data || [];
        state.total = action.payload.total || 0;
      })
      .addCase(fetchItAssets.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch';
      });
  },
});

export default itAssetInventorySlice.reducer;
