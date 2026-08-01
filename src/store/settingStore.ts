import { create } from 'zustand';
import { WorkspaceSetting } from '@/types/models';

interface SettingState {
  settings: WorkspaceSetting[];
  updateSetting: (key: string, value: string | number | boolean | Record<string, string>, updatedBy: string) => void;
  replaceSettings: (settings: unknown) => void;
  resetSettings: () => void;
}

export const defaultSettings: WorkspaceSetting[] = [
  {
    id: 'setting-001',
    category: 'POLICY',
    key: 'DELIVERY_URGENT_DAYS',
    value: 3,
    description: '납품 임박 상태(URGENT)로 표시할 기준 일수',
    editableByRoles: ['SUPER_ADMIN', 'SYSTEM_ADMIN'],
    updatedBy: 'system',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'setting-002',
    category: 'MAPPING',
    key: 'SCOPE_NORMALIZATION',
    value: { 'Drafting (T1)': 'Drafting', 'Mod (T1)': 'Mod' },
    description: 'Excel Import 시 Scope 정규화 매핑 테이블',
    editableByRoles: ['SUPER_ADMIN', 'SYSTEM_ADMIN'],
    updatedBy: 'system',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'setting-003',
    category: 'WORKFLOW',
    key: 'ALLOW_SCHEDULE_CONFLICT',
    value: false,
    description: '직원의 일별 잔여 시간을 초과하는 스케줄 할당 허용 여부',
    editableByRoles: ['SUPER_ADMIN', 'SYSTEM_ADMIN', 'DEPARTMENT_MANAGER'],
    updatedBy: 'system',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'setting-004',
    category: 'UI',
    key: 'DEFAULT_BOARD_VIEW',
    value: 'BY_STATUS',
    description: '프로젝트 보드 기본 뷰 모드',
    editableByRoles: ['SUPER_ADMIN', 'SYSTEM_ADMIN', 'PM', 'DEPARTMENT_MANAGER'],
    updatedBy: 'system',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'setting-delivery-001',
    category: 'DELIVERY',
    key: 'DELIVERY_AUTO_CLOSE_OVERDUE_PROJECTS',
    value: true,
    description: '납품일 경과 시 자동 완료 컬럼 분류 여부',
    editableByRoles: ['SUPER_ADMIN'],
    updatedBy: 'system',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'setting-delivery-002',
    category: 'DELIVERY',
    key: 'DELIVERY_SHOW_COMPLETED_WITH_PENDING_WARNINGS',
    value: true,
    description: '완료 컬럼 프로젝트에 미결 요청 경고 표시 여부',
    editableByRoles: ['SUPER_ADMIN'],
    updatedBy: 'system',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'setting-delivery-003',
    category: 'DELIVERY',
    key: 'DELIVERY_ALLOW_POST_DELIVERY_WORK_REQUEST',
    value: true,
    description: '납품일 경과 후 추가업무 요청 허용 여부',
    editableByRoles: ['SUPER_ADMIN'],
    updatedBy: 'system',
    updatedAt: new Date().toISOString()
  }
];

const cloneSettingValue = (value: WorkspaceSetting['value']) => {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return { ...value };
  }
  return value;
};

const getDefaultSettings = () =>
  defaultSettings.map(setting => ({
    ...setting,
    value: cloneSettingValue(setting.value)
  }));

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const normalizeSettingValue = (value: unknown): WorkspaceSetting['value'] => {
  if (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  ) {
    return value;
  }

  if (isRecord(value)) {
    const entries = Object.entries(value);
    if (entries.every(([, entryValue]) => typeof entryValue === 'string')) {
      return Object.fromEntries(entries) as Record<string, string>;
    }
  }

  return '';
};

const normalizeSetting = (value: unknown): WorkspaceSetting | null => {
  if (!isRecord(value) || typeof value.key !== 'string') return null;

  return {
    id: typeof value.id === 'string' ? value.id : `setting-${value.key}`,
    category: typeof value.category === 'string' ? value.category : 'SYSTEM',
    key: value.key,
    value: normalizeSettingValue(value.value),
    description: typeof value.description === 'string' ? value.description : undefined,
    editableByRoles:
      Array.isArray(value.editableByRoles) && value.editableByRoles.every(role => typeof role === 'string')
        ? value.editableByRoles
        : ['SUPER_ADMIN', 'SYSTEM_ADMIN'],
    updatedBy: typeof value.updatedBy === 'string' ? value.updatedBy : 'system',
    updatedAt: typeof value.updatedAt === 'string' ? value.updatedAt : new Date().toISOString()
  };
};

const normalizeSettings = (settings: unknown): WorkspaceSetting[] => {
  if (!Array.isArray(settings)) return getDefaultSettings();

  const normalizedSettings = settings
    .map(normalizeSetting)
    .filter((setting): setting is WorkspaceSetting => setting !== null);

  return normalizedSettings.length > 0 ? normalizedSettings : getDefaultSettings();
};

export const useSettingStore = create<SettingState>((set) => ({
  settings: getDefaultSettings(),
  updateSetting: (key, value, updatedBy) => set((state) => ({
    settings: state.settings.map(s => 
      s.key === key ? { ...s, value, updatedBy, updatedAt: new Date().toISOString() } : s
    )
  })),
  replaceSettings: (settings) => set({ settings: normalizeSettings(settings) }),
  resetSettings: () => set({ settings: getDefaultSettings() })
}));
