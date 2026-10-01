'use client'
import { useCallback, useEffect, useMemo, useState } from 'react'

import { debounce } from 'lodash'
import { ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import type { SelectChangeEvent } from '@mui/material'
import {
  Avatar,
  Button,
  Dialog,
  DialogContent,
  FormControl,
  Grid,
  IconButton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  TextField,
  Typography,
  FormHelperText,
  Autocomplete,
  Divider,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody
} from '@mui/material'
import { styled } from '@mui/material/styles'
import Box from '@mui/material/Box'
import { DataGrid } from '@mui/x-data-grid'
import CloseIcon from '@mui/icons-material/Close'
import AddIcon from '@mui/icons-material/Add'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import { format } from 'date-fns'
import SearchIcon from '@mui/icons-material/Search'
import DeleteIcon from '@mui/icons-material/Delete'
import InputAdornment from '@mui/material/InputAdornment'
import { DriveFileRenameOutlineOutlined, Padding } from '@mui/icons-material'
import { useDispatch, useSelector } from 'react-redux'

import type { AppDispatch, RootState } from '@/redux/store'
import { fetchAssests } from '@/redux/features/assests/assestsSlice'
import { fetchEmployees } from '@/redux/features/employees/employeesSlice'
import { fetchAddAssets } from '@/redux/features/addAssets/addAssetsSlice'
import { apiResponse } from '@/utility/apiResponse/employeesResponse'
import { group } from 'console'
import AddAssets from './AddAssets'

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  fontWeight: 'bold'
}))

export default function AssestsGrid() {
  const dispatch: AppDispatch = useDispatch()
  const { assests, loading, error, filteredAssest, total } = useSelector((state: RootState) => state.assests)
  const [showForm, setShowForm] = useState(false)
  const [selectedAsset, setSelectedAsset] = useState<string>('')
  const [userRole, setUserRole] = useState<string>('')
  const [selectedKeyword, setSelectedKeyword] = useState('')
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [userId, setUserId] = useState<string>('')

  const debouncedFetch = useCallback(
    debounce(() => {
      dispatch(fetchAssests({ page, limit, keyword: selectedKeyword }))
    }, 300),
    [page, limit, selectedKeyword]
  )

  useEffect(() => {
    if (selectedKeyword !== '') {
      debouncedFetch()
    }
    return debouncedFetch.cancel
  }, [page, limit, selectedKeyword, debouncedFetch])

  const handleInputChange = e => {
    setSelectedKeyword(e.target.value)
  }

  const handlePageChange = (newPage: number, newPageSize: number) => {
    setPage(newPage + 1)
    setLimit(newPageSize)
  }

  // Update the state directly when page changes
  const handlePaginationModelChange = (params: { page: number; pageSize: number }) => {
    setPage(params.page + 1) // Set the new page (keeping it 1-indexed)
    setLimit(params.pageSize) // Set the new page size
  }

  // Use useEffect to refetch when page or limit changes
  useEffect(() => {
    debouncedFetch()
  }, [page, limit, selectedKeyword]) // Fetch when page, limit, or search keyword changes

  useEffect(() => {
    if (assests.length === 0) {
      dispatch(fetchAssests({ page, limit, keyword: selectedKeyword }))
    }
  }, [dispatch, assests?.length, page, limit, selectedKeyword])

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}')

    setUserRole(user.role)
    setUserId(user.id)
  })

  const AddAssetForm: React.FC<AddAssetFormProps> = ({ handleClose, asset }) => {
    const { employees } = useSelector((state: RootState) => state.employees)
    const { addassets } = useSelector((state: RootState) => state.addAssets)
    const user = typeof window !== 'undefined' ? JSON.parse(localStorage?.getItem('user') || '{}') : {}
    const company_id = user?.company_id

    const [formData, setFormData] = useState({
      employee: '',
      name: '',
      assignment_date: '',
      return_date: '',
      company_id: company_id
    })

    const [errors, setErrors] = useState({
      employee: '',
      name: '',
      assignment_date: '',
      return_date: ''
    })

    useEffect(() => {
      if (asset) {
        const foundAsset = assests.find(employee => employee.assets.find(ass => ass._id === asset))
        const selected = foundAsset.assets.find(asse => asse._id === asset)

        if (selected) {
          setFormData({
            employee: selected.employee._id,
            name: selected.name,
            assignment_date: selected.assignment_date,
            return_date: selected.return_date,
            company_id: selected.company_id
          })
        }
      }
    }, [asset, addassets])

    useEffect(() => {
      dispatch(fetchEmployees({ page: 1, limit: 0, search: '' }))
    }, [])

    useEffect(() => {
      dispatch(fetchAddAssets({ page: 1, limit: 0, keyword: '' }))
    }, [])

    const validateForm = () => {
      let isValid = true

      const newErrors = {
        employee: '',
        name: '',
        assignment_date: '',
        return_date: ''
      }

      if (!formData.employee.trim()) {
        newErrors.employee = 'Employee is not selected'
        isValid = false
      }
      if (!formData.name.trim()) {
        newErrors.name = 'Required'
        isValid = false
      }
      setErrors(newErrors)

      return isValid
    }

    const handleTextFieldChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { name, value } = e.target

      setFormData(prevState => ({
        ...prevState,
        [name]: value
      }))
    }

    const handleSelectChange = (e: SelectChangeEvent<string>) => {
      const { name, value } = e.target

      setFormData(prevState => ({
        ...prevState,
        [name as string]: value
      }))
    }

    const handleSubmit = () => {
      if (validateForm()) {
        const method = asset ? 'PUT' : 'POST'
        const url = asset
          ? `${process.env.NEXT_PUBLIC_APP_URL}/assests/update/${asset}`
          : `${process.env.NEXT_PUBLIC_APP_URL}/assests/create`

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
            handleClose()
            dispatch(fetchAssests({ page, limit, keyword: selectedKeyword }))
          })
          .catch(error => { })
      }
    }

    return (
      <Box sx={{ flexGrow: 1, padding: 2 }}>
        <Box display='flex' justifyContent='space-between' alignItems='center'>
          <Typography style={{ fontSize: '2em' }} variant='h5' gutterBottom>
            {asset ? 'Edit Asset' : 'Add Asset'}
          </Typography>
          <IconButton onClick={handleClose}>
            <CloseIcon />
          </IconButton>
        </Box>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth required>
              <Autocomplete
                id='Select Employee'
                options={employees.slice().sort((a, b) => {
                  const nameA = `${a.first_name} ${a.last_name}`.toLowerCase()
                  const nameB = `${b.first_name} ${b.last_name}`.toLowerCase()
                  return nameA.localeCompare(nameB)
                })}
                getOptionLabel={option => `${option.first_name} ${option.last_name}`}
                renderInput={params => <TextField {...params} label='Select Employee' variant='outlined' />}
                value={employees.find(emp => emp._id === formData.employee) || null}
                onChange={(event, newValue) => {
                  if (newValue) {
                    handleSelectChange({ target: { name: 'employee', value: newValue._id } })
                  }
                }}
              />
              {errors.employee && <Typography color='error'>{errors.employee}</Typography>}
            </FormControl>
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth required>
              <Autocomplete
                id='Select Assets'
                options={addassets.slice().sort((a, b) => {
                  const nameA = `${a.assetName}`.toLowerCase()
                  const nameB = `${b.assetName}`.toLowerCase()
                  return nameA.localeCompare(nameB)
                })}
                getOptionLabel={option => `${option.assetName} - ${option.model}- ${option.serialNo}`}
                renderOption={(props, option) => (
                  <li {...props} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
                    <span style={{ width: '100%', textAlign: 'center' }}>{option.assetName}</span>
                    <span style={{ width: '100%', textAlign: 'center' }}>{option.model}</span>
                    <span style={{ width: '100%', textAlign: 'center' }}>{option.serialNo}</span>
                  </li>
                )}
                renderInput={params => <TextField {...params} label='Select Assets' variant='outlined' />}
                PaperComponent={({ children }) => (
                  <div
                    style={{
                      backgroundColor: '#fff',
                      border: '1px solid #ccc',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontWeight: 'bold',
                        padding: '8px',
                        borderBottom: '1px solid #ccc'
                      }}
                    >
                      <span style={{ width: '100%', textAlign: 'center' }}>AssetName</span>
                      <span style={{ width: '100%', textAlign: 'center' }}>Model</span>
                      <span style={{ width: '100%', textAlign: 'center' }}>SerialNo</span>
                    </div>
                    {children}
                  </div>
                )}
                value={
                  addassets.find(
                    asset => `${asset.assetName} - ${asset.model} - ${asset.serialNo}` === formData.name
                  ) || null
                }
                onChange={(event, newValue) => {
                  if (newValue) {
                    handleSelectChange({
                      target: {
                        name: 'name',
                        value: `${newValue.assetName} - ${newValue.model} - ${newValue.serialNo}`
                      }
                    })
                  }
                }}
              />
              {errors.name && <Typography color='error'>{errors.name}</Typography>}
            </FormControl>
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label='Assignment Date'
              name='assignment_date'
              value={formData.assignment_date}
              type='date'
              onChange={handleTextFieldChange}
              InputLabelProps={{ shrink: true }}
              required
              error={!!errors.name}
              helperText={errors.name}
            />
          </Grid>
          {asset ? (
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label='Return Date'
                name='return_date'
                value={formData.return_date}
                type='date'
                onChange={handleTextFieldChange}
                InputLabelProps={{ shrink: true }}
                required
                error={!!errors.return_date}
                helperText={errors.return_date}
              />
            </Grid>
          ) : null}

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
              {asset ? 'UPDATE ASSET' : 'ADD ASSET'}
            </Button>
          </Grid>
        </Grid>
      </Box>
    )
  }

  const handleAssetAddClick = () => {
    setSelectedAsset('')
    setShowForm(true)
  }

  const handleEditAssetClick = (id: string) => {
    setSelectedAsset(id)
    setShowForm(true)
  }

  const handleAssetdelete = async id => {
    const confirmDelete = confirm('Are you sure you want to delete')
    if (!confirmDelete) return

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/assests/delete/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer'
        }
      })

      if (response.ok) {
        // dispatch(deleteLeaves(id));
        debouncedFetch()
        toast.success('assets deleted successfully.')
      } else {
        const errorResult = await response.json()
        toast.error(`Failed to delete assets: ${errorResult.message}`)
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error deleting assets. Please try again.')
    }
  }

  const handleClose = () => {
    setShowForm(false)
  }

  const generateColumns = () => {
    const columns = [
      ...(userRole === '1'
        ? [
          {
            field: 'assets',
            headerName: 'Assets Details',
            flex: 1,
            headerAlign: 'center',
            headerClassName: 'super-app-theme--header',
            renderCell: params => {
              const assets = Array.isArray(params.row.assets) ? params.row.assets : [] // Default to an empty array if undefined

              const groupedAssets = assets.reduce((acc, asset) => {
                const groupKey = 'View all assets'
                if (!acc[groupKey]) {
                  acc[groupKey] = []
                }
                acc[groupKey].push(asset)
                return acc
              }, {})

              return (
                <Box>
                  {Object.keys(groupedAssets).map((groupKey, index) => (
                    <Accordion key={`accordion-${index}`} sx={{ mb: 1 }}>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Box
                          display='flex'
                          alignItems='center'
                          height='100%'
                          width='100%'
                          justifyContent='space-between'
                        >
                          <Box display='flex' alignItems='center'>
                            <Avatar src={params.row.employee.image} sx={{ marginLeft: 10, width: 30, height: 30 }} />
                            <Typography
                              sx={{ fontSize: '1em', fontWeight: 'bold', textTransform: 'capitalize', marginLeft: 4 }}
                            >
                              {params.row.employee.first_name} {params.row.employee.last_name}
                            </Typography>
                          </Box>
                          <Box>
                            <Typography>
                              {groupKey} ({groupedAssets[groupKey].length})
                            </Typography>
                          </Box>
                        </Box>
                      </AccordionSummary>
                      <AccordionDetails sx={{ marginTop: 5 }}>
                        <Table>
                          <TableHead>
                            <TableRow>
                              <StyledTableCell>Asset Name - modal No - serial No</StyledTableCell>
                              <StyledTableCell>Assign Date</StyledTableCell>
                              <StyledTableCell>Return Date</StyledTableCell>
                              <StyledTableCell>Edit</StyledTableCell>
                              <StyledTableCell>Delete</StyledTableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {groupedAssets[groupKey].map((asset, idx) => (
                              <TableRow key={`asset-${idx}`}>
                                <TableCell sx={{ padding: '2px' }}>{asset.name}</TableCell>
                                <TableCell>
                                  {asset.assignment_date
                                    ? format(new Date(asset.assignment_date), 'dd-MMM-yyyy').toUpperCase()
                                    : ''}
                                </TableCell>
                                {asset.return_date === '' ? (
                                  <TableCell>No date</TableCell>
                                ) : (
                                  <TableCell>
                                    {asset.return_date
                                      ? format(new Date(asset.return_date), 'dd-MMM-yyyy').toUpperCase()
                                      : ''}
                                  </TableCell>
                                )}
                                <TableCell>
                                  <Button
                                    color='info'
                                    variant='contained'
                                    sx={{ minWidth: '50px' }}
                                    onClick={() => handleEditAssetClick(asset._id)}
                                  >
                                    <DriveFileRenameOutlineOutlined />
                                  </Button>
                                </TableCell>
                                <TableCell>
                                  <Button
                                    variant='contained'
                                    sx={{ minWidth: '50px', backgroundColor: 'red' }}
                                    onClick={() => handleAssetdelete(asset._id)}
                                  >
                                    <DeleteIcon />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </AccordionDetails>
                    </Accordion>
                  ))}
                </Box>
              )
            }
          }
        ]
        : [
          {
            field: 'name',
            headerName: 'Assets Name - Model No. - Serial No',
            width: 500,
            headerAlign: 'center',
            headerClassName: 'super-app-theme--header',
            align: 'center'
          },

          {
            field: 'assignment_date',
            headerName: 'Assign Date',
            width: 200,
            headerClassName: 'super-app-theme--header',
            headerAlign: 'center',
            align: 'center',
            renderCell: params => {
              const date = new Date(params.value)
              return !isNaN(date.getTime()) ? (
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    width: '100%',
                    height: '100%'
                  }}
                >
                  {format(date, 'dd-MMM-yyyy').toUpperCase()}
                </div>
              ) : (
                ''
              )
            }
          },
          {
            field: 'return_date',
            headerName: 'Return Date',
            width: 200,
            headerClassName: 'super-app-theme--header',
            headerAlign: 'center',
            align: 'center',
            renderCell: params => {
              const date = new Date(params.value)
              return !isNaN(date.getTime()) ? (
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    width: '100%',
                    height: '100%'
                  }}
                >
                  {format(date, 'dd-MMM-yyyy').toUpperCase()}
                </div>
              ) : (
                ''
              )
            }
          }
        ])
    ]

    return columns
  }

  const columns = generateColumns()
  const userAssets = useMemo(() => {
    return assests.map((asset, index) => ({
      _id: asset._id,
      name: asset.name,
      assignment_date: asset.assignment_date,
      return_date: asset.return_date
    }))
  }, [assests])

  return (
    <>
      <ToastContainer position='top-center' />
      <Box sx={{ flexGrow: 1, padding: 2 }}>
        <Dialog open={showForm} onClose={handleClose} fullWidth maxWidth='md'>
          <DialogContent>
            <AddAssetForm asset={selectedAsset} handleClose={handleClose} />
          </DialogContent>
        </Dialog>
        <Box display='flex' justifyContent='space-between' alignItems='center' mb={2}>
          <Box>
            <Typography style={{ fontSize: '2em' }} variant='h5' gutterBottom>
              Assets
            </Typography>
            <Typography style={{ fontSize: '1em', fontWeight: 'bold' }} variant='subtitle1' gutterBottom>
              Dashboard / Assets
            </Typography>
          </Box>
          {userRole === '1' && (
            <Box display='flex' alignItems='center'>
              <Button
                style={{ borderRadius: 50, backgroundColor: '#ff902f' }}
                variant='contained'
                color='warning'
                startIcon={<AddIcon />}
                onClick={handleAssetAddClick}
              >
                Assign Asset
              </Button>
            </Box>
          )}
        </Box>
        {userRole === '1' && (
          <Grid container spacing={6} alignItems='center' mb={2}>
            {/* <Grid item xs={12} md={3}>
            <TextField fullWidth label='Employee ID' variant='outlined' />
          </Grid> */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label='search'
                variant='outlined'
                value={selectedKeyword}
                onChange={handleInputChange}
                InputProps={{
                  sx: {
                    borderRadius: '50px' // To make the TextField rounded
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
        )}
      </Box>
      <Box sx={{ width: '100%' }}>
        <DataGrid
          autoHeight
          getRowHeight={() => 'auto'}
          sx={{
            height: 'calc(140vh - 200px)',
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
          rows={userRole === '1' ? assests : userAssets}
          columns={columns}
          getRowId={row => {
            if (userRole === '1') {
              return row._id && row._id._id ? row._id._id : row._id
            }
            return row._id
          }}
          paginationMode='server'
          rowCount={total}
          onPaginationModelChange={handlePaginationModelChange}
          pageSizeOptions={[10, 20, 30]}
          paginationModel={{ page: page - 1, pageSize: limit }}
          disableRowSelectionOnClick
        />
      </Box>
    </>
  )
}
