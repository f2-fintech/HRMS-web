import React, { useEffect, useState } from 'react';
import { fetchConfiguration } from '@/utility/setting-configuration/settingConfig';

const Logo = () => {
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true); // Loading state

  useEffect(() => {
    const loadLogo = async () => {
      try {
        const config = await fetchConfiguration(); // Fetch configuration from the API
        if (config?.image) {
          setLogoUrl(config.image); // Set the logo URL
        } else {
          console.error('No logo URL found in configuration');
        }
      } catch (error) {
        console.error('Error fetching logo configuration:', error);
      } finally {
        setIsLoading(false); // End loading state
      }
    };

    loadLogo();
  }, []);

  if (isLoading) {
    // Render a spinner while loading
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '180px' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <img
      src={logoUrl || '/images/logos/placeholder-logo.png'}
      alt="Logo"
      width="150px"
      height="150px"
      style={{ objectFit: 'cover' }} // Maintain aspect ratio, but crop if needed
    />

  );
};

export default Logo;
