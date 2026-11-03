import React from 'react'
import { Box, Typography, Button, Card, CardHeader, CardContent, Avatar, Grid, Dialog, DialogContent } from '@mui/material'
import { useSettings } from '@/@core/hooks/useSettings' // Import useSettings

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
    const { settings } = useSettings() // Accessing the settings for theme mode
    const manager = employees.find(emp => emp._id === viewDetails?.manager_id)

    return (
        <Dialog
            open={open}
            onClose={onClose}
            fullWidth
            maxWidth='md'
            PaperProps={{
                sx: {
                    width: '100%',
                    maxWidth: { xs: '100%', sm: 600, md: 900 },
                    margin: { xs: 0, sm: 2 },
                    height: { xs: '100%', sm: 'auto' },
                    maxHeight: { xs: '100%', sm: 'calc(100% - 64px)' },
                    borderRadius: { xs: 0, sm: '20px' },
                    backgroundColor: settings.mode === 'dark' ? '#333' : '#fff'  // Adjust background color for dark mode
                }
            }}
        >
            <DialogContent
                sx={{
                    padding: { xs: 2, sm: 3 },
                    overflow: 'auto',
                    height: { xs: '100vh', sm: 'auto' },
                    color: settings.mode === 'dark' ? 'white' : 'black' // Adjust text color for dark mode
                }}
            >
                {/* Header */}
                <Box
                    sx={{
                        backgroundColor: settings.mode === 'dark' ? '#555' : '#7b1fa2', // Adjust header background color for dark mode
                        padding: '10px',
                        color: 'white',
                        position: 'relative',
                        overflow: 'hidden',
                        display: 'flex',
                        alignItems: 'center',
                        flexDirection: 'column'
                    }}
                >
                    <Typography variant='h4' fontWeight='bold' sx={{ zIndex: 1, position: 'relative' }}>
                        {viewDetails?.name.toUpperCase()}
                    </Typography>
                    <Typography variant='h6' sx={{ opacity: 0.8, zIndex: 1, position: 'relative' }}>
                        Team Code: {viewDetails?.code}
                    </Typography>
                    <Box
                        sx={{
                            position: 'absolute',
                            top: -20,
                            right: -20,
                            width: 200,
                            height: 200,
                            borderRadius: '50%',
                            backgroundColor: 'rgba(255,255,255,0.1)',
                            zIndex: 1
                        }}
                    />
                </Box>

                {/* Content */}
                <Box
                    sx={{
                        padding: { xs: '10px', sm: '20px', md: '30px' },
                        display: 'flex',
                        flexDirection: { xs: 'column', lg: 'row' },
                        gap: { xs: 2, md: 4 }
                    }}
                >
                    {/* Manager Section */}
                    <Card
                        elevation={3}
                        sx={{
                            flex: 1,
                            borderRadius: '15px',
                            overflow: 'hidden',
                            transition: 'all 0.3s ease',
                            height: '100%',
                            '&:hover': { transform: 'translateY(-5px)', boxShadow: 6 },
                            backgroundColor: settings.mode === 'dark' ? '#444' : 'white' // Adjust background color for manager card
                        }}
                    >
                        <CardHeader title='Team Manager' sx={{ backgroundColor: '#7b1fa2', color: 'white' }} />
                        <CardContent sx={{ padding: '20px' }}>
                            {manager ? (
                                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                                    <Avatar
                                        src={manager.image}
                                        sx={{ width: 80, height: 80, border: '3px solid #7b1fa2' }}
                                    />
                                    <Box>
                                        <Typography variant='h6'>
                                            {manager.first_name} {manager.last_name}
                                        </Typography>
                                        <Typography variant='body2' color='textSecondary' sx={{ textAlign: 'center' }}>
                                            {manager.designation}
                                        </Typography>
                                    </Box>
                                </Box>
                            ) : (
                                <Typography>No manager assigned</Typography>
                            )}
                        </CardContent>
                    </Card>

                    {/* Employees Section */}
                    <Card
                        elevation={3}
                        sx={{
                            flex: 2,
                            borderRadius: '15px',
                            overflowY: 'auto',
                            transition: 'all 0.3s ease',
                            '&:hover': { transform: 'translateY(-5px)', boxShadow: 6 },
                            height: '285px',
                            position: 'relative',
                            backgroundColor: settings.mode === 'dark' ? '#444' : 'white', // Adjust background color for employee card
                            '&::-webkit-scrollbar': {
                                width: '12px',
                                background: 'transparent'
                            },
                            '&::-webkit-scrollbar-track': {
                                background: 'rgba(0,0,0,0.1)',
                                borderRadius: '10px',
                                margin: '10px 0'
                            },
                            '&::-webkit-scrollbar-thumb': {
                                background: 'linear-gradient(45deg, #6a11cb 0%, #2575fc 100%)',
                                borderRadius: '10px',
                                border: '3px solid transparent',
                                backgroundClip: 'content-box',
                                '&:hover': {
                                    background: 'linear-gradient(45deg, #8e2de2 0%, #4a00e0 100%)',
                                    backgroundClip: 'content-box'
                                }
                            },
                            '&::after': {
                                content: '""',
                                position: 'absolute',
                                top: 0,
                                right: 0,
                                width: '12px',
                                height: '100%',
                                background: 'rgba(255,255,255,0.1)',
                                borderRadius: '0 15px 15px 0',
                                pointerEvents: 'none'
                            },
                            scrollbarWidth: 'thin',
                            scrollbarColor: '#6a11cb transparent'
                        }}
                    >
                        <CardHeader title='Team Members' sx={{ backgroundColor: '#7b1fa2', color: 'white' }} />
                        <CardContent sx={{ padding: '20px' }}>
                            <Grid container spacing={2}>
                                {viewDetails?.employee_ids.split(',').map(id => {
                                    const employee = employees.find(emp => emp._id === id)
                                    if (!employee) return null
                                    return (
                                        <Grid item xs={6} sm={4} key={id}>
                                            <Box
                                                sx={{
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    alignItems: 'center',
                                                    textAlign: 'center',
                                                    padding: '10px',
                                                    borderRadius: '10px',
                                                    backgroundColor: settings.mode === 'dark' ? '#555' : '#f3e5f5', // Adjust background for employee item
                                                    transition: 'all 0.3s ease',
                                                    height: '100%',
                                                    '&:hover': { backgroundColor: settings.mode === 'dark' ? '#666' : '#e1bee7', transform: 'scale(1.05)' }
                                                }}
                                            >
                                                <Avatar
                                                    src={employee.image}
                                                    sx={{
                                                        width: 60,
                                                        height: 60,
                                                        marginBottom: 1,
                                                        border: '2px solid #7b1fa2'
                                                    }}
                                                />
                                                <Typography variant='body2' fontWeight='bold'>
                                                    {employee.first_name} {employee.last_name}
                                                </Typography>
                                                <Typography variant='caption' color='textSecondary'>
                                                    {employee.designation}
                                                </Typography>
                                            </Box>
                                        </Grid>
                                    )
                                })}
                            </Grid>
                        </CardContent>
                    </Card>
                </Box>

                {/* Footer */}
                <Box
                    sx={{
                        backgroundColor: settings.mode === 'dark' ? '#333' : '#ede7f6', // Adjust footer background for dark mode
                        padding: '20px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}
                >
                    <Typography variant='body2' color='textSecondary'>
                        Total Members:{' '}
                        {viewDetails
                            ? getEmployeeCountByIds(viewDetails.employee_ids, employees, viewDetails.manager_id)
                            : 1}
                    </Typography>
                    <Button
                        variant='contained'
                        color='secondary'
                        onClick={onClose}
                        sx={{
                            borderRadius: '20px',
                            textTransform: 'none',
                            fontWeight: 'bold'
                        }}
                    >
                        Close
                    </Button>
                </Box>
            </DialogContent>
        </Dialog>
    )
}
