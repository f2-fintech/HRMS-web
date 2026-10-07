'use client'

import { useState } from 'react'

import DashboardHeader from '@/components/admin-desk/DashboardHeader'
import DashboardCards from '@/components/admin-desk/DashboardCards'
import Filters from '@/components/admin-desk/Filters'
import AdminDataGrid from '@/components/admin-desk/AdminDataGrid'
import ExportSection from '@/components/admin-desk/ExportSection'
import DashboardViewModal from '@/components/admin-desk/DashboardViewModal'

export default function AdminDesk() {

  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0]
  )

  const [open, setOpen] = useState(false)

  const [title, setTitle] = useState('')

  const [rows, setRows] = useState<any[]>([])

  const handleView = (
    modalTitle: string,
    modalRows: any[]
  ) => {

    setTitle(modalTitle)

    setRows(modalRows)

    setOpen(true)

  }

  return (

    <>

      <DashboardHeader />

      <ExportSection />

      <DashboardCards

        selectedDate={selectedDate}

        onView={handleView}

      />

      <Filters

        selectedDate={selectedDate}

        onDateChange={setSelectedDate}

      />

      <AdminDataGrid
        selectedDate={selectedDate}
      />

      <DashboardViewModal

        open={open}

        title={title}

        rows={rows}

        onClose={() => setOpen(false)}

      />

    </>

  )

}
