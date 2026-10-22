'use client';

import React, { useState, useEffect } from 'react';
import {
    Box,
    Grid,
    Typography,
    CircularProgress,
    Card,
    CardContent,
    CardActions,
    IconButton,
    Container,
    Fade,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    alpha,
    useTheme,
    useMediaQuery
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import InfoIcon from '@mui/icons-material/Info';
import DownloadIcon from '@mui/icons-material/Download';
import { styled, keyframes } from '@mui/material/styles';

import AchievementForm from '@/components/acheivement/AchievementForm';
import { useSettings } from '@/@core/hooks/useSettings';

const API_URL = process.env.NEXT_PUBLIC_APP_URL + '/achievements';
const DUMMY_IMAGE = 'https://img.freepik.com/premium-vector/figure-wooden-dummy-climb-up-wooden-stairs-concept-career-up-business-growth-up-success-life-management-achievement-concept-success_131476-99.jpg';

// Animation keyframes for the moving border
const borderAnimation = keyframes`
    0% { background-position: 0% 0%; }
    25% { background-position: 100% 0%; }
    50% { background-position: 100% 100%; }
    75% { background-position: 0% 100%; }
    100% { background-position: 0% 0%; }
`;

// Styled Components
const StyledCard = styled(Card)(({ theme }) => ({
    width: '100%',
    borderRadius: '16px',
    transition: 'all 0.3s ease',
    position: 'relative',
    backgroundColor: theme.palette.background.paper,
    maxWidth: '100%',
    minHeight: '250px',
    display: 'flex',
    flexDirection: 'row',
    color: 'inherit',
    overflow: 'hidden',
    padding: '3px',
    margin: '20px 0',
    [theme.breakpoints.down('md')]: {
        flexDirection: 'column',
    },
    '&:hover': {
        transform: 'translateY(-10px)',
        boxShadow: theme.shadows[10],
        '& .edit-actions': {
            opacity: 1
        }
    },
    '&::before': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        borderRadius: '16px',
        padding: '3px',
        background: 'linear-gradient(45deg, #0077ff, #00a8ff, #0077ff, #00a8ff)',
        backgroundSize: '400% 400%',
        animation: `${borderAnimation} 3s linear infinite`,
        WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
        WebkitMaskComposite: 'xor',
        maskComposite: 'exclude',
    },
    '& > *:not(:before)': {
        backgroundColor: theme.palette.background.paper,
        borderRadius: '13px',
        boxShadow: `
            inset 0 0 15px ${alpha(theme.palette.primary.main, 0.1)},
            inset 0 0 20px ${alpha(theme.palette.common.white, 0.2)},
            0 0 20px ${alpha(theme.palette.common.black, 0.15)}
        `,
    }
}));

const MediaContainer = styled(Box)(({ theme }) => ({
    width: '40%',
    minWidth: '250px',
    height: '250px',
    position: 'relative',
    overflow: 'hidden',
    borderTopLeftRadius: '13px',
    borderBottomLeftRadius: '13px',
    [theme.breakpoints.down('md')]: {
        width: '100%',
        minWidth: '100%',
        borderTopLeftRadius: '13px',
        borderTopRightRadius: '13px',
        borderBottomLeftRadius: '0',
    },
    '&::after': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        boxShadow: 'inset 0 0 10px rgba(0,0,0,0.1)',
        pointerEvents: 'none'
    }
}));

const ContentContainer = styled(Box)(({ theme }) => ({
    width: '60%',
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    background: theme.palette.background.default,
    borderTopRightRadius: '13px',
    borderBottomRightRadius: '13px',
    [theme.breakpoints.down('md')]: {
        width: '100%',
        borderTopRightRadius: '0',
        borderBottomLeftRadius: '13px',
        borderBottomRightRadius: '13px',
    },
    '&::before': {
        content: '""',
        position: 'absolute',
        top: '10px',
        left: '-5px',
        width: '10px',
        height: '10px',
        backgroundColor: theme.palette.primary.main,
        borderRadius: '50%',
        boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
        [theme.breakpoints.down('md')]: {
            display: 'none'
        },
    },
    '&::after': {
        content: '""',
        position: 'absolute',
        bottom: '10px',
        left: '-5px',
        width: '10px',
        height: '10px',
        backgroundColor: theme.palette.primary.main,
        borderRadius: '50%',
        boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
        [theme.breakpoints.down('md')]: {
            display: 'none'
        },
    }
}));

const StyledCardActions = styled(CardActions)(({ theme }) => ({
    justifyContent: 'flex-end',
    padding: '16px',
    opacity: 0,
    transition: 'opacity 0.3s ease',
    '&.edit-actions': {
        position: 'absolute',
        top: 0,
        right: 0,
        backgroundColor: alpha(theme.palette.background.paper, 0.9),
        borderRadius: '0 13px 0 13px',
        zIndex: 1
    }
}));

const DownloadButton = styled(Button)(({ theme }) => ({
    position: 'absolute',
    bottom: 10,
    left: 10,
    background: alpha(theme.palette.common.black, 0.6),
    color: theme.palette.common.white,
    padding: '6px 12px',
    borderRadius: '5px',
    textDecoration: 'none',
    zIndex: 1,
    transition: 'all 0.2s ease',
    '&:hover': {
        background: alpha(theme.palette.common.black, 0.8),
    }
}));

const Achievement = () => {
    const { settings } = useSettings();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const [achievements, setAchievements] = useState([]);
    const [loading, setLoading] = useState(false);
    const [editId, setEditId] = useState(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedDescription, setSelectedDescription] = useState('');
    const [userData, setUserData] = useState(null);

    useEffect(() => {
        const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
        setUserData(storedUser);
    }, []);

    useEffect(() => {
        fetchAchievements();
    }, []);

    const fetchAchievements = async () => {
        setLoading(true);

        try {
            const userData = JSON.parse(localStorage.getItem('user') || '{}');
            const companyId = userData?.company_id;

            if (!companyId) {
                console.error('Missing company_id');
                setLoading(false);
                return;
            }

            const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/achievements/get-by/${companyId}`);

            if (!response.ok) {
                throw new Error(`Error: ${response.statusText}`);
            }

            const data = await response.json();
            setAchievements(data);
        } catch (error) {
            console.error('Error fetching achievements:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this achievement?')) {
            try {
                const response = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });

                if (response.ok) {
                    fetchAchievements();
                }
            } catch (error) {
                console.error('Error deleting achievement:', error);
            }
        }
    };

    const truncateDescription = (text, maxLength = 150) => {
        if (!text) return 'N/A';
        if (text.length <= maxLength) return text;

        return text.substring(0, maxLength).trim() + '...';
    };

    const handleReadMore = (description) => {
        setSelectedDescription(description);
        setModalOpen(true);
    };

    const renderMedia = (fileUrl) => {
        const mediaStyle = {
            width: '100%',
            height: '100%',
            objectFit: 'cover'
        };

        if (!fileUrl) return (
            <img
                src={DUMMY_IMAGE}
                alt="Default Achievement"
                style={mediaStyle}
            />
        );

        if (fileUrl.match(/\.(jpeg|jpg|png|gif)$/)) {
            return (
                <>
                    <img
                        src={fileUrl}
                        alt="Achievement"
                        style={mediaStyle}
                    />
                    <DownloadButton
                        variant="contained"
                        startIcon={<DownloadIcon />}
                        size="small"
                        component="a"
                        href={fileUrl}
                        download
                    >
                        Download
                    </DownloadButton>
                </>
            );
        }

        if (fileUrl.match(/\.(mp4|mov|avi|webm)$/)) {
            return (
                <video
                    controls
                    style={mediaStyle}
                >
                    <source src={fileUrl} type="video/mp4" />
                    Your browser does not support the video tag.
                </video>
            );
        }

        if (fileUrl.match(/\.(pdf)$/)) {
            return (
                <>
                    <iframe
                        src={fileUrl}
                        title="PDF Document"
                        style={mediaStyle}
                    />
                    <DownloadButton
                        variant="contained"
                        startIcon={<DownloadIcon />}
                        size="small"
                        component="a"
                        href={fileUrl}
                        download
                    >
                        Download
                    </DownloadButton>
                </>
            );
        }

        return (
            <img
                src={DUMMY_IMAGE}
                alt="Default Achievement"
                style={mediaStyle}
            />
        );
    };

    return (
        <Container maxWidth="lg">
            <Box sx={{ py: 4 }}>
                {editId !== null && (
                    <Box
                        sx={{
                            mb: 4,
                            p: 3,
                            backgroundColor: alpha(theme.palette.primary.main, 0.1),
                            borderRadius: 2,
                            boxShadow: theme.shadows[2]
                        }}
                    >
                        <AchievementForm
                            id={editId}
                            onSuccess={() => {
                                setEditId(null);
                                fetchAchievements();
                            }}
                            onClose={() => setEditId(null)}
                        />
                    </Box>
                )}

                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
                        <CircularProgress
                            size={60}
                            thickness={4}
                            sx={{
                                color: theme.palette.primary.main,
                                '& .MuiCircularProgress-circle': {
                                    strokeLinecap: 'round',
                                }
                            }}
                        />
                    </Box>
                ) : (
                    <Fade in={!loading} timeout={500}>
                        <Grid container spacing={3}>
                            {achievements?.length === 0 ? (
                                <Grid item xs={12}>
                                    <Box
                                        sx={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            textAlign: 'center',
                                            height: '30vh',
                                            p: 4,
                                            backgroundColor: alpha(theme.palette.primary.main, 0.05),
                                            borderRadius: 2
                                        }}
                                    >
                                        <InfoIcon sx={{ fontSize: 64, color: theme.palette.text.secondary, mb: 2 }} />
                                        <Typography variant="h6" color="textSecondary">
                                            No achievements found
                                        </Typography>
                                    </Box>
                                </Grid>
                            ) : (
                                achievements?.map((achievement) => (
                                    <Grid item xs={12} key={achievement._id}>
                                        <StyledCard elevation={3}>
                                            <MediaContainer>
                                                {renderMedia(achievement.fileUrl)}
                                            </MediaContainer>

                                            <ContentContainer>
                                                {userData && userData.role === '1' && (
                                                    <StyledCardActions className="edit-actions">
                                                        <IconButton
                                                            onClick={() => setEditId(achievement._id)}
                                                            color="primary"
                                                            size="small"
                                                            sx={{
                                                                mr: 1,
                                                                backgroundColor: alpha(theme.palette.background.paper, 0.8)
                                                            }}
                                                        >
                                                            <EditIcon />
                                                        </IconButton>
                                                        <IconButton
                                                            onClick={() => handleDelete(achievement._id)}
                                                            color="error"
                                                            size="small"
                                                            sx={{
                                                                backgroundColor: alpha(theme.palette.background.paper, 0.8)
                                                            }}
                                                        >
                                                            <DeleteIcon />
                                                        </IconButton>
                                                    </StyledCardActions>
                                                )}

                                                <CardContent sx={{ p: isMobile ? 2 : 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
                                                    <Typography
                                                        variant="h6"
                                                        sx={{
                                                            fontWeight: 600,
                                                            color: settings.mode === 'dark' ? theme.palette.common.white : theme.palette.primary.dark,
                                                            mb: 2,
                                                            fontSize: { xs: '1rem', sm: '1.25rem' }
                                                        }}
                                                    >
                                                        {achievement.title || 'N/A'}
                                                    </Typography>
                                                    <Typography
                                                        variant="body2"
                                                        sx={{
                                                            color: settings.mode === 'dark' ? theme.palette.text.secondary : theme.palette.text.primary,
                                                            mb: 2,
                                                            lineHeight: 1.6,
                                                            flexGrow: 1
                                                        }}
                                                    >
                                                        {truncateDescription(achievement.description)}
                                                    </Typography>

                                                    {achievement.description?.length > 150 && (
                                                        <Button
                                                            size="small"
                                                            onClick={() => handleReadMore(achievement.description)}
                                                            startIcon={<InfoIcon fontSize="small" />}
                                                            sx={{
                                                                color: settings.mode === 'dark' ? theme.palette.primary.light : theme.palette.primary.main,
                                                                textTransform: 'none',
                                                                alignSelf: 'flex-start',
                                                                '&:hover': {
                                                                    backgroundColor: alpha(theme.palette.primary.main, 0.08),
                                                                }
                                                            }}
                                                        >
                                                            Read More
                                                        </Button>
                                                    )}
                                                </CardContent>
                                            </ContentContainer>
                                        </StyledCard>
                                    </Grid>
                                ))
                            )}
                        </Grid>
                    </Fade>
                )}

                <Dialog
                    open={modalOpen}
                    onClose={() => setModalOpen(false)}
                    maxWidth="md"
                    fullWidth
                    PaperProps={{
                        sx: {
                            borderRadius: 2,
                            bgcolor: theme.palette.background.paper,
                            boxShadow: theme.shadows[10]
                        }
                    }}
                >
                    <DialogTitle
                        sx={{
                            color: settings.mode === 'dark' ? theme.palette.common.white : theme.palette.text.primary,
                            fontWeight: 'bold',
                            borderBottom: `1px solid ${theme.palette.divider}`,
                            p: 3
                        }}
                    >
                        Description
                    </DialogTitle>
                    <DialogContent sx={{ p: 3, mt: 1 }}>
                        <Typography
                            variant="body1"
                            sx={{
                                color: settings.mode === 'dark' ? theme.palette.common.white : theme.palette.text.primary,
                                lineHeight: 1.6
                            }}
                        >
                            {selectedDescription}
                        </Typography>
                    </DialogContent>
                    <DialogActions sx={{ p: 2, px: 3 }}>
                        <Button
                            onClick={() => setModalOpen(false)}
                            variant="contained"
                            color="primary"
                            sx={{ px: 4 }}
                        >
                            Close
                        </Button>
                    </DialogActions>
                </Dialog>
            </Box>
        </Container>
    );
};

export default Achievement;
