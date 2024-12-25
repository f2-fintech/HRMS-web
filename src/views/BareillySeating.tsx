'use client'

import React, { useState, useEffect } from 'react';
import { Box, Typography, Grid, Tooltip, Avatar, IconButton } from '@mui/material';
import WeekendIcon from '@mui/icons-material/Weekend';

const BareillySeating = ({ location, setLocation }) => {
    const [seats, setSeats] = useState({
        bottomLeft: Array.from({ length: 4 }, (_, i) => ({ id: i + 10, status: 'available' })),
        leftVertical: Array.from({ length: 9 }, (_, i) => ({ id: i + 1, status: 'available' })),
        middleVerticalTowers: [
            { id: 14, status: 'available' },
            { id: 15, status: 'available' },
            { id: 16, status: 'available' },
            { id: 17, status: 'available' },
            { id: 18, status: 'available' },
        ],
        middleVerticalOpposite: [
            { id: 19, status: 'available' },
            { id: 20, status: 'available' },
            { id: 21, status: 'available' },
            { id: 22, status: 'available' },
            { id: 23, status: 'available' },
        ],
        middleHorizontalRows: Array.from({ length: 9 }, (_, i) => ({ id: 24 + i, status: 'available' })),
        rightCorner: Array.from({ length: 3 }, (_, i) => ({ id: 33 + i, status: 'available' })),
        rightVertical: Array.from({ length: 8 }, (_, i) => ({ id: 36 + i, status: 'available' })),
        bottomMiddle: [{ id: 44, status: 'available' }],
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
                        bottomLeft: updateSeatStatus(seats.bottomLeft),
                        leftVertical: updateSeatStatus(seats.leftVertical),
                        middleVerticalTowers: updateSeatStatus(seats.middleVerticalTowers),
                        middleVerticalOpposite: updateSeatStatus(seats.middleVerticalOpposite),
                        middleHorizontalRows: updateSeatStatus(seats.middleHorizontalRows),
                        rightCorner: updateSeatStatus(seats.rightCorner),
                        rightVertical: updateSeatStatus(seats.rightVertical),
                        bottomMiddle: updateSeatStatus(seats.bottomMiddle),
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

    const renderSeat = (seat, hideNumberBelow = false) => (
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
                position="relative"
                display="inline-block"
                m={1}
                onMouseEnter={() => handleSeatHover(seat)}
                onMouseLeave={handleSeatHoverEnd}
            >
                <IconButton
                    sx={{
                        color: seat.status === 'available' ? '#4CAF50' : '#2196F3',
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
                        position: 'absolute', // Keeps the number relative to the icon
                        top: 'calc(100% + 4px)', // Ensures the number appears below the chair icon
                        left: '50%',
                        transform: 'translate(-50%, 0)',
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

    return (
        <Box p={3}>
            <Grid container spacing={2}>
                {/* Left Wall */}
                <Grid
                    item
                    xs={2}
                    container
                    direction="column"
                    style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%', margin: 0, padding: 0 }}
                >
                    {/* Vertical seats 1 to 9 */}
                    <Box display="flex" flexDirection="column" alignItems="flex-start" style={{ width: '100%' }}>
                        {seats.leftVertical.map(seat => renderSeat(seat, false))}
                    </Box>

                    {/* Horizontal seats 10 to 13 */}
                    <Box display="flex" justifyContent="center" mt="1rem">
                        {seats.bottomLeft.map(seat => renderSeat(seat))}
                    </Box>
                </Grid>

                {/* Middle Section */}
                <Grid item xs={8} container spacing={2} justifyContent="center">
                    {/* Vertical Towers */}
                    <Grid item xs={8} container spacing={2} justifyContent="space-evenly">
                        {/* Left Tower */}
                        <Grid
                            item
                            xs={6}
                            container
                            direction="column"
                            spacing={1.5}
                            alignItems="center"
                            style={{ flex: '1 1 auto' }}
                        >
                            {seats.middleVerticalTowers.map(seat => renderSeat(seat))}
                        </Grid>

                        {/* Right Tower */}
                        <Grid
                            item
                            xs={6}
                            container
                            direction="column"
                            spacing={1.5}
                            alignItems="center"
                            style={{ flex: '1 1 auto' }}
                        >
                            {seats.middleVerticalOpposite.map(seat => renderSeat(seat))}
                        </Grid>
                    </Grid>

                    {/* Horizontal Rows */}
                    <Grid sx={{ marginTop: -20, marginLeft: 20 }} item container spacing={2} justifyContent="space-around" mt="1rem">
                        <Grid sx={{ marginBottom: -20 }} item>
                            {seats.middleHorizontalRows.slice(5).map(seat => renderSeat(seat))}
                        </Grid>
                        <Grid item>
                            {seats.middleHorizontalRows.slice(0, 5).map(seat => renderSeat(seat))}
                        </Grid>
                    </Grid>
                </Grid>

                {/* Right Wall */}
                <Grid item xs={2} container direction="column" alignItems="flex-end" style={{ height: '100%' }}>
                    {seats.rightCorner.map(seat => renderSeat(seat))}
                    {seats.rightVertical.map(seat => renderSeat(seat))}
                </Grid>
                <Grid item xs={12} container justifyContent="center" mt="2rem">
                    {seats.bottomMiddle.map(seat => renderSeat(seat))}
                </Grid>
            </Grid>
        </Box>
    );
};

export default BareillySeating;
