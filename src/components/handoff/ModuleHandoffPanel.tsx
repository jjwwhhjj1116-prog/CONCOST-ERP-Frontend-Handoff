'use client';

import { HandoffLanguageToggle } from '@/components/handoff/HandoffLanguageToggle';
import { RuntimeCapabilityPanel } from '@/components/handoff/RuntimeCapabilityPanel';
import { useHandoffLocale } from '@/components/handoff/useHandoffLocale';
import {
  getFrontendModuleBoundary,
  type FrontendLocale,
  type FrontendModule,
  type ProviderState,
} from '@/lib/frontendDataSource';

interface ModuleHandoffPanelProps {
  module: FrontendModule;
  adapterReady?: boolean;
  providerRequired?: boolean;
  providerState?: ProviderState;
  description: Record<FrontendLocale, string>;
}

export function ModuleHandoffPanel({
  module,
  adapterReady = false,
  providerRequired = false,
  providerState = 'NOT_REQUIRED',
  description,
}: ModuleHandoffPanelProps) {
  const { locale, setLocale } = useHandoffLocale();
  const boundary = getFrontendModuleBoundary(module, {
    locale,
    adapterReady,
    providerRequired,
    providerState,
  });

  return (
    <section className="border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[0_12px_30px_rgba(25,45,82,.06)] sm:p-5">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <p className="max-w-3xl text-xs font-semibold leading-5 text-[var(--color-text-sub)]">
          {description[locale]}
        </p>
        <HandoffLanguageToggle locale={locale} onChange={setLocale} />
      </div>
      <RuntimeCapabilityPanel boundary={boundary} compact />
    </section>
  );
}
