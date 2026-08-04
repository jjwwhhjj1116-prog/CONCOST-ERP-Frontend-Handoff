import type {
  EstimateRequest,
  EstimateSheetState,
  EstimateTemplateType,
  ProjectExecutionUnitId,
} from '@/types/models';

export type EstimateRequestProfile = {
  estimateRequestId: string;
  requestNo: string;
  projectName: string;
  projectNo: string;
  vendor: string;
  client: string;
  contact: string;
  contactDepartment: string;
  phone: string;
  email: string;
  workCategory: string;
  executionType: string;
  usage: string;
  areaM2: string;
  areaPy: string;
  buildingCount: string;
  basementFloors: string;
  groundFloors: string;
  floors: string;
  bidDate: string;
  firstDelivery: string;
  scope: string;
  unitWork: string;
  estimateType: string;
  targetUnitIds: ProjectExecutionUnitId[];
  primaryUnitId: ProjectExecutionUnitId | null;
};

export const ESTIMATE_PROFILE_REQUIRED_FIELDS: Array<keyof EstimateRequestProfile> = [
  'projectName',
  'vendor',
  'client',
  'workCategory',
  'usage',
  'scope',
  'firstDelivery',
  'targetUnitIds',
];

export function buildEstimateRequestProfile(request: EstimateRequest): EstimateRequestProfile {
  return {
    estimateRequestId: request.id,
    requestNo: request.requestNo,
    projectName: request.projectName || '',
    projectNo: request.projectNo || '',
    vendor: request.company || '',
    client: request.client || '',
    contact: request.contact || '',
    contactDepartment: request.contactDepartment || '',
    phone: request.phone || '',
    email: request.email || '',
    workCategory: request.workCategory || '',
    executionType: request.executionType || '',
    usage: request.usage || '',
    areaM2: request.areaM2 || '',
    areaPy: request.areaPy || '',
    buildingCount: request.buildingCount || '',
    basementFloors: request.basementFloors || '',
    groundFloors: request.groundFloors || '',
    floors: request.floors || '',
    bidDate: request.bidDate || '',
    firstDelivery: request.firstDelivery || '',
    scope: request.scope || '',
    unitWork: request.unitWork || '',
    estimateType: request.estimateType || '',
    targetUnitIds: request.targetUnitIds || [],
    primaryUnitId: request.primaryUnitId || null,
  };
}

export function missingEstimateProfileFields(profile: EstimateRequestProfile) {
  return ESTIMATE_PROFILE_REQUIRED_FIELDS.filter((field) => {
    const value = profile[field];
    return Array.isArray(value) ? value.length === 0 : !String(value ?? '').trim();
  });
}

const SOURCE_CELL_MAP: Record<EstimateTemplateType, Array<[string, keyof EstimateRequestProfile]>> = {
  개산견적: [['4:2', 'projectNo'], ['5:2', 'vendor'], ['6:2', 'projectName'], ['7:2', 'scope'], ['8:2', 'contact'], ['9:2', 'firstDelivery']],
  공내역서: [['4:2', 'projectNo'], ['5:2', 'vendor'], ['6:2', 'projectName'], ['7:2', 'scope'], ['8:2', 'contact'], ['9:2', 'firstDelivery']],
  설계예가: [['4:2', 'projectNo'], ['5:2', 'vendor'], ['6:2', 'projectName'], ['7:2', 'scope'], ['8:2', 'contact'], ['9:2', 'firstDelivery']],
  공사비검증: [['4:2', 'projectNo'], ['5:2', 'vendor'], ['6:2', 'projectName'], ['7:2', 'scope'], ['8:2', 'contact'], ['9:2', 'firstDelivery']],
};

export function applyEstimateProfileToState(
  state: EstimateSheetState,
  profile: EstimateRequestProfile,
): EstimateSheetState {
  const cells = { ...state.cells };
  SOURCE_CELL_MAP[state.type].forEach(([key, field]) => {
    const current = cells[key];
    if (current?.manualOverride) return;
    cells[key] = {
      ...current,
      value: Array.isArray(profile[field]) ? profile[field].join(', ') : String(profile[field] ?? ''),
      sourceField: field,
      manualOverride: false,
      locked: false,
    };
  });
  return { ...state, cells };
}

export function markEstimateCellManual(state: EstimateSheetState, key: string, input: string): EstimateSheetState {
  const trimmed = input.replaceAll('\u00a0', ' ').trim();
  const formula = trimmed.startsWith('=') ? trimmed.slice(1) : '';
  const value = formula
    ? ''
    : /^-?[\d,]+(?:\.\d+)?$/.test(trimmed)
      ? Number(trimmed.replaceAll(',', ''))
      : trimmed;
  return {
    ...state,
    cells: {
      ...state.cells,
      [key]: {
        ...state.cells[key],
        value,
        formula,
        userFormula: Boolean(formula),
        sourceField: undefined,
        manualOverride: true,
        locked: false,
      },
    },
  };
}

export function estimateSemanticState(state: EstimateSheetState) {
  return {
    type: state.type,
    maxRow: state.maxRow,
    maxCol: state.maxCol,
    rowHeights: state.rowHeights,
    colWidths: state.colWidths,
    merges: state.merges,
    cells: Object.fromEntries(Object.entries(state.cells).map(([key, cell]) => [key, {
      value: cell.value === '' || cell.value == null ? null : cell.value,
      formula: cell.formula || '',
      userFormula: Boolean(cell.userFormula),
    }])),
  };
}
