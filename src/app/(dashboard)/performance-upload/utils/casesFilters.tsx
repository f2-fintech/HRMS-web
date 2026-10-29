export type KPIType =
  | 'NET_APPROVAL'
  | 'NET_DISBURSAL'
  | 'GROSS_APPROVAL'
  | 'GROSS_DISBURSAL'
  | 'DROP'
  | 'CASHBACK'
  | 'ABND';

export type Row = {
  _id: string;
  date: string;

  employee_name?: string;
  employee_id?: string;
  manager_tl?: string;

  login?: number;

  // Net
  approval?: number;
  disbursal?: number;

  // Others
  drop?: number;
  cashback?: number;

  // Gross
  gross_approval?: number;
  gross_disbursal?: number;

  // ABND / ABNP
  abnp?: number;

  code?: string;
  [k: string]: any;
};

export const getKpiLabel = (kpi: KPIType) => {
  switch (kpi) {
    case 'NET_APPROVAL':
      return 'Net Approval';
    case 'NET_DISBURSAL':
      return 'Net Disbursal';
    case 'GROSS_APPROVAL':
      return 'Gross Approval';
    case 'GROSS_DISBURSAL':
      return 'Gross Disbursal';
    case 'DROP':
      return 'Drop';
    case 'CASHBACK':
      return 'Cashback';
    case 'ABND':
      return 'ABND';
    default:
      return 'KPI';
  }
};

export const getKpiValue = (r: Row, kpi: KPIType) => {
  const num = (v: any) => Number(v || 0);

  switch (kpi) {
    case 'NET_APPROVAL':
      return num(r.approval);
    case 'NET_DISBURSAL':
      return num(r.disbursal);
    case 'GROSS_APPROVAL':
      return num(r.gross_approval);
    case 'GROSS_DISBURSAL':
      return num(r.gross_disbursal);
    case 'DROP':
      return num(r.drop);
    case 'CASHBACK':
      return num(r.cashback);
    case 'ABND':
      return num(r.abnp);
    default:
      return 0;
  }
};

export const getCasesForKpi = (rows: Row[], kpi: KPIType) => {
  return [...rows]
    .filter((r) => getKpiValue(r, kpi) > 0)
    .sort((a, b) => getKpiValue(b, kpi) - getKpiValue(a, kpi));
};
