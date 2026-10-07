'use client'

import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { DataGrid, GridColDef, GridToolbar } from '@mui/x-data-grid'
import {
  Button,
  Typography,
  Box,
  IconButton,
  TextField,
  Dialog,
  DialogContent,
  DialogTitle,
  DialogActions
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import { DriveFileRenameOutlineOutlined } from '@mui/icons-material'
import { toast, ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

import type { AppDispatch, RootState } from '@/redux/store'
import { fetchItAssets } from '@/redux/features/itAssetInventory/itAssetInventorySlice'

export default function ITAssetInventory() {
  const dispatch: AppDispatch = useDispatch()
  const { assets, loading } = useSelector((state: RootState) => state.itAssetInventory)

  const [isAdminOrIT, setIsAdminOrIT] = useState<boolean>(false)
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [selectedAsset, setSelectedAsset] = useState<any>(null)
  const [formData, setFormData] = useState({
    equipment: '',
    totalQty: '',
    f2fintechQty: '',
    rentlappyQty: '',
    remarks: ''
  })
  const [submitting, setSubmitting] = useState(false)

  // Fetch access control same as AddAssets
  useEffect(() => {
    const fetchAccess = async () => {
      try {
        const userStr = localStorage.getItem('user')
        if (!userStr) return
        const user = JSON.parse(userStr)
        const role = String(user?.role || '')

        const token = localStorage.getItem('token')
        const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/add-assets/get-access`, {
          headers: { Authorization: `Bearer ${token} ${user?.company_id}` }
        })

        if (res.ok) {
          const data = await res.json()
          setIsAdminOrIT(role === '1' || role === '0' || (data.authorizedUserIds || []).includes(user?.id))
        } else {
          setIsAdminOrIT(role === '1' || role === '0')
        }
      } catch (error) {
        console.error('Error fetching access:', error)
      }
    }
    fetchAccess()
  }, [])

  useEffect(() => {
    dispatch(fetchItAssets({ search }))
  }, [dispatch, search])

  const handleOpenForm = (asset?: any) => {
    if (asset) {
      setSelectedAsset(asset)
      setFormData({
        equipment: asset.equipment,
        totalQty: asset.totalQty,
        f2fintechQty: asset.f2fintechQty,
        rentlappyQty: asset.rentlappyQty,
        remarks: asset.remarks || ''
      })
    } else {
      setSelectedAsset(null)
      setFormData({
        equipment: '',
        totalQty: '',
        f2fintechQty: '',
        rentlappyQty: '',
        remarks: ''
      })
    }
    setShowForm(true)
  }

  const handleCloseForm = () => {
    setShowForm(false)
    setSelectedAsset(null)
  }

  const handleSave = async () => {
    if (!formData.equipment.trim()) {
      toast.error('Equipment name is required')
      return
    }

    setSubmitting(true)
    try {
      const token = localStorage.getItem('token')
      const user = JSON.parse(localStorage.getItem('user') || '{}')

      const payload = { ...formData, company_id: user?.company_id }

      const url = selectedAsset
        ? `${process.env.NEXT_PUBLIC_APP_URL}/it-asset-inventory/update/${selectedAsset._id}`
        : `${process.env.NEXT_PUBLIC_APP_URL}/it-asset-inventory/create`

      const res = await fetch(url, {
        method: selectedAsset ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token} ${user?.company_id}`
        },
        body: JSON.stringify(payload)
      })

      if (res.ok) {
        toast.success(selectedAsset ? 'Updated successfully' : 'Created successfully')
        handleCloseForm()
        dispatch(fetchItAssets({ search }))
      } else {
        const err = await res.json()
        toast.error(err.message || 'Something went wrong')
      }
    } catch (error: any) {
      toast.error('Error saving data')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this asset?')) return

    try {
      const token = localStorage.getItem('token')
      const user = JSON.parse(localStorage.getItem('user') || '{}')

      const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/it-asset-inventory/delete/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token} ${user?.company_id}`
        }
      })

      if (res.ok) {
        toast.success('Deleted successfully')
        dispatch(fetchItAssets({ search }))
      } else {
        toast.error('Error deleting data')
      }
    } catch (error: any) {
      toast.error('Error deleting data')
    }
  }

  const columns: GridColDef[] = [
    {
      field: 'lineNo',
      headerName: 'S. No.',
      width: 80,
      renderCell: params => {
        const index = assets.findIndex(a => a._id === params.row._id)
        return index + 1
      }
    },
    { field: 'equipment', headerName: 'IT Asset / Equipment', flex: 1 },
    { field: 'totalQty', headerName: 'Total Qty', width: 120 },
    { field: 'f2fintechQty', headerName: 'F2Fintech Qty', width: 150 },
    { field: 'rentlappyQty', headerName: 'Rentlappy Qty', width: 150 },
    { field: 'remarks', headerName: 'Location / Remarks', flex: 1 },
  ]

  if (isAdminOrIT) {
    columns.push({
      field: 'actions',
      headerName: 'Actions',
      width: 120,
      sortable: false,
      renderCell: params => (
        <Box display='flex' gap={1} pt={1}>
          <IconButton size="small" onClick={() => handleOpenForm(params.row)} color='primary'>
            <DriveFileRenameOutlineOutlined fontSize='small' />
          </IconButton>
          <IconButton size="small" onClick={() => handleDelete(params.row._id)} color='error'>
            <DeleteIcon fontSize='small' />
          </IconButton>
        </Box>
      )
    })
  }

  return (
    <Box>
      <ToastContainer />
      <Box sx={{ p: 5, pb: 3, display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box>
          <Typography style={{ fontSize: '2em' }} variant='h5' gutterBottom>
            IT ASSET INVENTORY
          </Typography>
          <Typography variant='subtitle1' color='textSecondary' gutterBottom>
            Company IT Equipment – Inventory Summary
          </Typography>
        </Box>
        {isAdminOrIT && (
          <Box display='flex' gap={2} alignItems='center'>
            <Button
              style={{ borderRadius: 50, backgroundColor: '#ff902f' }}
              variant='contained'
              startIcon={<AddIcon />}
              onClick={() => handleOpenForm()}
            >
              Add IT Asset
            </Button>
          </Box>
        )}
      </Box>

      <Box sx={{ px: 5, pb: 2 }}>
        <TextField
          size="small"
          placeholder="Search equipment..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ width: 300 }}
        />
      </Box>

      <Box sx={{ height: 'calc(140vh - 200px)', width: '100%', px: 5 }}>
        <DataGrid
          rows={assets}
          columns={columns}
          loading={loading}
          getRowId={(row) => row._id}
          disableColumnMenu
          disableRowSelectionOnClick
          slots={{ toolbar: GridToolbar }}
          slotProps={{
            toolbar: {
              showQuickFilter: true,
              quickFilterProps: { debounceMs: 500 }
            }
          }}
          sx={{
            '& .MuiDataGrid-columnHeaders': {
              backgroundColor: '#f5f5f5',
              fontWeight: 'bold',
              borderBottom: '1px solid #ccc'
            }
          }}
        />
      </Box>

      <Dialog open={showForm} onClose={handleCloseForm} fullWidth maxWidth="sm">
        <DialogTitle>{selectedAsset ? 'Edit IT Asset' : 'Add IT Asset'}</DialogTitle>
        <DialogContent dividers>
          <Box display="flex" flexDirection="column" gap={2} pt={1}>
            <TextField
              label="IT Asset / Equipment"
              fullWidth
              required
              value={formData.equipment}
              onChange={(e) => setFormData({ ...formData, equipment: e.target.value })}
            />
            <Box display="flex" gap={2}>
              <TextField
                label="Total Qty"
                fullWidth
                value={formData.totalQty}
                onChange={(e) => setFormData({ ...formData, totalQty: e.target.value })}
              />
              <TextField
                label="F2Fintech Qty"
                fullWidth
                value={formData.f2fintechQty}
                onChange={(e) => setFormData({ ...formData, f2fintechQty: e.target.value })}
              />
              <TextField
                label="Rentlappy Qty"
                fullWidth
                value={formData.rentlappyQty}
                onChange={(e) => setFormData({ ...formData, rentlappyQty: e.target.value })}
              />
            </Box>
            <TextField
              label="Location / Remarks"
              fullWidth
              multiline
              rows={3}
              value={formData.remarks}
              onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseForm}>Cancel</Button>
          <Button onClick={handleSave} variant="contained" disabled={submitting} sx={{ backgroundColor: '#ff902f' }}>
            {submitting ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
