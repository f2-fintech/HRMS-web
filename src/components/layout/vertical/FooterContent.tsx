'use client'
import { useState } from "react";

// Next Imports

// Third-party Imports

// Hook Imports
import { Container, Box, Typography, Link, Stack, Divider } from "@mui/material";
import PhoneIcon from '@mui/icons-material/Phone';
import EmailIcon from '@mui/icons-material/Email';
import LocationOnIcon from '@mui/icons-material/LocationOn';

import useVerticalNav from '@menu/hooks/useVerticalNav';



const FooterContent = () => {
  const [showContactDetails, setShowContactDetails] = useState(false);

  const handleContactClick = () => {
    setShowContactDetails(!showContactDetails); // Toggle contact details visibility
  };

  return (
    <Container

      maxWidth={false}
      sx={{
        background: "#2c3ce3",

        // padding: '2rem 1rem', // Adjust padding for responsiveness
        // margin: "0px"
      }}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", md: "row" }, // Stack vertically on small screens
          justifyContent: "space-between",
          alignItems: { xs: "center", md: "flex-start" }, // Center items on small screens
          padding: '2rem 1rem'
        }}
      >
        <Box width={{ xs: "100%", md: 350 }} textAlign={{ xs: "center", md: "left" }} mb={{ xs: 4, md: 0 }}>
          <Typography
            variant="h4"
            sx={{ fontWeight: "600", color: "white", marginBottom: "1rem" }}
          >
            F2-FINTECH
          </Typography>
          <Box display="flex" justifyContent={{ xs: "center", md: "flex-start" }} alignItems="center" sx={{ color: "white", lineHeight: "2rem" }}>
            <LocationOnIcon sx={{ marginRight: "0.5rem" }} />
            <Link
              href="https://www.google.com/maps/place/F2+Fintech/@28.6298965,77.3786547,17z/data=!3m1!5s0x390ceff85302d5d3:0x2c0770794e1ff53f!4m6!3m5!1s0x390ceff7c76d1b4f:0x13317a05dd04cb37!8m2!3d28.6298918!4d77.3812296!16s%2Fg%2F11tdl471bb?entry=ttu"
              target="_blank"
              sx={{ color: "white" }}
              underline="none"
            >
              <Typography variant="h6" sx={{ color: "white" }}>
                A-25, M-1 Arv Park, A-Block, Sector-63, Noida Uttar Pradesh - 201301
              </Typography>
            </Link>
          </Box>
          <Box display="flex" justifyContent={{ xs: "center", md: "flex-start" }} alignItems="center" sx={{ color: "white", lineHeight: "2rem", mt: '1.5rem' }}>
            <LocationOnIcon sx={{ marginRight: "0.5rem" }} />
            <Link
              href="https://www.google.com/maps/place/28%C2%B022'20.4%22N+79%C2%B025'25.9%22E/@28.3723431,79.4212761,17z/data=!3m1!4b1!4m4!3m3!8m2!3d28.3723431!4d79.423851?entry=ttu"
              target="_blank"
              sx={{ color: "white" }}
              underline="none"
            >
              <Typography variant="h6" sx={{ color: "white" }}>
                12, Bajaj Complex, Prem Nagar Thana, Bareilly - 243005
              </Typography>
            </Link>
          </Box>
          <Box display="flex" justifyContent={{ xs: "center", md: "flex-start" }} alignItems="center" sx={{ color: "white", lineHeight: "2rem", mt: '1.5rem' }}>
            <LocationOnIcon sx={{ marginRight: "0.5rem" }} />
            <Link
              href="https://www.google.com/maps/place/28%C2%B038'43.7%22N+77%C2%B010'04.5%22E/@28.6454722,77.1679167,17z/data=!3m1!4b1!4m4!3m3!8m2!3d28.6454722!4d77.1679167?hl=en&entry=ttu"
              target="_blank"
              sx={{ color: "white" }}
              underline="none"
            >
              <Typography variant="h6" sx={{ color: "white" }}>
                Office No 59, South Patel Nagar, New Delhi - 110008
              </Typography>
            </Link>
          </Box>

        </Box>
        <Box
          sx={{ display: "flex", flexDirection: "column", textAlign: { xs: "center", md: "left" }, mb: { xs: 4, md: 0 } }}
        >
          <Typography
            variant="h5"
            sx={{ fontWeight: "600", color: "white", marginBottom: "1rem" }}
          >
            Company
          </Typography>
          <Link
            underline="none"
            variant="h6"
            sx={{ color: "white", marginBottom: "1rem" }}
          >
            About us
          </Link>
          <Link
            underline="none"
            variant="h6"
            sx={{ color: "white", marginBottom: "1rem" }}
          >
            Blogs
          </Link>
          <Link
            underline="none"
            variant="h6"
            sx={{ color: "white", marginBottom: "1rem" }}
          >
            Privacy Policy
          </Link>
          <Link
            underline="none"
            variant="h6"
            sx={{ color: "white", marginBottom: "1rem" }}
          >
            Term & Condition
          </Link>
        </Box>
        <Box
          sx={{ display: "flex", flexDirection: "column", textAlign: { xs: "center", md: "left" } }}
        >
          <Typography
            variant="h5"
            sx={{ fontWeight: "600", color: "white", marginBottom: "1rem" }}
          >
            Let's Talk
          </Typography>
          <Link
            underline="none"
            variant="h6"
            sx={{ color: "white", marginBottom: "1rem" }}
          >
            Have any doubts?
          </Link>
          <Link
            underline="none"
            variant="h6"
            sx={{ color: "white", marginBottom: "1rem", cursor: "pointer" }} // Add cursor pointer
            onClick={handleContactClick} // Handle the click event
          >
            Contact Us
          </Link>
          {showContactDetails && (
            <Box
              sx={{
                mt: 2,
                p: 3,
                borderRadius: "8px", // Rounded corners
                backgroundColor: "white", // Solid white box background
                boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)", // Soft shadow for depth
                color: "black", // Set text color to black for readability on white background
                maxWidth: "500px", // Set max-width for better responsiveness
                textAlign: "center",
                mx: "auto", // Center horizontally
              }}
            >
              <Box display="flex" alignItems="center" justifyContent="center" sx={{ mb: 2 }}>
                <PhoneIcon sx={{ marginRight: "0.5rem", color: "black" }} />
                <Typography variant="h6" sx={{ fontWeight: "bold" }}>+91 8810600135</Typography>
              </Box>
              <Box display="flex" alignItems="center" justifyContent="center" sx={{ mb: 2 }}>
                <EmailIcon sx={{ marginRight: "0.5rem", color: "black" }} />
                <Typography variant="h6" sx={{ fontWeight: "bold" }}>wecare@f2fintech.com</Typography>
              </Box>
              <Typography variant="h6" sx={{ marginTop: "2rem" }}> {/* Add margin-top for spacing */}
                We are a Global Electronic Marketplace for Buying & Selling Loans.
                Delegate your financial worries to us and focus on growing your core profession.
              </Typography>
            </Box>
          )}

          <Stack direction="row" spacing={3}>
          </Stack>
        </Box>
      </Box>
      <Typography sx={{ color: 'white', fontSize: '15px', mt: 4, textAlign: 'center' }}>
        © 2024 All Rights Reserved by F2 Fintech
      </Typography>
      <Divider color="white" sx={{ height: "1px", mt: 4 }} />
      <Typography sx={{ color: 'white', fontSize: '15px', mt: 2, textAlign: 'center' }}>
        True wealth is not measured by the size of your bank account, but by the freedom to live life on your own terms.
      </Typography>
    </Container>
  )
}

export default FooterContent;
