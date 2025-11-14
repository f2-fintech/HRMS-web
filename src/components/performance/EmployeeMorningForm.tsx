'use client';

import React, { useMemo, useState, ChangeEvent } from 'react';
import {
  Box, Grid, Paper, Typography, TextField, Divider, Chip, Button,
  ToggleButton, ToggleButtonGroup, IconButton, Snackbar,
  InputAdornment, MenuItem
} from '@mui/material';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import axios from 'axios';

type NumStr = string;
type FollowUp = { name: string; phone: string; remarks: string; followUpOn: string };

const numberOrNull = (v: string): number | null => {
  if (v === '' || v === null || v === undefined) return null;
  const n = Number(String(v).replace(/,/g, ''));
  return Number.isFinite(n) ? n : null;
};

const todayISO = () => new Date().toISOString().split('T')[0];

// Amount helpers (Lakhs/Cr → ₹)
const lakh = (x: number) => Math.round(x * 100000);
const cr = (x: number) => Math.round(x * 10000000);
const fmtINR = (n: number) => n.toLocaleString('en-IN');

// Discrete amount options (value in ₹)
const AMOUNT_CHOICES = [
  { label: '0', value: 0 },
  { label: '0.5 L', value: lakh(0.5) },
  { label: '1 L', value: lakh(1) },
  { label: '2 L', value: lakh(2) },
  { label: '3 L', value: lakh(3) },
  { label: '5 L', value: lakh(5) },
  { label: '10 L', value: lakh(10) },
  { label: '25 L', value: lakh(25) },
  { label: '50 L', value: lakh(50) },
  { label: '75 L', value: lakh(75) },
  { label: '1 Cr', value: cr(1) },
  { label: '2 Cr', value: cr(2) },
];

// Count options 0..50
const COUNT_CHOICES = Array.from({ length: 51 }, (_, i) => i);

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_APP_URL,
});
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) (config.headers as any).Authorization = `Bearer ${token}`;
  }
  return config;
});

export default function REDailySnapshotForm({
  onClose,
  onSaved,
}: {
  onClose?: () => void;
  onSaved?: () => void;
}) {
  // visibility (Close / Auto-hide)
  const [isOpen, setIsOpen] = useState(true);
  const closeForm = () => {
    setIsOpen(false);
    onClose?.();
  };

  // state
  const [date, setDate] = useState<string>(todayISO());
  const [mode, setMode] = useState<'morning' | 'evening'>('morning');

  const initialMorning = {
    phoneConnects: '' as NumStr,
    physicalMeet: '' as NumStr,
    expectedLogins: '' as NumStr,
    expectedApprovals: '' as NumStr,
    expectedDisbursal: '' as NumStr,
  };
  const [morning, setMorning] = useState(initialMorning);

  const initialEvening = {
    phoneConnected: '' as NumStr,
    physicalMet: '' as NumStr,
    todaysLogin: '' as NumStr,
    todaysApproval: '' as NumStr,
    todaysDisbursal: '' as NumStr,
    followUps: [] as FollowUp[],
  };
  const [evening, setEvening] = useState(initialEvening);

  const [savingMorning, setSavingMorning] = useState(false);
  const [savingEvening, setSavingEvening] = useState(false);

  // Snackbar (TOP) — plain message (no Alert box)
  const [snack, setSnack] = useState<{ open: boolean; msg: string }>({
    open: false, msg: ''
  });
  const notify = (msg: string) => setSnack({ open: true, msg });

  // handlers
  const handleMorning = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setMorning((p) => ({ ...p, [name]: value }));
  };
  const handleEvening = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEvening((p) => ({ ...p, [name]: value }));
  };

  const resetAll = () => {
    setDate(todayISO());
    setMode('morning');
    setMorning(initialMorning);
    setEvening(initialEvening);
  };

  const handleCancel = () => {
    resetAll();
    closeForm();
  };

  // follow-ups
  const addFollowUp = () => {
    setEvening((p) => ({
      ...p,
      followUps: [...p.followUps, { name: '', phone: '', remarks: '', followUpOn: todayISO() }],
    }));
  };
  const updateFollowUp = (idx: number, key: keyof FollowUp, val: string) => {
    setEvening((p) => {
      const copy = [...p.followUps];
      copy[idx] = { ...copy[idx], [key]: val };
      return { ...p, followUps: copy };
    });
  };
  const removeFollowUp = (idx: number) => {
    setEvening((p) => {
      const copy = [...p.followUps];
      copy.splice(idx, 1);
      return { ...p, followUps: copy };
    });
  };

  // payloads
  const morningPayload = () => ({
    date,
    phoneConnects: numberOrNull(morning.phoneConnects),
    physicalMeet: numberOrNull(morning.physicalMeet),
    expectedLogins: numberOrNull(morning.expectedLogins),
    expectedApprovals: numberOrNull(morning.expectedApprovals),
    expectedDisbursal: numberOrNull(morning.expectedDisbursal),
  });
  const eveningPayload = () => ({
    date,
    phoneConnectsDone: numberOrNull(evening.phoneConnected),
    physicalMeetDone: numberOrNull(evening.physicalMet),
    loginsDone: numberOrNull(evening.todaysLogin),
    approvalsDone: numberOrNull(evening.todaysApproval),
    disbursalDone: numberOrNull(evening.todaysDisbursal),
    followUps: (evening.followUps || []).filter(
      f => f.name || f.phone || f.remarks || f.followUpOn
    ),
  });

  const isMorningFilled = Object.values(morning).some((v) => v !== '');
  const isEveningFilled =
    Object.values({ ...evening, followUps: undefined }).some((v) => (v as string) !== '') ||
    (evening.followUps?.length ?? 0) > 0;

  // close AFTER snackbar hides (so koi extra box nahi dikhe)
  const handleSnackClose = () => {
    setSnack({ open: false, msg: '' });
    // form ko yahin band kar do
    closeForm();
  };

  const saveMorning = async () => {
    if (!isMorningFilled) {
      notify('Please fill at least one Morning field.');
      return;
    }
    setSavingMorning(true);
    try {
      await api.post('/performance/re/morning', morningPayload());
      onSaved?.();
      resetAll();
      notify('✅ Morning snapshot saved');
    } catch (err: any) {
      notify(err?.response?.data?.message || '❌ Failed to save morning snapshot');
    } finally {
      setSavingMorning(false);
    }
  };

  const saveEvening = async () => {
    if (!isEveningFilled) {
      notify('Please fill at least one Evening field or add a follow-up.');
      return;
    }
    setSavingEvening(true);
    try {
      await api.post('/performance/re/evening', eveningPayload());
      onSaved?.();
      resetAll();
      notify('🌇 Evening snapshot saved');
    } catch (err: any) {
      notify(err?.response?.data?.message || '❌ Failed to save evening snapshot');
    } finally {
      setSavingEvening(false);
    }
  };

  // comparison
  const progressRows = useMemo(() => {
    const mPhone = numberOrNull(morning.phoneConnects);
    const ePhone = numberOrNull(evening.phoneConnected);
    const mMeet = numberOrNull(morning.physicalMeet);
    const eMeet = numberOrNull(evening.physicalMet);
    const mLog = numberOrNull(morning.expectedLogins);
    const eLog = numberOrNull(evening.todaysLogin);
    const mAppr = numberOrNull(morning.expectedApprovals);
    const eAppr = numberOrNull(evening.todaysApproval);
    const mDisb = numberOrNull(morning.expectedDisbursal);
    const eDisb = numberOrNull(evening.todaysDisbursal);

    const make = (label: string, planned: number | null, done: number | null) => {
      if (planned === null || done === null) return null;
      const delta = planned - done;
      const achieved = done >= planned && planned > 0;
      return { label, planned, done, delta, achieved };
    };

    return [
      make('Phone Connects', mPhone, ePhone),
      make('Physical Meets', mMeet, eMeet),
      make('Logins', mLog, eLog),
      make('Approvals (₹)', mAppr, eAppr),
      make('Disbursals (₹)', mDisb, eDisb),
    ].filter(Boolean) as Array<{ label: string; planned: number; done: number; delta: number; achieved: boolean; }>;
  }, [morning, evening]);

  if (!isOpen) return null;

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1200, mx: 'auto' }}>
      {/* Header (simple & clean) */}
      <Paper elevation={1} sx={{ p: 2.5, mb: 2.5, borderRadius: 3, position: 'relative' }}>
        <Typography variant="h5" sx={{ fontWeight: 800, pr: 6 }}>
          Relationship Executive — Daily Snapshot
        </Typography>
        <Typography variant="body2" sx={{ mt: .5, pr: 6, color: 'text.secondary' }}>
          Morning plan • Evening delivery
        </Typography>

        <IconButton
          aria-label="close"
          onClick={handleCancel}
          sx={{ position: 'absolute', top: 8, right: 8 }}
        >
          <CloseIcon />
        </IconButton>
      </Paper>

      {/* Date + Mode Toggle */}
      <Paper elevation={1} sx={{ p: 2.5, borderRadius: 3, mb: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          <Grid item xs={12} md="auto">
            <ToggleButtonGroup
              exclusive
              value={mode}
              onChange={(_, val) => val && setMode(val)}
              size="medium"
              color="primary"
            >
              <ToggleButton value="morning">Morning</ToggleButton>
              <ToggleButton value="evening">Evening</ToggleButton>
            </ToggleButtonGroup>
          </Grid>
        </Grid>
      </Paper>

      <Grid container spacing={2}>
        {/* Morning */}
        {mode === 'morning' && (
          <Grid item xs={12}>
            <Paper elevation={1} sx={{ p: 3, borderRadius: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Typography variant="h6" sx={{ fontWeight: 800 }}>
                  Morning Commitments
                </Typography>
                <Chip label="Plan" size="small" color="warning" />
              </Box>
              <Divider sx={{ mb: 3 }} />

              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Connect with Customers on Phone"
                    name="phoneConnects"
                    value={morning.phoneConnects}
                    onChange={handleMorning}
                    inputMode="numeric"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Connect with Customers on Physical Meet"
                    name="physicalMeet"
                    value={morning.physicalMeet}
                    onChange={handleMorning}
                    inputMode="numeric"
                  />
                </Grid>

                {/* Expected Logins → SELECT */}
                <Grid item xs={12}>
                  <TextField
                    select
                    fullWidth
                    label="Total Expected Logins"
                    name="expectedLogins"
                    value={morning.expectedLogins}
                    onChange={handleMorning}
                  >
                    {COUNT_CHOICES.map((v) => (
                      <MenuItem key={v} value={String(v)}>{v}</MenuItem>
                    ))}
                  </TextField>
                </Grid>

                {/* Expected Approvals (L/Cr labels) */}
                <Grid item xs={12}>
                  <TextField
                    select
                    fullWidth
                    label="Total Approval Expected"
                    name="expectedApprovals"
                    value={morning.expectedApprovals}
                    onChange={handleMorning}
                    InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }}
                  >
                    {AMOUNT_CHOICES.map((opt) => (
                      <MenuItem key={opt.value} value={String(opt.value)}>
                        {opt.label} <span style={{ opacity: .6 }}> &nbsp;({fmtINR(opt.value)})</span>
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>

                {/* Expected Disbursal (L/Cr labels) */}
                <Grid item xs={12}>
                  <TextField
                    select
                    fullWidth
                    label="Total Disbursal Expected"
                    name="expectedDisbursal"
                    value={morning.expectedDisbursal}
                    onChange={handleMorning}
                    InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }}
                  >
                    {AMOUNT_CHOICES.map((opt) => (
                      <MenuItem key={opt.value} value={String(opt.value)}>
                        {opt.label} <span style={{ opacity: .6 }}> &nbsp;({fmtINR(opt.value)})</span>
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
              </Grid>

              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3, gap: 1 }}>
                <Button variant="outlined" onClick={handleCancel} sx={{ borderRadius: 2 }}>
                  Cancel
                </Button>
                <Button
                  variant="contained"
                  color="warning"
                  onClick={saveMorning}
                  disabled={savingMorning}
                  sx={{ borderRadius: 2, fontWeight: 700 }}
                >
                  {savingMorning ? 'Saving…' : 'Save Morning'}
                </Button>
              </Box>
            </Paper>
          </Grid>
        )}

        {/* Evening + FOLLOW UPS */}
        {mode === 'evening' && (
          <Grid item xs={12}>
            <Paper elevation={1} sx={{ p: 3, borderRadius: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Typography variant="h6" sx={{ fontWeight: 800 }}>
                  Evening Delivery
                </Typography>
                <Chip label="Update" size="small" color="success" />
              </Box>
              <Divider sx={{ mb: 3 }} />

              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Connect with Customers on Phone"
                    name="phoneConnected"
                    value={evening.phoneConnected}
                    onChange={handleEvening}
                    inputMode="numeric"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Connected with Customers on Physical Meet"
                    name="physicalMet"
                    value={evening.physicalMet}
                    onChange={handleEvening}
                    inputMode="numeric"
                  />
                </Grid>

                {/* Today's Login → SELECT */}
                <Grid item xs={12}>
                  <TextField
                    select
                    fullWidth
                    label="Today's Login"
                    name="todaysLogin"
                    value={evening.todaysLogin}
                    onChange={handleEvening}
                  >
                    {COUNT_CHOICES.map((v) => (
                      <MenuItem key={v} value={String(v)}>{v}</MenuItem>
                    ))}
                  </TextField>
                </Grid>

                {/* Today's Approval (L/Cr) */}
                <Grid item xs={12}>
                  <TextField
                    select
                    fullWidth
                    label="Today's Approval"
                    name="todaysApproval"
                    value={evening.todaysApproval}
                    onChange={handleEvening}
                    InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }}
                  >
                    {AMOUNT_CHOICES.map((opt) => (
                      <MenuItem key={opt.value} value={String(opt.value)}>
                        {opt.label} <span style={{ opacity: .6 }}> &nbsp;({fmtINR(opt.value)})</span>
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>

                {/* Today's Disbursal (L/Cr) */}
                <Grid item xs={12}>
                  <TextField
                    select
                    fullWidth
                    label="Today's Disbursal"
                    name="todaysDisbursal"
                    value={evening.todaysDisbursal}
                    onChange={handleEvening}
                    InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }}
                  >
                    {AMOUNT_CHOICES.map((opt) => (
                      <MenuItem key={opt.value} value={String(opt.value)}>
                        {opt.label} <span style={{ opacity: .6 }}> &nbsp;({fmtINR(opt.value)})</span>
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
              </Grid>

              {/* FOLLOW UPS */}
              <Box sx={{ mt: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                    Follow-ups
                  </Typography>
                  <Button startIcon={<AddIcon />} variant="outlined" onClick={addFollowUp} sx={{ borderRadius: 2 }}>
                    Add Follow-up
                  </Button>
                </Box>
                <Divider sx={{ mb: 2 }} />

                {evening.followUps.length === 0 && (
                  <Typography variant="body2" color="text.secondary">
                    No follow-ups added yet.
                  </Typography>
                )}

                {evening.followUps.map((f, idx) => (
                  <Grid container spacing={2} key={idx} sx={{ mb: 1 }}>
                    <Grid item xs={12} md={3}>
                      <TextField fullWidth label="Name" value={f.name} onChange={(e) => updateFollowUp(idx, 'name', e.target.value)} />
                    </Grid>
                    <Grid item xs={12} md={3}>
                      <TextField fullWidth label="Phone" value={f.phone} onChange={(e) => updateFollowUp(idx, 'phone', e.target.value)} inputMode="tel" />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <TextField fullWidth label="Remarks" value={f.remarks} onChange={(e) => updateFollowUp(idx, 'remarks', e.target.value)} />
                    </Grid>
                    <Grid item xs={12} md={2}>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <TextField
                          fullWidth
                          label="Follow-up On"
                          type="date"
                          value={f.followUpOn || todayISO()}
                          onChange={(e) => updateFollowUp(idx, 'followUpOn', e.target.value)}
                          InputLabelProps={{ shrink: true }}
                        />
                        <IconButton aria-label="remove" color="error" onClick={() => removeFollowUp(idx)}>
                          <DeleteOutlineIcon />
                        </IconButton>
                      </Box>
                    </Grid>
                  </Grid>
                ))}
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3, gap: 1 }}>
                <Button variant="outlined" onClick={handleCancel} sx={{ borderRadius: 2 }}>
                  Cancel
                </Button>
                <Button
                  variant="contained"
                  color="success"
                  onClick={saveEvening}
                  disabled={savingEvening}
                  sx={{ borderRadius: 2, fontWeight: 700 }}
                >
                  {savingEvening ? 'Saving…' : 'Save Evening'}
                </Button>
              </Box>
            </Paper>
          </Grid>
        )}

        {/* comparison */}
        <Grid item xs={12}>
          <Paper elevation={1} sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>
              Evening vs Morning (Only shows when both values are filled)
            </Typography>
            <Divider sx={{ mb: 2 }} />
            {progressRows.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                Fill both Morning and Evening values to see the comparison.
              </Typography>
            ) : (
              <Grid container spacing={1}>
                {progressRows.map((r) => (
                  <Grid item xs={12} md={6} key={r.label}>
                    <Box sx={{
                      p: 2, borderRadius: 2, border: '1px solid rgba(0,0,0,0.08)',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      backgroundColor: r.achieved ? 'rgba(76,175,80,0.04)' : 'rgba(255,193,7,0.04)'
                    }}>
                      <Box>
                        <Typography sx={{ fontWeight: 700 }}>{r.label}</Typography>
                        <Typography variant="body2" color="text.secondary">Planned: {fmtINR(r.planned)}</Typography>
                        <Typography variant="body2" color="text.secondary">Done: {fmtINR(r.done)}</Typography>
                      </Box>
                      <Box sx={{ textAlign: 'right' }}>
                        <Chip
                          label={r.achieved ? 'Achieved' : `Pending: ${fmtINR(r.delta)}`}
                          color={r.achieved ? 'success' : 'warning'}
                          variant="outlined"
                        />
                      </Box>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Snackbar (TOP, plain message, no Alert box) */}
      <Snackbar
        open={snack.open}
        autoHideDuration={1800}
        onClose={handleSnackClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        message={snack.msg}
        ContentProps={{
          sx: {
            borderRadius: 2,
            px: 2,
            // subtle look (no colored Alert box)
            bgcolor: 'rgba(0,0,0,0.85)',
            color: 'white',
            boxShadow: 2,
          }
        }}
      />
    </Box>
  );
}
