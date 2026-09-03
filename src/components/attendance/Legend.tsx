import { Box, Typography, Paper, styled, Card, CardHeader, CardContent } from '@mui/material';

// Styled Components
const LegendContainer = styled(Paper)(({ theme }) => ({
    padding: theme.spacing(2),
    borderRadius: theme.shape.borderRadius,
    backgroundColor: theme.palette.background.default,
    border: `1px solid ${theme.palette.divider}`,
}));

const LegendGrid = styled(Box)(({ theme }) => ({
    display: 'grid',
    gridTemplateColumns: 'repeat(2 , 2fr)',
    gap: theme.spacing(2),
    width: '100%'
}));

const LegendItem = styled(Box)(({ theme }) => ({
    display: 'flex',
    alignItems: 'center',
    padding: theme.spacing(0.5),
    borderRadius: theme.shape.borderRadius,
    transition: 'background-color 0.2s ease',
    '&:hover': {
        backgroundColor: theme.palette.action.hover,
    }
}));

const ColorBox = styled(Box)<{ color: string }>(({ theme, color }) => ({
    width: 16,
    height: 16,
    borderRadius: 4,
    marginRight: theme.spacing(1),
    backgroundColor: color,
    border: `1px solid ${theme.palette.grey[300]}`,
    boxShadow: `0 2px 4px ${theme.palette.grey[200]}`
}));

interface LegendItemData {
    label: string;
    color: string;
}

const legendItems: LegendItemData[] = [
    { label: 'Present', color: 'green' },
    { label: 'Absent', color: 'red' },
    { label: 'Half', color: '#b7a53a' },
    { label: 'Leave', color: '#ef6c00' },
    { label: 'Festival Leave', color: '#e65100' },
    { label: 'On Field', color: '#110720' },
    { label: 'WFH', color: 'rgb(247, 51, 120)' },
    { label: 'Sunday', color: 'purple' },
    { label: 'Today', color: '#8c57ff' }
];

export default function Legend() {
    return (
        <Card elevation={3} sx={{ maxWidth: 800, mx: 'auto', my: 2 }}>
            <CardHeader
                title="Legends"
                sx={{
                    color: 'white',
                    '& .MuiCardHeader-title': {
                        fontSize: '1.25rem',
                        fontWeight: 600
                    }
                }}
            />
            <CardContent>
                <LegendContainer elevation={0}>
                    <Typography
                        variant="subtitle2"
                        sx={{
                            mb: 2,
                            fontWeight: 600,
                            color: 'text.secondary'
                        }}
                    >
                        Attendance Legend
                    </Typography>
                    <LegendGrid>
                        {legendItems.map((item) => (
                            <LegendItem key={item.label}>
                                <ColorBox color={item.color} />
                                <Typography
                                    variant="body2"
                                    sx={{
                                        fontWeight: 500,
                                        color: 'text.primary',
                                        whiteSpace: 'nowrap'
                                    }}
                                >
                                    {item.label}
                                </Typography>
                            </LegendItem>
                        ))}
                    </LegendGrid>
                </LegendContainer>
            </CardContent>
        </Card>
    );
}
