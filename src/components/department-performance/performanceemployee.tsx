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

import { apiPost, fetchOneDaily, fetchOneMonthly, monthISO, todayISO } from './dpApi';

export default function PerformanceEmployee() {
    const [tab, setTab] = useState<'daily' | 'monthly'>('daily');
    const [saving, setSaving] = useState(false);

    // ✅ create form toggle
    const [openForm, setOpenForm] = useState(false);

    // ✅ filters
    const [dailyDate, setDailyDate] = useState(todayISO());
    const [month, setMonth] = useState(monthISO());

    // ✅ form fields (Daily - Morning/Evening)
    const [morningDone, setMorningDone] = useState('');
    const [morningPlan, setMorningPlan] = useState('');
    const [eveningDone, setEveningDone] = useState('');
    const [eveningCompleted, setEveningCompleted] = useState('');

    // ✅ form fields (Monthly)
    const [monthPlan, setMonthPlan] = useState('');
    const [monthCompleted, setMonthCompleted] = useState('');

    // ✅ record view state
    const [record, setRecord] = useState<any | null>(null);
    const [loadingRecord, setLoadingRecord] = useState(false);

    const myId = useMemo(() => {
        if (typeof window === 'undefined') return '';
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        return String(user?.id || user?._id || '');
    }, []);

    // ✅ load record when filters change
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

    // ✅ Save Daily
    const saveDaily = async () => {
        try {
            setSaving(true);

            const whatDoneToday =
                `${morningPlan}`.trim();

            const whatCompletedToday =
                `${eveningCompleted}`.trim();

            await apiPost(`/department-performance/daily`, {
                date: dailyDate,
                whatDoneToday,
                whatCompletedToday,
            });

            alert('✅ Daily saved');
            setOpenForm(false);
            loadRecord(); // ✅ after submit show record
        } catch (e: any) {
            alert(`❌ ${e?.message || 'Error'}`);
        } finally {
            setSaving(false);
        }
    };

    // ✅ Save Monthly
    const saveMonthly = async () => {
        try {
            setSaving(true);

            await apiPost(`/department-performance/monthly`, {
                month,
                planForThisMonth: monthPlan,
                completedThisMonth: monthCompleted,
            });

            alert('✅ Monthly saved');
            setOpenForm(false);
            loadRecord(); // ✅ after submit show record
        } catch (e: any) {
            alert(`❌ ${e?.message || 'Error'}`);
        } finally {
            setSaving(false);
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
                            Submit your Daily (Morning/Evening) & Monthly updates + see manager review
                        </Typography>
                    </Box>

                    <Button
                        variant={openForm ? 'outlined' : 'contained'}
                        startIcon={openForm ? <CloseIcon /> : <AddIcon />}
                        onClick={() => setOpenForm((p) => !p)}
                        sx={{ borderRadius: 999, fontWeight: 900, textTransform: 'none' }}
                    >
                        {openForm ? 'Close' : 'Create Task'}
                    </Button>
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

            {/* Create Form */}
            {openForm && (
                <Paper variant="outlined" sx={{ p: 2, borderRadius: 3, mb: 2 }}>
                    {tab === 'daily' ? (
                        <Stack spacing={2}>
                            {/* Morning */}
                            <Paper
                                variant="outlined"
                                sx={{ p: 2, borderRadius: 2, bgcolor: 'rgba(255,193,7,0.08)' }}
                            >
                                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                                    <WbSunnyIcon sx={{ color: '#f59e0b' }} />
                                    <Typography sx={{ fontWeight: 900 }}>Morning</Typography>
                                </Stack>

                                <Stack spacing={2}>
                                 
                                    <TextField
                                        label="Plan for today (Morning)"
                                        value={morningPlan}
                                        onChange={(e) => setMorningPlan(e.target.value)}
                                        multiline
                                        minRows={3}
                                    />
                                </Stack>
                            </Paper>

                            {/* Evening */}
                            <Paper
                                variant="outlined"
                                sx={{ p: 2, borderRadius: 2, bgcolor: 'rgba(59,130,246,0.08)' }}
                            >
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
                                </Stack>
                            </Paper>

                            <Box>
                                <Button
                                    onClick={saveDaily}
                                    disabled={saving}
                                    variant="contained"
                                    startIcon={<SaveIcon />}
                                    sx={{ borderRadius: 2, fontWeight: 900, textTransform: 'none' }}
                                >
                                    Save Daily
                                </Button>
                            </Box>
                        </Stack>
                    ) : (
                        <Stack spacing={2}>
                            <Paper
                                variant="outlined"
                                sx={{ p: 2, borderRadius: 2, bgcolor: 'rgba(99,102,241,0.06)' }}
                            >
                                <Typography sx={{ fontWeight: 900, mb: 1 }}>Monthly</Typography>

                                <Stack spacing={2}>
                                    <TextField
                                        label="What you have to do in this month"
                                        value={monthPlan}
                                        onChange={(e) => setMonthPlan(e.target.value)}
                                        multiline
                                        minRows={3}
                                    />
                                    <TextField
                                        label="What completed in this month"
                                        value={monthCompleted}
                                        onChange={(e) => setMonthCompleted(e.target.value)}
                                        multiline
                                        minRows={3}
                                    />
                                </Stack>
                            </Paper>

                            <Box>
                                <Button
                                    onClick={saveMonthly}
                                    disabled={saving}
                                    variant="contained"
                                    startIcon={<SaveIcon />}
                                    sx={{ borderRadius: 2, fontWeight: 900, textTransform: 'none' }}
                                >
                                    Save Monthly
                                </Button>
                            </Box>

                            <Typography variant="caption" color="text.secondary">
                                Month format: YYYY-MM (e.g. 2025-12)
                            </Typography>
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
                        {/* show daily/month fields */}
                        {tab === 'daily' ? (
                            <>
                                <Box>
                                    <Typography variant="caption" sx={{ fontWeight: 900 }}>
                                        Morning + Evening (Saved)
                                    </Typography>
                                    <Typography sx={{ whiteSpace: 'pre-wrap' }}>
                                        {record.whatDoneToday || '—'}
                                    </Typography>
                                    <Divider sx={{ my: 1.5 }} />
                                    <Typography sx={{ whiteSpace: 'pre-wrap' }}>
                                        {record.whatCompletedToday || '—'}
                                    </Typography>
                                </Box>
                            </>
                        ) : (
                            <>
                                <Box>
                                    <Typography variant="caption" sx={{ fontWeight: 900 }}>
                                        Plan for this month
                                    </Typography>
                                    <Typography sx={{ whiteSpace: 'pre-wrap' }}>
                                        {record.planForThisMonth || '—'}
                                    </Typography>
                                </Box>
                                <Box>
                                    <Typography variant="caption" sx={{ fontWeight: 900 }}>
                                        Completed this month
                                    </Typography>
                                    <Typography sx={{ whiteSpace: 'pre-wrap' }}>
                                        {record.completedThisMonth || '—'}
                                    </Typography>
                                </Box>
                            </>
                        )}

                        <Divider />

                        {/* ✅ Manager Review */}
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
                            <Typography sx={{ whiteSpace: 'pre-wrap' }}>
                                {record.review || 'No review yet.'}
                            </Typography>
                        </Box>

                        {/* Optional: show who reviewed if backend provides */}
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
