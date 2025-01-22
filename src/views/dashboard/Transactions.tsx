'use client';
import { useEffect, useState } from 'react';
import {
  Card,
  Typography,
  Box,
  IconButton,
  Modal,
  TextField,
  Button,
  Divider,
  Tooltip,
  TextareaAutosize,
  Paper,
  CircularProgress,
} from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import CloseIcon from '@mui/icons-material/Close';
import FormatQuoteIcon from '@mui/icons-material/FormatQuote';
import WbSunnyIcon from '@mui/icons-material/WbSunny';
import { styled } from '@mui/material/styles';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { utility } from '@/utility';

const StyledCard = styled(Card)(({ theme }) => ({
  position: 'relative',
  height: 'auto',
  backgroundColor: 'white',
  // minHeight: '320px',
  padding: '3px',
  borderRadius: theme.spacing(4),
  boxShadow: '0 8px 32px rgba(26, 35, 126, 0.15)',
  transition: 'all 0.3s ease',
  // background: 'linear-gradient(50deg,rgb(223, 169, 7) 0%,rgb(12, 21, 75) 100%)',
  '&:hover': {
    transform: 'translateY(-5px)',
    boxShadow: '0 12px 40px rgba(26, 35, 126, 0.25)',
  },
}));

const CardInner = styled(Box)(({ theme }) => ({
  borderRadius: 'inherit',
  width: '100%',
  padding: theme.spacing(3),
  display: 'flex',
  flexDirection: 'column',
  // background: 'linear-gradient(90deg,rgb(226, 217, 191) 0%,rgb(111, 112, 117) 100%)',
  '@media (max-width: 600px)': {
    padding: theme.spacing(2),
  },
}));

const QuoteCard = styled(Paper)(({ theme }) => ({
  backgroundColor: 'rgb(25 118 210 / 5%)',
  borderRadius: theme.spacing(1),
  padding: theme.spacing(3),
  border: '1px solid rgba(0,0,0,0.06)',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
  },
}));

const WeatherCard = styled(Paper)(({ theme }) => ({
  background: 'linear-gradient(135deg, #1a237e 0%, #3949ab 100%)',
  borderRadius: theme.spacing(2),
  padding: theme.spacing(3),
  // border: '1px solid rgba(219, 28, 28, 0.06)',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
  transition: 'all 0.3s ease',
  marginTop: theme.spacing(3),
  '&:hover': {
    transform: 'translateY(-6px)',
    boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
  },
}));

const StyledModal = styled(Box)(({ theme }) => ({
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: '90%',
  maxWidth: '400px',
  backgroundColor: '#ffffff',
  borderRadius: theme.spacing(2),
  boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
  padding: theme.spacing(4),
  outline: 'none',
  '@media (max-width: 600px)': {
    width: '95%',
    padding: theme.spacing(3),
  },
}));

const StyledButton = styled(Button)(({ theme }) => ({
  background: 'linear-gradient(135deg, #1a237e 0%, #3949ab 100%)',
  borderRadius: theme.spacing(1),
  color: 'white',
  textTransform: 'none',
  padding: '12px 24px',
  transition: 'all 0.3s ease',
  '&:hover': {
    background: 'linear-gradient(135deg, #3949ab 0%, #1a237e 100%)',
    boxShadow: '0 4px 12px rgba(26, 35, 126, 0.25)',
  },
}));

const Welcome = () => {
  const [userData, setUserData] = useState<any>(null);
  const [open, setOpen] = useState(false);
  const [quote, setQuote] = useState('');
  const [author, setAuthor] = useState('');
  const [latestQuote, setLatestQuote] = useState<any>(null);
  const [weather, setWeather] = useState<any>(null);
  const [loadingWeather, setLoadingWeather] = useState(true);
  const [isEditMode, setIsEditMode] = useState(false);
  const [userRole, setUserRole] = useState<string>('');
  const { capitalizeFirstLetter } = utility();

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    setUserRole(user.role);

    const fetchUserData = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/employees/get/${user.id}`);
        const data = await response.json();
        setUserData(data);
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    const fetchLatestQuote = async () => {
      let token: string | null = null;
      const { company_id } = typeof window !== "undefined" && JSON.parse(localStorage?.getItem("user") || "{}");

      if (typeof window !== "undefined") {
        token = localStorage?.getItem("token");
      }
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/quotes`,
          {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token} ${company_id}`,
              'Content-Type': 'application/json',
            },
          }
        );
        const result = await response.json();

        console.log('API response for quotes:', result);

        const { data } = result;

        if (Array.isArray(data) && data.length > 0) {
          const latest = data[0];
          setLatestQuote(latest);
          setQuote(latest.quote);
          setAuthor(latest.author);
          setIsEditMode(true);
        } else {
          setLatestQuote(null);
          setQuote('');
          setAuthor('');
          setIsEditMode(false);
        }
      } catch (error) {
        console.error('Error fetching latest quote:', error);
      }
    };

    const fetchWeather = async (lat, lon) => {
      setLoadingWeather(true);
      try {
        const response = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`
        );
        const data = await response.json();
        console.log('weather', data);
        setWeather(data.current_weather);
      } catch (error) {
        console.error('Error fetching weather:', error);
      } finally {
        setLoadingWeather(false);
      }
    };

    const getUserLocationAndFetchWeather = () => {
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            fetchWeather(latitude, longitude);
          },
          (error) => {
            console.error('Error getting location:', error);
            // Fallback or show an error to the user
          }
        );
      } else {
        console.error('Geolocation is not supported by this browser.');
      }
    };

    if (user.id) {
      fetchUserData();
      fetchLatestQuote();
      getUserLocationAndFetchWeather();
      fetchWeather();
    }
  }, []);

  const handleOpen = () => setOpen(true);
  const handleClose = () => {
    setOpen(false);
    setIsEditMode(false);
  };

  const handleSubmit = async () => {
    const { company_id } = typeof window !== "undefined" && JSON.parse(localStorage?.getItem("user") || "{}");
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/quotes/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ quote, author, company_id }),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success(result.message);
        setQuote('');
        setAuthor('');
        setOpen(false);
        setLatestQuote(result.data);
      } else {
        toast.error(result.message || 'Error saving the quote.');
      }
    } catch (error) {
      console.error('Error submitting quote:', error);
      toast.error('An unexpected error occurred.');
    }
  };

  const handleEdit = async () => {
    const { company_id } = JSON.parse(localStorage?.getItem("user") || "{}");
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/quotes/update/${latestQuote._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quote, author, company_id }),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success(result.message);
        setOpen(false);
        setLatestQuote(result.data);
        setIsEditMode(false);
      } else {
        toast.error(result.message || 'Error updating the quote.');
      }
    } catch (error) {
      console.error('Error editing quote:', error);
      toast.error('An unexpected error occurred.');
    }
  };

  return (
    <>
      <ToastContainer />
      <StyledCard>
        <CardInner>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography
              mb={0}
              variant="h4"
              sx={{
                fontWeight: 700,
                color: '#1a237e',
                '@media (max-width: 600px)': { fontSize: '1.75rem' },
              }}
            >
              {userData ? `Welcome Back, ${capitalizeFirstLetter(userData.first_name)}!` : 'Welcome!'}
            </Typography>
            {userRole === '1' && (
              <Tooltip title="Add daily quotes">
                <IconButton
                  onClick={handleOpen}
                  sx={{
                    // backgroundColor: '#f1f5f9',
                    borderRadius: '12px',
                    '&:hover': { backgroundColor: '#e2e8f0' },
                  }}
                >
                  <MoreVertIcon sx={{ color: '#E55286' }} />
                </IconButton>
              </Tooltip>
            )}
          </Box>
          <QuoteCard elevation={2}>
            <Box display="flex" gap={2} mb={2}>
              <FormatQuoteIcon
                sx={{
                  fontSize: 40,
                  color: '#4ECDC4',
                  opacity: 0.7,
                }}
              />
              <Typography
                variant="body1"
                sx={{
                  fontStyle: 'italic',
                  color: '#334155',
                  flex: 1,
                  lineHeight: 1.6,
                  '@media (max-width: 600px)': { fontSize: '0.95rem' },
                }}
              >
                {latestQuote ? latestQuote.quote : 'No quote available'}
              </Typography>
            </Box>
            <Typography
              variant="body2"
              sx={{
                textAlign: 'right',
                fontWeight: 600,
                color: '#475569',
                mt: 2,
                '@media (max-width: 600px)': { fontSize: '0.85rem' },
              }}
            >
              {latestQuote ? `- ${latestQuote.author}` : 'No author'}
            </Typography>
          </QuoteCard>
          <WeatherCard elevation={0} sx={{ backgroundColor: 'background.paper', color: 'text.primary' }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6" sx={{ fontWeight: 600, color: 'white' }}>
                Current Weather
              </Typography>
              <WbSunnyIcon sx={{ fontSize: 28, color: '#FFCB4A' }} />
            </Box>
            {loadingWeather ? (
              <Typography variant="body2" color="text.secondary">
                Loading weather data...
              </Typography>
            ) : weather ? (
              <Box>
                <Typography color='#FFEB3B' variant="body1">Temperature: {weather.temperature}°C</Typography>
                <Typography variant="body2" color="#FFFFFF">
                  Condition: {weather.weathercode === 0 ? 'Clear Sky' : 'Cloudy'}
                </Typography>
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary">
                Unable to fetch weather data.
              </Typography>
            )}
          </WeatherCard>

        </CardInner>
      </StyledCard>
      <Modal open={open} onClose={handleClose} aria-labelledby="quote-modal">
        <StyledModal>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#FF6B6B' }}>
              {isEditMode ? 'Edit Quote' : 'Submit a Quote'}
            </Typography>
            <IconButton
              onClick={handleClose}
              sx={{
                color: '#64748b',
                '&:hover': { backgroundColor: '#f1f5f9' },
              }}
            >
              <CloseIcon />
            </IconButton>
          </Box>
          <TextareaAutosize
            minRows={4}
            placeholder="Enter your quote"
            value={quote}
            onChange={(e) => setQuote(e.target.value)}
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              marginBottom: '16px',
              fontSize: '14px',
              fontFamily: 'inherit',
              resize: 'vertical',
              outline: 'none',
            }}
          />
          <TextField
            fullWidth
            label="Author"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            variant="outlined"
            sx={{
              mb: 3,
              '& .MuiOutlinedInput-root': { borderRadius: '12px' },
            }}
          />
          <StyledButton
            variant="contained"
            onClick={isEditMode ? handleEdit : handleSubmit}
            fullWidth
          >
            {isEditMode ? 'Edit Quote' : 'Submit'}
          </StyledButton>
        </StyledModal>
      </Modal>
    </>
  );
};

export default Welcome;
