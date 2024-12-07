import React, { useState, useEffect } from 'react';
import { fetchConfiguration } from '../setting-configuration/settingConfig';
import { Select, MenuItem, Typography } from '@mui/material';

const LocationDropdown = ({ selectedLocation, setSelectedLocation }) => {
    const [branches, setBranches] = useState([]);  // State to store fetched branches
    const [loading, setLoading] = useState(true);     // State to handle loading state
    const [error, setError] = useState(null);         // State to handle any errors

    // Fetch branches when the component mounts
    useEffect(() => {
        const getBranches = async () => {
            setLoading(true);  // Set loading state to true when fetching
            setError(null);    // Reset any previous error

            try {
                const configData = await fetchConfiguration(); // Fetch config data
                console.log('Fetched branches:', configData.branch);  // Log the fetched branches

                if (configData && Array.isArray(configData.branch)) {
                    setBranches(configData.branch);  // Set branches if it's an array
                } else {
                    setError('Branch data is missing or in an invalid format');
                }
            } catch (err) {
                setError('Failed to load branches');  // Set error state if fetch fails
            } finally {
                setLoading(false);  // Set loading state to false after fetching
            }
        };

        getBranches();  // Call the function to fetch branches
    }, []);  // Empty dependency array means it runs only on component mount

    // Show loading or error states
    if (loading) {
        return (
            <Select value="" disabled>
                <MenuItem>Loading...</MenuItem>
            </Select>
        );
    }

    if (error) {
        return (
            <Select value="" disabled>
                <MenuItem>{error}</MenuItem>
            </Select>
        );
    }

    // Render the dropdown with branches
    return (
        <Select
            label="Select Branch"
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}  // Update selected branch when changed
            fullWidth
        >
            {branches.length > 0 ? (
                branches.map((branch, index) => (
                    <MenuItem key={index} value={branch}>
                        {branch.charAt(0).toUpperCase() + branch.slice(1)} {/* Capitalize the first letter */}
                    </MenuItem>
                ))
            ) : (
                <MenuItem disabled>No branches available</MenuItem>
            )}
        </Select>
    );
};

export default LocationDropdown;
