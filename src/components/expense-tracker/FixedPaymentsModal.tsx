'use client';
import React, { useEffect, useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Stack, IconButton, Table, TableBody, TableCell, TableHead, TableRow, Checkbox, FormControlLabel, Chip } from '@mui/material';

const API_BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:5500';

export default function FixedPaymentsModal({ open, onClose }: { open: boolean, onClose: () => void }) {
  const [reminders, setReminders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({ title: '', amount: '', dueDate: '', emails: '', isRecurring: false, notes: '', status: 'Pending' });
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    if (open) fetchReminders();
  }, [open]);

  const fetchReminders = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/payment-reminders`);
      const data = await res.json();
      if (Array.isArray(data)) setReminders(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const payload = {
        ...form,
        amount: Number(form.amount),
        emails: form.emails.split(',').map(e => e.trim()).filter(Boolean)
      };

      if (editingId) {
        await fetch(`${API_BASE_URL}/payment-reminders/${editingId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } else {
        await fetch(`${API_BASE_URL}/payment-reminders`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }
      setForm({ title: '', amount: '', dueDate: '', emails: '', isRecurring: false, notes: '', status: 'Pending' });
      setEditingId(null);
      fetchReminders();
    } catch (e) {
      console.error(e);
    }
  };

  const handleEdit = (r: any) => {
    setEditingId(r._id);
    setForm({
      title: r.title || '',
      amount: String(r.amount || ''),
      dueDate: r.dueDate ? r.dueDate.split('T')[0] : '',
      emails: (r.emails || []).join(', '),
      isRecurring: r.isRecurring || false,
      notes: r.notes || '',
      status: r.status || 'Pending'
    });
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this reminder?')) return;
    try {
      await fetch(`${API_BASE_URL}/payment-reminders/${id}`, { method: 'DELETE' });
      fetchReminders();
    } catch (e) {
      console.error(e);
    }
  };

  const handleTriggerEmail = async (id: string) => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/payment-reminders/${id}/remind`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        alert('Email sent successfully!');
      } else {
        alert('Failed to send email: ' + data.message);
      }
    } catch (e) {
      console.error(e);
      alert('Error triggering email.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Fixed Payments & Reminders</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2} mb={4} p={2} border="1px solid #eee" borderRadius={2}>
          <h4>{editingId ? 'Edit Reminder' : 'Add New Reminder'}</h4>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField label="Title (e.g. Rent)" size="small" fullWidth value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
            <TextField label="Amount" type="number" size="small" fullWidth value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} />
            <TextField label="Due Date" type="date" size="small" fullWidth InputLabelProps={{ shrink: true }} value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} />
          </Stack>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField label="Emails (comma separated)" size="small" fullWidth value={form.emails} onChange={e => setForm({ ...form, emails: e.target.value })} />
            <TextField label="Notes" size="small" fullWidth value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
          </Stack>
          <Stack direction="row" spacing={2} alignItems="center">
            <FormControlLabel control={<Checkbox checked={form.isRecurring} onChange={e => setForm({ ...form, isRecurring: e.target.checked })} />} label="Recurring Monthly?" />
            <TextField select SelectProps={{ native: true }} size="small" label="Status" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
              <option value="Pending">Pending</option>
              <option value="Paid">Paid</option>
            </TextField>
            <Button variant="contained" onClick={handleSave} disabled={!form.title || !form.dueDate || !form.amount}>Save</Button>
            {editingId && <Button variant="outlined" onClick={() => { setEditingId(null); setForm({ title: '', amount: '', dueDate: '', emails: '', isRecurring: false, notes: '', status: 'Pending' }); }}>Cancel</Button>}
          </Stack>
        </Stack>

        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Title</TableCell>
              <TableCell>Amount</TableCell>
              <TableCell>Due Date</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {reminders.map(r => (
              <TableRow key={r._id}>
                <TableCell>{r.title}</TableCell>
                <TableCell>₹{r.amount}</TableCell>
                <TableCell>{new Date(r.dueDate).toLocaleDateString()}</TableCell>
                <TableCell>
                  <Chip size="small" label={r.status} color={r.status === 'Paid' ? 'success' : 'warning'} />
                </TableCell>
                <TableCell>
                  <Button size="small" onClick={() => handleTriggerEmail(r._id)}>Send Mail</Button>
                  <Button size="small" onClick={() => handleEdit(r)}>Edit</Button>
                  <Button size="small" color="error" onClick={() => handleDelete(r._id)}>Delete</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
