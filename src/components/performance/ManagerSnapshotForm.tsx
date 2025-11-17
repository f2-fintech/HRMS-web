'use client';

import React, { useEffect, useState } from 'react';

import {
  Box,
  Container,
  Grid,
  Paper,
  Typography,
  Divider,
  Button,
  TextField,
  ToggleButtonGroup,
  ToggleButton,
  IconButton,
  Switch,
  FormControlLabel,
  Tooltip,
  Snackbar,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ScheduleIcon from '@mui/icons-material/Schedule';
import NightlightIcon from '@mui/icons-material/Nightlight';
import StarIcon from '@mui/icons-material/Star';
import axios from 'axios';

/* ---------------- axios ---------------- */
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_APP_URL,
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token') || '';
    const userRaw = localStorage.getItem('user');
    const user = userRaw ? JSON.parse(userRaw) : null;

    const company_id =
      user?.company_id ??
      user?.companyId ??
      user?.company?._id ??
      user?.company?.id;

    if (token)
      (config.headers as any).Authorization = `Bearer ${token}${company_id ? ` ${company_id}` : ''
        }`;
    if (company_id) (config.headers as any)['x-company-id'] = company_id;
  }

  return config;
});

/* ---------------- helpers ---------------- */
const todayISO = () => new Date().toISOString().split('T')[0];

const clientTypes = [
  { value: 'cold', label: 'Cold' },
  { value: 'call', label: 'Call' },
  { value: 'appointment', label: 'Appointment' },
  { value: 'channel_partner', label: 'Channel Partner Visit' },
];

/* ---------------- types ---------------- */
type Mode = 'morning' | 'evening';
type InternalRow = { count: string };
type BankerRow = { lenderName: string; lenderContact: string; count: string };
type ClientRow = { type: string; count: string };
type StuckRow = { location: string; reason: string };

type SnapshotResponse = {
  date: string;
  morning?: {
    teamTargetLoanLacs?: number;
    ownContribution?: {
      login?: number;
      approvalLacs?: number;
      disbursalLacs?: number;
    };
    teamMembers?: {
      working?: number;
      total?: number;
    };
    meetings?: {
      internal?: number;
      bankers?: number;
      clients?: number;
      bankerDetails?: {
        lenderName?: string;
        lenderContact?: string;
        count?: number;
      }[];
      clientDetails?: {
        type: string;
        count: number;
      }[];
    };
    expected?: {
      loginsTeam?: number;
      approvalLacs?: number;
      disbursalAmount?: number;
    };
    tillDate?: {
      login?: number;
      approvalLacs?: number;
      disbursalLacs?: number;
    };
  };
  evening?: {
    teamLoginsDone?: number;
    teamApprovalDoneAmount?: number;

    teamDisbursalDoneAmount?: number;
    topPerformer?: {
      name?: string;
      valueLacs?: number;
    };
    filesStuck?: {
      location?: string;
      reason?: string;
    }[];
    supportRequired?: string;
    overallSentiment?: 'green' | 'yellow' | 'red';
    sentimentReason?: string | null;
  };
};

/* ---------------- component ---------------- */
export default function ManagerSnapshotForm({
  handleClose,
  onSaved,
}: {
  handleClose?: () => void;
  onSaved?: () => void;
}) {
  const [mode, setMode] = useState<Mode>('morning');
  const [date, setDate] = useState<string>(todayISO());

  // Snackbar (top-center)
  const [snack, setSnack] = useState<{
    open: boolean;
    msg: string;
    type: 'success' | 'error' | 'info';
  }>({
    open: false,
    msg: '',
    type: 'success',
  });

  const notify = (
    msg: string,
    type: 'success' | 'error' | 'info' = 'success',
  ) => setSnack({ open: true, msg, type });

  /* -------- Morning (manual numeric input) -------- */
  const [teamTargetLacs, setTeamTargetLacs] = useState<string>('');
  const [ownLoginCount, setOwnLoginCount] = useState<string>('');
  const [ownApprovalLacs, setOwnApprovalLacs] = useState<string>('');
  const [ownDisbursalLacs, setOwnDisbursalLacs] = useState<string>('');
  const [activeHeadcount, setActiveHeadcount] = useState<string>('');

  // Meetings — ALL TOGETHER in same card now
  const [hasInternal, setHasInternal] = useState(false);
  const [hasBanker, setHasBanker] = useState(false);
  const [hasClient, setHasClient] = useState(false);

  const [internalList, setInternalList] = useState<InternalRow[]>([]);
  const [bankerList, setBankerList] = useState<BankerRow[]>([]);
  const [clientList, setClientList] = useState<ClientRow[]>([]);

  const addInternal = () => setInternalList((p) => [...p, { count: '' }]);

  const updateInternal = (i: number, count: string) =>
    setInternalList((p) => p.map((r, idx) => (idx === i ? { ...r, count } : r)));

  const removeInternal = (i: number) =>
    setInternalList((p) => p.filter((_, idx) => idx !== i));

  const addBanker = () =>
    setBankerList((p) => [
      ...p,
      { lenderName: '', lenderContact: '', count: '' },
    ]);

  const updateBanker = (i: number, key: keyof BankerRow, val: string) =>
    setBankerList((p) =>
      p.map((r, idx) => (idx === i ? { ...r, [key]: val } : r)),
    );

  const removeBanker = (i: number) =>
    setBankerList((p) => p.filter((_, idx) => idx !== i));

  const addClient = () =>
    setClientList((p) =>
      p.length < 3 ? [...p, { type: 'cold', count: '' }] : p,
    );

  const updateClient = (i: number, key: keyof ClientRow, val: string) =>
    setClientList((p) =>
      p.map((r, idx) => (idx === i ? { ...r, [key]: val } : r)),
    );

  const removeClient = (i: number) =>
    setClientList((p) => p.filter((_, idx) => idx !== i));

  const [expectedLogins, setExpectedLogins] = useState<string>('');

  const [expectedApprovalLacs, setExpectedApprovalLacs] =
    useState<string>('');

  const [expectedDisbursalAmount, setExpectedDisbursalAmount] =
    useState<string>(''); // ₹

  const [tillDateLogin, setTillDateLogin] = useState<string>('');

  const [tillDateApprovalLacs, setTillDateApprovalLacs] =
    useState<string>('');

  const [tillDateDisbursalLacs, setTillDateDisbursalLacs] =
    useState<string>('');

  /* -------- Evening (manual numeric input) -------- */
  const [teamLoginsDone, setTeamLoginsDone] = useState<string>('');

  const [teamApprovalDoneAmount, setTeamApprovalDoneAmount] =
    useState<string>(''); // ₹

  const [filesStuckDescription, setFilesStuckDescription] = useState('');
  const [teamDisbursalDoneAmount, setTeamDisbursalDoneAmount] = useState<string>(''); // ₹

  const [topPerformerName, setTopPerformerName] = useState<string>('');

  const [topPerformerValueLacs, setTopPerformerValueLacs] =
    useState<string>('');

  const [filesStuck, setFilesStuck] = useState<StuckRow[]>([]);
  const [supportRequired, setSupportRequired] = useState<string>('');

  const [overallSentiment, setOverallSentiment] =
    useState<'green' | 'yellow' | 'red'>('green');

  const [sentimentReason, setSentimentReason] = useState<string>('');

  const addStuck = () =>
    setFilesStuck((p) => [...p, { location: '', reason: '' }]);

  const updateStuck = (i: number, key: keyof StuckRow, val: string) =>
    setFilesStuck((p) =>
      p.map((row, idx) => (idx === i ? { ...row, [key]: val } : row)),
    );

  const removeStuck = (i: number) =>
    setFilesStuck((p) => p.filter((_, idx) => idx !== i));

  /* -------- LOAD existing snapshot (DB -> UI) -------- */
  const loadSnapshot = async (selectedDate: string) => {
    try {
      const res = await api.get<SnapshotResponse>('/performance/manager', {
        params: { date: selectedDate },
      });

      const data = res.data;
      const morning = data.morning;
      const evening = data.evening;

      // ------- Morning mapping -------
      if (morning) {
        setTeamTargetLacs(
          morning.teamTargetLoanLacs != null
            ? String(morning.teamTargetLoanLacs)
            : '',
        );

        setOwnLoginCount(
          morning.ownContribution?.login != null
            ? String(morning.ownContribution.login)
            : '',
        );
        setOwnApprovalLacs(
          morning.ownContribution?.approvalLacs != null
            ? String(morning.ownContribution.approvalLacs)
            : '',
        );
        setOwnDisbursalLacs(
          morning.ownContribution?.disbursalLacs != null
            ? String(morning.ownContribution.disbursalLacs)
            : '',
        );

        const working = morning.teamMembers?.working;

        setActiveHeadcount(
          working != null ? String(working) : '',
        );

        // Meetings
        const mMeetings = morning.meetings;

        if (mMeetings) {
          // Internal
          if (mMeetings.internal && mMeetings.internal > 0) {
            setHasInternal(true);
            setInternalList([{ count: String(mMeetings.internal) }]);
          } else {
            setHasInternal(false);
            setInternalList([]);
          }

          // Banker details
          if (mMeetings.bankerDetails && mMeetings.bankerDetails.length) {
            setHasBanker(true);
            setBankerList(
              mMeetings.bankerDetails.map((b) => ({
                lenderName: b.lenderName || '',
                lenderContact: b.lenderContact || '',
                count:
                  b.count != null ? String(b.count) : '',
              })),
            );
          } else {
            setHasBanker(false);
            setBankerList([]);
          }

          // Client details
          if (mMeetings.clientDetails && mMeetings.clientDetails.length) {
            setHasClient(true);
            setClientList(
              mMeetings.clientDetails.map((c) => ({
                type: c.type || 'cold',
                count:
                  c.count != null ? String(c.count) : '',
              })),
            );
          } else {
            setHasClient(false);
            setClientList([]);
          }
        } else {
          setHasInternal(false);
          setInternalList([]);
          setHasBanker(false);
          setBankerList([]);
          setHasClient(false);
          setClientList([]);
        }

        // Expected
        setExpectedLogins(
          morning.expected?.loginsTeam != null
            ? String(morning.expected.loginsTeam)
            : '',
        );
        setExpectedApprovalLacs(
          morning.expected?.approvalLacs != null
            ? String(morning.expected.approvalLacs)
            : '',
        );
        setExpectedDisbursalAmount(
          morning.expected?.disbursalAmount != null
            ? String(morning.expected.disbursalAmount)
            : '',
        );

        // Till date
        setTillDateLogin(
          morning.tillDate?.login != null
            ? String(morning.tillDate.login)
            : '',
        );
        setTillDateApprovalLacs(
          morning.tillDate?.approvalLacs != null
            ? String(morning.tillDate.approvalLacs)
            : '',
        );
        setTillDateDisbursalLacs(
          morning.tillDate?.disbursalLacs != null
            ? String(morning.tillDate.disbursalLacs)
            : '',
        );
      } else {
        // No morning snapshot -> clear fields
        setTeamTargetLacs('');
        setOwnLoginCount('');
        setOwnApprovalLacs('');
        setOwnDisbursalLacs('');
        setActiveHeadcount('');
        setHasInternal(false);
        setInternalList([]);
        setHasBanker(false);
        setBankerList([]);
        setHasClient(false);
        setClientList([]);
        setExpectedLogins('');
        setExpectedApprovalLacs('');
        setExpectedDisbursalAmount('');
        setTillDateLogin('');
        setTillDateApprovalLacs('');
        setTillDateDisbursalLacs('');
      }

      // ------- Evening mapping -------
      if (evening) {
        setTeamLoginsDone(
          evening.teamLoginsDone != null
            ? String(evening.teamLoginsDone)
            : '',
        );
        setTeamApprovalDoneAmount(
          evening.teamApprovalDoneAmount != null
            ? String(evening.teamApprovalDoneAmount)
            : '',
        );
         setTeamDisbursalDoneAmount(
          evening.teamDisbursalDoneAmount != null
            ? String(evening.teamDisbursalDoneAmount)
            : '',
        );

        setTopPerformerName(
          evening.topPerformer?.name || '',
        );
        setTopPerformerValueLacs(
          evening.topPerformer?.valueLacs != null
            ? String(evening.topPerformer.valueLacs)
            : '',
        );

        setFilesStuck(
          (evening.filesStuck || []).map((f) => ({
            location: f.location || '',
            reason: f.reason || '',
          })),
        );

        setSupportRequired(evening.supportRequired || '');
        setOverallSentiment(
          evening.overallSentiment || 'green',
        );
        setSentimentReason(
          evening.sentimentReason || '',
        );
      } else {
        // No evening snapshot -> clear evening
        setTeamLoginsDone('');
        setTeamApprovalDoneAmount('');
        setTopPerformerName('');
        setTopPerformerValueLacs('');
        setFilesStuck([]);
        setSupportRequired('');
        setOverallSentiment('green');
        setSentimentReason('');
      }
    } catch (err: any) {
      // Agar 404 ya no data mila toh fields reset, koi error toast nahi dikhayenge
      setTeamTargetLacs('');
      setOwnLoginCount('');
      setOwnApprovalLacs('');
      setOwnDisbursalLacs('');
      setActiveHeadcount('');
      setHasInternal(false);
      setInternalList([]);
      setHasBanker(false);
      setBankerList([]);
      setHasClient(false);
      setClientList([]);
      setExpectedLogins('');
      setExpectedApprovalLacs('');
      setExpectedDisbursalAmount('');
      setTillDateLogin('');
      setTillDateApprovalLacs('');
      setTillDateDisbursalLacs('');

      setTeamLoginsDone('');
      setTeamApprovalDoneAmount('');
      setTopPerformerName('');
      setTopPerformerValueLacs('');
      setFilesStuck([]);
      setSupportRequired('');
      setOverallSentiment('green');
      setSentimentReason('');
    }
  };

  useEffect(() => {
    // initial load + whenever date change -> DB se data laao
    loadSnapshot(date);
  }, [date]);

  /* -------- Submit handlers (API + snackbar) -------- */
  const saveMorning = async () => {
    const totalInternal = hasInternal
      ? internalList.reduce(
        (a, r) => a + (Number(r.count) || 0),
        0,
      )
      : 0;

    const totalBankers = hasBanker
      ? bankerList.reduce(
        (a, r) => a + (Number(r.count) || 0),
        0,
      )
      : 0;

    const totalClients = hasClient
      ? clientList.reduce(
        (a, r) => a + (Number(r.count) || 0),
        0,
      )
      : 0;

    const bankerDetails = hasBanker
      ? bankerList
        .map((b) => ({
          lenderName: b.lenderName.trim(),
          lenderContact: b.lenderContact.trim(),
          count: Number(b.count) || 0,
        }))
        .filter((b) => b.lenderName || b.lenderContact || b.count > 0)
      : [];

    const clientDetails = hasClient
      ? clientList
        .map((c) => ({
          type: c.type,
          count: Number(c.count) || 0,
        }))
        .filter((c) => c.count > 0)
      : [];

    const morning = {
      teamTargetLoanLacs: Number(teamTargetLacs) || 0,
      ownContribution: {
        login: Number(ownLoginCount) || 0,
        approvalLacs: Number(ownApprovalLacs) || 0,
        disbursalLacs: Number(ownDisbursalLacs) || 0,
      },
      teamMembers: {
        working: Number(activeHeadcount) || 0,
        total: Number(activeHeadcount) || 0,
      },
      meetings: {
        internal: totalInternal,
        bankers: totalBankers,
        clients: totalClients,
        bankerDetails,
        clientDetails,
      },
      expected: {
        loginsTeam: Number(expectedLogins) || 0,
        approvalLacs: Number(expectedApprovalLacs) || 0,
        disbursalAmount: Number(expectedDisbursalAmount) || 0,
      },
      tillDate: {
        login: Number(tillDateLogin) || 0,
        approvalLacs: Number(tillDateApprovalLacs) || 0,
        disbursalLacs: Number(tillDateDisbursalLacs) || 0,
      },
    };

    try {
      await api.post('/performance/manager', { date, morning });
      notify('✅ Morning snapshot saved', 'success');
      onSaved?.();
      handleClose?.();
    } catch (e: any) {
      notify(
        e?.response?.data?.message || '❌ Failed to save morning snapshot',
        'error',
      );
    }
  };

  const saveEvening = async () => {
    if (
      (overallSentiment === 'yellow' || overallSentiment === 'red') &&
      !sentimentReason.trim()
    ) {
      notify(
        'Please add a short reason for Yellow/Red sentiment.',
        'info',
      );

      return;
    }

    const evening = {
      teamLoginsDone: Number(teamLoginsDone) || 0,
      teamApprovalDoneAmount: Number(teamApprovalDoneAmount) || 0,
       teamDisbursalDoneAmount: Number(teamDisbursalDoneAmount) || 0,
      topPerformer: {
        name: topPerformerName.trim(),
        valueLacs: Number(topPerformerValueLacs) || 0,
      },
      filesStuck: filesStuck
        .map((f) => ({
          location: f.location.trim(),
          reason: f.reason.trim(),
        }))
        .filter((f) => f.location || f.reason),
      filesStuckDescription: filesStuckDescription.trim(),
      supportRequired: supportRequired.trim(),
      overallSentiment,
      sentimentReason: sentimentReason.trim() || null,
    };

    try {
      await api.post('/performance/manager', { date, evening });
      notify('🌇 Evening snapshot saved', 'success');
      onSaved?.();
      handleClose?.();
    } catch (e: any) {
      notify(
        e?.response?.data?.message || '❌ Failed to save evening snapshot',
        'error',
      );
    }
  };

  /* ---------------- UI ---------------- */
  return (
    <Box
      sx={{
        py: 2,
        background:
          'radial-gradient(900px 420px at 10% -10%, rgba(99,102,241,0.08), transparent 60%), radial-gradient(800px 420px at 90% -20%, rgba(236,72,153,0.07), transparent 60%)',
      }}
    >
      <Container maxWidth="lg">
        {/* Header + controls */}
        <Paper
          elevation={0}
          sx={{
            p: { xs: 2, md: 3 },
            mb: 2.5,
            borderRadius: 4,
            color: 'white',
          }}
        >
          <Typography variant="h5" sx={{ fontWeight: 900 }}>
            TL / Manager — Daily Snapshot
          </Typography>
          <Grid container spacing={2} sx={{ mt: 1.5 }} alignItems="center">
            <Grid item>
              <TextField
                size="small"
                label="Date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
                sx={{ bgcolor: 'white', borderRadius: 1 }}
              />
            </Grid>
            <Grid item>
              <ToggleButtonGroup
                exclusive
                value={mode}
                onChange={(_, v) => v && setMode(v)}
                size="small"
                color="secondary"
              >
                <ToggleButton value="morning">
                  <ScheduleIcon sx={{ mr: 0.6 }} />
                  Morning
                </ToggleButton>
                <ToggleButton value="evening">
                  <NightlightIcon sx={{ mr: 0.6 }} />
                  Evening
                </ToggleButton>
              </ToggleButtonGroup>
            </Grid>
            <Grid item>
              <Chip
                label="v2"
                size="small"
                sx={{ bgcolor: 'rgba(255,255,255,.25)', color: 'white' }}
              />
            </Grid>
          </Grid>
        </Paper>

        {/* MORNING — with manual inputs + meetings */}
        {mode === 'morning' && (
          <Paper
            elevation={1}
            sx={{
              p: { xs: 2, md: 3 },
              borderRadius: 3,
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            {/* Team Target */}
            <Typography
              variant="subtitle1"
              sx={{ fontWeight: 800, mb: 1 }}
            >
              1) Team Target (In Rupees)
            </Typography>
            <Grid container spacing={2} sx={{ mb: 1 }}>
              <Grid item xs={12} md={3}>
                <TextField
                  size="small"
                  fullWidth
                  label="Enter Amount"
                  type="number"
                  value={teamTargetLacs}
                  onChange={(e) => setTeamTargetLacs(e.target.value)}
                />
              </Grid>
            </Grid>

            <Divider sx={{ my: 2 }} />

            {/* Own Contribution */}
            <Typography
              variant="subtitle1"
              sx={{ fontWeight: 800, mb: 1 }}
            >
              2) Own Contribution
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={3}>
                <TextField
                  size="small"
                  fullWidth
                  label="Login — How many?"
                  type="number"
                  value={ownLoginCount}
                  onChange={(e) => setOwnLoginCount(e.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  size="small"
                  fullWidth
                  label="Approval (In rupees)"
                  type="number"
                  value={ownApprovalLacs}
                  onChange={(e) => setOwnApprovalLacs(e.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  size="small"
                  fullWidth
                  label="Disbursal (In rupees)"
                  type="number"
                  value={ownDisbursalLacs}
                  onChange={(e) => setOwnDisbursalLacs(e.target.value)}
                />
              </Grid>
            </Grid>

            <Divider sx={{ my: 2 }} />

            {/* Headcount */}
            <Typography
              variant="subtitle1"
              sx={{ fontWeight: 800, mb: 1 }}
            >
              3) Total Active Headcount Today
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={3}>
                <TextField
                  size="small"
                  fullWidth
                  label="Active Headcount"
                  type="number"
                  value={activeHeadcount}
                  onChange={(e) => setActiveHeadcount(e.target.value)}
                />
              </Grid>
            </Grid>

            <Divider sx={{ my: 2 }} />

            {/* Meetings */}
            <Typography
              variant="subtitle1"
              sx={{ fontWeight: 800, mb: 1 }}
            >
              4) Meetings (Internal • Banker • Client)
            </Typography>

            {/* Internal meetings */}
            <FormControlLabel
              control={
                <Switch
                  checked={hasInternal}
                  onChange={(e) => {
                    setHasInternal(e.target.checked);
                    if (!e.target.checked) setInternalList([]);
                  }}
                />
              }
              label="Internal / Team"
            />
            {hasInternal && (
              <Box sx={{ mb: 1 }}>
                {internalList.map((row, i) => (
                  <Grid
                    container
                    spacing={1.5}
                    key={`int-${i}`}
                    sx={{ mb: 1 }}
                  >
                    <Grid item xs={10} md={3}>
                      <TextField
                        size="small"
                        fullWidth
                        label="How many"
                        type="number"
                        value={row.count}
                        onChange={(e) =>
                          updateInternal(i, e.target.value)
                        }
                      />
                    </Grid>
                    <Grid
                      item
                      xs={2}
                      md="auto"
                      sx={{ display: 'flex', alignItems: 'center' }}
                    >
                      <Tooltip title="Remove">
                        <IconButton
                          color="error"
                          onClick={() => removeInternal(i)}
                        >
                          <DeleteOutlineIcon />
                        </IconButton>
                      </Tooltip>
                    </Grid>
                  </Grid>
                ))}
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={addInternal}
                >
                  Add Internal
                </Button>
              </Box>
            )}

            {/* Banker / partner meetings */}
            <FormControlLabel
              control={
                <Switch
                  checked={hasBanker}
                  onChange={(e) => {
                    setHasBanker(e.target.checked);
                    if (!e.target.checked) setBankerList([]);
                  }}
                />
              }
              label="Banker / Partner"
            />
            {hasBanker && (
              <Box sx={{ mb: 1 }}>
                {bankerList.map((row, i) => (
                  <Grid
                    container
                    spacing={1.5}
                    key={`bank-${i}`}
                    sx={{ mb: 1 }}
                  >
                    <Grid item xs={12} md={3}>
                      <TextField
                        size="small"
                        fullWidth
                        label="Lender Name"
                        value={row.lenderName}
                        onChange={(e) =>
                          updateBanker(i, 'lenderName', e.target.value)
                        }
                      />
                    </Grid>
                    <Grid item xs={12} md={3}>
                      <TextField
                        size="small"
                        fullWidth
                        label="Lender Contact"
                        value={row.lenderContact}
                        onChange={(e) =>
                          updateBanker(i, 'lenderContact', e.target.value)
                        }
                      />
                    </Grid>
                    <Grid item xs={10} md={3}>
                      <TextField
                        size="small"
                        fullWidth
                        label="How many"
                        type="number"
                        value={row.count}
                        onChange={(e) =>
                          updateBanker(i, 'count', e.target.value)
                        }
                      />
                    </Grid>
                    <Grid
                      item
                      xs={2}
                      md="auto"
                      sx={{ display: 'flex', alignItems: 'center' }}
                    >
                      <Tooltip title="Remove">
                        <IconButton
                          color="error"
                          onClick={() => removeBanker(i)}
                        >
                          <DeleteOutlineIcon />
                        </IconButton>
                      </Tooltip>
                    </Grid>
                  </Grid>
                ))}
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={addBanker}
                >
                  Add Banker
                </Button>
              </Box>
            )}

            {/* Client interactions */}
            <FormControlLabel
              control={
                <Switch
                  checked={hasClient}
                  onChange={(e) => {
                    setHasClient(e.target.checked);
                    if (!e.target.checked) setClientList([]);
                  }}
                />
              }
              label="Client Interactions"
            />
            {hasClient && (
              <Box>
                {clientList.map((row, i) => (
                  <Grid
                    container
                    spacing={1.5}
                    key={`client-${i}`}
                    sx={{ mb: 1 }}
                  >
                    <Grid item xs={12} md={3}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Client – Type</InputLabel>
                        <Select
                          label="Client – Type"
                          value={row.type}
                          onChange={(e) =>
                            updateClient(i, 'type', e.target.value)
                          }
                        >
                          {clientTypes.map((c) => (
                            <MenuItem key={c.value} value={c.value}>
                              {c.label}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={10} md={3}>
                      <TextField
                        size="small"
                        fullWidth
                        label="How many"
                        type="number"
                        value={row.count}
                        onChange={(e) =>
                          updateClient(i, 'count', e.target.value)
                        }
                      />
                    </Grid>
                    <Grid
                      item
                      xs={2}
                      md="auto"
                      sx={{ display: 'flex', alignItems: 'center' }}
                    >
                      <Tooltip title="Remove">
                        <IconButton
                          color="error"
                          onClick={() => removeClient(i)}
                        >
                          <DeleteOutlineIcon />
                        </IconButton>
                      </Tooltip>
                    </Grid>
                  </Grid>
                ))}
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={addClient}
                  disabled={clientList.length >= 3}
                >
                  Add Client
                </Button>
                {clientList.length >= 3 && (
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ ml: 1 }}
                  >
                    (Max 3)
                  </Typography>
                )}
              </Box>
            )}

            <Divider sx={{ my: 2 }} />

            {/* Expected Today */}
            <Typography
              variant="subtitle1"
              sx={{ fontWeight: 800, mb: 1 }}
            >
              5) Expected Today
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={3}>
                <TextField
                  size="small"
                  fullWidth
                  label="Expected Logins (Team)"
                  type="number"
                  value={expectedLogins}
                  onChange={(e) => setExpectedLogins(e.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  size="small"
                  fullWidth
                  label="Expected Approval (Lacs)"
                  type="number"
                  value={expectedApprovalLacs}
                  onChange={(e) =>
                    setExpectedApprovalLacs(e.target.value)
                  }
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  size="small"
                  fullWidth
                  label="Expected Disbursal (₹)"
                  type="number"
                  value={expectedDisbursalAmount}
                  onChange={(e) =>
                    setExpectedDisbursalAmount(e.target.value)
                  }
                />
              </Grid>
            </Grid>

            <Divider sx={{ my: 2 }} />

            {/* Till Date */}
            <Typography
              variant="subtitle1"
              sx={{ fontWeight: 800, mb: 1 }}
            >
              Till Date — Snapshot
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={3}>
                <TextField
                  size="small"
                  fullWidth
                  label="Till Date Logins"
                  type="number"
                  value={tillDateLogin}
                  onChange={(e) => setTillDateLogin(e.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  size="small"
                  fullWidth
                  label="Till Date Approval (Lacs)"
                  type="number"
                  value={tillDateApprovalLacs}
                  onChange={(e) =>
                    setTillDateApprovalLacs(e.target.value)
                  }
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  size="small"
                  fullWidth
                  label="Till Date Disbursal (Lacs)"
                  type="number"
                  value={tillDateDisbursalLacs}
                  onChange={(e) =>
                    setTillDateDisbursalLacs(e.target.value)
                  }
                />
              </Grid>
            </Grid>

            {/* actions */}
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: 1,
                mt: 3,
              }}
            >
              <Button variant="outlined" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                variant="contained"
                startIcon={<CheckCircleIcon />}
                onClick={saveMorning}
                sx={{
                  fontWeight: 700,
                  borderRadius: 2,
                  backgroundColor: '#ff902f',
                  '&:hover': { backgroundColor: '#ff7b21' },
                }}
              >
                Submit Morning
              </Button>
            </Box>
          </Paper>
        )}

        {/* EVENING */}
        {mode === 'evening' && (
          <Paper
            elevation={1}
            sx={{
              p: { xs: 2, md: 3 },
              borderRadius: 3,
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Typography
              variant="subtitle1"
              sx={{ fontWeight: 800, mb: 1 }}
            >
              Evening Delivery
            </Typography>
            <Grid container spacing={2} sx={{ mb: 1 }}>
              <Grid item xs={12} md={3}>
                <TextField
                  size="small"
                  fullWidth
                  label="Team Logins Done"
                  type="number"
                  value={teamLoginsDone}
                  onChange={(e) => setTeamLoginsDone(e.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  size="small"
                  fullWidth
                  label="Team Approval Done (₹)"
                  type="number"
                  value={teamApprovalDoneAmount}
                  onChange={(e) =>
                    setTeamApprovalDoneAmount(e.target.value)
                  }
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  size="small"
                  fullWidth
                  label="Team Disbursal Done (₹)"
                  type="number"
                  value={teamDisbursalDoneAmount}
                  onChange={(e) =>
                    setTeamDisbursalDoneAmount(e.target.value)
                  }
                />
              </Grid>
            </Grid>

            <Typography
              variant="subtitle2"
              sx={{ fontWeight: 800, mb: 1 }}
            >
              <StarIcon sx={{ mr: 0.6 }} />
              Top Performer
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  size="small"
                  fullWidth
                  label="Name"
                  value={topPerformerName}
                  onChange={(e) =>
                    setTopPerformerName(e.target.value)
                  }
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  size="small"
                  fullWidth
                  label="Disbursal Value (In Rupees)"
                  type="number"
                  value={topPerformerValueLacs}
                  onChange={(e) =>
                    setTopPerformerValueLacs(e.target.value)
                  }
                />
              </Grid>
            </Grid>
            <Typography
              variant="subtitle2"
              sx={{ fontWeight: 800, mt: 3, mb: 1 }}
            >
              Files Stuck & Reasons
            </Typography>


            <Box
              sx={{
                border: '1px solid #d0d0d0',
                borderRadius: '8px',
                p: 2,
                mb: 2,
              }}
            >
              <TextField
                placeholder="Describe the stuck files and the reasons here..."
                multiline
                minRows={3}
                maxRows={6}
                fullWidth
                variant="standard"
                value={filesStuckDescription}
                onChange={(e) => setFilesStuckDescription(e.target.value)}
                InputProps={{ disableUnderline: true }}
              />
            </Box>

            {filesStuck.map((row, i) => (
              <Grid container spacing={1.5} key={i} sx={{ mb: 1 }}>
                <Grid item xs={12} md={5}>
                  <TextField
                    size="small"
                    fullWidth
                    label="Location / File"
                    value={row.location}
                    onChange={(e) =>
                      updateStuck(i, 'location', e.target.value)
                    }
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    size="small"
                    fullWidth
                    label="Reason"
                    value={row.reason}
                    onChange={(e) =>
                      updateStuck(i, 'reason', e.target.value)
                    }
                  />
                </Grid>
                <Grid
                  item
                  xs={12}
                  md="auto"
                  sx={{ display: 'flex', alignItems: 'center' }}
                >
                  <Tooltip title="Remove">
                    <IconButton
                      onClick={() => removeStuck(i)}
                      color="error"
                    >
                      <DeleteOutlineIcon />
                    </IconButton>
                  </Tooltip>
                </Grid>
              </Grid>
            ))}


            <Grid container spacing={2} sx={{ mt: 2 }}>
              <Grid item xs={12}>
                <TextField
                  size="small"
                  fullWidth
                  label="Support Required (Tech/Operations/Banker Access/Other)"
                  value={supportRequired}
                  onChange={(e) =>
                    setSupportRequired(e.target.value)
                  }
                  multiline
                  rows={2}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth size="small">
                  <InputLabel>Overall Sentiment</InputLabel>
                  <Select
                    label="Overall Sentiment"
                    value={overallSentiment}
                    onChange={(e) =>
                      setOverallSentiment(e.target.value as any)
                    }
                  >
                    <MenuItem value="green">
                      Green – Targets Achieved
                    </MenuItem>
                    <MenuItem value="yellow">
                      Yellow – Partial Delivery
                    </MenuItem>
                    <MenuItem value="red">
                      Red – Major Gaps
                    </MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            {overallSentiment !== 'green' && (
              <Paper
                variant="outlined"
                sx={{
                  mt: 2,
                  p: 2,
                  borderRadius: 2,
                  bgcolor: 'rgba(255,193,7,0.06)',
                }}
              >
                <Typography sx={{ fontWeight: 700, mb: 1 }}>
                  {overallSentiment === 'yellow'
                    ? 'What felt off today?'
                    : 'What caused the major gaps today?'}
                </Typography>
                <TextField
                  size="small"
                  fullWidth
                  label={
                    overallSentiment === 'yellow'
                      ? 'Reason (Yellow)'
                      : 'Reason (Red)'
                  }
                  value={sentimentReason}
                  onChange={(e) =>
                    setSentimentReason(e.target.value)
                  }
                  multiline
                  rows={2}
                />
              </Paper>
            )}

            <Box
              sx={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: 1,
                mt: 3,
              }}
            >
              <Button variant="outlined" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                variant="contained"
                color="success"
                startIcon={<CheckCircleIcon />}
                onClick={saveEvening}
                sx={{ fontWeight: 700, borderRadius: 2 }}
              >
                Submit Evening
              </Button>
            </Box>
          </Paper>
        )}
      </Container>

      {/* Snackbar top-center */}
      <Snackbar
        open={snack.open}
        autoHideDuration={2500}
        onClose={() =>
          setSnack((s) => ({ ...s, open: false }))
        }
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={() =>
            setSnack((s) => ({ ...s, open: false }))
          }
          severity={snack.type}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snack.msg}
        </Alert>
      </Snackbar>
    </Box>
  );
}
