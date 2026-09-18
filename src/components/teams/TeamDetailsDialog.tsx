import React from 'react'
import { Box, Typography, Button, Card, CardHeader, CardContent, Avatar, Grid, Dialog, DialogContent, IconButton } from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import { useSettings } from '@/@core/hooks/useSettings'

interface TeamDetailsDialogProps {
    viewDetails: TeamType | null
    employees: EmployeeType[]
    open: boolean
    onClose: () => void
    getEmployeeCountByIds: (ids: string, employees: EmployeeType[], managerId?: string) => number
}

export default function TeamDetailsDialog({
    viewDetails,
    employees,
    open,
    onClose,
    getEmployeeCountByIds
}: TeamDetailsDialogProps) {
    const { settings } = useSettings()
    const manager = employees.find(emp => emp._id === viewDetails?.manager_id)

    return (
        <Dialog
            open={open}
            onClose={onClose}
            fullWidth
            maxWidth='md'
            PaperProps={{
                sx: {
                    borderRadius: { xs: 0, sm: '24px' },
                    overflow: 'hidden',
                    bgcolor: 'background.paper',
                    backgroundImage: 'none',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
                }
            }}
        >
            <DialogContent sx={{ p: 0, position: 'relative' }}>
                {/* Header with Gradient */}
                <Box
                    sx={{
                        background: 'linear-gradient(135deg, #2c3ce3 0%, #5665f3 100%)',
                        p: { xs: 3, sm: 4 },
                        color: 'white',
                        textAlign: 'center',
                        position: 'relative'
                    }}
                >
                    <Typography variant='h4' sx={{ fontWeight: 800, mb: 0.5, letterSpacing: '-0.02em' }}>
                        {viewDetails?.name.toUpperCase()}
                    </Typography>
                    <Box sx={{ 
                        display: 'inline-flex', 
                        alignItems: 'center', 
                        gap: 1, 
                        bgcolor: 'rgba(255,255,255,0.15)',
                        px: 2,
                        py: 0.5,
                        borderRadius: '20px',
                        backdropFilter: 'blur(4px)'
                    }}>
                        <Typography variant='subtitle2' sx={{ fontWeight: 600 }}>
                            TEAM CODE: {viewDetails?.code}
                        </Typography>
                    </Box>
                    <IconButton 
                        onClick={onClose}
                        sx={{ position: 'absolute', top: 16, right: 16, color: 'white' }}
                    >
                        <CloseIcon />
                    </IconButton>
                </Box>

                {/* Content Area */}
                <Box sx={{ p: { xs: 2, sm: 4 }, bgcolor: settings.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)' }}>
                    <Grid container spacing={4}>
                        {/* Manager Column */}
                        <Grid item xs={12} lg={4}>
                            <Card sx={{ 
                                height: '100%', 
                                borderRadius: 4, 
                                border: '1px solid',
                                borderColor: 'divider',
                                boxShadow: 'none'
                            }}>
                                <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'rgba(0,0,0,0.02)' }}>
                                    <Typography variant="subtitle1" fontWeight={700}>Team Manager</Typography>
                                </Box>
                                <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4 }}>
                                    {manager ? (
                                        <>
                                            <Avatar
                                                src={manager.image}
                                                sx={{ 
                                                    width: 100, 
                                                    height: 100, 
                                                    mb: 2,
                                                    border: '4px solid',
                                                    borderColor: 'primary.light',
                                                    boxShadow: '0 8px 16px rgba(44, 60, 227, 0.2)'
                                                }}
                                            >
                                                {manager.first_name.charAt(0)}
                                            </Avatar>
                                            <Typography variant="h6" sx={{ fontWeight: 700 }}>
                                                {manager.first_name} {manager.last_name}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                                {manager.designation}
                                            </Typography>
                                            <Button 
                                                variant="outlined" 
                                                size="small" 
                                                sx={{ borderRadius: 2 }}
                                            >
                                                View Profile
                                            </Button>
                                        </>
                                    ) : (
                                        <Typography color="text.secondary">No manager assigned</Typography>
                                    )}
                                </CardContent>
                            </Card>
                        </Grid>

                        {/* Members Column */}
                        <Grid item xs={12} lg={8}>
                            <Card sx={{ 
                                height: '100%', 
                                borderRadius: 4,
                                border: '1px solid',
                                borderColor: 'divider',
                                boxShadow: 'none'
                            }}>
                                <Box sx={{ 
                                    p: 2, 
                                    borderBottom: '1px solid', 
                                    borderColor: 'divider', 
                                    bgcolor: 'rgba(0,0,0,0.02)',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                }}>
                                    <Typography variant="subtitle1" fontWeight={700}>Team Members</Typography>
                                    <Box sx={{ bgcolor: 'primary.main', color: 'white', px: 1.5, py: 0.25, borderRadius: 2, fontSize: '0.75rem', fontWeight: 700 }}>
                                        {viewDetails ? getEmployeeCountByIds(viewDetails.employee_ids, employees, viewDetails.manager_id) : 0} Total
                                    </Box>
                                </Box>
                                <CardContent sx={{ 
                                    maxHeight: 400, 
                                    overflowY: 'auto',
                                    '&::-webkit-scrollbar': { width: 6 },
                                    '&::-webkit-scrollbar-thumb': { bgcolor: 'divider', borderRadius: 3 }
                                }}>
                                    <Grid container spacing={2}>
                                        {viewDetails?.employee_ids.split(',').map(id => {
                                            const employee = employees.find(emp => emp._id === id)
                                            if (!employee) return null
                                            return (
                                                <Grid item xs={12} sm={6} key={id}>
                                                    <Box sx={{ 
                                                        display: 'flex', 
                                                        alignItems: 'center', 
                                                        gap: 2, 
                                                        p: 1.5, 
                                                        borderRadius: 3,
                                                        border: '1px solid transparent',
                                                        transition: 'all 0.2s',
                                                        '&:hover': { 
                                                            bgcolor: 'background.paper',
                                                            borderColor: 'primary.light',
                                                            boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
                                                        }
                                                    }}>
                                                        <Avatar src={employee.image} sx={{ width: 44, height: 44 }}>
                                                            {employee.first_name.charAt(0)}
                                                        </Avatar>
                                                        <Box sx={{ minWidth: 0 }}>
                                                            <Typography variant="body2" sx={{ fontWeight: 600, noWrap: true }}>
                                                                {employee.first_name} {employee.last_name}
                                                            </Typography>
                                                            <Typography variant="caption" color="text.secondary" sx={{ noWrap: true, display: 'block' }}>
                                                                {employee.designation}
                                                            </Typography>
                                                        </Box>
                                                    </Box>
                                                </Grid>
                                            )
                                        })}
                                    </Grid>
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>
                </Box>

                {/* Footer Actions */}
                <Box sx={{ 
                    p: 3, 
                    borderTop: '1px solid', 
                    borderColor: 'divider',
                    display: 'flex',
                    justifyContent: 'flex-end',
                    bgcolor: 'background.paper'
                }}>
                    <Button
                        variant='contained'
                        onClick={onClose}
                        sx={{ 
                            px: 4, 
                            py: 1, 
                            borderRadius: 2,
                            background: 'linear-gradient(135deg, #2c3ce3 0%, #5665f3 100%)'
                        }}
                    >
                        Close Details
                    </Button>
                </Box>
            </DialogContent>
        </Dialog>
    )
}
