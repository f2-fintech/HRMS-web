import React from 'react'
import { Dialog, DialogContent, DialogActions, Button, Alert } from '@mui/material'

interface ConfirmDeleteDialogProps {
    open: boolean
    onClose: () => void
    onConfirm: () => void
}

const ConfirmDeleteDialog: React.FC<ConfirmDeleteDialogProps> = ({
    open,
    onClose,
    onConfirm,
}) => {
    return (
        <Dialog open={open} onClose={onClose}>
            <DialogContent>
                <Alert variant='outlined' severity="warning">
                    Are you sure you want to delete this fine? This action cannot be undone.
                </Alert>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} color="primary">
                    Cancel
                </Button>
                <Button onClick={onConfirm} color="secondary" autoFocus>
                    Confirm
                </Button>
            </DialogActions>
        </Dialog>
    )
}

export default ConfirmDeleteDialog
