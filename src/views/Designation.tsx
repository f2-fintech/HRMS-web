'use client'

import React, { useCallback, useEffect, useState } from 'react'

import { debounce } from 'lodash'
import { DataGrid, GridToolbar } from '@mui/x-data-grid'
import {
  Button,
  Typography,
  Box,
  Grid,
  IconButton,
  TextField,
  Dialog,
  FormControl,
  Select,
  InputLabel,
  MenuItem,
  DialogContent
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import AddIcon from '@mui/icons-material/Add'
import { DriveFileRenameOutlineOutlined } from '@mui/icons-material'
import { useDispatch, useSelector } from 'react-redux'

import { ToastContainer, toast } from 'react-toastify'

import type { AppDispatch, RootState } from '@/redux/store'
import { fetchDesignations } from '@/redux/features/designation/designationSlice'
import 'react-toastify/dist/ReactToastify.css'

const Designation = () => {
  const dispatch: AppDispatch = useDispatch()
  const { designations, loading, error, filteredDesignation, total } = useSelector(
    (state: RootState) => state.designations
  )
  const [showForm, setShowForm] = useState(false)
  const [selectedDesignation, setSelectedDesignation] = useState(null)
  const [userRole, setUserRole] = useState<string>('')
  const [userId, setUserId] = useState<string>('')
  const [selectedKeyword, setSelectedKeyword] = useState('')
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)

  const debouncedFetch = useCallback(
    debounce(() => {
      dispatch(fetchDesignations({ page, limit, keyword: selectedKeyword }))
    }, 300),
    [page, limit, selectedKeyword]
  )

  useEffect(() => {
    debouncedFetch()

    return debouncedFetch.cancel
  }, [page, limit, selectedKeyword, debouncedFetch])

  const handleInputChange = (e: { target: { value: React.SetStateAction<string> } }) => {
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
    const user = JSON.parse(localStorage.getItem('user') || '{}')

    setUserRole(user.role)
    setUserId(user.id)
  }, [])

  function AddDesignationForm({ id, handleClose }) {
    const user = typeof window !== 'undefined' ? JSON.parse(localStorage?.getItem('user') || '{}') : {}
    const company_id = user?.company_id
    const [formData, setFormData] = useState({
      title: '',
      description: '',
      grade: '',
      company_id: company_id
    })

    const [errors, setErrors] = useState({
      title: '',
      description: '',
      grade: ''
    })

    useEffect(() => {
      if (id) {
        const selected = designations.find(des => des._id === id)

        if (selected) {
          setFormData({
            title: selected.title,
            description: selected.description,
            grade: selected.grade,
            company_id: selected.company_id
          })
        }
      }
    }, [id, designations])

    const validateForm = () => {
      let isValid = true

      const newErrors = {
        title: '',
        description: '',
        grade: ''
      }

      if (!formData.title.trim()) {
        newErrors.title = 'title is required'
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

    const handleSubmit = () => {
      if (validateForm()) {
        const method = id ? 'PUT' : 'POST'
        const url = id
          ? `${process.env.NEXT_PUBLIC_APP_URL}/designation/update/${id}`
          : `${process.env.NEXT_PUBLIC_APP_URL}/designation/create`

        fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
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

            if (data.message.includes('success')) {
              handleClose()
              debouncedFetch()
            }
          })
          .catch(error => {
            toast.error('Error: ' + error.message, {
              position: 'top-center'
            })
          })
      }
    }

    return (
      <Box sx={{ flexGrow: 1, padding: 2 }}>
        <Box display='flex' justifyContent='space-between' alignItems='center'>
          <Typography style={{ fontSize: '2em' }} variant='h5' gutterBottom>
            {id ? 'Edit Designation' : 'Add Designation'}
          </Typography>
          <IconButton onClick={handleClose}>
            <CloseIcon />
          </IconButton>
        </Box>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label='Designation'
              name='title'
              value={formData.title}
              onChange={handleChange}
              required
              error={!!errors.title}
              helperText={errors.title}
              FormHelperTextProps={{
                style: { color: 'red' }
              }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label='Description'
              name='description'
              value={formData.description}
              onChange={handleChange}
              required
              error={!!errors.description}
              helperText={errors.description}
              FormHelperTextProps={{
                style: { color: 'red' }
              }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth error={!!errors.grade}>
              <InputLabel id='grade-select-label'>Select Grade</InputLabel>
              <Select
                label='Select Grade'
                labelId='grade-select-label'
                id='grade-select'
                name='grade'
                value={formData.grade}
                onChange={handleChange}
                fullWidth
              >
                <MenuItem value='1'>1</MenuItem>
                <MenuItem value='2'>2</MenuItem>
                <MenuItem value='3'>3</MenuItem>
                <MenuItem value='4'>4</MenuItem>
                <MenuItem value='5'>5</MenuItem>
                <MenuItem value='6'>6</MenuItem>
                <MenuItem value='7'>7</MenuItem>
                <MenuItem value='8'>8</MenuItem>
                <MenuItem value='9'>9</MenuItem>
                <MenuItem value='10'>10</MenuItem>
                <MenuItem value='11'>11</MenuItem>
                <MenuItem value='12'>12</MenuItem>
                <MenuItem value='13'>13</MenuItem>
                <MenuItem value='14'>14</MenuItem>
                <MenuItem value='15'>15</MenuItem>
              </Select>
              {errors.grade && <Typography color='error'>{errors.grade}</Typography>}
            </FormControl>
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
              {id ? 'Edit Designation' : 'Add Designation'}
            </Button>
          </Grid>
        </Grid>
      </Box>
    )
  }

  const handleDesignationAddClick = () => {
    setSelectedDesignation(null)
    setShowForm(true)
  }

  const handleDesignationEditClick = (id: React.SetStateAction<null>) => {
    setSelectedDesignation(id)
    setShowForm(true)
  }

  const handleClose = () => {
    setShowForm(false)
  }

  const columns: GridColDef[] = [
    {
      sortable: true,
      field: 'lineNo',
      headerName: '#',
      headerClassName: 'super-app-theme--header',
      flex: 0,
      editable: false,
      renderCell: (params: { api: { getAllRowIds: () => string | any[] }; id: any }) =>
        params.api.getAllRowIds().indexOf(params.id) + 1
    },
    {
      field: 'title',
      headerName: 'Title',
      headerClassName: 'super-app-theme--header',
      flex: 2,
      headerAlign: 'center',
      align: 'center',
      sortable: false
    },
    {
      field: 'description',
      headerName: 'Description',
      headerClassName: 'super-app-theme--header',
      flex: 2,
      headerAlign: 'center',
      align: 'center',
      sortable: false
    },
    {
      field: 'grade',
      headerName: 'Grade',
      headerClassName: 'super-app-theme--header',
      flex: 2,
      headerAlign: 'center',
      align: 'center',
      sortable: false
    },
    ...(userRole === '1'
      ? [
        {
          field: 'edit',
          headerName: 'Edit',
          sortable: false,
          headerAlign: 'center',
          width: 160,
          headerClassName: 'super-app-theme--header',
          renderCell: ({ row: { _id } }) => (
            <Box width='85%' m='0 auto' p='5px' display='flex' justifyContent='space-around'>
              <Button
                color='info'
                variant='contained'
                sx={{ minWidth: '50px', backgroundColor: '#2c3ce3' }}
                onClick={() => handleDesignationEditClick(_id)}
              >
                <DriveFileRenameOutlineOutlined />
              </Button>
            </Box>
          )
        }
      ]
      : [])
  ]

  return (
    <Box>
      <ToastContainer />
      <Box sx={{ flexGrow: 1, padding: 2 }}>
        <Dialog open={showForm} onClose={handleClose} fullWidth maxWidth='md'>
          <DialogContent>
            <AddDesignationForm id={selectedDesignation} handleClose={handleClose} />
          </DialogContent>
        </Dialog>
        <Box display='flex' justifyContent='space-between' alignItems='center' mb={2}>
          <Box>
            <Typography style={{ fontSize: '2em' }} variant='h5' gutterBottom>
              Designation
            </Typography>
            <Typography style={{ fontSize: '1em', fontWeight: 'bold' }} variant='subtitle1' gutterBottom>
              Dashboard / Designation
            </Typography>
          </Box>
          {userRole === '1' && (
            <Box display='flex' alignItems='center'>
              <Button
                style={{ borderRadius: 50, backgroundColor: '#ff902f' }}
                variant='contained'
                color='warning'
                startIcon={<AddIcon />}
                onClick={handleDesignationAddClick}
              >
                Add Designation
              </Button>
            </Box>
          )}
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
        </Grid>
      </Box>
      <Box sx={{ width: '100%' }}>
        <DataGrid
          sx={{
            height: 'calc(130vh - 200px)',
            '& .super-app-theme--header': {
              fontSize: 17,
              fontWeight: 600,
              alignItems: 'center'
            },
            '& .mui-yrdy0g-MuiDataGrid-columnHeaderRow ': {
              background: '#2c3ce3 !important',
              color: 'white'
            },
            '& .MuiDataGrid-cell': {
              fontSize: '10',
              align: 'center'
            },
            '& .MuiDataGrid-row': {
              '&:nth-of-type(odd)': {
                backgroundColor: 'rgb(46 38 61 / 12%)'
              },
              '&:nth-of-type(even)': {
                backgroundColor: '#fffff'
              },
              fontWeight: '600',
              fontSize: '14px',
              boxSizing: 'border-box'
            }
          }}
          components={{
            Toolbar: GridToolbar
          }}
          rows={filteredDesignation.length > 0 ? filteredDesignation : designations}
          columns={columns}
          getRowId={row => row._id}
          paginationMode='server'
          rowCount={total}
          onPaginationModelChange={handlePaginationModelChange}
          pageSizeOptions={[10, 20, 30]}
          paginationModel={{ page: page - 1, pageSize: limit }}
          checkboxSelection
          disableRowSelectionOnClick
        />
      </Box>
    </Box>
  )
}

export default Designation
