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
} from '@mui/material';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';

import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DownloadIcon from '@mui/icons-material/Download';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import DeleteIcon from '@mui/icons-material/Delete';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import SearchIcon from '@mui/icons-material/Search';


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
    if (token) config.headers.Authorization = `Bearer ${token}`;
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
  login?: number;
  approval?: number;
  disbursal?: number;
  [k: string]: any;
};

/* ---------------- Helpers ---------------- */
const rupee = (n: number) => `₹${Intl.NumberFormat('en-IN').format(Number(n || 0))}`;

export default function PerformanceUploadPage() {
  const router = useRouter();
  const q = useSearchParams();

  const [date, setDate] = useState<Dayjs | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);

  // 🔎 search (with debounce)
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search.trim().toLowerCase()), 300);


    return () => clearTimeout(t);
  }, [search]);

  // read default date from query
  useEffect(() => {
    const d = q?.get('date');

    setDate(d ? dayjs(d) : dayjs());
  }, [q]);

  // detect role=1 (admin)
  useEffect(() => {
    const user = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || '{}') : {};

    setIsAdmin(String(user?.role) === '1');
  }, []);

  const dateStr = (date ? date : dayjs()).format('YYYY-MM-DD');

  /* ------------ Fetch + normalize ------------ */
  const fetchList = async () => {
    try {
      setLoading(true);

      const company_id =
        localStorage.getItem('company_id') ||
        JSON.parse(localStorage.getItem('user') || '{}')?.company_id ||
        '';

      const res = await api.get('/performance-upload/get-performance', {
        params: { date: dateStr, company_id },
      });

      const raw: any[] = Array.isArray(res.data) ? res.data : (res.data?.data || []);

      // Normalize legacy keys to UI keys
      const normalized: Row[] = raw.map((r) => ({
        ...r,
        login: Number(r.login ?? r.total_logins ?? 0),
        approval: Number(r.approval ?? r.approval_amount ?? 0),
        disbursal: Number(r.disbursal ?? r.disbursal_amount ?? 0),
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateStr]);

  /* ------------ Actions ------------ */
  const handlePickDate = (d: Dayjs | null) => {
    setDate(d);
    if (d) router.replace(`/performance-upload?date=${d.format('YYYY-MM-DD')}`);
  };

  const onUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file) return;

    try {
      setUploading(true);
      const formData = new FormData();

      formData.append('file', file); // controller expects "file"
      await api.post('/performance-upload/file', formData, {
        headers: { 'Content-Type': 'multipart/formdata' }, // note: many servers accept both; keep as set earlier too
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

  /* ------------ Totals (badges) ------------ */
  const totals = useMemo(() => {
    const sum = (k: 'login' | 'approval' | 'disbursal') =>
      rows.reduce((a, r) => a + Number(r[k] || 0), 0);


    return { logins: sum('login'), approvals: sum('approval'), disbursal: sum('disbursal') };
  }, [rows]);

  /* ------------ Filtered Rows by search ------------ */
  const filteredRows = useMemo(() => {
    if (!debounced) return rows;

    return rows.filter((r) => {
      const name = (r.employee_name || '').toLowerCase();
      const id = (r.employee_id || '').toLowerCase();


      return name.includes(debounced) || id.includes(debounced);
    });
  }, [rows, debounced]);

  /* ------------ Header (colorful) ------------ */
  const Header = useMemo(
    () => (
      <Paper
        elevation={0}
        sx={{
          p: 2.25,
          borderRadius: 3,
          overflow: 'hidden',
          border: '1px solid',
          borderColor: 'divider',
          color: '#fff',
          background: 'linear-gradient(135deg, #1E3368 0%, #6E8EF5 60%, #88B7FF 100%)',
          position: 'relative',
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            background:
              'radial-gradient(900px 220px at -10% -20%, rgba(255,255,255,0.18), transparent)',
          }}
        />
        <Grid container spacing={2} alignItems="center" sx={{ position: 'relative' }}>
          <Grid item xs={12} md={4}>
            <Stack direction="row" spacing={1.25} alignItems="center">
              <IconButton
                onClick={() => router.back()}
                sx={{ color: '#fff', bgcolor: 'rgba(255,255,255,.14)' }}
              >
                <ArrowBackIcon />
              </IconButton>
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 900, letterSpacing: 0.3 }}>
                  Performance Uploads
                </Typography>

              </Box>
            </Stack>
          </Grid>

          <Grid item xs={12} md={3}>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DatePicker
                label="Select Date"
                value={date}
                onChange={handlePickDate}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    size: 'small',
                    sx: {
                      '& .MuiOutlinedInput-root': {
                        bgcolor: 'rgba(255,255,255,.15)',
                        color: '#fff',
                        '& fieldset': { borderColor: 'rgba(255,255,255,.35)' },
                        '&:hover fieldset': { borderColor: '#fff' },
                      },
                      '& .MuiInputLabel-root': { color: 'rgba(255,255,255,.9)' },
                    },
                  },
                }}
              />
            </LocalizationProvider>
          </Grid>

          {/* 🔎 Search box */}
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              size="small"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by employee name or ID"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
                sx: {
                  bgcolor: 'rgba(255,255,255,.15)',
                  color: '#fff',
                  '& fieldset': { borderColor: 'rgba(255,255,255,.35)' },
                  '&:hover fieldset': { borderColor: '#fff' },
                },
              }}
              InputLabelProps={{ sx: { color: 'rgba(255,255,255,.9)' } }}
            />
          </Grid>

          <Grid item xs />
          <Grid item xs="auto">
            <Stack direction="row" spacing={1}>
              <Button
                variant="contained"
                startIcon={<DownloadIcon />}
                onClick={() => {
                  // export uses current filtered list (so it respects search)
                  const header = ['date', 'employee_id', 'employee_name', 'login', 'approval', 'disbursal', '_id'];

                  const body = filteredRows.map((r) => [
                    r.date || '',
                    r.employee_id || '',
                    r.employee_name || '',
                    Number(r.login || 0),
                    Number(r.approval || 0),
                    Number(r.disbursal || 0),
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
                sx={{ borderRadius: 2, fontWeight: 800, bgcolor: 'rgba(0,0,0,.25)' }}
              >
                Export
              </Button>

              {isAdmin && (
                <>
                  <input
                    ref={fileRef}
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    style={{ display: 'none' }}
                    onChange={onUpload}
                  />
                  <Button
                    variant="contained"
                    startIcon={<UploadFileIcon />}
                    onClick={() => fileRef.current?.click()}
                    disabled={uploading}
                    sx={{ borderRadius: 2, fontWeight: 800, bgcolor: '#FF8A00' }}
                  >
                    {uploading ? 'Uploading…' : 'Upload XLSX/CSV'}
                  </Button>
                </>
              )}
            </Stack>
          </Grid>
        </Grid>

        {/* Totals band */}
        <Stack direction="row" spacing={1} sx={{ mt: 1.5, flexWrap: 'wrap', position: 'relative' }}>
          <Chip
            icon={<CheckCircleIcon />}
            label={`Total Logins: ${totals.logins}`}
            sx={{ bgcolor: '#22C55E', color: '#fff', fontWeight: 800 }}
          />
          <Chip
            icon={<TrendingUpIcon />}
            label={`Total Approvals: ${rupee(totals.approvals)}`}
            sx={{ bgcolor: '#0EA5E9', color: '#fff', fontWeight: 800 }}
          />
          <Chip
            icon={<TrendingUpIcon />}
            label={`Total Disbursal: ${rupee(totals.disbursal)}`}
            sx={{ bgcolor: '#8B5CF6', color: '#fff', fontWeight: 800 }}
          />
        </Stack>
      </Paper>
    ),
    [date, isAdmin, uploading, totals, dateStr, router, search, filteredRows]
  );

  /* ------------ Row color helper ------------ */
  const rowBg = (r: Row) => {
    const hasAny = (Number(r.login) || 0) > 0 || (Number(r.approval) || 0) > 0 || (Number(r.disbursal) || 0) > 0;


    return hasAny
      ? 'linear-gradient(180deg, rgba(34,197,94,0.06) 0%, rgba(34,197,94,0.02) 100%)'
      : 'linear-gradient(180deg, #fff 0%, #fafbff 100%)';
  };

  return (
    <Box sx={{ p: 2 }}>
      {Header}

      <Box sx={{ mt: 2 }}>
        {loading ? (
          <Paper sx={{ p: 3, borderRadius: 3 }}>
            <LinearProgress />
            <Typography variant="body2" sx={{ mt: 1 }}>
              Loading…
            </Typography>
          </Paper>
        ) : filteredRows.length === 0 ? (
          <Paper
            variant="outlined"
            sx={{
              p: 4,
              borderRadius: 3,
              textAlign: 'center',
              background: 'linear-gradient(180deg,#ffffff 0%,#fafafa 100%)',
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 900, mb: 0.75 }}>
              No rows {search ? `matching “${search}”` : ''} for {dayjs(dateStr).format('DD MMM YYYY')}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {search ? 'Try a different name/ID.' : (isAdmin ? 'Upload a file or change the date.' : 'Ask admin to upload or change the date.')}
            </Typography>
          </Paper>
        ) : (
          <Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden' }}>
            <TableContainer>
              <Table size="small" sx={{ '& th': { fontWeight: 1200 } }}>
                <TableHead>
                  <TableRow sx={{ background: 'linear-gradient(180deg,#F2F6FF 0%, #E9EEFF 100%)' }}>
                    <TableCell>Employee</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell align="right">Logins</TableCell>
                    <TableCell align="right">Approvals (₹)</TableCell>
                    <TableCell align="right">Disbursal (₹)</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredRows.map((r) => (
                    <TableRow key={r._id} sx={{ background: rowBg(r) }}>
                      <TableCell>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Chip
                            size="small"
                            label={r.employee_id || '-'}
                            sx={{ bgcolor: '#EEF2FF', fontWeight: 700 }}
                          />
                          <Typography sx={{ fontWeight: 700 }}>{r.employee_name || '-'}</Typography>
                        </Stack>
                      </TableCell>
                      <TableCell>{r.date ? dayjs(r.date).format('DD MMM YYYY') : '-'}</TableCell>
                      <TableCell align="right">
                        <Chip size="small" label={Number(r.login || 0)} sx={{ bgcolor: '#DCFCE7', fontWeight: 800 }} />
                      </TableCell>
                      <TableCell align="right">
                        <Chip size="small" label={rupee(Number(r.approval || 0))} sx={{ bgcolor: '#E0F2FE', fontWeight: 800 }} />
                      </TableCell>
                      <TableCell align="right">
                        <Chip size="small" label={rupee(Number(r.disbursal || 0))} sx={{ bgcolor: '#EDE9FE', fontWeight: 800 }} />
                      </TableCell>
                      <TableCell align="right">
                        {isAdmin ? (
                          <Tooltip title="Delete row">
                            <IconButton color="error" onClick={() => onDelete(r._id)}>
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        ) : (
                          <Typography variant="caption" color="text.secondary">
                            —
                          </Typography>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        )}
      </Box>
    </Box>
  );
}
