import React, { useEffect, useState } from 'react';

import {
  Box, Button, Checkbox, CircularProgress, FormControl, FormControlLabel, FormHelperText, Grid, IconButton, InputLabel, MenuItem, Select, TextField, Typography
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { toast } from 'react-toastify';
import { useDispatch } from 'react-redux';

import { fetchLeaves } from '../../redux/features/leaves/leavesSlice';

const AddLeavesForm = ({ handleClose, leave, leaves, userRole, userId, employees, page, limit, month, year, selectedKeyword }) => {
  const [formData, setFormData] = useState({
    employee: '',
    start_date: '',
    end_date: '',
    status: 'Pending',
    application: '',
    reason: '',
    type: '',
    day: '',
    half_day_period: null // Set half_day_period to null initially
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
          half_day_period: selected.day === "0.5" ? selected.half_day_period : null // Set half_day_period only if half-day
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

    // Always required fields, excluding half_day_period
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

      // Return 1 if start and end dates are the same
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
        day: '0.5', // Automatically set day to 0.5 for half-day leave
        half_day_period: '' // Reset half_day_period
      }));
    } else {
      // Recalculate the number of full days if unchecking
      setFormData(prevState => {
        const days = calculateDaysDifference(prevState.start_date, prevState.end_date);

        return {
          ...prevState,
          day: days.toString(), // Reset to full days
          half_day_period: null // Set half_day_period to null when not half-day leave
        };
      });
    }
  };

  const handleSubmit = () => {
    if (validateForm()) {
      setLoading(true);

      // Prepare the formData, exclude half_day_period if not a half-day leave
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
          setLoading(false); // Stop loading spinner after API call
        });
    }
  };

  const filteredEmployees = userRole !== '1' ? employees.filter(emp => emp._id === userId) : employees;

  return (
    <Box sx={{ flexGrow: 1, padding: 2 }}>
      <Box display='flex' justifyContent='space-between' alignItems='center'>
        <Typography style={{ fontSize: '2em' }} variant='h5' gutterBottom>
          {leave ? 'Edit Leave' : 'Add Leave'}
        </Typography>
        <Box>
          <FormControlLabel
            control={
              <Checkbox
                checked={isHalfDay}
                onChange={handleHalfDayChange}
                name="halfDay"
                color="primary"
              />
            }
            label="Half-day Leave"
          />
          <IconButton onClick={handleClose}>
            <CloseIcon />
          </IconButton>
        </Box>
      </Box>
      <Grid container spacing={2}>
        {Number(userRole) < 3 && (
          <Grid item xs={12} md={6}>
            <FormControl fullWidth required>
              <InputLabel required id='demo-simple-select-label'>Employee</InputLabel>
              <Select
                label='Select Employee'
                labelId='demo-simple-select-label'
                id='demo-simple-select'
                name="employee"
                value={formData.employee}
                onChange={handleChange}
                required
                error={!!errors.employee}
                disabled={userRole !== '1'}
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
            InputProps={{ readOnly: true }}
            InputLabelProps={{ shrink: true }}
            required
            error={!!errors.day}
            helperText={errors.day}
          />
        </Grid>

        {/* Conditionally Render "First Half" or "Second Half" dropdown if isHalfDay is true */}
        {isHalfDay && (
          <Grid item xs={12} md={6}>
            <FormControl fullWidth required error={!!errors.half_day_period}>
              <InputLabel required id="half-day-select-label">Half-day Period</InputLabel>
              <Select
                label="Select Half-day Period"
                labelId="half-day-select-label"
                id="half-day-select"
                name="half_day_period"
                value={formData.half_day_period}
                onChange={handleChange}
              >
                <MenuItem value="First Half">First Half</MenuItem>
                <MenuItem value="Second Half">Second Half</MenuItem>
              </Select>
              {errors.half_day_period && <Typography color="error">{errors.half_day_period}</Typography>}
            </FormControl>
          </Grid>
        )}

        <Grid item xs={12} md={6}>
          <FormControl fullWidth required error={!!errors.type}>
            <InputLabel required id='demo-simple-select-label'>Type</InputLabel>
            <Select
              label='Select Type'
              labelId='demo-simple-select-label'
              id='demo-simple-select'
              name='type'
              value={formData.type}
              onChange={handleChange}
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
          <TextField
            fullWidth
            label='Application'
            name='application'
            value={formData.application}
            onChange={handleChange}
            required
            error={!!errors.application}
            helperText={errors.application}
          />
        </Grid>

        {userRole === '1' && (
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
            />
          </Grid>
        )}
        {Number(userRole) < 3 && (
          <Grid item xs={12} md={6}>
            <FormControl fullWidth required error={!!errors.status}>
              <InputLabel required id='demo-simple-select-label'>Status</InputLabel>
              <Select
                label='Select Status'
                labelId='demo-simple-select-label'
                id='demo-simple-select'
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
        <Grid item xs={12}>
          <Button
            style={{
              fontSize: '18px',
              fontWeight: 600,
              color: 'white',
              padding: 15,
              backgroundColor: '#ff902f',
              width: 200
            }}
            variant='contained'
            fullWidth
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : (leave ? 'UPDATE LEAVE' : 'ADD LEAVE')}
          </Button>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AddLeavesForm;
