'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
    Avatar,
    Box,
    Button,
    Chip,
    Divider,
    Drawer,
    IconButton,
    Paper,
    Stack,
    Tab,
    Tabs,
    TextField,
    Typography,
    Rating,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import GroupsIcon from '@mui/icons-material/Groups';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';

import { useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from '@/redux/store';
import { fetchEmployees } from '@/redux/features/employees/employeesSlice';

import { apiPatch, fetchOneDaily, fetchOneMonthly, monthISO, todayISO } from './dpApi';

type TeamApi = {
    _id: string;
    name: string;
    code?: string;
    manager_id?: string;
    employee_ids?: string;
    tls?: string[];
};

type Employee = {
    _id: string;
    first_name?: string;
    last_name?: string;
    image?: string;
    designation?: string;
    code?: string;
};

const fullName = (e?: Employee | null) =>
    `${e?.first_name || ''} ${e?.last_name || ''}`.trim() || '—';

const splitIds = (csv?: string) =>
    String(csv || '')
        .split(',')
        .map((x) => x.trim())
        .filter(Boolean);

// ✅ only real mongo ids
const isMongoId = (v: any) => /^[a-f\d]{24}$/i.test(String(v || '').trim());


const ALLOWED_TEAM_IDS: string[] = [
    '680789b86a3572ff9478bcd2',
    '68078bdd6a3572ff9478bd50',
    '68078c506a3572ff9478bd6c',
    '693d0c7f5c4e2f15ce95cf0b',
    '68e8feb4fa8c01760efccf87'
];

const ALLOWED_TEAM_CODES: string[] = [
    // 'SALES',
    // 'HR',
];

export default function PerformanceAdmin() {
    const dispatch: AppDispatch = useDispatch();
    const { employees } = useSelector((state: RootState) => state.employees);

    const [teams, setTeams] = useState<TeamApi[]>([]);
    const [loadingTeams, setLoadingTeams] = useState(false);

    const [drawerOpen, setDrawerOpen] = useState(false);
    const [teamSearch, setTeamSearch] = useState('');
    const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);

    const [tab, setTab] = useState<'daily' | 'monthly'>('daily');
    const [filterDate, setFilterDate] = useState(todayISO());
    const [filterMonth, setFilterMonth] = useState(monthISO());

    const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);

    const [record, setRecord] = useState<any | null>(null);
    const [loadingRecord, setLoadingRecord] = useState(false);

    const [reviewRating, setReviewRating] = useState<number | null>(null);
    const [reviewText, setReviewText] = useState('');

    // ✅ employees
    useEffect(() => {
        if (!employees || employees.length === 0) {
            dispatch(fetchEmployees({ page: 1, limit: 0, search: '', designation: '' }));
        }
    }, [dispatch, employees?.length]);

    // ✅ teams
    useEffect(() => {
        const run = async () => {
            const base = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:5500';
            const token = localStorage.getItem('token') || '';
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            const companyId = localStorage.getItem('company_id') || user.company_id || '';

            try {
                setLoadingTeams(true);
                const res = await fetch(`${base}/teams/get-all-teams`, {
                    headers: { Authorization: `Bearer ${token}`, 'x-company-id': companyId },
                });
                const data = await res.json();

                const list: TeamApi[] = Array.isArray(data)
                    ? data
                    : Array.isArray(data?.teams)
                        ? data.teams
                        : Array.isArray(data?.data)
                            ? data.data
                            : [];

                // ✅ Filter only allowed teams (if allow-list is configured)
                const hasAllowList = ALLOWED_TEAM_IDS.length > 0 || ALLOWED_TEAM_CODES.length > 0;

                const filteredList = hasAllowList
                    ? list.filter((t) => {
                        const id = String(t._id || '');
                        const code = String(t.code || '').toUpperCase();
                        const byId = ALLOWED_TEAM_IDS.includes(id);
                        const byCode = ALLOWED_TEAM_CODES.map((x) => String(x).toUpperCase()).includes(code);
                        return byId || byCode;
                    })
                    : list;

                setTeams(filteredList);

                if (filteredList.length > 0) setSelectedTeamId(filteredList[0]._id);
                else setSelectedTeamId(null);
            } catch (e) {
                console.log('❌ get-all-teams error', e);
                setTeams([]);
                setSelectedTeamId(null);
            } finally {
                setLoadingTeams(false);
            }
        };
        run();
    }, []);

    const empMap = useMemo(() => {
        const m = new Map<string, Employee>();
        (employees || []).forEach((e: any) => e?._id && m.set(String(e._id), e));
        return m;
    }, [employees]);

    const filteredTeams = useMemo(() => {
        const q = teamSearch.trim().toLowerCase();
        if (!q) return teams;
        return teams.filter((t) => {
            const name = String(t?.name || '').toLowerCase();
            const code = String(t?.code || '').toLowerCase();
            return name.includes(q) || code.includes(q);
        });
    }, [teams, teamSearch]);

    const selectedTeam = useMemo(
        () => teams.find((t) => t._id === selectedTeamId) || null,
        [teams, selectedTeamId],
    );

    // ✅ Remove invalid employee ids + skip ids not present in employee map (no “—” cards)
    const teamMemberIds = useMemo(() => {
        const ids = splitIds(selectedTeam?.employee_ids)
            .map((x) => String(x || '').trim())
            .filter((x) => isMongoId(x))
            .filter((x) => empMap.has(x));
        return ids;
    }, [selectedTeam?.employee_ids, empMap]);

    const loadRecord = async () => {
        if (!selectedEmployeeId) {
            setRecord(null);
            return;
        }
        try {
            setLoadingRecord(true);
            const r =
                tab === 'daily'
                    ? await fetchOneDaily(selectedEmployeeId, filterDate)
                    : await fetchOneMonthly(selectedEmployeeId, filterMonth);

            setRecord(r || null);
            setReviewRating(r?.rating ?? null);
            setReviewText(r?.review ?? '');
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
    }, [tab, filterDate, filterMonth, selectedEmployeeId]);

    const submitReview = async () => {
        if (!record?._id) return;
        try {
            await apiPatch(`/department-performance/${record._id}/review`, {
                rating: reviewRating,
                review: reviewText,
            });
            alert('✅ Review saved');
            loadRecord();
        } catch (e: any) {
            alert(`❌ ${e?.message || 'Error'}`);
        }
    };

    return (
        <>
            {/* Teams Drawer */}
            <Drawer
                anchor="right"
                open={drawerOpen}
                onClose={() => setDrawerOpen(false)}
                PaperProps={{ sx: { width: 380, p: 2 } }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Typography variant="h6" sx={{ fontWeight: 900 }}>
                        All Teams
                    </Typography>
                    <IconButton onClick={() => setDrawerOpen(false)}>
                        <CloseIcon />
                    </IconButton>
                </Box>

                <TextField
                    size="small"
                    fullWidth
                    label="Search team"
                    value={teamSearch}
                    onChange={(e) => setTeamSearch(e.target.value)}
                    sx={{ mt: 2 }}
                />

                <Divider sx={{ my: 2 }} />

                {loadingTeams ? (
                    <Typography color="text.secondary">Loading teams…</Typography>
                ) : filteredTeams.length === 0 ? (
                    <Typography color="text.secondary">No teams found.</Typography>
                ) : (
                    <Stack spacing={1}>
                        {filteredTeams.map((t) => {
                            const active = t._id === selectedTeamId;
                            return (
                                <Paper
                                    key={t._id}
                                    variant="outlined"
                                    onClick={() => {
                                        setSelectedTeamId(t._id);
                                        setSelectedEmployeeId(null);
                                        setDrawerOpen(false);
                                    }}
                                    sx={{
                                        p: 1.2,
                                        borderRadius: 2,
                                        cursor: 'pointer',
                                        borderColor: active ? 'primary.main' : 'divider',
                                        bgcolor: active ? 'rgba(44,60,227,0.06)' : 'transparent',
                                    }}
                                >
                                    <Typography sx={{ fontWeight: 900 }}>
                                        {t.name || '—'} 
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        Team ID: {t._id}
                                    </Typography>
                                </Paper>
                            );
                        })}
                    </Stack>
                )}
            </Drawer>

            {/* Main */}
            <Paper variant="outlined" sx={{ p: 2, borderRadius: 3 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" gap={2}>
                    <Box sx={{ minWidth: 0 }}>
                        <Typography sx={{ fontWeight: 900 }}>Admin Dashboard</Typography>
                        {/* <Typography variant="caption" color="text.secondary">
                            Team wise performance + review
                        </Typography> */}
                    </Box>

                    <Button
                        variant="contained"
                        startIcon={<GroupsIcon />}
                        onClick={() => setDrawerOpen(true)}
                        sx={{ borderRadius: 999, fontWeight: 900, textTransform: 'none' }}
                    >
                        Teams
                    </Button>
                </Stack>

                <Divider sx={{ my: 2 }} />

                {!selectedTeam ? (
                    <Typography color="text.secondary">No team selected.</Typography>
                ) : (
                    <>
                        <Stack direction="row" justifyContent="space-between" alignItems="center" gap={2}>
                            <Box sx={{ minWidth: 0 }}>
                                <Typography sx={{ fontWeight: 900 }} noWrap>
                                    {selectedTeam.name}
                                    <Chip
                                        icon={<PeopleAltIcon sx={{ color: '#fff' }} />}
                                        label={teamMemberIds.length}
                                        size="small"
                                        sx={{
                                            bgcolor: 'primary.main',
                                            color: '#fff',
                                            marginLeft: "5px",
                                            fontWeight: 900,
                                            '& .MuiChip-icon': { color: '#fff' },
                                        }}
                                    />

                                </Typography>


                            </Box>

                            <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ minHeight: 36 }}>
                                <Tab value="daily" label="Daily" />
                                <Tab value="monthly" label="Monthly" />
                            </Tabs>
                        </Stack>

                        <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                            {tab === 'daily' ? (
                                <TextField
                                    size="small"
                                    type="date"
                                    label="Date"
                                    value={filterDate}
                                    onChange={(e) => setFilterDate(e.target.value)}
                                    InputLabelProps={{ shrink: true }}
                                    sx={{
                                        maxWidth: 210,
                                        '& .MuiInputBase-root': {
                                            height: 36,
                                        },
                                    }}
                                />

                            ) : (
                                <TextField
                                    type="month"
                                    label="Month"
                                    value={filterMonth}
                                    onChange={(e) => setFilterMonth(e.target.value)}
                                    InputLabelProps={{ shrink: true }}
                                    sx={{ maxWidth: 240 }}
                                />
                            )}

                            {/* <Chip
                                label={
                                    selectedEmployeeId
                                        ? `Selected: ${fullName(empMap.get(selectedEmployeeId) || null)}`
                                        : 'Select employee'
                                }
                                variant="outlined"
                                sx={{ fontWeight: 900 }}
                            /> */}
                        </Box>

                        <Divider sx={{ my: 2 }} />

                        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                            {/* Left: employee list */}
                            <Box sx={{ flex: 1, minWidth: 280 }}>
                                <Typography variant="overline" sx={{ fontWeight: 900 }}>
                                    Employees
                                </Typography>
                                <Stack spacing={1} sx={{ mt: 1 }}>
                                    {teamMemberIds.map((id) => {
                                        const emp = empMap.get(id) || null;
                                        if (!emp) return null; // ✅ no empty “—” cards

                                        const active = selectedEmployeeId === id;

                                        return (
                                            <Paper
                                                key={id}
                                                variant="outlined"
                                                onClick={() => setSelectedEmployeeId(id)}
                                                sx={{
                                                    p: 1.1,
                                                    borderRadius: 2,
                                                    cursor: 'pointer',
                                                    borderColor: active ? 'primary.main' : 'divider',
                                                    bgcolor: active ? 'rgba(44,60,227,0.06)' : 'transparent',
                                                }}
                                            >
                                                <Stack direction="row" spacing={1.2} alignItems="center">
                                                    <Avatar src={emp?.image || ''} sx={{ width: 32, height: 32 }} />
                                                    <Box sx={{ minWidth: 0 }}>
                                                        <Typography sx={{ fontWeight: 900 }} noWrap>
                                                            {fullName(emp)}
                                                        </Typography>
                                                        <Typography variant="caption" color="text.secondary" noWrap>
                                                            {emp?.designation || '—'} 
                                                        </Typography>
                                                    </Box>
                                                </Stack>
                                            </Paper>
                                        );
                                    })}
                                </Stack>
                            </Box>

                            {/* Right: record + review */}
                            <Box sx={{ flex: 2, minWidth: 320 }}>
                                <Typography variant="overline" sx={{ fontWeight: 900 }}>
                                    Record + Review
                                </Typography>

                                <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, mt: 1 }}>
                                    {loadingRecord ? (
                                        <Typography color="text.secondary">Loading…</Typography>
                                    ) : !selectedEmployeeId ? (
                                        <Typography color="text.secondary">Select an employee from left.</Typography>
                                    ) : !record ? (
                                        <Typography color="text.secondary">No record found for this filter.</Typography>
                                    ) : (
                                        <Stack spacing={2}>
                                            <Typography sx={{ fontWeight: 900 }}>
                                                {tab === 'daily' ? `Daily • ${record.date}` : `Monthly • ${record.month}`}
                                            </Typography>

                                            {tab === 'daily' ? (
                                                <>
                                                    <Box>
                                                        <Typography variant="caption" sx={{ fontWeight: 900 }}>
                                                            What done today
                                                        </Typography>
                                                        <Typography sx={{ whiteSpace: 'pre-wrap' }}>
                                                            {record.whatDoneToday || '—'}
                                                        </Typography>
                                                    </Box>
                                                    <Box>
                                                        <Typography variant="caption" sx={{ fontWeight: 900 }}>
                                                            What completed today
                                                        </Typography>
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

                                            <Typography sx={{ fontWeight: 900 }}>Review</Typography>

                                            <Stack direction="row" alignItems="center" spacing={1}>
                                                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                                                    Rating:
                                                </Typography>
                                                <Rating value={reviewRating} onChange={(_, v) => setReviewRating(v)} />
                                            </Stack>

                                            <TextField
                                                label="Review"
                                                value={reviewText}
                                                onChange={(e) => setReviewText(e.target.value)}
                                                multiline
                                                minRows={3}
                                            />

                                            <Button
                                                variant="contained"
                                                onClick={submitReview}
                                                sx={{
                                                    borderRadius: 2,
                                                    fontWeight: 900,
                                                    textTransform: 'none',
                                                    alignSelf: 'flex-start',
                                                }}
                                            >
                                                Save Review
                                            </Button>
                                        </Stack>
                                    )}
                                </Paper>
                            </Box>
                        </Stack>
                    </>
                )}
            </Paper>
        </>
    );
}
