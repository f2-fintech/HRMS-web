import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

interface Block {
  id: string;
  type: string;
  content: any;
  level?: number;
  checked?: boolean;
  collapsed?: boolean;
  children?: Block[];
  order: number;
}

interface Page {
  _id: string;
  company_id: string;
  title: string;
  icon?: string;
  cover_image?: string;
  blocks: Block[];
  shared_with: string[];
  created_by: string | any;
  createdAt: string;
  updatedAt: string;
}

interface PagesState {
  pages: Page[];
  currentPage: Page | null;
  total: number;
  loading: boolean;
  error: string | null;
}

const initialState: PagesState = {
  pages: [],
  currentPage: null,
  total: 0,
  loading: false,
  error: null,
};

// Helper to get auth headers
const getAuthHeaders = (): HeadersInit => {
  if (typeof window === 'undefined') {
    return {
      'Content-Type': 'application/json',
    };
  }
  
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const company_id = user.company_id || '';
  const user_id = user.id || '';
  const role = user.role || '';

  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token} ${company_id} ${user_id} ${role}`,
  };
};

// Fetch all pages (filtered by role)
export const fetchPages = createAsyncThunk(
  'pages/fetchPages',
  async ({
    page = 1,
    limit = 10,
    search = '',
  }: {
    page?: number;
    limit?: number;
    search?: string;
  }) => {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL}/pages/get?page=${page}&limit=${limit}&search=${search}`,
      {
        method: 'GET',
        headers: getAuthHeaders(),
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch pages');
    }

    return response.json();
  }
);

// Fetch single page by ID
export const fetchPageById = createAsyncThunk(
  'pages/fetchPageById',
  async (id: string) => {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL}/pages/${id}`,
      {
        method: 'GET',
        headers: getAuthHeaders(),
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch page');
    }

    return response.json();
  }
);

// Create new page
export const createPage = createAsyncThunk(
  'pages/createPage',
  async (pageData: {
    title: string;
    icon?: string;
    cover_image?: string;
    blocks?: Block[];
    shared_with?: string[];
  }) => {
    const user = typeof window !== 'undefined' 
      ? JSON.parse(localStorage.getItem('user') || '{}') 
      : {};
    
    const payload = {
      ...pageData,
      company_id: user.company_id,
      created_by: user.id,
    };
    
    console.log('Creating page with payload:', payload);
    
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL}/pages/create`,
      {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Create page failed:', errorText);
      throw new Error('Failed to create page');
    }

    const result = await response.json();
    console.log('Page created successfully:', result);
    return result;
  }
);

// Update page
export const updatePage = createAsyncThunk(
  'pages/updatePage',
  async ({
    id,
    data,
  }: {
    id: string;
    data: Partial<{
      title: string;
      icon: string;
      cover_image: string;
      blocks: Block[];
    }>;
  }) => {
    console.log('Updating page:', id, 'with data:', data);
    
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL}/pages/${id}`,
      {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Update page failed:', errorText);
      throw new Error('Failed to update page');
    }

    const result = await response.json();
    console.log('Page updated successfully:', result);
    return result;
  }
);

// Delete page
export const deletePage = createAsyncThunk(
  'pages/deletePage',
  async (id: string) => {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL}/pages/${id}`,
      {
        method: 'DELETE',
        headers: getAuthHeaders(),
      }
    );

    if (!response.ok) {
      throw new Error('Failed to delete page');
    }

    return { id };
  }
);

// Share page with employees
export const sharePage = createAsyncThunk(
  'pages/sharePage',
  async ({
    id,
    employee_ids,
  }: {
    id: string;
    employee_ids: string[];
  }) => {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL}/pages/${id}/share`,
      {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ employee_ids }),
      }
    );

    if (!response.ok) {
      throw new Error('Failed to share page');
    }

    return response.json();
  }
);

// Upload cover image
export const uploadCover = createAsyncThunk(
  'pages/uploadCover',
  async ({ id, file }: { id: string; file: File }) => {
    const formData = new FormData();
    formData.append('cover', file);

    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const company_id = user.company_id || '';
    const user_id = user.id || '';
    const role = user.role || '';

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL}/pages/${id}/cover`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token} ${company_id} ${user_id} ${role}`,
        },
        body: formData,
      }
    );

    if (!response.ok) {
      throw new Error('Failed to upload cover');
    }

    return response.json();
  }
);

const pagesSlice = createSlice({
  name: 'pages',
  initialState,
  reducers: {
    resetPages: (state) => {
      state.pages = [];
      state.currentPage = null;
      state.total = 0;
      state.loading = false;
      state.error = null;
    },
    setCurrentPage: (state, action: PayloadAction<Page | null>) => {
      state.currentPage = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch pages
      .addCase(fetchPages.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPages.fulfilled, (state, action) => {
        state.loading = false;
        state.pages = action.payload.pages;
        state.total = action.payload.total;
      })
      .addCase(fetchPages.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch pages';
      })
      // Fetch single page
      .addCase(fetchPageById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPageById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentPage = action.payload;
      })
      .addCase(fetchPageById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch page';
      })
      // Create page
      .addCase(createPage.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createPage.fulfilled, (state, action) => {
        state.loading = false;
        state.pages.unshift(action.payload);
        state.total += 1;
      })
      .addCase(createPage.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to create page';
      })
      // Update page
      .addCase(updatePage.pending, (state) => {
        // Don't set loading to true to prevent component remounting
        state.error = null;
      })
      .addCase(updatePage.fulfilled, (state, action) => {
        const index = state.pages.findIndex((p) => p._id === action.payload._id);
        if (index !== -1) {
          state.pages[index] = action.payload;
        }
        // Don't update currentPage to prevent re-initialization of editor
        // The local state in PageEditor will handle the updates
      })
      .addCase(updatePage.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to update page';
      })
      // Delete page
      .addCase(deletePage.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deletePage.fulfilled, (state, action) => {
        state.loading = false;
        state.pages = state.pages.filter((p) => p._id !== action.payload.id);
        state.total -= 1;
        if (state.currentPage?._id === action.payload.id) {
          state.currentPage = null;
        }
      })
      .addCase(deletePage.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to delete page';
      })
      // Share page
      .addCase(sharePage.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(sharePage.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.pages.findIndex((p) => p._id === action.payload._id);
        if (index !== -1) {
          state.pages[index] = action.payload;
        }
        if (state.currentPage?._id === action.payload._id) {
          state.currentPage = action.payload;
        }
      })
      .addCase(sharePage.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to share page';
      })
      // Upload cover
      .addCase(uploadCover.fulfilled, (state, action) => {
        const index = state.pages.findIndex((p) => p._id === action.payload._id);
        if (index !== -1) {
          state.pages[index] = action.payload;
        }
        if (state.currentPage?._id === action.payload._id) {
          state.currentPage = action.payload;
        }
      });
  },
});

export const { resetPages, setCurrentPage } = pagesSlice.actions;

export default pagesSlice.reducer;
