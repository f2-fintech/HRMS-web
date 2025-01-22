import {
    Card,
    CardContent,
    Typography,
    Box
} from "@mui/material";
import {
    LocalFireDepartment,
    EmojiPeople,
    WorkspacePremium,
    Restaurant,
    Psychology,
    Diversity3
} from "@mui/icons-material";


const NewYearWidget = ({ companyDetails, loading }: { companyDetails: any; loading: boolean }) => {

    const celebrations = [
        {
            icon: <EmojiPeople sx={{ color: '#ffd700' }} />,
            value: 'Team Spirit',
            label: 'Celebrate Together',
            animation: 'bounce'
        },
        {
            icon: <Diversity3 sx={{ color: '#ff6b6b' }} />,
            value: 'Connections',
            label: 'Build Bonds',
            animation: 'bounce'
        },
        {
            icon: <Restaurant sx={{ color: '#4dabf7' }} />,
            value: 'Refreshments',
            label: 'Enjoy Together',
            animation: 'bounce'
        },
        {
            icon: <Psychology sx={{ color: '#51cf66' }} />,
            value: 'Growth',
            label: 'Achieve More',
            animation: 'bounce'
        }
    ];
    return (
        <Card
            sx={{
                width: "100%",
                position: "relative",
                overflow: "hidden",
                background: "linear-gradient(135deg, rgb(17, 10, 49) 0%, rgb(60, 52, 52) 100%)",
                borderRadius: "16px",
                minHeight: "300px",
                boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
            }}
        >
            <CardContent>
                <Box sx={{ textAlign: "center", mb: 2 }}>
                    <Typography
                        variant="h4"
                        component="h2"
                        sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 2,
                            color: "white",
                            fontWeight: "bold",
                            textShadow: "0 2px 4px rgba(0,0,0,0.2)",
                            animation: "colorChange 5s infinite",
                            fontSize: {
                                xs: "1.5rem",
                                sm: "2rem",
                                md: "2.125rem",
                            },
                            flexWrap: "wrap",
                        }}
                    >
                        <LocalFireDepartment sx={{ color: "#ff6b6b", animation: "spin 2s infinite" }} />
                        🎉 Welcome 2025 Team! 🎊
                        <LocalFireDepartment sx={{ color: "#ff6b6b", animation: "spin 2s infinite" }} />
                    </Typography>
                </Box>

                <Box
                    sx={{
                        display: "grid",
                        gridTemplateColumns: {
                            xs: "repeat(1, 1fr)",
                            sm: "repeat(2, 1fr)",
                            md: "repeat(4, 1fr)",
                        },
                        gap: 2,
                        my: 3,
                    }}
                >
                    {celebrations.map(({ icon, value, label, animation }, index) => (
                        <Box
                            key={index}
                            sx={{
                                textAlign: "center",
                                padding: 2,
                                backgroundColor: "rgba(25, 25, 25, 0.8)",
                                borderRadius: "12px",
                                backdropFilter: "blur(5px)",
                                border: "1px solid rgba(255,255,255,0.1)",
                                animation: `${animation} 2s infinite`,
                                animationDelay: `${index * 0.2}s`,
                                transition: "all 0.3s ease",
                                "&:hover": {
                                    transform: "translateY(-5px)",
                                    backgroundColor: "rgba(255, 255, 255, 0.1)",
                                },
                            }}
                        >
                            <Box
                                sx={{
                                    mb: 1,
                                    fontSize: "2rem",
                                    animation: `${animation} 2s infinite`,
                                }}
                            >
                                {icon}
                            </Box>
                            <Typography
                                variant="h6"
                                sx={{
                                    color: "white",
                                    fontWeight: "bold",
                                    animation: "colorChange 4s infinite",
                                    animationDelay: `${index * 0.2}s`,
                                    fontSize: {
                                        xs: "1.125rem",
                                        sm: "1.25rem",
                                    },
                                }}
                            >
                                {value}
                            </Typography>
                            <Typography
                                variant="body2"
                                sx={{
                                    color: "rgba(255,255,255,0.7)",
                                }}
                            >
                                {label}
                            </Typography>
                        </Box>
                    ))}
                </Box>

                <Typography
                    variant="h6"
                    sx={{
                        textAlign: "center",
                        color: "white",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 1,
                        mt: 2,
                        animation: "fadeInOut 2s infinite",
                        fontSize: {
                            xs: "0.875rem",
                            sm: "1rem",
                            md: "1.25rem",
                        },
                        flexWrap: "wrap",
                        px: { xs: 1, sm: 2 },
                    }}
                >
                    <WorkspacePremium sx={{ color: "#ffd700" }} />
                    {loading ? (
                        "Loading company name..."
                    ) : (
                        <>
                            We Grow,{" "}
                            <span style={{ color: "yellow", fontWeight: "bold" }}>
                                {companyDetails?.name || "Your Company"}
                            </span>{" "}
                            Thrives – Together, We'll Make This Year Extraordinary!
                        </>
                    )}
                    <WorkspacePremium sx={{ color: "#ffd700" }} />
                </Typography>
            </CardContent>

            <style jsx global>{`
                @keyframes bounce {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-10px); }
                }

                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }

                @keyframes pulse {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.05); }
                }

                @keyframes rotate {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }

                @keyframes scale {
                    0% { transform: scale(1); }
                    50% { transform: scale(1.2); }
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
            `}</style>
        </Card>
    );
};

export default NewYearWidget;
