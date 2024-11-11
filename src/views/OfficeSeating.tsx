'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Box, Typography, IconButton, Grid, Dialog, DialogContent, Tooltip, Avatar, Button, MenuItem, Select, FormControl, InputLabel, Paper } from '@mui/material';

import WeekendIcon from '@mui/icons-material/Weekend';
import ListAltIcon from '@mui/icons-material/ListAlt';
import AddSeatingArrangementForm from '../components/sitting-arrangment/AddSeatingArrangementForm';
import PatelNagarSeating from './PatelNagarSeating';
import BareillySeating from './BareillySeating';

const OfficeSeating = () => {
    const [location, setLocation] = useState("noida");
    const [seats, setSeats] = useState({
        itSeats: Array.from({ length: 5 }, (_, i) => ({ id: i + 1, status: 'available' })),
        employeeRows: Array.from({ length: 4 }, (_, row) => ({
            id: `row-${row + 1}`,
            seats: Array.from({ length: 18 }, (_, i) => ({
                id: 6 + row * 18 + i,
                status: 'available',
            })),
        })),
        outSeating: [{ id: 78, status: 'available' }, { id: 79, status: 'available' }],
        ceoSeats: [{ id: 80, status: 'available' }, { id: 81, status: 'available' }],
        hrSeats: [{ id: 82, status: 'available' }]
    });

    const [selectedSeat, setSelectedSeat] = useState(null);
    const [openForm, setOpenForm] = useState(false);
    const [hoveredSeat, setHoveredSeat] = useState(null);

    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const userRole = user.role;


    useEffect(() => {
        const fetchSeatingData = async () => {
            try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/seating-arrangement/get-all-by-location?location=${location}`);
                const data = await response.json();

                if (response.ok && data?.data) {
                    setSeats(prevSeats => {
                        const updateSeatStatus = (section) =>
                            section.map(seat => {
                                const foundSeat = data.data.find(dbSeat => dbSeat.seatNo === String(seat.id) && dbSeat.employeeData.location.toLowerCase() === location.toLowerCase());
                                return foundSeat
                                    ? { ...seat, status: 'booked', employeeData: foundSeat.employeeData }
                                    : { ...seat, status: 'available' };
                            });

                        return {
                            itSeats: updateSeatStatus(prevSeats.itSeats),
                            employeeRows: prevSeats.employeeRows.map(row => ({
                                ...row,
                                seats: updateSeatStatus(row.seats),
                            })),
                            outSeating: updateSeatStatus(prevSeats.outSeating),
                            ceoSeats: updateSeatStatus(prevSeats.ceoSeats),
                            hrSeats: updateSeatStatus(prevSeats.hrSeats),
                        };
                    });
                } else {
                    console.error("Failed to fetch seating arrangements.");
                }
            } catch (error) {
                console.error("Error fetching seating data:", error);
            }
        };

        fetchSeatingData();
    }, [location]);

    const handleSeatClick = (seat) => {
        setSelectedSeat(seat);
        setOpenForm(true);
    };

    const handleFormClose = () => {
        setOpenForm(false);
        setSelectedSeat(null);
    };

    const handleFormSubmitSuccess = (message) => {
        console.log(message);
        handleFormClose();
    };

    const handleSeatHover = async (seat) => {
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/seating-arrangement/by-seat/${seat.id}?location=${location}`);
            if (response.ok) {
                const data = await response.json();
                if (data && data.employeeData) {
                    setHoveredSeat({
                        seatNo: data.seatNo,
                        employee: data.employeeData
                    });
                }
            } else {
                setHoveredSeat(null);
            }
        } catch (error) {
            console.error("Error fetching seat data:", error);
        }
    };

    const handleSeatHoverEnd = () => {
        setHoveredSeat(null);
    };

    const getSeatColor = (status) => (status === 'available' ? '#4CAF50' : '#2196F3');

    const renderSeat = (seat) => (
        <Tooltip
            title={
                hoveredSeat?.seatNo === String(seat.id) && hoveredSeat.employee ? (
                    <Box display="flex" flexDirection="column" alignItems="center">
                        <Avatar
                            src={hoveredSeat.employee.image}
                            alt="Employee"
                            sx={{ width: 50, height: 50, mb: 1 }}
                        />
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
                        color: getSeatColor(seat.status),
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
                        top: '83%',
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

    return (
        <Box p={3} display="flex" flexDirection="column" border="1px solid #000" borderRadius="8px">
            <Typography variant="h4" gutterBottom>
                Workspace Layout ({location.toLocaleUpperCase()})
            </Typography>

            {location === "noida" ? (
                <Box display="flex">
                    <Box flex="3" mr={4}>
                        <Box display="flex" mb={2} alignItems="center">
                            <Box display="flex" alignItems="center" mr={1}>
                                <WeekendIcon sx={{ color: '#4CAF50' }} />
                                <Typography ml={0.5}>Available</Typography>
                            </Box>
                            <Box display="flex" alignItems="center" mr={1}>
                                <WeekendIcon sx={{ color: '#2196F3' }} />
                                <Typography ml={0.5}>Booked</Typography>
                            </Box>
                            <Box ml={1}>
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
                            <FormControl size="small" sx={{ minWidth: 120 }}>
                                <InputLabel>Location</InputLabel>
                                <Select
                                    value={location}
                                    onChange={(e) => setLocation(e.target.value)}
                                    label="Location"
                                >
                                    {['noida', 'patel nagar', 'bareilly'].map(loc => (
                                        <MenuItem key={loc} value={loc}>
                                            {loc.toUpperCase()}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Box>

                        <Typography style={{ color: 'blue' }} variant="h6">ITWorkSpaces</Typography>
                        <Paper variant="outlined" sx={{ width: 'fit-content', p: 3, borderRadius: 2, mb: 2 }}> {/* Adds bottom margin */}
                            <Grid
                                container
                                spacing={2}
                                direction="row-reverse"
                                justifyContent="space-between" // Distributes seats across the full width
                                alignItems="center"
                                wrap="nowrap"
                                sx={{
                                    width: '100%', // Ensures Grid takes the full width of the Paper
                                }}
                            >
                                {seats.itSeats.map(seat => (
                                    <Grid item key={seat.id}>
                                        {renderSeat(seat)}
                                    </Grid>
                                ))}
                            </Grid>
                        </Paper>


                        {seats.employeeRows.map((row, rowIndex) => (
                            <Box key={row.id} mb={2} sx={{ width: '38rem', p: 2, border: '1px solid lightgray', borderRadius: '8px' }}>
                                <Typography style={{ color: 'blue' }} variant="h6">{`Desk Row ${rowIndex + 1}`}</Typography>

                                {/* First Row of 9 Seats, Right to Left */}
                                <Grid container spacing={1} justifyContent="center" wrap="nowrap" direction="row-reverse">
                                    {row.seats.slice(0, 9).map(seat => (
                                        <Grid item key={seat.id}>
                                            {renderSeat(seat)}
                                        </Grid>
                                    ))}
                                </Grid>

                                {/* Second Row of 9 Seats, Right to Left */}
                                <Grid container spacing={1} justifyContent="center" wrap="nowrap" direction="row-reverse">
                                    {row.seats.slice(9).map(seat => (
                                        <Grid item key={seat.id}>
                                            {renderSeat(seat)}
                                        </Grid>
                                    ))}
                                </Grid>
                            </Box>
                        ))}

                    </Box>

                    <Paper
                        variant="outlined"
                        sx={{
                            flex: '1',
                            p: 2,
                            borderRadius: 2,
                            display: 'flex',
                            flexDirection: 'column',
                            marginTop: '6rem',
                            justifyContent: 'space-between',
                        }}
                    >
                        <Typography variant="h6" align="center" gutterBottom>Reserved Seats</Typography>
                        <Box>
                            <Typography variant="h6" align="center">Reception</Typography>
                            <Grid container spacing={2} direction="column" alignItems="center">
                                {seats.outSeating.map(seat => (
                                    <Grid item key={seat.id}>
                                        {renderSeat(seat)}
                                    </Grid>
                                ))}
                            </Grid>
                        </Box>

                        <Box>
                            <Typography variant="h6" align="center">CEO</Typography>
                            <Grid container spacing={2} direction="column" alignItems="center">
                                {seats.ceoSeats.map(seat => (
                                    <Grid item key={seat.id}>
                                        {renderSeat(seat)}
                                    </Grid>
                                ))}
                            </Grid>
                        </Box>

                        <Box>
                            <Typography variant="h6" align="center">HR</Typography>
                            <Grid container spacing={2} direction="column" alignItems="center">
                                {seats.hrSeats.map(seat => (
                                    <Grid item key={seat.id}>
                                        {renderSeat(seat)}
                                    </Grid>
                                ))}
                            </Grid>
                        </Box>
                    </Paper>
                </Box>
            ) : location === "patel nagar" ? (
                <PatelNagarSeating />
            ) : (
                <BareillySeating />
            )}

            <Dialog open={openForm} onClose={handleFormClose} fullWidth maxWidth="sm">
                <DialogContent>
                    {selectedSeat && (
                        <AddSeatingArrangementForm
                            seatingArrangementId={selectedSeat.id}
                            handleClose={handleFormClose}
                            onFormSubmitSuccess={handleFormSubmitSuccess}
                            onFormSubmitError={(message) => console.error(message)}
                        />
                    )}
                </DialogContent>
            </Dialog>
        </Box>
    );
};

export default OfficeSeating;
