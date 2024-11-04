// AddAttendanceForm.js
import React, { useState, useEffect } from 'react';
import { Box, Button, Grid, TextField, Typography, IconButton, FormControl, InputLabel, Select, MenuItem, Autocomplete } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ClearIcon from '@mui/icons-material/Clear';
import { useDispatch } from 'react-redux';
import { toast } from 'react-toastify';
import { addOrUpdateAttendance } from '../../redux/features/attendances/attendancesSlice'; // Adjust import as needed
import { apiResponse } from '@/utility/apiResponse/employeesResponse';

const AddAttendanceForm = ({ handleClose, attendance, prefillEmployee, prefillEmployeeName, prefillDate, attendances }) => {
  const [employees, setEmployees] = useState([]);
  const [formData, setFormData] = useState({
    employee: prefillEmployee || '',
    date: prefillDate || '',
    status: '',
    timeComplete: '',
  });

  const [errors, setErrors] = useState({
    employee: '',
    date: '',
    status: ''
  });

  const dispatch = useDispatch();

  useEffect(() => {
    const fetchEmployees = async () => {
      const data = await apiResponse();

      setEmployees(data);
    };

    fetchEmployees();
  }, []);

  useEffect(() => {
    if (attendance) {
      const selected = attendances.find(attend => attend._id === attendance);

      if (selected) {
        setFormData({
          employee: selected.employee._id,
          date: selected.date,
          status: selected.status,
          timeComplete: selected.timeComplete || '',
        });
      }
    } else if (prefillEmployee && prefillDate) {
      setFormData({
        employee: prefillEmployee,
        date: prefillDate,
        status: '',
        timeComplete: '',
      });
    }
  }, [attendance, attendances, prefillEmployee, prefillDate]);

  const validateForm = () => {
    let isValid = true;

    const newErrors = {
      employee: '',
      date: '',
      status: ''
    };

    if (!formData.employee) {
      newErrors.employee = 'Employee selection is required';
      isValid = false;
    }

    if (!formData.date) {
      newErrors.date = 'Date is required';
      isValid = false;
    }

    if (!formData.status) {
      newErrors.status = 'Status selection is required';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handleSubmit = () => {
    if (validateForm()) {
      const method = attendance ? 'PUT' : 'POST';

      const url = attendance
        ? `${process.env.NEXT_PUBLIC_APP_URL}/attendence/update/${attendance}`
        : `${process.env.NEXT_PUBLIC_APP_URL}/attendence/create`;

      fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
        .then(response => response.json())
        .then(data => {
          if (data.message) {
            if (data.message.includes('success')) {
              dispatch(addOrUpdateAttendance(data));
              toast.success(data.message, { position: 'top-center' });
            } else {
              toast.error('Error: ' + data.message, { position: 'top-center' });
            }
          } else {
            toast.error('Unexpected error occurred', { position: 'top-center' });
          }

          handleClose();
        })
        .catch(error => {
          console.log('Error', error);
        });
    }
  };

  return (
    <Box sx={{ flexGrow: 1, padding: 2 }}>
      <Box display='flex' justifyContent='space-between' alignItems='center'>
        <Typography style={{ fontSize: '2em' }} variant='h5' gutterBottom>
          {attendance ? 'Edit Attendance' : 'Add Attendance'}
        </Typography>
        <IconButton onClick={handleClose}>
          <CloseIcon />
        </IconButton>
      </Box>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label='Date'
            name='date'
            type='date'
            value={formData.date}
            onChange={handleChange}
            InputLabelProps={{ shrink: true }}
            required
            error={!!errors.date}
            helperText={errors.date}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <FormControl fullWidth required error={!!errors.employee}>
            <Autocomplete
              id="employee-autocomplete"
              options={employees}
              getOptionLabel={(option) => `${option.first_name} ${option.last_name}`}
              value={employees.find((emp) => emp._id === formData.employee) || null}
              onChange={(event, newValue) => {
                handleChange({
                  target: {
                    name: 'employee',
                    value: newValue ? newValue._id : '',
                  },
                });
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Select Employee"
                  variant="outlined"
                  required
                  error={!!errors.employee}
                  helperText={errors.employee}
                />
              )}
            />
          </FormControl>
        </Grid>
        <Grid item xs={12} md={6}>
          <FormControl fullWidth required error={!!errors.status}>
            <InputLabel required id='status-label'>Status</InputLabel>
            <Select
              labelId='status-label'
              id='status'
              name='status'
              value={formData.status}
              onChange={handleChange}
            >
              <MenuItem value='Present'>PRESENT</MenuItem>
              <MenuItem value='Absent'>ABSENT</MenuItem>
              <MenuItem value='On Half'>ON_HALF</MenuItem>
              <MenuItem value='On Leave'>ON_LEAVE</MenuItem>
              <MenuItem value='On Field'>ON_FIELD</MenuItem>
              <MenuItem value='On Wfh'>ON_WFH</MenuItem>
            </Select>
            <Typography variant="caption" color="error">{errors.status}</Typography>
          </FormControl>
        </Grid>
        <Grid item xs={12} md={6}>
          <FormControl fullWidth error={!!errors.timeComplete}>
            <InputLabel id="time-complete-label">Time Completion</InputLabel>
            <Select
              labelId="time-complete-label"
              id="timeComplete"
              name="timeComplete"
              value={formData.timeComplete}
              onChange={handleChange}
            >
              <MenuItem value="Not Completed">Not Completed</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12}>
          <Button
            variant='contained'
            fullWidth
            style={{
              fontSize: '18px',
              fontWeight: 600,
              color: 'white',
              padding: 15,
              backgroundColor: '#ff902f',
              width: 250
            }}
            onClick={handleSubmit}
          >
            {attendance ? 'UPDATE ATTENDANCE' : 'ADD ATTENDANCE'}
          </Button>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AddAttendanceForm;
