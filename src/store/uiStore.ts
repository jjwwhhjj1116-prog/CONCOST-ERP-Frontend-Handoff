import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type SidebarMode = 'EXPANDED' | 'COMPACT' | 'MINI';
export type BrandWorkspace = 'CON_COST' | 'VIET_QS';

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
      setBrandWorkspace: (brandWorkspace) => set({ brandWorkspace }),
      toggleBrandWorkspace: () => set((state) => ({
        brandWorkspace: state.brandWorkspace === 'CON_COST' ? 'VIET_QS' : 'CON_COST',
      })),
    }),
    {
      name: 'ui-storage',
    }
  )
);
