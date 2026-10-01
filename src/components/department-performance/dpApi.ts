export const baseUrl = () =>
  process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:5500';

type HeadersOpts = { json?: boolean };

export const getAuthHeaders = (opts: HeadersOpts = { json: true }) => {
  const token = localStorage.getItem('token') || '';
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const companyId = localStorage.getItem('company_id') || user.company_id || '';

  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    'x-company-id': companyId,
  };

  if (opts.json !== false) {
    headers['Content-Type'] = 'application/json';
  }

  return headers;
};

async function parseResponse(res: Response) {
  const text = await res.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${baseUrl()}${path}`, {
    headers: getAuthHeaders({ json: true }),
  });

  if (!res.ok) {
    const data: any = await parseResponse(res);
    throw new Error(data?.message || data?.raw || 'Request failed');
  }

  return (await parseResponse(res)) as T;
}

export async function apiPost<T>(path: string, body: any): Promise<T> {
  const res = await fetch(`${baseUrl()}${path}`, {
    method: 'POST',
    headers: getAuthHeaders({ json: true }),
    body: JSON.stringify(body ?? {}),
  });

  if (!res.ok) {
    const data: any = await parseResponse(res);
    throw new Error(data?.message || data?.raw || 'Request failed');
  }

  return (await parseResponse(res)) as T;
}

export async function apiPatch<T>(path: string, body: any): Promise<T> {
  const res = await fetch(`${baseUrl()}${path}`, {
    method: 'PATCH',
    headers: getAuthHeaders({ json: true }),
    body: JSON.stringify(body ?? {}),
  });

  if (!res.ok) {
    const data: any = await parseResponse(res);
    throw new Error(data?.message || data?.raw || 'Request failed');
  }

  return (await parseResponse(res)) as T;
}

export async function apiUpload<T = any>(path: string, formData: FormData): Promise<T> {
  const res = await fetch(`${baseUrl()}${path}`, {
    method: 'POST',
    headers: getAuthHeaders({ json: false }),
    body: formData,
  });

  const data: any = await parseResponse(res);

  if (!res.ok) {
    throw new Error(data?.message || data?.raw || 'Upload failed');
  }

  return data as T;
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

// ===== TASK (sheet) helpers =====

export async function fetchTasks(params: {
  date?: string;
  status?: string;
  priority?: string;
  owner_id?: string;
  page?: number;
  limit?: number;
}) {
  const qs = new URLSearchParams();
  if (params.date) qs.set('date', params.date);
  if (params.status) qs.set('status', params.status);
  if (params.priority) qs.set('priority', params.priority);
  if (params.owner_id) qs.set('owner_id', params.owner_id);
  qs.set('page', String(params.page || 1));
  qs.set('limit', String(params.limit || 50));

  return apiGet<{ page: number; limit: number; total: number; data: any[] }>(
    `/department-performance/task/list?${qs.toString()}`,
  );
}

export async function createTask(payload: {
  date: string;
  name?: string;
  task?: string;
  topic?: string;
  durationMinutes?: number;
  assignedBy?: string;
  priority?: string;
  status?: string;
}) {
  return apiPost(`/department-performance/task`, payload);
}

export async function updateTask(id: string, payload: Record<string, any>) {
  return apiPatch(`/department-performance/task/${id}`, payload);
}

export async function deleteTask(id: string) {
  const res = await fetch(`${baseUrl()}/department-performance/task/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders({ json: true }),
  });
  const data: any = await parseResponse(res);
  if (!res.ok) throw new Error(data?.message || 'Delete failed');
  return data;
}
