// MUI Imports
import { useEffect, useState } from 'react'

import Chip from '@mui/material/Chip'
import { useTheme } from '@mui/material/styles'

// Third-party Imports
import PerfectScrollbar from 'react-perfect-scrollbar'

// Type Imports
import HolidayVillageIcon from '@mui/icons-material/HolidayVillage'

// Component Imports

// Hook Imports

// Styled Component Imports
import EventAvailableIcon from '@mui/icons-material/EventAvailable'
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom';
import GroupIcon from '@mui/icons-material/Group'
import InventoryIcon from '@mui/icons-material/Inventory'
import EventIcon from '@mui/icons-material/Event'
import AccessTimeIcon from '@mui/icons-material/AccessTime'
import DescriptionIcon from '@mui/icons-material/Description'
import AccessTimeFilledIcon from '@mui/icons-material/AccessTimeFilled'
import FreeBreakfastIcon from '@mui/icons-material/FreeBreakfast'
import ProductionQuantityLimitsIcon from '@mui/icons-material/ProductionQuantityLimits'
import SchoolIcon from '@mui/icons-material/School'
import GavelIcon from '@mui/icons-material/Gavel'

import QueryStatsIcon from '@mui/icons-material/QueryStats';
import AssessmentIcon from '@mui/icons-material/Assessment';

import StyledVerticalNavExpandIcon from '@menu/styles/vertical/StyledVerticalNavExpandIcon'
import useVerticalNav from '@menu/hooks/useVerticalNav'
import { Menu, SubMenu, MenuItem, MenuSection } from '@menu/vertical-menu'
import type { VerticalMenuContextProps } from '@menu/components/vertical-menu/Menu'

// Style Imports
import menuItemStyles from '@core/styles/vertical/menuItemStyles'
import menuSectionStyles from '@core/styles/vertical/menuSectionStyles'

type RenderExpandIconProps = {
  open?: boolean
  transitionDuration?: VerticalMenuContextProps['transitionDuration']
}

const RenderExpandIcon = ({ open, transitionDuration }: RenderExpandIconProps) => (
  <StyledVerticalNavExpandIcon open={open} transitionDuration={transitionDuration}>
    <i className='ri-arrow-right-s-line' />
  </StyledVerticalNavExpandIcon>
)

const VerticalMenu = ({ scrollMenu }: { scrollMenu: (container: any, isPerfectScrollbar: boolean) => void }) => {
  // Hooks
  const theme = useTheme()
  const { isBreakpointReached, transitionDuration } = useVerticalNav()

  const ScrollWrapper = isBreakpointReached ? 'div' : PerfectScrollbar

  const [userRole, setUserRole] = useState<string>('')

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}')

    setUserRole(user.role || null)
  }, [])

  return (
    // eslint-disable-next-line lines-around-comment
    /* Custom scrollbar instead of browser scroll, remove if you want browser scroll only */
    <ScrollWrapper
      {...(isBreakpointReached
        ? {
          className: 'bs-full overflow-y-auto overflow-x-hidden',
          onScroll: container => scrollMenu(container, false)
        }
        : {
          options: { wheelPropagation: false, suppressScrollX: true },
          onScrollY: container => scrollMenu(container, true)
        })}
    >
      {/* Incase you also want to scroll NavHeader to scroll with Vertical Menu, remove NavHeader from above and paste it below this comment */}
      {/* Vertical Menu */}
      <Menu
        menuItemStyles={menuItemStyles(theme)}
        renderExpandIcon={({ open }) => <RenderExpandIcon open={open} transitionDuration={transitionDuration} />}
        renderExpandedMenuItemIcon={{ icon: <i className='ri-circle-line' /> }}
        menuSectionStyles={menuSectionStyles(theme)}
      >
        {/* <SubMenu
          label='Dashboard13'
          icon={<i className='ri-home-smile-line' />}
          suffix={<Chip label='5' size='small' color='error' />}
        >
          <MenuItem
            href={`${process.env.NEXT_PUBLIC_PRO_URL}/dashboards/crm`}
            suffix={<Chip label='Pro' size='small' color='primary' variant='tonal' />}
            target='_blank'
          >
            CRM
          </MenuItem>
          <MenuItem href='/'>Analytics</MenuItem>
          <MenuItem
            href={`${process.env.NEXT_PUBLIC_PRO_URL}/dashboards/ecommerce`}
            suffix={<Chip label='Pro' size='small' color='primary' variant='tonal' />}
            target='_blank'

          >
            eCommerce
          </MenuItem>
          <MenuItem
            href={`${process.env.NEXT_PUBLIC_PRO_URL}/dashboards/academy`}
            suffix={<Chip label='Pro' size='small' color='primary' variant='tonal' />}
            target='_blank'
          >
            Academy
          </MenuItem>
          <MenuItem
            href={`${process.env.NEXT_PUBLIC_PRO_URL}/dashboards/logistics`}
            suffix={<Chip label='Pro' size='small' color='primary' variant='tonal' />}
            target='_blank'
          >
            Logistics
          </MenuItem>
        </SubMenu>
        <SubMenu
          label='Front Pages'
          icon={<i className='ri-file-copy-line' />}
          suffix={<Chip label='Pro' size='small' color='primary' variant='tonal' />}
        >
          <MenuItem href={`${process.env.NEXT_PUBLIC_PRO_URL}/front-pages/landing-page`} target='_blank'>
            Landing
          </MenuItem>
          <MenuItem href={`${process.env.NEXT_PUBLIC_PRO_URL}/front-pages/pricing`} target='_blank'>
            Pricing
          </MenuItem>
          <MenuItem href={`${process.env.NEXT_PUBLIC_PRO_URL}/front-pages/payment`} target='_blank'>
            Payment
          </MenuItem>
          <MenuItem href={`${process.env.NEXT_PUBLIC_PRO_URL}/front-pages/checkout`} target='_blank'>
            Checkout
          </MenuItem>
          <MenuItem href={`${process.env.NEXT_PUBLIC_PRO_URL}/front-pages/help-center`} target='_blank'>
            Help Center
          </MenuItem>
        </SubMenu> */}

        <MenuItem
          href={`/`}
          icon={<i className='ri-dashboard-line' />}

        // suffix={<Chip label='Pro' size='small' color='primary' variant='tonal' />}
        >
          Dashboard
        </MenuItem>
        <MenuSection label='Apps & Pages'>
          {userRole === "0" &&
            <MenuItem href={`/company`} icon={<i className='ri-user-3-line' />}>
              company
            </MenuItem>
          }
          <MenuItem href={`/employees`} icon={<i className='ri-user-3-line' />}>
            Employees
          </MenuItem>
          {userRole === "0" &&
            <MenuItem href={`/payment`} icon={<i className='ri-user-3-line' />}>
              Payment
            </MenuItem>
          }
          {userRole !== "0" &&
            <>
              <MenuItem href={`/holidays`} icon={<EventIcon />}>
                Holiday
              </MenuItem>
              <MenuItem href={`/attendance`} icon={<AccessTimeIcon />}>
                Attendance
              </MenuItem>
              <MenuItem href={`/leaves`} icon={<EventAvailableIcon />}>
                Leaves
              </MenuItem>
              <MenuItem href={userRole === "1" ? `/teams` : `/teams-dashboard`} icon={<GroupIcon />}>
                Teams
              </MenuItem>

              <MenuItem href={`/breaksheets`} icon={<FreeBreakfastIcon />}>
                Break Sheet
              </MenuItem>
              <MenuItem href={`/fine`} icon={<GavelIcon />}>
                Fine
              </MenuItem>
               <MenuItem href={`/performance`} icon={<AssessmentIcon />}>
                Performance
              </MenuItem>
              <MenuItem href={`/queries`} icon={<QueryStatsIcon />}>
                Query
              </MenuItem>

              <MenuItem href={`/assests`} icon={<InventoryIcon />}>
                Assets
              </MenuItem>
              <MenuItem href={`/seat-layout`} icon={<HolidayVillageIcon />}>
                Seating Plan
              </MenuItem>
              <MenuItem href={`/policy`} icon={<DescriptionIcon />}>
                Policy
              </MenuItem><MenuItem href={`/roombook`} icon={<MeetingRoomIcon />}>
                Room Booking
              </MenuItem>
            </>
          }

          {userRole === '1' && (
            <MenuItem href={`/inventory`} icon={<ProductionQuantityLimitsIcon />}>
              Inventory
            </MenuItem>
          )}

          {userRole === '1' && (
            <MenuItem href={`/designation`} icon={<SchoolIcon />}>
              Designations
            </MenuItem>
          )}

          {/* 
          <MenuItem href={`/timesheets`} icon={<AccessTimeFilledIcon />}>
            Time Sheet
          </MenuItem> */}

        </MenuSection>
      </Menu>
    </ScrollWrapper >
  )
}

export default VerticalMenu
