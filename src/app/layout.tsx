// Third-party Imports
import 'react-perfect-scrollbar/dist/css/styles.css'

import NextTopLoader from 'nextjs-toploader';
// Type Imports
import type { ChildrenType } from '@core/types'

// Style Imports
import '@/app/globals.css'

import ReduxProvider from '@/redux/provider';

import '@/assets/iconify-icons/bundle-icons-css.ts'



export const metadata = {
  title: 'F2-Fintech',
  description:
    'Develop next-level web apps with Materio Dashboard Free - NextJS. Now, updated with lightning-fast routing powered by MUI and App router.'
}

const RootLayout = ({ children }: ChildrenType) => {
  // Vars
  const direction = 'ltr'

  return (
    <html id='__next' dir={direction}>
      <body className='flex is-full min-bs-full flex-auto flex-col'>
        <ReduxProvider>
          <NextTopLoader
            color="red"
            initialPosition={0.08}
            height={4}
            showSpinner={true}
            easing="ease"
            speed={300}
            shadow="0 0 10px #2299DD,0 0 5px #2299DD"
          />
          {children}
        </ReduxProvider>
      </body>
    </html>
  )
}

export default RootLayout
