import assert from 'node:assert/strict';
import test from 'node:test';
import { getApiCompanyId } from '@/lib/apiClient';
import { useAuthStore } from '@/store/authStore';
import { useTranslationStore } from '@/store/translationStore';
import { useUiStore } from '@/store/uiStore';

test('sequential synthetic logins reset company, locale, and API scope', async () => {
  const previousMode = process.env.NEXT_PUBLIC_RUNTIME_MODE;
  process.env.NEXT_PUBLIC_RUNTIME_MODE = 'DEMO_LOCAL';

  try {
    useUiStore.getState().setBrandWorkspace('CON_COST');
    useTranslationStore.getState().updateSettings({ uiLanguage: 'ko' });

    assert.equal(
      await useAuthStore.getState().loginWithCredentials(
        'demo.vq.001@example.invalid',
        'DemoOnly!2026',
      ),
      true,
    );
    assert.equal(useAuthStore.getState().currentUser?.companyId, 'VIET_QS');
    assert.equal(useUiStore.getState().brandWorkspace, 'VIET_QS');
    assert.equal(useTranslationStore.getState().settings.uiLanguage, 'vi');
    assert.equal(getApiCompanyId(), 'VIET_QS');

    useAuthStore.getState().logout();
    assert.equal(getApiCompanyId(), null);

    assert.equal(
      await useAuthStore.getState().loginWithCredentials(
        'demo.cc.001@example.invalid',
        'DemoOnly!2026',
      ),
      true,
    );
    assert.equal(useAuthStore.getState().currentUser?.companyId, 'CON_COST');
    assert.equal(useUiStore.getState().brandWorkspace, 'CON_COST');
    assert.equal(useTranslationStore.getState().settings.uiLanguage, 'ko');
    assert.equal(getApiCompanyId(), 'CON_COST');
  } finally {
    useAuthStore.getState().logout();
    process.env.NEXT_PUBLIC_RUNTIME_MODE = previousMode;
  }
});
