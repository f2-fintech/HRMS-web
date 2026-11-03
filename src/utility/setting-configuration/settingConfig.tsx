export const fetchConfiguration = async () => {
    let token: string | null = null;
    const { company_id } = typeof window !== "undefined" ? JSON.parse(localStorage?.getItem("user")) : {};

    if (typeof window !== "undefined") {
        token = localStorage?.getItem("token");
    }

    try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/configuration`,
            {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token} ${company_id}`,
                    'Content-Type': 'application/json',
                },
            }
        );
        if (!response.ok) {
            throw new Error('Failed to fetch configuration');
        }
        const data = await response.json();

        // Assuming the API returns an array and you need the first item
        if (Array.isArray(data) && data.length > 0) {
            return data[0]; // Return the first object in the array
        } else {
            throw new Error('Configuration data is empty or invalid');
        }
    } catch (error) {
        console.error('Error fetching configuration:', error);
        throw error;
    }
};
