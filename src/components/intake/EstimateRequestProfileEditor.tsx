'use client';

import { useMemo, useState } from 'react';
import { AlertTriangle, Building2, ClipboardPen, Save, UserRound } from 'lucide-react';
import { InputHistoryInput } from '@/components/ui/InputHistoryInput';
import { ProjectExecutionUnitSelector } from '@/components/intake/ProjectExecutionUnitSelector';
import {
  buildEstimateRequestProfile,
  missingEstimateProfileFields,
  type EstimateRequestProfile,
} from '@/lib/estimateRequestProfile';
import { useTranslationStore } from '@/store/translationStore';
import type { EstimateRequest, ProjectExecutionUnitId } from '@/types/models';

type Props = {
  request: EstimateRequest;
  disabled: boolean;
  busy: boolean;
  onSave: (updates: Partial<EstimateRequest>) => Promise<void>;
};

const sectionClass = 'scroll-mt-24 border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[0_8px_22px_rgba(15,23,42,.05)] sm:p-5';
const inputClass = 'min-h-10 w-full border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] disabled:opacity-60';
const requiredClass = `${inputClass} bg-amber-50/80 border-amber-300`;

const LABELS: Record<keyof EstimateRequestProfile, string> = {
  estimateRequestId: '의뢰 ID', requestNo: '의뢰번호', projectName: '프로젝트명', projectNo: '프로젝트번호',
  vendor: '거래처/업체', client: '발주처', contact: '담당자', contactDepartment: '담당부서', phone: '전화', email: '이메일',
  workCategory: '업무구분', executionType: '입찰/실행', usage: '건물용도', areaM2: '연면적 m²', areaPy: '연면적 평',
  buildingCount: '동수', basementFloors: '지하층', groundFloors: '지상층', floors: '층수 메모', bidDate: '입찰일',
  firstDelivery: '납기', scope: '업무범위', unitWork: '단가작업여부', estimateType: '견적종류', targetUnitIds: '담당부서', primaryUnitId: '주관부서',
};

const STEPS = [
  ['01', '프로젝트 정보'], ['02', '담당자 및 연락처 정보'], ['03', '기본정보 수정'], ['04', '의뢰 결과 확인'],
  ['05', '상담 및 기록'], ['06', '첨부자료'], ['07', '변경이력'],
];

export function EstimateRequestProfileEditor({ request, disabled, busy, onSave }: Props) {
  const language = useTranslationStore((state) => state.settings.uiLanguage);
  const [profile, setProfile] = useState(() => buildEstimateRequestProfile(request));
  const missing = useMemo(() => missingEstimateProfileFields(profile), [profile]);

  const set = <K extends keyof EstimateRequestProfile>(field: K, value: EstimateRequestProfile[K]) => {
    setProfile((current) => ({ ...current, [field]: value }));
  };

  const focusFirstMissing = () => {
    const first = missing[0];
    document.querySelector<HTMLElement>(`[data-estimate-field="${first}"]`)?.focus();
  };

  const save = async () => {
    if (missing.length) {
      focusFirstMissing();
      return;
    }
    await onSave({
      projectName: profile.projectName, projectNo: profile.projectNo, company: profile.vendor, client: profile.client,
      contact: profile.contact, contactDepartment: profile.contactDepartment, phone: profile.phone, email: profile.email,
      workCategory: profile.workCategory, executionType: profile.executionType, usage: profile.usage, areaM2: profile.areaM2,
      areaPy: profile.areaPy, buildingCount: profile.buildingCount, basementFloors: profile.basementFloors,
      groundFloors: profile.groundFloors, floors: profile.floors, bidDate: profile.bidDate, firstDelivery: profile.firstDelivery,
      scope: profile.scope, unitWork: profile.unitWork, estimateType: profile.estimateType,
      targetUnitIds: profile.targetUnitIds, primaryUnitId: profile.primaryUnitId,
    });
  };

  return <>
    <nav aria-label="견적 의뢰 상세 단계" className="sticky top-0 z-20 grid grid-cols-2 gap-2 border-y bg-[var(--color-bg)]/95 py-3 backdrop-blur sm:grid-cols-4 xl:grid-cols-7">
      {STEPS.map(([number, label]) => <button key={number} type="button" onClick={() => document.getElementById(`estimate-step-${number}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })} className="min-h-12 border border-[var(--color-border)] bg-[var(--color-surface)] px-2 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]">
        <span className="block text-[10px] font-black text-[var(--color-primary)]">STEP {number}</span><span className="text-xs font-bold">{label}</span>
      </button>)}
    </nav>

    {missing.length > 0 && <button type="button" onClick={focusFirstMissing} className="flex w-full items-center gap-3 border border-amber-300 bg-amber-50 px-4 py-3 text-left text-sm text-amber-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500">
      <AlertTriangle className="size-5 shrink-0" /><span><strong>필수 {missing.length}개 누락</strong><span className="ml-2">{missing.map((field) => LABELS[field]).join(', ')}</span></span>
    </button>}

    <section id="estimate-step-01" className={sectionClass}>
      <SectionTitle number="01" icon={Building2} title="프로젝트 정보" description="견적서·DB·메일 초안이 함께 사용하는 Canonical 정보입니다." />
      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <ProfileField label="프로젝트명" required value={profile.projectName} onChange={(value) => set('projectName', value)} field="projectName" />
        <ProfileField label="프로젝트번호" value={profile.projectNo} onChange={(value) => set('projectNo', value)} field="projectNo" />
        <MemoryField label="거래처/업체" required value={profile.vendor} onChange={(value) => set('vendor', value)} field="vendor" />
        <ProfileField label="발주처" required value={profile.client} onChange={(value) => set('client', value)} field="client" />
        <MemoryField label="업무구분" required value={profile.workCategory} onChange={(value) => set('workCategory', value)} field="workCategory" />
        <ProfileField label="입찰/실행" value={profile.executionType} onChange={(value) => set('executionType', value)} field="executionType" />
        <MemoryField label="건물용도" required value={profile.usage} onChange={(value) => set('usage', value)} field="usage" />
        <ProfileField label="연면적 m²" value={profile.areaM2} onChange={(value) => set('areaM2', value)} field="areaM2" inputMode="decimal" />
        <ProfileField label="연면적 평" value={profile.areaPy} onChange={(value) => set('areaPy', value)} field="areaPy" inputMode="decimal" />
        <ProfileField label="동수" value={profile.buildingCount} onChange={(value) => set('buildingCount', value)} field="buildingCount" />
        <ProfileField label="지하층" value={profile.basementFloors} onChange={(value) => set('basementFloors', value)} field="basementFloors" />
        <ProfileField label="지상층" value={profile.groundFloors} onChange={(value) => set('groundFloors', value)} field="groundFloors" />
        <ProfileField label="층수 메모" value={profile.floors} onChange={(value) => set('floors', value)} field="floors" />
        <ProfileField label="입찰일" value={profile.bidDate} onChange={(value) => set('bidDate', value)} field="bidDate" type="date" />
        <ProfileField label="납기" required value={profile.firstDelivery} onChange={(value) => set('firstDelivery', value)} field="firstDelivery" type="date" />
        <MemoryField label="단가작업여부" value={profile.unitWork} onChange={(value) => set('unitWork', value)} field="unitWork" />
        <MemoryField label="견적종류" value={profile.estimateType} onChange={(value) => set('estimateType', value)} field="estimateType" />
        <label className="text-sm sm:col-span-2 xl:col-span-4"><span className="mb-1 block font-bold">업무범위 <b className="text-red-600">필수</b></span><textarea data-estimate-field="scope" rows={3} value={profile.scope} onChange={(event) => set('scope', event.target.value)} className={`${requiredClass} py-2`} /></label>
        <div data-estimate-field="targetUnitIds" tabIndex={-1} className="sm:col-span-2 xl:col-span-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]">
          <ProjectExecutionUnitSelector value={profile.targetUnitIds} primaryUnitId={profile.primaryUnitId} disabled={disabled} onChange={(targetUnitIds: ProjectExecutionUnitId[], primaryUnitId) => setProfile((current) => ({ ...current, targetUnitIds, primaryUnitId }))} />
        </div>
      </div>
    </section>

    <section id="estimate-step-02" className={sectionClass}>
      <SectionTitle number="02" icon={UserRound} title="담당자 및 연락처 정보" description="개인정보 항목에는 입력기억을 적용하지 않습니다." />
      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <ProfileField label="담당자" value={profile.contact} onChange={(value) => set('contact', value)} field="contact" />
        <ProfileField label="부서/직급" value={profile.contactDepartment} onChange={(value) => set('contactDepartment', value)} field="contactDepartment" />
        <ProfileField label="전화" value={profile.phone} onChange={(value) => set('phone', value)} field="phone" />
        <ProfileField label="이메일" value={profile.email} onChange={(value) => set('email', value)} field="email" type="email" />
      </div>
    </section>

    <section id="estimate-step-03" className={sectionClass}>
      <SectionTitle number="03" icon={ClipboardPen} title="기본정보 수정" description="저장하면 DRAFT 견적서의 자동연결 Cell만 동기화됩니다." />
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <ReadOnly label="의뢰번호" value={profile.requestNo} /><ReadOnly label="의뢰상태" value={request.status} /><ReadOnly label="버전" value={`v${request.version}`} />
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t pt-4">
        <p className="text-xs text-[var(--color-text-sub)]">{language === 'vi' ? 'Ô màu vàng nhạt là trường bắt buộc.' : '연한 노란색 입력칸은 필수입니다.'}</p>
        <button type="button" onClick={() => void save()} disabled={disabled || busy || missing.length > 0} className="inline-flex min-h-10 items-center gap-2 bg-[var(--color-primary)] px-4 text-sm font-bold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] disabled:opacity-45"><Save className="size-4" />기본정보 저장</button>
      </div>
    </section>
  </>;
}

function SectionTitle({ number, icon: Icon, title, description }: { number: string; icon: typeof Building2; title: string; description: string }) {
  return <div className="flex items-start gap-3"><span className="grid size-10 shrink-0 place-items-center bg-orange-50 text-[var(--color-primary)]"><Icon className="size-5" /></span><div><p className="text-[10px] font-black tracking-[.12em] text-[var(--color-primary)]">STEP {number}</p><h3 className="text-base font-black">{title}</h3><p className="mt-1 text-xs text-[var(--color-text-sub)]">{description}</p></div></div>;
}

function ProfileField({ label, value, onChange, field, required = false, type = 'text', inputMode }: { label: string; value: string; onChange: (value: string) => void; field: keyof EstimateRequestProfile; required?: boolean; type?: string; inputMode?: 'decimal' }) {
  return <label className="text-sm"><span className="mb-1 block font-bold">{label} {required && <b className="text-red-600">필수</b>}</span><input data-estimate-field={field} type={type} inputMode={inputMode} value={value} onChange={(event) => onChange(event.target.value)} className={required ? requiredClass : inputClass} /></label>;
}

function MemoryField({ label, value, onChange, field, required = false }: { label: string; value: string; onChange: (value: string) => void; field: 'vendor' | 'workCategory' | 'usage' | 'unitWork' | 'estimateType'; required?: boolean }) {
  return <label className="text-sm"><span className="mb-1 block font-bold">{label} {required && <b className="text-red-600">필수</b>}</span><InputHistoryInput data-estimate-field={field} moduleKey="estimate-request" fieldKey={field} value={value} onChange={onChange} className={required ? requiredClass : inputClass} /></label>;
}

function ReadOnly({ label, value }: { label: string; value: string }) {
  return <div className="border-b py-2 text-sm"><span className="block text-xs font-bold text-[var(--color-text-sub)]">{label}</span><strong className="mt-1 block">{value || '-'}</strong></div>;
}
