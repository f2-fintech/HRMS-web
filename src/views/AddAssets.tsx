'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { debounce } from 'lodash'
import { DataGrid, GridColDef, GridToolbar } from '@mui/x-data-grid'
import {
  Button,
  Typography,
  Box,
  Grid,
  IconButton,
  TextField,
  Dialog,
  DialogContent,
  MenuItem,
  Tabs,
  Tab
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import UploadFileIcon from '@mui/icons-material/UploadFile'
import DownloadIcon from '@mui/icons-material/Download'
import { DriveFileRenameOutlineOutlined } from '@mui/icons-material'
import { useDispatch, useSelector } from 'react-redux'
import { ToastContainer, toast } from 'react-toastify'

import type { AppDispatch, RootState } from '@/redux/store'
import { fetchAddAssets } from '@/redux/features/addAssets/addAssetsSlice'
import 'react-toastify/dist/ReactToastify.css'

type UploadType = 'LAPTOP' | 'SYSTEM'

type AssetFormData = {
  uploadType: UploadType
  assetName: string
  companyPartNo: string
  brand: string
  status: string
  rentPerMonth: string
  systemType: string
  tft: string
  cpu: string
  ups: string
  mouse: string
  keyboard: string
  headphone: string
  company_id: string
}

const defaultLaptopForm = (company_id: string): AssetFormData => ({
  uploadType: 'LAPTOP',
  assetName: '',
  companyPartNo: '',
  brand: '',
  status: 'AVAILABLE',
  rentPerMonth: '',
  systemType: '',
  tft: '',
  cpu: '',
  ups: '',
  mouse: '',
  keyboard: '',
  headphone: '',
  company_id
})

const defaultSystemForm = (company_id: string): AssetFormData => ({
  uploadType: 'SYSTEM',
  assetName: '',
  companyPartNo: '',
  brand: '',
  status: 'AVAILABLE',
  rentPerMonth: '',
  systemType: '',
  tft: '',
  cpu: '',
  ups: '',
  mouse: '',
  keyboard: '',
  headphone: '',
  company_id
})

const normalizeStatus = (status: string) => {
  const cleaned = String(status || '')
    .trim()
    .toUpperCase()
    .replace(/[, ]+/g, '_')

  if (cleaned === 'IN_USE') return 'IN_USE'
  if (cleaned === 'AVAILABLE') return 'AVAILABLE'
  if (cleaned === 'FREE') return 'FREE'
  if (cleaned === 'DAMAGED') return 'DAMAGED'
  return cleaned || 'AVAILABLE'
}

export default function AddAssets() {
  const dispatch: AppDispatch = useDispatch()
  const { addassets, filteredaddassets, total } = useSelector((state: RootState) => state.addAssets)

  const [showForm, setShowForm] = useState(false)
  const [showBulkUpload, setShowBulkUpload] = useState(false)
  const [selectedAsset, setSelectedAsset] = useState<any>(null)
  const [userRole, setUserRole] = useState<string>('')
  const [selectedKeyword, setSelectedKeyword] = useState('')
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [filterUploadType, setFilterUploadType] = useState<string>('')

  const debouncedFetch = useCallback(
    debounce((currentPage: number, currentLimit: number, keyword: string) => {
      dispatch(fetchAddAssets({ page: currentPage, limit: currentLimit, keyword }))
    }, 300),
    [dispatch]
  )

  useEffect(() => {
    debouncedFetch(page, limit, selectedKeyword)
    return () => {
      debouncedFetch.cancel()
    }
  }, [page, limit, selectedKeyword, debouncedFetch])

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}')
    setUserRole(String(user?.role || ''))
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedKeyword(e.target.value)
    setPage(1)
  }

  const handlePaginationModelChange = (params: { page: number; pageSize: number }) => {
    setPage(params.page + 1)
    setLimit(params.pageSize)
  }

  const handleAssetAddClick = () => {
    setSelectedAsset(null)
    setShowForm(true)
  }

  const handleAssetEditClick = (row: any) => {
    setSelectedAsset(row)
    setShowForm(true)
  }

  const handleDeleteInventory = async (id: string) => {
    const confirmDelete = window.confirm('Are you sure you want to delete this inventory?')
    if (!confirmDelete) return

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/add-assets/delete/${id}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data?.error || data?.message || 'Failed to delete inventory')
      }

      toast.success(data?.message || 'Inventory deleted successfully', {
        position: 'top-center'
      })

      debouncedFetch(page, limit, selectedKeyword)
    } catch (error: any) {
      toast.error(error?.message || 'Failed to delete inventory', {
        position: 'top-center'
      })
    }
  }

  const handleClose = () => {
    setShowForm(false)
    setSelectedAsset(null)
  }

  const handleBulkClose = () => {
    setShowBulkUpload(false)
  }

  const displayedRows = useMemo(() => {
    const baseRows = filteredaddassets?.length > 0 ? filteredaddassets : addassets

    if (!filterUploadType) return baseRows

    return baseRows.filter((row: any) => String(row.uploadType || '').toUpperCase() === filterUploadType)
  }, [filteredaddassets, addassets, filterUploadType])

  function BulkUploadDialog({ handleClose }: { handleClose: () => void }) {
    const user = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || '{}') : {}
    const company_id = user?.company_id || ''

    const [uploadType, setUploadType] = useState<UploadType>('LAPTOP')
    const [file, setFile] = useState<File | null>(null)
    const [loading, setLoading] = useState(false)

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFile = e.target.files?.[0] || null
      setFile(selectedFile)
    }

    const handleBulkUpload = async () => {
      if (!file) {
        toast.error('Please select an Excel file', { position: 'top-center' })
        return
      }

      const url =
        uploadType === 'LAPTOP'
          ? `${process.env.NEXT_PUBLIC_APP_URL}/add-assets/bulk-upload/laptop`
          : `${process.env.NEXT_PUBLIC_APP_URL}/add-assets/bulk-upload/system`

      const formData = new FormData()
      formData.append('file', file)
      formData.append('company_id', company_id)

      try {
        setLoading(true)

        const response = await fetch(url, {
          method: 'POST',
          body: formData
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data?.error || data?.message || 'Bulk upload failed')
        }

        toast.success(data?.message || 'Assets uploaded successfully', {
          position: 'top-center'
        })

        handleClose()
        debouncedFetch(page, limit, selectedKeyword)
      } catch (error: any) {
        toast.error(error?.message || 'Bulk upload failed', {
          position: 'top-center'
        })
      } finally {
        setLoading(false)
      }
    }

    const downloadSample = () => {
      if (uploadType === 'LAPTOP') {
        const csvContent = [
          'SN. NO.,NAME,COMPANYPART NO.,COMPANY,STATUS,RENT/MONTH',
          '1,PRASHANT KUMAR,PF2HX9ZX,LENOVO,IN_USE,1000/-',
          '2,JASHANPREET SINGH,BSWW7Y2,DELL,IN_USE,1000/-',
          '3,SONU CHOUDHARY,6S58TQ2,DELL,AVAILABLE,1000/-'
        ].join('\n')

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.setAttribute('download', 'laptop-sample.csv')
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      } else {
        const csvContent = [
          'S.NO,NAME,SYSTEM TYPE,TFT,CPU,UPS,MOUSE,KEYBOARD,HEADPHONE',
          '1,ABHINAV SRIVASTAVA,RENT LAPY,LAPY/TFT/101,SGH538PXTS,F2/UPS/27,LAPY/M/107,LAPY/KB/101,',
          '2,INTZAR ALI,F2 FINTECH,F2/TFT/101,F2/CPU/116,,F2/M/107,F2/KB/117,',
          '3,MAYANK,RENT LAPY,LAPY/TFT/102,JPA6046HBS,F2/UPS/39,LAPY/M/108,LAPY/KB/102,'
        ].join('\n')

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.setAttribute('download', 'system-sample.csv')
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      }
    }

    return (
      <Box sx={{ flexGrow: 1, padding: 2 }}>
        <Box display='flex' justifyContent='space-between' alignItems='center' mb={2}>
          <Typography style={{ fontSize: '2em' }} variant='h5'>
            Bulk Upload Assets
          </Typography>
          <IconButton onClick={handleClose}>
            <CloseIcon />
          </IconButton>
        </Box>

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <TextField
              select
              fullWidth
              label='Upload Type'
              value={uploadType}
              onChange={e => setUploadType(e.target.value as UploadType)}
            >
              <MenuItem value='LAPTOP'>Laptop</MenuItem>
              <MenuItem value='SYSTEM'>System</MenuItem>
            </TextField>
          </Grid>

          <Grid item xs={12} md={6}>
            <Button fullWidth variant='contained' component='label' startIcon={<UploadFileIcon />}>
              {file ? file.name : 'Select Excel / CSV File'}
              <input hidden type='file' accept='.xlsx,.xls,.csv' onChange={handleFileChange} />
            </Button>
          </Grid>

          <Grid item xs={12} md={6}>
            <Button fullWidth variant='outlined' startIcon={<DownloadIcon />} onClick={downloadSample}>
              Download {uploadType === 'LAPTOP' ? 'Laptop' : 'System'} Sample
            </Button>
          </Grid>

          <Grid item xs={12} md={6}>
            <Button
              fullWidth
              variant='contained'
              color='warning'
              onClick={handleBulkUpload}
              disabled={loading}
              sx={{ fontWeight: 700, py: 1.5 }}
            >
              {loading ? 'Uploading...' : 'Upload File'}
            </Button>
          </Grid>
        </Grid>
      </Box>
    )
  }

  function AddAssetForm({
    handleClose,
    asset
  }: {
    handleClose: () => void
    asset: any
  }) {
    const user = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || '{}') : {}
    const company_id = user?.company_id || ''

    const initialFormData: AssetFormData = asset
      ? {
        uploadType: (asset.uploadType || 'LAPTOP') as UploadType,
        assetName: asset.assetName || '',
        companyPartNo: asset.companyPartNo || '',
        brand: asset.brand || '',
        status: normalizeStatus(asset.status || 'AVAILABLE'),
        rentPerMonth: asset.rentPerMonth || '',
        systemType: asset.systemType || '',
        tft: asset.tft || '',
        cpu: asset.cpu || '',
        ups: asset.ups || '',
        mouse: asset.mouse || '',
        keyboard: asset.keyboard || '',
        headphone: asset.headphone || '',
        company_id: asset.company_id || company_id
      }
      : defaultLaptopForm(company_id)

    const [tab, setTab] = useState<UploadType>(initialFormData.uploadType)
    const [formData, setFormData] = useState<AssetFormData>(initialFormData)
    const [errors, setErrors] = useState<Record<string, string>>({})

    useEffect(() => {
      if (asset) {
        setTab((asset.uploadType || 'LAPTOP') as UploadType)
      }
    }, [asset])

    const validateForm = () => {
      const newErrors: Record<string, string> = {}

      if (!formData.assetName.trim()) newErrors.assetName = 'NAME is required'

      if (tab === 'LAPTOP') {
        if (!formData.companyPartNo.trim()) newErrors.companyPartNo = 'COMPANYPART NO. is required'
        if (!formData.brand.trim()) newErrors.brand = 'COMPANY is required'
        if (!formData.rentPerMonth.trim()) newErrors.rentPerMonth = 'RENT/MONTH is required'
      }

      if (tab === 'SYSTEM') {
        if (!formData.systemType.trim()) newErrors.systemType = 'SYSTEM TYPE is required'
      }

      setErrors(newErrors)
      return Object.keys(newErrors).length === 0
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target
      setFormData(prev => ({
        ...prev,
        [name]: name === 'status' ? normalizeStatus(value) : value
      }))
    }

    const handleTabChange = (_: React.SyntheticEvent, newValue: UploadType) => {
      setTab(newValue)
      setErrors({})

      if (asset) {
        setFormData(prev => ({
          ...prev,
          uploadType: newValue
        }))
      } else {
        setFormData(newValue === 'LAPTOP' ? defaultLaptopForm(company_id) : defaultSystemForm(company_id))
      }
    }

    const handleSubmit = async () => {
      if (!validateForm()) return

      const method = asset ? 'PUT' : 'POST'
      const url = asset
        ? `${process.env.NEXT_PUBLIC_APP_URL}/add-assets/update/${asset._id}`
        : `${process.env.NEXT_PUBLIC_APP_URL}/add-assets/create`

      const payload: Record<string, string> = {
        uploadType: tab,
        assetName: formData.assetName,
        company_id: formData.company_id
      }

      if (tab === 'LAPTOP') {
        payload.companyPartNo = formData.companyPartNo
        payload.brand = formData.brand
        payload.status = normalizeStatus(formData.status)
        payload.rentPerMonth = formData.rentPerMonth
      }

      if (tab === 'SYSTEM') {
        payload.systemType = formData.systemType
        payload.tft = formData.tft
        payload.cpu = formData.cpu
        payload.ups = formData.ups
        payload.mouse = formData.mouse
        payload.keyboard = formData.keyboard
        payload.headphone = formData.headphone
      }

      try {
        const response = await fetch(url, {
          method,
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data?.error || data?.message || 'Something went wrong')
        }

        toast.success(data?.message || (asset ? 'Asset updated successfully' : 'Asset added successfully'), {
          position: 'top-center'
        })

        handleClose()
        debouncedFetch(page, limit, selectedKeyword)
      } catch (error: any) {
        toast.error(error?.message || 'Failed to save asset', {
          position: 'top-center'
        })
      }
    }

    return (
      <Box sx={{ flexGrow: 1, padding: 2 }}>
        <Box display='flex' justifyContent='space-between' alignItems='center' mb={2}>
          <Typography style={{ fontSize: '2em' }} variant='h5'>
            {asset ? 'Edit Asset' : 'Add Asset'}
          </Typography>
          <IconButton onClick={handleClose}>
            <CloseIcon />
          </IconButton>
        </Box>

        <Tabs value={tab} onChange={handleTabChange} sx={{ mb: 3 }}>
          <Tab value='LAPTOP' label='Laptop' />
          <Tab value='SYSTEM' label='System' />
        </Tabs>

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label='NAME'
              name='assetName'
              value={formData.assetName}
              onChange={handleChange}
              error={!!errors.assetName}
              helperText={errors.assetName}
            />
          </Grid>

          {tab === 'LAPTOP' && (
            <>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label='COMPANYPART NO.'
                  name='companyPartNo'
                  value={formData.companyPartNo}
                  onChange={handleChange}
                  error={!!errors.companyPartNo}
                  helperText={errors.companyPartNo}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label='COMPANY'
                  name='brand'
                  value={formData.brand}
                  onChange={handleChange}
                  error={!!errors.brand}
                  helperText={errors.brand}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  select
                  label='STATUS'
                  name='status'
                  value={formData.status}
                  onChange={handleChange}
                >
                  <MenuItem value='AVAILABLE'>AVAILABLE</MenuItem>
                  <MenuItem value='IN_USE'>IN_USE</MenuItem>
                  <MenuItem value='FREE'>FREE</MenuItem>
                  <MenuItem value='DAMAGED'>DAMAGED</MenuItem>
                </TextField>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label='RENT/MONTH'
                  name='rentPerMonth'
                  value={formData.rentPerMonth}
                  onChange={handleChange}
                  error={!!errors.rentPerMonth}
                  helperText={errors.rentPerMonth}
                />
              </Grid>
            </>
          )}

          {tab === 'SYSTEM' && (
            <>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  select
                  label='SYSTEM TYPE'
                  name='systemType'
                  value={formData.systemType}
                  onChange={handleChange}
                  error={!!errors.systemType}
                  helperText={errors.systemType}
                >
                  <MenuItem value='F2 FINTECH'>F2 FINTECH</MenuItem>
                  <MenuItem value='RENT LAPY'>RENT LAPY</MenuItem>
                </TextField>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField fullWidth label='TFT' name='tft' value={formData.tft} onChange={handleChange} />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField fullWidth label='CPU' name='cpu' value={formData.cpu} onChange={handleChange} />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField fullWidth label='UPS' name='ups' value={formData.ups} onChange={handleChange} />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField fullWidth label='MOUSE' name='mouse' value={formData.mouse} onChange={handleChange} />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label='KEYBOARD'
                  name='keyboard'
                  value={formData.keyboard}
                  onChange={handleChange}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label='HEADPHONE'
                  name='headphone'
                  value={formData.headphone}
                  onChange={handleChange}
                />
              </Grid>
            </>
          )}

          <Grid item xs={12}>
            <Button
              sx={{
                fontSize: '18px',
                fontWeight: 600,
                color: 'white',
                padding: 1.8,
                backgroundColor: '#ff902f',
                width: 220
              }}
              variant='contained'
              onClick={handleSubmit}
            >
              {asset ? 'UPDATE ASSET' : 'ADD ASSET'}
            </Button>
          </Grid>
        </Grid>
      </Box>
    )
  }

  const columns: GridColDef[] = [
    {
      sortable: false,
      field: 'lineNo',
      headerName: 'S.No.',
      headerClassName: 'super-app-theme--header',
      width: 90,
      align: 'center',
      headerAlign: 'center',
      renderCell: params => (page - 1) * limit + params.api.getAllRowIds().indexOf(params.id) + 1
    },
    {
      field: 'uploadType',
      headerName: 'UPLOAD TYPE',
      width: 130,
      align: 'center',
      headerAlign: 'center',
      headerClassName: 'super-app-theme--header'
    },
    {
      field: 'assetName',
      headerName: 'NAME',
      width: 180,
      align: 'center',
      headerAlign: 'center',
      headerClassName: 'super-app-theme--header',
      renderCell: params => params.row.assetName || '-'
    },
    {
      field: 'companyPartNo',
      headerName: 'COMPANYPART NO.',
      width: 180,
      align: 'center',
      headerAlign: 'center',
      headerClassName: 'super-app-theme--header',
      renderCell: params => (params.row.uploadType === 'LAPTOP' ? params.row.companyPartNo || '-' : '-')
    },
    {
      field: 'brand',
      headerName: 'COMPANY',
      width: 140,
      align: 'center',
      headerAlign: 'center',
      headerClassName: 'super-app-theme--header',
      renderCell: params => (params.row.uploadType === 'LAPTOP' ? params.row.brand || '-' : '-')
    },
    {
      field: 'status',
      headerName: 'STATUS',
      width: 120,
      align: 'center',
      headerAlign: 'center',
      headerClassName: 'super-app-theme--header',
      renderCell: params => (params.row.uploadType === 'LAPTOP' ? normalizeStatus(params.row.status || '-') : '-')
    },
    {
      field: 'rentPerMonth',
      headerName: 'RENT/MONTH',
      width: 140,
      align: 'center',
      headerAlign: 'center',
      headerClassName: 'super-app-theme--header',
      renderCell: params => (params.row.uploadType === 'LAPTOP' ? params.row.rentPerMonth || '-' : '-')
    },
    {
      field: 'systemType',
      headerName: 'SYSTEM TYPE',
      width: 150,
      align: 'center',
      headerAlign: 'center',
      headerClassName: 'super-app-theme--header',
      renderCell: params => (params.row.uploadType === 'SYSTEM' ? params.row.systemType || '-' : '-')
    },
    {
      field: 'tft',
      headerName: 'TFT',
      width: 130,
      align: 'center',
      headerAlign: 'center',
      headerClassName: 'super-app-theme--header',
      renderCell: params => (params.row.uploadType === 'SYSTEM' ? params.row.tft || '-' : '-')
    },
    {
      field: 'cpu',
      headerName: 'CPU',
      width: 130,
      align: 'center',
      headerAlign: 'center',
      headerClassName: 'super-app-theme--header',
      renderCell: params => (params.row.uploadType === 'SYSTEM' ? params.row.cpu || '-' : '-')
    },
    {
      field: 'ups',
      headerName: 'UPS',
      width: 130,
      align: 'center',
      headerAlign: 'center',
      headerClassName: 'super-app-theme--header',
      renderCell: params => (params.row.uploadType === 'SYSTEM' ? params.row.ups || '-' : '-')
    },
    {
      field: 'mouse',
      headerName: 'MOUSE',
      width: 130,
      align: 'center',
      headerAlign: 'center',
      headerClassName: 'super-app-theme--header',
      renderCell: params => (params.row.uploadType === 'SYSTEM' ? params.row.mouse || '-' : '-')
    },
    {
      field: 'keyboard',
      headerName: 'KEYBOARD',
      width: 130,
      align: 'center',
      headerAlign: 'center',
      headerClassName: 'super-app-theme--header',
      renderCell: params => (params.row.uploadType === 'SYSTEM' ? params.row.keyboard || '-' : '-')
    },
    {
      field: 'headphone',
      headerName: 'HEADPHONE',
      width: 140,
      align: 'center',
      headerAlign: 'center',
      headerClassName: 'super-app-theme--header',
      renderCell: params => (params.row.uploadType === 'SYSTEM' ? params.row.headphone || '-' : '-')
    },
    ...(userRole === '1'
      ? [
        {
          field: 'actions',
          headerName: 'ACTIONS',
          sortable: false,
          headerAlign: 'center' as const,
          width: 220,
          align: 'center' as const,
          headerClassName: 'super-app-theme--header',
          renderCell: ({ row }: any) => (
            <Box width='100%' display='flex' justifyContent='space-around'>
              <Button
                color='info'
                variant='contained'
                sx={{ minWidth: '50px' }}
                onClick={() => handleAssetEditClick(row)}
              >
                <DriveFileRenameOutlineOutlined />
              </Button>
              <Button
                color='error'
                variant='contained'
                sx={{ minWidth: '50px' }}
                onClick={() => handleDeleteInventory(row._id)}
              >
                <DeleteIcon />
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
            <AddAssetForm asset={selectedAsset} handleClose={handleClose} />
          </DialogContent>
        </Dialog>

        <Dialog open={showBulkUpload} onClose={handleBulkClose} fullWidth maxWidth='sm'>
          <DialogContent>
            <BulkUploadDialog handleClose={handleBulkClose} />
          </DialogContent>
        </Dialog>

        <Box display='flex' justifyContent='space-between' alignItems='center' mb={2}>
          <Box>
            <Typography style={{ fontSize: '2em' }} variant='h5' gutterBottom>
              Inventory
            </Typography>
            <Typography style={{ fontSize: '1em', fontWeight: 'bold' }} variant='subtitle1' gutterBottom>
              Dashboard / Inventory
            </Typography>
          </Box>

          {userRole === '1' && (
            <Box display='flex' alignItems='center' gap={2}>
              <Button
                style={{ borderRadius: 50, backgroundColor: '#ff902f' }}
                variant='contained'
                color='warning'
                startIcon={<UploadFileIcon />}
                onClick={() => setShowBulkUpload(true)}
              >
                Bulk Upload
              </Button>

              <Button
                style={{ borderRadius: 50, backgroundColor: '#ff902f' }}
                variant='contained'
                color='warning'
                startIcon={<AddIcon />}
                onClick={handleAssetAddClick}
              >
                Add Asset
              </Button>
            </Box>
          )}
        </Box>

        <Grid container spacing={3} alignItems='center' mb={2}>
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              label='Search'
              variant='outlined'
              value={selectedKeyword}
              onChange={handleInputChange}
            />
          </Grid>

          <Grid item xs={12} md={3}>
            <TextField
              select
              fullWidth
              label='Filter by Upload Type'
              value={filterUploadType}
              onChange={e => setFilterUploadType(e.target.value)}
            >
              <MenuItem value=''>All</MenuItem>
              <MenuItem value='LAPTOP'>Laptop</MenuItem>
              <MenuItem value='SYSTEM'>System</MenuItem>
            </TextField>
          </Grid>
        </Grid>
      </Box>

      <Box sx={{ width: '100%' }}>
        <DataGrid
          sx={{
            height: 'calc(140vh - 200px)',
            '& .super-app-theme--header': {
              fontSize: 17,
              fontWeight: 600,
              alignItems: 'center'
            },
            '& .mui-yrdy0g-MuiDataGrid-columnHeaderRow ': {
              background: 'linear-gradient(270deg, var(--mui-palette-primary-main), #2c3ce3 100%) !important',
              color: 'white'
            },
            '& .MuiDataGrid-cell': {
              fontSize: '12px'
            },
            '& .MuiDataGrid-row': {
              '&:nth-of-type(odd)': {
                backgroundColor: 'rgb(46 38 61 / 12%)'
              },
              '&:nth-of-type(even)': {
                backgroundColor: '#ffffff'
              },
              fontWeight: 600,
              fontSize: '14px',
              boxSizing: 'border-box'
            }
          }}
          slots={{
            toolbar: GridToolbar
          }}
          rows={displayedRows}
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
