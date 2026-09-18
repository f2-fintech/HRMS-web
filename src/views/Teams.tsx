'use client'

import React, { useCallback, useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { debounce } from 'lodash'
import { ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { useSelector, useDispatch } from 'react-redux'
import PreviewIcon from '@mui/icons-material/Preview'
import { Box, Grid, Typography, Button, TextField, Dialog, DialogContent, Alert, DialogActions, Paper, Avatar, IconButton } from '@mui/material'
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
import { utility } from '@/utility'

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

  // Professional & Simple Theme
  const theme = createTheme({
    palette: {
      mode: settings.mode === 'dark' ? 'dark' : 'light',
      primary: {
        main: '#2c3ce3',
      },
      background: {
        default: settings.mode === 'dark' ? '#121212' : '#f4f7fb',
        paper: settings.mode === 'dark' ? '#1e1e1e' : '#ffffff',
      }
    },
    typography: {
      fontFamily: "'Inter', sans-serif",
      h5: { fontWeight: 700 },
    },
    shape: {
      borderRadius: 8
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            fontWeight: 600,
            borderRadius: '6px',
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

    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Debounced fetch
  const debouncedFetch = useCallback(
    debounce(() => {
      dispatch(fetchTeams({ page, limit, keyword: selectedKeyword }))
    }, 300),
    [page, limit, selectedKeyword, dispatch]
  )

  useEffect(() => {
    const user = utility().decodedToken() || {}
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
            toast.success(data.message)
            debouncedFetch()
          } else {
            toast.error('Error deleting team')
          }
        })
        .catch(error => {
          toast.error('Unexpected error occurred')
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
    return manager ? `${manager.first_name} ${manager.last_name}` : 'Not Assigned'
  }

  const getEmployeeCountByIds = (ids: string, employees: EmployeeType[], managerId?: string) => {
    if (!ids) return 0
    const idArray = ids.split(',')
    const validIds = idArray.filter(id => employees.some(emp => emp._id === id))
    const isManagerIncluded = managerId && employees.some(emp => emp._id === managerId)
    return validIds.length + (isManagerIncluded ? 1 : 0)
  }

  // Professional Columns
  const columns: GridColDef[] = [
    {
      field: 'name',
      headerName: 'Team Name',
      flex: 1,
      minWidth: 180,
      renderCell: (params) => (
        <Typography variant="body2" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', height: '100%' }}>
          {params.value}
        </Typography>
      )
    },
    {
      field: 'manager_id',
      headerName: 'Team Lead',
      flex: 1,
      minWidth: 180,
      renderCell: params => (
        <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
          {getManagerNameById(params.value, employees)}
        </Typography>
      )
    },
    {
      field: 'employee_ids',
      headerName: 'Members',
      flex: 0.6,
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
            height: '100%',
            width: '100%'
          }}>
            <Box sx={{
              bgcolor: 'rgba(44, 60, 227, 0.1)',
              color: '#2c3ce3',
              borderRadius: '4px',
              px: 1.5,
              py: 0.25,
              fontWeight: 700,
              fontSize: '0.75rem'
            }}>
              {count}
            </Box>
          </Box>
        );
      }
    },
    {
      field: 'code',
      headerName: 'Code',
      minWidth: 100,
      flex: 0.5,
      headerAlign: 'center',
      align: 'center',
      renderCell: (params) => (
        <Typography variant="body2" sx={{ fontFamily: 'monospace', display: 'flex', alignItems: 'center', height: '100%' }}>
          {params.value}
        </Typography>
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
            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', alignItems: 'center', height: '100%' }}>
              <IconButton
                size="small"
                onClick={() => handleEditTeamClick(_id)}
                sx={{ color: '#2c3ce3' }}
              >
                <DriveFileRenameOutlineOutlined fontSize="small" />
              </IconButton>
              <IconButton
                size="small"
                onClick={() => confirmDeleteTeam(_id)}
                sx={{ color: 'error.main' }}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
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
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
          <IconButton
            size="small"
            onClick={() => handleViewDetails(row)}
            sx={{ color: '#2c3ce3' }}
          >
            <PreviewIcon fontSize="small" />
          </IconButton>
        </Box>
      )
    }
  ];

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ flexGrow: 1, p: { xs: 2, md: 3 } }}>
        <ToastContainer position="top-center" />

        {/* Delete Confirmation */}
        <Dialog open={openAlert} onClose={() => setOpenAlert(false)}>
          <DialogContent>
            <Typography variant="body1">Are you sure you want to delete this team?</Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenAlert(false)}>Cancel</Button>
            <Button onClick={handleConfirmDelete} color="error" variant="contained">Delete</Button>
          </DialogActions>
        </Dialog>

        {/* Form Dialog */}
        <Dialog open={showForm} onClose={handleClose} fullWidth maxWidth="md">
          <DialogContent>
            <AddTeamForm team={selectedTeam} handleClose={handleClose} debouncedFetch={debouncedFetch} />
          </DialogContent>
        </Dialog>

        {/* Details Dialog */}
        <TeamDetailsDialog
          viewDetails={viewDetails}
          employees={employees}
          open={!!viewDetails}
          onClose={() => setViewDetails(null)}
          getEmployeeCountByIds={getEmployeeCountByIds}
        />

        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Typography variant="h5" sx={{ color: '#2c3ce3', fontWeight: 700 }}>
              Team
            </Typography>
            <Typography variant="subtitle2" sx={{ color: 'text.secondary' }}>
              Dashboard / Team
            </Typography>
          </Box>
          {userRole === '1' && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleAddTeamClick}
              sx={{ bgcolor: '#ff902f', '&:hover': { bgcolor: '#e6822a' } }}
            >
              Add Team
            </Button>
          )}
        </Box>

        {/* Search */}
        <Box sx={{ mb: 3, width: { xs: '100%', md: 300 } }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Search teams..."
            value={selectedKeyword}
            onChange={handleInputChange}
            InputProps={{
              startAdornment: <Search sx={{ color: 'text.secondary', mr: 1, fontSize: 20 }} />,
            }}
          />
        </Box>

        {/* Data Grid */}
        <Paper sx={{ height: 650, width: '100%', borderRadius: 2, overflow: 'hidden' }}>
          <DataGrid
            rows={teams}
            columns={columns}
            getRowId={row => row._id}
            loading={loading}
            paginationMode="server"
            rowCount={total}
            pageSizeOptions={[10, 20, 50]}
            onPaginationModelChange={handlePaginationModelChange}
            paginationModel={{ page: page - 1, pageSize: limit }}
            checkboxSelection
            disableRowSelectionOnClick
            sx={{
              border: 'none',
              '& .MuiDataGrid-columnHeaders': {
                bgcolor: '#2c3ce3',
                color: '#ffffff',
                borderBottom: 'none',
              },
              '& .MuiDataGrid-columnHeader': {
                bgcolor: '#2c3ce3',
                color: '#ffffff',
                '&:focus': { outline: 'none' },
                '&:focus-within': { outline: 'none' },
              },
              '& .MuiDataGrid-columnHeaderTitle': {
                fontWeight: 700,
                color: '#ffffff',
              },
              '& .MuiDataGrid-iconButtonContainer': {
                color: '#ffffff',
              },
              '& .MuiDataGrid-menuIcon': {
                color: '#ffffff',
              },
              '& .MuiDataGrid-sortIcon': {
                color: '#ffffff',
              },
              '& .MuiCheckbox-root': {
                color: '#2c3ce3', // Row checkboxes
              },
              '& .MuiDataGrid-columnHeader .MuiCheckbox-root': {
                color: '#ffffff !important', // Header checkbox
              },
              '& .MuiDataGrid-cell': {
                display: 'flex',
                alignItems: 'center',
                borderColor: 'divider',
              },
              '& .MuiDataGrid-row:hover': {
                bgcolor: 'rgba(44, 60, 227, 0.04)',
              }
            }}
          />
        </Paper>
      </Box>
    </ThemeProvider>
  )
}
