// src/types/designation.ts
export interface CreateDesignationPayload {
    title: string;
    description?: string;
    department_id: string;
    level: number;
    role_group?: string;
    salary_min?: number;
    salary_max?: number;
    company_id: string;
}
