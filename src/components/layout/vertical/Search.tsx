import { useState } from 'react'

import PropTypes from 'prop-types'
import { Box, IconButton, InputBase, useMediaQuery, useTheme, Button } from '@mui/material'
import ReplayIcon from '@mui/icons-material/Replay'
import SearchIcon from '@mui/icons-material/Search'

const Search = () => {
  const [inputValue, setInputValue] = useState('')
  const theme = useTheme()

  const isMobile = useMediaQuery('(max-width:480px)')
  const isTab = useMediaQuery('(max-width:920px)')

  const handleChange = event => {
    setInputValue(event.target.value)
  }

  const handleSearch = () => { }

  //Search data by pressing down the enter key
  const handleKeyDown = event => {
    if (event.keyCode == 13) {
      handleSearch()
    }
  }

  const handleReload = () => { }

  return (
    <Box backgroundColor='white' borderRadius='10px' width='40vw' height={isTab ? '4vh' : 'auto'} display='flex'>
      <InputBase
        sx={{
          ml: 2,
          flex: 1,
          width: '88%'
        }}
        placeholder='Search'
        id='input'
        value={inputValue}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        autoComplete='off' // Add this attribute to disable suggestions
      />
      <Button
        sx={{
          display: 'none',
          zIndex: 1,
          borderRadius: '50%',
          color: 'grey',
          float: 'right'
        }}
        id='reload-btn'
        type='button'
        onClick={handleReload}
      >
        <ReplayIcon />
      </Button>
      <IconButton
        sx={{
          p: 2
        }}
        onClick={handleSearch}
      >
        <SearchIcon />
      </IconButton>
    </Box>
  )
}

Search.propTypes = {}
export default Search
