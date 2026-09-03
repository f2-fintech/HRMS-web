// NotPunchedOutPage.tsx
import React, { useEffect, useState } from 'react';
import { Container, Typography, Grid, Card, CardContent, Avatar, CircularProgress } from '@mui/material';

interface Employee {
    first_name: string;
    last_name: string;
    image: string;
}

interface NotPunchedOutPageProps {
    selectedDate: string;
}

const NotPunchedOutPage: React.FC<NotPunchedOutPageProps> = ({ selectedDate }) => {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [totalNotPunchedOut, setTotalNotPunchedOut] = useState<number>(0);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        const fetchEmployees = async () => {
            try {
                let token: string | null = null;
                const { company_id } =
                    typeof window !== 'undefined'
                        ? JSON.parse(localStorage?.getItem('user') || '{}')
                        : {};

                if (typeof window !== 'undefined') {
                    token = localStorage?.getItem('token');
                }

                // Add the selectedDate as a query parameter (adjust the param name as per your API)
                const response = await fetch(
                    `${process.env.NEXT_PUBLIC_APP_URL}/punch/not-punched-out?date=${selectedDate}`,
                    {
                        method: 'GET',
                        headers: {
                            Authorization: `Bearer ${token} ${company_id}`,
                            'Content-Type': 'application/json',
                        },
                    }
                );

                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }

                const data = await response.json();
                setEmployees(data.employees);
                setTotalNotPunchedOut(data.totalNotPunchedOut);
            } catch (error) {
                console.error('Error fetching employees:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchEmployees();
    }, [selectedDate]);

    if (loading) {
        return (
            <Container style={{ textAlign: 'center', marginTop: '2rem' }}>
                <CircularProgress />
            </Container>
        );
    }

    return (
        <Container>
            <Typography variant="h4" gutterBottom>
                Employees Not Punched Out Today
            </Typography>

            <Typography variant="h6" color="textSecondary" gutterBottom>
                Total Not Punched Out: {totalNotPunchedOut}
            </Typography>

            <Grid container spacing={1}>
                {employees.map((employee, index) => (
                    <Grid item xs={12} sm={6} md={3} key={index}>
                        <Card>
                            <CardContent style={{ textAlign: 'center' }}>
                                <Avatar
                                    alt={`${employee.first_name} ${employee.last_name}`}
                                    src={employee.image}
                                    style={{ margin: '0 auto', width: 30, height: 30 }}
                                />
                                <Typography variant="h6" style={{ marginTop: '1rem' }}>
                                    {employee.first_name} {employee.last_name}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>
        </Container>
    );
};

export default NotPunchedOutPage;
