'use client';

import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Paper,
  Avatar,
  Tab,
  Tabs,
  CircularProgress,
  useTheme,
  Chip,
  Select,
  MenuItem as MUIMenuItem,
  FormControl,
  InputLabel,
  Button
} from '@mui/material';
import CakeIcon from '@mui/icons-material/Cake';
import WorkIcon from '@mui/icons-material/Work';
import DownloadIcon from '@mui/icons-material/Download';
import dayjs from 'dayjs';

interface Employee {
  _id: string;
  first_name: string;
  last_name: string;
  email: string;
  image?: string;
  designation?: string;
  upcomingBirthday?: string;
  upcomingAnniversary?: string;
  yearsOfService?: number;
}

export default function Celebrations() {
  const [tabValue, setTabValue] = useState(0);
  const [selectedMonth, setSelectedMonth] = useState('All');
  const [birthdays, setBirthdays] = useState<Employee[]>([]);
  const [anniversaries, setAnniversaries] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const theme = useTheme();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    let token: string | null = null;
    let company_id: string | null = null;

    if (typeof window !== 'undefined') {
      const user = localStorage.getItem('user');
      if (user) {
        const parsedUser = JSON.parse(user);
        company_id = parsedUser?.company_id || null;
      }
      token = localStorage.getItem('token');
    }

    try {
      const headers = {
        Authorization: `Bearer ${token} ${company_id}`,
        'Content-Type': 'application/json',
      };

      const [bdayRes, annivRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_APP_URL}/employees/upcoming-birthdays?days=365&limit=1000`, { headers }),
        fetch(`${process.env.NEXT_PUBLIC_APP_URL}/employees/work-anniversaries?days=365&limit=1000`, { headers })
      ]);

      if (bdayRes.ok) {
        const bdata = await bdayRes.json();
        setBirthdays(Array.isArray(bdata) ? bdata : []);
      }
      
      if (annivRes.ok) {
        const adata = await annivRes.json();
        setAnniversaries(Array.isArray(adata) ? adata : []);
      }
    } catch (error) {
      console.error('Failed to fetch celebrations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const renderEmptyState = (type: 'birthday' | 'anniversary') => (
    <Box textAlign="center" py={10}>
      {type === 'birthday' ? (
        <CakeIcon sx={{ fontSize: 60, color: 'text.secondary', opacity: 0.5, mb: 2 }} />
      ) : (
        <WorkIcon sx={{ fontSize: 60, color: 'text.secondary', opacity: 0.5, mb: 2 }} />
      )}
      <Typography variant="h6" color="text.secondary">
        No upcoming {type}s found.
      </Typography>
    </Box>
  );

  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  const groupEmployeesByMonth = (employees: Employee[], type: 'birthday' | 'anniversary') => {
    const grouped = employees.reduce((acc, emp) => {
      const dateStr = type === 'birthday' ? emp.upcomingBirthday : emp.upcomingAnniversary;
      if (!dateStr) return acc;
      const monthName = dayjs(dateStr).format('MMMM'); // Removed year for grouping
      if (!acc[monthName]) acc[monthName] = [];
      acc[monthName].push(emp);
      return acc;
    }, {} as Record<string, Employee[]>);
    return grouped;
  };

  const renderGrouped = (employees: Employee[], type: 'birthday' | 'anniversary') => {
    let filteredEmployees = employees;
    if (selectedMonth !== 'All') {
      filteredEmployees = employees.filter(emp => {
        const dateStr = type === 'birthday' ? emp.upcomingBirthday : emp.upcomingAnniversary;
        return dateStr && dayjs(dateStr).format('MMMM') === selectedMonth;
      });
    }

    if (filteredEmployees.length === 0) return renderEmptyState(type);
    
    const grouped = groupEmployeesByMonth(filteredEmployees, type);
    
    return (
      <Box>
        {MONTHS.map((month) => {
          const emps = grouped[month];
          if (!emps || emps.length === 0) return null;
          
          return (
            <Box key={month} mb={5}>
              <Typography variant="h6" fontWeight={700} color="text.secondary" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                {month} <Chip label={emps.length} size="small" sx={{ fontWeight: 'bold', bgcolor: 'rgba(0,0,0,0.06)' }} />
              </Typography>
              <Grid container spacing={3}>
                {emps.map(emp => renderCard(emp, type))}
              </Grid>
            </Box>
          );
        })}
      </Box>
    );
  };

  const isToday = (dateString?: string) => {
    if (!dateString) return false;
    return dayjs(dateString).isSame(dayjs(), 'day');
  };

  const avatarColors = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6', '#ec4899'];
  const getAvatarColor = (name: string) => avatarColors[(name?.charCodeAt(0) || 0) % avatarColors.length];
  const getInitials = (f: string, l: string) => `${f?.[0] || ''}${l?.[0] || ''}`.toUpperCase();

  const handleDownload = () => {
    const sourceData = tabValue === 0 ? birthdays : anniversaries;
    const type = tabValue === 0 ? 'Birthday' : 'Work Anniversary';
    
    let filteredEmployees = sourceData;
    if (selectedMonth !== 'All') {
      filteredEmployees = sourceData.filter(emp => {
        const dateStr = type === 'Birthday' ? emp.upcomingBirthday : emp.upcomingAnniversary;
        return dateStr && dayjs(dateStr).format('MMMM') === selectedMonth;
      });
    }

    if (filteredEmployees.length === 0) {
      alert(`No ${type} data available to download.`);
      return;
    }

    const headers = ['First Name', 'Last Name', 'Email', 'Designation', 'Date', type === 'Work Anniversary' ? 'Years of Service' : ''];
    
    const rows = filteredEmployees.map(emp => {
      const dateStr = type === 'Birthday' ? emp.upcomingBirthday : emp.upcomingAnniversary;
      const dateFormatted = type === 'Birthday' ? dayjs(dateStr).format('MMMM D') : dayjs(dateStr).format('MMM D, YYYY');
      const years = type === 'Work Anniversary' ? emp.yearsOfService : '';
      
      return [
        emp.first_name || '',
        emp.last_name || '',
        emp.email || '',
        emp.designation || '',
        dateFormatted,
        years
      ].map(field => `"${String(field).replace(/"/g, '""')}"`).join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Celebrations_${type}_${selectedMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderCard = (emp: Employee, type: 'birthday' | 'anniversary') => {
    const name = `${emp.first_name || ''} ${emp.last_name || ''}`.trim();
    const dateStr = type === 'birthday' ? emp.upcomingBirthday : emp.upcomingAnniversary;
    const isSpecialDay = isToday(dateStr);
    const dateFormatted = type === 'birthday' ? dayjs(dateStr).format('MMMM D') : dayjs(dateStr).format('MMM D, YYYY');
    
    return (
      <Grid item xs={12} sm={6} md={4} lg={3} key={emp._id}>
        <Paper
          elevation={0}
          sx={{
            p: 3,
            borderRadius: '16px',
            border: isSpecialDay ? '2px solid' : '1px solid',
            borderColor: isSpecialDay ? (type === 'birthday' ? '#ec4899' : '#3b82f6') : 'divider',
            background: isSpecialDay 
              ? (type === 'birthday' ? 'linear-gradient(145deg, #fff 0%, #fdf2f8 100%)' : 'linear-gradient(145deg, #fff 0%, #eff6ff 100%)')
              : '#fff',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
            position: 'relative',
            overflow: 'hidden',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: '0 12px 24px rgba(0,0,0,0.08)'
            }
          }}
        >
          {isSpecialDay && (
            <Box
              sx={{
                position: 'absolute',
                top: 16,
                right: 16,
                animation: 'bounce 2s infinite',
                '@keyframes bounce': {
                  '0%, 100%': { transform: 'translateY(0)' },
                  '50%': { transform: 'translateY(-5px)' }
                }
              }}
            >
              {type === 'birthday' ? '🎉' : '🎊'}
            </Box>
          )}

          <Box display="flex" flexDirection="column" alignItems="center" textAlign="center" gap={1.5}>
            <Avatar 
              src={emp.image} 
              sx={{ 
                width: 72, 
                height: 72, 
                bgcolor: getAvatarColor(emp.first_name),
                fontSize: '1.5rem',
                fontWeight: 700,
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
              }}
            >
              {!emp.image && getInitials(emp.first_name, emp.last_name)}
            </Avatar>
            
            <Box>
              <Typography variant="subtitle1" fontWeight={700} color="text.primary">
                {name}
              </Typography>
              <Typography variant="body2" color="text.secondary" noWrap sx={{ maxWidth: '180px' }}>
                {emp.designation || 'Employee'}
              </Typography>
            </Box>

            <Chip 
              label={isSpecialDay ? 'Today' : dateFormatted} 
              size="small"
              sx={{
                fontWeight: 600,
                bgcolor: isSpecialDay 
                  ? (type === 'birthday' ? '#fce7f3' : '#dbeafe')
                  : 'rgba(0,0,0,0.04)',
                color: isSpecialDay 
                  ? (type === 'birthday' ? '#be185d' : '#1d4ed8')
                  : 'text.secondary',
                mt: 1
              }} 
            />

            {type === 'anniversary' && emp.yearsOfService !== undefined && (
              <Typography variant="caption" fontWeight={600} color="primary" sx={{ mt: 0.5 }}>
                {emp.yearsOfService} Year{emp.yearsOfService !== 1 ? 's' : ''} Work Anniversary!
              </Typography>
            )}
          </Box>
        </Paper>
      </Grid>
    );
  };

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, fontFamily: "'DM Sans', sans-serif" }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4} flexWrap="wrap" gap={2}>
        <Box>
          <Typography variant="h4" fontWeight={800} color="#0f172a" gutterBottom>
            Celebrations
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Upcoming birthdays and work anniversaries month-wise.
          </Typography>
        </Box>
        <Box display="flex" gap={2} alignItems="center" flexWrap="wrap">
          <Button 
            variant="outlined" 
            startIcon={<DownloadIcon />} 
            onClick={handleDownload}
            sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 600, height: '40px' }}
          >
            Download CSV
          </Button>
          <FormControl size="small" sx={{ minWidth: 200, bgcolor: '#fff', borderRadius: '8px' }}>
            <InputLabel>Filter by Month</InputLabel>
            <Select
              value={selectedMonth}
              label="Filter by Month"
              onChange={(e) => setSelectedMonth(e.target.value)}
              sx={{ borderRadius: '8px' }}
            >
              <MUIMenuItem value="All">All Months</MUIMenuItem>
              {MONTHS.map(m => (
                <MUIMenuItem key={m} value={m}>{m}</MUIMenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </Box>

      <Paper 
        elevation={0} 
        sx={{ 
          borderRadius: '20px', 
          border: '1px solid', 
          borderColor: 'divider',
          overflow: 'hidden',
          bgcolor: '#fff'
        }}
      >
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange} 
          variant="fullWidth"
          sx={{
            borderBottom: 1,
            borderColor: 'divider',
            bgcolor: 'rgba(0,0,0,0.01)',
            '& .MuiTab-root': {
              py: 2.5,
              fontWeight: 600,
              fontSize: '1rem',
              textTransform: 'none',
              transition: 'all 0.2s',
            },
            '& .Mui-selected': {
              color: '#3b82f6',
            },
            '& .MuiTabs-indicator': {
              height: 3,
              borderRadius: '3px 3px 0 0',
              bgcolor: '#3b82f6'
            }
          }}
        >
          <Tab 
            icon={<CakeIcon sx={{ mb: 0, mr: 1 }} />} 
            iconPosition="start" 
            label={`Birthdays (${birthdays.length})`} 
          />
          <Tab 
            icon={<WorkIcon sx={{ mb: 0, mr: 1 }} />} 
            iconPosition="start" 
            label={`Work Anniversaries (${anniversaries.length})`} 
          />
        </Tabs>

        <Box p={3}>
          {loading ? (
            <Box display="flex" justifyContent="center" py={10}>
              <CircularProgress />
            </Box>
          ) : (
            <Box>
              {/* Birthdays Panel */}
              {tabValue === 0 && renderGrouped(birthdays, 'birthday')}

              {/* Anniversaries Panel */}
              {tabValue === 1 && renderGrouped(anniversaries, 'anniversary')}
            </Box>
          )}
        </Box>
      </Paper>
    </Box>
  );
}
