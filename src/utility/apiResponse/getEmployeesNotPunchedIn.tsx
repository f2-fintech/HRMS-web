export const fetchEmployeesNotPunchedInToday = async (
    date: string,
    page: number = 1,
    limit: number = 10
) => {
    let token: string | null = null;
    const { company_id } =
        typeof window !== "undefined" ? JSON.parse(localStorage?.getItem("user")!) : {};

    if (typeof window !== "undefined") {
        token = localStorage?.getItem("token");
    }

    const response = await fetch(
        `${process.env.NEXT_PUBLIC_APP_URL}/punch/employees-not-punches-by-date?date=${date}&page=${page}&limit=${limit}`,
        {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${token} ${company_id}`,
                'Content-Type': 'application/json',
            },
        }
    );

    if (!response.ok) {
        throw new Error('Failed to fetch punches');
    }

    // Expecting a structure like: { totalRecords: number, data: Employee[] }
    const result = await response.json();

    console.log('punchesData:', result);

    return result;
};
