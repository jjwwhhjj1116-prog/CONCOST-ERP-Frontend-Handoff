'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft, FileSpreadsheet, LoaderCircle } from 'lucide-react';
import { EstimateSheetWorkbench } from '@/components/intake/EstimateSheetWorkbench';
import { useTranslation } from '@/lib/localization';
import { useTranslationStore } from '@/store/translationStore';

function EstimateEditorPageContent() {
  const searchParams = useSearchParams();
  const { settings } = useTranslationStore();
  const t = useTranslation(settings.uiLanguage);
  const requestId = searchParams.get('requestId') || '';

  if (!requestId) {
    return (
      <main className="mx-auto flex min-h-[calc(100vh-var(--header-height))] w-full max-w-3xl items-center justify-center px-6 py-12">
        <section className="w-full border border-[var(--color-border)] bg-[var(--color-surface)] p-8 shadow-sm">
          <div className="mb-5 flex size-11 items-center justify-center bg-orange-50 text-[var(--color-primary)]">
            <FileSpreadsheet aria-hidden="true" className="size-6" />
          </div>
          <h1 className="text-2xl font-bold text-[var(--color-text)]">{t('estimateSheet.title')}</h1>
          <p className="mt-2 text-sm text-[var(--color-text-secondary)]">{t('estimateSheet.missingRequest')}</p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="/projects/intake?tab=CLIENT_ORDER" className="inline-flex min-h-11 items-center gap-2 bg-[var(--color-primary)] px-4 text-sm font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2">
              <ArrowLeft aria-hidden="true" className="size-4" />
              {t('estimateSheet.back')}
            </Link>
            <Link href="/projects/intake/estimates" className="inline-flex min-h-11 items-center gap-2 border border-[var(--color-border)] px-4 text-sm font-semibold text-[var(--color-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2">
              <FileSpreadsheet aria-hidden="true" className="size-4" />
              {t('estimateSubmission.openManagement')}
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return <EstimateSheetWorkbench requestId={requestId} />;
}

export default function EstimateEditorPage() {
  const { settings } = useTranslationStore();
  const t = useTranslation(settings.uiLanguage);
  return <Suspense fallback={<div role="status" className="flex justify-center p-8"><LoaderCircle aria-hidden="true" className="size-5 animate-spin" /><span className="sr-only">{t('estimateSheet.loading')}</span></div>}><EstimateEditorPageContent /></Suspense>;
}
