// MUI Imports
import { useEffect, useState } from 'react'

import { useTheme } from '@mui/material/styles'
import PerfectScrollbar from 'react-perfect-scrollbar'
import HolidayVillageIcon from '@mui/icons-material/HolidayVillage'
import EventAvailableIcon from '@mui/icons-material/EventAvailable'
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom'
import GroupIcon from '@mui/icons-material/Group'
import EventIcon from '@mui/icons-material/Event'
import AccessTimeIcon from '@mui/icons-material/AccessTime'
import DescriptionIcon from '@mui/icons-material/Description'
import FreeBreakfastIcon from '@mui/icons-material/FreeBreakfast'
import ProductionQuantityLimitsIcon from '@mui/icons-material/ProductionQuantityLimits'
import SchoolIcon from '@mui/icons-material/School'
import GavelIcon from '@mui/icons-material/Gavel'
import QueryStatsIcon from '@mui/icons-material/QueryStats'
import AssessmentIcon from '@mui/icons-material/Assessment'
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet'
import HeadsetMicIcon from '@mui/icons-material/HeadsetMic'
import VideoCallIcon from '@mui/icons-material/VideoCall'
import LocalHospitalIcon from '@mui/icons-material/LocalHospital'
import SupportAgentIcon from '@mui/icons-material/SupportAgent'

import InventoryIcon from '@mui/icons-material/Inventory';

// Menu Imports
import StyledVerticalNavExpandIcon from '@menu/styles/vertical/StyledVerticalNavExpandIcon'
import useVerticalNav from '@menu/hooks/useVerticalNav'
import { Menu, MenuItem, MenuSection } from '@menu/vertical-menu'
import type { VerticalMenuContextProps } from '@menu/components/vertical-menu/Menu'
import menuItemStyles from '@core/styles/vertical/menuItemStyles'
import menuSectionStyles from '@core/styles/vertical/menuSectionStyles'

// Expand Icon
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
  const theme = useTheme()
  const { isBreakpointReached, transitionDuration } = useVerticalNav()

  const ScrollWrapper = isBreakpointReached ? 'div' : PerfectScrollbar

  const [userRole, setUserRole] = useState<string | null>(null)

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}')

    setUserRole(user.role || null)
  }, [])

  return (
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
      <Menu
        menuItemStyles={menuItemStyles(theme)}
        renderExpandIcon={({ open }) => <RenderExpandIcon open={open} transitionDuration={transitionDuration} />}
        renderExpandedMenuItemIcon={{ icon: <i className='ri-circle-line' /> }}
        menuSectionStyles={menuSectionStyles(theme)}
      >
        <MenuItem href={`/`} icon={<i className='ri-dashboard-line' />}>
          Dashboard
        </MenuItem>

        {/* 👥 PEOPLE */}
        <MenuSection label='Employee Management'>
          {userRole === "0" && (
            <MenuItem href={`/company`} icon={<i className='ri-building-line' />}>
              Company
            </MenuItem>
          )}

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
              <MenuItem href={`/attendance`} icon={<AccessTimeIcon />}>
                Attendance
              </MenuItem>
              <MenuItem href={`/leaves`} icon={<EventAvailableIcon />}>
                Leaves
              </MenuItem>
              <MenuItem href={`/meetings`} icon={<VideoCallIcon />}>
                Meetings
              </MenuItem>
              <MenuItem href={userRole === "1" ? `/teams` : `/teams-dashboard`} icon={<GroupIcon />}>
                Teams
              </MenuItem>
              <MenuItem href={`/breaksheets`} icon={<FreeBreakfastIcon />}>
                Break Sheet
              </MenuItem>
              <MenuItem href={`/performance`} icon={<HeadsetMicIcon />}>
                Performance
              </MenuItem>

              {/* <MenuItem href={`/incentive-calculator`} icon={<AssessmentIcon />}>
                Incentive Calculator
              </MenuItem> */}

              <MenuItem href={`/departmentPerformance`} icon={<HolidayVillageIcon />}>
                Support Function
              </MenuItem>
              <MenuItem href={`/fine`} icon={<GavelIcon />}>
                Fine
              </MenuItem>
              <MenuItem href={`/expense-tracker`} icon={<AccountBalanceWalletIcon />}>
                Expense Tracker
              </MenuItem>
              <MenuItem href={`/queries`} icon={<QueryStatsIcon />}>
                Query
              </MenuItem>
              <MenuItem href={`/holidays`} icon={<EventIcon />}>
                Holiday
              </MenuItem>
              <MenuItem href={`/assests`} icon={<InventoryIcon />}>
                Assets
              </MenuItem>
              <MenuItem href={`/seat-layout`} icon={<HolidayVillageIcon />}>
                Seating Plan
              </MenuItem>
              <MenuItem href={`/policy`} icon={<DescriptionIcon />}>
                Policy
              </MenuItem>
              <MenuItem href={`/roombook`} icon={<MeetingRoomIcon />}>
                Room Booking
              </MenuItem>
            </>
          }

          <MenuItem href={userRole === "1" ? `/teams` : `/teams-dashboard`} icon={<GroupIcon />}>
            Teams
          </MenuItem>

          {userRole === '1' && (
            <MenuItem href={`/designation`} icon={<SchoolIcon />}>
              Designations
            </MenuItem>
          )}

          <MenuItem href={`/seat-layout`} icon={<HolidayVillageIcon />}>
            Seating Plan
          </MenuItem>
        </MenuSection>

        {userRole !== "0" && (
          <MenuSection label='Attendance & Time'>
            <MenuItem href={`/attendance`} icon={<AccessTimeIcon />}>
              Attendance
            </MenuItem>
            <MenuItem href={`/leaves`} icon={<EventAvailableIcon />}>
              Leaves
            </MenuItem>
            <MenuItem href={`/breaksheets`} icon={<FreeBreakfastIcon />}>
              Break Management
            </MenuItem>
            <MenuItem href={`/holidays`} icon={<EventIcon />}>
              Holiday
            </MenuItem>
            <MenuItem href={`/policy`} icon={<DescriptionIcon />}>
              Policies
            </MenuItem>
          </MenuSection>
        )}


        {userRole !== "0" && (
          <MenuSection label='Performance & Reporting'>
            <MenuItem href={`/performance`} icon={<HeadsetMicIcon />}>
              Performance
            </MenuItem>
            <MenuItem href={`/doctor-report`} icon={<LocalHospitalIcon />}>
              Field Visit Report
            </MenuItem>
          </MenuSection>
        )}

        {userRole !== "0" && (
          <MenuSection label='Finance & Expense'>
            <MenuItem href={`/expense-tracker`} icon={<AccountBalanceWalletIcon />}>
              Expense Tracker
            </MenuItem>
            <MenuItem href={`/fine`} icon={<GavelIcon />}>
              Fine
            </MenuItem>
          </MenuSection>
        )}

        {userRole !== "0" && (
          <MenuSection label='Operations & Support'>
            <MenuItem href={`/departmentPerformance`} icon={<AssessmentIcon />}>
              Support Operations
            </MenuItem>
            <MenuItem href={`/queries`} icon={<QueryStatsIcon />}>
              Raise Query
            </MenuItem>
          </MenuSection>
        )}

        {userRole !== "0" && (
          <MenuSection label='Meeting & Scheduling'>
            <MenuItem href={`/meetings`} icon={<VideoCallIcon />}>
              Meetings
            </MenuItem>
            <MenuItem href={`/roombook`} icon={<MeetingRoomIcon />}>
              Workspace Booking
            </MenuItem>
          </MenuSection>
        )}

        {userRole === '1' && (
          <MenuSection label='Assets & Inventory'>
            <MenuItem href={`/inventory`} icon={<ProductionQuantityLimitsIcon />}>
              Assets / Inventory
            </MenuItem>
          </MenuSection>
        )}
      </Menu>
    </ScrollWrapper>
  )
}

export default VerticalMenu
