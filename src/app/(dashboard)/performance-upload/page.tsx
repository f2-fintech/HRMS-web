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
} from '@mui/material';
import Autocomplete from '@mui/material/Autocomplete';
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
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';

/* ---------------- AXIOS ---------------- */
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:5500',
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
  manager_tl?: string;
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

  // 🔹 Manual form dialog state
  const [formOpen, setFormOpen] = useState(false);
  const [formSaving, setFormSaving] = useState(false);

  const [form, setForm] = useState({
    employee_name: '',
    manager_tl: '',
    total_logins: '',
    approval_lakh: '',
    disbursal_lakh: '',
  });

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
    const user =
      typeof window !== 'undefined'
        ? JSON.parse(localStorage.getItem('user') || '{}')
        : {};

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

      const raw: any[] = Array.isArray(res.data) ? res.data : res.data?.data || [];

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

  /* ------------ Manual form handlers ------------ */
  const handleFormChange =
    (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
    };

  const resetForm = () => {
    setForm({
      employee_name: '',
      manager_tl: '',
      total_logins: '',
      approval_lakh: '',
      disbursal_lakh: '',
    });
  };

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

      const payload = [
        {
          date: dateStr,
          employee_name: form.employee_name.trim(),
          manager_tl: form.manager_tl.trim(),
          total_logins: Number(form.total_logins || 0),

          // lakh -> rupees
          approval_amount: Math.round(Number(form.approval_lakh || 0) * 100000),
          disbursal_amount: Math.round(Number(form.disbursal_lakh || 0) * 100000),
          company_id: company_id || undefined,
        },
      ];

      await api.post('/performance-upload/rows', payload);
      alert('Row saved successfully.');
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

  /* ------------ Totals (badges) ------------ */
  const totals = useMemo(() => {
    const sum = (k: 'login' | 'approval' | 'disbursal') =>
      rows.reduce((a, r) => a + Number(r[k] || 0), 0);

    return { logins: sum('login'), approvals: sum('approval'), disbursal: sum('disbursal') };
  }, [rows]);

  /* ------------ Star performers (max approval / disbursal) ------------ */
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

  /* ------------ Manager dropdown options (for manual form) ------------ */
  const managerOptions = useMemo(() => {
    const set = new Set<string>();

    rows.forEach((r) => {
      if (r.manager_tl && String(r.manager_tl).trim()) {
        set.add(String(r.manager_tl).trim());
      }
    });

    return Array.from(set);
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
          p: 2,
          mb: 2,
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'divider',
          bgcolor: '#fafbff',
        }}
      >
        {/* ===== Top row: left (title + date + search) | right (buttons) ===== */}
        <Grid container spacing={2} alignItems="center">
          {/* LEFT SIDE */}
          <Grid item xs={12} md={8}>
            <Stack spacing={1}>
              {/* Back + Title */}
              <Stack direction="row" spacing={1} alignItems="center">
                <IconButton
                  onClick={() => router.back()}
                  size="small"
                  sx={{ bgcolor: '#eef2ff' }}
                >
                  <ArrowBackIcon fontSize="small" />
                </IconButton>
                <Typography variant="h6" sx={{ fontWeight: 800 }}>
                  Performance Uploads
                </Typography>
              </Stack>

              {/* Date + Search in one line (responsive) */}
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={1}
              >
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                  <DatePicker
                    label="Select Date"
                    value={date}
                    onChange={handlePickDate}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        size: 'small',
                      },
                    }}
                  />
                </LocalizationProvider>

                <TextField
                  fullWidth
                  size="small"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by employee name or ID"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon fontSize="small" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Stack>
            </Stack>
          </Grid>

          {/* RIGHT SIDE – buttons only */}
          <Grid item xs={12} md={4}>
            <Stack
              direction="row"
              spacing={1}
              justifyContent={{ xs: 'flex-start', md: 'flex-end' }}
            >
              <Button
                variant="outlined"
                startIcon={<DownloadIcon />}
                size="small"
                onClick={() => {
                  const header = [
                    'date',
                    'employee_id',
                    'employee_name',
                    'manager_tl',
                    'login',
                    'approval',
                    'disbursal',
                    '_id',
                  ];

                  const body = filteredRows.map((r) => [
                    r.date || '',
                    r.employee_id || '',
                    r.employee_name || '',
                    r.manager_tl || '',
                    Number(r.login || 0),
                    Number(r.approval || 0),
                    Number(r.disbursal || 0),
                    r._id || '',
                  ]);

                  const csv = [header, ...body].map((r) => r.join(',')).join('\n');

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
              >
                Export
              </Button>

              {isAdmin && (
                <>
                  <Button
                    variant="contained"
                    size="small"
                    startIcon={<CalendarMonthIcon />}
                    onClick={() => setFormOpen(true)}
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
                    variant="contained"
                    size="small"
                    startIcon={<UploadFileIcon />}
                    onClick={() => fileRef.current?.click()}
                    disabled={uploading}
                    sx={{ bgcolor: '#ff8a00' }}
                  >
                    {uploading ? 'Uploading…' : 'Upload'}
                  </Button>
                </>
              )}
            </Stack>
          </Grid>
        </Grid>

        {/* ===== Second row: simple stats line ===== */}
        <Box sx={{ mt: 1.5 }}>
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            spacing={1}
            justifyContent="space-between"
            alignItems={{ xs: 'flex-start', md: 'center' }}
          >
            {/* Totals */}
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={1}
              sx={{ width: '100%' }}
            >
              <Chip
                size="small"
                label={`Logins: ${totals.logins}`}
                icon={<CheckCircleIcon fontSize="small" />}
                sx={{
                  flex: 0.1,
                  bgcolor: '#e5f7ed',
                  fontWeight: 600,
                  justifyContent: 'space-between',
                }}
              />
              <Chip
                size="small"
                label={`Approvals: ${rupee(totals.approvals)}`}
                icon={<TrendingUpIcon fontSize="small" />}
                sx={{
                     flex: 0.1,
                  bgcolor: '#e6f3ff',
                  fontWeight: 600,
                  justifyContent: 'space-between',
                }}
              />
              <Chip
                size="small"
                label={`Disbursal: ${rupee(totals.disbursal)}`}
                icon={<TrendingUpIcon fontSize="small" />}
                sx={{
                     flex: 0.1,
                  bgcolor: '#eee9ff',
                  fontWeight: 600,
                  justifyContent: 'space-between',
                }}
              />
            </Stack>

            {/* Star performers – simple text chips */}
            {(starPerformers.approval || starPerformers.disbursal) && (
              <Stack direction="row" spacing={1} flexWrap="wrap" justifyContent="flex-end">
                {starPerformers.approval && (
                  <Chip
                    size="small"
                    icon={<EmojiEventsIcon fontSize="small" />}
                    label={`Top Approval: ${starPerformers.approval.employee_name || '-'} (${rupee(
                      Number(starPerformers.approval.approval || 0)
                    )})`}
                    sx={{ bgcolor: '#fff7e6', fontWeight: 600 }}
                  />
                )}
                {starPerformers.disbursal && (
                  <Chip
                    size="small"
                    icon={<EmojiEventsIcon fontSize="small" />}
                    label={`Top Disbursal: ${starPerformers.disbursal.employee_name || '-'} (${rupee(
                      Number(starPerformers.disbursal.disbursal || 0)
                    )})`}
                    sx={{ bgcolor: '#fff7e6', fontWeight: 600 }}
                  />
                )}
              </Stack>
            )}
          </Stack>
        </Box>
      </Paper>
    ),
    [date, isAdmin, uploading, totals, dateStr, router, search, filteredRows, starPerformers]
  );

  /* ------------ Row color helper ------------ */
  const rowBg = (r: Row) => {
    const hasAny =
      (Number(r.login) || 0) > 0 ||
      (Number(r.approval) || 0) > 0 ||
      (Number(r.disbursal) || 0) > 0;

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
              No rows {search ? `matching “${search}”` : ''} for{' '}
              {dayjs(dateStr).format('DD MMM YYYY')}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {search
                ? 'Try a different name/ID.'
                : isAdmin
                  ? 'Upload a file, add a row manually, or change the date.'
                  : 'Ask admin to upload or change the date.'}
            </Typography>
          </Paper>
        ) : (
          <Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden' }}>
            <TableContainer>
              <Table size="small" sx={{ '& th': { fontWeight: 1200 } }}>
                <TableHead>
                  <TableRow
                    sx={{
                      background: 'linear-gradient(180deg,#F2F6FF 0%, #E9EEFF 100%)',
                    }}
                  >
                    <TableCell>Employee</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Manager / TL</TableCell>
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
                          <Typography sx={{ fontWeight: 700 }}>
                            {r.employee_name || '-'}
                          </Typography>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        {r.date ? dayjs(r.date).format('DD MMM YYYY') : '-'}
                      </TableCell>
                      <TableCell>
                        {r.manager_tl ? (
                          <Chip
                            size="small"
                            label={r.manager_tl}
                            sx={{ bgcolor: '#F3E8FF', fontWeight: 600 }}
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
                          sx={{ bgcolor: '#DCFCE7', fontWeight: 800 }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Chip
                          size="small"
                          label={rupee(Number(r.approval || 0))}
                          sx={{ bgcolor: '#E0F2FE', fontWeight: 800 }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Chip
                          size="small"
                          label={rupee(Number(r.disbursal || 0))}
                          sx={{ bgcolor: '#EDE9FE', fontWeight: 800 }}
                        />
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

      {/* ===== Manual Add Row Dialog ===== */}
      <Dialog
        open={formOpen}
        onClose={() => !formSaving && setFormOpen(false)}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle sx={{ fontWeight: 800 }}>Add Performance Row Manually</DialogTitle>
        <DialogContent dividers sx={{ pt: 2.5, pb: 2.5 }}>
          <Grid container spacing={2.5}>
            <Grid item xs={12}>
              <TextField
                label="Date"
                value={dayjs(dateStr).format('DD MMM YYYY')}
                fullWidth
                size="medium"
                disabled
              />
            </Grid>

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

            <Grid item xs={12} md={6}>
              {/* Manager / TL dropdown (with free typing) */}
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
            <Grid item xs={12} md={4}>
              <TextField
                label="Approval (₹ in Lakhs)"
                type="number"
                value={form.approval_lakh}
                onChange={handleFormChange('approval_lakh')}
                fullWidth
                size="medium"
                InputProps={{
                  endAdornment: <InputAdornment position="end">L</InputAdornment>,
                }}
                helperText="Enter amount in lakhs"
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                label="Disbursal (₹ in Lakhs)"
                type="number"
                value={form.disbursal_lakh}
                onChange={handleFormChange('disbursal_lakh')}
                fullWidth
                size="medium"
                InputProps={{
                  endAdornment: <InputAdornment position="end">L</InputAdornment>,
                }}
                helperText="Enter amount in lakhs"
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
          <Button variant="contained" onClick={onFormSubmit} disabled={formSaving}>
            {formSaving ? 'Saving…' : 'Save Row'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
