'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import {
    Box,
    Typography,
    IconButton,
    Grid,
    Dialog,
    DialogContent,
    Tooltip,
    Avatar,
    Button,
    MenuItem,
    Select,
    FormControl,
    InputLabel,
    Paper
} from '@mui/material'
import WeekendIcon from '@mui/icons-material/Weekend'
import ListAltIcon from '@mui/icons-material/ListAlt'
import AddSeatingArrangementForm from '../components/sitting-arrangment/AddSeatingArrangementForm'
import PatelNagarSeating from './PatelNagarSeating'
import BareillySeating from './BareillySeating'

const OfficeSeating = () => {
    const [location, setLocation] = useState('noida')
    const [seats, setSeats] = useState({
        itSeats: Array.from({ length: 5 }, (_, i) => ({ id: i + 1, status: 'available' })),
        employeeRows: Array.from({ length: 4 }, (_, row) => ({
            id: `row-${row + 1}`,
            seats: Array.from({ length: 18 }, (_, i) => ({
                id: 6 + row * 18 + i,
                status: 'available'
            }))
        })),
        outSeating: [
            { id: 78, status: 'available' },
            { id: 79, status: 'available' }
        ],
        ceoSeats: [
            { id: 80, status: 'available' },
            { id: 81, status: 'available' }
        ],
        hrSeats: [{ id: 90, status: 'available' }],
        conferenceSeats: Array.from({ length: 8 }, (_, i) => ({ id: 82 + i, status: 'available' }))
    })

    const [selectedSeat, setSelectedSeat] = useState(null)
    const [openForm, setOpenForm] = useState(false)
    const [hoveredSeat, setHoveredSeat] = useState(null)

    const user = JSON.parse(localStorage.getItem('user') || '{}')
    const userRole = user.role
    const companyId = user.company_id

    useEffect(() => {
        const fetchSeatingData = async () => {
            try {
                const response = await fetch(
                    `${process.env.NEXT_PUBLIC_APP_URL}/seating-arrangement/get-all-by-location?location=${location}&companyId=${companyId}`
                )
                const data = await response.json()

                if (response.ok && data?.data) {
                    setSeats(prevSeats => {
                        const updateSeatStatus = section =>
                            section.map(seat => {
                                const foundSeat = data.data.find(
                                    dbSeat =>
                                        dbSeat.seatNo === String(seat.id) &&
                                        dbSeat.employeeData.location.toLowerCase() === location.toLowerCase()
                                )
                                return foundSeat
                                    ? { ...seat, status: 'booked', employeeData: foundSeat.employeeData }
                                    : { ...seat, status: 'available' }
                            })

                        return {
                            itSeats: updateSeatStatus(prevSeats.itSeats),
                            employeeRows: prevSeats.employeeRows.map(row => ({
                                ...row,
                                seats: updateSeatStatus(row.seats)
                            })),
                            outSeating: updateSeatStatus(prevSeats.outSeating),
                            ceoSeats: updateSeatStatus(prevSeats.ceoSeats),
                            hrSeats: updateSeatStatus(prevSeats.hrSeats),
                            conferenceSeats: updateSeatStatus(prevSeats.conferenceSeats)
                        }
                    })
                } else {
                    console.error('Failed to fetch seating arrangements.')
                }
            } catch (error) {
                console.error('Error fetching seating data:', error)
            }
        }

        fetchSeatingData()
    }, [location])

    const handleSeatClick = seat => {
        setSelectedSeat(seat)
        setOpenForm(true)
    }

    const handleFormClose = () => {
        setOpenForm(false)
        setSelectedSeat(null)
    }

    const handleFormSubmitSuccess = message => {
        handleFormClose()
    }

    const handleSeatHover = async seat => {
        try {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_APP_URL}/seating-arrangement/by-seat/${seat.id}?location=${location}&company_id=${companyId}`
            )
            if (response.ok) {
                const data = await response.json()
                if (data && data.employeeData) {
                    setHoveredSeat({
                        seatNo: data.seatNo,
                        employee: data.employeeData
                    })
                }
            } else {
                setHoveredSeat(null)
            }
        } catch (error) {
            console.error('Error fetching seat data:', error)
        }
    }

    const handleSeatHoverEnd = () => {
        setHoveredSeat(null)
    }

    const getSeatColor = status => (status === 'available' ? '#4CAF50' : '#2196F3')

    const renderSeat = seat => (
        <Tooltip
            title={
                hoveredSeat?.seatNo === String(seat.id) && hoveredSeat.employee ? (
                    <Box display='flex' flexDirection='column' alignItems='center'>
                        <Avatar src={hoveredSeat.employee.image} alt='Employee' sx={{ width: 50, height: 50, mb: 1 }} />
                        <Typography variant='body2' fontWeight='bold' color='white'>
                            {hoveredSeat.employee.first_name} {hoveredSeat.employee.last_name}
                        </Typography>
                    </Box>
                ) : (
                    ''
                )
            }
            placement='top'
            arrow
        >
            <Box
                key={seat.id}
                position='relative'
                display='inline-block'
                m={1}
                onMouseEnter={() => handleSeatHover(seat)}
                onMouseLeave={handleSeatHoverEnd}
            >
                <IconButton
                    sx={{
                        color: getSeatColor(seat.status),
                        fontSize: 40,
                        mt: -3,

                        '& .MuiSvgIcon-root': {
                            fontSize: 40
                        }
                    }}
                >
                    <WeekendIcon />
                </IconButton>
                <Typography
                    variant='caption'
                    sx={{
                        position: 'absolute',
                        top: '83%',
                        left: '50%',
                        transform: 'translate(-50%, -10%)',
                        fontSize: '0.8rem',
                        fontWeight: 'bold',
                        color: 'gray'
                    }}
                >
                    {seat.id}
                </Typography>
            </Box>
        </Tooltip>
    )

    return (
        <Box p={3} display='flex' flexDirection='column' border='1px solid #000' borderRadius='8px'>
            <Typography variant='h4' gutterBottom>
                Workspace Layout ({location.toLocaleUpperCase()})
            </Typography>

            <Box display='flex' alignItems='center' mb={2}>
                <Box display='flex' alignItems='center' ml={4}>
                    <Box display='flex' alignItems='center' mr={2}>
                        <WeekendIcon sx={{ color: '#4CAF50' }} />
                        <Typography ml={0.5}>Available</Typography>
                    </Box>
                    <Box display='flex' alignItems='center' mr={2}>
                        <WeekendIcon sx={{ color: '#2196F3' }} />
                        <Typography ml={0.5}>Booked</Typography>
                    </Box>
                </Box>
                <Tooltip title='View Seating List' arrow>
                    <Link href='/seating' passHref>
                        <Button
                            color='primary'
                            startIcon={<ListAltIcon sx={{ fontSize: 26 }} />}
                            sx={{
                                textTransform: 'none',
                                minWidth: 'auto',
                                padding: '0.4rem 0.6rem',
                                ml: 2
                            }}
                        />
                    </Link>
                </Tooltip>
                <FormControl size='small' sx={{ minWidth: 120 }}>
                    <InputLabel>Location</InputLabel>
                    <Select value={location} onChange={e => setLocation(e.target.value)} label='Location'>
                        {['noida', 'patel nagar', 'bareilly'].map(loc => (
                            <MenuItem key={loc} value={loc}>
                                {loc.toUpperCase()}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
            </Box>

            {location === 'noida' ? (
                <Box display='flex'>
                    <Box flex='3' mr={4}>
                        {/* IT Workspaces */}
                        <Typography style={{ color: 'magenta' }} variant='h6'>
                            IT Workspaces
                        </Typography>
                        <Paper variant='outlined' sx={{ width: 'fit-content', p: 3, borderRadius: 2, mb: 2 }}>
                            <Grid
                                container
                                spacing={2}
                                direction='row-reverse'
                                justifyContent='space-between'
                                alignItems='center'
                                wrap='nowrap'
                            >
                                {seats.itSeats.map(seat => (
                                    <Grid item key={seat.id}>
                                        {renderSeat(seat)}
                                    </Grid>
                                ))}
                            </Grid>
                        </Paper>

                        {/* Desk Rows */}
                        {seats.employeeRows.map((row, rowIndex) => (
                            <Box
                                key={row.id}
                                mb={2}
                                sx={{ width: '38rem', p: 2, border: '1px solid lightgray', borderRadius: '8px' }}
                            >
                                <Typography style={{ color: 'magenta' }} variant='h6'>{`Desk Row ${rowIndex + 1}`}</Typography>

                                <Grid container spacing={1} justifyContent='center' wrap='nowrap' direction='row-reverse'>
                                    {row.seats.slice(0, 9).map(seat => (
                                        <Grid item key={seat.id}>
                                            {renderSeat(seat)}
                                        </Grid>
                                    ))}
                                </Grid>
                                <Grid container spacing={1} justifyContent='center' wrap='nowrap' direction='row-reverse'>
                                    {row.seats.slice(9).map(seat => (
                                        <Grid item key={seat.id}>
                                            {renderSeat(seat)}
                                        </Grid>
                                    ))}
                                </Grid>
                            </Box>
                        ))}
                    </Box>

                    {/* Reserved Seats Section */}
                    <Paper
                        variant='outlined'
                        sx={{
                            flex: '1',
                            p: 2,
                            borderRadius: 2,
                            display: 'flex',
                            flexDirection: 'column',
                            // marginTop: '1rem',
                            justifyContent: 'space-between'
                        }}
                    >
                        <Typography variant='h6' align='center' gutterBottom>
                            Reserved Seats
                        </Typography>

                        {/* Reception */}
                        <Box>
                            <Typography variant='h6' align='center' style={{ color: 'magenta' }}>
                                Reception
                            </Typography>
                            <Grid container spacing={0.2} direction='column' alignItems='center'>
                                {seats.outSeating.map(seat => (
                                    <Grid item key={seat.id}>
                                        {renderSeat(seat)}
                                    </Grid>
                                ))}
                            </Grid>
                        </Box>

                        {/* Directors */}
                        <Box>
                            <Typography variant='h6' align='center' sx={{ marginTop: '2rem', color: 'magenta' }}>
                                Directors
                            </Typography>
                            <Grid container spacing={2} direction='column' alignItems='center'>
                                {seats.ceoSeats.map(seat => (
                                    <Grid item key={seat.id}>
                                        {renderSeat(seat)}
                                    </Grid>
                                ))}
                            </Grid>
                        </Box>

                        {/* Conference Layout */}
                        <Box>
                            <Typography variant='h6' align='center' sx={{ marginTop: '2rem', color: 'magenta' }}>
                                Conference
                            </Typography>
                            <Grid container spacing={2} direction='column' alignItems='center'>
                                {/* Top Middle Seat */}
                                <Grid item>{renderSeat(seats.conferenceSeats[0])}</Grid>

                                {/* Conference Layout with Left and Right Columns */}
                                <Grid item>
                                    <Box display='flex' justifyContent='space-between' width='100%' sx={{ gap: 8 }}>
                                        {/* Left Column */}
                                        <Box display='flex' flexDirection='column' alignItems='center'>
                                            {seats.conferenceSeats.slice(1, 4).map(seat => (
                                                <Grid item key={seat.id}>
                                                    {renderSeat(seat)}
                                                </Grid>
                                            ))}
                                        </Box>

                                        {/* Right Column */}
                                        <Box display='flex' flexDirection='column' alignItems='center'>
                                            {seats.conferenceSeats.slice(4, 7).map(seat => (
                                                <Grid item key={seat.id}>
                                                    {renderSeat(seat)}
                                                </Grid>
                                            ))}
                                        </Box>
                                    </Box>
                                </Grid>

                                {/* Bottom Middle Seat */}
                                <Grid item>{renderSeat(seats.conferenceSeats[7])}</Grid>
                            </Grid>
                        </Box>

                        {/* HR */}
                        <Box>
                            <Typography variant='h6' align='center' sx={{ marginTop: '2rem', color: 'magenta' }}>
                                HR
                            </Typography>
                            <Grid container spacing={2} direction='column' alignItems='center'>
                                {seats.hrSeats.map(seat => (
                                    <Grid item key={seat.id}>
                                        {renderSeat(seat)}
                                    </Grid>
                                ))}
                            </Grid>
                        </Box>
                    </Paper>
                </Box>
            ) : location === 'patel nagar' ? (
                <PatelNagarSeating location={location} setLocation={setLocation} />
            ) : (
                <BareillySeating location={location} setLocation={setLocation} />
            )}

            <Dialog open={openForm} onClose={handleFormClose} fullWidth maxWidth='sm'>
                <DialogContent>
                    {selectedSeat && (
                        <AddSeatingArrangementForm
                            seatingArrangementId={selectedSeat.id}
                            handleClose={handleFormClose}
                            onFormSubmitSuccess={handleFormSubmitSuccess}
                            onFormSubmitError={message => console.error(message)}
                        />
                    )}
                </DialogContent>
            </Dialog>
        </Box>
    )
}

export default OfficeSeating
