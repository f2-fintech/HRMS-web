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
    alpha
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { styled, keyframes } from '@mui/material/styles';

import AchievementForm from '@/components/acheivement/AchievementForm';

const API_URL = process.env.NEXT_PUBLIC_APP_URL + '/achievements';
const DUMMY_IMAGE = 'https://via.placeholder.com/400';

// Animation keyframes for the moving border
const borderAnimation = keyframes`
    0% {
        background-position: 0% 0%;
    }
    25% {
        background-position: 100% 0%;
    }
    50% {
        background-position: 100% 100%;
    }
    75% {
        background-position: 0% 100%;
    }
    100% {
        background-position: 0% 0%;
    }
`;

// Styled Components
const StyledCard = styled(Card)(({ theme }) => ({
    width: '100%',
    borderRadius: '16px',
    transition: 'all 0.3s ease',
    position: 'relative',
    backgroundColor: '#fff',
    maxWidth: '100%',
    minHeight: '250px',
    display: 'flex',
    color: 'inherit',
    overflow: 'hidden',
    padding: '3px',
    margin: '20px 0',
    '&:hover': {
        transform: 'translateY(-10px)',
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
        backgroundColor: '#fff',
        borderRadius: '13px',
        boxShadow: `
            inset 0 0 15px rgba(55, 84, 170, 0.1),
            inset 0 0 20px rgba(255, 255, 255, 0.2),
            0 0 20px rgba(0, 0, 0, 0.15)
        `,
    }
}));

const MediaContainer = styled(Box)(({ theme }) => ({
    width: '40%',
    minWidth: '300px',
    position: 'relative',
    overflow: 'hidden',
    borderTopLeftRadius: '13px',
    borderBottomLeftRadius: '13px',
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
    background: `linear-gradient(135deg, #fff 0%, #f8f9fa 100%)`,
    borderTopRightRadius: '13px',
    borderBottomRightRadius: '13px',
    '&::before': {
        content: '""',
        position: 'absolute',
        top: '10px',
        left: '-5px',
        width: '10px',
        height: '10px',
        backgroundColor: '#1976d2',
        borderRadius: '50%',
        boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
    },
    '&::after': {
        content: '""',
        position: 'absolute',
        bottom: '10px',
        left: '-5px',
        width: '10px',
        height: '10px',
        backgroundColor: '#1976d2',
        borderRadius: '50%',
        boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
    }
}));

const StyledCardActions = styled(CardActions)(() => ({
    justifyContent: 'flex-end',
    padding: '16px',
    opacity: 0,
    transition: 'opacity 0.3s ease',
    '&.edit-actions': {
        position: 'absolute',
        top: 0,
        right: 0,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderRadius: '0 13px 0 13px',
        zIndex: 1
    }
}));

const Achievement = () => {
    const [achievements, setAchievements] = useState([]);
    const [loading, setLoading] = useState(false);
    const [editId, setEditId] = useState(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedDescription, setSelectedDescription] = useState('');

    useEffect(() => {
        fetchAchievements();
    }, []);

    const fetchAchievements = async () => {
        setLoading(true); // Set loading state to true

        try {
            // Retrieve token and company_id from localStorage
            const token = localStorage.getItem('token');
            const userData = JSON.parse(localStorage.getItem('user') || '{}');
            const companyId = userData?.company_id;

            // If token or company_id are missing, return early
            if (!token || !companyId) {
                console.error('Missing token or company_id');
                setLoading(false);
                return;
            }

            // Set up the request headers with token and company_id
            const headers = {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
                'company-id': companyId, // Include company_id in headers
            };

            // Fetch data from the API
            const response = await fetch(API_URL, { headers });

            // Check if the response is successful
            if (!response.ok) {
                throw new Error(`Error: ${response.statusText}`);
            }

            // Parse the response data
            const data = await response.json();

            // Update state with fetched achievements
            setAchievements(data);
        } catch (error) {
            // Log any errors that occur during the fetch
            console.error('Error fetching achievements:', error);
        } finally {
            // Set loading state to false after fetching is complete
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
                    <a
                        href={fileUrl}
                        download
                        style={{
                            position: 'absolute',
                            bottom: 10,
                            left: 10,
                            background: 'rgba(0,0,0,0.5)',
                            color: 'white',
                            padding: '5px 10px',
                            borderRadius: '5px',
                            textDecoration: 'none',
                            zIndex: 1
                        }}
                    >
                        Download
                    </a>
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
                    <a
                        href={fileUrl}
                        download
                        style={{
                            position: 'absolute',
                            bottom: 10,
                            left: 10,
                            background: 'rgba(0,0,0,0.5)',
                            color: 'white',
                            padding: '5px 10px',
                            borderRadius: '5px',
                            textDecoration: 'none',
                            zIndex: 1
                        }}
                    >
                        Download
                    </a>
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
                    <Box sx={{ mb: 4, p: 3, backgroundColor: alpha('#42a5f5', 0.1), borderRadius: 2 }}>
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
                    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                        <CircularProgress size={60} thickness={4} sx={{ color: '#1976d2' }} />
                    </Box>
                ) : (
                    <Fade in={!loading}>
                        <Grid container spacing={3}>
                            {achievements?.map((achievement) => (
                                <Grid item xs={12} key={achievement._id}>
                                    <StyledCard>
                                        <MediaContainer>
                                            {renderMedia(achievement.fileUrl)}
                                        </MediaContainer>

                                        <ContentContainer>
                                            <StyledCardActions className="edit-actions">
                                                <IconButton
                                                    onClick={() => setEditId(achievement._id)}
                                                    sx={{ color: '#1976d2' }}
                                                >
                                                    <EditIcon />
                                                </IconButton>
                                                <IconButton
                                                    onClick={() => handleDelete(achievement._id)}
                                                    sx={{ color: '#e53935' }}
                                                >
                                                    <DeleteIcon />
                                                </IconButton>
                                            </StyledCardActions>

                                            <CardContent sx={{ p: 3, height: '100%' }}>
                                                <Typography
                                                    variant="h6"
                                                    sx={{
                                                        fontWeight: 600,
                                                        color: '#1a237e',
                                                        mb: 2
                                                    }}
                                                >
                                                    {achievement.title || 'N/A'}
                                                </Typography>
                                                <Typography
                                                    variant="body2"
                                                    sx={{
                                                        color: '#424242',
                                                        mb: 2,
                                                        lineHeight: 1.6
                                                    }}
                                                >
                                                    {truncateDescription(achievement.description)}
                                                </Typography>

                                                {achievement.description?.length > 150 && (
                                                    <Button
                                                        size="small"
                                                        onClick={() => handleReadMore(achievement.description)}
                                                        sx={{
                                                            color: '#1976d2',
                                                            textTransform: 'none',
                                                            p: 0,
                                                            mt: 'auto',
                                                            '&:hover': {
                                                                backgroundColor: 'transparent',
                                                                textDecoration: 'underline'
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
                            ))}
                        </Grid>
                    </Fade>
                )}

                <Dialog
                    open={modalOpen}
                    onClose={() => setModalOpen(false)}
                    maxWidth="sm"
                    fullWidth
                >
                    <DialogTitle sx={{ color: '#1a237e', fontWeight: 'bold' }}>
                        Description
                    </DialogTitle>
                    <DialogContent>
                        <Typography variant="body1" sx={{ color: '#424242', mt: 1 }}>
                            {selectedDescription}
                        </Typography>
                    </DialogContent>
                    <DialogActions>
                        <Button
                            onClick={() => setModalOpen(false)}
                            sx={{ color: '#1976d2' }}
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
