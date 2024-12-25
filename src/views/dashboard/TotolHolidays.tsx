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
  Pagination
} from '@mui/material';
import { styled } from '@mui/material/styles';
import type { AppDispatch, RootState } from "@/redux/store";
import { fetchHolidays } from '@/redux/features/holidays/holidaysSlice';

const StyledCard = styled(Card)(({ theme }) => ({
  background: 'linear-gradient(145deg,rgb(110, 160, 137) 0%, #e9edf3 100%)',
  borderRadius: theme.spacing(3),
  boxShadow: '0 15px 30px rgba(0,0,0,0.1)',
  overflow: 'hidden',
}));

const StyledTableContainer = styled(TableContainer)(({ theme }) => ({
  height: 468,
  borderRadius: theme.spacing(2),
  background: 'linear-gradient(145deg,rgb(127, 190, 161) 0%, #e9edf3 100%)',
  backdropFilter: 'blur(10px)',
  border: '1px solid rgba(255,255,255,0.2)',
  '&::-webkit-scrollbar': {
    width: '0.4em',
    height: '0.4em',
  },
  '&::-webkit-scrollbar-thumb': {
    backgroundColor: 'rgba(44, 60, 227, 0.3)',
    borderRadius: 4,
  },
}));

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  fontWeight: 'bold',
  color: 'rgba(0,0,0,0.7)',
  borderBottom: '1px solid rgba(0,0,0,0.1)',
}));

const StyledTableRow = styled(TableRow)(({ theme }) => ({
  transition: 'background-color 0.3s ease',
  '&:hover': {
    backgroundColor: 'rgba(24, 36, 162, 0.05)',
  },
}));

const GradientTypography = styled(Typography)(({ theme }) => ({
  background: 'linear-gradient(45deg, #2c3ce3 30%, #1a237e 90%)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
}));

const CustomPagination = styled(Pagination)(({ theme }) => ({
  '& .MuiPaginationItem-root': {
    borderRadius: theme.spacing(2),
    margin: theme.spacing(0, 1),
    transition: 'all 0.3s ease',
    '&.Mui-selected': {
      background: 'linear-gradient(45deg, #2c3ce3 30%, #1a237e 90%)',
      color: 'white',
    },
    '&:hover': {
      background: 'rgba(44, 60, 227, 0.1)',
    },
  },
}));

const HolidaysTable = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { holidays, total } = useSelector((state: RootState) => state.holidays);
  const [page, setPage] = useState(1);
  const limit = 5;

  const totalPages = Math.ceil(total / limit);

  useEffect(() => {
    dispatch(fetchHolidays({ page, limit, keyword: "" }));
  }, [dispatch, page]);

  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };

  const getChipColor = (title: string) => {
    switch (title.toLowerCase()) {
      case 'pending':
        return 'warning';
      case 'inactive':
        return 'error';
      default:
        return 'success';
    }
  };

  return (
    <StyledCard sx={{ height: '116vh' }}>
      <CardHeader
        sx={{
          paddingTop: '5vh',
          textAlign: 'center',
          '& .MuiCardHeader-title': {
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }
        }}
        title={
          <GradientTypography
            variant="h3"
            sx={{
              fontWeight: 600,
              position: 'relative',
              '&::after': {
                content: '""',
                position: 'absolute',
                bottom: -10,
                left: '50%',
                transform: 'translateX(-50%)',
                width: '100px',
                height: '4px',
                background: 'linear-gradient(45deg, #2c3ce3 30%, #1a237e 90%)',
                borderRadius: '2px',
              }
            }}
          >
            Holidays
          </GradientTypography>
        }
      />
      <CardContent sx={{ marginTop: '3vh' }}>
        <StyledTableContainer component={Paper} elevation={0}>
          <Table stickyHeader aria-label="holidays table">
            <TableHead>
              <TableRow sx={{ height: '12vh' }}>
                <StyledTableCell>Days</StyledTableCell>
                <StyledTableCell>Start Date</StyledTableCell>
                <StyledTableCell>End Date</StyledTableCell>
                <StyledTableCell>Title</StyledTableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {holidays.map((row, index) => (
                <StyledTableRow key={index} hover sx={{ height: '12.2vh' }}>
                  <TableCell>{row.day}</TableCell>
                  <TableCell>{row.start_date}</TableCell>
                  <TableCell>{row.end_date}</TableCell>
                  <TableCell>
                    <Chip
                      label={row.title}
                      // color={getChipColor(row.title)}
                      size="small"
                      variant="outlined"
                      sx={{
                        fontWeight: 'bold',
                        borderRadius: 2,
                        '& .MuiChip-label': {
                          padding: '0 10px',
                        }
                      }}
                    />
                  </TableCell>
                </StyledTableRow>
              ))}
            </TableBody>
          </Table>
        </StyledTableContainer>
        <CustomPagination
          count={totalPages}
          page={page}
          onChange={handlePageChange}
          color="primary"
          size="large"
          sx={{
            marginTop: 12,
            display: 'flex',
            justifyContent: 'center',
            position: 'relative',
            '.MuiPaginationItem-root': {
              fontSize: '1.5rem',
            },
            'li:first-of-type': {
              position: 'absolute',
              left: 0,
              top: '50%',
              transform: 'translateY(-50%)',
            },
            'li:last-of-type': {
              position: 'absolute',
              right: 0,
              top: '50%',
              transform: 'translateY(-50%)',
            },
          }}
        />
      </CardContent>
    </StyledCard>
  );
};

export default HolidaysTable;
