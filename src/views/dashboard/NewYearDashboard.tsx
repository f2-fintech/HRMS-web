import React, { useState, useEffect } from 'react';
import {
    Card,
    CardContent,
    Typography,
    Box,
    createTheme,
    ThemeProvider
} from '@mui/material';
import { Celebration, AutoAwesome, Star } from '@mui/icons-material';

const darkTheme = createTheme({
    palette: {
        mode: 'dark',
        background: {
            paper: 'rgba(38, 38, 38, 0.5)',
        },
    },
});

const Balloon = ({ color, delay, size = 'medium' }) => {
    const sizes = {
        small: { width: '20px', height: '28px', stringHeight: '20px' },
        medium: { width: '24px', height: '32px', stringHeight: '24px' },
        large: { width: '32px', height: '40px', stringHeight: '32px' }
    };

    return (
        <Box
            sx={{
                position: 'absolute',
                width: sizes[size].width,
                height: sizes[size].height,
                borderRadius: '50%',
                background: `linear-gradient(135deg, ${color} 60%, rgba(255,255,255,0.3) 100%)`,
                animation: 'float 8s linear infinite',
                animationDelay: `${delay}s`,
                left: `${Math.random() * 90}%`,
                bottom: '-20px',
                '&::after': {
                    content: '""',
                    position: 'absolute',
                    width: '2px',
                    height: sizes[size].stringHeight,
                    background: 'linear-gradient(180deg, #999 0%, #fff 100%)',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    top: sizes[size].height,
                },
                '&::before': {
                    content: '""',
                    position: 'absolute',
                    width: '100%',
                    height: '100%',
                    borderRadius: '50%',
                    background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.4) 0%, transparent 40%)',
                    top: 0,
                    left: 0,
                }
            }}
        />
    );
};

const TwinkleStar = ({ delay }) => (
    <Box
        sx={{
            position: 'absolute',
            width: '4px',
            height: '4px',
            background: '#fff',
            borderRadius: '50%',
            animation: 'twinkle 1.5s infinite',
            animationDelay: `${delay}s`,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
        }}
    />
);

const NewYearWidget = () => {
    const [countdown, setCountdown] = useState({
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0
    });

    useEffect(() => {
        const timer = setInterval(() => {
            const now = new Date();
            const newYear = new Date(now.getFullYear() + 1, 0, 1);
            const diff = newYear - now;

            setCountdown({
                days: Math.floor(diff / (1000 * 60 * 60 * 24)),
                hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
                minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
                seconds: Math.floor((diff % (1000 * 60)) / 1000)
            });
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    const balloonColors = [
        '#ef4444', '#3b82f6', '#22c55e', '#eab308', '#a855f7', '#ec4899',
        '#f97316', '#06b6d4', '#14b8a6', '#f59e0b', '#8b5cf6', '#db2777'
    ];

    return (
        <ThemeProvider theme={darkTheme}>
            <Card
                sx={{
                    width: '100%',
                    position: 'relative',
                    overflow: 'hidden',
                    background: 'linear-gradient(135deg,rgb(34, 19, 98) 0%, #e5ebee 100%)',
                    backdropFilter: 'blur(10px)',
                    // border: '1px solid rgba(104, 132, 171, 0.3)',
                    borderRadius: '1rem',
                    height: '300px',
                    boxShadow: '0 0 20px rgba(0,0,0,0.3)',
                }}
            >
                <CardContent>
                    <Box sx={{ textAlign: 'center', mb: 2 }}>
                        <Typography
                            variant="h4"
                            component="h2"
                            className="animate-title"
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 1,
                                color: 'white',
                                fontWeight: 'bold',
                                textShadow: '0 0 10px rgba(255,255,255,0.5)',
                                animation: 'colorChange 5s infinite'
                            }}
                        >
                            <Celebration sx={{ color: '#fbbf24', animation: 'spin 2s infinite' }} />
                            Happy New Year 2025!
                            <Celebration sx={{ color: '#fbbf24', animation: 'spin 2s infinite' }} />
                        </Typography>
                    </Box>

                    <Box sx={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(4, 1fr)',
                        gap: 1,
                        my: 3
                    }}>
                        {Object.entries(countdown).map(([unit, value]) => (
                            <Box
                                key={unit}
                                sx={{
                                    textAlign: 'center',
                                    padding: 1,
                                    backgroundColor: 'rgba(55, 65, 81, 0.7)',
                                    borderRadius: 1,
                                    backdropFilter: 'blur(5px)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    animation: 'pulse 2s infinite',
                                }}
                            >
                                <Typography variant="h5" sx={{ color: 'white', fontWeight: 'bold' }}>
                                    {value}
                                </Typography>
                                <Typography variant="caption" sx={{ color: 'grey.400', textTransform: 'capitalize' }}>
                                    {unit}
                                </Typography>
                            </Box>
                        ))}
                    </Box>

                    <Typography variant="h6" sx={{
                        textAlign: 'center',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 1,
                        mt: 2,
                        animation: 'fadeInOut 2s infinite'
                    }}>
                        <AutoAwesome sx={{ color: '#fbbf24' }} />
                        Celebrate the New Beginning!
                        <AutoAwesome sx={{ color: '#fbbf24' }} />
                    </Typography>
                </CardContent>

                {/* More varied balloons with different sizes */}
                {balloonColors.map((color, index) => (
                    <Balloon
                        key={index}
                        color={color}
                        delay={index * 0.3}
                        size={index % 3 === 0 ? 'large' : index % 2 === 0 ? 'medium' : 'small'}
                    />
                ))}

                {/* Add twinkling stars */}
                {[...Array(15)].map((_, i) => (
                    <TwinkleStar key={i} delay={i * 0.2} />
                ))}

                <style jsx global>{`
          @keyframes float {
            0% {
              transform: translateY(100vh) rotate(0deg);
              opacity: 1;
            }
            100% {
              transform: translateY(-100vh) rotate(20deg);
              opacity: 0;
            }
          }

          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }

          @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.05); }
            100% { transform: scale(1); }
          }

          @keyframes colorChange {
            0% { color: #fff; }
            25% { color: #fbbf24; }
            50% { color: #f87171; }
            75% { color: #818cf8; }
            100% { color: #fff; }
          }

          @keyframes fadeInOut {
            0% { opacity: 0.6; }
            50% { opacity: 1; }
            100% { opacity: 0.6; }
          }

          @keyframes twinkle {
            0% { opacity: 0.3; }
            50% { opacity: 1; }
            100% { opacity: 0.3; }
          }

          .animate-title {
            animation: bounce 1s infinite;
          }

          @keyframes bounce {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-10px); }
          }
        `}</style>
            </Card>
        </ThemeProvider>
    );
};

export default NewYearWidget;
