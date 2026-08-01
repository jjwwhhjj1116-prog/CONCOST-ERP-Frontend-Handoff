'use client';

import { ArrowRight, BriefcaseBusiness, CircleDollarSign, Plus } from 'lucide-react';
import { FormEvent, useMemo, useState } from 'react';

import { HandoffLanguageToggle } from '@/components/handoff/HandoffLanguageToggle';
import { RuntimeCapabilityPanel } from '@/components/handoff/RuntimeCapabilityPanel';
import { useHandoffLocale } from '@/components/handoff/useHandoffLocale';
import {
  executeFrontendMutation,
  getFrontendModuleBoundary,
  type FrontendLocale,
} from '@/lib/frontendDataSource';
import { useUiStore } from '@/store/uiStore';

type BusinessModule = 'SALES' | 'FINANCE';

interface BusinessEntry {
  id: string;
  companyId: 'CON_COST' | 'VIET_QS';
  title: string;
  counterpart: string;
  amount: number;
  stage: string;
  note: string;
}

interface BusinessModuleWorkbenchProps {
  module: BusinessModule;
}

const copy = {
  ko: {
    SALES: {
      eyebrow: 'SALES ADAPTER WORKBENCH',
      title: '영업기회 기본 입력',
      description: '고객·기회·예상금액을 검토하고 승인된 견적 의뢰로 연결할 Frontend 계약 화면입니다.',
      titleField: '기회명',
      counterpart: '고객·거래처',
      amount: '예상 수주액',
      stage: '영업 단계',
      note: '다음 행동',
      create: '기회 추가',
      list: '회사별 영업기회',
      empty: '등록된 데모 영업기회가 없습니다.',
      detail: '영업기회 상세',
    },
    FINANCE: {
      eyebrow: 'FINANCE ADAPTER WORKBENCH',
      title: '재무 거래 기본 입력',
      description: '거래·증빙·금액을 입력하고 검토 Workflow로 넘길 Frontend 계약 화면입니다.',
      titleField: '거래명',
      counterpart: '거래처',
      amount: '금액',
      stage: '처리 상태',
      note: '증빙·검토 메모',
      create: '거래 추가',
      list: '회사별 재무 거래',
      empty: '등록된 데모 재무 거래가 없습니다.',
      detail: '재무 거래 상세',
    },
    demo: '실제 서버 원장에 저장되지 않는 데모 입력입니다.',
    select: '상세 보기',
    currency: '원',
  },
  vi: {
    SALES: {
      eyebrow: 'SALES ADAPTER WORKBENCH',
      title: 'Nhập cơ hội bán hàng',
      description: 'Màn hình hợp đồng Frontend để rà soát khách hàng, cơ hội, giá trị và tạo yêu cầu báo giá đã duyệt.',
      titleField: 'Tên cơ hội',
      counterpart: 'Khách hàng',
      amount: 'Giá trị dự kiến',
      stage: 'Giai đoạn',
      note: 'Hành động tiếp theo',
      create: 'Thêm cơ hội',
      list: 'Cơ hội theo công ty',
      empty: 'Chưa có cơ hội demo.',
      detail: 'Chi tiết cơ hội',
    },
    FINANCE: {
      eyebrow: 'FINANCE ADAPTER WORKBENCH',
      title: 'Nhập giao dịch tài chính',
      description: 'Màn hình hợp đồng Frontend để nhập giao dịch, chứng từ và chuyển sang quy trình rà soát.',
      titleField: 'Tên giao dịch',
      counterpart: 'Đối tác',
      amount: 'Số tiền',
      stage: 'Trạng thái',
      note: 'Ghi chú chứng từ',
      create: 'Thêm giao dịch',
      list: 'Giao dịch theo công ty',
      empty: 'Chưa có giao dịch demo.',
      detail: 'Chi tiết giao dịch',
    },
    demo: 'Dữ liệu demo này không được lưu vào sổ cái máy chủ.',
    select: 'Xem chi tiết',
    currency: 'KRW',
  },
  en: {
    SALES: {
      eyebrow: 'SALES ADAPTER WORKBENCH',
      title: 'Opportunity entry',
      description: 'A Frontend contract screen for customer, opportunity, value review, and approved estimate-request handoff.',
      titleField: 'Opportunity',
      counterpart: 'Customer',
      amount: 'Expected value',
      stage: 'Pipeline stage',
      note: 'Next action',
      create: 'Add opportunity',
      list: 'Company opportunities',
      empty: 'No demo opportunities are registered.',
      detail: 'Opportunity detail',
    },
    FINANCE: {
      eyebrow: 'FINANCE ADAPTER WORKBENCH',
      title: 'Finance transaction entry',
      description: 'A Frontend contract screen for entering transactions and evidence before review workflow handoff.',
      titleField: 'Transaction',
      counterpart: 'Counterparty',
      amount: 'Amount',
      stage: 'Processing state',
      note: 'Evidence note',
      create: 'Add transaction',
      list: 'Company transactions',
      empty: 'No demo transactions are registered.',
      detail: 'Transaction detail',
    },
    demo: 'This demo entry is not saved to a server ledger.',
    select: 'View detail',
    currency: 'KRW',
  },
} satisfies Record<FrontendLocale, Record<string, unknown>>;

const stages = {
  SALES: ['NEW', 'QUALIFIED', 'PROPOSAL', 'WON'],
  FINANCE: ['DRAFT', 'SUBMITTED', 'APPROVED', 'POSTED'],
} satisfies Record<BusinessModule, readonly string[]>;

export function BusinessModuleWorkbench({ module }: BusinessModuleWorkbenchProps) {
  const { locale, setLocale } = useHandoffLocale();
  const brandWorkspace = useUiStore((state) => state.brandWorkspace);
  const [entries, setEntries] = useState<BusinessEntry[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [title, setTitle] = useState('');
  const [counterpart, setCounterpart] = useState('');
  const [amount, setAmount] = useState('');
  const [stage, setStage] = useState(stages[module][0]);
  const [note, setNote] = useState('');
  const [feedback, setFeedback] = useState<{
    kind: 'SIMULATED' | 'SUCCESS' | 'BLOCKED';
    message: string;
  } | null>(null);
  const localeCopy = copy[locale];
  const t = localeCopy[module];
  const boundary = getFrontendModuleBoundary(module, {
    locale,
    adapterReady: false,
  });
  const visibleEntries = useMemo(
    () => entries.filter((entry) => entry.companyId === brandWorkspace),
    [brandWorkspace, entries],
  );
  const selected =
    visibleEntries.find((entry) => entry.id === selectedId) ||
    visibleEntries[0];

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!title.trim() || !counterpart.trim() || !amount) return;

    const result = await executeFrontendMutation(boundary, {
      simulate: () => {
        const entry: BusinessEntry = {
          id: `demo-${module.toLowerCase()}-${globalThis.crypto?.randomUUID?.() || Date.now()}`,
          companyId: brandWorkspace,
          title: title.trim(),
          counterpart: counterpart.trim(),
          amount: Number(amount),
          stage,
          note: note.trim(),
        };
        setEntries((current) => [entry, ...current]);
        setSelectedId(entry.id);
        return entry;
      },
    });
    setFeedback({ kind: result.kind, message: result.message });
    if (result.kind === 'BLOCKED') return;
    setTitle('');
    setCounterpart('');
    setAmount('');
    setNote('');
  };

  const Icon = module === 'SALES' ? BriefcaseBusiness : CircleDollarSign;

  return (
    <section className="space-y-4 border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[0_16px_36px_rgba(25,45,82,.07)] sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-3xl">
          <p className="text-[10px] font-black tracking-[.18em] text-[#4e6fd8]">
            {t.eyebrow}
          </p>
          <h2 className="mt-1 text-xl font-black text-[var(--color-text-main)]">
            {t.title}
          </h2>
          <p className="mt-2 text-xs font-semibold leading-5 text-[var(--color-text-sub)]">
            {t.description}
          </p>
        </div>
        <HandoffLanguageToggle locale={locale} onChange={setLocale} />
      </div>

      <RuntimeCapabilityPanel boundary={boundary} compact />
      <div className="border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-bold text-amber-900">
        {localeCopy.demo}
      </div>
      {feedback && (
        <div
          role="status"
          className={`border px-4 py-3 text-xs font-bold ${
            feedback.kind === 'BLOCKED'
              ? 'border-red-200 bg-red-50 text-red-800'
              : 'border-amber-200 bg-amber-50 text-amber-900'
          }`}
        >
          {feedback.message}
        </div>
      )}

      <div className="grid gap-4 xl:grid-cols-[minmax(320px,.72fr)_minmax(0,1.28fr)]">
        <form
          onSubmit={(event) => void submit(event)}
          className="grid content-start gap-3 border border-[var(--color-border)] bg-[var(--color-bg)] p-4"
        >
          <label className="text-xs font-black text-[var(--color-text-sub)]">
            {t.titleField}
            <input
              required
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className="mt-1 min-h-11 w-full border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm font-semibold text-[var(--color-text-main)]"
            />
          </label>
          <label className="text-xs font-black text-[var(--color-text-sub)]">
            {t.counterpart}
            <input
              required
              value={counterpart}
              onChange={(event) => setCounterpart(event.target.value)}
              className="mt-1 min-h-11 w-full border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm font-semibold text-[var(--color-text-main)]"
            />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-xs font-black text-[var(--color-text-sub)]">
              {t.amount}
              <input
                required
                min="0"
                type="number"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                className="mt-1 min-h-11 w-full border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm font-semibold text-[var(--color-text-main)]"
              />
            </label>
            <label className="text-xs font-black text-[var(--color-text-sub)]">
              {t.stage}
              <select
                value={stage}
                onChange={(event) => setStage(event.target.value)}
                className="mt-1 min-h-11 w-full border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm font-semibold text-[var(--color-text-main)]"
              >
                {stages[module].map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </label>
          </div>
          <label className="text-xs font-black text-[var(--color-text-sub)]">
            {t.note}
            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              className="mt-1 min-h-24 w-full resize-y border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm font-semibold text-[var(--color-text-main)]"
            />
          </label>
          <button
            type="submit"
            className="inline-flex min-h-11 items-center justify-center gap-2 bg-[var(--color-primary)] px-4 text-sm font-black text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2"
          >
            <Plus className="h-4 w-4" />
            {t.create}
          </button>
        </form>

        <div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(240px,.8fr)_minmax(280px,1.2fr)]">
          <section className="border border-[var(--color-border)]">
            <h3 className="border-b border-[var(--color-border)] px-4 py-3 text-sm font-black text-[var(--color-text-main)]">
              {t.list}
            </h3>
            {!visibleEntries.length ? (
              <div className="p-8 text-center text-xs font-semibold text-[var(--color-text-sub)]">
                {t.empty}
              </div>
            ) : (
              <ul className="divide-y divide-[var(--color-border)]">
                {visibleEntries.map((entry) => (
                  <li key={entry.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(entry.id)}
                      className="flex min-h-16 w-full items-center justify-between gap-3 px-4 text-left hover:bg-[var(--color-bg)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--color-primary)]"
                    >
                      <span className="min-w-0">
                        <strong className="block truncate text-sm text-[var(--color-text-main)]">
                          {entry.title}
                        </strong>
                        <small className="mt-1 block truncate font-bold text-[var(--color-text-sub)]">
                          {entry.counterpart} · {entry.stage}
                        </small>
                      </span>
                      <ArrowRight className="h-4 w-4 shrink-0 text-[var(--color-text-sub)]" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="border border-[var(--color-border)] bg-[var(--color-bg)] p-4">
            <div className="flex items-center gap-2">
              <span className="flex h-10 w-10 items-center justify-center bg-[var(--color-surface)] text-[#4e6fd8]">
                <Icon className="h-5 w-5" />
              </span>
              <h3 className="text-sm font-black text-[var(--color-text-main)]">
                {t.detail}
              </h3>
            </div>
            {selected ? (
              <dl className="mt-5 grid gap-4 text-xs sm:grid-cols-2">
                <div>
                  <dt className="font-black text-[var(--color-text-sub)]">{t.titleField}</dt>
                  <dd className="mt-1 font-bold text-[var(--color-text-main)]">{selected.title}</dd>
                </div>
                <div>
                  <dt className="font-black text-[var(--color-text-sub)]">{t.counterpart}</dt>
                  <dd className="mt-1 font-bold text-[var(--color-text-main)]">{selected.counterpart}</dd>
                </div>
                <div>
                  <dt className="font-black text-[var(--color-text-sub)]">{t.amount}</dt>
                  <dd className="mt-1 font-bold text-[var(--color-text-main)]">
                    {selected.amount.toLocaleString()} {localeCopy.currency}
                  </dd>
                </div>
                <div>
                  <dt className="font-black text-[var(--color-text-sub)]">{t.stage}</dt>
                  <dd className="mt-1 font-bold text-[var(--color-text-main)]">{selected.stage}</dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="font-black text-[var(--color-text-sub)]">{t.note}</dt>
                  <dd className="mt-1 whitespace-pre-wrap font-bold text-[var(--color-text-main)]">
                    {selected.note || '-'}
                  </dd>
                </div>
              </dl>
            ) : (
              <p className="mt-8 text-center text-xs font-semibold text-[var(--color-text-sub)]">
                {localeCopy.select}
              </p>
            )}
          </section>
        </div>
      </div>
    </section>
  );
}
