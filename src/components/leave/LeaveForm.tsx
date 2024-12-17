import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Checkbox,
  CircularProgress,
  FormControl,
  FormControlLabel,
  FormHelperText,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
  Paper,
  Container,
  Tooltip
} from '@mui/material';
import {
  Close as CloseIcon,
  EventNote as CalendarIcon,
  Person as EmployeeIcon,
  AssignmentTurnedIn as LeaveTypeIcon,
  Description as ApplicationIcon,

  CheckCircle as SubmitIcon,
  EmojiObjects as ReasonIcon
} from '@mui/icons-material';
import { AccessTime as HalfDayIcon, AccessTime } from '@mui/icons-material';

import { toast } from 'react-toastify';
import { useDispatch } from 'react-redux';
import { fetchLeaves } from '../../redux/features/leaves/leavesSlice';

const AddLeavesForm = ({
  handleClose,
  leave,
  leaves,
  userRole,
  userId,
  employees,
  page,
  limit,
  month,
  year,
  selectedKeyword
}) => {
  const [formData, setFormData] = useState({
    employee: '',
    start_date: '',
    end_date: '',
    status: 'Pending',
    application: '',
    reason: '',
    type: '',
    day: '',
    half_day_period: null
  });

  const [errors, setErrors] = useState({
    employee: '',
    start_date: '',
    end_date: '',
    status: '',
    application: '',
    reason: '',
    type: '',
    day: '',
    half_day_period: ''
  });

  const [isHalfDay, setIsHalfDay] = useState(false);
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();

  useEffect(() => {
    if (leave) {
      const foundLeave = leaves.find(employee =>
        employee.leaves.find(ass => ass._id === leave)
      )
      const selected = foundLeave.leaves.find(l => l._id === leave);

      if (selected) {
        setFormData({
          employee: selected.employee._id,
          start_date: selected.start_date,
          end_date: selected.end_date,
          status: selected.status,
          application: selected.application,
          reason: selected.reason || '',
          type: selected.type,
          day: selected.day ? selected.day : calculateDaysDifference(selected.start_date, selected.end_date),
          half_day_period: selected.day === "0.5" ? selected.half_day_period : null
        });

        if (selected.day === "0.5") {
          setIsHalfDay(true);
        }
      }
    } else if (userRole !== '1') {
      setFormData(prevState => ({
        ...prevState,
        employee: userId
      }));
    }
  }, [leave, leaves, userRole, userId]);

  const validateForm = () => {
    let isValid = true;
    const newErrors = {};

    const requiredFields = ['employee', 'start_date', 'status', 'application', 'type', 'day'];

    requiredFields.forEach(field => {
      if (!formData[field] || formData[field].trim() === '') {
        newErrors[field] = `${field.replace('_', ' ').toUpperCase()} is required`;
        isValid = false;
      }
    });

    if (isHalfDay && (!formData.half_day_period || formData.half_day_period.trim() === '')) {
      newErrors.half_day_period = 'Half-day period is required';
      isValid = false;
    }

    setErrors(newErrors);

    return isValid;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData(prevState => {
      const updatedFormData = { ...prevState, [name]: value };

      if (name === 'start_date' || name === 'end_date') {
        const days = calculateDaysDifference(updatedFormData.start_date, updatedFormData.end_date);

        updatedFormData.day = isHalfDay ? '0.5' : days.toString();
      }

      return updatedFormData;
    });
  };

  const calculateDaysDifference = (start, end) => {
    if (start && end) {
      const startDate = new Date(start);
      const endDate = new Date(end);
      const differenceInTime = endDate.getTime() - startDate.getTime();
      const differenceInDays = Math.ceil(differenceInTime / (1000 * 3600 * 24)) + 1;

      return differenceInDays === 0 ? 1 : differenceInDays;
    }

    return 0;
  };

  const handleHalfDayChange = (e) => {
    const checked = e.target.checked;

    setIsHalfDay(checked);

    if (checked) {
      setFormData(prevState => ({
        ...prevState,
        day: '0.5',
        half_day_period: ''
      }));
    } else {
      setFormData(prevState => {
        const days = calculateDaysDifference(prevState.start_date, prevState.end_date);

        return {
          ...prevState,
          day: days.toString(),
          half_day_period: null
        };
      });
    }
  };

  const handleSubmit = () => {
    if (validateForm()) {
      setLoading(true);

      const leaveData = { ...formData };

      if (!isHalfDay) {
        delete leaveData.half_day_period;
      }

      const method = leave ? 'PUT' : 'POST';

      const url = leave
        ? `${process.env.NEXT_PUBLIC_APP_URL}/leaves/update/${leave}`
        : `${process.env.NEXT_PUBLIC_APP_URL}/leaves/create`;

      fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(leaveData),
      })
        .then(response => response.json())
        .then(data => {
          if (data.message) {
            toast[data.message.includes('success') ? 'success' : 'error'](data.message, {
              position: 'top-center',
            });
          } else {
            toast.error('Unexpected error occurred', {
              position: 'top-center',
            });
          }

          handleClose();
          dispatch(fetchLeaves({ page, limit, month, year, keyword: selectedKeyword }));
        })
        .catch(error => {
          console.error('Error:', error);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  };

  const filteredEmployees = userRole !== '1' ? employees.filter(emp => emp._id === userId) : employees;

  return (
    <Container maxWidth="md">
      <Paper
        elevation={3}
        sx={{
          padding: 3,
          borderRadius: 2,
          backgroundColor: '#f5f5f5'
        }}
      >
        <Box display='flex' justifyContent='space-between' alignItems='center' mb={3}>
          <Typography
            variant='h4'
            color="primary"
            sx={{
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}
          >
            <LeaveTypeIcon />
            {leave ? 'Edit Leave' : 'Add Leave'}
          </Typography>
          <Box display="flex" alignItems="center">
            <Tooltip title="Click here to apply for half-day leave" arrow>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={isHalfDay}
                    onChange={handleHalfDayChange}
                    name="halfDay"
                    color="primary"
                    icon={<HalfDayIcon />}
                    checkedIcon={<HalfDayIcon color="primary" />}
                  />
                }
                label="Half-day Leave"
              />
            </Tooltip>
            <IconButton onClick={handleClose} color="error">
              <CloseIcon />
            </IconButton>
          </Box>

        </Box>

        <Grid container spacing={3}>
          {Number(userRole) < 3 && (
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required variant="outlined">
                <InputLabel required>Employee</InputLabel>
                <Select
                  label='Select Employee'
                  name="employee"
                  value={formData.employee}
                  onChange={handleChange}
                  required
                  error={!!errors.employee}
                  disabled={userRole !== '1'}
                  startAdornment={<EmployeeIcon color="action" />}
                >
                  {filteredEmployees.map((employee) => (
                    <MenuItem key={employee._id} value={employee._id}>
                      {employee.first_name} {employee.last_name}
                    </MenuItem>
                  ))}
                </Select>
                {errors.employee && <FormHelperText error>{errors.employee}</FormHelperText>}
              </FormControl>
            </Grid>
          )}

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label='Start Date'
              name='start_date'
              value={formData.start_date}
              type='date'
              onChange={handleChange}
              InputLabelProps={{ shrink: true }}
              required
              error={!!errors.start_date}
              helperText={errors.start_date}
              variant="outlined"
              InputProps={{
                startAdornment: <CalendarIcon color="action" />
              }}
            />
          </Grid>

          {!isHalfDay && (
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label='End Date'
                name='end_date'
                type='date'
                value={formData.end_date}
                onChange={handleChange}
                InputLabelProps={{ shrink: true }}
                variant="outlined"
                InputProps={{
                  startAdornment: <CalendarIcon color="action" />
                }}
              />
            </Grid>
          )}

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label='Day'
              name='day'
              value={formData.day}
              type='text'
              InputProps={{
                readOnly: true,
                startAdornment: <AccessTime color="action" />
              }}
              InputLabelProps={{ shrink: true }}
              required
              error={!!errors.day}
              helperText={errors.day}
              variant="outlined"
            />
          </Grid>

          {isHalfDay && (
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required error={!!errors.half_day_period} variant="outlined">
                <InputLabel required>Half-day Period</InputLabel>
                <Select
                  label="Select Half-day Period"
                  name="half_day_period"
                  value={formData.half_day_period}
                  onChange={handleChange}
                  startAdornment={<HalfDayIcon color="action" />}
                >
                  <MenuItem value="First Half">First Half</MenuItem>
                  <MenuItem value="Second Half">Second Half</MenuItem>
                </Select>
                {errors.half_day_period && <Typography color="error">{errors.half_day_period}</Typography>}
              </FormControl>
            </Grid>
          )}

          <Grid item xs={12} md={6}>
            <FormControl fullWidth required error={!!errors.type} variant="outlined">
              <InputLabel required>Type</InputLabel>
              <Select
                label='Select Type'
                name='type'
                value={formData.type}
                onChange={handleChange}
                startAdornment={<LeaveTypeIcon color="action" />}
              >
                <MenuItem value='Annual'>ANNUAL</MenuItem>
                <MenuItem value='Sick'>SICK</MenuItem>
                <MenuItem value='Unpaid'>UNPAID</MenuItem>
                <MenuItem value='Casual'>CASUAL</MenuItem>
                <MenuItem value='Complimentary'>COMPLIMENTARY</MenuItem>
                <MenuItem value='Maternity'>MATERNITY</MenuItem>
                <MenuItem value='Others'>OTHERS</MenuItem>
              </Select>
              {errors.type && <Typography color="error">{errors.type}</Typography>}
            </FormControl>
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControl fullWidth error={!!errors.application}>
              <InputLabel shrink>Application</InputLabel>
              <Box
                component="textarea"
                name="application"
                value={formData.application}
                onChange={handleChange}
                rows={4} // Adjust rows for height
                placeholder="Enter your application here"
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  fontSize: '16px',
                  fontFamily: 'inherit',
                  outline: 'none',
                  resize: 'vertical', // Allow vertical resizing
                }}
              />
              {errors.application && (
                <FormHelperText>{errors.application}</FormHelperText>
              )}
            </FormControl>

          </Grid>

          {leave && (
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label='Reason for Approval/Rejection'
                name='reason'
                value={formData.reason}
                onChange={handleChange}
                required
                error={!!errors.reason}
                helperText={errors.reason}
                variant="outlined"
                InputProps={{
                  startAdornment: <ReasonIcon color="action" />
                }}
              />
            </Grid>
          )}

          {leave && (
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required error={!!errors.status} variant="outlined">
                <InputLabel required>Status</InputLabel>
                <Select
                  label='Select Status'
                  name='status'
                  value={formData.status}
                  onChange={handleChange}
                  disabled={userRole !== '1'}
                >
                  <MenuItem value='Pending'>Pending</MenuItem>
                  <MenuItem value='Approved'>Approved</MenuItem>
                  <MenuItem value='Rejected'>Rejected</MenuItem>
                </Select>
                {errors.status && <Typography color="error">{errors.status}</Typography>}
              </FormControl>
            </Grid>
          )}


          <Grid item xs={12} display="flex" justifyContent="center">
            <Button
              variant='contained'
              color="primary"
              onClick={handleSubmit}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={24} color="inherit" /> : <SubmitIcon />}
              sx={{
                fontSize: '16px',
                fontWeight: 600,
                padding: '12px 24px',
                borderRadius: 2
              }}
            >
              {loading ? 'Processing...' : (leave ? 'UPDATE LEAVE' : 'ADD LEAVE')}
            </Button>
          </Grid>
        </Grid>
      </Paper>
    </Container>
  );
};

export default AddLeavesForm;
