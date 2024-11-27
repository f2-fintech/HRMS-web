export const fetchConfiguration = async () => {
    try {
        const response = await fetch('http://localhost:5500/configuration');
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
