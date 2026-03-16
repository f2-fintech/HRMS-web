"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogContent,
  DialogActions,
  DialogTitle,
  IconButton,
  CircularProgress,
  Chip,
  Tooltip,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import axios from "axios";

const api = axios.create({ baseURL: process.env.NEXT_PUBLIC_APP_URL });

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token") || "";
    const companyId =
      localStorage.getItem("company_id") ||
      JSON.parse(localStorage.getItem("user") || "{}")?.company_id || "";

    if (!config.headers) config.headers = {};
    if (token) config.headers.Authorization = `Bearer ${token}`;
    if (companyId) config.headers["x-company-id"] = companyId;
  }
  return config;
});

type TodayLoginRow = {
  _id: string;
  date: string;
  employee_name: string;
  manager_tl: string;
  code?: string;
  total_logins: number;
  total_rejected: number;
  total_hold: number;
  in_process?: number;
};

type FormState = {
  employee_name: string;
  code: string;
  manager_tl: string;
  total_logins: string;
  total_rejected: string;
  total_hold: string;
};

const emptyForm: FormState = {
  employee_name: "",
  code: "",
  manager_tl: "",
  total_logins: "",
  total_rejected: "",
  total_hold: "",
};

export default function TodayLoginPage() {
  const today = new Date().toISOString().slice(0, 10);

  const [loading, setLoading] = useState(false);
  const [listLoading, setListLoading] = useState(false);
  const [rows, setRows] = useState<TodayLoginRow[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [selectedDate, setSelectedDate] = useState(today);
  const [form, setForm] = useState<FormState>(emptyForm);

  const handleChange =
    (field: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    resetForm();
  };

  const fetchTodayLogins = async () => {
    try {
      setListLoading(true);

      const company_id =
        localStorage.getItem("company_id") ||
        JSON.parse(localStorage.getItem("user") || "{}")?.company_id || "";

      const res = await api.get("/today-login/list", {
        params: {
          company_id,
          date: selectedDate,
        },
      });

      const data = Array.isArray(res.data) ? res.data : res.data?.data || [];

      setRows(
        data.map((r: any) => ({
          _id: r._id,
          date: r.date,
          employee_name: r.employee_name || "",
          manager_tl: r.manager_tl || "",
          code: r.code || "",
          total_logins: Number(r.total_logins || 0),
          total_rejected: Number(r.total_rejected || 0),
          total_hold: Number(r.total_hold || 0),
          in_process: Math.max(
            0,
            Number(r.total_logins || 0) -
              Number(r.total_rejected || 0) -
              Number(r.total_hold || 0)
          ),
        }))
      );
    } catch (err) {
      console.error(err);
      setRows([]);
    } finally {
      setListLoading(false);
    }
  };

  useEffect(() => {
    fetchTodayLogins();
  }, [selectedDate]);

  const handleSubmit = async () => {
    if (!form.employee_name.trim() || !form.manager_tl.trim()) {
      alert("Employee Name and Manager required");
      return;
    }

    try {
      setLoading(true);

      const company_id =
        localStorage.getItem("company_id") ||
        JSON.parse(localStorage.getItem("user") || "{}")?.company_id || "";

      const payload = {
        date: selectedDate,
        employee_name: form.employee_name.trim(),
        manager_tl: form.manager_tl.trim(),
        code: form.code.trim() || undefined,
        total_logins: Number(form.total_logins || 0),
        total_rejected: Number(form.total_rejected || 0),
        total_hold: Number(form.total_hold || 0),
        company_id,
      };

      if (editingId) {
        await api.patch(`/today-login/${editingId}`, payload);
      } else {
        await api.post("/today-login/create", payload);
      }

      handleCloseDialog();
      await fetchTodayLogins();
    } catch (err) {
      console.error(err);
      alert(editingId ? "Failed to update" : "Failed to save");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (row: TodayLoginRow) => {
    setEditingId(row._id);
    setSelectedDate(row.date);
    setForm({
      employee_name: row.employee_name || "",
      code: row.code || "",
      manager_tl: row.manager_tl || "",
      total_logins: String(row.total_logins ?? ""),
      total_rejected: String(row.total_rejected ?? ""),
      total_hold: String(row.total_hold ?? ""),
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    const ok = window.confirm("Are you sure you want to delete this row?");
    if (!ok) return;

    try {
      setLoading(true);
      await api.delete(`/today-login/${id}`);
      await fetchTodayLogins();
    } catch (err) {
      console.error(err);
      alert("Failed to delete");
    } finally {
      setLoading(false);
    }
  };

  const totals = useMemo(
    () =>
      rows.reduce(
        (acc, r) => ({
          total_logins: acc.total_logins + r.total_logins,
          total_rejected: acc.total_rejected + r.total_rejected,
          total_hold: acc.total_hold + r.total_hold,
          in_process: acc.in_process + (r.in_process || 0),
        }),
        { total_logins: 0, total_rejected: 0, total_hold: 0, in_process: 0 }
      ),
    [rows]
  );

  const summaryCards = [
    {
      label: "Total Logins",
      value: totals.total_logins,
      color: "#1976d2",
      bgcolor: "#e3f2fd",
    },
    {
      label: "Rejected",
      value: totals.total_rejected,
      color: "#d32f2f",
      bgcolor: "#ffebee",
    },
    {
      label: "On Hold",
      value: totals.total_hold,
      color: "#ed6c02",
      bgcolor: "#fff3e0",
    },
    
  ];

  return (
    <Box sx={{ p: 3, bgcolor: "#f5f5f5", minHeight: "100vh" }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
          gap: 2,
          flexWrap: "wrap",
        }}
      >
        <Typography variant="h5" fontWeight={700}>
          Today Login Entry
        </Typography>

        <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
          <TextField
            type="date"
            size="small"
            label="Date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ minWidth: 170 }}
          />

          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => {
              resetForm();
              setDialogOpen(true);
            }}
            sx={{
              borderRadius: 2,
              fontWeight: 600,
              textTransform: "none",
              px: 2.5,
            }}
          >
            New Entry
          </Button>
        </Box>
      </Box>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Showing data for: <b>{selectedDate}</b>
      </Typography>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "repeat(4, 1fr)" },
          gap: 2,
          mb: 3,
        }}
      >
        {summaryCards.map((card) => (
          <Paper
            key={card.label}
            elevation={0}
            sx={{
              p: 2,
              borderRadius: 3,
              border: "1px solid #e0e0e0",
              bgcolor: card.bgcolor,
            }}
          >
            <Typography variant="h4" fontWeight={800} color={card.color}>
              {card.value}
            </Typography>
            <Typography variant="body2" color="text.secondary" fontWeight={500}>
              {card.label}
            </Typography>
          </Paper>
        ))}
      </Box>

      <Paper
        elevation={0}
        sx={{ borderRadius: 3, border: "1px solid #e0e0e0", overflow: "hidden" }}
      >
        {listLoading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
            <CircularProgress />
          </Box>
        ) : rows.length === 0 ? (
          <Box sx={{ py: 6, textAlign: "center" }}>
            <Typography color="text.secondary">
              No entries found for selected date
            </Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: "#fafafa" }}>
                  {[
                    "#",
                    "Date",
                    "Employee",
                    "Code",
                    "Manager / TL",
                    "Logins",
                    "Rejected",
                    "Hold",
                    "Actions",
                  ].map((h) => (
                    <TableCell
                      key={h}
                      align={
                        ["Logins", "Rejected", "Hold", "Actions"].includes(h)
                          ? "center"
                          : "left"
                      }
                      sx={{
                        fontWeight: 700,
                        fontSize: "0.8rem",
                        color: "text.secondary",
                        borderBottom: "2px solid #e0e0e0",
                      }}
                    >
                      {h}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>

              <TableBody>
                {rows.map((row, i) => (
                  <TableRow key={row._id} hover>
                    <TableCell sx={{ color: "text.secondary", fontSize: "0.85rem" }}>
                      {i + 1}
                    </TableCell>

                    <TableCell sx={{ fontSize: "0.85rem" }}>{row.date}</TableCell>

                    <TableCell sx={{ fontWeight: 600, fontSize: "0.85rem" }}>
                      {row.employee_name}
                    </TableCell>

                    <TableCell>
                      {row.code ? (
                        <Chip
                          label={row.code}
                          size="small"
                          sx={{ fontWeight: 600, fontSize: "0.75rem" }}
                        />
                      ) : (
                        <Typography color="text.disabled" fontSize="0.85rem">
                          —
                        </Typography>
                      )}
                    </TableCell>

                    <TableCell sx={{ fontSize: "0.85rem" }}>{row.manager_tl}</TableCell>

                    <TableCell align="center">
                      <Chip
                        size="small"
                        label={row.total_logins}
                        sx={{ bgcolor: "#e3f2fd", color: "#1565c0", fontWeight: 700 }}
                      />
                    </TableCell>

                    <TableCell align="center">
                      <Chip
                        size="small"
                        label={row.total_rejected}
                        sx={{ bgcolor: "#ffebee", color: "#c62828", fontWeight: 700 }}
                      />
                    </TableCell>

                    <TableCell align="center">
                      <Chip
                        size="small"
                        label={row.total_hold}
                        sx={{ bgcolor: "#fff3e0", color: "#e65100", fontWeight: 700 }}
                      />
                    </TableCell>

                    <TableCell align="center">
                      <Box sx={{ display: "flex", justifyContent: "center", gap: 1 }}>
                        <Tooltip title="Edit">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => handleEdit(row)}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>

                        <Tooltip title="Delete">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDelete(row._id)}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontWeight: 700,
            pb: 1,
          }}
        >
          {editingId ? "Update Today Login" : "New Today Login"}

          <IconButton onClick={handleCloseDialog} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
            <TextField
              type="date"
              label="Date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              size="small"
              fullWidth
            />

            <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
              <TextField
                label="Employee Name"
                value={form.employee_name}
                onChange={handleChange("employee_name")}
                size="small"
                fullWidth
              />
              <TextField
                label="Code (optional)"
                value={form.code}
                onChange={handleChange("code")}
                size="small"
                fullWidth
              />
            </Box>

            <TextField
              label="Manager / TL"
              value={form.manager_tl}
              onChange={handleChange("manager_tl")}
              size="small"
              fullWidth
            />

            <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 2 }}>
              <TextField
                label="Total Logins"
                type="number"
                value={form.total_logins}
                onChange={handleChange("total_logins")}
                size="small"
                fullWidth
              />
              <TextField
                label="Total Rejected"
                type="number"
                value={form.total_rejected}
                onChange={handleChange("total_rejected")}
                size="small"
                fullWidth
              />
              <TextField
                label="Total Hold"
                type="number"
                value={form.total_hold}
                onChange={handleChange("total_hold")}
                size="small"
                fullWidth
              />
            </Box>
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
          <Button
            onClick={handleCloseDialog}
            variant="outlined"
            sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600 }}
          >
            Cancel
          </Button>

          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={loading}
            sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600, px: 3 }}
          >
            {loading ? (
              <CircularProgress size={18} color="inherit" />
            ) : editingId ? (
              "Update Entry"
            ) : (
              "Save Entry"
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
