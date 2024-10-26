import { Box, Typography } from '@mui/material';

export default function Legend() {
    return (
        <Box>
            <Box display='flex' gap={2} mb={2}>
                <Box display="flex" alignItems="center" mb={1}>
                    <Box width={15} height={15} bgcolor="green" mr={1} />
                    <Typography>Present</Typography>
                </Box>
                <Box display="flex" alignItems="center" mb={1}>
                    <Box width={15} height={15} bgcolor="red" mr={1} />
                    <Typography>Absent</Typography>
                </Box>
                <Box display="flex" alignItems="center" mb={1}>
                    <Box width={15} height={15} bgcolor="#b7a53a" mr={1} />
                    <Typography>Half</Typography>
                </Box>
                <Box display="flex" alignItems="center" mb={1}>
                    <Box width={15} height={15} bgcolor="yellow" mr={1} />
                    <Typography>Leave</Typography>
                </Box>
            </Box>
            <Box display='flex' gap={2}>
                <Box display="flex" alignItems="center" mb={1}>
                    <Box width={15} height={15} bgcolor="#110720" mr={1} />
                    <Typography>On Field</Typography>
                </Box>
                <Box display="flex" alignItems="center" mb={1}>
                    <Box width={15} height={15} bgcolor="rgb(247, 51, 120)" mr={1} />
                    <Typography>WFH</Typography>
                </Box>
                <Box display="flex" alignItems="center" mb={1}>
                    <Box width={15} height={15} bgcolor="purple" mr={1} />
                    <Typography>Sunday</Typography>
                </Box>
                <Box display="flex" alignItems="center" mb={1}>
                    <Box width={15} height={15} bgcolor="#8c57ff" mr={1} />
                    <Typography>Today</Typography>
                </Box>
            </Box>
        </Box>
    );
}
