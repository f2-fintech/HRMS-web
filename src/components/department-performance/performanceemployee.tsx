'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  Box,
  Paper,
  Stack,
  Typography,
  TextField,
  Button,
  Select,
  MenuItem,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import VisibilityIcon from '@mui/icons-material/Visibility';

import { createTask, deleteTask, fetchTasks, todayISO, updateTask } from './dpApi';

const PRIORITIES = ['Low', 'Medium', 'High'];
const STATUSES = ['Pending', 'In Progress', 'Completed'];

const priorityColor = (p: string) =>
  p === 'High' ? 'error' : p === 'Medium' ? 'warning' : 'default';

const statusColor = (s: string) =>
  s === 'Completed' ? 'success' : s === 'In Progress' ? 'info' : 'default';

const DEFAULT_WIDTHS = {
  date: 140,
  priority: 140,
  task: 420,
  status: 140,
  actions: 90,
};

type ColKey = keyof typeof DEFAULT_WIDTHS;

// ✅ Get current logged-in user's ID
const getMyId = (): string => {
  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return user?._id || user?.id || '';
  } catch {
    return '';
  }
};

export default function TaskSheet() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [dateFilter, setDateFilter] = useState('');

  const [draft, setDraft] = useState({
    date: todayISO(),
    priority: 'High',
    task: '',
    status: 'Pending',
  });
  const [saving, setSaving] = useState(false);

  const [widths, setWidths] = useState<typeof DEFAULT_WIDTHS>(DEFAULT_WIDTHS);
  const resizingCol = useRef<ColKey | null>(null);
  const startX = useRef(0);
  const startWidth = useRef(0);

  const [viewRow, setViewRow] = useState<any | null>(null);

  const onResizeStart = (col: ColKey) => (e: React.MouseEvent) => {
    e.preventDefault();
    resizingCol.current = col;
    startX.current = e.clientX;
    startWidth.current = widths[col];
    document.addEventListener('mousemove', onResizeMove);
    document.addEventListener('mouseup', onResizeEnd);
  };

  const onResizeMove = (e: MouseEvent) => {
    if (!resizingCol.current) return;
    const delta = e.clientX - startX.current;
    const newWidth = Math.max(60, startWidth.current + delta);
    setWidths((prev) => ({ ...prev, [resizingCol.current as ColKey]: newWidth }));
  };

  const onResizeEnd = () => {
    resizingCol.current = null;
    document.removeEventListener('mousemove', onResizeMove);
    document.removeEventListener('mouseup', onResizeEnd);
  };

  const load = async () => {
    try {
      setLoading(true);
      // ✅ owner_id pass karo — sirf apne tasks aayenge
      const owner_id = getMyId();
      const resp = await fetchTasks({
        date: dateFilter || undefined,
        owner_id: owner_id || undefined,
        page: 1,
        limit: 200,
      });
      setRows(resp?.data || []);
    } catch (e) {
      console.error(e);
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateFilter]);

  const addRow = async () => {
    if (!draft.task.trim()) return alert('Task likhna zaroori hai');
    try {
      setSaving(true);
      await createTask({
        date: draft.date,
        task: draft.task.trim(),
        priority: draft.priority,
        status: draft.status,
      });
      setDraft({ date: todayISO(), priority: 'High', task: '', status: 'Pending' });
      load();
    } catch (e: any) {
      alert(`❌ ${e?.message || 'Error adding task'}`);
    } finally {
      setSaving(false);
    }
  };

  const patchRow = async (id: string, payload: Record<string, any>) => {
    setRows((prev) => prev.map((r) => (r._id === id ? { ...r, ...payload } : r)));
    try {
      await updateTask(id, payload);
    } catch (e: any) {
      alert(`❌ ${e?.message || 'Update failed'}`);
      load();
    }
  };

  const removeRow = async (id: string) => {
    if (!confirm('Delete this task?')) return;
    setRows((prev) => prev.filter((r) => r._id !== id));
    try {
      await deleteTask(id);
    } catch (e: any) {
      alert(`❌ ${e?.message || 'Delete failed'}`);
      load();
    }
  };

  const ResizeHandle = ({ col }: { col: ColKey }) => (
    <Box
      onMouseDown={onResizeStart(col)}
      sx={{
        position: 'absolute',
        right: 0,
        top: 0,
        bottom: 0,
        width: '6px',
        cursor: 'col-resize',
        zIndex: 2,
        '&:hover': { bgcolor: 'rgba(255,255,255,0.4)' },
      }}
    />
  );

  const totalWidth = Object.values(widths).reduce((a, b) => a + b, 0);

  return (
    <Box sx={{ p: 2 }}>
      <Paper elevation={0} sx={{ p: 2, borderRadius: 3, border: '1px solid', borderColor: 'divider', mb: 2 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1}>
          <Typography variant="h6" sx={{ fontWeight: 900 }}>
            Daily Task Sheet
          </Typography>

          <Stack direction="row" spacing={1} alignItems="center">
            <TextField
              size="small"
              type="date"
              label="Filter by date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{ minWidth: 180 }}
            />
            <Button size="small" variant="text" onClick={() => setWidths(DEFAULT_WIDTHS)}>
              Reset column sizes
            </Button>
          </Stack>
        </Stack>
      </Paper>

      <Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'auto' }}>
        <Box sx={{ minWidth: totalWidth }}>
          {/* HEADER */}
          <Box sx={{ display: 'flex', bgcolor: '#2e5d4f' }}>
            <Box sx={{ position: 'relative', width: widths.date, px: 1.5, py: 1.2, flexShrink: 0 }}>
              <Typography sx={{ color: '#fff', fontWeight: 800, fontSize: 14 }}>Date</Typography>
              <ResizeHandle col="date" />
            </Box>
            <Box sx={{ position: 'relative', width: widths.priority, px: 1.5, py: 1.2, flexShrink: 0 }}>
              <Typography sx={{ color: '#fff', fontWeight: 800, fontSize: 14 }}>Priority</Typography>
              <ResizeHandle col="priority" />
            </Box>
            <Box sx={{ position: 'relative', width: widths.task, px: 1.5, py: 1.2, flexShrink: 0 }}>
              <Typography sx={{ color: '#fff', fontWeight: 800, fontSize: 14 }}>Task</Typography>
              <ResizeHandle col="task" />
            </Box>
            <Box sx={{ position: 'relative', width: widths.status, px: 1.5, py: 1.2, flexShrink: 0 }}>
              <Typography sx={{ color: '#fff', fontWeight: 800, fontSize: 14 }}>Status</Typography>
              <ResizeHandle col="status" />
            </Box>
            <Box sx={{ width: widths.actions, flexShrink: 0 }} />
          </Box>

          {/* ADD NEW ROW */}
          <Box sx={{ display: 'flex', bgcolor: 'rgba(46,93,79,0.06)', borderBottom: '1px solid', borderColor: 'divider' }}>
            <Box sx={{ width: widths.date, p: 0.75, flexShrink: 0 }}>
              <TextField
                size="small"
                type="date"
                fullWidth
                value={draft.date}
                onChange={(e) => setDraft({ ...draft, date: e.target.value })}
              />
            </Box>
            <Box sx={{ width: widths.priority, p: 0.75, flexShrink: 0 }}>
              <Select
                size="small"
                fullWidth
                value={draft.priority}
                onChange={(e) => setDraft({ ...draft, priority: e.target.value })}
              >
                {PRIORITIES.map((p) => (
                  <MenuItem key={p} value={p}>{p}</MenuItem>
                ))}
              </Select>
            </Box>
            <Box sx={{ width: widths.task, p: 0.75, flexShrink: 0 }}>
              <TextField
                size="small"
                fullWidth
                placeholder="Add Your Task...."
                value={draft.task}
                onChange={(e) => setDraft({ ...draft, task: e.target.value })}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') addRow();
                }}
              />
            </Box>
            <Box sx={{ width: widths.status, p: 0.75, flexShrink: 0 }}>
              <Select
                size="small"
                fullWidth
                value={draft.status}
                onChange={(e) => setDraft({ ...draft, status: e.target.value })}
              >
                {STATUSES.map((s) => (
                  <MenuItem key={s} value={s}>{s}</MenuItem>
                ))}
              </Select>
            </Box>
            <Box sx={{ width: widths.actions, p: 0.75, display: 'flex', alignItems: 'center', flexShrink: 0 }}>
              <Button
                variant="contained"
                size="small"
                startIcon={<SaveIcon />}
                onClick={addRow}
                disabled={saving}
                sx={{ borderRadius: 2, fontWeight: 800, textTransform: 'none', whiteSpace: 'nowrap', minWidth: 0 }}
              >
                Save
              </Button>
            </Box>
          </Box>

          {/* ROWS */}
          {loading ? (
            <Box sx={{ p: 2 }}>
              <Typography color="text.secondary">Loading…</Typography>
            </Box>
          ) : rows.length === 0 ? (
            <Box sx={{ p: 2 }}>
              <Typography color="text.secondary">Not Added Task Yet</Typography>
            </Box>
          ) : (
            rows.map((row) => (
              <Box
                key={row._id}
                sx={{
                  display: 'flex',
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                  '&:hover': { bgcolor: 'rgba(0,0,0,0.03)' },
                }}
              >
                <Box sx={{ width: widths.date, p: 1, flexShrink: 0, display: 'flex', alignItems: 'center' }}>
                  <Typography variant="body2" noWrap>{row.date}</Typography>
                </Box>

                <Box sx={{ width: widths.priority, p: 0.75, flexShrink: 0 }}>
                  <Select
                    size="small"
                    fullWidth
                    value={row.priority || 'Medium'}
                    onChange={(e) => patchRow(row._id, { priority: e.target.value })}
                    renderValue={(v) => (
                      <Chip size="small" label={v as string} color={priorityColor(v as string) as any} />
                    )}
                  >
                    {PRIORITIES.map((p) => (
                      <MenuItem key={p} value={p}>{p}</MenuItem>
                    ))}
                  </Select>
                </Box>

                <Box
                  sx={{
                    width: widths.task,
                    p: 1,
                    flexShrink: 0,
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <Typography
                    variant="body2"
                    noWrap
                    sx={{ cursor: 'pointer', width: '100%' }}
                    onClick={() => setViewRow(row)}
                  >
                    {row.task || '—'}
                  </Typography>
                </Box>

                <Box sx={{ width: widths.status, p: 0.75, flexShrink: 0 }}>
                  <Select
                    size="small"
                    fullWidth
                    value={row.status || 'Pending'}
                    onChange={(e) => patchRow(row._id, { status: e.target.value })}
                    renderValue={(v) => (
                      <Chip size="small" label={v as string} color={statusColor(v as string) as any} />
                    )}
                  >
                    {STATUSES.map((s) => (
                      <MenuItem key={s} value={s}>{s}</MenuItem>
                    ))}
                  </Select>
                </Box>

                <Box sx={{ width: widths.actions, p: 0.75, flexShrink: 0, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <IconButton size="small" color="primary" onClick={() => setViewRow(row)}>
                    <VisibilityIcon fontSize="small" />
                  </IconButton>
                  <IconButton size="small" color="error" onClick={() => removeRow(row._id)}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
              </Box>
            ))
          )}
        </Box>
      </Paper>

      {/* View Task Modal */}
      <Dialog open={!!viewRow} onClose={() => setViewRow(null)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 900 }}>Task Detail</DialogTitle>
        <DialogContent dividers>
          {viewRow && (
            <Stack spacing={2}>
              <Box>
                <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary' }}>Date</Typography>
                <Typography>{viewRow.date}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary' }}>Priority</Typography>
                <Box sx={{ mt: 0.5 }}>
                  <Chip size="small" label={viewRow.priority || 'Medium'} color={priorityColor(viewRow.priority) as any} />
                </Box>
              </Box>
              <Box>
                <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary' }}>Status</Typography>
                <Box sx={{ mt: 0.5 }}>
                  <Chip size="small" label={viewRow.status || 'Pending'} color={statusColor(viewRow.status) as any} />
                </Box>
              </Box>
              <Box>
                <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary' }}>Task</Typography>
                <Typography sx={{ whiteSpace: 'pre-wrap', mt: 0.5 }}>{viewRow.task || '—'}</Typography>
              </Box>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewRow(null)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
