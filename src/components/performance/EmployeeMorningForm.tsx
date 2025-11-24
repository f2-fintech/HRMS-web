'use client';

import React, { useMemo, useState, ChangeEvent } from 'react';
import {
  Box, Grid, Paper, Typography, TextField, Divider, Chip, Button,
  ToggleButton, ToggleButtonGroup, IconButton, Snackbar,
  InputAdornment
} from '@mui/material';

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
  /* ------------------------------------------------------ */
  /* VISIBILITY */
  const [isOpen, setIsOpen] = useState(true);
  const closeForm = () => {
    setIsOpen(false);
    onClose?.();
  };

  /* ------------------------------------------------------ */
  /* STATES */
  const [date, setDate] = useState<string>(todayISO());
  const [mode, setMode] = useState<'morning' | 'evening'>('morning');

  /* ------------------- Morning States -------------------- */
  const initialMorning = {
    phoneConnects: '' as NumStr,
    physicalMeet: '' as NumStr,
    expectedLogins: '' as NumStr,
    expectedApprovals: '' as NumStr,
    expectedDisbursal: '' as NumStr,
  };
  const [morning, setMorning] = useState(initialMorning);

  /* ✔ NEW — Till Date Snapshot */
  const [tillDateLogin, setTillDateLogin] = useState<string>('');
  const [tillDateApprovalLacs, setTillDateApprovalLacs] = useState<string>('');
  const [tillDateDisbursalLacs, setTillDateDisbursalLacs] = useState<string>('');

  /* ------------------- Evening States -------------------- */
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

  /* ------------------------------------------------------ */
  /* SNACKBAR */
  const [snack, setSnack] = useState<{ open: boolean; msg: string }>({
    open: false,
    msg: '',
  });
  const notify = (msg: string) => setSnack({ open: true, msg });

  /* ------------------------------------------------------ */
  /* HANDLERS */
  const handleMorning = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setMorning((p) => ({ ...p, [name]: value }));
  };

  const handleEvening = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEvening((p) => ({ ...p, [name]: value }));
  };

  const handleCancel = () => {
    setDate(todayISO());
    setMode('morning');
    setMorning(initialMorning);
    setEvening(initialEvening);
    setTillDateLogin('');
    setTillDateApprovalLacs('');
    setTillDateDisbursalLacs('');
    closeForm();
  };

  /* ------------------------------------------------------ */
  /* PAYLOADS */

  const morningPayload = () => ({
    date,
    phoneConnects: numberOrNull(morning.phoneConnects),
    physicalMeet: numberOrNull(morning.physicalMeet),
    expectedLogins: numberOrNull(morning.expectedLogins),
    expectedApprovals: numberOrNull(morning.expectedApprovals),
    expectedDisbursal: numberOrNull(morning.expectedDisbursal),

    /* ✔ NEW — Till Date Fields */
    tillDate: {
    login: numberOrNull(tillDateLogin),
    approvalLacs: numberOrNull(tillDateApprovalLacs),
    disbursalLacs: numberOrNull(tillDateDisbursalLacs),
  }
  });

  const eveningPayload = () => ({
    date,
    phoneConnectsDone: numberOrNull(evening.phoneConnected),
    physicalMeetDone: numberOrNull(evening.physicalMet),
    loginsDone: numberOrNull(evening.todaysLogin),
    approvalsDone: numberOrNull(evening.todaysApproval),
    disbursalDone: numberOrNull(evening.todaysDisbursal),
    followUps: (evening.followUps || []).filter(
      (f) => f.name || f.phone || f.remarks || f.followUpOn
    ),
  });

  /* ------------------------------------------------------ */
  /* SAVE HANDLERS */

  const saveMorning = async () => {
    const payload = morningPayload();
    setSavingMorning(true);

    try {
      await api.post('/performance/re/morning', payload);

      notify('✅ Morning snapshot saved');
      onSaved?.();
      window.location.reload();
    } catch (err: any) {
      notify(err?.response?.data?.message || '❌ Failed to save morning');
    } finally {
      setSavingMorning(false);
    }
  };

  const saveEvening = async () => {
    const payload = eveningPayload();
    setSavingEvening(true);

    try {
      await api.post('/performance/re/evening', payload);

      notify('🌇 Evening snapshot saved');
      onSaved?.();
      window.location.reload();
    } catch (err: any) {
      notify(err?.response?.data?.message || '❌ Failed to save evening');
    } finally {
      setSavingEvening(false);
    }
  };

  /* ------------------------------------------------------ */

  if (!isOpen) return null;

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1200, mx: 'auto' }}>
      {/* HEADER */}
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

      {/* DATE + TOGGLE */}
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

      {/* ====================================================== */}
      {/* ===================== MORNING ======================== */}
      {/* ====================================================== */}

      {mode === 'morning' && (
        <Paper elevation={1} sx={{ p: 3, borderRadius: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>
            Morning Commitments
          </Typography>
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

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Total Expected Logins"
                name="expectedLogins"
                value={morning.expectedLogins}
                onChange={handleMorning}
                inputMode="numeric"
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Total Approval Expected (₹)"
                name="expectedApprovals"
                value={morning.expectedApprovals}
                onChange={handleMorning}
                inputMode="numeric"
                InputProps={{
                  startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                }}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Total Disbursal Expected (₹)"
                name="expectedDisbursal"
                value={morning.expectedDisbursal}
                onChange={handleMorning}
                inputMode="numeric"
                InputProps={{
                  startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                }}
              />
            </Grid>
          </Grid>

          {/* ------------------------------------------------------- */}
          {/* ✔ NEW — TILL DATE SNAPSHOT (Same Style as Manager Form) */}
          {/* ------------------------------------------------------- */}

          <Divider sx={{ my: 2 }} />

          <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 1 }}>
            Till Date — Snapshot
          </Typography>

          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                size="small"
                label="Till Date Logins"
                type="number"
                value={tillDateLogin}
                onChange={(e) => setTillDateLogin(e.target.value)}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                size="small"
                label="Till Date Approval (Lacs)"
                type="number"
                value={tillDateApprovalLacs}
                onChange={(e) => setTillDateApprovalLacs(e.target.value)}
                InputProps={{
                  startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                }}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                size="small"
                label="Till Date Disbursal (Lacs)"
                type="number"
                value={tillDateDisbursalLacs}
                onChange={(e) => setTillDateDisbursalLacs(e.target.value)}
                InputProps={{
                  startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                }}
              />
            </Grid>
          </Grid>

          {/* ------------------------------------------------------- */}

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
            <Button variant="outlined" onClick={handleCancel} sx={{ borderRadius: 2 }}>
              Cancel
            </Button>
            <Button
              variant="contained"
              color="warning"
              onClick={saveMorning}
              disabled={savingMorning}
              sx={{ borderRadius: 2, fontWeight: 700, ml: 1 }}
            >
              {savingMorning ? 'Saving…' : 'Save Morning'}
            </Button>
          </Box>
        </Paper>
      )}

      {/* ====================================================== */}
      {/* ==================== EVENING ========================== */}
      {/* ====================================================== */}

      {mode === 'evening' && (
        <Paper elevation={1} sx={{ p: 3, borderRadius: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>
            Evening Delivery
          </Typography>
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

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Today's Login"
                name="todaysLogin"
                value={evening.todaysLogin}
                onChange={handleEvening}
                inputMode="numeric"
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Today's Approval (₹)"
                name="todaysApproval"
                value={evening.todaysApproval}
                onChange={handleEvening}
                inputMode="numeric"
                InputProps={{
                  startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                }}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Today's Disbursal (₹)"
                name="todaysDisbursal"
                value={evening.todaysDisbursal}
                onChange={handleEvening}
                inputMode="numeric"
                InputProps={{
                  startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                }}
              />
            </Grid>
          </Grid>

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
            <Button variant="outlined" onClick={handleCancel} sx={{ borderRadius: 2 }}>
              Cancel
            </Button>
            <Button
              variant="contained"
              color="success"
              onClick={saveEvening}
              disabled={savingEvening}
              sx={{ borderRadius: 2, fontWeight: 700, ml: 1 }}
            >
              {savingEvening ? 'Saving…' : 'Save Evening'}
            </Button>
          </Box>
        </Paper>
      )}

      {/* Snackbar */}
      <Snackbar
        open={snack.open}
        autoHideDuration={2000}
        onClose={() => setSnack({ open: false, msg: '' })}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        message={snack.msg}
      />
    </Box>
  );
}
