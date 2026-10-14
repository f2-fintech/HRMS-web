'use client'

// React Imports
import { useRef, useState, useEffect } from 'react'

// MUI Imports
import Tooltip from '@mui/material/Tooltip'
import IconButton from '@mui/material/IconButton'

// Hook Imports
import { useSettings } from '@core/hooks/useSettings'

// MUI Theme Imports
import { createTheme, ThemeProvider } from '@mui/material/styles'

const ModeDropdown = () => {
  // States
  const [tooltipOpen, setTooltipOpen] = useState(false)

  // Refs
  const anchorRef = useRef<HTMLButtonElement>(null)

  // Hooks
  const { settings, updateSettings } = useSettings()

  // Theme configurations for dark and light modes
  const lightTheme = createTheme({
    palette: {
      mode: 'light',
    },
  })

  const darkTheme = createTheme({
    palette: {
      mode: 'dark',
    },
  })

  // Toggle between dark and light mode
  const handleToggle = () => {
    if (settings.mode === 'dark') {
      updateSettings({ mode: 'light' })
    }

    if (settings.mode === 'light') {
      updateSettings({ mode: 'dark' })
    }
  }

  const getModeIcon = () => {
    if (settings.mode === 'dark') {
      return 'ri-moon-clear-line'
    } else {
      return 'ri-sun-line'
    }
  }

  // Dynamically set the theme based on the current mode
  useEffect(() => {
    if (settings.mode === 'dark') {
      document.body.style.backgroundColor = '#121212' // Dark background
      document.body.style.color = '#ffffff' // Light text for dark mode
    } else {
      document.body.style.backgroundColor = '#ffffff' // Light background
      document.body.style.color = '#000000' // Dark text for light mode
    }
  }, [settings.mode])

  return (
    <>
      <Tooltip
        title={settings.mode + ' Mode'}
        onOpen={() => setTooltipOpen(true)}
        onClose={() => setTooltipOpen(false)}
        open={tooltipOpen}
        PopperProps={{ className: 'capitalize' }}
      >
        <IconButton ref={anchorRef} onClick={handleToggle} className='text-textPrimary'>
          <i className={getModeIcon()} />
        </IconButton>
      </Tooltip>

      {/* Apply the theme dynamically */}
      <ThemeProvider theme={settings.mode === 'dark' ? darkTheme : lightTheme}>
        {/* Rest of your application content */}
      </ThemeProvider>
    </>
  )
}

export default ModeDropdown
