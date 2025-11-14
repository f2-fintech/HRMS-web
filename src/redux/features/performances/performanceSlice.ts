import type { PayloadAction } from '@reduxjs/toolkit';
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import type { RootState } from '@/redux/store';

/** ===== Common Types ===== */
export type PerfStatus = 'planned' | 'in_progress' | 'done';
export interface PerfEmployee { _id: string; first_name?: string; last_name?: string; image?: string; }

/** ===== Admin Task Types ===== */
export interface PerformanceItem {
  _id: string;
  date: string;
  taskTitle: string;
  description?: string;
  target?: number;
  completed?: number;
  remaining?: number;
  status?: PerfStatus;
  goodPart?: string;
  blockers?: string;
  employee_id?: string;
  employee?: PerfEmployee;
  company_id?: string;
}

export interface PerformancePayload {
  employee: string;
  date: string;
  taskTitle: string;
  description?: string;
  target?: number;
  completed?: number;
  goodPart?: string;
  blockers?: string;
  status?: PerfStatus;
  company_id?: string;
}

/** ===== RE / Manager Types ===== */
export interface ReRecord { _id: string; date: string; company_id: string; employee_id: string;
  phoneConnects?: number; physicalMeet?: number; expectedLogins?: number; expectedApprovals?: number; expectedDisbursal?: number;
  phoneConnectsDone?: number; physicalMeetDone?: number; loginsDone?: number; approvalsDone?: number; disbursalDone?: number;
  followUps?: Array<{ name?: string; phone?: string; remarks?: string; followUpOn?: string }>;
}

export interface ManagerRecord { _id: string; date: string; company_id: string; manager_id: string;
  morning?: any; evening?: any;
}

/** ===== Slice State ===== */
interface PerformanceState {
  items: PerformanceItem[];
  total: number;
  loading: boolean;
  error: string | null;

  reItems: ReRecord[];
  reLoading: boolean;

  managerItems: ManagerRecord[];
  managerLoading: boolean;
}

const initialState: PerformanceState = {
  items: [], total: 0, loading: false, error: null,
  reItems: [], reLoading: false,
  managerItems: [], managerLoading: false,
};

/** ===== Utils ===== */
const getAuth = () => {
  if (typeof window === 'undefined') return { token: null as string | null, company_id: '', userId: '', role: '' };
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  return {
    token,
    company_id: user?.company_id ?? user?.companyId ?? user?.company?._id ?? '',
    userId: user?.id || user?._id || '',
    role: String(user?.role ?? ''),
  };
};
const API = process.env.NEXT_PUBLIC_APP_URL;

/** =========================
 *        ADMIN TASKS
 * ========================= */
export const fetchAdminTaskList = createAsyncThunk<PerformanceItem[], { company_id?: string }>(
  'performance/fetchAdminList',
  async ({ company_id }, { rejectWithValue }) => {
    try {
      const finalCompany = company_id || getAuth().company_id;
      const resp = await fetch(`${API}/performance/performance-list?company_id=${finalCompany}`);
      if (!resp.ok) throw new Error('Failed to fetch performance list');
      const data = await resp.json();
      // map populated employee
      return (data || []).map((d: any) => ({
        _id: d._id,
        date: d.date,
        taskTitle: d?.adminTask?.taskTitle,
        description: d?.adminTask?.description,
        target: d?.adminTask?.target,
        completed: d?.adminTask?.completed,
        remaining: d?.adminTask?.remaining,
        status: d?.adminTask?.status,
        goodPart: d?.adminTask?.goodPart,
        blockers: d?.adminTask?.blockers,
        employee_id: d?.adminTask?.employee_id?._id || d?.adminTask?.employee_id,
        employee: d?.adminTask?.employee_id && d?.adminTask?.employee_id._id
          ? {
              _id: d?.adminTask?.employee_id?._id,
              first_name: d?.adminTask?.employee_id?.first_name,
              last_name: d?.adminTask?.employee_id?.last_name,
              image: d?.adminTask?.employee_id?.image,
            }
          : undefined,
        company_id: d.company_id,
      }));
    } catch (e: any) {
      return rejectWithValue(e?.message || 'Fetch error');
    }
  }
);

export const createAdminTask = createAsyncThunk<PerformanceItem, PerformancePayload>(
  'performance/create-admin',
  async (payload, { rejectWithValue }) => {
    try {
      const { token, company_id } = getAuth();
      const body = { ...payload, company_id: payload.company_id || company_id, employee: payload.employee };
      const resp = await fetch(`${API}/performance/create-task`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify(body),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data?.message || 'Create failed');
      return {
        _id: data._id, date: data.date,
        taskTitle: data?.adminTask?.taskTitle, description: data?.adminTask?.description,
        target: data?.adminTask?.target, completed: data?.adminTask?.completed,
        remaining: data?.adminTask?.remaining, status: data?.adminTask?.status,
        goodPart: data?.adminTask?.goodPart, blockers: data?.adminTask?.blockers,
        employee_id: data?.adminTask?.employee_id, company_id: data.company_id,
      } as PerformanceItem;
    } catch (e: any) {
      return rejectWithValue(e?.message || 'Create error');
    }
  }
);

export const updateAdminTask = createAsyncThunk<PerformanceItem, { id: string; body: PerformancePayload }>(
  'performance/update-admin',
  async ({ id, body }, { rejectWithValue }) => {
    try {
      const { token } = getAuth();
      const resp = await fetch(`${API}/performance/update-task/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify(body),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data?.message || 'Update failed');

      return {
        _id: data._id, date: data.date,
        taskTitle: data?.adminTask?.taskTitle, description: data?.adminTask?.description,
        target: data?.adminTask?.target, completed: data?.adminTask?.completed,
        remaining: data?.adminTask?.remaining, status: data?.adminTask?.status,
        goodPart: data?.adminTask?.goodPart, blockers: data?.adminTask?.blockers,
        employee_id: data?.adminTask?.employee_id, company_id: data.company_id,
      } as PerformanceItem;
    } catch (e: any) {
      return rejectWithValue(e?.message || 'Update error');
    }
  }
);

/** =========================
 *   RE + MANAGER COMBINED GET
 * ========================= */
export const fetchMine = createAsyncThunk<any[], { role?: 'employee' | 'manager' }>(
  'performance/fetchMine',
  async ({ role }, { rejectWithValue }) => {
    try {
      const { token } = getAuth();
      const url = new URL(`${API}/performance/mine`);
      if (role) url.searchParams.set('role', role);
      const resp = await fetch(url.toString(), { headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
      if (!resp.ok) throw new Error('Failed to fetch');
      const data = await resp.json();
      return Array.isArray(data) ? data : [];
    } catch (e: any) {
      return rejectWithValue(e?.message || 'Fetch error');
    }
  }
);

/** =========================
 *          SLICE
 * ========================= */
const performanceSlice = createSlice({
  name: 'performances',
  initialState,
  reducers: {
    clearPerformance(state) {
      state.items = []; state.total = 0; state.error = null;
      state.reItems = []; state.managerItems = [];
    },
  },
  extraReducers: (builder) => {
    builder
      // Admin list
      .addCase(fetchAdminTaskList.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchAdminTaskList.fulfilled, (state, action: PayloadAction<PerformanceItem[]>) => {
        state.items = action.payload; state.total = action.payload.length; state.loading = false;
      })
      .addCase(fetchAdminTaskList.rejected, (state, action) => {
        state.loading = false; state.error = (action.payload as string) || action.error.message || 'Error';
      })
      // Admin create/update
      .addCase(createAdminTask.fulfilled, (state, action: PayloadAction<PerformanceItem>) => {
        state.items = [action.payload, ...state.items]; state.total += 1;
      })
      .addCase(updateAdminTask.fulfilled, (state, action: PayloadAction<PerformanceItem>) => {
        const idx = state.items.findIndex((x) => x._id === action.payload._id);
        if (idx >= 0) state.items[idx] = action.payload;
      })

      // Mine (role-based)
      .addCase(fetchMine.pending, (state) => { state.reLoading = true; state.managerLoading = true; })
      .addCase(fetchMine.fulfilled, (state, action: PayloadAction<any[]>) => {
        // heuristic: split by role field in docs
        const arr = action.payload || [];
        state.reItems = arr.filter((d: any) => d.role === 'employee').map((d: any) => ({
          _id: d._id, date: d.date, company_id: d.company_id, employee_id: d.owner_id,
          ...(d.re?.morning || {}), ...(d.re?.evening || {}),
        }));
        state.managerItems = arr.filter((d: any) => d.role === 'manager').map((d: any) => ({
          _id: d._id, date: d.date, company_id: d.company_id, manager_id: d.owner_id,
          morning: d.manager?.morning || {}, evening: d.manager?.evening || {},
        }));
        state.reLoading = false; state.managerLoading = false;
      })
      .addCase(fetchMine.rejected, (state) => { state.reLoading = false; state.managerLoading = false; });
  },
});

export const { clearPerformance } = performanceSlice.actions;
export const selectPerformance = (state: RootState) => state.performances;
export default performanceSlice.reducer;
