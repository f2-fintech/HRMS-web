'use client';

  import React, { useEffect, useMemo, useState } from 'react';

  import axios from 'axios';
  import {
    Avatar,
    Badge,
    Box,
    Button,
    Chip,
    Dialog,
    DialogContent,
    Divider,
    Drawer,
    Grid,
    InputAdornment,
    LinearProgress,
    Paper,
    Skeleton,
    Stack,
    TextField,
    Tooltip,
    Typography,
  } from '@mui/material';

  import AddIcon from '@mui/icons-material/Add';
  import SearchIcon from '@mui/icons-material/Search';
  import DownloadIcon from '@mui/icons-material/Download';
  import GroupIcon from '@mui/icons-material/Group';
  import CheckCircleIcon from '@mui/icons-material/CheckCircle';
  import PendingIcon from '@mui/icons-material/Pending';
  import BlockIcon from '@mui/icons-material/Block';
  import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
  import TrendingUpOutlinedIcon from '@mui/icons-material/TrendingUpOutlined';
  import DoneAllIcon from '@mui/icons-material/DoneAll';
  import HourglassBottomIcon from '@mui/icons-material/HourglassBottom';
  import UploadFileIcon from '@mui/icons-material/UploadFile';             // 👈 NEW
  import VisibilityIcon from '@mui/icons-material/Visibility';             // 👈 NEW
  import { useRouter } from 'next/navigation';   

import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import Pagination from '@mui/material/Pagination';

import RoleBasedPerformanceForm from '@/components/performance/RoleBasedPerformanceForm';
import EditSnapshotDialog from './EditSnapshotDialog';
import MyTeamPerformanceDialog from './MyTeamPerformanceDialog';

 
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

/* ===================== helpers ===================== */
const rupee = (n: number) => `₹${Intl.NumberFormat('en-IN').format(n)}`;
const asNum = (v: any) => (Number.isFinite(Number(v)) ? Number(v) : 0);
const fullName = (e: any) => `${e?.first_name || ''} ${e?.last_name || ''}`.trim();

  const getMeta = (status?: string): { color: any; icon: React.ReactNode; label: string; border: string } => {
    switch (status) {
      case 'done':
        return { color: 'success', icon: <CheckCircleIcon fontSize="small" />, label: 'Done', border: '#4caf50' };
      case 'in_progress':
        return { color: 'warning', icon: <PendingIcon fontSize="small" />, label: 'In Progress', border: '#ff9800' };
      default:
        return { color: 'default', icon: <BlockIcon fontSize="small" />, label: 'Planned', border: '#9e9e9e' };
    }
  };

/* ===== metrics mapping (for cards) ===== */
const computeMetrics = (doc: any) => {
  if (doc?.role === 'employee') {
    const exp = doc?.re?.morning || {};
    const eve = doc?.re?.evening || {};

    const candidates = [
      { key: 'logins', t: asNum(exp.expectedLogins), d: asNum(eve.loginsDone), unit: 'count' },
      { key: 'approvals', t: asNum(exp.expectedApprovals), d: asNum(eve.approvalsDone), unit: 'rupee' },
      { key: 'disbursal', t: asNum(exp.expectedDisbursal), d: asNum(eve.disbursalDone), unit: 'rupee' },
      { key: 'phoneConnects', t: asNum(exp.phoneConnects), d: asNum(eve.phoneConnectsDone), unit: 'count' },
      { key: 'physicalMeet', t: asNum(exp.physicalMeet), d: asNum(eve.physicalMeetDone), unit: 'count' },
    ];

    const picked = candidates.find((c) => c.t || c.d) || candidates[0];
    let status: 'done' | 'in_progress' | 'planned' = 'planned';

    if (picked.d >= picked.t && picked.t > 0) status = 'done';
    else if (picked.d > 0 || picked.t > 0) status = 'in_progress';

    return {
      taskTitle: `RE ${picked.key} — ${doc?.date || ''}`,
      description: `Target: ${picked.t} • Done: ${picked.d}`,
      target: picked.t,
      completed: picked.d,
      status,
      unit: picked.unit,
    };
  }

  if (doc?.role === 'manager') {
    const m = doc?.manager || {};
    const exp = m?.morning?.expected || {};
    const eve = m?.evening || {};

      const loanTargetRu = (Number(m?.morning?.teamTargetLoanLacs || 0) * 100000);

      const logins = { key: 'logins', t: asNum(exp.loginsTeam), d: asNum(eve.teamLoginsDone), unit: 'count' };
      const apprAmt = { key: 'approvals ₹', t: asNum(exp.approvalLacs) * 100000, d: asNum(eve.teamApprovalDoneAmount), unit: 'rupee' };
      const disbAmt = { key: 'disbursal ₹', t: asNum(exp.disbursalAmount) || loanTargetRu, d: asNum((eve as any).teamDisbursalDoneAmount ?? 0), unit: 'rupee' };

    const candidates = [logins, apprAmt, disbAmt].filter((x) => x.t || x.d);
    const picked = candidates[0] || logins;

    let status: 'done' | 'in_progress' | 'planned' = 'planned';

    if ((picked.d || 0) >= (picked.t || 0) && (picked.t || 0) > 0) status = 'done';
    else if ((picked.d || 0) > 0 || (picked.t || 0) > 0) status = 'in_progress';

    return {
      taskTitle: `Manager ${picked.key} — ${doc?.date || ''}`,
      description: `Target: ${picked.t} • Done: ${picked.d}`,
      target: picked.t || 0,
      completed: picked.d || 0,
      status,
      unit: picked.unit,
    };
  }

    return { taskTitle: 'Snapshot', description: '', target: 0, completed: 0, status: 'planned' as const, unit: 'count' as const };
  };

const mapServerToCardItem = (doc: any) => {
  const m = computeMetrics(doc);

  return {
    _id: doc?._id,
    date: doc?.date,
    role: doc?.role,
    employee: doc?.employee,
    ...m,
    __raw: doc,
  };
};

/* ===================== Drawer helpers ===================== */
type Pair = { key: string; label: string; planned: number; done: number; unit: 'count' | 'rupee' };

  const pct = (planned = 0, done = 0) => {
    const p = Number(planned) || 0, d = Number(done) || 0;
    if (p <= 0) return d > 0 ? 100 : 0;
    return Math.max(0, Math.min(100, Math.round((d / p) * 100)));
  };

const prettyNum = (n: number, unit: 'rupee' | 'count') =>
  unit === 'rupee' ? `₹${Intl.NumberFormat('en-IN').format(n || 0)}` : `${n || 0}`;

  const MetricRow = ({ pair }: { pair: Pair }) => {
    const p = Number(pair.planned) || 0;
    const d = Number(pair.done) || 0;
    const progress = pct(p, d);
    const achieved = p > 0 && d >= p;
    const pending = Math.max(p - d, 0);

    return (
      <Paper
        variant="outlined"
        sx={{
          p: 1.5, borderRadius: 2, mb: 1.25,
          background: achieved
            ? 'linear-gradient(180deg, rgba(76,175,80,0.08) 0%, rgba(76,175,80,0.02) 100%)'
            : 'linear-gradient(180deg, #fff 0%, #fafbff 100%)',
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1}>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{pair.label}</Typography>
            <Stack direction="row" spacing={1} sx={{ mt: 0.5, flexWrap: 'wrap' }}>
              <Chip size="small" icon={<TrendingUpOutlinedIcon />} label={`Planned: ${prettyNum(p, pair.unit)}`} variant="outlined" />
              <Chip size="small" color={achieved ? 'success' : 'default'} icon={<DoneAllIcon />} label={`Done: ${prettyNum(d, pair.unit)}`} variant={achieved ? 'filled' : 'outlined'} />
              <Chip size="small" color={achieved ? 'success' : 'warning'} icon={<HourglassBottomIcon />} label={achieved ? 'Achieved' : `Pending: ${prettyNum(pending, pair.unit)}`} variant={achieved ? 'outlined' : 'filled'} />
            </Stack>
            <Box sx={{ mt: 1 }}>
              <LinearProgress variant="determinate" value={progress} sx={{ height: 8, borderRadius: 10 }} />
              <Typography variant="caption" color="text.secondary">{progress}% achieved</Typography>
            </Box>
          </Box>
        </Stack>
      </Paper>
    );
  };

const buildPairsForEmployee = (raw: any): Pair[] => {
  const m = raw?.re?.morning || {};
  const e = raw?.re?.evening || {};

    return [
      { key: 'phone', label: 'Phone Connects', planned: Number(m.phoneConnects || 0), done: Number(e.phoneConnectsDone || 0), unit: 'count' },
      { key: 'meet', label: 'Physical Meets', planned: Number(m.physicalMeet || 0), done: Number(e.physicalMeetDone || 0), unit: 'count' },
      { key: 'login', label: 'Logins', planned: Number(m.expectedLogins || 0), done: Number(e.loginsDone || 0), unit: 'count' },
      { key: 'appr', label: 'Approvals (₹)', planned: Number(m.expectedApprovals || 0), done: Number(e.approvalsDone || 0), unit: 'rupee' },
      { key: 'disb', label: 'Disbursals (₹)', planned: Number(m.expectedDisbursal || 0), done: Number(e.disbursalDone || 0), unit: 'rupee' },
    ];
  };

const buildPairsForManager = (raw: any): Pair[] => {
  const m = raw?.manager?.morning || {};
  const e = raw?.manager?.evening || {};
  const exp = m?.expected || {};

    const plannedLogins = Number(exp.loginsTeam || 0); // count
    const plannedApproval = Number(exp.approvalLacs || 0) * 100000; // ₹ from lacs

    const plannedDisbursal =
      Number(exp.disbursalAmount || 0) || Number(m.teamTargetLoanLacs || 0) * 100000; // ₹

    const doneLogins = Number(e.teamLoginsDone || 0); // count
    const doneApproval = Number(e.teamApprovalDoneAmount || 0); // ₹
    const doneDisbursalRaw = (e as any)?.teamDisbursalDoneAmount; // optional/legacy

    const pairs: Pair[] = [
      { key: 'logins', label: 'Team Logins', planned: plannedLogins, done: doneLogins, unit: 'count' },
      { key: 'appr', label: 'Team Approvals (₹)', planned: plannedApproval, done: doneApproval, unit: 'rupee' },
    ];

  if (Number.isFinite(Number(doneDisbursalRaw)) || plannedDisbursal) {
    pairs.push({
      key: 'disb',
      label: 'Team Disbursal (₹)',
      planned: plannedDisbursal,
      done: Number.isFinite(Number(doneDisbursalRaw)) ? Number(doneDisbursalRaw) : 0,
      unit: 'rupee',
    });
  }

  return pairs;
};

  const HeaderBand = ({ role, emp, dateStr }: any) => (
    <Box
      sx={{
        mb: 2,
        p: 2,
        borderRadius: 3,
        position: 'relative',
        color: '#fff',
        overflow: 'hidden',
        background:
          role === 'manager'
            ? 'linear-gradient(135deg, #1E3368 0%, #6E8EF5 100%)'
            : 'linear-gradient(135deg, #0EA5E9 0%, #22C55E 100%)',
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(1200px 300px at -10% -20%, rgba(255,255,255,0.15), transparent)',
        }}
      />
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ position: 'relative' }}>
        <Avatar src={emp?.image || ''} sx={{ width: 42, height: 42, border: '2px solid rgba(255,255,255,.6)' }} />
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 900 }} noWrap>
            {role === 'manager' ? 'Manager Snapshot' : 'Employee Snapshot'}
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.95 }} noWrap>
            {(emp?.first_name || '') + ' ' + (emp?.last_name || '')} • {dateStr}
          </Typography>
        </Box>
        <Chip
          size="small"
          label={role}
          sx={{ bgcolor: 'rgba(255,255,255,.18)', color: '#fff', borderColor: 'rgba(255,255,255,.4)' }}
          variant="outlined"
        />
      </Stack>
    </Box>
  );

  const DetailsDrawer = ({ open, onClose, doc }: { open: boolean; onClose: () => void; doc: any | null }) => {
    if (!doc) return null;
    const raw = doc.__raw ? doc.__raw : doc;
    const role: 'employee' | 'manager' = raw?.role;
    const emp = raw?.employee;
    const dateStr = raw?.date ? dayjs(raw.date).format('DD MMM YYYY') : '—';

    const pairs: Pair[] = role === 'manager' ? buildPairsForManager(raw) : buildPairsForEmployee(raw);

    const totals = pairs.reduce(
      (acc, p) => ({ planned: acc.planned + (Number(p.planned) || 0), done: acc.done + (Number(p.done) || 0) }),
      { planned: 0, done: 0 }
    );

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{ sx: { width: 520, p: 2.25, bgcolor: 'background.default' } }}
    >
      <HeaderBand role={role} emp={emp} dateStr={dateStr} />

        <Box sx={{ mt: 2.5 }}>
          <Typography variant="overline" sx={{ fontWeight: 800, letterSpacing: 1 }}>
            Comparison — Morning vs Evening
          </Typography>
          <Divider sx={{ mb: 1 }} />
          {pairs.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              No data to compare.
            </Typography>
          ) : (
            pairs.map((pair) => <MetricRow key={pair.key} pair={pair} />)
          )}
        </Box>

        <Box sx={{ mt: 2.5 }}>
          <Typography variant="overline" sx={{ fontWeight: 800, letterSpacing: 1 }}>
            Summary
          </Typography>
          <Divider sx={{ mb: 1 }} />
          <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">
                  Total Planned
                </Typography>
                <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                  {Intl.NumberFormat('en-IN').format(totals.planned)}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">
                  Total Done
                </Typography>
                <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                  {Intl.NumberFormat('en-IN').format(totals.done)}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <LinearProgress
                  variant="determinate"
                  value={pct(totals.planned, totals.done)}
                  sx={{ height: 10, borderRadius: 2 }}
                />
                <Typography variant="caption" color="text.secondary">
                  {pct(totals.planned, totals.done)}% overall achieved
                </Typography>
              </Grid>
            </Grid>
          </Paper>
        </Box>
      </Drawer>
    );
  };

  /* -------------------- MTD map type -------------------- */
  type MTD = { logins: number; approvals: number; disbursal: number; loading?: boolean };

const PerformanceCard = ({
  item,
  onEdit,
  onDetails,
  mtd,
}: {
  item: any;
  onEdit: (id: string) => void;
  onDetails: (doc: any) => void;
  mtd?: MTD;
}) => {
  const meta = getMeta(item?.status);
  const raw = item.__raw ? item.__raw : item;
  const role = raw?.role;

    // ----- EMP values -----
    const empMorning = raw?.re?.morning || {};
    const empEvening = raw?.re?.evening || {};

    // ----- MANAGER values (DTO aligned) -----
    const mgrMorning = raw?.manager?.morning || {};
    const mgrExpected = mgrMorning?.expected || {};
    const mgrEvening = raw?.manager?.evening || {};

    // ---------- MORNING (Targets) ----------
    const morningLogin = role === 'manager'
      ? asNum(mgrExpected.loginsTeam ?? 0)
      : asNum(empMorning.expectedLogins ?? 0);

    const morningApproval = role === 'manager'
      ? asNum(mgrExpected.approvalLacs ?? 0) * 100000
      : asNum(empMorning.expectedApprovals ?? 0);

    const morningDisbursal = role === 'manager'
      ? asNum((mgrExpected.disbursalAmount ?? 0) || ((Number(mgrMorning.teamTargetLoanLacs || 0) || 0) * 100000))
      : asNum(empMorning.expectedDisbursal ?? 0);

    // ---------- EVENING (Actuals) ----------
    const eveningLogin = role === 'manager'
      ? asNum(mgrEvening.teamLoginsDone ?? 0)
      : asNum(empEvening.loginsDone ?? 0);

    const eveningApproval = role === 'manager'
      ? asNum(mgrEvening.teamApprovalDoneAmount ?? 0)
      : asNum(empEvening.approvalsDone ?? 0);

  const mgrEveningDisbursalMaybe = (mgrEvening as any)?.teamDisbursalDoneAmount;

    const eveningDisbursal = role === 'manager'
      ? (Number.isFinite(Number(mgrEveningDisbursalMaybe)) ? asNum(mgrEveningDisbursalMaybe) : null)
      : asNum(empEvening.disbursalDone ?? 0);

    const Stat = ({ label, value }: { label: string; value: number | null }) => {
      if (value === null || value === undefined) return null;

      return (
        <Chip
          size="small"
          label={`${label}: ${Intl.NumberFormat('en-IN').format(Number(value) || 0)}`}
          variant="outlined"
          sx={{ height: 24, '& .MuiChip-label': { px: 1 } }}
        />
      );
    };

    return (
      <Paper
        elevation={0}
        sx={{
          position: 'relative',
          borderRadius: 3,
          p: 2.5,
          overflow: 'hidden',
          border: '1px solid',
          borderColor: 'divider',
          background: 'linear-gradient(180deg,#fff 0%,#fafbff 100%)',
          transition: 'all .25s ease',
          '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 12px 30px rgba(0,0,0,0.10)' },
        }}
      >
        <Box sx={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 6, bgcolor: meta.border }} />

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
          <Avatar src={item?.employee?.image || ''} alt="emp" sx={{ width: 46, height: 46, border: '2px solid #fff', boxShadow: '0 3px 12px rgba(0,0,0,.12)' }} />
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography noWrap variant="subtitle1" sx={{ fontWeight: 900, letterSpacing: .2 }}>
              {(item?.employee?.first_name || '') + ' ' + (item?.employee?.last_name || '') || '—'}(
              {String(item?.employee?.role_priority) === '2' ? 'Manager' : (item?.employee?.designation || '—')})
            </Typography>
          </Box>
        </Box>

        {/* === Morning vs Evening (targets vs actuals) === */}
        <Box sx={{ mt: 1.25 }}>
          <Grid container spacing={1.25}>
            {/* Morning */}
            <Grid item xs={12} sm={6}>
              <Paper variant="outlined" sx={{ p: 1, borderRadius: 2 }}>
                <Typography variant="caption" sx={{ fontWeight: 800, letterSpacing: .3 }}>
                  Morning Commitment
                </Typography>

                {/* One line per stat */}
                <Stack direction="column" spacing={0.75} sx={{ mt: .5 }}>
                  <Box sx={{ width: 1 }}>
                    <Stat label="Login" value={morningLogin} />
                  </Box>
                  <Box sx={{ width: 1 }}>
                    <Stat label="Approval" value={morningApproval} />
                  </Box>
                  <Box sx={{ width: 1 }}>
                    <Stat label="Disbursal" value={morningDisbursal} />
                  </Box>
                </Stack>
              </Paper>
            </Grid>

            {/* Evening */}
            <Grid item xs={12} sm={6}>
              <Paper variant="outlined" sx={{ p: 1, borderRadius: 2 }}>
                <Typography variant="caption" sx={{ fontWeight: 800, letterSpacing: .3 }}>
                  Evening Delivery
                </Typography>

                {/* One line per stat */}
                <Stack direction="column" spacing={0.75} sx={{ mt: .5 }}>
                  <Box sx={{ width: 1 }}>
                    <Stat label="Login" value={eveningLogin} />
                  </Box>
                  <Box sx={{ width: 1 }}>
                    <Stat label="Approval" value={eveningApproval} />
                  </Box>
                  <Box sx={{ width: 1 }}>
                    <Stat label="Disbursal" value={eveningDisbursal} />
                  </Box>
                </Stack>
              </Paper>
            </Grid>
          </Grid>
        </Box>

        <Divider sx={{ my: 1.25 }} />

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1 }}>
          <Chip
            size="small"
            icon={<CalendarMonthIcon />}
            label={item?.date ? dayjs(item.date).format('DD MMM YYYY') : '-'}
            variant="outlined"
          />
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button size="small" variant="outlined" onClick={() => onDetails(item)}>
              Details
            </Button>
            <Button size="small" variant="contained" color="info" onClick={() => onEdit(item?._id)}>
              Edit
            </Button>
          </Box>
        </Box>
      </Paper>
    );
  };

/* ===================== Main ===================== */
export default function PerformanceGrid() {
  const [items, setItems] = useState<any[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);

  const [month, setMonth] = useState<number>(new Date().getMonth() + 1);
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [selectedDate, setSelectedDate] = useState<Dayjs | null>(null);

  const [searchName, setSearchName] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [limit] = useState<number>(12);

  const [showForm, setShowForm] = useState(false);
  const [selectedPerformanceId, setSelectedPerformanceId] = useState<string | null>(null);

  const [userRole, setUserRole] = useState<string>('');
  const [userDesignation, setUserDesignation] = useState<string>('');

  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsDoc, setDetailsDoc] = useState<any | null>(null);

  const [editOpen, setEditOpen] = useState(false);
  const [editDoc, setEditDoc] = useState<any | null>(null);

  const [teamDlgOpen, setTeamDlgOpen] = useState(false);

  const [teams, setTeams] = useState<any[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [loadingTeams, setLoadingTeams] = useState(true);

  const [teamsPerfLoading, setTeamsPerfLoading] = useState(false);

    const [mtdMap, setMtdMap] = useState<Record<string, { logins: number; approvals: number; disbursal: number; loading?: boolean }>>({});

    const [empPerf, setEmpPerf] = useState<Record<string, {
      target: number; done: number; status: 'done' | 'in_progress' | 'planned'; date?: string; raw?: any;
    }>>({});

    // 🔹 NEW: router & uploading state + helpers
    const router = useRouter();


    const [uploading, setUploading] = useState(false);

    const VIEW_PATH = '/performance-upload';
    const pickDate = (selectedDate ? selectedDate : dayjs()).format('YYYY-MM-DD'); // for both list + view redirect

    // read user & load teams
    useEffect(() => {
      const user = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || '{}') : {};
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

    setUserRole(String(user?.role || ''));
    setUserDesignation(String(user?.designation || ''));

      const base = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:5500';
      const url = `${base}/teams/manager-one/${user?.id}`;

      const fetchTeamsForUser = async () => {
        try {
          if (!user?.id || !token) {
            setLoadingTeams(false);
            return;
          }

          const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
          const raw = await res.json();

          setTeams(raw.employees || []);
        } catch {
          setTeams([]); setSelectedTeamId(null);
        } finally {
          setLoadingTeams(false);
        }
      };

    fetchTeamsForUser();
  }, []);

    // latest snapshot per employee (for dialog chips)
    useEffect(() => {
      const run = async () => {
        try {
          if (!Array.isArray(teams) || teams.length === 0) {
            setEmpPerf({});
            return;
          }

        setTeamsPerfLoading(true);

          const employee_ids = teams.map((e: any) => String(e?._id)).filter(Boolean).join(',');

          if (!employee_ids) {
            setEmpPerf({});
            return;
          }

          const resp = await api.get('/performance/by-employee-ids', { params: { employee_ids } });
          const arr: any[] = Array.isArray(resp.data) ? resp.data : (Array.isArray(resp.data?.data) ? resp.data.data : []);

        const perEmp: Record<string, any> = {};

        for (const doc of arr) {
          const d = dayjs(doc?.date);

          if (!d.isValid()) continue;
          if (d.month() + 1 !== month || d.year() !== year) continue;

            const empId = String(doc?.owner_id || doc?.employee?._id || doc?.employee_id || '').trim();

          if (!empId) continue;

          const previous = perEmp[empId];

            const isLater =
              !previous ||
              dayjs(doc.date).isAfter(dayjs(previous.date)) ||
              (doc?.createdAt && previous?.createdAt && dayjs(doc.createdAt).isAfter(dayjs(previous.createdAt)));

          if (isLater) perEmp[empId] = doc;
        }

        const mapped: typeof empPerf = {};

        Object.entries(perEmp).forEach(([empId, doc]: any) => {
          const m = computeMetrics(doc);

          mapped[empId] = {
            target: m.target || 0,
            done: m.completed || 0,
            status: m.status,
            date: doc?.date,
            raw: doc,
          };
        });

        setEmpPerf(mapped);
      } catch {
        setEmpPerf({});
      } finally {
        setTeamsPerfLoading(false);
      }
    };

    run();
  }, [teams, month, year]);

    // --- Month-to-date aggregation per employee ---
    const fetchMTDFor = async (empId: string) => {
      if (!empId) return;
      if (mtdMap[empId]?.loading) return;

      setMtdMap((m) => ({ ...m, [empId]: { ...(m[empId] || { logins: 0, approvals: 0, disbursal: 0 }), loading: true } }));

      try {
        const params: any = { month, year, limit: 500, page: 1, employee_id: empId, date: pickDate };

      const res = await api.get('/performance/list', { params });
      let list: any[] = [];
      const payload = res?.data || {};

      if (Array.isArray(payload.data)) {
        if (payload.data.length > 0 && Array.isArray(payload.data[0]?.records)) {
          payload.data.forEach((g: any) =>
            (g.records || []).forEach((r: any) => {
              if (!r.employee && g.employee) r.employee = g.employee;
              list.push(r);
            })
          );
        } else {
          list = payload.data;
        }
      }

        // Hard date filter
        list = list.filter((d: any) => dayjs(d?.date).format('YYYY-MM-DD') === pickDate);

        const sums = { logins: 0, approvals: 0, disbursal: 0 };

      for (const doc of list) {
        const raw = doc?.__raw ? doc.__raw : doc;

          if (raw?.role !== 'employee') continue;
          const eve = raw?.re?.evening || {};

          sums.logins += Number(eve.loginsDone || 0);
          sums.approvals += Number(eve.approvalsDone || 0);
          sums.disbursal += Number(eve.disbursalDone || 0);
        }

        setMtdMap((m) => ({ ...m, [empId]: { ...sums, loading: false } }));
      } catch {
        setMtdMap((m) => ({ ...m, [empId]: { logins: 0, approvals: 0, disbursal: 0, loading: false } }));
      }
    };

    // ensure MTD for visible employees
    useEffect(() => {
      const ids = Array.from(
        new Set(
          items
            .map((it) => String(it?.employee?._id || it?.employee_id || it?.owner_id || ''))
            .filter(Boolean)
        )
      );

      ids.forEach((id) => {
        const cached = mtdMap[id];
        if (!cached) fetchMTDFor(id);
      });
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [items, month, year, selectedDate]);

  const fetchList = async () => {
    try {
      setLoading(true);
      const params: any = { page, limit, month, year, date: pickDate };

      if (searchName.trim()) params.keyword = searchName.trim();
      if (userRole === '2') params.role = 'manager';
      if (userRole === '3') params.role = 'employee';
      if (selectedTeamId) params.team_id = selectedTeamId;

      const res = await api.get('/performance/list', { params });
      let { data, total } = res.data || { data: [], total: 0 };

      if (Array.isArray(data) && data.length > 0 && Array.isArray(data[0]?.records)) {
        const flat: any[] = [];

        data.forEach((g: any) =>
          (g.records || []).forEach((r: any) => {
            if (!r.employee && g.employee) r.employee = g.employee;
            flat.push(r);
          })
        );
        data = flat;
      }

        // Hard date guard
        data = (data || []).filter((d: any) => dayjs(d?.date).format('YYYY-MM-DD') === pickDate);

        // Client name search safety
        const needle = searchName.trim().toLowerCase();

        if (needle) {
          data = (data || []).filter((r: any) => {
            const emp = r?.employee || {};
            const name = `${emp?.first_name || ''} ${emp?.last_name || ''}`.trim().toLowerCase();

          return name.includes(needle);
        });
      }

      setItems((data || []).map(mapServerToCardItem));
      setTotal(Number(total) || data?.length || 0);
    } finally {
      setLoading(false);
    }
  };

    // refetch when filters change
    useEffect(() => {
      if (userRole && (teams.length === 0 || selectedTeamId || userRole !== '2')) fetchList();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userRole, month, year, selectedDate, searchName, page, limit, selectedTeamId]);

  const handleEditClick = (id: string) => {
    const found = items.find((x) => x?._id === id);

    if (!found) return;
    setEditDoc(found);
    setEditOpen(true);
  };

  const openDetails = (doc: any) => {
    setDetailsDoc(doc);
    setDetailsOpen(true);
  };

    const onMonthChange = (d: Dayjs | null) => {
      if (!d) return;
      setMonth(d.month() + 1);
      setYear(d.year());
      setPage(1);
      setMtdMap({});
      setSelectedDate(null); // month change resets exact date
    };

  const onDateChange = (d: Dayjs | null) => {
    setSelectedDate(d);

    if (d) {
      setMonth(d.month() + 1);
      setYear(d.year());
      setPage(1);
      setMtdMap({});
    }
  };

    const exportCSV = () => {
      const monthNames = [
        'January',
        'February',
        'March',
        'April',
        'May',
        'June',
        'July',
        'August',
        'September',
        'October',
        'November',
        'December',
      ];
      const fileName = `${monthNames[month - 1]} ${year}${
        selectedDate ? ' - ' + selectedDate.format('YYYY-MM-DD') : ''
      } performance_summary.csv`;

      const rows = items.map((p: any) => {
        const name = `${p?.employee?.first_name || ''} ${p?.employee?.last_name || ''}`.trim();
        const pretty = (n: number) => (p?.unit === 'rupee' ? rupee(n) : n);

      return [
        name,
        p?.date ? dayjs(p.date).format('YYYY-MM-DD') : '',
        p?.taskTitle || '',
        pretty(p?.target ?? 0),
        pretty(p?.completed ?? 0),
        pretty(Math.max((p?.target ?? 0) - (p?.completed ?? 0), 0)),
        p?.status || '',
      ];
    });

      const header = [['Employee Name', 'Date', 'Task Title', 'Target', 'Completed', 'Remaining', 'Status']];
      const csvContent = [...header, ...rows].map((r) => r.join(',')).join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const a = document.createElement('a');

    a.href = URL.createObjectURL(blob);
    a.setAttribute('download', fileName);
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };



    /* ---------- Header toolbar (Export right aligned) ---------- */
    const HeaderToolbar = useMemo(
      () => (
        <Paper
          elevation={0}
          sx={{
            px: 2,
            py: 2,
            borderRadius: 3,
            border: '1px solid',
            borderColor: 'divider',
            background: 'linear-gradient(180deg,#ffffff 0%,#fafbff 100%)',
          }}
        >
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={3}>
              <Box>
                <Typography sx={{ fontSize: { xs: 22, md: 28 }, fontWeight: 900, letterSpacing: 0.2 }} variant="h5">
                  Performance
                </Typography>
                <Typography variant="subtitle2" sx={{ opacity: 0.7, fontWeight: 700 }}>
                  Dashboard / Performance
                </Typography>
              </Box>
            </Grid>

          <Grid item xs={12} md={2}>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DatePicker
                views={['month', 'year']}
                label="Select Month and Year"
                value={dayjs(new Date(year, month - 1))}
                onChange={onMonthChange}
                slotProps={{ textField: { fullWidth: true, size: 'medium' } }}
              />
            </LocalizationProvider>
          </Grid>

          <Grid item xs={12} md={2}>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DatePicker
                label="Select Date"
                value={selectedDate}
                onChange={onDateChange}
                slotProps={{ textField: { fullWidth: true, size: 'medium' } }}
              />
            </LocalizationProvider>
          </Grid>

            <Grid
              item
              xs={12}
              md="auto"
              sx={{ ml: 'auto', display: 'flex', justifyContent: 'flex-end' }}
            >
              <Stack direction="row" spacing={1} sx={{ flexWrap: 'nowrap', alignItems: 'center' }}>
                {/* Admin-only: Upload + View */}
                {userRole =='1' && (
                  <>
                    {/* <Button
                      variant="contained"
                      color="secondary"
                      startIcon={<UploadFileIcon />}
                      component="label"
                      disabled={uploading}
                      sx={{ borderRadius: 2, fontWeight: 800, whiteSpace: 'nowrap' }}
                      size="small"
                    >
                      {uploading ? 'Uploading…' : 'Upload XLSX'}
                      <input
                        hidden
                        type="file"
                        accept=".xlsx,.xls"
                        onChange={(e) => handleUploadXlsx(e.target.files?.[0] || null)}
                      />
                    </Button> */}

                    <Button
                      variant="outlined"
                      startIcon={<VisibilityIcon />}
                      onClick={() => router.push(`./performance-upload/?date=${pickDate}`)}
                      sx={{ borderRadius: 2, fontWeight: 600, whiteSpace: 'nowrap' }}
                      size="small"
                    >
                      View Performance
                    </Button>
                  </>
                )}

                {/* Add Performance (non-admins) */}
                {String(userRole) !== '1' && (
                  <Button
                    variant="contained"
                    color="warning"
                    startIcon={<AddIcon />}
                    onClick={() => {
                      setSelectedPerformanceId(null);
                      setShowForm(true);
                    }}
                    sx={{
                      borderRadius: 2,
                      fontWeight: 800,
                      whiteSpace: 'nowrap',
                      textTransform: 'none',
                      minWidth: 'auto',
                    }}
                    size="small"
                  >
                    Add Performance
                  </Button>
                )}

                {/* Team Performance (hide for admin/some roles) */}
                {!['1', '3', '4'].includes(String(userRole)) && (
                  <Button
                    variant="outlined"
                    startIcon={<GroupIcon />}
                    onClick={() => setTeamDlgOpen(true)}
                    sx={{
                      borderRadius: 2,
                      fontWeight: 400,
                      whiteSpace: 'nowrap',
                      textTransform: 'none',
                      minWidth: 'auto',
                    }}
                    size="small"
                  >
                    Team Performance
                  </Button>
                )}

                {/* Export */}
                <Button
                  variant="contained"
                  startIcon={<DownloadIcon />}
                  onClick={exportCSV}
                  size="small"
                  sx={{
                    height: 40,
                    px: 2,
                    fontWeight: 800,
                    borderRadius: 2,
                    backgroundImage:
                      'linear-gradient(45deg,#1E3368 0%, #F09819 51%, #FF512F 100%)',
                    color: '#fff',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Export
                </Button>
              </Stack>
            </Grid>
          </Grid>

          {/* Second row: search (employee name) */}
          <Grid container spacing={2} alignItems="center" sx={{ mt: 1 }}>
            {userRole === '1' && (
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Search Employee"
                  value={searchName}
                  size="small"
                  onChange={(e) => {
                    setSearchName(e.target.value);
                    setPage(1);
                  }}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <SearchIcon />
                      </InputAdornment>
                    ),
                    sx: { '.MuiInputBase-input': { py: 3 } },
                  }}
                />
              </Grid>
            )}

            <Grid item xs={false} md />

            {/* (Export button already above) */}
          </Grid>
        </Paper>
      ),
      // deps
      [year, month, selectedDate, userRole, uploading, searchName]
    );

    return (
      <Box>
        {/* External edit dialog */}
        <EditSnapshotDialog
          open={editOpen}
          onClose={() => setEditOpen(false)}
          doc={editDoc}
          onSaved={fetchList}
          canAdminComment={userRole === '1'}
        />

        {/* Details drawer */}
        <DetailsDrawer open={detailsOpen} onClose={() => setDetailsOpen(false)} doc={detailsDoc} />

        {/* My Team Performance dialog */}
        <MyTeamPerformanceDialog
          open={teamDlgOpen}
          onClose={() => setTeamDlgOpen(false)}
          teams={teams}
          month={month}
          year={year}
          loading={loadingTeams || teamsPerfLoading}
          empPerf={empPerf as any}
          onSelectEmployee={(emp) => {
            setSearchName(fullName(emp));
            setPage(1);
            setTeamDlgOpen(false);
          }}
        />

        {/* Header / Filters */}
        <Box sx={{ position: 'sticky', top: 0, zIndex: 1, bgcolor: 'background.default', p: 2, pb: 1 }}>
          {HeaderToolbar}

          {/* Create Form Dialog */}
          <Dialog open={showForm} onClose={() => setShowForm(false)} fullWidth maxWidth="md">
            <DialogContent sx={{ p: 0 }}>
              <RoleBasedPerformanceForm
                role={userRole}
                performanceId={selectedPerformanceId}
                prefillDate={dayjs().format('YYYY-MM-DD')}
                performances={items}
                handleClose={() => {
                  setShowForm(false);
                  fetchList();
                }}
                designation={userDesignation}
              />
            </DialogContent>
          </Dialog>
        </Box>

        {/* GRID */}
        <Box sx={{ px: 2, pt: 3, pb: 6 }}>
          {loading ? (
            <Grid container spacing={2}>
              {Array.from({ length: 6 }).map((_, i) => (
                <Grid key={i} item xs={12} sm={6} md={6}>
                  <Paper sx={{ p: 2.5, borderRadius: 3 }}>
                    <Skeleton variant="rectangular" height={130} sx={{ borderRadius: 2 }} />
                    <Box sx={{ mt: 2 }}>
                      <Skeleton width="60%" />
                      <Skeleton width="40%" />
                    </Box>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          ) : items.length === 0 ? (
            <Paper
              variant="outlined"
              sx={{ p: 5, borderRadius: 3, textAlign: 'center', background: 'linear-gradient(180deg,#ffffff 0%,#fafafa 100%)' }}
            >
              <Typography variant="h6" sx={{ fontWeight: 900, mb: 0.75 }}>
                No records
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Try changing month/year, date, search, or open <b>My Team Performance</b>.
              </Typography>
            </Paper>
          ) : (
            <Grid container spacing={2.25}>
              {items.map((p) => {
                const empId = String(p?.employee?._id || p?.employee_id || p?.owner_id || '');
                const mtd = empId ? (mtdMap[empId] || { logins: 0, approvals: 0, disbursal: 0, loading: true }) : undefined;

                return (
                  <Grid key={p?._id} item xs={12} sm={6} md={6}>
                    <PerformanceCard item={p} onEdit={handleEditClick} onDetails={openDetails} mtd={mtd} />
                  </Grid>
                );
              })}
            </Grid>
          )}
        </Box>

        {/* Pagination */}
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: -2, mb: 4 }}>
          <Pagination
            count={Math.max(1, Math.ceil((total || 0) / limit))}
            page={page}
            onChange={(_, n) => setPage(n)}
            color="primary"
            size="large"
            sx={{ '& .MuiPagination-ul': { gap: 0.5 } }}
          />
        </Box>
      </Box>
    );
  }
