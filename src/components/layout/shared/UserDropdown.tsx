/* eslint-disable padding-line-between-statements */
'use client'

import { useEffect, useRef, useState, MouseEvent } from 'react'
import { useDispatch } from 'react-redux'

import { styled } from '@mui/material/styles'
import Badge from '@mui/material/Badge'
import Avatar from '@mui/material/Avatar'
import Popper from '@mui/material/Popper'
import Fade from '@mui/material/Fade'
import Paper from '@mui/material/Paper'
import ClickAwayListener from '@mui/material/ClickAwayListener'
import MenuList from '@mui/material/MenuList'
import Typography from '@mui/material/Typography'
import Divider from '@mui/material/Divider'
import MenuItem from '@mui/material/MenuItem'
import Button from '@mui/material/Button'

import { utility } from '@/utility'
import useRouterWithMount from '@/utility/useRouterWithMount'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

// Styled component for badge content
const BadgeContentSpan = styled('span')({
  width: 8,
  height: 8,
  borderRadius: '50%',
  cursor: 'pointer',
  backgroundColor: 'var(--mui-palette-success-main)',
  boxShadow: '0 0 0 2px var(--mui-palette-background-paper)'
})

const UserDropdown = () => {
  // States
  const [open, setOpen] = useState(false)
  const [userData, setUserData] = useState<any>(null)
  const [loggingOut, setLoggingOut] = useState(false)
  const dispatch = useDispatch()

  // Refs
  const anchorRef = useRef<HTMLDivElement>(null)

  const { navigateToProfile } = useRouterWithMount()
  const router = useRouter()

  // Hooks
  const { getRole } = utility()

  const handleDropdownOpen = () => {
    setOpen(prevOpen => !prevOpen)
  }

  const handleDropdownClose = (event?: MouseEvent<HTMLLIElement> | (MouseEvent | TouchEvent), url?: string) => {
    if (url) {
      // Use the custom hook to navigate to the profile page
      navigateToProfile(url)
    }

    if (anchorRef.current && anchorRef.current.contains(event?.target as HTMLElement)) {
      return
    }
    dispatch({ type: 'RESET' })

    localStorage.clear()

    router.push('/login')
    setOpen(false)
  }

  const handleAwayClose = (event?: MouseEvent<HTMLLIElement> | (MouseEvent | TouchEvent)) => {
    if (anchorRef.current && anchorRef.current.contains(event?.target as HTMLElement)) {
      return
    }

    setOpen(false)
  }

  const handleLogout = async () => {
    if (loggingOut) return
    setLoggingOut(true)

    const token = localStorage.getItem('token')

    if (token) {
      try {
        await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/auth/logout`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token })
        })
      } catch (error) {
        console.error('Error updating session on logout:', error)
      }
    }

    dispatch({ type: 'RESET' })

    localStorage.clear()

    router.push('/login')
    setOpen(false)
    setLoggingOut(false)
  }

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}')

    const fetchUserData = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/employees/get/${user.id}`)

        const data = await response.json()
        setUserData(data)
      } catch (error) {
        console.error('Error fetching user data:', error)
      }
    }

    if (user.id) {
      fetchUserData()
    }
  }, [])

  if (!userData) return null

  return (
    <>
      <Badge
        ref={anchorRef}
        overlap='circular'
        badgeContent={<BadgeContentSpan onClick={handleDropdownOpen} />}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        className='mis-2'
      >
        <Avatar
          alt={userData.first_name}
          src={userData.image}
          onClick={handleDropdownOpen}
          className='cursor-pointer bs-[38px] is-[38px]'
        />
      </Badge>
      <Popper
        open={open}
        transition
        disablePortal
        placement='bottom-end'
        anchorEl={anchorRef.current}
        className='min-is-[240px] !mbs-4 z-[1]'
      >
        {({ TransitionProps, placement }) => (
          <Fade
            {...TransitionProps}
            style={{
              transformOrigin: placement === 'bottom-end' ? 'right top' : 'left top'
            }}
          >
            <Paper className='shadow-lg'>
              <ClickAwayListener onClickAway={e => handleAwayClose(e as MouseEvent | TouchEvent)}>
                <MenuList>
                  <div className='flex items-center plb-2 pli-4 gap-2' tabIndex={-1}>
                    <Avatar alt={userData.first_name} src={userData.image} />
                    <div className='flex items-start flex-col'>
                      <Typography className='font-medium' color='text.primary'>
                        {userData.first_name} {userData.last_name}
                      </Typography>
                      <Typography variant='caption'>{getRole(userData.role_priority)}</Typography>
                    </div>
                  </div>
                  <Divider className='mlb-1' />
                  <MenuItem className='gap-3' onClick={() => navigateToProfile(userData._id)}>
                    <i className='ri-user-3-line' />
                    <Typography color='text.primary'>My Profile</Typography>
                  </MenuItem>
                  {Number(userData.role_priority) <= 1 && (
                    <Link href={'/account-settings'}>
                      <MenuItem className='gap-3'>
                        <i className='ri-settings-4-line' />
                        <Typography color='text.primary'>Setting</Typography>
                      </MenuItem>
                    </Link>
                  )}
                  {Number(userData.role_priority) === 1 && (
                    <Link href={'/employee-docs'}>
                      <MenuItem className='gap-3'>
                        <i className='ri-file-text-line' />
                        <Typography color='text.primary'>Employee Documents</Typography>
                      </MenuItem>
                    </Link>
                  )}

                  <div className='flex items-center plb-2 pli-4'>
                    <Button
                      fullWidth
                      variant='contained'
                      color='error'
                      size='small'
                      disabled={loggingOut}
                      endIcon={<i className='ri-logout-box-r-line' />}
                      onClick={handleLogout}
                      sx={{ '& .MuiButton-endIcon': { marginInlineStart: 1.5 } }}
                    >
                      {loggingOut ? 'Logging out...' : 'Logout'}
                    </Button>
                  </div>
                </MenuList>
              </ClickAwayListener>
            </Paper>
          </Fade>
        )}
      </Popper>
    </>
  )
}

export default UserDropdown
