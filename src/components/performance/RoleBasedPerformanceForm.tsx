'use client';

import React from 'react';
import EmployeeMorningForm from './EmployeeMorningForm';
import ManagerSnapshotForm from './ManagerSnapshotForm';

interface Props {
  role: string | number;
  handleClose: () => void;
  prefillDate?: string;
  performanceId?: string | null;
  performances?: any[];
  existingSnapshot?: any;
  designation?: string;
  onSaved?: () => void;
}

const RoleBasedPerformanceForm: React.FC<Props> = ({
  role,
  handleClose,
  prefillDate,
  performanceId,
  performances,
  existingSnapshot,
  designation,
  onSaved,
}) => {

  /** ROLE PRIORITY FIXED LOGIC:
   * Manager = 2  → big form
   * TL = 3       → big form
   * Employee = 4 → small form
   */
  const numericRole = Number(role);

  const shouldShowManagerForm = numericRole === 2 || numericRole === 3;

  if (shouldShowManagerForm) {
    return (
      <ManagerSnapshotForm
        handleClose={handleClose}
        performanceId={performanceId}
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
      performances={performances}
      prefillDate={prefillDate}
      onSaved={onSaved}
    />
  );
};

export default RoleBasedPerformanceForm;
