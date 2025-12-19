export const baseUrl = () =>
  process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:5500';

export const getAuthHeaders = () => {
  const token = localStorage.getItem('token') || '';
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const companyId = localStorage.getItem('company_id') || user.company_id || '';

  return {
    Authorization: `Bearer ${token}`,
    'x-company-id': companyId,
    'Content-Type': 'application/json',
  };
};

export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${baseUrl()}${path}`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function apiPost<T>(path: string, body: any): Promise<T> {
  const res = await fetch(`${baseUrl()}${path}`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function apiPatch<T>(path: string, body: any): Promise<T> {
  const res = await fetch(`${baseUrl()}${path}`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export const todayISO = () => new Date().toISOString().slice(0, 10);
export const monthISO = () => new Date().toISOString().slice(0, 7);

export async function fetchOneDaily(owner_id: string, date: string) {
  const resp = await apiGet<{ data: any[] }>(
    `/department-performance/list?type=daily&date=${encodeURIComponent(date)}&owner_id=${encodeURIComponent(
      owner_id,
    )}&page=1&limit=1`,
  );
  return resp?.data?.[0] || null;
}

export async function fetchOneMonthly(owner_id: string, month: string) {
  const resp = await apiGet<{ data: any[] }>(
    `/department-performance/list?type=monthly&month=${encodeURIComponent(month)}&owner_id=${encodeURIComponent(
      owner_id,
    )}&page=1&limit=1`,
  );
  return resp?.data?.[0] || null;
}
