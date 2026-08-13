'use client';

import Link from 'next/link';
import { ArrowUpRight, Database } from 'lucide-react';
import type { AssistantCitation, AssistantLocale } from './assistantModel';
import { assistantCopy } from './assistantCopy';

export function AssistantCitationList({ citations, locale }: { citations: AssistantCitation[]; locale: AssistantLocale }) {
  if (!citations.length) return null;
  const copy = assistantCopy(locale);
  return (
    <section className="mt-3 border-t border-slate-200 pt-3" aria-label={`${copy.source} ${citations.length}`}>
      <p className="mb-2 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[.12em] text-slate-500"><Database className="h-3.5 w-3.5" />{copy.source} {citations.length}</p>
      <div className="flex flex-wrap gap-2">
        {citations.map((citation) => (
          <Link key={citation.id} href={citation.href} title={citation.excerpt || citation.label} className="group inline-flex min-h-9 max-w-full items-center gap-2 rounded-lg border border-indigo-200 bg-indigo-50 px-2.5 py-1.5 text-left text-[11px] font-bold text-indigo-950 transition hover:border-indigo-400 hover:bg-indigo-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500">
            <span className="truncate">{citation.label}</span><ArrowUpRight className="h-3.5 w-3.5 shrink-0 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </Link>
        ))}
      </div>
    </section>
  );
}
