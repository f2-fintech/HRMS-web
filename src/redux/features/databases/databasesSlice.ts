import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

// Types
export type ColumnType = 
  | 'text' 
  | 'number' 
  | 'select' 
  | 'multi_select' 
  | 'date' 
  | 'checkbox' 
  | 'url' 
  | 'email' 
  | 'phone'
  | 'person'
  | 'files'
  | 'created_time'
  | 'last_edited_time';

export interface SelectOption {
  id: string;
  name: string;
  color: string;
}

export interface DatabaseColumn {
  id: string;
  name: string;
  type: ColumnType;
  width: number;
  options?: SelectOption[];
  isTitle: boolean;
  order: number;
}

export interface CellValue {
  text?: string;
  number?: number;
  selectedIds?: string[];
  date?: string;
  checked?: boolean;
  url?: string;
  email?: string;
  phone?: string;
  personIds?: string[];
  fileUrls?: string[];
}

export interface DatabaseRow {
  id: string;
  cells: Record<string, CellValue>;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface FilterCondition {
  columnId: string;
  operator: string;
  value: any;
}

export interface SortCondition {
  columnId: string;
  direction: 'asc' | 'desc';
}

export interface DatabaseView {
  id: string;
  name: string;
  type: 'table' | 'kanban' | 'list' | 'gallery' | 'calendar';
  filters: FilterCondition[];
  sorts: SortCondition[];
  visibleColumns: string[];
  groupByColumnId?: string;
  isDefault: boolean;
  order: number;
}

export interface Database {
  _id: string;
  company_id: string;
  title: string;
  icon?: string;
  description?: string;
  columns: DatabaseColumn[];
  rows: DatabaseRow[];
  views: DatabaseView[];
  created_by: string | any;
  parent_page_id?: string | null;
  source_block_id?: string;
  shared_with: string[];
  createdAt: string;
  updatedAt: string;
}

interface DatabasesState {
  databases: Database[];
  currentDatabase: Database | null;
  loading: boolean;
  saving: boolean;
  error: string | null;
}

const initialState: DatabasesState = {
  databases: [],
  currentDatabase: null,
  loading: false,
  saving: false,
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

// Fetch all databases
export const fetchDatabases = createAsyncThunk(
  'databases/fetchDatabases',
  async () => {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL}/databases`,
      {
        method: 'GET',
        headers: getAuthHeaders(),
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch databases');
    }

    return response.json();
  }
);

// Fetch databases for a specific page
export const fetchDatabasesByPage = createAsyncThunk(
  'databases/fetchDatabasesByPage',
  async (pageId: string) => {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL}/databases/page/${pageId}`,
      {
        method: 'GET',
        headers: getAuthHeaders(),
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch databases for page');
    }

    return response.json();
  }
);

// Fetch single database by ID
export const fetchDatabaseById = createAsyncThunk(
  'databases/fetchDatabaseById',
  async (id: string) => {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL}/databases/${id}`,
      {
        method: 'GET',
        headers: getAuthHeaders(),
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch database');
    }

    return response.json();
  }
);

// Create database
export const createDatabase = createAsyncThunk(
  'databases/createDatabase',
  async (data: {
    title: string;
    icon?: string;
    description?: string;
    columns?: Partial<DatabaseColumn>[];
    rows?: Partial<DatabaseRow>[];
    parent_page_id?: string;
  }) => {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL}/databases`,
      {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      }
    );

    if (!response.ok) {
      throw new Error('Failed to create database');
    }

    return response.json();
  }
);

// Convert table to database
export const convertTableToDatabase = createAsyncThunk(
  'databases/convertTableToDatabase',
  async (data: {
    page_id: string;
    block_id: string;
    tableContent: any;
    title?: string;
  }) => {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL}/databases/convert-table`,
      {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to convert table to database');
    }

    return response.json();
  }
);

// Update database
export const updateDatabase = createAsyncThunk(
  'databases/updateDatabase',
  async ({ id, data }: { id: string; data: Partial<Database> }) => {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL}/databases/${id}`,
      {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      }
    );

    if (!response.ok) {
      throw new Error('Failed to update database');
    }

    return response.json();
  }
);

// Delete database
export const deleteDatabase = createAsyncThunk(
  'databases/deleteDatabase',
  async (id: string) => {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL}/databases/${id}`,
      {
        method: 'DELETE',
        headers: getAuthHeaders(),
      }
    );

    if (!response.ok) {
      throw new Error('Failed to delete database');
    }

    return { id };
  }
);

// ============ COLUMN OPERATIONS ============

export const addColumn = createAsyncThunk(
  'databases/addColumn',
  async ({ databaseId, column }: { databaseId: string; column: { name: string; type: ColumnType } }) => {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL}/databases/${databaseId}/columns`,
      {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(column),
      }
    );

    if (!response.ok) {
      throw new Error('Failed to add column');
    }

    return response.json();
  }
);

export const updateColumn = createAsyncThunk(
  'databases/updateColumn',
  async ({ databaseId, columnId, data }: { databaseId: string; columnId: string; data: Partial<DatabaseColumn> }) => {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL}/databases/${databaseId}/columns/${columnId}`,
      {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      }
    );

    if (!response.ok) {
      throw new Error('Failed to update column');
    }

    return response.json();
  }
);

export const deleteColumn = createAsyncThunk(
  'databases/deleteColumn',
  async ({ databaseId, columnId }: { databaseId: string; columnId: string }) => {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL}/databases/${databaseId}/columns/${columnId}`,
      {
        method: 'DELETE',
        headers: getAuthHeaders(),
      }
    );

    if (!response.ok) {
      throw new Error('Failed to delete column');
    }

    return response.json();
  }
);

// ============ ROW OPERATIONS ============

export const addRow = createAsyncThunk(
  'databases/addRow',
  async ({ databaseId, cells }: { databaseId: string; cells?: Record<string, CellValue> }) => {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL}/databases/${databaseId}/rows`,
      {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ cells }),
      }
    );

    if (!response.ok) {
      throw new Error('Failed to add row');
    }

    return response.json();
  }
);

export const updateRow = createAsyncThunk(
  'databases/updateRow',
  async ({ databaseId, rowId, cells }: { databaseId: string; rowId: string; cells: Record<string, CellValue> }) => {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL}/databases/${databaseId}/rows/${rowId}`,
      {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ cells }),
      }
    );

    if (!response.ok) {
      throw new Error('Failed to update row');
    }

    return response.json();
  }
);

export const updateCells = createAsyncThunk(
  'databases/updateCells',
  async ({ databaseId, rowId, cells }: { databaseId: string; rowId: string; cells: Record<string, CellValue> }) => {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL}/databases/${databaseId}/cells`,
      {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ rowId, cells }),
      }
    );

    if (!response.ok) {
      throw new Error('Failed to update cells');
    }

    return response.json();
  }
);

export const deleteRow = createAsyncThunk(
  'databases/deleteRow',
  async ({ databaseId, rowId }: { databaseId: string; rowId: string }) => {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL}/databases/${databaseId}/rows/${rowId}`,
      {
        method: 'DELETE',
        headers: getAuthHeaders(),
      }
    );

    if (!response.ok) {
      throw new Error('Failed to delete row');
    }

    return response.json();
  }
);

// ============ VIEW OPERATIONS ============

export const addView = createAsyncThunk(
  'databases/addView',
  async ({ databaseId, view }: { databaseId: string; view: { name: string; type: DatabaseView['type'] } }) => {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL}/databases/${databaseId}/views`,
      {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(view),
      }
    );

    if (!response.ok) {
      throw new Error('Failed to add view');
    }

    return response.json();
  }
);

export const updateView = createAsyncThunk(
  'databases/updateView',
  async ({ databaseId, viewId, data }: { databaseId: string; viewId: string; data: Partial<DatabaseView> }) => {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL}/databases/${databaseId}/views/${viewId}`,
      {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      }
    );

    if (!response.ok) {
      throw new Error('Failed to update view');
    }

    return response.json();
  }
);

export const deleteView = createAsyncThunk(
  'databases/deleteView',
  async ({ databaseId, viewId }: { databaseId: string; viewId: string }) => {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL}/databases/${databaseId}/views/${viewId}`,
      {
        method: 'DELETE',
        headers: getAuthHeaders(),
      }
    );

    if (!response.ok) {
      throw new Error('Failed to delete view');
    }

    return response.json();
  }
);

const databasesSlice = createSlice({
  name: 'databases',
  initialState,
  reducers: {
    resetDatabases: (state) => {
      state.databases = [];
      state.currentDatabase = null;
      state.loading = false;
      state.saving = false;
      state.error = null;
    },
    setCurrentDatabase: (state, action: PayloadAction<Database | null>) => {
      state.currentDatabase = action.payload;
    },
    // Optimistic update for cell changes
    updateCellLocally: (state, action: PayloadAction<{ rowId: string; columnId: string; value: CellValue }>) => {
      if (state.currentDatabase) {
        const row = state.currentDatabase.rows.find(r => r.id === action.payload.rowId);
        if (row) {
          row.cells[action.payload.columnId] = action.payload.value;
        }
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch databases
      .addCase(fetchDatabases.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDatabases.fulfilled, (state, action) => {
        state.loading = false;
        state.databases = action.payload;
      })
      .addCase(fetchDatabases.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch databases';
      })
      // Fetch databases by page
      .addCase(fetchDatabasesByPage.fulfilled, (state, action) => {
        // Merge or replace databases for the page
        const pageDbIds = action.payload.map((db: Database) => db._id);
        state.databases = [
          ...state.databases.filter(db => !pageDbIds.includes(db._id)),
          ...action.payload
        ];
      })
      // Fetch single database
      .addCase(fetchDatabaseById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDatabaseById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentDatabase = action.payload;
      })
      .addCase(fetchDatabaseById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch database';
      })
      // Create database
      .addCase(createDatabase.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(createDatabase.fulfilled, (state, action) => {
        state.saving = false;
        state.databases.unshift(action.payload);
        state.currentDatabase = action.payload;
      })
      .addCase(createDatabase.rejected, (state, action) => {
        state.saving = false;
        state.error = action.error.message || 'Failed to create database';
      })
      // Convert table to database
      .addCase(convertTableToDatabase.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(convertTableToDatabase.fulfilled, (state, action) => {
        state.saving = false;
        state.databases.unshift(action.payload);
        state.currentDatabase = action.payload;
      })
      .addCase(convertTableToDatabase.rejected, (state, action) => {
        state.saving = false;
        state.error = action.error.message || 'Failed to convert table';
      })
      // Update database
      .addCase(updateDatabase.pending, (state) => {
        state.saving = true;
      })
      .addCase(updateDatabase.fulfilled, (state, action) => {
        state.saving = false;
        const index = state.databases.findIndex(db => db._id === action.payload._id);
        if (index !== -1) {
          state.databases[index] = action.payload;
        }
        if (state.currentDatabase?._id === action.payload._id) {
          state.currentDatabase = action.payload;
        }
      })
      .addCase(updateDatabase.rejected, (state, action) => {
        state.saving = false;
        state.error = action.error.message || 'Failed to update database';
      })
      // Delete database
      .addCase(deleteDatabase.fulfilled, (state, action) => {
        state.databases = state.databases.filter(db => db._id !== action.payload.id);
        if (state.currentDatabase?._id === action.payload.id) {
          state.currentDatabase = null;
        }
      })
      // Column, Row, View operations all return updated database
      .addCase(addColumn.fulfilled, (state, action) => {
        state.currentDatabase = action.payload;
        const index = state.databases.findIndex(db => db._id === action.payload._id);
        if (index !== -1) state.databases[index] = action.payload;
      })
      .addCase(updateColumn.fulfilled, (state, action) => {
        state.currentDatabase = action.payload;
        const index = state.databases.findIndex(db => db._id === action.payload._id);
        if (index !== -1) state.databases[index] = action.payload;
      })
      .addCase(deleteColumn.fulfilled, (state, action) => {
        state.currentDatabase = action.payload;
        const index = state.databases.findIndex(db => db._id === action.payload._id);
        if (index !== -1) state.databases[index] = action.payload;
      })
      .addCase(addRow.fulfilled, (state, action) => {
        state.currentDatabase = action.payload;
        const index = state.databases.findIndex(db => db._id === action.payload._id);
        if (index !== -1) state.databases[index] = action.payload;
      })
      .addCase(updateRow.fulfilled, (state, action) => {
        state.currentDatabase = action.payload;
        const index = state.databases.findIndex(db => db._id === action.payload._id);
        if (index !== -1) state.databases[index] = action.payload;
      })
      .addCase(updateCells.fulfilled, (state, action) => {
        state.currentDatabase = action.payload;
        const index = state.databases.findIndex(db => db._id === action.payload._id);
        if (index !== -1) state.databases[index] = action.payload;
      })
      .addCase(deleteRow.fulfilled, (state, action) => {
        state.currentDatabase = action.payload;
        const index = state.databases.findIndex(db => db._id === action.payload._id);
        if (index !== -1) state.databases[index] = action.payload;
      })
      .addCase(addView.fulfilled, (state, action) => {
        state.currentDatabase = action.payload;
        const index = state.databases.findIndex(db => db._id === action.payload._id);
        if (index !== -1) state.databases[index] = action.payload;
      })
      .addCase(updateView.fulfilled, (state, action) => {
        state.currentDatabase = action.payload;
        const index = state.databases.findIndex(db => db._id === action.payload._id);
        if (index !== -1) state.databases[index] = action.payload;
      })
      .addCase(deleteView.fulfilled, (state, action) => {
        state.currentDatabase = action.payload;
        const index = state.databases.findIndex(db => db._id === action.payload._id);
        if (index !== -1) state.databases[index] = action.payload;
      });
  },
});

export const { resetDatabases, setCurrentDatabase, updateCellLocally } = databasesSlice.actions;

export default databasesSlice.reducer;
