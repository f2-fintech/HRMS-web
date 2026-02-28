'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Link,
  Snackbar,
  Stack,
  TextField,
  Typography,
  InputAdornment,
  Tooltip,
} from '@mui/material';
import Autocomplete from '@mui/material/Autocomplete';
import { createTheme, ThemeProvider } from '@mui/material/styles';

import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import RefreshIcon from '@mui/icons-material/Refresh';
import VideoCallIcon from '@mui/icons-material/VideoCall';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import GroupIcon from '@mui/icons-material/Group';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import LinkIcon from '@mui/icons-material/Link';
import NotesIcon from '@mui/icons-material/Notes';
import EditIcon from '@mui/icons-material/Edit';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import UpdateIcon from '@mui/icons-material/Update';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#7C3AED', contrastText: '#ffffff' },
    secondary: { main: '#EC4899' },
    background: { default: '#F5F3FF', paper: '#ffffff' },
    text: { primary: '#1E1B4B', secondary: '#6B7280' },
    error: { main: '#EF4444' },
    success: { main: '#10B981' },
  },
  typography: {
    fontFamily: '"DM Sans", "Segoe UI", sans-serif',
    h5: {
      fontFamily: '"Syne", "DM Sans", sans-serif',
      fontWeight: 800,
      letterSpacing: '-0.5px',
    },
    h6: { fontFamily: '"Syne", "DM Sans", sans-serif', fontWeight: 700 },
  },
  shape: { borderRadius: 12 },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 700,
          borderRadius: '10px',
          padding: '8px 20px',
          transition: 'all 0.2s ease',
        },
        contained: {
          background: 'linear-gradient(135deg, #7C3AED 0%, #EC4899 100%)',
          color: '#ffffff',
          boxShadow: '0 4px 20px rgba(124,58,237,0.30)',
          '&:hover': {
            background: 'linear-gradient(135deg, #6D28D9 0%, #DB2777 100%)',
            boxShadow: '0 6px 28px rgba(124,58,237,0.45)',
            transform: 'translateY(-1px)',
          },
        },
        outlined: {
          borderColor: 'rgba(124,58,237,0.4)',
          color: '#7C3AED',
          '&:hover': {
            borderColor: '#7C3AED',
            background: 'rgba(124,58,237,0.06)',
          },
        },
      },
    },
  },
});

// ─── Types ─────────────────────────────────────────────────────────────────────
type MeetingStatus = 'SCHEDULED' | 'UPDATED' | 'CANCELLED' | 'COMPLETED' | string;

type Employee = {
  _id: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  work_email?: string;
};

type Meeting = {
  _id: string;
  title: string;
  start_time: string;
  end_time?: string;
  remarks?: string;
  meeting_link?: string;
  company_id?: string;

  attendee_employee_ids?: string[];
  attendee_emails?: string[];

  status?: MeetingStatus;
  createdAt?: string;
};

type FormState = {
  title: string;
  start_time: string;
  end_time: string;
  meeting_link: string;
  remarks: string;
};

const fmtDate = (iso: string) => {
  const d = new Date(iso);
  return {
    date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    time: d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
  };
};

const statusUi = (status?: string) => {
  const s = String(status || 'SCHEDULED').toUpperCase();
  if (s === 'CANCELLED')
    return {
      label: 'Cancelled',
      color: '#EF4444',
      bg: 'rgba(239,68,68,0.08)',
      border: 'rgba(239,68,68,0.25)',
      icon: <CancelIcon sx={{ fontSize: '13px !important' }} />,
    };
  if (s === 'COMPLETED')
    return {
      label: 'Completed',
      color: '#059669',
      bg: 'rgba(16,185,129,0.10)',
      border: 'rgba(16,185,129,0.25)',
      icon: <CheckCircleIcon sx={{ fontSize: '13px !important' }} />,
    };
  if (s === 'UPDATED')
    return {
      label: 'Updated',
      color: '#2563EB',
      bg: 'rgba(37,99,235,0.10)',
      border: 'rgba(37,99,235,0.25)',
      icon: <UpdateIcon sx={{ fontSize: '13px !important' }} />,
    };

  return {
    label: 'Scheduled',
    color: '#7C3AED',
    bg: 'rgba(124,58,237,0.08)',
    border: 'rgba(124,58,237,0.25)',
    icon: <EventAvailableIcon sx={{ fontSize: '13px !important' }} />,
  };
};

// ─── Meeting Card ──────────────────────────────────────────────────────────────
const MeetingCard = ({
  m,
  onCancel,
  onEdit,
}: {
  m: Meeting;
  onCancel: (id: string) => void;
  onEdit: (meeting: Meeting) => void;
}) => {
  const start = fmtDate(m.start_time);
  const end = m.end_time ? fmtDate(m.end_time) : null;
  const totalAttendees = (m.attendee_employee_ids?.length || 0) + (m.attendee_emails?.length || 0);

  const s = statusUi(m.status);
  const isCancelled = String(m.status || '').toUpperCase() === 'CANCELLED';
  const isCompleted = String(m.status || '').toUpperCase() === 'COMPLETED';

  return (
    <Box
      sx={{
        position: 'relative',
        border: `1px solid ${isCancelled ? 'rgba(239,68,68,0.25)' : 'rgba(124,58,237,0.1)'}`,
        borderRadius: '16px',
        p: 2.5,
        background: isCancelled ? 'rgba(255,255,255,0.7)' : '#ffffff',
        opacity: isCancelled ? 0.85 : 1,
        transition: 'all 0.25s ease',
        overflow: 'hidden',
        '&:hover': {
          border: `1px solid ${isCancelled ? 'rgba(239,68,68,0.35)' : 'rgba(124,58,237,0.3)'}`,
          boxShadow: '0 8px 32px rgba(124,58,237,0.12)',
          transform: 'translateY(-2px)',
        },
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '2px',
          background: isCancelled
            ? 'linear-gradient(90deg, #EF4444, #F97316)'
            : 'linear-gradient(90deg, #7C3AED, #EC4899)',
          opacity: 0,
          transition: 'opacity 0.25s ease',
        },
        '&:hover::before': { opacity: 1 },
      }}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2}>
        <Stack direction="row" spacing={2} alignItems="flex-start" flex={1} minWidth={0}>
          <Avatar
            sx={{
              width: 44,
              height: 44,
              flexShrink: 0,
              background: 'linear-gradient(135deg, rgba(124,58,237,0.12), rgba(236,72,153,0.12))',
              border: '1px solid rgba(124,58,237,0.2)',
            }}
          >
            <VideoCallIcon sx={{ color: '#7C3AED', fontSize: 22 }} />
          </Avatar>

          <Box flex={1} minWidth={0}>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.75 }}>
              <Typography
                variant="h6"
                sx={{
                  fontSize: '1rem',
                  fontWeight: 700,
                  color: '#1E1B4B',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  flex: 1,
                }}
              >
                {m.title}
              </Typography>

              <Chip
                icon={s.icon}
                label={s.label}
                size="small"
                sx={{
                  height: 24,
                  fontSize: '0.72rem',
                  background: s.bg,
                  color: s.color,
                  border: `1px solid ${s.border}`,
                }}
              />
            </Stack>

            <Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap" sx={{ gap: 0.75 }}>
              <Chip
                icon={<CalendarTodayIcon sx={{ fontSize: '13px !important' }} />}
                label={start.date}
                size="small"
                sx={{
                  background: 'rgba(124,58,237,0.08)',
                  color: '#7C3AED',
                  border: '1px solid rgba(124,58,237,0.2)',
                  height: 24,
                  fontSize: '0.72rem',
                }}
              />
              <Chip
                icon={<AccessTimeIcon sx={{ fontSize: '13px !important' }} />}
                label={end ? `${start.time} → ${end.time}` : start.time}
                size="small"
                sx={{
                  background: 'rgba(236,72,153,0.08)',
                  color: '#EC4899',
                  border: '1px solid rgba(236,72,153,0.2)',
                  height: 24,
                  fontSize: '0.72rem',
                }}
              />
              {totalAttendees > 0 && (
                <Chip
                  icon={<GroupIcon sx={{ fontSize: '13px !important' }} />}
                  label={`${totalAttendees} attendee${totalAttendees > 1 ? 's' : ''}`}
                  size="small"
                  sx={{
                    background: 'rgba(16,185,129,0.08)',
                    color: '#059669',
                    border: '1px solid rgba(16,185,129,0.2)',
                    height: 24,
                    fontSize: '0.72rem',
                  }}
                />
              )}
            </Stack>

            {m.remarks && (
              <Stack direction="row" spacing={0.75} alignItems="flex-start" sx={{ mt: 1.25 }}>
                <NotesIcon sx={{ fontSize: 14, color: '#9CA3AF', mt: 0.1 }} />
                <Typography variant="body2" sx={{ color: '#6B7280', fontSize: '0.8rem', lineHeight: 1.5 }}>
                  {m.remarks}
                </Typography>
              </Stack>
            )}

            {m.meeting_link && (
              <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mt: 1 }}>
                <LinkIcon sx={{ fontSize: 14, color: '#7C3AED' }} />
                <Link
                  href={m.meeting_link}
                  target="_blank"
                  rel="noreferrer"
                  sx={{
                    fontSize: '0.8rem',
                    color: '#7C3AED',
                    fontWeight: 600,
                    textDecoration: 'none',
                    '&:hover': { textDecoration: 'underline' },
                  }}
                >
                  Join Meeting
                </Link>
              </Stack>
            )}

            {Array.isArray(m.attendee_emails) && m.attendee_emails.length > 0 && (
              <Typography variant="caption" sx={{ display: 'block', mt: 1, color: '#9CA3AF', fontSize: '0.72rem' }}>
                📧 {m.attendee_emails.join(', ')}
              </Typography>
            )}
          </Box>
        </Stack>

        <Stack direction="row" spacing={1} alignItems="center">
          <Tooltip
            title={
              isCancelled ? 'Cancelled meeting cannot be edited' : isCompleted ? 'Completed meeting cannot be edited' : 'Edit meeting'
            }
          >
            <span>
              <IconButton
                onClick={() => onEdit(m)}
                size="small"
                disabled={isCancelled || isCompleted}
                sx={{
                  color: '#A78BFA',
                  '&:hover': { color: '#7C3AED', background: 'rgba(124,58,237,0.08)' },
                }}
              >
                <EditIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>

          <Tooltip title={isCancelled ? 'Already cancelled' : isCompleted ? 'Completed meeting cannot be cancelled' : 'Cancel meeting'}>
            <span>
              <IconButton
                onClick={() => onCancel(m._id)}
                size="small"
                disabled={isCancelled || isCompleted}
                sx={{
                  color: '#D1D5DB',
                  '&:hover': { color: '#EF4444', background: 'rgba(239,68,68,0.08)' },
                }}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
        </Stack>
      </Stack>
    </Box>
  );
};

// ─── Main Component ────────────────────────────────────────────────────────────
const MeetingsGrid = () => {
  const [companyId, setCompanyId] = useState('');
  const [authHeader, setAuthHeader] = useState('');

  const [open, setOpen] = useState(false);

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [empLoading, setEmpLoading] = useState(false);

  const [selectedEmployees, setSelectedEmployees] = useState<Employee[]>([]);
  const [extraEmails, setExtraEmails] = useState<string[]>([]);
  const [emailInput, setEmailInput] = useState('');

  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [listLoading, setListLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [toast, setToast] = useState<{ open: boolean; msg: string; type: 'success' | 'error' }>({
    open: false,
    msg: '',
    type: 'success',
  });

  const [form, setForm] = useState<FormState>({
    title: '',
    start_time: '',
    end_time: '',
    meeting_link: '',
    remarks: '',
  });

  const [statusFilter, setStatusFilter] = useState<'ALL' | 'SCHEDULED' | 'UPDATED' | 'CANCELLED' | 'COMPLETED'>('ALL');

  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelId, setCancelId] = useState<string>('');
  const [cancelReason, setCancelReason] = useState<string>('');
  const [canceling, setCanceling] = useState(false);

  const [editOpen, setEditOpen] = useState(false);
  const [editId, setEditId] = useState<string>('');
  const [updating, setUpdating] = useState(false);

  // ✅ Always return consistent auth: "Bearer <token> <companyId>"
  const getAuth = () => {
    const tokenRaw = localStorage.getItem('token') || '';
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const cid = String(user?.company_id || user?.companyId || '');

    if (!tokenRaw || !cid) return { auth: '', company_id: cid, user };

    const baseBearer = tokenRaw.toLowerCase().startsWith('bearer ')
      ? tokenRaw.split(' ').slice(0, 2).join(' ')
      : `Bearer ${tokenRaw}`;

    return { auth: `${baseBearer} ${cid}`, company_id: cid, user };
  };

  useEffect(() => {
    try {
      const { auth, company_id } = getAuth();
      setCompanyId(company_id);
      setAuthHeader(auth);
    } catch {
      setCompanyId('');
      setAuthHeader('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const showToast = (msg: string, type: 'success' | 'error') => setToast({ open: true, msg, type });

  const empLabel = (e: Employee) => `${e?.first_name || ''} ${e?.last_name || ''}`.trim() || e?.work_email || e?.email || '';

  const normalizeList = (data: any) => {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.employees)) return data.employees;
    if (Array.isArray(data?.meetings)) return data.meetings;
    if (Array.isArray(data?.data)) return data.data;
    if (Array.isArray(data?.items)) return data.items;
    return [];
  };

  const fetchEmployees = async (): Promise<Employee[]> => {
    try {
      setEmpLoading(true);
      const { auth, company_id } = getAuth();

      const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/employees/get?page=1&limit=200`, {
        headers: {
          Authorization: auth,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const txt = await response.text().catch(() => '');
        throw new Error(txt || `Employees fetch failed: ${response.status}`);
      }

      const data = await response.json().catch(() => ({}));
      const list = normalizeList(data) as Employee[];
      setEmployees(list);
      return list;
    } catch (e: any) {
      console.error(e);
      setEmployees([]);
      showToast(e?.message || 'Employees fetch failed', 'error');
      return [];
    } finally {
      setEmpLoading(false);
    }
  };

  const fetchMeetings = async () => {
    try {
      setListLoading(true);
      const { auth, company_id } = getAuth();

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_APP_URL}/meetings/list?company_id=${encodeURIComponent(company_id)}&page=1&limit=200`,
        {
          headers: {
            Authorization: auth,
            'Content-Type': 'application/json',
          },
        },
      );

      if (!response.ok) {
        const txt = await response.text().catch(() => '');
        throw new Error(txt || `Meetings fetch failed: ${response.status}`);
      }

      const data = await response.json().catch(() => ({}));
      setMeetings(normalizeList(data) as Meeting[]);
    } catch (e: any) {
      console.error(e);
      setMeetings([]);
      showToast(e?.message || 'Meetings fetch failed', 'error');
    } finally {
      setListLoading(false);
    }
  };

  useEffect(() => {
    if (authHeader && companyId) fetchMeetings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authHeader, companyId]);

  const filteredMeetings = useMemo(() => {
    const s = statusFilter;
    if (s === 'ALL') return meetings;
    return meetings.filter((m) => String(m.status || 'SCHEDULED').toUpperCase() === s);
  }, [meetings, statusFilter]);

  const upcomingCount = useMemo(
    () => meetings.filter((m) => new Date(m.start_time) > new Date() && String(m.status || '').toUpperCase() !== 'CANCELLED').length,
    [meetings],
  );

  const completedCount = useMemo(() => meetings.filter((m) => String(m.status || '').toUpperCase() === 'COMPLETED').length, [meetings]);

  const cancelledCount = useMemo(() => meetings.filter((m) => String(m.status || '').toUpperCase() === 'CANCELLED').length, [meetings]);

  const canSave = Boolean(form.title.trim() && form.start_time && companyId);

  const handleOpenCreate = async () => {
    setForm({ title: '', start_time: '', end_time: '', meeting_link: '', remarks: '' });
    setSelectedEmployees([]);
    setExtraEmails([]);
    setEmailInput('');
    await fetchEmployees();
    setOpen(true);
  };

  const handleCloseCreate = () => setOpen(false);

  const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const addEmailFromInput = () => {
    const email = emailInput.trim();
    if (!email) return;
    if (!isValidEmail(email)) return showToast('Invalid email format', 'error');
    setExtraEmails((prev) => (prev.includes(email) ? prev : [...prev, email]));
    setEmailInput('');
  };

  const removeEmail = (email: string) => setExtraEmails((prev) => prev.filter((e) => e !== email));

  const handleCreate = async () => {
    try {
      if (!canSave) return;
      setSaving(true);

      const { auth, company_id, user } = getAuth();
      const created_by = String(user?._id || user?.id || '');

      if (!company_id) throw new Error('company_id missing. Please login again.');
      if (!created_by) throw new Error('created_by missing. Please login again.');
      if (!auth) throw new Error('Auth missing. Please login again.');

      const payload = {
        title: form.title.trim(),
        start_time: new Date(form.start_time).toISOString(),
        end_time: form.end_time ? new Date(form.end_time).toISOString() : new Date(form.start_time).toISOString(),
        meeting_link: form.meeting_link?.trim(),
        remarks: form.remarks?.trim(),
        company_id,
        created_by,
        attendee_employee_ids: selectedEmployees.map((e) => e._id),
        attendee_emails: extraEmails,
      };

      const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/meetings/create`, {
        method: 'POST',
        headers: {
          Authorization: auth,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const txt = await response.text().catch(() => '');
        throw new Error(txt || `Create failed: ${response.status}`);
      }

      showToast('Meeting Scheduled', 'success');
      setOpen(false);
      await fetchMeetings();
    } catch (error: any) {
      console.error(error);
      showToast(error?.message || 'Create failed', 'error');
    } finally {
      setSaving(false);
    }
  };

  // ─── Cancel ──────────────────────────────────────────────────────────────────
  const openCancelDialog = (id: string) => {
    setCancelId(id);
    setCancelReason('');
    setCancelOpen(true);
  };

  const closeCancelDialog = () => {
    setCancelOpen(false);
    setCancelId('');
    setCancelReason('');
  };

  const confirmCancel = async () => {
    try {
      if (!cancelId) return;

      setCanceling(true);

      const { auth, user } = getAuth();
      const deleted_by = String(user?._id || user?.id || '');
      if (!deleted_by) throw new Error('user_id missing. Please login again.');
      if (!auth) throw new Error('Auth missing. Please login again.');

      const qs = new URLSearchParams();
      qs.set('deleted_by', deleted_by);
      if (cancelReason.trim()) qs.set('reason', cancelReason.trim());

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_APP_URL}/meetings/delete/${encodeURIComponent(cancelId)}?${qs.toString()}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: auth, // ✅ ALWAYS Bearer <token> <companyId>
            'Content-Type': 'application/json',
          },
        },
      );

      if (!response.ok) {
        const txt = await response.text().catch(() => '');
        throw new Error(txt || `Cancel failed: ${response.status}`);
      }

      showToast('Meeting cancelled', 'success');
      closeCancelDialog();
      await fetchMeetings();
    } catch (error: any) {
      console.error('Cancel failed:', error);
      showToast(error?.message || 'Cancel failed', 'error');
    } finally {
      setCanceling(false);
    }
  };

  // ─── Edit/Update ─────────────────────────────────────────────────────────────
  const openEditDialog = async (m: Meeting) => {
    const list = await fetchEmployees();
    setEditId(m._id);

    setForm({
      title: m.title || '',
      start_time: m.start_time ? new Date(m.start_time).toISOString().slice(0, 16) : '',
      end_time: m.end_time ? new Date(m.end_time).toISOString().slice(0, 16) : '',
      meeting_link: m.meeting_link || '',
      remarks: m.remarks || '',
    });

    const selected = list.filter((e) => (m.attendee_employee_ids || []).includes(e._id));
    setSelectedEmployees(selected);
    setExtraEmails(m.attendee_emails || []);
    setEmailInput('');
    setEditOpen(true);
  };

  const closeEditDialog = () => {
    setEditOpen(false);
    setEditId('');
  };

  const canUpdate = Boolean(editId && form.title.trim() && form.start_time);

  const handleUpdate = async () => {
    try {
      if (!canUpdate) return;

      setUpdating(true);

      const { auth, company_id } = getAuth();
      if (!auth) throw new Error('Auth missing. Please login again.');

      const payload: any = {
        title: form.title.trim(),
        start_time: new Date(form.start_time).toISOString(),
        end_time: form.end_time ? new Date(form.end_time).toISOString() : new Date(form.start_time).toISOString(),
        meeting_link: form.meeting_link?.trim(),
        remarks: form.remarks?.trim(),
        company_id,
        attendee_employee_ids: selectedEmployees.map((e) => e._id),
        attendee_emails: extraEmails,
      };

      const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/meetings/update/${encodeURIComponent(editId)}`, {
        method: 'PUT',
        headers: {
          Authorization: auth,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const txt = await response.text().catch(() => '');
        throw new Error(txt || `Update failed: ${response.status}`);
      }

      showToast('Meeting updated', 'success');
      closeEditDialog();
      await fetchMeetings();
    } catch (error: any) {
      console.error('Update failed:', error);
      showToast(error?.message || 'Update failed', 'error');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <Box
        sx={{
          minHeight: '100vh',
          background: '#F5F3FF',
          backgroundImage: `
            radial-gradient(ellipse at 0% 0%, rgba(167,139,250,0.25) 0%, transparent 45%),
            radial-gradient(ellipse at 100% 0%, rgba(236,72,153,0.15) 0%, transparent 40%),
            radial-gradient(ellipse at 50% 100%, rgba(124,58,237,0.1) 0%, transparent 50%)
          `,
          p: { xs: 2, md: 4 },
          fontFamily: '"DM Sans", sans-serif',
        }}
      >
        {/* Header */}
        <Box sx={{ mb: 3 }}>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            justifyContent="space-between"
            alignItems={{ xs: 'flex-start', sm: 'center' }}
            spacing={2}
          >
            <Box>
              <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 0.5 }}>
                <Box
                  sx={{
                    width: 36,
                    height: 36,
                    borderRadius: '10px',
                    background: 'linear-gradient(135deg, #7C3AED, #EC4899)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <VideoCallIcon sx={{ color: '#ffffff', fontSize: 20 }} />
                </Box>
                <Typography variant="h5" sx={{ color: '#1E1B4B' }}>
                  Meetings
                </Typography>

                <Chip
                  label={`${upcomingCount} upcoming`}
                  size="small"
                  sx={{
                    background: 'rgba(124,58,237,0.1)',
                    color: '#7C3AED',
                    border: '1px solid rgba(124,58,237,0.25)',
                    fontWeight: 700,
                    height: 22,
                    fontSize: '0.7rem',
                  }}
                />
                <Chip
                  label={`${completedCount} completed`}
                  size="small"
                  sx={{
                    background: 'rgba(16,185,129,0.10)',
                    color: '#059669',
                    border: '1px solid rgba(16,185,129,0.25)',
                    fontWeight: 700,
                    height: 22,
                    fontSize: '0.7rem',
                  }}
                />
                <Chip
                  label={`${cancelledCount} cancelled`}
                  size="small"
                  sx={{
                    background: 'rgba(239,68,68,0.10)',
                    color: '#EF4444',
                    border: '1px solid rgba(239,68,68,0.25)',
                    fontWeight: 700,
                    height: 22,
                    fontSize: '0.7rem',
                  }}
                />
              </Stack>
            </Box>

            <Stack direction="row" spacing={1.5} alignItems="center">
            

              <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenCreate} size="small">
                New Meeting
              </Button>
            </Stack>
          </Stack>
        </Box>

        {/* List */}
        {listLoading ? (
          <Stack alignItems="center" justifyContent="center" sx={{ py: 10 }} spacing={2}>
            <CircularProgress sx={{ color: '#7C3AED' }} size={36} thickness={3} />
            <Typography sx={{ color: '#9CA3AF', fontSize: '0.875rem' }}>Loading meetings...</Typography>
          </Stack>
        ) : filteredMeetings.length === 0 ? (
          <Box
            sx={{
              textAlign: 'center',
              py: 12,
              border: '1px dashed rgba(124,58,237,0.2)',
              borderRadius: '20px',
              background: 'rgba(255,255,255,0.6)',
              backdropFilter: 'blur(8px)',
            }}
          >
            <VideoCallIcon sx={{ fontSize: 52, color: '#E9D5FF', mb: 2 }} />
            <Typography sx={{ color: '#6B7280', fontWeight: 600, mb: 0.5 }}>No meetings found</Typography>
            <Typography sx={{ color: '#9CA3AF', fontSize: '0.875rem', mb: 3 }}>
              Create a new meeting to get started.
            </Typography>
            <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenCreate} size="small">
              Create Meeting
            </Button>
          </Box>
        ) : (
          <Stack spacing={1.5}>
            {filteredMeetings.map((m) => (
              <MeetingCard key={m._id} m={m} onCancel={openCancelDialog} onEdit={openEditDialog} />
            ))}
          </Stack>
        )}

        {/* Create Dialog */}
        <Dialog open={open} onClose={handleCloseCreate} fullWidth maxWidth="sm">
          <DialogTitle>Schedule a Meeting</DialogTitle>
          <DialogContent sx={{ px: 3.5, pb: 1 }}>
            <Stack spacing={2.5} sx={{ mt: 1.5 }}>
              <TextField label="Meeting Title" value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} fullWidth />

              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                <TextField
                  label="Start Time"
                  type="datetime-local"
                  InputLabelProps={{ shrink: true }}
                  value={form.start_time}
                  onChange={(e) => setForm((p) => ({ ...p, start_time: e.target.value }))}
                  fullWidth
                />
                <TextField
                  label="End Time"
                  type="datetime-local"
                  InputLabelProps={{ shrink: true }}
                  value={form.end_time}
                  onChange={(e) => setForm((p) => ({ ...p, end_time: e.target.value }))}
                  fullWidth
                />
              </Stack>

              <TextField
                label="Meeting Link"
                value={form.meeting_link}
                onChange={(e) => setForm((p) => ({ ...p, meeting_link: e.target.value }))}
                fullWidth
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LinkIcon sx={{ color: '#475569', fontSize: 18 }} />
                    </InputAdornment>
                  ),
                }}
              />

              <TextField
                label="Remarks / Agenda"
                value={form.remarks}
                onChange={(e) => setForm((p) => ({ ...p, remarks: e.target.value }))}
                multiline
                minRows={3}
                fullWidth
              />

              <Autocomplete
                multiple
                options={employees}
                loading={empLoading}
                value={selectedEmployees}
                onChange={(_, val) => setSelectedEmployees(val)}
                getOptionLabel={(opt) => empLabel(opt)}
                isOptionEqualToValue={(opt, val) => opt._id === val._id}
                renderInput={(params) => <TextField {...params} label="Attendees (Employees)" placeholder="Search employees..." />}
              />

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems="center">
                <TextField
                  label="Expect Employees (Email)"
                  value={emailInput}
                  size="small"
                  onChange={(e) => setEmailInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addEmailFromInput();
                    }
                  }}
                  fullWidth
                />
                <Button variant="contained" size="small" onClick={addEmailFromInput} sx={{ minWidth: 70, height: 38 }}>
                  Add
                </Button>
              </Stack>

              {extraEmails.length > 0 && (
                <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ gap: 1 }}>
                  {extraEmails.map((em) => (
                    <Chip key={em} label={em} onDelete={() => removeEmail(em)} deleteIcon={<DeleteIcon />} size="small" />
                  ))}
                </Stack>
              )}

              {!authHeader && <Alert severity="warning">Auth token missing. Please log in again.</Alert>}
            </Stack>
          </DialogContent>

          <DialogActions sx={{ px: 3.5, pb: 3, pt: 2, gap: 1.5 }}>
            <Button onClick={handleCloseCreate} variant="outlined" fullWidth>
              Cancel
            </Button>
            <Button variant="contained" onClick={handleCreate} disabled={!canSave || saving || !authHeader} fullWidth>
              {saving ? (
                <Stack direction="row" spacing={1} alignItems="center">
                  <CircularProgress size={16} sx={{ color: '#ffffff' }} />
                  <span>Creating...</span>
                </Stack>
              ) : (
                'Save & Send Invites'
              )}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={editOpen} onClose={closeEditDialog} fullWidth maxWidth="sm">
          <DialogTitle>Update Meeting</DialogTitle>
          <DialogContent sx={{ px: 3.5, pb: 1 }}>
            <Stack spacing={2.5} sx={{ mt: 1.5 }}>
              <TextField label="Meeting Title" value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} fullWidth />

              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                <TextField
                  label="Start Time"
                  type="datetime-local"
                  InputLabelProps={{ shrink: true }}
                  value={form.start_time}
                  onChange={(e) => setForm((p) => ({ ...p, start_time: e.target.value }))}
                  fullWidth
                />
                <TextField
                  label="End Time"
                  type="datetime-local"
                  InputLabelProps={{ shrink: true }}
                  value={form.end_time}
                  onChange={(e) => setForm((p) => ({ ...p, end_time: e.target.value }))}
                  fullWidth
                />
              </Stack>

              <TextField label="Meeting Link" value={form.meeting_link} onChange={(e) => setForm((p) => ({ ...p, meeting_link: e.target.value }))} fullWidth />

              <TextField
                label="Remarks / Agenda"
                value={form.remarks}
                onChange={(e) => setForm((p) => ({ ...p, remarks: e.target.value }))}
                multiline
                minRows={3}
                fullWidth
              />

              <Autocomplete
                multiple
                options={employees}
                loading={empLoading}
                value={selectedEmployees}
                onChange={(_, val) => setSelectedEmployees(val)}
                getOptionLabel={(opt) => empLabel(opt)}
                isOptionEqualToValue={(opt, val) => opt._id === val._id}
                renderInput={(params) => <TextField {...params} label="Attendees (Employees)" placeholder="Search employees..." />}
              />

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems="center">
                <TextField
                  label="Add Email"
                  value={emailInput}
                  size="small"
                  onChange={(e) => setEmailInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addEmailFromInput();
                    }
                  }}
                  fullWidth
                />
                <Button variant="contained" size="small" onClick={addEmailFromInput} sx={{ minWidth: 70, height: 38 }}>
                  Add
                </Button>
              </Stack>

              {extraEmails.length > 0 && (
                <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ gap: 1 }}>
                  {extraEmails.map((em) => (
                    <Chip key={em} label={em} onDelete={() => removeEmail(em)} deleteIcon={<DeleteIcon />} size="small" />
                  ))}
                </Stack>
              )}
            </Stack>
          </DialogContent>

          <DialogActions sx={{ px: 3.5, pb: 3, pt: 2, gap: 1.5 }}>
            <Button onClick={closeEditDialog} variant="outlined" fullWidth disabled={updating}>
              Cancel
            </Button>
            <Button variant="contained" onClick={handleUpdate} disabled={!canUpdate || updating || !authHeader} fullWidth>
              {updating ? (
                <Stack direction="row" spacing={1} alignItems="center">
                  <CircularProgress size={16} sx={{ color: '#ffffff' }} />
                  <span>Updating...</span>
                </Stack>
              ) : (
                'Update & Send Mail'
              )}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Cancel Dialog */}
        <Dialog open={cancelOpen} onClose={closeCancelDialog} fullWidth maxWidth="sm">
          <DialogTitle>Cancel Meeting</DialogTitle>
          <DialogContent sx={{ px: 3.5, pb: 1 }}>
            <Typography sx={{ color: '#6B7280', fontSize: '0.9rem', mt: 1 }}>
              This will cancel the meeting and send a cancellation email to all attendees.
            </Typography>

            <TextField
              label="Reason (optional)"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              fullWidth
              multiline
              minRows={3}
              sx={{ mt: 2 }}
            />
          </DialogContent>

          <DialogActions sx={{ px: 3.5, pb: 3, pt: 2, gap: 1.5 }}>
            <Button onClick={closeCancelDialog} variant="outlined" fullWidth disabled={canceling}>
              Keep Meeting
            </Button>
            <Button variant="contained" onClick={confirmCancel} fullWidth disabled={canceling || !authHeader}>
              {canceling ? (
                <Stack direction="row" spacing={1} alignItems="center">
                  <CircularProgress size={16} sx={{ color: '#ffffff' }} />
                  <span>Cancelling...</span>
                </Stack>
              ) : (
                'Cancel & Send Mail'
              )}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Toast */}
        <Snackbar
          open={toast.open}
          autoHideDuration={3000}
          onClose={() => setToast((p) => ({ ...p, open: false }))}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert
            onClose={() => setToast((p) => ({ ...p, open: false }))}
            severity={toast.type}
            sx={{
              borderRadius: '12px',
              fontWeight: 600,
              background: '#ffffff',
              border: `1px solid ${toast.type === 'success' ? 'rgba(124,58,237,0.3)' : 'rgba(239,68,68,0.3)'}`,
              color: toast.type === 'success' ? '#7C3AED' : '#EF4444',
              boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
              '& .MuiAlert-icon': { color: toast.type === 'success' ? '#7C3AED' : '#EF4444' },
            }}
          >
            {toast.msg}
          </Alert>
        </Snackbar>
      </Box>
    </ThemeProvider>
  );
};

export default MeetingsGrid;
