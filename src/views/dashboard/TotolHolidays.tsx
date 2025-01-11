import React, { useEffect, useState } from "react";

import { useDispatch, useSelector } from 'react-redux';
import {
  Card,
  CardHeader,
  CardContent,
  Typography,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Box,
  Pagination,
  useTheme
} from '@mui/material';
import { styled } from '@mui/material/styles';

import type { AppDispatch, RootState } from "@/redux/store";
import { fetchHolidays } from '@/redux/features/holidays/holidaysSlice';

// ... other styled components remain the same ...
const GradientCard = styled(Card)(() => ({
  display: 'flex',
  flexDirection: 'column',
  background: 'linear-gradient(135deg, #1a237e 0%, #3949ab 100%) !important',
  borderRadius: '32px',
  boxShadow: '0 8px 32px rgba(31, 38, 135, 0.15)',
  backdropFilter: 'blur(10px)',
  border: '1px solid rgba(255, 255, 255, 0.18)',
}));

// Modified HeaderTypography to shift title right
const HeaderTypography = styled(Typography)(() => ({
  color: '#fff !important',
  fontWeight: 700,
  textAlign: 'left',  // Changed from 'center' to 'left'
  paddingLeft: '100px',  // Added padding to shift right
  textShadow: '2px 2px 4px rgba(0, 0, 0, 0.2)',
  position: 'relative',
  '&::after': {
    content: '""',
    position: 'absolute',
    bottom: -10,
    left: '100px',  // Adjusted underline position to match text
    width: '80px',
    height: '4px',
    background: '#fff',
    borderRadius: '2px',
  }
}));

// ... rest of the styled components ...
const CardContentWithFlex = styled(CardContent)(({ theme }) => ({
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  padding: theme.spacing(2),
}));

const ContentCard = styled(Card)(() => ({
  background: 'rgba(255, 255, 255, 0.9) !important',
  borderRadius: '24px',
  margin: '16px',
  boxShadow: '0 8px 32px rgba(31, 38, 135, 0.1)',
}));

const StyledTableContainer = styled(TableContainer)(({ theme }) => ({
  flex: 1,
  borderRadius: theme.spacing(10),
  background: 'transparent',
  overflowY: 'auto',
  '&::-webkit-scrollbar': {
    width: '8px',
    height: '8px',
  },
  '&::-webkit-scrollbar-track': {
    background: 'rgba(0, 0, 0, 0.1)',
    borderRadius: '4px',
  },
  '&::-webkit-scrollbar-thumb': {
    background: 'linear-gradient(135deg, #6B8DD6 0%, #8E37D7 100%)',
    borderRadius: '4px',
  },
}));

const StyledTableCell = styled(TableCell)(() => ({
  fontWeight: 600,
  color: 'rgba(0, 0, 0, 0.8) !important',
  borderBottom: '1px solid rgba(0, 0, 0, 0.1)',
  padding: '16px',
  background: 'transparent !important',
}));

const StyledTableRow = styled(TableRow)(() => ({
  transition: 'all 0.3s ease',
  '&:hover': {
    backgroundColor: 'rgba(107, 141, 214, 0.1)',
    transform: 'scale(1.01)',
  },
}));

const StyledPagination = styled('div')(({ theme }) => ({
  padding: theme.spacing(3),
  '.MuiPagination-root': {
    '& .MuiPaginationItem-root': {
      color: '#fff !important',
      '&.Mui-selected': {
        background: 'rgba(255, 255, 255, 0.2) !important',
        fontWeight: 'bold',
      },
      '&:hover': {
        background: 'rgba(255, 255, 255, 0.1) !important',
      },
    },
  }
}));

const StyledChip = styled(Chip)(() => ({
  fontWeight: 600,
  borderRadius: '16px',
  padding: '4px',
  background: 'linear-gradient(135deg, #1a237e 0%, #3949ab 100%) !important',
  color: '#fff !important',
  border: 'none',
  '& .MuiChip-label': {
    padding: '0 16px',
  },
}));

const HolidaysTable = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { holidays, total } = useSelector((state: RootState) => state.holidays);
  const [page, setPage] = useState(1);
  const limit = 10;

  const totalPages = Math.ceil(total / limit);

  useEffect(() => {
    dispatch(fetchHolidays({ page, limit, keyword: "" }));
  }, [dispatch, page]);

  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };

  return (
    <GradientCard>
      <CardHeader
        sx={{ py: 4 }}
        title={
          <HeaderTypography variant="h4">
            Holiday Schedule
          </HeaderTypography>
        }
      />
      <CardContentWithFlex>
        <ContentCard>
          <StyledTableContainer>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <StyledTableCell>Days</StyledTableCell>
                  <StyledTableCell>Start Date</StyledTableCell>
                  <StyledTableCell>End Date</StyledTableCell>
                  <StyledTableCell>Title</StyledTableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {holidays.map((row, index) => (
                  <StyledTableRow key={index}>
                    <StyledTableCell>{row.day}</StyledTableCell>
                    <StyledTableCell>{row.start_date}</StyledTableCell>
                    <StyledTableCell>{row.end_date}</StyledTableCell>
                    <StyledTableCell>
                      <StyledChip
                        label={row.title}
                        size="medium"
                      />
                    </StyledTableCell>
                  </StyledTableRow>
                ))}
              </TableBody>
            </Table>
          </StyledTableContainer>
        </ContentCard>
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <StyledPagination>
            <Pagination
              count={totalPages}
              page={page}
              onChange={handlePageChange}
              size="large"
              shape="rounded"
            />
          </StyledPagination>
        </Box>
      </CardContentWithFlex>
    </GradientCard>
  );
};

export default HolidaysTable;
