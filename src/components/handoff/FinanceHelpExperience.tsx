'use client';

import {
  BookOpenCheck,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  ListChecks,
  PlayCircle,
  ShieldCheck,
} from 'lucide-react';
import {
  type CSSProperties,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { ResponsiveDialogShell } from '@/components/ui/ResponsiveDialogShell';
import {
  ActionButtonGroup,
  SemanticActionButton,
} from '@/components/ui/SemanticActionButton';
import {
  financeGuidePreferenceKey,
  getFinanceGuideContent,
  type FinanceGuideLocale,
  type FinanceGuideView,
} from '@/lib/financeGuide';

interface FinanceHelpExperienceProps {
  locale: FinanceGuideLocale;
  companyId: string;
  userId: string;
  currentView: FinanceGuideView;
  onViewChange: (view: FinanceGuideView) => void;
}

interface TargetRect {
  top: number;
  right: number;
  bottom: number;
  left: number;
  width: number;
  height: number;
}

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

export function FinanceHelpExperience({
  locale,
  companyId,
  userId,
  currentView,
  onViewChange,
}: FinanceHelpExperienceProps) {
  const content = useMemo(() => getFinanceGuideContent(locale), [locale]);
  const preferenceKey = useMemo(
    () => financeGuidePreferenceKey(companyId, userId),
    [companyId, userId],
  );
  const [tourOpen, setTourOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<TargetRect | null>(null);
  const [viewport, setViewport] = useState({ width: 0, height: 0 });
  const nextButtonRef = useRef<HTMLButtonElement>(null);
  const step = content.steps[stepIndex] ?? content.steps[0];

  const remember = useCallback((value: 'completed' | 'dismissed') => {
    try {
      window.localStorage.setItem(preferenceKey, value);
    } catch {
      // Guide completion is an optional browser preference.
    }
  }, [preferenceKey]);

  const openTour = useCallback(() => {
    setHelpOpen(false);
    setStepIndex(0);
    setTourOpen(true);
  }, []);

  const closeTour = useCallback((value: 'completed' | 'dismissed') => {
    remember(value);
    setTourOpen(false);
    setTargetRect(null);
  }, [remember]);

  useEffect(() => {
    let alreadySeen = false;
    try {
      alreadySeen = Boolean(window.localStorage.getItem(preferenceKey));
    } catch {
      alreadySeen = true;
    }
    if (alreadySeen) return undefined;
    const timer = window.setTimeout(() => setTourOpen(true), 450);
    return () => window.clearTimeout(timer);
  }, [preferenceKey]);

  const refreshTarget = useCallback(() => {
    setViewport({ width: window.innerWidth, height: window.innerHeight });
    if (!tourOpen || !step) {
      setTargetRect(null);
      return;
    }
    const target = document.querySelector<HTMLElement>(`[data-finance-guide="${step.target}"]`);
    if (!target) {
      setTargetRect(null);
      return;
    }
    const bounds = target.getBoundingClientRect();
    const padding = 6;
    setTargetRect({
      top: Math.max(6, bounds.top - padding),
      right: Math.min(window.innerWidth - 6, bounds.right + padding),
      bottom: Math.min(window.innerHeight - 6, bounds.bottom + padding),
      left: Math.max(6, bounds.left - padding),
      width: Math.min(window.innerWidth - 12, bounds.width + padding * 2),
      height: Math.min(window.innerHeight - 12, bounds.height + padding * 2),
    });
  }, [step, tourOpen]);

  useEffect(() => {
    if (!tourOpen || !step) return undefined;
    if (step.view && step.view !== currentView) onViewChange(step.view);
    const timer = window.setTimeout(() => {
      const target = document.querySelector<HTMLElement>(`[data-finance-guide="${step.target}"]`);
      target?.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
      window.setTimeout(refreshTarget, 180);
      nextButtonRef.current?.focus({ preventScroll: true });
    }, 80);
    return () => window.clearTimeout(timer);
  }, [currentView, onViewChange, refreshTarget, step, tourOpen]);

  useEffect(() => {
    if (!tourOpen) return undefined;
    const handleViewport = () => refreshTarget();
    window.addEventListener('resize', handleViewport);
    window.addEventListener('scroll', handleViewport, true);
    return () => {
      window.removeEventListener('resize', handleViewport);
      window.removeEventListener('scroll', handleViewport, true);
    };
  }, [refreshTarget, tourOpen]);

  useEffect(() => {
    if (!tourOpen) return undefined;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeTour('dismissed');
      if (event.key === 'ArrowRight' && stepIndex < content.steps.length - 1) setStepIndex((value) => value + 1);
      if (event.key === 'ArrowLeft' && stepIndex > 0) setStepIndex((value) => value - 1);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [closeTour, content.steps.length, stepIndex, tourOpen]);

  const popoverStyle = useMemo<CSSProperties | undefined>(() => {
    if (!targetRect || viewport.width < 768) return undefined;
    const width = Math.min(410, viewport.width - 32);
    const topBelow = targetRect.bottom + 14;
    const top = topBelow + 330 <= viewport.height
      ? topBelow
      : Math.max(16, targetRect.top - 330);
    return {
      left: clamp(targetRect.left, 16, viewport.width - width - 16),
      top,
      width,
    };
  }, [targetRect, viewport]);

  const openWorkflow = (view: FinanceGuideView) => {
    setHelpOpen(false);
    onViewChange(view);
    window.setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 50);
  };

  return (
    <>
      <div data-finance-guide="help">
        <ActionButtonGroup label="Finance help actions" className="flex-nowrap">
          <SemanticActionButton variant="neutral" tooltip={content.tourButton} onClick={openTour}>
            <PlayCircle className="h-4 w-4" />
            <span className="hidden xl:inline">{content.tourButton}</span>
          </SemanticActionButton>
          <SemanticActionButton variant="view" tooltip={content.helpButton} onClick={() => setHelpOpen(true)}>
            <CircleHelp className="h-4 w-4" />
            <span className="hidden sm:inline">{content.helpButton}</span>
          </SemanticActionButton>
        </ActionButtonGroup>
      </div>

      {tourOpen && step && (
        <div className="fixed inset-0 z-[160]" aria-live="polite">
          {!targetRect && <div className="absolute inset-0 bg-slate-950/65 backdrop-blur-[1px]" />}
          {targetRect && (
            <div
              className="pointer-events-none fixed rounded-xl border-2 border-orange-400 shadow-[0_0_0_9999px_rgba(15,23,42,0.68),0_0_0_5px_rgba(251,146,60,0.25)] transition-all duration-200"
              style={{
                top: targetRect.top,
                left: targetRect.left,
                width: targetRect.width,
                height: targetRect.height,
              }}
            />
          )}
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="finance-guide-title"
            className="fixed bottom-3 left-3 right-3 max-h-[calc(100dvh-1.5rem)] overflow-y-auto rounded-2xl border border-orange-200 bg-white p-5 text-slate-950 shadow-2xl sm:p-6 md:right-auto"
            style={popoverStyle}
          >
            <div className="flex items-center justify-between gap-4">
              <span className="rounded-full bg-orange-100 px-3 py-1 text-[11px] font-black text-orange-800">
                {content.stepLabel} {stepIndex + 1} / {content.steps.length}
              </span>
              <button type="button" onClick={() => closeTour('dismissed')} className="min-h-10 px-2 text-xs font-black text-slate-500 underline-offset-4 hover:text-slate-950 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500">
                {content.skip}
              </button>
            </div>
            <h2 id="finance-guide-title" className="mt-4 text-xl font-black leading-snug">{step.title}</h2>
            <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">{step.description}</p>
            <ul className="mt-4 space-y-2">
              {step.checklist.map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm font-bold leading-5 text-slate-800">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                  {item}
                </li>
              ))}
            </ul>
            <div className="mt-5 flex gap-1.5" aria-hidden="true">
              {content.steps.map((item, index) => (
                <span key={item.id} className={`h-1.5 flex-1 rounded-full ${index <= stepIndex ? 'bg-orange-500' : 'bg-slate-200'}`} />
              ))}
            </div>
            <ActionButtonGroup label="Finance guide navigation" className="mt-5 justify-between">
              <SemanticActionButton variant="neutral" disabled={stepIndex === 0} disabledReason={content.previous} onClick={() => setStepIndex((value) => Math.max(0, value - 1))}>
                <ChevronLeft className="h-4 w-4" /> {content.previous}
              </SemanticActionButton>
              {stepIndex === content.steps.length - 1 ? (
                <SemanticActionButton ref={nextButtonRef} variant="success" onClick={() => closeTour('completed')}>
                  <CheckCircle2 className="h-4 w-4" /> {content.finish}
                </SemanticActionButton>
              ) : (
                <SemanticActionButton ref={nextButtonRef} variant="primary" onClick={() => setStepIndex((value) => Math.min(content.steps.length - 1, value + 1))}>
                  {content.next} <ChevronRight className="h-4 w-4" />
                </SemanticActionButton>
              )}
            </ActionButtonGroup>
          </section>
        </div>
      )}

      {helpOpen && (
        <ResponsiveDialogShell
          eyebrow="Finance help center"
          title={content.helpTitle}
          description={content.helpDescription}
          onClose={() => setHelpOpen(false)}
          widthClassName="sm:max-w-5xl"
          footer={(
            <ActionButtonGroup label="Finance help footer" className="justify-between">
              <SemanticActionButton variant="view" onClick={openTour}>
                <PlayCircle className="h-4 w-4" /> {content.restart}
              </SemanticActionButton>
              <SemanticActionButton variant="neutral" onClick={() => setHelpOpen(false)}>{content.close}</SemanticActionButton>
            </ActionButtonGroup>
          )}
        >
          <div className="space-y-8">
            <section>
              <h3 className="flex items-center gap-2 text-base font-black"><ListChecks className="h-5 w-5 text-orange-600" />{content.workflowTitle}</h3>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {content.workflows.map((workflow) => (
                  <article key={workflow.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                    <h4 className="text-sm font-black text-slate-950">{workflow.title}</h4>
                    <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">{workflow.description}</p>
                    <ol className="mt-3 space-y-1.5">
                      {workflow.steps.map((item, index) => (
                        <li key={item} className="flex gap-2 text-xs font-bold leading-5 text-slate-700">
                          <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-orange-100 text-[10px] text-orange-800">{index + 1}</span>
                          {item}
                        </li>
                      ))}
                    </ol>
                    <SemanticActionButton variant="neutral" className="mt-4 w-full justify-center" onClick={() => openWorkflow(workflow.view)}>
                      {content.openWorkflow} <ChevronRight className="h-4 w-4" />
                    </SemanticActionButton>
                  </article>
                ))}
              </div>
            </section>

            <section>
              <h3 className="flex items-center gap-2 text-base font-black"><BookOpenCheck className="h-5 w-5 text-blue-600" />{content.glossaryTitle}</h3>
              <dl className="mt-4 grid gap-x-6 gap-y-3 sm:grid-cols-2">
                {content.glossary.map((item) => (
                  <div key={item.term} className="border-b border-slate-200 pb-3">
                    <dt className="text-sm font-black text-slate-950">{item.term}</dt>
                    <dd className="mt-1 text-xs font-semibold leading-5 text-slate-600">{item.meaning}</dd>
                  </div>
                ))}
              </dl>
            </section>

            <section className="rounded-xl border border-amber-200 bg-amber-50 p-5">
              <h3 className="flex items-center gap-2 text-base font-black text-amber-950"><ShieldCheck className="h-5 w-5" />{content.safetyTitle}</h3>
              <ul className="mt-3 space-y-2">
                {content.safetyItems.map((item) => (
                  <li key={item} className="flex gap-2 text-sm font-bold leading-6 text-amber-950"><CheckCircle2 className="mt-1 h-4 w-4 shrink-0" />{item}</li>
                ))}
              </ul>
            </section>
          </div>
        </ResponsiveDialogShell>
      )}
    </>
  );
}
