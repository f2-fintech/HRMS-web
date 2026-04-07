'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
    Box,
    Button,
    Dialog,
    DialogContent,
    Typography,
    Tab,
    Tabs,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import UploadFileIcon from '@mui/icons-material/UploadFile'
import AutorenewIcon from '@mui/icons-material/Autorenew'
import { ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import dayjs from 'dayjs'

import { useAppDispatch, useAppSelector } from '@/redux/provider'
import { fetchPayrolls, fetchPayrollTemplates, selectPayrollState } from '@/redux/features/payroll/payrollSlice'
import PayrollHeader from '@/components/payroll/PayrollHeader'
import PayrollTable from '@/components/payroll/PayrollTable'
import PayrollFormDialog from '@/components/payroll/PayrollFormDialog'
import PayrollUploadDialog from '@/components/payroll/PayrollUploadDialog'
import PayrollTemplateDialog from '@/components/payroll/PayrollTemplateDialog'
import ConfirmDialog from '@/components/payroll/ConfirmDialog'

interface TabPanelProps {
    children?: React.ReactNode
    index: number
    value: number
}

function TabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`payroll-tabpanel-${index}`}
            aria-labelledby={`payroll-tab-${index}`}
            {...other}
        >
            {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
        </div>
    )
}

const Payroll = () => {
    const dispatch = useAppDispatch()
    const { payrolls, templates, loading, total, templateTotal } = useAppSelector(selectPayrollState)

    const [tabValue, setTabValue] = useState(0)
    const [showForm, setShowForm] = useState(false)
    const [showUpload, setShowUpload] = useState(false)
    const [showTemplate, setShowTemplate] = useState(false)
    const [showConfirm, setShowConfirm] = useState(false)
    const [selectedPayroll, setSelectedPayroll] = useState<any>(null)
    const [selectedTemplate, setSelectedTemplate] = useState<any>(null)

    // Filters
    const [page, setPage] = useState(1)
    const [limit] = useState(10)
    const [keyword, setKeyword] = useState('')
    const [selectedDate, setSelectedDate] = useState(dayjs())
    const [userRole, setUserRole] = useState('')

    const month = selectedDate.month() + 1
    const year = selectedDate.year()

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const user = JSON.parse(localStorage.getItem('user') || '{}')
            setUserRole(user.role_priority || '')
        }
    }, [])

    const loadPayrolls = useCallback(() => {
        dispatch(fetchPayrolls({
            page,
            limit,
            keyword,
            month: month.toString(),
            year: year.toString(),
        }))
    }, [dispatch, page, limit, keyword, month, year])

    const loadTemplates = useCallback(() => {
        dispatch(fetchPayrollTemplates({ page, limit }))
    }, [dispatch, page, limit])

    useEffect(() => {
        if (tabValue === 0) {
            loadPayrolls()
        } else {
            loadTemplates()
        }
    }, [tabValue, loadPayrolls, loadTemplates])

    const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
        setTabValue(newValue)
        setPage(1)
    }

    const handleAddPayroll = () => {
        setSelectedPayroll(null)
        setShowForm(true)
    }

    const handleEditPayroll = (payroll: any) => {
        setSelectedPayroll(payroll)
        setShowForm(true)
    }

    const handleDeletePayroll = (payroll: any) => {
        setSelectedPayroll(payroll)
        setShowConfirm(true)
    }

    const handleConfirmDelete = async () => {
        if (!selectedPayroll) return

        try {
            const token = localStorage.getItem('token')
            const { company_id } = JSON.parse(localStorage.getItem('user') || '{}')

            const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/payroll/${selectedPayroll._id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token} ${company_id}`,
                },
            })

            if (response.ok) {
                toast.success('Payroll deleted successfully')
                loadPayrolls()
            } else {
                toast.error('Failed to delete payroll')
            }
        } catch (error) {
            toast.error('Error deleting payroll')
        } finally {
            setShowConfirm(false)
            setSelectedPayroll(null)
        }
    }

    const handleViewPayslip = async (payroll: any) => {
        try {
            const token = localStorage.getItem('token')
            const { company_id } = JSON.parse(localStorage.getItem('user') || '{}')

            const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/payroll/${payroll._id}/payslip`, {
                headers: {
                    'Authorization': `Bearer ${token} ${company_id}`,
                },
            })

            if (response.ok) {
                const data = await response.json()
                // Open in new tab as formatted JSON for now
                const newWindow = window.open('', '_blank')
                if (newWindow) {
                    newWindow.document.write(`
            <html>
              <head>
                <title>Payslip - ${data.employee.name}</title>
                <style>
                  body { font-family: Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
                  h1 { color: #333; border-bottom: 2px solid #ff902f; padding-bottom: 10px; }
                  h2 { color: #666; margin-top: 30px; }
                  .row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
                  .label { color: #666; }
                  .value { font-weight: bold; }
                  .total { background: #f5f5f5; padding: 15px; margin-top: 20px; font-size: 1.2em; }
                  .header-info { margin-bottom: 30px; }
                </style>
              </head>
              <body>
                <h1>Payslip</h1>
                <div class="header-info">
                  <div class="row"><span class="label">Employee Name:</span><span class="value">${data.employee.name}</span></div>
                  <div class="row"><span class="label">Employee Code:</span><span class="value">${data.employee.code}</span></div>
                  <div class="row"><span class="label">Designation:</span><span class="value">${data.employee.designation || 'N/A'}</span></div>
                  <div class="row"><span class="label">Period:</span><span class="value">${data.period.month}/${data.period.year}</span></div>
                </div>
                
                <h2>Earnings</h2>
                <div class="row"><span class="label">Basic Pay:</span><span class="value">₹${data.earnings.basicPay.toLocaleString()}</span></div>
                <div class="row"><span class="label">Incentive:</span><span class="value">₹${data.earnings.incentive.toLocaleString()}</span></div>
                <div class="row"><span class="label">Gross Amount:</span><span class="value">₹${data.earnings.grossAmount.toLocaleString()}</span></div>
                
                <h2>Deductions</h2>
                <div class="row"><span class="label">Leave Deduction:</span><span class="value">₹${data.deductions.leaveDeduction.toLocaleString()}</span></div>
                <div class="row"><span class="label">Fine Amount:</span><span class="value">₹${data.deductions.fineAmount.toLocaleString()}</span></div>
                <div class="row"><span class="label">Total Deductions:</span><span class="value">₹${data.deductions.totalDeductions.toLocaleString()}</span></div>
                
                <h2>Attendance</h2>
                <div class="row"><span class="label">Total Paydays:</span><span class="value">${data.attendance.totalPaydays}</span></div>
                <div class="row"><span class="label">Leave Taken:</span><span class="value">${data.attendance.leaveTaken}</span></div>
                <div class="row"><span class="label">Leave Deducted:</span><span class="value">${data.attendance.leaveDeducted}</span></div>
                
                <div class="total">
                  <div class="row"><span class="label">Net Amount:</span><span class="value">₹${data.netAmount.toLocaleString()}</span></div>
                </div>
              </body>
            </html>
          `)
                    newWindow.document.close()
                }
            } else {
                toast.error('Failed to fetch payslip')
            }
        } catch (error) {
            toast.error('Error fetching payslip')
        }
    }

    const handleDateChange = (date: any) => {
        setSelectedDate(date)
        setPage(1)
    }

    const handleKeywordChange = (value: string) => {
        setKeyword(value)
        setPage(1)
    }

    const handlePageChange = (_event: React.ChangeEvent<unknown>, value: number) => {
        setPage(value)
    }

    const handleFormSuccess = () => {
        setShowForm(false)
        setSelectedPayroll(null)
        loadPayrolls()
    }

    const handleUploadSuccess = () => {
        setShowUpload(false)
        loadPayrolls()
    }

    const handleTemplateSuccess = () => {
        setShowTemplate(false)
        setSelectedTemplate(null)
        loadTemplates()
    }

    return (
        <>
            <ConfirmDialog
                open={showConfirm}
                title="Delete Payroll"
                message="Are you sure you want to delete this payroll record?"
                onClose={() => setShowConfirm(false)}
                onConfirm={handleConfirmDelete}
            />

            <Box>
                <ToastContainer position="top-center" />

                {/* Header */}
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Box>
                        <Typography style={{ fontSize: '2em' }} variant="h5" gutterBottom>
                            Payroll Management
                        </Typography>
                        <Typography style={{ fontSize: '1em', fontWeight: 'bold' }} variant="subtitle1" gutterBottom>
                            Dashboard / Payroll
                        </Typography>
                    </Box>

                    {userRole === '1' && (
                        <Box display="flex" gap={1}>
                            <Button
                                sx={{ backgroundColor: '#4caf50' }}
                                variant="contained"
                                startIcon={<UploadFileIcon />}
                                onClick={() => setShowUpload(true)}
                            >
                                Upload Excel
                            </Button>
                            <Button
                                sx={{ backgroundColor: '#ff902f' }}
                                variant="contained"
                                startIcon={<AddIcon />}
                                onClick={handleAddPayroll}
                            >
                                Add Payroll
                            </Button>
                        </Box>
                    )}
                </Box>

                {/* Tabs */}
                <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                    <Tabs value={tabValue} onChange={handleTabChange}>
                        <Tab label="Payroll Records" />
                        <Tab label="Salary Templates" />
                    </Tabs>
                </Box>

                {/* Payroll Records Tab */}
                <TabPanel value={tabValue} index={0}>
                    <PayrollHeader
                        keyword={keyword}
                        onKeywordChange={handleKeywordChange}
                        selectedDate={selectedDate}
                        onDateChange={handleDateChange}
                    />

                    <PayrollTable
                        loading={loading}
                        payrolls={payrolls}
                        total={total}
                        page={page}
                        limit={limit}
                        userRole={userRole}
                        onPageChange={handlePageChange}
                        onEdit={handleEditPayroll}
                        onDelete={handleDeletePayroll}
                        onViewPayslip={handleViewPayslip}
                    />
                </TabPanel>

                {/* Templates Tab */}
                <TabPanel value={tabValue} index={1}>
                    <Box display="flex" justifyContent="flex-end" mb={2}>
                        {userRole === '1' && (
                            <Button
                                sx={{ backgroundColor: '#ff902f' }}
                                variant="contained"
                                startIcon={<AddIcon />}
                                onClick={() => {
                                    setSelectedTemplate(null)
                                    setShowTemplate(true)
                                }}
                            >
                                Add Template
                            </Button>
                        )}
                    </Box>

                    {/* Templates table would go here - simplified for now */}
                    <Box>
                        {templates.map((template: any) => (
                            <Box
                                key={template._id}
                                sx={{
                                    p: 2,
                                    mb: 1,
                                    border: '1px solid #eee',
                                    borderRadius: 1,
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                }}
                            >
                                <Box>
                                    <Typography fontWeight="bold">
                                        {template.employee?.first_name} {template.employee?.last_name}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Code: {template.employee?.code} | Basic Pay: ₹{template.basicPay?.toLocaleString()}
                                    </Typography>
                                </Box>
                                <Box>
                                    <Typography
                                        variant="caption"
                                        sx={{
                                            bgcolor: template.isActive ? '#4caf50' : '#f44336',
                                            color: 'white',
                                            px: 1,
                                            py: 0.5,
                                            borderRadius: 1,
                                        }}
                                    >
                                        {template.isActive ? 'Active' : 'Inactive'}
                                    </Typography>
                                </Box>
                            </Box>
                        ))}
                    </Box>
                </TabPanel>

                {/* Dialogs */}
                <Dialog open={showForm} onClose={() => setShowForm(false)} fullWidth maxWidth="md">
                    <DialogContent>
                        <PayrollFormDialog
                            payroll={selectedPayroll}
                            month={month}
                            year={year}
                            onClose={() => setShowForm(false)}
                            onSuccess={handleFormSuccess}
                        />
                    </DialogContent>
                </Dialog>

                <Dialog open={showUpload} onClose={() => setShowUpload(false)} fullWidth maxWidth="sm">
                    <DialogContent>
                        <PayrollUploadDialog
                            month={month}
                            year={year}
                            onClose={() => setShowUpload(false)}
                            onSuccess={handleUploadSuccess}
                        />
                    </DialogContent>
                </Dialog>

                <Dialog open={showTemplate} onClose={() => setShowTemplate(false)} fullWidth maxWidth="sm">
                    <DialogContent>
                        <PayrollTemplateDialog
                            template={selectedTemplate}
                            onClose={() => setShowTemplate(false)}
                            onSuccess={handleTemplateSuccess}
                        />
                    </DialogContent>
                </Dialog>
            </Box>
        </>
    )
}

export default Payroll
