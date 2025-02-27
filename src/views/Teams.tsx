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
import { DriveFileRenameOutlineOutlined } from '@mui/icons-material'
import { createTheme, ThemeProvider } from '@mui/material/styles'
import { fetchTeams } from '@/redux/features/teams/teamsSlice'
import { fetchEmployees } from '@/redux/features/employees/employeesSlice'
import type { RootState, AppDispatch } from '@/redux/store'
import { useSettings } from '@/@core/hooks/useSettings'

// Dynamically import the form and details dialog for code-splitting
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

// Utility Functions
export const getManagerNameById = (id: string, employees: EmployeeType[]) => {
  const manager = employees.find(employee => employee._id === id)
  return manager ? `${manager.first_name} ${manager.last_name}` : ''
}

export const getEmployeeCountByIds = (ids: string, employees: EmployeeType[], managerId?: string) => {
  if (!ids) return 0
  const idArray = ids.split(',')
  const validIds = idArray.filter(id => employees.some(emp => emp._id === id))
  const isManagerIncluded = managerId && employees.some(emp => emp._id === managerId)
  return validIds.length + (isManagerIncluded ? 1 : 0)
}

export const getEmployeeNamesByIds = (ids: string, employees: EmployeeType[]) => {
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
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null)
  const [viewDetails, setViewDetails] = useState<TeamType | null>(null)
  const [selectedKeyword, setSelectedKeyword] = useState('')
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [userRole, setUserRole] = useState<string>('')
  const [openAlert, setOpenAlert] = useState(false)
  const [teamToDelete, setTeamToDelete] = useState<string | null>(null)

  const { settings } = useSettings();

  // Debounced fetch
  const debouncedFetch = useCallback(
    debounce(() => {
      dispatch(fetchTeams({ page, limit, keyword: selectedKeyword }))
    }, 300),
    [page, limit, selectedKeyword]
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
    debouncedFetch()
  }

  useEffect(() => {
    if (teams.length === 0) {
      dispatch(fetchTeams({ page, limit, keyword: selectedKeyword }))
    }
    if (employees.length === 0) {
      dispatch(fetchEmployees({ page: 1, limit: 0, search: '', designation: '' }))
    }
  }, [dispatch, teams.length, employees.length, page, limit, selectedKeyword])

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
                onClick={() => confirmDeleteTeam(_id)}
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
        <Grid container spacing={6}>
          <Grid item xs={12} sm={6} md={12}>
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
        </Grid>
      </Box>
    </ThemeProvider>
  )
}
