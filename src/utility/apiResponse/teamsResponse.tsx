export const teamsApiResponse = async () => {
  const page = 1;
  const limit = 0;

  let token: string | null = null;

  if (typeof window !== "undefined") {
    token = localStorage?.getItem("token");
  }

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_APP_URL}/teams/get?page=${page}&limit=${limit}`,
    {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
    }
  );

  const teamsData = await response.json();

  console.log('teamsData:', teamsData);

  return teamsData;
};


export const teamsAllResponse = async () => {

  let token: string | null = null;

  if (typeof window !== "undefined") {
    token = localStorage?.getItem("token");
  }

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_APP_URL}/teams/get-all-teams`,
    {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
    }
  );

  const teamsData = await response.json();

  console.log('teamsData:', teamsData);

  return teamsData;
};

