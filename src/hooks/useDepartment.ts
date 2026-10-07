'use client'

import { useEffect } from 'react'

import { useDispatch, useSelector } from 'react-redux'

import type { AppDispatch, RootState } from '@/redux/store'

import {
    fetchDepartments,
    createDepartment,
    updateDepartment,
    deleteDepartment
} from '@/redux/features/designation/departmentDesignationsSlice'

// ================= HOOK =================

export const useDepartment = () => {
    const dispatch: AppDispatch = useDispatch()

    const {
        departments,
        loading,
        createLoading,
        updateLoading,
        deleteLoading,
        error
    } = useSelector((state: RootState) => state.department)

    // ================= FETCH =================

    const getDepartments = () => {
        dispatch(fetchDepartments())
    }

    // ================= CREATE =================

    const addDepartment = async (payload: {
        department: string
        icon?: string
        color?: string
    }) => {
        return await dispatch(createDepartment(payload)).unwrap()
    }

    // ================= UPDATE =================

    const editDepartment = async (payload: {
        _id: string
        department?: string
        icon?: string
        color?: string
    }) => {
        return await dispatch(updateDepartment(payload)).unwrap()
    }

    // ================= DELETE =================

    const removeDepartment = async (id: string) => {
        return await dispatch(deleteDepartment(id)).unwrap()
    }

    // ================= AUTO LOAD =================

    useEffect(() => {
        if (!departments.length) {
            dispatch(fetchDepartments())
        }
    }, [dispatch])

    // ================= RETURN =================

    return {
        departments,
        loading,
        createLoading,
        updateLoading,
        deleteLoading,
        error,

        getDepartments,
        addDepartment,
        editDepartment,
        removeDepartment
    }
}
