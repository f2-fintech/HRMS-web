'use client'

import React, { useState } from 'react'
import { Box, Button, Dialog, DialogContent, Typography, Grid } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import type { Dayjs } from 'dayjs'

import FineListingHeader from '@/components/fine/FineListingHeader'
import FineListingTable from '@/components/fine/FineListingTable'
import ConfirmDeleteDialog from '@/components/fine/ConfirmDeleteDialog'
import FineFormDialog from '@/components/fine/FineFormDialog'
import { useFineListing } from '@/components/fine/useFineListing'

/**
 * FineListing - Main container component that uses
 * a custom hook (useFineListing) to manage all logic/state,
 * and child components for each distinct UI section.
 */
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
