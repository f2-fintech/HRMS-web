import React from 'react'
import FineForm from '@/components/fine/FineForm'

interface FineFormDialogProps {
    fine: any
    onClose: () => void
    setToast: (message: string) => void
    month: string
    year: string
}

const FineFormDialog: React.FC<FineFormDialogProps> = ({
    fine,
    onClose,
    setToast,
    month,
    year
}) => {
    return (
        <FineForm
            fine={fine}
            onClose={onClose}
            setToast={setToast}
            month={month}
            year={year}
        />
    )
}

export default FineFormDialog
