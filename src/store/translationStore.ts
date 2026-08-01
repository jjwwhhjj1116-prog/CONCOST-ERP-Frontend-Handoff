import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { TranslationProvider, TranslationProviderHealth, TranslationCacheItem, WorkspaceLanguage } from '@/types/models';

export interface TranslationSettings {
  uiLanguage: WorkspaceLanguage;
  activeProvider: TranslationProvider;
  libreTranslateEndpoint?: string;
  myMemoryContactEmail?: string;
  autoTranslateEnabled: boolean;
}

interface TranslationStore {
  settings: TranslationSettings;
  providerHealths: Record<string, TranslationProviderHealth>;
  translationCache: TranslationCacheItem[];
  
  updateSettings: (newSettings: Partial<TranslationSettings>) => void;
  updateProviderHealth: (provider: TranslationProvider, health: TranslationProviderHealth) => void;
  cacheTranslation: (item: TranslationCacheItem) => void;
  clearCache: () => void;
}

export const useTranslationStore = create<TranslationStore>()(
  persist(
    (set) => ({
      settings: {
        uiLanguage: 'ko',
        activeProvider: 'MYMEMORY_PUBLIC_NO_KEY',
        autoTranslateEnabled: true,
      },
      providerHealths: {},
      translationCache: [],
      
      updateSettings: (newSettings) => set((state) => ({
        settings: { ...state.settings, ...newSettings }
      })),
      
      updateProviderHealth: (provider, health) => set((state) => ({
        providerHealths: { ...state.providerHealths, [provider]: health }
      })),
      
      cacheTranslation: (item) => set((state) => {
        const filteredCache = state.translationCache.filter(
          c => !(c.sourceHash === item.sourceHash && c.targetLanguage === item.targetLanguage)
        );
        return { translationCache: [...filteredCache, item] };
      }),
      
      clearCache: () => set({ translationCache: [] })
    }),
    {
      name: 'workspace-translation-storage'
    }
  )
);
