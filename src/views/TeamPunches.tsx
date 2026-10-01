'use client'

import React, { useEffect, useState } from 'react'
import {
    Box,
    Card,
    CardContent,
    Typography,
    Avatar,
    Button,
    CircularProgress
} from '@mui/material'
import { useDispatch } from 'react-redux'
import { fetchTeamsMemberMonthlyAttendence } from '@/redux/features/teams/teamsSlice'
import type { AppDispatch } from '@/redux/store'

interface TeamEmployee {
    // _id: string
    first_name: string
    last_name: string
    image?: string
}

interface TeamPunchesProps {
    managerId: string
    onEmployeeClick: (employee: TeamEmployee) => void
}

const TeamPunches: React.FC<TeamPunchesProps> = ({
    managerId,
    onEmployeeClick
}) => {
    const dispatch = useDispatch<AppDispatch>()

    const [teamId, setTeamId] = useState<string | null>(null)
    const [employees, setEmployees] = useState<TeamEmployee[]>([])
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (!managerId) return

        const fetchTeamId = async () => {
            try {
                setLoading(true)

                const token = localStorage.getItem('token')

                const response = await fetch(
                    `${process.env.NEXT_PUBLIC_APP_URL}/teams/find-teams-by-employee?employee_id=${managerId}`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        }
                    }
                )

                if (!response.ok) {
                    throw new Error('Failed to fetch team')
                }

                const data = await response.json()

                if (data?.length > 0) {
                    setTeamId(data[0])
                } else {
                    setEmployees([])
                }
            } catch (error) {
                console.error('Error fetching team:', error)
                setEmployees([])
            } finally {
                setLoading(false)
            }
        }

        fetchTeamId()
    }, [managerId])

    useEffect(() => {
        if (!teamId) return

        const fetchTeamEmployees = async () => {
            try {
                setLoading(true)

                const user = JSON.parse(
                    localStorage.getItem('user') || '{}'
                )

                const result = await dispatch(
                    fetchTeamsMemberMonthlyAttendence({
                        team_id: teamId,
                        company_id: user?.company_id,
                        month: new Date().getMonth() + 1,
                        year: new Date().getFullYear()
                    })
                )
                setEmployees(result.payload || [])
            } catch (error) {
                console.error('Error fetching team employees:', error)
                setEmployees([])
            } finally {
                setLoading(false)
            }
        }

        fetchTeamEmployees()
    }, [teamId, dispatch])

    // if (loading) {
    //     return (
    //         <Box className="flex justify-center py-6">
    //             <CircularProgress size={30} />
    //         </Box>
    //     )
    // }

    return (
        <Card className="border border-gray-200 rounded-lg shadow-sm mb-6">
            <CardContent>
                <Typography
                    variant="h6"
                    className="font-semibold mb-4"
                >
                    Team Punches
                </Typography>

                {employees.length === 0 ? (
                    <Typography color="text.secondary">
                        No team members found.
                    </Typography>
                ) : (
                    <Box className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                        {employees.map(employee => (
                            <Box
                                key={employee._id}
                                className="flex items-center justify-between border border-gray-200 rounded-lg p-3"
                            >
                                <Box className="flex items-center gap-3">
                                    <Avatar
                                        src={employee.image}
                                        sx={{ width: 40, height: 40 }}
                                    >
                                        {employee.first_name?.charAt(0)}
                                    </Avatar>

                                    <Box>
                                        <Typography
                                            variant="body1"
                                            className="font-medium"
                                        >
                                            {employee.first_name}{' '}
                                            {employee.last_name}
                                        </Typography>

                                        <Typography
                                            variant="caption"
                                            color="text.secondary"
                                        >
                                            View monthly punches
                                        </Typography>
                                    </Box>
                                </Box>

                                <Button
                                    size="small"
                                    variant="contained"
                                    onClick={() =>
                                    onEmployeeClick(employee)
                                    }
                                >
                                    View
                                </Button>
                            </Box>
                        ))}
                    </Box>
                )}
            </CardContent>
        </Card>
    )
}

export default TeamPunches
