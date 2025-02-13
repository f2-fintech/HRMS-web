


export const apiResponse = async (): Promise<any> => {
  const page = 1;
  const limit = 0;
  const keyword = '';

  const token = localStorage?.getItem("token") || '{}';
  const { company_id } = typeof window !== "undefined" ? JSON.parse(localStorage.getItem('user')) : {};

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL}/employees/get?page=${page}&limit=${limit}&keyword=${keyword}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token} ${company_id}`,
          'Content-Type': 'application/json'
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const employees = await response.json();


    return employees;
  } catch (error) {
    console.error('Error fetching employees:', error);
    throw error;
  }
};

export const employeesCountResponse = async (): Promise<any> => {

  const token = localStorage?.getItem("token") || '{}';
  const { company_id } = typeof window !== "undefined" ? JSON.parse(localStorage.getItem('user')) : {};

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL}/employees/all-employees-count`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token} ${company_id}`,
          'Content-Type': 'application/json'
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const employees = await response.json();

    return employees;
  } catch (error) {
    console.error('Error fetching employees:', error);
    throw error;
  }
};


export const fetchMonthlyAttendanceSummary = async (month: number, year: number, page = 1, limit = 10, keyword = '', location = ''): Promise<any> => {
  const token = localStorage?.getItem("token") || '{}';
  const { company_id } = typeof window !== "undefined" ? JSON.parse(localStorage.getItem('user')) : {};

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL}/attendence/monthly-summary?month=${month}&year=${year}&page=${page}&limit=${limit}&keyword=${keyword}&location=${location}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token} ${company_id}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const attendanceSummary = await response.json();

    return attendanceSummary;
  } catch (error) {
    console.error('Error fetching monthly attendance summary:', error);
    throw error;
  }
};


export const fetchTotalShiftTime = async (date: string): Promise<any> => {
  const token = localStorage?.getItem("token") || '{}';
  const { company_id } = typeof window !== "undefined" ? JSON.parse(localStorage.getItem('user') || '{}') : {};

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL}/punch/total-shift-time?date=${date}&company_id=${company_id}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const shiftTimeDetails = await response.json();

    return shiftTimeDetails;
  } catch (error) {
    console.error('Error fetching total shift time:', error);
    throw error;
  }
};


