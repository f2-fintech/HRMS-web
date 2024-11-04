'use client'

import React, { useState, useEffect } from 'react';
import { fetchEmployeesNotPunchedInToday } from '@/utility/apiResponse/getEmployeesNotPunchedIn';
import { Typography } from '@mui/material';

interface Employee {
  _id: string;
  first_name: string;
  last_name: string;
  image: string;
  location: string;
}

interface Props {
  selectedDate: string;
}

const NotPunchedInToday: React.FC<Props> = ({ selectedDate }) => {
  const [employeesNotPunchedIn, setEmployeesNotPunchedIn] = useState<Employee[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const employeesData = await fetchEmployeesNotPunchedInToday(selectedDate);
        setEmployeesNotPunchedIn(employeesData);
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch employees');
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedDate]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <div>
      <h1>Employees Not Punched In on {selectedDate}</h1>
      {employeesNotPunchedIn.length === 0 ? (
        <div>All employees have punched in on this date.</div>
      ) : (
        <div className="employee-grid">
          {employeesNotPunchedIn.map((employee) => (
            <div key={employee?._id} className="employee-card">

              <img src={employee.image} alt={`${employee.first_name} ${employee.last_name}`} className="employee-image" />
              <div className="employee-name">
                {employee.first_name} {employee.last_name}
              </div>
              <Typography style={{ color: 'blue' }}>{employee?.location.toUpperCase()}</Typography>
            </div>
          ))}
        </div>
      )}
      <style jsx>{`
        .employee-grid {
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          gap: 16px;
          margin-top: 16px;
        }

        .employee-card {
          padding: 16px;
          background-color: #f7f7f7;
          border: 1px solid #ddd;
          text-align: center;
          border-radius: 8px;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .employee-image {
          width: 80px;
          height: 80px;
          object-fit: cover;
          border-radius: 50%;
          margin-bottom: 8px;
        }

        .employee-name {
          font-weight: bold;
        }

        @media (max-width: 1024px) {
          .employee-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }

        @media (max-width: 768px) {
          .employee-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 480px) {
          .employee-grid {
            grid-template-columns: repeat(1, 1fr);
          }
        }
      `}</style>
    </div>
  );
};

export default NotPunchedInToday;
