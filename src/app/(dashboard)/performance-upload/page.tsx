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
import LoginIcon from "@mui/icons-material/Login";

import Autocomplete from '@mui/material/Autocomplete';

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
type Row = {
  _id: string;
  date: string;
  employee_name?: string;
  employee_id?: string;
  manager_tl?: string;
  login?: number;
  approval?: number;
  disbursal?: number;
  drop?: number;
  cashback?: number;
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
  teamTotalABNP?: number;
  teamTotalGrossApproval?: number;
  teamTotalGrossDisbursal?: number;
  teamTotalHold?: number;
  teamTotalReject?: number;

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
    totalHold: number;
    totalRejected: number;
    totalDrop: number;
    totalCashback: number;
    totalGrossApproval?: number;
    totalGrossDisbursal?: number;
    totalABNP?: number;
    memberCount: number;
  };

  memberBreakdown: {
    code: string;
    name: string;
    logins: number;
    hold: number;
    rejected: number;
    approval: number;
    disbursal: number;
    drop?: number;
    cashback?: number;
    grossApproval?: number;
    grossDisbursal?: number;
    abnp?: number;
  }[];
};

/* ---------------- Helpers ---------------- */
const rupee = (n: number) =>
  `₹${Intl.NumberFormat('en-IN').format(Number(n || 0))}`;

type KpiModalType =
  | 'logins'
  | 'rejected'
  | 'hold'
  | 'inProcess'
  | 'grossApproval'
  | 'netApproval'
  | 'grossDisbursal'
  | 'netDisbursal'
  | 'abnd'
  | 'drop'
  | 'cashback';

function kpiTitle(type: KpiModalType) {
  switch (type) {
    case 'logins':
      return 'Login Cases';
    case 'rejected':
      return 'Rejected Cases';
    case 'hold':
      return 'Hold Cases';
    case 'inProcess':
      return 'In Process Cases';
    case 'grossApproval':
      return 'Gross Approval Cases';
    case 'netApproval':
      return 'Net Approval Cases';
    case 'grossDisbursal':
      return 'Gross Disbursal Cases';
    case 'netDisbursal':
      return 'Net Disbursal Cases';
    case 'abnd':
      return 'ABND Cases';
    case 'drop':
      return 'Drop Cases';
    case 'cashback':
      return 'Cashback Cases';
    default:
      return 'Cases';
  }
}

function kpiMetricValue(type: KpiModalType, r: Row) {
  switch (type) {
    case 'logins':
      return Number(r.login || 0);
    case 'rejected':
      return Number(r.rejected || 0);
    case 'hold':
      return Number(r.hold || 0);
    case 'inProcess':
      return Number(r.in_process || 0);
    case 'grossApproval':
      return Number(r.gross_approval || 0);
    case 'netApproval':
      return Number(r.approval || 0);
    case 'grossDisbursal':
      return Number(r.gross_disbursal || 0);
    case 'netDisbursal':
      return Number(r.disbursal || 0);
    case 'abnd':
      return Number(r.abnp || 0);
    case 'drop':
      return Number(r.drop || 0);
    case 'cashback':
      return Number(r.cashback || 0);
    default:
      return 0;
  }
}


function KpiCard({
  title,
  value,
  leftIcon,
  bg,
  subColor,
  onView,
}: {
  title: string;
  value: string;
  leftIcon: React.ReactNode;
  bg: string;
  subColor: string;
  onView?: () => void;
}) {
  return (
    <Paper
      sx={{
        p: 2.1,
        borderRadius: 4,
        color: '#ffffff',
        position: 'relative',
        overflow: 'hidden',
        background: bg,
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255,255,255,0.2)',
        boxShadow: '0 12px 30px rgba(15,23,42,0.15)',
        transition: 'transform 0.3s ease, box-shadow 0.3s ease',
        '&:hover': {
          transform: 'translateY(-5px)',
          boxShadow: '0 20px 40px rgba(15,23,42,0.25)',
        }
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
              width: 36,
              height: 36,
              borderRadius: 3,
              bgcolor: 'rgba(255,255,255,0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
            }}
          >
            {leftIcon}
          </Box>
          <TrendingUpIcon sx={{ opacity: 0.9, fontSize: 24, filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' }} />
        </Box>

        <Typography
          variant="body2"
          sx={{ color: subColor, fontWeight: 500, mb: 0.3 }}
        >
          {title}
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
          {value}
        </Typography>

        {onView && (
          <Button
            size="small"
            onClick={onView}
            startIcon={<VisibilityIcon sx={{ fontSize: 16 }} />}
            sx={{
              mt: 1.2,
              borderRadius: 999,
              textTransform: 'none',
              fontWeight: 800,
              px: 2,
              bgcolor: 'rgba(255,255,255,0.18)',
              color: '#fff',
              border: '1px solid rgba(255,255,255,0.25)',
              '&:hover': { bgcolor: 'rgba(255,255,255,0.25)' },
            }}
          >
            View
          </Button>
        )}
      </Box>
    </Paper>
  );
}

export default function PerformanceUploadPage() {
  const router = useRouter();
  const q = useSearchParams();

  const [date, setDate] = useState<Dayjs | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const comparisonFileRef = useRef<HTMLInputElement | null>(null);
  const [uploadingComparison, setUploadingComparison] = useState(false);
  const [comparisonData, setComparisonData] = useState<any[][]>([]);
  const [comparisonModalOpen, setComparisonModalOpen] = useState(false);
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
    total_rejected: '',
    total_hold: '',
    approval_lakh: '',
    disbursal_lakh: '',
    drop_lakh: '',
    cashback_lakh: '',
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
  const [managerTlList, setManagerTlList] = useState<
    { code: string; name: string; role: string }[]
  >([]);

  const [kpiModalOpen, setKpiModalOpen] = useState(false);
  const [kpiModalType, setKpiModalType] = useState<KpiModalType>('logins');

  const openKpiModal = (type: KpiModalType) => {
    setKpiModalType(type);
    setKpiModalOpen(true);
  };

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search.trim().toLowerCase()), 300);
    return () => clearTimeout(t);
  }, [search]);

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
    const u =
      typeof window !== 'undefined'
        ? JSON.parse(localStorage.getItem('user') || '{}')
        : {};
    setUser(u);
    setIsAdmin(String(u?.role) === '1');
  }, []);

  const dateStr = (date ? date : dayjs()).format('YYYY-MM-DD');

  const isOps = Boolean(
    user?.designation?.toLowerCase().includes('ops') ||
    ['Asst. Ops Manager', 'Ops Manager', 'Credit Executive', 'Assistant Growth Manager', 'Sr. Operations & Alliances Manager', 'Ops Executive'].includes(user?.designation)
  );
  const canUpload = isAdmin || isOps;
  const canAddRow = isAdmin || isOps;
  const canDeleteAll = isAdmin || isOps;

  const fetchComparisonData = async () => {
    try {
      const company_id =
        localStorage.getItem('company_id') ||
        JSON.parse(localStorage.getItem('user') || '{}')?.company_id ||
        '';
      const res = await api.get('/performance-upload/comparison', {
        params: { company_id }
      });
      if (res.data?.data) {
        setComparisonData(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch comparison data', err);
    }
  };

  useEffect(() => {
    fetchComparisonData();
  }, []);

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

      const raw: any[] = Array.isArray(res.data) ? res.data : res.data?.data || [];

      const normalized: Row[] = raw.map((r) => {
        const login = Number(r.login ?? r.total_logins ?? 0);
        const rejected = Number(r.rejected ?? r.total_rejected ?? 0);
        const hold = Number(r.hold ?? r.total_hold ?? 0);
        const in_process = Number(r.in_process ?? 0);

        const approval = Number(r.approval ?? r.approval_amount ?? 0);
        const disbursal = Number(r.disbursal ?? r.disbursal_amount ?? 0);
        const drop = Number(r.drop ?? r.drop_amount ?? 0);
        const cashback = Number(r.cashback ?? r.cashback_amount ?? 0);
        const gross_approval = Number(r.gross_approval ?? r.grossApproval ?? 0);
        const gross_disbursal = Number(r.gross_disbursal ?? r.grossDisbursal ?? 0);

        const abnp = Math.max(approval - (disbursal + drop + cashback), 0);

        return {
          ...r,
          login,
          rejected,
          hold,
          in_process,
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

      // fallback: if today has no data -> jump to latest uploaded date
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
            setIsFallbackDate(true);
            setDate(dayjs(latestDate));
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

  useEffect(() => {
    if (rows.length > 0) fetchTeamTotals();
  }, [rows]);

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
        headers: { 'Content-Type': 'multipart/form-data' },
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

  const onUploadComparison = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingComparison(true);
      const formData = new FormData();
      formData.append('file', file);

      const company_id =
        localStorage.getItem('company_id') ||
        JSON.parse(localStorage.getItem('user') || '{}')?.company_id ||
        '';

      const res = await api.post('/performance-upload/upload-comparison', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        params: { company_id },
      });
      
      setComparisonData(res.data?.data || []);
      setComparisonModalOpen(true);
      alert('Comparison sheet uploaded successfully.');
    } catch (err: any) {
      console.error(err);
      alert(err?.response?.data?.message || 'Upload failed.');
    } finally {
      if (comparisonFileRef.current) comparisonFileRef.current.value = '';
      setUploadingComparison(false);
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

  const onDeleteByDate = async () => {
    if (!dateStr) {
      alert('Select date first');
      return;
    }

    const confirmDelete = confirm(`Delete ALL data for ${dateStr}?`);
    if (!confirmDelete) return;

    try {
      const company_id =
        localStorage.getItem('company_id') ||
        JSON.parse(localStorage.getItem('user') || '{}')?.company_id ||
        '';

      await api.delete('/performance-upload/delete-by-date', {
        params: { date: dateStr, company_id },
      });

      alert('All records deleted for selected date');
      await fetchList();
    } catch (e) {
      console.error(e);
      alert('Delete failed');
    }
  };
  const handleFormChange =
    (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
    };

  const resetForm = () => {
    setForm({
      employee_name: '',
      manager_tl: '',
      total_logins: '',
      total_rejected: '',
      total_hold: '',
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
        total_rejected: Number(form.total_rejected || 0),
        total_hold: Number(form.total_hold || 0),
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
    const sum = (
      k:
        | 'login'
        | 'rejected'
        | 'hold'
        | 'in_process'
        | 'approval'
        | 'disbursal'
        | 'drop'
        | 'cashback'
        | 'gross_approval'
        | 'gross_disbursal'
        | 'abnp',
    ) => rows.reduce((a, r) => a + Number(r[k] || 0), 0);

    const totalGrossApproval = sum('gross_approval');
    const totalGrossDisbursal = sum('gross_disbursal');
    const totalDrop = sum('drop');

    return {
      logins: sum('login'),
      rejected: sum('rejected'),
      hold: sum('hold'),
      inProcess: sum('in_process'),
      approvals: sum('approval'),
      disbursal: sum('disbursal'),
      drop: totalDrop,
      cashback: sum('cashback'),
      grossApproval: totalGrossApproval,
      grossDisbursal: totalGrossDisbursal,

      abnp: Math.max(
        totalGrossApproval - totalGrossDisbursal - totalDrop,
        0,
      ),
    };
  }, [rows]);

  const starPerformers = useMemo(() => {
    if (!rows.length) return { approval: null as Row | null, disbursal: null as Row | null };

    let approval: Row | null = null;
    let disbursal: Row | null = null;

    rows.forEach((r) => {
      const approvalVal = Number(r.approval || 0);
      const disbursalVal = Number(r.disbursal || 0);

      if (!approval || approvalVal > Number(approval.approval || 0)) approval = r;
      if (!disbursal || disbursalVal > Number(disbursal.disbursal || 0)) disbursal = r;
    });

    return { approval, disbursal };
  }, [rows]);

  const managerOptions = useMemo(() => {
    const set = new Set<string>();
    rows.forEach((r) => {
      if (r.manager_tl && String(r.manager_tl).trim()) set.add(String(r.manager_tl).trim());
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
        return name.includes(debounced) || id.includes(debounced) || code.includes(debounced);
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

  // ✅ KPI modal rows based on selected KPI type (value > 0)
  const kpiModalRows = useMemo(() => {
    return rows
      .map((r) => ({ ...r, __metric: kpiMetricValue(kpiModalType, r) }))
      .filter((r: any) => Number(r.__metric || 0) > 0)
      .sort((a: any, b: any) => Number(b.__metric || 0) - Number(a.__metric || 0));
  }, [rows, kpiModalType]);

  const rowBg = (r: Row) => {
    const hasAny =
      (Number(r.login) || 0) > 0 ||
      (Number(r.approval) || 0) > 0 ||
      (Number(r.disbursal) || 0) > 0;

    return hasAny
      ? 'linear-gradient(90deg, rgba(34,197,94,0.08) 0%, transparent 100%)'
      : 'transparent';
  };

  const showStar = (value: number) => Number(value || 0) > 0;

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
                  '&:hover': { bgcolor: '#c7d2fe', transform: 'scale(1.03)' },
                  transition: 'all 0.18s ease',
                }}
              >
                <ArrowBackIcon sx={{ fontSize: 20, color: '#4338ca' }} />
              </IconButton>

              <Box>
                <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a' }}>
                  Performance Uploads
                </Typography>
                <Typography variant="body2" sx={{ color: '#64748b', mt: 0.3 }}>
                  Daily login, approval, disbursal tracking panel
                  {isFallbackDate}
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1.5 }}>
              <Button
                onClick={() => {
                  const header = [
                    'employee_id',
                    'employee_name',
                    'manager_tl',
                    'login',
                    'rejected',
                    'hold',
                    'in_process',
                    'approval',
                    'disbursal',
                    'drop',
                    'cashback',
                    'gross_approval',
                    'gross_disbursal',
                    'code',
                    '_id',
                  ];

                  const body = sortedRows.map((r) => [
                    r.employee_id || '',
                    r.employee_name || '',
                    r.manager_tl || '',
                    Number(r.login || 0),
                    Number(r.rejected || 0),
                    Number(r.hold || 0),
                    Number(r.in_process || 0),
                    Number(r.approval || 0),
                    Number(r.disbursal || 0),
                    Number(r.drop || 0),
                    Number(r.cashback || 0),
                    Number(r.gross_approval || 0),
                    Number(r.gross_disbursal || 0),
                    r.code || '',
                    r._id || '',
                  ]);

                  const csv = [header, ...body].map((r) => r.join(',')).join('\n');
                  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });

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
                    fontWeight: 700,
                    px: 3,
                    py: 1,
                    borderColor: '#cbd5f5',
                    bgcolor: '#ffffff',
                    color: '#0f172a',
                    borderWidth: 1,
                    borderStyle: 'solid',
                    transition: 'all 0.2s',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
                    '&:hover': { bgcolor: '#f1f5f9', borderColor: '#94a3b8', transform: 'translateY(-2px)' },
                  }}
              >
                Export
              </Button>
              <Button
                size="small"
                variant="contained"
                startIcon={<LoginIcon sx={{ fontSize: 18 }} />}
                onClick={() => router.push("/todaylogin")}
                sx={{
                  borderRadius: 999,
                  textTransform: "none",
                  fontWeight: 700,
                  px: 3,
                  py: 1,
                  background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
                  boxShadow: "0 8px 20px rgba(6,182,212,0.3)",
                  transition: 'all 0.2s',
                  "&:hover": { filter: 'brightness(1.1)', transform: 'translateY(-2px)', boxShadow: "0 10px 25px rgba(6,182,212,0.4)" },
                }}
              >
                Today Login
              </Button>
              {canAddRow && (
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
                    fontWeight: 700,
                    px: 3,
                    py: 1,
                    background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                    boxShadow: '0 8px 20px rgba(79,70,229,0.3)',
                    transition: 'all 0.2s',
                    '&:hover': { filter: 'brightness(1.1)', transform: 'translateY(-2px)', boxShadow: '0 10px 25px rgba(79,70,229,0.4)' },
                  }}
                >
                  Add Row
                </Button>
              )}

              {canUpload && (
                <>
                  <input
                    ref={fileRef}
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    style={{ display: 'none' }}
                    onChange={onUpload}
                  />

                  <input
                    ref={comparisonFileRef}
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    style={{ display: 'none' }}
                    onChange={onUploadComparison}
                  />

                  <Button
                    size="small"
                    variant="contained"
                    startIcon={<UploadFileIcon sx={{ fontSize: 18 }} />}
                    onClick={() => fileRef.current?.click()}
                    disabled={uploading}
                    sx={{
                      borderRadius: 999,
                      textTransform: 'none',
                      fontWeight: 700,
                      px: 3,
                      py: 1,
                      background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
                      boxShadow: '0 8px 20px rgba(234,88,12,0.3)',
                      transition: 'all 0.2s',
                      '&:hover': { filter: 'brightness(1.1)', transform: 'translateY(-2px)', boxShadow: '0 10px 25px rgba(234,88,12,0.4)' },
                    }}
                  >
                    {uploading ? 'Uploading…' : 'Upload'}
                  </Button>
                  
                  <Button
                    size="small"
                    variant="contained"
                    startIcon={<UploadFileIcon sx={{ fontSize: 18 }} />}
                    onClick={() => comparisonFileRef.current?.click()}
                    disabled={uploadingComparison}
                    sx={{
                      borderRadius: 999,
                      textTransform: 'none',
                      fontWeight: 700,
                      px: 3,
                      py: 1,
                      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                      boxShadow: '0 8px 20px rgba(16,185,129,0.3)',
                      transition: 'all 0.2s',
                      '&:hover': { filter: 'brightness(1.1)', transform: 'translateY(-2px)', boxShadow: '0 10px 25px rgba(16,185,129,0.4)' },
                    }}
                  >
                    {uploadingComparison ? 'Uploading…' : 'Upload Comparison'}
                  </Button>

                  {comparisonData.length > 0 && (
                    <Button
                      size="small"
                      variant="contained"
                      startIcon={<VisibilityIcon sx={{ fontSize: 18 }} />}
                      onClick={() => setComparisonModalOpen(true)}
                      sx={{
                        borderRadius: 999,
                        textTransform: 'none',
                        fontWeight: 700,
                        px: 3,
                        py: 1,
                        background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
                        boxShadow: '0 8px 20px rgba(139,92,246,0.3)',
                        transition: 'all 0.2s',
                        '&:hover': { filter: 'brightness(1.1)', transform: 'translateY(-2px)', boxShadow: '0 10px 25px rgba(139,92,246,0.4)' },
                      }}
                    >
                      View Comparison
                    </Button>
                  )}
                </>
              )}
              {canDeleteAll && (
                <Button
                  size="small"
                  variant="contained"
                  startIcon={<DeleteIcon sx={{ fontSize: 18 }} />}
                  onClick={onDeleteByDate}
                  sx={{
                    borderRadius: 999,
                    textTransform: 'none',
                    fontWeight: 700,
                    px: 3,
                    py: 1,
                    background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                    boxShadow: '0 8px 20px rgba(220,38,38,0.3)',
                    transition: 'all 0.2s',
                    '&:hover': { filter: 'brightness(1.1)', transform: 'translateY(-2px)', boxShadow: '0 10px 25px rgba(220,38,38,0.4)' },
                  }}
                >
                  Delete(datewise)
                </Button>
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
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" sx={{ color: '#64748b', ml: 1 }} />
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
                        '&:hover': { bgcolor: 'transparent !important', color: '#1e293b' },
                        '& .MuiTouchRipple-root': { display: 'none' },
                      }}
                    >
                      <CloseIcon sx={{ fontSize: 14 }} />
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
              sx={{ minWidth: 160, '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
              InputLabelProps={{ shrink: true }}
            />

            <TextField
              select
              size="small"
              label="Filter by Manager/TL"
              value={managerTlFilter}
              onChange={(e) => setManagerTlFilter(e.target.value)}
              sx={{ minWidth: 220, '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
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
                    <span>
                      {item.code} - {item.name}
                    </span>
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

          <Grid item xs={12} sm={6} md={4} lg={3}>
            <KpiCard
              title="Total Logins"
              value={totals.logins.toLocaleString('en-IN')}
              leftIcon={<CheckCircleIcon sx={{ fontSize: 22 }} />}
              bg="linear-gradient(135deg, #fb923c 0%, #f97316 100%)"
              subColor="#ffedd5"
              onView={() => openKpiModal('logins')}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4} lg={3}>
            <KpiCard
              title="In Process"
              value={totals.inProcess.toLocaleString('en-IN')}
              leftIcon={<span style={{ fontSize: 18 }}>⟳</span>}
              bg="linear-gradient(135deg, #6366f1 0%, #4338ca 100%)"
              subColor="#e0e7ff"
              onView={() => openKpiModal('inProcess')}
            />
          </Grid>


          <Grid item xs={12} sm={6} md={4} lg={3}>
            <KpiCard
              title="Total Gross Approval"
              value={rupee(totals.grossApproval)}
              leftIcon={<span style={{ fontSize: 18 }}>₹</span>}
              bg="linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)"
              subColor="rgba(255,255,255,0.85)"
              onView={() => openKpiModal('grossApproval')}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={4} lg={3}>
            <KpiCard
              title="Total Net Approval"
              value={rupee(totals.approvals)}
              leftIcon={<EmojiEventsIcon sx={{ fontSize: 22 }} />}
              bg="linear-gradient(135deg, #facc15 0%, #eab308 100%)"
              subColor="#fef3c7"
              onView={() => openKpiModal('netApproval')}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={4} lg={3}>
            <KpiCard
              title="Total Gross Disbursal"
              value={rupee(totals.grossDisbursal)}
              leftIcon={<span style={{ fontSize: 18 }}>₹</span>}
              bg="linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)"
              subColor="rgba(255,255,255,0.85)"
              onView={() => openKpiModal('grossDisbursal')}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={4} lg={3}>
            <KpiCard
              title="Total Net Disbursal"
              value={rupee(totals.disbursal)}
              leftIcon={<StarBorderIconLike />}
              bg="linear-gradient(135deg, #22c55e 0%, #16a34a 100%)"
              subColor="#dcfce7"
              onView={() => openKpiModal('netDisbursal')}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={4} lg={3}>
            <KpiCard
              title="Total ABND"
              value={rupee(totals.abnp)}
              leftIcon={<span style={{ fontSize: 16 }}>Δ</span>}
              bg="linear-gradient(135deg, #0f172a 0%, #334155 100%)"
              subColor="rgba(255,255,255,0.85)"
              onView={() => openKpiModal('abnd')}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={4} lg={3}>
            <KpiCard
              title="Total Drop"
              value={rupee(totals.drop)}
              leftIcon={<span style={{ fontSize: 18 }}>↓</span>}
              bg="linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)"
              subColor="#fee2e2"
              onView={() => openKpiModal('drop')}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={4} lg={3}>
            <KpiCard
              title="Total Cashback"
              value={rupee(totals.cashback)}
              leftIcon={<span style={{ fontSize: 18 }}>₹</span>}
              bg="linear-gradient(135deg, #06b6d4 0%, #0e7490 100%)"
              subColor="#cffafe"
              onView={() => openKpiModal('cashback')}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={4} lg={3}>
            <KpiCard
              title="Total Hold"
              value={totals.hold.toLocaleString('en-IN')}
              leftIcon={<span style={{ fontSize: 18 }}>⏸</span>}
              bg="linear-gradient(135deg, #f59e0b 0%, #d97706 100%)"
              subColor="#fef3c7"
              onView={() => openKpiModal('hold')}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={4} lg={3}>
            <KpiCard
              title="Total Rejected"
              value={totals.rejected.toLocaleString('en-IN')}
              leftIcon={<span style={{ fontSize: 18 }}>✕</span>}
              bg="linear-gradient(135deg, #dc2626 0%, #991b1b 100%)"
              subColor="#fee2e2"
              onView={() => openKpiModal('rejected')}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4} lg={3}>
            <KpiCard
              title="Today Login"
              // value={totals.logins.toLocaleString('en-IN')}
              leftIcon={<span style={{ fontSize: 18 }}>✓</span>}
              bg="linear-gradient(135deg, #22c55e 0%, #16a34a 100%)"
              subColor="#dcfce7"
              onView={() => router.push("/todaylogin ")}
            />
          </Grid>

        </Grid>

        {/* STAR PERFORMERS */}
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
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
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
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        <EmojiEventsIcon sx={{ fontSize: 20, color: '#15803d' }} />
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#166534' }}>
                          Top Approval
                        </Typography>
                      </Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#022c22' }}>
                        {starPerformers.approval.employee_name || '-'}
                      </Typography>
                      <Typography variant="h5" sx={{ fontWeight: 800, mt: 0.5, color: '#16a34a' }}>
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
                      background: 'linear-gradient(135deg, #eef2ff 0%, #c7d2fe 50%, #e0e7ff 100%)',
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
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        <StarBorderIconLike />
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#3730a3' }}>
                          Top Disbursal
                        </Typography>
                      </Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#020617' }}>
                        {starPerformers.disbursal.employee_name || '-'}
                      </Typography>
                      <Typography variant="h5" sx={{ fontWeight: 800, mt: 0.5, color: '#4f46e5' }}>
                        {rupee(Number(starPerformers.disbursal.disbursal || 0))}
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
                {search ? `No results for “${search}”` : 'No data available for selected date'}
              </Typography>
            </Box>
          ) : (
            <TableContainer>
              <Table size="large">
                <TableHead>
                  <TableRow sx={{ background: 'linear-gradient(90deg, #1e293b 0%, #334155 100%)' }}>
                    <TableCell sx={{ fontWeight: 800, color: 'white' }}>S.No.</TableCell>
                    <TableCell sx={{ fontWeight: 800, color: 'white' }}>Date</TableCell>
                    <TableCell sx={{ fontWeight: 800, color: 'white' }}>Employee</TableCell>
                    <TableCell sx={{ fontWeight: 800, color: 'white' }}>Code</TableCell>
                    <TableCell sx={{ fontWeight: 800, color: 'white' }}>Manager / TL</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 800, color: 'white' }}>
                      Logins
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 800, color: '#fca5a5' }}>
                      Rejected
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 800, color: '#fcd34d' }}>
                      Hold
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 800, color: 'white' }}>
                      Approvals (₹)
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 800, color: 'white' }}>
                      Disbursal (₹)
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 800, color: '#fca5a5' }}>
                      Drop (₹)
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 800, color: '#67e8f9' }}>
                      Cashback (₹)
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 800, color: 'white' }}>
                      Gross Approval (₹)
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 800, color: 'white' }}>
                      Gross Disbursal (₹)
                    </TableCell>
                    <TableCell align="center" sx={{ fontWeight: 800, color: 'white' }}>
                      Team Total
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 800, color: 'white' }}>
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
                          <Typography
                            variant="body2"
                            sx={{
                              color: '#4b5563',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              maxWidth: { xs: '90px', sm: '110px', md: '120px' }
                            }}
                          >
                            {r.date ? dayjs(r.date).format('DD-MM-YYYY') : '—'}
                          </Typography>
                        </TableCell>

                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography
                              sx={{
                                fontWeight: 600,
                                color: '#6b21a8',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                maxWidth: '180px' // width adjust kar sakte ho
                              }}
                            >
                              {r.employee_name || '-'}
                            </Typography>

                            {showStar(Number(r.drop || 0)) && (
                              <Tooltip title={`Drop Amount: ${rupee(Number(r.drop || 0))}`} arrow>
                                <span style={{ color: '#E11D48', fontSize: 16, cursor: 'pointer' }}>
                                  ★
                                </span>
                              </Tooltip>
                            )}

                            {showStar(Number(r.cashback || 0)) && (
                              <Tooltip title={`Cashback Amount: ${rupee(Number(r.cashback || 0))}`} arrow>
                                <span style={{ color: '#1D4ED8', fontSize: 16, cursor: 'pointer' }}>
                                  #
                                </span>
                              </Tooltip>
                            )}

                            {/* {teamInfo && (
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
                            )} */}
                          </Box>

                          {r.employee_id && (
                            <Typography variant="caption" sx={{ color: '#6b7280' }}>
                              {r.employee_id}
                            </Typography>
                          )}
                        </TableCell>

                        <TableCell>
                          <Typography
                            variant="body2"
                            sx={{
                              color: '#4b5563',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              maxWidth: '120px' // adjust as needed
                            }}
                          >
                            {r.code || '—'}
                          </Typography>
                        </TableCell>

                        <TableCell>
                          {r.manager_tl ? (
                            <Chip
                              size="small"
                              label={r.manager_tl}
                              sx={{ bgcolor: '#F3E8FF', fontWeight: 600, color: '#6b21a8' }}
                            />
                          ) : (
                            <Typography variant="caption" color="text.secondary">
                              —
                            </Typography>
                          )}
                        </TableCell>

                        <TableCell align="right">
                          <Chip
                            size="small"
                            label={Number(r.login || 0)}
                            sx={{ bgcolor: '#DCFCE7', fontWeight: 800, color: '#166534' }}
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Chip
                            size="small"
                            label={Number(r.rejected || 0)}
                            sx={{ bgcolor: '#FEE2E2', fontWeight: 800, color: '#B91C1C' }}
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Chip
                            size="small"
                            label={Number(r.hold || 0)}
                            sx={{ bgcolor: '#CFFAFE', fontWeight: 800, color: '#0E7490' }}
                          />
                        </TableCell>

                        <TableCell align="right">
                          <Chip
                            size="small"
                            label={rupee(Number(r.approval || 0))}
                            sx={{ bgcolor: '#E0F2FE', fontWeight: 800, color: '#1d4ed8' }}
                          />
                        </TableCell>

                        <TableCell align="right">
                          <Chip
                            size="small"
                            label={rupee(Number(r.disbursal || 0))}
                            sx={{ bgcolor: '#EDE9FE', fontWeight: 800, color: '#6d28d9' }}
                          />
                        </TableCell>

                        <TableCell align="right">
                          <Chip
                            size="small"
                            label={rupee(Number(r.drop || r.drop_amount || 0))}
                            sx={{ bgcolor: '#FFE4E6', fontWeight: 800, color: '#BE123C' }}
                          />
                        </TableCell>

                        <TableCell align="right">
                          <Chip
                            size="small"
                            label={rupee(Number(r.cashback || r.cashback_amount || 0))}
                            sx={{ bgcolor: '#CFFAFE', fontWeight: 800, color: '#0E7490' }}
                          />
                        </TableCell>

                        <TableCell align="right">
                          <Chip
                            size="small"
                            label={rupee(Number(r.gross_approval || 0))}
                            sx={{ bgcolor: '#DBEAFE', fontWeight: 800, color: '#1d4ed8' }}
                          />
                        </TableCell>

                        <TableCell align="right">
                          <Chip
                            size="small"
                            label={rupee(Number(r.gross_disbursal || 0))}
                            sx={{ bgcolor: '#EDE9FE', fontWeight: 800, color: '#6d28d9' }}
                          />
                        </TableCell>

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

                              <Tooltip title="View Team Breakdown">
                                <IconButton
                                  size="small"
                                  onClick={() => fetchTeamBreakdown(r.code!)}
                                  sx={{ bgcolor: '#EEF2FF', '&:hover': { bgcolor: '#C7D2FE' } }}
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
                                      total_logins: String(r.login ?? r.total_logins ?? 0 || ''),
                                      total_hold: String(r.hold ?? r.total_hold ?? 0 || ''),
                                      total_rejected: String(r.total_rejected ?? r.rejected ?? 0),

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
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>

        {/* ✅ ONE KPI VIEW MODAL (for ALL boxes) */}
        <Dialog
          open={kpiModalOpen}
          onClose={() => setKpiModalOpen(false)}
          fullWidth
          maxWidth="lg"
          PaperProps={{
            sx: { borderRadius: 3, boxShadow: '0 25px 60px rgba(15,23,42,0.35)' },
          }}
        >
          <DialogTitle sx={{ fontWeight: 900, display: 'flex', alignItems: 'center', gap: 1 }}>
            <VisibilityIcon sx={{ color: '#0E7490' }} />
            {kpiTitle(kpiModalType)} ({kpiModalRows.length})
          </DialogTitle>

          <DialogContent dividers sx={{ pt: 2.5, pb: 2.5 }}>
            {kpiModalRows.length === 0 ? (
              <Box sx={{ textAlign: 'center', p: 3, bgcolor: '#F8FAFC', borderRadius: 2 }}>
                <Typography color="text.secondary">No records found for this KPI.</Typography>
              </Box>
            ) : (
              <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: '#F1F5F9' }}>
                      <TableCell sx={{ fontWeight: 800 }}>S.No.</TableCell>
                      <TableCell sx={{ fontWeight: 800 }}>Date</TableCell>
                      <TableCell sx={{ fontWeight: 800 }}>Employee</TableCell>
                      <TableCell sx={{ fontWeight: 800 }}>Code</TableCell>
                      <TableCell sx={{ fontWeight: 800 }}>Manager / TL</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 900, color: '#0E7490' }}>
                        Value
                      </TableCell>
                    </TableRow>
                  </TableHead>

                  <TableBody>
                    {kpiModalRows.map((r: any, idx: number) => (
                      <TableRow key={r._id} sx={{ '&:hover': { bgcolor: '#F8FAFC' } }}>
                        <TableCell>
                          <Typography sx={{ fontWeight: 800 }}>{idx + 1}</Typography>
                        </TableCell>

                        <TableCell>
                          <Typography variant="body2" sx={{ color: '#4b5563' }}>
                            {r.date ? dayjs(r.date).format('DD-MM-YYYY') : '—'}
                          </Typography>
                        </TableCell>

                        <TableCell>
                          <Typography sx={{ fontWeight: 800, color: '#1E293B' }}>
                            {r.employee_name || '-'}
                          </Typography>
                          {r.employee_id && (
                            <Typography variant="caption" sx={{ color: '#64748B' }}>
                              {r.employee_id}
                            </Typography>
                          )}
                        </TableCell>

                        <TableCell>
                          <Typography variant="body2" sx={{ color: '#64748B' }}>
                            {r.code || '—'}
                          </Typography>
                        </TableCell>

                        <TableCell>
                          {r.manager_tl ? (
                            <Chip
                              size="small"
                              label={r.manager_tl}
                              sx={{ bgcolor: '#F3E8FF', fontWeight: 700, color: '#6b21a8' }}
                            />
                          ) : (
                            <Typography variant="caption" color="text.secondary">
                              —
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell align="right">
                          {['logins', 'rejected', 'hold', 'inProcess'].includes(kpiModalType) ? (
                            <Chip
                              size="small"
                              label={Number(r.__metric || 0).toLocaleString('en-IN')}
                              sx={{ bgcolor: '#DCFCE7', color: '#166534', fontWeight: 900 }}
                            />
                          ) : (
                            <Chip
                              size="small"
                              label={rupee(Number(r.__metric || 0))}
                              sx={{ bgcolor: '#CFFAFE', color: '#0E7490', fontWeight: 900 }}
                            />
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </DialogContent>

          <DialogActions sx={{ px: 3, py: 2 }}>
            <Button onClick={() => setKpiModalOpen(false)}>Close</Button>
          </DialogActions>
        </Dialog>

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
                <Typography variant="body2" sx={{ mt: 1 }}>
                  Loading team data...
                </Typography>
              </Box>
            ) : teamBreakdown ? (
              <Box>
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
                        label={
                          teamBreakdown.role === 'manager'
                            ? 'Manager'
                            : teamBreakdown.role === 'team_leader'
                              ? 'Team Leader'
                              : 'Employee'
                        }
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
                          <Typography variant="body2" sx={{ color: '#64748B' }}>
                            Team
                          </Typography>
                          <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#4F46E5' }}>
                            {teamBreakdown.team.name}
                          </Typography>
                        </Box>
                      )}
                    </Grid>
                  </Grid>
                </Paper>

                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid item xs={6} md={3}>
                    <Paper sx={{ p: 2, textAlign: 'center', bgcolor: '#DCFCE7', borderRadius: 2 }}>
                      <Typography variant="caption" sx={{ color: '#166534', fontWeight: 600 }}>
                        Team Members
                      </Typography>
                      <Typography variant="h5" sx={{ fontWeight: 800, color: '#166534' }}>
                        {teamBreakdown.totals.memberCount}
                      </Typography>
                    </Paper>
                  </Grid>

                  <Grid item xs={6} md={3}>
                    <Paper sx={{ p: 2, textAlign: 'center', bgcolor: '#E0F2FE', borderRadius: 2 }}>
                      <Typography variant="caption" sx={{ color: '#1E40AF', fontWeight: 600 }}>
                        Total Logins
                      </Typography>
                      <Typography variant="h5" sx={{ fontWeight: 800, color: '#1E40AF' }}>
                        {teamBreakdown.totals.totalLogins.toLocaleString('en-IN')}
                      </Typography>
                    </Paper>
                  </Grid>

                  <Grid item xs={6} md={3}>
                    <Paper sx={{ p: 2, textAlign: 'center', bgcolor: '#EDE9FE', borderRadius: 2 }}>
                      <Typography variant="caption" sx={{ color: '#6D28D9', fontWeight: 600 }}>
                        Total Approval
                      </Typography>
                      <Typography variant="h5" sx={{ fontWeight: 800, color: '#6D28D9' }}>
                        {rupee(teamBreakdown.totals.totalApproval)}
                      </Typography>
                    </Paper>
                  </Grid>

                  <Grid item xs={6} md={3}>
                    <Paper sx={{ p: 2, textAlign: 'center', bgcolor: '#DCFCE7', borderRadius: 2 }}>
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
                  <Grid item xs={6} md={3}>
                    <Paper sx={{ p: 2, textAlign: 'center', bgcolor: '#EDE9FE', borderRadius: 2 }}>
                      <Typography variant="caption" sx={{ color: '#6D28D9', fontWeight: 600 }}>
                        Total Hold
                      </Typography>
                      <Typography variant="h5" sx={{ fontWeight: 800, color: '#6D28D9' }}>
                        {(teamBreakdown.totals.totalHold || 0)}
                      </Typography>

                    </Paper>
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <Paper sx={{ p: 2, textAlign: 'center', bgcolor: '#EDE9FE', borderRadius: 2 }}>
                      <Typography variant="caption" sx={{ color: '#6D28D9', fontWeight: 600 }}>
                        Total Reject
                      </Typography>
                      <Typography variant="h5" sx={{ fontWeight: 800, color: '#6D28D9' }}>
                        {(teamBreakdown.totals.totalRejected || 0)}
                      </Typography>

                    </Paper>
                  </Grid>
                </Grid>

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
                          <TableCell align="right" sx={{ fontWeight: 700 }}>
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
                          <TableCell align="right" sx={{ fontWeight: 800 }}>
                            Rejected                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: 800 }}>
                            Hold                          </TableCell>
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
                            <TableCell align="right">
                              <Chip
                                size="small"
                                label={Number(member.rejected || 0).toLocaleString('en-IN')}
                                sx={{ bgcolor: '#FEE2E2', color: '#B91C1C', fontWeight: 800 }}
                              />
                            </TableCell>

                            <TableCell align="right">
                              <Chip
                                size="small"
                                label={Number(member.hold || 0).toLocaleString('en-IN')}
                                sx={{ bgcolor: '#FEF3C7', color: '#92400E', fontWeight: 800 }}
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
          <DialogTitle sx={{ 
            fontWeight: 800, 
            background: 'linear-gradient(90deg, #4f46e5 0%, #6366f1 100%)', 
            color: 'white' 
          }}>
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
                    <TextField {...params} label="Manager / TL" fullWidth size="medium" required />
                  )}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  label="Total Logins"
                  type="number"
                  value={form.total_logins}
                  onChange={handleFormChange('total_logins')}
                  fullWidth
                  size="medium"
                />
              </Grid>



              {/* Approval */}
              <Grid item xs={12} md={4}>
                <TextField
                  label={amountUnit === 'rupees' ? 'Approval (₹ in Rupees)' : 'Approval (₹ in Lakhs)'}
                  type="text"
                  value={form.approval_lakh ?? ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    const isAllowed = /^[0-9,]*$/.test(val) || val === '';
                    if (!isAllowed) return;
                    setForm((prev) => ({ ...prev, approval_lakh: val }));
                  }}
                  onBlur={() => {
                    const raw = (form.approval_lakh || '').replace(/,/g, '');
                    if (raw === '' || isNaN(Number(raw))) return;
                    setForm((prev) => ({ ...prev, approval_lakh: Number(raw).toLocaleString('en-IN') }));
                  }}
                  fullWidth
                  size="medium"
                />
              </Grid>

              {/* Disbursal */}
              <Grid item xs={12} md={4}>
                <TextField
                  label={amountUnit === 'rupees' ? 'Disbursal (₹ in Rupees)' : 'Disbursal (₹ in Lakhs)'}
                  type="text"
                  value={form.disbursal_lakh ?? ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    const isAllowed = /^[0-9,]*$/.test(val) || val === '';
                    if (!isAllowed) return;
                    setForm((prev) => ({ ...prev, disbursal_lakh: val }));
                  }}
                  onBlur={() => {
                    const raw = (form.disbursal_lakh || '').replace(/,/g, '');
                    if (raw === '' || isNaN(Number(raw))) return;
                    setForm((prev) => ({ ...prev, disbursal_lakh: Number(raw).toLocaleString('en-IN') }));
                  }}
                  fullWidth
                  size="medium"
                />
              </Grid>


              {/* Drop */}
              <Grid item xs={12} md={4}>
                <TextField
                  label={amountUnit === 'rupees' ? 'Drop Amount (₹ in Rupees)' : 'Drop Amount (₹ in Lakhs)'}
                  type="text"
                  value={form.drop_lakh ?? ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (/^[0-9,]*$/.test(val) || val === '') setForm((prev) => ({ ...prev, drop_lakh: val }));
                  }}
                  onBlur={() => {
                    const raw = (form.drop_lakh || '').replace(/,/g, '');
                    if (raw !== '' && !isNaN(Number(raw))) {
                      setForm((prev) => ({ ...prev, drop_lakh: Number(raw).toLocaleString('en-IN') }));
                    }
                  }}
                  fullWidth
                  size="medium"
                />
              </Grid>

              {/* Cashback */}
              <Grid item xs={12} md={4}>
                <TextField
                  label={amountUnit === 'rupees' ? 'Cashback Amount (₹ in Rupees)' : 'Cashback Amount (₹ in Lakhs)'}
                  type="text"
                  value={form.cashback_lakh ?? ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (/^[0-9,]*$/.test(val) || val === '') setForm((prev) => ({ ...prev, cashback_lakh: val }));
                  }}
                  onBlur={() => {
                    const raw = (form.cashback_lakh || '').replace(/,/g, '');
                    if (raw !== '' && !isNaN(Number(raw))) {
                      setForm((prev) => ({ ...prev, cashback_lakh: Number(raw).toLocaleString('en-IN') }));
                    }
                  }}
                  fullWidth
                  size="medium"
                />
              </Grid>
              {/* Hold */}
              <Grid item xs={12} md={4}>
                <TextField
                  label="Total Hold"
                  type="number"
                  value={form.total_hold}
                  onChange={handleFormChange('total_hold')}
                  fullWidth
                  size="medium"
                />
              </Grid>

              {/* Rejected */}
              <Grid item xs={12} md={4}>
                <TextField
                  label="Total Rejected"
                  type="number"
                  value={form.total_rejected}
                  onChange={handleFormChange('total_rejected')}
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
              sx={{ color: '#64748b', fontWeight: 600, borderRadius: 999, '&:hover': { bgcolor: '#f1f5f9' } }}
            >
              Cancel
            </Button>
            <Button 
              variant="contained" 
              onClick={onFormSubmit} 
              disabled={formSaving}
              sx={{
                borderRadius: 999,
                textTransform: 'none',
                fontWeight: 700,
                px: 3,
                background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)',
                boxShadow: '0 8px 20px rgba(79,70,229,0.3)',
                '&:hover': { filter: 'brightness(1.1)', boxShadow: '0 10px 25px rgba(79,70,229,0.4)' }
              }}
            >
              {formSaving ? 'Saving…' : editingId ? 'Update Row' : 'Save Row'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Comparison Data Modal */}
        <Dialog 
          open={comparisonModalOpen} 
          onClose={() => setComparisonModalOpen(false)} 
          maxWidth="xl" 
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 4,
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              overflow: 'hidden',
              bgcolor: '#f8fafc'
            }
          }}
        >
          <DialogTitle sx={{ 
            fontWeight: 800, 
            background: 'linear-gradient(90deg, #1e293b 0%, #334155 100%)', 
            color: 'white',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            p: 3
          }}>
            Comparison Data Preview
            <IconButton onClick={() => setComparisonModalOpen(false)} sx={{ color: 'white' }}>
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent dividers sx={{ p: 0, bgcolor: 'white' }}>
            {comparisonData.length > 0 ? (
              <TableContainer sx={{ 
                maxHeight: '70vh',
                '&::-webkit-scrollbar': { width: 8, height: 8 },
                '&::-webkit-scrollbar-track': { backgroundColor: '#f1f5f9' },
                '&::-webkit-scrollbar-thumb': { backgroundColor: '#cbd5e1', borderRadius: 8 },
              }}>
                <Table stickyHeader size="small">
                  <TableBody>
                    {comparisonData.map((row, rowIndex) => (
                      <TableRow 
                        key={rowIndex}
                        sx={{
                          '&:hover': rowIndex >= 2 ? { bgcolor: '#f0f9ff' } : {},
                          transition: 'background-color 0.2s ease',
                        }}
                      >
                        {row.map((cell, colIndex) => {
                          const isHeader = rowIndex < 2;
                          // Optional: highlight comparison columns with a subtle tint
                          const isAltColumn = colIndex % 2 !== 0 && !isHeader; 
                          
                          return (
                            <TableCell 
                              key={colIndex} 
                              sx={{ 
                                fontWeight: isHeader ? 700 : 500,
                                fontSize: isHeader ? '0.85rem' : '0.8rem',
                                color: isHeader ? '#0f172a' : '#334155',
                                bgcolor: isHeader 
                                  ? rowIndex === 0 ? '#e2e8f0' : '#f1f5f9' 
                                  : isAltColumn ? '#fafafa' : 'inherit',
                                borderBottom: '1px solid #e2e8f0',
                                borderRight: '1px solid #f1f5f9', // Cell borders for clarity in dense data
                                whiteSpace: 'nowrap',
                                p: isHeader ? 1.5 : 1
                              }}
                            >
                              {cell !== null && cell !== undefined ? String(cell) : ''}
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Box sx={{ p: 5, textAlign: 'center' }}>
                <Typography variant="h6" color="text.secondary">No comparison data available.</Typography>
                <Typography variant="body2" color="text.disabled">Please upload a valid comparison CSV/Excel file.</Typography>
              </Box>
            )}
          </DialogContent>
        </Dialog>
      </Box>
    </Box>
  );
}

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
      <span style={{ fontSize: 14, lineHeight: 1 }}>★</span>
    </Box>
  );
}
