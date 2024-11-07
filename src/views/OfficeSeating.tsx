'use client'


import React, { useState } from 'react';
import { Box, Typography, IconButton, Grid, Dialog, DialogContent } from '@mui/material';
import WeekendIcon from '@mui/icons-material/Weekend';
import AddSeatingArrangementForm from '../components/sitting-arrangment/AddSeatingArrangementForm';

const OfficeSeating = () => {
    const [seats, setSeats] = useState({
        itSeats: Array.from({ length: 5 }, (_, i) => ({ id: i + 1, status: 'available' })),
        employeeRows: Array.from({ length: 4 }, (_, row) => ({
            id: `row-${row + 1}`,
            seats: Array.from({ length: 18 }, (_, i) => ({
                id: 6 + row * 18 + i, // Starting from seat number 6
                status: i % 2 === 0 ? 'available' : 'booked',
            })),
        })),
        outSeating: [{ id: 78, status: 'available' }, { id: 79, status: 'booked' }],
        ceoSeats: [{ id: 80, status: 'available' }, { id: 81, status: 'selected' }],
    });

    const [selectedSeat, setSelectedSeat] = useState(null);
    const [openForm, setOpenForm] = useState(false);

    const handleSeatClick = async (seat) => {
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

    const getSeatColor = (status) => {
        switch (status) {
            case 'available':
                return 'lightgreen';
            case 'booked':
                return 'gray';
            case 'selected':
                return 'yellow';
            default:
                return 'lightgray';
        }
    };

    const renderSeat = (seat) => (
        <Box key={seat.id} position="relative" display="inline-block" m={1}>
            <IconButton
                onClick={() => handleSeatClick(seat)}
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
                    top: 0,
                    left: '50%',
                    transform: 'translate(-50%, 0)',
                    fontSize: '0.8rem',
                    fontWeight: 'bold',
                    color: '#000',
                }}
            >
                {seat.id}
            </Typography>
        </Box>
    );

    return (
        <Box p={3}>
            <Typography variant="h4" gutterBottom>
                Office Seating Layout
            </Typography>

            {/* Legend */}
            <Box display="flex" mb={2} alignItems="center">
                <Box display="flex" alignItems="center" mr={2}>
                    <WeekendIcon sx={{ color: 'lightgreen' }} />
                    <Typography ml={1}>Available</Typography>
                </Box>
                <Box display="flex" alignItems="center" mr={2}>
                    <WeekendIcon sx={{ color: 'gray' }} />
                    <Typography ml={1}>Booked</Typography>
                </Box>
                <Box display="flex" alignItems="center" mr={2}>
                    <WeekendIcon sx={{ color: 'yellow' }} />
                    <Typography ml={1}>Selected</Typography>
                </Box>
            </Box>

            {/* IT Seating Section */}
            <Typography variant="h6">IT Seating</Typography>
            <Grid container spacing={2} mb={2}>
                {seats.itSeats.map(seat => (
                    <Grid item key={seat.id}>
                        {renderSeat(seat)}
                    </Grid>
                ))}
            </Grid>

            {/* Employee Rows */}
            {seats.employeeRows.map((row, rowIndex) => (
                <Box key={row.id} mb={2}>
                    <Typography variant="h6">{`Employee Row ${rowIndex + 1}`}</Typography>
                    <Grid container spacing={1}>
                        {row.seats.map(seat => (
                            <Grid item key={seat.id}>
                                {renderSeat(seat)}
                            </Grid>
                        ))}
                    </Grid>
                </Box>
            ))}

            {/* Outside Seating */}
            <Typography variant="h6">Outside Seating</Typography>
            <Grid container spacing={2} mb={2}>
                {seats.outSeating.map(seat => (
                    <Grid item key={seat.id}>
                        {renderSeat(seat)}
                    </Grid>
                ))}
            </Grid>

            {/* CEO Seating */}
            <Typography variant="h6">CEO Seating</Typography>
            <Grid container spacing={2}>
                {seats.ceoSeats.map(seat => (
                    <Grid item key={seat.id}>
                        {renderSeat(seat)}
                    </Grid>
                ))}
            </Grid>

            {/* Add/Edit Seat Form Dialog */}
            <Dialog open={openForm} onClose={handleFormClose} fullWidth maxWidth="sm">
                <DialogContent>
                    {selectedSeat && (
                        <AddSeatingArrangementForm
                            seatingArrangementId={selectedSeat.exists ? selectedSeat.id : null}
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
