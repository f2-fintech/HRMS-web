'use client';

import React from 'react';
import {
  Avatar,
  Box,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  LinearProgress,
  Paper,
  Skeleton,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import HourglassBottomIcon from '@mui/icons-material/HourglassBottom';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import TrendingUpOutlinedIcon from '@mui/icons-material/TrendingUpOutlined';
import dayjs from 'dayjs';

type Emp = any;

type PerfMap = Record<
  string,
  {
    status: 'done' | 'in_progress' | 'planned';
    date?: string;
    raw?: any; // complete snapshot used to extract morning/evening values
  }
>;

const pct = (planned = 0, done = 0) => {
  const p = Number(planned) || 0;
  const d = Number(done) || 0;
  if (p <= 0) return d > 0 ? 100 : 0;
  return Math.max(0, Math.min(100, Math.round((d / p) * 100)));
};

const fullName = (e: any) => `${e?.first_name || ''} ${e?.last_name || ''}`.trim();

// pull morning targets & evening actuals (EMPLOYEE role)
const buildPairsForEmployee = (raw: any) => {
  const m = raw?.re?.morning || {};
  const e = raw?.re?.evening || {};
  return [
    { key: 'phone', label: 'Phone Connects', morning: Number(m.phoneConnects || 0), evening: Number(e.phoneConnectsDone || 0), unit: 'count' },
    { key: 'meet', label: 'Physical Meets', morning: Number(m.physicalMeet || 0), evening: Number(e.physicalMeetDone || 0), unit: 'count' },
    { key: 'login', label: 'Logins', morning: Number(m.expectedLogins || 0), evening: Number(e.loginsDone || 0), unit: 'count' },
    { key: 'appr', label: 'Approvals (₹)', morning: Number(m.expectedApprovals || 0), evening: Number(e.approvalsDone || 0), unit: 'rupee' },
    { key: 'disb', label: 'Disbursals (₹)', morning: Number(m.expectedDisbursal || 0), evening: Number(e.disbursalDone || 0), unit: 'rupee' },
  ];
};

const prettyNum = (n: number, unit: 'rupee' | 'count') =>
  unit === 'rupee' ? `₹${Intl.NumberFormat('en-IN').format(n || 0)}` : `${n || 0}`;

function StatusChip({ status }: { status?: string }) {
  if (status === 'done') return <Chip size="small" color="success" label="Done" />;
  if (status === 'in_progress') return <Chip size="small" color="warning" label="In Progress" />;
  return <Chip size="small" label="Planned" />;
}

function CompareRow({
  label,
  morning,
  evening,
  unit,
}: {
  label: string;
  morning: number;
  evening: number;
  unit: 'rupee' | 'count';
}) {
  const progress = pct(morning, evening);
  const achieved = morning > 0 && evening >= morning;
  const pending = Math.max(morning - evening, 0);

  return (
    <Paper
      variant="outlined"
      sx={{
        p: 1.25,
        borderRadius: 2,
        background: achieved
          ? 'linear-gradient(180deg, rgba(76,175,80,0.08) 0%, rgba(76,175,80,0.02) 100%)'
          : 'linear-gradient(180deg, #fff 0%, #fafbff 100%)',
      }}
    >
      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{label}</Typography>

      <Stack direction="row" spacing={1} sx={{ mt: 0.5, flexWrap: 'wrap' }}>
        <Chip size="small" icon={<TrendingUpOutlinedIcon />} label={`Morning: ${prettyNum(morning, unit)}`} variant="outlined" />
        <Chip size="small" color={achieved ? 'success' : 'default'} icon={<DoneAllIcon />} label={`Evening: ${prettyNum(evening, unit)}`} variant={achieved ? 'filled' : 'outlined'} />
        <Chip size="small" color={achieved ? 'success' : 'warning'} icon={<HourglassBottomIcon />} label={achieved ? 'Achieved' : `Pending: ${prettyNum(pending, unit)}`} variant={achieved ? 'outlined' : 'filled'} />
      </Stack>

      <Box sx={{ mt: 1 }}>
        <LinearProgress variant="determinate" value={progress} sx={{ height: 8, borderRadius: 10 }} />
        <Typography variant="caption" color="text.secondary">{progress}% achieved</Typography>
      </Box>
    </Paper>
  );
}

function EmployeeCard({
  emp,
  perf,
  onSelect,
}: {
  emp: Emp;
  perf?: PerfMap[string];
  onSelect: () => void;
}) {
  const raw = perf?.raw;
  const pairs = raw?.role === 'manager'
    ? [] // you asked to show employee morning vs evening; skip manager aggregates here
    : buildPairsForEmployee(raw || {});
  const dateStr = perf?.date ? dayjs(perf.date).format('DD MMM YYYY') : null;

  return (
    <Paper
      onClick={onSelect}
      variant="outlined"
      sx={{
        p: 2,
        borderRadius: 3,
        cursor: 'pointer',
        transition: 'all .2s ease',
        '&:hover': { boxShadow: 3, transform: 'translateY(-2px)' },
      }}
    >
      <Stack direction="row" spacing={1.5} alignItems="center">
        <Avatar src={emp?.image || ''} sx={{ width: 50, height: 50 }} />
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 900 }} noWrap>
            {fullName(emp) || emp?._id}
          </Typography>
          {emp?.designation && (
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
              {emp.designation}
            </Typography>
          )}
          {emp?.email && (
            <Tooltip title={emp.email}>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }} noWrap>
                {emp.email}
              </Typography>
            </Tooltip>
          )}
        </Box>
        <StatusChip status={perf?.status} />
      </Stack>

      <Divider sx={{ my: 1.25 }} />

      {!perf?.raw ? (
        <Typography variant="body2" color="text.secondary">No snapshot for this month.</Typography>
      ) : (
        <Stack spacing={1}>
          {pairs.map((p) => (
            <CompareRow
              key={p.key}
              label={p.label}
              morning={p.morning}
              evening={p.evening}
              unit={p.unit as 'rupee' | 'count'}
            />
          ))}

          {dateStr && (
            <Chip
              size="small"
              icon={<CalendarMonthIcon fontSize="small" />}
              label={dateStr}
              variant="outlined"
              sx={{ alignSelf: 'flex-start' }}
            />
          )}
        </Stack>
      )}
    </Paper>
  );
}

export default function MyTeamPerformanceDialog({
  open,
  onClose,
  teams,
  month,
  year,
  loading,
  empPerf,
  onSelectEmployee,
}: {
  open: boolean;
  onClose: () => void;
  teams: Emp[];
  month: number;
  year: number;
  loading: boolean;
  empPerf: PerfMap;
  onSelectEmployee: (emp: Emp, perf?: PerfMap[string]) => void;
}) {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pr: 1 }}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 900 }}>My Team Performance</Typography>
          <Typography variant="caption" color="text.secondary">
            {dayjs(new Date(year, month - 1)).format('MMMM YYYY')}
          </Typography>
        </Box>
        <IconButton onClick={onClose} aria-label="close">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ bgcolor: 'background.default' }}>
        {loading && (
          <Grid container spacing={2}>
            {Array.from({ length: 4 }).map((_, i) => (
              <Grid item xs={12} sm={6} key={i}>
                <Paper sx={{ p: 2, borderRadius: 3 }}>
                  <Skeleton variant="rectangular" height={140} sx={{ borderRadius: 2 }} />
                </Paper>
              </Grid>
            ))}
          </Grid>
        )}

        {!loading && teams.length === 0 && (
          <Paper variant="outlined" sx={{ p: 3, borderRadius: 3, textAlign: 'center' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: .25 }}>No team members</Typography>
            <Typography variant="body2" color="text.secondary">
              Add members to your team to see performance here.
            </Typography>
          </Paper>
        )}

        {!loading && teams.length > 0 && (
          <Grid container spacing={2}>
            {teams.map((emp) => {
              const perf = empPerf[emp._id];
              return (
                <Grid item xs={12} sm={6} key={emp._id}>
                  <EmployeeCard
                    emp={emp}
                    perf={perf}
                    onSelect={() => onSelectEmployee(emp, perf)}
                  />
                </Grid>
              );
            })}
          </Grid>
        )}
      </DialogContent>
    </Dialog>
  );
}
