import React, { useState, useEffect } from 'react';

import { Box, Grid, TextField, Typography, IconButton, Button, FormControl, InputLabel, Select, MenuItem, InputAdornment, Autocomplete } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useDispatch, useSelector } from 'react-redux';

import { toast, ToastContainer } from 'react-toastify';

import type { AppDispatch, RootState } from '../../redux/store';
import { addOrUpdateEmployee } from '@/redux/features/employees/employeesSlice';
import { fetchDesignations } from '@/redux/features/designation/designationSlice';

import { utility } from '@/utility';

import 'react-toastify/dist/ReactToastify.css';

const EmployeeForm = ({ handleClose, employee, employees, fetchEmployees, page }) => {
  const { designations } = useSelector((state: RootState) => state.designations);

  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    work_email: "",
    contact: "",
    role_priority: "",
    dob: "",
    gender: "",
    designation: "",
    password: "",
    confirm_password: "",
    joining_date: "",
    leaving_date: "",
    status: "active",
    image: "",
    code: "",
    location: "",
  });

  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState(null);
  const [isPasswordFieldVisible, setIsPasswordFieldVisible] = useState(false);
  const [isPasswordShown, setIsPasswordShown] = useState(false);
  const [errors, setErrors] = useState({});
  const dispatch: AppDispatch = useDispatch();
  const { capitalizeInput } = utility();

  useEffect(() => {
    if (employee) {
      const selected = employees.find(t => t._id === employee);

      if (selected) {
        setFormData({
          first_name: selected.first_name,
          last_name: selected.last_name,
          email: selected.email,
          work_email: selected.work_email,
          contact: selected.contact,
          role_priority: selected.role_priority,
          dob: selected.dob,
          gender: selected.gender,
          designation: selected.designation,
          password: selected.password,
          confirm_password: "",
          joining_date: selected.joining_date,
          leaving_date: selected.leaving_date,
          status: selected.status,
          image: selected.image,
          code: selected.code,
          location: selected.location
        });
        setImagePreviewUrl(selected.image);
      }
    }

    if (!employee) {
      setIsPasswordFieldVisible(true);
    }
  }, [employee, employees]);

  useEffect(() => {
    dispatch(fetchDesignations({ page: 1, limit: 0, keyword: "" }));
    console.log("designation", designations)
  }, [])

  const handleClickShowPassword = () => setIsPasswordShown(show => !show);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
    setErrors(prevErrors => ({
      ...prevErrors,
      [name]: ''
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];

    if (file) {
      if (file.size > 5 * 1024 * 1024) { // Check if the image is larger than 5MB
        setErrors(prevErrors => ({
          ...prevErrors,
          image: 'Image must be less than 5MB'
        }));
      } else {
        setSelectedImage(file);
        setImagePreviewUrl(URL.createObjectURL(file));
        setErrors(prevErrors => ({
          ...prevErrors,
          image: ''
        }));
      }
    }
  };

  const validate = () => {
    const newErrors = {};
    const requiredFields = ['first_name', 'last_name', 'email', 'work_email', 'contact', 'role_priority', 'dob', 'gender', 'designation', 'joining_date', 'password', 'code', 'location'];

    requiredFields.forEach(field => {
      if (!formData[field]) {
        newErrors[field] = `${field.replace('_', ' ')} is require`
      }
    });

    if (formData.password !== formData.confirm_password && isPasswordFieldVisible) {
      newErrors.confirm_password = 'Passwords do not match';
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;

    const method = employee ? 'PUT' : 'POST';
    const url = employee ? `${process.env.NEXT_PUBLIC_APP_URL}/employees/update/${employee}` : `${process.env.NEXT_PUBLIC_APP_URL}/employees/create`;

    const formDataToSend = new FormData();

    for (const key in formData) {
      if (key !== 'password' || isPasswordFieldVisible) {
        formDataToSend.append(key, formData[key]);
      }
    }

    if (selectedImage) {
      formDataToSend.append('image', selectedImage);
    }

    fetch(url, {
      method,
      body: formDataToSend
    })
      .then(response => response.json())
      .then(data => {
        if (data.error) {
          // Check for specific error messages and show corresponding toast notifications
          if (data.error === 'Email already exists') {
            toast.error('Email already exists. Please use a different email.');
          } else {
            toast.error(data.error || 'An error occurred. Please try again.');
          }
        } else {
          if (employee) {
            dispatch(addOrUpdateEmployee(data));
            toast.success('Employee updated successfully!');
          } else {
            dispatch(fetchEmployees({ page, limit: 12, search: '', designation: '' }));
            toast.success('Employee created successfully!');
          }

          setTimeout(() => handleClose(), 3000);
        }
      })
      .catch(error => {
        console.error('Error:', error);
        toast.error('An error occurred. Please try again.');
      });
  };



  const handlePasswordFieldVisibility = () => {
    setIsPasswordFieldVisible(true);
    setFormData(prevState => ({
      ...prevState,
      password: ""
    }));
  };

  return (
    <Box sx={{ flexGrow: 1, padding: 2 }}>
      <ToastContainer position="top-center" autoClose={3000} hideProgressBar={false} />
      <Box display='flex' justifyContent='space-between' alignItems='center'>
        <Typography style={{ fontSize: '2em' }} variant='h5' gutterBottom>
          {employee ? 'Edit Employee' : 'Add Employee'}
        </Typography>
        <Box display="flex">
          {employee && !isPasswordFieldVisible && (
            <Grid item xs={12} md={6}>
              <Button variant="outlined" onClick={handlePasswordFieldVisibility}>
                Change Password
              </Button>
            </Grid>
          )}
          <IconButton onClick={handleClose}>
            <CloseIcon />
          </IconButton>
        </Box>
      </Box>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label='First Name'
            name='first_name'
            value={formData.first_name}
            onChange={(e) => {
              const { name, value } = e.target;
              const capitalizedValue = value
                .split(' ')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ');
              handleChange({ target: { name, value: capitalizedValue } });
            }}
            required
            error={!!errors.first_name}
            helperText={errors.first_name}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label='Last Name'
            name='last_name'
            value={formData.last_name}
            onChange={(e) => capitalizeInput(e, handleChange)}
            required
            error={!!errors.last_name}
            helperText={errors.last_name}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label='Contact'
            name='contact'
            value={formData.contact}
            onChange={handleChange}
            required
            error={!!errors.contact}
            helperText={errors.contact}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label='Email'
            name='email'
            value={formData.email}
            onChange={handleChange}
            required
            error={!!errors.email}
            helperText={errors.email}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label='Work Email'
            name='work_email'
            value={formData.work_email}
            onChange={handleChange}
            required
            error={!!errors.work_email}
            helperText={errors.work_email}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            type='date'
            label='DOB'
            name="dob"
            value={formData.dob}
            onChange={handleChange}
            InputLabelProps={{ shrink: true }}
            required
            error={!!errors.dob}
            helperText={errors.dob}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <FormControl fullWidth error={!!errors.gender}>
            <InputLabel required id='demo-simple-select-label'>
              Select Gender
            </InputLabel>
            <Select
              label='Select Gender'
              labelId='demo-simple-select-label'
              id='demo-simple-select'
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              fullWidth
            >
              <MenuItem value='Male'>Male</MenuItem>
              <MenuItem value='Female'>Female</MenuItem>
              <MenuItem value='Other'>Other</MenuItem>
            </Select>
            {errors.gender && <Typography color='error'>{errors.gender}</Typography>}
          </FormControl>
        </Grid>
        {isPasswordFieldVisible && (
          <>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label='Password'
                type={isPasswordShown ? 'text' : 'password'}
                name='password'
                value={formData.password}
                onChange={handleChange}
                autoComplete="off"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position='end'>
                      <IconButton
                        size='small'
                        edge='end'
                        onClick={handleClickShowPassword}
                        onMouseDown={e => e.preventDefault()}
                      >
                        <i className={isPasswordShown ? 'ri-eye-off-line' : 'ri-eye-line'} />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                error={!!errors.password}
                helperText={errors.password}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label='Confirm Password'
                type={isPasswordShown ? 'text' : 'password'}
                name='confirm_password'
                value={formData.confirm_password}
                onChange={handleChange}
                autoComplete="off"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position='end'>
                      <IconButton
                        size='small'
                        edge='end'
                        onClick={handleClickShowPassword}
                        onMouseDown={e => e.preventDefault()}
                      >
                        <i className={isPasswordShown ? 'ri-eye-off-line' : 'ri-eye-line'} />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                error={!!errors.confirm_password}
                helperText={errors.confirm_password}
              />
            </Grid>
          </>
        )}
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label='Joining Date'
            type='date'
            name='joining_date'
            value={formData.joining_date}
            onChange={handleChange}
            InputLabelProps={{ shrink: true }}
            required
            error={!!errors.joining_date}
            helperText={errors.joining_date}
          />
        </Grid>
        {employee &&
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label='Leaving Date'
              type='date'
              name='leaving_date'
              value={formData.leaving_date}
              onChange={handleChange}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
        }
        <Grid item xs={12} md={6}>
          <FormControl fullWidth >
            <InputLabel id='demo-simple-select-label'>Select Status</InputLabel>
            <Select
              label='Select Status'
              labelId='demo-simple-select-label'
              id='demo-simple-select'
              name='status'
              value={formData.status}
              onChange={handleChange}
              fullWidth
            >
              <MenuItem value='active'>Active</MenuItem>
              <MenuItem value='inactive'>In Active</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} md={6}>
          <FormControl fullWidth error={!!errors.role_priority}>
            <InputLabel id='demo-simple-select-label'>Select Role</InputLabel>
            <Select
              label='Select Role'
              labelId='demo-simple-select-label'
              id='demo-simple-select'
              name='role_priority'
              value={formData.role_priority}
              onChange={handleChange}
              fullWidth
            >
              <MenuItem value='1'>Admin</MenuItem>
              <MenuItem value='2'>Manager</MenuItem>
              <MenuItem value='3'>Employee</MenuItem>
              <MenuItem value='4'>Channel Partner</MenuItem>
            </Select>
            {errors.role_priority && <Typography color='error'>{errors.role_priority}</Typography>}
          </FormControl>
        </Grid>
        <Grid item xs={12} md={6}>
          <FormControl fullWidth error={!!errors.designation}>
            <Autocomplete
              id="designation-select"
              options={designations
                .map((designation) => designation.title)
                .sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()))}
              getOptionLabel={(option) => option}
              renderInput={(params) => (
                <TextField {...params} label="Select Designation" variant="outlined" />
              )}
              value={formData.designation}
              onChange={(event, newValue) => {
                handleChange({ target: { name: "designation", value: newValue } });
              }}
            />
            {errors.designation && (
              <Typography color="error">{errors.designation}</Typography>
            )}
          </FormControl>
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label='Employee code'
            name='code'
            value={formData.code}
            onChange={handleChange}
            required
            error={!!errors.code}
            helperText={errors.code}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <FormControl fullWidth >
            <InputLabel id='demo-simple-select-label'>Select Location</InputLabel>
            <Select
              label='Select Location'
              labelId='demo-simple-select-label'
              id='demo-simple-select'
              name='location'
              value={formData.location}
              onChange={handleChange}
              fullWidth
            >
              <MenuItem value='noida'>Noida</MenuItem>
              <MenuItem value='bareilly'>Bareilly</MenuItem>
              <MenuItem value='patel nagar'>Patel Nagar</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} md={6}>
          <Box display="flex" flexDirection="column">
            <Button variant='contained' component='label'>
              Upload Image
              <input
                type='file'
                hidden
                accept='image/*'
                onChange={handleImageChange}
              />
            </Button>
            {imagePreviewUrl && (
              <img
                src={imagePreviewUrl}
                alt='Preview'
                style={{ maxHeight: '100%', marginTop: '10px' }}
              />
            )}
            {errors.image && <Typography color='error'>{errors.image}</Typography>}
          </Box>

        </Grid>
        <Grid item xs={12}>
          <Box display="flex" justifyContent="center">
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
              onClick={handleSubmit}
            >
              {employee ? "UPDATE EMPLOYEE" : "ADD EMPLOYEE"}
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default EmployeeForm;
