'use client';
import React, { useEffect, useMemo, useState } from 'react';

import { useRouter } from 'next/navigation';

import axios from 'axios';
import {
  Avatar,
  Box,
  Button,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  Drawer,
  Grid,
  IconButton,
  InputAdornment,
  LinearProgress,
  MenuItem,
  Paper,
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Tooltip,
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
import HourglassBottomIcon from '@mui/icons-material/HourglassBottom';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CloseIcon from '@mui/icons-material/Close';
import PeopleIcon from '@mui/icons-material/People';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import PaymentsIcon from '@mui/icons-material/Payments';

import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import Pagination from '@mui/material/Pagination';

import RoleBasedPerformanceForm from '@/components/performance/RoleBasedPerformanceForm';
import MyTeamPerformanceDialog from './MyTeamPerformanceDialog';

/* ===================== Axios instance ===================== */
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
const rupee = (n: number) => `₹${Intl.NumberFormat('en-IN').format(n || 0)}`;
const asNum = (v: any) => (Number.isFinite(Number(v)) ? Number(v) : 0);

const fullName = (e: any) =>
  `${e?.first_name || ''} ${e?.last_name || ''}`.trim();

const getMeta = (
  status?: string
): { color: any; icon: React.ReactNode; label: string; border: string } => {
  switch (status) {
    case 'done':
      return {
        color: 'success',
        icon: <CheckCircleIcon fontSize="small" />,
        label: 'Done',
        border: '#4caf50',
      };
    case 'in_progress':
      return {
        color: 'warning',
        icon: <PendingIcon fontSize="small" />,
        label: 'In Progress',
        border: '#ff9800',
      };
    default:
      return {
        color: 'default',
        icon: <BlockIcon fontSize="small" />,
        label: 'Planned',
        border: '#9e9e9e',
      };
  }
};

/* ===== metrics mapping (for cards) ===== */
const computeMetrics = (doc: any) => {
  if (doc?.role === 'employee') {
    const exp = doc?.re?.morning || {};
    const eve = doc?.re?.evening || {};

    const candidates = [
      {
        key: 'logins',
        t: asNum(exp.expectedLogins),
        d: asNum(eve.loginsDone),
        unit: 'count',
      },
      {
        key: 'approvals',
        t: asNum(exp.expectedApprovals),
        d: asNum(eve.approvalsDone),
        unit: 'rupee',
      },
      {
        key: 'disbursal',
        t: asNum(exp.expectedDisbursal),
        d: asNum(eve.disbursalDone),
        unit: 'rupee',
      },
      {
        key: 'phoneConnects',
        t: asNum(exp.phoneConnects),
        d: asNum(eve.phoneConnectsDone),
        unit: 'count',
      },
      {
        key: 'physicalMeet',
        t: asNum(exp.physicalMeet),
        d: asNum(eve.physicalMeetDone),
        unit: 'count',
      },
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
    const own = m?.morning?.ownContribution || {};
    const eve = m?.evening || {};

    const logins = {
      key: 'logins',
      t: asNum(exp.loginsTeam) + asNum(own.login),
      d: asNum(eve.teamLoginsDone),
      unit: 'count',
    };

    const apprAmt = {
      key: 'approvals',
      t: asNum(exp.approvalLacs) + asNum(own.approvalLacs),
      d: asNum(eve.teamApprovalDoneAmount),
      unit: 'rupee',
    };

    const disbAmt = {
      key: 'disbursal',
      t: asNum(exp.disbursalAmount) + asNum(own.disbursalLacs),
      d: asNum((eve as any).teamDisbursalDoneAmount ?? 0),
      unit: 'rupee',
    };

    const candidates = [logins, apprAmt, disbAmt].filter((x) => x.t || x.d);
    const picked = candidates[0] || logins;

    let status: 'done' | 'in_progress' | 'planned' = 'planned';

    if ((picked.d || 0) >= (picked.t || 0) && (picked.t || 0) > 0)
      status = 'done';
    else if ((picked.d || 0) > 0 || (picked.t || 0) > 0)
      status = 'in_progress';

    return {
      taskTitle: `Manager ${picked.key} — ${doc?.date || ''}`,
      description: `Target: ${picked.t || 0} • Done: ${picked.d || 0}`,
      target: picked.t || 0,
      completed: picked.d || 0,
      status,
      unit: picked.unit,
    };
  }

  return {
    taskTitle: 'Snapshot',
    description: '',
    target: 0,
    completed: 0,
    status: 'planned' as const,
    unit: 'count' as const,
  };
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
type Pair = {
  key: string;
  label: string;
  planned: number;
  done: number;
  unit: 'count' | 'rupee';
};

const pct = (planned = 0, done = 0) => {
  const p = Number(planned) || 0;
  const d = Number(done) || 0;

  if (p <= 0) return d > 0 ? 100 : 0;

  return Math.max(0, Math.min(100, Math.round((d / p) * 100)));
};

const prettyNum = (n: number, unit: 'rupee' | 'count') =>
  unit === 'rupee'
    ? `₹${Intl.NumberFormat('en-IN').format(n || 0)}`
    : `${n || 0}`;

const MetricRow = ({ pair }: { pair: Pair }) => {
  const p = Number(pair.planned) || 0;
  const d = Number(pair.done) || 0;
  const progress = pct(p, d);
  const pending = Math.max(p - d, 0);

  return (
    <Box sx={{ mb: 1.25 }}>
      <Grid container alignItems="center" spacing={1}>
        <Grid item xs={5}>
          <Typography variant="body2" sx={{ fontWeight: 700 }}>
            {pair.label}
          </Typography>
        </Grid>
        <Grid item xs={7}>
          <Typography variant="caption" color="text.secondary">
            Commitment: <b>{prettyNum(p, pair.unit)}</b> • Delivery:{' '}
            <b>{prettyNum(d, pair.unit)}</b> • Pending:{' '}
            <b>{prettyNum(pending, pair.unit)}</b>
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {progress}% achieved
          </Typography>
        </Grid>
      </Grid>
    </Box>
  );
};

const buildPairsForEmployee = (raw: any): Pair[] => {
  const m = raw?.re?.morning || {};
  const e = raw?.re?.evening || {};

  return [
    {
      key: 'phone',
      label: 'Phone Connects',
      planned: Number(m.phoneConnects || 0),
      done: Number(e.phoneConnectsDone || 0),
      unit: 'count',
    },
    {
      key: 'meet',
      label: 'Physical Meets',
      planned: Number(m.physicalMeet || 0),
      done: Number(e.physicalMeetDone || 0),
      unit: 'count',
    },

    {
      key: 'login',
      label: 'Logins',
      planned: Number(m.expectedLogins || 0),
      done: Number(e.loginsDone || 0),
      unit: 'count',
    },
    {
      key: 'appr',
      label: 'Approvals (₹)',
      planned: Number(m.expectedApprovals || 0),
      done: Number(e.approvalsDone || 0),
      unit: 'rupee',
    },
    {
      key: 'disb',
      label: 'Disbursals (₹)',
      planned: Number(m.expectedDisbursal || 0),
      done: Number(e.disbursalDone || 0),
      unit: 'rupee',
    },
  ];
};

const buildPairsForManager = (raw: any): Pair[] => {
  const m = raw?.manager?.morning || {};
  const e = raw?.manager?.evening || {};
  const exp = m?.expected || {};
  const own = m?.ownContribution || {};

  // ✅ Morning Plan = Expected (team) + Own
  const plannedLogins =
    Number(exp.loginsTeam || 0) + Number(own.login || 0);

  const plannedApproval =
    Number(exp.approvalLacs || 0) + Number(own.approvalLacs || 0);

  const plannedDisbursal =
    Number(exp.disbursalAmount || 0) + Number(own.disbursalLacs || 0);

  const doneLogins = Number(e.teamLoginsDone || 0);
  const doneApproval = Number(e.teamApprovalDoneAmount || 0);
  const doneDisbursal = asNum((e as any)?.teamDisbursalDoneAmount ?? 0);

  const pairs: Pair[] = [
    {
      key: 'logins',
      label: 'Team Logins',
      planned: plannedLogins,
      done: doneLogins,
      unit: 'count',
    },
    {
      key: 'appr',
      label: 'Team Approvals (₹)',
      planned: plannedApproval,
      done: doneApproval,
      unit: 'rupee',
    },
    {
      key: 'disb',
      label: 'Team Disbursal (₹)',
      planned: plannedDisbursal,
      done: doneDisbursal,
      unit: 'rupee',
    },
  ];

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
    <Stack
      direction="row"
      spacing={1.5}
      alignItems="center"
      sx={{ position: 'relative' }}
    >
      <Avatar
        src={emp?.image || ''}
        sx={{ width: 42, height: 42, border: '2px solid rgba(255,255,255,.6)' }}
      />
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
        sx={{
          bgcolor: 'rgba(255,255,255,.18)',
          color: '#fff',
          borderColor: 'rgba(255,255,255,.4)',
        }}
        variant="outlined"
      />
    </Stack>
  </Box>
);

/* ===================== Details Drawer ===================== */
const DetailsDrawer = ({
  open,
  onClose,
  doc,
}: {
  open: boolean;
  onClose: () => void;
  doc: any | null;
}) => {
  const [tillDatePairs, setTillDatePairs] = useState<Pair[]>([]);
  const [tillLoading, setTillLoading] = useState(false);

  useEffect(() => {
    const run = async () => {
      if (!open || !doc) {
        setTillDatePairs([]);

        return;
      }

      try {
        setTillLoading(true);

        const rawDoc = doc.__raw ? doc.__raw : doc;
        const role: 'employee' | 'manager' = rawDoc?.role;

        const empId = String(
          rawDoc?.employee?._id ||
          rawDoc?.employee_id ||
          rawDoc?.owner_id ||
          ''
        ).trim();

        const snapshotDate = rawDoc?.date ? dayjs(rawDoc.date) : null;

        if (!empId || !snapshotDate || !snapshotDate.isValid()) {
          setTillDatePairs([]);

          return;
        }

        const month = snapshotDate.month() + 1;
        const year = snapshotDate.year();

        const params: any = {
          employee_id: empId,
          month,
          year,
          limit: 500,
          page: 1,
        };

        const res = await api.get("/performance", { params });

        let list: any[] = [];
        const payload = res?.data || {};

        if (Array.isArray(payload.data)) {
          if (
            payload.data.length > 0 &&
            Array.isArray(payload.data[0]?.records)
          ) {
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

        list = list.filter((item: any) => {
          const d = dayjs(item?.date);

          if (!d.isValid()) return false;

          return d.valueOf() <= snapshotDate.valueOf();
        });

        const agg: Record<string, Pair> = {};

        list.forEach((item: any) => {
          const rawItem = item.__raw ? item.__raw : item;

          const pairsForItem =
            role === 'manager'
              ? buildPairsForManager(rawItem)
              : buildPairsForEmployee(rawItem);

          pairsForItem.forEach((p) => {
            if (!agg[p.key]) {
              agg[p.key] = { ...p };
            } else {
              agg[p.key].planned += Number(p.planned || 0);
              agg[p.key].done += Number(p.done || 0);
            }
          });
        });

        setTillDatePairs(Object.values(agg));
      } catch {
        setTillDatePairs([]);
      } finally {
        setTillLoading(false);
      }
    };

    run();
  }, [open, doc]);

  if (!doc) return null;

  const raw = doc.__raw ? doc.__raw : doc;
  const role: 'employee' | 'manager' = raw?.role;
  const emp = raw?.employee;
  const dateStr = raw?.date ? dayjs(raw.date).format('DD MMM YYYY') : '—';

  const pairs: Pair[] =
    role === 'manager' ? buildPairsForManager(raw) : buildPairsForEmployee(raw);

  const totals = pairs.reduce(
    (acc, p) => ({
      planned: acc.planned + (Number(p.planned) || 0),
      done: acc.done + (Number(p.done) || 0),
    }),
    { planned: 0, done: 0 }
  );

  const tillTotals = tillDatePairs.reduce(
    (acc, p) => ({
      planned: acc.planned + (Number(p.planned) || 0),
      done: acc.done + (Number(p.done) || 0),
    }),
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
        <Typography
          variant="overline"
          sx={{ fontWeight: 800, letterSpacing: 1 }}
        >
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
        <Typography
          variant="overline"
          sx={{ fontWeight: 800, letterSpacing: 1 }}
        >
          Till Date — Commitment vs Delivery
        </Typography>
        <Divider sx={{ mb: 1 }} />
        {tillLoading ? (
          <Typography variant="body2" color="text.secondary">
            Calculating till-date performance…
          </Typography>
        ) : tillDatePairs.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            Till-date summary not available.
          </Typography>
        ) : (
          tillDatePairs.map((pair) => (
            <MetricRow key={`till-${pair.key}`} pair={pair} />
          ))
        )}
      </Box>

      <Box sx={{ mt: 2.5 }}>
        <Typography
          variant="overline"
          sx={{ fontWeight: 800, letterSpacing: 1 }}
        >
          Summary (Selected Date)
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
              <Typography variant="caption" color="text.secondary">
                {pct(totals.planned, totals.done)}% achieved for this date
              </Typography>
            </Grid>
          </Grid>
        </Paper>
      </Box>

      {tillDatePairs.length > 0 && (
        <Box sx={{ mt: 2 }}>
          <Typography
            variant="overline"
            sx={{ fontWeight: 800, letterSpacing: 1 }}
          >
            Summary (Till Date)
          </Typography>
          <Divider sx={{ mb: 1 }} />
          <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">
                  Total Planned
                </Typography>
                <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                  {Intl.NumberFormat('en-IN').format(tillTotals.planned)}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">
                  Total Done
                </Typography>
                <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                  {Intl.NumberFormat('en-IN').format(tillTotals.done)}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <LinearProgress
                  variant="determinate"
                  value={pct(tillTotals.planned, tillTotals.done)}
                  sx={{ height: 10, borderRadius: 2 }}
                />
                <Typography variant="caption" color="text.secondary">
                  {pct(tillTotals.planned, tillTotals.done)}% overall
                  achieved till this date
                </Typography>
              </Grid>
            </Grid>
          </Paper>
        </Box>
      )}
    </Drawer>
  );
};

/* -------------------- MTD map type -------------------- */
type MTD = {
  loginCommit: number;
  loginDone: number;
  approvalCommit: number;
  approvalDone: number;
  disbursalCommit: number;
  disbursalDone: number;
  loading?: boolean;
};

const emptyMtd: MTD = {
  loginCommit: 0,
  loginDone: 0,
  approvalCommit: 0,
  approvalDone: 0,
  disbursalCommit: 0,
  disbursalDone: 0,
  loading: false,
};

/* -------------------- Code Summary type (overall per code) -------------------- */
type CodeSummaryRow = {
  code: string;
  employees?: string[];
  totalLogins: number;
  totalApproval: number;
  totalDisbursal: number;
  rowCount: number; // days
};

type ExcelSummary = CodeSummaryRow;

/* -------------------- Team Totals types -------------------- */
type TeamTotalInfo = {
  memberCount: number;
  totalLogins: number;
  totalApproval: number;
  totalDisbursal: number;
  memberCodes: string[];
  role?: 'manager' | 'team_leader';
  teamName?: string;
};

type TeamTotalsMap = Record<string, TeamTotalInfo>;

type TeamBreakdownMember = {
  code: string;
  employee_name: string;
  total_logins: number;
  approval_amount: number;
  disbursal_amount: number;
};


const PerformanceCard = ({
  item,
  onEdit,
  onDetails,
  mtd,
  canEdit,
  excelSummary,
  teamTotal,
  onViewTeamDetails,
}: {
  item: any;
  onEdit?: (id: string) => void;
  onDetails: (doc: any) => void;
  mtd?: MTD;
  canEdit?: boolean;
  excelSummary?: ExcelSummary;
  teamTotal?: TeamTotalInfo;
  onViewTeamDetails?: (code: string) => void;
}) => {
  const meta = getMeta(item?.status);
  const raw = item.__raw ? item.__raw : item;
  const role = raw?.role;

  // 🔹 Employee morning/evening
  const empMorning = raw?.re?.morning || {};
  const empEvening = raw?.re?.evening || {};
  const morningPhoneConnects = asNum(empMorning.phoneConnects ?? 0);
  const eveningPhoneConnects = asNum(empEvening.phoneConnectsDone ?? 0);


  // 🔹 Manager morning/evening
  const mgrMorning = raw?.manager?.morning || {};
  const mgrExpected = mgrMorning?.expected || {};
  const mgrOwn = mgrMorning?.ownContribution || {};
  const mgrEvening = raw?.manager?.evening || {};

  // 🔹 NEW: Manager tillDate block safely read
  const mgrTillDateRaw = mgrMorning?.tillDate || {};
  const mgrTillDateLogin = Number(mgrTillDateRaw?.login ?? 0) || 0;

  const mgrTillDateApprovalLacs =
    Number(mgrTillDateRaw?.approvalLacs ?? 0) || 0;

  const mgrTillDateDisbursalLacs =
    Number(mgrTillDateRaw?.disbursalLacs ?? 0) || 0;

  // 🔹 Morning metrics (employee vs manager)
  const morningManagerPhoneConnects = asNum(
    mgrMorning.customerPhoneConnects ?? 0
  );

  const eveningManagerPhoneConnects = asNum(
    mgrEvening.customerPhoneConnectsDone ?? 0
  );

  const morningLogin =
    role === 'manager'
      ? asNum(mgrExpected.loginsTeam ?? 0) + asNum(mgrOwn.login ?? 0)
      : asNum(empMorning.expectedLogins ?? 0);

  const morningApproval =
    role === 'manager'
      ? asNum(mgrExpected.approvalLacs ?? 0) +
      asNum(mgrOwn.approvalLacs ?? 0)
      : asNum(empMorning.expectedApprovals ?? 0);

  const morningDisbursal =
    role === 'manager'
      ? asNum(mgrExpected.disbursalAmount ?? 0) +
      asNum(mgrOwn.disbursalLacs ?? 0)
      : asNum(empMorning.expectedDisbursal ?? 0);

  // 🔹 Evening metrics (employee vs manager)
  const eveningLogin =
    role === 'manager'
      ? asNum(mgrEvening.teamLoginsDone ?? 0)
      : asNum(empEvening.loginsDone ?? 0);

  const eveningApproval =
    role === 'manager'
      ? asNum(mgrEvening.teamApprovalDoneAmount ?? 0)
      : asNum(empEvening.approvalsDone ?? 0);

  const mgrEveningDisbursalMaybe =
    (mgrEvening as any)?.teamDisbursalDoneAmount;

  const eveningDisbursal =
    role === 'manager'
      ? asNum(mgrEveningDisbursalMaybe ?? 0)
      : asNum(empEvening.disbursalDone ?? 0);

  const m = mtd || emptyMtd;

  const Stat = ({ label, value }: { label: string; value: number | null }) => {
    if (value === null || value === undefined) return null;

    return (
      <Chip
        size="small"
        label={`${label}: ${Intl.NumberFormat('en-IN').format(
          Number(value) || 0
        )}`}
        variant="outlined"
        sx={{ height: 24, '& .MuiChip-label': { px: 1 } }}
      />
    );
  };

  const formatRupeeShort = (n: number) =>
    `₹${Intl.NumberFormat('en-IN').format(Number(n) || 0)}`;

  return (
    <Paper
      elevation={0}
      sx={{
        position: 'relative',
        borderRadius: 3,
        p: 2.25,
        overflow: 'hidden',
        border: '1px solid',
        borderColor: 'divider',
        background:
          'radial-gradient(circle at -10% -20%, rgba(99,102,241,0.14) 0, transparent 50%), linear-gradient(180deg,#ffffff 0%,#f7f8ff 100%)',
        transition: 'all .25s ease',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 14px 30px rgba(15,23,42,0.18)',
        },
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: 5,
          borderRadius: '12px',
          bgcolor: meta.border,
        }}
      />

      {/* ===== Top: Avatar + name ===== */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box sx={{ position: 'relative' }}>
          <Box
            sx={{
              position: 'absolute',
              inset: -4,
              borderRadius: '50%',
              background:
                'radial-gradient(circle, rgba(129,140,248,0.35) 0, transparent 60%)',
              opacity: 0.9,
            }}
          />
          <Avatar
            src={item?.employee?.image || ''}
            alt="emp"
            sx={{
              position: 'relative',
              width: 46,
              height: 46,
              border: '2px solid #fff',
              boxShadow: '0 4px 14px rgba(15,23,42,0.25)',
            }}
          />
        </Box>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            noWrap
            variant="subtitle1"
            sx={{ fontWeight: 900, letterSpacing: 0.2 }}
          >
            {(item?.employee?.first_name || '') +
              ' ' +
              (item?.employee?.last_name || '') || '—'}
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ fontWeight: 600 }}
            noWrap
          >
            {String(item?.employee?.role_priority) === '2'
              ? 'Manager'
              : item?.employee?.designation || '—'}
          </Typography>
        </Box>

        {item?.employee?.code && (
          <Chip
            size="small"
            label={`Code: ${item.employee.code}`}
            variant="outlined"
            sx={{ borderRadius: 999 }}
          />
        )}
      </Box>

      {/* ===== Middle: Morning & Evening cards ===== */}
      <Box sx={{ mt: 1.5 }}>
        <Grid container spacing={1.25}>
          <Grid item xs={12} sm={6}>
            <Paper
              variant="outlined"
              sx={{
                p: 1.1,
                borderRadius: 2,
                background:
                  'linear-gradient(135deg,#f9fafb 0%,#eff6ff 100%)',
              }}
            >
              <Stack direction="row" alignItems="center" spacing={0.75}>
                <HourglassBottomIcon
                  sx={{ fontSize: 16, color: 'primary.main' }}
                />
                <Typography
                  variant="caption"
                  sx={{ fontWeight: 800, letterSpacing: 0.3 }}
                >
                  Morning Commitment
                </Typography>
              </Stack>

              <Stack direction="column" spacing={0.75} sx={{ mt: 0.75 }}>
                <Box sx={{ width: 1 }}>
                  <Stat
                    label="Total Connected Calls"
                    value={
                      role === 'manager'
                        ? morningManagerPhoneConnects
                        : morningPhoneConnects
                    }
                  />

                </Box>
                <Box sx={{ width: 1 }}>
                  <Stat
                    label="Physical Meetings"
                    value={
                      role === 'manager'
                        ? asNum(mgrMorning.physicalMeet ?? 0)
                        : asNum(empMorning.physicalMeet ?? 0)
                    }
                  />
                </Box>
                <Box sx={{ width: 1 }}>
                  <Stat label="Login" value={morningLogin} />
                </Box>
                <Box sx={{ width: 1 }}>
                  <Stat label="Approval" value={morningApproval} />
                </Box>
                <Box sx={{ width: 1 }}>
                  <Stat
                    label="Disbursal"
                    value={morningDisbursal}
                  />
                </Box>
              </Stack>
            </Paper>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Paper
              variant="outlined"
              sx={{
                p: 1.1,
                borderRadius: 2,
                background:
                  'linear-gradient(135deg,#f9fafb 0%,#ecfdf3 100%)',
              }}
            >
              <Stack direction="row" alignItems="center" spacing={0.75}>
                <TrendingUpOutlinedIcon
                  sx={{ fontSize: 16, color: 'success.main' }}
                />
                <Typography
                  variant="caption"
                  sx={{ fontWeight: 800, letterSpacing: 0.3 }}
                >
                  Evening Delivery
                </Typography>
              </Stack>



              <Stack direction="column" spacing={0.75} sx={{ mt: 0.75 }}>
                <Box sx={{ width: 1 }}>
                  <Stat
                    label="Total Connected Calls"
                    value={
                      role === 'manager'
                        ? eveningManagerPhoneConnects
                        : eveningPhoneConnects
                    }
                  />

                </Box>
                <Box sx={{ width: 1 }}>
                  <Stat
                    label="Physical Meetings"
                    value={
                      role === 'manager'
                        ? asNum(mgrEvening.physicalMeetDone ?? 0)
                        : asNum(empEvening.physicalMeetDone ?? 0)
                    }
                  />
                </Box>
                <Box sx={{ width: 1 }}>
                  <Stat label="Login" value={eveningLogin} />
                </Box>
                <Box sx={{ width: 1 }}>
                  <Stat
                    label="Approval"
                    value={eveningApproval}
                  />
                </Box>
                <Box sx={{ width: 1 }}>
                  <Stat
                    label="Disbursal"
                    value={eveningDisbursal}
                  />
                </Box>
              </Stack>
            </Paper>
          </Grid>
        </Grid>
      </Box>
      {role === "manager" && (
        <>
          {/* ⭐ SHOW heading only if approval/disbursal performers exist */}
          {(mgrEvening?.topApprovalPerformer?.name ||
            mgrEvening?.topDisbursalPerformer?.name ||
            mgrEvening?.filesStuckDescription ||
            mgrEvening?.topPerformer?.name) && (
              <Box
                sx={{
                  mt: 1.5,
                  p: 1.2,
                  borderRadius: 2,
                  bgcolor: "#fafafa",
                  border: "1px solid #e5e7eb",
                }}
              >
                {/* ⭐ Heading only if approval or disbursal perform exist */}
                {(mgrEvening?.topApprovalPerformer?.name ||
                  mgrEvening?.topDisbursalPerformer?.name) && (
                    <Typography
                      variant="caption"
                      sx={{
                        fontWeight: 800,
                        fontSize: 12,
                        color: "#111827",
                        mb: 1,
                        display: "block",
                      }}
                    >
                      Top Performers
                    </Typography>
                  )}

                <Stack spacing={1}>
                  {/* ⭐ Approval Performer */}
                  {mgrEvening?.topApprovalPerformer?.name && (
                    <Box
                      sx={{
                        p: 1,
                        border: "1px solid #e5e7eb",
                        borderRadius: 2,
                        bgcolor: "white",
                      }}
                    >
                      <Typography variant="caption" sx={{ fontWeight: 700 }}>
                        Approval Performer:
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {mgrEvening.topApprovalPerformer.name} • ₹
                        {asNum(mgrEvening.topApprovalPerformer.valueLacs)} L
                      </Typography>
                    </Box>
                  )}

                  {/* ⭐ Disbursal Performer */}
                  {mgrEvening?.topDisbursalPerformer?.name && (
                    <Box
                      sx={{
                        p: 1,
                        border: "1px solid #e5e7eb",
                        borderRadius: 2,
                        bgcolor: "white",
                      }}
                    >
                      <Typography variant="caption" sx={{ fontWeight: 700 }}>
                        Disbursal Performer:
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {mgrEvening.topDisbursalPerformer.name} • ₹
                        {asNum(mgrEvening.topDisbursalPerformer.valueLacs)} L
                      </Typography>
                    </Box>
                  )}

                  {/* ⭐ Overall Performer (Optional, but heading doesn't depend on it) */}
                  {mgrEvening?.topPerformer?.name && (
                    <Box
                      sx={{
                        p: 1,
                        border: "1px solid #e5e7eb",
                        borderRadius: 2,
                        bgcolor: "white",
                      }}
                    >
                      <Typography
                        variant="caption"
                        sx={{
                          fontWeight: 900,
                          fontSize: 13,
                          color: "#312e81",
                          mb: 1.2,
                          display: "block",
                        }}
                      >
                        ⭐ Top Performers
                      </Typography>

                      <Typography variant="body2" sx={{
                        fontWeight: 600,
                        fontSize: 15,
                        color: "#312e81",
                        mb: 1.2,
                        display: "block",
                      }}>
                        {mgrEvening.topPerformer.name}
                      </Typography>
                    </Box>
                  )}

                  {/* ⭐ FILE STUCK REASON */}
                  {mgrEvening?.filesStuckDescription && (
                    <Tooltip
                      title={mgrEvening.filesStuckDescription}
                      arrow
                      placement="top"
                    >
                      <Box
                        sx={{
                          p: 1,
                          border: "1px solid #e5e7eb",
                          borderRadius: 2,
                          bgcolor: "white",
                          display: "flex",
                          alignItems: "center",
                        }}
                      >
                        <Typography
                          variant="caption"
                          sx={{ fontWeight: 700, mr: 0.6, color: "black" }}
                        >
                          Files Stuck Reason:
                        </Typography>

                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: 500,
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            maxWidth: "150px",
                          }}
                        >
                          {mgrEvening.filesStuckDescription}
                        </Typography>
                      </Box>
                    </Tooltip>
                  )}
                </Stack>
              </Box>
            )}
        </>
      )}

      <Box sx={{ mt: 2 }}>
        <Paper
          variant="outlined"
          sx={{
            p: 1.8,
            borderRadius: 3,
            background: 'linear-gradient(180deg,#ffffff 0%,#fafbff 100%)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.04)',
            border: '1px solid #eef0f6',
            transition: '0.25s',
            '&:hover': {
              boxShadow: '0 6px 18px rgba(0,0,0,0.08)',
              transform: 'translateY(-3px)',
            },
          }}
        >
          <Typography
            variant="caption"
            sx={{
              fontWeight: 900,
              fontSize: 12.5,
              letterSpacing: 0.5,
              textTransform: 'uppercase',
              color: '#1e293b',
              mb: 1.2,
              display: 'block',
            }}
          >
            Till Date — Snapshot
          </Typography>

          <Grid container spacing={2}>
            <Grid item xs={4}>
              <Typography variant="caption" color="text.secondary">
                Login
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 800 }}>
                {role === 'manager'
                  ? mgrTillDateLogin
                  : (raw?.re?.morning?.tillDate?.login || 0)}
              </Typography>
            </Grid>

            {/* ===== Approval ===== */}
            <Grid item xs={4}>
              <Typography variant="caption" color="text.secondary">
                Approval (₹)
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 800 }}>
                ₹
                {role === 'manager'
                  ? mgrTillDateApprovalLacs
                  : (raw?.re?.morning?.tillDate?.approvalLacs || 0)}
              </Typography>
            </Grid>
            <Grid item xs={4}>
              <Typography variant="caption" color="text.secondary">
                Disbursal (₹)
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 800 }}>
                ₹
                {role === 'manager'
                  ? mgrTillDateDisbursalLacs
                  : (raw?.re?.morning?.tillDate?.disbursalLacs || 0)}
              </Typography>
            </Grid>

          </Grid>
        </Paper>
      </Box>
      {excelSummary && (
        <Box sx={{ mt: 2 }}>
          <Paper
            variant="outlined"
            sx={{
              p: 1.8,
              borderRadius: 3,
              background:
                'linear-gradient(180deg,#ffffff 0%,#fafbff 100%)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.04)',
              border: '1px solid #eef0f6',
              transition: '0.25s',
              '&:hover': {
                boxShadow: '0 6px 18px rgba(0,0,0,0.08)',
                transform: 'translateY(-3px)',
              },
            }}
          >
            <Typography
              variant="caption"
              sx={{
                fontWeight: 900,
                fontSize: 12.5,
                letterSpacing: 0.5,
                textTransform: 'uppercase',
                color: '#1e293b',
                mb: 0.2,
                display: 'block',
              }}
            >
              Financial Snapshot — By Company
            </Typography>

            <Grid container spacing={1}>

              <Grid item xs={4}>
                <Typography variant="caption" color="text.secondary">
                  Total Logins
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 800 }}>
                  {excelSummary.totalLogins}
                </Typography>
              </Grid>

              <Grid item xs={4}>
                <Typography variant="caption" color="text.secondary">
                  Total Approval (₹)
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 800 }}>
                  {formatRupeeShort(excelSummary.totalApproval)}
                </Typography>
              </Grid>

              <Grid item xs={4}>
                <Typography variant="caption" color="text.secondary">
                  Total Disbursal (₹)
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 800 }}>
                  {formatRupeeShort(excelSummary.totalDisbursal)}
                </Typography>
              </Grid>

            </Grid>
          </Paper>
        </Box>
      )}

      {/* Team Financial Summary - for Managers/TLs */}
      {teamTotal && teamTotal.memberCount > 0 && (
        <Box sx={{ mt: 2 }}>
          <Paper
            variant="outlined"
            sx={{
              p: 1.8,
              borderRadius: 3,
              background: 'linear-gradient(135deg, #1E3368 0%, #3B5998 100%)',
              boxShadow: '0 4px 12px rgba(30,51,104,0.3)',
              border: 'none',
              transition: '0.25s',
              '&:hover': {
                boxShadow: '0 6px 18px rgba(30,51,104,0.4)',
                transform: 'translateY(-3px)',
              },
            }}
          >
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
              <Typography
                variant="caption"
                sx={{
                  fontWeight: 900,
                  fontSize: 12.5,
                  letterSpacing: 0.5,
                  textTransform: 'uppercase',
                  color: '#ffffff',
                  display: 'block',
                }}
              >
                🏆 Team Financial Summary
              </Typography>
              <Chip
                size="small"
                label={`${teamTotal.memberCount} Members`}
                sx={{
                  bgcolor: 'rgba(255,255,255,0.2)',
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: 11,
                }}
              />
            </Stack>

            <Grid container spacing={1}>
              <Grid item xs={4}>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                  Team Logins
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 800, color: '#fff' }}>
                  {teamTotal.totalLogins}
                </Typography>
              </Grid>

              <Grid item xs={4}>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                  Team Approval
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 800, color: '#fff' }}>
                  {formatRupeeShort(teamTotal.totalApproval)}
                </Typography>
              </Grid>

              <Grid item xs={4}>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                  Team Disbursal
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 800, color: '#fff' }}>
                  {formatRupeeShort(teamTotal.totalDisbursal)}
                </Typography>
              </Grid>
            </Grid>

            <Box sx={{ mt: 1.5, textAlign: 'center' }}>
              <Button
                size="small"
                variant="contained"
                onClick={() => onViewTeamDetails && onViewTeamDetails(item?.employee?.code)}
                sx={{
                  bgcolor: 'rgba(255,255,255,0.95)',
                  color: '#1E3368',
                  fontWeight: 700,
                  borderRadius: 2,
                  textTransform: 'none',
                  '&:hover': {
                    bgcolor: '#fff',
                  },
                }}
              >
                View Team Details
              </Button>
            </Box>
          </Paper>
        </Box>
      )}

      <Box sx={{ mt: 2 }}>
        <Paper
          variant="outlined"
          sx={{
            p: 1.25,
            borderRadius: 2,
            bgcolor: '#f9fafb',
          }}
        >
          <Typography
            variant="caption"
            sx={{
              fontWeight: 800,
              letterSpacing: 0.4,
              mb: 0.5,
              display: 'block',
              color: '#374151',
            }}
          >
            Morning vs Evening – Calls / Login / Approval / Disbursal
          </Typography>

          <Grid container spacing={1}>

            {[
              {
                label: 'Connected Calls',
                morning:
                  role === "manager"
                    ? morningManagerPhoneConnects
                    : morningPhoneConnects,

                evening:
                  role === "manager"
                    ? eveningManagerPhoneConnects
                    : eveningPhoneConnects,
              },
              {
                label: 'Login',
                morning: morningLogin,
                evening: eveningLogin,
              },
              {
                label: 'Approval (₹)',
                morning: morningApproval,
                evening: eveningApproval,
              },
              {
                label: 'Disbursal (₹)',
                morning: morningDisbursal,
                evening: eveningDisbursal,
              },
            ].map((item, idx) => {

              const m = Number(item.morning || 0);
              const e = Number(item.evening || 0);

              const pct = m === 0 ? (e > 0 ? 100 : 0) : Math.round((e / m) * 100);

              let pctColor = '#6b7280';
              let arrow = '→';

              if (pct > 100) { pctColor = '#059669'; arrow = '↑'; }
              else if (pct < 100) { pctColor = '#dc2626'; arrow = '↓'; }

              return (
                <Grid key={idx} item xs={12}>
                  <Stack
                    direction="row"
                    spacing={3}
                    alignItems="center"
                    flexWrap="wrap"
                    sx={{
                      p: 1,
                      borderRadius: 1.5,
                      border: '1px solid #e5e7eb',
                      background: '#ffffff',
                    }}
                  >
                    {/* Label */}
                    <Typography variant="caption" sx={{ fontWeight: 800, minWidth: 110 }}>
                      {item.label}
                    </Typography>

                    {/* Morning */}
                    <Chip
                      size="small"
                      label={`Mrng: ${formatRupeeShort(m)}`}
                      variant="outlined"
                      sx={{
                        height: 22,
                        '& .MuiChip-label': { px: 0.8, fontSize: 11 },
                      }}
                    />

                    {/* Evening */}
                    <Chip
                      size="small"
                      label={`Eve: ${formatRupeeShort(e)}`}
                      color="success"
                      variant="outlined"
                      sx={{
                        height: 22,
                        '& .MuiChip-label': { px: 0.8, fontSize: 11 },
                      }}
                    />

                    {/* Percentage ↓🔥 SAME LINE */}
                    <Typography
                      variant="caption"
                      sx={{
                        fontWeight: 900,
                        color: pctColor,
                        fontSize: 12,
                      }}
                    >
                      {arrow} {pct}% Achieved
                    </Typography>
                  </Stack>
                </Grid>
              );
            })}

          </Grid>
        </Paper>
      </Box>





      <Divider sx={{ my: 1.5 }} />

      {/* ===== Footer: Date + buttons ===== */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 1,
        }}
      >
        <Chip
          size="small"
          icon={<CalendarMonthIcon />}
          label={item?.date ? dayjs(item.date).format("DD MMM YYYY") : "-"}
          variant="outlined"
          sx={{
            borderRadius: 999,
            fontWeight: 600,
            "& .MuiChip-label": { px: 3 },
          }}
        />

        <Stack direction="row" spacing={1}>
          <Button
            size="small"
            variant="outlined"
            onClick={() => onDetails(item)}
            sx={{
              borderRadius: 999,
              textTransform: "none",
              fontWeight: 600,
            }}
          >
            Details
          </Button>

          {canEdit && onEdit && (
            <Button
              size="small"
              variant="contained"
              color="info"
              onClick={() => onEdit(item?._id)}
              sx={{
                borderRadius: 999,
                textTransform: "none",
                fontWeight: 700,
              }}
            >
              Edit
            </Button>
          )}
        </Stack>
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

  const [searchName, setSearchName] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [limit] = useState<number>(12);

  const [showForm, setShowForm] = useState(false);

  const [selectedPerformanceId, setSelectedPerformanceId] =
    useState<string | null>(null);

  const [userRole, setUserRole] = useState<string>('');
  const [userDesignation, setUserDesignation] = useState<string>('');

  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsDoc, setDetailsDoc] = useState<any | null>(null);

  const [teamDlgOpen, setTeamDlgOpen] = useState(false);
  const [teams, setTeams] = useState<any[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [loadingTeams, setLoadingTeams] = useState(true);
  const [teamsPerfLoading, setTeamsPerfLoading] = useState(false);

  const [mtdMap, setMtdMap] = useState<Record<string, MTD>>({});
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [totalEmployees, setTotalEmployees] = useState(0);
  const [submittedCount, setSubmittedCount] = useState(0);
  const [missingCount, setMissingCount] = useState(0);

  const [missingList, setMissingList] = useState([]);


  const [missingLoading, setMissingLoading] = useState(false);
  const [missingSearch, setMissingSearch] = useState("");

  const [missingOpen, setMissingOpen] = useState(false);


  const [empPerf, setEmpPerf] = useState<
    Record<
      string,
      {
        target: number;
        done: number;
        status: 'done' | 'in_progress' | 'planned';
        date?: string;
        raw?: any;
      }
    >
  >({});
  const [codeSummary, setCodeSummary] = useState<CodeSummaryRow[]>([]);
  const [codeSummaryLoading, setCodeSummaryLoading] = useState(false);

  const [codeSummaryMap, setCodeSummaryMap] = useState<
    Record<string, CodeSummaryRow>
  >({});


  const [teamTotals, setTeamTotals] = useState<TeamTotalsMap>({});
  const [teamModalOpen, setTeamModalOpen] = useState(false);
  const [teamBreakdown, setTeamBreakdown] = useState<{
    code: string;
    employeeName: string;
    members: TeamBreakdownMember[];
    totals: { logins: number; approval: number; disbursal: number };
  } | null>(null);

  const [teamBreakdownLoading, setTeamBreakdownLoading] = useState(false);

  // 🔹 Manager/TL Filter
  const [managerTlFilter, setManagerTlFilter] = useState<string>('all');
  const [managerTlList, setManagerTlList] = useState<{ code: string; name: string; role: string }[]>([]);

  // 🔹 logged-in user ka employee code
  const [myCode, setMyCode] = useState<string | null>(null);

  const router = useRouter();
  const [uploading] = useState(false);

  const pickDate = selectedDate
    ? dayjs(selectedDate).format("YYYY-MM-DD")
    : dayjs().format("YYYY-MM-DD");

  useEffect(() => {
    const user =
      typeof window !== "undefined"
        ? JSON.parse(localStorage.getItem("user") || "{}")
        : {};

    const token = localStorage.getItem("token");

    setUserRole(String(user.role_priority ?? user.role ?? ""));
    setUserDesignation(String(user.designation ?? ""));
    setMyCode(user.code || null);

    if (!user?.id || !token) {
      setLoadingTeams(false);
      return;
    }

    const base = process.env.NEXT_PUBLIC_APP_URL;
    const role = Number(user.role_priority ?? user.role);

    let url = "";

    if (role === 2) {
      url = `${base}/teams/manager-one/${user.id}`;
    }

    else if (role === 3) {
      url = `${base}/teams/tl-one/${user.id}`;
    }

    // ⭐ Employee → no team
    else {
      setLoadingTeams(false);
      return;
    }

    const fetchTeamsForUser = async () => {
      try {
        const res = await fetch(url, {
          headers: {
            Authorization: `Bearer ${token}`,
            "x-company-id": user.company_id
          }
        });

        const raw = await res.json();
        console.log("TEAM API RESPONSE:", raw);

        setTeams(raw.employees || []);
        setSelectedTeamId(raw.team_id || null);

      } catch (err) {
        console.log("TEAM FETCH ERROR:", err);
        setTeams([]);
        setSelectedTeamId(null);
      } finally {
        setLoadingTeams(false);
      }
    };

    fetchTeamsForUser();
  }, []);




  /* -------- latest snapshot per employee (team dialog) -------- */
  useEffect(() => {
    const run = async () => {
      try {
        if (!Array.isArray(teams) || teams.length === 0) {
          setEmpPerf({});

          return;
        }

        setTeamsPerfLoading(true);

        const employee_ids = teams
          .map((e: any) => String(e?._id))
          .filter(Boolean)
          .join(',');

        if (!employee_ids) {
          setEmpPerf({});

          return;
        }

        const resp = await api.get('/performance/by-employee-ids', {
          params: { employee_ids },
        });

        const arr: any[] = Array.isArray(resp.data)
          ? resp.data
          : Array.isArray(resp.data?.data)
            ? resp.data.data
            : [];

        const perEmp: Record<string, any> = {};

        for (const doc of arr) {
          const d = dayjs(doc?.date);

          if (!d.isValid()) continue;
          if (d.month() + 1 !== month || d.year() !== year) continue;

          const empId = String(
            doc?.owner_id ||
            doc?.employee?._id ||
            doc?.employee_id ||
            ''
          ).trim();

          if (!empId) continue;

          const previous = perEmp[empId];

          const isLater =
            !previous ||
            dayjs(doc.date).isAfter(dayjs(previous.date)) ||
            (doc?.createdAt &&
              previous?.createdAt &&
              dayjs(doc.createdAt).isAfter(
                dayjs(previous.createdAt)
              ));

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

  /* -------- MTD for visible employees (1st → pickDate) -------- */
  const fetchMTDFor = async (empId: string) => {
    if (!empId) {
      console.warn('[MTD] empId missing, skipping');

      return;
    }

    if (mtdMap[empId]?.loading) {
      return;
    }

    setMtdMap((m) => ({
      ...m,
      [empId]: {
        ...(m[empId] || emptyMtd),
        loading: true,
      },
    }));

    try {
      const params: any = {
        month,
        year,
        limit: 500,
        page: 1,
        employee_id: empId,
      };

      const res = await api.get('/performance/list', { params });


      let list: any[] = [];
      const payload = res?.data || {};

      if (Array.isArray(payload.data)) {
        if (
          payload.data.length > 0 &&
          Array.isArray(payload.data[0]?.records)
        ) {
          payload.data.forEach((g: any) =>
            (g.records || []).forEach((r: any) => {
              if (!r.employee && g.employee) r.employee = g.employee;
              list.push(r);
            })
          );
        } else {
          list = payload.data;
        }
      } else {
        list = [];
      }

      const endDate = dayjs(pickDate);

      list = list.filter((d: any) => {
        const dt = dayjs(d?.date);

        if (!dt.isValid()) return false;

        const ok =
          dt.month() + 1 === month &&
          dt.year() === year &&
          dt.valueOf() <= endDate.valueOf();

        return ok;
      });

      let loginCommit = 0;
      let loginDone = 0;
      let approvalCommit = 0;
      let approvalDone = 0;
      let disbursalCommit = 0;
      let disbursalDone = 0;

      for (const doc of list) {
        const raw = doc?.__raw ? doc.__raw : doc;

        if (raw?.role !== 'employee') {
          continue;
        }

        const m = raw?.re?.morning || {};
        const e = raw?.re?.evening || {};

        loginCommit += Number(m.expectedLogins || 0);
        approvalCommit += Number(m.expectedApprovals || 0);
        disbursalCommit += Number(m.expectedDisbursal || 0);

        loginDone += Number(e.loginsDone || 0);
        approvalDone += Number(e.approvalsDone || 0);
        disbursalDone += Number(e.disbursalDone || 0);
      }

      setMtdMap((m) => ({
        ...m,
        [empId]: {
          loginCommit,
          loginDone,
          approvalCommit,
          approvalDone,
          disbursalCommit,
          disbursalDone,
          loading: false,
        },
      }));
    } catch (err) {
      setMtdMap((m) => ({
        ...m,
        [empId]: { ...emptyMtd, loading: false },
      }));
    }
  };

  useEffect(() => {
    const ids = Array.from(
      new Set(
        items
          .map((it) =>
            String(
              it?.employee?._id ||
              it?.employee_id ||
              it?.owner_id ||
              ''
            )
          )
          .filter(Boolean)
      )
    );

    ids.forEach((id) => {
      const cached = mtdMap[id];

      if (!cached) fetchMTDFor(id);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, month, year, selectedDate]);

  /* -------- Code-wise summary fetch (Excel) -------- */
  useEffect(() => {
    const fetchCodeSummary = async () => {
      try {
        setCodeSummaryLoading(true);

        let company_id: string | undefined;

        if (typeof window !== 'undefined') {
          const u = JSON.parse(
            localStorage.getItem('user') || '{}'
          );

          company_id =
            localStorage.getItem('company_id') ||
            u?.company_id ||
            undefined;
        }

        const res = await api.get('/performance-upload/code-summary', {
          params: { company_id },
        });

        const rows: any[] = Array.isArray(res.data)
          ? res.data
          : Array.isArray(res.data?.data)
            ? res.data.data
            : [];

        const mapped: CodeSummaryRow[] = rows
          .map((r: any) => ({
            code: r._id || r.code || '—',
            employees: [],
            totalLogins: Number(r.totalLogins || 0),
            totalApproval: Number(r.totalApproval || 0),
            totalDisbursal: Number(r.totalDisbursal || 0),
            rowCount: Number(r.countDays || 0),
          }))
          .filter(
            (r) =>
              r.totalLogins !== 0 ||
              r.totalApproval !== 0 ||
              r.totalDisbursal !== 0
          );

        setCodeSummary(mapped);

        const map: Record<string, CodeSummaryRow> = {};

        mapped.forEach((r) => {
          if (r.code) map[r.code] = r;
        });
        setCodeSummaryMap(map);
      } catch (e) {
        setCodeSummary([]);
        setCodeSummaryMap({});
      } finally {
        setCodeSummaryLoading(false);
      }
    };

    fetchCodeSummary();
  }, []);

  /* -------- Team Totals fetch (for Managers/TLs) -------- */
  useEffect(() => {
    const fetchTeamTotals = async () => {
      try {
        let company_id: string | undefined;

        if (typeof window !== 'undefined') {
          const u = JSON.parse(localStorage.getItem('user') || '{}');
          company_id = localStorage.getItem('company_id') || u?.company_id || undefined;
        }

        const res = await api.get('/performance-upload/team-totals', {
          params: { company_id },
        });

        const data = res.data || {};

        // Map backend response to frontend expected format
        const mapped: TeamTotalsMap = {};
        Object.entries(data).forEach(([code, val]: [string, any]) => {
          if (val && typeof val === 'object') {
            mapped[code] = {
              memberCount: val.memberCount || 0,
              totalLogins: val.teamTotalLogins || 0,
              totalApproval: val.teamTotalApproval || 0,
              totalDisbursal: val.teamTotalDisbursal || 0,
              memberCodes: val.memberCodes || [],
              role: val.role,
              teamName: val.teamName,
            };
          }
        });

        setTeamTotals(mapped);
      } catch (e) {
        console.error('Failed to fetch team totals:', e);
        setTeamTotals({});
      }
    };

    fetchTeamTotals();
  }, []);

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

  /* -------- Fetch Team Breakdown (for modal) -------- */
  const fetchTeamBreakdown = async (code: string) => {
    if (!code) return;

    try {
      setTeamBreakdownLoading(true);

      let company_id: string | undefined;

      if (typeof window !== 'undefined') {
        const u = JSON.parse(localStorage.getItem('user') || '{}');
        company_id = localStorage.getItem('company_id') || u?.company_id || undefined;
      }

      const res = await api.get(`/performance-upload/team-breakdown/${code}`, {
        params: { company_id },
      });

      const data = res.data || {};

      // Map backend response to frontend format

      const employeeName = data.employee?.name || code;
      const members: TeamBreakdownMember[] = (data.memberBreakdown || []).map((m: any) => ({
        code: m.code || '',
        employee_name: m.name || '',
        total_logins: m.logins || 0,
        approval_amount: m.approval || 0,
        disbursal_amount: m.disbursal || 0,
      }));

      const totals = data.totals || {};

      setTeamBreakdown({
        code: data.employee?.code || code,
        employeeName: employeeName,
        members: members,
        totals: {
          logins: totals.totalLogins || 0,
          approval: totals.totalApproval || 0,
          disbursal: totals.totalDisbursal || 0,
        },
      });
      setTeamModalOpen(true);
    } catch (e) {
      console.error('Failed to fetch team breakdown:', e);
      setTeamBreakdown(null);
    } finally {
      setTeamBreakdownLoading(false);
    }
  };
  const fetchTodayLeaves = async () => {
    try {
      console.log("🔥 Fetching Today's Leaves...");

      // ⭐ FIX — company_id FE se load kiya
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const company_id = localStorage.getItem("company_id") || user.company_id || "";

      const url = `${process.env.NEXT_PUBLIC_APP_URL}/attendence/today-leaves?company_id=${company_id}`;



      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "x-company-id": company_id
        }
      });

      const data = await response.json();


      return (data.employees || []).map((item) =>
        String(item?.employee?.code || "")
          .trim()
          .replace(/[^a-zA-Z0-9]/g, "")
          .toLowerCase()
      );

    } catch (err) {
      console.error("❌ Error in fetchTodayLeaves:", err);
      return [];
    }
  };



  const fetchMissing = async (kw = "") => {
    try {

      setMissingLoading(true);


      const res = await api.get("/performance/missing/list", {
        params: { date: pickDate, keyword: kw }
      });

      const missing = res.data.missingEmployees || [];


      const submitted = res.data.submittedCount || 0;
      setSubmittedCount(submitted);
      const leaveCodes = await fetchTodayLeaves();


      const finalList = missing.filter((emp) => {
        const cleanCode = String(emp.code || "")
          .trim()
          .replace(/[^a-zA-Z0-9]/g, "")
          .toLowerCase();

        return !leaveCodes.includes(cleanCode);
      });

      setMissingList(finalList);
      setMissingCount(finalList.length);
      setMissingOpen(true);

    } catch (err) {
      console.error("❌ Missing fetch error:", err);
    } finally {
      setMissingLoading(false);
    }
  };


  useEffect(() => {
    console.log("Updated Missing List:", missingList);
  }, [missingList]);


  // 🔹 logged-in user ka Excel summary (sirf uska code)
  const myCodeSummary: CodeSummaryRow | undefined = useMemo(() => {
    if (!myCode) return undefined;

    return codeSummaryMap[myCode] || undefined;
  }, [myCode, codeSummaryMap]);

  /* -------- List fetch -------- */
  const fetchList = async () => {
    try {
      setLoading(true);
      const params: any = { page, limit, month, year, date: pickDate };

      if (searchName.trim()) params.keyword = searchName.trim();
      if (userRole === '2') params.role = 'manager';
      if (userRole === '3') params.role = 'employee';
      if (selectedTeamId) params.team_id = selectedTeamId;

      const res = await api.get('/performance/list', { params });
      console.log(res, "res is:::::")
      let { data, total } = res.data || { data: [], total: 0 };

      if (
        Array.isArray(data) &&
        data.length > 0 &&
        Array.isArray(data[0]?.records)
      ) {
        const flat: any[] = [];

        data.forEach((g: any) =>
          (g.records || []).forEach((r: any) => {
            if (!r.employee && g.employee) r.employee = g.employee;
            flat.push(r);
          })
        );
        data = flat;
      }

      data = (data || []).filter((d: any) => {
        const rowDate = dayjs(d?.date).format("YYYY-MM-DD");
        return rowDate === pickDate;
      });


      const needle = searchName.trim().toLowerCase();

      if (needle) {
        data = (data || []).filter((r: any) => {
          const emp = r?.employee || {};

          const name = `${emp?.first_name || ''} ${emp?.last_name || ''
            }`
            .trim()
            .toLowerCase();

          return name.includes(needle);
        });
      }

      // Apply Manager/TL filter
      if (managerTlFilter && managerTlFilter !== 'all' && teamTotals[managerTlFilter]) {
        const memberCodes = new Set(teamTotals[managerTlFilter].memberCodes || []);
        data = (data || []).filter((r: any) => {
          const empCode = r?.employee?.code || '';
          return memberCodes.has(empCode);
        });
      }

      setItems((data || []).map(mapServerToCardItem));
      setTotal(Number(total) || data?.length || 0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (
      userRole &&
      (teams.length === 0 ||
        selectedTeamId ||
        userRole !== '2')
    ) {
      fetchList();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    userRole,
    month,
    year,
    selectedDate,
    searchName,
    page,
    limit,
    selectedTeamId,
    managerTlFilter,
    teamTotals,
  ]);

  /* -------- Edit / Details handlers -------- */
  const handleEditClick = (id: string) => {
    setSelectedPerformanceId(id);
    setShowForm(true);
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
    setSelectedDate(null);
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

    const fileName = `${monthNames[month - 1]} ${year}${selectedDate ? ' - ' + selectedDate.format('YYYY-MM-DD') : ''
      } performance_summary.csv`;

    const rows = items.map((p: any) => {
      const name = `${p?.employee?.first_name || ''} ${p?.employee?.last_name || ''
        }`.trim();

      const pretty = (n: number) =>
        p?.unit === 'rupee' ? rupee(n) : n;

      return [
        name,
        p?.date ? dayjs(p.date).format('YYYY-MM-DD') : '',
        p?.taskTitle || '',
        pretty(p?.target ?? 0),
        pretty(p?.completed ?? 0),
        pretty(
          Math.max((p?.target ?? 0) - (p?.completed ?? 0), 0)
        ),
        p?.status || '',
      ];
    });

    const header = [
      [
        'Employee Name',
        'Date',
        'Task Title',
        'Target',
        'Completed',
        'Remaining',
        'Status',
      ],
    ];

    const csvContent = [...header, ...rows]
      .map((r) => r.join(','))
      .join('\n');

    const blob = new Blob([csvContent], {
      type: 'text/csv;charset=utf-8;',
    });

    const a = document.createElement('a');

    a.href = URL.createObjectURL(blob);
    a.setAttribute('download', fileName);
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

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
              <Typography
                sx={{
                  fontSize: { xs: 22, md: 28 },
                  fontWeight: 900,
                  letterSpacing: 0.2,
                }}
                variant="h5"
              >
                Performance
              </Typography>
              <Typography
                variant="subtitle2"
                sx={{ opacity: 0.7, fontWeight: 700 }}
              >
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
                slotProps={{
                  textField: { fullWidth: true, size: 'medium' },
                }}
              />
            </LocalizationProvider>
          </Grid>

          <Grid item xs={12} md={2}>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DatePicker
                label="Select Date"
                value={selectedDate}
                onChange={onDateChange}
                slotProps={{
                  textField: { fullWidth: true, size: 'medium' },
                }}
              />
            </LocalizationProvider>
          </Grid>

          <Grid
            item
            xs={12}
            md="auto"
            sx={{
              ml: 'auto',
              display: 'flex',
              justifyContent: 'flex-end',
            }}
          >
            <Stack
              direction="row"
              spacing={0.5}
              sx={{ flexWrap: 'nowrap', alignItems: 'center' }}
            >
              <Button
                variant="outlined"
                startIcon={<VisibilityIcon />}
                onClick={() => router.push(`./performance-upload`)}
                sx={{
                  borderRadius: 2,
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                }}
                size="small"
              >
                View Performance
              </Button>
              <Button
                variant="outlined"
                color="error"
                startIcon={<BlockIcon />}
                onClick={fetchMissing}
                size="small"
                sx={{
                  px: 1.2,
                  minWidth: "auto",
                  borderRadius: 1,
                  fontWeight: 600,
                  textTransform: "none",
                  whiteSpace: "nowrap"
                }}
              >
                Missing Upload
              </Button>


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

              {['2', '3'].includes(String(userRole)) && (
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

        <Grid
          container
          spacing={2}
          alignItems="center"
          sx={{ mt: 1 }}
        >
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

          {/* Manager/TL Filter Dropdown - visible to Admin only */}
          {userRole === '1' && managerTlList.length > 0 && (
            <Grid item xs={12} md={4}>
              <TextField
                select
                fullWidth
                size="small"
                label="Filter by Manager/TL"
                value={managerTlFilter}
                onChange={(e) => {
                  setManagerTlFilter(e.target.value);
                  setPage(1);
                }}
                sx={{
                  '& .MuiInputBase-input': { py: 1.5 },
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
                      <span>{item.code}</span>
                    </Box>
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
          )}

          <Grid item xs={false} md />
        </Grid>
      </Paper>
    ),
    [year, month, selectedDate, userRole, uploading, searchName, managerTlFilter, managerTlList]
  );

  const canEditCards = true;

  return (
    <Box>
      <DetailsDrawer
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        doc={detailsDoc}
      />

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

      <Box
        sx={{

          top: 0,
          zIndex: 1, bgcolor: 'background.default',
          p: 2,
          pb: 1,
        }}
      >
        {HeaderToolbar}

        <Dialog
          open={showForm}
          onClose={() => setShowForm(false)}
          fullWidth
          maxWidth="md"
        >
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

      <Box sx={{ px: 2, pt: 3, pb: 6 }}>
        {/* 🔹 Code Summary Section */}
        <Paper
          elevation={0}
          sx={{
            mb: 3,
            p: 2,
            borderRadius: 3,
            border: '1px solid',
            borderColor: 'divider',
            background: 'linear-gradient(180deg,#ffffff 0%,#fafbff 100%)',
          }}
        >

          <>
            {codeSummaryLoading ? (
              <Typography
                variant="body2"
                color="text.secondary"
              >
                Fetching your code summary…
              </Typography>
            ) : !myCodeSummary ? (
              <Typography
                variant="body2"
                color="text.secondary"
              >

              </Typography>
            ) : (
              <Grid container spacing={2}>
                <Grid item xs={6} md={3}>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                  >
                    Total Logins
                  </Typography>
                  <Typography
                    variant="h6"
                    sx={{ fontWeight: 900 }}
                  >
                    {myCodeSummary.totalLogins}
                  </Typography>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                  >
                    Total Approval
                  </Typography>
                  <Typography
                    variant="h6"
                    sx={{ fontWeight: 900 }}
                  >
                    {rupee(myCodeSummary.totalApproval)}
                  </Typography>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                  >
                    Total Disbursal
                  </Typography>
                  <Typography
                    variant="h6"
                    sx={{ fontWeight: 900 }}
                  >
                    {rupee(myCodeSummary.totalDisbursal)}
                  </Typography>
                </Grid>

              </Grid>
            )}
          </>

        </Paper>


        {loading ? (
          <Grid container spacing={2}>
            {Array.from({ length: 6 }).map((_, i) => (
              <Grid key={i} item xs={12} sm={6} md={6}>
                <Paper
                  sx={{ p: 2.5, borderRadius: 3 }}
                >
                  <Skeleton
                    variant="rectangular"
                    height={130}
                    sx={{ borderRadius: 2 }}
                  />
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
            sx={{
              p: 5,
              borderRadius: 3,
              textAlign: 'center',
              background:
                'linear-gradient(180deg,#ffffff 0%,#fafafa 100%)',
            }}
          >
            <Typography
              variant="h6"
              sx={{ fontWeight: 900, mb: 0.75 }}
            >
              No records
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
            >
              Try changing month/year, date, search, or open{' '}
              <b>My Team Performance</b>.
            </Typography>
          </Paper>
        ) : (
          <Grid container spacing={2.25}>
            {items.map((p) => {
              const empId = String(
                p?.employee?._id ||
                p?.employee_id ||
                p?.owner_id ||
                ''
              );

              const mtd = empId && mtdMap[empId]
                ? mtdMap[empId]
                : { ...emptyMtd, loading: true };

              // 🔹 yahan employee.code ya fallback myCode se Excel summary pick kar rahe
              const empCode = (p?.employee?.code || myCode || '').trim();

              const excelSummary = empCode
                ? codeSummaryMap?.[empCode]
                : undefined;

              // Get team total for this employee (if they're a manager/TL)
              const teamTotal = empCode ? teamTotals[empCode] : undefined;

              return (
                <Grid key={p?._id} item xs={12} sm={6} md={6}>
                  <PerformanceCard
                    item={p}
                    onEdit={
                      canEditCards ? () => handleEditClick(p?._id) : undefined
                    }
                    onDetails={openDetails}
                    mtd={mtd}
                    canEdit={canEditCards}
                    excelSummary={excelSummary}
                    teamTotal={teamTotal}
                    onViewTeamDetails={fetchTeamBreakdown}
                  />
                </Grid>
              );


            })}
          </Grid>
        )}
      </Box>

      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          mt: -2,
          mb: 4,
        }}
      >
        <Pagination
          count={Math.max(1, Math.ceil((total || 0) / limit))}
          page={page}
          onChange={(_, n) => setPage(n)}
          color="primary"
          size="large"
          sx={{ '& .MuiPagination-ul': { gap: 0.5 } }}
        />
      </Box>

      {/* Team Breakdown Modal */}
      <Dialog
        open={teamModalOpen}
        onClose={() => setTeamModalOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
          },
        }}
      >
        <DialogTitle
          sx={{
            background: 'linear-gradient(90deg,#EEF2FF 0%, #E0EAFF 100%)',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            py: 2,
          }}
        >
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800 }}>
              🏆 Team Performance Breakdown
            </Typography>
            <Typography variant="body1" sx={{ opacity: 1, marginLeft: 6 }}>
              {teamBreakdown?.employeeName || teamBreakdown?.code || 'Team'}
            </Typography>
          </Box>
          <IconButton onClick={() => setTeamModalOpen(false)} sx={{ color: '#fff' }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ p: 3 }}>
          {teamBreakdownLoading ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography>Loading team data...</Typography>
            </Box>
          ) : !teamBreakdown ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography color="text.secondary">No team data available</Typography>
            </Box>
          ) : (
            <>
              {/* Summary Cards */}
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={4}>
                  <Paper
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      background: 'linear-gradient(15deg, #667eea 0%, #764ba2 100%)',
                      color: '#fff',
                      textAlign: 'center',
                    }}
                  >
                    <PeopleIcon sx={{ fontSize: 32, mb: 1 }} />
                    <Typography variant="h4" sx={{ fontWeight: 800, color: "#fff" }}>
                      {teamBreakdown.totals.logins}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9, color: "black" }}>
                      Total Team Logins
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Paper
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
                      color: '#fff',
                      textAlign: 'center',
                    }}
                  >
                    <AccountBalanceWalletIcon sx={{ fontSize: 32, mb: 1 }} />
                    <Typography variant="h4" sx={{ fontWeight: 800, color: "#fff" }}>
                      {rupee(teamBreakdown.totals.approval)}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9, color: "black" }}>
                      Total Team Approval
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Paper
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      background: 'linear-gradient(135deg, #FDE047 0%, #FACC15 100%)',

                      color: '#fff',
                      textAlign: 'center',
                    }}
                  >
                    <PaymentsIcon sx={{ fontSize: 32, mb: 1 }} />
                    <Typography variant="h4" sx={{ fontWeight: 800, color: "#fff" }}>
                      {rupee(teamBreakdown.totals.disbursal)}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9, color: "black" }}>
                      Total Team Disbursal
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>

              {/* Members Table */}
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
                Team Members ({teamBreakdown.members.length})
              </Typography>
              <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: '#f8fafc' }}>
                      <TableCell sx={{ fontWeight: 700 }}>Code</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Employee Name</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>Logins</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>Approval (₹)</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>Disbursal (₹)</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {teamBreakdown.members.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                          <Typography color="text.secondary">No member data found</Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      teamBreakdown.members.map((member, idx) => (
                        <TableRow key={idx} hover>
                          <TableCell>
                            <Chip size="small" label={member.code} variant="outlined" />
                          </TableCell>
                          <TableCell>{member.employee_name || '—'}</TableCell>
                          <TableCell align="right">{member.total_logins}</TableCell>
                          <TableCell align="right">{rupee(member.approval_amount)}</TableCell>
                          <TableCell align="right">{rupee(member.disbursal_amount)}</TableCell>
                        </TableRow>
                      ))
                    )}
                    {/* Totals Row */}
                    {teamBreakdown.members.length > 0 && (
                      <TableRow sx={{ bgcolor: '#f0f9ff' }}>
                        <TableCell colSpan={2} sx={{ fontWeight: 800 }}>
                          TOTAL
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 800 }}>
                          {teamBreakdown.totals.logins}
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 800 }}>
                          {rupee(teamBreakdown.totals.approval)}
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 800 }}>
                          {rupee(teamBreakdown.totals.disbursal)}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          )}
        </DialogContent>
      </Dialog>
      <Dialog
        key={missingList.length}
        open={missingOpen}
        onClose={() => setMissingOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Missing Performance – {pickDate}
        </DialogTitle>

        <DialogContent dividers>

          {/* 🔍 Search Box */}
          <TextField
            size="small"
            fullWidth
            placeholder="Search employee..."
            value={missingSearch}
            onChange={(e) => {
              setMissingSearch(e.target.value);
              fetchMissing(e.target.value);
            }}
            sx={{ mb: 2 }}
          />


          {(() => {
            const allowedDesignations = [
              "Relationship Executive",
              "Relationship Manager",
              "Asst. Team Leader",
              "Team Leader",
              "Branch Manager",
              "Area Head",
              "Channel Partner",
              "Manager",
              "Senior Team Leader",
              "Sales Manager",
              "Relationship Manager",
              "Financial Sales Intern",
              "Growth Manager",
              "Assistant Growth Manager",

            ];


            const filteredList = missingList?.filter(emp =>
              allowedDesignations.includes(emp.designation)
            );

            if (!filteredList || filteredList.length === 0) {
              return (
                <Typography color="success.main">
                  All employees submitted performance 🎉
                </Typography>
              );
            }

            return (
              <>
                <Typography variant="h6" sx={{ mb: 1 }}>
                  ❌ Missing Evening Employees ({filteredList.length}) || Submitted Morning Employees ({submittedCount})
                </Typography>

                <Stack spacing={1.5}>
                  {filteredList.map((emp) => (
                    <Paper
                      key={emp.id}
                      sx={{
                        p: 1.5,
                        borderRadius: 2,
                        border: "1px solid #ddd",
                      }}
                    >
                      <Typography fontWeight={700}>{emp.name}</Typography>
                      <Typography variant="caption">
                        Code: {emp.code} • {emp.designation}
                      </Typography>

                      <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                        <Chip
                          label={emp.filledMorning ? "Morning ✓" : "Morning ✗"}
                          size="small"
                          color={emp.filledMorning ? "success" : "error"}
                          variant={emp.filledMorning ? "outlined" : "filled"}
                        />

                        <Chip
                          label={emp.filledEvening ? "Evening ✓" : "Evening ✗"}
                          size="small"
                          color={emp.filledEvening ? "success" : "error"}
                          variant={emp.filledEvening ? "outlined" : "filled"}
                        />
                      </Stack>
                    </Paper>
                  ))}
                </Stack>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>



    </Box>
  );
}
