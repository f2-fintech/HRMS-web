'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  Divider,
  Paper,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
  Rating,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import SaveIcon from '@mui/icons-material/Save';
import WbSunnyIcon from '@mui/icons-material/WbSunny';
import NightsStayIcon from '@mui/icons-material/NightsStay';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import EditIcon from '@mui/icons-material/Edit';

import { apiUpload, fetchOneDaily, fetchOneMonthly, monthISO, todayISO } from './dpApi';

// ✅ helpers: filename + preview
const getFileNameFromUrl = (url: string) => {
  try {
    const clean = String(url || '').split('?')[0];
    const last = clean.substring(clean.lastIndexOf('/') + 1);
    return decodeURIComponent(last || url);
  } catch {
    return url;
  }
};

const prettyFileName = (url: string) => {
  const name = getFileNameFromUrl(url);
  return name.replace(/^\d{10,}-/, ''); // remove leading timestamp-
};

const isImageUrl = (url: string) => /\.(png|jpe?g|webp|gif)$/i.test(String(url || '').split('?')[0]);

export default function PerformanceEmployee() {
  const [tab, setTab] = useState<'daily' | 'monthly'>('daily');

  const [openForm, setOpenForm] = useState(false);

  const [dailyDate, setDailyDate] = useState(todayISO());
  const [month, setMonth] = useState(monthISO());

  // ✅ Daily fields
  const [morningPlan, setMorningPlan] = useState('');
  const [eveningCompleted, setEveningCompleted] = useState('');

  // ✅ Monthly fields
  const [monthPlan, setMonthPlan] = useState('');
  const [monthCompleted, setMonthCompleted] = useState('');

  // ✅ Separate images
  const [morningImage, setMorningImage] = useState<File | null>(null);
  const [eveningImage, setEveningImage] = useState<File | null>(null);
  const [monthPlanImage, setMonthPlanImage] = useState<File | null>(null);
  const [monthCompletedImage, setMonthCompletedImage] = useState<File | null>(null);

  // ✅ record view
  const [record, setRecord] = useState<any | null>(null);
  const [loadingRecord, setLoadingRecord] = useState(false);

  // ✅ saving states
  const [savingMorning, setSavingMorning] = useState(false);
  const [savingEvening, setSavingEvening] = useState(false);
  const [savingMonthPlan, setSavingMonthPlan] = useState(false);
  const [savingMonthCompleted, setSavingMonthCompleted] = useState(false);

  const myId = useMemo(() => {
    if (typeof window === 'undefined') return '';
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return String(user?.employee_id || user?._id || user?.id || '').trim();
  }, []);

  const loadRecord = async () => {
    if (!myId) return;
    try {
      setLoadingRecord(true);
      const r =
        tab === 'daily'
          ? await fetchOneDaily(myId, dailyDate)
          : await fetchOneMonthly(myId, month);

      setRecord(r || null);
    } catch (e) {
      console.log(e);
      setRecord(null);
    } finally {
      setLoadingRecord(false);
    }
  };

  useEffect(() => {
    loadRecord();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, dailyDate, month, myId]);

  // ✅ Edit (prefill form)
  const openEditForm = () => {
    if (!record) {
      setOpenForm(true);
      return;
    }

    if (tab === 'daily') {
      setMorningPlan(String(record?.whatDoneToday || ''));
      setEveningCompleted(String(record?.whatCompletedToday || ''));
    } else {
      setMonthPlan(String(record?.planForThisMonth || ''));
      setMonthCompleted(String(record?.completedThisMonth || ''));
    }

    setOpenForm(true);
  };

  const FilePicker = ({
    label,
    file,
    onPick,
  }: {
    label: string;
    file: File | null;
    onPick: (f: File | null) => void;
  }) => (
    <Stack spacing={0.5}>
      <Button component="label" variant="outlined" sx={{ alignSelf: 'flex-start', borderRadius: 2 }}>
        {label}
        <input hidden type="file" accept="image/*" onChange={(e) => onPick(e.target.files?.[0] || null)} />
      </Button>

      {file ? (
        <Typography variant="caption" color="text.secondary">
          Selected: {file.name}
        </Typography>
      ) : (
        <Typography variant="caption" color="text.secondary">
          No image selected
        </Typography>
      )}
    </Stack>
  );

  const saveMorning = async () => {
    try {
      setSavingMorning(true);

      const fd = new FormData();
      fd.append('date', dailyDate);
      fd.append('whatDoneToday', morningPlan.trim());
      if (morningImage) fd.append('image', morningImage);

      await apiUpload(`/department-performance/daily`, fd);

      alert('✅ Morning saved');
      setMorningPlan('');
      setMorningImage(null);
      setOpenForm(false);
      loadRecord();
    } catch (e: any) {
      alert(`❌ ${e?.message || 'Error'}`);
    } finally {
      setSavingMorning(false);
    }
  };

  const saveEvening = async () => {
    try {
      setSavingEvening(true);

      const fd = new FormData();
      fd.append('date', dailyDate);
      fd.append('whatCompletedToday', eveningCompleted.trim());
      if (eveningImage) fd.append('image', eveningImage);

      await apiUpload(`/department-performance/daily`, fd);

      alert('✅ Evening saved');
      setEveningCompleted('');
      setEveningImage(null);
      setOpenForm(false);
      loadRecord();
    } catch (e: any) {
      alert(`❌ ${e?.message || 'Error'}`);
    } finally {
      setSavingEvening(false);
    }
  };

  const saveMonthlyPlan = async () => {
    try {
      setSavingMonthPlan(true);

      const fd = new FormData();
      fd.append('month', month);
      fd.append('planForThisMonth', monthPlan.trim());
      if (monthPlanImage) fd.append('image', monthPlanImage);

      await apiUpload(`/department-performance/monthly`, fd);

      alert('✅ Monthly plan saved');
      setMonthPlan('');
      setMonthPlanImage(null);
      setOpenForm(false);
      loadRecord();
    } catch (e: any) {
      alert(`❌ ${e?.message || 'Error'}`);
    } finally {
      setSavingMonthPlan(false);
    }
  };

  const saveMonthlyCompleted = async () => {
    try {
      setSavingMonthCompleted(true);

      const fd = new FormData();
      fd.append('month', month);
      fd.append('completedThisMonth', monthCompleted.trim());
      if (monthCompletedImage) fd.append('image', monthCompletedImage);

      await apiUpload(`/department-performance/monthly`, fd);

      alert('✅ Monthly completed saved');
      setMonthCompleted('');
      setMonthCompletedImage(null);
      setOpenForm(false);
      loadRecord();
    } catch (e: any) {
      alert(`❌ ${e?.message || 'Error'}`);
    } finally {
      setSavingMonthCompleted(false);
    }
  };

  return (
    <Box sx={{ p: 2 }}>
      {/* Header */}
      <Paper
        elevation={0}
        sx={{
          px: 2,
          py: 1.5,
          borderRadius: 3,
          border: '1px solid',
          borderColor: 'divider',
          background: 'linear-gradient(180deg,#ffffff 0%,#fafbff 100%)',
          mb: 2,
        }}
      >
        <Stack direction="row" alignItems="center" justifyContent="space-between" gap={2}>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="h6" sx={{ fontWeight: 900 }} noWrap>
              Employee Performance
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap>
              Submit Daily (Morning/Evening) & Monthly (Plan/Completed) + see manager review
            </Typography>
          </Box>

          <Stack direction="row" spacing={1} flexWrap="wrap" justifyContent="flex-end">
            {record ? (
              <Button
                variant="outlined"
                startIcon={<EditIcon />}
                onClick={openEditForm}
                sx={{ borderRadius: 999, fontWeight: 900, textTransform: 'none' }}
              >
                Edit
              </Button>
            ) : null}

            <Button
              variant={openForm ? 'outlined' : 'contained'}
              startIcon={openForm ? <CloseIcon /> : <AddIcon />}
              onClick={() => setOpenForm((p) => !p)}
              sx={{ borderRadius: 999, fontWeight: 900, textTransform: 'none' }}
            >
              {openForm ? 'Close' : 'Create'}
            </Button>
          </Stack>
        </Stack>

        <Divider sx={{ mt: 1.5 }} />

        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mt: 1 }}>
          <Tab value="daily" label="Daily" />
          <Tab value="monthly" label="Monthly" />
        </Tabs>

        {/* Filters */}
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1.5 }}>
          <CalendarMonthIcon sx={{ color: 'text.secondary' }} />
          {tab === 'daily' ? (
            <TextField
              size="small"
              type="date"
              label="Date"
              value={dailyDate}
              onChange={(e) => setDailyDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{ maxWidth: 220, '& .MuiInputBase-root': { height: 36 } }}
            />
          ) : (
            <TextField
              size="small"
              type="month"
              label="Month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{ maxWidth: 220, '& .MuiInputBase-root': { height: 36 } }}
            />
          )}
        </Stack>
      </Paper>

      {/* Create/Edit Form */}
      {openForm && (
        <Paper variant="outlined" sx={{ p: 2, borderRadius: 3, mb: 2 }}>
          {tab === 'daily' ? (
            <Stack spacing={2}>
              {/* Morning */}
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: 'rgba(255,193,7,0.08)' }}>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                  <WbSunnyIcon sx={{ color: '#f59e0b' }} />
                  <Typography sx={{ fontWeight: 900 }}>Morning</Typography>
                </Stack>

                <Stack spacing={2}>
                  <TextField
                    label="Plan / What you will do today (Morning)"
                    value={morningPlan}
                    onChange={(e) => setMorningPlan(e.target.value)}
                    multiline
                    minRows={3}
                  />

                  <FilePicker label="Upload Morning Image (optional)" file={morningImage} onPick={setMorningImage} />

                  <Button
                    onClick={saveMorning}
                    disabled={savingMorning || !morningPlan.trim()}
                    variant="contained"
                    startIcon={<SaveIcon />}
                    sx={{ borderRadius: 2, fontWeight: 900, textTransform: 'none', alignSelf: 'flex-start' }}
                  >
                    Save Morning
                  </Button>
                </Stack>
              </Paper>

              {/* Evening */}
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: 'rgba(59,130,246,0.08)' }}>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                  <NightsStayIcon sx={{ color: '#3b82f6' }} />
                  <Typography sx={{ fontWeight: 900 }}>Evening</Typography>
                </Stack>

                <Stack spacing={2}>
                  <TextField
                    label="What completed today (Evening)"
                    value={eveningCompleted}
                    onChange={(e) => setEveningCompleted(e.target.value)}
                    multiline
                    minRows={3}
                  />

                  <FilePicker label="Upload Evening Image (optional)" file={eveningImage} onPick={setEveningImage} />

                  <Button
                    onClick={saveEvening}
                    disabled={savingEvening || !eveningCompleted.trim()}
                    variant="contained"
                    startIcon={<SaveIcon />}
                    sx={{ borderRadius: 2, fontWeight: 900, textTransform: 'none', alignSelf: 'flex-start' }}
                  >
                    Save Evening
                  </Button>
                </Stack>
              </Paper>
            </Stack>
          ) : (
            <Stack spacing={2}>
              {/* Monthly */}
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: 'rgba(99,102,241,0.06)' }}>
                <Typography sx={{ fontWeight: 900, mb: 1 }}>Monthly</Typography>

                <Stack spacing={2}>
                  <TextField
                    label="What you have to do in this month (Plan)"
                    value={monthPlan}
                    onChange={(e) => setMonthPlan(e.target.value)}
                    multiline
                    minRows={3}
                  />

                  <FilePicker
                    label="Upload Monthly Plan Image (optional)"
                    file={monthPlanImage}
                    onPick={setMonthPlanImage}
                  />

                  <Button
                    onClick={saveMonthlyPlan}
                    disabled={savingMonthPlan || !monthPlan.trim()}
                    variant="contained"
                    startIcon={<SaveIcon />}
                    sx={{ borderRadius: 2, fontWeight: 900, textTransform: 'none', alignSelf: 'flex-start' }}
                  >
                    Save Plan
                  </Button>

                  <Divider />

                  <TextField
                    label="What completed in this month"
                    value={monthCompleted}
                    onChange={(e) => setMonthCompleted(e.target.value)}
                    multiline
                    minRows={3}
                  />

                  <FilePicker
                    label="Upload Monthly Completed Image (optional)"
                    file={monthCompletedImage}
                    onPick={setMonthCompletedImage}
                  />

                  <Button
                    onClick={saveMonthlyCompleted}
                    disabled={savingMonthCompleted || !monthCompleted.trim()}
                    variant="contained"
                    startIcon={<SaveIcon />}
                    sx={{ borderRadius: 2, fontWeight: 900, textTransform: 'none', alignSelf: 'flex-start' }}
                  >
                    Save Completed
                  </Button>

                  <Typography variant="caption" color="text.secondary">
                    Month format: YYYY-MM (e.g. 2025-12)
                  </Typography>
                </Stack>
              </Paper>
            </Stack>
          )}
        </Paper>
      )}

      {/* View Submitted Record */}
      <Paper variant="outlined" sx={{ p: 2, borderRadius: 3 }}>
        <Typography sx={{ fontWeight: 900, mb: 1 }}>
          {tab === 'daily' ? `My Daily Record • ${dailyDate}` : `My Monthly Record • ${month}`}
        </Typography>

        <Divider sx={{ mb: 2 }} />

        {loadingRecord ? (
          <Typography color="text.secondary">Loading record…</Typography>
        ) : !record ? (
          <Typography color="text.secondary">
            No record found for this {tab === 'daily' ? 'date' : 'month'}.
          </Typography>
        ) : (
          <Stack spacing={2}>
            {tab === 'daily' ? (
              <>
                <Box>
                  <Typography variant="caption" sx={{ fontWeight: 900 }}>
                    Morning (Plan)
                  </Typography>
                  <Typography sx={{ whiteSpace: 'pre-wrap' }}>{record.whatDoneToday || '—'}</Typography>
                </Box>

                <Box>
                  <Typography variant="caption" sx={{ fontWeight: 900 }}>
                    Evening (Completed)
                  </Typography>
                  <Typography sx={{ whiteSpace: 'pre-wrap' }}>{record.whatCompletedToday || '—'}</Typography>
                </Box>
              </>
            ) : (
              <>
                <Box>
                  <Typography variant="caption" sx={{ fontWeight: 900 }}>
                    Plan for this month
                  </Typography>
                  <Typography sx={{ whiteSpace: 'pre-wrap' }}>{record.planForThisMonth || '—'}</Typography>
                </Box>

                <Box>
                  <Typography variant="caption" sx={{ fontWeight: 900 }}>
                    Completed this month
                  </Typography>
                  <Typography sx={{ whiteSpace: 'pre-wrap' }}>{record.completedThisMonth || '—'}</Typography>
                </Box>
              </>
            )}

            {/* ✅ Attachments (fixed) */}
            {Array.isArray(record.attachments) && record.attachments.length > 0 ? (
              <>
                <Divider />
                <Box>
                  <Typography variant="caption" sx={{ fontWeight: 900 }}>
                    Attachments
                  </Typography>

                  <Stack spacing={1} sx={{ mt: 1 }}>
                    {record.attachments.map((url: string, idx: number) => {
                      const name = prettyFileName(url);
                      const img = isImageUrl(url);

                      return (
                        <Paper key={idx} variant="outlined" sx={{ p: 1, borderRadius: 2 }}>
                          <Stack direction="row" spacing={1} alignItems="center">
                            {img ? (
                              <img
                                src={url}
                                alt={name}
                                style={{ width: 46, height: 46, borderRadius: 8, objectFit: 'cover' }}
                              />
                            ) : null}

                            <Box sx={{ minWidth: 0 }}>
                              <a href={url} target="_blank" rel="noreferrer" style={{ fontWeight: 700 }}>
                                {name}
                              </a>
                              <Typography variant="caption" color="text.secondary" noWrap>
                                {url}
                              </Typography>
                            </Box>
                          </Stack>
                        </Paper>
                      );
                    })}
                  </Stack>
                </Box>
              </>
            ) : null}

            <Divider />

            {/* Manager Review */}
            <Typography sx={{ fontWeight: 900 }}>Manager Review</Typography>

            <Stack direction="row" alignItems="center" spacing={1}>
              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                Rating:
              </Typography>
              <Rating value={record.rating ?? null} readOnly />
              <Typography variant="caption" color="text.secondary">
                {record.rating ? `${record.rating}/5` : 'Not rated yet'}
              </Typography>
            </Stack>

            <Box>
              <Typography variant="caption" sx={{ fontWeight: 900 }}>
                Review
              </Typography>
              <Typography sx={{ whiteSpace: 'pre-wrap' }}>{record.review || 'No review yet.'}</Typography>
            </Box>

            {record.reviewByName || record.reviewBy ? (
              <Typography variant="caption" color="text.secondary">
                Reviewed by: {record.reviewByName || record.reviewBy}
              </Typography>
            ) : null}
          </Stack>
        )}
      </Paper>
    </Box>
  );
}
