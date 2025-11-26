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
  designation,                       
  onSaved,
}) => {
  const r = String(role);
  const shouldShowManager =
    r === '2' || isManagerLikeDesignation(designation);


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
      performances={performances}   
      prefillDate={prefillDate}
      onSaved={onSaved}
    />

  );
};

export default RoleBasedPerformanceForm;
