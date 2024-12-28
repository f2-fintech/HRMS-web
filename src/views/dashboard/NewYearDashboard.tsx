import React, { useState, useEffect } from 'react';
import {
    Card,
    CardContent,
    Typography,
    Box,
    createTheme,
    ThemeProvider
} from '@mui/material';
import {
    Celebration,
    AutoAwesome,
    Star,
    LocalFireDepartment,
    Whatshot
} from '@mui/icons-material';

const darkTheme = createTheme({
    palette: {
        mode: 'dark',
        background: {
            paper: 'rgba(18, 18, 18, 0.95)',
        },
    },
});

// Existing Balloon component remains unchanged
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
                    background: 'linear-gradient(180deg, #666 0%, #999 100%)',
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
            animation: 'twinkle 1.5s infinite',
            animationDelay: `${delay}s`,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
        }}
    >
        <Star sx={{
            fontSize: '16px',
            color: '#ffd700',
            filter: 'drop-shadow(0 0 3px rgba(255,215,0,0.7))'
        }} />
    </Box>
);

const Firework = ({ delay }) => (
    <Box
        sx={{
            position: 'absolute',
            animation: 'firework 2s infinite',
            animationDelay: `${delay}s`,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 50}%`,
        }}
    >
        <Whatshot sx={{
            fontSize: '24px',
            color: '#ff6b6b',
            filter: 'drop-shadow(0 0 4px rgba(255,107,107,0.8))'
        }} />
    </Box>
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
        '#ff6b6b', '#4dabf7', '#51cf66', '#ffd43b', '#be4bdb', '#ff8787',
        '#ff922b', '#15aabf', '#20c997', '#fcc419', '#845ef7', '#ff6b6b'
    ];

    return (
        <ThemeProvider theme={darkTheme}>
            <Card
                sx={{
                    width: '100%',
                    position: 'relative',
                    overflow: 'hidden',
                    background: 'linear-gradient(135deg, rgb(17, 10, 49) 0%, rgb(60, 52, 52) 100%)',
                    backdropFilter: 'blur(10px)',
                    borderRadius: '1rem',
                    height: '300px',
                    boxShadow: '0 0 30px rgba(0,0,0,0.5)',
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
                                textShadow: '0 0 15px rgba(255,255,255,0.3)',
                                animation: 'colorChange 5s infinite'
                            }}
                        >
                            <LocalFireDepartment sx={{ color: '#ff6b6b', animation: 'spin 2s infinite' }} />
                            Happy New Year 2025!
                            <LocalFireDepartment sx={{ color: '#ff6b6b', animation: 'spin 2s infinite' }} />
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
                                    backgroundColor: 'rgba(25, 25, 25, 0.8)',
                                    borderRadius: 1,
                                    backdropFilter: 'blur(5px)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    animation: 'pulse 2s infinite',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
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
                        <Star sx={{ color: '#ffd700' }} />
                        One of the best marketplaces for the Paper Industry
                        <Star sx={{ color: '#ffd700' }} />
                    </Typography>
                </CardContent>

                {balloonColors.map((color, index) => (
                    <Balloon
                        key={index}
                        color={color}
                        delay={index * 0.3}
                        size={index % 3 === 0 ? 'large' : index % 2 === 0 ? 'medium' : 'small'}
                    />
                ))}

                {[...Array(15)].map((_, i) => (
                    <TwinkleStar key={i} delay={i * 0.2} />
                ))}

                {[...Array(8)].map((_, i) => (
                    <Firework key={i} delay={i * 0.4} />
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
                        25% { color: #ffd43b; }
                        50% { color: #ff6b6b; }
                        75% { color: #748ffc; }
                        100% { color: #fff; }
                    }

                    @keyframes fadeInOut {
                        0% { opacity: 0.6; }
                        50% { opacity: 1; }
                        100% { opacity: 0.6; }
                    }

                    @keyframes twinkle {
                        0% { opacity: 0.3; transform: scale(0.8); }
                        50% { opacity: 1; transform: scale(1.1); }
                        100% { opacity: 0.3; transform: scale(0.8); }
                    }

                    @keyframes firework {
                        0% { transform: translateY(0) scale(1); opacity: 1; }
                        50% { transform: translateY(-20px) scale(1.2); opacity: 0.7; }
                        100% { transform: translateY(-40px) scale(1); opacity: 0; }
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
