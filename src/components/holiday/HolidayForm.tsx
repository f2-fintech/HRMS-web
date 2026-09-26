import React, { useState, useEffect } from 'react';
import { Box, Grid, TextField, Typography, IconButton, Button } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { toast } from 'react-toastify';
import { utility } from '@/utility';
import { useSettings } from '@/@core/hooks/useSettings';

const AddHolidayForm = ({ handleClose, holiday, holidays, isHalfDay, debouncedFetch }) => {

  const { settings } = useSettings();  // Get current theme mode (dark/light)
  const { capitalizeInput } = utility();

  const { company_id } = typeof window !== "undefined" ? JSON.parse(localStorage.getItem('user')) : {};

  const [formData, setFormData] = useState({
    title: '',
    note: '',
    start_date: new Date().toISOString().split('T')[0],  // Sets today's date
    end_date: '',
    day: '',
    company_id: company_id
  });

  const [errors, setErrors] = useState({
    title: '',
    note: '',
    start_date: '',
    end_date: '',
    day: '',
  });

  useEffect(() => {
    if (holiday) {
      const selected = holidays.find(h => h._id === holiday);

      if (selected) {
        setFormData({
          title: selected.title,
          note: selected.note,
          start_date: selected.start_date,
          end_date: selected.end_date,
          day: selected.day != null
            ? selected.day.toString()
            : calculateDaysDifference(selected.start_date, selected.end_date).toString(),
          company_id: selected.company_id
        });
      }
    }
  }, [holiday, holidays]);

  const validateForm = () => {
    let isValid = true;

    const newErrors = {
      title: '',
      note: '',
      start_date: '',
      end_date: '',
      day: '',
    };

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
      isValid = false;
    }

    if (!formData.start_date) {
      newErrors.start_date = 'Start date is required';
      isValid = false;
    }

    if (!formData.end_date) {
      newErrors.end_date = 'End date is required';
      isValid = false;
    } else if (formData.end_date < formData.start_date) {
      newErrors.end_date = 'End date must be after start date';
      isValid = false;
    }

    if (!formData.note.trim()) {
      newErrors.note = 'Note is required';
      isValid = false;
    }

    if (!formData.day || !formData.day.toString().trim()) {
      newErrors.day = 'Day is required';
      isValid = false;
    }

    setErrors(newErrors);

    return isValid;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData(prevState => {
      const updatedFormData = {
        ...prevState,
        [name]: value
      };

      if (name === 'start_date' || name === 'end_date') {
        // Half-day is decided purely by the isHalfDay flag, not by date equality.
        if (isHalfDay) {
          updatedFormData.day = '0.5';
        } else {
          const days = calculateDaysDifference(updatedFormData.start_date, updatedFormData.end_date);
          updatedFormData.day = days.toString();
        }
      }

      return updatedFormData;
    });
  };

  // Returns the inclusive number of full days between start and end (min 1).
  // Half-day logic is intentionally NOT handled here - it's controlled by the
  // `isHalfDay` flag in handleChange, so same-day selections correctly default
  // to a full day (1) unless the user explicitly marks it as a half day.
  const calculateDaysDifference = (start, end) => {
    if (start && end) {
      const startDate = new Date(start);
      const endDate = new Date(end);

      const differenceInTime = endDate.getTime() - startDate.getTime();
      const differenceInDays = Math.floor(differenceInTime / (1000 * 3600 * 24)) + 1; // inclusive

      return differenceInDays > 0 ? differenceInDays : 1;
    }
    return 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      const method = holiday ? 'PUT' : 'POST';
      const url = holiday ? `${process.env.NEXT_PUBLIC_APP_URL}/holidays/update/${holiday}` : `${process.env.NEXT_PUBLIC_APP_URL}/holidays/create`;

      fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
        .then(response => response.json())
        .then(data => {
          if (data.message) {
            if (data.message.includes('success')) {
              toast.success(data.message, { position: 'top-center' });
            } else {
              toast.error('Error: ' + data.message, { position: 'top-center' });
            }
          } else {
            toast.error('Unexpected error occurred', { position: 'top-center' });
          }

          handleClose();
          debouncedFetch();
        })
        .catch(error => {
          toast.error('Error: ' + error.message, { position: 'top-center' });
        });
    }
  };

  return (
    <Box>
      <Box display='flex' justifyContent='space-between' alignItems='center'>
        <Typography style={{ fontSize: '2em', color: settings.mode === 'dark' ? '#fff' : '#000' }} variant='h5' gutterBottom>
          {holiday ? 'Edit Holiday' : 'Add Holiday'}
        </Typography>
        <IconButton onClick={handleClose}>
          <CloseIcon />
        </IconButton>
      </Box>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label='Title'
            name='title'
            value={formData.title}
            onChange={(e) => capitalizeInput(e, handleChange)}
            required
            error={!!errors.title}
            helperText={errors.title}
            FormHelperTextProps={{ style: { color: 'red' } }}
            sx={{
              backgroundColor: settings.mode === 'dark' ? '#444' : '#fff',
              '& input': {
                color: settings.mode === 'dark' ? '#fff' : '#000',
              },
              '& .MuiOutlinedInput-root': {
                backgroundColor: settings.mode === 'dark' ? '#444' : '#fff',
              },
            }}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="From"
            name="start_date"
            value={formData.start_date}
            type="date"
            onChange={handleChange}
            InputLabelProps={{ shrink: true }}
            required
            error={!!errors.start_date}
            helperText={errors.start_date}
            FormHelperTextProps={{ style: { color: 'red' } }}
            sx={{
              backgroundColor: settings.mode === 'dark' ? '#444' : '#fff',
              '& input': {
                color: settings.mode === 'dark' ? '#fff' : '#000',
              },
              '& .MuiOutlinedInput-root': {
                backgroundColor: settings.mode === 'dark' ? '#444' : '#fff',
              },
            }}
            inputProps={{
              min: new Date().toISOString().split("T")[0] // Prevents selecting past dates
            }}
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="To"
            name="end_date"
            type="date"
            value={formData.end_date}
            onChange={handleChange}
            InputLabelProps={{ shrink: true }}
            required
            error={!!errors.end_date}
            helperText={errors.end_date}
            FormHelperTextProps={{ style: { color: 'red' } }}
            sx={{
              backgroundColor: settings.mode === 'dark' ? '#444' : '#fff',
              '& input': {
                color: settings.mode === 'dark' ? '#fff' : '#000',
              },
              '& .MuiOutlinedInput-root': {
                backgroundColor: settings.mode === 'dark' ? '#444' : '#fff',
              },
            }}
            inputProps={{
              min: formData.start_date || new Date().toISOString().split("T")[0] // Ensures end date is not before start date
            }}
          />
        </Grid>
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
            sx={{
              backgroundColor: settings.mode === 'dark' ? '#444' : '#fff',
              '& input': {
                color: settings.mode === 'dark' ? '#fff' : '#000',
              },
              '& .MuiOutlinedInput-root': {
                backgroundColor: settings.mode === 'dark' ? '#444' : '#fff',
              },
            }}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label='Note'
            name='note'
            value={formData.note}
            onChange={(e) => {
              const { name, value } = e.target;
              const [firstWord, ...rest] = value.split(' ');
              const capitalizedFirstWord = firstWord.charAt(0).toUpperCase() + firstWord.slice(1);
              const capitalizedValue = [capitalizedFirstWord, ...rest].join(' ');

              handleChange({ target: { name, value: capitalizedValue } });
            }}
            required
            error={!!errors.note}
            helperText={errors.note}
            FormHelperTextProps={{ style: { color: 'red' } }}
            sx={{
              backgroundColor: settings.mode === 'dark' ? '#444' : '#fff',
              '& input': {
                color: settings.mode === 'dark' ? '#fff' : '#000',
              },
              '& .MuiOutlinedInput-root': {
                backgroundColor: settings.mode === 'dark' ? '#444' : '#fff',
              },
            }}
          />
        </Grid>
        <Grid item xs={12}>
          <Button
            style={{
              fontSize: '18px',
              fontWeight: 600,
              color: 'white',
              padding: 15,
              backgroundColor: '#ff902f',
              width: 200,
            }}
            variant='contained'
            fullWidth
            onClick={handleSubmit}
          >
            {holiday ? 'UPDATE HOLIDAY' : 'ADD HOLIDAY'}
          </Button>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AddHolidayForm;
