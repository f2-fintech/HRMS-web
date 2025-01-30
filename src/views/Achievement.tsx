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
    useTheme,
    alpha
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AchievementForm from '@/components/acheivement/AchievementForm';

const API_URL = process.env.NEXT_PUBLIC_APP_URL + '/achievements';
const DUMMY_IMAGE = 'https://savviest-blog-assets.storage.googleapis.com/2020/02/achievements--1-.png';

// Custom blue theme colors
const blueTheme = {
    primary: '#1976d2',
    light: '#42a5f5',
    dark: '#1565c0',
    gradient: 'linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)',
    hover: '#bbdefb'
};

const Achievement = () => {
    const theme = useTheme();
    const [achievements, setAchievements] = useState([]);
    const [loading, setLoading] = useState(false);
    const [editId, setEditId] = useState(null);

    useEffect(() => {
        fetchAchievements();
    }, []);

    const fetchAchievements = async () => {
        setLoading(true);
        try {
            const response = await fetch(API_URL);
            const data = await response.json();
            setAchievements(data);
        } catch (error) {
            console.error('Error fetching achievements:', error);
        }
        setLoading(false);
    };

    const handleDelete = async (id) => {
        if (confirm('Are you sure you want to delete this achievement?')) {
            try {
                const response = await fetch(`${API_URL}/delete/${id}`, { method: 'DELETE' });
                if (response.ok) fetchAchievements();
            } catch (error) {
                console.error('Error deleting achievement:', error);
            }
        }
    };

    return (
        <Container maxWidth="lg">
            <Box>
                <Typography
                    variant="h3"
                    fontWeight="bold"
                    textAlign="center"
                    mb={5}
                    sx={{
                        color: blueTheme.dark,
                        position: 'relative',
                        '&:after': {
                            content: '""',
                            position: 'absolute',
                            bottom: -8,
                            left: '50%',
                            transform: 'translateX(-50%)',
                            width: 60,
                            height: 4,
                            background: blueTheme.gradient,
                            borderRadius: 2
                        }
                    }}
                >
                    Achievements
                </Typography>

                {editId !== null && (
                    <Box sx={{
                        mb: 4,
                        p: 3,
                        backgroundColor: alpha(blueTheme.light, 0.1),
                        borderRadius: 2
                    }}>
                        <AchievementForm
                            id={editId}
                            onSuccess={() => {
                                setEditId(null);
                                fetchAchievements();
                            }}
                        />
                    </Box>
                )}

                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                        <CircularProgress
                            size={60}
                            thickness={4}
                            sx={{ color: blueTheme.primary }}
                        />
                    </Box>
                ) : (
                    <Fade in={!loading}>
                        <Grid container spacing={4} justifyContent="center">
                            {achievements.length > 0 ? (
                                achievements.map((achievement) => (
                                    <Grid item xs={12} sm={6} md={4} key={achievement._id}>
                                        <Card
                                            sx={{
                                                height: '100%',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                transition: 'all 0.3s ease-in-out',
                                                borderRadius: 2,
                                                overflow: 'hidden',
                                                border: `1px solid ${alpha(blueTheme.primary, 0.1)}`,
                                                backgroundColor: '#fff',
                                                '&:hover': {
                                                    transform: 'translateY(-4px)',
                                                    boxShadow: `0 8px 24px ${alpha(blueTheme.primary, 0.2)}`,
                                                    borderColor: alpha(blueTheme.primary, 0.3),
                                                    '& .media-container': {
                                                        '&:after': {
                                                            opacity: 1
                                                        }
                                                    }
                                                }
                                            }}
                                        >
                                            <Box
                                                className="media-container"
                                                sx={{
                                                    position: 'relative',
                                                    paddingTop: '56.25%',
                                                    overflow: 'hidden',
                                                    '&:after': {
                                                        content: '""',
                                                        position: 'absolute',
                                                        top: 0,
                                                        left: 0,
                                                        width: '100%',
                                                        height: '100%',
                                                        background: `linear-gradient(0deg, ${alpha(blueTheme.primary, 0.1)} 0%, transparent 100%)`,
                                                        opacity: 0,
                                                        transition: 'opacity 0.3s ease-in-out'
                                                    }
                                                }}
                                            >
                                                {achievement.fileUrl ? (
                                                    achievement.fileUrl.match(/\.(jpeg|jpg|png|gif)$/) ? (
                                                        <img
                                                            src={achievement.fileUrl}
                                                            alt={achievement.title || 'Achievement'}
                                                            style={{
                                                                position: 'absolute',
                                                                top: 0,
                                                                left: 0,
                                                                width: '100%',
                                                                height: '100%',
                                                                objectFit: 'cover'
                                                            }}
                                                        />
                                                    ) : achievement.fileUrl.match(/\.(mp4|mov|avi|webm)$/) ? (
                                                        <video
                                                            controls
                                                            style={{
                                                                position: 'absolute',
                                                                top: 0,
                                                                left: 0,
                                                                width: '100%',
                                                                height: '100%',
                                                                objectFit: 'cover'
                                                            }}
                                                        >
                                                            <source src={achievement.fileUrl} type="video/mp4" />
                                                            Your browser does not support the video tag.
                                                        </video>
                                                    ) : (
                                                        <img
                                                            src={DUMMY_IMAGE}
                                                            alt="Default Achievement"
                                                            style={{
                                                                position: 'absolute',
                                                                top: 0,
                                                                left: 0,
                                                                width: '100%',
                                                                height: '100%',
                                                                objectFit: 'cover'
                                                            }}
                                                        />
                                                    )
                                                ) : (
                                                    <img
                                                        src={DUMMY_IMAGE}
                                                        alt="Default Achievement"
                                                        style={{
                                                            position: 'absolute',
                                                            top: 0,
                                                            left: 0,
                                                            width: '100%',
                                                            height: '100%',
                                                            objectFit: 'cover'
                                                        }}
                                                    />
                                                )}
                                            </Box>

                                            <CardContent sx={{
                                                flexGrow: 1,
                                                p: 3,
                                                backgroundColor: '#fff'
                                            }}>
                                                <Typography
                                                    variant="h6"
                                                    fontWeight="bold"
                                                    gutterBottom
                                                    sx={{ color: blueTheme.dark }}
                                                >
                                                    {achievement.title || 'N/A'}
                                                </Typography>
                                                <Typography
                                                    variant="body2"
                                                    sx={{
                                                        color: alpha(blueTheme.dark, 0.7),
                                                        lineHeight: 1.6
                                                    }}
                                                >
                                                    {achievement.description || 'N/A'}
                                                </Typography>
                                            </CardContent>

                                            <CardActions sx={{
                                                justifyContent: 'flex-end',
                                                p: 2,
                                                borderTop: `1px solid ${alpha(blueTheme.primary, 0.1)}`,
                                                backgroundColor: alpha(blueTheme.light, 0.02)
                                            }}>
                                                <IconButton
                                                    onClick={() => setEditId(achievement._id || '')}
                                                    sx={{
                                                        color: blueTheme.primary,
                                                        '&:hover': {
                                                            backgroundColor: alpha(blueTheme.primary, 0.1)
                                                        }
                                                    }}
                                                >
                                                    <EditIcon />
                                                </IconButton>
                                                <IconButton
                                                    onClick={() => handleDelete(achievement._id)}
                                                    sx={{
                                                        color: theme.palette.error.main,
                                                        '&:hover': {
                                                            backgroundColor: alpha(theme.palette.error.main, 0.1)
                                                        }
                                                    }}
                                                >
                                                    <DeleteIcon />
                                                </IconButton>
                                            </CardActions>
                                        </Card>
                                    </Grid>
                                ))
                            ) : (
                                <Grid item xs={12} sm={6} md={4}>
                                    <Card sx={{
                                        height: '100%',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        borderRadius: 2,
                                        border: `1px solid ${alpha(blueTheme.primary, 0.1)}`,
                                        backgroundColor: '#fff'
                                    }}>
                                        <img
                                            src={DUMMY_IMAGE}
                                            alt="No Achievement Found"
                                            style={{
                                                width: '100%',
                                                height: 200,
                                                objectFit: 'cover'
                                            }}
                                        />
                                        <CardContent sx={{
                                            flexGrow: 1,
                                            p: 3,
                                            backgroundColor: '#fff'
                                        }}>
                                            <Typography
                                                variant="h6"
                                                fontWeight="bold"
                                                gutterBottom
                                                sx={{ color: blueTheme.dark }}
                                            >
                                                N/A
                                            </Typography>
                                            <Typography
                                                variant="body2"
                                                sx={{ color: alpha(blueTheme.dark, 0.7) }}
                                            >
                                                N/A
                                            </Typography>
                                        </CardContent>
                                        <CardActions sx={{
                                            justifyContent: 'flex-end',
                                            p: 2,
                                            borderTop: `1px solid ${alpha(blueTheme.primary, 0.1)}`,
                                            backgroundColor: alpha(blueTheme.light, 0.02)
                                        }}>
                                            <IconButton
                                                onClick={() => setEditId('')}
                                                sx={{
                                                    color: blueTheme.primary,
                                                    '&:hover': {
                                                        backgroundColor: alpha(blueTheme.primary, 0.1)
                                                    }
                                                }}
                                            >
                                                <EditIcon />
                                            </IconButton>
                                            <IconButton
                                                disabled
                                                sx={{ color: theme.palette.error.main }}
                                            >
                                                <DeleteIcon />
                                            </IconButton>
                                        </CardActions>
                                    </Card>
                                </Grid>
                            )}
                        </Grid>
                    </Fade>
                )}
            </Box>
        </Container>
    );
};

export default Achievement;
