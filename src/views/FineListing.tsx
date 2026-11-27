'use client'

import React, { useState } from 'react'
import { Box, Button, Dialog, DialogContent, Typography, Grid } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import FileDownloadIcon from '@mui/icons-material/FileDownload'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import type { Dayjs } from 'dayjs'

import FineListingHeader from '@/components/fine/FineListingHeader'
import FineListingTable from '@/components/fine/FineListingTable'
import ConfirmDeleteDialog from '@/components/fine/ConfirmDeleteDialog'
import FineFormDialog from '@/components/fine/FineFormDialog'
import { useFineListing } from '@/components/fine/useFineListing'

const FineListing = () => {
  const {
    // State
    showForm,
    openAlert,
    selectedFine,
    selectedKeyword,
    selectedDate,
    userRole,
    loading,
    finesToDisplay,
    total,
    page,
    limit,
    // Methods
    setShowForm,
    setOpenAlert,
    handleAddFine,
    handleCloseForm,
    handleConfirmDelete,
    confirmDeleteFine,
    handleDateChange,
    handleInputChange,
    handlePageChange,
    setToast,
    month,
    year
  } = useFineListing()

  const [exporting, setExporting] = useState(false)

  const handleExportExcel = async () => {
    try {
      setExporting(true)

      const token = localStorage.getItem('token')
      const userData = localStorage.getItem('user')

      if (!token || !userData) {
        setToast?.('error', 'You are not logged in')
        return
      }

      const { company_id } = JSON.parse(userData)

      const params = new URLSearchParams()
      if (selectedKeyword) params.append('keyword', selectedKeyword)
      if (month) params.append('month', String(month))
      if (year) params.append('year', String(year))

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_APP_URL}/fines/export/excel?${params.toString()}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token} ${company_id}`,
          },
        }
      )

      if (!response.ok) {
        throw new Error('Export failed')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `Fines_${month || 'all'}_${year || new Date().getFullYear()}.xlsx`
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      setToast?.('error', 'Excel export failed')
    } finally {
      setExporting(false)
    }
  }

  return (
    <>
      {/* Confirm Delete Dialog */}
      <ConfirmDeleteDialog
        open={openAlert}
        onClose={() => setOpenAlert(false)}
        onConfirm={handleConfirmDelete}
      />

      <Box>
        {/* Toast Notification Container */}
        <ToastContainer position="top-center" />

        {/* Header (Title + Add Button) */}
        <Box
          display='flex'
          justifyContent='space-between'
          alignItems='center'
          mb={2}
        >
          <Box>
            <Typography style={{ fontSize: '2em' }} variant='h5' gutterBottom>
              Fines
            </Typography>
            <Typography
              style={{ fontSize: '1em', fontWeight: 'bold' }}
              variant='subtitle1'
              gutterBottom
            >
              Dashboard / Fine
            </Typography>
          </Box>

          <Box display='flex' gap={1}>
            <Button
              variant='outlined'
              startIcon={<FileDownloadIcon />}
              onClick={handleExportExcel}
              disabled={exporting}
            >
              {exporting ? 'Exporting...' : 'Export Excel'}
            </Button>

            {userRole === '1' && (
              <Button
                sx={{ backgroundColor: '#ff902f' }}
                variant='contained'
                color='primary'
                startIcon={<AddIcon />}
                onClick={handleAddFine}
              >
                Add Fine
              </Button>
            )}
          </Box>
        </Box>

        {/* Search and Date Filters */}
        <FineListingHeader
          userRole={userRole}
          selectedKeyword={selectedKeyword}
          handleInputChange={handleInputChange}
          selectedDate={selectedDate}
          handleDateChange={handleDateChange}
        />

        {/* Fines Table */}
        <FineListingTable
          loading={loading}
          userRole={userRole}
          fines={finesToDisplay}
          total={total}
          page={page}
          limit={limit}
          onPageChange={handlePageChange}
          onConfirmDelete={confirmDeleteFine}
          onEditFine={() => setShowForm(true)}
        />

        {/* Fine Form Dialog */}
        <Dialog
          open={showForm}
          onClose={handleCloseForm}
          fullWidth
          maxWidth='md'
        >
          <DialogContent>
            <FineFormDialog
              fine={selectedFine}
              onClose={handleCloseForm}
              setToast={setToast}
              month={month}
              year={year}
            />
          </DialogContent>
        </Dialog>
      </Box>
    </>
  )
}

export default FineListing
