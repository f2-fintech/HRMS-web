'use client'
import { useState, useEffect } from "react";

// Next Imports

// Third-party Imports
import {
  Container,
  Box,
  Typography,
  Link,
  Divider,
  Grid,
  Paper,
  IconButton,
  Collapse
} from "@mui/material";
import {
  Phone as PhoneIcon,
  Email as EmailIcon,
  LocationOn as LocationOnIcon,
  ExpandMore as ExpandMoreIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';

import { fetchConfiguration } from "@/utility/setting-configuration/settingConfig";

// Styled components for enhanced design
const FooterContainer = styled(Container)(({ theme }) => ({
  backgroundColor: theme.palette.primary.main,
  color: theme.palette.common.white,
  padding: theme.spacing(4, 2),
}));

const FooterSection = styled(Box)(({ theme }) => ({
  [theme.breakpoints.up('md')]: {
    textAlign: 'left',
  },
  [theme.breakpoints.down('md')]: {
    textAlign: 'center',
  },
}));

const FooterLink = styled(Link)(({ theme }) => ({
  color: theme.palette.common.white,
  textDecoration: 'none',
  transition: 'color 0.3s ease',
  '&:hover': {
    color: theme.palette.grey[300],
    textDecoration: 'underline',
  },
  marginBottom: theme.spacing(1),
  display: 'block',
}));

const ContactPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  backgroundColor: theme.palette.common.white,
  color: theme.palette.text.primary,
  borderRadius: theme.spacing(2),
  boxShadow: theme.shadows[4],
  maxWidth: 500,
  margin: '0 auto',
}));

const FooterContent = () => {
  const [showContactDetails, setShowContactDetails] = useState(false);
  const [footerData, setFooterData] = useState(null);

  const handleContactClick = () => {
    setShowContactDetails(!showContactDetails);
  };

  // Fetch footer data from the database
  useEffect(() => {
    const fetchFooterData = async () => {
      try {
        const data = await fetchConfiguration();
        setFooterData(data);
      } catch (error) {
        console.error("Error fetching footer data:", error);
      }
    };

    fetchFooterData();
  }, []);

  if (!footerData) {
    return <Typography>Loading...</Typography>;
  }

  return (
    <FooterContainer maxWidth={false}>
      <Grid container spacing={4} justifyContent="space-between">
        {/* Company Information */}
        <Grid item xs={12} md={4}>
          <FooterSection>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 600,
                marginBottom: 2,
                textAlign: { xs: 'center', md: 'left' }
              }}
            >
              {footerData?.name || 'Loading...'}
            </Typography>

            {footerData?.address && footerData.address.map((loc, index) => (
              <Box
                key={index}
                display="flex"
                justifyContent={{ xs: "center", md: "flex-start" }}
                alignItems="center"
                sx={{
                  color: "white",
                  marginBottom: 1.5,
                  gap: 1
                }}
              >
                <LocationOnIcon />
                <Link
                  href={`https://www.google.com/maps?q=${loc}`}
                  target="_blank"
                  sx={{
                    color: "white",
                    '&:hover': { textDecoration: 'underline' }
                  }}
                >
                  {loc}
                </Link>
              </Box>
            ))}
          </FooterSection>
        </Grid>

        {/* Company Links */}
        <Grid item xs={12} md={3}>
          <FooterSection>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 600,
                marginBottom: 2,
                textAlign: { xs: 'center', md: 'left' }
              }}
            >
              Company
            </Typography>
            <FooterLink href="#" variant="body1">About us</FooterLink>
            <FooterLink href="#" variant="body1">Blogs</FooterLink>
            <FooterLink href="#" variant="body1">Privacy Policy</FooterLink>
            <FooterLink href="#" variant="body1">Term & Condition</FooterLink>
          </FooterSection>
        </Grid>

        {/* Contact Section */}
        <Grid item xs={12} md={3}>
          <FooterSection>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 600,
                marginBottom: 2,
                textAlign: { xs: 'center', md: 'left' }
              }}
            >
              Let's Talk
            </Typography>
            <FooterLink href="#" variant="body1">Have any doubts?</FooterLink>
            <Box
              display="flex"
              flexDirection="column"
              alignItems={{ xs: 'center', md: 'flex-start' }}
            >
              <FooterLink
                component="button"
                onClick={handleContactClick}
                variant="body1"
                sx={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                  '&:hover': {
                    textDecoration: 'underline'
                  }
                }}
              >
                Contact Us
                <IconButton
                  size="small"
                  sx={{
                    color: 'white',
                    transform: showContactDetails ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.3s ease'
                  }}
                >
                  <ExpandMoreIcon />
                </IconButton>
              </FooterLink>

              <Collapse in={showContactDetails} timeout="auto" unmountOnExit>
                <ContactPaper elevation={4}>
                  <Box display="flex" alignItems="center" justifyContent="center" sx={{ mb: 2 }}>
                    <PhoneIcon sx={{ marginRight: "0.5rem", color: "primary.main" }} />
                    <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                      {footerData?.contactNo || 'No contact info'}
                    </Typography>
                  </Box>
                  <Box display="flex" alignItems="center" justifyContent="center" sx={{ mb: 2 }}>
                    <EmailIcon sx={{ marginRight: "0.5rem", color: "primary.main" }} />
                    <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                      {footerData?.email || 'No email info'}
                    </Typography>
                  </Box>
                  <Typography variant="body1" sx={{ marginTop: "2rem", textAlign: 'center' }}>
                    {footerData?.description || 'No description available'}
                  </Typography>
                </ContactPaper>
              </Collapse>
            </Box>
          </FooterSection>
        </Grid>
      </Grid>

      {/* Copyright */}
      <Divider
        sx={{
          backgroundColor: 'white',
          opacity: 0.3,
          marginTop: 4,
          marginBottom: 2
        }}
      />
      <Typography
        sx={{
          color: 'white',
          fontSize: '15px',
          textAlign: 'center'
        }}
      >
        © {new Date().getFullYear()} All Rights Reserved by {footerData?.name || 'Your Company'}
      </Typography>
      <Typography
        sx={{
          color: 'white',
          fontSize: '13px',
          textAlign: 'center',
          opacity: 0.7,
          marginTop: 1
        }}
      >
        {footerData.description}
      </Typography>
    </FooterContainer>
  );
};

export default FooterContent;
