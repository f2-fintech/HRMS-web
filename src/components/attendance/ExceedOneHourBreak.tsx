import React from 'react'
import { Card, CardContent, Typography, Avatar, Box } from '@mui/material'

// Define the interface for Employee
interface Employee {
    first_name: string
    last_name: string
    image: string
    location: string
    totalBreakTime: string // Keep as string to match backend response
    breaks?: {
        remarks?: string
    }[]
}

const ExceedOneHourBreak: React.FC<{ employee: Employee }> = ({ employee }) => {
    const { first_name, last_name, image, location, totalBreakTime } = employee
    const latestRemark = employee.breaks
        ?.filter(b => b.remarks)
        ?.slice(-1)[0];
    return (
        <Card sx={{ maxWidth: 345, margin: '10px', boxShadow: 3 }}>
            <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Avatar alt={`${first_name} ${last_name}`} src={image} sx={{ width: 60, height: 60, marginRight: 2 }} />
                    <Box>
                        <Typography variant='h6'>{`${first_name} ${last_name}`}</Typography>
                        <Typography variant='body2' color='text.secondary'>
                            {location}
                        </Typography>
                    </Box>
                </Box>

                <Box
                    sx={{
                        marginTop: 2,
                        padding: '6px 12px',
                        backgroundColor: '#FF8488',
                        borderRadius: '4px',
                        display: 'inline-block',
                        color: '#fff'
                    }}
                >
                    <Typography color='white' variant='body2'>
                        Total: {totalBreakTime}
                    </Typography>
                    {latestRemark && (
                        <Box
                            sx={{
                                mt: 1,
                                px: 1.5,
                                py: 0.5,
                                backgroundColor: '#fff3e0',
                                borderRadius: '6px',
                                borderLeft: '3px solid orange'
                            }}
                        >
                            <Typography variant='caption' color='text.secondary'>
                                💬 {latestRemark.remarks}
                            </Typography>
                        </Box>
                    )}
                </Box>
            </CardContent>
        </Card>
    )
}

export default ExceedOneHourBreak
