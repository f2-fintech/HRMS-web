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
  Paper,
  Pagination,
  Box
} from '@mui/material';
import { styled } from '@mui/material/styles';
import type { AppDispatch, RootState } from "@/redux/store";
import { fetchHolidays } from '@/redux/features/holidays/holidaysSlice';

// Styled components
const GradientCard = styled(Card)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  background: 'linear-gradient(135deg, #6B8DD6 0%, #8E37D7 100%)',
  borderRadius: theme.spacing(4),
  boxShadow: '0 8px 32px rgba(31, 38, 135, 0.15)',
  backdropFilter: 'blur(10px)',
  border: '1px solid rgba(255, 255, 255, 0.18)',
  height: '700px', // Fixed height
}));

const CardContentWithFlex = styled(CardContent)(({ theme }) => ({
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  padding: theme.spacing(2),
}));

const ContentCard = styled(Card)(({ theme }) => ({
  background: 'rgba(255, 255, 255, 0.9)',
  borderRadius: theme.spacing(3),
  height: '500px',
  margin: theme.spacing(2),
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

const HeaderTypography = styled(Typography)(({ theme }) => ({
  color: '#fff',
  fontWeight: 700,
  textAlign: 'center',
  textShadow: '2px 2px 4px rgba(0, 0, 0, 0.2)',
  position: 'relative',
  '&::after': {
    content: '""',
    position: 'absolute',
    bottom: -10,
    left: '50%',
    transform: 'translateX(-50%)',
    width: '80px',
    height: '4px',
    background: '#fff',
    borderRadius: '2px',
  }
}));

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  fontWeight: 600,
  color: 'rgba(0, 0, 0, 0.8)',
  borderBottom: '1px solid rgba(0, 0, 0, 0.1)',
  padding: theme.spacing(2),
}));

const StyledTableRow = styled(TableRow)(({ theme }) => ({
  transition: 'all 0.3s ease',
  '&:hover': {
    backgroundColor: 'rgba(107, 141, 214, 0.1)',
    transform: 'scale(1.01)',
  },
}));

const StyledPagination = styled(Pagination)(({ theme }) => ({
  padding: theme.spacing(3),
  '& .MuiPaginationItem-root': {
    color: '#fff',
    '&.Mui-selected': {
      background: 'rgba(255, 255, 255, 0.2)',
      fontWeight: 'bold',
    },
    '&:hover': {
      background: 'rgba(255, 255, 255, 0.1)',
    },
  },
}));

const StyledChip = styled(Chip)(({ theme }) => ({
  fontWeight: 600,
  borderRadius: theme.spacing(2),
  padding: theme.spacing(0.5),
  background: 'linear-gradient(135deg, #6B8DD6 0%, #8E37D7 100%)',
  color: '#fff',
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
          <StyledPagination
            count={totalPages}
            page={page}
            onChange={handlePageChange}
            size="large"
            shape="rounded"
          />
        </Box>
      </CardContentWithFlex>
    </GradientCard>
  );
};

export default HolidaysTable;
