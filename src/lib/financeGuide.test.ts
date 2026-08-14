import assert from 'node:assert/strict';
import test from 'node:test';

import {
  financeGuidePreferenceKey,
  getFinanceGuideContent,
  type FinanceGuideLocale,
} from './financeGuide';

test('finance guide has complete and ordered content for every locale', () => {
  const locales: FinanceGuideLocale[] = ['ko', 'vi', 'en'];
  for (const locale of locales) {
    const content = getFinanceGuideContent(locale);
    assert.equal(content.steps.length, 9);
    assert.equal(content.steps[0]?.id, 'summary');
    assert.equal(content.steps.at(-1)?.id, 'help');
    assert.equal(new Set(content.steps.map((step) => step.id)).size, content.steps.length);
    assert.equal(content.workflows.length, 6);
    assert.equal(content.glossary.length, 8);
    assert.ok(content.steps.every((step) => step.title && step.description && step.checklist.length));
  }
});

test('finance guide visits the operational beginner workflow in order', () => {
  const views = getFinanceGuideContent('ko').steps.flatMap((step) => step.view ? [step.view] : []);
  assert.deepEqual(views, ['DASHBOARD', 'REVENUE', 'CASHFLOW', 'EXPENSES', 'BUDGET', 'CLOSING']);
});

test('finance guide preference is isolated by company and user', () => {
  assert.notEqual(
    financeGuidePreferenceKey('CON_COST', 'demo-admin'),
    financeGuidePreferenceKey('VIET_QS', 'demo-admin'),
  );
  assert.notEqual(
    financeGuidePreferenceKey('CON_COST', 'demo-admin'),
    financeGuidePreferenceKey('CON_COST', 'demo-finance'),
  );
  assert.doesNotMatch(financeGuidePreferenceKey('CON COST', 'user@example.invalid'), /[@ ]/);
});
