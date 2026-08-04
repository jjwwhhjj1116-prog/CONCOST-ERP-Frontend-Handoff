'use client';

import { EstimateRequestWorkbench } from '@/components/intake/EstimateRequestWorkbench';
import { useTranslation } from '@/lib/localization';
import { useAuthStore } from '@/store/authStore';
import { useTranslationStore } from '@/store/translationStore';
import { evaluateEstimateAccess } from '@/lib/accessControl';

export default function EstimateRequestsPage() {
  const currentUser = useAuthStore((state) => state.currentUser);
  const { settings } = useTranslationStore();
  const t = useTranslation(settings.uiLanguage);

  if (!currentUser) return <div className="py-10 text-center text-[var(--color-text-sub)]">{t('header.loginRequired')}</div>;
  if (!evaluateEstimateAccess(currentUser).allowed) {
    return <div className="py-10 text-center font-bold text-[var(--color-danger)]">{t('intake.noPermission')}</div>;
  }

  return <EstimateRequestWorkbench currentUser={currentUser} t={t} />;
}
