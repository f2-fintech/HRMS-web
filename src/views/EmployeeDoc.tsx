'use client'
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProfiles, setSearchQuery, setPage } from '../redux/features/profileEmployeee/profilesSlice';
import {
    Box,
    Typography,
    Card,
    CardContent,
    CardActionArea,
    CardActions,
    Modal,
    Tabs,
    Tab,
    CircularProgress,
    Alert,
    Chip,
    Avatar,
    IconButton,
    Button,
    Grid,
    Paper,
    Divider,
    Badge
} from '@mui/material';
import {
    Close as CloseIcon,
    Check as CheckIcon,
    BusinessCenter as BusinessCenterIcon,
    School as SchoolIcon,
    LocationOn as LocationOnIcon,
    AccountBalance as AccountBalanceIcon,
    VerifiedUser as VerifiedUserIcon,
    Pending as PendingIcon,
    Person as PersonIcon,
    ChevronRight as ChevronRightIcon,
    Article as ArticleIcon
} from '@mui/icons-material';

const EmployeeDocs = () => {
    const dispatch = useDispatch();
    const { profiles, status, error, page, searchQuery } = useSelector((state) => state.profiles);
    const [showModal, setShowModal] = useState(false);
    const [selectedProfile, setSelectedProfile] = useState(null);
    const [activeTab, setActiveTab] = useState(0);
    const limit = 8;

    const companyId = typeof window !== 'undefined'
        ? JSON.parse(localStorage.getItem("user"))?.company_id
        : null;

    const handleScroll = () => {
        const scrollPosition = document.documentElement.scrollTop + window.innerHeight;
        const scrollHeight = document.documentElement.scrollHeight;

        // Check if we've reached the bottom
        if (scrollPosition + 1 >= scrollHeight / 1.75) {
            // Load next page if not already loading
            if (status !== 'loading') {
                dispatch(setPage(page + 1));
            }
        }
    };

    const handleProfileClick = (profile) => {
        setSelectedProfile(profile);
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setSelectedProfile(null);
        setActiveTab(0);
    };

    const handleTabChange = (event, newValue) => {
        setActiveTab(newValue);
    };

    const handleSearchChange = (event) => {
        dispatch(setSearchQuery(event.target.value));
    };

    useEffect(() => {
        if (companyId) {
            dispatch(fetchProfiles({ companyId, searchQuery, limit, page }));
        }
    }, [dispatch, companyId, searchQuery, page]);

    useEffect(() => {
        window.addEventListener('scroll', handleScroll);
        return () => {
            window.removeEventListener('scroll', handleScroll);
        };
    }, [page]);

    // Tab panel component
    function TabPanel(props) {
        const { children, value, index, ...other } = props;

        return (
            <div
                role="tabpanel"
                hidden={value !== index}
                id={`tabpanel-${index}`}
                aria-labelledby={`tab-${index}`}
                className="overflow-auto max-h-[60vh] py-5"
                {...other}
            >
                {value === index && (
                    <Box>{children}</Box>
                )}
            </div>
        );
    }

    return (
        <Box className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 bg-gradient-to-b from-gray-50 to-white min-h-screen">
            <Box className="flex justify-between items-center mb-10">
                <Box>
                    <Typography variant="h4" className="font-bold text-gray-900 mb-2">
                        Employee Profiles
                    </Typography>
                    <Typography variant="body1" className="text-gray-500">
                        Manage and view employee information
                    </Typography>
                </Box>
                <Chip
                    label={`Total: ${profiles.length}`}
                    color="primary"
                    variant="outlined"
                    className="bg-blue-50"
                />
                <input
                    type="text"
                    value={searchQuery}
                    onChange={handleSearchChange}
                    placeholder="Search profiles..."
                    className="search-input"
                />
            </Box>

            <Grid container spacing={3}>
                {profiles.map((profile) => (
                    <Grid item xs={12} sm={6} md={4} lg={3} key={profile._id}>
                        <Card
                            className="h-full transition-all duration-300 hover:shadow-lg transform hover:-translate-y-1"
                            elevation={1}
                        >
                            <CardContent className="flex flex-col items-center">
                                <Badge
                                    overlap="circular"
                                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                                    badgeContent={
                                        profile.verify ?
                                            <CheckIcon className="bg-green-500 text-white p-1 rounded-full text-xs" /> :
                                            <PendingIcon className="bg-yellow-500 text-white p-1 rounded-full text-xs" />
                                    }
                                >
                                    <Avatar
                                        src={profile.employee_image}
                                        alt={`${profile.employee_first_name}`}
                                        className="w-20 h-20 mb-3 border-2 border-blue-100"
                                        sx={{ width: 80, height: 80 }}
                                    />
                                </Badge>
                                <Typography variant="h6" className="text-gray-800 text-center mt-2">
                                    {profile.employee_first_name} {profile.employee_last_name}
                                </Typography>
                                <Chip
                                    size="small"
                                    label={profile.verify ? 'Verified' : 'Pending'}
                                    color={profile.verify ? 'success' : 'warning'}
                                    className="mt-1"
                                />

                                <Box className="w-full mt-4 space-y-4">
                                    <Box>
                                        <Typography variant="caption" className="font-semibold text-gray-500 uppercase tracking-wider block mb-2">
                                            Skills
                                        </Typography>
                                        <Box className="flex flex-wrap gap-1.5">
                                            {profile.skills.slice(0, 3).map((skill, idx) => (
                                                <Chip
                                                    key={idx}
                                                    label={skill}
                                                    size="small"
                                                    className="bg-blue-50 text-blue-700"
                                                />
                                            ))}
                                            {profile.skills.length > 3 && (
                                                <Chip
                                                    label={`+${profile.skills.length - 3}`}
                                                    size="small"
                                                    className="bg-gray-100 text-gray-700"
                                                />
                                            )}
                                        </Box>
                                    </Box>

                                    <Box>
                                        <Typography variant="caption" className="font-semibold text-gray-500 uppercase tracking-wider block mb-2">
                                            Bank
                                        </Typography>
                                        <Typography variant="body2" className="text-gray-700 font-medium">
                                            {profile.bankDetails.bankName}
                                        </Typography>
                                    </Box>
                                </Box>
                            </CardContent>
                            <CardActions className="bg-gradient-to-r from-blue-50 to-indigo-50 border-t border-gray-100">
                                <Button
                                    size="small"
                                    color="primary"
                                    endIcon={<ChevronRightIcon />}
                                    onClick={() => handleProfileClick(profile)}
                                    className="text-blue-700 font-semibold hover:text-blue-800"
                                >
                                    View Details
                                </Button>
                            </CardActions>
                        </Card>
                    </Grid>
                ))}
            </Grid>
            {status === 'loading' && <p>Loading...</p>}
            {status === 'failed' && <p>Error: {error}</p>}

            {/* Modal */}
            <Modal
                open={showModal}
                onClose={closeModal}
                aria-labelledby="employee-profile-modal"
                className="flex items-center justify-center p-4"
            >
                <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-fadeIn">
                    {/* Modal Header */}
                    <Box className="flex justify-between items-center px-8 py-5 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
                        <Box className="flex items-center">
                            <Avatar
                                className="mr-5 bg-blue-100"
                                sx={{ width: 56, height: 56 }}
                            >
                                <PersonIcon className="text-blue-600" />
                            </Avatar>
                            <Box>
                                <Typography variant="h6" className="font-bold text-gray-800">
                                    {selectedProfile?.employeeId}
                                </Typography>
                                <Box className="flex items-center mt-1">
                                    {selectedProfile?.verify ? (
                                        <Chip
                                            icon={<VerifiedUserIcon />}
                                            label="Verified"
                                            size="small"
                                            color="success"
                                            variant="outlined"
                                        />
                                    ) : (
                                        <Chip
                                            icon={<PendingIcon />}
                                            label="Pending Verification"
                                            size="small"
                                            color="warning"
                                            variant="outlined"
                                        />
                                    )}
                                </Box>
                            </Box>
                        </Box>
                        <IconButton
                            onClick={closeModal}
                            className="text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                            size="large"
                        >
                            <CloseIcon />
                        </IconButton>
                    </Box>

                    {selectedProfile && (
                        <>
                            <Box className="border-b border-gray-200 bg-white sticky top-0 z-10">
                                <Tabs
                                    value={activeTab}
                                    onChange={handleTabChange}
                                    variant="scrollable"
                                    scrollButtons="auto"
                                    textColor="primary"
                                    indicatorColor="primary"
                                    className="px-8"
                                >
                                    <Tab
                                        icon={<VerifiedUserIcon className="mr-2" />}
                                        iconPosition="start"
                                        label="Skills"
                                    />
                                    <Tab
                                        icon={<LocationOnIcon className="mr-2" />}
                                        iconPosition="start"
                                        label="Address"
                                    />
                                    <Tab
                                        icon={<SchoolIcon className="mr-2" />}
                                        iconPosition="start"
                                        label="Academics"
                                    />
                                    <Tab
                                        icon={<BusinessCenterIcon className="mr-2" />}
                                        iconPosition="start"
                                        label="Experience"
                                    />
                                    <Tab
                                        icon={<AccountBalanceIcon className="mr-2" />}
                                        iconPosition="start"
                                        label="Bank Details"
                                    />
                                </Tabs>
                            </Box>

                            <Box className="px-8">
                                <TabPanel value={activeTab} index={0}>
                                    <Paper elevation={1} className="p-6 rounded-xl border border-gray-100">
                                        <Typography variant="h6" className="text-gray-800 mb-5 flex items-center">
                                            <VerifiedUserIcon className="h-5 w-5 mr-2 text-blue-600" />
                                            Skills & Competencies
                                        </Typography>
                                        <Box className="flex flex-wrap gap-2">
                                            {selectedProfile.skills.map((skill, index) => (
                                                <Chip
                                                    key={index}
                                                    label={skill}
                                                    className="px-3 py-1.5 bg-blue-50 text-blue-700 transition-all hover:bg-blue-100"
                                                />
                                            ))}
                                        </Box>
                                    </Paper>
                                </TabPanel>

                                <TabPanel value={activeTab} index={1}>
                                    <Box className="space-y-6">
                                        <Paper elevation={1} className="p-6 rounded-xl border border-gray-100">
                                            <Typography variant="h6" className="text-gray-800 mb-5 flex items-center">
                                                <LocationOnIcon className="h-5 w-5 mr-2 text-blue-600" />
                                                Address Information
                                            </Typography>
                                            <Grid container spacing={3}>
                                                <Grid item xs={12} md={6}>
                                                    <Paper className="bg-gray-50 p-4 rounded-lg">
                                                        <Typography variant="subtitle2" className="text-gray-600 mb-2">
                                                            Permanent Address
                                                        </Typography>
                                                        <Typography variant="body2" className="text-gray-700">
                                                            {selectedProfile.addressDetails.permanentAddress}
                                                        </Typography>
                                                    </Paper>
                                                </Grid>
                                                <Grid item xs={12} md={6}>
                                                    <Paper className="bg-gray-50 p-4 rounded-lg">
                                                        <Typography variant="subtitle2" className="text-gray-600 mb-2">
                                                            Current Address
                                                        </Typography>
                                                        <Typography variant="body2" className="text-gray-700">
                                                            {selectedProfile.addressDetails.currentAddress}
                                                        </Typography>
                                                    </Paper>
                                                </Grid>
                                                <Grid item xs={12}>
                                                    <Paper className="bg-gray-50 p-4 rounded-lg">
                                                        <Typography variant="subtitle2" className="text-gray-600 mb-2">
                                                            Aadhaar Card Number
                                                        </Typography>
                                                        <Typography variant="body2" className="text-gray-700 font-mono">
                                                            {selectedProfile.addressDetails.aadhaarCardNumber}
                                                        </Typography>
                                                    </Paper>
                                                </Grid>
                                            </Grid>
                                        </Paper>

                                        <Paper elevation={1} className="p-6 rounded-xl border border-gray-100">
                                            <Typography variant="h6" className="text-gray-800 mb-5 flex items-center">
                                                <ArticleIcon className="h-5 w-5 mr-2 text-blue-600" />
                                                Aadhaar Documents
                                            </Typography>
                                            <Grid container spacing={3}>
                                                <Grid item xs={12} md={6}>
                                                    <Typography variant="subtitle2" className="text-gray-600 mb-2">
                                                        Aadhaar Front
                                                    </Typography>
                                                    <Paper elevation={2} className="rounded-lg overflow-hidden group">
                                                        <img
                                                            src={selectedProfile.addressDetails.aadhaarFrontImageUrl}
                                                            alt="Aadhaar Front"
                                                            className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-300"
                                                        />
                                                    </Paper>
                                                </Grid>
                                                <Grid item xs={12} md={6}>
                                                    <Typography variant="subtitle2" className="text-gray-600 mb-2">
                                                        Aadhaar Back
                                                    </Typography>
                                                    <Paper elevation={2} className="rounded-lg overflow-hidden group">
                                                        <img
                                                            src={selectedProfile.addressDetails.aadhaarBackImageUrl}
                                                            alt="Aadhaar Back"
                                                            className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-300"
                                                        />
                                                    </Paper>
                                                </Grid>
                                            </Grid>
                                        </Paper>
                                    </Box>
                                </TabPanel>

                                <TabPanel value={activeTab} index={2}>
                                    <Paper elevation={1} className="p-6 rounded-xl border border-gray-100">
                                        <Typography variant="h6" className="text-gray-800 mb-5 flex items-center">
                                            <SchoolIcon className="h-5 w-5 mr-2 text-blue-600" />
                                            Academic Background
                                        </Typography>
                                        <Box className="space-y-6">
                                            {selectedProfile.academics.map((academic, index) => (
                                                <Box key={index} className="relative pl-10 pb-6 border-l-2 border-blue-200 last:pb-0">
                                                    <Box className="absolute left-0 top-0 transform -translate-x-1/2 w-5 h-5 rounded-full bg-blue-500 border-4 border-blue-100"></Box>
                                                    <Paper className="bg-blue-50 rounded-lg p-4">
                                                        <Box className="mb-2 flex items-center justify-between">
                                                            <Typography variant="subtitle1" className="font-semibold text-gray-800">
                                                                {academic.level}
                                                            </Typography>
                                                            <Chip
                                                                label={`${academic.fromYear} - ${academic.toYear}`}
                                                                size="small"
                                                                className="bg-blue-100 text-blue-700"
                                                            />
                                                        </Box>
                                                        <Typography variant="body2" className="font-medium text-gray-700">
                                                            {academic.institution}
                                                        </Typography>
                                                        <Typography variant="body2" className="mt-2 text-gray-600">
                                                            {academic.details}
                                                        </Typography>
                                                    </Paper>
                                                </Box>
                                            ))}
                                        </Box>
                                    </Paper>
                                </TabPanel>

                                <TabPanel value={activeTab} index={3}>
                                    <Paper elevation={1} className="p-6 rounded-xl border border-gray-100">
                                        <Typography variant="h6" className="text-gray-800 mb-5 flex items-center">
                                            <BusinessCenterIcon className="h-5 w-5 mr-2 text-blue-600" />
                                            Work Experience
                                        </Typography>
                                        {selectedProfile.pastExperience[0].companyName === "Fresher " ? (
                                            <Box className="flex items-center justify-center py-8 bg-blue-50 rounded-lg">
                                                <Box className="text-center">
                                                    <Avatar
                                                        className="bg-blue-100 p-4 mb-4 mx-auto"
                                                        sx={{ width: 80, height: 80 }}
                                                    >
                                                        <BusinessCenterIcon className="h-10 w-10 text-blue-600" />
                                                    </Avatar>
                                                    <Typography variant="h6" className="font-medium text-gray-800 mb-1">
                                                        Fresher
                                                    </Typography>
                                                    <Typography variant="body2" className="text-gray-600">
                                                        No prior work experience
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        ) : (
                                            <Paper className="bg-blue-50 p-5 rounded-lg">
                                                <Box className="mb-4">
                                                    <Typography variant="subtitle2" className="text-gray-600 mb-2">
                                                        Company
                                                    </Typography>
                                                    <Typography variant="body1" className="text-gray-800 font-medium">
                                                        {selectedProfile.pastExperience[0].companyName}
                                                    </Typography>
                                                </Box>
                                                <Grid container spacing={3} className="mb-4">
                                                    <Grid item xs={6}>
                                                        <Paper className="p-3 rounded-lg">
                                                            <Typography variant="subtitle2" className="text-gray-600 mb-1">
                                                                From Year
                                                            </Typography>
                                                            <Typography variant="body2" className="text-gray-800">
                                                                {selectedProfile.pastExperience[0].fromYear}
                                                            </Typography>
                                                        </Paper>
                                                    </Grid>
                                                    <Grid item xs={6}>
                                                        <Paper className="p-3 rounded-lg">
                                                            <Typography variant="subtitle2" className="text-gray-600 mb-1">
                                                                To Year
                                                            </Typography>
                                                            <Typography variant="body2" className="text-gray-800">
                                                                {selectedProfile.pastExperience[0].toYear}
                                                            </Typography>
                                                        </Paper>
                                                    </Grid>
                                                </Grid>
                                                <Box>
                                                    <Typography variant="subtitle2" className="text-gray-600 mb-2">
                                                        Designation
                                                    </Typography>
                                                    <Typography variant="body1" className="text-gray-800 font-medium">
                                                        {selectedProfile.pastExperience[0].designation}
                                                    </Typography>
                                                </Box>
                                            </Paper>
                                        )}
                                    </Paper>
                                </TabPanel>

                                <TabPanel value={activeTab} index={4}>
                                    <Box className="space-y-6">
                                        <Paper elevation={1} className="p-6 rounded-xl border border-gray-100">
                                            <Typography variant="h6" className="text-gray-800 mb-5 flex items-center">
                                                <AccountBalanceIcon className="h-5 w-5 mr-2 text-blue-600" />
                                                Bank Information
                                            </Typography>
                                            <Grid container spacing={3}>
                                                <Grid item xs={12} md={6}>
                                                    <Paper className="bg-blue-50 p-4 rounded-lg">
                                                        <Typography variant="subtitle2" className="text-gray-600 mb-1">
                                                            Bank Name
                                                        </Typography>
                                                        <Typography variant="body2" className="text-gray-800 font-medium">
                                                            {selectedProfile.bankDetails.bankName}
                                                        </Typography>
                                                    </Paper>
                                                </Grid>
                                                <Grid item xs={12} md={6}>
                                                    <Paper className="bg-blue-50 p-4 rounded-lg">
                                                        <Typography variant="subtitle2" className="text-gray-600 mb-1">
                                                            IFSC Code
                                                        </Typography>
                                                        <Typography variant="body2" className="text-gray-800 font-mono">
                                                            {selectedProfile.bankDetails.ifscCode}
                                                        </Typography>
                                                    </Paper>
                                                </Grid>
                                                <Grid item xs={12} md={6}>
                                                    <Paper className="bg-blue-50 p-4 rounded-lg">
                                                        <Typography variant="subtitle2" className="text-gray-600 mb-1">
                                                            Account Number
                                                        </Typography>
                                                        <Typography variant="body2" className="text-gray-800 font-mono">
                                                            {selectedProfile.bankDetails.accountNumber}
                                                        </Typography>
                                                    </Paper>
                                                </Grid>
                                                <Grid item xs={12} md={6}>
                                                    <Paper className="bg-blue-50 p-4 rounded-lg">
                                                        <Typography variant="subtitle2" className="text-gray-600 mb-1">
                                                            PAN Number
                                                        </Typography>
                                                        <Typography variant="body2" className="text-gray-800 font-mono">
                                                            {selectedProfile.bankDetails.panCardNumber}
                                                        </Typography>
                                                    </Paper>
                                                </Grid>
                                            </Grid>
                                        </Paper>

                                        <Paper elevation={1} className="p-6 rounded-xl border border-gray-100">
                                            <Typography variant="h6" className="text-gray-800 mb-5 flex items-center">
                                                <ArticleIcon className="h-5 w-5 mr-2 text-blue-600" />
                                                PAN Card
                                            </Typography>
                                            <Box className="border border-gray-200 rounded-lg overflow-hidden max-w-md mx-auto shadow-md group">
                                                <img
                                                    src={selectedProfile.bankDetails.panCardImageUrl}
                                                    alt="PAN Card"
                                                    className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-300"
                                                />
                                            </Box>
                                        </Paper>
                                    </Box>
                                </TabPanel>
                            </Box>

                            {/* Modal Footer */}
                            <Box className="px-8 py-5 border-t bg-gradient-to-r from-gray-50 to-blue-50 flex justify-end">
                                <Button
                                    variant="outlined"
                                    color="inherit"
                                    onClick={closeModal}
                                    className="mr-4"
                                >
                                    Close
                                </Button>
                                <Button
                                    variant="contained"
                                    color={selectedProfile.verify ? "primary" : "success"}
                                >
                                    {selectedProfile.verify ? 'Update Profile' : 'Verify Profile'}
                                </Button>
                            </Box>
                        </>
                    )}
                </Card>
            </Modal>
        </Box>
    );
};

export default EmployeeDocs;
