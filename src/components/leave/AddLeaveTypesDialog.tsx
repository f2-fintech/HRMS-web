import React, { useState } from 'react'
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Button,
    IconButton,
    Box
} from '@mui/material'
import { Add as AddIcon, Remove as RemoveIcon } from '@mui/icons-material'
import { toast } from 'react-toastify'

const AddLeaveTypesDialog = ({ open, onClose, onSave, leaveTypes }) => {
    // State for dynamic rows (each row is an object with type, quantity, and _id if available)
    const [leaveTypesInput, setLeaveTypesInput] = useState([...leaveTypes])
    const [loading, setLoading] = useState(false)

    const handleInputChange = (index, field, value) => {
        const updatedTypes = [...leaveTypesInput]
        updatedTypes[index][field] = value
        setLeaveTypesInput(updatedTypes)
    }

    const handleAddMore = () => {
        setLeaveTypesInput([...leaveTypesInput, { type: '', quantity: '' }])
    }

    const handleRemove = (index) => {
        const updatedTypes = leaveTypesInput.filter((_, i) => i !== index)
        setLeaveTypesInput(updatedTypes)
    }

    const handleSubmit = async () => {
        // Basic validation: ensure all rows have both fields filled
        const invalid = leaveTypesInput.some(item => !item.type || !item.quantity)
        if (invalid) {
            toast.error('Please fill in all fields for each leave type.')
            return
        }

        const formattedLeaveTypes = leaveTypesInput.map(item => ({
            type: item.type,
            quantity: Number(item.quantity),  // Convert to number
            _id: item._id || undefined         // Include _id for update/delete operations
        }));

        setLoading(true)
        try {
            // Assuming you have an endpoint to handle the full create, update, and delete actions.
            const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/leave-types/bulk-update`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ leaveTypes: formattedLeaveTypes })
            })

            if (response.ok) {
                const data = await response.json()
                toast.success(data.message || 'Leave types updated successfully.')
                // Call onSave with new leave types (adjust based on your API response)
                onSave(data.leaveTypes)
                // Reset form fields and close dialog
                setLeaveTypesInput([{ type: '', quantity: '' }])
                onClose()
            } else {
                const errorResult = await response.json()
                toast.error(errorResult.message || 'Failed to update leave types.')
            }
        } catch (error) {
            console.error('Error:', error)
            toast.error('An unexpected error occurred.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
            <DialogTitle>Add or Update Leave Types</DialogTitle>
            <DialogContent>
                {leaveTypesInput.map((item, index) => (
                    <Box key={index} display="flex" alignItems="center" gap={1} mt={index > 0 ? 2 : 0}>
                        <TextField
                            label="Leave Type"
                            value={item.type}
                            onChange={(e) => handleInputChange(index, 'type', e.target.value)}
                            fullWidth
                            sx={{ marginTop: 2 }}
                        />
                        <TextField
                            label="Quantity"
                            type="number"
                            value={item.quantity}
                            onChange={(e) => handleInputChange(index, 'quantity', e.target.value)}
                            fullWidth
                            sx={{ marginTop: 2 }}
                        />
                        {leaveTypesInput.length > 1 && (
                            <IconButton onClick={() => handleRemove(index)} color="error">
                                <RemoveIcon />
                            </IconButton>
                        )}
                    </Box>
                ))}
                <Button
                    variant="outlined"
                    startIcon={<AddIcon />}
                    onClick={handleAddMore}
                    sx={{ mt: 2 }}
                >
                    Add More
                </Button>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} color="secondary">Cancel</Button>
                <Button onClick={handleSubmit} color="primary" disabled={loading}>
                    {loading ? 'Saving...' : 'Save'}
                </Button>
            </DialogActions>
        </Dialog>
    )
}

export default AddLeaveTypesDialog
