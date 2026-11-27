import React, { useEffect } from "react";
import { useDispatch, useSelector } from 'react-redux';
import {
  Card,
  Typography,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Box,
} from '@mui/material';
import { styled, keyframes } from '@mui/material/styles';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import BeachAccessIcon from '@mui/icons-material/BeachAccess';

import type { AppDispatch, RootState } from "@/redux/store";
import { fetchHolidays } from '@/redux/features/holidays/holidaysSlice';

// ─── Animations ───────────────────────────────────────────────────────────────

const fadeInUp = keyframes`
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
`;

// ─── Styled Components ───────────────────────────────────────────────────────

const PremiumCard = styled(Card)(({ theme }) => ({
  borderRadius: '20px',
  background: '#ffffff',
  boxShadow: '0 20px 45px -12px rgba(20, 25, 70, 0.25)',
  border: '1px solid rgba(20, 25, 70, 0.06)',
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column',
  position: 'relative',
}));

// Dark navy banner with a diagonal lighter-blue cut, matching the achiever cards
const HeaderBanner = styled(Box)({
  position: 'relative',
  background:
    'linear-gradient(135deg, #1a237e 60%, #4957e2 40%)',
  padding: '22px 24px 20px',
  overflow: 'hidden',
  // '&::before': {
  //   content: '""',
  //   position: 'absolute',
  //   top: 0,
  //   right: 0,
  //   width: '55%',
  //   height: '100%',
  //   background:
  //                       'linear-gradient(135deg, #1a237e 60%, #4957e2 40%)',
  //   clipPath: 'polygon(35% 0, 100% 0, 100% 100%, 65% 100%)',
  // },
});

const HeaderTopRow = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  position: 'relative',
  zIndex: 1,
});

// const AlertBox = styled(Box)({
//   display: 'flex',
//   alignItems: 'flex-start',
//   gap: '14px',
//   padding: '16px 18px',
//   borderRadius: '14px',
//   background: 'linear-gradient(135deg, #eef1ff 0%, #f5f6ff 100%)',
//   border: '1px solid #dde2fb',
// });

const AlertIconBadge = styled(Box)({
  width: '30px',
  height: '30px',
  borderRadius: '10px',
  background: '#ffffff',
  border: '1px solid #dde2fb',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
  boxShadow: '0 2px 6px rgba(77, 99, 240, 0.12)',
});
const IconWrapper = styled(Box)({
  width: '44px',
  height: '44px',
  borderRadius: '12px',
  background: 'rgba(255,255,255,0.12)',
  border: '1px solid rgba(255,255,255,0.18)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
});

const CountBadge = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  padding: '6px 14px',
  borderRadius: '999px',
  background: 'rgba(255,255,255,0.12)',
  border: '1px solid rgba(255,255,255,0.2)',
  fontSize: '12px',
  fontWeight: 700,
  color: '#ffffff',
});

const Title = styled(Typography)({
  fontSize: '1.5rem',
  fontWeight: 800,
  color: '#ffffff',
  marginTop: '14px',
  letterSpacing: '0.2px',
  position: 'relative',
  zIndex: 1,
});

const Subtitle = styled(Typography)({
  fontSize: '12.5px',
  color: 'rgba(255,255,255,0.65)',
  marginTop: '2px',
  fontWeight: 500,
  position: 'relative',
  zIndex: 1,
});

const BodyArea = styled(Box)({
  padding: '20px 24px 4px',
  background: '#ffffff',
});

const AlertBox = styled(Box)({
  display: 'flex',
  alignItems: 'flex-start',
  gap: '12px',
  padding: '14px 16px',
  borderRadius: '14px',
  background: '#eef1ff',
  border: '1px solid #dde2fb',
});

const StyledTableContainer = styled(TableContainer)({
  maxHeight: '380px',
  background: '#ffffff',
  marginTop: '18px',
  '&::-webkit-scrollbar': {
    width: '6px',
    height: '6px',
  },
  '&::-webkit-scrollbar-track': {
    background: 'transparent',
  },
  '&::-webkit-scrollbar-thumb': {
    background: '#c7cbf5',
    borderRadius: '10px',
  },
});

const StyledTableCell = styled(TableCell)({
  padding: '15px 24px',
  fontSize: '13px',
  borderBottom: '1px solid #eef0fa',
  color: '#1e2451',
});

const StyledTableHeadCell = styled(StyledTableCell)({
  fontWeight: 700,
  textTransform: 'uppercase',
  fontSize: '11px',
  letterSpacing: '1.2px',
  color: '#6b7099',
  background: '#f7f8fd',
  borderBottom: '1px solid #eaecf9',
});

const StyledTableRow = styled(TableRow)({
  transition: 'all 0.2s ease-in-out',
  animation: `${fadeInUp} 0.4s ease-out backwards`,
  '&:hover': {
    backgroundColor: '#f7f8fd',
  },
});

const TitleChip = styled(Chip)({
  fontWeight: 600,
  borderRadius: '8px',
  height: '28px',
  fontSize: '11.5px',
  background: '#eef1ff',
  color: '#3b45c7',
  border: '1px solid #dde2fb',
  letterSpacing: '0.2px',
});

const DayBadge = styled(Box)({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minWidth: '28px',
  height: '28px',
  padding: '0 8px',
  borderRadius: '8px',
  background: '#141a3d',
  color: '#ffffff',
  fontWeight: 700,
  fontSize: '12px',
});

// ─── Component ───────────────────────────────────────────────────────────────

const HolidaysTable = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { holidays } = useSelector((state: RootState) => state.holidays);

  useEffect(() => {
    dispatch(fetchHolidays({ page: 1, limit: 100, keyword: "" }));
  }, [dispatch]);

  return (
    <PremiumCard>
      <HeaderBanner>
        <HeaderTopRow>
          <IconWrapper>
            <BeachAccessIcon sx={{ color: '#ffffff', fontSize: 22 }} />
          </IconWrapper>
          <CountBadge>
            <CalendarMonthIcon sx={{ fontSize: 14 }} />
            {holidays?.length || 0} total
          </CountBadge>
        </HeaderTopRow>
        <Title>Holiday Schedule</Title>
        <Subtitle>Company-wide holiday calendar for the year</Subtitle>
      </HeaderBanner>

      <BodyArea>
        <AlertBox>
          <AlertIconBadge>
            <InfoOutlinedIcon sx={{ color: '#4d63f0', fontSize: 17 }} />
          </AlertIconBadge>
          <Typography sx={{ fontSize: '11.5px', color: '#3a4066', fontWeight: 500, lineHeight: 1.7 }}>
            Out of these 12 holidays, employees can take only{' '}
            <strong style={{ color: '#141a3d', fontWeight: 700 }}>6 holidays</strong>.<br />
            At least{' '}
            <strong style={{ color: '#141a3d', fontWeight: 700 }}>6 months of employment</strong> is necessary to become eligible.
          </Typography>
        </AlertBox>
      </BodyArea>

      <StyledTableContainer>
        <Table stickyHeader size="small" sx={{ borderCollapse: 'collapse' }}>
          <TableHead>
            <TableRow>
              <StyledTableHeadCell>S.No.</StyledTableHeadCell>
              <StyledTableHeadCell>Title</StyledTableHeadCell>
              <StyledTableHeadCell>Days</StyledTableHeadCell>
              <StyledTableHeadCell>Start Date</StyledTableHeadCell>
              <StyledTableHeadCell>End Date</StyledTableHeadCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {holidays?.map((row, index) => (
              <StyledTableRow key={index} style={{ animationDelay: `${index * 40}ms` }}>
                <StyledTableCell sx={{ fontWeight: 700, color: '#9297b8', fontSize: '13px' }}>
                  {(index + 1).toString().padStart(2, '0')}
                </StyledTableCell>
                <StyledTableCell>
                  <TitleChip label={row.title} />
                </StyledTableCell>
                <StyledTableCell>
                  <DayBadge>{row.day}</DayBadge>
                </StyledTableCell>
                <StyledTableCell>{row.start_date}</StyledTableCell>
                <StyledTableCell>{row.end_date}</StyledTableCell>
              </StyledTableRow>
            ))}
            {!holidays?.length && (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 8, border: 'none' }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5 }}>
                    <EventAvailableIcon sx={{ fontSize: 40, color: '#d1d4ee' }} />
                    <Typography sx={{ color: '#9297b8', fontSize: '13px' }}>
                      No holidays found
                    </Typography>
                  </Box>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </StyledTableContainer>
    </PremiumCard>
  );
};

export default HolidaysTable;
