'use client';
import { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  Grid,
  Typography,
  Box,
  IconButton,
  Modal,
  TextField,
  Button,
  Divider,
  Tooltip,
  TextareaAutosize,
} from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import CloseIcon from '@mui/icons-material/Close';
import FormatQuoteIcon from '@mui/icons-material/FormatQuote';
import { styled } from '@mui/material/styles';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { utility } from '@/utility'

const StyledCard = styled(Card)(({ theme }) => ({
  background: 'linear-gradient(135deg, #f39a28 0%, #e5ebee 100%)',
  borderRadius: theme.spacing(2),
  boxShadow: '0 10px 20px rgba(0,0,0,0.1)',
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-5px)',
    boxShadow: '0 15px 25px rgba(0,0,0,0.15)',
  },
}));

const QuoteCard = styled(Box)(({ theme }) => ({
  backgroundColor: 'rgba(255,255,255,0.8)',
  borderRadius: theme.spacing(2),
  padding: theme.spacing(3),
  position: 'relative',
  backdropFilter: 'blur(10px)',
  border: '1px solid rgba(255,255,255,0.2)',
}));

const GradientButton = styled(Button)(({ theme }) => ({
  background: 'linear-gradient(45deg, #2c3ce3 30%, #1a237e 90%)',
  borderRadius: theme.spacing(2),
  color: 'white',
  textTransform: 'none',
  '&:hover': {
    background: 'linear-gradient(45deg, #1a237e 30%, #2c3ce3 90%)',
  },
}));

const Welcome = () => {
  const [userData, setUserData] = useState<any>(null);
  const [open, setOpen] = useState(false);
  const [quote, setQuote] = useState('');
  const [author, setAuthor] = useState('');
  const [latestQuote, setLatestQuote] = useState<any>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string>("");
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
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/quotes`);
        const result = await response.json();

        console.log('API response for quotes:', result);

        const { data } = result;

        if (Array.isArray(data) && data.length > 0) {
          const latest = data[0];

          setLatestQuote(latest);
          setQuote(latest.quote);
          setAuthor(latest.author);
          setIsEditMode(true);
          console.log('Fetched latest quote:', latest);
        } else {
          setLatestQuote(null);
          setQuote('');
          setAuthor('');
          setIsEditMode(false);
          console.log('No quotes available in the response');
        }
      } catch (error) {
        console.error('Error fetching latest quote:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user.id) {
      fetchUserData();
      fetchLatestQuote();
    }
  }, []);

  useEffect(() => {
    console.log('latestQuote state updated:', latestQuote);
  }, [latestQuote]);

  const handleSubmit = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/quotes/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ quote, author }),
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
      toast.error('An unexpected error occurred');
    }
  };

  const handleEdit = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/quotes/update/${latestQuote._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ quote, author }),
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
      toast.error('An unexpected error occurred');
    }
  };

  const handleOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setIsEditMode(false);
  };

  if (loading) {
    return <Typography>Loading...</Typography>;
  }

  return (
    <>
      <ToastContainer />
      <StyledCard sx={{ height: '43vh', overflow: 'hidden' }}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography
              variant="h4"
              fontWeight="bold"
              sx={{
                background: 'linear-gradient(45deg, #2c3ce3 30%, #1a237e 90%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}
            >
              {userData ? `Welcome Back, ${capitalizeFirstLetter(userData.first_name)}!` : 'Welcome!'}
            </Typography>
            {userRole === '1' && (
              <Tooltip title="Add daily quotes">
                <IconButton
                  onClick={handleOpen}
                  sx={{
                    background: 'rgba(44, 60, 227, 0.1)',
                    '&:hover': {
                      background: 'rgba(44, 60, 227, 0.2)'
                    }
                  }}
                >
                  <MoreVertIcon color="primary" />
                </IconButton>
              </Tooltip>
            )}
          </Box>
          <Divider sx={{ mb: 3, borderColor: 'rgba(0,0,0,0.1)' }} />
          <QuoteCard>
            <Box display="flex" alignItems="start" mb={2}>
              <FormatQuoteIcon
                sx={{
                  fontSize: 40,
                  color: 'rgba(44, 60, 227, 0.5)',
                  mr: 2
                }}
              />
              <Typography variant="body1" sx={{ fontStyle: 'italic', color: 'rgba(0,0,0,0.7)' }}>
                {latestQuote ? latestQuote.quote : 'No quote available'}
              </Typography>
            </Box>
            <Typography
              variant="body2"
              sx={{
                textAlign: 'right',
                fontWeight: 'bold',
                color: 'rgba(0,0,0,0.6)',
                fontStyle: 'italic',
              }}
            >
              {latestQuote ? `- ${latestQuote.author}` : 'No author'}
            </Typography>
          </QuoteCard>
        </CardContent>
      </StyledCard>

      <Modal open={open} onClose={handleClose}>
        <Box
          sx={{
            width: 400,
            margin: 'auto',
            mt: '15%',
            padding: 4,
            bgcolor: 'white',
            borderRadius: 2,
            boxShadow: 24,
            background: 'linear-gradient(135deg, #f6f8f9 0%, #e5ebee 100%)'
          }}
        >
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography
              variant="h6"
              sx={{
                background: 'linear-gradient(45deg, #2c3ce3 30%, #1a237e 90%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}
            >
              {isEditMode ? 'Edit Quote' : 'Submit a Quote'}
            </Typography>
            <IconButton onClick={handleClose}>
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
              padding: '15px',
              borderColor: 'rgba(44, 60, 227, 0.2)',
              borderRadius: '10px',
              marginTop: '16px',
              marginBottom: '16px',
              backgroundColor: 'rgba(255,255,255,0.8)',
              resize: 'vertical',
              outline: 'none',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            }}
          />
          <TextField
            fullWidth
            label="Author"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            margin="normal"
            variant="outlined"
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '10px',
              }
            }}
          />
          <GradientButton
            variant="contained"
            onClick={isEditMode ? handleEdit : handleSubmit}
            fullWidth
            sx={{ mt: 2 }}
          >
            {isEditMode ? 'Edit Quote' : 'Submit'}
          </GradientButton>
        </Box>
      </Modal>
    </>
  );
};

export default Welcome;
