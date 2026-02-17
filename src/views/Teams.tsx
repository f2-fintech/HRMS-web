'use client'

import React, { useCallback, useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { debounce } from 'lodash'
import { ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { useSelector, useDispatch } from 'react-redux'
import PreviewIcon from '@mui/icons-material/Preview'
import { Box, Grid, Typography, Button, TextField, Dialog, DialogContent, Alert, DialogActions } from '@mui/material'
import type { GridColDef } from '@mui/x-data-grid'
import { DataGrid } from '@mui/x-data-grid'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import { DriveFileRenameOutlineOutlined, Search, People, Code, Person } from '@mui/icons-material'
import { createTheme, ThemeProvider } from '@mui/material/styles'
import { fetchTeams } from '@/redux/features/teams/teamsSlice'
import { fetchEmployees } from '@/redux/features/employees/employeesSlice'
import type { RootState, AppDispatch } from '@/redux/store'
import { useSettings } from '@/@core/hooks/useSettings'

// Dynamically import components with loading states
const AddTeamForm = dynamic(() => import('../components/teams/AddTeamForm'), {
  ssr: false
})

const TeamDetailsDialog = dynamic(() => import('../components/teams/TeamDetailsDialog'), {
  ssr: false
})

export interface EmployeeType {
  _id: string
  first_name: string
  last_name: string
  image?: string
  designation?: string
  role_priority?: string
}

export interface TeamType {
  _id: string
  name: string
  manager_id: string
  employee_ids: string
  code: string
}

export default function TeamGrid() {
  const dispatch: AppDispatch = useDispatch()
  const { teams, total, loading, error } = useSelector((state: RootState) => state.teams)
  const { employees } = useSelector((state: RootState) => state.employees)
  const { settings } = useSettings()

  const [showForm, setShowForm] = useState(false)
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null)
  const [viewDetails, setViewDetails] = useState<TeamType | null>(null)
  const [selectedKeyword, setSelectedKeyword] = useState('')
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [userRole, setUserRole] = useState<string>('')
  const [openAlert, setOpenAlert] = useState(false)
  const [teamToDelete, setTeamToDelete] = useState<string | null>(null)

  // Check for mobile views
  const [isMobile, setIsMobile] = useState(false)

  // Enhanced theme with responsive design
  const theme = createTheme({
    palette: {
      mode: settings.mode === 'dark' ? 'dark' : 'light',
      primary: {
        main: '#2c3ce3'
      },
      secondary: {
        main: '#ff902f'
      },
      error: {
        main: '#f44336'
      },
      background: {
        default: settings.mode === 'dark' ? '#121212' : '#f7f9fc',
        paper: settings.mode === 'dark' ? '#1e1e1e' : '#ffffff',
      },
      text: {
        primary: settings.mode === 'dark' ? '#ffffff' : '#333333',
      }
    },
    typography: {
      fontFamily: "'Inter', 'Roboto', 'Arial', sans-serif",
      h4: {
        fontWeight: 700
      },
      h5: {
        fontWeight: 600
      },
      h6: {
        fontWeight: 600
      }
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: '8px',
            textTransform: 'none',
            fontWeight: 600
          }
        }
      },
      MuiDataGrid: {
        styleOverrides: {
          root: {
            border: 'none',
            '& .MuiDataGrid-columnHeader': {
              backgroundColor: '#2c3ce3',
              color: '#ffffff'
            }
          }
        }
      }
    }
  })

  // Check if on mobile device
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768)
    }

    handleResize() // Set initial value
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  // Debounced fetch
  const debouncedFetch = useCallback(
    debounce(() => {
      dispatch(fetchTeams({ page, limit, keyword: selectedKeyword }))
    }, 300),
    [page, limit, selectedKeyword, dispatch]
  )

  useEffect(() => {
    // Get userRole from localStorage
    const user = JSON.parse(localStorage.getItem('user') || '{}')
    setUserRole(user.role)
  }, [])

  useEffect(() => {
    debouncedFetch()
    return debouncedFetch.cancel
  }, [page, limit, selectedKeyword, debouncedFetch])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedKeyword(e.target.value)
  }

  const handlePageChange = (newPage: number, newPageSize: number) => {
    setPage(newPage + 1)
    setLimit(newPageSize)
  }

  const handlePaginationModelChange = (params: { page: number; pageSize: number }) => {
    handlePageChange(params.page, params.pageSize)
  }

  useEffect(() => {
    dispatch(fetchTeams({ page, limit, keyword: selectedKeyword }))
    if (employees.length === 0) {
      dispatch(fetchEmployees({ page: 1, limit: 0, search: '', designation: '' }))
    }
  }, [dispatch, page, limit, selectedKeyword, employees.length])

  const handleAddTeamClick = () => {
    setSelectedTeam(null)
    setShowForm(true)
  }

  const handleEditTeamClick = (id: string) => {
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

  // Deletion logic
  const confirmDeleteTeam = (id: string) => {
    setTeamToDelete(id)
    setOpenAlert(true)
  }

  const handleConfirmDelete = () => {
    if (teamToDelete) {
      fetch(`${process.env.NEXT_PUBLIC_APP_URL}/teams/delete/${teamToDelete}`, {
        method: 'DELETE'
      })
        .then(response => response.json())
        .then(data => {
          if (data.message) {
            toast.success(data.message, { position: 'top-center' })
            debouncedFetch()
          } else {
            toast.error('Error deleting team', { position: 'top-center' })
          }
        })
        .catch(error => {
          toast.error('Unexpected error occurred', { position: 'top-center' })
        })
        .finally(() => {
          setOpenAlert(false)
          setTeamToDelete(null)
        })
    }
  }

  // Utility Functions
  const getManagerNameById = (id: string, employees: EmployeeType[]) => {
    const manager = employees.find(employee => employee._id === id)
    return manager ? `${manager.first_name} ${manager.last_name}` : ''
  }

  const getEmployeeCountByIds = (ids: string, employees: EmployeeType[], managerId?: string) => {
    if (!ids) return 0
    const idArray = ids.split(',')
    const validIds = idArray.filter(id => employees.some(emp => emp._id === id))
    const isManagerIncluded = managerId && employees.some(emp => emp._id === managerId)
    return validIds.length + (isManagerIncluded ? 1 : 0)
  }

  const getEmployeeNamesByIds = (ids: string, employees: EmployeeType[]) => {
    if (!ids) return ''
    const idArray = ids.split(',')
    const names = idArray.map(id => {
      const employee = employees.find(emp => emp._id === id)
      return employee ? `${employee.first_name} ${employee.last_name}` : ''
    })
    return names.join(', ')
  }

  // Responsive columns based on screen size
  const columns: GridColDef[] = [
    {
      field: 'name',
      headerName: 'Team Name',
      flex: 1,
      minWidth: 150,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="body1" fontWeight={500}>
            {params.value}
          </Typography>
        </Box>
      )
    },
    {
      field: 'manager_id',
      headerName: 'Manager',
      flex: 1,
      minWidth: 160,
      renderCell: params => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Person fontSize="small" sx={{ color: theme.palette.primary.main }} />
          <Typography variant="body2">
            {getManagerNameById(params.value, employees)}
          </Typography>
        </Box>
      )
    },
    {
      field: 'employee_ids',
      headerName: 'Members',
      flex: 0.7,
      minWidth: 100,
      headerAlign: 'center',
      align: 'center',
      renderCell: params => {
        const count = getEmployeeCountByIds(params.value, employees, params.row.manager_id);
        return (
          <Box sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 1,
            bgcolor: theme.palette.mode === 'dark' ? 'rgba(66, 66, 255, 0.1)' : 'rgba(44, 60, 227, 0.08)',
            borderRadius: '16px',
            px: 2,
            py: 0.5
          }}>
            <People fontSize="small" />
            <Typography variant="body2">{count}</Typography>
          </Box>
        );
      }
    },
    {
      field: 'code',
      headerName: 'Code',
      minWidth: 100,
      flex: 0.6,
      renderCell: (params) => (
        <Box sx={{
          fontFamily: 'monospace',
          bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
          borderRadius: '4px',
          px: 1,
          py: 0.5
        }}>
          {params.value}
        </Box>
      )
    },
    ...(userRole === '1'
      ? [
        {
          field: 'actions',
          headerName: 'Actions',
          sortable: false,
          flex: 0.8,
          minWidth: 120,
          align: 'center',
          headerAlign: 'center',
          renderCell: ({ row: { _id } }) => (
            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', alignItems: 'center' }}>
              <Button
                color="info"
                variant="contained"
                size="small"
                sx={{ minWidth: '40px' }}
                onClick={() => handleEditTeamClick(_id)}
              >
                <DriveFileRenameOutlineOutlined fontSize="small" />
              </Button>
              <Button
                color="error"
                variant="contained"
                size="small"
                sx={{ minWidth: '40px' }}
                onClick={() => confirmDeleteTeam(_id)}
              >
                <DeleteIcon fontSize="small" />
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
      flex: 0.5,
      minWidth: 80,
      align: 'center',
      headerAlign: 'center',
      renderCell: ({ row }) => (
        <Button
          color="primary"
          variant="contained"
          size="small"
          sx={{ minWidth: '40px' }}
          onClick={() => handleViewDetails(row)}
        >
          <PreviewIcon fontSize="small" />
        </Button>
      )
    }
  ];

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ flexGrow: 1, padding: 2 }}>
        {/* Alert Dialog for Delete Confirmation */}
        <Dialog open={openAlert} onClose={() => setOpenAlert(false)}>
          <DialogContent>
            <Alert severity='warning'>Are you sure you want to delete this team? This action cannot be undone.</Alert>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenAlert(false)} color='primary'>
              Cancel
            </Button>
            <Button onClick={handleConfirmDelete} color='secondary' autoFocus>
              Confirm
            </Button>
          </DialogActions>
        </Dialog>

        {/* Toast Container */}
        <ToastContainer />

        {/* Dialog for Add/Edit Team Form */}
        <Dialog open={showForm} onClose={handleClose} fullWidth maxWidth='md'>
          <DialogContent>
            {/* Pass debouncedFetch so that form can refresh data after submit */}
            <AddTeamForm team={selectedTeam} handleClose={handleClose} debouncedFetch={debouncedFetch} />
          </DialogContent>
        </Dialog>

        {/* Dialog for Team Details */}
        <TeamDetailsDialog
          viewDetails={viewDetails}
          employees={employees}
          open={!!viewDetails}
          onClose={() => setViewDetails(null)}
          getEmployeeCountByIds={getEmployeeCountByIds}
        />

        {/* Header */}
        <Box display='flex' justifyContent='space-between' alignItems='center' mb={2}>
          <Box>
            <Typography style={{ fontSize: '2em', color: settings.mode === 'dark' ? 'white' : '#2c3ce3', }} variant='h5' gutterBottom>
              Team
            </Typography>
            <Typography
              style={{ color: settings.mode === 'dark' ? 'white' : '#2c3ce3', fontSize: '1em', fontWeight: 'bold' }}
              variant='subtitle1'
              gutterBottom
            >
              Dashboard / Team
            </Typography>
          </Box>
          <Box display='flex' alignItems='center'>
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

        {/* Search Input */}
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
        </Grid>

        {/* Data Grid */}
        <Grid item xs={12} sm={12} md={12}>
          <DataGrid
            sx={{
              height: 'calc(130vh - 200px)',
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
      </Box>
    </ThemeProvider>
  )
}
