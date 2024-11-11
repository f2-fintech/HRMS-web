'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

import { Box, Typography, Grid, Tooltip, Avatar, IconButton, FormControl, InputLabel, Select, MenuItem, Paper, Button } from '@mui/material';

import WeekendIcon from '@mui/icons-material/Weekend';

import ListAltIcon from '@mui/icons-material/ListAlt';

import OfficeSeating from './OfficeSeating'; // Import Noida seating layout
import PatelNagarSeating from './PatelNagarSeating';

const BareillySeating = () => {
    const [location, setLocation] = useState("bareilly");
    const [seats, setSeats] = useState({
        leftVertical: Array.from({ length: 9 }, (_, i) => ({ id: i + 1, status: 'available' })),
        leftHorizontal1: [{ id: 10, status: 'available' }, { id: 11, status: 'available' }, { id: 12, status: 'available' }],
        leftHorizontal2: [{ id: 13, status: 'available' }, { id: 14, status: 'available' }, { id: 15, status: 'available' }],
        rightVertical: Array.from({ length: 11 }, (_, i) => ({ id: 16 + i, status: 'available' })),
        rightHorizontal1: [{ id: 27, status: 'available' }, { id: 28, status: 'available' }, { id: 29, status: 'available' }],
        rightHorizontal2: [{ id: 30, status: 'available' }, { id: 31, status: 'available' }, { id: 32, status: 'available' }],
        middleColumn1: Array.from({ length: 5 }, (_, i) => ({ id: 34 + i, status: 'available' })),
        middleColumn2: Array.from({ length: 5 }, (_, i) => ({ id: 39 + i, status: 'available' })),
    });
    const [hoveredSeat, setHoveredSeat] = useState(null);

    useEffect(() => {
        const fetchSeatingData = async () => {
            try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/seating-arrangement/get-all-by-location?location=${location}`);
                const data = await response.json();
                if (response.ok) {
                    const updateSeatStatus = (section) =>
                        section.map(seat => {
                            const foundSeat = data.data.find(dbSeat => dbSeat.seatNo === String(seat.id) && dbSeat.employeeData.location === location);
                            return foundSeat ? { ...seat, status: 'booked' } : { ...seat, status: 'available' };
                        });

                    setSeats({
                        leftVertical: updateSeatStatus(seats.leftVertical),
                        leftHorizontal1: updateSeatStatus(seats.leftHorizontal1),
                        leftHorizontal2: updateSeatStatus(seats.leftHorizontal2),
                        rightVertical: updateSeatStatus(seats.rightVertical),
                        rightHorizontal1: updateSeatStatus(seats.rightHorizontal1),
                        rightHorizontal2: updateSeatStatus(seats.rightHorizontal2),
                        middleColumn1: updateSeatStatus(seats.middleColumn1),
                        middleColumn2: updateSeatStatus(seats.middleColumn2),
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
            const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/seating-arrangement/by-seat/${seat.id}?location=${location}`);
            if (response.ok) {
                const data = await response.json();
                if (data && data.employeeData && data.employeeData.location === location) {
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
            key={seat.id}
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

    // Render alternative components based on location
    if (location === "noida") {
        return <OfficeSeating />;
    }
    if (location === "patel nagar") {
        return <PatelNagarSeating />;
    }

    return (
        <Box p={3}>

            <Box display="flex" alignItems="center" mb={2}>
                {/* Seat Availability Legend */}
                <Box display="flex" alignItems="center">
                    <WeekendIcon sx={{ color: '#4CAF50 ', mr: 1 }} />
                    <Typography>Available</Typography>
                    <WeekendIcon sx={{ color: '#2196F3 ', ml: 2, mr: 1 }} />
                    <Typography>Booked</Typography>
                </Box>

                {/* Location Dropdown */}


                {/* View Seating List Button with Icon */}
                <Box ml={2}>
                    <Tooltip title="View Seating List" arrow>
                        <Link href="/seating" passHref>
                            <Button
                                color="primary"
                                startIcon={<ListAltIcon sx={{ fontSize: 26 }} />}
                                sx={{
                                    textTransform: 'none',
                                    minWidth: 'auto',
                                    padding: '0.4rem 0.6rem',
                                }}
                            />
                        </Link>
                    </Tooltip>
                </Box>
                <FormControl sx={{ minWidth: 150, ml: 2 }}>
                    <InputLabel>Location</InputLabel>
                    <Select
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        label="Location"
                    >
                        <MenuItem value="bareilly">Bareilly</MenuItem>
                        <MenuItem value="noida">Noida</MenuItem>
                        <MenuItem value="patel nagar">Patel Nagar</MenuItem>
                    </Select>
                </FormControl>
            </Box>

            <Box display="flex" justifyContent="space-between">
                {/* Left Section */}
                <Paper elevation={3} sx={{ p: 2, width: '30%' }}>
                    <Typography variant="h6" align="center">Left Side</Typography>
                    <Grid container direction="row" justifyContent="center" sx={{ mb: 2 }}>
                        {seats.leftHorizontal2.map(seat => renderSeat(seat))}
                    </Grid>
                    <Grid container direction="row" justifyContent="center" sx={{ mb: 2, mt: 8 }}>
                        {seats.leftHorizontal1.map(seat => renderSeat(seat))}
                    </Grid>
                    <Grid container direction="column-reverse" alignItems="flex-start">
                        {seats.leftVertical.map(seat => renderSeat(seat))}
                    </Grid>
                </Paper>

                {/* Middle Section */}
                <Paper elevation={3} sx={{ p: 2, width: '25%', height: '40%', marginTop: '12rem' }}>
                    <Typography variant="h6" align="center">Middle Section</Typography>
                    <Grid container spacing={6} justifyContent="center">
                        <Grid item>
                            <Grid container direction="column" alignItems="center">
                                {seats.middleColumn1.map(seat => renderSeat(seat))}
                            </Grid>
                        </Grid>
                        <Grid item>
                            <Grid container direction="column" alignItems="center">
                                {seats.middleColumn2.map(seat => renderSeat(seat))}
                            </Grid>
                        </Grid>
                    </Grid>
                </Paper>

                {/* Right Section */}
                <Paper elevation={3} sx={{ p: 2, width: '30%' }}>
                    <Typography variant="h6" align="center">Right Side</Typography>
                    <Grid container direction="row" justifyContent="center" sx={{ mb: 2 }}>
                        {seats.rightHorizontal2.map(seat => renderSeat(seat))}
                    </Grid>
                    <Grid container direction="row" justifyContent="center" sx={{ mb: 2, mt: 5 }}>
                        {seats.rightHorizontal1.map(seat => renderSeat(seat))}
                    </Grid>
                    <Grid container direction="column-reverse" alignItems="flex-end">
                        {seats.rightVertical.map(seat => renderSeat(seat))}
                    </Grid>
                </Paper>
            </Box>
        </Box>
    );
};

export default BareillySeating;
