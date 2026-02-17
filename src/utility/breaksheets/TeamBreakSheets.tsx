'use client'

import React, { useEffect, useState } from 'react'
import { Box, Grid, Typography, Card, CardContent, Divider, Avatar } from '@mui/material'
import { useDispatch, useSelector } from 'react-redux'
import { fetchTeamsByManager } from '@/redux/features/teams/teamsSlice'
import { RootState, AppDispatch } from '@/redux/store'
import { apiResponse } from '@/utility/apiResponse/employeesResponse'
import GroupIcon from '@mui/icons-material/Group'

interface TeamBreakSheetsProps {
    managerId: string
    onEmployeeClick: (employeeId: string) => void
}

const TeamBreakSheets: React.FC<TeamBreakSheetsProps> = ({ managerId, onEmployeeClick }) => {
    const dispatch: AppDispatch = useDispatch()
    const { teams, loading, error } = useSelector((state: RootState) => state.teams)
    const [employees, setEmployees] = useState<any[]>([])
    const [employeesLoading, setEmployeesLoading] = useState(true)
    const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null)

    useEffect(() => {
        const fetchEmployees = async () => {
            try {
                const employeeData = await apiResponse()
                setEmployees(employeeData)
                setEmployeesLoading(false)
            } catch (error) {
                console.error('Error fetching employees:', error)
                setEmployeesLoading(false)
            }
        }
        fetchEmployees()
    }, [])

    useEffect(() => {
        if (managerId) {
            dispatch(fetchTeamsByManager(managerId)).catch(err => {
                console.error('Error fetching teams:', err)
            })
        }
    }, [dispatch, managerId])

    const getEmployeeDetails = (empId: string) => {
        const employee = employees.find(emp => emp._id === empId.trim())
        return employee
            ? { name: `${employee.first_name} ${employee.last_name}`, image: employee.image || null }
            : { name: 'Employee not found', image: null }
    }

    const handleEmployeeClick = (empId: string) => {
        if (selectedEmployeeId === empId) {
            setSelectedEmployeeId(null)
            onEmployeeClick(null)
        } else {
            setSelectedEmployeeId(empId)
            onEmployeeClick(empId)
        }
    }

    return (
        <Box sx={{ mt: 4 }}>
            <Typography variant='h4' sx={{ mb: 3, fontWeight: 'bold' }}>
                Teams and Employees
            </Typography>
            {loading || employeesLoading ? (
                <Typography variant='body1'>Loading teams and employees...</Typography>
            ) : error ? (
                <Typography variant='body1' color='error'>
                    Error fetching teams: {error}
                </Typography>
            ) : (
                <Grid container spacing={3}>
                    {teams.length > 0 ? (
                        teams.map(team => (
                            <Grid item xs={12} key={team._id}>
                                <Card variant='outlined' sx={{ borderRadius: '8px', boxShadow: 3 }}>
                                    <CardContent>
                                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                            <GroupIcon sx={{ color: 'primary.main', mr: 1 }} />
                                            <Typography variant='h6' sx={{ fontWeight: 'bold' }}>
                                                {team.name}
                                            </Typography>
                                        </Box>

                                        <Divider sx={{ my: 2 }} />
                                        <Grid container spacing={2}>
                                            {team.employee_ids.split(',').map(empId => {
                                                const { name, image } = getEmployeeDetails(empId)
                                                return (
                                                    <Grid item xs={12} sm={3} key={empId}>
                                                        <Box
                                                            sx={{
                                                                cursor: 'pointer',
                                                                padding: 1,
                                                                backgroundColor:
                                                                    selectedEmployeeId === empId ? 'rgba(0, 123, 255, 0.1)' : 'transparent',
                                                                border: selectedEmployeeId === empId ? '1px solid blue' : 'none',
                                                                '&:hover': { textDecoration: 'underline', backgroundColor: 'rgba(0, 123, 255, 0.1)' },
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: 1
                                                            }}
                                                            onClick={() => handleEmployeeClick(empId)}
                                                        >
                                                            {image ? (
                                                                <Avatar src={image} alt={name} sx={{ width: 40, height: 40 }} />
                                                            ) : (
                                                                <Avatar sx={{ width: 40, height: 40 }}>{name[0]}</Avatar>
                                                            )}
                                                            <Typography variant='body2'>{name}</Typography>
                                                        </Box>
                                                    </Grid>
                                                )
                                            })}
                                        </Grid>
                                    </CardContent>
                                </Card>
                            </Grid>
                        ))
                    ) : (
                        <Typography variant='body1'>No teams found for this manager.</Typography>
                    )}
                </Grid>
            )}
        </Box>
    )
}

export default TeamBreakSheets
