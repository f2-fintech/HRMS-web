import { useDispatch, useSelector } from 'react-redux'

import type { AppDispatch, RootState } from '@/redux/store'
import {
    fetchDesignationList,
    fetchDesignationsByDepartmentLevelWise,
    createDesignation,
    updateDesignation,
    deleteDesignation,
    clearLevelWiseData,
} from '@/redux/features/designation/designationV2Slice'

export const useDesignationV2 = () => {
    const dispatch = useDispatch<AppDispatch>()

    const {
        designations,
        levelWiseData,
        listLoading,
        levelWiseLoading,
        createLoading,
        updateLoading,
        deleteLoading,
        error
    } = useSelector((state: RootState) => state.designationV2)

    return {
        // Data
        designations,
        levelWiseData,

        // Loadings
        listLoading,
        levelWiseLoading,
        createLoading,
        updateLoading,
        deleteLoading,

        error,

        // Actions
        fetchList: (params: any) => dispatch(fetchDesignationList(params)),
        fetchLevelWise: (department_id: string, company_id?: string) =>
            dispatch(fetchDesignationsByDepartmentLevelWise({ department_id, company_id })),

        create: (data: any) => dispatch(createDesignation(data)),
        update: (id: string, data: any) => dispatch(updateDesignation({ id, ...data })),
        delete: (id: string) => dispatch(deleteDesignation(id)),

        clearLevelWise: () => dispatch(clearLevelWiseData()),
    }
}
