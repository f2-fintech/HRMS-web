'use client'

// React Imports
import { useEffect, useState, type ReactElement } from 'react'
import { jwtDecode } from 'jwt-decode'
import { useRouter } from 'next/navigation'

interface JwtPayload {
  exp: number;
  iat: number;
  [key: string]: any;  // Adjust this based on your token structure
}

const LayoutWrapper = ({ verticalLayout }: { verticalLayout: ReactElement }) => {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const storedToken = localStorage?.getItem('token');

    if (storedToken) {
      const decodedToken = jwtDecode<JwtPayload>(storedToken);

      // Check if the token is expired
      if (decodedToken.exp * 1000 < Date.now()) {
        localStorage.removeItem('token');
        window.location.reload();
        router.push('/login');
      } else {
        setToken(storedToken);
      }
    } else {
      router.push('/login');
    }
  }, [router, token]);


  if (!token) {
    return null // or a loading spinner, etc.
  }

  return <div className='flex flex-col flex-auto'>{verticalLayout}</div>
}

export default LayoutWrapper
