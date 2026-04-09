"use client";
import { useEffect, useState } from "react";

import {
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography,
    Box,
    CircularProgress,
    TextField,
    TablePagination,
    InputAdornment,
    Chip,
    Avatar,
} from "@mui/material";

import SearchIcon from "@mui/icons-material/Search";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";

import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";

import dayjs from "dayjs";

interface IncentiveTargetRow {
    _id: string;
    designation: string;
    employeeName: string;
    targetDisbursed: number;
    achievedAmount: number;
    image?: string;
}

function getInitials(name: string) {
    return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
}

function getAvatarColor(name: string) {
    const colors = [
        "#6366f1",
        "#8b5cf6",
        "#ec4899",
        "#14b8a6",
        "#f59e0b",
        "#10b981",
        "#3b82f6",
        "#ef4444",
    ];


    return colors[name.charCodeAt(0) % colors.length];
}

function formatNumber(num: number) {
    return num?.toLocaleString("en-IN", { maximumFractionDigits: 0 });
}

function AchievementBadge({ achieved, target }: { achieved: number; target: number }) {
    if (target === 0) return <span style={{ color: "#94a3b8", fontSize: 13 }}>—</span>;

    const pct = Math.round((achieved / target) * 100);

    const color =
        pct >= 100 ? "#10b981" :
            pct >= 75 ? "#3b82f6" :
                pct >= 50 ? "#f59e0b" :
                    "#ef4444";

    const bg =
        pct >= 100 ? "#ecfdf5" :
            pct >= 75 ? "#eff6ff" :
                pct >= 50 ? "#fffbeb" :
                    "#fef2f2";

    return (
        <Chip
            label={`${pct}%`}
            size="small"
            sx={{
                backgroundColor: bg,
                color: color,
                fontWeight: 700,
                fontSize: 12,
                px: 1,
                height: 24,
            }}
        />
    );
}

export default function IncentiveTargetTable() {
    const [data, setData] = useState<IncentiveTargetRow[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedDate, setSelectedDate] = useState(dayjs());
    const [companyId, setCompanyId] = useState("");
    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [total, setTotal] = useState(0);
    const [imgError, setImgError] = useState<{ [key: string]: boolean }>({});

    // Min year: 2015, Max year: current year
    const minYear = dayjs("2015-01-01");
    const maxYear = dayjs();

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem("user") || "{}");
        const id = localStorage.getItem("company_id") || user.company_id || "";

        setCompanyId(id);
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
            setPage(0);
        }, 500);

        return () => clearTimeout(timer);
    }, [search]);

    const fetchData = async () => {
        if (!companyId) return;

        setLoading(true);

        try {
            const token = localStorage.getItem("token") || "";
            const month = selectedDate.format("MM");
            const year = selectedDate.format("YYYY");

            const res = await fetch(
                `${process.env.NEXT_PUBLIC_APP_URL}/incentive-targets/all-with-targets/${companyId}?month=${month}&year=${year}&search=${debouncedSearch}&page=${page + 1}&limit=${rowsPerPage}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            const json = await res.json();

            setData(json?.data || []);
            setTotal(json?.meta?.total || 0);
        } catch (err) {
            console.error(err);
            setData([]);
            setTotal(0);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [companyId, debouncedSearch, page, rowsPerPage, selectedDate]);

    return (
        <Paper sx={{ borderRadius: 3, mt: 5, overflow: "hidden" }}>
            {/*HEADER*/}
            <Box
                sx={{
                    px: 3,
                    py: 2.5,
                    display: "flex",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    gap: 2,
                    background: "#5478FF",
                }}
            >
                <Box display="flex" alignItems="center" gap={1.5}>
                    <Box
                        sx={{
                            width: 38,
                            height: 38,
                            borderRadius: 2,
                            background: "rgba(255,255,255,0.2)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                        }}
                    >
                        <CalendarMonthIcon sx={{ color: "#fff" }} />
                    </Box>

                    <Box>
                        <Typography fontWeight={700} color="#fff" fontSize={16}>
                            Team Incentive Targets
                        </Typography>
                        <Typography fontSize={12} color="rgba(255,255,255,0.9)" fontWeight={600}>
                            {total} employees · {selectedDate.format("MMMM YYYY")}
                        </Typography>
                    </Box>
                </Box>

                {/*CONTROLS*/}
                <Box display="flex" gap={1.5}>
                    {/* SEARCH */}
                    <TextField
                        size="small"
                        placeholder="Search employee..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        sx={{
                            width: 220,
                            "& .MuiOutlinedInput-root": {
                                background: "#fff",
                                borderRadius: "10px",
                                "& fieldset": { border: "none" },
                                "&:hover fieldset": { border: "none" },
                                "&.Mui-focused fieldset": { border: "none" },
                            },
                        }}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon sx={{ color: "#64748b" }} />
                                </InputAdornment>
                            ),
                        }}
                    />

                    {/* DATE PICKER- restricted from 2015 to current year */}
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                        <DatePicker
                            views={["year", "month"]}
                            value={selectedDate}
                            minDate={minYear}
                            maxDate={maxYear}
                            onChange={(val) => {
                                if (val && val.isAfter(maxYear)) {
                                    setSelectedDate(maxYear);
                                } else if (val && val.isBefore(minYear)) {
                                    setSelectedDate(minYear);
                                } else {
                                    setSelectedDate(val || dayjs());
                                }

                                setPage(0);
                            }}
                            slotProps={{
                                textField: {
                                    size: "small",
                                    sx: {
                                        minWidth: 200,
                                        "& .MuiOutlinedInput-root": {
                                            background: "#fff",
                                            borderRadius: "10px",
                                            "& fieldset": { border: "none" },
                                            "&:hover fieldset": { border: "none" },
                                            "&.Mui-focused fieldset": { border: "none" },
                                        },
                                    },
                                    InputProps: {
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <CalendarMonthIcon sx={{ color: "#5478FF" }} />
                                            </InputAdornment>
                                        ),
                                    },
                                },
                            }}
                        />
                    </LocalizationProvider>
                </Box>
            </Box>

            {/*TABLE*/}
            <TableContainer>
                <Table>
                    <TableHead>
                        <TableRow sx={{ background: "#5478FF" }}>
                            {["#", "Employee", "Designation", "Target", "Achieved", "Progress"].map((h) => (
                                <TableCell key={h} sx={{ color: "#fff", fontWeight: 700 }}>
                                    {h}
                                </TableCell>
                            ))}
                        </TableRow>
                    </TableHead>

                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={6} align="center">
                                    <CircularProgress size={32} sx={{ color: "#5478FF" }} />
                                </TableCell>
                            </TableRow>
                        ) : data.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} align="center" sx={{ py: 8, color: "#64748b" }}>
                                    No targets found for {selectedDate.format("MMMM YYYY")}
                                </TableCell>
                            </TableRow>
                        ) : (
                            data.map((row, index) => (
                                <TableRow key={row._id} hover>
                                    <TableCell sx={{ color: "#64748b" }}>
                                        {page * rowsPerPage + index + 1}
                                    </TableCell>

                                    <TableCell>
                                        <Box display="flex" alignItems="center" gap={1.5}>
                                            <Avatar
                                                src={!imgError[row._id] ? row.image : undefined}
                                                onError={() =>
                                                    setImgError((prev) => ({
                                                        ...prev,
                                                        [row._id]: true,
                                                    }))
                                                }
                                                sx={{
                                                    width: 36,
                                                    height: 36,
                                                    background:
                                                        row.image && !imgError[row._id]
                                                            ? "transparent"
                                                            : getAvatarColor(row.employeeName),
                                                    fontSize: 14,
                                                    fontWeight: 600,
                                                }}
                                            >
                                                {(!row.image || imgError[row._id]) && getInitials(row.employeeName)}
                                            </Avatar>
                                            <Typography variant="body2" fontWeight={500}>
                                                {row.employeeName}
                                            </Typography>
                                        </Box>
                                    </TableCell>

                                    <TableCell>
                                        <Chip
                                            label={row.designation}
                                            size="small"
                                            sx={{
                                                backgroundColor: "#e0e7ff",
                                                color: "#1e40af",
                                                fontWeight: 600,
                                                fontSize: 12,
                                            }}
                                        />
                                    </TableCell>

                                    <TableCell align="center">
                                        <Chip
                                            label={formatNumber(row.targetDisbursed)}
                                            size="small"
                                            sx={{
                                                backgroundColor: "#ecfdf5",
                                                color: "#065f46",
                                                fontWeight: 600,
                                                minWidth: 100,
                                            }}
                                        />
                                    </TableCell>

                                    <TableCell align="center">
                                        <Chip
                                            label={formatNumber(row.achievedAmount)}
                                            size="small"
                                            sx={{
                                                backgroundColor: "#ecfdf5",
                                                color: "#065f46",
                                                fontWeight: 600,
                                                minWidth: 100,
                                            }}
                                        />
                                    </TableCell>

                                    <TableCell align="center">
                                        <AchievementBadge
                                            achieved={row.achievedAmount}
                                            target={row.targetDisbursed}
                                        />
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* PAGINATION */}
            <TablePagination
                component="div"
                count={total}
                page={page}
                onPageChange={(_, newPage) => setPage(newPage)}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={(e) => {
                    setRowsPerPage(parseInt(e.target.value, 10));
                    setPage(0);
                }}
                rowsPerPageOptions={[5, 10, 20, 50]}
                sx={{
                    borderTop: "1px solid #e2e8f0",
                    ".MuiTablePagination-selectLabel, .MuiTablePagination-displayedRows": {
                        fontSize: "0.875rem",
                    },
                }}
            />
        </Paper>
    );
}
