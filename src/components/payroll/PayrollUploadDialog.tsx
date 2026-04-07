'use client'

import React, { useState, useRef } from 'react'
import {
    Box,
    Button,
    Typography,
    CircularProgress,
    Alert,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
} from '@mui/material'
import CloudUploadIcon from '@mui/icons-material/CloudUpload'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import ErrorIcon from '@mui/icons-material/Error'
import { toast } from 'react-toastify'

interface PayrollUploadDialogProps {
    month: number
    year: number
    onClose: () => void
    onSuccess: () => void
}

interface UploadResult {
    success: number
    errors: Array<{ row: number; error: string; employeeId?: string }>
}

const PayrollUploadDialog: React.FC<PayrollUploadDialogProps> = ({
    month,
    year,
    onClose,
    onSuccess,
}) => {
    const [file, setFile] = useState<File | null>(null)
    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState<UploadResult | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = event.target.files?.[0]
        if (selectedFile) {
            // Validate file type
            const validTypes = [
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'application/vnd.ms-excel',
            ]
            if (!validTypes.includes(selectedFile.type) && !selectedFile.name.endsWith('.xlsx')) {
                toast.error('Please select a valid Excel file (.xlsx)')
                return
            }
            setFile(selectedFile)
            setResult(null)
        }
    }

    const handleUpload = async () => {
        if (!file) {
            toast.error('Please select a file')
            return
        }

        setLoading(true)

        try {
            const token = localStorage.getItem('token')
            const { company_id } = JSON.parse(localStorage.getItem('user') || '{}')

            const formData = new FormData()
            formData.append('file', file)
            formData.append('month', month.toString())
            formData.append('year', year.toString())

            const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/payroll/upload`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token} ${company_id}`,
                },
                body: formData,
            })

            if (response.ok) {
                const data = await response.json()
                setResult(data)

                if (data.success > 0) {
                    toast.success(`Successfully processed ${data.success} payroll records`)
                }
                if (data.errors?.length > 0) {
                    toast.warning(`${data.errors.length} records had errors`)
                }
            } else {
                const error = await response.json()
                toast.error(error.message || 'Failed to upload file')
            }
        } catch (error) {
            toast.error('Error uploading file')
        } finally {
            setLoading(false)
        }
    }

    const handleDone = () => {
        if (result && result.success > 0) {
            onSuccess()
        } else {
            onClose()
        }
    }

    return (
        <Box>
            <Typography variant="h6" gutterBottom>
                Upload Payroll Excel
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={3}>
                Upload an Excel file to bulk create payroll for {month}/{year}
            </Typography>

            {!result ? (
                <>
                    <Box
                        sx={{
                            border: '2px dashed #ccc',
                            borderRadius: 2,
                            p: 4,
                            textAlign: 'center',
                            cursor: 'pointer',
                            '&:hover': { borderColor: '#ff902f' },
                        }}
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <input
                            type="file"
                            ref={fileInputRef}
                            style={{ display: 'none' }}
                            accept=".xlsx,.xls"
                            onChange={handleFileSelect}
                        />
                        <CloudUploadIcon sx={{ fontSize: 48, color: '#ccc', mb: 1 }} />
                        <Typography>
                            {file ? file.name : 'Click to select Excel file'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            Supported format: .xlsx
                        </Typography>
                    </Box>

                    <Alert severity="info" sx={{ mt: 2 }}>
                        The Excel file should have columns: Employee ID, Basic Pay, Leave Taken, Leave Deducted, Paydays, Incentive, Remarks
                    </Alert>

                    <Box display="flex" justifyContent="flex-end" gap={1} mt={3}>
                        <Button variant="outlined" onClick={onClose} disabled={loading}>
                            Cancel
                        </Button>
                        <Button
                            variant="contained"
                            sx={{ backgroundColor: '#ff902f' }}
                            onClick={handleUpload}
                            disabled={!file || loading}
                        >
                            {loading ? <CircularProgress size={24} /> : 'Upload'}
                        </Button>
                    </Box>
                </>
            ) : (
                <>
                    <Alert severity={result.errors.length === 0 ? 'success' : 'warning'} sx={{ mb: 2 }}>
                        Processed: {result.success} successful, {result.errors.length} errors
                    </Alert>

                    {result.errors.length > 0 && (
                        <Box sx={{ maxHeight: 200, overflow: 'auto', mb: 2 }}>
                            <Typography variant="subtitle2" gutterBottom>
                                Errors:
                            </Typography>
                            <List dense>
                                {result.errors.map((error, index) => (
                                    <ListItem key={index}>
                                        <ListItemIcon>
                                            <ErrorIcon color="error" fontSize="small" />
                                        </ListItemIcon>
                                        <ListItemText
                                            primary={`Row ${error.row}: ${error.error}`}
                                            secondary={error.employeeId ? `Employee ID: ${error.employeeId}` : undefined}
                                        />
                                    </ListItem>
                                ))}
                            </List>
                        </Box>
                    )}

                    <Box display="flex" justifyContent="flex-end">
                        <Button
                            variant="contained"
                            sx={{ backgroundColor: '#ff902f' }}
                            onClick={handleDone}
                        >
                            Done
                        </Button>
                    </Box>
                </>
            )}
        </Box>
    )
}

export default PayrollUploadDialog
