import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchConfiguration } from '@/redux/features/configuration/configurationSlice'
import { RootState, AppDispatch } from '@/redux/store'

const Logo = () => {
  const dispatch = useDispatch<AppDispatch>()

  const { data: configuration, loading } = useSelector((state: RootState) => state.configuration)

  useEffect(() => {
    if (!configuration) {
      dispatch(fetchConfiguration())
    }
  }, [dispatch, configuration])

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '180px' }}>
        <div className='spinner'></div>
      </div>
    )
  }

  return (
    <img
      src={configuration?.image || '/images/logos/placeholder-logo.png'}
      alt='Logo'
      width='150px'
      height='150px'
      style={{ objectFit: 'cover' }}
    />
  )
}

export default Logo
