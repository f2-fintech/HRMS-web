'use client'
import React, { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
    Card,
    CardContent,
    Avatar,
    Typography,
    Box,
    Button,
    IconButton,
    DialogContent,
    Dialog,
    DialogActions,
    TextField,
    Chip,
    alpha,
    useTheme,
    styled,
    DialogTitle,
    Tooltip,
    Tabs,
    Tab
} from '@mui/material'
import EmailIcon from '@mui/icons-material/Email'
import PhoneIcon from '@mui/icons-material/Phone'
import { Edit } from '@mui/icons-material'
import ProfileForm from '@/components/profileForm/ProfileForm'
import CloseIcon from '@mui/icons-material/Close'
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera'
import { CircularProgressbar } from 'react-circular-progressbar'
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ProfileAttendance from '@/components/profile/ProfileAttendance'
import ProfilePerformance from '@/components/profile/ProfilePerformance'

import 'react-circular-progressbar/dist/styles.css'

const StyledCard = styled(Card)(({ theme }) => ({
    width: '95%',
    margin: theme.spacing(10),
    padding: theme.spacing(4),
    paddingTop: theme.spacing(10), // Increased top padding
    borderRadius: '32px',
    boxShadow: '0 16px 48px rgba(0, 0, 0, 0.12)',
    background: `linear-gradient(145deg, ${alpha(theme.palette.background.paper, 0.8)}, ${alpha(theme.palette.background.default, 0.9)})`,
    backdropFilter: 'blur(5px)',
    overflow: 'unset'
}))

const InfoChip = styled(Chip)(({ theme }) => ({
    margin: theme.spacing(0.5),
    fontWeight: 600,
    borderRadius: '20px',
    boxShadow: '0 3px 6px rgba(0, 0, 0, 0.08)',
    transition: 'all 0.2s ease-in-out',
    '&:hover': {
        transform: 'translateY(-2px)',
        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.12)'
    }
}))

const StyledDialog = styled(Dialog)(({ theme }) => ({
    '& .MuiDialog-paper': {
        borderRadius: '24px',
        padding: theme.spacing(3),
        boxShadow: '0 24px 48px rgba(0, 0, 0, 0.2)'
    }
}))

const StyledDialogContent = styled(DialogContent)(({ theme }) => ({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: theme.spacing(3)
}))

const StyledAvatarPreview = styled(Avatar)(({ theme }) => ({
    width: 200,
    height: 200,
    boxShadow: '0 12px 24px rgba(0, 0, 0, 0.15)',
    margin: theme.spacing(2, 0)
}))

const Profile = () => {
    const [userData, setUserData] = useState(null)
    const [bio, setBio] = useState('')
    const [isEditingBio, setIsEditingBio] = useState(false)
    const [calculateFilledTabsCount, setCalculateFilledTabsCount] = useState(0)
    const [openImageEditor, setOpenImageEditor] = useState(false)
    const [uploadedImage, setUploadedImage] = useState(null)
    const [remloading, setRemLoading] = useState(false)
    const [saveloading, setSaveLoading] = useState(false)
    const [previewUrl, setPreviewUrl] = useState(null)
    const [checkVerify, setCheckVerify] = useState(false)
    const [verticalTabValue, setVerticalTabValue] = useState(0)

    const handleVerticalTabChange = (event, newValue) => {
        setVerticalTabValue(newValue)
    }

    const router = useRouter();

    const handleGoBack = () => {
        router.back();  // Navigate back to the previous page
    };

    // const searchParams = useSearchParams();
    const theme = useTheme()
    // const _id = searchParams.get('_id');
    const user = JSON.parse(localStorage.getItem('user') || '{}')

    const params = useParams()
    const userId = params.id

    useEffect(() => {
        return () => {
            if (previewUrl) {
                URL.revokeObjectURL(previewUrl)
            }
        }
    }, [previewUrl])

    useEffect(() => {
        const fetchUserData = async userId => {
            try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/employees/get/${userId}`)

                const data = await response.json()
                setUserData(data)
                setBio(data.bio || '')
            } catch (error) {
                console.error('Error fetching user data:', error)
            }
        }

        const profileId = userId
        if (profileId) {
            fetchUserData(profileId)
        }
    }, [userId])

    const handleBioChange = e => {
        e.preventDefault()
        setBio(e.target.value)
    }

    const handleBioUpdate = async () => {
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/employees/${userId}/update-bio`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ bio: bio })
            })
            const data = await response.json()
            if (response.ok) {
                setIsEditingBio(false) // Only close edit mode if successful
            } else {
                console.error('Failed to update bio')
            }
        } catch (error) {
            console.error('Error updating bio:', error)
        }
    }

    const toggleEditBio = () => {
        if (isEditingBio) {
            handleBioUpdate()
        } else {
            setIsEditingBio(true)
        }
    }

    const handleBlur = () => {
        if (isEditingBio) {
            toggleEditBio()
        }
    }

    const handleEditAvatar = () => {
        setOpenImageEditor(true)
    }

    const handleImageChange = e => {
        const file = e.target.files[0]
        if (file) {
            setUploadedImage(file)

            // Create a preview URL for the selected image
            const objectUrl = URL.createObjectURL(file)
            setPreviewUrl(objectUrl)
        }
    }

    const handleSaveAvatar = async () => {
        if (!uploadedImage) return

        setSaveLoading(true)
        try {
            const formData = new FormData()
            formData.append('image', uploadedImage)

            const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/employees/update/${userId}`, {
                method: 'PUT',
                body: formData
            })

            const result = await response.json()
            setSaveLoading(false)
            if (response.ok) {
                setOpenImageEditor(false)
                setUserData({ ...userData, image: result.image })
            } else {
                console.error('Failed to update profile image')
            }
        } catch (error) {
            setSaveLoading(false)
            console.error('Error updating profile image:', error)
        }
    }

    const handleRemoveAvatar = async () => {
        setRemLoading(true)
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/employees/remove/profile/${userId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ image: '' })
            })

            setRemLoading(false)
            if (response.ok) {
                setUserData({ ...userData, image: '' })
                setOpenImageEditor(false)
            } else {
                console.error('Failed to remove profile image')
            }
        } catch (error) {
            setRemLoading(false)
            console.error('Error removing profile image:', error)
        }
    }

    return (
        <Box
            sx={{
                minHeight: '100vh',
                background: `linear-gradient(135deg, ${theme.palette.primary.light} 0%, ${theme.palette.primary.dark} 100%)`,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                padding: '0px',
                borderRadius: '20px'
            }}
        >
            <StyledCard>

                <Tooltip title="Go Back" arrow>
                    <IconButton
                        onClick={handleGoBack}  // Trigger back action
                        sx={{
                            position: 'absolute',
                            left: 20,
                            top: 20,
                            zIndex: 1,  // Ensure it's above other content
                            backgroundColor: theme.palette.background.paper,
                            '&:hover': {
                                backgroundColor: theme.palette.action.hover
                            }
                        }}
                    >
                        <ArrowBackIcon />  {/* Replace with a back arrow icon if desired */}
                    </IconButton>
                </Tooltip>
                {user.id === userData?._id && (
                    <IconButton sx={{ position: 'absolute', right: 20 }} color='primary' onClick={handleEditAvatar}>
                        <PhotoCameraIcon />
                    </IconButton>
                )}

                <StyledDialog open={openImageEditor} onClose={() => setOpenImageEditor(false)}>
                    <DialogTitle>
                        <IconButton
                            aria-label='close'
                            onClick={() => setOpenImageEditor(false)}
                            sx={{
                                position: 'absolute',
                                right: 8,
                                top: 8,
                                color: theme => theme.palette.grey[500]
                            }}
                        >
                            <CloseIcon />
                        </IconButton>
                    </DialogTitle>
                    <StyledDialogContent>
                        <Typography variant='h5' gutterBottom>
                            Edit Profile Picture
                        </Typography>
                        <Box sx={{ position: 'relative', width: 200, height: 200, margin: theme => theme.spacing(2, 0) }}>
                            <StyledAvatarPreview
                                src={previewUrl || userData?.image}
                                alt={`${userData?.first_name} ${userData?.last_name}`}
                            />
                        </Box>
                        <Button variant='outlined' component='label' startIcon={<PhotoCameraIcon />}>
                            Choose File
                            <input type='file' hidden accept='image/*' onChange={handleImageChange} />
                        </Button>
                    </StyledDialogContent>
                    <DialogActions sx={{ padding: theme.spacing(3) }}>
                        <Button onClick={handleRemoveAvatar} color='error' variant='outlined' disabled={remloading || saveloading}>
                            {remloading ? 'Removing...' : 'Remove Current Profile'}
                        </Button>
                        <Button
                            onClick={handleSaveAvatar}
                            color='primary'
                            variant='contained'
                            disabled={uploadedImage === null || saveloading || remloading}
                        >
                            {saveloading ? 'Saving...' : 'Save'}
                        </Button>
                    </DialogActions>
                </StyledDialog>

                <CardContent sx={{ mt: 11 }}>
                    <Avatar
                        src={userData?.image}
                        alt={`${userData?.first_name} ${userData?.last_name}`}
                        sx={{
                            width: 180,
                            height: 180,
                            border: `6px solid ${checkVerify ? theme.palette.success.main : theme.palette.error.main}`,
                            boxShadow: '0 12px 30px rgba(0, 0, 0, 0.15)',
                            position: 'absolute',
                            top: -60,
                            left: '50%',
                            transform: 'translateX(-50%)',
                            transition: 'all 0.3s ease-in-out',
                            '&:hover': {
                                transform: 'translateX(-50%) scale(1.05)'
                            }
                        }}
                    />
                    <Box display='flex' justifyContent='space-between' alignItems='center'>
                        <Box>
                            <Typography variant='h4' component='div' sx={{ fontWeight: 700, mb: 1 }}>
                                {userData?.first_name} {userData?.last_name}
                            </Typography>
                            <Typography
                                variant='h6'
                                component='div'
                                sx={{
                                    fontWeight: 600,
                                    mb: 1,
                                    py: 1,
                                    px: 2,
                                    background: 'rgba(228, 228, 228, 0.5)',
                                    borderRadius: '20px',
                                    display: 'inline-block'
                                }}
                            >
                                Code: {userData?.code}
                            </Typography>
                            <Typography variant='h6' component='div' sx={{ fontWeight: 500, mb: 1, mt: 1 }}>
                                {userData?.location?.toUpperCase()}
                            </Typography>
                            <Typography variant='h6' color='text.secondary' sx={{ mb: 2, fontWeight: 500 }}>
                                {userData?.designation}
                            </Typography>
                            <Typography variant='subtitle1' color='text.secondary' sx={{ mb: 2, fontWeight: 500 }}>
                                DOJ: {userData?.joining_date ? new Date(userData.joining_date).toLocaleDateString() : 'N/A'}
                            </Typography>

                            <Box sx={{ display: 'flex', mb: 3, flexWrap: 'wrap' }}>
                                <Tooltip title='Send Email' arrow>
                                    <InfoChip
                                        icon={<EmailIcon />}
                                        label={userData?.email}
                                        onClick={() => (window.location.href = `mailto:${userData?.email}`)} // Optional: Automatically open email client
                                    />
                                </Tooltip>
                                <InfoChip icon={<PhoneIcon />} label={userData?.contact} />
                            </Box>

                            {/* Editable Bio Field */}
                            {isEditingBio ? (
                                <TextField
                                    label='Bio'
                                    multiline
                                    fullWidth
                                    variant='outlined'
                                    value={bio}
                                    onChange={handleBioChange}
                                    onBlur={handleBlur}
                                    autoFocus
                                    sx={{ mb: 0 }}
                                />
                            ) : (
                                <Box display='flex' alignItems='center'>
                                    <Typography variant='body1' sx={{ mb: 3, lineHeight: 1.6 }}>
                                        {bio || 'No bio available'}
                                    </Typography>
                                    {user.id === userData?._id && (
                                        <IconButton onClick={toggleEditBio} sx={{ ml: 2 }}>
                                            <Edit />
                                        </IconButton>
                                    )}
                                </Box>
                            )}
                        </Box>

                        <Box sx={{ marginBottom: 2, width: '120px' }}>
                            <CircularProgressbar
                                value={calculateFilledTabsCount}
                                text={`${Math.round(calculateFilledTabsCount)}%`}
                                styles={{
                                    path: { stroke: `rgba(92, 107, 192, ${calculateFilledTabsCount / 100})` },
                                    text: { fill: '#5c6bc0', fontSize: '20px' }
                                }}
                            />
                        </Box>
                    </Box>

                    {/* Vertical Tabs Structure */}
                    <Box sx={{ flexGrow: 1, display: 'flex', mt: 4, pt: 2, borderTop: 1, borderColor: 'divider', overflow: 'hidden' }}>
                        <Tabs
                            orientation='vertical'
                            variant='scrollable'
                            value={verticalTabValue}
                            onChange={handleVerticalTabChange}
                            sx={{ borderRight: 1, borderColor: 'divider', minWidth: 150 }}
                        >
                            <Tab label='Overview' />
                            <Tab label='Attendance' />
                            <Tab label='Performance' />
                        </Tabs>

                        <Box sx={{ flexGrow: 1, pl: 3, pt: 1, minWidth: 0, overflow: 'hidden', minHeight: '400px' }}>
                            {verticalTabValue === 0 && (
                                <ProfileForm
                                    profileId={userId}
                                    logedUser={user}
                                    setCalculateFilledTabsCount={setCalculateFilledTabsCount}
                                    setCheckVerify={setCheckVerify}
                                />
                            )}
                            {verticalTabValue === 1 && (
                                <Box>
                                    <ProfileAttendance
                                        profileId={userId}
                                        employeeName={userData ? `${userData.first_name || ''} ${userData.last_name || ''}`.trim() : ''}
                                    />
                                </Box>
                            )}
                            {verticalTabValue === 2 && (
                                <Box>
                                    <ProfilePerformance
                                        profileId={userId}
                                        employeeCode={userData?.code || ''}
                                    />
                                </Box>
                            )}
                        </Box>
                    </Box>
                </CardContent>
            </StyledCard>
        </Box>
    )
}

export default Profile
