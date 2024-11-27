// Next Imports
'use client'
import Link from 'next/link'

// MUI Imports
import IconButton from '@mui/material/IconButton'

// Third-party Imports
import classnames from 'classnames'

// Component Imports
import NavToggle from './NavToggle'
import NavSearch from '@components/layout/shared/search'
import ModeDropdown from '@components/layout/shared/ModeDropdown'
import UserDropdown from '@components/layout/shared/UserDropdown'

// Util Imports
import { verticalLayoutClasses } from '@layouts/utils/layoutClasses'
import { Button } from '@mui/material'

const NavbarContent = () => {
  const token = localStorage.getItem("token");

  return (
    <div className={classnames(verticalLayoutClasses.navbarContent, 'flex items-center justify-between gap-4 is-full')}>
      <div className='flex items-center gap-2 sm:gap-4'>
        <NavToggle />
        <NavSearch />
      </div>
      <div className='flex items-center'>
        <Link href={`${process.env.NEXT_PUBLIC_PAYROLL_URL}?token=${token}`} target='_blank'>
          {/* <Button>
            PayRoll <i className="ri-arrow-right-circle-fill"></i>
          </Button> */}
        </Link>
        <ModeDropdown />

        <UserDropdown />
      </div>
    </div>
  )
}

export default NavbarContent
