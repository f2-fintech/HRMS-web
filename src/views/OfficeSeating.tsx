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
import LocalCafeIcon from '@mui/icons-material/LocalCafe'
import DnsIcon from '@mui/icons-material/Dns'
import PhoneInTalkIcon from '@mui/icons-material/PhoneInTalk'
import CameraAltIcon from '@mui/icons-material/CameraAlt'
import LocalHospitalIcon from '@mui/icons-material/LocalHospital'
import SportsEsportsIcon from '@mui/icons-material/SportsEsports'
import InventoryIcon from '@mui/icons-material/Inventory'

const OfficeSeating = () => {
    const [location, setLocation] = useState('noida')
    const [seats, setSeats] = useState({
        leftArea: [
            { id: 'left-1', top: ['D140', 'D139', 'D138', 'D137', 'D136', 'D135', 'D134', 'D133', 'D132', 'D131'], bottom: ['D120', 'D121', 'D122', 'D124', 'D125', 'D126', 'D127', 'D128', 'D129', 'D130'] },
            { id: 'left-2', top: ['D119', 'D118', 'D117', 'D116', 'D115', 'D114', 'D113', 'D112', 'D111', 'D110'], bottom: ['D100', 'D101', 'D102', 'D103', 'D104', 'D105', 'D106', 'D107', 'D108', 'D109'] },
            { id: 'left-3', top: ['D99', 'D98', 'D97', 'D96', 'D95', 'D94', 'D93', 'D92', 'D91', 'D90'], bottom: ['D80', 'D81', 'D82', 'D83', 'D84', 'D85', 'D86', 'D87', 'D88', 'D89'] },
            { id: 'left-4', top: ['D79', 'D78', 'D77', 'D76', 'D75', 'D74', 'D73', 'D72', 'D71', 'D70'], bottom: ['D60', 'D61', 'D62', 'D63', 'D64', 'D65', 'D66', 'D67', 'D68', 'D69'] },
            { id: 'left-5', top: ['D59', 'D58', 'D57', 'D56', 'D55', 'D54', 'D53', 'D52', 'D51', 'D50'], bottom: ['D40', 'D41', 'D42', 'D43', 'D44', 'D45', 'D46', 'D47', 'D48', 'D49'] }
        ].map(row => ({
            id: row.id,
            top: row.top.map(id => ({ id, status: 'available' })),
            bottom: row.bottom.map(id => ({ id, status: 'available' }))
        })),
        rightArea: [
            { id: 'right-1', top: ['D06', 'D07', 'D08'], bottom: ['D12', 'D11', 'D10', 'D09'] },
            { id: 'right-2', top: ['D13', 'D14', 'D15', 'D16'], bottom: ['D20', 'D19', 'D18', 'D17'] },
            { id: 'right-3', top: ['D21', 'D22', 'D23', 'D24'], bottom: ['D28', 'D27', 'D26', 'D25'] },
            { id: 'right-4', top: ['D29', 'D30', 'D31', 'D32'], bottom: ['D36', 'D35', 'D34', 'D33'] }
        ].map(row => ({
            id: row.id,
            top: row.top.map(id => ({ id, status: 'available' })),
            bottom: row.bottom.map(id => ({ id, status: 'available' }))
        })),
        conference12: Array.from({ length: 12 }, (_, i) => ({ id: `C12-${i + 1}`, status: 'available' })),
        conference8: Array.from({ length: 8 }, (_, i) => ({ id: `C8-${i + 1}`, status: 'available' })),
        meetingRoom: Array.from({ length: 4 }, (_, i) => ({ id: `M-${i + 1}`, status: 'available' })),
        dirCabin1: Array.from({ length: 4 }, (_, i) => ({ id: `DC1-${i + 1}`, status: 'available' })),
        dirCabin2: Array.from({ length: 4 }, (_, i) => ({ id: `DC2-${i + 1}`, status: 'available' })),
        reception: Array.from({ length: 2 }, (_, i) => ({ id: `REC-${i + 1}`, status: 'available' })),
        hrRoom: Array.from({ length: 3 }, (_, i) => ({ id: `HR-${i + 1}`, status: 'available' })),
        smallCabin1: Array.from({ length: 2 }, (_, i) => ({ id: `SC1-${i + 1}`, status: 'available' })),
        smallCabin2: Array.from({ length: 2 }, (_, i) => ({ id: `SC2-${i + 1}`, status: 'available' }))
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
                                    ? { ...seat, status: 'booked', employeeData: foundSeat.employeeData, dbId: foundSeat._id }
                                    : { ...seat, status: 'available' }
                            })

                        return {
                            leftArea: prevSeats.leftArea.map(row => ({
                                ...row,
                                top: updateSeatStatus(row.top),
                                bottom: updateSeatStatus(row.bottom)
                            })),
                            rightArea: prevSeats.rightArea.map(row => ({
                                ...row,
                                top: updateSeatStatus(row.top),
                                bottom: updateSeatStatus(row.bottom)
                            })),
                            conference12: updateSeatStatus(prevSeats.conference12),
                            conference8: updateSeatStatus(prevSeats.conference8),
                            meetingRoom: updateSeatStatus(prevSeats.meetingRoom),
                            dirCabin1: updateSeatStatus(prevSeats.dirCabin1),
                            dirCabin2: updateSeatStatus(prevSeats.dirCabin2),
                            reception: updateSeatStatus(prevSeats.reception),
                            hrRoom: updateSeatStatus(prevSeats.hrRoom),
                            smallCabin1: updateSeatStatus(prevSeats.smallCabin1),
                            smallCabin2: updateSeatStatus(prevSeats.smallCabin2),
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

    const getSeatColor = status => (status === 'available' ? '#2ecc71' : '#3498db') // Premium colors

    const premiumPaperStyle = {
        p: 2.5,
        borderRadius: '16px',
        boxShadow: '0 8px 32px rgba(31, 38, 135, 0.1)',
        background: 'rgba(255, 255, 255, 0.95)',
        border: '1px solid rgba(255, 255, 255, 0.4)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        transition: 'all 0.3s ease',
        '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: '0 12px 40px rgba(31, 38, 135, 0.15)',
        }
    }

    const typographyHeader = {
        color: '#2c3e50',
        fontWeight: 800,
        letterSpacing: 1.2,
        textTransform: 'uppercase',
        mb: 1
    }

    const renderSeat = (seat, rotation = 0) => (
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
                display='flex'
                flexDirection='column'
                alignItems='center'
                m={0.5}
                onMouseEnter={() => handleSeatHover(seat)}
                onMouseLeave={handleSeatHoverEnd}
                onClick={() => handleSeatClick(seat)}
                sx={{ cursor: 'pointer' }}
            >
                <IconButton
                    sx={{
                        color: getSeatColor(seat.status),
                        fontSize: 32,
                        padding: 0.5,
                        transform: `rotate(${rotation}deg)`,
                        transition: 'transform 0.2s, filter 0.2s',
                        filter: 'drop-shadow(0px 4px 4px rgba(0,0,0,0.2))',
                        '&:hover': {
                            filter: 'drop-shadow(0px 6px 8px rgba(0,0,0,0.3))',
                            transform: `rotate(${rotation}deg) scale(1.1)`,
                        },
                        '& .MuiSvgIcon-root': {
                            fontSize: 32
                        }
                    }}
                >
                    <WeekendIcon />
                </IconButton>
                <Typography
                    variant='caption'
                    sx={{
                        fontSize: '0.75rem',
                        fontWeight: 'bold',
                        color: '#34495e',
                        whiteSpace: 'nowrap'
                    }}
                >
                    {seat.id}
                </Typography>
            </Box>
        </Tooltip>
    )

    return (
        <Box p={4} display='flex' flexDirection='column' sx={{ background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}>
            <Typography variant='h4' gutterBottom sx={{ fontWeight: 900, color: '#1a252f', textShadow: '1px 1px 2px rgba(0,0,0,0.1)' }}>
                Workspace Layout ({location.toLocaleUpperCase()})
            </Typography>

            <Box display='flex' alignItems='center' mb={3} p={2} sx={{ background: 'rgba(255,255,255,0.7)', borderRadius: 3, boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
                <Box display='flex' alignItems='center' ml={4}>
                    <Box display='flex' alignItems='center' mr={2}>
                        <WeekendIcon sx={{ color: '#2ecc71', filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.2))' }} />
                        <Typography ml={0.5} fontWeight="bold" color="#2c3e50">Available</Typography>
                    </Box>
                    <Box display='flex' alignItems='center' mr={2}>
                        <WeekendIcon sx={{ color: '#3498db', filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.2))' }} />
                        <Typography ml={0.5} fontWeight="bold" color="#2c3e50">Booked</Typography>
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
                        {['noida', 'bareilly'].map(loc => (
                            <MenuItem key={loc} value={loc}>
                                {loc.toUpperCase()}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
            </Box>

            {location === 'noida' ? (
                <Box sx={{ width: '100%', overflowX: 'auto', p: 3, bgcolor: 'transparent' }}>
                    <Box display="flex" flexDirection="column" gap={4} sx={{ minWidth: '1400px' }}>
                        {/* TOP ROW */}
                        <Box display="flex" gap={4}>
                            {/* Left: HR Room & Reception */}
                            <Box display="flex" flexDirection="column" gap={3} width="240px">
                                <Paper sx={{ ...premiumPaperStyle, height: '160px', justifyContent: 'center' }} elevation={0}>
                                    <Typography variant="subtitle2" sx={typographyHeader}>HR / WAITING</Typography>
                                    <Box display="flex" gap={1}>{seats.hrRoom.map(s => renderSeat(s))}</Box>
                                </Paper>
                                <Paper sx={{ ...premiumPaperStyle, height: '160px', justifyContent: 'center' }} elevation={0}>
                                    <Typography variant="subtitle2" sx={typographyHeader}>RECEPTION</Typography>
                                    <Box display="flex" gap={1}>{seats.reception.map(s => renderSeat(s))}</Box>
                                </Paper>
                            </Box>

                            {/* Middle: Conference 12 */}
                            <Paper sx={{ ...premiumPaperStyle,  justifyContent: 'center' }} elevation={0}>
                                <Typography variant="subtitle1" sx={typographyHeader}>CONFERENCE 12 PAX</Typography>
                                <Box display="flex" justifyContent="center" alignItems="stretch" gap={3} mt={2}>
                                    <Box display="flex" flexDirection="column" gap={0.5}>
                                        {seats.conference12.slice(0, 6).map(s => renderSeat(s, 90))}
                                    </Box>
                                    <Box
                                        width="120px"
                                        my={2}
                                        sx={{
                                            background: 'linear-gradient(to bottom, #bdc3c7, #95a5a6)',
                                            borderRadius: '60px',
                                            boxShadow: '0 8px 20px rgba(0,0,0,0.15), inset 0 2px 5px rgba(255,255,255,0.5)',
                                            border: '4px solid #7f8c8d'
                                        }}
                                    />
                                    <Box display="flex" flexDirection="column" gap={0.5}>
                                        {seats.conference12.slice(6, 12).map(s => renderSeat(s, -90))}
                                    </Box>
                                </Box>
                            </Paper>

                            {/* Right: Studio & Meeting & Sick */}
                            <Box display="flex" flexDirection="column" gap={3} width="350px">
                                <Box display="flex" gap={3}>
                                    <Paper sx={{ ...premiumPaperStyle, flex: 1, height: '120px', justifyContent: 'center' }} elevation={0}>
                                        <CameraAltIcon sx={{ fontSize: 40, color: '#95a5a6', mb: 1, filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }} />
                                        <Typography variant="subtitle2" sx={typographyHeader}>STUDIO</Typography>
                                    </Paper>
                                    <Paper sx={{ ...premiumPaperStyle, flex: 1.2, height: '120px', justifyContent: 'center' }} elevation={0}>
                                        <Typography variant="subtitle2" sx={typographyHeader}>MEETING</Typography>
                                        <Box display="flex" flexWrap="wrap" justifyContent="center">{seats.meetingRoom.map(s => renderSeat(s))}</Box>
                                    </Paper>
                                </Box>
                                <Paper sx={{ ...premiumPaperStyle, height: '120px', justifyContent: 'center' }} elevation={0}>
                                    <LocalHospitalIcon sx={{ fontSize: 40, color: '#e74c3c', mb: 1, filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }} />
                                    <Typography variant="subtitle2" sx={typographyHeader}>SICK / RESTROOM</Typography>
                                </Paper>
                            </Box>
                        </Box>

                        {/* MIDDLE MAIN ROW */}
                        <Box display="flex" gap={4}>
                            {/* Left Column 2 */}
                            <Box display="flex" flexDirection="column" gap={3} width="240px">
                                <Paper sx={{ ...premiumPaperStyle, height: '240px', justifyContent: 'center' }} elevation={0}>
                                    <Typography variant="subtitle1" sx={typographyHeader}>DIRECTOR CABIN 1</Typography>
                                    <Box display="flex" flexDirection="column" alignItems="center" gap={1.5} mt={1}>
                                        <Box>{renderSeat(seats.dirCabin1[0], 180)}</Box>
                                        <Box width="110px" height="18px" sx={{ background: 'linear-gradient(135deg, #bdc3c7, #2c3e50)', borderRadius: 2, boxShadow: '0 4px 6px rgba(0,0,0,0.3)' }} />
                                        <Box display="flex" gap={1.5}>
                                            {seats.dirCabin1.slice(1).map(s => renderSeat(s, 0))}
                                        </Box>
                                    </Box>
                                </Paper>
                                <Paper sx={{ ...premiumPaperStyle, height: '120px', justifyContent: 'center' }} elevation={0}>
                                    <PhoneInTalkIcon sx={{ fontSize: 40, color: '#f39c12', mb: 1, filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }} />
                                    <Typography variant="subtitle2" sx={typographyHeader}>PHONE BOOTH</Typography>
                                </Paper>
                                <Paper sx={{ ...premiumPaperStyle, height: '120px', justifyContent: 'center' }} elevation={0}>
                                    <DnsIcon sx={{ fontSize: 40, color: '#34495e', mb: 1, filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }} />
                                    <Typography variant="subtitle2" sx={typographyHeader}>SERVER ROOM</Typography>
                                </Paper>
                                <Paper sx={{ ...premiumPaperStyle, height: '150px', justifyContent: 'center' }} elevation={0}>
                                    <LocalCafeIcon sx={{ fontSize: 50, color: '#8e44ad', mb: 1, filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }} />
                                    <Typography variant="subtitle2" sx={typographyHeader}>PANTRY</Typography>
                                </Paper>
                            </Box>

                            {/* Middle: 100 Seats Area */}
                            <Paper sx={{ ...premiumPaperStyle, gap: 4, pt: 4, pb: 4 }} elevation={0}>
                                <Typography variant="h6" sx={typographyHeader}>MAIN SEATING (130 PAX) - LEFT AREA</Typography>
                                {seats.leftArea.map((row) => (
                                    <Box key={row.id} display="flex" flexDirection="column" alignItems="center" gap={1} width="100%">
                                        <Box display="flex" gap={1.5}>
                                            {row.top.map(s => renderSeat(s, 180))}
                                        </Box>
                                        <Box width="95%" height="30px" sx={{ background: 'linear-gradient(to right, #ecf0f1, #bdc3c7)', borderRadius: 2, boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)' }} />
                                        <Box display="flex" gap={1.5}>
                                            {row.bottom.map(s => renderSeat(s, 0))}
                                        </Box>
                                    </Box>
                                ))}
                            </Paper>

                            {/* Right: Dir Cabin 2 + 31 Seats */}
                            <Box display="flex" flexDirection="column" gap={3} width="240px">
                                <Paper sx={{ ...premiumPaperStyle, height: '240px', justifyContent: 'center' }} elevation={0}>
                                    <Typography variant="subtitle1" sx={typographyHeader}>DIRECTOR CABIN 2</Typography>
                                    <Box display="flex" flexDirection="column" alignItems="center" gap={1.5} mt={1}>
                                        <Box>{renderSeat(seats.dirCabin2[0], 180)}</Box>
                                        <Box width="110px" height="18px" sx={{ background: 'linear-gradient(135deg, #bdc3c7, #2c3e50)', borderRadius: 2, boxShadow: '0 4px 6px rgba(0,0,0,0.3)' }} />
                                        <Box display="flex" gap={1.5}>
                                            {seats.dirCabin2.slice(1).map(s => renderSeat(s, 0))}
                                        </Box>
                                    </Box>
                                </Paper>
                                <Paper sx={{ ...premiumPaperStyle, gap: 3, pt: 3 }} elevation={0}>
                                    <Typography variant="subtitle1" sx={typographyHeader}>RIGHT AREA</Typography>
                                    {seats.rightArea.map((row) => (
                                        <Box key={row.id} display="flex" flexDirection="column" alignItems="center" gap={1} width="100%">
                                            <Box display="flex" gap={1.5}>
                                                {row.top.map(s => renderSeat(s, 180))}
                                            </Box>
                                            <Box width="100%" height="24px" sx={{ background: 'linear-gradient(to right, #ecf0f1, #bdc3c7)', borderRadius: 2, boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)' }} />
                                            <Box display="flex" gap={1.5}>
                                                {row.bottom.map(s => renderSeat(s, 0))}
                                            </Box>
                                        </Box>
                                    ))}
                                </Paper>
                            </Box>
                        </Box>

                        {/* BOTTOM ROW */}
                        <Box display="flex" gap={4}>
                            <Paper sx={{ ...premiumPaperStyle, flex: 1, justifyContent: 'center' }} elevation={0}>
                                <SportsEsportsIcon sx={{ fontSize: 60, color: '#16a085', mb: 1, filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }} />
                                <Typography variant="h6" sx={typographyHeader}>PLAY AREA</Typography>
                            </Paper>
                            <Paper sx={{ ...premiumPaperStyle, width: '200px', justifyContent: 'center' }} elevation={0}>
                                <Typography variant="subtitle2" sx={typographyHeader}>SMALL CABIN 1</Typography>
                                <Box display="flex" flexWrap="wrap" justifyContent="center" gap={1.5} mt={1}>{seats.smallCabin1.map(s => renderSeat(s))}</Box>
                            </Paper>
                            <Paper sx={{ ...premiumPaperStyle, width: '200px', justifyContent: 'center' }} elevation={0}>
                                <Typography variant="subtitle2" sx={typographyHeader}>SMALL CABIN 2</Typography>
                                <Box display="flex" flexWrap="wrap" justifyContent="center" gap={1.5} mt={1}>{seats.smallCabin2.map(s => renderSeat(s))}</Box>
                            </Paper>
                            <Paper sx={{ ...premiumPaperStyle, width: '180px', justifyContent: 'center' }} elevation={0}>
                                <InventoryIcon sx={{ fontSize: 40, color: '#7f8c8d', mb: 1, filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }} />
                                <Typography variant="subtitle2" sx={typographyHeader}>STORE ROOM</Typography>
                            </Paper>
                            <Paper sx={{ ...premiumPaperStyle, width: '350px', justifyContent: 'center' }} elevation={0}>
                                <Typography variant="subtitle1" sx={typographyHeader}>CONFERENCE 8 PAX</Typography>
                                <Box display="flex" justifyContent="center" alignItems="stretch" gap={3} mt={2}>
                                    <Box display="flex" flexDirection="column" gap={0.5}>
                                        {seats.conference8.slice(0, 4).map(s => renderSeat(s, 90))}
                                    </Box>
                                    <Box
                                        width="100px"
                                        my={1}
                                        sx={{
                                            background: 'linear-gradient(to bottom, #bdc3c7, #95a5a6)',
                                            borderRadius: '50px',
                                            boxShadow: '0 8px 20px rgba(0,0,0,0.15), inset 0 2px 5px rgba(255,255,255,0.5)',
                                            border: '3px solid #7f8c8d'
                                        }}
                                    />
                                    <Box display="flex" flexDirection="column" gap={0.5}>
                                        {seats.conference8.slice(4, 8).map(s => renderSeat(s, -90))}
                                    </Box>
                                </Box>
                            </Paper>
                        </Box>
                    </Box>
                </Box>
            ) : location === 'patel nagar' ? (
                <PatelNagarSeating location={location} setLocation={setLocation} />
            ) : (
                <BareillySeating location={location} setLocation={setLocation} />
            )}

            <Dialog open={openForm} onClose={handleFormClose} fullWidth maxWidth='sm'
                PaperProps={{
                    sx: {
                        borderRadius: '20px',
                        background: 'transparent',
                        boxShadow: 'none'
                    }
                }}
            >
                <DialogContent>
                    {selectedSeat && (
                        <AddSeatingArrangementForm
                            seatingArrangementId={selectedSeat.dbId || null}
                            seatNo={selectedSeat.id}
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
