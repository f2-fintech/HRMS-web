'use client';

import React, { useState, useEffect } from 'react';
import { Box, Typography, Grid, Tooltip, Avatar, IconButton, FormControl, InputLabel, Select, MenuItem, Paper } from '@mui/material';

import WeekendIcon from '@mui/icons-material/Weekend';
import ListAltIcon from '@mui/icons-material/ListAlt';

import OfficeSeating from './OfficeSeating'; // Import Noida seating layout
import BareillySeating from './BareillySeating';

const PatelNagarSeating = ({ location, setLocation }) => {

    const [seats, setSeats] = useState({
        topRow: [{ id: 1, status: 'available' }, { id: 2, status: 'available' }, { id: 3, status: 'available' }, { id: 4, status: 'available' }],
        employeeColumn1: Array.from({ length: 9 }, (_, i) => ({ id: 5 + i, status: 'available' })),
        employeeColumn2: Array.from({ length: 9 }, (_, i) => ({ id: 14 + i, status: 'available' })),
    });
    const [hoveredSeat, setHoveredSeat] = useState(null);


    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const companyId = user.company_id

    useEffect(() => {
        const fetchSeatingData = async () => {
            try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/seating-arrangement/get-all-by-location?location=${location}&companyId=${companyId}`);
                const data = await response.json();
                if (response.ok) {
                    setSeats(prevSeats => {
                        const updateSeatStatus = (section) =>
                            section.map(seat => {
                                const foundSeat = data.data.find(dbSeat => dbSeat.seatNo === String(seat.id) && dbSeat.employeeData.location === "patel nagar");
                                return foundSeat ? { ...seat, status: 'booked' } : { ...seat, status: 'available' };
                            });

                        return {
                            topRow: updateSeatStatus(prevSeats.topRow),
                            employeeColumn1: updateSeatStatus(prevSeats.employeeColumn1),
                            employeeColumn2: updateSeatStatus(prevSeats.employeeColumn2),
                        };
                    });
                }
            } catch (error) {
                console.error("Error fetching seating data:", error);
            }
        };

        fetchSeatingData();
    }, [location]);

    const handleSeatHover = async (seat) => {
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/seating-arrangement/by-seat/${seat.id}?location=patel nagar&company_id=${companyId}`);
            if (response.ok) {
                const data = await response.json();
                if (data && data.employeeData && data.employeeData.location === "patel nagar") {
                    setHoveredSeat({
                        seatNo: data.seatNo,
                        employee: data.employeeData
                    });
                } else {
                    setHoveredSeat(null);
                }
            }
        } catch (error) {
            console.error("Error fetching seat data:", error);
        }
    };

    const handleSeatHoverEnd = () => setHoveredSeat(null);

    const renderSeat = (seat) => (
        <Tooltip
            title={
                hoveredSeat?.seatNo === String(seat.id) && hoveredSeat.employee ? (
                    <Box display="flex" flexDirection="column" alignItems="center">
                        <Avatar src={hoveredSeat.employee.image} alt="Employee" sx={{ width: 50, height: 50, mb: 1 }} />
                        <Typography variant="body2" fontWeight="bold" color="white">
                            {hoveredSeat.employee.first_name} {hoveredSeat.employee.last_name}
                        </Typography>
                    </Box>
                ) : (
                    ''
                )
            }
            placement="top"
            arrow
        >
            <Box
                key={seat.id}
                position="relative"
                display="inline-block"
                m={1}
                onMouseEnter={() => handleSeatHover(seat)}
                onMouseLeave={handleSeatHoverEnd}
                sx={{
                    textAlign: 'center',
                }}
            >
                <IconButton
                    sx={{
                        color: seat.status === 'available' ? '#4CAF50 ' : '#2196F3 ',
                        fontSize: 40,
                        '& .MuiSvgIcon-root': {
                            fontSize: 40,
                        },
                    }}
                >
                    <WeekendIcon />
                </IconButton>
                <Typography
                    variant="caption"
                    sx={{
                        position: 'absolute',
                        top: '90%',
                        left: '50%',
                        transform: 'translate(-50%, -10%)',
                        fontSize: '0.8rem',
                        fontWeight: 'bold',
                        color: 'gray',
                    }}
                >
                    {seat.id}
                </Typography>
            </Box>
        </Tooltip>
    );

    if (location === "noida") {
        return <OfficeSeating />;
    }
    if (location === "bareilly") {
        return <BareillySeating location={location} setLocation={setLocation} />
    }

    return (
        <Box p={3}>

            {/* Consolidated layout for Top Row and Employee Seats */}
            <Box display="flex" flexDirection="column" alignItems="center">
                {/* Top Row of 4 Seats */}
                <Paper elevation={3} sx={{ p: 2, mb: 4, width: '80%' }}>
                    <Typography variant="h6" textAlign="center" gutterBottom>
                        Top Row
                    </Typography>
                    <Grid container spacing={1} justifyContent="center">
                        {seats.topRow.map((seat, index) => (
                            <Grid item xs={6} key={index} display="flex" justifyContent="center">
                                {renderSeat(seat)}
                            </Grid>
                        ))}
                    </Grid>
                </Paper>

                {/* Employee Seats in Two Columns of 9 Each */}
                <Paper elevation={3} sx={{ p: 2, width: '80%' }}>
                    <Typography variant="h6" textAlign="center" gutterBottom>
                        Employee Seats
                    </Typography>
                    <Grid container spacing={2} justifyContent="center">
                        <Grid item xs={3} display="flex" flexDirection="column" alignItems="center">
                            {seats.employeeColumn1.map(seat => renderSeat(seat))}
                        </Grid>
                        <Grid item xs={3} display="flex" flexDirection="column" alignItems="center">
                            {seats.employeeColumn2.map(seat => renderSeat(seat))}
                        </Grid>
                    </Grid>
                </Paper>
            </Box>
        </Box>
    );
};

export default PatelNagarSeating;
