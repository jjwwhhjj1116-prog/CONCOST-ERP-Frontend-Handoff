'use client';

import { useState } from 'react';

import type { FrontendLocale } from '@/lib/frontendDataSource';
import { useUiStore } from '@/store/uiStore';

export function useHandoffLocale() {
  const brandWorkspace = useUiStore((state) => state.brandWorkspace);
  const defaultLocale: FrontendLocale =
    brandWorkspace === 'VIET_QS' ? 'vi' : 'ko';
  const [selection, setSelection] = useState<{
    brandWorkspace: typeof brandWorkspace;
    locale: FrontendLocale;
  } | null>(null);
  const locale =
    selection?.brandWorkspace === brandWorkspace
      ? selection.locale
      : defaultLocale;

  return {
    brandWorkspace,
    locale,
    setLocale: (nextLocale: FrontendLocale) =>
      setSelection({ brandWorkspace, locale: nextLocale }),
  };
}
