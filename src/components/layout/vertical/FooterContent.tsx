'use client'
import { useState, useEffect } from 'react'

import {
  Container,
  Box,
  Typography,
  Link,
  Divider,
  Grid,
  Paper,
  IconButton,
  Collapse,
  useTheme,
  useMediaQuery
} from '@mui/material'
import {
  Phone as PhoneIcon,
  Email as EmailIcon,
  LocationOn as LocationOnIcon,
  ExpandMore as ExpandMoreIcon,
  Facebook as FacebookIcon,
  Twitter as TwitterIcon,
  Instagram as InstagramIcon,
  LinkedIn as LinkedInIcon
} from '@mui/icons-material'
import { styled } from '@mui/material/styles'

import { fetchConfiguration } from '@/utility/setting-configuration/settingConfig'

const FooterSection = styled(Box)(({ theme }) => ({
  [theme.breakpoints.up('md')]: {
    textAlign: 'left'
  },
  [theme.breakpoints.down('md')]: {
    textAlign: 'center'
  },
  transition: 'transform 0.3s ease-in-out',
  '&:hover': {
    transform: 'translateY(-5px)'
  }
}))

const FooterLink = styled(Link)(({ theme }) => ({
  color: theme.palette.common.white,
  textDecoration: 'none',
  transition: 'all 0.3s ease',
  marginBottom: theme.spacing(1.5),
  display: 'flex',
  alignItems: 'center',
  fontSize: '0.95rem',
  position: 'relative',
  '&:hover': {
    color: '#FFD700',
    paddingLeft: theme.spacing(1),
    '&::before': {
      width: '15px'
    }
  },
  '&::before': {
    content: '""',
    position: 'absolute',
    left: '-20px',
    top: '50%',
    width: '0',
    height: '2px',
    backgroundColor: '#FFD700',
    transition: 'width 0.3s ease'
  }
}))

const ContactPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  backgroundColor: 'rgba(255, 255, 255, 0.95)',
  backdropFilter: 'blur(10px)',
  color: theme.palette.text.primary,
  borderRadius: theme.spacing(2),
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
  maxWidth: 500,
  margin: '0 auto',
  transform: 'translateY(20px)',
  animation: 'slideUp 0.5s ease forwards',
  '@keyframes slideUp': {
    to: {
      transform: 'translateY(0)',
      opacity: 1
    }
  }
}))

const SocialIconButton = styled(IconButton)(({ theme }) => ({
  color: theme.palette.common.white,
  margin: theme.spacing(0, 1),
  transition: 'all 0.3s ease',
  '&:hover': {
    color: '#FFD700',
    transform: 'scale(1.2)'
  }
}))

const GradientBackground = styled(Box)(({ theme }) => ({
  background: 'linear-gradient(135deg, #2c3ce3 0%, #1a237e 100%)',
  position: 'relative',
  borderRadius: '30px 30px 0px 0px',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '100px',
    background: 'linear-gradient(180deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 100%)'
  }
}))

const FooterContent = () => {
  const [showContactDetails, setShowContactDetails] = useState(false)
  const [footerData, setFooterData] = useState(null)
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))

  const handleContactClick = () => {
    setShowContactDetails(!showContactDetails)
  }

  useEffect(() => {
    const fetchFooterData = async () => {
      try {
        const data = await fetchConfiguration()

        setFooterData(data)
      } catch (error) {
        console.error('Error fetching footer data:', error)
      }
    }

    fetchFooterData()
  }, [])

  if (!footerData) {
    return <Typography>Loading...</Typography>
  }

  return (
    <GradientBackground>
      <Container maxWidth='lg' sx={{ py: 8 }}>
        <Grid container spacing={6} justifyContent='space-between'>
          {/* Company Info */}
          <Grid item xs={12} md={4}>
            <FooterSection>
              <Typography
                variant='h4'
                sx={{
                  fontWeight: 700,
                  marginBottom: 3,
                  textAlign: { xs: 'center', md: 'left' },
                  background: 'linear-gradient(45deg, #FFFFFF 30%, #FFD700 90%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}
              >
                {footerData?.name || 'Loading...'}
              </Typography>

              {footerData?.address &&
                footerData.address.map((loc, index) => (
                  <Box
                    key={index}
                    sx={{
                      display: 'flex',
                      justifyContent: { xs: 'center', md: 'flex-start' },
                      alignItems: 'center',
                      color: 'white',
                      marginBottom: 2,
                      gap: 1.5,
                      transition: 'transform 0.3s ease',
                      '&:hover': {
                        transform: 'translateX(10px)'
                      }
                    }}
                  >
                    <LocationOnIcon sx={{ color: '#FFD700' }} />
                    <Link
                      href={`https://www.google.com/maps?q=${loc}`}
                      target='_blank'
                      sx={{
                        color: 'white',
                        textDecoration: 'none',
                        '&:hover': {
                          color: '#FFD700'
                        }
                      }}
                    >
                      {loc}
                    </Link>
                  </Box>
                ))}

              {/* <Box sx={{ mt: 4, textAlign: { xs: 'center', md: 'left' } }}>
                <SocialIconButton><FacebookIcon /></SocialIconButton>
                <SocialIconButton><TwitterIcon /></SocialIconButton>
                <SocialIconButton><InstagramIcon /></SocialIconButton>
                <SocialIconButton><LinkedInIcon /></SocialIconButton>
              </Box> */}
            </FooterSection>
          </Grid>

          {/* Company Links */}
          <Grid item xs={12} md={3}>
            <FooterSection>
              <Typography
                variant='h5'
                sx={{
                  fontWeight: 600,
                  marginBottom: 3,
                  textAlign: { xs: 'center', md: 'left' },
                  color: '#FFD700'
                }}
              >
                Company
              </Typography>
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: { xs: 'center', md: 'flex-start' },
                  pl: { md: 2 }
                }}
              >
                <FooterLink href='#'>About us</FooterLink>
                <FooterLink href='#'>Blogs</FooterLink>
                <FooterLink href='#'>Privacy Policy</FooterLink>
                <FooterLink href='#'>Term & Condition</FooterLink>
              </Box>
            </FooterSection>
          </Grid>

          {/* Contact Section */}
          <Grid item xs={12} md={4}>
            <FooterSection>
              <Typography
                variant='h5'
                sx={{
                  fontWeight: 600,
                  marginBottom: 3,
                  textAlign: { xs: 'center', md: 'left' },
                  color: '#FFD700',
                }}
              >
                Contact Us
              </Typography>

              {/* Phone Number Section */}
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  p: 2,
                  borderRadius: 3,
                  backgroundColor: 'rgba(44, 60, 227, 0.1)',
                  marginBottom: 2,
                  transition: 'all 0.3s ease',
                  cursor: 'pointer',
                  '&:hover': {
                    backgroundColor: 'rgba(44, 60, 227, 0.2)',
                    boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.2)',
                  },
                }}
              >
                <PhoneIcon sx={{ color: '#FFD700', fontSize: '1.5rem' }} />
                <Typography variant='h6' sx={{ fontWeight: '600', color: 'white' }}>
                  {footerData?.contactNo || 'No contact info'}
                </Typography>
              </Box>

              {/* Email Section */}
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  p: 2,
                  borderRadius: 3,
                  backgroundColor: 'rgba(44, 60, 227, 0.1)',
                  transition: 'all 0.3s ease',
                  cursor: 'pointer',
                  '&:hover': {
                    backgroundColor: 'rgba(44, 60, 227, 0.2)',
                    boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.2)',
                  },
                }}
              >
                <EmailIcon sx={{ color: '#FFD700', fontSize: '1.5rem' }} />
                <Typography variant='h6' sx={{ fontWeight: '600', color: 'white' }}>
                  {footerData?.email || 'No email info'}
                </Typography>
              </Box>
            </FooterSection>
          </Grid>

        </Grid>

        <Box
          sx={{
            display: 'flex',
            justifyContent: { xs: 'center', md: 'flex-end' },
            alignItems: 'center',
            marginBottom: 2
          }}
        >
          <SocialIconButton>
            <FacebookIcon />
          </SocialIconButton>
          <SocialIconButton>
            <TwitterIcon />
          </SocialIconButton>
          <SocialIconButton>
            <InstagramIcon />
          </SocialIconButton>
          <SocialIconButton>
            <LinkedInIcon />
          </SocialIconButton>
        </Box>

        <Divider
          sx={{
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            margin: '2rem 0 1rem'
          }}
        />

        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 2
          }}
        >
          <Typography
            sx={{
              color: 'white',
              fontSize: '0.9rem',
              textAlign: 'center'
            }}
          >
            © {new Date().getFullYear()} All Rights Reserved by {footerData?.name || 'Your Company'}
          </Typography>
          <Typography
            sx={{
              color: 'rgba(255, 255, 255, 0.7)',
              fontSize: '0.85rem',
              textAlign: 'center',
              maxWidth: '600px'
            }}
          >
            {footerData.description}
          </Typography>
        </Box>
      </Container>
    </GradientBackground>
  )
}

export default FooterContent
