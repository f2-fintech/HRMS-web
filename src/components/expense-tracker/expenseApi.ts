'use client';

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

export async function apiDelete<T>(path: string): Promise<T> {
    const res = await fetch(`${baseUrl()}${path}`, {
        method: 'DELETE',
        headers: getAuthHeaders({ json: true }),
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

// =======================
// ✅ EXPENSE TRACKER TYPES
// =======================
export type CompanyAdminCategory = 'cake' | 'stationary' | 'water' | 'tea';

export type CompanyApprovalDropdown =
    | 'company_approval'
    | 'company_approval'
    | 'payout'
    | 'expense_channel'
    | 'payment_partners'
    | 'cashback_to_customer'
    | 'referral_partner'
    | 'payment';

export type VerifyPayload = {
    status: 'approved' | 'rejected';
    note?: string;
};

export type CreateExpensePayload = {
    date: string;
    manager_id?: string;
    company_admin: CompanyAdminCategory;
    company_approval: CompanyApprovalDropdown;
    paid_amount: number;
    description?: string;

    expense_channel?: string;
    payment_partners?: string;
    payout?: string;
    cashback_to_customer?: boolean;
    referral_partner?: string;
    payment?: string;
};

// =======================
// ✅ EXPENSE TRACKER APIs
// =======================

// ✅ Create expense with invoices upload (multipart)
export async function createExpense(payload: CreateExpensePayload, invoices: File[]) {
    const fd = new FormData();

    Object.entries(payload).forEach(([k, v]) => {
        if (v === undefined || v === null) return;
        fd.append(k, typeof v === 'boolean' ? String(v) : String(v));
    });

    (invoices || []).forEach((f) => fd.append('invoices', f));

    // ✅ backend route: POST /expense-tracker
    return await apiUpload(`/expense-tracker/create-expense
        `, fd);
}



// ✅ Update expense (optional: append new invoices)
export async function updateExpense(id: string, payload: Partial<CreateExpensePayload>, invoices?: File[]) {
    const fd = new FormData();

    Object.entries(payload).forEach(([k, v]) => {
        if (v === undefined || v === null) return;
        fd.append(k, typeof v === 'boolean' ? String(v) : String(v));
    });

    (invoices || []).forEach((f) => fd.append('invoices', f));

    // NOTE: apiUpload is POST only, so update ke liye direct fetch PATCH multipart:
    const res = await fetch(`${baseUrl()}/expense-tracker/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        headers: getAuthHeaders({ json: false }),
        body: fd,
    });

    const data: any = await parseResponse(res);
    if (!res.ok) throw new Error(data?.message || data?.raw || 'Upload failed');
    return data;
}

// ✅ List (role based) admin(all)/manager(assigned)/employee(my)
export async function listExpenses(params: {
    page?: number;
    limit?: number;
    owner_id?: string;
    manager_status?: string;
    admin_status?: string;
    date?: string;
    month?: number;
    year?: number;
}) {
    const qs = new URLSearchParams();

    if (params.page) qs.set('page', String(params.page));
    if (params.limit) qs.set('limit', String(params.limit));
    if (params.owner_id) qs.set('owner_id', params.owner_id);
    if (params.manager_status) qs.set('manager_status', params.manager_status);
    if (params.admin_status) qs.set('admin_status', params.admin_status);

    if (params.date) qs.set('date', params.date);
    if (params.month) qs.set('month', String(params.month));
    if (params.year) qs.set('year', String(params.year));

    return await apiGet<{ page: number; limit: number; total: number; data: any[] }>(
        `/expense-tracker/list?${qs.toString()}`,
    );
}


export async function getExpenseById(id: string) {
    return await apiGet<any>(`/expense-tracker/${encodeURIComponent(id)}`);
}


export async function managerVerifyExpense(id: string, payload: VerifyPayload) {
    return await apiPatch<any>(`/expense-tracker/${encodeURIComponent(id)}/manager-verify`, payload);
}

export async function adminVerifyExpense(
    id: string,
    payload: VerifyPayload,
    files: File[] = [],
) {
    const fd = new FormData();

    Object.entries(payload || {}).forEach(([k, v]) => {
        if (v === undefined || v === null) return;
        fd.append(k, String(v));
    });

    // ✅ MUST match backend interceptor
    files.forEach((f) => fd.append('admin_attachments', f));

    const res = await fetch(
        `${baseUrl()}/expense-tracker/${encodeURIComponent(id)}/admin-verify`,
        {
            method: 'PATCH',
            headers: getAuthHeaders({ json: false }),
            body: fd,
        },
    );

    const data: any = await parseResponse(res);
    if (!res.ok) throw new Error(data?.message || data?.raw || 'Upload failed');
    return data;
}


export async function softDeleteExpense(id: string) {
    return await apiDelete<any>(`/expense-tracker/${encodeURIComponent(id)}`);
}
export async function deleteExpense(id: string) {
    return softDeleteExpense(id);
}
// helpers
export const todayISO = () => new Date().toISOString().slice(0, 10);
