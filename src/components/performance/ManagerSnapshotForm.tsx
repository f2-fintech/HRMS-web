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
      (config.headers as any).Authorization = `Bearer ${token}${
        company_id ? ` ${company_id}` : ''
      }`;
    if (company_id) (config.headers as any)['x-company-id'] = company_id;
  }

  return config;
});

/* ---------------- helpers ---------------- */
const todayISO = () => new Date().toISOString().split('T')[0];

const clientTypes = [
  { value: 'cold', label: 'Cold Call' },
  { value: 'appointment', label: 'Appointment' },
  { value: 'channel_partner', label: 'Channel Partner Visit' },
];

/* ---------------- types ---------------- */
type Mode = 'morning' | 'evening';

type InternalRow = {
  count: string;
  purpose: string;
};

type BankerRow = {
  lenderName: string;
  lenderContact: string;
  count: string;
  purpose: string;
};

type ClientRow = {
  type: string;
  clientName: string;
  clientContact: string;
  purpose: string;
};

type StuckRow = { location: string; reason: string };

type SnapshotResponse = {
  date: string;
  morning?: {
    teamTargetLoanLacs?: number;
    customerPhoneConnects?: number; // 🔹 morning calls
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
      internalDetails?: {
        count?: number;
        purpose?: string;
      }[];
      bankerDetails?: {
        lenderName?: string;
        lenderContact?: string;
        count?: number;
        purpose?: string;
      }[];
      clientDetails?: {
        type?: string;
        clientName?: string;
        contact?: string;
        purpose?: string;
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
    customerPhoneConnectsDone?: number; // 🔹 NEW: evening calls done
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
  performanceId,
}: {
  handleClose?: () => void;
  onSaved?: () => void;
  performanceId?:()=>string;
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
  const [workingHeadcount, setWorkingHeadcount] = useState<string>('');

  const [customerPhoneConnects, setCustomerPhoneConnects] =
    useState<string>('');

  // Meetings
  const [hasInternal, setHasInternal] = useState(false);
  const [hasBanker, setHasBanker] = useState(false);
  const [hasClient, setHasClient] = useState(false);

  const [internalList, setInternalList] = useState<InternalRow[]>([]);
  const [bankerList, setBankerList] = useState<BankerRow[]>([]);
  const [clientList, setClientList] = useState<ClientRow[]>([]);

  const addInternal = () =>
    setInternalList((p) => [...p, { count: '', purpose: '' }]);

  const updateInternal = (i: number, key: keyof InternalRow, value: string) =>
    setInternalList((p) =>
      p.map((row, idx) => (idx === i ? { ...row, [key]: value } : row)),
    );

  const removeInternal = (i: number) =>
    setInternalList((p) => p.filter((_, idx) => idx !== i));

  const addBanker = () =>
    setBankerList((p) => [
      ...p,
      { lenderName: '', lenderContact: '', count: '', purpose: '' },
    ]);

  const updateBanker = (i: number, key: keyof BankerRow, val: string) =>
    setBankerList((p) =>
      p.map((r, idx) => (idx === i ? { ...r, [key]: val } : r)),
    );

  const removeBanker = (i: number) =>
    setBankerList((p) => p.filter((_, idx) => idx !== i));

  const addClient = () =>
    setClientList((p) =>
      p.length < 3
        ? [
            ...p,
            {
              type: 'cold',
              clientName: '',
              clientContact: '',
              purpose: '',
            },
          ]
        : p,
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

  // 🔹 NEW: evening calls done
  const [customerPhoneConnectsDone, setCustomerPhoneConnectsDone] =
    useState<string>('');

  const [filesStuckDescription, setFilesStuckDescription] = useState('');

  const [teamDisbursalDoneAmount, setTeamDisbursalDoneAmount] =
    useState<string>(''); // ₹

  // 🔹 NEW: separate top performers
  const [approvalTopName, setApprovalTopName] = useState<string>('');
  const [approvalTopAmount, setApprovalTopAmount] = useState<string>('');
  const [disbursalTopName, setDisbursalTopName] = useState<string>('');
  const [disbursalTopAmount, setDisbursalTopAmount] =
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

  /* -------- Combined Totals (Expected + Own) -------- */
  const totalLoginCombined =
    (Number(expectedLogins) || 0) + (Number(ownLoginCount) || 0);

  const totalApprovalCombined =
    (Number(expectedApprovalLacs) || 0) +
    (Number(ownApprovalLacs) || 0);

  const totalDisbursalCombined =
    (Number(expectedDisbursalAmount) || 0) +
    (Number(ownDisbursalLacs) || 0);

  /* -------- LOAD existing snapshot (DB -> UI) -------- */
const loadSnapshot = async (selectedDate: string) => {
  try {
    let res = null;

    // If editing via ID (RE or Manager)
    if (performanceId) {
      // Try RE first
      try {
        res = await api.get(`/performance/re/${performanceId}`);
      } catch (e) {
        res = null;
      }

      // If not RE → try Manager
      if (!res) {
        res = await api.get(`/performance/manager/${performanceId}`);
      }
    } else {
      // Create mode (MANAGER create)
      res = await api.get(`/performance/manager`, {
        params: { date: selectedDate },
      });
    }

    const raw = res.data;

    // Auto detect whether RE or Manager
    const morning =
      raw?.manager?.morning ||
      raw?.re?.morning ||
      null;

    const evening =
      raw?.manager?.evening ||
      raw?.re?.evening ||
      null;

    /* -------------- MORNING LOAD ---------------- */
    if (morning) {
      setTeamTargetLacs(String(morning.teamTargetLoanLacs ?? ""));
      setCustomerPhoneConnects(String(morning.customerPhoneConnects ?? ""));

      setOwnLoginCount(String(morning.ownContribution?.login ?? ""));
      setOwnApprovalLacs(String(morning.ownContribution?.approvalLacs ?? ""));
      setOwnDisbursalLacs(String(morning.ownContribution?.disbursalLacs ?? ""));

      setWorkingHeadcount(String(morning.teamMembers?.working ?? ""));
      setActiveHeadcount(String(morning.teamMembers?.total ?? ""));

      // Internal
      const internal = morning.meetings?.internalDetails || [];
      setHasInternal(internal.length > 0);
      setInternalList(
        internal.map((i: any) => ({
          count: String(i.count ?? ""),
          purpose: i.purpose ?? "",
        }))
      );

      // Banker
      const bankers = morning.meetings?.bankerDetails || [];
      setHasBanker(bankers.length > 0);
      setBankerList(
        bankers.map((b: any) => ({
          lenderName: b.lenderName ?? "",
          lenderContact: b.lenderContact ?? "",
          count: String(b.count ?? ""),
          purpose: b.purpose ?? "",
        }))
      );

      // Client
      const clients = morning.meetings?.clientDetails || [];
      setHasClient(clients.length > 0);
      setClientList(
        clients.map((c: any) => ({
          type: c.type ?? "cold",
          clientName: c.clientName ?? "",
          clientContact: c.contact ?? "",
          purpose: c.purpose ?? "",
        }))
      );

      // Expected
      setExpectedLogins(String(morning.expected?.loginsTeam ?? ""));
      setExpectedApprovalLacs(String(morning.expected?.approvalLacs ?? ""));
      setExpectedDisbursalAmount(String(morning.expected?.disbursalAmount ?? ""));

      // Till date
      setTillDateLogin(String(morning.tillDate?.login ?? ""));
      setTillDateApprovalLacs(String(morning.tillDate?.approvalLacs ?? ""));
      setTillDateDisbursalLacs(String(morning.tillDate?.disbursalLacs ?? ""));
    }

    /* -------------- EVENING LOAD ---------------- */
   /* -------------- EVENING LOAD ---------------- */
if (evening) {
  // Normal values
  setTeamLoginsDone(String(evening.teamLoginsDone ?? ""));
  setTeamApprovalDoneAmount(String(evening.teamApprovalDoneAmount ?? ""));
  setTeamDisbursalDoneAmount(String(evening.teamDisbursalDoneAmount ?? ""));
  setCustomerPhoneConnectsDone(String(evening.customerPhoneConnectsDone ?? ""));

  // -------------------------
  //   FIX 1 — Top Performer
  // -------------------------
  const topStr = evening.topPerformer?.name || "";

  // Extract approval performer
  const approvalMatch = topStr.match(/Approval:\s*([^|]+?)\s*\(₹(\d+)\)/);
  setApprovalTopName(approvalMatch?.[1]?.trim() ?? "");
  setApprovalTopAmount(approvalMatch?.[2] ?? "");

  // Extract disbursal performer
  const disbursalMatch = topStr.match(/Disbursal:\s*([^|]+?)\s*\(₹(\d+)\)/);
  setDisbursalTopName(disbursalMatch?.[1]?.trim() ?? "");
  setDisbursalTopAmount(disbursalMatch?.[2] ?? "");

  // -------------------------
  //   FIX 2 — Files Stuck
  // -------------------------
  // Load description box text
  setFilesStuckDescription(evening.filesStuckDescription ?? "");

  // Load rows
  setFilesStuck(
    (evening.filesStuck || []).map(f => ({
      location: f.location ?? "",
      reason: f.reason ?? "",
    }))
  );

  // Rest
  setSupportRequired(evening.supportRequired ?? "");
  setOverallSentiment(evening.overallSentiment ?? "green");
  setSentimentReason(evening.sentimentReason ?? "");
}

  } catch (err) {
    console.error("LOAD ERROR:", err);
  }
};


useEffect(() => {
  if (!performanceId) {
    // New create form load data by date
    loadSnapshot(date);
    return;
  }

  // Editing an existing snapshot
  const fetchById = async () => {
    try {
      let res = null;

      // Try RE first
      try {
        res = await api.get(`/performance/re/${performanceId}`);
      } catch (e) {
        res = null;
      }

      // If not RE → try Manager
      if (!res) {
        res = await api.get(`/performance/manager/${performanceId}`);
      }

      const raw = res.data;

      // Set date
      setDate(raw.date?.split("T")[0] || todayISO());

      // Decide morning/evening mode
      if (raw.manager?.evening || raw.re?.evening) {
        setMode("evening");
      } else {
        setMode("morning");
      }

      // Now load entire snapshot
      loadSnapshot(raw.date?.split("T")[0]);
    } catch (err) {
      console.error("Failed to fetch snapshot by ID:", err);
    }
  };

  fetchById();
}, [performanceId]);


  /* -------- Submit handlers (API + snackbar) -------- */
  const saveMorning = async () => {
    const totalInternal = hasInternal
      ? internalList.reduce((a, r) => a + (Number(r.count) || 0), 0)
      : 0;

    const totalBankers = hasBanker
      ? bankerList.reduce((a, r) => a + (Number(r.count) || 0), 0)
      : 0;

    const internalDetails = hasInternal
      ? internalList
          .map((r) => ({
            count: Number(r.count) || 0,
            purpose: r.purpose.trim(),
          }))
          .filter((r) => r.count > 0 || r.purpose)
      : [];

    const clientDetails = hasClient
      ? clientList
          .map((c) => ({
            type: c.type,
            clientName: c.clientName.trim(),
            contact: c.clientContact.trim(),
            purpose: c.purpose.trim(),
          }))
          .filter(
            (c) => c.type || c.clientName || c.contact || c.purpose,
          )
      : [];

    const totalClients = hasClient ? clientDetails.length : 0;

    const bankerDetails = hasBanker
      ? bankerList
          .map((b) => ({
            lenderName: b.lenderName.trim(),
            lenderContact: b.lenderContact.trim(),
            count: Number(b.count) || 0,
            purpose: b.purpose.trim(),
          }))
          .filter(
            (b) =>
              b.lenderName ||
              b.lenderContact ||
              b.count > 0 ||
              b.purpose,
          )
      : [];

    const morning = {
      teamTargetLoanLacs: Number(teamTargetLacs) || 0,
      customerPhoneConnects: Number(customerPhoneConnects) || 0,
      ownContribution: {
        login: Number(ownLoginCount) || 0,
        approvalLacs: Number(ownApprovalLacs) || 0,
        disbursalLacs: Number(ownDisbursalLacs) || 0,
      },
      teamMembers: {
        working: Number(workingHeadcount) || 0,
        total: Number(activeHeadcount) || 0,
      },
      meetings: {
        internal: totalInternal,
        bankers: totalBankers,
        clients: totalClients,
        internalDetails,
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
        e?.response?.data?.message ||
          '❌ Failed to save morning snapshot',
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

    // 🔹 Combine approval + disbursal performer for backend
    const topSummaryParts: string[] = [];

    if (approvalTopName || approvalTopAmount) {
      topSummaryParts.push(
        `Approval: ${approvalTopName || '-'} (₹${
          approvalTopAmount || 0
        })`,
      );
    }

    if (disbursalTopName || disbursalTopAmount) {
      topSummaryParts.push(
        `Disbursal: ${disbursalTopName || '-'} (₹${
          disbursalTopAmount || 0
        })`,
      );
    }

    const topPerformerNameCombined = topSummaryParts.join(' | ');

    const topPerformerTotalValue =
      (Number(approvalTopAmount) || 0) +
      (Number(disbursalTopAmount) || 0);

    const evening = {
      teamLoginsDone: Number(teamLoginsDone) || 0,
      teamApprovalDoneAmount: Number(teamApprovalDoneAmount) || 0,
      teamDisbursalDoneAmount: Number(teamDisbursalDoneAmount) || 0,
      customerPhoneConnectsDone:
        Number(customerPhoneConnectsDone) || 0, // 🔹 NEW field
      topPerformer: {
        name: topPerformerNameCombined,
        valueLacs: topPerformerTotalValue,
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
        e?.response?.data?.message ||
          '❌ Failed to save evening snapshot',
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
          <Grid
            container
            spacing={2}
            sx={{ mt: 1.5 }}
            alignItems="center"
          >
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
                sx={{
                  bgcolor: 'rgba(255,255,255,.25)',
                  color: 'white',
                }}
              />
            </Grid>
          </Grid>
        </Paper>

        {/* MORNING */}
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
            {/* Combined Totals (Expected + Own) */}
            <Box
              sx={{
                mb: 2,
                display: 'flex',
                flexWrap: 'wrap',
                gap: 1.5,
              }}
            >
              <Chip
                label={`Total Logins (Expected + Own): ${totalLoginCombined}`}
                variant="outlined"
              />
              <Chip
                label={`Total Approval (₹): ${totalApprovalCombined.toLocaleString(
                  'en-IN',
                )}`}
                variant="outlined"
              />
              <Chip
                label={`Total Disbursal (₹): ${totalDisbursalCombined.toLocaleString(
                  'en-IN',
                )}`}
                variant="outlined"
              />
            </Box>

            {/* Phone connects */}
            <Typography
              variant="subtitle1"
              sx={{ fontWeight: 800, mb: 1 }}
            >
              Customers Connected on Phone
            </Typography>
            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={12} md={3}>
                <TextField
                  size="small"
                  fullWidth
                  label="connected on phone"
                  type="number"
                  value={customerPhoneConnects}
                  onChange={(e) =>
                    setCustomerPhoneConnects(e.target.value)
                  }
                />
              </Grid>
            </Grid>

            <Divider sx={{ my: 2 }} />
            <Typography
              variant="subtitle1"
              sx={{ fontWeight: 800, mb: 1 }}
            >
              Expected Delivery Today(Team)
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={3}>
                <TextField
                  size="small"
                  fullWidth
                  label="Expected Logins (Team)"
                  type="number"
                  value={expectedLogins}
                  onChange={(e) =>
                    setExpectedLogins(e.target.value)
                  }
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  size="small"
                  fullWidth
                  label="Expected Approval (₹)"
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

            {/* Own Contribution */}
            <Typography
              variant="subtitle1"
              sx={{ fontWeight: 800, mb: 1 }}
            >
              Own Contribution(individual Number)
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={3}>
                <TextField
                  size="small"
                  fullWidth
                  label="Login — How many?"
                  type="number"
                  value={ownLoginCount}
                  onChange={(e) =>
                    setOwnLoginCount(e.target.value)
                  }
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  size="small"
                  fullWidth
                  label="Approval (₹)"
                  type="number"
                  value={ownApprovalLacs}
                  onChange={(e) =>
                    setOwnApprovalLacs(e.target.value)
                  }
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  size="small"
                  fullWidth
                  label="Disbursal (₹)"
                  type="number"
                  value={ownDisbursalLacs}
                  onChange={(e) =>
                    setOwnDisbursalLacs(e.target.value)
                  }
                />
              </Grid>
            </Grid>

            <Divider sx={{ my: 2 }} />

            <Typography
              variant="subtitle1"
              sx={{ fontWeight: 800, mb: 1 }}
            >
              Total Active Headcount
            </Typography>

            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={12} md={3}>
                <TextField
                  size="small"
                  fullWidth
                  label="Active Headcount"
                  type="number"
                  value={activeHeadcount}
                  onChange={(e) =>
                    setActiveHeadcount(e.target.value)
                  }
                />
              </Grid>

              <Grid item xs={12} md={3}>
                <TextField
                  size="small"
                  fullWidth
                  label="Working / Present Today"
                  type="number"
                  value={workingHeadcount}
                  onChange={(e) =>
                    setWorkingHeadcount(e.target.value)
                  }
                />
              </Grid>
            </Grid>

            <Divider sx={{ my: 2 }} />

            {/* Meetings */}
            <Typography
              variant="subtitle1"
              sx={{ fontWeight: 800, mb: 1 }}
            >
              Meetings (Internal • Banker • Client)
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
                    <Grid item xs={12} md={3}>
                      <TextField
                        size="small"
                        fullWidth
                        label="How many"
                        type="number"
                        value={row.count}
                        onChange={(e) =>
                          updateInternal(
                            i,
                            'count',
                            e.target.value,
                          )
                        }
                      />
                    </Grid>
                    <Grid item xs={12} md={7}>
                      <TextField
                        size="small"
                        fullWidth
                        label="Agenda / Purpose of meeting"
                        value={row.purpose}
                        onChange={(e) =>
                          updateInternal(
                            i,
                            'purpose',
                            e.target.value,
                          )
                        }
                        multiline
                        minRows={1}
                        maxRows={3}
                      />
                    </Grid>
                    <Grid
                      item
                      xs={12}
                      md="auto"
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                      }}
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

            {/* Banker meetings */}
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
                          updateBanker(
                            i,
                            'lenderName',
                            e.target.value,
                          )
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
                          updateBanker(
                            i,
                            'lenderContact',
                            e.target.value,
                          )
                        }
                      />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <TextField
                        size="small"
                        fullWidth
                        label="Agenda / Purpose of Meeting"
                        value={row.purpose}
                        onChange={(e) =>
                          updateBanker(i, 'purpose', e.target.value)
                        }
                      />
                    </Grid>

                    <Grid
                      item
                      xs={12}
                      md="auto"
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                      }}
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
                            updateClient(
                              i,
                              'type',
                              e.target.value,
                            )
                          }
                        >
                          {clientTypes.map((c) => (
                            <MenuItem
                              key={c.value}
                              value={c.value}
                            >
                              {c.label}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} md={3}>
                      <TextField
                        size="small"
                        fullWidth
                        label="Client Name"
                        value={row.clientName}
                        onChange={(e) =>
                          updateClient(
                            i,
                            'clientName',
                            e.target.value,
                          )
                        }
                      />
                    </Grid>
                    <Grid item xs={12} md={3}>
                      <TextField
                        size="small"
                        fullWidth
                        label="Client Contact"
                        value={row.clientContact}
                        onChange={(e) =>
                          updateClient(
                            i,
                            'clientContact',
                            e.target.value,
                          )
                        }
                      />
                    </Grid>
                    <Grid item xs={12} md={9}>
                      <TextField
                        size="small"
                        fullWidth
                        label="Purpose / Discussion notes"
                        value={row.purpose}
                        onChange={(e) =>
                          updateClient(
                            i,
                            'purpose',
                            e.target.value,
                          )
                        }
                        multiline
                        minRows={1}
                        maxRows={3}
                      />
                    </Grid>
                    <Grid
                      item
                      xs={12}
                      md="auto"
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                      }}
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
                  onChange={(e) =>
                    setTillDateLogin(e.target.value)
                  }
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
                  label="Customers Connected on Phone (Today)"
                  type="number"
                  value={customerPhoneConnectsDone}
                  onChange={(e) =>
                    setCustomerPhoneConnectsDone(e.target.value)
                  }
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  size="small"
                  fullWidth
                  label="Team Logins Done"
                  type="number"
                  value={teamLoginsDone}
                  onChange={(e) =>
                    setTeamLoginsDone(e.target.value)
                  }
                />
              </Grid>
              <Grid item xs={12} md={3}>
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
              <Grid item xs={12} md={3}>
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
              Top Performer from Team
            </Typography>

            {/* 🔹 Top Performer – Approval */}
            <Typography
              variant="body2"
              sx={{ fontWeight: 600, mb: 0.5 }}
            >
              Top Performer – Approval
            </Typography>
            <Grid container spacing={2} sx={{ mb: 1 }}>
              <Grid item xs={12} md={6}>
                <TextField
                  size="small"
                  fullWidth
                  label="Name (Approval)"
                  value={approvalTopName}
                  onChange={(e) =>
                    setApprovalTopName(e.target.value)
                  }
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  size="small"
                  fullWidth
                  label="Approval Value (₹)"
                  type="number"
                  value={approvalTopAmount}
                  onChange={(e) =>
                    setApprovalTopAmount(e.target.value)
                  }
                />
              </Grid>
            </Grid>

            {/* 🔹 Top Performer – Disbursal */}
            <Typography
              variant="body2"
              sx={{ fontWeight: 600, mb: 0.5, mt: 1 }}
            >
              Top Performer – Disbursal
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  size="small"
                  fullWidth
                  label="Name (Disbursal)"
                  value={disbursalTopName}
                  onChange={(e) =>
                    setDisbursalTopName(e.target.value)
                  }
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  size="small"
                  fullWidth
                  label="Disbursal Value (₹)"
                  type="number"
                  value={disbursalTopAmount}
                  onChange={(e) =>
                    setDisbursalTopAmount(e.target.value)
                  }
                />
              </Grid>
            </Grid>

            <Typography
              variant="subtitle2"
              sx={{ fontWeight: 800, mt: 3, mb: 1 }}
            >
              Files Stuck & Challenges faces dusring the day
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
                onChange={(e) =>
                  setFilesStuckDescription(e.target.value)
                }
                InputProps={{ disableUnderline: true }}
              />
            </Box>

            {filesStuck.map((row, i) => (
              <Grid
                container
                spacing={1.5}
                key={i}
                sx={{ mb: 1 }}
              >
                <Grid item xs={12} md={5}>
                  <TextField
                    size="small"
                    fullWidth
                    label="Location / File"
                    value={row.location}
                    onChange={(e) =>
                      updateStuck(
                        i,
                        'location',
                        e.target.value,
                      )
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
                      updateStuck(
                        i,
                        'reason',
                        e.target.value,
                      )
                    }
                  />
                </Grid>
                <Grid
                  item
                  xs={12}
                  md="auto"
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                  }}
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
                  label="Support Required From (Tech/Operations/Banker Access/Other)"
                  value={supportRequired}
                  onChange={(e) =>
                    setSupportRequired(e.target.value)
                  }
                  multiline
                  rows={2}
                />
              </Grid>
              <Grid item xs={12} md={4} sx={{ mt: 2 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>
                    Overall Sentiment From Today Delivery
                  </InputLabel>
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
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
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
