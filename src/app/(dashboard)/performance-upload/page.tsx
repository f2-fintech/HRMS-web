'use client';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import axios from 'axios';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import {
  Box,
  Button,
  Chip,
  Grid,
  IconButton,
  InputAdornment,
  LinearProgress,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
} from '@mui/material';
import Autocomplete from '@mui/material/Autocomplete';
import StarIcon from '@mui/icons-material/Star';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DownloadIcon from '@mui/icons-material/Download';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import DeleteIcon from '@mui/icons-material/Delete';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import SearchIcon from '@mui/icons-material/Search';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import EditIcon from '@mui/icons-material/Edit';
import CloseIcon from '@mui/icons-material/Close';
import GroupsIcon from '@mui/icons-material/Groups';
import VisibilityIcon from '@mui/icons-material/Visibility';


/* ---------------- AXIOS ---------------- */
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_APP_URL,
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token') || '';

    const companyId =
      localStorage.getItem('company_id') ||
      JSON.parse(localStorage.getItem('user') || '{}')?.company_id ||
      '';

    if (!config.headers) config.headers = {};
    if (token)
      config.headers.Authorization = `Bearer token ${token}`.replace(
        'token ',
        'Bearer ',
      );
    if (companyId) config.headers['x-company-id'] = companyId;
  }

  return config;
});



/* ---------------- Types ---------------- */
type Row = {
  _id: string;
  date: string;
  employee_name?: string;
  employee_id?: string;
  manager_tl?: string;
  login?: number;
  approval?: number;
  disbursal?: number;
  abnp?: number;
  code?: string;
  gross_approval?: number;
  gross_disbursal?: number;
  [k: string]: any;
};

type SortKey = 'login' | 'approval' | 'disbursal' | null;
type SortDirection = 'asc' | 'desc';

type SortConfig = {
  key: SortKey;
  direction: SortDirection;
};

type TeamTotalInfo = {
  role: 'manager' | 'team_leader';
  teamName: string;

  teamTotalLogins: number;
  teamTotalApproval: number;
  teamTotalDisbursal: number;
  teamTotalDrop?: number;
  teamTotalCashback?: number;
  teamTotalABNP?: number;       // ✅ NEW (optional)
  teamTotalGrossApproval?: number;
  teamTotalGrossDisbursal?: number;
  memberCount: number;
  memberCodes: string[];
};

type TeamTotalsMap = Record<string, TeamTotalInfo>;

type TeamBreakdown = {
  employee: {
    _id: string;
    name: string;
    code: string;
    designation: string;
    role_priority: string;
  };
  role: 'manager' | 'team_leader' | 'employee';
  team: { _id: string; name: string; code: string } | null;

  totals: {
    totalLogins: number;
    totalApproval: number;
    totalDisbursal: number;
    totalDrop: number;
    totalCashback: number;
    totalGrossApproval?: number;
    totalGrossDisbursal?: number;
    totalABNP?: number; // ✅ NEW
    memberCount: number;
  };

  memberBreakdown: {
    code: string;
    name: string;
    logins: number;
    approval: number;
    disbursal: number;
    drop?: number;      // ✅ NEW
    cashback?: number;
    grossApproval?: number;
    grossDisbursal?: number;
    abnp?: number;      // ✅ NEW
  }[];
};
/* ---------------- Helpers ---------------- */
const rupee = (n: number) =>
  `₹${Intl.NumberFormat('en-IN').format(Number(n || 0))}`;

export default function PerformanceUploadPage() {
  const router = useRouter();
  const q = useSearchParams();

  const [date, setDate] = useState<Dayjs | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [user, setUser] = useState<any>(null);


  // search (with debounce)
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [isFallbackDate, setIsFallbackDate] = useState(false);


  // Manual form dialog state
  const [formOpen, setFormOpen] = useState(false);
  const [formSaving, setFormSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);


  const [form, setForm] = useState({
    employee_name: '',
    manager_tl: '',
    total_logins: '',
    approval_lakh: '',
    disbursal_lakh: '',
    drop_lakh: '',
    Cashback_lakh: '',
    code: '',
  });


  const [amountUnit, setAmountUnit] = useState<'rupees' | 'lakhs'>('rupees');


  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: null,
    direction: 'asc',
  });

  // Team totals state
  const [teamTotals, setTeamTotals] = useState<TeamTotalsMap>({});
  const [teamTotalsLoading, setTeamTotalsLoading] = useState(false);

  // Team breakdown modal state
  const [teamModalOpen, setTeamModalOpen] = useState(false);
  const [teamBreakdown, setTeamBreakdown] = useState<TeamBreakdown | null>(null);
  const [teamBreakdownLoading, setTeamBreakdownLoading] = useState(false);


  // Manager/TL filter state
  const [managerTlFilter, setManagerTlFilter] = useState<string>('all');
  const [managerTlList, setManagerTlList] = useState<{ code: string; name: string; role: string }[]>([]);

  useEffect(() => {
    const t = setTimeout(
      () => setDebounced(search.trim().toLowerCase()),
      300,
    );

    return () => clearTimeout(t);
  }, [search]);

  // Build manager/TL list from teamTotals for filter dropdown
  useEffect(() => {
    const list: { code: string; name: string; role: string }[] = [];
    Object.entries(teamTotals).forEach(([code, info]) => {
      if (info && code) {
        list.push({
          code,
          name: info.teamName || code,
          role: info.role === 'manager' ? 'Manager' : 'Team Leader',
        });
      }
    });
    // Sort by role (Manager first) then name
    list.sort((a, b) => {
      if (a.role !== b.role) return a.role === 'Manager' ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
    setManagerTlList(list);
  }, [teamTotals]);
  useEffect(() => {
    const d = q?.get('date');
    setDate(d ? dayjs(d) : dayjs());
  }, [q]);


  useEffect(() => {
    const user =
      typeof window !== 'undefined'
        ? JSON.parse(localStorage.getItem('user') || '{}')
        : {};

    setIsAdmin(String((user as any)?.role) === '1');
  }, []);

  const dateStr = (date ? date : dayjs()).format('YYYY-MM-DD');
  useEffect(() => {
    const u =
      typeof window !== 'undefined'
        ? JSON.parse(localStorage.getItem('user') || '{}')
        : {};

    setUser(u);
    setIsAdmin(String(u?.role) === '1');
  }, []);
  const isAsstOpsManager = user?.designation === 'Asst. Ops Manager';

  const canUpload = isAdmin || isAsstOpsManager;
  const canAddRow = isAdmin || isAsstOpsManager;



  const fetchList = async () => {
    try {
      setLoading(true);
      setIsFallbackDate(false);

      const company_id =
        localStorage.getItem('company_id') ||
        JSON.parse(localStorage.getItem('user') || '{}')?.company_id ||
        '';

      const todayStr = dayjs().format('YYYY-MM-DD');

      const res = await api.get('/performance-upload/get-performance', {
        params: { company_id, date: dateStr },
      });

      const raw: any[] = Array.isArray(res.data)
        ? res.data
        : res.data?.data || [];

      const normalized: Row[] = raw.map((r) => {
        const login = Number(r.login ?? r.total_logins ?? 0);
        const approval = Number(r.approval ?? r.approval_amount ?? 0);
        const disbursal = Number(r.disbursal ?? r.disbursal_amount ?? 0);
        const drop = Number(r.drop ?? r.drop_amount ?? 0);
        const cashback = Number(r.cashback ?? r.cashback_amount ?? 0);
        const gross_approval = Number(r.gross_approval ?? r.grossApproval ?? 0);
        const gross_disbursal = Number(r.gross_disbursal ?? r.grossDisbursal ?? 0);


        const abnp = Math.max(approval - (disbursal + drop + cashback), 0); // ✅

        return {
          ...r,
          login,
          approval,
          disbursal,
          drop,
          cashback,
          abnp,
          gross_approval,
          gross_disbursal,
          code:
            typeof r.code === 'string'
              ? r.code.trim()
              : (r.code ?? '').toString().trim(),
        };
      });


      setRows(normalized);

      if (!raw.length && dateStr === todayStr) {
        try {
          const datesRes = await api.get('/performance-upload/dates', {
            params: { company_id },
          });

          const data = datesRes.data;

          const latestDate =
            data?.latest?.date ||
            (Array.isArray(data) && data.length ? data[0].date : null);

          if (latestDate && latestDate !== dateStr) {
            setIsFallbackDate(true);        // UI ko pata chale ki fallback hua
            setDate(dayjs(latestDate));     // ye useEffect → fetchList fir se call karega
          }
        } catch (err) {
          console.error('Failed to fetch latest date list', err);
        }
      }
    } catch (e) {
      console.error(e);
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  const latestUploadedDate = useMemo(() => {
    if (!rows.length) return null;

    return rows
      .map(r => r.date)
      .filter(Boolean)
      .sort((a, b) => dayjs(b).valueOf() - dayjs(a).valueOf())[0];
  }, [rows]);
  const effectiveDate = latestUploadedDate || dateStr; // YYYY-MM-DD


  useEffect(() => {
    if (dateStr) fetchList();

  }, [dateStr]);

  // Fetch team totals when rows are loaded
  const fetchTeamTotals = async () => {
    try {
      setTeamTotalsLoading(true);
      const company_id =
        localStorage.getItem('company_id') ||
        JSON.parse(localStorage.getItem('user') || '{}')?.company_id ||
        '';

      const res = await api.get('/performance-upload/team-totals', {
        params: { company_id },
      });

      if (res.data && !res.data.error) {
        setTeamTotals(res.data);
      }
    } catch (e) {
      console.error('Failed to fetch team totals:', e);
    } finally {
      setTeamTotalsLoading(false);
    }
  };

  // Fetch team totals after rows are loaded
  useEffect(() => {
    if (rows.length > 0) {
      fetchTeamTotals();
    }
  }, [rows]);

  // Fetch team breakdown for modal
  const fetchTeamBreakdown = async (code: string) => {
    try {
      setTeamBreakdownLoading(true);
      setTeamModalOpen(true);

      const company_id =
        localStorage.getItem('company_id') ||
        JSON.parse(localStorage.getItem('user') || '{}')?.company_id ||
        '';

      const res = await api.get(`/performance-upload/team-breakdown/${code}`, {
        params: { company_id },
      });

      if (res.data && !res.data.error) {
        setTeamBreakdown(res.data);
      }
    } catch (e) {
      console.error('Failed to fetch team breakdown:', e);
    } finally {
      setTeamBreakdownLoading(false);
    }
  };

  const onUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file) return;

    try {
      setUploading(true);
      const formData = new FormData();

      formData.append('file', file);
      await api.post('/performance-upload/file', formData, {
        headers: { 'Content-Type': 'multipart/formdata' },
      });
      await fetchList();
      alert('Upload successful.');
    } catch (err: any) {
      console.error(err);
      alert(err?.response?.data?.message || 'Upload failed.');
    } finally {
      if (fileRef.current) fileRef.current.value = '';
      setUploading(false);
    }
  };

  const onDelete = async (id: string) => {
    if (!confirm('Delete this row?')) return;

    try {
      await api.delete(`/performance-upload/${id}`);
      await fetchList();
    } catch (e) {
      console.error(e);
      alert('Delete failed.');
    }
  };


  const handleFormChange =
    (field: keyof typeof form) =>
      (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm((prev) => ({ ...prev, [field]: e.target.value }));
      };

  const resetForm = () => {
    setForm({
      employee_name: '',
      manager_tl: '',
      total_logins: '',
      approval_lakh: '',
      disbursal_lakh: '',
      drop_lakh: '',
      cashback_lakh: '',
      code: '',
    });
    setAmountUnit('rupees');
    setEditingId(null);
  };

  const sanitizeMoney = (value: string) =>
    Number(String(value || '0').replace(/,/g, '') || 0);

  const onFormSubmit = async () => {
    if (!form.employee_name.trim() || !form.manager_tl.trim()) {
      alert('Employee Name and Manager/TL are required.');

      return;
    }

    try {
      setFormSaving(true);

      const company_id =
        localStorage.getItem('company_id') ||
        JSON.parse(localStorage.getItem('user') || '{}')?.company_id ||
        '';

      const approvalNumber = sanitizeMoney(form.approval_lakh);
      const disbursalNumber = sanitizeMoney(form.disbursal_lakh);
      const dropNumber = sanitizeMoney(form.drop_lakh);
      const cashbackNumber = sanitizeMoney(form.cashback_lakh);


      const multiplier = amountUnit === 'lakhs' ? 100000 : 1;

      const payload = {
        date: dateStr,
        employee_name: form.employee_name.trim(),
        code: form.code?.trim() || undefined,
        manager_tl: form.manager_tl.trim(),
        total_logins: Number(form.total_logins || 0),
        approval_amount: Math.round(approvalNumber * multiplier),
        disbursal_amount: Math.round(disbursalNumber * multiplier),
        drop_amount: Math.round(dropNumber * multiplier),
        cashback_amount: Math.round(cashbackNumber * multiplier),

        company_id: company_id || undefined,
      };

      if (editingId) {
        await api.patch(`/performance-upload/${editingId}`, payload);
      } else {
        await api.post('/performance-upload/rows', [payload]);
      }

      alert(editingId ? 'Row updated successfully.' : 'Row saved successfully.');
      setFormOpen(false);
      resetForm();
      await fetchList();
    } catch (err: any) {
      console.error(err);
      alert(err?.response?.data?.message || 'Failed to save row.');
    } finally {
      setFormSaving(false);
    }
  };

  /* ------------ Totals ------------ */
  const totals = useMemo(() => {
    const sum = (k: 'login' | 'approval' | 'disbursal' | 'drop' | 'cashback' | 'gross_approval' | 'gross_disbursal' | 'abnp') =>
      rows.reduce((a, r) => a + Number(r[k] || 0), 0);

    return {
      logins: sum('login'),
      approvals: sum('approval'),
      disbursal: sum('disbursal'),
      drop: sum('drop'),
      cashback: sum('cashback'),
      grossApproval: sum('gross_approval'),
      grossDisbursal: sum('gross_disbursal'),
      abnp: sum('abnp')
    };
  }, [rows]);

  const starPerformers = useMemo(() => {
    if (!rows.length) {
      return { approval: null as Row | null, disbursal: null as Row | null };
    }

    let approval: Row | null = null;
    let disbursal: Row | null = null;

    rows.forEach((r) => {
      const approvalVal = Number(r.approval || 0);
      const disbursalVal = Number(r.disbursal || 0);

      if (!approval || approvalVal > Number(approval.approval || 0)) {
        approval = r;
      }

      if (!disbursal || disbursalVal > Number(disbursal.disbursal || 0)) {
        disbursal = r;
      }
    });

    return { approval, disbursal };
  }, [rows]);




  const managerOptions = useMemo(() => {
    const set = new Set<string>();

    rows.forEach((r) => {
      if (r.manager_tl && String(r.manager_tl).trim()) {
        set.add(String(r.manager_tl).trim());
      }
    });

    return Array.from(set);
  }, [rows]);

  const filteredRows = useMemo(() => {
    let result = rows;

    // Apply manager/TL filter first
    if (managerTlFilter && managerTlFilter !== 'all') {
      const teamInfo = teamTotals[managerTlFilter];
      if (teamInfo && teamInfo.memberCodes) {
        const memberCodes = new Set(teamInfo.memberCodes);
        result = result.filter((r) => memberCodes.has(r.code || ''));
      }
    }

    // Then apply search filter
    if (debounced) {
      result = result.filter((r) => {
        const name = (r.employee_name || '').toLowerCase();
        const id = (r.employee_id || '').toLowerCase();
        const code = (r.code || '').toLowerCase();

        return (
          name.includes(debounced) || id.includes(debounced) || code.includes(debounced)
        );
      });
    }

    return result;
  }, [rows, debounced, managerTlFilter, teamTotals]);


  const sortedRows: Row[] = useMemo(() => {
    if (!sortConfig.key) return filteredRows;

    const data = [...filteredRows];
    const { key, direction } = sortConfig;

    data.sort((a, b) => {
      const aVal = Number(a[key!] || 0);
      const bVal = Number(b[key!] || 0);

      if (direction === 'asc') return aVal - bVal;
      return bVal - aVal;
    });

    return data;
  }, [filteredRows, sortConfig]);






  const rowBg = (r: Row) => {
    const hasAny =
      (Number(r.login) || 0) > 0 ||
      (Number(r.approval) || 0) > 0 ||
      (Number(r.disbursal) || 0) > 0;

    return hasAny
      ? 'linear-gradient(90deg, rgba(34,197,94,0.08) 0%, transparent 100%)'
      : 'transparent';
  };
  const showStar = (value: number) => {
    return Number(value || 0) > 0;
  };



  return (
    <Box
      sx={{
        minHeight: '100vh',
        py: 4,
        px: { xs: 2, md: 4 },
        background:
          'linear-gradient(135deg, #f1f5f9 0%, #e0f2fe 40%, #eef2ff 100%)',
      }}
    >
      <Box
        sx={{
          maxWidth: '1120px',
          mx: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 3,
        }}
      >

        <Paper
          elevation={0}
          sx={{
            p: 3,
            borderRadius: 4,
            border: '1px solid #e5e7eb',
            backgroundColor: '#ffffff',
            boxShadow: '0 10px 35px rgba(15,23,42,0.10)',
          }}
        >

          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', lg: 'row' },
              alignItems: { lg: 'center' },
              justifyContent: 'space-between',
              gap: 2,
              mb: 3,
            }}
          >

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <IconButton
                onClick={() => router.back()}
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: 2,
                  bgcolor: '#e0e7ff',
                  '&:hover': {
                    bgcolor: '#c7d2fe',
                    transform: 'scale(1.03)',
                  },
                  transition: 'all 0.18s ease',
                }}
              >
                <ArrowBackIcon sx={{ fontSize: 20, color: '#4338ca' }} />
              </IconButton>

              <Box>
                <Typography
                  variant="h6"
                  sx={{ fontWeight: 800, color: '#0f172a' }}
                >
                  Performance Uploads
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ color: '#64748b', mt: 0.3 }}
                >
                  Daily login, approval & disbursal tracking panel
                </Typography>
              </Box>
            </Box>


            <Box
              sx={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                gap: 1,
              }}
            >
              <Button
                onClick={() => {
                  const header = [
                    'employee_id',
                    'employee_name',
                    'manager_tl',
                    'login',
                    'approval',
                    'disbursal',
                    'code',
                    '_id',
                  ];

                  const body = sortedRows.map((r) => [
                    r.employee_id || '',
                    r.employee_name || '',
                    r.manager_tl || '',
                    Number(r.login || 0),
                    Number(r.approval || 0),
                    Number(r.disbursal || 0),
                    r.code || '',
                    r._id || '',
                  ]);

                  const csv = [header, ...body]
                    .map((r) => r.join(','))
                    .join('\n');

                  const blob = new Blob([csv], {
                    type: 'text/csv;charset=utf-8;',
                  });

                  const a = document.createElement('a');

                  a.href = URL.createObjectURL(blob);
                  a.download = `performance_uploaded_${dateStr}.csv`;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                }}
                size="small"
                startIcon={<DownloadIcon sx={{ fontSize: 18 }} />}
                sx={{
                  borderRadius: 999,
                  textTransform: 'none',
                  fontWeight: 600,
                  px: 2.5,
                  borderColor: '#cbd5f5',
                  bgcolor: '#ffffff',
                  color: '#0f172a',
                  borderWidth: 1,
                  borderStyle: 'solid',
                  '&:hover': {
                    bgcolor: '#f9fafb',
                    borderColor: '#94a3b8',
                  },
                }}
              >
                Export
              </Button>

              {canAddRow && (
                <>
                  <Button
                    size="small"
                    variant="contained"
                    startIcon={<CalendarMonthIcon sx={{ fontSize: 18 }} />}
                    onClick={() => {
                      resetForm();
                      setEditingId(null);
                      setFormOpen(true);
                    }}
                    sx={{
                      borderRadius: 999,
                      textTransform: 'none',
                      fontWeight: 600,
                      px: 2.5,
                      bgcolor: '#4f46e5',
                      boxShadow: '0 8px 20px rgba(79,70,229,0.35)',
                      '&:hover': {
                        bgcolor: '#4338ca',
                      },
                    }}
                  >
                    Add Row
                  </Button>

                  <input
                    ref={fileRef}
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    style={{ display: 'none' }}
                    onChange={onUpload}
                  />

                  {canUpload && (
                    <Button
                      size="small"
                      variant="contained"
                      startIcon={<UploadFileIcon sx={{ fontSize: 18 }} />}
                      onClick={() => fileRef.current?.click()}
                      disabled={uploading}
                      sx={{
                        borderRadius: 999,
                        textTransform: 'none',
                        fontWeight: 600,
                        px: 2.5,
                        bgcolor: '#f97316',
                        boxShadow: '0 8px 20px rgba(234,88,12,0.35)',
                        '&:hover': { bgcolor: '#ea580c' },
                      }}
                    >
                      {uploading ? 'Uploading…' : 'Upload'}
                    </Button>
                  )}
                </>
              )}
            </Box>
          </Box>
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              gap: 1.5,
              mb: 3,
              alignItems: { sm: 'center' },
            }}
          >
            <TextField
              fullWidth
              size="small"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search employee / id / code..."
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 3,
                }
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon
                      fontSize="small"
                      sx={{ color: '#64748b', ml: 1 }}
                    />
                  </InputAdornment>
                ),
                endAdornment: search && (
                  <InputAdornment position="end">
                    <IconButton
                      size="small"
                      onClick={() => {
                        setSearch('');
                        setDebounced('');
                      }}
                      sx={{
                        p: 0.2,
                        color: '#475569',
                        bgcolor: 'transparent !important',
                        '&:hover': {
                          bgcolor: 'transparent !important',
                          color: '#1e293b',

                        },
                        '& .MuiTouchRipple-root': {
                          display: 'none',
                        },
                      }}
                    >
                      <CloseIcon sx={{ fontSize: 8 }} />
                    </IconButton>

                  </InputAdornment>
                ),
              }}
            />
            <TextField
              type="date"
              size="small"
              label="Date"
              value={dateStr}
              onChange={(e) => setDate(dayjs(e.target.value))}
              sx={{
                minWidth: 160,
                '& .MuiOutlinedInput-root': { borderRadius: 3 },
              }}
            />


            {/* Manager/TL Filter Dropdown */}
            <TextField
              select
              size="small"
              label="Filter by Manager/TL"
              value={managerTlFilter}
              onChange={(e) => setManagerTlFilter(e.target.value)}
              sx={{
                minWidth: 200,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 3,
                },
              }}
            >
              <MenuItem value="all">
                <em>All Employees</em>
              </MenuItem>
              {managerTlList.map((item) => (
                <MenuItem key={item.code} value={item.code}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip
                      size="small"
                      label={item.role}
                      sx={{
                        height: 20,
                        fontSize: 10,
                        bgcolor: item.role === 'Manager' ? '#dbeafe' : '#dcfce7',
                        color: item.role === 'Manager' ? '#1e40af' : '#166534',
                      }}
                    />
                    <span>{item.code} - {item.name}</span>
                  </Box>
                </MenuItem>
              ))}
            </TextField>




            <Stack
              direction="row"
              spacing={1}
              sx={{
                minWidth: { xs: '100%', sm: 'auto' },
                justifyContent: { xs: 'flex-start', sm: 'flex-end' },
              }}
            >
              <TextField
                select
                size="small"
                label="Sort by"
                value={sortConfig.key || ''}
                onChange={(e) => {
                  const value = e.target.value as SortKey | '';
                  if (!value) {
                    setSortConfig({ key: null, direction: 'asc' });
                  } else {
                    setSortConfig((prev) => ({
                      key: value,
                      direction: prev.key === value ? prev.direction : 'desc',
                    }));
                  }
                }}
                sx={{ minWidth: 170 }}
              >
                <MenuItem value="">None</MenuItem>
                <MenuItem value="login">Logins</MenuItem>
                <MenuItem value="approval">Approvals</MenuItem>
                <MenuItem value="disbursal">Disbursals</MenuItem>
              </TextField>

              {sortConfig.key && (
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() =>
                    setSortConfig((prev) => ({
                      ...prev,
                      direction: prev.direction === 'asc' ? 'desc' : 'asc',
                    }))
                  }
                  sx={{ textTransform: 'none', borderRadius: 999 }}
                >
                  {sortConfig.direction === 'asc' ? '↑ Asc' : '↓ Desc'}
                </Button>
              )}
            </Stack>
          </Box>
        </Paper>
        <Grid container spacing={2}>
          {/* 1) Total Logins (ORANGE) */}
          <Grid item xs={12} md={2.4}>
            <Paper
              sx={{
                p: 2.1,
                borderRadius: 2.5,
                color: '#ffffff',
                position: 'relative',
                overflow: 'hidden',
                background: 'linear-gradient(135deg, #fb923c 0%, #f97316 100%)',
                boxShadow: '0 10px 22px rgba(249,115,22,0.35)',
              }}
            >
              <Box
                sx={{
                  position: 'absolute',
                  top: -30,
                  right: -30,
                  width: 90,
                  height: 90,
                  borderRadius: '50%',
                  bgcolor: 'rgba(255,255,255,0.10)',
                }}
              />
              <Box sx={{ position: 'relative' }}>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    mb: 1.2,
                    alignItems: 'center',
                  }}
                >
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: 2,
                      bgcolor: 'rgba(255,255,255,0.22)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <CheckCircleIcon sx={{ fontSize: 22 }} />
                  </Box>
                  <TrendingUpIcon sx={{ opacity: 0.8, fontSize: 20 }} />
                </Box>

                <Typography
                  variant="body2"
                  sx={{ color: '#ffedd5', fontWeight: 500, mb: 0.3 }}
                >
                  Total Logins
                </Typography>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 800,
                    fontSize: 22,
                    lineHeight: 1.2,
                    color: '#fff',
                  }}
                >
                  {totals.logins.toLocaleString('en-IN')}
                </Typography>
              </Box>
            </Paper>
          </Grid>
          <Grid item xs={12} md={2.4}>
            <Paper
              sx={{
                p: 2.1,
                borderRadius: 2.5,
                color: '#ffffff',
                position: 'relative',
                overflow: 'hidden',
                background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                boxShadow: '0 10px 22px rgba(29,78,216,0.35)',
              }}
            >
              <Box
                sx={{
                  position: 'absolute',
                  top: -30,
                  right: -30,
                  width: 90,
                  height: 90,
                  borderRadius: '50%',
                  bgcolor: 'rgba(255,255,255,0.10)',
                }}
              />
              <Box sx={{ position: 'relative' }}>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    mb: 1.2,
                    alignItems: 'center',
                  }}
                >
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: 2,
                      bgcolor: 'rgba(255,255,255,0.22)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <span style={{ fontSize: 18, lineHeight: 1 }}>₹</span>
                  </Box>
                  <TrendingUpIcon sx={{ opacity: 0.8, fontSize: 20 }} />
                </Box>

                <Typography
                  variant="body2"
                  sx={{ color: 'rgba(255,255,255,0.85)', fontWeight: 500, mb: 0.3 }}
                >
                  Total Gross Approval
                </Typography>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 800,
                    fontSize: 22,
                    lineHeight: 1.2,
                    color: '#fff',
                  }}
                >
                  {rupee(totals.grossApproval)}
                </Typography>
              </Box>
            </Paper>
          </Grid>

          {/* 2) Total Approvals (YELLOW) */}
          <Grid item xs={12} md={2.4}>
            <Paper
              sx={{
                p: 2.1,
                borderRadius: 2.5,
                color: '#ffffff',
                position: 'relative',
                overflow: 'hidden',
                background: 'linear-gradient(135deg, #facc15 0%, #eab308 100%)',
                boxShadow: '0 10px 22px rgba(234,179,8,0.35)',
              }}
            >
              <Box
                sx={{
                  position: 'absolute',
                  top: -30,
                  right: -30,
                  width: 90,
                  height: 90,
                  borderRadius: '50%',
                  bgcolor: 'rgba(255,255,255,0.10)',
                }}
              />
              <Box sx={{ position: 'relative' }}>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    mb: 1.2,
                    alignItems: 'center',
                  }}
                >
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: 2,
                      bgcolor: 'rgba(255,255,255,0.22)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <EmojiEventsIcon sx={{ fontSize: 22 }} />
                  </Box>
                  <TrendingUpIcon sx={{ opacity: 0.8, fontSize: 20 }} />
                </Box>

                <Typography
                  variant="body2"
                  sx={{ color: '#fef3c7', fontWeight: 500, mb: 0.3 }}
                >
                  Total Net Approval
                </Typography>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 800,
                    fontSize: 22,
                    lineHeight: 1.2,
                    color: '#fff',
                  }}
                >
                  {rupee(totals.approvals)}
                </Typography>
              </Box>
            </Paper>
          </Grid>


          <Grid item xs={12} md={2.4}>
            <Paper
              sx={{
                p: 2.1,
                borderRadius: 2.5,
                color: '#ffffff',
                position: 'relative',
                overflow: 'hidden',
                background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
                boxShadow: '0 10px 22px rgba(109,40,217,0.35)',
              }}
            >
              <Box
                sx={{
                  position: 'absolute',
                  top: -30,
                  right: -30,
                  width: 90,
                  height: 90,
                  borderRadius: '50%',
                  bgcolor: 'rgba(255,255,255,0.10)',
                }}
              />
              <Box sx={{ position: 'relative' }}>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    mb: 1.2,
                    alignItems: 'center',
                  }}
                >
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: 2,
                      bgcolor: 'rgba(255,255,255,0.22)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <span style={{ fontSize: 18, lineHeight: 1 }}>₹</span>
                  </Box>
                  <TrendingUpIcon sx={{ opacity: 0.8, fontSize: 20 }} />
                </Box>

                <Typography
                  variant="body2"
                  sx={{ color: 'rgba(255,255,255,0.85)', fontWeight: 500, mb: 0.3 }}
                >
                  Total Gross Disbursal
                </Typography>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 800,
                    fontSize: 22,

                    lineHeight: 1.2,
                    color: '#fff',
                  }}
                >
                  {rupee(totals.grossDisbursal)}
                </Typography>
              </Box>
            </Paper>
          </Grid>
          <Grid item xs={12} md={2.4}>
            <Paper
              sx={{
                p: 2.1,
                borderRadius: 2.5,
                color: '#ffffff',
                position: 'relative',
                overflow: 'hidden',
                background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                boxShadow: '0 10px 22px rgba(22,163,74,0.35)',
              }}
            >
              <Box
                sx={{
                  position: 'absolute',
                  top: -30,
                  right: -30,
                  width: 90,
                  height: 90,
                  borderRadius: '50%',
                  bgcolor: 'rgba(255,255,255,0.10)',
                }}
              />
              <Box sx={{ position: 'relative' }}>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    mb: 1.2,
                    alignItems: 'center',
                  }}
                >
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: 2,
                      bgcolor: 'rgba(255,255,255,0.22)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <StarBorderIconLike />
                  </Box>
                  <TrendingUpIcon sx={{ opacity: 0.8, fontSize: 20 }} />
                </Box>

                <Typography
                  variant="body2"
                  sx={{ color: '#dcfce7', fontWeight: 500, mb: 0.3 }}
                >
                  Total Net Disbursal

                </Typography>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 800,
                    fontSize: 22,
                    lineHeight: 1.2,
                    color: '#fff',
                  }}
                >
                  {rupee(totals.disbursal)}
                </Typography>
              </Box>
            </Paper>
          </Grid>
          <Grid item xs={12} md={2.4}>
            <Paper
              sx={{
                p: 2.1,
                borderRadius: 2.5,
                color: '#ffffff',
                position: 'relative',
                overflow: 'hidden',
                background: 'linear-gradient(135deg, #0f172a 0%, #334155 100%)',
                boxShadow: '0 10px 22px rgba(15,23,42,0.35)',
              }}
            >
              <Box
                sx={{
                  position: 'absolute',
                  top: -30,
                  right: -30,
                  width: 90,
                  height: 90,
                  borderRadius: '50%',
                  bgcolor: 'rgba(255,255,255,0.10)',
                }}
              />
              <Box sx={{ position: 'relative' }}>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    mb: 1.2,
                    alignItems: 'center',
                  }}
                >
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: 2,
                      bgcolor: 'rgba(255,255,255,0.22)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <span style={{ fontSize: 16, lineHeight: 1 }}>Δ</span>
                  </Box>
                  <TrendingUpIcon sx={{ opacity: 0.8, fontSize: 20 }} />
                </Box>

                <Typography
                  variant="body2"
                  sx={{ color: 'rgba(255,255,255,0.85)', fontWeight: 500, mb: 0.3 }}
                >
                  Total ABND
                </Typography>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 800,
                    fontSize: 22,
                    lineHeight: 1.2,
                    color: '#fff',
                  }}
                >
                  {rupee(totals.abnp)}
                </Typography>
              </Box>
            </Paper>
          </Grid>

          {/* 5) Total Drop (RED) */}
          <Grid item xs={12} md={2.4}>
            <Paper
              sx={{
                p: 2.1,
                borderRadius: 2.5,
                color: '#ffffff',
                position: 'relative',
                overflow: 'hidden',
                background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
                boxShadow: '0 10px 22px rgba(185,28,28,0.35)',
              }}
            >
              <Box
                sx={{
                  position: 'absolute',
                  top: -30,
                  right: -30,
                  width: 90,
                  height: 90,
                  borderRadius: '50%',
                  bgcolor: 'rgba(255,255,255,0.10)',
                }}
              />
              <Box sx={{ position: 'relative' }}>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    mb: 1.2,
                    alignItems: 'center',
                  }}
                >
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: 2,
                      bgcolor: 'rgba(255,255,255,0.22)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <span style={{ fontSize: 18, lineHeight: 1 }}>↓</span>
                  </Box>
                  <TrendingUpIcon sx={{ opacity: 0.8, fontSize: 20 }} />
                </Box>

                <Typography
                  variant="body2"
                  sx={{ color: '#fee2e2', fontWeight: 500, mb: 0.3 }}
                >
                  Total Drop
                </Typography>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 800,
                    fontSize: 22,
                    lineHeight: 1.2,
                    color: '#fff',
                  }}
                >
                  {rupee(totals.drop)}
                </Typography>
              </Box>
            </Paper>
          </Grid>

          {/* 6) Total Cashback (CYAN) */}
          <Grid item xs={12} md={2.4}>
            <Paper
              sx={{
                p: 2.1,
                borderRadius: 2.5,
                color: '#ffffff',
                position: 'relative',
                overflow: 'hidden',
                background: 'linear-gradient(135deg, #06b6d4 0%, #0e7490 100%)',
                boxShadow: '0 10px 22px rgba(14,116,144,0.35)',
              }}
            >
              <Box
                sx={{
                  position: 'absolute',
                  top: -30,
                  right: -30,
                  width: 90,
                  height: 90,
                  borderRadius: '50%',
                  bgcolor: 'rgba(255,255,255,0.10)',
                }}
              />
              <Box sx={{ position: 'relative' }}>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    mb: 1.2,
                    alignItems: 'center',
                  }}
                >
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: 2,
                      bgcolor: 'rgba(255,255,255,0.22)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <span style={{ fontSize: 18, lineHeight: 1 }}>₹</span>
                  </Box>
                  <TrendingUpIcon sx={{ opacity: 0.8, fontSize: 20 }} />
                </Box>

                <Typography
                  variant="body2"
                  sx={{ color: '#cffafe', fontWeight: 500, mb: 0.3 }}
                >
                  Total Cashback
                </Typography>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 800,
                    fontSize: 22,
                    lineHeight: 1.2,
                    color: '#fff',
                  }}
                >
                  {rupee(totals.cashback)}
                </Typography>
              </Box>
            </Paper>
          </Grid>
        </Grid>



        {(starPerformers.approval || starPerformers.disbursal) && (
          <Paper
            sx={{
              p: 3,
              borderRadius: 3,
              border: '1px solid #e5e7eb',
              bgcolor: '#ffffff',
              boxShadow: '0 12px 30px rgba(15,23,42,0.08)',
            }}
          >
            <Box
              sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}
            >
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: 2,
                  bgcolor: '#fef3c7',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <EmojiEventsIcon sx={{ color: '#f97316' }} />
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 800 }}>
                Star Performers
              </Typography>
            </Box>

            <Grid container spacing={2.5}>
              {starPerformers.approval && (
                <Grid item xs={12} md={6}>
                  <Paper
                    sx={{
                      p: 2.5,
                      borderRadius: 2.5,
                      position: 'relative',
                      overflow: 'hidden',
                      background: '#e0f2fe',
                      border: '1px solid #e0f2fe',
                    }}
                  >
                    <Box
                      sx={{
                        position: 'absolute',
                        top: -30,
                        right: -30,
                        width: 90,
                        height: 90,
                        borderRadius: '50%',
                        bgcolor: 'rgba(34,197,94,0.18)',
                      }}
                    />
                    <Box sx={{ position: 'relative' }}>
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1,
                          mb: 0.5,
                        }}
                      >
                        <EmojiEventsIcon
                          sx={{ fontSize: 20, color: '#15803d' }}
                        />
                        <Typography
                          variant="body2"
                          sx={{ fontWeight: 600, color: '#166534' }}
                        >
                          Top Approval
                        </Typography>
                      </Box>
                      <Typography
                        variant="subtitle1"
                        sx={{ fontWeight: 800, color: '#022c22' }}
                      >
                        {starPerformers.approval.employee_name || '-'}
                      </Typography>
                      <Typography
                        variant="h5"
                        sx={{
                          fontWeight: 800,
                          mt: 0.5,
                          color: '#16a34a',
                        }}
                      >
                        {rupee(Number(starPerformers.approval.approval || 0))}
                      </Typography>
                    </Box>
                  </Paper>
                </Grid>
              )}

              {starPerformers.disbursal && (
                <Grid item xs={12} md={6}>
                  <Paper
                    sx={{
                      p: 2.5,
                      borderRadius: 2.5,
                      position: 'relative',
                      overflow: 'hidden',
                      background:
                        'linear-gradient(135deg, #eef2ff 0%, #c7d2fe 50%, #e0e7ff 100%)',
                      border: '1px solid #e0f2fe',
                    }}
                  >
                    <Box
                      sx={{
                        position: 'absolute',
                        top: -30,
                        right: -30,
                        width: 90,
                        height: 90,
                        borderRadius: '50%',
                        bgcolor: 'rgba(79,70,229,0.20)',
                      }}
                    />
                    <Box sx={{ position: 'relative' }}>
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1,
                          mb: 0.5,
                        }}
                      >
                        <StarBorderIconLike />
                        <Typography
                          variant="body2"
                          sx={{ fontWeight: 600, color: '#3730a3' }}
                        >
                          Top Disbursal
                        </Typography>
                      </Box>
                      <Typography
                        variant="subtitle1"
                        sx={{ fontWeight: 800, color: '#020617' }}
                      >
                        {starPerformers.disbursal.employee_name || '-'}
                      </Typography>
                      <Typography
                        variant="h5"
                        sx={{
                          fontWeight: 800,
                          mt: 0.5,
                          color: '#4f46e5',
                        }}
                      >
                        {rupee(
                          Number(starPerformers.disbursal.disbursal || 0),
                        )}
                      </Typography>
                    </Box>
                  </Paper>
                </Grid>
              )}
            </Grid>
          </Paper>
        )}

        {/* ========== DATA TABLE ========== */}
        <Paper
          sx={{
            borderRadius: 3,
            border: '1px solid #e5e7eb',
            overflow: 'hidden',
            boxShadow: '0 14px 30px rgba(15,23,42,0.10)',
          }}
        >
          {loading ? (
            <Box sx={{ p: 3 }}>
              <LinearProgress />
              <Typography variant="body2" sx={{ mt: 1 }}>
                Loading…
              </Typography>
            </Box>
          ) : sortedRows.length === 0 ? (
            <Box sx={{ textAlign: 'center', p: 5 }}>
              <Box
                sx={{
                  width: 64,
                  height: 64,
                  borderRadius: '50%',
                  bgcolor: '#e5e7eb',
                  mx: 'auto',
                  mb: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <SearchIcon sx={{ fontSize: 30, color: '#9ca3af' }} />
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 800, mb: 0.5 }}>
                No records found
              </Typography>
              <Typography variant="body2" sx={{ color: '#6b7280' }}>
                {search
                  ? `No results for “${search}”`
                  : 'No data available for selected date'}
              </Typography>
            </Box>
          ) : (
            <TableContainer>
              <Table size="large">
                <TableHead>
                  <TableRow
                    sx={{
                      background:
                        'linear-gradient(90deg,#EEF2FF 0%, #E0EAFF 100%)',
                    }}
                  >
                    <TableCell sx={{ fontWeight: 800 }}>S.No.</TableCell>   {/* 👈 NEW */}

                    <TableCell sx={{ fontWeight: 800 }}>Date</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Employee</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Code</TableCell>

                    <TableCell sx={{ fontWeight: 800 }}>Manager / TL</TableCell>

                    <TableCell align="right" sx={{ fontWeight: 800 }}>
                      Logins
                    </TableCell>

                    <TableCell align="right" sx={{ fontWeight: 800 }}>
                      Approvals (₹)
                    </TableCell>

                    <TableCell align="right" sx={{ fontWeight: 800 }}>
                      Disbursal (₹)
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 800 }}>
                      Drop (₹)
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 800 }}>
                      Cashback (₹)
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 800 }}>
                      Gross Approval (₹)
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 800 }}>
                      Gross Disbursal (₹)
                    </TableCell>


                    <TableCell align="center" sx={{ fontWeight: 800 }}>
                      Team Total
                    </TableCell>

                    <TableCell align="right" sx={{ fontWeight: 800 }}>
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {sortedRows.map((r, index) => {
                    const teamInfo = r.code ? teamTotals[r.code] : null;

                    return (
                      <TableRow key={r._id} sx={{ background: rowBg(r) }}>
                        <TableCell>
                          <Typography sx={{ fontWeight: 700, color: 'black' }}>
                            {index + 1}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ color: '#4b5563' }}>
                            {r.date ? dayjs(r.date).format("DD-MM-YYYY") : '—'}
                          </Typography>
                        </TableCell>

                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography sx={{ fontWeight: 700, color: '#6b21a8' }}>
                              {r.employee_name || '-'}
                            </Typography>

                            {showStar(r.drop) && (
                              <Tooltip title={`Drop Amount: ${rupee(r.drop)}`} arrow>
                                <span style={{ color: "#E11D48", fontSize: "16px", cursor: "pointer" }}>★</span>
                              </Tooltip>
                            )}

                            {showStar(r.cashback) && (
                              <Tooltip title={`Cashback Amount: ${rupee(r.cashback)}`} arrow>
                                <span style={{ color: "#1D4ED8", fontSize: "16px", cursor: "pointer" }}>#

                                </span>
                              </Tooltip>
                            )}

                            {teamInfo && (
                              <Chip
                                size="small"
                                label={teamInfo.role === 'manager' ? 'Manager' : 'TL'}
                                sx={{
                                  bgcolor: teamInfo.role === 'manager' ? '#FEF3C7' : '#DBEAFE',
                                  color: teamInfo.role === 'manager' ? '#92400E' : '#1E40AF',
                                  fontWeight: 600,
                                  fontSize: '0.65rem',
                                  height: 20,
                                }}
                              />
                            )}
                          </Box>

                          {r.employee_id && (
                            <Typography variant="caption" sx={{ color: '#6b7280' }}>
                              {r.employee_id}
                            </Typography>
                          )}
                        </TableCell>

                        <TableCell>
                          <Typography variant="body2" sx={{ color: '#4b5563' }}>
                            {r.code || '—'}
                          </Typography>
                        </TableCell>

                        <TableCell>
                          {r.manager_tl ? (
                            <Chip
                              size="small"
                              label={r.manager_tl}
                              sx={{
                                bgcolor: '#F3E8FF',
                                fontWeight: 600,
                                color: '#6b21a8',
                              }}
                            />
                          ) : (
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              —
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell align="right">
                          <Chip
                            size="small"
                            label={Number(r.login || 0)}
                            sx={{
                              bgcolor: '#DCFCE7',
                              fontWeight: 800,
                              color: '#166534',
                            }}
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Chip
                            size="small"
                            label={rupee(Number(r.approval || 0))}
                            sx={{
                              bgcolor: '#E0F2FE',
                              fontWeight: 800,
                              color: '#1d4ed8',
                            }}
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Chip
                            size="small"
                            label={rupee(Number(r.disbursal || 0))}
                            sx={{
                              bgcolor: '#EDE9FE',
                              fontWeight: 800,
                              color: '#6d28d9',
                            }}
                          />
                        </TableCell>



                        <TableCell align="right">
                          <Chip
                            size="small"
                            label={rupee(Number(r.drop || r.drop_amount || 0))}
                            sx={{
                              bgcolor: '#FFE4E6',
                              fontWeight: 800,
                              color: '#BE123C',
                            }}
                          />

                        </TableCell>
                        <TableCell align="right">
                          <Chip
                            size="small"
                            label={rupee(Number(r.cashback || r.cashback_amount || 0))}
                            sx={{
                              bgcolor: '#FFE4E6',
                              fontWeight: 800,
                              color: '#BE123C',
                            }}
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Chip
                            size="small"
                            label={rupee(Number(r.gross_approval || 0))}
                            sx={{ bgcolor: '#E0F2FE', fontWeight: 800, color: '#1d4ed8' }}
                          />
                        </TableCell>

                        <TableCell align="right">
                          <Chip
                            size="small"
                            label={rupee(Number(r.gross_disbursal || 0))}
                            sx={{ bgcolor: '#EDE9FE', fontWeight: 800, color: '#6d28d9' }}
                          />
                        </TableCell>
                        {/* Team Total Column */}
                        <TableCell align="center">
                          {teamInfo ? (
                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>

                              <Tooltip title={`${teamInfo.memberCount} team members`}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                  <GroupsIcon sx={{ fontSize: 16, color: '#6b7280' }} />
                                  <Typography variant="caption" sx={{ color: '#6b7280' }}>
                                    {teamInfo.memberCount}
                                  </Typography>
                                </Box>
                              </Tooltip>
                              {/* <Box sx={{ display: 'flex', gap: 0.5 }}>
                                <Chip
                                  size="small"
                                  label={rupee(teamInfo.teamTotalApproval)}
                                  sx={{
                                    bgcolor: '#DCFCE7',
                                    fontWeight: 700,
                                    color: '#166534',
                                    fontSize: '0.7rem',
                                  }}
                                />
                                <Chip
                                  size="small"
                                  label={rupee(teamInfo.teamTotalDisbursal)}
                                  sx={{
                                    bgcolor: '#FCE7F3',
                                    fontWeight: 700,
                                    color: '#9D174D',
                                    fontSize: '0.7rem',
                                  }}
                                />
                              </Box> */}
                              <Tooltip title="View Team Breakdown">
                                <IconButton
                                  size="small"
                                  onClick={() => fetchTeamBreakdown(r.code!)}
                                  sx={{
                                    bgcolor: '#EEF2FF',
                                    '&:hover': { bgcolor: '#C7D2FE' },
                                  }}
                                >
                                  <VisibilityIcon sx={{ fontSize: 16, color: '#4F46E5' }} />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          ) : (
                            <Typography variant="caption" color="text.secondary">
                              —
                            </Typography>
                          )}
                        </TableCell>

                        <TableCell align="right">

                          {canAddRow ? (
                            <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                              <Tooltip title="Edit row">
                                <IconButton
                                  color="primary"
                                  size="small"
                                  onClick={() => {
                                    setEditingId(r._id);

                                    if (r.date) setDate(dayjs(r.date));

                                    setForm({
                                      employee_name: r.employee_name || '',
                                      manager_tl: r.manager_tl || '',
                                      total_logins: String(r.login ?? r.total_logins ?? 0 || ''),
                                      approval_lakh: r.approval ? Number(r.approval).toLocaleString('en-IN') : '',
                                      disbursal_lakh: r.disbursal ? Number(r.disbursal).toLocaleString('en-IN') : '',
                                      drop_lakh: r.drop ? Number(r.drop).toLocaleString('en-IN') : '',
                                      cashback_lakh: r.cashback ? Number(r.cashback).toLocaleString('en-IN') : '',
                                      code: r.code || '',
                                    });

                                    setAmountUnit('rupees');
                                    setFormOpen(true);
                                  }}
                                >
                                  <EditIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>

                              {isAdmin && (
                                <Tooltip title="Delete row">
                                  <IconButton color="error" size="small" onClick={() => onDelete(r._id)}>
                                    <DeleteIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              )}
                            </Stack>
                          ) : (
                            <Typography variant="caption" color="text.secondary">
                              —
                            </Typography>
                          )}

                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>

        {/* ========== Team Breakdown Modal ========== */}
        <Dialog
          open={teamModalOpen}
          onClose={() => {
            setTeamModalOpen(false);
            setTeamBreakdown(null);
          }}
          fullWidth
          maxWidth="md"
          PaperProps={{
            sx: {
              borderRadius: 3,
              boxShadow: '0 25px 60px rgba(15,23,42,0.35)',
            },
          }}
        >
          <DialogTitle sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1 }}>
            <GroupsIcon sx={{ color: '#4F46E5' }} />
            Team Performance Breakdown
          </DialogTitle>
          <DialogContent dividers sx={{ pt: 2.5, pb: 2.5 }}>
            {teamBreakdownLoading ? (
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <LinearProgress />
                <Typography variant="body2" sx={{ mt: 1 }}>Loading team data...</Typography>
              </Box>
            ) : teamBreakdown ? (
              <Box>
                {/* Employee Info */}
                <Paper sx={{ p: 2, mb: 3, bgcolor: '#F8FAFC', borderRadius: 2 }}>
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} md={6}>
                      <Typography variant="h6" sx={{ fontWeight: 700, color: '#1E293B' }}>
                        {teamBreakdown.employee.name}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#64748B' }}>
                        {teamBreakdown.employee.designation} • Code: {teamBreakdown.employee.code}
                      </Typography>
                      <Chip
                        size="small"
                        label={teamBreakdown.role === 'manager' ? 'Manager' : teamBreakdown.role === 'team_leader' ? 'Team Leader' : 'Employee'}
                        sx={{
                          mt: 1,
                          bgcolor: teamBreakdown.role === 'manager' ? '#FEF3C7' : '#DBEAFE',
                          color: teamBreakdown.role === 'manager' ? '#92400E' : '#1E40AF',
                          fontWeight: 600,
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      {teamBreakdown.team && (
                        <Box sx={{ textAlign: { md: 'right' } }}>
                          <Typography variant="body2" sx={{ color: '#64748B' }}>Team</Typography>
                          <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#4F46E5' }}>
                            {teamBreakdown.team.name}
                          </Typography>
                        </Box>
                      )}
                    </Grid>
                  </Grid>
                </Paper>

                {/* Team Totals Summary */}
                <Grid container spacing={2} sx={{ mb: 3 }}>

                  {/* Team Members */}
                  <Grid item xs={6} md={3}>
                    <Paper
                      sx={{
                        p: 2,
                        textAlign: 'center',
                        bgcolor: '#DCFCE7',
                        borderRadius: 2,
                      }}
                    >
                      <Typography variant="caption" sx={{ color: '#166534', fontWeight: 600 }}>
                        Team Members
                      </Typography>

                      <Typography variant="h5" sx={{ fontWeight: 800, color: '#166534' }}>
                        {teamBreakdown.totals.memberCount}
                      </Typography>
                    </Paper>
                  </Grid>

                  {/* Total Logins */}
                  <Grid item xs={6} md={3}>
                    <Paper
                      sx={{
                        p: 2,
                        textAlign: 'center',
                        bgcolor: '#E0F2FE',
                        borderRadius: 2,
                      }}
                    >
                      <Typography variant="caption" sx={{ color: '#1E40AF', fontWeight: 600 }}>
                        Total Logins
                      </Typography>

                      <Typography variant="h5" sx={{ fontWeight: 800, color: '#1E40AF' }}>
                        {teamBreakdown.totals.totalLogins.toLocaleString('en-IN')}
                      </Typography>
                    </Paper>
                  </Grid>

                  {/* Total Disbursal */}
                  <Grid item xs={6} md={3}>
                    <Paper
                      sx={{
                        p: 2,
                        textAlign: 'center',
                        bgcolor: '#EDE9FE',     // light purple
                        borderRadius: 2,
                      }}
                    >
                      <Typography
                        variant="caption"
                        sx={{ color: '#6D28D9', fontWeight: 600 }}  // dark purple
                      >
                        Total Approval
                      </Typography>

                      <Typography
                        variant="h5"
                        sx={{ fontWeight: 800, color: '#6D28D9' }}
                      >
                        {rupee(teamBreakdown.totals.totalApproval)}
                      </Typography>
                    </Paper>
                  </Grid>

                  {/* Total Disbursal */}
                  <Grid item xs={6} md={3}>
                    <Paper
                      sx={{
                        p: 2,
                        textAlign: 'center',
                        bgcolor: '#DCFCE7',   // green
                        borderRadius: 2,
                      }}
                    >
                      <Typography variant="caption" sx={{ color: '#166534', fontWeight: 600 }}>
                        Total Disbursal
                      </Typography>

                      <Typography variant="h5" sx={{ fontWeight: 800, color: '#166534' }}>
                        {rupee(teamBreakdown.totals.totalDisbursal)}
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <Paper sx={{ p: 2, textAlign: 'center', bgcolor: '#E0F2FE', borderRadius: 2 }}>
                      <Typography variant="caption" sx={{ color: '#1E40AF', fontWeight: 600 }}>
                        Total Gross Approval
                      </Typography>
                      <Typography variant="h5" sx={{ fontWeight: 800, color: '#1E40AF' }}>
                        {rupee(teamBreakdown.totals.totalGrossApproval || 0)}
                      </Typography>
                    </Paper>
                  </Grid>

                  <Grid item xs={6} md={3}>
                    <Paper sx={{ p: 2, textAlign: 'center', bgcolor: '#EDE9FE', borderRadius: 2 }}>
                      <Typography variant="caption" sx={{ color: '#6D28D9', fontWeight: 600 }}>
                        Total Gross Disbursal
                      </Typography>
                      <Typography variant="h5" sx={{ fontWeight: 800, color: '#6D28D9' }}>
                        {rupee(teamBreakdown.totals.totalGrossDisbursal || 0)}
                      </Typography>
                    </Paper>
                  </Grid>
                </Grid>

                {/* Member Breakdown Table */}
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
                  Member-wise Breakdown
                </Typography>
                {teamBreakdown.memberBreakdown.length > 0 ? (
                  <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{ bgcolor: '#F1F5F9' }}>
                          <TableCell sx={{ fontWeight: 700 }}>Employee</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Code</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700 }}>Logins</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 800 }}>Approvals (₹)</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 800 }}>Disbursal (₹)</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 800 }}>Drop (₹)</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 800 }}>Cashback (₹)</TableCell>

                          <TableCell align="right" sx={{ fontWeight: 800 }}>Gross Approval (₹)</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 800 }}>Gross Disbursal (₹)</TableCell>

                          {/* <TableCell align="right" sx={{ fontWeight: 800 }}>ABNP (₹)</TableCell> */}
                        </TableRow>
                      </TableHead>

                      <TableBody>
                        {teamBreakdown.memberBreakdown.map((member, idx) => (
                          <TableRow key={idx} sx={{ '&:hover': { bgcolor: '#F8FAFC' } }}>
                            <TableCell>
                              <Typography sx={{ fontWeight: 600, color: '#1E293B' }}>
                                {member.name}
                              </Typography>
                            </TableCell>

                            <TableCell>
                              <Typography variant="body2" sx={{ color: '#64748B' }}>
                                {member.code}
                              </Typography>
                            </TableCell>

                            <TableCell align="right">
                              <Chip
                                size="small"
                                label={Number(member.logins || 0).toLocaleString('en-IN')}
                                sx={{ bgcolor: '#DCFCE7', color: '#166534', fontWeight: 700 }}
                              />
                            </TableCell>

                            <TableCell align="right">
                              <Chip
                                size="small"
                                label={rupee(Number(member.approval || 0))}
                                sx={{ bgcolor: '#E0F2FE', color: '#1E40AF', fontWeight: 700 }}
                              />
                            </TableCell>

                            <TableCell align="right">
                              <Chip
                                size="small"
                                label={rupee(Number(member.disbursal || 0))}
                                sx={{ bgcolor: '#EDE9FE', color: '#6D28D9', fontWeight: 700 }}
                              />
                            </TableCell>

                            <TableCell align="right">
                              <Chip
                                size="small"
                                label={rupee(Number(member.drop || 0))}
                                sx={{ bgcolor: '#FFE4E6', color: '#BE123C', fontWeight: 800 }}
                              />
                            </TableCell>

                            <TableCell align="right">
                              <Chip
                                size="small"
                                label={rupee(Number(member.cashback || 0))}
                                sx={{ bgcolor: '#CFFAFE', color: '#0E7490', fontWeight: 800 }}
                              />
                            </TableCell>

                            <TableCell align="right">
                              <Chip
                                size="small"
                                label={rupee(Number(member.grossApproval || 0))}
                                sx={{ bgcolor: '#DBEAFE', color: '#1D4ED8', fontWeight: 800 }}
                              />
                            </TableCell>

                            <TableCell align="right">
                              <Chip
                                size="small"
                                label={rupee(Number(member.grossDisbursal || 0))}
                                sx={{ bgcolor: '#EDE9FE', color: '#6D28D9', fontWeight: 800 }}
                              />
                            </TableCell>

                          </TableRow>
                        ))}
                      </TableBody>

                    </Table>
                  </TableContainer>
                ) : (
                  <Box sx={{ textAlign: 'center', p: 3, bgcolor: '#F8FAFC', borderRadius: 2 }}>
                    <Typography color="text.secondary">
                      No performance data found for team members
                    </Typography>
                  </Box>
                )}
              </Box>
            ) : (
              <Box sx={{ textAlign: 'center', p: 3 }}>
                <Typography color="text.secondary">No data available</Typography>
              </Box>
            )}
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 2 }}>
            <Button
              onClick={() => {
                setTeamModalOpen(false);
                setTeamBreakdown(null);
              }}
            >
              Close
            </Button>
          </DialogActions>
        </Dialog>

        {/* ========== Add/Edit Dialog ========== */}
        <Dialog
          open={formOpen}
          onClose={() => {
            if (!formSaving) {
              setFormOpen(false);
              resetForm();
            }
          }}
          fullWidth
          maxWidth="md"
          PaperProps={{
            sx: {
              borderRadius: 3,
              boxShadow: '0 25px 60px rgba(15,23,42,0.35)',
            },
          }}
        >
          <DialogTitle sx={{ fontWeight: 800 }}>
            {editingId ? 'Edit Performance' : 'Add Performance'}
          </DialogTitle>
          <DialogContent dividers sx={{ pt: 2.5, pb: 2.5 }}>
            <Grid container spacing={2.5}>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Employee Name"
                  value={form.employee_name}
                  onChange={handleFormChange('employee_name')}
                  fullWidth
                  size="medium"
                  required
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  label="Code (optional)"
                  value={form.code}
                  onChange={handleFormChange('code')}
                  fullWidth
                  size="medium"
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <Autocomplete
                  freeSolo
                  options={managerOptions}
                  value={form.manager_tl}
                  onChange={(_, value) =>
                    setForm((prev) => ({ ...prev, manager_tl: value || '' }))
                  }
                  onInputChange={(_, value) =>
                    setForm((prev) => ({ ...prev, manager_tl: value }))
                  }
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Manager / TL"
                      fullWidth
                      size="medium"
                      required
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} md={4}> <TextField label="Total Logins" type="number" value={form.total_logins} onChange={handleFormChange('total_logins')} fullWidth size="medium" /> </Grid>


              {/* Approval */}
              <Grid item xs={12} md={4}>
                <TextField
                  label={
                    amountUnit === 'rupees'
                      ? 'Approval (₹ in Rupees)'
                      : 'Approval (₹ in Lakhs)'
                  }
                  type="text"
                  value={form.approval_lakh ?? ''}
                  onChange={(e) => {
                    const val = e.target.value;

                    const isAllowed = /^[0-9,]*$/.test(val) || val === '';

                    if (!isAllowed) return;
                    setForm((prev) => ({
                      ...prev,
                      approval_lakh: val,
                    }));
                  }}
                  onBlur={() => {
                    const raw = (form.approval_lakh || '').replace(/,/g, '');

                    if (raw === '' || isNaN(Number(raw))) return;
                    const formatted = Number(raw).toLocaleString('en-IN');

                    setForm((prev) => ({
                      ...prev,
                      approval_lakh: formatted,
                    }));
                  }}
                  fullWidth
                  size="medium"
                />
              </Grid>

              {/* Disbursal */}
              <Grid item xs={12} md={4}>
                <TextField
                  label={
                    amountUnit === 'rupees'
                      ? 'Disbursal (₹ in Rupees)'
                      : 'Disbursal (₹ in Lakhs)'
                  }
                  type="text"
                  value={form.disbursal_lakh ?? ''}
                  onChange={(e) => {
                    const val = e.target.value;

                    const isAllowed = /^[0-9,]*$/.test(val) || val === '';

                    if (!isAllowed) return;
                    setForm((prev) => ({
                      ...prev,
                      disbursal_lakh: val,
                    }));
                  }}
                  onBlur={() => {
                    const raw = (form.disbursal_lakh || '').replace(/,/g, '');

                    if (raw === '' || isNaN(Number(raw))) return;
                    const formatted = Number(raw).toLocaleString('en-IN');

                    setForm((prev) => ({
                      ...prev,
                      disbursal_lakh: formatted,
                    }));
                  }}
                  fullWidth
                  size="medium"
                />
              </Grid>
              {/* Drop Amount */}
              <Grid item xs={12} md={4}>
                <TextField
                  label={
                    amountUnit === 'rupees'
                      ? 'Drop Amount (₹ in Rupees)'
                      : 'Drop Amount (₹ in Lakhs)'
                  }
                  type="text"
                  value={form.drop_lakh ?? ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (/^[0-9,]*$/.test(val) || val === '') {
                      setForm((prev) => ({ ...prev, drop_lakh: val }));
                    }
                  }}
                  onBlur={() => {
                    const raw = (form.drop_lakh || '').replace(/,/g, '');
                    if (raw !== '' && !isNaN(Number(raw))) {
                      setForm((prev) => ({
                        ...prev,
                        drop_lakh: Number(raw).toLocaleString('en-IN'),
                      }));
                    }
                  }}
                  fullWidth
                  size="medium"
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  label={
                    amountUnit === 'rupees'
                      ? 'Cashback Amount (₹ in Rupees)'
                      : 'Cashback Amount (₹ in Lakhs)'
                  }
                  type="text"
                  value={form.cashback_lakh ?? ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (/^[0-9,]*$/.test(val) || val === '') {
                      setForm((prev) => ({ ...prev, cashback_lakh: val }));
                    }
                  }}
                  onBlur={() => {
                    const raw = (form.cashback_lakh || '').replace(/,/g, '');
                    if (raw !== '' && !isNaN(Number(raw))) {
                      setForm((prev) => ({
                        ...prev,
                        cashback_lakh: Number(raw).toLocaleString('en-IN'),
                      }));
                    }
                  }}
                  fullWidth
                  size="medium"
                />
              </Grid>


            </Grid>
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 2 }}>
            <Button
              onClick={() => {
                if (!formSaving) {
                  setFormOpen(false);
                  resetForm();
                }
              }}
              disabled={formSaving}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={onFormSubmit}
              disabled={formSaving}
            >
              {formSaving ? 'Saving…' : editingId ? 'Update Row' : 'Save Row'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Box>
  );
}

/**
 * Small helper "star" icon using simple shape,
 * so we don't add a new MUI icon import.
 */
function StarBorderIconLike() {
  return (
    <Box
      sx={{
        width: 24,
        height: 24,
        borderRadius: '50%',
        border: '2px solid rgba(255,255,255,0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <StarIconInside />
    </Box>
  );
}

function StarIconInside() {
  return <span style={{ fontSize: 14, lineHeight: 1 }}>★</span>;
}
