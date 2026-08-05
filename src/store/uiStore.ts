import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { setApiCompanyId } from '@/lib/apiClient';
import { useTranslationStore } from '@/store/translationStore';

export type SidebarMode = 'EXPANDED' | 'COMPACT' | 'MINI';
export type BrandWorkspace = 'CON_COST' | 'VIET_QS';

const synchronizeWorkspaceContext = (brandWorkspace: BrandWorkspace) => {
  setApiCompanyId(brandWorkspace);
  useTranslationStore.getState().updateSettings({
    uiLanguage: brandWorkspace === 'VIET_QS' ? 'vi' : 'ko',
  });
};

interface UiState {
  sidebarMode: SidebarMode;
  isDarkMode: boolean;
  brandWorkspace: BrandWorkspace;
  setSidebarMode: (mode: SidebarMode) => void;
  cycleSidebarMode: () => void;
  toggleDarkMode: () => void;
  setDarkMode: (isDark: boolean) => void;
  setBrandWorkspace: (brand: BrandWorkspace) => void;
  toggleBrandWorkspace: () => void;
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      sidebarMode: 'EXPANDED',
      isDarkMode: false,
      brandWorkspace: 'CON_COST',
      setSidebarMode: (mode) => set({ sidebarMode: mode }),
      cycleSidebarMode: () => set((state) => {
        if (state.sidebarMode === 'EXPANDED') return { sidebarMode: 'COMPACT' };
        if (state.sidebarMode === 'COMPACT') return { sidebarMode: 'MINI' };
        return { sidebarMode: 'EXPANDED' };
      }),
      toggleDarkMode: () => set((state) => ({ isDarkMode: !state.isDarkMode })),
      setDarkMode: (isDark) => set({ isDarkMode: isDark }),
      setBrandWorkspace: (brandWorkspace) => {
        synchronizeWorkspaceContext(brandWorkspace);
        set({ brandWorkspace });
      },
      toggleBrandWorkspace: () => set((state) => {
        const brandWorkspace = state.brandWorkspace === 'CON_COST' ? 'VIET_QS' : 'CON_COST';
        synchronizeWorkspaceContext(brandWorkspace);
        return { brandWorkspace };
      }),
    }),
    {
      name: 'ui-storage',
      onRehydrateStorage: () => (state) => {
        if (state) synchronizeWorkspaceContext(state.brandWorkspace);
      },
    }
  )
);
