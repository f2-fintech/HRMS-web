export const TDS_RATE = 0.05;

export interface IncentiveRatesConfig {
    mult: number;      // Target = salary × mult (default 200)
    addon: number;     // Add to target ₹ (default 20,00,000)
    step: number;      // Slab step % (default 25%)
    e0: number;        // Employee slab 1 % (0.25%)
    e1: number;        // Employee slab 2 % (0.30%)
    e2: number;        // Employee slab 3 % (0.35%)
    e3: number;        // Employee slab 4 % (0.40%)
    e4: number;        // Employee slab 5+ % (0.50%)
    tl: number;        // TL on employee % (0.12%)
    mt: number;        // Manager on employee under TL % (0.09%)
    ms: number;        // Manager direct: first slab % (0.10%)
    mi: number;        // Manager direct: rise per slab % (0.05%)
    mc: number;        // Manager direct: maximum % (0.50%)
    tlo: number;       // TL own case % (0.20%)
    mo: number;        // Manager own case % (0.35%)
    mot: number;       // Manager on TL own case % (0.10%)
}

export const DEFAULT_RATES: IncentiveRatesConfig = {
    mult: 200,
    addon: 2000000,
    step: 25,
    e0: 0.25,
    e1: 0.30,
    e2: 0.35,
    e3: 0.40,
    e4: 0.50,
    tl: 0.12,
    mt: 0.09,
    ms: 0.10,
    mi: 0.05,
    mc: 0.50,
    tlo: 0.20,
    mo: 0.35,
    mot: 0.10,
};

export const RATE_LABELS: Record<keyof IncentiveRatesConfig, string> = {
    mult: 'Target = salary ×',
    addon: 'Add to target ₹',
    step: 'Slab step %',
    e0: 'Employee slab 1 %',
    e1: 'Employee slab 2 %',
    e2: 'Employee slab 3 %',
    e3: 'Employee slab 4 %',
    e4: 'Employee slab 5+ %',
    tl: 'TL on employee %',
    mt: 'Manager on employee under TL %',
    ms: 'Manager direct: first slab %',
    mi: 'Manager direct: rise per slab %',
    mc: 'Manager direct: maximum %',
    tlo: 'TL own case %',
    mo: 'Manager own case %',
    mot: 'Manager on TL own case %',
};

export const ROLES = [
    {
        id: "EMPLOYEE",
        code: "emp",
        label: "Employee",
        icon: "👤",
        sub: "Target & slabs from 0.25%",
        color: "#2563EB",
        bg: "bg-blue-50",
        border: "border-blue-600",
        text: "text-blue-600",
        hasSalary: true,
    },
    {
        id: "TEAM_LEADER",
        code: "tl",
        label: "Team Leader (TL)",
        icon: "👥",
        sub: "Flat 0.20% on disbursed",
        color: "#0891B2",
        bg: "bg-cyan-50",
        border: "border-cyan-600",
        text: "text-cyan-600",
        hasSalary: false,
    },
    {
        id: "MANAGER",
        code: "mg",
        label: "Manager",
        icon: "🏢",
        sub: "Flat 0.35% on disbursed",
        color: "#7C3AED",
        bg: "bg-violet-50",
        border: "border-violet-600",
        text: "text-violet-600",
        hasSalary: false,
    },
] as const;

export const PHASE_COLORS = [
    "#3B82F6",
    "#8B5CF6",
    "#06B6D4",
    "#10B981",
    "#F59E0B",
    "#EF4444",
    "#EC4899",
    "#14B8A6",
] as const;

export interface SlabRow {
    lo: number;
    hi: number;
    business: number;
    rate: number;
    incentive: number;
}

export function calculateSlabs(
    d: number,
    s: number,
    rateFn: (i: number) => number,
    n: number,
    config: IncentiveRatesConfig = DEFAULT_RATES
): { tot: number; rows: SlabRow[] } {
    const j = s * config.mult;
    const p = j + config.addon;
    let tot = 0;
    const rows: SlabRow[] = [];

    for (let i = 0; i < n; i++) {
        const lo = i === 0 ? j : p * (1 + (config.step / 100) * (i - 1));
        const hi = i === n - 1 ? Infinity : p * (1 + (config.step / 100) * i);
        const b = Math.max(0, Math.min(d, hi) - lo);
        const r = rateFn(i);
        const a = (b * r) / 100;
        tot += a;
        rows.push({
            lo,
            hi,
            business: b,
            rate: r,
            incentive: a,
        });
    }

    return { tot, rows };
}

export function getManagerSlabCount(config: IncentiveRatesConfig = DEFAULT_RATES): number {
    let n = 1;
    while (n < 60 && config.ms + config.mi * (n - 1) < config.mc) {
        n++;
    }
    return n + 1;
}

export interface RecipientPayout {
    name: string;        // 'Employee' | 'TL' | 'Manager'
    roleCode: string;    // 'emp' | 'tl' | 'mg'
    amount: number;
    rateText: string;
    tds: number;
    net: number;
}

export interface CalculationResult {
    role: string;
    roleCode: 'emp' | 'tl' | 'mg';
    reporting: 'tl' | 'mg';
    salary: number;
    disbursed: number;
    justifiedSalary: number;
    excessAboveTarget: number;
    payouts: RecipientPayout[];
    userIncentive: number;
    userTds: number;
    userNetIncentive: number;
    employeeSlabs?: { tot: number; rows: SlabRow[] };
    managerSlabs?: { tot: number; rows: SlabRow[] };
    explanations: string[];
    belowThreshold: boolean;
    error?: string;
    // Backward compatibility
    grossIncentive: number;
    tdsAmount: number;
    netIncentive: number;
    phases: any[];
}

export function normalizeRole(roleInput: string): { normalizedRole: string; roleCode: 'emp' | 'tl' | 'mg' } {
    const r = String(roleInput || "").trim().toUpperCase();
    if (r === "TL" || r === "TEAM_LEADER" || r === "TEAM LEADER") {
        return { normalizedRole: "TEAM_LEADER", roleCode: "tl" };
    }
    if (r === "MG" || r === "MANAGER") {
        return { normalizedRole: "MANAGER", roleCode: "mg" };
    }
    return { normalizedRole: "EMPLOYEE", roleCode: "emp" };
}

export function calculate(
    roleInput: string,
    salaryInput: number | string,
    disbursedInput: number | string,
    reportingOrManagerFileType: string = "tl",
    ratesConfig: IncentiveRatesConfig = DEFAULT_RATES
): CalculationResult {
    const { normalizedRole, roleCode } = normalizeRole(roleInput);
    const salary = Math.max(0, Number(salaryInput) || 0);
    const disbursed = Math.max(0, Number(disbursedInput) || 0);
    const config = ratesConfig || DEFAULT_RATES;

    // Normalizing reporting choice
    const rep = (reportingOrManagerFileType === "mg" || reportingOrManagerFileType === "manager" || reportingOrManagerFileType === "own") ? "mg" : "tl";

    const justifiedSalary = roleCode === "emp" ? salary * config.mult : 0;
    const excessAboveTarget = Math.max(0, disbursed - justifiedSalary);
    const belowThreshold = roleCode === "emp" && disbursed <= justifiedSalary;

    const payouts: RecipientPayout[] = [];
    const explanations: string[] = [];
    let employeeSlabs: { tot: number; rows: SlabRow[] } | undefined;
    let managerSlabs: { tot: number; rows: SlabRow[] } | undefined;
    let userIncentive = 0;
    let phases: any[] = [];

    if (roleCode === "emp") {
        employeeSlabs = calculateSlabs(
            disbursed,
            salary,
            (i) => (config as any)[`e${i}`] ?? 0.50,
            5,
            config
        );

        const empGross = employeeSlabs.tot;
        userIncentive = empGross;

        payouts.push({
            name: "Employee",
            roleCode: "emp",
            amount: empGross,
            rateText: "Slab rates 0.25% - 0.50%",
            tds: empGross * TDS_RATE,
            net: empGross * (1 - TDS_RATE),
        });

        if (disbursed <= justifiedSalary) {
            explanations.push(
                `Employee: no incentive until disbursed passes the target of ${rs(justifiedSalary)}. This amount is below the target, so the incentive is ₹0.`
            );
        } else {
            explanations.push(
                `Employee: no incentive until disbursed passes the target of ${rs(justifiedSalary)}. Above the target, each slab pays its own rate on the business inside it.`
            );
        }

        if (rep === "tl") {
            const tlGross = excessAboveTarget * (config.tl / 100);
            const mgGross = excessAboveTarget * (config.mt / 100);

            payouts.push({
                name: "TL",
                roleCode: "tl",
                amount: tlGross,
                rateText: `${config.tl}% of amount above target`,
                tds: tlGross * TDS_RATE,
                net: tlGross * (1 - TDS_RATE),
            });

            payouts.push({
                name: "Manager",
                roleCode: "mg",
                amount: mgGross,
                rateText: `${config.mt}% of amount above target`,
                tds: mgGross * TDS_RATE,
                net: mgGross * (1 - TDS_RATE),
            });

            explanations.push(
                `TL: ${config.tl}% of the amount above target (${rs(excessAboveTarget)}).`,
                `Manager: ${config.mt}% of the amount above target (${rs(excessAboveTarget)}).`
            );
        } else {
            // Directly TL / Manager
            const mgrCount = getManagerSlabCount(config);
            managerSlabs = calculateSlabs(
                disbursed,
                salary,
                (i) => Math.min(config.mc, config.ms + config.mi * i),
                mgrCount,
                config
            );
            const mgGross = managerSlabs.tot;

            payouts.push({
                name: "Manager",
                roleCode: "mg",
                amount: mgGross,
                rateText: `Direct slabs: ${config.ms}% rising by ${config.mi}% up to ${config.mc}%`,
                tds: mgGross * TDS_RATE,
                net: mgGross * (1 - TDS_RATE),
            });

            explanations.push(
                `Manager (employee reports directly): rate starts at ${config.ms}% and rises by ${config.mi}% each slab up to ${config.mc}%.`
            );
        }

        // Convert employeeSlabs rows to phases for backwards compatibility
        phases = employeeSlabs.rows.map((row, idx) => ({
            phase: idx + 1,
            from: row.lo,
            to: isFinite(row.hi) ? row.hi : "Above",
            eligibleAmount: row.business,
            ratePercent: row.rate,
            incentive: row.incentive,
        }));
    } else if (roleCode === "tl") {
        const tlGross = disbursed * (config.tlo / 100);
        userIncentive = tlGross;

        payouts.push({
            name: "TL",
            roleCode: "tl",
            amount: tlGross,
            rateText: `${config.tlo}% of disbursed`,
            tds: tlGross * TDS_RATE,
            net: tlGross * (1 - TDS_RATE),
        });

        explanations.push(`TL: ${config.tlo}% of ${rs(disbursed)}.`);

        phases = [
            {
                phase: 1,
                from: 0,
                to: disbursed,
                eligibleAmount: disbursed,
                ratePercent: config.tlo,
                incentive: tlGross,
            },
        ];
    } else {
        // Manager own case
        const mgGross = disbursed * (config.mo / 100);
        userIncentive = mgGross;

        payouts.push({
            name: "Manager",
            roleCode: "mg",
            amount: mgGross,
            rateText: `${config.mo}% of disbursed`,
            tds: mgGross * TDS_RATE,
            net: mgGross * (1 - TDS_RATE),
        });

        explanations.push(`Manager: ${config.mo}% of ${rs(disbursed)}.`);

        phases = [
            {
                phase: 1,
                from: 0,
                to: disbursed,
                eligibleAmount: disbursed,
                ratePercent: config.mo,
                incentive: mgGross,
            },
        ];
    }

    const userTds = userIncentive * TDS_RATE;
    const userNetIncentive = userIncentive - userTds;

    return {
        role: normalizedRole,
        roleCode,
        reporting: rep,
        salary,
        disbursed,
        justifiedSalary,
        excessAboveTarget,
        payouts,
        userIncentive,
        userTds,
        userNetIncentive,
        employeeSlabs,
        managerSlabs,
        explanations,
        belowThreshold,
        // Backward compatibility:
        grossIncentive: userIncentive,
        tdsAmount: userTds,
        netIncentive: userNetIncentive,
        phases,
    };
}

export const rs = (v: number): string =>
    '₹' + Math.round(Number(v) || 0).toLocaleString('en-IN');

export const words = (v: number): string => {
    const val = Number(v) || 0;
    if (val >= 1e7) return '₹' + (val / 1e7).toFixed(2) + ' Crore';
    if (val >= 1e5) return '₹' + (val / 1e5).toFixed(2) + ' Lakh';
    if (val > 0) return rs(val);
    return '';
};

export function fmtShort(n: number): string {
    const val = Number(n) || 0;
    if (val >= 10000000) return `₹${(val / 10000000).toFixed(1)}Cr`;
    if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
    if (val >= 1000) return `₹${(val / 1000).toFixed(0)}K`;
    return `₹${val.toFixed(0)}`;
}

export function fmtFull(n: number): string {
    return (
        "₹" +
        Number(n || 0).toLocaleString("en-IN", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })
    );
}

export function currentMonthName(): string {
    return new Date().toLocaleDateString("en-IN", { month: "long", year: "numeric" });
}

export function getDaysLeftInMonth(): number {
    const now = new Date();
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    return lastDay - now.getDate();
}

export function getMonthLabelFromDateString(dateStr?: string): string {
    if (!dateStr) return currentMonthName();
    const parts = dateStr.split("/");
    if (parts.length === 3) {
        const [day, month, year] = parts;
        const d = new Date(Number(year), Number(month) - 1, Number(day));
        if (!isNaN(d.getTime())) {
            return d.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
        }
    }
    return currentMonthName();
}
