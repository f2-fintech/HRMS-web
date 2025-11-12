'use client';

import React, { useEffect, useState, ChangeEvent } from 'react';
import {
  Box, Button, Grid, TextField, Typography, IconButton,
  FormControl, CircularProgress, Paper, Container, Autocomplete, InputAdornment
} from '@mui/material';
import {
  Close as CloseIcon,
  CheckCircle as CheckCircleIcon,
  AssignmentLate as AssignmentLateIcon,
  Person as PersonIcon,
  DateRange as DateRangeIcon,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { useDispatch } from 'react-redux';
import type { AppDispatch } from '@/redux/store';
import { createPerformance, updatePerformance } from '@/redux/features/performances/performanceSlice';
import { apiResponse } from '@/utility/apiResponse/employeesResponse';
import dayjs from 'dayjs';

type Emp = { _id: string; first_name: string; last_name: string; image?: string };

interface AdminPerformanceFormProps {
  handleClose: () => void;
  performanceId?: string | null;
  prefillDate?: string;
  performances?: any[];
}

const AdminPerformanceForm: React.FC<AdminPerformanceFormProps> = ({
  handleClose, performanceId = null, prefillDate = '', performances = []
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const [isLoading, setIsLoading] = useState(false);

  const localUser =
    typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || '{}') : {};
  const company_id = localUser?.company_id;

  const [employees, setEmployees] = useState<Emp[]>([]);
  const [empLoading, setEmpLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const list = await apiResponse();
        setEmployees(Array.isArray(list) ? list : []);
      } catch (e) {
        console.error(e);
      } finally {
        setEmpLoading(false);
      }
    })();
  }, []);

  // -------------------- helpers: safe extractors --------------------
  const getStr = (v: any) => (v == null ? '' : String(v));
  const num = (v: any) => (v == null || v === '' ? 0 : Number(v) || 0);

  const pickEmployeeId = (s: any): string => {
    // priority: embedded object _id → string in employee → owner_id → employee_id
    if (s?.employee?._id) return String(s.employee._id);
    if (typeof s?.employee === 'string') return s.employee;
    if (s?.owner_id) return String(s.owner_id);
    if (s?.employee_id) return String(s.employee_id);
    return '';
  };

  const pickDate = (s: any): string => {
    const d = s?.date ? dayjs(s.date) : null;
    return d && d.isValid() ? d.format('YYYY-MM-DD') : '';
  };

  // derive a good task title if backend snapshot lacks flat taskTitle
  const deriveTitle = (s: any): string => {
    if (s?.taskTitle) return String(s.taskTitle);
    const role = s?.role || '';
    const dateStr = pickDate(s);
    if (role === 'employee') {
      return `RE Snapshot — ${dateStr || ''}`.trim();
    }
    if (role === 'manager') {
      return `Manager Snapshot — ${dateStr || ''}`.trim();
    }
    return 'Snapshot';
  };

  // derive target/completed from nested structures when flat fields missing
  const deriveTargetCompleted = (s: any): { target: number; completed: number } => {
    // 1) flat case — if target/completed already exist
    if (s?.target != null || s?.completed != null) {
      return { target: num(s.target), completed: num(s.completed) };
    }

    // 2) employee nested
    if (s?.role === 'employee') {
      const exp = s?.re?.morning || {};
      const done = s?.re?.evening || {};

      const targetLogins = num(exp.expectedLogins);
      const doneLogins   = num(done.loginsDone);

      const targetApprovals = num(exp.expectedApprovals);
      const doneApprovals   = num(done.approvalsDone);

      const targetDisb = num(exp.expectedDisbursal);
      const doneDisb   = num(done.disbursalDone);

      const targetPhone = num(exp.phoneConnects);
      const donePhone   = num(done.phoneConnectsDone);

      const targetMeet = num(exp.physicalMeet);
      const doneMeet   = num(done.physicalMeetDone);

      // priority
      if (targetLogins || doneLogins) return { target: targetLogins, completed: doneLogins };
      if (targetApprovals || doneApprovals) return { target: targetApprovals, completed: doneApprovals };
      if (targetDisb || doneDisb) return { target: targetDisb, completed: doneDisb };
      if (targetPhone || donePhone) return { target: targetPhone, completed: donePhone };
      if (targetMeet || doneMeet) return { target: targetMeet, completed: doneMeet };

      return { target: 0, completed: 0 };
    }

    // 3) manager nested
    if (s?.role === 'manager') {
      const mExp = s?.manager?.morning?.expected || {};
      const mEve = s?.manager?.evening || {};

      const targetLogins = num(mExp.logins);
      const teamLogins   = num(mEve.teamLoginsDone);

      const targetApprovals = num(mExp.approvals);
      const approvalsAmt    = num(mEve.teamApprovalDoneAmount);

      const targetDisb = num(mExp.disbursal);
      // (evening disbursal amount not present in your schema—adjust if you add it)

      if (targetLogins || teamLogins) return { target: targetLogins, completed: teamLogins };
      if (targetApprovals || approvalsAmt) return { target: targetApprovals, completed: approvalsAmt };
      if (targetDisb) return { target: targetDisb, completed: 0 };

      return { target: 0, completed: 0 };
    }

    return { target: 0, completed: 0 };
  };

  // -------------------- form state --------------------
  const [formData, setFormData] = useState({
    employee: '',
    date: prefillDate || '',
    taskTitle: '',
    description: '',
    target: '',
    completed: '',
    goodPart: '',
    blockers: '',
  });

  const [errors, setErrors] = useState({ employee: '', date: '', taskTitle: '', target: '' });

  // -------------------- EDIT: prefill from selected performance --------------------
  useEffect(() => {
    if (!performanceId) return;

    const selected = performances.find((p) => p?._id === performanceId);
    if (!selected) return;

    // try to use "card-mapped" flat values if present, else derive from nested/raw
    const raw = selected.__raw || selected;

    const employeeId = pickEmployeeId(selected) || pickEmployeeId(raw);
    const dateStr    = pickDate(selected) || pickDate(raw) || prefillDate || '';
    const title      = getStr(selected.taskTitle) || deriveTitle(raw);
    const description= getStr(selected.description || '');

    const { target, completed } =
      (selected.target != null || selected.completed != null)
        ? { target: num(selected.target), completed: num(selected.completed) }
        : deriveTargetCompleted(raw);

    const goodPart   = getStr(selected.goodPart || raw?.manager?.evening?.topPerformer?.name || '');
    const blockers   = getStr(selected.blockers || (raw?.manager?.evening?.filesStuck || []).join(', '));

    setFormData({
      employee: employeeId,
      date: dateStr,
      taskTitle: title,
      description,
      target: String(target || ''),
      completed: String(completed || ''),
      goodPart,
      blockers,
    });
  }, [performanceId, performances, prefillDate]);

  // -------------------- validations --------------------
  const validate = () => {
    const e: any = {};
    if (!formData.employee) e.employee = 'Employee is required';
    if (!formData.date) e.date = 'Date is required';
    if (!formData.taskTitle) e.taskTitle = 'Task title is required';
    if (formData.target === '') e.target = 'Target is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // -------------------- handlers --------------------
  const onChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
  };

  const onSubmit = async () => {
    if (!validate()) return;
    setIsLoading(true);

    const target = num(formData.target);
    const completed = num(formData.completed);
    const remaining = Math.max(target - completed, 0);
    const status =
      completed >= target ? 'done' : completed > 0 ? 'in_progress' : 'planned';

    const payload = {
      employee: formData.employee,
      date: formData.date,
      taskTitle: formData.taskTitle,
      description: formData.description || undefined,
      target,
      completed,
      remaining,
      goodPart: formData.goodPart || undefined,
      blockers: formData.blockers || undefined,
      company_id,
      status,
    };

    try {
      if (performanceId) {
        await dispatch(updatePerformance({ id: performanceId, body: payload })).unwrap();
        toast.success('Performance updated');
      } else {
        await dispatch(createPerformance(payload)).unwrap();
        toast.success('Performance created');
      }
      handleClose();
    } catch (err: any) {
      toast.error(err?.message || 'Action failed');
    } finally {
      setIsLoading(false);
    }
  };

  const selectedEmp = employees.find((e) => e._id === formData.employee) || null;

  return (
    <Container sx={{ width: 'fit-content', margin: 'auto' }}>
      <Paper elevation={6} sx={{ p: 4, borderRadius: 3, backgroundColor: '#f5f5f5', position: 'relative', width: '100%' }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4" sx={{ display: 'flex', alignItems: 'center', fontWeight: 'bold', color: '#333' }}>
            {performanceId ? 'Update Performance' : 'Add Performance'}
            {performanceId ? <AssignmentLateIcon sx={{ ml: 2, color: '#ff902f' }} /> : <CheckCircleIcon sx={{ ml: 2, color: '#4caf50' }} />}
          </Typography>
          <IconButton
            onClick={handleClose}
            sx={{ position: 'absolute', top: 16, right: 16, color: '#ff4d4d', backgroundColor: '#fff3f3', '&:hover': { backgroundColor: '#ffebee' } }}
          >
            <CloseIcon />
          </IconButton>
        </Box>

        <Grid container spacing={3}>
          {/* Date */}
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Date"
              name="date"
              type="date"
              value={formData.date}
              onChange={onChange}
              InputLabelProps={{ shrink: true }}
              required
              error={!!errors.date}
              helperText={errors.date}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <DateRangeIcon sx={{ color: '#666' }} />
                  </InputAdornment>
                ),
              }}
              sx={{ '& .MuiOutlinedInput-root': { backgroundColor: '#fff', borderRadius: 2 } }}
            />
          </Grid>

          {/* Employee Autocomplete */}
          <Grid item xs={12} md={6}>
            <FormControl fullWidth required error={!!errors.employee}>
              <Autocomplete
                options={employees}
                loading={empLoading}
                getOptionLabel={(o) => `${o.first_name || ''} ${o.last_name || ''}`.trim()}
                value={selectedEmp}
                onChange={(_, v) => setFormData((p) => ({ ...p, employee: v ? (v as Emp)._id : '' }))}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Select Employee"
                    required
                    error={!!errors.employee}
                    helperText={errors.employee}
                    InputProps={{
                      ...params.InputProps,
                      startAdornment: (
                        <InputAdornment position="start">
                          <PersonIcon sx={{ color: '#666' }} />
                        </InputAdornment>
                      ),
                    }}
                    sx={{ '& .MuiOutlinedInput-root': { backgroundColor: '#fff', borderRadius: 2 } }}
                  />
                )}
              />
            </FormControl>
          </Grid>

          {/* Title & Description */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Task Title"
              name="taskTitle"
              value={formData.taskTitle}
              onChange={onChange}
              error={!!errors.taskTitle}
              helperText={errors.taskTitle}
              sx={{ '& .MuiOutlinedInput-root': { backgroundColor: '#fff', borderRadius: 2 } }}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Task Description"
              name="description"
              value={formData.description}
              onChange={onChange}
              multiline
              rows={3}
              sx={{ '& .MuiOutlinedInput-root': { backgroundColor: '#fff', borderRadius: 2 } }}
            />
          </Grid>

          {/* Numbers */}
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Target"
              name="target"
              type="number"
              value={formData.target}
              onChange={onChange}
              error={!!errors.target}
              helperText={errors.target}
              sx={{ '& .MuiOutlinedInput-root': { backgroundColor: '#fff', borderRadius: 2 } }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Completed (Evening)"
              name="completed"
              type="number"
              value={formData.completed}
              onChange={onChange}
              sx={{ '& .MuiOutlinedInput-root': { backgroundColor: '#fff', borderRadius: 2 } }}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Good Part"
              name="goodPart"
              value={formData.goodPart}
              onChange={onChange}
              sx={{ '& .MuiOutlinedInput-root': { backgroundColor: '#fff', borderRadius: 2 } }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Blockers / Issues"
              name="blockers"
              value={formData.blockers}
              onChange={onChange}
              sx={{ '& .MuiOutlinedInput-root': { backgroundColor: '#fff', borderRadius: 2 } }}
            />
          </Grid>

          {/* Submit */}
          <Grid item xs={12} display="flex" justifyContent="center">
            <Button
              variant="contained"
              onClick={onSubmit}
              disabled={isLoading}
              sx={{
                fontSize: '16px', fontWeight: 600, color: 'white', p: '12px 24px',
                backgroundColor: '#ff902f', borderRadius: 2,
                '&:hover': { backgroundColor: '#ff7b21' },
                '&.Mui-disabled': { backgroundColor: '#ffc107', color: 'rgba(255,255,255,0.7)' },
              }}
            >
              {isLoading ? <CircularProgress size={24} color="inherit" /> : (performanceId ? 'UPDATE PERFORMANCE' : 'ADD PERFORMANCE')}
            </Button>
          </Grid>
        </Grid>
      </Paper>
    </Container>
  );
};

export default AdminPerformanceForm;
