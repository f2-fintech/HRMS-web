import { useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import dayjs, { Dayjs } from 'dayjs'
import { toast } from 'react-toastify'
import { debounce } from 'lodash'

import type { RootState, AppDispatch } from '@/redux/store'
import { fetchFines } from '@/redux/features/fines/fineSlice'

export const useFineListing = () => {
    const dispatch = useDispatch<AppDispatch>()
    const { fines, total, loading } = useSelector((state: RootState) => state.fines)

    // Local states
    const [page, setPage] = useState(1)
    const [limit, setLimit] = useState(10)
    const [showForm, setShowForm] = useState(false)
    const [selectedFine, setSelectedFine] = useState<any>(null)
    const [selectedKeyword, setSelectedKeyword] = useState('')
    const [toasts, setToast] = useState('')
    const [openAlert, setOpenAlert] = useState(false)
    const [fineToDelete, setFineToDelete] = useState<string | null>(null)
    const [userRole, setUserRole] = useState<string>('')
    const [userId, setUserId] = useState<string>('')
    const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs())

    // Extract month/year for the query
    const month = selectedDate.format('MM')
    const year = selectedDate.format('YYYY')

    // Effect: get user role from localStorage
    useEffect(() => {
        const user = JSON.parse(localStorage.getItem('user') || '{}')
        setUserRole(user.role)
        setUserId(user.id)
    }, [])

    // Toast effect
    useEffect(() => {
        if (!toasts) return
        if (toasts === 'Something went wrong') {
            toast.error('Something went wrong', {
                position: 'top-right',
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
            })
        } else {
            toast.success(`${toasts}`, {
                position: 'top-right',
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
            })
        }
    }, [toasts])

    // Debounced fetch
    const debouncedFetchFines = useMemo(
        () =>
            debounce(() => {
                if (userRole === '1') {
                    dispatch(fetchFines({ page, limit, month, year, keyword: selectedKeyword }))
                } else if (Number(userRole) > 1) {
                    dispatch(fetchFines({ page, limit, month: '0', year, keyword: selectedKeyword }))
                }
            }, 300),
        [dispatch, page, limit, selectedKeyword, userRole, userId, month, year]
    )

    // Effect: run the debounced fetch
    useEffect(() => {
        debouncedFetchFines()
        return () => {
            debouncedFetchFines.cancel()
        }
    }, [debouncedFetchFines])

    // Handlers
    const handleDateChange = (newValue: Dayjs | null) => {
        if (newValue) {
            setSelectedDate(newValue)
        }
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSelectedKeyword(e.target.value)
    }

    const handlePageChange = (params: { page: number; pageSize: number }) => {
        setPage(params.page + 1)
        setLimit(params.pageSize)
    }

    const handleAddFine = () => {
        setSelectedFine(null)
        setShowForm(true)
    }

    // Delete Fine
    const handleConfirmDelete = () => {
        if (!fineToDelete) return
        fetch(`${process.env.NEXT_PUBLIC_APP_URL}/fines/delete/${fineToDelete}`, {
            method: 'DELETE',
        })
            .then((response) => response.json())
            .then((data) => {
                if (data.message) {
                    toast.success(data.message, { position: 'top-center' })
                    debouncedFetchFines()
                } else {
                    toast.error('Error deleting fine', { position: 'top-center' })
                }
            })
            .catch((error) => {
                console.error('Error', error)
                toast.error('Unexpected error occurred', { position: 'top-center' })
            })
            .finally(() => {
                setOpenAlert(false)
                setFineToDelete(null)
            })
    }

    const confirmDeleteFine = (id: string) => {
        setFineToDelete(id)
        setOpenAlert(true)
    }

    const handleCloseForm = () => setShowForm(false)

    // Figure out which data to show if userRole > 1
    const finesToDisplay = userRole === '1'
        ? fines
        : fines.map((fine) => ({
            _id: fine._id,
            employee: fine.employee,
            fineType: fine.fineType,
            fineAmount: fine.fineAmount,
            fineDate: fine.fineDate
        }))

    return {
        // State
        showForm,
        openAlert,
        selectedFine,
        selectedKeyword,
        selectedDate,
        userRole,
        userId,
        loading,
        finesToDisplay,
        total,
        page,
        limit,
        // Methods
        setShowForm,
        setOpenAlert,
        setToast,
        handleAddFine,
        handleCloseForm,
        handleConfirmDelete,
        confirmDeleteFine,
        handleDateChange,
        handleInputChange,
        handlePageChange,
        month,
        year
    }
}
