'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Avatar,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Drawer,
  IconButton,
  Paper,
  Rating,
  Select,
  MenuItem,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import GroupsIcon from '@mui/icons-material/Groups';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import VisibilityIcon from '@mui/icons-material/Visibility';

import { useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from '@/redux/store';
import { fetchEmployees } from '@/redux/features/employees/employeesSlice';

import { apiPatch, fetchOneDaily, fetchOneMonthly, monthISO, todayISO } from './dpApi';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
type TeamApi = {
  _id: string;
  name: string;
  code?: string;
  manager_id?: string;
  employee_ids?: any;
  tls?: string[];
};

type Employee = {
  _id: string;
  first_name?: string;
  last_name?: string;
  image?: string;
  designation?: string;
  code?: string;
};

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
const fullName = (e?: Employee | null) =>
  `${e?.first_name || ''} ${e?.last_name || ''}`.trim() || '—';

const isMongoId = (v: any) => /^[a-f\d]{24}$/i.test(String(v || '').trim());

const splitIds = (value?: any): string[] => {
  if (!value) return [];
  if (Array.isArray(value)) return value.map((x) => String(x).trim()).filter(Boolean);
  const s = String(value).trim();
  if (!s) return [];
  if (s.startsWith('[') && s.endsWith(']')) {
    try {
      const arr = JSON.parse(s);
      if (Array.isArray(arr)) return arr.map((x) => String(x).trim()).filter(Boolean);
    } catch {}
  }
  return s.split(',').map((x) => x.trim()).filter(Boolean);
};

const getFileNameFromUrl = (url: string) => {
  try {
    const clean = String(url || '').split('?')[0];
    const last = clean.substring(clean.lastIndexOf('/') + 1);
    return decodeURIComponent(last || url);
  } catch {
    return url;
  }
};

const prettyFileName = (url: string) => getFileNameFromUrl(url).replace(/^\d{10,}-/, '');
const isImageUrl = (url: string) => /\.(png|jpe?g|webp|gif)$/i.test(String(url || '').split('?')[0]);
const normalizeUrl = (url: string) => {
  const u = String(url || '');
  if (!u) return '';
  if (/^https?:\/\//i.test(u)) return u;
  const base = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:5500';
  return `${base}${u.startsWith('/') ? '' : '/'}${u}`;
};

const getRoleFlags = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const rpRaw =
    user?.role_priority ?? user?.rolePriority ?? user?.role_priority_id ??
    user?.rolePriorityId ?? user?.role?.priority ?? user?.role?.role_priority ?? user?.role;
  const rp = Number(rpRaw);
  const safeRp = Number.isFinite(rp) ? rp : null;
  const raw = String(user?.designation || user?.role_name || user?.user_type || '')
    .toLowerCase().replace(/\s+/g, ' ').trim();
  const isAdmin = safeRp === 1 || safeRp === 6;
  return { isAdmin, rp: safeRp, raw, user };
};

const ALLOWED_TEAM_IDS: string[] = [
  '69ba84e2ac684e4a699ff93f',
  '69bbc4ac1692090dee646879',

  '69ba844aac684e4a699ff93b',
  '69ba842bac684e4a699ff90f',
  '69bbc3fd1692090dee646847',
  '69bbc4c81692090dee64687f'
];

const ALLOWED_TEAM_CODES: string[] = [];

// ─────────────────────────────────────────────
// Task helpers
// ─────────────────────────────────────────────
const PRIORITIES = ['Low', 'Medium', 'High'];
const STATUSES = ['Pending', 'In Progress', 'Completed'];

const priorityColor = (p: string) =>
  p === 'High' ? 'error' : p === 'Medium' ? 'warning' : 'default';

const statusColor = (s: string) =>
  s === 'Completed' ? 'success' : s === 'In Progress' ? 'info' : 'default';

const DEFAULT_TASK_WIDTHS = { date: 130, priority: 130, task: 380, status: 130, actions: 70 };
type ColKey = keyof typeof DEFAULT_TASK_WIDTHS;

// ─────────────────────────────────────────────
// Admin task list fetch (uses /department-performance/list)
// ─────────────────────────────────────────────
const fetchAdminTasks = async (owner_id: string, date?: string): Promise<any[]> => {
  const base = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:5500';
  const token = localStorage.getItem('token') || '';
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const companyId = localStorage.getItem('company_id') || user.company_id || '';

  const params = new URLSearchParams({ owner_id, page: '1', limit: '200' });
  if (date) params.set('date', date);

  const res = await fetch(`${base}/department-performance/task/list?${params}`, {
    headers: { Authorization: `Bearer ${token}`, 'x-company-id': companyId },
  });
  const data = await res.json();
  return data?.data || data?.tasks || (Array.isArray(data) ? data : []);
};

// ─────────────────────────────────────────────
// Sub-component: Admin Task Sheet (read-only)
// ─────────────────────────────────────────────
function AdminTaskSheet({ employeeId, empName }: { employeeId: string; empName: string }) {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [dateFilter, setDateFilter] = useState('');
  const [viewRow, setViewRow] = useState<any | null>(null);
  const [widths, setWidths] = useState<typeof DEFAULT_TASK_WIDTHS>(DEFAULT_TASK_WIDTHS);

  const resizingCol = useRef<ColKey | null>(null);
  const startX = useRef(0);
  const startWidth = useRef(0);

  const onResizeStart = (col: ColKey) => (e: React.MouseEvent) => {
    e.preventDefault();
    resizingCol.current = col;
    startX.current = e.clientX;
    startWidth.current = widths[col];
    document.addEventListener('mousemove', onResizeMove);
    document.addEventListener('mouseup', onResizeEnd);
  };

  const onResizeMove = (e: MouseEvent) => {
    if (!resizingCol.current) return;
    const delta = e.clientX - startX.current;
    const newWidth = Math.max(60, startWidth.current + delta);
    setWidths((prev) => ({ ...prev, [resizingCol.current as ColKey]: newWidth }));
  };

  const onResizeEnd = () => {
    resizingCol.current = null;
    document.removeEventListener('mousemove', onResizeMove);
    document.removeEventListener('mouseup', onResizeEnd);
  };

  const load = async () => {
    try {
      setLoading(true);
      const data = await fetchAdminTasks(employeeId, dateFilter || undefined);
      setRows(data);
    } catch (e) {
      console.error(e);
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [employeeId, dateFilter]);

  const ResizeHandle = ({ col }: { col: ColKey }) => (
    <Box
      onMouseDown={onResizeStart(col)}
      sx={{
        position: 'absolute', right: 0, top: 0, bottom: 0, width: 6,
        cursor: 'col-resize', zIndex: 2,
        '&:hover': { bgcolor: 'rgba(255,255,255,0.4)' },
      }}
    />
  );

  const totalWidth = Object.values(widths).reduce((a, b) => a + b, 0);

  return (
    <Box>
      {/* Filter bar */}
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1.5 }} flexWrap="wrap">
        <TextField
          size="small" type="date" label="Filter by date"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          InputLabelProps={{ shrink: true }}
          sx={{ minWidth: 180 }}
        />
        {dateFilter && (
          <Button size="small" variant="text" onClick={() => setDateFilter('')}>
            Clear
          </Button>
        )}
        <Button size="small" variant="text" onClick={() => setWidths(DEFAULT_TASK_WIDTHS)}>
          Reset columns
        </Button>
      </Stack>

      <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'auto' }}>
        <Box sx={{ minWidth: totalWidth }}>
          {/* Header */}
          <Box sx={{ display: 'flex', bgcolor: '#2e5d4f' }}>
            {(['date', 'priority', 'task', 'status'] as ColKey[]).map((col) => (
              <Box key={col} sx={{ position: 'relative', width: widths[col], px: 1.5, py: 1.2, flexShrink: 0 }}>
                <Typography sx={{ color: '#fff', fontWeight: 800, fontSize: 13, textTransform: 'capitalize' }}>
                  {col}
                </Typography>
                <ResizeHandle col={col} />
              </Box>
            ))}
            <Box sx={{ width: widths.actions, flexShrink: 0 }} />
          </Box>

          {/* Rows */}
          {loading ? (
            <Box sx={{ p: 2 }}><Typography color="text.secondary">Loading…</Typography></Box>
          ) : rows.length === 0 ? (
            <Box sx={{ p: 2 }}><Typography color="text.secondary">No tasks found for {empName}.</Typography></Box>
          ) : (
            rows.map((row) => (
              <Box
                key={row._id}
                sx={{
                  display: 'flex', borderBottom: '1px solid', borderColor: 'divider',
                  '&:hover': { bgcolor: 'rgba(0,0,0,0.03)' },
                }}
              >
                <Box sx={{ width: widths.date, p: 1, flexShrink: 0, display: 'flex', alignItems: 'center' }}>
                  <Typography variant="body2" noWrap>{row.date}</Typography>
                </Box>

                <Box sx={{ width: widths.priority, p: 1, flexShrink: 0, display: 'flex', alignItems: 'center' }}>
                  <Chip size="small" label={row.priority || 'Medium'} color={priorityColor(row.priority) as any} />
                </Box>

                <Box sx={{ width: widths.task, p: 1, flexShrink: 0, overflow: 'hidden', display: 'flex', alignItems: 'center' }}>
                  <Typography
                    variant="body2" noWrap
                    sx={{ cursor: 'pointer', width: '100%' }}
                    onClick={() => setViewRow(row)}
                  >
                    {row.task || '—'}
                  </Typography>
                </Box>

                <Box sx={{ width: widths.status, p: 1, flexShrink: 0, display: 'flex', alignItems: 'center' }}>
                  <Chip size="small" label={row.status || 'Pending'} color={statusColor(row.status) as any} />
                </Box>

                <Box sx={{ width: widths.actions, p: 0.75, flexShrink: 0, display: 'flex', alignItems: 'center' }}>
                  <IconButton size="small" color="primary" onClick={() => setViewRow(row)}>
                    <VisibilityIcon fontSize="small" />
                  </IconButton>
                </Box>
              </Box>
            ))
          )}
        </Box>
      </Paper>

      {/* View modal */}
      <Dialog open={!!viewRow} onClose={() => setViewRow(null)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 900 }}>Task Detail</DialogTitle>
        <DialogContent dividers>
          {viewRow && (
            <Stack spacing={2}>
              <Box>
                <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary' }}>Date</Typography>
                <Typography>{viewRow.date}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary' }}>Priority</Typography>
                <Box sx={{ mt: 0.5 }}>
                  <Chip size="small" label={viewRow.priority || 'Medium'} color={priorityColor(viewRow.priority) as any} />
                </Box>
              </Box>
              <Box>
                <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary' }}>Status</Typography>
                <Box sx={{ mt: 0.5 }}>
                  <Chip size="small" label={viewRow.status || 'Pending'} color={statusColor(viewRow.status) as any} />
                </Box>
              </Box>
              <Box>
                <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary' }}>Task</Typography>
                <Typography sx={{ whiteSpace: 'pre-wrap', mt: 0.5 }}>{viewRow.task || '—'}</Typography>
              </Box>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewRow(null)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

// ─────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────
export default function PerformanceAdmin() {
  const dispatch: AppDispatch = useDispatch();
  const { employees } = useSelector((state: RootState) => state.employees);

  const [teams, setTeams] = useState<TeamApi[]>([]);
  const [loadingTeams, setLoadingTeams] = useState(false);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [teamSearch, setTeamSearch] = useState('');
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);

  // tabs: daily | monthly
  const [tab, setTab] = useState<'daily' | 'monthly'>('daily');
  const [filterDate, setFilterDate] = useState(todayISO());
  const [filterMonth, setFilterMonth] = useState(monthISO());

  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);

  const [record, setRecord] = useState<any | null>(null);
  const [loadingRecord, setLoadingRecord] = useState(false);

  const [reviewRating, setReviewRating] = useState<number | null>(null);
  const [reviewText, setReviewText] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  // ── Load employees ──
  useEffect(() => {
    if (!employees || employees.length === 0) {
      dispatch(fetchEmployees({ page: 1, limit: 10000, search: '', designation: '' }));
    }
  }, [dispatch, employees?.length]);

  // ── Load teams ──
  useEffect(() => {
    const run = async () => {
      const base = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:5500';
      const token = localStorage.getItem('token') || '';
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const companyId = localStorage.getItem('company_id') || user.company_id || '';
      const { isAdmin } = getRoleFlags();

      try {
        setLoadingTeams(true);
        const res = await fetch(`${base}/teams/get-all-teams`, {
          headers: { Authorization: `Bearer ${token}`, 'x-company-id': companyId },
        });
        const data = await res.json();
        const list: TeamApi[] = Array.isArray(data)
          ? data
          : Array.isArray(data?.teams) ? data.teams
          : Array.isArray(data?.data) ? data.data : [];

        const filteredList = ALLOWED_TEAM_IDS.length > 0
          ? ALLOWED_TEAM_IDS
              .map((id) => list.find((t) => String(t._id) === id))
              .filter(Boolean) as TeamApi[]
          : list;

        setTeams(filteredList);
        setSelectedTeamId(filteredList[0]?._id || null);
      } catch (e) {
        console.error('get-all-teams error', e);
        setTeams([]);
        setSelectedTeamId(null);
      } finally {
        setLoadingTeams(false);
      }
    };
    run();
  }, []);

  const empMap = useMemo(() => {
    const m = new Map<string, Employee>();
    (employees || []).forEach((e: any) => e?._id && m.set(String(e._id), e));
    return m;
  }, [employees]);

  const filteredTeams = useMemo(() => {
    const q = teamSearch.trim().toLowerCase();
    if (!q) return teams;
    return teams.filter((t) =>
      String(t?.name || '').toLowerCase().includes(q) ||
      String(t?.code || '').toLowerCase().includes(q),
    );
  }, [teams, teamSearch]);

  const selectedTeam = useMemo(
    () => teams.find((t) => t._id === selectedTeamId) || null,
    [teams, selectedTeamId],
  );

  const teamMemberIds = useMemo(() => {
    return splitIds(selectedTeam?.employee_ids)
      .map((x) => String(x).trim())
      .filter((x) => isMongoId(x))
      .filter((x) => empMap.has(x));
  }, [selectedTeam?.employee_ids, empMap]);

  // ── Load daily/monthly record ──
  const loadRecord = async () => {
    if (!selectedEmployeeId) { setRecord(null); return; }
    try {
      setLoadingRecord(true);
      const r =
        tab === 'daily'
          ? await fetchOneDaily(selectedEmployeeId, filterDate)
          : await fetchOneMonthly(selectedEmployeeId, filterMonth);

      setRecord(r || null);
      setReviewRating(r?.rating ?? null);
      setReviewText(r?.review ?? '');
      setIsDirty(false);
    } catch (e) {
      console.error(e);
      setRecord(null);
    } finally {
      setLoadingRecord(false);
    }
  };

  useEffect(() => { loadRecord(); }, [tab, filterDate, filterMonth, selectedEmployeeId]);

  // ── Submit review ──
  const submitReview = async () => {
    if (!record?._id || isSaving || !isDirty) return;
    try {
      setIsSaving(true);
      await apiPatch(`/department-performance/${record._id}/review`, {
        rating: reviewRating,
        review: reviewText,
      });
      alert('✅ Review saved');
      await loadRecord();
    } catch (e: any) {
      alert(`❌ ${e?.message || 'Error'}`);
    } finally {
      setIsSaving(false);
    }
  };

  const selectedEmp = selectedEmployeeId ? empMap.get(selectedEmployeeId) || null : null;

  return (
    <>
      {/* Teams Drawer */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        PaperProps={{ sx: { width: 380, p: 2 } }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6" sx={{ fontWeight: 900 }}>All Teams</Typography>
          <IconButton onClick={() => setDrawerOpen(false)}><CloseIcon /></IconButton>
        </Box>

        <TextField
          size="small" fullWidth label="Search team"
          value={teamSearch} onChange={(e) => setTeamSearch(e.target.value)}
          sx={{ mt: 2 }}
        />

        <Divider sx={{ my: 2 }} />

        {loadingTeams ? (
          <Typography color="text.secondary">Loading teams…</Typography>
        ) : filteredTeams.length === 0 ? (
          <Typography color="text.secondary">No teams found.</Typography>
        ) : (
          <Stack spacing={1}>
            {filteredTeams.map((t) => {
              const active = t._id === selectedTeamId;
              return (
                <Paper
                  key={t._id} variant="outlined"
                  onClick={() => {
                    setSelectedTeamId(t._id);
                    setSelectedEmployeeId(null);
                    setDrawerOpen(false);
                  }}
                  sx={{
                    p: 1.2, borderRadius: 2, cursor: 'pointer',
                    borderColor: active ? 'primary.main' : 'divider',
                    bgcolor: active ? 'rgba(44,60,227,0.06)' : 'transparent',
                  }}
                >
                  <Typography sx={{ fontWeight: 900 }}>{t.name || '—'}</Typography>
                  <Typography variant="caption" color="text.secondary">ID: {t._id}</Typography>
                </Paper>
              );
            })}
          </Stack>
        )}
      </Drawer>

      {/* Main */}
      <Paper variant="outlined" sx={{ p: 2, borderRadius: 3 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" gap={2}>
          <Typography sx={{ fontWeight: 900 }}>Admin Dashboard</Typography>
          <Button
            variant="contained" startIcon={<GroupsIcon />}
            onClick={() => setDrawerOpen(true)}
            sx={{ borderRadius: 999, fontWeight: 900, textTransform: 'none' }}
          >
            Teams
          </Button>
        </Stack>

        <Divider sx={{ my: 2 }} />

        {!selectedTeam ? (
          <Typography color="text.secondary">No team selected.</Typography>
        ) : (
          <>
            <Stack direction="row" justifyContent="space-between" alignItems="center" gap={2}>
              <Typography sx={{ fontWeight: 900 }} noWrap>
                {selectedTeam.name}
                <Chip
                  icon={<PeopleAltIcon sx={{ color: '#fff' }} />}
                  label={teamMemberIds.length}
                  size="small"
                  sx={{
                    bgcolor: 'primary.main', color: '#fff', ml: '5px', fontWeight: 900,
                    '& .MuiChip-icon': { color: '#fff' },
                  }}
                />
              </Typography>

              {/* 3 tabs */}
              <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ minHeight: 36 }}>
                <Tab value="daily" label="Daily" />
                <Tab value="monthly" label="Monthly" />
              </Tabs>
            </Stack>

            {/* Date / Month filter */}
            {(
              <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {tab === 'daily' ? (
                  <TextField
                    size="small" type="date" label="Date"
                    value={filterDate} onChange={(e) => setFilterDate(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    sx={{ maxWidth: 210, '& .MuiInputBase-root': { height: 36 } }}
                  />
                ) : (
                  <TextField
                    type="month" label="Month"
                    value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    sx={{ maxWidth: 240 }}
                  />
                )}
              </Box>
            )}

            <Divider sx={{ my: 2 }} />

            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
              {/* Left: employee list */}
              <Box sx={{ width: 200, flexShrink: 0 }}>
                <Typography variant="overline" sx={{ fontWeight: 900 }}>Employees</Typography>
                <Stack spacing={1} sx={{ mt: 1 }}>
                  {teamMemberIds.map((id) => {
                    const emp = empMap.get(id) || null;
                    if (!emp) return null;
                    const active = selectedEmployeeId === id;
                    return (
                      <Paper
                        key={id} variant="outlined"
                        onClick={() => setSelectedEmployeeId(id)}
                        sx={{
                          p: 1.1, borderRadius: 2, cursor: 'pointer',
                          borderColor: active ? 'primary.main' : 'divider',
                          bgcolor: active ? 'rgba(44,60,227,0.06)' : 'transparent',
                        }}
                      >
                        <Stack direction="row" spacing={1.2} alignItems="center">
                          <Avatar src={emp?.image || ''} sx={{ width: 32, height: 32 }} />
                          <Box sx={{ minWidth: 0 }}>
                            <Typography sx={{ fontWeight: 900 }} noWrap>{fullName(emp)}</Typography>
                            <Typography variant="caption" color="text.secondary" noWrap>
                              {emp?.designation || '—'}
                            </Typography>
                          </Box>
                        </Stack>
                      </Paper>
                    );
                  })}
                </Stack>
              </Box>

              {/* Right: record + review (+ task sheet for daily) */}
              <Box sx={{ flex: 2, minWidth: 320 }}>
                <>
                    <Typography variant="overline" sx={{ fontWeight: 900 }}>Record + Review</Typography>

                    <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, mt: 1, display: (!selectedEmployeeId || (!record && !loadingRecord && tab === 'daily')) ? 'none' : 'block' }}>
                      {loadingRecord ? (
                        <Typography color="text.secondary">Loading…</Typography>
                      ) : !selectedEmployeeId ? (
                        <Typography color="text.secondary">Select an employee from left.</Typography>
                      ) : !record ? (
                        <Typography color="text.secondary">No record found for this filter.</Typography>
                      ) : (
                        <Stack spacing={2}>
                          <Typography sx={{ fontWeight: 900 }}>
                            {tab === 'daily' ? `Daily • ${record.date}` : `Monthly • ${record.month}`}
                          </Typography>

                          {tab === 'daily' ? (
                            <>
                              <Box>
                                <Typography variant="caption" sx={{ fontWeight: 900 }}>What done today</Typography>
                                <Typography sx={{ whiteSpace: 'pre-wrap' }}>{record.whatDoneToday || '—'}</Typography>
                              </Box>
                              <Box>
                                <Typography variant="caption" sx={{ fontWeight: 900 }}>What completed today</Typography>
                                <Typography sx={{ whiteSpace: 'pre-wrap' }}>{record.whatCompletedToday || '—'}</Typography>
                              </Box>
                            </>
                          ) : (
                            <>
                              <Box>
                                <Typography variant="caption" sx={{ fontWeight: 900 }}>Plan for this month</Typography>
                                <Typography sx={{ whiteSpace: 'pre-wrap' }}>{record.planForThisMonth || '—'}</Typography>
                              </Box>
                              <Box>
                                <Typography variant="caption" sx={{ fontWeight: 900 }}>Completed this month</Typography>
                                <Typography sx={{ whiteSpace: 'pre-wrap' }}>{record.completedThisMonth || '—'}</Typography>
                              </Box>
                            </>
                          )}

                          {/* Attachments */}
                          {Array.isArray(record.attachments) && record.attachments.length > 0 && (
                            <>
                              <Divider />
                              <Box>
                                <Typography variant="caption" sx={{ fontWeight: 900 }}>Attachments</Typography>
                                <Stack spacing={1} sx={{ mt: 1 }}>
                                  {record.attachments.map((rawUrl: string, idx: number) => {
                                    const url = normalizeUrl(rawUrl);
                                    const name = prettyFileName(rawUrl);
                                    const img = isImageUrl(rawUrl);
                                    return (
                                      <Paper
                                        key={idx} variant="outlined"
                                        sx={{
                                          p: 1, borderRadius: 2, cursor: 'pointer',
                                          transition: '0.15s',
                                          '&:hover': { bgcolor: 'rgba(44,60,227,0.06)' },
                                        }}
                                        onClick={() => window.open(url, '_blank')}
                                      >
                                        <Stack direction="row" spacing={1.2} alignItems="center">
                                          {img ? (
                                            <Box
                                              component="img" src={url} alt={name}
                                              sx={{
                                                width: 48, height: 48, borderRadius: 2,
                                                objectFit: 'cover', flexShrink: 0,
                                                border: '1px solid', borderColor: 'divider',
                                              }}
                                              onError={(e: any) => (e.currentTarget.style.display = 'none')}
                                            />
                                          ) : (
                                            <Box
                                              sx={{
                                                width: 48, height: 48, borderRadius: 2, flexShrink: 0,
                                                border: '1px solid', borderColor: 'divider',
                                                display: 'grid', placeItems: 'center',
                                                fontWeight: 900, color: 'text.secondary',
                                              }}
                                            >
                                              F
                                            </Box>
                                          )}
                                          <Box sx={{ minWidth: 0 }}>
                                            <Typography sx={{ fontWeight: 900 }} noWrap title={name}>{name}</Typography>
                                          </Box>
                                        </Stack>
                                      </Paper>
                                    );
                                  })}
                                </Stack>
                              </Box>
                            </>
                          )}

                          <Divider />

                          <Typography sx={{ fontWeight: 900 }}>Review</Typography>

                          <Stack direction="row" alignItems="center" spacing={1}>
                            <Typography variant="body2" sx={{ fontWeight: 700 }}>Rating:</Typography>
                            <Rating
                              value={reviewRating}
                              onChange={(_, v) => { setReviewRating(v); setIsDirty(true); }}
                            />
                          </Stack>

                          <TextField
                            label="Review" value={reviewText}
                            onChange={(e) => { setReviewText(e.target.value); setIsDirty(true); }}
                            multiline minRows={3}
                          />

                          <Button
                            variant="contained" onClick={submitReview}
                            disabled={isSaving || !isDirty || !record?._id}
                            sx={{ borderRadius: 2, fontWeight: 900, textTransform: 'none', alignSelf: 'flex-start' }}
                          >
                            {isSaving ? 'Saving…' : isDirty ? 'Save Review' : 'Saved'}
                          </Button>
                        </Stack>
                      )}
                    </Paper>

                    {/* Task sheet — shown only in daily tab */}
                    {tab === 'daily' && (
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="overline" sx={{ fontWeight: 900 }}>
                          Task Sheet{selectedEmp ? ` — ${fullName(selectedEmp)}` : ''}
                        </Typography>
                        <Box sx={{ mt: 1 }}>
                          {selectedEmployeeId && (
                            <AdminTaskSheet
                              key={selectedEmployeeId}
                              employeeId={selectedEmployeeId}
                              empName={fullName(selectedEmp)}
                            />
                          )}
                        </Box>
                      </Box>
                    )}
                  </>
                </Box>
            </Stack>
          </>
        )}
      </Paper>
    </>
  );
}
