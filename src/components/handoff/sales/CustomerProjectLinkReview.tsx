'use client';

import { AlertTriangle, Link2, PauseCircle, UserPlus, UserX } from 'lucide-react';

import { SemanticActionButton } from '@/components/ui/SemanticActionButton';
import type { SalesContact, SalesCustomer } from '@/lib/businessOperations';
import type { CustomerProjectLinkCandidate, CustomerProjectCandidateStatus } from '@/lib/customerProjectRelationship';

const copy = {
  ko: { title: '연결 검토 필요', empty: '검토할 고객·담당자 연결이 없습니다.', source: '접수 담당자', candidate: '기존 Contact 후보', link: '기존 Contact에 연결', create: '새 Contact 생성 요청', different: '다른 사람', hold: '보류' },
  vi: { title: 'Cần kiểm tra liên kết', empty: 'Không có liên kết khách hàng hoặc liên hệ cần kiểm tra.', source: 'Liên hệ tiếp nhận', candidate: 'Liên hệ hiện có', link: 'Liên kết liên hệ', create: 'Yêu cầu tạo liên hệ', different: 'Người khác', hold: 'Tạm giữ' },
  en: { title: 'Relationship review', empty: 'No customer or contact links require review.', source: 'Intake contact', candidate: 'Existing contact candidate', link: 'Link existing contact', create: 'Request new contact', different: 'Different person', hold: 'Put on hold' },
} as const;

export function CustomerProjectLinkReview({
  locale,
  candidates,
  customers,
  contacts,
  onLink,
  onStatus,
}: {
  locale: 'ko' | 'vi' | 'en';
  candidates: CustomerProjectLinkCandidate[];
  customers: SalesCustomer[];
  contacts: SalesContact[];
  onLink: (candidateId: string, contactId: string) => void;
  onStatus: (candidateId: string, status: CustomerProjectCandidateStatus) => void;
}) {
  const t = copy[locale];
  const review = candidates.filter((candidate) => candidate.status === 'REVIEW_REQUIRED');
  return <section className="border border-amber-300 bg-amber-50 p-5 shadow-[var(--cc-shadow-1)]">
    <header className="flex items-center gap-3"><AlertTriangle className="h-5 w-5 text-amber-700" /><div><h2 className="text-base font-black text-amber-950">{t.title}</h2><p className="mt-1 text-xs font-bold text-amber-800">{review.length}</p></div></header>
    {review.length ? <div className="mt-4 space-y-3">{review.map((candidate) => {
      const suggestedContacts = contacts.filter((contact) => candidate.suggestedContactIds.includes(contact.id));
      const suggestedCustomers = customers.filter((customer) => candidate.suggestedCustomerIds.includes(customer.id));
      const selectedContact = suggestedContacts[0];
      return <article key={candidate.id} className="grid gap-4 border border-amber-200 bg-white p-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] lg:items-center">
        <div><span className="text-[10px] font-black text-amber-700">{t.source}</span><strong className="mt-1 block text-sm">{candidate.snapshot.name || '-'}</strong><p className="mt-1 text-xs font-semibold text-slate-600">{candidate.snapshot.department || '-'} · {candidate.snapshot.email || candidate.snapshot.mobile || '-'}</p></div>
        <div><span className="text-[10px] font-black text-amber-700">{t.candidate}</span><strong className="mt-1 block text-sm">{selectedContact?.name ?? '-'}</strong><p className="mt-1 text-xs font-semibold text-slate-600">{suggestedCustomers[0]?.name ?? '-'} · {selectedContact?.email || selectedContact?.mobile || '-'}</p></div>
        <div className="flex flex-wrap gap-2 lg:max-w-[350px] lg:justify-end">
          <SemanticActionButton size="sm" variant="save" icon={<Link2 className="h-4 w-4" />} disabled={!selectedContact} disabledReason={t.candidate} onClick={() => selectedContact && onLink(candidate.id, selectedContact.id)}>{t.link}</SemanticActionButton>
          <SemanticActionButton size="sm" variant="add-resource" icon={<UserPlus className="h-4 w-4" />} onClick={() => onStatus(candidate.id, 'CREATE_CONTACT_REQUESTED')}>{t.create}</SemanticActionButton>
          <SemanticActionButton size="sm" variant="warning" icon={<UserX className="h-4 w-4" />} onClick={() => onStatus(candidate.id, 'DIFFERENT_PERSON')}>{t.different}</SemanticActionButton>
          <SemanticActionButton size="sm" variant="document" icon={<PauseCircle className="h-4 w-4" />} onClick={() => onStatus(candidate.id, 'ON_HOLD')}>{t.hold}</SemanticActionButton>
        </div>
      </article>;
    })}</div> : <p className="mt-4 border border-dashed border-amber-300 bg-white p-6 text-center text-sm font-bold text-amber-900">{t.empty}</p>}
  </section>;
}
