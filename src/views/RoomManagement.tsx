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
    borderRadius: '24px',
    border: `1px solid ${theme.palette.divider}`,
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.04)',
    transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
    background: '#ffffff',
    '&:hover': {
        transform: 'translateY(-8px)',
        boxShadow: '0 16px 48px rgba(0, 0, 0, 0.1)',
        borderColor: theme.palette.primary.light,
    },
    '& .MuiCardHeader-root': {
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: '#fff',
        padding: theme.spacing(3),
    },
    '& .MuiCardHeader-title': {
        fontWeight: 800,
        fontSize: '1.25rem',
        letterSpacing: '0.5px'
    },
    '& .MuiCardHeader-subheader': {
        color: 'rgba(255, 255, 255, 0.85)',
        fontWeight: 600,
        marginTop: '4px'
    }
}))

const TimeSlotBox = styled(Box)(({ theme, booked }) => ({
    padding: theme.spacing(2.5),
    borderRadius: '16px',
    backgroundColor: booked ? 'rgba(254, 226, 226, 0.8)' : 'rgba(220, 253, 230, 0.8)',
    border: `1px solid ${booked ? '#f87171' : '#4ade80'}`,
    color: booked ? '#991b1b' : '#166534',
    fontSize: '0.95rem',
    textAlign: 'center',
    position: 'relative',
    transition: 'all 0.3s ease',
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.03)',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '6px',
    height: '100%',
    '&:hover': {
        transform: 'translateY(-4px)',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.08)',
        backgroundColor: booked ? '#fecaca' : '#bbf7d0',
        '& .tooltip': {
            visibility: 'visible',
            opacity: 1,
            transform: 'translateX(-50%) translateY(0)',
        }
    },
    '& h3': {
        margin: 0,
        fontWeight: 700,
        fontSize: '1rem',
        letterSpacing: '0.5px'
    },
    '& h4': {
        margin: 0,
        fontWeight: 500,
        fontSize: '0.85rem',
        opacity: 0.9,
        display: '-webkit-box',
        WebkitLineClamp: 2,
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden',
        textOverflow: 'ellipsis'
    }
}))

const Tooltip = styled(Box)(({ theme }) => ({
    visibility: 'hidden',
    position: 'absolute',
    bottom: '105%',
    left: '50%',
    transform: 'translateX(-50%) translateY(10px)',
    backgroundColor: '#ffffff',
    color: theme.palette.text.primary,
    border: `1px solid ${theme.palette.divider}`,
    padding: theme.spacing(2.5),
    borderRadius: '16px',
    zIndex: 1400,
    boxShadow: '0 12px 40px rgba(0, 0, 0, 0.15)',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    opacity: 0,
    minWidth: '220px',
    '&::after': {
        content: '""',
        position: 'absolute',
        top: '100%',
        left: '50%',
        marginLeft: '-8px',
        borderWidth: '8px',
        borderStyle: 'solid',
        borderColor: '#ffffff transparent transparent transparent'
    }
}))

const StyledPaper = styled(Paper)(({ theme }) => ({
    padding: theme.spacing(4),
    borderRadius: '32px',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.05)',
    backgroundColor: '#f8fafc',
    border: '1px solid rgba(255, 255, 255, 0.5)',
}))

const HeaderButton = styled(Button)(({ theme }) => ({
    borderRadius: '14px',
    padding: theme.spacing(1.2, 3),
    textTransform: 'none',
    fontWeight: 700,
    fontSize: '1rem',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: '#fff',
    boxShadow: '0 4px 15px rgba(118, 75, 162, 0.3)',
    transition: 'all 0.3s ease',
    '&:hover': {
        transform: 'translateY(-2px)',
        boxShadow: '0 8px 25px rgba(118, 75, 162, 0.5)',
    }
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
    const [companyId, setCompanyId] = useState(null)
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
        setCompanyId(user.company_id || null)
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
            if (!companyId) return;
            try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/room/rooms/get-all?company_id=${companyId}`);
                const data = await response.json();
                setRooms(
                    data.map(room => ({
                        id: room._id,
                        name: room.name,
                        capacity: room.capacity,
                    }))
                );
            } catch (error) {
                console.error('Error fetching rooms:', error);
            }
        };
        fetchRooms();
    }, [companyId]);


    const fetchTimeSlots = async () => {
        if (!companyId) return;
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/room/get/time-slots?date=${selectedDate}&company_id=${companyId}`);
            const data = await response.json();
            const slotsByRoom = data.reduce((acc, slot) => {
                const roomId = slot.room._id;
                if (!acc[roomId]) acc[roomId] = [];
                acc[roomId].push(slot);
                return acc;
            }, {});
            setTimeSlots(slotsByRoom);
        } catch (error) {
            console.error('Error fetching time slots:', error);
        }
    };
    useEffect(() => {
        fetchTimeSlots()
    }, [selectedDate, companyId])

    const handleEditSlot = slot => {
        setSelectedRoom(slot.room)
        setEditingSlot(slot)
        setReason(slot.reason || '');
        setIsUpdating(true)
        setIsBookingOpen(true)

        const timeRange = slot.timeSlots || ''
        const [startTimeString, endTimeString] = timeRange.split(' - ')
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
                    capacity: Number(formData.capacity),
                    company_id: companyId,
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

            const payload = {
                room: selectedRoom.id,
                date: selectedDate,
                timeSlots: formattedTimeSlot,
                reason: reason,
                company_id: companyId

            };

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
                <Grid item xs={12} sm={6} key={slot._id || slot.timeSlots} sx={{ position: 'relative' }}>
                    <TimeSlotBox booked>
                        <h3>{slot.timeSlots}</h3>
                        <h4>{slot.reason}</h4>
                        <Tooltip className='tooltip'>
                            <Box>
                                <Typography
                                    variant='caption'
                                    sx={{
                                        display: 'block',
                                        fontWeight: 700,
                                        marginBottom: '12px',
                                        textAlign: 'center',
                                        color: '#667eea',
                                        textTransform: 'uppercase',
                                        letterSpacing: '1px'
                                    }}
                                >
                                    Booked By
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, justifyContent: 'center' }}>
                                    <Avatar
                                        src={slot.employee?.image || ''}
                                        alt={`${slot.employee?.first_name || 'N/A'} ${slot.employee?.last_name || 'N/A'}`}
                                        sx={{ width: 48, height: 48, boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}
                                    >
                                        {slot.employee?.first_name?.[0] || 'U'}
                                    </Avatar>
                                    <Box sx={{ textAlign: 'left' }}>
                                        <Typography sx={{ color: '#1f2937', fontWeight: 600 }} variant='body1'>
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
                                    top: { xs: 8, sm: -10 },
                                    right: { xs: 8, sm: -10 },
                                    minWidth: 0,
                                    width: 32,
                                    height: 32,
                                    padding: 0,
                                    borderRadius: '50%',
                                    backgroundColor: '#fff',
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                                    zIndex: 10,
                                    '&:hover': {
                                        backgroundColor: '#f1f5f9'
                                    }
                                }}
                                onClick={event => handleMenuOpen(event, slot)}
                            >
                                <MoreVertIcon style={{ color: '#64748b' }} fontSize='small' />
                            </Button>
                        )}
                    </TimeSlotBox>
                </Grid>
            ))
        }
        return renderForRoom
    }, [timeSlots, userRole, userId])

    return (
        <Box sx={{ minHeight: '100vh', backgroundColor: '#f1f5f9', pt: 2, pb: 8 }}>
            <Menu 
                anchorEl={menuAnchorEl} 
                open={Boolean(menuAnchorEl)} 
                onClose={handleMenuClose}
                PaperProps={{
                    sx: {
                        borderRadius: '12px',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                        minWidth: '150px'
                    }
                }}
            >
                <MenuItem
                    onClick={() => {
                        handleEditSlot(selectedSlot)
                        handleMenuClose()
                    }}
                    sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1.5 }}
                >
                    <EditIcon sx={{ color: '#3b82f6' }} fontSize='small' />
                    <Typography sx={{ fontWeight: 500 }}>Edit</Typography>
                </MenuItem>
                <MenuItem
                    onClick={() => {
                        handleDeleteSlot(selectedSlot?._id)
                    }}
                    sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1.5 }}
                >
                    <DeleteIcon sx={{ color: '#ef4444' }} fontSize='small' />
                    <Typography sx={{ fontWeight: 500, color: '#ef4444' }}>Delete</Typography>
                </MenuItem>
            </Menu>
            <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1400, mx: 'auto' }}>
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
                            backgroundColor: snackbarSeverity === 'success' ? '#10b981' : '#ef4444',
                            color: 'white',
                            borderRadius: '12px',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                            '& .MuiAlert-icon': {
                                color: 'white'
                            }
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
                            mb: 6,
                            gap: 3
                        }}
                    >
                        <div>
                            <Typography
                                variant='h3'
                                component='h1'
                                sx={{
                                    fontWeight: 900,
                                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                    mb: 1,
                                    letterSpacing: '-1px'
                                }}
                            >
                                Room Management
                            </Typography>
                            <Typography variant='subtitle1' sx={{ color: '#64748b', fontSize: '1.1rem', fontWeight: 500 }}>
                                Reserve rooms and manage time slots seamlessly
                            </Typography>
                        </div>
                        {userRole === '1' && (
                            <HeaderButton
                                startIcon={<AddIcon />}
                                onClick={() => setIsAddRoomOpen(true)}
                            >
                                Add Room
                            </HeaderButton>
                        )}
                    </Box>

                    <Box sx={{ mb: 6 }}>
                        <TextField
                            label='Select Date'
                            type='date'
                            value={selectedDate}
                            onChange={e => setSelectedDate(e.target.value)}
                            sx={{
                                minWidth: '250px',
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: '12px',
                                    backgroundColor: '#fff',
                                    transition: 'all 0.3s',
                                    '&:hover': {
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
                                    },
                                    '&.Mui-focused': {
                                        boxShadow: '0 4px 12px rgba(118, 75, 162, 0.15)',
                                        borderColor: '#667eea'
                                    }
                                }
                            }}
                            InputLabelProps={{ shrink: true }}
                        />
                    </Box>

                    <Grid container spacing={4}>
                        {rooms.map(room => (
                            <Grid item xs={12} md={6} lg={4} key={room.id}>
                                <StyledCard>
                                    <CardHeader
                                        title={
                                            <Typography variant='h6' sx={{ fontWeight: 800 }}>
                                                {room.name}
                                            </Typography>
                                        }
                                        action={
                                            <Button
                                                variant='contained'
                                                startIcon={<AccessTimeIcon />}
                                                onClick={() => handleBooking(room)}
                                                disabled={new Date(selectedDate) < new Date().setHours(0, 0, 0, 0)}
                                                sx={{
                                                    backgroundColor: '#fff',
                                                    color: '#667eea',
                                                    borderRadius: '10px',
                                                    fontWeight: 700,
                                                    textTransform: 'none',
                                                    '&:hover': {
                                                        backgroundColor: '#f8fafc',
                                                        transform: 'translateY(-1px)',
                                                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                                                    },
                                                    '&:disabled': {
                                                        backgroundColor: 'rgba(255,255,255,0.5)',
                                                        color: 'rgba(102,126,234,0.5)'
                                                    }
                                                }}
                                            >
                                                Book
                                            </Button>
                                        }
                                        subheader={
                                            <Typography
                                                variant='subtitle2'
                                                sx={{
                                                    color: 'rgba(255,255,255,0.9)',
                                                    fontWeight: 600,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 0.5
                                                }}
                                            >
                                                Capacity: {room.capacity}
                                            </Typography>
                                        }
                                    />
                                    <CardContent sx={{ flexGrow: 1, p: 3 }}>
                                        <Typography
                                            variant='subtitle1'
                                            sx={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                mb: 3,
                                                color: '#334155',
                                                fontWeight: 700
                                            }}
                                        >
                                            <EventIcon sx={{ mr: 1, color: '#667eea' }} />
                                            Booked Slots
                                        </Typography>
                                        <Grid container spacing={2}>
                                            {renderTimeSlots(room.id).length > 0 ? (
                                                renderTimeSlots(room.id)
                                            ) : (
                                                <Box sx={{ width: '100%', py: 4, textAlign: 'center', color: '#94a3b8' }}>
                                                    <Typography sx={{ fontWeight: 500 }}>No slots booked for this date.</Typography>
                                                </Box>
                                            )}
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
                            borderRadius: '24px',
                            maxWidth: 500,
                            width: '100%',
                            boxShadow: '0 24px 48px rgba(0,0,0,0.2)'
                        }
                    }}
                >
                    <DialogTitle
                        sx={{
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            color: '#fff',
                            py: 3,
                            fontWeight: 700
                        }}
                    >
                        Add New Room
                    </DialogTitle>
                    <DialogContent sx={{ mt: 4 }}>
                        <DialogContentText sx={{ mb: 4, color: '#64748b', fontWeight: 500 }}>
                            Enter the details below to create a new room.
                        </DialogContentText>
                        <Box component='form' onSubmit={handleAddRoom} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                            <FormControl fullWidth required>
                                <InputLabel>Room Name</InputLabel>
                                <Select
                                    value={formData.name}
                                    label='Room Name'
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    sx={{ borderRadius: '12px' }}
                                >
                                    <MenuItem value='Conference'>Conference Room</MenuItem>
                                    <MenuItem value='Director'>Meeting Room-01</MenuItem>
                                    <MenuItem value='HR'>Meeting Room-02</MenuItem>
                                </Select>
                            </FormControl>
                            <TextField
                                label='Capacity'
                                type='number'
                                value={formData.capacity}
                                onChange={e => setFormData({ ...formData, capacity: e.target.value })}
                                fullWidth
                                required
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                            />
                        </Box>
                    </DialogContent>
                    <DialogActions sx={{ p: 3, pt: 0 }}>
                        <Button
                            onClick={() => setIsAddRoomOpen(false)}
                            sx={{
                                borderRadius: '12px',
                                textTransform: 'none',
                                px: 3,
                                fontWeight: 600,
                                color: '#64748b'
                            }}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleAddRoom}
                            variant='contained'
                            sx={{
                                borderRadius: '12px',
                                textTransform: 'none',
                                px: 4,
                                fontWeight: 600,
                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                boxShadow: '0 4px 12px rgba(118, 75, 162, 0.3)',
                                '&:hover': {
                                    boxShadow: '0 6px 16px rgba(118, 75, 162, 0.4)'
                                }
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
                            borderRadius: '24px',
                            maxWidth: 550,
                            width: '100%',
                            boxShadow: '0 24px 48px rgba(0,0,0,0.2)'
                        }
                    }}
                >
                    <DialogTitle
                        sx={{
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            color: '#fff',
                            py: 3,
                            fontWeight: 700
                        }}
                    >
                        {isUpdating ? 'Update Booking' : 'Book a Time Slot'}
                    </DialogTitle>
                    <DialogContent sx={{ mt: 4 }}>
                        <DialogContentText sx={{ mb: 4, color: '#64748b', fontWeight: 500 }}>
                            {selectedRoom && `You are booking for ${selectedRoom.name}.`}
                        </DialogContentText>
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
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                            />
                            <FormControl fullWidth required>
                                <LocalizationProvider dateAdapter={AdapterDateFns}>
                                    <Box sx={{ display: 'flex', gap: 3 }}>
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
                                                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
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
                                                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                                                />
                                            )}
                                        />
                                    </Box>
                                </LocalizationProvider>
                            </FormControl>
                            <TextField
                                label='Reason'
                                placeholder='Briefly mention the reason for booking'
                                multiline
                                rows={3}
                                fullWidth
                                required
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                                value={reason}
                                onChange={e => setReason(e.target.value)}
                            />
                        </Box>
                    </DialogContent>
                    <DialogActions sx={{ p: 3, pt: 0 }}>
                        <Button
                            onClick={() => setIsBookingOpen(false)}
                            sx={{
                                borderRadius: '12px',
                                textTransform: 'none',
                                px: 3,
                                fontWeight: 600,
                                color: '#64748b'
                            }}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleBookTimeSlot}
                            variant='contained'
                            sx={{
                                borderRadius: '12px',
                                textTransform: 'none',
                                px: 4,
                                fontWeight: 600,
                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                boxShadow: '0 4px 12px rgba(118, 75, 162, 0.3)',
                                '&:hover': {
                                    boxShadow: '0 6px 16px rgba(118, 75, 162, 0.4)'
                                }
                            }}
                        >
                            {isUpdating ? 'Update Slot' : 'Confirm Booking'}
                        </Button>
                    </DialogActions>
                </Dialog>
            </Box>
        </Box>
    )
}

export default RoomManagement
