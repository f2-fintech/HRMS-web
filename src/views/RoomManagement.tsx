'use client'

import React, { useState, useEffect, useMemo } from 'react'
import {
    Box,
    Button,
    Card,
    CardContent,
    CardHeader,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    Grid,
    TextField,
    Typography,
    Paper,
    FormControl,
    InputLabel,
    MenuItem,
    Select,
    Avatar,
    Snackbar,
    Alert,
    Menu
} from '@mui/material'
import {
    Add as AddIcon,
    Event as EventIcon,
    AccessTime as AccessTimeIcon,
    Edit as EditIcon,
    Delete as DeleteIcon
} from '@mui/icons-material'
import { MoreVert as MoreVertIcon } from '@mui/icons-material'

import { styled } from '@mui/material/styles'
import { TimePicker } from '@mui/x-date-pickers/TimePicker'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'

const StyledCard = styled(Card)(({ theme }) => ({
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    transition: 'transform 0.2s, box-shadow 0.2s',
    '&:hover': {
        transform: 'translateY(-4px)',
        boxShadow: theme.shadows[8]
    },
    '& .MuiCardHeader-root': {
        paddingBottom: theme.spacing(1),
        backgroundColor: theme.palette.primary.light,
        color: theme.palette.primary.contrastText
    },
    '& .MuiCardHeader-subheader': {
        color: theme.palette.primary.contrastText,
        opacity: 0.8
    }
}))

const TimeSlotBox = styled(Box)(({ theme, booked }) => ({
    padding: theme.spacing(2),
    borderRadius: theme.shape.borderRadius,
    backgroundColor: booked ? theme.palette.error.light : theme.palette.success.light,
    color: booked ? theme.palette.error.contrastText : theme.palette.success.contrastText,
    fontSize: '0.875rem',
    textAlign: 'center',
    margin: theme.spacing(0.5),
    position: 'relative',
    transition: 'transform 0.2s',
    cursor: 'pointer',
    '&:hover': {
        transform: 'scale(1.02)',
        '& .tooltip': {
            display: 'block',
            opacity: 1
        }
    }
}))

const Tooltip = styled(Box)(({ theme }) => ({
    display: 'none',
    position: 'absolute',
    top: '100%',
    left: '50%',
    transform: 'translateX(-50%)',
    backgroundColor: theme.palette.background.paper,
    color: theme.palette.text.primary,
    border: `1px solid ${theme.palette.divider}`,
    padding: theme.spacing(2),
    borderRadius: theme.shape.borderRadius,
    zIndex: 1400,
    boxShadow: theme.shadows[4],
    transition: 'opacity 0.2s',
    opacity: 0
}))

const StyledPaper = styled(Paper)(({ theme }) => ({
    padding: theme.spacing(4),
    borderRadius: theme.shape.borderRadius * 2,
    boxShadow: theme.shadows[3],
    backgroundColor: theme.palette.background.default
}))

const HeaderButton = styled(Button)(({ theme }) => ({
    borderRadius: theme.shape.borderRadius * 2,
    padding: theme.spacing(1, 3),
    textTransform: 'none',
    fontWeight: 600
}))

const RoomManagement = () => {
    const [rooms, setRooms] = useState([])
    const [timeSlots, setTimeSlots] = useState({})
    const [isAddRoomOpen, setIsAddRoomOpen] = useState(false)
    const [isBookingOpen, setIsBookingOpen] = useState(false)
    const [selectedRoom, setSelectedRoom] = useState(null)
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
    const [selectedStartTime, setSelectedStartTime] = useState(null)
    const [selectedEndTime, setSelectedEndTime] = useState(null)
    const [reason, setReason] = useState('');
    const [userId, setUserId] = useState(null)
    const [userRole, setUserRole] = useState(null)
    const [snackbarOpen, setSnackbarOpen] = useState(false)
    const [snackbarMessage, setSnackbarMessage] = useState('')
    const [snackbarSeverity, setSnackbarSeverity] = useState('success')
    const [editingSlot, setEditingSlot] = useState(null)
    const [isUpdating, setIsUpdating] = useState(false)
    const [menuAnchorEl, setMenuAnchorEl] = useState(null)
    const [selectedSlot, setSelectedSlot] = useState(null)

    const handleSnackbarClose = () => {
        setSnackbarOpen(false)
    }

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem('user') || '{}')
        setUserId(user.id || null)
        setUserRole(user.role || null)
    }, [])

    const [formData, setFormData] = useState({
        name: '',
        capacity: ''
    })

    const handleMenuOpen = (event, slot) => {
        setMenuAnchorEl(event.currentTarget)
        setSelectedSlot(slot)
    }

    const handleMenuClose = () => {
        setMenuAnchorEl(null)
        setSelectedSlot(null)
    }

    useEffect(() => {
        const fetchRooms = async () => {
            try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/room/rooms/get-all`)
                const data = await response.json()
                setRooms(
                    data.map(room => ({
                        id: room._id,
                        name: room.name,
                        capacity: room.capacity
                    }))
                )
            } catch (error) {
                console.error('Error fetching rooms:', error)
            }
        }
        fetchRooms()
    }, [])

    const fetchTimeSlots = async () => {
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/room/get/time-slots?date=${selectedDate}`)
            const data = await response.json()
            const slotsByRoom = data.reduce((acc, slot) => {
                const roomId = slot.room._id
                if (!acc[roomId]) acc[roomId] = []
                acc[roomId].push(slot)
                return acc
            }, {})
            setTimeSlots(slotsByRoom)
        } catch (error) {
            console.error('Error fetching time slots:', error)
        }
    }

    useEffect(() => {
        fetchTimeSlots()
    }, [selectedDate])

    const handleEditSlot = slot => {
        setSelectedRoom(slot.room)
        setEditingSlot(slot)
        setReason(slot.reason || '');
        setIsUpdating(true)
        setIsBookingOpen(true)

        const timeRange = slot.timeSlots || ''
        const [startTimeString, endTimeString] = timeRange.split(' - ')
        // Parse and set start time
        if (startTimeString) {
            const [time, modifier] = startTimeString.split(' ')
            const [hours, minutes] = time.split(':').map(Number)

            const date = new Date(slot.date)
            let parsedHours = hours
            if (modifier === 'PM' && hours !== 12) {
                parsedHours += 12
            } else if (modifier === 'AM' && hours === 12) {
                parsedHours = 0
            }
            const parsedStartTime = new Date(date.setHours(parsedHours, minutes, 0, 0))
            setSelectedStartTime(parsedStartTime)
        } else {
            console.error('Invalid time slot format:', slot.timeSlots)
            setSelectedStartTime(new Date())
        }

        if (endTimeString) {
            const [time, modifier] = endTimeString.split(' ')
            const [hours, minutes] = time.split(':').map(Number)

            // Convert end time to a Date object
            const date = new Date(slot.date)
            let parsedHours = hours
            if (modifier === 'PM' && hours !== 12) {
                parsedHours += 12
            } else if (modifier === 'AM' && hours === 12) {
                parsedHours = 0
            }
            const parsedEndTime = new Date(date.setHours(parsedHours, minutes, 0, 0))
            setSelectedEndTime(parsedEndTime)
        } else {
            console.error('Invalid time slot format:', slot.timeSlots)
            setSelectedEndTime(null)
        }
    }

    const handleDeleteSlot = async slotId => {
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/room/delete/time-slots/${slotId}`, {
                method: 'DELETE'
            })

            if (!response.ok) {
                throw new Error('Failed to delete time slot.')
            }

            setSnackbarMessage('Time slot deleted successfully!')
            setSnackbarSeverity('success')
            setSnackbarOpen(true)

            await fetchTimeSlots()
        } catch (error) {
            console.error('Error deleting time slot:', error)
            setSnackbarMessage('Failed to delete time slot.')
            setSnackbarSeverity('error')
            setSnackbarOpen(true)
        } finally {
            handleMenuClose()
        }
    }

    const handleAddRoom = async e => {
        e.preventDefault()
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/room/create`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: formData.name,
                    capacity: Number(formData.capacity)
                })
            })

            if (!response.ok) throw new Error('Failed to create room')

            const newRoom = await response.json()
            setRooms([
                ...rooms,
                {
                    id: newRoom._id,
                    name: newRoom.name,
                    capacity: newRoom.capacity
                }
            ])
            setIsAddRoomOpen(false)
            setFormData({ name: '', capacity: '' })

            setSnackbarMessage('Room created successfully!')
            setSnackbarSeverity('success')
            setSnackbarOpen(true)
        } catch (error) {
            console.error('Error adding room:', error)

            setSnackbarMessage('Failed to create room.')
            setSnackbarSeverity('error')
            setSnackbarOpen(true)
        }
    }

    const handleBooking = room => {
        setSelectedRoom(room)
        setEditingSlot(null)
        setIsUpdating(false)
        setIsBookingOpen(true)
        setSelectedStartTime(new Date())
        const nextHour = new Date()
        nextHour.setHours(nextHour.getHours() + 1)
        nextHour.setMinutes(0)
        setSelectedEndTime(nextHour)
    }

    const handleBookTimeSlot = async e => {
        e.preventDefault();

        if (!selectedStartTime || !selectedEndTime) {
            setSnackbarMessage('Please select both start and end times.');
            setSnackbarSeverity('error');
            setSnackbarOpen(true);
            return;
        }

        const formattedTimeSlot = `${selectedStartTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })} - ${selectedEndTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}`;

        try {
            const requestMethod = editingSlot ? 'PUT' : 'POST';
            const endpoint = editingSlot
                ? `${process.env.NEXT_PUBLIC_APP_URL}/room/update/time-slots/${editingSlot._id}`
                : `${process.env.NEXT_PUBLIC_APP_URL}/room/time-slots`;

            // Prepare the payload
            const payload = {
                room: selectedRoom.id,
                date: selectedDate,
                timeSlots: formattedTimeSlot,
                reason: reason,
            };

            // Only include employee if creating a new time slot
            if (!isUpdating) {
                payload.employee = userId;
            }

            const response = await fetch(endpoint, {
                method: requestMethod,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'Failed to save time slot.');
            }

            await fetchTimeSlots();
            setIsBookingOpen(false);
            setEditingSlot(null);
            setSelectedStartTime(null);
            setSelectedEndTime(null);
            setSnackbarMessage(result.message);
            setSnackbarSeverity('success');
            setSnackbarOpen(true);
        } catch (error) {
            console.error('Error saving time slot:', error);
            setSnackbarMessage(error.message);
            setSnackbarSeverity('error');
            setSnackbarOpen(true);
        }
    };


    useEffect(() => {
        const now = new Date()
        const nextHour = new Date()
        nextHour.setHours(now.getHours() + 1)
        nextHour.setMinutes(0)

        setSelectedStartTime(now)
        setSelectedEndTime(nextHour)
    }, [])

    const renderTimeSlots = useMemo(() => {
        const renderForRoom = roomId => {
            const slots = timeSlots[roomId] || []
            return slots.map(slot => (
                <Grid item xs={12} sm={6} md={4} lg={12} key={slot._id || slot.timeSlots} sx={{ position: 'relative' }}>
                    <TimeSlotBox
                        booked
                        sx={{
                            '&:hover .tooltip': {
                                display: 'block',
                                opacity: 1
                            }
                        }}
                    >
                        <h3>{slot.timeSlots}</h3>
                        <h4>{slot.reason}</h4>
                        <Tooltip
                            className='tooltip'
                            sx={{
                                display: 'none',
                                position: 'absolute',
                                top: '-120%',
                                left: '50%',
                                transform: 'translateX(-50%)',
                                backgroundColor: 'white',
                                color: 'black',
                                border: '1px solid rgba(0, 0, 0, 0.1)',
                                padding: 1,
                                borderRadius: 1,
                                boxShadow: '0px 4px 6px rgba(0, 0, 0, 0.1)',
                                zIndex: 10,
                                textAlign: 'center',
                                width: {
                                    xs: '90%',
                                    sm: 'auto'
                                },
                                whiteSpace: {
                                    xs: 'normal',
                                    sm: 'nowrap'
                                }
                            }}
                        >
                            <Box>
                                <Typography
                                    variant='caption'
                                    sx={{
                                        display: 'block',
                                        fontWeight: 600,
                                        marginBottom: '4px',
                                        textAlign: 'center',
                                        color: 'blue'
                                    }}
                                >
                                    Booked By
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Avatar
                                        src={slot.employee?.image || ''}
                                        alt={`${slot.employee?.first_name || 'N/A'} ${slot.employee?.last_name || 'N/A'}`}
                                        sx={{ width: 40, height: 40 }}
                                    >
                                        {slot.employee?.first_name?.[0] || 'U'}
                                    </Avatar>
                                    <Box>
                                        <Typography sx={{ color: 'blue' }} variant='body2'>
                                            {slot.employee?.first_name} {slot.employee?.last_name}
                                        </Typography>
                                    </Box>
                                </Box>
                            </Box>
                        </Tooltip>
                        {(userRole === '1' || slot.employee?._id === userId) && (
                            <Button
                                sx={{
                                    position: 'absolute',
                                    top: { xs: 8, sm: -3 },
                                    right: { xs: 8, sm: -5 },
                                    minWidth: 0,
                                    padding: { xs: 0.5, sm: 1 },
                                    zIndex: 10
                                }}
                                onClick={event => handleMenuOpen(event, slot)}
                            >
                                <MoreVertIcon style={{ color: 'black' }} fontSize='small' />
                            </Button>
                        )}
                    </TimeSlotBox>
                </Grid>
            ))
        }
        return renderForRoom
    }, [timeSlots, userRole, userId])

    return (
        <>
            <Menu anchorEl={menuAnchorEl} open={Boolean(menuAnchorEl)} onClose={handleMenuClose}>
                <MenuItem
                    onClick={() => {
                        handleEditSlot(selectedSlot)
                        handleMenuClose()
                    }}
                    sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                >
                    <EditIcon sx={{ color: 'blue' }} fontSize='small' />
                    Edit
                </MenuItem>
                <MenuItem
                    onClick={() => {
                        handleDeleteSlot(selectedSlot._id)
                    }}
                    sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                >
                    <DeleteIcon sx={{ color: 'red' }} fontSize='small' />
                    Delete
                </MenuItem>
            </Menu>
            <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1200, mx: 'auto' }}>
                <Snackbar
                    open={snackbarOpen}
                    autoHideDuration={3000}
                    onClose={handleSnackbarClose}
                    anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
                >
                    <Alert
                        onClose={handleSnackbarClose}
                        severity={snackbarSeverity}
                        sx={{
                            width: '100%',
                            backgroundColor: snackbarSeverity === 'success' ? 'green' : 'red',
                            color: 'white'
                        }}
                    >
                        {snackbarMessage}
                    </Alert>
                </Snackbar>
                <StyledPaper>
                    <Box
                        sx={{
                            display: 'flex',
                            flexDirection: { xs: 'column', sm: 'row' },
                            justifyContent: 'space-between',
                            alignItems: { xs: 'flex-start', sm: 'center' },
                            mb: 4,
                            gap: 2
                        }}
                    >
                        <div>
                            <Typography
                                variant='h4'
                                component='h1'
                                sx={{
                                    fontWeight: 600,
                                    color: 'primary.main',
                                    mb: 1
                                }}
                            >
                                Room Booking Management
                            </Typography>
                            <Typography variant='subtitle1' color='text.secondary' sx={{ fontSize: '1.1rem' }}>
                                Book rooms and manage time slots
                            </Typography>
                        </div>
                        {userRole === '1' && (
                            <HeaderButton
                                variant='contained'
                                startIcon={<AddIcon />}
                                onClick={() => setIsAddRoomOpen(true)}
                                sx={{
                                    minWidth: 150,
                                    backgroundColor: 'primary.main',
                                    '&:hover': {
                                        backgroundColor: 'primary.dark'
                                    }
                                }}
                            >
                                Add Room
                            </HeaderButton>
                        )}
                    </Box>

                    <TextField
                        label='Select Date'
                        type='date'
                        value={selectedDate}
                        onChange={e => setSelectedDate(e.target.value)}
                        sx={{
                            mb: 4,
                            '& .MuiOutlinedInput-root': {
                                borderRadius: 2
                            }
                        }}
                        InputLabelProps={{ shrink: true }}
                    />

                    <Grid container spacing={3}>
                        {rooms.map(room => (
                            <Grid item xs={12} md={6} key={room.id}>
                                <StyledCard>
                                    <CardHeader
                                        title={
                                            <Typography variant='h6' sx={{ fontWeight: 700 }}>
                                                {room.name.toUpperCase()}
                                            </Typography>
                                        }
                                        action={
                                            <Button
                                                variant='contained'
                                                startIcon={<AccessTimeIcon />}
                                                onClick={() => handleBooking(room)}
                                                disabled={new Date(selectedDate) < new Date().setHours(0, 0, 0, 0)}
                                                sx={{
                                                    backgroundColor: 'white',
                                                    color: 'primary.main',
                                                    '&:hover': {
                                                        backgroundColor: 'rgba(255,255,255,0.9)'
                                                    }
                                                }}
                                            >
                                                Book Slot
                                            </Button>
                                        }
                                        subheader={
                                            <Typography
                                                variant='subtitle2'
                                                sx={{
                                                    color: 'white',
                                                    fontWeight: 800
                                                }}
                                            >
                                                Capacity: {room.capacity}
                                            </Typography>
                                        }
                                    />
                                    <CardContent sx={{ flexGrow: 1 }}>
                                        <Typography
                                            variant='subtitle2'
                                            sx={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                mb: 2,
                                                color: 'text.primary',
                                                fontWeight: 500
                                            }}
                                        >
                                            <EventIcon sx={{ mr: 1, color: 'primary.main' }} />
                                            Today's Bookings
                                        </Typography>
                                        <Grid container spacing={1}>
                                            {renderTimeSlots(room.id)}
                                        </Grid>
                                    </CardContent>
                                </StyledCard>
                            </Grid>
                        ))}
                    </Grid>
                </StyledPaper>

                {/* Add Room Dialog */}
                <Dialog
                    open={isAddRoomOpen}
                    onClose={() => setIsAddRoomOpen(false)}
                    PaperProps={{
                        sx: {
                            borderRadius: 2,
                            maxWidth: 500,
                            width: '100%'
                        }
                    }}
                >
                    <DialogTitle
                        sx={{
                            backgroundColor: 'primary.main',
                            color: 'primary.contrastText',
                            py: 2
                        }}
                    >
                        Add New Room
                    </DialogTitle>
                    <DialogContent sx={{ mt: 2 }}>
                        <DialogContentText sx={{ mb: 3 }}>Enter room details</DialogContentText>
                        <Box component='form' onSubmit={handleAddRoom} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                            <FormControl fullWidth required>
                                <InputLabel>Room Name</InputLabel>
                                <Select
                                    value={formData.name}
                                    label='Room Name'
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    sx={{ borderRadius: 2 }}
                                >
                                    <MenuItem value='Conference'>Conference</MenuItem>
                                    <MenuItem value='Director'>Director</MenuItem>
                                    <MenuItem value='HR'>HR</MenuItem>
                                </Select>
                            </FormControl>
                            <TextField
                                label='Capacity'
                                type='number'
                                value={formData.capacity}
                                onChange={e => setFormData({ ...formData, capacity: e.target.value })}
                                fullWidth
                                required
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                            />
                        </Box>
                    </DialogContent>
                    <DialogActions sx={{ p: 3 }}>
                        <Button
                            onClick={() => setIsAddRoomOpen(false)}
                            sx={{
                                borderRadius: 2,
                                textTransform: 'none',
                                px: 3
                            }}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleAddRoom}
                            variant='contained'
                            sx={{
                                borderRadius: 2,
                                textTransform: 'none',
                                px: 3
                            }}
                        >
                            Add Room
                        </Button>
                    </DialogActions>
                </Dialog>

                {/* Booking Dialog */}
                <Dialog
                    open={isBookingOpen}
                    onClose={() => setIsBookingOpen(false)}
                    PaperProps={{
                        sx: {
                            borderRadius: 2,
                            maxWidth: 500,
                            width: '100%'
                        }
                    }}
                >
                    <DialogTitle
                        sx={{
                            backgroundColor: 'primary.main',
                            color: 'primary.contrastText',
                            py: 2
                        }}
                    >
                        {isUpdating ? 'Update Book Time Slot' : 'Book a Time Slot'}
                    </DialogTitle>
                    <DialogContent sx={{ mt: 2 }}>
                        <DialogContentText sx={{ mb: 3 }}>{selectedRoom && `Booking for ${selectedRoom.name}`}</DialogContentText>
                        <Box
                            component='form'
                            onSubmit={handleBookTimeSlot}
                            sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}
                        >
                            <TextField
                                label='Date'
                                type='date'
                                value={selectedDate}
                                onChange={e => setSelectedDate(e.target.value)}
                                InputLabelProps={{ shrink: true }}
                                fullWidth
                                required
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                            />
                            <FormControl fullWidth required>
                                <LocalizationProvider dateAdapter={AdapterDateFns}>
                                    <Box sx={{ display: 'flex', gap: 2 }}>
                                        <TimePicker
                                            label='Start Time'
                                            value={selectedStartTime}
                                            onChange={newValue => setSelectedStartTime(newValue)}
                                            minTime={selectedDate === new Date().toISOString().split('T')[0] ? new Date() : null}
                                            renderInput={params => (
                                                <TextField
                                                    {...params}
                                                    placeholder='Select start time'
                                                    fullWidth
                                                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                                                />
                                            )}
                                        />
                                        <TimePicker
                                            label='End Time'
                                            value={selectedEndTime}
                                            onChange={newValue => setSelectedEndTime(newValue)}
                                            minTime={selectedStartTime || new Date()}
                                            renderInput={params => (
                                                <TextField
                                                    {...params}
                                                    placeholder='Select end time'
                                                    fullWidth
                                                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                                                />
                                            )}
                                        />
                                    </Box>
                                </LocalizationProvider>
                            </FormControl>
                            <TextField
                                label='Reason'
                                placeholder='Please mention in short way'
                                multiline
                                rows={3}
                                fullWidth
                                required
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                                value={reason}
                                onChange={e => setReason(e.target.value)}
                            />
                        </Box>
                    </DialogContent>
                    <DialogActions sx={{ p: 3 }}>
                        <Button
                            onClick={() => setIsBookingOpen(false)}
                            sx={{
                                borderRadius: 2,
                                textTransform: 'none',
                                px: 3
                            }}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleBookTimeSlot}
                            variant='contained'
                            sx={{
                                borderRadius: 2,
                                textTransform: 'none',
                                px: 3
                            }}
                        >
                            {isUpdating ? 'Update Slot' : 'Book Slot'}
                        </Button>
                    </DialogActions>
                </Dialog>
            </Box>
        </>
    )
}

export default RoomManagement
