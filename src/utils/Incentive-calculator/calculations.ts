export const TDS_RATE = 0.05;

export function calculateSalariedIncentive(
    role: string,
    salary: number | string,
    disbursedAmount: number | string,
    managerFileType = "team"
) {
    role = String(role || "").trim().toUpperCase();
    salary = Number(salary);
    disbursedAmount = Number(disbursedAmount);

    if (!role) return { error: "Role is required." };
    if (isNaN(salary) || salary <= 0) return { error: "Salary must be greater than 0." };
    if (isNaN(disbursedAmount) || disbursedAmount < 0)
        return { error: "Disbursed amount must be a valid number." };

    if (role === "MANAGER" && managerFileType === "own") {
        if (disbursedAmount === 0) {
            return {
                role,
                salary,
                disbursedAmount,
                justifiedSalary: 0,
                grossIncentive: 0,
                tdsAmount: 0,
                netIncentive: 0,
                phases: [],
                belowThreshold: true,
                isManagerOwn: true,
            };
        }

        const grossIncentive = disbursedAmount * (0.35 / 100);
        const tdsAmount = grossIncentive * TDS_RATE;

        const phases = [
            {
                phase: 1,
                from: 0,
                to: disbursedAmount,
                eligibleAmount: disbursedAmount,
                ratePercent: 0.35,
                incentive: grossIncentive,
            },
        ];

        return {
            role,
            salary,
            disbursedAmount,
            justifiedSalary: 0,
            grossIncentive,
            tdsAmount,
            netIncentive: grossIncentive - tdsAmount,
            phases,
            isManagerOwn: true,
        };
    }

    const startingRate = role === "TELECALLER" ? 0.25 : 0.1;
    const justifiedSalary = salary * 200;

    if (disbursedAmount <= justifiedSalary) {
        return {
            role,
            salary,
            disbursedAmount,
            justifiedSalary,
            grossIncentive: 0,
            tdsAmount: 0,
            netIncentive: 0,
            phases: [],
            belowThreshold: true,
        };
    }

    let grossIncentive = 0;
    const phases: any[] = [];

    let phaseNo = 1;
    let phaseStart = justifiedSalary;
    const slabWidth = 2000000;

    let phaseEnd = phaseStart + slabWidth;
    let rate = startingRate;

    while (disbursedAmount > phaseStart) {
        const currentUpper = Math.min(disbursedAmount, phaseEnd);
        const eligibleAmount = currentUpper - phaseStart;

        if (eligibleAmount > 0) {
            const incentive = eligibleAmount * (rate / 100);

            phases.push({
                phase: phaseNo,
                from: phaseStart,
                to: currentUpper,
                eligibleAmount,
                ratePercent: rate,
                incentive,
            });
            grossIncentive += incentive;
        }

        phaseNo++;
        phaseStart = phaseEnd;
        phaseEnd += slabWidth;
        rate += 0.05;
    }

    const tdsAmount = grossIncentive * TDS_RATE;

    return {
        role,
        salary,
        disbursedAmount,
        justifiedSalary,
        grossIncentive,
        tdsAmount,
        netIncentive: grossIncentive - tdsAmount,
        phases,
    };
}

export function calculateTeamLeaderIncentive(salary: number | string, disbursedAmount: number | string) {
    salary = Number(salary);
    disbursedAmount = Number(disbursedAmount);

    if (isNaN(salary) || salary <= 0) return { error: "Salary must be greater than 0." };
    if (isNaN(disbursedAmount) || disbursedAmount < 0)
        return { error: "Disbursed amount must be a valid number." };

    const justifiedSalary = salary * 200;

    if (disbursedAmount <= justifiedSalary) {
        return {
            role: "TEAM_LEADER",
            salary,
            disbursedAmount,
            justifiedSalary,
            grossIncentive: 0,
            tdsAmount: 0,
            netIncentive: 0,
            phases: [],
            belowThreshold: true,
        };
    }

    const eligibleAmount = disbursedAmount - justifiedSalary;
    const grossIncentive = eligibleAmount * (0.2 / 100);
    const tdsAmount = grossIncentive * TDS_RATE;

    const phases = [
        {
            phase: 1,
            from: justifiedSalary,
            to: disbursedAmount,
            eligibleAmount,
            ratePercent: 0.2,
            incentive: grossIncentive,
        },
    ];

    return {
        role: "TEAM_LEADER",
        salary,
        disbursedAmount,
        justifiedSalary,
        grossIncentive,
        tdsAmount,
        netIncentive: grossIncentive - tdsAmount,
        phases,
    };
}

export function calculateSourcerIncentive(disbursedAmount: number | string) {
    disbursedAmount = Number(disbursedAmount);

    if (isNaN(disbursedAmount) || disbursedAmount < 0) return { error: "Invalid disbursed amount." };

    if (disbursedAmount === 0) {
        return {
            role: "SOURCER",
            disbursedAmount,
            justifiedSalary: 0,
            grossIncentive: 0,
            tdsAmount: 0,
            netIncentive: 0,
            phases: [],
            belowThreshold: true,
        };
    }

    const grossIncentive = disbursedAmount * (0.25 / 100);
    const tdsAmount = grossIncentive * TDS_RATE;

    const phases = [
        {
            phase: 1,
            from: 0,
            to: disbursedAmount,
            eligibleAmount: disbursedAmount,
            ratePercent: 0.25,
            incentive: grossIncentive,
        },
    ];

    return {
        role: "SOURCER",
        disbursedAmount,
        justifiedSalary: 0,
        grossIncentive,
        tdsAmount,
        netIncentive: grossIncentive - tdsAmount,
        phases,
    };
}

export function calculate(
    role: string,
    salary: number | string,
    disbursed: number | string,
    managerFileType: string
) {
    if (role === "TELECALLER" || role === "MANAGER")
        return calculateSalariedIncentive(role, salary, disbursed, managerFileType);
    if (role === "TEAM_LEADER") return calculateTeamLeaderIncentive(salary, disbursed);
    if (role === "SOURCER") return calculateSourcerIncentive(disbursed);

    return { error: "Invalid role." };
}

export const ROLES = [
    {
        id: "TELECALLER",
        label: "Telecaller",
        icon: "📞",
        sub: "Phases from 0.25%",
        color: "#2563EB",
        bg: "bg-blue-50",
        text: "text-blue-600",
        hasSalary: true,
    },
    {
        id: "MANAGER",
        label: "Manager",
        icon: "🏢",
        sub: "Team slab / Own flat",
        color: "#7C3AED",
        bg: "bg-violet-50",
        text: "text-violet-600",
        hasSalary: true,
    },
    {
        id: "TEAM_LEADER",
        label: "Team Leader",
        icon: "👥",
        sub: "Flat 0.20% above limit",
        color: "#0891B2",
        bg: "bg-cyan-50",
        text: "text-cyan-600",
        hasSalary: true,
    },
    {
        id: "SOURCER",
        label: "Sourcer",
        icon: "🔍",
        sub: "Flat 0.25% on total",
        color: "#059669",
        bg: "bg-emerald-50",
        text: "text-emerald-600",
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


export function fmtShort(n: number): string {
    if (n >= 10000000) return `₹${(n / 10000000).toFixed(1)}Cr`;
    if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
    if (n >= 1000) return `₹${(n / 1000).toFixed(0)}K`;

    return `₹${n.toFixed(0)}`;
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

    const [day, month, year] = dateStr.split("/");
    const d = new Date(Number(year), Number(month) - 1, Number(day));


    return d.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
}

