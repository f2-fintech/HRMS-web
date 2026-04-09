import React, { useState, useEffect } from 'react'

import PhoneInput from 'react-phone-input-2'
import 'react-phone-input-2/lib/style.css' // Import the CSS file for PhoneInput

import {
  Box,
  Grid,
  TextField,
  Typography,
  IconButton,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  Autocomplete,
  Paper
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import PersonAddIcon from '@mui/icons-material/PersonAdd'
import EditIcon from '@mui/icons-material/Edit'
import VisibilityIcon from '@mui/icons-material/Visibility'
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff'
import LockResetIcon from '@mui/icons-material/LockReset'
import PersonIcon from '@mui/icons-material/Person'
import ContactPhoneIcon from '@mui/icons-material/ContactPhone'
import EmailIcon from '@mui/icons-material/Email'
import WorkIcon from '@mui/icons-material/Work'
import CalendarTodayIcon from '@mui/icons-material/CalendarToday'
import TransgenderIcon from '@mui/icons-material/Transgender'
import BadgeIcon from '@mui/icons-material/Badge'
import LocationOnIcon from '@mui/icons-material/LocationOn'
import CloudUploadIcon from '@mui/icons-material/CloudUpload'

import { useDispatch, useSelector } from 'react-redux'
import { toast, ToastContainer } from 'react-toastify'

import type { AppDispatch, RootState } from '../../redux/store'
import { addOrUpdateEmployee } from '@/redux/features/employees/employeesSlice'
import {
  fetchDesignationList,
} from '@/redux/features/designation/designationV2Slice'
import { fetchCompanies } from '@/redux/features/company/companyslice'

import { utility } from '@/utility'

import 'react-toastify/dist/ReactToastify.css'
import LocationDropdown from '@/utility/locationdropdown/LocationDropdown'
import { useSettings } from '@/@core/hooks/useSettings'
import {
  fetchDepartments,
} from '@/redux/features/designation/departmentDesignationsSlice'



const EmployeeForm = ({ handleClose, employee, employees, fetchEmployees, page }) => {
  const { designations: allDesignations = [] } = useSelector((state: RootState) => state.designationV2)
  const { companies } = useSelector((state: RootState) => state.companies)

  const { settings } = useSettings()

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    work_email: '',
    contact: '',
    emergencycontact: '',
    relation_name: '',
    relation: '',
    role_priority: '',
    dob: '',
    gender: '',
    designation_id: '', // Added primary ID field
    designation: '',    // Keep for legacy/title if needed
    salary: '',
    password: '',
    confirm_password: '',
    joining_date: '',
    leaving_date: '',
    status: 'active',
    image: '',
    code: '',
    location: '',
    company_id: '',
    manager_id: '',
    department_id: ''
  })

  const [imageFocus, setImageFocus] = useState(false)
  const [selectedImage, setSelectedImage] = useState(null)
  const [imagePreviewUrl, setImagePreviewUrl] = useState(null)
  const [isPasswordFieldVisible, setIsPasswordFieldVisible] = useState(false)
  const [isPasswordShown, setIsPasswordShown] = useState(false)
  const [errors, setErrors] = useState({})
  const dispatch: AppDispatch = useDispatch()
  const { capitalizeInput } = utility()

  const { role, company_id } = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user')) : {}

  const formBackgroundColor = settings.mode === 'dark' ? '#333' : '#f5f5f5'
  const textColor = settings.mode === 'dark' ? '#fff' : '#000'
  const [selectedDepartmentId, setSelectedDepartmentId] = useState('')
  const { departments } = useSelector((state: RootState) => state.department)

  // Populate form when editing + show password fields when creating
  useEffect(() => {
    if (employee && employees.length > 0) {
      const selected = employees.find(t => t._id === employee);

      if (selected) {
        const designationObj = selected.designation_id;
        const deptId = designationObj?.department_id?._id || selected.department_id || '';

        setFormData({
          first_name: selected.first_name || '',
          last_name: selected.last_name || '',
          email: selected.email || '',
          work_email: selected.work_email || '',
          contact: selected.contact || '',
          emergencycontact: selected.emergencycontact || '',
          relation_name: selected.relation_name || '',
          relation: selected.relation || '',
          role_priority: selected.role_priority || '',
          dob: selected.dob || '',
          gender: selected.gender || '',
          designation: designationObj?.title || selected.designation || '',
          designation_id: designationObj?._id || '',
          salary: selected.salary || '',
          password: '',
          confirm_password: '',
          joining_date: selected.joining_date || '',
          leaving_date: selected.leaving_date || '',
          status: selected.status || 'active',
          image: selected.image || '',
          code: selected.code || '',
          location: selected.location || '',
          company_id: selected.company_id || '',
          manager_id: selected.manager_id || '',
          department_id: deptId
        });

        setSelectedDepartmentId(deptId);
        setImagePreviewUrl(selected.image || null);
      }
    }
    else if (!employee) {
      // ✅ When creating new employee - always show password fields
      setIsPasswordFieldVisible(true);
      setFormData(prev => ({
        ...prev,
        password: '',
        confirm_password: ''
      }));
    }

    if (role !== '0' && company_id) {
      setFormData(prev => ({ ...prev, company_id }));
    }
  }, [employee, employees, role, company_id]); // Run when the employee data is ready // Added allDesignations to dependency to re-check once loaded

  // Auto select correct designation when editing
  useEffect(() => {
    if (employee && selectedDepartmentId && formData.designation) {
      const matchingDes = allDesignations.find(
        (des: any) =>
          des.department_id === selectedDepartmentId &&
          des.title === formData.designation
      )

      if (!matchingDes) {

      }
    }
  }, [selectedDepartmentId, formData.designation, allDesignations, employee])

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}')
    const company_id = user?.company_id

    if (company_id) {
      dispatch(fetchDesignationList({
        company_id,
        page: 1,
        limit: 100,           // Fetch many so all designations are available
      }))
    }

    dispatch(fetchCompanies({ page: 1, limit: 0, keyword: '' }))
  }, [dispatch])

  useEffect(() => {
    dispatch(fetchDepartments())
  }, [dispatch])

  const handleClickShowPassword = () => setIsPasswordShown(show => !show)

  const handleChange = e => {
    const { name, value } = e.target

    // Add validation for joining date
    if (name === 'joining_date') {
      const selectedDate = new Date(value)
      const today = new Date()

      // Reset time portion for accurate date comparison
      selectedDate.setHours(0, 0, 0, 0)
      today.setHours(0, 0, 0, 0)

      if (selectedDate > today) {
        setErrors(prevErrors => ({
          ...prevErrors,
          joining_date: 'Joining date cannot be in the future'
        }))

        return // Don't update the form data if date is invalid
      }
    }

    if (name === 'email' || name === 'work_email') {
      if (!value) {
        setErrors(prevErrors => ({
          ...prevErrors,
          [name]: 'This field is required'
        }))
      } else if (!EMAIL_REGEX.test(value)) {
        setErrors(prevErrors => ({
          ...prevErrors,
          [name]: 'Please enter a valid email address'
        }))
      } else {
        setErrors(prevErrors => ({
          ...prevErrors,
          [name]: ''
        }))
      }
    }

    if (name === 'contact') {
      const phoneNumber = value.replace(/^(\+91|91)/, '').trim() // Remove +91 or 91 prefix

      if (!value) {
        setErrors(prevErrors => ({
          ...prevErrors,
          contact: 'Contact number is required' // Show error if contact is empty
        }))
      } else if (phoneNumber.length !== 10) {
        setErrors(prevErrors => ({
          ...prevErrors,
          contact: 'Please fill correct mobile number' // Show error for incorrect phone number
        }))
      } else {
        setErrors(prevErrors => ({
          ...prevErrors,
          contact: '' // Clear the error if validation passes
        }))
      }
    }

    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }))
    setErrors(prevErrors => ({
      ...prevErrors,
      [name]: ''
    }))
  }

  const handleImageChange = e => {
    const file = e.target.files[0]

    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        // Check if the image is larger than 5MB
        setErrors(prevErrors => ({
          ...prevErrors,
          image: 'Image must be less than 5MB'
        }))
      } else {
        setSelectedImage(file)
        setImagePreviewUrl(URL.createObjectURL(file))
        setErrors(prevErrors => ({
          ...prevErrors,
          image: ''
        }))
      }
    }
  }

  const handleImageFocus = () => {
    setImageFocus(true) // Focus the image
  }

  const handleImageBlur = () => {
    setImageFocus(false) // Remove focus from the image
  }

  const validate = () => {
    const newErrors = {}

    const requiredFields = role !== '0'
      ? [
        'first_name',
        'last_name',
        'email',
        'work_email',
        'contact',
        'role_priority',
        'dob',
        'gender',
        'designation_id',
        'salary',
        'joining_date',
        'code',
        'location',
        'department_id'
      ]
      : ['first_name', 'last_name', 'email', 'password', 'role_priority', 'company_id', 'gender']

    requiredFields.forEach(field => {
      if (!formData[field]) {
        const friendlyName = field.replace('_id', '').replace('_', ' ')

        newErrors[field] = `${friendlyName} is required`
      }
    })

    // ✅ Password is REQUIRED only during CREATE, not during EDIT
    if (!employee) {
      if (!formData.password) {
        newErrors.password = 'Password is required'
      }

      if (!formData.confirm_password) {
        newErrors.confirm_password = 'Confirm Password is required'
      }

      if (formData.password !== formData.confirm_password) {
        newErrors.confirm_password = 'Passwords do not match'
      }
    }
    else if (isPasswordFieldVisible) {
      // During edit, password is only required if user clicked "Change Password"
      if (formData.password !== formData.confirm_password) {
        newErrors.confirm_password = 'Passwords do not match'
      }
    }

    // Email validations
    if (formData.email && !validateEmail('email', formData.email)) {
      newErrors.email = errors.email || 'Invalid email address'
    }

    if (formData.work_email && !validateEmail('work_email', formData.work_email)) {
      newErrors.work_email = errors.work_email || 'Invalid work email address'
    }

    // Contact validation
    const plainContact = formData.contact ? formData.contact.replace(/^(\+91|91)/, '').trim() : ''

    if (formData.contact && plainContact.length !== 10) {
      newErrors.contact = 'Please enter a valid 10-digit mobile number'
    }

    setErrors(newErrors)

    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = () => {
    if (!validate()) return

    const method = employee ? 'PUT' : 'POST'

    const url = employee
      ? `${process.env.NEXT_PUBLIC_APP_URL}/employees/update/${employee}`
      : `${process.env.NEXT_PUBLIC_APP_URL}/employees/create`

    const formDataToSend = new FormData()

    for (const key in formData) {
      if (key !== 'password' || isPasswordFieldVisible) {
        formDataToSend.append(key, formData[key])
      }
    }

    if (selectedImage) {
      formDataToSend.append('image', selectedImage)
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
            toast.error('Email already exists. Please use a different email.')
          } else {
            toast.error(data.error || 'An error occurred. Please try again.')
          }
        } else {
          if (employee) {
            dispatch(addOrUpdateEmployee(data))
            toast.success('Employee updated successfully!')
          } else {
            dispatch(fetchEmployees({ page, limit: 12, search: '', designation: '' }))
            toast.success('Employee created successfully!')
          }

          setTimeout(() => handleClose(), 3000)
        }
      })
      .catch(error => {
        console.error('Error:', error)
        toast.error('An error occurred. Please try again.')
      })
  }

  const EMAIL_REGEX = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i

  const validateEmail = (fieldName, value) => {
    if (!value) {
      setErrors(prev => ({
        ...prev,
        [fieldName]: 'This field is required'
      }))

      return false
    }

    if (!EMAIL_REGEX.test(value)) {
      setErrors(prev => ({
        ...prev,
        [fieldName]: 'Please enter a valid email address'
      }))

      return false
    }

    setErrors(prev => ({
      ...prev,
      [fieldName]: ''
    }))

    return true
  }

  const handlePasswordFieldVisibility = () => {
    setIsPasswordFieldVisible(true)
    setFormData(prevState => ({
      ...prevState,
      password: ''
    }))
  }

  console.log('formDAta>>', formData)

  return (
    <Paper
      elevation={3}
      sx={{
        flexGrow: 1,
        padding: 3,
        borderRadius: 2,
        backgroundColor: formBackgroundColor, // Set dynamic background color
        color: textColor, // Set dynamic text color
      }}
    >
      <ToastContainer position='top-center' autoClose={3000} hideProgressBar={false} />
      <Box display='flex' justifyContent='space-between' alignItems='center' mb={3}>
        <Typography
          variant='h4'
          gutterBottom
          sx={{
            display: 'flex',
            alignItems: 'center',
            fontWeight: 'bold',
            color: '#333'
          }}
        >
          {employee ? (
            <EditIcon sx={{ mr: 2, color: '#ff902f' }} />
          ) : (
            <PersonAddIcon sx={{ mr: 2, color: '#ff902f' }} />
          )}
          {employee ? 'Edit Employee' : 'Add Employee'}
        </Typography>
        <Box display='flex' alignItems='center'>
          {employee && !isPasswordFieldVisible && (
            <Button
              variant='outlined'
              startIcon={<LockResetIcon />}
              onClick={handlePasswordFieldVisibility}
              sx={{ mr: 2 }}
            >
              Change Password
            </Button>
          )}
          <IconButton onClick={handleClose} color='error'>
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
            onChange={e => capitalizeInput(e, handleChange)}
            required
            error={!!errors.first_name}
            helperText={errors.first_name}
            InputProps={{
              startAdornment: (
                <InputAdornment position='start'>
                  <PersonIcon color='action' />
                </InputAdornment>
              )
            }}
            sx={{
              '& .MuiInputLabel-root': {
                color: 'textColor '
              },
              '& .MuiOutlinedInput-root': {
                '& fieldset': {
                  borderColor: 'textColor '
                },
                '&:hover fieldset': {
                  borderColor: 'textColor '
                },
                '&.Mui-focused fieldset': {
                  borderColor: 'textColor '
                }
              },
              '& .MuiInputBase-input': {
                color: 'textColor '
              }
            }}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label='Last Name'
            name='last_name'
            value={formData.last_name}
            onChange={e => capitalizeInput(e, handleChange)}
            required
            error={!!errors.last_name}
            helperText={errors.last_name}
            InputProps={{
              startAdornment: (
                <InputAdornment position='start'>
                  <PersonIcon color='action' />
                </InputAdornment>
              )
            }}
            sx={{
              '& .MuiInputLabel-root': {
                color: 'textColor '
              },
              '& .MuiOutlinedInput-root': {
                '& fieldset': {
                  borderColor: 'textColor '
                },
                '&:hover fieldset': {
                  borderColor: 'textColor '
                },
                '&.Mui-focused fieldset': {
                  borderColor: 'textColor '
                }
              },
              '& .MuiInputBase-input': {
                color: 'textColor '
              }
            }}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <FormControl fullWidth error={!!errors.contact}>
            <Typography
              variant="body2"
              sx={{ fontWeight: 400 }}
            >
              Employee Contact
            </Typography>
            <PhoneInput
              international
              defaultCountry="IN"
              value={
                formData.contact
                  ? (formData.contact.startsWith("91")
                    ? `+91 ${formData.contact.slice(2)}`
                    : `+91 ${formData.contact}`)
                  : "+91 "
              }
              onChange={value => {
                setFormData({
                  ...formData,

                  // contact: value.replace(/^(\+91|91)/, "")
                  contact: value.replace(/^(\+91)/, "")
                })
              }}
              inputProps={{
                name: "contact",
                placeholder: "Employee Contact",   // ✅ Correct placeholder
                required: true
              }}
              containerStyle={{
                display: "flex",
                alignItems: "center",
                borderRadius: "4px",
                padding: "10px",
                backgroundColor: settings.mode === "dark" ? "#444" : "#fff"
              }}
              inputStyle={{
                paddingLeft: "40px",
                height: "40px",
                fontSize: "16px",
                width: "100%",
                backgroundColor: settings.mode === "dark" ? "#444" : "#fff",
                color: settings.mode === "dark" ? "white" : "#000"
              }}
              dropdownStyle={{
                backgroundColor: settings.mode === "dark" ? "#333" : "#fff",
                color: settings.mode === "dark" ? "#fff" : "#000"
              }}
            />
            {errors.contact && (
              <Typography color="error">{errors.contact}</Typography>
            )}
          </FormControl>

        </Grid>
        <Grid item xs={12} md={6}>
          <FormControl fullWidth error={!!errors.emergencycontact}>
            <Typography
              variant="body2"
              sx={{ fontWeight: 400 }}
            >
              Emergency Contact
            </Typography>
            <PhoneInput
              international
              defaultCountry='IN' // Corrected to use the two-letter country code for India (IN)
              value={formData.emergencycontact ? (formData.emergencycontact.startsWith('91') ? `+91 ${formData.emergencycontact.slice(2)}` : `+91 ${formData.emergencycontact}`) : '+91 '} // Format the value correctly
              onChange={value => {
                // Remove +91 or 91 from the value before storing it
                setFormData({ ...formData, emergencycontact: value.replace(/^(\+91|91)/, '') }); // Save the number without +91
              }}
              label='Emergencycontact'
              required
              error={!!errors.emergencycontact} // Show error if validation fails
              helperText={errors.emergencycontact} // Show the error message under the input
              containerStyle={{
                display: 'flex',
                alignItems: 'center',

                // border: `1px solid ${settings.mode === 'dark' ? '#fff' : '#000'}`,
                borderRadius: '4px',
                padding: '10px', // Padding for the container
                backgroundColor: settings.mode === 'dark' ? '#444' : '#fff',
              }}
              inputStyle={{
                paddingLeft: '40px', // Ensure the country flag and code don't overlap
                height: '40px', // Height of the input field
                fontSize: '16px', // Font size of the input text
                width: '100%', // Ensure input width spans the container
                backgroundColor: settings.mode === 'dark' ? '#444' : '#fff',
                color: settings.mode === 'dark' ? 'white' : '#000',
              }}
              dropdownStyle={{
                backgroundColor: settings.mode === 'dark' ? '#333' : '#fff', // Set background color for dropdown
                color: settings.mode === 'dark' ? '#fff' : '#000', // Set text color for dropdown
              }}
            />
            {errors.emergencycontact && <Typography color='error'>{errors.emergencycontact}</Typography>} {/* Display error */}
          </FormControl>
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label='Relative Name'
            name='relation_name'
            value={formData.relation_name}
            onChange={e => capitalizeInput(e, handleChange)}
            required
            error={!!errors.relation_name}
            helperText={errors.relation_name}
            InputProps={{
              startAdornment: (
                <InputAdornment position='start'>
                  <PersonIcon color='action' />
                </InputAdornment>
              )
            }}
            sx={{
              '& .MuiInputLabel-root': {
                color: 'textColor '
              },
              '& .MuiOutlinedInput-root': {
                '& fieldset': {
                  borderColor: 'textColor '
                },
                '&:hover fieldset': {
                  borderColor: 'textColor '
                },
                '&.Mui-focused fieldset': {
                  borderColor: 'textColor '
                }
              },
              '& .MuiInputBase-input': {
                color: 'textColor '
              }
            }}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label='Relation'
            name='relation'
            value={formData.relation}
            onChange={e => capitalizeInput(e, handleChange)}
            required
            error={!!errors.relation}
            helperText={errors.relation}
            InputProps={{
              startAdornment: (
                <InputAdornment position='start'>
                  <PersonIcon color='action' />
                </InputAdornment>
              )
            }}
            sx={{
              '& .MuiInputLabel-root': {
                color: 'textColor '
              },
              '& .MuiOutlinedInput-root': {
                '& fieldset': {
                  borderColor: 'textColor '
                },
                '&:hover fieldset': {
                  borderColor: 'textColor '
                },
                '&.Mui-focused fieldset': {
                  borderColor: 'textColor '
                }
              },
              '& .MuiInputBase-input': {
                color: 'textColor '
              }
            }}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label='Email'
            name='email'
            value={formData.email}
            onChange={handleChange}
            onBlur={e => {
              if (!e.target.value) {
                setErrors(prev => ({
                  ...prev,
                  email: 'Email is required'
                }))
              } else if (!EMAIL_REGEX.test(e.target.value)) {
                setErrors(prev => ({
                  ...prev,
                  email: 'Please enter a valid email address'
                }))
              } else {
                setErrors(prev => ({
                  ...prev,
                  email: ''
                }))
              }
            }}
            required
            error={!!errors.email}
            helperText={errors.email}
            InputProps={{
              startAdornment: (
                <InputAdornment position='start'>
                  <EmailIcon color='action' />
                </InputAdornment>
              )
            }}
            sx={{
              '& .MuiInputLabel-root': {
                color: 'textColor '
              },
              '& .MuiOutlinedInput-root': {
                '& fieldset': {
                  borderColor: 'textColor '
                },
                '&:hover fieldset': {
                  borderColor: 'textColor '
                },
                '&.Mui-focused fieldset': {
                  borderColor: 'textColor '
                }
              },
              '& .MuiInputBase-input': {
                color: 'textColor '
              }
            }}
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label='Work Email'
            name='work_email'
            value={formData.work_email}
            onChange={handleChange}
            onBlur={e => {
              if (!e.target.value) {
                setErrors(prev => ({
                  ...prev,
                  work_email: 'Work email is required'
                }))
              } else if (!EMAIL_REGEX.test(e.target.value)) {
                setErrors(prev => ({
                  ...prev,
                  work_email: 'Please enter a valid email address'
                }))
              } else {
                setErrors(prev => ({
                  ...prev,
                  work_email: ''
                }))
              }
            }}
            required
            error={!!errors.work_email}
            helperText={errors.work_email}
            InputProps={{
              startAdornment: (
                <InputAdornment position='start'>
                  <WorkIcon color='action' />
                </InputAdornment>
              )
            }}
            sx={{
              '& .MuiInputLabel-root': {
                color: 'textColor '
              },
              '& .MuiOutlinedInput-root': {
                '& fieldset': {
                  borderColor: 'textColor '
                },
                '&:hover fieldset': {
                  borderColor: 'textColor '
                },
                '&.Mui-focused fieldset': {
                  borderColor: 'textColor '
                }
              },
              '& .MuiInputBase-input': {
                color: 'textColor '
              }
            }}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            type='date'
            label='DOB'
            name='dob'
            value={formData.dob}
            onChange={e => {
              const selectedDate = new Date(e.target.value)
              const today = new Date()

              let age = today.getFullYear() - selectedDate.getFullYear()
              const monthDiff = today.getMonth() - selectedDate.getMonth()
              const dayDiff = today.getDate() - selectedDate.getDate()

              // Adjust age if the birthday hasn't occurred yet this year
              if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
                age--
              }

              if (age < 18) {
                setErrors(prevErrors => ({
                  ...prevErrors,
                  dob: 'You must be at least 18 years old.'
                }))
              } else {
                setErrors(prevErrors => ({ ...prevErrors, dob: '' }))
              }

              handleChange(e)
            }}
            InputLabelProps={{ shrink: true }}
            required
            error={!!errors.dob}
            helperText={errors.dob}
            InputProps={{
              startAdornment: (
                <InputAdornment position='start'>
                  <CalendarTodayIcon color='action' />
                </InputAdornment>
              )
            }}
            sx={{
              '& .MuiInputLabel-root': { color: 'textColor ' },
              '& .MuiOutlinedInput-root': {
                '& fieldset': { borderColor: 'textColor ' },
                '&:hover fieldset': { borderColor: 'textColor ' },
                '&.Mui-focused fieldset': { borderColor: 'textColor ' }
              },
              '& .MuiInputBase-input': { color: 'textColor ' }
            }}
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
              name='gender'
              value={formData.gender}
              onChange={handleChange}
              fullWidth
              startAdornment={
                <InputAdornment position='start'>
                  <TransgenderIcon color='action' />
                </InputAdornment>
              }
              sx={{
                '& .MuiSelect-root': {
                  color: 'textColor '
                },
                '& .MuiInputLabel-root': {
                  color: 'textColor '
                },
                '& .MuiInputBase-input': {
                  color: 'textColor ' // Set the color of the input text
                }
              }}
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
                required={!employee}                    // ← Only required on Create
                InputProps={{
                  startAdornment: <InputAdornment position='start'><LockResetIcon color='action' /></InputAdornment>,
                  endAdornment: (
                    <InputAdornment position='end'>
                      <IconButton onClick={handleClickShowPassword}>
                        {isPasswordShown ? <VisibilityOffIcon /> : <VisibilityIcon />}
                      </IconButton>
                    </InputAdornment>
                  )
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
                required={!employee}                    // ← Only required on Create
                InputProps={{
                  startAdornment: <InputAdornment position='start'><LockResetIcon color='action' /></InputAdornment>,
                  endAdornment: (
                    <InputAdornment position='end'>
                      <IconButton onClick={handleClickShowPassword}>
                        {isPasswordShown ? <VisibilityOffIcon /> : <VisibilityIcon />}
                      </IconButton>
                    </InputAdornment>
                  )
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
            InputProps={{
              startAdornment: (
                <InputAdornment position='start'>
                  <CalendarTodayIcon color='action' />
                </InputAdornment>
              )
            }}
          />
        </Grid>
        {employee && (
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label='Leaving Date'
              type='date'
              name='leaving_date'
              value={formData.leaving_date}
              onChange={handleChange}
              InputLabelProps={{ shrink: true }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position='start'>
                    <CalendarTodayIcon color='action' />
                  </InputAdornment>
                )
              }}
            />
          </Grid>
        )}
        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
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
              {role === '0' && <MenuItem value='0'>Super User</MenuItem>}
              <MenuItem value='1'>Admin</MenuItem>
              <MenuItem value='2' disabled={role === '0'}>
                Manager
              </MenuItem>
              <MenuItem value='3' disabled={role === '0'}>
                Employee
              </MenuItem>
              <MenuItem value='4' disabled={role === '0'}>
                Channel Partner
              </MenuItem>
            </Select>
            {errors.role_priority && <Typography color='error'>{errors.role_priority}</Typography>}
          </FormControl>
        </Grid>
        {/* ====================== DESIGNATION SELECT ====================== */}
        {/* Department Selection */}
        <Grid item xs={12} md={6}>
          <FormControl fullWidth error={!!errors.department_id}>
            <InputLabel id="dept-label">Select Department *</InputLabel>
            <Select
              labelId="dept-label"
              label="Select Department *"
              value={selectedDepartmentId}
              onChange={(e) => {
                const dId = e.target.value;

                setSelectedDepartmentId(dId);

                // Reset designation when department changes
                setFormData(prev => ({ ...prev, department_id: dId, designation_id: '' }));
              }}
            >
              <MenuItem value="">Select Department</MenuItem>
              {departments.map((dept: any) => (
                <MenuItem key={dept._id} value={dept._id}>{dept.department}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        {/* Designation Selection */}
        {selectedDepartmentId && (
          <Grid item xs={12} md={6}>
            <FormControl fullWidth error={!!errors.designation_id}>
              <InputLabel id="desig-label">Select Designation *</InputLabel>
              <Select
                labelId="desig-label"
                label="Select Designation *"
                value={formData.designation_id || ''}
                onChange={(e) => {
                  const id = e.target.value;
                  const obj = allDesignations.find(d => d._id === id);

                  setFormData(prev => ({
                    ...prev,
                    designation_id: id,
                    designation: obj?.title || ''
                  }));
                }}
              >
                <MenuItem value="">Select Designation</MenuItem>
                {allDesignations
                  .filter((des: any) => {
                    // FIX: Match the ID string regardless of whether the list 
                    // data is a string or a populated object
                    const desDeptId = des.department_id?._id || des.department_id;


                    return desDeptId === selectedDepartmentId;
                  })
                  .map((des: any) => (
                    <MenuItem key={des._id} value={des._id}>
                      {des.title}
                    </MenuItem>
                  ))}
              </Select>
              {errors.designation_id && <Typography color="error">{errors.designation_id}</Typography>}
            </FormControl>
          </Grid>
        )}

        {/* Salary Input Field */}
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Salary (Monthly)"
            name="salary"
            type="number"
            value={formData.salary}
            onChange={handleChange}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  ₹
                </InputAdornment>
              )
            }}
            placeholder="65000"
            error={!!errors.salary}
            helperText={errors.salary}
          />
        </Grid>


        {role === '0' ? (
          <Grid item xs={12} md={6}>
            <FormControl fullWidth error={!!errors.company_id}>
              <Autocomplete
                id='company-select'
                options={companies}
                getOptionLabel={option => option.name}
                renderInput={params => <TextField {...params} label='Select Company' variant='outlined' />}
                value={companies.find(company => company._id === formData.company_id) || null}
                onChange={(event, newValue) => {
                  handleChange({ target: { name: 'company_id', value: newValue?._id || null } })
                }}
              />
              {errors.company_id && <Typography color='error'>{errors.company_id}</Typography>}
            </FormControl>
          </Grid>

        ) : null}
        {role > 0 && (
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
              InputProps={{
                startAdornment: (
                  <InputAdornment position='start'>
                    <BadgeIcon color='action' />
                  </InputAdornment>
                )
              }}
            />
          </Grid>
        )}
        {role > 0 && (
          <Grid item xs={12} md={6}>
            <FormControl fullWidth error={!!errors.location}>
              <LocationDropdown
                selectedLocation={formData.location}
                setSelectedLocation={location =>
                  setFormData(prevData => ({
                    ...prevData,
                    location // Update the location in formData state
                  }))
                }
              />
              {errors.location && <Typography color='error'>{errors.location}</Typography>}
            </FormControl>
          </Grid>
        )}

        <Grid item xs={12} md={6}>
          <Box display='flex' flexDirection='column'>
            <Button
              variant='contained'
              component='label'
              startIcon={<CloudUploadIcon />}
              sx={{
                backgroundColor: '#ff902f',
                '&:hover': {
                  backgroundColor: '#ff7f2f'
                }
              }}
            >
              Upload Image
              <input type='file' hidden accept='image/*' onChange={handleImageChange} />
            </Button>
            {imagePreviewUrl && (
              <img
                src={imagePreviewUrl}
                alt='Preview'
                style={{
                  maxHeight: '200px',
                  marginTop: '10px',
                  borderRadius: '8px',
                  objectFit: 'cover',
                  cursor: 'pointer', // Allow clicking on the image
                  border: imageFocus ? '3px solid #ff902f' : 'none' // Highlight the image when focused
                }}
                onClick={handleImageFocus} // Focus the image on click
                onBlur={handleImageBlur} // Remove focus when it loses focus
              />
            )}
            {errors.image && <Typography color='error'>{errors.image}</Typography>}
          </Box>
        </Grid>

        <Grid item xs={12}>
          <Box display='flex' justifyContent='center'>
            <Button
              startIcon={employee ? <EditIcon /> : <PersonAddIcon />}
              sx={{
                fontSize: '18px',
                fontWeight: 600,
                color: 'white',
                padding: 2,
                backgroundColor: '#ff902f',
                width: 250,
                borderRadius: 2,
                '&:hover': { backgroundColor: '#ff7f2f' }
              }}
              variant='contained'
              onClick={() => {
                const selectedDate = new Date(formData.dob)
                const today = new Date()

                let age = today.getFullYear() - selectedDate.getFullYear()
                const monthDiff = today.getMonth() - selectedDate.getMonth()
                const dayDiff = today.getDate() - selectedDate.getDate()

                // Adjust age if the birthday hasn't occurred yet this year
                if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
                  age--
                }

                if (age < 18) {
                  setErrors(prevErrors => ({
                    ...prevErrors,
                    dob: 'You must be at least 18 years old.'
                  }))

                  return
                }

                // if (formData.contact.length !== 10) {
                //   setErrors((prevErrors) => ({
                //     ...prevErrors,
                //     contact: "Please input exactly 10 digits",
                //   }));

                //   return;
                // }

                handleSubmit()
              }}
            >
              {employee ? 'UPDATE EMPLOYEE' : 'ADD EMPLOYEE'}
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Paper>
  )
}

export default EmployeeForm
