// utils/useRouterWithMount.ts
'use client'
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';


// Custom hook to handle router navigation with mounted check
const useRouterWithMount = () => {
    const [isMounted, setIsMounted] = useState(false);  // Track if the component is mounted
    const router = useRouter();

    useEffect(() => {
        setIsMounted(true); // Set isMounted to true once the component is mounted
    }, []);

    const navigateToProfile = (id: string) => {
        if (isMounted && router) {
            // Navigate to the profile page with the employee's ID
            router.push(`/profile/${id}`);
        }
    };

    return {
        navigateToProfile
    };
};

export default useRouterWithMount;
