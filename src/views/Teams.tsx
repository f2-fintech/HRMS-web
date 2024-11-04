'use client'

import React, { useCallback, useEffect, useState } from 'react'

import { debounce } from 'lodash'
import { ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import Autocomplete from '@mui/material/Autocomplete'
import { useSelector, useDispatch } from 'react-redux'
import PreviewIcon from '@mui/icons-material/Preview'
import {
  Box,
  Grid,
  Typography,
  Card,
  CardContent,
  CardMedia,
  CardActions,
  Avatar,
  TextField,
  Button,
  Select,
  MenuItem,
  IconButton,
  Dialog,
  DialogContent,
  InputLabel,
  FormControl,
  CardHeader,
  FormHelperText,
  Alert,
  DialogActions
} from '@mui/material'
import type { GridColDef } from '@mui/x-data-grid'
import { DataGrid } from '@mui/x-data-grid'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import ViewModuleIcon from '@mui/icons-material/ViewModule'
import ViewListIcon from '@mui/icons-material/ViewList'
import { DriveFileRenameOutlineOutlined } from '@mui/icons-material'
import CloseIcon from '@mui/icons-material/Close'
import { createTheme, ThemeProvider } from '@mui/material/styles'

import type { RootState, AppDispatch } from '../redux/store'
import { fetchTeams } from '../redux/features/teams/teamsSlice'
import { fetchEmployees } from '@/redux/features/employees/employeesSlice'

import { utility } from '@/utility'

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2'
    },
    secondary: {
      main: '#7b1fa2'
    }
  },
  typography: {
    h4: {
      fontWeight: 700
    },
    h6: {
      fontWeight: 600
    }
  }
})

const getManagerNameById = (id, employees) => {
  const manager = employees.find(employee => employee._id === id)

  return manager ? `${manager.first_name} ${manager.last_name}` : ''
}

const getEmployeeCountByIds = (ids, employees, managerId) => {
  if (!ids) return 0

  const idArray = ids.split(',')

  const validIds = idArray.filter(id => employees.some(emp => emp._id === id))

  const isManagerIncluded = employees.some(emp => emp._id === managerId)

  return validIds.length + (isManagerIncluded ? 1 : 0)
}

const getEmployeeNamesByIds = (ids, employees) => {
  if (!ids) return ''
  const idArray = ids.split(',')

  const names = idArray.map(id => {
    const employee = employees.find(emp => emp._id === id)

    return employee ? `${employee.first_name} ${employee.last_name}` : ''
  })

  return names.join(', ')
}

export default function TeamGrid() {
  const dispatch: AppDispatch = useDispatch()
  const { teams, total, loading, error } = useSelector((state: RootState) => state.teams)
  const { employees } = useSelector((state: RootState) => state.employees)

  const [showForm, setShowForm] = useState(false)
  const [selectedTeam, setSelectedTeam] = useState(null)
  const [viewDetails, setViewDetails] = useState<TeamType | null>(null)
  const [selectedKeyword, setSelectedKeyword] = useState('')
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [userRole, setUserRole] = useState<string>('')
  const [openAlert, setOpenAlert] = useState(false); // Control for alert visibility
  const [teamToDelete, setTeamToDelete] = useState<string | null>(null); // Store the team ID to be deleted

  const { capitalizeInput } = utility()

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}')

    setUserRole(user.role)
  }, [])

  const debouncedFetch = useCallback(
    debounce(() => {
      dispatch(fetchTeams({ page, limit, keyword: selectedKeyword }))
    }, 300),
    [page, limit, selectedKeyword]
  )

  useEffect(() => {
    debouncedFetch()

    return debouncedFetch.cancel
  }, [page, limit, selectedKeyword, debouncedFetch])

  const handleInputChange = e => {
    setSelectedKeyword(e.target.value)
  }

  const handlePageChange = (newPage: number, newPageSize: number) => {
    setPage(newPage + 1)
    setLimit(newPageSize)
  }

  const handlePaginationModelChange = (params: { page: number; pageSize: number }) => {
    handlePageChange(params.page, params.pageSize)
    debouncedFetch()
  }

  function AddTeamForm({ handleClose, team }) {
    const { teams } = useSelector((state: RootState) => state.teams)
    const { employees } = useSelector((state: RootState) => state.employees)

    const [formData, setFormData] = useState({
      manager_id: '',
      employee_ids: '',
      name: '',
      code: ''
    })

    const [errors, setErrors] = useState({
      name: '',
      manager_id: '',
      employee_ids: '',
      code: ''
    })

    const [selectedEmployees, setSelectedEmployees] = useState([])

    useEffect(() => {
      if (team) {
        const selected = teams.find(t => t._id === team)

        if (selected) {
          setFormData({
            manager_id: selected.manager_id,
            employee_ids: selected.employee_ids,
            name: selected.name,
            code: selected.code
          })
          setSelectedEmployees(
            selected.employee_ids
              .split(',')
              .map(id => employees.find(emp => emp._id === id))
              .filter(Boolean)
          )
        }
      }
    }, [team, teams, employees])

    const validateForm = () => {
      let isValid = true

      const newErrors = {
        name: '',
        manager_id: '',
        employee_ids: '',
        code: ''
      }

      if (!formData.name.trim()) {
        newErrors.name = 'Team name is required'
        isValid = false
      }

      if (!formData.manager_id) {
        newErrors.manager_id = 'Manager selection is required'
        isValid = false
      }

      if (!formData.employee_ids) {
        newErrors.employee_ids = 'At least one employee must be selected'
        isValid = false
      }

      if (!formData.code.trim()) {
        newErrors.code = 'Team code is required'
        isValid = false
      }

      setErrors(newErrors)

      return isValid
    }

    const handleChange = e => {
      const { name, value } = e.target

      setFormData(prevState => ({
        ...prevState,
        [name]: value
      }))
    }

    const handleEmployeeChange = (event, value) => {
      const employeeIds = value.map(emp => emp._id).join(',')

      setSelectedEmployees(value)
      setFormData(prevState => ({
        ...prevState,
        employee_ids: employeeIds
      }))
    }

    const handleSubmit = () => {
      if (validateForm()) {
        const method = team ? 'PUT' : 'POST'
        const url = team
          ? `${process.env.NEXT_PUBLIC_APP_URL}/teams/update/${team}`
          : `${process.env.NEXT_PUBLIC_APP_URL}/teams/create`

        fetch(url, {
          method,
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(formData)
        })
          .then(response => response.json())
          .then(data => {
            if (data.message) {
              if (data.message.includes('success')) {
                toast.success(data.message, {
                  position: 'top-center'
                })
              } else {
                toast.error('Error: ' + data.message, {
                  position: 'top-center'
                })
              }
            } else {
              toast.error('Unexpected error occurred', {
                position: 'top-center'
              })
            }

            handleClose()
            debouncedFetch()
          })
          .catch(error => {
            console.log('Error', error)
          })
      }
    }

    return (
      <Box sx={{ flexGrow: 1, padding: 2 }}>
        <Box display='flex' justifyContent='space-between' alignItems='center'>
          <Typography style={{ fontSize: '2em', color: 'black' }} variant='h5' gutterBottom>
            {team ? 'Edit Team' : 'Add Team'}
          </Typography>
          <IconButton onClick={handleClose}>
            <CloseIcon />
          </IconButton>
        </Box>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label='Name'
              name='name'
              value={formData.name}
              onChange={e => capitalizeInput(e, handleChange)}
              required
              error={!!errors.name}
              helperText={errors.name}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth error={!!errors.manager_id}>
              <InputLabel required id='demo-simple-select-label'>
                Select Manager
              </InputLabel>
              <Select
                label='Select Manager'
                labelId='demo-simple-select-label'
                id='demo-simple-select'
                name='manager_id'
                value={formData.manager_id}
                onChange={handleChange}
                required
                error={!!errors.manager_id}
              >
                {employees
                  .filter(employee => employee.role_priority === '2')
                  .map(employee => (
                    <MenuItem key={employee._id} value={employee._id}>
                      {employee.first_name} {employee.last_name}
                    </MenuItem>
                  ))}
              </Select>
              {errors.manager_id && <FormHelperText error>{errors.manager_id}</FormHelperText>}
            </FormControl>
          </Grid>
          <Grid item xs={12} md={6}>
            <Autocomplete
              multiple
              id='checkboxes-tags-demo'
              options={employees}
              disableCloseOnSelect
              getOptionLabel={option => `${option.first_name} ${option.last_name}`}
              value={selectedEmployees}
              onChange={handleEmployeeChange}
              renderOption={(props, option, { selected }) => (
                <li {...props}>
                  {option.first_name} {option.last_name}
                </li>
              )}
              renderInput={params => (
                <TextField
                  {...params}
                  label='Select Employees'
                  placeholder='Favorites'
                  error={!!errors.employee_ids}
                  helperText={errors.employee_ids}
                />
              )}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label='Code'
              name='code'
              value={formData.code}
              onChange={handleChange}
              required
              error={!!errors.code}
              helperText={errors.code}
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
                width: 200
              }}
              variant='contained'
              fullWidth
              onClick={handleSubmit}
            >
              {team ? 'UPDATE TEAM' : 'ADD TEAM'}
            </Button>
          </Grid>
        </Grid>
      </Box>
    )
  }

  useEffect(() => {
    if (teams.length === 0) {
      dispatch(fetchTeams({ page, limit, keyword: selectedKeyword }))
    }

    if (employees.length === 0) {
      dispatch(fetchEmployees({ page: 1, limit: 0, search: '', designation: '' }))
    }
  }, [dispatch, teams.length, employees.length])

  const handleAddTeamClick = () => {
    setSelectedTeam(null)
    setShowForm(true)
  }

  const handleEditTeamClick = id => {
    setSelectedTeam(id)
    setShowForm(true)
  }

  const handleClose = () => {
    setShowForm(false)
    setViewDetails(null)
  }

  const handleViewDetails = (team: TeamType) => {
    setViewDetails(team)
  }

  const confirmDeleteTeam = (id: string) => {
    setTeamToDelete(id); // Set the team ID to be deleted
    setOpenAlert(true); // Open the alert dialog
  };


  const handleConfirmDelete = () => {
    if (teamToDelete) {
      fetch(`${process.env.NEXT_PUBLIC_APP_URL}/teams/delete/${teamToDelete}`, {
        method: 'DELETE'
      })
        .then(response => response.json())
        .then(data => {
          if (data.message) {
            toast.success(data.message, {
              position: 'top-center'
            });
            debouncedFetch();
          } else {
            toast.error('Error deleting team', {
              position: 'top-center'
            });
          }
        })
        .catch(error => {
          console.log('Error', error);
          toast.error('Unexpected error occurred', {
            position: 'top-center'
          });
        })
        .finally(() => {
          setOpenAlert(false); // Close the alert
          setTeamToDelete(null); // Reset the team ID
        });
    }
  };


  const columns: GridColDef[] = [
    {
      field: 'name',
      headerName: 'Team Name',
      editable: true,
      flex: 1
    },
    {
      field: 'manager_id',
      headerName: 'Manager Name',
      editable: true,
      renderCell: params => getManagerNameById(params.value, employees),
      flex: 1
    },
    {
      field: 'employee_ids',
      headerName: 'No. of Employees',
      editable: true,
      renderCell: params => getEmployeeCountByIds(params.value, employees, params.row.manager_id),

      flex: 1,
      headerAlign: 'center',
      align: 'center'
    },
    {
      field: 'code',
      headerName: 'Code',
      editable: true
    },
    ...(userRole === '1'
      ? [
        {
          field: 'edit',
          headerName: 'Edit',
          sortable: false,
          flex: 1,
          headerAlign: 'center',
          renderCell: ({ row: { _id } }) => (
            <Box width='85%' m='0 auto' p='5px' display='flex' justifyContent='space-around'>
              <Button
                color='info'
                variant='contained'
                sx={{ minWidth: '50px' }}
                onClick={() => handleEditTeamClick(_id)}
              >
                <DriveFileRenameOutlineOutlined />
              </Button>
              <Button
                color='error'
                variant='contained'
                sx={{ minWidth: '50px' }}
                onClick={() => confirmDeleteTeam(_id)} // Call confirmDeleteTeam here
              >
                <DeleteIcon />
              </Button>

            </Box>
          )
        }
      ]
      : []),

    {
      field: 'view',
      headerName: 'View',
      sortable: false,
      align: 'center',

      headerAlign: 'center',
      renderCell: ({ row }) => (
        <Button color='primary' variant='contained' sx={{ minWidth: '50px' }} onClick={() => handleViewDetails(row)}>
          <PreviewIcon />
        </Button>
      )
    }
  ]

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ flexGrow: 1, padding: 2 }}>
        <Dialog open={openAlert} onClose={() => setOpenAlert(false)}>
          <DialogContent>
            <Alert severity="warning">
              Are you sure you want to delete this team? This action cannot be undone.
            </Alert>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenAlert(false)} color="primary">
              Cancel
            </Button>
            <Button onClick={handleConfirmDelete} color="secondary" autoFocus>
              Confirm
            </Button>
          </DialogActions>
        </Dialog>

        <ToastContainer />
        <Dialog open={showForm} onClose={handleClose} fullWidth maxWidth='md'>
          <DialogContent>
            <AddTeamForm team={selectedTeam} handleClose={handleClose} />
          </DialogContent>
        </Dialog>
        <Dialog
          open={!!viewDetails}
          onClose={() => setViewDetails(null)}
          fullWidth
          maxWidth='md'
          PaperProps={{
            sx: {
              width: '100%',
              maxWidth: { xs: '100%', sm: 600, md: 900 },
              margin: { xs: 0, sm: 2 },
              height: { xs: '100%', sm: 'auto' },
              maxHeight: { xs: '100%', sm: 'calc(100% - 64px)' },
              borderRadius: { xs: 0, sm: '20px' },
            }
          }}
        >
          <DialogContent sx={{
            padding: { xs: 2, sm: 3 },
            overflow: 'auto',
            height: { xs: '100vh', sm: 'auto' }
          }}>
            {/* Header */}
            <Box sx={{
              backgroundColor: '#7b1fa2',
              padding: '10px',
              color: 'white',
              position: 'relative',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              flexDirection: 'column'


            }}>
              <Typography variant="h4" fontWeight="bold" sx={{ zIndex: 1, position: 'relative' }}>
                {viewDetails?.name.toUpperCase()}
              </Typography>
              <Typography variant="h6" sx={{ opacity: 0.8, zIndex: 1, position: 'relative' }}>
                Team Code: {viewDetails?.code}
              </Typography>
              <Box sx={{
                position: 'absolute',
                top: -20,
                right: -20,
                width: 200,
                height: 200,
                borderRadius: '50%',
                backgroundColor: 'rgba(255,255,255,0.1)',
                zIndex: 1
              }} />
            </Box>

            {/* Content */}
            <Box sx={{
              padding: { xs: '10px', sm: '20px', md: '30px' },
              display: 'flex',
              flexDirection: { xs: 'column', lg: 'row' },
              gap: { xs: 2, md: 4 }
            }}>
              {/* Manager Section */}
              <Card elevation={3} sx={{
                flex: 1,
                borderRadius: '15px',
                overflow: 'hidden',
                transition: 'all 0.3s ease',
                height: '100%',
                '&:hover': { transform: 'translateY(-5px)', boxShadow: 6 }
              }}>
                <CardHeader
                  title="Team Manager"
                  sx={{ backgroundColor: '#7b1fa2', color: 'white' }}
                />
                <CardContent sx={{ padding: '20px' }}>
                  {(() => {
                    const manager = employees.find(emp => emp._id === viewDetails?.manager_id);


                    return manager ? (
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                        <Avatar
                          src={manager.image}
                          sx={{ width: 80, height: 80, border: '3px solid #7b1fa2' }}
                        />
                        <Box>
                          <Typography variant="h6"  >{`${manager.first_name} ${manager.last_name}`}</Typography>
                          <Typography variant="body2" color="textSecondary"
                            sx={{ textAlign: 'center' }}
                          >{manager.designation}</Typography>
                        </Box>
                      </Box>
                    ) : <Typography>No manager assigned</Typography>
                  })()}
                </CardContent>
              </Card>

              {/* Employees Section */}
              <Card elevation={3} sx={{
                flex: 2,
                borderRadius: '15px',
                overflowY: 'auto',
                transition: 'all 0.3s ease',
                '&:hover': { transform: 'translateY(-5px)', boxShadow: 6 },
                height: "285px",
                position: 'relative',


                '&::-webkit-scrollbar': {
                  width: '12px',
                  background: 'transparent',
                },
                '&::-webkit-scrollbar-track': {
                  background: 'rgba(0,0,0,0.1)',
                  borderRadius: '10px',
                  margin: '10px 0',
                },
                '&::-webkit-scrollbar-thumb': {
                  background: 'linear-gradient(45deg, #6a11cb 0%, #2575fc 100%)',
                  borderRadius: '10px',
                  border: '3px solid transparent',
                  backgroundClip: 'content-box',
                  '&:hover': {
                    background: 'linear-gradient(45deg, #8e2de2 0%, #4a00e0 100%)',
                    backgroundClip: 'content-box',
                  },
                },


                '&::after': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  right: 0,
                  width: '12px',
                  height: '100%',
                  background: 'rgba(255,255,255,0.1)',
                  borderRadius: '0 15px 15px 0',
                  pointerEvents: 'none',
                },


                scrollbarWidth: 'thin',
                scrollbarColor: '#6a11cb transparent',
              }}>


                <CardHeader
                  title="Team Members"
                  sx={{ backgroundColor: '#7b1fa2', color: 'white' }}
                />
                <CardContent sx={{ padding: '20px' }}>
                  <Grid container spacing={2}>
                    {viewDetails?.employee_ids.split(',').map(id => {
                      const employee = employees.find(emp => emp._id === id);


                      return employee ? (
                        <Grid item xs={6} sm={4} key={id}>
                          <Box sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            textAlign: 'center',
                            padding: '10px',
                            borderRadius: '10px',
                            backgroundColor: '#f3e5f5',
                            transition: 'all 0.3s ease',
                            height: '100%',
                            '&:hover': { backgroundColor: '#e1bee7', transform: 'scale(1.05)' }
                          }}>
                            <Avatar
                              src={employee.image}
                              sx={{ width: 60, height: 60, marginBottom: 1, border: '2px solid #7b1fa2' }}
                            />
                            <Typography variant="body2" fontWeight="bold">{`${employee.first_name} ${employee.last_name}`}</Typography>
                            <Typography variant="caption" color="textSecondary">{employee.designation}</Typography>
                          </Box>
                        </Grid>
                      ) : null;
                    })}
                  </Grid>
                </CardContent>
              </Card>
            </Box>

            {/* Footer */}
            <Box sx={{
              backgroundColor: '#ede7f6',
              padding: '20px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <Typography variant="body2" color="textSecondary">
                Total Members: {viewDetails ? getEmployeeCountByIds(viewDetails.employee_ids, employees) + 1 : 1}
              </Typography>
              <Button
                variant="contained"
                color="secondary"
                onClick={() => setViewDetails(null)}
                sx={{
                  borderRadius: '20px',
                  textTransform: 'none',
                  fontWeight: 'bold'
                }}
              >
                Close
              </Button>
            </Box>
          </DialogContent>
        </Dialog>
        <Box display='flex' justifyContent='space-between' alignItems='center' mb={2}>
          <Box>
            <Typography style={{ fontSize: '2em', color: 'black' }} variant='h5' gutterBottom>
              Team
            </Typography>
            <Typography
              style={{ color: '#212529bf', fontSize: '1em', fontWeight: 'bold' }}
              variant='subtitle1'
              gutterBottom
            >
              Dashboard / Team
            </Typography>
          </Box>
          <Box display='flex' alignItems='center'>
            {/* <IconButton
              style={{ backgroundColor: '#ff902f', borderRadius: 10, color: 'white', marginRight: 10 }}
              aria-label='grid view'
            >
              <ViewModuleIcon />
            </IconButton>
            <IconButton
              style={{ backgroundColor: '#fff', color: '#4d5154', borderRadius: 10, marginRight: 10 }}
              aria-label='list view'
            >
              <ViewListIcon />
            </IconButton> */}
            {userRole === '1' && (
              <Button
                style={{ borderRadius: 50, backgroundColor: '#ff902f' }}
                variant='contained'
                color='warning'
                startIcon={<AddIcon />}
                onClick={handleAddTeamClick}
              >
                Add Team
              </Button>
            )}
          </Box>
        </Box>
        <Grid container spacing={6} alignItems='center' mb={2}>
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              label='search'
              variant='outlined'
              value={selectedKeyword}
              onChange={handleInputChange}
            />
          </Grid>

          {/* <Grid item xs={12} md={3}>
            <Button style={{ padding: 15, backgroundColor: '#198754' }} variant='contained' fullWidth>
              SEARCH
            </Button>
          </Grid> */}
        </Grid>
        <Grid container spacing={6}>
          <Grid item xs={12} sm={6} md={12}>
            <DataGrid
              sx={{
                '& .mui-yrdy0g-MuiDataGrid-columnHeaderRow ': {
                  background: '#2c3ce3 !important',
                  color: 'white'
                }
              }}
              rows={teams}
              columns={columns}
              getRowId={row => row._id}
              paginationMode='server'
              rowCount={total}
              pageSizeOptions={[10, 20, 30]}
              onPaginationModelChange={handlePaginationModelChange}
              paginationModel={{ page: page - 1, pageSize: limit }}
              checkboxSelection
              disableRowSelectionOnClick
            />
          </Grid>
        </Grid>
      </Box>
    </ThemeProvider>
  )
}
