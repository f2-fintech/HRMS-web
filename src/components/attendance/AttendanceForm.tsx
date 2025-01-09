import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Grid,
  TextField,
  Typography,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Autocomplete,
  CircularProgress,
  Paper,
  Container
} from '@mui/material';
import {
  Close as CloseIcon,
  Person as PersonIcon,
  DateRange as DateRangeIcon,
  CheckCircle as CheckCircleIcon,
  AssignmentLate as AssignmentLateIcon
} from '@mui/icons-material';
import { useDispatch } from 'react-redux';
import { toast } from 'react-toastify';
import { addOrUpdateAttendance } from '../../redux/features/attendances/attendancesSlice';
import { apiResponse } from '@/utility/apiResponse/employeesResponse';

const AddAttendanceForm = ({ handleClose, attendance, prefillEmployee, prefillEmployeeName, prefillDate, attendances }) => {
  const { company_id } = typeof window !== "undefined" ? JSON.parse(localStorage.getItem('user')) : {};

  const [employees, setEmployees] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    employee: prefillEmployee || '',
    date: prefillDate || '',
    status: '',
    timeComplete: '',
    company_id: company_id
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
          company_id: selected.company_id
        });
      }
    } else if (prefillEmployee && prefillDate) {
      setFormData({
        employee: prefillEmployee,
        date: prefillDate,
        status: '',
        timeComplete: '',
        company_id: company_id
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
      setIsLoading(true);
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
            if (data.message.includes('already marked')) {
              // Handle duplicate attendance case
              toast.warning(data.message, { position: 'top-center' });
            } else if (data.message.includes('success')) {
              // Handle successful creation or update
              dispatch(addOrUpdateAttendance(data));
              toast.success(data.message, { position: 'top-center' });
            } else {
              // Handle other errors
              toast.error('Error: ' + data.message, { position: 'top-center' });
            }
          } else {
            toast.error('Unexpected error occurred', { position: 'top-center' });
          }

          handleClose();
        })
        .catch(error => {
          console.error('Error:', error);
          toast.error('An error occurred while submitting the form', { position: 'top-center' });
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  };


  return (
    <Container sx={{ width: 'fit-content', margin: 'auto' }}>
      <Paper elevation={6} sx={{
        p: 4,
        borderRadius: 3,
        backgroundColor: '#f5f5f5',
        position: 'relative',
        width: '100%',


      }}>
        <Box display='flex' justifyContent='space-between' alignItems='center' mb={3}>
          <Typography
            variant='h4'
            sx={{
              display: 'flex',
              alignItems: 'center',
              fontWeight: 'bold',
              color: '#333'
            }}
          >
            {attendance ? 'Edit Attendance' : 'Add Attendance'}
            {attendance ? <AssignmentLateIcon sx={{ ml: 2, color: '#ff902f' }} /> : <CheckCircleIcon sx={{ ml: 2, color: '#4caf50' }} />}
          </Typography>
          <IconButton
            onClick={handleClose}
            sx={{
              position: 'absolute',
              top: 16,
              right: 16,
              color: '#ff4d4d',
              backgroundColor: '#fff3f3',
              '&:hover': {
                backgroundColor: '#ffebee'
              }
            }}
          >
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
              InputProps={{
                startAdornment: <DateRangeIcon sx={{ mr: 2, color: '#666' }} />,
              }}
              required
              error={!!errors.date}
              helperText={errors.date}
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: '#fff',
                  borderRadius: 2
                }
              }}
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
                    InputProps={{
                      ...params.InputProps,
                      startAdornment: <PersonIcon sx={{ mr: 2, color: '#666' }} />,
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: '#fff',
                        borderRadius: 2
                      }
                    }}
                  />
                )}
              />
            </FormControl>
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              select
              fullWidth
              label="Status"
              name="status"
              value={formData.status}
              onChange={handleChange}
              variant="outlined"
              required
              error={!!errors.status}
              helperText={errors.status}
              InputProps={{
                style: { backgroundColor: '#fff', borderRadius: 8 }, // Optional: Rounded border
              }}
            >
              <MenuItem value="Present">PRESENT</MenuItem>
              <MenuItem value="Absent">ABSENT</MenuItem>
              <MenuItem value="On Half">ON_HALF</MenuItem>
              <MenuItem value="On Leave">ON_LEAVE</MenuItem>
              <MenuItem value="On Field">ON_FIELD</MenuItem>
              <MenuItem value="On Wfh">ON_WFH</MenuItem>
            </TextField>

          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              select
              fullWidth
              label="Time Completion"
              id="timeComplete"
              name="timeComplete"
              value={formData.timeComplete}
              onChange={handleChange}
              variant="outlined"
              error={!!errors.timeComplete}
              helperText={errors.timeComplete}
              InputProps={{
                style: { backgroundColor: '#fff', borderRadius: 8 }, // Optional styling
              }}
            >
              <MenuItem value="Not Completed">Not Completed</MenuItem>
            </TextField>
          </Grid>

          <Grid item xs={12} display="flex" justifyContent="center">
            <Button
              variant='contained'
              onClick={handleSubmit}
              disabled={isLoading}
              sx={{
                fontSize: '16px',
                fontWeight: 600,
                color: 'white',
                padding: '12px 24px',
                backgroundColor: '#ff902f',
                borderRadius: 2,
                '&:hover': {
                  backgroundColor: '#ff7b21'
                },
                '&.Mui-disabled': {
                  backgroundColor: '#ffc107',
                  color: 'rgba(255,255,255,0.7)'
                }
              }}
            >
              {isLoading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                attendance ? 'UPDATE ATTENDANCE' : 'ADD ATTENDANCE'
              )}
            </Button>
          </Grid>
        </Grid>
      </Paper>
    </Container>
  );
};

export default AddAttendanceForm;
