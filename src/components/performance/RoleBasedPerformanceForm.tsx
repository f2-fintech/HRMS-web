'use client';

import React from 'react';

import EmployeeMorningForm from './EmployeeMorningForm';
import ManagerSnapshotForm from './ManagerSnapshotForm';
import AdminPerformanceForm from './AdminPerformanceForm';

interface Props {
  role: string | number;         // '1' = Admin, '2' = Manager/TL/Senior/BH, '3' = Employee
  handleClose: () => void;
  prefillDate?: string;
  performanceId?: string | null;
  performances?: any[];
  existingSnapshot?: any;        // if editing manager snapshot
  designation?: string;          // 👈 add this
  onSaved?: () => void;
}

const isManagerLikeDesignation = (designation?: string) => {
  if (!designation) return false;
  const d = designation.trim().toLowerCase();

  if (

    d === 'team leader' ||
    d.includes('team lead')
  ) {
    return true;
  }
  return false;
};

const RoleBasedPerformanceForm: React.FC<Props> = ({
  role,
  handleClose,
  prefillDate,
  performanceId,
  performances,
  existingSnapshot,
  designation,                          // 👈 add this
  onSaved,
}) => {
  const r = String(role);
  const shouldShowManager =
    r === '2' || isManagerLikeDesignation(designation);

  if (r === '1') {
    return (
      <AdminPerformanceForm
        handleClose={handleClose}
        performanceId={performanceId}
        prefillDate={prefillDate}
        performances={performances}
        onSaved={onSaved}
      />
    );
  }

  if (shouldShowManager) {
    return (
      <ManagerSnapshotForm
        handleClose={handleClose}
        snapshotId={performanceId}
        prefillDate={prefillDate}
        existingSnapshot={existingSnapshot}
        onSaved={onSaved}
      />
    );
  }

  return (
    <EmployeeMorningForm
      handleClose={handleClose}
      performanceId={performanceId}
      prefillDate={prefillDate}
      onSaved={onSaved}
    />
  );
};

export default RoleBasedPerformanceForm;
