'use client'

import React, { useCallback, useEffect, useState } from 'react'

import { useTheme } from '@mui/material/styles'
import FileDownloadIcon from '@mui/icons-material/FileDownload'
import VisibilityIcon from '@mui/icons-material/Visibility'
import {
  Box,
  Typography,
  IconButton,
  Button,
  Grid,
  TextField,
  Dialog,
  DialogContent,
  FormHelperText,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Tooltip
} from '@mui/material'

import DownloadIcon from '@mui/icons-material/Download'
import FileOpenIcon from '@mui/icons-material/FileOpen'
import { debounce } from 'lodash'
import { ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

import type { GridColDef } from '@mui/x-data-grid'
import { DataGrid, GridToolbar } from '@mui/x-data-grid'

import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import CloseIcon from '@mui/icons-material/Close'
import AddIcon from '@mui/icons-material/Add'
import SearchIcon from '@mui/icons-material/Search'
import InputAdornment from '@mui/material/InputAdornment'
import { DriveFileRenameOutlineOutlined } from '@mui/icons-material'

import { useDispatch, useSelector } from 'react-redux'

import type { AppDispatch, RootState } from '@/redux/store'
import { fetchPolicies } from '@/redux/features/policies/policiesSlice'
import { utility } from '@/utility'

export default function PolicyGrid() {
  const dispatch: AppDispatch = useDispatch()
  const { policies, loading, error, filteredPolicies, total } = useSelector((state: RootState) => state.policies)

  const [showForm, setShowForm] = useState(false)
  const [selectedPolicy, setSelectedPolicy] = useState(null)
  const [userRole, setUserRole] = useState<string>('')
  const [userId, setUserId] = useState<string>('')
  const [selectedKeyword, setSelectedKeyword] = useState('')
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)

  const debouncedFetch = useCallback(
    debounce(() => {
      dispatch(fetchPolicies({ page, limit, keyword: selectedKeyword }))
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

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}')

    setUserRole(user.role)
    setUserId(user.id)
  }, [])

  function AddPolicyForm({ handleClose, policy }) {
    const user = typeof window !== "undefined" ? JSON.parse(localStorage?.getItem("user") || '{}') : {};
    const company_id = user?.company_id;

    const [formData, setFormData] = useState({
      name: '',
      description: '',
      file: null,
      company_id: company_id
    });

    console.log("company_id", company_id);
    const { capitalizeInput } = utility();

    const [errors, setErrors] = useState({
      name: '',
      description: '',
      file: ''
    })

    useEffect(() => {
      if (policy) {
        const selected = policies.find(p => p._id === policy)

        if (selected) {
          setFormData({
            name: selected.name,
            description: selected.description,
            file: null,
            company_id: selected.company_id
          });
        }
      }
    }, [policy, policies])

    const validateForm = () => {
      let isValid = true

      const newErrors = {
        name: '',
        description: '',
        file: ''
      }

      if (!formData.name.trim()) {
        newErrors.name = 'Policy name is required'
        isValid = false
      }

      if (!formData.description.trim()) {
        newErrors.description = 'Description is required'
        isValid = false
      }

      if (!formData.file && !policy) {
        newErrors.file = 'File is required'
        isValid = false
      }

      setErrors(newErrors)

      return isValid
    }

    const handleChange = e => {
      const { name, value, files } = e.target

      setFormData(prevState => ({
        ...prevState,
        [name]: files ? files[0] : value
      }))
    }

    const handleSubmit = () => {
      if (validateForm()) {
        const method = policy ? 'PUT' : 'POST'

        const url = policy
          ? `${process.env.NEXT_PUBLIC_APP_URL}/policies/update/${policy}`
          : `${process.env.NEXT_PUBLIC_APP_URL}/policies/create`

        const formPayload = new FormData()

        formPayload.append('name', formData.name)
        formPayload.append('description', formData.description)

        if (formData.file) {
          formPayload.append('file', formData.file)
        }

        formPayload.append('company_id', formData.company_id);

        fetch(url, {
          method,
          body: formPayload
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
          <Typography style={{ fontSize: '2em' }} variant='h5' gutterBottom>
            {policy ? 'Edit Policy' : 'Add Policy'}
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
            <TextField
              fullWidth
              label='Description'
              name='description'
              value={formData.description}
              onChange={e => {
                const { name, value } = e.target
                const [firstWord, ...rest] = value.split(' ')
                const capitalizedFirstWord = firstWord.charAt(0).toUpperCase() + firstWord.slice(1)
                const capitalizedValue = [capitalizedFirstWord, ...rest].join(' ')

                handleChange({ target: { name, value: capitalizedValue } })
              }}
              required
              error={!!errors.description}
              helperText={errors.description}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <Button variant='contained' component='label'>
              upload document
              <input
                type='file'
                name='file'
                hidden
                onChange={handleChange}
                required={!policy}
                style={{ marginTop: '16px' }}
              />
            </Button>
            {errors.file && <FormHelperText error>{errors.file}</FormHelperText>}
          </Grid>

          <Grid item xs={12}>
            <Button variant='contained' color='primary' onClick={handleSubmit}>
              {policy ? 'Update' : 'Add'} Policy
            </Button>
          </Grid>
        </Grid>
      </Box>
    )
  }

  const handlePolicyAddClick = () => {
    setSelectedPolicy(null)
    setShowForm(true)
  }

  const handlePolicyEditClick = id => {
    setSelectedPolicy(id)
    setShowForm(true)
  }

  const handleClose = () => {
    setShowForm(false)
  }

  const columns: GridColDef[] = [
    {
      field: 'name',
      headerName: 'Name',
      headerClassName: 'super-app-theme--header',
      flex: 1,
      headerAlign: 'center',
      align: 'center',
      sortable: false
    },

    {
      field: 'document_url',
      headerName: 'Open Document',
      headerClassName: 'super-app-theme--header',
      flex: 1,
      headerAlign: 'center',
      align: 'center',
      sortable: false,
      renderCell: params => {
        const documentUrl = params.value
        const previewUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(documentUrl)}&embedded=true`

        return (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              height: '100%'
            }}
          >
            <Tooltip
              title='Open Document'
              arrow
              componentsProps={{
                tooltip: {
                  sx: {
                    backgroundColor: '#333',
                    color: '#fff',
                    fontSize: '0.875rem',
                    boxShadow: 3
                  }
                }
              }}
            >
              {/* Using FileOpenIcon directly without a round button */}
              <FileOpenIcon
                onClick={() => {
                  window.open(previewUrl, '_blank')
                }}
                sx={{
                  fontSize: '2.5rem',
                  cursor: 'pointer',
                  color: 'royalblue',
                  transition: 'transform 0.2s ease-in-out',
                  '&:hover': {
                    transform: 'scale(1.1)',
                    color: '#6c63ff' // Change color on hover
                  }
                }}
              />
            </Tooltip>
          </Box>
        )
      }
    },

    {
      field: 'download',
      headerName: 'Download Document',
      headerClassName: 'super-app-theme--header',
      flex: 1.5,
      headerAlign: 'center',
      align: 'center',
      sortable: false,
      renderCell: params => {
        const documentUrl = params.row.document_url

        return (
          <Tooltip
            title='Download Document'
            arrow
            componentsProps={{
              tooltip: {
                sx: {
                  backgroundColor: '#333',
                  color: '#fff',
                  fontSize: '0.875rem',
                  boxShadow: 3
                }
              }
            }}
          >
            <FileDownloadIcon
              onClick={() => {
                const link = document.createElement('a')

                link.href = documentUrl
                link.download = documentUrl.split('/').pop()
                link.click()
              }}
              sx={{
                width: '48px',
                height: '48px',
                cursor: 'pointer',
                transition: 'transform 0.2s ease-in-out',
                color: 'royalblue',
                '&:hover': {
                  transform: 'scale(1.1)'
                }
              }}
            />
          </Tooltip>
        )
      }
    },

    {
      field: 'description',
      headerName: 'Description',
      headerClassName: 'super-app-theme--header',
      flex: 0.5,
      headerAlign: 'center',
      align: 'center',
      renderCell: params => {
        const [open, setOpen] = useState(false)
        const description = params.row?.description || 'No description available'

        const handleOpen = () => setOpen(true)
        const handleClose = () => setOpen(false)

        // Get the current theme mode (light or dark)
        const theme = useTheme()
        const textColor = theme.palette.mode === 'dark' ? 'white' : '#333'

        return (
          <Box display='flex' justifyContent='center' alignItems='center'>
            <Tooltip
              title='View description'
              arrow
              componentsProps={{
                tooltip: {
                  sx: {
                    backgroundColor: '#333',
                    color: '#fff',
                    fontSize: '0.875rem',
                    boxShadow: 3
                  }
                }
              }}
            >
              <IconButton
                onClick={handleOpen}
                color='primary'
                aria-label='View description'
                sx={{
                  padding: '8px',
                  minWidth: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  boxShadow: 2,
                  transition: 'transform 0.2s ease-in-out, background-color 0.3s',
                  '&:hover': {
                    backgroundColor: 'rgba(13, 146, 244, 0.1)',
                    transform: 'scale(1.1)'
                  },
                  '& .MuiSvgIcon-root': {
                    fontSize: '1.5rem',
                    color: '#0D92F4'
                  }
                }}
              >
                <VisibilityIcon />
              </IconButton>
            </Tooltip>

            <Dialog
              open={open}
              onClose={handleClose}
              maxWidth='md'
              fullWidth
              PaperProps={{
                sx: {
                  borderRadius: '12px',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)'
                }
              }}
            >
              <Box
                sx={{
                  p: 3,
                  background: 'linear-gradient(to right, #0D92F4, #6ab6f1)',
                  color: 'white',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <Typography
                  variant="h6"
                  component="h2"
                  sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    textAlign: 'center',
                    width: '100%',
                  }}
                >
                  Description Details
                </Typography>

                <IconButton
                  onClick={handleClose}
                  sx={{
                    color: 'white',
                    '&:hover': {
                      backgroundColor: 'rgba(255, 255, 255, 0.1)'
                    }
                  }}
                >
                  <CloseIcon />
                </IconButton>
              </Box>
              <DialogContent sx={{ p: 4 }}>
                <Typography
                  variant='body1'
                  sx={{
                    fontSize: '1rem',
                    lineHeight: 1.6,
                    color: textColor, // Conditionally set color based on theme mode
                    whiteSpace: 'pre-wrap'
                  }}
                >
                  {description}
                </Typography>
              </DialogContent>
            </Dialog >
          </Box >
        )
      }
    },

    ...(userRole === '1'
      ? [
        {
          field: 'edit',
          headerName: 'Edit',
          sortable: false,
          headerAlign: 'center',
          flex: 0.5,
          headerClassName: 'super-app-theme--header',
          renderCell: ({ row: { _id } }) => (
            <Box width='85%' m='0 auto' p='5px' display='flex' justifyContent='space-around'>
              <Button
                color='info'
                variant='contained'
                sx={{ minWidth: '50px' }}
                onClick={() => handlePolicyEditClick(_id)}
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
            <AddPolicyForm policy={selectedPolicy} handleClose={handleClose} />
          </DialogContent>
        </Dialog>
        <Box display='flex' justifyContent='space-between' alignItems='center' mb={2}>
          <Box>
            <Typography style={{ fontSize: '2em' }} variant='h5' gutterBottom>
              Policy
            </Typography>
            <Typography style={{ fontSize: '1em', fontWeight: 'bold' }} variant='subtitle1' gutterBottom>
              Dashboard / Policy
            </Typography>
          </Box>
          {userRole === '1' && (
            <Box display='flex' alignItems='center'>
              <Button
                style={{ borderRadius: 50, backgroundColor: '#ff902f' }}
                variant='contained'
                color='warning'
                startIcon={<AddIcon />}
                onClick={handlePolicyAddClick}
              >
                Add Policy
              </Button>
            </Box>
          )}
        </Box>
        <Grid container spacing={6} alignItems='center' mb={2}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label='search'
              variant='outlined'
              value={selectedKeyword}
              onChange={handleInputChange}
              InputProps={{
                sx: {
                  borderRadius: '50px'
                },
                endAdornment: (
                  <InputAdornment position='end'>
                    <SearchIcon />
                  </InputAdornment>
                )
              }}
            />
          </Grid>
        </Grid>
      </Box>

      <Box sx={{ width: '100%', padding: '0 4px' }}>
        {' '}
        <DataGrid
          getRowHeight={() => 'auto'}
          sx={{
            borderRadius: '12px',
            '& .MuiDataGrid-columnHeaders': {
              borderImage: 'linear-gradient(to right, #2193b0, #6dd5ed) 1',
              backgroundColor: 'rgb(59, 130, 246)',
              color: 'white'
            },
            '& .MuiDataGrid-cell': {
              fontSize: '14px',
              padding: '16px 8px',
              borderBottom: '1px solid rgba(224, 224, 224, 0.4)'
            },
            '& .super-app-theme--header': {
              color: 'white',
              fontSize: '16px',
              backgroundColor: 'rgb(9, 79, 194)'
            },

            '& .MuiDataGrid-columnHeaderCheckbox': {
              backgroundColor: 'rgb(9, 79, 194)'
            },

            '& .MuiDataGrid-cell--withRenderer .MuiCheckbox-root': {
              color: 'rgb(59, 130, 246)'
            },

            '& .MuiDataGrid-footerContainer': {
              backgroundColor: 'rgb(9, 79, 194)',
              color: 'white'
            },
            '& .MuiTablePagination-root': {
              color: 'white'
            },
            '& .MuiTablePagination-selectLabel': {
              color: 'white'
            },
            '& .MuiTablePagination-displayedRows': {
              color: 'white'
            },
            '& .MuiTablePagination-select': {
              color: 'white'
            },
            '& .MuiTablePagination-selectIcon': {
              color: 'white'
            },
            '& .MuiIconButton-root.Mui-disabled': {
              color: 'rgba(255, 255, 255, 0.5)'
            },
            '& .MuiIconButton-root': {
              color: 'white'
            }
          }}
          rows={filteredPolicies?.length > 0 ? filteredPolicies : policies}
          columns={columns}
          getRowId={row => row._id}
          paginationMode='server'
          rowCount={total}
          onPaginationModelChange={handlePaginationModelChange}
          pageSizeOptions={[10, 20, 30]}
          paginationModel={{ page: page - 1, pageSize: limit }}
          checkboxSelection
          disableRowSelectionOnClick
        />{' '}
      </Box>
    </Box>
  )
}
