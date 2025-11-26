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
  approval?: number; // in Rupees
  disbursal?: number;
  code?: string;
  [k: string]: any;
};

type SortKey = 'login' | 'approval' | 'disbursal' | null;
type SortDirection = 'asc' | 'desc';

type SortConfig = {
  key: SortKey;
  direction: SortDirection;
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

  // search (with debounce)
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');

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
    code: '',
  });

 
  const [amountUnit, setAmountUnit] = useState<'rupees' | 'lakhs'>('rupees');


  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: null,
    direction: 'asc',
  });

  useEffect(() => {
    const t = setTimeout(
      () => setDebounced(search.trim().toLowerCase()),
      300,
    );

    return () => clearTimeout(t);
  }, [search]);
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


  const fetchList = async () => {
    try {
      setLoading(true);

      const company_id =
        localStorage.getItem('company_id') ||
        JSON.parse(localStorage.getItem('user') || '{}')?.company_id ||
        '';

      const res = await api.get('/performance-upload/get-performance', {
        params: { company_id },
      });

      const raw: any[] = Array.isArray(res.data)
        ? res.data
        : res.data?.data || [];

      const normalized: Row[] = raw.map((r) => ({
        ...r,
        login: Number(r.login ?? r.total_logins ?? 0),
        approval: Number(r.approval ?? r.approval_amount ?? 0),
        disbursal: Number(r.disbursal ?? r.disbursal_amount ?? 0),
        code:
          typeof r.code === 'string'
            ? r.code.trim()
            : (r.code ?? '').toString().trim(),
      }));

      setRows(normalized);
    } catch (e) {
      console.error(e);
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (dateStr) fetchList();
  
  }, [dateStr]);

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

      const multiplier = amountUnit === 'lakhs' ? 100000 : 1;

      const payload = {
        date: dateStr,
        employee_name: form.employee_name.trim(),
        code: form.code?.trim() || undefined,
        manager_tl: form.manager_tl.trim(),
        total_logins: Number(form.total_logins || 0),
        approval_amount: Math.round(approvalNumber * multiplier),
        disbursal_amount: Math.round(disbursalNumber * multiplier),
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
    const sum = (k: 'login' | 'approval' | 'disbursal') =>
      rows.reduce((a, r) => a + Number(r[k] || 0), 0);

    return {
      logins: sum('login'),
      approvals: sum('approval'),
      disbursal: sum('disbursal'),
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
    if (!debounced) return rows;

    return rows.filter((r) => {
      const name = (r.employee_name || '').toLowerCase();
      const id = (r.employee_id || '').toLowerCase();
      const code = (r.code || '').toLowerCase();

      return (
        name.includes(debounced) || id.includes(debounced) || code.includes(debounced)
      );
    });
  }, [rows, debounced]);


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

              {isAdmin && (
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
                      '&:hover': {
                        bgcolor: '#ea580c',
                      },
                    }}
                  >
                    {uploading ? 'Uploading…' : 'Upload'}
                  </Button>
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
        
          <Grid item xs={12} md={4}>
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
                    <CheckCircleIcon sx={{ fontSize: 22 }} />
                  </Box>
                  <TrendingUpIcon sx={{ opacity: 0.8, fontSize: 20 }} />
                </Box>
                <Typography
                  variant="body2"
                  sx={{ color: '#dcfce7', fontWeight: 500, mb: 0.3 }}
                >
                  Total Logins
                </Typography>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 800,
                    fontSize: 25,
                    lineHeight: 1.2,
                    color: '#fff',
                  }}
                >
                  {totals.logins.toLocaleString('en-IN')}
                </Typography>
              </Box>
            </Paper>
          </Grid>

   
          <Grid item xs={12} md={4}>
            <Paper
              sx={{
                p: 2.1,
                borderRadius: 2.5,
                color: '#ffffff',
                position: 'relative',
                overflow: 'hidden',
                background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                boxShadow: '0 10px 22px rgba(37,99,235,0.35)',
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
                  sx={{ color: '#dbeafe', fontWeight: 500, mb: 0.3 }}
                >
                  Total Approvals
                </Typography>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 800,
                    fontSize: 25,
                    lineHeight: 1.2,
                    color: '#fff',
                  }}
                >
                  {rupee(totals.approvals)}
                </Typography>
              </Box>
            </Paper>
          </Grid>

          <Grid item xs={12} md={4}>
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
                    <StarBorderIconLike />
                  </Box>
                  <TrendingUpIcon sx={{ opacity: 0.8, fontSize: 20 }} />
                </Box>
                <Typography
                  variant="body2"
                  sx={{ color: '#ede9fe', fontWeight: 500, mb: 0.3 }}
                >
                  Total Disbursals
                </Typography>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 800,
                    fontSize: 25,
                    lineHeight: 1.2,
                    color: '#fff',
                  }}
                >
                  {rupee(totals.disbursal)}
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
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {sortedRows.map((r) => (
                    <TableRow key={r._id} sx={{ background: rowBg(r) }}>
                      <TableCell>
                        <Typography
                          sx={{ fontWeight: 700, color: '#6b21a8' }}
                        >
                          {r.employee_name || '-'}
                        </Typography>
                        {r.employee_id && (
                          <Typography
                            variant="caption"
                            sx={{ color: '#6b7280' }}
                          >
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
                        {isAdmin ? (
                          <Stack
                            direction="row"
                            spacing={0.5}
                            justifyContent="flex-end"
                          >
                            <Tooltip title="Edit row">
                              <IconButton
                                color="primary"
                                size="small"
                                onClick={() => {
                                  setEditingId(r._id);

                                  if (r.date) {
                                    setDate(dayjs(r.date));
                                  }

                                  setForm({
                                    employee_name: r.employee_name || '',
                                    manager_tl: r.manager_tl || '',
                                    total_logins: String(
                                      r.login ?? r.total_logins ?? 0 || '',
                                    ),
                                    approval_lakh: r.approval
                                      ? Number(
                                          r.approval,
                                        ).toLocaleString('en-IN')
                                      : '',
                                    disbursal_lakh: r.disbursal
                                      ? Number(
                                          r.disbursal,
                                        ).toLocaleString('en-IN')
                                      : '',
                                    code: r.code || '',
                                  });
                                  setAmountUnit('rupees');
                                  setFormOpen(true);
                                }}
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete row">
                              <IconButton
                                color="error"
                                size="small"
                                onClick={() => onDelete(r._id)}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        ) : (
                          <Typography
                            variant="caption"
                            color="text.secondary"
                          >
                            —
                          </Typography>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>

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
